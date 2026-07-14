# 化工园区智能监测系统 — 开发改造总结

> 本文是历史开发改造总结，只保留历史改造记录，不作为当前启动、部署、接口或账号操作手册。
> 当前运行入口以根目录 `README.md`、`docs/development-guide.md`、`algorithm/README.md`、`backend/README.md` 和 `deploy/README.md` 为准。

## 一、项目概述

化工园区智能安防监测系统，集成环境监控、分级预警、泄漏溯源、三维可视化、智能小车调度五大联动模块。前后端分离架构：Vue3 前端 + Spring Boot 后端 + Python FastAPI 算法服务。

---

## 二、代码规范化改造

### 2.1 Python 算法代码规范化（21 个文件）

| 操作 | 详情 |
|------|------|
| 修复编码 | `requirements.txt` 字符间距错乱问题 |
| Google docstring | 所有模块添加模块级和函数级 Google 风格文档注释 |
| 导入排序 | 标准库 → 第三方库 → 本地模块，每组按字母序 |
| 类型注解 | 补全所有函数参数和返回值类型注解 |
| 修复 Bug | `task_router.py` 相对导入 `from ..diffusion` → `from diffusion` |

### 2.2 Python API 统一响应格式

- 创建 `algorithm/response_utils.py`：`success_response()` / `error_response()`
- 当前主契约：`{"code": int, "message": string, "data": ..., "ok": bool, "timestamp": number, "requestId": string}`。
- `success/error` 不再作为算法外层信封兼容字段复制；业务成功状态、错误细节、版本、耗时、灰度和回滚信息放在 `data` 内的领域结果与 trace 元数据中。
- 全局异常处理器 `@app.exception_handler(Exception)`
- 涉及：`api_server.py`、`engine/task_router.py`

### 2.3 Java 后端规范化（backend/）

| 操作 | 详情 |
|------|------|
| 响应统一 | 历史版本曾使用 `ResponseEntity<Result<T>>`；当前业务 Controller 已收口为直接返回 `Result<T>` / `Result<?>`，HTTP 状态语义集中在异常边界 |
| 全局异常 | 创建 `GlobalExceptionHandler.java`（`@RestControllerAdvice`） |
| 参数校验 | 添加 `@Valid` / `@NotBlank` 注解 + `spring-boot-starter-validation` |
| 日志 | 所有 Controller/Service 添加 `@Slf4j` + `log.info/warn/error` |
| 清理 | 删除 22 个 JVM 崩溃日志文件（`hs_err_pid*`、`replay_pid*`） |
| 端口变更 | 8080 → 8081（被 WeChat Server Manager 占用） |

### 2.4 Vue3 前端规范化（frontend/src/）

| 操作 | 详情 |
|------|------|
| 组件规范 | 修复 4 个文件缺失 `lang="ts"`，合并双 `<script>` 为 `defineOptions` |
| 类型安全 | 消除 `: any`，新增 `CarItem`、`DetectionLog` 等接口定义 |
| UI 改进 | `alert()` → `ElMessage` 全局替换 |
| 死代码 | 删除孤立路由、空函数、注释代码 |
| 清理 | 删除 `__pycache__`、空目录 |

### 2.5 移除前端嵌入式算法代码

**核心改造：前端不再含有算法逻辑，全部通过 API 调用后端 Python 服务。**

| 删除内容 | 文件数 | 说明 |
|----------|--------|------|
| Python 代码副本 | 15 | `gas_zero_backend_system/algorithm/` |
| Pyodide Worker | 3 | 浏览器内运行 Python 的 Worker |
| JS 算法实现 | 9 | diffusion, analytic-inversion, evacuation 等 |
| 类型声明 | 1 | `*.py?raw` 声明 |

**新增内容：**

| 文件 | 说明 |
|------|------|
| `src/api/algorithm.ts` | 算法 API 函数（扩散、溯源、规划、引擎） |
| `src/api/algorithmClient.ts` | 独立 axios 实例，指向 Python 算法服务器 |
| `src/data/phase1Config.ts` | 气体配置常量 + 浓度查询工具函数 |
| `src/data/parkAssets.js` | 历史园区资产静态数据；当前运行时园区资产以 `src/data/realMapAssets.js` 和后端接口为准 |
| `src/data/coordinate.js` | 坐标转换工具 |
| `src/data/gasSourceCatalog.js` | 气体源配置数据 |
| `src/data/carPatrolRoutes.js` | 小车巡逻路径数据 |

**配置更新：**

| 文件 | 变更 |
|------|------|
| `vite.config.ts` | 历史版本新增 `/algorithm-api` 开发代理；当前运行口径以 `README.md`、`frontend/.env.development`、`deploy/nginx/default.conf` 为准 |
| `.env.development` | 当前只保留前端真实消费的运行时变量；开发代理目标在 Vite 配置中维护 |
| `.env.production` | 当前生产构建不声明开发代理目标或固定服务地址 |

### 2.6 项目配置文档

| 文件 | 说明 |
|------|------|
| `README.md` | 项目简介、技术栈、目录结构、启动指南 |
| `.gitignore` | 排除 target, dist, node_modules, venv, log 等 |
| `pyproject.toml` | ruff 格式/检查配置 |

---

## 三、Bug 修复

### 3.1 登录/注册双重 `/api` 路径

```
历史问题: request.ts baseURL = /api，旧版 API 路径曾写为 /api/user/login
当时结果: 实际请求 /api/api/user/login → 404
当前口径: 登录接口为 /api/auth/login，注册接口为 /api/auth/register
修复: 去掉 API 枚举中的 /api 前缀，并以 /api/auth/* 作为认证入口
```

### 3.2 后端端口冲突

```
问题: 端口 8080 被 WeServerManager.exe (微信服务) 占用
结果: 后端新代码未生效，旧代码返回错误响应
修复: 后端改为 8081 端口
```

### 3.3 `message` 与 `error` 字段不匹配

```
问题: Java Result 返回 error 字段，前端用 message 获取
修复: 改为 res.error || res.message || '默认错误信息'
```

---

## 四、规范文档

| 文档 | 路径 | 内容 |
|------|------|------|
| 系统架构 | `docs/architecture.md` | 整体架构图、五大模块、算法说明、数据流转 |
| API 接口 | `docs/api-reference.md` | 全部 API 端点、请求/响应格式、状态码 |
| 编码规范 | `docs/coding-standards.md` | Google 风格、Vue3/Java/Python 各自规范 |
| 开发指南 | `docs/development-guide.md` | 环境要求、启动步骤、开发工作流、Git 规范 |
| 本改造总结 | `docs/changelog.md` | 本次所有改造内容 |

---

## 六、第二次修复（扩散动画 & 算法服务）

### 6.1 扩散模拟与 analytic-inversion 算法修复

| 问题 | 原因 | 修复 |
|------|------|------|
| **扩散模拟失败** | `phase1_diffusion.py` 缺少 `clamp` 导入 | 添加 `from diffusion.cfd_calibrator import clamp` |
| **FastAPI 启动失败** | FastAPI 0.115.0 与 starlette 0.36.3 不兼容 | 降级至 FastAPI 0.109.2 |
| **扩散无动画** | 前端 payload 字段名与后端不匹配（8 处） | 统一字段名：`sourcePoint→sourceMapPoint`, `windAngle→windDirection`, `stability→stabilityClass` 等 |
| **Python 缓存导致旧代码运行** | `__pycache__` 缓存未编译的 `.pyc` | 清除所有 `__pycache__` 目录 |
| **端口 8000 被旧进程占用** | 旧 Python 进程顽固占用 | 用 PowerShell `Stop-Process -Force` 强杀后重启 |

### 6.2 其他修复

| 问题 | 修复 |
|------|------|
| **`evacuationSummary` 空值报错** | computed 在无规划路线时返回默认值对象而非 `null` |
| **后端端口 8080→8081 未同步** | 7 个前端文件硬编码 `localhost:8080` 全部修复 |
| **算法 API 路径缺少 `/api/`** | `algorithm.ts` 路径添加 `/api/` 前缀 |

---

## 七、当前运行入口

本文件不再维护启动命令、访问地址或测试账号。当前启动和部署请读取：

- 根目录 `README.md`
- `docs/development-guide.md`
- `algorithm/README.md`
- `backend/README.md`
- `deploy/README.md`

`deploy/mysql/init.sql` 不写入默认管理员账号。需要登录验证时，请使用本地已注册并被显式提升角色的开发账号；不要把账号密码写入仓库文档或 SQL 种子。
