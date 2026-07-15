# 2026-07-15 三维球面与二维 CGCS2000 验证记录

## 本次已完成

- `/screen` 已确认使用 SuperMap3D / iClient3D WebGL 运行时，页面调试状态为 `runtimeName=SuperMap3D`。
- `/screen` 已按河工大莲花街校区锚点 `113.551488E, 34.827640N` 进入球面算法叠加模式。
- 三维扩散按钮可真实调用算法服务，返回 `chemical-algorithm 3.0.0`，本次结果为 `12` 帧，峰值 `58.97 ppm`，请求耗时约 `2511 ms`。
- 扩散结果已转换为 CGCS2000 经纬度备案坐标（EPSG:4490）并以三维实体/标记叠加到 SuperMap3D 球面场景。
- `/smart-map` 已加入公开演示入口；未登录时后端 401 不再强制跳登录，而是降级使用本地默认业务数据。
- `/smart-map` 已验证加载 SuperMap iClient2D，状态显示 `建筑单体校核图_CGCS2000 · CGCS2000_3GK_CM_114E · EPSG:4547`。
- 二维页面已读到 SuperMap iServer Data 业务数据，页面显示 `93 条道路边 · 29 栋建筑`。

## 有效截图

- 三维扩散前：`G:\竞赛\超图杯\报告素材\三维球面坐标验证\screen-globe-current-before-diffusion.png`
- 三维扩散后：`G:\竞赛\超图杯\报告素材\三维球面坐标验证\screen-globe-current-after-diffusion.png`
- 二维 CGCS2000 地图：`G:\竞赛\超图杯\报告素材\三维球面坐标验证\smart-map-cgcs2000-current.png`

## 验证命令

- `npm run typecheck:strict`
- Playwright + Microsoft Edge 打开 `http://127.0.0.1:5174/#/screen`
- Playwright 点击 `/screen` 的 `运行扩散`
- Playwright + Microsoft Edge 打开 `http://127.0.0.1:5174/#/smart-map`

## 诚实未完成

- 三维模型主体仍没有完成真正 CGCS2000 Realspace 发布；当前 `3D-chemical_park_cgcs2000/rest/realspace` 仍不能写成已验收。
- 当前 Web 端只是请求旧 `epsg:0` S3M config，并把算法图层按 EPSG:4490 球面坐标叠加；厂房、管线、油罐和算法结果的真实三维对齐必须在 iDesktopX 按控制点重定位、重缓存、重新发布后验收。
- 三维截图中算法扩散标记可见，但旧 S3M 厂区模型主体不明显；这张图只能证明“算法结果落球面”，不能证明“模型已真实落球面”。
- `/smart-map` 控制台仍有后端未登录导致的 401 降级日志，这是演示入口未登录状态下的业务数据降级，不是 SuperMap iClient2D 加载失败。
- BTEX / Prairie Grass 深度验证报告仍显示未生成，不能写成真实实验报告已经完成。

## 下一步必须做

1. 在 iDesktopX 中按 CP0-CP5 对 S3M/SCP 或源模型做真实地理配准。
2. 重生成 CGCS2000 三维缓存，确保 config/Realspace 不再是 `epsg:0`。
3. 发布并验证 `/iserver/services/3D-chemical_park_cgcs2000/rest/realspace`。
4. 将前端 `VITE_SUPERMAP_3D_SCENE_URL` 切到新的 CGCS2000 Realspace。
5. 在 `/screen` 复测：厂房/管线/油罐主体可见，扩散云团、KDE 概率面、疏散路线与模型空间位置对齐。
