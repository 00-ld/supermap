"""Dataset normalization utilities for source inversion.

Provides payload normalization, active sensor building, candidate region
construction, and geometry helper functions for the two-stage source
inversion workflow.

Typical usage:
    dataset = normalize_inversion_payload(payload)
    config = normalize_coarse_search_payload(payload)
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Sequence


DEFAULT_REFINEMENT_CONFIG = {
    "topK": 4,
    "animationSteps": 18,
    "minSignalThreshold": 1.5,
    "observationSignalMode": "peak",
    "ekiConvergenceRatio": 0.005,
}

DEFAULT_COARSE_SEARCH_CONFIG = {
    "topK": 4,
    "gridStep": 20,
    "candidateRadius": 45,
    "supportRadius": 140,
    "distanceScale": 90,
    "mergeDistance": 80,
    "minObservationThreshold": 0.5,
    "observationSignalMode": "peak",
}

LEGACY_PAYLOAD_KEYS = ("exportPayload", "pinnExportPayload", "trainingConfig")


def _reject_legacy_payload_aliases(payload: Dict, *nested_payloads: Dict) -> None:
    """Reject old source-inversion aliases; the current schema is mandatory."""
    offenders = [key for key in LEGACY_PAYLOAD_KEYS if key in payload]
    for nested_payload in nested_payloads:
        offenders.extend(key for key in LEGACY_PAYLOAD_KEYS if key in nested_payload)
    if offenders:
        unique_keys = ", ".join(sorted(set(offenders)))
        raise ValueError(
            "legacy inversion payload aliases are disabled; "
            f"use observationPayload/refinementConfig/current schema instead of: {unique_keys}"
        )


def _observation_payload(payload: Dict) -> Dict:
    _reject_legacy_payload_aliases(payload)
    value = payload.get("observationPayload") or payload
    return value if isinstance(value, dict) else {}


def normalize_inversion_payload(payload: Dict) -> Dict:
    """Normalize a source-inversion payload into a standardized dataset.

    Extracts gas info, scenario, refinement config, active sensors, and
    candidate regions from the current source-inversion schema.

    Args:
        payload: Raw inversion request payload with refinementInput,
            optional observationPayload, or direct flat structure.

    Returns:
        Normalized dataset dict with all fields for inversion.
    """
    refinement_input = payload.get("refinementInput") or {}
    export_payload = _observation_payload(payload)
    _reject_legacy_payload_aliases(payload, refinement_input, export_payload)
    coarse_search = payload.get("coarseSearchResult") or export_payload.get("coarseSearch") or {}

    gas = refinement_input.get("gas") or export_payload.get("gas") or {}
    scenario = refinement_input.get("scenario") or export_payload.get("scenario") or {}
    refinement_config = merge_refinement_config(
        refinement_input.get("refinementConfig") or payload.get("refinementConfig") or {},
    )

    current_frame_index = (
        refinement_input.get("frameContext", {}).get("currentFrameIndex")
        or export_payload.get("timeline", {}).get("currentFrameIndex")
        or export_payload.get("currentFrameIndex")
        or 0
    )
    frame_time_sec = (
        export_payload.get("timeline", {}).get("currentTimeSec")
        or export_payload.get("currentFrameSnapshot", {}).get("timeSec")
        or 0
    )

    active_sensors = build_active_sensors(
        sensors=refinement_input.get("activeSensors"),
        fallback_sensors=export_payload.get("sensors") or payload.get("sensors") or [],
        current_frame_index=int(current_frame_index),
        min_signal_threshold=float(refinement_config.get("minSignalThreshold", 0)),
        signal_mode=str(refinement_config.get("observationSignalMode") or "peak"),
    )

    candidate_regions = (
        coarse_search.get("candidateRegions")
        or payload.get("candidateRegions")
        or build_candidate_regions_from_refinement(refinement_input.get("coarseCandidate"))
    )

    true_source_map_point = (
        payload.get("sourceMapPoint")
        or export_payload.get("scenario", {}).get("sourceMapPoint")
        or scenario.get("sourceMapPoint")
    )

    return {
        "gas": gas,
        "scenario": scenario,
        "refinementConfig": refinement_config,
        "currentFrameIndex": int(current_frame_index),
        "frameTimeSec": frame_time_sec,
        "activeSensors": active_sensors,
        "candidateRegions": candidate_regions,
        "trueSourceMapPoint": true_source_map_point,
    }


def merge_refinement_config(*configs: Dict) -> Dict:
    """Merge source-inversion refinement config, ignoring stale training keys."""
    merged = dict(DEFAULT_REFINEMENT_CONFIG)
    for config in configs:
        for key in DEFAULT_REFINEMENT_CONFIG:
            if key in config:
                merged[key] = config[key]
    return merged


def normalize_coarse_search_payload(payload: Dict) -> Dict:
    """Normalize a coarse search payload into a standardized dataset.

    Extracts gas, config, scenario (wind data), frame info, and sensor
    data from the current source-inversion schema.

    Args:
        payload: Raw coarse search request payload.

    Returns:
        Normalized dataset dict with gas, config, scenario, frame index,
        and sensors.
    """
    export_payload = _observation_payload(payload)
    gas = export_payload.get("gas") or payload.get("gas") or {}
    scenario = export_payload.get("scenario") or payload.get("scenario") or {}
    config = {
        **DEFAULT_COARSE_SEARCH_CONFIG,
        **(payload.get("config") or export_payload.get("inversionConfig") or {}),
    }
    current_frame_index = int(
        payload.get("currentFrameIndex")
        or export_payload.get("timeline", {}).get("currentFrameIndex")
        or export_payload.get("currentFrameIndex")
        or 0
    )
    frame_time_sec = (
        payload.get("frameTimeSec")
        or export_payload.get("timeline", {}).get("currentTimeSec")
        or export_payload.get("currentFrameSnapshot", {}).get("timeSec")
        or 0
    )

    # sensors 键兼容：评估发现部分调用方按 particle_filter 的 payload
    # 约定传 activeSensors 键，而此处原先只认 sensors 键，导致返回空
    # 候选（评估报告 03 §8 问题 3）。此处统一支持两者。
    sensors = (
        export_payload.get("sensors")
        or payload.get("sensors")
        or export_payload.get("activeSensors")
        or payload.get("activeSensors")
        or []
    )
    return {
        "gas": gas,
        "config": config,
        "scenario": scenario,
        "currentFrameIndex": current_frame_index,
        "frameTimeSec": frame_time_sec,
        "sensors": sensors,
    }


def pick_arrival_frame(sampled_series: Sequence[Dict], threshold_ratio: float = 0.01) -> Optional[int]:
    """Find the first frame where concentration exceeds a threshold.

    The threshold is peak_concentration * threshold_ratio. This marks
    the approximate arrival time of the gas front at the sensor.

    Args:
        sampled_series: List of frame dicts with 'concentration'.
        threshold_ratio: Fraction of peak to use as arrival threshold.

    Returns:
        Frame index of first arrival, or None if no valid data.
    """
    if not sampled_series:
        return None
    peak = max((item.get("concentration") or 0) for item in sampled_series)
    if peak <= 0:
        return None
    threshold = peak * threshold_ratio
    for i, item in enumerate(sampled_series):
        if (item.get("concentration") or 0) >= threshold:
            return i
    return None


def build_active_sensors(
    sensors: Optional[Sequence[Dict]],
    fallback_sensors: Sequence[Dict],
    current_frame_index: int,
    min_signal_threshold: float,
    signal_mode: str = "peak",
) -> List[Dict]:
    """Build a filtered, sorted list of active sensors.

    If explicit sensors are provided, normalizes them. Otherwise,
    derives signals from fallback sensor sampled data.

    Args:
        sensors: Optional pre-built sensor list.
        fallback_sensors: Raw sensor data for signal derivation.
        current_frame_index: Current frame for concentration lookup.
        min_signal_threshold: Minimum signal to include sensor.

    Returns:
        Sorted list of active sensor dicts (highest signal first).
    """
    if sensors:
        normalized = [
            normalize_active_sensor(sensor, current_frame_index=current_frame_index, signal_mode=signal_mode)
            for sensor in sensors
        ]
    else:
        normalized = [
            normalize_active_sensor(sensor, current_frame_index=current_frame_index, signal_mode=signal_mode)
            for sensor in fallback_sensors
        ]

    return sorted(
        [sensor for sensor in normalized if float(sensor.get("signal", 0)) >= min_signal_threshold],
        key=lambda item: item.get("signal", 0),
        reverse=True,
    )


def normalize_active_sensor(
    sensor: Dict,
    current_frame_index: int = 0,
    signal_mode: str = "peak",
) -> Dict:
    """Normalize a single active sensor to standard format.

    Args:
        sensor: Raw sensor dict with id, priority, position, and signals.

    Returns:
        Normalized sensor dict with standardized fields.
    """
    sampled_series = sensor.get("sampledSeries") or []
    current = (
        float(sensor.get("currentConcentration"))
        if sensor.get("currentConcentration") is not None
        else pick_sampled_concentration(sampled_series, current_frame_index)
    )
    peak = float(sensor.get("sampledPeak") or max_sampled_concentration(sampled_series) or current or 0)
    signal = (
        float(sensor.get("signal"))
        if sensor.get("signal") is not None
        else pick_observation_signal(
            sensor=sensor,
            sampled_series=sampled_series,
            current_frame_index=current_frame_index,
            signal_mode=signal_mode,
        )
    )
    arrival_frame = sensor.get("arrivalFrame")
    arrival_time_sec = sensor.get("arrivalTimeSec")
    if arrival_frame is None:
        arrival_frame = pick_arrival_frame(sampled_series)
    if arrival_time_sec is None and arrival_frame is not None and arrival_frame < len(sampled_series):
        arrival_time_sec = float(sampled_series[arrival_frame].get("timeSec") or 0)

    return {
        "id": sensor.get("id", ""),
        "priority": int(sensor.get("priority") or 0),
        "mapPoint": normalize_point(sensor.get("mapPoint") or {"x": sensor.get("x", 0), "y": sensor.get("y", 0)}),
        "geoPoint": sensor.get("geoPoint"),
        "currentConcentration": round(current, 2),
        "sampledPeak": round(peak, 2),
        "signal": round(signal, 2),
        "signalMode": sensor.get("signalMode") or signal_mode,
        "arrivalFrame": arrival_frame,
        "arrivalTimeSec": arrival_time_sec,
    }


def build_candidate_regions_from_refinement(coarse_candidate: Optional[Dict]) -> List[Dict]:
    """Build candidate regions list from a single coarse candidate.

    Args:
        coarse_candidate: Coarse search candidate result, or None.

    Returns:
        List with one candidate region dict, or empty list if no valid candidate.
    """
    if not coarse_candidate:
        return []
    center = coarse_candidate.get("center")
    if not center:
        return []
    return [
        {
            "candidateId": coarse_candidate.get("candidateId", "cand_1"),
            "rank": coarse_candidate.get("rank", 1),
            "center": normalize_point(center),
            "geoCenter": coarse_candidate.get("geoCenter"),
            "score": float(coarse_candidate.get("score") or 0),
            "error": float(coarse_candidate.get("error") or 0),
            "supportCount": int(coarse_candidate.get("supportCount") or 0),
            "radius": float(coarse_candidate.get("radius") or 45),
            "bounds": coarse_candidate.get("bounds"),
            "label": coarse_candidate.get("label") or f"候选区域 {coarse_candidate.get('rank', 1)}",
        }
    ]


def pick_sampled_concentration(sampled_series: Sequence[Dict], current_frame_index: int) -> float:
    """Get concentration at a frame index from a sampled series.

    Args:
        sampled_series: List of frame concentration samples.
        current_frame_index: Target frame index.

    Returns:
        Concentration value, or last available if out of range.
    """
    if not sampled_series:
        return 0.0
    if 0 <= current_frame_index < len(sampled_series):
        return float(sampled_series[current_frame_index].get("concentration") or 0)
    return float(sampled_series[-1].get("concentration") or 0)


def max_sampled_concentration(sampled_series: Sequence[Dict]) -> float:
    """Return the peak concentration across a sensor time series."""

    if not sampled_series:
        return 0.0
    return max(float(item.get("concentration") or 0) for item in sampled_series)


def pick_observation_signal(
    sensor: Dict,
    sampled_series: Sequence[Dict],
    current_frame_index: int,
    signal_mode: str = "peak",
) -> float:
    """Pick the scalar signal used by source inversion.

    ``peak`` is the default because source localization should use the whole
    leak observation window, not just the animation frame the operator is
    currently viewing.
    """

    current = pick_sampled_concentration(sampled_series, current_frame_index)
    peak = float(sensor.get("sampledPeak") or max_sampled_concentration(sampled_series) or current or 0.0)
    mode = (signal_mode or "peak").strip().lower()
    if mode in {"current", "current_frame", "frame"}:
        return current
    if mode in {"weighted", "weighted_peak", "peak_weighted"}:
        return max(current, peak * 0.85)
    return peak


def normalize_point(point: Optional[Dict]) -> Dict:
    """Normalize a point dict to standard (x, y) float format.

    Args:
        point: Raw point dict, or None.

    Returns:
        Normalized point dict with 'x' and 'y' rounded to 2 decimals.
    """
    point = point or {"x": 0, "y": 0}
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
