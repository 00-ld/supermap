# 超图 iDesktop 切 DEM/地图瓦片并发布到 iServer 教程

> 目标：把园区高清 DEM 或矢量地图切成多级缩放瓦片，发布到 iServer，前端用 `tiledMapLayer` 加载，放大不模糊。

## 前置条件

- 已安装 SuperMap iDesktop（10i 或 11i 均可）
- 已安装 SuperMap iServer（当前远端 `8.130.175.232:18090` 或本地）
- 有园区原始数据（DEM 栅格 `.tif` / `.dem`，或矢量地图工作空间 `.smwu`）

---

## 方案 A：切 DEM 栅格瓦片（适合地形高程可视化）

### 步骤 1：在 iDesktop 打开数据

1. 打开 iDesktop
2. 「数据」→「打开数据源」→ 选择包含 DEM 栅格的数据源（`.udb`/`.udd` 或直接打开 `.tif`）
3. 在工作空间管理器确认 DEM 数据集可见，右键「属性」查看：
   - 坐标系应为 **CGCS2000 / EPSG:4547**（与园区一致）
   - 分辨率（像元大小）建议 ≤ 2m

### 步骤 2：生成地图缓存（.sci3d 或 .sci）

1. 菜单「数据」→「生成地图缓存」→「地图缓存」
2. 选择 DEM 所在地图（或新建地图把 DEM 拖入）
3. 关键参数：
   - **缓存类型**：选 `原始栅格缓存`（保留高程值，不渲染颜色）
   - **比例尺**：添加多级，建议 1:500 / 1:1000 / 1:2000 / 1:5000 / 1:10000
   - **缓存范围**：设为 DEM 的完整范围
   - **存储格式**：选 `紧凑型`（`.sci3d` + `.bundle`），单文件好发布
   - **图片格式**：PNG（有透明）或 JPG（无透明，体积小）
4. 点「生成」，等待切片完成（园区范围小，通常 5-15 分钟）

### 步骤 3：发布到 iServer

1. 把生成的缓存目录（含 `.sci3d`）拷贝到 iServer 服务器
2. 登录 iServer Manager（`http://8.130.175.232:18090/iserver/manager`，账号 admin / 密码见部署文档）
3. 「服务」→「创建服务」→ 选择「三维服务」或「REST 地图服务」
4. 数据源选「地图缓存」→ 指向 `.sci3d` 文件路径
5. 服务名建议：`3D-local3DCache-ParkDEM`（与现有命名一致）
6. 创建后记录服务 URL：
   ```
   http://8.130.175.232:18090/iserver/services/3D-local3DCache-ParkDEM/rest/realspace
   ```

### 步骤 4：前端接入

把服务 URL 告诉我，我在 `SuperMap2DLayer.vue` 或三维场景里接入。

---

## 方案 B：切矢量地图瓦片（当前已可用，无需重新切）

当前 iServer 的 `map-chemical_park_vectors_cgcs2000` 服务**已支持瓦片**：
```
http://localhost:5173/supermap-iserver/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/建筑单体校核图_CGCS2000/tileImage.png?width=256&height=256&x=0&y=0&scale=0.0001
```
返回 200，多级 scale 均可用。前端已改用 `tiledMapLayer`（不传 prjCoordSys）加载。

**如果当前瓦片清晰度仍不够**，按方案 A 重新切更高分辨率（更小像元、更多比例尺层级）。

---

## 方案 C：切三维模型瓦片（3D Tiles / S3M，用于三维场景）

### 步骤 1：倾斜摄影/手工模型生成缓存

1. iDesktop 打开模型数据源
2. 「数据」→「生成三维缓存」→「倾斜摄影模型缓存」或「手工模型缓存」
3. 参数：
   - **缓存类型**：S3M（超图格式）或 3D Tiles（OGC 标准）
   - **LOD 层级**：建议 4-6 级
   - **瓦片大小**：256×256 或 512×512
   - **纹理压缩**：开启（减少体积）
4. 生成 `.scp` 索引文件 + 瓦片目录

### 步骤 2：发布

iServer Manager → 创建三维服务 → 指向 `.scp` 文件，服务名如 `3D-local3DCache-ParkModelHD`。

---

## 验收标准

切完后在浏览器直接访问瓦片 URL，应返回：
- HTTP 200
- `Content-Type: image/png`
- 不同 scale 返回不同瓦片（放大缩小都有内容）

## 当前结论

- 二维矢量瓦片：iServer 已支持，前端已改用 `tiledMapLayer`，**无需重新切**
- DEM 栅格瓦片：若需要地形高程可视化，按方案 A 切
- 三维模型瓦片：穿模问题需要按方案 C 重新切（修复 LOD 层级错误）

---

## 如果你切了新瓦片

把以下信息告诉我：
1. 服务类型（REST 地图 / 三维 / WMTS）
2. 服务 URL（如 `http://8.130.175.232:18090/iserver/services/xxx/rest/...`）
3. 坐标系（EPSG:4547 / -1000 / 其他）
4. 瓦片格式（PNG / JPG / S3MB / b3dm）

我据此改前端配置（`.env.development` 的 `VITE_SUPERMAP_2D_MAP_URL` 或三维 tileset 路径）。
