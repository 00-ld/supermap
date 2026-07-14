"""Coarse grid search for gas source candidate regions.

Performs a grid-based search over sensor signals to identify candidate
areas where the gas leak source is most likely located. Uses the
deep-learning gas surrogate for wind-aware signal prediction
with support count and error scoring.

Typical usage:
    result = run_coarse_search(payload)
"""

from __future__ import annotations

import math
from typing import Dict, List

from .inversion_dataset import (
    max_sampled_concentration,
    normalize_coarse_search_payload,
    pick_arrival_frame,
    pick_observation_signal,
)
from .plume_losses import gaussian_plume_predict
from ..diffusion.gaussian_plume import normalize_stability, resolve_environment

MAP_METERS_PER_UNIT = 0.5
ORIGIN_LONGITUDE = 118.78
ORIGIN_LATITUDE = 32.04
BASE_ALTITUDE = 18.0
GRID_MIN_X = 40
GRID_MIN_Y = 40
GRID_MAX_X = 961
GRID_MAX_Y = 611
ARRIVAL_TIME_SIGMA_SEC = 16.0
UPWIND_SIGNAL_TOLERANCE_M = 18.0


def run_coarse_search(payload: Dict) -> Dict:
    """Run a coarse grid search for candidate gas source regions.

    Iterates over a grid of candidate points, evaluates deep surrogate
    prediction error against active sensor observations, and returns
    the top-ranked non-overlapping candidate regions.

    Args:
        payload: Request payload with sensor data and search config.

    Returns:
        Dictionary with candidateRegions list and search metadata.
    """
    dataset = normalize_coarse_search_payload(payload)
    config = dataset["config"]
    scenario = dataset.get("scenario") or {}
    wind_speed = float(scenario.get("windSpeed") or 1.0)
    wind_direction = float(scenario.get("windDirection") or 0)
    map_config = resolve_map_config(scenario)
    map_meters_per_unit = map_config["mapMetersPerUnit"]
    # Dispersion regime, shared with the EKI refine stage for self-consistency.
    stability_class = normalize_stability(scenario.get("stabilityClass") or "D")
    urban = resolve_environment(float(scenario.get("terrainRoughness") or 0.45))

    sensors = build_active_sensors(
        sensors=dataset.get("sensors") or [],
        current_frame_index=int(dataset.get("currentFrameIndex") or 0),
        min_observation_threshold=float(config.get("minObservationThreshold") or 0),
        signal_mode=str(config.get("observationSignalMode") or "peak"),
    )
    if not sensors:
        return {
            "candidateRegions": [],
            "meta": {
                "gasId": dataset.get("gas", {}).get("gasId") or dataset.get("gas", {}).get("id") or "",
                "activeSensorCount": 0,
                "currentFrameIndex": int(dataset.get("currentFrameIndex") or 0),
                "frameTimeSec": dataset.get("frameTimeSec") or 0,
                "gridStep": config.get("gridStep", 20),
                "topK": config["topK"],
                "candidateRadius": config["candidateRadius"],
                "minObservationThreshold": config["minObservationThreshold"],
                "model": "deep-learning-surrogate-inversion",
            },
        }

    candidates = []
    # 钳制网格步长到 [5, 100]，并兜底缺失/<=0（gridStep=0 会触发 range ValueError，DoS）
    grid_step = min(max(int(config.get("gridStep", 20) or 20), 5), 100)
    support_radius = float(config.get("supportRadius") or 140)
    max_observed = max(s["observedSignal"] for s in sensors) or 1.0

    for x in range(int(map_config["minX"]), int(map_config["maxX"]) + 1, grid_step):
        for y in range(int(map_config["minY"]), int(map_config["maxY"]) + 1, grid_step):
            weighted_error = 0.0
            influence_score = 0.0
            support_count = 0

            raw_predictions = []
            for sensor in sensors:
                pred = gaussian_plume_predict(
                    x, y,
                    sensor["x"], sensor["y"],
                    wind_speed, wind_direction,
                    stability_class=stability_class, urban=urban,
                )
                raw_predictions.append(pred)
            max_predicted = max(raw_predictions) or 1.0

            for i, sensor in enumerate(sensors):
                norm_predicted = raw_predictions[i] / max_predicted
                norm_observed = sensor["observedSignal"] / max_observed
                error = abs(norm_predicted - norm_observed)
                weighted_error += error * (1 + sensor["priority"] * 0.18)
                influence_score += min(norm_predicted, norm_observed)
                distance = max(math.hypot(sensor["x"] - x, sensor["y"] - y), 1.0)
                if distance <= support_radius:
                    support_count += 1

            normalized_error = weighted_error / len(sensors)
            support_ratio = support_count / len(sensors)
            shape_score = influence_score / len(sensors) + support_ratio * 0.4 - normalized_error * 0.7

            abs_scale = max_observed / max_predicted
            abs_predicted = [p * abs_scale for p in raw_predictions]
            abs_error_sum = sum(abs(abs_predicted[i] - sensors[i]["observedSignal"]) for i in range(len(sensors)))
            abs_error = abs_error_sum / len(sensors) / max_observed
            abs_score = max(0.0, 1.0 - abs_error)

            arrival_detail = _arrival_consistency_score(
                candidate_x=float(x),
                candidate_y=float(y),
                sensors=sensors,
                wind_speed=wind_speed,
                wind_direction=wind_direction,
                map_meters_per_unit=map_meters_per_unit,
            )
            arrival_score = arrival_detail["score"] if arrival_detail["timedCount"] >= 2 else shape_score

            score = round(_combine_candidate_score(shape_score, abs_score, arrival_score), 4)
            candidates.append(
                {
                    "mapPoint": {"x": x, "y": y},
                    "score": score,
                    "error": round(normalized_error, 4),
                    "supportCount": support_count,
                    "arrivalScore": round(arrival_score, 4),
                    "windConsistency": arrival_detail,
                }
            )

    candidates.sort(key=lambda item: item["score"], reverse=True)
    score_floor = _candidate_score_floor(float(candidates[0]["score"])) if candidates else 0.0

    candidate_regions: List[Dict] = []
    for candidate in candidates:
        if len(candidate_regions) >= int(config["topK"]):
            break
        if candidate_regions and float(candidate["score"]) < score_floor:
            continue
        too_close = any(
            math.hypot(region["center"]["x"] - candidate["mapPoint"]["x"], region["center"]["y"] - candidate["mapPoint"]["y"])
            < float(config["mergeDistance"])
            for region in candidate_regions
        )
        if too_close:
            continue

        center = candidate["mapPoint"]
        radius = float(config["candidateRadius"])
        candidate_regions.append(
            {
                "candidateId": f"cand_{len(candidate_regions) + 1}",
                "rank": len(candidate_regions) + 1,
                "center": center,
                "geoCenter": to_geo_point(center["x"], center["y"], map_meters_per_unit, map_config["height"]),
                "score": candidate["score"],
                "error": candidate["error"],
                "supportCount": candidate["supportCount"],
                "arrivalScore": candidate.get("arrivalScore"),
                "windConsistency": candidate.get("windConsistency"),
                "radius": radius,
                "bounds": {
                    "minX": max(map_config["minX"], center["x"] - radius),
                    "maxX": min(map_config["maxX"], center["x"] + radius),
                    "minY": max(map_config["minY"], center["y"] - radius),
                    "maxY": min(map_config["maxY"], center["y"] + radius),
                },
                "label": f"候选区域 {len(candidate_regions) + 1}",
            }
        )

    return {
        "candidateRegions": candidate_regions,
        "meta": {
            "gasId": dataset.get("gas", {}).get("gasId") or dataset.get("gas", {}).get("id") or "",
            "activeSensorCount": len(sensors),
            "currentFrameIndex": int(dataset.get("currentFrameIndex") or 0),
            "frameTimeSec": dataset.get("frameTimeSec") or 0,
            "gridStep": config.get("gridStep", 20),
            "topK": config["topK"],
            "candidateRadius": config["candidateRadius"],
            "minObservationThreshold": config["minObservationThreshold"],
            "scoreFloor": round(score_floor, 4),
            "map": map_config,
            "model": "deep-learning-surrogate-inversion",
        },
    }


def _arrival_consistency_score(
    *,
    candidate_x: float,
    candidate_y: float,
    sensors: List[Dict],
    wind_speed: float,
    wind_direction: float,
    map_meters_per_unit: float,
) -> Dict[str, float]:
    """Score candidate timing with wind-projected, absolute arrival times."""

    timed = []
    for sensor in sensors:
        arrival_sec = sensor.get("arrivalTimeSec")
        if arrival_sec is None:
            continue
        try:
            timed.append((sensor, float(arrival_sec)))
        except (TypeError, ValueError):
            continue

    if len(timed) < 2:
        return {
            "score": 0.0,
            "timedCount": float(len(timed)),
            "absoluteRmseSec": 0.0,
            "relativeRmseSec": 0.0,
            "upwindSignalPenalty": 0.0,
        }

    angle = math.radians(float(wind_direction or 0.0))
    cos_theta = math.cos(angle)
    sin_theta = math.sin(angle)
    transport_speed = max(float(wind_speed or 0.0), 0.5)

    expected_times = []
    observed_times = []
    weights = []
    upwind_penalty = 0.0
    max_signal = max((float(sensor.get("observedSignal") or 0.0) for sensor, _ in timed), default=1.0) or 1.0

    for sensor, arrival_sec in timed:
        dx = float(sensor["x"]) - candidate_x
        dy = float(sensor["y"]) - candidate_y
        along_m = (dx * cos_theta + dy * sin_theta) * map_meters_per_unit
        expected_times.append(max(along_m, 0.0) / transport_speed)
        observed_times.append(arrival_sec)
        signal_weight = max(float(sensor.get("observedSignal") or 0.0), 0.0) / max_signal
        weights.append(0.15 + 0.85 * math.sqrt(signal_weight))

        if along_m < -UPWIND_SIGNAL_TOLERANCE_M:
            upwind_penalty += signal_weight * ((abs(along_m) - UPWIND_SIGNAL_TOLERANCE_M) / UPWIND_SIGNAL_TOLERANCE_M) ** 2

    expected = expected_times
    observed = observed_times
    weight_sum = max(sum(weights), 1e-9)
    absolute_rmse = math.sqrt(sum(weights[i] * (expected[i] - observed[i]) ** 2 for i in range(len(timed))) / weight_sum)

    min_expected = min(expected)
    min_observed = min(observed)
    relative_rmse = math.sqrt(
        sum(
            weights[i] * ((expected[i] - min_expected) - (observed[i] - min_observed)) ** 2
            for i in range(len(timed))
        )
        / weight_sum
    )

    absolute_score = math.exp(-0.5 * (absolute_rmse / ARRIVAL_TIME_SIGMA_SEC) ** 2)
    relative_score = math.exp(-0.5 * (relative_rmse / ARRIVAL_TIME_SIGMA_SEC) ** 2)
    upwind_score = math.exp(-min(upwind_penalty, 50.0))
    score = (absolute_score * 0.65 + relative_score * 0.35) * upwind_score

    return {
        "score": round(max(0.0, min(score, 1.0)), 4),
        "timedCount": float(len(timed)),
        "absoluteRmseSec": round(absolute_rmse, 4),
        "relativeRmseSec": round(relative_rmse, 4),
        "upwindSignalPenalty": round(upwind_penalty, 4),
    }


def _combine_candidate_score(shape_score: float, abs_score: float, arrival_score: float) -> float:
    """Combine coarse scores without letting timing override plume mismatch."""

    shape = max(0.0, min(float(shape_score), 1.0))
    absolute = max(0.0, min(float(abs_score), 1.0))
    arrival = max(0.0, min(float(arrival_score), 1.0))
    concentration_support = max(0.0, min(0.55 * shape + 0.45 * absolute, 1.0))
    gated_arrival = arrival * (0.25 + 0.75 * concentration_support)
    return 0.35 * shape + 0.30 * absolute + 0.35 * gated_arrival


def _candidate_score_floor(best_score: float) -> float:
    """Minimum score for secondary coarse candidates.

    TopK is an upper bound. Returning weak alternatives makes the map look like
    the algorithm endorses them, so keep only candidates near the best score.
    """

    return max(0.45, float(best_score) * 0.82)


def resolve_map_config(scenario: Dict) -> Dict[str, float]:
    """Resolve coarse-search bounds from scenario map metadata."""

    has_project_map = "mapWidth" in scenario or "mapHeight" in scenario or "mapMetersPerUnit" in scenario
    width = float(scenario.get("mapWidth") or GRID_MAX_X)
    height = float(scenario.get("mapHeight") or GRID_MAX_Y)
    meters_per_unit = float(scenario.get("mapMetersPerUnit") or MAP_METERS_PER_UNIT)
    if has_project_map:
        min_x, min_y = 0.0, 0.0
        max_x, max_y = max(width, 1.0), max(height, 1.0)
    else:
        min_x, min_y = float(GRID_MIN_X), float(GRID_MIN_Y)
        max_x, max_y = float(GRID_MAX_X), float(GRID_MAX_Y)
    return {
        "minX": min_x,
        "minY": min_y,
        "maxX": max_x,
        "maxY": max_y,
        "width": width,
        "height": height,
        "mapMetersPerUnit": meters_per_unit,
    }


def build_active_sensors(
    sensors: List[Dict],
    current_frame_index: int,
    min_observation_threshold: float,
    signal_mode: str = "peak",
) -> List[Dict]:
    """Build a list of active sensors with observed signals above threshold.

    Combines sampled peak and current concentration into a weighted
    observed signal, filtering by minimum threshold.

    Args:
        sensors: Raw sensor list with sampled series and peak data.
        current_frame_index: Current frame for concentration lookup.
        min_observation_threshold: Minimum signal threshold for activation.

    Returns:
        List of active sensor dicts with id, position, and observed signal.
    """
    active_sensors = []
    for sensor in sensors:
        sampled_series = sensor.get("sampledSeries") or []
        current_concentration = pick_sampled_concentration(sampled_series, current_frame_index)
        peak_concentration = float(
            sensor.get("sampledPeak") or max_sampled_concentration(sampled_series) or current_concentration or 0.0
        )
        observed_signal = (
            float(sensor.get("signal"))
            if sensor.get("signal") is not None
            else pick_observation_signal(
                sensor=sensor,
                sampled_series=sampled_series,
                current_frame_index=current_frame_index,
                signal_mode=signal_mode,
            )
        )
        arrival_frame = pick_arrival_frame(sampled_series)
        arrival_time_sec = None
        if arrival_frame is not None and arrival_frame < len(sampled_series):
            arrival_time_sec = float(sampled_series[arrival_frame].get("timeSec") or 0)
        active_sensors.append(
            {
                "id": sensor.get("id", ""),
                "priority": int(sensor.get("priority") or 0),
                "x": float(sensor.get("x") if sensor.get("x") is not None else sensor.get("mapPoint", {}).get("x", 0)),
                "y": float(sensor.get("y") if sensor.get("y") is not None else sensor.get("mapPoint", {}).get("y", 0)),
                "currentConcentration": round(current_concentration, 2),
                "sampledPeak": round(peak_concentration, 2),
                "observedSignal": round(observed_signal, 2),
                "signalMode": sensor.get("signalMode") or signal_mode,
                "arrivalFrame": arrival_frame,
                "arrivalTimeSec": arrival_time_sec,
            }
        )

    return [sensor for sensor in active_sensors if sensor["observedSignal"] >= min_observation_threshold]


def pick_sampled_concentration(sampled_series: List[Dict], current_frame_index: int) -> float:
    """Get the concentration at a given frame index from a sampled series.

    Args:
        sampled_series: List of frame concentration samples.
        current_frame_index: Target frame index.

    Returns:
        Concentration value, or last available if index out of range.
    """
    if not sampled_series:
        return 0.0
    if 0 <= current_frame_index < len(sampled_series):
        return float(sampled_series[current_frame_index].get("concentration") or 0)
    return float(sampled_series[-1].get("concentration") or 0)


def to_geo_point(
    x: float,
    y: float,
    map_meters_per_unit: float = MAP_METERS_PER_UNIT,
    map_height: float = 650.0,
) -> Dict:
    """Convert map pixel coordinates to geographic coordinates.

    Uses the configured origin longitude/latitude and map scale to
    compute approximate GPS coordinates with elevation.

    Args:
        x: Map pixel X-coordinate.
        y: Map pixel Y-coordinate.

    Returns:
        Dictionary with longitude, latitude, and altitude.
    """
    meters_x = x * map_meters_per_unit
    meters_y = y * map_meters_per_unit
    latitude = ORIGIN_LATITUDE - meters_y / 111320
    longitude = ORIGIN_LONGITUDE + meters_x / (111320 * math.cos(ORIGIN_LATITUDE * math.pi / 180))
    normalized_y = min(max(y, 0), map_height)
    altitude = (
        BASE_ALTITUDE
        + (map_height - normalized_y) * 0.02
        + math.sin(x / 90) * 1.8
        + math.cos(y / 70) * 1.2
    )
    return {
        "longitude": round(longitude, 6),
        "latitude": round(latitude, 6),
        "altitude": round(altitude, 2),
    }
