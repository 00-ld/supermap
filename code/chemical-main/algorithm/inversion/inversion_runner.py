"""Source-inversion runner module.

Orchestrates coarse search and two-stage inversion workflows for gas
source localization. Designed for Pyodide worker execution.

Typical usage:
    result = run_grid_search_task(payload)
    result = run_analytic_inversion_task(payload)
"""

from __future__ import annotations

from typing import Dict

from .grid_search import run_coarse_search
from .inversion_dataset import normalize_inversion_payload
from .particle_filter import run_particle_filter_inversion_task as run_improved_particle_filter_task
from .source_inversion import run_two_stage_inversion


def run_grid_search_task(payload: Dict) -> Dict:
    """Run a coarse search for candidate source regions.

    Performs grid-based search over sensor data to identify candidate
    regions for source localization.

    Args:
        payload: Request payload with sensors, gas, and search config.

    Returns:
        Coarse search result with candidate regions and metadata.
    """
    result = run_coarse_search(payload)
    result["executor"] = {
        "mode": "worker-pyodide",
        "runtime": "pyodide-python",
        "implementation": "python.inversion.inversion_runner",
    }
    return result


def run_analytic_inversion_task(payload: Dict) -> Dict:
    """Run a two-stage analytic inversion for source estimation.

    Normalizes the payload, then performs coarse search and refinement
    to estimate the gas leak source location.

    Args:
        payload: Request payload with sensors, candidate regions, and
            training configuration.

    Returns:
        Inversion result with estimated source, confidence radius,
        loss history, and error metrics.
    """
    dataset = normalize_inversion_payload(payload)
    result = run_two_stage_inversion(dataset)
    result["executor"] = {
        "mode": "worker-pyodide",
        "runtime": "pyodide-python",
        "implementation": "python.inversion.inversion_runner",
    }
    return result


def run_particle_filter_inversion_task(payload: Dict) -> Dict:
    """Run improved particle filtering for source-term estimation.

    Args:
        payload: Request payload with sensor observations, scenario, gas
            metadata, and optional particleFilterConfig.

    Returns:
        Inversion result with source estimate, posterior intervals, diagnostics,
        and optional error metrics when true source fields are supplied.
    """
    return run_improved_particle_filter_task(payload)
