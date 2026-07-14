# tests - 气体扩散与溯源模型测试数据

本目录用于保存小体积、可复现的算法回归测试数据，覆盖气体扩散正向模型、传感器观测数据和溯源模型输入样例。

## 数据性质

- 当前数据集为解析公式和固定随机种子生成的合成数据，不是现场实测数据。
- 数据主要用于验证模型实现是否复现高斯烟羽/烟团解析解，不能替代真实园区标定或事故复盘数据。
- `ground_truth.json` 仅用于测试评估，严禁作为溯源算法输入，避免数据泄漏。
- 大体积 `.npy` 体数据由 `generate_dataset.py` 本地生成，默认不提交到 GitHub。

## 快速验证

在项目根目录运行：

```bash
python tests/test_forward_model.py
```

当前仓库内保留了 2D CSV 和传感器观测 CSV，因此该命令可以直接完成 2D 稳态烟羽验证。若需要 3D 体数据对比，先运行：

```bash
python tests/generate_dataset.py
```

生成的 `.npy` 文件会被 `.gitignore` 排除，只作为本地验证产物。

## 数据目录

```text
tests/
  config.json                         全局生成参数与随机种子
  generate_dataset.py                 可复现数据生成脚本
  test_forward_model.py               正向扩散模型回归验证脚本
  case01_gaussian_plume/
    stability_A.csv ... stability_F.csv
    meta.json
  case02_puff_timeseries/
    receptor_timeseries.csv
    meta.json
  case03_sensor_observations/
    sensors.csv
    observations.csv
    ground_truth.json
  case04_multi_source/
    wind_field.csv
    observations.csv
    ground_truth.json
```

## 场景说明

| 场景 | 用途 | 当前提交内容 |
| --- | --- | --- |
| Case 1 Gaussian Plume | 连续点源、6 档稳定度、地面 2D 浓度场验证 | CSV + meta |
| Case 2 Puff Timeseries | 瞬时烟团、固定受体点时序曲线 | CSV + meta |
| Case 3 Sensor Observations | 单源传感器观测、含噪浓度、溯源输入样例 | CSV + ground truth |
| Case 4 Multi Source | 多源叠加、时变风场、高难度溯源样例 | CSV + ground truth |

## 单位约定

| 量 | 单位 | 说明 |
| --- | --- | --- |
| `x / y / z` | m | `x` 为下风向距离，`y` 为横风向距离，`z` 为高度 |
| `u` | m/s | 风速 |
| `Q` | g/s | 连续源源强 |
| `mass` | g | 瞬时释放总质量 |
| `C` | mg/m^3 | 浓度 |
| `wind_direction` | degree | 气象约定的风来向，270 表示西风 |

## 验证指标

`test_forward_model.py` 输出以下指标：

- `FAC2`: 预测值落在观测值 0.5 到 2 倍范围内的比例。
- `FB`: fractional bias，衡量整体偏高或偏低。
- `NMSE`: normalized mean square error，归一化均方误差。
- 峰值浓度、峰值位置和横风向宽度。

## 维护约束

- 修改 `config.json` 后必须重新运行 `generate_dataset.py`，并检查 CSV 差异是否符合预期。
- 不提交 `.npy`、缓存、临时输出和无来源大文件。
- 新增真实数据集时必须补充数据来源、下载时间、许可证、预处理步骤和适用边界。
- 结论必须保持客观：说明误差、适用范围和失败场景，不写“绝对准确”等表达。
