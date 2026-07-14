"""Regression tests for diffusion input-contract validation."""

from __future__ import annotations

import sys

from .gaussian_plume import normalize_stability
from .phase1_diffusion import get_gas_by_id, parse_float


def _assert_raises_value_error(fn, expected_message: str) -> None:
    try:
        fn()
    except ValueError as exc:
        assert expected_message in str(exc)
        return
    raise AssertionError("expected ValueError")


def test_normalize_stability_rejects_unknown_labels():
    _assert_raises_value_error(lambda: normalize_stability("Z"), "invalid stabilityClass")


def test_get_gas_by_id_rejects_unknown_gas():
    _assert_raises_value_error(lambda: get_gas_by_id("h2s"), "unsupported gasId")


def test_get_gas_by_id_accepts_case_insensitive_known_gas():
    gas = get_gas_by_id("NH3")
    assert gas["id"] == "nh3"


def test_parse_float_defaults_only_when_missing():
    assert parse_float(None, 25.0, "ambientTemperature") == 25.0
    assert parse_float("", 25.0, "ambientTemperature") == 25.0


def test_parse_float_rejects_malformed_present_value():
    _assert_raises_value_error(lambda: parse_float("hot", 25.0, "ambientTemperature"), "must be a number")


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
