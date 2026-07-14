# Schema 目录

本目录用于存放规范化建表脚本。当前主初始化脚本仍位于 `deploy/mysql/init.sql`，以保持 Docker 部署兼容。

新增或拆分建表脚本时请遵循：

- 文件名使用递增编号，例如 `001_init_core_tables.sql`。
- 表和字段必须包含必要注释。
- 默认字符集使用 `utf8mb4`。
- 不在建表脚本中写入真实密码或真实生产数据。
- 更新后同步维护 `db/manifest.json`。
