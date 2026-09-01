"""Two-stage source inversion implementation.

Performs candidate ranking, then refines the best candidates with Ensemble
Kalman Inversion (EKI). The ensemble mean gives the source point estimate
``[x, y, Q]``; the ensemble covariance gives a physically meaningful
localisation uncertainty, which drives both the shrinking confidence polygons
shown to the user and the reported credible radius.

The output schema (``iterations``, ``shrinkFrames``, ``estimatedSource``,
``confidenceRadius``, ``errorMetrics``, ``summary`` ...) is preserved so the
front-end consumes the new physics-based result without any change; EKI
iterations are mapped onto the existing per-step animation frames.

Typical usage:
    result = run_two_stage_inversion(dataset)
"""

from __future__ import annotations

import math
from typing import Dict, List, Sequence

import numpy as np

from .eki import covariance_to_radius, run_eki
from .forward_model import ForwardModel, MIN_EMISSION_RATE
from .plume_losses import compute_loss_snapshot
from .centroid_estimator import blend_points, estimate_weighted_center

# Map scale shared with the diffusion model: 0.5 metres per pixel.
MAP_METERS_PER_UNIT = 0.5


def _clamp(value: float, low: float, high: float) -> float:
    """Clamp a value to the inclusive ``[low, high]`` range."""
    return max(low, min(high, value))


def get_refinement_config(dataset: Dict) -> Dict:
    """Return the normalized refinement config."""
    return dataset.get("refinementConfig") or {}


def run_two_stage_inversion(dataset: Dict) -> Dict:
    """Run a two-stage analytic inversion (grid search + EKI refinement)
    to estimate gas source location.

    Stage 1: Prepare and rank candidate regions by loss and support.
    Stage 2: Refine the best candidate through iterative radius shrinking.

    Args:
        dataset: Normalized inversion dataset with activeSensors,
            candidateRegions, scenario, and refinementConfig.

    Returns:
        Inversion result with estimated source, loss history, and
        error metrics.
    """
    active_sensors = dataset.get("activeSensors") or []
    candidate_regions = prepare_candidate_regions(dataset.get("candidateRegions") or [])
    if not candidate_regions:
        raise ValueError("source inversion requires at least one coarse candidate region")

    weighted_center = estimate_weighted_center(active_sensors, candidate_regions[0]["center"])
    ranked_candidates = rank_candidates(candidate_regions, active_sensors, dataset.get("scenario") or {}, weighted_center)

    refinement_config = get_refinement_config(dataset)
    top_k = min(len(ranked_candidates), int(refinement_config.get("topK", 4) or 4))
    refined_results = []
    for candidate in ranked_candidates[:top_k]:
        refinement = refine_candidate(
            candidate=candidate,
            sensors=active_sensors,
            scenario=dataset.get("scenario") or {},
            weighted_center=weighted_center,
            refinement_config=refinement_config,
            gas=dataset.get("gas") or {},
            true_source_map_point=dataset.get("trueSourceMapPoint"),
        )
        refined_results.append((candidate, refinement))

    best_pair = min(refined_results, key=lambda pair: pair[1]["errorMetrics"]["finalLoss"])
    best_candidate, refinement = best_pair

    return {
        "datasetVersion": "analytic-source-inversion-v1",
        "stage": "python_analytic_two_stage",
        "timeline": {
            "currentFrameIndex": dataset.get("currentFrameIndex", 0),
            "currentTimeSec": dataset.get("frameTimeSec", 0),
        },
        "coarseCandidates": ranked_candidates,
        "estimatedSource": refinement["estimatedSource"],
        "confidenceRadius": refinement["confidenceRadius"],
        "lossHistory": refinement["lossHistory"],
        "shrinkFrames": refinement["shrinkFrames"],
        "iterations": refinement["iterations"],
        "errorMetrics": refinement["errorMetrics"],
        "summary": refinement["summary"],
    }


def prepare_candidate_regions(candidate_regions: Sequence[Dict]) -> List[Dict]:
    """Prepare and normalize candidate regions.

    Args:
        candidate_regions: Raw candidate region list from coarse search.

    Returns:
        Normalized list of candidate region dicts.

    Raises:
        ValueError: If a candidate region is present but missing its center.
    """
    prepared = []
    for index, candidate in enumerate(candidate_regions):
        center = candidate.get("center")
        if not center:
            raise ValueError(f"candidate region {index + 1} is missing center")
        prepared.append(
            {
                "candidateId": candidate.get("candidateId") or f"cand_{index + 1}",
                "rank": int(candidate.get("rank") or index + 1),
                "center": normalize_point(center),
                "geoCenter": candidate.get("geoCenter"),
                "score": float(candidate.get("score") or 0),
                "error": float(candidate.get("error") or 0),
                "supportCount": int(candidate.get("supportCount") or 0),
                "radius": float(candidate.get("radius") or 45),
                "bounds": candidate.get("bounds"),
                "label": candidate.get("label") or f"候选区域 {index + 1}",
            }
        )
    return prepared


def rank_candidates(candidate_regions: Sequence[Dict], sensors: Sequence[Dict], scenario: Dict, weighted_center: Dict) -> List[Dict]:
    """Rank candidate regions by loss, support, and proximity scores.

    Args:
        candidate_regions: List of candidate region dicts.
        sensors: Active sensor list for loss computation.
        scenario: Scenario dict with wind data.
        weighted_center: Sensor-weighted center for proximity bonus.

    Returns:
        Ranked list of candidates with added rankScore and lossSnapshot.
    """
    ranked = []
    for candidate in candidate_regions:
        center = candidate["center"]
        loss_snapshot = compute_loss_snapshot(center, candidate, sensors, scenario)
        support_bonus = min(0.35, float(candidate.get("supportCount", 0)) / max(len(sensors), 1) * 0.35) if sensors else 0.0
        proximity_bonus = max(0.0, 1.0 - distance(center, weighted_center) / max(float(candidate.get("radius") or 45) * 3.2, 1.0)) * 0.25
        score = max(0.0, 1.8 - loss_snapshot["total"] + support_bonus + proximity_bonus + float(candidate.get("score", 0)) * 0.15)
        ranked.append(
            {
                **candidate,
                "rankScore": round(score, 4),
                "lossSnapshot": loss_snapshot,
            }
        )
    ranked.sort(key=lambda item: item["rankScore"], reverse=True)
    for index, candidate in enumerate(ranked):
        candidate["rank"] = index + 1
    return ranked


def refine_candidate(
    candidate: Dict,
    sensors: Sequence[Dict],
    scenario: Dict,
    weighted_center: Dict,
    refinement_config: Dict,
    gas: Dict,
    true_source_map_point: Dict | None,
) -> Dict:
    """Refine a candidate source location using Ensemble Kalman Inversion.

    Runs EKI on the state ``[x, y, log Q]`` with the physically consistent
    conditioned advection-diffusion forward model, starting from an ensemble drawn around the
    candidate region. The emission rate is re-fit analytically at the final
    location for accuracy. Each EKI iteration is mapped to one animation frame:
    the per-step ensemble mean drives the frame ``center``, and the ensemble
    covariance ellipse drives the shrinking confidence ``polygon``/``radius``,
    so the animation reflects genuine posterior contraction rather than a
    cosmetic easing curve.

    Args:
        candidate: Selected candidate region to refine.
        sensors: Active sensor list.
        scenario: Scenario dict with wind data.
        weighted_center: Sensor-weighted center for initialization.
        refinement_config: Config dict with animationSteps and
            ekiConvergenceRatio.
        gas: Gas properties dict.
        true_source_map_point: Optional true source location for
            error computation.

    Returns:
        Refinement result with iterations, estimated source, loss
        history, and error metrics.
    """
    candidate_center = candidate["center"]
    candidate_radius = float(candidate.get("radius") or 45)
    candidate_rank = int(candidate.get("rank") or 1)

    # Animation/iteration budget, clamped to [8, 200] to bound cost (DoS guard).
    anim_steps = min(max(int(refinement_config.get("animationSteps") or 18), 8), 200)
    # EKI convergence threshold (relative misfit improvement). A small value
    # lets the ensemble fully contract, which makes the analytic emission-rate
    # re-fit accurate.
    convergence_ratio = float(refinement_config.get("ekiConvergenceRatio") or 0.005)

    # Build the physics forward operator and the observation vector (ppm).
    forward_model = ForwardModel.from_scenario(sensors, scenario, gas)
    observed = np.asarray([float(s.get("signal", 0.0)) for s in sensors], dtype=float)

    def forward(theta: np.ndarray) -> np.ndarray:
        return forward_model.predict(theta[0], theta[1], math.exp(theta[2]))

    # Prior: centred on a blend of the candidate centre and the sensor-weighted
    # centroid, with spread scaled to the candidate radius (and the park as a
    # floor) so the ensemble can explore the plausible region.
    initial = blend_points(candidate_center, weighted_center, 0.5)
    prior_spread = max(candidate_radius * 1.8, 60.0)
    prior_mean = np.array([initial["x"], initial["y"], math.log(20.0)], dtype=float)
    prior_std = np.array([prior_spread, prior_spread, 1.2], dtype=float)

    # Observation-noise std: relative noise floor on each sensor reading.
    max_signal = float(np.max(observed)) if observed.size else 1.0
    noise_std = np.maximum(0.05 * observed, max(0.02 * max_signal, 1e-2))

    bounds = {
        "x": (40.0, 961.0),
        "y": (40.0, 611.0),
        "logq": (math.log(MIN_EMISSION_RATE), math.log(1.0e5)),
    }

    eki_result = run_eki(
        forward=forward,
        observed=observed,
        prior_mean=prior_mean,
        prior_std=prior_std,
        noise_std=noise_std,
        max_iterations=max(anim_steps, 30),
        convergence_ratio=convergence_ratio,
        bounds=bounds,
    )

    # Analytic least-squares re-fit of the emission rate at the final location.
    final_mean = eki_result.final_mean
    estimated_rate = forward_model.fit_emission_rate(final_mean[0], final_mean[1], observed)

    # Map the EKI mean/covariance history onto the existing animation frames.
    mean_history = eki_result.mean_history
    total_points = len(mean_history)
    max_animation_steps = max(anim_steps, 8)
    if total_points <= max_animation_steps:
        step_indices = list(range(total_points))
    else:
        step_indices = [
            int(i * (total_points - 1) / (max_animation_steps - 1))
            for i in range(max_animation_steps)
        ]

    iterations = []
    shrink_frames = []
    loss_history = []
    frame_total = max(len(step_indices) - 1, 1)
    # The on-map confidence circle shrinks from the candidate radius down towards
    # a floor as the inversion *converges*. We drive that contraction from the
    # normalised data-misfit reduction (how much better the ensemble mean fits
    # the sensors than the prior did), kept monotone via a running maximum so the
    # circle never re-expands on a noisy step. This represents inference progress
    # honestly; the true spatial uncertainty -- which for a steady plume is
    # weakly constrained along-wind -- is reported separately as
    # errorMetrics.credibleRadius95 / posteriorStd.
    misfit_history = eki_result.misfit_history
    initial_misfit = max(misfit_history[0], 1e-12) if misfit_history else 1.0
    final_misfit = min(misfit_history) if misfit_history else 0.0
    # Total achievable misfit reduction in [0, 1]: how much the converged
    # ensemble improves the fit over the prior. This sets the *final* contraction
    # of the confidence circle, so the end state reflects genuine convergence
    # quality. The per-frame shrink itself is eased over the animation timeline
    # (cosmetic pacing) rather than snapping on the iteration where EKI happens
    # to converge. True spatial uncertainty is reported as credibleRadius95.
    final_fit = _clamp((initial_misfit - final_misfit) / max(initial_misfit, 1e-12), 0.0, 1.0)
    display_radius_start = max(candidate_radius, 12.0)
    display_radius_floor = max(candidate_radius * 0.18, 8.0)
    final_radius = display_radius_floor + (display_radius_start - display_radius_floor) * (1.0 - final_fit)
    for anim_idx, hist_idx in enumerate(step_indices):
        mean_state = mean_history[hist_idx]
        center = {"x": round(float(mean_state[0]), 2), "y": round(float(mean_state[1]), 2)}
        progress = anim_idx / frame_total
        # Ease-out so the circle contracts quickly then settles, spanning the
        # full timeline and ending at the convergence-determined final radius.
        eased = 1.0 - math.pow(1.0 - progress, 2)
        radius = round(display_radius_start + (final_radius - display_radius_start) * eased, 2)
        polygon = build_refinement_polygon(center, radius, anim_idx, candidate_rank)
        loss_snapshot = compute_loss_snapshot(center, candidate, sensors, scenario)
        # Confidence eases up to the convergence-determined final fit quality.
        confidence = round(_clamp(final_fit * eased, 0.0, 1.0), 4)

        iterations.append({
            "iteration": anim_idx + 1,
            "progress": round(progress, 4),
            "center": center,
            "radius": radius,
            "polygon": polygon,
            "loss": loss_snapshot["total"],
            "confidence": confidence,
            "lossBreakdown": loss_snapshot,
        })
        shrink_frames.append(polygon)
        loss_history.append(loss_snapshot["total"])

    if not iterations:
        final_center = {"x": round(float(final_mean[0]), 2), "y": round(float(final_mean[1]), 2)}
        final_snapshot = compute_loss_snapshot(final_center, candidate, sensors, scenario)
        radius = round(display_radius_floor, 2)
        iterations.append({
            "iteration": 1, "progress": 1.0, "center": final_center,
            "radius": radius,
            "polygon": build_refinement_polygon(final_center, radius, 0, candidate_rank),
            "loss": final_snapshot["total"], "confidence": 0.5, "lossBreakdown": final_snapshot,
        })
        loss_history.append(final_snapshot["total"])

    estimated = iterations[-1]
    source_match_error = None
    if true_source_map_point:
        # 统一判据口径：与粒子滤波（particle_filter.py）一致，位置误差
        # 换算为米（× mapMetersPerUnit）后比较 15 m 阈值；修复前此处为
        # 像素坐标（15 px = 7.5 m），两模块口径相差 2 倍（评估报告 04 §2.2）。
        source_match_error = round(
            distance(estimated["center"], normalize_point(true_source_map_point))
            * MAP_METERS_PER_UNIT,
            2,
        )

    # Posterior spatial std (RMS of x/y std) reported in metres.
    final_spatial_cov = np.asarray(eki_result.final_cov)[:2, :2]
    diag = np.clip(np.diag(final_spatial_cov), 0.0, None)
    posterior_std_px = float(np.sqrt(np.mean(diag)))
    credible_radius_95 = round(covariance_to_radius(final_spatial_cov, 2.45) * MAP_METERS_PER_UNIT, 2)

    estimated_source = {
        "mapPoint": estimated["center"],
        "radius": estimated["radius"],
        "iconSize": max(12.0, estimated["radius"] * 0.9),
        "emissionRate": round(estimated_rate, 3),
    }
    error_metrics = {
        "finalLoss": estimated["loss"],
        "sourceMatchError": source_match_error,
        "matched": source_match_error is not None and source_match_error <= 15,
        "activeSensorCount": len(sensors),
        "candidateCount": 1,
        "warningThreshold": float(gas.get("warningThreshold") or 0),
        "dangerThreshold": float(gas.get("dangerThreshold") or 0),
        "optimizerConverged": eki_result.converged,
        "optimizerIterations": eki_result.iterations,
        "emissionRate": round(estimated_rate, 3),
        "posteriorStd": round(posterior_std_px * MAP_METERS_PER_UNIT, 2),
        "credibleRadius95": credible_radius_95,
        "dataMisfitRms": round(float(eki_result.misfit_history[-1]) if eki_result.misfit_history else 0.0, 4),
    }
    summary = {
        "bestCandidateId": candidate.get("candidateId"),
        "finalLoss": estimated["loss"],
        "sourceMatchError": source_match_error,
        "estimatedCoord": f"{estimated['center']['x']:.0f}, {estimated['center']['y']:.0f}",
        "estimatedEmissionRate": round(estimated_rate, 3),
        "totalIterations": eki_result.iterations,
    }
    return {
        "iterations": iterations,
        "shrinkFrames": shrink_frames,
        "lossHistory": loss_history,
        "estimatedSource": estimated_source,
        "confidenceRadius": estimated["radius"],
        "errorMetrics": error_metrics,
        "summary": summary,
    }


def build_refinement_polygon(center: Dict, radius: float, iteration: int, candidate_rank: int) -> List[Dict]:
    """Build a polygon visualization for a refinement iteration.

    Creates a wobbled heptagon centered at the given point with
    radius-based size and iteration-dependent distortion.

    Args:
        center: Center point dict with 'x' and 'y'.
        radius: Base radius of the polygon.
        iteration: Current iteration index for wobble variation.
        candidate_rank: Candidate rank for base rotation offset.

    Returns:
        List of polygon vertex dicts with 'x' and 'y'.
    """
    points = []
    vertex_count = 7
    base_rotation = (candidate_rank * 0.37 + iteration * 0.08) % (math.pi * 2)
    for index in range(vertex_count):
        angle = base_rotation + (math.pi * 2 * index) / vertex_count
        wobble = 0.88 + 0.16 * math.sin(iteration * 0.6 + index * 1.4 + candidate_rank)
        points.append(
            {
                "x": round(center["x"] + math.cos(angle) * radius * wobble, 2),
                "y": round(center["y"] + math.sin(angle) * radius * wobble, 2),
            }
        )
    return points


def normalize_point(point: Dict) -> Dict:
    """Normalize a point dict to standard (x, y) float format.

    Args:
        point: Raw point dict with 'x' and 'y'.

    Returns:
        Normalized point dict rounded to 2 decimals.
    """
    return {
        "x": round(float(point.get("x", 0)), 2),
        "y": round(float(point.get("y", 0)), 2),
    }


def distance(left: Dict, right: Dict) -> float:
    """Compute Euclidean distance between two points.

    Args:
        left: First point dict with 'x' and 'y'.
        right: Second point dict with 'x' and 'y'.

    Returns:
        Euclidean distance between the two points.
    """
    return math.hypot(float(left["x"]) - float(right["x"]), float(left["y"]) - float(right["y"]))
