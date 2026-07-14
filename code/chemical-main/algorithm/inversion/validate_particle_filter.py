"""Terminal validation for improved particle-filter gas source inversion.

This script performs four checks:

1. Real-data diffusion sanity check on the Prairie Grass field sample. This
   validates the physical dispersion-width model against measured ``Sy (m)``.
2. Known-truth source inversion from simulated concentration observations.
3. Noisy and boundary-layout stress cases for localization and source strength.
4. Repeatability across independent particle-filter seeds.

The source-inversion observations are generated from the same auditable
conditioned advection-diffusion physics used by the backend. They are not presented as field
accident measurements; the real field-data part is the Prairie Grass dispersion
width validation.

Threshold basis:

* Prairie Grass check uses FB/NMSE/FAC2, common atmospheric-dispersion model
  performance metrics documented by Chang & Hanna (2004) and already used in
  the project diffusion module.
* The paper reproduced here reports natural-gas source-location errors below
  5% of the search interval and source-strength errors below 8% of the search
  interval. Each case below prints both the stricter engineering pass limit and
  the paper-style interval-normalized error.
* The high-noise diagonal case is intentionally looser because the same paper
  reports that large sensor measurement error can create multiple particle
  clusters and prevent all source parameters from being accurately estimated.

Run from the repository root:

    python -m algorithm.inversion.validate_particle_filter
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np

ALGORITHM_ROOT = Path(__file__).resolve().parents[1]

from ..diffusion.test_real_prairie_grass import run_prairie_grass_validation
from .forward_model import ForwardModel
from .particle_filter import (
    ParticleFilterConfig,
    ParticleFilterResult,
    run_particle_filter,
)


MAP_METERS_PER_UNIT = 0.5
REPOSITORY_ROOT = ALGORITHM_ROOT.parent


@dataclass(frozen=True)
class ValidationCase:
    """One source-inversion validation case."""

    name: str
    true_source: tuple[float, float]
    emission_rate_g_s: float
    wind_speed_m_s: float
    wind_direction_deg: float
    stability_class: str
    sensor_points: tuple[tuple[float, float], ...]
    x_bounds: tuple[float, float]
    y_bounds: tuple[float, float]
    q_bounds: tuple[float, float]
    noise_relative: float
    observation_seed: int
    filter_seed: int
    max_location_error_m: float
    max_emission_error_pct: float
    num_particles: int = 7000
    iterations: int = 22


def main() -> int:
    """Run the validation battery and return a process exit code."""

    print("=" * 88)
    print("Improved particle-filter gas source inversion validation")
    print(f"Repository: {REPOSITORY_ROOT}")
    print("=" * 88)
    print_threshold_basis()

    checks: list[tuple[str, bool]] = []
    checks.append(("real Prairie Grass dispersion width", validate_real_prairie_grass()))

    case_results = []
    for case in build_validation_cases():
        case_result = run_case(case)
        case_results.append(case_result)
        checks.append((case.name, case_result["passed"]))

    checks.append(("repeatability across independent seeds", validate_repeatability()))

    print("\n" + "=" * 88)
    print("Summary")
    print("-" * 88)
    for label, passed in checks:
        print(f"[{'PASS' if passed else 'FAIL'}] {label}")

    passed_all = all(passed for _, passed in checks)
    print("=" * 88)
    print("[PASS] Validation battery completed." if passed_all else "[FAIL] Validation battery failed.")
    return 0 if passed_all else 1


def print_threshold_basis() -> None:
    """Print the rationale for pass/fail thresholds."""

    print("\nThreshold basis")
    print("-" * 88)
    print("Prairie Grass: real field Sy samples are checked with FB, NMSE, and FAC2.")
    print(
        "Source inversion: paper-style target is location error <= 5% of search "
        "interval and Q error <= 8% of Q interval."
    )
    print(
        "Engineering limits below are stricter in nominal cases; the high-noise "
        "stress case is allowed more error but still stays within the paper-style "
        "interval criteria."
    )


def validate_real_prairie_grass() -> bool:
    """Run the committed Prairie Grass real-data dispersion-width check."""

    result = run_prairie_grass_validation()
    classic = result["classic"]
    passed = bool(result["passed"])

    print("\n[1] Real field-data dispersion validation: Prairie Grass Sy")
    print("-" * 88)
    print(f"experiments={result['experiment_count']} samples={result['sample_count']}")
    print(
        "classic:    "
        f"FB={classic['FB']:.4f} NMSE={classic['NMSE']:.4f} FAC2={classic['FAC2']:.3f}"
    )
    print("[PASS] real-data Sy validation" if passed else "[FAIL] real-data Sy validation")
    return passed


def run_case(case: ValidationCase) -> dict[str, object]:
    """Generate observations, run PF, and evaluate one known-truth case."""

    sensors = [{"mapPoint": {"x": x, "y": y}, "signal": 0.0} for x, y in case.sensor_points]
    scenario = {
        "windSpeed": case.wind_speed_m_s,
        "windDirection": case.wind_direction_deg,
        "stabilityClass": case.stability_class,
        "terrainRoughness": 0.30,
        "releaseHeight": 1.5,
        "ambientTemperature": 20.0,
        "pressurePa": 101325.0,
    }
    gas = {"molarMass": 16.04}
    forward_model = ForwardModel.from_scenario(sensors, scenario, gas)

    clean = forward_model.predict(case.true_source[0], case.true_source[1], case.emission_rate_g_s)
    rng = np.random.default_rng(case.observation_seed)
    observed = np.maximum(clean * (1.0 + case.noise_relative * rng.standard_normal(clean.shape)), 0.0)

    config = ParticleFilterConfig(
        num_particles=case.num_particles,
        iterations=case.iterations,
        sensor_noise_relative=max(case.noise_relative, 0.05),
        model_noise_relative=0.05,
        min_noise_ppm=max(float(np.max(clean)) * 0.001, 1e-4),
        seed=case.filter_seed,
        x_bounds=case.x_bounds,
        y_bounds=case.y_bounds,
        q_bounds=case.q_bounds,
    )
    result = run_particle_filter(forward_model, observed, config)
    metrics = evaluate_result(case, result)
    interval_metrics = interval_normalized_errors(case, result)
    passed = (
        metrics["location_error_m"] <= case.max_location_error_m
        and metrics["emission_error_pct"] <= case.max_emission_error_pct
        and interval_metrics["location_interval_pct"] <= 5.0
        and interval_metrics["emission_interval_pct"] <= 8.0
        and result.effective_sample_size > case.num_particles * 0.20
        and result.final_rmse <= max(float(np.max(observed)) * 0.12, 1e-3)
    )

    print(f"\n[2] Source inversion case: {case.name}")
    print("-" * 88)
    print(
        f"true=({case.true_source[0]:.2f},{case.true_source[1]:.2f}) "
        f"Q={case.emission_rate_g_s:.2f} g/s, sensors={len(case.sensor_points)}, "
        f"noise={case.noise_relative:.0%}, wind={case.wind_direction_deg:.0f} deg"
    )
    print(
        f"estimate=({result.estimate[0]:.2f},{result.estimate[1]:.2f}) "
        f"Q={result.estimate[2]:.2f} g/s"
    )
    print(
        f"location_error={metrics['location_error_m']:.3f} m "
        f"(limit {case.max_location_error_m:.1f}), "
        f"emission_error={metrics['emission_error_pct']:.2f}% "
        f"(limit {case.max_emission_error_pct:.1f})"
    )
    print(
        "paper-style interval errors: "
        f"location={interval_metrics['location_interval_pct']:.2f}% "
        "(limit 5.0%), "
        f"Q={interval_metrics['emission_interval_pct']:.2f}% "
        "(limit 8.0%)"
    )
    print(
        f"ESS={result.effective_sample_size:.1f}/{case.num_particles}, "
        f"resamples={result.resample_count}, MH_acceptance={result.acceptance_rate:.3f}, "
        f"RMSE={result.final_rmse:.6f} ppm"
    )
    print("[PASS] case passed" if passed else "[FAIL] case failed")

    return {"name": case.name, "passed": passed, **metrics}


def validate_repeatability() -> bool:
    """Run the same observation through independent PF seeds."""

    base = build_validation_cases()[0]
    sensors = [{"mapPoint": {"x": x, "y": y}, "signal": 0.0} for x, y in base.sensor_points]
    scenario = {
        "windSpeed": base.wind_speed_m_s,
        "windDirection": base.wind_direction_deg,
        "stabilityClass": base.stability_class,
        "terrainRoughness": 0.30,
        "releaseHeight": 1.5,
        "ambientTemperature": 20.0,
    }
    gas = {"molarMass": 16.04}
    forward_model = ForwardModel.from_scenario(sensors, scenario, gas)
    clean = forward_model.predict(base.true_source[0], base.true_source[1], base.emission_rate_g_s)
    rng = np.random.default_rng(99)
    observed = np.maximum(clean * (1.0 + base.noise_relative * rng.standard_normal(clean.shape)), 0.0)

    estimates = []
    errors = []
    for seed in (11, 12, 13, 14):
        config = ParticleFilterConfig(
            num_particles=9000,
            iterations=24,
            sensor_noise_relative=0.06,
            model_noise_relative=0.04,
            min_noise_ppm=1e-4,
            seed=seed,
            x_bounds=base.x_bounds,
            y_bounds=base.y_bounds,
            q_bounds=base.q_bounds,
        )
        result = run_particle_filter(forward_model, observed, config)
        estimates.append(result.estimate)
        errors.append(evaluate_result(base, result))

    estimates_arr = np.asarray(estimates, dtype=float)
    max_location_error = max(item["location_error_m"] for item in errors)
    max_emission_error = max(item["emission_error_pct"] for item in errors)
    spread_m = float(np.max(np.std(estimates_arr[:, :2], axis=0)) * MAP_METERS_PER_UNIT)
    q_spread_pct = float(np.std(estimates_arr[:, 2]) / base.emission_rate_g_s * 100.0)
    passed = max_location_error <= 2.0 and max_emission_error <= 12.0 and spread_m <= 0.5

    print("\n[3] Repeatability across independent particle-filter seeds")
    print("-" * 88)
    for seed, estimate, metrics in zip((11, 12, 13, 14), estimates, errors):
        print(
            f"seed={seed}: estimate=({estimate[0]:.2f},{estimate[1]:.2f}) "
            f"Q={estimate[2]:.2f}, loc_err={metrics['location_error_m']:.3f} m, "
            f"Q_err={metrics['emission_error_pct']:.2f}%"
        )
    print(f"posterior-estimate spread: spatial={spread_m:.3f} m, Q={q_spread_pct:.2f}%")
    print("[PASS] repeatability check" if passed else "[FAIL] repeatability check")
    return passed


def evaluate_result(case: ValidationCase, result: ParticleFilterResult) -> dict[str, float]:
    """Compute validation metrics for a particle-filter result."""

    location_error_m = (
        np.hypot(result.estimate[0] - case.true_source[0], result.estimate[1] - case.true_source[1])
        * MAP_METERS_PER_UNIT
    )
    emission_error_pct = abs(result.estimate[2] - case.emission_rate_g_s) / case.emission_rate_g_s * 100.0
    return {
        "location_error_m": float(location_error_m),
        "emission_error_pct": float(emission_error_pct),
    }


def interval_normalized_errors(case: ValidationCase, result: ParticleFilterResult) -> dict[str, float]:
    """Compute paper-style errors as percentage of the configured search interval."""

    x_span_m = (case.x_bounds[1] - case.x_bounds[0]) * MAP_METERS_PER_UNIT
    y_span_m = (case.y_bounds[1] - case.y_bounds[0]) * MAP_METERS_PER_UNIT
    location_interval_m = float(np.hypot(x_span_m, y_span_m))
    q_interval = case.q_bounds[1] - case.q_bounds[0]
    metrics = evaluate_result(case, result)
    q_abs_error = abs(result.estimate[2] - case.emission_rate_g_s)
    return {
        "location_interval_pct": metrics["location_error_m"] / location_interval_m * 100.0,
        "emission_interval_pct": q_abs_error / q_interval * 100.0,
    }


def build_validation_cases() -> tuple[ValidationCase, ...]:
    """Return deterministic source-inversion validation cases."""

    return (
        ValidationCase(
            name="east-wind dense sensors",
            true_source=(460.0, 260.0),
            emission_rate_g_s=45.0,
            wind_speed_m_s=1.8,
            wind_direction_deg=0.0,
            stability_class="D",
            sensor_points=(
                (560.0, 260.0),
                (620.0, 270.0),
                (680.0, 250.0),
                (600.0, 220.0),
                (650.0, 300.0),
                (720.0, 265.0),
                (540.0, 310.0),
                (700.0, 215.0),
            ),
            x_bounds=(300.0, 760.0),
            y_bounds=(80.0, 440.0),
            q_bounds=(1.0, 200.0),
            noise_relative=0.03,
            observation_seed=1,
            filter_seed=1,
            max_location_error_m=5.0,
            max_emission_error_pct=10.0,
        ),
        ValidationCase(
            name="northward plume rotated wind",
            true_source=(520.0, 360.0),
            emission_rate_g_s=70.0,
            wind_speed_m_s=1.8,
            wind_direction_deg=270.0,
            stability_class="D",
            sensor_points=(
                (520.0, 260.0),
                (500.0, 210.0),
                (545.0, 190.0),
                (480.0, 300.0),
                (560.0, 280.0),
                (510.0, 150.0),
                (590.0, 220.0),
                (455.0, 245.0),
            ),
            x_bounds=(340.0, 700.0),
            y_bounds=(120.0, 520.0),
            q_bounds=(1.0, 250.0),
            noise_relative=0.05,
            observation_seed=2,
            filter_seed=2,
            max_location_error_m=6.0,
            max_emission_error_pct=10.0,
        ),
        ValidationCase(
            name="diagonal plume high-noise stress",
            true_source=(360.0, 200.0),
            emission_rate_g_s=35.0,
            wind_speed_m_s=1.8,
            wind_direction_deg=45.0,
            stability_class="D",
            sensor_points=(
                (430.0, 270.0),
                (470.0, 300.0),
                (510.0, 340.0),
                (390.0, 310.0),
                (450.0, 350.0),
                (545.0, 390.0),
                (500.0, 250.0),
                (590.0, 330.0),
            ),
            x_bounds=(180.0, 620.0),
            y_bounds=(40.0, 420.0),
            q_bounds=(1.0, 250.0),
            noise_relative=0.12,
            observation_seed=3,
            filter_seed=3,
            max_location_error_m=15.0,
            max_emission_error_pct=25.0,
        ),
        ValidationCase(
            name="near-boundary source",
            true_source=(330.0, 120.0),
            emission_rate_g_s=55.0,
            wind_speed_m_s=1.8,
            wind_direction_deg=0.0,
            stability_class="D",
            sensor_points=(
                (400.0, 120.0),
                (460.0, 130.0),
                (520.0, 110.0),
                (430.0, 90.0),
                (500.0, 160.0),
                (580.0, 125.0),
                (390.0, 165.0),
            ),
            x_bounds=(260.0, 620.0),
            y_bounds=(60.0, 300.0),
            q_bounds=(1.0, 250.0),
            noise_relative=0.08,
            observation_seed=4,
            filter_seed=4,
            max_location_error_m=6.0,
            max_emission_error_pct=12.0,
        ),
    )


if __name__ == "__main__":
    raise SystemExit(main())
