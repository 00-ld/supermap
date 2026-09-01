import { computed, reactive, ref } from 'vue'
import {
  PHASE1_DEFAULT_SCENARIO,
  PHASE1_GASES,
  getGasById,
  getPhase1LeakSources,
} from '@/data/phase1Config'
import type { SmartMapDiffusionFrame } from './useSmartMapDiffusionLayer'
import type {
  SmartMapDiffusionMeta,
  SmartMapGas as SmartGas,
  SmartMapSourceFacility,
} from './useSmartMapDiffusionTypes'

interface SmartMapDiffusionScenarioOptions {
  facilities: Parameters<typeof getPhase1LeakSources>[0]
}

export function useSmartMapDiffusionScenario(options: SmartMapDiffusionScenarioOptions) {
  const diffusionGasOptions = PHASE1_GASES
  const initialDiffusionSourceOptions = getPhase1LeakSources(
    options.facilities,
    PHASE1_DEFAULT_SCENARIO.gasId,
  )
  const playbackSpeedOptions = [0.5, 1, 1.5, 2]
  const diffusionForm = reactive({
    ...PHASE1_DEFAULT_SCENARIO,
    sourceFacilityId: initialDiffusionSourceOptions[0]?.id || PHASE1_DEFAULT_SCENARIO.sourceFacilityId,
  })
  const showAdvancedDiffusion = ref(false)
  const showSourceInversionExpertSettings = ref(false)
  const diffusionSourceOptions = computed(() => getPhase1LeakSources(options.facilities, diffusionForm.gasId))
  const diffusionFrames = ref<SmartMapDiffusionFrame[]>([])
  const selectedDiffusionSource = computed<SmartMapSourceFacility | null>(() => (
    diffusionSourceOptions.value.find(item => item.id === diffusionForm.sourceFacilityId)
    || options.facilities.find(item => item.id === diffusionForm.sourceFacilityId)
    || null
  ))

  function getSelectedDiffusionSource() {
    return selectedDiffusionSource.value
  }

  const diffusionMeta = ref<SmartMapDiffusionMeta>({
    gas: getGasById(diffusionForm.gasId),
    sourceFacility: null,
    sourcePoint: null,
    stats: { peakConcentration: 0, peakAffectedArea: 0, peakDangerArea: 0 },
    blockedMask: null,
    map: null,
    executor: null,
    sensorSeries: [],
    scenarioMeta: null,
    outputMeta: null,
  })
  const currentDiffusionGas = computed<SmartGas & { color: string }>(() => ({
    ...getGasById(diffusionForm.gasId),
    ...(diffusionMeta.value.gas || {}),
  }))

  function getCurrentDiffusionGas() {
    return currentDiffusionGas.value
  }

  return {
    currentDiffusionGas,
    diffusionForm,
    diffusionFrames,
    diffusionGasOptions,
    diffusionMeta,
    diffusionSourceOptions,
    getCurrentDiffusionGas,
    getSelectedDiffusionSource,
    playbackSpeedOptions,
    selectedDiffusionSource,
    showAdvancedDiffusion,
    showSourceInversionExpertSettings,
  }
}
