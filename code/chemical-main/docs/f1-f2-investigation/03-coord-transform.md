# 03 坐标转换层核实：函数签名 / 输入输出坐标系 / 量级推算

> 核实对象：`code/chemical-main/frontend/src/data/supermapGeoreference.js`、`code/chemical-main/frontend/src/data/coordinate.js`、`code/chemical-main/frontend/src/data/supermapCupScenario.ts`、`code/chemical-main/frontend/src/components/SuperMapSceneViewer.vue`、`code/chemical-main/frontend/src/data/realMapAssets.js`、`.env.development` / `.env.production`。所有结论附 `file:line`。

---

## 1. 函数签名与输入输出坐标系

### 1.1 核心转换函数（supermapGeoreference.js / coordinate.js / supermapCupScenario.ts）

| 函数 | 定义位置 | 输入坐标系 | 输出坐标系 | 量级/单位 |
|---|---|---|---|---|
| `localToProjected(x, y)` | `supermapGeoreference.js:69` | 本地米制（PCS_NON_EARTH_LOCAL_METER），原点 CP0=郑州 57083，`x` 向东、`y` 向南（`xAxis:'east', yAxis:'south'`，见 `supermapGeoreference.js:43-44`） | CGCS2000 投影 EPSG:4547（CGCS2000_3GK_CM_114E）`{easting, northing}` | `easting = 469313.780 + 0.5·x`；`northing = 3843337.292 − 0.5·y`（`supermapGeoreference.js:70-75`）。本地单位 = 0.5 m/unit，故 `x∈[0,1587.2]` → easting `[469313.78, 470106.78]`；`y∈[0,947.2]` → northing `[3842863.69, 3843337.29]` |
| `projectedToLocal(easting, northing)` | `supermapGeoreference.js:78` | CGCS2000 投影 EPSG:4547 `{easting, northing}` | 本地米制 `{x, y}` | 反演：`x = 2·(easting − 469313.780)`；`y = 2·(3843337.292 − northing)`（`supermapGeoreference.js:80-83`）。`round` 到 3 位小数（`supermapGeoreference.js:105`） |
| `localToWgs84(x, y, altitude=0)` | `supermapGeoreference.js:87` | 本地米制 | CGCS2000 地理 EPSG:4490 `{longitude, latitude, altitude}` | 先 `localToProjected` 再 `projectedToWgs84`（`supermapGeoreference.js:88-89`） |
| `projectedToWgs84(easting, northing, altitude=0)` | `supermapGeoreference.js:92` | CGCS2000 投影 EPSG:4547 | CGCS2000 地理 EPSG:4490 | 平面近似（非严格高斯反算）：`lat = 34.7178 + (northing−3843337.292)/111320`；`lon = 113.6650 + (easting−469313.780)/(111320·cos34.7178°)`，`cos34.7178°≈0.8220`，分母≈91517.8 m/°（`supermapGeoreference.js:93-102`）。altitude = 108 + altitude |
| `worldToGeo(wx, wy)` | `coordinate.js:32` | 本地米制 `{wx, wy}` | `{longitude, latitude, altitude, easting, northing, projectedEpsg:4547}` | altitude 用 `clamp(wy,0,947.2)` 后按 `(947.2−y)·0.02 + sin(wx/90)·1.8 + cos(wy/70)·1.2` 估算（`coordinate.js:33-37`）；**注意**：lon/lat 经 `localToWgs84(wx,wy,alt)` 用**未 clamp 的原始 wx,wy** 计算（`coordinate.js:39`），只有 altitude 分量被 clamp |
| `geoToWorld(longitude, latitude)` | `coordinate.js:51` | CGCS2000 地理 EPSG:4490 | 本地米制 `{x, y}`（已 clamp 到 `[0,1587.2]×[0,947.2]`） | `metersX = (lon−113.6650)·111320·cos34.7178°`；`metersY = (lat−34.7178)·111320`；再 `projectedToLocal(469313.780+metersX, 3843337.292+metersY)` 后 clamp（`coordinate.js:52-62`） |
| `projectedToWorld(easting, northing)` | `coordinate.js:65` | CGCS2000 投影 EPSG:4547 | 本地米制（已 clamp） | `projectedToLocal` 后 clamp 到 `[0,1587.2]×[0,947.2]`（`coordinate.js:66-70`） |
| `mapPointToGeo(point, altitudeOffset=0)` | `supermapCupScenario.ts:136` | 本地米制 `SuperMapCupMapPoint{x,y}` | `SuperMapCupGeoPoint{longitude, latitude, altitude, easting, northing, projectedEpsg:4547}` | `geo=worldToGeo(point.x,point.y)`；`projected=localToProjected(point.x,point.y)`；`altitude = geo.altitude + altitudeOffset`（`supermapCupScenario.ts:137-146`） |
| `geoToMapPoint` | — | — | — | **不存在**。逆向（geo→本地）由 `geoToWorld`（`coordinate.js:51`）承担；场景坐标→本地由 `sceneLocalPointToMapPoint`（`SuperMapSceneViewer.vue:2893`）承担 |

### 1.2 场景映射函数（SuperMapSceneViewer.vue）

| 函数 | 定义位置 | 输入 | 输出 | 说明 |
|---|---|---|---|---|
| `mapPointToSceneCartesian(point, altitudeOffset=0)` | `SuperMapSceneViewer.vue:2544` | 本地米制 `SuperMapCupMapPoint` | `Cesium.Cartesian3` | 三分支：①`shouldUseThreeDTiles` → `mapPointToThreeTilesCartesian`（`:2545`）；②`geographicSceneMode` → `geoToCartesian(mapPointToGeo(point, altitudeOffset+0.7))`（`:2546`，`GLOBE_ALGORITHM_ALTITUDE_LIFT=0.7` 见 `:491`）；③否则 → `new Cartesian3(local.x, local.y, local.z)`，`local=mapPointToS3MLocal`（`:2547-2549`） |
| `geoToCartesian(geo)` | `SuperMapSceneViewer.vue:2538` | `SuperMapCupGeoPoint{longitude,latitude,altitude}` (EPSG:4490) | `Cesium.Cartesian3` (ECEF) | `Cartesian3.fromDegrees(lon, lat, alt)`（`:2541`） |
| `mapPointToS3MLocal(point, z=8)` | `SuperMapSceneViewer.vue:2663` | 本地米制 | S3M 本地场景坐标 `{x,y,z}`（EPSG:0 非地球本地系） | `nx=clamp(point.x/map.width,0,1)`；`ny=clamp(point.y/map.height,0,1)`（`:2665-2666`）；映射到 `LOCAL_S3M_BOUNDS` 矩形并叠加 `LOCAL_S3M_BUSINESS_OFFSET`（`:2668-2670`） |
| `mapDistanceToSceneMeters(distance)` | `SuperMapSceneViewer.vue:2681` | 本地米制距离 | 场景米 | 球面模式直接返回 `distance`（`:2682`）；本地模式 `distance · ((sx+sy)/2)`，`sx=(right−left)/width`，`sy=(top−bottom)/height`（`:2683-2686`） |
| `mapPointToThreeTilesCartesian(point, altitudeOffset)` | `SuperMapSceneViewer.vue:2552` | 本地米制 | `Cesium.Cartesian3` (ECEF) | 经 `threeTilesMapPointToEcef`：先 `mapPointToS3MLocal(point,0)` 再乘 4×4 `georef.transform`（`:2559-2566`） |
| `sceneLocalPointToMapPoint(point)` | `SuperMapSceneViewer.vue:2893` | S3M 本地场景坐标 | 本地米制（`nx,ny` 超 `[-0.18, 1.18]` 返回 null） | `mapPointToS3MLocal` 的逆运算（`:2897-2908`） |

---

## 2. 锚点偏移逻辑（SUPERMAP_CGCS2000_TRANSFORM / controlPoints）

### 2.1 锚点定义
- 常量 `SUPERMAP_CGCS2000_ANCHOR`（`supermapGeoreference.js:22-31`）：
  - `local = {x:0, y:0}`（场景原点）
  - `projected = {easting: 469313.780, northing: 3843337.292}`（CGCS2000 / EPSG:4547）
  - `wgs84 = {longitude: 113.6650, latitude: 34.7178}`（即 CP0 郑州国家基本气象站 57083）
  - `altitude = 108.0`
- CP0 锚点 = 郑州国家基本气象站 57083：`longitude 113.6650°E, latitude 34.7178°N, altitude 108.0m`（`supermapGeoreference.js:12-20`、`.env.development:27`、`.env.production:25`）

### 2.2 偏移值
- `SUPERMAP_CGCS2000_TRANSFORM`（`supermapGeoreference.js:33-45`）：
  - `sourceCoordSys = PCS_NON_EARTH_LOCAL_METER`，`targetCoordSys = CGCS2000_3GK_CM_114E`，`targetEpsg = 4547`，`geographicEpsg = 4490`
  - `anchorLocal {0,0}`、`anchorProjected {469313.780, 3843337.292}`、`anchorWgs84 {113.6650, 34.7178}`
  - `rotationDegrees = 0`、`scale = 1`、`xAxis = 'east'`、`yAxis = 'south'`
- 偏移量 = 锚点投影坐标本身：E 方向基准 `469313.780`，N 方向基准 `3843337.292`，本地原点(0,0)即锚点；本地系到投影系为纯平移 + 0.5 m/unit 缩放 + y 轴反向（南为正）。
- 控制点 `SUPERMAP_CGCS2000_CONTROL_POINTS`（`supermapGeoreference.js:47-54`）：CP0(0,0) 锚点；CP1(1218,230)、CP2(238,235)、CP3(1228,684)、CP4(0,0)、CP5(1587.2,947.2)。每个 CP 经 `localToProjected` + `localToWgs84` 自动算出投影与经纬度（`supermapGeoreference.js:56-67`）。

### 2.3 与真实 2D 数据坐标的偏差（关键）
- `.env.production` 注释块给出的真实园区 CGCS2000 矢量范围（`:45-48`）：`LEFT=457752.343, BOTTOM=3855297.972, RIGHT=459339.543, TOP=3856245.172`。
- 该范围中心约 E≈458546、N≈3855772，与 3D 锚点 E=469313.780、N=3843337.292 相差：ΔE≈−10768 m（偏西约 10.8 km）、ΔN≈+12435 m（偏北约 12.4 km），直线约 16.5 km。
- 即：**3D 场景锚点（57083 气象站）与真实 2D CGCS2000 矢量数据（园区真实位置）不在同一处**，两者投影坐标相差约 16 km。这正是 f1-f2 调查中"算法/2D 数据坐标误喂 3D 转换层"会彻底飘走的结构性根因。

---

## 3. REAL_MAP / mapMetersPerUnit / 本地坐标系范围

- `REAL_MAP`（`realMapAssets.js:1-13`）：`width = 1587.2`、`height = 947.2`（米）；源 DOM 31744×18944 px @ 0.05 m/px，资产 3968×2368 px @ 0.4 m/px（31744·0.05=1587.2 ✓，18944·0.05=947.2 ✓）。
- `SUPERMAP_MAP_SIZE`（`supermapGeoreference.js:6-10`）：`width=1587.2, height=947.2, mapMetersPerUnit=0.5`。
- `SUPERMAP_CUP_SCENARIO.map`（`supermapCupScenario.ts:116-126`）：`width=1587.2, height=947.2, gridSize=20, mapMetersPerUnit=0.5`，与 `REAL_MAP` 一致。
- env 印证：`.env.development:24` / `.env.production:22` 均 `VITE_SUPERMAP_MAP_METERS_PER_UNIT = 0.5`。
- **本地坐标系范围**：`x ∈ [0, 1587.2]`、`y ∈ [0, 947.2]`，原点(0,0)=西北角=57083 锚点投影(469313.780, 3843337.292)，x 向东增、y 向南增；对角点(1587.2, 947.2)对应投影(470106.78, 3842863.69)（与 `.env.development:32-35` 的 2D 包络 `LEFT=469313.780, BOTTOM=3842863.692, RIGHT=470107.380, TOP=3843337.292` 吻合，说明 2D 本地米制包络与 3D 锚点自洽，但与真实 CGCS2000 矢量包络 `457752/3855297` 不一致）。

---

## 4. dev 球面 CGCS2000 模式下 mapPointToSceneCartesian 调用链

### 4.1 env 与模式判定
- `.env.development:20` `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION = true`；`.env.production:18` `= false`。
- `shouldApplyLayerPosition = DEV || (VITE_SUPERMAP_3D_APPLY_LAYER_POSITION !== 'false')`（`SuperMapSceneViewer.vue:569-571`）。DEV 短路为 true；prod 为 false。
- `shouldUseThreeDTiles = Boolean(tilesetUrl) && (DEV || VITE_SUPERMAP_3D_USE_3DTILES==='true')`（`:561-563`）。DEV 下 `tilesetUrl='/local-pic/chemical-park-3dtiles/tileset_open_parcel_57083.json'`（`:558-560`）非空 → **DEV 下 shouldUseThreeDTiles = true**（git status 显示 `frontend/public/local-pic/` 已存在）。
- `geographicSceneMode = shouldApplyLayerPosition || shouldUseThreeDTiles`（`:572`）。

### 4.2 实际触发分支（与任务描述存在偏差，需重点指出）
`mapPointToSceneCartesian`（`:2544-2550`）三分支顺序：
1. `if (shouldUseThreeDTiles.value) return mapPointToThreeTilesCartesian(...)`（`:2545`）—— **DEV 实际走这里**
2. `if (geographicSceneMode.value) return geoToCartesian(mapPointToGeo(point, altitudeOffset + 0.7))`（`:2546`）
3. `new Cartesian3(local.x, local.y, local.z)`，`local = mapPointToS3MLocal`（`:2547-2549`）—— prod 走这里

**关键偏差**：任务描述"dev 球面 CGCS2000 模式 → mapPointToGeo → Cartesian3"对应分支②，但分支②被分支①遮蔽——DEV 下 `shouldUseThreeDTiles=true` 先返回。分支②仅在 `geographicSceneMode=true && shouldUseThreeDTiles=false` 时触发，当前两份 env 均不产生此组合（DEV 强制 threeTiles=true，prod 强制 geographicSceneMode=false），属**当前不可达分支**。

### 4.3 分支②（用户所指"dev 球面 CGCS2000"）完整调用链
本地点 `{x,y}` → `mapPointToGeo(point, altitudeOffset+0.7)`（`supermapCupScenario.ts:136`）
  → `worldToGeo(x,y)`（`coordinate.js:32`）：altitude 估算 + `localToWgs84(x,y,alt)`（`coordinate.js:39`）→ `localToProjected(x,y)`（`supermapGeoreference.js:69`）+ `projectedToWgs84(easting,northing,alt)`（`supermapGeoreference.js:92`）
  → 返回 `{longitude, latitude, altitude, easting, northing, projectedEpsg:4547}`
→ `geoToCartesian(geo)`（`SuperMapSceneViewer.vue:2538`）→ `Cartesian3.fromDegrees(lon, lat, alt)`（`:2541`）

### 4.4 DEV 实际链路（threeTiles，分支①）
本地点 → `mapPointToThreeTilesCartesian`（`:2552`）→ `threeTilesMapPointToEcef`（`:2559`）→ `mapPointToS3MLocal(point,0)`（`:2561`）→ `multiplyMatrix4ByPoint(georef.transform, localX, localY, alt/scaleZ)`（`:2565`）→ ECEF → 包成 `Cartesian3`（`:2556`）。**此链不走 mapPointToGeo**，走的是 `mapPointToS3MLocal` 归一化 + 4×4 矩阵。

---

## 5. prod 本地 EPSG:0 S3M 模式下 mapPointToS3MLocal 归一化与 clamp

### 5.1 模式判定
prod：`shouldUseThreeDTiles=false`（`USE_3DTILES=false`，`.env.production:14`）、`shouldApplyLayerPosition=false`（`:18`）、`geographicSceneMode=false` → `mapPointToSceneCartesian` 走分支③，调用 `mapPointToS3MLocal`。

### 5.2 归一化与 clamp 逻辑（`SuperMapSceneViewer.vue:2663-2672`）
```
map = SUPERMAP_CUP_SCENARIO.map  // width=1587.2, height=947.2
nx = clamp(point.x / map.width, 0, 1)   // 0..1
ny = clamp(point.y / map.height, 0, 1)  // 0..1
x = LOCAL_S3M_BOUNDS.left  + nx*(right-left) + LOCAL_S3M_BUSINESS_OFFSET.x
y = LOCAL_S3M_BOUNDS.top   - ny*(top-bottom)  + LOCAL_S3M_BUSINESS_OFFSET.y
z = z (入参，默认 8)
```
- `LOCAL_S3M_BOUNDS`（`:471-476`）：`left=-1605.9165, right=810.4163, bottom=-1130.1392, top=878.3000`。
- `LOCAL_S3M_BUSINESS_OFFSET`（`:482-485`）：`{x:260, y:0}`。
- **clamp 范围**：`point.x` 被 `clamp(·,0,1)` 限到 `[0,1]`，即 `point.x ≤ 0` → nx=0（左边界），`point.x ≥ 1587.2` → nx=1（右边界）；`point.y` 同理 clamp 到 `[0,1]`（底/顶边界）。任何超出 `[0,1587.2]×[0,947.2]` 的输入被压到 4 个角/边之一。
- 归一化后输出范围（叠加 offset 后）：`x ∈ [left+offset.x, right+offset.x] = [-1345.92, 1070.42]`；`y ∈ [bottom, top] = [-1130.14, 878.30]`。

### 5.3 距离缩放（mapDistanceToSceneMeters，`:2681-2687`）
- `sx = (right−left)/width = (810.4163−(−1605.9165))/1587.2 = 2416.3328/1587.2 ≈ 1.5224`
- `sy = (top−bottom)/height = (878.3000−(−1130.1392))/947.2 = 2008.4392/947.2 ≈ 2.1207`
- `avg ≈ 1.8216` → prod 下 `mapDistanceToSceneMeters(d) = d × 1.8216`（球面模式原样返回 d）。

---

## 6. 关键推算：CGCS2000 投影坐标误当本地系喂给 mapPointToSceneCartesian

假设误喂 `point = {x: 457000, y: 3855000}`（即真实 2D CGCS2000 园区矢量坐标量级，见 `.env.production:45-48` 的 457752/3855297）。

### 6.1 分支②（geographicSceneMode 球面路径，走 mapPointToGeo）

**Step 1 — `worldToGeo(457000, 3855000)`（`coordinate.js:32-49`）：**
- `normalizedY = clamp(3855000, 0, 947.2) = 947.2`（被 clamp 到顶）
- `altitude = 0 + (947.2−947.2)·0.02 + sin(457000/90)·1.8 + cos(3855000/70)·1.2`
  - `457000/90 ≈ 5077.78 rad`，`5077.78 mod 2π ≈ 1.047 rad` → `sin ≈ 0.866` → `·1.8 ≈ 1.56`
  - `3855000/70 ≈ 55071.43 rad`，`mod 2π ≈ 1.36 rad` → `cos ≈ 0.208` → `·1.2 ≈ 0.25`
  - `altitude ≈ 1.81 m`（仅 ±3 m 量级振荡，未爆）
- `projected = localToProjected(457000, 3855000)`：
  - `metersX = 457000·0.5 = 228500`
  - `metersY = 3855000·0.5 = 1927500`
  - `easting = 469313.780 + 228500 = 697813.780`
  - `northing = 3843337.292 − 1927500 = 1915837.292`
- `geo = projectedToWgs84(697813.780, 1915837.292, 1.81)`：
  - `dx = 697813.780 − 469313.780 = 228500`
  - `dy = 1915837.292 − 3843337.292 = −1927500`
  - `latitude = 34.7178 + (−1927500)/111320 = 34.7178 − 17.3186 = 17.3992°`
  - `longitude = 113.6650 + 228500/(111320·0.8220) = 113.6650 + 228500/91517.8 = 113.6650 + 2.4968 = 116.1618°`
  - `altitude ≈ 108 + 1.81 = 109.81 m`（`projectedToWgs84` 在 altitude 上叠加锚点 108，`supermapGeoreference.js:101`）

**Step 2 — `mapPointToGeo` 返回**（`supermapCupScenario.ts:139-146`）：
- `longitude ≈ 116.1618°E, latitude ≈ 17.3992°N, altitude ≈ 109.81 + altitudeOffset m`
- `easting ≈ 697813.78, northing ≈ 1915837.29, projectedEpsg = 4547`

**Step 3 — `geoToCartesian`（`SuperMapSceneViewer.vue:2541`）**：
- `Cartesian3.fromDegrees(116.1618, 17.3992, 109.81)` → 落点约 **(113.665, 34.718) → (116.162, 17.399)**，即郑州向东南偏移 Δlat≈−17.32°（约 1927 km 向南）、Δlon·cos≈2.497°·0.82（约 228 km 向东），直线 **约 1940 km**，落入福建/广东沿海以南、近海区域。

**结论（分支②）**：是的，**锚点偏移被叠加**（先 `+469313.780/3843337.292` 再反算经纬度），原始 457000/3855000 的米级数值先 ×0.5 再加锚点，使 lon/lat 偏移达 17°+，彻底飘走约 1940 km；altitude 因 `worldToGeo` 内部 clamp 保持在 ~110 m 量级未爆，但 lon/lat 不可用。注意 `worldToGeo` 对 lon/lat 用未 clamp 的原始 `wx,wy`（`coordinate.js:39`），clamp 只作用于 altitude 分量，故 lat/lon 失真不会被 clamp 兜住。

### 6.2 分支①（DEV 实际 threeTiles 路径）
- `mapPointToS3MLocal(457000, 3855000, 0)`：
  - `nx = clamp(457000/1587.2, 0, 1) = clamp(287.92, 0, 1) = 1`
  - `ny = clamp(3855000/947.2, 0, 1) = clamp(4070.2, 0, 1) = 1`
  - `x = −1605.9165 + 1·(810.4163−(−1605.9165)) + 260 = 810.4163 + 260 = 1070.4163`
  - `y = 878.3000 − 1·(878.3000−(−1130.1392)) + 0 = −1130.1392`
  - `z = 0`
- 再 `multiplyMatrix4ByPoint(THREE_TILES_FALLBACK_GEOREFERENCE.transform, 1070.42, −1130.14, alt/0.16)`（`SuperMapSceneViewer.vue:2565`、fallback 矩阵 `:431-465`）→ 一个固定的 ECEF 点。
- **所有 x≥1587.2 或 y≥947.2 的输入点全部 clamp 到同一角点 (1070.42, −1130.14)**，经矩阵映射到同一 ECEF 点 → 路径塌成一点。

### 6.3 分支③（prod 本地 S3M 模式）
- `mapPointToS3MLocal(457000, 3855000, altitudeOffset)` 与 6.2 相同的 clamp 计算：
  - `nx=1, ny=1` → `x=1070.4163, y=−1130.1392, z=altitudeOffset`
- `new Cartesian3(1070.4163, −1130.1392, altitudeOffset)`（`:2549`）
- **路径塌缩**：一条由 N 个 CGCS2000 投影点（E≈457000, N≈3855000 量级）组成的路径，每个点 `point.x/1587.2 ≈ 288 ≫ 1`、`point.y/947.2 ≈ 4070 ≫ 1`，全部 clamp 到 `(1070.42, −1130.14)` 同一点 → **整条路径塌成 S3M 本地坐标系东南角（右下边界 + business offset）的单一点**。即使路径在真实 CGCS2000 下有几十米跨度，由于跨度（~1600 m）远小于坐标量级（~457000 m），`point.x/1587.2` 的相对差异被 clamp 抹平，路径完全不可分辨。

### 6.4 量级对照表

| 输入 | 分支② lon/lat | 分支②/① projected | 分支①/③ S3M local (clamp 后) | 距真实位置 |
|---|---|---|---|---|
| (457000, 3855000) | (116.1618°E, 17.3992°N) | (697813.78, 1915837.29) | (1070.42, −1130.14) | 分支② 偏 ~1940 km；分支①/③ 塌成单点 |
| 正常本地 (800, 400) | ≈(113.6696°E, 34.7160°N) | (469713.78, 3843137.29) | (≈258.9, 255.5) | 落在园区内，正确 |

---

## 7. 附：mapPointToGeo / localToProjected / projectedToLocal / mapPointToSceneCartesian 调用点清单

### 7.1 mapPointToGeo（定义 `supermapCupScenario.ts:136`）
- `supermapCupScenario.ts:109` `sourceGeoPoint`、`:111` `sceneCenterGeoPoint`、`:113-114` `geoBounds.northWest/southEast`、`:354` `toScenarioSensor.geoPoint`、`:398` `toSupportScenarioSensor.geoPoint`
- `SuperMapSceneViewer.vue:1245` 传感器、`:1379` 估算点、`:1758` 传感器挂载、`:1848` 椭圆 altitude、`:2284` 风险椭圆、`:2694` describeMapPoint、`:2729` 传感器投影、`:2882` 草稿点、`:3030` gisSnapshot、`:3058` 场景中心、`:3070` 传感器
- `views/screen/index.vue:515` 业务 geo、`:565` payload geoPoint

### 7.2 localToProjected（定义 `supermapGeoreference.js:69`）
- `supermapGeoreference.js:57` controlPoint、`:88` localToWgs84
- `coordinate.js:38` worldToGeo
- `supermapCupScenario.ts:9`(import)、`:138` mapPointToGeo
- `monitoringSensorStandard.ts:262`
- `SuperMapSceneViewer.vue:166`(import)、`:1622` 本地点→投影

### 7.3 projectedToLocal（定义 `supermapGeoreference.js:78`）
- `coordinate.js:55` geoToWorld、`:66` projectedToWorld
- `SuperMapSceneViewer.vue:167`(import)、`:1476`/`:1483`/`:1518`/`:1526` 路径点→本地、`:2758` 投影→本地、`:2875` 拾取投影→本地、`:2959`/`:2993` geo→本地

### 7.4 mapPointToSceneCartesian（定义 `SuperMapSceneViewer.vue:2544`）
- `SuperMapSceneViewer.vue:1247`、`:2202`、`:2232`、`:2233`、`:2267`、`:2311`、`:2337`、`:2370`、`:2420`、`:2435`、`:2636`、`:2660`、`:3597`、`:3620`、`:3724` 等大量实体/路径定位

---

## 8. 结论摘要

1. **坐标系三段式**：本地米制(PCS_NON_EARTH_LOCAL_METER, [0,1587.2]×[0,947.2], 0.5 m/unit, y 向南) ⇄ CGCS2000 投影(EPSG:4547, 锚点 469313.780/3843337.292) ⇄ CGCS2000 地理(EPSG:4490, 113.6650°E/34.7178°N)。`localToProjected/projectedToLocal` 用 0.5 m/unit + y 反向；`projectedToWgs84` 用 111320 m/° 平面近似。
2. **3D 锚点与真实 2D 数据错位 ~16 km**：3D 锚定 57083 气象站(E 469313/N 3843337)，而真实园区 CGCS2000 矢量在 E≈457752/N≈3855297（`.env.production:45-48`），两者投影相差 ΔE≈10.8 km、ΔN≈12.4 km，是坐标混淆的结构性根因。
3. **dev 实际走 threeTiles 分支，非 mapPointToGeo**：`shouldUseThreeDTiles` 在 DEV 被 `DEV||` 短路为 true（`SuperMapSceneViewer.vue:561-563`），`mapPointToSceneCartesian:2545` 的 threeTiles 分支先于 `:2546` 的 `geoToCartesian(mapPointToGeo(...))` 分支返回；分支②当前在两份 env 下均不可达。
4. **误喂 CGCS2000 投影(457000,3855000) 的后果**：分支②经 mapPointToGeo + 锚点叠加 → lon/lat 偏到 (116.16°E, 17.40°N)，飘走约 1940 km（altitude 因 clamp 仍 ~110 m，造成"高程正常但水平彻底错位"的隐蔽假象）；分支①/③经 `point.x/1587.2` clamp 全部压到 (1070.42, −1130.14) 单点 → 路径塌成一点。
5. **worldToGeo 的 clamp 只覆盖 altitude 分量**（`coordinate.js:33` clamp `wy`，但 `:39` `localToWgs84(wx,wy,alt)` 仍用原始未 clamp 的 `wx,wy`），这是 dev 路径下 lat/lon 失真不被兜底的关键细节。
