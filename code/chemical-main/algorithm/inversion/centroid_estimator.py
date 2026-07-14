"""Weighted-centroid estimation helpers for source inversion.

Provides weighted center estimation and point interpolation for the
source inversion refinement process. This is a signal-weighted centroid
heuristic (no neural network involved).

Typical usage:
    center = estimate_weighted_center(sensors, fallback)
    point = blend_points(start, end, ratio)
"""

from __future__ import annotations

from typing import Dict, Sequence


def estimate_weighted_center(sensors: Sequence[Dict], fallback_center: Dict) -> Dict:
    """Estimate the weighted center from sensor signals.

    Each sensor contributes proportionally to its signal strength and
    priority to the weighted center calculation.

    Args:
        sensors: List of sensor dicts with signal, priority, and position.
        fallback_center: Default center if no sensors have signal.

    Returns:
        Estimated center dict with 'x' and 'y' coordinates.
    """
    total_weight = 0.0
    sum_x = 0.0
    sum_y = 0.0
    for sensor in sensors:
        weight = max(float(sensor.get("signal", 0.0)), 0.1) * (1 + float(sensor.get("priority", 0)) * 0.2)
        total_weight += weight
        sum_x += float(sensor["mapPoint"]["x"]) * weight
        sum_y += float(sensor["mapPoint"]["y"]) * weight
    if total_weight <= 0:
        return dict(fallback_center)
    return {
        "x": round(sum_x / total_weight, 2),
        "y": round(sum_y / total_weight, 2),
    }


def blend_points(start: Dict, end: Dict, ratio: float) -> Dict:
    """Linearly interpolate between two points.

    Args:
        start: Starting point dict with 'x' and 'y'.
        end: Ending point dict with 'x' and 'y'.
        ratio: Interpolation ratio (0.0 = start, 1.0 = end).

    Returns:
        Interpolated point dict with 'x' and 'y'.
    """
    return {
        "x": round(float(start["x"]) + (float(end["x"]) - float(start["x"])) * ratio, 2),
        "y": round(float(start["y"]) + (float(end["y"]) - float(start["y"])) * ratio, 2),
    }
