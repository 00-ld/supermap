# F1 核实：疏散 payload 坐标系标注 vs 实际数据

调查日期：2026-07-18
调查范围：前端 `buildSuperMapCupEvacuationPayload` 构造链路 + 算法服务消费侧
基础原则：所有结论基于真实代码行号，引用 `file:line`，不推测。

---

## 0. 调用链与"后端"指代澄清

- 前端疏散 payload 由 `buildSuperMapCupEvacuationPayload(diffusionResult)` 构造
  (`code/chemical-main/frontend/src/data/supermapCupScenario.ts:221`)。
- 调用点：`SuperMapSceneViewer.vue:1396`（`runEvacuationDemo`）和 `:2051`（`buildFallbackEvacuationRecord`）。
- payload 经 `runEvacuationPlanning(payload)` (`frontend/src/api/algorithm.ts:76`) POST 到
  `/api/planning/evacuation`，由 `algorithmClient` (`frontend/src/api/algorithmClient.ts:19`,
  baseURL=`/algorithm-api`) 转发到 **Python 算法服务**，不是 Java 后端。
- Java 后端（`code/chemical-main/backend/`）grep `coordSys|sourceCoordSys|targetCoordSys`
  零匹配，不处理疏散 payload。下文"后端/算法服务"均指 `code/chemical-main/algorithm/`。
- 算法服务入口：`algorithm/api_server.py:537` `@app.post("/api/planning/evacuation")`，
  请求体经 pydantic `EvacuationRequest` 校验后 `model_dump()` 交给
  `run_evacuation_planning_task(payload)` (`algorithm/planning/evacuation_runner.py:49`)，
  再进入 `algorithm/planning/dstar_lite.py` 的 `plan_evacuation_route` (`:104`)。

---

## 1. payload 顶层 coordSys 字段实际值字符串？来自哪个常量？

**值**：字符串 `"CGCS2000_3GK_CM_114E / EPSG:4547"`

**来源链**：
- `buildSuperMapCupEvacuationPayload` 第 237 行：`coordSys: SUPERMAP_CUP_SCENARIO.coordinateSystem`
  (`supermapCupScenario.ts:237`)。
- `SUPERMAP_CUP_SCENARIO.coordinateSystem` 定义在 `:101`：
  ```js
  coordinateSystem: `${SUPERMAP_CGCS2000_COORD_SYS} / EPSG:${SUPERMAP_CGCS2000_EPSG}`,
  ```
- `SUPERMAP_CGCS2000_COORD_SYS = 'CGCS2000_3GK_CM_114E'`，`SUPERMAP_CGCS2000_EPSG = 4547`
  (`frontend/src/data/supermapGeoreference.js:2-3`)。

所以顶层 `coordSys` 标注的是 **CGCS2000 3 度带中央经线 114E / EPSG:4547 投影坐标系**。

---

## 2. roads 数组 x/y 来自哪里？toAlgorithmRoad 前后坐标系？量级？

**来源**：`realMapAssets.js:48-64` 的 `roads` 数组（15 条矩形路段，本地"米/单位"坐标）。

**toAlgorithmRoad 转换**（`supermapCupScenario.ts:465-474`）：
```js
function toAlgorithmRoad(road) {
  return { id: road.id, x: road.x, y: road.y, w: road.w, h: road.h, main: road.main }
}
```
**只做了字段透传 + 类型规整，没有调用任何坐标转换函数**。`toAlgorithmRoad` 前后坐标系完全一致，
都是本地米坐标（`REAL_MAP.width=1587.2` / `REAL_MAP.height=947.2` 量级，`realMapAssets.js:9-10`）。

**量级：本地坐标系 0~1587，不是投影坐标 457xxx。**

**真实示例数值**（`realMapAssets.js:48-52`）：
- `road-north-main`: `{ x: 0, y: 226, w: 1587.2, h: 20, main: true }`
- `road-south-main`: `{ x: 0, y: 678, w: 1587.2, h: 22, main: true }`
- `road-west-main`: `{ x: 229, y: 0, w: 18, h: 947.2, main: true }`
- `road-east-main`: `{ x: 1216, y: 0, w: 22, h: 947.2, main: true }`

若按 `coordSys=CGCS2000/EPSG:4547` 解读，这些 x/y 应是高斯-克吕格投影的 `easting/northing`（量级
应在 469313.780 / 3843337.292 附近，见 `supermapGeoreference.js:24` 的锚点投影值），但实际数值是 0~1587，
**明显是本地米坐标（`PCS_NON_EARTH_LOCAL_METER`），不是 EPSG:4547 投影坐标**。

---

## 3. startPoint x/y 来自 buildingEntrances 哪个字段？坐标系？量级？

**来源**：`buildingEntrances.find(item => item.parentId === startFacility.id)`
（`supermapCupScenario.ts:224`）。

- `startFacility = resolveFacility('pa-west-north') || facilities[facilities.length-1]`
  （`:86`、`:90`）。
- `buildingEntrances` 由 `facilities.map` 生成（`realMapAssets.js:107-116`）：
  ```js
  x: facility.x,
  y: facility.y + facility.h / 2,
  ```
- `pa-west-north` facility 定义（`realMapAssets.js:23`）：
  `x: 248, y: 252, w: 334, h: 176`。

所以 `startPoint = { x: 248, y: 252 + 176/2 } = { x: 248, y: 340 }`。

**坐标系**：本地米坐标（`PCS_NON_EARTH_LOCAL_METER`），与 roads 同系。
**量级**：x=248、y=340，0~1587 量级，**不是** EPSG:4547 的 469313.780/3843337.292。

payload 里 `startPoint` 直接取 `startEntrance.x / startEntrance.y`（`:229-230`），未做投影转换。

---

## 4. localToProjected / projectedToLocal 在 payload 构造时是否被调用？

**否。`buildSuperMapCupEvacuationPayload` 内部完全不调用 `localToProjected` 或 `projectedToLocal`。**

- `supermapCupScenario.ts:221-240` 全函数体只涉及：`selectFinalDiffusionFrame`、`asRecord`、
  `roads.map(toAlgorithmRoad)`、`parkEntrances.filter`、`buildingEntrances.find`、
  字段直取 `startEntrance.x/y/label`、引用 `SUPERMAP_CUP_SCENARIO.map/coordinateSystem/georeference`。
- `toAlgorithmRoad` (`:465`) 也不调用任何转换函数。
- `localToProjected` 仅在 `mapPointToGeo` (`:138`) 和 `supermapGeoreference.js` 内部（如 controlPoint
  构造 `:57`）被使用，而 `mapPointToGeo` 用于生成 `geoPoint`（经纬度+easting+northing），
  **疏散 payload 不携带 geoPoint，也不携带 roads/startPoint 的投影值**。

结论：payload 里的 `roads` 和 `startPoint` 始终是本地米坐标，从未经过 `localToProjected`。

---

## 5. payload 是否带 map.sourceCoordSys（PCS_NON_EARTH_LOCAL_METER）？是否进了 payload 顶层 map 字段？

**是，带了，且进了顶层 `map` 字段。**

- `buildSuperMapCupEvacuationPayload` 第 236 行：`map: SUPERMAP_CUP_SCENARIO.map`。
- `SUPERMAP_CUP_SCENARIO.map` 定义（`:116-126`）：
  ```js
  map: {
    width: 1587.2, height: 947.2, gridSize: 20, mapMetersPerUnit: 0.5,
    sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,   // 'PCS_NON_EARTH_LOCAL_METER'
    targetCoordSys: SUPERMAP_CGCS2000_COORD_SYS, // 'CGCS2000_3GK_CM_114E'
    targetEpsg: 4547,
    geographicEpsg: 4490,
    georeference: SUPERMAP_CGCS2000_TRANSFORM,
  }
  ```
- `SUPERMAP_LOCAL_COORD_SYS = 'PCS_NON_EARTH_LOCAL_METER'`（`supermapGeoreference.js:1`）。

所以 payload 顶层同时存在两个字段描述坐标系：
- `coordSys` = `"CGCS2000_3GK_CM_114E / EPSG:4547"`（标注 roads/startPoint 所在系，**与实际数据不一致**）
- `map.sourceCoordSys` = `"PCS_NON_EARTH_LOCAL_METER"`（声明数据的**真实来源系**）
- `map.targetCoordSys` = `"CGCS2000_3GK_CM_114E"`，`map.georeference` 含锚点投影值（可用于本地→投影转换）
- `map.mapMetersPerUnit` = `0.5`（本地单位转米的比例，dstar_lite 用它换算路径物理距离，见 `dstar_lite.py:130` `resolve_map_meters_per_unit`）

---

## 6. parkEntrances 的坐标是什么系？量级？

**本地米坐标系（`PCS_NON_EARTH_LOCAL_METER`），0~1587 量级，与 roads/startPoint 同系。**

`parkEntrances` 定义（`realMapAssets.js:100-105`）：
- `park-west`: `{ x: 238, y: 235 }`
- `park-east`: `{ x: 1228, y: 684 }`
- `park-north`: `{ x: 1218, y: 230 }`
- `park-south`: `{ x: 1218, y: 682 }`

payload 中 `parkEntrances: parkEntrances.filter(item => DEFAULT_VISIBLE_EXIT_IDS.has(item.id))`
（`:227`），`DEFAULT_VISIBLE_EXIT_IDS = new Set(['park-south', 'park-east'])`（`:87`），
所以实际只带 `park-east {x:1228,y:684}` 和 `park-south {x:1218,y:682}`，均为本地坐标，未做转换。

---

## F1 判定结论

### 判定：**不一致。payload 坐标系标注（coordSys=CGCS2000/EPSG:4547）与实际数据坐标系（本地米坐标 PCS_NON_EARTH_LOCAL_METER）矛盾。**

**证据三连**：
1. 顶层 `coordSys` 标 `"CGCS2000_3GK_CM_114E / EPSG:4547"`（`supermapCupScenario.ts:237` + `:101`）。
2. 但 `roads` / `startPoint` / `parkEntrances` 的 x/y 全部是 0~1587 量级的本地米坐标
   （`realMapAssets.js:48-64` / `:23` / `:100-105`），从未经过 `localToProjected`
   （`toAlgorithmRoad` 仅透传，`:465-474`；`buildSuperMapCupEvacuationPayload` 全函数不调用转换，`:221-240`）。
3. EPSG:4547 投影坐标的真值量级应为 easting≈469313、northing≈3843337
   （锚点 `SUPERMAP_CGCS2000_ANCHOR.projected`，`supermapGeoreference.js:24`），与 payload 中 0~1587 量级差三个数量级。

### 后端若依赖 coordSys 字段做转换会出什么问题？

**当前算法服务实际不依赖 `coordSys` 做转换**——grep `coordSys|sourceCoordSys|targetCoordSys|CGCS2000|PCS_NON_EARTH|localToProjected|projectedToLocal`
在整个 `algorithm/` 目录零匹配。算法服务把 `roads/startPoint/parkEntrances` 的 x/y 当作
**同一匿名平面直角坐标系**的点直接用（`dstar_lite.py:118-125` 取 `startPoint`、`parkEntrances`、
`roads` 建图；`resolve_map_meters_per_unit` `:156-160` 只读 `map.mapMetersPerUnit` 或顶层
`mapMetersPerUnit` 换算物理距离，不读 `coordSys`）。所以**当前功能上不会因 F1 矛盾而出错**，
路径规划在本地系内自洽。

**但风险在于**：若后续有人（或新接入的下游模块）按字面信任顶层 `coordSys="CGCS2000/EPSG:4547"`，
把 roads/startPoint 的 x/y 当成高斯投影 easting/northing 去和外部 GIS 数据（如 CGCS2000
图层、WGS84 经纬度）做叠加或反投影，会把 0~1587 的本地值当成 46 万级投影值，产生
**三个数量级的坐标错位**——路径会落到地球上一个完全无关的位置（接近本初子午线/赤道附近），
且 `georeference` 锚点信息（锚点投影 469313.780/3843337.292）与 0~1587 的数据对不上。

### 后端若有 map.sourceCoordSys 可用，能否避免误判？

**能。** payload 顶层 `map.sourceCoordSys="PCS_NON_EARTH_LOCAL_METER"` 如实声明了数据的真实来源系
（`:121`），且 `map` 还带齐了 `mapMetersPerUnit=0.5`、`targetCoordSys`、`georeference`（锚点
local/projected/wgs84 + scale + rotation）——下游若要转换，应**以 `map.sourceCoordSys` 为准**
识别数据是本地系，再借助 `map.georeference` 的锚点（local {0,0} ↔ projected {469313.780, 3843337.292}）
和 `mapMetersPerUnit` 做本地→CGCS2000 投影换算（即 `localToProjected` 的等价逻辑，
`supermapGeoreference.js:69-76`），而**不应信任顶层 `coordSys` 字符串**。

**根因**：顶层 `coordSys` 字段语义被复用为"场景目标口径/展示系"标签（`SUPERMAP_CUP_SCENARIO.coordinateSystem`
同时用于 `displayCoordinateSystem` 旁的展示文案，`:101-102`），而非"payload 中 x/y 实际所在系"。
正确的"实际系"标注在 `map.sourceCoordSys`。这是**字段语义错配**：顶层 `coordSys` 与 `map.sourceCoordSys`
对"数据现在是什么系"给出了互相矛盾的两个答案，且前者是误导性的那个。

### 修复建议（供 F2 阶段参考，不在 F1 范围内执行）
- 方案 A（改标注）：将顶层 `coordSys` 改为 `map.sourceCoordSys` 的值（`PCS_NON_EARTH_LOCAL_METER`），
  或拆成 `coordSys`（实际系）+ `targetCoordSys`（目标系）两个字段，消除顶层字符串的歧义。
- 方案 B（改数据）：在 `toAlgorithmRoad` / `startPoint` / `parkEntrances` 落 payload 前调用
  `localToProjected`，让 x/y 真正变成 EPSG:4547 投影值，使顶层 `coordSys` 与数据一致。
  （代价大，会破坏算法服务现有的本地系建图逻辑，需同步改 dstar_lite。）
- 推荐方案 A：改动最小、与算法服务现状（不读 coordSys、用本地系自洽）兼容。

---

## 证据索引（file:line）

| 结论 | 证据位置 |
|---|---|
| coordSys 字符串值与来源 | `supermapCupScenario.ts:237`、`:101`；`supermapGeoreference.js:2-3` |
| roads 来源与量级 | `realMapAssets.js:48-64`；`REAL_MAP.width/height` `:9-10` |
| toAlgorithmRoad 不转换 | `supermapCupScenario.ts:465-474` |
| startPoint 来源与数值 | `supermapCupScenario.ts:224,228-231`；`realMapAssets.js:23,107-116` |
| buildingEntrances 由 facilities 映射 | `realMapAssets.js:107-116` |
| localToProjected/projectedToLocal 定义 | `supermapGeoreference.js:69-85` |
| payload 不调用转换函数 | `supermapCupScenario.ts:221-240` |
| map.sourceCoordSys 进顶层 | `supermapCupScenario.ts:236,121`；`supermapGeoreference.js:1` |
| parkEntrances 来源与量级 | `realMapAssets.js:100-105`；`supermapCupScenario.ts:227,87` |
| 锚点投影量级（反证） | `supermapGeoreference.js:24` |
| 算法服务不读 coordSys | `algorithm/` 全目录 grep 零匹配 |
| 算法服务消费 startPoint/roads | `algorithm/planning/dstar_lite.py:104-160`；`evacuation_runner.py:49-80`；`api_server.py:537-543` |
| 算法服务路由 | `frontend/src/api/algorithm.ts:76`；`algorithmClient.ts:19-20` |
