"""Gas diffusion simulation and A* path planning for chemical plants.

Integrates physics-informed deep surrogate dispersion with A* path planning on
a factory road network. Provides hazard-aware escape routing with
multi-gas support (CH4, NH3, CO, O2).

Key components:
    - FactoryLayout: 2D factory road network and building map.
    - ClassicGaussianPlumeModel: compatibility wrapper around the deep
      surrogate response with stability, wind, and gas conditioning.
    - AStarPathPlanner: A* search on road graph with danger masks.
    - IntegratedEscapeSystem: Unified escape planning combining diffusion
      and path finding.

Typical usage:
    result = calculate_gas_and_path(data)
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

from .astar_path_planner import AStarPathPlanner
from .factory_layout import FactoryLayout, Point, _edge_key
from .gas_catalog import GAS_PROPERTIES_MAP, GasProperties, GasType, get_gas_types_info
from .integrated_escape_system import DiffusionSource, IntegratedEscapeSystem
from .legacy_diffusion_model import ClassicGaussianPlumeModel, DiffusionConfig, DiffusionResult

LEGACY_REGRESSION_ONLY = True
PUBLIC_SERVICE_EXPOSED = False
PRIMARY_DIFFUSION_MODULE = "algorithm.diffusion.phase1_diffusion"
PRIMARY_PLANNING_MODULE = "algorithm.planning.dstar_lite"


def _to_point(raw: object, default: Point) -> Point:
    """Convert a raw input to a point tuple.

    Accepts dicts with 'x'/'y' keys, lists/tuples with 2+ elements,
    or returns the default.

    Args:
        raw: Input data (dict, list, tuple, or other).
        default: Fallback point tuple.

    Returns:
        Point as (x, y) tuple.
    """
    if isinstance(raw, dict):
        return (float(raw.get("x", default[0])), float(raw.get("y", default[1])))
    if isinstance(raw, (list, tuple)) and len(raw) >= 2:
        return (float(raw[0]), float(raw[1]))
    return default


def _require_point(data: Dict[str, Any], field: str) -> Point:
    """Read a required request point without silently substituting a map default."""
    raw = data.get(field)
    if isinstance(raw, dict) and raw.get("x") is not None and raw.get("y") is not None:
        return (float(raw["x"]), float(raw["y"]))
    if isinstance(raw, (list, tuple)) and len(raw) >= 2:
        return (float(raw[0]), float(raw[1]))
    raise ValueError(f"{field} is required and must include x/y coordinates")


def _parse_config(data: Dict[str, Any]) -> Tuple[DiffusionConfig, GasType, float]:
    """Parse and validate diffusion configuration from request data.

    Computes dynamic max_radius and sample_resolution scaling based
    on source rate, wind speed, and stability class.

    Args:
        data: Request dict with sourceRate, stability, windAngle,
            windSpeed, timeElapsed, and gasType.

    Returns:
        Tuple of (DiffusionConfig, GasType, time_elapsed).
    """
    source_rate = float(data.get("sourceRate", 8.0))
    stability = int(data.get("stability", 4))
    wind_angle = float(data.get("windAngle", 90.0))
    wind_speed = float(data.get("windSpeed", 3.0))
    time_elapsed = float(data.get("timeElapsed", 60.0))
    gas_type_str = str(data.get("gasType", "CH4")).upper()
    try:
        selected_gas = GasType[gas_type_str]
    except KeyError:
        selected_gas = GasType.CH4

    # 稳定度越低(A/B)整体影响范围越大；越高(E/F)范围收敛但顺风向更明显
    stability_radius_scale = {1: 1.22, 2: 1.14, 3: 1.07, 4: 1.00, 5: 0.92, 6: 0.85}
    radius_base = 90.0 + source_rate * 7.0 + wind_speed * 4.0
    dynamic_radius = min(
        420.0,
        max(120.0, radius_base * stability_radius_scale.get(max(1, min(6, stability)), 1.0))
    )
    dynamic_resolution = int(min(48, max(28, 24 + source_rate * 0.35)))

    cfg = DiffusionConfig(
        source_rate=source_rate,
        stability=max(1, min(6, stability)),
        wind_angle=wind_angle % 360.0,
        wind_speed=max(0.1, wind_speed),
        max_radius=dynamic_radius,
        sample_resolution=dynamic_resolution
    )
    return cfg, selected_gas, time_elapsed


def calculate_gas_and_path(data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate gas diffusion and escape path for a given scenario.

    Main entry point for the integrated escape system. Parses input,
    computes diffusion, plans escape routes for all buildings, and
    returns combined results.

    Args:
        data: Request dict with sourceRate, stability, windAngle,
            windSpeed, leakPoint, startPoint, endPoint, gasType,
            leakCarId, obstacles, and timeElapsed.

    Returns:
        Dict with diffusion, escapePath, pathInfo, safetyAnalysis,
        gasInfo, factoryMap, multiGasDiffusion, buildingEscapePlans,
        validation, and success status.
    """
    try:
        system = IntegratedEscapeSystem()
        config, selected_gas, time_elapsed = _parse_config(data)

        start_point = _require_point(data, "startPoint")
        leak_point = _require_point(data, "leakPoint")
        obstacles = [_to_point(p, (0.0, 0.0)) for p in data.get("obstacles", [])]

        leak_car_id = data.get("leakCarId")
        active_car_id = int(leak_car_id) if isinstance(leak_car_id, (int, float, str)) and str(leak_car_id).isdigit() else None
        active_building = system.layout.building_by_car_id(active_car_id) if active_car_id is not None else system.layout.nearest_building_id(leak_point)
        sources = system.build_sources(active_car_id=active_car_id, active_building_id=active_building)
        snapshot = system.compute_diffusion_snapshot(config, time_elapsed, sources)

        route_map: Dict[str, Dict] = {}
        for building_id in system.layout.buildings:
            route_map[building_id] = system.plan_escape_for_building(
                building_id, config, time_elapsed, sources, obstacles=obstacles
            )

        # 兼容前端：默认采用“起点最近建筑”的逃生路径
        start_building = system.layout.nearest_building_id(start_point)
        primary_route = route_map.get(start_building)
        if primary_route is None:
            start_exit = system.layout.buildings[start_building].exit_point
            primary_route = {
                "path": [],
                "distance": 0.0,
                "nodeCount": 0,
                "iterations": 0,
                "status": "blocked",
                "safety": {"riskScore": 999.0, "isSafe": False},
                "targetMainExit": "none",
                "startExit": start_exit,
            }

        primary_gas_type = sources[0].gas_type if sources else selected_gas
        selected_props = GAS_PROPERTIES_MAP[primary_gas_type]
        safety_obj = primary_route.get("safety", {})
        map_validation = system.validate_map_and_routes(route_map)
        route_success = primary_route.get("status") == "success" and bool(primary_route.get("path"))

        return {
            "diffusion": {
                "high": snapshot["high"],
                "medium": snapshot["medium"],
                "low": snapshot["low"],
                "affectedArea": round(snapshot["affectedArea"], 2),
                "maxConcentration": round(snapshot["maxConcentration"], 2),
            },
            "escapePath": primary_route.get("path", []),
            "pathInfo": {
                "distance": round(primary_route.get("distance", 0.0), 2),
                "nodeCount": int(primary_route.get("nodeCount", 0)),
                "iterations": int(primary_route.get("iterations", 0)),
                "status": primary_route.get("status", "blocked"),
                "targetMainExit": primary_route.get("targetMainExit", "unknown"),
                "startBuilding": start_building,
            },
            "safetyAnalysis": {
                "avgConcentration": round(snapshot["maxConcentration"] * 0.35, 2),
                "maxConcentration": round(snapshot["maxConcentration"], 2),
                "safeRatio": 1.0 if safety_obj.get("isSafe", False) else 0.0,
                "riskScore": round(float(safety_obj.get("riskScore", 999.0)), 2),
                "isSafe": bool(safety_obj.get("isSafe", False)),
                "pathSafetyValidated": bool(safety_obj.get("isSafe", False)),
            },
            "gasInfo": {
                "type": primary_gas_type.value,
                "name": selected_props.name,
                "color": selected_props.color,
                "safetyThreshold": selected_props.safety_threshold_ppm,
                "idlhThreshold": selected_props.idlh_threshold_ppm,
            },
            "factoryMap": system.layout.export_map_data(),
            "multiGasDiffusion": snapshot["perSource"],
            "activeLeakSource": {
                "carId": active_car_id,
                "buildingId": active_building,
                "sourceCount": len(sources),
            },
            "buildingEscapePlans": route_map,
            "validation": map_validation,
            "success": route_success,
            "error": None if route_success else "起点建筑无可达疏散路径",
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc(), "success": False}


def simulate_time_series(data: Dict[str, Any]) -> Dict[str, Any]:
    """Run a time-series diffusion and escape path simulation.

    Computes diffusion snapshots and escape routes across multiple
    time steps with dynamic hazard updating.

    Args:
        data: Request dict with numSteps, stepInterval, and same
            parameters as calculate_gas_and_path.

    Returns:
        Dict with frames, dynamicRoutes, totalFrames, duration,
        startBuilding, gasInfo, activeLeakSource, and success status.
    """
    try:
        system = IntegratedEscapeSystem()
        config, selected_gas, _ = _parse_config(data)
        # 钳制步数到 [1, 500]，防止超大值耗尽资源（DoS）
        num_steps = min(max(int(data.get("numSteps", 30)), 1), 500)
        step_interval = float(data.get("stepInterval", 5.0))
        start_point = _require_point(data, "startPoint")
        leak_point = _require_point(data, "leakPoint")
        start_building = system.layout.nearest_building_id(start_point)
        obstacles = [_to_point(p, (0.0, 0.0)) for p in data.get("obstacles", [])]

        leak_car_id = data.get("leakCarId")
        active_car_id = int(leak_car_id) if isinstance(leak_car_id, (int, float, str)) and str(leak_car_id).isdigit() else None
        active_building = system.layout.building_by_car_id(active_car_id) if active_car_id is not None else system.layout.nearest_building_id(leak_point)
        sources = system.build_sources(active_car_id=active_car_id, active_building_id=active_building)
        frames = []
        dynamic_routes = []

        for idx in range(num_steps):
            t = (idx + 1) * step_interval
            snapshot = system.compute_diffusion_snapshot(config, t, sources)
            route = system.plan_escape_for_building(
                start_building, config, t, sources, obstacles=obstacles
            )
            dynamic_routes.append({
                "frameIndex": idx,
                "timeElapsed": t,
                "buildingId": start_building,
                "path": route["path"],
                "distance": route["distance"],
                "status": route["status"],
                "isSafe": route["safety"]["isSafe"],
                "riskScore": route["safety"]["riskScore"],
                "targetMainExit": route["targetMainExit"],
            })

            frames.append({
                "frameIndex": idx,
                "timeElapsed": t,
                "high": snapshot["high"],
                "medium": snapshot["medium"],
                "low": snapshot["low"],
                "maxConcentration": round(snapshot["maxConcentration"], 2),
                "affectedArea": round(snapshot["affectedArea"], 2),
            })

        primary_gas_type = sources[0].gas_type if sources else selected_gas
        selected_props = GAS_PROPERTIES_MAP[primary_gas_type]
        return {
            "frames": frames,
            "dynamicRoutes": dynamic_routes,
            "totalFrames": len(frames),
            "duration": num_steps * step_interval,
            "startBuilding": start_building,
            "gasInfo": {
                "type": primary_gas_type.value,
                "name": selected_props.name,
                "color": selected_props.color,
            },
            "activeLeakSource": {
                "carId": active_car_id,
                "buildingId": active_building,
                "sourceCount": len(sources),
            },
            "success": True
        }
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc(), "success": False}
