# Seed 目录

本目录用于存放可公开、可复现的种子数据。当前 Docker/MySQL 规范种子入口是 `deploy/mysql/init.sql`，其中已包含传感器点位数据。

`deploy/mysql/sensor_data.sql` 仅保留为历史参考，不是 canonical seed，也不应作为初始化流程入口执行。

生成真实 DOM 传感器种子时，`python tools/generate_real_sensor_seed.py` 默认只做 dry-run；需要写文件时必须显式传入 `--write`，写 legacy 路径还必须额外传入 `--legacy-sensor-data`。

新增种子数据时请遵循：

- 不包含真实用户、真实事故、真实生产敏感数据。
- 数据来源、生成方式或人工维护依据必须写入注释或配套文档。
- 大体积或非公开数据不提交到 GitHub。
- 更新后同步维护 `db/manifest.json`。
