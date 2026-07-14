"""Factory layout graph used by the legacy gas evacuation planner."""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Dict, List, Optional, Set, Tuple

Point = Tuple[float, float]

# 与系统其余扩散模型一致的地图比例：0.5 米/像素。
MAP_METERS_PER_UNIT = 0.5


@dataclass
class Building:
    id: str
    name: str
    center: Point
    size: Tuple[float, float]
    exit_point: Point


def _dist(a: Point, b: Point) -> float:
    """Compute Euclidean distance between two points."""
    return math.hypot(a[0] - b[0], a[1] - b[1])


def _pt_key(p: Point) -> str:
    """Generate a rounded string key for a point."""
    return f"{round(p[0], 2)}_{round(p[1], 2)}"


def _edge_key(a: Point, b: Point) -> Tuple[Point, Point]:
    """Generate a canonical unordered edge key from two points."""
    return (a, b) if a <= b else (b, a)


class FactoryLayout:
    """
    工厂二维布局：
    - 主出口固定在左侧、上侧、右侧
    - 建筑具有独立出口
    - 复杂道路网络保证全局连通
    """

    def __init__(self):
        self.width = 1200.0
        self.height = 600.0
        self.main_exits: Dict[str, Point] = {
            "left": (100.0, 300.0),
            "top": (600.0, 100.0),
            "right": (1100.0, 300.0),
        }
        self.buildings: Dict[str, Building] = {
            "workshop1": Building("workshop1", "车间1", (350.0, 240.0), (100.0, 80.0), (400.0, 240.0)),
            "workshop2": Building("workshop2", "车间2", (750.0, 240.0), (100.0, 80.0), (700.0, 240.0)),
            "warehouse": Building("warehouse", "仓库", (350.0, 440.0), (100.0, 80.0), (400.0, 440.0)),
            "equipment_room": Building("equipment_room", "设备房", (750.0, 440.0), (100.0, 80.0), (700.0, 440.0)),
            "office": Building("office", "办公楼", (600.0, 190.0), (100.0, 80.0), (600.0, 230.0)),
            "admin": Building("admin", "行政楼", (210.0, 300.0), (120.0, 100.0), (270.0, 300.0)),
        }
        self.building_exit_candidates: Dict[str, List[Point]] = {
            "workshop1": [(400.0, 240.0), (350.0, 200.0)],
            "workshop2": [(700.0, 240.0), (750.0, 200.0), (800.0, 240.0)],
            "warehouse": [(400.0, 440.0), (350.0, 400.0)],
            "equipment_room": [(700.0, 440.0), (750.0, 400.0), (800.0, 440.0)],
            "office": [(600.0, 230.0), (600.0, 150.0)],
            "admin": [(270.0, 300.0)],
        }
        self.car_building_map: Dict[int, str] = {
            1: "workshop1",
            2: "equipment_room",
            3: "workshop2",
            4: "warehouse",
        }
        self.road_graph: Dict[Point, Dict[Point, float]] = {}
        self._build_road_network()

    def _add_edge(self, a: Point, b: Point):
        self.road_graph.setdefault(a, {})
        self.road_graph.setdefault(b, {})
        w = _dist(a, b)
        self.road_graph[a][b] = w
        self.road_graph[b][a] = w

    def _add_polyline(self, points: List[Point]):
        for i in range(1, len(points)):
            self._add_edge(points[i - 1], points[i])

    def _build_road_network(self):
        # 主横向干道
        self._add_polyline([
            (100, 300), (180, 300), (270, 300), (350, 300), (450, 300),
            (550, 300), (600, 300), (650, 300), (750, 300), (850, 300), (950, 300), (1030, 300), (1100, 300)
        ])
        # 上侧联络道
        self._add_polyline([(250, 180), (350, 180), (450, 180), (550, 180), (600, 180), (650, 180), (750, 180), (850, 180)])
        # 中上联络道
        self._add_polyline([(250, 240), (350, 240), (450, 240), (550, 240), (600, 240), (650, 240), (750, 240), (850, 240)])
        # 中下联络道
        self._add_polyline([(250, 360), (350, 360), (450, 360), (550, 360), (600, 360), (650, 360), (750, 360), (850, 360)])
        # 下侧联络道
        self._add_polyline([(250, 440), (350, 440), (450, 440), (550, 440), (650, 440), (750, 440), (850, 440)])

        # 多条纵向连接，形成互通网格
        for x in (250, 350, 450, 550, 650, 750, 850):
            self._add_polyline([(x, 180), (x, 240), (x, 300), (x, 360), (x, 440)])

        # 行政楼接入道路
        self._add_polyline([(270, 300), (270, 240), (250, 240)])
        self._add_polyline([(270, 300), (250, 300), (180, 300)])

        # 上主出口接入
        self._add_polyline([(600, 100), (600, 140), (600, 180), (600, 240), (600, 300)])

        # 关键建筑出口接入道路
        self._add_polyline([(400, 240), (450, 240)])
        self._add_polyline([(350, 200), (350, 180)])
        self._add_polyline([(700, 240), (650, 240)])
        self._add_polyline([(750, 200), (750, 180)])
        self._add_polyline([(800, 240), (850, 240)])
        self._add_polyline([(400, 440), (450, 440)])
        self._add_polyline([(350, 400), (350, 360)])
        self._add_polyline([(700, 440), (650, 440)])
        self._add_polyline([(750, 400), (750, 360)])
        self._add_polyline([(800, 440), (850, 440)])
        self._add_polyline([(600, 230), (600, 240)])
        self._add_polyline([(600, 150), (600, 180)])

    def is_connected(self) -> bool:
        if not self.road_graph:
            return False
        start = next(iter(self.road_graph.keys()))
        q = [start]
        visited: Set[Point] = {start}
        while q:
            cur = q.pop()
            for nxt in self.road_graph.get(cur, {}):
                if nxt not in visited:
                    visited.add(nxt)
                    q.append(nxt)
        return len(visited) == len(self.road_graph)

    def nearest_road_node(self, point: Point) -> Point:
        return min(self.road_graph.keys(), key=lambda p: _dist(p, point))

    def nearest_building_id(self, point: Point) -> str:
        return min(self.buildings.keys(), key=lambda bid: _dist(point, self.buildings[bid].center))

    def building_by_car_id(self, car_id: int) -> Optional[str]:
        return self.car_building_map.get(car_id)

    def get_building_exits(self, building_id: str) -> List[Point]:
        return list(self.building_exit_candidates.get(building_id, [self.buildings[building_id].exit_point]))

    def export_map_data(self) -> Dict:
        roads = []
        seen = set()
        for a, nbrs in self.road_graph.items():
            for b in nbrs:
                edge_key = tuple(sorted((_pt_key(a), _pt_key(b))))
                if edge_key in seen:
                    continue
                seen.add(edge_key)
                roads.append({"start": [a[0], a[1]], "end": [b[0], b[1]]})

        return {
            "size": {"width": self.width, "height": self.height},
            "mainExits": {k: [v[0], v[1]] for k, v in self.main_exits.items()},
            "buildings": {
                b.id: {
                    "name": b.name,
                    "center": [b.center[0], b.center[1]],
                    "size": [b.size[0], b.size[1]],
                    "exit": [b.exit_point[0], b.exit_point[1]],
                    "exits": [[p[0], p[1]] for p in self.get_building_exits(b.id)]
                } for b in self.buildings.values()
            },
            "roads": roads,
        }
