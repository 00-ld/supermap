# SuperMap CGCS2000 Georeference Plan

更新时间：2026-07-14

本文件冻结化工园区二维/三维数据落到河南工业大学莲花街校区的坐标口径。发布版统一使用 `CGCS2000_3GK_CM_114E / EPSG:4547` 作为 XY 工程坐标，使用 `CGCS2000 geographic / EPSG:4490` 作为经纬度备案。`PCS_NON_EARTH_LOCAL_METER / EPSG:-1000` 和 `*_cn` iServer 服务只保留为旧回滚基线、转换来源和内部历史说明，不作为新场景发布坐标系。

## 1. 坐标口径

| 项 | 值 |
|---|---|
| 目标工程坐标系 | `CGCS2000_3GK_CM_114E` |
| 目标 EPSG | `4547` |
| 经纬度备案 | `CGCS2000 geographic / EPSG:4490` |
| 锚点 | 河南工业大学莲花街校区南门 |
| 锚点经纬度 | `113.551488E, 34.827640N` |
| 锚点 EPSG:4547 | `E=458970.343, N=3855563.172` |
| 本地锚点 | 园区南门 `local(1218, 682)` |
| 旋转角 | `0`，第一版不旋转 |
| 比例 | `1 local unit = 1 m` |

转换公式：

```text
E = 458970.343 + (localX - 1218)
N = 3855563.172 - (localY - 682)
```

## 2. 控制点

| 控制点 | 旧本地坐标点 | CGCS2000 工程坐标 EPSG:4547 | 用途 |
|---|---:|---:|---|
| CP0 南门锚点 | `(1218, 682)` | `(458970.343, 3855563.172)` | 必选，园区大门 = 河工大南门 |
| CP1 北侧入口 | `(1218, 230)` | `(458970.343, 3856015.172)` | 控制南北方向比例 |
| CP2 西侧入口 | `(238, 235)` | `(457990.343, 3856010.172)` | 控制东西方向比例 |
| CP3 东侧入口 | `(1228, 684)` | `(458980.343, 3855561.172)` | 校核入口近邻位置 |
| CP4 西北角 | `(0, 0)` | `(457752.343, 3856245.172)` | 校核整体包络 |
| CP5 东南角 | `(1587.2, 947.2)` | `(459339.543, 3855297.972)` | 校核整体包络 |

## 3. 已实现的本地成果

- 坐标转换运行时：`frontend/src/data/supermapGeoreference.js`
- 前端旧坐标接口兼容：`frontend/src/data/coordinate.js`
- CGCS2000 GeoJSON 转换脚本：`tools/supermap/convert-local-to-cgcs2000.mjs`
- 转换输出目录：`G:\竞赛\超图杯\报告素材\二维数据集识别\supermap_import_cgcs2000`
- 转换 manifest：`G:\竞赛\超图杯\报告素材\二维数据集识别\supermap_import_cgcs2000\cgcs2000_transform_manifest.json`

生成命令：

```powershell
cd G:\竞赛\超图杯\code\chemical-main
node tools\supermap\convert-local-to-cgcs2000.mjs
```

## 4. 字段契约

CGCS2000 转换后：

| 字段/内容 | 含义 |
|---|---|
| GeoJSON geometry | 已转换为 `EPSG:4547` CGCS2000 工程坐标 |
| `mapX/mapY` | 保留原始旧本地质心字段，只用于兼容既有记录 |
| `localMapX/localMapY` | 明确表示旧本地坐标，只用于 traceability |
| `cgcs2000E/cgcs2000N` | EPSG:4547 投影坐标 |
| `longitude/latitude` | CGCS2000 地理坐标展示参考 |
| `s3mX/s3mY` | 旧 EPSG:0 三维缓存本地坐标，仅用于对照 |

发布版展示和算法主链路不得使用旧 `mapX/mapY`、`localMapX/localMapY`、`s3mX/s3mY` 作为对外 XY 坐标口径；这些字段只用于溯源、校核和回滚。高度/Z 值可以继续使用米表达，例如三维模型高度、算法云团抬高、路径抬高和相机高度。

## 5. iDesktopX / iServer 发布步骤

1. 在 iDesktopX 中新建工作空间，导入 `supermap_import_cgcs2000` 下 7 个 `*_map.geojson`。
2. 数据源命名为 `chemical_park_vectors_cgcs2000`。
3. 数据集名称保持：
   - `Park_RoadPolygon_R`
   - `Park_RoadNetworkNode_P`
   - `Park_RoadNetworkEdge_L`
   - `Park_BuildingFacilityPolygon_R`
   - `Park_BuildingFootprint_R`
   - `Park_EntrancePoint_P`
   - `Park_S3MObjectFootprint_R`
4. 坐标系设置为 `CGCS2000 / 3-degree Gauss-Kruger CM 114E`，EPSG:4547。
5. 发布为独立 iServer 服务，不覆盖 `*_cn`：
   - Data：`/iserver/services/data-chemical_park_vectors_cgcs2000/rest`
   - Map：`/iserver/services/map-chemical_park_vectors_cgcs2000/rest`
   - 建议地图名：`建筑单体校核图_CGCS2000`
6. 三维 S3M/SCP 在 iDesktopX 中按 CP0-CP5 重定位并重新生成缓存，发布为：
   - 3D：`/iserver/services/3D-chemical_park_cgcs2000/rest/realspace`

发布版强约束：

- 新发布的二维 Data/Map、三维 S3M/Realspace、iPortal 大屏和前端配置，XY 坐标必须统一使用 `EPSG:4547 / CGCS2000_3GK_CM_114E`。
- 旧 `EPSG:-1000` 只能作为转换来源和回滚服务，不进入发布版展示口径。
- iPortal 大屏必须加载新 CGCS2000 场景和地图资源，不能继续引用旧 EPSG:0 三维场景作为正式发布入口。
- 前端切换 CGCS2000 后，算法 payload、iServer Data geometry、Map image viewBounds、3D Realspace 场景和 iPortal 资源目录都以 CGCS2000 XY 为主。

## 6. 前端切换契约

当前开发环境保留旧 `*_cn` 服务作为回滚基线；参赛发布版必须切换到以下 CGCS2000 配置：

```env
VITE_SUPERMAP_COORD_SYS = CGCS2000_3GK_CM_114E
VITE_SUPERMAP_EPSG = 4547
VITE_SUPERMAP_DATA_SERVICE_URL = /supermap-iserver/iserver/services/data-chemical_park_vectors_cgcs2000/rest
VITE_SUPERMAP_2D_MAP_URL = /supermap-iserver/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/%E5%BB%BA%E7%AD%91%E5%8D%95%E4%BD%93%E6%A0%A1%E6%A0%B8%E5%9B%BE_CGCS2000
VITE_SUPERMAP_2D_MAP_NAME = 建筑单体校核图_CGCS2000
VITE_SUPERMAP_2D_EPSG = 4547
VITE_SUPERMAP_2D_LEFT = 457752.343
VITE_SUPERMAP_2D_BOTTOM = 3855297.972
VITE_SUPERMAP_2D_RIGHT = 459339.543
VITE_SUPERMAP_2D_TOP = 3856245.172
VITE_SUPERMAP_3D_SCENE_URL = /supermap-iserver/iserver/services/3D-chemical_park_cgcs2000/rest/realspace
```

## 7. 验收

| 验收项 | 通过标准 |
|---|---|
| 控制点 | CP0-CP5 由脚本转换后与表格一致，误差小于 0.01m |
| Data 服务 | 关键数据集可访问，坐标范围接近 `E=457752~459340, N=3855298~3856245` |
| Map 服务 | `/smart-map` 使用 CGCS2000 地图服务时能加载瓦片或图片 |
| 3D 服务 | `/screen` 使用新 Realspace 时能看到非空三维模型，S3M config / Realspace 不再是 `epsg:0` |
| iPortal 大屏 | 大屏加载新 CGCS2000 Map/3D 资源，不引用旧 EPSG:0 场景作为发布入口 |
| 算法 payload | 疏散规划 payload 带 `coordSys=CGCS2000_3GK_CM_114E`、`epsg=4547`、`georeference/gisDataSource` |
| 回滚 | `*_cn` 旧服务只可配置回退，不作为发布版坐标口径 |
