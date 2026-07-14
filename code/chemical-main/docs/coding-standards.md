# 编码规范

本文档定义了化工园区智能监测项目的代码规范，所有开发人员应严格遵守。

## 通用规范

### 命名规范（Google Style）

| 类型 | 规范 | 示例 |
|------|------|------|
| 类/接口 | PascalCase | `CarController`, `UserService` |
| 方法/函数 | camelCase | `getAllCars()`, `formatGeoCoord()` |
| 常量 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| 变量 | camelCase | `carList`, `userStore` |
| 包名 | lowercase | `com.at.controller` |
| Python 模块 | snake_case | `diffusion_runner.py` |
| Python 类 | PascalCase | `AStarPathPlanner` |

### 目录命名规范

- 一级目录统一使用小写英文领域名，当前规范目录为 `frontend/`、`backend/`、`algorithm/`、`twin/`、`db/`、`datasets/`、`models/`、`docs/`、`tests/`、`tools/`、`scripts/`、`docker/`、`deploy/`、`config/`、`uploads/`、`logs/`、`assets/`、`.github/`。
- 禁止提交中文目录名、空格目录名、大小写混用目录名、个人临时目录名和旧工程目录名。
- 历史目录名必须归并到规范目录：`Manage/` 归并到 `frontend/`，`Back/` 归并到 `backend/`，`algorithm_tests/` 归并到 `tests/`，`python/` 归并到 `algorithm/`，`chemical-park-monitor/` 拆分归档到对应规范目录。
- 二级目录按技术栈约定命名：Python 使用 `snake_case`，Java 包路径使用小写英文，Vue 组件目录使用清晰英文语义。
- `uploads/` 与 `logs/` 只保留占位说明和忽略规则，真实上传文件、运行日志、生产日志不得提交。
- `models/` 默认只提交说明、清单和轻量配置，模型权重文件不得提交。
- `datasets/` 默认只提交来源说明、清单和小型可复现实验样本，大型原始数据应存放在外部受控位置。

### 文件结构

```
frontend/
  views/        → 页面级组件
  components/   → 可复用组件
  api/          → API 接口封装
  store/        → 状态管理
  utils/        → 工具函数
  data/         → 静态数据

backend/
  controller/   → 请求处理层
  service/      → 业务逻辑层
  mapper/       → 数据访问层
  pojo/         → 数据模型
  utils/        → 工具类

algorithm/
  diffusion/    → 扩散模型
  inversion/    → 溯源反演
  planning/     → 路径规划
  engine/       → 引擎路由
```

### 死规则：禁止无效、重复、无意义代码

严禁为了图方便写入无效、重复、无意义或无法验证的代码。新增代码、变量、函数、接口、文档和数据文件必须能说明用途、调用路径、输入输出、验证方式和失败边界；经不起代码审查、搜索去重、测试运行或业务流程验证的内容不得提交。

强制执行：

- 不复制已有函数后改名凑功能；能复用就复用，不能复用必须说明差异。
- 不新增同义重复变量、重复状态、重复 API 封装、重复模型入口、重复页面入口。
- 不保留未调用、无业务含义、无数据来源、无验证命令的代码或文件。
- 不提交“以后可能有用”的占位实现、假接口、假数据、无效注释或不可维护的大段生成内容。
- 新增核心逻辑必须至少具备一种验证证据：类型检查、单元测试、接口测试、算法验证、构建验证、仓库审计或人工复现步骤。
- 临时不可验证的内容必须写明原因、风险和后续验证办法，且不得对外宣称为已完成能力。

---

## 前端规范 (Vue3 + TypeScript)

### 组件规范
- 统一使用 `<script setup lang="ts">` Composition API
- 组件名多词 PascalCase，避免与 HTML 元素冲突
- 使用 `defineOptions({ name: 'ComponentName' })` 定义组件名

### 类型安全
- 禁止使用 `: any`，必须定义具体接口
- API 响应需定义返回类型
- props 使用 `defineProps<Type>()` 带类型参数

### 导入顺序
```
// 1. Vue 框架
import { ref, computed } from 'vue'
// 2. 第三方库
import { ElMessage } from 'element-plus'
// 3. 本地模块
import request from '@/utils/request'
```

### 状态管理
- 使用 Pinia，模块化拆分 store
- 组件内使用 `storeToRefs()` 解构

---

## 后端规范 (Java / Spring Boot)

### API 响应
- 业务 Controller 统一返回 `Result<T>` / `Result<?>` 响应体，不再在每个接口叠加 `ResponseEntity<Result<T>>`
- HTTP 状态语义集中在 `@RestControllerAdvice` 等异常边界处理，避免接口层同时维护 HTTP 状态和 body 状态两套业务语义
- 不手动构建 `Map<String, Object>` 响应

### 异常处理
- 业务异常抛出特定异常类型
- `@RestControllerAdvice` 全局统一处理

### 日志
- 使用 `@Slf4j` 注解
- 关键操作记录 `log.info()`，异常记录 `log.error()`

### 校验
- Controller 参数使用 `@Valid` 注解校验
- 实体字段使用 `@NotBlank`、`@Min` 等校验注解

---

## 算法规范 (Python)

### 文档字符串
使用 Google 风格 docstring：

```python
def function_name(param1: str, param2: int) -> bool:
    """简短描述功能。

    Args:
        param1: 参数1描述。
        param2: 参数2描述。

    Returns:
        返回值描述。

    Raises:
        ValueError: 异常条件描述。
    """
```

### 导入顺序
每组按字母序排列，组间空一行：
```
# 标准库
import math
from typing import Dict

# 第三方库
import numpy as np
from fastapi import FastAPI

# 本地模块
from diffusion.diffusion_runner import run_simulation
```

### API 统一返回
Java 后端和 Python 算法服务的主响应契约为 `{"code": int, "message": string, "data": ..., "ok": bool, "timestamp": number, "requestId": string}`。算法服务外层响应不得再复制 `success/error` 兼容字段；业务状态和错误细节只允许作为 `data` 内的领域结果或 trace 元数据出现。
