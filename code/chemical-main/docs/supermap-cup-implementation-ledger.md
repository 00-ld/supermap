# 超图杯 SuperMap 产品链实施台账

更新时间：2026-07-14

本台账用于把长期规划落成可执行任务、验收证据和参赛分工。原则是：SuperMap 承担 GIS 主链路，自研系统承担算法和业务闭环，所有能力都要有证据。

最新职责边界：二维地图/iClient2D/iServer Data 是“后台计算引擎”，负责空间分析算子、道路网络和路径分析；三维 iClient3D 是“前台投影仪”，只负责把二维分析结果和 Python 算法结果渲染到 S3M 场景中。

## 1. 产品链嵌入总路线

```text
用户确认数据与参赛口径
  -> iDesktopX 整理二维/三维数据
  -> iServer 发布地图、三维、空间分析服务
  -> iPortal 管理资源和大屏
  -> Web 端 iClient2D 承接空间分析和道路网络计算
  -> FastAPI 自研算法输出扩散/溯源/KDE GeoJSON
  -> iClient3D 将结果抬高投影到 S3M 场景
  -> Playwright/浏览器截图和接口 JSON 留证
```

## 2. 当前坐标系事实边界

旧回滚基线已验证三维 S3M config 为：

| 项 | 当前值 | 影响 |
|---|---|---|
| `crs` | `epsg:0` | 只作为历史服务和开发回滚，不是真实地理坐标系 |
| 坐标类型 | 平面米制坐标 | Web 端能加载旧模型，但不能作为发布版坐标证据 |
| 数据类型 | `ArtificialModel` | 报告中应写三维模型/S3M 缓存，不写真实倾斜摄影 |
| Web 端处理 | 旧基线可按 iServer Realspace 原生 EPSG:0 缓存加载；发布版必须切换到 `EPSG:4547` CGCS2000 Realspace | 模型先保证可见和 `.s3mb` 稳定请求；参赛发布仍以 CGCS2000 重缓存为准 |

发布版 Web 端固定以下 CGCS2000 口径：

- 工程坐标系：`EPSG:4547 / CGCS2000_3GK_CM_114E`。
- 经纬度备案：`EPSG:4490`。
- 南门锚点：`local(1218,682) -> E=458970.343, N=3855563.172`，对应河南工业大学莲花街校区南门。
- 发布版三维相机：围绕 CGCS2000 Realspace 数据范围定位；相机高度继续用米表达。

注意：旧 EPSG:0 场景只能说明“Web 端能稳定打开历史三维场景”。参赛报告若写“三维场景已落到真实坐标系”，必须以 iDesktopX 重新生成并发布的 CGCS2000 S3M/Realspace 为证据。

发布版必须用 iDesktopX 重处理三维数据：

1. 使用 CP0-CP5 控制点和 `EPSG:4547` 坐标系。
2. 在 iDesktopX 中为三维模型设置 CGCS2000 工程坐标参考。
3. 重新生成带 CGCS2000 CRS 的 S3M/SCP 缓存并发布 iServer Realspace 服务。
4. Web 端直接消费 CGCS2000 Realspace、Data 和 Map 服务。
5. 核对模型、二维底图、算法结果和 iPortal 大屏位置一致。

## 3. 数据来源表

| 数据 | 当前来源 | 格式 | 是否可公开 | SuperMap 处理 | 当前状态 |
|---|---|---|---|---|---|
| 三维模型/瓦片 | `园区大屏部署/瓦片`、S3M/SCP | S3M/SCP | 需用户确认 | iDesktopX 检查、iServer 3D 发布 | 已接入 Web，待真实坐标重处理 |
| 二维园区底图 | `realMapAssets`、DOM 参考、iServer `map-chemical_park_vectors_cn` / `map-chemical_park_vectors_cgcs2000` | JS/GeoJSON/UDBX/iServer REST | 需用户确认 | iDesktopX 制图、iServer REST Maps | 旧基线服务保留为回滚；发布版 CGCS2000 Data/Map 已发布并接入 `/smart-map` |
| 建筑/设施 | `Park_BuildingFootprint_R`、`realMapAssets.js` | iServer Data/JS 静态兜底 | 可作为演示数据，公开需确认 | 转数据集/专题图/空间查询 | iServer Data 已用于疏散 payload，静态数据仅兜底 |
| 道路/出入口 | `Park_RoadNetworkEdge_L`、`Park_EntrancePoint_P`、`realMapAssets.js` | iServer Data/JS 静态兜底 | 可作为演示数据，公开需确认 | 道路图层/网络分析 | iServer Data 已用于路径规划输入，静态数据仅兜底 |
| 传感器点 | `realSensorLayout.ts` | TS 静态数据 | 可作为布设方案公开 | 点数据集/属性查询/覆盖分析 | 已用于扩散和溯源观测 |
| 气体参数 | `phase1Config.ts`、算法服务 | TS/Python | 可公开 | 属性表/专题图 | 已用于算法 |
| 算法结果 | FastAPI `/api/diffusion`、`/api/inversion`、`/api/planning` | JSON/GeoJSON | 可公开接口摘要，核心参数需筛选 | 二维分析后转三维 Entity/GeoJSON 图层 | 三维入口已接算法按钮；发布版结果 XY 必须为 CGCS2000 |
| iPortal 大屏 | SuperMap iPortal | URL/大屏资源 | 需用户确认 | 资源管理和展示入口 | 作为兜底和展示资源 |

## 4. 当前已落地的 iServer / Web 接入

旧开发/回滚基线仍保留，不覆盖 CGCS2000 发布服务：

| 项 | 当前值 |
|---|---|
| 坐标系 | `PCS_NON_EARTH_LOCAL_METER`，仅作旧回滚基线和转换来源 |
| EPSG | `-1000` |
| Data 服务 | `/supermap-iserver/iserver/services/data-chemical_park_vectors_cn/rest` |
| Data 数据源 | `chemical_park_vectors_cn` |
| Map 服务 | `/supermap-iserver/iserver/services/map-chemical_park_vectors_cn/rest/maps/建筑单体校核图_CN` |
| 地图范围 | `left=0,bottom=0,right=1587.2,top=947.2` |

旧基线已接入数据集：

| 数据集 | 当前用途 | 数量 |
|---|---|---:|
| `Park_RoadNetworkEdge_L` | 疏散道路网络输入 | 93 条 |
| `Park_EntrancePoint_P` | 园区出口和建筑入口 | 14 个，其中园区出口 4 个 |
| `Park_BuildingFootprint_R` | 建筑单体、疏散起点、属性查询 | 29 栋 |

前端实现：

- `/smart-map` 使用 `@supermap/iclient-leaflet` 和 `SuperMap2DLayer.vue` 加载 iServer 园区二维地图。
- 旧 EPSG:-1000 和新 CGCS2000 模式都优先使用 iServer `image.png` 单图层，避免 `tileImage.png` 在旧服务下返回 400。
- `useSuperMapIserverData.ts` 从 iServer Data 读取道路、出入口、建筑，统一转为疏散规划输入。
- `useSuperMapIserverData.ts` 在 CGCS2000 模式下直接使用 iServer Data geometry 的 `EPSG:4547` XY，不做旧本地坐标到投影坐标的二次转换。
- `useSmartMapEvacuationPlanningActions.ts` 的 payload 带 `gisProvider='supermap-preferred'`、`executorPreference='supermap-network-analysis-first'`、`gisDataSource` 和 `map` 坐标元数据。
- `useSmartMapAlgorithmExecutors.ts` 已配置 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL`，单起点、多出口疏散优先调用 SuperMap Transportation Analyst `path.rjson`；不可用、批量建筑或动态危险避让场景才降级到 Python D* Lite。
- `SuperMapSceneViewer.vue` 已新增 `scene-object-pick` 标准事件，输出 `selectedObjectId`、`projectedPoint: { x/easting, y/northing, epsg:4547 } | null`、`heightMeters` 和原始属性；旧 EPSG:0 场景读不到 CGCS2000 属性时不伪造坐标。
- `ParkScene3D.vue` 和 `/smart-map` 已转发并保存最近一次三维 pick payload，后续事故源、疏散和证据面板统一消费该上下文。

已留证：

| 证据 | 路径/结论 |
|---|---|
| iClient2D 截图 | `G:\竞赛\超图杯\报告素材\smart-map-supermap-2d-5174.png` |
| 浏览器状态 | `SuperMap iClient2D 已加载 iServer 园区二维地图/建筑单体校核图_CN · PCS_NON_EARTH_LOCAL_METER · EPSG:-1000` |
| iServer 请求 | SuperMap 相关请求 200，无 SuperMap 可控红错 |
| 算法数据形态校核 | 道路 93、园区出口 4、前 5 栋建筑均可达，示例路径 `BLD_A_001` 为 5 个路径点、约 257.12m |
| 类型检查 | `npm run typecheck:strict` 通过 |

参赛发布版二维 Data/Map 已切换到 CGCS2000：

| 项 | 当前发布版值 |
|---|---|
| 坐标系 | `CGCS2000_3GK_CM_114E` |
| EPSG | `4547` |
| Data 服务 | `/supermap-iserver/iserver/services/data-chemical_park_vectors_cgcs2000/rest` |
| Data 数据源 | `chemical_park_vectors_cgcs2000` |
| Map 服务 | `/supermap-iserver/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/建筑单体校核图_CGCS2000` |
| 地图范围 | `left=457752.343,bottom=3855297.972,right=459339.543,top=3856245.172` |
| 关键校核 | 道路 93 条、建筑 29 栋、入口 14 个；关键数据集 `prjCoordSys.epsgCode=4547` |
| 证据目录 | `G:\竞赛\超图杯\报告素材\CGCS2000发布验收` |

`.env.development` 当前已使用：

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
```

跨任务协同边界已经确认：

- `SuperMap2DLayer.vue` 当前 `image.png + nonEarthCRS + imageOverlay` 是旧基线和 CGCS2000 两种模式的主路径，不再把旧 EPSG:-1000 服务改回 `tiledMapLayer` 主路径。
- `data-chemical_park_vectors_cn`、`map-chemical_park_vectors_cn`、`PCS_NON_EARTH_LOCAL_METER / EPSG:-1000` 只保留为开发回滚基线、转换来源和内部历史说明。
- `supermap_import_cgcs2000`、`frontend/src/data/supermapGeoreference.js`、CGCS2000 `.env` 配置是新增转换/发布契约，不覆盖旧服务。
- CGCS2000 Data/Map 已完成 iServer 发布和前端 `/smart-map` 验证；Transportation Analyst 服务已发布并能返回路径；3D Realspace 重定位发布和 iPortal 资源切换仍待完成。

### 2026-07-14 Network/Data/Overlay 验收补充

本轮按“先做能真实验收的部分，不能把未发布服务写成已完成”的原则，完成了 iServer Data 查询和前端/iClient2D 几何叠加的独立验收脚本。

新增脚本：

```text
G:\竞赛\超图杯\code\chemical-main\tools\supermap\verify-cgcs2000-data-overlay.mjs
```

验收输出：

```text
G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\cgcs2000_data_query_overlay_validation.json
G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\network_data_overlay_validation.md
```

本次实测结果：

| 项 | 结果 |
|---|---:|
| `Park_BuildingFootprint_R` | 29 栋，`REGION` |
| `Park_RoadNetworkEdge_L` | 93 条，`LINE` |
| `Park_EntrancePoint_P` | 14 个，`POINT` |
| CGCS2000 点查 | 点 `458970.343,3855563.172`，35m 容差命中 6 条 |
| 扩散叠加危险网格 | 9 个 |
| 受影响设施 | 12 个 |
| 阻断道路 | 4 条 |
| 候选出口 | 12 个 |

严格边界：

- 已完成的是 iServer Data 属性查询、CGCS2000 点缓冲查询、扩散风险区与道路/建筑/出口的前端几何叠加。
- 当前扩散叠加执行器为 `iclient2d-overlay`，不是 iServer Spatial Analyst 服务端叠加。
- 化工园区专属 iServer Transportation Analyst 服务已发布：`transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest`。该服务使用 `Park_RoadNetwork_Auto_N`、`nodeIDField=SmID`、`autoCheckNetwork=false`，可返回 CGCS2000 路径；原 `Park_RoadNetwork_N` 在 iServer 检查中出现节点 ID 重复和转向检查警告，仍需 iDesktopX 复核后作为最终高质量路网。
- 前端 `/smart-map` 已完成运行时验证：登录后进入 `/#/smart-map`，SuperMap iClient2D 加载 CGCS2000 Data/Map；选中单栋建筑后执行“扩散模拟 -> 当前建筑路径”，前端优先调用 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 指向的 `path.rjson`，返回 `SuperMap iServer Transportation Analyst` 路线。
- 前端已修复两项演示阻塞：
  - Vite `/api` 代理移除浏览器 `Origin`，避免本地登录接口 `Invalid CORS request`。
  - SuperMap 路径请求前先把建筑中心和出口吸附到最近道路中心线，避免 iServer 报“点没有被捕捉”。
- CGCS2000 三维 Realspace 仍未发布；旧三维服务和本地 SCP 仍显示 `epsg:0`，只能作回滚或处理前证据。
- iServer 返回的部分中文属性仍为乱码；`SmID/id`、坐标、类型和几何可用于算法链路，但中文名称不应直接进入参赛报告截图。应通过重新导入字符集或发布前字段修复解决。

发布版强约束：

- 新发布的二维 Data/Map、三维 S3M/Realspace、iPortal 大屏和前端配置，XY 坐标统一使用 `EPSG:4547 / CGCS2000_3GK_CM_114E`；经纬度备案使用 `EPSG:4490`。
- 旧 `EPSG:-1000` 只用于转换和回滚，不作为新场景发布坐标系，也不作为对外报告/答辩口径。
- 发布版不要把 XY 坐标称为“本地米制”；只有高度/Z 值继续用米表达，例如模型高度、云团抬高、路径抬高和相机高度。
- 前端切 CGCS2000 后，算法 payload、iServer Data geometry、Map image viewBounds、3D Realspace 场景和 iPortal 资源目录都以 CGCS2000 XY 为主。
- 旧 `localX/localY`、`mapX/mapY`、`s3mX/s3mY` 字段只保留 traceability，不参与发布版展示口径。
- 对外报告/答辩口径统一写：本地矢量数据已通过控制点配准发布为 CGCS2000 坐标服务；旧本地平面坐标只用于数据转换和历史回滚。
- 三维触发事件统一使用 `scene-object-pick` payload。发布版必须能提供 `projectedPoint.epsg=4547`；旧场景暂时允许为 `null`，但不能把旧 local XY 当作 CGCS2000 坐标。

## 5. SuperMap 内置能力与自研算法分工

| 能力 | 归属 | 系统落点 | 验收证据 |
|---|---|---|---|
| 地图制图、瓦片生产、服务发布 | SuperMap | iDesktopX + iServer | 处理截图、服务 URL、请求 200 |
| S3M 三维加载 | SuperMap | `/screen` iClient3D | 可见三维模型、S3M 请求、非空截图 |
| 二维底图与业务图层 | SuperMap | `/smart-map` iClient2D | 底图请求、图层状态、截图 |
| 缓冲区/叠加/空间查询 | SuperMap | 二维 iClient2D / iServer 空间分析 | 输入参数、结果图层、截图 |
| IDW/Kriging/等值线 | SuperMap 优先 | 传感器浓度面 | 与自研扩散结果对照 |
| 气体扩散 | 自研算法，SuperMap 表达 | FastAPI 输出浓度帧，二维可做风险区叠加，三维只渲染云团 | 输入 payload、输出帧、三维云团截图 |
| 泄漏源反演/粒子滤波 | 自研算法，SuperMap 表达 | FastAPI 对最终粒子群做 KDE，输出带 Z 的规则栅格 GeoJSON；三维渲染概率地形 | KDE GeoJSON、估计源点、误差、置信半径截图 |
| 路径分析/普通网络分析 | SuperMap 优先 | 二维道路网络数据集/iServer 网络分析 | 路径坐标串、服务 URL、路径截图 |
| D* Lite / A* 动态危险避让 | 自研增强 | FastAPI 或二维引擎结合危险区权重 | 路线不穿越高危区、路径截图 |
| YOLO 识别 | 自研 | 巡检图片 -> 空间事件点 | 识别样例、事件点、误差样例 |

## 6. 里程碑与验收

| 里程碑 | 交付物 | 验收标准 | 负责人 |
|---|---|---|---|
| M1 演示入口稳定 | `/screen` 三维入口、算法按钮、旧场景回滚叠加 | 三维模型可见；扩散/溯源/疏散至少一个算法能运行并落图；无重复图层红错；旧 EPSG:0 只作为回滚说明 | AI 执行，用户确认演示口径 |
| M2 园区二维服务发布 | iDesktopX 二维数据集、iServer 园区地图服务 | 旧 `*_cn` Data/Map 已发布并作为回滚基线；发布版 CGCS2000 Data/Map 已发布，`/smart-map` 已加载 `建筑单体校核图_CGCS2000`，关键数据集 EPSG=4547 | AI 已执行，用户确认展示口径 |
| M3 业务图层 SuperMap 化 | 建筑、道路、传感器、风险区、出口服务 | 道路、建筑、出入口已从 iServer Data 消费；传感器和风险区继续迁移 | AI 执行，用户确认数据公开 |
| M4 算法空间化闭环 | 扩散云团、KDE 概率地形、源点、置信圈、路线、事件点图层 | 每个算法有 payload、JSON/GeoJSON、耗时、截图、复核结论；三维只渲染结果，不伪造粒子过程 | AI 执行 |
| M5 移动端和 iPortal | H5 移动端、iPortal 资源目录、大屏入口 | 手机浏览器可处置任务；iPortal 可稳定访问 | AI 开发，用户真机和账号确认 |

## 7. H5 移动端开发路线

短期只做 H5/PWA，不先做完整原生 App。

| 页面 | 功能 | SuperMap 使用 |
|---|---|---|
| 移动应急首页 | 事故等级、距离风险区、推荐动作 | 查询当前事故空间范围 |
| 移动地图 | 当前位置、危险区、安全出口、路线 | iClient2D 加载 iServer 地图与专题图 |
| 巡检上报 | 拍照、事件类型、自动坐标、备注 | 上报点落成空间事件 |
| 任务处置 | 接收、确认、完成、回传 | 与后端任务流和地图位置联动 |

长期 iMobile 作为加分项：在线地图浏览、原生采集、GPS 轨迹、离线地图包。是否做原生端取决于 SDK 授权、真机和比赛时间。

## 8. 结果可信性检验步骤

每个核心演示功能必须留下四类证据：

1. 输入：接口 payload、事故设定、传感器读数或观测数据。
2. 计算：算法响应 JSON、耗时、requestId、误差或置信度。
3. 空间结果：SuperMap 二维/三维图层截图，必须可见真实内容。
4. 复核结论：是否通过、问题、下一步改进。

演示前检查：

| 检查项 | 通过标准 |
|---|---|
| 三维模型 | `/screen` 可见模型，不是黑屏或空画布 |
| CGCS2000 实体 | 算法结果使用 `EPSG:4547` XY 落到三维 Realspace，Z 仅用于高度/抬高 |
| 扩散算法 | 返回多帧浓度场，峰值和危险区合理 |
| 溯源算法 | 返回估计源点、置信半径、诊断指标 |
| 疏散算法 | 返回可达路线，不穿越高危区域 |
| 控制台 | 项目可控红错已修复，插件噪音单独说明 |
| 服务链路 | iServer、iPortal、FastAPI、前端入口均有 URL 或本地访问记录 |

## 9. 用户与 AI 分工

AI 能做：

- 代码改造、服务启动、接口测试、浏览器验证、截图留证。
- iClient2D/iClient3D/iServer/iPortal Web 集成。
- 数据清单、字段表、接口 payload、验收标准和报告初稿。
- 读取私密文件用于本机连接，但不把账号密码写入公开材料。

用户需要做：

- 确认作品名称、创新点、参赛口径和公开边界。
- 确认真实数据授权、三维瓦片是否可公开展示。
- 处理账号、授权、验证码、生产发布确认等不可替代动作。
- 最终审核 PPT、视频、答辩稿是否符合团队/学校要求。

高危动作必须先确认：删除数据、修改生产服务器、重置许可、外发私密文件、购买服务。
