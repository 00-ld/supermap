"""Shared runtime configuration helpers for algorithm FastAPI services."""

from __future__ import annotations

import logging
import os
from typing import Iterable

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


DEFAULT_ALGORITHM_CORS_ORIGINS = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "http://localhost:3000,"
    "http://localhost:8081"
)


def parse_bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


def algorithm_api_key() -> str | None:
    return os.getenv("ALGORITHM_API_KEY")


def algorithm_auth_required() -> bool:
    return parse_bool_env("ALGORITHM_REQUIRE_AUTH", True)


def parse_cors_origins(raw_origins: str | None = None, default_origins: str = DEFAULT_ALGORITHM_CORS_ORIGINS) -> list[str]:
    configured = raw_origins if raw_origins is not None else os.getenv("ALGORITHM_CORS_ORIGINS", default_origins)
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def install_algorithm_cors(app: FastAPI, default_origins: str = DEFAULT_ALGORITHM_CORS_ORIGINS) -> list[str]:
    allowed_origins = parse_cors_origins(default_origins=default_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
    return allowed_origins


def validate_algorithm_api_key(
  provided_key: str | None,
  *,
  service_name: str,
  api_key: str | None,
  require_auth: bool,
  logger: logging.Logger,
  invalid_message: str = "无效的算法服务密钥",
) -> None:
    if api_key is None:
        if require_auth:
            raise HTTPException(status_code=503, detail=f"{service_name}未配置密钥，拒绝服务")
        logger.warning("%s鉴权已被显式关闭，当前进程仅应绑定在本地开发地址", service_name)
        return
    if provided_key != api_key:
        raise HTTPException(status_code=401, detail=invalid_message)


def contains_cors_origin(origins: Iterable[str], origin: str) -> bool:
    return origin in set(origins)
