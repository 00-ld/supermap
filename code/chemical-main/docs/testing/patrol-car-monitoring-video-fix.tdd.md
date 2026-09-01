# 巡检小车监测与视频修复 TDD 证据

## 用户旅程

- 巡检人员进入小车总览时，可以看到后端已有的连续采样；连续采样为空时，可以看到数据库中真实记录的预警事件观测。
- 巡检人员进入小车详情时，可以播放对应小车的视频，并看到该车的浓度、时间和坐标。
- 巡检人员进入厂区图像巡检时，可以播放四路重点监控视频。

## RED / GREEN

1. 连续采样优先，缺失车辆回退到真实预警事件
   - RED：`npm run test:unit -- --test-name-pattern "patrol|sampled|warning observations|priority monitor"` 因缺少 `src/data/patrolCarMonitoring.ts` 失败。
   - GREEN：`npm run test:unit` 全部通过。

2. 空值或非法浓度不显示为伪造的 0
   - RED：审查补测后，空字符串和纯空白字符串实际生成两条 `gasValue: 0`，用例按预期失败。
   - GREEN：`rejects empty and invalid observations instead of displaying a fabricated zero` 通过，覆盖 `null`、非数字、空字符串和纯空白字符串。

3. 历史预警事件只读，不重复写入为新告警
   - RED：新测试引用 `isActionablePatrolCarReading` 时，因模块尚未导出该能力而按预期编译失败。
   - GREEN：`keeps warning-history fallback observations read-only` 通过；详情页只让连续采样参与当前告警处理。

4. 八路本地视频资源不会在交付时遗漏
   - RED：原映射测试只比较字符串，删除视频后仍会通过。
   - GREEN：`maps every patrol car and priority monitor to a non-empty local asset` 实际检查八个文件存在且非空；浏览器抽检视频均可解码播放。

## 验证

- `npx prettier --write ...`：本次文本文件格式化成功。
- `npm run lint`：通过。
- `npm run typecheck`（Node 24.14.0）：通过。
- `npm run test:unit`：63 个测试全部通过，无跳过。
- `node --max-old-space-size=12288 node_modules/vite/bin/vite.js build`（Node 24.14.0）：通过。
- 浏览器本地桩验收：4 个总览图表渲染；四路重点监控视频和小车 1 详情视频完成解码并播放；详情显示 `31.4 %LEL`、坐标 `450/565`；控制台无错误。

## 已知边界

- 后端当前连续采样数组为空时，页面使用 `warning_history` 的真实事件观测，并明确标为“预警事件观测”；它不是连续实时采样。
- 历史事件在总览中以离散散点显示，在详情中标记为“历史预警事件”；它不会触发当前告警确认或再次写入数据库。
- 四段小车视频共约 100.6 MB，会增加部署包体积。
- 系统 Node 25.2.1 超出项目 `>=20 <25` 约束，Vite 在 chunk 渲染前无诊断退出；使用项目支持范围内的 Node 24.14.0 构建通过。
