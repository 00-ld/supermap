"""端到端契约测试：用 FastAPI TestClient 真实跑算法，断言输出 schema。

与 test_api_server_http_semantics.py 的区别：后者 mock route_task 只验证 trace 信封；
本测试不打 mock，走完整 HTTP → 鉴权 → Pydantic 校验 → task_router → 算法 → 统一信封链路，
断言每个端点输出 schema 的关键字段存在性与类型。
"""

from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from algorithm import api_server


class AlgorithmEndpointsContractTests(unittest.TestCase):
    """算法服务端点端到端契约测试。"""

    @classmethod
    def setUpClass(cls) -> None:
        cls._old_key = api_server._API_KEY
        cls._old_auth = api_server._REQUIRE_AUTH
        # 关闭鉴权，让 TestClient 无需 X-API-Key
        api_server._API_KEY = None
        api_server._REQUIRE_AUTH = False
        cls.client = TestClient(api_server.app)

    @classmethod
    def tearDownClass(cls) -> None:
        api_server._API_KEY = cls._old_key
        api_server._REQUIRE_AUTH = cls._old_auth

    # ---- 辅助构造 ----

    @staticmethod
    def _diffusion_payload() -> dict:
        return {
            "gasId": "nh3",
            "sourceMapPoint": {"x": 500, "y": 300},
            "sourceRate": 50,
            "releaseDuration": 60,
            "windSpeed": 3,
            "windDirection": 90,
            "stabilityClass": "D",
            "frameCount": 3,
            "frameStepSec": 1,
            "facilities": [
                {"id": "f1", "type": "tank", "x": 100, "y": 100, "w": 40, "h": 40},
            ],
            "sensors": [
                {"id": "s1", "x": 600, "y": 350},
                {"id": "s2", "x": 400, "y": 250},
            ],
        }

    @staticmethod
    def _active_sensors() -> list[dict]:
        """带 signal 的活跃传感器，直接驱动粗搜索与溯源。"""
        return [
            {"id": "s1", "x": 600, "y": 350, "signal": 80.0, "priority": 2, "arrivalTimeSec": 30},
            {"id": "s2", "x": 400, "y": 250, "signal": 45.0, "priority": 1, "arrivalTimeSec": 50},
            {"id": "s3", "x": 300, "y": 450, "signal": 20.0, "priority": 0, "arrivalTimeSec": 70},
        ]

    @staticmethod
    def _scenario() -> dict:
        return {
            "windSpeed": 3.0,
            "windDirection": 90,
            "stabilityClass": "D",
            "terrainRoughness": 0.45,
            "mapMetersPerUnit": 0.5,
            "mapWidth": 1000,
            "mapHeight": 650,
        }

    @staticmethod
    def _gas() -> dict:
        return {
            "gasId": "nh3",
            "warningThreshold": 25,
            "dangerThreshold": 50,
        }

    @staticmethod
    def _roads() -> list[dict]:
        return [
            {"id": "road1", "x": 100, "y": 300, "w": 400, "h": 20},
            {"id": "road2", "x": 480, "y": 100, "w": 20, "h": 400},
        ]

    # ---- 通用信封断言 ----

    def _assert_success_envelope(self, body: dict, algorithm_name: str) -> dict:
        self.assertTrue(body["ok"], body)
        self.assertEqual(body["code"], 200)
        data = body["data"]
        self.assertEqual(data["algorithm"]["name"], algorithm_name)
        self.assertEqual(data["algorithmVersion"], api_server.ALGORITHM_SERVICE_VERSION)
        self.assertEqual(data["configVersion"], api_server.ALGORITHM_CONFIG_VERSION)
        self.assertIsInstance(data["costMs"], (int, float))
        self.assertIn("worker", data)
        self.assertIn("requestId", data)
        self.assertIn("inputSummary", data)
        self.assertIn("grayRelease", data)
        self.assertIn("fallback", data)
        self.assertEqual(data["errors"], [])
        self.assertIsNone(data["error"])
        return data

    # ---- 1. 扩散仿真 ----

    def test_diffusion_simulate_returns_full_schema(self) -> None:
        resp = self.client.post("/api/diffusion/simulate", json=self._diffusion_payload())
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_diffusion_simulation")

        self.assertEqual(data["gas"]["id"], "nh3")
        self.assertIsInstance(data["sourcePoint"], dict)
        self.assertIn("x", data["sourcePoint"])
        self.assertIsInstance(data["map"], dict)
        self.assertIn("width", data["map"])
        self.assertIn("gridSize", data["map"])
        self.assertEqual(len(data["frames"]), 3)
        frame = data["frames"][0]
        self.assertIn("frameIndex", frame)
        self.assertIn("timeSec", frame)
        self.assertIn("maxConcentration", frame)
        self.assertIn("affectedArea", frame)
        self.assertIn("cells", frame)
        self.assertIsInstance(frame["cells"], list)
        self.assertIn("plume", frame)
        self.assertIn("sensorReadings", frame)
        self.assertIn("stats", data)
        self.assertIn("peakConcentration", data["stats"])
        self.assertIn("sensorSeries", data)
        self.assertIn("scenarioMeta", data)
        self.assertEqual(data["scenarioMeta"]["gasId"], "nh3")
        self.assertEqual(data["executor"]["mode"], "worker-pyodide")

    def test_diffusion_missing_gas_id_returns_422(self) -> None:
        resp = self.client.post("/api/diffusion/simulate", json={"windSpeed": 3})
        self.assertEqual(resp.status_code, 422)
        body = resp.json()
        self.assertFalse(body["ok"])
        self.assertEqual(body["code"], 422)
        self.assertIn("gasId", body["data"]["errors"][0])
        self.assertEqual(body["data"]["algorithm"]["name"], "algorithm-validation-error")

    def test_diffusion_extra_fields_allowed(self) -> None:
        """extra=allow：前端多传未知字段不应被拒。"""
        payload = self._diffusion_payload()
        payload["unknownFutureField"] = "透传"
        resp = self.client.post("/api/diffusion/simulate", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)

    # ---- 2. 粗搜索 ----

    def test_coarse_search_returns_candidate_schema(self) -> None:
        payload = {
            "sensors": self._active_sensors(),
            "gas": self._gas(),
            "scenario": self._scenario(),
            "config": {"gridStep": 40, "topK": 3, "candidateRadius": 45},
        }
        resp = self.client.post("/api/inversion/coarse-search", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_grid_search")

        self.assertIn("candidateRegions", data)
        self.assertIsInstance(data["candidateRegions"], list)
        self.assertIn("meta", data)
        self.assertEqual(data["meta"]["gasId"], "nh3")
        self.assertIn("model", data["meta"])
        if data["candidateRegions"]:
            cand = data["candidateRegions"][0]
            self.assertIn("candidateId", cand)
            self.assertIn("rank", cand)
            self.assertIn("center", cand)
            self.assertIn("score", cand)
            self.assertIn("bounds", cand)
            self.assertIn("geoCenter", cand)

    # ---- 3. 解析溯源（两阶段 EKI）----

    def test_analytic_inversion_returns_estimated_source(self) -> None:
        # 先跑粗搜索拿候选，再喂给 solve，形成真实链路
        coarse_payload = {
            "sensors": self._active_sensors(),
            "gas": self._gas(),
            "scenario": self._scenario(),
            "config": {"gridStep": 40, "topK": 2, "candidateRadius": 45},
        }
        coarse = self.client.post("/api/inversion/coarse-search", json=coarse_payload)
        self.assertEqual(coarse.status_code, 200, coarse.text)
        candidates = coarse.json()["data"]["candidateRegions"]
        self.assertGreater(len(candidates), 0, "粗搜索应返回候选区域")

        solve_payload = {
            "sensors": self._active_sensors(),
            "gas": self._gas(),
            "scenario": self._scenario(),
            "candidateRegions": candidates,
            "refinementConfig": {"animationSteps": 10, "ekiConvergenceRatio": 0.05},
        }
        resp = self.client.post("/api/inversion/solve", json=solve_payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_analytic_inversion")

        self.assertIn("estimatedSource", data)
        self.assertIn("mapPoint", data["estimatedSource"])
        self.assertIn("emissionRate", data["estimatedSource"])
        self.assertIn("confidenceRadius", data)
        self.assertIn("iterations", data)
        self.assertIsInstance(data["iterations"], list)
        self.assertGreater(len(data["iterations"]), 0)
        self.assertIn("shrinkFrames", data)
        self.assertIn("lossHistory", data)
        self.assertIn("errorMetrics", data)
        self.assertIn("finalLoss", data["errorMetrics"])
        self.assertIn("optimizerConverged", data["errorMetrics"])
        self.assertIn("summary", data)

    def test_analytic_inversion_no_candidates_returns_400(self) -> None:
        payload = {
            "sensors": self._active_sensors(),
            "gas": self._gas(),
            "scenario": self._scenario(),
            "candidateRegions": [],
        }
        resp = self.client.post("/api/inversion/solve", json=payload)
        self.assertEqual(resp.status_code, 400)
        body = resp.json()
        self.assertFalse(body["ok"])
        self.assertIn("candidate", body["data"]["errors"][0])

    # ---- 4. 粒子滤波溯源 ----

    def test_particle_filter_returns_posterior(self) -> None:
        payload = {
            "sensors": self._active_sensors(),
            "gas": self._gas(),
            "scenario": self._scenario(),
            "particleFilterConfig": {"num_particles": 200, "iterations": 6, "seed": 42},
        }
        resp = self.client.post("/api/inversion/particle-filter", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_particle_filter_inversion")

        self.assertIn("estimatedSource", data)
        self.assertIn("mapPoint", data["estimatedSource"])
        self.assertIn("emissionRate", data["estimatedSource"])
        self.assertIn("credibleRadius95m", data["estimatedSource"])
        self.assertIn("posterior", data)
        self.assertIn("credibleIntervals", data["posterior"])
        self.assertIn("covariance", data["posterior"])
        self.assertIn("splitRhat", data["posterior"])
        self.assertIn("posteriorDensityGeoJSON", data)
        self.assertEqual(data["posteriorDensityGeoJSON"]["type"], "FeatureCollection")
        self.assertGreater(len(data["posteriorDensityGeoJSON"]["features"]), 0)
        self.assertEqual(
            data["posteriorDensityGeoJSON"]["metadata"]["interpolation"],
            "weighted-gaussian-kde",
        )
        self.assertIn("diagnostics", data)
        self.assertIn("particles", data["diagnostics"])
        self.assertIn("effectiveSampleSize", data["diagnostics"])
        self.assertIn("errorMetrics", data)
        self.assertIn("history", data)
        self.assertIsInstance(data["history"], list)

    def test_particle_filter_no_sensors_returns_400(self) -> None:
        resp = self.client.post("/api/inversion/particle-filter", json={"gas": self._gas()})
        self.assertEqual(resp.status_code, 400)

    # ---- 5. 疏散规划 ----

    def test_evacuation_single_start_returns_reachability(self) -> None:
        payload = {
            "roads": self._roads(),
            "gas": self._gas(),
            "frame": {"cells": []},
            "startPoint": {"x": 120, "y": 310},
            "parkEntrances": [{"id": "exit1", "x": 480, "y": 480, "label": "南门"}],
        }
        resp = self.client.post("/api/planning/evacuation", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_evacuation_planning")

        self.assertIn("isReachable", data)
        self.assertIn("path", data)
        self.assertIn("distanceMeters", data)
        self.assertIn("estimatedTimeSec", data)
        self.assertIn("dangerMask", data)
        self.assertEqual(data["planner"], "road-dstar-lite-hazard-mask-py-v1")
        self.assertIn("executor", data)

    def test_evacuation_batch_buildings_returns_routes(self) -> None:
        payload = {
            "roads": self._roads(),
            "gas": self._gas(),
            "frame": {"cells": []},
            "buildingEntrances": [
                {"buildingId": "b1", "x": 120, "y": 310},
                {"buildingId": "b2", "x": 460, "y": 120},
            ],
            "parkEntrances": [{"id": "exit1", "x": 480, "y": 480, "label": "南门"}],
        }
        resp = self.client.post("/api/planning/evacuation", json=payload)
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_evacuation_planning")

        self.assertIn("routesByBuilding", data)
        self.assertEqual(len(data["routesByBuilding"]), 2)
        self.assertIn("hasAnyReachable", data)
        self.assertIn("reachableCount", data)
        self.assertEqual(data["reachableCount"], sum(1 for r in data["routesByBuilding"] if r["isReachable"]))

    # ---- 6. 气体目录 ----

    def test_gas_types_returns_catalog(self) -> None:
        resp = self.client.get("/api/gas-types")
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "gas-types-catalog")
        # 4 种气体
        for key in ("CH4", "NH3", "CO", "O2"):
            self.assertIn(key, data)
            entry = data[key]
            self.assertIn("value", entry)
            self.assertIn("name", entry)
            self.assertIn("color", entry)
            self.assertIn("molecularWeight", entry)
            self.assertIn("safetyThreshold", entry)
            self.assertIn("idlhThreshold", entry)

    # ---- 7. 健康检查 ----

    def test_health_returns_ok(self) -> None:
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "algorithm-health")
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "chemical-algorithm")
        self.assertEqual(data["version"], api_server.ALGORITHM_SERVICE_VERSION)

    # ---- 8. 通用引擎入口（保留 Dict，验证 task_type 路由）----

    def test_engine_run_routes_diffusion(self) -> None:
        resp = self.client.post(
            "/api/engine/run",
            json={"task_type": "run_diffusion_simulation", "payload": self._diffusion_payload()},
        )
        self.assertEqual(resp.status_code, 200, resp.text)
        data = self._assert_success_envelope(resp.json(), "run_diffusion_simulation")
        self.assertEqual(len(data["frames"]), 3)

    def test_engine_run_unsupported_task_returns_400(self) -> None:
        resp = self.client.post(
            "/api/engine/run",
            json={"task_type": "nonexistent_task", "payload": {}},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(resp.json()["ok"])


if __name__ == "__main__":
    unittest.main()
