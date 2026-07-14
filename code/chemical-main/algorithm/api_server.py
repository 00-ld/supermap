"""Chemical park gas detection and source tracing API server.

Integrates gas diffusion simulation, analytic source inversion, and
D* Lite emergency evacuation path planning into a unified FastAPI service.
YOLO visual detection runs independently on port 8001.

Typical usage:
    uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000 --reload
"""

from __future__ import annotations

import hashlib
import logging
import os
import json
from pathlib import Path
import socket
import time
from typing import Any, Dict
import uuid

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse

from .api_models import (
    AnalyticInversionRequest,
    CoarseSearchRequest,
    DiffusionSimulationRequest,
    EvacuationRequest,
    ParticleFilterRequest,
)
from .engine.task_router import route_task
from .planning.gas_catalog import get_gas_types_info
from .response_utils import error_response, success_response
from .service_config import (
    algorithm_api_key,
    algorithm_auth_required,
    install_algorithm_cors,
    validate_algorithm_api_key,
)


logger = logging.getLogger("chemical-algorithm")
AlgorithmResponse = Any
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
ALGORITHM_SERVICE_VERSION = "3.0.0"
ALGORITHM_CONFIG_VERSION = os.getenv("ALGORITHM_CONFIG_VERSION", "algorithm-config-2026-06-20")
ALGORITHM_RELEASE_CHANNEL = os.getenv("ALGORITHM_RELEASE_CHANNEL", "stable")
ALGORITHM_ROLLBACK_TARGET = os.getenv("ALGORITHM_ROLLBACK_TARGET", ALGORITHM_SERVICE_VERSION)
BTEX_VALIDATION_PATH = REPOSITORY_ROOT / "output" / "btex_real_validation.json"
PRAIRIE_GRASS_SOURCE_VALIDATION_PATH = (
    REPOSITORY_ROOT / "output" / "prairie_grass_source_inversion_validation.json"
)

app = FastAPI(title="Chemical Park Gas Detection and Tracing - Algorithm Service", version="3.0.0")

allowed_origins = install_algorithm_cors(app)
_API_KEY = algorithm_api_key()
_REQUIRE_AUTH = algorithm_auth_required()


async def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Validate the request X-API-Key header."""
    validate_algorithm_api_key(
        x_api_key,
        service_name="算法服务",
        api_key=_API_KEY,
        require_auth=_REQUIRE_AUTH,
        logger=logger,
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Return HTTP errors with the same JSON envelope as business errors."""
    message = str(exc.detail) if exc.detail else "请求失败"
    return algorithm_error_response(
        message,
        exc.status_code,
        request=request,
        algorithm_name="algorithm-http-exception",
        input_payload=_request_input_summary(request),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle uncaught exceptions with a uniform error response."""
    if isinstance(exc, (HTTPException, StarletteHTTPException)):
        return await http_exception_handler(request, exc)
    logger.exception("Unhandled algorithm service error: %s %s", request.method, request.url.path)
    return algorithm_error_response(
        "算法服务内部错误",
        500,
        request=request,
        algorithm_name="algorithm-unhandled-exception",
        input_payload=_request_input_summary(request),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """把 Pydantic 422 校验失败也包装进统一错误信封，避免裸 JSON 响应。"""
    detail = "; ".join(
        f"{'.'.join(str(loc) for loc in err['loc'] if loc != 'body')}: {err['msg']}"
        for err in exc.errors()
    )
    message = f"请求参数校验失败: {detail}" if detail else "请求参数校验失败"
    return algorithm_error_response(
        message,
        422,
        request=request,
        algorithm_name="algorithm-validation-error",
        input_payload=_request_input_summary(request),
    )


def algorithm_error_response(
    message: str,
    status_code: int = 500,
    *,
    request: Request | None = None,
    algorithm_name: str = "algorithm-task",
    started_at: float | None = None,
    input_payload: Any = None,
    warnings: list[str] | None = None,
) -> JSONResponse:
    """Return an error envelope with the same trace fields as successful algorithm results."""
    request_id = _resolve_request_id(request)
    started = started_at if started_at is not None else time.perf_counter()
    payload = _with_trace_metadata(
        {"status": "error", "error": message},
        request_id=request_id,
        algorithm_name=algorithm_name,
        started_at=started,
        input_summary=_input_summary(input_payload),
        warnings=warnings,
        errors=[message],
    )
    logger.warning(
        "Algorithm task failed: %s",
        json.dumps(
            {
                "event": "algorithm_task_failed",
                "requestId": request_id,
                "algorithmName": algorithm_name,
                "algorithmVersion": ALGORITHM_SERVICE_VERSION,
                "configVersion": ALGORITHM_CONFIG_VERSION,
                "costMs": payload["runtime"]["costMs"],
                "success": False,
                "errorCode": status_code,
                "error": message,
                "inputSummary": payload["inputSummary"],
                "worker": payload["runtime"]["worker"],
                "grayChannel": payload["grayRelease"]["channel"],
                "grayTrafficPercent": payload["grayRelease"]["trafficPercent"],
                "grayEnabled": payload["grayRelease"]["enabled"],
                "rollbackTarget": payload["grayRelease"]["rollbackTarget"],
                "fallbackUsed": payload["fallback"]["used"],
                "fallbackStrategy": payload["fallback"]["strategy"],
                "fallbackReason": payload["fallback"]["reason"],
            },
            ensure_ascii=False,
        ),
    )
    content = error_response(message, status_code, request_id=request_id)
    content["data"] = payload
    return JSONResponse(status_code=status_code, content=content)


def _resolve_request_id(request: Request | None) -> str:
    if request is None:
        return str(uuid.uuid4())
    header_value = request.headers.get("X-Request-Id")
    if header_value and header_value.strip():
        return header_value.strip()
    return str(uuid.uuid4())


def _request_input_summary(request: Request | None) -> Dict[str, Any]:
    if request is None:
        return {
            "sourceType": "http-request",
            "method": None,
            "path": None,
            "contentType": None,
            "contentLength": None,
        }
    return {
        "sourceType": "http-request",
        "method": request.method,
        "path": request.url.path,
        "contentType": request.headers.get("content-type"),
        "contentLength": request.headers.get("content-length"),
    }


def _payload_digest(payload: Any) -> str:
    try:
        serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    except TypeError:
        serialized = str(payload)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def _release_percent() -> int:
    try:
        return max(0, min(100, int(os.getenv("ALGORITHM_RELEASE_PERCENT", "100"))))
    except ValueError:
        return 100


def _gray_release_meta() -> Dict[str, Any]:
    traffic_percent = _release_percent()
    channel = ALGORITHM_RELEASE_CHANNEL.strip() or "stable"
    return {
        "channel": channel,
        "trafficPercent": traffic_percent,
        "enabled": channel not in {"stable", "prod", "production"} or traffic_percent < 100,
        "rollbackTarget": ALGORITHM_ROLLBACK_TARGET,
    }


def _fallback_meta(*, used: bool = False, reason: str | None = None, strategy: str = "NONE") -> Dict[str, Any]:
    return {
        "used": used,
        "reason": reason,
        "strategy": strategy,
    }


def _input_summary(payload: Any) -> Dict[str, Any]:
    if isinstance(payload, dict):
        payload_keys = sorted(str(key) for key in payload.keys())[:32]
        observation_payload = payload.get("observationPayload")
        if not isinstance(observation_payload, dict):
            observation_payload = {}
        observations = (
            payload.get("observations")
            or payload.get("activeSensors")
            or payload.get("sensors")
            or payload.get("sensorReadings")
            or observation_payload.get("observations")
            or observation_payload.get("activeSensors")
            or observation_payload.get("sensors")
            or observation_payload.get("sensorReadings")
        )
        candidates = (
            payload.get("candidateRegions")
            or payload.get("candidates")
            or observation_payload.get("candidateRegions")
            or observation_payload.get("candidates")
        )
        frames = payload.get("frames") or observation_payload.get("frames")
        refinement_config = payload.get("refinementConfig") or observation_payload.get("refinementConfig")
        return {
            "payloadType": "object",
            "payloadKeys": payload_keys,
            "payloadDigest": _payload_digest(payload),
            "sensorCount": len(observations) if isinstance(observations, list) else None,
            "candidateCount": len(candidates) if isinstance(candidates, list) else None,
            "frameCount": len(frames) if isinstance(frames, list) else None,
            "hasRefinementConfig": isinstance(refinement_config, dict) and bool(refinement_config),
        }
    if isinstance(payload, list):
        return {
            "payloadType": "array",
            "itemCount": len(payload),
            "payloadDigest": _payload_digest(payload),
        }
    return {
        "payloadType": type(payload).__name__,
        "payloadDigest": _payload_digest(payload),
    }


def _with_trace_metadata(
    result: Any,
    *,
    request_id: str,
    algorithm_name: str,
    started_at: float,
    input_summary: Dict[str, Any],
    warnings: list[str] | None = None,
    errors: list[str] | None = None,
) -> Dict[str, Any]:
    payload = dict(result) if isinstance(result, dict) else {"result": result}
    cost_ms = round((time.perf_counter() - started_at) * 1000, 2)
    payload.setdefault("requestId", request_id)
    payload.setdefault("algorithm", {
        "name": algorithm_name,
        "version": ALGORITHM_SERVICE_VERSION,
        "configVersion": ALGORITHM_CONFIG_VERSION,
    })
    payload.setdefault("runtime", {
        "costMs": cost_ms,
        "worker": socket.gethostname(),
    })
    payload.setdefault("inputSummary", input_summary)
    payload.setdefault("warnings", warnings or [])
    payload.setdefault("error", None)
    payload.setdefault("errors", errors or ([] if payload.get("error") is None else [str(payload["error"])]))
    payload.setdefault("algorithmVersion", payload["algorithm"]["version"])
    payload.setdefault("configVersion", payload["algorithm"]["configVersion"])
    payload.setdefault("costMs", payload["runtime"]["costMs"])
    payload.setdefault("worker", payload["runtime"]["worker"])
    payload.setdefault("grayRelease", _gray_release_meta())
    payload.setdefault("fallback", _fallback_meta())
    return payload


def _success_with_trace(
    result: Any,
    *,
    request: Request | None,
    algorithm_name: str,
    started_at: float,
    input_payload: Any,
    warnings: list[str] | None = None,
) -> Dict[str, Any]:
    request_id = _resolve_request_id(request)
    payload = _with_trace_metadata(
        result,
        request_id=request_id,
        algorithm_name=algorithm_name,
        started_at=started_at,
        input_summary=_input_summary(input_payload),
        warnings=warnings,
    )
    logger.info(
        "Algorithm task completed: %s",
        json.dumps(
            {
                "event": "algorithm_task_completed",
                "requestId": request_id,
                "algorithmName": algorithm_name,
                "algorithmVersion": ALGORITHM_SERVICE_VERSION,
                "configVersion": ALGORITHM_CONFIG_VERSION,
                "costMs": payload["runtime"]["costMs"],
                "success": True,
                "errorCode": None,
                "inputSummary": payload["inputSummary"],
                "worker": payload["runtime"]["worker"],
                "grayChannel": payload["grayRelease"]["channel"],
                "grayTrafficPercent": payload["grayRelease"]["trafficPercent"],
                "grayEnabled": payload["grayRelease"]["enabled"],
                "rollbackTarget": payload["grayRelease"]["rollbackTarget"],
                "fallbackUsed": payload["fallback"]["used"],
                "fallbackStrategy": payload["fallback"]["strategy"],
                "fallbackReason": payload["fallback"]["reason"],
            },
            ensure_ascii=False,
        ),
    )
    return success_response(payload, request_id=request_id)


@app.get("/api/gas-types", dependencies=[Depends(require_api_key)])
async def gas_types(request: Request) -> AlgorithmResponse:
    """Get information about all supported gas types."""
    started_at = time.perf_counter()
    try:
        return _success_with_trace(
            get_gas_types_info(),
            request=request,
            algorithm_name="gas-types-catalog",
            started_at=started_at,
            input_payload={},
        )
    except Exception:
        logger.exception("gas_types query failed")
        return algorithm_error_response(
            "气体类型查询失败",
            request=request,
            algorithm_name="gas-types-catalog",
            started_at=started_at,
            input_payload={},
        )


@app.post("/api/engine/run", dependencies=[Depends(require_api_key)])
async def run_engine_task(data: Dict[str, Any], request: Request) -> AlgorithmResponse:
    """Unified algorithm engine entrypoint compatible with Pyodide worker tasks."""
    return _run_engine_task(data, request=request)


def _run_engine_task(data: Dict[str, Any], request: Request | None = None) -> AlgorithmResponse:
    task_type = data.get("task_type", "")
    payload = data.get("payload", {})
    started_at = time.perf_counter()
    try:
        result = route_task(task_type, payload)
        return _success_with_trace(
            result,
            request=request,
            algorithm_name=str(task_type or "engine-task"),
            started_at=started_at,
            input_payload=payload,
        )
    except ValueError as exc:
        logger.warning("run_engine_task rejected input, task_type=%s: %s", task_type, exc)
        return algorithm_error_response(
            str(exc),
            400,
            request=request,
            algorithm_name=str(task_type or "engine-task"),
            started_at=started_at,
            input_payload=payload,
        )
    except Exception:
        logger.exception("run_engine_task failed, task_type=%s", task_type)
        return algorithm_error_response(
            "算法引擎执行失败",
            request=request,
            algorithm_name=str(task_type or "engine-task"),
            started_at=started_at,
            input_payload=payload,
        )


@app.post("/api/diffusion/simulate", dependencies=[Depends(require_api_key)])
async def diffusion_simulate(data: DiffusionSimulationRequest, request: Request) -> Dict[str, Any]:
    """Quick-access endpoint for diffusion simulation."""
    return _run_engine_task(
        {"task_type": "run_diffusion_simulation", "payload": data.model_dump()},
        request=request,
    )


@app.post("/api/inversion/coarse-search", dependencies=[Depends(require_api_key)])
async def grid_search(data: CoarseSearchRequest, request: Request) -> Dict[str, Any]:
    """Quick-access endpoint for coarse grid source search."""
    return _run_engine_task(
        {"task_type": "run_grid_search", "payload": data.model_dump()},
        request=request,
    )


@app.post("/api/inversion/solve", dependencies=[Depends(require_api_key)])
async def analytic_inversion(data: AnalyticInversionRequest, request: Request) -> Dict[str, Any]:
    """Quick-access endpoint for analytic source inversion."""
    return _run_engine_task(
        {"task_type": "run_analytic_inversion", "payload": data.model_dump()},
        request=request,
    )


@app.post("/api/inversion/particle-filter", dependencies=[Depends(require_api_key)])
async def particle_filter_inversion(data: ParticleFilterRequest, request: Request) -> Dict[str, Any]:
    """Quick-access endpoint for improved particle-filter source inversion."""
    return _run_engine_task(
        {"task_type": "run_particle_filter_inversion", "payload": data.model_dump()},
        request=request,
    )


@app.get("/api/deep-learning/btex-validation", dependencies=[Depends(require_api_key)])
async def btex_validation_report(request: Request) -> Dict[str, Any]:
    """Return the local real-data validation report for the deep gas surrogate."""
    started_at = time.perf_counter()
    input_payload = {"reportPath": str(BTEX_VALIDATION_PATH.relative_to(REPOSITORY_ROOT))}
    try:
        report = _load_validation_report(
            BTEX_VALIDATION_PATH,
            missing_detail=(
                "BTEX 真实数据验证报告不存在，请先运行 "
                "python -m algorithm.deep_learning.validate_btex_real_data --epochs 700"
            ),
            invalid_detail="BTEX 真实数据验证报告格式错误",
        )
    except HTTPException as exc:
        return algorithm_error_response(
            str(exc.detail),
            exc.status_code,
            request=request,
            algorithm_name="btex-validation-report",
            started_at=started_at,
            input_payload=input_payload,
        )
    return _success_with_trace(
        report,
        request=request,
        algorithm_name="btex-validation-report",
        started_at=started_at,
        input_payload=input_payload,
    )


@app.get("/api/deep-learning/prairie-grass-source-validation", dependencies=[Depends(require_api_key)])
async def prairie_grass_source_validation_report(request: Request) -> Dict[str, Any]:
    """Return the local real-data source-localization validation report."""
    started_at = time.perf_counter()
    input_payload = {"reportPath": str(PRAIRIE_GRASS_SOURCE_VALIDATION_PATH.relative_to(REPOSITORY_ROOT))}
    try:
        report = _load_validation_report(
            PRAIRIE_GRASS_SOURCE_VALIDATION_PATH,
            missing_detail=(
                "Prairie Grass 溯源验证报告不存在，请先运行 "
                "python tools\\prepare_prairie_grass_source_validation_data.py --write; "
                "python -m algorithm.inversion.validate_prairie_grass_source_inversion"
            ),
            invalid_detail="Prairie Grass 溯源验证报告格式错误",
        )
    except HTTPException as exc:
        return algorithm_error_response(
            str(exc.detail),
            exc.status_code,
            request=request,
            algorithm_name="prairie-grass-source-validation-report",
            started_at=started_at,
            input_payload=input_payload,
        )
    return _success_with_trace(
        report,
        request=request,
        algorithm_name="prairie-grass-source-validation-report",
        started_at=started_at,
        input_payload=input_payload,
    )


def _load_validation_report(path: Path, missing_detail: str, invalid_detail: str) -> Dict[str, Any]:
    if not path.exists():
        raise HTTPException(status_code=404, detail=missing_detail)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.exception("Validation report is invalid JSON: %s", path)
        raise HTTPException(status_code=500, detail=invalid_detail) from exc


@app.post("/api/planning/evacuation", dependencies=[Depends(require_api_key)])
async def evacuation_planning(data: EvacuationRequest, request: Request) -> Dict[str, Any]:
    """Quick-access endpoint for evacuation planning."""
    return _run_engine_task(
        {"task_type": "run_evacuation_planning", "payload": data.model_dump()},
        request=request,
    )


@app.get("/api/health")
async def health_check(request: Request) -> Dict[str, Any]:
    """Health check endpoint."""
    started_at = time.perf_counter()
    return _success_with_trace(
        {"status": "ok", "version": ALGORITHM_SERVICE_VERSION, "service": "chemical-algorithm"},
        request=request,
        algorithm_name="algorithm-health",
        started_at=started_at,
        input_payload={},
    )


if __name__ == "__main__":
    uvicorn.run("algorithm.api_server:app", host="127.0.0.1", port=8000, reload=True)
