# Network/Data/Overlay 验收记录

时间：2026/7/14 17:08:10

## 结论

- 已完成：iServer Data 属性查询、CGCS2000 点缓冲查询、扩散风险区与道路/建筑/出口的前端几何叠加验收。
- 未完成：化工园区专属 iServer Transportation/Network Analysis 服务尚未发布；本次结果不是 SuperMap 网络分析服务输出。
- 未完成：CGCS2000 三维 Realspace 尚未发布；旧三维服务仍是 `epsg:0` 回滚场景。

## 数据源

- Data 服务：http://8.130.175.232:18090/iserver/services/data-chemical_park_vectors_cgcs2000/rest
- 数据源：`chemical_park_vectors_cgcs2000`
- 坐标系：`EPSG:4547 / CGCS2000_3GK_CM_114E`

## 数据集记录数

| 数据集 | 类型 | 记录数 |
|---|---|---:|
| `Park_BuildingFootprint_R` | 建筑面 | 29 |
| `Park_RoadNetworkEdge_L` | 道路线 | 93 |
| `Park_EntrancePoint_P` | 出入口点 | 14 |

## 查询验收

- 建筑按 ID/SmID 查询：成功
- 道路按 ID/SmID 查询：成功
- 出入口按 ID/SmID 查询：成功
- CGCS2000 点查询：点 `458970.343, 3855563.172`，容差 `35m`，命中 6 条。

## 扩散叠加验收

- 执行器：`iclient2d-overlay`
- 危险网格：9
- 受影响设施：12
- 阻断道路：4
- 候选出口：12

## 严格说明

当前叠加分析使用的是 SuperMap iServer Data 返回的 CGCS2000 几何，由前端/iClient2D 侧完成矩形相交和距离排序。它能证明数据接入、空间坐标和业务 payload 可用，但不能替代 iDesktopX 构建网络数据集后发布的 iServer Transportation Analyst 服务。
