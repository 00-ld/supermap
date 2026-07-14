"""Tests for the public evacuation planning runner contract."""

from __future__ import annotations

import unittest

from algorithm.planning.evacuation_runner import run_evacuation_planning_task


def _cross_roads() -> list[dict[str, float | str]]:
    return [
        {"id": "h", "x": 0, "y": 100, "w": 200, "h": 10},
        {"id": "v", "x": 100, "y": 0, "w": 10, "h": 200},
    ]


def _base_payload() -> dict:
    return {
        "roads": _cross_roads(),
        "startPoint": {"x": 0, "y": 105},
        "startLabel": "入口A",
        "parkEntrances": [
            {"id": "exit-east", "label": "东出口", "x": 200, "y": 105},
            {"id": "exit-south", "label": "南出口", "x": 105, "y": 200},
        ],
    }


class EvacuationRunnerPublicContractTests(unittest.TestCase):
    def test_single_route_exposes_reachability_without_internal_success(self) -> None:
        result = run_evacuation_planning_task(_base_payload())

        self.assertIs(result["isReachable"], True)
        self.assertNotIn("success", result)
        self.assertIn("executor", result)
        for candidate in result["candidateRoutes"]:
            self.assertIn("isReachable", candidate)
            self.assertNotIn("success", candidate)

    def test_batch_route_exposes_reachability_without_legacy_counts(self) -> None:
        payload = _base_payload()
        del payload["startPoint"]
        del payload["startLabel"]
        payload["facilities"] = [{"id": "b1", "name": "1号楼"}, {"id": "b2", "name": "2号楼"}]
        payload["buildingEntrances"] = [
            {"id": "e1", "parentId": "b1", "label": "1号楼出入口", "x": 0, "y": 105},
            {"id": "e2", "parentId": "b2", "label": "2号楼出入口", "x": 105, "y": 0},
        ]

        result = run_evacuation_planning_task(payload)

        self.assertIs(result["hasAnyReachable"], True)
        self.assertEqual(result["reachableCount"], 2)
        self.assertNotIn("success", result)
        self.assertNotIn("hasAnySuccess", result)
        self.assertNotIn("successCount", result)
        self.assertIn("executor", result)
        for route in result["routesByBuilding"]:
            self.assertIn("isReachable", route)
            self.assertNotIn("success", route)


if __name__ == "__main__":
    unittest.main()
