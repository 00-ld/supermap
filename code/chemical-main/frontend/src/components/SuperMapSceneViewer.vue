<template>
  <section class="supermap-scene-viewer">
    <div
      v-show="renderMode === 'native'"
      ref="sceneContainer"
      class="scene-canvas"
    ></div>
    <iframe
      v-if="renderMode === 'fallback'"
      :src="dashboardUrl"
      title="SuperMap iPortal 数字园区大屏"
      class="scene-fallback-frame"
      frameborder="0"
      allowfullscreen
    ></iframe>

    <div
      v-if="
        sceneMessage &&
        !statusPanelVisible &&
        (sceneState === 'error' || sceneState === 'fallback')
      "
      class="scene-inline-message"
      :class="sceneState"
    >
      {{ sceneMessage }}
    </div>

    <div
      v-if="!statusPanelVisible"
      class="gis-coordinate-readout"
      aria-label="GIS 坐标状态"
    >
      <div class="coordinate-system">
        <span>场景坐标</span>
        <strong>CGCS2000 · EPSG:4490</strong>
        <em>展示 / 交互 / 输出统一 EPSG:4490</em>
      </div>
      <div class="coordinate-live">
        <span>鼠标实时落点</span>
        <strong>{{ gisCursorText }}</strong>
        <em>CGCS2000 经纬度</em>
      </div>
      <div>
        <span>相机位置</span>
        <strong>{{ gisCameraText }}</strong>
        <em>CGCS2000 经纬度与高程</em>
      </div>
    </div>

    <aside
      v-if="activeInversionLegendStage && !statusPanelVisible"
      class="inversion-result-legend"
      aria-label="泄漏溯源结果图例"
    >
      <div class="inversion-legend-head">
        <div>
          <span>泄漏溯源</span>
          <strong>{{ inversionLegendTitle }}</strong>
        </div>
        <em>仅保留决策图层</em>
      </div>
      <div class="inversion-legend-items">
        <div v-for="item in inversionLegendItems" :key="item.id">
          <i
            :class="['legend-swatch', item.appearance]"
            :style="{ '--legend-color': item.color }"
          ></i>
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.detail }}</small>
          </span>
        </div>
      </div>
    </aside>

    <div v-if="statusPanelVisible" class="scene-status-panel">
      <div class="status-head">
        <div>
          <span class="status-kicker">SuperMap Digital Twin</span>
          <h1>化工园区三维应急态势入口</h1>
        </div>
        <span :class="['status-pill', sceneState]">{{ sceneStateText }}</span>
      </div>

      <div class="status-grid">
        <article>
          <span>三维场景</span>
          <strong>{{ activeSceneName }}</strong>
          <p>{{ sceneSourceText }}</p>
        </article>
        <article>
          <span>iServer 图层</span>
          <strong>{{ loadedLayerCount }}</strong>
          <p>{{ loadedLayerNames }}</p>
        </article>
        <article>
          <span>算法封装</span>
          <strong :class="algorithmState">{{ algorithmStateText }}</strong>
          <p>{{ algorithmDetailText }}</p>
        </article>
        <article>
          <span>{{ coordinateModeTitle }}</span>
          <strong>{{ coordinateModeName }}</strong>
          <p>{{ coordinateModeDetail }}</p>
        </article>
      </div>

      <div class="capability-row">
        <span v-for="item in algorithmCapabilities" :key="item">
          {{ item }}
        </span>
      </div>

      <div v-if="sceneMessage" class="scene-message">{{ sceneMessage }}</div>

      <div class="status-actions">
        <button type="button" @click="focusScene">定位园区</button>
        <button type="button" @click="focusGeoCenter">定位经纬度</button>
        <button type="button" @click="reloadScene">重新加载</button>
      </div>

      <div v-if="scenePresentationMode === 'local-s3m'" class="explode-panel">
        <div class="explode-head">
          <span>模型爆炸（抽屉拆解）</span>
          <button
            type="button"
            :disabled="!explodeReady"
            @click="explodeValue = 0"
          >
            复位
          </button>
        </div>
        <p v-if="explodeSummary" class="explode-summary">
          {{ explodeSummary }}
        </p>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :disabled="!explodeReady"
          v-model.number="explodeValue"
          aria-label="模型爆炸程度"
        />
        <div class="explode-axis">
          <button
            v-for="axis in EXPLODE_AXES"
            :key="axis"
            type="button"
            :class="{ active: explodeAxis === axis }"
            :disabled="!explodeReady"
            @click="explodeAxis = axis"
          >
            {{ axis.toUpperCase() }} 轴
          </button>
        </div>
      </div>

      <div class="algorithm-demo-panel">
        <div class="demo-head">
          <div>
            <span>算法空间化闭环</span>
            <strong :class="demoTaskState">{{ demoTaskStateText }}</strong>
          </div>
          <button type="button" @click="clearAlgorithmOverlays()">
            清除图层
          </button>
        </div>
        <p>{{ demoTaskMessage }}</p>
        <div class="demo-actions">
          <button
            type="button"
            :disabled="demoTaskState === 'running'"
            @click="runDiffusionDemo"
          >
            运行扩散
          </button>
          <button
            type="button"
            :disabled="demoTaskState === 'running'"
            @click="runParticleDemo"
          >
            粒子溯源
          </button>
          <button
            type="button"
            :disabled="demoTaskState === 'running'"
            @click="runEvacuationDemo"
          >
            疏散规划
          </button>
        </div>
        <div v-if="latestEvidence" class="evidence-card">
          <span>{{ latestEvidence.label }}</span>
          <strong>{{ latestEvidence.outputSummary }}</strong>
          <p>
            {{ latestEvidence.geoSummary }} · {{ latestEvidence.costMs }}ms ·
            {{ latestEvidence.requestId }}
          </p>
          <p>
            {{ latestEvidence.executionModeText }}
            <template v-if="latestEvidence.warning">
              · {{ latestEvidence.warning }}
            </template>
          </p>
        </div>
        <div v-if="selectedSensor" class="evidence-card sensor-card">
          <span>三维监控点</span>
          <strong>
            {{ selectedSensor.id }} · {{ selectedSensor.modelName }}
          </strong>
          <p>
            EPSG:4490 {{ sensorGeoText(selectedSensor) }} · H={{
              selectedSensor.installationHeight.toFixed(1)
            }}m
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import {
  checkAlgorithmHealth,
  runDiffusionSimulation,
  runParticleFilterInversion,
} from '@/api/algorithm'
import { mapLocalPlaneToThreeTilesAxes } from '@/utils/threeTilesAxisMapping'
import { resolveDiffusionSimulationSecondsPerRealSecond } from '@/utils/diffusionPlaybackTiming'
import type { AlgorithmHealth, AlgorithmRecord } from '@/api/algorithm'
import type { EnvironmentSnapshot } from '@/api/monitoringData'
import type {
  SuperMapProjectedPoint4547,
  SuperMapScenePickEventPayload,
} from '@/types/supermap-scene-events'
import type {
  SensorPlacementDraft,
  SensorPlacementPayload,
} from '@/types/supermap-scene'
import { MAP_METERS_PER_UNIT } from '@/data/coordinate'
import {
  clamp,
  ecefToGeo,
  geoToEcef,
  geoToProjectedApprox,
  getArrayLength,
  isPromiseLike,
  markerSvgDataUri,
  numberFromUnknown,
  stringFromUnknown,
  valueFromProperties,
} from '@/utils/geoMath'
import type { LocalCameraSnapshot, ThreeTilesGeoreference } from './sceneTypes'
import {
  computeLocalS3MCameraSnapshot,
  computeLocalS3MMinimumFocusDistance,
  computeLocalS3MTarget,
  createLocalS3MCameraView,
  resolveCameraZoomPolicy,
  resolveLocalSceneWheelZoomAmount,
  resolveS3MLayerLodSettings,
  resolveSceneProjection,
} from './localSceneCamera'
import {
  inversionVisualizationPolicy,
  resolveInversionLegendItems,
} from './inversionVisualizationPolicy'
import type { InversionVisualizationStage } from './inversionVisualizationPolicy'
import {
  isUsableSuperMapRuntime,
  resolveSuperMapRuntimeScriptCandidates,
} from './superMapRuntimeLoader'
import {
  createStagedSceneLayerName,
  findAddedSceneLayer,
  getSceneLayerKey,
  getSceneLayerCollectionValues,
  getSceneLayerInitializationState,
  monitorPromiseSettlement,
  throwIfPromiseRejected,
  type PromiseSettlementMonitor,
} from './sceneLayerCollection'
import {
  DEFAULT_CAMERA,
  DEFAULT_IPORTAL_URL,
  DEFAULT_LAYER_CONFIG,
  DEFAULT_SCENE_URL,
  DEFAULT_TILESET_URL,
  DEVICE_POINT_GRID_DEGREES,
  GLOBE_ALGORITHM_ALTITUDE_LIFT,
  LOCAL_CAMERA_GUARD_MARGIN,
  LOCAL_CAMERA_MAX_HEIGHT,
  LOCAL_CAMERA_MAX_WORLD_DRIFT,
  LOCAL_CAMERA_MIN_HEIGHT,
  LOCAL_CAMERA_SAFETY_CHECK_MS,
  LOCAL_S3M_BOUNDS,
  LOCAL_S3M_BUSINESS_OFFSET,
  LOCAL_S3M_DEFAULT_CAMERA,
  NATIVE_DIFFUSION_CELL_LIMIT,
  S3M_LAYER_READY_TIMEOUT_MS,
  S3M_PREFLIGHT_TIMEOUT_MS,
  THREE_TILES_FALLBACK_GEOREFERENCE,
  THREE_TILES_PERFORMANCE_OPTIONS,
  VOLUMETRIC_DIFFUSION_CELL_LIMIT,
} from './sceneConstants'
import {
  THREE_TILES_EQUIPMENT_ANCHORS,
  THREE_TILES_EQUIPMENT_BY_ID,
  THREE_TILES_ROUTE_GRAPH_EDGES,
  THREE_TILES_ROUTE_GRAPH_NODES,
  THREE_TILES_ROUTE_ROAD_NODE_IDS,
  THREE_TILES_ROUTE_ROADS,
} from './sceneData'
import {
  executeSuperMapClosestFacilitiesAnalysis,
  executeSuperMapNetworkAnalysis,
} from '@/views/screen/map-workspace/useSmartMapAlgorithmExecutors'
import type { SmartMapDiffusionFrame } from '@/views/screen/map-workspace/useSmartMapDiffusionLayer'
import type {
  SmartMapSourceCandidateRegion,
  SmartMapSourceRefinementIteration,
} from '@/views/screen/map-workspace/useSmartMapSourceInversionOverlay'
import {
  loadSuperMapPlanningInputs,
  loadSuperMapRoadNetwork,
} from '@/views/screen/map-workspace/useSuperMapIserverData'
import {
  SUPERMAP_CUP_SCENARIO,
  SUPERMAP_CUP_SENSORS,
  asRecord,
  buildSuperMapCupDiffusionPayload,
  buildSuperMapCupEvacuationPayload,
  buildSuperMapCupEvidence,
  buildSuperMapCupParticlePayload,
  mapPointToGeo,
  resolveRoutePath,
  selectFinalDiffusionFrame,
  type SuperMapCupEvidence,
  type SuperMapCupGeoPoint,
  type SuperMapCupMapPoint,
  type ModelBoundMonitorSensor,
} from '@/data/supermapCupScenario'
import { roads, type MapFacility } from '@/data/realMapAssets'
import {
  ZHENGZHOU_STATION_57083,
  algorithmToLocal,
  projectedToLocal,
  localToProjectedD,
  projectedToLocalD,
} from '@/data/supermapGeoreference'
import {
  loadDevicePoints,
  queryPublishedModelAttributesBySmId,
  queryEquipmentAssemblyByModelName,
  queryEquipmentAssemblyBySmId,
  type EquipmentAssembly,
  type GeoFeature,
} from '@/utils/clientSpatialQuery'
import {
  ENTRANCE_ANCHORS_4490,
  LEAK_SOURCE_ANCHORS_4490,
  SCENE_DEFINITIONS,
  getEntranceAnchor4490,
  getLeakSourceAnchor4490,
  getSceneDefinition,
  entranceToAnalysisPoint,
  isModelBoundPosition,
  leakSourceToAlgorithmPoint,
  type LeakSourceAnchor4490,
  type SceneAnchor4490,
} from '@/config/spatialAssets'

defineOptions({
  name: 'SuperMapSceneViewer',
})

const sceneViewerProps = withDefaults(
  defineProps<{
    showStatusPanel?: boolean
    showDevicePoints2026?: boolean
    environmentSnapshot?: EnvironmentSnapshot | null
    customSensors?: ModelBoundMonitorSensor[]
  }>(),
  {
    showStatusPanel: true,
    showDevicePoints2026: false,
    environmentSnapshot: null,
    customSensors: () => [],
  },
)

const emit = defineEmits<{
  (e: 'facility-click', id: string): void
  (e: 'scene-object-pick', payload: SuperMapScenePickEventPayload): void
  (e: 'sensor-placement', payload: SensorPlacementPayload): void
  (
    e: 'algorithm-status',
    payload: {
      kind: string
      state: DemoTaskState
      stateText: string
      message: string
      evidence: SuperMapCupEvidence | null
      selectedSensorId: string | null
    },
  ): void
  (e: 'evacuation-route', payload: EvacuationRouteSummary | null): void
  (e: 'diffusion-heatmap', payload: DiffusionHeatmapPayload | null): void
  (e: 'inversion-overlay', payload: InversionOverlayPayload | null): void
}>()

type SceneState = 'loading' | 'ready' | 'fallback' | 'error'
type RenderMode = 'native' | 'fallback'
type AlgorithmState = 'checking' | 'ready' | 'offline'
type DemoTaskState = 'idle' | 'running' | 'success' | 'error'
type ResultExecutionMode =
  | 'algorithm-service'
  | 'supermap-iserver'
  | 'local-fallback'
type SceneLoadSource = 'realspace' | 's3m' | '3d-tiles' | 'none'
type ScenePresentationMode = 'park' | 'local-s3m'
type SceneLoadResult = {
  loaded: boolean
  source: SceneLoadSource
  layerCount: number
  layerNames: string[]
  warnings: string[]
}
type DiffusionHeatmapPayload = {
  source: SuperMapCupMapPoint
  cells: Array<{
    x: number
    y: number
    size: number
    concentration: number
  }>
  peakConcentration: number
}
type DiffusionVolumeCell = {
  x: number
  y: number
  zOffsetMeters: number
  radiusMeters: number
  radiusAlongMeters: number
  radiusCrossMeters: number
  radiusVerticalMeters: number
  headingDegrees: number
  particleCount: number
  particleSeed: number
  shape: string
  speedFactor: number
  densityFactor: number
  turbulence: number
  concentration: number
  particleAgeSeconds?: number
  alongWindDistanceMeters?: number
  crossWindDistanceMeters?: number
  sourceDistanceMeters?: number
  level?: string
  velocityX?: number
  velocityY?: number
  velocityZMetersPerSecond?: number
}
/** 三维流场粒子运行时状态（复刻官方 ParticleVelocityField 生命周期语义）。 */
type VelocityParticle = {
  entity: unknown
  /** 局部图坐标（平面模式）或 ENU 偏移（地理模式）。 */
  localX: number
  localY: number
  zOffsetMeters: number
  velocityX: number
  velocityY: number
  velocityZMetersPerSecond: number
  ageMs: number
  lifeMs: number
  seed: number
  index: number
}
type InversionOverlayPayload = {
  point: SuperMapCupMapPoint
  radiusMeters: number
}
type UnifiedDiffusionFramePayload = {
  frame: SmartMapDiffusionFrame | null
  frameIndex: number
  frameCount: number
  source: SuperMapCupMapPoint | null
  gasColor: string
  isPlaying: boolean
  frameStepSec: number
  frameDurationMs: number
  playbackSpeed: number
}
type UnifiedInversionStagePayload = {
  stage: 'coarse' | 'refinement' | 'particle'
  candidates: SmartMapSourceCandidateRegion[]
  refinement: SmartMapSourceRefinementIteration | null
  estimatedPoint: SuperMapCupMapPoint | null
  credibleRadius95m?: number | null
  posteriorDensityGeoJSON?: AlgorithmRecord | null
  posteriorParticles?: AlgorithmRecord[] | null
}
type UnifiedEvacuationRoutePayload = AlgorithmRecord & {
  path?: SuperMapCupMapPoint[]
  candidateRoutes?: UnifiedEvacuationRoutePayload[]
  isReachable?: boolean
}
type OverlayGroup =
  | 'diffusion'
  | 'particle'
  | 'evacuation'
  | 'closest-facility'
  | 'temporary-selection'
type SceneEvidence = SuperMapCupEvidence & {
  executionMode: ResultExecutionMode
  executionModeText: string
  inputExecutionMode?: ResultExecutionMode
  warning?: string
}
type AlgorithmPickMode = 'leak-source' | 'evacuation-start' | null
type Vector3Like = { x?: number; y?: number; z?: number }
type EvacuationRouteSummary = {
  points: SuperMapCupMapPoint[]
  exitLabel: string
  planner: string
  distanceMeters: number
}
type DiffusionScreenOverlayCell = {
  x: number
  y: number
  radius: number
  opacity: number
  level: string
  delayMs: number
  durationMs: number
}
type GisCoordinateSnapshot = {
  longitude: number
  latitude: number
  altitude: number
  easting: number
  northing: number
  localX: number
  localY: number
  sceneX?: number
  sceneY?: number
  sceneZ?: number
}

type SuperMapRuntime = {
  Viewer: new (
    container: HTMLElement | string,
    options?: Record<string, unknown>,
  ) => SuperMapViewer
  Color?: SuperMapColorFactory
  SceneMode?: { SCENE3D?: unknown; COLUMBUS_VIEW?: unknown }
  Transforms?: {
    eastNorthUpToFixedFrame?: (origin: unknown) => unknown
  }
  ScreenSpaceEventHandler?: new (
    canvas: HTMLCanvasElement,
  ) => SuperMapClickHandler
  ScreenSpaceEventType?: { LEFT_CLICK?: unknown; MOUSE_MOVE?: unknown }
  CameraEventType?: {
    LEFT_DRAG?: unknown
    RIGHT_DRAG?: unknown
    MIDDLE_DRAG?: unknown
    WHEEL?: unknown
    PINCH?: unknown
  }
  Cartesian3?: SuperMapCartesian3Factory
  Cesium3DTileset?: SuperMapCesium3DTilesetFactory
  UrlTemplateImageryProvider?: new (options: Record<string, unknown>) => unknown
  createTileMapServiceImageryProvider?: (
    options: Record<string, unknown>,
  ) => unknown
  HeadingPitchRange?: new (
    heading: number,
    pitch: number,
    range: number,
  ) => unknown
  Matrix4?: { IDENTITY?: unknown }
  Cartographic?: {
    fromCartesian?: (
      cartesian: unknown,
    ) => { longitude: number; latitude: number; height?: number } | undefined
  }
  Math?: {
    toRadians: (value: number) => number
    toDegrees?: (value: number) => number
  }
  defined?: (value: unknown) => boolean
}

type SuperMapCesium3DTilesetFactory = {
  new (options: Record<string, unknown>): unknown
  fromUrl?: (url: string, options?: Record<string, unknown>) => Promise<unknown>
}

type SuperMapViewer = {
  scenePromise?: Promise<unknown>
  entities?: SuperMapEntityCollection
  imageryLayers?: {
    addImageryProvider?: (provider: unknown, index?: number) => unknown
    removeAll?: () => void
  }
  scene: {
    canvas: HTMLCanvasElement
    mode?: unknown
    morphTo3D?: (durationSeconds?: number) => void
    morphToColumbusView?: (durationSeconds?: number) => void
    globe?: {
      show: boolean
      baseColor?: unknown
      enableLighting?: boolean
      depthTestAgainstTerrain?: boolean
      pick?: (ray: unknown, scene: unknown) => unknown
    }
    skyAtmosphere?: { show: boolean }
    imageryLayers?: {
      addImageryProvider?: (provider: unknown, index?: number) => unknown
      removeAll?: () => void
    }
    primitives?: {
      add: (primitive: unknown) => unknown
      remove?: (primitive: unknown) => boolean
      get?: (index: number) => unknown
      length?: number
    }
    layers?: {
      remove?: (layer: unknown) => boolean
      removeAll?: () => void
    }
    screenSpaceCameraController?: {
      minimumZoomDistance?: number
      maximumZoomDistance?: number
      minimumCollisionTerrainHeight?: number
      enableCollisionDetection?: boolean
      enableRotate?: boolean
      enableTranslate?: boolean
      enableZoom?: boolean
      enableTilt?: boolean
      enableLook?: boolean
      inertiaSpin?: number
      inertiaTranslate?: number
      inertiaZoom?: number
      zoomEventTypes?: unknown
      tiltEventTypes?: unknown
      lookEventTypes?: unknown
      rotateEventTypes?: unknown
      enableInputs?: boolean
    }
    camera?: {
      position?: Vector3Like
      positionWC?: Vector3Like
      direction?: Vector3Like
      up?: Vector3Like
      frustum?: {
        near?: number
        far?: number
      }
      setView?: (options: Record<string, unknown>) => void
      flyTo?: (options: Record<string, unknown>) => void
      viewBoundingSphere?: (boundingSphere: unknown, offset?: unknown) => void
      flyToBoundingSphere?: (
        boundingSphere: unknown,
        options?: Record<string, unknown>,
      ) => void
      lookAtTransform?: (transform: unknown) => void
      lookAt?: (target: unknown, offset?: unknown) => void
      moveForward?: (amount: number) => void
      moveBackward?: (amount: number) => void
      lookUp?: (amount: number) => void
      getPickRay?: (position: unknown) => unknown
    }
    open?: (
      url: string,
      sceneName?: string,
      options?: Record<string, unknown>,
    ) => Promise<unknown>
    addS3MTilesLayerByScp?: (
      url: string,
      options?: Record<string, unknown>,
    ) => Promise<unknown>
    pick?: (position: unknown) => unknown
    pickPosition?: (position: unknown) => unknown
    clampToHeightSupported?: boolean
    clampToHeight?: (
      cartesian: unknown,
      objectsToExclude?: unknown[],
      width?: number,
      result?: unknown,
    ) => unknown
  }
  camera?: {
    position?: Vector3Like
    positionWC?: Vector3Like
    direction?: Vector3Like
    up?: Vector3Like
    frustum?: {
      near?: number
      far?: number
    }
    setView?: (options: Record<string, unknown>) => void
    flyTo?: (options: Record<string, unknown>) => void
    viewBoundingSphere?: (boundingSphere: unknown, offset?: unknown) => void
    flyToBoundingSphere?: (
      boundingSphere: unknown,
      options?: Record<string, unknown>,
    ) => void
    lookAtTransform?: (transform: unknown) => void
    lookAt?: (target: unknown, offset?: unknown) => void
    moveForward?: (amount: number) => void
    moveBackward?: (amount: number) => void
    lookUp?: (amount: number) => void
    getPickRay?: (position: unknown) => unknown
  }
  flyTo?: (target: unknown) => Promise<unknown>
  resize?: () => void
  destroy?: () => void
}

type SuperMapCartesian3Factory = {
  new (x: number, y: number, z: number): unknown
  fromDegrees?: (
    longitude: number,
    latitude: number,
    height?: number,
  ) => unknown
}

type SuperMapColor = {
  withAlpha?: (alpha: number) => SuperMapColor
}

type SuperMapColorFactory = {
  fromCssColorString?: (value: string) => SuperMapColor
  CYAN?: SuperMapColor
  LIME?: SuperMapColor
  ORANGE?: SuperMapColor
  RED?: SuperMapColor
  WHITE?: SuperMapColor
  YELLOW?: SuperMapColor
}

type SuperMapEntityCollection = {
  add: (options: Record<string, unknown>) => unknown
  remove: (entity: unknown) => boolean
}

type PickedFeature = {
  id?: string | number
  SmID?: string | number
  primitive?: {
    getProperty?: (name: string) => unknown
  }
  getProperty?: (name: string) => unknown
}

type SuperMapClickHandler = {
  setInputAction: (
    callback: (event: { position?: unknown; endPosition?: unknown }) => void,
    eventType: unknown,
  ) => void
  destroy: () => void
}

declare global {
  interface Window {
    Cesium?: SuperMapRuntime
    SuperMap?: SuperMapRuntime
    SuperMap3D?: SuperMapRuntime
    __supermapCupDebug?: {
      runtimeName?: string
      viewer?: SuperMapViewer | null
      layerPosition?: { longitude: number; latitude: number; height: number }
      layers?: unknown[]
      messages?: string[]
      sdkScripts?: string[]
      focusScene?: () => void
      flyToSensor?: (sensorId: string) => void
      runDiffusionDemo?: () => Promise<void>
      runParticleDemo?: () => Promise<void>
      runEvacuationDemo?: () => Promise<void>
      startLeakSourceSelection?: () => void
      startEvacuationStartSelection?: () => void
      focusEntrance?: (entranceId: string) => void
      getEvacuationResult?: () => AlgorithmRecord | null
      clearAlgorithmOverlays?: () => void
    }
  }
}

// 以下场景常量已抽离至 ./sceneConstants：
// DEFAULT_IPORTAL_URL / DEFAULT_SCENE_URL / DEFAULT_LAYER_CONFIG /
// DEFAULT_TILESET_URL / DEFAULT_CAMERA / THREE_TILES_FALLBACK_GEOREFERENCE /
// LOCAL_S3M_* / GLOBE_ALGORITHM_ALTITUDE_LIFT / NATIVE_DIFFUSION_CELL_LIMIT /
// VOLUMETRIC_DIFFUSION_CELL_LIMIT / THREE_TILES_PERFORMANCE_OPTIONS /
// S3M_LAYER_READY_TIMEOUT_MS / LOCAL_CAMERA_* / SENSOR_VISUAL_LIFT /
// DEVICE_POINT_GRID_DEGREES

const sceneContainer = ref<HTMLDivElement | null>(null)

// ===== 三维流场粒子系统状态（参考官方 ParticleVelocityField）=====
/** 功能开关：可在 .env 关闭，便于评审/演示。 */
const VELOCITY_FIELD_ENABLED =
  String(import.meta.env.VITE_FEATURE_VELOCITY_FIELD_3D ?? 'true') !== 'false'
/** 官方 particleLifeRange [5000,10000]ms 语义。 */
const VELOCITY_PARTICLE_LIFE_MIN_MS = 5000
const VELOCITY_PARTICLE_LIFE_MAX_MS = 10000
/** 官方 particleMode=1 点图元模式，pixelSize 2~4。 */
const VELOCITY_PARTICLE_PIXEL_SIZE = 4
// 动态 point 实体只负责表现流向；静态浓度粒子已经负责密度，限制重复实体避免逐帧重建卡顿。
const MAX_VELOCITY_PARTICLE_ENTITIES = 260
let velocityParticles: VelocityParticle[] = []
let velocityParticleLoopAttached = false
let lastVelocityParticleTickMs = 0
let velocityParticleAnimationFrame: number | null = null
let unifiedDiffusionPlaybackActive: boolean | null = null
let velocityParticleTimeScale = 1
const renderMode = ref<RenderMode>('native')
const sceneState = ref<SceneState>('loading')
const algorithmState = ref<AlgorithmState>('checking')
const algorithmHealth = ref<AlgorithmHealth | null>(null)
const sceneMessage = ref('')
const activeInversionLegendStage = ref<InversionVisualizationStage | null>(null)
const inversionLegendItems = computed(() =>
  activeInversionLegendStage.value
    ? resolveInversionLegendItems(activeInversionLegendStage.value)
    : [],
)
const inversionLegendTitle = computed(() => {
  if (activeInversionLegendStage.value === 'coarse') return '候选区域'
  if (activeInversionLegendStage.value === 'refinement') return '迭代收敛'
  return '最终估计'
})
/** 模型爆炸（抽屉拆解）控件：仅独立 S3M 场景（local-s3m）显示。 */
const EXPLODE_SLICE_COUNT = 10
const EXPLODE_AXES = ['x', 'y', 'z'] as const
type ExplodeAxis = (typeof EXPLODE_AXES)[number]
const explodeValue = ref(0)
const explodeAxis = ref<ExplodeAxis>('z')
const explodeReady = ref(false)
const explodeSummary = ref('')
const explodeLayer = shallowRef<unknown>(null)
let explodeSlices: number[][] = []
let explodeBounds: { spanX: number; spanY: number; spanZ: number } | null = null
/** S3MTilesLayer 上模型爆炸相关的 SDK 接口子集。 */
type ExplodeLayerHandle = {
  _baseUri?: string
  datasetInfo?: () => unknown
  setObjsTranslate?: (ids: number[], offset: unknown) => void
  removeAllObjsTranslate?: () => void
}
function asExplodeLayer(value: unknown): ExplodeLayerHandle {
  return value as ExplodeLayerHandle
}
const loadedLayers = ref<string[]>([])
const viewer = shallowRef<SuperMapViewer | null>(null)
let sceneResizeObserver: ResizeObserver | null = null
const clickHandler = shallowRef<SuperMapClickHandler | null>(null)
const demoTaskState = ref<DemoTaskState>('idle')
const demoTaskMessage = ref('等待运行算法')
const currentDemoTaskKind = ref('idle')
const diffusionResult = ref<AlgorithmRecord | null>(null)
const particleResult = ref<AlgorithmRecord | null>(null)
const evacuationResult = ref<AlgorithmRecord | null>(null)
const overlayEntityGroups = shallowRef<Record<OverlayGroup, unknown[]>>({
  diffusion: [],
  particle: [],
  evacuation: [],
  'closest-facility': [],
  'temporary-selection': [],
})
// 2026 配准版设备点位（1072，来自 DevicePoint_2D.geojson，Wgs84 经纬高直接放置）
const devicePointEntities = shallowRef<unknown[]>([])
const selectedEquipmentSmIds = ref<number[]>([])
const sceneContextEntities = shallowRef<unknown[]>([])
const diffusionScreenOverlayCells = ref<DiffusionScreenOverlayCell[]>([])
const routeScreenOverlayPoints = ref<Array<{ x: number; y: number }>>([])
const evidenceRecords = ref<SceneEvidence[]>([])
const primaryS3MLayer = shallowRef<unknown>(null)
const s3mLayers = shallowRef<unknown[]>([])
const threeTilesPrimitive = shallowRef<unknown>(null)
let activeSceneSwitchIndex: number | null = null
let activeSceneSwitchController: AbortController | null = null
const scenePresentationMode = ref<ScenePresentationMode>('park')
const activeS3MLayerIndex = ref(0)
const selectedSensor = ref<ModelBoundMonitorSensor | null>(null)
const lastStableLocalCamera = shallowRef<LocalCameraSnapshot | null>(null)
const threeTilesGeoreference = shallowRef<ThreeTilesGeoreference>(
  THREE_TILES_FALLBACK_GEOREFERENCE,
)
const pendingSensorPlacement = ref<SensorPlacementDraft | null>(null)
const algorithmPickMode = ref<AlgorithmPickMode>(null)
const selectedLeakSourcePoint = ref<SuperMapCupMapPoint | null>(null)
const activeLeakSourceId = ref(LEAK_SOURCE_ANCHORS_4490[0]?.leakSourceId || '')
const selectedEvacuationStartPoint = ref<SuperMapCupMapPoint | null>(null)
const selectedEvacuationExitId = ref('park-south')
const gisCursor = ref<GisCoordinateSnapshot | null>(null)
const gisCamera = ref<GisCoordinateSnapshot | null>(null)
const sceneProjectionMode = ref<'2d' | '3d'>('3d')
const savedThreeDimensionalCamera = shallowRef<LocalCameraSnapshot | null>(null)
let sceneProjectionSwitchSequence = 0
let localCameraGuardTimer: number | undefined
let localCameraGuardRecovering = false
let localSceneDomGuardCleanup: (() => void) | null = null
let localCameraAnchor: LocalCameraSnapshot | null = null
let localCameraLastRecoveryAt = 0
let localSceneFocusTarget: { x: number; y: number; z: number } | null = null
let localSceneMinimumFocusDistanceMeters = 0.08
let gisCoordinateCleanup: (() => void) | null = null
let gisCameraTimer: number | undefined
let activeDemoTaskId = 0
let sceneGeneration = 0
let componentDestroyed = false
let activeDemoTaskGeneration = 0
let activeOverlayGroup: OverlayGroup | null = null
const pendingTimeouts = new Set<number>()

const dashboardUrl = computed(
  () => import.meta.env.VITE_IPORTAL_DASHBOARD_URL || DEFAULT_IPORTAL_URL,
)
const statusPanelVisible = computed(() => sceneViewerProps.showStatusPanel)
const sceneSensors = computed(() => [
  ...SUPERMAP_CUP_SENSORS,
  ...sceneViewerProps.customSensors,
])
// 以下场景静态数据已抽离至 ./sceneData：
// THREE_TILES_SENSOR_STANDARD_BASIS / THREE_TILES_SENSOR_RULES /
// FACILITY_GRID_SLOTS / FACILITY_TANK_SLOTS / FACILITY_EDGE_SLOTS /
// THREE_TILES_VISIBLE_FACILITIES / THREE_TILES_EQUIPMENT_ANCHORS /
// THREE_TILES_EQUIPMENT_BY_ID / THREE_TILES_ROUTE_ROADS /
// THREE_TILES_ROUTE_GRAPH_NODES / THREE_TILES_ROUTE_GRAPH_EDGES /
// THREE_TILES_ROUTE_ROAD_NODE_IDS
// （THREE_TILES_SAFE_EXITS 依赖运行时函数，暂留本文件）
const THREE_TILES_SAFE_EXITS = ENTRANCE_ANCHORS_4490.map((entrance) => ({
  id: entrance.entranceId,
  label: entrance.name,
  point: entranceToAnalysisPoint(entrance),
}))
const sdkBaseUrl = computed(() =>
  trimTrailingSlash(import.meta.env.VITE_SUPERMAP3D_BASE_URL || '/supermap3d'),
)
const sdkScriptUrl = computed(
  () =>
    import.meta.env.VITE_SUPERMAP3D_SCRIPT_URL ||
    `${sdkBaseUrl.value}/SuperMap3D.js`,
)
const sdkStyleUrl = computed(
  () =>
    import.meta.env.VITE_SUPERMAP3D_STYLE_URL ||
    `${sdkBaseUrl.value}/Widgets/widgets.css`,
)
const runtimeScriptCandidates = computed(() =>
  resolveSuperMapRuntimeScriptCandidates(sdkScriptUrl.value, sdkBaseUrl.value),
)
const runtimeStyleCandidates = computed(() =>
  uniqueValues([sdkStyleUrl.value, `${sdkBaseUrl.value}/Widgets/widgets.css`]),
)
const sceneUrl = computed(
  () => import.meta.env.VITE_SUPERMAP_3D_SCENE_URL || DEFAULT_SCENE_URL,
)
const sceneName = computed(
  () => import.meta.env.VITE_SUPERMAP_3D_SCENE_NAME || '默认场景',
)
const tilesetUrl = computed(() =>
  import.meta.env.DEV
    ? '/local-pic/chemical-park-3dtiles/tileset_open_parcel_57083.json'
    : import.meta.env.VITE_SUPERMAP_3D_TILESET_URL || DEFAULT_TILESET_URL,
)
const shouldUseThreeDTiles = computed(
  () =>
    scenePresentationMode.value === 'park' &&
    Boolean(tilesetUrl.value) &&
    import.meta.env.VITE_SUPERMAP_3D_USE_3DTILES === 'true',
)
const shouldPreferPublishedScene = computed(
  () => import.meta.env.VITE_SUPERMAP_3D_PREFER_SCENE === 'true',
)
const layerConfigs = computed(() => {
  if (import.meta.env.VITE_FEATURE_SCENE_REGISTRY_4490 === 'false') {
    const raw =
      import.meta.env.VITE_SUPERMAP_3D_LAYER_CONFIGS || DEFAULT_LAYER_CONFIG
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  const configured = SCENE_DEFINITIONS.map((scene) => scene.configUrl)
  if (configured.length) return configured
  const raw =
    import.meta.env.VITE_SUPERMAP_3D_LAYER_CONFIGS || DEFAULT_LAYER_CONFIG
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
})
const s3mLayerPosition = computed(() =>
  parseGeoPosition(import.meta.env.VITE_SUPERMAP_3D_LAYER_POSITION),
)
const shouldApplyLayerPosition = computed(
  () =>
    scenePresentationMode.value === 'park' &&
    import.meta.env.VITE_SUPERMAP_3D_APPLY_LAYER_POSITION === 'true',
)
const geographicSceneMode = computed(
  () =>
    resolveSceneProjection(
      scenePresentationMode.value,
      shouldUseThreeDTiles.value,
    ).isGeographic,
)
const defaultCamera = computed(() =>
  parseCamera(import.meta.env.VITE_SUPERMAP_3D_DEFAULT_CAMERA),
)
const activeSceneName = computed(() => sceneName.value || '默认场景')
const loadedLayerCount = computed(() => loadedLayers.value.length)
const loadedLayerNames = computed(() => {
  if (!loadedLayers.value.length) return '等待三维图层返回'
  return loadedLayers.value.slice(0, 3).join(' / ')
})
const sceneSourceText = computed(() => {
  if (renderMode.value === 'fallback') return 'iPortal 大屏兜底展示'
  if (shouldUseThreeDTiles.value)
    return 'iClient3D WebGL + 3D Tiles / CGCS2000(EPSG:4490) 球面场景'
  return shouldApplyLayerPosition.value
    ? 'iClient3D WebGL + S3M config / CGCS2000(EPSG:4490) 算法叠加'
    : 'iServer Realspace + iClient3D WebGL / S3M 本地缓存'
})
const sceneStateText = computed(() => {
  if (sceneState.value === 'ready') return '原生三维已加载'
  if (sceneState.value === 'fallback') return 'iPortal 兜底'
  if (sceneState.value === 'error') return '三维加载失败'
  return '正在加载'
})
const algorithmStateText = computed(() => {
  if (algorithmState.value === 'ready') return '在线'
  if (algorithmState.value === 'offline') return '离线'
  return '检查中'
})
const algorithmDetailText = computed(() => {
  if (algorithmHealth.value) {
    return `${algorithmHealth.value.service} ${algorithmHealth.value.version}`
  }
  if (algorithmState.value === 'offline')
    return '保留 /algorithm-api 统一服务入口'
  return '正在请求 /algorithm-api/api/health'
})
const algorithmCapabilities = [
  '扩散模拟',
  '泄漏源反演',
  '粒子滤波溯源',
  '疏散路径规划',
  '气体类型目录',
]
const coordinateSummary = computed(() => {
  const geo = SUPERMAP_CUP_SCENARIO.sourceGeoPoint
  return `${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N`
})
const coordinateModeTitle = computed(() => '球面坐标')
const coordinateModeName = computed(() => 'CGCS2000 / EPSG:4490')
const coordinateModeDetail = computed(() =>
  shouldApplyLayerPosition.value
    ? `57083 锚点 ${layerPositionSummary.value} / 算法源点 ${coordinateSummary.value}`
    : shouldUseThreeDTiles.value
      ? `3D Tiles 已按 57083 锚点发布到球面；监控点和算法证据使用经纬高 ${coordinateSummary.value}`
      : `S3M 本地缓存以 57083 为 CGCS2000 锚点；监控点和算法证据按 EPSG:4547/4490 换算 ${coordinateSummary.value}`,
)
const layerPositionSummary = computed(() => {
  const position = s3mLayerPosition.value
  return `${position.longitude.toFixed(6)}E, ${position.latitude.toFixed(6)}N`
})
const overlayCoordinateLabel = computed(() => 'CGCS2000 EPSG:4490 经纬度')
const demoTaskStateText = computed(() => {
  if (demoTaskState.value === 'running') return '运行中'
  if (demoTaskState.value === 'success') return '已落图'
  if (demoTaskState.value === 'error') return '失败'
  return '待运行'
})
const latestEvidence = computed(() => evidenceRecords.value[0] || null)
const gisCursorText = computed(() => formatGisGeographic(gisCursor.value))
const gisCameraText = computed(() => formatGisGeographic(gisCamera.value))

function observeSceneContainerResize() {
  sceneResizeObserver?.disconnect()
  sceneResizeObserver = null
  const container = sceneContainer.value
  if (!container || typeof ResizeObserver === 'undefined') return
  sceneResizeObserver = new ResizeObserver(() => {
    const currentViewer = viewer.value
    if (!currentViewer || componentDestroyed) return
    currentViewer.resize?.()
    requestSceneRender()
  })
  sceneResizeObserver.observe(container)
}

onMounted(async () => {
  componentDestroyed = false
  observeSceneContainerResize()
  await Promise.allSettled([bootstrapScene(), refreshAlgorithmHealth()])
})

onBeforeUnmount(() => {
  componentDestroyed = true
  stopVelocityParticleLoop()
  sceneResizeObserver?.disconnect()
  sceneResizeObserver = null
  invalidatePendingWork()
  clearDevicePointLayer()
  resetSceneExplode()
  destroyScene()
})

// 2026 配准版设备点位图层：场景就绪或开关变化时（重新）渲染
watch(
  () => [
    sceneViewerProps.showDevicePoints2026,
    sceneState.value,
    geographicSceneMode.value,
  ],
  () => {
    if (sceneState.value === 'ready') void renderDevicePointLayer()
  },
)

defineExpose({
  focusScene,
  focusS3MLayer,
  focusGeoCenter,
  reloadScene,
  clearAlgorithmOverlays,
  runDiffusionDemo,
  runParticleDemo,
  runEvacuationDemo,
  runClosestDeviceDemo,
  startLeakSourceSelection,
  selectFixedLeakSource,
  startEvacuationStartSelection,
  selectEvacuationExit,
  flyToSensor,
  selectSensor,
  startSensorPlacement,
  cancelSensorPlacement,
  captureCameraView,
  applyCameraView,
  setSceneProjectionMode,
  renderUnifiedDiffusionFrame,
  renderUnifiedInversionStage,
  renderUnifiedEvacuationRoute,
})

async function bootstrapScene() {
  const generation = ++sceneGeneration
  enterNativeLoading()
  loadedLayers.value = []
  s3mLayers.value = []
  await nextTick()

  try {
    const runtime = await loadSuperMapRuntime()
    if (!isSceneGenerationActive(generation)) return
    if (!sceneContainer.value) throw new Error('三维容器未挂载')
    sceneContainer.value.replaceChildren()
    sceneProjectionMode.value = '3d'

    viewer.value = markRaw(
      new runtime.Viewer(sceneContainer.value, {
        animation: false,
        timeline: false,
        infoBox: false,
        selectionIndicator: false,
        homeButton: false,
        geocoder: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        shouldAnimate: true,
        // 必须允许同一 Viewer 在 SCENE3D 与 COLUMBUS_VIEW 间切换。
        // 这里不改变场景数据 CRS；模型、相机锚点和对外坐标仍统一为 EPSG:4490。
        scene3DOnly: false,
        shadows: false,
        terrainShadows: false,
        orderIndependentTranslucency: false,
        contextOptions: {
          // 2026 官方范例的 WebGL2 引擎类型；S3M 3.01 必须与 2026
          // SDK 配套，否则会出现瓦片 200 但不绘制的空场景。
          contextType: 2,
          webgl: {
            alpha: false,
            antialias: false,
            // 频繁切换园区 3D Tiles 与独立 S3M 时保留绘制缓冲会占用整张画布显存，
            // 部分驱动会因此丢失 WebGL context；截图由浏览器/CDP 捕获，无需保留该缓冲。
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
          },
        },
      }),
    )
    if (import.meta.env.DEV) {
      ;(
        globalThis as typeof globalThis & {
          __CHEMICAL_SUPERMAP_VIEWER__?: SuperMapViewer
        }
      ).__CHEMICAL_SUPERMAP_VIEWER__ = viewer.value
    }
    if (isPromiseLike(viewer.value.scenePromise)) {
      await withTimeout(
        Promise.resolve(viewer.value.scenePromise),
        30000,
        'SuperMap3D 场景初始化超时',
      )
    }
    if (!isSceneGenerationActive(generation)) return
    viewer.value.resize?.()
    updateDebugState(runtime)

    const currentViewer = viewer.value
    const currentScene = currentViewer.scene
    if (!currentScene) {
      throw new Error(
        `当前 SuperMap3D Viewer 未暴露 scene；runtime=${describeRuntime(runtime)}`,
      )
    }
    if (currentScene.globe) {
      currentScene.globe.show = geographicSceneMode.value
      currentScene.globe.enableLighting = false
      currentScene.globe.depthTestAgainstTerrain = false
      currentScene.globe.baseColor = colorFromCss(
        geographicSceneMode.value ? '#74865a' : '#142033',
        1,
      )
    }
    if (currentScene.skyAtmosphere)
      currentScene.skyAtmosphere.show = geographicSceneMode.value
    const sceneRecord = currentScene as Record<string, unknown>
    sceneRecord.highDynamicRange = false
    sceneRecord.shadows = false
    if (sceneRecord.fog && typeof sceneRecord.fog === 'object') {
      ;(sceneRecord.fog as Record<string, unknown>).enabled = false
    }
    if (sceneRecord.sun && typeof sceneRecord.sun === 'object') {
      ;(sceneRecord.sun as Record<string, unknown>).show = false
    }
    if (sceneRecord.moon && typeof sceneRecord.moon === 'object') {
      ;(sceneRecord.moon as Record<string, unknown>).show = false
    }
    if (sceneRecord.skyBox && typeof sceneRecord.skyBox === 'object') {
      ;(sceneRecord.skyBox as Record<string, unknown>).show =
        geographicSceneMode.value
    }
    // 保持发布缓存中的 PBR/纹理基色：此前 gamma=1.18 与 canvas CSS 二次提亮会
    // 叠加改变材质和色彩，导致 Web 与 iDesktop/iServer 预览明显不一致。
    sceneRecord.gamma = 1
    sceneRecord.fxaa = false
    configureCloseRangeSceneStability(currentViewer)
    // 论文 5.1.3 隐含的帧率优化：开启按需渲染，3D 场景静止时停止 RAF 节省 CPU/GPU。
    // maximumRenderTimeChange=Infinity 表示完全手动驱动，必须由 entity/layer 变更处显式 requestRender()。
    // 本项目 3D scene 无自驱逐帧动画（扩散帧播放走 2D Canvas），故适用。
    // 相机 flyTo 由 Cesium 内部自动请求渲染；entity 增删的绘制函数末尾已补 requestRender()。
    if ('requestRenderMode' in currentScene) {
      // S3M 图层的瓦片选择和流式请求依赖连续帧更新；只对 3D Tiles 保持按需渲染。
      ;(currentScene as Record<string, unknown>).requestRenderMode =
        shouldUseThreeDTiles.value
      ;(currentScene as Record<string, unknown>).maximumRenderTimeChange =
        shouldUseThreeDTiles.value ? Infinity : 0
    }
    installEarthImagery(runtime, currentViewer)
    // S3M 的瓦片选择依赖当前视锥。图层 Promise 返回前先把相机放到模型范围，
    // 否则 SDK 停留在默认全球视角，根瓦片不会进入请求队列，最终触发前端超时兜底。
    if (geographicSceneMode.value) setDefaultCamera(runtime)
    else applyLocalDefaultCamera(runtime)
    requestSceneRender()

    const sceneLoad = await openScene(runtime)
    if (!isSceneGenerationActive(generation)) return
    if (!sceneLoad.loaded || sceneLoad.layerCount < 1) {
      throw new Error('所有原生三维来源均不可用')
    }
    if (sceneLoad.source === 'realspace') {
      // iClient3D 2026 在 Realspace 图层异步就绪时可能覆盖 open()
      // 的 autoSetView。使用 iDesktop 发布场景保存的相机，并在首批瓦片
      // 进入后再复位一次，确保主视角始终看到园区模型。
      setDefaultCamera(runtime)
      requestSceneRender()
      scheduleSceneTimeout(
        currentViewer,
        () => {
          setDefaultCamera(runtime)
          requestSceneRender()
        },
        1800,
      )
    }
    if (shouldUseThreeDTiles.value) {
      setThreeTilesEarthArrivalStart(runtime)
      scheduleSceneTimeout(
        currentViewer,
        () => {
          void focusThreeTilesOverview(runtime, true)
        },
        520,
      )
    } else if (scenePresentationMode.value === 'local-s3m') {
      captureRealspaceCameraSnapshot()
    } else if (shouldApplyLayerPosition.value) {
      scheduleSceneTimeout(
        currentViewer,
        () => {
          void flyToPrimaryLayer()
        },
        900,
      )
    } else {
      // 最新 4490 合并模型使用单 SCP 直读时同样沿用 iDesktop 发布相机。
      // 旧的 lookUp/moveBackward 兼容动作会把俯视角翻成仰视并移出模型范围。
      setDefaultCamera(runtime)
      requestSceneRender()
      scheduleSceneTimeout(
        currentViewer,
        () => {
          setDefaultCamera(runtime)
          requestSceneRender()
        },
        1800,
      )
      captureRealspaceCameraSnapshot()
    }
    setupPicking(runtime)
    addLeakSourceCandidateEntities()
    setupGisCoordinateReadout(runtime)
    if (shouldUseThreeDTiles.value) enableFreeSceneInteraction()
    else if (scenePresentationMode.value === 'local-s3m')
      enableFreeSceneInteraction()
    else if (shouldApplyLayerPosition.value)
      setupLocalSceneInteractionGuard(runtime)
    else enableFreeSceneInteraction()
    enterNativeReady(
      sceneMessage.value ||
        '已用 SuperMap iClient3D 加载化工园区 Realspace 三维场景；支持自由旋转、平移和滚轮缩放。',
    )
  } catch (error) {
    if (!isSceneGenerationActive(generation)) return
    const message =
      error instanceof Error ? error.message : 'SuperMap SDK 加载失败'
    pushDebugMessage(message)
    if (hasDashboardUrl())
      enterFallback(`${message}；已切换至 iPortal 兜底展示。`)
    else enterFatalError(`${message}；iPortal 地址不可用。`)
  }
}

function enterNativeLoading(message = '') {
  sceneState.value = 'loading'
  renderMode.value = 'native'
  sceneMessage.value = message
}

function enterNativeReady(message: string) {
  sceneState.value = 'ready'
  renderMode.value = 'native'
  sceneMessage.value = message
}

function enterFallback(message: string) {
  destroyScene()
  sceneState.value = 'fallback'
  renderMode.value = 'fallback'
  sceneMessage.value = message
}

function enterFatalError(message: string) {
  destroyScene()
  sceneState.value = 'error'
  renderMode.value = 'native'
  sceneMessage.value = message
}

function hasDashboardUrl() {
  return Boolean(dashboardUrl.value.trim())
}

function isSceneGenerationActive(generation: number) {
  return !componentDestroyed && generation === sceneGeneration
}

function assertSceneTransactionActive(
  generation: number,
  currentViewer: SuperMapViewer,
) {
  if (isSceneGenerationActive(generation) && viewer.value === currentViewer)
    return
  throw createSceneTransactionCancelledError()
}

function createSceneTransactionCancelledError() {
  const error = new Error('场景切换已被更新请求取代')
  error.name = 'SceneTransactionCancelledError'
  return error
}

function isSceneTransactionCancelled(error: unknown) {
  return (
    error instanceof Error && error.name === 'SceneTransactionCancelledError'
  )
}

function invalidatePendingWork() {
  activeDemoTaskId += 1
  activeSceneSwitchController?.abort()
  activeSceneSwitchController = null
  sceneGeneration += 1
}

function captureRealspaceCameraSnapshot() {
  const currentViewer = viewer.value
  scheduleSceneTimeout(
    currentViewer,
    () => {
      const snapshot = readLocalCameraSnapshot()
      if (!snapshot) return
      localCameraAnchor = snapshot
      lastStableLocalCamera.value = snapshot
    },
    1300,
  )
  scheduleSceneTimeout(
    currentViewer,
    () => {
      const snapshot = readLocalCameraSnapshot()
      if (!snapshot) return
      localCameraAnchor = snapshot
      lastStableLocalCamera.value = snapshot
    },
    2600,
  )
}

async function openScene(runtime: SuperMapRuntime): Promise<SceneLoadResult> {
  const currentViewer = viewer.value
  if (!currentViewer) throw new Error('三维 Viewer 初始化失败')
  if (!currentViewer.scene)
    throw new Error(
      '当前 SuperMap3D Viewer 未暴露 scene，请检查 SDK 入口文件是否匹配 iClient3D WebGL',
    )

  if (
    shouldUseThreeDTiles.value &&
    scenePresentationMode.value !== 'local-s3m'
  ) {
    await openThreeDTileset(currentViewer, runtime)
    sceneMessage.value = `已用 SuperMap iClient3D 加载化工园区 3D Tiles；监控点按 SensorThings + GB/T 50493-2019 贴附设备，疏散路径按 iServer 网络分析/CGCS2000(EPSG:4547) 道路锚点落到 EPSG:4490 球面。`
    return createSceneLoadResult('3d-tiles')
  }

  if (shouldPreferPublishedScene.value) {
    const publishedSceneResult = await tryOpenPublishedScene(currentViewer)
    if (publishedSceneResult) return publishedSceneResult
  }

  if (currentViewer.scene.addS3MTilesLayerByScp && layerConfigs.value.length) {
    const targetLayerIndex =
      scenePresentationMode.value === 'local-s3m'
        ? activeS3MLayerIndex.value
        : 0
    await openS3MConfigLayers(currentViewer, targetLayerIndex, true, 1)
    if (scenePresentationMode.value === 'local-s3m') {
      const layerName = resolveLayerName(
        layerConfigs.value[targetLayerIndex] || '',
        targetLayerIndex,
      )
      sceneMessage.value = `已进入 ${layerName} 独立 S3M 场景（EPSG:0 本地米制坐标）。`
      return createSceneLoadResult('s3m')
    }
    sceneMessage.value = shouldApplyLayerPosition.value
      ? `S3M 主场景 config 已通过 iClient3D 请求；算法图层按 57083 锚点 ${layerPositionSummary.value} 落球面。`
      : 'S3M 主场景已按 iServer 发布的 EPSG:4490 地理坐标直接加载；可通过右侧模型列表定位厂房和设备细节。'
    return createSceneLoadResult('s3m')
  }

  const publishedSceneResult = await tryOpenPublishedScene(currentViewer)
  if (publishedSceneResult) return publishedSceneResult

  if (!currentViewer.scene.open || !sceneUrl.value) {
    throw new Error('没有可用的 iServer 三维场景或 S3M config 地址')
  }
  throw new Error('所有原生三维来源均不可用')
}

async function tryOpenPublishedScene(
  currentViewer: SuperMapViewer,
): Promise<SceneLoadResult | null> {
  if (!currentViewer.scene.open || !sceneUrl.value) return null
  try {
    await withTimeout(
      currentViewer.scene.open(sceneUrl.value, sceneName.value, {
        autoSetView: true,
      }),
      45000,
      'iServer Realspace 场景加载超时',
    )
    hidePublishedDevicePointLayer(currentViewer)
    scheduleSceneTimeout(
      currentViewer,
      () => {
        hidePublishedDevicePointLayer(currentViewer)
      },
      800,
    )
    loadedLayers.value.push(activeSceneName.value)
    return createSceneLoadResult('realspace')
  } catch (error) {
    sceneMessage.value =
      error instanceof Error ? error.message : 'iServer Realspace 场景加载失败'
    pushDebugMessage(sceneMessage.value)
    if (shouldApplyLayerPosition.value) throw error
    return null
  }
}

/**
 * 发布工作空间保留 DevicePoint 数据服务用于空间查询，但前端使用自己的轻量点位样式。
 * 隐藏工作空间自带的高亮图标，避免同一批点位重复绘制。
 */
function hidePublishedDevicePointLayer(currentViewer: SuperMapViewer) {
  const layers = currentViewer.scene.layers as
    | {
        find?: (name: string) => unknown
        get?: (index: number) => unknown
        length?: number
        layerQueue?: unknown
        _layers?: unknown
      }
    | undefined
  if (!layers) return
  const candidates: unknown[] = []
  const publishedLayer = layers.find?.(
    'DevicePoint_with_view_ZP@DevicePoint_with_view',
  )
  if (publishedLayer) candidates.push(publishedLayer)
  const layerCount = Number(layers.length ?? 0)
  if (layers.get && Number.isFinite(layerCount)) {
    for (let index = 0; index < layerCount; index += 1) {
      candidates.push(layers.get(index))
    }
  }
  candidates.push(
    ...getSceneLayerCollectionValues(layers.layerQueue),
    ...getSceneLayerCollectionValues(layers._layers),
  )
  candidates.forEach((layer) => {
    if (!layer || typeof layer !== 'object') return
    const layerRecord = layer as Record<string, unknown>
    const layerName = String(
      layerRecord.name ?? layerRecord.caption ?? layerRecord.id ?? '',
    )
    if (!/DevicePoint_with_view/i.test(layerName)) return
    try {
      layerRecord.visible = false
    } catch {
      // 部分 SDK 版本的只读图层对象不允许写 visible；继续保留前端轻量点位。
    }
  })
  requestSceneRender()
}

function createSceneLoadResult(
  source: Exclude<SceneLoadSource, 'none'>,
): SceneLoadResult {
  const layerNames = [...loadedLayers.value]
  return {
    loaded: layerNames.length > 0,
    source: layerNames.length > 0 ? source : 'none',
    layerCount: layerNames.length,
    layerNames,
    warnings: sceneMessage.value ? [sceneMessage.value] : [],
  }
}

async function openThreeDTileset(
  currentViewer: SuperMapViewer,
  runtime: SuperMapRuntime,
) {
  if (!runtime.Cesium3DTileset)
    throw new Error(
      '当前 SuperMap3D SDK 未暴露 Cesium3DTileset，无法加载 3D Tiles 场景',
    )
  if (!currentViewer.scene.primitives?.add)
    throw new Error(
      '当前 SuperMap3D scene 未暴露 primitives，无法加载 3D Tiles 场景',
    )

  threeTilesGeoreference.value = await loadThreeTilesGeoreference()
  // F9 修复（2026-07-19）：原配置 SSE=4（默认16，越小越激进）+ 关闭所有裁剪/降级 +
  // loadSiblings:true + preloadFlightDestinations:true → 221 个 b3dm 全量并发 →
  // ERR_INSUFFICIENT_RESOURCES → Rendering has stopped → Worker JS 都 fetch 失败 → 页面死。
  // 改回 Cesium 官方推荐保守值：开 HLOD 跳级加载、SSE 提高让远距离不加载精细层、开移动裁剪与
  // 子节点边界裁剪、开动态 SSE（factor 加倍远距离更激进降级）与中心优先、关兄弟/飞行预加载。
  // 当前经验证配置：SSE=8、dynamicScreenSpaceErrorFactor=4、maximumMemoryUsage=768MB。
  // cacheBytes=805306368（768MiB）与 maximumMemoryUsage（旧版 MB 单位）并存，按 SDK 版本取其一。
  // cacheBytes（Cesium 1.97+ 字节单位）与 maximumMemoryUsage（旧版 MB 单位）并存，按 SDK 版本取其一。
  const options: Record<string, unknown> = {
    maximumScreenSpaceError:
      THREE_TILES_PERFORMANCE_OPTIONS.maximumScreenSpaceError,
    skipLevelOfDetail: false,
    immediatelyLoadDesiredLevelOfDetail: false,
    // 当前园区 3D Tiles 存在部分子节点包围盒/LOD 元数据不一致；旋转时若
    // 取消在途请求会出现已显示模型突然消失。正式修复仍需重新切片，运行时
    // 先保留在途瓦片，避免相机微小转动造成可见性抖动。
    cullRequestsWhileMoving: false,
    cullRequestsWhileMovingMultiplier: 60,
    cullWithChildrenBounds: false,
    dynamicScreenSpaceError: true,
    dynamicScreenSpaceErrorDensity: 0.00278,
    dynamicScreenSpaceErrorFactor:
      THREE_TILES_PERFORMANCE_OPTIONS.dynamicScreenSpaceErrorFactor,
    foveatedScreenSpaceError: true,
    loadSiblings: false,
    preloadFlightDestinations: false,
    maximumMemoryUsage: THREE_TILES_PERFORMANCE_OPTIONS.maximumMemoryUsage,
    cacheBytes: THREE_TILES_PERFORMANCE_OPTIONS.cacheBytes,
  }
  const tileset = runtime.Cesium3DTileset.fromUrl
    ? await withTimeout(
        runtime.Cesium3DTileset.fromUrl(tilesetUrl.value, options),
        45000,
        '化工园区 3D Tiles 场景加载超时',
      )
    : new runtime.Cesium3DTileset({ url: tilesetUrl.value, ...options })
  if (componentDestroyed || viewer.value !== currentViewer) {
    throw new Error('组件已重载，旧场景加载结果已忽略')
  }
  const primitive = currentViewer.scene.primitives.add(tileset)
  const record =
    primitive && typeof primitive === 'object'
      ? (primitive as Record<string, unknown>)
      : null
  stabilizeThreeTilesetRecord(record)
  brightenThreeTileset(runtime, record)
  const readyPromise = record?.readyPromise
  if (isPromiseLike(readyPromise)) {
    await withTimeout(
      Promise.resolve(readyPromise),
      45000,
      '化工园区 3D Tiles 场景准备超时',
    )
  }
  if (componentDestroyed || viewer.value !== currentViewer) {
    throw new Error('组件已重载，旧场景加载结果已忽略')
  }
  threeTilesPrimitive.value = markExternalObject(primitive)
  primaryS3MLayer.value ||= markExternalObject(primitive)
  loadedLayers.value.push('化工园区 3D Tiles')
  pushDebugLayer(primitive)
}

function configureCloseRangeSceneStability(currentViewer: SuperMapViewer) {
  const camera = currentViewer.scene.camera || currentViewer.camera
  if (camera?.frustum) {
    camera.frustum.near = geographicSceneMode.value ? 0.1 : 0.01
    camera.frustum.far = 2000000
  }
  const controller = currentViewer.scene.screenSpaceCameraController
  if (!controller) return
  controller.minimumZoomDistance = geographicSceneMode.value ? 35 : 0.05
  controller.maximumZoomDistance = geographicSceneMode.value ? 12000 : 4200
  controller.enableCollisionDetection = false
}

function stabilizeThreeTilesetRecord(record: Record<string, unknown> | null) {
  if (!record) return
  // 与 openThreeDTileset 的已验证配置保持一致，避免 ready 后被 SDK 默认值覆盖。
  record.maximumScreenSpaceError =
    THREE_TILES_PERFORMANCE_OPTIONS.maximumScreenSpaceError
  record.skipLevelOfDetail = false
  record.immediatelyLoadDesiredLevelOfDetail = false
  // 园区旧瓦片的部分子包围盒与实际几何不一致。这里必须与创建参数一致；
  // 若 ready 后重新打开移动裁剪/子包围盒裁剪，轻微旋转或 flyTo 就会把
  // 正在显示的父瓦片裁掉并取消子瓦片请求，表现为整个模型突然消失。
  record.cullRequestsWhileMoving = false
  record.cullRequestsWhileMovingMultiplier = 60
  record.cullWithChildrenBounds = false
  record.dynamicScreenSpaceError = true
  record.dynamicScreenSpaceErrorFactor =
    THREE_TILES_PERFORMANCE_OPTIONS.dynamicScreenSpaceErrorFactor
  record.foveatedScreenSpaceError = true
  record.loadSiblings = false
  record.preloadFlightDestinations = false
  record.maximumMemoryUsage = THREE_TILES_PERFORMANCE_OPTIONS.maximumMemoryUsage
  record.cacheBytes = THREE_TILES_PERFORMANCE_OPTIONS.cacheBytes
}

function installEarthImagery(
  runtime: SuperMapRuntime,
  currentViewer: SuperMapViewer,
) {
  if (!geographicSceneMode.value) return
  const imageryLayers =
    currentViewer.imageryLayers || currentViewer.scene.imageryLayers
  if (!imageryLayers?.addImageryProvider) return
  try {
    const localEarthProvider = runtime.createTileMapServiceImageryProvider?.({
      url: '/supermap3d/Assets/Textures/NaturalEarthII',
    })
    if (localEarthProvider) {
      imageryLayers.removeAll?.()
      const localEarthLayer = imageryLayers.addImageryProvider(
        localEarthProvider,
        0,
      ) as Record<string, unknown> | undefined
      tuneImageryLayer(localEarthLayer, {
        alpha: 1,
        brightness: 0.82,
        contrast: 1,
        saturation: 0.9,
        gamma: 0.96,
      })
      pushDebugMessage(
        '已加载本地 NaturalEarthII 经纬度地球底图；三维模型和监控点位使用 EPSG:4490 经纬高落到地球球面。',
      )
    }

    if (import.meta.env.DEV) return

    const satelliteProvider = runtime.UrlTemplateImageryProvider
      ? new runtime.UrlTemplateImageryProvider({
          url: 'https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          minimumLevel: 0,
          maximumLevel: 18,
          credit: 'Amap Satellite',
        })
      : null
    if (satelliteProvider) {
      const satelliteLayer = imageryLayers.addImageryProvider(
        satelliteProvider,
        0,
      ) as Record<string, unknown> | undefined
      tuneImageryLayer(satelliteLayer, {
        alpha: 1,
        brightness: 0.62,
        contrast: 0.92,
        saturation: 0.82,
        gamma: 0.94,
      })
      pushDebugMessage(
        '已保留地球经纬度背景并叠加卫星影像；三维模型和监控点位使用 EPSG:4490 经纬高落到地球球面。',
      )
    }
  } catch (error) {
    pushDebugMessage(
      error instanceof Error ? error.message : '卫星影像底图加载失败',
    )
  }
}

function tuneImageryLayer(
  layer: Record<string, unknown> | undefined,
  options: Record<string, number>,
) {
  if (!layer) return
  Object.entries(options).forEach(([key, value]) => {
    layer[key] = value
  })
  layer.show = true
}

function brightenThreeTileset(
  runtime: SuperMapRuntime,
  record: Record<string, unknown> | null,
) {
  if (!record) return
  const runtimeRecord = runtime as Record<string, unknown>
  const styleConstructor = runtimeRecord.Cesium3DTileStyle
  if (typeof styleConstructor === 'function') {
    try {
      record.style = new (styleConstructor as new (
        options: Record<string, unknown>,
      ) => unknown)({
        color: "color('white', 1.0)",
      })
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : '3D Tiles 提亮样式应用失败',
      )
    }
  }
  const colorBlendMode = runtimeRecord.Cesium3DTileColorBlendMode as
    | Record<string, unknown>
    | undefined
  if (colorBlendMode?.HIGHLIGHT !== undefined)
    record.colorBlendMode = colorBlendMode.HIGHLIGHT
  record.colorBlendAmount = 0.46
  if (runtime.Cartesian3)
    record.lightColor = new runtime.Cartesian3(2.6, 2.6, 2.45)
  record.shadows = false
}

async function loadThreeTilesGeoreference(): Promise<ThreeTilesGeoreference> {
  try {
    const response = await fetch(tilesetUrl.value, { cache: 'no-cache' })
    if (!response.ok)
      throw new Error(`tileset 元数据请求失败：${response.status}`)
    const payload = await response.json()
    const rootTransform = Array.isArray(payload?.root?.transform)
      ? payload.root.transform.map(Number)
      : []
    const anchor = payload?.properties?.supermapCupAnchor || {}
    const georef: ThreeTilesGeoreference = {
      transform:
        rootTransform.length >= 16
          ? rootTransform
          : THREE_TILES_FALLBACK_GEOREFERENCE.transform,
      sourceXOrigin: finiteOr(
        anchor.sourceXOrigin,
        THREE_TILES_FALLBACK_GEOREFERENCE.sourceXOrigin,
      ),
      sourceYOrigin: finiteOr(
        anchor.sourceYOrigin,
        THREE_TILES_FALLBACK_GEOREFERENCE.sourceYOrigin,
      ),
      scaleX: finiteOr(anchor.scaleX, THREE_TILES_FALLBACK_GEOREFERENCE.scaleX),
      scaleY: finiteOr(anchor.scaleY, THREE_TILES_FALLBACK_GEOREFERENCE.scaleY),
      scaleZ: finiteOr(anchor.scaleZ, THREE_TILES_FALLBACK_GEOREFERENCE.scaleZ),
      anchor: {
        longitude: finiteOr(
          anchor.longitude,
          THREE_TILES_FALLBACK_GEOREFERENCE.anchor.longitude,
        ),
        latitude: finiteOr(
          anchor.latitude,
          THREE_TILES_FALLBACK_GEOREFERENCE.anchor.latitude,
        ),
        height: finiteOr(
          anchor.height,
          THREE_TILES_FALLBACK_GEOREFERENCE.anchor.height,
        ),
      },
      viewCenter: resolveThreeTilesViewCenter(payload, rootTransform),
    }
    pushDebugMessage(
      `3D Tiles 地理参考已读取：EPSG:4490 ${georef.anchor.longitude},${georef.anchor.latitude},H=${georef.anchor.height}`,
    )
    return georef
  } catch (error) {
    pushDebugMessage(
      error instanceof Error
        ? error.message
        : '3D Tiles 地理参考读取失败，使用内置锚定参数',
    )
    return THREE_TILES_FALLBACK_GEOREFERENCE
  }
}

function resolveThreeTilesViewCenter(
  payload: Record<string, unknown>,
  transform: number[],
) {
  const sphere = Array.isArray(
    (payload?.root as Record<string, unknown> | undefined)?.boundingVolume
      ? (
          (payload.root as Record<string, unknown>).boundingVolume as Record<
            string,
            unknown
          >
        ).sphere
      : null,
  )
    ? (
        (
          (payload.root as Record<string, unknown>).boundingVolume as Record<
            string,
            unknown
          >
        ).sphere as unknown[]
      ).map(Number)
    : []
  if (
    sphere.length >= 3 &&
    transform.length >= 16 &&
    sphere.slice(0, 3).every(Number.isFinite)
  ) {
    const center = multiplyMatrix4ByPoint(
      transform,
      sphere[0],
      sphere[1],
      sphere[2],
    )
    return ecefToGeo(center.x, center.y, center.z)
  }
  return THREE_TILES_FALLBACK_GEOREFERENCE.viewCenter
}

function finiteOr(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

async function openS3MConfigLayers(
  currentViewer: SuperMapViewer,
  startIndex = 0,
  strict = true,
  maxCount?: number,
) {
  if (!currentViewer.scene.addS3MTilesLayerByScp)
    throw new Error('当前 SuperMap3D SDK 不支持 S3M config 图层加载')
  let configs = layerConfigs.value
    .map((configUrl, index) => ({ configUrl, index }))
    .slice(startIndex)
  if (maxCount !== undefined) configs = configs.slice(0, maxCount)
  for (const { configUrl, index } of configs) {
    const layerName = resolveLayerName(configUrl, index)
    const shouldAutoFocusLayer =
      scenePresentationMode.value === 'local-s3m' ||
      (startIndex === 0 && index === 0)
    try {
      const options: Record<string, unknown> = {
        name: layerName,
        // EPSG:4490 缓存已包含准确地理位置；显式相机只负责首帧视角，
        // 禁止 SDK 再根据局部包围盒覆盖园区视角。
        autoSetView: false,
      }
      if (shouldApplyLayerPosition.value) {
        options.position = [
          s3mLayerPosition.value.longitude,
          s3mLayerPosition.value.latitude,
          s3mLayerPosition.value.height,
        ]
      }
      const previousSceneLayers = collectCurrentSceneLayers(currentViewer)
      const layerOutcome = await addS3MLayerWithCollectionFallback(
        currentViewer,
        configUrl,
        options,
        previousSceneLayers,
        layerName,
        layerName,
      )
      if (componentDestroyed || viewer.value !== currentViewer) {
        removeSceneLayer(currentViewer, layerOutcome.layer)
        return
      }
      const readyMonitor = await waitForS3MLayerRenderable(
        currentViewer,
        layerOutcome.layer,
        layerName,
        layerOutcome.layerResultMonitor,
      )
      if (componentDestroyed || viewer.value !== currentViewer) {
        removeSceneLayer(currentViewer, layerOutcome.layer)
        return
      }
      applyS3MLayerGeoreference(layerOutcome.layer)
      applyS3MLayerLodConfig(layerOutcome.layer)
      s3mLayers.value[index] = markExternalObject(layerOutcome.layer)
      primaryS3MLayer.value ||= markExternalObject(layerOutcome.layer)
      pushDebugLayer(layerOutcome.layer)
      if (shouldAutoFocusLayer) {
        if (scenePresentationMode.value === 'local-s3m')
          await focusLocalS3MLayer(layerOutcome.layer, configUrl)
        else if (!focusSceneDefinitionTarget(getSceneDefinition(index)))
          await flyToPrimaryLayer()
      }
      loadedLayers.value.push(layerName)
      watchForLateS3MLayerFailure(
        currentViewer,
        layerOutcome.layer,
        layerOutcome.layerResultMonitor?.promise ?? null,
        readyMonitor?.promise ?? null,
        layerName,
      )
    } catch (error) {
      sceneMessage.value =
        error instanceof Error ? error.message : `${layerName} 加载异常`
      if (strict) throw error
      pushDebugMessage(sceneMessage.value)
    }
  }
}

function focusSceneDefinitionTarget(
  definition: (typeof SCENE_DEFINITIONS)[number] | null,
) {
  if (!definition?.target) return false

  const target = geoToEcef(
    definition.target.longitude,
    definition.target.latitude,
    definition.target.heightMeters,
  )
  return focusEcefTarget(target, definition.camera)
}

function focusEcefTarget(
  target: { x: number; y: number; z: number },
  sceneCamera: (typeof SCENE_DEFINITIONS)[number]['camera'],
) {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  const camera = currentViewer?.scene?.camera || currentViewer?.camera
  if (!runtime?.Cartesian3 || !camera?.flyTo) return false
  const targetGeo = ecefToGeo(target.x, target.y, target.z)
  const basis = enuBasis(targetGeo.longitude, targetGeo.latitude)
  const headingRadians = (sceneCamera.headingDegrees * Math.PI) / 180
  const pitchRadians = (Math.abs(sceneCamera.pitchDegrees) * Math.PI) / 180
  const away = normalizeVector(
    addVector(
      scaleVector(basis.east, -Math.sin(headingRadians)),
      scaleVector(basis.north, -Math.cos(headingRadians)),
    ),
  )
  if (!away) return false
  const destinationEcef = addVector(
    addVector(
      target,
      scaleVector(away, sceneCamera.distanceMeters * Math.cos(pitchRadians)),
    ),
    scaleVector(basis.up, sceneCamera.distanceMeters * Math.sin(pitchRadians)),
  )
  const direction = normalizeVector(subtractVector(target, destinationEcef))
  const right = direction
    ? normalizeVector(crossVector(direction, basis.up))
    : null
  const up =
    direction && right ? normalizeVector(crossVector(right, direction)) : null
  const frustum = camera.frustum as
    | { fov?: number; near?: number; far?: number }
    | undefined
  if (frustum) {
    frustum.fov = (sceneCamera.fieldOfViewDegrees * Math.PI) / 180
    frustum.near = 1
    frustum.far = Math.max(5000, sceneCamera.distanceMeters * 30)
  }
  camera.flyTo({
    destination: new runtime.Cartesian3(
      destinationEcef.x,
      destinationEcef.y,
      destinationEcef.z,
    ),
    orientation:
      direction && up
        ? {
            direction: new runtime.Cartesian3(
              direction.x,
              direction.y,
              direction.z,
            ),
            up: new runtime.Cartesian3(up.x, up.y, up.z),
          }
        : undefined,
    duration: 0.85,
    complete: requestSceneRender,
  })
  pumpSceneRenderDuringCameraFlight(currentViewer, 950)
  return true
}

async function focusLocalS3MLayer(layer: unknown, configUrl: string) {
  if (await focusLocalS3MConfig(configUrl)) return true
  const runtime = getRuntime()
  const currentViewer = viewer.value
  const layerRecord = asRecord(layer)
  const camera = currentViewer?.scene.camera || currentViewer?.camera
  const boundingSphere =
    layerRecord?.boundingSphere || layerRecord?._boundingSphere || null

  // S3M EPSG:0 config 的局部 XYZ 不能直接作为 Cesium 地球场景相机的
  // destination/direction。SDK 已根据 config 插入点计算出 ECEF 包围球，
  // 必须以它定位，否则根节点会被判定在视锥外，.s3mb 永远不会进入请求队列。
  if (boundingSphere && camera?.flyToBoundingSphere) {
    const radius = Math.max(1, Number(asRecord(boundingSphere).radius || 1))
    const sceneCamera = getSceneDefinition(activeS3MLayerIndex.value)?.camera
    const heading =
      runtime?.Math?.toRadians?.(sceneCamera?.headingDegrees ?? 18) ?? 0.314
    const pitch =
      runtime?.Math?.toRadians?.(sceneCamera?.pitchDegrees ?? -24) ?? -0.419
    const requestedRange = sceneCamera?.distanceMeters ?? radius * 1.5
    const range = Math.max(
      16,
      Math.min(Math.max(requestedRange, radius * 1.15), radius * 2),
    )
    const frustum = camera.frustum as
      | { fov?: number; near?: number; far?: number }
      | undefined
    if (frustum) {
      frustum.fov = ((sceneCamera?.fieldOfViewDegrees ?? 38) * Math.PI) / 180
      frustum.near = 0.5
      frustum.far = Math.max(2000, range * 40)
    }
    const offset = runtime?.HeadingPitchRange
      ? new runtime.HeadingPitchRange(heading, pitch, range)
      : undefined
    camera.flyToBoundingSphere(boundingSphere, {
      duration: 0.85,
      offset,
      complete: () => requestSceneRender(),
    })
    requestSceneRender()
    await wait(900)
    requestSceneRender()
    return true
  }

  return false
}

async function focusLocalS3MConfig(configUrl: string) {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime?.Cartesian3 || !currentViewer) return false
  try {
    const response = await fetch(configUrl, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`S3M config 请求失败：${response.status}`)
    const config = await response.json()
    if (geographicSceneMode.value) {
      const configRecord = asRecord(config)
      const bounds = asRecord(configRecord.geoBounds)
      const heightRange = asRecord(configRecord.heightRange)
      const isGeographicConfig =
        String(configRecord.crs || '').toLowerCase() !== 'epsg:0'
      let target: { x: number; y: number; z: number }
      if (isGeographicConfig) {
        target = geoToEcef(
          (Number(bounds.left) + Number(bounds.right)) / 2,
          (Number(bounds.bottom) + Number(bounds.top)) / 2,
          (Number(heightRange.min) + Number(heightRange.max)) / 2,
        )
      } else {
        const localTarget = computeLocalS3MTarget(config)
        const position = s3mLayerPosition.value
        const anchor = geoToEcef(
          position.longitude,
          position.latitude,
          position.height,
        )
        const basis = enuBasis(position.longitude, position.latitude)
        target = addVector(
          addVector(
            addVector(anchor, scaleVector(basis.east, localTarget.x)),
            scaleVector(basis.north, localTarget.y),
          ),
          scaleVector(basis.up, localTarget.z),
        )
      }
      const sceneCamera = getSceneDefinition(activeS3MLayerIndex.value)?.camera
      if (sceneCamera && focusEcefTarget(target, sceneCamera)) {
        await wait(900)
        requestSceneRender()
        return true
      }
    }
    const localTarget = computeLocalS3MTarget(config)
    const snapshot = computeLocalS3MCameraSnapshot(config)
    const camera = currentViewer.scene.camera || currentViewer.camera
    camera?.setView?.(
      createLocalS3MCameraView(
        snapshot,
        (x, y, z) => new runtime.Cartesian3(x, y, z),
      ),
    )
    requestSceneRender()
    scheduleSceneTimeout(currentViewer, requestSceneRender, 120)
    scheduleSceneTimeout(currentViewer, requestSceneRender, 480)
    lastStableLocalCamera.value = snapshot
    localSceneFocusTarget = localTarget
    localSceneMinimumFocusDistanceMeters =
      computeLocalS3MMinimumFocusDistance(config)
    return true
  } catch (error) {
    pushDebugMessage(
      error instanceof Error ? error.message : 'S3M 本地相机定位失败',
    )
    return false
  }
}

async function refreshAlgorithmHealth() {
  algorithmState.value = 'checking'
  try {
    const response = await checkAlgorithmHealth()
    algorithmHealth.value = response.data || null
    algorithmState.value = response.data?.status === 'ok' ? 'ready' : 'offline'
  } catch {
    algorithmState.value = 'offline'
  }
}

async function reloadScene() {
  destroyScene()
  await bootstrapScene()
  await refreshAlgorithmHealth()
}

function focusScene() {
  if (scenePresentationMode.value === 'local-s3m') {
    void switchToParkScene()
    return
  }
  const runtime = getRuntime()
  if (!runtime || !viewer.value) return
  if (geographicSceneMode.value) {
    if (shouldUseThreeDTiles.value && focusThreeTilesOverview(runtime, true)) {
      sceneMessage.value =
        '已切回化工园区三维模型全景，可继续自由旋转、平移和缩放。'
      return
    }
    if (primaryS3MLayer.value) {
      void flyToPrimaryLayer()
      sceneMessage.value = '已切回落球后的化工园区三维模型全景。'
      return
    }
    setDefaultCamera(runtime)
    return
  }
  void reloadScene()
  sceneMessage.value = '正在恢复进入大屏时的园区斜俯全景视角。'
}

function focusGeoCenter() {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime?.Cartesian3?.fromDegrees || !currentViewer) return
  if (!geographicSceneMode.value) {
    applyLocalDefaultCamera(runtime)
    sceneMessage.value =
      '当前 S3M 模型仍是本地缓存；已按 57083 锚点业务坐标恢复园区全景。'
    return
  }
  const destination = runtime.Cartesian3.fromDegrees(
    ZHENGZHOU_STATION_57083.longitude,
    ZHENGZHOU_STATION_57083.latitude,
    500,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(0),
        pitch: runtime.Math.toRadians(-90),
        roll: runtime.Math.toRadians(0),
      }
    : undefined
  currentViewer.scene.camera?.setView?.({ destination, orientation })
  currentViewer.camera?.setView?.({ destination, orientation })
}

function startSensorPlacement(draft: SensorPlacementDraft) {
  algorithmPickMode.value = null
  pendingSensorPlacement.value = {
    modelId: draft.modelId,
    installationHeight: Number.isFinite(Number(draft.installationHeight))
      ? Number(draft.installationHeight)
      : 1.5,
    effectiveRange: Number.isFinite(Number(draft.effectiveRange))
      ? Number(draft.effectiveRange)
      : 4,
  }
  sceneMessage.value = '已进入点位添加模式：在三维园区模型上点击设备安装位置。'
}

function cancelSensorPlacement() {
  pendingSensorPlacement.value = null
  sceneMessage.value = '已退出点位添加模式。'
}

function startLeakSourceSelection() {
  pendingSensorPlacement.value = null
  algorithmPickMode.value = 'leak-source'
  sceneMessage.value =
    '请点击建筑群、油管阀组、罐组或塔器附近，设置扩散模拟泄漏源。'
}

function startEvacuationStartSelection() {
  pendingSensorPlacement.value = null
  algorithmPickMode.value = 'evacuation-start'
  sceneMessage.value =
    '请点击人员所在建筑、道路节点或装置区附近，设置逃生人员起点。'
}

function captureCameraView() {
  const snapshot = readLocalCameraSnapshot()
  if (snapshot) {
    lastStableLocalCamera.value = snapshot
    localCameraAnchor ||= snapshot
  }
  return snapshot
}

function applyCameraView(snapshot: LocalCameraSnapshot) {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime?.Cartesian3 || !currentViewer) return false
  if (!isCameraSnapshotCompatible(snapshot)) {
    sceneMessage.value =
      '保存视角与当前场景坐标空间不兼容，已恢复园区安全全景。'
    void focusScene()
    return false
  }
  const camera = currentViewer.scene?.camera || currentViewer.camera
  if (!camera?.flyTo) return false
  const destination = new runtime.Cartesian3(
    snapshot.position.x,
    snapshot.position.y,
    snapshot.position.z,
  )
  const orientation =
    snapshot.direction && snapshot.up
      ? {
          direction: new runtime.Cartesian3(
            snapshot.direction.x,
            snapshot.direction.y,
            snapshot.direction.z,
          ),
          up: new runtime.Cartesian3(
            snapshot.up.x,
            snapshot.up.y,
            snapshot.up.z,
          ),
        }
      : undefined
  camera.flyTo({
    destination,
    orientation,
    duration: 1.05,
    complete: () => {
      lastStableLocalCamera.value = snapshot
      localCameraAnchor ||= snapshot
      sceneMessage.value = '已平滑切换到保存的三维视角。'
      requestSceneRender()
    },
  })
  pumpSceneRenderDuringCameraFlight(currentViewer, 1150)
  return true
}

async function setSceneProjectionMode(mode: '2d' | '3d') {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  const scene = currentViewer?.scene
  if (!runtime?.SceneMode || !scene || sceneState.value !== 'ready') {
    sceneMessage.value = '场景尚未就绪，暂时不能切换二三维模式。'
    return false
  }
  if (sceneProjectionMode.value === mode) return true

  const switchSequence = ++sceneProjectionSwitchSequence
  if (mode === '2d') {
    const snapshot = readLocalCameraSnapshot()
    if (snapshot?.coordinateSpace !== 'local-s3m') {
      savedThreeDimensionalCamera.value = snapshot
    }
  }

  const durationSeconds = 0.85
  if (mode === '2d') {
    if (scene.morphToColumbusView) {
      scene.morphToColumbusView(durationSeconds)
    } else if (runtime.SceneMode.COLUMBUS_VIEW !== undefined) {
      scene.mode = runtime.SceneMode.COLUMBUS_VIEW
    } else {
      sceneMessage.value = '当前 SuperMap3D SDK 不支持平面场景模式。'
      return false
    }
  } else if (scene.morphTo3D) {
    scene.morphTo3D(durationSeconds)
  } else if (runtime.SceneMode.SCENE3D !== undefined) {
    scene.mode = runtime.SceneMode.SCENE3D
  } else {
    sceneMessage.value = '当前 SuperMap3D SDK 不支持三维场景模式。'
    return false
  }

  sceneProjectionMode.value = mode
  sceneMessage.value =
    mode === '2d'
      ? '正在平滑切换到 EPSG:4490 平面场景，模型与算法图层保持加载。'
      : '正在平滑恢复 EPSG:4490 三维场景，模型与算法图层保持加载。'
  pumpSceneRenderDuringCameraFlight(currentViewer, 1050)

  await wait(950)
  if (
    switchSequence !== sceneProjectionSwitchSequence ||
    viewer.value !== currentViewer
  ) {
    return false
  }
  currentViewer.resize?.()
  if (mode === '2d') {
    // 使用项目自身的 CGCS2000 / EPSG:4490 园区锚点俯视，不复制官方示例坐标。
    focusGeoCenter()
    sceneMessage.value = '已切换到 EPSG:4490 平面场景。'
  } else {
    const snapshot =
      savedThreeDimensionalCamera.value || lastStableLocalCamera.value
    if (snapshot?.coordinateSpace !== 'local-s3m') {
      applyCameraView(snapshot)
    } else {
      focusScene()
    }
    sceneMessage.value = '已恢复 EPSG:4490 三维场景。'
  }
  requestSceneRender()
  return true
}

function focusThreeTilesOverview(runtime: SuperMapRuntime, useFlyTo = false) {
  // 优先使用 Tileset 自身的世界包围球。它来自实际 3D Tiles transform，
  // 可避免手工锚点相机因 ENU 方向估算误差进入模型内部。
  if (focusThreeTilesBoundingSphere(runtime, useFlyTo)) return true
  if (focusThreeTilesAnchorCamera(runtime, useFlyTo)) return true
  const currentViewer = viewer.value
  if (!currentViewer || !runtime.Cartesian3?.fromDegrees) return false
  const center = threeTilesSceneCenterGeo()
  const destination = runtime.Cartesian3.fromDegrees(
    center.longitude,
    center.latitude,
    340,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(0),
        pitch: runtime.Math.toRadians(-90),
        roll: runtime.Math.toRadians(0),
      }
    : undefined
  const options = { destination, orientation, duration: 0.7 }
  if (useFlyTo) {
    currentViewer.scene.camera?.flyTo?.(options)
    currentViewer.camera?.flyTo?.(options)
  } else {
    currentViewer.scene.camera?.setView?.({ destination, orientation })
    currentViewer.camera?.setView?.({ destination, orientation })
  }
  return true
}

function setThreeTilesEarthArrivalStart(runtime: SuperMapRuntime) {
  const currentViewer = viewer.value
  const camera = currentViewer?.camera || currentViewer?.scene.camera
  if (!camera || !runtime.Cartesian3?.fromDegrees) return false
  const georef = threeTilesGeoreference.value
  const destination = runtime.Cartesian3.fromDegrees(
    georef.anchor.longitude - 0.018,
    georef.anchor.latitude + 0.014,
    1850000,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(24),
        pitch: runtime.Math.toRadians(-90),
        roll: runtime.Math.toRadians(0),
      }
    : undefined
  camera.setView?.({ destination, orientation })
  currentViewer?.scene.camera?.setView?.({ destination, orientation })
  requestSceneRender()
  scheduleSceneTimeout(currentViewer, requestSceneRender, 120)
  return true
}

function focusThreeTilesAnchorCamera(
  runtime: SuperMapRuntime,
  useFlyTo = false,
) {
  const currentViewer = viewer.value
  const camera = currentViewer?.camera || currentViewer?.scene.camera
  if (!currentViewer || !camera || !runtime.Cartesian3?.fromDegrees)
    return false
  const georef = threeTilesGeoreference.value
  const longitude = georef.anchor.longitude
  const latitude = georef.anchor.latitude
  const anchorHeight = Number.isFinite(Number(georef.anchor.height))
    ? Number(georef.anchor.height)
    : 8
  const target = geoToEcef(longitude, latitude, anchorHeight)
  const basis = enuBasis(longitude, latitude)
  const destinationEcef = addVector(
    addVector(target, scaleVector(basis.south, 230)),
    scaleVector(basis.up, 420),
  )
  const direction = normalizeVector(subtractVector(target, destinationEcef))
  const right = direction
    ? normalizeVector(crossVector(direction, basis.up))
    : null
  const cameraUp =
    direction && right
      ? normalizeVector(crossVector(right, direction))
      : basis.up
  const destination = runtime.Cartesian3.fromDegrees(
    longitude,
    latitude - 0.0024,
    anchorHeight + 520,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(0),
        pitch: runtime.Math.toRadians(-62),
        roll: runtime.Math.toRadians(0),
      }
    : undefined
  try {
    if (direction && cameraUp) {
      const ecefDestination = new runtime.Cartesian3(
        destinationEcef.x,
        destinationEcef.y,
        destinationEcef.z,
      )
      const ecefOrientation = {
        direction: new runtime.Cartesian3(
          direction.x,
          direction.y,
          direction.z,
        ),
        up: new runtime.Cartesian3(cameraUp.x, cameraUp.y, cameraUp.z),
      }
      if (useFlyTo && camera.flyTo) {
        camera.flyTo({
          destination: ecefDestination,
          orientation: ecefOrientation,
          duration: 2.8,
          complete: () => requestSceneRender(),
        })
        pumpSceneRenderDuringCameraFlight(currentViewer, 2900)
      } else {
        camera.setView?.({
          destination: ecefDestination,
          orientation: ecefOrientation,
        })
        currentViewer.scene.camera?.setView?.({
          destination: ecefDestination,
          orientation: ecefOrientation,
        })
      }
    } else if (useFlyTo && camera.flyTo) {
      camera.flyTo({ destination, orientation, duration: 0.75 })
      pumpSceneRenderDuringCameraFlight(currentViewer, 850)
    } else {
      camera.setView?.({ destination, orientation })
    }
    requestSceneRender()
    scheduleSceneTimeout(currentViewer, requestSceneRender, 120)
    scheduleSceneTimeout(currentViewer, requestSceneRender, 420)
    return true
  } catch (error) {
    pushDebugMessage(
      error instanceof Error ? error.message : '3D Tiles 锚点相机定位失败',
    )
    return false
  }
}

function focusThreeTilesBoundingSphere(
  runtime: SuperMapRuntime,
  useFlyTo = false,
) {
  const currentViewer = viewer.value
  const camera = currentViewer?.camera || currentViewer?.scene.camera
  const tileset = getPrimaryThreeTileset()
  const boundingSphere = getThreeTilesBoundingSphere(tileset)
  if (!camera || !boundingSphere) return false

  const sphereRecord = boundingSphere as { radius?: number }
  const radius = Number(sphereRecord.radius || 0)
  // 根包围球还包含园区外围长道路；2.2 倍半径会把主体厂区缩成一个小点。
  // 采用略大于半径的近景距离，仍覆盖完整模型，同时让装置区可辨识。
  const range = Math.max(radius * 1.12, 520)
  const heading = runtime.Math?.toRadians ? runtime.Math.toRadians(0) : 0
  const pitch = runtime.Math?.toRadians ? runtime.Math.toRadians(-28) : -0.489
  const offset = runtime.HeadingPitchRange
    ? new runtime.HeadingPitchRange(heading, pitch, range)
    : undefined

  try {
    if (useFlyTo && camera.flyToBoundingSphere) {
      camera.flyToBoundingSphere(boundingSphere, {
        offset,
        duration: 0.75,
        complete: () => requestSceneRender(),
      })
      pumpSceneRenderDuringCameraFlight(currentViewer, 850)
    } else if (camera.viewBoundingSphere) {
      camera.viewBoundingSphere(boundingSphere, offset)
    } else {
      return false
    }
    requestSceneRender()
    return true
  } catch (error) {
    pushDebugMessage(
      error instanceof Error ? error.message : '3D Tiles 包围球定位失败',
    )
    return false
  }
}

function getPrimaryThreeTileset() {
  const primary = primaryS3MLayer.value
  if (isThreeTilesetLike(primary)) return primary as Record<string, unknown>
  const primitives = viewer.value?.scene.primitives
  if (!primitives) return null
  const primitiveRecord = primitives as Record<string, unknown>
  const list = Array.isArray(primitiveRecord._primitives)
    ? (primitiveRecord._primitives as unknown[])
    : []
  const length =
    typeof primitives.length === 'number' ? primitives.length : list.length
  for (let index = 0; index < length; index += 1) {
    const primitive = primitives.get?.(index) || list[index]
    if (isThreeTilesetLike(primitive))
      return primitive as Record<string, unknown>
  }
  return null
}

function isThreeTilesetLike(value: unknown) {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Boolean(record.boundingSphere || record._boundingSphere || record.root)
}

function getThreeTilesBoundingSphere(tileset: Record<string, unknown> | null) {
  if (!tileset) return null
  return tileset.boundingSphere || tileset._boundingSphere || null
}

function selectSensor(sensorId: string) {
  const sensor = sceneSensors.value.find((item) => item.id === sensorId)
  if (!sensor) return
  selectedSensor.value = sensor
  emitSensorPick(sensor)
}

function flyToSensor(sensorId: string) {
  const sensor = sceneSensors.value.find((item) => item.id === sensorId)
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!sensor || !runtime?.Cartesian3 || !currentViewer) return
  selectedSensor.value = sensor
  emitSensorPick(sensor)
  // F11（2026-08-01）：B 套点位 mapPoint 为算法系，飞行/落点统一逆变换回底图系
  const displayPoint = algorithmToLocal(sensor.mapPoint)
  if (shouldUseThreeDTiles.value && runtime.Cartesian3.fromDegrees) {
    if (statusPanelVisible.value) {
      sceneMessage.value = `已定位监控点 ${sensor.id}：${describeSensorSceneMapPoint(sensor, sensor.installationHeight)}；按 GB/T 50493-2019 近源原则锚到建筑/罐组/塔器。`
    }
    flyToThreeTilesSensor(sensor, runtime)
    return
  }

  if (geographicSceneMode.value && runtime.Cartesian3.fromDegrees) {
    const geo = mapPointToGeo(displayPoint, sensor.installationHeight)
    const destination = shouldUseThreeDTiles.value
      ? mapPointToSceneCartesian(displayPoint, sensor.installationHeight + 280)
      : runtime.Cartesian3.fromDegrees(
          geo.longitude,
          geo.latitude,
          geo.altitude + 280,
        )
    if (!destination) return
    const orientation = runtime.Math
      ? {
          heading: runtime.Math.toRadians(0),
          pitch: runtime.Math.toRadians(-65),
          roll: runtime.Math.toRadians(0),
        }
      : undefined
    currentViewer.scene.camera?.flyTo?.({
      destination,
      orientation,
      duration: 0.8,
    })
    currentViewer.camera?.flyTo?.({ destination, orientation, duration: 0.8 })
    return
  }

  if (!geographicSceneMode.value) {
    if (
      !restoreLocalSceneCamera(
        runtime,
        lastStableLocalCamera.value || localCameraAnchor,
      )
    ) {
      applyLocalDefaultCamera(runtime)
    }
    sceneMessage.value = `已定位监控点 ${sensor.id}：${describeMapPoint(displayPoint, sensor.installationHeight)}；旧 Realspace 模式以全景视角高亮点位，避免相机飞出模型。`
    return
  }

  const local = mapPointToS3MLocal(displayPoint, sensor.installationHeight)
  const viewDirection = LOCAL_S3M_DEFAULT_CAMERA.direction || {
    x: 0.342,
    y: 0.656,
    z: -0.671,
  }
  const viewUp = LOCAL_S3M_DEFAULT_CAMERA.up || { x: 0.31, y: 0.6, z: 0.738 }
  const range = 980
  const destinationPosition = {
    x: clamp(
      local.x - viewDirection.x * range,
      LOCAL_S3M_BOUNDS.left - 180,
      LOCAL_S3M_BOUNDS.right + 180,
    ),
    y: clamp(
      local.y - viewDirection.y * range,
      LOCAL_S3M_BOUNDS.bottom - 180,
      LOCAL_S3M_BOUNDS.top + 180,
    ),
    z: clamp(local.z - viewDirection.z * range, 520, 1260),
  }
  const directionVector = viewDirection
  const destination = new runtime.Cartesian3(
    destinationPosition.x,
    destinationPosition.y,
    destinationPosition.z,
  )
  const orientation = {
    direction: new runtime.Cartesian3(
      directionVector.x,
      directionVector.y,
      directionVector.z,
    ),
    up: new runtime.Cartesian3(viewUp.x, viewUp.y, viewUp.z),
  }
  currentViewer.scene.camera?.flyTo?.({
    destination,
    orientation,
    duration: 0.8,
  })
  currentViewer.camera?.flyTo?.({ destination, orientation, duration: 0.8 })
  sceneMessage.value = `已定位监控点 ${sensor.id}：${describeMapPoint(sensor.mapPoint, sensor.installationHeight)}；EPSG:4547 ${sensorProjectedText(sensor)}`
  lastStableLocalCamera.value = {
    position: destinationPosition,
    direction: directionVector,
    up: viewUp,
  }
}

function flyToThreeTilesSensor(
  sensor: ModelBoundMonitorSensor,
  runtime: SuperMapRuntime,
) {
  const currentViewer = viewer.value
  if (!currentViewer || !runtime.Cartesian3?.fromDegrees) return
  const range = selectedSensorViewRange(sensor)
  const geo = threeTilesMapPointToGeo(
    sensorSceneMapPoint(sensor),
    sensor.installationHeight,
  )
  const destination = runtime.Cartesian3.fromDegrees(
    geo.longitude + range.longitudeOffset,
    geo.latitude + range.latitudeOffset,
    geo.altitude + range.height,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(range.heading),
        pitch: runtime.Math.toRadians(range.pitch),
        roll: runtime.Math.toRadians(0),
      }
    : undefined
  currentViewer.scene.camera?.flyTo?.({
    destination,
    orientation,
    duration: 0.9,
  })
  currentViewer.camera?.flyTo?.({ destination, orientation, duration: 0.9 })
}

function selectedSensorViewRange(sensor: ModelBoundMonitorSensor) {
  const radius = Number(sensor.effectiveRange) || 8
  const latitudeOffset = -Math.min(0.0012, radius / 90000)
  const longitudeOffset = Math.min(0.001, radius / 120000)
  return {
    longitudeOffset,
    latitudeOffset,
    height: 88,
    heading: 10,
    pitch: -58,
  }
}

async function runDiffusionDemo() {
  await runDemoTask('diffusion', async () => {
    const sourcePoint = currentAlgorithmSourcePoint()
    let sourceLabel = '算法服务'
    let result: AlgorithmRecord
    try {
      const response = await withTimeout(
        runDiffusionSimulation(buildRealtimeDiffusionPayload()),
        8000,
        '扩散算法服务响应超时',
      )
      if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
      result = unwrapAlgorithmRecord(response, '扩散模拟未返回有效结果')
      result = attachExecutionMode(result, 'algorithm-service')
    } catch (error) {
      if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
      sourceLabel = '本地兜底'
      result = buildFallbackDiffusionRecord(error)
      result = attachExecutionMode(result, 'local-fallback')
      pushDebugMessage(
        error instanceof Error
          ? error.message
          : '扩散服务不可用，使用本地兜底扩散结果',
      )
    }
    diffusionResult.value = result
    drawDiffusionOverlay(result)
    const finalFrame = selectFinalDiffusionFrame(result)
    const maxConcentration = Number(
      finalFrame.maxConcentration ||
        asRecord(result.stats).peakConcentration ||
        0,
    )
    const environment = sceneViewerProps.environmentSnapshot
    const windText =
      environment?.available && Number(environment.windSpeed) > 0
        ? `和风实况 ${Number(environment.windDirection || 0).toFixed(0)}° / ${Number(environment.windSpeed).toFixed(1)}m/s${environment.observedAt ? ` · ${environment.observedAt}` : ''}`
        : null
    pushExecutionEvidence(
      getExecutionMode(result),
      buildSuperMapCupEvidence(
        'diffusion',
        '扩散模拟',
        result,
        `${getArrayLength(result.frames)} 帧 / 峰值 ${maxConcentration.toFixed(2)} ppm${windText ? ` / ${windText}` : ''}`,
        `${overlayCoordinateLabel.value}源点 ${describeMapPoint(sourcePoint, 8)}`,
      ),
    )
    return `${sourceLabel}扩散结果已转为 ${overlayCoordinateLabel.value} 三维风险云团，峰值 ${maxConcentration.toFixed(2)} ppm${windText ? `（${windText}）` : ''}`
  })
}

function selectFixedLeakSource(point: SuperMapCupMapPoint, label: string) {
  const resolvedAnchor = resolveLeakSourceFromAnalysisPoint(point)
  if (!resolvedAnchor) {
    sceneMessage.value = `${label} 没有匹配到已登记的设备泄漏源；没有修改算法源。`
    pushDebugMessage(
      `拒绝未登记泄漏源: ${describeMapPoint(point, 8)}，请从设备泄漏源清单选择`,
    )
    return
  }
  activeLeakSourceId.value = resolvedAnchor.leakSourceId
  const leakAnchor = currentLeakSourceAnchor4490()
  const selectedPoint = algorithmToLocal(leakSourceToAlgorithmPoint(leakAnchor))
  algorithmPickMode.value = null
  clearOverlayGroup('temporary-selection')
  selectedLeakSourcePoint.value = selectedPoint
  diffusionResult.value = null
  particleResult.value = null
  evacuationResult.value = null
  emit('diffusion-heatmap', null)
  emit('inversion-overlay', null)
  withOverlayGroup('temporary-selection', () => addModelBoundLeakSourceEntity())
  const environment = sceneViewerProps.environmentSnapshot
  const windText = environment?.available
    ? `${Number(environment.windDirection || 0).toFixed(0)}° / ${Number(environment.windSpeed || 0).toFixed(1)}m/s`
    : '等待和风实况'
  sceneMessage.value = `已将 ${label} 绑定到 ${leakAnchor.modelName}（SmID=${leakAnchor.modelSmId}）设备表面点 ${leakAnchor.leakSourceId}；体扩散参数将自动绑定和风实况（${windText}）。`
  pushDebugMessage(
    `泄漏源绑定: ${leakAnchor.modelObjectId} → EPSG:4490(${leakAnchor.longitude.toFixed(6)}E, ${leakAnchor.latitude.toFixed(6)}N, H=${leakAnchor.heightMeters.toFixed(1)}m)`,
  )
  void flyToLeakSource(selectedPoint)
  requestSceneRender()
}

function flyToLeakSource(_unusedPoint: SuperMapCupMapPoint) {
  void _unusedPoint
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime?.Cartesian3 || !currentViewer) return
  const camera = currentViewer.scene?.camera || currentViewer.camera
  if (!camera?.flyTo) return

  if (geographicSceneMode.value && runtime.Cartesian3.fromDegrees) {
    const source = currentLeakSourceAnchor4490()
    const sourceTarget = geoToEcef(
      source.longitude,
      source.latitude,
      source.heightMeters + 2,
    )
    const basis = enuBasis(source.longitude, source.latitude)
    const windDirectionDegrees = Number(
      sceneViewerProps.environmentSnapshot?.windDirection || 0,
    )
    // 算法局部图以 +X 为 0°、+Y 向南；转换到 ENU 航向需顺时针加 90°。
    const windDirectionRadians = ((windDirectionDegrees + 90) * Math.PI) / 180
    const downwindEast = Math.sin(windDirectionRadians)
    const downwindNorth = Math.cos(windDirectionRadians)
    const crosswindEast = Math.cos(windDirectionRadians)
    const crosswindNorth = -Math.sin(windDirectionRadians)
    // 相机仍从侧风位接近设备，但视线严格指向泄漏原点，保证每次
    // 切换源点后该点都处于视角中心。全部偏移均为 ENU 米制。
    const destinationEcef = addVector(
      addVector(
        addVector(
          addVector(sourceTarget, scaleVector(basis.east, crosswindEast * 96)),
          scaleVector(basis.north, crosswindNorth * 96),
        ),
        scaleVector(basis.east, -downwindEast * 24),
      ),
      addVector(
        scaleVector(basis.north, -downwindNorth * 24),
        scaleVector(basis.up, 62),
      ),
    )
    const direction = normalizeVector(
      subtractVector(sourceTarget, destinationEcef),
    )
    const right = direction
      ? normalizeVector(crossVector(direction, basis.up))
      : null
    const cameraUp =
      direction && right
        ? normalizeVector(crossVector(right, direction))
        : basis.up
    const destination = new runtime.Cartesian3(
      destinationEcef.x,
      destinationEcef.y,
      destinationEcef.z,
    )
    const orientation =
      direction && cameraUp
        ? {
            direction: new runtime.Cartesian3(
              direction.x,
              direction.y,
              direction.z,
            ),
            up: new runtime.Cartesian3(cameraUp.x, cameraUp.y, cameraUp.z),
          }
        : undefined
    camera.flyTo({
      destination,
      orientation,
      duration: 1.05,
      complete: () => {
        requestSceneRender()
        scheduleSceneTimeout(currentViewer, requestSceneRender, 180)
        scheduleSceneTimeout(currentViewer, requestSceneRender, 650)
      },
    })
    pumpSceneRenderDuringCameraFlight(currentViewer, 1150)
    sceneMessage.value = `已平滑定位到油管泄漏点：${source.longitude.toFixed(6)}E, ${source.latitude.toFixed(6)}N, H=${source.heightMeters.toFixed(1)}m。`
    return
  }

  const local = mapPointToS3MLocal(
    algorithmToLocal(currentAlgorithmSourcePoint()),
    0,
  )
  const destination = new runtime.Cartesian3(
    local.x - 250,
    local.y - 430,
    Math.max(local.z + 520, 620),
  )
  const orientation = {
    direction: new runtime.Cartesian3(0.342, 0.656, -0.671),
    up: new runtime.Cartesian3(0.31, 0.6, 0.738),
  }
  camera.flyTo({ destination, orientation, duration: 1.05 })
  pumpSceneRenderDuringCameraFlight(currentViewer, 1150)
  scheduleSceneTimeout(
    currentViewer,
    () => {
      const snapshot = readLocalCameraSnapshot()
      if (snapshot) lastStableLocalCamera.value = snapshot
    },
    1200,
  )
  sceneMessage.value = '已平滑定位到本地 S3M 油管泄漏源。'
}

async function runParticleDemo() {
  await runDemoTask('particle', async () => {
    const baseDiffusion = await ensureDiffusionResult()
    if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
    let sourceLabel = '算法服务'
    let result: AlgorithmRecord
    try {
      const response = await withTimeout(
        runParticleFilterInversion(buildRealtimeParticlePayload(baseDiffusion)),
        8000,
        '粒子溯源算法服务响应超时',
      )
      if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
      result = unwrapAlgorithmRecord(response, '粒子滤波未返回估计源点')
      result = attachExecutionMode(result, 'algorithm-service')
    } catch (error) {
      if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
      sourceLabel = '本地兜底'
      result = buildFallbackParticleRecord(error)
      result = attachExecutionMode(result, 'local-fallback')
      pushDebugMessage(
        error instanceof Error
          ? error.message
          : '粒子滤波服务不可用，使用本地兜底溯源结果',
      )
    }
    result = {
      ...result,
      diffusionExecutionMode: getExecutionMode(baseDiffusion),
    }
    particleResult.value = result
    drawParticleOverlay(result)
    const estimatedPoint = getEstimatedSourcePoint(result)
    emit(
      'inversion-overlay',
      estimatedPoint
        ? {
            point: estimatedPoint,
            radiusMeters: Number(
              asRecord(result.estimatedSource).credibleRadius95m || 45,
            ),
          }
        : null,
    )
    pushExecutionEvidence(
      getExecutionMode(result),
      buildSuperMapCupEvidence(
        'particle',
        '粒子滤波溯源',
        result,
        estimatedPoint
          ? `估计源点 (${estimatedPoint.x.toFixed(1)}, ${estimatedPoint.y.toFixed(1)})`
          : '未返回源点',
        estimatedPoint ? describeMapPoint(estimatedPoint, 14) : '无可落图坐标',
      ),
      getExecutionMode(baseDiffusion),
    )
    return estimatedPoint
      ? `${sourceLabel}溯源结果已落到 ${overlayCoordinateLabel.value}：${describeMapPoint(estimatedPoint, 14)}`
      : '溯源返回，但缺少可落图坐标'
  })
}

async function runEvacuationDemo() {
  await runDemoTask('evacuation', async () => {
    if (!selectedEvacuationStartPoint.value)
      throw new Error('请先在三维模型内选择人员起点')
    const payload = buildRealtimeEvacuationPayload(diffusionResult.value || {})
    const result = attachExecutionMode(
      asRecord(await runSuperMapNetworkEvacuation(payload)),
      'supermap-iserver',
    )
    if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
    if (!resolveRoutePath(result).length)
      throw new Error('SuperMap iServer 未返回可落图道路路径')
    if (asRecord(result.networkVerification).valid !== true) {
      throw new Error('SuperMap 返回路径未通过道路贴合校验，结果未显示')
    }
    evacuationResult.value = result
    drawEvacuationOverlay(result)
    const path = resolveRoutePath(result)
    const exitLabel = String(
      result.exitLabel || result.selectedExitLabel || '安全出口',
    )
    const planner = String(
      result.planner ||
        asRecord(result.executor).implementation ||
        'SuperMap iServer Transportation Analyst',
    )
    pushExecutionEvidence(
      getExecutionMode(result),
      buildSuperMapCupEvidence(
        'evacuation',
        '疏散规划',
        result,
        `${path.length} 个路径点 / ${exitLabel} / ${planner}`,
        path.length
          ? `首尾点均已转换为 ${overlayCoordinateLabel.value}`
          : '未返回路径点',
      ),
    )
    return `SuperMap 道路路径已叠加到三维场景：${path.length} 个 ${overlayCoordinateLabel.value} 路径点；执行器=${planner}`
  })
}

async function runClosestDeviceDemo() {
  await runDemoTask('closest-device', async () => {
    const eventSensor = selectedSensor.value || sceneSensors.value[0]
    if (!eventSensor)
      throw new Error('没有可用的监控点位作为最近设备分析事件点')
    let sourceLabel = 'SuperMap/iServer'
    let result: AlgorithmRecord
    try {
      result = await runSuperMapClosestDeviceAnalysis(eventSensor)
      if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
      result = attachExecutionMode(result, 'supermap-iserver')
    } catch (error) {
      if (!isDemoTaskActive()) return '组件已重载，旧任务结果已忽略。'
      sourceLabel = '本地兜底'
      result = buildFallbackClosestDeviceRecord(eventSensor, error)
      result = attachExecutionMode(result, 'local-fallback')
      pushDebugMessage(
        error instanceof Error
          ? error.message
          : '最近设备服务不可用，使用本地兜底路径',
      )
    }
    drawClosestDeviceOverlay(result)
    const path = resolveRoutePath(result)
    const facilityLabel = String(
      result.facilityLabel || result.facilityId || '最近设备',
    )
    const distance = Number(result.distanceMeters || 0)
    pushExecutionEvidence(
      getExecutionMode(result),
      buildSuperMapCupEvidence(
        'closest-device',
        '最近设备分析',
        result,
        `${eventSensor.id} -> ${facilityLabel} / ${distance.toFixed(1)} m`,
        path.length
          ? `最近设备路径已转换为 ${overlayCoordinateLabel.value}`
          : '未返回路径点',
      ),
    )
    return `${sourceLabel}三维最近设备分析完成：事件点=${eventSensor.id}，最近设备=${facilityLabel}，最短路径=${distance.toFixed(1)}m`
  })
}

async function runSuperMapNetworkEvacuation(payload: AlgorithmRecord) {
  const projectedPayload = buildProjectedNetworkPayload(payload)
  if (!projectedPayload) return null
  const iServerRoads = await loadSuperMapRoadNetwork()
  // 起终点吸附、path.rjson 求解和三维贴路校验必须使用同一份 Park_RoadNetworkEdge_L 道路边。
  projectedPayload.roads = iServerRoads.map((road) => ({
    ...road,
    points: road.points.map((point) => ({ ...point })),
  }))
  // 用户选择的模型出口已按D锚点转换为iServer投影坐标。由path.rjson在真实网络内吸附并返回道路边；
  // 不再在规划前读取易波动的入口要素列表，避免入口查询失败阻断已经可用的网络分析服务。
  projectedPayload.gisDataSource =
    'SuperMap iServer Transportation Analyst / Park_RoadNetwork_Auto_N'
  projectedPayload.networkSnapSource =
    'SuperMap iServer path.rjson network topology'
  const execution = await executeSuperMapNetworkAnalysis(projectedPayload)
  const result = execution?.result
  const record = asRecord(result)
  const projectedPath = resolveRoutePath(record)
  if (!projectedPath.length) return null
  // F2 双锚点（路 B）：iServer 返回 D 系投影 path，用 D 锚点逆变换回本地系。
  // 本地系（0~1587）与 realMapAssets 同源，再经全局 A 锚点正变换落三维模型。
  const localPath = projectedPath.map((point) =>
    projectedToLocalD(point.x, point.y),
  )
  const modelRoadVerification = verifyRouteOnIserverRoads(
    localPath,
    iServerRoads,
  )
  if (!modelRoadVerification.valid) {
    throw new Error(
      `iServer 路径未贴合道路要素（最大偏差 ${modelRoadVerification.maxDistanceMeters.toFixed(2)}m）`,
    )
  }
  const candidateRoutes = Array.isArray(record.candidateRoutes)
    ? record.candidateRoutes.map((route) => {
        const routeRecord = asRecord(route)
        const routePath = resolveRoutePath(routeRecord)
        return {
          ...routeRecord,
          path: routePath.map((point) => projectedToLocalD(point.x, point.y)),
          projectedPath: routePath,
        }
      })
    : undefined
  return {
    ...record,
    path: localPath,
    projectedPath,
    candidateRoutes,
    planner: 'SuperMap iServer Transportation Analyst',
    executor: {
      mode: 'supermap-network-analysis',
      runtime: 'iserver-rest',
      implementation: 'SuperMap iServer Transportation Analyst path.rjson',
      coordinateSystem: 'EPSG:4547 / CGCS2000_3GK_CM_114E',
    },
    modelRoadVerification,
  }
}

function verifyRouteOnIserverRoads(
  path: SuperMapCupMapPoint[],
  roads: Awaited<ReturnType<typeof loadSuperMapRoadNetwork>>,
) {
  if (path.length < 2) {
    return {
      valid: false,
      maxDistanceMeters: Number.POSITIVE_INFINITY,
      matchedRoadCount: 0,
    }
  }
  const localRoadLines = roads
    .map((road) =>
      road.points.map((point) => projectedToLocalD(point.x, point.y)),
    )
    .filter((points) => points.length >= 2)
  if (!localRoadLines.length) {
    return {
      valid: false,
      maxDistanceMeters: Number.POSITIVE_INFINITY,
      matchedRoadCount: 0,
    }
  }
  const distances = path.map((point) =>
    Math.min(
      ...localRoadLines.map((line) => pointToPolylineDistance(point, line)),
    ),
  )
  const toleranceMeters = 3
  return {
    valid: distances.every((distance) => distance <= toleranceMeters),
    maxDistanceMeters: Math.max(...distances),
    matchedRoadCount: localRoadLines.length,
  }
}

function pointToPolylineDistance(
  point: SuperMapCupMapPoint,
  line: SuperMapCupMapPoint[],
) {
  let closestDistance = Number.POSITIVE_INFINITY
  for (let index = 1; index < line.length; index += 1) {
    closestDistance = Math.min(
      closestDistance,
      pointToSegmentDistance(point, line[index - 1], line[index]),
    )
  }
  return closestDistance
}

function pointToSegmentDistance(
  point: SuperMapCupMapPoint,
  start: SuperMapCupMapPoint,
  end: SuperMapCupMapPoint,
) {
  const deltaX = end.x - start.x
  const deltaY = end.y - start.y
  const lengthSquared = deltaX * deltaX + deltaY * deltaY
  if (lengthSquared <= 0.000001)
    return Math.hypot(point.x - start.x, point.y - start.y)
  const ratio = clamp(
    ((point.x - start.x) * deltaX + (point.y - start.y) * deltaY) /
      lengthSquared,
    0,
    1,
  )
  return Math.hypot(
    point.x - (start.x + ratio * deltaX),
    point.y - (start.y + ratio * deltaY),
  )
}

async function runSuperMapClosestDeviceAnalysis(
  eventSensor: ModelBoundMonitorSensor,
): Promise<AlgorithmRecord> {
  const projectedPayload = buildProjectedClosestDevicePayload(eventSensor)
  if (!projectedPayload) throw new Error('最近设备分析缺少事件点或候选设备')
  try {
    const planningInputs = await loadSuperMapPlanningInputs()
    projectedPayload.roads = planningInputs.roads
    projectedPayload.gisDataSource = planningInputs.sourceLabel
    projectedPayload.networkSnapSource =
      'SuperMap iServer Data / Park_RoadNetworkEdge_L'
  } catch (error) {
    pushDebugMessage(
      error instanceof Error
        ? error.message
        : 'iServer Data 路网读取失败，使用演示静态道路兜底',
    )
  }
  const execution =
    await executeSuperMapClosestFacilitiesAnalysis(projectedPayload)
  const record = asRecord(execution?.result)
  const projectedPath = resolveRoutePath(record)
  if (!projectedPath.length)
    throw new Error('SuperMap 最近设施分析未返回可落图路径')
  // F2 双锚点（路 B）：iServer 返回 D 系投影 path，用 D 锚点逆变换回本地系。
  const localPath = projectedPath.map((point) =>
    projectedToLocalD(point.x, point.y),
  )
  const facilityRecord = asRecord(record.facility)
  const candidateRoutes = Array.isArray(record.candidateRoutes)
    ? record.candidateRoutes.map((route) => {
        const routeRecord = asRecord(route)
        const routePath = resolveRoutePath(routeRecord)
        return {
          ...routeRecord,
          path: routePath.map((point) => projectedToLocalD(point.x, point.y)),
          projectedPath: routePath,
        }
      })
    : undefined
  return {
    ...record,
    path: localPath,
    projectedPath,
    candidateRoutes,
    eventSensorId: eventSensor.id,
    eventSensorModelName: eventSensor.modelName,
    facility: {
      ...facilityRecord,
      point: toLocalPoint(asRecord(facilityRecord.point)) || undefined,
      originalPoint:
        toLocalPoint(asRecord(facilityRecord.originalPoint)) || undefined,
    },
    planner: 'SuperMap iServer Transportation Analyst',
    executor: {
      ...asRecord(record.executor),
      coordinateSystem: 'EPSG:4547 / CGCS2000_3GK_CM_114E',
    },
  } as AlgorithmRecord
}

function buildProjectedNetworkPayload(
  payload: AlgorithmRecord,
): AlgorithmRecord | null {
  const startPoint = toMapPoint(payload.startPoint)
  const parkEntrances = Array.isArray(payload.parkEntrances)
    ? payload.parkEntrances.map(asRecord)
    : []
  if (!startPoint || !parkEntrances.length) return null
  return {
    ...payload,
    roads: Array.isArray(payload.roads)
      ? payload.roads
          .map((item) => projectRoadRect(asRecord(item)))
          .filter(Boolean)
      : [],
    startPoint: projectPoint(startPoint),
    parkEntrances: parkEntrances.map((entrance, index) => ({
      ...entrance,
      ...projectPoint({
        x: Number(entrance.x),
        y: Number(entrance.y),
      }),
      id: entrance.id || `park-exit-${index + 1}`,
      label: entrance.label || entrance.name || `园区出口${index + 1}`,
    })),
    coordSys: 'CGCS2000_3GK_CM_114E / EPSG:4547',
    map: {
      ...asRecord(payload.map),
      coordSys: 'CGCS2000_3GK_CM_114E',
      epsg: 4547,
    },
  }
}

function buildProjectedClosestDevicePayload(
  eventSensor: ModelBoundMonitorSensor,
): AlgorithmRecord | null {
  const candidates = closestDeviceCandidates(eventSensor)
  if (!candidates.length) return null
  return {
    eventPoint: projectPoint(eventSensor.mapPoint),
    eventSensorId: eventSensor.id,
    eventSensorModelName: eventSensor.modelName,
    facilities: candidates.map((sensor) => ({
      id: sensor.id,
      label: `${sensor.id} · ${sensor.modelName}`,
      modelName: sensor.modelName,
      role: sensor.observationRole,
      point: projectPoint(sensor.mapPoint),
      mapPoint: projectPoint(sensor.mapPoint),
    })),
    roads: [],
    coordSys: 'CGCS2000_3GK_CM_114E / EPSG:4547',
    map: {
      coordSys: 'CGCS2000_3GK_CM_114E',
      epsg: 4547,
      mapMetersPerUnit: 1,
    },
  }
}

function closestDeviceCandidates(eventSensor: ModelBoundMonitorSensor) {
  // F11（2026-08-01）：B 套点位全部为 gas-concentration，直接按距离取最近
  const pool = sceneSensors.value.filter(
    (sensor) => sensor.id !== eventSensor.id,
  )
  return pool
    .slice()
    .sort((left, right) => {
      const leftDistance = Math.hypot(
        left.x - eventSensor.x,
        left.y - eventSensor.y,
      )
      const rightDistance = Math.hypot(
        right.x - eventSensor.x,
        right.y - eventSensor.y,
      )
      return leftDistance - rightDistance
    })
    .slice(0, 12)
}

// F2 双锚点（2026-07-18，路 B）：iServer 链路专用 D 锚点正变换。
// iServer 数据集锚定在 D（HAUT 莲花南门，投影 457692.843/3856127.172 系），
// 故发给 iServer 的起点/出口/道路必须用 D 锚点投影，iServer 才能在同系路网上吸附成功。
// 全局 localToProjected（A/B 锚点）用于 Python 链路与交互落图，不与此混淆。
function projectPoint(point: SuperMapCupMapPoint) {
  const projected = localToProjectedD(point.x, point.y)
  return {
    x: projected.easting,
    y: projected.northing,
    easting: projected.easting,
    northing: projected.northing,
  }
}

function projectRoadRect(road: AlgorithmRecord) {
  const x = Number(road.x)
  const y = Number(road.y)
  const w = Number(road.w)
  const h = Number(road.h)
  if (![x, y, w, h].every(Number.isFinite)) return null
  const start = projectPoint({ x, y })
  const end = projectPoint({ x: x + w, y: y + h })
  return {
    ...road,
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    w: Math.abs(end.x - start.x) || 1,
    h: Math.abs(end.y - start.y) || 1,
  }
}

function buildRealtimeDiffusionPayload(): AlgorithmRecord {
  const payload = { ...buildSuperMapCupDiffusionPayload() }
  const sourcePoint = currentAlgorithmSourcePoint()
  const leakAnchor = currentLeakSourceAnchor4490()
  payload.sourceMapPoint = sourcePoint
  payload.sourceFacilityId = leakAnchor.facilityId
  payload.leakSourceId = leakAnchor.leakSourceId
  payload.gasCode = leakAnchor.gasCode
  payload.gasId = leakAnchor.gasCode.toLowerCase()
  payload.sourceShape = leakAnchor.sourceShape
  payload.releaseHeight = leakAnchor.heightMeters
  payload.point4490 = {
    longitude: leakAnchor.longitude,
    latitude: leakAnchor.latitude,
    heightMeters: leakAnchor.heightMeters,
  }
  payload.volumeFence = { ...leakAnchor.volumeFence }
  payload.spatialBinding = {
    crs: 'EPSG:4490',
    modelObjectId: leakAnchor.modelObjectId,
    positionStatus: leakAnchor.positionStatus,
  }
  const env = sceneViewerProps.environmentSnapshot
  if (!env?.available) return payload
  const windSpeed = toFiniteNumber(env.windSpeed)
  const windDirection = toFiniteNumber(env.windDirection)
  const temperature = toFiniteNumber(env.temperature)
  const humidity = toFiniteNumber(env.humidity)
  if (windSpeed !== null) payload.windSpeed = windSpeed
  if (windDirection !== null) payload.windDirection = windDirection
  if (temperature !== null) {
    payload.initialTemperature = temperature
    payload.ambientTemperature = temperature
  }
  if (humidity !== null) payload.humidity = humidity
  payload.environmentSource = env.source || 'monitoring/overview'
  payload.environmentObservedAt = env.observedAt || null
  payload.environmentBinding = 'AUTO_MONITORING_OVERVIEW'
  return payload
}

function buildRealtimeParticlePayload(
  diffusionResult: AlgorithmRecord,
): AlgorithmRecord {
  const payload = { ...buildSuperMapCupParticlePayload(diffusionResult) }
  const sourcePoint = currentAlgorithmSourcePoint()
  payload.trueSourceMapPoint = sourcePoint
  payload.scenario = {
    ...asRecord(payload.scenario),
    sourceMapPoint: sourcePoint,
  }
  return payload
}

function buildRealtimeEvacuationPayload(
  diffusionResult: AlgorithmRecord,
): AlgorithmRecord {
  const payload = { ...buildSuperMapCupEvacuationPayload(diffusionResult) }
  const publishedExits = requirePublishedEntranceCandidates()
  const startPoint = currentEvacuationStartPoint()
  payload.startPoint = startPoint
  payload.startLabel = selectedEvacuationStartPoint.value
    ? '三维点击人员位置'
    : String(payload.startLabel || '默认人员起点')
  payload.parkEntrances = publishedExits.map((exit) => ({
    id: exit.id,
    label: exit.label,
    x: exit.point.x,
    y: exit.point.y,
    mapPoint: exit.point,
  }))
  if (shouldUseThreeDTiles.value) {
    payload.roads = roads.map((road) => ({ ...road }))
    payload.routeObjective = 'supermap-road-route'
    payload.costFields = ['network_length']
  }
  return payload
}

function requirePublishedEntranceCandidates() {
  const publishedExits = THREE_TILES_SAFE_EXITS.filter((exit) => {
    const anchor = getEntranceAnchor4490(exit.id)
    return anchor ? isModelBoundPosition(anchor.positionStatus) : false
  })
  if (!publishedExits.length) {
    throw new Error(
      '当前没有经过 iServer 发布点位校核的出入口，已阻止使用旧估算坐标进行疏散规划',
    )
  }
  return publishedExits
}

function currentAlgorithmSourcePoint() {
  return leakSourceToAlgorithmPoint(currentLeakSourceAnchor4490())
}

function currentLeakSourceAnchor4490(): LeakSourceAnchor4490 {
  const source =
    getLeakSourceAnchor4490(activeLeakSourceId.value) ||
    LEAK_SOURCE_ANCHORS_4490[0]
  if (!source || !isModelBoundPosition(source.positionStatus)) {
    throw new Error('泄漏源尚未绑定到 EPSG:4490 三维模型设备表面')
  }
  return source
}

function resolveLeakSourceFromAnalysisPoint(
  point: SuperMapCupMapPoint,
): LeakSourceAnchor4490 | null {
  let nearest: { source: LeakSourceAnchor4490; distance: number } | null = null
  LEAK_SOURCE_ANCHORS_4490.forEach((source) => {
    const candidate = leakSourceToAlgorithmPoint(source)
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y)
    if (!nearest || distance < nearest.distance) nearest = { source, distance }
  })
  return nearest?.distance <= 8 ? nearest.source : null
}

function currentEvacuationStartPoint() {
  if (selectedEvacuationStartPoint.value)
    return selectedEvacuationStartPoint.value
  if (shouldUseThreeDTiles.value) {
    return snapPointToThreeTilesRouteRoad(
      THREE_TILES_EQUIPMENT_BY_ID.get('building-center-01')?.point ||
        threeTilesAlgorithmSourcePoint(),
    )
  }
  return getFacilityPoint(SUPERMAP_CUP_SCENARIO.startFacility)
}

function selectEvacuationExit(exitId: string) {
  const exit = THREE_TILES_SAFE_EXITS.find((item) => item.id === exitId)
  if (!exit) throw new Error('未找到指定园区出入口')
  const anchor = getEntranceAnchor4490(exit.id)
  if (!anchor) throw new Error(`出入口 ${exit.id} 缺少 EPSG:4490 场景锚点`)
  if (!isModelBoundPosition(anchor.positionStatus)) {
    throw new Error(
      `出入口 ${anchor.entranceId} 尚未绑定到三维厂房表面，已阻止错误相机定位和路径终点计算`,
    )
  }
  selectedEvacuationExitId.value = exit.id
  flyToEntranceAnchor4490(anchor)
  sceneMessage.value = `已定位目标出口：${exit.label}（${anchor.entranceId}，EPSG:4490）。路径终点、三维标记和相机共用同一资产 ID。`
}

function flyToEntranceAnchor4490(anchor: SceneAnchor4490) {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  const camera = currentViewer?.scene?.camera || currentViewer?.camera
  if (!runtime?.Cartesian3 || !camera?.flyTo) return

  const target = geoToEcef(
    anchor.longitude,
    anchor.latitude,
    anchor.heightMeters,
  )
  const basis = enuBasis(anchor.longitude, anchor.latitude)
  const headingRadians = (anchor.camera.headingDegrees * Math.PI) / 180
  const horizontalDirection = normalizeVector(
    addVector(
      scaleVector(basis.east, Math.sin(headingRadians)),
      scaleVector(basis.north, Math.cos(headingRadians)),
    ),
  )
  if (!horizontalDirection) return
  const pitchRadians = (Math.abs(anchor.camera.pitchDegrees) * Math.PI) / 180
  const horizontalMeters = anchor.camera.distanceMeters * Math.cos(pitchRadians)
  const verticalMeters =
    anchor.camera.distanceMeters * Math.sin(pitchRadians) + 3
  const destinationEcef = addVector(
    addVector(target, scaleVector(horizontalDirection, -horizontalMeters)),
    scaleVector(basis.up, verticalMeters),
  )
  const direction = normalizeVector(subtractVector(target, destinationEcef))
  const right = direction
    ? normalizeVector(crossVector(direction, basis.up))
    : null
  const cameraUp =
    direction && right
      ? normalizeVector(crossVector(right, direction))
      : basis.up
  const frustum = camera.frustum as
    | { fov?: number; near?: number; far?: number }
    | undefined
  if (frustum) {
    frustum.fov = (anchor.camera.fieldOfViewDegrees * Math.PI) / 180
    frustum.near = 0.5
    frustum.far = Math.max(2000, anchor.camera.distanceMeters * 40)
  }
  camera.flyTo({
    destination: new runtime.Cartesian3(
      destinationEcef.x,
      destinationEcef.y,
      destinationEcef.z,
    ),
    orientation:
      direction && cameraUp
        ? {
            direction: new runtime.Cartesian3(
              direction.x,
              direction.y,
              direction.z,
            ),
            up: new runtime.Cartesian3(cameraUp.x, cameraUp.y, cameraUp.z),
          }
        : undefined,
    duration: 0.9,
    complete: requestSceneRender,
  })
  pumpSceneRenderDuringCameraFlight(currentViewer, 1000)
}

function toFiniteNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

async function runDemoTask(_kind: string, executor: () => Promise<string>) {
  if (demoTaskState.value === 'running') return
  const taskId = ++activeDemoTaskId
  const generation = sceneGeneration
  activeDemoTaskGeneration = generation
  currentDemoTaskKind.value = _kind
  demoTaskState.value = 'running'
  demoTaskMessage.value = '正在调用 SuperMap/iServer 服务并准备三维图层...'
  publishAlgorithmStatus()
  try {
    const message = await executor()
    if (!isDemoTaskActive(taskId, generation)) return
    demoTaskState.value = 'success'
    demoTaskMessage.value = message
    publishAlgorithmStatus()
  } catch (error) {
    if (!isDemoTaskActive(taskId, generation)) return
    demoTaskState.value = 'error'
    demoTaskMessage.value =
      error instanceof Error ? error.message : '算法执行失败'
    publishAlgorithmStatus()
  }
}

function isDemoTaskActive(
  taskId = activeDemoTaskId,
  generation = activeDemoTaskGeneration,
) {
  return (
    !componentDestroyed &&
    taskId === activeDemoTaskId &&
    generation === sceneGeneration
  )
}

async function ensureDiffusionResult() {
  if (diffusionResult.value) return diffusionResult.value
  let result: AlgorithmRecord
  try {
    const response = await withTimeout(
      runDiffusionSimulation(buildRealtimeDiffusionPayload()),
      8000,
      '扩散算法服务响应超时',
    )
    if (!isDemoTaskActive())
      return diffusionResult.value || buildFallbackDiffusionRecord()
    result = unwrapAlgorithmRecord(response, '扩散模拟未返回有效结果')
    result = attachExecutionMode(result, 'algorithm-service')
  } catch (error) {
    if (!isDemoTaskActive()) {
      return (
        diffusionResult.value ||
        attachExecutionMode(
          buildFallbackDiffusionRecord(error),
          'local-fallback',
        )
      )
    }
    result = buildFallbackDiffusionRecord(error)
    result = attachExecutionMode(result, 'local-fallback')
    pushDebugMessage(
      error instanceof Error
        ? error.message
        : '扩散服务不可用，使用本地兜底扩散结果',
    )
  }
  diffusionResult.value = result
  drawDiffusionOverlay(result)
  return result
}

function drawDiffusionOverlay(result: AlgorithmRecord) {
  unifiedDiffusionPlaybackActive = null
  velocityParticleTimeScale = 1
  clearOverlayGroup('diffusion')
  emit('diffusion-heatmap', buildDiffusionHeatmapPayload(result))
  withOverlayGroup('diffusion', () => drawDiffusionOverlayEntities(result))
}

/**
 * 接收数字园区二维工作区当前帧并在同一 LOCALMAP 坐标基准下重绘三维云团。
 * 二维是算法状态的唯一来源，三维只负责空间表达，避免两套播放时钟漂移。
 */
function renderUnifiedDiffusionFrame(payload: UnifiedDiffusionFramePayload) {
  setUnifiedDiffusionPlaybackState(payload)
  clearOverlayGroup('diffusion')
  if (import.meta.env.VITE_FEATURE_DIFFUSION_3D === 'false') {
    requestSceneRender()
    return
  }
  if (!payload.frame) {
    requestSceneRender()
    return
  }
  if (payload.source) {
    selectedLeakSourcePoint.value = algorithmToLocal(
      clampMapPoint(payload.source),
    )
    const resolvedAnchor = resolveLeakSourceFromAnalysisPoint(payload.source)
    if (resolvedAnchor) activeLeakSourceId.value = resolvedAnchor.leakSourceId
  }
  const peakConcentration = Math.max(
    Number(payload.frame.maxConcentration || 0),
    ...payload.frame.cells.map((cell) => Number(cell.concentration || 0)),
    1,
  )
  const result: AlgorithmRecord = {
    frames: [payload.frame],
    gas: { color: payload.gasColor },
    stats: {
      peakConcentration,
      frameIndex: payload.frameIndex,
      frameCount: payload.frameCount,
    },
  }
  diffusionResult.value = result
  withOverlayGroup('diffusion', () => {
    drawDiffusionOverlayEntities(result)
    drawUnifiedSensorTelemetry(payload.frame as AlgorithmRecord)
  })
  sceneMessage.value = `扩散帧 ${payload.frameIndex + 1}/${payload.frameCount} 已同步到三维${payload.isPlaying ? '（播放中）' : '（已暂停）'}。`
  requestSceneRender()
}

function setUnifiedDiffusionPlaybackState(
  payload: UnifiedDiffusionFramePayload,
) {
  unifiedDiffusionPlaybackActive = payload.isPlaying
  velocityParticleTimeScale =
    resolveDiffusionSimulationSecondsPerRealSecond(payload)
  if (!payload.isPlaying) stopVelocityParticleLoop(false)
}

/** 在三维主视角直接显示本帧监控点收到的浓度，避免数据只存在于右侧详情面板。 */
function drawUnifiedSensorTelemetry(frame: AlgorithmRecord) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return
  const readings = (
    Array.isArray(frame.sensorReadings)
      ? frame.sensorReadings.map(asRecord)
      : []
  )
    .filter(
      (reading) =>
        Number.isFinite(Number(reading.x)) &&
        Number.isFinite(Number(reading.y)),
    )
    .sort(
      (left, right) =>
        Number(right.concentration || 0) - Number(left.concentration || 0),
    )
    .slice(0, 18)

  readings.forEach((reading) => {
    const concentration = Math.max(0, Number(reading.concentration || 0))
    const sensorId = String(reading.sensorId || reading.id || '监控点')
    const heightMeters = Math.max(0.2, Number(reading.heightMeters || 1.5))
    const position = diffusionVolumeCellToSceneCartesian({
      x: Number(reading.x),
      y: Number(reading.y),
      zOffsetMeters: heightMeters,
      radiusMeters: 0.5,
      radiusAlongMeters: 0.5,
      radiusCrossMeters: 0.5,
      radiusVerticalMeters: 0.5,
      headingDegrees: 0,
      particleCount: 1,
      particleSeed: 0,
      shape: 'SENSOR',
      speedFactor: 1,
      densityFactor: 1,
      turbulence: 0,
      concentration,
    })
    if (!position) return
    const color = concentration > 0.0001 ? '#35d2ff' : '#7a9aa3'
    addEntity({
      name: `实时监控读数 · ${sensorId}`,
      position,
      point: {
        pixelSize: concentration > 0.0001 ? 9 : 6,
        color: colorFromCss(color, 0.98),
        outlineColor: colorFromCss('#ffffff', 0.9),
        outlineWidth: 1.5,
        disableDepthTestDistance: 600,
      },
      label: {
        text: `${sensorId}\n${concentration.toFixed(3)} ppm`,
        font: '700 11px sans-serif',
        fillColor: colorFromCss(color, 0.98),
        outlineColor: colorFromCss('#001827', 0.96),
        outlineWidth: 3,
        pixelOffset: { x: 0, y: -22 },
        disableDepthTestDistance: 600,
      },
      description: `扩散实时采样 · ${sensorId} · ${concentration.toFixed(4)} ppm · 安装高度 ${heightMeters.toFixed(1)}m`,
    })
  })
}

/**
 * 将二维溯源的粗搜索、EKI 收敛和粒子估计逐阶段投影到三维。
 * 每个阶段都携带之前阶段的结果，因此重绘不会留下过期实体。
 */
function renderUnifiedInversionStage(payload: UnifiedInversionStagePayload) {
  clearOverlayGroup('particle')
  activeInversionLegendStage.value = payload.stage
  const visualizationPolicy = inversionVisualizationPolicy(payload.stage)
  let renderedDensityCloud = false
  let renderedParticleCount = 0
  withOverlayGroup('particle', () => {
    if (
      visualizationPolicy.showDensity &&
      import.meta.env.VITE_FEATURE_INVERSION_KDE_3D !== 'false' &&
      payload.posteriorDensityGeoJSON
    ) {
      renderedDensityCloud = drawParticleKdeSurface({
        posteriorDensityGeoJSON: payload.posteriorDensityGeoJSON,
      })
    }
    if (
      visualizationPolicy.particleLimit > 0 &&
      import.meta.env.VITE_FEATURE_INVERSION_KDE_3D !== 'false' &&
      payload.posteriorParticles?.length
    ) {
      renderedParticleCount = drawPosteriorParticleSamples(
        payload.posteriorParticles,
        visualizationPolicy.particleLimit,
        false,
        visualizationPolicy.minimumParticleWeight,
      )
    }
    payload.candidates
      .slice()
      .sort((left, right) => left.rank - right.rank)
      .slice(0, visualizationPolicy.candidateLimit)
      .forEach((candidate) => {
        const point = algorithmToLocal(clampMapPoint(candidate.center))
        addEllipseEntity(point, {
          title: `粗搜索 #${candidate.rank} · ${candidate.label}`,
          radius: Math.max(4, Number(candidate.radius || 12)),
          color: '#38bdf8',
          alpha: 0.32,
          altitudeOffset: 1.1,
          verticalRadius: 0.4,
        })
        addPointEntity(point, `粗搜索 #${candidate.rank}`, '#38bdf8', 9)
      })

    if (visualizationPolicy.showRefinement && payload.refinement) {
      const point = algorithmToLocal(clampMapPoint(payload.refinement.center))
      addEllipseEntity(point, {
        title: `EKI 第 ${payload.refinement.iteration} 轮`,
        radius: Math.max(3, Number(payload.refinement.radius || 8)),
        color: '#ffb020',
        alpha: 0.4,
        altitudeOffset: 1.5,
        verticalRadius: 0.5,
      })
      addPointEntity(point, 'EKI 收敛中心', '#ffb020', 13)
    }

    if (visualizationPolicy.showConfidence && payload.estimatedPoint) {
      const point = algorithmToLocal(clampMapPoint(payload.estimatedPoint))
      addEllipseEntity(point, {
        title: '粒子滤波 95% 置信区',
        radius: Math.max(
          5,
          Number(
            payload.credibleRadius95m ||
              Number(payload.refinement?.radius || 10) * 0.65,
          ),
        ),
        color: '#f472b6',
        alpha: visualizationPolicy.confidenceAlpha,
        altitudeOffset: 1.8,
        verticalRadius: 0.65,
      })
      addPointEntity(point, '最终估计源', '#ff5a4f', 19)
    }
  })
  const stageText =
    payload.stage === 'coarse'
      ? '粗搜索'
      : payload.stage === 'refinement'
        ? 'EKI'
        : '粒子滤波'
  sceneMessage.value =
    payload.stage === 'particle'
      ? `粒子滤波最终结果已同步到三维：最终估计源、95% 置信范围与 ${renderedParticleCount} 个高权重样本。`
      : renderedDensityCloud
        ? `${stageText}结果、${renderedParticleCount} 个加权粒子样本及后验概率密度云已同步到三维。`
        : `${stageText}结果已同步到三维。`
  requestSceneRender()
}

function buildDiffusionHeatmapPayload(
  result: AlgorithmRecord,
): DiffusionHeatmapPayload | null {
  const frame = selectFinalDiffusionFrame(result)
  const cells = Array.isArray(frame.cells)
    ? frame.cells
        .map(asRecord)
        .map((cell) => {
          const point = toMapPoint(cell)
          const concentration = Number(cell.concentration)
          if (!point || !Number.isFinite(concentration) || concentration <= 0)
            return null
          return {
            x: point.x,
            y: point.y,
            size: Math.max(12, Number(cell.size || 20)),
            concentration,
          }
        })
        .filter((cell): cell is DiffusionHeatmapPayload['cells'][number] =>
          Boolean(cell),
        )
        .sort((left, right) => right.concentration - left.concentration)
        .slice(0, 96)
    : []
  if (!cells.length) return null
  return {
    source: currentAlgorithmSourcePoint(),
    cells,
    peakConcentration: Math.max(...cells.map((cell) => cell.concentration), 1),
  }
}

function drawDiffusionOverlayEntities(result: AlgorithmRecord) {
  const runtime = getRuntime()
  const frame = selectFinalDiffusionFrame(result)
  const gasColor = String(asRecord(result.gas).color || '#35d2ff')
  const cells = Array.isArray(frame.cells)
    ? frame.cells.map(asRecord).filter((cell) => Number(cell.concentration) > 0)
    : []
  const volumeCells = resolveDiffusionVolumeCells(frame, cells)
  const peak = Math.max(...volumeCells.map((cell) => cell.concentration), 1)
  diffusionScreenOverlayCells.value = []
  addModelBoundLeakSourceEntity()
  selectDiffusionVolumeCellsForRendering(
    volumeCells,
    geographicSceneMode.value
      ? VOLUMETRIC_DIFFUSION_CELL_LIMIT
      : NATIVE_DIFFUSION_CELL_LIMIT,
  ).forEach((cell) => {
    const ratio = Math.min(1, cell.concentration / peak)
    addVolumetricGasCell(cell, gasColor, ratio)
  })
  drawVelocityParticleField(result)
  if (!runtime) return
  requestSceneRender()
}

function selectDiffusionVolumeCellsForRendering(
  volumeCells: DiffusionVolumeCell[],
  limit: number,
): DiffusionVolumeCell[] {
  if (volumeCells.length <= limit) return volumeCells
  const concentrationRanked = [...volumeCells].sort(
    (left, right) => right.concentration - left.concentration,
  )
  const coreCount = Math.max(1, Math.round(limit * 0.62))
  const selected = concentrationRanked.slice(0, coreCount)
  const selectedCells = new Set(selected)
  const extentRanked = [...volumeCells].sort(
    (left, right) =>
      Number(right.alongWindDistanceMeters ?? right.sourceDistanceMeters ?? 0) -
      Number(left.alongWindDistanceMeters ?? left.sourceDistanceMeters ?? 0),
  )
  for (const cell of extentRanked) {
    if (selected.length >= limit) break
    if (selectedCells.has(cell)) continue
    selected.push(cell)
    selectedCells.add(cell)
  }
  return selected
}

function resolveDiffusionVolumeCells(
  frame: AlgorithmRecord,
  planarCells: AlgorithmRecord[],
): DiffusionVolumeCell[] {
  const algorithmVolumeCells = Array.isArray(frame.volumeCells)
    ? frame.volumeCells
        .map(asRecord)
        .map(toDiffusionVolumeCell)
        .filter((cell): cell is DiffusionVolumeCell => Boolean(cell))
    : []
  if (algorithmVolumeCells.length) return algorithmVolumeCells
  return planarCells
    .sort(
      (left, right) =>
        Number(right.concentration || 0) - Number(left.concentration || 0),
    )
    .slice(0, 32)
    .flatMap((cell) => {
      const point = toMapPoint(cell)
      const concentration = Number(cell.concentration || 0)
      if (!point || concentration <= 0) return []
      return [0.8, 5, 10].map((zOffsetMeters, index) => ({
        ...point,
        zOffsetMeters,
        radiusMeters: Math.max(Number(cell.size || 20) * 0.16, 1),
        radiusAlongMeters: Math.max(Number(cell.size || 20) * 0.34, 1.6),
        radiusCrossMeters: Math.max(Number(cell.size || 20) * 0.14, 0.8),
        radiusVerticalMeters: Math.max(Number(cell.size || 20) * 0.12, 0.7),
        headingDegrees: 0,
        particleCount: 2,
        particleSeed: Math.abs(
          Math.round(point.x * 73856093 + point.y * 19349663 + index),
        ),
        shape: 'NEUTRAL_PUFF',
        speedFactor: 1,
        densityFactor: 1,
        turbulence: 0.3,
        concentration: concentration * Math.exp(-0.42 * index * index),
        level: String(cell.level || 'low'),
      }))
    })
}

function toDiffusionVolumeCell(
  cell: AlgorithmRecord,
): DiffusionVolumeCell | null {
  const x = Number(cell.x)
  const y = Number(cell.y)
  const legacyAbsoluteHeightMeters = Number(cell.zMeters)
  const zOffsetMeters = Number(
    cell.zOffsetMeters === undefined
      ? Math.max(0, legacyAbsoluteHeightMeters - 0.8)
      : cell.zOffsetMeters,
  )
  const radiusMeters = Number(cell.radiusMeters)
  const radiusAlongMeters = Number(cell.radiusAlongMeters ?? radiusMeters * 1.8)
  const radiusCrossMeters = Number(cell.radiusCrossMeters ?? radiusMeters * 0.9)
  const radiusVerticalMeters = Number(
    cell.radiusVerticalMeters ?? radiusMeters * 0.72,
  )
  const headingDegrees = Number(cell.headingDegrees ?? 0)
  const particleCount = Number(cell.particleCount ?? 2)
  const particleSeed = Number(cell.particleSeed ?? 1)
  const speedFactor = Number(cell.speedFactor ?? 1)
  const densityFactor = Number(cell.densityFactor ?? 1)
  const turbulence = Number(cell.turbulence ?? 0.3)
  const concentration = Number(cell.concentration)
  const particleAgeSeconds = Number(cell.particleAgeSeconds)
  const alongWindDistanceMeters = Number(cell.alongWindDistanceMeters)
  const crossWindDistanceMeters = Number(cell.crossWindDistanceMeters)
  const sourceDistanceMeters = Number(cell.sourceDistanceMeters)
  if (
    ![
      x,
      y,
      zOffsetMeters,
      radiusMeters,
      radiusAlongMeters,
      radiusCrossMeters,
      radiusVerticalMeters,
      headingDegrees,
      particleCount,
      particleSeed,
      speedFactor,
      densityFactor,
      turbulence,
      concentration,
    ].every(Number.isFinite) ||
    radiusMeters <= 0 ||
    concentration <= 0
  )
    return null
  return {
    x,
    y,
    zOffsetMeters,
    radiusMeters,
    radiusAlongMeters,
    radiusCrossMeters,
    radiusVerticalMeters,
    headingDegrees,
    particleCount: Math.round(clamp(particleCount, 4, 8)),
    particleSeed: Math.abs(Math.round(particleSeed)),
    shape: String(cell.shape || 'NEUTRAL_PUFF'),
    speedFactor,
    densityFactor,
    turbulence,
    concentration,
    ...(Number.isFinite(particleAgeSeconds) ? { particleAgeSeconds } : {}),
    ...(Number.isFinite(alongWindDistanceMeters)
      ? { alongWindDistanceMeters }
      : {}),
    ...(Number.isFinite(crossWindDistanceMeters)
      ? { crossWindDistanceMeters }
      : {}),
    ...(Number.isFinite(sourceDistanceMeters) ? { sourceDistanceMeters } : {}),
    level: String(cell.level || 'low'),
  }
}

function clearDevicePointLayer() {
  const entities = viewer.value?.entities
  if (entities) {
    devicePointEntities.value.forEach((entity) => entities.remove(entity))
  }
  devicePointEntities.value = []
  requestSceneRender()
}

/**
 * 渲染 2026 配准版设备点位。全部 1072 条数据仍在客户端查询缓存中，场景仅按约 20m
 * 网格显示代表点，避免同一设备上的低位、高位、火焰等传感器图标互相覆盖。
 */
async function renderDevicePointLayer() {
  if (!sceneViewerProps.showDevicePoints2026) {
    clearDevicePointLayer()
    return
  }
  // 仅在地理坐标场景放置（huangong S3M @ 郑州或 3D Tiles）；本地米制场景坐标系不匹配
  if (!geographicSceneMode.value) return
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime || !currentViewer) return
  clearDevicePointLayer()
  let features: GeoFeature[]
  try {
    features = await loadDevicePoints()
  } catch {
    return
  }
  if (componentDestroyed || viewer.value !== currentViewer) return
  // 捕获为 const 局部，使窄化在下方 forEach 闭包内保持
  const fromDegrees = runtime.Cartesian3?.fromDegrees
  const entities = currentViewer.entities
  if (!fromDegrees || !entities) return
  const next: unknown[] = []
  const representatives = new Map<
    string,
    { feature: GeoFeature; sourceIndex: number; count: number }
  >()
  features.forEach((feature, sourceIndex) => {
    const properties = feature.properties as Record<string, unknown>
    const longitude = Number(properties.Wgs84Lon)
    const latitude = Number(properties.Wgs84Lat)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return
    const gridKey = `${Math.round(longitude / DEVICE_POINT_GRID_DEGREES)}:${Math.round(latitude / DEVICE_POINT_GRID_DEGREES)}`
    const previous = representatives.get(gridKey)
    if (!previous) {
      representatives.set(gridKey, { feature, sourceIndex, count: 1 })
      return
    }
    previous.count += 1
    const previousHeight = Number(
      previous.feature.properties.InstallHeight ?? 0,
    )
    const currentHeight = Number(properties.InstallHeight ?? 0)
    if (currentHeight > previousHeight) {
      previous.feature = feature
      previous.sourceIndex = sourceIndex
    }
  })
  representatives.forEach(({ feature: f, sourceIndex: idx, count }) => {
    const p = f.properties as Record<string, unknown>
    const lon = Number(p.Wgs84Lon)
    const lat = Number(p.Wgs84Lat)
    const h = Number(p.InstallHeight ?? 0)
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return
    const position = fromDegrees(lon, lat, h)
    if (!position) return
    const sid = String(p.SensorID ?? idx)
    const modelName = String(p.ModelName ?? '未关联设备')
    const entity = entities.add({
      position,
      id: `devicepoint-${sid}`,
      name: `监控点 ${sid}`,
      devicePointSensorId: sid,
      devicePointModelName: modelName,
      devicePointClusterCount: count,
      point: {
        pixelSize: 5,
        color: colorFromCss('#5aa7a1', 0.58),
        outlineColor: colorFromCss('#102e36', 0.9),
        outlineWidth: 1,
        disableDepthTestDistance: 0,
      },
      description: [
        `监控点 ${sid}`,
        `关联设备: ${modelName}`,
        `当前代表 ${count} 条邻近监控记录`,
        `安装高度: ${h.toFixed(1)}m`,
        `EPSG:4490: ${lon.toFixed(6)}E, ${lat.toFixed(6)}N`,
      ].join('<br/>'),
    })
    if (entity && typeof entity === 'object') next.push(markRaw(entity))
  })
  devicePointEntities.value = next
  requestSceneRender()
}

function drawParticleOverlay(result: AlgorithmRecord) {
  clearOverlayGroup('particle')
  withOverlayGroup('particle', () => drawParticleOverlayEntities(result))
}

function drawParticleOverlayEntities(result: AlgorithmRecord) {
  const estimatedPoint = normalizeThreeTilesAnalysisPoint(
    getEstimatedSourcePoint(result),
  )
  if (!estimatedPoint)
    throw new Error('粒子滤波结果缺少 estimatedSource.mapPoint')
  if (import.meta.env.VITE_FEATURE_INVERSION_KDE_3D !== 'false') {
    drawParticleKdeSurface(result)
    if (Array.isArray(result.posteriorParticles)) {
      drawPosteriorParticleSamples(result.posteriorParticles.map(asRecord))
    }
  }
  addPointEntity(estimatedPoint, '溯源估计点', '#ffb020', 12)
  addEllipseEntity(estimatedPoint, {
    title: '溯源置信范围',
    radius: shouldUseThreeDTiles.value
      ? clamp(
          Number(asRecord(result.estimatedSource).credibleRadius95m || 45) *
            0.22,
          8,
          18,
        )
      : Number(asRecord(result.estimatedSource).credibleRadius95m || 45) * 0.55,
    color: '#ffb020',
    alpha: shouldUseThreeDTiles.value ? 0.16 : 0.09,
    altitudeOffset: shouldUseThreeDTiles.value ? 0.42 : 1.6,
    verticalRadius: shouldUseThreeDTiles.value ? 0.18 : 0.5,
  })
  requestSceneRender()
}

function drawEvacuationOverlay(result: AlgorithmRecord) {
  clearOverlayGroup('evacuation')
  withOverlayGroup('evacuation', () => drawEvacuationOverlayEntities(result))
}

/** 将二维 SuperMap 路网规划结果转换到三维 LOCALMAP/4490 场景并保持同一条路线。 */
function renderUnifiedEvacuationRoute(
  payload: UnifiedEvacuationRoutePayload | null,
) {
  clearOverlayGroup('evacuation')
  if (!payload?.isReachable || !Array.isArray(payload.path)) {
    requestSceneRender()
    return
  }
  const toSceneRoute = (
    route: UnifiedEvacuationRoutePayload,
  ): AlgorithmRecord => ({
    ...route,
    path: (route.path || []).map((point) =>
      algorithmToLocal(clampMapPoint(point)),
    ),
    candidateRoutes: (route.candidateRoutes || []).map(toSceneRoute),
  })
  const sceneRoute = toSceneRoute(payload)
  evacuationResult.value = sceneRoute
  drawEvacuationOverlay(sceneRoute)
  sceneMessage.value = `三维避险路径已同步：${String(payload.exitLabel || '安全出口')} · ${Number(payload.distanceMeters || 0).toFixed(1)}m。`
  requestSceneRender()
}

function drawEvacuationOverlayEntities(result: AlgorithmRecord) {
  // 路径来自 iServer Park_RoadNetworkEdge_L；其 LOCALMAP -> S3M 控制点已校准到模型坐标。
  const path = resolveRoutePath(result)
  if (!path.length) throw new Error('疏散规划结果缺少路径点')
  routeScreenOverlayPoints.value = []
  const candidateRoutes = Array.isArray(result.candidateRoutes)
    ? result.candidateRoutes.map(asRecord).slice(0, 4)
    : []
  candidateRoutes.slice(0, 1).forEach((route, index) => {
    const candidatePath = resolveRoutePath(route)
    if (candidatePath.length >= 2) {
      addPolylineEntity(candidatePath, `候选疏散路线 ${index + 1}`, '#7dd3fc', {
        width: 2,
        baseWidth: shouldUseThreeDTiles.value ? 2.6 : 4,
        alpha: shouldUseThreeDTiles.value ? 0.22 : 0.34,
        altitudeOffset: shouldUseThreeDTiles.value
          ? 0.12 + index * 0.03
          : geographicSceneMode.value
            ? 0.45 + index * 0.05
            : 0.08 + index * 0.02,
      })
    }
  })
  addPolylineEntity(path, '疏散路线', '#52ffb8', {
    width: 2.5,
    baseWidth: 4,
    alpha: 0.86,
    altitudeOffset: shouldUseThreeDTiles.value
      ? 0.16
      : geographicSceneMode.value
        ? 0.52
        : 0.1,
  })
  addRouteBeaconEntities(path, '#52ffb8')
  addRouteLabelEntity(path, 'SuperMap iServer 路网疏散')
  path.forEach((point, index) => {
    if (index === 0) addPointEntity(point, '疏散起点', '#52ffb8', 8)
  })
  const entranceAnchor = resolveResultEntranceAnchor(result)
  if (!entranceAnchor) {
    addPointEntity(
      path[path.length - 1],
      String(result.exitLabel || '安全出口'),
      '#52ffb8',
      10,
    )
  } else {
    addEntranceAnchorEntity(entranceAnchor)
  }
  emit('evacuation-route', {
    points: path.map((point) => ({ x: point.x, y: point.y })),
    exitLabel: String(
      result.exitLabel || result.selectedExitLabel || '安全出口',
    ),
    planner: String(
      result.planner || 'SuperMap iServer Transportation Analyst',
    ),
    distanceMeters: Number(result.distanceMeters || result.routeWeight || 0),
  })
  flyToRouteOverview(path)
}

function resolveResultEntranceAnchor(
  result: AlgorithmRecord,
): SceneAnchor4490 | null {
  const resultId = String(
    result.exitId ||
      result.selectedExitId ||
      asRecord(result.selectedExit).id ||
      '',
  )
  if (resultId) {
    const byId = getEntranceAnchor4490(resultId)
    if (byId) return byId
  }
  const exitLabel = String(
    result.exitLabel || result.selectedExitLabel || '',
  ).trim()
  if (!exitLabel) return null
  return (
    ENTRANCE_ANCHORS_4490.find(
      (anchor) => exitLabel === anchor.name || exitLabel === anchor.entranceId,
    ) || null
  )
}

function addEntranceAnchorEntity(anchor: SceneAnchor4490) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return
  const ecef = geoToEcef(anchor.longitude, anchor.latitude, anchor.heightMeters)
  addEntity({
    name: `厂房安全出口 · ${anchor.name}`,
    position: new runtime.Cartesian3(ecef.x, ecef.y, ecef.z),
    point: {
      pixelSize: 11,
      color: colorFromCss('#52ffb8', 0.98),
      outlineColor: colorFromCss('#ffffff', 0.95),
      outlineWidth: 2,
      disableDepthTestDistance: 320,
    },
    label: {
      text: anchor.name,
      font: '12px sans-serif',
      fillColor: colorFromCss('#ffffff', 0.96),
      outlineColor: colorFromCss('#00111f', 0.88),
      outlineWidth: 2,
      pixelOffset: { x: 0, y: -16 },
      disableDepthTestDistance: 320,
    },
    description: `${anchor.entranceId} · ${anchor.modelObjectId} · EPSG:4490 ${anchor.longitude.toFixed(6)}E, ${anchor.latitude.toFixed(6)}N`,
  })
}

function drawClosestDeviceOverlay(result: AlgorithmRecord) {
  clearOverlayGroup('closest-facility')
  withOverlayGroup('closest-facility', () =>
    drawClosestDeviceOverlayEntities(result),
  )
}

function drawClosestDeviceOverlayEntities(result: AlgorithmRecord) {
  const path = normalizeThreeTilesRoutePath(resolveRoutePath(result))
  if (!path.length) throw new Error('最近设备分析结果缺少路径点')
  routeScreenOverlayPoints.value = []
  const eventSensor = sceneSensors.value.find(
    (sensor) => sensor.id === String(result.eventSensorId),
  )
  const facility = asRecord(result.facility)
  const facilityPoint = snapPointToThreeTilesRouteRoad(
    toMapPoint(facility.point) || path[path.length - 1],
  )
  const facilityLabel = String(
    result.facilityLabel || result.facilityId || '最近设备',
  )
  addPolylineEntity(path, '最近设备最短路径', '#35d2ff', {
    width: 3,
    baseWidth: 5,
    alpha: 0.86,
    altitudeOffset: 2.8,
  })
  if (eventSensor) {
    addPointEntity(
      sensorSceneMapPoint(eventSensor),
      `事件点 ${eventSensor.id}`,
      '#ffb020',
      8,
    )
  } else {
    addPointEntity(path[0], '事件点', '#ffb020', 8)
  }
  addPointEntity(facilityPoint, facilityLabel, '#35d2ff', 8)
  addEllipseEntity(facilityPoint, {
    title: `最近设备服务圈 ${facilityLabel}`,
    radius: 12,
    color: '#35d2ff',
    alpha: 0.08,
    altitudeOffset: 1.4,
    verticalRadius: 0.4,
  })
  flyToRouteOverview(path)
  requestSceneRender()
}

function clearAlgorithmOverlays(shouldPublish = true) {
  if (shouldPublish) activeDemoTaskId += 1
  clearAllAlgorithmOverlays()
  diffusionScreenOverlayCells.value = []
  routeScreenOverlayPoints.value = []
  evacuationResult.value = null
  if (shouldPublish) emit('evacuation-route', null)
  demoTaskState.value = 'idle'
  demoTaskMessage.value = '已清除算法空间图层'
  currentDemoTaskKind.value = 'idle'
  if (shouldPublish) publishAlgorithmStatus()
  requestSceneRender()
}

function withOverlayGroup(group: OverlayGroup, render: () => void) {
  const previousGroup = activeOverlayGroup
  activeOverlayGroup = group
  try {
    render()
  } finally {
    activeOverlayGroup = previousGroup
  }
}

function registerOverlayEntity(group: OverlayGroup, entity: unknown) {
  const current = overlayEntityGroups.value
  overlayEntityGroups.value = {
    ...current,
    [group]: [...current[group], markExternalObject(entity)],
  }
}

function clearOverlayGroup(group: OverlayGroup) {
  const entities = viewer.value?.entities
  if (entities) {
    overlayEntityGroups.value[group].forEach((entity) =>
      entities.remove(entity),
    )
  }
  overlayEntityGroups.value = {
    ...overlayEntityGroups.value,
    [group]: [],
  }
  if (group === 'particle') activeInversionLegendStage.value = null
  if (group === 'diffusion') stopVelocityParticleLoop()
  requestSceneRender()
}

function clearAllAlgorithmOverlays() {
  ;(Object.keys(overlayEntityGroups.value) as OverlayGroup[]).forEach(
    clearOverlayGroup,
  )
  emit('diffusion-heatmap', null)
  emit('inversion-overlay', null)
}

function unwrapAlgorithmRecord(
  response: {
    ok?: boolean
    code?: number
    data?: unknown
    message?: string | null
  },
  fallback: string,
) {
  const ok = response.ok === true || response.code === 200
  const data = asRecord(response.data)
  if (!ok || !Object.keys(data).length) {
    throw new Error(response.message || fallback)
  }
  return data
}

function attachExecutionMode(
  result: AlgorithmRecord,
  executionMode: ResultExecutionMode,
): AlgorithmRecord {
  return { ...result, executionMode }
}

function getExecutionMode(result: AlgorithmRecord): ResultExecutionMode {
  const mode = result.executionMode
  return mode === 'algorithm-service' ||
    mode === 'supermap-iserver' ||
    mode === 'local-fallback'
    ? mode
    : 'local-fallback'
}

function executionModeText(mode: ResultExecutionMode) {
  if (mode === 'algorithm-service') return '正式算法服务'
  if (mode === 'supermap-iserver') return 'SuperMap iServer'
  return '本地演示兜底'
}

function pushExecutionEvidence(
  executionMode: ResultExecutionMode,
  record: SuperMapCupEvidence,
  inputExecutionMode?: ResultExecutionMode,
) {
  const warning =
    executionMode === 'local-fallback'
      ? '正式服务不可用，当前为本地演示兜底结果，不作为算法验证证据。'
      : inputExecutionMode === 'local-fallback'
        ? '扩散输入为本地演示兜底结果，不作为算法验证证据。'
        : undefined
  evidenceRecords.value = [
    {
      ...record,
      executionMode,
      executionModeText: executionModeText(executionMode),
      inputExecutionMode,
      warning,
    },
    ...evidenceRecords.value,
  ].slice(0, 5)
}

function publishAlgorithmStatus() {
  emit('algorithm-status', {
    kind: currentDemoTaskKind.value,
    state: demoTaskState.value,
    stateText: demoTaskStateText.value,
    message: demoTaskMessage.value,
    evidence: latestEvidence.value,
    selectedSensorId: selectedSensor.value?.id || null,
  })
}

function buildFallbackDiffusionRecord(error?: unknown): AlgorithmRecord {
  const source = currentAlgorithmSourcePoint()
  const cells: AlgorithmRecord[] = []
  const step = 26
  for (let row = -4; row <= 4; row += 1) {
    for (let column = -4; column <= 5; column += 1) {
      const x = clamp(
        source.x + column * step + row * 5,
        20,
        SUPERMAP_CUP_SCENARIO.map.width - 20,
      )
      const y = clamp(
        source.y + row * step - column * 3,
        20,
        SUPERMAP_CUP_SCENARIO.map.height - 20,
      )
      const downwindBoost = column >= 0 ? 1.24 : 0.76
      const distance = Math.hypot(x - source.x, y - source.y)
      const concentration = Math.max(
        0.8,
        168 * Math.exp(-distance / 112) * downwindBoost,
      )
      cells.push({
        x,
        y,
        size: 22,
        concentration: Number(concentration.toFixed(3)),
      })
    }
  }
  const peak = Math.max(
    ...cells.map((cell) => Number(cell.concentration || 0)),
    1,
  )
  const sensorReadings = sceneSensors.value
    .filter((sensor) => sensor.observationRole === 'gas-concentration')
    .slice(0, 16)
    .map((sensor) => {
      const distance = Math.hypot(sensor.x - source.x, sensor.y - source.y)
      return {
        sensorId: sensor.id,
        concentration: Number(
          Math.max(0.02, peak * Math.exp(-distance / 145)).toFixed(4),
        ),
        timeSec: Number((distance / 2.2).toFixed(1)),
      }
    })
  return {
    requestId: `local-diffusion-${Date.now()}`,
    algorithmName: 'local-fallback-diffusion',
    frames: [
      {
        frameIndex: 0,
        timeSec: 120,
        maxConcentration: peak,
        cells,
        sensorReadings,
      },
    ],
    gas: { id: 'ch4', name: '甲烷', unit: 'ppm' },
    stats: { peakConcentration: peak, source: 'LOCAL_FALLBACK' },
    runtime: { costMs: 0, source: fallbackReason(error) },
    inputSummary: { payloadDigest: 'SIMULATED_LOCAL_FALLBACK' },
  }
}

function buildFallbackParticleRecord(error?: unknown): AlgorithmRecord {
  const source = currentAlgorithmSourcePoint()
  const estimatedPoint = {
    x: clamp(source.x + 18, 0, SUPERMAP_CUP_SCENARIO.map.width),
    y: clamp(source.y - 14, 0, SUPERMAP_CUP_SCENARIO.map.height),
  }
  return {
    requestId: `local-particle-${Date.now()}`,
    algorithmName: 'local-fallback-particle-filter',
    estimatedSource: {
      mapPoint: estimatedPoint,
      credibleRadius95m: 46,
      emissionRate: 42,
      confidence: 0.82,
    },
    runtime: { costMs: 0, source: fallbackReason(error) },
    inputSummary: { payloadDigest: 'SIMULATED_LOCAL_FALLBACK' },
  }
}

function buildFallbackClosestDeviceRecord(
  eventSensor: ModelBoundMonitorSensor,
  error?: unknown,
): AlgorithmRecord {
  const candidates = closestDeviceCandidates(eventSensor)
  const nearest = candidates[0]
  if (!nearest) throw new Error('没有可用候选设备')
  const path = buildRoadAlignedRoute(eventSensor.mapPoint, nearest.mapPoint)
  return {
    requestId: `local-closest-${Date.now()}`,
    algorithmName: 'local-fallback-closest-device',
    eventSensorId: eventSensor.id,
    eventSensorModelName: eventSensor.modelName,
    facilityId: nearest.id,
    facilityLabel: `${nearest.id} · ${nearest.modelName}`,
    facility: {
      id: nearest.id,
      label: `${nearest.id} · ${nearest.modelName}`,
      point: nearest.mapPoint,
    },
    path,
    distanceMeters: mapPathDistanceMeters(path),
    candidateRoutes: candidates.slice(0, 4).map((sensor) => ({
      facilityId: sensor.id,
      facilityLabel: `${sensor.id} · ${sensor.modelName}`,
      path: buildRoadAlignedRoute(eventSensor.mapPoint, sensor.mapPoint),
      distanceMeters: mapPathDistanceMeters(
        buildRoadAlignedRoute(eventSensor.mapPoint, sensor.mapPoint),
      ),
    })),
    planner: 'Local closest-device fallback',
    executor: {
      mode: 'local-fallback',
      implementation:
        'Front-end closest-device route fallback after SuperMap service unavailable',
      coordinateSystem: 'CGCS2000 EPSG:4490 business georeference',
    },
    runtime: { costMs: 0, source: fallbackReason(error) },
    inputSummary: { payloadDigest: 'SIMULATED_LOCAL_FALLBACK' },
  }
}

function buildRoadAlignedRoute(
  start: SuperMapCupMapPoint,
  end: SuperMapCupMapPoint,
) {
  const startRoad = nearestRoadPoint(start)
  const endRoad = nearestRoadPoint(end)
  const turnA = { x: endRoad.x, y: startRoad.y }
  const turnB = { x: startRoad.x, y: endRoad.y }
  const routeA = compactRoute([start, startRoad, turnA, endRoad, end])
  const routeB = compactRoute([start, startRoad, turnB, endRoad, end])
  return mapPathDistanceMeters(routeA) <= mapPathDistanceMeters(routeB)
    ? routeA
    : routeB
}

function normalizeThreeTilesRoutePath(path: SuperMapCupMapPoint[]) {
  if (!shouldUseThreeDTiles.value) return path
  if (!path.length) return []
  const controlPath = path.length > 2 ? [path[0], path[path.length - 1]] : path
  const snapped = controlPath.map(
    (point) => snapToThreeTilesRouteRoad(point).point,
  )
  if (snapped.length === 1) return snapped
  const expanded: SuperMapCupMapPoint[] = []
  for (let index = 1; index < snapped.length; index += 1) {
    const start = snapped[index - 1]
    const end = snapped[index]
    const segment = buildThreeTilesRoadDogleg(start, end)
    if (!expanded.length) expanded.push(segment[0])
    expanded.push(...segment.slice(1))
  }
  return compactRoute(expanded)
}

function normalizeThreeTilesAnalysisPoint(point: SuperMapCupMapPoint | null) {
  if (!point || !shouldUseThreeDTiles.value) return point
  let best: { point: SuperMapCupMapPoint; distance: number } | null = null
  for (const anchor of THREE_TILES_EQUIPMENT_ANCHORS) {
    if (anchor.kind === 'road') continue
    const distance = Math.hypot(
      anchor.point.x - point.x,
      anchor.point.y - point.y,
    )
    if (!best || distance < best.distance)
      best = { point: anchor.point, distance }
  }
  if (!best || best.distance < 16) return point
  return best.point
}

function threeTilesAlgorithmSourcePoint() {
  if (selectedLeakSourcePoint.value) return selectedLeakSourcePoint.value
  if (!shouldUseThreeDTiles.value) return SUPERMAP_CUP_SCENARIO.sourceMapPoint
  return (
    THREE_TILES_EQUIPMENT_BY_ID.get('pipe-main-02')?.point ||
    SUPERMAP_CUP_SCENARIO.sourceMapPoint
  )
}

function buildThreeTilesRoadDogleg(
  start: SuperMapCupMapPoint,
  end: SuperMapCupMapPoint,
) {
  return buildThreeTilesRoadGraphRoute(start, end)
}

function snapPointToThreeTilesRouteRoad(point: SuperMapCupMapPoint) {
  return snapToThreeTilesRouteRoad(point).point
}

function snapToThreeTilesRouteRoad(point: SuperMapCupMapPoint) {
  let best: {
    point: SuperMapCupMapPoint
    distance: number
    roadId: string
  } | null = null
  for (const road of THREE_TILES_ROUTE_ROADS) {
    const horizontal = road.w >= road.h
    const candidate: SuperMapCupMapPoint = horizontal
      ? { x: clamp(point.x, road.x, road.x + road.w), y: road.y + road.h / 2 }
      : { x: road.x + road.w / 2, y: clamp(point.y, road.y, road.y + road.h) }
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y)
    if (!best || distance < best.distance)
      best = { point: candidate, distance, roadId: road.id }
  }
  return best || { point, distance: 0, roadId: 'unknown' }
}

function buildThreeTilesRoadGraphRoute(
  start: SuperMapCupMapPoint,
  end: SuperMapCupMapPoint,
) {
  const startSnap = snapToThreeTilesRouteRoad(start)
  const endSnap = snapToThreeTilesRouteRoad(end)
  if (startSnap.roadId === endSnap.roadId)
    return compactRoute([startSnap.point, endSnap.point])

  const nodes = new Map<string, SuperMapCupMapPoint>()
  THREE_TILES_ROUTE_GRAPH_NODES.forEach((node) =>
    nodes.set(node.id, node.point),
  )
  nodes.set('__start', startSnap.point)
  nodes.set('__end', endSnap.point)

  const adjacency = new Map<string, Array<{ id: string; distance: number }>>()
  const connect = (leftId: string, rightId: string) => {
    const left = nodes.get(leftId)
    const right = nodes.get(rightId)
    if (!left || !right) return
    const distance = Math.hypot(left.x - right.x, left.y - right.y)
    adjacency.set(leftId, [
      ...(adjacency.get(leftId) || []),
      { id: rightId, distance },
    ])
    adjacency.set(rightId, [
      ...(adjacency.get(rightId) || []),
      { id: leftId, distance },
    ])
  }

  THREE_TILES_ROUTE_GRAPH_EDGES.forEach(([leftId, rightId]) =>
    connect(leftId, rightId),
  )
  ;(THREE_TILES_ROUTE_ROAD_NODE_IDS[startSnap.roadId] || []).forEach((nodeId) =>
    connect('__start', nodeId),
  )
  ;(THREE_TILES_ROUTE_ROAD_NODE_IDS[endSnap.roadId] || []).forEach((nodeId) =>
    connect('__end', nodeId),
  )

  const distances = new Map<string, number>([['__start', 0]])
  const previous = new Map<string, string>()
  const unvisited = new Set(nodes.keys())
  while (unvisited.size) {
    let current: string | null = null
    for (const id of unvisited) {
      if (
        current === null ||
        (distances.get(id) ?? Number.POSITIVE_INFINITY) <
          (distances.get(current) ?? Number.POSITIVE_INFINITY)
      )
        current = id
    }
    if (
      !current ||
      current === '__end' ||
      !Number.isFinite(distances.get(current) ?? Number.POSITIVE_INFINITY)
    )
      break
    unvisited.delete(current)
    ;(adjacency.get(current) || []).forEach((edge) => {
      if (!unvisited.has(edge.id)) return
      const nextDistance = (distances.get(current) || 0) + edge.distance
      if (nextDistance < (distances.get(edge.id) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.id, nextDistance)
        previous.set(edge.id, current)
      }
    })
  }

  if (!previous.has('__end'))
    return compactRoute([startSnap.point, endSnap.point])
  const routeIds = ['__end']
  while (routeIds[0] !== '__start') {
    const prev = previous.get(routeIds[0])
    if (!prev) break
    routeIds.unshift(prev)
  }
  return compactRoute(
    routeIds
      .map((id) => nodes.get(id))
      .filter((item): item is SuperMapCupMapPoint => Boolean(item)),
  )
}

function nearestRoadPoint(point: SuperMapCupMapPoint) {
  let best: { point: SuperMapCupMapPoint; distance: number } | null = null
  for (const road of roads) {
    const horizontal = road.w >= road.h
    const candidate: SuperMapCupMapPoint = horizontal
      ? {
          x: clamp(point.x, road.x, road.x + road.w),
          y: road.y + road.h / 2,
        }
      : {
          x: road.x + road.w / 2,
          y: clamp(point.y, road.y, road.y + road.h),
        }
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y)
    if (!best || distance < best.distance) best = { point: candidate, distance }
  }
  return best?.point || point
}

function compactRoute(points: SuperMapCupMapPoint[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1]
    return (
      !previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.5
    )
  })
}

function mapPathDistanceMeters(path: SuperMapCupMapPoint[]) {
  const units = path.slice(1).reduce((sum, point, index) => {
    const previous = path[index]
    return sum + Math.hypot(point.x - previous.x, point.y - previous.y)
  }, 0)
  return Number((units * SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit).toFixed(1))
}

function getFacilityPoint(facility: MapFacility): SuperMapCupMapPoint {
  return {
    x: facility.x + facility.w / 2,
    y: facility.y + facility.h / 2,
  }
}

function fallbackReason(error?: unknown) {
  return error instanceof Error
    ? error.message
    : 'SERVICE_UNAVAILABLE_LOCAL_FALLBACK'
}

function drawParticleKdeSurface(result: AlgorithmRecord) {
  const densityGeoJson = asRecord(result.posteriorDensityGeoJSON)
  const metadata = asRecord(densityGeoJson.metadata)
  const coordinateSystem = String(metadata.coordinateSystem || '')
  const hasSupportedLocalContract =
    coordinateSystem === 'algorithm-map-planar' &&
    metadata.transformVersion === 'cgcs2000-scene-anchor-2026-07-29'
  const hasSupportedGeographicContract = coordinateSystem === 'EPSG:4490'
  if (!hasSupportedLocalContract && !hasSupportedGeographicContract) {
    pushDebugMessage(
      `KDE 坐标契约 ${coordinateSystem || '缺失'} / ${String(metadata.transformVersion || '无版本')} 未经场景适配，已拒绝渲染`,
    )
    return false
  }
  const features = Array.isArray(densityGeoJson.features)
    ? densityGeoJson.features.map(asRecord)
    : []
  if (!features.length) return false
  let renderedCount = 0
  features.forEach((feature) => {
    const geometry = asRecord(feature.geometry)
    const properties = asRecord(feature.properties)
    if (geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates))
      return
    const ring = Array.isArray(geometry.coordinates[0])
      ? geometry.coordinates[0]
      : []
    const positions = ring
      .map((coordinate) =>
        kdeCoordinateToSceneCartesian(coordinate, coordinateSystem),
      )
      .filter((item): item is unknown => Boolean(item))
    const density = clamp(Number(properties.normalizedDensity || 0), 0, 1)
    if (
      addPolygonEntity(
        positions,
        `粒子滤波 KDE 概率地形 ${(density * 100).toFixed(1)}%`,
        density > 0.62 ? '#ff3b30' : density > 0.28 ? '#ffb020' : '#38bdf8',
        Math.max(0.1, Math.min(0.55, 0.12 + density * 0.42)),
        `Python 粒子群 KDE GeoJSON 栅格面，normalizedDensity=${density.toFixed(4)}，Z=${Number(properties.elevationZ || 0).toFixed(2)}m`,
      )
    )
      renderedCount += 1
  })
  return renderedCount > 0
}

function kdeCoordinateToSceneCartesian(
  value: unknown,
  coordinateSystem: string,
) {
  if (!Array.isArray(value) || value.length < 2) return null
  const x = Number(value[0])
  const y = Number(value[1])
  const z = Number(value[2] || 0)
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
    return null
  if (coordinateSystem === 'EPSG:4490') {
    return getRuntime()?.Cartesian3?.fromDegrees?.(x, y, z) || null
  }
  return mapPointToSceneCartesian(algorithmToLocal({ x, y }), z)
}

function drawPosteriorParticleSamples(
  samples: AlgorithmRecord[],
  particleLimit = 160,
  showTrajectories = true,
  minimumParticleWeight = 0,
) {
  const validSamples = samples
    .map((sample) => ({
      sample,
      x: Number(sample.x),
      y: Number(sample.y),
      emissionRate: Number(sample.emissionRate),
      relativeWeight: clamp(Number(sample.relativeWeight || 0), 0, 1),
    }))
    .filter(
      ({ x, y, emissionRate }) =>
        Number.isFinite(x) &&
        Number.isFinite(y) &&
        Number.isFinite(emissionRate) &&
        emissionRate > 0,
    )
    .filter(({ relativeWeight }) => relativeWeight >= minimumParticleWeight)
    .sort((left, right) => right.relativeWeight - left.relativeWeight)
    .slice(0, particleLimit)
  validSamples.forEach(({ sample, x, y, emissionRate, relativeWeight }) => {
    const point = algorithmToLocal(clampMapPoint({ x, y }))
    const particleIndex = Number(sample.sampleIndex || 0)
    const altitudeMeters =
      0.45 +
      relativeWeight * 4.8 +
      (seededSignedNoise(particleIndex + 1, 97) + 1) * 0.32
    const position = mapPointToSceneCartesian(point, altitudeMeters)
    if (!position) return
    const particleColor = '#fbbf24'
    addEntity({
      name: `后验粒子 #${particleIndex}`,
      position,
      point: {
        pixelSize: 2.4 + relativeWeight * 6.2,
        color: colorFromCss(particleColor, 0.34 + relativeWeight * 0.58),
        outlineColor: colorFromCss('#ffffff', 0.2 + relativeWeight * 0.5),
        outlineWidth: relativeWeight >= 0.7 ? 1.5 : 0.5,
        disableDepthTestDistance: 900,
      },
      description: `粒子滤波后验样本 · 相对权重 ${(relativeWeight * 100).toFixed(1)}% · 源强 ${emissionRate.toFixed(3)} · ${describeMapPoint(point, altitudeMeters)}`,
    })
    if (!showTrajectories || relativeWeight < 0.7) return
    const base = mapPointToSceneCartesian(point, 0.2)
    if (!base) return
    addEntity({
      name: `高权重粒子轨迹 #${particleIndex}`,
      polyline: {
        positions: [base, position],
        width: 0.7 + relativeWeight,
        material: colorFromCss(particleColor, 0.18 + relativeWeight * 0.28),
        disableDepthTestDistance: 900,
      },
    })
  })
  return validSamples.length
}

function addPointEntity(
  point: SuperMapCupMapPoint,
  title: string,
  color: string,
  pixelSize: number,
) {
  const position = mapPointToSceneCartesian(point, 1.8)
  if (!position) return
  const shouldLabel = pixelSize >= 15
  addEntity({
    name: title,
    position,
    point: {
      pixelSize: geographicSceneMode.value
        ? Math.max(5, pixelSize * 0.64)
        : Math.max(4, pixelSize * 0.42),
      color: colorFromCss(color, 0.96),
      outlineColor: colorFromCss('#ffffff', 0.92),
      outlineWidth: 1,
      disableDepthTestDistance: geographicSceneMode.value ? 1000 : 2600,
    },
    billboard: undefined,
    label: shouldLabel
      ? {
          text: title,
          font: geographicSceneMode.value
            ? '12px sans-serif'
            : '12px sans-serif',
          fillColor: colorFromCss('#ffffff', 0.92),
          outlineColor: colorFromCss('#00111f', 0.82),
          outlineWidth: 2,
          pixelOffset: { x: 0, y: -14 },
          disableDepthTestDistance: 1800,
        }
      : undefined,
    description: `${title}: ${describeMapPoint(point, 16)}`,
  })
}

function addModelBoundLeakSourceEntity() {
  const runtime = getRuntime()
  const source = currentLeakSourceAnchor4490()
  if (!runtime?.Cartesian3) return
  const ecef = geoToEcef(source.longitude, source.latitude, source.heightMeters)
  const position = new runtime.Cartesian3(ecef.x, ecef.y, ecef.z)
  const groundEcef = geoToEcef(source.longitude, source.latitude, 0)
  const sourceRadiusMeters = 0.7
  addEntity({
    name: `设备体泄漏源 · ${source.name}`,
    position,
    point: {
      pixelSize: 9,
      color: colorFromCss('#ff6b4a', 0.98),
      outlineColor: colorFromCss('#ffffff', 0.92),
      outlineWidth: 2,
      disableDepthTestDistance: 260,
    },
    ellipsoid: {
      radii: new runtime.Cartesian3(
        sourceRadiusMeters,
        sourceRadiusMeters,
        sourceRadiusMeters,
      ),
      material: colorFromCss('#ff6b4a', 0.28),
      outline: false,
    },
    polyline: {
      positions: [
        new runtime.Cartesian3(groundEcef.x, groundEcef.y, groundEcef.z),
        position,
      ],
      width: 2,
      material: colorFromCss('#ff6b4a', 0.72),
      clampToGround: false,
    },
    // 六个候选点已常驻绘制 ModelName；激活层只增强红色体标记，
    // 不再重复绘制同名标签，避免两个中文名称完全重叠。
    label: undefined,
    description: `${source.leakSourceId} · ${source.modelName} · SmID=${source.modelSmId} · ${source.equipmentType} · EPSG:4490 ${source.longitude.toFixed(6)}E, ${source.latitude.toFixed(6)}N, H=${source.heightMeters.toFixed(1)}m`,
  })
}

function addLeakSourceCandidateEntities() {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return
  LEAK_SOURCE_ANCHORS_4490.forEach((source) => {
    const ecef = geoToEcef(
      source.longitude,
      source.latitude,
      source.heightMeters,
    )
    const entity = addEntity({
      name: `可选泄漏源 · ${source.modelName}`,
      position: new runtime.Cartesian3(ecef.x, ecef.y, ecef.z),
      point: {
        pixelSize: 8,
        color: colorFromCss('#ff7a45', 0.96),
        outlineColor: colorFromCss('#ffffff', 0.9),
        outlineWidth: 2,
        disableDepthTestDistance: 360,
      },
      label: {
        text: source.modelName,
        font: '11px sans-serif',
        fillColor: colorFromCss('#ffffff', 0.94),
        outlineColor: colorFromCss('#00111f', 0.9),
        outlineWidth: 2,
        pixelOffset: { x: 0, y: -15 },
        disableDepthTestDistance: 360,
      },
      description: `${source.modelName} · ModelName · SmID=${source.modelSmId} · 点击“选泄漏源”后可直接选择`,
    }) as Record<string, unknown> | undefined
    if (!entity) return
    entity.leakSourceId = source.leakSourceId
    entity.leakSourceModelSmId = source.modelSmId
    entity.leakSourceModelName = source.modelName
  })
  requestSceneRender()
}

function addVolumetricGasCell(
  cell: DiffusionVolumeCell,
  color: string,
  ratio: number,
) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return
  if (
    Number.isFinite(cell.alongWindDistanceMeters) &&
    Number(cell.alongWindDistanceMeters) < 0
  ) {
    return
  }
  const particleCount = Math.round(clamp(cell.particleCount, 4, 8))
  const headingRadians = ((cell.headingDegrees % 360) * Math.PI) / 180
  const mapMetersPerUnit = SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
  for (
    let particleIndex = 0;
    particleIndex < particleCount;
    particleIndex += 1
  ) {
    const alongNoise = seededSignedNoise(cell.particleSeed, particleIndex * 3)
    const crossNoise = seededSignedNoise(
      cell.particleSeed,
      particleIndex * 3 + 1,
    )
    const verticalNoise = seededSignedNoise(
      cell.particleSeed,
      particleIndex * 3 + 2,
    )
    const alongMeters = alongNoise * cell.radiusAlongMeters * 0.72
    const crossMeters =
      crossNoise * cell.radiusCrossMeters * (0.7 + cell.turbulence * 0.45)
    const particleCell: DiffusionVolumeCell = {
      ...cell,
      x:
        cell.x +
        (Math.sin(headingRadians) * alongMeters +
          Math.cos(headingRadians) * crossMeters) /
          mapMetersPerUnit,
      y:
        cell.y -
        (Math.cos(headingRadians) * alongMeters -
          Math.sin(headingRadians) * crossMeters) /
          mapMetersPerUnit,
      zOffsetMeters: Math.max(
        currentLeakSourceAnchor4490().volumeFence.minRelativeHeightMeters +
          cell.radiusVerticalMeters,
        cell.zOffsetMeters +
          verticalNoise * cell.radiusVerticalMeters * cell.turbulence,
      ),
    }
    const position = diffusionVolumeCellToSceneCartesian(particleCell)
    if (!position) continue
    const boundedRadii = boundedVolumeCellRadii(particleCell)
    if (!boundedRadii) continue
    const sourceDistanceMeters = Math.max(
      0,
      Number(
        cell.sourceDistanceMeters ??
          cell.alongWindDistanceMeters ??
          volumeCellLocalOffsetMeters(cell).eastMeters,
      ),
    )
    const plumeMaturity = clamp(sourceDistanceMeters / 180, 0, 1)
    const sizeNoise =
      0.54 +
      (seededSignedNoise(cell.particleSeed, particleIndex + 17) + 1) * 0.14
    const radii = {
      along: boundedRadii.along * sizeNoise,
      cross:
        Math.min(
          boundedRadii.cross,
          boundedRadii.along / (1.8 + plumeMaturity * 0.8),
        ) * sizeNoise,
      vertical:
        Math.min(
          boundedRadii.vertical,
          boundedRadii.cross * (0.72 - plumeMaturity * 0.12),
        ) * sizeNoise,
    }
    const alpha = clamp(
      ((0.055 + ratio * 0.22) / (1 + (particleCount - 1) * 0.1)) *
        (0.88 +
          (seededSignedNoise(cell.particleSeed, particleIndex + 31) + 1) *
            0.08),
      0.04,
      0.22,
    )
    const concentrationColor = diffusionConcentrationColor(color, ratio)
    const orientation = createPuffOrientation(
      runtime,
      position,
      cell.headingDegrees,
    )
    addEntity({
      name: `${cell.shape} · ${cell.concentration.toFixed(2)} ppm`,
      position,
      ...(orientation ? { orientation } : {}),
      ellipsoid: {
        radii: new runtime.Cartesian3(radii.along, radii.cross, radii.vertical),
        material: colorFromCss(concentrationColor, alpha),
        outline: false,
      },
      description: `${cell.shape} · 浓度 ${cell.concentration.toFixed(2)} ppm · 顺风距离 ${Number(cell.alongWindDistanceMeters ?? sourceDistanceMeters).toFixed(1)}m · 横风偏移 ${Number(cell.crossWindDistanceMeters ?? 0).toFixed(1)}m · 相对泄漏点高度 ${particleCell.zOffsetMeters.toFixed(1)}m`,
    })
    if (particleIndex === 0 && ratio >= 0.08)
      addGasVelocityStreak(particleCell, concentrationColor, ratio)
  }
}

function diffusionConcentrationColor(baseColor: string, ratio: number) {
  if (ratio >= 0.82) return '#ff6b4a'
  if (ratio >= 0.58) return '#ffd166'
  if (ratio >= 0.32) return '#7ee8a5'
  return baseColor
}

/**
 * 参考 ParticleVelocityField 的速度方向表达：沿当前单元风向画短流线，
 * 不复用官方源码，也不把粒子场错误地绑定到厂房 S3M 材质上。
 */
function addGasVelocityStreak(
  cell: DiffusionVolumeCell,
  color: string,
  ratio: number,
) {
  const halfLengthMeters = clamp(
    cell.radiusAlongMeters * (0.7 + cell.speedFactor * 0.35),
    0.7,
    6.5,
  )
  const positions = [
    diffusionWindOffsetToSceneCartesian(cell, -halfLengthMeters),
    diffusionVolumeCellToSceneCartesian(cell),
    diffusionWindOffsetToSceneCartesian(cell, halfLengthMeters),
  ].filter((position): position is unknown => Boolean(position))
  if (positions.length < 2) return
  const runtimeRecord = getRuntime() as Record<string, unknown> | null
  const GlowMaterial = runtimeRecord?.PolylineGlowMaterialProperty
  let material: unknown = colorFromCss(color, 0.34 + ratio * 0.28)
  if (typeof GlowMaterial === 'function') {
    try {
      const GlowMaterialConstructor = GlowMaterial as new (options: {
        color: unknown
        glowPower: number
        taperPower: number
      }) => unknown
      material = new GlowMaterialConstructor({
        color: colorFromCss(color, 0.42 + ratio * 0.32),
        glowPower: 0.16 + ratio * 0.18,
        taperPower: 0.72,
      })
    } catch {
      // 2026 引擎裁剪版不含该材质时，显式恢复普通半透明流线。
      material = colorFromCss(color, 0.34 + ratio * 0.28)
    }
  }
  addEntity({
    name: `气体速度流线 · ${cell.concentration.toFixed(2)} ppm`,
    polyline: {
      positions,
      width: 0.7 + ratio * 1.35,
      material,
      disableDepthTestDistance: 380,
    },
  })
}

// ===== 三维流场粒子系统（复刻官方 ParticleVelocityField 语义）=====

/**
 * 渲染扩散的三维粒子流场。
 *
 * 从帧的 velocityField（或 volumeCells 的 velocityX/Y/Z）提取速度向量，
 * 每个可见体元生成 particleCount 个粒子，沿速度场流动；
 * 生命周期 VELOCITY_PARTICLE_LIFE_MIN_MS~MAX_MS（官方 [5000,10000]ms）；
 * 到期后直接移除，由后续扩散帧生成新粒子，禁止出现回源倒飞。
 *
 * 粒子只存局部数学状态（局部图 x/y/zOffset 或 ENU 偏移），每帧重建
 * Cartesian3 更新实体 position，避免在响应式对象上做逐帧原地修改。
 */
function drawVelocityParticleField(result: AlgorithmRecord) {
  if (!VELOCITY_FIELD_ENABLED) return
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return
  const frame = selectFinalDiffusionFrame(result)
  const gasColor = String(asRecord(result.gas).color || '#35d2ff')
  const cells = Array.isArray(frame.cells)
    ? frame.cells.map(asRecord).filter((cell) => Number(cell.concentration) > 0)
    : []
  const volumeCells = resolveDiffusionVolumeCells(frame, cells)
  const peak = Math.max(...volumeCells.map((cell) => cell.concentration), 1)
  const field = asRecord(frame.velocityField)
  const fieldCells = Array.isArray(field.cells) ? field.cells.map(asRecord) : []
  if (!fieldCells.length) return
  // 按格点 (x,y) 索引速度，供体元匹配。
  const velocityByKey = new Map(
    fieldCells.map((cell) => [
      `${Number(cell.x).toFixed(1)}:${Number(cell.y).toFixed(1)}`,
      cell,
    ]),
  )
  stopVelocityParticleLoop()
  velocityParticles = []
  const source = currentLeakSourceAnchor4490()
  const algorithmSource = leakSourceToAlgorithmPoint(source)
  for (const [cellIndex, cell] of volumeCells.entries()) {
    if (velocityParticles.length >= MAX_VELOCITY_PARTICLE_ENTITIES) break
    const ratio = Math.min(1, cell.concentration / peak)
    const particleCount = Math.min(
      3,
      Math.round(clamp(cell.particleCount, 1, 3)),
    )
    const fieldCell = velocityByKey.get(
      `${Number(cell.x).toFixed(1)}:${Number(cell.y).toFixed(1)}`,
    )
    const velocityX = Number(fieldCell?.u ?? cell.velocityX ?? 0)
    const velocityY = Number(fieldCell?.v ?? cell.velocityY ?? 0)
    const velocityZ = Number(fieldCell?.w ?? cell.velocityZMetersPerSecond ?? 0)
    for (
      let particleIndex = 0;
      particleIndex < particleCount;
      particleIndex += 1
    ) {
      if (velocityParticles.length >= MAX_VELOCITY_PARTICLE_ENTITIES) break
      const alongNoise = seededSignedNoise(cell.particleSeed, particleIndex * 3)
      const crossNoise = seededSignedNoise(
        cell.particleSeed,
        particleIndex * 3 + 1,
      )
      const verticalNoise = seededSignedNoise(
        cell.particleSeed,
        particleIndex * 3 + 2,
      )
      const alongMeters = alongNoise * cell.radiusAlongMeters * 0.6
      const crossMeters =
        crossNoise * cell.radiusCrossMeters * (0.5 + cell.turbulence * 0.3)
      const eastMeters =
        Math.sin(((cell.headingDegrees % 360) * Math.PI) / 180) * alongMeters +
        Math.cos(((cell.headingDegrees % 360) * Math.PI) / 180) * crossMeters
      const northMeters =
        Math.cos(((cell.headingDegrees % 360) * Math.PI) / 180) * alongMeters -
        Math.sin(((cell.headingDegrees % 360) * Math.PI) / 180) * crossMeters
      const localX =
        cell.x + eastMeters / SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
      const localY =
        cell.y - northMeters / SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
      const zOffsetMeters = Math.max(
        0.15,
        cell.zOffsetMeters +
          verticalNoise * cell.radiusVerticalMeters * cell.turbulence,
      )
      const particle: VelocityParticle = {
        entity: null,
        localX,
        localY,
        zOffsetMeters,
        velocityX,
        velocityY,
        velocityZMetersPerSecond: velocityZ,
        ageMs: 0,
        lifeMs:
          VELOCITY_PARTICLE_LIFE_MIN_MS +
          Math.floor(
            Math.abs(seededSignedNoise(cell.particleSeed, particleIndex * 7)) *
              0.5 *
              (VELOCITY_PARTICLE_LIFE_MAX_MS - VELOCITY_PARTICLE_LIFE_MIN_MS),
          ),
        seed: cell.particleSeed + particleIndex * 13 + cellIndex,
        index: particleIndex,
      }
      const entity = createVelocityParticleEntity(
        particle,
        gasColor,
        ratio,
        algorithmSource,
      )
      if (entity) {
        velocityParticles.push({ ...particle, entity })
      }
    }
  }
  lastVelocityParticleTickMs = Date.now()
  if (unifiedDiffusionPlaybackActive !== false) startVelocityParticleLoop()
}

/** 创建单个粒子的 point 实体（官方 particleMode=1 点图元模式）。 */
function createVelocityParticleEntity(
  particle: VelocityParticle,
  gasColor: string,
  ratio: number,
  algorithmSource: SuperMapCupMapPoint,
): unknown {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return null
  const position = velocityParticleToSceneCartesian(particle, algorithmSource)
  if (!position) return null
  const entity = viewer.value?.entities?.add({
    name: '三维流场粒子',
    position,
    point: {
      pixelSize: VELOCITY_PARTICLE_PIXEL_SIZE,
      color: colorFromCss(diffusionConcentrationColor(gasColor, ratio), 0.9),
      disableDepthTestDistance: 380,
      outlineWidth: 0,
    },
  })
  if (entity) registerOverlayEntity('diffusion', entity)
  return entity
}

/** 粒子数学状态 → 场景 Cartesian3（复用现有体元坐标转换）。 */
function velocityParticleToSceneCartesian(
  particle: VelocityParticle,
  algorithmSource: SuperMapCupMapPoint,
): unknown {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return null
  if (!geographicSceneMode.value) {
    return mapPointToSceneCartesian(
      algorithmToLocal({ x: particle.localX, y: particle.localY }),
      particle.zOffsetMeters,
    )
  }
  const source = currentLeakSourceAnchor4490()
  const sourceEcef = geoToEcef(
    source.longitude,
    source.latitude,
    source.heightMeters,
  )
  const basis = enuBasis(source.longitude, source.latitude)
  const eastMeters =
    (particle.localX - algorithmSource.x) *
    SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
  const northMeters =
    -(particle.localY - algorithmSource.y) *
    SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
  const particleEcef = addVector(
    addVector(
      addVector(sourceEcef, scaleVector(basis.east, eastMeters)),
      scaleVector(basis.north, northMeters),
    ),
    scaleVector(basis.up, particle.zOffsetMeters),
  )
  return new runtime.Cartesian3(particleEcef.x, particleEcef.y, particleEcef.z)
}

/** 每帧推进粒子：只沿速度场前进，生命周期结束后直接消失。 */
function advanceVelocityParticles() {
  const nowMs = Date.now()
  const dtMs = Math.min(nowMs - lastVelocityParticleTickMs, 250)
  lastVelocityParticleTickMs = nowMs
  if (dtMs <= 0 || !velocityParticles.length) return
  const simulatedDtSeconds = (dtMs / 1000) * velocityParticleTimeScale
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return
  const algorithmSource = leakSourceToAlgorithmPoint(
    currentLeakSourceAnchor4490(),
  )
  const survivingParticles: VelocityParticle[] = []
  velocityParticles.forEach((particle) => {
    particle.ageMs += dtMs * velocityParticleTimeScale
    if (particle.ageMs > particle.lifeMs) {
      viewer.value?.entities?.remove(particle.entity)
      return
    }
    particle.localX +=
      (particle.velocityX * simulatedDtSeconds) /
      SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
    particle.localY +=
      (particle.velocityY * simulatedDtSeconds) /
      SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
    particle.zOffsetMeters +=
      particle.velocityZMetersPerSecond * simulatedDtSeconds
    const entityRecord = particle.entity as Record<string, unknown> | null
    if (!entityRecord) return
    entityRecord.position = velocityParticleToSceneCartesian(
      particle,
      algorithmSource,
    )
    survivingParticles.push(particle)
  })
  velocityParticles = survivingParticles
}

/** 挂载唯一的 RAF 推进循环，避免换帧时重复注册场景回调。 */
function startVelocityParticleLoop() {
  if (!viewer.value?.scene || velocityParticleLoopAttached) return
  velocityParticleLoopAttached = true
  const tick = () => {
    if (!velocityParticleLoopAttached) {
      velocityParticleAnimationFrame = null
      return
    }
    advanceVelocityParticles()
    requestSceneRender()
    velocityParticleAnimationFrame = window.requestAnimationFrame(tick)
  }
  velocityParticleAnimationFrame = window.requestAnimationFrame(tick)
}

/** 停止粒子推进循环并清空粒子数组。 */
function stopVelocityParticleLoop(shouldClearParticles = true) {
  velocityParticleLoopAttached = false
  if (velocityParticleAnimationFrame !== null) {
    window.cancelAnimationFrame(velocityParticleAnimationFrame)
    velocityParticleAnimationFrame = null
  }
  if (shouldClearParticles) velocityParticles = []
  lastVelocityParticleTickMs = 0
}

function diffusionWindOffsetToSceneCartesian(
  cell: DiffusionVolumeCell,
  alongMeters: number,
) {
  const headingRadians = ((cell.headingDegrees % 360) * Math.PI) / 180
  const mapMetersPerUnit = SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit
  return diffusionVolumeCellToSceneCartesian({
    ...cell,
    x: cell.x + (Math.sin(headingRadians) * alongMeters) / mapMetersPerUnit,
    y: cell.y - (Math.cos(headingRadians) * alongMeters) / mapMetersPerUnit,
  })
}

function seededSignedNoise(seed: number, stream: number) {
  const value = Math.sin(seed * 0.000001 + stream * 12.9898) * 43758.5453
  return (value - Math.floor(value)) * 2 - 1
}

function createPuffOrientation(
  runtime: SuperMapRuntime,
  position: unknown,
  headingDegrees: number,
) {
  const runtimeRecord = runtime as Record<string, unknown>
  const transforms = runtimeRecord.Transforms as
    | Record<string, unknown>
    | undefined
  const headingPitchRollQuaternion = transforms?.headingPitchRollQuaternion
  const HeadingPitchRoll = runtimeRecord.HeadingPitchRoll
  if (
    typeof headingPitchRollQuaternion !== 'function' ||
    typeof HeadingPitchRoll !== 'function'
  )
    return null
  try {
    const HeadingPitchRollConstructor = HeadingPitchRoll as new (
      heading: number,
      pitch: number,
      roll: number,
    ) => unknown
    return headingPitchRollQuaternion.call(
      transforms,
      position,
      new HeadingPitchRollConstructor(
        ((headingDegrees % 360) * Math.PI) / 180,
        0,
        0,
      ),
    )
  } catch {
    return null
  }
}

function volumeCellLocalOffsetMeters(cell: DiffusionVolumeCell) {
  const source = currentLeakSourceAnchor4490()
  const algorithmSource = leakSourceToAlgorithmPoint(source)
  return {
    source,
    eastMeters:
      (cell.x - algorithmSource.x) * SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit,
    northMeters:
      -(cell.y - algorithmSource.y) *
      SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit,
  }
}

function boundedVolumeCellRadii(cell: DiffusionVolumeCell): {
  along: number
  cross: number
  vertical: number
} | null {
  const { source, eastMeters, northMeters } = volumeCellLocalOffsetMeters(cell)
  const horizontalDistanceMeters = Math.hypot(eastMeters, northMeters)
  const horizontalAllowanceMeters =
    source.volumeFence.maxHorizontalRadiusMeters - horizontalDistanceMeters
  const lowerAllowanceMeters =
    cell.zOffsetMeters - source.volumeFence.minRelativeHeightMeters
  const upperAllowanceMeters =
    source.volumeFence.maxRelativeHeightMeters - cell.zOffsetMeters
  const maximumRadiusMeters = Math.min(
    Math.max(
      cell.radiusAlongMeters,
      cell.radiusCrossMeters,
      cell.radiusVerticalMeters,
    ),
    horizontalAllowanceMeters,
    lowerAllowanceMeters,
    upperAllowanceMeters,
  )
  if (maximumRadiusMeters < 0.35) return null
  return {
    along: Math.min(
      clamp(cell.radiusAlongMeters, 0.45, 4.5),
      maximumRadiusMeters,
    ),
    cross: Math.min(
      clamp(cell.radiusCrossMeters, 0.28, 2.2),
      maximumRadiusMeters,
    ),
    vertical: Math.min(
      clamp(cell.radiusVerticalMeters, 0.24, 1.6),
      maximumRadiusMeters,
    ),
  }
}

function diffusionVolumeCellToSceneCartesian(cell: DiffusionVolumeCell) {
  if (boundedVolumeCellRadii(cell) === null) return null
  const { source, eastMeters, northMeters } = volumeCellLocalOffsetMeters(cell)
  if (!geographicSceneMode.value) {
    return mapPointToSceneCartesian(
      algorithmToLocal({ x: cell.x, y: cell.y }),
      source.modelLocalEnuMeters.up + cell.zOffsetMeters,
    )
  }
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return null
  const sourceEcef = geoToEcef(
    source.longitude,
    source.latitude,
    source.heightMeters,
  )
  const basis = enuBasis(source.longitude, source.latitude)
  const volumeEcef = addVector(
    addVector(
      addVector(sourceEcef, scaleVector(basis.east, eastMeters)),
      scaleVector(basis.north, northMeters),
    ),
    scaleVector(basis.up, cell.zOffsetMeters),
  )
  return new runtime.Cartesian3(volumeEcef.x, volumeEcef.y, volumeEcef.z)
}

function addEllipseEntity(
  point: SuperMapCupMapPoint,
  options: {
    title: string
    radius: number
    color: string
    alpha: number
    altitudeOffset: number
    verticalRadius?: number
  },
) {
  if (shouldUseThreeDTiles.value) {
    addEntity({
      name: options.title,
      ...threeTilesCirclePolylineGraphics(
        point,
        options.radius,
        options.color,
        Math.min(options.alpha + 0.32, 0.82),
        2.2,
        options.altitudeOffset,
      ),
      description: `${options.title}: ${describeMapPoint(point, options.altitudeOffset)}`,
    })
    return
  }
  const verticalRadius = options.verticalRadius ?? 2
  const position = mapPointToSceneCartesian(
    point,
    options.altitudeOffset + verticalRadius,
  )
  const radii = sceneRadii(options.radius, verticalRadius)
  if (!position) return
  if (!geographicSceneMode.value && radii) {
    addEntity({
      name: options.title,
      position,
      ellipsoid: {
        radii,
        material: colorFromCss(options.color, options.alpha),
        outline: true,
        outlineColor: colorFromCss(
          options.color,
          Math.min(options.alpha + 0.34, 0.9),
        ),
      },
      description: `${options.title}: ${describeMapPoint(point, options.altitudeOffset)}`,
    })
    return
  }
  const geo = shouldUseThreeDTiles.value
    ? threeTilesMapPointToGeo(point, options.altitudeOffset + verticalRadius)
    : mapPointToGeo(
        point,
        options.altitudeOffset +
          (geographicSceneMode.value ? GLOBE_ALGORITHM_ALTITUDE_LIFT : 0),
      )
  addEntity({
    name: options.title,
    position,
    ellipse: {
      semiMajorAxis: mapDistanceToSceneMeters(options.radius),
      semiMinorAxis: mapDistanceToSceneMeters(options.radius),
      height: geo.altitude,
      material: colorFromCss(options.color, options.alpha),
      outline: true,
      outlineColor: colorFromCss(
        options.color,
        Math.min(options.alpha + 0.34, 0.9),
      ),
    },
    description: `${options.title}: ${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N`,
  })
}

function threeTilesCirclePolylineGraphics(
  point: SuperMapCupMapPoint,
  radius: number,
  color: string,
  alpha: number,
  width: number,
  altitudeOffset = 0.28,
) {
  const steps = 48
  const positions = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2
    return mapPointToSceneCartesian(
      {
        x: point.x + Math.cos(angle) * radius,
        y: point.y + Math.sin(angle) * radius,
      },
      altitudeOffset,
    )
  }).filter((item): item is unknown => Boolean(item))
  return {
    polyline: {
      positions,
      width,
      material: colorFromCss(color, alpha),
      disableDepthTestDistance: 1200,
    },
  }
}

function addPolylineEntity(
  points: SuperMapCupMapPoint[],
  title: string,
  color: string,
  options: {
    width?: number
    baseWidth?: number
    alpha?: number
    altitudeOffset?: number
  } = {},
) {
  // 路网点本身位于地面/道路面；仅保留厘米级抬高避免深度冲突。
  // 旧实现按点序递增高度并默认抬高 1.4m，路线因此会逐段飞离路面。
  const altitudeOffset =
    options.altitudeOffset ??
    (shouldUseThreeDTiles.value
      ? 0.12
      : geographicSceneMode.value
        ? 0.45
        : 0.08)
  const positions = points
    .map((point) => mapPointToSceneCartesian(point, altitudeOffset))
    .filter((item): item is unknown => Boolean(item))
  if (positions.length < 2) return
  addEntity({
    name: `${title}底色`,
    polyline: {
      positions,
      width: options.baseWidth ?? 11,
      material: colorFromCss(
        '#001827',
        Math.min((options.alpha ?? 0.88) + 0.18, 0.95),
      ),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    description: `${title}底色: 用于增强三维疏散路径截图可读性`,
  })
  addEntity({
    name: title,
    polyline: {
      positions,
      width: options.width ?? 8,
      material: colorFromCss(color, options.alpha ?? 0.98),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    description: `${title}: ${positions.length} 个 ${overlayCoordinateLabel.value}路径点`,
  })
}

function addRouteLabelEntity(points: SuperMapCupMapPoint[], title: string) {
  if (!points.length) return
  const middle = points[Math.floor(points.length / 2)]
  const position = mapPointToSceneCartesian(
    middle,
    shouldUseThreeDTiles.value ? 2.8 : geographicSceneMode.value ? 4 : 1.8,
  )
  if (!position) return
  addEntity({
    name: title,
    position,
    label: {
      text: title,
      font: '700 16px sans-serif',
      fillColor: colorFromCss('#eafff6', 0.98),
      outlineColor: colorFromCss('#001827', 0.96),
      outlineWidth: 4,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    description: `${title}: ${points.length} 个 ${overlayCoordinateLabel.value}路径点`,
  })
}

function addRouteBeaconEntities(points: SuperMapCupMapPoint[], color: string) {
  const beacons: SuperMapCupMapPoint[] = []
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const distance = Math.hypot(end.x - start.x, end.y - start.y)
    const steps = Math.max(2, Math.min(10, Math.ceil(distance / 55)))
    for (let step = 0; step <= steps; step += 1) {
      const ratio = step / steps
      beacons.push({
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      })
    }
  }
  beacons.forEach((point, index) => {
    const position = mapPointToSceneCartesian(
      point,
      shouldUseThreeDTiles.value
        ? 0.22
        : geographicSceneMode.value
          ? 0.7
          : 0.16,
    )
    if (!position) return
    addEntity({
      name: `疏散路线箭头 ${index + 1}`,
      position,
      point: {
        pixelSize: index % 3 === 0 ? 9 : 7,
        color: colorFromCss(color, 0.98),
        outlineColor: colorFromCss('#001827', 0.96),
        outlineWidth: 1.2,
        disableDepthTestDistance: 700,
      },
      billboard: {
        image: markerSvgDataUri(color, index % 2 === 0 ? '>>' : ''),
        width: index % 2 === 0 ? 18 : 13,
        height: index % 2 === 0 ? 18 : 13,
        disableDepthTestDistance: 700,
      },
      label: {
        text: index % 2 === 0 ? `R${index + 1}` : '',
        font: '700 10px sans-serif',
        fillColor: colorFromCss('#ffffff', 0.98),
        outlineColor: colorFromCss('#001827', 0.96),
        outlineWidth: 2,
        disableDepthTestDistance: 700,
      },
      description: `疏散路线箭头: ${describeMapPoint(point, 2.2)}`,
    })
  })
}

function flyToRouteOverview(points: SuperMapCupMapPoint[]) {
  if (!shouldUseThreeDTiles.value || !points.length) return
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime?.Cartesian3?.fromDegrees || !currentViewer) return
  const center = routeCenter(points)
  if (!center) return
  const geo = threeTilesMapPointToGeo(center, 0)
  const destination = runtime.Cartesian3.fromDegrees(
    geo.longitude + 0.00055,
    geo.latitude - 0.00042,
    geo.altitude + 210,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(18),
        pitch: runtime.Math.toRadians(-64),
        roll: runtime.Math.toRadians(0),
      }
    : undefined
  const routeCamera = currentViewer.scene.camera || currentViewer.camera
  routeCamera?.flyTo?.({ destination, orientation, duration: 0.8 })
}

function routeCenter(points: SuperMapCupMapPoint[]) {
  if (!points.length) return null
  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      maxX: Math.max(acc.maxX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxY: Math.max(acc.maxY, point.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  )
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
}

function addPolygonEntity(
  positions: unknown[],
  title: string,
  color: string,
  alpha: number,
  description: string,
) {
  if (positions.length < 4) return false
  if (shouldUseThreeDTiles.value) {
    addEntity({
      name: `${title}线框`,
      polyline: {
        positions,
        width: 2,
        material: colorFromCss(color, Math.min(alpha + 0.18, 0.74)),
        disableDepthTestDistance: 900,
      },
      description: `${description}<br/>3D Tiles 模式使用线框，避免面片穿模或跨瓦片三角化。`,
    })
    return true
  }
  addEntity({
    name: title,
    polygon: {
      hierarchy: { positions },
      perPositionHeight: true,
      material: colorFromCss(color, alpha),
      outline: false,
    },
    description,
  })
  return true
}

function addEntity(options: Record<string, unknown>) {
  const entity = viewer.value?.entities?.add(options)
  if (entity && activeOverlayGroup)
    registerOverlayEntity(activeOverlayGroup, entity)
  return entity
}

function markExternalObject<T>(value: T): T {
  return value && typeof value === 'object'
    ? (markRaw(value as object) as T)
    : value
}

function geoToCartesian(geo: SuperMapCupGeoPoint) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3?.fromDegrees) return null
  return runtime.Cartesian3.fromDegrees(
    geo.longitude,
    geo.latitude,
    geo.altitude,
  )
}

function mapPointToSceneCartesian(
  point: SuperMapCupMapPoint,
  altitudeOffset = 0,
) {
  if (shouldUseThreeDTiles.value)
    return mapPointToThreeTilesCartesian(point, altitudeOffset)
  if (geographicSceneMode.value)
    return geoToCartesian(
      mapPointToGeo(point, altitudeOffset + GLOBE_ALGORITHM_ALTITUDE_LIFT),
    )
  const runtime = getRuntime()
  const local = mapPointToS3MLocal(point, altitudeOffset)
  return runtime?.Cartesian3
    ? new runtime.Cartesian3(local.x, local.y, local.z)
    : null
}

function mapPointToThreeTilesCartesian(
  point: SuperMapCupMapPoint,
  altitudeOffset = 0,
) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return null
  const ecef = threeTilesMapPointToEcef(point, altitudeOffset)
  return new runtime.Cartesian3(ecef.x, ecef.y, ecef.z)
}

function threeTilesMapPointToEcef(
  point: SuperMapCupMapPoint,
  altitudeMeters = 0,
) {
  const georef = threeTilesGeoreference.value
  const runtime = getRuntime()
  const local = mapPointToThreeTilesLocal(point)
  // 当前园区 tileset 的根矩阵由转换清单明确声明为：
  // ENU_LOCAL_X_EAST_Y_UP_Z_SOUTH。业务 LOCALMAP 则是 X 向东、Y 向南，
  // 且 mapPointToThreeTilesLocal() 的 Y 为旧 S3M 平面轴（向北为正）。
  // 因此地面点必须写成 (X, 0, -Y)。旧实现写成 (X, Y, 0)，会把
  // 二维南北坐标误塞进 Tiles 高度轴，贴地重建时又将它丢弃，导致所有
  // 泄漏源几乎落在同一纬线上并飞入模型外空地。
  const tilesLocal = mapLocalPlaneToThreeTilesAxes(local)
  const horizontalEcef = multiplyMatrix4ByPoint(
    georef.transform,
    tilesLocal.x,
    tilesLocal.y,
    tilesLocal.z,
  )
  const rawCartesian = runtime?.Cartesian3
    ? new runtime.Cartesian3(
        horizontalEcef.x,
        horizontalEcef.y,
        horizontalEcef.z,
      )
    : null
  const cartographic =
    rawCartesian && runtime?.Cartographic?.fromCartesian
      ? runtime.Cartographic.fromCartesian(rawCartesian)
      : null
  const geo = ecefToGeo(horizontalEcef.x, horizontalEcef.y, horizontalEcef.z)
  const surfaceHeight = Number(georef.anchor.height) || 0
  if (
    cartographic &&
    runtime?.Cartesian3?.fromDegrees &&
    runtime.Math?.toDegrees
  ) {
    const surfaceCartesian = runtime.Cartesian3.fromDegrees(
      runtime.Math.toDegrees(cartographic.longitude),
      runtime.Math.toDegrees(cartographic.latitude),
      surfaceHeight + altitudeMeters,
    )
    const surfaceVector = vectorFrom(surfaceCartesian as Vector3Like)
    if (surfaceVector) return surfaceVector
  }
  return geoToEcef(geo.longitude, geo.latitude, surfaceHeight + altitudeMeters)
}

function threeTilesMapPointToGeo(
  point: SuperMapCupMapPoint,
  altitudeMeters = 0,
) {
  const ecef = threeTilesMapPointToEcef(point, altitudeMeters)
  const runtime = getRuntime()
  if (
    runtime?.Cartesian3 &&
    runtime.Cartographic?.fromCartesian &&
    runtime.Math?.toDegrees
  ) {
    const cartographic = runtime.Cartographic.fromCartesian(
      new runtime.Cartesian3(ecef.x, ecef.y, ecef.z),
    )
    if (cartographic) {
      const projected = geoToProjectedApprox(
        runtime.Math.toDegrees(cartographic.longitude),
        runtime.Math.toDegrees(cartographic.latitude),
      )
      return {
        longitude: Number(
          runtime.Math.toDegrees(cartographic.longitude).toFixed(8),
        ),
        latitude: Number(
          runtime.Math.toDegrees(cartographic.latitude).toFixed(8),
        ),
        altitude: Number(Number(cartographic.height || 0).toFixed(2)),
        easting: projected.easting,
        northing: projected.northing,
        projectedEpsg: 4490,
      }
    }
  }
  return ecefToGeo(ecef.x, ecef.y, ecef.z)
}

function threeTilesSceneCenterGeo() {
  return threeTilesGeoreference.value.viewCenter
}

function multiplyMatrix4ByPoint(
  matrix: number[],
  x: number,
  y: number,
  z: number,
) {
  if (matrix.length < 16) {
    return multiplyMatrix4ByPoint(
      THREE_TILES_FALLBACK_GEOREFERENCE.transform,
      x,
      y,
      z,
    )
  }
  return {
    x: matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    y: matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    z: matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  }
}

// 以下纯数学函数已抽离至 @/utils/geoMath：
// ecefToGeo / geoToEcef / geoToProjectedApprox
// （WGS84↔ECEF 转换 + 4490 投影近似，见 geoMath.ts）

function sensorSceneMapPoint(
  sensor: ModelBoundMonitorSensor,
): SuperMapCupMapPoint {
  // F11（2026-08-01）：B 套点位 mapPoint 为算法系（x=east+80, y=-north+420），
  // 显示/拾取统一逆变换回底图系（A 锚点），再经 mapPointToGeo 落模型 Wgs84 位置。
  return algorithmToLocal(sensor.mapPoint)
}

// F6 越界告警去重集（2026-07-18）：记录已告警过的越界坐标键，避免重复刷屏。
// 每个键只告警一次；如需重置可清空此 Set（如切换场景后）。仅用于 mapPointToS3MLocal。
const S3M_LOCAL_OUT_OF_BOUNDS_WARNED = new Set<string>()

function mapPointToS3MLocal(point: SuperMapCupMapPoint, z = 8) {
  const map = SUPERMAP_CUP_SCENARIO.map
  // F6 量级校验（2026-07-18）：本地系点越界时告警，不静默夹回。
  // 越界说明上游坐标转换错（如 iServer D 逆变换量级不对、Python 链路返回非本地系坐标）。
  // 用 Set 去重避免每个路径点重复刷屏；pushDebugMessage 留证据，不阻断渲染。
  const rawNx = point.x / map.width
  const rawNy = point.y / map.height
  if (!Number.isFinite(rawNx) || !Number.isFinite(rawNy)) {
    const key = `nan-${point.x}-${point.y}`
    if (!S3M_LOCAL_OUT_OF_BOUNDS_WARNED.has(key)) {
      S3M_LOCAL_OUT_OF_BOUNDS_WARNED.add(key)
      // eslint-disable-next-line no-console
      console.warn('[F6] mapPointToS3MLocal 输入非有限值', point)
      pushDebugMessage(
        `坐标转换输入非有限值：(${point.x}, ${point.y})，请检查上游算法返回`,
      )
    }
  } else if (rawNx < -0.05 || rawNx > 1.05 || rawNy < -0.05 || rawNy > 1.05) {
    const key = `${rawNx.toFixed(2)},${rawNy.toFixed(2)}`
    if (!S3M_LOCAL_OUT_OF_BOUNDS_WARNED.has(key)) {
      S3M_LOCAL_OUT_OF_BOUNDS_WARNED.add(key)
      // eslint-disable-next-line no-console
      console.warn('[F6] mapPointToS3MLocal 输入越界', { point, rawNx, rawNy })
      pushDebugMessage(
        `本地系坐标越界：(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) 超出地图范围 [0,${map.width}]×[0,${map.height}]，已夹回边界（上游坐标转换可能出错）`,
      )
    }
  }
  const nx = clamp(rawNx, 0, 1)
  const ny = clamp(rawNy, 0, 1)
  return {
    x:
      LOCAL_S3M_BOUNDS.left +
      nx * (LOCAL_S3M_BOUNDS.right - LOCAL_S3M_BOUNDS.left) +
      LOCAL_S3M_BUSINESS_OFFSET.x,
    y:
      LOCAL_S3M_BOUNDS.top -
      ny * (LOCAL_S3M_BOUNDS.top - LOCAL_S3M_BOUNDS.bottom) +
      LOCAL_S3M_BUSINESS_OFFSET.y,
    z,
  }
}

function mapPointToThreeTilesLocal(point: SuperMapCupMapPoint) {
  const map = SUPERMAP_CUP_SCENARIO.map
  const nx = clamp(point.x / map.width, 0, 1)
  const ny = clamp(point.y / map.height, 0, 1)
  // Park_RoadNetworkEdge_L 的 LOCALMAPX/Y -> S3MX/Y 控制字段验证：
  // 3D Tiles 与 iServer 道路共用原始 S3M 仿射坐标，禁止叠加旧 S3M 展示偏移。
  return {
    x:
      LOCAL_S3M_BOUNDS.left +
      nx * (LOCAL_S3M_BOUNDS.right - LOCAL_S3M_BOUNDS.left),
    y:
      LOCAL_S3M_BOUNDS.top -
      ny * (LOCAL_S3M_BOUNDS.top - LOCAL_S3M_BOUNDS.bottom),
  }
}

function sceneRadii(radius: number, verticalRadius: number) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return null
  const sceneRadius = mapDistanceToSceneMeters(radius)
  return new runtime.Cartesian3(
    sceneRadius,
    sceneRadius,
    mapDistanceToSceneMeters(verticalRadius),
  )
}

function mapDistanceToSceneMeters(distance: number) {
  if (geographicSceneMode.value) return distance
  const map = SUPERMAP_CUP_SCENARIO.map
  const sx = (LOCAL_S3M_BOUNDS.right - LOCAL_S3M_BOUNDS.left) / map.width
  const sy = (LOCAL_S3M_BOUNDS.top - LOCAL_S3M_BOUNDS.bottom) / map.height
  return distance * ((sx + sy) / 2)
}

function describeMapPoint(point: SuperMapCupMapPoint, altitudeOffset = 0) {
  if (shouldUseThreeDTiles.value) {
    const sceneGeo = threeTilesMapPointToGeo(point, altitudeOffset)
    return `${sceneGeo.longitude.toFixed(6)}E, ${sceneGeo.latitude.toFixed(6)}N, ${sceneGeo.altitude.toFixed(1)}m`
  }
  const geo = mapPointToGeo(
    point,
    altitudeOffset +
      (geographicSceneMode.value ? GLOBE_ALGORITHM_ALTITUDE_LIFT : 0),
  )
  if (geographicSceneMode.value) {
    return `${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N, ${geo.altitude.toFixed(1)}m`
  }
  const local = mapPointToS3MLocal(point, altitudeOffset)
  return `${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N, ${geo.altitude.toFixed(1)}m / local(${local.x.toFixed(1)}, ${local.y.toFixed(1)}, ${local.z.toFixed(1)})`
}

function describeSensorSceneMapPoint(
  sensor: ModelBoundMonitorSensor,
  altitudeOffset = 0,
) {
  return describeMapPoint(sensorSceneMapPoint(sensor), altitudeOffset)
}

function colorFromCss(css: string, alpha: number) {
  const runtime = getRuntime()
  const color = runtime?.Color?.fromCssColorString?.(css)
  if (color?.withAlpha) return color.withAlpha(alpha)
  if (color) return color
  return runtime?.Color?.YELLOW?.withAlpha
    ? runtime.Color.YELLOW.withAlpha(alpha)
    : undefined
}

function sensorProjectedText(sensor: ModelBoundMonitorSensor) {
  const projected = mapPointToGeo(
    sensorSceneMapPoint(sensor),
    sensor.installationHeight,
  ) as SuperMapCupGeoPoint & {
    easting?: number
    northing?: number
  }
  return `E=${Number(projected.easting || 0).toFixed(3)}, N=${Number(projected.northing || 0).toFixed(3)}`
}

function sensorGeoText(sensor: ModelBoundMonitorSensor) {
  if (shouldUseThreeDTiles.value) {
    const sceneGeo = threeTilesMapPointToGeo(
      sensorSceneMapPoint(sensor),
      sensor.installationHeight,
    )
    return `${sceneGeo.longitude.toFixed(6)}E, ${sceneGeo.latitude.toFixed(6)}N, H=${sceneGeo.altitude.toFixed(1)}m`
  }
  return `${sensor.wgs84.longitude.toFixed(6)}E, ${sensor.wgs84.latitude.toFixed(6)}N`
}

function getEstimatedSourcePoint(
  result: AlgorithmRecord | null,
): SuperMapCupMapPoint | null {
  return toMapPoint(asRecord(asRecord(result).estimatedSource).mapPoint)
}

function toMapPoint(value: unknown): SuperMapCupMapPoint | null {
  const record = asRecord(value)
  const x = Number(record.x)
  const y = Number(record.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function toLocalPoint(value: AlgorithmRecord): SuperMapCupMapPoint | null {
  const projected = toMapPoint(value)
  return projected ? projectedToLocal(projected.x, projected.y) : null
}

function setDefaultCamera(runtime: SuperMapRuntime) {
  if (shouldUseThreeDTiles.value && focusThreeTilesOverview(runtime, false))
    return
  const camera = defaultCamera.value
  if (!runtime.Cartesian3?.fromDegrees) return
  const destination = runtime.Cartesian3.fromDegrees(
    camera.longitude,
    camera.latitude,
    camera.height,
  )
  const orientation = runtime.Math
    ? {
        heading: runtime.Math.toRadians(camera.heading),
        pitch: runtime.Math.toRadians(camera.pitch),
        roll: runtime.Math.toRadians(camera.roll),
      }
    : undefined
  viewer.value?.scene.camera?.setView?.({ destination, orientation })
  viewer.value?.camera?.setView?.({ destination, orientation })
}

function applyS3MLayerGeoreference(layer: unknown) {
  if (!shouldApplyLayerPosition.value || !layer || typeof layer !== 'object')
    return
  const runtime = getRuntime()
  const position = s3mLayerPosition.value
  const layerRecord = layer as Record<string, unknown>
  layerRecord.lon = position.longitude
  layerRecord.lat = position.latitude
  layerRecord.height = position.height
  layerRecord.lon = position.longitude
  layerRecord.lat = position.latitude
  layerRecord.altitude = position.height
  layerRecord.position = [
    position.longitude,
    position.latitude,
    position.height,
  ]

  const setPosition = layerRecord.setPosition
  if (typeof setPosition === 'function') {
    try {
      setPosition.call(
        layer,
        position.longitude,
        position.latitude,
        position.height,
      )
    } catch {
      try {
        setPosition.call(layer, [
          position.longitude,
          position.latitude,
          position.height,
        ])
      } catch (error) {
        pushDebugMessage(
          error instanceof Error ? error.message : 'S3M setPosition 失败',
        )
      }
    }
  }

  const anchor = runtime?.Cartesian3?.fromDegrees?.(
    position.longitude,
    position.latitude,
    position.height,
  )
  const modelMatrix =
    anchor && runtime?.Transforms?.eastNorthUpToFixedFrame?.(anchor)
  if (modelMatrix) {
    layerRecord.modelMatrix = modelMatrix
    layerRecord._modelMatrix = modelMatrix
  }

  const refresh = layerRecord.refresh
  if (typeof refresh === 'function') {
    try {
      refresh.call(layer)
    } catch {
      // 部分 SuperMap S3M layer 没有公开 refresh，忽略即可。
    }
  }
  pushDebugMessage(
    `S3M 图层已尝试锚定到 EPSG:4490 ${position.longitude},${position.latitude},${position.height}`,
  )
}

// 论文 5.1.3 第6条（LOD + 视锥裁剪）：S3M 图层默认仅靠 SDK 内置 LOD，
// 这里将 lodRangeScale 保持在接近发布默认值的 1.25，避免 2.0 过早切到粗纹理，
// 导致建筑材质在 Web 端明显变糊或颜色块化。独立局部场景额外常驻根瓦片，
// 防止旧设备缓存近景切换到空细层后消失；不改 viewDistance 数组。
function applyS3MLayerLodConfig(layer: unknown) {
  if (!layer || typeof layer !== 'object') return
  const layerRecord = layer as Record<string, unknown>
  const lodSettings = resolveS3MLayerLodSettings(scenePresentationMode.value)
  try {
    if (
      'lodRangeScale' in layerRecord &&
      typeof layerRecord.lodRangeScale !== 'function'
    ) {
      layerRecord.lodRangeScale = lodSettings.lodRangeScale
    }
  } catch {
    // 部分 SDK 版本 lodRangeScale 不可写，忽略。
  }
  const setLodRangeScale = layerRecord.setLodRangeScale
  if (typeof setLodRangeScale === 'function') {
    try {
      setLodRangeScale.call(layer, lodSettings.lodRangeScale)
    } catch {
      // setter 抛错时回退到属性写入的结果，不阻断加载。
    }
  }
  try {
    if (
      'residentRootTile' in layerRecord &&
      typeof layerRecord.residentRootTile !== 'function'
    ) {
      layerRecord.residentRootTile = lodSettings.residentRootTile
    }
  } catch {
    // 老版本 SDK 不支持根瓦片常驻时仍沿用默认 LOD 行为。
  }
}

// 按需渲染模式下（requestRenderMode=true），entity/layer 变更后需显式请求重绘，
// 否则场景不刷新。集中封装避免遗漏。非按需模式下调用无副作用（Cesium 会忽略多余请求）。
function requestSceneRender() {
  const scene = viewer.value?.scene
  if (!scene) return
  const requestRender = (scene as Record<string, unknown>).requestRender
  if (typeof requestRender === 'function') {
    try {
      requestRender.call(scene)
    } catch {
      // 极少数 SDK 版本签名不同，忽略。
    }
  }
}

function setupPicking(runtime: SuperMapRuntime) {
  const currentViewer = viewer.value
  if (
    !currentViewer?.scene.canvas ||
    !runtime.ScreenSpaceEventHandler ||
    !runtime.ScreenSpaceEventType?.LEFT_CLICK
  ) {
    return
  }
  clickHandler.value = markRaw(
    new runtime.ScreenSpaceEventHandler(currentViewer.scene.canvas),
  )
  clickHandler.value.setInputAction(async (event) => {
    const position = event.position
    if (!position) return
    const picked = currentViewer.scene.pick?.(position) as
      | PickedFeature
      | undefined
    if (pendingSensorPlacement.value) {
      emitPendingSensorPlacement({ position }, picked)
      return
    }
    if (algorithmPickMode.value) {
      await emitAlgorithmPointSelection({ position }, picked)
      return
    }
    const sensor = resolvePickedSensor(picked)
    if (sensor) {
      flyToSensor(sensor.id)
      return
    }
    const immediatePayload = buildScenePickPayload(picked, position)
    if (!immediatePayload) return
    emit('facility-click', immediatePayload.selectedObjectId)
    emit('scene-object-pick', immediatePayload)
    const equipmentPayload = await buildEquipmentScenePickPayload(
      picked,
      position,
    )
    if (
      !equipmentPayload ||
      equipmentPayload.selectedObjectId === immediatePayload.selectedObjectId
    ) {
      return
    }
    emit('facility-click', equipmentPayload.selectedObjectId)
    emit('scene-object-pick', equipmentPayload)
  }, runtime.ScreenSpaceEventType.LEFT_CLICK)
}

async function emitAlgorithmPointSelection(
  event: { position: unknown },
  picked: PickedFeature | undefined,
) {
  const pickedPoint = resolvePickedMapPoint(event, picked)
  if (!pickedPoint) {
    sceneMessage.value = '没有取到有效三维落点，请在建筑群、设备或道路上点击。'
    return
  }
  const point = clampMapPoint(pickedPoint)
  const mode = algorithmPickMode.value
  algorithmPickMode.value = null
  if (mode === 'leak-source') {
    clearOverlayGroup('temporary-selection')
    const pickedPayload = await buildEquipmentScenePickPayload(
      picked,
      event.position,
    )
    const pickedSmId = Number(
      pickedPayload?.rawProperties.ComponentSmID ??
        pickedPayload?.rawProperties.SmID ??
        pickedPayload?.selectedObjectId,
    )
    const equipmentSmIds = String(
      pickedPayload?.rawProperties.ComponentSmIDs ?? '',
    )
      .split(',')
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value))
    const source = LEAK_SOURCE_ANCHORS_4490.find(
      (candidate) =>
        candidate.modelSmId === pickedSmId ||
        equipmentSmIds.includes(candidate.modelSmId),
    )
    if (!source) {
      algorithmPickMode.value = 'leak-source'
      sceneMessage.value = Number.isFinite(pickedSmId)
        ? `SmID=${pickedSmId} 不是已登记的泄漏设备；没有修改算法源，请重新点选高亮登记设备。`
        : '当前对象没有有效 SmID；没有修改算法源，请重新点选高亮登记设备。'
      requestSceneRender()
      return
    }
    activeLeakSourceId.value = source.leakSourceId
    const selectedPoint = algorithmToLocal(leakSourceToAlgorithmPoint(source))
    selectedLeakSourcePoint.value = selectedPoint
    withOverlayGroup('temporary-selection', () =>
      addModelBoundLeakSourceEntity(),
    )
    diffusionResult.value = null
    particleResult.value = null
    evacuationResult.value = null
    sceneMessage.value = `已绑定设备 ${pickedPayload?.selectedObjectName || source.modelName} 的泄漏部件 ${source.modelName}（SmID=${source.modelSmId}），算法落点固定为 ${source.leakSourceId}。`
    void flyToLeakSource(selectedPoint)
    requestSceneRender()
    return
  }
  if (mode === 'evacuation-start') {
    clearOverlayGroup('temporary-selection')
    const selectedPoint = snapPointToThreeTilesRouteRoad(point)
    selectedEvacuationStartPoint.value = selectedPoint
    withOverlayGroup('temporary-selection', () =>
      addPointEntity(selectedPoint, '人员起点', '#35d2ff', 15),
    )
    evacuationResult.value = null
    sceneMessage.value = `已设置人员起点并吸附到道路：${describeMapPoint(selectedPoint, 1)}。扩散后可运行避险路径。`
    requestSceneRender()
  }
}

function emitPendingSensorPlacement(
  event: { position: unknown },
  picked: PickedFeature | undefined,
) {
  const draft = pendingSensorPlacement.value
  if (!draft) return
  const payload = resolveSensorPlacementPayload(event, picked, draft)
  if (!payload) {
    sceneMessage.value = '没有取到有效三维落点，请在园区模型或道路面上点击。'
    return
  }
  pendingSensorPlacement.value = null
  emit('sensor-placement', payload)
  sceneMessage.value = `已添加临时监控点：EPSG:4490 ${payload.geoPoint.longitude.toFixed(6)}E, ${payload.geoPoint.latitude.toFixed(6)}N。`
}

function resolveSensorPlacementPayload(
  event: { position: unknown },
  picked: PickedFeature | undefined,
  draft: SensorPlacementDraft,
): SensorPlacementPayload | null {
  const scenePoint = pickScenePoint(event.position)
  const mapPoint = resolvePickedMapPoint(event, picked)
  if (!mapPoint) return null
  const clampedPoint = clampMapPoint(mapPoint)
  return {
    mapPoint: clampedPoint,
    geoPoint: mapPointToGeo(clampedPoint, draft.installationHeight),
    scenePoint: scenePoint || undefined,
    draft,
  }
}

function resolvePickedMapPoint(
  event: { position: unknown },
  picked: PickedFeature | undefined,
) {
  if (shouldUseThreeDTiles.value) return screenPointToMapPoint(event.position)
  const scenePoint = pickScenePoint(event.position)
  const rawProperties = picked ? collectPickProperties(picked) : {}
  const projected = resolveProjectedPoint(rawProperties)
  const projectedMapPoint = projected
    ? projectedToLocal(projected.easting, projected.northing)
    : null
  const sceneMapPoint =
    scenePoint && !shouldUseThreeDTiles.value
      ? sceneLocalPointToMapPoint(scenePoint)
      : null
  return (
    sceneMapPoint || projectedMapPoint || screenPointToMapPoint(event.position)
  )
}

function pickScenePoint(position: unknown) {
  const scene = viewer.value?.scene
  if (!scene) return null
  const depthPoint = vectorFrom(
    scene.pickPosition?.(position) as Vector3Like | undefined,
  )
  if (depthPoint) return depthPoint
  const camera = scene.camera || viewer.value?.camera
  const ray = camera?.getPickRay?.(position)
  if (!ray) return null
  return vectorFrom(scene.globe?.pick?.(ray, scene) as Vector3Like | undefined)
}

function sceneLocalPointToMapPoint(point: { x: number; y: number }) {
  return sceneLocalPointToMapPointInternal(point, false)
}

function sceneLocalPointToMapPointInternal(
  point: { x: number; y: number },
  clampToPark: boolean,
) {
  const map = SUPERMAP_CUP_SCENARIO.map
  const nx =
    (point.x - LOCAL_S3M_BUSINESS_OFFSET.x - LOCAL_S3M_BOUNDS.left) /
    (LOCAL_S3M_BOUNDS.right - LOCAL_S3M_BOUNDS.left)
  const ny =
    (LOCAL_S3M_BOUNDS.top - (point.y - LOCAL_S3M_BUSINESS_OFFSET.y)) /
    (LOCAL_S3M_BOUNDS.top - LOCAL_S3M_BOUNDS.bottom)
  if (
    !Number.isFinite(nx) ||
    !Number.isFinite(ny) ||
    nx < -0.18 ||
    nx > 1.18 ||
    ny < -0.18 ||
    ny > 1.18
  ) {
    return null
  }
  return {
    x: clampToPark ? clamp(nx * map.width, 0, map.width) : nx * map.width,
    y: clampToPark ? clamp(ny * map.height, 0, map.height) : ny * map.height,
  }
}

function screenPointToMapPoint(position: unknown) {
  const record =
    position && typeof position === 'object'
      ? (position as Record<string, unknown>)
      : {}
  const x = Number(record.x)
  const y = Number(record.y)
  const canvas = viewer.value?.scene?.canvas
  if (!Number.isFinite(x) || !Number.isFinite(y) || !canvas) return null
  const map = SUPERMAP_CUP_SCENARIO.map
  return {
    x: (x / Math.max(canvas.clientWidth || canvas.width, 1)) * map.width,
    y: (y / Math.max(canvas.clientHeight || canvas.height, 1)) * map.height,
  }
}

function setupGisCoordinateReadout(runtime: SuperMapRuntime) {
  clearGisCoordinateReadout()
  gisCursor.value = null
  gisCamera.value ||= defaultGisSnapshot()
  refreshGisCameraSnapshot()
  const canvas = viewer.value?.scene?.canvas
  if (!canvas) return
  let pendingPosition: { x: number; y: number } | null = null
  let rafId: number | null = null
  let moveHandler: SuperMapClickHandler | null = null
  const flushPending = () => {
    rafId = null
    if (!pendingPosition) return
    const position = pendingPosition
    pendingPosition = null
    gisCursor.value = resolveCursorGisSnapshot(position)
  }
  const queuePosition = (position: unknown) => {
    const record =
      position && typeof position === 'object'
        ? (position as Record<string, unknown>)
        : {}
    const x = Number(record.x)
    const y = Number(record.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    pendingPosition = { x, y }
    if (rafId === null) rafId = window.requestAnimationFrame(flushPending)
  }
  const handleMove = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    queuePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }
  if (
    runtime.ScreenSpaceEventHandler &&
    runtime.ScreenSpaceEventType?.MOUSE_MOVE
  ) {
    moveHandler = markRaw(new runtime.ScreenSpaceEventHandler(canvas))
    moveHandler.setInputAction((event) => {
      queuePosition(event.endPosition)
    }, runtime.ScreenSpaceEventType.MOUSE_MOVE)
  } else {
    canvas.addEventListener('mousemove', handleMove, { passive: true })
  }
  gisCoordinateCleanup = () => {
    canvas.removeEventListener('mousemove', handleMove)
    moveHandler?.destroy()
    moveHandler = null
    if (rafId !== null) window.cancelAnimationFrame(rafId)
    rafId = null
    pendingPosition = null
  }
  gisCameraTimer = window.setInterval(refreshGisCameraSnapshot, 600)
}

function resolveCursorGisSnapshot(screenPosition: { x: number; y: number }) {
  const scenePoint = pickScenePoint(screenPosition)
  if (scenePoint && (shouldUseThreeDTiles.value || geographicSceneMode.value)) {
    return ecefPointToGisSnapshot(scenePoint)
  }
  const mapPoint = scenePoint
    ? sceneLocalPointToMapPointInternal(scenePoint, true)
    : screenPointToMapPoint(screenPosition)
  if (mapPoint) return mapPointToGisSnapshot(mapPoint, scenePoint || undefined)
  return screenPointToGeoFallbackSnapshot(screenPosition)
}

function ecefPointToGisSnapshot(point: {
  x: number
  y: number
  z: number
}): GisCoordinateSnapshot {
  const geo = ecefToGeo(point.x, point.y, point.z)
  const local = projectedToLocal(geo.easting, geo.northing)
  return {
    longitude: geo.longitude,
    latitude: geo.latitude,
    altitude: geo.altitude,
    easting: geo.easting,
    northing: geo.northing,
    localX: local.x,
    localY: local.y,
    sceneX: point.x,
    sceneY: point.y,
    sceneZ: point.z,
  }
}

function screenPointToGeoFallbackSnapshot(screenPosition: {
  x: number
  y: number
}) {
  const canvas = viewer.value?.scene?.canvas
  const center =
    threeTilesGeoreference.value.viewCenter || ZHENGZHOU_STATION_57083
  if (!canvas) {
    return geoSnapshotFromLonLat(
      center.longitude,
      center.latitude,
      center.altitude,
    )
  }
  const width = Math.max(canvas.clientWidth || canvas.width, 1)
  const height = Math.max(canvas.clientHeight || canvas.height, 1)
  const metersSpanX = SUPERMAP_CUP_SCENARIO.map.width * MAP_METERS_PER_UNIT
  const metersSpanY = SUPERMAP_CUP_SCENARIO.map.height * MAP_METERS_PER_UNIT
  const metersPerDegreeLatitude = 111320
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude * Math.cos((center.latitude * Math.PI) / 180)
  const lon =
    center.longitude +
    ((screenPosition.x / width - 0.5) * metersSpanX) / metersPerDegreeLongitude
  const lat =
    center.latitude -
    ((screenPosition.y / height - 0.5) * metersSpanY) / metersPerDegreeLatitude
  return geoSnapshotFromLonLat(lon, lat, center.altitude)
}

function geoSnapshotFromLonLat(
  longitude: number,
  latitude: number,
  altitude = ZHENGZHOU_STATION_57083.altitude,
): GisCoordinateSnapshot {
  const projected = geoToProjectedApprox(longitude, latitude)
  const local = projectedToLocal(projected.easting, projected.northing)
  return {
    longitude: Number(longitude.toFixed(8)),
    latitude: Number(latitude.toFixed(8)),
    altitude: Number(altitude.toFixed(2)),
    easting: projected.easting,
    northing: projected.northing,
    localX: local.x,
    localY: local.y,
  }
}

function clearGisCoordinateReadout() {
  gisCoordinateCleanup?.()
  gisCoordinateCleanup = null
  if (gisCameraTimer !== undefined) {
    window.clearInterval(gisCameraTimer)
    gisCameraTimer = undefined
  }
}

function refreshGisCameraSnapshot() {
  const snapshot = readLocalCameraSnapshot()
  if (!snapshot) return
  if (shouldUseThreeDTiles.value || geographicSceneMode.value) {
    gisCamera.value = ecefPointToGisSnapshot(snapshot.position)
    return
  }
  const mapPoint = sceneLocalPointToMapPointInternal(snapshot.position, true)
  if (!mapPoint) return
  gisCamera.value = mapPointToGisSnapshot(mapPoint, snapshot.position)
}

function mapPointToGisSnapshot(
  mapPoint: SuperMapCupMapPoint,
  scenePoint?: { x: number; y: number; z: number },
): GisCoordinateSnapshot {
  const geo = shouldUseThreeDTiles.value
    ? threeTilesMapPointToGeo(mapPoint, scenePoint?.z || 0)
    : mapPointToGeo(mapPoint, scenePoint?.z || 0)
  return {
    longitude: geo.longitude,
    latitude: geo.latitude,
    altitude: geo.altitude,
    easting: geo.easting,
    northing: geo.northing,
    localX: mapPoint.x,
    localY: mapPoint.y,
    sceneX: scenePoint?.x,
    sceneY: scenePoint?.y,
    sceneZ: scenePoint?.z,
  }
}

function formatGisGeographic(snapshot: GisCoordinateSnapshot | null) {
  if (!snapshot) return '移动鼠标查看'
  const value = snapshot
  return `${value.longitude.toFixed(6)}E, ${value.latitude.toFixed(6)}N, H=${value.altitude.toFixed(1)}m`
}

function defaultGisSnapshot(): GisCoordinateSnapshot {
  return mapPointToGisSnapshot(
    SUPERMAP_CUP_SCENARIO.sceneCenterMapPoint,
    mapPointToS3MLocal(SUPERMAP_CUP_SCENARIO.sceneCenterMapPoint, 0),
  )
}

function clampMapPoint(point: SuperMapCupMapPoint) {
  const map = SUPERMAP_CUP_SCENARIO.map
  // F6 量级校验（2026-07-18）：交互落图点越界时告警。
  if (
    point.x < 0 ||
    point.x > map.width ||
    point.y < 0 ||
    point.y > map.height
  ) {
    const key = `clamp-${point.x.toFixed(1)}-${point.y.toFixed(1)}`
    if (!S3M_LOCAL_OUT_OF_BOUNDS_WARNED.has(key)) {
      S3M_LOCAL_OUT_OF_BOUNDS_WARNED.add(key)
      // eslint-disable-next-line no-console
      console.warn('[F6] clampMapPoint 输入越界', {
        point,
        mapSize: { w: map.width, h: map.height },
      })
      pushDebugMessage(
        `交互落图坐标越界：(${point.x.toFixed(1)}, ${point.y.toFixed(1)}) 超出 [0,${map.width}]×[0,${map.height}]，已夹回边界`,
      )
    }
  }
  return {
    x: clamp(point.x, 0, map.width),
    y: clamp(point.y, 0, map.height),
  }
}

function emitSensorPick(sensor: ModelBoundMonitorSensor) {
  const sceneMapPoint = sensorSceneMapPoint(sensor)
  const geo = mapPointToGeo(sceneMapPoint, sensor.installationHeight)
  const sceneGeo = shouldUseThreeDTiles.value
    ? threeTilesMapPointToGeo(sceneMapPoint, sensor.installationHeight)
    : geo
  emit('scene-object-pick', {
    selectedObjectId: sensor.id,
    selectedObjectName: `监控点 ${sensor.id}`,
    projectedPoint: {
      x: geo.easting,
      y: geo.northing,
      easting: geo.easting,
      northing: geo.northing,
      epsg: 4547,
      coordSys: 'CGCS2000_3GK_CM_114E',
    },
    heightMeters: sensor.installationHeight,
    source: 'supermap-iclient3d-monitoring-sensor',
    rawProperties: {
      id: sensor.id,
      modelName: sensor.modelName,
      observedProps: sensor.observedProps,
      priority: sensor.priority,
      cgcs2000E: geo.easting,
      cgcs2000N: geo.northing,
      sceneLongitude: sceneGeo.longitude,
      sceneLatitude: sceneGeo.latitude,
      sceneAltitude: sceneGeo.altitude,
    },
  })
}

function resolvePickedSensor(picked: PickedFeature | undefined) {
  const entity =
    picked?.id && typeof picked.id === 'object'
      ? (picked.id as Record<string, unknown>)
      : null
  const sensorId = stringFromUnknown(
    entity?.superMapCupSensorId ||
      entity?.id ||
      valueFromProperties(
        collectPickProperties(picked || {}),
        'superMapCupSensorId',
        'id',
        'ID',
      ),
  )
  if (!sensorId) return null
  return sceneSensors.value.find((sensor) => sensor.id === sensorId) || null
}

function buildScenePickPayload(
  picked: PickedFeature | undefined,
  screenPosition?: unknown,
): SuperMapScenePickEventPayload | null {
  if (!picked) return null
  const entity =
    picked.id && typeof picked.id === 'object'
      ? (picked.id as Record<string, unknown>)
      : null
  const entityId = readEntityScalar(entity, 'id')
  const devicePointSensorId = readEntityScalar(entity, 'devicePointSensorId')
  const devicePointModelName = readEntityScalar(entity, 'devicePointModelName')
  const devicePointClusterCount = readEntityScalar(
    entity,
    'devicePointClusterCount',
  )
  const leakSourceModelSmId = readEntityScalar(entity, 'leakSourceModelSmId')
  const leakSourceModelName = readEntityScalar(entity, 'leakSourceModelName')
  const leakSourceId = readEntityScalar(entity, 'leakSourceId')
  const pickedProperties = {
    ...collectPickProperties(picked),
    ...(devicePointSensorId
      ? {
          SensorID: String(devicePointSensorId),
          ModelName: String(devicePointModelName ?? ''),
          ClusterCount: Number(devicePointClusterCount ?? 1),
        }
      : {}),
    ...(leakSourceModelSmId
      ? {
          SmID: Number(leakSourceModelSmId),
          ModelName: String(leakSourceModelName ?? ''),
          LeakSourceID: String(leakSourceId ?? ''),
        }
      : {}),
  }
  const pickedModelSmId = Number(
    valueFromProperties(pickedProperties, 'SmID', 'SMID') ?? picked.SmID,
  )
  const boundLeakSource = Number.isInteger(pickedModelSmId)
    ? LEAK_SOURCE_ANCHORS_4490.find(
        (source) => source.modelSmId === pickedModelSmId,
      )
    : null
  const boundEntrance = Number.isInteger(pickedModelSmId)
    ? ENTRANCE_ANCHORS_4490.find(
        (entrance) => entrance.modelSmId === pickedModelSmId,
      )
    : null
  const boundAsset = boundLeakSource || boundEntrance
  const rawProperties = {
    ...pickedProperties,
    ...(boundAsset
      ? {
          AssetId:
            boundLeakSource?.leakSourceId || boundEntrance?.entranceId || '',
          BindingRole: boundAsset.bindingRole,
          BindingMethod: boundAsset.bindingMethod,
          ModelDataset: boundAsset.modelDataset,
          ModelName: boundAsset.modelName,
          ModelSmID: boundAsset.modelSmId,
          ...(boundLeakSource
            ? {
                EquipmentType: boundLeakSource.equipmentType,
                SupportedGasCodes: boundLeakSource.supportedGasCodes.join(','),
              }
            : {
                RoadNodeId: boundEntrance?.roadNodeId || '',
              }),
        }
      : {}),
  }
  const rawId =
    valueFromProperties(rawProperties, 'SmID', 'id', 'ID', 'name') ??
    picked.SmID ??
    (devicePointSensorId
      ? `devicepoint-${String(devicePointSensorId)}`
      : (entityId ?? picked.id))
  if (rawId === undefined || rawId === null || rawId === '') return null
  const selectedObjectName = stringFromUnknown(
    valueFromProperties(rawProperties, 'ModelName'),
  )
  const scenePoint = screenPosition ? pickScenePoint(screenPosition) : null
  const sceneSnapshot =
    scenePoint && geographicSceneMode.value
      ? ecefPointToGisSnapshot(scenePoint)
      : null
  const projectedPoint = sceneSnapshot
    ? {
        x: sceneSnapshot.easting,
        y: sceneSnapshot.northing,
        easting: sceneSnapshot.easting,
        northing: sceneSnapshot.northing,
        epsg: 4547 as const,
        coordSys: 'CGCS2000_3GK_CM_114E' as const,
      }
    : resolveProjectedPoint(rawProperties)
  return {
    selectedObjectId: String(rawId),
    selectedObjectName: selectedObjectName || undefined,
    projectedPoint,
    heightMeters:
      numberFromUnknown(
        valueFromProperties(
          rawProperties,
          'heightMeters',
          'HEIGHT_METERS',
          'height',
          'HEIGHT',
          'z',
          'Z',
        ),
      ) ??
      sceneSnapshot?.altitude ??
      null,
    source: 'supermap-iclient3d-pick',
    rawProperties,
  }
}

async function buildEquipmentScenePickPayload(
  picked: PickedFeature | undefined,
  screenPosition?: unknown,
): Promise<SuperMapScenePickEventPayload | null> {
  const payload = buildScenePickPayload(picked, screenPosition)
  if (!payload) return null
  const rawComponentModelName = String(
    payload.rawProperties.ModelName ?? '',
  ).trim()
  const componentModelName = /^\d+$/.test(rawComponentModelName)
    ? ''
    : rawComponentModelName
  const componentSmId = Number(
    payload.rawProperties.SmID ??
      payload.rawProperties.ModelSmID ??
      payload.selectedObjectId,
  )
  let publishedModelName = ''
  let publishedModelAttributes: Awaited<
    ReturnType<typeof queryPublishedModelAttributesBySmId>
  > = null
  if (Number.isInteger(componentSmId)) {
    try {
      publishedModelAttributes =
        await queryPublishedModelAttributesBySmId(componentSmId)
      publishedModelName = publishedModelAttributes?.modelName || ''
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : '最新模型 ModelName 查询失败',
      )
    }
  }
  const normalizedPayload = publishedModelName
    ? {
        ...payload,
        selectedObjectName: publishedModelName,
        rawProperties: {
          ...payload.rawProperties,
          ModelName: publishedModelName,
          ComponentID: publishedModelAttributes?.componentId || '',
          AssetID: publishedModelAttributes?.assetId || '',
          DeviceID: publishedModelAttributes?.deviceId || '',
          DeviceName: publishedModelAttributes?.deviceName || '',
          DeviceType: publishedModelAttributes?.deviceType || '',
          PickedSmID: componentSmId,
        },
      }
    : payload
  if (!componentModelName && !Number.isInteger(componentSmId)) {
    clearEquipmentHighlight()
    return normalizedPayload
  }

  let assembly: EquipmentAssembly | null = null
  try {
    assembly = componentModelName
      ? await queryEquipmentAssemblyByModelName(componentModelName)
      : await queryEquipmentAssemblyBySmId(componentSmId)
  } catch (error) {
    pushDebugMessage(
      error instanceof Error ? error.message : '设备聚合索引查询失败',
    )
  }
  if (!assembly) {
    clearEquipmentHighlight()
    return normalizedPayload
  }
  const authoritativeModelName =
    publishedModelName || componentModelName || assembly.selectedModelName

  try {
    highlightEquipmentAssembly(assembly.componentSmIds)
    const boundLeakSourceIds = LEAK_SOURCE_ANCHORS_4490.filter((source) =>
      assembly.componentSmIds.includes(source.modelSmId),
    ).map((source) => source.leakSourceId)

    return {
      ...normalizedPayload,
      selectedObjectId: assembly.equipmentId,
      // 用户在 iDesktop 的 ModelName 字段中维护正式设备名称；聚合仅用于
      // 高亮关联组件，不能用邻近主体的推导名称覆盖被点击模型的名称。
      selectedObjectName: authoritativeModelName,
      heightMeters: normalizedPayload.heightMeters ?? assembly.maxHeightMeters,
      rawProperties: {
        ...normalizedPayload.rawProperties,
        // 部分 S3M 3.01 拾取结果只返回 SmID；查回索引后把用户维护的
        // 正式名称统一归一到 ModelName，供弹窗和监控点关联共同使用。
        ModelName: authoritativeModelName,
        EquipmentID: assembly.equipmentId,
        EquipmentType: assembly.equipmentType,
        EquipmentBindingMethod: assembly.bindingMethod,
        PrimaryModelName: assembly.primaryModelName,
        PrimarySmID: assembly.primarySmId,
        ComponentModelName: authoritativeModelName,
        ComponentSmID: assembly.selectedSmId,
        ComponentCount: assembly.componentCount,
        ComponentSmIDs: assembly.componentSmIds.join(','),
        LeakSourceIds: boundLeakSourceIds.join(','),
      },
    }
  } catch (error) {
    pushDebugMessage(
      error instanceof Error ? error.message : '设备组件高亮与信息组装失败',
    )
    return normalizedPayload
  }
}

function sceneS3MObjectLayers(): Array<Record<string, unknown>> {
  const layers = viewer.value?.scene.layers as
    | {
        get?: (index: number) => unknown
        length?: number
        layerQueue?: unknown
        _layers?: unknown
      }
    | undefined
  const candidates: unknown[] = [...s3mLayers.value]
  const layerCount = Number(layers?.length ?? 0)
  if (layers?.get && Number.isFinite(layerCount)) {
    for (let index = 0; index < layerCount; index += 1) {
      candidates.push(layers.get(index))
    }
  }
  candidates.push(
    ...getSceneLayerCollectionValues(layers?.layerQueue),
    ...getSceneLayerCollectionValues(layers?._layers),
  )
  return Array.from(
    new Set(
      candidates.filter(
        (layer): layer is Record<string, unknown> =>
          Boolean(layer) && typeof layer === 'object',
      ),
    ),
  ).filter((layer) => typeof layer.setObjsColor === 'function')
}

function clearEquipmentHighlight() {
  if (!selectedEquipmentSmIds.value.length) return
  const smIds = [...selectedEquipmentSmIds.value]
  sceneS3MObjectLayers().forEach((layer) => {
    const removeObjsColor = layer.removeObjsColor
    if (typeof removeObjsColor !== 'function') return
    try {
      removeObjsColor.call(layer, smIds)
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : '清除设备组件高亮失败',
      )
    }
  })
  selectedEquipmentSmIds.value = []
  requestSceneRender()
}

function highlightEquipmentAssembly(componentSmIds: number[]) {
  clearEquipmentHighlight()
  const uniqueSmIds = Array.from(
    new Set(
      componentSmIds.filter((smId) => Number.isInteger(smId) && smId > 0),
    ),
  ).slice(0, 160)
  if (!uniqueSmIds.length) return
  const highlightColor = colorFromCss('#35d2ff', 0.82)
  sceneS3MObjectLayers().forEach((layer) => {
    const setObjsColor = layer.setObjsColor
    if (typeof setObjsColor !== 'function') return
    try {
      setObjsColor.call(layer, uniqueSmIds, highlightColor)
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : '设备组件整组高亮失败',
      )
    }
  })
  selectedEquipmentSmIds.value = uniqueSmIds
  requestSceneRender()
}

function readEntityScalar(
  entity: Record<string, unknown> | null,
  field: string,
): string | number | boolean | null {
  if (!entity) return null
  const value = entity[field]
  if (value === null) return null
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (!value || typeof value !== 'object') return null
  const getValue = (value as Record<string, unknown>).getValue
  if (typeof getValue !== 'function') return null
  try {
    const resolved = getValue.call(value)
    return resolved === null ||
      typeof resolved === 'string' ||
      typeof resolved === 'number' ||
      typeof resolved === 'boolean'
      ? resolved
      : null
  } catch {
    return null
  }
}

function collectPickProperties(picked: PickedFeature) {
  const fields = [
    'SmID',
    'ModelName',
    'id',
    'ID',
    'name',
    'NAME',
    'label',
    'LABEL',
    'cgcs2000E',
    'cgcs2000N',
    'CGCS2000E',
    'CGCS2000N',
    'easting',
    'northing',
    'EASTING',
    'NORTHING',
    'heightMeters',
    'HEIGHT_METERS',
    'height',
    'HEIGHT',
    'z',
    'Z',
  ]
  const getters = [
    picked.getProperty?.bind(picked),
    picked.primitive?.getProperty?.bind(picked.primitive),
  ].filter((getter): getter is (name: string) => unknown => Boolean(getter))
  const properties: Record<string, string | number | boolean | null> = {}
  fields.forEach((field) => {
    const direct = (picked as Record<string, unknown>)[field]
    const value =
      direct ??
      getters
        .map((getter) => getter(field))
        .find((item) => item !== undefined && item !== null)
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      properties[field] = value as string | number | boolean | null
    }
  })
  return properties
}

function resolveProjectedPoint(
  properties: Record<string, string | number | boolean | null>,
): SuperMapProjectedPoint4547 | null {
  const easting = numberFromUnknown(
    valueFromProperties(
      properties,
      'cgcs2000E',
      'CGCS2000E',
      'easting',
      'EASTING',
    ),
  )
  const northing = numberFromUnknown(
    valueFromProperties(
      properties,
      'cgcs2000N',
      'CGCS2000N',
      'northing',
      'NORTHING',
    ),
  )
  if (easting === null || northing === null) return null
  return {
    x: easting,
    y: northing,
    easting,
    northing,
    epsg: 4547,
    coordSys: 'CGCS2000_3GK_CM_114E',
  }
}

async function loadSuperMapRuntime() {
  const errors: string[] = []
  let styleLoaded = false
  for (const styleUrl of runtimeStyleCandidates.value) {
    try {
      await loadCss(styleUrl)
      styleLoaded = true
      break
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `SuperMap 样式加载失败：${styleUrl}`,
      )
    }
  }
  if (!styleLoaded) {
    pushDebugMessage(
      `SuperMap 样式候选均未加载，将继续尝试注入 SDK：${errors.slice(-2).join('；')}`,
    )
  }
  const existingRuntime = getRuntime()
  if (existingRuntime) return existingRuntime
  for (const scriptUrl of runtimeScriptCandidates.value) {
    try {
      await loadScript(scriptUrl)
      pushDebugSdkScript(scriptUrl)
      const runtime = await waitForRuntime(2500)
      if (runtime) return runtime
      errors.push(`SuperMap SDK 已加载但未暴露 Viewer：${scriptUrl}`)
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : `SuperMap SDK 加载失败：${scriptUrl}`,
      )
    }
  }
  throw new Error(
    `SuperMap iClient3D WebGL SDK 未成功注入；${errors.slice(-3).join('；')}`,
  )
}

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link')
    link.dataset.supermapSceneDynamic = 'true'
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => {
      link.remove()
      reject(new Error(`SuperMap 样式加载失败：${href}`))
    }
    document.head.appendChild(link)
  })
}

function loadScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    let settled = false
    const script = document.createElement('script')
    script.dataset.supermapSceneDynamic = 'true'
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      script.remove()
      reject(new Error(`SuperMap SDK 加载超时：${src}`))
    }, 30000)
    script.src = src
    script.async = true
    script.onload = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      script.remove()
      reject(new Error(`SuperMap SDK 加载失败：${src}`))
    }
    document.head.appendChild(script)
  })
}

function getRuntime() {
  const candidates = [window.SuperMap3D, window.Cesium, window.SuperMap]
  return (
    candidates.find((runtime): runtime is SuperMapRuntime =>
      isUsableSuperMapRuntime(runtime),
    ) || null
  )
}

function describeRuntime(runtime: SuperMapRuntime | null) {
  if (!runtime) return 'none'
  if (runtime === window.SuperMap3D) return 'SuperMap3D'
  if (runtime === window.Cesium) return 'Cesium'
  if (runtime === window.SuperMap) return 'SuperMap'
  return 'unknown'
}

function updateDebugState(runtime: SuperMapRuntime | null) {
  if (!import.meta.env.DEV) return
  window.__supermapCupDebug = {
    ...(window.__supermapCupDebug || {}),
    runtimeName: describeRuntime(runtime),
    viewer: viewer.value,
    layerPosition: s3mLayerPosition.value,
    layers: window.__supermapCupDebug?.layers || [],
    messages: window.__supermapCupDebug?.messages || [],
    sdkScripts: window.__supermapCupDebug?.sdkScripts || [],
    focusScene,
    flyToSensor,
    runDiffusionDemo,
    runParticleDemo,
    runEvacuationDemo,
    startLeakSourceSelection,
    startEvacuationStartSelection,
    focusEntrance: selectEvacuationExit,
    getEvacuationResult: () => evacuationResult.value,
    clearAlgorithmOverlays,
  }
}

function pushDebugLayer(layer: unknown) {
  if (!import.meta.env.DEV) return
  const debug = window.__supermapCupDebug || { layers: [], messages: [] }
  debug.layers = [...(debug.layers || []), layer]
  window.__supermapCupDebug = debug
}

function pushDebugMessage(message: string) {
  if (!import.meta.env.DEV) return
  const debug = window.__supermapCupDebug || { layers: [], messages: [] }
  debug.messages = [...(debug.messages || []), message]
  window.__supermapCupDebug = debug
}

function pushDebugSdkScript(scriptUrl: string) {
  if (!import.meta.env.DEV) return
  const debug = window.__supermapCupDebug || {
    layers: [],
    messages: [],
    sdkScripts: [],
  }
  debug.sdkScripts = [...(debug.sdkScripts || []), scriptUrl]
  window.__supermapCupDebug = debug
}

function setupLocalSceneInteractionGuard(runtime: SuperMapRuntime) {
  clearLocalSceneInteractionGuard()
  enableFreeSceneInteraction()
  if (geographicSceneMode.value) return

  const captureStableCamera = () => {
    const snapshot = readLocalCameraSnapshot()
    if (!snapshot) return
    localCameraAnchor ||= snapshot
    lastStableLocalCamera.value = snapshot
  }

  const currentViewer = viewer.value
  scheduleSceneTimeout(currentViewer, captureStableCamera, 800)
  scheduleSceneTimeout(currentViewer, captureStableCamera, 2200)
  localCameraGuardTimer = window.setInterval(() => {
    if (localCameraGuardRecovering) return
    const snapshot = readLocalCameraSnapshot()
    if (!snapshot) return
    if (!localCameraAnchor) {
      localCameraAnchor = snapshot
      lastStableLocalCamera.value = snapshot
      return
    }
    if (isLocalCameraSafe(snapshot)) {
      lastStableLocalCamera.value = snapshot
      return
    }
    const now = window.performance.now()
    if (now - localCameraLastRecoveryAt < 700) return
    localCameraLastRecoveryAt = now
    restoreLocalSceneCamera(
      runtime,
      lastStableLocalCamera.value || localCameraAnchor,
    )
  }, LOCAL_CAMERA_SAFETY_CHECK_MS)
}

function enableFreeSceneInteraction() {
  clearLocalSceneInteractionGuard()
  const controller = viewer.value?.scene?.screenSpaceCameraController
  if (!controller) return
  const runtime = getRuntime()
  const zoomPolicy = resolveCameraZoomPolicy(
    scenePresentationMode.value,
    runtime?.CameraEventType?.WHEEL,
  )
  controller.enableInputs = true
  controller.minimumZoomDistance = geographicSceneMode.value ? 35 : 0.05
  controller.maximumZoomDistance = geographicSceneMode.value ? 12000 : 4200
  controller.enableCollisionDetection = false
  controller.enableRotate = true
  controller.enableTranslate = true
  controller.enableTilt = true
  controller.enableLook = true
  controller.enableZoom = zoomPolicy.enableZoom
  if (!geographicSceneMode.value) {
    controller.rotateEventTypes = runtime?.CameraEventType?.LEFT_DRAG
    controller.lookEventTypes = undefined
    controller.tiltEventTypes = [
      runtime?.CameraEventType?.RIGHT_DRAG,
      runtime?.CameraEventType?.MIDDLE_DRAG,
    ].filter((value) => value !== undefined)
    controller.zoomEventTypes = zoomPolicy.zoomEventTypes
    if (!zoomPolicy.enableZoom) setupLocalSceneDomGuard()
  }
  controller.inertiaSpin = 0.18
  controller.inertiaTranslate = 0.18
  controller.inertiaZoom = 0.08
}

function clearLocalSceneInteractionGuard() {
  if (localCameraGuardTimer !== undefined) {
    window.clearInterval(localCameraGuardTimer)
    localCameraGuardTimer = undefined
  }
  localSceneDomGuardCleanup?.()
  localSceneDomGuardCleanup = null
  localCameraAnchor = null
  localCameraLastRecoveryAt = 0
  localCameraGuardRecovering = false
}

function setupLocalSceneDomGuard() {
  localSceneDomGuardCleanup?.()
  localSceneDomGuardCleanup = null
  if (geographicSceneMode.value) return
  const canvas = viewer.value?.scene?.canvas
  if (!canvas) return
  const handleWheel = (event: WheelEvent) => {
    const currentViewer = viewer.value
    const camera = currentViewer?.scene?.camera || currentViewer?.camera
    if (!camera) return
    event.preventDefault()
    event.stopPropagation()
    const isZoomingIn = event.deltaY < 0
    const cameraPosition = vectorFrom(camera.position || camera.positionWC)
    const focusDistanceMeters =
      cameraPosition && localSceneFocusTarget
        ? vectorDistance(cameraPosition, localSceneFocusTarget)
        : null
    const amount =
      isZoomingIn && focusDistanceMeters !== null
        ? resolveLocalSceneWheelZoomAmount(
            event.deltaY,
            focusDistanceMeters,
            localSceneMinimumFocusDistanceMeters,
          )
        : clamp(Math.abs(event.deltaY) * 0.03, 0.25, 18)
    if (amount <= 0) return
    if (isZoomingIn) camera.moveForward?.(amount)
    else camera.moveBackward?.(amount)
    const snapshot = readLocalCameraSnapshot()
    if (snapshot) lastStableLocalCamera.value = snapshot
  }
  canvas.addEventListener('wheel', handleWheel, {
    passive: false,
    capture: true,
  })
  localSceneDomGuardCleanup = () => {
    canvas.removeEventListener('wheel', handleWheel, { capture: true })
  }
}

function readLocalCameraSnapshot(): LocalCameraSnapshot | null {
  const currentViewer = viewer.value
  const camera = currentViewer?.scene?.camera || currentViewer?.camera
  const position = vectorFrom(camera?.position || camera?.positionWC)
  if (!position) return null
  const direction = vectorFrom(camera?.direction)
  const up = vectorFrom(camera?.up)
  return {
    position,
    direction: direction || undefined,
    up: up || undefined,
    coordinateSpace:
      scenePresentationMode.value === 'local-s3m' ? 'local-s3m' : 'ecef',
  }
}

function isCameraSnapshotCompatible(snapshot: LocalCameraSnapshot) {
  const { x, y, z } = snapshot.position
  if (![x, y, z].every(Number.isFinite)) return false
  const magnitude = Math.hypot(x, y, z)
  const expectedSpace =
    scenePresentationMode.value === 'local-s3m' ? 'local-s3m' : 'ecef'
  if (snapshot.coordinateSpace && snapshot.coordinateSpace !== expectedSpace) {
    return false
  }
  // 旧版视角没有 coordinateSpace，使用数量级迁移判断：
  // ECEF 相机约为地球半径，EPSG:0 S3M 相机则是局部米制。
  return expectedSpace === 'ecef'
    ? magnitude >= 5_500_000 && magnitude <= 8_000_000
    : magnitude < 1_000_000
}

function vectorFrom(
  value: Vector3Like | undefined,
): { x: number; y: number; z: number } | null {
  const x = Number(value?.x)
  const y = Number(value?.y)
  const z = Number(value?.z)
  if (![x, y, z].every(Number.isFinite)) return null
  return { x, y, z }
}

function isLocalCameraOutOfScene(snapshot: LocalCameraSnapshot) {
  const { x, y, z } = snapshot.position
  return (
    x < LOCAL_S3M_BOUNDS.left - LOCAL_CAMERA_GUARD_MARGIN ||
    x > LOCAL_S3M_BOUNDS.right + LOCAL_CAMERA_GUARD_MARGIN ||
    y < LOCAL_S3M_BOUNDS.bottom - LOCAL_CAMERA_GUARD_MARGIN ||
    y > LOCAL_S3M_BOUNDS.top + LOCAL_CAMERA_GUARD_MARGIN ||
    z < LOCAL_CAMERA_MIN_HEIGHT ||
    z > LOCAL_CAMERA_MAX_HEIGHT
  )
}

function isLocalCameraSafe(snapshot: LocalCameraSnapshot) {
  if (!localCameraAnchor) return true
  if (isLocalCameraOutOfScene(snapshot)) return false
  if (!snapshot.direction || !snapshot.up) return false
  const drift = vectorDistance(snapshot.position, localCameraAnchor.position)
  return Number.isFinite(drift) && drift <= LOCAL_CAMERA_MAX_WORLD_DRIFT
}

function vectorDistance(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  const dx = left.x - right.x
  const dy = left.y - right.y
  const dz = left.z - right.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function addVector(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
    z: left.z + right.z,
  }
}

function subtractVector(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
    z: left.z - right.z,
  }
}

function scaleVector(
  value: { x: number; y: number; z: number },
  scale: number,
) {
  return {
    x: value.x * scale,
    y: value.y * scale,
    z: value.z * scale,
  }
}

function crossVector(
  left: { x: number; y: number; z: number },
  right: { x: number; y: number; z: number },
) {
  return {
    x: left.y * right.z - left.z * right.y,
    y: left.z * right.x - left.x * right.z,
    z: left.x * right.y - left.y * right.x,
  }
}

function enuBasis(longitude: number, latitude: number) {
  const longitudeRad = (longitude * Math.PI) / 180
  const latitudeRad = (latitude * Math.PI) / 180
  const sinLongitude = Math.sin(longitudeRad)
  const cosLongitude = Math.cos(longitudeRad)
  const sinLatitude = Math.sin(latitudeRad)
  const cosLatitude = Math.cos(latitudeRad)
  const north = {
    x: -sinLatitude * cosLongitude,
    y: -sinLatitude * sinLongitude,
    z: cosLatitude,
  }
  return {
    east: {
      x: -sinLongitude,
      y: cosLongitude,
      z: 0,
    },
    north,
    south: scaleVector(north, -1),
    up: {
      x: cosLatitude * cosLongitude,
      y: cosLatitude * sinLongitude,
      z: sinLatitude,
    },
  }
}

function normalizeVector(value: { x: number; y: number; z: number }) {
  const length = Math.sqrt(
    value.x * value.x + value.y * value.y + value.z * value.z,
  )
  if (!Number.isFinite(length) || length <= 0.000001) return null
  return {
    x: value.x / length,
    y: value.y / length,
    z: value.z / length,
  }
}

function restoreLocalSceneCamera(
  runtime: SuperMapRuntime,
  snapshot: LocalCameraSnapshot | null,
) {
  const currentViewer = viewer.value
  if (!runtime.Cartesian3 || !currentViewer || !snapshot) return false
  localCameraGuardRecovering = true
  const view = createLocalS3MCameraView(
    snapshot,
    (x, y, z) => new runtime.Cartesian3(x, y, z),
  )
  currentViewer.scene.camera?.setView?.(view)
  currentViewer.camera?.setView?.(view)
  scheduleSceneTimeout(
    currentViewer,
    () => {
      localCameraGuardRecovering = false
    },
    260,
  )
  return true
}

function applyLocalDefaultCamera(runtime: SuperMapRuntime) {
  lastStableLocalCamera.value = LOCAL_S3M_DEFAULT_CAMERA
  return restoreLocalSceneCamera(runtime, LOCAL_S3M_DEFAULT_CAMERA)
}

function waitForRuntime(timeoutMs = 6000) {
  const existing = getRuntime()
  if (existing) return Promise.resolve(existing)
  const startedAt = window.performance.now()
  return new Promise<SuperMapRuntime | null>((resolve) => {
    const timer = window.setInterval(() => {
      const runtime = getRuntime()
      if (runtime) {
        window.clearInterval(timer)
        resolve(runtime)
        return
      }
      if (window.performance.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer)
        resolve(null)
      }
    }, 80)
  })
}

function destroyScene() {
  invalidatePendingWork()
  clearPendingTimeouts()
  clearGisCoordinateReadout()
  clearLocalSceneInteractionGuard()
  clearAlgorithmOverlays(false)
  clearSceneContext()
  destroyNativeViewer()
  loadedLayers.value = []
  primaryS3MLayer.value = null
  s3mLayers.value = []
  threeTilesPrimitive.value = null
  lastStableLocalCamera.value = null
  localSceneFocusTarget = null
  localSceneMinimumFocusDistanceMeters = 0.08
  // 场景销毁时清空越界告警去重集，避免切换/重载场景后告警历史无限累积。
  S3M_LOCAL_OUT_OF_BOUNDS_WARNED.clear()
  delete window.__supermapCupDebug
}

function scheduleSceneTimeout(
  expectedViewer: SuperMapViewer | null,
  callback: () => void,
  delayMs: number,
) {
  const timeoutId = window.setTimeout(() => {
    pendingTimeouts.delete(timeoutId)
    if (componentDestroyed || viewer.value !== expectedViewer) return
    callback()
  }, delayMs)
  pendingTimeouts.add(timeoutId)
  return timeoutId
}

function pumpSceneRenderDuringCameraFlight(
  expectedViewer: SuperMapViewer | null,
  durationMs: number,
) {
  const startedAtMs = window.performance.now()
  const renderNextFrame = () => {
    if (componentDestroyed || viewer.value !== expectedViewer) return
    requestSceneRender()
    if (window.performance.now() - startedAtMs < durationMs) {
      scheduleSceneTimeout(expectedViewer, renderNextFrame, 16)
    }
  }
  renderNextFrame()
}

function clearPendingTimeouts() {
  pendingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
  pendingTimeouts.clear()
}

function destroyNativeViewer() {
  const currentViewer = viewer.value
  const currentClickHandler = clickHandler.value
  clickHandler.value = null
  viewer.value = null
  try {
    currentClickHandler?.destroy()
  } catch (error) {
    console.warn(
      '[SuperMap] Click handler destroy failed; continuing fallback cleanup.',
      error,
    )
  }
  try {
    currentViewer?.destroy?.()
  } catch (error) {
    console.warn(
      '[SuperMap] Viewer destroy failed; continuing fallback cleanup.',
      error,
    )
  } finally {
    if (window.__supermapCupDebug) {
      window.__supermapCupDebug.viewer = null
    }
    // Removes the Cesium Viewer subtree, including every canvas left by a partial bootstrap.
    sceneContainer.value?.replaceChildren()
  }
  overlayEntityGroups.value = {
    diffusion: [],
    particle: [],
    evacuation: [],
    'closest-facility': [],
    'temporary-selection': [],
  }
  sceneContextEntities.value = []
}

function clearSceneContext() {
  const entities = viewer.value?.entities
  if (entities) {
    sceneContextEntities.value.forEach((entity) => entities.remove(entity))
  }
  sceneContextEntities.value = []
  requestSceneRender()
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function resolveLayerName(url: string, index: number) {
  const parts = decodeURIComponent(url).split('/').filter(Boolean)
  const serviceIndex = parts.findIndex((item) => item === 'services')
  const serviceName =
    serviceIndex >= 0 && parts[serviceIndex + 1] ? parts[serviceIndex + 1] : ''
  const dataIndex = parts.findIndex((item) => item === 'datas')
  const dataName =
    dataIndex >= 0 && parts[dataIndex + 1] ? parts[dataIndex + 1] : `S3M图层`
  return `${serviceName || dataName}_${index + 1}`
}

function parseCamera(rawValue?: string) {
  if (!rawValue) return DEFAULT_CAMERA
  const values = rawValue.split(',').map((item) => Number(item.trim()))
  if (values.length < 3 || values.some((item) => Number.isNaN(item))) {
    return DEFAULT_CAMERA
  }
  if (!isValidGeoCoordinate(values[0], values[1])) {
    return DEFAULT_CAMERA
  }
  return {
    longitude: values[0],
    latitude: values[1],
    height: values[2],
    heading: values[3] ?? DEFAULT_CAMERA.heading,
    pitch: values[4] ?? DEFAULT_CAMERA.pitch,
    roll: values[5] ?? DEFAULT_CAMERA.roll,
  }
}

function parseGeoPosition(rawValue?: string) {
  const defaultPosition = SUPERMAP_CUP_SCENARIO.sceneCenterGeoPoint
  const fallback = {
    longitude: defaultPosition.longitude,
    latitude: defaultPosition.latitude,
    height: defaultPosition.altitude,
  }
  if (!rawValue) return fallback
  const values = rawValue.split(',').map((item) => Number(item.trim()))
  if (
    values.length < 2 ||
    values.some((item) => Number.isNaN(item)) ||
    !isValidGeoCoordinate(values[0], values[1])
  ) {
    return fallback
  }
  return {
    longitude: values[0],
    latitude: values[1],
    height: values[2] ?? defaultPosition.altitude,
  }
}

function isValidGeoCoordinate(longitude: number, latitude: number) {
  return (
    longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
  )
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timer: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) window.clearTimeout(timer)
  })
}

function wait(timeoutMs: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs))
}

async function flyToPrimaryLayer() {
  const layer = primaryS3MLayer.value
  const runtime = getRuntime()
  if (geographicSceneMode.value && runtime) {
    setDefaultCamera(runtime)
    return
  }
  if (layer && (await flyToS3MLayer(layer))) return
  const currentViewer = viewer.value
  if (!geographicSceneMode.value || !runtime?.Cartesian3 || !currentViewer)
    return
  setDefaultCamera(runtime)
}

function removeActiveSceneLayers(currentViewer: SuperMapViewer) {
  s3mLayers.value.forEach((layer) => {
    try {
      if (!removeSceneLayer(currentViewer, layer)) {
        pushDebugMessage('旧 S3M 图层未出现在场景集合中')
      }
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : '移除旧 S3M 图层失败',
      )
    }
  })
  if (threeTilesPrimitive.value) {
    try {
      currentViewer.scene.primitives?.remove?.(threeTilesPrimitive.value)
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : '移除旧 3D Tiles 图层失败',
      )
    }
  }
  primaryS3MLayer.value = null
  s3mLayers.value = []
  threeTilesPrimitive.value = null
  loadedLayers.value = []
}

function configureExistingViewerPresentation(
  runtime: SuperMapRuntime,
  currentViewer: SuperMapViewer,
) {
  const currentScene = currentViewer.scene
  const projection = resolveSceneProjection(
    scenePresentationMode.value,
    shouldUseThreeDTiles.value,
  )
  const targetSceneMode =
    projection.mode === 'columbus'
      ? runtime.SceneMode?.COLUMBUS_VIEW
      : runtime.SceneMode?.SCENE3D
  if (targetSceneMode !== undefined && currentScene.mode !== targetSceneMode) {
    // EPSG:0 的六个独立缓存只能在无地球平面模式下解释其米制根瓦片。
    // 必须在 addS3MTilesLayerByScp 之前切换；加载后再切换会让 SDK
    // 按地心坐标初始化边界，出现瓦片请求成功但画面空白。
    currentScene.mode = targetSceneMode
  }
  sceneProjectionMode.value = projection.mode === 'columbus' ? '2d' : '3d'
  if (currentScene.globe) {
    currentScene.globe.show = geographicSceneMode.value
    currentScene.globe.enableLighting = false
    currentScene.globe.depthTestAgainstTerrain = false
    currentScene.globe.baseColor = colorFromCss(
      geographicSceneMode.value ? '#74865a' : '#142033',
      1,
    )
  }
  if (currentScene.skyAtmosphere)
    currentScene.skyAtmosphere.show = geographicSceneMode.value
  const sceneRecord = currentScene as Record<string, unknown>
  if (sceneRecord.skyBox && typeof sceneRecord.skyBox === 'object') {
    ;(sceneRecord.skyBox as Record<string, unknown>).show =
      geographicSceneMode.value
  }
  if ('requestRenderMode' in currentScene) {
    sceneRecord.requestRenderMode = shouldUseThreeDTiles.value
    sceneRecord.maximumRenderTimeChange = shouldUseThreeDTiles.value
      ? Infinity
      : 0
  }
  const imageryLayers =
    currentViewer.imageryLayers || currentScene.imageryLayers
  imageryLayers?.removeAll?.()
  if (geographicSceneMode.value) installEarthImagery(runtime, currentViewer)
  configureCloseRangeSceneStability(currentViewer)
  if (!geographicSceneMode.value) applyLocalDefaultCamera(runtime)
  enableFreeSceneInteraction()
  requestSceneRender()
}

async function switchSceneInExistingViewer(): Promise<boolean> {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime || !currentViewer) {
    await bootstrapScene()
    return sceneState.value === 'ready'
  }

  const generation = ++sceneGeneration
  activeDemoTaskId += 1
  enterNativeLoading(sceneMessage.value)
  clearPendingTimeouts()
  clearAlgorithmOverlays(false)
  clearSceneContext()
  resetSceneExplode()
  removeActiveSceneLayers(currentViewer)
  configureExistingViewerPresentation(runtime, currentViewer)
  updateDebugState(runtime)

  try {
    const sceneLoad = await openScene(runtime)
    if (!isSceneGenerationActive(generation)) return false
    if (!sceneLoad.loaded || sceneLoad.layerCount < 1) {
      throw new Error('目标三维场景未返回任何可显示图层')
    }
    if (sceneLoad.source === 'realspace') {
      setDefaultCamera(runtime)
      requestSceneRender()
      scheduleSceneTimeout(
        currentViewer,
        () => {
          setDefaultCamera(runtime)
          requestSceneRender()
        },
        1800,
      )
    }
    if (shouldUseThreeDTiles.value) {
      setThreeTilesEarthArrivalStart(runtime)
      scheduleSceneTimeout(
        currentViewer,
        () => {
          void focusThreeTilesOverview(runtime, true)
        },
        520,
      )
    } else {
      captureRealspaceCameraSnapshot()
    }
    enterNativeReady(sceneMessage.value)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : '场景切换失败'
    sceneMessage.value = message
    pushDebugMessage(message)
    return false
  }
}

async function focusS3MLayer(index: number) {
  const definition = getSceneDefinition(index)
  const layerName =
    definition?.name || resolveLayerName(layerConfigs.value[index] || '', index)
  const configUrl = definition?.configUrl || layerConfigs.value[index]
  if (!configUrl || !definition) {
    sceneMessage.value = `未找到 ${layerName} 的结构化 EPSG:4490 场景配置。`
    return
  }

  if (index === 0) return switchToParkScene()
  if (activeSceneSwitchIndex !== null) return
  const currentViewer = viewer.value
  if (!currentViewer) {
    sceneMessage.value = '三维场景正在初始化，请稍后选择独立场景'
    return
  }
  activeSceneSwitchIndex = index
  const transactionController = new AbortController()
  activeSceneSwitchController = transactionController
  const generation = ++sceneGeneration
  try {
    const candidates = [
      { url: definition.configUrl, source: '本地 iServer' },
      ...(definition.localConfigUrl
        ? [{ url: definition.localConfigUrl, source: '本地缓存' }]
        : []),
    ]
    let lastError: unknown = null
    for (const candidate of candidates) {
      try {
        sceneMessage.value = `正在预检 ${layerName} ${candidate.source}资源…`
        await preflightSceneDefinition(
          definition,
          candidate.url,
          transactionController.signal,
        )
        assertSceneTransactionActive(generation, currentViewer)
        sceneMessage.value = `正在进入 ${layerName} 独立 S3M 场景…`
        await stageAndCommitS3MScene(
          index,
          definition,
          candidate.url,
          generation,
          currentViewer,
          transactionController.signal,
        )
        assertSceneTransactionActive(generation, currentViewer)
        if (candidate.source === '本地缓存') {
          sceneMessage.value = `${layerName} 已使用本地 SCP 静态缓存（iServer 服务不可用）`
          pushDebugMessage(sceneMessage.value)
        }
        return
      } catch (error) {
        if (isSceneTransactionCancelled(error)) throw error
        lastError = error
        pushDebugMessage(
          `${layerName} ${candidate.source}资源加载失败：${
            error instanceof Error ? error.message : String(error)
          }`,
        )
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(`${layerName} 本地 iServer 与静态缓存均不可用`)
  } catch (error) {
    if (isSceneTransactionCancelled(error)) return
    sceneMessage.value =
      error instanceof Error
        ? error.message
        : `${layerName} 资源预检失败，主场景保持不变`
    pushDebugMessage(sceneMessage.value)
  } finally {
    transactionController.abort()
    if (activeSceneSwitchController === transactionController)
      activeSceneSwitchController = null
    if (activeSceneSwitchIndex === index) activeSceneSwitchIndex = null
  }
}

async function stageAndCommitS3MScene(
  index: number,
  definition: (typeof SCENE_DEFINITIONS)[number],
  configUrl: string,
  generation: number,
  currentViewer: SuperMapViewer,
  transactionSignal: AbortSignal,
) {
  const runtime = getRuntime()
  const addLayer = currentViewer?.scene.addS3MTilesLayerByScp
  if (!runtime || !currentViewer || !addLayer) {
    throw new Error('当前 Viewer 不支持原子加载 S3M 场景，主场景保持不变')
  }
  assertSceneTransactionActive(generation, currentViewer)
  resetSceneExplode()

  const previousSceneLayers = collectCurrentSceneLayers(currentViewer)
  const stagedLayerName = createStagedSceneLayerName(definition.id, generation)
  const previousMode = scenePresentationMode.value
  const previousIndex = activeS3MLayerIndex.value
  let candidateLayer: unknown = null
  let candidateLayerResultMonitor: PromiseSettlementMonitor<unknown> | null =
    null
  let candidateReadyMonitor: PromiseSettlementMonitor<unknown> | null = null
  try {
    scenePresentationMode.value = 'local-s3m'
    activeS3MLayerIndex.value = index
    configureExistingViewerPresentation(runtime, currentViewer)
    const layerOutcome = await addS3MLayerWithCollectionFallback(
      currentViewer,
      configUrl,
      {
        name: stagedLayerName,
        autoSetView: false,
      },
      previousSceneLayers,
      stagedLayerName,
      definition.name,
      transactionSignal,
    )
    candidateLayer = layerOutcome.layer
    candidateLayerResultMonitor = layerOutcome.layerResultMonitor
    assertSceneTransactionActive(generation, currentViewer)
    if (!candidateLayer) {
      throw new Error(`${definition.name} 未返回有效 S3M 图层对象`)
    }
    applyS3MLayerLodConfig(candidateLayer)
    candidateReadyMonitor = await waitForS3MLayerRenderable(
      currentViewer,
      candidateLayer,
      definition.name,
      candidateLayerResultMonitor,
      transactionSignal,
    )
    assertSceneTransactionActive(generation, currentViewer)
  } catch (error) {
    scenePresentationMode.value = previousMode
    activeS3MLayerIndex.value = previousIndex
    if (candidateLayer) removeSceneLayer(currentViewer, candidateLayer)
    configureExistingViewerPresentation(runtime, currentViewer)
    throw error
  }

  const previousThreeTiles = threeTilesPrimitive.value
  try {
    if (!focusSceneDefinitionTarget(definition)) {
      const didFocusLayer = await focusLocalS3MLayer(candidateLayer, configUrl)
      assertSceneTransactionActive(generation, currentViewer)
      if (!didFocusLayer) {
        throw new Error(`${definition.name} 近景相机定位失败，主场景保持不变`)
      }
    }
    assertSceneTransactionActive(generation, currentViewer)
    throwIfPromiseRejected(candidateLayerResultMonitor, candidateReadyMonitor)
  } catch (error) {
    scenePresentationMode.value = previousMode
    activeS3MLayerIndex.value = previousIndex
    removeSceneLayer(currentViewer, candidateLayer)
    configureExistingViewerPresentation(runtime, currentViewer)
    throw error
  }

  previousSceneLayers.forEach((layer) => {
    if (layer !== candidateLayer) removeSceneLayer(currentViewer, layer)
  })
  if (previousThreeTiles) {
    currentViewer.scene.primitives?.remove?.(previousThreeTiles)
  }

  activeDemoTaskId += 1
  clearPendingTimeouts()
  clearAlgorithmOverlays(false)
  clearSceneContext()
  s3mLayers.value = []
  s3mLayers.value[index] = markExternalObject(candidateLayer)
  primaryS3MLayer.value = markExternalObject(candidateLayer)
  threeTilesPrimitive.value = null
  loadedLayers.value = [definition.name]
  pushDebugLayer(candidateLayer)
  enterNativeReady(
    `已进入 ${definition.name} 独立 ${definition.sourceCrs} 场景。`,
  )
  watchForLateS3MLayerFailure(
    currentViewer,
    candidateLayer,
    candidateLayerResultMonitor?.promise ?? null,
    candidateReadyMonitor?.promise ?? null,
    definition.name,
  )
  pushDebugMessage(sceneMessage.value)
  void initSceneExplode(candidateLayer)
  requestSceneRender()
}

function collectCurrentSceneLayers(currentViewer: SuperMapViewer): unknown[] {
  const collection = currentViewer.scene.layers as
    | {
        get?: (index: number) => unknown
        length?: number
        layerQueue?: unknown
        _layers?: unknown
      }
    | undefined
  const candidates = new Set<unknown>(
    s3mLayers.value.filter((layer) => Boolean(layer)),
  )
  if (!collection) return [...candidates]
  const layerCount = Number(collection.length ?? 0)
  if (
    collection.get &&
    Number.isFinite(layerCount) &&
    layerCount >= 0 &&
    layerCount <= 1000
  ) {
    for (let index = 0; index < layerCount; index += 1) {
      const layer = collection.get(index)
      if (layer) candidates.add(layer)
    }
  }
  for (const layer of [
    ...getSceneLayerCollectionValues(collection.layerQueue),
    ...getSceneLayerCollectionValues(collection._layers),
  ]) {
    if (layer) candidates.add(layer)
  }
  return [...candidates]
}

function removeSceneLayer(currentViewer: SuperMapViewer, layer: unknown) {
  const layerKey = getSceneLayerKey(layer)
  if (layerKey === null) return false
  return currentViewer.scene.layers?.remove?.(layerKey) ?? false
}

async function addS3MLayerWithCollectionFallback(
  currentViewer: SuperMapViewer,
  configUrl: string,
  options: Record<string, unknown>,
  previousSceneLayers: unknown[],
  expectedName: string,
  displayName: string,
  transactionSignal?: AbortSignal,
) {
  const addLayer = currentViewer.scene.addS3MTilesLayerByScp
  if (!addLayer)
    throw new Error('当前 SuperMap3D SDK 不支持 S3M config 图层加载')
  const layerResult = addLayer.call(currentViewer.scene, configUrl, options)
  requestSceneRender()
  if (!isPromiseLike(layerResult)) {
    if (!layerResult) throw new Error(`${displayName} 未返回有效 S3M 图层对象`)
    return { layer: layerResult, layerResultMonitor: null }
  }

  const layerResultMonitor = monitorPromiseSettlement(
    Promise.resolve(layerResult),
  )
  const layer = await withTimeout(
    Promise.race([
      layerResultMonitor.promise,
      waitForAddedSceneLayer(
        currentViewer,
        previousSceneLayers,
        expectedName,
        transactionSignal,
      ),
    ]),
    S3M_LAYER_READY_TIMEOUT_MS,
    `${displayName} 图层对象返回超时`,
  )
  if (!layer) throw new Error(`${displayName} 未返回有效 S3M 图层对象`)
  return { layer, layerResultMonitor }
}

async function waitForAddedSceneLayer(
  currentViewer: SuperMapViewer,
  previousSceneLayers: unknown[],
  expectedName: string,
  transactionSignal?: AbortSignal,
): Promise<unknown> {
  const attemptCount = Math.ceil(S3M_LAYER_READY_TIMEOUT_MS / 120)
  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    if (transactionSignal?.aborted) throw createSceneTransactionCancelledError()
    const addedLayer = findAddedSceneLayer(
      collectCurrentSceneLayers(currentViewer),
      previousSceneLayers,
      expectedName,
    )
    if (addedLayer) return addedLayer
    requestSceneRender()
    await waitForAbortableDelay(120, transactionSignal)
  }
  throw new Error(`${expectedName} 未出现在场景图层集合中`)
}

async function waitForS3MLayerRenderable(
  currentViewer: SuperMapViewer,
  layer: unknown,
  layerName: string,
  layerResultMonitor: PromiseSettlementMonitor<unknown> | null,
  transactionSignal?: AbortSignal,
) {
  const readyPromise = getS3MLayerReadyPromise(layer)
  const readyMonitor = readyPromise
    ? monitorPromiseSettlement(readyPromise)
    : null
  await withTimeout(
    waitForStableSceneLayer(currentViewer, layer, layerName, transactionSignal),
    S3M_LAYER_READY_TIMEOUT_MS,
    `${layerName} 首批瓦片解析超时`,
  )
  throwIfPromiseRejected(layerResultMonitor, readyMonitor)
  return readyMonitor
}

async function waitForStableSceneLayer(
  currentViewer: SuperMapViewer,
  layer: unknown,
  layerName: string,
  transactionSignal?: AbortSignal,
) {
  const minimumStableAttempts = 3
  const attemptCount = Math.ceil(S3M_LAYER_READY_TIMEOUT_MS / 120)
  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    if (transactionSignal?.aborted) {
      throw createSceneTransactionCancelledError()
    }
    const layerRecord = asRecord(layer)
    const isDestroyed = layerRecord.isDestroyed
    if (
      (typeof isDestroyed === 'function' && isDestroyed.call(layer)) ||
      isDestroyed === true
    ) {
      throw new Error(`${layerName} 图层已在准备阶段销毁`)
    }
    if (!collectCurrentSceneLayers(currentViewer).includes(layer)) {
      throw new Error(`${layerName} 图层未稳定保留在场景集合中`)
    }
    const initializationState = getSceneLayerInitializationState(layer)
    if (
      attempt + 1 >= minimumStableAttempts &&
      initializationState !== 'pending'
    ) {
      return
    }
    requestSceneRender()
    await waitForAbortableDelay(120, transactionSignal)
  }
  throw new Error(`${layerName} 图层对象已加入，但 SDK 尚未完成初始化`)
}

function waitForAbortableDelay(
  timeoutMs: number,
  transactionSignal?: AbortSignal,
) {
  if (!transactionSignal) return wait(timeoutMs)
  if (transactionSignal.aborted)
    return Promise.reject(createSceneTransactionCancelledError())
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      transactionSignal.removeEventListener('abort', cancel)
      resolve()
    }, timeoutMs)
    const cancel = () => {
      window.clearTimeout(timer)
      reject(createSceneTransactionCancelledError())
    }
    transactionSignal.addEventListener('abort', cancel, { once: true })
  })
}

function getS3MLayerReadyPromise(layer: unknown): Promise<unknown> | null {
  const readyPromise = asRecord(layer).readyPromise
  return isPromiseLike(readyPromise) ? Promise.resolve(readyPromise) : null
}

function watchForLateS3MLayerFailure(
  currentViewer: SuperMapViewer,
  layer: unknown,
  layerResultPromise: Promise<unknown> | null,
  readyPromise: Promise<unknown> | null,
  layerName: string,
) {
  let hasHandledFailure = false
  for (const promise of [layerResultPromise, readyPromise]) {
    if (!promise) continue
    void promise.catch((error) => {
      if (
        hasHandledFailure ||
        componentDestroyed ||
        viewer.value !== currentViewer ||
        !collectCurrentSceneLayers(currentViewer).includes(layer)
      ) {
        return
      }
      hasHandledFailure = true
      removeSceneLayer(currentViewer, layer)
      s3mLayers.value = s3mLayers.value.filter((entry) => entry !== layer)
      if (primaryS3MLayer.value === layer) primaryS3MLayer.value = null
      loadedLayers.value = loadedLayers.value.filter(
        (name) => name !== layerName,
      )
      const message = `${layerName} SDK 延迟报告加载失败：${
        error instanceof Error ? error.message : String(error)
      }`
      sceneState.value = 'error'
      sceneMessage.value = message
      pushDebugMessage(message)
    })
  }
}

async function preflightSceneDefinition(
  definition: (typeof SCENE_DEFINITIONS)[number],
  configUrl = definition.configUrl,
  transactionSignal?: AbortSignal,
) {
  const controller = new AbortController()
  const cancelForTransaction = () => controller.abort()
  if (transactionSignal?.aborted) {
    const error = new Error('场景切换已被更新请求取代')
    error.name = 'SceneTransactionCancelledError'
    throw error
  }
  transactionSignal?.addEventListener('abort', cancelForTransaction, {
    once: true,
  })
  const timeout = window.setTimeout(
    () => controller.abort(),
    S3M_PREFLIGHT_TIMEOUT_MS,
  )
  try {
    const response = await fetch(configUrl, {
      cache: 'no-store',
      headers: configUrl.toLowerCase().endsWith('.scp')
        ? { Range: 'bytes=0-0' }
        : undefined,
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(
        `${definition.name} config 返回 HTTP ${response.status}，主场景保持不变`,
      )
    }
    if (configUrl.toLowerCase().endsWith('.scp')) return
    const configText = await response.text()
    if (!configText.trim()) {
      throw new Error(`${definition.name} config 内容为空，主场景保持不变`)
    }
    const tileUrl = findFirstSceneTileUrl(configText, configUrl)
    if (!tileUrl) return
    const tileResponse = await fetch(tileUrl, {
      cache: 'no-store',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    })
    if (!tileResponse.ok) {
      throw new Error(
        `${definition.name} 首层瓦片返回 HTTP ${tileResponse.status}，主场景保持不变`,
      )
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (transactionSignal?.aborted) {
        const cancelledError = new Error('场景切换已被更新请求取代')
        cancelledError.name = 'SceneTransactionCancelledError'
        throw cancelledError
      }
      throw new Error(`${definition.name} 资源预检超时，主场景保持不变`)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    transactionSignal?.removeEventListener('abort', cancelForTransaction)
  }
}

function findFirstSceneTileUrl(
  configText: string,
  configUrl: string,
): string | null {
  const matches = configText.match(
    /["']([^"']+\.(?:s3m|s3mb|scp)(?:\?[^"']*)?)["']/i,
  )
  if (!matches?.[1]) return null
  try {
    return new URL(
      matches[1],
      new URL(configUrl, window.location.origin),
    ).toString()
  } catch {
    return null
  }
}

async function switchToParkScene() {
  if (activeSceneSwitchIndex !== null) return
  activeSceneSwitchIndex = 0
  try {
    sceneMessage.value = '正在返回园区主场景…'
    scenePresentationMode.value = 'park'
    activeS3MLayerIndex.value = 0
    await switchSceneInExistingViewer()
  } finally {
    if (activeSceneSwitchIndex === 0) activeSceneSwitchIndex = null
  }
}

/**
 * 模型爆炸（抽屉拆解）——参考超图官方 ModelExplode 老示例思路：
 * 用 S3MTilesLayer.datasetInfo()（读取缓存 attribute.json 的对象 ID 范围）
 * 把全部构件按 SmID 等分为多层，滑块驱动 setObjsTranslate 逐层拉开。
 * 独立 S3M 场景为局部米制坐标，偏移量直接使用 Cartesian3 米制向量。
 */

function resetSceneExplode() {
  const layer = explodeLayer.value
  explodeValue.value = 0
  explodeReady.value = false
  explodeSummary.value = ''
  explodeSlices = []
  explodeBounds = null
  if (layer) {
    const layerRecord = asExplodeLayer(layer)
    try {
      layerRecord.removeAllObjsTranslate?.()
    } catch {
      // 图层已销毁或 SDK 不支持时忽略，下一次进入场景会重新初始化。
    }
    requestSceneRender()
  }
  explodeLayer.value = null
}

async function initSceneExplode(layer: unknown): Promise<void> {
  const layerRecord = asExplodeLayer(layer)
  if (typeof layerRecord.datasetInfo !== 'function') {
    explodeSummary.value = '当前 SDK 不支持模型爆炸（缺少 datasetInfo）'
    return
  }
  try {
    const info = (await withTimeout(
      Promise.resolve(layerRecord.datasetInfo()),
      15000,
      '模型爆炸属性索引读取超时',
    )) as {
      layerInfos?: Array<{
        layerName?: string
        idRange?: { minID?: number; maxID?: number }
      }>
    } | null
    const idRange = info?.layerInfos?.find(
      (layerInfo) => layerInfo?.idRange,
    )?.idRange
    if (
      !idRange ||
      !Number.isFinite(Number(idRange.minID)) ||
      !Number.isFinite(Number(idRange.maxID))
    ) {
      explodeSummary.value = '模型属性索引缺少对象 ID 范围，爆炸不可用'
      return
    }
    const minID = Number(idRange.minID)
    const maxID = Number(idRange.maxID)
    const sliceSize = Math.max(
      1,
      Math.ceil((maxID - minID + 1) / EXPLODE_SLICE_COUNT),
    )
    explodeSlices = Array.from({ length: EXPLODE_SLICE_COUNT }, (_, slice) => {
      const ids: number[] = []
      const firstId = minID + slice * sliceSize
      const lastId = Math.min(firstId + sliceSize - 1, maxID)
      for (let id = firstId; id <= lastId; id += 1) ids.push(id)
      return ids
    }).filter((slice) => slice.length > 0)
    explodeBounds = await readExplodeBounds(layerRecord)
    explodeReady.value = explodeSlices.length > 0
    explodeSummary.value = explodeReady.value
      ? `共 ${maxID - minID + 1} 个构件，按 SmID 分 ${explodeSlices.length} 层`
      : '模型对象为空，爆炸不可用'
    explodeLayer.value = layer
    applyExplode(0)
  } catch (error) {
    explodeSummary.value = `模型爆炸初始化失败：${
      error instanceof Error ? error.message : String(error)
    }`
  }
}

/** 从缓存 config 的 geoBounds/heightRange 估算模型尺寸，用于计算每层步长。 */
async function readExplodeBounds(
  layerRecord: ExplodeLayerHandle,
): Promise<{ spanX: number; spanY: number; spanZ: number } | null> {
  const baseUri = layerRecord._baseUri
  if (typeof baseUri !== 'string' || !baseUri) return null
  try {
    const response = await fetch(`${baseUri}/config`, { cache: 'no-store' })
    if (!response.ok) return null
    const config = (await response.json()) as {
      geoBounds?: {
        left?: number
        right?: number
        bottom?: number
        top?: number
      }
      heightRange?: { min?: number; max?: number }
    }
    const left = Number(config.geoBounds?.left)
    const right = Number(config.geoBounds?.right)
    const bottom = Number(config.geoBounds?.bottom)
    const top = Number(config.geoBounds?.top)
    const minZ = Number(config.heightRange?.min)
    const maxZ = Number(config.heightRange?.max)
    const spanX = Math.abs(right - left)
    const spanY = Math.abs(top - bottom)
    const spanZ = Math.abs(maxZ - minZ)
    if (
      !Number.isFinite(spanX) ||
      !Number.isFinite(spanY) ||
      !Number.isFinite(spanZ)
    ) {
      return null
    }
    return { spanX, spanY, spanZ }
  } catch {
    return null
  }
}

/** 按当前滑块值与方向轴重算每层偏移量并下发 SDK。 */
function applyExplode(percent: number) {
  const layer = explodeLayer.value
  if (!layer || !explodeReady.value) return
  const layerRecord = asExplodeLayer(layer)
  const runtime = getRuntime()
  if (
    typeof layerRecord.setObjsTranslate !== 'function' ||
    !runtime?.Cartesian3
  ) {
    explodeSummary.value = '当前 SDK 不支持模型爆炸（缺少 setObjsTranslate）'
    return
  }
  if (percent <= 0) {
    try {
      layerRecord.removeAllObjsTranslate?.()
    } catch {
      // 图层已销毁时忽略
    }
    requestSceneRender()
    return
  }
  const axis = explodeAxis.value
  const fallbackSpan = 8
  const span =
    axis === 'x'
      ? (explodeBounds?.spanX ?? fallbackSpan)
      : axis === 'y'
        ? (explodeBounds?.spanY ?? fallbackSpan)
        : (explodeBounds?.spanZ ?? fallbackSpan)
  const unit = Math.max(span, 1) / Math.max(explodeSlices.length, 1)
  const fraction = percent / 100
  for (let sliceIndex = 0; sliceIndex < explodeSlices.length; sliceIndex += 1) {
    const distance = sliceIndex * unit * fraction
    const offset = new runtime.Cartesian3(
      axis === 'x' ? distance : 0,
      axis === 'y' ? distance : 0,
      axis === 'z' ? distance : 0,
    )
    layerRecord.setObjsTranslate(explodeSlices[sliceIndex], offset)
  }
  requestSceneRender()
}

watch([explodeValue, explodeAxis], ([nextValue]) => {
  applyExplode(Number(nextValue))
})

async function flyToS3MLayer(layer: unknown) {
  const currentViewer = viewer.value
  if (currentViewer?.flyTo) {
    try {
      await currentViewer.flyTo(layer)
      return true
    } catch (error) {
      pushDebugMessage(
        error instanceof Error ? error.message : 'S3M 图层 flyTo 失败',
      )
    }
  }
  return false
}
</script>

<style scoped lang="scss">
.supermap-scene-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  overflow: hidden;
  background: #06111f;
}

.scene-canvas,
.scene-fallback-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.scene-canvas :deep(canvas) {
  /* 不在 canvas 上做二次色彩处理，直接呈现 iServer 缓存材质。 */
  filter: none;
}

:global(.supermap3d-widget-errorPanel) {
  display: none;
  pointer-events: none;
}

/* 保留 SuperMap/Cesium 版权标识，但避开底部 GIS 坐标栏。 */
:global(.cesium-viewer-bottom) {
  bottom: 48px;
  z-index: 8;
  pointer-events: none;
}

:global(.cesium-widget-credits) {
  bottom: 48px;
  z-index: 8;
  pointer-events: none;
}

.scene-inline-message {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 8;
  width: min(680px, calc(100% - 48px));
  transform: translate(-50%, -50%);
  border: 1px solid rgba(80, 227, 194, 0.38);
  background: rgba(2, 12, 20, 0.86);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.38);
  color: #d9fff8;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.75;
  padding: 18px 22px;
  text-align: center;
}

.scene-inline-message.error {
  border-color: rgba(255, 107, 74, 0.62);
  color: #ffe9df;
}

.gis-coordinate-readout {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 7;
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 430px));
  gap: 1px;
  justify-content: end;
  min-height: 46px;
  overflow: hidden;
  color: #e6edf3;
  background: transparent;
  border-top: 0;
  pointer-events: none;
}

.gis-coordinate-readout div {
  min-width: 0;
  padding: 6px 14px 5px;
  text-shadow: 0 1px 3px rgb(0 0 0 / 92%);
  background: transparent;
}

.gis-coordinate-readout .coordinate-live {
  position: relative;
  padding-left: 30px;
}

.gis-coordinate-readout .coordinate-live::before {
  position: absolute;
  top: 20px;
  left: 14px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5aa7a1;
  box-shadow: 0 0 0 3px rgba(90, 167, 161, 0.14);
  content: '';
}

.gis-coordinate-readout span,
.gis-coordinate-readout strong,
.gis-coordinate-readout em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gis-coordinate-readout span {
  color: rgba(139, 154, 168, 0.9);
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 10px;
  line-height: 12px;
}

.gis-coordinate-readout strong {
  color: #dce8ec;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
  font-variant-numeric: tabular-nums;
}

.gis-coordinate-readout em {
  color: #6eb7b0;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  line-height: 12px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 760px) {
  .gis-coordinate-readout {
    grid-template-columns: minmax(145px, 0.75fr) minmax(230px, 1.25fr);
    justify-content: stretch;
  }

  .gis-coordinate-readout > div:last-child {
    display: none;
  }
}

.inversion-result-legend {
  position: absolute;
  bottom: 62px;
  left: 18px;
  z-index: 7;
  width: 286px;
  padding: 13px 14px 12px;
  border: 1px solid rgba(126, 230, 212, 0.24);
  border-radius: 10px;
  color: #eef8ff;
  background: rgba(3, 13, 24, 0.88);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.inversion-legend-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(126, 230, 212, 0.14);
}

.inversion-legend-head span,
.inversion-legend-head strong,
.inversion-legend-head em {
  display: block;
}

.inversion-legend-head span {
  color: #7ee6d4;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.inversion-legend-head strong {
  margin-top: 3px;
  font-size: 14px;
  line-height: 1.2;
}

.inversion-legend-head em {
  color: rgba(238, 248, 255, 0.52);
  font-size: 10px;
  font-style: normal;
}

.inversion-legend-items {
  display: grid;
  gap: 9px;
  margin-top: 10px;
}

.inversion-legend-items > div {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.inversion-legend-items span,
.inversion-legend-items strong,
.inversion-legend-items small {
  display: block;
}

.inversion-legend-items strong {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
}

.inversion-legend-items small {
  margin-top: 1px;
  color: rgba(238, 248, 255, 0.5);
  font-size: 10px;
}

.legend-swatch {
  --legend-color: #fff;

  display: block;
  width: 10px;
  height: 10px;
  margin-left: 2px;
  border-radius: 50%;
  background: var(--legend-color);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.75);
}

.legend-swatch.ring {
  width: 12px;
  height: 12px;
  border: 2px solid var(--legend-color);
  background: color-mix(in srgb, var(--legend-color) 14%, transparent);
  box-shadow: none;
}

.legend-swatch.sample {
  width: 7px;
  height: 7px;
  margin-left: 4px;
  box-shadow:
    -5px 3px 0 -1px color-mix(in srgb, var(--legend-color) 72%, transparent),
    5px -3px 0 -1px color-mix(in srgb, var(--legend-color) 72%, transparent);
}

@media (max-width: 760px) {
  .inversion-result-legend {
    right: 12px;
    bottom: 58px;
    left: 12px;
    width: auto;
  }

  .inversion-legend-items {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.scene-status-panel {
  position: absolute;
  right: 28px;
  bottom: 28px;
  z-index: 4;
  width: min(460px, calc(100% - 56px));
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(118, 211, 255, 0.34);
  background: rgba(3, 11, 23, 0.82);
  color: #eef8ff;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(12px);
}

.status-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.status-kicker {
  display: block;
  margin-bottom: 8px;
  color: #7ee6d4;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.status-head h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 800;
}

.status-pill {
  flex: 0 0 auto;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
}

.status-pill.ready {
  border-color: rgba(66, 225, 166, 0.54);
  color: #7ef2c6;
}

.status-pill.fallback,
.status-pill.error {
  border-color: rgba(255, 192, 105, 0.56);
  color: #ffd38c;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.status-grid article {
  min-width: 0;
  padding: 12px;
  border: 1px solid rgba(118, 211, 255, 0.22);
  background: rgba(255, 255, 255, 0.06);
}

.status-grid span {
  display: block;
  color: rgba(238, 248, 255, 0.62);
  font-size: 12px;
}

.status-grid strong {
  display: block;
  margin-top: 8px;
  overflow: hidden;
  color: #fff;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-grid strong.ready {
  color: #7ef2c6;
}

.status-grid strong.offline {
  color: #ffbf7a;
}

.status-grid p {
  min-height: 36px;
  margin: 8px 0 0;
  overflow: hidden;
  color: rgba(238, 248, 255, 0.72);
  font-size: 12px;
  line-height: 1.5;
}

.capability-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.capability-row span {
  padding: 6px 9px;
  border: 1px solid rgba(126, 230, 212, 0.28);
  color: rgba(238, 248, 255, 0.86);
  font-size: 12px;
}

.scene-message {
  margin-top: 12px;
  padding: 10px 12px;
  border-left: 3px solid #ffbf7a;
  background: rgba(255, 191, 122, 0.1);
  color: #ffdbad;
  font-size: 12px;
  line-height: 1.6;
}

.status-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.status-actions button {
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(126, 230, 212, 0.42);
  background: rgba(126, 230, 212, 0.1);
  color: #eef8ff;
  cursor: pointer;
}

.status-actions button:hover {
  border-color: rgba(126, 230, 212, 0.82);
  background: rgba(126, 230, 212, 0.18);
}

.explode-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(255, 196, 92, 0.3);
  background: rgba(255, 196, 92, 0.07);
}

.explode-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.explode-head span {
  color: #ffe8c4;
  font-weight: 700;
  font-size: 14px;
}

.explode-head button {
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(255, 196, 92, 0.42);
  background: rgba(255, 196, 92, 0.12);
  color: #ffe8c4;
  cursor: pointer;
}

.explode-head button:disabled,
.explode-axis button:disabled,
.explode-panel input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.explode-summary {
  margin: 8px 0 0;
  color: #b9d2c9;
  font-size: 12px;
  line-height: 1.5;
}

.explode-panel input[type='range'] {
  display: block;
  width: 100%;
  margin-top: 10px;
  accent-color: #ffc45c;
}

.explode-axis {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.explode-axis button {
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(126, 230, 212, 0.3);
  background: rgba(126, 230, 212, 0.08);
  color: #cfe9ff;
  cursor: pointer;
}

.explode-axis button.active {
  border-color: rgba(255, 196, 92, 0.82);
  background: rgba(255, 196, 92, 0.18);
  color: #ffe8c4;
}

.algorithm-demo-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid rgba(82, 255, 184, 0.24);
  background: rgba(82, 255, 184, 0.07);
}

.demo-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.demo-head span,
.evidence-card span {
  display: block;
  color: rgba(238, 248, 255, 0.64);
  font-size: 12px;
}

.demo-head strong {
  display: block;
  margin-top: 6px;
  color: #eef8ff;
  font-size: 16px;
}

.demo-head strong.running {
  color: #ffdc7a;
}

.demo-head strong.success {
  color: #7ef2c6;
}

.demo-head strong.error {
  color: #ff8d7a;
}

.demo-head button,
.demo-actions button {
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(238, 248, 255, 0.22);
  background: rgba(255, 255, 255, 0.07);
  color: #eef8ff;
  cursor: pointer;
}

.demo-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.algorithm-demo-panel > p {
  margin: 10px 0 0;
  color: rgba(238, 248, 255, 0.76);
  font-size: 12px;
  line-height: 1.6;
}

.demo-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.evidence-card {
  margin-top: 10px;
  padding: 10px;
  border-left: 3px solid rgba(82, 255, 184, 0.72);
  background: rgba(0, 0, 0, 0.18);
}

.evidence-card strong {
  display: block;
  margin-top: 5px;
  color: #fff;
  font-size: 13px;
}

.evidence-card p {
  margin: 5px 0 0;
  color: rgba(238, 248, 255, 0.72);
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .scene-status-panel {
    right: 14px;
    bottom: 14px;
    width: calc(100% - 28px);
    padding: 14px;
  }

  .status-head {
    flex-direction: column;
    gap: 10px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .demo-actions {
    grid-template-columns: 1fr;
  }
}
</style>
