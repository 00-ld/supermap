# 2026-08-08 三维流程继续修复日志

## 备份

本轮沿用已创建的完整备份：`G:\竞赛\超图杯\backups\chemical-main-before-full-3d-repair-20260807-232532`。备份不在 Git 跟踪范围内，未执行提交、暂存或回退。

## 本轮完成

- 六个独立场景增加本地 SCP 回退；Vite 通过 `/local-mini-scene/<sceneId>/...` 以 Range 方式读取外部缓存，不复制或改写原始瓦片。
- 实测 `processing-plant/result_ImportFBX.scp` 返回 HTTP 206、`Content-Range`、JSON；其内部 S3MB 返回 HTTP 206 和二进制内容，浏览器请求链可用。
- 增加 `/local-iportal-dashboard/` 只读静态大屏回退入口。远端 iPortal 可用时保留在线链接；远端 502 时展示六个 4490/S3M 独立场景入口，不包含账号、密码或令牌。
- 三维路线显示高度改为厘米级贴地偏移，去除按折点累加的悬空高度。二维/三维路径结果已有建筑碰撞超过 0.5 m 即拒绝显示的安全门槛。
- 扩散首帧修复：瞬时释放也会注入首个积分步，首帧时间从 1 秒开始，并强制源体元可见。

## 验证

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run validate:spatial-assets`：通过（7 个场景、6 个体泄漏源、4 个厂房出入口）。
- `npm run test:unit`：通过，27 项。
- `\.venv\Scripts\python.exe -m unittest algorithm.diffusion.test_phase1_source_visibility algorithm.diffusion.test_conditioned_advection_volume algorithm.planning.test_dstar_lite -v`：通过，4 项。
- `\.venv\Scripts\python.exe -m algorithm.inversion.test_eki_inversion`：通过 3/3 合成场景，位置误差 2.9 m、1.4 m、1.8 m；当前测试集最大误差 2.9 m，均小于 3 m。该结论仅适用于本次固定合成数据，不替代真实现场验收。
- `npm run build`：6001 个模块转换完成，但 Windows Node 进程在产物收尾阶段以 `-1073740791` 异常退出；不是类型或语法错误，需要后续单独处理构建进程稳定性。
- `npm run validate:3d-tiles`：命令可运行，但现有 `public/pic` 3D Tiles 资源报告 122 个 geometricError 层级错误；未改写这些用户资产。
- 本机 SuperMap iServer 2026 beta 已启动并监听 `8090`，`/iserver/services.json` 返回 HTTP 200。iPortal 安装包配置端口为 `8190`，本次尝试启动未建立监听，需查看其启动窗口/日志后再处理；远端 18190 隧道因此仍不能确认恢复。
- Playwright 可执行文件能找到，但 Chrome 在本机以 `spawn UNKNOWN` 启动失败；页面已用 HTTP 内容和 Range 请求完成验证。

## 未完成与风险

- 远端 `18090/18190` 仍返回 502；诊断表明它们依赖本机 iServer/iPortal 与 NPS 隧道客户端，当前机器未发现运行中的服务或 NPC。
- 本地 SCP 回退只在 Vite 开发中间件生效，生产部署仍需要 iServer 或服务器静态映射。
- 路径碰撞检查目前基于二维设施 footprint，尚未接入真实三维建筑体/路面高程碰撞。
- 粒子滤波当前三维高度仍通过设备锚点约束，不是独立 z 状态；真实多气体、多风场误差评估尚未完成。

## 回滚

恢复备份中对应文件即可；不要使用 `git reset` 或清理工作树。
