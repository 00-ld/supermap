import { computed, ref, type Ref } from 'vue'
import type { SmartMapRecord } from './useSmartMapInversion'

export interface SmartMapEvacuationDangerMask extends SmartMapRecord {
  blockedNodeCount?: number
  blockedEdgeCount?: number
}

export interface SmartMapEvacuationRoute extends SmartMapRecord {
  buildingId: string
  candidateId: string
  path?: Array<{ x: number; y: number }>
  distanceMeters: number
  estimatedTimeSec: number
  exitLabel?: string
  startLabel?: string
  startX?: number
  startY?: number
  isReachable?: boolean
  recommendedCandidateId?: string
  candidateRoutes?: SmartMapEvacuationRoute[]
  rank?: number
  peakConcentration?: number
  riskLevel?: string
  riskLevelText?: string
  selectionReason?: string
  message?: string
  planner?: string
  dangerMask?: SmartMapEvacuationDangerMask
}

export interface SmartMapEvacuationBatchResult extends SmartMapRecord {
  routesByBuilding?: SmartMapEvacuationRoute[]
  hasAnyReachable?: boolean
  reachableCount?: number
  totalBuildings?: number
  blockedCount?: number
  message?: string
}

export interface SmartMapEvacuationLayerState {
  getPlanningMode: () => string
  getDisplayMode: () => string
  getActiveRoute: () => SmartMapEvacuationRoute | null
  getBuildingRoutes: () => SmartMapEvacuationRoute[]
  getSelectedBuildingRoute: () => SmartMapEvacuationRoute | null
}

interface SmartMapEvacuationPlanningOptions {
  selectedFacility: Ref<{ id?: string | number } | null>
}

const EMPTY_EVACUATION_SUMMARY = {
  statusText: '暂无规划',
  startLabel: '--',
  exitLabel: '--',
  distanceText: '--',
  etaText: '--',
  riskText: '--',
  blockedText: '--',
  plannerText: '--',
}

function routeCandidates(route: SmartMapEvacuationRoute | null | undefined): SmartMapEvacuationRoute[] {
  if (!route?.isReachable) return []
  const candidates = Array.isArray(route.candidateRoutes) ? route.candidateRoutes : []
  return candidates.length ? candidates : [route]
}

function routeSummary(route: SmartMapEvacuationRoute | null | undefined) {
  if (!route) return EMPTY_EVACUATION_SUMMARY
  const dangerMask = route.dangerMask && typeof route.dangerMask === 'object' ? route.dangerMask : null
  const startX = Number(route.startX)
  const startY = Number(route.startY)
  const distanceMeters = Number(route.distanceMeters)
  const estimatedTimeSec = Number(route.estimatedTimeSec)
  return {
    statusText: route.isReachable ? '规划成功' : '规划失败',
    startLabel: route.startLabel || `(${Number.isFinite(startX) ? startX.toFixed(0) : '--'}, ${Number.isFinite(startY) ? startY.toFixed(0) : '--'})`,
    exitLabel: route.exitLabel || '未知',
    distanceText: Number.isFinite(distanceMeters) ? `${distanceMeters.toFixed(1)} m` : '--',
    etaText: Number.isFinite(estimatedTimeSec) ? `${estimatedTimeSec.toFixed(0)} s` : '--',
    riskText: route.riskLevelText || route.riskLevel || '--',
    blockedText: dangerMask
      ? `${Number(dangerMask.blockedNodeCount || 0)} 点 / ${Number(dangerMask.blockedEdgeCount || 0)} 段`
      : '无',
    plannerText: route.planner || 'D* Lite',
  }
}

export function useSmartMapEvacuationPlanning(options: SmartMapEvacuationPlanningOptions) {
  const evacuationPlan = ref<SmartMapEvacuationRoute | null>(null)
  const evacuationBatchResult = ref<SmartMapEvacuationBatchResult | null>(null)
  const evacuationPlanningMode = ref('single')
  const evacuationDisplayMode = ref('selected')
  const selectedEvacuationBuildingId = ref('')
  const selectedEvacuationCandidateId = ref('')
  const getSelectedFacilityId = () => String(options.selectedFacility.value?.id || '')

  const evacuationBuildingRoutes = computed<SmartMapEvacuationRoute[]>(() => (
    Array.isArray(evacuationBatchResult.value?.routesByBuilding)
      ? evacuationBatchResult.value.routesByBuilding
      : []
  ))
  const selectedEvacuationBuildingRoute = computed(() => {
    if (!evacuationBuildingRoutes.value.length) return null
    const selectedFacilityId = getSelectedFacilityId()
    return evacuationBuildingRoutes.value.find(route => route.buildingId === selectedEvacuationBuildingId.value)
      || evacuationBuildingRoutes.value.find(route => route.buildingId === selectedFacilityId)
      || evacuationBuildingRoutes.value.find(route => route.isReachable)
      || evacuationBuildingRoutes.value[0]
  })
  const baseEvacuationRoute = computed(() => (
    evacuationPlanningMode.value === 'all'
      ? selectedEvacuationBuildingRoute.value
      : evacuationPlan.value
  ))
  const evacuationCandidateRoutes = computed<SmartMapEvacuationRoute[]>(() => routeCandidates(baseEvacuationRoute.value))
  const evacuationRecommendedCandidateId = computed(() => (
    baseEvacuationRoute.value?.recommendedCandidateId || evacuationCandidateRoutes.value[0]?.candidateId || ''
  ))
  const selectedEvacuationCandidate = computed(() => {
    if (!baseEvacuationRoute.value?.isReachable) return null
    return evacuationCandidateRoutes.value.find(route => route.candidateId === selectedEvacuationCandidateId.value)
      || evacuationCandidateRoutes.value.find(route => route.candidateId === evacuationRecommendedCandidateId.value)
      || evacuationCandidateRoutes.value[0]
      || baseEvacuationRoute.value
  })
  const activeEvacuationRoute = computed(() => selectedEvacuationCandidate.value || baseEvacuationRoute.value)
  const evacuationSummary = computed(() => routeSummary(activeEvacuationRoute.value))

  const syncSelectedEvacuationCandidate = (
    routePlan: SmartMapEvacuationRoute | null | undefined,
    preferredCandidateId = '',
  ) => {
    const routes = routeCandidates(routePlan)
    if (!routes.length) {
      selectedEvacuationCandidateId.value = ''
      return
    }
    const nextSelectedRoute = routes.find(route => route.candidateId === preferredCandidateId)
      || routes.find(route => route.candidateId === routePlan?.recommendedCandidateId)
      || routes[0]
    selectedEvacuationCandidateId.value = String(nextSelectedRoute?.candidateId || '')
  }

  const syncSelectedEvacuationBuilding = (
    batchResult: SmartMapEvacuationBatchResult | null | undefined,
    preferredBuildingId = '',
  ) => {
    const routes = Array.isArray(batchResult?.routesByBuilding) ? batchResult.routesByBuilding : []
    if (!routes.length) {
      selectedEvacuationBuildingId.value = ''
      return null
    }
    const nextSelectedBuilding = routes.find(route => route.buildingId === preferredBuildingId)
      || routes.find(route => route.buildingId === getSelectedFacilityId())
      || routes.find(route => route.isReachable)
      || routes[0]
    selectedEvacuationBuildingId.value = String(nextSelectedBuilding?.buildingId || '')
    return nextSelectedBuilding || null
  }

  const selectEvacuationCandidate = (candidateId: string) => {
    const candidate = evacuationCandidateRoutes.value.find(route => route.candidateId === candidateId)
    if (!candidate) return false
    selectedEvacuationCandidateId.value = String(candidate.candidateId || '')
    return true
  }

  const selectEvacuationBuilding = (buildingId: string) => {
    const buildingRoute = evacuationBuildingRoutes.value.find(route => route.buildingId === buildingId)
    if (!buildingRoute) return null
    evacuationPlanningMode.value = 'all'
    selectedEvacuationBuildingId.value = String(buildingRoute.buildingId || '')
    syncSelectedEvacuationCandidate(buildingRoute)
    return buildingRoute
  }

  const clearEvacuationPlanningState = () => {
    evacuationPlan.value = null
    evacuationBatchResult.value = null
    evacuationPlanningMode.value = 'single'
    evacuationDisplayMode.value = 'selected'
    selectedEvacuationBuildingId.value = ''
    selectedEvacuationCandidateId.value = ''
  }

  const evacuationLayerState: SmartMapEvacuationLayerState = {
    getPlanningMode: () => evacuationPlanningMode.value,
    getDisplayMode: () => evacuationDisplayMode.value,
    getActiveRoute: () => activeEvacuationRoute.value,
    getBuildingRoutes: () => evacuationBuildingRoutes.value,
    getSelectedBuildingRoute: () => selectedEvacuationBuildingRoute.value,
  }

  return {
    activeEvacuationRoute,
    baseEvacuationRoute,
    clearEvacuationPlanningState,
    evacuationBatchResult,
    evacuationBuildingRoutes,
    evacuationCandidateRoutes,
    evacuationDisplayMode,
    evacuationLayerState,
    evacuationPlan,
    evacuationPlanningMode,
    evacuationRecommendedCandidateId,
    evacuationSummary,
    selectEvacuationBuilding,
    selectEvacuationCandidate,
    selectedEvacuationBuildingId,
    selectedEvacuationBuildingRoute,
    selectedEvacuationCandidate,
    selectedEvacuationCandidateId,
    syncSelectedEvacuationBuilding,
    syncSelectedEvacuationCandidate,
  }
}
