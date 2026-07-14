# CGCS2000 二维数据转换成果

生成时间：2026-07-14T03:55:42.175Z

目标坐标系：CGCS2000_3GK_CM_114E / EPSG:4547
经纬度备案：EPSG:4490

## 控制点

| 控制点 | 本地坐标 | EPSG:4547 坐标 | 用途 |
|---|---:|---:|---|
| CP0 南门锚点 | (1218, 682) | (458970.343, 3855563.172) | 园区大门 = 河工大南门 |
| CP1 北侧入口 | (1218, 230) | (458970.343, 3856015.172) | 控制南北方向比例 |
| CP2 西侧入口 | (238, 235) | (457990.343, 3856010.172) | 控制东西方向比例 |
| CP3 东侧入口 | (1228, 684) | (458980.343, 3855561.172) | 校核入口近邻位置 |
| CP4 西北角 | (0, 0) | (457752.343, 3856245.172) | 校核整体包络 |
| CP5 东南角 | (1587.2, 947.2) | (459339.543, 3855297.972) | 校核整体包络 |

## 字段契约

- GeoJSON geometry 已转换为 EPSG:4547 米制投影坐标。
- `mapX/mapY` 保留原始本地米制质心字段，兼容既有校核记录。
- `localMapX/localMapY` 明确表示原始本地坐标。
- `cgcs2000E/cgcs2000N` 表示 EPSG:4547 投影坐标。
- `longitude/latitude` 为 CGCS2000 地理坐标展示参考。
- `s3mX/s3mY` 保留当前 EPSG:0 三维缓存本地坐标，仅用于旧三维缓存对照。

## 导入 iDesktopX

```powershell
$env:SUPERMAP_SOURCE_DATA_ROOT="G:\竞赛\超图杯\报告素材\二维数据集识别\supermap_import_cgcs2000"
$env:SUPERMAP_OUTPUT_DATASOURCE="G:\竞赛\超图杯\报告素材\二维数据集识别\supermap_udbx\chemical_park_vectors_cgcs2000.udbx"
$env:SUPERMAP_SOURCE_CHARSET="UTF-8"
python tools\supermap\import-vector-datasets-iobjectspy.py
```

如果 iDesktopX 导入 UTF-8 后出现中文乱码，再将本目录 GeoJSON 转为 GB18030，并把 `SUPERMAP_SOURCE_CHARSET` 改为 `GB18030`。
