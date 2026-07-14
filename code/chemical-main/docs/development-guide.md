# 开发指南

## 环境要求

| 组件 | 版本 |
|------|------|
| Node.js | ≥ 18.x |
| Java | ≥ 21 |
| Python | ≥ 3.11 |
| Maven | ≥ 3.8 |
| MySQL | ≥ 8.0 |

## 项目结构

```
localhost/
├── backend/                 # Java Spring Boot 后端
│   ├── src/main/java/    # Java 源码
│   └── pom.xml           # Maven 配置
├── frontend/               # Vue3 + TypeScript 前端
│   ├── src/              # 前端源码
│   ├── package.json      # npm 依赖
│   └── vite.config.ts    # Vite 配置
├── algorithm/               # Python 算法服务
│   ├── api_server.py     # FastAPI 入口
│   ├── diffusion/        # 气体扩散模块
│   ├── inversion/        # 解析式溯源、EKI 与粒子滤波模块
│   ├── planning/         # 路径规划模块
│   └── requirements.txt  # legacy uv export; pyproject.toml + uv.lock are canonical
├── docs/                 # 规范文档
└── README.md             # 项目说明
```

## 快速启动

### 1. Java 后端

```bash
cd backend
mvn -Dspring-boot.run.profiles=local spring-boot:run
# 服务运行在 http://localhost:8081
```

### 2. Python 算法服务

```bash
# 在仓库根目录执行，uv 会按 uv.lock 创建并同步 .venv
uv sync

# 从仓库根目录按 Python 包启动算法服务
uv run uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000 --reload
# 服务运行在 http://localhost:8000
# API 文档：http://localhost:8000/docs

# YOLO 人员识别是额外能力；本地启动前必须安装 yolo extra
uv sync --extra yolo
uv run uvicorn algorithm.polo:app --host 127.0.0.1 --port 8001 --reload
# 服务运行在 http://localhost:8001
```

### 3. 前端

```bash
cd frontend
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

### 4. 访问系统

打开浏览器访问 `http://localhost:5173`

- 前端 → `localhost:5173` → 代理 `/api/*` 到 Java 后端 `:8081`
- 前端 → `localhost:5173` → 代理 `/algorithm-api/*` 到 Python 算法 `:8000`

## 开发工作流

### 代码规范检查

```bash
# 前端
cd frontend
npm run lint          # ESLint 检查
npm run fix           # ESLint 自动修复
npm run format        # Prettier 格式化
npm run lint:style    # StyleLint 样式检查

# Python
cd algorithm
ruff check .          # ruff 检查
ruff format .         # ruff 格式化

# Java
cd backend
mvn compile           # 编译检查
```

### 构建验证

```bash
# 前端
cd frontend && npm run build

# Java 后端
cd backend && mvn package

# Python（语法检查）
cd algorithm && python -m py_compile api_server.py
```

## 环境变量

### 前端 (`frontend/.env.*`)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_APP_BASE_API` | `/api` | Java 后端 API 前缀 |
| `VITE_ALGORITHM_BASE_API` | `/algorithm-api` | Python 算法 API 前缀 |

`VITE_SERVE=http://localhost:8081` 与 `VITE_ALGORITHM_SERVE=http://localhost:8000` 仅用于 `.env.development` 的 Vite dev proxy。生产构建使用相对路径 `/api`、`/algorithm-api`，由 Nginx 或部署网关转发，不能在 `.env.production` 写固定服务器地址。

## Git 规范

### 提交信息格式
```
<type>(<scope>): <subject>

<body>
```

### type 类型
| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 |
| docs | 文档 |
| style | 格式 |
| refactor | 重构 |
| test | 测试 |
| chore | 构建/工具 |

### 分支策略
- `main` — 主分支，保持稳定
- `feature/*` — 功能开发分支
- `fix/*` — 修复分支
