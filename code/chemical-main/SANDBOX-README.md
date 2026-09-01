# 三比赛项目沙箱隔离说明

> 一套"化工园区危险气体监测溯源系统"打了三个比赛。本文档说明三个项目的运行边界与本地沙箱隔离方案。
> 本文件在测绘、超图杯两个项目根目录各放一份，内容相同互相引用。

## 1. 三个项目概览

| 比赛 | 项目名 | 代码位置 | 运行方式 | 访问地址 |
|------|--------|---------|---------|---------|
| 计算机设计大赛 | 智监溯源 | github.com/119tab/chemical（**本地不 clone**） | 仅服务器 | www.chemgas.lab6119.xyz |
| 测绘技能大赛 | 智孪安澜 | `E:\Migrated_From_C\Users\colorful\Desktop\localhost` | 服务器+本地沙箱 | www.cehui2026.lab6119.xyz / 本地 5173 |
| 超图杯 | 时空智能数字孪生 | `G:\竞赛\超图杯\code\chemical-main` | **纯本地沙箱** | 本地 6173 |

## 2. 计设大赛边界（不本地化）

- 代码只在 GitHub（github.com/119tab/chemical）和服务器，**本地不 clone、不运行、不修改**。
- 服务器数据库保持现状不动（计设与测绘线上曾共用服务器 Docker DB，本次不处理服务器侧）。
- 测绘本地仓库里以 git remote 名 `jishe` 保留对计设仓库的只读对照，**绝不会误推**（push 默认走 `origin`=测绘自己）。

## 3. 本地两沙箱隔离表

### 端口分配（完全不冲突）

| 服务 | 测绘沙箱 | 超图杯沙箱 | 本机已占用 |
|------|---------|-----------|-----------|
| MySQL 宿主端口 | 3307 | 3407 | 3306（原生 MySQL95） |
| 算法 API (uvicorn) | 8000 | 8100 | — |
| YOLO Person API | 8001 | 8101 | — |
| Java 后端 (Spring) | 8081 | 8181 | — |
| 前端 dev (Vite) | 5173 | 6173 | 5174（残留） |
| SuperMap Bridge | 8190 | —（超图杯不起） | — |

### 容器名 / 数据卷名 / 库名

| 资源 | 测绘沙箱 | 超图杯沙箱 |
|------|---------|-----------|
| MySQL 容器名 | `cehui-mysql` | `chaotu-mysql` |
| legacy 容器名 | `cehui-local-mysql` | `chaotu-local-mysql` |
| 数据卷 | `cehui_mysql_data` | `chaotu_mysql_data` |
| 库名（容器内） | `chemical`（不改） | `chemical`（不改） |
| 镜像 | mysql:8.0（共享） | mysql:8.0（共享） |

> 库名都叫 chemical 但不冲突：两个独立容器 + 两个独立数据卷 = 两个独立 mysqld 实例，同名库互不可见、数据互不串。

## 4. 启动 / 停止命令

### 测绘沙箱（在 `E:\Migrated_From_C\Users\colorful\Desktop\localhost`）
```
启动：双击 sandbox-start.bat      （或命令行 ./sandbox-start.bat）
停止：双击 sandbox-shutdown.bat
前端：http://127.0.0.1:5173/index.html
```

### 超图杯沙箱（在 `G:\竞赛\超图杯\code\chemical-main`）
```
启动：双击 sandbox-run.bat        （或命令行 ./sandbox-run.bat）
停止：双击 sandbox-shutdown.bat
前端：http://127.0.0.1:6173/index.html
```

### 重要约束
- **不要同时冷启动两个沙箱**：会争抢 Docker Desktop 启动，可能两个都超时。正确顺序：先启动一个（等 Docker ready + MySQL ready），再启动第二个。
- 首次跑前建议先 `docker pull mysql:8.0` 预热镜像，并确认 Docker Desktop 已启动（托盘变绿）。
- Docker 冷启动可能超 180s，超时则手动启动 Docker Desktop 后重跑沙箱脚本。

## 5. 原脚本保留说明（不要误用）

以下原脚本保留不动，对应各自仓库的默认行为（端口 3307/8000/8001/8081/5173、容器 chemical-mysql）：
- 测绘：`startup.bat` / `shutdown.bat` / `start.bat`
- 超图杯：`run-local.bat` / `shutdown.bat` / `start.bat` / `startup.bat`

> ⚠️ 超图杯目录里的 `start.bat` / `startup.bat` 是从测绘仓库继承的副本，仍用原端口，**会撞测绘**。超图杯一律走 `sandbox-run.bat`，不要双击 start.bat。

> 两项目的原脚本端口/容器名完全相同，直接同时跑会互相误杀。沙箱脚本已通过端口平移 + 容器名前缀彻底分开。

## 6. git remote 状态（测绘仓库）

测绘本地仓库 `E:\Migrated_From_C\Users\colorful\Desktop\localhost` 已修复：
- `origin` = `git@github.com:00-ld/chemical-park-monitor.git`（测绘自己，push 默认目标）
- `jishe` = `https://github.com/119tab/chemical.git`（计设大赛，只读对照，不推）
- main / appmod/java-upgrade-20260521025910 / security-fix / sensor-risk 四个分支均跟踪 `origin`（测绘自己）。

超图杯仓库 origin = `https://github.com/00-ld/supermap.git`，本来就正确，无需改。

## 7. 关键变量注入（给未来 AI 看）

沙箱脚本除改端口/容器名外，还补了原脚本遗漏的两个变量注入（不改任何 yml/py/ts 源码）：
- `ALGORITHM_CORS_ORIGINS`：FastAPI 算法服务 CORS 白名单。`service_config.py` 默认只含 5173/3000/8081，超图杯用 6173 不补会被 CORS 拦。沙箱脚本在生成算法服务运行文件时注入 = `%CORS_ALLOWED_ORIGINS%`。
- `VITE_SERVE` / `VITE_ALGORITHM_SERVE`：Vite dev proxy 转发目标。不补则默认 8081/8000，超图杯沙箱后端 8181、算法 8100 会全 404。沙箱脚本在生成后端/前端运行文件时注入。

## 8. 常见问题

| 现象 | 原因 | 解决 |
|------|------|------|
| Docker Desktop did not become ready | daemon 没启动或冷启动超 180s | 手动启动 Docker Desktop，等托盘变绿后重跑沙箱脚本 |
| 前端调算法/后端报 CORS | ALGORITHM_CORS_ORIGINS 未注入 | 检查沙箱脚本 :start_uvicorn 段是否有该 echo 行 |
| 前端请求全 404 | VITE_SERVE/VITE_ALGORITHM_SERVE 未注入 | 检查沙箱脚本 :start_service 段是否有该 echo 行 |
| 端口被占 | 上次进程没停干净 | 用对应项目的 `sandbox-shutdown.bat`（勿用原 shutdown.bat，会误杀对方） |
| 超图杯 8101(YOLO) 没起 | 缺 models/yolo11m.pt 权重 | 正常现象，主流程不受影响；要跑 YOLO 需下载权重到 models/ |
| 后端 mvn 0 输出、8181 不起 | `"mvn.cmd"` 依赖 PATH，从受限父进程启动时 where 拒绝访问 | 沙箱已加 `:resolve_tools` 用 `dir /s /b` 扫盘找 mvn/npm/uv 绝对路径，不依赖 where |
| 后端报 `port 8081 already in use` | application-local.yml `server.port=${SERVER_PORT:8081}` 默认 8081，与测绘撞 | 沙箱已注入 `SERVER_PORT=8181`（主脚本 + 生成的 run-8181.bat 都有）|
| cmd 报 `此时不应有 not` / `was unexpected` | `if (...) else (...)` 多行块在中文路径下解析失败 | 沙箱已把所有 `if` 块改成 goto 跳转逻辑，避免括号块 |
| uv sync 报 `'""' 不是内部命令` | `:resolve_tools` 在 uv sync 之后才跑，UV_CMD 为空 | 沙箱已把 `:resolve_tools` 调用提到 uv sync 之前 |
| .env.local 变量读不到（USERNAME 空） | .env.local 是 UTF-8+LF，GBK cmd 的 for/f 解析中文注释错乱 | .env.local 已转 GBK+CRLF；如重新生成请保持 GBK 编码 |

## 9. 验证清单

启动两沙箱后按此确认隔离生效：
1. `netstat -ano | findstr LISTENING | findstr ":3307 :3407 :8000 :8100 :8081 :8181 :5173 :6173"` — 每端口只有一个 LISTENING
2. `docker ps` — 见 cehui-mysql(3307) + chaotu-mysql(3407)，不见 chemical-*
3. `docker volume ls | findstr cehui chaotu` — 两个独立卷
4. 浏览器开 5173（测绘）和 6173（超图杯），F12 Network 无 CORS 报错
5. 停超图杯 sandbox-shutdown.bat，确认只停 chaotu-mysql + 8100/8101/8181/6173，测绘端口仍 LISTENING；反之亦然
