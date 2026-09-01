# Seed 目录

本目录用于存放可公开、可复现的种子数据。当前 Docker/MySQL 规范种子入口是 `deploy/mysql/init.sql`。

A 套传感器（sensor/sensor_reading/monitor_point）已随 B 套（iServer 模型绑定点位）迁移删除，`deploy/mysql/sensor_data.sql` 亦已移除，不再有 legacy 传感器种子参考文件。

新增种子数据时请遵循：

- 不包含真实用户、真实事故、真实生产敏感数据。
- 数据来源、生成方式或人工维护依据必须写入注释或配套文档。
- 大体积或非公开数据不提交到 GitHub。
- 更新后同步维护 `db/manifest.json`。
