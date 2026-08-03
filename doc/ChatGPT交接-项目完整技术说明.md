# ChatGPT 交接文档：超图杯化工园区数字孪生项目完整技术说明

> **用途**：给 ChatGPT / 其他 AI 网页端快速阅读，建立对项目代码、算法、运行方式、答辩重点的完整上下文。  
> **更新时间**：2026-07-24  
> **主代码路径**：`G:\竞赛\超图杯\code\chemical-main`  
> **总工作区**：`G:\竞赛\超图杯`  
> **阅读建议**：先读第 1–4 章建立全局，再按任务深入第 5 章（算法）与第 8–9 章（答辩/PPT）。

---

## 0. 给 AI 的一页摘要（先读这段）

这是一个**超图杯**参赛作品，不是普通企业管理系统。

- **GIS 底座**：SuperMap 产品链（iDesktopX → iServer → iPortal → iClient2D/iClient3D）
- **业务与算法**：Vue3 前端 + Spring Boot 后端 + FastAPI 算法服务
- **核心创新算法（必须讲清楚）**：
  1. **气体扩散**：物理教师模型（条件化对流-扩散）+ PyTorch 深度代理（MLP surrogate）
  2. **泄漏源溯源**：粗网格搜索 → 两阶段 EKI 解析反演 → 改进粒子滤波（状态 `[X,Y,Q]`）
  3. **疏散路径**：危险浓度 mask + 道路图上的 **D\* Lite** 动态重规划
  4. **视觉识别**：YOLO11m 巡检图片人员检测（独立 8001 端口）
- **展示分工铁律**：**二维做后台计算引擎，三维做前台投影仪**
- **数据诚实边界**：当前无真实硬件连续采集；传感器读数是仿真/手工/巡检图片链路，答辩不得说成现场实测

---

## 1. 项目名称（重要：不要和别的比赛搞混）

### 1.1 超图杯正式名称（以代码与前端标题为准）

**基于时空智能和数字孪生的化工园区危险气体监测和溯源系统**

- 前端 `index.html` / `setting.ts` 标题即此全称  
- 仓库 README、架构文档、总结稿均使用此名  
- 沙箱说明里超图杯简称：**时空智能数字孪生**

英文语境可简称：Chemical Park Gas Detection, Diffusion, Source Tracing & Digital Twin Platform

### 1.2 容易混淆的另一个名字（不是超图杯）

**智孪安澜** 属于**测绘技能大赛**作品名，不是超图杯正式报名/答辩名。

依据：`code/chemical-main/SANDBOX-README.md` 对照表：

| 比赛 | 作品/简称 | 工程位置 |
|------|-----------|----------|
| **超图杯** | **时空智能数字孪生**（全称见上） | `G:\竞赛\超图杯\code\chemical-main` |
| 测绘技能大赛 | 智孪安澜 | 另有工程/域名（如 cehui2026） |

> 注意：`doc/作品后续优化点汇报.md` 里曾写过「智孪安澜」作品名，那是写给老师的优化汇报口径，**与代码内超图杯正式标题不一致**。给 ChatGPT、PPT、答辩统一用下面 1.1 全称，避免串赛。

### 1.3 如何选用（超图杯）

| 场景 | 建议用名 |
|------|----------|
| PPT 封面、答辩开场、评委材料 | **基于时空智能和数字孪生的化工园区危险气体监测和溯源系统**（可副标题写「超图杯参赛作品」） |
| 口头简称 | **时空智能数字孪生** / **化工园区气体监测溯源系统** |
| 代码仓库 README、接口文档、架构文档 | 同上全称 |
| 目录/服务名 | `chemical-main`、`chemgas`（历史部署域名） |
| **不要用** | **智孪安澜**（那是测绘赛，不是超图杯） |

**结论（超图杯）**：正式名称只有一个——**基于时空智能和数字孪生的化工园区危险气体监测和溯源系统**；简称「时空智能数字孪生」。**智孪安澜 ≠ 本赛作品名。**

### 1.4 参赛叙事统一口径（可直接用于 PPT）

> 本作品基于 SuperMap GIS 平台构建化工园区数字孪生底座，采用 iDesktopX 完成园区空间数据整理与制图，利用 iServer 发布二维地图、三维场景与空间分析服务，通过 iPortal 统一管理 GIS 资源，并基于 iClient2D/iClient3D 构建 Web 端应急态势应用。系统融合扩散模拟、泄漏源反演和疏散路径规划算法，将算法结果实时映射为空间图层，实现「感知—模拟—溯源—决策—三维表达」的一体化应急管理闭环。

---

## 2. 目录与仓库地图

### 2.1 总工作区 `G:\竞赛\超图杯`

```text
G:\竞赛\超图杯
├─ code\chemical-main\          ★ 主代码工程（前后端算法都在这里）
├─ doc\                         交接、总结、优化点、本文件
├─ 思路图\                      SuperMap-first 路线图 HTML/JSON
├─ 园区大屏部署\                大屏 zip、三维瓦片、气体视频资源
├─ 报告素材\                    验收截图、发布记录、坐标验证证据
├─ supermap_bslicense\          SuperMap 许可服务
├─ 移动端\                      Android（iMobile 相关）工程
├─ 私密文件\                    ★ 含密码/服务器信息，禁止写入公开材料
├─ codex历史对话\               历史会话导出
└─ readme.md                    总入口说明
```

### 2.2 主工程 `code\chemical-main` 结构

```text
chemical-main/
├─ frontend/          Vue 3 + TS + Vite + Element Plus + Pinia
│                     SuperMap iClient2D / iClient3D 接入
├─ backend/           Spring Boot 3.4 + JDK 21 + MyBatis + MySQL + JWT
├─ algorithm/         ★ FastAPI 算法服务（扩散/溯源/疏散）
│   ├─ api_server.py          HTTP 入口
│   ├─ polo.py                YOLO 服务入口（8001）
│   ├─ engine/task_router.py  任务路由
│   ├─ diffusion/             扩散
│   ├─ inversion/             溯源反演
│   ├─ planning/              疏散规划
│   └─ deep_learning/         深度代理模型
├─ models/            deep_gas_surrogate.pt 等权重（可不提交大文件）
├─ datasets/          Prairie Grass 等样本与来源说明
├─ tests/             可复现案例数据 + 正向模型测试
├─ db/                数据库台账与迁移
├─ deploy/            Docker Compose / Nginx / MySQL 初始化
├─ docs/              架构、API、超图分工、验收文档
├─ scripts/           CDP / Playwright 三维验收脚本
├─ tools/             审计、数据整理工具
├─ twin/              数字孪生资料
├─ run-local.bat      ★ 本地一键启动（推荐）
├─ startup.bat / shutdown.bat
├─ pyproject.toml / uv.lock
└─ README.md / AGENTS.md
```

---

## 3. 系统架构

### 3.1 逻辑架构

```text
┌──────────────────────────────────────────────────────────────┐
│  前端 Vue3 (5173)                                              │
│  /screen 三维态势  |  /smart-map 智慧地图  |  业务后台页面      │
│  iClient3D / iClient2D + Canvas 业务层 + 算法调用封装           │
└───────────────┬─────────────────────────────┬────────────────┘
                │ REST + JWT                   │ X-API-Key
                ▼                              ▼
┌───────────────────────────┐    ┌─────────────────────────────┐
│ Java 后端 Spring Boot      │    │ Python 算法 FastAPI          │
│ 127.0.0.1:8081             │    │ 127.0.0.1:8000               │
│ 用户/传感器/告警/小车/任务  │    │ 扩散/溯源/疏散               │
│ YOLO 代理调用              │───▶│ YOLO 独立服务 :8001          │
└─────────────┬─────────────┘    └─────────────────────────────┘
              │
              ▼
        MySQL (本地 Docker 常用 3307)
              │
              ▼
   SuperMap iServer / iPortal（地图、三维 S3M、网络分析、资源门户）
```

### 3.2 SuperMap vs 自研 分工（超图杯核心）

| 归属 | 内容 |
|------|------|
| **SuperMap** | 空间数据整理、服务发布、二维地图、三维 S3M 场景、空间查询/缓冲/网络分析表达、iPortal 资源与大屏 |
| **自研** | 气体扩散、泄漏源反演、D\* Lite 动态疏散、YOLO、业务后端、应急流程、交互与答辩叙事 |

**一句话**：SuperMap 做 GIS 主干；自研做化工安全推理与业务闭环。算法结果必须落成空间图层，而不是只在面板显示「算法在线」。

### 3.3 二维计算 / 三维投影原则

```text
三维场景点击建筑/装置
  → 拿到 CGCS2000 坐标 / SmID
  → 二维 iServer Data / Network Analysis 做空间计算（或 Python 规划兜底）
  → FastAPI 跑扩散 / 粒子滤波 / D* Lite
  → 返回 JSON/GeoJSON（XY + 可选 Z 高度）
  → iClient3D 抬高渲染云团、概率地形、疏散路线
```

坐标口径（发布版）：

| 用途 | 坐标系 |
|------|--------|
| 地图/三维 XY | `EPSG:4547`（CGCS2000 3 度带） |
| 经纬度备案 | `EPSG:4490` |
| Z | 米（仅可视化抬高、相机高度） |

---

## 4. 如何运行

### 4.1 依赖

| 工具 | 版本要求 |
|------|----------|
| Node.js | 20–24（本机 v25 也可） |
| Python | 3.11+（用 `uv` 管理） |
| JDK | 21 |
| Maven | 3.9+ |
| Docker Desktop | 仅用于本地 MySQL 容器 |
| SuperMap 许可 | 三维/iServer 演示时需要本机或服务器许可 |

### 4.2 推荐：一键本地启动

```powershell
cd G:\竞赛\超图杯\code\chemical-main
.\run-local.bat
```

`run-local.bat` 会：

1. 读取 `.env.local`（首次可用 `.env.local.example`）
2. 启动 Docker MySQL `chemical-local-mysql`（`127.0.0.1:3307`）
3. 启动算法服务 `127.0.0.1:8000`
4. 启动 YOLO `127.0.0.1:8001`
5. 启动 Java 后端 `127.0.0.1:8081`（`local` profile）
6. 启动前端 `127.0.0.1:5173`

停止：

```powershell
.\shutdown.bat
```

### 4.3 服务地址速查

| 服务 | 地址 |
|------|------|
| 前端 | http://127.0.0.1:5173/index.html |
| 三维大屏入口 | http://127.0.0.1:5173/screen |
| 智慧地图 | http://127.0.0.1:5173/smart-map |
| 后端 API | http://127.0.0.1:8081/api |
| 算法健康检查 | http://127.0.0.1:8000/api/health |
| YOLO 文档 | http://127.0.0.1:8001/docs |

### 4.4 仅启动算法服务（开发调试）

在仓库根目录 `chemical-main`：

```bash
# 基础算法依赖
uv sync --frozen --no-dev --no-install-project
uv run uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000 --reload

# YOLO（体积大，需 extra）
uv sync --frozen --no-dev --no-install-project --extra yolo
uv run uvicorn algorithm.polo:app --host 127.0.0.1 --port 8001 --reload
```

本地调试可把 `ALGORITHM_REQUIRE_AUTH=false`（仅绑定 127.0.0.1）。生产必须 `true` + `ALGORITHM_API_KEY`。

### 4.5 算法自测命令（验收用）

从 `chemical-main` 根目录：

```bash
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.diffusion.test_real_prairie_grass
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
uv run --no-sync python -m algorithm.planning.test_dstar_lite
uv run --no-sync python -m tests.test_forward_model
uv run --no-sync python -m algorithm.tests.test_path_hazard_avoidance
```

注意：必须用 `python -m ...`，直接 `python tests\xxx.py` 可能因包路径失败。

### 4.6 线上入口（历史/演示）

- Web：`https://www.chemgas.lab6119.xyz`
- iPortal 大屏曾存在不稳定（401/502），**不要把 iframe 大屏当唯一演示入口**；优先 `/screen` 原生 iClient3D。

---

## 5. 算法部分（最详细）

### 5.1 总览：算法服务如何组织

**唯一公共 HTTP 入口**：`algorithm/api_server.py`  
**统一任务路由**：`algorithm/engine/task_router.py`  
**统一响应信封**：`{code, ok, message, timestamp, requestId, data}`，`data` 内带 trace（耗时、算法版本、灰度、fallback 等）

#### 5.1.1 公开 HTTP 路由

| 方法 | 路径 | task_type | 作用 |
|------|------|-----------|------|
| GET | `/api/health` | — | 健康检查（通常免鉴权） |
| GET | `/api/gas-types` | — | 气体目录 CO/NH3/CH4/O2 |
| POST | `/api/engine/run` | 任意支持类型 | 统一引擎入口 |
| POST | `/api/diffusion/simulate` | `run_diffusion_simulation` | 扩散仿真 |
| POST | `/api/inversion/coarse-search` | `run_grid_search` | 粗搜索候选区 |
| POST | `/api/inversion/solve` | `run_analytic_inversion` | 两阶段 EKI 解析溯源 |
| POST | `/api/inversion/particle-filter` | `run_particle_filter_inversion` | 粒子滤波溯源 |
| POST | `/api/planning/evacuation` | `run_evacuation_planning` | 疏散规划 |
| GET | `/api/deep-learning/btex-validation` | — | 验证报告 |
| GET | `/api/deep-learning/prairie-grass-source-validation` | — | Prairie Grass 源反演验证报告 |

鉴权：请求头 `X-API-Key`。

#### 5.1.2 路由分发代码位置

`algorithm/engine/task_router.py`：

```text
run_diffusion_simulation        → diffusion/diffusion_runner.py
run_evacuation_planning         → planning/evacuation_runner.py
run_grid_search                 → inversion/inversion_runner.py
run_analytic_inversion          → inversion/inversion_runner.py
run_particle_filter_inversion   → inversion/inversion_runner.py → particle_filter.py
```

#### 5.1.3 前端调用封装

`frontend/src/api/algorithm.ts`：

- `runDiffusionSimulation`
- `runAnalyticCoarseSearch`
- `runAnalyticSourceInversion`
- `runParticleFilterInversion`
- `runEvacuationPlanning`
- `checkAlgorithmHealth`

智慧地图侧大量编排逻辑在：

- `frontend/src/views/smart_map/useSmartMapDiffusionSimulation.ts`
- `frontend/src/views/smart_map/useSmartMapSourceInversionActions.ts`
- `frontend/src/views/smart_map/useSmartMapEvacuationPlanning.ts`
- `frontend/src/views/smart_map/useSmartMapAlgorithmExecutors.ts`

三维入口编排：

- `frontend/src/views/screen/index.vue`
- `frontend/src/components/SuperMapSceneViewer.vue`（场景加载与叠加）

---

### 5.2 气体扩散算法

#### 5.2.1 设计思想

不是「纯高斯烟羽公式直接铺格子」，而是：

1. **物理教师（teacher）**：`conditioned_advection` 条件化对流-扩散网格模型  
   - 输入：源、障碍、统一风场、气体物性（密度、扩散系数、偏置）  
   - 考虑：浮力条件、扩散条件、混合层高度、稳定度
2. **深度代理（student/surrogate）**：`deep_learning/gas_surrogate.py` 的 PyTorch MLP  
   - 特征维度 `FEATURE_DIM = 12`  
   - 预测 log 浓度再还原为 ppm  
   - 与物理锚点做混合校正（`NEURAL_BLEND_WEIGHT ≈ 0.03`，物理占主导）
3. **场景编排**：`phase1_diffusion.py` 生成时序帧（网格 cells、传感器读数、风险区统计）
4. **后处理**：`cfd_calibrator.py` 的透明后处理（命名历史遗留，不代表完整 CFD 求解器已交付）

**正式运行入口**：

```text
POST /api/diffusion/simulate
  → run_diffusion_simulation_task
    → create_phase1_diffusion_simulation (phase1_diffusion)
      → deep_transient_field / ensure_deep_surrogate
      → conditioned_advection 作为物理锚点
    → apply_dispersion_postprocess
```

#### 5.2.2 核心文件

| 文件 | 职责 |
|------|------|
| `algorithm/diffusion/diffusion_runner.py` | 任务编排 + executor 元数据 |
| `algorithm/diffusion/phase1_diffusion.py` | ★ 正式扩散场景仿真（网格、障碍、通道、传感器） |
| `algorithm/diffusion/conditioned_advection.py` | ★ 物理条件化对流-扩散核 |
| `algorithm/deep_learning/gas_surrogate.py` | ★ PyTorch MLP 代理与训练/加载 |
| `algorithm/diffusion/gaussian_plume.py` | 公式基准 + Prairie Grass `Sy` 校验（**不再是主场生成器**） |
| `algorithm/diffusion/cfd_calibrator.py` | 结果后处理 |
| `algorithm/diffusion/test_physical_invariants.py` | 物理不变量测试 |
| `algorithm/diffusion/test_real_prairie_grass.py` | 真实横风扩散宽度验证 |
| `models/deep_gas_surrogate.pt` | 默认权重；缺失时会自动 CPU 训练默认模型 |

#### 5.2.2b 条件化对流-扩散核心算法代码（conditioned_advection.py 关键节段）

**这是气体扩散的物理内核**，后续所有深度代理和反演都以此为 teacher。

##### 核心数据结构

```python
# file: algorithm/diffusion/conditioned_advection.py

@dataclass(frozen=True)
class GasCondition:
    """气体条件向量 —— 决定扩散行为的三个关键参数"""
    relative_density: float        # 相对空气密度（<1 上升，>1 下沉）
    diffusivity_m2_s: float        # 分子扩散系数 m²/s
    diffusion_bias: float          # 扩散偏置（>1 扩散更快）
    molar_mass_g_mol: float        # 摩尔质量 g/mol

    @property
    def cond_buoyancy(self) -> float:
        """浮力条件：轻气>0，重气≈0"""
        return max(0.0, 2.0 * (1.0 - self.relative_density))

    @property
    def cond_diffusivity(self) -> float:
        """缩放分子扩散率（与 UNet 模型输入约定对齐）"""
        return self.diffusivity_m2_s * 1.0e5


@dataclass(frozen=True)
class ConditionedAdvectionParams:
    """条件化对流-扩散的完整运行时参数"""
    source_rate_g_s: float         # 源强 Q (g/s)
    release_duration_s: float      # 释放持续时间
    wind_speed_10m: float          # 10m 高风速
    wind_direction_deg: float      # 风向角度
    stability_class: str           # Pasquill 稳定度 A-F
    release_height_m: float        # 释放高度
    wind_reference_height_m: float # 风速参考高度
    ambient_temperature_k: float   # 环境温度 K
    pressure_pa: float             # 大气压 Pa
    cell_size_px: float            # 网格单元像素尺寸
    map_meters_per_unit: float     # 地图比例（默认 0.5 m/px）
    mixing_height_m: float         # 混合层高度
    gas: GasCondition
```

##### 路径权重（有效扩散率）——最关键的物理参数

```python
    @property
    def effective_diffusivity_m2_s(self) -> float:
        """★ 有效湍流扩散系数 —— 这是扩散计算的核心参数
        
        不是直接用分子扩散率（太小），而是综合风、气体物性计算：
        - wind_term:    风速贡献（风越大，湍流越强）
        - gas_term:     气体物性贡献（浮力 + 扩散率条件）
        - diffusion_bias: 用户可调的扩散偏置乘数（>1 扩散更快）
        """
        wind_term = 0.12 * self.effective_wind_m_s * self.cell_size_m
        gas_term = 0.10 * self.gas.cond_diffusivity + 0.08 * self.gas.cond_buoyancy
        raw = (0.35 + wind_term + gas_term) * max(self.gas.diffusion_bias, 0.1)
        return max(raw, MIN_DIFFUSIVITY_M2_S)  # 下限 0.05 m²/s

    @property
    def ground_retention_per_s(self) -> float:
        """地面滞留衰减率 —— 轻气逃逸更快，重气滞留更久"""
        density = min(max(self.gas.relative_density, 0.2), 1.4)
        buoyancy_escape = max(0.0, 1.0 - density) * 0.010
        base_decay = 0.0025
        return base_decay + buoyancy_escape
```

##### 网格推进核心（单步迭代）

```python
class ConditionedAdvectionGrid:
    """状态化有限差分对流-扩散场"""

    def _step(self, dt: float) -> None:
        """★ 单步推进：源项注入 → 半拉格朗日平流 → 显式扩散 → 地面衰减
        
        这是 grid model 的时间推进核心，每一步：
        1. 源注入：若仍在释放期内，向源格点加质量（g → ppm）
        2. 平流：semi-Lagrangian 逆风追踪（无条件稳定）
        3. 扩散：显式有限差分 Laplacian（稳定性条件 alpha ≤ 0.24）
        4. 衰减：指数地面滞留
        5. 障碍清零：硬阻挡格点浓度归零
        """
        # 1. 源项注入
        if self.time_sec < self.params.release_duration_s and self.params.source_rate_g_s > 0.0:
            active_dt = min(dt, self.params.release_duration_s - self.time_sec)
            if active_dt > 0.0:
                self.field_ppm[self.source_row, self.source_col] += self._source_increment_ppm(active_dt)

        # 2. 半拉格朗日平流
        advected = _semi_lagrangian_advect(self.field_ppm, *self.params.wind_vector_cells_s, dt)
        
        # 3. 显式扩散
        diffused = _diffuse_explicit(
            advected,
            self.params.effective_diffusivity_m2_s,
            self.params.cell_size_m,
            dt,
        )
        
        # 4. 地面滞留衰减
        retention = math.exp(-self.params.ground_retention_per_s * dt)
        self.field_ppm = np.maximum(diffused * retention, 0.0)
        
        # 5. 硬阻挡清零
        self.field_ppm[self.hard_block_grid] = 0.0
```

##### 点响应函数（用于反演的正向算子）

```python
def conditioned_sensor_response(
    source_x, source_y, sensor_x, sensor_y,
    emission_rate_g_s, params: ConditionedAdvectionParams,
) -> np.ndarray:
    """★ 快速点响应 —— 溯源反演的正向算子 G(θ)
    
    不对整个网格推进，而是解析计算：给定源位置和传感器位置，
    在稳态假设下直接算出每个传感器的预期浓度。
    完全向量化，支持粒子滤波的批量调用。
    
    核心公式：
      sigma = sqrt(2 * K_eff * travel_time)  ← 扩散宽度
      C = Q / (sqrt(2π) * σ * u * H) * exp(-cross² / (2σ²)) * exp(-λ * t)
    其中 K_eff = effective_diffusivity_m2_s（见上方关键参数）
    """
    angle = math.radians(params.wind_direction_deg)
    dx = px - sx
    dy = py - sy
    map_meters_per_unit = float(params.map_meters_per_unit)
    
    # 风坐标系转换：沿风向距离 along_m，横风向距离 cross_m
    along_m = (dx * math.cos(angle) + dy * math.sin(angle)) * map_meters_per_unit
    cross_m = (-dx * math.sin(angle) + dy * math.cos(angle)) * map_meters_per_unit

    u = max(params.effective_wind_m_s, MIN_WIND_SPEED)
    travel_time = np.maximum(along_m / u, 1e-6)
    k_eff = params.effective_diffusivity_m2_s  # ← ★ 核心路径权重
    sigma = np.sqrt(np.maximum(2.0 * k_eff * travel_time, params.cell_size_m**2 * 0.25))

    # 高斯横风扩散 + 下风向约束 + 地面滞留衰减
    norm = np.maximum(q, 0.0) / (
        np.sqrt(2.0 * math.pi) * sigma * u * max(params.mixing_height_m, 0.5)
    )
    mass_conc = norm * np.exp(-(cross_m * cross_m) / (2.0 * sigma * sigma))
    mass_conc *= np.exp(-params.ground_retention_per_s * travel_time)
    mass_conc = np.where(along_m > 0.0, mass_conc, 0.0)  # 上风向=0
    
    return mass_to_ppm(mass_conc, params.gas.molar_mass_g_mol,
                       params.ambient_temperature_k, params.pressure_pa)
```

---

#### 5.2.2c 深度代理模型核心算法代码（gas_surrogate.py 关键节段）

**这是连接扩散和溯源的桥梁**。物理教师模型（conditioned_advection）生成训练数据 → PyTorch MLP 学习源-传感器响应 → 推理时物理+神经混合输出。

##### 网络架构与混合策略

```python
# file: algorithm/deep_learning/gas_surrogate.py

FEATURE_DIM = 12           # 12 维输入特征
NEURAL_BLEND_WEIGHT = 0.03 # 神经修正仅占 3%
PHYSICAL_ANCHOR_WEIGHT = 1.0 - NEURAL_BLEND_WEIGHT  # 物理占 97%

class GasResponseNet(nn.Module):
    """★ 小型 MLP：12 → 96 → 96 → 48 → 1
    
    输入：12 维归一化特征（见 build_features）
    输出：log(1 + ppm)，再通过 expm1 还原为 ppm
    激活：SiLU（Swish）—— 比 ReLU 在该任务上收敛更稳定
    """
    def __init__(self, hidden: int = 96) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(FEATURE_DIM, hidden),   # 12 → 96
            nn.SiLU(),
            nn.Linear(hidden, hidden),        # 96 → 96
            nn.SiLU(),
            nn.Linear(hidden, hidden // 2),   # 96 → 48
            nn.SiLU(),
            nn.Linear(hidden // 2, 1),        # 48 → 1
        )
```

##### 12 维特征工程（build_features）——决定模型能力的核心

```python
def build_features(source_x, source_y, target_x, target_y,
                   emission_rate_g_s, params):
    """★ 将原始几何/物理参数映射为 12 维归一化特征
    
    特征设计原则：
    - 使用风坐标系（along/cross）而非地图绝对坐标 → 旋转不变性
    - 所有特征归一化到相近尺度 → MLP 训练稳定
    - 标量特征（风速/稳定度/气体属性）广播填充 → 每个 (源,目标) 对都有完整上下文
    """
    # 风坐标系转换
    along_m = dx_m * cos(angle) + dy_m * sin(angle)   # 沿风距离
    cross_m = -dx_m * sin(angle) + dy_m * cos(angle)   # 横风距离

    flat = np.column_stack([
        np.clip(along_m / 900.0, -0.4, 1.6),              # [0] 沿风距离
        np.clip(cross_m / 650.0, -1.4, 1.4),              # [1] 横风距离
        np.log1p(hypot(along_m, cross_m)) / log1p(1300),   # [2] 对数距离
        np.log(max(q, 1e-6)) / log(200.0),                # [3] 对数源强
        np.clip(wind_speed_10m / 10.0, 0.0, 1.5),         # [4] 风速
        cos(angle),                                        # [5] 风向 cos
        sin(angle),                                        # [6] 风向 sin
        stability_idx / 5.0,                               # [7] 稳定度 (A=0..F=5)
        np.clip(relative_density / 1.4, 0.0, 1.5),         # [8] 相对密度
        log(max(diffusivity, 1e-8) / 1e-5) / 2.0,         # [9] 对数扩散率
        np.clip(diffusion_bias / 1.5, 0.0, 1.5),           # [10] 扩散偏置
        np.clip(release_height_m / 10.0, 0.0, 2.0),        # [11] 释放高度
    ])
    return flat  # shape: [N, 12]
```

##### 物理+神经混合预测 —— 这是最关键的设计决策

```python
def deep_sensor_response(source_x, source_y, sensor_x, sensor_y,
                         emission_rate_g_s, params):
    """★ 物理锚点 + 神经修正的混合预测
    
    为什么不用纯 MLP？
    - 纯 MLP 可能学出违反物理的浓度分布（如上风向非零）
    - 物理锚点保证基本的 plume 几何（沿风传播、横风扩散、上风向=0）
    - 神经修正仅占 3%，微调局部响应
    
    这个设计确保溯源反演的沿风可辨识性不受损失。
    """
    # 神经预测
    neural = ensure_deep_surrogate().predict(
        source_x, source_y, sensor_x, sensor_y, emission_rate_g_s, params)

    # 物理锚点
    physical = conditioned_sensor_response(
        source_x, source_y, sensor_x, sensor_y, emission_rate_g_s, params)

    # 混合：物理 97% + 神经 3%
    return np.maximum(
        PHYSICAL_ANCHOR_WEIGHT * physical + NEURAL_BLEND_WEIGHT * neural, 0.0)
```

##### 训练数据生成（物理教师 → 学生）

```python
def build_training_dataset(rng, sample_count=12000):
    """从条件化物理教师采样生成训练集
    
    在参数空间均匀/对数均匀采样：
    - 沿风距离 along: [-120, 1100] m
    - 横风距离 cross: 正态(0, 260) m，裁剪 ±720 m
    - 源强 Q: 对数均匀 [0.2, 160] g/s
    - 风速: [0.7, 9.0] m/s
    - 气体密度: [0.45, 1.25]
    - 扩散率: [1.2e-5, 3.2e-5] m²/s
    - 稳定度: A-F 均匀
    - mapMetersPerUnit: 0.5 或 1.0
    
    标签: log(1 + 物理模型输出 ppm)
    训练: AdamW, SmoothL1Loss(beta=0.08), batch=768, epochs=90
    """
```

---

#### 5.2.3 气体与地图默认

支持气体：CO、NH3、CH4、O2（各有阈值、密度比、摩尔质量、颜色）

默认地图量纲（代码内）：

- 地图像素约 `1000 × 650`
- 网格 `GRID_SIZE = 20`
- `MAP_METERS_PER_UNIT = 0.5`（0.5 m/像素）

#### 5.2.4 输出结构（前端消费）

大致字段：

```json
{
  "gas": { "id": "ch4", "name": "甲烷", "warningThreshold": 10, "...": "..." },
  "sourcePoint": { "x": 0, "y": 0 },
  "frames": [
    {
      "frameIndex": 0,
      "timeSec": 0,
      "maxConcentration": 0,
      "cells": [{ "x": 0, "y": 0, "concentration": 0, "level": 0, "alpha": 0 }],
      "sensorReadings": [{ "sensorId": "s1", "concentration": 0 }]
    }
  ],
  "stats": { "peakConcentration": 0, "peakDangerArea": 0 },
  "scenarioMeta": { "windSpeed": 0, "stabilityClass": "D", "diffusionModel": "..." },
  "executor": { "implementation": "python.deep_learning.gas_surrogate+..." }
}
```

#### 5.2.5 答辩时怎么讲扩散（30 秒版）

> 我们用「物理教师 + 深度代理」做扩散：条件化对流-扩散核保证可解释的物理行为；PyTorch 小网络学习源点到空间点的浓度响应，并以物理核为安全锚点做轻微神经校正。输出是带时间轴的浓度网格和传感器仿真读数，直接投影到 SuperMap 二维/三维图层。

#### 5.2.6 可信边界（必须诚实）

- Prairie Grass 验证的是横风向扩散宽度 `Sy (m)`，**不是**绝对浓度事故级验证
- 演示传感器读数是仿真链路
- 不得声称「完整 CFD 工业级求解已上线」

---

### 5.3 泄漏源溯源算法

溯源是作品**最强创新点**之一，分三层，由粗到细：

```text
传感器观测浓度
  → ① 粗搜索 coarse-search（grid_search）得到候选区域
  → ② 两阶段解析反演 solve（grid + EKI）得到点估计与收缩置信多边形
  → ③ 粒子滤波 particle-filter 得到 [X,Y,Q] 后验、协方差、95% 可信半径
```

#### 5.3.1 正向算子（所有反演共用）

`algorithm/inversion/forward_model.py`

- 状态：`theta = [x_s, y_s, log Q]` 或等价的 `[x, y, Q]`
- 正向 `G(θ)`：候选源 → 各传感器应观测到的 ppm
- **与扩散侧共用同一 deep surrogate**，保证反演与仿真自洽

#### 5.3.2 粗搜索

| 文件 | 说明 |
|------|------|
| `inversion/grid_search.py` | 网格扫描候选区，评分、风向一致性、到达时间约束 |
| `inversion/inversion_runner.py` | `run_grid_search_task` |

输出：`candidateRegions[]`（center、score、radius、windConsistency…）

#### 5.3.3 两阶段解析反演（EKI）

| 文件 | 说明 |
|------|------|
| `inversion/source_inversion.py` | ★ `run_two_stage_inversion` |
| `inversion/eki.py` | Ensemble Kalman Inversion |
| `inversion/plume_losses.py` | 损失快照 |
| `inversion/centroid_estimator.py` | 加权中心融合 |
| `inversion/inversion_dataset.py` | payload 归一化 |

流程：

1. Stage1：整理/排序候选区  
2. Stage2：EKI 迭代细化，输出 ensemble 均值与协方差驱动的置信半径、`shrinkFrames` 动画多边形

前端可据此播放「置信范围逐步收缩」。

#### 5.3.4 改进粒子滤波（主打答辩算法）

| 文件 | 说明 |
|------|------|
| `inversion/particle_filter.py` | ★ 核心 PF 实现 |
| `inversion/validate_particle_filter.py` | 可复现验证 |

**状态向量**：`[X, Y, Q]`（位置 + 释放强度）

**关键机制**（代码注释与实现一致）：

- 有界均匀先验
- 传感器噪声 + 模型噪声的贝叶斯似然
- ESS（有效样本量）触发系统重采样
- 高斯核抖动 + **Metropolis-Hastings 再生**，减轻粒子贫化
- 到达时间约束、上风向信号惩罚
- 默认配置量级：`num_particles≈12000`，`iterations≈36`（验证脚本会用更高预算做重复性）

输出重点字段：

```json
{
  "estimatedSource": { "mapPoint": { "x": 0, "y": 0 }, "emissionRate": 0, "credibleRadius95m": 0 },
  "posterior": {
    "credibleIntervals": { "x": [0, 1], "y": [0, 1], "emissionRate": [0, 1] },
    "covariance": [[0,0,0],[0,0,0],[0,0,0]]
  },
  "diagnostics": { "particles": 12000, "effectiveSampleSize": 0, "acceptanceRate": 0 },
  "history": [{ "iteration": 0, "x": 0, "y": 0, "ess": 0, "rmse": 0 }]
}
```

#### 5.3.4b 粒子滤波核心算法代码（particle_filter.py 关键节段）

**这是溯源反演的最终算法**，也是答辩时"算法三板斧"中最强的创新点。

##### 状态空间与似然函数

```python
# file: algorithm/inversion/particle_filter.py

@dataclass(frozen=True)
class ParticleFilterConfig:
    """粒子滤波配置 —— 可从前端 payload 覆盖"""
    num_particles: int = 12000        # 粒子数
    iterations: int = 36              # SMC 退火迭代轮次
    resample_threshold: float = 0.55  # ESS 低于此比例触发重采样
    mcmc_steps: int = 2               # 每轮 MCMC 再生步数
    sensor_noise_relative: float = 0.10  # 传感器相对噪声 10%
    model_noise_relative: float = 0.05   # 模型相对噪声 5%
    min_noise_ppm: float = 1e-4
    kernel_scale: float = 0.35        # MCMC 提议核缩放
    seed: int = 20250613              # 确定性种子（可复现）
    x_bounds: tuple = (40.0, 961.0)   # 地图 X 搜索范围
    y_bounds: tuple = (40.0, 611.0)   # 地图 Y 搜索范围
    q_bounds: tuple = (1e-3, 1.0e5)   # 源强 Q 搜索范围 g/s
```

##### ★ 主循环：SMC 退火 + ESS 重采样 + MCMC 再生

```python
def run_particle_filter(forward_model, observed_ppm, config,
                        observed_arrival_times=None):
    """★ 改进粒子滤波主算法

    状态向量: [X, Y, Q]（泄漏位置 + 源强）
    
    算法流程（SMC 退火）：
    1. 从有界均匀先验采样 N 个粒子
    2. β 从 0→1 线性退火（β = 当前迭代/总迭代）
    3. 权重更新: w_new ∝ w_old × likelihood^Δβ
    4. 若 ESS < threshold × N → 系统重采样 + MCMC 再生
    5. 输出加权后验均值/协方差/可信区间
    """
    rng = np.random.default_rng(config.seed)
    
    # 1. 初始化：均匀先验
    particles = _draw_uniform_particles(rng, config)  # [N, 3]
    weights = np.full(config.num_particles, 1.0 / config.num_particles)
    log_likelihood = _log_likelihood(forward_model, particles, observed, config)

    beta = 0.0
    for iteration in range(config.iterations):
        # 2. β 退火
        beta_next = (iteration + 1) / config.iterations
        # 3. 权重更新（对数空间，数值稳定）
        weights = _normalize_log_weights(
            np.log(weights + 1e-300) + (beta_next - beta) * log_likelihood)
        beta = beta_next

        # 4. ESS 检查 → 系统重采样 + MCMC 再生
        ess = effective_sample_size(weights)
        if ess < config.resample_threshold * config.num_particles:
            particles = _systematic_resample(rng, particles, weights)
            weights = np.full(config.num_particles, 1.0 / config.num_particles)
            log_likelihood = _log_likelihood(forward_model, particles, ...)
            
            # ★ MCMC 再生（Metropolis-Hastings）—— 减轻粒子贫化
            particles, log_likelihood, accepted, proposed = _mcmc_rejuvenate(
                rng, forward_model, particles, log_likelihood,
                observed, observed_arrival_times, beta, config)

        # 5. 记录本轮估计
        estimate, covariance = weighted_mean_covariance(particles, weights)
        # ...
    
    return ParticleFilterResult(
        particles=particles, weights=weights, estimate=estimate,
        covariance=covariance, credible_intervals=..., history=...)
```

##### ★ 对数似然 —— 贝叶斯推断的关键

```python
def _log_likelihood(forward_model, particles, observed, config,
                    observed_arrival_times=None):
    """★ 贝叶斯似然 p(y|θ)
    
    包含三个约束项：
    1. 浓度匹配：传感器噪声 + 模型噪声的异方差高斯似然
    2. 到达时间约束：预测到达时间 vs 观测到达时间的匹配度
    3. 上风向惩罚：上风向传感器有信号 → 该粒子方向错误，降权
    """
    # 1. 浓度似然（异方差高斯）
    predicted = forward_model.predict_batch(particles)  # [M, N]
    # sigma² = (10% × max(|obs|, threshold))² + (5% × max(|obs|, |pred|))² + 1e-4²
    sigma = np.sqrt(
        (config.sensor_noise_relative * max(|obs|, threshold))²
        + (config.model_noise_relative * max(|obs|, |pred|))²
        + config.min_noise_ppm²)
    residual = predicted - observed
    log_likelihood = -0.5 * Σ[(residual/σ)² + log(2πσ²)]
    
    # 2. 到达时间约束（若有）
    # 沿风距离 / 风速 = 预测到达时间 → 与观测到达时间比较
    log_likelihood += _arrival_time_log_likelihood(...)
    
    return log_likelihood
```

##### ★ 到达时间约束（粒子滤波独有，EKI 不具备）

```python
def _arrival_time_log_likelihood(forward_model, particles, observed_ppm,
                                  observed_arrival_times, config):
    """★ 利用传感器记录的首次超标时间约束源位置
    
    核心思想：沿风距离越远 → 到达时间越晚
    - 预测到达时间 = along_wind_distance / wind_speed
    - 绝对时间匹配（权重 0.65）：预测与观测的绝对到达时间差
    - 相对时间匹配（权重 0.35）：传感器间到达时间差的一致性
    - 上风向惩罚：上风向传感器若有信号，该粒子方向错误
    """
    # 沿风距离（风坐标系）
    along_m = (dx * cos_theta + dy * sin_theta) * map_meters_per_unit
    
    # 预测到达时间
    predicted_arrivals = max(along_m, 0.0) / transport_speed
    
    # 绝对 + 相对时间匹配
    absolute_loss = mean(((predicted - observed) / sigma)²)
    relative_loss = mean(((predicted_rel - observed_rel) / sigma)²)
    timing_loss = 0.65 * absolute_loss + 0.35 * relative_loss
    
    # 上风向信号惩罚
    upwind_excess = max(-(along_m + tolerance), 0.0)
    upwind_loss = mean(signal_weight * (upwind_excess / tolerance)²)
    
    return -0.5 * arrival_time_weight * n_timed * timing_loss
           - 0.5 * upwind_signal_weight * upwind_loss
```

##### ★ MCMC 再生（Metropolis-Hastings）

```python
def _mcmc_rejuvenate(rng, forward_model, particles, log_likelihood,
                      observed, observed_arrival_times, beta, config):
    """★ MCMC 再生 —— 重采样后增加粒子多样性
    
    重采样后粒子集会"贫化"（多样性丧失），MCMC 再生通过
    Metropolis-Hastings 接受/拒绝来恢复多样性：
    
    1. 提议：高斯核扰动 X,Y（std = kernel_scale × spread）
             对数正态扰动 Q  (std = kernel_scale × log_std)
    2. 接受概率：min(1, exp(β × (L_new - L_old)))
    3. β 越大（后期），越倾向于只接受更好的粒子 → 收敛到后验
    
    每次 MCMC 步都裁剪到物理边界 [x_bounds, y_bounds, q_bounds]。
    """
    kernel_std = _kernel_std(particles, config)
    
    for _ in range(config.mcmc_steps):
        # 提议：X,Y 加高斯噪声，Q 乘对数正态噪声
        proposed[:, :2] += rng.normal(0.0, kernel_std[:2], ...)
        proposed[:, 2] *= exp(rng.normal(0.0, kernel_std[2], ...))
        proposed = _clip_particles(proposed, config)
        
        # MH 接受/拒绝
        proposed_log_like = _log_likelihood(forward_model, proposed, ...)
        log_accept = beta * (proposed_log_like - current_log_like)
        accept = log(rng.random()) < log_accept
        
        current[accept] = proposed[accept]
        current_log_like[accept] = proposed_log_like[accept]
    
    return current, current_log_like, accepted, proposed_count
```

##### 后处理：KDE 概率地形 GeoJSON

```python
def build_particle_kde_geojson(particles, weights, covariance_xy, config, ...):
    """★ 将粒子后验插值为 GeoJSON 概率地形
    
    前端将此作为唯一的概率地形输入，用于三维 iClient3D 渲染：
    1. 加权 KDE 核密度估计（Scott 带宽）
    2. 规则网格插值
    3. 归一化 → 高程映射（density^0.75 × elevationScaleM）
    4. 输出 GeoJSON FeatureCollection（每个格点一个 Polygon + Z 高程）
    """
```

---

#### 5.3.4c EKI（集合卡尔曼反演）核心算法代码（eki.py 关键节段）

```python
# file: algorithm/inversion/eki.py

def run_eki(forward, observed, prior_mean, prior_std, noise_std, ...):
    """★ 正则化集合卡尔曼反演 (Iglesias, Law & Stuart, 2013)

    核心更新公式（每轮迭代）：
    θ_j^{k+1} = θ_j^k + C_θG (C_GG + α·Γ)^{-1} (y + ξ_j - G(θ_j^k))

    其中：
    - C_θG: 状态-输出的互协方差 [3, N]
    - C_GG: 输出的自协方差 [N, N]
    - Γ: 观测噪声协方差 diag(σ²)
    - α: 正则化 inflation = max_iterations（恒定）
    - ξ_j: 扰动观测 N(0, α·Γ)

    特点：
    - 无需计算梯度（相比变分方法）
    - 64 个成员的 ensemble 足够（因为状态仅 3 维）
    - CPU 毫秒级，可实时部署
    - 输出：ensemble 均值（点估计）+ 协方差（不确定性椭圆）
    """
    # 初始 ensemble: 先验均值 + 高斯散布
    ensemble = prior_mean[None,:] + rng.standard_normal((J,3)) * prior_std[None,:]
    
    alpha = float(max_iterations)  # 恒定正则化
    
    for iteration in range(max_iterations):
        # 逐成员前向预测
        predictions = np.stack([forward(ensemble[j]) for j in range(J)])
        
        # 协方差计算
        d_theta = ensemble - ensemble.mean(axis=0)     # [J, 3]
        d_pred = predictions - predictions.mean(axis=0) # [J, N]
        C_tg = (d_theta.T @ d_pred) / (J-1)             # [3, N]
        C_gg = (d_pred.T @ d_pred) / (J-1)              # [N, N]
        
        # 卡尔曼增益
        K = solve((C_gg + alpha*Γ).T, C_tg.T).T        # [3, N]
        
        # 扰动观测 + 更新
        perturb = rng.standard_normal((J, N)) * sqrt(α) * noise_std
        innovation = observed + perturb - predictions
        ensemble += innovation @ K.T
        
        # 收敛判断：相对 misfit 改进 < 2%
        if rel_improvement < 0.02: break
    
    return EkiResult(mean_history, cov_history, misfit_history,
                     final_mean, final_cov, ensemble, ...)
```

---

#### 5.3.5 答辩时怎么讲溯源（45 秒版）

> 溯源不是查库找点，而是反问题求解。我们用与扩散一致的深度正向算子，先做粗网格锁定候选区，再用集合卡尔曼反演和粒子滤波估计泄漏位置与源强，并给出后验协方差与 95% 可信半径。演示上可以展示候选区、收缩多边形和粒子收敛过程；SuperMap 侧用点图层、缓冲区和概率地形表达后验，而不是只报一个「假精确点」。

#### 5.3.6 可信边界

- 合成观测不得写成真实事故数据
- 米级定位误差来自**可复现实验**，不是现场实测 KPI
- 粒子滤波输出本质是**概率后验**；若 UI 只画一个点，答辩要主动解释「点是后验均值，圆/KDE 才是不确定性」

---

### 5.4 疏散路径规划（D\* Lite）

#### 5.4.1 设计思想

- 在**道路网络图**上规划，而不是自由空间网格乱跑
- 用当前扩散帧生成 **DangerMask**：高浓度阻断节点/边
- **D\* Lite** 支持危险区变化后的增量重规划（比每次 A\* 重算更适合动态事故）
- 支持单起点与**按建筑批量规划**

#### 5.4.2 核心文件

| 文件 | 职责 |
|------|------|
| `planning/dstar_lite.py` | ★ 图构建、DangerMask、D\* Lite、多出口排序 |
| `planning/evacuation_runner.py` | 公共契约转换（`isReachable` 等） |
| `planning/factory_layout.py` | 园区布局相关 |
| `planning/gas_catalog.py` | 气体目录 |
| `planning/astar_path_planner.py` 等 | 遗留/对照实现（标注 legacy 的不要当主入口） |
| `PATH_GAS_CONSTRAINTS.md` | 路径-气体约束说明 |

正式疏散入口：**仅** `dstar_lite` + `evacuation_runner`。旧 `gas_diffusion_astar` 不得再当公共 API。

#### 5.4.3 与 SuperMap 的关系

| 能力 | 推荐 |
|------|------|
| 普通最短路 / 网络分析 | iServer Network Analysis 优先 |
| 动态危险避让（随扩散变化） | Python D\* Lite 增强/兜底 |
| 三维展示 | 路径坐标抬高 Z 后画线 |

#### 5.4.5 D* Lite 路径规划核心算法代码（dstar_lite.py 关键节段）

##### ★ 路径权重 —— 决定路线走向的核心

```python
# file: algorithm/planning/dstar_lite.py

EVACUATION_WALKING_SPEED_MPS = 1.35  # 疏散步行速度
MAP_METERS_PER_UNIT = 0.5            # 默认地图比例

def get_traversal_cost(planner, edge_id, from_node_id, to_node_id,
                       base_distance):
    """★ 路径权重/遍历代价 —— D* Lite 的核心边权
    
    这是决定疏散路线的关键函数。返回：
    - base_distance: 边可通过，代价 = 边的几何长度
    - inf:         边被阻断（节点或边在危险区），不可通过
    
    危险判定来源：
    - blockedNodeIds: 该节点处浓度 ≥ blockingThreshold
    - blockedEdgeIds: 该边采样点浓度 ≥ blockingThreshold
    """
    if from_node_id in planner.blockedNodeIds:
        return math.inf   # 起点节点在危险区
    if to_node_id in planner.blockedNodeIds:
        return math.inf   # 终点节点在危险区
    if edge_id in planner.blockedEdgeIds:
        return math.inf   # 边经过危险区
    return base_distance  # 几何距离作为代价


def get_g(planner, node_id):
    """g-score: 该节点到目标(出口)的当前估计最短距离"""
    return planner.gScore.get(node_id, math.inf)


def get_rhs(planner, node_id):
    """rhs-score: 一步前瞻值 = min_{邻居}(edge_cost + g(邻居))
    若 rhs == g 则该节点 consistent；否则需要更新"""
    return planner.rhsScore.get(node_id, math.inf)
```

##### ★ DangerMask 构建 —— 动态危险区判定

```python
def build_danger_mask(graph, frame, gas, blocked_mask):
    """★ 从扩散浓度帧构建危险遮罩
    
    对每个道路节点和边进行检查：
    - 节点：若浓度 ≥ blockingThreshold → blocked
    - 边：在边上采样 6 个点，任一点浓度 ≥ threshold → blocked
    
    这就是"动态避障"的来源：不同扩散帧 → 不同 blocked 集合 → 不同路径
    """
    threshold = gas.get("blockingThreshold") or gas.get("dangerThreshold", inf)
    
    blocked_node_ids = set()
    blocked_edge_ids = set()
    
    # 检查每个节点
    for node in graph.nodes.values():
        conc = get_frame_concentration_at_point(frame, node["x"], node["y"])
        if conc >= threshold:
            blocked_node_ids.add(node["id"])
    
    # 检查每条边（6个采样点）
    for edge in graph.edges.values():
        blocked = any(
            get_frame_concentration_at_point(frame, p["x"], p["y"]) >= threshold
            for p in sample_edge_points(edge["fromPoint"], edge["toPoint"], 6))
        if blocked:
            blocked_edge_ids.add(edge["id"])
    
    return DangerMask(threshold=threshold,
                      blockedNodeIds=blocked_node_ids,
                      blockedEdgeIds=blocked_edge_ids, ...)
```

##### ★ D* Lite 核心：compute_shortest_path + update_vertex

```python
def compute_shortest_path(planner, graph):
    """★ D* Lite 主循环 —— 增量最短路径计算
    
    算法逻辑（来自 Koenig & Likhachev, 2002）：
    while (open list 非空) and (start 的 key > open 顶部的 key 或 start 不一致):
        弹出 open 顶部的节点 u
        if g(u) > rhs(u):     # 节点过一致（路径比预期短）
            g(u) = rhs(u)     # 采纳更短的路径
            更新所有前驱     # 前驱节点的 rhs 可能变小
        else:                 # 节点欠一致（路径比预期长）
            g(u) = inf        # 重置
            更新 u + 所有前驱 # 重新计算
    
    迭代上限 50000 防止死循环。
    """
    while planner.openEntry and (
        compare_keys(peek_open_key(planner),
                     calculate_node_key(planner, graph, planner.currentStartNodeId)) < 0
        or not are_costs_equal(get_rhs(planner, planner.currentStartNodeId),
                               get_g(planner, planner.currentStartNodeId))
    ):
        # pop + 惰性删除检查
        current = pop_open_node(planner)
        ...
        if g_value > rhs_value:
            planner.gScore[current["nodeId"]] = rhs_value
            for pred in predecessors:
                update_vertex(planner, graph, pred)
        else:
            planner.gScore[current["nodeId"]] = math.inf
            update_vertex(planner, graph, current["nodeId"])
            for pred in predecessors:
                update_vertex(planner, graph, pred)


def update_vertex(planner, graph, node_id):
    """★ 更新节点状态 —— D* Lite 的核心操作
    
    1. 重新计算 rhs(u) = min_{邻居 s}(edge_cost(u,s) + g(s))
    2. 从 open list 移除 u
    3. 若 u 不一致 (g ≠ rhs)，重新入队，key = calculate_node_key(u)
    """
    if node_id != planner.goalNodeId:
        best_rhs = math.inf
        for neighbor in graph.adjacency.get(node_id, []):
            cost = get_traversal_cost(planner, neighbor["edgeId"],
                                      node_id, neighbor["nodeId"],
                                      neighbor["distance"])
            best_rhs = min(best_rhs, cost + get_g(planner, neighbor["nodeId"]))
        planner.rhsScore[node_id] = best_rhs
    
    remove_open_node(planner, node_id)
    if not are_costs_equal(get_g(planner, node_id), get_rhs(planner, node_id)):
        push_open_node(planner, node_id,
                       calculate_node_key(planner, graph, node_id))


def calculate_node_key(planner, graph, node_id):
    """★ D* Lite 优先队列 key
    
    key = (min(g, rhs) + heuristic + km, min(g, rhs))
    - 第一分量：到目标的估计总代价
    - 第二分量：到目标的一步代价（打破平局）
    - km: 启发式修正量（起点移动后自动调整，避免全量重算）
    """
    best = min(get_g(planner, node_id), get_rhs(planner, node_id))
    heuristic = get_distance(graph.nodes[node_id], graph.nodes[planner.currentStartNodeId])
    return (best + heuristic + planner.km, best)
```

##### ★ 增量重规划的关键：起点变化时仅调整 km

```python
def update_planner_for_start_change(planner, graph, next_start_node_id):
    """★ 起点变化的增量处理（D* Lite 的核心优势 over A*）
    
    当起点移动到新位置时：
    1. km += 新旧起点间的距离
    2. 更新 currentStartNodeId
    3. 不需要重建整个优先队列！
    
    这就是为什么 D* Lite 比"每次都重新跑 Dijkstra"更高效：
    后续 compute_shortest_path 会自动用 km 修正 key，只修复受影响的部分
    """
    if planner.currentStartNodeId == next_start_node_id:
        return
    current_node = graph.nodes.get(planner.currentStartNodeId)
    next_node = graph.nodes.get(next_start_node_id)
    if current_node and next_node:
        planner.km += get_distance(current_node, next_node)
    planner.lastStartNodeId = planner.currentStartNodeId
    planner.currentStartNodeId = next_start_node_id
```

##### ★ 路线排序 —— 多出口择优

```python
# 在 plan_routes_from_start 中（约 line 280-295）：
candidate_routes = sorted(
    candidate_routes,
    key=lambda route: (
        route.get("peakConcentration", 0),  # ★ 首要：路径峰值浓度越低越好
        route["distanceMeters"],            # ★ 次要：距离越短越好
    ),
)
best_route = ranked_routes[0]
```

##### ★ 路径重构 —— 从 D* Lite 的 g-score 贪婪回溯

```python
def reconstruct_dstar_path(planner, graph, start_node_id, goal_node_id, danger_mask):
    """★ 从 g 值贪婪回溯构建路径
    
    从起点出发，每一步选择:
      min(edge_distance + g(neighbor))
    同时避开 blocked 节点和边。
    
    若找不到可行路径（循环/无边/被阻断），返回空列表。
    """
    if not finite(g(start)) and not finite(rhs(start)):
        return []   # 起点不可达
    path = [start_node_id]
    cursor = start_node_id
    while cursor != goal_node_id:
        # 筛选不危险的邻居
        neighbors = [n for n in adjacency[cursor]
                     if n["nodeId"] not in blockedNodes
                     and n["edgeId"] not in blockedEdges]
        # 贪婪选择 min(distance + g(neighbor))
        best = argmin(neighbors, key=lambda n: n["distance"] + g(n["nodeId"]))
        if not best: return []
        path.append(best["nodeId"])
        cursor = best["nodeId"]
    return path if cursor == goal_node_id else []
```

---

#### 5.4.4 答辩 20 秒版

> 疏散不是静态最短路。我们把扩散浓度变成道路危险 mask，用 D\* Lite 在路网上做动态避障重规划，多出口择优；SuperMap 负责路网数据与路线可视化。

---

### 5.5 YOLO 人员识别

| 项 | 说明 |
|----|------|
| 入口 | `algorithm/polo.py`，端口 **8001** |
| 模型 | `models/yolo11m.pt`（不提交大权重到公开仓） |
| 调用链 | 前端上传 → Java `ImageAnalysisController` → 内网调 YOLO |
| 现状 | **图片**识别链路；视频连续识别未交付 |

Java 侧：`backend/.../controller/ImageAnalysisController.java`  
服务：`ImageAnalysisService`

---

### 5.6 算法数据流（端到端演示剧本）

推荐演示顺序（与智慧地图/三维入口一致）：

```text
1. 配置气体、风速风向、稳定度、源点/装置
2. 运行扩散 → 时间轴回放浓度场 + 传感器序列
3. 用传感器观测做粗搜索 → 看候选区
4. 粒子滤波/解析反演 → 估计源点 + 置信范围
5. 对选中建筑做疏散规划 → 避开高危道路
6. 三维场景叠加：云团 / 源点 / 路线
```

对应前端 workflow key（screen）：`diffusion | inversion | evacuation | closestDevice`

---

### 5.7 算法可信性与测试资产

| 资产 | 路径 | 说明 |
|------|------|------|
| 案例 01 高斯烟羽 | `tests/case01_gaussian_plume/` | CSV + meta |
| 案例 02 烟团时序 | `tests/case02_puff_timeseries/` | |
| 案例 03 传感器观测 | `tests/case03_sensor_observations/` | |
| 案例 04 多源 | `tests/case04_multi_source/` | |
| Prairie Grass 样本 | `datasets/samples/prairie_grass/` | 真实野外实验宽度验证 |
| 数据集说明 | `docs/dataset-sources.md` | 来源与边界 |
| 接口文档 | `docs/api-reference.md` | 统一协议 |

---

### 5.7b 前向模型核心代码（forward_model.py 关键节段）

**前向模型是溯源反演的共享正向算子**，粗搜索、EKI、粒子滤波共用同一套实现。

```python
# file: algorithm/inversion/forward_model.py

@dataclass
class ForwardModel:
    """★ 共享的正向算子 G(θ): [x_s, y_s, Q] → [ppm at each sensor]
    
    粗搜索、EKI、粒子滤波都调用同一个 predict/predict_batch，
    保证反演与扩散仿真自洽。
    """
    sensor_x: np.ndarray      # 传感器 X 坐标 [N]
    sensor_y: np.ndarray      # 传感器 Y 坐标 [N]
    cos_theta: float          # 风向 cos
    sin_theta: float          # 风向 sin
    effective_wind: float     # 有效风速 m/s
    stability_class: str      # 稳定度 A-F
    # ... 其他物理参数

    def predict(self, source_x, source_y, emission_rate_g_s):
        """单源预测：返回每个传感器的预期 ppm"""
        return self.predict_unit(source_x, source_y) * max(emission_rate_g_s, 0.0)

    def predict_unit(self, source_x, source_y):
        """单位源强预测：Q=1g/s 时各传感器浓度
        Q 线性可分 → 任意 Q 只需缩放 unit 响应"""
        return deep_sensor_response(source_x, source_y,
                                     self.sensor_x, self.sensor_y,
                                     1.0, self._conditioned_params())

    def predict_batch(self, sources):
        """★ 批量预测 [M, 3] → [M, N]
        粒子滤波的关键加速：一次调用预测所有粒子的传感器响应
        广播 source 坐标 vs 固定 sensor 布局，纯矩阵运算"""
        source_x = sources[:, 0][:, None]
        source_y = sources[:, 1][:, None]
        rate = max(sources[:, 2], 0.0)[:, None]
        return deep_sensor_response(source_x, source_y,
                                     self.sensor_x[None, :],
                                     self.sensor_y[None, :],
                                     rate, self._conditioned_params())

    def fit_emission_rate(self, source_x, source_y, observed):
        """★ 解析求解最优 Q：min_Q ||Q × g - c||² → Q = (g·c)/(g·g)"""
        unit = self.predict_unit(source_x, source_y)
        return max(dot(unit, observed) / dot(unit, unit), MIN_EMISSION_RATE)
```

---

### 5.8 监控点位布局说明（⚠️ 无算法优化代码）

**当前状态**：传感器布点**不是**通过算法优化生成的，而是：

| 方式 | 说明 |
|------|------|
| 数据库初始化脚本 | `deploy/mysql/init.sql`、`deploy/mysql/sensor_data.sql` |
| 布点依据 | GB/T 50493-2019《石油化工可燃气体和有毒气体检测报警设计标准》 |
| 覆盖规则 | CO/CH4/NH3/O2 混合点按有毒气体 4m 水平覆盖半径控制 |
| 前端编辑 | `/smart-map` 中可手动拖拽/增删传感器位置 |

**没有**以下算法代码（确认已搜索全仓）：
- 传感器布局优化（如最大覆盖率、最小化检测时间）
- 信息熵/互信息驱动的选点
- 基于扩散模型的监测网设计

**若有需要可补充的方向**（不在当前交付范围）：
- 基于扩散仿真结果的回溯覆盖盲区分析
- 信息增益最大的新增传感器推荐
- 多气体类型的最优混合布点

---

## 6. 前端核心代码地图

### 6.1 主要路由

| 路由 | 文件 | 用途 |
|------|------|------|
| `/screen` | `views/screen/index.vue` | ★ 三维态势主演示（iClient3D） |
| `/smart-map` | `views/smart_map/index.vue` | ★ 二维智慧地图 + 算法全流程 |
| `/home` | `views/home/` | 首页导航 |
| `/car/*` | `views/car/` | 巡检小车 |
| `/yolo` | `views/yolo/` | 识别页 |
| `/monitor` | `views/monitor/` | 监测 |
| `/acl/*` | `views/acl/` | 权限/员工 |
| `/login` | `views/login/` | 登录 |

白名单（可不登录）：`/login` `/register` `/404` `/screen` `/smart-map`

### 6.2 SuperMap 相关前端

| 区域 | 说明 |
|------|------|
| `components/SuperMapSceneViewer.vue` | 三维场景主组件 |
| `views/smart_map/components/SuperMap2DLayer.vue` | 二维 iClient 图层 |
| `views/smart_map/useSuperMapIserverData.ts` | iServer 数据 |
| `frontend/src/data/supermapGeoreference.js` | 旧本地坐标↔CGCS2000（调试/回滚用） |
| `frontend/public/` | 本地 3D tiles / 静态资源 |

### 6.3 智慧地图（算法交互最全）

`views/smart_map/` 下大量 `useSmartMap*.ts`：

- 扩散：`useSmartMapDiffusionSimulation.ts` / `DiffusionLayer` / `DiffusionPlayback`
- 溯源：`useSmartMapSourceInversionActions.ts` / `SourceInversionOverlay`
- 疏散：`useSmartMapEvacuationPlanning.ts` / `EvacuationRouteCanvas`
- 传感器：`useSmartMapSensor*.ts`
- Canvas 渲染：`useSmartMapBaseCanvas.ts` 等

二维业务层大量仍是 **Canvas 叠加** + SuperMap 底图；后续方向是更多业务数据改为 iServer 专题服务。

---

## 7. 后端核心代码地图

根包：`backend/src/main/java/com/at/`

| 层 | 代表 |
|----|------|
| 启动 | `ChemicalApplication.java` |
| Controller | `SensorController` `MonitoringDataController` `CarController` `ImageAnalysisController` `LoginAndRegisterController` `WarningHistoryController` `EmergencyPlanController` … |
| Service | `SensorService` `ImageAnalysisService` `QWeatherService` `SimulationMonitoringService` … |
| Mapper/Pojo | MyBatis + 实体/DTO |
| 安全 | JWT `JwtUtils` + `TokenInterceptor` + 角色注解 |

**职责边界**：业务数据、鉴权、告警、小车、YOLO 代理、仿真读数落库；**不实现**扩散/粒子滤波数学内核（那是 Python）。

数据库：

- 初始化：`deploy/mysql/init.sql`
- 台账：`db/`
- 本地 Docker 端口常为 **3307**

---

## 8. 答辩重点应该放在哪里讲

### 8.1 推荐时间分配（15 分钟答辩示例）

| 时长 | 板块 | 讲什么 |
|------|------|--------|
| 1.5 min | 痛点与目标 | 化工园区泄漏：看不见、找不准、撤不快 |
| 2 min | SuperMap 产品链 | iDesktopX 处理 → iServer 发布 → iClient 原生调用（**不是 iframe 套壳**） |
| 2 min | 系统闭环演示 | 感知→扩散→溯源→疏散→三维表达（现场点一遍） |
| **3.5 min** | **★ 算法三件套** | 扩散 surrogate、粒子滤波溯源、D\* Lite 动态疏散 |
| 2 min | 二维/三维分工 | 二维计算引擎 + 三维投影仪；CGCS2000 |
| 1.5 min | 验证与边界 | Prairie Grass、自测 PASS、仿真数据诚实声明 |
| 1.5 min | 创新与展望 | 概率后验可视化、网络分析、移动端、实测接入 |
| 1 min | 收尾 | 一句话价值 + 欢迎提问 |

### 8.2 必讲「三板斧」（评委最爱追问）

#### 板斧 1：为什么是超图作品，不是普通 Vue 项目？

要答：

- 数据在 iDesktopX 处理
- 服务在 iServer 发布（地图/三维/数据/网络分析）
- Web 用 iClient2D/3D **原生加载**，iPortal 管资源
- 算法结果变成**空间图层**

不要答成：我们嵌了一个大屏链接。

#### 板斧 2：算法创新是什么？

要答：

- 物理信息深度代理扩散（可解释 + 可加速）
- 与正向模型自洽的反演（粗搜 + EKI + 粒子滤波源项估计）
- 风险场驱动的 D\* Lite 动态疏散
- 与 GIS 解耦的 FastAPI 服务化封装

#### 板斧 3：结果可信吗？

要答：

- 有物理不变量测试、Prairie Grass `Sy` 验证、粒子滤波可复现实验、D\* Lite 单测
- **边界清晰**：演示数据是仿真/公开验证样本；未接真实硬件连续采集
- 坐标与服务有验收素材（`报告素材/`）

### 8.3 建议现场演示路径（最短高光）

1. 打开 `/screen`：三维园区模型可见（S3M）
2. 运行扩散：云团/浓度层出现
3. 运行溯源：源点 + 置信范围
4. 选建筑疏散：路线避开高危区
5. 切 `/smart-map`：展示二维计算与面板细节（可选）

### 8.4 评委刁钻问题预案

| 问题 | 推荐答法 |
|------|----------|
| 数据是不是真的？ | 三维模型与 GIS 服务真实；浓度观测当前为仿真/验证样本，已在文档标注 |
| 和 CFD 比如何？ | 当前是实时可部署的物理+代理模型；CFD 可作为离线高保真校验方向 |
| 为什么不用纯 SuperMap 路径分析？ | SuperMap 做标准网络分析；动态毒气风险权重与重规划用自研 D\* Lite，二者分工 |
| 粒子滤波为什么不是一个点？ | 输出是后验分布；点是均值/MAP，圆/KDE 表达不确定性 |
| 坐标系？ | 发布版 CGCS2000（4547/4490），三维 Z 仅抬高可视化 |

### 8.5 不要在答辩里踩的雷

- 把仿真说成「现场实时监测已上线」
- 把 Prairie Grass 说成「绝对浓度全面验证通过」
- 把 iPortal iframe 说成核心技术
- 把 YOLO 视频能力说成已交付
- 把遗留 A\* 链说成当前主路径
- 泄露 `私密文件` 中的密码/服务器信息

---

## 9. PPT 如何突出重点

### 9.1 推荐页结构（16–22 页）

1. **封面**：基于时空智能和数字孪生的化工园区危险气体监测和溯源系统 +「超图杯」+ 队伍信息  
2. **目录**  
3. **行业痛点**：看不见扩散 / 找不准源 / 撤不快  
4. **建设目标**：感知—模拟—溯源—决策—表达闭环  
5. **总体架构图**（前端 / Java / Python / SuperMap / MySQL）  
6. **★ SuperMap 产品链**（iDesktopX→iServer→iPortal→iClient）——**超图杯必出大图**  
7. **二维/三维分工**：「后台引擎 vs 前台投影」示意图  
8. **功能全景**（一页图标矩阵）  
9. **★ 扩散算法原理**（物理教师 + 深度代理）  
10. **★ 溯源算法原理**（粗搜→EKI→粒子滤波）  
11. **★ 疏散算法原理**（DangerMask + D\* Lite）  
12. **算法服务化**（FastAPI 路由表 + 统一响应）  
13. **系统演示截图 1**：三维扩散  
14. **系统演示截图 2**：溯源后验  
15. **系统演示截图 3**：疏散路线  
16. **数据与坐标**：CGCS2000、数据来源表  
17. **验证与测试**：命令 + PASS 结论（可放表）  
18. **多源感知**：传感器仿真 + YOLO 图片识别（边界写清）  
19. **创新点总结**（3–5 条，短句）  
20. **不足与展望**（实测接入、概率地形、iMobile、网络分析主链路）  
21. **致谢 / Q&A**

### 9.2 视觉与叙事原则

- **前 30 秒必须出现 SuperMap logo/产品链**，避免被看成纯算法或纯 Web 项目  
- 算法页用「**输入 → 模型 → 输出 → 地图落图**」四格，不要大段公式墙  
- 每页最多 1 个核心信息；公式放附录或备注  
- 演示截图优先用 `报告素材/` 与 `logs/` 中已有验收图  
- 创新点页建议固定 4 条：  
  1. SuperMap 原生数字孪生底座  
  2. 物理信息深度扩散  
  3. 粒子滤波源项反演  
  4. 风险驱动动态疏散  

### 9.3 一页「评委记忆点」文案（可贴 PPT）

> **时空智能数字孪生**：用 SuperMap 建空间底座，用物理+AI 做扩散与溯源，用 D\* Lite 做动态疏散，把算法结果投影到三维园区，服务化工应急决策。

---

## 10. 关键文档索引（按需深挖）

| 文档 | 路径 | 用途 |
|------|------|------|
| 工程 README | `code/chemical-main/README.md` | 启动与模块说明 |
| 算法 README | `code/chemical-main/algorithm/README.md` | 算法入口与验证 |
| 架构 | `docs/architecture.md` | 总体架构 |
| API | `docs/api-reference.md` | 接口协议 |
| 超图分工 | `docs/supermap-cup-division-plan.md` | SuperMap vs 自研 |
| 二维算三维显 | `docs/supermap-algorithm-2d-compute-3d-visualization-plan.md` | 坐标与链路冻结 |
| 总体要求 | `docs/项目总体要求.md` | 需求约束 |
| 三维算法对齐 | `docs/codex-fix-2026-07-18-3d-algorithm-alignment.md` | 待修 F1–F7 |
| 优化点汇报 | `doc/作品后续优化点汇报.md` | 后续打磨方向 |
| 本轮交接（历史） | `doc/超图杯本轮对话交接.md` | 2026-07-13 策略 |
| 项目总结 | `doc/超图杯项目总结.md` | 总结稿 |

---

## 11. 当前已知问题 / 后续优先级（给继续开发的人）

来自 `AGENTS.md` 与既有文档：

1. **三维落算法对齐（F1–F7）**：坐标系标注、iServer 路径校验、路网折点、吸附粗糙、dev/prod 差异、拓扑校验、批量规划是否走 SuperMap 主链路  
2. 二维专题数据应更多走 iServer，减少纯前端静态/Canvas 承担 GIS 数据  
3. 溯源结果应更强调**概率密度/KDE**，避免只显示「一个精确点」  
4. 环境参数可接入真实气象 API，减少「纯剧本演示」观感  
5. 移动端已有 Android 工程，可作为加分项，但不要抢主演示时间  
6. iPortal 大屏稳定性问题：演示以 `/screen` 原生三维为准

---

## 12. 给 ChatGPT 的使用提示（你怎么问它）

把本 MD 全文粘贴后，可直接这样提问：

```text
你已阅读《ChatGPT交接-项目完整技术说明》。请基于该文档：
1）用 10 条要点概括项目；
2）画出算法调用链（从 /smart-map 按钮到具体 .py 文件）；
3）帮我写 3 分钟答辩口述稿；
4）不要编造文档中不存在的”已交付”能力。
```

或针对改代码（现在文档中已有完整核心代码段，可以直接引用）：

```text
请基于文档 5.2.2b 节的 conditioned_sensor_response 函数讨论：
如何在保证沿风可辨识性的前提下改进扩散宽度计算？
保持 PHYSICAL_ANCHOR_WEIGHT=0.97 不变，只改 effective_diffusivity_m2_s。
```

或针对粒子滤波调参：

```text
当前 ParticleFilterConfig 中 num_particles=12000, iterations=36,
kernel_scale=0.35。若要在精度和速度间折中，应优先调哪个参数？
参考文档 5.3.4b 节 _mcmc_rejuvenate 和 _log_likelihood 的实现。
```

或针对路径规划：

```text
D* Lite 的 get_traversal_cost 目前只用几何距离做边权。
如果要加入”毒性加权”（高毒性气体即使低浓度也应绕行），
应该在文档 5.4.5 节的哪个函数中修改？请给出修改方案。
```

---

## 13. 核心文件速查表（打印级）

### 算法

```text
algorithm/api_server.py
algorithm/engine/task_router.py
algorithm/diffusion/phase1_diffusion.py
algorithm/diffusion/conditioned_advection.py
algorithm/deep_learning/gas_surrogate.py
algorithm/inversion/forward_model.py
algorithm/inversion/grid_search.py
algorithm/inversion/source_inversion.py
algorithm/inversion/eki.py
algorithm/inversion/particle_filter.py
algorithm/planning/dstar_lite.py
algorithm/planning/evacuation_runner.py
algorithm/polo.py
```

### 前端

```text
frontend/src/api/algorithm.ts
frontend/src/views/screen/index.vue
frontend/src/components/SuperMapSceneViewer.vue
frontend/src/views/smart_map/index.vue
frontend/src/views/smart_map/useSmartMapDiffusionSimulation.ts
frontend/src/views/smart_map/useSmartMapSourceInversionActions.ts
frontend/src/views/smart_map/useSmartMapEvacuationPlanning.ts
```

### 后端

```text
backend/src/main/java/com/at/ChemicalApplication.java
backend/src/main/java/com/at/controller/*
backend/src/main/java/com/at/service/ImageAnalysisService.java
```

### 启动

```text
run-local.bat
shutdown.bat
.pyproject.toml / uv.lock
deploy/docker-compose.yml
```

---

## 14. 一句话总结

**基于时空智能和数字孪生的化工园区危险气体监测和溯源系统**（超图杯；简称时空智能数字孪生）是一套「**SuperMap 做空间底座 + 自研物理/AI 算法做化工应急推理 + Vue/Java 做业务编排**」的参赛作品：  
在本地可用 `run-local.bat` 拉起全栈；算法核心在 `algorithm/` 的扩散代理、粒子滤波溯源与 D\* Lite 疏散；答辩与 PPT 必须同时打透 **SuperMap 产品链** 与 **算法落图闭环**，并诚实声明仿真与验证边界。  
**勿与测绘赛作品名「智孪安澜」混用。**

---

*文档结束。敏感凭据请只查 `私密文件/` 本地维护，切勿粘贴到 ChatGPT 公开对话。*
