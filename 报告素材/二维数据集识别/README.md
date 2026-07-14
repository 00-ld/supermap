# 二维道路与建筑数据集识别成果

生成时间：2026-07-13T14:04:59.272Z

## 数据集

- 道路面：15 条
- 道路网络节点：69 个
- 道路网络边：93 条
- 建筑/设施区面：10 个
- 建筑单体/设施面草稿：29 个
- 出入口点：14 个
- 独立 S3M 对象足迹：6 个

## SuperMap 数据源

- 原始数据源：`supermap_udbx/chemical_park_vectors.udbx`。
- 带建筑单体成果的数据源：`supermap_udbx/chemical_park_vectors_with_footprints.udbx`。
- 带建筑单体成果的工作空间：`supermap_udbx/WorkSpace_with_footprints.smwu`。
- 中文属性修复版数据源：`supermap_udbx/chemical_park_vectors_cn.udbx`。
- 中文属性修复版工作空间：`supermap_udbx/WorkSpace_cn.smwu`。
- 导入后的数据集：
  - `Park_RoadPolygon_R`
  - `Park_RoadNetworkNode_P`
  - `Park_RoadNetworkEdge_L`
  - `Park_BuildingFacilityPolygon_R`
  - `Park_BuildingFootprint_R`
  - `Park_EntrancePoint_P`
  - `Park_S3MObjectFootprint_R`
- QA 覆盖图：`dataset_qa_overlay.png`。
- 拓扑校核报告：`dataset_validation_report.md` / `dataset_validation_report.json`。
- 建筑精修参考图：`building_digitizing_guide_from_3d.png`。
- 建筑单体精修任务清单：`building_digitizing_tasklist.md`。
- 建筑单体草稿数据：`supermap_import/building_footprints_map.geojson` / `building_footprints.csv`。
- 建筑单体 QA 图：`building_footprints_qa_overlay.svg`。
- iServer 发布记录：`iserver_publish_record.md`。

## 校核结论

- 道路网络为 1 个连通分量，69 个节点全部连通。
- 孤立节点 0 个。
- 道路网络边 93 条，边字段问题 0 个。
- 14 个出入口均在道路中心线 25m 吸附阈值内。
- 30 个断头节点主要位于园区边界和道路末端，后续在 iDesktopX 中按出入口/封闭端分类。
- 建筑数据当前仍为设施区面，后续需要在 iDesktopX 中逐栋精修单体建筑轮廓。

## 使用方式

1. 在 iDesktopX 中优先导入 `supermap_import/*_map.geojson`，坐标单位为当前园区平面米制坐标。
2. 用 `road_network_edges_map.geojson` 和 `road_network_nodes_map.geojson` 构建二维道路网络数据集。
3. 用 `building_footprints_map.geojson` 作为建筑单体草稿数据，优先校核 `status=pending` 和 `confidence=low` 的对象。
4. `s3m_object_footprints_map.geojson` 来自独立 SCP 的 geoBounds，可辅助确认厂房和设备对象位置。
5. 当前三维瓦片仍是 EPSG:0，本数据先服务当前模型贴合；真实 CRS 需后续 iDesktopX 控制点重处理。
6. 建筑单体精修按 `building_digitizing_tasklist.md` 的 A-J 区域顺序执行，先保证危险源区、疏散起点建筑和主要厂房可用于空间分析。

若直接使用 UDBX，可在 iDesktopX 中打开 `supermap_udbx/chemical_park_vectors_cn.udbx`，再检查网络拓扑并发布到 iServer Data/Map 服务。

若需要建筑单体数据和中文属性，应优先打开 `supermap_udbx/WorkSpace_cn.smwu` 或 `supermap_udbx/chemical_park_vectors_cn.udbx`，其中包含 `Park_BuildingFootprint_R`。

## 中文编码说明

iObjectsPy 直接导入 UTF-8 GeoJSON 时，iDesktopX 属性表可能出现中文乱码。当前修复版数据源采用 GB18030 编码 GeoJSON 作为导入源，并设置 `source_file_charset=GB18030`，已通过 iObjectsPy 读取校验中文字段正常。

## iServer 服务

- Data 服务：`http://8.130.175.232:18090/iserver/services/data-chemical_park_vectors_cn/rest`
- Map 服务：`http://8.130.175.232:18090/iserver/services/map-chemical_park_vectors_cn/rest`
- 地图名：`建筑单体校核图_CN`
- 发布详情见：`iserver_publish_record.md`
