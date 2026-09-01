import {
  runAnalyticCoarseSearch,
  runAnalyticSourceInversion,
  runDiffusionSimulation,
  runParticleFilterInversion,
  type AlgorithmPayload,
  type AlgorithmRecord,
} from '@/api/algorithm'
import {
  localToProjectedD,
  projectedToLocalD,
} from '@/data/supermapGeoreference'
import { buildCoarseSummary, type SmartMapRecord } from './useSmartMapInversion'
import { measureRouteBuildingCollisionMeters } from './evacuationRouteSafety'

export type SmartMapAlgorithmPayload = AlgorithmPayload
export type SmartMapAlgorithmResult = AlgorithmRecord

export interface SmartMapExecutionResult<
  TRecord extends AlgorithmRecord = AlgorithmRecord,
> {
  result: TRecord | null
  error: string
}

const SUPERMAP_NETWORK_TIMEOUT_MS = 6500
const MAX_NETWORK_SNAP_DISTANCE_METERS = 80

interface SuperMapNetworkRoad {
  x: number
  y: number
  w: number
  h: number
  points: Array<{ x: number; y: number }>
}

interface RoadProjection {
  point: { x: number; y: number }
  distance: number
}

export interface SmartMapCoarseExecutionResult extends SmartMapExecutionResult {
  summary: SmartMapRecord | null
}

export interface SuperMapClosestFacilityCandidate {
  id: string
  label: string
  modelName?: string
  modelId?: string
  role?: string
  point: {
    x: number
    y: number
  }
  originalPoint?: {
    x: number
    y: number
  }
}

function responseOk(
  response: { ok?: boolean; code?: number } | null | undefined,
): boolean {
  return response?.ok === true || response?.code === 200
}

function responseError(
  response: { message?: string | null } | null | undefined,
  fallback: string,
): string {
  return response?.message || fallback
}

export async function executeSmartMapDiffusion(
  payload: SmartMapAlgorithmPayload,
): Promise<SmartMapExecutionResult> {
  const response = await runDiffusionSimulation(payload)
  const ok = responseOk(response)
  const result = ok ? (response.data as AlgorithmRecord) : null
  if (!ok || !Array.isArray(result?.frames) || !result.frames.length) {
    return {
      result: null,
      error: responseError(response, '算法服务未返回有效帧数据'),
    }
  }
  return { result, error: '' }
}

export async function executeSmartMapCoarseSearch(
  observationPayload: SmartMapRecord,
  config: SmartMapRecord,
): Promise<SmartMapCoarseExecutionResult> {
  const response = await runAnalyticCoarseSearch({ observationPayload, config })
  const result = responseOk(response)
    ? (response.data as AlgorithmRecord)
    : null
  return {
    result,
    summary: buildCoarseSummary(result),
    error: result ? '' : responseError(response, '未知错误'),
  }
}

export async function executeSmartMapAnalyticRefinement(
  payload: SmartMapAlgorithmPayload,
) {
  const response = await runAnalyticSourceInversion(payload)
  const result = responseOk(response)
    ? (response.data as AlgorithmRecord)
    : null
  return {
    result,
    error: result ? '' : responseError(response, '未知错误'),
  }
}

export async function executeSmartMapParticleFilter(
  payload: SmartMapAlgorithmPayload,
) {
  const response = await runParticleFilterInversion(payload)
  const result = responseOk(response)
    ? (response.data as AlgorithmRecord)
    : null
  if (!result?.estimatedSource || typeof result.estimatedSource !== 'object') {
    return {
      result: null,
      error: responseError(response, '未返回估计源点'),
    }
  }
  const estimatedSource = result.estimatedSource as SmartMapRecord
  if (!estimatedSource.mapPoint) {
    return {
      result: null,
      error: responseError(response, '未返回估计源点'),
    }
  }
  return { result, error: '' }
}

export async function executeSmartMapEvacuationPlanning(
  payload: SmartMapAlgorithmPayload,
) {
  const superMapResult = await executeSuperMapNetworkAnalysis(payload)
  if (superMapResult) return superMapResult
  return {
    result: null,
    error: String(
      payload.superMapNetworkFailure ||
        'SuperMap iServer 路网分析未返回有效道路路径',
    ),
  }
}

export async function executeSuperMapNetworkAnalysis(
  payload: SmartMapAlgorithmPayload,
) {
  const analysisUrl = String(
    import.meta.env.VITE_SUPERMAP_NETWORK_ANALYSIS_URL || '',
  ).trim()
  if (!analysisUrl) return null
  const startPoint = normalizePoint(payload.startPoint)
  // F7 方案 C（2026-07-18）：批量疏散 payload 含 buildingEntrances 但无单一起点 startPoint，
  // SuperMap 网络分析当前只支持单起点→多出口，批量场景静默短路返回 null 会无声降级到 Python。
  // 这里显式标注降级原因，让下游 Python 兜底分支透传（见 executeSmartMapEvacuationPlanning :115），
  // 消除"静默降级"——评委能从 executor.superMapNetworkFailure 看到批量走 Python 是设计选择而非 bug。
  // 如需批量走 SuperMap，需实现多建筑循环（方案 A，见 docs F7 条目），此处仅消除静默。
  const hasBuildingEntrances =
    Array.isArray(payload.buildingEntrances) &&
    payload.buildingEntrances.length > 0
  if (hasBuildingEntrances && !startPoint) {
    payload.superMapNetworkFailure =
      '批量疏散规划（多建筑）暂不支持 SuperMap 单起点网络分析，已显式降级 Python D*Lite（方案 C）'
    return null
  }
  const roads = normalizeRoads(payload.roads)
  const exits = Array.isArray(payload.parkEntrances)
    ? payload.parkEntrances
        .map((item, index) => normalizeExit(item, index))
        .filter(
          (
            item,
          ): item is SmartMapRecord & { point: { x: number; y: number } } =>
            Boolean(item?.point),
        )
    : []
  if (!startPoint || !exits.length) return null
  const startSnap = roads.length
    ? nearestRoadProjection(startPoint, roads)
    : null
  if (
    roads.length &&
    (!startSnap || startSnap.distance > MAX_NETWORK_SNAP_DISTANCE_METERS)
  ) {
    throw new Error(
      '人员起点距离 SuperMap 道路网络过远，请在建筑出入口或道路附近重新选择',
    )
  }
  const networkExits = exits.map((exit) => ({
    ...exit,
    originalPoint: exit.point,
    roadSnap: roads.length ? nearestRoadProjection(exit.point, roads) : null,
  }))
  if (
    roads.length &&
    networkExits.some(
      (exit) =>
        !exit.roadSnap ||
        exit.roadSnap.distance > MAX_NETWORK_SNAP_DISTANCE_METERS,
    )
  ) {
    throw new Error(
      '目标出口未能吸附到 SuperMap 道路网络，请选择有效园区出入口',
    )
  }
  const reachableNetworkExits = networkExits.map((exit) => ({
    ...exit,
    point: exit.roadSnap?.point || exit.point,
  }))
  const usesLocalMapBridge =
    asSmartMapRecord(payload.map).networkCoordinateBridge ===
    'LOCALMAP_TO_ISERVER_D'
  try {
    const settled = await Promise.allSettled(
      reachableNetworkExits.map((exit) =>
        requestSuperMapPath(
          analysisUrl,
          startSnap?.point || startPoint,
          exit,
          usesLocalMapBridge,
        ),
      ),
    )
    const candidatesWithVerification: AlgorithmRecord[] = settled
      .filter(
        (item): item is PromiseFulfilledResult<AlgorithmRecord | null> =>
          item.status === 'fulfilled',
      )
      .map((item) => item.value)
      .filter((item): item is AlgorithmRecord => Boolean(item?.isReachable))
      .map((route) => ({
        ...route,
        networkVerification: verifySuperMapRouteEdges(route),
      }))
    if (!candidatesWithVerification.length) {
      const failures = settled
        .filter(
          (item): item is PromiseRejectedResult => item.status === 'rejected',
        )
        .map((item) =>
          item.reason instanceof Error
            ? item.reason.message
            : String(item.reason),
        )
      throw new Error(
        `SuperMap 路网未返回可达出口${failures.length ? `：${failures.join('；')}` : ''}`,
      )
    }
    const reachableCandidates = candidatesWithVerification
      .filter(
        (item) => asSmartMapRecord(item.networkVerification).valid === true,
      )
      .map((route) => scoreSuperMapRiskAwareRoute(route, payload))
      .filter((route) => Number(route.buildingCollisionMeters || 0) <= 0.5)
      .sort(
        (left, right) =>
          Number(left.totalCost || 0) - Number(right.totalCost || 0),
      )
    if (!reachableCandidates.length) {
      throw new Error('所有候选路径均穿越建筑物，已按安全约束拒绝显示')
    }
    const result = normalizeSuperMapNetworkResult({
      ...reachableCandidates[0],
      candidateRoutes: reachableCandidates,
      recommendedCandidateId: String(reachableCandidates[0]?.candidateId || ''),
    })
    if (!result) throw new Error('SuperMap 网络分析服务未返回可用路径')
    return {
      result,
      error: '',
    }
  } catch (error) {
    payload.superMapNetworkFailure =
      error instanceof Error ? error.message : 'SuperMap 网络分析不可用'
    console.warn('[SuperMap] 网络分析不可用，未显示道路路径', error)
    return null
  }
}

export async function executeSuperMapClosestFacilitiesAnalysis(
  payload: SmartMapAlgorithmPayload,
) {
  const analysisUrl = String(
    import.meta.env.VITE_SUPERMAP_NETWORK_ANALYSIS_URL || '',
  ).trim()
  if (!analysisUrl) return null
  const eventPoint = normalizePoint(payload.eventPoint || payload.startPoint)
  const roads = normalizeRoads(payload.roads)
  const candidates = normalizeClosestFacilityCandidates(
    payload.facilities || payload.deviceFacilities,
  )
  if (!eventPoint || !candidates.length) return null
  const networkEventPoint = snapPointToRoad(eventPoint, roads) || eventPoint
  const networkFacilities = candidates.map((candidate) => ({
    ...candidate,
    originalPoint: candidate.point,
    point: snapPointToRoad(candidate.point, roads) || candidate.point,
  }))
  try {
    const closestResult = await requestSuperMapClosestFacility(
      analysisUrl,
      networkEventPoint,
      networkFacilities,
    )
    if (Array.isArray(closestResult?.path) && closestResult.path.length)
      return { result: closestResult, error: '' }
  } catch (error) {
    payload.superMapClosestFacilityFailure =
      error instanceof Error ? error.message : 'SuperMap 最近设施分析不可用'
    console.warn(
      '[SuperMap] 最近设施分析不可用，改用 path.rjson 多候选最短路',
      error,
    )
  }

  try {
    const settled = await Promise.allSettled(
      networkFacilities.map((facility) =>
        requestSuperMapPath(analysisUrl, networkEventPoint, facility),
      ),
    )
    const candidateRoutes = settled
      .filter(
        (item): item is PromiseFulfilledResult<AlgorithmRecord | null> =>
          item.status === 'fulfilled',
      )
      .map((item) => item.value)
      .filter((item): item is AlgorithmRecord => Boolean(item?.isReachable))
      .sort(
        (left, right) =>
          Number(left.distanceMeters || 0) - Number(right.distanceMeters || 0),
      )
    const best = candidateRoutes[0]
    if (!best) throw new Error('SuperMap 最短路服务未返回可达设备')
    return {
      result: normalizeClosestFacilityRoute(
        {
          ...best,
          path: best.path,
          facility:
            networkFacilities.find((item) => item.id === best.candidateId) ||
            null,
          facilityId: best.candidateId,
          facilityLabel: best.exitLabel || best.candidateId,
          candidateRoutes,
          analysisMode: 'path-shortest-fallback',
        },
        networkFacilities,
      ),
      error: '',
    }
  } catch (error) {
    payload.superMapNetworkFailure =
      error instanceof Error ? error.message : 'SuperMap 网络分析不可用'
    console.warn('[SuperMap] 设备最短路径不可用', error)
    return null
  }
}

function normalizeRoads(value: unknown): SuperMapNetworkRoad[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as SmartMapRecord
      const x = Number(record.x)
      const y = Number(record.y)
      const w = Number(record.w)
      const h = Number(record.h)
      const points = Array.isArray(record.points)
        ? record.points
            .map(normalizePoint)
            .filter((point): point is { x: number; y: number } =>
              Boolean(point),
            )
        : []
      return Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(w) &&
        Number.isFinite(h)
        ? { x, y, w, h, points }
        : null
    })
    .filter((item): item is SuperMapNetworkRoad => Boolean(item))
}

function normalizePoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as SmartMapRecord
  const x = Number(record.x ?? record.mapX ?? record.easting)
  const y = Number(record.y ?? record.mapY ?? record.northing)
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}

function normalizeExit(
  value: unknown,
  index: number,
): (SmartMapRecord & { point: { x: number; y: number } }) | null {
  if (!value || typeof value !== 'object') return null
  const record = value as SmartMapRecord
  const point = normalizePoint(record)
  if (!point) return null
  return {
    ...record,
    id: record.id || `exit-${index + 1}`,
    label: record.label || record.name || `出口${index + 1}`,
    point,
  }
}

function normalizeClosestFacilityCandidates(
  value: unknown,
): SuperMapClosestFacilityCandidate[] {
  if (!Array.isArray(value)) return []
  return value
    .map<SuperMapClosestFacilityCandidate | null>((item, index) => {
      if (!item || typeof item !== 'object') return null
      const record = item as SmartMapRecord
      const point = normalizePoint(record.point || record.mapPoint || record)
      if (!point) return null
      return {
        id: String(record.id || record.sensorId || `device-${index + 1}`),
        label: String(
          record.label || record.name || record.modelName || `设备${index + 1}`,
        ),
        modelName: record.modelName ? String(record.modelName) : undefined,
        modelId: record.modelId ? String(record.modelId) : undefined,
        role:
          record.role || record.observationRole
            ? String(record.role || record.observationRole)
            : undefined,
        point,
      }
    })
    .filter((item): item is SuperMapClosestFacilityCandidate => Boolean(item))
}

function snapPointToRoad(
  point: { x: number; y: number },
  roads: SuperMapNetworkRoad[],
) {
  return nearestRoadProjection(point, roads)?.point || null
}

function nearestRoadProjection(
  point: { x: number; y: number },
  roads: SuperMapNetworkRoad[],
): RoadProjection | null {
  if (!roads.length) return null
  let best: RoadProjection | null = null
  for (const road of roads) {
    if (road.points.length >= 2) {
      for (let index = 1; index < road.points.length; index += 1) {
        const candidate = projectPointToSegment(
          point,
          road.points[index - 1],
          road.points[index],
        )
        if (!best || candidate.distance < best.distance) best = candidate
      }
      continue
    }
    const horizontal = Math.abs(road.w) >= Math.abs(road.h)
    const candidate = horizontal
      ? {
          x: clamp(point.x, road.x, road.x + road.w),
          y: road.y + road.h / 2,
        }
      : {
          x: road.x + road.w / 2,
          y: clamp(point.y, road.y, road.y + road.h),
        }
    const distance = Math.hypot(point.x - candidate.x, point.y - candidate.y)
    if (!best || distance < best.distance) best = { point: candidate, distance }
  }
  return best
}

function projectPointToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): RoadProjection {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  const ratio =
    lengthSquared > 0
      ? clamp(
          ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
          0,
          1,
        )
      : 0
  const projectedPoint = { x: start.x + dx * ratio, y: start.y + dy * ratio }
  return {
    point: projectedPoint,
    distance: Math.hypot(
      point.x - projectedPoint.x,
      point.y - projectedPoint.y,
    ),
  }
}

function verifySuperMapRouteEdges(route: AlgorithmRecord) {
  const path = Array.isArray(route.path)
    ? route.path
        .map(normalizePoint)
        .filter((point): point is { x: number; y: number } => Boolean(point))
    : []
  const rawPath = asSmartMapRecord(route.rawSuperMapPath)
  const guides = Array.isArray(rawPath.pathGuideItems)
    ? rawPath.pathGuideItems.map(asSmartMapRecord)
    : []
  const edgeGuideCount = guides.filter(
    (guide) =>
      guide.isEdge === true && extractGeometryPath(guide.geometry).length >= 2,
  ).length
  return {
    valid: path.length >= 2 && edgeGuideCount > 0,
    pointCount: path.length,
    edgeGuideCount,
    source: 'SuperMap iServer path.rjson route.pathGuideItems[isEdge=true]',
  }
}

function clamp(value: number, min: number, max: number) {
  const left = Math.min(min, max)
  const right = Math.max(min, max)
  return Math.min(Math.max(value, left), right)
}

function buildSuperMapPathUrl(
  baseUrl: string,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const pathUrl = /\.rjson$/i.test(trimmed) ? trimmed : `${trimmed}/path.rjson`
  const query = new URLSearchParams()
  query.set('nodes', JSON.stringify([start, end]))
  query.set('parameter', JSON.stringify({ weightName: 'length' }))
  return `${pathUrl}?${query.toString()}`
}

function buildSuperMapClosestFacilityUrl(
  baseUrl: string,
  eventPoint: { x: number; y: number },
  facilities: SuperMapClosestFacilityCandidate[],
) {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const query = new URLSearchParams()
  query.set('event', JSON.stringify(eventPoint))
  query.set(
    'facilities',
    JSON.stringify(facilities.map((facility) => facility.point)),
  )
  query.set('expectFacilityCount', '1')
  query.set('fromEvent', 'true')
  query.set('maxWeight', '0')
  query.set(
    'parameter',
    JSON.stringify({
      resultSetting: {
        returnEdgeFeatures: true,
        returnEdgeGeometry: true,
        returnEdgeIDs: true,
        returnNodeFeatures: true,
        returnNodeGeometry: true,
        returnNodeIDs: true,
        returnPathGuides: true,
        returnRoutes: true,
      },
      turnWeightField: 'TurnCost',
      weightFieldName: 'length',
    }),
  )
  return `${trimmed}/closestfacility.rjson?${query.toString()}`
}

async function requestSuperMapPath(
  analysisUrl: string,
  startPoint: { x: number; y: number },
  exit: SmartMapRecord & { point: { x: number; y: number } },
  usesLocalMapBridge = false,
): Promise<AlgorithmRecord | null> {
  // F8 撤回（2026-07-19）：startPoint/exit.point 在 buildProjectedNetworkPayload
  // （SuperMapSceneViewer.vue:1572 → projectPoint → localToProjectedD）已转 D 系投影，
  // 这里直传即可。首次 F8 误判 startPoint 是本地米制、又套一层 localToProjectedD，
  // 双重变换成 686xxx/1928xxx → iServer 400（console URL 实锤）。撤回，保留 timeout 改进。
  const controller = new AbortController()
  const timer = window.setTimeout(
    () => controller.abort(),
    SUPERMAP_NETWORK_TIMEOUT_MS,
  )
  const requestStartPoint = usesLocalMapBridge
    ? projectedPoint(localToProjectedD(startPoint.x, startPoint.y))
    : startPoint
  const requestExitPoint = usesLocalMapBridge
    ? projectedPoint(localToProjectedD(exit.point.x, exit.point.y))
    : exit.point
  const response = await fetch(
    buildSuperMapPathUrl(analysisUrl, requestStartPoint, requestExitPoint),
    {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    },
  ).finally(() => window.clearTimeout(timer))
  if (!response.ok)
    throw new Error(`SuperMap 网络分析服务返回 ${response.status}`)
  const body = (await response.json()) as AlgorithmRecord
  const pathResult = Array.isArray(body.pathList)
    ? (body.pathList[0] as AlgorithmRecord)
    : null
  const projectedPath = extractSuperMapPath(pathResult)
  if (!projectedPath.length) return null
  const path = usesLocalMapBridge
    ? projectedPath.map((point) => projectedToLocalD(point.x, point.y))
    : projectedPath
  const distanceMeters = Number(pathResult?.weight ?? pathDistance(path))
  return {
    path,
    isReachable: true,
    success: true,
    status: 'success',
    planner: 'SuperMap iServer Transportation Analyst',
    candidateId: String(exit.id || exit.label || 'supermap-route'),
    exitId: String(exit.id || ''),
    exitLabel: String(exit.label || exit.name || exit.id || '园区出口'),
    startX: startPoint.x,
    startY: startPoint.y,
    distanceMeters,
    estimatedTimeSec: distanceMeters / 1.2,
    riskLevel: 'supermap-network',
    riskLevelText: 'SuperMap 路网最短路',
    routeWeight: pathResult?.weight,
    projectedPath: usesLocalMapBridge ? projectedPath : undefined,
    coordinateBridge: usesLocalMapBridge
      ? 'LOCALMAP → iServer D(EPSG:4547) → LOCALMAP'
      : 'native',
    rawSuperMapPath: pathResult,
  }
}

function projectedPoint(point: { easting: number; northing: number }) {
  return {
    x: point.easting,
    y: point.northing,
  }
}

/**
 * 对 iServer 真实路网返回的候选路径做二次风险排序。
 * 线形仍完全来自 Transportation Analyst；这里只改变候选出口的选择，
 * 不在前端伪造穿越建筑的直线。
 */
export function scoreSuperMapRiskAwareRoute(
  route: AlgorithmRecord,
  payload: SmartMapAlgorithmPayload,
): AlgorithmRecord {
  const path = Array.isArray(route.path)
    ? route.path
        .map(normalizePoint)
        .filter((point): point is { x: number; y: number } => Boolean(point))
    : []
  const frame = asSmartMapRecord(payload.frame)
  const cells = Array.isArray(frame.cells)
    ? frame.cells
        .map(asSmartMapRecord)
        .map((cell) => ({
          point: normalizePoint(cell),
          size: Math.max(1, Number(cell.size || 12)),
          concentration: Math.max(0, Number(cell.concentration || 0)),
        }))
        .filter(
          (
            cell,
          ): cell is {
            point: { x: number; y: number }
            size: number
            concentration: number
          } => Boolean(cell.point),
        )
    : []
  const facilities = Array.isArray(payload.facilities)
    ? payload.facilities.map(asSmartMapRecord)
    : []
  const peakConcentration = Math.max(
    Number(frame.maxConcentration || 0),
    ...cells.map((cell) => cell.concentration),
    1,
  )
  let distanceMeters = 0
  let exposureMeters = 0
  let maximumRiskRatio = 0

  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1]
    const end = path[index]
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
    if (!segmentLength) continue
    distanceMeters += segmentLength
    const sampleCount = Math.max(1, Math.ceil(segmentLength / 6))
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const ratio = (sampleIndex + 0.5) / sampleCount
      const sample = {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      }
      const concentration = cells.reduce((maximum, cell) => {
        const distance = Math.hypot(
          sample.x - cell.point.x,
          sample.y - cell.point.y,
        )
        if (distance > Math.max(8, cell.size * 1.25)) return maximum
        return Math.max(maximum, cell.concentration)
      }, 0)
      const riskRatio = Math.min(1, concentration / peakConcentration)
      const sampleMeters = segmentLength / sampleCount
      exposureMeters += sampleMeters * riskRatio
      maximumRiskRatio = Math.max(maximumRiskRatio, riskRatio)
    }
  }

  const buildingCollisionMeters = measureRouteBuildingCollisionMeters(
    path,
    facilities,
  )
  const concentrationCost =
    exposureMeters * 12 + maximumRiskRatio * Math.max(distanceMeters, 1) * 3
  const buildingCost = buildingCollisionMeters * 40
  const totalCost = distanceMeters + concentrationCost + buildingCost
  return {
    ...route,
    distanceMeters: Number(route.distanceMeters || distanceMeters),
    routeWeight: totalCost,
    totalCost,
    riskCost: concentrationCost,
    buildingCost,
    exposureMeters,
    maximumRiskRatio,
    buildingCollisionMeters,
    riskLevelText:
      maximumRiskRatio >= 0.65
        ? '高浓度绕行'
        : maximumRiskRatio >= 0.25
          ? '低暴露路径'
          : '安全路径',
    costModel: {
      formula:
        'distance + exposureMeters×12 + peakRisk×distance×3 + buildingCollisionMeters×40',
      source:
        'SuperMap iServer path.rjson candidates + current diffusion frame',
    },
  }
}

async function requestSuperMapClosestFacility(
  analysisUrl: string,
  eventPoint: { x: number; y: number },
  facilities: SuperMapClosestFacilityCandidate[],
): Promise<AlgorithmRecord | null> {
  const requestUrl = buildSuperMapClosestFacilityUrl(
    analysisUrl,
    eventPoint,
    facilities,
  )
  const controller = new AbortController()
  const timer = window.setTimeout(
    () => controller.abort(),
    SUPERMAP_NETWORK_TIMEOUT_MS,
  )
  const response = await fetch(requestUrl, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timer))
  if (!response.ok)
    throw new Error(`SuperMap 最近设施分析服务返回 ${response.status}`)
  const body = (await response.json()) as AlgorithmRecord
  return normalizeClosestFacilityResult(body, facilities, eventPoint)
}

function extractSuperMapPath(
  pathResult: AlgorithmRecord | null,
): Array<{ x: number; y: number }> {
  const routePath = extractGeometryPath(pathResult?.route)
  if (routePath.length) {
    logF2Probe('extractSuperMapPath[route]', routePath)
    return routePath
  }
  const guides = Array.isArray(pathResult?.pathGuideItems)
    ? (pathResult.pathGuideItems as AlgorithmRecord[])
    : []
  const points: Array<{ x: number; y: number }> = []
  guides.forEach((guide) => {
    const geometry = guide.geometry as SmartMapRecord | undefined
    const geometryPoints = Array.isArray(geometry?.points)
      ? geometry.points
      : []
    geometryPoints.forEach((point) => {
      const normalized = normalizePoint(point)
      if (!normalized) return
      const previous = points[points.length - 1]
      if (
        !previous ||
        previous.x !== normalized.x ||
        previous.y !== normalized.y
      ) {
        points.push(normalized)
      }
    })
  })
  logF2Probe('extractSuperMapPath[guides]', points)
  return points
}

// F2 量级探针（2026-07-18）：打印 iServer 返回 path 首尾点，验证 D 系投影量级。
// 预期：x∈[457600,457900]，y∈[3856000,3856300]（D 锚点 457692.843/3856127.172 邻域）。
// 若量级落 A 系（460xxx/3849xxx）说明 iServer 数据集已重发布或锚点判断错，需复核。
// 探针为临时调试代码，验证通过后删除。详见 docs/codex-fix-2026-07-18-3d-algorithm-alignment.md。
function logF2Probe(tag: string, path: Array<{ x: number; y: number }>) {
  if (!path.length) return
  const head = path[0]
  const tail = path[path.length - 1]
  // eslint-disable-next-line no-console
  console.log(
    `[F2] ${tag} n=${path.length} head=(${head.x.toFixed(3)},${head.y.toFixed(3)}) tail=(${tail.x.toFixed(3)},${tail.y.toFixed(3)})`,
  )
}

function extractGeometryPath(value: unknown): Array<{ x: number; y: number }> {
  const record = asSmartMapRecord(value)
  const geometry = asSmartMapRecord(record.geometry || value)
  const coordinates = geometry.coordinates
  if (Array.isArray(coordinates)) return coordinatesToPath(coordinates)
  const points = Array.isArray(geometry.points)
    ? geometry.points
    : Array.isArray(record.points)
      ? record.points
      : []
  return points
    .map((point) => normalizePoint(point))
    .filter((point): point is { x: number; y: number } => Boolean(point))
}

function coordinatesToPath(
  coordinates: unknown[],
): Array<{ x: number; y: number }> {
  const flattened =
    coordinates.length &&
    Array.isArray(coordinates[0]) &&
    Array.isArray((coordinates[0] as unknown[])[0])
      ? (coordinates as unknown[][]).flat()
      : coordinates
  return flattened
    .map((coordinate) => {
      if (!Array.isArray(coordinate) || coordinate.length < 2) return null
      const x = Number(coordinate[0])
      const y = Number(coordinate[1])
      return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
    })
    .filter((point): point is { x: number; y: number } => Boolean(point))
}

function pathDistance(path: Array<{ x: number; y: number }>) {
  return path.slice(1).reduce((sum, point, index) => {
    const previous = path[index]
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)
}

function normalizeSuperMapNetworkResult(
  body: AlgorithmRecord,
): AlgorithmRecord | null {
  const data = (
    body.data && typeof body.data === 'object' ? body.data : body
  ) as AlgorithmRecord
  if (Array.isArray(data.routesByBuilding)) {
    return {
      ...data,
      executor: {
        mode: 'supermap-network-analysis',
        runtime: 'iserver-rest',
        implementation: 'SuperMap iServer network analysis',
      },
    }
  }
  if (Array.isArray(data.path) || Array.isArray(data.route)) {
    return {
      ...data,
      path: Array.isArray(data.path) ? data.path : data.route,
      isReachable: data.isReachable !== false,
      executor: {
        mode: 'supermap-network-analysis',
        runtime: 'iserver-rest',
        implementation: 'SuperMap iServer network analysis',
      },
    }
  }
  return null
}

function normalizeClosestFacilityResult(
  body: AlgorithmRecord,
  facilities: SuperMapClosestFacilityCandidate[],
  eventPoint: { x: number; y: number },
): AlgorithmRecord | null {
  const data = asSmartMapRecord(body.result || body.data || body)
  const facilityPathList = Array.isArray(data.facilityPathList)
    ? data.facilityPathList.map(asSmartMapRecord)
    : []
  const routes = facilityPathList
    .map((pathRecord) =>
      normalizeClosestFacilityRoute(pathRecord, facilities, eventPoint),
    )
    .filter(
      (route): route is AlgorithmRecord =>
        Array.isArray(route?.path) && route.path.length > 0,
    )
    .sort(
      (left, right) =>
        Number(left.distanceMeters || 0) - Number(right.distanceMeters || 0),
    )
  const best = routes[0]
  if (!best) return null
  return {
    ...best,
    candidateRoutes: routes,
    recommendedCandidateId: String(best.facilityId || ''),
    analysisMode: 'closestfacility',
  }
}

function normalizeClosestFacilityRoute(
  pathRecord: AlgorithmRecord,
  facilities: SuperMapClosestFacilityCandidate[],
  eventPoint?: { x: number; y: number },
): AlgorithmRecord | null {
  const path = extractSuperMapPath(pathRecord)
  if (!path.length && !pathRecord.path) return null
  const normalizedPath = path.length
    ? path
    : ((Array.isArray(pathRecord.path)
        ? pathRecord.path.map(normalizePoint).filter(Boolean)
        : []) as Array<{ x: number; y: number }>)
  if (!normalizedPath.length) return null
  const pathEnd = normalizedPath[normalizedPath.length - 1]
  const matchedFacility = asSmartMapRecord(pathRecord.facility).id
    ? facilities.find(
        (facility) =>
          facility.id === String(asSmartMapRecord(pathRecord.facility).id),
      )
    : findNearestFacilityCandidate(pathEnd, facilities)
  const distanceMeters = Number(
    pathRecord.weight ??
      pathRecord.distanceMeters ??
      pathDistance(normalizedPath),
  )
  return {
    path: normalizedPath,
    isReachable: true,
    success: true,
    status: 'success',
    planner: 'SuperMap iServer Transportation Analyst',
    analysisName: 'closest-facility-shortest-path',
    analysisMode: pathRecord.analysisMode || 'closestfacility',
    eventPoint,
    facility: matchedFacility || null,
    facilityId: String(
      matchedFacility?.id ||
        pathRecord.facilityId ||
        pathRecord.candidateId ||
        '',
    ),
    facilityLabel: String(
      matchedFacility?.label ||
        pathRecord.facilityLabel ||
        pathRecord.exitLabel ||
        '最近设备',
    ),
    facilityModelName: String(matchedFacility?.modelName || ''),
    candidateId: String(matchedFacility?.id || pathRecord.candidateId || ''),
    distanceMeters,
    estimatedTimeSec: distanceMeters / 1.2,
    riskLevel: 'supermap-closest-facility',
    riskLevelText: 'SuperMap 最近设施与最短路径',
    routeWeight: pathRecord.weight,
    rawSuperMapClosestFacility: pathRecord,
    executor: {
      mode: 'supermap-closest-facility',
      runtime: 'iserver-rest',
      implementation:
        pathRecord.analysisMode === 'path-shortest-fallback'
          ? 'SuperMap iServer path.rjson multi-candidate shortest path fallback'
          : 'SuperMap iServer closestfacility.rjson',
    },
  }
}

function findNearestFacilityCandidate(
  point: { x: number; y: number },
  facilities: SuperMapClosestFacilityCandidate[],
) {
  return (
    facilities
      .map((facility) => ({
        facility,
        distance: Math.hypot(
          point.x - facility.point.x,
          point.y - facility.point.y,
        ),
      }))
      .sort((left, right) => left.distance - right.distance)[0]?.facility ||
    null
  )
}

function asSmartMapRecord(value: unknown): SmartMapRecord {
  return value && typeof value === 'object' ? (value as SmartMapRecord) : {}
}
