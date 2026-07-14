"""Regression tests for source-inversion candidate validation."""

from __future__ import annotations

import sys

from .inversion_dataset import (
    build_candidate_regions_from_refinement,
    normalize_coarse_search_payload,
    normalize_inversion_payload,
)
from .particle_filter import _extract_sensors
from .source_inversion import prepare_candidate_regions, run_two_stage_inversion


def _assert_raises_value_error(fn, expected_message: str) -> None:
    try:
        fn()
    except ValueError as exc:
        assert expected_message in str(exc)
        return
    raise AssertionError("expected ValueError")


def test_prepare_candidate_regions_does_not_create_fallback_candidate():
    assert prepare_candidate_regions([]) == []


def test_prepare_candidate_regions_requires_candidate_center():
    _assert_raises_value_error(
        lambda: prepare_candidate_regions([{"candidateId": "cand-bad"}]),
        "missing center",
    )


def test_refinement_coarse_candidate_without_center_is_not_converted_to_default_point():
    assert build_candidate_regions_from_refinement({"candidateId": "cand-bad"}) == []


def test_two_stage_inversion_rejects_missing_candidate_regions():
    _assert_raises_value_error(
        lambda: run_two_stage_inversion({"activeSensors": [], "candidateRegions": []}),
        "coarse candidate region",
    )


def test_inversion_payload_rejects_legacy_export_aliases_by_default():
    for legacy_key in ("exportPayload", "pinnExportPayload", "trainingConfig"):
        _assert_raises_value_error(
            lambda key=legacy_key: normalize_inversion_payload({key: {"sensors": []}}),
            "legacy inversion payload aliases are disabled",
        )


def test_coarse_search_payload_rejects_legacy_export_aliases_by_default():
    for legacy_key in ("exportPayload", "pinnExportPayload", "trainingConfig"):
        _assert_raises_value_error(
            lambda key=legacy_key: normalize_coarse_search_payload({key: {"sensors": []}}),
            "legacy inversion payload aliases are disabled",
        )


def test_particle_filter_rejects_legacy_sensor_aliases_by_default():
    for legacy_key in ("exportPayload", "pinnExportPayload", "trainingConfig"):
        _assert_raises_value_error(
            lambda key=legacy_key: _extract_sensors({key: {"sensors": []}}),
            "legacy particle-filter payload aliases are disabled",
        )


def test_current_payload_schema_still_normalizes():
    payload = {
        "observationPayload": {
            "gas": {"id": "ch4"},
            "scenario": {"windSpeed": 1.5, "windDirection": 90},
            "sensors": [
                {"id": "s1", "mapPoint": {"x": 10, "y": 20}, "signal": 2.5},
            ],
        },
        "refinementInput": {
            "refinementConfig": {"topK": 2, "minSignalThreshold": 0.5},
            "coarseCandidate": {"candidateId": "c1", "center": {"x": 10, "y": 20}, "radius": 30},
        },
    }

    dataset = normalize_inversion_payload(payload)

    assert dataset["gas"]["id"] == "ch4"
    assert dataset["refinementConfig"]["topK"] == 2
    assert len(dataset["activeSensors"]) == 1
    assert len(dataset["candidateRegions"]) == 1


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
