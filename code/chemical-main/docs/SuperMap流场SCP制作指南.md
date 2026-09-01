# SuperMap iDesktopX 2026 三维流场接续指南

> 当前决定（2026-08-01）：暂停官方三维流场瓦片制作。前端继续使用现有的动态三维扩散粒子效果；已生成的速度场、CSV 和 UDBX 均保留，后续可从本文的恢复点继续。

## 当前已经完成的部分

- 扩散算法逐帧输出规则格点 `velocityField.cells`，每格包含 U/V/W。
- `tools/supermap/export-velocity-field-grid.mjs` 已改为输出 iDesktopX 2026 所需的稠密三维点网格 CSV，不再走旧版 GeoTIFF 路线。
- 算法坐标已转换到 EPSG:4547；算法 +Y 向南，因此导出时 V 分量反号为投影坐标的北向速度。
- 已生成 10 个时刻的 U/V/W 双精度字段，并在 UDBX 中保留 PointZ 几何。

现有恢复资产：

- 扩散响应：`G:\竞赛\超图杯\code\chemical-main\output\diffusion_result.json`
- CSV：`G:\竞赛\超图杯\三维瓦片数据_4490\三维流场瓦片\输入数据\diffusion_velocity_field_4547.csv`
- 清单：`G:\竞赛\超图杯\三维瓦片数据_4490\三维流场瓦片\输入数据\diffusion_velocity_field_manifest.json`
- UDBX：`G:\竞赛\超图杯\三维瓦片数据_4490\三维流场瓦片\flow_velocity_4547.udbx`
- 预留输出目录：`G:\竞赛\超图杯\三维瓦片数据_4490\三维流场瓦片\官方流体效果`

重新导出示例：

```powershell
node tools/supermap/export-velocity-field-grid.mjs `
  --input output/diffusion_result.json `
  --output "G:/竞赛/超图杯/三维瓦片数据_4490/三维流场瓦片/输入数据" `
  --z-levels 5,12,22,36
```

## 暂停位置与原因

iDesktopX 2026 的“空间网格索引”下拉框只接受整数型行、列、层字段，不能使用 X/Y/Z 双精度坐标字段。已经排除以下问题：

- CSV 不是稀疏点：网格点数等于 `行数 × 列数 × 层数`。
- U/V/W 不是文本：30 个时序速度字段均已转为 DOUBLE。
- 几何不是二维点：工作数据保留 PointZ。
- X/Y/Z 没有空值：坐标范围和导出清单一致。

工具仍在缓存构建阶段报告 `Dataset has wrong row,col or height`。当前最可能的剩余约束是 iObjects 对网格记录顺序或行列层编号规则另有内部要求；本轮按用户要求停止继续试错。

## 后续恢复步骤

1. 在 iDesktopX 2026 打开 `flow_velocity_4547.udbx`。
2. 使用一份新数据集副本，避免继续修改当前已准备数据。
3. 依次验证两种记录排序：`层→行→列` 和 `行→列→层`。
4. 行/列/层使用 INT32，并分别验证 0 起始和 1 起始；每组必须连续且无重复组合。
5. 在“时序要素操作”中只选择 U/V/W 双精度字段，按每个时刻三个字段分组。
6. 输出到“官方流体效果”目录，成功标志为同时出现 `.scp`、`.s3mb` 和 `.vol`。

iObjects 日志：

`F:\supermap-idesktopx-2026-windows-x64-setup\bin\log\iObjects.2026.08.01.PID35820.log`

## 前端接入条件

只有生成有效 SCP 后才启用官方效果：

```ts
const viewer = new SuperMap3D.Viewer(container, {
  contextOptions: { contextType: 2 },
})

const layer = await viewer.scene.addS3MTilesLayerByScp(scpUrl, { name: 'diffusion-flow' })
layer.particleVelocityFieldEffect.particleMode = 1
layer.particleVelocityFieldEffect.particleSize = 2
layer.particleVelocityFieldEffect.velocityScale = 10
layer.particleVelocityFieldEffect.horizontalDensity = 50
```

在 SCP 未成功前，生产界面继续使用 `SuperMapSceneViewer.vue` 中已经实现的速度场动态粒子。它直接消费同一份 U/V/W 算法输出，有明确生命周期、风向推进和浓度着色，是当前稳定方案，不依赖桌面缓存格式。

## 官方参考

- 本地示例：`D:\BaiduNetdiskDownload\supermap-iclient3d-for-webgl_webgpu-2026\examples\webgl\ParticleVelocityField.html`
- iDesktopX 2026 帮助：`https://help.supermap.com/iDesktopx/zh/tutorial/SceneOperation/3DTools/3DFiledData/3DField2Tile.html`
- SDK API：`D:\BaiduNetdiskDownload\supermap-iclient3d-for-webgl_webgpu-2026\docs\Documentation\ParticleVelocityFieldEffect.html`
