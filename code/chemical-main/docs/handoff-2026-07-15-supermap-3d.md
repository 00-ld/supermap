# 2026-07-15 SuperMap 三维与算法接入交接

更新时间：2026-07-15 10:14

## 2026-07-16 续做记录

本日已恢复：

- 本地算法服务 `127.0.0.1:8000` 已恢复，健康接口返回 `chemical-algorithm 3.0.0`。
- 本地前端 `127.0.0.1:5174/#/screen` 已恢复。
- `/screen` 初始三维画面已复测：真实厂房、道路、设备模型、监控点可见，不是绿屏、黑屏或空场景。

本日完成：

- `openScene()` 的旧 Realspace 等待时间保留为 30 秒，避免过早切到不稳定的 S3M config 兜底。
- 疏散演示起点调整为中南反应装置区，出口集合限定为东侧/南侧入口，用于保证报告截图可读。算法本体未改，仍由 D* Lite 在给定出口集合中排序。
- 疏散路线增加三层表达：
  - iClient3D/Cesium 实体：路线节点、路线中心、候选线/走廊。
  - 屏幕空间疏散路线引导层：根据算法返回路径点生成可读的路线线、节点、起点/出口标签。
  - 状态面板证据：展示路径点数量、出口名称、耗时和 requestId。
- 最终截图已保存：
  - `G:\竞赛\超图杯\报告素材\三维场景算法验收\screen-3d-evacuation-route-overlay-2026-07-16.png`

本日验证：

- `npm run typecheck:strict` 通过。
- 扩散模拟可落图，峰值约 `58.97 ppm`。
- 疏散规划可落图，当前演示返回 `9 个路径点 / 东侧道路入口`。
- 浏览器控制台本轮 `/screen` 三维算法复测没有应用级 error/warn。

本日诚实未完成：

- 远端 iServer `8.130.175.232:18090` 当前本机网络请求多次超时，无法继续核验远端 Data/Network/3D 服务状态。
- `3D-chemical_park_cgcs2000/rest/realspace` 仍不能写成完成；未完成 CGCS2000 三维 Realspace 发布。
- 疏散路线屏幕空间引导层是临时演示增强，用于旧 EPSG:0 三维缓存截图可读；它不是最终 CGCS2000 三维实体路线成果。
- 后续仍要在 iDesktopX 重定位 S3M/SCP 并发布真正的 CGCS2000 Realspace，之后再把屏幕空间引导层降级为兜底或移除。

## 当前可运行状态

- 前端入口：`http://127.0.0.1:5174/#/screen`
- 算法服务：`http://127.0.0.1:8000/api/health`
- 远端 iServer：`http://8.130.175.232:18090/iserver`
- 远端 iPortal：`http://8.130.175.232:18190/iportal`

已验证：

- 算法服务返回 `chemical-algorithm 3.0.0`，不是其他占用 8000 的服务。
- 前端 `/screen` 可打开。
- 远端二维 Data、Map、Network Analysis 服务可访问。
- 旧三维 Realspace `3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace` 可访问并能显示真实厂房、道路、设备模型。
- `3D-chemical_park_cgcs2000/rest/realspace` 仍是 404，不能写成已发布完成。

## 今天完成的代码工作

修改文件：

- `frontend/.env.development`
- `frontend/src/components/SuperMapSceneViewer.vue`
- `frontend/src/data/supermapCupScenario.ts`
- `frontend/src/types/supermap-scene-events.ts`

核心变化：

- `/screen` 保持使用远端 iServer `18090`，没有改成本地 iServer。
- 算法服务固定指向 `http://localhost:8000`。
- 三维监控点已经在 iClient3D 场景里渲染，并显示：
  - EPSG:4547 CGCS2000 投影坐标
  - EPSG:4490 经纬度备案
  - 安装高度
- 三维点击监控点时，事件 payload 带：
  - `selectedObjectId`
  - `projectedPoint.easting/northing/epsg=4547`
  - `heightMeters`
  - `source=supermap-iclient3d-monitoring-sensor`
- 扩散、粒子溯源、疏散规划按钮都能调用算法服务并返回结果。
- 粒子溯源当前只展示最终估计源点和置信半径，不展示 KDE 过程。这符合之前约束：KDE 未可靠完成时，不展示粒子滤波过程。
- 疏散默认起点从东南仓储区改成西南储罐与泵区，更符合高危区疏散演示。

## 今天发现并处理的问题

### 1. 三维绿屏/空场景

当前稳定方案：

- 保持 `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false`
- 先使用旧 `EPSG:0` S3M 原生缓存显示真实模型
- 业务坐标、二维服务、算法 payload 仍走 CGCS2000/EPSG:4547

诚实口径：

- 这只是临时演示基线。
- 真实发布目标仍是 iDesktopX 重定位 S3M/SCP 后发布 `3D-chemical_park_cgcs2000/rest/realspace`。
- 没发布成功前，不能说三维已经真实落到球面 CGCS2000。

### 2. S3M config 兜底导致黑底/模型不完整

复测时发现：

- 旧 Realspace 偶尔超过 8 秒才返回。
- 前端过早切到 `addS3MTilesLayerByScp` config 兜底后，画面变黑，只剩标记点。
- 这种截图不能用于报告。

已改：

- `openScene()` 的 Realspace 等待时间从 8 秒提高到 30 秒，减少误切到不稳定 config 兜底。

明天需要复测：

- 刷新 `/screen` 后是否稳定走 Realspace，而不是黑底 config。

### 3. 疏散线不明显

已尝试：

- 加粗 polyline。
- 增加底色线。
- 抬高到屋顶以上。
- 增加路线节点和箭头点带。

当前结论：

- 算法返回和页面状态是成功的。
- 点实体稳定显示。
- polyline 在当前 EPSG:0 本地 S3M 场景里绘制不稳定或被场景深度影响，截图中仍不明显。

明天优先处理：

- 复测箭头点带是否可见。
- 如果仍不可见，改为只用 billboard/point 组成连续路线点，不再依赖 polyline。
- 也可以增加“定位到疏散路线”按钮，把相机移动到路径上方，避免被右侧面板和厂房遮挡。

## 远端 SuperMap 服务状态

已通：

- `data-chemical_park_vectors_cgcs2000/rest`
- `map-chemical_park_vectors_cgcs2000/rest`
- `transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest`
- `3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace`

未完成：

- `3D-chemical_park_cgcs2000/rest/realspace`：404。

发布阻塞原因：

- 远端 iServer 快速发布三维切片缓存时，需要服务器可见的 `.scp/.sct/.sci3d`。
- 本地 `G:\...` 里的 SCP 不能直接被远端 iServer 读取。
- 当前没有找到已经重定位到 CGCS2000 的新 S3M/SCP 缓存。
- 不能把旧 EPSG:0 缓存冒充为 CGCS2000 服务发布。

## 明天第一优先级清单

1. 恢复服务
   - 确认 8000 是 `chemical-algorithm 3.0.0`。
   - 确认 5174 前端可打开。
   - 确认远端 iServer 18090 可访问。

2. 恢复 `/screen` 稳定三维模型
   - 打开 `http://127.0.0.1:5174/#/screen`
   - 确认不是黑底、不是绿屏。
   - 确认真实厂房、道路、设备模型可见。
   - 如果又走到 S3M config 黑底，优先修 `openScene()`，不要继续做算法截图。

3. 复测算法落图
   - 运行扩散：必须能看到风险云团/源点。
   - 粒子溯源：必须能看到估计源点/置信范围。
   - 疏散规划：必须能看到路线点带或箭头点带。

4. 修疏散路线可视化
   - 若 polyline 仍不可见，彻底改为连续 billboard/point 路径点。
   - 增加路线截图专用相机定位。

5. 继续三维 CGCS2000 发布
   - 不在本地 iServer 发布最终服务。
   - 目标仍是远端 `18090`。
   - 需要先拿到或生成 CGCS2000 重定位后的 S3M/SCP/SCT/SCI3D，并放到远端服务器可读路径。
   - 发布成功后再把前端 `.env.development` 切到 `3D-chemical_park_cgcs2000/rest/realspace`。

## 明天服务恢复参考

算法服务 8000：

```powershell
$root='G:\竞赛\超图杯\code\chemical-main'
$py=Join-Path $root '.venv\Scripts\python.exe'
$out=Join-Path $root 'logs\codex-algorithm-8000.out.log'
$err=Join-Path $root 'logs\codex-algorithm-8000.err.log'
$listeners = netstat -ano | Select-String ':8000\s+.*LISTENING' | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
foreach ($pidText in $listeners) { if ($pidText -match '^\d+$') { Stop-Process -Id ([int]$pidText) -Force -ErrorAction SilentlyContinue } }
$env:ALGORITHM_REQUIRE_AUTH='false'
$env:PYTHONPATH=$root
Start-Process -FilePath $py -ArgumentList @('-m','uvicorn','algorithm.api_server:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err
```

前端 5174：

```powershell
$root='G:\竞赛\超图杯\code\chemical-main\frontend'
$out='G:\竞赛\超图杯\code\chemical-main\logs\codex-frontend-5174.out.log'
$err='G:\竞赛\超图杯\code\chemical-main\logs\codex-frontend-5174.err.log'
Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--host','127.0.0.1','--port','5174') -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err
```

验证：

```powershell
Invoke-WebRequest http://127.0.0.1:8000/api/health -UseBasicParsing
Invoke-WebRequest http://127.0.0.1:5174/#/screen -UseBasicParsing
npm run typecheck:strict
```

## 不能夸大的地方

- 不能说三维 CGCS2000 Realspace 已发布成功。
- 不能说三维模型已经真实落到河南工业大学莲花街校区球面坐标。
- 不能说疏散路线三维可视化已经高质量验收完成，当前还需要明天复测箭头点带。
- 不能说 KDE 概率地形完成，当前只是最终估计源点和置信范围。
- 不能说旧 EPSG:0 缓存是最终比赛坐标成果。
