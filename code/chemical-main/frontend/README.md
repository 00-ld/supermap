# Frontend Application

本目录存放 Vue 3 前端管理系统，负责主页态势展示、三维园区入口、扩散与溯源、小车管理、监控数据管理、人员管理和 404 页面。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- ECharts
- Canvas
- SuperMap iPortal 数字大屏嵌入

## 页面与目录

```text
frontend/
  src/views/home/             主页态势展示
  src/views/screen/           数字园区及其二维算法工作区
  src/views/car/              小车管理
  src/views/yolo/             小车图片识别页面
  src/views/thing/            监控数据管理
  src/views/acl/              人员、角色、权限管理
  src/views/404/              统一 404 页面
  src/api/                    API 请求封装
  src/data/                   前端静态业务数据
  public/                     前端静态资源
```

主要路由约束：

| 路由                     | 页面                                        | 职责                                    |
| ------------------------ | ------------------------------------------- | --------------------------------------- |
| `/home`                  | `src/views/home/index.vue`                  | 首页态势总览，只做可视化与快捷入口      |
| `/screen`                | `src/views/screen/index.vue`                | 数字园区、二维扩散/溯源工作区与三维场景 |
| `/thing/monitor_history` | `src/views/thing/monitor_history/index.vue` | 实时预警与监控数据记录                  |
| `/car/home`              | `src/views/car/CarHome.vue`                 | 阿克曼巡检小车总览                      |
| `/car/:id`               | `src/views/car/CarDetail.vue`               | 小车详情                                |
| `/acl/role`              | `src/views/acl/role/index.vue`              | 管理员/角色管理                         |
| `/acl/employee`          | `src/views/acl/employee/index.vue`          | 员工与人员信息管理                      |
| `/yolo`                  | `src/views/yolo/Home.vue`                   | YOLO11m 巡检图片人员识别                |
| `/404`                   | `src/views/404/index.vue`                   | 统一 404 页面                           |

目录命名约束：

- 一级页面目录使用小写英文或小写蛇形命名，例如 `home`、`screen`、`car`、`emergency`。
- 历史目录 `Car/`、`YOLO/` 已归并为 `car/`、`yolo/`；数字园区共享地图能力统一放在 `screen/map-workspace/`，不得恢复独立地图页面或重复入口。
- 不得新增中文目录、空格目录、测试副本目录或重复入口文件。
- 页面私有说明文档可以放在对应页面目录下，例如 `src/views/home/README.md`。

## 运行命令

安装依赖：

```bash
npm ci
```

本地开发：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck:strict
```

生产构建：

```bash
npm run build:pro
```

Windows PowerShell 如果提示 `npm.ps1` 被执行策略拦截，可以使用：

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck:strict
npm.cmd run build:pro
```

当前生产构建在 `vite.config.ts` 中关闭 minify，以避开 Windows + Node 25 + esbuild 0.18 的原生压缩崩溃；升级构建链路并验证后可重新评估压缩策略。

## 维护规则

- 页面风格必须与现有深色工业监控风格保持一致，不得随意改成营销页或完全不同的视觉体系。
- 新增接口调用必须放入 `src/api/` 或统一请求封装，不得在页面中散落硬编码 URL。
- 三维展示优先接入已建设的 SuperMap iPortal 数字大屏；Three.js/SuperMap 三维扩展应保持与 iPortal 数据接口兼容。
- Canvas 和 ECharts 相关高频渲染逻辑应避免在组件中重复定义同义变量和重复函数。
- 主页、数字园区、小车管理、监控数据管理、人员管理和 404 页面均应保持可访问。
- 前端只能保存公开配置，不得在 `.env.*`、页面代码或构建产物中写入真实 API Key、token、数据库密码或用户密码。
- 真实天气、地图、AI 和第三方服务密钥必须经后端或部署网关注入，不得由浏览器直连携带密钥访问。
- `dist/`、`node_modules/`、临时截图、未压缩大文件和真实密钥不得提交到 GitHub。
- 图片、视频和模型资源应先确认用途；无法说明来源、用途或授权的资源不得新增提交。
- `src/data/` 仅保存园区资产、坐标、气体配置等公开前端常量；人员、巡检和监测记录应通过后端接口返回，不得重新引入本地人员台账种子文件。

## 环境变量

生产环境配置位于 `.env.production`，本地开发配置位于 `.env.development`。真实密钥不得写入前端环境文件；前端只能保存公开可见配置，例如 API 相对路径和 iPortal 大屏 URL。`VITE_SERVE` 与 `VITE_ALGORITHM_SERVE` 只用于 Vite 本地开发代理，不属于浏览器生产运行时配置。

常用变量：

- `VITE_APP_BASE_API`
- `VITE_ALGORITHM_BASE_API`
- `VITE_IPORTAL_DASHBOARD_URL`

## 提交检查

Husky hook 位于 `frontend/.husky/`。本项目使用 npm 和 `package-lock.json`，不得新增 pnpm/yarn 锁文件。

提交前至少执行：

```bash
npm run typecheck:strict
```

从仓库根目录还应执行：

```bash
python tools/audit_repository.py
```

如修改了路由、构建配置、关键页面或依赖，应额外执行：

```bash
npm run build:pro
```
