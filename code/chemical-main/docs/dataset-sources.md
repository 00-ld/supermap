# 数据集来源台账

本文档用于记录气体扩散、溯源、路径规划和传感器校验相关数据来源。所有真实数据集接入前必须记录下载时间、版本、许可证、预处理步骤、字段说明和适用边界；未完成下载或未完成授权确认的数据不得在报告中写成“已使用真实数据验证”。

## 当前仓库数据状态

| 数据目录 | 状态 | 数据性质 | 说明 |
| --- | --- | --- | --- |
| `tests/` | 已提交 | 合成解析数据 | 用高斯烟羽/烟团解析公式和固定随机种子生成，用于算法回归测试，不是现场实测数据。 |
| `algorithm/diffusion/test_*` | 已提交 | 单元/回归验证 | 用物理不变量、公式基准和数值收敛检查验证扩散实现。 |
| `algorithm/diffusion/test_gaussian_validation.py` | 已提交 | 合成/公式回归验证 | 校验高斯烟羽公式基准和误差指标边界，不是现场实测标定。 |
| `datasets/samples/prairie_grass/PGrassOBSAnalysis.txt` | 已提交 | 真实野外扩散实验样本 | Prairie Grass 观测分析样本，当前仅用于 `Sy (m)` 横风向扩散宽度验证，不用于绝对浓度结论。 |
| `datasets/raw/btex/` | 本地已下载，不提交 | 真实示踪释放实验数据 | Bolzano Tracer EXperiment (BTEX)，包含 SF6 真实释放浓度、气象站、SODAR、温度廓线、烟囱排放工况。 |
| `datasets/processed/btex/` | 本地已生成，不提交 | 真实训练/标定表 | 由 `tools/prepare_btex_training_data.py` 从 BTEX 原始表生成，当前有 65 条可监督 SF6 浓度样本和 14 条 censored/缺失浓度样本。 |
| `datasets/raw/d6589/` | 本地已下载，不提交 | 真实野外扩散/溯源评估数据 | HARMO/ASTM D6589 archive，当前使用 Prairie Grass `PGARCS.DAT` 与 `PGSPLUS.DAT` 做源点位置溯源验证。 |
| `datasets/processed/prairie_grass/` | 本地已生成，不提交 | 真实弧线浓度溯源表 | 由 `tools/prepare_prairie_grass_source_validation_data.py` 生成，保留 8172 条观测、68 个实验、340 条弧线。 |
| `.npy` 体数据 | 不提交 | 本地生成产物 | 由 `tests/generate_dataset.py` 生成，因体积和可复现性原因不进 GitHub。 |

## 候选权威来源

| 来源 | 用途 | 接入状态 | 备注 |
| --- | --- | --- | --- |
| NIST Chemistry WebBook, SRD 69 | CO、O2、NH3、CH4 等气体分子量、热物性、化学物性参数 | 候选 | 用于校验气体参数表，注意 NIST WebBook 的版权和使用说明。 |
| NOAA NCEI Integrated Surface Database (ISD) | 风速、风向、温度、露点、气压、能见度等气象实况 | 候选 | 可用于构造真实气象边界条件；需要按站点、时间范围下载并保留元数据。 |
| HARMO classic dispersion datasets | Prairie Grass、Kincaid、Round Hill 等经典扩散模型评估数据 | 已部分接入 | 已下载 ASTM D6589 archive，当前接入 Prairie Grass 弧线观测；Kincaid 等尚未处理。 |
| Bolzano Tracer EXperiment (BTEX), PANGAEA | SF6 真实示踪释放、地面浓度、气象观测、风廓线、温度廓线 | 已本地下载并预处理 | 可用于真实标定/小样本微调/外部验证；样本量小，且为 Alpine valley 复杂地形，不等同于本项目园区现场数据。 |
| Jack Rabbit Program / Jack Rabbit II | 氯气、氨气等危险气体大规模释放实验参考 | 候选 | 更偏危险气体事故级场景；数据敏感性和公开可用范围需要单独确认。 |

## 来源链接

- NIST Chemistry WebBook, SRD 69: https://webbook.nist.gov/chemistry/
- NIST CO 示例页: https://webbook.nist.gov/cgi/cbook.cgi?ID=630-08-0
- NOAA NCEI ISD: https://www.ncei.noaa.gov/products/land-based-station/integrated-surface-database
- NOAA ISD HTTPS 数据入口: https://www.ncei.noaa.gov/data/global-hourly/
- HARMO classic datasets: https://www.harmo.org/classic.php
- BTEX PANGAEA dataset series: https://doi.org/10.1594/PANGAEA.898761
- BTEX original files: https://store.pangaea.de/Publications/Falocchi-etal_2019/BTEX_OriginalFiles.zip
- Jack Rabbit Program: https://www.uvu.edu/es/jack-rabbit/

## 已归档样本详情

### Prairie Grass `PGrassOBSAnalysis.txt`

| 字段 | 内容 |
| --- | --- |
| 仓库路径 | `datasets/samples/prairie_grass/PGrassOBSAnalysis.txt` |
| 本地导入来源 | HARMO classic Prairie Grass 样本的本地归档副本；仓库只保留该小样本文本，不记录个人机器绝对路径。 |
| 公开来源类别 | HARMO classic dispersion datasets / Prairie Grass field experiment |
| 参考入口 | https://www.harmo.org/classic.php |
| 导入日期 | 2026-06-12 |
| 文件大小 | 47,878 bytes |
| SHA256 | `71CBC94880D3A51E88E6594BE62213176DD28E302503C1A72EA7610495D10397` |
| 当前用途 | `python -m algorithm.diffusion.test_real_prairie_grass`，验证模型对实测 `Sy (m)` 横风向扩散宽度的拟合表现。 |
| 不得扩大解释 | 不能据此宣称绝对浓度、事故全过程、三维 CFD 或全部危险气体场景已通过真实数据验证。 |

字段使用范围：

- 使用 `Exp`、`Dist (m)`、`Sy (m)`。
- 保留但暂不使用 `OMAX`、`CMAX`、`CY`、`CMAX/Q`、`CY/Q`、`PHIC` 等列。
- 稳定度未由文件直接给出，测试中按经典 Briggs `sigma_y` 对每组实验反推最佳 Pasquill 类别；该设定偏向经典模型，因此结论必须保持客观表述。

### BTEX `datasets/raw/btex/`

| 字段 | 内容 |
| --- | --- |
| 数据集 | Bolzano Tracer EXperiment (BTEX) |
| 公开来源 | PANGAEA dataset publication series |
| DOI | https://doi.org/10.1594/PANGAEA.898761 |
| 相关论文 | Falocchi et al. (2020), Earth System Science Data, https://doi.org/10.5194/essd-12-277-2020 |
| 下载日期 | 2026-06-18 |
| 本地原始文件 | `datasets/raw/btex/PANGAEA.898761.zip`、`datasets/raw/btex/BTEX_OriginalFiles.zip` |
| 本地解压目录 | `datasets/raw/btex/pangaea/datasets/` |
| 许可证 | 数据集系列/SF6/烟囱工况为 CC-BY-NC-4.0；部分气象子集为 CC-BY-4.0。 |
| 下载脚本 | `python tools/download_btex_dataset.py` |
| 预处理脚本 | `python tools/prepare_btex_training_data.py --write` |
| 处理输出 | `datasets/processed/btex/btex_training_observations.csv`、`datasets/processed/btex/btex_censored_observations.csv` |
| 当前可用训练样本 | 65 条有 SF6 浓度标签的真实观测；14 条低于定量/空值样本单独输出。 |
| 当前用途 | 真实浓度响应标定、小样本微调、外部验证。 |
| 不得扩大解释 | 不能据此宣称模型已经用本项目化工园区现场传感器数据训练；BTEX 是意大利 Bolzano 山谷复杂地形 SF6 示踪实验，气体、地形、源强和场景与本项目 CO/NH3/CH4/O2 园区不同。 |

BTEX 元数据 PDF 的 Table 1 明确给出两次 SF6 真实释放源强基础量：上午释放 150 kg，持续 1 h；下午释放 450 kg，持续 1.5 h。预处理脚本据此换算并输出 `tracer_source_rate_g_s`：上午约 41.667 g/s，下午约 83.333 g/s。

真实数据校准验证脚本：`python -m algorithm.deep_learning.validate_btex_real_data --epochs 700`。该脚本训练一个小型 PyTorch 残差校准器，输入为当前深度代理预测、真实风场、释放源强、采样时长、烟囱工况和环境条件，输出 `output/btex_real_validation.json` 与本地忽略的 `models/btex_response_calibrator.pt`。

2026-06-18 验证结果边界：

- 浓度留释放批次验证：下午释放留出时，校准后 `RMSE(log1p pptv)=4.533`，`FAC2=0.333`，原深度代理为 `RMSE=4.544`，`FAC2=0.196`；上午释放留出时，校准后 `RMSE=3.080`，`FAC5=0.714`，原深度代理为 `RMSE=5.398`，`FAC5=0.000`。
- 全量样本内上限：校准后 `RMSE(log1p pptv)=1.264`，`FAC2=0.631`，`FAC5=0.800`；这是小样本拟合上限，不是独立泛化结论。
- 真实源点水平搜索：校准模型比原深度代理误差更小，但未通过 500 m 检查；下午释放误差约 894 m，上午释放误差约 2290 m，边界违规数均为 0。因此 BTEX 溯源验收结论为失败，只能支持“真实浓度响应校准有帮助”，不能支持“真实外场源点定位精度已达标”的结论。
- 验证脚本默认将该状态作为失败处理：报告仍会写出，但 `sourceLocalizationPassed500m=false` 时进程退出码为 1，避免把未达标结果误当作通过。

预处理字段说明：

- `source_lat/source_lon/source_elevation_m_asl`：BTEX 焚烧厂烟囱释放点。
- `receptor_lat/receptor_lon/receptor_elevation_m_asl`：空气采样点。
- `x_east_m/y_north_m/distance_m/bearing_deg`：以释放点为原点的局地平面坐标。
- `wind_speed_m_s/wind_dir_deg_from/wind_dir_deg_to/along_wind_m/cross_wind_m`：按最近源侧气象站和采样中点时间匹配的风场特征。
- `air_temp_c/relative_humidity_pct/pressure_hpa`：同一气象匹配得到的环境条件。
- `smoke_discharge_nm3_h/smoke_temp_c`：焚烧厂烟气工况，不等于 SF6 示踪剂质量释放率。
- `tracer_mass_kg/release_duration_h/tracer_source_rate_g_s`：由 BTEX 元数据 Table 1 得到的 SF6 示踪剂真实释放质量、持续时间和换算源强。
- `sf6_pptv/log1p_sf6_pptv`：监督训练标签。

### Prairie Grass D6589 `datasets/raw/d6589/`

| 字段 | 内容 |
| --- | --- |
| 数据集 | Prairie Grass field experiment in HARMO/ASTM D6589 archive |
| 公开入口 | https://www.harmo.org/classic.php |
| 下载文件 | https://www.harmo.org/jsirwin/D6589Archive.zip |
| 下载日期 | 2026-06-18 |
| 本地压缩包 | `datasets/raw/d6589/D6589Archive.zip` |
| 本地解压目录 | `datasets/raw/d6589/archive/D6589/PrairieGrass/` |
| 原始观测文件 | `ASTMEvaluation/PGARCS.DAT`，Design2 input observed concentrations |
| 处理后弧线文件 | `ASTMEvaluation/PGSPLUS.DAT`，Design2 arc listing: `experiment, arc, xbar, xact, dphi, y, c/q` |
| 预处理脚本 | `python tools/prepare_prairie_grass_source_validation_data.py --write` |
| 处理输出 | `datasets/processed/prairie_grass/prairie_grass_arc_observations.csv` |
| 当前用途 | `python -m algorithm.inversion.validate_prairie_grass_source_inversion`，验证深度学习前向模型在真实外场弧线浓度上的源点位置溯源能力。 |
| 不得扩大解释 | 不能据此宣称已拥有本项目化工园区真实传感器训练数据，也不能宣称绝对浓度形状、事故全过程或所有危险气体均通过真实数据验证。 |

字段使用范围：

- `PGARCS.DAT` 提供原始观测浓度、实验日期/时间、释放率表头、释放高度。
- `PGSPLUS.DAT` 提供风对齐局地坐标：`xact` 为下风实际距离，`y` 为横风位置，`c/q` 为观测浓度除以释放率。
- 预处理脚本按同一实验/弧线的行序将两者合并，并输出 `c_over_q_abs_error` 检查 `PGSPLUS` 与 `PGARCS` 的换算一致性。

2026-06-18 溯源验证结果边界：

- 验证脚本使用项目同一个 `algorithm.inversion.forward_model.ForwardModel`，运行时为物理信息 PyTorch 深度代理模型加物理锚点，不回退到旧高斯模型。
- 搜索边界固定为 `x=[-100,100] m`、`y=[-150,150] m`，网格步长 5 m；报告中 `boundaryViolationCount=0`。
- 68 个真实实验全部参与验证；源点真值为 `(0,0)`；源点误差中位数 `45.0 m`，90 分位 `46.098 m`，最大 `100.499 m`，80 m 内比例 `0.955882`，边界命中 2 次。
- 因此位置溯源结论为 `limited_pass_location_only`：真实弧线几何上的源点定位通过当前阈值，但不是完整浓度重建通过。
- 浓度形状指标未达标：平均 `FAC2=0.304708`，低于当前 0.5 阈值；不能把该结果写成“真实浓度模拟精度已通过”。下一步若要提升真实性，应使用 D6589/Prairie Grass 继续做真实数据监督校准或引入更完整的气象条件。

## 接入流程

1. 明确验证目标：扩散模型、K 标定、溯源模型、路径规划、气体物性或气象边界。
2. 下载原始数据到未提交目录，例如 `datasets/raw/`，并记录来源 URL、下载日期、版本和许可证。
3. 编写预处理脚本，将清洗结果输出到 `datasets/processed/`，保留字段映射和单位换算说明。
4. 建立测试用例，记录输入参数、评价指标、误差、失败场景和适用边界。
5. 只提交小体积、脱敏、授权明确的数据样例；大体积原始数据用外部存储或下载脚本复现。

## 禁止事项

- 不得把合成数据写成真实实测数据。
- 不得提交未授权、未脱敏、来源不清的数据。
- 不得提交真实事故敏感数据、生产数据库导出或人员隐私数据。
- 不得只写“来自权威网站”，必须记录具体 URL、下载时间和处理脚本。
- 不得用大模型生成的数据冒充真实实验数据。
