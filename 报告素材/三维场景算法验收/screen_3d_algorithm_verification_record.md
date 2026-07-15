# 三维场景算法验收记录

记录时间：2026-07-15

## 已完成

- 前端 `/screen` 使用 SuperMap iClient3D WebGL 加载远程 iServer 旧三维 S3M 服务，页面显示真实厂房、道路、设备模型，不再是空球面或绿屏。
- 当前加载的三维图层数量：页面状态面板显示 7 个 iServer 三维图层。
- 8000 端口已让给本项目 Python FastAPI 算法服务：
  - 服务：`chemical-algorithm`
  - 版本：`3.0.0`
  - 健康接口：`http://127.0.0.1:8000/api/health`
- 三维监控点已接入场景，点位面板显示：
  - EPSG:4547 投影坐标
  - EPSG:4490 经纬度备案
  - 安装高度
- 三维算法按钮已验收：
  - 扩散模拟：12 帧，峰值约 58.97 ppm，结果叠加到三维场景，模型未消失。
  - 粒子滤波溯源：返回估计源点并叠加到三维场景。
  - 疏散规划：返回 4 个路径点，出口为东侧道路入口，路径叠加到三维场景。

## 验收截图

- `screen-3d-model-sensors-algorithms.png`
- `screen-3d-model-sensors-algorithms-state.json`

## 诚实未完成

- 远程 `http://8.130.175.232:18090/iserver/services/3D-chemical_park_cgcs2000/rest/realspace` 仍未发布成功，当前访问仍是 404。
- 当前可见三维模型仍来自旧 `3D-local3DCache-*` 服务，三维缓存元数据仍属于 EPSG:0 / 平面缓存，不是正式 CGCS2000 三维 Realspace。
- 当前三维算法叠加采用“CGCS2000 业务坐标 -> 旧 S3M 本地场景坐标”的临时渲染变换；二维 Data/Map/Network 是 CGCS2000，三维模型尚未完成真正重定位重缓存。
- 疏散规划当前三维入口调用的是 Python 算法服务返回的路径结果，不等同于已经在三维页面完整调用 SuperMap Network Analysis 批量路径分析。
- 粒子滤波当前三维展示为最终估计点和置信范围；KDE 概率地形只有在后端返回稳定 `posteriorDensityGeoJSON` 时才会展示，未强行伪造 KDE 过程。

## 下一步必须做

1. 在 iDesktopX 中对 S3M/SCP 按 CP0-CP5 做真实 CGCS2000 重定位与重缓存。
2. 把重缓存后的三维数据发布到远程 iServer `18090`，目标服务名为 `3D-chemical_park_cgcs2000`。
3. 验证新 Realspace 不是 404，并检查 config/realspace 元数据不再是 `epsg:0`。
4. 前端再把 `VITE_SUPERMAP_3D_SCENE_URL` 切到新 CGCS2000 Realspace。
5. 将三维监控点从前端静态数据进一步迁移为 iServer Data 查询结果。
