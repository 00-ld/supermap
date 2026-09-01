/**
 * clientSpatialQuery.ts
 * ---------------------
 * 前端客户端空间查询（替代 iServer featureResults）。
 *
 * 为什么不用 iServer 查询：本机 iServer 2026 beta 构建的 featureResults 查询引擎对任何查询
 * （SQL/范围/ID/空间）都返回空（许可是通过的 TRIAL，属 beta 构建问题；日志见 getURLParameters
 * 与查询引擎空返回）。而 3D 服务、数据集列表、单要素读取正常。故把"空间查询"前移到客户端：
 * 加载已有的 DevicePoint_2D.geojson / Park_S3MObjectFootprint_2D.geojson 到内存，用纯函数查询。
 *
 * 坐标系：GeoJSON 几何为 EPSG:4547 投影米。查询 API 均以 4547 米为输入；
 *   提供 wgs84ToEPSG4547 / epsg4547ToWgs84 做经纬度↔投影互转（SCP 锚点仿射，园区 ~2km 内米级精度）。
 *   需更高精度请引入 proj4 + EPSG:4547 定义。
 *
 * 数据来源（Vite public 目录，运行时 fetch）：
 *   /data/DevicePoint_2D.geojson          1072 个监控点
 *   /data/Park_S3MObjectFootprint_2D.geojson  10286 个模型对象足迹（矩形）
 */
import {
  filterByModelName,
  filterBySensorId,
  pointsInBBox,
  pointsInBuffer,
  nearestPoints,
  footprintsIntersectBBox,
  footprintAtPoint,
  footprintsInBuffer,
  nearestFootprints,
  footprintModelName,
  assembleEquipmentFromFootprints,
  assembleEquipmentFromSmId,
  type GeoFeature,
  type BBox4547,
  type EquipmentAssembly,
  type FeatureWithDistance,
} from './geoQueryUtils'
import {
  parsePublishedModelAttributes,
  type PublishedModelAttributes,
  type PublishedModelFeatureResponse,
} from './publishedModelAttributes'

// 重新导出类型，供消费方从本模块统一引入
export type {
  GeoFeature,
  BBox4547,
  EquipmentAssembly,
  FeatureWithDistance,
} from './geoQueryUtils'

// ---------- WGS84 ↔ EPSG:4547 仿射转换（SCP 锚点）----------
// 锚点：huangong.scp position=(457527.93, 3854574.90) ↔ 郑州经纬度 (113.535771°E, 34.818673°N)
// 由 pyproj 精确反算得到（见 release_notes/坐标系修正说明.md）。
const ANCHOR_LON = 113.535771
const ANCHOR_LAT = 34.818673
const ANCHOR_X = 457527.93
const ANCHOR_Y = 3854574.9
// 米/度：纬度方向 ~111320；经度方向 ~111320*cos(lat)
const M_PER_DEG_LAT = 111320.0
const M_PER_DEG_LON = 111320.0 * Math.cos((ANCHOR_LAT * Math.PI) / 180)

/** WGS84 经纬度 → EPSG:4547 投影米（仿射近似，园区内米级精度）。 */
export function wgs84ToEPSG4547(lon: number, lat: number): [number, number] {
  const x = ANCHOR_X + (lon - ANCHOR_LON) * M_PER_DEG_LON
  const y = ANCHOR_Y + (lat - ANCHOR_LAT) * M_PER_DEG_LAT
  return [x, y]
}

/** EPSG:4547 投影米 → WGS84 经纬度（仿射逆变换）。 */
export function epsg4547ToWgs84(x: number, y: number): [number, number] {
  const lon = ANCHOR_LON + (x - ANCHOR_X) / M_PER_DEG_LON
  const lat = ANCHOR_LAT + (y - ANCHOR_Y) / M_PER_DEG_LAT
  return [lon, lat]
}

// ---------- GeoJSON 加载与缓存 ----------
const DP_URL =
  (import.meta.env.VITE_DEVICE_POINT_GEOJSON as string) ||
  '/data/DevicePoint_2D.geojson'
const FP_URL =
  (import.meta.env.VITE_FOOTPRINT_GEOJSON as string) ||
  '/data/Park_S3MObjectFootprint_2D.geojson'
const PUBLISHED_MODEL_FEATURE_BASE_URL =
  (import.meta.env.VITE_PUBLISHED_MODEL_FEATURE_BASE_URL as string) ||
  '/supermap-iserver/iserver/services/data-huagong-finally-4490/rest/data/datasources/huagong-finally-fbx-4490/datasets/modelComposeResult/features'

const publishedModelAttributePromises = new Map<
  number,
  Promise<PublishedModelAttributes | null>
>()

/** 按三维拾取 SmID 读取最新 modelComposeResult.ModelName。 */
export function queryPublishedModelAttributesBySmId(
  smId: number,
): Promise<PublishedModelAttributes | null> {
  if (!Number.isInteger(smId) || smId <= 0) return Promise.resolve(null)
  const cached = publishedModelAttributePromises.get(smId)
  if (cached) return cached
  const request = (async () => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch(
        `${PUBLISHED_MODEL_FEATURE_BASE_URL}/${smId}.json`,
        { headers: { Accept: 'application/json' }, signal: controller.signal },
      )
      if (!response.ok) {
        throw new Error(`读取最新模型属性失败：HTTP ${response.status}`)
      }
      return parsePublishedModelAttributes(
        (await response.json()) as PublishedModelFeatureResponse,
      )
    } finally {
      window.clearTimeout(timer)
    }
  })().catch((error) => {
    publishedModelAttributePromises.delete(smId)
    throw error
  })
  publishedModelAttributePromises.set(smId, request)
  return request
}

interface FeatureCollection {
  features: GeoFeature[]
}

let dpCache: GeoFeature[] | null = null
let fpCache: GeoFeature[] | null = null
let dpPromise: Promise<GeoFeature[]> | null = null
let fpPromise: Promise<GeoFeature[]> | null = null

/** 加载并缓存监控点（1072）。首次调用触发 fetch，后续返回缓存。 */
export async function loadDevicePoints(): Promise<GeoFeature[]> {
  if (dpCache) return dpCache
  if (!dpPromise) {
    dpPromise = fetch(DP_URL)
      .then((r) => {
        if (!r.ok)
          throw new Error(
            `加载 DevicePoint GeoJSON 失败：${r.status} ${DP_URL}`,
          )
        return r.json() as Promise<FeatureCollection>
      })
      .then((d) => {
        dpCache = d.features ?? []
        return dpCache
      })
      .catch((e) => {
        dpPromise = null // 失败后允许重试
        throw e
      })
  }
  return dpPromise
}

/** 加载并缓存模型对象足迹（10286，矩形）。较大（5MB），按需加载。 */
export async function loadFootprints(): Promise<GeoFeature[]> {
  if (fpCache) return fpCache
  if (!fpPromise) {
    fpPromise = fetch(FP_URL)
      .then((r) => {
        if (!r.ok)
          throw new Error(`加载 Footprint GeoJSON 失败：${r.status} ${FP_URL}`)
        return r.json() as Promise<FeatureCollection>
      })
      .then((d) => {
        fpCache = d.features ?? []
        return fpCache
      })
      .catch((e) => {
        fpPromise = null
        throw e
      })
  }
  return fpPromise
}

/** 预加载（应用启动时调用，可选）。 */
export async function preloadSpatialData(): Promise<void> {
  await Promise.all([loadDevicePoints(), loadFootprints()])
}

// ---------- DevicePoint（监控点）查询 ----------

/** 按 ModelName 查挂接的监控点（3D 点击拾取 ModelName → 传感器列表，主流程，无需坐标）。 */
export async function queryDevicePointsByModelName(
  modelName: string,
): Promise<GeoFeature[]> {
  return filterByModelName(await loadDevicePoints(), modelName)
}

/** 按 SensorID 查单个监控点。 */
export async function queryDevicePointBySensorId(
  sensorId: string,
): Promise<GeoFeature | null> {
  const arr = filterBySensorId(await loadDevicePoints(), sensorId)
  return arr[0] ?? null
}

/** 范围查监控点（bbox 为 EPSG:4547 米）。 */
export async function queryDevicePointsByBounds(
  bbox: BBox4547,
): Promise<GeoFeature[]> {
  return pointsInBBox(await loadDevicePoints(), bbox)
}

/** 缓冲区查监控点：中心 (cx,cy) EPSG:4547 米，半径 radiusM 米。 */
export async function queryDevicePointsByBuffer(
  cx: number,
  cy: number,
  radiusM: number,
): Promise<GeoFeature[]> {
  return pointsInBuffer(await loadDevicePoints(), cx, cy, radiusM)
}

/** 缓冲区查监控点（WGS84 经纬度中心，内部转 4547）。 */
export async function queryDevicePointsByBufferWgs84(
  lon: number,
  lat: number,
  radiusM: number,
): Promise<GeoFeature[]> {
  const [cx, cy] = wgs84ToEPSG4547(lon, lat)
  return queryDevicePointsByBuffer(cx, cy, radiusM)
}

/** 邻近监控点：离 (cx,cy) 4547 米最近的 count 个，带 distance（米）。 */
export async function queryNearestDevicePoints(
  cx: number,
  cy: number,
  count: number,
): Promise<FeatureWithDistance[]> {
  return nearestPoints(await loadDevicePoints(), cx, cy, count)
}

// ---------- Footprint（模型对象足迹）查询 ----------

/** 按发布数据的 ModelName 查足迹；离线足迹由 footprintModelName 统一兼容。 */
export async function queryFootprintsByModelName(
  modelName: string,
): Promise<GeoFeature[]> {
  const all = await loadFootprints()
  return all.filter((f) => footprintModelName(f) === modelName)
}

/** 按所选小组件 ModelName 返回设备级聚合结果（含真实组件 SmID 列表）。 */
export async function queryEquipmentAssemblyByModelName(
  modelName: string,
): Promise<EquipmentAssembly | null> {
  return assembleEquipmentFromFootprints(await loadFootprints(), modelName)
}

/** 按拾取 SmID 返回设备级聚合结果。 */
export async function queryEquipmentAssemblyBySmId(
  smId: number,
): Promise<EquipmentAssembly | null> {
  return assembleEquipmentFromSmId(await loadFootprints(), smId)
}

/** 范围查足迹：返回与 bbox 相交的模型对象（矩形 ⇒ 精确）。bbox 为 4547 米。 */
export async function queryFootprintsByBounds(
  bbox: BBox4547,
): Promise<GeoFeature[]> {
  return footprintsIntersectBBox(await loadFootprints(), bbox)
}

/** 点查足迹：返回包含 (x,y) 4547 米的模型对象（点落在哪个模型上）。 */
export async function queryFootprintAtPoint(
  x: number,
  y: number,
): Promise<GeoFeature | null> {
  return footprintAtPoint(await loadFootprints(), x, y)
}

/** 点查足迹（WGS84 经纬度，内部转 4547）。 */
export async function queryFootprintAtPointWgs84(
  lon: number,
  lat: number,
): Promise<GeoFeature | null> {
  const [x, y] = wgs84ToEPSG4547(lon, lat)
  return queryFootprintAtPoint(x, y)
}

/** 缓冲区查足迹：泄漏点周边 radiusM 米内的模型对象。中心 4547 米。 */
export async function queryFootprintsByBuffer(
  cx: number,
  cy: number,
  radiusM: number,
): Promise<GeoFeature[]> {
  return footprintsInBuffer(await loadFootprints(), cx, cy, radiusM)
}

/** 缓冲区查足迹（WGS84 中心）。 */
export async function queryFootprintsByBufferWgs84(
  lon: number,
  lat: number,
  radiusM: number,
): Promise<GeoFeature[]> {
  const [cx, cy] = wgs84ToEPSG4547(lon, lat)
  return queryFootprintsByBuffer(cx, cy, radiusM)
}

/** 邻近足迹：离 (cx,cy) 4547 米最近的 count 个，带 distance。 */
export async function queryNearestFootprints(
  cx: number,
  cy: number,
  count: number,
): Promise<FeatureWithDistance[]> {
  return nearestFootprints(await loadFootprints(), cx, cy, count)
}

// ---------- 便捷取值 ----------

/** 取监控点的 WGS84 经纬高（用于在三维球面放置/跳转）。 */
export function devicePointWgs84(f: GeoFeature): {
  lon: number
  lat: number
  height: number
} {
  const p = f.properties
  return {
    lon: Number(p.Wgs84Lon ?? 0),
    lat: Number(p.Wgs84Lat ?? 0),
    height: Number(p.InstallHeight ?? 0),
  }
}

/** 取足迹的属性摘要（ModelName + 高度 + 包围盒）。 */
export function footprintSummary(f: GeoFeature) {
  const p = f.properties
  return {
    modelName: footprintModelName(f),
    minHeight: Number(p.minHeight ?? 0),
    maxHeight: Number(p.maxHeight ?? 0),
    s3mLeft: Number(p.s3mLeft ?? 0),
    s3mRight: Number(p.s3mRight ?? 0),
    s3mBottom: Number(p.s3mBottom ?? 0),
    s3mTop: Number(p.s3mTop ?? 0),
    sourceScp: String(p.sourceScp ?? ''),
  }
}
