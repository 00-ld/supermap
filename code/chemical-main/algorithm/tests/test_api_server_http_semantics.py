"""Regression tests for algorithm API HTTP status semantics."""

from __future__ import annotations

import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from starlette.responses import JSONResponse

from algorithm import api_server
from algorithm import polo
from algorithm.api_models import (
    AnalyticInversionRequest,
    CoarseSearchRequest,
    DiffusionSimulationRequest,
    EvacuationRequest,
    ParticleFilterRequest,
)


class AlgorithmApiHttpSemanticsTests(unittest.TestCase):
    def setUp(self) -> None:
        self._old_api_key = api_server._API_KEY
        self._old_require_auth = api_server._REQUIRE_AUTH
        api_server._API_KEY = None
        api_server._REQUIRE_AUTH = False

    def tearDown(self) -> None:
        api_server._API_KEY = self._old_api_key
        api_server._REQUIRE_AUTH = self._old_require_auth

    def test_invalid_engine_task_returns_http_400(self) -> None:
        response = api_server._run_engine_task({"task_type": "missing_task", "payload": {}})

        self.assertIsInstance(response, JSONResponse)
        self.assertEqual(response.status_code, 400)
        body = json.loads(response.body)
        self.assertFalse(body["ok"])
        self.assertNotIn("success", body)
        self.assertNotIn("error", body)
        self.assertEqual(body["code"], 400)
        self.assertIn("Unsupported task type", body["message"])
        self.assertIn("requestId", body["data"])
        self.assertIn("inputSummary", body["data"])
        self.assertIn("algorithm", body["data"])
        self.assertIn("runtime", body["data"])
        self.assertEqual(body["data"]["algorithmVersion"], api_server.ALGORITHM_SERVICE_VERSION)
        self.assertEqual(body["data"]["configVersion"], api_server.ALGORITHM_CONFIG_VERSION)
        self.assertIsInstance(body["data"]["costMs"], (int, float))
        self.assertIn("worker", body["data"])
        self.assertNotIn("success", body["data"])
        self.assertIn("grayRelease", body["data"])
        self.assertIn("rollbackTarget", body["data"]["grayRelease"])
        self.assertEqual(body["data"]["fallback"]["used"], False)
        self.assertEqual(body["data"]["fallback"]["strategy"], "NONE")
        self.assertIn("errors", body["data"])
        self.assertIn(body["message"], body["data"]["errors"])

    def test_engine_runtime_error_returns_http_500(self) -> None:
        with patch.object(api_server, "route_task", side_effect=RuntimeError("boom")):
            response = api_server._run_engine_task({"task_type": "run_diffusion_simulation", "payload": {}})

        self.assertIsInstance(response, JSONResponse)
        self.assertEqual(response.status_code, 500)
        body = json.loads(response.body)
        self.assertFalse(body["ok"])
        self.assertNotIn("success", body)
        self.assertNotIn("error", body)
        self.assertEqual(body["code"], 500)
        self.assertEqual(body["message"], "算法引擎执行失败")
        self.assertEqual(body["data"]["algorithm"]["name"], "run_diffusion_simulation")
        self.assertEqual(body["data"]["algorithmVersion"], api_server.ALGORITHM_SERVICE_VERSION)
        self.assertEqual(body["data"]["configVersion"], api_server.ALGORITHM_CONFIG_VERSION)
        self.assertIsInstance(body["data"]["costMs"], (int, float))
        self.assertIn("grayRelease", body["data"])
        self.assertEqual(body["data"]["error"], "算法引擎执行失败")
        self.assertNotIn("success", body["data"])
        self.assertIn("errors", body["data"])
        self.assertIn("算法引擎执行失败", body["data"]["errors"])
        self.assertEqual(body["data"]["fallback"]["used"], False)
        self.assertEqual(body["data"]["fallback"]["strategy"], "NONE")

    def test_input_summary_counts_nested_observation_payload(self) -> None:
        summary = api_server._input_summary(
            {
                "observationPayload": {
                    "sensors": [{"id": "s1"}, {"id": "s2"}, {"id": "s3"}],
                    "frames": [{"t": 0}, {"t": 1}],
                },
                "candidateRegions": [{"candidateId": "c1"}],
                "refinementConfig": {"topK": 1},
            }
        )

        self.assertEqual(summary["payloadType"], "object")
        self.assertEqual(summary["sensorCount"], 3)
        self.assertEqual(summary["candidateCount"], 1)
        self.assertEqual(summary["frameCount"], 2)
        self.assertTrue(summary["hasRefinementConfig"])

    def test_public_algorithm_endpoints_expose_trace_envelope(self) -> None:
        async def call_endpoint(path: str):
            base_payload = {
                "gasId": "co",
                "sensors": [{"id": "s1"}, {"id": "s2"}],
                "frames": [{"frameIndex": 0}],
            }
            if path == "diffusion":
                return await api_server.diffusion_simulate(
                    DiffusionSimulationRequest(**base_payload), None
                )
            if path == "coarse":
                return await api_server.grid_search(CoarseSearchRequest(**base_payload), None)
            if path == "analytic":
                return await api_server.analytic_inversion(
                    AnalyticInversionRequest(**base_payload), None
                )
            if path == "particle":
                return await api_server.particle_filter_inversion(
                    ParticleFilterRequest(**base_payload), None
                )
            if path == "planning":
                return await api_server.evacuation_planning(
                    EvacuationRequest(**base_payload), None
                )
            raise AssertionError(path)

        task_names = []

        def fake_route_task(task_type, payload):
            task_names.append(task_type)
            return {"taskEcho": task_type, "result": {"ok": True}}

        with patch.object(api_server, "route_task", side_effect=fake_route_task):
            responses = [
                asyncio.run(call_endpoint("diffusion")),
                asyncio.run(call_endpoint("coarse")),
                asyncio.run(call_endpoint("analytic")),
                asyncio.run(call_endpoint("particle")),
                asyncio.run(call_endpoint("planning")),
            ]

        self.assertEqual(
            task_names,
            [
                "run_diffusion_simulation",
                "run_grid_search",
                "run_analytic_inversion",
                "run_particle_filter_inversion",
                "run_evacuation_planning",
            ],
        )
        for response in responses:
            self.assertTrue(response["ok"])
            self.assertEqual(response["code"], 200)
            data = response["data"]
            self.assertIn("requestId", data)
            self.assertIn("algorithm", data)
            self.assertIn("runtime", data)
            self.assertIn("inputSummary", data)
            self.assertIn("warnings", data)
            self.assertIn("errors", data)
            self.assertEqual(data["errors"], [])
            self.assertIn("grayRelease", data)
            self.assertIn("fallback", data)
            self.assertEqual(data["algorithmVersion"], api_server.ALGORITHM_SERVICE_VERSION)
            self.assertEqual(data["configVersion"], api_server.ALGORITHM_CONFIG_VERSION)
            self.assertEqual(data["fallback"]["used"], False)
            self.assertEqual(data["fallback"]["strategy"], "NONE")
            self.assertIn("payloadDigest", data["inputSummary"])
            self.assertEqual(data["inputSummary"]["sensorCount"], 2)
            self.assertEqual(data["inputSummary"]["frameCount"], 1)

    def test_legacy_gas_path_and_time_series_are_not_public_routes(self) -> None:
        routes = {route.path for route in api_server.app.routes}

        self.assertNotIn("/api/gas-path", routes)
        self.assertNotIn("/api/time-series", routes)

    def test_health_response_exposes_deployment_trace_fields(self) -> None:
        response = asyncio.run(api_server.health_check(None))

        self.assertTrue(response["ok"])
        self.assertNotIn("success", response)
        self.assertNotIn("error", response)
        data = response["data"]
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["algorithm"]["name"], "algorithm-health")
        self.assertEqual(data["algorithmVersion"], api_server.ALGORITHM_SERVICE_VERSION)
        self.assertEqual(data["configVersion"], api_server.ALGORITHM_CONFIG_VERSION)
        self.assertIsInstance(data["costMs"], (int, float))
        self.assertIn("worker", data)
        self.assertIn("grayRelease", data)
        self.assertEqual(data["grayRelease"]["rollbackTarget"], api_server.ALGORITHM_ROLLBACK_TARGET)
        self.assertIn("errors", data)
        self.assertEqual(data["errors"], [])
        self.assertEqual(data["fallback"]["used"], False)
        self.assertEqual(data["fallback"]["strategy"], "NONE")

    def test_required_auth_without_key_returns_http_503(self) -> None:
        api_server._REQUIRE_AUTH = True
        api_server._API_KEY = None

        with self.assertRaises(api_server.HTTPException) as raised:
            asyncio.run(api_server.require_api_key(None))
        response = asyncio.run(api_server.http_exception_handler(None, raised.exception))

        self.assertEqual(response.status_code, 503)
        body = json.loads(response.body)
        self.assertFalse(body["ok"])
        self.assertNotIn("success", body)
        self.assertNotIn("error", body)
        self.assertEqual(body["code"], 503)
        self.assertEqual(body["message"], "算法服务未配置密钥，拒绝服务")
        self.assertIn("requestId", body)
        self.assertIn("data", body)
        self.assertEqual(body["data"]["algorithm"]["name"], "algorithm-http-exception")
        self.assertIn("requestId", body["data"])
        self.assertIn("inputSummary", body["data"])
        self.assertIn("runtime", body["data"])
        self.assertIn("grayRelease", body["data"])
        self.assertIn("errors", body["data"])
        self.assertIn("算法服务未配置密钥，拒绝服务", body["data"]["errors"])
        self.assertEqual(body["data"]["algorithmVersion"], api_server.ALGORITHM_SERVICE_VERSION)
        self.assertEqual(body["data"]["fallback"]["used"], False)
        self.assertEqual(body["data"]["fallback"]["strategy"], "NONE")

    def test_yolo_input_summaries_include_payload_digest(self) -> None:
        class UploadStub:
            filename = "patrol.jpg"
            content_type = "image/jpeg"

        without_contents = polo._upload_input_summary(UploadStub())
        with_contents = polo._upload_input_summary(UploadStub(), b"fake-image-bytes")

        self.assertIn("payloadDigest", without_contents)
        self.assertIn("payloadDigest", with_contents)
        self.assertEqual(with_contents["payloadDigest"], polo._bytes_digest(b"fake-image-bytes"))
        self.assertNotEqual(without_contents["payloadDigest"], with_contents["payloadDigest"])

    def test_yolo_health_and_error_payloads_expose_errors_array(self) -> None:
        health = asyncio.run(polo.health_check(None))
        self.assertNotIn("success", health["data"])
        self.assertEqual(health["data"]["errors"], [])
        self.assertEqual(health["data"]["modelPath"], "yolo11m.pt")
        self.assertIn("models", str(polo._YOLO_MODEL_PATH).replace("\\", "/"))

        response = polo.yolo_error_response(
            "bad image",
            400,
            request_id="request-yolo-error",
            input_summary={"sourceType": "test"},
        )
        body = json.loads(response.body)
        self.assertEqual(response.status_code, 400)
        self.assertNotIn("success", body["data"])
        self.assertEqual(body["data"]["errors"], ["bad image"])
        self.assertIn("payloadDigest", body["data"]["inputSummary"])

    def test_yolo_success_payload_exposes_trace_contract(self) -> None:
        class UploadStub:
            filename = "patrol.jpg"
            content_type = "image/jpeg"

            async def read(self) -> bytes:
                return b"fake-image-bytes"

        class TensorListStub:
            def __init__(self, values):
                self._values = values

            def cpu(self):
                return self

            def tolist(self):
                return self._values

        class BoxesStub:
            xyxy = TensorListStub([[10, 20, 30, 50]])
            conf = TensorListStub([0.87654321])
            cls = TensorListStub([0])

            def __len__(self) -> int:
                return 1

        class ResultStub:
            boxes = BoxesStub()
            names = {0: "person"}

            def plot(self, line_width: int, font_size: float):
                return SimpleNamespace(line_width=line_width, font_size=font_size)

        class ModelStub:
            def predict(self, **kwargs):
                return [ResultStub()]

        with (
            patch.object(polo, "_check_key"),
            patch.object(polo, "_get_model", return_value=ModelStub()),
            patch.object(polo.cv2, "imdecode", return_value=SimpleNamespace(shape=(80, 120, 3))),
            patch.object(polo.cv2, "imencode", return_value=(True, b"encoded-jpeg-bytes")),
        ):
            response = asyncio.run(
                polo.detect_and_render(
                    UploadStub(),
                    x_api_key=None,
                    x_request_id="request-yolo-success",
                )
            )

        self.assertTrue(response["ok"])
        self.assertEqual(response["code"], 200)
        self.assertEqual(response["requestId"], "request-yolo-success")
        self.assertNotIn("success", response)

        data = response["data"]
        self.assertEqual(data["requestId"], "request-yolo-success")
        self.assertNotIn("success", data)
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["errors"], [])
        self.assertIn("warnings", data)
        self.assertEqual(data["inputSummary"]["payloadDigest"], polo._bytes_digest(b"fake-image-bytes"))
        self.assertEqual(data["inputSummary"]["imageWidth"], 120)
        self.assertEqual(data["inputSummary"]["imageHeight"], 80)
        self.assertEqual(data["algorithm"]["name"], "yolo-person-detection")
        self.assertIn("version", data["algorithm"])
        self.assertIn("configVersion", data["algorithm"])
        self.assertIsInstance(data["runtime"]["costMs"], (int, float))
        self.assertIn("worker", data["runtime"])
        self.assertIn("grayRelease", data)
        self.assertEqual(data["grayRelease"]["rollbackTarget"], data["algorithm"]["version"])
        self.assertIn("fallback", data)
        self.assertEqual(data["fallback"]["used"], False)
        self.assertEqual(data["fallback"]["strategy"], "NONE")


if __name__ == "__main__":
    unittest.main()
