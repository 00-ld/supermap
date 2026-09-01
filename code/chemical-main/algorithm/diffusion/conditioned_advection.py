"""Conditioned grid advection-diffusion model for gas dispersion.

This module replaces the old diffusion runtime's direct Briggs/Pasquill plume
field with a grid model inspired by the delivered gas-dispersion package:

* inputs are a source grid, obstacle grid, uniform wind, and gas properties;
* gas density and diffusivity condition the spread/retention behaviour;
* the project map boundaries, frame limits, obstacle masks, channels, ppm
  thresholds, and sensor sampling contract remain owned by the caller.

The delivered U-Net checkpoint is intentionally not required here. Its own
README states that absolute concentrations are not field-validated and that the
64x64 data describes a narrow synthetic setting. This module keeps the useful
conditioning idea while preserving deterministic, inspectable backend physics.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np

from .gaussian_plume import MIN_WIND_SPEED, briggs_sigma_z, mass_to_ppm, wind_at_height


MAP_METERS_PER_UNIT = 0.5
DEFAULT_MIXING_HEIGHT_M = 3.0
MIN_DIFFUSIVITY_M2_S = 0.05
MAX_INTERNAL_STEP_S = 1.0
TURBULENCE_TIMESCALE_MIXING_HEIGHT_FRACTION = 0.1


@dataclass(frozen=True)
class GasCondition:
    """Gas condition vector used by the grid model."""

    relative_density: float
    diffusivity_m2_s: float
    diffusion_bias: float
    molar_mass_g_mol: float
    ground_loss_rate_s: float = 0.0

    @property
    def cond_buoyancy(self) -> float:
        """Scaled buoyancy condition, matching the delivered model convention."""

        return max(0.0, 2.0 * (1.0 - self.relative_density))

    @property
    def cond_diffusivity(self) -> float:
        """Scaled molecular diffusivity, matching the delivered model convention."""

        return self.diffusivity_m2_s * 1.0e5


@dataclass(frozen=True)
class ConditionedAdvectionParams:
    """Runtime parameters for conditioned advection-diffusion."""

    source_rate_g_s: float
    release_duration_s: float
    wind_speed_10m: float
    wind_direction_deg: float
    stability_class: str
    release_height_m: float
    wind_reference_height_m: float
    ambient_temperature_k: float
    pressure_pa: float
    cell_size_px: float
    map_meters_per_unit: float
    mixing_height_m: float
    gas: GasCondition
    wind_speed_at_release_m_s: float | None = None
    sigv_m_s: float | None = None
    sigw_m_s: float | None = None
    lagrangian_timescale_s: float | None = None
    turbulence_timescale_mixing_height_fraction: float = TURBULENCE_TIMESCALE_MIXING_HEIGHT_FRACTION
    # 无实测垂直湍流（sigw 缺失）时的垂直剖面口径：
    #   "gaussian"      - 用稳定度相关的 Briggs σz 高斯垂直剖面（含地面反射），
    #                     垂直扩散宽度随距离增长，替换固定混合层均匀混合假设。
    #                     修复评估发现：固定混合层盒模型在近地面源场景（如
    #                     Prairie Grass）系统性稀释 3.5-9.8 倍，导致源强反演
    #                     系统性偏大（评估报告 03 §9.1-2）。
    #   "mixing-height" - 旧行为：混合层内均匀混合（C ∝ Q/(√(2π)·σ·u·H_mix)）。
    vertical_profile: str = "gaussian"
    # 地形机制（乡村/城市 Briggs 系数，仅 vertical_profile="gaussian" 时使用）。
    urban: bool = False

    @property
    def cell_size_m(self) -> float:
        """Grid cell width in metres."""

        return max(float(self.cell_size_px) * float(self.map_meters_per_unit), 1e-6)

    @property
    def effective_wind_m_s(self) -> float:
        """Wind speed at release height, preferring a direct measurement."""

        if self.wind_speed_at_release_m_s is not None:
            return max(float(self.wind_speed_at_release_m_s), MIN_WIND_SPEED)

        return wind_at_height(
            self.wind_speed_10m,
            self.release_height_m,
            self.stability_class,
            self.wind_reference_height_m,
        )

    @property
    def turbulence_timescale_y_s(self) -> float:
        """Cross-wind Lagrangian time scale derived from measured turbulence."""

        if self.lagrangian_timescale_s is not None:
            return max(float(self.lagrangian_timescale_s), 1e-6)
        if self.sigv_m_s is None:
            return 300.0
        return max(
            max(float(self.turbulence_timescale_mixing_height_fraction), 1e-6)
            * max(float(self.mixing_height_m), 0.5)
            / max(float(self.sigv_m_s), 1e-6),
            1e-6,
        )

    @property
    def turbulence_timescale_z_s(self) -> float:
        """Vertical Lagrangian time scale derived from measured turbulence."""

        if self.lagrangian_timescale_s is not None:
            return max(float(self.lagrangian_timescale_s), 1e-6)
        if self.sigw_m_s is None:
            return 300.0
        return max(
            max(float(self.turbulence_timescale_mixing_height_fraction), 1e-6)
            * max(float(self.mixing_height_m), 0.5)
            / max(float(self.sigw_m_s), 1e-6),
            1e-6,
        )

    def turbulence_sigma_m(
        self,
        travel_time_s: np.ndarray | float,
        velocity_std_m_s: float,
        timescale_s: float,
    ) -> np.ndarray:
        """Return a dispersion width from the Lagrangian velocity covariance.

        For an exponential Lagrangian autocorrelation this is the exact
        Taylor relation.  It is ballistic at short travel times and diffusive
        at long travel times, avoiding the unphysical use of a fixed eddy
        diffusivity when direct turbulence measurements are available.
        """

        travel_time = np.maximum(np.asarray(travel_time_s, dtype=float), 0.0)
        velocity_std = max(float(velocity_std_m_s), 0.0)
        timescale = max(float(timescale_s), 1e-6)
        variance = (
            2.0
            * velocity_std**2
            * timescale
            * (travel_time - timescale * (-np.expm1(-travel_time / timescale)))
        )
        return np.sqrt(np.maximum(variance, 0.0))

    @property
    def wind_vector_cells_s(self) -> Tuple[float, float]:
        """Wind transport vector in grid cells per second."""

        angle = math.radians(self.wind_direction_deg)
        speed_cells_s = self.effective_wind_m_s / self.cell_size_m
        return math.cos(angle) * speed_cells_s, math.sin(angle) * speed_cells_s

    @property
    def effective_diffusivity_m2_s(self) -> float:
        """Effective turbulent diffusivity conditioned by gas properties.

        Molecular diffusivity alone is far too small for the 10 m cells used by
        the project map. The delivered model conditions on molecular
        diffusivity and buoyancy; here those variables scale an inspectable
        turbulent term instead of becoming hidden empirical multipliers.
        """

        wind_term = 0.12 * self.effective_wind_m_s * self.cell_size_m
        gas_term = 0.10 * self.gas.cond_diffusivity + 0.08 * self.gas.cond_buoyancy
        raw = (0.35 + wind_term + gas_term) * max(self.gas.diffusion_bias, 0.1)
        return max(raw, MIN_DIFFUSIVITY_M2_S)

    @property
    def ground_retention_per_s(self) -> float:
        """Return an explicitly configured near-ground loss rate.

        Relative density changes buoyancy and spread; it is not a first-order
        chemical, deposition, or mass-loss process.  Inert tracers therefore
        retain mass by default.  Callers may provide a separately validated
        loss rate for gases and surfaces where that process is in scope.
        """

        return max(float(self.gas.ground_loss_rate_s), 0.0)


class ConditionedAdvectionGrid:
    """Stateful finite-difference advection-diffusion field."""

    def __init__(
        self,
        shape: tuple[int, int],
        source_row: int,
        source_col: int,
        params: ConditionedAdvectionParams,
        hard_block_grid: np.ndarray | None = None,
    ) -> None:
        self.shape = shape
        self.source_row = int(np.clip(source_row, 0, shape[0] - 1))
        self.source_col = int(np.clip(source_col, 0, shape[1] - 1))
        self.params = params
        self.hard_block_grid = (
            np.asarray(hard_block_grid, dtype=bool)
            if hard_block_grid is not None
            else np.zeros(shape, dtype=bool)
        )
        self.field_ppm = np.zeros(shape, dtype=float)
        self.time_sec = 0.0

    def advance_to(self, target_time_sec: float) -> np.ndarray:
        """Advance the field to ``target_time_sec`` and return a copy."""

        target = max(float(target_time_sec), self.time_sec)
        while self.time_sec + 1e-9 < target:
            dt = min(MAX_INTERNAL_STEP_S, target - self.time_sec)
            self._step(dt)
            self.time_sec += dt
        return self.field_ppm.copy()

    def _step(self, dt: float) -> None:
        if self.time_sec < self.params.release_duration_s and self.params.source_rate_g_s > 0.0:
            active_dt = min(dt, self.params.release_duration_s - self.time_sec)
            if active_dt > 0.0:
                self.field_ppm[self.source_row, self.source_col] += self._source_increment_ppm(
                    active_dt
                )

        advected = _semi_lagrangian_advect(self.field_ppm, *self.params.wind_vector_cells_s, dt)
        diffused = _diffuse_explicit(
            advected,
            self.params.effective_diffusivity_m2_s,
            self.params.cell_size_m,
            dt,
        )
        retention = math.exp(-self.params.ground_retention_per_s * dt)
        self.field_ppm = np.maximum(diffused * retention, 0.0)
        self.field_ppm[self.hard_block_grid] = 0.0

    def _source_increment_ppm(self, dt: float) -> float:
        mass_g = self.params.source_rate_g_s * dt
        volume_m3 = (
            self.params.cell_size_m
            * self.params.cell_size_m
            * max(self.params.mixing_height_m, 0.5)
        )
        mass_conc_g_m3 = mass_g / max(volume_m3, 1e-12)
        return float(
            mass_to_ppm(
                mass_conc_g_m3,
                self.params.gas.molar_mass_g_mol,
                self.params.ambient_temperature_k,
                self.params.pressure_pa,
            )
        )


class ConditionedAdvectionVolume:
    """Stateful three-dimensional conditioned advection-diffusion field.

    The concentration state is ordered as ``(z, y, x)``. Horizontal transport
    follows the measured wind while vertical transport combines the configured
    release height, gas buoyancy and measured vertical turbulence. Building
    cells are represented by a volumetric boolean mask instead of a planar
    visualization-only attenuation factor.
    """

    def __init__(
        self,
        shape: tuple[int, int, int],
        source_level: int,
        source_row: int,
        source_col: int,
        params: ConditionedAdvectionParams,
        vertical_cell_size_m: float,
        vertical_velocity_m_s: float = 0.0,
        hard_block_volume: np.ndarray | None = None,
    ) -> None:
        if len(shape) != 3 or any(int(size) <= 0 for size in shape):
            raise ValueError("shape must contain positive (z, y, x) dimensions")
        self.shape = tuple(int(size) for size in shape)
        self.source_level = int(np.clip(source_level, 0, self.shape[0] - 1))
        self.source_row = int(np.clip(source_row, 0, self.shape[1] - 1))
        self.source_col = int(np.clip(source_col, 0, self.shape[2] - 1))
        self.params = params
        self.vertical_cell_size_m = max(float(vertical_cell_size_m), 1e-6)
        self.vertical_velocity_m_s = float(vertical_velocity_m_s)
        self.hard_block_volume = (
            np.asarray(hard_block_volume, dtype=bool).copy()
            if hard_block_volume is not None
            else np.zeros(self.shape, dtype=bool)
        )
        if self.hard_block_volume.shape != self.shape:
            raise ValueError(
                "hard_block_volume must have the same shape as the concentration field"
            )
        self.hard_block_volume[self.source_level, self.source_row, self.source_col] = False
        self.field_ppm = np.zeros(self.shape, dtype=float)
        self.time_sec = 0.0

    @property
    def vertical_diffusivity_m2_s(self) -> float:
        """Return vertical eddy diffusivity from measured turbulence when available."""

        baseline = max(
            self.params.gas.diffusivity_m2_s,
            self.params.effective_diffusivity_m2_s * 0.45,
        )
        if self.params.sigw_m_s is None:
            return baseline
        measured = float(self.params.sigw_m_s) ** 2 * self.params.turbulence_timescale_z_s * 0.5
        return max(baseline, measured)

    def advance_to(self, target_time_sec: float) -> np.ndarray:
        """Advance the volume to ``target_time_sec`` and return a copy."""

        target = max(float(target_time_sec), self.time_sec)
        while self.time_sec + 1e-9 < target:
            dt = min(self._stable_step_seconds(), target - self.time_sec)
            self._step(dt)
            self.time_sec += dt
        return self.field_ppm.copy()

    def _stable_step_seconds(self) -> float:
        horizontal_term = (
            2.0 * self.params.effective_diffusivity_m2_s / max(self.params.cell_size_m**2, 1e-12)
        )
        vertical_term = self.vertical_diffusivity_m2_s / max(
            self.vertical_cell_size_m**2,
            1e-12,
        )
        diffusion_limit = 0.45 / max(horizontal_term + vertical_term, 1e-12)
        return max(min(MAX_INTERNAL_STEP_S, diffusion_limit), 1e-4)

    def _step(self, dt: float) -> None:
        if self.time_sec < self.params.release_duration_s and self.params.source_rate_g_s > 0.0:
            active_dt = min(dt, self.params.release_duration_s - self.time_sec)
            if active_dt > 0.0:
                self.field_ppm[
                    self.source_level,
                    self.source_row,
                    self.source_col,
                ] += self._source_increment_ppm(active_dt)

        velocity_x_cells_s, velocity_y_cells_s = self.params.wind_vector_cells_s
        advected = _semi_lagrangian_advect_3d(
            self.field_ppm,
            velocity_x_cells_s,
            velocity_y_cells_s,
            self.vertical_velocity_m_s / self.vertical_cell_size_m,
            dt,
        )
        diffused = _diffuse_explicit_3d(
            advected,
            self.params.effective_diffusivity_m2_s,
            self.vertical_diffusivity_m2_s,
            self.params.cell_size_m,
            self.vertical_cell_size_m,
            dt,
        )
        self.field_ppm = np.maximum(diffused, 0.0)
        ground_retention = math.exp(-self.params.ground_retention_per_s * dt)
        self.field_ppm[0] *= ground_retention
        self.field_ppm[self.hard_block_volume] = 0.0

    def _source_increment_ppm(self, dt: float) -> float:
        mass_g = self.params.source_rate_g_s * dt
        cell_volume_m3 = (
            self.params.cell_size_m * self.params.cell_size_m * self.vertical_cell_size_m
        )
        mass_concentration_g_m3 = mass_g / max(cell_volume_m3, 1e-12)
        return float(
            mass_to_ppm(
                mass_concentration_g_m3,
                self.params.gas.molar_mass_g_mol,
                self.params.ambient_temperature_k,
                self.params.pressure_pa,
            )
        )


def gas_condition_from_dict(gas: Dict) -> GasCondition:
    """Build a gas condition vector from project gas metadata."""

    return GasCondition(
        relative_density=float(gas.get("densityRatio") or gas.get("relativeDensity") or 1.0),
        diffusivity_m2_s=float(gas.get("diffusivityM2s") or gas.get("diffusivity") or 2.0e-5),
        diffusion_bias=float(gas.get("diffusionBias") or 1.0),
        molar_mass_g_mol=float(gas.get("molarMass") or 28.97),
        ground_loss_rate_s=float(gas.get("groundLossRateS") or 0.0),
    )


def conditioned_sensor_response(
    source_x: np.ndarray | float,
    source_y: np.ndarray | float,
    sensor_x: np.ndarray | float,
    sensor_y: np.ndarray | float,
    emission_rate_g_s: np.ndarray | float,
    params: ConditionedAdvectionParams,
) -> np.ndarray:
    """Fast point response for inversion against the conditioned grid model.

    This evaluates the steady downwind response implied by the same
    advection-diffusion assumptions as :class:`ConditionedAdvectionGrid`. It is
    vectorised for particle filtering and coarse search.
    """

    sx = np.asarray(source_x, dtype=float)
    sy = np.asarray(source_y, dtype=float)
    px = np.asarray(sensor_x, dtype=float)
    py = np.asarray(sensor_y, dtype=float)
    q = np.asarray(emission_rate_g_s, dtype=float)

    angle = math.radians(params.wind_direction_deg)
    dx = px - sx
    dy = py - sy
    map_meters_per_unit = float(params.map_meters_per_unit)
    along_m = (dx * math.cos(angle) + dy * math.sin(angle)) * map_meters_per_unit
    cross_m = (-dx * math.sin(angle) + dy * math.cos(angle)) * map_meters_per_unit

    u = max(params.effective_wind_m_s, MIN_WIND_SPEED)
    travel_time = np.maximum(along_m / u, 1e-6)
    k_eff = params.effective_diffusivity_m2_s
    default_sigma = np.sqrt(np.maximum(2.0 * k_eff * travel_time, params.cell_size_m**2 * 0.25))
    sigma = (
        np.maximum(
            params.turbulence_sigma_m(
                travel_time, params.sigv_m_s, params.turbulence_timescale_y_s
            ),
            1e-3,
        )
        if params.sigv_m_s is not None
        else default_sigma
    )

    sigma_z = None
    if params.sigw_m_s is not None:
        sigma_z = np.maximum(
            params.turbulence_sigma_m(
                travel_time, params.sigw_m_s, params.turbulence_timescale_z_s
            ),
            1e-3,
        )
    elif params.vertical_profile == "gaussian":
        # 无实测垂直湍流：用稳定度相关的 Briggs σz 构成垂直高斯剖面，
        # 垂直扩散宽度随距离增长，与经典高斯烟羽口径一致。
        sigma_z = np.maximum(
            briggs_sigma_z(along_m, params.stability_class, params.urban),
            1e-3,
        )
    if sigma_z is not None:
        # 高斯垂直剖面（含地面反射）：C = Q·exp(-y²/2σ²)·2·e^{-H²/2σz²}/(2π·u·σ·σz)
        source_height = max(float(params.release_height_m), 0.0)
        ground_reflection = 2.0 * np.exp(-(source_height**2) / (2.0 * sigma_z * sigma_z))
        mass_conc = (
            np.maximum(q, 0.0)
            / (np.sqrt(2.0 * math.pi) * sigma * u)
            * np.exp(-(cross_m * cross_m) / (2.0 * sigma * sigma))
            * ground_reflection
            / (math.sqrt(2.0 * math.pi) * sigma_z)
        )
    else:
        # 旧口径：混合层内均匀混合（vertical_profile="mixing-height"）
        norm = np.maximum(q, 0.0) / (
            np.sqrt(2.0 * math.pi) * sigma * u * max(params.mixing_height_m, 0.5)
        )
        mass_conc = norm * np.exp(-(cross_m * cross_m) / (2.0 * sigma * sigma))
    mass_conc *= np.exp(-params.ground_retention_per_s * travel_time)
    mass_conc = np.where(along_m > 0.0, mass_conc, 0.0)
    return mass_to_ppm(
        mass_conc,
        params.gas.molar_mass_g_mol,
        params.ambient_temperature_k,
        params.pressure_pa,
    )


def plume_axes_from_field(
    field: np.ndarray,
    grid_x: np.ndarray,
    grid_y: np.ndarray,
    source: Dict,
    angle: float,
    floor: float,
    fallback_minor_axis: float,
) -> Dict[str, float]:
    """Compute plume metadata from visible concentration cells."""

    mask = np.asarray(field, dtype=float) >= max(float(floor), 0.0)
    if not np.any(mask):
        return {
            "sourceX": float(source["x"]),
            "sourceY": float(source["y"]),
            "angle": angle,
            "majorAxis": 0.0,
            "minorAxis": fallback_minor_axis,
            "driftDistance": 0.0,
        }

    weights = np.asarray(field, dtype=float)[mask]
    xs = np.asarray(grid_x, dtype=float)[mask]
    ys = np.asarray(grid_y, dtype=float)[mask]
    cx = float(np.average(xs, weights=weights))
    cy = float(np.average(ys, weights=weights))
    drift = math.hypot(cx - float(source["x"]), cy - float(source["y"]))

    dx = xs - float(source["x"])
    dy = ys - float(source["y"])
    along = dx * math.cos(angle) + dy * math.sin(angle)
    cross = -dx * math.sin(angle) + dy * math.cos(angle)
    major = float(np.sqrt(np.average(along * along, weights=weights)) * 2.0)
    minor = float(np.sqrt(np.average(cross * cross, weights=weights)) * 2.0)
    return {
        "sourceX": float(source["x"]),
        "sourceY": float(source["y"]),
        "angle": angle,
        "majorAxis": max(major, fallback_minor_axis),
        "minorAxis": max(minor, fallback_minor_axis),
        "driftDistance": drift,
    }


def _semi_lagrangian_advect(
    field: np.ndarray, vx_cells_s: float, vy_cells_s: float, dt: float
) -> np.ndarray:
    rows, cols = field.shape
    row_idx, col_idx = np.indices(field.shape, dtype=float)
    src_col = col_idx - vx_cells_s * dt
    src_row = row_idx - vy_cells_s * dt
    return _bilinear_sample(field, src_row, src_col)


def _bilinear_sample(field: np.ndarray, row: np.ndarray, col: np.ndarray) -> np.ndarray:
    rows, cols = field.shape
    row = np.clip(row, 0.0, rows - 1.0)
    col = np.clip(col, 0.0, cols - 1.0)
    r0 = np.floor(row).astype(int)
    c0 = np.floor(col).astype(int)
    r1 = np.clip(r0 + 1, 0, rows - 1)
    c1 = np.clip(c0 + 1, 0, cols - 1)
    wr = row - r0
    wc = col - c0
    return (
        field[r0, c0] * (1.0 - wr) * (1.0 - wc)
        + field[r0, c1] * (1.0 - wr) * wc
        + field[r1, c0] * wr * (1.0 - wc)
        + field[r1, c1] * wr * wc
    )


def _diffuse_explicit(
    field: np.ndarray, diffusivity_m2_s: float, cell_size_m: float, dt: float
) -> np.ndarray:
    alpha = min(max(diffusivity_m2_s * dt / max(cell_size_m * cell_size_m, 1e-12), 0.0), 0.24)
    if alpha <= 0.0:
        return field
    padded = np.pad(field, 1, mode="edge")
    laplacian = (
        padded[:-2, 1:-1] + padded[2:, 1:-1] + padded[1:-1, :-2] + padded[1:-1, 2:] - 4.0 * field
    )
    return field + alpha * laplacian


def _semi_lagrangian_advect_3d(
    field: np.ndarray,
    velocity_x_cells_s: float,
    velocity_y_cells_s: float,
    velocity_z_cells_s: float,
    dt: float,
) -> np.ndarray:
    level_indices, row_indices, column_indices = np.indices(field.shape, dtype=float)
    source_columns = column_indices - velocity_x_cells_s * dt
    source_rows = row_indices - velocity_y_cells_s * dt
    source_levels = level_indices - velocity_z_cells_s * dt
    return _trilinear_sample(field, source_levels, source_rows, source_columns)


def _trilinear_sample(
    field: np.ndarray,
    levels: np.ndarray,
    rows: np.ndarray,
    columns: np.ndarray,
) -> np.ndarray:
    level_count, row_count, column_count = field.shape
    levels = np.clip(levels, 0.0, level_count - 1.0)
    rows = np.clip(rows, 0.0, row_count - 1.0)
    columns = np.clip(columns, 0.0, column_count - 1.0)

    level0 = np.floor(levels).astype(int)
    row0 = np.floor(rows).astype(int)
    column0 = np.floor(columns).astype(int)
    level1 = np.clip(level0 + 1, 0, level_count - 1)
    row1 = np.clip(row0 + 1, 0, row_count - 1)
    column1 = np.clip(column0 + 1, 0, column_count - 1)

    level_weight = levels - level0
    row_weight = rows - row0
    column_weight = columns - column0

    lower = (
        field[level0, row0, column0] * (1.0 - row_weight) * (1.0 - column_weight)
        + field[level0, row0, column1] * (1.0 - row_weight) * column_weight
        + field[level0, row1, column0] * row_weight * (1.0 - column_weight)
        + field[level0, row1, column1] * row_weight * column_weight
    )
    upper = (
        field[level1, row0, column0] * (1.0 - row_weight) * (1.0 - column_weight)
        + field[level1, row0, column1] * (1.0 - row_weight) * column_weight
        + field[level1, row1, column0] * row_weight * (1.0 - column_weight)
        + field[level1, row1, column1] * row_weight * column_weight
    )
    return lower * (1.0 - level_weight) + upper * level_weight


def _diffuse_explicit_3d(
    field: np.ndarray,
    horizontal_diffusivity_m2_s: float,
    vertical_diffusivity_m2_s: float,
    horizontal_cell_size_m: float,
    vertical_cell_size_m: float,
    dt: float,
) -> np.ndarray:
    horizontal_alpha = max(
        horizontal_diffusivity_m2_s
        * dt
        / max(horizontal_cell_size_m * horizontal_cell_size_m, 1e-12),
        0.0,
    )
    vertical_alpha = max(
        vertical_diffusivity_m2_s * dt / max(vertical_cell_size_m * vertical_cell_size_m, 1e-12),
        0.0,
    )
    stability_sum = 2.0 * horizontal_alpha + vertical_alpha
    if stability_sum > 0.5 + 1e-9:
        raise ValueError("three-dimensional diffusion step violates the explicit stability limit")
    if stability_sum <= 0.0:
        return field

    padded = np.pad(field, 1, mode="edge")
    horizontal_laplacian = (
        padded[1:-1, :-2, 1:-1]
        + padded[1:-1, 2:, 1:-1]
        + padded[1:-1, 1:-1, :-2]
        + padded[1:-1, 1:-1, 2:]
        - 4.0 * field
    )
    vertical_laplacian = padded[:-2, 1:-1, 1:-1] + padded[2:, 1:-1, 1:-1] - 2.0 * field
    return field + horizontal_alpha * horizontal_laplacian + vertical_alpha * vertical_laplacian
