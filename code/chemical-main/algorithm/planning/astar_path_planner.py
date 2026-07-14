"""A* path planner used by the legacy gas evacuation chain."""

from __future__ import annotations

import heapq
from typing import Any, Dict, List, Optional, Set, Tuple

from .factory_layout import FactoryLayout, Point, _dist, _edge_key


class AStarPathPlanner:
    """A* path planner for the factory road network."""

    def __init__(self, layout: FactoryLayout):
        self.layout = layout

    def _heuristic(self, a: Point, b: Point) -> float:
        """Heuristic function for A* (Euclidean distance)."""
        return _dist(a, b)

    def _reconstruct(self, came: Dict[Point, Point], cur: Point) -> List[Point]:
        """Reconstruct the path from the came-from map."""
        path = [cur]
        while cur in came:
            cur = came[cur]
            path.append(cur)
        return list(reversed(path))

    def _sample_segment(self, a: Point, b: Point, n: int = 5) -> List[Point]:
        """Sample intermediate points along a segment."""
        points = []
        for i in range(1, n):
            t = i / n
            points.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
        return points

    def _summarize_route_risk(self, risk_samples: List[Dict[str, Any]]) -> Dict[str, float]:
        """Summarize risk metrics across sampled path points."""
        if not risk_samples:
            return {
                "max_ratio_idlh": 0.0,
                "max_ratio_safe": 0.0,
                "avg_risk_score": 0.0,
            }
        return {
            "max_ratio_idlh": max((s.get("max_ratio_idlh", 0.0) for s in risk_samples), default=0.0),
            "max_ratio_safe": max((s.get("max_ratio_safe", 0.0) for s in risk_samples), default=0.0),
            "avg_risk_score": sum((s.get("risk_score", 0.0) for s in risk_samples), 0.0) / len(risk_samples),
        }

    def find_path(
        self,
        start: Point,
        goal: Point,
        danger_mask: Optional[Dict[str, Set]] = None,
        obstacles: Optional[List[Point]] = None,
        risk_fn=None,
    ) -> Dict[str, Any]:
        """Find the shortest path from start to goal avoiding hazards."""
        if start not in self.layout.road_graph or goal not in self.layout.road_graph:
            return {
                "path": [],
                "distance": float("inf"),
                "iterations": 0,
                "status": "unreachable",
                "riskSamples": [],
            }

        obstacle_list = obstacles or []
        blocked_nodes: Set[Point] = (danger_mask or {}).get("blocked_nodes", set())
        blocked_edges: Set[Tuple[Point, Point]] = (danger_mask or {}).get("blocked_edges", set())
        open_heap: List[Tuple[float, Point]] = []
        heapq.heappush(open_heap, (0.0, start))
        came: Dict[Point, Point] = {}
        g_score: Dict[Point, float] = {start: 0.0}
        visited: Set[Point] = set()
        iterations = 0

        while open_heap:
            iterations += 1
            _, cur = heapq.heappop(open_heap)
            if cur in visited:
                continue
            visited.add(cur)

            if cur == goal:
                path = self._reconstruct(came, cur)
                dist = sum(_dist(path[i - 1], path[i]) for i in range(1, len(path)))
                risks = [risk_fn(p) for p in path] if risk_fn else []
                route_risk = self._summarize_route_risk(risks)
                return {
                    "path": path,
                    "distance": dist,
                    "iterations": iterations,
                    "status": "success",
                    "riskSamples": risks,
                    "routeRisk": route_risk,
                }

            if cur in blocked_nodes:
                continue

            if any(_dist(cur, obs) < 16.0 for obs in obstacle_list):
                continue

            for nb, edge_len in self.layout.road_graph.get(cur, {}).items():
                if nb in visited:
                    continue

                if nb in blocked_nodes:
                    continue
                if any(_dist(nb, obs) < 16.0 for obs in obstacle_list):
                    continue

                if _edge_key(cur, nb) in blocked_edges:
                    continue

                # 纯最简A*：代价仅使用边几何长度，不引入任何道路附加权重
                tentative_g = g_score[cur] + edge_len
                if tentative_g < g_score.get(nb, float("inf")):
                    came[nb] = cur
                    g_score[nb] = tentative_g
                    f = tentative_g + self._heuristic(nb, goal)
                    heapq.heappush(open_heap, (f, nb))

        return {
            "path": [],
            "distance": float("inf"),
            "iterations": iterations,
            "status": "blocked",
            "riskSamples": [],
        }

    def find_nearest_safe_main_exit(
        self,
        start: Point,
        main_exits: Dict[str, Point],
        danger_mask: Optional[Dict[str, Set]] = None,
        obstacles: Optional[List[Point]] = None,
        risk_fn=None,
    ) -> Dict[str, Any]:
        """Find the nearest safe main exit from a start point."""
        candidates = []
        for exit_id, exit_point in main_exits.items():
            plan = self.find_path(start, exit_point, danger_mask=danger_mask, obstacles=obstacles, risk_fn=risk_fn)
            plan["exitId"] = exit_id
            plan["exitPoint"] = exit_point
            candidates.append(plan)

        successful = [p for p in candidates if p["status"] == "success"]
        fully_safe = [p for p in successful if p.get("routeRisk", {}).get("max_ratio_safe", float("inf")) < 1.0]
        if fully_safe:
            fully_safe.sort(key=lambda p: (
                p["distance"],
                p.get("routeRisk", {}).get("avg_risk_score", float("inf")),
            ))
            return fully_safe[0]
        if successful:
            successful.sort(key=lambda p: (
                p.get("routeRisk", {}).get("max_ratio_safe", float("inf")),
                p["distance"],
                p.get("routeRisk", {}).get("avg_risk_score", float("inf")),
            ))
            return successful[0]

        return candidates[0] if candidates else {
            "path": [],
            "distance": float("inf"),
            "iterations": 0,
            "status": "blocked",
            "exitId": "none",
            "exitPoint": start,
            "riskSamples": [],
        }
