# DEM 栅格发布到 iServer 并在前端调用（完整操作手册）

> 对着本项目实际环境：iServer 在 `8.130.175.232:18090`，前端 Vite 代理 `/supermap-iserver`，三维用 SuperMap3D / Cesium。

---

## 第一阶段：在超图 iDesktop 发布 DEM

### 步骤 1：打开 iDesktop 并加载数据源

1. 启动 SuperMap iDesktop（10i / 11i 均可）
2. 菜单「开始」→「打开」→「文件型数据源」
3. 选择你的 DEM 栅格文件：
   - 如果是 `.tif` / `.tiff` / `.img` / `.dem`：直接「打开数据源」→ 文件类型选「影像文件」→ 选中文件 → 确定
   - 如果已有 `.udbx`：打开 `.udbx`，里面应该有栅格数据集
4. 在工作空间管理器确认栅格数据集出现（通常叫 `DEM` / `Elevation` / `ParkDEM` 之类）

### 步骤 2：检查/设置坐标系（关键）

1. 右键栅格数据集 →「属性」
2. 看「坐标系」标签页：
   - **必须是 CGCS2000 / EPSG:4547**（与园区矢量一致）
   - 如果不是：右键数据集 →「投影设置」→ 选 `CGCS2000 / 3-degree Gauss-Kruger CM 114E`（EPSG:4547）→ 应用
3. 看「范围」标签页，记录 left/bottom/right/top（后面发布要用）

### 步骤 3：新建地图并添加 DEM

1. 菜单「地图」→「新建地图窗口」
2. 把 DEM 栅格数据集拖进地图窗口
3. （可选）右键图层 →「属性」→「栅格渲染」：
   - 选「高程渲染」或「色彩阴影」让地形有立体感
   - 色带选「高程色带」（绿→黄→棕）
4. 菜单「地图」→「保存地图」→ 命名 `ParkDEM_CGCS2000`
5. 菜单「工作空间」→「保存」→ 存为 `ParkDEM.smwu`

### 步骤 4：生成地图缓存（切片，让前端多级缩放高清）

1. 菜单「数据」→「地图缓存」→「生成地图缓存」
2. 参数设置：
   - **地图**：选 `ParkDEM_CGCS2000`
   - **缓存类型**：`栅格缓存`（保留高程值）或 `图片缓存`（渲染后切片，有颜色）
   - **比例尺**：点「添加」依次加入：
     ```
     1:500
     1:1000
     1:2000
     1:5000
     1:10000
     ```
   - **缓存范围**：点「拾取」框选整个 DEM 范围，或手动填步骤 2 记录的 left/bottom/right/top
   - **存储格式**：`紧凑型`（生成 `.sci3d` + `.bundle`，单文件好发布）
   - **图片格式**：`PNG`（有透明）或 `JPG`（体积小，无透明）
   - **图片大小**：`256×256`（标准瓦片）
   - **缓存目录**：选一个空目录，如 `D:\ParkDEMCache`
3. 点「生成」，等待完成（园区范围小，5-15 分钟）

### 步骤 5：发布到 iServer

1. 把生成的缓存目录（含 `.sci3d` 文件）整个拷贝到 iServer 服务器：
   - 远端：`8.130.175.232`（用 scp / WinSCP 上传到 `/data/iserver/webapps/iserver/WEB-INF/data/` 或类似目录）
   - 或本地 iServer：直接放本地路径
2. 浏览器登录 iServer Manager：
   ```
   http://8.130.175.232:18090/iserver/manager
   ```
   账号 `admin`，密码见部署文档
3. 「服务管理」→「创建服务」→ 选「REST 地图服务」
4. 数据来源选「地图缓存」→ 浏览选择上传的 `.sci3d` 文件路径
5. 服务名填：`map-ParkDEM-CGCS2000`
6. 点「创建」
7. 记录服务 URL：
   ```
   http://8.130.175.232:18090/iserver/services/map-ParkDEM-CGCS2000/rest
   ```

### 步骤 6：验证服务可用

浏览器直接访问（或用 curl）：
```
http://8.130.175.232:18090/iserver/services/map-ParkDEM-CGCS2000/rest/maps/ParkDEM_CGCS2000.json
```
应返回 JSON，包含 `viewBounds`、`scale`、`prjCoordSys`。

测试瓦片：
```
http://8.130.175.232:18090/iserver/services/map-ParkDEM-CGCS2000/rest/maps/ParkDEM_CGCS2000/tileImage.png?transparent=false&width=256&height=256&x=0&y=0&scale=0.0001
```
应返回 PNG 图片（HTTP 200）。

---

## 第二阶段：前端调用

### 方案 A：在二维地图叠加 DEM 瓦片（Leaflet）

把服务 URL 告诉我，我在 `SuperMap2DLayer.vue` 加一个 DEM 图层：

```ts
// 在 createBaseLayer() 里，矢量瓦片之上叠加 DEM 瓦片
const demLayer = tiledMapLayer(
  '/supermap-iserver/iserver/services/map-ParkDEM-CGCS2000/rest/maps/ParkDEM_CGCS2000',
  { cacheEnabled: true, noWrap: true, transparent: true }
)
```

### 方案 B：在三维场景加载 DEM 地形（SuperMap3D / Cesium）

在 `SuperMapSceneViewer.vue` 加载 DEM 作为地形：

```ts
// 加载 DEM 栅格作为地形高程
const demProvider = new Cesium.SuperMapImageryProvider({
  url: '/supermap-iserver/iserver/services/map-ParkDEM-CGCS2000/rest',
  isSct: false
})
viewer.imageryLayers.addImageryProvider(demProvider)
```

或加载为真实地形（需要 DEM 是栅格高程，不是渲染图）：
```ts
// 如果 DEM 缓存是栅格高程缓存（.sci3d 原始栅格），可加载为地形
const terrainProvider = new Cesium.SuperMapTerrainProvider({
  url: '/supermap-iserver/iserver/services/map-ParkDEM-CGCS2000/rest/realspace/datas'
})
viewer.terrainProvider = terrainProvider
```

---

## 第三阶段：Vite 代理配置

如果 DEM 服务在远端 `8.130.175.232:18090`，前端通过 `/supermap-iserver` 代理访问（已配好，无需改）。

如果 DEM 服务在本地 iServer，确认 `vite.config.ts` 的 `superMapIServerProxyTarget` 指向本地 iServer。

---

## 你需要告诉我的信息

发布完成后，把以下信息发给我，我直接改前端代码接入：

1. **服务 URL**（如 `http://8.130.175.232:18090/iserver/services/map-ParkDEM-CGCS2000/rest`）
2. **地图名**（如 `ParkDEM_CGCS2000`）
3. **坐标系**（EPSG:4547 / -1000 / 其他）
4. **缓存类型**（栅格缓存 / 图片缓存）
5. **用在二维还是三维**（或都要）

---

## 常见问题

### Q: 生成缓存时报错"比例尺不匹配"
A: iDesktop 的比例尺要和地图当前比例尺一致。先在地图窗口缩放到合适层级，再点「添加当前比例尺」。

### Q: 发布后瓦片返回空白
A: 检查缓存范围是否覆盖 DEM 实际范围。iDesktop 生成缓存时「缓存范围」要选「数据集范围」或手动框选全图。

### Q: 三维地形加载后高程不对
A: DEM 栅格的高程值单位要和场景单位一致（米）。如果 DEM 是经纬度坐标，需要先投影转换到 CGCS2000 平面坐标。

### Q: 前端瓦片请求 400
A: 和当前矢量瓦片一样，`tiledMapLayer` 不要传 `prjCoordSys` 参数，让 iServer 用服务自身坐标系返回瓦片。



