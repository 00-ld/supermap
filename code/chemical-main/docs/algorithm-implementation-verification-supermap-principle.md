# 算法实现、可信性验证与 SuperMap 优先原则说明

本文档用于超图杯答辩和后续工程验收，回答三个问题：

1. 各个算法具体怎么做，代码入口在哪里。
2. 当前精度和验证结果是否可靠，哪些结论不能夸大。
3. 是否遵循“SuperMap 优先”原则，哪些能力由 SuperMap 承担，哪些由自研算法承担。

当前总口径：系统采用“二维 GIS 做计算引擎，三维场景做前台投影仪”的架构。SuperMap 承担空间数据、二维地图、三维场景、空间查询、缓冲区、叠加分析、网络分析和服务发布；Python 算法承担危险气体扩散、源项反演、粒子滤波/KDE、动态风险疏散兜底和 YOLO 人员识别。发布版坐标统一使用 `EPSG:4547 / CGCS2000_3GK_CM_114E`，经纬度备案使用 `EPSG:4490`，旧 `EPSG:-1000` 仅作为历史回滚和转换来源。

## 总体链路

```text
三维场景点击/业务事件
  -> 输出 CGCS2000 点、对象 ID、高程和业务参数
  -> 二维 iServer Data/Map/Network/Spatial Analyst 做空间查询与 GIS 算子
  -> Python FastAPI 做扩散、反演、KDE、动态疏散等自研计算
  -> 前端 iClient2D/iClient3D 渲染二维分析结果和三维云团/路径/概率地形
```

现阶段已经完成并验证的 SuperMap 基础：

| 项目 | 状态 |
| --- | --- |
| CGCS2000 二维 Data 服务 | 已发布并能按 `SmID/id`、CGCS2000 点查询 |
| CGCS2000 二维 Map 服务 | 已发布 `建筑单体校核图_CGCS2000` |
| 建筑、道路、出入口数据 | 已进入 iServer Data；建筑 29 条、道路 93 条、出入口 14 条 |
| 前端 SuperMap Data 查询与扩散叠加 | 已实现并可运行 |
| 园区 Network Analysis 服务 | 已发布园区 Transportation Analyst 服务，前端已配置优先调用；拓扑质量仍需 iDesktopX 继续校核 |
| CGCS2000 三维 S3M/Realspace | 未完成，旧三维缓存仍存在 `epsg:0` 问题 |
| iServer Spatial Analyst 叠加服务 | 未完成，当前扩散影响叠加是前端/iClient2D 风格的几何计算 |

## 算法清单

| 算法 | 主要用途 | 实现形式 | SuperMap 优先状态 | 当前可信性 |
| --- | --- | --- | --- | --- |
| 气体扩散模拟 | 生成浓度网格、传感器读数、风险区 | Python 深度学习代理 + 物理约束扩散 | SuperMap 承载设施/道路/风险区空间表达；扩散数值仍自研 | 工程回归通过；真实数据只验证了部分扩散宽度 |
| 粗搜索/解析溯源 | 从传感器浓度粗定位泄漏源 | Python 网格搜索 + 两阶段候选细化 | 候选区、传感器、设施应来自 SuperMap Data | 真实外场定位证据有限，不能宣称现场高精度 |
| 粒子滤波反演 + KDE | 输出源项概率分布、置信椭圆、概率地形 | Python 粒子滤波 + KDE 栅格 GeoJSON | KDE GeoJSON 由 SuperMap 三维叠加显示 | 合成真值验证通过，真实验证不足 |
| 疏散路径规划 | 根据道路、出口和风险区生成路线 | 优先 iServer Transportation Analyst；失败时 Python D* Lite | SuperMap 路径服务已接入，动态危险避让仍由 Python 兜底 | 工程测试通过，真实疏散验证不足 |
| YOLO 人员识别 | 巡检图片人员检测、事件定位 | Ultralytics YOLO 服务 | 识别结果落点进入 SuperMap 地图/三维场景 | 接口链路完整，缺少标注集 mAP 报告 |
| 扩散影响叠加 | 受影响建筑、阻断道路、候选出口 | 当前前端几何叠加；目标用 iServer Spatial Analyst | 尚未切到 iServer Spatial Analyst | 工程结果可解释，但不是正式空间分析服务结果 |

## 气体扩散模拟

### 代码入口

- 核心实现：`algorithm/diffusion/phase1_diffusion.py`
- 入口函数：`create_phase1_diffusion_simulation(payload)`
- API：`algorithm/api_server.py` 的 `POST /api/diffusion/simulate`
- 前端调用：`frontend/src/api/algorithm.ts`、`frontend/src/components/SuperMapSceneViewer.vue`

### 实现方式

扩散模型不是简单动画，而是按事故源、气体类型、风速、风向、稳定度、地图范围、建筑障碍和道路廊道生成时序浓度场。当前主链路使用深度学习气体响应代理模型，并用物理约束的平流扩散模型作为安全锚点：

- 气体参数由 `algorithm/planning/gas_catalog.py` 管理。
- 稳定度校验复用 `algorithm/diffusion/gaussian_plume.py` 的 Pasquill A-F 输入契约。
- 建筑障碍由 `build_hard_blockers`、`build_wake_obstacles` 参与扩散遮挡和尾流修正。
- 道路廊道由 `build_channel_segments` 参与通道效应修正。
- 输出包含帧序列、网格单元、传感器读数、峰值浓度、风险等级和元数据。

### 输入输出

输入主要包括：

- `sourcePoint` 或 `sourceFacilityId`
- `gasType`
- `windSpeed`
- `windDirection`
- `stabilityClass`
- `facilities`
- `roads`
- `sensors`
- `mapConfig`

输出主要包括：

- `frames[]`：每个时刻的浓度网格。
- `sensorSeries[]`：传感器时序读数。
- `peakConcentration`、`riskLevel`、`metadata`。
- 前端可将高浓度网格转成二维热力、风险区或三维云团。

### SuperMap 融合

SuperMap 优先点：

- 建筑、道路、出入口、传感器应优先来自 iServer Data。
- 二维地图负责风险区与道路、建筑的叠加查询。
- 三维场景只接收扩散结果并渲染云团/体块/等值面。

当前不足：

- 扩散数值本身不是 SuperMap 内置算法，这是项目自研创新部分。
- iServer Spatial Analyst 叠加尚未发布，当前扩散影响叠加仍在前端执行。

### 验证与可信边界

可复跑命令：

```powershell
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.diffusion.test_real_prairie_grass
uv run --no-sync python -m tests.test_forward_model
```

可信结论：

- 物理不变量检查可证明模型没有出现负浓度、非法输入未拦截、基本单调关系失效等明显错误。
- Prairie Grass 真实野外数据目前只验证横风向扩散宽度 `Sy (m)`，不能证明绝对浓度、复杂化工园区现场事故全过程或传感器真实链路。
- 合成解析测试能证明实现回归稳定，不能当成真实数据验证。

## 粗搜索与两阶段源项反演

### 代码入口

- 粗搜索：`algorithm/inversion/grid_search.py`
- 两阶段反演：`algorithm/inversion/source_inversion.py`
- API：`POST /api/inversion/coarse-search`、`POST /api/inversion/solve`

### 实现方式

粗搜索用候选网格遍历疑似源点，利用传感器浓度、风向、到达时间和浓度形态计算候选分数。两阶段反演先按候选区排序，再在候选区内做局部细化，输出泄漏源位置、释放强度、候选排序和置信范围。

核心函数：

- `run_coarse_search(payload)`
- `run_two_stage_inversion(dataset)`
- `rank_candidates(...)`
- `refine_candidate(...)`

### SuperMap 融合

SuperMap 优先点：

- 候选区应来自 SuperMap Data 的危险源、设施面、缓冲区或空间查询结果。
- 传感器点位应来自 iServer Data，而不是写死在前端。
- 反演结果返回后，用 SuperMap 二维专题图和三维实体高亮候选设施。

当前不足：

- 反演主计算是自研 Python，不属于 SuperMap 内置空间分析。
- 真实园区传感器数据尚未接入，当前主要用公开实验和合成观测验证。

### 验证与可信边界

可复跑命令：

```powershell
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
```

可信结论：

- Prairie Grass / ASTM D6589 数据可以支撑有限的源点几何定位验证。
- 浓度形状指标存在失败边界，不能宣称外场浓度反演已完全准确。
- 没有真实园区泄漏事故数据前，只能说“具备工程可复跑验证与公开数据有限验证”。

## 粒子滤波反演与 KDE 概率面

### 代码入口

- 核心实现：`algorithm/inversion/particle_filter.py`
- 入口函数：`run_particle_filter(...)`
- API 入口：`run_particle_filter_inversion_task(payload)`、`POST /api/inversion/particle-filter`
- KDE 输出：`build_particle_kde_geojson(...)`

### 实现方式

粒子滤波维护一组候选泄漏源粒子，每轮根据传感器观测、风场和前向扩散模型更新粒子权重，并对粒子进行重采样。输出包括：

- 最优源点估计。
- 释放强度估计。
- 粒子集合。
- 置信椭圆。
- KDE 概率面 GeoJSON。

KDE 规则：算法端必须先把离散粒子插值为规则栅格面，再交给前端。前端 iClient3D 接收的是带高程 Z 值的 GeoJSON 栅格面，用于叠加 S3M 地形形成“概率地形”。如果 KDE 来不及稳定展示，应只展示最终收敛的置信椭圆，不展示离散粒子过程。

### SuperMap 融合

SuperMap 优先点：

- 传感器、危险源候选区、建筑范围从 iServer Data 查询。
- KDE GeoJSON 使用 CGCS2000 XY，三维只负责抬高渲染。
- 置信椭圆和候选点作为 SuperMap 二维/三维专题图表达。

当前不足：

- KDE 是自研算法，不是 SuperMap 插值服务。
- 也可以后续将传感器浓度点交给 SuperMap 插值/等值线能力生成辅助浓度面，但这不替代粒子滤波概率估计。

### 验证与可信边界

可复跑命令：

```powershell
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
```

可信结论：

- 合成已知真值场景中，定位误差可做到米级到数米级，能证明代码链路和数值稳定性。
- Prairie Grass 真实数据部分验证可以作为有限外场证据。
- 不能写成“真实化工园区泄漏源反演精度已达到米级”，因为没有现场真值数据。

## 疏散路径规划

### 代码入口

- 核心实现：`algorithm/planning/dstar_lite.py`
- 单路线入口：`plan_evacuation_route(payload)`
- 多出口入口：`plan_evacuation_routes_by_building(payload)`
- API：`POST /api/planning/evacuation`
- 前端执行器：`frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts`

### 实现方式

正式设计是 SuperMap 优先：

1. 三维场景点击建筑或事故点，输出 CGCS2000 坐标。
2. 前端优先调用 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 指向的 iServer Network Analysis 服务。
3. iServer 使用道路网络数据集执行最短路、最近设施或网络分析。
4. 前端拿到二维坐标串后，给每个点赋固定 Z 值，例如离地 0.5 米，在三维场景渲染路径。
5. 当 Network Analysis 服务未发布或失败时，才调用 Python D* Lite 兜底。

Python D* Lite 兜底能力：

- 从道路线构建图。
- 将起点/出口投影到最近可通行道路。
- 用扩散浓度或阻断掩膜更新通行代价。
- 对多出口进行排序，输出推荐出口和路线。

### SuperMap 融合

SuperMap 优先点：

- 道路网络数据集和常规路径分析必须优先由 SuperMap/iServer 提供。
- Python D* Lite 的定位是“动态风险避让和服务不可用时的兜底”，不是主路径。

当前状态：

- 园区专用 Transportation Analyst 服务已发布并返回 200：`transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest`。
- `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 已配置到 `Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000` 的 `networkanalyst` 资源。
- 前端对单起点、多出口场景优先调用 SuperMap `path.rjson`，解析 `pathList/pathGuideItems` 得到 CGCS2000 路径点；调用前会把建筑中心点和出口点吸附到最近道路中心线，避免 iServer 报“点没有被捕捉”。
- 最新浏览器验证中，选中 `西北生产装置区` 后执行“扩散模拟 -> 当前建筑路径”，4 个园区出口的 `path.rjson` 请求均返回 200，页面显示 `规划成功`、`规划内核=SuperMap iServer Transportation Analyst`、推荐路线约 `204.8 m`。
- 批量建筑规划当前仍走 Python D* Lite，并且道路投影/危险屏蔽质量还不足，不能写成 SuperMap 批量疏散已经完成。
- 严格边界：当前可用服务使用 `Park_RoadNetwork_Auto_N`、`nodeIDField=SmID`、`autoCheckNetwork=false` 才能稳定启动。原 `Park_RoadNetwork_N` 在 iServer 自动检查中暴露节点 ID 重复问题，因此不能把当前服务写成已完成高质量路网拓扑验收。

### 验证与可信边界

可复跑命令：

```powershell
uv run --no-sync python -m algorithm.planning.test_dstar_lite
```

可信结论：

- 工程测试证明离路起点投影、出口投影、风险区避让、多出口排序等逻辑可运行。
- 当前可以证明 SuperMap iServer Transportation Analyst 服务可用并能返回 CGCS2000 路径线；但没有真实疏散演练记录，且路网拓扑仍需 iDesktopX 复核，不能宣称真实疏散路径已经完成权威验收。

## YOLO 人员识别

### 代码入口

- 核心服务：`algorithm/polo.py`
- API：`POST /api/analysis/person`
- 模型默认路径：`models/yolo11m.pt`
- 模型清单：`models/manifest.json`

### 实现方式

YOLO 服务使用 Ultralytics YOLO 加载人员检测模型，接口返回统一 JSON envelope，并包含：

- `schema = yolo-detection/v1`
- `modelId`
- `modelVersion`
- `configVersion`
- `requestId`
- 输入摘要和文件摘要
- bbox、confidence、class、frame metadata
- inference 耗时

生产环境通过 `ALGORITHM_API_KEY` / `X-API-Key` 鉴权，权重文件不提交仓库。

### SuperMap 融合

SuperMap 优先点：

- YOLO 不替代 GIS。
- YOLO 输出的人员事件点、巡检轨迹和告警位置应写入业务数据库，并同步到 SuperMap 二维/三维图层。

当前不足：

- 没有真实标注验证集和 mAP/precision/recall 报告。
- 不能写成模型识别精度已经完成比赛级验证。

## SuperMap Data 查询与扩散叠加

### 代码入口

- `frontend/src/views/smart_map/useSuperMapIserverData.ts`
- `loadSuperMapPlanningInputs()`
- `querySuperMapFeatureById(...)`
- `querySuperMapFeaturesAtPoint(...)`
- `analyzeSuperMapDiffusionImpact(...)`
- 验证脚本：`tools/supermap/verify-cgcs2000-data-overlay.mjs`

### 已验证能力

当前 CGCS2000 Data 服务可以：

- 按 `SmID/id` 查询建筑、道路、出入口。
- 按 CGCS2000 点和容差查询附近要素。
- 读取道路/建筑/出口后执行扩散影响叠加。

当前验证输出在：

- `G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\cgcs2000_data_query_overlay_validation.json`
- `G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\network_data_overlay_validation.md`

最新已知结果：

- 点 `E=458970.343, N=3855563.172`，容差 `35m`，命中 `6` 个要素。
- 扩散叠加得到 `12` 个受影响设施、`4` 条阻断道路、`12` 个候选出口。
- 执行器是 `iclient2d-overlay`，不是 iServer Spatial Analyst。

### 可信边界

这些结果证明 iServer Data 接入、CGCS2000 几何读取和工程叠加链路可用；但它还不是正式 iServer Spatial Analyst 叠加服务结果。最终答辩中应表述为“已完成 Data 服务查询与前端叠加验证，下一步切换到 iServer 空间分析服务”。

## 验证命令与当前结论

建议每次交付前从 `G:\竞赛\超图杯\code\chemical-main` 运行：

```powershell
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
uv run --no-sync python -m algorithm.planning.test_dstar_lite
uv run --no-sync python -m tests.test_forward_model
node tools/supermap/verify-cgcs2000-data-overlay.mjs
```

前端类型检查从 `G:\竞赛\超图杯\code\chemical-main\frontend` 运行：

```powershell
npm run typecheck:strict
```

已知最近一次验证结论：

| 验证项 | 最近状态 | 说明 |
| --- | --- | --- |
| 扩散物理不变量 | PASS | 工程回归通过 |
| 粒子滤波验证 | PASS | Prairie Grass Sy 有限验证 + 合成真值验证通过 |
| D* Lite 路径规划 | PASS | 工程回归通过 |
| Forward Model | PASS | 模块方式运行通过，直接脚本方式存在包路径问题 |
| SuperMap Data 查询/叠加 | PASS | Data 查询和前端叠加通过 |
| SuperMap 单建筑路径 | PASS | 前端运行时已调用 iServer Transportation Analyst，`path.rjson` 返回 200 |
| 前端严格类型检查 | PASS | 最近已通过，交付前需复跑 |

## 精度与可靠性总判断

可以对外说明：

- 系统已形成“SuperMap 空间底座 + 自研应急智能算法”的可运行工程链路。
- 扩散、反演、路径、YOLO 都有明确代码入口、API 入口、输入输出和可复跑验证命令。
- SuperMap Data/Map 已承载 CGCS2000 园区矢量数据，前端可以读取并参与算法输入。
- 粒子滤波已具备 KDE GeoJSON 概率面输出，适合三维概率地形表达。

不能对外夸大：

- 不能说每个算法都已经完成 5 次真实数据验证。
- 不能说真实化工园区现场精度已经验证。
- 可以说普通最短路已优先接入 SuperMap Transportation Analyst；不能说动态危险避让也由 SuperMap 完成，也不能说路网拓扑质量已经最终验收。
- 不能说三维 S3M 已完成 CGCS2000 坐标发布，除非新 Realspace 服务可访问且不再是 `epsg:0`。
- 不能说 YOLO 已有准确率指标，除非补充真实标注集和 mAP/precision/recall。

## 下一步高优先级清单

1. 按 CP0-CP5 重定位 S3M/SCP，发布 `3D-chemical_park_cgcs2000/rest/realspace`；当前该 URL 仍为 404，三维发布不能写成完成。
2. 在 iDesktopX 重新校核道路网络拓扑，修正原 `Park_RoadNetwork_N` 节点重复/转向检查问题，形成可开启 `autoCheckNetwork=true` 的最终网络数据集。
3. 将“全建筑路径”升级为 SuperMap 批量网络分析或最近设施分析；当前批量规划仍是 Python D* Lite 兜底。
4. 将扩散风险区与道路、建筑叠加从前端几何计算升级为 iServer Spatial Analyst 或明确标注为前端叠加。
5. 修复 iServer 中文属性乱码，保证截图和答辩展示字段可读。
6. 补真实验证数据：扩散至少增加公开外场数据集，YOLO 增加标注图片集，疏散增加真实道路/演练或权威基准。
