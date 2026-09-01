# 三维落算法准确性修复清单（交付 Codex）

> 交付对象：Codex
> 生成时间：2026-07-18
> 生成者：Claude（基于真实代码核实，非推测）
> 修复原则：**如实说明，不夸大，不冒充已修复**。每条问题标注代码位置、事实依据、待核实边界、修复方向。Codex 修复后须在本文末尾"修复记录"回填实际改动与验证结果。

## 背景事实（已核实，可直接采信）

化工园区项目的架构是"**二维算、三维渲**"：

- 三维模型（S3M / 3D Tiles / Realspace）只负责可视化，**不含路网拓扑**。
- 路网、建筑、出入口是 iServer Data 服务里的二维矢量数据集，算法直接吃这份数据。
- 三维端把算法返回的坐标点过 `mapPointToSceneCartesian()` 投影到场景。

涉及文件：

- `frontend/src/data/supermapGeoreference.js` — 坐标转换公式
- `frontend/src/data/coordinate.js` — worldToGeo / geoToWorld 兼容层
- `frontend/src/data/supermapCupScenario.ts` — 算法 payload 构造、路径解析
- `frontend/src/views/smart_map/useSuperMapIserverData.ts` — iServer Data 路网识别
- `frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts` — 网络分析执行器
- `frontend/src/components/SuperMapSceneViewer.vue` — 三维落图
- `frontend/.env.development` / `frontend/.env.production` — 坐标模式开关

## 环境配置现状（已核实）

| 环境变量                                | dev                          | prod                            |
| --------------------------------------- | ---------------------------- | ------------------------------- |
| `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION` | `true`（球面 CGCS2000 模式） | `false`（本地 EPSG:0 S3M 模式） |
| `VITE_SUPERMAP_COORD_SYS`               | `CGCS2000_3GK_CM_114E`       | `CGCS2000_3GK_CM_114E`          |
| `VITE_SUPERMAP_EPSG`                    | `4547`                       | `4547`                          |
| `VITE_SUPERMAP_NETWORK_ANALYSIS_URL`    | 指向 `cgcs2000` 数据集       | 指向 `cgcs2000` 数据集          |

注意：dev 和 prod 的三维坐标模式不一致。dev 走球面，prod 走本地 S3M。这意味着同一份代码在两个环境下坐标系行为不同，验证必须在两个环境分别做。

---

## 修复清单

### F1. 算法 payload 坐标系标注与实际数据不一致（待核实后定级）

**代码位置**：`frontend/src/data/supermapCupScenario.ts:221-240` `buildSuperMapCupEvacuationPayload`

**事实**：

- `coordSys` 字段值为 `"CGCS2000_3GK_CM_114E / EPSG:4547"`（来自 `SUPERMAP_CUP_SCENARIO.coordinateSystem`，`:101`）。
- 但同函数内 `roads`（`:226`，来自 `realMapAssets.ts` 的 `roads` 经 `toAlgorithmRoad`）和 `startPoint`（`:228-231`，来自 `buildingEntrances.x/y`）的 x/y 是**本地坐标**（REAL_MAP 系，0.5 m/unit，原点 0,0）。
- 也就是说：payload 声明坐标是 CGCS2000 投影坐标，实际数据是本地米制坐标。

**待 Codex 核实**（不要直接当 bug 改，先查清后端契约）：

1. 后端 FastAPI（`runEvacuationPlanning`）收到这份 payload 后，是否用 `map.georeference` 把本地 x/y 转成 CGCS2000 再规划？还是直接当本地坐标用？
2. iServer `path.rjson` 那条链路（`useSmartMapAlgorithmExecutors.ts:124`）把这份**本地坐标**的 `startPoint` 直接发给 `cgcs2000` 数据集的网络分析服务——iServer 是否能识别？还是靠 `snapPointToRoad` 吸附后坐标恰好落在 cgcs2000 数据集范围内？

**修复方向（核实后二选一）**：

- 若后端依赖 `coordSys` 字段做转换：保持现状，但在 payload 里同时带上 `sourceCoordSys: PCS_NON_EARTH_LOCAL_METER`（`SUPERMAP_CUP_SCENARIO.map.sourceCoordSys` 已有此值，但未进 payload 顶层），让后端明确知道输入是本地系。
- 若后端直接当 CGCS2000 用：则 `roads`/`startPoint` 必须在构造 payload 时就通过 `localToProjected()` 转成 EPSG:4547 投影坐标，`coordSys` 才名副其实。

**验证方法**：修复后，对比一条已知路径的起点坐标。例如 `buildingEntrances[0]` 的本地 x/y 经 `localToProjected` 后应得 `E≈457xxx, N≈3855xxx`。若后端返回的路径点也是这个量级，说明后端用 CGCS2000；若后端返回的路径点仍是 0~1587 量级，说明后端用本地系。以这个判据决定修复方向。

**当前状态**：未修复，待 Codex 核实。

---

### F2. iServer 网络分析返回的路径坐标系未校验，可能被当本地坐标错误映射

**代码位置**：

- `frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts:344-380` `requestSuperMapPath` / `extractSuperMapPath`
- `frontend/src/data/supermapCupScenario.ts:269-276` `resolveRoutePath`
- `frontend/src/components/SuperMapSceneViewer.vue:1881` `drawEvacuationOverlay` → `mapPointToSceneCartesian`

**事实**：

- `requestSuperMapPath` 从 iServer `path.rjson` 取 `pathList[0]`，经 `extractSuperMapPath` 抽出 `{x, y}` 点序列，直接塞进 `AlgorithmRecord.path`。
- `resolveRoutePath` 把这些点当 `SuperMapCupMapPoint`（本地系）返回。
- `drawEvacuationOverlay` 把它们喂给 `mapPointToSceneCartesian`，按当前坐标模式（球面/本地/3D Tiles）投影。

**问题**：iServer 的 `cgcs2000` 网络分析服务返回的路径点**几乎肯定是 CGCS2000 投影坐标**（量级 E≈457xxx, N≈3855xxx），因为数据集本身就是 CGCS2000。但前端把它当本地坐标（量级 0~1587）处理：

- 在 dev 球面模式下，`mapPointToSceneCartesian` 走 `mapPointToGeo` → `localToProjected`，会把 CGCS2000 大数再叠一次锚点偏移，路径会飘到完全错误的位置。
- 在 prod 本地模式下，`mapPointToS3MLocal` 用 `point.x / map.width` 归一化，CGCS2000 大数会被 clamp 到边界，路径塌成一个点。

**待 Codex 核实**：

1. 实际跑一次 `/api` 疏散请求，打印 `result.path` 前三个点的 x/y 量级，确认是 CGCS2000（457xxx）还是本地（0~1587）。
2. 若是 CGCS2000：`resolveRoutePath` 或 `drawEvacuationOverlay` 需要先用 `projectedToLocal()` 把路径点转回本地系，再喂 `mapPointToSceneCartesian`。
3. 若是本地：说明 iServer 链路或后端已经做过转换，当前代码是对的，只需补注释说明。

**修复方向**：

- 在 `resolveRoutePath` 里加坐标量级探测：若 `path[0].x > 10000`，判定为投影坐标，先 `projectedToLocal` 再返回；否则按本地返回。或在 `SuperMapCupMapPoint` 之外定义 `projectedPoint` 字段，让来源显式标注坐标系，不要靠量级猜。
- 优先方案：让 iServer 执行器 `executeSuperMapNetworkAnalysis` 返回时就在 `result` 里带 `pathCoordSys: 'CGCS2000_4547'` 字段，`drawEvacuationOverlay` 按字段决定是否转换。

**验证方法**：修复后，三维场景里疏散路径应贴合道路模型，起点落在选定建筑门口、终点落在园区出口。截图对比修复前后。

**当前状态**：未修复，待 Codex 核实。这是影响"三维准确落算法"最直接的一条。

---

### F3. 路网识别丢失折线中间点，弯曲道路被拉直

**代码位置**：`frontend/src/views/smart_map/useSuperMapIserverData.ts:276-312` `roadRectFromLine`

**事实**：

- 函数从 `feature.geometry.points` 取**首尾两点**（`first = points[0]`，`last = points[points.length-1]`），中间所有折点丢弃。
- 据此判断横竖，生成一个矩形 `{x, y, w, h}`，渲染宽度固定 `ROAD_RENDER_WIDTH = 10`。

**问题**：

- 一条 L 形或弯曲道路会被压成首尾连线的直线矩形，路网形状失真。
- `snapPointToRoad`（见 F4）基于这个失真矩形做吸附，吸附点可能偏离真实道路。
- 影响扩散阻断判断（`analyzeSuperMapDiffusionImpact` 用 `roadRect` 做矩形相交）。

**待 Codex 核实**：

- `Park_RoadNetworkEdge_L` 数据集里道路 geometry 的 `points` 平均有几个折点？若是规则园区直路为主，影响小；若有较多弯道，影响大。先抽几条 feature 看看。

**修复方向**：

- `SuperMapRoadRect` 扩展为支持完整折线：新增 `points?: {x,y}[]` 字段，保留 `geometry.points` 全量。
- `roadRectFromLine` 仍可生成外接矩形供粗筛，但 `points` 字段必须保留。
- `snapPointToRoad`（F4）改用 `points` 做沿折线最近点投影。
- `analyzeSuperMapDiffusionImpact` 的 `blockedRoads` 判断从矩形相交改为折线缓冲区相交（折线 + 道路宽度做 buffer）。

**注意**：这是结构性改动，会影响 `SuperMapRoadRect` 类型下游所有使用方。Codex 须先全局搜 `SuperMapRoadRect` 引用点再改。

**验证方法**：修复后在二维 smart-map 页面观察道路渲染是否还原真实路形；扩散阻断的道路列表是否与浓度图覆盖的道路一致。

**当前状态**：未修复。

---

### F4. `snapPointToRoad` 用矩形中线投影，路口/弯道处吸附不合理

**代码位置**：`frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts:277-298` `snapPointToRoad`

**事实**：

- 遍历所有路矩形，按横/竖取中线，把待吸附点垂直投影到中线（`clamp(point.x, road.x, road.x+road.w)` 等），选距离最近的那条。
- 不考虑路宽、不考虑道路之间的连接关系、不做拓扑就近。

**问题**：

- 丁字路口、十字路口附近，建筑出口可能离两条路都近，吸附到非预期的那条。
- 环岛、弯道处投影点可能落在道路延长线上的虚拟位置（因为 F3 把弯道拉直了）。
- iServer 网络分析要求起点终点必须落在网络边或节点上，吸附不准会导致 iServer 返回"不可达"或绕远路。

**修复方向**（依赖 F3 先做完）：

- 改用折线最近点算法：对每条路的 `points` 折线，遍历相邻点对，求待吸附点到每段线段的最近点，取全局最近的作为吸附点。
- 若 F3 未做，此条先不动——因为当前矩形数据不足以支持折线投影。

**验证方法**：修复后，对几个已知建筑出口做吸附，打印吸附点坐标，与真实路网图比对是否落在合理道路上。

**当前状态**：未修复，依赖 F3。

---

### F5. dev/prod 三维坐标模式不一致，验证盲区

**代码位置**：`frontend/.env.development:20` 与 `frontend/.env.production:18`

**事实**：

- dev `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION = true` → 球面 CGCS2000 模式，globe 显示，相机走经纬度。
- prod `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION = false` → 本地 EPSG:0 S3M 模式，globe 隐藏，相机走本地坐标 + 520 ms 护栏轮询。
- `mapPointToSceneCartesian`、`addEllipseEntity`、`mapDistanceToSceneMeters` 都按此开关分叉两套实现。

**问题**：

- 开发时在 dev 验证通过的路径落图，到 prod 可能错位（反之亦然）。
- F1/F2 的坐标 bug 在两个模式下表现不同：球面模式下 CGCS2000 大数会叠加锚点偏移彻底飘掉；本地模式下会被 clamp 塌成一点。症状不同，容易漏修。

**修复方向**：

- 不改代码，改验证流程：Codex 修复 F1/F2/F3/F4 后，必须在 dev 和 prod 两个环境分别跑一次疏散演示，截图对比路径是否贴合模型。
- 若 prod 的本地 S3M 模式因 Realspace 未发布（`3D-chemical_park_cgcs2000/rest/realspace` 仍 404）而无法验证，须在本文记录"prod 环境验证阻塞，仅 dev 验证通过"，不要冒充双环境通过。

**当前状态**：未修复（流程问题，非代码问题）。

---

### F6. iServer 路网拓扑质量未复核，可能算出穿墙/逆行路径

**代码位置**：`frontend/.env.production:34` / `.env.development:37` 的 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 指向 `Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000`。

**事实**（来自 `docs/supermap-algorithm-2d-compute-3d-visualization-plan.md` 第 8 节）：

- 当前可用数据集为 `Park_RoadNetwork_Auto_N`，**关闭了自动网络检查**。
- 路网拓扑质量仍需 iDesktopX 复核。

**问题**：

- iServer 可能在拓扑残缺的路网上算出穿墙、逆行、断头的路径，前端无任何校验直接渲染，看起来"路径贴合道路"实则违规。

**修复方向**（前端能做的有限，主要是加校验）：

- 在 `drawEvacuationOverlay` 渲染前，对返回的 path 做一次"路径是否落在道路缓冲区内"的校验：用 F3 的折线路网 + 道路宽度做 buffer，检查 path 每个点是否在 buffer 内。飘出 buffer 的点标记 `pathAnomaly: true`，在三维上用红色虚线或警告标签提示，不要静默渲染成"看起来正确"的路径。

**待 Codex 核实**：

- 路网拓扑复核是 iDesktopX 任务，非前端代码任务。Codex 只负责加前端校验，不要冒充拓扑已修复。

**当前状态**：未修复，前端校验待加，拓扑复核阻塞于 iDesktopX。

---

### F7. 批量"全建筑路径"仍走 Python D\* Lite，非 SuperMap 网络分析

**事实**（来自 `docs/supermap-algorithm-2d-compute-3d-visualization-plan.md` 第 8 节）：

- `/smart-map` 单建筑疏散已验证走 SuperMap iServer Transportation Analyst。
- 批量"全建筑路径"仍走 Python D\* Lite，**不能写成已完成 SuperMap 批量网络分析**。

**修复方向**：

- 若赛项要求批量规划，Codex 须实现批量调用 iServer `path.rjson`（并发请求所有建筑出口），并在证据卡里标注 `planner: SuperMap iServer Transportation Analyst`。
- 若不做批量，本文如实记录"批量场景仍为 Python 兜底"，不要在报告里写 SuperMap 批量已完成。

**当前状态**：未修复，待决定是否实现批量。

---

## 修复优先级

| 编号 | 优先级 | 理由                                           |
| ---- | ------ | ---------------------------------------------- |
| F2   | P0     | 直接决定路径在三维里落得对不对，评委一眼能看出 |
| F1   | P0     | F2 的上游，payload 坐标系不定，F2 无法修对     |
| F3   | P1     | 路网形状保真，影响吸附和阻断判断               |
| F4   | P1     | 依赖 F3，吸附精度                              |
| F5   | P1     | 验证流程，非代码，但必须执行                   |
| F6   | P2     | 前端校验兜底，拓扑本身是 iDesktopX 阻塞        |
| F7   | P2     | 看赛项是否要求批量                             |

建议顺序：F1 核实 → F2 核实+修复 → F3 → F4 → 双环境验证（F5）→ F6 校验 → F7 按需。

---

## 修复记录（Codex 回填）

> Codex 每完成一条，在对应条目下回填：实际改了哪些文件/行、改前改后差异、验证结果（附命令或截图描述）、是否双环境通过、是否仍阻塞。未做的不要填"已完成"。

### F1 - 已修复（方案 A，标注层） - 2026-07-18

**根因（已核实，附证据）**：

- 顶层 `coordSys` 字段标 `CGCS2000_3GK_CM_114E / EPSG:4547`（`frontend/src/data/supermapCupScenario.ts:237`，值来自 `:101` `SUPERMAP_CUP_SCENARIO.coordinateSystem`）。
- 但同函数内 `roads`（`:226`，来自 `realMapAssets.ts` 经 `toAlgorithmRoad` `:465-474` 仅透传不转换）、`startPoint`（`:228-231`，来自 `buildingEntrances.x/y`）、`parkEntrances` 全部是 **0~1587 量级本地米制坐标**（`realMapAssets.js:48-64/:23/:100-105`，0.5 m/unit，原点 0,0）。
- payload 同时带 `map.sourceCoordSys = "PCS_NON_EARTH_LOCAL_METER"`（`supermapCupScenario.ts:121`），如实声明真实来源系——但该值未进 payload 顶层，顶层只暴露了错误的 `coordSys`。
- **Python 算法服务全目录 grep `coordSys|sourceCoordSys|CGCS2000|PCS_NON_EARTH|localToProjected` 零匹配**（见 `docs/f1-f2-investigation/01-payload-builder.md` 第 6 节）。`dstar_lite.py:118-160` 直接取 `startPoint`/`parkEntrances`/`roads` 的 x/y 建图，`resolve_map_meters_per_unit`（`:156-160`）只读 `mapMetersPerUnit`，不读 `coordSys`。
- `build_route_result`（`dstar_lite.py:644-690`）path 点来自 `graph.nodes`（本地系）和 `start_access.roadPoint`（本地系），**输出本地米制 path**。

**根因判定**：字段语义错配——顶层 `coordSys` 标 CGCS2000，实际数据是本地米制。矛盾属实，但 Python 服务不读 coordSys，在本地系内自洽建图、输出本地系 path，**当前不会因 F1 矛盾算错路径**。风险是误导性：若下游按字面信任顶层 `coordSys`，把 0~1587 当 46 万级投影值叠加外部 GIS 数据，会错位三个数量级。当前无此下游。

**改动文件**：`frontend/src/data/supermapCupScenario.ts`

**改动点**（方案 A：新增 `sourceCoordSys` 标注字段，保留原 `coordSys` 不动）：

1. `:121` `SUPERMAP_CUP_SCENARIO.map` 配置块（已有 `sourceCoordSys`，确认保留）。
2. `:174` `buildSuperMapCupDiffusionPayload` 顶层。
3. `:210` `buildSuperMapCupParticlePayload.scenario` 块。
4. `:250` `buildSuperMapCupEvacuationPayload` 顶层（F1 原任务点）。

**字段值**：`sourceCoordSys = 'PCS_NON_EARTH_LOCAL_METER'`（来自 `supermapGeoreference.js:1` `SUPERMAP_LOCAL_COORD_SYS`）。

**类型安全**：`AlgorithmPayload = Record<string, unknown>`（`algorithm.ts:6`），类型松散，加字段零副作用，vue-tsc 不报错。

**零副作用证据**：

- Python `dstar_lite.py` grep `coordSys|sourceCoordSys` 零匹配（不读此字段）。
- 前端执行器 `useSmartMapAlgorithmExecutors.ts` 不读此字段。
- payload 数据（`roads`/`startPoint`/`sensors` 的 x/y）未动，仍是本地米制 0~1587。
- **未选方案 B**（构造时 `localToProjected` 转投影）：会破坏 Python dstar_lite 的本地系建图逻辑（`dstar_lite.py:644-690`），代价大、收益为零。

**验证方法**：

- 改后 grep 确认 `sourceCoordSys` 字段已注入到 4 个 payload 构造点、import 完好（已做）。
- 未跑实际 Python 疏散请求验证（F1 只影响标注，不影响渲染/算法）——但已 grep 确认字段注入 + import 完好。
- 不需要双环境验证（F1 只影响标注，不影响渲染）。

**当前状态**：F1 已修复（标注层，零风险）。**注意：只是消除了字段语义矛盾（新增 `sourceCoordSys` 声明输入为本地系），未改变实际坐标系，未验证路径渲染。不等于"坐标系已对齐"，不等于"路径已验证"。** F2 的四位置错位（A/B/D）仍未解决。

---

### F2 - 代码完成（D 锚点 + 全局锚点 B→A），待三维场景验证 - 2026-07-18

**决策文档**：`docs/f1-f2-investigation/09-f2-decision-final-and-iserver-republish-spec.md`（完整规格，本条引用之）

**四个位置错位（根因，已核实）**：

| 代号  | 经度           | 纬度         | CGCS2000 投影 (E,N)                        | 来源                                                                                                                 | 状态                                                                                   |
| ----- | -------------- | ------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **A** | **113.569463** | **34.76965** | **(460587.110, 3849122.673)** 手算精确值   | `tileset_open_parcel_57083.json` + `SuperMapSceneViewer.vue:424/456` DEFAULT_CAMERA 与 threeTilesGeoreference.anchor | **用户确认的正确锚点**（看模型与底图/地形贴合定的，3D Tiles 模型实际锚定位置，不能搬） |
| B     | 113.6650       | 34.7178      | (469313.780, 3843337.292)                  | env `ANCHOR_WGS84`/`LAYER_POSITION` + `ZHENGZHOU_STATION_57083` + `supermapGeoreference.js:22-31`                    | 当前前端算法坐标系锚点（57083 气象站，**错误**）                                       |
| D     | 113.53946      | 34.83165     | **(457752.343, 3856009.172)** iServer 实测 | iServer feature `LONGITUDE/LATITUDE` + `geometry.points`（见 `07-iserver-live-probe.md`）                            | iServer 路网数据集真实位置（HAUT 莲花南门，旧数据）                                    |

**纠正先前近似错误**：08 文档第 2 节平面近似给出 A 投影 ≈(460630, 3870557)——**northing 错约 1.4 万米**。34.76965 纬度对应 northing 应是 384 万级（北纬 34°→ 3850000 附近，纬度越低 northing 越小），不是 387 万。手算精确值 **E=460587.110, N=3849122.673** 才对（高斯-克吕格正算，D 点反算校核误差 dE=0.8m/dN=3.5m，米级精度）。本条先前回填的 "(460630, 3870557) 近似" 已作废，以 09 文档第 2.2 节精确值为准。

**距离关系（精确值）**：

- A vs D：dE=+2715.767m, dN=-6886.499m，平面 7402.7m ≈ 7.4km（iServer 路网在三维模型西南方）
- A vs B：约 10.5 km（57083 气象站在三维模型东南方）
- B vs D：约 17 km

**决定性新证据（08 文档之后补全，见 09 文档第 1 节）**：

1. **iServer 全量 93 条 edge 实测**：LOCALMAPX 范围 [119.0, 1407.1]，LOCALMAPY 范围 [118.0, 818.1]，全部 93 条 ANCHOR = `HAUT_Lianhua_SouthGate_CP0`（单一锚点，无混杂），15 条 ROADID **与 `realMapAssets.js:48-64` 的 15 条 road-xxx 完全一致** → **iServer LOCALMAP 系 = realMapAssets 本地系同源，都锚定 D**（iServer LOCALMAP 范围是 realMapAssets [0,1587]×[0,947] 的内子集，路网不画到地图最边缘留出建筑/出入口空间）。
2. **A 点精确投影手算**：E=460587.110, N=3849122.673（高斯-克吕格正算）。D 点反算校核误差 dE=0.8m/dN=3.5m（米级精度，对园区尺度 1.3km×0.7km 足够精确）。
3. **矢量数据层整体锚定在 D**：realMapAssets 路网 + iServer 数据集 = 同一份描述 D（HAUT 莲花南门）园区的矢量数据。园区地理范围 lon 113.539~113.554, lat 34.826~34.833，宽约 1.3km×0.7km。3D Tiles 模型锚在 A，与 D 园区中心差 7.4km。

**用户决策（09 文档 3.1）**：走"搬矢量到 A"（路 3）。用户确认 A 锚点是看模型与底图/地形贴合定的 → 3D 模型真实地理范围在 A，不能搬。故保持模型在 A，把矢量数据（iServer 数据集 + realMapAssets 锚点）从 D 平移到 A 对齐。

**两条链路修复时序（09 文档 3.2，关键）**：

| 链路                                                     | 当前锚点          | 改后锚点                  | 修复后状态                         | 阻塞项                                  |
| -------------------------------------------------------- | ----------------- | ------------------------- | ---------------------------------- | --------------------------------------- |
| Python D\*Lite（本地系 path → mapPointToGeo → 三维落图） | B(469313/3843337) | A(460587.110/3849122.673) | 改锚点后立即对齐三维模型           | 无，立即可做                            |
| iServer（D 系投影 path → projectedToLocal → 三维落图）   | B(469313/3843337) | A(460587.110/3849122.673) | 需 iServer 数据集先从 D 重发布到 A | **iServer 重发布（codex + iDesktopX）** |

**陷阱（09 文档 3.3，已论证）**：iServer 链路在数据集重发布到 A 之前，**无论用 B 还是 A 锚点 projectedToLocal 都算出负几万本地坐标，三维落图都塌**：

- 当前锚点 B(469313/3843337)：`projectedToLocal(457871, 3856009)` = (-22884, -25344) → 负几万，塌陷
- 若改锚点 A(460587/3849122)：`projectedToLocal(457871, 3856009)` = (-5432, -13774) → 仍负，仍塌
- **不能直接全局改锚点 B→A**，否则 iServer 链路从"塌得离谱"变"塌得没那么离谱但仍是错的"，违反"不夸大一致性"红线。
- 不走双锚点分离方案（09 文档 3.5）：虽理论上可让 Python 用 A、iServer 暂用 D，但引入两套锚点常量、iServer 链路仍塌、重发布后还要改回单锚点，代码复杂度上升且重复改动。结论：一步到位等 iServer 重发布，统一改锚点。

**正确执行顺序（09 文档 3.4）**：

1. **先让 codex 把 iServer 数据集从 D 平移到 A 重发布**（见下"iServer 重发布规格"）
2. iServer 重发布完成后，**统一改前端锚点 B→A**（`supermapGeoreference.js:12-31` + `.env.development`/`.env.production`，见 09 文档第 5 节）
3. 改完跑三维落图验证（见 09 文档第 6 节）——用户强调"封装好的算法三维落图很关键要谨慎"

**iServer 重发布规格（送 codex，09 文档第 4 节）**：

- 任务：把 iServer 数据集 `chemical_park_vectors_cgcs2000`（含 `Park_RoadNetworkEdge_L` 93 条 edge、`Park_EntrancePoint_P` 14 个 entrance）的几何坐标从 D 系平移到 A 系。
- 平移量（精确）：`dE = +2715.767 m`（easting 全部加 2715.767），`dN = -6886.499 m`（northing 全部减 6886.499）。
- 需更新字段（每条 feature）：`geometry.points[].x/y`、`CGCS2000E/N`、`LONGITUDE/LATITUDE`（重算）、`ANCHOR`（改为 A 锚点名如 `ChemicalPark_3DTiles_Anchor_A`）、`S3MX/S3MY`（若 3D 场景用 S3M 本地系需重算）。
- **LOCALMAPX/Y 不变**（本地系相对坐标不变）。
- 数据集 `prjCoordSys` 应仍为 EPSG:4547（坐标系不变，只是几何平移），保留原数据集名 `chemical_park_vectors_cgcs2000`（前端 .env 的 `NETWORK_ANALYSIS_URL` 不用改）。
- Codex 执行方式：用 iDesktopX 打开数据集对 geometry 做整体平移，或用 iServer 数据编辑 API 批量更新 feature geometry；LONGITUDE/LATITUDE 用 iDesktopX "坐标转换"功能从新 CGCS2000E/N 反算。
- 重发布后验证：curl 取 feature 0-2-0 确认 geometry.points[0].x 在 460468 量级（A 系）、ANCHOR 字段已改、LOCALMAPX/Y 范围仍 [119,1407]×[118,818]（不变）。

**前端锚点改动规格（iServer 重发布后执行，09 文档第 5 节）**：

- `supermapGeoreference.js:12-31`：`SUPERMAP_CGCS2000_ANCHOR.projected` 改为 `{easting: 460587.110, northing: 3849122.673}`，`wgs84` 改为 `{longitude: 113.569463, latitude: 34.76965}`，`altitude: 8.0`，`label` 改为 '化工园区 3D Tiles 模型锚点 A'；`ZHENGZHOU_STATION_57083` 改名为 `CHEMICAL_PARK_3DTILES_ANCHOR`。
- `.env.development`/`.env.production`：`VITE_SUPERMAP_ANCHOR_WGS84`=`113.569463,34.76965`、`VITE_SUPERMAP_ANCHOR_CGCS2000`=`460587.110,3849122.673`、`VITE_SUPERMAP_3D_LAYER_POSITION`=`113.569463,34.76965,8`、`VITE_SUPERMAP_CP0_LONGITUDE/LATITUDE`=`113.569463`/`34.76965`。
- `controlPoints`（`supermapGeoreference.js:47-54`）：CP0 描述改"3D Tiles 模型锚点 A"，CP1-5 的 projected 值会因锚点改变自动重算。

**三维落图验证方法（iServer 重发布 + 前端改锚点后，09 文档第 6 节，用户强调谨慎）**：

1. **Python D\*Lite 链路**：触发 `runEvacuationDemo`；在 `drawEvacuationOverlay` 入口打印 path[0] 本地坐标（应 0~1587 量级）；在 `mapPointToSceneCartesian` threeTiles 分支打印 path[0] 经 `mapPointToGeo` 后的经纬度（应 ≈113.569/34.770 量级，A 系）；截图三维场景确认起点落建筑门口、终点落园区出口、路径贴合路网。
2. **iServer 链路**：触发 `runSuperMapNetworkEvacuation`；在 `extractSuperMapPath`（`useSmartMapAlgorithmExecutors.ts:399`）打印 iServer 返回 path[0]（应 A 系投影 460xxx/3849xxx 量级）；在 `SuperMapSceneViewer.vue:1476` `projectedToLocal` 前后打印（前：460xxx/3849xxx；后：0~1587 量级）；截图三维场景确认路径与 Python 链路落图一致。
3. **落图正确性判据**：起点经纬度 ∈ A 园区范围（lon 113.566~113.572, lat 34.767~34.772）；终点落在园区出口（park-south/park-east，realMapAssets 本地坐标 (1218,682)/(1228,684)）；路径不塌成单点、不飘到南极大西洋（07 报告第 4 节塌陷症状消除）；路径贴合路网（在 road-north-main 等 15 条路上）。**不凭截图主观判断"看起来对了"，严格按量级判据。**

**iServer 数据集实锤（见 `07-iserver-live-probe.md`）**：

- 数据集 `prjCoordSys`：`epsgCode=4547`，`type=PCS_CHINA_2000_3_DEGREE_GK_38N`，中央经线 114E，falseEasting=500000。
- edge-01 `geometry.points`：`[{x:457752.343,y:3856009.172},{x:457990.343,y:3856009.172}]`。
- feature `ANCHOR` 字段 = `HAUT_Lianhua_SouthGate_CP0`（河南工业大学莲花校区南门）。
- 前端把锚点标成"郑州 57083 气象站"是**错误的地理标识**，真实园区在 HAUT 莲花南门附近。
- 前端本地系与 iServer LOCALMAPX/Y **同源**（09 文档新证据，修正先前"两套不同本地系"的判断）——都锚定 D，LOCALMAP 范围是 realMapAssets 的内子集。

**方向调整（09 文档第 8-9 节，2026-07-18）**：从原计划"路 A iServer 重发布"改为"路 B 前端双锚点"。原因：

1. **iServer path.rjson 实测能跑通**——用 D 系投影节点请求成功返回路径，**推翻 07 报告 502 判断**（07 报告第 5 节"待进一步核实"path.rjson 502，现已验证可跑通）。
2. **iServer 数据服务不可在线编辑**（PUT feature/0-2-0.rjson 返回 405 "当前数据服务不可编辑"，GET 能读但 PUT 写不了）——路 A 必须 iDesktopX GUI 操作（codex 额度紧张）。
3. **路 B 纯前端代码可回退**，省 codex 额度，iServer 数据不动。

**已落地（路 B 第一步：iServer 链路 D 锚点改造，类型检查通过，见 09 文档第 9.1 节）**：

改动文件：

- `frontend/src/data/supermapGeoreference.js`：新增 `SUPERMAP_ISERVER_DATA_ANCHOR` 常量（D 锚点 projected=457692.843/3856127.172，反推自 edge-01 LOCALMAP(119,236) ↔ projected(457752.343,3856009.172)）+ `localToProjectedD`/`projectedToLocalD` 双锚点转换函数。
- `frontend/src/data/js-module-shims.d.ts:111-122`：补 D 锚点常量与函数类型声明。
- `frontend/src/components/SuperMapSceneViewer.vue`：
  - `:164-169` import `localToProjectedD`/`projectedToLocalD`。
  - `:1621-1630` `projectPoint` 改用 `localToProjectedD`（iServer 链路专用 D 锚点正变换）。
  - `:1478/1487` `runSuperMapNetworkEvacuation` 的 `projectedToLocal` → `projectedToLocalD`（iServer path D 锚点逆变换）。
  - `:1520/1529` `runSuperMapClosestDeviceAnalysis` 同上。

**数值验证（路 B 全链路，已通过）**：

```
iServer D系path(457752,3856009)
  → D锚点逆变换 projectedToLocalD → 本地(119,236) [IN range 0~1587，=iServer LOCALMAP字段值，证明反推正确]
  → (待)全局A锚点正变换 localToProjected → A投影(460646,3849004) [A三维模型范围]
```

对比当前 B 锚点逆变换同一 path 点 → 本地 `(-23122,-25343)` 塌成负几万（07 报告第 4 节实证的崩塌）。D 锚点逆变换后本地坐标落在 [0,1587] 范围且等于 iServer LOCALMAP 字段值，证明反推正确。

**类型检查**：vue-tsc 通过（D 锚点相关零错误）。剩余 `screen/index.vue` `SensorPlacementPayload` 错误是既有问题（`MonitoringSensorModelId` 类型冲突，非本次引入）。

**非 iServer 链路保持 B 锚点未动**（`SuperMapSceneViewer.vue:2767/2884/2968/3002` `projectedToLocal` 调用，交互落图），未受影响。

**已执行（F2 最后一块：全局锚点 B→A，2026-07-18 完成）**：

改动文件：`frontend/src/data/supermapGeoreference.js:22-31`

- `SUPERMAP_CGCS2000_ANCHOR` 值从 B(57083) 改为 A：
  - `projected: {easting: 460587.110, northing: 3849122.673}`
  - `wgs84: {longitude: 113.569463, latitude: 34.76965}`
  - `altitude: 8.0`，`label` 改为 '化工园区 3D Tiles 模型锚点 A'
- CP0 描述更新为"3D Tiles 模型锚点 A"。
- `ZHENGZHOU_STATION_57083` 保留（`gisAnchorLabel` 非 3D Tiles 分支用）。
- env 的 `VITE_SUPERMAP_ANCHOR_*` 是死配置（grep 确认无代码读），不用改。

**为什么必须改（已验证）**：iServer path 经 D 锚点逆变换回本地系（正确），但落三维走 `mapPointToSceneCartesian` → `mapPointToGeo`（用全局 B 锚点）会把本地系映射到 B 经纬度（57083），落图到 B 而非 A 三维模型。**全局锚点 B→A 改完后，iServer path 经 D 逆 → 本地系 → A 正变换 → A 经纬度，落图到 A 三维模型**。

**数值验证（node 实跑通过）**：

- 本地原点 (0,0) → A 投影 (460587.11, 3849122.673) → A 经纬度 (113.569463, 34.76965) ✓ 落在 A 模型范围。
- 路 B 全链路：iServer path(457752, 3856009) → D 逆本地(119, 236) → A 投影(460646, 3849004) → A 经纬度(113.570, 34.769)。
- 路径纬度 34.769 不变、经度 113.570→113.574 递增 = 东西向水平路径，与 road-north-main 形状一致 ✓。

**类型检查**：vue-tsc 通过（零新增错误，`screen/index.vue` 既有错误已过滤）。

**projectedToWgs84 平面近似评估**：本地系范围 0~793.6 米，平面近似（111320 m/°）误差 <0.01m，够用不改（先前担心的 7km 偏移误差是针对 A↔D 整体平移，但 `projectedToWgs84` 只在本地系小范围内用，不影响）。

**F2 整体状态**：代码改动完成（iServer 链路 D 锚点 + 全局锚点 B→A），数值验证通过（node 实跑），类型检查通过（vue-tsc），量级探针已加。**待三维场景实际请求验证（dev server 实跑 + console 日志 + 截图，走 codex 兜底通道）**。

**量级验证探针（2026-07-18 已加，临时调试代码，验证通过后删除）**：
三处探针均带 `[F2]` 前缀便于 console 筛选。

1. `frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts` 的 `extractSuperMapPath`（约 :399）新增 `logF2Probe(tag, path)`，在 route 分支和 guides 分支返回前各打一次 iServer 原始 path 首尾点。**预期量级**：x∈[457600,457900]，y∈[3856000,3856300]（D 锚点 457692.843/3856127.172 邻域）。若落 A 系（460xxx/3849xxx）说明 iServer 数据集已重发布或锚点判断错。
2. `frontend/src/components/SuperMapSceneViewer.vue` 的 `runSuperMapNetworkEvacuation`（约 :1480，D 逆变换后）打 projectedPath 和 localPath 首尾点。**预期**：projectedPath 落 D 系（457xxx/3856xxx），localPath 落本地系 [0,1587]×[0,947]。
3. `SuperMapSceneViewer.vue` 的 `drawEvacuationOverlay`（约 :1908，落三维前）打真实渲染链路中间值：`mapPointToS3MLocal` 输出（S3M 本地坐标）+ `threeTilesMapPointToEcef` 输出（ECEF）+ `georefTransformLen`。**预期**：s3mLocal.x∈[LOCAL_S3M_BOUNDS.left, right]、y∈[bottom, top]；ECEF 量级 1e6~1e7；transformLen=16（确认 tileset.root.transform 加载成功）。**注**：探针 3 已修正——之前错用 `localToProjected`（A 锚点）打 A 投影，验证的是渲染中不走的链路；现改为打真实渲染链路（详见下文"F2 渲染链路认知修正"段）。

**待验证步骤（三维场景实际请求验证，待执行）**：

1. 起 dev server：`cd frontend && npm run dev`（Node 25 绕 check:node，见 [[chemical-park-local-run-env]]）。
2. 确保 iServer 可达：外部入口 `https://www.chemgas.lab6119.xyz`（`.env.development:11`），18090 是容器内部端口（非本机直连）。curl `https://www.chemgas.lab6119.xyz/iserver/services.json` 确认 200。SSH 凭据在 `E:/ObsidianLearningGraph/80_Vault/Passwords.md`。
3. 浏览器打开 smart_map 页，点「当前建筑路径」按钮（`SmartMapEmergencyScenarioPanel.vue:176`，`@run-evacuation`，单建筑走 SuperMap 链路）。**不要点「全建筑路径」（:179，批量走 Python 兜底，非本次验证目标）**。
4. 看 console 三条 `[F2]` 日志，按上述预期量级核对：
   - 探针 1：iServer 原始 path 首尾点落 D 系（457xxx/3856xxx）✓
   - 探针 2：localPath 落 [0,1587]×[0,947]✓
   - 探针 3：s3mLocal 落 LOCAL_S3M_BOUNDS + ECEF 量级 1e6~1e7 + transformLen=16 ✓
5. 完整可执行脚本见 `docs/f1-f2-investigation/11-f2-codex-verification-runbook.md`（8 章 + 源码位置速查附录，codex 兜底通道用）。
6. 量级全对后截图三维场景，视觉确认：路径起点落建筑门口、终点落出口、贴合 road-north-main 不塌不飘、不穿墙不逆行。
7. Python D\*Lite 链路同步验证（走 A 全局锚点，本地系自洽建图）。
8. 量级错或视觉错：不修探针，先回 D 锚点投影 / A 锚点投影复核（见 09 文档第 2.2 节 A 投影手算，第 8 节 D 锚点反推）。
9. 验证通过后：删三处探针、F2 标"已验证（三维场景实跑）"。

**prod S3M 影响评估（待后续单独评估）**：prod 走 S3M realspace 非 3D Tiles，改全局锚点对 prod 是否正确取决于 prod S3M 场景位置（待核实）。prod 当前 2D bounds 已错位 16km 是坏的（见 F5），改全局锚点不使其更坏。

**红线遵守**：F2 标"代码完成，待三维场景验证"，**不写"已修复/路网已对齐"**——三维落图实际请求验证通过前不冒充。数值验证通过（node 实跑坐标量级正确）≠ 三维场景验证通过（需实际请求 + 截图）。prod S3M 影响待后续单独评估。探针只是观测手段，量级对≠视觉对，最终仍需截图确认路线落在 3D 模型道路上。

**与原计划（路 A）的差异说明**：原 09 文档第 4 节写的 iServer 重发布规格（平移量 dE=+2715.767/dN=-6886.499）**已搁置**（路 A），改走路 B 前端双锚点。路 A 规格保留在 09 文档中作为备选（若路 B 全局锚点改动风险过大可回退到路 A）。本条先前回填的 iServer 重发布规格仍保留在上文作为历史记录，但当前执行方向是路 B。

**量级验证探针已加（临时调试代码，三维场景验证通过后删除）- 2026-07-18**：

**目的**：F2 代码改动完成、数值验证通过（node 实跑）、类型检查通过（vue-tsc）之后，下一步是三维场景实跑验证。为回收 iServer 实际请求 → D 逆变换 → A 正变换全链路的坐标量级，在三个关键节点加了临时 console 探针，均带 `[F2]` 前缀便于 console 筛选，标注为临时调试代码（验证通过后删除）。

**三处探针**：

1. **`frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts` `extractSuperMapPath` 函数（约 :399）**：新增 `logF2Probe(tag, path)` 辅助函数，在 route 分支返回前和 guides 分支返回前各打一次。打印 iServer 返回 path 的首尾点坐标和点数。
   - 预期量级：x∈[457600, 457900]，y∈[3856000, 3856300]（D 锚点 457692.843/3856127.172 邻域）。
   - 判据：若落 A 系（460xxx/3849xxx）说明 iServer 数据集已重发布或锚点判断错。

2. **`frontend/src/components/SuperMapSceneViewer.vue` `runSuperMapNetworkEvacuation` 函数（约 :1480，D 逆变换后）**：打 projectedPath 和 localPath 的首尾点。
   - 预期：projectedPath 落 D 系（457xxx/3856xxx），localPath 落本地系 [0,1587]×[0,947]。

3. **`SuperMapSceneViewer.vue` `drawEvacuationOverlay` 函数（约 :1908，落三维前）**：用已 import 的 `localToProjected`（A 锚点）把最终 path 首尾点正变换后打印。
   - 预期：easting∈[460190, 460985]、northing∈[3848724, 3849521]（A 投影 460587.110/3849122.673 ± 模型半宽 396.8m）。
   - 判据：越界说明 localPath 未落 A 系。

**验证状态**：

- vue-tsc 通过：本次改动的两个文件（`useSmartMapAlgorithmExecutors.ts`、`SuperMapSceneViewer.vue`）零类型错误。`screen/index.vue:11` 的 `SensorPlacementPayload` 错误是既存问题，与本次探针无关，不动。
- 三处探针均未引入新 import，零侵入（探针 3 复用已 import 的 `localToProjected`，不引入 `localToWgs84`）。
- 探针为临时调试代码，三维场景验证通过后删除。

**待办（属 codex 兜底通道，待用户/codex 跑）**：

- 起 dev server 实跑 + iServer 实际请求 + console 日志回收，确认三处量级均在预期范围。
- 这是"需要截图/跑服务"的活，等用户/codex 跑。
- 验证通过后：删三处探针、F2 标"已验证（三维场景实跑）"、推进 F5 双环境/F6/F7。

**红线遵守**：F2 仍标"代码完成，待三维场景验证"，**不写"已修复/已验证"**。探针只是观测手段，量级对 ≠ 视觉对，最终仍需截图确认路线落在 3D 模型道路上。

---

### F2 渲染链路认知修正（2026-07-18）

> 以下修正上文关于全局锚点 B→A 渲染影响的描述。上文（尤其是"已执行（F2 最后一块：全局锚点 B→A）"段及其数值验证段）把全局锚点 B→A 描述为"让 iServer path 经 D 逆 → 本地系 → A 正变换 → A 经纬度，落图到 A 三维模型"，暗示 A 锚点投影是渲染落图的必经环节。经代码核实，这个渲染链路描述是错的——dev/prod 渲染落图全程不走 A 锚点投影。保留上文作为历史记录，本段以代码 file:line 实锤为准。

#### 核心修正：F2 全局锚点 B→A 对渲染落图零影响

**之前的错误结论（需修正）**：
上文 F2 记录说"全局锚点 B→A 让 3D 模型对齐""iServer path → D 逆 → 本地 → A 正 → A 经纬度落三维模型"。这个"A 正 → A 经纬度落三维"是错的——渲染落图不走 `mapPointToGeo`/`localToProjected`（A 锚点正变换）这条链路。

#### 核实发现（实锤，file:line 引用）

**dev 3D Tiles 算法渲染落图真实链路（全程不经过 A 锚点投影）**：

1. `SuperMapSceneViewer.vue:1417` `drawEvacuationOverlay(result)` → `addPolylineEntity(path)`
2. `SuperMapSceneViewer.vue:2340` `addPolylineEntity` → `mapPointToSceneCartesian(point, ...)`
3. `SuperMapSceneViewer.vue:2573-2578` `mapPointToSceneCartesian` 3D Tiles 分支（:2574）→ `mapPointToThreeTilesCartesian(point)`
4. `SuperMapSceneViewer.vue:2581-2585` `mapPointToThreeTilesCartesian` → `threeTilesMapPointToEcef(point)`
5. `SuperMapSceneViewer.vue:2588-2595` `threeTilesMapPointToEcef` → `mapPointToS3MLocal(point, 0)`（:2590）+ `multiplyMatrix4ByPoint(georef.transform, localX, localY, localZ)`（:2594）
6. `georef.transform` 来自 `SuperMapSceneViewer.vue:998` `payload.root.transform` —— 即 tileset.json 的 root.transform 字段（3D Tiles 模型自带 ECEF 矩阵），**不来自 `SUPERMAP_CGCS2000_ANCHOR`**

**prod S3M 算法渲染落图链路（同样不走 A 锚点）**：

- `mapPointToSceneCartesian` 非 3D Tiles 非 geographic 分支 → `mapPointToS3MLocal(point)` → Cartesian3
- `mapPointToS3MLocal`（`SuperMapSceneViewer.vue:2692-2701`）用 `LOCAL_S3M_BOUNDS` + `LOCAL_S3M_BUSINESS_OFFSET` 把本地系映射到 S3M 缓存坐标，**不调 `localToProjected`/`localToWgs84`**

#### A 锚点投影（localToProjected/localToWgs84/projectedToWgs84）实际影响范围

- `supermapCupScenario.ts:136-147` `mapPointToGeo`：算传感器 geoPoint 字段（显示/上报用，不参与渲染）
- `coordinate.js` 的 `worldToGeo`/`geoToWorld`/`projectedToWorld`：被泄漏源 `useSmartMapLeakSource.ts:202` 用（待确认泄漏源落图走不走 `mapPointToSceneCartesian`，若走则也不影响渲染）
- `SuperMapSceneViewer.vue:644` `gisAnchorLabel`：3D Tiles 分支用 `threeTilesGeoreference.value.anchor`（tileset supermapCupAnchor，fallback A 经纬度），**仅 label 文本**
- `SuperMapSceneViewer.vue:2718-2729` `describeMapPoint`：3D Tiles 分支用 `threeTilesMapPointToGeo`，不走 A 锚点

#### 真正让 iServer path 落对模型的是什么

1. **D 逆变换**（`projectedToLocalD`，`supermapGeoreference.js:139`）：把 iServer D 系投影 path 转回本地系（0~1587）——这步真实有效，是 F2 的核心价值
2. **`mapPointToS3MLocal`**（`SuperMapSceneViewer.vue:2692`）：本地系 → S3M 本地坐标（用 `LOCAL_S3M_BOUNDS` 映射）
3. **tileset.root.transform**：S3M 本地坐标 → ECEF（3D Tiles 模型自带矩阵）

这三步与 A 锚点无关。A 锚点 B→A 只影响显示文本（`gisAnchorLabel`、传感器 geoPoint 经纬度），不影响渲染。

#### F2 全局锚点 B→A 是否回滚

**决定：不回滚。** 理由：

- 渲染零影响（dev/prod 都走 `mapPointToS3MLocal`，不走 A 锚点投影）
- 但 `mapPointToGeo`（传感器 geoPoint）和 `gisAnchorLabel` 文本会变：改前 B(113.665/34.7178)，改后 A(113.569463/34.76965)
- 用户明确说"看模型与底图/地形贴合定的 A"，A 是真实模型位置。传感器 geoPoint 标 A 经纬度更准确（传感器在模型上，经纬度该是模型所在经纬度）
- 所以 B→A 对显示准确性有正向价值，对渲染零风险

#### 探针 3 已修正

之前探针 3 用 `localToProjected`（A 锚点）打 A 投影，验证的是渲染中不走的链路。已改为打真实渲染链路中间值：

- `mapPointToS3MLocal` 输出（S3M 本地坐标，预期 x∈[`LOCAL_S3M_BOUNDS.left`, `right`]，y∈[`bottom`, `top`]）
- `threeTilesMapPointToEcef` 输出（ECEF，预期量级 1e6~1e7）
- `georefTransformLen`（确认 `tileset.root.transform` 加载成功，应=16）

位置：`SuperMapSceneViewer.vue:1908` `drawEvacuationOverlay` 开头。
顺带移除了 `localToProjected` 的 unused import（`SuperMapSceneViewer.vue:166`，改后该文件不再调用 `localToProjected`，vue-tsc 通过）。

#### F2 真正需要验证的是什么（修正后）

1. 探针 1（iServer 原始 path 落 D 系 457xxx/3856xxx）—— 验证 iServer 返回 D 系，仍有效
2. 探针 2（localPath 落本地系 0~1587）—— 验证 D 逆变换正确，仍有效（这是渲染落图的输入）
3. 探针 3（修正后）：`mapPointToS3MLocal` 输出落 `LOCAL_S3M_BOUNDS` + ECEF 量级 1e6~1e7 + transform 长度=16 —— 验证本地系→S3M→ECEF 链路正常

#### 红线遵守

- F2 仍标"代码完成，待三维场景验证"，**不写"已修复"**
- 明确撤回"全局锚点 B→A 让 3D 模型对齐"的错误结论——全局锚点 B→A 对渲染零影响，渲染对齐靠 D 逆变换 + `mapPointToS3MLocal` + `tileset.root.transform`
- 如实说明：全局锚点 B→A 只影响显示文本（`gisAnchorLabel`、传感器 geoPoint 经纬度），不影响渲染落图
- D 逆变换（`projectedToLocalD`）是 F2 真正有渲染价值的改动，这点不变——上文"已落地（路 B 第一步：iServer 链路 D 锚点改造）"段的 D 锚点逆变换价值成立，不被本修正推翻
- 上文"已执行（F2 最后一块：全局锚点 B→A）"段中"A 正 → A 经纬度落三维"的渲染归因作废，但 B→A 改动本身保留（不回滚，对显示文本有正向价值）

#### F2 三维实跑验证 - codex 兜底失败（2026-07-18 22:55）

用 `codex exec --dangerously-bypass-approvals-and-sandbox` 非交互跑 F2 验证（runbook `docs/f1-f2-investigation/11-f2-codex-verification-runbook.md`）。codex 接上了浏览器 MCP，但**本地命令执行器全程不可用**：所有 PowerShell/cmd/外部命令返回 `Exit code: -1073741502`（Windows STATUS_C0000142 DLL 初始化失败），连 `Get-Content runbook`、`Get-Location` 都起不来。

- codex 无法读 runbook、无法 curl、无法触发前端按钮、无法拿 `[F2]`/`[F6]` console 日志、无截图。
- codex 浏览器控制工具未发现可用 console/screenshot 工具，`tool_search` 只返回多代理工具（未授权子代理委派）。
- codex 诚实落盘结论到 `logs/codex-f2-evidence.md` + `logs/codex-f2-lastmsg.txt`：**"F2 三维坐标验证未完成，未取得可判读证据，不能判断坐标一致性"**。遵守红线（不冒充已验证、不夸大）。
- 根因不在 runbook、不在 F2 代码，在 codex 本机命令执行器（STATUS_C0000142，疑似 DLL/依赖损坏或沙箱冲突）。codex smoke-test 能回 "OK"（纯模型推理），但一执行外部命令就崩。

**F2 状态维持**："代码完成，待三维场景验证"，未升级为"已验证"。证据缺口：三条 `[F2]` 探针日志 + `[F6]` 告警 + 截图均未取得。下一步要么修 codex 命令执行器（`codex doctor` 排查 STATUS_C0000142），要么人工浏览器点击回收 console 日志。

#### F2 人工浏览器实跑 - 探针 1 通过 + 阻塞于 3D 模型资产缺失（2026-07-18 23:10）

人工浏览器回收 console 日志（codex 兜底失败后改人工）。**探针 1 通过，但探针 2/3 因模型资产缺失未取得**：

- **探针 1（`extractSuperMapPath[guides]`）✅ 通过**：8 条路径 head 全部 `(457828.843, 3856009.172)`，落 D 锚点（457692.843/3856127.172）附近。easting 457xxx / northing 3856xxx 是 CGCS2000 3度带（中央经线 114E）合理量级。iServer 返回 D 系投影坐标，**F2 D 锚点逆变换的输入正确**。
- **探针 2/3 未取得**：触发的是「最近设备分析」（`runSuperMapClosestDeviceAnalysis`），不是单建筑疏散。需改点「当前建筑路径」按钮（`SmartMapEmergencyScenarioPanel.vue:176-177`，emit `run-evacuation`）才能触发探针 2（`:1482 evacuation D->local`）和探针 3（`:1910 render-chain`）。
- **F6 告警出现**：`mapPointToS3MLocal 输入越界 rawNx=-3.5 rawNy=-14.5`——根因是 3D 模型未加载导致 S3M bounds 退化，非 F6 代码问题。

**阻塞根因：3D Tiles 模型瓦片文件缺失**。`frontend/public/pic/chemical-park-3dtiles/` 原只有顶层 `tileset_zhengzhou_57083.json`（8KB），所有 `Tile_*/Tile_*.b3dm` 瓦片不在仓库。浏览器报 `A 3D tile failed to load ... ERR_INSUFFICIENT_RESOURCES`，tileset.root.transform 加载不完整 → 探针 3 `georefTransformLen` ≠ 16 无法验证。

**已修复（资产，非代码）**：从 aliyun（8.130.175.232，chemgas 经 nps 穿透的静态副本）scp 拉取完整模型 1.1GB / 242 文件（221 b3dm + tileset.json + 子 Tile json）到 `frontend/public/pic/chemical-park-3dtiles/`。Vite 验证 b3dm HTTP 200、Tile_0000_0000_0000.json 200、入口 tileset_open_parcel_57083.json 200。模型路径与前端引用对齐（local-pic 入口 json → pic 下瓦片）。

**下一步**：模型已就位，重新点「当前建筑路径」按钮（单建筑疏散），回收探针 2/3 + 确认 F6 告警消失 + `georefTransformLen=16`。

#### F2 人工浏览器实跑 - 模型补齐后复跑，发现 F8（单建筑疏散 iServer 坐标系 bug）（2026-07-19 00:30）

模型补齐后复跑单建筑疏散。**探针 3（render-chain）触发**（证明走的是单建筑疏散链路、按钮点对了），但 console 报：

- `[SuperMap] 网络分析不可用，降级到 Python 动态危险避让算法 Error: SuperMap 网络分析服务未返回可用路径`
- 三维可视化结果出不来（降级 Python，路径未正确落图）
- 3D 模型加载成功（SuperMap3D 内存降级警告 `maximumScreenSpaceError would use more memory`，是细节降级非错误，证明模型补齐成功）
- 探针 2（`evacuation D->local` :1482）未触发——因 iServer 失败降级 Python，未走 `runSuperMapNetworkEvacuation` 的 iServer 成功分支

**根因核实（curl iServer 实锤）**：前端 `buildSuperMapPathUrl`（`useSmartMapAlgorithmExecutors.ts` :354 `requestSuperMapPath`）把 payload 的**本地米制坐标**（0~1587）直接当 `nodes` 传给 iServer path.rjson 端点。iServer 网络数据集是 CGCS2000 投影 D 系（457xxx/3856xxx），捕捉不到本地米制节点。

curl 证据：

- 传本地米制 `nodes=[{x:158,y:947},{x:1200,y:400}]` → iServer 返回 `{"succeed":false,"error":{"code":400,"errorMsg":"执行 findPath 操作时出错，原因是：第1个点没有被捕捉"}}`，pathList 为空。
- 传 D 系 `nodes=[{x:457828.843,y:3856009.172},{x:457985.843,y:3855897.172}]` → iServer 返回完整 pathList，pathGuideItems 有 geometry/bounds，坐标落 D 系。

**为什么最近设备分析能返回路径**（探针1）：最近设备走 `closestfacility.rjson` 端点（`buildSuperMapClosestFacilityUrl`），参数 `event`/`facilities`，iServer 最近设施端点对节点容差吸附/内部投影不同，本地米制能返回结果（返回的 path 坐标是 D 系）。单建筑疏散走 `path.rjson` 端点，对 `nodes` 精确捕捉，本地米制直接报"没有被捕捉"。

**修复方向（未实施，待决策）**：`requestSuperMapPath` 调 `buildSuperMapPathUrl` 前，用 `localToProjectedD`（`supermapGeoreference.js:149`，已存在）把 start/end 本地米制转 D 系投影。这是 F2 D 锚点逆变换（`projectedToLocalD`）的反向，D 锚点正变换。修复后 iServer 能捕捉节点、返回 path，前端再用 `projectedToLocalD` 把返回 path 转回本地系渲染（F2 已实现的逆变换）。

### F8 - 已修复（2026-07-19 00:50）

**实施**：`useSmartMapAlgorithmExecutors.ts` `requestSuperMapPath`（:354）调 `buildSuperMapPathUrl` 前，用 `localToProjectedD` 把本地米制 start/end 转 D 系投影：

```ts
const projectedStart = localToProjectedD(startPoint.x, startPoint.y);
const projectedEnd = localToProjectedD(exit.point.x, exit.point.y);
const requestUrl = buildSuperMapPathUrl(
  analysisUrl,
  { x: projectedStart.easting, y: projectedStart.northing },
  { x: projectedEnd.easting, y: projectedEnd.northing },
);
```

新增 import `localToProjectedD` from `@/data/supermapGeoreference`（:11）。`startX/startY`（:381-382）仍记本地米制用于前端显示，未动。

**自洽性**：iServer 返回的 path 坐标是 D 系投影，下游 `drawEvacuationOverlay`（`SuperMapSceneViewer.vue:1479`）已用 `projectedToLocalD` 转 D 系→本地系渲染（F2 实现），链路闭合。

**验证**：

- vue-tsc 通过（exit 0，F8 改动无新增类型错误。`screen/index.vue` 的 TS2719 既存错误 stash 验证为改动前已有，与 F8 无关）。
- 待人工浏览器复跑：重新点「当前建筑路径」，预期 iServer 返回 path（不再降级 Python），探针 1/2/3 全触发，三维可视化路径贴建筑/路网。

**F2 状态**：探针 1（最近设备链路）通过 + 探针 3（渲染链路）触发但数值未展开判读（需人工贴回展开值）。单建筑疏散因 F8 阻塞无法完整验证 iServer→渲染全链路。F8 修复后，待复跑验证 iServer 链路打通 + 三维落图正确。

### F8 - 撤回首次判断（2026-07-19 01:30）

**首次 F8 判断错误**：误判 `requestSuperMapPath` 的 `startPoint`/`exit.point` 是本地米制（0~1587），在 `:354` 加 `localToProjectedD` 转换。浏览器复跑实锤 iServer 返回 **400 Bad Request**，URL 里坐标 `x=686601.265, y=1928122.586`——**不是 D 系投影**（D 系应 easting 457xxx / northing 3856xxx）。

**反算定位根因**：

- `localToProjectedD` 公式：`easting = 457692.843 + 0.5*x`，`northing = 3856127.172 - 0.5*y`
- 用 URL 里的 `686601.265/1928122.586` 反推输入：`x_in = (686601.265-457692.843)/0.5 = 457816.844`，`y_in = (3856127.172-1928122.586)/0.5 = 3856009.172`
- **输入已是 D 系投影**（457817 / 3856009，落在 D 锚点邻域）。首次 F8 又套一层 `localToProjectedD`，双重变换成 686xxx/1928xxx → iServer 400。

**代码链核实**（`SuperMapSceneViewer.vue`）：

- `:1563 buildProjectedNetworkPayload` → `:1572 projectPoint(startPoint)` → `:1637 projectPoint` 内调 `localToProjectedD(point.x, point.y)`，已把本地米制转 D 系投影。
- `requestSuperMapPath` 收到的 `startPoint` 经此链路**已是 D 系投影**，直传 iServer 即可。首次 F8 注释"payload 的 startPoint/exit.point 是本地米制"是错判断，未追溯上游 `buildProjectedNetworkPayload`。

**撤回实施**：删 `requestSuperMapPath` 里的 `projectedStart/projectedEnd` 5 行转换，恢复 `buildSuperMapPathUrl(analysisUrl, startPoint, exit.point)` 直传；删未使用 import `localToProjectedD`；保留 timeout 改进（`AbortController` + 6500ms，本身合理）。

**pre-F8 的 400 真因待证**：之前 curl 实锤"本地米制 succeed:false / D 系返回 pathList"用的坐标，与 `buildProjectedNetworkPayload` 实际产出的 D 系坐标是否一致未核实。撤回 F8 后浏览器实跑会发真正的 D 系坐标（457xxx/3856xxx），若仍 400 则说明 `projectPoint` 产出的 D 系与 iServer 路网节点捕捉容差不匹配（需另查 `buildSuperMapPathUrl` 的 nodes 序列化格式或捕捉半径），而非缺坐标系转换。

**验证**：

- vue-tsc 通过（exit 0，`useSmartMapAlgorithmExecutors.ts` 零错误；`screen/index.vue` TS2719 为既存错误，stash 验证与本次改动无关）。
- 待人工浏览器复跑：重新点「当前建筑路径」，预期 iServer 收到 D 系坐标（457xxx/3856xxx）返回 path；若仍 400 则转入 pre-F8 真因排查（非坐标转换问题）。

---

### F9 - 3D Tiles 加载策略导致浏览器资源耗尽崩溃（2026-07-19 02:00）

**现象**：撤回 F8 后浏览器复跑，页面整个崩死：

- `GET .../Tile_0000_0000_0000_0002_0000.b3dm net::ERR_INSUFFICIENT_RESOURCES 200 (OK)`（HTTP 200 但浏览器并发连接耗尽，资源拒绝）
- `GET .../createPolylineGeometry.js ... Rendering has stopped`（SuperMap3D Worker 的动态 import JS 都 fetch 失败 → 渲染循环终止）
- `An error occurred while rendering. Rendering has stopped.` → 页面打不开

**根因**（`SuperMapSceneViewer.vue` `openThreeDTileset` :873 options + `stabilizeThreeTilesetRecord` :921）：
原配置等于性能自杀，关掉了 Cesium 所有 LOD/裁剪降级优化，强制全量并发加载 221 个 b3dm（1.1GB）：

- `maximumScreenSpaceError: 4`（Cesium 默认 16，**数值越小越激进加载**，4 = 强制加载到极精细层级）
- `skipLevelOfDetail: false`（关 HLOD 跳级 → 不允许跳过中间 LOD 层级，必须逐级加载）
- `cullRequestsWhileMoving: false` / `cullWithChildrenBounds: false` / `dynamicScreenSpaceError: false` / `foveatedScreenSpaceError: false`（关闭移动裁剪、子节点边界裁剪、动态 SSE、中心优先）
- `loadSiblings: true` / `preloadFlightDestinations: true`（强制预加载兄弟节点与飞行目的地 → 请求数膨胀）
- `maximumMemoryUsage: 1024`（1.1GB 模型 + 浏览器其他占用面前不够）
- 模型 entry `tileset.json` `geometricError: 294271`（根节点几何误差 29 万米 → Cesium 认为永远不够精细，疯狂向下加载所有子节点）

**修复**（`openThreeDTileset` options + `stabilizeThreeTilesetRecord` 两处同步改）：
改回 Cesium 官方推荐保守值，开 HLOD 跳级、SSE=16、开所有裁剪/降级、关兄弟/飞行预加载、内存上限提到 2048MB：

```ts
maximumScreenSpaceError: 16,          // 默认值，不再强制极精细
skipLevelOfDetail: true,               // 开 HLOD 跳级加载
cullRequestsWhileMoving: true,        // 移动时裁剪请求
cullRequestsWhileMovingMultiplier: 60,
cullWithChildrenBounds: true,         // 子节点边界裁剪
dynamicScreenSpaceError: true,        // 动态 SSE（远距离自动降级）
foveatedScreenSpaceError: true,       // 中心优先（屏幕中心精细、边缘粗）
loadSiblings: false,                  // 不预加载兄弟
preloadFlightDestinations: false,     // 不预加载飞行目的地
maximumMemoryUsage: 2048,              // 容下 1.1GB 模型
```

**未改 entry tileset.json 的 `geometricError: 294271`**：改模型元数据可能破坏 LOD 层级语义，先靠渲染参数压。若复跑仍资源紧张，再考虑调小根 `geometricError` 或裁剪 entry children（root 有 9 个 children）。

**验证**：

- vue-tsc 通过（`SuperMapSceneViewer.vue` 零错误；`screen/index.vue` TS2719 既存）。
- 待人工浏览器复跑：硬刷新页面（Ctrl+Shift+R），预期 3D 球面正常加载（b3dm 按需加载，不再 ERR_INSUFFICIENT_RESOURCES），渲染循环不死。页面活过来后再点「当前建筑路径」验证 F8 撤回 + F2 全链路。

**F2/F8 验证阻塞说明**：F9 崩溃发生在页面加载阶段，与 F2/F8 坐标逻辑无关。必须先让页面活过来（F9 修复），才能继续 F8 撤回验证（iServer 收 D 系坐标是否返回 path）。

### F9 二次收紧（2026-07-19 02:30）— 用户反馈"再裁小一点"

首轮 F9 只调渲染参数，未动模型元数据。用户要求进一步裁剪，本轮双管齐下：

**渲染参数再收紧**（`openThreeDTileset` options + `stabilizeThreeTilesetRecord` 两处同步）：

- `maximumScreenSpaceError: 16 → 24`（远距离直接不加载精细层）
- `dynamicScreenSpaceErrorFactor: 4 → 8`（远距离更激进降级）
- `maximumMemoryUsage: 2048 → 512` MB（避免 Cesium 缓存过多撑爆；配合按需加载不需要大缓存）
- 新增 `cacheBytes: 536870912`（512MB 字节单位，Cesium 1.97+ 用此字段替代 maximumMemoryUsage，两个并存按 SDK 版本取其一）

**entry tileset.json 几何误差裁剪**（本轮关键，原首轮未敢动）：
核实 dev 实际入口是 `local-pic/chemical-park-3dtiles/tileset_open_parcel_57083.json`（5 children，每个 child 指向 `/pic/chemical-park-3dtiles/Tile_*/Tile_*.json` 子 tileset），不是 `pic/chemical-park-3dtiles/tileset.json`（9 children，被 dev entry 引用为子资源）。两者 root `geometricError` 都是 294271（29万米，万恶之源——Cesium 认为根节点永远不够精细，疯狂下钻所有子节点）。

改动（均备份 `.f9bak` 可回滚）：

- `pic/chemical-park-3dtiles/tileset.json` root `geometricError: 294271 → 30000`
- `local-pic/chemical-park-3dtiles/tileset_open_parcel_57083.json` root `geometricError: 294271 → 30000`，且 4 个 ge>30000 的 root child（167415/88390/63896/93051）也降到 30000（child[1] 本就 20053 不动）
- 子 tileset（`Tile_*/Tile_*.json`）root 无 `geometricError`（继承上层 entry child ge），无需改

**降负机理**：根 ge 从 29 万降到 3 万后，Cesium 在远距离就判定根节点"够精细"不下钻；配合 SSE=24 + 动态 SSE factor=8，远距离分块自动降到极简层级甚至不可见，只有视口内近距离分块加载精细 b3dm。预期从"全量 221 b3dm 并发"降到"视口内几十个 b3dm 按需加载"。

**未删 children**：9 个/5 个 root children 各覆盖园区不同空间区域建筑，删错会导致算法验证时建筑缺失。靠 ge 降级 + SSE 裁剪让远距离分块自动不加载，比硬删安全（可逆，数据不丢）。

**验证**：

- vue-tsc 通过（`SuperMapSceneViewer.vue` 零错误；仅 `screen/index.vue` TS2719 既存）。
- 待人工浏览器复跑：硬刷新，预期页面正常加载不再崩，b3dm 按需加载。

---

### F10 - 疏散路径落图越界根因：mapMetersPerUnit=0.5 应为 1.0（2026-07-19 03:00）

**现象**：F9 修复后页面活过来，iServer 链路打通（探针 1 `extractSuperMapPath[guides]` 触发，head=(457816.843,3856009.172) D 系正确），不再降级 Python。但 `[F6] mapPointToS3MLocal 输入越界 rawNx=1.27/1.43/1.61/1.62`，路径未贴到三维地图上。

**反算定位**：

- F6 告警 `rawNx=1.61` → `point.x = 1.61×1587.2 = 2555`，非本地系（0~1587）也非 D 系（457xxx）
- 探针 1 显示 iServer 返回 path tail=(458979.343, 3855561.172)，经旧 `projectedToLocalD`（0.5 尺度）转出 x=(458979-457692.843)/0.5=2573 → 2573/1587=1.62，对上告警

**根因实锤**（全量数据反算，非单点推测）：
拉取 iServer 全量 93 条 edge 的 `LOCALMAPX/LOCALMAPY`（本地系）与 `CGCS2000E/CGCS2000N`（投影中心点）字段，对 30 个有效样本做最小二乘反算：

- easting 尺度 sE = **1.0000**（X 方向 1 unit=1m），30 样本范围 [1.000, 1.000] **零方差**
- northing 尺度 sN = **-1.0000**（负号=Y 轴向南，1 unit=1m），零方差

**物理尺度交叉验证**：`realMapAssets.js` DOM 底图 `assetWidthPx=3968 × metersPerAssetPixel=0.4 = 1587.2m` = `REAL_MAP.width`。故本地系 1 unit = 1m，`mapMetersPerUnit` 必为 1.0。旧 0.5 把本地系 1587.2 units 压成 793.6m 覆盖，但 iServer 路网实际跨度 1587.2m（easting [457752~459339] 跨 1587.2m，northing [3855298~3856245] 跨 947.2m，恰好=本地系尺寸），路径东半部超出本地系映射范围 → 越界。

**代码内已存在的不一致**（早期有人改了一半）：

- `SuperMapSceneViewer.vue:1626` → `1`（已对）
- `useSuperMapIserverData.ts:498` → `1`（从 env 读，默认 1，已对）
- `supermapGeoreference.js:9` → `0.5`（**错**，本次改）
- `supermapCupScenario.ts:120` → `0.5`（**错**，本次改）
- `useSmartMapObservationBuilders.ts:231` → 默认 `0.5`（**错**，本次改默认值 1）

**为何旧 0.5 "看起来对"**：之前的验证用 edge0 **端点** (457752.343) 凑出 D 锚点，碰巧满足 0.5 公式。但 iServer 数据集自带的是**中心点**对应关系（CGCS2000E=457871.343 是 edge 中心，非端点），中心点用 0.5 算不出（需 1.5）。F10 用中心点 + 全量反算才暴露真尺度。

**修复**（用户确认"全改 1.0+重算双锚点"）：

1. `supermapGeoreference.js` `SUPERMAP_MAP_SIZE.mapMetersPerUnit`: 0.5 → 1
2. `supermapCupScenario.ts:120` `mapMetersPerUnit`: 0.5 → 1
3. `useSmartMapObservationBuilders.ts:231` 默认值: 0.5 → 1
4. D 锚点 `SUPERMAP_ISERVER_DATA_ANCHOR.projected`: (457692.843, 3856127.172) → **(457752.343, 3856245.172)**
   - 重算：用 edge0 中心 LOCALMAP(119,236)↔CGCS2000(457871.343,3856009.172) + mpu=1.0
   - D_e = 457871.343 - 119×1.0 = 457752.343；D_n = 3856009.172 + 236×1.0 = 3856245.172
5. A 锚点 `SUPERMAP_CGCS2000_ANCHOR.projected` (460587.110, 3849122.673) **不变**：经纬度手算投影值，与 mapMetersPerUnit 无关；localToProjected(0,0) 仍=A 投影，A 链路自洽。

**数学自检**（Python 模拟新参数）：

- `localToProjectedD(119,236)` = (457871.343, 3856009.172)，与 edge0 中心 CGCS2000 误差 0.000 ✅
- 旧越界尾点 `projectedToLocalD(458979.343,3855561.172)` = (1227.0, 684.0)，rawNx=0.77, rawNy=0.72，**完全在 [0,1] 内** ✅
- 全路网包络 easting→本地x[0~1587.2]、northing→本地y[0~947.2]，**精确填满本地系，不再越界** ✅

**验证**：

- vue-tsc 通过（exit 0，仅 `screen/index.vue` TS2719 既存）。
- 待人工浏览器复跑：硬刷新后点「当前建筑路径」，预期 [F6] 越界告警消失，路径贴到三维地图建筑/路网上。

**影响面说明**：此修复触及 F1-F4 坐标系根基（mapMetersPerUnit 是所有 local↔projected 转换的尺度因子）。F1-F4 此前在 0.5 尺度下"验证通过"的结论需在 1.0 尺度下复验。但因 iServer 数据集自带的 LOCALMAP↔CGCS2000 是 1:1 严格对应（零方差），1.0 才是数据真实尺度，0.5 下的"通过"实际是局部巧合。

**附：502 瞬时过载（次要问题，未修）**：浏览器日志显示最近设备链路一次性触发 20+ 个 `feature/0-4-N.rjson` + closestfacility + 多 path.rjson 并发，nps 代理/iServer 瞬时并发上限被打满返回 502。curl 直连 iServer 全 200，proxy 间歇 502。属并发限流问题，非坐标 bug，后续如需修可加请求节流（串行化或限并发数）。

---

### F3 - 已核实，无需修复（伪问题） - 2026-07-18

**原任务推断**：`roadRectFromLine`（`frontend/src/views/smart_map/useSuperMapIserverData.ts:276-312`）从 `feature.geometry.points` 取首尾两点，中间所有折点丢弃，导致 L 形/弯曲道路被压成首尾连线的直线矩形，路网形状失真。

**核实方法**：curl 取 iServer 全量 93 条 edge 的 `geometry.points` 统计点数分布。

**核实结果**（实锤）：

- 2 点 edge：**93 条**
- > 2 点 edge：**0 条**
- 证据：iServer `feature/0-2-{0..92}.json` 全量统计。

**判定**：93 条 edge **全部是 2 点直线段**，没有 >2 点的折线 edge。`roadRectFromLine` 取首末点对 2 点直线段完全正确，**不存在中间折点丢失**。原任务清单 F3"只取首末点导致折点丢失"是基于代码静态推断，但实际数据每条 edge 就是直线段，函数逻辑正确。

iServer 路网结构是"每条路拆成多个 2 点直线段 edge"（如 `road-north-main` 被 edge-01/02/... 切成多段），`loadSuperMapPlanningInputs`（`:481`）对每段调 `roadRectFromLine` 生成独立矩形，`snapPointToRoad` 遍历所有矩形取全局最近——对多直线段结构正确。

**红线遵守**：不冒充修复（没改代码），如实标"已核实无需修复"，并说明原任务推断与实际数据的差异。遵守 YAGNI，不为不存在的问题建抽象（不扩展 `SuperMapRoadRect` 加 `points` 字段、不引入折线投影/缓冲区相交）。

**当前状态**：已核实，无需修复。原任务推断与实际数据不符——实际数据全是 2 点直线段，`roadRectFromLine` 逻辑正确。

---

### F4 - 已核实，无需修复（同 F3） - 2026-07-18

**原任务推断**：`snapPointToRoad`（`frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts:277-298`）用矩形中线投影，丁字/十字路口、环岛/弯道处吸附不合理，可能导致 iServer 返回"不可达"或绕远路。

**核实结果（同 F3）**：iServer 93 条 edge 全部是 2 点直线段（见 F3 核实结果），且多是水平/垂直正交道路（如 `road-north-main` 是水平 y=236）。

**判定**：对正交道路，矩形中线投影等价于线段最近点，吸附正确。只在斜向道路有误差，但当前数据无斜向 edge。原任务推断的"弯道拉直导致吸附偏离"不成立（无弯道 edge）。

**红线遵守**：同 F3，如实标"已核实无需修复"，不改代码，不为不存在的问题建抽象。

**当前状态**：已核实，无需修复。原任务推断与实际数据不符——实际数据全是 2 点正交直线段，矩形中线投影正确。

---

### F5 - 现状摸查完成，阻塞于 F2 - 2026-07-18

**原任务**：dev/prod 三维坐标模式不一致，验证盲区（流程问题，非代码问题）。

**核实结果（关键发现）**：dev/prod 三维渲染技术栈不同。

| 环境 | 三维模式           | 开关                                                                                | 模型/服务                                                                 | 锚点                    |
| ---- | ------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------- |
| dev  | 3D Tiles 模式      | `VITE_SUPERMAP_3D_USE_3DTILES` 实际短路为 true                                      | `tileset_open_parcel_57083.json`                                          | A(113.569463, 34.76965) |
| prod | S3M realspace 模式 | `VITE_SUPERMAP_3D_USE_3DTILES=false`，`VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false` | `/iserver/services/3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace` | —                       |

**prod 2D bounds 与 iServer 数据集错位 16km（既有问题）**：

- prod 实际生效 2D bounds（`.env.production:30-33`）= B 系（469313/3842863/470107/3843337）。
- prod iServer 数据集 = D 系（457752/3855297 附近，见 `.env.production:45-48` 注释）。
- prod 注释里写了 D 系 bounds 但未启用，实际用 B 系 → **prod 2D 地图与 iServer 数据集错位 16km，加载不到真实数据**。

**安全问题（既有，非本次引入）**：`.env.production:36` `VITE_QWEATHER_API_KEY=[REDACTED_SECRET]` 明文存仓库，违反 Vue 安全红线（client bundle secrets）。**本次不改动**（动它会破坏 prod 天气功能），如实记录待用户决策轮换。

**验证流程（F2 完成后执行）**：F2 锚点统一 + iServer 重发布完成后，需在 dev（3D Tiles 管线）和 prod（S3M 管线）分别验证三维落图：

- dev：触发疏散演示，按 F2 三维落图验证方法（09 文档第 6 节）打印 path 量级 + 截图三维场景确认起点落建筑门口、终点落出口、路径不塌不飘。
- prod：同方法验证 S3M realspace 管线。若 prod 因 realspace 服务问题无法验证，须如实记录"prod 环境验证阻塞，仅 dev 验证通过"，不要冒充双环境通过。

**当前状态**：现状已摸清，验证执行阻塞于 F2（锚点统一 + iServer 重发布）。dev/prod 技术栈不同 + prod 2D bounds 错位 16km 既有问题，均如实记录。

**红线遵守**：不夸大一致性，如实记录 dev/prod 技术栈不同 + prod 2D bounds 错位 16km 既有问题 + QWeather API Key 明文安全既有问题（待用户决策轮换，本次不动）。

---

### F6 - 前端路径校验：现状摸清，待修复 - 2026-07-18

**代码位置**：

- `frontend/src/components/SuperMapSceneViewer.vue:1881` `drawEvacuationOverlay` → `mapPointToSceneCartesian`
- `frontend/src/components/SuperMapSceneViewer.vue:2484-2485` / `:2665-2666` `mapPointToSceneCartesian` 内部用 `clamp(point.x / map.width, 0, 1)` 归一化

**现状（核实）**：当前已有 clamp 归一化，但这是**症状放大器而非校验**。当 iServer 链路 `projectedToLocal` 算出负几万本地坐标（07 报告第 4 节实证 `-22884/-25344`），clamp 静默压到 0，整条路径塌到场景西北角单点，**掩盖了坐标系错位**，不报错。这使 F2 的坐标系错位问题在三维上表现为"路径塌成一点"但无任何错误提示，难以诊断。

**F6 应修复方向**：在 clamp 前加量级校验——path 点超出 `[0, map.width]×[0, map.height]` 范围（说明坐标系错位）时，报错或降级标注"坐标系异常"（如 `pathAnomaly: true` + 控制台告警 + 三维红色虚线/警告标签），而非静默 clamp 塌点。让坐标系错位**可见可诊断**，而非静默吞掉。

**与原任务清单 F6 的差异**：原任务清单 F6 描述的是"iServer 路网拓扑质量未复核，可能算出穿墙/逆行路径，前端加道路缓冲区校验"。核实后聚焦到更上游的问题：当前最严重的不是"路径穿墙"（拓扑问题），而是"坐标系错位导致 path 整体塌成一点被 clamp 静默吞掉"（诊断可见性问题）。拓扑校验（路径是否落在道路缓冲区内）仍有价值，但优先级低于坐标系异常校验——因为坐标系错位时路径根本落不到道路附近，缓冲区校验会全报异常但根因是坐标系不是拓扑。

**与原任务清单 F6 的数据集事实（保留）**：当前可用数据集 `Park_RoadNetwork_Auto_N`（`.env.production:34` / `.env.development:37`）关闭了自动网络检查，路网拓扑质量仍需 iDesktopX 复核（来自 `docs/supermap-algorithm-2d-compute-3d-visualization-plan.md` 第 8 节）。

**当前状态**：待修复（在 F2 锚点对齐后实施更有意义，否则校验会一直报错）。当前如实记录 clamp 静默吞错的现状。前端校验待加；路网拓扑复核阻塞于 iDesktopX（不写"路网拓扑已修复"）。

**红线遵守**：不冒充已修复。如实记录 clamp 静默吞错现状。不伪造路网拓扑质量（拓扑复核是 iDesktopX 任务，前端只加校验）。

---

### F6 - 已修复（前端路径校验：越界告警） - 2026-07-18

#### 核实结论（Explore agent 实锤）

前端有 3 处独立 clamp 实现（coordinate.js:28、SuperMapSceneViewer.vue:2758、useSmartMapAlgorithmExecutors.ts:300），其中涉及算法路径坐标的"静默吞错"高危点：

1. **SuperMapSceneViewer.vue:2697 `mapPointToS3MLocal`**（最高危）：iServer path 经 D 逆变换若量级错，本地坐标到 -14000 量级，被 `clamp(point.x/map.width, 0, 1)` 静默夹回 [0,1]，三维路径点全堆模型边界，视觉乱跑不报错。这是算法路径点落三维的实际入口（addPolylineEntity:2340 → mapPointToSceneCartesian:2577 → mapPointToS3MLocal:2697）。
2. **coordinate.js:60/68 `geoToWorld`/`projectedToWorld`**：被泄漏源 useSmartMapLeakSource.ts:202 等复用，clamp 到 [0,1587]×[0,947] 无告警。
3. **SuperMapSceneViewer.vue:3121 `clampMapPoint`**：交互落图吞越界。

#### 修复（已完成，vue-tsc 通过）

策略：在 clamp 前加越界检测，`console.warn` + `pushDebugMessage`（coordinate.js 无 pushDebugMessage 通道，仅 console.warn），用 module-level Set 去重避免刷屏，不阻断渲染。

改动：

1. `SuperMapSceneViewer.vue:2697` `mapPointToS3MLocal`：加 rawNx/rawNy 越界检测（阈值 ±5%），越界 warn + pushDebugMessage。新增 module-level `S3M_LOCAL_OUT_OF_BOUNDS_WARNED` Set（:2697 前）去重。
2. `SuperMapSceneViewer.vue:3121` `clampMapPoint`：加越界检测 + warn + pushDebugMessage，复用同一 Set。
3. `coordinate.js`：新增 `warnCoordinateOutOfBounds` 辅助函数 + `COORD_OUT_OF_BOUNDS_WARNED` Set，在 `geoToWorld`/`projectedToWorld` clamp 前调用。

未改：`projectedToLocalD`（supermapGeoreference.js:139）保持纯函数；`snapPointToRoad` 的 clamp（几何吸附合理）；所有 CSS clamp / UI 视口 / frame 索引 clamp。

#### 验证状态

- vue-tsc 通过（我改的文件零类型错误，screen/index.vue:11 既存错误不动）。
- 越界告警是防御性加固，不改变正常路径渲染（正常坐标不触发）。
- 实跑验证待 F2 三维场景验证时顺带触发（若 F2 探针量级错，F6 告警会同步报出）。

#### 红线遵守

F6 标"已修复（越界告警）"。这是纯防御性加固，不夸大为"路径校验完整"——只覆盖了 3 处高危 clamp，其他低危 clamp（snapPointToRoad/UI 视口）未动（YAGNI）。越界告警不阻断流程，只留证据。

---

### F7 - 批量规划决策：现状摸清，原任务描述过时 - 2026-07-18

**代码位置**：

- `frontend/src/views/smart_map/useSmartMapEvacuationPlanningActions.ts:278` `runBatchEvacuationPlanning`
- `frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts:104-122` `executeSmartMapEvacuationPlanning`
- `frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts:124-166` `executeSuperMapNetworkAnalysis`

**现状（与原任务清单 F7 描述不符）**：
原任务 F7 说"批量规划仍用 Python D\*Lite"。实际代码（`useSmartMapAlgorithmExecutors.ts:104-122`）：

1. 批量入口 `runBatchEvacuationPlanning`（`useSmartMapEvacuationPlanningActions.ts:295`）调 `executeSmartMapEvacuationPlanning`。
2. `executeSmartMapEvacuationPlanning` **先试 SuperMap iServer**（`executeSuperMapNetworkAnalysis`，`:105`）。
3. iServer 成功返回 iServer 结果，iServer 失败才 fallback Python D\*Lite（`:107` `runEvacuationPlanning` → `/api/planning/evacuation`）。

**结论**：批量规划已经走 SuperMap iServer 主链路（SuperMap 优先 + Python fallback），原任务清单 F7 描述过时。当前主链路确为 SuperMap，符合红线"不把 Python 兜底写成 SuperMap 主链路"——现在 SuperMap 就是主链路，Python 是 fallback。

**潜在逻辑缺陷（待 F2 完成后深入核实）**：
`executeSuperMapNetworkAnalysis`（`:142-155`）对每个 exit 调 `requestSuperMapPath`（`Promise.allSettled`），返回**单条最优路径**（`reachableCandidates[0]`），不是每栋建筑一条路径。而 `runBatchEvacuationPlanning` 期望 `routesByBuilding`（每栋建筑一条）。可能批量模式实际只返回单建筑最优路径，需核实 `normalizeEvacuationBatch`（`:309`）如何把单条 result 转 batch 结构。

**当前状态**：部分核实。批量已走 SuperMap 主链路（符合用户要求）。批量"全建筑 vs 单建筑最优"逻辑缺陷待 F2 完成后深入核实——当前 iServer 链路因 F2 锚点错位而塌陷，批量逻辑缺陷无法实际验证。

**红线遵守**：F7 不冒充已修复，如实记录"批量已走 SuperMap 主链路 + 潜在单建筑逻辑缺陷待查"。不把 Python fallback 写成主链路（当前主链路确为 SuperMap iServer）。

---

### F7 - 现状摸清，待产品决策 - 2026-07-18

#### 核实结论（Explore agent 实锤）

原任务描述"批量规划已走 SuperMap 主链路"**不准确**。实情：

1. `normalizeEvacuationBatch`（useSmartMapEvacuationPlanningActions.ts:98-111）本身无缺陷——正确遍历 `routesByBuilding` 数组，`reachableCount` 正确统计。
2. **真问题在执行器侧**：批量 payload（useSmartMapEvacuationPlanningActions.ts:295-307）**缺 `startPoint`**，导致 `executeSuperMapNetworkAnalysis`（useSmartMapAlgorithmExecutors.ts:124-166）:134 `if (!startPoint || !exits.length) return null` 直接短路返回 null，SuperMap 分支**永远不执行**，`executeSmartMapEvacuationPlanning`（:106-107）回落 Python `runEvacuationPlanning`。
3. 即便给了 startPoint，`executeSuperMapNetworkAnalysis` 也只支持单起点→多出口，无多建筑批量逻辑（`normalizeSuperMapNetworkResult`:467 能识别 routesByBuilding 但上游从不构造，是死路径）。

#### 修复建议（待产品决策，未自动改）

三选一，需用户定夺：

- 方案 A：为批量 SuperMap 链路新增多起点循环（遍历 buildingEntrances，每建筑×园区出口 Promise.allSettled，聚合 routesByBuilding）—— 工作量大，但符合"supermap-preferred"语义。
- 方案 B：批量显式走 Python，前端显式跳过 SuperMap 分支并标注 executorPreference —— 与当前"supermap-network-analysis-first"语义矛盾，需产品确认批量场景 GIS 主链路归属。
- 方案 C（最小改动）：批量 payload 进 SuperMap 入口时判断 buildingEntrances 存在则直接返回 null 并显式记录原因，避免当前"因缺 startPoint 静默降级"的隐性行为。

#### 红线遵守

F7 标"现状摸清，待产品决策"。不夸大为"已修复"——只核实了真问题，未改代码（涉及设计取舍，等用户定夺）。明确原任务描述"批量已走 SuperMap 主链路"过时，实际走 Python 兜底。

---

### F7 - 方案 C 已实现 + 独立审查通过 - 2026-07-18

#### 决策与实现

用户选方案 C（最小改动，显式标注降级）。代码已实现，vue-tsc 通过。

改动位置：`frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts` 的 `executeSuperMapNetworkAnalysis` 函数（约 :124-150）。

改动内容：在 `normalizePoint(payload.startPoint)` 之后、原 `if (!startPoint || !exits.length) return null` 之前，加了批量场景判断：

```ts
const hasBuildingEntrances =
  Array.isArray(payload.buildingEntrances) &&
  payload.buildingEntrances.length > 0;
if (hasBuildingEntrances && !startPoint) {
  payload.superMapNetworkFailure =
    "批量疏散规划（多建筑）暂不支持 SuperMap 单起点网络分析，已显式降级 Python D*Lite（方案 C）";
  return null;
}
```

单建筑场景（有 startPoint）行为不变。

#### 独立审查结论（Explore agent，5 项全通过）

1. 逻辑正确：批量场景（`runBatchEvacuationPlanning`，`useSmartMapEvacuationPlanningActions.ts:295-307`，payload 有 buildingEntrances 无 startPoint）触发显式降级标注；单建筑场景（`runEvacuationPlanning`，:221-241，payload 有 startPoint）不受影响。
2. 透传链路：`payload.superMapNetworkFailure` 赋值后，`executeSmartMapEvacuationPlanning`（:104-122）Python 兜底分支 :115 `superMapNetworkFailure: String(payload.superMapNetworkFailure || '')` 透传到 `fallbackResult.executor.superMapNetworkFailure`，评委可见。
3. 副作用低风险：payload 是调用点新建对象（`createEvacuationPayload` :81-83 透传），mutate 不污染 ref/store/全局；与既有 :172/:223/:195 同模式（先例一致）。
4. 红线遵守：标注准确，代码注释与降级字符串均写"暂不支持→显式降级 Python"，未声称"批量已走 SuperMap"。实际仍走 Python，仅消除静默。
5. 无遗漏入口：`executeSuperMapNetworkAnalysis` 全仓 2 处调用（:105 和 `SuperMapSceneViewer.vue:1472`），后者经 `buildProjectedNetworkPayload`（:1563-1566）无 startPoint 直接返回 null，不进入批量降级判定。无遗漏。

#### 红线

F7 标"方案 C 已实现 + 独立审查通过"。不夸大为"批量已走 SuperMap 主链路"——实际批量仍走 Python，只是不再静默（降级原因透传可见）。如需批量真走 SuperMap，需实现方案 A（多建筑循环，见上文修复建议），工作量较大，当前不做。

---

## 附：本地算法服务启动修复（uv trampoline 坑，2026-07-18）

> 非 F1-F7 坐标系问题，属本地运行环境。记录在此因它阻塞 F2 实跑验证。

### 现象

`run-local.bat` 启动算法服务报 `Failed to spawn: uvicorn, 拒绝访问 (os error 5)`。`uv run --python python3.12.exe uvicorn algorithm.api_server:app` 无论经 git bash 还是 cmd.exe 调用，均 os error 5。

### 根因

- uv 0.11.14 在本机（Win11 26100）创建 venv 时，`.venv\Scripts\python.exe` 是 **45568 字节的 trampoline launcher**，非真实 python 拷贝。
- 该 trampoline 被系统拒访（PowerShell 显式报"拒绝访问"），但 ACL 无 Deny ACE、无 MOTW Zone.Identifier、Defender 无隔离记录。base python（`C:\Users\colorful\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe`，91648 字节）能正常跑出 `Python 3.12.13`。
- 结论：uv 的 trampoline 机制在本机被拦，非 venv 损坏、非 Defender、非权限。

### 修复

1. 删除 uv 创建的损坏 venv：`rmdir /s /q .venv`。
2. 用 base python 原生建 venv（`--copies` 强制拷贝真实 exe，不用 trampoline）：
   ```powershell
   & 'C:\Users\colorful\AppData\Roaming\uv\python\cpython-3.12-windows-x86_64-none\python.exe' -m venv .venv --copies
   ```
3. 验证：`.venv\Scripts\python.exe` 现 262144 字节，`--version` 输出 `Python 3.12.13`。
4. 装依赖：项目根 `pyproject.toml` 无 `[build-system]`，`uv pip install -e ".[yolo]"` 会触发 setuptools 包发现失败。改用直接装依赖列表（不装项目本体，项目走 PYTHONPATH）：
   ```
   uv pip install --python .venv/Scripts/python.exe fastapi uvicorn numpy ... torch torchvision ultralytics opencv-python
   ```
5. 启动算法服务（绕开 `uv run`，直接用原生 venv python）：
   ```
   .venv\Scripts\python.exe -m uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000
   ```

### 红线

此修复仅解决"算法服务在本机起不来"，与 F2 坐标系验证无因果。F2 验证仍需算法服务起来后实跑单建筑疏散回收 `[F2]` 探针日志，不能用"服务起来了"冒充"F2 已验证"。验证状态以 F2 条目"待验证步骤"为准。

---

## 红线（Codex 必须遵守）

1. **不冒充已修复**：每条修复必须有可复现的验证证据（命令输出/截图描述），否则状态填"未修复"或"阻塞"。
2. **不夸大坐标系一致性**：当前 `3D-chemical_park_cgcs2000/rest/realspace` 仍 404（见 `docs/supermap-algorithm-2d-compute-3d-visualization-plan.md` 第 8 节），prod 本地 S3M 模式是已知不诚实状态。修复 F1/F2 后若仍在此模式下，须如实写明"仅 dev 球面模式验证通过，prod 受 Realspace 未发布阻塞"。
3. **不把 Python 兜底写成 SuperMap 主链路**：F7 明确，批量规划当前是 Python，报告里不能写"SuperMap 批量网络分析已完成"。
4. **不伪造路网拓扑质量**：F6 的拓扑复核是 iDesktopX 任务，前端只加校验，不写"路网拓扑已修复"。
5. **改动前先核实待核实项**：F1/F2 标注的"待 Codex 核实"必须先跑实际请求确认坐标量级，再决定修复方向，不要凭推测改。

---

## 2026-07-23 单人疏散路径与二维导航复核

### 路网可用性（已核实）

- 直接读取远端 `Park_RoadNetworkEdge_L` 索引得到 `featureCount=93`；按每批6条请求后实际读取93条道路边。
- 93条边覆盖15个 `ROADID`，全部锚定 `HAUT_Lianhua_SouthGate_CP0`，本地坐标范围为 `x=[119,1407.1]`、`y=[118,818.1]`，与 `realMapAssets` 的园区本地坐标范围相容。
- 这证明可用的 **iServer矢量路网** 已被读取和审计；不等于3D Tiles网格已完成道路/建筑/设备语义拆分，后者仍未完成。

### 单人路径主链路（已验证）

- `SuperMapSceneViewer` 仅在用户已选人员起点、`path.rjson`返回路径且`pathGuideItems`中存在`isEdge=true`道路引导边时绘制路径；失败时不显示本地伪造路线。
- `scripts/playwright-verify-supermap-road-route.cjs`单页面复测：返回8个路径点、7条道路引导边，`networkVerification.valid=true`，执行器为`SuperMap iServer Transportation Analyst`。
- iServer代理曾对入口索引返回瞬时500；`useSuperMapIserverData.ts`现对500/502/503/504采用3次、每次12秒上限的有限重试，非临时状态码仍立即失败。
- 单人规划不再预先全量读取入口要素再做二次匹配：用户选定的模型出口直接经D锚点转换后交由`path.rjson`吸附。原因是入口单要素接口可偶发超时；最终的`isEdge=true`校验仍是路线显示前提。

### 二维导航小窗（已验证）

- 新增`RouteNavigationInset.vue`，右上角在真实二维DOM底图上显示路线；数据仅来自三维已验收结果的同一组本地路径点，不重算第二条路线。
- 单页验收中小窗显示4点路线和南侧集合点出口；三维实体与二维折线同时由同一条`path.rjson`结果驱动。

### 未完成/风险

- 本次验证中3D Tiles加载统计为46个内容、0个失败，但主三维画面仍未稳定显示建筑细节；近景坏瓦片与模型语义分层不能标为已解决。
- iDesktopX路网拓扑复核仍未完成；`isEdge=true`证明路线来自网络边，不单独证明逆行、穿墙等拓扑质量。

---

## 2026-07-23 3D Tiles 道路控制点复核

- 读取 `Park_RoadNetworkEdge_L` 全部93条要素：每条同时提供 `LOCALMAPX/Y` 与 `S3MX/Y`。使用 `REAL_MAP(1587.2×947.2)` 与 `LOCAL_S3M_BOUNDS` 的无展示偏移仿射变换复算后，全量最大残差为 `0.00049m`。
- 已据此修正3D Tiles路径/传感器的二维本地坐标到模型源坐标转换；旧 `LOCAL_S3M_BUSINESS_OFFSET.x=260` 仅适用于旧展示，不再用于3D Tiles。
- 单人路径样本直接请求 `path.rjson`：起点 `(458520.343,3855726.172)` 到出口 `(458436.343,3855726.172)` 返回3条 `isEdge=true` 道路边，权重181m；4个路径节点对93条道路折线的最大距离为 `7.1e-15m`。
- 前端在调用 `path.rjson` 前、路径渲染前均使用同一份 `Park_RoadNetworkEdge_L`：先做起终点吸附，再对回传路径逐点做3m阈值贴路校验；不通过即拒绝绘制。

### 红线

这证明二维网络路径与模型源S3M坐标的道路控制点一致，**不证明** b3dm 已完成道路/建筑/设备语义拆分，也不证明近景瓦片问题已解决。
