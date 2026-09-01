"""速度场（三维流场）输出测试。

覆盖 build_velocity_field 的核心物理语义：
- 无风 → 速度场为 0
- 均匀风 → u/v 方向与风向一致
- 硬阻挡格点 → 速度归零
- 障碍阻力带内 → 减速
- 通道内 → 加速
- 气体物性浮升（nh3 上浮 / o2 沉降）
- 同参两次调用确定性
- 体元附加字段有限且受上限约束
"""

from __future__ import annotations

import math

import numpy as np

from .conditioned_advection import ConditionedAdvectionParams, GasCondition
from .phase1_diffusion import (
    MAX_VOLUME_CELLS_PER_RESPONSE,
    build_velocity_field,
)


def _params(**overrides: object) -> ConditionedAdvectionParams:
    values: dict[str, object] = {
        "source_rate_g_s": 3.2,
        "release_duration_s": 3600.0,
        "wind_speed_10m": 3.0,
        "wind_direction_deg": 45.0,
        "stability_class": "C",
        "release_height_m": 10.0,
        "wind_reference_height_m": 10.0,
        "ambient_temperature_k": 293.15,
        "pressure_pa": 101325.0,
        "cell_size_px": 20.0,
        "map_meters_per_unit": 0.5,
        "mixing_height_m": 300.0,
        "gas": GasCondition(5.11, 1.0e-5, 1.0, 146.06),
    }
    values.update(overrides)
    return ConditionedAdvectionParams(**values)


def _grid(size: int = 7) -> tuple[np.ndarray, np.ndarray]:
    xs = np.arange(0.0, size * 20.0, 20.0)
    ys = np.arange(0.0, size * 20.0, 20.0)
    return np.meshgrid(xs, ys)


def _run(
    *,
    wind_speed: float = 3.0,
    wind_direction: float = 45.0,
    gas: dict | None = None,
    hard_block: np.ndarray | None = None,
    obstacle_factor: np.ndarray | None = None,
    channel_factor: np.ndarray | None = None,
) -> dict:
    grid_x, grid_y = _grid()
    shape = grid_x.shape
    params = _params(wind_speed_10m=wind_speed, wind_direction_deg=wind_direction)
    visible = np.ones(shape, dtype=bool)
    concentration = np.full(shape, 12.0)
    hard = hard_block if hard_block is not None else np.zeros(shape, dtype=bool)
    obstacles = np.ones(shape) if obstacle_factor is None else obstacle_factor
    channels = np.ones(shape) if channel_factor is None else channel_factor
    return build_velocity_field(
        grid_x=grid_x,
        grid_y=grid_y,
        source={"x": 0.0, "y": 0.0},
        params=params,
        wake_obstacles=[],
        channel_segments=[],
        hard_block_grid=hard,
        obstacle_factor_grid=obstacles,
        channel_factor_grid=channels,
        gas=gas or {"particleProfile": {}},
        wind_direction_degrees=wind_direction,
        frame_seed=1,
        visible_mask=visible,
        concentration_field=concentration,
        release_height_m=10.0,
        wind_speed_mps=wind_speed,
    )


def test_no_wind_yields_zero_velocity() -> None:
    result = _run(wind_speed=0.0)
    assert result["units"] == "metersPerSecond"
    assert result["coordinateSystem"] == "LOCAL_MAP_PX_X_EAST_Y_SOUTH"
    for cell in result["cells"]:
        assert cell["u"] == 0.0
        assert cell["v"] == 0.0


def test_uniform_wind_direction_matches_wind_direction() -> None:
    for angle in (0.0, 45.0, 90.0, 180.0):
        result = _run(wind_speed=3.0, wind_direction=angle)
        radians = math.radians(angle)
        expected_u = math.cos(radians)
        expected_v = math.sin(radians)
        cell = result["cells"][0]
        speed = math.hypot(cell["u"], cell["v"])
        assert speed > 0
        direction_u = cell["u"] / speed
        direction_v = cell["v"] / speed
        assert math.isclose(direction_u, expected_u, rel_tol=0.1, abs_tol=0.1)
        assert math.isclose(direction_v, expected_v, rel_tol=0.1, abs_tol=0.1)


def test_hard_blocked_cells_have_zero_speed() -> None:
    shape = (7, 7)
    hard = np.zeros(shape, dtype=bool)
    hard[3, 3] = True
    result = _run(hard_block=hard)
    blocked = [c for c in result["cells"] if c["x"] == 60.0 and c["y"] == 60.0]
    assert len(blocked) == 1
    assert blocked[0]["speed"] == 0.0
    assert blocked[0]["u"] == 0.0
    assert blocked[0]["v"] == 0.0


def test_obstacle_drag_reduces_speed() -> None:
    shape = (7, 7)
    obstacles = np.full(shape, 1.0)
    obstacles[3, 3] = 0.5  # 阻力减半
    result = _run(obstacle_factor=obstacles)
    reduced = [c for c in result["cells"] if c["x"] == 60.0 and c["y"] == 60.0][0]
    baseline = [c for c in result["cells"] if c["x"] == 0.0 and c["y"] == 0.0][0]
    assert reduced["speed"] < baseline["speed"]


def test_channel_factor_accelerates() -> None:
    shape = (7, 7)
    channels = np.ones(shape)
    channels[3, :] = 1.6  # 通道加速 1.6 倍
    result = _run(channel_factor=channels)
    channeled = [c for c in result["cells"] if c["y"] == 60.0][0]
    outside = [c for c in result["cells"] if c["y"] == 0.0][0]
    assert channeled["speed"] > outside["speed"]


def test_nh3_buoyant_rises_and_o2_settles() -> None:
    nh3 = _run(gas={"particleProfile": {"buoyancyMetersPerSecond": 0.15}})
    o2 = _run(gas={"particleProfile": {"buoyancyMetersPerSecond": -0.1}})
    assert all(cell["w"] > 0 for cell in nh3["cells"])
    assert all(cell["w"] < 0 for cell in o2["cells"])


def test_velocity_field_is_deterministic() -> None:
    first = _run()
    second = _run()
    assert len(first["cells"]) == len(second["cells"])
    for a, b in zip(first["cells"], second["cells"]):
        assert a["u"] == b["u"]
        assert a["v"] == b["v"]
        assert a["w"] == b["w"]


def test_velocity_cells_are_bounded_and_finite() -> None:
    grid_x, grid_y = _grid(30)
    params = _params()
    visible = np.ones(grid_x.shape, dtype=bool)
    concentration = np.full(grid_x.shape, 12.0)
    result = build_velocity_field(
        grid_x=grid_x,
        grid_y=grid_y,
        source={"x": 0.0, "y": 0.0},
        params=params,
        wake_obstacles=[],
        channel_segments=[],
        hard_block_grid=np.zeros(grid_x.shape, dtype=bool),
        obstacle_factor_grid=np.ones(grid_x.shape),
        channel_factor_grid=np.ones(grid_x.shape),
        gas={"particleProfile": {}},
        wind_direction_degrees=45.0,
        frame_seed=1,
        visible_mask=visible,
        concentration_field=concentration,
        release_height_m=10.0,
        wind_speed_mps=3.0,
        max_cells=MAX_VOLUME_CELLS_PER_RESPONSE,
    )
    assert len(result["cells"]) <= MAX_VOLUME_CELLS_PER_RESPONSE
    for cell in result["cells"]:
        assert all(math.isfinite(v) for v in (cell["u"], cell["v"], cell["w"]))
