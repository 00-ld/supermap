# 部署指南

本文说明如何把化工园区危险气体扩散与溯源系统部署到服务器，并挂载到 `www.cip.lab6119.xyz` 域名下。

## 1. 部署架构

```text
Browser
  -> Nginx :80
       -> static frontend files from frontend/dist
       -> /api/*           -> Java backend :8081
       -> /algorithm-api/* -> Python algorithm service :8000
  -> SuperMap iPortal dashboard through VITE_IPORTAL_DASHBOARD_URL

Java backend -> MySQL :3306
Nginx -> injects X-API-Key when calling Python algorithm service
```

公网只需要开放 `80`、`443`（启用 HTTPS 后）和 `22`。MySQL 与 Python 算法服务默认绑定服务器回环地址或 Docker 内网，不直接暴露公网。

## 2. 服务器准备

推荐环境：

| 项 | 建议 |
| --- | --- |
| OS | Ubuntu 22.04 / Debian 12 |
| CPU / RAM | 2 核 4 GB 起步 |
| Disk | 40 GB 起步 |
| Runtime | Docker + Docker Compose |
| Domain | `www.cip.lab6119.xyz` 解析到服务器公网 IP |

安装 Docker：

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version
docker compose version
```

## 3. 本地构建产物

在项目根目录执行：

```bash
# 前端
cd frontend
npm install
npm run build:pro
```

构建完成后应存在：

```text
frontend/dist/
```

Java 后端不需要手工复制 jar 到 `deploy/backend/`。当前 `deploy/docker-compose.yml`
使用 `deploy/backend/Dockerfile`，会在镜像构建阶段从 `backend/` 源码执行 Maven 打包。

## 4. 上传到服务器

建议把整个仓库上传到服务器的统一目录，避免 `docker-compose.yml` 中的相对路径失效：

```bash
scp -r /path/to/localhost root@服务器IP:/opt/chemical-park
```

服务器上目录应类似：

```text
/opt/chemical-park/
  backend/
  frontend/
  algorithm/
  deploy/
    docker-compose.yml
```

不要上传真实 `.env` 到 GitHub；服务器本地 `.env` 只保存在 `/opt/chemical-park/deploy/.env`。

## 5. 配置环境变量

在服务器上执行：

```bash
cd /opt/chemical-park/deploy
cp .env.example .env
nano .env
```

必须修改：

```env
MYSQL_ROOT_PASSWORD=replace_with_strong_password
MYSQL_APP_PASSWORD=replace_with_strong_app_password
JWT_SECRET=replace_with_32_char_min_random_secret
ALGORITHM_API_KEY=replace_with_random_algorithm_key
ALGORITHM_REQUIRE_AUTH=true
ANALYSIS_SERVICE_URL=http://yolo:8001/api/analysis/person
YOLO_MODEL_PATH=/app/models/yolo11m.pt
YOLO_DEVICE=cpu
YOLO_IMAGE_SIZE=1024
YOLO_CONFIDENCE=0.35
INSPECTION_DEFAULT_LOCATION=核心作业区 A7
CORS_ALLOWED_ORIGINS=http://www.cip.lab6119.xyz,https://www.cip.lab6119.xyz
ALGORITHM_CORS_ORIGINS=http://www.cip.lab6119.xyz,https://www.cip.lab6119.xyz
```

说明：

- `MYSQL_ROOT_PASSWORD`、`MYSQL_APP_PASSWORD`、`JWT_SECRET`、`ALGORITHM_API_KEY` 必须使用强随机值；后端使用固定应用账号 `appuser` 连接数据库，不使用 root。
- `ALGORITHM_REQUIRE_AUTH` 生产环境必须保持 `true`，Python 算法服务会要求调用方携带 `X-API-Key`。
- `ANALYSIS_SERVICE_URL` 默认指向 compose 内的 `yolo:8001`；如改用外部受控推理端点，必须同步更新该 URL。
- `YOLO_MODEL_PATH` 指向容器内权重路径，默认挂载仓库 `models/` 到 `/app/models`；权重文件不应提交到 Git。
- `INSPECTION_DEFAULT_LOCATION` 是图片识别巡检记录的默认区域名称，应按园区实际点位配置。
- 前端生产接口使用相对路径 `/api` 与 `/algorithm-api`，由 Nginx 统一代理。

## 6. 启动服务

```bash
cd /opt/chemical-park/deploy
docker compose up -d --build
docker compose ps
```

查看日志：

```bash
docker compose logs -f nginx
docker compose logs -f backend
docker compose logs -f algorithm
docker compose logs -f yolo
docker compose logs -f mysql
```

## 7. 验证访问

服务器本机验证：

```bash
curl http://127.0.0.1/
docker compose exec backend wget -qO- http://localhost:8081/healthz
curl http://127.0.0.1/algorithm-api/api/health
```

域名验证：

```bash
curl http://www.cip.lab6119.xyz/
curl http://www.cip.lab6119.xyz/algorithm-api/api/health
```

浏览器访问：

```text
http://www.cip.lab6119.xyz
```

如果三维大屏无法加载，检查 `frontend/.env.production` 中的 `VITE_IPORTAL_DASHBOARD_URL` 和 Nginx/iPortal 代理配置。
当前部署路线以 `frontend/src/views/screen/` 嵌入 SuperMap iPortal 数字大屏为准，不再维护旧的独立三维查看页。

## 8. HTTPS 建议

当前模板只监听 80 端口。生产环境建议增加 HTTPS：

1. 域名 `www.cip.lab6119.xyz` 完成 DNS 解析。
2. 使用 Certbot 或云厂商证书申请 TLS 证书。
3. 在 `deploy/nginx/default.conf` 中增加 443 server 配置。
4. 启用 HSTS 前先确认 HTTPS 可用，避免误锁域名访问。

## 9. 更新与回滚

更新代码：

```bash
cd /opt/chemical-park
git pull origin main

cd frontend
npm install
npm run build:pro

cd ../deploy
docker compose up -d --build
```

回滚到某个提交：

```bash
cd /opt/chemical-park
git log --oneline
git checkout <commit>
```

重新构建并启动后即可回到该版本。项目开发阶段每个子目录改动都单独提交，方便按历史提交定位问题。

## 10. 运维命令

```bash
# 查看容器
docker compose ps

# 重启单个服务
docker compose restart backend
docker compose restart algorithm
docker compose restart nginx

# 停止全部服务
docker compose down

# 重新构建
docker compose up -d --build

# 进入容器排查
docker exec -it chemical-backend bash
docker exec -it chemical-algorithm bash
docker exec -it chemical-mysql bash
```

## 11. 禁止事项

- 不要把真实 `.env`、数据库密码、JWT 密钥、算法 API Key、证书私钥提交到 GitHub。
- 不要提交 `frontend/dist/`、`backend/target/`、`.venv/`、`node_modules/`、`__pycache__/`、`.npy`、模型权重或生产数据库备份。
- 不要把桌面 `gas/` 中的视频工程、缓存、大型验证数据集整体复制进仓库。
- 不要在前端代码里写死生产密钥或只适用于个人电脑的绝对路径。
