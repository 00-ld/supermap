import { computed, ref } from 'vue'
import type {
  SmartMapCoarseSearchResult,
  SmartMapCoarseSummary,
  SmartMapObservationPayload,
  SmartMapObservationSummary,
  SmartMapRecord,
  SmartMapRefinementInput,
  SmartMapSourceInversionResult,
} from './useSmartMapInversion'
import { buildParticleFilterHistoryIterations as buildSmartMapParticleFilterHistoryIterations } from './useSmartMapInversion'
import type {
  SmartMapEstimatedSource,
  SmartMapSourceCandidateRegion,
  SmartMapSourceRefinementIteration,
} from './useSmartMapSourceInversionOverlay'

interface SmartMapSourceWorkflowStateOptions {
  candidateRadius: unknown
}

function toRecord<T extends object>(value: T | null | undefined): SmartMapRecord | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  const record: SmartMapRecord = {}
  Object.entries(value).forEach(([key, entryValue]) => {
    record[key] = entryValue
  })
  return record
}

function formatCandidateLabel(candidate: SmartMapSourceCandidateRegion | null | undefined) {
  if (!candidate) return '--'
  if (candidate.label) return candidate.label
  if (candidate.candidateId === 'simulation_sensor_calibrated') return '监控点校准搜索区'
  if (candidate.candidateId === 'sensor_direct_projection') return '监控点反推初始区'
  return candidate.candidateId || '--'
}

export interface SmartMapSourceWorkflowLayerState {
  getCoarseCandidateRegions: () => SmartMapSourceCandidateRegion[]
  getSelectedCoarseCandidateId: () => string
  getEstimatedSource: () => SmartMapEstimatedSource | null | undefined
}

export function useSmartMapSourceWorkflowState(options: SmartMapSourceWorkflowStateOptions) {
  const observationPayload = ref<SmartMapObservationPayload | null>(null)
  const observationSummary = ref<SmartMapObservationSummary | null>(null)
  const coarseSearchResult = ref<SmartMapCoarseSearchResult | null>(null)
  const coarseSearchSummary = ref<SmartMapCoarseSummary | null>(null)
  const selectedCoarseCandidateId = ref('')
  const refinementInput = ref<SmartMapRefinementInput | null>(null)
  const refinementResult = ref<SmartMapSourceInversionResult | null>(null)
  const refinementSummary = ref<SmartMapRecord | null>(null)

  const observationPayloadPreview = computed(() => {
    if (!observationPayload.value) return ''
    return JSON.stringify(observationPayload.value, null, 2).slice(0, 1400)
  })
  const coarseCandidateRegions = computed<SmartMapSourceCandidateRegion[]>(() => (
    coarseSearchResult.value?.candidateRegions || []
  ) as SmartMapSourceCandidateRegion[])
  const selectedCoarseCandidate = computed(() => (
    coarseCandidateRegions.value.find(candidate => candidate.candidateId === selectedCoarseCandidateId.value) || null
  ))
  const isDeepParticleResult = computed(() =>
    refinementResult.value?.stage === 'python_deep_surrogate_particle_filter'
    || refinementResult.value?.stage === 'python_improved_particle_filter'
  )
  const refinementIterations = computed<SmartMapSourceRefinementIteration[]>(() => {
    if (refinementResult.value?.iterations?.length) {
      return refinementResult.value.iterations as SmartMapSourceRefinementIteration[]
    }
    if (refinementResult.value?.history?.length) {
      return buildSmartMapParticleFilterHistoryIterations(
        refinementResult.value as SmartMapRecord,
        toRecord(selectedCoarseCandidate.value),
        options.candidateRadius,
      )
    }
    return []
  })
  const refinementInputSummary = computed(() => {
    if (!refinementInput.value) return null
    return {
      candidateLabel: formatCandidateLabel(refinementInput.value.coarseCandidate),
      activeSensorCount: refinementInput.value.activeSensors?.length || 0,
      animationSteps: refinementInput.value.refinementConfig?.animationSteps || 0,
    }
  })

  const sourceWorkflowLayerState: SmartMapSourceWorkflowLayerState = {
    getCoarseCandidateRegions: () => coarseCandidateRegions.value,
    getSelectedCoarseCandidateId: () => selectedCoarseCandidateId.value,
    getEstimatedSource: () => refinementResult.value?.estimatedSource,
  }

  return {
    coarseCandidateRegions,
    coarseSearchResult,
    coarseSearchSummary,
    isDeepParticleResult,
    observationPayload,
    observationPayloadPreview,
    observationSummary,
    refinementInput,
    refinementInputSummary,
    refinementIterations,
    refinementResult,
    refinementSummary,
    selectedCoarseCandidate,
    selectedCoarseCandidateId,
    sourceWorkflowLayerState,
  }
}
