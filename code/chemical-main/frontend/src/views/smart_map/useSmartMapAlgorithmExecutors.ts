import {
  runAnalyticCoarseSearch,
  runAnalyticSourceInversion,
  runDiffusionSimulation,
  runEvacuationPlanning,
  runParticleFilterInversion,
  type AlgorithmPayload,
  type AlgorithmRecord,
} from '@/api/algorithm'
import { buildCoarseSummary, type SmartMapRecord } from './useSmartMapInversion'

export type SmartMapAlgorithmPayload = AlgorithmPayload
export type SmartMapAlgorithmResult = AlgorithmRecord

export interface SmartMapExecutionResult<TRecord extends AlgorithmRecord = AlgorithmRecord> {
  result: TRecord | null
  error: string
}

export interface SmartMapCoarseExecutionResult extends SmartMapExecutionResult {
  summary: SmartMapRecord | null
}

function responseOk(response: { ok?: boolean; code?: number } | null | undefined): boolean {
  return response?.ok === true || response?.code === 200
}

function responseError(response: { message?: string | null } | null | undefined, fallback: string): string {
  return response?.message || fallback
}

export async function executeSmartMapDiffusion(payload: SmartMapAlgorithmPayload): Promise<SmartMapExecutionResult> {
  const response = await runDiffusionSimulation(payload)
  const ok = responseOk(response)
  const result = ok ? response.data as AlgorithmRecord : null
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
  const result = responseOk(response) ? response.data as AlgorithmRecord : null
  return {
    result,
    summary: buildCoarseSummary(result),
    error: result ? '' : responseError(response, '未知错误'),
  }
}

export async function executeSmartMapAnalyticRefinement(payload: SmartMapAlgorithmPayload) {
  const response = await runAnalyticSourceInversion(payload)
  const result = responseOk(response) ? response.data as AlgorithmRecord : null
  return {
    result,
    error: result ? '' : responseError(response, '未知错误'),
  }
}

export async function executeSmartMapParticleFilter(payload: SmartMapAlgorithmPayload) {
  const response = await runParticleFilterInversion(payload)
  const result = responseOk(response) ? response.data as AlgorithmRecord : null
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

export async function executeSmartMapEvacuationPlanning(payload: SmartMapAlgorithmPayload) {
  const superMapResult = await executeSuperMapNetworkAnalysis(payload)
  if (superMapResult) return superMapResult
  const response = await runEvacuationPlanning(payload)
  return {
    result: responseOk(response) ? response.data as AlgorithmRecord : null,
    error: responseError(response, '算法服务异常'),
  }
}

async function executeSuperMapNetworkAnalysis(payload: SmartMapAlgorithmPayload) {
  const analysisUrl = String(import.meta.env.VITE_SUPERMAP_NETWORK_ANALYSIS_URL || '').trim()
  if (!analysisUrl) return null
  const startPoint = normalizePoint(payload.startPoint)
  const roads = normalizeRoads(payload.roads)
  const exits = Array.isArray(payload.parkEntrances)
    ? payload.parkEntrances
      .map((item, index) => normalizeExit(item, index))
      .filter((item): item is SmartMapRecord & { point: { x: number; y: number } } => Boolean(item?.point))
    : []
  if (!startPoint || !exits.length) return null
  const networkStartPoint = snapPointToRoad(startPoint, roads) || startPoint
  const networkExits = exits.map(exit => ({
    ...exit,
    originalPoint: exit.point,
    point: snapPointToRoad(exit.point, roads) || exit.point,
  }))
  try {
    const settled = await Promise.allSettled(
      networkExits.map(exit => requestSuperMapPath(analysisUrl, networkStartPoint, exit)),
    )
    const candidates = settled
      .filter((item): item is PromiseFulfilledResult<AlgorithmRecord | null> => item.status === 'fulfilled')
      .map(item => item.value)
    const reachableCandidates = candidates
      .filter((item): item is AlgorithmRecord => Boolean(item?.isReachable))
      .sort((left, right) => Number(left.distanceMeters || 0) - Number(right.distanceMeters || 0))
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
    console.warn('[SuperMap] 网络分析不可用，降级到 Python 动态危险避让算法', error)
    return null
  }
}

function normalizeRoads(value: unknown): Array<{ x: number; y: number; w: number; h: number }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as SmartMapRecord
      const x = Number(record.x)
      const y = Number(record.y)
      const w = Number(record.w)
      const h = Number(record.h)
      return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(w) && Number.isFinite(h)
        ? { x, y, w, h }
        : null
    })
    .filter((item): item is { x: number; y: number; w: number; h: number } => Boolean(item))
}

function normalizePoint(value: unknown): { x: number; y: number } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as SmartMapRecord
  const x = Number(record.x ?? record.mapX ?? record.easting)
  const y = Number(record.y ?? record.mapY ?? record.northing)
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}

function normalizeExit(value: unknown, index: number): (SmartMapRecord & { point: { x: number; y: number } }) | null {
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

function snapPointToRoad(
  point: { x: number; y: number },
  roads: Array<{ x: number; y: number; w: number; h: number }>,
) {
  if (!roads.length) return null
  let best: { point: { x: number; y: number }; distance: number } | null = null
  for (const road of roads) {
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
  return best?.point || null
}

function clamp(value: number, min: number, max: number) {
  const left = Math.min(min, max)
  const right = Math.max(min, max)
  return Math.min(Math.max(value, left), right)
}

function buildSuperMapPathUrl(baseUrl: string, start: { x: number; y: number }, end: { x: number; y: number }) {
  const trimmed = baseUrl.replace(/\/+$/, '')
  const pathUrl = /\.rjson$/i.test(trimmed) ? trimmed : `${trimmed}/path.rjson`
  const query = new URLSearchParams()
  query.set('nodes', JSON.stringify([start, end]))
  query.set('parameter', JSON.stringify({ weightName: 'length' }))
  return `${pathUrl}?${query.toString()}`
}

async function requestSuperMapPath(
  analysisUrl: string,
  startPoint: { x: number; y: number },
  exit: SmartMapRecord & { point: { x: number; y: number } },
): Promise<AlgorithmRecord | null> {
  const response = await fetch(buildSuperMapPathUrl(analysisUrl, startPoint, exit.point), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`SuperMap 网络分析服务返回 ${response.status}`)
  const body = await response.json() as AlgorithmRecord
  const pathResult = Array.isArray(body.pathList) ? body.pathList[0] as AlgorithmRecord : null
  const path = extractSuperMapPath(pathResult)
  if (!path.length) return null
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
    rawSuperMapPath: pathResult,
  }
}

function extractSuperMapPath(pathResult: AlgorithmRecord | null): Array<{ x: number; y: number }> {
  const guides = Array.isArray(pathResult?.pathGuideItems) ? pathResult.pathGuideItems as AlgorithmRecord[] : []
  const points: Array<{ x: number; y: number }> = []
  guides.forEach((guide) => {
    const geometry = guide.geometry as SmartMapRecord | undefined
    const geometryPoints = Array.isArray(geometry?.points) ? geometry.points : []
    geometryPoints.forEach((point) => {
      const normalized = normalizePoint(point)
      if (!normalized) return
      const previous = points[points.length - 1]
      if (!previous || previous.x !== normalized.x || previous.y !== normalized.y) {
        points.push(normalized)
      }
    })
  })
  return points
}

function pathDistance(path: Array<{ x: number; y: number }>) {
  return path.slice(1).reduce((sum, point, index) => {
    const previous = path[index]
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)
}

function normalizeSuperMapNetworkResult(body: AlgorithmRecord): AlgorithmRecord | null {
  const data = (body.data && typeof body.data === 'object' ? body.data : body) as AlgorithmRecord
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
