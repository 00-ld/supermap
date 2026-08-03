# SuperMap 三维查询与瓦片数据远端部署手册

> 项目：化工园区三维场景与监控点空间查询  
> 目标服务器：远端 SuperMap iServer，当前约定端口 `18090`  
> 编制日期：2026-07-29  
> 适用版本：当前项目使用的 SuperMap iServer / iClient3D 2026 系列  
> 文档状态：依据本机已验证资产、现有前端实现和 SuperMap 官方发布流程整理

---

## 1. 文档目的

本文用于指导把当前已经校正到河南工业大学莲花街校区的三维模型、S3M 瓦片、监控点位和空间查询前端部署到远端环境。

最终系统应实现：

1. 浏览器打开三维页面后，模型稳定显示在河南工业大学莲花街校区，不漂移到欧洲或其他位置。
2. 使用重新切片后的分离建筑物/设备模型，不再使用坐标系混乱的旧整体模型。
3. 监控点位以克制、可辨认的方式显示，避免全部 1072 个点同时高亮造成遮挡。
4. 点击三维模型、罐体或监控点后，能够返回可信的对象名称和监控信息。
5. 不展示未经核实的建筑高度、占地面积、安装高度、覆盖半径等推算数据。
6. 为后续扩散算法和溯源算法提供统一、准确的空间位置基准。

本文重点回答四个问题：

- 远端部署必须准备哪些数据；
- 只有 `18090` 端口、不能登录服务器时如何上传和发布；
- iServer、前端和查询数据分别怎样配置；
- 怎样证明部署结果真正可用。

---

## 2. 当前已验证的项目基线

### 2.1 当前正确的数据版本

当前应使用以下资产，旧的本地米制模型、旧 3D Tiles 和旧 S3M 服务均不得作为正式数据源。

| 资产 | 本机路径 | 规模/说明 |
|---|---|---|
| 发布工作空间 | `G:\竞赛\超图杯\化工园区整体场景发布.smwu` | 49,876 B |
| 正确的 S3M 索引 | `G:\竞赛\超图杯\三维瓦片数据_4490\huangong_4490\huangong_4490.scp` | EPSG:4490 |
| 完整 S3M 缓存目录 | `G:\竞赛\超图杯\三维瓦片数据_4490\huangong_4490\` | 420 个文件，293,017,629 B，约 279.4 MiB |
| 监控点查询数据 | `G:\竞赛\超图杯\code\chemical-main\frontend\public\data\DevicePoint_2D.geojson` | 1,072 个点，EPSG:4547 |
| 模型对象足迹 | `G:\竞赛\超图杯\code\chemical-main\frontend\public\data\Park_S3MObjectFootprint_2D.geojson` | 10,286 个对象足迹，EPSG:4547 |
| 三维查询前端 | `G:\竞赛\超图杯\code\chemical-main\frontend\` | Vue + SuperMap iClient3D |

S3M 缓存目录中包含：

- 1 个 `.scp` 索引；
- 377 个 `.s3mb` 模型瓦片；
- 41 个 `.json` 配套文件；
- 1 个 `.db` 属性文件。

**必须复制整个 `huangong_4490` 目录。只复制 `.scp` 文件会导致索引存在、模型瓦片全部 404。**

### 2.2 校验哈希

传输前后可用以下 SHA-256 校验关键文件：

| 文件 | SHA-256 |
|---|---|
| `化工园区整体场景发布.smwu` | `377AFC22C4BD77E25D0FEBEC5134F041B0E4F616D5AFF18A23F35B92A8C30F66` |
| `huangong_4490.scp` | `A173BE229066DB6EF9D0CC4BE361D6BA9657DA9BC762593F20424958C554F089` |
| `DevicePoint_2D.geojson` | `34BEA60B6DD3654B0BB862BF51BAC749944C37E9ED73F934DC468651848BB4D1` |
| `Park_S3MObjectFootprint_2D.geojson` | `139CAA830CEF9ACF66CAFBEA407C0A9EE62FFBFA7F04016735BA6F0149454A7C` |

PowerShell 校验命令：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath "文件绝对路径"
```

### 2.3 S3M 空间基准

`huangong_4490.scp` 已明确声明：

```json
{
  "crs": "epsg:4490",
  "dataType": "ArtificialModel",
  "geoBounds": {
    "left": 113.52251344784995,
    "right": 113.5490252942224,
    "bottom": 34.809569875817076,
    "top": 34.82777430787187
  },
  "position": {
    "point3D": {
      "x": 113.53576937103617,
      "y": 34.818672091844476,
      "z": 0.0
    },
    "unit": "Degree"
  }
}
```

这意味着：

- 三维缓存已经是 CGCS2000 地理坐标系，即 `EPSG:4490`；
- 前端不得再次平移、缩放或套用旧控制点；
- `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION` 必须为 `false`；
- 不得把该 `.scp` 按投影坐标 `EPSG:4547` 再解释一次；
- 浏览器地球场景中使用经纬度定位，查询时再把拾取位置转换到 `EPSG:4547`。

### 2.4 当前查询架构

当前稳定实现采用客户端空间查询：

```text
浏览器点击 S3M 模型
        ↓
SuperMap3D 深度拾取，得到场景经纬度
        ↓
经纬度转换到 EPSG:4547
        ↓
在 Park_S3MObjectFootprint_2D.geojson 中查找最小包含足迹
        ↓
按 ModelName、足迹范围或最近距离匹配 DevicePoint_2D.geojson
        ↓
显示对象名称、SensorID、SensorModel、ObservedProps
```

采用客户端查询的原因是：当前测试中，iServer 2026 Beta 的 `featureResults` 查询返回空结果，而前端本地 GeoJSON 查询已经通过实际点击验证。

现有查询规则：

- 精确点选监控点时，直接显示该监控点；
- 点选普通建筑/罐体时，按对象名称或足迹范围关联监控点；
- 对过大的包围足迹，改用点击位置附近 36 m 的监控点；
- 单次最多显示 12 个监控点；
- 监控点总数据量仍为 1,072 条；
- 三维可见标记按约 `0.00025°` 网格抽稀，查询数据不抽稀；
- 不展示未经实测确认的高度、面积、安装高度和覆盖半径。

---

## 3. 远端部署拓扑

### 3.1 推荐拓扑：前端同源反向代理 iServer

```text
用户浏览器
   │
   │ HTTP/HTTPS
   ▼
前端站点 / Nginx
   ├── /                 → Vue 前端静态文件
   ├── /data/*.geojson   → 前端查询数据
   └── /iserver/*        → http://8.130.175.232:18090/iserver/*
                              │
                              ├── REST 三维场景元数据
                              ├── S3M config
                              ├── .s3mb 瓦片
                              ├── license.json
                              └── iClient3D 运行资源
```

推荐同源代理的原因：

- iClient3D 会从场景 URL 继续请求 `config`、`.s3mb`、许可和 Worker 等资源；
- 浏览器直接跨域请求远端 iServer 容易受 CORS、Worker 同源策略和混合内容限制；
- 只需对外暴露前端地址和现有 iServer `18090` 端口；
- 前端代码可继续使用 `/iserver/...` 相对路径。

### 3.2 可选拓扑：浏览器直接访问远端 iServer

只有同时满足以下条件时才建议使用：

1. iServer `18090` 能从用户浏览器直接访问；
2. iServer CORS 白名单包含前端来源；
3. 前端和 iServer 均为 HTTP，或均为 HTTPS；
4. iClient3D Worker、许可和瓦片请求均不被跨域策略拦截。

若前端是 HTTPS、iServer 是 HTTP，浏览器通常会拦截混合内容。此时必须在前端服务器做 HTTPS 反向代理，不能直接请求 `http://...:18090`。

---

## 4. 远端部署所需数据清单

### 4.1 必需数据

#### A. 三维瓦片数据

必须完整包含：

```text
huangong_4490/
├── huangong_4490.scp
├── Attribute.db 或其他 .db 文件
├── *.json
├── Tile_*/
│   └── *.s3mb
└── 其他由切片生成的配套目录和文件
```

不要改动：

- `.scp` 内引用的相对路径；
- 瓦片目录名；
- `.s3mb` 文件名；
- 文件名大小写；
- `.db` 和 `.json` 配套文件。

#### B. 三维场景工作空间

文件：

```text
化工园区整体场景发布.smwu
```

工作空间用于保留场景名称、图层顺序、显示状态和监控点数据集等配置。

注意：`.smwu` 是工作空间描述文件，不会自动把外部三维缓存嵌入文件内部。若工作空间记录的是本机绝对路径 `G:\...`，远端 iServer 无法读取。因此发布工作空间前必须保证：

- 缓存目录已经上传到远端；
- 工作空间引用已改成远端可访问路径，或使用相对路径；
- 或者放弃依赖工作空间路径，直接发布 `.scp`。

#### C. 前端空间查询数据

必须随前端静态文件部署：

```text
public/data/DevicePoint_2D.geojson
public/data/Park_S3MObjectFootprint_2D.geojson
```

构建后应位于：

```text
dist/data/DevicePoint_2D.geojson
dist/data/Park_S3MObjectFootprint_2D.geojson
```

它们不是“可选演示数据”，而是当前三维点击查询的实际数据源。缺少任一文件都会出现：

- 模型能显示，但点击不返回对象；
- 对象名称能显示，但没有传感器；
- 查询请求 404；
- 前端退化成仅显示模型 ID。

#### D. 前端程序

至少需要：

```text
frontend/
├── package.json
├── package-lock.json
├── src/
├── public/
├── vite.config.ts
├── .env.production
└── 构建后生成的 dist/
```

正式服务器只需部署 `dist/`；重新构建时才需要完整源码。

### 4.2 可选数据

以下仅在需要对应能力时部署：

| 数据/服务 | 用途 | 当前三维点击查询是否必需 |
|---|---|---|
| iServer REST 数据服务 | 服务端要素查询、编辑 | 否，当前使用本地 GeoJSON |
| iServer REST 地图服务 | 二维底图、二维校核 | 否 |
| Transportation Analyst | 道路路径分析 | 否 |
| Java 后端 | 业务数据、用户和告警 | 三维基础查询不必需 |
| Python 算法服务 | 扩散、溯源算法 | 当前展示不必需，后续必需 |
| iPortal 大屏 | 嵌入式大屏 | 否 |

### 4.3 禁止部署为正式数据源的旧资产

- `tileset_zhengzhou_57083.json` 旧 3D Tiles；
- EPSG:4547 的旧 S3M 缓存；
- 依靠前端 `APPLY_LAYER_POSITION=true` 强行平移的版本；
- 旧整体模型服务；
- 旧 `huangong` 图层；
- 包含明显虚假高度、面积、安装高度或覆盖半径的展示字段。

---

## 5. 部署包制作

### 5.1 推荐目录

在本机新建：

```text
SuperMap_Remote_Deploy_20260729/
├── 01_s3m/
│   └── huangong_4490/
├── 02_workspace/
│   └── 化工园区整体场景发布.smwu
├── 03_query_data/
│   ├── DevicePoint_2D.geojson
│   └── Park_S3MObjectFootprint_2D.geojson
├── 04_frontend/
│   └── dist/
├── 05_config/
│   ├── env.production.example
│   └── nginx-supermap.conf
├── SHA256SUMS.txt
└── README.txt
```

### 5.2 打包原则

1. `huangong_4490` 整目录复制，不能只选 `.scp`。
2. 使用 ZIP，不使用会改名或拆分路径的网盘自动压缩方式。
3. ZIP 解压后应直接看到上述目录，避免套多层无意义目录。
4. 中文工作空间文件名可保留，但服务名使用 ASCII。
5. 单个服务名只使用字母、数字、中划线或下划线。
6. 打包前关闭 iDesktop，防止工作空间处于写入状态。
7. 不把 `.env` 中的密钥上传到公开目录；本手册中的示例不包含密钥。

### 5.3 生成全量清单

PowerShell：

```powershell
$deployRoot = "D:\SuperMap_Remote_Deploy_20260729"

Get-ChildItem -LiteralPath $deployRoot -Recurse -File |
  Sort-Object FullName |
  ForEach-Object {
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName
    "{0}  {1}" -f $hash.Hash, $_.FullName.Substring($deployRoot.Length + 1)
  } |
  Set-Content -LiteralPath "$deployRoot\SHA256SUMS.txt" -Encoding UTF8
```

### 5.4 压缩

```powershell
Compress-Archive `
  -LiteralPath "D:\SuperMap_Remote_Deploy_20260729\*" `
  -DestinationPath "D:\SuperMap_Remote_Deploy_20260729.zip" `
  -CompressionLevel Optimal
```

压缩后至少检查：

- ZIP 可正常打开；
- `.scp` 和任意 3 个 `.s3mb` 能正常解压；
- ZIP 大小与源数据规模相符；
- `SHA256SUMS.txt` 存在。

---

## 6. 远端条件预检查

### 6.1 你只有 18090 端口时，需要满足的条件

仅知道端口并不等于可以完成部署。至少还需要：

1. `http://远端IP:18090/iserver` 可访问；
2. 具有 iServer 管理员账号；
3. 管理页面允许“快速发布”；
4. “远程浏览”中允许上传 ZIP；
5. 服务器磁盘至少预留 1.5 GB；
6. iServer 许可包含文件型三维数据发布和浏览能力；
7. 远端 iServer 版本能够读取当前 S3M 3.01 / MeshOpt 缓存；
8. 上传限制和反向代理限制允许约 300 MB 的 ZIP；
9. 上传、解压和发布过程不会被几十秒的网关超时中断。

SuperMap 官方文档说明，远程浏览支持把本地 ZIP 上传到服务器并自动解压；因此在有管理员账号且上传未被禁用时，只开放 `18090` 也可以完成文件传输和发布。

### 6.2 当前远端连通性记录

2026-07-29 从当前开发机测试：

```text
http://8.130.175.232:18090/iserver
http://8.130.175.232:18090/iserver/services
http://8.130.175.232:18090/iserver/manager
```

均未在超时时间内建立可用 HTTP 响应。因此本文不能声称远端已发布成功。

远端恢复后先运行：

```powershell
$base = "http://8.130.175.232:18090"

Invoke-WebRequest -Uri "$base/iserver" -Method Get -TimeoutSec 20
Invoke-WebRequest -Uri "$base/iserver/services" -Method Get -TimeoutSec 20
Invoke-WebRequest -Uri "$base/iserver/manager" -Method Get -TimeoutSec 20
```

### 6.3 若远端页面打不开

按顺序判断：

1. **连接超时**：安全组、防火墙、iServer 未启动或端口映射错误。
2. **Connection refused**：端口开放，但没有进程监听。
3. **404**：端口可用，但 Web 应用路径不是 `/iserver`。
4. **502/504**：前置 Nginx 能访问，但后端 iServer 异常或超时。
5. **登录页可开但无法登录**：需要管理员重置账号或解除锁定。

只有远端管理员能处理的事项：

- 启动/重启 iServer；
- 修改安全组或主机防火墙；
- 查看服务端日志；
- 扩大上传限制；
- 调整 JVM 内存；
- 安装或激活三维许可；
- 修改 iServer CORS 配置；
- 将数据直接复制到服务器文件系统。

---

## 7. 路线 A：通过 18090 管理页面上传并直接发布 S3M

这是在不能进入服务器时最稳妥的路线，因为它不依赖 `.smwu` 中可能存在的本机绝对路径。

### 7.1 登录

访问：

```text
http://8.130.175.232:18090/iserver/manager
```

使用 iServer 管理员账号登录。

### 7.2 上传部署包

1. 打开“服务管理”。
2. 点击“快速发布”或“快速创建服务”。
3. 数据来源选择“三维切片缓存”。
4. 在配置数据页面点击“远程浏览”。
5. 在远端文件管理器选择一个专用目录，例如：

   ```text
   /data/supermap/chemical-park/20260729/
   ```

6. 点击“上传数据”。
7. 选择 `SuperMap_Remote_Deploy_20260729.zip`。
8. 等待上传和自动解压完成。
9. 进入解压目录，选择：

   ```text
   01_s3m/huangong_4490/huangong_4490.scp
   ```

若约 300 MB ZIP 上传失败：

- 不要拆开 `.scp` 与瓦片目录；
- 可把整个部署包拆成“仅 S3M ZIP”和“前端/查询数据 ZIP”；
- 若单个 S3M ZIP 仍超过限制，只能请管理员调整上传限制或服务器端拷贝；
- 不建议把 420 个文件逐个上传。

### 7.3 发布三维服务

1. 数据源：三维切片缓存。
2. 索引：`huangong_4490.scp`。
3. 裁剪范围：留空，除非明确只发布部分园区。
4. 服务类型：`REST-三维服务`。
5. 服务名建议：

   ```text
   chemical_park_s3m_4490
   ```

6. 点击发布。
7. 记录系统实际返回的服务地址，不要根据服务名猜 URL。

典型地址形态：

```text
http://8.130.175.232:18090/iserver/services/3D-local3DCache-chemical_park_s3m_4490/rest/realspace
```

直接发布缓存时，场景名通常可能是“默认场景”，但必须以服务返回的 `scenes.json` 为准。

### 7.4 查询场景名

访问：

```text
{REALSPACE_URL}/scenes.json
```

例如：

```text
http://8.130.175.232:18090/iserver/services/3D-local3DCache-chemical_park_s3m_4490/rest/realspace/scenes.json
```

记录返回的场景名称，再访问：

```text
{REALSPACE_URL}/scenes/{URL编码后的场景名}.json
```

### 7.5 查询图层 config

访问 realspace 根资源和数据资源列表，确认实际图层名称。典型 config：

```text
{REALSPACE_URL}/datas/huangong_4490/config
```

必须返回 JSON，而不是：

- iServer 登录 HTML；
- 前端 SPA 的 `index.html`；
- 404；
- 500；
- 空响应。

### 7.6 验证实际瓦片

打开 `config` 或 `.scp` 返回内容，从中选取一个真实 `.s3mb` 相对路径进行请求。

验收要求：

- HTTP 200；
- `Content-Type` 可以是二进制类型；
- 响应体不是 HTML；
- 响应大小不是 0；
- 浏览器 Network 面板持续出现 `.s3mb` 200。

---

## 8. 路线 B：上传并发布工作空间

当需要保留“发布场景”、图层显隐状态、监控点数据集和其他场景配置时使用。

### 8.1 先处理工作空间路径

工作空间发布最常见的失败原因是：

```text
桌面端能打开
远端发布成功
但场景中没有模型
```

根因通常是工作空间仍引用本机路径，例如 `G:\竞赛\超图杯\...`。

正确方法有三种，按优先级排序：

1. 在 iDesktop 中把三维缓存图层重新指向部署包内的相对目录，再保存工作空间；
2. 在远端服务器使用与工作空间一致的目录结构，并更新为远端绝对路径；
3. 三维缓存按路线 A 独立发布，工作空间只负责其他数据。

发布前，在一台不存在原始 `G:` 路径的电脑上解压部署包并打开工作空间，是最有效的路径自包含测试。

### 8.2 快速发布

1. 进入 iServer 管理器。
2. 点击“快速发布”。
3. 数据源选择“文件型工作空间”。
4. 点击“远程浏览”。
5. 上传 ZIP 或选择已解压的：

   ```text
   02_workspace/化工园区整体场景发布.smwu
   ```

6. 若工作空间有密码，填写密码；没有则留空。
7. 选择服务类型：

   - `REST-三维服务`：必选；
   - `REST-数据服务`：需要服务器端数据查询时选择；
   - `REST-地图服务`：需要二维地图时选择；
   - `REST-空间分析服务`：只有确实需要 iServer 服务端空间分析时选择。

8. 三维服务名建议：

   ```text
   chemical_park_scene
   ```

9. 数据服务名建议：

   ```text
   chemical_park_query
   ```

10. 发布完成后逐个记录真实 URL。

### 8.3 当前工作空间预期场景

本机当前发布版本使用：

```text
服务：3D-HuaGongYuanQuZhengTiChangJingFaBu
场景：发布场景
模型图层：huangong_4490
```

本机验证 URL：

```text
http://localhost:8090/iserver/services/3D-HuaGongYuanQuZhengTiChangJingFaBu/rest/realspace
http://localhost:8090/iserver/services/3D-HuaGongYuanQuZhengTiChangJingFaBu/rest/realspace/scenes/%E5%8F%91%E5%B8%83%E5%9C%BA%E6%99%AF.json
http://localhost:8090/iserver/services/3D-HuaGongYuanQuZhengTiChangJingFaBu/rest/realspace/datas/huangong_4490/config
```

远端服务名可能不同，必须使用远端发布结果替换。

### 8.4 图层显隐要求

正式场景中：

- `huangong_4490`：显示；
- 旧 `huangong`：隐藏或移除；
- 旧整体场景图层：隐藏或移除；
- 工作空间中的高亮设备点：建议隐藏；
- 前端加载的克制版监控点：显示；
- 其他校核图层：按需显示。

---

## 9. 前端配置与构建

### 9.1 推荐生产变量

不要直接照搬当前旧 `.env.production` 中的旧服务。创建新的生产配置，关键项如下：

```dotenv
VITE_SUPERMAP3D_BASE_URL=/supermap3d

# 通过同源代理访问远端 iServer
VITE_SUPERMAP_ISERVER_PROXY_BASE=/supermap-iserver
VITE_SUPERMAP_ISERVER_PROXY_TARGET=http://8.130.175.232:18090

# iClient3D 会派生 /iserver/... 请求，因此场景 URL 保持相对路径
VITE_SUPERMAP_3D_SCENE_URL=/iserver/services/远端实际三维服务名/rest/realspace
VITE_SUPERMAP_3D_SCENE_NAME=远端scenes.json返回的真实场景名
VITE_SUPERMAP_3D_PREFER_SCENE=true
VITE_SUPERMAP_3D_USE_3DTILES=false

VITE_SUPERMAP_3D_LAYER_CONFIGS=/iserver/services/远端实际三维服务名/rest/realspace/datas/huangong_4490/config
VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false
VITE_SUPERMAP_3D_LAYER_POSITION=113.535769371036,34.8186720918445,0
VITE_SUPERMAP_3D_DEFAULT_CAMERA=113.535769371036,34.8186720918445,2600,0,-75,0

# 查询数据
VITE_DEVICE_POINT_GEOJSON=/data/DevicePoint_2D.geojson
VITE_FOOTPRINT_GEOJSON=/data/Park_S3MObjectFootprint_2D.geojson

# 查询平面坐标系
VITE_SUPERMAP_COORD_SYS=CGCS2000_3GK_CM_114E
VITE_SUPERMAP_EPSG=4547
VITE_SUPERMAP_2D_EPSG=4547
```

注意：

- Vite 的 `VITE_*` 变量会在构建时写入前端包；
- 修改 `.env.production` 后必须重新执行构建；
- 不要把算法服务密钥、数据库密码或 iServer 管理员密码写入 `VITE_*`；
- `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=true` 会再次平移已经正确的 EPSG:4490 模型；
- `VITE_SUPERMAP_3D_USE_3DTILES=true` 会切回旧 3D Tiles。

### 9.2 构建

进入：

```powershell
Set-Location "G:\竞赛\超图杯\code\chemical-main\frontend"
```

执行：

```powershell
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

若项目已安装依赖且不希望重新下载，可跳过 `npm ci`。

构建成功后检查：

```powershell
Get-Item ".\dist\index.html"
Get-Item ".\dist\data\DevicePoint_2D.geojson"
Get-Item ".\dist\data\Park_S3MObjectFootprint_2D.geojson"
```

### 9.3 生产 Nginx 配置

在现有前端 Nginx `server` 中增加：

```nginx
location /iserver/ {
    proxy_pass http://8.130.175.232:18090/iserver/;
    proxy_http_version 1.1;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Origin "";

    proxy_connect_timeout 30s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;

    proxy_buffering off;
}

location /supermap-iserver/ {
    rewrite ^/supermap-iserver/(.*)$ /$1 break;
    proxy_pass http://8.130.175.232:18090;
    proxy_http_version 1.1;
    proxy_set_header Host $proxy_host;
    proxy_set_header Origin "";
    proxy_connect_timeout 30s;
    proxy_read_timeout 120s;
}

location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

大文件和 S3M 还应注意：

```nginx
gzip_types application/json application/javascript text/css;

location ~* \.(s3mb|scp|db)$ {
    proxy_pass http://8.130.175.232:18090;
    proxy_buffering off;
    expires 7d;
    add_header Cache-Control "public";
}
```

如果使用上述正则 location，必须先验证其 URI 拼接逻辑，避免把 `/iserver` 前缀丢失。更稳妥的是只使用 `/iserver/` 前缀代理。

### 9.4 CSP

若全部使用同源代理，前端 CSP 的：

```text
connect-src 'self'
```

即可。

若浏览器直接访问远端，则必须把远端 iServer 来源加入 `connect-src`，同时处理 Worker、脚本和样式来源。综合风险更高，因此仍推荐同源代理。

---

## 10. 远端验收步骤

验收必须按“服务端 → 瓦片 → 前端静态数据 → 页面 → 查询”顺序进行。

### 10.1 服务根地址

```powershell
$remote = "http://8.130.175.232:18090"
$service = "远端实际三维服务名"
$realspace = "$remote/iserver/services/$service/rest/realspace"

Invoke-WebRequest -Uri $realspace -TimeoutSec 30
```

通过标准：

- HTTP 200；
- 返回内容是 realspace 服务信息；
- 不是登录 HTML；
- 不是 502/504。

### 10.2 场景列表

```powershell
Invoke-RestMethod -Uri "$realspace/scenes.json" -TimeoutSec 30
```

通过标准：

- 至少一个场景；
- 场景名与前端配置一致；
- 中文场景名在 URL 中正确编码。

### 10.3 场景 JSON

```powershell
$sceneName = [uri]::EscapeDataString("发布场景")
Invoke-RestMethod -Uri "$realspace/scenes/$sceneName.json" -TimeoutSec 30
```

通过标准：

- HTTP 200；
- 场景中包含 `huangong_4490`；
- 旧图层不作为默认可见主模型；
- 场景范围位于郑州。

### 10.4 图层 config

```powershell
Invoke-RestMethod -Uri "$realspace/datas/huangong_4490/config" -TimeoutSec 30
```

通过标准：

- `crs` 为 `epsg:4490`；
- 范围经度约 `113.5225–113.5490`；
- 范围纬度约 `34.8096–34.8278`；
- 中心约 `113.53577, 34.81867`；
- 返回的瓦片路径可继续访问。

### 10.5 前端查询数据

假设前端地址为 `https://example.com`：

```powershell
Invoke-WebRequest -Uri "https://example.com/data/DevicePoint_2D.geojson"
Invoke-WebRequest -Uri "https://example.com/data/Park_S3MObjectFootprint_2D.geojson"
```

通过标准：

- 两个请求 HTTP 200；
- 响应头不是 `text/html`；
- 监控点数据有 1,072 个 Feature；
- 足迹数据有 10,286 个 Feature；
- CRS 为 `EPSG:4547`。

### 10.6 浏览器 Network 验收

打开浏览器开发者工具：

1. 禁用缓存后刷新；
2. 筛选 `scene`、`config`、`s3mb`、`geojson`；
3. 确认场景 JSON 为 200；
4. 确认 `huangong_4490/config` 为 200；
5. 确认多个 `.s3mb` 为 200；
6. 确认两个 GeoJSON 为 200；
7. 确认没有返回前端 `index.html` 冒充 JSON；
8. 确认 Console 无 CORS、Worker、WebGL 和混合内容错误。

### 10.7 视觉验收

- 首屏定位河南工业大学莲花街校区；
- 模型不在欧洲、非洲或零经纬度附近；
- 模型比例正常；
- 建筑物彼此分离，可单独点选；
- 没有新旧模型叠加；
- 监控点颜色克制，不全部高亮；
- 缩放时点位不会严重遮挡建筑；
- 底部坐标随鼠标移动实时变化；
- 显示 CGCS2000/EPSG:4490 经纬度和 EPSG:4547 投影坐标；
- 文字面板无大面积互相遮挡。

### 10.8 查询验收

至少完成以下用例：

| 用例 | 期望结果 |
|---|---|
| 点击单个监控点 | 返回 SensorID、型号、监测属性 |
| 点击普通建筑 | 返回最小包含足迹和合理数量的监控点 |
| 点击罐体 | 不出现 300 多个传感器，最多 12 个 |
| 点击大范围足迹 | 仅返回点击位置 36 m 内监控点 |
| 点击空地 | 清空或提示未查询到对象 |
| 点击烟囱/高塔 | 不展示未经核实的“4 m”等高度 |
| 点击建筑 | 不展示未经核实的“66 m”等高度 |
| 点击任何对象 | 不展示虚假面积、安装高度、覆盖半径 |

当前本机已经验证过的参考用例：

- 直接点击 `WX-01`，可返回传感器型号和监测属性；
- 点击 `TANK_1114`，返回 3 个关联传感器，而不是数百个；
- `TANK_1114` 示例关联：`TK-426L`、`TK-426H`、`IR-TK-426`。

---

## 11. 常见故障与处理

### 11.1 桌面端正常，浏览器模型不显示

检查顺序：

1. 场景 JSON 是否 200；
2. 图层 config 是否 200；
3. `.s3mb` 是否开始下载；
4. `.s3mb` 是否返回 HTML；
5. iServer 是否能读取缓存目录；
6. 工作空间路径是否仍是本机 `G:`；
7. iServer 许可是否包含三维；
8. iServer 与 iClient3D 大版本是否匹配；
9. 浏览器 Console 是否有 CORS/Worker/WebGL 错误。

### 11.2 模型飘到欧洲

最常见原因：

- 把 EPSG:4547 米制坐标当作经纬度；
- 把已经是 EPSG:4490 的模型再次做平移；
- 前端仍使用旧 anchor；
- 加载了旧 S3M 或旧 3D Tiles；
- `.scp` 坐标声明与实际数据不一致。

本项目正确配置：

```dotenv
VITE_SUPERMAP_3D_USE_3DTILES=false
VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false
```

正确中心：

```text
113.535769371036, 34.8186720918445
```

### 11.3 模型显示两套、方框叠方框

原因：

- 新旧 S3M 同时可见；
- 工作空间监控点和前端监控点同时可见；
- 旧建筑包围框仍在渲染；
- 前端调试边界未关闭。

处理：

- 只保留 `huangong_4490`；
- 隐藏旧 `huangong`；
- 隐藏工作空间原始高亮设备点；
- 关闭调试包围框；
- 保留前端抽稀后的监控标记。

### 11.4 传感器信息为空

检查：

```text
/data/DevicePoint_2D.geojson
/data/Park_S3MObjectFootprint_2D.geojson
```

若请求状态为 200 但 `Content-Type` 为 `text/html`，通常是 Nginx 把缺失文件回退到 `index.html`。应检查构建产物是否包含 `dist/data/`。

### 11.5 点击罐体出现数百个传感器

说明对象足迹过大或模型名称关联过宽。

当前前端保护规则：

- 过大足迹转为点击点附近查询；
- 距离阈值 36 m；
- 最大返回 12 个；
- 优先按 `ModelName` 精确匹配。

不要在远端前端部署旧版 `index.vue` 或旧查询逻辑。

### 11.6 坐标栏不变化

当前正确实现监听 SuperMap/Cesium `MOUSE_MOVE`：

1. 优先深度拾取；
2. 失败时对地球做射线求交；
3. 更新 EPSG:4490 经纬度；
4. 同步换算 EPSG:4547。

若远端仍固定显示 `57083 113.665000E, 34.717800N`，说明部署的是旧前端构建产物。

### 11.7 iServer 发布成功但服务内容为空

重点检查：

- 工作空间外部数据路径；
- 数据文件是否完整上传；
- iServer 运行用户是否有读权限；
- 服务日志中的 provider 初始化错误；
- 数据源或缓存格式是否受当前许可支持；
- 是否误选了旧工作空间；
- 是否只上传 `.smwu` 而没有上传缓存目录。

### 11.8 `.s3mb` 404

原因：

- 只上传了 `.scp`；
- ZIP 解压层级变化；
- 瓦片目录改名；
- Linux 文件名大小写不一致；
- `.scp` 相对路径被破坏；
- 反向代理 rewrite 丢失路径。

### 11.9 远端上传超时

处理优先级：

1. 只上传 S3M ZIP，减少无关文件；
2. 使用稳定网络；
3. 请管理员提高 Nginx/Tomcat 上传大小和超时；
4. 请管理员从对象存储下载 ZIP 到服务器；
5. 请管理员直接把数据目录挂载到 iServer。

仅有 `18090` 且管理页面禁止上传时，客户端无法凭空把 293 MB 缓存放进服务器文件系统，必须由管理员协助。

### 11.10 iServer 内存不足

本机曾出现 JVM Native OOM。远端建议：

- 不要在低内存机器上同时运行 iDesktop、iServer、前端构建和多个浏览器；
- iServer 至少预留 2–4 GB 可用内存；
- 限制服务并发和不必要服务；
- 发布后观察 JVM、系统内存和日志；
- 避免无限增大 `-Xmx`，必须给 native memory 和操作系统留空间；
- 大量并发访问前先做单用户冷启动测试。

---

## 12. 安全、权限和性能

### 12.1 管理页面

- `/iserver/manager` 不应向无关公网用户开放；
- 管理员密码不得写入前端；
- 发布完成后使用最小权限的服务访问策略；
- 如服务受保护，前端需采用正式认证方案，不能硬编码管理员凭据。

### 12.2 CORS

SuperMap 官方建议通过 iServer `web.xml` 配置跨域白名单。若采用同源反向代理，可减少跨域配置。

若必须直接跨域，远端管理员应把前端真实来源加入白名单，例如：

```text
https://your-frontend.example.com
```

不要长期使用 `*` 作为生产白名单。

### 12.3 缓存

- `.s3mb` 数据更新频率低，可设置浏览器缓存；
- 场景 JSON 和 `config` 更新时应缩短缓存或带版本；
- 替换瓦片时采用新目录和新服务名，避免旧缓存污染；
- 不要在原目录中边覆盖边对外服务。

### 12.4 发布策略

推荐蓝绿发布：

```text
旧服务：chemical_park_s3m_4490_v1
新服务：chemical_park_s3m_4490_v2
```

步骤：

1. 发布 v2；
2. 独立验证 v2；
3. 修改前端环境变量；
4. 构建并发布前端；
5. 验收；
6. 保留 v1 至少一个回滚周期；
7. 再停用旧服务。

---

## 13. 回滚方案

### 13.1 三维服务回滚

1. 不删除当前可用服务；
2. 新服务使用新名称；
3. 前端只通过配置切换服务 URL；
4. 新服务失败时恢复旧 `.env.production`；
5. 重新构建或恢复上一版 `dist`；
6. 清理浏览器缓存后复验。

### 13.2 查询数据回滚

保留：

```text
DevicePoint_2D.geojson.bak-YYYYMMDD
Park_S3MObjectFootprint_2D.geojson.bak-YYYYMMDD
```

更新时先发布带版本目录：

```text
/data/v20260729/...
```

验收后再修改前端 URL，避免原地覆盖导致前端一半读取新数据、一半读取旧数据。

### 13.3 工作空间回滚

- 每次重新保存前复制 `.smwu`；
- 不覆盖唯一正式工作空间；
- 记录工作空间对应的 S3M 目录和服务版本；
- 删除远端服务前先确认前端没有引用。

---

## 14. 可直接交给远端管理员的任务单

```text
任务：发布化工园区 CGCS2000 三维模型和查询前端依赖

目标 iServer：
http://8.130.175.232:18090/iserver

数据包：
SuperMap_Remote_Deploy_20260729.zip

数据规模：
S3M 420 个文件，约 293 MB；
另含工作空间、1072 个监控点、10286 个模型足迹和前端构建产物。

请协助完成：
1. 确认 18090 的 iServer 已启动且公网可访问；
2. 确认管理员账号可使用快速发布和远程上传；
3. 确认磁盘至少有 1.5 GB 空余；
4. 确认许可支持文件型三维数据发布与浏览；
5. 上传并解压数据包，保持 huangong_4490 目录结构不变；
6. 以 huangong_4490.scp 发布 REST 三维服务；
7. 服务名建议 chemical_park_s3m_4490；
8. 返回真实 realspace URL、场景名和图层 config URL；
9. 如需发布工作空间，请保证工作空间不引用本机 G: 路径；
10. 如前端跨域直连，请配置前端域名 CORS 白名单；
11. 如上传失败，请提高上传大小/超时，或把数据包直接复制到服务器；
12. 如模型不出，请提供 iServer 服务日志中对应 provider/realspace 错误。

验收 URL：
- /iserver/services/{服务名}/rest/realspace
- /iserver/services/{服务名}/rest/realspace/scenes.json
- /iserver/services/{服务名}/rest/realspace/scenes/{场景名}.json
- /iserver/services/{服务名}/rest/realspace/datas/huangong_4490/config
- 任意一个真实 .s3mb URL

坐标要求：
- S3M：EPSG:4490
- 查询平面：EPSG:4547
- 不得再次平移 S3M
- 不得替换成旧 3D Tiles 或旧 huangong 图层
```

---

## 15. 最终上线检查表

### 数据

- [ ] `huangong_4490` 完整 420 个文件已上传
- [ ] `.scp` SHA-256 校验一致
- [ ] 监控点 GeoJSON 为 1,072 条
- [ ] 足迹 GeoJSON 为 10,286 条
- [ ] 未部署旧整体模型作为默认图层
- [ ] 未把虚假高度/面积字段作为展示数据

### iServer

- [ ] `18090/iserver` 可访问
- [ ] REST 三维服务正常
- [ ] `scenes.json` 正常
- [ ] 场景 JSON 正常
- [ ] `huangong_4490/config` 正常
- [ ] 多个 `.s3mb` 返回 200
- [ ] 服务端无持续 OOM 和 provider 初始化错误

### 前端

- [ ] `VITE_SUPERMAP_3D_USE_3DTILES=false`
- [ ] `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION=false`
- [ ] 场景 URL 指向远端实际服务
- [ ] 场景名取自 `scenes.json`
- [ ] 两个 GeoJSON 已进入 `dist/data`
- [ ] `/iserver` 同源代理正常
- [ ] 浏览器无 CORS、Worker、WebGL 和 Mixed Content 错误

### 功能

- [ ] 模型定位河南工业大学莲花街校区
- [ ] 建筑物/设备可单独点选
- [ ] 监控点不刺眼、不拥挤
- [ ] 坐标栏随鼠标移动
- [ ] 点击监控点返回真实字段
- [ ] 点击罐体不会返回数百个传感器
- [ ] 不显示未经核实的高度和面积
- [ ] 后续算法可获得统一坐标位置

---

## 16. 官方资料

1. [SuperMap iServer：GIS 服务的快速发布](https://help.supermap.com/iPortal/Server_Service_Management/quickPublish/start_a_service.htm)
2. [SuperMap iServer：发布三维切片缓存](https://help.supermap.com/iServer/Server_Service_Management/quickPublish/Publish_3D_cache.htm)
3. [SuperMap：远程浏览与上传工作空间/ZIP](https://help.supermap.com/iMobile/iOS/zh/TechnoloyDocument/DataServices/DataServices1.html)
4. [SuperMap iServer：三维服务的缓存机制](https://help.supermap.com/iPortal/Subject_introduce/Realspace/CapabilitiesOptimization/Cache.htm)
5. [SuperMap iServer：服务管理](https://help.supermap.com/iServer/Server_Service_Management/serviceManagement.htm)
6. [SuperMap iServer：跨域访问白名单](https://help.supermap.com/iServer/en/Subject_introduce/Security/otherSecurity/CORS_Filter.htm)
7. [SuperMap iServer：产品版本及三维模块能力](https://help.supermap.com/iServer/zh/Product_introduce/iServer_Introduce.htm)

---

## 17. 结论

本项目远端上线不是“发布一个 `.smwu`”这么简单，而是三部分必须同时正确：

1. iServer 能读取并发布完整的 `huangong_4490` S3M 缓存；
2. 前端能同源访问 realspace、config 和 `.s3mb`；
3. `DevicePoint_2D.geojson` 与 `Park_S3MObjectFootprint_2D.geojson` 随前端部署并参与客户端空间查询。

远端只有 `18090` 端口并非绝对障碍：如果管理页面可登录、远程浏览允许上传 ZIP，就可以通过该端口上传和发布。如果管理页面不可访问、禁止上传或上传限制不足，则必须由服务器管理员完成文件落盘、iServer 启动、许可、内存或网络配置，客户端无法仅凭端口解决。

正式上线应优先直接发布正确的 `huangong_4490.scp`，用新服务完成验收后再切换前端。不要重新启用旧 3D Tiles，不要再次平移 EPSG:4490 模型，也不要把未经核实的几何推算值展示为真实业务数据。
