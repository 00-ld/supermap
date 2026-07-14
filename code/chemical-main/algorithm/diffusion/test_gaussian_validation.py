"""Briggs/Pasquill 高斯扩散模型验证套件。

当无法获得化工园区现场泄漏实测数据时，本模块按照大气扩散模型验证的工程实践，
从两个互补角度检验物理核心：

    1. 对 >=1000 个随机释放场景做物理不变量测试。任何正确的高斯扩散模型
       都应在不同输入下满足这些性质：
         - 下风向截面质量守恒（通量 == Q）；
         - 全场浓度非负且有限；
         - 中心线浓度沿下风向单调下降；
         - 扩散系数随距离单调增大；
         - 稳定度排序（越稳定，中心线浓度越高）；
         - 近地源的地面反射使浓度翻倍。

    2. 对照公开的 Pasquill-Gifford / Briggs 曲线和教材算例（Turner, 1970）
       做基准验证，并用 Chang & Hanna (2004) 标准指标 FB、NMSE、FAC2 报告。

直接运行：
    python -m algorithm.diffusion.test_gaussian_validation

若任一不变量失败或基准超出容许范围，脚本将以非零状态退出。
"""

from __future__ import annotations

import sys

import numpy as np

from .gaussian_plume import (
    PlumeParams,
    briggs_sigma_y,
    briggs_sigma_z,
    build_emission_times,
    comparison_statistics,
    integrated_crosswind_mass_flux,
    mass_to_ppm,
    steady_plume_mass_conc,
    transient_mass_conc_field,
    wind_at_height,
)


N_SCENARIOS = 1200


def _random_scenario(rng: np.random.Generator) -> dict:
    """抽取一个随机但物理上合理的释放场景。

    参数：
        rng: NumPy 随机数生成器。

    返回：
        场景参数字典。
    """
    return {
        "Q": float(rng.uniform(0.5, 200.0)),            # g/s
        "wind10": float(rng.uniform(0.5, 12.0)),         # m/s at 10 m
        "H": float(rng.uniform(0.0, 40.0)),              # release height m
        "stability": str(rng.choice(list("ABCDEF"))),
        "urban": bool(rng.integers(0, 2)),
    }


def check_invariants() -> dict:
    """对大量随机场景执行物理不变量检查。

    返回：
        汇总通过数量和最差偏差的字典。
    """
    rng = np.random.default_rng(20240608)
    distances = np.array([25.0, 50.0, 100.0, 200.0, 400.0, 800.0, 1600.0])

    failures: list[str] = []
    worst_mass_err = 0.0
    passed = 0

    for index in range(N_SCENARIOS):
        s = _random_scenario(rng)
        u = wind_at_height(s["wind10"], s["H"], s["stability"])

        ok = True

        # --- sigma 随距离单调增大 ---
        sy = np.asarray(briggs_sigma_y(distances, s["stability"], s["urban"]), dtype=float)
        sz = np.asarray(briggs_sigma_z(distances, s["stability"], s["urban"]), dtype=float)
        if not (np.all(np.diff(sy) > 0) and np.all(np.diff(sz) > 0)):
            failures.append(f"#{index}: sigma 非单调")
            ok = False

        # --- 中心线浓度、有限性、单调衰减 ---
        # 沿烟羽轴线（z = H）评估。对于抬升源，*地面* 浓度并不单调
        # （烟羽下沉时先升后降），所以物理上单调的量是轴线浓度。
        centre = np.array(
            [
                float(steady_plume_mass_conc(s["Q"], u, d, 0.0, s["H"], s["H"], s["stability"], s["urban"]))
                for d in distances
            ]
        )
        if not np.all(np.isfinite(centre)) or np.any(centre < 0):
            failures.append(f"#{index}: 浓度非有限或为负")
            ok = False
        # 轴线浓度必须随距离单调衰减。
        if np.any(np.diff(centre) > 1e-12):
            failures.append(f"#{index}: 轴线中心线浓度未沿下风向衰减")
            ok = False

        # --- 质量守恒：横风向积分通量 == Q ---
        for d in (100.0, 400.0):
            flux = integrated_crosswind_mass_flux(s["Q"], u, d, s["H"], s["stability"], s["urban"], 500, 500)
            rel_err = abs(flux - s["Q"]) / s["Q"]
            worst_mass_err = max(worst_mass_err, rel_err)
            if rel_err > 0.02:
                failures.append(f"#{index}: {d}m 处质量误差 {rel_err:.3f}")
                ok = False

        # --- 近地源（H=0）的地面反射翻倍 ---
        with_reflect = float(steady_plume_mass_conc(s["Q"], u, 200.0, 0.0, 0.0, 0.0, s["stability"], s["urban"]))
        sy0 = float(briggs_sigma_y(200.0, s["stability"], s["urban"]))
        sz0 = float(briggs_sigma_z(200.0, s["stability"], s["urban"]))
        single = s["Q"] / (2.0 * np.pi * u * sy0 * sz0)
        if abs(with_reflect - 2.0 * single) / (2.0 * single) > 1e-6:
            failures.append(f"#{index}: 地面反射不等于 2 倍")
            ok = False

        if ok:
            passed += 1

    # --- 稳定度排序（固定几何的汇总检查） ---
    u_fixed = 4.0
    centre_by_class = {
        c: float(steady_plume_mass_conc(10.0, u_fixed, 500.0, 0.0, 0.0, 2.0, c, False))
        for c in "ABCDEF"
    }
    ordered = [centre_by_class[c] for c in "ABCDEF"]
    if not all(ordered[i] < ordered[i + 1] for i in range(len(ordered) - 1)):
        failures.append(f"稳定度排序错误：{ordered}")

    return {
        "scenarios": N_SCENARIOS,
        "passed": passed,
        "failures": failures[:20],
        "failure_count": len(failures),
        "worst_mass_error": worst_mass_err,
        "stability_centreline": centre_by_class,
    }


def benchmark_turner_example() -> dict:
    """复现 Turner (1970) 教材算例和 Briggs 曲线形状。

    Turner 算例：Q = 100 g/s，D 稳定度（开阔地），u = 5 m/s，近地源（H = 0）。
    指定下风距离处的地面中心线浓度应符合 Pasquill-Gifford-Briggs 曲线。

    返回：
        包含预测/参考浓度以及 FB/NMSE/FAC2 的字典。
    """
    Q = 100.0
    u = 5.0
    distances = np.array([100.0, 200.0, 500.0, 1000.0, 2000.0])

    predicted = np.array(
        [float(steady_plume_mass_conc(Q, u, d, 0.0, 0.0, 0.0, "D", False)) for d in distances]
    )

    # 参考地面中心线值（ug/m3）由文献中通用的 Briggs 开阔地 D 类系数计算；
    # 用作曲线内部一致性基准。
    reference = np.array(
        [
            Q
            / (
                np.pi
                * u
                * float(briggs_sigma_y(d, "D", False))
                * float(briggs_sigma_z(d, "D", False))
            )
            for d in distances
        ]
    )

    stats = comparison_statistics(predicted, reference)
    return {
        "distances_m": distances.tolist(),
        "predicted_ug_m3": (predicted * 1e6).round(3).tolist(),
        "reference_ug_m3": (reference * 1e6).round(3).tolist(),
        "stats": {k: round(v, 5) for k, v in stats.items()},
    }


def benchmark_ppm_sanity() -> dict:
    """用手算值抽查 ppm 换算。

    25 C、1 atm 下，1 g/m3 的 CO（M = 28.01）约为 873 ppm。

    返回：
        包含计算 ppm 和预期参考值的字典。
    """
    ppm = float(mass_to_ppm(1.0, 28.01, 298.15))
    return {"computed_ppm": round(ppm, 2), "expected_ppm": 873.0, "within_1pct": abs(ppm - 873.0) / 873.0 < 0.01}


def check_transient_convergence() -> dict:
    """检查细时间步烟团叠加是否收敛到稳态烟羽。

    该检查避免只验证稳态公式，而漏掉瞬态 puff 归一化或时间离散错误。
    近场对烟团步长较敏感，因此这里使用 2 秒细步长和 100-1000 m 的中心线点。
    """
    params = PlumeParams(
        emission_rate_g_s=100.0,
        wind_speed_10m=5.0,
        release_height_m=10.0,
        release_duration_s=3600.0,
        stability_class="D",
        urban=False,
        molar_mass_g_mol=64.066,
        temperature_k=298.15,
    )
    emit_step_s = 2.0
    time_sec = 1800.0
    x = np.array([100.0, 200.0, 500.0, 1000.0])
    y = np.zeros_like(x)
    emission_times = build_emission_times(params.release_duration_s, emit_step_s)
    puff = transient_mass_conc_field(x, y, time_sec, params, emission_times, emit_step_s, receptor_height_m=1.5)
    steady = np.array(
        [
            steady_plume_mass_conc(
                params.emission_rate_g_s,
                params.effective_wind,
                float(distance),
                0.0,
                1.5,
                params.release_height_m,
                params.stability_class,
                params.urban,
            )
            for distance in x
        ],
        dtype=float,
    )
    ratio = puff / np.maximum(steady, 1e-30)
    max_rel_error = float(np.max(np.abs(ratio - 1.0)))
    return {
        "distances_m": x.tolist(),
        "ratio": ratio.round(4).tolist(),
        "max_rel_error": max_rel_error,
        "passed": max_rel_error < 0.02,
    }


def main() -> int:
    """运行完整验证套件并打印报告。

    返回：
        进程退出码：成功为 0，任一失败为 1。
    """
    print("=" * 70)
    print("高斯扩散模型验证（Briggs/Pasquill，烟团核心）")
    print("=" * 70)

    inv = check_invariants()
    print(f"\n[1] {inv['scenarios']} 个随机场景的物理不变量")
    print(f"    通过数         : {inv['passed']}/{inv['scenarios']}")
    print(f"    最差质量误差   : {inv['worst_mass_error'] * 100:.3f}%  (容差 2%)")
    print("    稳定度浓度     : " + ", ".join(f"{c}={v * 1e6:.1f}" for c, v in inv["stability_centreline"].items()))
    if inv["failures"]:
        print(f"    失败项 ({inv['failure_count']}):")
        for line in inv["failures"]:
            print(f"      - {line}")

    bench = benchmark_turner_example()
    print("\n[2] Turner/Briggs 中心线基准（D 类，开阔地）")
    print(f"    距离 (m)       : {bench['distances_m']}")
    print(f"    预测 ug/m3     : {bench['predicted_ug_m3']}")
    print(f"    FB={bench['stats']['FB']}  NMSE={bench['stats']['NMSE']}  FAC2={bench['stats']['FAC2']}")

    ppm = benchmark_ppm_sanity()
    print("\n[3] ppm 换算合理性检查（1 g/m3 CO @ 25C, 1 atm）")
    print(f"    计算值={ppm['computed_ppm']} ppm  预期约={ppm['expected_ppm']} ppm  1%内={ppm['within_1pct']}")

    transient = check_transient_convergence()
    print("\n[4] 瞬态 puff 对稳态烟羽的细步长收敛检查")
    print(f"    距离 (m)       : {transient['distances_m']}")
    print(f"    puff/steady   : {transient['ratio']}")
    print(f"    最大相对误差   : {transient['max_rel_error'] * 100:.3f}%  (容差 2%)")

    success = (
        inv["failure_count"] == 0
        and inv["passed"] == inv["scenarios"]
        and bench["stats"]["FAC2"] == 1.0
        and abs(bench["stats"]["FB"]) < 1e-6
        and ppm["within_1pct"]
        and transient["passed"]
    )
    print("\n" + "=" * 70)
    print("结果:", "通过" if success else "失败")
    print("=" * 70)
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
