"""Diffusion simulation runner module.

Orchestrates the physics-informed deep surrogate simulation and applies a transparent
post-processing pass to produce final results. Designed for Pyodide worker
execution.

Typical usage:
    result = run_diffusion_simulation_task(payload)
"""

from __future__ import annotations

from typing import Dict

from .cfd_calibrator import apply_dispersion_postprocess
from .phase1_diffusion import create_phase1_diffusion_simulation


def run_diffusion_simulation_task(payload: Dict) -> Dict:
    """Run a full diffusion simulation with post-processing.

    Creates the base deep surrogate diffusion simulation, recomputes summary statistics,
    and appends executor metadata for Pyodide worker tracking.

    Args:
        payload: Request payload containing facilities, gas, wind parameters,
            stability class, and diffusion configuration.

    Returns:
        Post-processed simulation result with frames, stats, and executor info.
    """
    base_result = create_phase1_diffusion_simulation(payload)
    final_result = apply_dispersion_postprocess(base_result, payload)
    final_result["executor"] = {
        "mode": "worker-pyodide",
        "runtime": "pyodide-python",
        "implementation": "python.deep_learning.gas_surrogate+python.diffusion.phase1_diffusion",
    }
    return final_result
