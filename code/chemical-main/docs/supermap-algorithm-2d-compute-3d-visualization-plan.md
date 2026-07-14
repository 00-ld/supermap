# SuperMap 算法二维计算与三维可视化计划

更新时间：2026-07-14

本文冻结算法和 SuperMap 场景的职责边界：发布版 XY 坐标统一使用 `EPSG:4547 / CGCS2000_3GK_CM_114E`，经纬度备案使用 `EPSG:4490`；旧 `EPSG:-1000` 只作为回滚基线和转换来源。算法和 GIS 计算发生在二维数据与服务侧，三维场景只负责事件触发、结果投影和证据展示。Z 值继续用米表达，只用于模型高度、云团抬高、路径抬高、KDE 地形高度和相机高度。

## 1. 当前算法有效性核验

从 `G:\竞赛\超图杯\code\chemical-main` 仓库根目录复跑：

| 验证项 | 命令 | 本次结论 | 含义 |
|---|---|---|---|
| 扩散物理不变量 | `uv run --no-sync python -m algorithm.diffusion.test_physical_invariants` | PASS | 高斯烟羽/扩散核心不变量未破坏 |
| 粒子滤波溯源 | `uv run --no-sync python -m algorithm.inversion.validate_particle_filter` | PASS | Prairie Grass 横风扩散宽度、4 类源定位场景和多 seed 重复性均通过 |
| D* Lite 疏散规划 | `uv run --no-sync python -m algorithm.planning.test_dstar_lite` | PASS | 起终点吸附到道路、建筑批量规划、危险气体阻断和比例尺处理均通过 |
| 正向烟羽模型 | `uv run --no-sync python -m tests.test_forward_model` | PASS | A-F 稳定度 FAC2 全为 1，峰值位置、半宽和 sigma 公式与真值一致 |

注意：`python tests\test_forward_model.py` 直接脚本运行可能报 `ModuleNotFoundError: No module named 'algorithm'`，这是启动方式导致包根未进入 `PYTHONPATH`，不是算法精度失败。正式验收使用 `python -m tests.test_forward_model`。

算法可信边界：

- 扩散：可证明公式基准、物理不变量和当前服务入口没有明显回归；真实事故预测仍受气象、障碍物、源强和传感器质量影响。
- 溯源：粒子滤波在可复现实验中达到米级定位误差，并有高噪声和近边界场景验证；演示观测数据必须标注为仿真/采样/公开数据验证，不写成现场实测。
- 疏散：D* Lite 可作为 SuperMap 网络分析不可用时的动态危险避让增强；发布版优先使用 iServer 网络分析服务，Python 规划作为兜底和危险权重增强。

## 2. 总体链路

```text
三维场景事件
  -> 事件组件生成 CGCS2000 业务点和事故参数
  -> 二维 iServer Data/Map/Network Analysis 做空间查询、道路网络和范围计算
  -> FastAPI 算法服务做扩散、反演、D* Lite 动态危险避让和 KDE
  -> 返回 CGCS2000 XY + Z 米制高度的 JSON/GeoJSON
  -> iClient3D 按 Realspace 坐标直接渲染点、线、面、体
  -> iPortal / Web 面板记录 requestId、payload 摘要、截图和复核结论
```

三维不直接承担网络拓扑求解。评委或调度员在三维场景点击建筑、传感器、道路或事故源后，组件把 pick 到的 `SmID/id` 和 CGCS2000 坐标传给二维计算模块；二维模块基于道路、建筑、出入口和危险区得到结果；三维端只把结果按高度偏移渲染到 S3M/Realspace 场景上。

## 3. 坐标与数据契约

| 内容 | 发布版契约 |
|---|---|
| Data/Map/3D/iPortal XY | `EPSG:4547 / CGCS2000_3GK_CM_114E` |
| 经纬度备案 | `EPSG:4490` |
| 高度/Z | 米，仅用于可视化高度、抬高和相机 |
| 道路输入 | `Park_RoadNetworkEdge_L` geometry 已为 CGCS2000 XY |
| 出入口输入 | `Park_EntrancePoint_P` geometry 已为 CGCS2000 XY |
| 建筑输入 | `Park_BuildingFootprint_R` geometry 已为 CGCS2000 XY |
| 算法 payload | 必带 `coordSys='CGCS2000_3GK_CM_114E'`、`epsg=4547`、`map.bounds`、`gisProvider`、`gisDataSource` |
| 算法结果 | 点、路径、风险区、KDE GeoJSON 均返回 CGCS2000 XY；需要三维抬高时附 `z` 或 `heightMeters` |
| 旧字段 | `mapX/mapY`、`localMapX/localMapY`、`s3mX/s3mY` 只用于溯源和回滚，不作为发布版计算/展示 XY |

前端现有 `frontend/src/data/supermapGeoreference.js` 中的本地到 CGCS2000 公式只用于旧数据转换和调试。正式发布后，iServer Data 几何本身已经是 CGCS2000，前端和算法不得再把它当成本地坐标二次转换。

## 4. 二维场景计算计划

| 计算能力 | 二维落点 | 输入 | 输出 | 验收 |
|---|---|---|---|---|
| 设施 pick 解析 | iServer Data 空间查询 / 属性查询 | 三维 pick 的 `SmID/id` 或 CGCS2000 点 | 建筑、装置、传感器、道路对象属性 | 三维点击后能在二维数据集中查到唯一对象或最近对象 |
| 道路网络构建 | iServer Data + Network Dataset | `Park_RoadNetworkEdge_L`、`Park_EntrancePoint_P` | 网络分析服务或前端规划 payload | 道路数量、出入口数量、范围与 Data 服务一致 |
| 普通最短路 | iServer 网络分析优先 | 起点建筑入口、园区出口、道路网络 | CGCS2000 路径线 | 配置 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 时优先调用 SuperMap |
| 动态危险避让 | Python D* Lite 增强 | 道路网络、扩散帧、阻断 mask、危险权重 | 不穿越高危区的 CGCS2000 路径 | `algorithm.planning.test_dstar_lite` 通过，演示路径不穿越高危区 |
| 扩散风险区叠加 | 二维 Map/空间分析 + Python 扩散帧 | 事故源、气象、气体、设施边界 | 风险区面、浓度格网、阻断道路 | 同一帧能复核峰值、风险区和道路阻断 |
| 溯源候选区 | Python 粒子滤波 + 二维范围裁剪 | 传感器读数、风场、搜索边界 | 估计源点、候选区、置信半径 | 粒子验证通过，候选点落在允许设施/搜索范围内 |
| KDE 概率地形 | Python KDE 输出 GeoJSON | 最终粒子群 | `posteriorDensityGeoJSON` Polygon + density + Z | 三维端只消费后端 GeoJSON，不在前端伪造粒子过程 |

## 5. 三维场景触发组件计划

| 组件 | 位置 | 触发事件 | 调用链路 | 输出到三维 |
|---|---|---|---|---|
| 场景对象选择器 | `SuperMapSceneViewer.vue` / 后续 `ScenePickController` | 左键 pick 建筑、装置、传感器、道路 | `facility-click` -> 二维 Data 查询 -> 面板选中对象 | 高亮对象、显示属性、设置疏散起点 |
| 事故源放置器 | 三维工具栏 / 右侧事故面板 | 点击装置或地图点，选择气体和源强 | 生成扩散 payload -> `/api/diffusion/simulate` | 泄漏源点、初始风险圈、源点标签 |
| 扩散控制器 | 三维算法面板 | 点击“运行扩散”或切换时间帧 | FastAPI 扩散 -> 二维风险区/阻断 -> 三维云团 | 浓度椭圆/体块、危险区面、时间轴 |
| 溯源控制器 | 三维算法面板 | 点击“粒子溯源” | 传感器观测 -> `/api/inversion/particle-filter` | 估计源点、95% 置信圈、KDE 概率地形 |
| 疏散控制器 | 三维建筑选中态 / 算法面板 | 点击建筑或“疏散规划” | 二维网络分析优先 -> Python D* Lite 兜底 | 抬高疏散路线、起点、出口、阻断点 |
| 证据面板 | 三维右侧/底部面板 | 任一算法完成 | 记录 requestId、耗时、输入摘要、输出摘要 | 可截图的证据卡、JSON 下载入口 |
| 图层管理器 | 三维浮层 | 开关扩散、KDE、路线、传感器、建筑高亮 | 统一管理 entity/primitive 生命周期 | 防止重复叠加和旧结果残留 |

现有状态：

- `frontend/src/components/SuperMapSceneViewer.vue` 已有 `runDiffusionDemo`、`runParticleDemo`、`runEvacuationDemo` 和 `facility-click` pick 事件。
- 已有 `drawDiffusionOverlay`、`drawParticleOverlay`、`drawEvacuationOverlay`、`drawParticleKdeSurface`，可作为图层管理器的第一版实现。
- 发布版需要把当前演示按钮升级为“事件驱动组件”：先由三维 pick/事故源选择改变业务上下文，再由算法按钮消费当前上下文，不再只跑固定 demo。

## 6. 三维可视化规则

| 算法结果 | 三维表达 | 坐标处理 | Z 规则 |
|---|---|---|---|
| 泄漏源 | Point + Label | CGCS2000 XY 直接对应 Realspace | 源点高度或 `releaseHeight` |
| 扩散浓度帧 | 半透明 Ellipse / Ellipsoid / Polygon | cell 中心或风险区面用 CGCS2000 XY | 云团抬高 8-50m 表达浓度强弱 |
| 风险区 | Polygon 面 | GeoJSON Polygon 坐标为 CGCS2000 XY | `height=0~2m` 或贴近地面 |
| 估计源点 | Point + Label | `estimatedSource.mapPoint/projectedPoint` | 16m 抬高，避免被模型遮挡 |
| 置信半径 | Ellipse | 半径单位为米，中心为 CGCS2000 XY | 低高度半透明圈 |
| KDE 概率地形 | Polygon perPositionHeight | GeoJSON ring 为 CGCS2000 XY | `elevationZ/heightMeters` 表达概率 |
| 疏散路线 | Polyline | CGCS2000 路径点 | 18m 左右抬高，节点略微错开防闪烁 |
| 出口/起点 | Point + Label | CGCS2000 点 | 15-20m 抬高 |

三维渲染必须与发布版 Realspace 同坐标系。只有旧 `epsg:0` 回滚场景需要临时走本地缓存映射；该路径不得作为参赛发布口径。

## 7. 分阶段实施表

| 阶段 | 操作 | 产物 | 验收标准 |
|---|---|---|---|
| A. 算法证据冻结 | 固定四条验证命令和结果 | 本文第 1 节、终端日志/截图 | 四条命令 PASS，3D `.npy` 缺失只记录为可选跳过 |
| B. CGCS2000 数据发布 | iDesktopX 导入转换 GeoJSON，发布 Data/Map/Network/3D | `data/map/3D-chemical_park_vectors_cgcs2000` | 坐标范围接近 `E=457752~459340, N=3855298~3856245`，3D config 不再 `epsg:0` |
| C. 二维计算接入 | 配置 Data、Map、Network Analysis URL | `.env.production`、iServer 请求证据 | `/smart-map` Data 几何与 Map image 均为 CGCS2000 |
| D. 三维事件组件化 | 从 demo 按钮改为 pick 上下文 + 算法动作面板 | `ScenePickController`、算法面板、证据面板 | 事故源、建筑、传感器均可在三维触发算法 |
| E. 二三维一致性校核 | 同一对象在二维和三维复核 | 控制点截图、对象截图、JSON | 建筑入口、道路交点、南门 CP0 偏差可解释 |
| F. 报告留证 | 固化输入、计算、空间结果、结论 | 证据包目录 | 每个算法都有 payload、response、截图和复核结论 |

## 8. 当前验收状态补充

2026-07-14 已补充 Data 查询和扩散叠加的可复跑验收：

```text
node tools/supermap/verify-cgcs2000-data-overlay.mjs
```

输出：

```text
G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\cgcs2000_data_query_overlay_validation.json
G:\竞赛\超图杯\报告素材\NetworkAnalysis发布验收\network_data_overlay_validation.md
```

结论：

- `data-chemical_park_vectors_cgcs2000` 可按 `SmID/id` 查询建筑、道路、出入口。
- CGCS2000 点 `458970.343,3855563.172` 在 35m 容差内可查到南门、东门及相邻道路，共 6 条结果。
- 示例扩散帧与 iServer Data 几何叠加后得到 12 个受影响设施、4 条阻断道路和 12 个候选出口。
- 该结果执行器为 `iclient2d-overlay`，只证明 Data 几何和前端二维叠加链路可用；不能写成 iServer Spatial Analyst 已完成。
- iServer Transportation Analyst 已发布并通过 `path.rjson` 返回 CGCS2000 路径，服务 URL 为 `transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest`；但当前可用数据集为 `Park_RoadNetwork_Auto_N`，并关闭了自动网络检查，路网拓扑质量仍需 iDesktopX 复核。
- `/smart-map` 单建筑疏散已完成运行时验证：选中建筑后执行“扩散模拟 -> 当前建筑路径”，前端先把建筑中心和出口吸附到最近道路中心线，再调用 `path.rjson`，页面显示 `规划成功`、`规划内核=SuperMap iServer Transportation Analyst`。
- `/smart-map` 批量“全建筑路径”当前仍走 Python D* Lite，不能写成已完成 SuperMap 批量网络分析。
- Vite 本地代理已修复 `/api` 登录 CORS 问题，5174 端口可作为当前演示入口。
- 当前阻塞项仍是 CGCS2000 3D Realspace 重定位发布、iServer Spatial Analyst 叠加服务、iPortal 资源切换。
- 中文属性字段仍存在字符集乱码，发布版报告截图应优先使用 ID、坐标、类型，或在重新导入修复后再展示中文名称。

## 9. 与前端接入线程的稳定契约

另一个前端接入任务只需要保持这些契约：

- 当前可运行默认仍可保留 `*_cn` 旧服务作为回滚，但发布版 `.env` 必须切到 CGCS2000。
- `SuperMap2DLayer.vue` 对 `EPSG:-1000` 和 `EPSG:4547` 继续走 iServer `image.png` 单图层，不回退到会触发 400 的旧 tile 主路径。
- `useSuperMapIserverData.ts` 读到 CGCS2000 Data 后，不再进行本地米制到投影的二次转换；几何 XY 直接进入算法 payload。
- `useSmartMapAlgorithmExecutors.ts` 已适配 SuperMap `path.rjson`，保持 `VITE_SUPERMAP_NETWORK_ANALYSIS_URL` 优先、Python D* Lite 兜底。
- 三维组件新增事件时，输出统一是 `selectedObjectId`、`projectedPoint: { x/easting, y/northing, epsg:4547 }`、`heightMeters` 和业务参数，不再输出旧本地 XY 作为发布版主坐标。
