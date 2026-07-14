"""YOLO person detection service for Ackermann patrol car images."""

from __future__ import annotations

import base64
from datetime import UTC, datetime
import hashlib
import json
import logging
import os
from pathlib import Path
import socket
import time
import uuid

import cv2
import numpy as np
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse
from ultralytics import YOLO

from .response_utils import error_response, success_response
from .service_config import (
    algorithm_api_key,
    algorithm_auth_required,
    install_algorithm_cors,
    validate_algorithm_api_key,
)


logger = logging.getLogger("chemical-algorithm-yolo")

app = FastAPI(title="Chemical Park Patrol Vision Service", version="1.0.0")
allowed_origins = install_algorithm_cors(app)
_API_KEY = algorithm_api_key()
_REQUIRE_AUTH = algorithm_auth_required()
_REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
_YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", str(_REPOSITORY_ROOT / "models" / "yolo11m.pt"))
_MODEL_MANIFEST_PATH = Path(
    os.getenv("MODEL_MANIFEST_PATH", str(_REPOSITORY_ROOT / "models" / "manifest.json"))
)
_YOLO_MODEL_ID = os.getenv("YOLO_MODEL_ID", "yolo11m-person-detector")
_YOLO_MODEL_VERSION = os.getenv("YOLO_MODEL_VERSION", "")
_YOLO_DEVICE = os.getenv("YOLO_DEVICE", "cpu")
_YOLO_IMAGE_SIZE = int(os.getenv("YOLO_IMAGE_SIZE", "1024"))
_YOLO_CONFIDENCE = float(os.getenv("YOLO_CONFIDENCE", "0.35"))
_YOLO_CONFIG_VERSION = os.getenv(
    "YOLO_CONFIG_VERSION",
    f"imgsz-{_YOLO_IMAGE_SIZE}-conf-{_YOLO_CONFIDENCE}-device-{_YOLO_DEVICE}",
)

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"}
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
_PERSON_CLASS_ID = 0
_model: YOLO | None = None
_manifest_entry: dict[str, object] | None = None


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Return YOLO HTTP errors with the shared algorithm JSON envelope."""
    message = str(exc.detail) if exc.detail else "请求失败"
    return yolo_error_response(
        message,
        exc.status_code,
        request=request,
        input_summary=_request_input_summary(request),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected YOLO failures with the shared algorithm JSON envelope."""
    logger.exception("Unhandled YOLO service error: %s %s", request.method, request.url.path)
    return yolo_error_response(
        "YOLO 服务内部错误",
        500,
        request=request,
        input_summary=_request_input_summary(request),
    )


def _check_key(x_api_key: str | None) -> None:
    """Validate the shared algorithm service key."""
    validate_algorithm_api_key(
        x_api_key,
        service_name="YOLO 服务",
        api_key=_API_KEY,
        require_auth=_REQUIRE_AUTH,
        logger=logger,
    )


def _get_model() -> YOLO:
    """Load the YOLO model lazily so health/import checks do not need weights."""
    global _model
    if _model is None:
        model_path = Path(_YOLO_MODEL_PATH)
        if not model_path.exists():
            raise HTTPException(status_code=503, detail=f"YOLO 模型文件不存在: {_YOLO_MODEL_PATH}")
        _model = YOLO(str(model_path))
    return _model


def _load_manifest_entry() -> dict[str, object]:
    """Load the configured YOLO model entry from the tracked model manifest."""
    global _manifest_entry
    if _manifest_entry is not None:
        return _manifest_entry
    _manifest_entry = {}
    if not _MODEL_MANIFEST_PATH.exists():
        return _manifest_entry
    try:
        manifest = json.loads(_MODEL_MANIFEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("YOLO 模型清单读取失败: %s", exc)
        return _manifest_entry

    models = manifest.get("models", [])
    if not isinstance(models, list):
        return _manifest_entry
    for item in models:
        if isinstance(item, dict) and item.get("id") == _YOLO_MODEL_ID:
            _manifest_entry = item
            return _manifest_entry
    return _manifest_entry


def _model_identity() -> dict[str, object]:
    """Return traceable model identity without exposing local absolute paths."""
    manifest_entry = _load_manifest_entry()
    model_path = Path(_YOLO_MODEL_PATH)
    model_version = _YOLO_MODEL_VERSION or str(
        manifest_entry.get("version") or model_path.stem or "unversioned-yolo"
    )
    return {
        "modelId": _YOLO_MODEL_ID,
        "modelVersion": model_version,
        "modelPath": model_path.name,
        "modelManifestStatus": "matched" if manifest_entry else "missing-entry",
    }


def _utc_now_iso() -> str:
    """Return an API-friendly UTC timestamp with a stable Z suffix."""
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _resolve_request_id(x_request_id: str | None) -> str:
    """Use the upstream trace id when available, otherwise create one locally."""
    if x_request_id and x_request_id.strip():
        return x_request_id.strip()
    return str(uuid.uuid4())


def _resolve_request_id_from_request(request: Request | None) -> str:
    if request is None:
        return str(uuid.uuid4())
    return _resolve_request_id(request.headers.get("X-Request-Id"))


def _request_input_summary(request: Request | None) -> dict[str, object]:
    if request is None:
        summary = {
            "sourceType": "http-request",
            "method": None,
            "path": None,
            "contentType": None,
            "contentLength": None,
        }
        summary["payloadDigest"] = _payload_digest(summary)
        return summary
    summary = {
        "sourceType": "http-request",
        "method": request.method,
        "path": request.url.path,
        "contentType": request.headers.get("content-type"),
        "contentLength": request.headers.get("content-length"),
    }
    summary["payloadDigest"] = _payload_digest(summary)
    return summary


def _payload_digest(payload: object) -> str:
    serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]


def _bytes_digest(contents: bytes) -> str:
    return hashlib.sha256(contents).hexdigest()[:16]


def _upload_input_summary(file: UploadFile, contents: bytes | None = None) -> dict[str, object]:
    summary: dict[str, object] = {
        "sourceType": "uploaded-image",
        "filename": file.filename or "uploaded-image",
        "contentType": file.content_type,
    }
    if contents is not None:
        summary["sizeBytes"] = len(contents)
        summary["payloadDigest"] = _bytes_digest(contents)
    else:
        summary["payloadDigest"] = _payload_digest(summary)
    return summary


def _ensure_input_summary_digest(input_summary: dict[str, object] | None) -> dict[str, object]:
    summary = dict(input_summary or {})
    if "payloadDigest" not in summary:
        summary["payloadDigest"] = _payload_digest(summary)
    return summary


def yolo_error_response(
    message: str,
    status_code: int = 500,
    *,
    request: Request | None = None,
    request_id: str | None = None,
    started_at: float | None = None,
    input_summary: dict[str, object] | None = None,
    warnings: list[str] | None = None,
) -> JSONResponse:
    """Return a YOLO error envelope with the same trace fields as successful inference."""
    resolved_request_id = request_id or _resolve_request_id_from_request(request)
    started = started_at if started_at is not None else time.perf_counter()
    cost_ms = round((time.perf_counter() - started) * 1000, 2)
    model_identity = _model_identity()
    resolved_input_summary = _ensure_input_summary_digest(input_summary)
    payload = {
        "requestId": resolved_request_id,
        "status": "error",
        "inputSummary": resolved_input_summary,
        "algorithm": {
            "name": "yolo-person-detection",
            "version": model_identity["modelVersion"],
            "configVersion": _YOLO_CONFIG_VERSION,
            "modelId": model_identity["modelId"],
            "modelVersion": model_identity["modelVersion"],
            "modelPath": model_identity["modelPath"],
            "modelManifestStatus": model_identity["modelManifestStatus"],
        },
        "runtime": {
            "costMs": cost_ms,
            "worker": socket.gethostname(),
            "device": _YOLO_DEVICE,
            "imageSize": _YOLO_IMAGE_SIZE,
            "confidenceThreshold": _YOLO_CONFIDENCE,
        },
        "grayRelease": {
            "enabled": False,
            "channel": "stable",
            "trafficPercent": 100,
            "bucket": "stable",
            "rule": "no-gray-release-configured",
            "rollbackTarget": model_identity["modelVersion"],
            "fallbackUsed": False,
        },
        "fallback": {
            "used": False,
            "reason": None,
            "strategy": "NONE",
        },
        "warnings": warnings or [],
        "error": message,
        "errors": [message],
        "algorithmVersion": model_identity["modelVersion"],
        "configVersion": _YOLO_CONFIG_VERSION,
        "costMs": cost_ms,
        "worker": socket.gethostname(),
        **model_identity,
    }
    logger.warning(
        "YOLO inference failed: %s",
        json.dumps(
            {
                "event": "yolo_inference_failed",
                "requestId": resolved_request_id,
                "algorithmVersion": model_identity["modelVersion"],
                "configVersion": _YOLO_CONFIG_VERSION,
                "costMs": cost_ms,
                "success": False,
                "errorCode": status_code,
                "error": message,
                "inputSummary": payload["inputSummary"],
                "worker": socket.gethostname(),
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
    content = error_response(message, status_code, request_id=resolved_request_id)
    content["data"] = payload
    return JSONResponse(status_code=status_code, content=content)


def _box_values_to_detection(
    box_values: list[float],
    confidence: float,
    class_id: int,
    class_name: str,
    frame_index: int,
) -> dict[str, object]:
    """Convert one YOLO box into the public detection contract."""
    x1, y1, x2, y2 = [round(float(value), 2) for value in box_values]
    return {
        "frameIndex": frame_index,
        "bbox": {
            "format": "xyxy_pixel",
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "width": round(max(0.0, x2 - x1), 2),
            "height": round(max(0.0, y2 - y1), 2),
        },
        "confidence": round(float(confidence), 6),
        "classId": class_id,
        "className": class_name,
    }


def _structured_detections(result: object, frame_index: int = 0) -> list[dict[str, object]]:
    """Extract person detections with bbox, confidence, class and frame metadata."""
    boxes = getattr(result, "boxes", None)
    if boxes is None or len(boxes) == 0:
        return []

    names = getattr(result, "names", {}) or {}
    xyxy = boxes.xyxy.cpu().tolist()
    confidences = boxes.conf.cpu().tolist()
    classes = boxes.cls.cpu().tolist()

    detections: list[dict[str, object]] = []
    for box_values, confidence, class_value in zip(xyxy, confidences, classes, strict=True):
        class_id = int(class_value)
        class_name = str(names.get(class_id, "person") if isinstance(names, dict) else "person")
        detections.append(
            _box_values_to_detection(
                box_values=list(box_values),
                confidence=float(confidence),
                class_id=class_id,
                class_name=class_name,
                frame_index=frame_index,
            )
        )
    return detections


@app.get("/api/health")
async def health_check(request: Request) -> dict[str, object]:
    """Health check that does not force-load large YOLO weights."""
    request_id = _resolve_request_id_from_request(request)
    started_at = time.perf_counter()
    model_identity = _model_identity()
    cost_ms = round((time.perf_counter() - started_at) * 1000, 2)
    response_payload = {
        "status": "ok",
        "service": "chemical-yolo",
        "modelConfigured": bool(_YOLO_MODEL_PATH),
        "manifestPath": str(_MODEL_MANIFEST_PATH),
        "requestId": request_id,
        "inputSummary": _request_input_summary(request),
        "algorithm": {
            "name": "yolo-health",
            "version": model_identity["modelVersion"],
            "configVersion": _YOLO_CONFIG_VERSION,
            "modelId": model_identity["modelId"],
            "modelVersion": model_identity["modelVersion"],
            "modelPath": model_identity["modelPath"],
            "modelManifestStatus": model_identity["modelManifestStatus"],
        },
        "runtime": {
            "costMs": cost_ms,
            "worker": socket.gethostname(),
            "device": _YOLO_DEVICE,
            "imageSize": _YOLO_IMAGE_SIZE,
            "confidenceThreshold": _YOLO_CONFIDENCE,
        },
        "grayRelease": {
            "enabled": False,
            "channel": "stable",
            "trafficPercent": 100,
            "bucket": "stable",
            "rule": "no-gray-release-configured",
            "rollbackTarget": model_identity["modelVersion"],
            "fallbackUsed": False,
        },
        "fallback": {
            "used": False,
            "reason": None,
            "strategy": "NONE",
        },
        "warnings": [],
        "error": None,
        "errors": [],
        "algorithmVersion": model_identity["modelVersion"],
        "configVersion": _YOLO_CONFIG_VERSION,
        "costMs": cost_ms,
        "worker": socket.gethostname(),
        **model_identity,
    }
    return success_response(response_payload, request_id=request_id)


@app.post("/api/analysis/person")
async def detect_and_render(
    file: UploadFile = File(...),
    x_api_key: str | None = Header(default=None),
    x_request_id: str | None = Header(default=None, alias="X-Request-Id"),
):
    """Detect people in an uploaded patrol image and return an annotated JPEG."""
    request_id = _resolve_request_id(x_request_id)
    started_at = time.perf_counter()
    _check_key(x_api_key)

    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        return yolo_error_response(
            "仅支持 JPEG/PNG 图片",
            400,
            request_id=request_id,
            started_at=started_at,
            input_summary=_upload_input_summary(file),
        )

    contents = await file.read()
    if len(contents) > _MAX_UPLOAD_BYTES:
        return yolo_error_response(
            "图片过大，上传上限为 10MB",
            400,
            request_id=request_id,
            started_at=started_at,
            input_summary=_upload_input_summary(file, contents),
        )

    image_buffer = np.frombuffer(contents, np.uint8)
    image_bgr = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
    if image_bgr is None:
        return yolo_error_response(
            "无法解析图片",
            400,
            request_id=request_id,
            started_at=started_at,
            input_summary=_upload_input_summary(file, contents),
        )

    try:
        model = _get_model()
    except HTTPException as exc:
        return yolo_error_response(
            str(exc.detail),
            exc.status_code,
            request_id=request_id,
            started_at=started_at,
            input_summary=_upload_input_summary(file, contents),
        )

    results = model.predict(
        source=image_bgr,
        imgsz=_YOLO_IMAGE_SIZE,
        classes=[_PERSON_CLASS_ID],
        conf=_YOLO_CONFIDENCE,
        device=_YOLO_DEVICE,
    )

    result = results[0]
    annotated_image = result.plot(line_width=1, font_size=0.8)
    ok, encoded_image = cv2.imencode(".jpg", annotated_image, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not ok:
        return yolo_error_response(
            "检测结果图片编码失败",
            500,
            request_id=request_id,
            started_at=started_at,
            input_summary=_upload_input_summary(file, contents),
        )

    image_base64 = base64.b64encode(encoded_image).decode("utf-8")
    model_identity = _model_identity()
    frame_index = 0
    captured_at = _utc_now_iso()
    detections = _structured_detections(result, frame_index=frame_index)
    height, width = image_bgr.shape[:2]
    cost_ms = round((time.perf_counter() - started_at) * 1000, 2)
    input_summary = {
        "sourceType": "uploaded-image",
        "filename": file.filename or "uploaded-image",
        "contentType": file.content_type,
        "sizeBytes": len(contents),
        "imageWidth": width,
        "imageHeight": height,
        "frameCount": 1,
        "payloadDigest": _bytes_digest(contents),
    }
    warnings = ["carId not provided by upload endpoint; response keeps carId=null"] if file.filename else [
        "filename not provided by upload endpoint",
        "carId not provided by upload endpoint; response keeps carId=null",
    ]
    response_payload = {
        "requestId": request_id,
        "status": "success",
        "count": len(detections),
        "image_base64": f"data:image/jpeg;base64,{image_base64}",
        "detectionSchemaVersion": "yolo-detection/v1",
        "detections": detections,
        "frameIndex": frame_index,
        "carId": None,
        "carIdSource": "not-provided",
        "capturedAt": captured_at,
        "source": {
            "sourceType": "uploaded-image",
            "filename": file.filename or "uploaded-image",
            "contentType": file.content_type,
            "sizeBytes": len(contents),
        },
        "image": {
            "width": width,
            "height": height,
            "annotatedMimeType": "image/jpeg",
        },
        "inputSummary": input_summary,
        "algorithm": {
            "name": "yolo-person-detection",
            "version": model_identity["modelVersion"],
            "configVersion": _YOLO_CONFIG_VERSION,
            "modelId": model_identity["modelId"],
            "modelVersion": model_identity["modelVersion"],
            "modelPath": model_identity["modelPath"],
            "modelManifestStatus": model_identity["modelManifestStatus"],
        },
        "runtime": {
            "costMs": cost_ms,
            "worker": socket.gethostname(),
            "device": _YOLO_DEVICE,
            "imageSize": _YOLO_IMAGE_SIZE,
            "confidenceThreshold": _YOLO_CONFIDENCE,
        },
        "grayRelease": {
            "enabled": False,
            "channel": "stable",
            "trafficPercent": 100,
            "bucket": "stable",
            "rule": "no-gray-release-configured",
            "rollbackTarget": model_identity["modelVersion"],
            "fallbackUsed": False,
        },
        "fallback": {
            "used": False,
            "reason": None,
            "strategy": "NONE",
        },
        "warnings": warnings,
        "error": None,
        "errors": [],
        "algorithmVersion": model_identity["modelVersion"],
        "configVersion": _YOLO_CONFIG_VERSION,
        "costMs": cost_ms,
        "worker": socket.gethostname(),
        **model_identity,
        "analysis_info": (
            f"YOLO person detection, schema=yolo-detection/v1, model={model_identity['modelVersion']}, "
            f"imgsz={_YOLO_IMAGE_SIZE}, conf={_YOLO_CONFIDENCE}"
        ),
    }
    logger.info(
        "YOLO inference completed: %s",
        json.dumps(
            {
                "event": "yolo_inference_completed",
                "requestId": request_id,
                "algorithmVersion": model_identity["modelVersion"],
                "configVersion": _YOLO_CONFIG_VERSION,
                "costMs": cost_ms,
                "success": True,
                "errorCode": None,
                "inputSummary": input_summary,
                "detectionCount": len(detections),
                "worker": socket.gethostname(),
                "grayChannel": response_payload["grayRelease"]["channel"],
                "grayTrafficPercent": response_payload["grayRelease"]["trafficPercent"],
                "grayEnabled": response_payload["grayRelease"]["enabled"],
                "rollbackTarget": response_payload["grayRelease"]["rollbackTarget"],
                "fallbackUsed": response_payload["fallback"]["used"],
                "fallbackStrategy": response_payload["fallback"]["strategy"],
                "fallbackReason": response_payload["fallback"]["reason"],
            },
            ensure_ascii=False,
        ),
    )
    return success_response(response_payload, request_id=request_id)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("algorithm.polo:app", host="127.0.0.1", port=8001)
