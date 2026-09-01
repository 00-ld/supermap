"""第一阶段三维条件化平流扩散仿真。

实现三维浓度体 ``C(z, y, x, t)`` 的条件化平流扩散，并考虑障碍物、
通道、气体浮力、垂直湍流和大气稳定度影响。
用于化工厂气体泄漏场景仿真。

主要特性：
    - 水平与垂直分辨率均可配置的三维浓度计算。
    - 体素化建筑阻挡和设备尾流/遮挡影响。
    - 道路通道对风流的引导作用。
    - 支持带密度和扩散偏置的多种气体。
    - 传感器读数仿真。

典型用法：
    result = create_phase1_diffusion_simulation(payload)
"""

from __future__ import annotations

import heapq
import math
from collections.abc import Mapping
from typing import Dict, List, Optional, Sequence

import numpy as np

from .conditioned_advection import (
    DEFAULT_MIXING_HEIGHT_M,
    ConditionedAdvectionVolume,
    ConditionedAdvectionParams,
    gas_condition_from_dict,
    plume_axes_from_field,
)
from .gaussian_plume import (
    normalize_stability,
    resolve_environment,
)

MAP_WIDTH = 1000
MAP_HEIGHT = 650
GRID_SIZE = 20
MAP_METERS_PER_UNIT = 0.5
MAX_VOLUME_COLUMNS_PER_FRAME = 72
MAX_VOLUME_CELLS_PER_RESPONSE = 6000
MAX_VOLUME_PARTICLES_PER_CELL = 8
MAX_VOLUME_PARTICLES_PER_RESPONSE = MAX_VOLUME_CELLS_PER_RESPONSE * MAX_VOLUME_PARTICLES_PER_CELL
VOLUME_VERTICAL_LEVELS = (0.0, 0.55, 1.1)
DEFAULT_VERTICAL_CELL_SIZE_M = 5.0
DEFAULT_OBSTACLE_HEIGHT_M = 30.0
MAX_VERTICAL_LEVELS = 40


def clamp(value: float, minimum: float, maximum: float) -> float:
    """将数值限制在最小值和最大值之间。

    参数：
        value: 需要限制的输入值。
        minimum: 区间下限。
        maximum: 区间上限。

    返回：
        限制在 [minimum, maximum] 内的值。
    """
    return min(max(value, minimum), maximum)


PHASE1_GASES = [
    {
        "id": "co",
        "name": "一氧化碳",
        "color": "#f59e0b",
        "densityRatio": 0.97,
        "molarMass": 28.01,
        "diffusionBias": 1.05,
        "particleProfile": {
            "shape": "NEUTRAL_PUFF",
            "speedFactor": 1.0,
            "buoyancyMetersPerSecond": 0.02,
            "densityFactor": 0.9,
            "alongScale": 1.9,
            "crossScale": 0.9,
            "verticalScale": 0.72,
            "turbulence": 0.34,
        },
        "warningThreshold": 24,
        "dangerThreshold": 60,
        "blockingThreshold": 75,
    },
    {
        "id": "nh3",
        "name": "氨气",
        "color": "#a855f7",
        "densityRatio": 0.59,
        "molarMass": 17.03,
        "diffusionBias": 1.25,
        "particleProfile": {
            "shape": "BUOYANT_WISPY_PUFF",
            "speedFactor": 1.18,
            "buoyancyMetersPerSecond": 0.2,
            "densityFactor": 0.72,
            "alongScale": 2.35,
            "crossScale": 0.82,
            "verticalScale": 1.08,
            "turbulence": 0.48,
        },
        "warningThreshold": 25,
        "dangerThreshold": 50,
        "blockingThreshold": 75,
    },
    {
        "id": "ch4",
        "name": "甲烷",
        "color": "#38bdf8",
        "densityRatio": 0.55,
        "molarMass": 16.04,
        "diffusionBias": 1.5,
        "particleProfile": {
            "shape": "FAST_BUOYANT_PUFF",
            "speedFactor": 1.32,
            "buoyancyMetersPerSecond": 0.29,
            "densityFactor": 0.62,
            "alongScale": 2.55,
            "crossScale": 0.76,
            "verticalScale": 1.2,
            "turbulence": 0.42,
        },
        "warningThreshold": 10,
        "dangerThreshold": 20,
        "blockingThreshold": 30,
    },
    {
        "id": "o2",
        "name": "氧气",
        "color": "#22c55e",
        "densityRatio": 1.11,
        "molarMass": 32.00,
        "diffusionBias": 0.95,
        "particleProfile": {
            "shape": "LOW_DENSE_PUFF",
            "speedFactor": 0.9,
            "buoyancyMetersPerSecond": -0.035,
            "densityFactor": 1.15,
            "alongScale": 1.65,
            "crossScale": 1.05,
            "verticalScale": 0.58,
            "turbulence": 0.24,
        },
        "warningThreshold": 19,
        "dangerThreshold": 23,
        "blockingThreshold": 25,
    },
]


def get_gas_by_id(gas_id: Optional[str]) -> Dict:
    """根据气体标识查找气体属性。

    参数：
        gas_id: 气体标识字符串，例如 'nh3'、'co'、'ch4'、'o2'。

    返回：
        气体属性字典。

    Raises:
        ValueError: 如果气体标识缺失或不受支持。
    """
    normalized = str(gas_id or "").strip().lower()
    for gas in PHASE1_GASES:
        if gas["id"] == normalized:
            return dict(gas)
    supported = ", ".join(gas["id"] for gas in PHASE1_GASES)
    raise ValueError(f"unsupported gasId '{gas_id}', expected one of: {supported}")


def build_volume_cells(
    cells: Sequence[Dict],
    source: Dict,
    gas: Dict,
    release_height_m: float,
    wind_speed_mps: float,
    wind_direction_degrees: float,
    vertical_turbulence_mps: Optional[float],
    vertical_timescale_s: float,
    frame_peak_concentration: float,
    grid_size: float,
    map_meters_per_unit: float,
    max_horizontal_radius_m: float,
    max_columns: int,
) -> List[Dict]:
    """把平面浓度网格转换为有界三维粒子羽流体元。

    算法仍在局部米制平面求解平流扩散，但每个可见平面单元沿竖直方向
    生成多个带气体物性、平流方向、浮升和湍流参数的小尺度椭球粒子。
    返回的是粒子羽流的可视化采样，不用单个大球冒充真实扩散边界。
    """
    source_x = float(source["x"])
    source_y = float(source["y"])
    meters_per_unit = max(float(map_meters_per_unit), 0.001)
    horizontal_limit = max(float(max_horizontal_radius_m), 1.0)
    profile = dict(gas.get("particleProfile") or {})
    speed_factor = max(float(profile.get("speedFactor") or 1.0), 0.2)
    buoyancy_mps = float(profile.get("buoyancyMetersPerSecond") or 0.0)
    density_factor = clamp(float(profile.get("densityFactor") or 1.0), 0.3, 1.8)
    along_scale = clamp(float(profile.get("alongScale") or 1.8), 0.8, 3.2)
    cross_scale = clamp(float(profile.get("crossScale") or 0.9), 0.45, 1.8)
    vertical_scale = clamp(float(profile.get("verticalScale") or 0.8), 0.35, 1.8)
    turbulence = clamp(float(profile.get("turbulence") or 0.3), 0.05, 0.8)
    base_radius_m = clamp(float(grid_size) * meters_per_unit * 0.08, 0.55, 2.4)
    bounded_column_count = max(1, min(MAX_VOLUME_COLUMNS_PER_FRAME, int(max_columns)))
    wind_angle_radians = math.radians(wind_direction_degrees)
    wind_cosine = math.cos(wind_angle_radians)
    wind_sine = math.sin(wind_angle_radians)
    source_zone_allowance_m = max(float(grid_size) * meters_per_unit, 1.0)
    eligible_cells: List[Dict] = []
    for cell in cells:
        delta_x_m = (float(cell["x"]) - source_x) * meters_per_unit
        delta_y_m = (float(cell["y"]) - source_y) * meters_per_unit
        horizontal_distance_m = math.hypot(delta_x_m, delta_y_m)
        raw_along_wind_distance_m = delta_x_m * wind_cosine + delta_y_m * wind_sine
        if (
            horizontal_distance_m <= horizontal_limit
            and raw_along_wind_distance_m >= -source_zone_allowance_m
        ):
            eligible_cells.append(cell)

    # 只按浓度取 Top-N 会把所有体元堆在源点附近，看起来像一个球。保留高浓度核心，
    # 同时按顺风距离/横风侧向分箱补充代表体元，形成连续而有空间覆盖的羽流。
    if bounded_column_count <= 2:
        ranked_cells = heapq.nlargest(
            bounded_column_count,
            eligible_cells,
            key=lambda cell: float(cell.get("concentration") or 0.0),
        )
    else:
        core_count = max(1, int(round(bounded_column_count * 0.58)))
        concentration_ranked = heapq.nlargest(
            bounded_column_count,
            eligible_cells,
            key=lambda cell: float(cell.get("concentration") or 0.0),
        )
        ranked_cells = concentration_ranked[:core_count]
        selected_cell_ids = {id(cell) for cell in ranked_cells}
        bin_size_m = max(float(grid_size) * meters_per_unit * 2.0, 2.0)
        coverage_bins: Dict[tuple[int, int], Dict] = {}
        for cell in eligible_cells:
            if id(cell) in selected_cell_ids:
                continue
            delta_x_m = (float(cell["x"]) - source_x) * meters_per_unit
            delta_y_m = (float(cell["y"]) - source_y) * meters_per_unit
            along_wind_m = max(
                delta_x_m * wind_cosine + delta_y_m * wind_sine,
                0.0,
            )
            cross_wind_m = -delta_x_m * wind_sine + delta_y_m * wind_cosine
            side = 0 if abs(cross_wind_m) < bin_size_m else (1 if cross_wind_m > 0 else -1)
            key = (int(along_wind_m // bin_size_m), side)
            previous = coverage_bins.get(key)
            if previous is None or float(cell.get("concentration") or 0.0) > float(
                previous.get("concentration") or 0.0
            ):
                coverage_bins[key] = cell
        coverage_cells = sorted(
            coverage_bins.values(),
            key=lambda cell: (
                (float(cell["x"]) - source_x) * meters_per_unit * wind_cosine
                + (float(cell["y"]) - source_y) * meters_per_unit * wind_sine,
                float(cell.get("concentration") or 0.0),
            ),
            reverse=True,
        )
        for cell in coverage_cells:
            if len(ranked_cells) >= bounded_column_count:
                break
            ranked_cells.append(cell)
            selected_cell_ids.add(id(cell))
        if len(ranked_cells) < bounded_column_count:
            for cell in concentration_ranked[core_count:]:
                if len(ranked_cells) >= bounded_column_count:
                    break
                if id(cell) not in selected_cell_ids:
                    ranked_cells.append(cell)
                    selected_cell_ids.add(id(cell))
    volume_cells: List[Dict] = []
    for cell in ranked_cells:
        delta_x_m = (float(cell["x"]) - source_x) * meters_per_unit
        delta_y_m = (float(cell["y"]) - source_y) * meters_per_unit
        horizontal_distance_m = math.hypot(delta_x_m, delta_y_m)
        raw_along_wind_distance_m = delta_x_m * wind_cosine + delta_y_m * wind_sine
        along_wind_distance_m = max(raw_along_wind_distance_m, 0.0)
        cross_wind_distance_m = -delta_x_m * wind_sine + delta_y_m * wind_cosine
        travel_time_s = along_wind_distance_m / max(
            wind_speed_mps * speed_factor,
            0.8,
        )
        plume_center_m = max(
            0.25,
            release_height_m + buoyancy_mps * min(travel_time_s, 90.0),
        )
        if vertical_turbulence_mps is not None:
            bounded_vertical_turbulence_mps = max(
                float(vertical_turbulence_mps),
                0.0,
            )
            bounded_vertical_timescale_s = max(float(vertical_timescale_s), 1e-6)
            vertical_variance_m2 = (
                2.0
                * bounded_vertical_turbulence_mps**2
                * bounded_vertical_timescale_s
                * (
                    travel_time_s
                    - bounded_vertical_timescale_s
                    * (-math.expm1(-travel_time_s / bounded_vertical_timescale_s))
                )
            )
            vertical_sigma_m = clamp(
                max(math.sqrt(max(vertical_variance_m2, 0.0)), 0.8),
                0.8,
                12.0,
            )
        else:
            vertical_sigma_m = clamp(
                0.8 + math.sqrt(along_wind_distance_m) * turbulence * 0.34,
                0.8,
                12.0,
            )
        concentration = float(cell.get("concentration") or 0.0)
        for level_index, sigma_factor in enumerate(VOLUME_VERTICAL_LEVELS):
            signed_sigma = sigma_factor - 0.55
            z_offset_m = max(0.2, plume_center_m + signed_sigma * vertical_sigma_m)
            effective_sigma_factor = abs(signed_sigma)
            vertical_weight = math.exp(-0.5 * effective_sigma_factor * effective_sigma_factor)
            level_concentration = concentration * vertical_weight
            if level_concentration <= 0:
                continue
            along_growth = 1.0 + min(along_wind_distance_m / 150.0, 1.5)
            cross_growth = 1.0 + min(math.sqrt(along_wind_distance_m) / 24.0, 0.72)
            vertical_growth = 1.0 + min(horizontal_distance_m / 520.0, 0.42)
            concentration_ratio = clamp(
                level_concentration / max(frame_peak_concentration, 0.0001),
                0.0,
                1.0,
            )
            particle_count = int(
                clamp(
                    round(2.0 + 3.0 * math.sqrt(concentration_ratio) * density_factor),
                    2,
                    MAX_VOLUME_PARTICLES_PER_CELL,
                )
            )
            deterministic_seed = (
                int(
                    abs(float(cell["x"]) * 73856093)
                    + abs(float(cell["y"]) * 19349663)
                    + level_index * 83492791
                )
                % 2147483647
            )
            volume_cells.append(
                {
                    "x": float(cell["x"]),
                    "y": float(cell["y"]),
                    "zOffsetMeters": round(z_offset_m, 3),
                    "zMeters": round(z_offset_m, 3),
                    "radiusMeters": round(base_radius_m, 3),
                    "radiusAlongMeters": round(
                        base_radius_m * along_scale * along_growth,
                        3,
                    ),
                    "radiusCrossMeters": round(
                        base_radius_m * cross_scale * cross_growth,
                        3,
                    ),
                    "radiusVerticalMeters": round(
                        base_radius_m * vertical_scale * vertical_growth,
                        3,
                    ),
                    "headingDegrees": round(
                        (wind_direction_degrees + 90.0) % 360.0,
                        3,
                    ),
                    "particleCount": particle_count,
                    "particleSeed": deterministic_seed,
                    "shape": str(profile.get("shape") or "NEUTRAL_PUFF"),
                    "speedFactor": round(speed_factor, 3),
                    "buoyancyMetersPerSecond": round(buoyancy_mps, 4),
                    "densityFactor": round(density_factor, 3),
                    "turbulence": round(turbulence, 3),
                    "particleAgeSeconds": round(travel_time_s, 3),
                    "alongWindDistanceMeters": round(
                        along_wind_distance_m,
                        3,
                    ),
                    "crossWindDistanceMeters": round(cross_wind_distance_m, 3),
                    "sourceDistanceMeters": round(horizontal_distance_m, 3),
                    "concentration": round(level_concentration, 4),
                    "visualizationOnly": True,
                    "level": cell.get("level") or "low",
                }
            )
    return volume_cells


def build_physical_volume_cells(
    concentration_volume: np.ndarray,
    grid_x: np.ndarray,
    grid_y: np.ndarray,
    z_levels_m: np.ndarray,
    source: Dict,
    release_height_m: float,
    gas: Dict,
    params: ConditionedAdvectionParams,
    vertical_velocity_m_s: float,
    visible_floor: float,
    warning_threshold: float,
    danger_threshold: float,
    max_cells: int,
) -> List[Dict]:
    """Serialize a bounded, spatially distributed sample of the solved 3-D field."""

    visible_indices = np.argwhere(concentration_volume >= visible_floor)
    if visible_indices.size == 0 or max_cells <= 0:
        return []

    concentrations = concentration_volume[
        visible_indices[:, 0],
        visible_indices[:, 1],
        visible_indices[:, 2],
    ]
    if len(visible_indices) > max_cells:
        core_count = max(1, int(max_cells * 0.65))
        ranked_positions = np.argsort(concentrations)[::-1]
        core_positions = ranked_positions[:core_count]
        remaining_positions = np.sort(ranked_positions[core_count:])
        coverage_count = max_cells - core_count
        coverage_positions = (
            remaining_positions[
                np.linspace(0, len(remaining_positions) - 1, coverage_count, dtype=int)
            ]
            if coverage_count > 0 and len(remaining_positions) > 0
            else np.empty(0, dtype=int)
        )
        selected_positions = np.unique(np.concatenate((core_positions, coverage_positions)))[
            :max_cells
        ]
        visible_indices = visible_indices[selected_positions]
        concentrations = concentrations[selected_positions]

    profile = dict(gas.get("particleProfile") or {})
    frame_peak_concentration = max(float(np.max(concentrations)), 0.0001)
    horizontal_cell_size_m = params.cell_size_m
    vertical_cell_size_m = float(z_levels_m[1] - z_levels_m[0]) if len(z_levels_m) > 1 else 1.0
    wind_angle_radians = math.radians(params.wind_direction_deg)
    wind_cosine = math.cos(wind_angle_radians)
    wind_sine = math.sin(wind_angle_radians)
    source_x = float(source["x"])
    source_y = float(source["y"])
    meters_per_unit = params.map_meters_per_unit
    cells: List[Dict] = []

    for position, (level, row, column) in enumerate(visible_indices.tolist()):
        concentration = float(concentrations[position])
        x = float(grid_x[row, column])
        y = float(grid_y[row, column])
        z_meters = float(z_levels_m[level])
        delta_x_m = (x - source_x) * meters_per_unit
        delta_y_m = (y - source_y) * meters_per_unit
        along_wind_m = delta_x_m * wind_cosine + delta_y_m * wind_sine
        cross_wind_m = -delta_x_m * wind_sine + delta_y_m * wind_cosine
        if concentration >= danger_threshold:
            concentration_level = "danger"
        elif concentration >= warning_threshold:
            concentration_level = "warning"
        else:
            concentration_level = "low"
        deterministic_seed = (
            int(abs(x * 73856093) + abs(y * 19349663) + int(level) * 83492791) % 2147483647
        )
        cells.append(
            {
                "x": round(x, 3),
                "y": round(y, 3),
                "zMeters": round(z_meters, 3),
                "zOffsetMeters": round(z_meters - release_height_m, 3),
                "radiusMeters": round(min(horizontal_cell_size_m, vertical_cell_size_m) * 0.42, 3),
                "radiusAlongMeters": round(horizontal_cell_size_m * 0.48, 3),
                "radiusCrossMeters": round(horizontal_cell_size_m * 0.44, 3),
                "radiusVerticalMeters": round(vertical_cell_size_m * 0.48, 3),
                "headingDegrees": round((params.wind_direction_deg + 90.0) % 360.0, 3),
                "particleCount": int(
                    clamp(
                        round(4.0 + 4.0 * math.sqrt(concentration / frame_peak_concentration)),
                        4,
                        MAX_VOLUME_PARTICLES_PER_CELL,
                    )
                ),
                "particleSeed": deterministic_seed,
                "shape": str(profile.get("shape") or "VOXEL_VOLUME"),
                "speedFactor": round(float(profile.get("speedFactor") or 1.0), 3),
                "buoyancyMetersPerSecond": round(vertical_velocity_m_s, 4),
                "densityFactor": round(float(profile.get("densityFactor") or 1.0), 3),
                "turbulence": round(float(profile.get("turbulence") or 0.3), 3),
                "alongWindDistanceMeters": round(along_wind_m, 3),
                "crossWindDistanceMeters": round(cross_wind_m, 3),
                "sourceDistanceMeters": round(math.hypot(delta_x_m, delta_y_m), 3),
                "velocityX": round(params.effective_wind_m_s * wind_cosine, 4),
                "velocityY": round(params.effective_wind_m_s * wind_sine, 4),
                "velocityZMetersPerSecond": round(vertical_velocity_m_s, 4),
                "concentration": round(concentration, 4),
                "visualizationOnly": False,
                "level": concentration_level,
            }
        )
    return cells


def build_hard_block_volume(
    hard_block_grid: np.ndarray,
    z_levels_m: np.ndarray,
    obstacle_height_m: float,
) -> np.ndarray:
    """Extrude the planar building footprint mask into a bounded 3-D obstacle mask."""

    blocked_levels = z_levels_m <= max(float(obstacle_height_m), 0.0)
    return blocked_levels[:, np.newaxis, np.newaxis] & hard_block_grid[np.newaxis, :, :]


def build_volume_sensor_readings(
    sensors: Sequence[Dict],
    concentration_volume: np.ndarray,
    xs: np.ndarray,
    ys: np.ndarray,
    z_levels_m: np.ndarray,
    frame_index: int,
    time_sec: float,
) -> List[Dict]:
    """Sample the physical 3-D concentration field at model-bound sensor heights."""

    readings: List[Dict] = []
    for sensor in sensors:
        raw_map_point = sensor.get("mapPoint") or {}
        map_point = raw_map_point if isinstance(raw_map_point, Mapping) else {}
        sensor_x = parse_float(
            sensor.get("x") if sensor.get("x") is not None else map_point.get("x"),
            0.0,
            "sensor.x",
        )
        sensor_y = parse_float(
            sensor.get("y") if sensor.get("y") is not None else map_point.get("y"),
            0.0,
            "sensor.y",
        )
        sensor_height_m = parse_float(
            sensor.get("heightMeters")
            if sensor.get("heightMeters") is not None
            else sensor.get("installationHeight"),
            1.5,
            "sensor.installationHeight",
        )
        concentration = sample_volume_at_point(
            concentration_volume,
            xs,
            ys,
            z_levels_m,
            sensor_x,
            sensor_y,
            sensor_height_m,
        )
        readings.append(
            {
                "sensorId": sensor.get("id", ""),
                "frameIndex": frame_index,
                "timeSec": time_sec,
                "heightMeters": round(sensor_height_m, 3),
                "concentration": round(concentration, 4),
            }
        )
    return readings


def sample_volume_at_point(
    concentration_volume: np.ndarray,
    xs: np.ndarray,
    ys: np.ndarray,
    z_levels_m: np.ndarray,
    x: float,
    y: float,
    z_meters: float,
) -> float:
    """Trilinearly interpolate one physical sensor observation from the 3-D grid."""

    if concentration_volume.size == 0:
        return 0.0

    def axis_coordinate(values: np.ndarray, value: float) -> tuple[int, int, float]:
        if len(values) == 1:
            return 0, 0, 0.0
        coordinate = (value - float(values[0])) / max(float(values[1] - values[0]), 1e-12)
        coordinate = clamp(coordinate, 0.0, len(values) - 1.0)
        lower = int(math.floor(coordinate))
        upper = min(lower + 1, len(values) - 1)
        return lower, upper, coordinate - lower

    column0, column1, column_weight = axis_coordinate(xs, x)
    row0, row1, row_weight = axis_coordinate(ys, y)
    level0, level1, level_weight = axis_coordinate(z_levels_m, z_meters)

    lower = (
        concentration_volume[level0, row0, column0] * (1.0 - row_weight) * (1.0 - column_weight)
        + concentration_volume[level0, row0, column1] * (1.0 - row_weight) * column_weight
        + concentration_volume[level0, row1, column0] * row_weight * (1.0 - column_weight)
        + concentration_volume[level0, row1, column1] * row_weight * column_weight
    )
    upper = (
        concentration_volume[level1, row0, column0] * (1.0 - row_weight) * (1.0 - column_weight)
        + concentration_volume[level1, row0, column1] * (1.0 - row_weight) * column_weight
        + concentration_volume[level1, row1, column0] * row_weight * (1.0 - column_weight)
        + concentration_volume[level1, row1, column1] * row_weight * column_weight
    )
    return float(lower * (1.0 - level_weight) + upper * level_weight)


def build_velocity_field(
    grid_x: np.ndarray,
    grid_y: np.ndarray,
    source: Dict,
    params: ConditionedAdvectionParams,
    wake_obstacles: Sequence[Dict],
    channel_segments: Sequence[Dict],
    hard_block_grid: np.ndarray,
    obstacle_factor_grid: np.ndarray,
    channel_factor_grid: np.ndarray,
    gas: Dict,
    wind_direction_degrees: float,
    frame_seed: int,
    visible_mask: np.ndarray,
    concentration_field: np.ndarray,
    release_height_m: float,
    wind_speed_mps: float,
    max_cells: int = MAX_VOLUME_CELLS_PER_RESPONSE,
) -> Dict:
    """逐格点合成三维速度场，驱动前端粒子流场可视化。

    与官方三维流场（ParticleVelocityField）对齐：每个格点输出
    u（向东）/ v（向南）/ w（垂直向上）三个速度分量（m/s），
    并携带格点浓度用于粒子颜色映射。

    合成顺序：
        1. 基准风：u0 = wind * cos(θ)，v0 = wind * sin(θ)。
        2. 障碍阻力：在阻力带内按 obstacle_factor 减速。
        3. 障碍侧偏：在拖曳/遮蔽区内叠加 turnBias * dragStrength * wind
           的横风分量，模拟尾流横向偏转。
        4. 通道加速：沿通道方向按 channel_factor 加速。
        5. 硬阻挡：速度置零（建筑内无风流）。
        6. 湍流扰动：确定性噪声（帧种子 + 格点坐标哈希）乘以
           sigv/sigw（缺失时默认 0.3/0.2 倍风速），保证同参可复现。
        7. W 分量：气体物性浮升（nh3/ch4 为正，o2 为负），近源随高度衰减。

    速度向量直接落在局部图坐标系（+X 向东、+Y 向南），与前端
    ``mapPointToSceneCartesian`` 的 east/north 换算约定一致。

    参数：
        grid_x/grid_y: 格点像素坐标矩阵。
        source: 泄漏源 {"x", "y"} 局部图坐标。
        params: 条件化对流参数（sigv/sigw/有效风速）。
        wake_obstacles: 尾流障碍物几何（含 turnBias/dragStrength）。
        channel_segments: 道路通道段。
        hard_block_grid/obstacle_factor_grid/channel_factor_grid: 帧循环
            已预计算的乘性掩码矩阵。
        gas: 气体元数据（particleProfile.buoyancyMetersPerSecond）。
        wind_direction_degrees: 风向角（算法语义）。
        frame_seed: 帧种子（由 frame_index 派生，保证确定性）。
        visible_mask: 可见格点掩码（与浓度 cells 同源，控制输出体积）。
        release_height_m: 释放高度（米）。
        wind_speed_mps: 有效风速（m/s）。

    返回：
        速度场摘要 dict：
        {
            "cells": [{"x","y","zMeters","u","v","w","speed","concentration"}...],
            "units": "metersPerSecond",
            "coordinateSystem": "LOCAL_MAP_PX_X_EAST_Y_SOUTH",
            "windSpeed10m": float,
            "windDirectionDegrees": float,
            "cellCount": int,
        }
    """
    profile = dict(gas.get("particleProfile") or {})
    buoyancy_mps = float(profile.get("buoyancyMetersPerSecond") or 0.0)
    source_x = float(source["x"])
    source_y = float(source["y"])

    wind_angle_radians = math.radians(wind_direction_degrees)
    cos_theta = math.cos(wind_angle_radians)
    sin_theta = math.sin(wind_angle_radians)
    base_u = wind_speed_mps * cos_theta
    base_v = wind_speed_mps * sin_theta

    sigv = getattr(params, "sigv_m_s", None) or max(wind_speed_mps * 0.3, 0.05)
    sigw = getattr(params, "sigw_m_s", None) or max(wind_speed_mps * 0.2, 0.03)

    visible_rows, visible_columns = np.nonzero(visible_mask)
    cells_out: List[Dict] = []
    for row, column in zip(visible_rows.tolist(), visible_columns.tolist()):
        cell_x = float(grid_x[row, column])
        cell_y = float(grid_y[row, column])

        if bool(hard_block_grid[row, column]):
            cells_out.append(
                {
                    "x": round(cell_x, 3),
                    "y": round(cell_y, 3),
                    "zMeters": round(release_height_m, 3),
                    "u": 0.0,
                    "v": 0.0,
                    "w": 0.0,
                    "speed": 0.0,
                    "concentration": 0.0,
                }
            )
            continue

        factor = float(obstacle_factor_grid[row, column])
        u = base_u * factor
        v = base_v * factor

        # 障碍侧偏：turnBias 产生横风分量（尾流横向偏转）。
        for obstacle in wake_obstacles:
            center = obstacle["center"]
            dx = cell_x - float(center["x"])
            dy = cell_y - float(center["y"])
            along = dx * cos_theta + dy * sin_theta
            cross = -dx * sin_theta + dy * cos_theta
            drag_band = 36.0
            if -18.0 <= along <= 120.0 and abs(cross) <= drag_band:
                core = 1.0 - min(1.0, abs(cross) / drag_band)
                drag_strength = core * float(obstacle.get("dragStrength") or 0.2)
                turn_bias = float(obstacle.get("turnBias") or 0.0)
                u += base_u * drag_strength * turn_bias * 0.5
                v += -base_v * drag_strength * turn_bias * 0.5

        # 通道加速。
        channel_factor = float(channel_factor_grid[row, column])
        u *= channel_factor
        v *= channel_factor

        # 确定性湍流扰动（同帧种子可复现）。无风时无湍流源，扰动归零。
        deterministic = (
            int(abs(float(cell_x)) * 73856093)
            ^ int(abs(float(cell_y)) * 19349663)
            ^ int(frame_seed) * 83492791
        ) % 1000
        noise_scale = 0.001
        if wind_speed_mps > 0.05:
            u += (deterministic % 201 - 100) * noise_scale * sigv
            v += ((deterministic // 7) % 201 - 100) * noise_scale * sigv
            w = ((deterministic // 31) % 201 - 100) * noise_scale * sigw
        else:
            w = 0.0

        # 浮升 W 分量：近源随高度衰减。
        distance_m = math.hypot(cell_x - source_x, cell_y - source_y)
        decay = math.exp(-distance_m / max(180.0, 1.0))
        w += buoyancy_mps * (1.0 - 0.45 * decay)

        concentration = float(concentration_field[row, column])
        speed = math.hypot(u, v, w)
        cells_out.append(
            {
                "x": round(cell_x, 3),
                "y": round(cell_y, 3),
                "zMeters": round(release_height_m, 3),
                "u": round(u, 4),
                "v": round(v, 4),
                "w": round(w, 4),
                "speed": round(speed, 4),
                "concentration": round(concentration, 4),
            }
        )

    capped = cells_out[: int(max_cells)]
    return {
        "cells": capped,
        "units": "metersPerSecond",
        "coordinateSystem": "LOCAL_MAP_PX_X_EAST_Y_SOUTH",
        "windSpeed10m": round(wind_speed_mps, 3),
        "windDirectionDegrees": round(wind_direction_degrees, 3),
        "cellCount": len(capped),
    }


def create_phase1_diffusion_simulation(payload: Dict) -> Dict:
    """运行第一阶段三维条件化平流扩散仿真。

    为每个时间步计算网格浓度场，并考虑神经代理响应、风平流、
    大气稳定度、障碍物影响、通道引导和传感器读数。

    参数：
        payload: 仿真参数，包括设施、道路、气体类型、源位置、风、稳定度、
            释放条件和地形配置。

    返回：
        仿真结果，包含气体信息、源点、帧数据、统计量、传感器序列和场景元数据。
    """
    facilities = payload.get("facilities") or []
    roads = payload.get("roads") or []
    gas_id = payload.get("gasId")
    gas_code = payload.get("gasCode")
    if gas_code and str(gas_code).strip().lower() != str(gas_id).strip().lower():
        raise ValueError("gasCode must match gasId")
    source_facility_id = payload.get("sourceFacilityId")
    source_map_point = payload.get("sourceMapPoint")
    source_rate = parse_float(payload.get("sourceRate"), 0.0, "sourceRate")
    release_duration = parse_float(payload.get("releaseDuration"), 0.0, "releaseDuration")
    initial_temperature = parse_float(payload.get("initialTemperature"), 25.0, "initialTemperature")
    initial_pressure = parse_float(payload.get("initialPressure"), 0.8, "initialPressure")
    release_height = parse_float(payload.get("releaseHeight"), 2.0, "releaseHeight")
    wind_speed = parse_float(payload.get("windSpeed"), 0.0, "windSpeed")
    wind_direction = parse_float(payload.get("windDirection"), 0.0, "windDirection")
    ambient_temperature = parse_float(payload.get("ambientTemperature"), 25.0, "ambientTemperature")
    humidity = parse_float(payload.get("humidity"), 55.0, "humidity")
    stability_class = normalize_stability(payload.get("stabilityClass") or "D")
    wind_reference_height = parse_float(
        payload.get("windReferenceHeight"), 10.0, "windReferenceHeight"
    )
    measured_wind_at_release = parse_optional_float(
        payload.get("windSpeedAtReleaseHeight"), "windSpeedAtReleaseHeight"
    )
    sigv = parse_optional_float(payload.get("sigvMps"), "sigvMps")
    sigw = parse_optional_float(payload.get("sigwMps"), "sigwMps")
    lagrangian_timescale = parse_optional_float(
        payload.get("lagrangianTimescaleS"), "lagrangianTimescaleS"
    )
    turbulence_timescale_fraction = parse_float(
        payload.get("turbulenceTimescaleMixingHeightFraction"),
        0.1,
        "turbulenceTimescaleMixingHeightFraction",
    )
    ground_loss_rate = parse_optional_float(payload.get("groundLossRateS"), "groundLossRateS")
    validate_nonnegative_optional(measured_wind_at_release, "windSpeedAtReleaseHeight")
    validate_nonnegative_optional(sigv, "sigvMps")
    validate_nonnegative_optional(sigw, "sigwMps")
    if lagrangian_timescale is not None and lagrangian_timescale <= 0.0:
        raise ValueError("lagrangianTimescaleS must be greater than zero")
    if turbulence_timescale_fraction <= 0.0:
        raise ValueError("turbulenceTimescaleMixingHeightFraction must be greater than zero")
    validate_nonnegative_optional(ground_loss_rate, "groundLossRateS")
    terrain_roughness = clamp(
        parse_float(payload.get("terrainRoughness"), 0.45, "terrainRoughness"), 0.05, 1.5
    )
    obstacle_influence_enabled = payload.get("obstacleInfluenceEnabled", True) is not False
    map_config = parse_map_config(payload)
    map_width = map_config["width"]
    map_height = map_config["height"]
    grid_size = map_config["gridSize"]
    map_meters_per_unit = map_config["mapMetersPerUnit"]
    raw_volume_fence = payload.get("volumeFence")
    if raw_volume_fence is None:
        volume_fence: Mapping[str, object] = {}
    elif isinstance(raw_volume_fence, Mapping):
        volume_fence = raw_volume_fence
    else:
        raise ValueError("volumeFence must be an object")
    max_volume_radius_m = clamp(
        parse_float(
            volume_fence.get("maxHorizontalRadiusMeters"),
            320.0,
            "volumeFence.maxHorizontalRadiusMeters",
        ),
        20.0,
        1000.0,
    )
    vertical_cell_size_m = clamp(
        parse_float(
            volume_fence.get("verticalCellSizeMeters") or payload.get("verticalCellSizeMeters"),
            DEFAULT_VERTICAL_CELL_SIZE_M,
            "verticalCellSizeMeters",
        ),
        1.0,
        20.0,
    )
    minimum_volume_height_m = max(
        0.0,
        release_height
        + parse_float(
            volume_fence.get("minRelativeHeightMeters"),
            -release_height,
            "volumeFence.minRelativeHeightMeters",
        ),
    )
    maximum_volume_height_m = max(
        minimum_volume_height_m + vertical_cell_size_m,
        release_height + vertical_cell_size_m,
        release_height
        + parse_float(
            volume_fence.get("maxRelativeHeightMeters"),
            80.0,
            "volumeFence.maxRelativeHeightMeters",
        ),
    )
    maximum_volume_height_m = min(
        maximum_volume_height_m,
        minimum_volume_height_m + vertical_cell_size_m * MAX_VERTICAL_LEVELS,
    )
    obstacle_height_m = clamp(
        parse_float(
            payload.get("obstacleHeightMeters"),
            DEFAULT_OBSTACLE_HEIGHT_M,
            "obstacleHeightMeters",
        ),
        0.0,
        maximum_volume_height_m,
    )
    # 钳制帧数到 [0, 600]，防止超大值耗尽资源（DoS）。
    frame_count = int(clamp(int(payload.get("frameCount") or 0), 0, 600))
    frame_step_sec = parse_float(payload.get("frameStepSec"), 1.0, "frameStepSec")
    max_volume_cells_per_frame = max(
        1,
        min(
            MAX_VOLUME_CELLS_PER_RESPONSE,
            MAX_VOLUME_CELLS_PER_RESPONSE // max(frame_count, 1),
        ),
    )
    sensors = payload.get("sensors") or []

    gas = get_gas_by_id(gas_id)
    if ground_loss_rate is not None:
        gas["groundLossRateS"] = ground_loss_rate
    source_facility = find_source_facility(facilities, source_facility_id)
    if not source_facility and not source_map_point:
        return {
            "gas": gas,
            "sourceFacility": None,
            "frames": [],
            "stats": {"peakConcentration": 0, "peakAffectedArea": 0},
        }

    source = normalize_source_point(source_map_point, map_width, map_height) or get_facility_center(
        source_facility
    )
    source = clamp_point_to_map(source, map_width, map_height)
    angle = wind_direction * math.pi / 180.0
    cos_theta = math.cos(angle)
    sin_theta = math.sin(angle)
    # Keep the terrain boundary check explicit even though the conditioned grid
    # model does not branch into Briggs urban/rural formulas. This preserves the
    # same accepted roughness range as the old model and avoids hidden request
    # contract drift.
    resolve_environment(terrain_roughness)
    hard_blockers = build_hard_blockers(facilities, source_facility_id=source_facility_id)
    wake_obstacles = build_wake_obstacles(facilities)
    channel_segments = build_channel_segments(roads)
    frames: List[Dict] = []
    sensor_series = initialize_sensor_series(sensors)
    peak_concentration = 0.0
    peak_affected_area = 0.0
    peak_danger_area = 0.0

    # 深度学习代理沿用这些物理条件参数。``sourceRate`` 解释为气体排放
    # 速率 Q（克/秒）；环境温度/压力用于设置 g/m3 -> ppm 换算所需的混合环境。
    ambient_temperature_k = ambient_temperature + 273.15
    ambient_pressure_pa = (
        initial_pressure * 1.0e5 if initial_pressure > 5.0 else max(initial_pressure, 0.5) * 1.013e5
    )
    params = ConditionedAdvectionParams(
        source_rate_g_s=max(source_rate, 0.0),
        wind_speed_10m=max(wind_speed, 0.0),
        wind_direction_deg=wind_direction,
        release_height_m=max(release_height, 0.0),
        # 零释放时长表示瞬时释放；数值求解仍需覆盖首个输出步，
        # 否则首帧 time=0 不会执行源项注入，前端会误判为该点位没有扩散。
        release_duration_s=max(release_duration, frame_step_sec),
        stability_class=stability_class,
        ambient_temperature_k=ambient_temperature_k,
        pressure_pa=ambient_pressure_pa,
        wind_reference_height_m=wind_reference_height,
        cell_size_px=grid_size,
        map_meters_per_unit=map_meters_per_unit,
        mixing_height_m=parse_float(
            payload.get("mixingHeightM"),
            DEFAULT_MIXING_HEIGHT_M,
            "mixingHeightM",
        ),
        gas=gas_condition_from_dict(gas),
        wind_speed_at_release_m_s=measured_wind_at_release,
        sigv_m_s=sigv,
        sigw_m_s=sigw,
        lagrangian_timescale_s=lagrangian_timescale,
        turbulence_timescale_mixing_height_fraction=turbulence_timescale_fraction,
    )

    # 预先计算一次网格几何：像素单位的单元中心。
    xs = np.arange(grid_size / 2, map_width, grid_size, dtype=float)
    ys = np.arange(grid_size / 2, map_height, grid_size, dtype=float)
    grid_x, grid_y = np.meshgrid(xs, ys, indexing="xy")

    # 湿度会轻微增强可溶气体的近地损耗；这里保留为小幅、显式的乘性衰减，
    # 避免变成隐藏因子。
    humidity_retention = clamp(1.0 - humidity * 0.0008, 0.85, 1.0)

    cell_area_m2 = grid_size * grid_size * map_meters_per_unit * map_meters_per_unit
    warning_threshold = float(gas["warningThreshold"])
    danger_threshold = float(gas["dangerThreshold"])
    # 保留低浓度羽流外缘，避免二维浓度场在到达远端前被显示阈值截断。
    visible_floor = max(warning_threshold * 0.005, 0.01)

    # 障碍遮蔽和道路通道效应只取决于单元位置、风向与几何，与时间帧无关，
    # 因此在帧循环外一次性预计算为乘性掩码场。每帧只需做向量化的
    # ``ppm_field *= obstacle_mask * channel_mask``，避免逐帧重复的逐单元
    # 障碍/通道遍历。
    grid_rows, grid_columns = grid_x.shape
    obstacle_factor_grid = np.ones((grid_rows, grid_columns), dtype=float)
    shadow_factor_grid = np.ones((grid_rows, grid_columns), dtype=float)
    channel_factor_grid = np.ones((grid_rows, grid_columns), dtype=float)
    hard_block_grid = np.zeros((grid_rows, grid_columns), dtype=bool)
    for row in range(grid_rows):
        for column in range(grid_columns):
            cell_x = float(grid_x[row, column])
            cell_y = float(grid_y[row, column])
            if obstacle_influence_enabled and is_inside_hard_blocker(cell_x, cell_y, hard_blockers):
                hard_block_grid[row, column] = True
                continue
            if obstacle_influence_enabled:
                obstacle_effect = evaluate_obstacle_effects(
                    x=cell_x,
                    y=cell_y,
                    cos_theta=cos_theta,
                    sin_theta=sin_theta,
                    wake_obstacles=wake_obstacles,
                )
                obstacle_factor_grid[row, column] = obstacle_effect["obstacleFactor"]
                shadow_factor_grid[row, column] = obstacle_effect["shadowFactor"]
            channel_effect = evaluate_channel_effects(
                x=cell_x,
                y=cell_y,
                wind_angle=angle,
                channel_segments=channel_segments,
            )
            channel_factor_grid[row, column] = channel_effect["channelFactor"]

    source_column = int(np.argmin(np.abs(xs - float(source["x"]))))
    source_row = int(np.argmin(np.abs(ys - float(source["y"]))))
    cleared_release_cells = clear_source_release_zone(hard_block_grid, source_row, source_column)
    z_levels_m = np.arange(
        minimum_volume_height_m + vertical_cell_size_m / 2.0,
        maximum_volume_height_m + 1e-9,
        vertical_cell_size_m,
        dtype=float,
    )
    if z_levels_m.size == 0:
        z_levels_m = np.array([release_height], dtype=float)
    source_level = int(np.argmin(np.abs(z_levels_m - release_height)))
    hard_block_volume = build_hard_block_volume(
        hard_block_grid,
        z_levels_m,
        obstacle_height_m,
    )
    hard_block_volume[
        :,
        max(source_row - 1, 0) : min(source_row + 2, grid_rows),
        max(source_column - 1, 0) : min(source_column + 2, grid_columns),
    ] = False
    gas_particle_profile = dict(gas.get("particleProfile") or {})
    vertical_velocity_m_s = float(gas_particle_profile.get("buoyancyMetersPerSecond") or 0.0)
    volume_solver = ConditionedAdvectionVolume(
        shape=(len(z_levels_m), grid_rows, grid_columns),
        source_level=source_level,
        source_row=source_row,
        source_col=source_column,
        params=params,
        vertical_cell_size_m=vertical_cell_size_m,
        vertical_velocity_m_s=vertical_velocity_m_s,
        hard_block_volume=hard_block_volume,
    )

    for frame_index in range(max(frame_count, 0)):
        # 输出帧表示 [t, t+frameStepSec] 的积分结果，第一帧必须包含源项。
        time_sec = (frame_index + 1) * frame_step_sec

        ppm_volume = volume_solver.advance_to(time_sec)
        ppm_volume[hard_block_volume] = 0.0
        ppm_volume = ppm_volume * humidity_retention

        cells: List[Dict] = []
        max_concentration = 0.0
        affected_area = 0.0
        warning_area = 0.0
        danger_area = 0.0

        # 在深度学习代理浓度之上叠加项目原有近场尾流/通道衰减，保留
        # 设施硬阻挡、道路通道和可见阈值等既有边界约束。
        concentration_volume = np.maximum(
            0.0,
            ppm_volume
            * obstacle_factor_grid[np.newaxis, :, :]
            * shadow_factor_grid[np.newaxis, :, :]
            * channel_factor_grid[np.newaxis, :, :],
        )
        concentration_field = np.max(concentration_volume, axis=0)
        ppm_field = np.max(ppm_volume, axis=0)
        # 与逐单元实现一致的可见性筛选：先过滤基础浓度，再排除硬阻挡单元，
        # 最后过滤叠加效应后的浓度。
        visible = (
            (ppm_field >= visible_floor)
            & (~hard_block_grid)
            & (concentration_field >= visible_floor)
        )
        # 泄漏源是业务上必须可见的锚点，即使局部遮蔽/阈值计算把它排除，
        # 也不能让某些设备点位出现“有源无扩散”的空帧。
        visible[source_row, source_column] = True
        visible_rows, visible_columns = np.nonzero(visible)
        for row, column in zip(visible_rows.tolist(), visible_columns.tolist()):
            concentration = float(concentration_field[row, column])
            level = "low"
            alpha = min(0.24, 0.05 + concentration / (danger_threshold * 8))
            if concentration >= danger_threshold:
                level = "danger"
                alpha = min(0.56, 0.22 + concentration / (danger_threshold * 10))
                danger_area += cell_area_m2
            elif concentration >= warning_threshold:
                level = "warning"
                alpha = min(0.42, 0.15 + concentration / (danger_threshold * 11))
                warning_area += cell_area_m2

            affected_area += cell_area_m2
            max_concentration = max(max_concentration, concentration)
            cells.append(
                {
                    "x": float(grid_x[row, column]),
                    "y": float(grid_y[row, column]),
                    "size": grid_size,
                    "concentration": round(concentration, 4),
                    "level": level,
                    "alpha": alpha,
                    "shadowFactor": round(float(shadow_factor_grid[row, column]), 4),
                    "channelFactor": round(float(channel_factor_grid[row, column]), 4),
                }
            )

        plume = plume_axes_from_field(
            concentration_field,
            grid_x,
            grid_y,
            source,
            angle,
            visible_floor,
            grid_size,
        )

        frame_sensor_readings = build_volume_sensor_readings(
            sensors,
            concentration_volume,
            xs,
            ys,
            z_levels_m,
            frame_index,
            time_sec,
        )
        volume_cells = build_physical_volume_cells(
            concentration_volume=concentration_volume,
            grid_x=grid_x,
            grid_y=grid_y,
            z_levels_m=z_levels_m,
            source=source,
            release_height_m=release_height,
            gas=gas,
            params=params,
            vertical_velocity_m_s=vertical_velocity_m_s,
            visible_floor=visible_floor,
            warning_threshold=warning_threshold,
            danger_threshold=danger_threshold,
            max_cells=max_volume_cells_per_frame,
        )
        # 三维流场：逐格点合成速度场并附加到体元与帧级摘要。
        # 速度场与浓度场同源（同格点、同掩码、同时序），驱动前端粒子流场。
        velocity_field = build_velocity_field(
            grid_x=grid_x,
            grid_y=grid_y,
            source=source,
            params=params,
            wake_obstacles=wake_obstacles,
            channel_segments=channel_segments,
            hard_block_grid=hard_block_grid,
            obstacle_factor_grid=obstacle_factor_grid,
            channel_factor_grid=channel_factor_grid,
            gas=gas,
            wind_direction_degrees=wind_direction,
            frame_seed=frame_index + 1,
            visible_mask=visible,
            concentration_field=concentration_field,
            release_height_m=max(release_height, 0.8),
            wind_speed_mps=params.effective_wind_m_s,
        )
        velocity_by_key = {
            (float(item["x"]), float(item["y"])): item for item in velocity_field["cells"]
        }
        for volume_cell in volume_cells:
            cell_x = float(volume_cell["x"])
            cell_y = float(volume_cell["y"])
            velocity = velocity_by_key.get((cell_x, cell_y))
            if velocity is None:
                volume_cell["velocityX"] = 0.0
                volume_cell["velocityY"] = 0.0
                continue
            volume_cell["velocityX"] = velocity["u"]
            volume_cell["velocityY"] = velocity["v"]
        append_sensor_series(sensor_series, frame_sensor_readings)
        peak_concentration = max(peak_concentration, max_concentration)
        peak_affected_area = max(peak_affected_area, affected_area)
        peak_danger_area = max(peak_danger_area, danger_area)
        frames.append(
            {
                "frameIndex": frame_index,
                "timeSec": time_sec,
                "maxConcentration": max_concentration,
                "affectedArea": affected_area,
                "warningArea": warning_area,
                "dangerArea": danger_area,
                "cells": cells,
                "volumeCells": volume_cells,
                "volumeGrid": {
                    "axisOrder": "z-y-x",
                    "shape": [len(z_levels_m), grid_rows, grid_columns],
                    "zLevelsMeters": [round(float(value), 3) for value in z_levels_m],
                    "horizontalCellSizeMeters": round(params.cell_size_m, 3),
                    "verticalCellSizeMeters": round(vertical_cell_size_m, 3),
                    "concentrationUnit": "ppm",
                    "sampledCellCount": len(volume_cells),
                    "isPhysicalConcentrationField": True,
                },
                "velocityField": velocity_field,
                "plume": {
                    **plume,
                    "model": "conditioned-advection-diffusion-3d",
                },
                "sensorReadings": frame_sensor_readings,
            }
        )

    return {
        "gas": gas,
        "sourceFacility": source_facility,
        "sourcePoint": {
            "x": round(float(source["x"]), 2),
            "y": round(float(source["y"]), 2),
            "zMeters": round(max(release_height, 0.0), 2),
        },
        "releaseGeometry": {
            "shape": "VOLUME",
            "center": {
                "x": round(float(source["x"]), 2),
                "y": round(float(source["y"]), 2),
                "zMeters": round(max(release_height, 0.0), 2),
            },
            "initialRadiusMeters": max(round(grid_size * map_meters_per_unit * 0.35, 2), 2.5),
            "maxHorizontalRadiusMeters": max_volume_radius_m,
            "minHeightMeters": round(float(z_levels_m[0]), 3),
            "maxHeightMeters": round(float(z_levels_m[-1]), 3),
            "verticalCellSizeMeters": round(vertical_cell_size_m, 3),
            "visualizationOnly": False,
            "concentrationSemantics": "three-dimensional-voxel-concentration",
            "maxVolumeCellsPerResponse": MAX_VOLUME_CELLS_PER_RESPONSE,
            "maxVolumeParticlesPerResponse": MAX_VOLUME_PARTICLES_PER_RESPONSE,
        },
        "map": map_config,
        "frames": frames,
        "stats": {
            "peakConcentration": peak_concentration,
            "peakAffectedArea": peak_affected_area,
            "peakDangerArea": peak_danger_area,
        },
        "sensorSeries": sensor_series,
        "scenarioMeta": {
            "velocityField": True,
            "concentrationFieldDimensions": 3,
            "gasId": gas_id,
            "sourceRate": source_rate,
            "releaseDuration": release_duration,
            "initialTemperature": initial_temperature,
            "initialPressure": initial_pressure,
            "releaseHeight": release_height,
            "sourceShape": "VOLUME",
            "windSpeed": wind_speed,
            "windDirection": wind_direction,
            "ambientTemperature": ambient_temperature,
            "humidity": humidity,
            "stabilityClass": stability_class,
            "terrainRoughness": terrain_roughness,
            "windReferenceHeight": wind_reference_height,
            "windSpeedAtReleaseHeight": measured_wind_at_release,
            "sigvMps": sigv,
            "sigwMps": sigw,
            "lagrangianTimescaleS": params.lagrangian_timescale_s,
            "turbulenceTimescaleMixingHeightFraction": turbulence_timescale_fraction,
            "groundLossRateS": ground_loss_rate,
            "derivedLagrangianTimescaleYS": params.turbulence_timescale_y_s,
            "derivedLagrangianTimescaleZS": params.turbulence_timescale_z_s,
            "mapWidth": map_width,
            "mapHeight": map_height,
            "gridSize": grid_size,
            "mapMetersPerUnit": map_meters_per_unit,
            "clearedReleaseCells": cleared_release_cells,
            "mixingHeightM": params.mixing_height_m,
            "verticalCellSizeMeters": vertical_cell_size_m,
            "minimumVolumeHeightMeters": minimum_volume_height_m,
            "maximumVolumeHeightMeters": maximum_volume_height_m,
            "verticalLevelCount": len(z_levels_m),
            "obstacleHeightMeters": obstacle_height_m,
            "diffusionModel": "conditioned-advection-diffusion-3d",
            "conditionVector": {
                "relativeDensity": params.gas.relative_density,
                "diffusivityM2s": params.gas.diffusivity_m2_s,
                "condBuoyancy": params.gas.cond_buoyancy,
                "condDiffusivity": params.gas.cond_diffusivity,
            },
            "obstacleInfluenceEnabled": obstacle_influence_enabled,
            "frameCount": frame_count,
            "frameStepSec": frame_step_sec,
        },
    }


def parse_map_config(payload: Dict) -> Dict[str, float]:
    """Resolve map geometry while preserving the historical defaults."""

    map_payload = payload.get("map") or {}
    width = parse_float(map_payload.get("width") or payload.get("mapWidth"), MAP_WIDTH, "map.width")
    height = parse_float(
        map_payload.get("height") or payload.get("mapHeight"), MAP_HEIGHT, "map.height"
    )
    grid_size = parse_float(
        map_payload.get("gridSize") or payload.get("gridSize"), GRID_SIZE, "map.gridSize"
    )
    meters_per_unit = parse_float(
        map_payload.get("mapMetersPerUnit") or payload.get("mapMetersPerUnit"),
        MAP_METERS_PER_UNIT,
        "map.mapMetersPerUnit",
    )
    return {
        "width": clamp(width, 100.0, 5000.0),
        "height": clamp(height, 100.0, 5000.0),
        "gridSize": clamp(grid_size, 5.0, 100.0),
        "mapMetersPerUnit": clamp(meters_per_unit, 0.05, 10.0),
    }


def find_source_facility(
    facilities: Sequence[Dict], source_facility_id: Optional[str]
) -> Optional[Dict]:
    """按 ID 查找源设施，找不到时退回到第一个储罐/塔器。

    参数：
        facilities: 带 'id' 和 'type' 字段的设施对象列表。
        source_facility_id: 目标设施 ID；为 None 时使用兜底逻辑。

    返回：
        匹配的设施字典；若设施列表为空则返回 None。
    """
    if source_facility_id:
        for facility in facilities:
            if facility.get("id") == source_facility_id:
                return dict(facility)
    scoped = [
        facility
        for facility in facilities
        if facility.get("type") in ("tank", "tower") or facility.get("key")
    ]
    if scoped:
        return dict(scoped[0])
    return dict(facilities[0]) if facilities else None


def normalize_source_point(
    source_map_point: Optional[Dict],
    map_width: Optional[float] = None,
    map_height: Optional[float] = None,
) -> Optional[Dict]:
    """将源地图点规范化为干净的 (x, y) 字典。

    参数：
        source_map_point: 原始地图点字典，或 None。

    返回：
        包含浮点 'x' 和 'y' 的规范化点字典，或 None。
    """
    if not source_map_point:
        return None
    point = {
        "x": float(source_map_point.get("x", 0)),
        "y": float(source_map_point.get("y", 0)),
    }
    if map_width is not None and map_height is not None:
        return clamp_point_to_map(point, map_width, map_height)
    return point


def clamp_point_to_map(point: Dict, map_width: float, map_height: float) -> Dict:
    """Clamp a map point to the active simulation rectangle."""

    return {
        "x": clamp(float(point.get("x", 0.0)), 0.0, float(map_width)),
        "y": clamp(float(point.get("y", 0.0)), 0.0, float(map_height)),
    }


def get_facility_center(facility: Optional[Dict]) -> Dict:
    """获取设施中心点。

    参数：
        facility: 包含类型、位置和尺寸的设施字典。

    返回：
        包含中心点 'x' 和 'y' 坐标的字典。
    """
    facility = facility or {}
    if facility.get("type") in ("tank", "tower") and not ("w" in facility and "h" in facility):
        return {"x": float(facility.get("x", 0)), "y": float(facility.get("y", 0))}
    return {
        "x": float(facility.get("x", 0)) + float(facility.get("w", 0)) / 2.0,
        "y": float(facility.get("y", 0)) + float(facility.get("h", 0)) / 2.0,
    }


def build_hard_blockers(
    facilities: Sequence[Dict], source_facility_id: Optional[str] = None
) -> List[Dict]:
    """根据设施生成硬阻挡几何（不可穿透区域）。

    非储罐/塔器设施会向外扩展 4 个单位，并作为气体不可穿透的硬阻挡物。
    当前泄漏设施会从硬阻挡中排除，避免真实项目里选择仓储/物流区为源时，
    源点被同一设施边界清零而无法扩散。

    参数：
        facilities: 带位置和尺寸的设施对象列表。
        source_facility_id: 当前泄漏设施 ID；匹配设施不作为硬阻挡。

    返回：
        阻挡物字典列表，包含 'id'、'x1'、'x2'、'y1'、'y2' 边界。
    """
    blockers: List[Dict] = []
    for facility in facilities:
        if source_facility_id and facility.get("id") == source_facility_id:
            continue
        if facility.get("type") in ("tank", "tower"):
            continue
        blockers.append(
            {
                "id": facility.get("id", ""),
                "x1": float(facility.get("x", 0)) - 4.0,
                "x2": float(facility.get("x", 0)) + float(facility.get("w", 0)) + 4.0,
                "y1": float(facility.get("y", 0)) - 4.0,
                "y2": float(facility.get("y", 0)) + float(facility.get("h", 0)) + 4.0,
            }
        )
    return blockers


def clear_source_release_zone(
    hard_block_grid: np.ndarray,
    source_row: int,
    source_column: int,
    radius_cells: int = 1,
) -> int:
    """清理源点附近的小释放区，防止网格量化把注入质量立即清零。"""

    if hard_block_grid.size == 0:
        return 0
    row_min = max(int(source_row) - radius_cells, 0)
    row_max = min(int(source_row) + radius_cells + 1, hard_block_grid.shape[0])
    column_min = max(int(source_column) - radius_cells, 0)
    column_max = min(int(source_column) + radius_cells + 1, hard_block_grid.shape[1])
    before = int(np.count_nonzero(hard_block_grid[row_min:row_max, column_min:column_max]))
    hard_block_grid[row_min:row_max, column_min:column_max] = False
    return before


def build_wake_obstacles(facilities: Sequence[Dict]) -> List[Dict]:
    """根据设施生成会产生尾流的障碍物几何。

    为储罐（圆形）以及塔器/其他设施（矩形）生成带尾流参数的障碍物，
    用于模拟流场扰动。

    参数：
        facilities: 带类型和尺寸的设施对象列表。

    返回：
        障碍物字典列表，包含形状、中心、尾流偏移、遮挡强度和阻力参数。
    """
    obstacles: List[Dict] = []
    for index, facility in enumerate(facilities):
        center = get_facility_center(facility)
        if facility.get("type") == "tank":
            if "w" in facility and "h" in facility:
                obstacles.append(
                    {
                        "id": facility.get("id", ""),
                        "shape": "rect",
                        "center": center,
                        "halfWidth": float(facility.get("w", 0)) / 2.0 + 6.0,
                        "halfHeight": float(facility.get("h", 0)) / 2.0 + 6.0,
                        "wakeShift": 6.4,
                        "shadowStrength": 0.74,
                        "dragStrength": 0.24,
                        "turnBias": 1 if index % 2 == 0 else -1,
                    }
                )
                continue
            radius = float(facility.get("r", 0)) + 6.0
            obstacles.append(
                {
                    "id": facility.get("id", ""),
                    "shape": "circle",
                    "center": center,
                    "radius": radius,
                    "wakeShift": 5.6,
                    "shadowStrength": 0.72,
                    "dragStrength": 0.22,
                    "turnBias": 1 if index % 2 == 0 else -1,
                }
            )
            continue

        if facility.get("type") == "tower":
            half_width = (
                float(facility.get("w", 0)) / 2.0 + 6.0
                if "w" in facility
                else float(facility.get("r", 0)) + 6.0
            )
            half_height = float(facility.get("h", 0)) / 2.0 + 6.0
            obstacles.append(
                {
                    "id": facility.get("id", ""),
                    "shape": "rect",
                    "center": center,
                    "halfWidth": half_width,
                    "halfHeight": half_height,
                    "wakeShift": 7.5,
                    "shadowStrength": 0.78,
                    "dragStrength": 0.28,
                    "turnBias": 1 if index % 2 == 0 else -1,
                }
            )
            continue

        half_width = float(facility.get("w", 0)) / 2.0 + 8.0
        half_height = float(facility.get("h", 0)) / 2.0 + 8.0
        obstacles.append(
            {
                "id": facility.get("id", ""),
                "shape": "rect",
                "center": center,
                "halfWidth": half_width,
                "halfHeight": half_height,
                "wakeShift": 8.8,
                "shadowStrength": 0.88,
                "dragStrength": 0.36,
                "turnBias": 1 if index % 2 == 0 else -1,
            }
        )
    return obstacles


def build_channel_segments(roads: Sequence[Dict]) -> List[Dict]:
    """生成用于风流引导的道路通道段。

    将道路矩形转换为带宽度和角度的有向线段，用于计算通道效应。

    参数：
        roads: 带位置和尺寸的道路对象列表。

    返回：
        通道段字典列表，包含角度、中心、长度和宽度。
    """
    segments: List[Dict] = []
    for road in roads:
        width = max(float(road.get("w", 0)), float(road.get("h", 0)))
        horizontal = float(road.get("w", 0)) >= float(road.get("h", 0))
        if horizontal:
            segments.append(
                {
                    "angle": 0.0,
                    "centerX": float(road.get("x", 0)) + float(road.get("w", 0)) / 2.0,
                    "centerY": float(road.get("y", 0)) + float(road.get("h", 0)) / 2.0,
                    "halfLength": float(road.get("w", 0)) / 2.0,
                    "halfWidth": max(float(road.get("h", 0)) / 2.0, 5.0),
                    "width": width,
                }
            )
        else:
            segments.append(
                {
                    "angle": math.pi / 2.0,
                    "centerX": float(road.get("x", 0)) + float(road.get("w", 0)) / 2.0,
                    "centerY": float(road.get("y", 0)) + float(road.get("h", 0)) / 2.0,
                    "halfLength": float(road.get("h", 0)) / 2.0,
                    "halfWidth": max(float(road.get("w", 0)) / 2.0, 5.0),
                    "width": width,
                }
            )
    return segments


def is_inside_hard_blocker(x: float, y: float, hard_blockers: Sequence[Dict]) -> bool:
    """检查点是否位于任意硬阻挡区域内。

    参数：
        x: 待检查的 X 坐标。
        y: 待检查的 Y 坐标。
        hard_blockers: 阻挡物边界字典列表。

    返回：
        若点落在任一阻挡物边界内，则返回 True。
    """
    for blocker in hard_blockers:
        if blocker["x1"] <= x <= blocker["x2"] and blocker["y1"] <= y <= blocker["y2"]:
            return True
    return False


def evaluate_obstacle_effects(
    x: float, y: float, cos_theta: float, sin_theta: float, wake_obstacles: Sequence[Dict]
) -> Dict:
    """评估某点处的障碍阻力、遮挡和尾流效应。

    根据障碍物几何和风向，计算障碍物如何改变该位置的风流和气体浓度。

    参数：
        x: 评估点 X 坐标。
        y: 评估点 Y 坐标。
        cos_theta: 风向角余弦。
        sin_theta: 风向角正弦。
        wake_obstacles: 障碍物几何字典列表。

    返回：
        包含 obstacleFactor 和 shadowFactor 的字典。
    """
    obstacle_factor = 1.0
    shadow_factor = 1.0
    for obstacle in wake_obstacles:
        center = obstacle["center"]
        dx = x - center["x"]
        dy = y - center["y"]
        along = dx * cos_theta + dy * sin_theta
        cross = -dx * sin_theta + dy * cos_theta
        half_along, half_cross = get_obstacle_projection_extent(obstacle, cos_theta, sin_theta)
        if along < -30 or abs(cross) > half_cross + 72:
            continue

        drag_band = half_cross + 24.0
        if -18.0 <= along <= half_along + 80.0 and abs(cross) <= drag_band:
            drag_core = 1.0 - min(1.0, abs(cross) / max(drag_band, 1.0))
            drag_decay = 1.0 - min(1.0, max(0.0, along + 18.0) / max(half_along + 98.0, 1.0))
            drag_strength = drag_core * max(0.15, drag_decay) * float(obstacle["dragStrength"])
            obstacle_factor *= max(0.42, 1.0 - drag_strength)

        shadow_band = half_cross + 18.0
        if along > half_along and along < half_along + 220.0 and abs(cross) <= shadow_band:
            shadow_depth = 1.0 - min(1.0, (along - half_along) / 220.0)
            shadow_core = 1.0 - min(1.0, abs(cross) / max(shadow_band, 1.0))
            shadow_strength = shadow_depth * shadow_core * float(obstacle["shadowStrength"])
            shadow_factor *= max(0.08, 1.0 - shadow_strength)

    return {
        "obstacleFactor": max(0.16, obstacle_factor),
        "shadowFactor": max(0.05, shadow_factor),
    }


def evaluate_channel_effects(
    x: float, y: float, wind_angle: float, channel_segments: Sequence[Dict]
) -> Dict:
    """评估道路通道对风和扩散的引导效应。

    计算道路通道如何约束并加速风流，从而影响沿风向和横风向扩散尺度。

    参数：
        x: 评估点 X 坐标。
        y: 评估点 Y 坐标。
        wind_angle: 风向，单位弧度。
        channel_segments: 通道段几何字典列表。

    返回：
        包含 channelFactor 的字典。
    """
    best_channel_factor = 1.0
    for segment in channel_segments:
        distance = distance_to_channel(x, y, segment)
        influence_band = segment["halfWidth"] + 18.0
        if distance > influence_band:
            continue
        alignment = abs(math.cos(wind_angle - float(segment["angle"])))
        if alignment < 0.55:
            continue
        center_bias = 1.0 - min(1.0, distance / max(influence_band, 1.0))
        strength = alignment * center_bias
        best_channel_factor = max(best_channel_factor, 1.0 + strength * 0.34)

    return {
        "channelFactor": best_channel_factor,
    }


def get_obstacle_projection_extent(
    obstacle: Dict, cos_theta: float, sin_theta: float
) -> tuple[float, float]:
    """获取障碍物沿风向投影后的半尺寸。

    参数：
        obstacle: 障碍物几何字典，包含形状、半径/半宽/半高。
        cos_theta: 风向角余弦。
        sin_theta: 风向角正弦。

    返回：
        投影尺寸元组 (half_along, half_cross)。
    """
    if obstacle["shape"] == "circle":
        radius = float(obstacle["radius"])
        return radius, radius
    half_width = float(obstacle["halfWidth"])
    half_height = float(obstacle["halfHeight"])
    half_along = abs(cos_theta) * half_width + abs(sin_theta) * half_height
    half_cross = abs(sin_theta) * half_width + abs(cos_theta) * half_height
    return half_along, half_cross


def distance_to_channel(x: float, y: float, segment: Dict) -> float:
    """计算点到通道段的最小距离。

    参数：
        x: 点的 X 坐标。
        y: 点的 Y 坐标。
        segment: 包含中心、长度和角度的通道段字典。

    返回：
        到通道段的最小欧氏距离。
    """
    local_x = x - float(segment["centerX"])
    local_y = y - float(segment["centerY"])
    if abs(float(segment["angle"])) < 1e-6:
        overflow = max(0.0, abs(local_x) - float(segment["halfLength"]))
        return math.hypot(overflow, local_y)
    overflow = max(0.0, abs(local_y) - float(segment["halfLength"]))
    return math.hypot(local_x, overflow)


def initialize_sensor_series(sensors: Sequence[Dict]) -> List[Dict]:
    """初始化空的传感器序列跟踪结构。

    参数：
        sensors: 带 'id' 字段的传感器对象列表。

    返回：
        传感器序列字典列表，包含 sensorId 和空 series 列表。
    """
    return [{"sensorId": sensor.get("id", ""), "series": []} for sensor in sensors]


def build_frame_sensor_readings(
    sensors: Sequence[Dict], cells: Sequence[Dict], frame_index: int, time_sec: float
) -> List[Dict]:
    """构建单帧传感器读数。

    查询每个传感器位置对应的单元浓度。

    参数：
        sensors: 带位置数据的传感器对象列表。
        cells: 当前帧的单元浓度数据列表。
        frame_index: 当前帧索引。
        time_sec: 当前时间，单位秒。

    返回：
        带浓度值的传感器读数字典列表。
    """
    readings = []
    for sensor in sensors:
        readings.append(
            {
                "sensorId": sensor.get("id", ""),
                "frameIndex": frame_index,
                "timeSec": time_sec,
                "concentration": get_cell_concentration_at_point(
                    cells,
                    float(
                        sensor.get("x")
                        if sensor.get("x") is not None
                        else sensor.get("mapPoint", {}).get("x", 0)
                    ),
                    float(
                        sensor.get("y")
                        if sensor.get("y") is not None
                        else sensor.get("mapPoint", {}).get("y", 0)
                    ),
                ),
            }
        )
    return readings


def append_sensor_series(sensor_series: List[Dict], frame_sensor_readings: Sequence[Dict]) -> None:
    """将帧读数追加到传感器序列桶中。

    参数：
        sensor_series: 要更新的可变传感器序列字典列表。
        frame_sensor_readings: 当前帧读数。
    """
    bucket_map = {item["sensorId"]: item for item in sensor_series}
    for reading in frame_sensor_readings:
        bucket = bucket_map.get(reading["sensorId"])
        if bucket is None:
            continue
        bucket["series"].append(
            {
                "frameIndex": int(reading["frameIndex"]),
                "timeSec": float(reading["timeSec"]),
                "concentration": round(float(reading["concentration"]), 4),
            }
        )


def get_cell_concentration_at_point(cells: Sequence[Dict], x: float, y: float) -> float:
    """根据单元数据获取某点处的插值浓度。

    查找最近单元，并按距离应用衰减。

    参数：
        cells: 单元字典列表，包含 'x'、'y'、'size' 和 'concentration'。
        x: 目标 X 坐标。
        y: 目标 Y 坐标。

    返回：
        插值浓度值；若没有单元则返回 0.0。
    """
    if not cells:
        return 0.0
    nearest = None
    min_distance = math.inf
    for cell in cells:
        distance = math.hypot(float(cell.get("x", 0)) - x, float(cell.get("y", 0)) - y)
        if distance < min_distance:
            min_distance = distance
            nearest = cell
    if nearest is None:
        return 0.0
    fade = max(0.0, 1.0 - min_distance / max(float(nearest.get("size", 0)) * 1.8, 1.0))
    return float(nearest.get("concentration", 0)) * fade


def parse_float(value: object, default: float, field_name: str = "value") -> float:
    """从对象解析浮点数，缺失时返回默认值。

    参数：
        value: 要转换为浮点数的输入值。
        default: 输入缺失时使用的默认值。
        field_name: 错误消息中的字段名。

    返回：
        解析得到的浮点数，或缺失字段的默认值。

    Raises:
        ValueError: 如果字段存在但不是有效数字。
    """
    if value is None or value == "":
        return default
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number, got {value!r}") from None
    if not math.isfinite(parsed):
        raise ValueError(f"{field_name} must be a finite number")
    return parsed


def parse_optional_float(value: object, field_name: str) -> float | None:
    """Parse an optional numeric input without silently coercing invalid values."""

    if value is None or value == "":
        return None
    return parse_float(value, 0.0, field_name)


def validate_nonnegative_optional(value: float | None, field_name: str) -> None:
    """Reject invalid measured meteorology instead of coercing it to zero."""

    if value is not None and value < 0.0:
        raise ValueError(f"{field_name} must be greater than or equal to zero")
