"""Regression tests for measured-wind and turbulence inputs.

These checks keep the operational two-dimensional model backward compatible while
making its meteorological extensions directly testable.
"""

from __future__ import annotations

import math

import numpy as np

from .conditioned_advection import ConditionedAdvectionParams, GasCondition, conditioned_sensor_response
from ..deep_learning.gas_surrogate import should_apply_neural_correction
from .phase1_diffusion import create_phase1_diffusion_simulation


def _params(**overrides: object) -> ConditionedAdvectionParams:
    values: dict[str, object] = {
        "source_rate_g_s": 3.2,
        "release_duration_s": 3600.0,
        "wind_speed_10m": 2.0,
        "wind_direction_deg": 0.0,
        "stability_class": "C",
        "release_height_m": 115.0,
        "wind_reference_height_m": 10.0,
        "ambient_temperature_k": 293.15,
        "pressure_pa": 101325.0,
        "cell_size_px": 20.0,
        "map_meters_per_unit": 1.0,
        "mixing_height_m": 300.0,
        "gas": GasCondition(5.11, 1.0e-5, 1.0, 146.06),
    }
    values.update(overrides)
    return ConditionedAdvectionParams(**values)


def check_measured_release_height_wind_overrides_profile() -> None:
    params = _params(wind_speed_at_release_m_s=3.4)
    assert params.effective_wind_m_s == 3.4


def check_turbulence_spread_has_correct_short_and_long_time_limits() -> None:
    params = _params(sigv_m_s=0.5, sigw_m_s=0.4, lagrangian_timescale_s=100.0)
    short_sigma = float(params.turbulence_sigma_m(1.0, 0.5, params.turbulence_timescale_y_s))
    long_sigma = float(params.turbulence_sigma_m(10_000.0, 0.5, params.turbulence_timescale_y_s))

    assert math.isclose(short_sigma, 0.5, rel_tol=0.01)
    assert math.isclose(long_sigma, math.sqrt(2.0 * 0.5**2 * 100.0 * 10_000.0), rel_tol=0.02)


def check_measured_turbulence_derives_direction_specific_timescales() -> None:
    params = _params(mixing_height_m=1980.0, sigv_m_s=0.98, sigw_m_s=0.83)

    assert math.isclose(params.turbulence_timescale_y_s, 0.1 * 1980.0 / 0.98)
    assert math.isclose(params.turbulence_timescale_z_s, 0.1 * 1980.0 / 0.83)


def check_turbulence_timescale_fraction_can_be_explicitly_overridden() -> None:
    params = _params(
        mixing_height_m=1980.0,
        sigv_m_s=0.98,
        sigw_m_s=0.83,
        turbulence_timescale_mixing_height_fraction=0.05,
    )
    assert math.isclose(params.turbulence_timescale_y_s, 0.05 * 1980.0 / 0.98)
    assert math.isclose(params.turbulence_timescale_z_s, 0.05 * 1980.0 / 0.83)


def check_inert_tracer_has_no_density_based_mass_loss() -> None:
    params = _params(gas=GasCondition(5.11, 1.0e-5, 1.0, 146.06))
    assert params.ground_retention_per_s == 0.0


def check_measured_meteorology_uses_physical_anchor_without_neural_residual() -> None:
    assert should_apply_neural_correction(_params())
    assert not should_apply_neural_correction(
        _params(wind_speed_at_release_m_s=3.4, sigv_m_s=0.98, sigw_m_s=0.83)
    )


def check_measured_turbulence_changes_operational_prediction() -> None:
    baseline = _params()
    measured = _params(sigv_m_s=0.5, sigw_m_s=0.4, lagrangian_timescale_s=300.0)
    target_x = np.array([1900.0, 3700.0])
    target_y = np.zeros_like(target_x)

    baseline_response = conditioned_sensor_response(0.0, 0.0, target_x, target_y, 3.2, baseline)
    measured_response = conditioned_sensor_response(0.0, 0.0, target_x, target_y, 3.2, measured)

    assert np.all(np.isfinite(measured_response))
    assert np.all(measured_response >= 0.0)
    assert not np.allclose(baseline_response, measured_response)


def check_negative_measured_turbulence_is_rejected_at_request_boundary() -> None:
    payload = {
        "gasId": "co",
        "sourceMapPoint": {"x": 20.0, "y": 20.0},
        "sourceRate": 3.2,
        "releaseDuration": 60.0,
        "windSpeed": 2.0,
        "sigwMps": -0.1,
        "frameCount": 0,
    }
    try:
        create_phase1_diffusion_simulation(payload)
    except ValueError as error:
        assert "sigwMps" in str(error)
    else:
        raise AssertionError("negative measured turbulence must be rejected")


def check_phase1_exposes_measured_meteorology_metadata() -> None:
    result = create_phase1_diffusion_simulation(
        {
            "gasId": "co",
            "sourceMapPoint": {"x": 20.0, "y": 20.0},
            "sourceRate": 3.2,
            "releaseDuration": 3600.0,
            "releaseHeight": 115.0,
            "windSpeed": 2.1,
            "windSpeedAtReleaseHeight": 3.4,
            "sigvMps": 0.98,
            "sigwMps": 0.83,
            "mixingHeightM": 1980.0,
            "frameCount": 0,
        }
    )
    metadata = result["scenarioMeta"]
    assert metadata["windSpeedAtReleaseHeight"] == 3.4
    assert metadata["sigvMps"] == 0.98
    assert metadata["sigwMps"] == 0.83
    assert metadata["derivedLagrangianTimescaleYS"] > 0.0
    assert metadata["derivedLagrangianTimescaleZS"] > 0.0


def main() -> int:
    check_measured_release_height_wind_overrides_profile()
    check_turbulence_spread_has_correct_short_and_long_time_limits()
    check_measured_turbulence_derives_direction_specific_timescales()
    check_turbulence_timescale_fraction_can_be_explicitly_overridden()
    check_inert_tracer_has_no_density_based_mass_loss()
    check_measured_meteorology_uses_physical_anchor_without_neural_residual()
    check_measured_turbulence_changes_operational_prediction()
    check_negative_measured_turbulence_is_rejected_at_request_boundary()
    check_phase1_exposes_measured_meteorology_metadata()
    print("Conditioned advection meteorology checks: passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
