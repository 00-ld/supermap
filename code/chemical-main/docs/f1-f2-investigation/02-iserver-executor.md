# F2 核实：iServer 路径返回坐标系是否被前端正确处理

> 调查日期：2026-07-18
> 调查范围：`code/chemical-main/frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts`、`useSuperMapIserverData.ts`、`data/supermapCupScenario.ts`、`data/supermapGeoreference.js`、`components/SuperMapSceneViewer.vue`、`.env.development`、`.env.production`
> 所有结论均基于真实代码核实，引用 `file:line`。

## 1. iServer `path.rjson` 请求如何构造

### 1.1 完整 URL（从 .env 读 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL`）

执行器入口读环境变量：

```
useSmartMapAlgorithmExecutors.ts:125
const analysisUrl = String(import.meta.env.VITE_SUPERMAP_NETWORK_ANALYSIS_URL || '').trim()
```

dev 环境实际值（`.env.development:37`）：

```
VITE_SUPERMAP_NETWORK_ANALYSIS_URL = /supermap-iserver/iserver/services/transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest/networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000
```

prod 环境实际值（`.env.production:34`）：

```
VITE_SUPERMAP_NETWORK_ANALYSIS_URL = /iserver/services/transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest/networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000
```

URL 构造函数（`useSmartMapAlgorithmExecutors.ts:306-313`）：

```ts
function buildSuperMapPathUrl(baseUrl, start, end) {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const pathUrl = /\.rjson$/i.test(trimmed) ? trimmed : `${trimmed}/path.rjson`
  const query = new URLSearchParams()
  query.set('nodes', JSON.stringify([start, end]))
  query.set('parameter', JSON.stringify({ weightName: 'length' }))
  return `${pathUrl}?${query.toString()}`
}
```

最终请求（`requestSuperMapPath`，`useSmartMapAlgorithmExecutors.ts:344-380`）：

- 方法：`GET`（无 body，参数全在 query string）
- Headers：`Accept: application/json`
- 超时：`SUPERMAP_NETWORK_TIMEOUT_MS = 6500`（`useSmartMapAlgorithmExecutors.ts:20`）
- URL 形如：`.../networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000/path.rjson?nodes=[{"x":...,"y":...},{"x":...,"y":...}]&parameter={"weightName":"length"}`

数据集名 `Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000` 末尾 `_cgcs2000` 表明该 Network Dataset 是基于 CGCS2000 投影坐标系发布的（数据源 `chemical_park_vectors_cgcs2000`，见 `useSuperMapIserverData.ts:12`）。

### 1.2 请求体 startPoint / 终点坐标量级

请求体（即 `nodes` query 参数）里的起点和终点坐标，并非前端本地米制坐标，而是**经过 `projectPoint` 投影后的 CGCS2000 投影坐标**。证据链：

`SuperMapSceneViewer.vue:1400` 的 `runSuperMapNetworkEvacuation(payload)` 中的 `payload` 来自 `buildSuperMapCupEvacuationPayload`（`supermapCupScenario.ts:221-240`），其中 `startPoint` 为**本地系**（`startEntrance.x/y`，量级 0–1587 / 0–947）。

但 `runSuperMapNetworkEvacuation` 在 `SuperMapSceneViewer.vue:1460` 调用前先做了投影包装：

```ts
// SuperMapSceneViewer.vue:1551-1577
function buildProjectedNetworkPayload(payload) {
  const startPoint = toMapPoint(payload.startPoint)      // 本地系
  ...
  return {
    ...payload,
    roads: payload.roads.map(item => projectRoadRect(...)),  // 投影
    startPoint: projectPoint(startPoint),                     // 本地 → CGCS2000 投影
    parkEntrances: parkEntrances.map(entrance => ({
      ...entrance,
      ...projectPoint({ x: Number(entrance.x), y: Number(entrance.y) }),  // 投影
      ...
    })),
    coordSys: 'CGCS2000_3GK_CM_114E / EPSG:4547',
    map: { ...payload.map, coordSys: 'CGCS2000_3GK_CM_114E', epsg: 4547 },
  }
}
```

`projectPoint` 调用 `localToProjected`（`supermapGeoreference.js:69-76`）：

```js
export function localToProjected(x, y) {
  const metersX = (Number(x) - 0) * 0.5   // mapMetersPerUnit = 0.5
  const metersY = (Number(y) - 0) * 0.5
  return {
    easting:  469313.780 + metersX,        // anchor.easting
    northing: 3843337.292 - metersY,       // anchor.northing（y 轴向南）
  }
}
```

dev anchor（`.env.development:26`、`supermapGeoreference.js:24`）：
- `SUPERMAP_CGCS2000_ANCHOR.projected = { easting: 469313.780, northing: 3843337.292 }`

**所以发给 iServer 的 `nodes` 起终点量级是 `E ≈ 469313–470107`、`N ≈ 3842863–3843337`（米制 CGCS2000 投影坐标，EPSG:4547）**。

例如：本地 `(0, 0)` → 投影 `(469313.780, 3843337.292)`；本地 `(1587.2, 947.2)` → 投影 `(470106.800, 3842863.692)`，与 `.env.development:32-35` 的 `VITE_SUPERMAP_2D_LEFT/RIGHT/TOP/BOTTOM` 完全一致。

> 注意：prod 的 anchor（`.env.production` 未显式设置 `VITE_SUPERMAP_ANCHOR_CGCS2000`，回退到 `supermapGeoreference.js` 硬编码 `469313.780 / 3843337.292`），但 prod 的 `VITE_SUPERMAP_2D_LEFT/BOTTOM/RIGHT/TOP`（`.env.production:30-33`）是 **`457752.343 / 3855297.972 / 459339.543 / 3856245.172`**，与 anchor 不一致（见第 6 节）。

## 2. `extractSuperMapPath` 抽点逻辑与坐标系处理

函数定义（`useSmartMapAlgorithmExecutors.ts:399-417`）：

```ts
function extractSuperMapPath(pathResult) {
  const routePath = extractGeometryPath(pathResult?.route)
  if (routePath.length) return routePath
  const guides = Array.isArray(pathResult?.pathGuideItems) ? pathResult.pathGuideItems : []
  const points = []
  guides.forEach((guide) => {
    const geometry = guide.geometry
    const geometryPoints = Array.isArray(geometry?.points) ? geometry.points : []
    geometryPoints.forEach((point) => {
      const normalized = normalizePoint(point)
      if (!normalized) return
      const previous = points[points.length - 1]
      if (!previous || previous.x !== normalized.x || previous.y !== normalized.y) {
        points.push(normalized)
      }
    })
  })
  return points
}
```

`extractGeometryPath`（`useSmartMapAlgorithmExecutors.ts:419-428`）支持两种 iServer 路径几何返回形式：
- `route.geometry.coordinates`（GeoJSON 风格嵌套数组，经 `coordinatesToPath` 拍平）
- `geometry.points` / `route.points`（iServer 原生 `points` 数组）

抽点过程：
- 仅调用 `normalizePoint`（`useSmartMapAlgorithmExecutors.ts:236-242`），从 `record.x ?? mapX ?? easting`、`record.y ?? mapY ?? northing` 取数值。
- **没有任何坐标系转换**：不做 `projectedToLocal`、不做 `localToProjected`、不做 `worldToGeo`，也没有任何 `if (coordSys === ...)` 判定。
- **没有标注坐标系字段**：返回值是裸 `Array<{ x: number; y: number }>`，无 `coordSys / epsg / crs` 字段。

`extractSuperMapPath` 返回值直接塞进 `AlgorithmRecord.path`（`useSmartMapAlgorithmExecutors.ts:362-379`）：

```ts
return {
  path,                          // ← iServer 返回点原样
  isReachable: true,
  ...
  planner: 'SuperMap iServer Transportation Analyst',
  startX: startPoint.x,          // 投影系（469313 量级）
  startY: startPoint.y,           // 投影系（3843337 量级）
  distanceMeters,
  ...
  rawSuperMapPath: pathResult,    // 原始 pathList[0]
}
```

> iServer 返回的 path 点坐标量级 = 输入 nodes 量级 = **CGCS2000 投影坐标（E≈469000, N≈3843000）**，因为 iServer 网络分析返回的路径点坐标系与 Network Dataset 的坐标系一致（即数据源 `chemical_park_vectors_cgcs2000` 的 CGCS2000_3GK_CM_114E / EPSG:4547）。

## 3. `snapPointToRoad` 吸附后坐标量级与坐标系

`snapPointToRoad`（`useSmartMapAlgorithmExecutors.ts:277-298`）：

```ts
function snapPointToRoad(point, roads) {
  if (!roads.length) return null
  let best = null
  for (const road of roads) {
    const horizontal = Math.abs(road.w) >= Math.abs(road.h)
    const candidate = horizontal
      ? { x: clamp(point.x, road.x, road.x + road.w), y: road.y + road.h / 2 }
      : { x: road.x + road.w / 2, y: clamp(point.y, road.y, road.y + road.h) }
    const distance = Math.hypot(point.x - candidate.x, point.y - candidate.y)
    if (!best || distance < best.distance) best = { point: candidate, distance }
  }
  return best?.point || null
}
```

它只是在传入坐标系下做最近道路矩形边的投影吸附，**不改变坐标系**。吸附结果坐标系 = 输入 `point` 与 `roads` 的坐标系。

调用处（`useSmartMapAlgorithmExecutors.ts:135-140`）：

```ts
const networkStartPoint = snapPointToRoad(startPoint, roads) || startPoint
const networkExits = exits.map(exit => ({
  ...exit,
  originalPoint: exit.point,
  point: snapPointToRoad(exit.point, roads) || exit.point,
}))
```

此时 `startPoint`、`exit.point`、`roads` 已全部来自 `buildProjectedNetworkPayload` 包装后的投影坐标（CGCS2000，E≈469000，N≈3843000）。

- `roads` 来源：`SuperMapSceneViewer.vue:1464` `projectedPayload.roads = planningInputs.roads`，而 `planningInputs` 由 `loadSuperMapPlanningInputs()`（`useSuperMapIserverData.ts:475-505`）从 iServer data 服务（`chemical_park_vectors_cgcs2000`）拉取后经 `roadRectFromLine` 构造（CGCS2000 量级）。
- **因此吸附后坐标仍是 CGCS2000 投影系**（E≈469313–470107, N≈3842863–3843337，米制）。

**真实数值推算**（dev）：
- 起点（如本地 `(238, 235)` 即西侧入口控制点 CP2，`supermapGeoreference.js:51`）→ `localToProjected(238, 235)`：
  - `easting = 469313.780 + 238*0.5 = 469432.780`
  - `northing = 3843337.292 - 235*0.5 = 3843219.792`
- 终点（如本地 `(1218, 230)` 即 CP1 北侧入口）→ `localToProjected(1218, 230)`：
  - `easting = 469313.780 + 1218*0.5 = 469922.780`
  - `northing = 3843337.292 - 230*0.5 = 3843222.292`

发给 iServer 时坐标系 = **CGCS2000 投影系（EPSG:4547）**，与 Network Dataset 一致，输入侧无错。

## 4. `executeSuperMapNetworkAnalysis` 返回 result 是否含 `pathCoordSys` 字段

`executeSuperMapNetworkAnalysis`（`useSmartMapAlgorithmExecutors.ts:124-166`）返回结构：

```ts
return {
  result,     // normalizeSuperMapNetworkResult 包装后的对象
  error: '',
}
```

`normalizeSuperMapNetworkResult`（`useSmartMapAlgorithmExecutors.ts:451-476`）仅透传 `data`，附加 `executor = { mode, runtime, implementation }`，**没有 `pathCoordSys / coordSys / crs / epsg / srid` 字段**。

对执行器全文做 `pathCoordSys|coordSys|coord_sys|crs|srid|epsg` 关键字搜索（Grep）：**No matches found**（执行器文件内无任何坐标系字段）。

返回的 result 里只有：
- `path: Array<{x,y}>`（CGCS2000 投影坐标，无坐标系标注）
- `startX/startY`（投影系）
- `rawSuperMapPath`（iServer 原始 `pathList[0]`，也未做坐标系标注）
- `executor: { mode: 'supermap-network-analysis', runtime: 'iserver-rest', implementation: 'SuperMap iServer network analysis' }`

**结论：result 对象里没有任何坐标系字段**，下游只能"按约定"假设坐标系。

## 5. iServer cgcs2000 数据集返回 path 点的坐标系推断

依据链：
1. 数据集名 `Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000`（`.env.development:37`、`.env.production:34`），数据源后缀 `_cgcs2000`。
2. `useSuperMapIserverData.ts:10-12` 常量定义：
   - `DEFAULT_CGCS2000_DATA_SERVICE_URL = '.../data-chemical_park_vectors_cgcs2000/rest'`
   - `DEFAULT_CGCS2000_DATASOURCE = 'chemical_park_vectors_cgcs2000'`
3. `useSuperMapIserverData.ts:19` 硬编码 `CGCS2000_MAP_BOUNDS = { left: 457752.343, top: 3856245.172, right: 459339.543, bottom: 3855297.972 }`（典型的 3 度带高斯-克吕格投影坐标量级：E≈45万米、N≈385万米）。
4. `.env.development:22-23`：`VITE_SUPERMAP_COORD_SYS = CGCS2000_3GK_CM_114E`、`VITE_SUPERMAP_EPSG = 4547`。
5. `supermapGeoreference.js:2-3`：`SUPERMAP_CGCS2000_COORD_SYS = 'CGCS2000_3GK_CM_114E'`、`SUPERMAP_CGCS2000_EPSG = 4547`（CGCS2000 / 3 度带 / 中央经线 114E，对应郑州地区）。
6. SuperMap iServer Transportation Analyst 的契约：`path.rjson` 返回的 `pathList[].route.geometry` 路径点坐标系 = Network Dataset 注册时的坐标系。Network Dataset 名带 `_cgcs2000`，故返回路径点为 **CGCS2000_3GK_CM_114E 投影坐标（EPSG:4547）**。

**推断结论**：iServer 返回的 path 点坐标系 = CGCS2000 3 度带投影坐标（E≈45–47 万米，N≈384–385 万米）。dev 输入 anchor 469313.780/3843337.292 落在该量级；prod 输入若走 `loadSuperMapPlanningInputs` + `projectPoint` 也落在 469313.780/3843337.292 anchor 上（因为 anchor 硬编码在 `supermapGeoreference.js`，`VITE_SUPERMAP_ANCHOR_CGCS2000` 在 prod 未显式覆盖）。

> 注意：dev 与 prod 的 `VITE_SUPERMAP_2D_LEFT/RIGHT/TOP/BOTTOM` 数值不同（dev 用 469313.780 系，prod 用 457752.343 系，差约 11560 米）。但这是**2D 地图瓦片 bounds**，与网络分析输入输出坐标系判定无关——网络分析输入侧始终用 `localToProjected` 硬编码 anchor，输出侧由 iServer 数据集决定。这个 dev/prod anchor 与 2D bounds 不一致是另一个潜在问题（影响 `inferParkEdge`、2D 瓦片对齐），不在 F2 范围内。

## 6. `resolveRoutePath` 是否做量级探测或坐标系判定

`supermapCupScenario.ts:269-276`：

```ts
export function resolveRoutePath(result) {
  const candidate = asRecord(result?.selectedRoute || result)
  const path = candidate.path || candidate.points || candidate.routePoints
  if (!Array.isArray(path)) return []
  return path
    .map(item => asMapPoint(item))
    .filter((item): item is SuperMapCupMapPoint => Boolean(item))
}
```

`asMapPoint`（`supermapCupScenario.ts:476-483`）：

```ts
function asMapPoint(value) {
  if (!value || typeof value !== 'object') return null
  const record = value as AlgorithmRecord
  const x = Number(record.x)
  const y = Number(record.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}
```

- **没有任何量级探测**（如 `if (x > 100000) ...`）、**没有坐标系判定**（不查 `coordSys/epsg` 字段，因为返回结构里也没有）。
- 返回 `SuperMapCupMapPoint = { x, y }`（`supermapCupScenario.ts:41-44`），该类型本身不带坐标系字段。
- 它把 path 点**当成 SuperMapCupMapPoint**（即本地系，量级 0–1587 / 0–947）返回。

**但实际数据是 CGCS2000 投影坐标**（E≈469000, N≈3843000）。`resolveRoutePath` 不感知这一点，原样透传。

### 6.1 救赎：落图前的 `projectedToLocal` 包装

在 `SuperMapSceneViewer.vue` 中，`runSuperMapNetworkEvacuation`（约 `1460-1500`）和 `runSuperMapClosestDeviceAnalysis`（`1503-1549`）在拿到 `executeSuperMapNetworkAnalysis` 的 result 后，**手动**把 path 从投影系转回本地系：

```ts
// SuperMapSceneViewer.vue:1474-1491
const projectedPath = resolveRoutePath(record)             // 投影系点（CGCS2000）
if (!projectedPath.length) return null
const localPath = projectedPath.map(point => projectedToLocal(point.x, point.y))  // 投影 → 本地
const candidateRoutes = record.candidateRoutes.map((route) => {
  const routePath = resolveRoutePath(routeRecord)
  return { ...routeRecord, path: routePath.map(point => projectedToLocal(point.x, point.y)), projectedPath: routePath }
})
return {
  ...record,
  path: localPath,            // ← 本地系，供 drawEvacuationOverlay 用
  projectedPath,              // ← 投影系，留档
  ...
  executor: { ..., coordinateSystem: 'EPSG:4547 / CGCS2000_3GK_CM_114E' },
}
```

`projectedToLocal`（`supermapGeoreference.js:78-85`）是 `localToProjected` 的逆变换：

```js
export function projectedToLocal(easting, northing) {
  return {
    x: (easting - 469313.780) / 0.5 + 0,
    y: (3843337.292 - northing) / 0.5 + 0,
  }
}
```

例如：投影 `(469432.780, 3843219.792)` → 本地 `(238, 235)`，与第 3 节推算吻合。

### 6.2 关键风险：`drawEvacuationOverlay` 是否总能拿到 localPath？

`drawEvacuationOverlay`（`SuperMapSceneViewer.vue:1881-1910`）直接 `resolveRoutePath(result)`：

```ts
function drawEvacuationOverlay(result) {
  const path = resolveRoutePath(result)   // ← 期望本地系
  if (!path.length) throw new Error('疏散规划结果缺少路径点')
  ...
  addPolylineEntity(path, '疏散路线', '#52ffb8', {...})
}
```

正常流程（dev，走 `runSuperMapNetworkEvacuation`）：result.path 已是 `localPath`（本地系，0–1587 量级），`resolveRoutePath` 取 `candidate.path` 拿到本地系 → 落图正确。

**但**：`runEvacuationDemo`（`SuperMapSceneViewer.vue:1393-1429`）的 fallback 路径会调用 `runEvacuationPlanning(payload)`（Python 后端，`payload` 仍是本地系），其返回 path 也是本地系 → 仍正确。

**异常路径**：如果 `executeSuperMapNetworkAnalysis` 抛错被 catch（`useSmartMapAlgorithmExecutors.ts:161-165`）返回 `null`，则 `runSuperMapNetworkEvacuation` 返回 `null`，走 Python fallback，不会把投影系 path 泄漏到 `drawEvacuationOverlay`。当前代码路径下，投影系 path 不会直接进入 `drawEvacuationOverlay`。

## F2 判定结论

### 核心问题：iServer 路径返回坐标系**没有**被前端在数据层"显式"处理，而是依赖**调用方手动逆变换**的隐式约定

**判定：部分正确，存在系统性脆弱点，且 dev/prod 表现不同。**

#### 6.3 数据层（执行器）层面：**未正确处理**
- `extractSuperMapPath`、`requestSuperMapPath`、`normalizeSuperMapNetworkResult`、`resolveRoutePath`、`asMapPoint` 全链路**没有任何坐标系标注或转换**。iServer 返回的 CGCS2000 投影坐标（E≈469000, N≈3843000）被原样塞进 `AlgorithmRecord.path`，类型标注为 `SuperMapCupMapPoint`（语义上是本地系），**类型与实际数据坐标系不符**。
- result 对象无 `pathCoordSys / coordSys / epsg` 字段，下游无法通过自描述判定坐标系。

#### 6.4 视图层（落图）层面：**当前正确，但靠约定不靠契约**
- `runSuperMapNetworkEvacuation` / `runSuperMapClosestDeviceAnalysis` 在 `SuperMapSceneViewer.vue:1476/1518` 手动 `projectedToLocal(point.x, point.y)` 把投影 path 转回本地系，再塞回 `result.path`。`drawEvacuationOverlay` / `drawClosestDeviceOverlay` 取到的就是本地系 path。
- 落图时 `addPolylineEntity` → `mapPointToSceneCartesian`（`SuperMapSceneViewer.vue:2544-2550`）：
  - `geographicSceneMode`（`SuperMapSceneViewer.vue:572`，dev 下恒 true，因为 `import.meta.env.DEV`）→ 走 `geoToCartesian(mapPointToGeo(point, ...))`，即本地 → CGCS2000 投影 → WGS84 经纬度 → ECEF 笛卡尔。
  - 非 geographicSceneMode（prod 若 `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false` 且非 3DTiles）→ 走 `mapPointToS3MLocal`，即本地系直接喂 S3M 本地场景。

### 6.5 若返回 CGCS2000 投影坐标（E≈457000, N≈3855000，即 prod 的 2D bounds 系）当本地系的后果

**假设场景**：iServer 数据集坐标系或 anchor 偏移导致返回 path 点是 prod 2D bounds 量级（E≈457752, N≈3855297），而前端代码把它当本地系（0–1587）处理。

#### dev 球面模式（`geographicSceneMode = true`）
1. `runSuperMapNetworkEvacuation` 拿到投影 path（E≈457752, N≈3855297）。
2. `projectedToLocal(457752.343, 3855297.972)` = `((457752.343 - 469313.780)/0.5, (3843337.292 - 3855297.972)/0.5)` = `(-23122.874, -23921.36)`。
3. 本地坐标变成**负几万**，远超 `SUPERMAP_MAP_SIZE` (1587.2 × 947.2)。
4. `mapPointToGeo(-23122.874, -23921.36)`：经度 = 113.6650 + (-23122.874*0.5)/(111320*cos(34.7178°)) ≈ 113.6650 - 126.6 ≈ **-12.9°**（大西洋）；纬度 = 34.7178 + (-23921.36*0.5)/111320 ≈ 34.7178 - 107.5 ≈ **-72.8°**（南极）。
5. `Cartesian3.fromDegrees(-12.9, -72.8, ...)` → **路径飘到地球另一面**（南极大西洋），三维球面上完全看不到，或落在错误半球。

> 即便 anchor 对齐（仍 469313.780 系），只要 iServer 返回点与输入点同系（都是 469313 系），`projectedToLocal` 逆变换后回到 0–1587 本地系，dev 球面模式正常。**真正的风险在于 dev/prod anchor 与 iServer 数据集坐标系是否一致**。

#### prod 本地模式（`geographicSceneMode = false`，S3M 本地场景）
1. 拿到投影 path（E≈457752, N≈3855297）。
2. `projectedToLocal` 同样算出本地 `(-23122, -23921)`（若 anchor 用硬编码 469313.780）。
3. `mapPointToS3MLocal(-23122, -23921)` → S3M 本地坐标系下偏移到**负几万米**位置。
4. 三维场景原点在 (0,0)，S3M 缓存范围约 0–1587 × 0–947 → 路径**塌到场景外几十公里处**，完全不可见，或显示为一条飞出场景的直线。

#### 当前实际状态（基于代码核实）
- dev：`VITE_SUPERMAP_ANCHOR_CGCS2000 = 469313.780, 3843337.292`（`.env.development:26`），与 `supermapGeoreference.js:24` 硬编码 anchor 一致。iServer 数据集名 `_cgcs2000`。**若 iServer 数据集坐标系就是 469313.780 系**，则输入投影坐标、输出投影坐标、逆变换回本地系全程闭环，dev 球面模式落图正确。
- prod：`.env.production` 未设置 `VITE_SUPERMAP_ANCHOR_CGCS2000`，回退到 `supermapGeoreference.js` 硬编码 469313.780；但 prod 的 `VITE_SUPERMAP_2D_LEFT/RIGHT/TOP/BOTTOM = 457752.343/459339.543/3855297.972/3856245.172`（`.env.production:30-33`），与 anchor 差约 11560 米。**若 prod 的 iServer Network Dataset 实际坐标系是 457752 系（与 2D bounds 一致），则输入侧 `projectPoint` 用 469313 anchor 投影出的起点坐标会与数据集坐标系错位 11560 米，iServer 要么吸附失败、要么返回错误路径**；即便返回 path，`projectedToLocal` 用 469313 anchor 逆变换，量级虽对，但地理位置整体偏移 11560 米。

### 最终判定

| 层面 | 判定 | 说明 |
|---|---|---|
| 数据层（执行器） | **未正确处理** | 无坐标系标注、无显式转换，iServer CGCS2000 投影坐标被类型标注为本地系 SuperMapCupMapPoint |
| 视图层（落图） | **当前正确但脆弱** | 依赖 `runSuperMapNetworkEvacuation`/`runSuperMapClosestDeviceAnalysis` 手动 `projectedToLocal` 逆变换；若任何调用方（如 `drawEvacuationOverlay` 直接收 `executeSuperMapNetworkAnalysis` 原始 result）跳过这步，投影坐标会被当本地系 |
| dev 球面模式 | **闭环正确（前提：anchor 与数据集同系）** | 输入投影→iServer 返回投影→`projectedToLocal` 回本地→`mapPointToGeo`→ECEF，全程闭环 |
| prod 本地模式 | **存在 anchor 与 2D bounds 错位 11560 米的隐患** | anchor 硬编码 469313.780，2D bounds 用 457752.343，若 iServer 数据集跟随 2D bounds 系则整体偏移 |
| 健壮性 | **差** | 无坐标系自描述字段，无量级探测，纯靠调用方约定。任何中间环节（后端 Python fallback、closestfacility.rjson 分支、candidateRoutes）漏做 `projectedToLocal` 都会导致路径飘移 |

**F2 结论：iServer 路径返回坐标系在"执行器数据层"未被正确处理（无坐标系标注、无显式转换、类型与实际数据系不符），仅在"视图层落图前"通过手动 `projectedToLocal` 逆变换补救。当前 dev 球面模式在 anchor 与 iServer 数据集同系时落图正确；但若 iServer 返回 CGCS2000 投影坐标（E≈457000, N≈3855000，prod 2D bounds 系）被当本地系，dev 球面模式会飘到南极大西洋（经纬度 -12.9°/-72.8°），prod 本地模式会塌到场景外几十公里处。系统性脆弱点：执行器无 `pathCoordSys` 字段，全靠隐式约定。**

### 关键文件路径
- 执行器：`G:/竞赛/超图杯/code/chemical-main/frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts`
- iServer 数据：`G:/竞赛/超图杯/code/chemical-main/frontend/src/views/smart_map/useSuperMapIserverData.ts`
- 坐标参考：`G:/竞赛/超图杯/code/chemical-main/frontend/src/data/supermapGeoreference.js`
- 场景与落图：`G:/竞赛/超图杯/code/chemical-main/frontend/src/data/supermapCupScenario.ts`、`G:/竞赛/超图杯/code/chemical-main/frontend/src/components/SuperMapSceneViewer.vue`
- 环境变量：`G:/竞赛/超图杯/code/chemical-main/frontend/.env.development`、`.env.production`
