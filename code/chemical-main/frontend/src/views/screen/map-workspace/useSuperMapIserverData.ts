import type { MapFacility } from '@/data/realMapAssets'
import {
  formatParkEntranceLabel,
  nearestFacilityBoundaryPointToRoads,
} from './evacuationRouteSafety'
import {
  SUPERMAP_CGCS2000_COORD_SYS,
  SUPERMAP_CGCS2000_EPSG,
  SUPERMAP_CGCS2000_TRANSFORM,
  SUPERMAP_LOCAL_COORD_SYS,
  projectedToLocalD,
} from '@/data/supermapGeoreference'

const DEFAULT_DATA_SERVICE_URL =
  '/supermap-iserver/iserver/services/data-chemical_park_vectors_cn/rest'
const DEFAULT_CGCS2000_DATA_SERVICE_URL =
  '/supermap-iserver/iserver/services/data-chemical_park_vectors_cgcs2000/rest'
const DEFAULT_DATASOURCE = 'chemical_park_vectors_cn'
const DEFAULT_CGCS2000_DATASOURCE = 'chemical_park_vectors_cgcs2000'
const ROAD_EDGE_DATASET = 'Park_RoadNetworkEdge_L'
const ENTRANCE_DATASET = 'Park_EntrancePoint_P'
const BUILDING_DATASET = 'Park_BuildingFootprint_R'
const QUERY_DATASETS = [BUILDING_DATASET, ROAD_EDGE_DATASET, ENTRANCE_DATASET]
const ROAD_RENDER_WIDTH = 10
const ISERVER_FEATURE_BATCH_SIZE = 6
const ISERVER_REQUEST_TIMEOUT_MS = 12_000
const ISERVER_RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504])
const LOCAL_MAP_BOUNDS = { left: 0, top: 0, right: 1587.2, bottom: 947.2 }
const CGCS2000_MAP_BOUNDS = {
  left: 457752.343,
  top: 3856245.172,
  right: 459339.543,
  bottom: 3855297.972,
}

export interface SuperMapRoadRect {
  id: string
  x: number
  y: number
  w: number
  h: number
  // x/y/w/h 仅用于粗筛与二维兼容渲染；道路吸附和三维路径校验使用完整折线。
  points: Array<{ x: number; y: number }>
  main?: boolean
  source?: string
}

export interface SuperMapEntrance {
  id: string
  kind: string
  edge: string
  x: number
  y: number
  label: string
  tooltipSide: string
  parentId?: string
  sourceFacilityId?: string
  source?: string
}

export interface SuperMapPlanningInputs {
  source: 'supermap-iserver-data'
  sourceLabel: string
  roads: SuperMapRoadRect[]
  parkEntrances: SuperMapEntrance[]
  buildingEntrances: SuperMapEntrance[]
  facilities: MapFacility[]
  facilityById: Map<string, MapFacility>
  map: {
    coordSys: string
    displayCoordSys?: string
    networkCoordinateBridge?: 'LOCALMAP_TO_ISERVER_D'
    epsg?: number
    mapMetersPerUnit: number
    width: number
    height: number
    bounds?: {
      left: number
      right: number
      top: number
      bottom: number
    }
    georeference?: unknown
  }
}

interface SuperMapFeatureList {
  childUriList?: string[]
  featureCount?: number
}

interface SuperMapGeometryPoint {
  x?: number | string
  y?: number | string
}

interface SuperMapGeometry {
  center?: SuperMapGeometryPoint
  points?: SuperMapGeometryPoint[]
  type?: string
}

interface SuperMapFeature {
  fieldNames?: string[]
  fieldValues?: Array<string | number | null>
  geometry?: SuperMapGeometry
  ID?: string | number
}

export interface SuperMapFeatureQueryResult {
  datasetName: string
  smId: string
  id: string
  fields: FeatureFields
  geometry?: SuperMapGeometry
  distanceMeters?: number
}

export interface SuperMapPointQuery {
  x: number
  y: number
  datasetNames?: string[]
  toleranceMeters?: number
}

export interface SuperMapDiffusionImpactInput {
  frame?: {
    cells?: Array<{
      x: number
      y: number
      size?: number
      level?: string
      concentration?: number
    }>
    maxConcentration?: number
  } | null
  roads: readonly SuperMapRoadRect[]
  facilities: readonly MapFacility[]
  parkEntrances: readonly SuperMapEntrance[]
  dangerConcentrationRatio?: number
}

export interface SuperMapDiffusionImpactResult {
  executor: 'iclient2d-overlay'
  coordinateSystem: {
    coordSys: string
    epsg: number
  }
  affectedFacilities: Array<{
    id: string
    name: string
    maxLevel: string
    maxConcentration: number
  }>
  blockedRoads: Array<{
    id: string
    reason: string
    maxConcentration: number
  }>
  candidateExits: Array<{
    id: string
    label: string
    x: number
    y: number
    score: number
    status: 'candidate' | 'risk-adjacent'
  }>
  summary: {
    affectedFacilityCount: number
    blockedRoadCount: number
    candidateExitCount: number
    dangerCellCount: number
    affectedCellCount: number
  }
}

type FeatureFields = Record<string, string>

function dataServiceBase() {
  const defaultUrl = isCgcs2000Mode()
    ? DEFAULT_CGCS2000_DATA_SERVICE_URL
    : DEFAULT_DATA_SERVICE_URL
  return String(
    import.meta.env.VITE_SUPERMAP_DATA_SERVICE_URL || defaultUrl,
  ).replace(/\/+$/, '')
}

function datasourceName() {
  const defaultDatasource = isCgcs2000Mode()
    ? DEFAULT_CGCS2000_DATASOURCE
    : DEFAULT_DATASOURCE
  return String(
    import.meta.env.VITE_SUPERMAP_DATA_DATASOURCE || defaultDatasource,
  )
}

function proxiedUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return url
  try {
    const parsed = new URL(url)
    const restIndex = parsed.pathname.indexOf('/rest/')
    const restPath =
      restIndex >= 0
        ? parsed.pathname.slice(restIndex + '/rest'.length)
        : parsed.pathname
    return `${dataServiceBase()}${restPath}.rjson`
  } catch {
    return url
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController()
    const timer = window.setTimeout(
      () => controller.abort(),
      ISERVER_REQUEST_TIMEOUT_MS,
    )
    let response: Response | null = null
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(`iServer 请求失败：${url}`)
      if (attempt === 2) throw lastError
    } finally {
      window.clearTimeout(timer)
    }
    if (response) {
      if (response.ok) return response.json() as Promise<T>
      lastError = new Error(`iServer 请求失败 ${response.status}: ${url}`)
      if (!ISERVER_RETRYABLE_STATUS_CODES.has(response.status)) throw lastError
    }
    if (attempt < 2)
      await new Promise((resolve) =>
        window.setTimeout(resolve, 280 * (attempt + 1)),
      )
  }
  throw lastError || new Error(`iServer 请求失败：${url}`)
}

// 论文 5.1.3 第5条（预缓存 > 动态缓存）：会话级数据集缓存。同一数据集（道路/入口/建筑）
// 在会话内只全量 fetch 一次，后续查询（findFacilityById / loadSuperMapPlanningInputs 等）命中缓存秒返。
// key 为 datasource+dataset，避免 CGCS2000 与普通模式数据源切换时串数据。刷新页面失效。
// 缓存 Promise 而非结果，保证并发请求同一数据集只发一次网络请求。
const datasetFeatureCache = new Map<string, Promise<SuperMapFeature[]>>()

function datasetCacheKey(datasetName: string) {
  return `${datasourceName()}::${datasetName}`
}

async function fetchDatasetFeatures(datasetName: string) {
  const key = datasetCacheKey(datasetName)
  const cached = datasetFeatureCache.get(key)
  if (cached) return cached
  const promise = (async () => {
    const listUrl = `${dataServiceBase()}/data/datasources/${encodeURIComponent(datasourceName())}/datasets/${encodeURIComponent(datasetName)}/features.rjson?fromIndex=0&toIndex=999`
    const list = await fetchJson<SuperMapFeatureList>(listUrl)
    const childUrls = Array.isArray(list.childUriList) ? list.childUriList : []
    const features: SuperMapFeature[] = []
    // 路网有 93 条边。全量 Promise.all 会让远程 iServer 代理在首屏瞬间产生上百请求并返回 502；
    // 分批读取仍是同一原始数据集。路径主链路只读取道路数据，因此每批 6 条可兼顾稳定与响应时间。
    for (
      let index = 0;
      index < childUrls.length;
      index += ISERVER_FEATURE_BATCH_SIZE
    ) {
      const batchUrls = childUrls.slice(
        index,
        index + ISERVER_FEATURE_BATCH_SIZE,
      )
      const batch = await Promise.all(
        batchUrls.map((url) => fetchJson<SuperMapFeature>(proxiedUrl(url))),
      )
      features.push(...batch)
    }
    return features
  })()
  datasetFeatureCache.set(key, promise)
  // 请求失败时清除缓存，避免后续调用永久拿到 rejected promise。
  promise.catch(() => {
    if (datasetFeatureCache.get(key) === promise)
      datasetFeatureCache.delete(key)
  })
  return promise
}

function featureQueryResult(
  datasetName: string,
  feature: SuperMapFeature,
  distanceMeters?: number,
): SuperMapFeatureQueryResult {
  const fields = fieldsOf(feature)
  const smId = String(feature.ID ?? stringValue(fields, 'SMID', ''))
  return {
    datasetName,
    smId,
    id: stringValue(fields, 'ID', stringValue(fields, 'BUILDING_ID', smId)),
    fields,
    geometry: feature.geometry,
    distanceMeters,
  }
}

function fieldsOf(feature: SuperMapFeature): FeatureFields {
  const fields: FeatureFields = {}
  const names = feature.fieldNames || []
  const values = feature.fieldValues || []
  names.forEach((name, index) => {
    fields[String(name).toUpperCase()] =
      values[index] == null ? '' : String(values[index])
  })
  return fields
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function stringValue(fields: FeatureFields, name: string, fallback = '') {
  const value = fields[name.toUpperCase()]
  return value == null || value === '' ? fallback : String(value)
}

function booleanValue(fields: FeatureFields, name: string) {
  return /^(1|true|yes)$/i.test(stringValue(fields, name))
}

function geometryCenter(feature: SuperMapFeature) {
  const center = feature.geometry?.center || feature.geometry?.points?.[0] || {}
  return {
    x: numberValue(center.x),
    y: numberValue(center.y),
  }
}

function geometryBounds(feature: SuperMapFeature) {
  const points = feature.geometry?.points || []
  if (!points.length) {
    const center = geometryCenter(feature)
    return { x: center.x, y: center.y, w: 1, h: 1, cx: center.x, cy: center.y }
  }
  const xs = points.map((point) => numberValue(point.x))
  const ys = points.map((point) => numberValue(point.y))
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  }
}

function pointToBoundsDistance(
  point: { x: number; y: number },
  bounds: { x: number; y: number; w: number; h: number },
) {
  const dx = Math.max(bounds.x - point.x, 0, point.x - (bounds.x + bounds.w))
  const dy = Math.max(bounds.y - point.y, 0, point.y - (bounds.y + bounds.h))
  return Math.sqrt(dx * dx + dy * dy)
}

function pointToFeatureDistance(
  point: { x: number; y: number },
  feature: SuperMapFeature,
) {
  const bounds = geometryBounds(feature)
  if (bounds.w > 1 || bounds.h > 1) return pointToBoundsDistance(point, bounds)
  const center = geometryCenter(feature)
  return Math.hypot(point.x - center.x, point.y - center.y)
}

function roadRectFromLine(feature: SuperMapFeature): SuperMapRoadRect | null {
  const fields = fieldsOf(feature)
  const points = (feature.geometry?.points || []).map((point) => ({
    x: numberValue(point.x),
    y: numberValue(point.y),
  }))
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  const x1 = first.x
  const y1 = first.y
  const x2 = last.x
  const y2 = last.y
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
  const roadId = stringValue(
    fields,
    'ID',
    `supermap-road-${feature.ID ?? Math.random()}`,
  )
  if (horizontal) {
    const left = Math.min(x1, x2)
    const width = Math.max(1, Math.abs(x2 - x1))
    return {
      id: roadId,
      x: left,
      y: y1 - ROAD_RENDER_WIDTH / 2,
      w: width,
      h: ROAD_RENDER_WIDTH,
      points,
      main:
        booleanValue(fields, 'MAIN') ||
        /main/i.test(stringValue(fields, 'ROADID')),
      source: 'Park_RoadNetworkEdge_L',
    }
  }
  const top = Math.min(y1, y2)
  const height = Math.max(1, Math.abs(y2 - y1))
  return {
    id: roadId,
    x: x1 - ROAD_RENDER_WIDTH / 2,
    y: top,
    w: ROAD_RENDER_WIDTH,
    h: height,
    points,
    main:
      booleanValue(fields, 'MAIN') ||
      /main/i.test(stringValue(fields, 'ROADID')),
    source: 'Park_RoadNetworkEdge_L',
  }
}

function entranceFromFeature(
  feature: SuperMapFeature,
): SuperMapEntrance | null {
  const fields = fieldsOf(feature)
  const point = geometryCenter(feature)
  const kind = stringValue(fields, 'KIND', 'park')
  const edge = kind === 'park' ? inferParkEdge(point.x, point.y) : 'left'
  return {
    id: stringValue(
      fields,
      'ID',
      `supermap-entrance-${feature.ID ?? point.x}-${point.y}`,
    ),
    kind,
    edge,
    parentId: stringValue(fields, 'PARENTID') || undefined,
    x: point.x,
    y: point.y,
    label:
      kind === 'park'
        ? formatParkEntranceLabel(edge)
        : stringValue(fields, 'LABEL', '建筑出入口'),
    tooltipSide: kind === 'park' ? inferTooltipSide(point.x, point.y) : 'right',
    source: 'Park_EntrancePoint_P',
  }
}

function buildingFacilityFromFeature(feature: SuperMapFeature): MapFacility {
  const fields = fieldsOf(feature)
  const bounds = geometryBounds(feature)
  const id = stringValue(
    fields,
    'BUILDING_ID',
    `BLD_${feature.ID ?? Math.round(bounds.cx)}_${Math.round(bounds.cy)}`,
  )
  const type = normalizeFacilityType(stringValue(fields, 'TYPE', 'production'))
  const footprint = (feature.geometry?.points || []).map((point) => ({
    x: numberValue(point.x),
    y: numberValue(point.y),
  }))
  return {
    id,
    name: stringValue(fields, 'NAME', id),
    type,
    x: round2(bounds.x),
    y: round2(bounds.y),
    w: round2(bounds.w),
    h: round2(bounds.h),
    zone: stringValue(fields, 'ZONE_CODE', 'building'),
    status: stringValue(fields, 'STATUS', 'pending'),
    personnel: numberValue(stringValue(fields, 'PERSONNEL'), 0),
    hazardLevel: booleanValue(fields, 'IS_HAZARD') ? 0.75 : 0.35,
    desc: `SuperMap iServer 建筑单体数据；来源设施：${stringValue(fields, 'SOURCE_FACILITY_NAME', '待确认')}`,
    sourceFacilityId: stringValue(fields, 'SOURCE_FACILITY_ID'),
    footprint,
  } as MapFacility & {
    sourceFacilityId?: string
    footprint?: Array<{ x: number; y: number }>
  }
}

function buildingEntranceFromFacility(
  facility: MapFacility,
  roads: SuperMapRoadRect[],
): SuperMapEntrance {
  const spatialFacility = facility as MapFacility & {
    sourceFacilityId?: string
    footprint?: Array<{ x: number; y: number }>
  }
  const footprint = spatialFacility.footprint?.length
    ? spatialFacility.footprint
    : [
        { x: facility.x, y: facility.y },
        { x: facility.x + facility.w, y: facility.y },
        { x: facility.x + facility.w, y: facility.y + facility.h },
        { x: facility.x, y: facility.y + facility.h },
      ]
  const roadFacingPoint = nearestFacilityBoundaryPointToRoads(
    footprint,
    roads.map((road) => road.points),
  ) || { x: facility.x, y: facility.y + facility.h / 2 }
  const sourceFacilityId = String(spatialFacility.sourceFacilityId || '')
  return {
    id: `supermap-building-${facility.id}`,
    kind: 'building',
    edge: 'left',
    parentId: facility.id,
    sourceFacilityId,
    x: round2(roadFacingPoint.x),
    y: round2(roadFacingPoint.y),
    label: `${facility.name} 临路疏散点`,
    tooltipSide: 'right',
    source: 'Park_BuildingFootprint_R',
  }
}

function normalizeFacilityType(value: string) {
  if (
    [
      'office',
      'production',
      'utility',
      'warehouse',
      'treatment',
      'tank',
      'tower',
    ].includes(value)
  )
    return value
  if (/仓|库|物流/i.test(value)) return 'warehouse'
  if (/罐/i.test(value)) return 'tank'
  if (/塔/i.test(value)) return 'tower'
  if (/公用|辅助|消防/i.test(value)) return 'utility'
  return 'production'
}

function inferParkEdge(x: number, y: number) {
  const bounds = currentMapBounds()
  const leftDistance = Math.abs(x - bounds.left)
  const topDistance = Math.abs(y - bounds.top)
  const rightDistance = Math.abs(bounds.right - x)
  const bottomDistance = Math.abs(bounds.bottom - y)
  const minDistance = Math.min(
    leftDistance,
    topDistance,
    rightDistance,
    bottomDistance,
  )
  if (minDistance === leftDistance) return 'left'
  if (minDistance === topDistance) return 'top'
  if (minDistance === rightDistance) return 'right'
  return 'bottom'
}

function inferTooltipSide(x: number, y: number) {
  const edge = inferParkEdge(x, y)
  if (edge === 'left') return 'right'
  if (edge === 'right') return 'left'
  if (edge === 'top') return 'bottom'
  return 'top'
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y
  )
}

function cellRect(cell: { x: number; y: number; size?: number }) {
  const size = Math.max(1, numberValue(cell.size, 1))
  return {
    x: numberValue(cell.x) - size / 2,
    y: numberValue(cell.y) - size / 2,
    w: size,
    h: size,
  }
}

function isDangerCell(
  cell: { level?: string; concentration?: number },
  maxConcentration: number,
  dangerConcentrationRatio: number,
) {
  if (String(cell.level || '').toLowerCase() === 'danger') return true
  if (!maxConcentration) return false
  return (
    numberValue(cell.concentration) >=
    maxConcentration * dangerConcentrationRatio
  )
}

function isAffectedCell(cell: { level?: string; concentration?: number }) {
  const level = String(cell.level || '').toLowerCase()
  return (
    level === 'danger' ||
    level === 'warning' ||
    level === 'affected' ||
    numberValue(cell.concentration) > 0
  )
}

function facilityRect(facility: MapFacility) {
  return {
    x: numberValue(facility.x),
    y: numberValue(facility.y),
    w: Math.max(1, numberValue(facility.w, 1)),
    h: Math.max(1, numberValue(facility.h, 1)),
  }
}

function roadRect(road: SuperMapRoadRect) {
  return {
    x: numberValue(road.x),
    y: numberValue(road.y),
    w: Math.max(1, numberValue(road.w, 1)),
    h: Math.max(1, numberValue(road.h, 1)),
  }
}

function isCgcs2000Mode() {
  return (
    String(import.meta.env.VITE_SUPERMAP_COORD_SYS || '').toUpperCase() ===
      SUPERMAP_CGCS2000_COORD_SYS ||
    Number(import.meta.env.VITE_SUPERMAP_EPSG || 0) === SUPERMAP_CGCS2000_EPSG
  )
}

function currentCoordSys() {
  return String(
    import.meta.env.VITE_SUPERMAP_COORD_SYS || SUPERMAP_LOCAL_COORD_SYS,
  )
}

function currentMapBounds() {
  const defaults = isCgcs2000Mode() ? CGCS2000_MAP_BOUNDS : LOCAL_MAP_BOUNDS
  return {
    left: numberValue(import.meta.env.VITE_SUPERMAP_2D_LEFT, defaults.left),
    top: numberValue(import.meta.env.VITE_SUPERMAP_2D_TOP, defaults.top),
    right: numberValue(import.meta.env.VITE_SUPERMAP_2D_RIGHT, defaults.right),
    bottom: numberValue(
      import.meta.env.VITE_SUPERMAP_2D_BOTTOM,
      defaults.bottom,
    ),
  }
}

export async function loadSuperMapPlanningInputs(): Promise<SuperMapPlanningInputs> {
  const [roadFeatures, entranceFeatures, buildingFeatures] = await Promise.all([
    fetchDatasetFeatures(ROAD_EDGE_DATASET),
    fetchDatasetFeatures(ENTRANCE_DATASET),
    fetchDatasetFeatures(BUILDING_DATASET),
  ])
  const projectedRoads = roadFeatures
    .map(roadRectFromLine)
    .filter((road): road is SuperMapRoadRect => Boolean(road))
  const projectedEntrances = entranceFeatures
    .map(entranceFromFeature)
    .filter((entrance): entrance is SuperMapEntrance => Boolean(entrance))
  const projectedFacilities = buildingFeatures.map(buildingFacilityFromFeature)
  // iServer 网络数据发布在 D 锚点 EPSG:4547，而数字园区二维工作区及扩散网格统一使用
  // 0..1587 / 0..947 的 LOCALMAP 米制坐标。规划输入先逆变换到 LOCALMAP，
  // 请求 path.rjson 时再由 executor 正变换回 D 系，返回路径也同样逆变换。
  const roads = isCgcs2000Mode()
    ? projectedRoads.map(projectedRoadToLocal)
    : projectedRoads
  const entrances = isCgcs2000Mode()
    ? projectedEntrances.map(projectedEntranceToLocal)
    : projectedEntrances
  const parkEntrances = entrances.filter((entrance) => entrance.kind === 'park')
  const facilities = isCgcs2000Mode()
    ? projectedFacilities.map(projectedFacilityToLocal)
    : projectedFacilities
  const buildingEntrances = facilities.map((facility) =>
    buildingEntranceFromFacility(facility, roads),
  )
  const bounds = isCgcs2000Mode() ? LOCAL_MAP_BOUNDS : currentMapBounds()
  return {
    source: 'supermap-iserver-data',
    sourceLabel: `SuperMap iServer Data · ${currentCoordSys()} · ${roads.length} 条道路边 · ${buildingEntrances.length} 栋建筑`,
    roads,
    parkEntrances,
    buildingEntrances,
    facilities,
    facilityById: new Map(
      facilities.map((facility) => [facility.id, facility]),
    ),
    map: {
      coordSys: SUPERMAP_LOCAL_COORD_SYS,
      displayCoordSys: currentCoordSys(),
      networkCoordinateBridge: isCgcs2000Mode()
        ? 'LOCALMAP_TO_ISERVER_D'
        : undefined,
      epsg: numberValue(
        import.meta.env.VITE_SUPERMAP_EPSG,
        isCgcs2000Mode() ? SUPERMAP_CGCS2000_EPSG : -1000,
      ),
      mapMetersPerUnit: numberValue(
        import.meta.env.VITE_SUPERMAP_MAP_METERS_PER_UNIT,
        1,
      ),
      width: Math.abs(bounds.right - bounds.left),
      height: Math.abs(bounds.top - bounds.bottom),
      bounds,
      georeference: SUPERMAP_CGCS2000_TRANSFORM,
    },
  }
}

function projectedRoadToLocal(road: SuperMapRoadRect): SuperMapRoadRect {
  const points = road.points.map((point) => projectedToLocalD(point.x, point.y))
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    ...road,
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
    points,
  }
}

function projectedEntranceToLocal(
  entrance: SuperMapEntrance,
): SuperMapEntrance {
  const point = projectedToLocalD(entrance.x, entrance.y)
  return {
    ...entrance,
    x: point.x,
    y: point.y,
    edge:
      entrance.kind === 'park'
        ? inferParkEdge(point.x, point.y)
        : entrance.edge,
    tooltipSide:
      entrance.kind === 'park'
        ? inferTooltipSide(point.x, point.y)
        : entrance.tooltipSide,
  }
}

function projectedFacilityToLocal(facility: MapFacility): MapFacility {
  const upperLeft = projectedToLocalD(facility.x, facility.y + facility.h)
  const lowerRight = projectedToLocalD(facility.x + facility.w, facility.y)
  const spatialFacility = facility as MapFacility & {
    footprint?: Array<{ x: number; y: number }>
  }
  return {
    ...facility,
    x: Math.min(upperLeft.x, lowerRight.x),
    y: Math.min(upperLeft.y, lowerRight.y),
    w: Math.max(1, Math.abs(lowerRight.x - upperLeft.x)),
    h: Math.max(1, Math.abs(lowerRight.y - upperLeft.y)),
    footprint: spatialFacility.footprint?.map((point) =>
      projectedToLocalD(point.x, point.y),
    ),
  } as MapFacility & { footprint?: Array<{ x: number; y: number }> }
}

export async function loadSuperMapRoadNetwork(): Promise<SuperMapRoadRect[]> {
  const roadFeatures = await fetchDatasetFeatures(ROAD_EDGE_DATASET)
  const roads = roadFeatures
    .map(roadRectFromLine)
    .filter((road): road is SuperMapRoadRect => Boolean(road))
  if (!roads.length)
    throw new Error('iServer Park_RoadNetworkEdge_L 未返回可用道路边')
  return roads
}

export async function loadSuperMapParkEntrances(): Promise<SuperMapEntrance[]> {
  const entranceFeatures = await fetchDatasetFeatures(ENTRANCE_DATASET)
  const entrances = entranceFeatures
    .map(entranceFromFeature)
    .filter((entrance): entrance is SuperMapEntrance => Boolean(entrance))
  const parkEntrances = entrances.filter((entrance) => entrance.kind === 'park')
  if (!parkEntrances.length)
    throw new Error('iServer Park_EntrancePoint_P 未返回园区出入口')
  return parkEntrances
}

export async function querySuperMapFeatureById(
  datasetName: string,
  id: string | number,
): Promise<SuperMapFeatureQueryResult | null> {
  const target = String(id)
  const features = await fetchDatasetFeatures(datasetName)
  const matched = features.find((feature) => {
    const fields = fieldsOf(feature)
    return (
      String(feature.ID ?? '') === target ||
      stringValue(fields, 'SMID') === target ||
      stringValue(fields, 'ID') === target ||
      stringValue(fields, 'BUILDING_ID') === target
    )
  })
  return matched ? featureQueryResult(datasetName, matched) : null
}

export async function querySuperMapFeaturesAtPoint(
  query: SuperMapPointQuery,
): Promise<SuperMapFeatureQueryResult[]> {
  const point = { x: numberValue(query.x), y: numberValue(query.y) }
  const toleranceMeters = Math.max(0, numberValue(query.toleranceMeters, 5))
  const datasetNames = query.datasetNames?.length
    ? query.datasetNames
    : QUERY_DATASETS
  const results = await Promise.all(
    datasetNames.map(async (datasetName) => {
      const features = await fetchDatasetFeatures(datasetName)
      return features
        .map((feature) => {
          const distanceMeters = pointToFeatureDistance(point, feature)
          return { feature, distanceMeters }
        })
        .filter((item) => item.distanceMeters <= toleranceMeters)
        .map((item) =>
          featureQueryResult(
            datasetName,
            item.feature,
            round2(item.distanceMeters),
          ),
        )
    }),
  )
  return results
    .flat()
    .sort(
      (a, b) => numberValue(a.distanceMeters) - numberValue(b.distanceMeters),
    )
}

export function analyzeSuperMapDiffusionImpact(
  input: SuperMapDiffusionImpactInput,
): SuperMapDiffusionImpactResult {
  const cells = Array.isArray(input.frame?.cells) ? input.frame.cells : []
  const maxConcentration = Math.max(
    0,
    numberValue(input.frame?.maxConcentration),
  )
  const dangerConcentrationRatio = Math.min(
    1,
    Math.max(0.05, numberValue(input.dangerConcentrationRatio, 0.65)),
  )
  const affectedCells = cells.filter(isAffectedCell)
  const dangerCells = cells.filter((cell) =>
    isDangerCell(cell, maxConcentration, dangerConcentrationRatio),
  )
  const affectedRects = affectedCells.map((cell) => ({
    cell,
    rect: cellRect(cell),
  }))
  const dangerRects = dangerCells.map((cell) => ({
    cell,
    rect: cellRect(cell),
  }))

  const affectedFacilities = input.facilities.flatMap((facility) => {
    const rect = facilityRect(facility)
    const hits = affectedRects.filter((item) => rectsIntersect(rect, item.rect))
    if (!hits.length) return []
    const maxHit = hits.reduce(
      (best, item) =>
        numberValue(item.cell.concentration) >
        numberValue(best.cell.concentration)
          ? item
          : best,
      hits[0],
    )
    return [
      {
        id: facility.id,
        name: facility.name,
        maxLevel: String(maxHit.cell.level || 'affected'),
        maxConcentration: round2(numberValue(maxHit.cell.concentration)),
      },
    ]
  })

  const blockedRoads = input.roads.flatMap((road) => {
    const rect = roadRect(road)
    const hits = dangerRects.filter((item) => rectsIntersect(rect, item.rect))
    if (!hits.length) return []
    const maxConcentrationHit = hits.reduce(
      (max, item) => Math.max(max, numberValue(item.cell.concentration)),
      0,
    )
    return [
      {
        id: road.id,
        reason: 'diffusion-danger-overlay',
        maxConcentration: round2(maxConcentrationHit),
      },
    ]
  })

  const candidateExits = input.parkEntrances
    .map((entrance) => {
      const nearDanger = dangerRects.some(
        (item) =>
          Math.hypot(entrance.x - item.cell.x, entrance.y - item.cell.y) <=
          Math.max(25, numberValue(item.cell.size, 1) * 2),
      )
      const nearestDangerDistance = dangerRects.reduce(
        (min, item) =>
          Math.min(
            min,
            Math.hypot(entrance.x - item.cell.x, entrance.y - item.cell.y),
          ),
        Number.POSITIVE_INFINITY,
      )
      return {
        id: entrance.id,
        label: entrance.label,
        x: entrance.x,
        y: entrance.y,
        score: Number.isFinite(nearestDangerDistance)
          ? round2(nearestDangerDistance)
          : 999999,
        status: nearDanger
          ? ('risk-adjacent' as const)
          : ('candidate' as const),
      }
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'candidate' ? -1 : 1
      return b.score - a.score
    })

  return {
    executor: 'iclient2d-overlay',
    coordinateSystem: {
      coordSys: currentCoordSys(),
      epsg: numberValue(
        import.meta.env.VITE_SUPERMAP_EPSG,
        isCgcs2000Mode() ? SUPERMAP_CGCS2000_EPSG : -1000,
      ),
    },
    affectedFacilities,
    blockedRoads,
    candidateExits,
    summary: {
      affectedFacilityCount: affectedFacilities.length,
      blockedRoadCount: blockedRoads.length,
      candidateExitCount: candidateExits.filter(
        (exit) => exit.status === 'candidate',
      ).length,
      dangerCellCount: dangerCells.length,
      affectedCellCount: affectedCells.length,
    },
  }
}
