# 三维算法可视化调研报告（扩散 + 溯源）

> 调研时间：2026-07-18
> 调研者：Claude（三维 GIS 可视化调研 agent）
> 任务范围：只调研、出报告，不改代码。
> 适用项目：超图杯化工园区应急态势大屏（SuperMap iClient3D for Vue3 / 基于 Cesium 的 SuperMap3D 增强版）。
> 坐标系背景：CGCS2000 EPSG:4547 投影 / EPSG:4490 经纬高；三维模型锚点 113.569463, 34.76965（详见 `docs/codex-fix-2026-07-18-3d-algorithm-alignment.md` F2 条目的 A 点）。
> 现有三维基础：`SuperMapSceneViewer.vue` 已用 `Cesium3DTileset` 加载园区模型，已有 `drawDiffusionOverlay` / `drawParticleOverlay` / `drawEvacuationOverlay` / `drawParticleKdeSurface` 四个落图函数，当前全部是"2.5D"（带高度抬升的平面 Entity：Ellipse / Polygon / Polyline / Point），未使用真正的体绘制或三维粒子云。

## 现状一句话定位

当前两条算法链路的"三维落图"本质是**二维结果贴在带高度的 Entity 上**：扩散用扁平 `Ellipse`（`addEllipseEntity`）+ 垂直风险柱（`addDiffusionPlumeMarker`），溯源用点 + 扁平置信圈 + KDE 多边形面。浓度场的三维体积感、粒子群的收敛轨迹动画、不确定性的概率云都**没有真正三维化**。本报告调研的开源方案用于补齐这块。

---

## 1. 方案矩阵

| # | 方案 | 技术栈 | 能力（针对扩散/溯源） | 改造成本 | 是否适配当前 Cesium+SuperMap 技术栈 | 推荐度 |
|---|---|---|---|---|---|---|
| A | **SuperMap `VoxelGridLayer3D` / `Volume` + iDesktopX 体元栅格** | SuperMap3D 原生 + iDesktopX 发布 + iServer | 体绘制浓度场：`VolumeRenderMode.VolumeRendering`（射线步进）/ `Slice`（切片）/ `ContourValue`（等值面），`addClipPlane` 最多 6 个剖切面，`hypsometricSetting` 分层设色 | 中：需 iDesktopX 构建体元栅格并发布 iServer 服务，前端调用 `new VoxelGridLayer3D({url})` | **完全适配**（项目就是 SuperMap3D，且已有 iServer 发布管线） | **★★★★★ 扩散首选** |
| B | **SuperMap `ParticleSystem` + `ParticleHelper.fromJsonUrl`** | SuperMap3D 原生 | 高性能粒子（GPU），由 JSON 配置驱动，可模拟烟雾/喷射/扩散羽流；可用作扩散"烟团动画"和溯源"粒子云" | 低：前端纯调用，写一份粒子 JSON 配置 | **完全适配** | **★★★★☆ 溯源粒子云首选，扩散烟团次选** |
| C | **SuperMap `HeatMap` 类** | SuperMap3D 原生 | `new HeatMap({quality, intensityRange})` + `setData([{x,y,intensity}])` + `scene.primitives.add(heatMap)`，二维热力图贴地（可浮空） | 极低：前端直接吃浓度网格点 | **完全适配** | **★★★★ 扩散浓度场二维快速落地**（三维体积感弱，作过渡方案） |
| D | **SuperMap `PolylineTrailMaterialProperty`（流动尾迹线）** | SuperMap3D 原生 | GLSL 流动线材质，`trailLength` / `constantSpeed` 参数；疏散路线动画 + 溯源粒子轨迹回放 | 极低：替换现有 `addPolylineEntity` 的 material | **完全适配** | **★★★★ 疏散路线动画首选** |
| E | **SuperMap 三维流场 S3M 瓦片 / 水场粒子** | SuperMap3D 原生（iDesktopX 生成） | 官方明确支持"基于三维流场数据生成的 S3M 瓦片"和"水场模型粒子效果表达流速流向"，可直接承载风场/扩散矢量场 | 高：需 iDesktopX 生成流场 S3M 瓦片 | **完全适配**（但依赖 iDesktopX 工具链） | **★★★ 扩散风场进阶方案**（有官方实现，但工具链重） |
| F | **Cesium `VoxelPrimitive` + `Cesium3DTilesVoxelProvider` + `CustomShader`** | Cesium 原生（SuperMap3D 继承） | 真正的体绘制：射线步进，自定义 GLSL 片段着色器在每个体素步执行，可做浓度色带、等值面、透明度积分 | 高：需生成 3D Tiles 体素瓦片（`EXT_primitive_voxels` 扩展）+ 写 CustomShader | **适配但非首选**（SuperMap3D 有更上层的 A 方案；纯 Cesium 路径需自建瓦片管线） | **★★★ 扩散进阶**（无 iDesktopX 时的替代） |
| G | **Cesium `ParticleSystem`（`updateCallback`）** | Cesium 原生 | 每帧 `updateCallback(particle, dt)` 可改 velocity/position，能表达高斯烟羽粒子随风扩散；但单系统粒子数有限，不适合 12000 粒子溯源 | 中：需写物理更新回调 | **适配**（SuperMap3D 兼容 Cesium API） | **★★★ 扩散烟团动画**（B 方案的 Cesium 降级版） |
| H | **Cesium `EllipsoidGraphics`（`SampledProperty` radii）** | Cesium 原生 | 三维椭球表达协方差/置信区域，radii 可随时间采样动画；社区已验证用于卫星星历协方差可视化 | 极低：`entities.add({ellipsoid:{radii, material}})` | **完全适配** | **★★★★ 溯源不确定性置信椭球首选** |
| I | **Cesium `PointPrimitiveCollection`** | Cesium 原生 | 单 Collection 可承载 10 万+ 点，每帧批量更新位置/颜色；社区实测 10 万点可接受刷新 | 低：替换现有 `entities.add({point})` 为 collection | **完全适配** | **★★★★ 溯源 12000 粒子云渲染层首选** |
| J | **Cesium `PathGraphics`（`leadTime`/`trailTime`）** | Cesium 原生 | 沿时间轴绘制轨迹拖尾，天然适配溯源粒子收敛轨迹回放 | 低：Entity 加 `path` 字段 | **完全适配** | **★★★ 溯源粒子轨迹回放** |
| K | **Cesium `CustomShader` on `Cesium3DTileset` / `Primitive`** | Cesium 原生 | 自定义 GLSL 做浓度切片、等值面、屏幕空间特效 | 高：需写 GLSL | **适配** | **★★★ 进阶定制**（A/F 方案的底层） |
| L | **Three.js `three.js-volume-renderer` / `procedural-clouds-threejs`（raymarching）** | Three.js | 浏览器内 raymarching 体绘制，Beer-Lambert + Henyey-Greenstein 相函数，自阴影；可渲浓度场 | 高：需 Cesium+Three.js 同屏叠加桥接 | **不直接适配**（项目是 SuperMap3D，叠加成本高） | **★★ 仅作 Cesium 不够用时的 overlay 兜底** |
| M | **Three.js GPU 粒子（`three-particles` / `plume` / `Three-VFX`）** | Three.js WebGPU | 5 万-35 万粒子 GPU 计算，TSL 着色；可表达大规模溯源粒子群 | 高：需桥接 | **不直接适配** | **★★ 仅作 12000 粒子超 Cesium 上限时的兜底**（实际未超） |
| N | **`cesium-three-plugin` / `three-to-cesium` 桥接** | Cesium+Three.js 桥接 | 同 Canvas/WebGL context 叠加，Three.js 场景跟随 Cesium 相机 | 中高：引入第二套渲染栈 | **半适配**（增加复杂度，与 SuperMap3D 兼容性需验证） | **★★ 仅 L/M 方案的依赖** |
| O | **Stone-Soup（Python，dstl 官方）** | Python 后端 | 611 星，活跃。`Autonomous_Source_Term_Estimation` 示例就是粒子滤波 STE；`Plotter.plot_tracks(..., particle=True, uncertainty=True)` 可绘粒子云 + 不确定性椭圆，3D plotting 示例存在 | 低（后端参考，不直接渲染三维） | **后端参考**（项目已有自研粒子滤波，可对齐接口） | **★★★★ 溯源算法参考实现**（非前端渲染层） |
| P | **`joshuanunn/really-simple-dispersion`（JS/Wasm）** | JS/Rust+Wasm | 浏览器内高斯扩散模型 + 等值线可视化（plan + side elevation），9 星（JS 版）/3 星（Wasm 版） | 低（参考算法） | **后端/算法参考**（项目已有扩散算法） | **★★★ 扩散可视化范式参考**（星数低但 demo 直观） |
| Q | **`hongfaqiu/cesium-wind-layer`** | Cesium 插件 | 112 星，活跃。GPU 加速风场粒子动画，NetCDF 输入；可作风场/扩散粒子流场背景 | 低：npm 装 cesium-wind-layer | **适配** | **★★★ 风场背景层**（扩散的环境风场可视化） |
| R | **`RaymanNg/3D-Wind-Field`** | Cesium | 497 星。3D 风场粒子可视化，cesium-wind-layer 的上游 demo | 低：参考实现 | **适配** | **★★★ 风场参考**（星数高但 2019 年后更新少） |

> 推荐度图例：★★★★★ = 与现有技术栈零摩擦且官方原生支持，首选；★★★★ = 强烈推荐，低成本高收益；★★★ = 可选/进阶/参考；★★ = 兜底或依赖重。

---

## 2. 扩散算法三维可视化推荐方案

扩散算法输出是**多帧浓度场**（网格浓度矩阵 + 时间序列）。三维可视化的三个核心需求：浓度场怎么渲、烟团怎么动、多帧怎么播。

### 2.1 浓度场渲染：首选 SuperMap `VoxelGridLayer3D`（方案 A）

**为什么是首选**：项目技术栈就是 SuperMap iClient3D，`VoxelGridLayer3D` 是 SuperMap3D 原生类，专门为"体元栅格数据集"设计，正好对应浓度网格矩阵。官方 API 文档明确支持三种渲染模式（`VolumeRenderMode`）：

- `VolumeRendering`（枚举值，体绘制，射线步进）—— 整团浓度云的三维体积感
- `Slice`（切片）—— 任意平面切浓度场看内部
- `ContourValue`（等值面）—— 设 `contourValue` 属性"设置等值面的强度值"，直接得到指定浓度阈值的封闭曲面（如 100ppm 危险区边界）

附加能力：`addClipPlane()` 最多 6 个剖切面（`"设置一个裁剪面，最多不超过6个"`），`hypsometricSetting` 分层设色（浓度色带），`sliceCoordinate` 切片位置。

**落地链路**：
1. **iDesktopX 构建**：用"构建体元栅格"工具（`help.supermap.com/iDesktopx/.../Layer3DProperty_VoxelGrid.html` 已确认存在），把扩散算法输出的多帧浓度网格（`frame.cells: [{x,y,concentration}]`）插值成三维体元栅格数据集。iDesktopX 体元栅格图层属性面板已有"剖切显示"和"显示范围"模块。
2. **iServer 发布**：体元栅格数据集发布为 iServer 服务（项目已有 `data-chemical_park_vectors_cgcs2000` 发布管线，复用同一套 CGCS2000 EPSG:4547 坐标系）。
3. **iClient3D 加载**：前端 `new SuperMap3D.VoxelGridLayer3D({url})` 或 `new SuperMap3D.Volume({url, hypsometricSetting})`（`Volume` 类用于"添加由 iServer 动态发布的体元栅格数据集的瓦片，需要附加到模型上使用"）。

**关键 API 指针**（来自 SuperMap3D 官方文档）：
- `new SuperMap3D.VoxelGridLayer3D(options)` — Field data layer
- `contourValue : Number` — "Set the intensity value of the isosurface."
- `VolumeRenderMode : VolumeRenderMode` — 体数据显示模式
- `addClipPlane()` — "Set a cutting surface, no more than 6 at most."
- `sliceCoordinate : Number`
- `new SuperMap3D.Volume({url, hypsometricSetting})` — 体元栅格数据集瓦片类

**坐标系复用**：体元栅格发布走 CGCS2000 EPSG:4547，与现有 `Cesium3DTileset` 锚点 A（113.569463, 34.76965）同坐标系，三维场景里直接叠加，无需额外坐标转换。

### 2.2 浓度场渲染：过渡方案 SuperMap `HeatMap`（方案 C）

若 iDesktopX 体元栅格构建来不及（依赖 iDesktopX 工具链），`HeatMap` 是**零工具链依赖**的快速落地路径：
- `new SuperMap3D.HeatMap({quality: SuperMap3D.Quality.HIGH, intensityRange: new SuperMap3D.Cartesian2(0.2, 0.8)})`
- `heatMap.setData([{x, y, intensity}, ...])`
- `scene.primitives.add(heatMap)`

直接吃扩散算法的 `frame.cells`（每个 cell 的 concentration 作 intensity）。缺点：是贴地/浮空的二维热力图，没有真正的三维体积感（无切片、无等值面）。建议作为 VoxelGridLayer3D 发布前的演示兜底。

### 2.3 烟团动画：SuperMap `ParticleSystem` + `ParticleHelper.fromJsonUrl`（方案 B）

浓度场是静态网格，烟团是动态粒子。`ParticleSystem` 用 JSON 配置驱动：
- `SuperMap3D.ParticleHelper.fromJsonUrl(jsonUrl, scene, useGPU)` — `useGPU` 参数明确支持 GPU 粒子
- 官方产品介绍：`"提供高性能的粒子系统，支持模拟火焰、喷泉、雨雪等现象"`

**用于扩散**：在泄漏源点（`SUPERMAP_CUP_SCENARIO.sourceMapPoint`）放一个 `ParticleSystem`，发射器方向对齐风向（来自气象站 `weather-station` 传感器的风速风向），粒子寿命对齐扩散时长，颜色按浓度衰减。这能给出"烟从源点飘出"的直觉动画，比当前 `addDiffusionPlumeMarker`（垂直风险柱）更真实。

**注意**：SuperMap 社区反馈 `ParticleSystem` 在 11i(2023) 版本有参数兼容问题（原 Cesium 参数无法直接用，需用 SuperMap3D 的 `ParticleSystem` 配置），落地时需对照当前 iClient3D 版本验证（`ask.supermap.com/134520` 已记录此坑）。

### 2.4 多帧播放：时钟驱动 + `SampledProperty` / 帧切换

扩散算法输出多帧 `frame.cells`。三种播放策略：
1. **VoxelGridLayer3D 多帧**：iDesktopX 把多帧浓度场构建为时序体元栅格，iClient3D 按时钟切换（依赖 iServer 时序发布能力）。
2. **HeatMap 帧切换**：`clock.onTick` 里 `heatMap.setData(nextFrameCells)`，每帧重设数据。社区实测 10 万点可接受刷新（见方案 I 的性能证据），浓度网格通常几百到几千 cell，无压力。
3. **ParticleSystem 时间映射**：粒子寿命 = 总时长，`updateCallback` 按当前时钟进度调整发射率。

### 2.5 风场背景：`cesium-wind-layer`（方案 Q）

扩散需要风场背景。`hongfaqiu/cesium-wind-layer`（112 星，MIT，2024 年活跃维护）是 Cesium 风场粒子动画的标准插件，GPU 加速，支持 NetCDF。可作扩散场景的环境风场底图，与浓度场叠加。注意它是纯 Cesium 插件，需验证与 SuperMap3D（Cesium 增强）的兼容性。

---

## 3. 溯源算法三维可视化推荐方案

溯源算法输出：12000 粒子、36 轮迭代，输出泄漏源候选位置的后验分布 + 粒子群收敛轨迹。三个核心需求：粒子群收敛怎么动、源候选怎么标、不确定性怎么表达。

### 3.1 粒子群渲染：`PointPrimitiveCollection`（方案 I）—— 12000 粒子首选

**为什么不是 Entity**：当前 `renderMonitoringSensors` 用 `entities.add({point})`，Entity API 在 12000 点量级会卡。Cesium 官方性能文档明确：`PointPrimitiveCollection` 是大批量点的首选，`"a few collections, each with many points"`，社区实测 10 万点可接受刷新（`community.cesium.com/.../displaying-high-volumes-of-points-on-terrain` 明确："this example uses ... 10k points clamped to ground"，`storm.pps.eosdis.nasa.gov/storm/cesium/HWRF.html` 实测 10 万点）。

**关键用法**：
- `const collection = new Cesium.PointPrimitiveCollection(); scene.primitives.add(collection);`
- `const p = collection.add({position, color, pixelSize});`
- 每轮迭代后 `p.position = newPos` 批量更新（性能优于 Entity）
- 按更新频率分 Collection（静态点一个、动态粒子一个）

**落地**：把 36 轮迭代的粒子群坐标序列作为时序数据，`clock.onTick` 里按当前迭代轮次批量更新 `PointPrimitive` 位置，颜色按粒子权重（后验概率）渐变（低权重灰、高权重亮），直观看到粒子群从分散→收敛到源候选的收敛过程。

### 3.2 粒子云动画：SuperMap `ParticleSystem`（方案 B）作收敛云

`ParticleHelper.fromJsonUrl(useGPU:true)` 的 GPU 粒子可承载 12000 粒子云（GPU 模式）。但 `ParticleSystem` 的粒子是"发射-死亡"模型，不是"自由位置"模型，更适合表达**烟团扩散**，而非**粒子滤波的迭代收敛**。收敛轨迹更适合用 I（位置批量更新）+ J（PathGraphics 拖尾）。

### 3.3 源候选标注：`Point` + `Label`（已有）+ 三维抬升（已有）

当前 `drawParticleOverlay` 已用 `addPointEntity(estimatedPoint, '溯源估计点', '#ffb020', 12)`，这部分不用改。16m 抬高避免模型遮挡（`supermap-algorithm-2d-compute-3d-visualization-plan.md` 第 6 节规则）。

### 3.4 不确定性表达：`EllipsoidGraphics` 置信椭球（方案 H）—— 溯源不确定性首选

**当前缺陷**：`drawParticleOverlay` 用扁平 `addEllipseEntity` 表达 `credibleRadius95m`，这是二维圆，丢失了三维不确定性。

**三维升级**：`Cesium.EllipsoidGraphics` 用 `radii`（三元 `Cartesian3`）表达三轴不确定性椭球。关键证据：Cesium 社区已用 `EllipsoidGraphics` + `SampledProperty` radii 渲染卫星星历协方差（`community.cesium.com/.../ellipsoidgraphics-with-radii-as-sampledproperty/43574`，明确"generates cesium entities ... to render the covariance"）。

**落地**：
- 中心 = `estimatedSource.mapPoint`
- `radii = new Cesium.Cartesian3(σx, σy, σz)` —— 从粒子群后验协方差矩阵特征分解得到三轴标准差（后端 `runParticleFilterInversion` 已有粒子群，可算协方差）
- `material` 半透明橙黄，`fill=true, outline=true`
- 多帧时 `radii` 用 `SampledProperty` 随迭代轮次收缩（粒子收敛→椭球缩小）

### 3.5 后验分布：KDE 三维化（当前是二维 Polygon）

`drawParticleKdeSurface` 当前把 `posteriorDensityGeoJSON` 渲成贴地 Polygon 面（`normalizedDensity` 调高度）。三维升级两条路：
1. **等值面**：把 KDE 栅格按 A 方案的 `VoxelGridLayer3D.contourValue` 渲成三维等值面（如 50%/90% 置信区间的封闭曲面）。
2. **概率云**：用 `PointPrimitiveCollection`（方案 I）把所有粒子按权重画成三维散点云，颜色映射后验密度，叠加 H 方案的置信椭球。

### 3.6 收敛轨迹回放：`PathGraphics`（方案 J）

`PathGraphics` 的 `leadTime` / `trailTime` 天生为轨迹拖尾设计（`community.cesium.com/.../drawing-animated-polyline-between-multiple-points-over-time/4008` 明确：`"Set leadTime to 0 ... trailTime to the length of the interval"`）。可用于回放某几个代表性粒子的迭代轨迹（从初始散布位置到收敛位置的路径），配合时钟播放。

### 3.7 算法参考：Stone-Soup（方案 O）

项目自研粒子滤波已通过 `algorithm.inversion.validate_particle_filter`。Stone-Soup（dstl 官方，611 星，MIT，活跃，v1.8）是溯源算法的权威参考实现：
- `docs/examples/sensormanagement/Autonomous_Source_Term_Estimation.py` —— 粒子滤波 STE 完整示例（airborne release source term estimation）
- `stonesoup/tracker/particle.py` —— 粒子滤波实现
- `Plotter.plot_tracks(tracks, mapping, particle=True, uncertainty=True)` —— 粒子云 + 不确定性椭圆可视化（`ellipse_points=30`，`uncertainty_alpha=0.2`）
- `auto_examples/plotting/plotting_3D.html` —— 三维绘图示例

用于对齐后端粒子滤波的输出接口（粒子权重、协方差、后验分位数），让前端可视化能直接消费标准化的不确定性数据。

---

## 4. 关键开源项目链接

| 项目 | 链接 | 星数 | 活跃度 | 关键代码/文档指针 |
|---|---|---|---|---|
| **SuperMap iClient3D-for-WebGL** | https://github.com/SuperMap/iClient3D-for-WebGL | 官方仓库 | 官方维护 | `examples/webgl/` 目录含粒子/热力图/体元示例；`docs/Documentation/` 含 `VoxelGridLayer3D.html`、`Volume.html`、`HeatMap.html`、`ParticleHelper.html`、`PolylineTrailMaterialProperty.html` |
| SuperMap iClient3D 在线文档（VoxelGridLayer3D） | https://iserver.supermap.io/iserver/iClient/for3D/webgl/en/docs/Documentation/VoxelGridLayer3D.html | — | 官方 | `contourValue` / `VolumeRenderMode` / `addClipPlane` / `sliceCoordinate` |
| SuperMap iClient3D 在线文档（HeatMap） | https://iserver.supermap.io/iserver/iClient/for3D/webgl/en/docs/Documentation/HeatMap.html | — | 官方 | `setData([{x,y,intensity}])` |
| SuperMap iClient3D 在线文档（ParticleHelper） | https://iclient.supermap.io/iserver/iClient/for3D/webgl/en/docs/Documentation/ParticleHelper.html | — | 官方 | `fromJsonUrl(jsonUrl, scene, useGPU)` |
| SuperMap iDesktopX 体元栅格图层属性 | https://help.supermap.com/iDesktopx/zh/tutorial/SceneOperation/LayersManagement/Layer3DProperty_VoxelGrid.html | — | 官方 | "构建体元栅格"工具 + "剖切显示" + "显示范围" |
| SuperMap 体元数据生成及使用（CSDN） | https://blog.csdn.net/supermapsupport/article/details/88812811 | — | 官方博客 | 体元栅格生成 → 场景显示 → 图层属性调整全流程 |
| **dstl/Stone-Soup** | https://github.com/dstl/Stone-Soup | 611 | 活跃（v1.8，MIT） | `docs/examples/sensormanagement/Autonomous_Source_Term_Estimation.py`（粒子滤波 STE）；`stonesoup/tracker/particle.py`；`stonesoup/plotter.py`（`plot_tracks(particle=True, uncertainty=True)`）；`auto_examples/plotting/plotting_3D.html` |
| Stone-Soup 文档 | https://stonesoup.readthedocs.io/en/stable/stonesoup.plotter.html | — | 活跃 | `Plotter.plot_tracks` 签名 + `uncertainty_alpha` |
| **hongfaqiu/cesium-wind-layer** | https://github.com/hongfaqiu/cesium-wind-layer | 112 | 活跃（2024+，MIT） | GPU 风场粒子动画，NetCDF 输入；首页 https://cesium-wind-layer.opendde.com/ |
| **RaymanNg/3D-Wind-Field** | https://github.com/RaymanNg/3D-Wind-Field | 497 | 低活跃（2019） | 3D 风场粒子，cesium-wind-layer 上游；demo: https://raymanng.github.io/3D-Wind-Field/demo/ |
| **CesiumGS/cesium（VoxelPrimitive Sandcastle）** | https://github.com/CesiumGS/cesium/blob/main/Apps/Sandcastle/gallery/Voxels.html | 12.6k+ | 活跃 | `VoxelPrimitive` + `CustomShader` 体绘制示例；`Voxel%20Picking.html` 拾取示例 |
| Cesium CustomShader 指南 | https://github.com/CesiumGS/cesium/blob/main/Documentation/CustomShaderGuide/README.md | — | 官方 | "Using custom shaders for voxel rendering" 段，`VoxelPrimitive({provider, customShader})` |
| Cesium ParticleSystem 文档 | https://cesium.com/learn/cesiumjs/ref-doc/ParticleSystem.html | — | 官方 | `updateCallback(particle, dt)` 签名 |
| Cesium ParticleSystem 教程 | https://cesium.com/learn/cesiumjs-learn/cesiumjs-particle-systems/ | — | 官方 | `updateCallback` 改 velocity 做物理效果（重力示例） |
| Cesium PointPrimitiveCollection | https://cesium.com/learn/cesiumjs/ref-doc/PointPrimitiveCollection.html | — | 官方 | "a few collections, each with many points" 性能建议 |
| Cesium EllipsoidGraphics | https://cesium.com/learn/cesiumjs/ref-doc/EllipsoidGraphics.html | — | 官方 | `radii` + `material` + `outline`；协方差椭球用法见 community/43574 |
| Cesium PolylineTrailMaterialProperty（SuperMap3D 增强） | https://fangbaigis.cscec3b-iti.com/iserver/iClient/for3D/webgl/en/docs/Documentation/PolylineTrailMaterialProperty.html | — | 官方 | `trailLength` / `constantSpeed` 流动尾迹线 |
| **joshuanunn/really-simple-dispersion** | https://github.com/joshuanunn/really-simple-dispersion | 9 | 低活跃 | 浏览器内高斯扩散 + 等值线 plan/side elevation；demo: https://joshua.nu/really-simple-dispersion/example/ |
| joshuanunn/really-simple-dispersion-wasm | https://github.com/joshuanunn/really-simple-dispersion-wasm | 3 | 低活跃 | Rust→Wasm 版，性能对比参考 |
| CesiumChina/cesium-three-plugin | https://github.com/CesiumChina/cesium-three-plugin | — | 社区 | Cesium+Three.js 桥接（仅作 Three.js overlay 兜底时参考） |
| Donitzo/three.js-volume-renderer | https://github.com/Donitzo/three.js-volume-renderer | — | 社区 | Three.js raymarching 体绘制（仅作 Cesium 体绘制不够时的 overlay 参考） |
| MIT-SPARK/PoseUncertaintySets | https://github.com/MIT-SPARK/PoseUncertaintySets | — | 社区 | 椭球不确定性可视化参考（图像平面投影） |

> 活跃度判定：Stone-Soup v1.8 持续更新（2024+）；cesium-wind-layer 2024 年起活跃维护；3D-Wind-Field 2019 年后低活跃但星数高（参考价值高）；really-simple-dispersion 星数低但 demo 直观、算法范式清晰。Cesium/SuperMap 官方文档为权威源。

---

## 5. 对当前项目的落地建议

### 5.1 最小改动达成三维落图的路径（按优先级分阶段）

**阶段一：零工具链依赖的快速三维化（纯前端，1-2 天）**

不改后端、不依赖 iDesktopX，直接在 `SuperMapSceneViewer.vue` 的现有落图函数里升级：

1. **扩散浓度场**：`drawDiffusionOverlay` 里把当前的扁平 `addEllipseEntity` 替换为 `SuperMap3D.HeatMap`（方案 C）。`frame.cells` 直接喂 `heatMap.setData([{x:cell.x, y:cell.y, intensity:cell.concentration}])`。多帧播放用 `clock.onTick` 切帧。这是当前二维落图的直接三维感升级，零后端改动。

2. **溯源粒子群**：`drawParticleOverlay` 里把当前的扁平置信圈升级为两件事：
   - 新增 `PointPrimitiveCollection`（方案 I）渲染 12000 粒子云（若后端能下发每轮粒子坐标；当前若只下发 `estimatedSource` 和 `credibleRadius95m`，则只渲染最终态点云）。
   - 把 `addEllipseEntity`（二维圆）替换为 `Cesium.EllipsoidGraphics`（方案 H）的三维置信椭球，`radii` 用 `credibleRadius95m` 映射三轴。

3. **疏散路线动画**：`drawEvacuationOverlay` 里把 `addPolylineEntity` 的 material 换成 `SuperMap3D.PolylineTrailMaterialProperty`（方案 D），`constantSpeed` 设 5-10 m/s，路线立刻有流动光带。

4. **溯源估计点抬升**：保持现有 16m 抬高（`drawParticleOverlay` 已做），确保不被模型遮挡。

**阶段二：体绘制浓度场（依赖 iDesktopX，3-5 天）**

5. **iDesktopX 构建体元栅格**：把扩散算法的多帧浓度网格在 iDesktopX 里用"构建体元栅格"工具插值成三维体元栅格数据集，坐标系 CGCS2000 EPSG:4547（与现有园区模型同坐标系）。
6. **iServer 发布**：发布体元栅格数据集服务。
7. **前端 VoxelGridLayer3D 加载**：`new SuperMap3D.VoxelGridLayer3D({url})`，设 `VolumeRenderMode=VolumeRendering`（体绘制）或 `ContourValue`（等值面，如 100ppm 危险区封闭曲面），用 `addClipPlane` 加剖切面让评委看浓度场内部。
8. **等值面替代风险区**：当前 `drawDiffusionOverlay` 的风险区面（Polygon）可用 `contourValue` 等值面三维封闭曲面替代，更直观。

**阶段三：进阶（可选，7+ 天）**

9. **扩散烟团动画**：在泄漏源点加 `SuperMap3D.ParticleSystem`（方案 B），JSON 配置风向、寿命、颜色。
10. **风场背景**：引入 `cesium-wind-layer`（方案 Q）作风场粒子底图。
11. **溯源轨迹回放**：代表性粒子用 `PathGraphics`（方案 J）画迭代收敛轨迹拖尾。
12. **算法对齐**：参考 Stone-Soup（方案 O）的 `Plotter.plot_tracks(particle=True, uncertainty=True)` 接口，让后端粒子滤波输出标准化的协方差矩阵和分位数，前端椭球直接消费。

### 5.2 能复用现有 Cesium3DTileset 锚点的部分

**关键结论**：方案 A（VoxelGridLayer3D）、C（HeatMap）、I（PointPrimitiveCollection）、H（EllipsoidGraphics）、D（PolylineTrail）**全部复用现有锚点 A（113.569463, 34.76965）和 CGCS2000 EPSG:4547 坐标系**，无需引入新坐标系。

- 体元栅格发布走 iServer CGCS2000（与 `data-chemical_park_vectors_cgcs2000` 同坐标系），VoxelGridLayer3D 直接叠加在现有 3D Tiles 模型上（`Volume` 类明确"需要附加到模型上使用"）。
- HeatMap、PointPrimitiveCollection、EllipsoidGraphics 的坐标都用现有的 `mapPointToSceneCartesian` / `mapPointToGeo` 投影链路，与 `SuperMapSceneViewer.vue` 现有 `addEntity` 同一套坐标转换。
- `PolylineTrailMaterialProperty` 只是替换 `addPolylineEntity` 的 material，坐标链路不变。

### 5.3 红线与风险提示

1. **不夸大 VoxelGridLayer3D 成熟度**：体元栅格构建依赖 iDesktopX 工具链，若 iDesktopX 不可用或体元栅格构建失败，必须退回 HeatMap 过渡方案，不写"体绘制已完成"。
2. **ParticleSystem 版本坑**：SuperMap 11i(2023) 的 ParticleSystem 与原 Cesium 参数不兼容（`ask.supermap.com/134520` 已记录），落地前必须对照当前 iClient3D 版本验证 API。
3. **12000 粒子性能**：PointPrimitiveCollection 理论支持 10 万点，但每帧全量更新会卡，社区建议分帧摊销（每帧最多更新 5000 点）。溯源若要实时回放 36 轮迭代，需把粒子坐标预计算成时序，按时钟索引批量更新。
4. **三维坐标双轨制**（来自 `codex-fix-2026-07-18-3d-algorithm-alignment.md` F5）：dev 球面模式与 prod 本地 S3M 模式行为不同，任何三维落图改动必须在两个环境分别验证。
5. **算法坐标系错位未修复前**（F2）：iServer 路网在 D 点（HAUT 南门），三维模型在 A 点，差 7.4km。扩散/溯源算法的输入坐标若来自 iServer 路网，落图前必须确认坐标系已对齐到 A，否则三维叠加会飘。本报告的方案不涉及路网，但扩散源点 `sourceMapPoint` 和溯源 `estimatedSource.mapPoint` 的坐标系必须明确是 A 系。
6. **不引入 Three.js overlay 除非必要**：方案 L/M/N（Three.js）增加第二套渲染栈，与 SuperMap3D 兼容性需单独验证，仅在方案 A-F 的 Cesium/SuperMap 原生路径全都不够用时才考虑。当前需求（浓度场体绘制 + 12000 粒子云 + 置信椭球）原生方案完全覆盖，不建议引入。

### 5.4 推荐 Top2 速览

- **扩散 Top1**：SuperMap `VoxelGridLayer3D`（体绘制 + 等值面 + 剖切）—— 浓度场三维体积感、危险区封闭曲面、内部切片，一站搞定。过渡兜底：`HeatMap`。
- **溯源 Top1**：`PointPrimitiveCollection`（12000 粒子云）+ `EllipsoidGraphics`（三维置信椭球）—— 粒子群收敛动画 + 三轴不确定性椭球，替代当前扁平圆。算法参考：Stone-Soup。

---

## 附：关键 API 速查（落地时直接查）

### SuperMap3D 体绘制
```js
// 方案 A：体元栅格图层（iDesktopX 构建并发布 iServer 后加载）
const voxelLayer = new SuperMap3D.VoxelGridLayer3D({
  url: '<iServer 体元栅格服务 URL>',
  // VolumeRenderMode: SuperMap3D.VolumeRenderMode.VolumeRendering | .Slice | .ContourValue
  // contourValue: 100,           // 等值面强度值（如 100ppm 危险区封闭曲面）
  // sliceCoordinate: 0.5,        // 切片位置
  hypsometricSetting: { /* 分层设色：浓度色带 */ },
});
viewer.scene.layers.addVoxelGridLayer?.(voxelLayer);  // 具体挂载 API 以当前版本为准
voxelLayer.addClipPlane(...);  // 最多 6 个剖切面

// 方案 A 变体：Volume 类（附加到模型）
const volume = new SuperMap3D.Volume({
  url: '<iServer 体元栅格数据集服务 URL>',
  hypsometricSetting: { /* 分层设色 */ },
});
```

### SuperMap3D 热力图（过渡方案）
```js
const heatMap = new SuperMap3D.HeatMap({
  quality: SuperMap3D.Quality.HIGH,
  intensityRange: new SuperMap3D.Cartesian2(0.2, 0.8),
});
heatMap.setData(frame.cells.map(c => ({ x: c.x, y: c.y, intensity: c.concentration })));
scene.primitives.add(heatMap);
```

### SuperMap3D 粒子系统
```js
SuperMap3D.ParticleHelper.fromJsonUrl('particle-smoke.json', scene, /*useGPU*/ true)
  .then(particleSystem => { /* 绑定到泄漏源点 modelMatrix */ });
```

### Cesium 置信椭球
```js
viewer.entities.add({
  position: estimatedSourceCartesian,
  ellipsoid: {
    radii: new Cesium.Cartesian3(sigmaX, sigmaY, sigmaZ),  // 协方差特征分解
    material: Cesium.Color.fromCssColorString('#ffb020').withAlpha(0.18),
    outline: true,
    outlineColor: Cesium.Color.fromCssColorString('#ffb020').withAlpha(0.6),
  },
});
```

### Cesium 大批量粒子点云
```js
const collection = new Cesium.PointPrimitiveCollection();
scene.primitives.add(collection);
particles.forEach(p => {
  collection.add({
    position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.height),
    pixelSize: 2 + p.weight * 3,
    color: Cesium.Color.fromHsl(0.12 * (1 - p.weight), 0.9, 0.5 + 0.3 * p.weight),
  });
});
// 每轮迭代后批量更新 collection 位置
```

### SuperMap3D 流动尾迹线
```js
viewer.entities.add({
  polyline: {
    positions: pathCartesians,
    width: 4,
    material: new SuperMap3D.PolylineTrailMaterialProperty({
      color: SuperMap3D.Color.fromCssColorString('#52ffb8'),
      trailLength: 0.3,
      constantSpeed: 8.0,  // m/s
    }),
  },
});
```

> 以上代码片段为 API 用法示意，非可直接运行的代码；落地时必须对照当前 iClient3D 版本的 API 文档验证参数名（SuperMap3D 在不同版本间有 API 微调，尤其 ParticleSystem）。
