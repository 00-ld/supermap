import { watch, type Ref } from 'vue'

interface SmartMapDiffusionWatchForm {
  gasId: string
  sourceFacilityId: string
  sourceRate: number
  releaseDuration: number
  initialTemperature: number
  initialPressure: number
  releaseHeight: number
  windSpeed: number
  windDirection: number
  ambientTemperature: number
  humidity: number
  stabilityClass: string
  terrainRoughness: number
  obstacleInfluenceEnabled: boolean
  frameCount: number
  frameStepSec: number
}

interface SmartMapDiffusionPlaybackLike {
  currentFrame: number
}

interface SmartMapSelectedFacilityLike {
  id?: string
}

interface SmartMapSensorLike {
  id?: string | number
}

interface SmartMapLifecycleCoordinatorOptions<
  TSensor extends SmartMapSensorLike,
  TFacility extends SmartMapSelectedFacilityLike,
  TSourceFacility,
  TSourcePoint,
> {
  selectedSensor: Ref<TSensor | null>
  sensors: Ref<TSensor[]>
  selectedFacility: Ref<TFacility | null>
  diffusionState: SmartMapDiffusionPlaybackLike
  diffusionForm: SmartMapDiffusionWatchForm
  diffusionFrames: Ref<unknown[]>
  evacuationPlan: Ref<unknown | null>
  evacuationBatchResult: Ref<unknown | null>
  observationPayload: Ref<unknown | null>
  observationSummary: Ref<unknown | null>
  coarseSearchResult: Ref<unknown | null>
  coarseSearchSummary: Ref<unknown | null>
  selectedCoarseCandidateId: Ref<string>
  carRefreshTimer: Ref<ReturnType<typeof setInterval> | number>
  getInitialSourceFacility: () => TSourceFacility
  getInitialSourcePoint: () => TSourcePoint
  syncManualGeoInputsFromWorld: (point: TSourcePoint) => void
  updateDiffusionMetaSource: (payload: {
    sourceFacility: TSourceFacility
    sourcePoint: TSourcePoint | null
  }) => void
  updateCoordDisplay: (x: number, y: number) => void
  updateDiffusionPlayback: (deltaMs: number) => void
  updateRefinementPlayback: (deltaMs: number) => void
  updateCarPatrol: (deltaMs: number) => void
  computeRiskGrid: () => void
  updateRiskStat: () => void
  calcCoverage: () => void
  fetchSensorsFromDB: () => Promise<unknown>
  refreshSensorReadingsForObservation: () => void
  fetchGasList: () => void
  refreshCarData: () => void
  initializeWeatherData: () => void
  loadBtexValidationReport: () => void
  loadPrairieGrassValidationReport: () => void
  clearToastTimer: () => void
  showSensorInfo: (sensor: TSensor) => void
  syncCarMobileSensors: () => void
  syncSelectedFacilityToEvacuationPlan: (
    nextId: string | undefined,
    previousId: string | undefined,
  ) => void
  clearSourceInversionRefinement: (showMessage?: boolean) => void
  clearEvacuationPlanning: (silent?: boolean) => void
}

export function useSmartMapLifecycleCoordinator<
  TSensor extends SmartMapSensorLike,
  TFacility extends SmartMapSelectedFacilityLike,
  TSourceFacility,
  TSourcePoint,
>(
  options: SmartMapLifecycleCoordinatorOptions<TSensor, TFacility, TSourceFacility, TSourcePoint>,
) {
  function handleCanvasReady() {
    const sourceFacility = options.getInitialSourceFacility()
    options.syncManualGeoInputsFromWorld(options.getInitialSourcePoint())
    options.updateDiffusionMetaSource({
      sourceFacility,
      sourcePoint: null,
    })
    options.updateCoordDisplay(0, 0)
  }

  function handleAnimationFrame(deltaMs: number) {
    options.updateDiffusionPlayback(deltaMs)
    options.updateRefinementPlayback(deltaMs)
    options.updateCarPatrol(deltaMs)
  }

  function startBusinessRuntime() {
    options.computeRiskGrid()
    options.updateRiskStat()
    options.calcCoverage()
    options.fetchSensorsFromDB().then(() => options.refreshSensorReadingsForObservation())
    options.fetchGasList()
    options.refreshCarData()
    options.carRefreshTimer.value = setInterval(options.refreshCarData, 10000)
    options.initializeWeatherData()
    options.loadBtexValidationReport()
    options.loadPrairieGrassValidationReport()
  }

  function stopBusinessRuntime() {
    clearInterval(options.carRefreshTimer.value)
    options.clearToastTimer()
  }

  watch(() => options.diffusionState.currentFrame, () => {
    if (options.selectedSensor.value) {
      const selectedSensorId = options.selectedSensor.value.id
      const sensor = options.sensors.value.find(item => item.id === selectedSensorId)
      if (sensor) options.showSensorInfo(sensor)
    }
    options.syncCarMobileSensors()
  })

  watch(() => options.selectedFacility.value?.id, (nextId, previousId) => {
    options.syncSelectedFacilityToEvacuationPlan(nextId, previousId)
  })

  watch(
    () => [
      options.diffusionForm.gasId,
      options.diffusionForm.sourceFacilityId,
      options.diffusionForm.sourceRate,
      options.diffusionForm.releaseDuration,
      options.diffusionForm.initialTemperature,
      options.diffusionForm.initialPressure,
      options.diffusionForm.releaseHeight,
      options.diffusionForm.windSpeed,
      options.diffusionForm.windDirection,
      options.diffusionForm.ambientTemperature,
      options.diffusionForm.humidity,
      options.diffusionForm.stabilityClass,
      options.diffusionForm.terrainRoughness,
      options.diffusionForm.obstacleInfluenceEnabled,
      options.diffusionForm.frameCount,
      options.diffusionForm.frameStepSec,
      options.diffusionFrames.value.length,
      options.sensors.value.length,
    ],
    () => {
      options.observationPayload.value = null
      options.observationSummary.value = null
      options.coarseSearchResult.value = null
      options.coarseSearchSummary.value = null
      options.selectedCoarseCandidateId.value = ''
      options.clearSourceInversionRefinement(false)
      if ((options.evacuationPlan.value || options.evacuationBatchResult.value) && !options.diffusionFrames.value.length) {
        options.clearEvacuationPlanning(true)
      }
    },
  )

  return {
    handleAnimationFrame,
    handleCanvasReady,
    startBusinessRuntime,
    stopBusinessRuntime,
  }
}
