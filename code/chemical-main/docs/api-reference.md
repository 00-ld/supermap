# API 接口文档

本文档记录当前项目接口约定。Java 后端、前端管理系统与 Python 算法服务均使用统一 JSON 响应外壳；算法业务状态、错误细节与工程化 trace 元数据放在 `data` 内，不在外层复制 `success/error` 字段。

## 统一认证

- 登录、注册接口不需要 token。
- 其他管理接口需要在请求头携带 `token`。
- 算法内部调用使用 `X-API-Key`，密钥只能来自环境变量或部署配置，不得写入代码。

## 统一响应结构

当前正式协议如下：

```json
{
  "code": 200,
  "message": "成功",
  "data": {},
  "ok": true,
  "timestamp": 1789000000000,
  "requestId": "2f0b4b6d-0f40-44f2-b13c-2d8fd7d8d8c4"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | number | 是 | 业务状态码。当前前端以 `ok === true` 或 `code === 200` 判断外层调用成功。 |
| `message` | string | 是 | 简短提示信息，失败时用于前端展示。 |
| `data` | object/array/string/null | 是 | 业务数据主体。 |
| `ok` | boolean | 是 | 成功标记，`code === 200` 时为 `true`。 |
| `timestamp` | number | 是 | 服务端响应时间，Unix 毫秒时间戳。 |
| `requestId` | string | 是 | 单次请求追踪 ID，同时写入 `X-Request-Id` 响应头和后端日志 MDC；调用方可通过请求头 `X-Request-Id` 传入自己的追踪 ID。 |

失败示例：

```json
{
  "code": 401,
  "message": "未登录",
  "data": null,
  "ok": false,
  "timestamp": 1789000000000,
  "requestId": "b4c0e0ba-65f2-48ef-a5fd-4a32a37c5a31"
}
```

## Java 后端 API

默认开发端口：`8081` 或部署配置指定端口。

### 用户认证

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 用户登录，成功后 `data` 返回 token。 |
| POST | `/api/auth/register` | 用户注册。 |

### 用户与人员管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/user/list` | 查询后台用户列表，需 admin。 |
| POST | `/api/user` | 新增后台用户，需 admin。 |
| PUT | `/api/user/{id}` | 更新后台用户角色或密码，需 admin。 |
| DELETE | `/api/user/{id}` | 删除后台用户，需 admin。 |
| GET | `/api/employee/list` | 查询员工列表。 |
| POST | `/api/employee` | 新增员工，需 admin。 |
| PUT | `/api/employee/{id}` | 更新员工，需 admin。 |
| DELETE | `/api/employee/{id}` | 删除员工，需 admin。 |

### 小车管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/car/getAllCars` | 查询所有小车最新状态。 |
| POST | `/api/car/setWarning` | 手动设置小车预警状态。 |
| POST | `/api/car/resetStatus` | 重置小车状态。 |

### 图像分析

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/analysis/person` | 上传 JPG/PNG 图片，调用 YOLO11m 人员识别。 |
| GET | `/api/analysis/list` | 查询巡检识别记录。 |
| GET | `/api/analysis/summary` | 查询 YOLO 当前识别人数、耗时、风险数和在线设备等汇总指标。 |
| DELETE | `/api/analysis/delete/{id}` | 删除巡检识别记录。 |

`/api/analysis/person` 的 `data` 示例：

```json
{
  "status": "success",
  "count": 3,
  "image_base64": "data:image/jpeg;base64,...",
  "detectionSchemaVersion": "yolo-detection/v1",
  "detections": [
    {
      "frameIndex": 0,
      "bbox": {
        "format": "xyxy_pixel",
        "x1": 120.5,
        "y1": 84.2,
        "x2": 188.7,
        "y2": 260.4,
        "width": 68.2,
        "height": 176.2
      },
      "confidence": 0.91,
      "classId": 0,
      "className": "person"
    }
  ],
  "requestId": "2f0b4b6d-0f40-44f2-b13c-2d8fd7d8d8c4",
  "inputSummary": {
    "sourceType": "uploaded-image",
    "payloadDigest": "d23f4c0b9a71e2ad",
    "imageWidth": 1280,
    "imageHeight": 720,
    "frameCount": 1
  },
  "algorithm": {
    "name": "yolo-person-detection",
    "modelId": "yolo11m-person-detector",
    "modelVersion": "yolo11m"
  },
  "runtime": {
    "costMs": 86.4,
    "worker": "algorithm-node-1"
  },
  "warnings": [],
  "errors": [],
  "grayRelease": {
    "channel": "stable",
    "trafficPercent": 100,
    "rollbackTarget": "yolo11m"
  },
  "fallback": {
    "used": false,
    "strategy": "NONE"
  }
}
```

### 传感器与气体数据

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/sensor/list` | 查询传感器列表。 |
| POST | `/api/sensor/add` | 新增传感器。 |
| POST | `/api/sensor/update` | 更新传感器。 |
| POST | `/api/sensor/delete` | 删除传感器。 |
| GET | `/api/gas/list` | 查询气体类型。 |
| POST | `/api/gas/add` | 新增气体类型。 |
| POST | `/api/gas/update` | 更新气体类型。 |
| POST | `/api/gas/delete` | 删除气体类型。 |

### 监测概览、点位与读数

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/monitoring/overview` | 查询监测概览；读数和趋势只来自 `sensor_reading`，不从 `warning_history` 回退。 |
| GET | `/api/monitor-point/list` | 查询监控点位列表。 |
| POST | `/api/monitor-point` | 新增监控点位，需 admin。 |
| DELETE | `/api/monitor-point/{id}` | 删除监控点位，需 admin。 |
| GET | `/api/environment-reading/latest` | 查询最新环境读数。 |
| GET | `/api/environment-reading/recent` | 查询近期环境读数。 |
| POST | `/api/environment-reading/add` | 新增环境读数，需 admin。 |
| GET | `/api/simulation-monitoring/scenarios/latest` | 查询最新仿真监测场景。 |
| GET | `/api/simulation-monitoring/scenarios/recent` | 查询近期仿真监测场景。 |
| POST | `/api/simulation-monitoring/scenarios/add` | 新增仿真监测场景，需 admin；不得冒充真实硬件场景。 |
| GET | `/api/simulation-monitoring/readings/latest` | 查询最新仿真/来源标注读数。 |
| GET | `/api/simulation-monitoring/readings/recent` | 查询近期仿真/来源标注读数，可按 `sensorId` 过滤。 |
| POST | `/api/simulation-monitoring/readings/add` | 新增仿真读数，需 admin；当前仓库只接受 `source=simulation` 与 `qualityStatus=SIMULATED`。 |

### 监控点位布局

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/sensor-layout/list` | 查询布局方案列表。 |
| GET | `/api/sensor-layout/{id}` | 查询布局方案详情。 |
| POST | `/api/sensor-layout/save` | 保存布局方案。 |
| DELETE | `/api/sensor-layout/{id}` | 删除布局方案。 |

### 预警历史

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/history/list` | 获取预警历史列表。 |
| POST | `/api/history/add` | 保存预警记录。 |
| POST | `/api/history/delete` | 删除预警记录。 |

### 应急预案

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/emergency-plan/list` | 查询应急预案列表。 |

### 健康探针

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/healthz` | 容器存活探针，不在 `/api` 下，不触达数据库，不需要 token。 |

## Python 算法 API

默认开发端口：`8000`。算法服务应接收 `X-API-Key`，并避免在日志中输出密钥。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 服务健康检查。 |
| GET | `/api/gas-types` | 获取气体类型信息。 |
| POST | `/api/engine/run` | 低层算法任务网关，仅用于内部兼容、调试或批量任务转发；前端业务页面不得把它作为主要调用链路。 |
| POST | `/api/diffusion/simulate` | 运行气体扩散模拟。 |
| POST | `/api/inversion/coarse-search` | 泄漏源粗搜索。 |
| POST | `/api/inversion/solve` | 泄漏源反演求解。 |
| POST | `/api/inversion/particle-filter` | 粒子滤波泄漏源反演，输出位置、释放强度、置信区间和诊断指标。 |
| POST | `/api/planning/evacuation` | D* Lite 疏散路径规划。 |

`/api/engine/run` 保留是为了让受控调用方按任务类型转发到同一算法服务，响应仍必须包含统一追踪字段、输入摘要、运行时、警告和失败/兜底标记。面向页面的稳定链路应直接使用 `/api/diffusion/simulate`、`/api/inversion/*` 与 `/api/planning/evacuation`。

旧版 `/api/gas-path` 与 `/api/time-series` 已从公开 FastAPI 服务面移除。旧算法实现仅保留为内部回归对象，页面和 API 层必须使用当前扩散模拟与 D* Lite 疏散规划链路。

## 响应码说明

| code | 说明 |
| --- | --- |
| 200 | 请求成功。 |
| 400 | 请求参数错误。 |
| 401 | 未登录、token 缺失或 token 无效。 |
| 403 | 已登录但权限不足。 |
| 404 | 资源不存在。 |
| 413 | 上传文件超过限制。 |
| 429 | 请求过于频繁。 |
| 500 | 服务端内部错误或算法服务异常。 |

## 维护约束

- 新增接口必须返回统一响应结构。
- 页面组件不得散落硬编码服务地址，确需直连时必须使用环境变量前缀。
- 新增字段、错误码或鉴权方式时，需要同步更新本文档。
- 不得提交真实 API Key、数据库密码、用户密码、token 密钥或真实 `.env` 文件。
