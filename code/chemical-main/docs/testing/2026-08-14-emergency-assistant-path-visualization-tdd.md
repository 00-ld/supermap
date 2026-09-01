# 应急助手、路径规划与溯源可视化 TDD 记录

日期：2026-08-14

## RED

- `node --test tests/evacuationBuildingCollision.test.ts tests/inversionVisualizationPolicy.test.ts`
  - 失败原因：真实建筑轮廓/临路入口方法和溯源显示策略尚不存在。
- `mvn '-Dtest=EmergencyKnowledgeBaseServiceTest,EmergencyAdviceServiceTest' test`
  - 失败原因：应急知识库、模型网关和响应契约尚不存在。
- `node --test tests/emergencyAssistantFallback.test.ts`
  - 失败原因：未登录安全演示生成器尚不存在。
- `mvn '-Dtest=EmergencyKnowledgeBaseServiceTest' test`
  - 失败原因：真实索引 CSV 的 UTF-8 BOM 导致 `file` 表头无法识别。

## GREEN

- 前端单元测试：69 项通过。
- 后端单元/控制器测试：137 项通过。
- 移动端单元测试与 Debug APK：通过（使用 ASCII 临时盘符规避 Gradle 在中文路径下的测试类加载问题）。
- 前端 TypeScript 检查、ESLint、Prettier、Vite 生产构建：通过。
- 后端 Spring Boot JAR 打包：通过。

## 运行验收

- iServer 路网返回路径后，页面显示“二维、三维已同步”，不再因建筑包围盒误判而拒绝全部候选路线。
- 应急建议接口在未配置千问密钥时返回 `LOCAL_KNOWLEDGE_BASE`，并为液氨场景检索到 3 条事故资料。
- API 密钥仅从服务端环境变量读取；仓库敏感模式扫描为 0 项。
- 知识库复制后源/目标均为 83 个文件、152,157,561 字节。
