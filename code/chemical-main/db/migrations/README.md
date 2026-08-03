# Migrations 目录

- `005_add_ai_decision_advice.sql`：新增智巡 AI 建议、规则兜底和人工审核记录表。

本目录用于存放数据库版本迁移脚本。当前规范迁移入口为：

- `001_add_user_role.sql`：为用户表补角色字段。
- `002_add_core_audit_columns.sql`：为核心表补来源、创建时间和更新时间字段。
- `003_extend_monitor_point_semantics.sql`：把监测点对象从名称目录扩展为区域、来源类型、传感器/视频源绑定、坐标和质量状态。

`deploy/mysql/migration_add_role.sql` 保留为现有 Docker/MySQL 部署流程的兼容入口；新增迁移应优先放在本目录，再按部署需要提供兼容入口或执行说明。

新增迁移脚本时请遵循：

- 文件名使用递增编号和简短说明，例如 `002_add_warning_event_table.sql`。
- 每个迁移只做一类结构变更，避免混入大量种子数据。
- 迁移脚本必须可重复审查，危险操作需要在注释中说明影响范围。
- 更新后同步维护 `db/manifest.json` 和接口/部署文档。
