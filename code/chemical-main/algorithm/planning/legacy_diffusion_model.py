"""Legacy diffusion model wrapper used by the gas evacuation chain."""

from __future__ import annotations

from dataclasses import dataclass, field
import math
from typing import Dict, List

from ..deep_learning.gas_surrogate import deep_sensor_response
from ..diffusion.conditioned_advection import (
    DEFAULT_MIXING_HEIGHT_M,
    ConditionedAdvectionParams,
    gas_condition_from_dict,
)
from .factory_layout import MAP_METERS_PER_UNIT, Point
from .gas_catalog import GAS_PROPERTIES_MAP, GasType

LEGACY_REGRESSION_ONLY = True
PUBLIC_SERVICE_EXPOSED = False
PRIMARY_DIFFUSION_MODULE = "algorithm.diffusion.phase1_diffusion"


@dataclass
class DiffusionConfig:
    source_rate: float = 8.0
    stability: int = 4
    wind_angle: float = 90.0
    wind_speed: float = 3.0
    temperature: float = 293.15
    pressure: float = 101325.0
    terrain_roughness: float = 0.6
    release_height: float = 1.5
    max_radius: float = 220.0
    sample_resolution: int = 32


@dataclass
class DiffusionResult:
    high_concentration: List[List[Point]] = field(default_factory=list)
    medium_concentration: List[List[Point]] = field(default_factory=list)
    low_concentration: List[List[Point]] = field(default_factory=list)
    concentration_field: Dict[str, float] = field(default_factory=dict)
    max_concentration: float = 0.0
    affected_area: float = 0.0
    time_steps: int = 0


# 将 DiffusionConfig 的整数稳定度（1=最不稳定 A … 6=最稳定 F）映射到
# Pasquill A-F 类别，供深度学习代理响应使用。
_STABILITY_INT_TO_PASQUILL = {1: "A", 2: "B", 3: "C", 4: "D", 5: "E", 6: "F"}


class ClassicGaussianPlumeModel:
    """兼容旧接口的深度学习代理扩散模型。"""

    def __init__(self):
        # 稳定度对等值线最大半径与形状各向异性的调制（仅用于可视化多边形采样，
        # 不参与浓度物理计算）：稳定度越高，羽流越窄越长。
        self.stability_radius_factor = {1: 1.35, 2: 1.22, 3: 1.12, 4: 1.00, 5: 0.88, 6: 0.78}
        self.stability_shape_factor = {1: 1.00, 2: 1.08, 3: 1.16, 4: 1.24, 5: 1.34, 6: 1.46}

    def calculate_concentration(
        self,
        leak_point: Point,
        target_point: Point,
        config: DiffusionConfig,
        gas_type: GasType = GasType.CH4,
        time_elapsed: float = 60.0,
    ) -> float:
        gas_props = GAS_PROPERTIES_MAP.get(gas_type, GAS_PROPERTIES_MAP[GasType.CH4])

        stability = _STABILITY_INT_TO_PASQUILL.get(config.stability, "D")
        params = ConditionedAdvectionParams(
            source_rate_g_s=max(config.source_rate, 0.0),
            release_duration_s=max(time_elapsed, 1.0),
            wind_speed_10m=max(config.wind_speed, 0.0),
            wind_direction_deg=config.wind_angle,
            stability_class=stability,
            release_height_m=max(config.release_height, 0.0),
            wind_reference_height_m=10.0,
            ambient_temperature_k=config.temperature,
            pressure_pa=config.pressure,
            cell_size_px=20.0,
            map_meters_per_unit=MAP_METERS_PER_UNIT,
            mixing_height_m=DEFAULT_MIXING_HEIGHT_M,
            gas=gas_condition_from_dict(
                {
                    "densityRatio": gas_props.density_ratio,
                    "diffusivityM2s": max(gas_props.diffusion_coefficient, 1e-6) * 1.0e-4,
                    "diffusionBias": max(gas_props.diffusion_coefficient / 0.20, 0.1),
                    "molarMass": gas_props.molecular_weight,
                }
            ),
        )
        return float(
            deep_sensor_response(
                leak_point[0],
                leak_point[1],
                target_point[0],
                target_point[1],
                max(config.source_rate, 0.0),
                params,
            )
        )

    def _trace_isopleth(
        self,
        leak_point: Point,
        config: DiffusionConfig,
        gas_type: GasType,
        time_elapsed: float,
        threshold_ppm: float,
    ) -> List[Point]:
        if threshold_ppm <= 0:
            return []

        points: List[Point] = []
        resolution = max(20, config.sample_resolution)
        radius_factor = self.stability_radius_factor.get(config.stability, 1.0)
        shape_factor = self.stability_shape_factor.get(config.stability, 1.2)
        max_radius = max(80.0, config.max_radius * radius_factor)
        wind_angle = math.radians(config.wind_angle)
        for i in range(resolution):
            ang = math.radians(i * (360.0 / resolution))
            rel = ang - wind_angle
            # 稳定度越高，越强化“顺风向拉伸、侧风向压缩”；稳定度低时更接近团状扩散
            anisotropy = 1.0 + (shape_factor - 1.0) * math.cos(rel) ** 2
            directional_cap = max_radius * anisotropy
            best_r = 0.0
            r = 6.0
            while r <= directional_cap:
                p = (leak_point[0] + r * math.cos(ang), leak_point[1] + r * math.sin(ang))
                c = self.calculate_concentration(leak_point, p, config, gas_type, time_elapsed)
                if c >= threshold_ppm:
                    best_r = r
                r += 5.0

            points.append((
                round(leak_point[0] + best_r * math.cos(ang), 1),
                round(leak_point[1] + best_r * math.sin(ang), 1),
            ))
        return points

    def get_enhanced_diffusion_polygons(
        self,
        leak_point: Point,
        config: DiffusionConfig,
        gas_type: GasType = GasType.CH4,
        time_elapsed: float = 60.0,
    ) -> DiffusionResult:
        gas_props = GAS_PROPERTIES_MAP.get(gas_type, GAS_PROPERTIES_MAP[GasType.CH4])
        result = DiffusionResult()

        high_th = gas_props.idlh_threshold_ppm * 0.7
        med_th = gas_props.safety_threshold_ppm * 1.6
        low_th = gas_props.safety_threshold_ppm * 0.5

        high_poly = self._trace_isopleth(leak_point, config, gas_type, time_elapsed, high_th)
        med_poly = self._trace_isopleth(leak_point, config, gas_type, time_elapsed, med_th)
        low_poly = self._trace_isopleth(leak_point, config, gas_type, time_elapsed, low_th)

        if any(any(v != leak_point[idx % 2] for idx, v in enumerate(pt)) for pt in high_poly):
            result.high_concentration.append(high_poly)
        if any(any(v != leak_point[idx % 2] for idx, v in enumerate(pt)) for pt in med_poly):
            result.medium_concentration.append(med_poly)
        if any(any(v != leak_point[idx % 2] for idx, v in enumerate(pt)) for pt in low_poly):
            result.low_concentration.append(low_poly)

        samples = [
            leak_point,
            (leak_point[0] + 20, leak_point[1]),
            (leak_point[0], leak_point[1] + 20),
            (leak_point[0] + 30, leak_point[1] + 20),
        ]
        result.max_concentration = max(
            self.calculate_concentration(leak_point, p, config, gas_type, time_elapsed) for p in samples
        )
        result.affected_area = math.pi * (config.max_radius ** 2)
        return result

    def calculate_time_evolution(
        self,
        leak_point: Point,
        config: DiffusionConfig,
        gas_type: GasType = GasType.CH4,
        num_steps: int = 30,
        step_interval: float = 5.0,
    ) -> List[DiffusionResult]:
        series = []
        for i in range(1, num_steps + 1):
            t = i * step_interval
            frame = self.get_enhanced_diffusion_polygons(leak_point, config, gas_type, t)
            frame.time_steps = i
            series.append(frame)
        return series
