# 交接给 Codex —— 完成情况、待办与优化（重点：iServer 三维模型前端加载不出来）

> 项目：超图杯化工园区应急态势（code/chemical-main）
> 上一轮工作：数据发布 + 客户端空间查询 + 前端集成（模型/传感器/点击查询）
> 本文自包含，可直接交给 Codex 续作。

---

## 一、项目当前架构（必读）

两条线：

| 线 | 数据 | 服务 | 前端 |
|---|---|---|---|
| 三维展示 | huangong.scp（S3M，EPSG:4547，锚点 113.535771°E,34.818673°N） | iServer REST-三维服务 `3D-local3DCache-huangong` | SuperMapSceneViewer.vue（iClient3D WebGL） |
| 空间查询 | DevicePoint_2D.geojson(1072 点) + Park_S3MObjectFootprint_2D.geojson(10286 矩形面) | **客户端 GeoJSON 查询**（iServer 查询引擎坏，见下） | geoQueryUtils.ts / clientSpatialQuery.ts |

环境：
- 本地 iServer 2026 beta：`http://localhost:8090`（build 25527，UGO 12.1.0，TRIAL 云许可通过）
- 后端 Spring Boot：`http://localhost:8081`（MySQL `chemical` 库，root/123456）
- 前端 Vite dev：`http://localhost:5173`（5173 被占会切 5174）
- Vite 代理：`/api`→8081，`/supermap-iserver`→8090，`/supermap3d-remote`→8.130.175.232:18190（**远程已挂**），`/supermap3d`→本地 `node_modules/@supermap/iclient3d-webgl/Cesium`

---

## 二、已完成的工作

### A. 数据发布与空间查询（publish_package + code/chemical-main）

1. **iServer 服务已发布**（`http://localhost:8090`）：
   - `3D-local3DCache-huangong`（REST-三维，status OK，scenes.json 200）
   - `data-chemicalplant`（REST-数据）、`spatialanalyst-chemicalplant`（REST-空间分析）
2. **数据集已复制进主 UDBX** `化工园区项目-三维配准.udbx`：
   - `DevicePoint_2D_P`：POINT，1072 条，CRS=EPSG:4547，坐标正确（如 458026.711,3854908.125），40 字段全在（SensorID/ModelName/InstallHeight/Wgs84Lon/Lat/View*/Pov*/MonitorAzimuth/AlarmLow/High）
   - `Park_S3MObjectFootprint_2D_R`：REGION，10286 条，全部轴对齐矩形，属性 name/minHeight/maxHeight/s3mLeft/Right/Bottom/Top
3. **查明 iServer 2026 beta featureResults 查询引擎缺陷**：
   - 对任何查询（SQL/范围/ID/空间）都返回 `[]`；连原生 2D 小数据集"控制点"(4 条)也查不出
   - 许可正常（TRIAL，检查通过），不是数据/坐标系/2D-3D 问题
   - 日志：`getURLParameters` 把 `datasetNames=["..."]`（JSON 数组）当 JSONObject 解析失败；用 JSON body（解析正常）仍返回空 ⇒ beta 构建查询功能缺陷
   - 详见 `publish_package/release_notes/iServer2026beta查询故障与客户端查询方案.md`
4. **客户端空间查询方案**（绕开 iServer 查询）：
   - `publish_package/frontend/src/utils/geoQueryUtils.ts`：纯函数（按 ModelName/bbox/缓冲区/邻近 查点与面），Node 单测 **16/16 通过**
   - `clientSpatialQuery.ts`：浏览器层 fetch+缓存 GeoJSON + WGS84↔EPSG:4547 仿射转换
   - `devicePointQuery.ts` / `spatialQuery.ts`：改为委托，保留原 API
   - 数据：`frontend/public/data/DevicePoint_2D.geojson`(1.2M) + `Park_S3MObjectFootprint_2D.geojson`(5.1M)
   - 以上四个文件已镜像到 `code/chemical-main/frontend/src/utils/`，GeoJSON 已复制到 `code/chemical-main/frontend/public/data/`

### B. code/chemical-main 前端集成

1. **`.env.development` 修正**（`code/chemical-main/frontend/.env.development`）：
   - `VITE_SUPERMAP_3D_USE_3DTILES = false`（弃用旧 3D Tiles `tileset_zhengzhou_57083.json`，改用 huangong S3M）
   - `VITE_SUPERMAP_3D_LAYER_POSITION = 113.535771,34.818673,108`（原 113.6189 是手算错值，偏东 7.5km；pyproj 精确反算）
   - `VITE_SUPERMAP_3D_DEFAULT_CAMERA = 113.535771,34.818673,2600,0,-75,0`
   - `VITE_SUPERMAP_3D_SCENE_URL = /iserver/services/3D-local3DCache-huangong/rest/realspace`
   - `VITE_SUPERMAP_3D_LAYER_CONFIGS = /iserver/services/3D-local3DCache-huangong/rest/realspace/datas/huangong/config`
   - `VITE_SUPERMAP3D_SCRIPT_URL = /supermap3d/Cesium.js`（原远程 8.130.175.232:18190 SuperMap3D.js 返回 500，改本地）
   - `VITE_SUPERMAP3D_STYLE_URL = /supermap3d/Widgets/widgets.css`
2. **`SuperMapSceneViewer.vue`**（8841 行，加法式改动，未动既有逻辑）：
   - 新增 prop `showDevicePoints2026?: boolean`（默认 false）
   - 新增 `devicePointEntities` ref + `clearDevicePointLayer()` + `renderDevicePointLayer()`：地理坐标场景下加载 DevicePoint_2D.geojson，用 `Cartesian3.fromDegrees(Wgs84Lon, Wgs84Lat, InstallHeight)` 放 1072 个 point 实体（按 Color 属性着色，disableDepthTestDistance=Infinity 穿模可见）
   - 新增 watch：`[showDevicePoints2026, sceneState, geographicSceneMode]` → 场景就绪时渲染
   - `onBeforeUnmount` 加 `clearDevicePointLayer()`
3. **`views/screen/index.vue`**（大屏视图）：
   - `<SuperMapSceneViewer>` 加 `:show-device-points-2026="true"` 和 `@scene-object-pick="handleSceneObjectPick"`
   - 新增 `handleSceneObjectPick(payload)`：取 `selectedObjectName`(=ModelName) → `queryFootprintsByModelName`（建筑高度/占地）+ `queryDevicePointsByModelName`（传感器列表）→ `pickedBuilding` 状态
   - 模板新增左上浮动面板：建筑信息 + 传感器明细（SensorID/型号/观测属性/装高/覆盖半径/报警阈值）+ 关闭按钮 + scoped 样式
4. **验证**：
   - `vue-tsc --noEmit`：我的文件全清（viewer 既有 13 个 unused-vars 非我引入）
   - `eslint`：我的文件全清
   - Node 单测：geoQueryUtils 16/16
   - Vite 转换阶段：6001 模块 ✓（我的代码编译+导入无误）
   - **生产构建 render 阶段未完成**（exit 127/4，6001 模块 Rollup 太慢/失败，属既有项目问题，非本次改动引入）

### C. 前后端启动

- 后端：`cd code/chemical-main/backend && mvn spring-boot:run` → 8081（已验证 Started，正常响应 CarController/SensorService 等）
- 前端：`cd code/chemical-main/frontend && npx vite --host` → 5173/5174
- 冒烟测：前端首页 200、`/data/DevicePoint_2D.geojson` 200、`/supermap-iserver/.../scenes.json` 200（iServer 三维服务可达）、本地 `/supermap3d/Cesium.js` 200（7.4MB）
- **远程 `/supermap3d-remote/.../SuperMap3D.js` → HTTP 500**（8.130.175.232:18190 iPortal 挂了）——已切本地 SDK
- 注意：上一会话结束后台进程被回收，重启命令见末尾

---

## 三、未完成 / 待解决

### 【重点】1. iServer 三维模型前端加载不出来

**症状**：前端 3D 场景里看不到 huangong 模型（用户反馈"还是加载不出来"）。iServer 侧服务正常（scenes.json 200），问题在前端加载/渲染。

**当前相关配置**（`.env.development`）：
```
VITE_SUPERMAP_3D_USE_3DTILES = false
VITE_SUPERMAP_3D_SCENE_URL = /iserver/services/3D-local3DCache-huangong/rest/realspace
VITE_SUPERMAP_3D_LAYER_CONFIGS = /iserver/services/3D-local3DCache-huangong/rest/realspace/datas/huangong/config
VITE_SUPERMAP_3D_LAYER_POSITION = 113.535771,34.818673,108
VITE_SUPERMAP_3D_APPLY_LAYER_POSITION = true
VITE_SUPERMAP3D_SCRIPT_URL = /supermap3d/Cesium.js
```

**疑似原因**（需用浏览器控制台+Network 确认）：

1. **SDK 切换导致的 S3M 加载 API 不兼容**（最可能）：
   - 原前端为 iPortal `SuperMap3D.js`（设 `window.SuperMap3D`）编写；现切到本地 `@supermap/iclient3d-webgl` v11.1.4 的 `Cesium.js`（UMD 设 `window.Cesium`，含 `S3MTilesLayer`）。
   - `SuperMapSceneViewer.vue` 的 `getRuntime()`（约 7452 行）回退查 `window.Cesium`，理论上兼容。
   - **但 S3M 图层加载函数有能力守卫**：约 **2039 行** `throw new Error('当前 SuperMap3D SDK 不支持 S3M config 图层加载')` —— 若本地 SDK 未暴露该函数检测的 S3M config 加载 API，会直接抛错不加载。
   - 需检查该函数用的是什么 API（`runtime.Cesium3DTileset`？`scene.layers.add_S3M`？`S3MTilesLayer`？`openSceneURL`？），本地 `window.Cesium` 是否具备等价 API。

2. **投影坐标系 S3M 的位置覆盖**：
   - huangong.scp 的 crs=epsg:4547（投影米），iClient3D 加载投影 S3M 需用 `LAYER_POSITION`(113.535771) 覆盖锚点，否则会把投影米当经纬度→"飞到欧洲"。
   - 需确认 `shouldApplyLayerPosition`/`s3mLayerPosition`（约 1215-1221 行）在 S3M 加载时确实把该位置应用到图层（`layer.position = Cartesian3.fromDegrees(...)` 或类似）。

3. **远程 iPortal 依赖**：
   - 8.130.175.232:18190 返回 500。若 viewer 某处仍硬依赖远程 SDK/资源，会失败。已把 SCRIPT_URL/STYLE_URL 切本地，但需排查是否还有其它远程引用（地形、影像、3D Tiles tileset 等）。

**给 Codex 的诊断步骤**：
1. 启动：`cd code/chemical-main/backend && mvn spring-boot:run`（后台）；`cd code/chemical-main/frontend && npx vite --host`（后台）。
2. 浏览器开 `http://localhost:5173`（或 5174），打开**控制台 + Network**。
3. 确认 SDK 是否加载：控制台 `window.Cesium` / `window.SuperMap3D` 是否存在，有无 `Viewer`。
4. 看 Network：`/supermap3d/Cesium.js` 是否 200；`/iserver/services/3D-local3DCache-huangong/rest/realspace/datas/huangong/config` 是否 200；S3M 瓦片（Tile_*）是否请求且 200。
5. 看控制台报错：是否命中 `SuperMapSceneViewer.vue:2039` 的"不支持 S3M config 图层加载"，或 `runtime.Cartesian3` 之类 undefined。
6. 读 `SuperMapSceneViewer.vue` 的 S3M 加载函数（搜 `layerConfigs`、`addS3M`、`S3MTilesLayer`、`S3M`、`focusS3MLayer`、约 2039-2200 行）与 `getRuntime`（7452 行）、`shouldUseThreeDTiles`/`geographicSceneMode`（1201-1225 行）。

**修复方向（按可能性排序）**：
- **A. 适配本地 SDK 的 S3M 加载 API**：用 `@supermap/iclient3d-webgl` v11.1.4 的 `Cesium.S3MTilesLayer` 或 `viewer.scene.layers.add_S3M(...)`（看本地 SDK 的实际 API）替换原 iPortal 写法；调整 2039 行的能力守卫。
- **B. 修复投影 S3M 位置覆盖**：确保 `LAYER_POSITION=113.535771,34.818673,108` 应用到 S3M 图层锚点（`layer.position`/`layer.setLocation`）。
- **C. 若本地 SDK 确不兼容**：恢复远程 iPortal（把 8.130.175.232:18190 修好/换可用地址），或换用与 iPortal `SuperMap3D.js` 等价的本地入口（检查 `@supermap/iclient3d-webgl` 是否有 SuperMap3D 命名的入口文件）。
- **D. 兜底**：若 S3M 实在走不通，可切回 3D Tiles（`USE_3DTILES=true`）并用配准后的 tileset，但需有配准好的 3D Tiles 数据。

**验收**：浏览器里 huangong 模型落在郑州（113.535771°E 附近），与 1072 个传感器点对齐，相机默认视角能看到园区。

### 2. iServer 2026 beta 查询引擎缺陷（已绕开，待根治）
- featureResults 对任何查询返回空（TRIAL 许可正常，beta 构建问题）。
- 当前用客户端 GeoJSON 查询绕开。若竞赛要求**服务端查询**：装**正式版 iServer**（2025 release 或 2026 正式版），其 featureResults 正常；或用远程 `8.130.175.232:18090` 的 `data-chemical_park_vectors_cgcs2000`（本次因网络不可达未验证）。

### 3. 110 传感器 vs 1072 传感器
- screen 大屏视图 `:show-monitoring-sensors="false"`，显示的是新加的 1072 DevicePoints（配准版）。
- 既有 `REAL_SENSOR_LAYOUT`(110 点，锚点 A=113.569463,34.76965) 与 huangong 模型(113.535771)**不同坐标系**，不应同时显示（会错位）。若需在 smart_map 视图也显示 1072 点，给 `ParkScene3D.vue` 加 `:show-device-points-2026="true"`。

### 4. 生产构建未完成
- `npm run build` 转换阶段 ✓ 但 render 阶段超时/exit 127。6001 模块 Rollup 生产打包慢/失败，属既有项目问题。需排查：内存（`NODE_OPTIONS=--max-old-space-size=8192`）、循环依赖、Rollup 配置。`vite.config.ts` 已 `build.minify=false`。

### 5. WGS84↔EPSG:4547 精度
- `clientSpatialQuery.ts` 用 SCP 锚点仿射（113.535771,34.818673 ↔ 457527.93,3854574.90），园区 ~2km 内米级精度。需更高精度装 `proj4` + EPSG:4547 定义替换 `wgs84ToEPSG4547`。

---

## 四、优化建议

1. **1072 设备点性能**：低缩放时密集，可启用 Cesium `EntityCluster` 聚合；当前仅 point 无 label，可加 hover/选中显示 label。
2. **10286 足迹面查询**：`clientSpatialQuery` 一次性加载 5.1MB；可懒加载（仅空间查询时）或加 `rbush` 空间索引加速 bbox 查询。
3. **iServer**：换正式版（非 beta）一举解决查询引擎 + 稳定性。
4. **SDK 依赖**：pin 稳定版 `@supermap/iclient3d-webgl`；摆脱远程 iPortal 单点。
5. **坐标系一致性**：统一模型/传感器/2D 地图锚点为 113.535771,34.818673（pyproj 精确），清理旧的 113.665/113.569463/113.6189 锚点常量（`supermapGeoreference.js` 的 `ZHENGZHOU_STATION_57083`、锚点 A）。

---

## 五、给 Codex 的行动清单

**第一优先：让三维模型加载出来**
1. 按上面"诊断步骤"启动并开控制台/Network。
2. 定位 `SuperMapSceneViewer.vue` S3M 加载函数（约 2039 行起）+ `getRuntime`(7452) + 场景模式判定(1201-1225)。
3. 确认本地 `@supermap/iclient3d-webgl` v11.1.4 的 `Cesium.js` 暴露的 S3M 加载 API，适配 viewer。
4. 确认 `LAYER_POSITION=113.535771,34.818673,108` 应用到投影 S3M 图层。
5. 验收：模型落郑州 + 与 1072 传感器点对齐。

**第二优先：确认点击建筑查询**
- 模型出来后，点建筑/罐，左上面板应显示建筑信息+传感器列表（走 `handleSceneObjectPick`→`clientSpatialQuery`）。若 pick 不返回 ModelName，检查 `SuperMapScenePickEventPayload`（`src/types/supermap-scene-events.ts`）的 `selectedObjectName` 在 S3M 拾取时是否被正确填充（viewer 拾取逻辑约 6814/7172 行 emit 处）。

**第三优先**：生产构建、iServer 正式版、性能优化。

---

## 六、关键文件/路径/命令

```
前端：code/chemical-main/frontend/
  .env.development                       # 三维/SDK/代理配置（已改）
  src/components/SuperMapSceneViewer.vue # 8841行 3D viewer（加了 device-point 图层）
  src/views/screen/index.vue             # 大屏视图（加了 pick 处理+信息面板）
  src/utils/geoQueryUtils.ts             # 纯函数空间查询（16/16 测试）
  src/utils/clientSpatialQuery.ts        # 浏览器层查询 + WGS84↔4547
  src/utils/devicePointQuery.ts          # 委托客户端查询
  src/utils/spatialQuery.ts              # 委托客户端查询
  src/utils/test_geoQuery.ts             # Node 单测（node --experimental-strip-types 运行）
  public/data/DevicePoint_2D.geojson     # 1072 传感器点
  public/data/Park_S3MObjectFootprint_2D.geojson  # 10286 模型足迹面
  node_modules/@supermap/iclient3d-webgl/Cesium/Cesium.js  # 本地 iClient3D SDK（v11.1.4）

后端：code/chemical-main/backend/   (mvn spring-boot:run, 端口8081)

iServer：http://localhost:8090
  服务 3D-local3DCache-huangong（三维，OK）
  服务 data-chemicalplant（数据，featureResults 查询坏）
  安装：D:\BaiduNetdiskDownload\supermap-iserver-2026-beta-windows-x64-deploy
  日志：...\logs\iserver.log

数据源：G:\竞赛\超图杯\化工园区项目-三维配准.udbx（含 DevicePoint_2D_P / Park_S3MObjectFootprint_2D_R / 配准后模型_4547）
SCP：G:\竞赛\超图杯\三维瓦片数据_4547\huangong\huangong.scp（crs=epsg:4547, position=457527.93,3854574.90）

启动命令：
  后端：cd code/chemical-main/backend && mvn spring-boot:run
  前端：cd code/chemical-main/frontend && npx vite --host
  测试：cd code/chemical-main/frontend/src/utils && node --experimental-strip-types test_geoQuery.ts
  类型：cd code/chemical-main/frontend && npx vue-tsc --noEmit --skipLibCheck
```

## 七、重要结论速查

- iServer 三维服务本身 OK，模型加载不出来是**前端 SDK/S3M API/位置覆盖**问题，重点查 `SuperMapSceneViewer.vue` S3M 加载函数与本地 `@supermap/iclient3d-webgl` 的兼容性。
- iServer 2026 beta 的 featureResults 查询**不可用**（beta 缺陷），已用客户端 GeoJSON 查询绕开，**勿再纠结服务端查询**除非换正式版 iServer。
- 模型正确锚点 = **113.535771°E, 34.818673°N**（pyproj 从 SCP position 精确反算）；旧值 113.6189/113.569463/113.665 都是错的或旧锚点。
- 远程 8.130.175.232:18190 iPortal 已挂（500），SDK 已切本地。
