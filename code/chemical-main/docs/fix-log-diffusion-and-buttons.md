# 修复日志：副屏扩散算法可视化 + 按钮排版 + 实时天气

## 第一部分：算法服务启动 + 副屏浮动控制条（已完成）

### 根因
1. 算法 FastAPI 服务（localhost:8000）未运行
2. 副屏默认三维主屏模式下，`.embedded-controls` 被 `display:none` 隐藏
3. 副屏 z-index:5 低于右侧栏 z:8，且 360×240 小框装不下整套 UI

### 已完成改动
- 启动算法服务（`ALGORITHM_API_KEY=local-dev-algo-key-7e2a9c4f1b8d3e6a uv run uvicorn algorithm.api_server:app --port 8000`）
- `.env.development` 加 `ALGORITHM_API_KEY`，vite proxy 注入 `X-API-Key` header
- smart_map/index.vue：新增 `hideEmbeddedControls` prop、`diffusionStatus` computed、补充 `defineExpose`（clearResults/addSensor/diffusionStatus/selectedEmbeddedSourceId）
- screen/index.vue：新增顶层浮动控制条（`SmartMapEmbeddedControls`），`SmartMapWorkspace` 传 `hide-embedded-controls`
- CSS：`.screen-route-navigation` z-index 5→9，删除 `.embedded-controls` 隐藏，新增 `.screen-algorithm-bar` 贴底边横排样式，隐藏副屏冗余元素（coord-display/scale-bar），修正 CSS `//` 注释为 `/* */`

## 第二部分：实时天气接入（已完成）

### 根因
1. 后端 `monitoring/overview` 返回 `environment.available=false, source="not_configured"`（后端 QWEATHER_API_KEY 未配置）
2. 前端 `loadWeatherOverview` 拿到 200 直接 return，没降级到和风直连
3. vite proxy `/qweather-api` 的 `secure: true` 导致 SSL 验证失败，proxy 转发和风请求 `net::ERR_ABORTED`
4. `diffusionForm` 的 windSpeed/windDirection 等是静态默认值（3.6m/s, 25°），没和实时天气同步

### 已完成改动
- smart_map/index.vue：新增 `applyRealtimeWeather(weather)` 函数，写入 `diffusionForm.windSpeed/windDirection/ambientTemperature/humidity`（带边界钳制），并在 `defineExpose` 暴露
- screen/index.vue：新增 `syncRealtimeWeatherToDiffusion()`，在 `loadWeatherOverview` 成功后调用；修改 `loadWeatherOverview` 逻辑——后端 `available=false` 时降级到 `loadQWeatherOverview`（和风直连）
- vite.config.ts：qweather proxy `secure: true` → `false`，修复 SSL 转发失败

### 验证结果
- 类型检查 `vue-tsc --noEmit` 通过 ✓
- 浏览器实测：天气条显示"实况 东南风 12.0m/s 28.0℃ 78%RH"（和风 API 返回一致）✓
- 点扩散模拟 → `扩散帧 12/96` 正常播放，使用实时天气参数 ✓

## 待处理（用户反馈）
1. ~~二维场景模糊~~ → 已修复：改用 `tiledMapLayer`（不传 prjCoordSys），多级 LOD 瓦片，放大不模糊
2. ~~浮动控制条被遮挡~~ → 已修复：从贴底边改到贴顶部标题栏下方（top:50px）
3. iPortal 三维 SDK 资源加载 ETIMEDOUT（8.130.175.232:18190 远端连不上）—— 网络问题，非代码问题

## 二维地图高清方案最终结论

### 根因
iServer 地图服务 `map-chemical_park_vectors_cgcs2000` 自身按**米制平面坐标**（PCS_NON_EARTH, epsgCode:-1000）发布，但前端 `.env.development` 配 `VITE_SUPERMAP_2D_EPSG=4547`，导致 `tiledMapLayer` 传 `prjCoordSys={epsgCode:4547}` 触发 iServer 动态坐标系转换，iServer 不支持返回 400。

### 修复
- `SuperMap2DLayer.vue` 的 `createBaseLayer` 改用 `tiledMapLayer(mapUrl, { cacheEnabled, noWrap, transparent:false })`
- **不传 prjCoordSys**，让 iServer 按自身坐标系（米制平面）返回瓦片
- 前端 leaflet 仍用 `nonEarthCRS`（米制平面）渲染，坐标系一致
- 多级 scale 瓦片均返回 200（0.0001/0.00005/0.00002 均可用）

### 验证
- `curl tileImage.png?...&scale=0.0001` → 200, 5211 bytes
- `curl tileImage.png?...&scale=0.00005` → 200, 2762 bytes
- `curl tileImage.png?...&scale=0.00002` → 200, 4123 bytes
- 不同 scale 返回不同瓦片 → 多级 LOD 正常

### 教程
见 `docs/超图切片DEM发布教程.md`（DEM 栅格瓦片 / 三维模型瓦片切片发布流程）

## 改动文件清单
- `code/chemical-main/frontend/.env.development`（加 ALGORITHM_API_KEY）
- `code/chemical-main/frontend/vite.config.ts`（qweather proxy secure: false）
- `code/chemical-main/frontend/src/views/screen/index.vue`（浮动控制条、天气同步、CSS）
- `code/chemical-main/frontend/src/views/smart_map/index.vue`（hideEmbeddedControls prop、applyRealtimeWeather、defineExpose）
