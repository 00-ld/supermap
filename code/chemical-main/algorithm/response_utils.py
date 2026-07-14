"""Unified API response helpers for the Python algorithm service."""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict


def success_response(
    data: Any = None,
    code: int = 200,
    message: str = "成功",
    request_id: str | None = None,
) -> Dict[str, Any]:
    """Build a successful response compatible with the project JSON envelope."""
    return _build_response(code=code, message=message, data=data, ok=True, request_id=request_id)


def error_response(message: str, code: int = 500, request_id: str | None = None) -> Dict[str, Any]:
    """Build an error response compatible with the project JSON envelope."""
    return _build_response(code=code, message=message, data=None, ok=False, request_id=request_id)


def _build_response(
    code: int,
    message: str,
    data: Any,
    ok: bool,
    request_id: str | None = None,
) -> Dict[str, Any]:
    """Create the shared response body for algorithm HTTP envelopes."""
    resolved_request_id = request_id or str(uuid.uuid4())
    return {
        "code": code,
        "message": message,
        "data": data,
        "ok": ok,
        "timestamp": int(time.time() * 1000),
        "requestId": resolved_request_id,
    }
