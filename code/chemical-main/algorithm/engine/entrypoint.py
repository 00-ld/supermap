"""Pyodide task engine entrypoint.

Provides the main entrypoint for Pyodide worker execution, accepting
a task type and JSON payload string, then routing to the appropriate
algorithm module.

Typical usage:
    result = run_task("run_diffusion_simulation", '{"gasId": "nh3", ...}')
"""

from __future__ import annotations

import json
from typing import Any, Dict

from .task_router import route_task


def run_task(task_type: str, payload_json: str) -> Dict[str, Any]:
    """Run a task by type with a JSON-encoded payload.

    Parses the JSON payload and delegates to the task router.

    Args:
        task_type: Task type identifier (e.g. 'run_diffusion_simulation',
            'run_evacuation_planning', 'run_grid_search',
            'run_analytic_inversion').
        payload_json: JSON-encoded string of the task payload.

    Returns:
        Task result dict with type-specific structure.
    """
    payload = json.loads(payload_json) if payload_json else {}
    return route_task(task_type, payload)
