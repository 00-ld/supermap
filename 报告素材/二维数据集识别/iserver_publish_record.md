# iServer 发布记录

发布时间：2026-07-14

## 坐标约定

当前发布的数据仍采用园区本地米制坐标：

`local-planar-meter-current-epsg0`

该坐标与当前园区 DOM/道路骨架/三维瓦片局部坐标对齐，可用于当前阶段的二维空间分析和三维结果投影。后续补齐真实控制点后，再统一转换到 CGCS2000。

## 发布输入

- 发布专用目录：`iserver_publish_cn/`
- 工作空间：`chemical_park_vectors_cn.smwu`
- 数据源：`chemical_park_vectors_cn.udbx`
- 上传包：`chemical_park_vectors_cn_publish.zip`
- 中文编码：GeoJSON 先转为 GB18030，再以 `source_file_charset=GB18030` 导入 UDBX。

## iServer 上传位置

iServer 文件管理接口已将压缩包解压到服务端：

`webapps/iserver/chemical_park_vectors_cn_publish/`

## 已发布服务

### Data 服务

`http://8.130.175.232:18090/iserver/services/data-chemical_park_vectors_cn/rest`

已验证数据源：

- `chemical_park_vectors_cn`

已验证数据集：

- `Park_RoadPolygon_R`
- `Park_RoadNetworkNode_P`
- `Park_RoadNetworkEdge_L`
- `Park_BuildingFacilityPolygon_R`
- `Park_BuildingFootprint_R`
- `Park_EntrancePoint_P`
- `Park_S3MObjectFootprint_R`

建筑单体数据集验证：

- 数据集：`Park_BuildingFootprint_R`
- 类型：REGION
- 记录数：29
- 示例记录：
  - `BUILDING_ID = BLD_A_001`
  - `NAME = 西部生产装置区蓝顶厂房`
  - `MAPX = 334.84`
  - `MAPY = 290.72`

### Map 服务

`http://8.130.175.232:18090/iserver/services/map-chemical_park_vectors_cn/rest`

已验证地图：

- `建筑单体校核图_CN`

地图资源：

`http://8.130.175.232:18090/iserver/services/map-chemical_park_vectors_cn/rest/maps/%E5%BB%BA%E7%AD%91%E5%8D%95%E4%BD%93%E6%A0%A1%E6%A0%B8%E5%9B%BE_CN`

## 下一步用途

1. `/smart-map` 二维地图接入 Map 服务，替换通用 World 底图。
2. 通过 Data 服务读取道路、建筑、出入口数据集。
3. 构建疏散路径：
   - 起点：`Park_BuildingFootprint_R`
   - 网络：`Park_RoadNetworkEdge_L` / `Park_RoadNetworkNode_P`
   - 终点：`Park_EntrancePoint_P`
4. 扩散/溯源算法结果与建筑面做叠加，统计受影响建筑和人员。
5. 三维场景只接收二维分析结果坐标串，并抬高 Z 值进行可视化。

## 可信性边界

- 当前服务已经发布到 iServer，可被 iClient2D/iClient3D 或后端算法服务访问。
- 当前坐标不是 CGCS2000，而是园区本地米制坐标。
- CGCS2000 转换需等待真实经纬度控制点。
