"""工程级高斯烟羽 / 烟团扩散物理模型。

实现化工装置危险气体泄漏评估中常用的经典大气扩散模型，并包含具备
物理依据的组成部分：

    - Briggs (1973) 扩散系数 sigma_y / sigma_z：随下风距离（米）和
      Pasquill A-F 稳定度变化，同时支持开阔地（乡村）和建成区（城市）。
    - 带完整地面反射和抬升源高度的稳态高斯烟羽。
    - 用多个高斯烟团叠加表示有限时长瞬态释放；当时间步足够小时会收敛到
      连续烟羽解析解，并自然体现释放建立和停止后的消散过程。
    - 用幂律风廓线把 10 m 参考风速换算到释放高度。
    - 基于理想气体状态方程，将质量浓度（kg/m3）换算为体积分数（ppm），
      让以 ppm 表示的预警 / 危险阈值具有真实物理含义。

参考资料：
    - G. A. Briggs, "Diffusion estimation for small emissions" (1973).
    - D. B. Turner, "Workbook of Atmospheric Dispersion Estimates" (1970).
    - Atmospheric dispersion modeling, Wikipedia.

除非另有说明，本模块内部距离单位为米，时间为秒，质量为克，排放速率为克/秒。

典型用法：
    field = transient_ppm_field(along_m, cross_m, params)
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict

import numpy as np


# 通用气体常数（J / mol / K）和标准大气压（Pa）。
R_GAS = 8.314462618
STANDARD_PRESSURE_PA = 101325.0

# 有效输运风速下限（m/s）。用于避免静风条件下浓度奇异；
# 也符合监管实践中对低风速高斯模型进行限幅的做法。
MIN_WIND_SPEED = 0.3

# 计算扩散系数时使用的下风向传播距离下限（m），防止源点处 sigma 塌缩为 0。
MIN_TRAVEL_DISTANCE = 1.0

# 按稳定度划分的幂律风廓线指数（开阔地取值，Irwin 1979）。
# 用于把 10 m 风速外推到释放高度。
WIND_PROFILE_EXPONENT = {
    "A": 0.07,
    "B": 0.07,
    "C": 0.10,
    "D": 0.15,
    "E": 0.35,
    "F": 0.55,
}

VALID_STABILITY_CLASSES = ("A", "B", "C", "D", "E", "F")


def normalize_stability(stability_class: str) -> str:
    """把任意稳定度标签规范化为有效的 Pasquill 类别。

    参数：
        stability_class: 原始稳定度标签（大小写不敏感）。

    返回：
        'A'..'F' 中的一个。

    Raises:
        ValueError: 如果稳定度标签不属于 A-F。
    """
    label = str(stability_class or "").strip().upper()
    if label in VALID_STABILITY_CLASSES:
        return label
    raise ValueError(f"invalid stabilityClass '{stability_class}', expected one of A-F")


def briggs_sigma_y(distance_m: np.ndarray | float, stability_class: str, urban: bool) -> np.ndarray | float:
    """计算横风向扩散系数 sigma_y（Briggs, 1973）。

    参数：
        distance_m: 距离源的下风向距离，单位米，可为标量或数组。
        stability_class: Pasquill 稳定度类别 'A'..'F'。
        urban: True 表示建成区（城市）地形，False 表示开阔地。

    返回：
        单位为米的 sigma_y，形状/类型与 ``distance_m`` 匹配。
    """
    x = np.maximum(distance_m, MIN_TRAVEL_DISTANCE)
    stab = normalize_stability(stability_class)
    if urban:
        # Briggs 城市系数（A-B / C / D / E-F 分组）。
        a = {"A": 0.32, "B": 0.32, "C": 0.22, "D": 0.16, "E": 0.11, "F": 0.11}[stab]
        return a * x / np.sqrt(1.0 + 0.0004 * x)
    # Briggs 开阔地系数。
    a = {"A": 0.22, "B": 0.16, "C": 0.11, "D": 0.08, "E": 0.06, "F": 0.04}[stab]
    return a * x / np.sqrt(1.0 + 0.0001 * x)


def briggs_sigma_z(distance_m: np.ndarray | float, stability_class: str, urban: bool) -> np.ndarray | float:
    """计算垂直扩散系数 sigma_z（Briggs, 1973）。

    参数：
        distance_m: 距离源的下风向距离，单位米，可为标量或数组。
        stability_class: Pasquill 稳定度类别 'A'..'F'。
        urban: True 表示建成区（城市）地形，False 表示开阔地。

    返回：
        单位为米的 sigma_z，形状/类型与 ``distance_m`` 匹配。
    """
    x = np.maximum(distance_m, MIN_TRAVEL_DISTANCE)
    stab = normalize_stability(stability_class)
    if urban:
        if stab in ("A", "B"):
            return 0.24 * x * np.sqrt(1.0 + 0.001 * x)
        if stab == "C":
            return 0.20 * x
        if stab == "D":
            return 0.14 * x / np.sqrt(1.0 + 0.0003 * x)
        return 0.08 * x / np.sqrt(1.0 + 0.0015 * x)
    # 开阔地。
    if stab == "A":
        return 0.20 * x
    if stab == "B":
        return 0.12 * x
    if stab == "C":
        return 0.08 * x / np.sqrt(1.0 + 0.0002 * x)
    if stab == "D":
        return 0.06 * x / np.sqrt(1.0 + 0.0015 * x)
    if stab == "E":
        return 0.03 * x / np.sqrt(1.0 + 0.0003 * x)
    return 0.016 * x / np.sqrt(1.0 + 0.0003 * x)


def wind_at_height(
    wind_speed_10m: float,
    release_height_m: float,
    stability_class: str,
    reference_height_m: float = 10.0,
) -> float:
    """把 10 m 参考风速换算到释放高度。

    使用带稳定度相关指数的幂律风廓线，并设置下限，保证输运风速不会低于
    ``MIN_WIND_SPEED``。

    参数：
        wind_speed_10m: 参考高度处测得的风速（m/s）。
        release_height_m: 地面以上有效释放高度（m）。
        stability_class: Pasquill 稳定度类别 'A'..'F'。
        reference_height_m: 风速测量高度 Hg，单位米。

    返回：
        释放高度处的有效输运风速（m/s）。
    """
    stab = normalize_stability(stability_class)
    exponent = WIND_PROFILE_EXPONENT[stab]
    reference = max(float(wind_speed_10m), 0.0)
    height = max(float(release_height_m), 1.0)
    reference_height = max(float(reference_height_m), 0.1)
    speed = reference * (height / reference_height) ** exponent
    return max(speed, MIN_WIND_SPEED)


def mass_to_ppm(
    mass_conc_g_m3: np.ndarray | float,
    molar_mass_g_mol: float,
    temperature_k: float,
    pressure_pa: float = STANDARD_PRESSURE_PA,
) -> np.ndarray | float:
    """将质量浓度（g/m3）换算为体积分数（ppm）。

    使用理想气体状态方程：ppm_v = C * R * T / (M * P) * 1e6，其中 C 是
    质量浓度，M 是摩尔质量，T 是绝对温度，P 是环境压力。

    参数：
        mass_conc_g_m3: 质量浓度，单位克/立方米。
        molar_mass_g_mol: 气体摩尔质量，单位克/摩尔。
        temperature_k: 环境绝对温度，单位 K。
        pressure_pa: 环境压力，单位 Pa（默认 1 atm）。

    返回：
        体积分数 ppm，形状与输入相同。
    """
    molar = max(float(molar_mass_g_mol), 1e-6)
    temperature = max(float(temperature_k), 1.0)
    pressure = max(float(pressure_pa), 1.0)
    return mass_conc_g_m3 * R_GAS * temperature / (molar * pressure) * 1.0e6


def steady_plume_mass_conc(
    emission_rate_g_s: float,
    wind_speed: float,
    downwind_m: np.ndarray | float,
    crosswind_m: np.ndarray | float,
    height_m: np.ndarray | float,
    release_height_m: float,
    stability_class: str,
    urban: bool,
) -> np.ndarray | float:
    """带地面反射的稳态高斯烟羽质量浓度（经典 Briggs/Pasquill）。

    实现经典公式：

        C = Q / (2*pi*u*sigma_y*sigma_z)
            * exp(-y^2 / (2*sigma_y^2))
            * [ exp(-(z-H)^2 / (2*sigma_z^2)) + exp(-(z+H)^2 / (2*sigma_z^2)) ]

    源点上风向（downwind_m <= 0）的浓度为零。

    参数：
        emission_rate_g_s: 连续排放速率 Q，单位克/秒。
        wind_speed: 释放高度处有效输运风速 u（m/s）。
        downwind_m: 相对源点的下风向坐标 x（m）。
        crosswind_m: 相对烟羽轴线的横风向坐标 y（m）。
        height_m: 受体离地高度 z（m）。
        release_height_m: 有效源高度 H（m）。
        stability_class: Pasquill 稳定度类别 'A'..'F'。
        urban: True 表示城市地形，False 表示开阔地。

    返回：
        质量浓度，单位克/立方米，形状与输入一致。
    """
    x = np.asarray(downwind_m, dtype=float)
    y = np.asarray(crosswind_m, dtype=float)
    z = np.asarray(height_m, dtype=float)
    u = max(float(wind_speed), MIN_WIND_SPEED)
    h = float(release_height_m)

    sigma_y = np.asarray(briggs_sigma_y(x, stability_class, urban), dtype=float)
    sigma_z = np.asarray(briggs_sigma_z(x, stability_class, urban), dtype=float)
    sigma_y = np.maximum(sigma_y, 1e-3)
    sigma_z = np.maximum(sigma_z, 1e-3)

    norm = emission_rate_g_s / (2.0 * math.pi * u * sigma_y * sigma_z)
    crosswind_term = np.exp(-(y * y) / (2.0 * sigma_y * sigma_y))
    vertical_term = np.exp(-((z - h) ** 2) / (2.0 * sigma_z * sigma_z)) + np.exp(
        -((z + h) ** 2) / (2.0 * sigma_z * sigma_z)
    )
    conc = norm * crosswind_term * vertical_term
    # 源点上风向没有烟羽。
    return np.where(x > 0.0, conc, 0.0)


@dataclass
class PlumeParams:
    """扩散计算所需的物理参数。

    Attributes:
        emission_rate_g_s: 排放速率 Q，单位克/秒。
        wind_speed_10m: 10 m 参考风速（m/s）。
        release_height_m: 有效源高度 H（m）。
        release_duration_s: 总释放时长（s）。
        stability_class: Pasquill 稳定度类别 'A'..'F'。
        urban: True 表示城市地形，False 表示开阔地。
        molar_mass_g_mol: 泄漏气体摩尔质量（g/mol）。
        temperature_k: 环境绝对温度（K）。
        pressure_pa: 环境压力（Pa）。
        wind_reference_height_m: 风速测量高度 Hg，单位米。
    """

    emission_rate_g_s: float
    wind_speed_10m: float
    release_height_m: float
    release_duration_s: float
    stability_class: str
    urban: bool
    molar_mass_g_mol: float
    temperature_k: float
    pressure_pa: float = STANDARD_PRESSURE_PA
    wind_reference_height_m: float = 10.0

    @property
    def effective_wind(self) -> float:
        """释放高度处的有效输运风速（m/s）。"""
        return wind_at_height(
            self.wind_speed_10m,
            self.release_height_m,
            self.stability_class,
            self.wind_reference_height_m,
        )


def build_emission_times(release_duration_s: float, emit_step_s: float) -> np.ndarray:
    """为有限时长释放生成离散烟团释放时刻。

    参数：
        release_duration_s: 总释放时长，单位秒。
        emit_step_s: 相邻烟团之间的时间间隔，单位秒。

    返回：
        一维数组，表示各烟团释放开始时刻（秒）。
    """
    duration = max(float(release_duration_s), 0.0)
    step = max(float(emit_step_s), 1e-3)
    if duration <= 0.0:
        return np.array([0.0])
    count = max(1, int(math.ceil(duration / step)))
    return np.linspace(0.0, duration, count, endpoint=False)


def choose_emit_step(release_duration_s: float, frame_step_s: float, max_puffs: int = 80) -> float:
    """选择兼顾精度和计算成本的烟团释放步长。

    步长需要足够细，让相邻烟团重叠（从而良好收敛到连续烟羽），同时也要
    有上限约束，避免烟团数量失控。

    参数：
        release_duration_s: 总释放时长，单位秒。
        frame_step_s: 动画帧步长，单位秒。
        max_puffs: 释放烟团数量上限。

    返回：
        烟团释放步长，单位秒。
    """
    duration = max(float(release_duration_s), 1.0)
    base = min(max(0.5, float(frame_step_s)), duration / 20.0 if duration > 20.0 else duration)
    floor = duration / float(max_puffs)
    return max(base, floor, 0.5)


def transient_mass_conc_field(
    downwind_m: np.ndarray,
    crosswind_m: np.ndarray,
    time_sec: float,
    params: PlumeParams,
    emission_times: np.ndarray,
    emit_step_s: float,
    receptor_height_m: float = 0.0,
) -> np.ndarray:
    """给定时刻的高斯烟团叠加质量浓度场。

    每个烟团携带质量 ``Q * emit_step``，并以有效风速向下风向平流；其扩散宽度
    由烟团传播距离处的 Briggs 系数决定。叠加多个重叠烟团即可重现释放期间的
    连续烟羽，以及释放停止后的消散过程。

    参数：
        downwind_m: 相对源点的下风向坐标二维数组（m）。
        crosswind_m: 相对轴线的横风向坐标二维数组（m）。
        time_sec: 从释放开始计的观测时刻（s）。
        params: 烟羽物理参数。
        emission_times: 烟团释放开始时刻（s）。
        emit_step_s: 烟团释放间隔（s），决定每个烟团质量。
        receptor_height_m: 受体离地高度（m）。

    返回：
        二维质量浓度场，单位克/立方米。
    """
    u = params.effective_wind
    h = float(params.release_height_m)
    z = float(receptor_height_m)
    puff_mass = float(params.emission_rate_g_s) * float(emit_step_s)
    two_pi_15 = (2.0 * math.pi) ** 1.5

    total = np.zeros_like(downwind_m, dtype=float)
    active = emission_times[emission_times < time_sec]
    for emit_time in active:
        travel_time = time_sec - emit_time
        distance = max(u * travel_time, MIN_TRAVEL_DISTANCE)
        sigma_h = max(float(briggs_sigma_y(distance, params.stability_class, params.urban)), 1e-3)
        sigma_v = max(float(briggs_sigma_z(distance, params.stability_class, params.urban)), 1e-3)
        # 沿风向烟团扩散近似取为与水平横向扩散相同。
        along = np.exp(-((downwind_m - distance) ** 2) / (2.0 * sigma_h * sigma_h))
        cross = np.exp(-(crosswind_m * crosswind_m) / (2.0 * sigma_h * sigma_h))
        vertical = np.exp(-((z - h) ** 2) / (2.0 * sigma_v * sigma_v)) + np.exp(
            -((z + h) ** 2) / (2.0 * sigma_v * sigma_v)
        )
        norm = puff_mass / (two_pi_15 * sigma_h * sigma_h * sigma_v)
        total += norm * along * cross * vertical
    return total


def transient_ppm_field(
    downwind_m: np.ndarray,
    crosswind_m: np.ndarray,
    time_sec: float,
    params: PlumeParams,
    emission_times: np.ndarray,
    emit_step_s: float,
    receptor_height_m: float = 0.0,
) -> np.ndarray:
    """将烟团叠加浓度场换算为 ppm。

    参数：
        downwind_m: 相对源点的下风向坐标二维数组（m）。
        crosswind_m: 相对轴线的横风向坐标二维数组（m）。
        time_sec: 从释放开始计的观测时刻（s）。
        params: 烟羽物理参数。
        emission_times: 烟团释放开始时刻（s）。
        emit_step_s: 烟团释放间隔（s）。
        receptor_height_m: 受体离地高度（m）。

    返回：
        二维浓度场，单位 ppm（体积分数）。
    """
    mass_field = transient_mass_conc_field(
        downwind_m,
        crosswind_m,
        time_sec,
        params,
        emission_times,
        emit_step_s,
        receptor_height_m,
    )
    return mass_to_ppm(mass_field, params.molar_mass_g_mol, params.temperature_k, params.pressure_pa)


def integrated_crosswind_mass_flux(
    emission_rate_g_s: float,
    wind_speed: float,
    downwind_m: float,
    release_height_m: float,
    stability_class: str,
    urban: bool,
    y_samples: int = 801,
    z_samples: int = 801,
) -> float:
    """数值积分某个下风向截面的烟羽质量通量。

    对于不反应、守恒的示踪物，垂直于风向的截面通量
    ``\\int\\int C * u dy dz`` 必须等于排放速率 Q。验证套件使用该辅助函数
    检查质量守恒。

    参数：
        emission_rate_g_s: 排放速率 Q，单位克/秒。
        wind_speed: 有效输运风速（m/s）。
        downwind_m: 积分截面的下风向距离（m）。
        release_height_m: 有效源高度 H（m）。
        stability_class: Pasquill 稳定度类别 'A'..'F'。
        urban: True 表示城市地形，False 表示开阔地。
        y_samples: 横风向采样点数。
        z_samples: 垂直方向采样点数。

    返回：
        积分得到的质量通量，单位克/秒。
    """
    if float(downwind_m) <= 0.0:
        return 0.0

    sigma_y = float(briggs_sigma_y(downwind_m, stability_class, urban))
    sigma_z = float(briggs_sigma_z(downwind_m, stability_class, urban))
    sigma_y = max(sigma_y, 1e-3)
    sigma_z = max(sigma_z, 1e-3)
    wind = max(float(wind_speed), MIN_WIND_SPEED)
    h = float(release_height_m)

    y = np.linspace(-6.0 * sigma_y, 6.0 * sigma_y, y_samples)
    z = np.linspace(0.0, 6.0 * sigma_z + h, z_samples)
    crosswind_term = np.exp(-(y * y) / (2.0 * sigma_y * sigma_y))
    vertical_term = np.exp(-((z - h) ** 2) / (2.0 * sigma_z * sigma_z)) + np.exp(
        -((z + h) ** 2) / (2.0 * sigma_z * sigma_z)
    )
    y_integral = np.trapezoid(crosswind_term, y)
    z_integral = np.trapezoid(vertical_term, z)
    norm = emission_rate_g_s / (2.0 * math.pi * wind * sigma_y * sigma_z)
    return float(norm * y_integral * z_integral * wind)


def comparison_statistics(predicted: np.ndarray, observed: np.ndarray) -> Dict[str, float]:
    """计算标准模型评估指标（FB、NMSE、FAC2）。

    这些指标是大气扩散模型验证中推荐使用的指标（Chang & Hanna, 2004）。

    参数：
        predicted: 模型预测浓度。
        observed: 参考/观测浓度。

    返回：
        包含 'FB'（分数偏差）、'NMSE'（归一化均方误差）和
        'FAC2'（预测值落在 2 倍因子内的比例）的字典。
    """
    pred = np.asarray(predicted, dtype=float)
    obs = np.asarray(observed, dtype=float)
    eps = 1e-30
    mean_pred = float(np.mean(pred))
    mean_obs = float(np.mean(obs))
    fb = 2.0 * (mean_obs - mean_pred) / (mean_obs + mean_pred + eps)
    nmse = float(np.mean((obs - pred) ** 2) / (mean_obs * mean_pred + eps))
    both_zero = (np.abs(pred) <= eps) & (np.abs(obs) <= eps)
    ratio = pred / np.maximum(obs, eps)
    fac2 = float(np.mean(both_zero | ((ratio >= 0.5) & (ratio <= 2.0))))
    return {"FB": fb, "NMSE": nmse, "FAC2": fac2}


def resolve_environment(terrain_roughness: float) -> bool:
    """将地表粗糙度映射为乡村/城市扩散机制。

    设备密集的化工园区更接近城市（建成区）扩散条件。粗糙度大于等于 0.4
    时选用城市 Briggs 系数组。

    参数：
        terrain_roughness: 地表粗糙度指标（无量纲）。

    返回：
        True 表示城市机制，False 表示开阔地。
    """
    return float(terrain_roughness) >= 0.4
