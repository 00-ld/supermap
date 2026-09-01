"""Tests for shared algorithm service configuration helpers."""

from __future__ import annotations

import logging
import os
import unittest
from unittest.mock import patch

from fastapi import FastAPI, HTTPException

from algorithm.service_config import (
    algorithm_auth_required,
    contains_cors_origin,
    install_algorithm_cors,
    parse_bool_env,
    parse_cors_origins,
    validate_algorithm_api_key,
)


class AlgorithmServiceConfigTests(unittest.TestCase):
    def test_parse_bool_env_defaults_and_truthy_values(self) -> None:
        self.assertTrue(parse_bool_env("__MISSING_ALGORITHM_BOOL__", True))
        self.assertFalse(parse_bool_env("__MISSING_ALGORITHM_BOOL__", False))

    def test_algorithm_auth_required_defaults_to_true(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            self.assertTrue(algorithm_auth_required())

    def test_parse_cors_origins_trims_empty_entries(self) -> None:
        origins = parse_cors_origins(" http://localhost:5173, ,http://127.0.0.1:5173 ")

        self.assertEqual(origins, ["http://localhost:5173", "http://127.0.0.1:5173"])

    def test_install_algorithm_cors_uses_shared_default_surface(self) -> None:
        app = FastAPI()
        origins = install_algorithm_cors(app)

        self.assertTrue(contains_cors_origin(origins, "http://localhost:5173"))
        self.assertTrue(contains_cors_origin(origins, "http://127.0.0.1:5173"))
        self.assertTrue(contains_cors_origin(origins, "http://localhost:3000"))
        self.assertTrue(contains_cors_origin(origins, "http://localhost:8081"))

    def test_validate_algorithm_api_key_requires_configured_key_by_default(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            validate_algorithm_api_key(
                None,
                service_name="算法服务",
                api_key=None,
                require_auth=True,
                logger=logging.getLogger("test"),
            )

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(raised.exception.detail, "算法服务未配置密钥，拒绝服务")

    def test_validate_algorithm_api_key_rejects_bad_key(self) -> None:
        with self.assertRaises(HTTPException) as raised:
            validate_algorithm_api_key(
                "bad",
                service_name="YOLO 服务",
                api_key="secret",
                require_auth=True,
                logger=logging.getLogger("test"),
            )

        self.assertEqual(raised.exception.status_code, 401)

    def test_validate_algorithm_api_key_allows_explicitly_disabled_auth(self) -> None:
        validate_algorithm_api_key(
            None,
            service_name="算法服务",
            api_key="configured-local-key",
            require_auth=False,
            logger=logging.getLogger("test"),
        )


if __name__ == "__main__":
    unittest.main()
