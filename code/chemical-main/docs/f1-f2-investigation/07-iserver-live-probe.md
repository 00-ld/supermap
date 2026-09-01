# iServer 实际请求探针结果（F2 判据实锤）

> 探针时间：2026-07-18
> 方法：直接 curl 远程 iServer（https://www.chemgas.lab6119.xyz），不经前端，查数据集 prjCoordSys + 取真实 feature 看坐标字段
> 目的：确认 iServer 网络分析返回 path 点的真实坐标系，作为 F2 修复方向最终判据

---

## 1. 数据集坐标系（元信息，决定性）

`GET /iserver/services/data-chemical_park_vectors_cgcs2000/rest/data/datasources/name/chemical_park_vectors_cgcs2000.json` 返回 `datasourceInfo.prjCoordSys`：

```json
{
  "epsgCode": 4547,
  "name": "China_2000_3_DEGREE_GK_ZONE_38N",
  "type": "PCS_CHINA_2000_3_DEGREE_GK_38N",
  "projection": {"name": "Gauss_Kruger", "type": "PRJ_GAUSS_KRUGER"},
  "projectionParam": {
    "centralMeridian": 114,
    "falseEasting": 500000,
    "falseNorthing": 0
  },
  "coordUnit": "METER",
  "distanceUnit": "METER",
  "coordSystem": {"name": "GCS_China_2000", "datum": {"name": "D_China_2000"}, "spheroid": {"name": "CGCS2000", "axis": 6378137}}
}
```

**判定**：数据集是标准 CGCS2000 3 度带中央经线 114E 高斯-克吕格投影（EPSG:4547），东伪偏 falseEasting=500000。园区位于中央经线西侧约 4-5 万米，故 easting 量级必然是 **45 万级（455000~460000）**，northing 约 **385 万级**（北纬 34°→ 3850000）。

---

## 2. 真实 feature 坐标（实锤）

### 2.1 数据集字段（含多套预存坐标系）
`Park_RoadNetworkEdge_L` 字段：`SMID, ROADID, FROMNODE, TONODE, MAIN, LENGTH_M, MAPX, MAPY, S3MX, S3MY, LONGITUDE, LATITUDE, LOCALMAPX, LOCALMAPY, CGCS2000E, CGCS2000N, COORDSYS, EPSG, ANCHOR`

**数据集预存了 4 套坐标**：geometry(CGCS2000投影)、LOCALMAPX/Y(本地)、S3MX/Y(S3M场景)、LONGITUDE/LATITUDE(经纬度)。

### 2.2 edge-01（road-north-main-edge-01）
`GET /iserver/services/.../feature/0-2-0.json`：
- `geometry.points`: `[{x:457752.343,y:3856009.172},{x:457990.343,y:3856009.172}]`
- `CGCS2000E/N`: `(457871.343, 3856009.172)`
- `LOCALMAPX/Y`: `(119.0, 236.0)`
- `MAPX/Y`: `(119.0, 236.0)`
- `S3MX/Y`: `(-1424.752, 377.887)`
- `LONGITUDE/LATITUDE`: `(113.53946126, 34.83164647)`
- `COORDSYS`: `CGCS2000_3GK_CM_114E`
- `EPSG`: `4547`
- `ANCHOR`: **`HAUT_Lianhua_SouthGate_CP0`**

### 2.3 edge-02（road-north-main-edge-02）交叉验证
`GET /iserver/services/.../feature/0-2-1.json`：
- `geometry.points`: `[{x:457990.343,y:3856009.172},{x:458151.343,y:3856009.172}]`
- `LOCALMAPX/Y`: `(318.5, 236.0)`
- `CGCS2000E/N`: `(458070.843, 3856009.172)`
- `LONGITUDE/LATITUDE`: `(113.54164445, 34.83164647)`
- `ANCHOR`: `HAUT_Lianhua_SouthGate_CP0`

---

## 3. 实锤结论

### 3.1 iServer 返回 path 的坐标系 = 457752 系（不是 dev anchor 的 469313 系）

iServer 数据集几何坐标、CGCS2000E/N 字段全部是 **457752/3856009 量级**。网络分析返回的 path 点坐标系 = 数据集坐标系 = **CGCS2000 投影 457752 系**。

### 3.2 真实锚点是 HAUT_Lianhua_SouthGate_CP0，不是郑州 57083 气象站

- 数据集 `ANCHOR` 字段：`HAUT_Lianhua_SouthGate_CP0`（河南工业大学莲花校区南门 CP0）
- 数据集 `LONGITUDE/LATITUDE`：`(113.53946°E, 34.83165°N)`
- 前端 `supermapGeoreference.js:12-20` 的 CP0：郑州国家基本气象站 57083，`(113.6650°E, 34.7178°N)`，投影 `(469313.780, 3843337.292)`
- **两者相差**：经度 Δ≈0.126°（约 11.5 km 偏东），纬度 Δ≈0.114°（约 12.7 km 偏南），直线约 17 km。
- 前端把锚点标成"郑州 57083 气象站"是**错误的地理标识**，真实园区在河南工业大学莲花校区南门附近。

### 3.3 前端本地系与 iServer 本地系是两套不同的本地系

| 项 | 前端 realMapAssets/supermapGeoreference | iServer 数据集 LOCALMAPX/Y |
|---|---|---|
| 本地系范围 | x∈[0,1587.2], y∈[0,947.2] | 待全量统计（edge-01 x=119, edge-02 x=318.5） |
| mapMetersPerUnit | 0.5 | ≈1.193（推算：ΔE 238 / Δlocal 199.5） |
| 锚点投影 | (469313.780, 3843337.292) | (457752.343, 3856009.172)（园区真实位置） |
| 锚点经纬度 | (113.6650, 34.7178) 57083 | (113.53946, 34.83165) HAUT莲花南门 |

**前端本地系与 iServer 本地系不可互换**：同一几何实体，前端本地坐标 (假设) 与 iServer LOCALMAPX/Y 数值不同，因锚点和单位都不同。

---

## 4. 对 02 报告推断的修正

02 报告第 5 节推断"iServer 返回 path 是 469313 系（dev anchor），dev 闭环正确"——**此推断错误**。

实际：iServer 返回 path 是 **457752 系**。dev 前端用 469313 anchor：
1. `buildProjectedNetworkPayload` 把本地起点 (238,235) 经 `localToProjected`（469313 anchor, 0.5 m/unit）算成 `(469432.780, 3843219.792)` 发给 iServer。
2. iServer 在 457752 系路网上找最近点——起点 469432 距离真实路网（457752 系）约 11.6 km，**吸附到最近的网络节点（可能是路网边缘某个点），或直接返回"不可达"**。
3. 即便 iServer 容差吸附返回 path，path 点是 457752 系（如 457871/3856009）。
4. 前端 `projectedToLocal(457871, 3856009)`（用 469313 anchor）= `((457871-469313)/0.5, (3843337-3856009)/0.5)` = `(-22884, -25344)` ——**本地坐标负几万，远超 [0,1587] 范围**。
5. 落图时（dev threeTiles 分支）`mapPointToS3MLocal(-22884, -25344)`：nx=clamp(-22884/1587.2,0,1)=0, ny=clamp(-25344/947.2,0,1)=0 → **整条路径塌到场景西北角单点**。

**结论：dev 疏散路径当前是塌的/飘的，不是 02 报告说的"闭环正确"。** 这与任务清单 F2 原始描述"路径会飘到完全错误的位置 / 塌成一个点"一致。

---

## 5. F2 修复方向（基于实锤修正）

### 根因
前端 `supermapGeoreference.js` 的锚点（469313/57083）与 iServer 数据集真实锚点（457752/HAUT莲花南门）不一致，差约 17 km。所有 `localToProjected`/`projectedToLocal` 用错误锚点，导致 dev 投影坐标发给 iServer 时错位，iServer 返回的 path 逆变换后塌成负坐标。

### 正确锚点（从 iServer 数据集实读）
- 锚点名：`HAUT_Lianhua_SouthGate_CP0`
- 投影：`easting=457752.343, northing=3856009.172`（取 edge-01 起点）
- 经纬度：`longitude=113.53946126, latitude=34.83164647`
- 本地系单位：约 1.193 m/unit（待用更多 feature 精确标定，或从数据集 LOCALMAPX/Y 与 CGCS2000E/N 反算）

### 修复方案
**方案 1（推荐，改前端锚点对齐 iServer）**：
- `supermapGeoreference.js` 的 `SUPERMAP_CGCS2000_ANCHOR` 改为 iServer 实读值：
  - `projected = {easting: 457752.343, northing: 3856009.172}`
  - `wgs84 = {longitude: 113.53946126, latitude: 34.83164647}`
- `mapMetersPerUnit` 从 0.5 改为 iServer 实际单位（需用更多 feature 精确反算，或读数据集 LOCALMAP 全范围）。
- 同步改 `.env.development`/`.env.production` 的 `VITE_SUPERMAP_ANCHOR_CGCS2000`、`VITE_SUPERMAP_CP0_LONGITUDE/LATITUDE` 等所有锚点相关变量。
- 改后 dev 投影起点 = 457752 系，与 iServer 数据集同系，iServer 正常吸附返回 path，`projectedToLocal` 逆变换回正确本地系。
- **风险**：改锚点会影响所有用 localToProjected 的地方（传感器、建筑、扩散椭圆、3D Tiles 定位），需全面回归。

**方案 2（iServer 数据集已预存 LOCALMAPX/Y，前端直接用）**：
- iServer feature 已带 `LOCALMAPX/Y` 字段（119/236 等），这是 iServer 数据集自己的本地系。
- 若前端 `loadSuperMapPlanningInputs` 从 iServer 拉 roads 时直接用 feature 的 LOCALMAPX/Y 作为本地坐标，绕过前端自己的 localToProjected，则前后端本地系一致。
- 但前端 realMapAssets.js 的 roads/buildingEntrances 是硬编码本地坐标（0~1587 系），与 iServer LOCALMAPX/Y 可能不是同一本地系（单位/锚点不同）。需核实 realMapAssets 本地系与 iServer LOCALMAP 系是否同源。

### 待进一步核实
1. iServer LOCALMAPX/Y 的全量范围（取所有 93 条 edge + 14 个 entrance）确认本地系范围与单位。
2. 前端 realMapAssets.js 硬编码本地坐标（如 road-north-main x=0,y=226,w=1587.2）与 iServer LOCALMAPX/Y（edge-01 localMapX=119）是否对应同一物理位置——若 realMapAssets 的 (0,226) 对应 iServer LOCALMAP 的 (?,?)，则两套本地系有映射关系；若不对应，则前端硬编码数据本身就用错了坐标系。
3. path.rjson 502 的原因（可能需要 POST + 正确的 nodes 字段格式，或 iServer 需登录 token）——但第 1/2 节的元信息+feature 已足够定论，path.rjson 实跑非必须。

### F2 状态（基于实锤修正）
**未修复，根因明确**：前端锚点错误（469313/57083 vs 真实 457752/HAUT莲花南门），差 17km。修复需改 supermapGeoreference.js 锚点 + 同步 env + 全链路回归。修复杂度高于原任务预估，建议作为 F2 的核心修复项。

**红线遵守**：本探针如实记录 iServer 返回坐标系为 457752 系，修正了 02 报告"dev 闭环正确"的错误推断。F2 在锚点未对齐前不写"已修复"。

---

## 6. 证据索引

| 结论 | 证据 |
|---|---|
| 数据集 EPSG:4547 中央经线 114E | `GET /rest/data/datasources/name/chemical_park_vectors_cgcs2000.json` → prjCoordSys |
| 数据集真实坐标 457752 系 | `GET /rest/data/feature/0-2-0.json` → geometry.points + CGCS2000E/N |
| 真实锚点 HAUT 莲花南门 | feature ANCHOR 字段 = `HAUT_Lianhua_SouthGate_CP0` |
| 真实经纬度 113.539/34.832 | feature LONGITUDE/LATITUDE 字段 |
| 前端错误锚点 469313/57083 | `supermapGeoreference.js:12-24` |
| iServer 内部端口 18090 | feature 返回的 path 字段 `http://127.0.0.1:18090/...` |
| 数据集 93 条 edge | `Park_RoadNetworkEdge_L.json` → recordCount:93 |
| 14 个 entrance | `Park_EntrancePoint_P/features.json` → featureCount:14 |
