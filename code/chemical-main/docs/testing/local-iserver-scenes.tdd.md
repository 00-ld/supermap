# 本地 iServer 六场景 TDD 证据

## 用户旅程

园区大屏用户切换六个独立三维场景时，所有配置和瓦片必须来自本机 iServer；重复进入场景或返回主园区不得残留旧图层，快速操作不得触发并发提交。

## RED / GREEN

| 保证                                                 | RED 证据                                                         | GREEN 证据                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| 每次 staged 图层使用唯一集合键，Map 容器只返回图层值 | `npm run test:unit` 因缺少 `createStagedSceneLayerName` 导出失败 | `npm run test:unit`，36/36 通过                 |
| SDK thenable 延迟拒绝可在提交前检出                  | 测试因缺少 `throwIfPromiseRejected` 导出失败                     | `sceneLayerCollection.test.ts` 延迟拒绝用例通过 |
| 兼容索引重写保留 query                               | 测试因缺少 `iServerProxy.ts` 失败                                | `iServerProxy.test.ts` 通过                     |

## 验证

| 类型       | 命令/证据                                                                                                | 结果                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 单元测试   | `npm run test:unit`                                                                                      | PASS，36/36                                                                  |
| 目标覆盖率 | `node --test --experimental-test-coverage tests/sceneLayerCollection.test.ts tests/iServerProxy.test.ts` | PASS，行 97.50%，分支 93.33%，函数 91.67%                                    |
| 类型检查   | `npm run typecheck`                                                                                      | PASS                                                                         |
| Lint       | `npm run lint`                                                                                           | PASS                                                                         |
| 空间契约   | `npm run validate:spatial-assets`                                                                        | PASS，7 场景、4 出入口、6 泄漏源                                             |
| 生产构建   | Node 24 执行 `vite build`                                                                                | PASS，6002 模块，29.95 秒                                                    |
| 浏览器集成 | `node output/playwright/local-six-scenes-audit.cjs`                                                      | PASS；六场景 config=200、tile=206，远端/失败请求=0，重复进入和返回主园区通过 |

## 已知边界

- 测试使用本机 iServer 8090 与开发站点 5173；正式部署仍需让 `/iserver` 保持同源反向代理。
- 后端 8081 未在本次本地三维验收范围内启动。
- 工作树包含用户既有改动，本次没有创建 TDD checkpoint commit，以免混入或覆盖用户改动。
