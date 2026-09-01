"""导出化工园区溯源微型 demo 可视化数据 -> docs/trace-demo/data.js

接入四件事：
1. 和风天气 API —— 读 QWEATHER_API_KEY / QWEATHER_LOCATION 环境变量取实时天气
   驱动风速/风向；未提供 key 时回退到默认气象（标注"示例数据"）。
2. 项目条件平流-扩散算法（ConditionedAdvectionGrid）—— 逐时步进跑动态多帧
   扩散模拟，还原气体从泄漏到扩散的全过程。
3. 优化监测布点 —— 沿盛行风向布设"近/中/远三弧线 × 左中右三点"共 9 个监测点。
4. 粒子滤波源项反演 —— 项目深度学习前向模型 + 粒子滤波，给位置、强度与可信度。

用法（chemical-main 目录下）：
    PYTHONUTF8=1 uv run python -m algorithm.demo_export_data
    # 启用和风实时天气：
    QWEATHER_API_KEY=xxx QWEATHER_LOCATION=116.41,39.92 \\
        PYTHONUTF8=1 uv run python -m algorithm.demo_export_data
"""

from __future__ import annotations

import gc
import json
import math
import os
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np

from .deep_learning.gas_surrogate import deep_sensor_response
from .diffusion.conditioned_advection import (
    DEFAULT_MIXING_HEIGHT_M,
    ConditionedAdvectionGrid,
    ConditionedAdvectionParams,
    gas_condition_from_dict,
)
from .inversion.forward_model import ForwardModel
from .inversion.particle_filter import (
    ParticleFilterConfig,
    build_particle_kde_geojson,
    covariance_to_radius,
    run_particle_filter,
    split_rhat,
)

MAP_W, MAP_H = 1000.0, 650.0
MPU = 0.5
CELL_PX = 20.0
GRID_COLS = int(MAP_W / CELL_PX)      # 50
GRID_ROWS = int(MAP_H / CELL_PX) + 1  # 33


def fetch_weather() -> dict:
    """取和风天气实况；无 key 则回退默认气象（北风 2 m/s，视觉友好的默认场景）。"""

    key = os.environ.get("QWEATHER_API_KEY")
    loc = os.environ.get("QWEATHER_LOCATION", "116.41,39.92")
    if not key:
        return {
            "source": "default", "location": "示例化工园区",
            "windSpeed": 2.0, "windSpeedKmh": 7.2,
            "windDir": "北风", "windDirDeg": 180.0, "wind360": 180.0,
            "temp": 25.0, "pressure": 1013.0, "humidity": 50.0,
            "text": "晴",
            "obsTime": "示例数据（设置环境变量 QWEATHER_API_KEY 启用和风实时天气）",
        }
    url = (
        "https://devapi.qweather.com/v7/weather/now?location="
        + urllib.parse.quote(loc) + "&key=" + urllib.parse.quote(key)
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "trace-demo/1.0"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if str(data.get("code")) != "200":
            return _fallback_weather("和风返回码 " + str(data.get("code")))
        now = data["now"]
        kmh = float(now.get("windSpeed", 7.2))
        return {
            "source": "qweather", "location": loc,
            "windSpeed": round(kmh / 3.6, 2), "windSpeedKmh": kmh,
            "windDir": now.get("windDir", ""),
            "windDirDeg": float(now.get("wind360", 180)),
            "wind360": float(now.get("wind360", 180)),
            "temp": float(now.get("temp", 25)),
            "pressure": float(now.get("pressure", 1013)),
            "humidity": float(now.get("humidity", 50)),
            "text": now.get("text", ""),
            "obsTime": now.get("obsTime", ""),
        }
    except Exception:
        return _fallback_weather("请求失败，使用默认气象")


def _fallback_weather(reason: str) -> dict:
    return {
        "source": "default", "location": "示例化工园区",
        "windSpeed": 2.0, "windSpeedKmh": 7.2,
        "windDir": "北风", "windDirDeg": 180.0, "wind360": 180.0,
        "temp": 25.0, "pressure": 1013.0, "humidity": 50.0,
        "text": "晴", "obsTime": reason,
    }


def _sample_field(field: np.ndarray, x: float, y: float, cols: int, rows: int) -> float:
    """双线性插值取像素 (x,y) 处的浓度。"""

    c = max(0.0, min(cols - 1.001, x / CELL_PX))
    r = max(0.0, min(rows - 1.001, y / CELL_PX))
    c0, r0 = int(c), int(r)
    fc, fr = c - c0, r - r0
    return float(
        (field[r0, c0] * (1 - fc) + field[r0, c0 + 1] * fc) * (1 - fr)
        + (field[r0 + 1, c0] * (1 - fc) + field[r0 + 1, c0 + 1] * fc) * fr
    )


def main() -> None:
    weather = fetch_weather()
    # 项目风向约定 = 风的去向 = 气象来向 + 180°
    project_wind_dir = (weather["wind360"] + 180.0) % 360.0
    wind_speed = max(float(weather["windSpeed"]), 0.5)
    alpha = math.radians(project_wind_dir)
    cos_a, sin_a = math.cos(alpha), math.sin(alpha)

    # 源放在上风侧（地图中心往风来方向偏 150 m = 300 px），使下风监测网落在图内
    true_x = 500.0 - 300.0 * cos_a
    true_y = 325.0 - 300.0 * sin_a
    true_x = max(60.0, min(MAP_W - 60.0, true_x))
    true_y = max(60.0, min(MAP_H - 60.0, true_y))
    true_q = 50.0  # g/s

    # 优化布点：沿风去向 三距离 × 三横向偏移 = 9 点
    dists_m = [120.0, 220.0, 320.0]
    offsets_m = [-80.0, 0.0, 80.0]
    sensors: list[dict] = []
    sid = 0
    for di, dm in enumerate(dists_m):
        for off in offsets_m:
            sid += 1
            dpx, opx = dm / MPU, off / MPU
            x = true_x + dpx * cos_a - opx * sin_a
            y = true_y + dpx * sin_a + opx * cos_a
            x = max(30.0, min(MAP_W - 30.0, x))
            y = max(30.0, min(MAP_H - 30.0, y))
            sensors.append({
                "id": f"M{sid}", "x": round(x, 1), "y": round(y, 1),
                "ring": di + 1, "dist_m": dm, "offset_m": off,
            })
    wind_label = weather.get("windDir") or f"{weather['windDirDeg']:.0f}°"
    layout_note = (
        f"沿盛行风（{wind_label} {weather['windSpeed']} m/s）去向布设 3 条弧线 × 3 点共 9 个监测点："
        "近/中/远三档距离（120/220/320 m）捕获距离梯度，每条弧线左中右三点（±80 m）覆盖横向扩散，"
        "确保泄漏源下风方向被立体覆盖——这是源定位精度的基础。"
    )

    # --- 动态扩散模拟（项目条件平流-扩散算法，逐时步进）---
    gas_dict = {"molarMass": 28.97, "densityRatio": 1.0, "diffusivityM2s": 2.0e-5, "diffusionBias": 1.0}
    rows, cols = GRID_ROWS, GRID_COLS
    params = ConditionedAdvectionParams(
        source_rate_g_s=true_q, release_duration_s=600.0,
        wind_speed_10m=wind_speed, wind_direction_deg=project_wind_dir,
        stability_class="D", release_height_m=2.0, wind_reference_height_m=10.0,
        ambient_temperature_k=weather["temp"] + 273.15, pressure_pa=weather["pressure"] * 100.0,
        cell_size_px=CELL_PX, map_meters_per_unit=MPU,
        mixing_height_m=DEFAULT_MIXING_HEIGHT_M, gas=gas_condition_from_dict(gas_dict),
    )
    grid = ConditionedAdvectionGrid(
        shape=(rows, cols),
        source_row=int(np.clip(true_y / CELL_PX, 0, rows - 1)),
        source_col=int(np.clip(true_x / CELL_PX, 0, cols - 1)),
        params=params,
    )
    frame_times = [5, 15, 30, 50, 80, 120, 170, 230, 300, 400]
    frame_set = set(frame_times)
    frames: list[dict] = []
    arrival: list[float | None] = [None] * len(sensors)
    threshold = 1.0
    diffusion_max = 1e-9
    for target in range(5, 401, 5):
        field = grid.advance_to(float(target))
        for i, sen in enumerate(sensors):
            ppm = _sample_field(field, sen["x"], sen["y"], cols, rows)
            if arrival[i] is None and ppm > threshold:
                arrival[i] = float(target)
        if target in frame_set:
            frames.append({"t": target, "values": np.round(field, 2).flatten().tolist()})
        diffusion_max = max(diffusion_max, float(field.max()))

    del grid, field
    gc.collect()

    # --- 溯源：项目深度学习前向模型 + 粒子滤波 ---
    scenario = {
        "windSpeed": wind_speed, "windDirection": project_wind_dir, "stabilityClass": "D",
        "terrainRoughness": 0.45, "releaseHeight": 2.0, "ambientTemperature": weather["temp"],
        "pressurePa": weather["pressure"] * 100.0, "mapMetersPerUnit": MPU,
        "mapWidth": MAP_W, "mapHeight": MAP_H,
    }
    gas = {"molarMass": 28.97, "densityRatio": 1.0, "diffusivityM2s": 2.0e-5}
    sensors_for_fm = [{"mapPoint": {"x": s["x"], "y": s["y"]}} for s in sensors]
    fm = ForwardModel.from_scenario(sensors_for_fm, scenario, gas)
    clean = fm.predict(true_x, true_y, true_q)
    rng = np.random.default_rng(7)
    observed = np.maximum(
        clean + rng.normal(0.0, 0.05, clean.shape) * np.maximum(clean, 1e-3) + rng.normal(0.0, 1e-4, clean.shape),
        0.0,
    )
    arrival_arr = np.array([np.nan if a is None else a for a in arrival], dtype=float)
    if not np.any(np.isfinite(arrival_arr)):
        arrival_arr = None  # type: ignore[assignment]

    config = ParticleFilterConfig(
        num_particles=6000, iterations=24, seed=42,
        x_bounds=(40.0, MAP_W - 40.0), y_bounds=(40.0, MAP_H - 40.0),
    )
    result = run_particle_filter(fm, observed, config, observed_arrival_times=arrival_arr)
    est = result.estimate
    analytic_q = fm.fit_emission_rate(est[0], est[1], observed)
    cred_r_m = covariance_to_radius(result.covariance[:2, :2], 2.45) * MPU
    loc_err = float(np.hypot(est[0] - true_x, est[1] - true_y)) * MPU
    q_err_pct = abs(est[2] - true_q) / true_q * 100.0

    iters = [
        {"iteration": int(h["iteration"]), "beta": round(h["beta"], 4),
         "x": round(h["x"], 2), "y": round(h["y"], 2),
         "Q": round(h["emissionRate"], 3), "ess": round(h["ess"], 1),
         "rmse": round(h["rmse"], 5)}
        for h in result.history
    ]

    # 稳态浓度场（第3步揭示真源烟羽）
    nx, ny = 50, 33
    xs = np.linspace(0.0, MAP_W, nx)
    ys = np.linspace(0.0, MAP_H, ny)
    gx, gy = np.meshgrid(xs, ys)
    field_static = np.asarray(
        deep_sensor_response(true_x, true_y, gx.ravel(), gy.ravel(), true_q, fm._conditioned_params()),
        dtype=float,
    ).reshape(gy.shape)
    field_max = float(field_static.max()) if field_static.max() > 0 else 1.0

    # 后验 KDE
    kde = build_particle_kde_geojson(
        result.particles, result.weights, result.covariance[:2, :2], config,
        map_meters_per_unit=MPU,
        density_config={"enabled": True, "gridSize": 32, "paddingRatio": 0.2, "elevationScaleM": 72.0},
    )
    gs2 = int(kde["metadata"]["gridSize"])
    density = [0.0] * (gs2 * gs2)
    for f in kde["features"]:
        density[int(f["properties"]["row"]) * gs2 + int(f["properties"]["col"])] = float(f["properties"]["normalizedDensity"])
    f0 = kde["features"][0]["geometry"]["coordinates"][0]
    fE = kde["features"][-1]["geometry"]["coordinates"][0]

    # 粒子采样
    n_show = 2000
    probs = result.weights / float(np.sum(result.weights))
    idx = rng.choice(result.particles.shape[0], size=n_show, replace=True, p=probs)
    part_xy = [[round(float(result.particles[i, 0]), 1), round(float(result.particles[i, 1]), 1)] for i in idx]
    rhat = split_rhat(result.particles, result.weights)

    sensors_json = []
    for s, o, a in zip(sensors, observed, arrival):
        item = {"id": s["id"], "x": s["x"], "y": s["y"], "ring": s["ring"],
                "dist_m": s["dist_m"], "offset_m": s["offset_m"], "ppm": round(float(o), 4)}
        if a is not None:
            item["arrivalSec"] = round(float(a), 1)
        sensors_json.append(item)

    data = {
        "meta": {
            "title": "化工园区气体泄漏溯源 · 微型演示", "mapMetersPerUnit": MPU,
            "mapWidth": MAP_W, "mapHeight": MAP_H, "gridRows": rows, "gridCols": cols,
            "cellPx": CELL_PX, "diffusionMax": round(diffusion_max, 4),
        },
        "weather": weather,
        "wind": {"projectDirDeg": round(project_wind_dir, 1), "speed": wind_speed},
        "layoutNote": layout_note,
        "trueSource": {"x": round(true_x, 1), "y": round(true_y, 1), "emissionRate": true_q,
                       "xM": round(true_x * MPU, 1), "yM": round(true_y * MPU, 1)},
        "sensors": sensors_json,
        "diffusionFrames": frames,
        "frameTimes": frame_times,
        "concentrationField": {
            "nx": nx, "ny": ny,
            "xs": [round(float(v), 2) for v in xs], "ys": [round(float(v), 2) for v in ys],
            "max": round(field_max, 4),
            "values": np.round(field_static, 4).flatten().tolist(),
        },
        "iterations": iters,
        "finalEstimate": {
            "x": round(float(est[0]), 2), "y": round(float(est[1]), 2),
            "emissionRate": round(float(est[2]), 4), "analyticRate": round(float(analytic_q), 4),
            "credibleRadius95m": round(float(cred_r_m), 2),
        },
        "posteriorDensity": {
            "gridSize": gs2, "xLo": float(f0[0][0]), "xHi": float(fE[2][0]),
            "yLo": float(f0[0][1]), "yHi": float(fE[2][1]),
            "values": [round(float(v), 6) for v in density],
        },
        "particles": {"count": n_show, "xy": part_xy},
        "diagnostics": {
            "ess": round(float(result.effective_sample_size), 1),
            "resampleCount": int(result.resample_count),
            "acceptanceRate": round(float(result.acceptance_rate), 4),
            "finalRmsePpm": round(float(result.final_rmse), 4),
            "splitRhat": {k: round(float(v), 4) for k, v in rhat.items()},
            "arrivalTimeConstraint": bool(arrival_arr is not None),
            "locationErrorM": round(loc_err, 3),
            "emissionRateErrorPct": round(q_err_pct, 3),
            "matched": bool(loc_err <= 15.0),
        },
        "stepNames": [
            {"name": "天眼布控", "sub": "气象接入 · 优化布点 · 扩散初起"},
            {"name": "粒子寻源", "sub": "智能反演 · 候选源筛选"},
            {"name": "精准锁定", "sub": "源项量化 · 可信度评估"},
        ],
        "highlights": [
            {"title": "真实扩散模拟", "desc": "项目条件平流-扩散算法逐时步进，还原气体从泄漏到扩散的全过程，非静态烟羽。"},
            {"title": "实时气象接入", "desc": "和风天气 API 驱动风速风向，真实环境条件下的扩散与溯源。"},
            {"title": "优化监测布点", "desc": "沿盛行风三弧线九点，距离梯度 + 横向覆盖，源定位精度的基础。"},
            {"title": "粒子滤波寻源", "desc": "退火 + MCMC 复兴，全局搜索 + 到达时间约束，弱风少点也能定位。"},
            {"title": "可信度量化", "desc": "95% 可信圆 + 概率山，诚实输出'源有多大概率在这个圈里'。"},
        ],
    }

    out_dir = Path(__file__).resolve().parents[1] / "docs" / "trace-demo"
    out_dir.mkdir(parents=True, exist_ok=True)
    js = "window.TRACE_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n"
    (out_dir / "data.js").write_text(js, encoding="utf-8")

    print(f"已导出: {out_dir / 'data.js'}  ({len(js)} 字节)")
    print(f"气象来源: {weather['source']}  风: {weather['windDir']} {weather['windSpeed']}m/s (项目去向 {project_wind_dir:.0f}°)")
    print(f"真源=({true_x:.0f},{true_y:.0f})  监测点={len(sensors)}  扩散帧={len(frames)}  动态峰值={diffusion_max:.1f}ppm")
    print(f"估计=({est[0]:.1f},{est[1]:.1f}) Q={est[2]:.2f}g/s  位置误差={loc_err:.2f}m  命中={loc_err<=15.0}")


if __name__ == "__main__":
    main()
