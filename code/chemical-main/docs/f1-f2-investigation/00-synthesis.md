# F1/F2 综合判定与修复方向

> 生成时间：2026-07-18
> 基于：01-payload-builder.md、02-iserver-executor.md、03-coord-transform.md 三份核实报告 + 主控对 dstar_lite.py/roadRectFromLine 的源码复核
> 原则：如实说明，不夸大，不冒充已修复。每条结论附 file:line 证据。

---

## 0. 两条链路澄清（关键，原任务描述混淆了）

化工园区疏散有**两条独立链路**，F1/F2 分属不同链路，原任务清单未区分：

| 链路 | 触发 | 执行 | payload 坐标系 | path 输出坐标系 | 落图前处理 |
|---|---|---|---|---|---|
| **A. Python D* Lite** | `runEvacuationDemo` fallback / 批量 | `algorithm/api_server.py:537` → `dstar_lite.py:plan_evacuation_route` | 本地米制（0~1587） | **本地米制**（graph.nodes 直接用 payload.roads 的 x/y，dstar_lite.py:644-690） | 无需转换，直接落图 |
| **B. SuperMap iServer** | `runSuperMapNetworkEvacuation`（单建筑主链路） | `useSmartMapAlgorithmExecutors.ts:executeSuperMapNetworkAnalysis` → iServer `path.rjson` | 投影 CGCS2000（经 `buildProjectedNetworkPayload` 包装，SuperMapSceneViewer.vue:1551-1577） | **CGCS2000 投影**（E≈469000/N≈3843000，与 iServer 数据集同系） | 视图层手动 `projectedToLocal` 逆变换（SuperMapSceneViewer.vue:1476/1518） |

- **F1 指向链路 A 的 payload**（`buildSuperMapCupEvacuationPayload` 标 coordSys=CGCS2000 但数据是本地系）。
- **F2 指向链路 B 的 iServer 返回**（CGCS2000 投影坐标的处理）。
- 原任务"后端是否依赖 coordSys 转换"指的是 Python 算法服务（链路 A），不是 Java 后端（Java 不处理疏散，01 报告第 0 节已澄清）。

---

## F1 判定

### 事实（已核实）
1. `buildSuperMapCupEvacuationPayload`（supermapCupScenario.ts:221-240）顶层 `coordSys = "CGCS2000_3GK_CM_114E / EPSG:4547"`（:237，来自 :101）。
2. 但 `roads`/`startPoint`/`parkEntrances` 全部是 0~1587 量级本地米制（realMapAssets.js:48-64/:23/:100-105），`toAlgorithmRoad`（:465-474）仅透传不转换，全函数不调用 `localToProjected`。
3. payload 同时带 `map.sourceCoordSys = "PCS_NON_EARTH_LOCAL_METER"`（:121），如实声明真实来源系。
4. **Python 算法服务全目录 grep `coordSys|sourceCoordSys|CGCS2000|PCS_NON_EARTH|localToProjected` 零匹配**（01 报告第 6 节 + 主控复核）。`dstar_lite.py:118-160` 直接取 `startPoint`/`parkEntrances`/`roads` 的 x/y 建图，`resolve_map_meters_per_unit`（:156-160）只读 `mapMetersPerUnit`，不读 `coordSys`。
5. `build_route_result`（dstar_lite.py:644-690）path 点来自 `graph.nodes`（本地系）和 `start_access.roadPoint`（本地系），**输出本地米制 path**。

### 判定：**标注与数据不一致（字段语义错配），但当前功能不出错**

- 顶层 `coordSys` 标 CGCS2000，实际数据是本地米制——**矛盾属实**。
- 但 Python 算法服务**不读 coordSys**，在本地系内自洽建图、输出本地系 path，**当前不会因 F1 矛盾算错路径**。
- 风险是**误导性**：若下游按字面信任顶层 `coordSys`，把 0~1587 当 46 万级投影值叠加外部 GIS 数据，会错位三个数量级。但当前无此下游。

### F1 修复方向：**方案 A（改标注，最小改动）**

将顶层 `coordSys` 改为如实标注本地系，消除与数据的矛盾：
- 顶层 `coordSys` 改为 `map.sourceCoordSys` 的值（`PCS_NON_EARTH_LOCAL_METER`），或拆成 `coordSys`（实际系=本地）+ `targetCoordSys`（目标系=CGCS2000）两字段。
- 不改 roads/startPoint 数据（保持本地系，与 Python 算法服务现状兼容）。
- 不改 Python 服务（它不读 coordSys，改标注无副作用）。

**不选方案 B**（构造时 `localToProjected` 转投影）：会破坏 Python dstar_lite 的本地系建图逻辑，代价大、收益为零（Python 根本不读坐标系）。

### F1 验证方法
- 改后 grep 确认顶层 `coordSys` 字符串变了、payload 数据不变。
- 跑一次 Python 疏散请求，确认 path 仍是本地米制（0~1587 量级）、距离/时间不变。
- 不需要双环境验证（F1 只影响标注，不影响渲染）。

### F1 状态：**待修复（方案 A）**。代码层已核实完毕，可直接改。

---

## F2 判定

### 事实（已核实）
1. iServer `path.rjson` 请求经 `buildProjectedNetworkPayload`（SuperMapSceneViewer.vue:1551-1577）包装：`startPoint`/`roads`/`parkEntrances` 先 `localToProjected`（supermapGeoreference.js:69-76）转成 CGCS2000 投影（E≈469313~470107, N≈3842863~3843337，dev anchor）再发给 iServer。
2. iServer 数据集 `Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000`（.env.development:37）是 CGCS2000 系，返回 path 点坐标系 = 数据集坐标系 = **CGCS2000 投影**（E≈469000/N≈3843000 量级）。
3. `extractSuperMapPath`（useSmartMapAlgorithmExecutors.ts:399-417）仅 `normalizePoint` 取数，**无坐标系转换、无坐标系字段标注**，CGCS2000 投影点原样塞进 `AlgorithmRecord.path`，类型却标为 `SuperMapCupMapPoint`（语义上是本地系）——**类型与数据系不符**。
4. `executeSuperMapNetworkAnalysis` 返回的 result **无 `pathCoordSys`/`coordSys`/`epsg` 字段**（02 报告第 4 节 grep 零匹配）。
5. **救赎**：视图层 `runSuperMapNetworkEvacuation`（SuperMapSceneViewer.vue:1476）/`runSuperMapClosestDeviceAnalysis`（:1518）在拿 result 后**手动 `projectedToLocal`**（supermapGeoreference.js:78-85）把投影 path 转回本地系，再塞回 `result.path`。`drawEvacuationOverlay`（:1881）取到的是本地系 path，落图正确。
6. `resolveRoutePath`（supermapCupScenario.ts:269-276）/`asMapPoint`（:476-483）**无量级探测、无坐标系判定**，原样透传。

### 判定：**数据层未正确处理（无自描述字段），视图层靠手动逆变换补救，dev 闭环正确但脆弱**

- **数据层（执行器）**：未正确处理。无坐标系标注、无显式转换，iServer CGCS2000 投影坐标被类型标注为本地系 `SuperMapCupMapPoint`。
- **视图层（落图）**：当前正确。`runSuperMapNetworkEvacuation` 手动 `projectedToLocal` 逆变换后落图。
- **dev 球面模式**：闭环正确（前提：iServer 返回的投影点与 dev anchor 469313.780 同系）。dev 实际走 threeTiles 分支（SuperMapSceneViewer.vue:561-563 短路 shouldUseThreeDTiles=true），非任务描述的 mapPointToGeo 球面分支。
- **prod 本地模式**：存在 **anchor(469313.780) 与 2D bounds(457752.343) 错位约 16km** 的隐患（.env.production:30-33 vs supermapGeoreference.js:24 硬编码 anchor）。若 prod iServer 数据集跟随 2D bounds 系（457752），则输入侧用 469313 anchor 投影出的起点会与数据集错位 16km，iServer 可能吸附失败或返回错误路径。

### 关键不确定项（必须跑实际请求确认，不能凭推测改）

**iServer 返回的 path 点是 469313 系（dev anchor，闭环正确）还是 457752 系（prod 2D bounds，错位 16km）？**

这是 F2 修复方向的最终判据：
- 若返回 469313 系：dev/prod 都闭环正确（prod anchor 硬编码 469313，逆变换回本地系量级对，只是地理位置整体偏移 16km——但 prod 本地模式本就不展示真实地理位置，只看相对路径）。
- 若返回 457752 系：dev 会因 anchor 不匹配导致 `projectedToLocal` 算出负几万本地坐标，路径飘到南极大西洋（02 报告 6.5 节推算 lon=-12.9°/lat=-72.8°）。

### F2 修复方向（两步，先加自描述字段，再按实际返回决定是否补量级探测）

**第一步（无条件做，消除脆弱性）**：执行器 `executeSuperMapNetworkAnalysis` 返回 result 时带 `pathCoordSys: 'CGCS2000_3GK_CM_114E / EPSG:4547'` 字段（02 报告建议方案 B）。让数据自描述坐标系，不再靠视图层隐式约定。

**第二步（依赖第一步 + 实际请求确认）**：
- 在 `resolveRoutePath` 或 `runSuperMapNetworkEvacuation` 的逆变换处，按 `pathCoordSys` 字段决定是否 `projectedToLocal`（字段=CGCS2000 则转，字段=LOCAL 则不转）。
- 若实际请求确认 iServer 返回 457752 系（与 dev anchor 不匹配），则需在 `buildProjectedNetworkPayload` 用 prod 2D bounds 的 anchor（457752.343/3855297.972）而非硬编码 469313.780 投影——但这会牵动 `supermapGeoreference.js` 的 anchor 常量，影响面大，需单独立项。
- 若返回 469313 系，第二步只需补字段 + 按字段转换，不动 anchor。

### F2 验证方法（必须做，是修复方向判据）
1. 起 iServer 服务 + 前端 dev server。
2. 在 `extractSuperMapPath`（useSmartMapAlgorithmExecutors.ts:399）入口加 `console.log('[F2] iServer path raw', pathResult?.pathList?.[0]?.route?.geometry?.points?.[0])` 打印前 3 个点。
3. 在 `runSuperMapNetworkEvacuation`（SuperMapSceneViewer.vue:1476）`projectedToLocal` 前加 `console.log('[F2] projected path[0]', projectedPath[0])`，`projectedToLocal` 后加 `console.log('[F2] local path[0]', localPath[0])`。
4. 触发单建筑疏散，读控制台：
   - 若 projected path[0] 量级 E≈469000/N≈3843000 → iServer 返回 469313 系，dev 闭环正确，F2 只需加自描述字段。
   - 若 projected path[0] 量级 E≈457000/N≈3855000 → iServer 返回 457752 系，dev 会飘，需补 anchor 对齐（单独立项）。
   - 若 local path[0] 量级 0~1587 → 逆变换正确，落图应贴合。
5. 截图三维场景，确认路径起点落在选定建筑门口、终点落在园区出口。

### F2 状态：**待修复**。代码层核实完毕，但**修复方向第二步依赖实际请求确认 iServer 返回坐标系**，不能凭推测改。

---

## 阻塞清单

| 阻塞项 | 影响 | 解除方式 |
|---|---|---|
| iServer 服务是否在本地运行 | F2 验证步骤无法执行 | 起 iServer 或确认远程地址（.env 的 /supermap-iserver 代理指向哪） |
| `3D-chemical_park_cgcs2000/rest/realspace` 仍 404 | prod 本地 S3M 模式无法验证 | iDesktopX 发布 realspace 服务（非代码任务） |
| prod anchor 与 2D bounds 错位 16km | prod 落图可能整体偏移 | 需单独立项决定 anchor 统一到哪个系 |

---

## 给主控的建议（执行顺序）

1. **先改 F1（方案 A，纯标注，零风险）**：supermapCupScenario.ts:237 顶层 coordSys 改标注。改完跑 Python 疏散确认无副作用。回填修复记录。
2. **F2 第一步（加自描述字段，低风险）**：executeSuperMapNetworkAnalysis 返回带 pathCoordSys，runSuperMapNetworkEvacuation 按字段决定是否 projectedToLocal。改完代码先不验证（依赖 iServer）。
3. **跑实际请求（F2 验证判据）**：起 iServer，按 F2 验证方法加 console.log，确认 iServer 返回坐标系。**这一步决定 F2 第二步方向**。
4. **F2 第二步（按实际返回决定）**：若 469313 系，补字段+按字段转换即可；若 457752 系，记录 anchor 错位问题，F2 标"部分修复，anchor 错位单独立项"。
5. F3/F4/F5/F6/F7 按 F1/F2 之后顺序推进。

**红线遵守**：F2 在实际请求确认前，不写"已修复"，只写"代码层已加自描述字段，待实际请求验证 iServer 返回坐标系"。
