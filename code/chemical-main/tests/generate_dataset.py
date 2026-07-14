#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tests 数据集生成脚本
============================
为气体扩散模型(正向)与溯源模型(反演)生成可复现的测试数据集。

依赖: numpy, scipy, pandas  (纯标准科学栈, 无额外依赖)
用法: python generate_dataset.py
所有参数见同目录 config.json; 修改 config 后重跑即可复现。

单位制: 坐标 m | 风速 m/s | 源强 Q g/s | 瞬时质量 g | 浓度 mg/m^3
坐标系: x = 下风向距离, y = 横风向, z = 垂直高度; 源在 (xs, ys, H)
"""
import json
import os
import numpy as np
import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))


# --------------------------------------------------------------------------
# Pasquill-Gifford 扩散参数 (Briggs 开阔乡村公式), 返回 sigma_y, sigma_z [m]
# x 为下风距离 [m]; 仅在 x>0 有效。
# --------------------------------------------------------------------------
_PG_COEF = {
    #            sy: a            sz: c,      d,       与 (1+ b*x) 形式
    "A": dict(sy=0.22, sz=0.20, syb=1e-4, szpow=1.0,  szb=0.0),
    "B": dict(sy=0.16, sz=0.12, syb=1e-4, szpow=1.0,  szb=0.0),
    "C": dict(sy=0.11, sz=0.08, syb=1e-4, szpow=1.0,  szb=2e-4),
    "D": dict(sy=0.08, sz=0.06, syb=1e-4, szpow=1.0,  szb=1.5e-3),
    "E": dict(sy=0.06, sz=0.03, syb=1e-4, szpow=1.0,  szb=3e-4),
    "F": dict(sy=0.04, sz=0.016, syb=1e-4, szpow=1.0, szb=3e-4),
}


def pg_sigmas(x, stability):
    """Briggs 开阔地形扩散系数。x: 标量或数组(m)。返回 (sigma_y, sigma_z)。"""
    x = np.asarray(x, dtype=float)
    xpos = np.clip(x, 1e-6, None)
    c = _PG_COEF[stability]
    sigma_y = c["sy"] * xpos / np.sqrt(1.0 + c["syb"] * xpos)
    sigma_z = c["sz"] * xpos / np.sqrt(1.0 + c["szb"] * xpos) ** c["szpow"]
    sigma_y = np.where(x > 0, sigma_y, 0.0)
    sigma_z = np.where(x > 0, sigma_z, 0.0)
    return sigma_y, sigma_z


# --------------------------------------------------------------------------
# 连续点源高斯烟羽 (含地面全反射)
# 返回浓度 [mg/m^3].  Q[g/s], u[m/s] -> g/m^3, 再 *1000 转 mg/m^3
# --------------------------------------------------------------------------
def gaussian_plume(x, y, z, xs, ys, H, Q, u, stability):
    dx = x - xs
    dy = y - ys
    sy, sz = pg_sigmas(dx, stability)
    valid = dx > 0
    sy_s = np.where(valid, sy, 1.0)
    sz_s = np.where(valid, sz, 1.0)
    denom = 2.0 * np.pi * u * sy_s * sz_s
    horiz = np.exp(-(dy ** 2) / (2.0 * sy_s ** 2))
    vert = np.exp(-((z - H) ** 2) / (2.0 * sz_s ** 2)) + \
           np.exp(-((z + H) ** 2) / (2.0 * sz_s ** 2))
    c = Q / denom * horiz * vert
    c = np.where(valid, c, 0.0)
    return c * 1000.0  # g/m^3 -> mg/m^3


# --------------------------------------------------------------------------
# 瞬时烟团 (3D 高斯, 随平流移动, sigma 随漂移距离增长)
# --------------------------------------------------------------------------
def puff_concentration(x, y, z, x0, y0, H, mass, u, stability, t):
    xc = x0 + u * t          # 烟团中心下风位置
    travel = u * t           # 已漂移距离, 用于查扩散系数
    sy, sz = pg_sigmas(travel, stability)
    sx = sy                  # 纵向扩散近似等于横向
    sx = max(float(sx), 1e-3); sy = max(float(sy), 1e-3); sz = max(float(sz), 1e-3)
    norm = mass / ((2.0 * np.pi) ** 1.5 * sx * sy * sz)
    cx = np.exp(-((x - xc) ** 2) / (2.0 * sx ** 2))
    cy = np.exp(-((y - y0) ** 2) / (2.0 * sy ** 2))
    cz = np.exp(-((z - H) ** 2) / (2.0 * sz ** 2)) + \
         np.exp(-((z + H) ** 2) / (2.0 * sz ** 2))
    return norm * cx * cy * cz * 1000.0  # mg/m^3


def add_noise(values, snr_db, floor, rng):
    """按信噪比叠加高斯噪声, 并施加检出下限 floor。"""
    signal_power = np.mean(values ** 2) + 1e-12
    noise_power = signal_power / (10.0 ** (snr_db / 10.0))
    noise = rng.normal(0.0, np.sqrt(noise_power), size=values.shape)
    noisy = values + noise
    return np.clip(noisy, floor, None)


# ==========================================================================
def main():
    with open(os.path.join(HERE, "config.json"), "r", encoding="utf-8") as f:
        cfg = json.load(f)
    rng = np.random.default_rng(cfg["random_seed"])

    d = cfg["domain"]
    xs_grid = np.linspace(d["x_min"], d["x_max"], d["nx"])
    ys_grid = np.linspace(d["y_min"], d["y_max"], d["ny"])
    zs_grid = np.linspace(d["z_min"], d["z_max"], d["nz"])

    summary = []

    # ---------------- Case 1: 高斯烟羽稳态浓度场 ----------------
    c1 = cfg["case01_gaussian_plume"]
    src = c1["source"]; u1 = c1["wind_speed"]
    out1 = os.path.join(HERE, "case01_gaussian_plume")
    X, Y = np.meshgrid(xs_grid, ys_grid)  # 地面 z=0
    for stab in c1["stability_classes"]:
        conc = gaussian_plume(X, Y, 0.0, src["x"], src["y"], src["H"],
                              src["Q"], u1, stab)
        df = pd.DataFrame(conc, index=np.round(ys_grid, 2),
                          columns=np.round(xs_grid, 2))
        df.index.name = "y\\x"
        path = os.path.join(out1, f"stability_{stab}.csv")
        df.to_csv(path)
        summary.append((f"case01/stability_{stab}.csv", conc.shape,
                        float(conc.min()), float(conc.max())))
    # 3D 体数据 (中性 D)
    stab3d = c1["stability_3d_export"]
    Zx, Zy, Zz = np.meshgrid(xs_grid, ys_grid, zs_grid, indexing="ij")
    conc3d = gaussian_plume(Zx, Zy, Zz, src["x"], src["y"], src["H"],
                            src["Q"], u1, stab3d)
    np.save(os.path.join(out1, f"plume_3d_{stab3d}.npy"), conc3d.astype(np.float32))
    summary.append((f"case01/plume_3d_{stab3d}.npy", conc3d.shape,
                   float(conc3d.min()), float(conc3d.max())))
    with open(os.path.join(out1, "meta.json"), "w", encoding="utf-8") as f:
        json.dump({"description": "连续点源高斯烟羽稳态地面浓度场 + 3D体数据",
                   "source": src, "wind_speed_m_s": u1,
                   "stability_classes": c1["stability_classes"],
                   "grid": {"x": [d["x_min"], d["x_max"], d["nx"]],
                            "y": [d["y_min"], d["y_max"], d["ny"]],
                            "z": [d["z_min"], d["z_max"], d["nz"]]},
                   "unit": "mg/m^3", "sigma_formula": "Briggs open-country PG",
                   "csv_layout": "行=y横风向, 列=x下风向, 值=z=0地面浓度",
                   "npy_layout": "shape [nx, ny, nz] (indexing='ij')"},
                  f, ensure_ascii=False, indent=2)

    # ---------------- Case 2: 瞬时烟团时序 ----------------
    c2 = cfg["case02_puff_timeseries"]
    s2 = c2["source"]; u2 = c2["wind_speed"]; stab2 = c2["stability"]
    out2 = os.path.join(HERE, "case02_puff_timeseries")
    times = np.linspace(c2["t_start"], c2["t_end"], c2["nt"])
    # 浓度演化 [t, y, x] 在地面 z=1.5
    field = np.zeros((c2["nt"], d["ny"], d["nx"]), dtype=np.float32)
    Xg, Yg = np.meshgrid(xs_grid, ys_grid)
    for it, t in enumerate(times):
        field[it] = puff_concentration(Xg, Yg, 1.5, s2["x0"], s2["y0"],
                                       s2["H"], s2["mass"], u2, stab2, t)
    np.save(os.path.join(out2, "puff_concentration.npy"), field)
    summary.append(("case02/puff_concentration.npy", field.shape,
                   float(field.min()), float(field.max())))
    # 受体时序
    rec_rows = []
    for t in times:
        row = {"time_s": t}
        for r in c2["receptors"]:
            row[r["name"]] = float(puff_concentration(
                r["x"], r["y"], r["z"], s2["x0"], s2["y0"],
                s2["H"], s2["mass"], u2, stab2, t))
        rec_rows.append(row)
    pd.DataFrame(rec_rows).to_csv(
        os.path.join(out2, "receptor_timeseries.csv"), index=False)
    summary.append(("case02/receptor_timeseries.csv",
                   (len(times), len(c2["receptors"]) + 1), None, None))
    with open(os.path.join(out2, "meta.json"), "w", encoding="utf-8") as f:
        json.dump({"description": "瞬时点源烟团浓度时空演化 + 受体点时序",
                   "source": s2, "wind_speed_m_s": u2, "stability": stab2,
                   "time": {"start": c2["t_start"], "end": c2["t_end"],
                            "nt": c2["nt"], "unit": "s"},
                   "receptors": c2["receptors"], "unit": "mg/m^3",
                   "npy_layout": "shape [nt, ny, nx], z=1.5m 地面层"},
                  f, ensure_ascii=False, indent=2)

    # ---------------- Case 3: 传感器观测 (含噪, 溯源输入) ----------------
    c3 = cfg["case03_sensor_observations"]
    ts = c3["true_source"]; u3 = c3["wind_speed"]; stab3 = c3["stability"]
    out3 = os.path.join(HERE, "case03_sensor_observations")
    n = c3["n_sensors"]
    sx = rng.uniform(50.0, 1500.0, n)
    sy = rng.uniform(-300.0, 300.0, n)
    sh = c3["sensor_height"]
    clean = gaussian_plume(sx, sy, sh, ts["x"], ts["y"], ts["H"],
                           ts["Q"], u3, stab3)
    noisy = add_noise(clean, c3["noise"]["snr_db"], c3["noise"]["min_floor"], rng)
    sensors_df = pd.DataFrame({
        "sensor_id": [f"P{i+1:02d}" for i in range(n)],
        "x": np.round(sx, 2), "y": np.round(sy, 2), "z": sh})
    sensors_df.to_csv(os.path.join(out3, "sensors.csv"), index=False)
    obs_df = pd.DataFrame({
        "sensor_id": [f"P{i+1:02d}" for i in range(n)],
        "x": np.round(sx, 2), "y": np.round(sy, 2), "z": sh,
        "conc_true": np.round(clean, 6),
        "conc_observed": np.round(noisy, 6)})
    obs_df.to_csv(os.path.join(out3, "observations.csv"), index=False)
    with open(os.path.join(out3, "ground_truth.json"), "w", encoding="utf-8") as f:
        json.dump({"true_source": ts, "wind_speed_m_s": u3, "stability": stab3,
                   "noise": c3["noise"], "unit": "mg/m^3",
                   "note": "反演时仅可用 observations.csv 的 conc_observed; "
                           "本文件与 conc_true 仅供评估误差, 不得作为反演输入"},
                  f, ensure_ascii=False, indent=2)
    summary.append(("case03/observations.csv", (n, 6),
                   float(noisy.min()), float(noisy.max())))

    # ---------------- Case 4: 多源 / 复杂气象 ----------------
    c4 = cfg["case04_multi_source"]
    srcs = c4["true_sources"]; stab4 = c4["stability"]
    out4 = os.path.join(HERE, "case04_multi_source")
    wf = c4["wind_field"]
    wt = np.linspace(wf["t_start"], wf["t_end"], wf["nt"])
    phase = 2.0 * np.pi * wt / (wf["t_end"] - wf["t_start"] + 1e-9)
    wspeed = wf["base_speed"] + wf["speed_amp"] * np.sin(phase)
    wdir = wf["base_dir_deg"] + wf["dir_amp_deg"] * np.sin(phase + 0.7)
    wind_df = pd.DataFrame({"time_s": wt,
                            "wind_speed_m_s": np.round(wspeed, 4),
                            "wind_dir_deg": np.round(wdir, 4)})
    wind_df.to_csv(os.path.join(out4, "wind_field.csv"), index=False)
    # 传感器: 用平均风(沿 x) 近似生成多源叠加观测
    n4 = c4["n_sensors"]
    sx4 = rng.uniform(0.0, 1200.0, n4)
    sy4 = rng.uniform(-400.0, 400.0, n4)
    sh4 = c4["sensor_height"]
    u_mean = float(np.mean(wspeed))
    total = np.zeros(n4)
    per_source = {}
    for s in srcs:
        cs = gaussian_plume(sx4, sy4, sh4, s["x"], s["y"], s["H"],
                            s["Q"], u_mean, stab4)
        per_source[s["name"]] = cs
        total += cs
    noisy4 = add_noise(total, c4["noise"]["snr_db"], c4["noise"]["min_floor"], rng)
    obs4 = {"sensor_id": [f"M{i+1:02d}" for i in range(n4)],
            "x": np.round(sx4, 2), "y": np.round(sy4, 2), "z": sh4,
            "conc_true_total": np.round(total, 6),
            "conc_observed": np.round(noisy4, 6)}
    for name, cs in per_source.items():
        obs4[f"contrib_{name}"] = np.round(cs, 6)
    pd.DataFrame(obs4).to_csv(os.path.join(out4, "observations.csv"), index=False)
    with open(os.path.join(out4, "ground_truth.json"), "w", encoding="utf-8") as f:
        json.dump({"true_sources": srcs, "stability": stab4,
                   "wind_field_mean_speed_m_s": u_mean,
                   "noise": c4["noise"], "unit": "mg/m^3",
                   "note": "高难度多源辨识: 反演仅可用 conc_observed; "
                           "contrib_* 与 conc_true_total 仅供评估"},
                  f, ensure_ascii=False, indent=2)
    summary.append(("case04/observations.csv", (n4, len(obs4)),
                   float(noisy4.min()), float(noisy4.max())))

    # ---------------- Sanity check 汇总 ----------------
    print("\n=== tests 数据集生成完成 ===")
    print(f"随机种子: {cfg['random_seed']}\n")
    print(f"{'文件':<38}{'形状':<20}{'min':>12}{'max':>12}")
    print("-" * 82)
    neg_flag = False
    for name, shape, vmin, vmax in summary:
        smin = "-" if vmin is None else f"{vmin:.4g}"
        smax = "-" if vmax is None else f"{vmax:.4g}"
        print(f"{name:<38}{str(shape):<20}{smin:>12}{smax:>12}")
        if vmin is not None and vmin < -1e-9:
            neg_flag = True
    print("-" * 82)
    print("浓度非负检查:", "异常(出现负值!)" if neg_flag else "通过")


if __name__ == "__main__":
    main()
