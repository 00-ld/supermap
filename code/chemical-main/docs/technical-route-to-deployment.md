# 技术路线到部署总览

本文面向 GitHub 阅读者，说明本项目从技术路线、模块分工、算法验证到服务器部署的完整链路。

## 1. 项目目标

系统围绕化工园区危险气体泄漏场景，建设“监测 - 扩散模拟 - 泄漏源溯源 - 逃生路径规划 - 可视化决策”的闭环能力。当前阶段保持现有技术栈和目录映射，不做大规模迁移：

| 领域 | 当前目录 | 技术路线 |
| --- | --- | --- |
| 前端可视化 | `frontend/` | Vue 3、ECharts、Canvas，保持现有深色工业风页面风格 |
| Java 后端 | `backend/` | Spring Boot、MyBatis、MySQL、JWT、统一 JSON 响应 |
| Python 算法服务 | `algorithm/` | FastAPI、NumPy、SciPy、PyTorch、扩散/溯源/路径算法 |
| 三维数字孪生 | `frontend/src/views/screen/` | 优先接入 SuperMap iPortal 数字大屏 |
| 数据库 | `db/`、`deploy/mysql/` | MySQL 8、utf8mb4、迁移/种子数据台账 |
| 部署 | `deploy/` | Docker Compose、Nginx 反向代理、域名部署 |
| 参考资料 | `docs/references/` | 政策、算法、设备资料，禁止堆放在根目录 |

## 2. 业务链路

1. 固定传感器和阿克曼巡检小车采集 CO、O2、NH3、CH4 浓度数据。
2. Java 后端负责用户、传感器、小车、告警、记录等业务数据管理。
3. Python 算法服务根据泄漏源、风速、稳定度、气体参数等输入运行扩散模拟。
4. 溯源算法使用多点浓度数据估计泄漏位置，并输出候选源位置与置信信息。
5. D* Lite 等路径规划算法结合危险浓度区域生成逃生路径，并随扩散场变化更新。
6. 前端在二维页面展示监控点位、浓度分布、逃生路径和告警联动。
7. 三维展示优先通过 SuperMap iPortal 已有数字大屏嵌入，后续再扩展 Three.js/SuperMap 原生三维能力。

## 3. 接口协议

所有 Java 后端和 Python 算法接口统一返回 JSON 外壳：

```json
{
  "code": 200,
  "message": "成功",
  "data": {},
  "ok": true,
  "timestamp": 1789000000000,
  "requestId": "uuid"
}
```

Python 算法服务外层响应不再复制 `success` 和 `error` 兼容字段；前端和后端适配代码必须使用 `ok/code/message/data/requestId` 判断外层调用结果。业务成功状态和错误细节只允许在 `data` 内的领域结果或 trace 元数据中表达。详细字段、错误码和接口清单见 `docs/api-reference.md`。

## 4. 气体扩散模型接入状态

桌面 `gas/` 文件夹是完整扩散模型和验证材料来源，但不能整体提交到 GitHub，因为其中包含缓存、视频工程、`node_modules`、大型数据集和外部工具。

当前仓库接入状态：

| 内容 | 仓库状态 | 说明 |
| --- | --- | --- |
| `gas/delivery/model` 的条件化扩散思路 | 已接入 `algorithm/deep_learning/gas_surrogate.py` 与 `algorithm/diffusion/conditioned_advection.py` | 后端采用 PyTorch MLP 学习气体响应，并以可审计条件化对流-扩散核作为物理锚点 |
| 扩散运行时 | 已接入 `algorithm/diffusion/phase1_diffusion.py` | 保留原项目真实地图、20px 网格、帧数上限、障碍硬阻挡、道路通道、湿度衰减、ppm 阈值和传感器读数 schema |
| 历史高斯公式模块 | 保留在 `algorithm/diffusion/gaussian_plume.py` | 用于 Prairie Grass 真实横风扩散宽度验证和历史公式基准，不作为主扩散场生成器 |
| 基准验证脚本 | 已接入 | `test_real_prairie_grass.py`、`test_physical_invariants.py`、`inversion.validate_particle_filter` |
| 物理不变量验证 | 已补充 | `test_physical_invariants.py`，不依赖外部数据 |
| Prairie Grass 真实数据验证 | 已接入 | 使用 `datasets/samples/prairie_grass/PGrassOBSAnalysis.txt`，只验证横风向扩散宽度 `Sy (m)` |
| 大型真实数据集 | 暂不提交 | 仅记录来源台账，必要时通过外部存储或下载脚本复现 |

`gas/delivery/model/checkpoint/unet_best.pt` 不提交到仓库，也不作为算法服务必需依赖。该交付模型的 README 已说明绝对浓度未对照实测、64×64 数据是合成场景，因此当前仓库只吸收其“源栅格 + 障碍栅格 + 均匀风场 + 气体物性条件”的建模思路，并继续把安全阈值、路径阻断和传感器溯源约束放在项目后端可审计代码中。

## 5. 数据与验证原则

- 合成数据必须明确标注为合成数据，不能写成真实实测数据。
- 真实数据接入前必须记录来源 URL、下载时间、许可、字段含义、单位换算和预处理步骤。
- 扩散模型验证至少覆盖公式基准、物理不变量、数值收敛、单位换算和回归数据集。
- K 标定必须记录观测数据来源、候选 K 范围、评价指标和失败样例；使用合成观测时必须标注为回归测试。
- 结论保持客观：说明适用范围、误差、失败场景，不写“绝对准确”。

常用验证命令：

```bash
cd <repo-root>
python -m algorithm.diffusion.test_physical_invariants
python -m algorithm.diffusion.test_real_prairie_grass
python -m algorithm.inversion.validate_particle_filter

python tests/test_forward_model.py  # 历史高斯公式回归，非当前主扩散运行时验收
```

## 6. 部署路线

生产部署目标域名：`www.cip.lab6119.xyz`。

部署入口：

1. 前端构建产物由 Nginx 提供静态访问。
2. `/api/*` 由 Nginx 转发到 Java 后端。
3. `/algorithm-api/*` 由 Nginx 转发到 Python 算法服务，并在服务端注入 `X-API-Key`，避免浏览器暴露算法密钥。
4. MySQL 仅在容器内部或服务器回环地址开放，不暴露公网。
5. SuperMap iPortal 大屏地址通过 `VITE_IPORTAL_DASHBOARD_URL` 配置。

关键配置文件：

| 文件 | 用途 |
| --- | --- |
| `deploy/docker-compose.yml` | Nginx、Java、Python、MySQL 服务编排 |
| `deploy/nginx/default.conf` | 静态资源、API、算法服务反向代理 |
| `deploy/.env.example` | 环境变量模板，真实 `.env` 不得提交 |
| `frontend/.env.production` | 前端生产环境 API 和 iPortal 配置 |
| `backend/src/main/resources/application.yml` | 后端环境变量配置模板 |

部署步骤详见 `deploy/README.md`。生产环境必须替换 `MYSQL_ROOT_PASSWORD`、`JWT_SECRET`、`ALGORITHM_API_KEY`、`ANALYSIS_SERVICE_URL`、`CORS_ALLOWED_ORIGINS` 等变量。

## 7. GitHub 提交边界

允许提交：

- 源码、接口文档、数据库结构脚本、可复现小体积测试数据、配置模板。
- 说明清楚用途和维护规则的规范目录。

禁止提交：

- 真实 `.env`、数据库密码、用户密码、API Key、token 密钥、私钥、证书。
- `node_modules/`、`.venv/`、`__pycache__/`、`dist/`、`target/`、`.npy`、模型权重、临时文件。
- 未授权真实数据、生产数据库备份、生产日志、个人笔记、重复文档。

每次按子目录改动单独提交并推送，便于后续回滚和审查。
