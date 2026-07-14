import type { Ref } from 'vue'
import type { Router } from 'vue-router'
import { getPhase1LeakSources } from '@/data/phase1Config'
import type { MapFacility } from '@/data/realMapAssets'
import { focusSmartMapSensorPoint } from './smartMapSensorFocus'
import type { SmartMapSourceFacility } from './useSmartMapDiffusionTypes'
import type { SmartMapViewportState } from './useSmartMapViewport'

interface SmartMapSensorFocusLike {
  x: number
  y: number
}

interface SmartMapLeakSourceActionState {
  mode: string
  mapPoint: { x: number; y: number } | null
  picking: boolean
}

interface SmartMapDiffusionDemoForm {
  gasId: string
  sourceFacilityId: string
  sourceRate: number
  releaseDuration: number
  windSpeed: number
  windDirection: number
  stabilityClass: string
  humidity: number
  frameCount: number
  frameStepSec: number
}

interface SmartMapPageActionsOptions<TSensor extends SmartMapSensorFocusLike, TCar> {
  router: Router
  viewState: SmartMapViewportState
  getCanvas: () => HTMLCanvasElement | null | undefined
  selectedFacility: Ref<MapFacility | null>
  selectedSensor: Ref<TSensor | null>
  selectedCar: Ref<TCar | null>
  selectedZone: Ref<string>
  diffusionForm: SmartMapDiffusionDemoForm
  diffusionSourceOptions: Readonly<Ref<SmartMapSourceFacility[]>>
  leakSourceState: SmartMapLeakSourceActionState
  facilities: MapFacility[]
  facilityById: Map<string, MapFacility>
  clearFacilityInfo: () => void
  showFacilityInfoPanel: (facility: MapFacility) => void
  getFacilityAnchorPoint: (facility: MapFacility | SmartMapSourceFacility | null | undefined) => { x: number; y: number } | null
  syncManualGeoInputsFromWorld: (point: { x: number; y: number } | null | undefined) => void
  updateDiffusionMetaSource: (payload: {
    sourceFacility?: SmartMapSourceFacility | null
    sourcePoint?: { x: number; y: number } | null
  }) => void
  runDiffusionSimulation: () => Promise<void>
  render: () => void
}

export interface SmartMapClearInfoOptions<TCar> {
  clearFacilityInfo: () => void
  selectedZone: Ref<string>
  selectedCar: Ref<TCar | null>
}

export function navigateToSmartMapCarDetail(router: Router, carId: number | string) {
  router.push({
    path: `/car/${carId}`,
    query: { t: new Date().getTime() },
  })
}

export function clearSmartMapInfo<TCar>(options: SmartMapClearInfoOptions<TCar>) {
  options.clearFacilityInfo()
  options.selectedZone.value = ''
  options.selectedCar.value = null
}

export function createSmartMapInfoClearAction<TCar>(options: SmartMapClearInfoOptions<TCar>) {
  return () => clearSmartMapInfo(options)
}

export function useSmartMapPageActions<TSensor extends SmartMapSensorFocusLike, TCar>(
  options: SmartMapPageActionsOptions<TSensor, TCar>,
) {
  function navigateToCarDetail(carId: number | string) {
    navigateToSmartMapCarDetail(options.router, carId)
  }

  function goBackHome() {
    options.router.push('/car/home')
  }

  function zoomToSensor(sensor: TSensor) {
    const canvas = options.getCanvas()
    if (!sensor || !canvas) return
    focusSmartMapSensorPoint(options.viewState, canvas, sensor)
    options.render()
  }

  function showFacilityInfo(facility: MapFacility) {
    options.showFacilityInfoPanel(facility)
  }

  const clearInfo = createSmartMapInfoClearAction({
    clearFacilityInfo: options.clearFacilityInfo,
    selectedZone: options.selectedZone,
    selectedCar: options.selectedCar,
  })

  function closeInfo() {
    options.selectedFacility.value = null
    options.selectedSensor.value = null
    clearInfo()
    options.render()
  }

  async function runConditionedDiffusionDemo() {
    const demoGasId = 'co'
    const demoSource = getPhase1LeakSources(options.facilities, demoGasId)[0]
      || options.diffusionSourceOptions.value[0]
    if (demoSource) {
      const demoFacility = options.facilityById.get(demoSource.id) || null
      options.diffusionForm.gasId = demoGasId
      options.diffusionForm.sourceFacilityId = demoSource.id
      options.leakSourceState.mode = 'facility'
      options.leakSourceState.mapPoint = null
      options.leakSourceState.picking = false
      options.selectedFacility.value = demoFacility
      options.syncManualGeoInputsFromWorld(options.getFacilityAnchorPoint(demoFacility || demoSource))
      options.updateDiffusionMetaSource({
        sourceFacility: demoFacility || demoSource,
        sourcePoint: null,
      })
    }
    options.diffusionForm.sourceRate = 68
    options.diffusionForm.releaseDuration = 160
    options.diffusionForm.windSpeed = 3.8
    options.diffusionForm.windDirection = 35
    options.diffusionForm.stabilityClass = 'D'
    options.diffusionForm.humidity = 58
    options.diffusionForm.frameCount = 96
    options.diffusionForm.frameStepSec = 3
    await options.runDiffusionSimulation()
  }

  return {
    clearInfo,
    closeInfo,
    goBackHome,
    navigateToCarDetail,
    runConditionedDiffusionDemo,
    showFacilityInfo,
    zoomToSensor,
  }
}
