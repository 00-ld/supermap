"""Integrated legacy gas diffusion and evacuation orchestration."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any, Dict, List, Optional, Set, Tuple

from .astar_path_planner import AStarPathPlanner
from .factory_layout import FactoryLayout, Point, _edge_key
from .gas_catalog import GAS_PROPERTIES_MAP, GasType
from .legacy_diffusion_model import ClassicGaussianPlumeModel, DiffusionConfig

LEGACY_REGRESSION_ONLY = True
PUBLIC_SERVICE_EXPOSED = False
PRIMARY_DIFFUSION_MODULE = "algorithm.diffusion.phase1_diffusion"
PRIMARY_PLANNING_MODULE = "algorithm.planning.dstar_lite"


@dataclass
class DiffusionSource:
    source_id: str
    building_id: str
    leak_point: Point
    gas_type: GasType


class IntegratedEscapeSystem:
    """Unified system integrating diffusion modeling and escape planning."""

    def __init__(self):
        self.layout = FactoryLayout()
        self.gas_model = ClassicGaussianPlumeModel()
        self.path_planner = AStarPathPlanner(self.layout)

    def build_sources(
        self,
        active_car_id: Optional[int] = None,
        active_building_id: Optional[str] = None,
    ) -> List[DiffusionSource]:
        """Build diffusion sources from car-to-building-to-gas mapping."""
        car_source_map: Dict[int, Tuple[str, GasType]] = {
            1: ("workshop1", GasType.CH4),
            2: ("equipment_room", GasType.NH3),
            3: ("workshop2", GasType.CO),
            4: ("warehouse", GasType.O2),
        }

        if active_car_id is not None:
            source = car_source_map.get(active_car_id)
            if source:
                mapping = [source]
            else:
                mapping = list(car_source_map.values())
        else:
            mapping = list(car_source_map.values())
            if active_building_id:
                for bid, gtype in car_source_map.values():
                    if bid == active_building_id:
                        mapping = [(bid, gtype)]
                        break

        sources = []
        for idx, (bid, gtype) in enumerate(mapping, start=1):
            b = self.layout.buildings[bid]
            sources.append(DiffusionSource(
                source_id=f"S{idx}",
                building_id=bid,
                leak_point=b.center,
                gas_type=gtype,
            ))
        return sources

    def _point_risk(
        self,
        point: Point,
        sources: List[DiffusionSource],
        config: DiffusionConfig,
        time_elapsed: float,
    ) -> Dict[str, Any]:
        """Evaluate gas risk at a single point from all sources."""
        max_ratio_idlh = 0.0
        max_ratio_safe = 0.0
        concentrations: Dict[str, float] = {}
        for s in sources:
            props = GAS_PROPERTIES_MAP[s.gas_type]
            c = self.gas_model.calculate_concentration(s.leak_point, point, config, s.gas_type, time_elapsed)
            concentrations[s.gas_type.name] = c
            max_ratio_idlh = max(max_ratio_idlh, c / max(props.idlh_threshold_ppm, 1e-6))
            max_ratio_safe = max(max_ratio_safe, c / max(props.safety_threshold_ppm, 1e-6))
        return {
            "blocked": max_ratio_idlh >= 1.0,
            "risk_score": max_ratio_safe * 100.0,
            "max_ratio_idlh": max_ratio_idlh,
            "max_ratio_safe": max_ratio_safe,
            "concentrations": concentrations,
        }

    def build_danger_road_mask(
        self,
        sources: List[DiffusionSource],
        config: DiffusionConfig,
        time_elapsed: float,
        segment_samples: int = 5,
    ) -> Dict[str, Set]:
        """Build a danger mask for the road graph based on gas concentration."""
        blocked_nodes: Set[Point] = set()
        blocked_edges: Set[Tuple[Point, Point]] = set()
        checked_edges: Set[Tuple[Point, Point]] = set()

        for a, nbrs in self.layout.road_graph.items():
            if self._point_risk(a, sources, config, time_elapsed)["blocked"]:
                blocked_nodes.add(a)

            for b in nbrs.keys():
                edge = _edge_key(a, b)
                if edge in checked_edges:
                    continue
                checked_edges.add(edge)

                edge_blocked = False
                if a in blocked_nodes or b in blocked_nodes:
                    edge_blocked = True
                else:
                    for i in range(1, max(2, segment_samples) + 1):
                        t = i / (max(2, segment_samples) + 1)
                        p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
                        if self._point_risk(p, sources, config, time_elapsed)["blocked"]:
                            edge_blocked = True
                            break

                if edge_blocked:
                    blocked_edges.add(edge)

        return {
            "blocked_nodes": blocked_nodes,
            "blocked_edges": blocked_edges,
            "checked_edges": checked_edges,
        }

    def compute_diffusion_snapshot(
        self,
        config: DiffusionConfig,
        time_elapsed: float,
        sources: List[DiffusionSource],
    ) -> Dict[str, Any]:
        """Compute a diffusion snapshot for all active sources."""
        per_source = {}
        merged_high: List[List[Point]] = []
        merged_medium: List[List[Point]] = []
        merged_low: List[List[Point]] = []
        max_conc = 0.0
        affected_area = 0.0

        for src in sources:
            result = self.gas_model.get_enhanced_diffusion_polygons(
                src.leak_point, config, src.gas_type, time_elapsed
            )
            per_source[src.source_id] = {
                "buildingId": src.building_id,
                "gasType": src.gas_type.name,
                "leakPoint": [src.leak_point[0], src.leak_point[1]],
                "high": result.high_concentration,
                "medium": result.medium_concentration,
                "low": result.low_concentration,
                "maxConcentration": round(result.max_concentration, 2),
                "affectedArea": round(result.affected_area, 2),
            }
            merged_high.extend(result.high_concentration)
            merged_medium.extend(result.medium_concentration)
            merged_low.extend(result.low_concentration)
            max_conc = max(max_conc, result.max_concentration)
            affected_area += result.affected_area

        return {
            "high": merged_high,
            "medium": merged_medium,
            "low": merged_low,
            "maxConcentration": max_conc,
            "affectedArea": affected_area,
            "perSource": per_source,
        }

    def plan_escape_for_building(
        self,
        building_id: str,
        config: DiffusionConfig,
        time_elapsed: float,
        sources: List[DiffusionSource],
        obstacles: Optional[List[Point]] = None,
    ) -> Dict[str, Any]:
        """Plan an escape route for a specific building."""
        building = self.layout.buildings[building_id]

        def risk_fn(p: Point) -> Dict:
            return self._point_risk(p, sources, config, time_elapsed)

        danger_mask = self.build_danger_road_mask(sources, config, time_elapsed)
        exit_candidates = self.layout.get_building_exits(building_id)
        candidate_plans = []
        for start in exit_candidates:
            exit_risk = risk_fn(start)
            best_plan = self.path_planner.find_nearest_safe_main_exit(
                start,
                self.layout.main_exits,
                danger_mask=danger_mask,
                obstacles=obstacles,
                risk_fn=risk_fn,
            )
            best_plan["startExit"] = start
            best_plan["startExitRisk"] = exit_risk
            candidate_plans.append(best_plan)

        fully_safe_candidates = [
            plan for plan in candidate_plans
            if plan["status"] == "success" and plan.get("routeRisk", {}).get("max_ratio_safe", float("inf")) < 1.0
        ]
        if fully_safe_candidates:
            candidate_plans = fully_safe_candidates
            candidate_plans.sort(key=lambda plan: (
                plan["distance"],
                plan.get("routeRisk", {}).get("avg_risk_score", float("inf")),
                plan["startExitRisk"]["max_ratio_safe"],
            ))
        else:
            candidate_plans.sort(key=lambda plan: (
                plan["status"] != "success",
                plan.get("routeRisk", {}).get("max_ratio_safe", float("inf")),
                plan["distance"],
                plan.get("routeRisk", {}).get("avg_risk_score", float("inf")),
                plan["startExitRisk"]["blocked"],
                plan["startExitRisk"]["max_ratio_safe"],
            ))
        best_plan = candidate_plans[0] if candidate_plans else {
            "path": [],
            "distance": float("inf"),
            "iterations": 0,
            "status": "blocked",
            "exitId": "none",
            "exitPoint": building.exit_point,
            "startExit": building.exit_point,
            "riskSamples": [],
        }
        start = best_plan.get("startExit", building.exit_point)

        if best_plan["path"]:
            samples = best_plan.get("riskSamples", [])
            max_ratio_idlh = max((s["max_ratio_idlh"] for s in samples), default=0.0)
            max_ratio_safe = max((s["max_ratio_safe"] for s in samples), default=0.0)
            avg_risk = sum((s["risk_score"] for s in samples), 0.0) / max(1, len(samples))
            is_safe = max_ratio_idlh < 1.0
        else:
            max_ratio_idlh = 1.0
            max_ratio_safe = 1.0
            avg_risk = 999.0
            is_safe = False

        return {
            "buildingId": building_id,
            "buildingName": building.name,
            "startExit": [start[0], start[1]],
            "candidateExits": [[p[0], p[1]] for p in exit_candidates],
            "startExitRisk": {
                "blocked": best_plan["startExitRisk"]["blocked"],
                "maxSafeRatio": round(best_plan["startExitRisk"]["max_ratio_safe"], 4),
                "riskScore": round(best_plan["startExitRisk"]["risk_score"], 2),
            },
            "targetMainExit": best_plan["exitId"],
            "targetMainExitPoint": [best_plan["exitPoint"][0], best_plan["exitPoint"][1]],
            "path": [[p[0], p[1]] for p in best_plan["path"]],
            "distance": round(best_plan["distance"], 2) if math.isfinite(best_plan["distance"]) else 0.0,
            "nodeCount": len(best_plan["path"]),
            "iterations": best_plan["iterations"],
            "status": best_plan["status"],
            "safety": {
                "maxIdlhRatio": round(max_ratio_idlh, 4),
                "maxSafeRatio": round(max_ratio_safe, 4),
                "riskScore": round(avg_risk, 2),
                "isSafe": is_safe,
            },
            "routeRisk": {
                "maxSafeRatio": round(best_plan.get("routeRisk", {}).get("max_ratio_safe", 0.0), 4),
                "avgRiskScore": round(best_plan.get("routeRisk", {}).get("avg_risk_score", 0.0), 2),
            },
            "dangerMaskStats": {
                "blockedNodes": len(danger_mask.get("blocked_nodes", [])),
                "blockedEdges": len(danger_mask.get("blocked_edges", [])),
                "checkedEdges": len(danger_mask.get("checked_edges", [])),
            },
        }

    def validate_map_and_routes(
        self,
        route_map: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Validate the road network connectivity and route safety."""
        excluded_nodes = set(self.layout.main_exits.values())
        for bid in self.layout.buildings:
            excluded_nodes.update(self.layout.get_building_exits(bid))

        low_degree_nodes = [
            [node[0], node[1]]
            for node, neighbors in self.layout.road_graph.items()
            if node not in excluded_nodes and len(neighbors) < 2
        ]
        all_exits_connected = all(
            all(exit_point in self.layout.road_graph for exit_point in self.layout.get_building_exits(bid))
            for bid in self.layout.buildings
        )
        all_routes_safe = all(plan["safety"]["isSafe"] for plan in route_map.values())
        all_routes_found = all(plan["status"] == "success" for plan in route_map.values())
        return {
            "roadNetworkConnected": self.layout.is_connected(),
            "allBuildingExitsConnected": all_exits_connected,
            "allBuildingRoutesFound": all_routes_found,
            "allRoutesSafe": all_routes_safe,
            "allInternalRoadNodesMultiConnected": len(low_degree_nodes) == 0,
            "lowDegreeRoadNodes": low_degree_nodes,
        }
