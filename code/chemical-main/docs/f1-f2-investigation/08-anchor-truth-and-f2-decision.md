# F2 根因定论与修复方案（基于用户确认 A 为真实锚点）

> 生成时间：2026-07-18
> 基于用户确认：三维场景真实正确锚点是 A (113.569463, 34.76965)——3D Tiles 模型实际锚定的位置
> 前置：07-iserver-live-probe.md（iServer 数据集实测）、03-coord-transform.md（前端坐标层）

---

## 1. 四个位置全景

| 代号 | 经度 | 纬度 | CGCS2000投影(E,N) | 来源 | 状态 |
|---|---|---|---|---|---|
| **A** | **113.569463** | **34.76965** | (460630, 3870557) 近似 / 实际以 tileset 为准 | `tileset_open_parcel_57083.json` + `SuperMapSceneViewer.vue:424/456` DEFAULT_CAMERA 与 threeTilesGeoreference.anchor | **✅ 用户确认的正确锚点** |
| B | 113.6650 | 34.7178 | (469313.780, 3843337.292) | env `ANCHOR_WGS84`/`LAYER_POSITION` + `ZHENGZHOU_STATION_57083` + `supermapGeoreference.js:24` | ⚠️ 当前算法坐标系锚点（57083气象站，错误） |
| C | 113.665197 | 34.7178 | ≈B | `tileset_zhengzhou_57083.json`（pic 目录） | 旧 tileset，未被 dev 使用 |
| D | 113.53946 | 34.83165 | **(457752.343, 3856009.172)** iServer 实测 | iServer feature LONGITUDE/LATITUDE + geometry.points | iServer 路网真实位置（HAUT 莲花南门，旧数据） |

## 2. 距离关系（平面近似，仅供量级）

- A vs D：约 7.4 km（iServer 路网在三维模型西南方）
- A vs B：约 10.5 km（57083 气象站在三维模型东南方）
- B vs D：约 17 km

## 3. F2 真正根因（修正先前所有推断）

**根因：iServer 路网数据集（D，HAUT 莲花南门）与三维模型锚点（A，用户确认的正确位置）不在同一地理位置，差约 7.4 km。**

链路问题拆解：

### 3.1 前端算法坐标系锚点 = B（57083），错误
- `supermapGeoreference.js:22-31` `SUPERMAP_CGCS2000_ANCHOR.projected = (469313.780, 3843337.292)`，wgs84 = (113.6650, 34.7178)。
- `localToProjected`/`projectedToLocal` 全部用这个锚点。
- **应改为 A**：把锚点改成 (113.569463, 34.76965) 对应的投影坐标。

### 3.2 iServer 路网数据集 = D（HAUT 南门），与 A 差 7.4km
- iServer 数据集几何坐标是 457752/3856009 系（D 的投影）。
- 即使把前端锚点改成 A，iServer 路网仍在 D，前端发投影坐标给 iServer 时起点在 A 系（460630 量级），iServer 路网在 D 系（457752 量级），**起点偏离路网约 2.9km（dE）+ 14.5km（dN）**，iServer 会吸附失败或返回错误路径。
- **iServer 数据集必须重新发布到 A 系**，或前端发 iServer 时用 D 系锚点投影（但这样路径返回后又要 D→A 转换）。

### 3.3 三维模型锚点 = A（正确）
- 3D Tiles `tileset_open_parcel_57083.json` 里 `longitude=113.569463, latitude=34.76965`，模型正确锚在 A。
- `threeTilesGeoreference.anchor`（SuperMapSceneViewer.vue:455-459）也是 A。
- **这部分不用改**。

## 4. F2 修复方案

### 方案选择：分两段，iServer 数据 vs 前端锚点

#### 4.1 前端算法锚点 B → A（代码改，可立即做）
- `supermapGeoreference.js:22-31` `SUPERMAP_CGCS2000_ANCHOR`：
  - `wgs84 = {longitude: 113.569463, latitude: 34.76965}`
  - `projected` 改为 A 对应的 EPSG:4547 投影值（需精确算，用 pyproj 或 iServer coordtransfer 服务）
  - `altitude` 保持或按 A 调整
- `.env.development`/`.env.production`：`VITE_SUPERMAP_ANCHOR_WGS84`、`VITE_SUPERMAP_ANCHOR_CGCS2000`、`VITE_SUPERMAP_3D_LAYER_POSITION`、`VITE_SUPERMAP_CP0_*` 全部改 A
- `ZHENGZHOU_STATION_57083` 常量（SuperMapSceneViewer.vue:165 import）改名为真实锚点（如 `CHEMICAL_PARK_ANCHOR`），值改 A
- 改后：`localToProjected(本地x,y)` 产出 A 系投影坐标，`mapPointToGeo` 产出 A 经纬度，与三维模型对齐。

#### 4.2 iServer 路网数据集 D → A（数据改，阻塞于 iDesktopX）
- iServer 数据集当前在 D（HAUT 南门），需在 iDesktopX 里把路网数据平移到 A，或重新发布。
- **这是数据层任务，前端代码改不了**。前端只能：
  - 方案 a：等 iServer 数据重发布到 A 后，前端锚点改 A 即可全链路对齐。
  - 方案 b：iServer 数据不动（保持 D），前端发 iServer 请求时用 D 系锚点投影起点，iServer 返回 D 系 path 后，前端把 path 从 D 系转 A 系再落图。这要在 `buildProjectedNetworkPayload` 和 `runSuperMapNetworkEvacuation` 里做 D↔A 双锚点转换。

### 4.3 推荐执行顺序
1. **先做 4.1（前端锚点改 A）**——立即可做，让算法坐标系与三维模型对齐。改后 Python D* Lite 链路（本地系自洽）和三维落图（本地→A 经纬度→ECEF）都对齐 A。**Python 链路立即修复**。
2. **iServer 链路（4.2）**：iServer 数据集在 D，前端锚点改 A 后，iServer 请求起点（A 系）与路网（D 系）仍错位 7.4km。需选 4.2 方案 a（等数据重发布）或方案 b（前端做 D↔A 转换）。**方案 b 可立即做，方案 a 阻塞 iDesktopX**。
3. 若选方案 b：在 `buildProjectedNetworkPayload` 用 D 系锚点（457752/3856009）投影起点发给 iServer，iServer 返回 D 系 path，`runSuperMapNetworkEvacuation` 先 `projectedToLocal_D(path)` 回 D 本地系，再 D本地→A本地（两套本地系的平移），最后 A 本地→落图。**复杂，但能让 iServer 链路立即工作**。

## 5. 待用户/Codex 确认

1. **iServer 路网数据集能否重发布到 A？** 若能，走 4.2 方案 a，最干净。若不能（iDesktopX 不在手边/数据制作成本高），走方案 b（前端双锚点转换）。
2. **A 的精确投影坐标**：需用 pyproj 或 iServer coordtransfer 服务精确算 A(113.569463,34.76965) 的 EPSG:4547 投影值，平面近似不够（D 的近似 N 偏了 2 万米）。可问 Codex 是否已有 A 的精确投影值。
3. **前端 realMapAssets.js 本地坐标系**：它的本地坐标（0~1587, 0.5 m/unit）对应 A 还是 D 还是第三套？需核实 realMapAssets 本地系与三维模型的对应关系——若 realMapAssets 本地系本身就是为 A 设计的（0.5 m/unit, 原点=A 西北角），则 4.1 改锚点后 Python 链路直接对；若 realMapAssets 本地系是 D 的，则本地数据也要重做。

## 6. F2 当前状态（如实）

**未修复。根因明确**：前端算法锚点 B(57083) 错误，应改 A；iServer 路网数据集在 D(HAUT南门) 与 A 差 7.4km，需数据重发布或前端双锚点转换。

**红线遵守**：
- 不冒充已修复。4.1 前端锚点改 A 后，Python 链路可标"已对齐 A"，但 iServer 链路在 4.2 完成前仍标"阻塞/部分修复"。
- 不夸大坐标系一致性。A/D/B 三点不在同一位置，iServer 数据集未重发布前，iServer 链路无法与三维模型对齐。
- iServer 数据集重发布是 iDesktopX 任务，前端代码改不了，不写"路网已对齐"。

## 7. 证据索引

| 结论 | 证据 |
|---|---|
| A 是三维模型真实锚点 | `frontend/public/local-pic/chemical-park-3dtiles/tileset_open_parcel_57083.json` → longitude=113.569463, latitude=34.76965 |
| A 是用户确认的正确锚点 | 用户答复"前端真实正确锚点是 A (113.569463,34.76965)" |
| B(57083) 是当前错误算法锚点 | `supermapGeoreference.js:22-31` + env `VITE_SUPERMAP_ANCHOR_WGS84=113.6650,34.7178` |
| D 是 iServer 路网真实位置 | 07-iserver-live-probe.md feature 实测 geometry.points=(457752.343,3856009.172) |
| A vs D 差约 7.4km | 平面近似 dE=2712m dN=-6901m（近似仅供量级） |
| 三维模型锚点不用改 | tileset + threeTilesGeoreference.anchor 都是 A |
