# iClient 原生大屏与监控点位标准模型

更新时间：2026-07-16

## 目标

`/screen` 不再把 iPortal iframe 作为主展示方式，而是由 Vue + SuperMap iClient3D 创建原生三维指挥大屏。iPortal 保留为资源门户、Web 大屏 URL 注册入口和兜底演示入口。

三维监控点位按以下口径建模：

- OGC SensorThings API：统一 Thing、Location、Sensor、Datastream、ObservedProperty、Observation、FeatureOfInterest。
- CityGML / 3D Tiles：约束三维对象语义、LOD、模型实例化和流式表达。
- IEC 60079-29-2 / GB/T 50493-2019：约束气体探测器选型、安装、使用维护和布点说明。

## 前端实现

核心文件：

- `frontend/src/views/screen/index.vue`：原生 iClient3D 指挥大屏外壳，包含顶部态势、左侧标准/模型目录、右侧标准属性卡、底部算法工作流和证据卡。
- `frontend/src/components/SuperMapSceneViewer.vue`：负责 iClient3D/Realspace 场景加载、传感器实体、覆盖范围圈、三维 pick 事件和算法叠加。
- `frontend/src/data/monitoringSensorStandard.ts`：传感器模型目录、SensorThings 字段映射、布点依据和补充设备点位。
- `frontend/src/data/supermapCupScenario.ts`：把真实 DOM 气体点位和补充监控点位归一化为三维大屏传感器数据。

当前传感器模型类型：

| modelId | 模型 | 主要观测量 | 说明 |
|---|---|---|---|
| `fixed-gas-low` | 固定式气体探测器（低位） | CH4、CO、NH3、O2 | 近源、有毒/重气、泵区和储罐区低位监测 |
| `fixed-gas-high` | 固定式气体探测器（高位） | CH4、NH3 | 轻气上浮和顶部积聚风险 |
| `open-path-gas` | 开放路径气体探测器 | 路径积分浓度 | 边界、装卸区、开阔通道 |
| `weather-station` | 微型气象站 | 风速、风向、温湿度 | 扩散和溯源环境参数 |
| `ptz-camera` | 视频监控 / PTZ | 视频流、识别事件 | 报警复核和现场态势 |
| `flame-thermal` | 火焰 / 热成像探测器 | 火焰事件、表面温度 | 储罐、泵区、装卸区热异常 |
| `sound-light-alarm` | 声光报警器 | 报警状态 | 现场联动处置 |
| `edge-gateway` | 边缘采集网关 | 遥测链路状态 | SensorThings 语义数据汇聚 |

## Park_MonitoringSensor_P 字段建议

发布到 iServer Data/Map 时，建议新增点数据集 `Park_MonitoringSensor_P`，坐标为 `EPSG:4547 / CGCS2000_3GK_CM_114E`，经纬度备案使用 `EPSG:4490`。

| 字段 | 说明 |
|---|---|
| `sensorId` | 监控点唯一 ID |
| `type` | 旧系统兼容类型，保留 `gas/temp/leak` |
| `modelId` | 标准模型类型，如 `fixed-gas-low`、`weather-station` |
| `observedProperties` | 观测量列表，如 `CH4(%LEL)/CO(ppm)` |
| `facilityId` | 关联设施或风险分区 |
| `easting` / `northing` | EPSG:4547 坐标 |
| `heightMeters` / `installHeight` | 安装高度，米 |
| `coverageRadius` | 有效半径或逻辑覆盖半径，米 |
| `hazardZone` | 风险分区 |
| `placementBasis` | 布点依据和说明 |
| `dataQuality` | `SIMULATED` / `CONFIGURED` / `VERIFIED` |

## 验收边界

- 当前三维传感器为 iClient3D Entity 实例化模型和覆盖范围表达，尚未发布为真实 iServer 点数据集。
- 当前读数统一标注 `SIMULATED`，用于演示和算法闭环，不冒充真实硬件采集。
- 气体扩散/溯源算法输入只使用气体观测类传感器；气象站、视频、火焰、报警和网关作为态势与证据链设备，不直接作为浓度观测点。
- iPortal 作为资源门户和兜底，不再作为主大屏 iframe 成果口径。
