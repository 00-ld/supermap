# 真实二维地图与传感器布点说明

## 地图来源

- 原始文件：`external-real-dom-source/ResultDOM_2.tiff`（脱敏来源标识，不记录本机绝对路径）
- 原始尺寸：31744 x 18944 px
- 原始分辨率：0.05 m/px
- 真实边界：1587.2 m x 947.2 m
- 前端资产：`frontend/public/maps/real-park-dom.jpg`
- 前端坐标：以左上角为 `(0, 0)`，单位为 m，不得越过 `0 <= x <= 1587.2`、`0 <= y <= 947.2`

## 识别设备区域

当前按真实 DOM 图像中的连续设备、罐组、塔器、仓储和公用工程边界建立确定区域，不使用旧 Canvas 假地图区域：

| 区域 ID | 名称 | 边界 `(x, y, w, h)` m |
| --- | --- | --- |
| `pa-west-north` | 西北生产装置区 | `(248, 252, 334, 176)` |
| `pa-west-south` | 西南储罐与泵区 | `(248, 430, 334, 242)` |
| `pa-center-north` | 中北厂房装置区 | `(588, 252, 168, 176)` |
| `pa-center-south` | 中南反应装置区 | `(588, 430, 168, 242)` |
| `ut-center` | 公用工程与管廊区 | `(760, 252, 88, 420)` |
| `tw-center` | 中东塔器与罐组区 | `(856, 252, 90, 420)` |
| `pb-north-tank` | 东北罐组与管汇区 | `(956, 252, 260, 170)` |
| `pb-mid-process` | 东中生产与污水装置区 | `(956, 420, 260, 116)` |
| `fs-east-yard` | 东侧应急与装卸边界区 | `(984, 536, 92, 126)` |
| `wh-logistics` | 东南仓储物流区 | `(1076, 536, 140, 126)` |

## 布点口径

- 布点依据：GB/T 50493-2019 的释放源、罐组、防火堤、管廊、通风/边界监测布置思想。
- 混合检测对象：`CO/CH4/NH3/O2`。
- 对含有毒气体监测的生产、罐区、塔器、管汇点，种子数据采用 4 m 有效半径。
- 仓储、装卸、应急边界点采用 8 m 有效半径。
- 低位点 `L` 安装高度为 0.5 m，高位点 `H` 安装高度为 2.2 m；无后缀边界点安装高度为 1.5 m。
- 每条 SQL 点位都包含 `install_remark`，记录标准依据和真实 DOM 设备区域来源。

## 校验

运行：

```powershell
python tools\validate_real_sensor_layout.py
```

校验内容：

- 点位 ID 不重复。
- 点位不越过真实地图数据边界。
- 每个点只落入一个识别设备区域，避免模棱两可的区域归属。
- 同一坐标与同一安装高度不重复。
- 每个点位备注必须包含 `GB/T 50493-2019` 依据。

当前默认校验结果：`deploy/mysql/init.sql` 包含 61 个有效点位，并作为 Docker/MySQL 初始化的 canonical seed。

`deploy/mysql/sensor_data.sql` 仅是历史参考文件，不是初始化入口，也不会被默认校验。若需要审查这个 legacy 文件，使用：

```powershell
python tools\validate_real_sensor_layout.py --include-legacy-sensor-data
```
