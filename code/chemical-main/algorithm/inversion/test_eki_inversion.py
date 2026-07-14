"""Tests for the Ensemble Kalman Inversion (EKI) source-term estimator.

Validates that EKI, driven by the physically consistent Gaussian-plume forward
model, recovers a known leak source location and emission rate from noisy
synthetic sensor readings, and that the posterior covariance behaves sensibly
(contracts for well-posed layouts, stays wide for ill-posed ones).

Run directly:
    python -m algorithm.inversion.test_eki_inversion
"""
import sys

import numpy as np

from .eki import covariance_to_radius, run_eki
from .forward_model import MIN_EMISSION_RATE, ForwardModel

MAP_METERS_PER_UNIT = 0.5


def _make_forward(sensors, scenario, gas):
    """Build a forward model and a state->observation closure for EKI."""
    fm = ForwardModel.from_scenario(sensors, scenario, gas)

    def forward(theta):
        return fm.predict(theta[0], theta[1], np.exp(theta[2]))

    return fm, forward


def _weighted_centroid(fm, observed):
    """Signal-weighted sensor centroid, used as the EKI prior mean."""
    weights = np.maximum(observed, 0.01)
    cx = float(np.sum(fm.sensor_x * weights) / weights.sum())
    cy = float(np.sum(fm.sensor_y * weights) / weights.sum())
    return cx, cy


def run_one(name, true_source, wind_speed, wind_direction, emission, sensors, max_err_m=50.0):
    """Run EKI on one synthetic scenario and report location / rate errors."""
    scenario = {
        "windSpeed": wind_speed,
        "windDirection": wind_direction,
        "stabilityClass": "D",
        "terrainRoughness": 0.45,
    }
    gas = {"molarMass": 34.08}
    fm, forward = _make_forward(sensors, scenario, gas)

    rng = np.random.default_rng(2)
    clean = fm.predict(true_source[0], true_source[1], emission)
    observed = np.maximum(clean * (1.0 + 0.05 * rng.standard_normal(clean.shape)), 0.0)

    cx, cy = _weighted_centroid(fm, observed)
    prior_mean = np.array([cx, cy, np.log(20.0)])
    prior_std = np.array([100.0, 100.0, 1.3])
    max_signal = float(np.max(observed)) or 1.0
    noise_std = np.maximum(0.05 * observed, max(0.02 * max_signal, 1e-2))

    result = run_eki(
        forward=forward,
        observed=observed,
        prior_mean=prior_mean,
        prior_std=prior_std,
        noise_std=noise_std,
        max_iterations=30,
        convergence_ratio=0.005,
        bounds={
            "x": (40.0, 961.0),
            "y": (40.0, 611.0),
            "logq": (np.log(MIN_EMISSION_RATE), np.log(1.0e5)),
        },
    )

    mx, my, _ = result.final_mean
    est_rate = fm.fit_emission_rate(mx, my, observed)
    err_px = float(np.hypot(mx - true_source[0], my - true_source[1]))
    err_m = err_px * MAP_METERS_PER_UNIT
    rate_err = abs(est_rate - emission) / emission * 100.0
    radius_start = covariance_to_radius(result.cov_history[0], 2.45)
    radius_end = covariance_to_radius(result.cov_history[-1], 2.45)

    passed = err_m <= max_err_m
    print(f"  [{'PASS' if passed else 'FAIL'}] {name}")
    print(f"      est=({mx:.0f},{my:.0f}) true=({true_source[0]},{true_source[1]}) err={err_m:.1f}m")
    print(f"      Q_est={est_rate:.1f} g/s true={emission:.0f} ({rate_err:.0f}% off)")
    print(f"      iters={result.iterations} converged={result.converged} "
          f"radius {radius_start:.0f}->{radius_end:.0f}px")
    return passed, err_m, rate_err


def main():
    """Run the EKI test battery and return a process exit code."""
    print("=" * 60)
    print("EKI Source-Term Estimation Tests")
    print("=" * 60)

    cases = [
        ("S1 south wind, 8 sensors", (520, 310), 1.5, 90, 50.0,
         [{"x": 510, "y": 340}, {"x": 530, "y": 380}, {"x": 500, "y": 430},
          {"x": 540, "y": 360}, {"x": 460, "y": 350}, {"x": 580, "y": 370},
          {"x": 510, "y": 480}, {"x": 560, "y": 310}]),
        ("S2 east wind, 6 sensors", (300, 300), 2.0, 0, 80.0,
         [{"x": 360, "y": 300}, {"x": 420, "y": 320}, {"x": 480, "y": 290},
          {"x": 400, "y": 260}, {"x": 350, "y": 340}, {"x": 500, "y": 310}]),
        ("S3 weak F-class wind", (450, 250), 0.8, 90, 40.0,
         [{"x": 450, "y": 300}, {"x": 460, "y": 360}, {"x": 440, "y": 420},
          {"x": 480, "y": 330}, {"x": 420, "y": 330}]),
    ]

    results = []
    rate_ok = True
    for case in cases:
        passed, err_m, rate_err = run_one(*case)
        results.append((case[0], passed, err_m))
        # Emission rate should be within 25% for these well-posed layouts.
        if rate_err > 25.0:
            rate_ok = False

    print("\n" + "=" * 60)
    all_pass = all(p for _, p, _ in results) and rate_ok
    for name, passed, err_m in results:
        print(f"  [{'PASS' if passed else 'FAIL'}] {name}: {err_m:.1f}m")
    print(f"\n  Location: {sum(1 for _, p, _ in results if p)}/{len(results)} passed")
    print(f"  Emission rate within 25%: {'PASS' if rate_ok else 'FAIL'}")
    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
