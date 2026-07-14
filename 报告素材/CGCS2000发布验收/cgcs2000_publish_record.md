# CGCS2000 发布验收记录

时间：2026-07-14

## 自动导入与修正

尝试用 iObjectsPy 导入 `supermap_import_cgcs2000` 生成 `chemical_park_vectors_cgcs2000.udbx`，失败。

首次失败原因摘要：Java 侧无法加载 `WrapjCore`、`WrapjAnalyst`、`WrapjMapping`、`WrapjRealspace` 等 native DLL，报 `UnsatisfiedLinkError`。

修复方式：把 iDesktopX 2026 `bin` 和 `jre\bin` 追加到 iObjectsPy 运行 PATH 后重新执行导入，已成功生成 UDBX。随后发现初版 UDBX 坐标值已经是 CGCS2000 E/N，但 SuperMap 数据集元数据仍为 `EPSG:-1000`；已通过 `PrjCoordSys.from_epsg_code(4547)` 和 `set_prj_coordsys()` 为数据源及全部数据集写入 `EPSG:4547 / China_2000_3_DEGREE_GK_Zone_38N`。

## 截图与证据

- Map 出图：`G:\竞赛\超图杯\报告素材\CGCS2000发布验收\map_cgcs2000_image_1600x954.png`
- 前端验证：`G:\竞赛\超图杯\报告素材\CGCS2000发布验收\frontend_smart_map_cgcs2000.png`
- iServer 校核 JSON：`G:\竞赛\超图杯\报告素材\CGCS2000发布验收\iserver_cgcs2000_validation.json`
- 发布服务清单：`G:\竞赛\超图杯\报告素材\CGCS2000发布验收\iserver_publish_cgcs2000_services.json`

## CGCS2000 UDBX 导入成功

输出数据源：`G:\竞赛\超图杯\报告素材\二维数据集识别\supermap_udbx\chemical_park_vectors_cgcs2000.udbx`

导入数据集：

- `Park_RoadPolygon_R`
- `Park_RoadNetworkNode_P`
- `Park_RoadNetworkEdge_L`
- `Park_BuildingFacilityPolygon_R`
- `Park_BuildingFootprint_R`
- `Park_EntrancePoint_P`
- `Park_S3MObjectFootprint_R`

只读校核结果：

| 数据集 | 记录数 | Bounds |
|---|---:|---|
| `Park_RoadNetworkEdge_L` | 93 | `457752.343,3855297.972,459339.543,3856245.172` |
| `Park_EntrancePoint_P` | 14 | `457990.343,3855561.172,458980.343,3856015.172` |
| `Park_BuildingFootprint_R` | 29 | `458020.383,3855603.332,458954.343,3855979.092` |

坐标系元数据校核：

| 数据集 | EPSG | 坐标系名称 |
|---|---:|---|
| `Park_RoadNetworkEdge_L` | 4547 | `China_2000_3_DEGREE_GK_Zone_38N` |
| `Park_EntrancePoint_P` | 4547 | `China_2000_3_DEGREE_GK_Zone_38N` |
| `Park_BuildingFootprint_R` | 4547 | `China_2000_3_DEGREE_GK_Zone_38N` |

结论：二维 Data 坐标范围和 SuperMap 坐标系元数据均符合 `EPSG:4547 / CGCS2000_3GK_CM_114E` 发布验收要求。

## iServer 发布结果

发布方式：

1. 通过 `manager/filemanager/uploadtasks` 上传 `chemical_park_vectors_cgcs2000_publish.zip` 到 iServer。
2. 通过 `manager/workspaces.rjson` 以服务器端 `.smwu` 路径发布 `RESTDATA` 和 `RESTMAP`。
3. 发现初版服务元数据为 `EPSG:-1000` 后，修正 UDBX 坐标系元数据并直接覆盖服务器发布目录中的 `.udbx/.smwu`，再次校核为 `EPSG:4547`。

服务 URL：

- Data 服务：`http://8.130.175.232:18090/iserver/services/data-chemical_park_vectors_cgcs2000/rest`
- Map 服务：`http://8.130.175.232:18090/iserver/services/map-chemical_park_vectors_cgcs2000/rest`
- Map 资源：`http://8.130.175.232:18090/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/建筑单体校核图_CGCS2000`

前端验证：

- `.env.development` 已切换到 `CGCS2000_3GK_CM_114E / EPSG:4547`。
- `npm run typecheck:strict` 通过。
- `/smart-map` 真实登录后可见 `SuperMap iClient2D 已加载 iServer 园区二维地图/建筑单体校核图_CGCS2000 · CGCS2000_3GK_CM_114E · EPSG:4547`。
- 前端请求 `map-chemical_park_vectors_cgcs2000 image.png` 和 `data-chemical_park_vectors_cgcs2000 feature rjson` 均返回 200。

## 未完成项

- 还未发布 SuperMap 网络分析服务；当前道路是线数据集，后续需要在 iDesktopX 中构建网络数据集或配置 iServer TransportationAnalyst 服务。
- 还未完成三维 S3M/Realspace 的 CGCS2000 重定位发布；旧三维 EPSG:0 只能作为回滚场景，不能作为发布版真实坐标证据。
- iPortal 大屏还未切到新 CGCS2000 Map/3D 资源。
