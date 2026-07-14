"""Post-processing pass for diffusion simulation results.

Historically this module applied opaque "CFD calibration" multipliers to the
concentration field. The dispersion physics now lives in
``deep_learning.gas_surrogate`` and the near-field obstacle/channel attenuation is applied directly inside
``diffusion.phase1_diffusion``. There is therefore nothing left to "calibrate"
with invented coefficients, and doing so would distort physically meaningful
concentrations.

This module is kept as a thin, transparent pass-through so the runner and any
external callers keep working. It recomputes summary statistics from the
already-physical frames and attaches honest provenance metadata.

Typical usage:
    result = apply_dispersion_postprocess(simulation_result, payload)
"""

from __future__ import annotations

from typing import Dict


def apply_dispersion_postprocess(simulation_result: Dict, payload: Dict) -> Dict:
    """Attach provenance metadata and recompute peak statistics.

    Does not modify the physically computed concentrations. Peaks are derived
    from the existing frame values so callers always receive consistent stats.

    Args:
        simulation_result: Result from the deep surrogate diffusion model.
        payload: Original request payload (unused beyond provenance).

    Returns:
        The simulation result with refreshed stats and a ``postprocess``
        metadata block.
    """
    frames = simulation_result.get("frames") or []
    if not frames:
        result = dict(simulation_result)
        result["postprocess"] = {"enabled": False, "reason": "empty_frames"}
        return result

    peak_concentration = 0.0
    peak_affected_area = 0.0
    peak_danger_area = 0.0
    for frame in frames:
        peak_concentration = max(peak_concentration, float(frame.get("maxConcentration", 0)))
        peak_affected_area = max(peak_affected_area, float(frame.get("affectedArea", 0)))
        peak_danger_area = max(peak_danger_area, float(frame.get("dangerArea", 0)))

    result = dict(simulation_result)
    result["stats"] = {
        **(simulation_result.get("stats") or {}),
        "peakConcentration": peak_concentration,
        "peakAffectedArea": peak_affected_area,
        "peakDangerArea": peak_danger_area,
    }
    result["postprocess"] = {
        "enabled": True,
        "model": "deep-learning-surrogate-diffusion",
        "concentrationUnit": "ppm",
        "note": "Concentrations come from the physics-informed deep surrogate; no empirical scaling applied here.",
    }
    return result


# Backwards-compatible alias for existing imports.
def apply_cfd_calibration(simulation_result: Dict, payload: Dict) -> Dict:
    """Deprecated alias for :func:`apply_dispersion_postprocess`.

    Args:
        simulation_result: Result from the diffusion model.
        payload: Original request payload.

    Returns:
        Post-processed simulation result.
    """
    return apply_dispersion_postprocess(simulation_result, payload)
