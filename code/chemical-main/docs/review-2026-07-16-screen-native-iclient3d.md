# /screen 原生 iClient3D 指挥大屏 + 传感器语义建模 审查与落地建议

> 审查范围：`frontend/src/components/SuperMapSceneViewer.vue`、`frontend/src/views/screen/`、`frontend/src/data/supermapCupScenario.ts`、`frontend/src/data/monitoringSensorStandard.ts`、`frontend/src/data/realSensorLayout.ts`、`frontend/src/data/supermapGeoreference.js`、`frontend/src/types/supermap-scene-events.ts`、`.env.*`、交接文档 `docs/handoff-2026-07-15-supermap-3d.md`。
> 审查时间：2026-07-16。
> 角色：资深 Vue3 + SuperMap iClient3D 工程师。

---

## 一、现状判断（基于真实代码，不是推测）

### 1. `/screen` 目前是「壳 + 巨型组件」

- `views/screen/index.vue` 只有 23 行，直接挂 `<SuperMapSceneViewer />`，不传任何 props，不接任何 emit。
- `SuperMapSceneViewer.vue` 单文件 **2376 行**，内含：SDK 加载、场景打开、S3M/config 兜底、本地坐标相机护栏、监控点渲染、点击拾取、扩散/粒子/疏散三类算法的请求+落图+屏幕引导层、状态面板、调试钩子。
- 它同时被 `views/screen/index.vue`（大屏）和 `views/smart_map/components/ParkScene3D.vue`（智巡）两个入口复用，二者诉求不同却被同一个 `showStatusPanel` 开关粗暴切换。

**结论**：`SuperMapSceneViewer` 是一个「上帝组件」，既是大屏指挥中心，又是智巡的三维子件。`/screen` 要做原生指挥大屏，第一步必须把这个组件按职责拆开，否则后续每加一个传感器交互都会继续往 2376 行里塞。

### 2. iPortal iframe 兜底已经存在但只是降级路径

- `renderMode === 'fallback'` 时渲染 `<iframe :src="dashboardUrl">`，`dashboardUrl` 来自 `VITE_IPORTAL_DASHBOARD_URL`。
- 现状是「原生优先，失败才 iframe」——方向正确，但失败判定过于乐观：`bootstrapScene()` 里只要 `loadSuperMapRuntime()` / `new Viewer()` / `openScene()` 抛错就切 fallback。`openScene()` 内部对 Realspace 有 30s 超时，超时后只 push message，**不抛错**，于是 Realspace 卡住时并不会切 fallback，而是停在一个半成品场景上（黑底/模型不完整）。这是交接文档「S3M config 兜底导致黑底」问题的根因之一。

### 3. 传感器数据契约已经有骨架，但有结构性裂缝

- `monitoringSensorStandard.ts` 定义了 8 种 `MonitoringSensorModelId`，`SensorThingsProfile`（Thing/Location/Sensor/Datastream/ObservedProperty/Observation/FeatureOfInterest）字段齐全，`MONITORING_SENSOR_MODEL_CATALOG` 也带 `defaultInstallHeight/defaultCoverageRadius/placementBasis/geometryBasis`。
- `supermapCupScenario.ts` 的 `SUPERMAP_CUP_SENSORS` 由两路拼接：
  1. `REAL_SENSOR_LAYOUT`（54 个气体探头，全 `type:'gas'`）→ `toScenarioSensor`。
  2. `SUPPORT_MONITORING_SENSOR_SEEDS`（10 个补点：开放路径/气象/PTZ/火焰/声光/网关）→ `toSupportScenarioSensor`。
- **裂缝 1**：`REAL_SENSOR_LAYOUT` 只有气体，且 `inferGasSensorModelId()` 只能区分 `fixed-gas-low` / `fixed-gas-high`。也就是说 64 个点位里 54 个被强制归类为两种气体模型，`assetKind` 只有 `cylindrical-gas-probe` / `wall-mounted-gas-probe`。PTZ/火焰/气象/网关只有 10 个补点撑场面，覆盖密度严重不足。
- **裂缝 2**：`SuperMapCupSensor.type` 字段被赋值为 `standard.modelId`（即 `'fixed-gas-low'` 这种模型 ID），而不是语义类型（`'gas'`/`'camera'`/`'weather'`）。这导致 `sensorColor()` 里 `sensor.type.toLowerCase().includes('wind')` 这类判断永远不成立——`type` 已经是 `weather-station` 这种值了，`includes('wind')` 命中不了。这是真实 bug。
- **裂缝 3**：开放路径气体探测器（`open-path-gas`）的 `geometryBasis` 写明「PointZ 代表发射端，后续可扩展为 LineStringZ」，但代码里把它当成和固定气体一样的 point 渲染，丢失了「路径」语义。这是后续 CityGML/3D Tiles 建模时最容易被挑的硬伤。

### 4. 坐标系是双轨制，且当前跑在「不诚实」的轨道上

- `shouldApplyLayerPosition` 由 `VITE_SUPERMAP_3D_APPLY_LAYER_POSITION === 'true'` 控制。
  - `true` → 球面 CGCS2000/EPSG:4490，globe 显示，相机用经纬度。
  - `false`（当前 dev/prod 默认）→ EPSG:0 本地米制 S3M 缓存，globe 隐藏，相机用本地坐标 + 520ms 轮询护栏防止飘出园区。
- 交接文档明确承认：`3D-chemical_park_cgcs2000/rest/realspace` 仍是 404，当前是「旧 EPSG:0 缓存 + 业务算法走 CGCS2000」的混合态。
- 代码里 `mapPointToSceneCartesian()` / `addEllipseEntity()` / `mapDistanceToSceneMeters()` 全部按 `shouldApplyLayerPosition` 分叉两套实现，这是 2376 行膨胀的主要原因之一。

### 5. TypeScript 类型风险高度集中在「外部对象」边界

- `SuperMapViewer` / `SuperMapRuntime` / `PickedFeature` 全是手写 `type`，大量可选属性 + `Record<string, unknown>`，对 SDK 实际返回的结构几乎不约束。
- 全程靠 `asRecord(value: unknown): AlgorithmRecord` 把动态对象转成 `AlgorithmRecord`，而 `AlgorithmRecord` 本身是 `import { AlgorithmRecord } from '@/api/algorithm'` 的类型，被当成万能字典用（`asRecord(result.estimatedSource).mapPoint`）。
- 传感器拾取里 `resolvePickedSensor` 把 `picked.id` 当 `Record<string, unknown>` 取 `superMapCupSensorId`，这个属性是组件自己塞进 `entities.add()` 的非标准字段，SuperMap/Cesium 的 `Entity` 类型并不认它——靠运行时鸭子类型。一旦 SDK 升级或实体被序列化（如 state dump），这个字段会丢，拾取就失灵。

---

## 二、落地建议（按优先级，可直接对代码改）

### P0 — 拆组件，建立 `/screen` 专属指挥大屏层

**目标**：`SuperMapSceneViewer` 退回为「纯三维视口」，`/screen` 在其外包一层指挥大屏外壳。

**建议目录结构**（FSD 风格，符合 `~/.claude/rules/vue/patterns.md`）：

```
views/screen/
  index.vue                          # 大屏外壳：布局 + 面板编排
  components/
    ScreenHeader.vue                 # 顶部标题栏（原 status-head）
    ScreenStatusPanel.vue            # 右下状态面板（原 scene-status-panel）
    ScreenAlgorithmPanel.vue         # 算法演示面板（原 algorithm-demo-panel）
    ScreenSensorInspector.vue        # 传感器详情侧栏（新增，承接点击）
    ScreenEvidenceFeed.vue           # 证据流水（原 evidence-card 列表）
  composables/
    useScreenScene.ts                 # 大屏专属：场景生命周期 + 算法编排
    useScreenSensorInteraction.ts    # 传感器点击、高亮、联动
    useScreenAlgorithmDemo.ts        # 扩散/粒子/疏散三类演示
```

**拆分原则**：
- `SuperMapSceneViewer` 只保留：SDK 加载、Viewer 初始化、场景打开、S3M/config 兜底、相机护栏、实体增删的通用 `addEntity`/`clearOverlay`。把 `renderMonitoringSensors` 移出去——它应该由 `useScreenSensorInteraction` 驱动，组件只暴露 `defineExpose({ addSensorEntity, removeSensorEntity, flyToSensor })`。
- `/screen` 的 `index.vue` 用 `provide` 注入一个 `ScreenSceneContext`（`InjectionKey`，符合 vue/patterns.md），子面板 `inject` 后只读 `viewer` 状态、`selectedSensor`、`algorithmState`，不直接碰 viewer。
- 智巡侧 `ParkScene3D.vue` 继续用瘦化后的 `SuperMapSceneViewer`，不受大屏面板污染。

**emit 契约收紧**：当前 `facility-click` 和 `scene-object-pick` 在 `/screen` 里没人接（`index.vue` 没绑）。大屏化后应让 `ScreenSensorInspector` 接 `scene-object-pick`，并把 `facility-click` 标记为 deprecated——它和 `scene-object-pick` 语义重叠（都是点击传感器时触发），保留一个即可。

### P1 — 传感器数据层重构：把 `type` 和 `modelId` 分开

**当前 bug**（`supermapCupScenario.ts:329`）：
```ts
type: standard.modelId,   // 'fixed-gas-low'，不是语义类型
```

`SuperMapCupSensor` 应新增 `sensorCategory: 'gas' | 'camera' | 'weather' | 'flame' | 'alarm' | 'gateway'`，`type` 仍保留模型 ID。`sensorColor()` 改判 `sensorCategory`：
```ts
function sensorColor(sensor: SuperMapCupSensor) {
  if (sensor.color) return sensor.color
  switch (sensor.sensorCategory) {
    case 'weather': return '#35d2ff'
    case 'camera': return '#f8d66d'
    case 'flame': return '#ff6b4a'
    case 'alarm': return '#ffb020'
    case 'gateway': return '#b69cff'
    default: return sensor.priority >= 4 ? '#ff6b4a' : sensor.priority >= 3 ? '#ffb020' : '#52ffb8'
  }
}
```

**`MonitoringSensorModel` 扩展**：加 `category: SensorCategory` 和 `geometryKind: 'point' | 'line' | 'sector' | 'volume'`。开放路径用 `line`，PTZ/火焰用 `sector`（带 FOV），气象站/网关用 `volume`（覆盖球）。这样后续 3D 建模才有据可依。

### P2 — 传感器三维交互：从 point 到有形态的资产

当前 `renderMonitoringSensors()` 全部用 `point + billboard + label`，64 个点视觉上无法区分型号。建议按 `geometryKind` 分层渲染：

| geometryKind | 渲染方式 | SuperMap/Cesium API |
|---|---|---|
| point（固定气体） | 保持 point+billboard，但按 category 配色 | `entities.add({ point, billboard })` |
| line（开放路径） | 发射端 point + 接收端 point + 中间 polyline，颜色按路径积分浓度 | `entities.add({ polyline })` + 两端 point |
| sector（PTZ/火焰） | point + 椎体/扇形表示 FOV | `entities.add({ ellipse })` 或自定义 `primitive` 扇形 |
| volume（气象/网关） | 透明球体表示覆盖范围 | `entities.add({ ellipsoid })` |

**交互**：
- 点击传感器 → 高亮该实体（`entity.point.color` 切换）+ 弹 `ScreenSensorInspector` 面板，显示完整 SensorThings 七元组 + 最近观测。
- 悬停 → 显示 `label`（当前只有 priority≥3 才显示 label，大屏应全显示，用 `disableDepthTestDistance: Infinity` 保证不被模型遮挡）。
- 选中传感器时，提供「定位到此点」按钮 → `viewer.flyTo(entity)`。

**拾取健壮性**：不要依赖 `entity.superMapCupSensorId` 这个非标准字段。改用 `entity.id`（`entities.add` 返回的 Entity 有标准 `id`），建一个 `Map<string, SuperMapCupSensor>` 在 `renderMonitoringSensors` 时填充，拾取时用 `picked.id` 查这个 Map。这样 SDK 升级、序列化都不影响。

### P3 — SensorThings + CityGML/3D Tiles 语义建模的数据契约

**目标**：前端数据层产出符合 OGC 规范的结构，供后端/iServer 发布和前端 3D Tiles 加载共用。

新增 `frontend/src/data/sensorThingsSerializer.ts`：

```ts
import type { SuperMapCupSensor } from './supermapCupScenario'

// OGC SensorThings v1.1 实体
export interface SensorThingsThing {
  '@iot.id': string
  '@iot.selfLink': string
  name: string
  description: string
  properties: {
    modelId: string
    modelName: string
    assetKind: string
    facilityId: string
    hazardZone: string
    priority: number
    dataQuality: 'SIMULATED' | 'CONFIGURED' | 'VERIFIED'
  }
  Locations: SensorThingsLocation[]
  Datastreams: SensorThingsDatastream[]
}

export interface SensorThingsLocation {
  name: string
  encodingType: 'application/geo+json'
  location: {
    type: 'Point' | 'LineString'
    coordinates: number[]   // [lon, lat, height] EPSG:4490，开放路径用 LineString
  }
}

export interface SensorThingsDatastream {
  name: string
  description: string
  unitOfMeasurement: { symbol: string; name: string }
  ObservedProperty: { name: string; definition: string }
  Sensor: { name: string; description: string; encodingType: string; metadata: string }
  Observations: { phenomenonTime: string; result: number }[]
}

export function serializeSensorToSensorThings(sensor: SuperMapCupSensor): SensorThingsThing {
  return {
    '@iot.id': sensor.id,
    '@iot.selfLink': `/v1.1/Things(${sensor.id})`,
    name: `${sensor.id} · ${sensor.modelName}`,
    description: sensor.placementBasis,
    properties: {
      modelId: sensor.modelId,
      modelName: sensor.modelName,
      assetKind: sensor.assetKind,
      facilityId: sensor.facilityId,
      hazardZone: sensor.hazardZone,
      priority: sensor.priority,
      dataQuality: sensor.dataQuality,
    },
    Locations: [{
      name: sensor.featureOfInterest,
      encodingType: 'application/geo+json',
      location: {
        type: sensor.modelId === 'open-path-gas' ? 'LineString' : 'Point',
        coordinates: sensor.modelId === 'open-path-gas'
          ? /* 发射端+接收端经纬度 */ []
          : [sensor.geoPoint.longitude, sensor.geoPoint.latitude, sensor.installationHeight],
      },
    }],
    Datastreams: sensor.observedProperties.map((op, i) => ({
      name: `${sensor.id}-${op.code}-Datastream`,
      description: `${op.name} 实时观测`,
      unitOfMeasurement: { symbol: op.unit, name: op.name },
      ObservedProperty: { name: op.name, definition: `https://example.org/op/${op.code}` },
      Sensor: {
        name: sensor.sensorThings.sensor,
        description: sensor.modelName,
        encodingType: 'http://example.org/encoding/pdf',
        metadata: sensor.sensorThings.sensor,
      },
      Observations: [],  // 由后端时序库填充
    })),
  }
}
```

**CityGML/3D Tiles 侧**：传感器作为 CityGML `Sensor` Feature（CityGML 3.0 模块）或 3D Tiles 的 `b3dm` + 属性表。前端不直接生成 b3dm，但应在 `sensorThingsSerializer` 里同时产出一份 `tileset.json` 友好的属性表（`batchTable` 字段），供 iServer 发布时用。关键：`batchTable` 字段必须和 SensorThings `properties` 一致，避免两套语义。

### P4 — 兜底策略明确化

`/screen` 不应再用 iPortal iframe 作为「原生失败兜底」——指挥大屏的语义是「自有可控」，iframe 兜底会让评委质疑自主性。建议：

1. **原生失败 → 降级到 2D SmartMap + 错误提示**，不降级到 iPortal iframe。保留 `dashboardUrl` 仅作「查看 iPortal 原始大屏」的外链按钮（新窗口打开），而不是内嵌兜底。
2. `openScene()` 里 Realspace 超时后**必须抛错**或显式切 fallback，不能只 push message 后静默继续。当前 `withTimeout` reject 后被 catch，但 catch 里只赋 `sceneMessage`，流程继续往下走到 `addS3MTilesLayerByScp`——这就是黑底根因。应在 catch 里 `throw` 让 `bootstrapScene` 走 fallback 分支，或显式 `renderMode.value = 'fallback'`。

### P5 — 外部对象类型安全

把 `asRecord(value: unknown): AlgorithmRecord` 这种「万能字典」收敛。`AlgorithmRecord` 不该是 `import` 来的通用类型被到处 `as`。建议：

- 新增 `frontend/src/types/dynamic-record.ts`，定义 `type DynamicRecord = Record<string, unknown>`，所有「从 SDK/后端拿来的动态对象」统一用 `DynamicRecord`，而不是复用 `AlgorithmRecord`。
- `asRecord` 改名为 `toDynamicRecord`，返回 `DynamicRecord`。
- 对真正有结构的字段（如 `estimatedSource.mapPoint`），定义专门的 narrow 函数 `parseEstimatedSource(record: DynamicRecord): { mapPoint: SuperMapCupMapPoint; credibleRadius95m: number } | null`，返回 `null` 时显式处理，而不是链式 `Number(asRecord(...).xxx || 0)`。

这能消除当前代码里大量 `Number(asRecord(result.estimatedSource).credibleRadius95m || 45)` 这种「默认值吞掉真实错误」的写法。

---

## 三、风险点清单（按严重度）

### CRITICAL

1. **`openScene()` 超时后不切 fallback，导致黑底半成品场景**（`SuperMapSceneViewer.vue:548-564`）。交接文档「S3M config 兜底导致黑底」的直接根因。评委看到黑底即判负。
2. **传感器拾取依赖非标准 `entity.superMapCupSensorId` 字段**（`:920`, `:1592`）。SDK 升级或实体序列化时丢字段，拾取静默失灵，无报错。

### HIGH

3. **`sensor.type = standard.modelId` 语义错位**（`supermapCupScenario.ts:329`）。`sensorColor()` 的 `includes('wind')` 永不命中，64 个点里气象/PTZ/火焰可能配色错误，影响大屏识别。
4. **`SuperMapSceneViewer` 2376 行单文件**，同时服务大屏和智巡。任何一处改动都可能双向影响，且超出 `~/.claude/rules/common/coding-style.md` 的 800 行上限 3 倍。code review 和回归成本极高。
5. **坐标双轨制**：`shouldApplyLayerPosition` 在 dev/prod 都是 `false`，但交接文档承认 CGCS2000 Realspace 未发布。当前「EPSG:0 缓存 + CGCS2000 算法」是已知不诚实状态。若评委核验经纬度落点，模型与算法结果会错位。
6. **`AlgorithmRecord` 被当万能字典**（`asRecord` 滥用）。`Number(asRecord(result.estimatedSource).credibleRadius95m || 45)` 这类写法把「字段缺失」和「字段为 0」混为一谈，溯源半径可能默认成 45m 而无告警。

### MEDIUM

7. **开放路径气体探测器只渲染成 point**，丢失 LineStringZ 路径语义（`monitoringSensorStandard.ts:133` 已注明「后续可扩展」）。对「语义建模」考核是硬伤。
8. **`facility-click` 与 `scene-object-pick` emit 语义重叠**，且 `/screen` 当前不接任何 emit。拆组件时若不收紧，会形成两个事件源各自更新的竞态。
9. **520ms 相机护栏轮询**（`setupLocalSceneInteractionGuard`）只在 EPSG:0 模式生效。切到 CGCS2000 球面后这段逻辑全跳过，但 `lastStableLocalCamera` 仍在内存里，切回本地模式时可能恢复到过时视角。
10. **`SUPERMAP_CUP_SENSORS` 是模块顶层常量**，64 个点位在应用启动时就全量计算。若未来从后端拉取传感器布局，需要改成 `ref` + 异步加载，当前结构不支持。
11. **`description` 字段拼 HTML 字符串**（`:947-958` 用 `<br/>`）。SuperMap/Cesium 的 `infoBox` 会渲染 HTML，若未来传感器描述含用户/外部输入，存在 XSS 风险（符合 vue/security.md 的 v-html 同类风险）。当前来源是静态数据，风险低，但应前置防御。

### LOW

12. `inferGasSensorModelId` 只看 id 是否以 `H` 结尾或高度 >1.8，`WH-01`（高度 1.5）会被判成 `fixed-gas-low`，但仓储区点位语义是「边界巡检」而非「低位近源」。分类粒度不够。
13. `markerSvgDataUri` 每次调用都拼字符串 + `encodeURIComponent`，64 个传感器 + 疏散箭头点带会重复生成上百个 data URI。可加 `Map<string, string>` 缓存。
14. `destroyScene()` 调 `viewer.value?.destroy?.()`，但没等 GPU 资源真正释放就允许 `reloadScene` 重新 `new Viewer`，快速点「重新加载」可能触发 WebGL context 泄漏。

---

## 四、推荐的落地顺序（2-3 天工作量）

1. **Day 1 上午**：修 P0 两个 CRITICAL——`openScene` 超时切 fallback + 拾取改用 `entity.id` + Map。这两处改动小、收益大、可独立提交。
2. **Day 1 下午**：拆 `SuperMapSceneViewer`，把 `renderMonitoringSensors` 和三类算法演示移到 `useScreen*` composables。`/screen/index.vue` 编排面板。这一步不动数据层，只搬代码。
3. **Day 2 上午**：P1 传感器 `sensorCategory` + `geometryKind` 字段，修 `sensorColor` bug，`monitoringSensorStandard.ts` 扩展。
4. **Day 2 下午**：P2 传感器分层渲染（point/line/sector/volume），先做 point 和 line（开放路径），sector/volume 用简化几何占位。
5. **Day 3**：P3 `sensorThingsSerializer.ts` + batchTable 属性表。P4 兜底策略调整（移除 iframe 兜底，改 2D 降级）。P5 类型收敛。

**不建议这轮做**：CGCS2000 Realspace 真实发布（依赖 iDesktopX 重缓存，非前端任务，交接文档已明确阻塞）。前端侧只保证「切到 CGCS2000 球面时代码路径已就绪」，即 `shouldApplyLayerPosition=true` 分支能跑通，等后端服务就绪后翻 env 开关。

---

## 五、一句话总结

当前 `/screen` 是一个 2376 行上帝组件 + 64 个 point 传感器 + 已知坐标不诚实状态 + 两个 CRITICAL 级稳定性/拾取 bug。优先修 bug + 拆组件 + 传感器语义分层，SensorThings 序列化作为数据契约产物同步落地；CGCS2000 三维发布是后端/iDesktopX 阻塞，前端只保证 env 开关就绪。
