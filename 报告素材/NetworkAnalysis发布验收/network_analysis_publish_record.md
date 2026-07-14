# SuperMap Transportation Analyst 发布记录

时间：2026-07-14

## 已完成

- 已在副本 UDBX 中构建网络数据集：
  - `Park_RoadNetwork_N`
  - `Park_RoadNetwork_Auto_N`
- 已重新生成 SXWU 工作空间：
  - `chemical_park_vectors_cgcs2000_network_generated.sxwu`
  - 工作空间内 UDBX 使用相对路径 `./chemical_park_vectors_cgcs2000_network.udbx`
- 已上传到 iServer：
  - `chemical_park_vectors_cgcs2000_network_sxwu_publish0`
- 已发布可访问的 Transportation Analyst 服务：
  - `http://8.130.175.232:18090/iserver/services/transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest`
- 已配置前端：
  - `VITE_SUPERMAP_NETWORK_ANALYSIS_URL=/supermap-iserver/iserver/services/transportationAnalyst-chemical_park_vectors_cgcs2000_network-4/rest/networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000`

## 验证结果

- REST 根目录返回 200，包含 `networkanalyst` 和 `search`。
- `networkanalyst/Park_RoadNetwork_Auto_N@chemical_park_vectors_cgcs2000.rjson` 返回：
  - `epsgCode=4547`
  - `name=China_2000_3_DEGREE_GK_Zone_38N`
  - `weightNames=["length"]`
- `path.rjson?nodes=[1,2]&parameter={"weightName":"length"}` 返回 `pathList`。
- CGCS2000 点路径验证通过：
  - 起点：`458970.343,3855563.172`
  - 终点：`457990.343,3855561.172`
  - 返回 `pathGuideItems`，包含 `LINE` 几何，可解析为前端路径点。
- 前端严格类型检查通过：
  - `npm run typecheck:strict`
- 前端运行时验证通过：
  - `/smart-map` 正确入口为 `http://127.0.0.1:5174/#/smart-map`。
  - 页面显示 `SuperMap iClient2D 已加载`、`建筑单体校核图_CGCS2000`、`EPSG:4547`。
  - 浏览器请求已读取 `Park_RoadNetworkEdge_L`、`Park_EntrancePoint_P`、`Park_BuildingFootprint_R` 和地图 `image.png`。
  - 选中建筑后执行“扩散模拟 -> 当前建筑路径”，前端优先调用 `transportationAnalyst/.../path.rjson`，4 个园区出口请求均返回 200。
  - 页面结果显示 `规划成功`、`规划内核=SuperMap iServer Transportation Analyst`、推荐路线长度约 `204.8 m`。

## 前端修复记录

- 修复 Vite 开发代理：`/api` 代理不再把浏览器 `Origin` 透传给 Spring 后端，避免本地演示登录接口返回 `Invalid CORS request`。
- 修复 SuperMap 网络分析调用：
  - 建筑中心点和出口点在请求 `path.rjson` 前先吸附到最近道路中心线。
  - 多出口请求改为 `Promise.allSettled`，单个出口失败不再导致整体直接降级。
  - 修复后单建筑疏散路径可稳定走 SuperMap Transportation Analyst。

## 严格限制

- 当前正式可访问服务使用 `Park_RoadNetwork_Auto_N`、`nodeIDField=SmID`、`autoCheckNetwork=false`。
- 原 `Park_RoadNetwork_N` 发布时 iServer 日志提示节点 ID 重复和转向检查问题，因此不能作为最终高质量路网拓扑验收成果。
- 当前服务可以支撑“SuperMap 优先普通最短路”的参赛演示口径，但动态危险避让仍由 Python D* Lite 兜底。
- “全建筑路径”批量规划当前仍走 Python D* Lite；这不是已完成的 SuperMap 批量网络分析闭环。
- 页面初始化会请求 BTEX / Prairie Grass 验证报告接口，当前返回 404，含义是验证报告文件未生成，不影响扩散/路径主流程，但不能写成真实数据验证报告已完成。
- iServer 中文属性仍存在乱码，截图中可见部分建筑/出口中文名异常；参赛前必须修复字符集或用可读字段替代展示。
- CGCS2000 三维 Realspace 服务 `3D-chemical_park_cgcs2000/rest/realspace` 当前仍为 404，三维发布任务未完成。
- 下一步应在 iDesktopX 中人工校核道路节点和连通性，重新发布可开启 `autoCheckNetwork=true` 的 Transportation Analyst 服务。

## 证据文件

- `network_dataset_build_result.json`
- `network_auto_build_attempt.json`
- `generate_network_workspace_result.json`
- `iserver_network_sxwu_upload.json`
- `iserver_publish_auto_network_attempt.json`
- `transportation_network4_validation.json`
- `transportation_path_point_validation.json`
- `iserver_logs_after_transportation_attempt.json`
- `iserver_logs_after_network4.json`
- `smart-map-supermap-runtime-hash-route.png`
- `smart-map-supermap-current-route-snapped.png`
- `smart-map-diffusion-then-all-building-route.png`
