import type { Ref } from 'vue'
import {
  executeSmartMapEvacuationPlanning,
  type SmartMapAlgorithmPayload,
} from './useSmartMapAlgorithmExecutors'
import { analyzeSuperMapDiffusionImpact } from './useSuperMapIserverData'
import type {
  SmartMapEvacuationBatchResult,
  SmartMapEvacuationRoute,
} from './useSmartMapEvacuationPlanning'
import { getErrorMessage } from './useSmartMapUi'

export interface SmartMapEvacuationRunOptions {
  silent?: boolean
  preferredCandidateId?: string
  preferredBuildingId?: string
  displayMode?: string
}

interface SmartMapEvacuationFacilityLike {
  id: string
}

interface SmartMapEvacuationEntranceLike {
  parentId?: string
  sourceFacilityId?: string
  x: number
  y: number
  label: string
}

interface SmartMapEvacuationDiffusionMetaLike {
  gas: unknown | null
  blockedMask?: unknown
}

interface SmartMapEvacuationPlanningInputs<TFacility, TEntrance> {
  roads: readonly unknown[]
  parkEntrances: readonly unknown[]
  buildingEntrances: readonly TEntrance[]
  facilities: readonly TFacility[]
  facilityById?: Map<string, TFacility>
  map?: Record<string, unknown>
  sourceLabel?: string
  usesSuperMapData?: boolean
}

interface SmartMapEvacuationPlanningActionsOptions<
  TFacility extends SmartMapEvacuationFacilityLike,
  TEntrance extends SmartMapEvacuationEntranceLike,
  TFrame,
> {
  selectedFacility: Ref<TFacility | null>
  currentDiffusionFrame: Ref<TFrame | null>
  diffusionMeta: Ref<SmartMapEvacuationDiffusionMetaLike>
  evacuationPlan: Ref<SmartMapEvacuationRoute | null>
  evacuationBatchResult: Ref<SmartMapEvacuationBatchResult | null>
  evacuationPlanningMode: Ref<string>
  evacuationDisplayMode: Ref<string>
  selectedEvacuationBuildingId: Ref<string>
  selectedEvacuationCandidateId: Ref<string>
  evacuationBuildingRoutes: Ref<SmartMapEvacuationRoute[]>
  buildingEntrances: readonly TEntrance[]
  facilityById: Map<string, TFacility>
  roads: readonly unknown[]
  parkEntrances: readonly unknown[]
  facilities: readonly TFacility[]
  getPlanningInputs?: () => SmartMapEvacuationPlanningInputs<
    TFacility,
    TEntrance
  >
  syncSelectedEvacuationCandidateState: (
    routePlan: SmartMapEvacuationRoute | null | undefined,
    preferredCandidateId?: string,
  ) => void
  syncSelectedEvacuationBuildingState: (
    batchResult: SmartMapEvacuationBatchResult | null | undefined,
    preferredBuildingId?: string,
  ) => SmartMapEvacuationRoute | null
  selectEvacuationCandidateState: (candidateId: string) => boolean
  selectEvacuationBuildingState: (
    buildingId: string,
  ) => SmartMapEvacuationRoute | null
  clearEvacuationPlanningState: () => void
  render: () => void
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void
}

function createEvacuationPayload(
  payload: SmartMapAlgorithmPayload,
): SmartMapAlgorithmPayload {
  return payload
}

function normalizeEvacuationRoute(
  record: SmartMapAlgorithmPayload | null,
): SmartMapEvacuationRoute | null {
  if (!record) return null
  const route = record as SmartMapEvacuationRoute
  const candidateRoutes = Array.isArray(route.candidateRoutes)
    ? route.candidateRoutes
        .map((candidate) => normalizeEvacuationRoute(candidate))
        .filter((item) => item !== null)
    : undefined
  return {
    ...route,
    isReachable: route.isReachable === true,
    candidateRoutes,
  }
}

function normalizeEvacuationBatch(
  record: SmartMapAlgorithmPayload | null,
): SmartMapEvacuationBatchResult | null {
  if (!record) return null
  const batch = record as SmartMapEvacuationBatchResult
  const routesByBuilding = Array.isArray(batch.routesByBuilding)
    ? batch.routesByBuilding
        .map((route) => normalizeEvacuationRoute(route))
        .filter((item) => item !== null)
    : undefined
  const reachableCount = Number(
    batch.reachableCount ??
      routesByBuilding?.filter((route) => route.isReachable).length ??
      0,
  )
  return {
    ...batch,
    routesByBuilding,
    hasAnyReachable: batch.hasAnyReachable === true || reachableCount > 0,
    reachableCount,
  }
}

export function useSmartMapEvacuationPlanningActions<
  TFacility extends SmartMapEvacuationFacilityLike,
  TEntrance extends SmartMapEvacuationEntranceLike,
  TFrame,
>(
  options: SmartMapEvacuationPlanningActionsOptions<
    TFacility,
    TEntrance,
    TFrame
  >,
) {
  function resolveEvacuationStart() {
    if (!options.selectedFacility.value) {
      return {
        valid: false,
        message: '请先选择一个带人员疏散需求的建筑',
        point: null,
        label: '--',
      }
    }
    const selected = options.selectedFacility.value
    const planningInputs = resolvePlanningInputs()
    const entrance = planningInputs.buildingEntrances.find(
      (item) =>
        item.parentId === selected?.id ||
        item.sourceFacilityId === selected?.id,
    )
    if (!entrance) {
      return {
        valid: false,
        message:
          '当前选择的设施没有可用建筑出入口，请检查 SuperMap 建筑单体数据或选择办公楼、厂房、仓库、公用工程建筑',
        point: null,
        label: '--',
      }
    }
    return {
      valid: true,
      message: '',
      point: { x: entrance.x, y: entrance.y },
      label: entrance.label,
    }
  }

  function syncSelectedEvacuationCandidate(
    routePlan: SmartMapEvacuationRoute | null | undefined,
    preferredCandidateId = '',
  ) {
    options.syncSelectedEvacuationCandidateState(
      routePlan,
      preferredCandidateId,
    )
  }

  function syncSelectedEvacuationBuilding(
    batchResult: SmartMapEvacuationBatchResult | null | undefined,
    preferredBuildingId = '',
  ) {
    return options.syncSelectedEvacuationBuildingState(
      batchResult,
      preferredBuildingId,
    )
  }

  function selectEvacuationCandidate(candidateId: string) {
    if (!options.selectEvacuationCandidateState(candidateId)) return
    options.render()
  }

  function selectEvacuationBuilding(buildingId: string, syncFacility = false) {
    const buildingRoute = options.selectEvacuationBuildingState(buildingId)
    if (!buildingRoute) return
    if (syncFacility) {
      const facility = options.facilityById.get(buildingId)
      if (facility) options.selectedFacility.value = facility
    }
    options.render()
  }

  function clearEvacuationPlanning(silent = false) {
    options.clearEvacuationPlanningState()
    options.render()
    if (!silent) options.showToast('已清除逃生路径', 'warn')
  }

  function clearEvacuationPlanningSilently() {
    clearEvacuationPlanning(true)
  }

  function resetSinglePlanningSelection() {
    options.evacuationPlan.value = null
    options.evacuationBatchResult.value = null
    options.evacuationPlanningMode.value = 'single'
    options.selectedEvacuationCandidateId.value = ''
  }

  function resolvePlanningInputs(): SmartMapEvacuationPlanningInputs<
    TFacility,
    TEntrance
  > {
    return (
      options.getPlanningInputs?.() || {
        roads: options.roads,
        parkEntrances: options.parkEntrances,
        buildingEntrances: options.buildingEntrances,
        facilities: options.facilities,
        facilityById: options.facilityById,
        sourceLabel: '前端静态数据兜底',
        usesSuperMapData: false,
      }
    )
  }

  function warnIfFallback(
    planningInputs: SmartMapEvacuationPlanningInputs<TFacility, TEntrance>,
    silent?: boolean,
  ) {
    if (silent || planningInputs.usesSuperMapData) return
    options.showToast(
      '当前 iServer Data 未就绪，疏散规划暂用前端静态数据兜底',
      'warn',
    )
  }

  function buildSuperMapSpatialImpact(
    planningInputs: SmartMapEvacuationPlanningInputs<TFacility, TEntrance>,
  ) {
    if (
      !planningInputs.usesSuperMapData ||
      !options.currentDiffusionFrame.value
    )
      return null
    return analyzeSuperMapDiffusionImpact({
      frame: options.currentDiffusionFrame.value as Parameters<
        typeof analyzeSuperMapDiffusionImpact
      >[0]['frame'],
      roads: planningInputs.roads as Parameters<
        typeof analyzeSuperMapDiffusionImpact
      >[0]['roads'],
      facilities: planningInputs.facilities as unknown as Parameters<
        typeof analyzeSuperMapDiffusionImpact
      >[0]['facilities'],
      parkEntrances: planningInputs.parkEntrances as Parameters<
        typeof analyzeSuperMapDiffusionImpact
      >[0]['parkEntrances'],
    })
  }

  function runEvacuationPlanning(
    runOptions: SmartMapEvacuationRunOptions = {},
  ) {
    const preferredCandidateId =
      runOptions.preferredCandidateId ||
      options.selectedEvacuationCandidateId.value
    const planningInputs = resolvePlanningInputs()
    const start = resolveEvacuationStart()
    if (!start.valid) {
      if (!runOptions.silent) options.showToast(start.message, 'warn')
      resetSinglePlanningSelection()
      options.render()
      return
    }
    if (
      !options.currentDiffusionFrame.value ||
      !options.diffusionMeta.value.gas
    ) {
      if (!runOptions.silent)
        options.showToast('请先生成扩散动画后再执行逃生规划', 'warn')
      resetSinglePlanningSelection()
      options.render()
      return
    }

    executeSmartMapEvacuationPlanning(
      createEvacuationPayload({
        roads: planningInputs.roads,
        parkEntrances: planningInputs.parkEntrances,
        facilities: planningInputs.facilities,
        startPoint: start.point,
        startLabel: start.label,
        frame: options.currentDiffusionFrame.value,
        gas: options.diffusionMeta.value.gas,
        blockedMask: options.diffusionMeta.value.blockedMask,
        superMapSpatialImpact: buildSuperMapSpatialImpact(planningInputs),
        map: planningInputs.map,
        gisProvider: 'supermap-preferred',
        gisDataSource: planningInputs.sourceLabel,
        executorPreference: 'supermap-network-analysis-first',
      }),
    )
      .then(({ result: evacuationResult }) => {
        const result = normalizeEvacuationRoute(evacuationResult)
        options.evacuationPlanningMode.value = 'single'
        options.evacuationPlan.value = result
        options.evacuationBatchResult.value = null
        options.selectedEvacuationBuildingId.value =
          options.selectedFacility.value?.id || ''
        syncSelectedEvacuationCandidate(result, preferredCandidateId)
        options.render()

        if (runOptions.silent) return
        if (!result?.isReachable) {
          options.showToast(result?.message || '未找到可用逃生路径', 'warn')
          return
        }
        warnIfFallback(planningInputs, runOptions.silent)
        options.showToast(`已规划至 ${result.exitLabel} 的逃生路径`, 'success')
      })
      .catch((error: unknown) => {
        options.evacuationPlan.value = null
        options.evacuationBatchResult.value = null
        options.selectedEvacuationCandidateId.value = ''
        options.render()
        if (!runOptions.silent) {
          options.showToast(
            `逃生规划失败: ${getErrorMessage(error, '算法服务异常')}`,
            'error',
          )
        }
      })
  }

  function runBatchEvacuationPlanning(
    runOptions: SmartMapEvacuationRunOptions = {},
  ) {
    const planningInputs = resolvePlanningInputs()
    const preferredBuildingId =
      runOptions.preferredBuildingId ||
      options.selectedEvacuationBuildingId.value ||
      options.selectedFacility.value?.id ||
      ''
    const preferredCandidateId =
      runOptions.preferredCandidateId ||
      options.selectedEvacuationCandidateId.value
    if (
      !options.currentDiffusionFrame.value ||
      !options.diffusionMeta.value.gas
    ) {
      if (!runOptions.silent)
        options.showToast('请先生成扩散动画后再执行批量逃生规划', 'warn')
      options.evacuationBatchResult.value = null
      options.evacuationPlan.value = null
      options.selectedEvacuationBuildingId.value = ''
      options.selectedEvacuationCandidateId.value = ''
      options.render()
      return
    }

    executeSmartMapEvacuationPlanning(
      createEvacuationPayload({
        roads: planningInputs.roads,
        buildingEntrances: planningInputs.buildingEntrances,
        parkEntrances: planningInputs.parkEntrances,
        facilities: planningInputs.facilities,
        frame: options.currentDiffusionFrame.value,
        gas: options.diffusionMeta.value.gas,
        blockedMask: options.diffusionMeta.value.blockedMask,
        superMapSpatialImpact: buildSuperMapSpatialImpact(planningInputs),
        map: planningInputs.map,
        gisProvider: 'supermap-preferred',
        gisDataSource: planningInputs.sourceLabel,
        executorPreference: 'supermap-network-analysis-first',
      }),
    )
      .then(({ result: evacuationResult }) => {
        const result = normalizeEvacuationBatch(evacuationResult)
        options.evacuationPlanningMode.value = 'all'
        options.evacuationDisplayMode.value =
          runOptions.displayMode || options.evacuationDisplayMode.value
        options.evacuationPlan.value = null
        options.evacuationBatchResult.value = result
        const nextBuildingRoute = syncSelectedEvacuationBuilding(
          result,
          preferredBuildingId,
        )
        syncSelectedEvacuationCandidate(nextBuildingRoute, preferredCandidateId)
        options.render()

        if (runOptions.silent) return
        if (!result?.hasAnyReachable) {
          options.showToast(
            result?.message || '当前帧所有建筑均无安全逃生路径',
            'warn',
          )
          return
        }
        warnIfFallback(planningInputs, runOptions.silent)
        options.showToast(
          `已生成 ${result.reachableCount} 栋建筑的逃生路径，阻断 ${result.blockedCount} 栋`,
          'success',
        )
      })
      .catch((error: unknown) => {
        options.evacuationBatchResult.value = null
        options.evacuationPlan.value = null
        options.selectedEvacuationBuildingId.value = ''
        options.selectedEvacuationCandidateId.value = ''
        options.render()
        if (!runOptions.silent) {
          options.showToast(
            `批量逃生规划失败: ${getErrorMessage(error, '算法服务异常')}`,
            'error',
          )
        }
      })
  }

  function syncSelectedFacilityToEvacuationPlan(
    nextId: string | undefined,
    previousId: string | undefined,
  ) {
    if (nextId === previousId) return
    if (
      options.evacuationPlanningMode.value === 'all' &&
      options.evacuationBuildingRoutes.value.length
    ) {
      const nextRoute = options.evacuationBuildingRoutes.value.find(
        (route) => route.buildingId === nextId,
      )
      if (nextRoute) {
        options.selectedEvacuationBuildingId.value = nextRoute.buildingId
        syncSelectedEvacuationCandidate(
          nextRoute,
          nextRoute.recommendedCandidateId,
        )
        options.render()
        return
      }
    }
    if (options.evacuationPlan.value || options.evacuationBatchResult.value)
      clearEvacuationPlanning(true)
  }

  function rerunEvacuationAfterDiffusion() {
    if (options.evacuationBatchResult.value?.routesByBuilding?.length) {
      runBatchEvacuationPlanning({ silent: true })
    } else if (options.evacuationPlan.value?.isReachable) {
      runEvacuationPlanning({ silent: true })
    }
  }

  return {
    clearEvacuationPlanning,
    clearEvacuationPlanningSilently,
    rerunEvacuationAfterDiffusion,
    runBatchEvacuationPlanning,
    runEvacuationPlanning,
    selectEvacuationBuilding,
    selectEvacuationCandidate,
    syncSelectedEvacuationCandidate,
    syncSelectedEvacuationBuilding,
    syncSelectedFacilityToEvacuationPlan,
  }
}
