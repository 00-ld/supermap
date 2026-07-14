# 基于时空智能和数字孪生的化工园区危险气体监测和溯源系统

> 超图杯参赛作品总入口  
> 当前工作目录：`G:\竞赛\超图杯`

本目录用于集中管理超图杯参赛材料、代码工程、SuperMap 相关部署资源、三维瓦片、大屏资源、路线图和私密运维信息。项目目标是构建面向化工园区的危险气体监测、扩散模拟、泄漏源溯源、疏散决策和数字孪生展示系统，并在参赛表达中突出 SuperMap GIS 平台能力。

项目现阶段的核心策略是：

```text
SuperMap-first：能 SuperMap 化的 GIS 能力全部 SuperMap 化；
业务后端、算法服务和已有创新算法保持稳定，不推倒重写。
```

## 1. 作品定位

本作品面向化工园区危险气体事故场景，围绕“感知-模拟-溯源-决策-三维表达”的应急管理闭环展开：

- 通过固定传感器、巡检数据和仿真采样表达园区危险气体状态。
- 通过扩散模型生成危险气体浓度场，支撑风险区域判断。
- 通过泄漏源反演算法估计候选泄漏点和概率区域。
- 通过路径规划算法生成避开危险区域的疏散路线。
- 通过 SuperMap iDesktopX、iServer、iPortal、iClient / iClient3D 组织 GIS 数据、发布服务和构建三维态势展示。
- 通过 Web 前端、Java 后端和 Python 算法服务形成可演示、可验证、可扩展的参赛系统。

参赛叙事建议统一使用：

> 本作品基于 SuperMap GIS 平台构建化工园区数字孪生底座，采用 iDesktopX 完成园区空间数据整理与制图，利用 iServer 发布二维地图、三维场景与空间分析服务，通过 iPortal 统一管理 GIS 资源，并基于 iClient3D 构建 Web 端三维应急态势应用。系统融合扩散模拟、泄漏源反演和疏散路径规划算法，将算法结果实时映射为空间图层，实现“感知-模拟-溯源-决策-三维表达”的一体化应急管理闭环。

当前最新技术口径必须明确：二维地图不能弱化，更不能去掉。二维地图承担“后台计算引擎”，负责道路网络、缓冲区、叠加分析、空间查询和路径分析；三维场景承担“前台投影仪”，只负责把二维分析结果和 Python 算法输出渲染为云团、概率地形、置信椭圆和抬高路径。

## 2. 根目录结构

```text
G:\竞赛\超图杯
├─ code\chemical-main\        项目主代码工程，包含前端、后端、算法、数据库、部署和测试
├─ 园区大屏部署\              SuperMap 大屏包、三维瓦片、气体视频数据值资源
├─ 思路图\                    SuperMap-first 改造路线图、预览图和可导出 HTML
├─ supermap_bslicense\        SuperMap 许可服务相关文件
├─ 私密文件\                  账号、密码、服务器、数据库、软件路径等私密资料
├─ 超图杯本轮对话交接.md       当前阶段工作判断、路线和后续任务交接
└─ readme.md                  本文件，根目录总说明
```

`私密文件\` 中的内容只允许在本地使用，不得复制到公开仓库、参赛材料正文、PPT、视频脚本或外部对话中。涉及服务器、数据库、账号密码、授权、私钥、API Key 的信息只能用“已配置”“本地维护”“通过环境变量注入”等方式描述。

## 3. 主代码工程

主代码工程位于：

```text
G:\竞赛\超图杯\code\chemical-main
```

该工程已经按模块拆分：

| 模块 | 目录 | 说明 |
|---|---|---|
| 前端 | `frontend\` | Vue 3、TypeScript、Vite、Element Plus、Pinia、ECharts、Canvas、Three.js |
| 后端 | `backend\` | Spring Boot 3.4、JDK 21、MyBatis、MySQL、JWT |
| 算法服务 | `algorithm\` | FastAPI、NumPy、SciPy、PyTorch、YOLO11，可承载扩散、溯源、路径规划和识别能力 |
| 数据库 | `db\`、`deploy\mysql\` | MySQL 初始化脚本、表结构和数据维护入口 |
| 三维/数字孪生 | `twin\`、`frontend\src\views\screen\` | SuperMap iPortal、三维场景和坐标映射资料 |
| 测试 | `tests\` | 扩散模型、观测数据、溯源验证和回归测试样本 |
| 工具 | `tools\`、`scripts\` | 代码审计、数据整理、传感器布局校验、运行辅助脚本 |
| 部署 | `deploy\`、`docker\` | Docker Compose、Nginx、MySQL、服务器部署配置 |

详细运行、部署和测试方式以代码工程内 README 为准：

```text
G:\竞赛\超图杯\code\chemical-main\README.md
```

## 4. 本地运行入口

本地演示优先使用代码工程内的一键启动脚本：

```powershell
cd G:\竞赛\超图杯\code\chemical-main
.\run-local.bat
```

一键脚本会依次启动本地 MySQL、Python 算法服务、YOLO 识别服务、Java 后端和前端开发服务。启动完成后常用访问入口为：

| 服务 | 地址 |
|---|---|
| 前端 | `http://127.0.0.1:5173/index.html` |
| 后端 API | `http://127.0.0.1:8081/api` |
| 算法服务健康检查 | `http://127.0.0.1:8000/api/health` |
| YOLO 服务文档 | `http://127.0.0.1:8001/docs` |

停止本地服务：

```powershell
cd G:\竞赛\超图杯\code\chemical-main
.\shutdown.bat
```

本地运行需要 Node.js、Python、uv、JDK、Maven 和 Docker Desktop。具体版本要求、环境变量和手动启动方式见 `code\chemical-main\README.md`。

## 5. SuperMap 资源和部署口径

当前项目采用 SuperMap-first 路线，原则是：能用 SuperMap 软件承接的 GIS 能力优先使用 SuperMap，不把 iPortal 只当作普通外链 iframe。

已知 SuperMap 相关资源：

- `园区大屏部署\`：包含整体大屏、生产装置厂房、原材料仓库、成品加工存储厂房等大屏包，以及三维瓦片和气体视频数据值资源。
- `思路图\supermap-first-roadmap.html`：横向任务路线图，可在浏览器打开并导出图片。
- `思路图\supermap-first-roadmap-preview.png`：路线图预览图。
- `supermap_bslicense\`：SuperMap 许可服务相关文件。
- iPortal / iServer 服务运行在一台 24 小时连续运行的电脑上，并通过 nps 将 `8090`、`8190` 端口映射到服务器 `8.130.175.232` 对外调用。

当前 Web 端已经完成第一版 SuperMap 原生三维入口：

- 系统入口：`code\chemical-main\frontend\src\views\screen\index.vue`。
- 共享三维组件：`code\chemical-main\frontend\src\components\SuperMapSceneViewer.vue`。
- 智慧地图三维底座：`code\chemical-main\frontend\src\views\smart_map\components\ParkScene3D.vue` 复用同一 SuperMap Viewer。
- 三维加载方式：优先使用 SuperMap3D / iClient3D 原生 Viewer，加载 iServer 发布的 `化工园区场景` S3M config。
- iPortal 定位：只作为三维 SDK 或 iServer 场景不可用时的兜底，不再作为主入口 iframe。
- 算法状态：入口页会请求 `/algorithm-api/api/health`，展示 `chemical-algorithm 3.0.0` 在线状态和已封装能力清单。

二维与三维的分工边界：

| 层级 | 定位 | 承担内容 |
|---|---|---|
| 二维地图 / iServer Data | 后台计算引擎 | 道路网络数据集、缓冲区、叠加、空间查询、路径分析、风险区与道路阻断计算 |
| Python 算法服务 | 专业算法引擎 | 扩散模拟、粒子滤波、KDE 概率栅格、泄漏源反演、业务规则融合 |
| 三维 iClient3D | 前台投影仪 | S3M 场景加载、扩散云团、KDE 概率地形、置信椭圆、疏散路线抬高渲染 |

疏散路径的正确链路是：评委在三维场景点击建筑或点位，系统取点击位置的经纬度或投影坐标，传给二维道路网络分析模块；二维模块只基于道路线数据求解路径，返回 `[x,y]` 坐标串；三维端给坐标串赋固定 Z 值后渲染为 Polyline，不在三维瓦片上直接做网络分析。

当前已验证的三维服务口径：

| 类型 | 名称 | 用途 |
|---|---|---|
| iServer Realspace 服务 | `3D-local3DCache-HuaGongYuanQuChangJing/rest` | Web 三维入口的园区场景服务 |
| Realspace 数据 | `化工园区场景` | 园区 S3M 三维瓦片数据 |
| S3M config | `/rest/realspace/datas/化工园区场景/config` | iClient3D 加载三维瓦片的直接入口 |
| SDK 同源代理 | `/supermap3d-remote` | 代理 iPortal SuperMap3D SDK 和 Worker，避免浏览器跨源 Worker 拦截 |

三维坐标口径分为旧回滚基线和发布版目标：

- 旧回滚基线已确认 iServer S3M config 的 `crs` 为 `epsg:0`，只用于说明历史服务和开发回退，不作为参赛发布坐标系。
- Web 端旧基线可按 iServer Realspace 原生 EPSG:0 缓存加载三维模型，避免旧瓦片绿屏；发布版必须加载重新配准后的 CGCS2000 Realspace。
- 发布版三维渲染叠加层直接使用 `EPSG:4547 / CGCS2000_3GK_CM_114E` XY；旧 `worldToGeo()` 只作为经纬度备案和调试参考，不再作为正式三维落图主坐标。
- 粒子滤波概率表达必须由 Python 算法端先对最终粒子群做 KDE，输出带 Z 值的规则栅格 GeoJSON；三维端只消费该 GeoJSON 渲染“概率地形”。如果后端没有返回 KDE GeoJSON，三维端只显示最终估计点和 95% 置信椭圆，不展示前端合成的粒子过程。
- 参赛交付必须在 iDesktopX 中基于河工大莲花街校区控制点重新处理三维模型，重新生成 `EPSG:4547` 的 S3M/SCP 缓存后发布到 iServer。

发布版坐标强约束：

- 正式发布版的二维 Data/Map、三维 S3M/Realspace、iPortal 大屏和前端配置，XY 坐标统一使用 `EPSG:4547 / CGCS2000_3GK_CM_114E`；经纬度备案使用 `EPSG:4490`。
- `PCS_NON_EARTH_LOCAL_METER / EPSG:-1000` 只作为旧 `*_cn` 服务的回滚基线、转换来源和内部历史说明，不作为新场景发布坐标系。
- 对外报告/答辩口径统一写：本地矢量数据已通过控制点配准发布为 CGCS2000 坐标服务；旧本地平面坐标只用于数据转换和历史回滚。
- 发布版不要把 XY 坐标称为“本地米制”；只有三维模型高度、算法云团抬高、路径抬高和相机高度等 Z 值继续用米表达。

部署时需要在 Nginx 或同等网关中保留以下代理口径：

```nginx
location /supermap3d-remote/ {
    proxy_pass http://8.130.175.232:18190/;
}

location /supermap-iserver/ {
    proxy_pass http://8.130.175.232:18090/;
}

location /iserver/ {
    proxy_pass http://8.130.175.232:18090/iserver/;
}
```

本地开发环境由 Vite 在 `vite.config.ts` 中代理上述路径；其中 `/iserver` 是 `scene.open()` 从 Realspace 元数据继续派生出的根路径请求，缺少该代理会导致 `scenes/layers` 看似 200 但实际返回前端 HTML，最终不触发 `.s3mb` 瓦片请求。生产环境如果不配置同源代理，SuperMap3D Worker 或 iServer 登录/许可/config/S3M 请求可能被浏览器拦截，导致三维瓦片无法渲染。

当前推荐改造顺序：

1. 已完成：iDesktopX 2026 桌面端加载 `化工园区场景.scp` 并形成有效截图。
2. 已完成：iServer 发布并可访问 `化工园区场景` 三维 S3M config。
3. 已完成：Web `/screen` 入口使用 SuperMap3D / iClient3D 原生加载三维场景。
4. 已完成：算法服务通过 FastAPI 封装为统一 HTTP 能力入口，并在 Web 入口展示健康状态。
5. 进行中：将扩散云团、KDE 概率地形、溯源置信椭圆、危险区、疏散路线转为 SuperMap 可视图层；其中空间分析算子优先放在二维地图和 iServer Data 服务侧。
6. 待完成：发布 CGCS2000 Data/Map/3D Realspace，并在 iPortal 中整理最终大屏资源、权限和演示入口。
7. 待完成：按 `docs\supermap-algorithm-2d-compute-3d-visualization-plan.md` 将三维 demo 按钮升级为三维 pick 事件驱动组件。
8. 最后整理 PPT、视频、技术文档和答辩材料。

## 6. 算法与代码保护

> 检查原有的算法，如果超图软件提供类似算法，则直接使用超图的算法，比如路径规划在超图中就有封装好了的

参赛需要提供代码，但私人算法必须注意封装边界：

- 核心算法可以通过 Python 服务、模型接口或封装模块被调用。
- 不在公开材料中暴露不必要的私有实现细节、权重文件、训练数据和敏感参数。
- 参赛代码应保留可运行、可测试、可解释的接口层和必要实现，避免把核心逻辑散落在前端或文档中。
- 文档中只写经过代码、测试、脚本或实际演示验证的能力，不把未接入能力写成已完成。

当前代码工程内已有测试和审计入口，常用命令包括：

```powershell
cd G:\竞赛\超图杯\code\chemical-main\frontend
npm run typecheck:strict
npm run build:pro

cd G:\竞赛\超图杯\code\chemical-main
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
uv run --no-sync python -m algorithm.planning.test_dstar_lite
uv run --no-sync python -m tests.test_forward_model
python tools\audit_repository.py
python tools\code_quality_audit.py
```

测试数据、传感器读数和演示样本需要保持真实口径：当前没有真实硬件采集链路时，应表述为仿真采样、手工观测、公开数据集验证或巡检图片识别，不写成现场实测。

## 7. 数据、移动端与结果检验口径

完整规划见：

```text
G:\竞赛\超图杯\code\chemical-main\docs\supermap-cup-division-plan.md
```

该文档已经明确补充：

- 数据来源：三维模型/瓦片、二维底图、道路网络、传感器点、危险源、气象数据、巡检图像分别来自哪里，如何用 iDesktopX/iServer/iClient 处理和表达。
- 算法归属：SuperMap 优先承担缓冲区、空间查询、叠加分析、IDW/Kriging、等值线、专题图和基础网络分析；自研保留气体扩散、泄漏源反演、粒子滤波、动态疏散和 YOLO 识别。
- 移动端路线：短期先做 Vue H5/PWA 现场处置端，展示告警、定位、风险区、疏散路线和巡检上报；长期在条件允许时再扩展 SuperMap iMobile 原生端。
- 用户与 AI 分工：AI 负责代码、服务、截图、文档、验证和 SuperMap 接入；用户主要确认授权登录、数据公开口径、最终参赛叙事和高危发布动作。
- 可信性验证：按数据验证、算法验证、GIS 表达验证、系统回归验证和人工复核五层留证，不能只展示“服务在线”。

每个核心演示功能最终都要保留四类证据：

1. 输入：接口请求参数、传感器读数、事故设定。
2. 计算：算法响应、耗时、误差或置信度。
3. 空间结果：二维/三维 SuperMap 图层截图。
4. 复核结论：是否通过、问题、下一步改进。

## 8. 当前重点任务

当前阶段最重要的不是重写系统，而是让评委第一眼看到 SuperMap GIS 主导的数字孪生应用。建议按以下顺序推进：

| 优先级 | 任务 | 交付标准 |
|---|---|---|
| P0 | 修通 iPortal 大屏可访问 | 无登录状态可打开，页面完整渲染，可截图用于答辩 |
| P0 | 盘点 SuperMap 软件和服务 | 明确 iDesktopX、iServer、iPortal、许可、nps 映射和端口状态 |
| P1 | 制作第一批 SuperMap 数据服务 | 旧 `data-chemical_park_vectors_cn` / `map-chemical_park_vectors_cn` 已发布为回滚基线；发布版必须完成 CGCS2000 Data/Map |
| P1 | Web 端接入 iClient3D | 数字园区首页成为 SuperMap 三维态势主入口；旧 EPSG:0 场景仅作回滚，发布版必须切换 CGCS2000 Realspace |
| P1 | 算法结果转空间图层 | 疏散规划已优先读取 iServer Data；扩散云团、溯源候选点、KDE 概率地形和三维抬高路线继续增强 |
| P2 | 参赛材料整理 | PPT、视频脚本、技术路线图、演示截图和提交说明统一口径 |

当前 P1 的 Web 端 iClient3D 接入已经完成第一版验证。有效报告截图位于：

```text
G:\竞赛\超图杯\报告素材\超图瓦片处理\screenshots\53-web-screen-supermap3d-ready-model.png
```

对应验证 JSON：

```text
G:\竞赛\超图杯\报告素材\超图瓦片处理\screenshots\53-web-screen-supermap3d-ready-model.json
```

该截图不是空 WebGL 画布：画面可见园区厂房、道路、罐区和设备模型，页面状态为“原生三维已加载”，并记录多条 `.s3mb` 瓦片 200 请求。

二维智慧地图也已接入 SuperMap iClient2D。当前实现是在 `/smart-map` 中以 `@supermap/iclient-leaflet` 加载 iServer REST 二维地图服务，现有园区 Canvas 业务图层叠加在 SuperMap 底图之上，保留扩散模拟、源项反演、传感器布局和疏散规划交互。

当前开发/回滚基线可用的园区二维服务为：

```text
Data 服务：/supermap-iserver/iserver/services/data-chemical_park_vectors_cn/rest
Map 服务：/supermap-iserver/iserver/services/map-chemical_park_vectors_cn/rest/maps/建筑单体校核图_CN
坐标口径：PCS_NON_EARTH_LOCAL_METER / EPSG:-1000，仅用于旧基线和转换来源
```

前端已经从 iServer Data 读取：

- `Park_RoadNetworkEdge_L`：93 条道路边，用于疏散道路网络。
- `Park_EntrancePoint_P`：14 个出入口点，其中园区出口 4 个。
- `Park_BuildingFootprint_R`：29 栋建筑单体，用于疏散起点和属性查询。

由于旧二维服务是非地球平面坐标，前端使用 iServer `image.png` 单图层渲染，避免 `tileImage.png` 在 `EPSG:-1000` 下返回 400。有效报告截图位于：

```text
G:\竞赛\超图杯\报告素材\超图瓦片处理\screenshots\54-web-smartmap-supermap2d-ready.png
G:\竞赛\超图杯\报告素材\超图瓦片处理\screenshots\55-web-smartmap-supermap2d-real-backend.png
G:\竞赛\超图杯\报告素材\smart-map-supermap-2d-5174.png
```

CGCS2000 任务已经形成新增转换层和前端配置契约。参赛发布版新服务发布后，必须把 `.env` 切到 `CGCS2000_3GK_CM_114E / EPSG:4547`、`data-chemical_park_vectors_cgcs2000` 和 `map-chemical_park_vectors_cgcs2000`；旧 `*_cn` 只保留回滚，不作为对外发布口径。

2026-07-14 补充进度：

```text
已完成：CGCS2000 Data/Map 发布和前端 `/smart-map` 接入。
已完成：iServer Data 属性查询、CGCS2000 点查询、扩散风险区与道路/建筑/出口的前端几何叠加验收。
证据：G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\
未完成：化工园区 iServer Transportation/Network Analysis 服务尚未发布。
未完成：CGCS2000 三维 Realspace 尚未发布，旧三维服务仍是 epsg:0 回滚场景。
不足：iServer 返回的部分中文属性仍乱码，发布版展示前需要重新导入或字段修复。
```

详细交接内容见：

```text
G:\竞赛\超图杯\超图杯本轮对话交接.md
```

## 9. 事实边界

参赛文档、答辩和演示中必须保持以下边界，避免被评委追问时出现口径风险：

- OSM 是公开众包数据，不是现场测绘成果。
- 天地图是官方底图引用，不是自采影像。
- 传感器读数当前不能直接写成真实硬件采集。
- 三维白模和瓦片不能包装成真实倾斜摄影。
- 发布版不能把旧 `EPSG:-1000` 或 `epsg:0` 写成正式坐标系；正式坐标口径必须是 CGCS2000。
- 算法验证应说明数据来源、测试方式和适用边界。
- 移动端如果只是 H5，不写成完整 iMobile 原生应用。
- iPortal 或 iServer 若仍存在权限、代理、服务不可达问题，不写成已稳定上线。

## 10. 安全与禁止事项

必须遵守以下规则：

- 不把 `私密文件\` 中任何账号、密码、IP 登录方式、数据库口令、授权信息复制到公开材料。
- 不提交真实 `.env`、数据库密码、JWT 密钥、API Key、token、私钥、证书和生产数据库备份。
- 不提交 `node_modules\`、`.venv\`、`__pycache__\`、`dist\`、`target\`、模型权重、大型 `.npy` 文件和临时日志。
- 不把私有算法源码、权重和关键参数无必要地暴露在前端、PPT、视频字幕或公开 README 中。
- 不把无法验证的功能写成已完成，不用假接口、假数据、假截图凑材料。
- 高危不可逆操作，例如删除重要文件、外发私密资料、修改服务器生产配置、购买服务或重置授权，必须先确认。

## 11. 相关文件速查

| 文件 | 用途 |
|---|---|
| `code\chemical-main\README.md` | 主工程运行、部署、测试和开发规范 |
| `code\chemical-main\docs\supermap-cup-division-plan.md` | 超图杯 SuperMap 与自研能力分工规划 |
| `code\chemical-main\docs\supermap-cup-implementation-ledger.md` | SuperMap 产品链接入、服务、截图和验收台账 |
| `code\chemical-main\docs\supermap-cgcs2000-georeference-plan.md` | CGCS2000 控制点、转换脚本、字段和发布契约 |
| `code\chemical-main\deploy\README.md` | 服务器部署指南 |
| `code\chemical-main\twin\README.md` | 数字孪生和 SuperMap 集成规则 |
| `超图杯本轮对话交接.md` | 当前改造判断、SuperMap-first 路线和下一步任务 |
| `思路图\supermap-first-roadmap.html` | 横向改造路线图，可打开和导出 |
| `思路图\supermap-first-roadmap-preview.png` | 路线图预览图 |
| `园区大屏部署\` | iPortal 大屏包、三维瓦片和相关资源 |
| `私密文件\` | 本地私密信息，只读使用，不得外传 |
