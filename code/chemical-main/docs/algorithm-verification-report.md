# 核心算法真实性验证报告

本文档对应 `docs/项目总体要求.md` 的 9.5 节，用来把“核心算法至少 5 次真实性验证”的验收口径映射到仓库中真实存在的数据、脚本、参数、结果和缺口。

当前结论：仓库已经具备若干真实公开实验数据验证，但尚未满足“每个核心算法 5 次真实数据验证”。仿真、解析公式和固定随机种子回归只能作为工程回归测试，不得写成真实数据验证。

## 验证口径

| 类别 | 可作为真实性验证 | 说明 |
| --- | --- | --- |
| 真实公开实验数据 | 是 | 必须记录来源、下载时间、版本或 DOI、预处理方法、指标结果和失败边界。 |
| 权威标准或公开资料约束 | 可作为辅助证据 | 例如 GB/T 布点规则、公开物性资料；不能替代模型输出的真实实验验证。 |
| 仿真数据、固定随机种子样本、解析公式生成数据 | 否 | 只能证明实现没有回归，不能证明真实世界有效。 |
| 页面手工构造、动画采样、fallback 结果 | 否 | 不能作为算法真实性证据。 |

## 数据来源状态

| 数据源 | 数据性质 | 当前仓库状态 | 可验证内容 | 不得扩大解释 |
| --- | --- | --- | --- | --- |
| Prairie Grass `PGrassOBSAnalysis.txt` | 真实野外扩散实验样本 | 已提交小样本，详见 `docs/dataset-sources.md` | 横风向扩散宽度 `Sy (m)` | 不能证明绝对浓度、事故全过程或园区现场传感器链路。 |
| Prairie Grass / ASTM D6589 archive | 真实野外扩散与溯源评估数据 | 本地下载并预处理，不提交大文件 | 源点几何定位、弧线浓度形状边界 | 当前浓度形状指标未达标，只能写成定位有限通过。 |
| BTEX / PANGAEA | 真实 SF6 示踪释放实验 | 本地下载并预处理，不提交大文件 | 小样本浓度响应校准、失败的源点定位检查 | 不能证明本项目 CO/NH3/CH4/O2 园区现场训练完成。 |
| `tests/` 目录 | 合成解析数据 | 已提交 | 扩散/溯源实现回归 | 不能作为真实数据验证。 |
| 前端动画和模拟读数 | 仿真/演示数据 | 已标注为 simulation | UI 链路演示和回归 | 不能作为硬件实测或真实监测链路。 |

## 核心算法证据矩阵

### 气体扩散模型

| 序号 | 证据 | 命令或文件 | 数据性质 | 当前结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| D-1 | Prairie Grass 横风向扩散宽度验证 | `python -m algorithm.diffusion.test_real_prairie_grass` | 真实野外实验 | 使用 FB/NMSE/FAC2 检查 `Sy (m)`，当前作为 CI/本地可复跑证据 | 真实数据验证，范围限于横风扩散宽度。 |
| D-2 | D6589 弧线浓度形状指标 | `python -m algorithm.inversion.validate_prairie_grass_source_inversion` | 真实野外实验 | 平均 FAC2 未达 0.5 阈值 | 真实数据失败边界，不能写成浓度精度已通过。 |
| D-3 | BTEX 浓度响应校准 | `python -m algorithm.deep_learning.validate_btex_real_data --epochs 700` | 真实 SF6 示踪实验 | 小样本校准改善部分浓度指标 | 真实数据有限证据，不代表园区现场数据训练。 |
| D-4 | 物理不变量和输入契约 | `python -m algorithm.diffusion.test_input_contract` | 公式/回归 | 拒绝未知气体、非法稳定度和坏数值 | 工程回归，不计入真实验证次数。 |
| D-5 | 合成扩散数据集回归 | `python tests/test_forward_model.py` | 合成解析数据 | 对高斯烟羽/烟团样例做 FAC2/FB/NMSE 检查 | 工程回归，不计入真实验证次数。 |

合规状态：未满足 5 次真实数据验证。当前有 1 项明确通过的真实扩散宽度证据、1 项真实浓度形状失败边界、1 项真实小样本校准证据，其余为回归测试。

### 源项反演与粒子滤波

| 序号 | 证据 | 命令或文件 | 数据性质 | 当前结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| I-1 | Prairie Grass / D6589 源点几何定位 | `python -m algorithm.inversion.validate_prairie_grass_source_inversion` | 真实野外实验 | 68 个实验；位置定位为 `limited_pass_location_only` | 真实数据有限通过，只覆盖风对齐坐标源点定位。 |
| I-2 | BTEX 源点定位检查 | `python -m algorithm.deep_learning.validate_btex_real_data --epochs 700` | 真实 SF6 示踪实验 | 未通过 500 m 检查 | 真实数据失败边界，不能宣称真实外场溯源已通过。 |
| I-3 | 粒子滤波已知真值场景 | `python -m algorithm.inversion.validate_particle_filter` | 合成观测 | 多风向、边界和高噪声场景通过 | 工程回归，不计入真实验证次数。 |
| I-4 | 多随机种子重复性 | `python -m algorithm.inversion.validate_particle_filter` | 合成观测 | 9000 粒子、24 轮迭代重复性检查 | 工程回归，不计入真实验证次数。 |
| I-5 | 候选区和观测输入契约 | `python -m algorithm.inversion.test_candidate_validation`、`python -m algorithm.inversion.test_observation_signal` | 合成/契约 | 空候选区、峰值信号、输入别名风险被覆盖 | 工程回归，不计入真实验证次数。 |

合规状态：未满足 5 次真实数据验证。当前只有 2 项真实公开实验证据，其中 1 项有限通过、1 项失败。

### 疏散路径规划

| 序号 | 证据 | 命令或文件 | 数据性质 | 当前结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| E-1 | D* Lite 离路入口/出口投影 | `python -m algorithm.planning.test_dstar_lite` | 构造路网 | 起点和出口投影到可通行道路边 | 工程回归，不计入真实验证次数。 |
| E-2 | 高风险区域剔除 | `python -m algorithm.tests.test_path_hazard_avoidance` | 构造浓度场 | 禁止通行区域不再仅降权通过 | 工程回归，不计入真实验证次数。 |
| E-3 | 旧链路失败不再 fallback 假路线 | `algorithm/planning/gas_diffusion_astar.py` 与前端结果判断 | 构造场景 | 主路径失败时暴露 blocked/空路径 | 工程回归，不计入真实验证次数。 |

合规状态：未满足 5 次真实数据验证。仓库尚无真实园区疏散演练、真实道路通行记录或公开疏散基准数据接入。

### YOLO11m 识别链路

| 序号 | 证据 | 命令或文件 | 数据性质 | 当前结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| V-1 | YOLO 服务接口和响应契约 | `algorithm/polo.py`、`backend/src/main/java/com/at/controller/ImageAnalysisController.java`、`frontend/src/views/yolo/Home.vue` | 工程契约 | 统一响应 envelope；返回 `yolo-detection/v1` 结构化目标、模型版本、`requestId`、输入摘要、运行耗时和可排错日志；部署默认鉴权 | 接口回归，不计入真实验证次数。 |
| V-2 | 识别记录入库链路 | `backend/src/main/java/com/at/controller/ImageAnalysisController.java`、`inspect_record` schema | 工程链路 | fresh DB 已有识别记录表 | 数据链路回归，不计入真实验证次数。 |
| V-3 | 模型版本治理入口 | `models/manifest.json` | 工程治理 | 已记录 `yolo11m-person-detector` 的 `modelId/modelVersion/artifactPath/validationStatus`，权重文件不提交 Git | 版本可追踪，不等同于真实识别精度验证。 |

合规状态：未满足 5 次真实数据验证。仓库已有模型版本 manifest，但尚无带标注的真实小车图片/视频验证集、mAP/precision/recall 报告或误检漏检边界。

### 传感器布点与监测数据链路

| 序号 | 证据 | 命令或文件 | 数据性质 | 当前结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| S-1 | 真实 DOM 点位 seed 校验 | `python tools/validate_real_sensor_layout.py` | 真实 DOM 资产 + GB/T 规则说明 | canonical seed 当前为 61 个点位 | 资产一致性验证，不等同于算法真实性 5 次验证。 |
| S-2 | 仿真监测读数入库 | `/api/simulation-monitoring/readings/*` | 仿真数据 | 只允许 `source=simulation`、`quality_status=SIMULATED` | 真实边界合规，不是硬件采集链路。 |

合规状态：未满足 5 次真实数据验证。当前没有硬件传感器连续采样数据。

## 缺口清单

| 优先级 | 缺口 | 下一步 |
| --- | --- | --- |
| P0 | 扩散模型缺少 5 组真实公开实验/现场样本验证 | 继续接入 HARMO classic 的 Kincaid、Round Hill 等数据，记录下载、预处理、指标和失败样例。 |
| P0 | 溯源算法真实验证次数不足 | 在 D6589/Prairie Grass 之外增加至少 3 个可复核真实或公开实验源定位数据集。 |
| P0 | 疏散路径规划没有真实或权威基准数据 | 引入真实园区道路拓扑、演练路径记录或公开疏散 benchmark；没有数据时只能写成算法回归。 |
| P0 | YOLO 没有真实标注验证集和精度报告 | 在现有 `models/manifest.json` 基础上补真实图片/视频样本清单、标注格式、mAP/precision/recall 报告。 |
| P1 | 真实监测链路仍是仿真读数 | 有硬件或真实采样文件前，接口、页面和文档必须继续标注 `simulation`。 |

## 执行建议

新增验证时必须同时补齐三件事：

1. 在 `docs/dataset-sources.md` 增加来源、许可证、下载日期、预处理和边界。
2. 在本文件追加对应矩阵行，并明确是真实验证、辅助证据还是回归测试。
3. 增加可复跑命令或输出报告；若结果失败，也要提交失败边界，不能只提交通过样例。
