# 基于时空智能和数字孪生的化工园区危险气体监测和溯源系统

> 超图杯参赛作品 · 本地运行版
>
> 本仓库当前面向**本地开发与演示**：所有服务绑定 `127.0.0.1`，无需公网域名、无需线上部署即可完整跑通。原生产部署（`www.chemgas.lab6119.xyz` + 宝塔 Nginx + Docker Compose）相关配置仍保留在 `deploy/`，如需对外发布可参考文末「服务器部署（可选）」。

本项目围绕化工园区危险气体扩散模拟、泄漏源溯源、传感器监控点位、小车巡检、逃生路径规划和 SuperMap iPortal 数字大屏展示构建。

当前仓库已按规范目录组织：前端在 `frontend/`，Java 后端在 `backend/`，Python 算法服务在 `algorithm/`，三维数字孪生接入在 `twin/` 与前端三维页面中维护，数据库台账在 `db/`，部署配置在 `deploy/`。

## 本地一键启动（推荐）

本项目已改造为纯本地运行，**不需要公网部署**。只需本机具备 Node、Python、Maven、Docker（仅用于跑 MySQL 容器）即可。

### 快速启动

```bash
# 1. 双击运行（或命令行执行）
run-local.bat
```

`run-local.bat` 会自动完成以下工作，全程零交互：

1. 读取 `.env.local` 中的本地开发密钥（首次需确认已存在，仓库已附 `.env.local.example` 模板）。
2. 启动 Docker MySQL 容器 `chemical-local-mysql`（端口 `127.0.0.1:3307`，避开本机已占用的 `3306`），并导入 `deploy/mysql/init.sql`。
3. 启动 Python 算法服务（`127.0.0.1:8000`，鉴权已本地关闭）。
4. 启动 YOLO 人员识别服务（`127.0.0.1:8001`）。
5. 启动 Java 后端（`127.0.0.1:8081`，`local` profile）。
6. 启动前端 dev server（`127.0.0.1:5173`）。

启动完成后访问：

| 服务 | 地址 |
| --- | --- |
| 前端 | http://127.0.0.1:5173/index.html |
| 后端 | http://127.0.0.1:8081/api |
| 算法服务 | http://127.0.0.1:8000/api/health |
| YOLO 文档 | http://127.0.0.1:8001/docs |

停止全部服务：双击 `shutdown.bat`。

### 首次使用的密钥配置

`.env.local` 已生成默认本地开发密钥（仅用于 `127.0.0.1`，不可对外）。如需自定义，编辑根目录 `.env.local`：

```env
DB_USERNAME=root
DB_PASSWORD=ChemLocal@2026#Dev
MYSQL_ROOT_PASSWORD=ChemLocal@2026#Dev
MYSQL_DATABASE=chemical
JWT_SECRET=<本地随机字符串>
ALGORITHM_REQUIRE_AUTH=false
ALGORITHM_API_KEY=<本地随机字符串>
```

> 本地开发默认 `ALGORITHM_REQUIRE_AUTH=false`，前端无需配置算法 API Key；若需开启鉴权验证完整链路，改为 `true` 并在前端 `.env.development` 补 `ALGORITHM_API_KEY`。

前端算法客户端支持可选 `VITE_ALGORITHM_API_KEY`，配置后会通过 `X-API-Key` 发送给 FastAPI 算法服务。不要把真实密钥提交到仓库；本地演示优先使用 `ALGORITHM_REQUIRE_AUTH=false`。

### 本地依赖要求

| 工具 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | 20 ~ 24 | Vite 5 前端（当前本机为 v25 也可用） |
| Python | 3.11+ | 算法服务，通过 `uv` 管理依赖 |
| uv | 0.11+ | Python 依赖管理 |
| Maven | 3.9+ | Java 后端构建 |
| Docker Desktop | 任意现代版本 | 仅用于跑 MySQL 容器，避免污染本机数据库 |
| JDK | 21 | Spring Boot 3.4 |

如果本机已安装原生 MySQL 并希望直接使用（不走 Docker），可改用原 `startup.bat` 并在 `.env.local` 中设置 `DB_PASSWORD` 为本机 MySQL 密码、端口指向 `3306`。


## 核心能力

- 气体扩散模拟：物理信息深度学习代理模型、风速风向、稳定度、障碍物、气体物性参数。
- 泄漏源溯源：基于深度学习响应模型与粒子滤波进行候选泄漏点估计。
- 逃生路径规划：结合危险浓度区域和道路拓扑进行动态路径规划。
- 传感器点位：维护固定气体传感器点位和巡检小车监控点位；当前仓库没有真实硬件采集链路，读数来自仿真采样、手工观测或巡检图片识别结果。
- 视觉识别：YOLO11m 用于识别小车摄像头上传图像中的人员位置。
- 三维展示：`/screen` 入口优先使用 SuperMap3D / iClient3D 原生加载 iServer 三维场景，iPortal 大屏作为兜底入口；扩散、粒子滤波溯源和疏散规划可从入口页触发，并把结果转换为 WGS84 经纬度实体叠加到三维场景。

## 技术栈

| 模块 | 目录 | 技术 |
| --- | --- | --- |
| 前端 | `frontend/` | Vue 3、TypeScript、Vite、Element Plus、Pinia、ECharts、Canvas |
| 后端 | `backend/` | Spring Boot 3.4、JDK 21、MyBatis、MySQL、JWT |
| 算法服务 | `algorithm/` | FastAPI、NumPy、SciPy、PyTorch、Ultralytics YOLO11 |
| 三维/数字孪生 | `twin/`、`frontend/src/views/screen/` | SuperMap3D / iClient3D、iServer Realspace、iPortal 兜底大屏 |
| 数据库 | `db/`、`deploy/mysql/` | MySQL 8、utf8mb4 |
| 部署 | `deploy/` | Docker Compose、Nginx、MySQL、前后端服务 |

## 技术路线

系统目标技术路线按“数据采集 -> 扩散模拟 -> 异常识别 -> 泄漏源溯源 -> 逃生路径规划 -> 二维/三维展示 -> 安全联动”组织；当前仓库尚未接入真实硬件采集链路，因此采集环节由 `sensor_reading` 仿真采样、手工观测和巡检图片素材承接：

1. 目标能力是由固定气体传感器和阿克曼巡检小车采集 CO、O2、NH3、CH4 浓度数据；当前实现不得写成现场实测，只能标注为仿真采样、手工观测或巡检图片识别链路。
2. Python 算法服务基于扩散模型生成浓度场，并通过测试集和校准流程验证模型行为。
3. Java 后端统一接收传感器、小车、算法任务和用户管理数据，按统一 JSON 响应协议对外提供接口。
4. 二维地图不能弱化：二维地图/iClient2D/iServer Data 作为后台空间分析引擎，承载道路网络、缓冲区、叠加分析、空间查询和路径分析；Canvas 只保留必要的演示与交互辅助。
5. 三维展示阶段通过 SuperMap3D / iClient3D 原生加载 iServer S3M 场景，只负责前台结果投影：扩散云团、粒子滤波 KDE 概率地形、最终置信椭圆和抬高疏散路线。
6. 事故处置建议、逃生规范建议等大模型能力只作为辅助参考，不替代扩散模型、溯源模型和现场负责人决策。

## 目录说明

```text
.
  frontend/          Vue 3 前端管理系统
  backend/           Java Spring Boot 后端
  algorithm/         Python 算法服务与扩散/溯源/路径规划算法
  twin/              SuperMap iPortal、Three.js 和三维坐标映射资料
  db/                数据库目录台账、脚本索引和维护规则
  datasets/          权威数据集来源、清单和小型可复现实验样本
  models/            模型清单、版本说明和轻量配置，不提交大模型权重
  docs/              项目总体要求、接口文档、数据集来源、架构说明
  tests/             气体模型可复现测试数据与验证脚本
  tools/             审计、校验、数据整理等辅助工具脚本
  scripts/           开发、构建、数据处理和发布辅助脚本
  docker/            共享容器构建资料
  deploy/            Docker Compose、Nginx、MySQL 初始化和服务器部署配置
  config/            配置模板，不存放真实密钥
  uploads/           本地上传占位目录，真实上传文件不提交
  logs/              本地日志占位目录，真实运行日志不提交
  assets/            项目图片、图标、地图和轻量三维静态资源
  .github/           CI、检查规则和 GitHub 仓库配置
```

## 统一接口协议

Java 后端和 Python 算法服务应返回统一 JSON 外壳：

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

Python 算法服务外层响应不再复制 `success` 和 `error` 兼容字段；业务状态、错误细节、算法版本、耗时、灰度与回滚信息放在 `data` 内的领域结果和 trace 元数据中。详细说明见 [docs/api-reference.md](docs/api-reference.md)。

## 环境变量与安全

真实密钥不得提交到 GitHub。以下内容必须通过环境变量、部署平台密钥或本地未提交 `.env` 注入：

- `MYSQL_ROOT_PASSWORD`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `ALGORITHM_API_KEY`
- `ALGORITHM_REQUIRE_AUTH`
- 第三方 API Key

部署变量模板见 [deploy/.env.example](deploy/.env.example)。模板中的占位值不能用于生产环境。

## 本地开发（手动分步）

如不想用一键脚本，也可按下面步骤手动启动各模块。

### 1. 数据库

开发和部署 SQL 入口见：

- [db/manifest.json](db/manifest.json)
- [deploy/mysql/init.sql](deploy/mysql/init.sql)

数据库使用 MySQL 8，字符集统一为 `utf8mb4`。不要在 SQL 或文档中写入真实数据库密码。

本地推荐用 Docker 起一个 MySQL（`run-local.bat` 已自动处理）：

```bash
docker run -d --name chemical-local-mysql ^
  -e MYSQL_ROOT_PASSWORD=ChemLocal@2026#Dev ^
  -e MYSQL_DATABASE=chemical ^
  -p 127.0.0.1:3307:3306 ^
  -v chemical_local_mysql_data:/var/lib/mysql ^
  mysql:8.0 --character-set-server=utf8mb4 --collation-server=utf8mb4_general_ci

docker exec -i chemical-local-mysql mysql -uroot -pChemLocal@2026#Dev < deploy/mysql/init.sql
```

### 2. Java 后端

后端默认 profile 已改为 `local`，会连本地 MySQL（`127.0.0.1:3306/chemical`，root 账号）；如使用 Docker 的 3307 端口或自定义密码，通过环境变量覆盖即可。

```bash
cd backend
mvn clean package -DskipTests
# 默认 local profile
mvn spring-boot:run
# 或显式指定 profile 与数据库连接
mvn -Dspring-boot.run.profiles=local spring-boot:run
```

### 3. Python 算法服务

项目使用 [uv](https://docs.astral.sh/uv/) 管理 Python 依赖（仓库根目录的 `pyproject.toml` + `uv.lock` 为唯一依赖来源）。

```bash
# 在仓库根目录执行，uv 会按 uv.lock 创建并同步 .venv
uv sync

# 从仓库根目录按 Python 包启动算法服务
uv run uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000 --reload

# 如需本地启动 YOLO 人员识别服务，必须显式安装 yolo extra
uv sync --extra yolo
uv run uvicorn algorithm.polo:app --host 127.0.0.1 --port 8001 --reload
```

本地开发可通过 `ALGORITHM_REQUIRE_AUTH=false` 关闭算法服务鉴权，省去前端配 API Key；生产环境应配置 `ALGORITHM_API_KEY` 和 `ALGORITHM_REQUIRE_AUTH=true`。

### 4. 前端

```bash
cd frontend
npm install
npm run dev
```

前端 `.env.development` 已默认指向本地后端（`http://localhost:8081`）和算法服务（`http://localhost:8000`），vite 代理自动转发 `/api` 和 `/algorithm-api`。

SuperMap 三维入口通过以下环境变量配置：

- `VITE_SUPERMAP3D_SCRIPT_URL`、`VITE_SUPERMAP3D_STYLE_URL`：SuperMap3D / iClient3D SDK 和样式地址。
- `VITE_SUPERMAP3D_REMOTE_PROXY_BASE`：SDK 同源代理前缀，开发环境默认 `/supermap3d-remote`。
- `VITE_SUPERMAP_ISERVER_PROXY_BASE`：iServer 同源代理前缀，开发环境默认 `/supermap-iserver`，用于避免 iClient3D 请求登录、许可、config、S3M 瓦片时被 CORS 拦截。
- `VITE_SUPERMAP_3D_SCENE_URL`：iServer Realspace 服务地址。
- `VITE_SUPERMAP_3D_LAYER_CONFIGS`：S3M config 地址列表，当前指向 `化工园区场景`。
- `VITE_SUPERMAP_3D_LAYER_POSITION`：S3M 图层 WGS84 插入点，格式为 `longitude,latitude,height`。
- `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION`：是否把 S3M 图层强制插入 WGS84 球面坐标。当前三维瓦片 config 为 `epsg:0`，开发环境默认 `false`，避免模型不请求 `.s3mb`。
- `VITE_SUPERMAP_3D_DEFAULT_CAMERA`：三维入口默认相机，格式为 `longitude,latitude,height,heading,pitch,roll`。
- `VITE_IPORTAL_DASHBOARD_URL`：iPortal 大屏兜底地址。

当前已验证的三维 S3M config 坐标系为 `epsg:0` 平面米制缓存。Web 端当前按 iServer Realspace 原生缓存加载三维模型，并通过 Vite `/supermap-iserver` 与 `/iserver` 两组代理保证 `scenes/layers/config/attribute/.s3mb` 请求都进入 iServer。三维叠加层当前按 EPSG:0 本地米制场景坐标落到 S3M 模型上；`frontend/src/data/coordinate.js` 的 `worldToGeo()` 只作为业务经纬度参考、证据摘要和未来真实 CRS 重缓存目标，不写成当前三维瓦片本体已具备真实坐标系。长期参赛交付仍需要用 iDesktopX 重新处理三维数据坐标系，使模型本身重缓存为真实 WGS84/CGCS2000 坐标。

二维/三维职责边界固定为“二维地图做后台计算引擎，三维场景做前台投影仪”。疏散路径示例：三维点击建筑得到经纬度或投影坐标，传给二维道路网络分析；二维模块只基于道路线数据求解 Dijkstra/网络分析路径，返回 `[x,y]` 坐标串；三维端给路径点赋固定 Z 值后渲染为路线，不在三维瓦片里直接做网络求解。粒子滤波示例：Python 算法端对最终粒子群做 KDE，输出带 Z 值的规则栅格 GeoJSON；三维端只消费该 GeoJSON 叠加 S3M 形成“概率地形”。如果后端没有 KDE GeoJSON，三维只展示最终估计点和 95% 置信椭圆。

## 服务器部署（可选，非参赛演示必需）

> 以下内容仅用于将来对外发布，**参赛演示与本地开发无需执行**。仓库默认以本地运行（`run-local.bat`）为主，所有服务绑 `127.0.0.1`。

如需对外发布，生产部署目标域名曾为 `www.chemgas.lab6119.xyz`，部署入口在 `deploy/`。仓库保留标准 Docker Compose 部署方案；线上服务器可使用宝塔 Nginx 承载域名和证书，Docker Compose 只运行 Java 后端、Python 算法服务、YOLO 服务和 MySQL。

### 1. 服务器准备

推荐环境：

| 项 | 建议 |
| --- | --- |
| 操作系统 | Ubuntu 22.04 / Debian 12 |
| 配置 | 2 核 4 GB 起步，40 GB 磁盘起步 |
| 运行环境 | Docker、Docker Compose |
| 开放端口 | `80`、`443`、`22` |
| 域名 | `www.chemgas.lab6119.xyz` 解析到服务器公网 IP |

安装 Docker：

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version
docker compose version
```

MySQL、Java 后端和 Python 算法服务不应直接暴露公网，应由 Nginx 统一代理。

当前宝塔部署约定：

| 服务 | 容器/进程 | 监听 |
| --- | --- | --- |
| 前端静态站点 | 宝塔 Nginx | `80` / `443` |
| Java 后端 | `chemical-backend` | `127.0.0.1:18081 -> 8081` |
| Python 算法服务 | `chemical-algorithm` | `127.0.0.1:18080 -> 8000` |
| YOLO 识别服务 | `chemical-yolo` | Docker 内网 `8001` |
| MySQL | `chemical-mysql` | Docker 内网或本机回环端口 |

如果使用标准 `deploy/docker-compose.yml` 中的 Nginx 容器方案，应避免与宝塔 Nginx 同时占用 `80/443`。

### 2. 获取代码

在服务器上拉取代码：

```bash
cd /opt
git clone https://github.com/119tab/chemical.git chemical-park
cd /opt/chemical-park
```

如果服务器上已经存在项目：

```bash
cd /opt/chemical-park
git pull origin main
```

### 3. 配置生产环境变量

真实密钥只允许保存在服务器本地 `.env` 文件中，不得提交到 GitHub：

```bash
cd /opt/chemical-park/deploy
cp .env.example .env
nano .env
```

至少需要替换以下变量：

```env
MYSQL_ROOT_PASSWORD=replace_with_strong_mysql_root_password
MYSQL_APP_PASSWORD=replace_with_strong_app_password
JWT_SECRET=replace_with_random_32_char_min_secret
ALGORITHM_API_KEY=replace_with_random_algorithm_key
ALGORITHM_REQUIRE_AUTH=true
CORS_ALLOWED_ORIGINS=http://www.chemgas.lab6119.xyz,https://www.chemgas.lab6119.xyz
ALGORITHM_CORS_ORIGINS=http://www.chemgas.lab6119.xyz,https://www.chemgas.lab6119.xyz
ANALYSIS_SERVICE_URL=http://yolo:8001/api/analysis/person
YOLO_MODEL_PATH=/app/models/yolo11m.pt
YOLO_DEVICE=cpu
YOLO_IMAGE_SIZE=1024
YOLO_CONFIDENCE=0.35
```

标准 Docker Compose 会启动带 `yolo` extra 的人员识别服务，Java 后端默认通过
`http://yolo:8001/api/analysis/person` 内网调用。YOLO 权重不提交到仓库，
部署时把受控权重放到 `models/`，并用 `YOLO_MODEL_PATH` 指向容器内路径。
仓库当前没有 8100 独立模型推理容器；若未来拆分统一推理服务，需要同步更新
compose、后端 `ANALYSIS_SERVICE_URL` 和模型 manifest。

### 4. 构建前端

Nginx 容器挂载 `frontend/dist`，需要先构建前端静态产物。Java 后端由
`deploy/backend/Dockerfile` 在 Docker 镜像构建阶段从 `backend/` 源码打包，
不需要手工复制 jar 到 `deploy/backend/`。

```bash
cd /opt/chemical-park/frontend
npm install
npm run build:pro
```

构建完成后应存在：

```text
frontend/dist/
```

前端构建产物用于服务器运行，但不要提交到 GitHub。

### 5. 启动 Docker 服务

```bash
cd /opt/chemical-park/deploy
docker compose --env-file .env config
docker compose --env-file .env up -d --build
docker compose ps
```

查看日志：

```bash
docker compose logs -f nginx
docker compose logs -f backend
docker compose logs -f algorithm
docker compose logs -f mysql
```

### 6. 验证访问

服务器本机验证：

```bash
curl http://127.0.0.1/
curl http://127.0.0.1/algorithm-api/api/health
```

域名验证：

```bash
curl http://www.chemgas.lab6119.xyz/
curl http://www.chemgas.lab6119.xyz/algorithm-api/api/health
curl -X POST http://www.chemgas.lab6119.xyz/algorithm-api/api/diffusion/simulate \
  -H 'Content-Type: application/json' \
  -d '{"gasId":"nh3","sourceMapPoint":{"x":420,"y":320},"sourceRate":68,"releaseDuration":160,"windSpeed":3.8,"windDirection":35,"stabilityClass":"D","frameCount":12,"frameStepSec":3,"map":{"width":1000,"height":720,"gridSize":20,"mapMetersPerUnit":0.5},"facilities":[],"roads":[],"sensors":[]}'
```

浏览器访问：

```text
http://www.chemgas.lab6119.xyz
https://www.chemgas.lab6119.xyz
```

如果 SuperMap 原生三维场景无法加载，先检查 `VITE_SUPERMAP3D_SCRIPT_URL`、`VITE_SUPERMAP3D_STYLE_URL`、`VITE_SUPERMAP_3D_LAYER_CONFIGS`，并确认生产 Nginx 保留 `/supermap3d-remote/` 同源代理；否则浏览器可能拦截 SuperMap3D Worker。iPortal 大屏仅作为兜底，检查项为 `VITE_IPORTAL_DASHBOARD_URL`、iPortal 服务、Nginx 代理和 iframe 策略。

### 7. HTTPS 建议

生产环境建议启用 HTTPS。当前线上域名已配置 HTTPS，同时保留 HTTP 入口：

1. 确认 `www.chemgas.lab6119.xyz` 已解析到服务器公网 IP。
2. 使用 Certbot、云厂商证书或反向代理平台申请 TLS 证书。
3. 标准 Compose 方案可在 `deploy/nginx/default.conf` 中增加 443 配置；宝塔方案应在宝塔站点配置中维护证书和反向代理扩展。
4. 如果需要 HTTP 和 HTTPS 同时可访问，不要启用强制跳转和长周期 HSTS；若只保留 HTTPS，再启用 HSTS。

### 8. 更新与回滚

更新到最新版：

```bash
cd /opt/chemical-park
git pull origin main

cd frontend
npm install
npm run build:pro

cd ../deploy
docker compose --env-file .env up -d --build
```

回滚到指定提交：

```bash
cd /opt/chemical-park
git log --oneline
git checkout <commit>
```

回滚后重新构建并启动 Docker 服务即可。

### 9. 部署禁止事项

- 不要把真实 `.env`、数据库密码、JWT 密钥、算法 API Key、证书私钥提交到 GitHub。
- 不要提交 `frontend/dist/`、`backend/target/`、`.venv/`、`node_modules/`、`__pycache__/`、`.npy`、模型权重或生产数据库备份。
- 不要在前端代码中写死生产密钥、数据库连接、服务器绝对路径或第三方 API Key。
- 不要让 MySQL、算法服务、模型推理服务直接暴露到公网。

详细部署路线见 [docs/technical-route-to-deployment.md](docs/technical-route-to-deployment.md) 和 [deploy/README.md](deploy/README.md)。

## 测试与验证

常用验证命令：

```bash
cd backend
mvn -q -DskipTests compile

cd ../frontend
npm run typecheck:strict
npm run build:pro

cd ..
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.diffusion.test_real_prairie_grass
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
uv run --no-sync python -m algorithm.planning.test_dstar_lite

python tools/audit_repository.py
python tools/code_quality_audit.py
python tests/test_forward_model.py
```

前端生产构建需要使用工程支持范围内的 Node.js。系统 Node 25.2.1 在本机 Vite build 中会于 transform 后异常退出；使用 Codex bundled Node 24.14.0 验证通过：

```powershell
$env:PATH='C:\Users\colorful\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
npm run typecheck
npm run build
```

二维 SuperMap 验证截图：

```text
G:\竞赛\超图杯\报告素材\超图瓦片处理\screenshots\54-web-smartmap-supermap2d-ready.png
G:\竞赛\超图杯\报告素材\超图瓦片处理\screenshots\55-web-smartmap-supermap2d-real-backend.png
```

`tests/` 当前数据是合成解析数据，用于回归验证，不得写成现场实测数据。真实/权威数据来源台账见 [docs/dataset-sources.md](docs/dataset-sources.md)。

三维 SuperMap 和算法空间化验收以 [docs/supermap-cup-implementation-ledger.md](docs/supermap-cup-implementation-ledger.md) 为准。每个核心演示功能都要保留输入 payload、输出 JSON、耗时、requestId、SuperMap 图层截图和人工复核结论。

## 代码硬性规则

### 设计与实现原则

- 前端设计必须始终站在用户角度思考：优先考虑真实使用场景、信息层级、交互效率、可读性、反馈状态和视觉一致性，避免只为了炫技、堆组件或堆视觉效果而设计页面。
- 后端实现必须始终站在程序员和维护者角度思考：代码要有清晰边界、合理命名、可测试、可排查、可扩展，避免无逻辑的屎山代码、重复堆砌、硬编码散落和难以维护的实现。

死规则：严禁为了图方便写入无效、重复、无意义或无法验证的代码、变量、函数、接口、文档和数据文件。任何新增内容都必须能说明用途、调用路径、输入输出、验证方式和失败边界；经不起代码审查、搜索去重、测试运行或业务流程验证的内容不得提交。

具体要求：

- 不得复制粘贴已有函数后改名凑功能；应复用现有函数，或说明新函数不可复用的原因。
- 不得新增同义重复变量、重复状态、重复 API 封装、重复模型入口或重复页面入口。
- 不得保留未调用、无业务意义、无数据来源、无验证命令的代码和文件。
- 不得为了“看起来完整”提交占位实现、假接口、假数据、无效注释或不可维护的大段生成内容。
- 新增核心逻辑必须能被类型检查、单元测试、接口测试、算法验证或人工复现步骤中的至少一种方式验证。
- 如果某段代码暂时不能验证，必须在文档或 TODO 中明确原因、风险、后续验证方法和负责人，且不得伪装成已完成能力。

## GitHub 提交约束

禁止提交：

- 真实 `.env` 文件、数据库密码、用户密码、API Key、token 密钥、私钥或证书。
- `node_modules/`、`.venv/`、`__pycache__/`、`.pytest_cache/`、`dist/`、`target/` 等依赖、缓存和构建产物。
- 大体积模型权重、`.npy` 体数据、生产数据库备份、未脱敏真实数据。
- 重复文档、乱码文档、临时文件、个人笔记、旧目录和无维护价值文件。

每次按子目录改动时应单独提交，便于回滚和审查。提交前建议运行 `python tools/audit_repository.py`，确认禁止提交内容没有进入 Git 跟踪。

## 关键文档

- [docs/项目总体要求.md](docs/项目总体要求.md)
- [docs/technical-route-to-deployment.md](docs/technical-route-to-deployment.md)
- [docs/supermap-cup-implementation-ledger.md](docs/supermap-cup-implementation-ledger.md)
- [docs/supermap-cup-division-plan.md](docs/supermap-cup-division-plan.md)
- [docs/api-reference.md](docs/api-reference.md)
- [docs/dataset-sources.md](docs/dataset-sources.md)
- [docs/sensor-placement-guide.md](docs/sensor-placement-guide.md)
- [db/README.md](db/README.md)
- [tests/README.md](tests/README.md)

## License

MIT
