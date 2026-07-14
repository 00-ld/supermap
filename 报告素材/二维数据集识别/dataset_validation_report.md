# 二维道路与建筑数据集校核报告

生成时间：2026-07-13T15:32:11.004Z

## 数据量

- 道路面：15
- 道路网络节点：69
- 道路网络边：93
- 建筑/设施区面：10
- 出入口点：14
- S3M 对象足迹：6

## 道路网络拓扑

- 连通分量：1
- 最大连通分量节点数：69
- 孤立节点：0
- 断头节点：30
- 网络边总长度：11651.8 m
- 边字段问题：0

## 出入口校核

所有出入口距离道路中心线不超过 25m。

## 结论

- Road network is topologically connected as a single component.
- All road edges reference valid nodes and recorded lengths match geometry.
- Building polygons are current facility-zone footprints and must be refined into single-building footprints in iDesktopX before final public data publication.
- All entrances are within the 25 m snapping tolerance from the road centerline.
