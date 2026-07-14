"""Regression tests for source-inversion observation signal selection."""

from __future__ import annotations

import sys

from .inversion_dataset import build_active_sensors as build_refine_active_sensors


def _delayed_peak_sensor():
    return {
        "id": "S-delay",
        "priority": 2,
        "x": 120,
        "y": 80,
        "sampledPeak": 8.0,
        "sampledSeries": [
            {"frameIndex": 0, "timeSec": 0, "concentration": 0.0},
            {"frameIndex": 1, "timeSec": 10, "concentration": 0.2},
            {"frameIndex": 2, "timeSec": 20, "concentration": 8.0},
        ],
    }


def test_refinement_fallback_uses_peak_signal_when_current_frame_is_quiet():
    sensors = build_refine_active_sensors(
        sensors=None,
        fallback_sensors=[_delayed_peak_sensor()],
        current_frame_index=0,
        min_signal_threshold=1.0,
    )

    assert len(sensors) == 1
    assert sensors[0]["signal"] == 8.0
    assert sensors[0]["currentConcentration"] == 0.0


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
