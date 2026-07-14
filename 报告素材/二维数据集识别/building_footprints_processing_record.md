# 建筑单体数据处理记录

处理时间：2026-07-14

## 处理目标

在仅有三维瓦片和初步设施区面的情况下，为二维 SuperMap 空间分析先构建可用的建筑/设施面数据集，使其能够用于：

- 建筑点选与属性查询。
- 危险源缓冲区分析。
- 建筑-道路吸附和疏散起点选择。
- iServer Data/Map 服务发布。
- 三维场景中算法结果投影渲染。

## 处理方法

1. 读取 `building_facility_polygons_map.geojson` 中 10 个设施区底稿。
2. 对照 iDesktopX 三维斜视图，将园区划分为 A-J 十个校核区。
3. 按厂房、罐组、塔器、仓储、辅助设施等对象类型，将 10 个大区面切分为 29 个建筑/设施面草稿。
4. 为每个要素写入业务字段：
   - `building_id`
   - `name`
   - `zone_code`
   - `type`
   - `is_hazard`
   - `personnel`
   - `confidence`
   - `status`
   - `longitude`
   - `latitude`
   - `s3mX`
   - `s3mY`
5. 使用 iObjectsPy 导入 SuperMap UDBX 数据源，生成数据集：
   - `Park_BuildingFootprint_R`
6. 由于原 `chemical_park_vectors.udbx` 已在 iDesktopX 中打开，桌面端树存在缓存/锁定，最终另存为带建筑单体的新数据源：
   - `chemical_park_vectors_with_footprints.udbx`
   - `WorkSpace_with_footprints.smwu`
7. iDesktopX 属性表发现中文乱码后，重新将 GeoJSON 转为 GB18030 编码并以 `source_file_charset=GB18030` 导入，形成中文修复版：
   - `chemical_park_vectors_cn.udbx`
   - `WorkSpace_cn.smwu`

## 输出文件

- `supermap_import/building_footprints_map.geojson`
- `supermap_import/building_footprints_wgs84.geojson`
- `supermap_import/building_footprints_s3m_local.geojson`
- `supermap_import/building_footprints.csv`
- `building_footprints_qa_overlay.svg`
- `building_footprints_qa_overlay.png`
- `supermap_udbx/chemical_park_vectors_with_footprints.udbx`
- `supermap_udbx/WorkSpace_with_footprints.smwu`
- `supermap_udbx/chemical_park_vectors_cn.udbx`
- `supermap_udbx/WorkSpace_cn.smwu`

## 数据统计

- 建筑/设施面总数：29
- 覆盖区域：A、B、C、D、E、F、G、H、I、J
- 危险源相关对象：21
- 已确认对象：8
- 待人工复核对象：21
- SuperMap UDBX 数据集：`Park_BuildingFootprint_R`
- SuperMap 工作空间地图：`建筑单体校核图`
- 中文修复版工作空间地图：`建筑单体校核图_CN`

## 桌面端校核记录

- 已使用 iObjectsPy 打开 `chemical_park_vectors_with_footprints.udbx` 并确认数据集列表包含：
  - `Park_RoadPolygon_R`
  - `Park_RoadNetworkNode_P`
  - `Park_RoadNetworkEdge_L`
  - `Park_BuildingFacilityPolygon_R`
  - `Park_BuildingFootprint_R`
  - `Park_EntrancePoint_P`
  - `Park_S3MObjectFootprint_R`
- 已创建 `WorkSpace_with_footprints.smwu`，并写入 `建筑单体校核图`。
- 已创建 `WorkSpace_cn.smwu`，并写入 `建筑单体校核图_CN`。
- 已通过 iObjectsPy 校验 `chemical_park_vectors_cn.udbx` 中中文字段正常：
  - `Park_BuildingFacilityPolygon_R.name`: `西北生产装置区`
  - `Park_BuildingFacilityPolygon_R.status`: `运行中`
  - `Park_BuildingFootprint_R.name`: `西部生产装置区蓝顶厂房`
  - `Park_BuildingFootprint_R.remark`: `基于三维斜视图和设施区底稿自动切分的建筑单体草稿，需在 iDesktopX 中对照三维瓦片最终校核。`
- iDesktopX 已能打开该工作空间；界面展开树存在 Java 桌面端焦点不稳定问题，最终数据集存在性以 iObjectsPy 底层校核为准。

## 可信性边界

当前 `Park_BuildingFootprint_R` 是“基于三维斜视图和设施区底稿自动切分的建筑单体草稿”，不是从 S3M 模型中自动精准提取的真实建筑轮廓。

参赛材料中建议使用如下表述：

> 系统先利用 SuperMap iDesktopX 加载三维瓦片和二维道路底稿，结合三维场景人工判读生成建筑/设施面数据集；对危险源区、仓储区和疏散起点建筑进行重点校核，再发布到 iServer 作为二维空间分析的数据基础。

## 后续人工校核重点

1. 在 iDesktopX 中打开 `Park_BuildingFootprint_R`。
2. 对 `status=pending` 或 `confidence=low` 的对象逐个对照三维场景修正边界。
3. B、F、H 区的蓝顶厂房和白色仓储建筑优先精修为单体建筑。
4. G、I、J 区的罐区可先按罐组面表达；如果时间充足，再拆为单罐圆形面。
5. 校核建筑面是否压到主干道路。
6. 选择一个 confirmed 建筑作为疏散起点，验证能吸附到 `Park_RoadNetworkEdge_L`。
