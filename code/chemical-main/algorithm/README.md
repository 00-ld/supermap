# Algorithm Service

本目录存放 Python 算法服务与核心算法实现，包括危险气体扩散、泄漏源溯源、D* Lite 逃生路径规划和 YOLO 人员识别服务。

## 标准入口

- `api_server.py`：统一 FastAPI 算法服务入口，提供扩散、溯源、路径规划和健康检查接口。
- `polo.py`：YOLO11m 人员识别服务入口，用于小车摄像头图片识别，通常由 Java 后端通过 `ANALYSIS_SERVICE_URL` 内网调用。
- `response_utils.py`：统一 JSON 响应封装工具。
- `planning/gas_diffusion_astar.py`：旧扩散 + A* 组合能力，仅作为非公开回归对象保留；包根 `gas_diffusion_astar.py` 兼容导出已删除。

`algorithm.gas_diffusion_astar` 不再是有效入口。`algorithm/` 包内服务、测试、benchmark 和新增模块必须直接导入 `algorithm.planning.*`；质量审计会阻止重新依赖或恢复包根兼容壳。旧 `/api/gas-path` 与 `/api/time-series` 不再作为 FastAPI 公共路由暴露。

旧规划链内部模块必须显式保留 `LEGACY_REGRESSION_ONLY = True` 与 `PUBLIC_SERVICE_EXPOSED = False`。当前正式扩散入口是 `algorithm.diffusion.phase1_diffusion`，正式疏散规划入口是 `algorithm.planning.dstar_lite`；旧链不得重新作为服务 API、新页面入口或新增算法默认路径。

旧入口 `apiServer.py` 和 PyInstaller `.spec` 文件已删除。后续不得新增大小写混杂、职责重复的入口文件；服务入口统一使用蛇形命名。

## 子目录

```text
algorithm/
  deep_learning/  PyTorch 气体响应代理模型、训练/加载和深度学习校正层
  diffusion/      气体扩散模型、公式基准、真实数据样本验证和物理不变量测试
  inversion/      泄漏源反演、解析/EKI、粒子滤波溯源相关实现
  planning/       D* Lite 逃生路径规划实现
  engine/         算法任务路由与统一调度入口
```

## 本地运行

```bash
# 基础算法服务依赖
uv sync --frozen --no-dev --no-install-project
uv run uvicorn algorithm.api_server:app --host 127.0.0.1 --port 8000 --reload

# YOLO 人员识别依赖体积较大，必须显式安装 yolo extra
uv sync --frozen --no-dev --no-install-project --extra yolo
uv run uvicorn algorithm.polo:app --host 127.0.0.1 --port 8001 --reload
```

生产环境应通过 Docker/Nginx 内网访问算法服务，不应将算法端口直接暴露到公网。
标准 `deploy/docker-compose.yml` 会为 `yolo` 服务构建带 `yolo` extra 的镜像。

## 模型与密钥

- `yolo11m.pt` 等模型权重不得提交到 GitHub。
- `ALGORITHM_API_KEY`、数据库密码、第三方 API Key 必须通过环境变量或部署平台密钥注入。
- Python 服务代码默认 `ALGORITHM_REQUIRE_AUTH=true`，生产环境必须同时设置 `ALGORITHM_API_KEY` 并通过 `X-API-Key` 校验。
- 如本地单机调试确需临时关闭算法鉴权，必须在绑定 `127.0.0.1` 的开发会话中显式覆盖；不得写入部署配置，也不得当作代码默认值。
- YOLO 服务默认读取仓库 `models/yolo11m.pt`，生产环境应显式设置 `YOLO_MODEL_PATH` 指向服务器或容器内受控模型路径。
- 可选 YOLO 运行参数：`YOLO_DEVICE`、`YOLO_IMAGE_SIZE`、`YOLO_CONFIDENCE`。这些参数必须记录在部署环境中，不得写死到业务代码里。

## 验证命令

从仓库根目录运行，保持 `algorithm` 作为 Python 包入口：

```bash
uv run --no-sync python -m py_compile algorithm/api_server.py algorithm/response_utils.py algorithm/polo.py
uv run --no-sync python -m algorithm.diffusion.test_physical_invariants
uv run --no-sync python -m algorithm.diffusion.test_real_prairie_grass
uv run --no-sync python -m algorithm.inversion.validate_particle_filter
uv run --no-sync python -m algorithm.tests.test_path_hazard_avoidance
```

真实数据样本验证使用 `datasets/samples/prairie_grass/PGrassOBSAnalysis.txt`，来源和边界见 `docs/dataset-sources.md`。该测试只验证横风向扩散宽度 `Sy (m)`，不得把它扩大解释为绝对浓度或完整事故级模型验证。

当前扩散运行时使用 `deep_learning.gas_surrogate` 物理信息深度学习模型：PyTorch MLP 学习源点到传感器/网格点的浓度响应，并以 `diffusion.conditioned_advection` 作为安全锚点进行神经校正。`diffusion.gaussian_plume` 保留为 Prairie Grass 真实横风扩散宽度验证和历史公式基准，不再作为 `/api/diffusion/simulate` 的主场生成器。

`uv run --no-sync python -m algorithm.inversion.validate_particle_filter` 会先复用 Prairie Grass 真实扩散宽度验证，再用可复现的深度学习代理观测样本验证粒子滤波溯源定位、释放强度估计、噪声压力场景和多随机种子重复性。合成观测不得写成真实事故数据。重复性检查使用 9000 粒子和 24 轮迭代，避免用过低预算掩盖随机种子不稳定。

深度学习权重默认生成到 `models/deep_gas_surrogate.pt`。该权重由本项目物理教师模型监督训练得到，可复现但不提交 Git；缺失时算法服务会自动训练默认 CPU 模型。

## 提交边界

涉及真实数据集或大体积生成数据时，应只提交来源说明、元数据、小型可复现实验样本和必要验证脚本，不提交 `.npy`、模型权重、未脱敏数据或生产日志。
