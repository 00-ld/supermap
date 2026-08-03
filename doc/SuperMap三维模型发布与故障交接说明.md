# SuperMap 三维模型发布与故障交接说明

> 用途：交给 Claude/Codex/其他 Agent，继续完成 SuperMap iServer 发布、三维点击查询和空间查询，并定位当前“桌面端正常、iServer 不显示且飞到欧洲”的问题。

## 1. 项目目标

将一个在 3ds Max 中制作的化工园区三维模型，经过对象拆分、命名、坐标配准和 S3M 切片后，发布到远端 SuperMap iServer，供 Vue 3 + SuperMap iClient3D/WebGL 前端使用。

最终需要实现：

1. 在球面场景中正确定位到郑州；
2. 三维模型可正常加载；
3. 点击设备可获取唯一编号和属性；
4. 可按设备位置执行范围、相交、邻近、扩散影响设备等空间查询；
5. 服务可由远端 iServer 稳定提供。

---

## 2. 当前软件与环境

- Autodesk 3ds Max 2024
- SuperMap iDesktopX 2026（试用版）
- SuperMap iServer 2026 Beta，日志中的服务端包版本为 `12.1.0-SNAPSHOT`
- iServer HTTP 端口：`8090`
- 当前为 Windows 部署

需要优先检查 iDesktopX 与 iServer 的具体构建号是否兼容，避免桌面端生成的 S3M/SCP 元数据格式高于或不同于服务器端解析能力。

---

## 3. 已完成的数据处理

### 3.1 3ds Max 处理

原始模型包含一万多个组件，已经进行：

- 解组和拆分；
- 对象分类和命名；
- 删除部分小对象；
- FBX 导出；
- 单位统一为米。

模型对象名称已经保留到 SuperMap 属性表的 `ModelName` 字段，例如：

```text
BUILDING_001
TANK_001
PIPE_001
EQUIPMENT_001
```

`ModelName` 当前可以直接作为业务唯一标识使用，不必依赖 SuperMap 内部的 `SmID`。

### 3.2 SuperMap 导入和配准

原始 FBX 已成功导入为模型数据集。

关键数据集大致如下：

```text
result_ImportFBX          原始模型数据集
模型控制点                模型局部坐标的三维点
result_point3DTo2D        模型控制点转换得到的二维点
控制点                    目标投影坐标点
配准后模型                初次配准结果
配准后模型_4547           当前最终投影模型
```

### 3.3 最终模型坐标系

当前最终模型 `配准后模型_4547` 的坐标系为：

```text
CGCS2000 / 3-degree Gauss-Kruger CM 114E
EPSG:4547
单位：米
中央经线：114°
东偏移量：500000 m
```

模型范围约为：

```text
左：456319.762554006
下：3853570.6847651117
右：458736.0953950485
上：3855579.122220221
```

该范围在数值上符合郑州附近 EPSG:4547 投影坐标的量级。

---

## 4. 配准控制点

### 4.1 模型局部控制点（源点，单位：米）

| 序号 | 源点 X | 源点 Y | Z |
|---|---:|---:|---:|
| 1 | -455.499 | 222.642 | 0 |
| 2 | -448.346 | -180.638 | 0 |
| 3 | -36.004 | 151.265 | 0 |
| 4 | 455.687 | -179.136 | 0 |

### 4.2 目标控制点（EPSG:4547，单位：米）

| 序号 | 目标 X/E | 目标 Y/N |
|---|---:|---:|
| 1 | 457470.180 | 3854923.464 |
| 2 | 457477.333 | 3854520.184 |
| 3 | 457889.675 | 3854852.087 |
| 4 | 458381.366 | 3854521.686 |

### 4.3 配准结果

线性配准的 X/Y 残差约为 `10^-10 m`，说明这四组点在数学上完全一致。

但必须注意：

- 该化工园模型并不是河南工业大学校园的真实复刻；
- 目标点是按照“一个南门锚点 + 模型 X 向东 + 模型 Y 向北 + 1:1 米制比例”推算出来的；
- 近零残差只能证明转换关系自洽，不能证明模型与真实地物具有测绘级重合精度；
- 当前定位属于“人为布设的工程展示位置”，不是实测配准。

---

## 5. 已生成的三维瓦片

当前已经生成 S3M 瓦片目录：

```text
ChemicalPlant_S3M/
├─ Tile_*/
├─ attribute.db
├─ attribute.json
└─ ChemicalPlant_S3M.scp
```

已确认：

- 存在 `.scp` 索引文件；
- 存在 `attribute.db`；
- 存在 `attribute.json`；
- 瓦片目录完整；
- 属性表包含 `ModelName`。

当前生成参数中曾使用：

```text
S3M 3.01
MeshOpt
DB 属性存储
S3MB
四叉树
LOD 3
```

需要重点确认“坐标转换”是否在切片时被错误启用。之前界面中曾勾选：

```text
目标坐标系：GCS_China_2000 / EPSG:4490
转换方法：Geocentric Translation (3-para)
```

这一步存在较大风险，因为源数据和目标数据都基于 CGCS2000，同一基准下不应设置非零三参数基准转换。为了减少隐藏转换，建议采用下面的干净发布路线。

---

## 6. 当前故障现象

### 6.1 桌面端

- `配准后模型_4547` 在 iDesktopX 中可正常显示；
- 模型位置和尺度基本正常；
- 球面场景中能够看到模型；
- `ModelName` 属性存在。

### 6.2 iServer

- 发布后场景不显示；
- 相机或场景定位直接飞到欧洲；
- 三维服务加载失败或为空；
- 日志显示部分 `local3DCache-*` 服务提供者创建失败。

---

## 7. 日志中已经确认的问题

日志中最关键的错误不是坐标值，而是服务端无法连接和解析三维切片源：

```text
服务提供者 local3DCache-HuaGongYuanQuChangJing 创建失败
连接切片源时发生异常
Cannot read the array length because "<parameter1>" is null
```

调用栈进入：

```text
OsgbTilesetBase.initMetadata
LocalCacheOSGBTileset
OsgbTilesourceProvider.doConnect
```

随后对应的三维业务组件也创建失败：

```text
业务组件上下文中没有包含 RealspaceProvider 对应的服务提供者对象
```

日志还显示多个旧服务同时失败，例如：

```text
LiShiGuanZi
HuaGongYuanQuChangJing
HuanReQi
result_ImportFBX
result_ImportFBX2
YuanCaiLiaoCangKu
ZhengLiuTa
```

这说明当前发布工作空间或 iServer 配置中混入了多个旧的、本地三维缓存提供者。服务端尝试按 OSGB 缓存读取这些数据，但元数据为空或路径不可用。

### 7.1 目前可以确定的结论

1. iServer 的三维缓存 Provider 初始化失败；
2. 部分工作空间中的缓存路径、缓存类型或元数据不合法；
3. 对应 REST Realspace 业务组件无法正常创建；
4. 桌面端可显示不等于服务器端能够访问桌面本机路径；
5. 发布工作空间中很可能还引用了旧缓存、旧场景或本机绝对路径。

### 7.2 与主问题无关的日志

日志中的：

```text
HTTP 方法名必须是有效的符号
0x16 0x03 0x01 ...
```

通常是把 HTTPS 请求发送到了只提供 HTTP 的 `8090` 端口。访问时应使用：

```text
http://服务器IP:8090/iserver
```

而不是直接使用 HTTPS。

`ClientAbortException` 表示浏览器或客户端主动断开连接，也不是模型飞到欧洲的根因。

---

## 8. “飞到欧洲”的可能原因

日志没有直接记录“相机飞到欧洲”的坐标，因此以下属于诊断推断：

1. 发布的场景仍引用旧缓存或错误图层；
2. `.scp` 中的空间参考或包围盒与场景坐标系不一致；
3. 生成瓦片时对 EPSG:4547 又执行了不正确的 3 参数转换；
4. 服务器读取不到正确缓存后，场景使用默认范围或旧场景相机；
5. iServer 发布的是旧 `.sxwu`，而不是当前新建的 S3M 场景；
6. 工作空间内存在多个失效的 `local3DCache` 图层，场景中心被错误图层范围影响；
7. iDesktopX 与 iServer 的 S3M/SCP 版本兼容性存在问题。

---

## 9. 推荐的干净发布方案

不要继续在当前包含多个旧场景和缓存的工作空间上反复修补。创建一个全新的、只包含最终数据的发布包。

### 第一步：保留原始数据

备份：

```text
配准后模型_4547
ChemicalPlant_S3M
现有工作空间
```

不要覆盖现有成果。

### 第二步：显式转换模型到 EPSG:4490

为了避免切片工具内部的隐藏坐标转换，建议在 iDesktopX 中先执行一次模型数据集投影转换：

```text
源数据集：配准后模型_4547
源坐标系：EPSG:4547
目标坐标系：GCS_China_2000 / EPSG:4490
结果数据集：ChemicalPlant_4490
模型转换顶点：勾选
```

完成后先将 `ChemicalPlant_4490` 添加到新的球面场景，确认：

- 正确位于郑州；
- 模型尺寸正常；
- 不飞到其他国家；
- 属性 `ModelName` 仍存在。

如果该模型不能在桌面端球面场景正确显示，则不要继续发布。

### 第三步：从 EPSG:4490 模型重新生成 S3M

推荐参数：

```text
输入数据集：ChemicalPlant_4490
S3M 版本：3.01
属性存储：DB
文件类型：S3MB
顶点优化：MeshOpt
对象唯一字段：ModelName
坐标转换：关闭
LOD：3 或 4
输出目录：纯英文短路径
```

推荐服务器发布目录结构：

```text
D:\supermap_data\chemicalplant\
├─ workspace\ChemicalPlantPublish.sxwu
├─ data\ChemicalPlant.udbx
└─ s3m\ChemicalPlant_S3M\
   ├─ ChemicalPlant_S3M.scp
   ├─ attribute.db
   ├─ attribute.json
   └─ Tile_*\
```

路径尽量避免中文、空格和过长目录。

### 第四步：建立一个全新工作空间

新建工作空间，只加入：

```text
1 个新的球面场景：ChemicalPlantScene
1 个新的 S3M 图层：ChemicalPlant_S3M.scp
```

不要加入：

```text
result_ImportFBX
旧 OSGB 缓存
旧 local3DCache 图层
LiShiGuanZi
HuanReQi
旧 HuaGongYuanQuChangJing
```

场景中只保留新 S3M 图层，快速定位并保存相机。

保存为：

```text
ChemicalPlantPublish.sxwu
```

关闭工作空间，防止文件锁定。

### 第五步：将完整发布目录复制到服务器

必须复制整个目录，不能只复制 `.scp`：

```text
ChemicalPlant_S3M.scp
attribute.db
attribute.json
全部 Tile_* 目录
工作空间文件
必要的 UDBX 数据库
```

服务器必须能直接读取这些文件，工作空间引用路径不能再指向客户端的 `G:\竞赛\...`。

### 第六步：在 iServer 中发布干净工作空间

在：

```text
http://服务器IP:8090/iserver/manager
```

选择：

```text
快速发布服务
数据来源：工作空间
选择：ChemicalPlantPublish.sxwu
```

至少发布：

```text
REST-三维服务
REST-数据服务
```

按需发布：

```text
REST-空间分析服务
```

如果只发布 `.scp`，可以得到三维展示服务，但复杂业务属性和空间查询仍建议同时发布 UDBX/工作空间数据服务。

### 第七步：检查服务端日志

重新发布后搜索：

```text
ChemicalPlant
local3DCache
RealspaceProvider
Cannot read the array length
OsgbTilesetBase
```

新工作空间不应再出现旧图层名称，也不应继续进入 `OsgbTilesetBase` 读取当前 S3M 数据。

### 第八步：检查 REST 服务

应能打开：

```text
http://服务器IP:8090/iserver/services
http://服务器IP:8090/iserver/services/3D-服务名/rest/realspace
```

检查：

- 场景列表是否存在；
- 数据列表是否包含 `ChemicalPlant_S3M`；
- 图层 config 请求是否返回正常；
- 浏览器 Network 中 `.scp`、`.s3mb`、`attribute.db` 请求是否为 200；
- 是否有 404、500 或路径访问错误。

---

## 10. 点击查询与空间查询架构

### 10.1 三维点击查询

三维瓦片中已经存在：

```text
attribute.db
attribute.json
ModelName
```

前端点击对象后，应优先获取：

```text
ModelName = TANK_001 / BUILDING_001 / PIPE_001 ...
```

`ModelName` 作为业务主键，不建议使用会变化的 `SmID`。

### 10.2 业务属性查询

推荐另外建立业务表：

| ModelName | Type | Name | Status | RiskLevel | Material |
|---|---|---|---|---|---|
| TANK_001 | 储罐 | 甲醇储罐 1 | 正常 | 高 | 钢 |

点击三维对象后，以 `ModelName` 查询数据服务或业务数据库。

### 10.3 真正的空间查询

三维拾取和 GIS 空间分析不是同一件事。

如果需要：

- 查询泄漏点周边 500 m 的设备；
- 判断扩散面与哪些设备相交；
- 查询最近储罐；
- 统计风险区内设备数量；

建议建立独立的设备空间索引数据集：

```text
DevicePoint 或 DeviceFootprint
```

字段至少包含：

```text
ModelName
Type
X
Y
Z
RiskLevel
Status
```

前端流程：

```text
三维点击获取 ModelName
→ 数据服务查询业务属性
→ 空间分析服务对 DevicePoint/DeviceFootprint 查询
→ 将结果 ModelName 映射回三维对象并高亮
```

不要直接对一万个复杂三角网模型做全部 GIS 空间分析。

---

## 11. Claude 需要完成的任务

请 Claude 按以下顺序执行，不要重新建模，不要重新设计控制点，除非验证发现当前配准数据本身错误。

1. 检查 iDesktopX 与 iServer 构建号兼容性；
2. 检查当前 `.scp` 文件中的坐标系、包围盒、数据版本和瓦片相对路径；
3. 检查现有 `.sxwu` 是否引用了客户端绝对路径和旧缓存；
4. 新建干净工作空间，只保留新的 ChemicalPlant S3M 图层；
5. 优先采用“模型先转换到 EPSG:4490，再关闭切片坐标转换”的方案；
6. 复制完整工作空间、UDBX 和 S3M 目录到服务器英文短路径；
7. 删除或停用旧的失败服务提供者；
8. 重新发布 REST 三维服务和 REST 数据服务；
9. 检查 Realspace REST、SCP、S3MB 和 attribute.db 请求；
10. 给出 Vue 3 + SuperMap iClient3D 的图层加载和点击查询代码；
11. 使用 `ModelName` 作为对象唯一业务 ID；
12. 设计 `DevicePoint/DeviceFootprint` 数据集用于后续空间分析。

---

## 12. 可直接交给 Claude 的提示词

```text
你现在接手一个 SuperMap 三维模型发布故障。请先完整阅读本说明，不要重新建模或重新配准。

当前最终模型数据集是“配准后模型_4547”，坐标系 EPSG:4547，范围约 X=456319~458736、Y=3853570~3855579，在 iDesktopX 球面场景可正常显示。对象属性中有 ModelName，例如 BUILDING_001、TANK_001、PIPE_001，可作为唯一业务 ID。

已经生成 S3M 3.01 缓存 ChemicalPlant_S3M，包含 ChemicalPlant_S3M.scp、attribute.db、attribute.json 和全部 Tile_* 目录。但发布到 iServer 后不显示，并飞到欧洲。

日志证明多个 local3DCache Provider 创建失败，错误进入 OsgbTilesetBase.initMetadata，提示 Cannot read the array length because parameter is null，随后 RealspaceProvider 业务组件创建失败。现有工作空间还包含多个旧缓存服务：LiShiGuanZi、HuaGongYuanQuChangJing、HuanReQi、result_ImportFBX 等。

请完成：
1. 检查 SCP 元数据、版本、坐标参考、包围盒和相对路径；
2. 检查 iDesktopX 与 iServer 版本兼容性；
3. 将最终模型显式投影转换为 EPSG:4490，并在桌面球面场景验证；
4. 从 EPSG:4490 模型重新生成 S3M，关闭切片阶段坐标转换，属性存储 DB，对象 ID 使用 ModelName；
5. 新建只包含新 S3M 图层的干净 sxwu 工作空间；
6. 将工作空间、UDBX 和完整 S3M 目录复制到服务器英文短路径；
7. 重新发布 REST 三维服务和 REST 数据服务；
8. 验证 realspace、scp、s3mb、attribute.db 的 HTTP 请求；
9. 编写 Vue 3 + SuperMap iClient3D 加载图层、点击获取 ModelName、查询属性的代码；
10. 为缓冲区、相交、邻近查询设计 DevicePoint 或 DeviceFootprint 空间索引数据集。

要求每一步输出：操作路径、参数、预期结果、失败时检查项。不要把近零配准残差误判为真实测绘精度。
```

---

## 13. 当前最重要的判断

当前问题已经不再是 FBX 导入、对象命名或数学配准，而是：

```text
S3M/SCP 元数据与服务器兼容性
+ 工作空间引用旧缓存或本机路径
+ 服务器端 RealspaceProvider 初始化失败
+ 可能存在切片阶段二次坐标转换
```

优先创建干净发布包，不要继续在混有多个旧 `local3DCache` 的工作空间上修补。
