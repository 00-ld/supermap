# /screen 三维场景诊断记录

时间：2026-07-14

## 已完成

- 前端接入了 7 个可访问的 iServer 本地三维瓦片 config：
  - `3D-local3DCache-HuaGongYuanQuChangJing`
  - `3D-local3DCache-result_ImportFBX`
  - `3D-local3DCache-result_ImportFBX2`
  - `3D-local3DCache-YuanCaiLiaoCangKu`
  - `3D-local3DCache-HuanReQi`
  - `3D-local3DCache-LiShiGuanZi`
  - `3D-local3DCache-ZhengLiuTa`
- 修复扩散后场景被 `viewer.flyTo(layer)` 带到星空的问题：EPSG:0 本地 S3M 模式不再显式调用 `flyTo`，只依赖 S3M `autoSetView`。
- 修复 SuperMap3D 对象被 Vue 深层代理的风险：`Viewer`、`ScreenSpaceEventHandler`、S3M layer、Entity 改为 `shallowRef/markRaw` 管理。
- 扩散算法按钮可调用 FastAPI，页面返回“已落图”，状态显示算法在线 `chemical-algorithm 3.0.0`。
- 当前验证通过 `npm run typecheck:strict`。

## 证据截图

- 扩散前模型稳定显示：`screen-stable-no-local-flyto-before.png`
- 扩散后模型不再消失：`screen-stable-no-local-flyto-after-diffusion.png`
- 中北厂房装置区作为演示源后的验证图：`screen-final-central-source-diffusion.png`

## 仍未完成

- 三维发布口径仍不是 CGCS2000 Realspace：`3D-chemical_park_cgcs2000/rest/realspace` 仍未发布成功，当前 `/screen` 还是 `EPSG:0` 本地 S3M 缓存。
- 算法云团与厂区主体还没有严格空间对齐：扩散源点可见，但落在左下角，说明 `LOCAL_S3M_BOUNDS` 到 S3M 实际局部坐标的映射仍需用控制点重新标定。
- 当前扩散三维可视化只能说“算法已调用、三维场景未消失、源点/状态已落图”，不能说“扩散云团已高精度贴合厂房/管线”。
- 油管、厂房细节模型是以多个旧本地 S3M 服务追加加载，不是一个统一 CGCS2000 Realspace 场景；最终参赛版仍应在 iDesktopX/iServer 中统一重定位并发布。

## 下一步高标准处理

1. 在 iDesktopX 中按 CP0-CP5 对主场景、厂房、设备 S3M/SCP 统一重定位到 `EPSG:4547 / CGCS2000_3GK_CM_114E`。
2. 发布 `3D-chemical_park_cgcs2000/rest/realspace`，确认 config 不再是 `epsg:0`。
3. 前端切换到 CGCS2000 Realspace 后，算法输出直接使用 CGCS2000 XY + Z 米制高度渲染，不再使用 `LOCAL_S3M_BOUNDS` 手工映射。
4. 若 CGCS2000 3D 发布暂时无法完成，则至少用 3 个以上可见控制点重新标定 `LOCAL_S3M_BOUNDS`，使源点、扩散云团和厂区主体重合。
