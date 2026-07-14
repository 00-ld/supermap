#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""tests Case 1 正向高斯烟羽模型精度验证脚本。

直接 import 项目算法 ``algorithm.diffusion.gaussian_plume``，在与数据集完全
相同的网格 / 源参数 / 风速 / 稳定度上调用当前实现，得到模型预测浓度场，
再与解析解真值 (stability_A..F.csv) 逐档对比。3D 体数据文件较大，默认不提交；
若本地存在 plume_3d_D.npy，则额外执行 3D 对比。

单位约定:
    - 数据集真值: mg/m^3
    - 算法 steady_plume_mass_conc 返回: g/m^3  ==> 比较前 *1000 转 mg/m^3
坐标约定:
    - x 下风向, y 横风向, z 高度; 源在 (0,0,H=50)
    - 直接给算法传源参数与风速 u=5, 不走 10m 风廓线换算, 以隔离 σ 公式影响

复跑:
    python -m tests.test_forward_model
依赖: numpy, pandas (项目已装)
"""
from __future__ import annotations

import json
import os

import numpy as np
import pandas as pd

from algorithm.diffusion import gaussian_plume as gp

HERE = os.path.dirname(os.path.abspath(__file__))
CASE1 = os.path.join(HERE, "case01_gaussian_plume")
MG_PER_G = 1000.0  # g/m^3 -> mg/m^3

# 源参数与网格 (与 config.json / meta.json 完全一致)
SRC = dict(x=0.0, y=0.0, H=50.0, Q=100.0)
U = 5.0
STABS = ["A", "B", "C", "D", "E", "F"]
X = np.linspace(0.0, 2000.0, 201)   # 下风向
Y = np.linspace(-500.0, 500.0, 101) # 横风向
Z = np.linspace(0.0, 200.0, 41)     # 高度

def load_truth_csv(stab: str) -> np.ndarray:
    """读取真值地面浓度场 CSV, 返回 shape [ny, nx] = [101, 201] (mg/m^3)。

    CSV 布局: 第一列是 y 索引(行=y横风向), 列头是 x(下风向)。
    """
    df = pd.read_csv(os.path.join(CASE1, f"stability_{stab}.csv"), index_col=0)
    return df.to_numpy(dtype=float)  # [ny, nx]


def predict_ground_field(stab: str) -> np.ndarray:
    """用当前算法预测地面 (z=0) 浓度场, 返回 [ny, nx] (mg/m^3)。

    数据集 csv_layout: 行=y, 列=x ==> meshgrid 用 (X, Y) 默认 'xy' 得到
    shape [ny, nx], 与真值对齐。
    """
    XX, YY = np.meshgrid(X, Y)  # shape [ny, nx]
    conc_g = gp.steady_plume_mass_conc(
        emission_rate_g_s=SRC["Q"],
        wind_speed=U,
        downwind_m=XX - SRC["x"],
        crosswind_m=YY - SRC["y"],
        height_m=0.0,
        release_height_m=SRC["H"],
        stability_class=stab,
        urban=False,
    )
    return np.asarray(conc_g, dtype=float) * MG_PER_G


def predict_3d_field(stab: str) -> np.ndarray:
    """预测 3D 体浓度场, 返回 shape [nx, ny, nz] (mg/m^3), 与 npy 对齐。"""
    XX, YY, ZZ = np.meshgrid(X, Y, Z, indexing="ij")  # [nx, ny, nz]
    conc_g = gp.steady_plume_mass_conc(
        emission_rate_g_s=SRC["Q"],
        wind_speed=U,
        downwind_m=XX - SRC["x"],
        crosswind_m=YY - SRC["y"],
        height_m=ZZ,
        release_height_m=SRC["H"],
        stability_class=stab,
        urban=False,
    )
    return np.asarray(conc_g, dtype=float) * MG_PER_G


def peak_info(field_2d: np.ndarray):
    """返回 (峰值浓度, 峰值处 x_m, 峰值处 y_m)。field_2d shape [ny, nx]。"""
    iy, ix = np.unravel_index(np.argmax(field_2d), field_2d.shape)
    return float(field_2d[iy, ix]), float(X[ix]), float(Y[iy])


def crosswind_width(field_2d: np.ndarray) -> float:
    """在地面峰值所在的下风列上, 估计横风向 1/e 半宽 (m)。

    用二阶矩 sqrt(sum(y^2 c)/sum(c)) 近似 sigma_y(地面)。
    """
    iy, ix = np.unravel_index(np.argmax(field_2d), field_2d.shape)
    col = field_2d[:, ix]
    s = col.sum()
    if s <= 0:
        return float("nan")
    return float(np.sqrt(np.sum(Y ** 2 * col) / s))


def sigma_compare(stab: str):
    """直接对比算法与数据集生成脚本的 sigma_y / sigma_z 公式 (诊断根因)。"""
    xs = np.array([100.0, 500.0, 1000.0, 2000.0])
    # 算法实现 (open-country)
    sy_alg = np.asarray(gp.briggs_sigma_y(xs, stab, urban=False), dtype=float)
    sz_alg = np.asarray(gp.briggs_sigma_z(xs, stab, urban=False), dtype=float)
    # 数据集生成脚本公式 (复刻 generate_dataset.pg_sigmas)
    coef = {
        "A": dict(sy=0.22, sz=0.20, syb=1e-4, szb=0.0),
        "B": dict(sy=0.16, sz=0.12, syb=1e-4, szb=0.0),
        "C": dict(sy=0.11, sz=0.08, syb=1e-4, szb=2e-4),
        "D": dict(sy=0.08, sz=0.06, syb=1e-4, szb=1.5e-3),
        "E": dict(sy=0.06, sz=0.03, syb=1e-4, szb=3e-4),
        "F": dict(sy=0.04, sz=0.016, syb=1e-4, szb=3e-4),
    }[stab]
    sy_tru = coef["sy"] * xs / np.sqrt(1.0 + coef["syb"] * xs)
    sz_tru = coef["sz"] * xs / np.sqrt(1.0 + coef["szb"] * xs)
    return xs, sy_alg, sy_tru, sz_alg, sz_tru


def fmt(v, n=4):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return "  nan"
    return f"{v:.{n}g}"


def main():
    print("=" * 96)
    print("tests Case 1 — 正向高斯烟羽模型精度验证")
    print("源: x=0 y=0 H=50m Q=100g/s, u=5m/s, open-country, 比较单位 mg/m^3")
    print("=" * 96)

    rows = []
    for stab in STABS:
        truth = load_truth_csv(stab)        # [ny, nx]
        pred = predict_ground_field(stab)   # [ny, nx]

        m = gp.comparison_statistics(pred, truth)
        pk_t, xt, yt = peak_info(truth)
        pk_p, xp, yp = peak_info(pred)
        w_t = crosswind_width(truth)
        w_p = crosswind_width(pred)
        rows.append(dict(stab=stab, FAC2=m["FAC2"], FB=m["FB"], NMSE=m["NMSE"],
                         pk_t=pk_t, pk_p=pk_p, xt=xt, xp=xp,
                         w_t=w_t, w_p=w_p))

    # ---- 指标表 ----
    print("\n[表1] 逐稳定度评估指标 (pred=算法, obs=解析真值)")
    print(f"{'稳定度':<6}{'FAC2':>8}{'FB':>10}{'NMSE':>12}"
          f"{'峰值_真值':>14}{'峰值_预测':>14}{'峰值比':>9}")
    print("-" * 73)
    for r in rows:
        ratio = r["pk_p"] / r["pk_t"] if r["pk_t"] else float("nan")
        print(f"{r['stab']:<6}{fmt(r['FAC2'],3):>8}{fmt(r['FB'],3):>10}"
              f"{fmt(r['NMSE'],3):>12}{fmt(r['pk_t'],4):>14}"
              f"{fmt(r['pk_p'],4):>14}{fmt(ratio,3):>9}")

    print("\n[表2] 地面峰值位置 (下风向 x, m) 与横风向二阶矩半宽 (m)")
    print(f"{'稳定度':<6}{'x峰_真值':>12}{'x峰_预测':>12}"
          f"{'宽_真值':>12}{'宽_预测':>12}")
    print("-" * 54)
    for r in rows:
        print(f"{r['stab']:<6}{fmt(r['xt'],5):>12}{fmt(r['xp'],5):>12}"
              f"{fmt(r['w_t'],4):>12}{fmt(r['w_p'],4):>12}")

    # ---- sigma 公式诊断 ----
    print("\n[表3] sigma_y / sigma_z 公式对比 (算法 vs 数据集生成脚本)")
    print(f"{'稳定度':<5}{'x(m)':>7}{'sy_算法':>11}{'sy_真值':>11}{'dy%':>8}"
          f"{'sz_算法':>11}{'sz_真值':>11}{'dz%':>8}")
    print("-" * 72)
    for stab in STABS:
        xs, sya, syt, sza, szt = sigma_compare(stab)
        for i, xv in enumerate(xs):
            dy = (sya[i] - syt[i]) / syt[i] * 100.0
            dz = (sza[i] - szt[i]) / szt[i] * 100.0
            lead = stab if i == 0 else ""
            print(f"{lead:<5}{int(xv):>7}{fmt(sya[i],4):>11}{fmt(syt[i],4):>11}"
                  f"{fmt(dy,3):>8}{fmt(sza[i],4):>11}{fmt(szt[i],4):>11}"
                  f"{fmt(dz,3):>8}")

    # ---- 3D 剖面对比 (中性 D) ----
    print("\n[表4] 3D 体数据对比 (plume_3d_D.npy, shape [nx,ny,nz])")
    truth3d_path = os.path.join(CASE1, "plume_3d_D.npy")
    if not os.path.exists(truth3d_path):
        print("跳过: plume_3d_D.npy 未提交到仓库。需要 3D 对比时请先运行 tests/generate_dataset.py 生成。")
    else:
        truth3d = np.load(truth3d_path).astype(float)
        pred3d = predict_3d_field("D")
        m3d = gp.comparison_statistics(pred3d, truth3d)
        print(f"全场: FAC2={fmt(m3d['FAC2'],3)} FB={fmt(m3d['FB'],3)} "
              f"NMSE={fmt(m3d['NMSE'],3)} 真值max={fmt(truth3d.max(),5)} "
              f"预测max={fmt(pred3d.max(),5)}")
        print(f"{'高度层 z(m)':<12}{'FAC2':>8}{'FB':>10}{'NMSE':>12}"
              f"{'层max_真值':>14}{'层max_预测':>14}")
        print("-" * 70)
        for zi in [0, 10, 20, 25, 30]:  # z 索引 -> z = zi*5 m
            t_layer = truth3d[:, :, zi]
            p_layer = pred3d[:, :, zi]
            mm = gp.comparison_statistics(p_layer, t_layer)
            print(f"{Z[zi]:<12.0f}{fmt(mm['FAC2'],3):>8}{fmt(mm['FB'],3):>10}"
                  f"{fmt(mm['NMSE'],3):>12}{fmt(t_layer.max(),4):>14}"
                  f"{fmt(p_layer.max(),4):>14}")

        # 沿羽轴 (y=0) 垂直剖面在 x=500 处对比
        ix500 = int(np.argmin(np.abs(X - 500.0)))
        iy0 = int(np.argmin(np.abs(Y - 0.0)))
        print(f"\n[表5] x=500m, y=0 垂直廓线对比 (mg/m^3)")
        print(f"{'z(m)':>6}{'真值':>12}{'预测':>12}{'比值':>8}")
        print("-" * 38)
        for zi in [0, 5, 10, 15, 20, 30, 40]:
            tv = truth3d[ix500, iy0, zi]
            pv = pred3d[ix500, iy0, zi]
            rr = pv / tv if tv > 0 else float("nan")
            print(f"{Z[zi]:>6.0f}{fmt(tv,4):>12}{fmt(pv,4):>12}{fmt(rr,3):>8}")

    print("\n完成。")


if __name__ == "__main__":
    main()

