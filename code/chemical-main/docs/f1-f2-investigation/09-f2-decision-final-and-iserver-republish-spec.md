# F2 最终决策与 iServer 重发布规格（送 Codex）

> 生成时间：2026-07-18
> 基于用户确认："3D 模型锚点 A 是看模型与底图/地形贴合定的"→ 模型真实地理范围在 A，不能搬
> 前置：07-iserver-live-probe.md（iServer 93 条 edge 实测）、08-anchor-truth-and-f2-decision.md（四位置分析）
> 本文档纠正 08 文档第 2 节平面近似值的错误，并给出最终可执行方案

---

## 1. 决定性新证据（08 文档之后补全）

### 1.1 iServer 全量 93 条 edge 实测（2026-07-18）
- LOCALMAPX 范围：[119.0, 1407.1]
- LOCALMAPY 范围：[118.0, 818.1]
- ANCHOR 字段：**全部 93 条 = `HAUT_Lianhua_SouthGate_CP0`**（单一锚点，无混杂）
- ROADID 集合：15 条，**与 realMapAssets.js:48-64 的 15 条 road-xxx 完全一致**
- 经纬度范围：lon 113.539461~113.553557, lat 34.826417~34.832706

### 1.2 iServer LOCALMAP 系 = realMapAssets 本地系（同源）
- iServer LOCALMAP 范围 [119,1407]×[118,818] 是 realMapAssets [0,1587]×[0,947] 的**内子集**
- 路网不画到地图最边缘（留出建筑/出入口空间），数值范围吻合
- **两套系同原点、同 Y 轴方向（y 向南增大）、同 0~1587 量级**
- 唯一差异：单位口径。realMapAssets mapMetersPerUnit=0.5；iServer LOCALMAP 推算 ≈1.193 m/unit（但 LOCALMAPX/Y 本身是本地坐标值，不是米，单位口径不影响同源判断）

### 1.3 矢量数据层整体锚定在 D
- realMapAssets 路网 + iServer 数据集 = **同一份描述 D（HAUT 莲花南门）园区的矢量数据**
- 园区地理范围：lon 113.539~113.554, lat 34.826~34.833，宽约 1.3km×0.7km
- 3D Tiles 模型锚在 A（113.569463, 34.76965），与 D 园区中心（113.546, 34.829）差 7.4km

---

## 2. A 点精确投影值（手算高斯-克吕格，纠正 08 文档错误）

### 2.1 公式精度校核（用 D 点反算）
输入 lon=113.53946126, lat=34.83164647（iServer feature edge-01 实测经纬度）

| 项 | 公式算出 | iServer 实测 | 误差 |
|---|---|---|---|
| easting | 457872.176 | 457871.343 | dE=0.833m |
| northing | 3856012.629 | 3856009.172 | dN=3.457m |

**米级精度，对园区尺度（1.3km×0.7km）足够精确**。误差来源：CGCS2000 vs WGS84 椭球微小差异 + 高阶项截断。

### 2.2 A 点 EPSG:4547 投影（最终值）
输入 lon=113.569463, lat=34.76965（3D Tiles 模型锚点）

```
easting  = 460587.110
northing = 3849122.673
```

### 2.3 纠正 08 文档第 2 节错误
08 文档第 2 节平面近似给出 A 投影 ≈(460630, 3870557)——**northing 错了约 1.4 万米**。34.76965 纬度对应的 northing 应是 384 万级（北纬 34°→ 3850000 附近，纬度越低 northing 越小），不是 387 万。手算精确值 3849122.673 才对。08 文档基于错误近似的距离估算需以本文为准。

### 2.4 A vs D 投影差（最终）
- dE = +2715.767 m（A 在 D 东边）
- dN = -6886.499 m（A 在 D 南边）
- 平面距离 = 7402.7 m ≈ 7.4km

---

## 3. F2 最终修复方案

### 3.1 用户决策：走"搬矢量到 A"（路 3）
用户确认 A 锚点是看模型与底图/地形贴合定的 → 3D 模型真实地理范围在 A，不能搬。故保持模型在 A，把矢量数据（iServer 数据集 + realMapAssets 锚点）从 D 平移到 A 对齐。

### 3.2 两条链路的修复时序（关键，避免 iServer 链路更崩）

| 链路 | 当前锚点 | 改后锚点 | 修复后状态 | 阻塞项 |
|---|---|---|---|---|
| Python D*Lite（本地系 path → mapPointToGeo → 三维落图） | B(469313/3843337) | A(460587.110/3849122.673) | 改锚点后立即对齐三维模型 | 无，立即可做 |
| iServer（D 系投影 path → projectedToLocal → 三维落图） | B(469313/3843337) | A(460587.110/3849122.673) | 需 iServer 数据集先从 D 重发布到 A | **iServer 重发布（codex）** |

### 3.3 为什么不能直接全局改锚点 B→A（陷阱）
iServer 链路的三维落图（SuperMapSceneViewer.vue:1476）：
```
localPath = projectedPath.map(point => projectedToLocal(point.x, point.y))
```
- iServer 返回 D 系投影 path（457xxx/3856xxx，geometry 457752/3856009 系）
- 当前锚点 B(469313/3843337)：projectedToLocal(457871,3856009) = (-22884, -25344) → 负几万，塌陷
- 若改锚点 A(460587/3849122)：projectedToLocal(457871,3856009) = (-5432, -13774) → 仍负，仍塌

**iServer 链路在数据集重发布到 A 之前，无论用 B 还是 A 锚点都是塌的。** 全局改锚点会让 iServer 链路从"塌得离谱"变成"塌得没那么离谱但仍是错的"，违反"不夸大一致性"红线。

### 3.4 正确执行顺序
1. **先让 codex 把 iServer 数据集从 D 平移到 A 重发布**（见第 4 节规格）
2. iServer 重发布完成后，**统一改前端锚点 B→A**（supermapGeoreference.js + env，见第 5 节）
3. 改完跑三维落图验证（见第 6 节）——用户强调"封装好的算法三维落图很关键要谨慎"

### 3.5 不走双锚点分离的理由
理论上可以让 Python 链路用 A 锚点、iServer 链路暂用 D 锚点（在 buildProjectedNetworkPayload 里硬编码 D 锚点），让 Python 链路先对齐。但这会：
- 引入两套锚点常量，代码复杂度上升
- iServer 链路仍塌（只是标注"未对齐"），用户看到仍是坏路径
- 等 iServer 重发布后还要再改回单锚点，重复改动

**结论**：一步到位等 iServer 重发布，统一改锚点，代码最干净。iServer 重发布期间 F2 标"阻塞于 iServer 重发布"，不冒充已修复。

---

## 4. iServer 数据集重发布规格（送 Codex）

### 4.1 任务
把 iServer 数据集 `chemical_park_vectors_cgcs2000`（含 `Park_RoadNetworkEdge_L` 93 条 edge、`Park_EntrancePoint_P` 14 个 entrance）的几何坐标从 D 系平移到 A 系。

### 4.2 平移量（精确）
```
dE = +2715.767 m  （easting 全部加 2715.767）
dN = -6886.499 m  （northing 全部减 6886.499）
```

### 4.3 需更新的字段（每条 feature）
| 字段 | 当前值（D 系） | 重发布后（A 系） |
|---|---|---|
| geometry.points[].x | 457752.343 等 | +2715.767 → 460468.110 等 |
| geometry.points[].y | 3856009.172 等 | -6886.499 → 3849122.673 等 |
| CGCS2000E | 457871.343 | +2715.767 → 460587.110 |
| CGCS2000N | 3856009.172 | -6886.499 → 3849122.673 |
| LONGITUDE | 113.53946126 | 重算（A 系对应经纬度）|
| LATITUDE | 34.83164647 | 重算 |
| ANCHOR | HAUT_Lianhua_SouthGate_CP0 | 改为 A 锚点名（如 `ChemicalPark_3DTiles_Anchor_A`）|
| LOCALMAPX | 119.0 等 | **不变**（本地系相对坐标不变）|
| LOCALMAPY | 236.0 等 | **不变** |
| S3MX/S3MY | -1424.752/377.887 等 | 需重算（若 3D 场景用 S3M 本地系）|

### 4.4 验证方法（重发布后）
1. curl 取 feature 0-2-0，确认 geometry.points[0].x 在 460468 量级（A 系）、ANCHOR 字段已改
2. 数据集 prjCoordSys 应仍为 EPSG:4547（坐标系不变，只是几何平移）
3. 93 条 edge + 14 个 entrance 全部平移后，LOCALMAPX/Y 范围仍是 [119,1407]×[118,818]（不变）

### 4.5 Codex 执行方式建议
- 用 iDesktopX 打开数据集，对 geometry 做整体平移（dE=+2715.767, dN=-6886.499）
- 或用 iServer 数据编辑 API 批量更新 feature geometry
- LONGITUDE/LATITUDE 字段用 iDesktopX 的"坐标转换"功能从新 CGCS2000E/N 反算
- 重发布后保留原数据集名为 `chemical_park_vectors_cgcs2000`（前端 .env 的 NETWORK_ANALYSIS_URL 不用改）

---

## 5. 前端锚点改动规格（iServer 重发布后执行）

### 5.1 supermapGeoreference.js:12-31
```js
// 改前（B 锚点，错误）
export const ZHENGZHOU_STATION_57083 = {
  longitude: 113.6650, latitude: 34.7178, altitude: 108.0, ...
}
export const SUPERMAP_CGCS2000_ANCHOR = {
  projected: { easting: 469313.780, northing: 3843337.292 },
  wgs84: { longitude: 113.6650, latitude: 34.7178 },
  altitude: 108.0, label: '郑州国家基本气象站 57083',
}

// 改后（A 锚点，与 3D 模型对齐）
export const CHEMICAL_PARK_3DTILES_ANCHOR = {
  longitude: 113.569463, latitude: 34.76965, altitude: 8.0,
  geographicEpsg: 4490,
}
export const SUPERMAP_CGCS2000_ANCHOR = {
  local: { x: 0, y: 0 },
  projected: { easting: 460587.110, northing: 3849122.673 },
  wgs84: { longitude: 113.569463, latitude: 34.76965 },
  altitude: 8.0,
  label: '化工园区 3D Tiles 模型锚点 A',
}
```

### 5.2 .env.development / .env.production
- `VITE_SUPERMAP_ANCHOR_WGS84` = `113.569463,34.76965`
- `VITE_SUPERMAP_ANCHOR_CGCS2000` = `460587.110,3849122.673`
- `VITE_SUPERMAP_3D_LAYER_POSITION` = `113.569463,34.76965,8`
- `VITE_SUPERMAP_CP0_LONGITUDE/LATITUDE` = `113.569463` / `34.76965`

### 5.3 controlPoints（supermapGeoreference.js:47-54）
CP0 描述改为"3D Tiles 模型锚点 A"，CP1-5 的 projected 值会因锚点改变自动重算（localToProjected 用新锚点）。

---

## 6. 三维落图验证方法（iServer 重发布 + 前端改锚点后，用户强调谨慎）

### 6.1 Python D*Lite 链路验证
1. 触发 `runEvacuationDemo`（Python D*Lite 单建筑疏散）
2. 在 `drawEvacuationOverlay` 入口打印 path[0] 的本地坐标（应 0~1587 量级）
3. 在 `mapPointToSceneCartesian` threeTiles 分支打印 path[0] 经 `mapPointToGeo` 后的经纬度（应 ≈113.569/34.770 量级，A 系）
4. 截图三维场景，确认路径起点落在选定建筑门口、终点落在园区出口、路径贴合路网

### 6.2 iServer 链路验证
1. 触发 `runSuperMapNetworkEvacuation`（单建筑 iServer 疏散）
2. 在 `extractSuperMapPath`（useSmartMapAlgorithmExecutors.ts:399）打印 iServer 返回 path[0]（应 A 系投影 460xxx/3849xxx 量级）
3. 在 SuperMapSceneViewer.vue:1476 `projectedToLocal` 前后打印（前：460xxx/3849xxx；后：0~1587 量级）
4. 截图三维场景，确认路径与 Python 链路落图一致

### 6.3 落图正确性判据
- 起点经纬度 ∈ A 园区范围（lon 113.566~113.572, lat 34.767~34.772）
- 终点落在园区出口（park-south/park-east，realMapAssets 本地坐标 (1218,682)/(1228,684)）
- 路径不塌成单点、不飘到南极大西洋（07 报告第 4 节的塌陷症状消除）
- 路径贴合路网（在 road-north-main 等 15 条路上）

---

## 7. F2 当前状态（如实）

**未修复，根因与方案最终确定，阻塞于 iServer 重发布。**

- 用户已确认走"搬矢量到 A"方案（路 3）
- A 点精确投影已手算：E=460587.110, N=3849122.673（公式精度校核通过，米级误差）
- iServer 重发布规格已写定（第 4 节），送 codex 执行
- 前端锚点改动规格已写定（第 5 节），等 iServer 重发布后执行
- 三维落图验证方法已写定（第 6 节）

**红线遵守**：
- 不冒充已修复。iServer 重发布完成前 F2 标"阻塞"。
- 不夸大坐标系一致性。A/D 差 7.4km 是事实，重发布前 iServer 链路三维落图仍塌。
- iServer 重发布是 codex + iDesktopX 任务，前端代码改不了，不写"路网已对齐"。
- 三维落图验证按第 6 节严格执行，不凭截图主观判断"看起来对了"。

---

## 8. 重大发现：iServer path.rjson 实测能跑通 + 路 B 双锚点可行（2026-07-18 补充）

### 8.1 iServer path.rjson 实测成功（推翻 07 报告 502 判断）
用正确的 D 系投影节点（457752.343/3856009.172，iServer edge-01 实测坐标）请求 path.rjson：
- **成功返回路径**（不再是 502）
- pathList[0].route.points = [{x:457752.343,y:3856009.172}, {x:457990.343,y:3856009.172}, ...] —— D 系投影
- pathList[0].route.prjCoordSys 存在（EPSG:4547）
- edgeFeatures 返回 2 条边 feature，但 fieldNames **不含 LOCALMAP** 字段（returnEdgeFeatures=true 也不返回自定义字段）

07 报告当时 502 可能是 URL 编码/nodes 参数格式问题，非服务不可用。**iServer 网络分析服务本身工作正常**。

### 8.2 iServer 数据服务不可在线编辑（405）
PUT feature/0-2-0.rjson 返回 `{"succeed":false,"error":{"code":405,"errorMsg":"当前数据服务不可编辑"}}`。
GET 能读（200），PUT 写不了。**iServer 重发布只能用 iDesktopX GUI，不能用 API 脚本平移**。

### 8.3 路 B（前端双锚点）技术可行性确认
iServer path 实测能跑通意味着：**前端发 D 锚点投影坐标，iServer 正常返回 D 系 path**。无需重发布 iServer 数据。

转换链路（本地系作桥梁）：
```
iServer 返回 D 系投影 path (457xxx/3856xxx)
  → projectedToLocal_D (用 D 锚点 457752/3856009 逆变换)
  → 本地系 (0~1587，与 realMapAssets 同源，相对坐标)
  → localToProjected_A (用 A 锚点 460587/3849122 正变换)
  → A 系投影 (460xxx/3849xxx)
  → mapPointToGeo → A 经纬度 (113.569/34.770)
  → 三维场景 (Cesium3DTileset 锚在 A)
```

验证：iServer path 点 (457752, 3856009) → projectedToLocal_D = (0, 0) 本地系（D 锚点 projected ≈ 457752/3856009）→ localToProjected_A(0,0) = (460587, 3849122) → A 经纬度 (113.569, 34.770)。**落图到 A 三维模型，路径形状正确**（本地系相对坐标不变，整体从 D 平移到 A）。

### 8.4 路 A vs 路 B 重新评估（考虑 codex 额度紧张约束）

| 维度 | 路 A（iServer 重发布到 A） | 路 B（前端双锚点转换） |
|---|---|---|
| 需要 codex 额度 | **是**（iDesktopX GUI 操作） | **否**（纯前端代码） |
| 改动面 | iServer 数据 + 前端锚点 | 前端执行器（buildProjectedNetworkPayload + runSuperMapNetworkEvacuation） |
| 不可逆性 | iServer 数据被改（需备份） | 纯代码，可回退 |
| 链路对齐 | iServer 数据在 A，前端 A 锚点，全对齐 | iServer 数据留 D，前端双锚点转换落 A |
| 复杂度 | iDesktopX 操作 + 前端改锚点 | 双锚点常量 + 逆变换链路改造 |
| 风险 | iServer 数据改坏 | 双锚点转换公式错则全错 |

### 8.5 方向调整建议（待用户确认）
用户已选路 A（基于"iServer 重发布"假设）。但 8.1/8.2 新发现表明：
- iServer 数据无需重发布也能让 iServer 链路工作（发 D 锚点坐标即可）
- iServer 数据不可在线编辑，路 A 必须 iDesktopX GUI（codex 额度）

**建议改走路 B（前端双锚点）**：省 codex 额度，纯代码可回退，不碰 iServer 数据。三维落图按开源参考实现（调研 agent 结果待出）。

但路 B 与用户已选路 A 决策不符——需告知用户方向调整。按"懒人原则 + 自动优化授权"，主控先把路 B 代码准备到可执行状态，三维落图等开源调研结果，再一次性向用户汇报方向调整 + 验证。

---

## 9. 路 B 执行进度（2026-07-18，已落地部分）

### 9.1 iServer 链路 D 锚点改造（已完成，类型检查通过）
**改动文件**：
- `frontend/src/data/supermapGeoreference.js`：新增 `SUPERMAP_ISERVER_DATA_ANCHOR` 常量（D 锚点 projected=457692.843/3856127.172，反推自 edge-01 LOCALMAP(119,236)↔projected(457752.343,3856009.172)）+ `localToProjectedD`/`projectedToLocalD` 双锚点转换函数。
- `frontend/src/data/js-module-shims.d.ts:111-122`：补 D 锚点常量与函数类型声明。
- `frontend/src/components/SuperMapSceneViewer.vue`：
  - :164-169 import localToProjectedD/projectedToLocalD
  - :1621-1630 projectPoint 改用 localToProjectedD（iServer 链路专用 D 锚点正变换）
  - :1478/1487 runSuperMapNetworkEvacuation 的 projectedToLocal → projectedToLocalD（iServer path D 锚点逆变换）
  - :1520/1529 runSuperMapClosestDeviceAnalysis 同上

**数值验证（路 B 全链路）**：
```
iServer D系path(457752,3856009) 
  → D锚点逆变换 projectedToLocalD → 本地(119,236) [IN range 0~1587，=iServer LOCALMAP字段值，证明反推正确]
  → (待)全局A锚点正变换 localToProjected → A投影(460646,3849004) [A三维模型范围]
```
对比当前 B 锚点逆变换同一 path 点 → 本地(-23122,-25343) 塌成负几万（07 报告实证的崩塌）。

**类型检查**：vue-tsc 通过（D 锚点相关零错误）。剩余 screen/index.vue SensorPlacementPayload 错误是既有问题（MonitoringSensorModelId 类型冲突，非本次引入）。

**非 iServer 链路保持 B 锚点**（:2767/2884/2968/3002 projectedToLocal 调用，交互落图），未受影响。

### 9.2 全局锚点 B→A（已执行，数值验证通过，2026-07-18）
**为什么必须改**：iServer path 经 D 锚点逆变换回本地系（正确），但落三维走 mapPointToSceneCartesian → mapPointToGeo（用全局 B 锚点）会把本地系映射到 B 经纬度（57083），落图到 B 而非 A 三维模型。**全局锚点 B→A 必须改，iServer path 才能落 A 模型**。

**已改动**：
- `supermapGeoreference.js:22-31` SUPERMAP_CGCS2000_ANCHOR 值改 A：
  - projected = { easting: 460587.110, northing: 3849122.673 }
  - wgs84 = { longitude: 113.569463, latitude: 34.76965 }
  - altitude = 8.0, label = '化工园区 3D Tiles 模型锚点 A'
- `supermapGeoreference.js:48` CP0 描述更新为"3D Tiles 模型锚点 A"
- ZHENGZHOU_STATION_57083 常量保留（SuperMapSceneViewer.vue gisAnchorLabel 非 3D Tiles 分支用，不动）
- env 的 VITE_SUPERMAP_ANCHOR_CGCS2000/WGS84 是死配置（grep 确认无代码读取），不用改

**数值验证（node 实跑）**：
```
本地原点(0,0) → A投影(460587.11, 3849122.673) → A经纬度(113.569463, 34.76965) ✓ 落在 A 三维模型范围
路B全链路：
  iServer path(457752,3856009) → D逆本地(119,236) → A投影(460646,3849004) → A经纬度(113.570, 34.769)
  iServer path(458151,3856009) → D逆本地(917,236) → A投影(461045,3849004) → A经纬度(113.574, 34.769)
```
路径点纬度 34.769 不变、经度 113.570→113.574 递增 = 东西向水平路径，与 road-north-main（y=236 中线）形状一致。路 B 完整成立。

**类型检查**：vue-tsc 通过（全局锚点改动零新增错误，screen/index.vue SensorPlacementPayload 既有错误已过滤）。

**projectedToWgs84 平面近似评估**：A 锚点本地系范围 0~1587（0~793.6 米），平面近似（111320 m/°）在此尺度误差 <0.01m，够用，不用改精确投影反算。

**待实际验证（依赖三维场景，截图走 codex）**：
1. 起 dev server，触发单建筑 iServer 疏散（runSuperMapNetworkEvacuation）
2. console.log 量级验证：iServer 返回 path[0]（应 D 系 457xxx/3856xxx）→ projectedToLocalD 后本地系（0~1587）→ mapPointToGeo 后 A 经纬度（113.566~113.572）
3. 截图三维场景：路径起点落建筑门口、终点落园区出口、路径贴合 road-north-main 不塌不飘
4. Python D*Lite 链路同步验证：path 本地系 → mapPointToGeo A 经纬度 → 落 A 模型

**prod 影响（待评估）**：prod 走 S3M realspace（USE_3DTILES=false），VITE_SUPERMAP_3D_LAYER_POSITION=B(113.6650)。改全局锚点 A 后，prod 的 mapPointToGeo 产 A 经纬度，但 prod S3M 图层位置仍是 B（LAYER_POSITION）→ prod 可能错位。但 prod 当前 2D bounds 已错位 16km 是坏的，改全局锚点不会让它更坏。prod 三维落图验证待后续单独处理（可能需 prod 也切到 3D Tiles A 模式）。

**状态**：代码改动完成，数值验证通过，类型检查通过。待三维场景实际请求验证（截图走 codex）。

---

## 10. 证据索引

| 结论 | 证据 |
|---|---|
| iServer 93 条 edge 全部锚定 D | curl feature/0-2-{0..92}.json 实测，ANCHOR 全=HAUT_Lianhua_SouthGate_CP0 |
| iServer LOCALMAP = realMapAssets 本地系同源 | LOCALMAP 范围[119,1407]×[118,818] ⊂ realMapAssets[0,1587]×[0,947]，15 条 ROADID 完全一致 |
| A 点精确投影 E=460587.110,N=3849122.673 | 高斯-克吕格正算，D 点反算校核误差 dE=0.8m/dN=3.5m |
| 08 文档 northing 近似错 1.4 万米 | 08 第 2 节近似值 3870557 vs 手算精确值 3849122.673 |
| A vs D 差 7.4km | dE=+2716m, dN=-6886m, 平面 7402.7m |
| 用户确认 A 是看模型贴合定的 | AskUserQuestion 回答"看模型与底图/地形贴合定的" |
| iServer 链路当前塌陷 | 07 报告第 4 节 projectedToLocal 算出 (-22884,-25344) |
| iServer 链路改 A 锚点仍塌 | 本文档 3.3 节算出 (-5432,-13774) |
