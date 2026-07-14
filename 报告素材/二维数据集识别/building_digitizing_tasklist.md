# 建筑单体精修任务清单

生成时间：2026-07-13

## 目的

当前园区只有三维瓦片场景和已初步整理的二维道路数据。建筑数据不能直接声称为从 S3M 自动精准识别结果，参赛材料中应表述为：

> 基于三维瓦片场景、道路骨架和 DOM/底图参照，在 SuperMap iDesktopX 中人工校核矢量化建筑与设施区，形成可发布到 iServer Data/Map 服务的二维建筑数据集。

这样做是可信的：三维瓦片负责提供真实空间参照，二维 Data 数据集负责后续空间查询、缓冲区叠加、路径分析和建筑属性管理。

## 输入材料

- 三维场景：iDesktopX 中已打开的化工园区 S3M 三维瓦片。
- 二维道路数据：`Park_RoadPolygon_R`、`Park_RoadNetworkEdge_L`、`Park_RoadNetworkNode_P`。
- 设施区底稿：`Park_BuildingFacilityPolygon_R`。
- 辅助对象足迹：`Park_S3MObjectFootprint_R`。
- 参考图：`building_digitizing_guide_from_3d.png`。
- 数据源：`supermap_udbx/chemical_park_vectors.udbx`。

## 输出数据集

建议新建一个面数据集：

`Park_BuildingFootprint_R`

字段建议：

| 字段名 | 类型 | 示例 | 说明 |
|---|---|---|---|
| building_id | 文本 | BLD_A_001 | 单体建筑或设施唯一编号 |
| name | 文本 | 西部生产装置区 1 号厂房 | 可先按区域命名 |
| zone_code | 文本 | A | 对应 A-J 校核区 |
| type | 文本 | production / warehouse / tank / office / utility / pipe_rack / unknown | 建筑或设施类型 |
| is_hazard | 短整型 | 1 | 是否危险源，1 是，0 否 |
| personnel | 整型 | 20 | 估算人员数量，不确定填 0 |
| confidence | 文本 | high / medium / low | 几何和属性可信度 |
| status | 文本 | confirmed / pending | 不确定先填 pending |
| source | 文本 | s3m_manual | 数据来源 |
| remark | 文本 | 对照三维场景人工绘制 | 备注 |

## A-J 区域处理建议

| 区域 | 名称 | 处理方式 | 建议类型 | 危险源 | 人员 | 状态建议 |
|---|---|---|---|---|---:|---|
| A | 西部生产装置/厂房群 | 拆分为 3-6 个单体：蓝顶厂房、装置框架、罐/塔器小组 | production / utility / tank | 是 | 10-30 | pending |
| B | 西中长条厂房 | 优先拆成 1 个长条厂房，周边小设备可先不拆 | production | 是 | 20-50 | confirmed |
| C | 中央塔器+主厂房 | 主厂房、烟囱/塔器区分开，塔器可用点或小面表达 | production / stack / tower | 是 | 20-40 | pending |
| D | 中南生产厂房/罐区 | 蓝顶厂房单独成面，周边罐区按设施区或罐组面表达 | production / tank | 是 | 10-25 | pending |
| E | 中东生产装置区 | 拆分为装置框架、绿罐组、蓝顶小厂房 | production / tank / utility | 是 | 10-30 | pending |
| F | 东南厂房+设备区 | 大厂房、南侧小厂房、设备区分开；路径演示可优先使用此区 | production / warehouse / utility | 是 | 20-60 | confirmed |
| G | 东北储罐区 | 储罐区先按罐组面处理，若时间足够再画单罐圆形面 | tank | 是 | 0-10 | confirmed |
| H | 东侧仓储/辅助建筑 | 多个白色矩形建筑应逐栋拆分，可作为疏散起点演示 | warehouse / office / utility | 否或待确认 | 20-80 | confirmed |
| I | 西南罐组/泵区 | 先画罐组面和泵区面，不必追求每根管线 | tank / pump | 是 | 0-10 | pending |
| J | 南侧小罐组/装置 | 可作为小型泄漏源演示区，先画一个设施区面 | tank / production | 是 | 0-10 | pending |

## iDesktopX 操作步骤

1. 打开 `supermap_udbx/chemical_park_vectors.udbx`。
2. 新建二维地图，加入以下图层：
   - `Park_RoadPolygon_R`
   - `Park_RoadNetworkEdge_L`
   - `Park_BuildingFacilityPolygon_R`
   - `Park_S3MObjectFootprint_R`
3. 新建面数据集 `Park_BuildingFootprint_R`，添加上表字段。
4. 设置捕捉：
   - 捕捉道路边界和设施区边界。
   - 建议容差 1-3 米，避免建筑面和道路明显错开。
5. 把三维场景放在旁边作为参照，按 `building_digitizing_guide_from_3d.png` 的 A-J 顺序处理。
6. 先画大而明确的对象：
   - 蓝色屋顶厂房。
   - 白色矩形仓储/办公建筑。
   - 罐组区域。
   - 明显的装置框架区。
7. 不确定的小设备不要强行细拆，先并入设施区，字段填：
   - `type = unknown` 或 `utility`
   - `confidence = low`
   - `status = pending`
8. 每完成一个区域，保存数据源并截图：
   - 二维地图截图：显示道路、建筑面、字段表。
   - 三维对照截图：显示同一区域三维模型。
9. 完成后运行拓扑/空间校核：
   - 建筑面不能明显压到主干道路。
   - 疏散起点建筑必须能吸附到道路网络。
   - 危险源建筑/罐区周边可做缓冲区分析。

## 什么必须精准，什么可以先粗略

必须精准：

- 园区主路、支路、出入口。
- 用于疏散路径演示的起点建筑。
- 危险源区、罐区、主要生产装置区。
- 需要参与缓冲区、叠加分析的建筑面。

可以先粗略：

- 管廊、细小设备、阀门、泵组。
- 无业务属性的小构筑物。
- 三维模型里遮挡严重或无法判断名称的对象。

## 参赛表达口径

- SuperMap iDesktopX：用于三维瓦片查看、二维矢量数据整理、建筑/道路人工校核。
- SuperMap iServer：发布园区二维地图服务、Data 服务、后续空间分析服务。
- SuperMap iClient2D：承载缓冲区、路径分析、空间查询等后台二维 GIS 计算。
- SuperMap iClient3D：加载 S3M 场景并渲染算法结果，包括扩散云团、疏散路线、反演概率地形。
- 自研算法：负责扩散、溯源、粒子滤波 KDE、动态风险避让。

## 验收标准

- `Park_BuildingFootprint_R` 至少包含 20 个可解释建筑/设施面。
- A-J 每个区域至少有 1 个要素。
- H 区白色建筑和 B/F 区蓝顶厂房应拆成单体建筑。
- G/I/J 罐区至少按罐组面表达。
- 至少 1 个危险源区可以生成缓冲区。
- 至少 1 个建筑可以作为疏散起点吸附到道路网络并返回路径。
- 每次处理截图必须包含真实三维模型或二维矢量图层，不能只有空场景或图层列表。
