# Tools

本目录存放项目辅助脚本，用于审计、校验、数据整理和维护检查。工具脚本应低耦合、可重复执行，不应承载核心业务逻辑。

## 当前脚本

- `audit_repository.py`：检查 Git 已跟踪文件是否包含旧目录、旧前端页面目录、依赖缓存、构建产物、模型权重、真实环境文件等禁止提交内容。
- `code_quality_audit.py`：检查已跟踪源码中的顶层重复定义、明显无意义命名和 Python 模块命名，作为“禁止无效、重复、无意义代码”死规则的可执行底线。
- `generate_real_map_assets.py`：从真实 DOM TIFF 生成前端可加载地图 JPG 与元数据，默认 dry-run；写文件必须显式传入 `--write`。
- `generate_real_sensor_seed.py`：生成真实 DOM 传感器种子 SQL，默认 dry-run；写文件必须显式传入 `--write`。
- `prepare_btex_training_data.py`：从本地 BTEX/PANGAEA 原始表生成训练 CSV 与 manifest，默认 dry-run；写文件必须显式传入 `--write`。
- `prepare_prairie_grass_source_validation_data.py`：从本地 Prairie Grass D6589 原始表生成弧线观测 CSV 与 manifest，默认 dry-run；写文件必须显式传入 `--write`。
- `sensor_audit.py`：传感器相关数据和布局方案审计辅助脚本。
- `validate_real_sensor_layout.py`：校验 canonical 真实 DOM 传感器种子；默认只检查 `deploy/mysql/init.sql`，legacy `sensor_data.sql` 需显式参数。

## 维护规则

- 工具脚本不得写死 API Key、数据库密码、用户密码或生产服务器地址。
- 如需访问数据库、接口或模型服务，必须通过环境变量、参数或未提交的本地配置读取。
- 工具输出的临时报告、日志、缓存和中间数据不得默认写到仓库根目录。
- 脚本命名使用小写蛇形命名，例如 `sensor_audit.py`。
- 可以复用的能力放在函数中，避免在多个工具脚本中复制同一段解析、校验或请求逻辑。
- 需要长期维护或被部署定时执行的脚本，应迁移到对应服务目录或容器化部署说明中。

## 运行建议

```bash
python tools/audit_repository.py
python tools/code_quality_audit.py
python tools/sensor_audit.py
```

新增工具脚本时，应在本文件补充用途、输入、输出和安全注意事项。若脚本会修改数据库或文件，应默认提供 dry-run 模式。
