"""D* Lite 疏散路径规划的最小冒烟测试。

构造一个十字路网，验证 plan_evacuation_route / plan_evacuation_routes_by_building
能跑通、返回结构正确，并覆盖危险遮罩阻断与目标切换（局部重绑）等关键路径。
可直接 `python -m algorithm.planning.test_dstar_lite` 运行，也可被 pytest 收集。
"""

from __future__ import annotations

import sys

from . import dstar_lite as dstar_lite_module
from .dstar_lite import (
    build_danger_mask,
    build_road_graph,
    create_dstar_planner,
    plan_evacuation_route,
    plan_evacuation_routes_by_building,
    run_dstar_lite_search,
)


def _cross_roads():
    """十字路网：水平路 y=105，垂直路 x=105，交于 (105,105)。"""
    return [
        {"id": "h", "x": 0, "y": 100, "w": 200, "h": 10},
        {"id": "v", "x": 100, "y": 0, "w": 10, "h": 200},
    ]


def _base_payload():
    return {
        "roads": _cross_roads(),
        "startPoint": {"x": 0, "y": 105},
        "startLabel": "入口A",
        "parkEntrances": [
            {"id": "exit-east", "label": "东出口", "x": 200, "y": 105},
            {"id": "exit-south", "label": "南出口", "x": 105, "y": 200},
        ],
    }


def test_plan_single_route_success():
    result = plan_evacuation_route(_base_payload())
    assert result["success"] is True
    assert result["planner"] == "road-dstar-lite-hazard-mask-py-v1"
    assert len(result["path"]) >= 2
    assert result["distanceMeters"] > 0
    assert result["estimatedTimeSec"] > 0
    # 候选路线与推荐 id 结构存在
    assert isinstance(result["candidateRoutes"], list)
    assert len(result["candidateRoutes"]) >= 1
    assert result["recommendedCandidateId"]
    # dangerMask 返回结构（前端契约）
    dm = result["dangerMask"]
    assert set(dm.keys()) == {"threshold", "blockedNodeCount", "blockedEdgeCount"}


def test_plan_single_route_uses_payload_map_scale():
    payload = _base_payload()
    payload["map"] = {"mapMetersPerUnit": 1.0}

    result = plan_evacuation_route(payload)

    assert result["success"] is True
    assert result["mapMetersPerUnit"] == 1.0
    assert result["distanceMeters"] == 200.0
    assert result["roadAccess"]["roadDistanceMeters"] == 200.0
    assert result["roadAccess"]["accessDistanceMeters"] == 0.0


def test_offroad_start_and_exit_are_projected_to_road_path():
    payload = {
        "roads": _cross_roads(),
        "startPoint": {"x": 20, "y": 40},
        "startLabel": "离路建筑入口",
        "parkEntrances": [
            {"id": "exit-offroad", "label": "离路园区出口", "x": 185, "y": 60},
        ],
    }

    result = plan_evacuation_route(payload)

    assert result["success"] is True
    assert result["path"][0] == {"x": 20.0, "y": 105.0}
    assert result["path"][-1] == {"x": 185.0, "y": 105.0}
    assert {"x": 20, "y": 40} not in result["path"]
    assert {"x": 185, "y": 60} not in result["path"]


def test_plan_route_blocked_by_gas():
    payload = _base_payload()
    # 阻断阈值与气体属性
    payload["gas"] = {"blockingThreshold": 10.0, "dangerThreshold": 20.0, "warningThreshold": 5.0}
    # 构造一张覆盖全图节点的浓度帧：仅东出口及其相邻节点高浓度，
    # 其余节点为 0，使南出口路线仍可通行（get_frame_concentration_at_point
    # 取最近 cell 的浓度，故需为每个关心的节点都给一个 cell）。
    payload["frame"] = {
        "cells": [
            {"x": 0, "y": 105, "concentration": 0.0},
            {"x": 105, "y": 105, "concentration": 0.0},
            {"x": 105, "y": 0, "concentration": 0.0},
            {"x": 105, "y": 200, "concentration": 0.0},
            {"x": 200, "y": 105, "concentration": 50.0},
        ]
    }
    result = plan_evacuation_route(payload)
    # 仍应有路可走（南出口未被阻断），且 dangerMask 计数应 > 0
    assert result["success"] is True
    assert result["dangerMask"]["blockedNodeCount"] >= 1
    assert result["replanned"] is True


def test_goal_switch_rebind():
    """复用同一 planner 切换目标：验证局部重绑后能正确规划到新目标。"""
    payload = _base_payload()
    graph = build_road_graph(payload["roads"])
    danger_mask = build_danger_mask(graph=graph, frame=None, gas={}, blocked_mask=None)
    east = "200.00,105.00"
    south = "105.00,200.00"
    start = "0.00,105.00"

    planner = create_dstar_planner(graph, east)
    path_east, planner = run_dstar_lite_search(
        planner=planner, graph=graph, start_node_id=start, goal_node_id=east, danger_mask=danger_mask
    )
    assert path_east and path_east[-1] == east

    # 用同一 planner 切换到南出口，重绑后应能到达新目标
    path_south, planner = run_dstar_lite_search(
        planner=planner, graph=graph, start_node_id=start, goal_node_id=south, danger_mask=danger_mask
    )
    assert path_south and path_south[-1] == south
    assert planner.goalNodeId == south


def test_plan_by_building():
    payload = _base_payload()
    del payload["startPoint"]
    del payload["startLabel"]
    payload["facilities"] = [{"id": "b1", "name": "1号楼"}]
    payload["buildingEntrances"] = [
        {"id": "e1", "parentId": "b1", "label": "1号楼出入口", "x": 0, "y": 105},
    ]
    result = plan_evacuation_routes_by_building(payload)
    assert result["totalBuildings"] == 1
    assert result["successCount"] == 1
    assert len(result["routesByBuilding"]) == 1
    assert result["routesByBuilding"][0]["status"] == "success"


def test_plan_by_building_reuses_exit_planner_cache():
    payload = _base_payload()
    del payload["startPoint"]
    del payload["startLabel"]
    payload["facilities"] = [{"id": "b1", "name": "1号楼"}, {"id": "b2", "name": "2号楼"}]
    payload["buildingEntrances"] = [
        {"id": "e1", "parentId": "b1", "label": "1号楼出入口", "x": 0, "y": 105},
        {"id": "e2", "parentId": "b2", "label": "2号楼出入口", "x": 105, "y": 0},
    ]

    created_goals = []
    applied_goals = []
    original_create = dstar_lite_module.create_dstar_planner
    original_apply = dstar_lite_module.apply_danger_mask_updates

    def counting_create(graph, goal_node_id):
        created_goals.append(goal_node_id)
        return original_create(graph, goal_node_id)

    def counting_apply(planner, graph, danger_mask):
        applied_goals.append(planner.goalNodeId)
        return original_apply(planner, graph, danger_mask)

    try:
        dstar_lite_module.create_dstar_planner = counting_create
        dstar_lite_module.apply_danger_mask_updates = counting_apply
        result = plan_evacuation_routes_by_building(payload)
    finally:
        dstar_lite_module.create_dstar_planner = original_create
        dstar_lite_module.apply_danger_mask_updates = original_apply

    expected_goals = {"200.00,105.00", "105.00,200.00"}
    assert result["totalBuildings"] == 2
    assert result["successCount"] == 2
    assert created_goals == list(dict.fromkeys(created_goals))
    assert set(created_goals) == expected_goals
    assert applied_goals == created_goals


def _run_all():
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"PASS {name}")
            except AssertionError as exc:
                failed += 1
                print(f"FAIL {name}: {exc}")
            except Exception as exc:  # noqa: BLE001
                failed += 1
                print(f"ERROR {name}: {type(exc).__name__}: {exc}")
    print(f"\n{'ALL PASS' if failed == 0 else f'{failed} FAILED'}")
    return failed


if __name__ == "__main__":
    sys.exit(_run_all())
