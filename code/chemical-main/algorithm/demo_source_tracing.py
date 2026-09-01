"""最小可跑的气体泄漏溯源 demo：合成观测 -> 粒子滤波反演 -> 打印结果。

用法（在 chemical-main 目录下）：
    uv run python -m algorithm.demo_source_tracing

说明：
- 设一个已知“真源”，用项目自己的深度学习前向模型生成各传感器“本应”测到的浓度，
  加 5% 噪声当作实测；再用粒子滤波从实测反推源位置与强度。
- 只打印数值对比，不读取/生成任何图片。
- 首次运行若 models/deep_gas_surrogate.pt 不存在，会自动训练默认 CPU 代理模型，
  可能多花 1-3 分钟；之后会被缓存复用。
"""

from __future__ import annotations

import numpy as np

from .inversion.forward_model import ForwardModel
from .inversion.particle_filter import run_particle_filter_inversion_task


def build_synthetic_payload():
    """构造一个自洽的溯源场景：已知真源 -> 合成带噪观测 -> 打包成 payload。"""

    scenario = {
        "windSpeed": 2.0,           # 10 m 风速 m/s
        "windDirection": 0.0,       # 风往 +x 方向吹
        "stabilityClass": "D",
        "terrainRoughness": 0.45,
        "releaseHeight": 2.0,
        "ambientTemperature": 25.0,
        "pressurePa": 101325.0,
        "mapMetersPerUnit": 0.5,    # 0.5 m / 像素
        "mapWidth": 1000.0,
        "mapHeight": 650.0,
    }
    gas = {"molarMass": 28.97, "densityRatio": 1.0, "diffusivityM2s": 2.0e-5}

    # 真源：位置(像素) + 排放强度(g/s)
    true_x, true_y, true_q = 200.0, 325.0, 50.0

    # 8 个传感器，布在真源下风方向（x > 200）、跨风向散开
    sensor_layout = [
        ("S1", 400.0, 300.0),
        ("S2", 500.0, 340.0),
        ("S3", 600.0, 310.0),
        ("S4", 700.0, 350.0),
        ("S5", 550.0, 280.0),
        ("S6", 650.0, 380.0),
        ("S7", 450.0, 360.0),
        ("S8", 750.0, 320.0),
    ]

    # 用前向模型生成“干净”浓度
    sensors_for_fm = [{"mapPoint": {"x": x, "y": y}} for _, x, y in sensor_layout]
    fm = ForwardModel.from_scenario(sensors_for_fm, scenario, gas)
    clean = fm.predict(true_x, true_y, true_q)

    # 加 5% 相对噪声 + 小底噪，当作实测
    rng = np.random.default_rng(7)
    relative = rng.normal(0.0, 0.05, size=clean.shape) * np.maximum(clean, 1e-3)
    floor = rng.normal(0.0, 1e-4, size=clean.shape)
    observed = np.maximum(clean + relative + floor, 0.0)

    # 模拟到达时间：沿风距离 / 输运风速，加抖动
    transport_speed = max(float(fm.effective_wind), 0.5)
    sensors = []
    for (sid, x, y), conc in zip(sensor_layout, observed):
        item = {"id": sid, "mapPoint": {"x": x, "y": y}, "signal": float(conc)}
        if conc > 1e-3:
            along_px = (x - true_x) * fm.cos_theta + (y - true_y) * fm.sin_theta
            t = max(along_px, 0.0) * fm.map_meters_per_unit / transport_speed
            t = max(t + rng.normal(0.0, 3.0), 0.0)
            item["arrivalTimeSec"] = float(t)
        sensors.append(item)

    payload = {
        "activeSensors": sensors,
        "scenario": scenario,
        "gas": gas,
        "trueSourceMapPoint": {"x": true_x, "y": true_y},
        "trueEmissionRate": true_q,
        "particleFilterConfig": {
            "numParticles": 9000,
            "iterations": 24,
            "seed": 42,
        },
    }
    return payload, (true_x, true_y, true_q), clean, observed


def main():
    print("=" * 68)
    print(" 气体泄漏溯源 demo：粒子滤波源项反演（合成观测 -> 反演 -> 对比）")
    print("=" * 68)

    payload, (tx, ty, tq), clean, observed = build_synthetic_payload()
    mpu = payload["scenario"]["mapMetersPerUnit"]

    print(f"\n[真源] 位置=({tx},{ty})px = ({tx*mpu:.1f},{ty*mpu:.1f})m   强度 Q={tq} g/s")
    print(f"[场景] 风速 {payload['scenario']['windSpeed']} m/s, 风向 {payload['scenario']['windDirection']}°, 稳定度 {payload['scenario']['stabilityClass']}")
    print(f"[传感器] {len(payload['activeSensors'])} 个，合成观测浓度：")
    for s, c in zip(payload["activeSensors"], observed):
        p = s["mapPoint"]
        ta = f"  到达 {s.get('arrivalTimeSec'):.1f}s" if "arrivalTimeSec" in s else ""
        print(f"    {s['id']} @ ({p['x']},{p['y']}): {c:8.4f} ppm{ta}")

    print("\n>>> 运行粒子滤波反演（9000 粒子 × 24 轮，首次可能需训练代理模型）...\n")
    result = run_particle_filter_inversion_task(payload)

    est = result["estimatedSource"]
    err = result["errorMetrics"]
    diag = result["diagnostics"]
    post = result["posterior"]
    ex, ey = est["mapPoint"]["x"], est["mapPoint"]["y"]

    print("-" * 68)
    print("[反演结果]")
    print(f"  估计源位置 = ({ex},{ey})px = ({ex*mpu:.1f},{ey*mpu:.1f})m")
    print(f"  估计源强   = {est['emissionRate']:.3f} g/s   (解析重拟合 {est['analyticEmissionRate']:.3f} g/s)")
    print(f"  95% 可信半径 = {est['credibleRadius95m']:.2f} m")
    print(f"  位置误差   = {err['sourceLocationErrorM']:.2f} m   命中(≤15m): {err['matched']}")
    print(f"  源强误差   = {err['emissionRateErrorPct']:.2f} %")
    print("-" * 68)
    print("[诊断]")
    print(f"  有效样本数 ESS = {diag['effectiveSampleSize']} / {diag['particles']}")
    print(f"  重采样次数 = {diag['resampleCount']}   MCMC 接受率 = {diag['acceptanceRate']}")
    print(f"  最终 RMSE   = {diag['finalRmsePpm']} ppm")
    rhat = post["splitRhat"]
    print(f"  split-Rhat  = x:{rhat['x']}  y:{rhat['y']}  Q:{rhat['emissionRate']}  (≈1 表示收敛)")
    print(f"  到达时间约束启用: {diag['arrivalTimeConstraint']}")
    print("-" * 68)
    print("[迭代轨迹]（抽样显示：x, y, Q, ESS, RMSE）")
    for h in result["history"][::4]:
        print(f"    iter {int(h['iteration']):>2}  β={h['beta']:.2f}  "
              f"x={h['x']:6.1f} y={h['y']:6.1f} Q={h['emissionRate']:6.2f}  "
              f"ESS={h['ess']:7.0f}  rmse={h['rmse']:.5f}")
    print("=" * 68)
    print(" demo 结束。")


if __name__ == "__main__":
    main()
