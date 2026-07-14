"""第一阶段物理信息深度学习扩散仿真。

实现基于 PyTorch 气体响应代理模型的网格扩散，并以条件化对流-扩散核
作为物理锚点，同时考虑障碍物、通道和大气稳定度影响。
用于化工厂气体泄漏场景仿真。

主要特性：
    - 基于网格的浓度计算，分辨率可配置。
    - 建筑和设备的尾流/遮挡影响。
    - 道路通道对风流的引导作用。
    - 支持带密度和扩散偏置的多种气体。
    - 传感器读数仿真。

典型用法：
    result = create_phase1_diffusion_simulation(payload)
"""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Sequence

import numpy as np

from .conditioned_advection import (
    DEFAULT_MIXING_HEIGHT_M,
    ConditionedAdvectionParams,
    gas_condition_from_dict,
    plume_axes_from_field,
)
from .gaussian_plume import (
    normalize_stability,
    resolve_environment,
)
from ..deep_learning.gas_surrogate import deep_transient_field, ensure_deep_surrogate


MAP_WIDTH = 1000
MAP_HEIGHT = 650
GRID_SIZE = 20
MAP_METERS_PER_UNIT = 0.5


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


def create_phase1_diffusion_simulation(payload: Dict) -> Dict:
    """运行第一阶段深度学习代理扩散仿真。

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
    source_facility_id = payload.get("sourceFacilityId")
    source_map_point = payload.get("sourceMapPoint")
    source_rate = float(payload.get("sourceRate") or 0)
    release_duration = float(payload.get("releaseDuration") or 0)
    initial_temperature = parse_float(payload.get("initialTemperature"), 25.0, "initialTemperature")
    initial_pressure = parse_float(payload.get("initialPressure"), 0.8, "initialPressure")
    release_height = parse_float(payload.get("releaseHeight"), 2.0, "releaseHeight")
    wind_speed = float(payload.get("windSpeed") or 0)
    wind_direction = float(payload.get("windDirection") or 0)
    ambient_temperature = parse_float(payload.get("ambientTemperature"), 25.0, "ambientTemperature")
    humidity = parse_float(payload.get("humidity"), 55.0, "humidity")
    stability_class = normalize_stability(payload.get("stabilityClass") or "D")
    wind_reference_height = parse_float(payload.get("windReferenceHeight"), 10.0, "windReferenceHeight")
    terrain_roughness = clamp(parse_float(payload.get("terrainRoughness"), 0.45, "terrainRoughness"), 0.05, 1.5)
    obstacle_influence_enabled = payload.get("obstacleInfluenceEnabled", True) is not False
    map_config = parse_map_config(payload)
    map_width = map_config["width"]
    map_height = map_config["height"]
    grid_size = map_config["gridSize"]
    map_meters_per_unit = map_config["mapMetersPerUnit"]
    # 钳制帧数到 [0, 600]，防止超大值耗尽资源（DoS）。
    frame_count = int(clamp(int(payload.get("frameCount") or 0), 0, 600))
    frame_step_sec = float(payload.get("frameStepSec") or 1)
    sensors = payload.get("sensors") or []

    gas = get_gas_by_id(gas_id)
    source_facility = find_source_facility(facilities, source_facility_id)
    if not source_facility and not source_map_point:
        return {
            "gas": gas,
            "sourceFacility": None,
            "frames": [],
            "stats": {"peakConcentration": 0, "peakAffectedArea": 0},
        }

    source = normalize_source_point(source_map_point, map_width, map_height) or get_facility_center(source_facility)
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
    ambient_pressure_pa = initial_pressure * 1.0e5 if initial_pressure > 5.0 else max(initial_pressure, 0.5) * 1.013e5
    params = ConditionedAdvectionParams(
        source_rate_g_s=max(source_rate, 0.0),
        wind_speed_10m=max(wind_speed, 0.0),
        wind_direction_deg=wind_direction,
        release_height_m=max(release_height, 0.0),
        release_duration_s=max(release_duration, 0.0),
        stability_class=stability_class,
        ambient_temperature_k=ambient_temperature_k,
        pressure_pa=ambient_pressure_pa,
        wind_reference_height_m=wind_reference_height,
        cell_size_px=grid_size,
        map_meters_per_unit=map_meters_per_unit,
        mixing_height_m=float(payload.get("mixingHeightM") or DEFAULT_MIXING_HEIGHT_M),
        gas=gas_condition_from_dict(gas),
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
    # 扩散晕的淡可见下限（ppm）。
    visible_floor = max(warning_threshold * 0.02, 0.05)

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
    deep_surrogate = ensure_deep_surrogate()

    for frame_index in range(max(frame_count, 0)):
        time_sec = frame_index * frame_step_sec

        ppm_field = deep_transient_field(grid_x, grid_y, source, params, time_sec)
        ppm_field[hard_block_grid] = 0.0
        ppm_field = ppm_field * humidity_retention

        cells: List[Dict] = []
        max_concentration = 0.0
        affected_area = 0.0
        warning_area = 0.0
        danger_area = 0.0

        # 在深度学习代理浓度之上叠加项目原有近场尾流/通道衰减，保留
        # 设施硬阻挡、道路通道和可见阈值等既有边界约束。
        concentration_field = np.maximum(
            0.0,
            ppm_field * obstacle_factor_grid * shadow_factor_grid * channel_factor_grid,
        )
        # 与逐单元实现一致的可见性筛选：先过滤基础浓度，再排除硬阻挡单元，
        # 最后过滤叠加效应后的浓度。
        visible = (ppm_field >= visible_floor) & (~hard_block_grid) & (
            concentration_field >= visible_floor
        )
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

        frame_sensor_readings = build_frame_sensor_readings(sensors, cells, frame_index, time_sec)
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
                "plume": {
                    **plume,
                    "model": "deep-learning-surrogate-diffusion",
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
            "gasId": gas_id,
            "sourceRate": source_rate,
            "releaseDuration": release_duration,
            "initialTemperature": initial_temperature,
            "initialPressure": initial_pressure,
            "releaseHeight": release_height,
            "windSpeed": wind_speed,
            "windDirection": wind_direction,
            "ambientTemperature": ambient_temperature,
            "humidity": humidity,
            "stabilityClass": stability_class,
            "terrainRoughness": terrain_roughness,
            "windReferenceHeight": wind_reference_height,
            "mapWidth": map_width,
            "mapHeight": map_height,
            "gridSize": grid_size,
            "mapMetersPerUnit": map_meters_per_unit,
            "clearedReleaseCells": cleared_release_cells,
            "mixingHeightM": params.mixing_height_m,
            "diffusionModel": "deep-learning-surrogate-diffusion",
            "deepLearningModel": deep_surrogate.metadata,
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
    height = parse_float(map_payload.get("height") or payload.get("mapHeight"), MAP_HEIGHT, "map.height")
    grid_size = parse_float(map_payload.get("gridSize") or payload.get("gridSize"), GRID_SIZE, "map.gridSize")
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


def find_source_facility(facilities: Sequence[Dict], source_facility_id: Optional[str]) -> Optional[Dict]:
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
    scoped = [facility for facility in facilities if facility.get("type") in ("tank", "tower") or facility.get("key")]
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


def build_hard_blockers(facilities: Sequence[Dict], source_facility_id: Optional[str] = None) -> List[Dict]:
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


def evaluate_obstacle_effects(x: float, y: float, cos_theta: float, sin_theta: float, wake_obstacles: Sequence[Dict]) -> Dict:
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


def evaluate_channel_effects(x: float, y: float, wind_angle: float, channel_segments: Sequence[Dict]) -> Dict:
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


def get_obstacle_projection_extent(obstacle: Dict, cos_theta: float, sin_theta: float) -> tuple[float, float]:
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


def build_frame_sensor_readings(sensors: Sequence[Dict], cells: Sequence[Dict], frame_index: int, time_sec: float) -> List[Dict]:
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
                    float(sensor.get("x") if sensor.get("x") is not None else sensor.get("mapPoint", {}).get("x", 0)),
                    float(sensor.get("y") if sensor.get("y") is not None else sensor.get("mapPoint", {}).get("y", 0)),
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
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number, got {value!r}") from None
