import random
import time
import tracemalloc
from typing import Dict, List, Set, Tuple

from algorithm.planning.astar_path_planner import AStarPathPlanner, _edge_key

Point = Tuple[float, float]


class DummyLayout:
    def __init__(self, road_graph: Dict[Point, Dict[Point, float]]):
        self.road_graph = road_graph


def add_edge(graph: Dict[Point, Dict[Point, float]], a: Point, b: Point):
    graph.setdefault(a, {})
    graph.setdefault(b, {})
    w = ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5
    graph[a][b] = w
    graph[b][a] = w


def build_graph_10k_30k(seed: int = 42) -> Tuple[Dict[Point, Dict[Point, float]], List[Tuple[Point, Point]]]:
    random.seed(seed)
    w, h = 100, 100  # 10,000 nodes
    nodes = [(float(x), float(y)) for y in range(h) for x in range(w)]
    graph: Dict[Point, Dict[Point, float]] = {}
    edges: Set[Tuple[Point, Point]] = set()

    # 基础网格边
    for y in range(h):
        for x in range(w):
            cur = (float(x), float(y))
            if x + 1 < w:
                r = (float(x + 1), float(y))
                add_edge(graph, cur, r)
                edges.add(_edge_key(cur, r))
            if y + 1 < h:
                d = (float(x), float(y + 1))
                add_edge(graph, cur, d)
                edges.add(_edge_key(cur, d))

    # 补随机边到约 30,000
    target_edges = 30000
    while len(edges) < target_edges:
        a = random.choice(nodes)
        b = random.choice(nodes)
        if a == b:
            continue
        if abs(a[0] - b[0]) + abs(a[1] - b[1]) > 3:
            continue
        e = _edge_key(a, b)
        if e in edges:
            continue
        add_edge(graph, a, b)
        edges.add(e)

    return graph, list(edges)


def build_random_mask(edges: List[Tuple[Point, Point]], blocked_ratio: float = 0.12, seed: int = 7):
    random.seed(seed)
    blocked = set(random.sample(edges, int(len(edges) * blocked_ratio)))
    return {"blocked_nodes": set(), "blocked_edges": blocked}


def run_benchmark(rounds: int = 30):
    graph, edges = build_graph_10k_30k()
    nodes = list(graph.keys())
    planner = AStarPathPlanner(DummyLayout(graph))
    mask = build_random_mask(edges, blocked_ratio=0.1)

    durations_ms: List[float] = []
    tracemalloc.start()
    for _ in range(rounds):
        s = random.choice(nodes)
        g = random.choice(nodes)
        t0 = time.perf_counter()
        _ = planner.find_path(s, g, danger_mask=mask)
        t1 = time.perf_counter()
        durations_ms.append((t1 - t0) * 1000.0)
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    avg_ms = sum(durations_ms) / len(durations_ms)
    peak_mb = peak / (1024 * 1024)
    ok_time = avg_ms <= 80.0
    ok_mem = peak_mb <= 128.0

    print(f"nodes={len(nodes)}, edges={len(edges)}, rounds={rounds}")
    print(f"avg_replan_ms={avg_ms:.2f}, peak_mem_mb={peak_mb:.2f}")
    print(f"time_ok(<=80ms)={ok_time}, mem_ok(<=128MB)={ok_mem}")
    return ok_time and ok_mem


if __name__ == "__main__":
    run_benchmark()
