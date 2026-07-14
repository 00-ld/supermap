"""Gas catalog used by legacy gas diffusion and evacuation planning."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict


class GasType(Enum):
    CH4 = "methane"
    NH3 = "ammonia"
    CO = "carbon_monoxide"
    O2 = "oxygen"


@dataclass
class GasProperties:
    molecular_weight: float = 28.97
    diffusion_coefficient: float = 0.18
    density_ratio: float = 1.0
    safety_threshold_ppm: float = 100.0
    idlh_threshold_ppm: float = 500.0
    decay_rate: float = 0.0008
    color: str = "#FF6B6B"
    name: str = "通用气体"


GAS_PROPERTIES_MAP: Dict[GasType, GasProperties] = {
    GasType.CH4: GasProperties(
        molecular_weight=16.04,
        diffusion_coefficient=0.24,
        density_ratio=0.55,
        safety_threshold_ppm=50.0,
        idlh_threshold_ppm=50000.0,
        decay_rate=0.0003,
        color="#E74C3C",
        name="甲烷(CH4)",
    ),
    GasType.NH3: GasProperties(
        molecular_weight=17.03,
        diffusion_coefficient=0.23,
        density_ratio=0.59,
        safety_threshold_ppm=25.0,
        idlh_threshold_ppm=300.0,
        decay_rate=0.0010,
        color="#9B59B6",
        name="氨气(NH3)",
    ),
    GasType.CO: GasProperties(
        molecular_weight=28.01,
        diffusion_coefficient=0.22,
        density_ratio=0.97,
        safety_threshold_ppm=35.0,
        idlh_threshold_ppm=1200.0,
        decay_rate=0.0007,
        color="#3498DB",
        name="一氧化碳(CO)",
    ),
    GasType.O2: GasProperties(
        molecular_weight=32.00,
        diffusion_coefficient=0.20,
        density_ratio=1.10,
        safety_threshold_ppm=120000.0,
        idlh_threshold_ppm=250000.0,
        decay_rate=0.0004,
        color="#2ECC71",
        name="氧气(O2)",
    ),
}


def get_gas_types_info() -> Dict[str, Dict[str, Any]]:
    """Return public gas catalog metadata for API clients."""
    result: Dict[str, Dict[str, Any]] = {}
    for gas_type, props in GAS_PROPERTIES_MAP.items():
        result[gas_type.name] = {
            "value": gas_type.value,
            "name": props.name,
            "color": props.color,
            "molecularWeight": props.molecular_weight,
            "safetyThreshold": props.safety_threshold_ppm,
            "idlhThreshold": props.idlh_threshold_ppm,
            "densityRatio": props.density_ratio,
            "diffusionCoefficient": props.diffusion_coefficient,
        }
    return result
