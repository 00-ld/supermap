"""Evacuation planning runner module.

Orchestrates D* Lite hazard-aware evacuation route planning for single
start points or multi-building scenarios. Designed for Pyodide worker
execution.

Typical usage:
    result = run_evacuation_planning_task(payload)
"""

from __future__ import annotations

from typing import Dict

from .dstar_lite import plan_evacuation_route, plan_evacuation_routes_by_building


def _as_public_route(route: Dict) -> Dict:
    """Expose evacuation reachability without leaking the internal success flag."""
    public_route = dict(route)
    public_route["isReachable"] = route.get("success") is True
    public_route.pop("success", None)
    if isinstance(public_route.get("candidateRoutes"), list):
        public_route["candidateRoutes"] = [
            _as_public_route(candidate)
            for candidate in public_route["candidateRoutes"]
            if isinstance(candidate, dict)
        ]
    return public_route


def _as_public_batch(result: Dict) -> Dict:
    """Expose the batch evacuation contract consumed by the frontend."""
    routes = [
        _as_public_route(route)
        for route in result.get("routesByBuilding", [])
        if isinstance(route, dict)
    ]
    public_result = dict(result)
    public_result["routesByBuilding"] = routes
    public_result["hasAnyReachable"] = any(route.get("isReachable") is True for route in routes)
    public_result["reachableCount"] = sum(1 for route in routes if route.get("isReachable") is True)
    public_result.pop("success", None)
    public_result.pop("hasAnySuccess", None)
    public_result.pop("successCount", None)
    return public_result


def run_evacuation_planning_task(payload: Dict) -> Dict:
    """Run an evacuation planning task.

    If buildingEntrances are provided, plans routes for all buildings.
    Otherwise, plans a single route from the startPoint.

    Args:
        payload: Request dict with roads, gas, frame, blockedMask,
            parking entrances, and optionally buildingEntrances or
            startPoint.

    Returns:
        Route result with path, distance, estimated time, and risk
        assessment. Includes candidateRoutes for single route or
        routesByBuilding for multi-building planning.
    """
    if isinstance(payload.get("buildingEntrances"), list):
        result = _as_public_batch(plan_evacuation_routes_by_building(payload))
        result["executor"] = {
            "mode": "worker-pyodide",
            "runtime": "pyodide-python",
            "implementation": "python.planning.evacuation_runner",
        }
        return result

    result = _as_public_route(plan_evacuation_route(payload))
    result["executor"] = {
        "mode": "worker-pyodide",
        "runtime": "pyodide-python",
        "implementation": "python.planning.evacuation_runner",
    }
    return result
