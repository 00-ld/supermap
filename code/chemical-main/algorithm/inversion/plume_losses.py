"""Loss functions for analytic gas-source inversion.

Provides observation loss, an analytic plume-consistency penalty, source
regularization, and combined loss computation for refining candidate source
locations. These objectives are evaluated against the trained deep-learning
gas-response surrogate used by the diffusion simulator.

Signal prediction is delegated to the PyTorch surrogate, so the inversion uses
the *same* learned response as the forward diffusion simulator instead of the
old hand-tuned coefficients. The single-sensor helper :func:`gaussian_plume_predict`
keeps its historical signature for backward compatibility.

Typical usage:
    loss = compute_loss_snapshot(center, candidate, sensors, scenario)
"""

from __future__ import annotations

import math
from typing import Dict, Sequence

from ..deep_learning.gas_surrogate import deep_sensor_response
from ..diffusion.conditioned_advection import (
    DEFAULT_MIXING_HEIGHT_M,
    ConditionedAdvectionParams,
    gas_condition_from_dict,
)
from ..diffusion.gaussian_plume import normalize_stability

MAP_METERS_PER_UNIT = 0.5
DEFAULT_EMISSION_RATE = 1.0
MIN_WIND_SPEED = 0.5
ARRIVAL_TIME_SIGMA_SEC = 24.0
UPWIND_SIGNAL_TOLERANCE_M = 18.0
# Default dispersion regime for single-sensor prediction when the caller does
# not supply stability / terrain. Neutral stability (D) over built-up terrain
# matches the diffusion-side default (terrainRoughness 0.45 -> urban).
DEFAULT_STABILITY = "D"
DEFAULT_URBAN = True


def gaussian_plume_predict(
    source_x: float,
    source_y: float,
    sensor_x: float,
    sensor_y: float,
    wind_speed: float,
    wind_direction_deg: float,
    emission_rate: float = DEFAULT_EMISSION_RATE,
    stability_class: str = DEFAULT_STABILITY,
    urban: bool = DEFAULT_URBAN,
) -> float:
    """Predict concentration at a sensor location using the deep surrogate.

    Keeps the historical function name for callers, but internally uses the
    same deep-learning response as the diffusion simulator.

    Args:
        source_x: Source X coordinate in map pixels.
        source_y: Source Y coordinate in map pixels.
        sensor_x: Sensor X coordinate in map pixels.
        sensor_y: Sensor Y coordinate in map pixels.
        wind_speed: Wind speed in m/s.
        wind_direction_deg: Wind direction in degrees. In screen coordinates (y-down):
            0=east, 90=south. Used as transport direction in the plume model.
        emission_rate: Source emission rate Q (default 1.0 for normalized).
        stability_class: Pasquill stability class 'A'..'F'.
        urban: True for built-up (urban) dispersion coefficients.

    Returns:
        Predicted concentration value (0.0 if upwind or invalid).
    """
    stab = normalize_stability(stability_class)
    gas = {
        "densityRatio": 0.97 if urban else 1.0,
        "diffusivityM2s": 2.0e-5,
        "diffusionBias": 1.0,
        "molarMass": 28.97,
    }
    params = ConditionedAdvectionParams(
        source_rate_g_s=1.0,
        release_duration_s=1.0,
        wind_speed_10m=max(wind_speed, MIN_WIND_SPEED),
        wind_direction_deg=wind_direction_deg,
        stability_class=stab,
        release_height_m=2.0,
        wind_reference_height_m=10.0,
        ambient_temperature_k=298.15,
        pressure_pa=101325.0,
        cell_size_px=20.0,
        map_meters_per_unit=MAP_METERS_PER_UNIT,
        mixing_height_m=DEFAULT_MIXING_HEIGHT_M,
        gas=gas_condition_from_dict(gas),
    )
    return float(
        deep_sensor_response(
            source_x,
            source_y,
            sensor_x,
            sensor_y,
            emission_rate,
            params,
        )
    )


def fit_emission_rate(
    center: Dict,
    sensors: Sequence[Dict],
    scenario: Dict,
) -> float:
    """Find optimal emission rate Q that best fits observed sensor signals.

    Uses least-squares analytic solution:
        Q = sum(Ci * gi) / sum(gi^2)

    Args:
        center: Candidate source center dict with 'x' and 'y'.
        sensors: List of active sensor dicts with signal values.
        scenario: Scenario dict with windSpeed and windDirection.

    Returns:
        Optimal emission rate Q (clamped to reasonable range).
    """
    wind_speed = float(scenario.get("windSpeed") or 1.0)
    wind_direction = float(scenario.get("windDirection") or 0)
    sum_gi_ci = 0.0
    sum_gi_sq = 0.0
    for sensor in sensors:
        gi = gaussian_plume_predict(
            center["x"], center["y"],
            sensor["mapPoint"]["x"], sensor["mapPoint"]["y"],
            wind_speed, wind_direction,
        )
        ci = float(sensor.get("signal", 0.0))
        sum_gi_ci += gi * ci
        sum_gi_sq += gi * gi
    if sum_gi_sq < 1e-12:
        return 1.0
    return max(1e-6, sum_gi_ci / sum_gi_sq)


def compute_observation_loss(center: Dict, sensors: Sequence[Dict], scenario: Dict) -> float:
    """Compute sensor observation loss using the conditioned response model.

    Fits optimal Q, then measures normalized weighted error between
    model-predicted and observed sensor signals.

    Args:
        center: Candidate source center dict with 'x' and 'y'.
        sensors: List of active sensor dicts with signal and priority.
        scenario: Scenario dict with windSpeed and windDirection.

    Returns:
        Normalized weighted observation error.
    """
    if not sensors:
        return 1.0
    wind_speed = float(scenario.get("windSpeed") or 1.0)
    wind_direction = float(scenario.get("windDirection") or 0)
    q = fit_emission_rate(center, sensors, scenario)

    max_signal = max(float(sensor.get("signal", 0.0)) for sensor in sensors) or 1.0
    raw_predictions = []
    for sensor in sensors:
        pred = gaussian_plume_predict(
            center["x"], center["y"],
            sensor["mapPoint"]["x"], sensor["mapPoint"]["y"],
            wind_speed, wind_direction, q,
        )
        raw_predictions.append(pred)
    max_predicted = max(raw_predictions) or 1.0

    total_weight = 0.0
    weighted_error = 0.0
    for i, sensor in enumerate(sensors):
        norm_predicted = raw_predictions[i] / max_predicted
        norm_observed = float(sensor.get("signal", 0.0)) / max_signal
        signal_weight = max(0.3, norm_observed ** 0.5)
        priority_weight = 1 + float(sensor.get("priority", 0)) * 0.18
        w = signal_weight * priority_weight
        weighted_error += abs(norm_predicted - norm_observed) * w
        total_weight += w
    return weighted_error / max(total_weight, 1.0)


def compute_physics_residual_loss(center: Dict, scenario: Dict, sensors: Sequence[Dict]) -> float:
    """Compute a physics residual loss using wind-driven plume constraints.

    Penalizes upwind sensors having significant signal, which violates
    the wind-driven plume assumption. This is not a neural PDE residual;
    it is an analytic plume consistency penalty.

    Args:
        center: Candidate source center dict with 'x' and 'y'.
        scenario: Scenario dict with windSpeed and windDirection.
        sensors: List of active sensor dicts with positions.

    Returns:
        Normalized physics residual loss.
    """
    wind_direction = math.radians(float(scenario.get("windDirection") or 0))
    cos_theta = math.cos(wind_direction)
    sin_theta = math.sin(wind_direction)
    residual = 0.0
    for sensor in sensors:
        dx = sensor["mapPoint"]["x"] - center["x"]
        dy = sensor["mapPoint"]["y"] - center["y"]
        along = dx * cos_theta + dy * sin_theta
        cross = -dx * sin_theta + dy * cos_theta
        distance = math.hypot(dx, dy)
        # Upwind penalty: sensors behind the source should have zero signal
        if along < 0:
            signal = float(sensor.get("signal", 0.0))
            residual += abs(along) / 120.0 * (1.0 + signal * 0.5)
        else:
            if distance > 0:
                cross_ratio = abs(cross) / distance
                if cross_ratio > 0.6:
                    residual += (cross_ratio - 0.6) * 0.8
                along_m = along * MAP_METERS_PER_UNIT
                if along_m > 10:
                    signal = float(sensor.get("signal", 0.0))
                    expected_max = 1.0 / math.sqrt(along_m)
                    if signal > expected_max * 2:
                        residual += (signal - expected_max * 2) * 0.2
    return residual / max(len(sensors), 1)


def compute_source_regularization(center: Dict, candidate_center: Dict, candidate_radius: float) -> float:
    """Compute source regularization loss penalizing distance from candidate center.

    Args:
        center: Current estimated source center.
        candidate_center: Original candidate region center.
        candidate_radius: Radius of the candidate region.

    Returns:
        Normalized distance-based regularization loss.
    """
    distance = math.hypot(center["x"] - candidate_center["x"], center["y"] - candidate_center["y"])
    return distance / max(candidate_radius, 1.0)


def compute_arrival_time_loss(center: Dict, sensors: Sequence[Dict], scenario: Dict) -> float:
    """Compute arrival time loss for locating the initial leak point.

    Gas travels along the wind axis. The time when gas first arrives at a
    sensor is proportional to downwind projected distance from the source.
    Absolute arrival time is retained because a same-axis upstream translation
    preserves relative ordering while still being physically late.

    Requires at least 3 sensors with arrival time data for reliable
    triangulation. Returns 0.0 if insufficient data.

    Args:
        center: Candidate source center dict with 'x' and 'y'.
        sensors: List of active sensor dicts with arrivalTimeSec.
        scenario: Scenario dict with windSpeed and windDirection.

    Returns:
        Normalized arrival time residual loss.
    """
    wind_speed = max(float(scenario.get("windSpeed") or 1.0), MIN_WIND_SPEED)
    wind_direction = math.radians(float(scenario.get("windDirection") or 0.0))
    cos_theta = math.cos(wind_direction)
    sin_theta = math.sin(wind_direction)
    map_meters_per_unit = float(scenario.get("mapMetersPerUnit") or MAP_METERS_PER_UNIT)

    timed_sensors = []
    for sensor in sensors:
        arrival_sec = sensor.get("arrivalTimeSec")
        if arrival_sec is not None:
            timed_sensors.append((sensor, float(arrival_sec)))

    if len(timed_sensors) < 2:
        return 0.0

    expected_times = []
    observed_times = []
    max_signal = max((float(sensor.get("signal", 0.0)) for sensor, _ in timed_sensors), default=1.0) or 1.0
    upwind_penalty = 0.0
    for sensor, arrival_sec in timed_sensors:
        dx = sensor["mapPoint"]["x"] - center["x"]
        dy = sensor["mapPoint"]["y"] - center["y"]
        along_m = (dx * cos_theta + dy * sin_theta) * map_meters_per_unit
        expected_times.append(max(along_m, 0.0) / wind_speed)
        observed_times.append(arrival_sec)

        if along_m < -UPWIND_SIGNAL_TOLERANCE_M:
            signal_weight = max(float(sensor.get("signal", 0.0)), 0.0) / max_signal
            upwind_penalty += signal_weight * ((abs(along_m) - UPWIND_SIGNAL_TOLERANCE_M) / UPWIND_SIGNAL_TOLERANCE_M) ** 2

    absolute_rmse = math.sqrt(
        sum((expected_times[i] - observed_times[i]) ** 2 for i in range(len(timed_sensors))) / len(timed_sensors)
    )
    min_expected = min(expected_times)
    min_observed = min(observed_times)
    relative_rmse = math.sqrt(
        sum(((expected_times[i] - min_expected) - (observed_times[i] - min_observed)) ** 2 for i in range(len(timed_sensors)))
        / len(timed_sensors)
    )

    return (
        0.70 * absolute_rmse / ARRIVAL_TIME_SIGMA_SEC
        + 0.30 * relative_rmse / ARRIVAL_TIME_SIGMA_SEC
        + upwind_penalty / len(timed_sensors)
    )


def combine_losses(losses: Dict[str, float], weights: Dict[str, float]) -> float:
    """Combine multiple loss terms into a single weighted total.

    Args:
        losses: Dictionary of loss term names to values.
        weights: Dictionary of loss term names to weights.

    Returns:
        Weighted sum of all loss terms.
    """
    total = 0.0
    for name, value in losses.items():
        total += float(weights.get(name, 1.0)) * float(value)
    return total


def compute_loss_snapshot(center: Dict, candidate: Dict, sensors: Sequence[Dict], scenario: Dict) -> Dict[str, float]:
    """Compute a complete loss snapshot for a candidate source location.

    Combines observation, physics residual, source regularization, and
    arrival time losses with default weights. Arrival time is the primary
    constraint for locating the initial leak point.

    Args:
        center: Candidate source center to evaluate.
        candidate: Candidate region dict with center and radius.
        sensors: List of active sensor dicts.
        scenario: Scenario dict with wind data.

    Returns:
        Dictionary with obs, physics, src, arrival, and total loss values.
        A legacy pde field is included for older front-end payloads.
    """
    obs_loss = compute_observation_loss(center, sensors, scenario)
    physics_residual_loss = compute_physics_residual_loss(center, scenario, sensors)
    src_loss = compute_source_regularization(center, candidate["center"], float(candidate.get("radius") or 45))
    arrival_loss = compute_arrival_time_loss(center, sensors, scenario)
    total_loss = combine_losses(
        {
            "obs": obs_loss,
            "physics": physics_residual_loss,
            "src": src_loss,
            "arrival": arrival_loss,
        },
        {
            "obs": 0.50,
            "physics": 0.30,
            "src": 0.10,
            "arrival": 0.35,
        },
    )
    return {
        "obs": round(obs_loss, 4),
        "physics": round(physics_residual_loss, 4),
        "pde": round(physics_residual_loss, 4),
        "src": round(src_loss, 4),
        "arrival": round(arrival_loss, 4),
        "total": round(total_loss, 4),
    }
