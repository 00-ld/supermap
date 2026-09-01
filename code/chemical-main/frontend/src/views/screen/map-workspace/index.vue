<template>
  <div class="chempark-container is-embedded">
    <div class="main-layout">
      <main class="map-container" ref="mapContainerRef">
        <SuperMap2DLayer />
        <div class="grid-overlay"></div>
        <canvas
          ref="mapCanvasRef"
          id="mapCanvas"
          :class="{ grabbing: isDragging }"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
          @mouseleave="onCanvasMouseLeave"
          @wheel.prevent="onCanvasWheel"
        ></canvas>

        <SmartMapCoordinateDisplay
          :longitude="coordLongitude"
          :latitude="coordLatitude"
          :altitude="coordAltitude"
        />

        <SmartMapSensorHoverCard
          :card="hoveredSensorCard"
          :priority-color="getPriorityColor"
        />
      </main>

      <aside
        v-if="manualSensorConfigVisible"
        class="embedded-sensor-panel"
        aria-label="二维传感器布设"
      >
        <header>
          <strong>传感器布设</strong>
          <button type="button" @click="closeEmbeddedSensorPlacement">
            关闭
          </button>
        </header>
        <SmartMapSensorManualConfigPanel
          :defaults="MANUAL_SENSOR_DEFAULTS"
          :draft="manualSensorDraft"
          :location-text="manualSensorPlacementLocationText"
          :origin="sensorPlacementState.origin"
          :pending-point="sensorPlacementState.pendingPoint"
          :picking="sensorPlacementState.picking"
          :picking-origin="sensorPlacementState.pickingOrigin"
          :point-label="manualSensorPlacementPointLabel"
          :relative-x="sensorPlacementState.relativeX"
          :relative-y="sensorPlacementState.relativeY"
          :validation="manualSensorDraftValidation"
          @apply-relative-coordinates="applyRelativeCoordinates"
          @cancel="cancelManualSensorPlacement"
          @confirm="confirmManualSensorPlacement"
          @reset-draft="resetManualSensorDraft(true)"
          @start-picking="startManualSensorPicking"
          @toggle-origin-picking="toggleOriginPicking"
          @update-draft="Object.assign(manualSensorDraft, $event)"
          @update-relative-x="sensorPlacementState.relativeX = $event"
          @update-relative-y="sensorPlacementState.relativeY = $event"
        />
      </aside>
    </div>
    <SmartMapSourceInversionProgressModal :state="sourceInversionProgress" />
    <SmartMapToast
      :visible="toastVisible"
      :text="toastText"
      :type="toastType"
      :icon="toastIcon"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { GasRecord, GasSavePayload } from '@/api/gas'
import type { SensorRecord } from '@/types/sensor'
import { getFrameConcentrationAtPoint, getGasById } from '@/data/phase1Config'
import { ALGORITHM_MAP } from '@/data/supermapCupScenario'
import { ALGORITHM_FRAME, enuToAlgorithm } from '@/data/supermapGeoreference'
import {
  ENTRANCE_ANCHORS_4490,
  LEAK_SOURCE_ANCHORS_4490,
  leakSourceToAlgorithmPoint,
} from '@/config/spatialAssets'
import {
  findNearestAllowedGasSourceFacility,
  getGasSourceConfig,
  validateGasLeakSource,
} from '@/data/gasSourceCatalog'
import { formatGeoCoord, geoToWorld, worldToGeo } from '@/data/coordinate'
import {
  DEFAULT_EMERGENCY_SOURCE_ID,
  getEmergencySourceAnchor,
  type EmergencyMapPoint,
} from '@/data/emergencyMapAnchors'
import { sensorTypes } from '@/data/sensorCatalog'
import {
  REAL_MAP,
  alerts,
  buildingEntrances,
  facilities,
  facilityById,
  getFacilityAnchorPoint,
  legends,
  pipes,
  roads,
  stats,
  zones,
} from '@/data/realMapAssets'
import { CAR_PATROL_ROUTES } from '@/data/carPatrolRoutes'
import type { MapFacility } from '@/data/realMapAssets'
import { useCarStore } from '@/store/carStore'
import { useSmartMapCarInteraction } from './useSmartMapCarInteraction'
import {
  normalizeSeriesConcentration,
  type SmartMapRecord,
} from './useSmartMapInversion'
import type {
  SmartMapObservationPayload,
  SmartMapObservationSummary,
  SmartMapRefinementInput,
} from './useSmartMapInversion'
import { eventValue, getErrorMessage, getErrorStatus } from './useSmartMapUi'
import { useSmartMapAlgorithmStates } from './useSmartMapAlgorithmStates'
import { useSmartMapCatalogPersistence } from './useSmartMapCatalogPersistence'
import {
  useSmartMapCarPatrol,
  type SmartMapCarPatrolRoute,
} from './useSmartMapCarPatrol'
import { type SmartMapDiffusionFrame } from './useSmartMapDiffusionLayer'
import { useSmartMapDiffusionPlayback } from './useSmartMapDiffusionPlayback'
import { useSmartMapRefinementPlayback } from './useSmartMapRefinementPlayback'
import { useSmartMapDiffusionScenario } from './useSmartMapDiffusionScenario'
import { useSmartMapDiffusionSimulation } from './useSmartMapDiffusionSimulation'
import type {
  SmartMapGas as SmartGas,
  SmartMapSourceFacility,
} from './useSmartMapDiffusionTypes'
import {
  type SmartMapSourceCandidateRegion,
  type SmartMapSourceRefinementIteration,
} from './useSmartMapSourceInversionOverlay'
import {
  type SmartMapActiveSensor,
  type SmartMapSensorSeriesRecord,
} from './useSmartMapSensorSeries'
import { useSmartMapSensorSeriesActions } from './useSmartMapSensorSeriesActions'
import { useSmartMapToast } from './useSmartMapToast'
import { useSmartMapValidationReports } from './useSmartMapValidationReports'
import {
  computeSmartMapSensorRisk as computeSensorRisk,
  createSmartMapNearestFacilityLookup,
  getSmartMapFacilitySensorAnchor as getFacilitySensorAnchor,
  getSmartMapPriorityColor as getPriorityColor,
  getSmartMapPriorityLabel as getPriorityLabel,
  isSmartMapPointNearFacility as isPointNearFacility,
  type SmartMapRiskGridCell,
} from './useSmartMapSensorPlacementRules'
import {
  calculateSmartMapSensorCoverage,
  summarizeSmartMapRiskGrid,
  useSmartMapRiskGridActions,
} from './useSmartMapRiskGrid'
import {
  buildSmartMapBaseStandardLayout,
  generateSmartMapSensorCode,
} from './useSmartMapSensorLayout'
import {
  useSmartMapSensorEditor,
  useSmartMapSensorEditorSyncBridge,
} from './useSmartMapSensorEditor'
import {
  MANUAL_SENSOR_DEFAULTS,
  normalizeSmartMapManualSensorNumber,
  useSmartMapSensorPlacement,
  useSmartMapSensorPlacementCancelBridge,
} from './useSmartMapSensorPlacement'
import { useSmartMapHitTestingActions } from './useSmartMapHitTesting'
import { useSmartMapInfoPanel } from './useSmartMapInfoPanel'
import {
  useSmartMapSensorInfoActionBridge,
  useSmartMapSensorInfoActions,
} from './useSmartMapSensorInfo'
import { useSmartMapSensorHoverCard } from './useSmartMapSensorHoverCard'
import { useSmartMapRiskSummary } from './useSmartMapRiskSummary'
import {
  getSmartMapFacilityBounds,
  smartMapHasRadiusFacility,
} from './useSmartMapFacilityCanvas'
import type { SmartMapEntranceRecord as EntranceLike } from './useSmartMapEntranceCanvas'
import type { SmartMapSensorCanvasRecord } from './useSmartMapSensorCanvas'
import { useSmartMapRenderer } from './useSmartMapRenderer'
import { useSmartMapRenderBridge } from './useSmartMapRenderBridge'
import { useSmartMapViewport } from './useSmartMapViewport'
import { useSmartMapRuntimeDisplay } from './useSmartMapRuntimeDisplay'
import { useSmartMapWeatherState } from './useSmartMapWeatherState'
import { useSmartMapMeasureTool } from './useSmartMapMeasureTool'
import { useSmartMapViewControls } from './useSmartMapViewControls'
import { useSmartMapCanvasShell } from './useSmartMapCanvasShell'
import { useSmartMapCanvasInteraction } from './useSmartMapCanvasInteraction'
import { useSmartMapCanvasSelectionActions } from './useSmartMapCanvasSelectionActions'
import { useSmartMapCanvasRuntime } from './useSmartMapCanvasRuntime'
import { useSmartMapLifecycleCoordinator } from './useSmartMapLifecycleCoordinator'
import { useSmartMapCoreState } from './useSmartMapCoreState'
import { useSmartMapLeakSource } from './useSmartMapLeakSource'
import { useSmartMapWorkflowSteps } from './useSmartMapWorkflowSteps'
import { useSmartMapSourceWorkflowState } from './useSmartMapSourceWorkflowState'
import { useSmartMapObservationBuilders } from './useSmartMapObservationBuilders'
import { useSmartMapObservationPayloadActions } from './useSmartMapObservationPayloadActions'
import {
  useSmartMapSourceInversionActions,
  type SmartMapSourceInversionProgressState,
} from './useSmartMapSourceInversionActions'
import { useSmartMapMonitoringSummaryState } from './useSmartMapMonitoringSummaryState'
import { useSmartMapSelectionDisplayState } from './useSmartMapSelectionDisplayState'
import { normalizeSmartMapPoint } from './smartMapLightweightConcentration'
import {
  createSmartMapSensorRenderRules,
  resolveSmartMapSensorDetectionRange as resolveSensorDetectionRange,
  resolveSmartMapSensorEffectiveRange as resolveSensorEffectiveRange,
  resolveSmartMapSensorInstallationHeight as resolveSensorInstallationHeight,
  resolveSmartMapSensorInstallRemark as resolveSensorInstallRemark,
} from './smartMapSensorDimensions'
import { createSmartMapInfoClearAction } from './useSmartMapPageActions'
import { useSmartMapEvacuationPlanning } from './useSmartMapEvacuationPlanning'
import type { SmartMapEvacuationRoute } from './useSmartMapEvacuationPlanning'
import { useSmartMapEvacuationPlanningActions } from './useSmartMapEvacuationPlanningActions'
import {
  loadSuperMapPlanningInputs,
  type SuperMapPlanningInputs,
} from './useSuperMapIserverData'
import SmartMapCoordinateDisplay from './components/SmartMapCoordinateDisplay.vue'
import SmartMapSensorManualConfigPanel from './components/SmartMapSensorManualConfigPanel.vue'
import SmartMapSourceInversionProgressModal from './components/SmartMapSourceInversionProgressModal.vue'
import SmartMapSensorHoverCard from './components/SmartMapSensorHoverCard.vue'
import SuperMap2DLayer from './components/SuperMap2DLayer.vue'
import SmartMapToast from './components/SmartMapToast.vue'
import type { SuperMapScenePickEventPayload } from '@/types/supermap-scene-events'

type SmartCar = { id: number; x: number; y: number; status?: string }
type SmartSensor = SensorRecord &
  SmartMapActiveSensor &
  SmartMapSensorCanvasRecord
type SmartOptions = {
  silent?: boolean
  emphasized?: boolean
  showMarkers?: boolean
  preferredCandidateId?: string
  preferredBuildingId?: string
  displayMode?: string
}
type CandidateRegion = SmartMapSourceCandidateRegion
const emit = defineEmits<{
  'source-change': [
    payload: { id: string; label: string; point: EmergencyMapPoint },
  ]
  'diffusion-frame': [
    payload: {
      frame: SmartMapDiffusionFrame | null
      frameIndex: number
      frameCount: number
      source: EmergencyMapPoint | null
      gasColor: string
      isPlaying: boolean
      frameStepSec: number
      frameDurationMs: number
      playbackSpeed: number
    },
  ]
  'inversion-stage': [
    payload: {
      stage: 'coarse' | 'refinement' | 'particle'
      candidates: SmartMapSourceCandidateRegion[]
      refinement: SmartMapSourceRefinementIteration | null
      estimatedPoint: EmergencyMapPoint | null
      credibleRadius95m?: number | null
      posteriorDensityGeoJSON?: SmartMapRecord | null
      posteriorParticles?: SmartMapRecord[] | null
    },
  ]
  'evacuation-route': [route: SmartMapEvacuationRoute | null]
}>()
const selectedEmbeddedSourceId = ref(DEFAULT_EMERGENCY_SOURCE_ID)
const router = useRouter()
const carStore = useCarStore()

const { mapCanvasRef, mapContainerRef, isDragging, viewMode } =
  useSmartMapCanvasShell()
const smartMapRenderBridge = useSmartMapRenderBridge()
const {
  bindRuntimeCanvas,
  createRenderImage,
  getCanvas,
  render,
  setCanvasCursor,
} = smartMapRenderBridge
const { setShowSensorInfoAction, showSensorInfo } =
  useSmartMapSensorInfoActionBridge<SmartSensor>()
const {
  setSyncSensorEditorStateAction,
  syncSensorEditorState: syncSensorEditorStateBridge,
} = useSmartMapSensorEditorSyncBridge<SmartSensor>()
const {
  cancelSensorPicking: cancelSensorPickingBridge,
  cancelSensorOriginPicking: cancelSensorOriginPickingBridge,
  setCancelSensorPickingAction,
  setCancelSensorOriginPickingAction,
} = useSmartMapSensorPlacementCancelBridge()
const SMART_MAP_DISPLAY_MAP = {
  ...REAL_MAP,
  width: ALGORITHM_FRAME.width,
  height: ALGORITHM_FRAME.height,
  // 四角配准：DOM 厂区包络 (220,210)-(1240,760) 对齐到
  // 4490 算法画布四角。原图为 2.5 asset px / map unit。
  sourceCrop: { x: 550, y: 525, w: 2550, h: 1375 },
}
const smartMapDataBoundary = {
  x: 0,
  y: 0,
  w: ALGORITHM_FRAME.width,
  h: ALGORITHM_FRAME.height,
}
const modelBoundParkEntrances: EntranceLike[] = ENTRANCE_ANCHORS_4490.flatMap(
  (entrance) => {
    if (!entrance.modelLocalEnuMeters) return []
    const point = enuToAlgorithm(
      entrance.modelLocalEnuMeters.east,
      entrance.modelLocalEnuMeters.north,
    )
    const isTopEdge = entrance.bindingMethod.includes('TOP')
    return [
      {
        id: entrance.entranceId,
        kind: 'park',
        edge: isTopEdge ? 'top' : 'bottom',
        x: point.x,
        y: point.y,
        label: entrance.name,
        tooltipSide: isTopEdge ? 'bottom' : 'top',
      },
    ]
  },
)
const modelLeakSourceFacilities = LEAK_SOURCE_ANCHORS_4490.map((source) => {
  const point = leakSourceToAlgorithmPoint(source)
  return {
    id: source.leakSourceId,
    name: source.modelName,
    type:
      source.modelName.includes('罐') || source.modelName.includes('容器')
        ? 'tank'
        : 'production',
    key: true,
    x: point.x,
    y: point.y,
    w: 0,
    h: 0,
    zone: 'model-leak-source',
    status: '可选泄漏源',
    modelSmId: source.modelSmId,
    modelName: source.modelName,
    supportedGasCodes: source.supportedGasCodes,
  }
})
const modelLeakSourceFacilityById = new Map(
  modelLeakSourceFacilities.map((facility) => [facility.id, facility]),
)
const realMapImage = createRenderImage(SMART_MAP_DISPLAY_MAP.image)
const {
  clearFacilityInfo,
  facilityLayerState,
  hoveredEntrance,
  hoveredFacility,
  hoveredSensor,
  infoRows,
  infoSubtitle,
  infoTitle,
  panelCollapsed,
  selectedFacility,
  setInfoPanel,
  showFacilityInfo: showFacilityInfoPanel,
} = useSmartMapInfoPanel<MapFacility, EntranceLike, SmartSensor>({ zones })
const {
  clearToastTimer,
  showToast,
  toastIcon,
  toastText,
  toastType,
  toastVisible,
} = useSmartMapToast()
const superMapPlanningInputs = ref<SuperMapPlanningInputs | null>(null)
const superMapPlanningLoadState = ref<'idle' | 'loading' | 'ready' | 'error'>(
  'idle',
)
const latestScenePickPayload = ref<SuperMapScenePickEventPayload | null>(null)
const superMapPlanningSourceLabel = computed(
  () => superMapPlanningInputs.value?.sourceLabel || '前端静态数据兜底',
)

onMounted(() => {
  superMapPlanningLoadState.value = 'loading'
  loadSuperMapPlanningInputs()
    .then((inputs) => {
      superMapPlanningInputs.value = inputs
      superMapPlanningLoadState.value = 'ready'
      showToast(`已接入 ${inputs.sourceLabel}`, 'success')
    })
    .catch((error: unknown) => {
      superMapPlanningLoadState.value = 'error'
      console.warn(
        '[SuperMap] iServer Data 疏散数据加载失败，保留静态数据兜底',
        error,
      )
      showToast(
        `iServer Data 疏散数据加载失败: ${getErrorMessage(error, '服务异常')}`,
        'warn',
      )
    })
})
function handleSceneObjectPick(payload: SuperMapScenePickEventPayload) {
  latestScenePickPayload.value = payload
  if (payload.projectedPoint) {
    showToast(
      `三维选中 ${payload.selectedObjectId} · CGCS2000(${payload.projectedPoint.easting.toFixed(2)}, ${payload.projectedPoint.northing.toFixed(2)})`,
      'success',
    )
    return
  }
  showToast(
    `三维选中 ${payload.selectedObjectId}，等待 CGCS2000 属性或新 Realspace 服务`,
    'warn',
  )
}
const sourceInversionProgress = ref<SmartMapSourceInversionProgressState>({
  visible: false,
  stepIndex: 0,
  totalSteps: 5,
  percent: 0,
  title: '正在进行监控点反向溯源',
  stepLabel: '等待启动',
  detail: '',
  code: '',
})
function setSourceInversionProgress(
  state: Partial<SmartMapSourceInversionProgressState>,
) {
  sourceInversionProgress.value = {
    ...sourceInversionProgress.value,
    ...state,
  }
}
function hideSourceInversionProgress() {
  sourceInversionProgress.value = {
    ...sourceInversionProgress.value,
    visible: false,
  }
}
const {
  clock,
  coordAltitude,
  coordLatitude,
  coordLongitude,
  updateClock,
  updateCoordDisplay,
} = useSmartMapRuntimeDisplay()

const {
  viewState,
  zoomLevel,
  worldToScreen,
  screenToWorld,
  getBoundarySafeScale,
  fitInitialMapView,
  zoomIn: zoomViewportIn,
  zoomOut: zoomViewportOut,
  applyWheelZoom,
  focusWorldPoint,
  flyToWorldPoint,
  viewportRenderControls,
} = useSmartMapViewport({
  getCanvas,
  map: {
    width: SMART_MAP_DISPLAY_MAP.width,
    height: SMART_MAP_DISPLAY_MAP.height,
  },
  render,
})
const {
  measureMode,
  addMeasurePoint,
  measureLayer,
  measureCursor,
  setSmartMapTool,
} = useSmartMapMeasureTool({ showToast })
const {
  activeFilter,
  onSearch,
  searchQuery,
  selectedZone,
  selectZone,
  setFilter,
  setTool,
  showEntrances,
  showHeatmap,
  showLabels,
  showSensorRanges,
  showSensors,
  toggleEntrances,
  toggleHeatmap,
  toggleLabels,
  toggleSensorRanges,
  toggleSensors,
  viewVisibility,
  zoomIn,
  zoomOut,
  zoomReset,
} = useSmartMapViewControls({
  facilities,
  selectedFacility,
  hoveredEntrance,
  getCanvas,
  getFacilityAnchorPoint,
  showFacilityInfo: showFacilityInfoPanel,
  setSmartMapTool,
  measureCursor,
  focusWorldPoint,
  fitInitialMapView,
  zoomViewportIn,
  zoomViewportOut,
  render,
  showToast,
})
const {
  sensors,
  gases,
  riskGrid,
  selectedSensor,
  coreLayerState,
  getRiskGrid,
  getSensors,
} = useSmartMapCoreState<SmartSensor, SmartGas, SmartMapRiskGridCell>()
const sensorRenderRules = createSmartMapSensorRenderRules(),
  findNearestFacility = createSmartMapNearestFacilityLookup(facilities)
const { initializeWeatherData, weatherSource, weatherState } =
  useSmartMapWeatherState()
const { computeRiskGrid } = useSmartMapRiskGridActions({
  riskGrid,
  weatherState,
  mapWidth: ALGORITHM_MAP.width,
  mapHeight: ALGORITHM_MAP.height,
  facilities,
})

const { calcCoverage, layoutResult, riskStat, updateRiskStat } =
  useSmartMapRiskSummary<SmartMapRiskGridCell, SmartSensor>({
    getRiskGrid,
    getSensors,
    sensorTypes,
    defaultRange: MANUAL_SENSOR_DEFAULTS.effectiveRange,
    resolveRange: resolveSensorEffectiveRange,
    calculateCoverage: calculateSmartMapSensorCoverage,
    summarizeRiskGrid: summarizeSmartMapRiskGrid,
  })
const {
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
} = useSmartMapDiffusionScenario({
  facilities: modelLeakSourceFacilities,
})
const {
  btexValidationReport,
  btexValidationLoadState,
  btexValidationStatusClass,
  btexValidationSummary,
  prairieValidationReport,
  prairieValidationLoadState,
  prairieValidationStatusClass,
  prairieValidationSummary,
  loadBtexValidationReport,
  loadPrairieGrassValidationReport,
} = useSmartMapValidationReports()
const {
  diffusionExecutorState,
  evacuationExecutorState,
  particleFilterConfig,
  sourceInversionConfig,
  sourceInversionExecutorState,
  sourceInversionRunState,
  sourceInversionState,
  sourceRefinementConfig,
} = useSmartMapAlgorithmStates()
const {
  currentDiffusionFrame,
  diffusionRunState,
  diffusionState,
  getCurrentDiffusionFrame,
  getCurrentDiffusionFrameIndex,
  resetDiffusionPlayback,
  seekDiffusionFrame,
  setDiffusionRunning,
  startDiffusionPlaybackFromFirstFrame,
  stepDiffusionFrame,
  toggleDiffusionPlayback,
  updateDiffusionPlayback,
} = useSmartMapDiffusionPlayback<SmartMapDiffusionFrame>({
  frames: diffusionFrames,
  render,
})
const {
  carLayerState,
  carMarkers,
  carPatrolEnabled,
  carRefreshTimer,
  mobileSensorReadings,
  carHitTest,
  refreshCarData,
  syncCarMarkers,
  syncCarMobileSensors,
  toggleCarPatrol,
  toggleCars,
  updateCarPatrol,
} = useSmartMapCarPatrol({
  carStore,
  carPatrolRoutes: CAR_PATROL_ROUTES as Record<
    number,
    SmartMapCarPatrolRoute | undefined
  >,
  diffusionFrames,
  getCurrentFrame: getCurrentDiffusionFrame,
  getCurrentFrameIndex: getCurrentDiffusionFrameIndex,
  getFrameConcentrationAtPoint,
  render,
  showToast,
})
const {
  carInteractionLayerState,
  hoveredCar,
  selectedCar,
  selectCar,
  showCarInfo,
  yoloResult,
} = useSmartMapCarInteraction<SmartCar>({
  carStore,
  router,
  getCanvas,
  getErrorMessage,
  refreshCarData,
  render,
  selectedFacility,
  selectedSensor,
  setInfoPanel,
  showToast,
  viewState,
})
const {
  leakSourceState,
  diffusionSourceValidation,
  diffusionSourceHint,
  currentLeakSourcePoint,
  getCurrentLeakSourcePoint,
  cancelLeakSourcePicking,
  isLeakSourcePicking,
  diffusionSourceLayer,
  leakSourceEntryLabel,
  leakSourceLocationText,
  syncManualGeoInputsFromWorld,
  updateDiffusionMetaSource,
  applyMapLeakSourcePoint,
  toggleLeakSourcePicking,
  applyManualGeoLeakSource,
  useSelectedFacilityAsLeakSource,
} = useSmartMapLeakSource({
  diffusionForm,
  diffusionMeta,
  facilities: modelLeakSourceFacilities,
  facilityById: modelLeakSourceFacilityById,
  diffusionSourceOptions,
  selectedDiffusionSource,
  selectedFacility,
  normalizeMapPoint: normalizeSmartMapPoint,
  worldToGeo,
  geoToWorld,
  getFacilityAnchorPoint,
  getGasById,
  getGasSourceConfig,
  findNearestAllowedGasSourceFacility,
  validateGasLeakSource,
  cancelSensorPicking: cancelSensorPickingBridge,
  cancelSensorOriginPicking: cancelSensorOriginPickingBridge,
  setCanvasCursor,
  measureCursor,
  showToast,
  render,
})
const {
  buildActiveSensorSeries,
  buildFrameSeriesTemplate,
  buildSensorHistoryChart,
  getSensorAlarmLevel,
  getSensorAutoConcentration,
  getSensorCurrentConcentration,
  normalizeManualSeries,
  resampleSensorsFromDiffusion,
} = useSmartMapSensorSeriesActions<SmartSensor, MapFacility | null>({
  sensors,
  selectedSensor,
  diffusionFrames,
  currentDiffusionFrame,
  diffusionMeta,
  diffusionState,
  diffusionForm,
  weatherState,
  getCurrentLeakSourcePoint,
  getGasById,
  getFrameConcentrationAtPoint,
  findNearestFacility,
  computeSensorRisk,
  showSensorInfo,
  syncSensorEditorState: syncSensorEditorStateBridge,
})
const {
  diffusionConditionLabel,
  diffusionModelLabel,
  diffusionSummary,
  isSimulatedConcentration,
  sensorSamplingSummary,
} = useSmartMapMonitoringSummaryState<SmartSensor>({
  currentDiffusionFrame,
  diffusionForm,
  diffusionFrames,
  diffusionMeta,
  diffusionState,
  selectedDiffusionSource,
  getCurrentLeakSourcePoint,
  getGasById,
  getSensorCurrentConcentration,
  sensors,
})
const { hoveredSensorCard } = useSmartMapSensorHoverCard<
  SmartSensor,
  ReturnType<typeof getCurrentDiffusionGas>
>({
  hoveredSensor,
  sensorTypes,
  getCurrentGas: getCurrentDiffusionGas,
  getCurrentFrame: getCurrentDiffusionFrame,
  getCurrentConcentration: getSensorCurrentConcentration,
  getAlarmLevel: getSensorAlarmLevel,
  getPriorityLabel,
})
const {
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
} = useSmartMapSourceWorkflowState({
  candidateRadius: sourceInversionConfig.candidateRadius,
})
const {
  buildObservationSummary,
  createObservationPayload,
  createParticleFilterPayload,
  getInversionObservationSensors,
  getObservationReadySensors,
  refreshSensorReadingsForObservation,
} = useSmartMapObservationBuilders<
  SmartSensor,
  SmartMapRecord,
  SmartMapDiffusionFrame
>({
  sensors,
  mobileSensorReadings,
  diffusionFrames,
  currentDiffusionFrame,
  diffusionState,
  diffusionForm,
  diffusionMeta,
  sourceInversionConfig,
  particleFilterConfig,
  currentDiffusionGas,
  selectedDiffusionSource,
  selectedCoarseCandidate,
  coarseCandidateRegions,
  coarseSearchResult,
  refinementResult,
  dataBoundary: smartMapDataBoundary,
  getCurrentLeakSourcePoint,
  buildActiveSensorSeries,
  render,
  showToast,
})
const { inversionObservationSummary, selectedSensorHistoryChart } =
  useSmartMapSelectionDisplayState({
    buildSensorHistoryChart,
    getInversionObservationSensors,
    getObservationReadySensors,
    selectedSensor,
  })
const {
  exportObservationPayloadJson,
  generateObservationPayloadExport,
  prepareObservationDataset,
  setObservationPayloadState,
} = useSmartMapObservationPayloadActions({
  buildObservationSummary,
  createObservationPayload,
  observationPayload,
  observationSummary,
  showToast,
})
const {
  refinementLayerState,
  refinementCurrentIteration,
  refinementState,
  resetRefinementPlayback,
  seekRefinementStep,
  startRefinementPlayback,
  toggleRefinementPlayback,
  updateRefinementPlayback,
} = useSmartMapRefinementPlayback({
  iterations: refinementIterations,
  render,
  showToast,
})
const {
  clearAnalyticCoarseSearch,
  clearSourceInversionRefinement,
  clearSourceInversionWorkflow,
  runAnalyticCoarseSearchPreview,
  runAnalyticRefinementPreview,
  runParticleFilterInversionPreview,
  selectCoarseCandidate,
} = useSmartMapSourceInversionActions({
  coarseCandidateRegions,
  coarseSearchResult,
  coarseSearchSummary,
  diffusionFrames,
  diffusionState,
  observationPayload,
  observationSummary,
  particleFilterConfig,
  refinementInput,
  refinementResult,
  refinementSummary,
  selectedCoarseCandidate,
  selectedCoarseCandidateId,
  sourceInversionConfig,
  sourceInversionExecutorState,
  sourceInversionState,
  sourceRefinementConfig,
  viewState,
  createObservationPayload,
  createParticleFilterPayload,
  getCanvas,
  getCurrentLeakSourcePoint,
  getObservationReadySensors,
  hideInversionProgress: hideSourceInversionProgress,
  refreshSensorReadingsForObservation,
  resetRefinementPlayback,
  render,
  setObservationPayloadState,
  setInversionProgress: setSourceInversionProgress,
  showToast,
  startRefinementPlayback,
})
const {
  activeEvacuationRoute,
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
  selectEvacuationBuilding: selectEvacuationBuildingState,
  selectEvacuationCandidate: selectEvacuationCandidateState,
  selectedEvacuationBuildingId,
  selectedEvacuationBuildingRoute,
  selectedEvacuationCandidate,
  selectedEvacuationCandidateId,
  syncSelectedEvacuationBuilding: syncSelectedEvacuationBuildingState,
  syncSelectedEvacuationCandidate: syncSelectedEvacuationCandidateState,
} = useSmartMapEvacuationPlanning({
  selectedFacility,
})
const {
  clearEvacuationPlanning,
  clearEvacuationPlanningSilently,
  rerunEvacuationAfterDiffusion,
  runBatchEvacuationPlanning,
  runEvacuationPlanning,
  selectEvacuationBuilding,
  selectEvacuationCandidate,
  syncSelectedEvacuationCandidate,
  syncSelectedFacilityToEvacuationPlan,
} = useSmartMapEvacuationPlanningActions({
  selectedFacility,
  currentDiffusionFrame,
  diffusionMeta,
  evacuationPlan,
  evacuationBatchResult,
  evacuationPlanningMode,
  evacuationDisplayMode,
  selectedEvacuationBuildingId,
  selectedEvacuationCandidateId,
  evacuationBuildingRoutes,
  buildingEntrances,
  facilityById,
  roads,
  parkEntrances: modelBoundParkEntrances,
  facilities,
  getPlanningInputs: () => {
    if (!superMapPlanningInputs.value) {
      return {
        roads,
        parkEntrances: modelBoundParkEntrances,
        buildingEntrances,
        facilities,
        facilityById,
        sourceLabel: superMapPlanningSourceLabel.value,
        usesSuperMapData: false,
      }
    }
    return {
      roads: superMapPlanningInputs.value.roads,
      parkEntrances: superMapPlanningInputs.value
        .parkEntrances as EntranceLike[],
      buildingEntrances: superMapPlanningInputs.value
        .buildingEntrances as EntranceLike[],
      facilities: superMapPlanningInputs.value.facilities,
      facilityById: superMapPlanningInputs.value.facilityById,
      map: superMapPlanningInputs.value.map,
      sourceLabel: superMapPlanningInputs.value.sourceLabel,
      usesSuperMapData: true,
    }
  },
  syncSelectedEvacuationCandidateState,
  syncSelectedEvacuationBuildingState,
  selectEvacuationCandidateState,
  selectEvacuationBuildingState,
  clearEvacuationPlanningState,
  render,
  showToast,
})
const {
  deleteAllSensorsFromDB,
  deleteGasFromDB,
  deleteSensorFromDB,
  fetchGasList,
  fetchSensorsFromDB,
  saveGasToDB,
  saveSensorToDB,
  updateGasToDB,
  updateSensorToDB,
} = useSmartMapCatalogPersistence({
  sensors,
  gases,
  diffusionFrames,
  buildActiveSensorSeries,
  generateBaseStandardLayout: buildSmartMapBaseStandardLayout,
  computeRiskGrid,
  calcCoverage,
  render,
  getErrorMessage,
})
const {
  sensorEditorState,
  manualSensorPanelVisible,
  manualSensorTargetId,
  manualSensorTarget,
  syncSensorEditorState,
  selectManualSensorTarget,
  toggleManualSensorPanel,
  setManualPanelSensorMode,
  setSelectedSensorMode,
  applySelectedSensorManualValueToCurrentFrame,
  fillSelectedSensorManualSeries,
  copyAutoSeriesToSelectedSensorManual,
  clearSelectedSensorManualSeries,
} = useSmartMapSensorEditor<SmartSensor, SmartMapDiffusionFrame>({
  sensors,
  selectedSensor,
  diffusionFrames,
  getCurrentFrame: getCurrentDiffusionFrame,
  buildActiveSensorSeries,
  buildFrameSeriesTemplate,
  normalizeManualSeries,
  normalizeSeriesConcentration,
  showSensorInfo,
  showToast,
  updateSensorToDB,
  render,
})
setSyncSensorEditorStateAction(syncSensorEditorState)
const sensorInfoActions = useSmartMapSensorInfoActions<SmartSensor>({
  sensorTypes,
  defaultRange: MANUAL_SENSOR_DEFAULTS.effectiveRange,
  panelCollapsed,
  manualSensorTargetId,
  setInfoPanel,
  syncSensorEditorState,
  getCurrentConcentration: getSensorCurrentConcentration,
  getAutoConcentration: getSensorAutoConcentration,
  getPriorityLabel,
  resolveEffectiveRange: resolveSensorEffectiveRange,
  resolveInstallationHeight: resolveSensorInstallationHeight,
  resolveDetectionRange: resolveSensorDetectionRange,
  resolveInstallRemark: resolveSensorInstallRemark,
})
setShowSensorInfoAction(sensorInfoActions.showSensorInfo)
const {
  sensorPlacementState,
  getSensorPlacementOrigin,
  manualSensorConfigVisible,
  manualSensorDraft,
  manualSensorPlacementPointLabel,
  manualSensorPlacementLocationText,
  manualSensorDraftValidation,
  resetManualSensorDraft,
  toggleOriginPicking,
  captureOriginPoint,
  applyRelativeCoordinates,
  startManualSensorPicking,
  captureManualSensorPoint,
  cancelSensorPicking,
  cancelSensorOriginPicking,
  isSensorPicking,
  isSensorOriginPicking,
  cancelManualSensorPlacement,
  confirmManualSensorPlacement,
  addManualSensor,
  clearAllSensor,
  deleteCurrSensor,
} = useSmartMapSensorPlacement<SmartSensor, MapFacility>({
  sensors,
  selectedSensor,
  facilities,
  measureMode,
  normalizeMapPoint: normalizeSmartMapPoint,
  formatGeoCoord,
  setCanvasCursor,
  cancelLeakSourcePicking,
  findNearestFacility,
  computeSensorRisk,
  generateSensorCode: generateSmartMapSensorCode,
  buildFrameSeriesTemplate,
  resampleSensorsFromDiffusion,
  saveSensorToDB,
  measureCursor,
  deleteAllSensorsFromDB,
  deleteSensorFromDB,
  syncSensorEditorState,
  showSensorInfo,
  calcCoverage,
  updateRiskStat,
  clearInfo: createSmartMapInfoClearAction({
    clearFacilityInfo,
    selectedZone,
    selectedCar,
  }),
  showToast,
  render,
})
setCancelSensorPickingAction(cancelSensorPicking)
setCancelSensorOriginPickingAction(cancelSensorOriginPicking)
const { commandWorkflowSteps, sourceWorkflowSteps } = useSmartMapWorkflowSteps({
  currentLeakSourcePoint,
  diffusionFrames,
  diffusionRunState,
  activeEvacuationRoute,
  observationSummary,
  coarseCandidateRegions,
  sourceInversionRunState,
  isDeepParticleResult,
})
function clearSourceInversionArtifactsForDiffusion() {
  coarseSearchResult.value = null
  coarseSearchSummary.value = null
  selectedCoarseCandidateId.value = ''
  observationPayload.value = null
  observationSummary.value = null
  refinementInput.value = null
  refinementResult.value = null
  refinementSummary.value = null
  sourceInversionExecutorState.mode = 'local'
  sourceInversionExecutorState.fallbackReason = ''
  resetRefinementPlayback()
  hideSourceInversionProgress()
}

const { resetDiffusionSimulation, runDiffusionSimulation } =
  useSmartMapDiffusionSimulation({
    diffusionForm,
    diffusionFrames,
    diffusionMeta,
    facilities,
    roads,
    sensors,
    map: ALGORITHM_MAP,
    diffusionRunState,
    getCurrentLeakSourcePoint,
    getSelectedDiffusionSource,
    getGasById,
    normalizeMapPoint: normalizeSmartMapPoint,
    setDiffusionRunning,
    startDiffusionPlaybackFromFirstFrame,
    resetDiffusionPlayback,
    resampleSensorsFromDiffusion,
    rerunEvacuationAfterDiffusion,
    clearEvacuationPlanning: clearEvacuationPlanningSilently,
    clearSourceInversionWorkflow: clearSourceInversionArtifactsForDiffusion,
    render,
    showToast,
  })
const clearInfo = createSmartMapInfoClearAction({
  clearFacilityInfo,
  selectedZone,
  selectedCar,
})
const smartMapLifecycle = useSmartMapLifecycleCoordinator({
  selectedSensor,
  sensors,
  selectedFacility,
  diffusionState,
  diffusionForm,
  diffusionFrames,
  evacuationPlan,
  evacuationBatchResult,
  observationPayload,
  observationSummary,
  coarseSearchResult,
  coarseSearchSummary,
  selectedCoarseCandidateId,
  carRefreshTimer,
  getInitialSourceFacility: getSelectedDiffusionSource,
  getInitialSourcePoint: getCurrentLeakSourcePoint,
  syncManualGeoInputsFromWorld,
  updateDiffusionMetaSource,
  updateCoordDisplay,
  updateDiffusionPlayback,
  updateRefinementPlayback,
  updateCarPatrol,
  computeRiskGrid,
  updateRiskStat,
  calcCoverage,
  fetchSensorsFromDB,
  refreshSensorReadingsForObservation,
  fetchGasList,
  refreshCarData,
  initializeWeatherData,
  loadBtexValidationReport,
  loadPrairieGrassValidationReport,
  clearToastTimer,
  showSensorInfo,
  syncCarMobileSensors,
  syncSelectedFacilityToEvacuationPlan,
  clearSourceInversionRefinement,
  clearEvacuationPlanning,
})
useSmartMapCanvasRuntime({
  canvasRef: mapCanvasRef,
  containerRef: mapContainerRef,
  viewMode,
  render,
  fitInitialMapView,
  updateClock,
  showToast,
  onCanvasBound: bindRuntimeCanvas,
  onCanvasReady: smartMapLifecycle.handleCanvasReady,
  onAnimationFrame: smartMapLifecycle.handleAnimationFrame,
  onAfterRuntimeStart: smartMapLifecycle.startBusinessRuntime,
  onBeforeRuntimeStop: smartMapLifecycle.stopBusinessRuntime,
})

const smartMapHitTesting = useSmartMapHitTestingActions({
  facilities,
  parkEntrances: modelBoundParkEntrances,
  buildingEntrances: buildingEntrances as EntranceLike[],
  facilityById,
  activeFilter,
  showEntrances,
  candidateRegions: coarseCandidateRegions,
  sensors,
  getFacilityBounds: getSmartMapFacilityBounds,
  hasRadiusFacility: smartMapHasRadiusFacility,
})
const smartMapRenderer = useSmartMapRenderer<
  EntranceLike,
  SmartSensor,
  SmartCar
>({
  dataBoundary: smartMapDataBoundary,
  realMap: SMART_MAP_DISPLAY_MAP,
  realMapImage,
  viewState,
  facilities,
  leakSourceCandidates: modelLeakSourceFacilities,
  sensorRenderRules,
  viewportRenderControls,
  hitTestingLayer: smartMapHitTesting,
  getCurrentDiffusionFrame,
  getCurrentDiffusionGas,
  sourceWorkflowLayerState,
  refinementLayerState,
  evacuationLayerState,
  coreLayerState,
  viewVisibility,
  diffusionSourceLayer,
  facilityLayerState,
  carLayerState,
  carInteractionLayerState,
  measureLayer,
  getSensorRealtimeColor: (sensor) => {
    if (!diffusionFrames.value.length) return null
    const concentration = getSensorCurrentConcentration(sensor)
    const alarmLevel = getSensorAlarmLevel(
      concentration,
      getCurrentDiffusionGas(),
    )
    if (alarmLevel === 'danger') return '#ff4e4e'
    if (alarmLevel === 'warning') return '#ffb836'
    return concentration > 0 ? '#35d2ff' : '#39ff7a'
  },
  getSensorRealtimeConcentration: (sensor) =>
    diffusionFrames.value.length ? getSensorCurrentConcentration(sensor) : 0,
})

smartMapRenderBridge.setRenderer(smartMapRenderer)
const smartMapSelectionActions = useSmartMapCanvasSelectionActions<
  MapFacility,
  SmartSensor,
  SmartCar,
  CandidateRegion
>({
  facilityById,
  hoveredSensor,
  selectedSensor,
  selectedFacility,
  selectedCar,
  selectedZone,
  showSensorInfo,
  showFacilityInfo: showFacilityInfoPanel,
  clearInfo,
  selectCar,
  selectCoarseCandidate,
})
const {
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasMouseLeave,
  onCanvasWheel,
} = useSmartMapCanvasInteraction<
  MapFacility,
  EntranceLike,
  SmartSensor,
  CandidateRegion,
  SmartCar
>({
  getCanvas,
  viewState,
  isDragging,
  measureMode,
  screenToWorld,
  updateCoordDisplay,
  addMeasurePoint,
  measureCursor,
  render,
  applyWheelZoom,
  leakSourcePicking: isLeakSourcePicking,
  sensorPicking: isSensorPicking,
  sensorOriginPicking: isSensorOriginPicking,
  applyLeakSourcePoint: applyMapLeakSourcePoint,
  captureManualSensorPoint,
  captureOriginPoint,
  entranceHitTest: smartMapHitTesting.entranceHitTest,
  sensorHitTest: smartMapHitTesting.sensorHitTest,
  candidateRegionHitTest: smartMapHitTesting.candidateRegionHitTest,
  carHitTest,
  facilityHitTest: smartMapHitTesting.hitTest,
  hoveredEntrance,
  hoveredSensor,
  hoveredCar,
  hoveredFacility,
  selectedSensor,
  selectedCar,
  selectedFacility,
  selectSensor: smartMapSelectionActions.selectSensor,
  selectCandidate: smartMapSelectionActions.selectCandidate,
  selectCar: smartMapSelectionActions.selectCar,
  selectFacility: smartMapSelectionActions.selectFacility,
  clearSelection: smartMapSelectionActions.clearSelection,
})

function selectEmbeddedSource(sourceId: string) {
  const source = getEmergencySourceAnchor(sourceId)
  selectedEmbeddedSourceId.value = source.id
  const wasApplied = applyMapLeakSourcePoint(source.point)
  if (!wasApplied) return
  flyToWorldPoint(source.point, 760, Math.max(viewState.scale, 1))
  emit('source-change', {
    id: source.id,
    label: source.label,
    point: { ...source.point },
  })
}

// 接收 screen 顶层获取的实时天气（和风/环境监测），写入扩散表单。
// 仅写入有效数值，避免用 NaN/undefined 覆盖表单默认值导致算法异常。
function applyRealtimeWeather(weather: {
  windSpeed?: number | null
  windDirection?: number | null
  temperature?: number | null
  humidity?: number | null
}) {
  if (Number.isFinite(weather.windSpeed)) {
    diffusionForm.windSpeed = Math.min(
      12,
      Math.max(0.5, weather.windSpeed as number),
    )
  }
  if (Number.isFinite(weather.windDirection)) {
    diffusionForm.windDirection =
      (((weather.windDirection as number) % 360) + 360) % 360
  }
  if (Number.isFinite(weather.temperature)) {
    diffusionForm.ambientTemperature = Math.min(
      60,
      Math.max(-30, weather.temperature as number),
    )
  }
  if (Number.isFinite(weather.humidity)) {
    diffusionForm.humidity = Math.min(
      100,
      Math.max(0, weather.humidity as number),
    )
  }
}

const embeddedEvacuationDestinations = computed(() =>
  modelBoundParkEntrances.map((entrance) => ({
    id: String(entrance.id || ''),
    label: entrance.label,
  })),
)

function selectEmbeddedEvacuationDestination(destinationId: string) {
  selectedEvacuationCandidateId.value = destinationId
  if (activeEvacuationRoute.value?.isReachable) {
    runEmbeddedEvacuation(destinationId)
  }
}

function runEmbeddedEvacuation(destinationId = '') {
  const source = getEmergencySourceAnchor(selectedEmbeddedSourceId.value)
  smartMapSelectionActions.setSelectedFacilityById(source.facilityId)
  runEvacuationPlanning({ preferredCandidateId: destinationId })
}

function openEmbeddedSensorPlacement() {
  manualSensorConfigVisible.value = true
  resetManualSensorDraft(false)
}

function closeEmbeddedSensorPlacement() {
  cancelManualSensorPlacement()
  manualSensorConfigVisible.value = false
}

function clearEmbeddedResults() {
  resetDiffusionSimulation()
  clearEvacuationPlanning()
  clearSourceInversionWorkflow()
}

function estimatedSourcePoint() {
  const estimatedSource = sourceWorkflowLayerState.getEstimatedSource()
  const point = estimatedSource?.mapPoint
  if (!point) return null
  const x = Number(point.x)
  const y = Number(point.y)
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}

watch(
  [
    () => diffusionState.currentFrame,
    currentDiffusionFrame,
    () => diffusionState.playing,
    () => diffusionState.speed,
    () => diffusionState.frameDurationMs,
    () => diffusionForm.frameStepSec,
  ],
  ([
    frameIndex,
    frame,
    isPlaying,
    playbackSpeed,
    frameDurationMs,
    frameStepSec,
  ]) => {
    emit('diffusion-frame', {
      frame,
      frameIndex,
      frameCount: diffusionFrames.value.length,
      source: getCurrentLeakSourcePoint(),
      gasColor: currentDiffusionGas.value.color,
      isPlaying: Boolean(isPlaying),
      frameStepSec: Number(frameStepSec),
      frameDurationMs: Number(frameDurationMs),
      playbackSpeed: Number(playbackSpeed),
    })
  },
  { deep: false },
)

watch(
  activeEvacuationRoute,
  (route) => {
    emit('evacuation-route', route?.isReachable ? { ...route } : null)
  },
  { deep: true },
)

watch(
  [coarseCandidateRegions, refinementCurrentIteration, refinementResult],
  ([candidates, refinement]) => {
    const estimatedPoint = estimatedSourcePoint()
    const stage = estimatedPoint
      ? 'particle'
      : refinement
        ? 'refinement'
        : 'coarse'
    emit('inversion-stage', {
      stage,
      candidates: [...candidates],
      refinement,
      estimatedPoint,
      credibleRadius95m:
        refinementResult.value?.estimatedSource?.credibleRadius95m ||
        refinementResult.value?.estimatedSource?.confidenceRadius ||
        null,
      posteriorDensityGeoJSON:
        (refinementResult.value?.posteriorDensityGeoJSON as SmartMapRecord) ||
        null,
      posteriorParticles:
        (refinementResult.value?.posteriorParticles as SmartMapRecord[]) ||
        null,
    })
  },
  { deep: false },
)

onMounted(() => {
  window.setTimeout(
    () => selectEmbeddedSource(selectedEmbeddedSourceId.value),
    240,
  )
})

// 只读扩散状态快照，供副屏（screen）顶层浮动控制条驱动按钮 disabled 态与帧进度显示。
// 不直接暴露 reactive diffusionState，避免外部组件意外篡改内部播放状态。
const diffusionStatus = computed(() => ({
  currentFrame: diffusionState.currentFrame,
  frameCount: diffusionFrames.value.length,
  isPlaying: diffusionState.playing,
  isRunning: diffusionState.running,
}))

defineExpose({
  selectSource: selectEmbeddedSource,
  runDiffusion: runDiffusionSimulation,
  toggleDiffusionPlayback,
  clearResults: clearEmbeddedResults,
  addSensor: openEmbeddedSensorPlacement,
  applyRealtimeWeather,
  runEvacuation: runEmbeddedEvacuation,
  runLeakTracing: runParticleFilterInversionPreview,
  selectEvacuationDestination: selectEmbeddedEvacuationDestination,
  diffusionStatus,
  selectedEmbeddedSourceId,
})
</script>

<style src="./index.css"></style>
