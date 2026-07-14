"""Regression tests for wind-projected timing constraints in source inversion."""

from __future__ import annotations

import sys

import numpy as np

from .forward_model import ForwardModel
from .grid_search import _arrival_consistency_score, _candidate_score_floor, _combine_candidate_score
from .plume_losses import compute_arrival_time_loss
from .particle_filter import ParticleFilterConfig, _extract_sensors, _log_likelihood


def _line_sensors():
    return [
        {
            "id": "S-near",
            "priority": 2,
            "mapPoint": {"x": 140.0, "y": 100.0},
            "signal": 12.0,
            "arrivalTimeSec": 12.0,
            "arrivalFrame": 3,
        },
        {
            "id": "S-mid",
            "priority": 1,
            "mapPoint": {"x": 190.0, "y": 100.0},
            "signal": 7.0,
            "arrivalTimeSec": 28.0,
            "arrivalFrame": 7,
        },
        {
            "id": "S-far",
            "priority": 0,
            "mapPoint": {"x": 260.0, "y": 100.0},
            "signal": 3.5,
            "arrivalTimeSec": 52.0,
            "arrivalFrame": 13,
        },
    ]


def test_particle_filter_keeps_sensor_arrival_times_from_payload():
    sensors = _extract_sensors(
        {
            "activeSensors": [_line_sensors()[0]],
            "config": {"minSignalThreshold": 0.1},
        }
    )

    assert sensors[0]["arrivalTimeSec"] == 12.0
    assert sensors[0]["arrivalFrame"] == 3


def test_particle_filter_arrival_likelihood_penalizes_far_upwind_shift():
    true_source = np.array([110.0, 100.0, 45.0])
    upstream_source = np.array([35.0, 100.0, 45.0])
    scenario = {
        "windSpeed": 3.0,
        "windDirection": 0.0,
        "mapMetersPerUnit": 1.0,
        "stabilityClass": "D",
        "releaseHeight": 2.0,
    }
    sensors = _line_sensors()
    forward_model = ForwardModel.from_scenario(sensors, scenario, {"molarMass": 28.97})
    observed = forward_model.predict(true_source[0], true_source[1], true_source[2])
    upstream_source[2] = forward_model.fit_emission_rate(upstream_source[0], upstream_source[1], observed)
    particles = np.vstack([true_source, upstream_source])
    arrivals = np.asarray([sensor["arrivalTimeSec"] for sensor in sensors], dtype=float)
    config = ParticleFilterConfig(arrival_time_weight=1.0, upwind_signal_weight=1.0)

    concentration_only = _log_likelihood(forward_model, particles, observed, config)
    timed = _log_likelihood(
        forward_model,
        particles,
        observed,
        config,
        observed_arrival_times=arrivals,
    )

    assert timed[0] - timed[1] > concentration_only[0] - concentration_only[1] + 1.0


def test_coarse_search_arrival_score_uses_wind_projected_absolute_time():
    sensors = [
        {"x": 140.0, "y": 100.0, "observedSignal": 12.0, "arrivalTimeSec": 12.0},
        {"x": 190.0, "y": 100.0, "observedSignal": 7.0, "arrivalTimeSec": 28.0},
        {"x": 260.0, "y": 100.0, "observedSignal": 3.5, "arrivalTimeSec": 52.0},
    ]

    true_score = _arrival_consistency_score(
        candidate_x=110.0,
        candidate_y=100.0,
        sensors=sensors,
        wind_speed=3.0,
        wind_direction=0.0,
        map_meters_per_unit=1.0,
    )
    far_upwind_score = _arrival_consistency_score(
        candidate_x=0.0,
        candidate_y=100.0,
        sensors=sensors,
        wind_speed=3.0,
        wind_direction=0.0,
        map_meters_per_unit=1.0,
    )

    assert true_score["score"] > far_upwind_score["score"] + 0.25
    assert far_upwind_score["absoluteRmseSec"] > true_score["absoluteRmseSec"]


def test_coarse_arrival_score_weights_near_high_signal_sensors():
    sensors = [
        {"x": 116.0, "y": 100.0, "observedSignal": 100.0, "arrivalTimeSec": 4.0},
        {"x": 220.0, "y": 100.0, "observedSignal": 2.0, "arrivalTimeSec": 45.0},
        {"x": 260.0, "y": 100.0, "observedSignal": 1.5, "arrivalTimeSec": 55.0},
        {"x": 300.0, "y": 100.0, "observedSignal": 1.0, "arrivalTimeSec": 65.0},
    ]

    true_score = _arrival_consistency_score(
        candidate_x=100.0,
        candidate_y=100.0,
        sensors=sensors,
        wind_speed=4.0,
        wind_direction=0.0,
        map_meters_per_unit=1.0,
    )
    far_upwind_score = _arrival_consistency_score(
        candidate_x=40.0,
        candidate_y=100.0,
        sensors=sensors,
        wind_speed=4.0,
        wind_direction=0.0,
        map_meters_per_unit=1.0,
    )

    assert true_score["score"] > far_upwind_score["score"]
    assert true_score["absoluteRmseSec"] < far_upwind_score["absoluteRmseSec"]


def test_coarse_score_does_not_let_arrival_only_candidate_rank_high():
    arrival_only = _combine_candidate_score(
        shape_score=-0.15,
        abs_score=0.05,
        arrival_score=0.95,
    )
    supported = _combine_candidate_score(
        shape_score=0.55,
        abs_score=0.70,
        arrival_score=0.65,
    )

    assert arrival_only < 0.35
    assert supported > arrival_only + 0.35


def test_coarse_candidate_score_floor_treats_top_k_as_upper_bound():
    floor = _candidate_score_floor(0.6243)

    assert floor > 0.50
    assert floor < 0.6243


def test_refinement_arrival_loss_rejects_same_wind_axis_upstream_shift():
    sensors = [
        {"mapPoint": {"x": 140.0, "y": 100.0}, "signal": 12.0, "arrivalTimeSec": 12.0},
        {"mapPoint": {"x": 190.0, "y": 100.0}, "signal": 7.0, "arrivalTimeSec": 28.0},
        {"mapPoint": {"x": 260.0, "y": 100.0}, "signal": 3.5, "arrivalTimeSec": 52.0},
    ]
    scenario = {"windSpeed": 3.0, "windDirection": 0.0, "mapMetersPerUnit": 1.0}

    true_loss = compute_arrival_time_loss({"x": 110.0, "y": 100.0}, sensors, scenario)
    far_upwind_loss = compute_arrival_time_loss({"x": 35.0, "y": 100.0}, sensors, scenario)

    assert far_upwind_loss > true_loss + 0.5


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
