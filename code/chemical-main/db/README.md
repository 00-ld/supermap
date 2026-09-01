# 数据库目录说明

`db/` 是项目数据库资产的统一入口，用于说明 MySQL 初始化、迁移、种子数据、测试数据、ER 说明和备份规则。

当前运行中的 SQL 脚本仍保留在原有位置，避免破坏 Docker 部署和 Spring Boot 本地启动路径。`db/manifest.json` 记录这些脚本的职责和维护状态，后续新增数据库文件应优先放入本目录对应子文件夹。

## 目录结构

```text
db/
  README.md
  manifest.json
  schema/       # 建表脚本说明
  migrations/   # 版本迁移脚本说明
  seed/         # 种子数据说明
  test_data/    # 数据库测试数据说明
  er/           # ER 图、表关系和字段说明
  backups/      # 本地备份占位目录，真实备份禁止提交
```

## 当前脚本索引

| 类型 | 当前文件 | 用途 |
| --- | --- | --- |
| 初始化 | `deploy/mysql/init.sql` | Docker MySQL 容器启动时执行的主初始化脚本。 |
| 迁移 | `db/migrations/001_add_user_role.sql` | 为用户表增加角色字段的规范迁移脚本。 |
| 迁移 | `db/migrations/002_add_core_audit_columns.sql` | 为核心表补齐来源、创建时间和更新时间字段。 |
| 迁移 | `db/migrations/003_extend_monitor_point_semantics.sql` | 将 `monitor_point` 从名称目录扩展为带区域、传感器/视频源绑定、坐标和质量状态的监测点对象。 |
| 迁移 | `db/migrations/004_seed_monitor_point_video_sources.sql` | 为 4 个可公开演示监测点绑定前端公开视频源。 |
| 部署兼容迁移 | `deploy/mysql/migration_add_role.sql` | Docker/MySQL 兼容入口，保留给现有部署流程；语义应与 `db/migrations/001_add_user_role.sql` 保持一致。 |
| 后端本地资源 | `backend/src/main/resources/schema-gas.sql` | 气体类型表局部建表脚本。 |
| 后端本地资源 | `backend/src/main/resources/schema-sensor.sql` | 传感器布局与环境观测表局部建表脚本。 |
| 后端本地资源 | `backend/src/main/resources/init-sensor-db.sql` | 传感器布局、环境观测与气体初始化脚本。 |

## 强制要求

- 数据库使用 MySQL，字符集统一使用 `utf8mb4`。
- SQL 文件不得写入生产数据库密码、真实用户密码、API Key、token 密钥或其他敏感配置。
- 表结构变更必须新增迁移脚本，并同步更新 `db/manifest.json` 与相关接口文档。
- 种子数据必须是可公开、可复现、可脱敏的数据，不得包含真实生产用户数据或真实事故敏感数据。
- 真实数据库备份、导出文件和本地调试数据禁止提交到 GitHub。
- SQL 注释和 Markdown 文档必须保持 UTF-8，可读、可检索、可维护。

## 后续整理方向

1. 将 `deploy/mysql/init.sql` 拆分为 `db/schema/001_init.sql`、`db/seed/001_seed_sensor.sql` 等小文件。
2. 保留 `deploy/mysql/init.sql` 作为部署聚合脚本；A 套传感器（sensor/sensor_reading/monitor_point）已随 B 套迁移删除，`frontend/src/data/realSensorLayout.ts` 仅作前端布局参考，不再与数据库种子同步。
3. 为核心业务表补充 ER 图或字段字典，至少覆盖用户、小车、气体数据、告警、扩散任务、溯源任务和路径规划任务。
