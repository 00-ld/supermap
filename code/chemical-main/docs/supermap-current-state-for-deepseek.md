# SuperMap 项目现状客观交接文档

更新时间：2026-07-14

本文面向新的 DeepSeek / AI 对话，用于快速理解当前项目真实状态。核心原则是：只把已经有代码、服务、配置、截图或验证记录支撑的内容写成“已完成”；能用但尚未接入的 SuperMap 能力单独列为“可改进”；旧服务、回滚路径和计划项不得当作发布版成果。

## 1. 项目一句话

本项目是“基于时空智能和数字孪生的化工园区危险气体监测和溯源系统”。现有系统由 Vue 前端、Spring Boot 后端、FastAPI/Python 算法服务和 SuperMap GIS 产品链组成，目标是在化工园区场景中完成危险气体扩散模拟、泄漏源溯源、疏散路径规划、三维态势展示和参赛材料留证。

当前正确叙事：

```text
SuperMap 负责 GIS 底座、二维/三维空间服务、地图表达和资源管理；
自研算法负责气体扩散、粒子滤波溯源、动态危险避让和业务闭环；
二维场景负责计算，三维场景负责事件触发与结果可视化。
```

## 2. 当前最重要的坐标边界

发布版坐标口径已经明确：

| 内容 | 当前口径 |
|---|---|
| 发布版二维 Data/Map XY | `EPSG:4547 / CGCS2000_3GK_CM_114E` |
| 发布版三维 Realspace 目标 | `EPSG:4547 / CGCS2000_3GK_CM_114E`，尚待三维重缓存发布 |
| 经纬度备案 | `EPSG:4490` |
| 高度/Z | 米，仅用于模型高度、云团抬高、路径抬高、KDE 地形和相机高度 |
| 旧二维服务 | `PCS_NON_EARTH_LOCAL_METER / EPSG:-1000`，只作回滚和转换来源 |
| 旧三维服务 | S3M config 为 `epsg:0`，只作历史服务和开发回滚 |

关键控制点：

```text
河南工业大学莲花街校区南门
local(1218, 682) -> EPSG:4547(E=458970.343, N=3855563.172)
```

发布版不要把 XY 坐标称为“本地米制”。只有 Z/高度继续用米表达。

## 3. 已经实际用到 SuperMap 的地方

| 模块 | 已用 SuperMap 能力 | 当前事实 | 主要文件/证据 |
|---|---|---|---|
| 二维地图底图 | iServer REST Map + iClient Leaflet | `/smart-map` 已通过 `@supermap/iclient-leaflet` 加载园区二维地图；旧 EPSG:-1000 与新 EPSG:4547 都走 `image.png` 单图层，避免 tile 400 | `frontend/src/views/smart_map/components/SuperMap2DLayer.vue` |
| 二维 Data 服务 | iServer REST Data | 前端读取道路、出入口、建筑数据集，归一化为疏散规划 payload | `frontend/src/views/smart_map/useSuperMapIserverData.ts` |
| CGCS2000 发布版二维数据 | iDesktopX/iServer Data/Map | 文档台账记录发布版 Data/Map 已接入：`data-chemical_park_vectors_cgcs2000`、`map-chemical_park_vectors_cgcs2000`，关键数据集 EPSG=4547 | `docs/supermap-cup-implementation-ledger.md` |
| 旧二维回滚服务 | iServer Data/Map | 旧 `data-chemical_park_vectors_cn`、`map-chemical_park_vectors_cn` 保留为回滚和转换来源 | `frontend/.env.development` 注释、`docs/supermap-cup-implementation-ledger.md` |
| 三维场景加载 | SuperMap3D / iClient3D + iServer Realspace | `/screen` 原生加载旧 `3D-local3DCache-HuaGongYuanQuChangJing` Realspace；iPortal 只作兜底 iframe | `frontend/src/components/SuperMapSceneViewer.vue` |
| 三维 SDK/服务代理 | Vite 代理 iPortal SDK 与 iServer | 开发环境通过 `/supermap3d-remote`、`/supermap-iserver`、`/iserver` 避免 CORS/Worker/config/S3M 请求问题 | `frontend/vite.config.ts`、`frontend/.env.development` |
| 三维对象事件 | iClient3D pick | 已新增 `scene-object-pick`，输出对象 ID、CGCS2000 投影点或 null、heightMeters 和原始属性；旧 `facility-click` 保留兼容 | `frontend/src/types/supermap-scene-events.ts`、`SuperMapSceneViewer.vue`、`ParkScene3D.vue` |
| 三维算法可视化 | iClient3D Entity | 扩散、粒子滤波、疏散 demo 已可触发算法服务并画点、椭圆、KDE 面、路线等实体；正式事件驱动仍待增强 | `frontend/src/components/SuperMapSceneViewer.vue` |
| iPortal | 数字大屏资源/兜底展示 | 项目有 iPortal 大屏 URL，当前主要作为三维 SDK 或 Realspace 不可用时的兜底展示，不应写成所有大屏资源已完成发布版切换 | `VITE_IPORTAL_DASHBOARD_URL` |
| 坐标转换 | CGCS2000 控制点与转换脚本 | 已有控制点文档、前端坐标模块和 GeoJSON 转换脚本；旧本地数据可批量转为 EPSG:4547 | `docs/supermap-cgcs2000-georeference-plan.md`、`tools/supermap/convert-local-to-cgcs2000.mjs` |
| 算法链 GIS 元数据 | SuperMap 优先策略 | 疏散 payload 已带 `gisProvider='supermap-preferred'`、`executorPreference='supermap-network-analysis-first'`、`gisDataSource`、`map` | `useSmartMapEvacuationPlanningActions.ts` |

## 4. 已经接入但要诚实说明的边界

| 事项 | 诚实边界 |
|---|---|
| CGCS2000 二维 Data/Map | 文档和开发环境已切到 CGCS2000；但仍需持续用截图、请求 JSON、坐标范围证明服务稳定，不要只靠 `.env` 宣称完成。 |
| CGCS2000 三维 Realspace | 尚未完成发布版三维重缓存。当前 `.env.development` 的 3D 仍指向旧 `3D-local3DCache-HuaGongYuanQuChangJing`，`VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false`。 |
| 三维 `scene-object-pick` 坐标 | 只从对象属性 `cgcs2000E/cgcs2000N` 或 `easting/northing` 读取；旧 S3M 如果没有这些属性，`projectedPoint` 合法地为 null，不允许用 local/map/s3m 字段伪造成 CGCS2000。 |
| SuperMap 网络分析 | 已发布 `transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest`，前端已配置 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 并优先调用 `path.rjson`；动态危险避让和批量建筑仍降级到 Python D* Lite。 |
| iPortal 大屏 | 有 URL 和资源，但发布版是否无登录可打开、是否已经切新 CGCS2000 Map/3D，需要单独验收。 |
| 三维算法按钮 | 当前有 demo 触发链路，但还不是完整的生产式事件组件。后续应从三维 pick 上下文触发事故源、疏散和证据面板。 |
| 传感器点 | 当前主要来自前端静态布局/算法输入，尚未完全迁移为 iServer 点数据集和空间查询。 |
| 风险区图层 | 算法会返回扩散帧，三维可画云团；但 SuperMap 专题图、等值线、栅格分析尚未完全承接。 |
| 文档一致性 | `docs/supermap-cup-implementation-ledger.md` 更新较新；代码工程根 `README.md` 和部分历史文档可能仍有 WGS84/epsg:0 的旧叙述，DeepSeek 应优先采信本文件和 SuperMap 台账。 |

## 5. 可以用 SuperMap 但还没充分用的地方

| 可用能力 | 当前状态 | 推荐接入方式 | 优先级 |
|---|---|---|---|
| iServer 网络分析服务 | 已发布可用服务，但路网拓扑需复核 | iDesktopX 继续校核道路节点重复问题，重新发布可开启 `autoCheckNetwork=true` 的最终服务 | 高 |
| iServer 空间查询 | 三维 pick 后仍主要靠前端对象属性和静态 Map | 用 iServer Data 根据 `SmID/id` 或 CGCS2000 点查询建筑、道路、传感器、危险源属性 | 高 |
| iServer 缓冲区/叠加分析 | 尚未成为正式事故风险链路 | 扩散风险区与道路、建筑做叠加，得到受影响设施、阻断路段和疏散候选出口 | 高 |
| SuperMap IDW/Kriging/等值线 | 文档建议使用，未形成稳定结果服务 | 传感器浓度点生成插值面/等值线，与自研扩散结果对照展示 | 中高 |
| CGCS2000 三维 S3M 重缓存 | 尚未完成 | iDesktopX 按 CP0-CP5 重定位 S3M/SCP，发布 `3D-chemical_park_cgcs2000/rest/realspace` | 最高 |
| iPortal 资源管理 | 目前更像兜底外链 | 将 CGCS2000 Map、3D Realspace、专题图、Web 页面整理成 iPortal 可展示资源和大屏入口 | 中高 |
| 传感器/危险源点数据集 | 仍以静态/算法配置为主 | 发布为 iServer 点数据集，支持空间查询、专题图、风险等级渲染 | 中 |
| 移动端 SuperMap H5 | 文档有规划，接入有限 | H5/PWA 端加载 iServer Map，展示位置、风险区、路线、巡检上报点 | 中 |
| iMobile 原生能力 | 未做 | 时间和授权允许时再做离线地图、原生采集、GPS 轨迹 | 低 |
| SuperMap 可视化专题图 | 部分仍靠前端 Canvas/Entity | 建筑风险等级、受影响范围、疏散状态尽量转为 SuperMap 专题图或服务端图层 | 中 |

## 6. 自研算法当前状态

已复跑通过的算法验证：

```powershell
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
uv run --no-sync python -m algorithm.planning.test_dstar_lite
uv run --no-sync python -m tests.test_forward_model
```

客观结论：

- 扩散模型有物理不变量验证和正向烟羽模型基准验证。
- 粒子滤波溯源有 Prairie Grass 横风扩散宽度、多个定位场景和多 seed 重复性验证。
- D* Lite 疏散规划有道路吸附、建筑批量规划、危险气体阻断、比例尺处理等回归测试。
- `tests.test_forward_model` 应使用模块方式运行；直接 `python tests\test_forward_model.py` 可能因为包路径报错，这不是模型失败。

边界：

- 现阶段多数事故数据是仿真/演示/公开样本验证，不应写成真实化工园区现场实测。
- SuperMap 可以承接 GIS 空间分析，但不替代扩散物理、粒子滤波和动态危险避让算法。
- 答辩时应说“自研算法输出空间结果，SuperMap 负责空间组织、分析和表达”，不要说所有算法都是 SuperMap 内置。

## 7. 值得改进和优化的地方

### 7.1 必须优先改进

1. **完成 CGCS2000 三维 Realspace 发布**

   当前最大短板是三维仍指向旧 `epsg:0` S3M 服务。必须用 iDesktopX 按控制点重定位三维模型，生成 EPSG:4547 S3M/SCP，发布新 Realspace，并让 `/screen` 和 iPortal 切换到新服务。

2. **提升 iServer 网络分析质量**

   普通最短路已能优先走 SuperMap Transportation Analyst。当前服务使用 `Park_RoadNetwork_Auto_N`、`nodeIDField=SmID`、`autoCheckNetwork=false`；需要在 iDesktopX 继续校核道路节点和连通性，重新发布可开启 `autoCheckNetwork=true` 的最终服务。

3. **让三维事件真正驱动业务流程**

   现在 `scene-object-pick` 已有，但事故源、疏散起点、传感器查询、证据面板还需要围绕该事件串起来。目标是评委在三维场景点对象后，能直接触发扩散、溯源或疏散。

4. **补齐证据包**

   每个核心能力都要有输入 payload、计算响应 JSON、SuperMap 二维/三维截图、复核结论。不要只有文档结论。

### 7.2 中期优化

| 优化点 | 原因 | 建议 |
|---|---|---|
| 文档口径统一 | `README.md` 和旧文档可能仍有历史叙述 | 以本文件、`supermap-cup-implementation-ledger.md`、`supermap-cgcs2000-georeference-plan.md` 为准，逐步清理旧 WGS84/epsg:0 发布口径 |
| 坐标转换模块收敛 | 当前同时存在旧本地、CGCS2000、经纬度近似换算 | 发布版 Data 几何直接用 EPSG:4547；转换函数只保留为导入、回滚、证据校核 |
| 传感器和危险源 SuperMap 化 | 静态 TS 数据不利于 GIS 叙事 | 发布点数据集，字段含气体类型、风险等级、有效半径、安装高度 |
| 风险区服务化 | 前端绘制可展示，但服务证据弱 | 将扩散帧转风险区 GeoJSON 或 iServer 数据集，支持空间叠加和专题图 |
| iPortal 权限和资源目录 | 参赛展示容易卡在登录/跨域/权限 | 固定无登录展示资源或演示账号，整理资源目录截图 |
| 生产 `.env` | 当前 `.env.production` 仍偏旧基线 | 发布演示前切到 CGCS2000 Data/Map/3D，并确认生产 Nginx 代理 |
| 性能与稳定性 | 三维实体、KDE 面和扩散帧可能堆叠 | 做图层管理器，统一清除、开关、帧播放和实体数量上限 |

### 7.3 不建议现在投入太多的方向

| 方向 | 原因 |
|---|---|
| 完整原生 iMobile App | 时间成本高，H5/PWA 已能覆盖展示和处置流程 |
| 大规模重写前端 UI | 当前主要风险是 GIS 服务和证据链，不是视觉框架 |
| 把扩散/溯源算法全部改成 SuperMap 内置 | SuperMap 更适合空间分析和表达，物理扩散与粒子滤波仍应保留自研优势 |
| 继续伪装旧 epsg:0 三维服务为真实地理坐标 | 这是答辩风险点，应尽快用 CGCS2000 重缓存解决 |

## 8. DeepSeek 接手时应优先阅读的文件

| 文件 | 用途 |
|---|---|
| `docs/supermap-current-state-for-deepseek.md` | 本文件，项目现状快速入口 |
| `docs/supermap-cup-implementation-ledger.md` | SuperMap 产品链接入台账，较新 |
| `docs/supermap-cgcs2000-georeference-plan.md` | CGCS2000 控制点、字段、发布契约 |
| `docs/supermap-algorithm-2d-compute-3d-visualization-plan.md` | 二维计算、三维触发和算法可视化计划 |
| `frontend/src/views/smart_map/useSuperMapIserverData.ts` | iServer Data 读取和规划输入构建 |
| `frontend/src/views/smart_map/components/SuperMap2DLayer.vue` | iServer Map 图层加载 |
| `frontend/src/components/SuperMapSceneViewer.vue` | 三维 Realspace 加载、算法按钮、pick 事件和三维实体绘制 |
| `frontend/src/types/supermap-scene-events.ts` | 三维 pick 事件标准契约 |
| `frontend/.env.development` | 当前开发环境 SuperMap 服务配置 |

## 9. DeepSeek 可以直接继续做的任务

按客观收益排序：

1. 核验 `data-chemical_park_vectors_cgcs2000`、`map-chemical_park_vectors_cgcs2000` 的实际请求、数据集 EPSG、坐标范围和截图证据。
2. 推进 iDesktopX 三维模型 CGCS2000 重定位、S3M/SCP 重缓存和 `3D-chemical_park_cgcs2000` Realspace 发布。
3. 配置并验证 SuperMap iServer 网络分析服务，让疏散规划真正优先走 SuperMap。
4. 把 `scene-object-pick` 连接到事故源选择、疏散起点选择、传感器查询和证据面板。
5. 将传感器、危险源、风险区逐步发布为 iServer 数据集或专题图层。
6. 整理 iPortal 发布版大屏，确认无登录访问、资源权限和 CGCS2000 场景引用。
7. 清理旧文档中容易误导的 WGS84/epsg:0 发布表述。

## 10. 最终答辩建议口径

推荐说法：

> 本系统采用 SuperMap 构建 GIS 数字孪生底座。二维 Data/Map 服务已按 CGCS2000 发布并承载道路、建筑和出入口数据；三维端基于 iClient3D/Realspace 承担事件触发与态势表达；算法服务负责扩散、溯源和动态避险，输出空间化结果后由 SuperMap 二维/三维图层展示。旧本地坐标和 epsg:0 三维缓存仅作为历史回滚，发布版目标统一为 CGCS2000。

避免说法：

- 不要说旧 `epsg:0` 三维瓦片已经是真实地理坐标。
- 可以说 SuperMap Transportation Analyst 已发布并有 `path.rjson` 请求证据；不要说路网拓扑质量已经最终验收。
- 不要说 iPortal 发布版大屏已完全稳定，除非已经验证无登录打开和新 CGCS2000 资源引用。
- 不要把仿真采样或公开数据验证说成现场实测。
