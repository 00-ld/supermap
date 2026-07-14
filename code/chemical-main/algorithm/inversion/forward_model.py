"""Deep-learning forward model for gas source inversion.

This module is the shared, vectorised forward operator ``G(theta)`` that maps a
candidate source state to the concentration each sensor *should* observe. Both
the coarse grid search and the Ensemble Kalman Inversion call this single
implementation so that inversion stays self-consistent with the diffusion-side
deep surrogate.

Unlike the legacy hand-tuned coefficients (``SIGMA_Y_COEFF=0.22`` etc.), the
dispersion here now uses the same trained PyTorch gas-response surrogate as
``diffusion.phase1_diffusion``. The
source state is

    theta = [x_s, y_s, log Q]

with ``x_s, y_s`` in map pixels and ``Q`` the emission rate in g/s. The emission
rate enters the plume linearly, which lets us either treat ``log Q`` as a free
state component (EKI) or solve it analytically by least squares for a fixed
location (coarse search / initialisation).

References:
    - Delivered conditioned gas-dispersion model notes under gas/delivery.
    - PyTorch MLP surrogate trained from the conditioned physics teacher.
    - M. A. Iglesias et al., "Ensemble Kalman methods for inverse problems",
      Inverse Problems 29 (2013).

Typical usage:
    fm = ForwardModel.from_scenario(sensors, scenario, gas)
    ppm = fm.predict(source_x, source_y, emission_rate_g_s)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Optional, Sequence

import numpy as np

from ..deep_learning.gas_surrogate import deep_sensor_response, ensure_deep_surrogate
from ..diffusion.conditioned_advection import (
    DEFAULT_MIXING_HEIGHT_M,
    ConditionedAdvectionParams,
    gas_condition_from_dict,
)
from ..diffusion.gaussian_plume import (
    normalize_stability,
    resolve_environment,
    wind_at_height,
)


# Default physical context used when the scenario omits a field. These mirror
# the diffusion-side defaults so a forward run with no extra metadata still
# produces the same concentrations as the simulator.
DEFAULT_STABILITY = "D"
DEFAULT_TERRAIN_ROUGHNESS = 0.45
DEFAULT_RELEASE_HEIGHT_M = 2.0
DEFAULT_TEMPERATURE_C = 25.0
DEFAULT_PRESSURE_PA = 101325.0
DEFAULT_MOLAR_MASS = 28.97
DEFAULT_MAP_METERS_PER_UNIT = 0.5

# Lower bound on the emission rate (g/s) so log Q stays finite.
MIN_EMISSION_RATE = 1e-3


@dataclass
class ForwardModel:
    """Vectorised deep-learning forward operator for a fixed sensor layout.

    Holds the sensor positions and the meteorological / gas context, and
    exposes :meth:`predict` (concentration for one source) plus
    :meth:`predict_unit` (concentration for unit emission, used for the
    analytic emission-rate fit). Sensor coordinates are pre-extracted into
    numpy arrays so a forward evaluation over the whole network is a handful of
    vector operations.

    Attributes:
        sensor_x: Sensor X coordinates in map pixels (shape ``[N]``).
        sensor_y: Sensor Y coordinates in map pixels (shape ``[N]``).
        cos_theta: Cosine of the wind transport direction.
        sin_theta: Sine of the wind transport direction.
        effective_wind: Transport wind speed at release height (m/s).
        stability_class: Pasquill stability class 'A'..'F'.
        urban: True for built-up (urban) dispersion coefficients.
        release_height_m: Effective source height H (m).
        molar_mass_g_mol: Molar mass of the released gas (g/mol).
        temperature_k: Ambient absolute temperature (K).
        pressure_pa: Ambient pressure (Pa).
    """

    sensor_x: np.ndarray
    sensor_y: np.ndarray
    cos_theta: float
    sin_theta: float
    effective_wind: float
    stability_class: str
    urban: bool
    release_height_m: float
    molar_mass_g_mol: float
    temperature_k: float
    pressure_pa: float
    density_ratio: float
    diffusivity_m2_s: float
    diffusion_bias: float
    wind_speed_10m: float
    wind_direction_deg: float
    wind_reference_height_m: float
    map_meters_per_unit: float
    mixing_height_m: float

    @classmethod
    def from_scenario(
        cls,
        sensors: Sequence[Dict],
        scenario: Dict,
        gas: Optional[Dict] = None,
    ) -> "ForwardModel":
        """Build a forward model from sensor list, scenario, and gas metadata.

        Args:
            sensors: Active sensor dicts. Each must expose a position either as
                ``mapPoint.{x,y}`` or flat ``x``/``y`` keys.
            scenario: Scenario dict with ``windSpeed``, ``windDirection`` and,
                optionally, ``stabilityClass``, ``terrainRoughness``,
                ``releaseHeight``, ``ambientTemperature``, ``pressurePa``.
            gas: Optional gas dict providing ``molarMass`` for the ppm
                conversion.

        Returns:
            A configured :class:`ForwardModel`.
        """
        xs = []
        ys = []
        for sensor in sensors:
            point = sensor.get("mapPoint") or {}
            x = sensor.get("x", point.get("x", 0))
            y = sensor.get("y", point.get("y", 0))
            xs.append(float(x))
            ys.append(float(y))

        wind_direction = float(scenario.get("windDirection") or 0.0)
        angle = math.radians(wind_direction)

        wind_speed_10m = float(scenario.get("windSpeed") or 1.0)
        stability = normalize_stability(scenario.get("stabilityClass") or DEFAULT_STABILITY)
        terrain_roughness = float(scenario.get("terrainRoughness") or DEFAULT_TERRAIN_ROUGHNESS)
        release_height = float(scenario.get("releaseHeight") or DEFAULT_RELEASE_HEIGHT_M)
        temperature_c = float(scenario.get("ambientTemperature") or DEFAULT_TEMPERATURE_C)
        pressure_pa = float(scenario.get("pressurePa") or DEFAULT_PRESSURE_PA)
        molar_mass = float((gas or {}).get("molarMass") or DEFAULT_MOLAR_MASS)
        density_ratio = float((gas or {}).get("densityRatio") or (gas or {}).get("relativeDensity") or 1.0)
        diffusivity = float((gas or {}).get("diffusivityM2s") or (gas or {}).get("diffusivity") or 2.0e-5)
        diffusion_bias = float((gas or {}).get("diffusionBias") or 1.0)
        wind_reference_height = float(scenario.get("windReferenceHeight") or 10.0)
        map_meters_per_unit = float(scenario.get("mapMetersPerUnit") or DEFAULT_MAP_METERS_PER_UNIT)
        mixing_height = float(scenario.get("mixingHeightM") or DEFAULT_MIXING_HEIGHT_M)

        return cls(
            sensor_x=np.asarray(xs, dtype=float),
            sensor_y=np.asarray(ys, dtype=float),
            cos_theta=math.cos(angle),
            sin_theta=math.sin(angle),
            effective_wind=wind_at_height(wind_speed_10m, release_height, stability),
            stability_class=stability,
            urban=resolve_environment(terrain_roughness),
            release_height_m=max(release_height, 0.0),
            molar_mass_g_mol=molar_mass,
            temperature_k=temperature_c + 273.15,
            pressure_pa=pressure_pa,
            density_ratio=density_ratio,
            diffusivity_m2_s=diffusivity,
            diffusion_bias=diffusion_bias,
            wind_speed_10m=wind_speed_10m,
            wind_direction_deg=wind_direction,
            wind_reference_height_m=wind_reference_height,
            map_meters_per_unit=map_meters_per_unit,
            mixing_height_m=mixing_height,
        )

    def predict_unit(self, source_x: float, source_y: float) -> np.ndarray:
        """Predict sensor concentrations (ppm) for a unit emission rate.

        Computes the neural surrogate response per sensor with
        ``Q = 1 g/s``.
        Because Q enters linearly, the response for any rate is just this
        vector scaled by ``Q``.

        Args:
            source_x: Candidate source X coordinate in map pixels.
            source_y: Candidate source Y coordinate in map pixels.

        Returns:
            Array of shape ``[N]`` with the unit-rate ppm at each sensor.
            Sensors upwind of the source are exactly zero.
        """
        return np.asarray(
            deep_sensor_response(
                float(source_x),
                float(source_y),
                self.sensor_x,
                self.sensor_y,
                1.0,
                self._conditioned_params(),
            ),
            dtype=float,
        )

    def predict(self, source_x: float, source_y: float, emission_rate_g_s: float) -> np.ndarray:
        """Predict sensor concentrations (ppm) for a given source and rate.

        Args:
            source_x: Candidate source X coordinate in map pixels.
            source_y: Candidate source Y coordinate in map pixels.
            emission_rate_g_s: Emission rate Q in grams per second.

        Returns:
            Array of shape ``[N]`` with predicted ppm at each sensor.
        """
        return self.predict_unit(source_x, source_y) * max(float(emission_rate_g_s), 0.0)

    def predict_batch(self, sources: np.ndarray) -> np.ndarray:
        """Predict sensor concentrations (ppm) for many sources at once.

        This is the vectorised, numerically identical counterpart of calling
        :meth:`predict` in a Python loop. It broadcasts the per-source geometry
        against the fixed sensor layout so the whole ``[M, N]`` response is
        computed with a handful of array operations.

        Args:
            sources: Array of shape ``[M, 3]`` whose columns are
                ``[source_x, source_y, emission_rate_g_s]`` in map pixels and
                g/s respectively.

        Returns:
            Array of shape ``[M, N]`` with predicted ppm at each sensor for
            every source. Sensors upwind of a source are exactly zero.
        """
        theta = np.atleast_2d(np.asarray(sources, dtype=float))
        source_x = theta[:, 0][:, None]
        source_y = theta[:, 1][:, None]
        rate = np.maximum(theta[:, 2], 0.0)[:, None]

        sensor_x = self.sensor_x[None, :]
        sensor_y = self.sensor_y[None, :]
        return np.asarray(
            deep_sensor_response(
                source_x,
                source_y,
                sensor_x,
                sensor_y,
                rate,
                self._conditioned_params(),
            ),
            dtype=float,
        )

    def fit_emission_rate(
        self,
        source_x: float,
        source_y: float,
        observed: np.ndarray,
    ) -> float:
        """Analytically fit the emission rate that best matches observations.

        Solves the 1-D least-squares problem ``min_Q || Q * g - c ||^2`` whose
        closed-form solution is ``Q = (g . c) / (g . g)``, where ``g`` is the
        unit-rate response and ``c`` the observed concentrations.

        Args:
            source_x: Candidate source X coordinate in map pixels.
            source_y: Candidate source Y coordinate in map pixels.
            observed: Observed sensor concentrations (ppm), shape ``[N]``.

        Returns:
            Best-fit emission rate Q in g/s, clamped to ``>= MIN_EMISSION_RATE``.
        """
        unit = self.predict_unit(source_x, source_y)
        denom = float(np.dot(unit, unit))
        if denom < 1e-18:
            return MIN_EMISSION_RATE
        rate = float(np.dot(unit, np.asarray(observed, dtype=float))) / denom
        return max(rate, MIN_EMISSION_RATE)

    def _conditioned_params(self) -> ConditionedAdvectionParams:
        """Build the shared conditioned diffusion parameter object."""

        gas = {
            "densityRatio": self.density_ratio,
            "diffusivityM2s": self.diffusivity_m2_s,
            "diffusionBias": self.diffusion_bias,
            "molarMass": self.molar_mass_g_mol,
        }
        return ConditionedAdvectionParams(
            source_rate_g_s=1.0,
            release_duration_s=1.0,
            wind_speed_10m=max(self.wind_speed_10m, 0.0),
            wind_direction_deg=self.wind_direction_deg,
            stability_class=self.stability_class,
            release_height_m=self.release_height_m,
            wind_reference_height_m=self.wind_reference_height_m,
            ambient_temperature_k=self.temperature_k,
            pressure_pa=self.pressure_pa,
            cell_size_px=20.0,
            map_meters_per_unit=self.map_meters_per_unit,
            mixing_height_m=self.mixing_height_m,
            gas=gas_condition_from_dict(gas),
        )

    @property
    def model_metadata(self) -> Dict:
        """Metadata for the loaded deep-learning surrogate."""

        return ensure_deep_surrogate().metadata
