# Documentation

本目录存放项目需求、架构、接口、数据集、算法验证、开发规范和部署路线相关文档，是代码实现和后续维护的约束依据。

## 主要文档

- `项目总体要求.md`：项目总体范围、技术栈、目录规范、安全约束、页面要求和验收标准。
- `technical-route-to-deployment.md`：从技术路线到服务器部署的完整说明。
- `supermap-cup-implementation-ledger.md`：SuperMap 产品链嵌入、数据来源、坐标系边界、里程碑、移动端和验收台账。
- `supermap-cup-division-plan.md`：超图杯参赛作品中 SuperMap 能力与自研算法的分工边界。
- `supermap-cgcs2000-georeference-plan.md`：河南工业大学莲花街校区 CGCS2000 控制点、坐标转换和发布契约。
- `supermap-algorithm-2d-compute-3d-visualization-plan.md`：二维 GIS/算法计算、三维事件触发和可视化组件计划。
- `supermap-iclient-screen-monitoring-sensor-model.md`：iClient3D 原生大屏、SensorThings 监控点位模型和 `Park_MonitoringSensor_P` 字段建议。
- `algorithm-implementation-verification-supermap-principle.md`：扩散、反演、粒子滤波、疏散、YOLO 的代码入口、验证结果、可信边界和 SuperMap 优先原则说明。
- `supermap-current-state-for-deepseek.md`：给新 AI 对话快速了解项目的 SuperMap 现状、诚实边界和优化建议。
- `api-reference.md`：统一 JSON 响应协议和接口说明。
- `architecture.md`：系统分层、服务关系和数据流说明。
- `development-guide.md`：本地开发、构建和验证流程。
- `coding-standards.md`：代码、数据库、接口、文档命名规范。
- `dataset-sources.md`：数据集来源、用途和提交边界。
- `sensor-placement-guide.md`：传感器监控点位布局方案。
- `references/`：政策、算法、设备等参考资料归档。

## 目标验收口径

长期目标不能只看“写了多少内容”，必须能被当前仓库状态证明：

- 根目录、前端、后端、算法、数据库、部署和文档目录均符合规范命名。
- 每次对子目录的实质改动都应形成独立提交，并已推送到 GitHub。
- 前端页面风格保持现有体系，不为改名或接入接口破坏原有视觉结构。
- 算法新增能力必须有可运行验证命令，真实数据、合成数据和结论边界要分清楚。
- README、部署文档和接口文档能说明从技术路线到部署运行的完整链路。
- 仓库不包含真实密钥、生产数据、模型权重、运行日志、缓存、构建产物和无维护价值文件。

## 维护规则

- 代码目录、端口、环境变量、接口响应结构、部署命令发生变化时，必须同步更新相关文档。
- 文档应保持客观表达，尤其是算法效果、事故处置、逃生建议和模型可信度说明，不得写成绝对保证。
- 引用数据集、国家标准、论文或平台资料时，应说明来源、版本、下载时间或归档位置。
- 不得提交乱码文档、重复草稿、临时笔记、无法说明用途的截图或无维护价值的自动生成内容。
- 与 GitHub 提交相关的禁止事项应同步体现：真实 `.env`、API Key、数据库密码、模型权重、生产日志和未脱敏数据不得提交。

## 命名建议

- 长期维护文档使用英文短横线命名，例如 `technical-route-to-deployment.md`。
- 已确定为项目正式交付的中文文档可以保留中文名称，例如 `项目总体要求.md`。
- 临时分析文件需要转为正式文档后再提交；不能长期以 `草稿.md`、`new.md`、`测试.md` 等名称存在。

## 更新检查

提交文档前至少检查：

```bash
git diff --check
python tools/audit_repository.py
python tools/code_quality_audit.py
rg -n --glob '!docs/README.md' "<原始文件本地路径>|test_calibration.py|模型推理服务 \\| 8100 \\| 内网访问|图片/视频上传并调用" docs README.md
```

最后一条命令应无输出；它只检查已发生过的陈旧口径、占位来源和不存在脚本，不再用会稳定命中合法内容的宽泛关键词当门禁。
