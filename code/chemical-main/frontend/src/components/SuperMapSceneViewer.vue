<template>
  <section class="supermap-scene-viewer">
    <div v-show="renderMode === 'native'" ref="sceneContainer" class="scene-canvas"></div>
    <svg
      v-if="routeScreenOverlayPoints.length"
      class="route-screen-overlay"
      viewBox="0 0 1280 720"
      preserveAspectRatio="none"
      aria-label="疏散路线屏幕引导层"
    >
      <polyline
        :points="routeScreenOverlayPolyline"
        class="route-screen-overlay__halo"
      />
      <polyline
        :points="routeScreenOverlayPolyline"
        class="route-screen-overlay__line"
      />
      <g
        v-for="(point, index) in routeScreenOverlayPoints"
        :key="`${point.x.toFixed(1)}-${point.y.toFixed(1)}-${index}`"
      >
        <circle :cx="point.x" :cy="point.y" r="10" class="route-screen-overlay__dot-halo" />
        <circle :cx="point.x" :cy="point.y" r="6" class="route-screen-overlay__dot" />
        <text
          v-if="index === 0 || index === routeScreenOverlayPoints.length - 1"
          :x="point.x + 14"
          :y="point.y - 12"
          class="route-screen-overlay__label"
        >
          {{ index === 0 ? '疏散起点' : '安全出口' }}
        </text>
      </g>
    </svg>

    <iframe
      v-if="renderMode === 'fallback'"
      :src="dashboardUrl"
      title="SuperMap iPortal 数字园区大屏"
      class="scene-fallback-frame"
      frameborder="0"
      allowfullscreen
    ></iframe>

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
        <span v-for="item in algorithmCapabilities" :key="item">{{ item }}</span>
      </div>

      <div v-if="sceneMessage" class="scene-message">{{ sceneMessage }}</div>

      <div class="status-actions">
        <button type="button" @click="focusScene">定位园区</button>
        <button type="button" @click="focusGeoCenter">定位经纬度</button>
        <button type="button" @click="reloadScene">重新加载</button>
      </div>

      <div class="algorithm-demo-panel">
        <div class="demo-head">
          <div>
            <span>算法空间化闭环</span>
            <strong :class="demoTaskState">{{ demoTaskStateText }}</strong>
          </div>
          <button type="button" @click="clearAlgorithmOverlays">清除图层</button>
        </div>
        <p>{{ demoTaskMessage }}</p>
        <div class="demo-actions">
          <button type="button" :disabled="demoTaskState === 'running'" @click="runDiffusionDemo">
            运行扩散
          </button>
          <button type="button" :disabled="demoTaskState === 'running'" @click="runParticleDemo">
            粒子溯源
          </button>
          <button type="button" :disabled="demoTaskState === 'running'" @click="runEvacuationDemo">
            疏散规划
          </button>
        </div>
        <div v-if="latestEvidence" class="evidence-card">
          <span>{{ latestEvidence.label }}</span>
          <strong>{{ latestEvidence.outputSummary }}</strong>
          <p>{{ latestEvidence.geoSummary }} · {{ latestEvidence.costMs }}ms · {{ latestEvidence.requestId }}</p>
        </div>
        <div v-if="selectedSensor" class="evidence-card sensor-card">
          <span>三维监控点</span>
          <strong>{{ selectedSensor.id }} · {{ selectedSensor.type }}</strong>
          <p>
            EPSG:4547 {{ sensorProjectedText(selectedSensor) }}
            · EPSG:4490 {{ sensorGeoText(selectedSensor) }}
            · H={{ selectedSensor.installationHeight.toFixed(1) }}m
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import {
  checkAlgorithmHealth,
  runDiffusionSimulation,
  runEvacuationPlanning,
  runParticleFilterInversion,
} from '@/api/algorithm'
import type { AlgorithmHealth, AlgorithmRecord } from '@/api/algorithm'
import type {
  SuperMapProjectedPoint4547,
  SuperMapScenePickEventPayload,
} from '@/types/supermap-scene-events'
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
  type SuperMapCupSensor,
} from '@/data/supermapCupScenario'

defineOptions({
  name: 'SuperMapSceneViewer',
})

const sceneViewerProps = withDefaults(defineProps<{
  showStatusPanel?: boolean
}>(), {
  showStatusPanel: true,
})

const emit = defineEmits<{
  (e: 'facility-click', id: string): void
  (e: 'scene-object-pick', payload: SuperMapScenePickEventPayload): void
}>()

type SceneState = 'loading' | 'ready' | 'fallback' | 'error'
type AlgorithmState = 'checking' | 'ready' | 'offline'
type DemoTaskState = 'idle' | 'running' | 'success' | 'error'

type SuperMapRuntime = {
  Viewer: new (container: HTMLElement | string, options?: Record<string, unknown>) => SuperMapViewer
  Color?: SuperMapColorFactory
  SceneMode?: { SCENE3D?: unknown }
  ScreenSpaceEventHandler?: new (canvas: HTMLCanvasElement) => SuperMapClickHandler
  ScreenSpaceEventType?: { LEFT_CLICK?: unknown }
  Cartesian3?: SuperMapCartesian3Factory
  Math?: { toRadians: (value: number) => number }
  defined?: (value: unknown) => boolean
}

type SuperMapViewer = {
  entities?: SuperMapEntityCollection
  scene: {
    canvas: HTMLCanvasElement
    globe?: { show: boolean }
    skyAtmosphere?: { show: boolean }
    camera?: {
      setView?: (options: Record<string, unknown>) => void
      flyTo?: (options: Record<string, unknown>) => void
    }
    open?: (url: string, sceneName?: string, options?: Record<string, unknown>) => Promise<unknown>
    addS3MTilesLayerByScp?: (url: string, options?: Record<string, unknown>) => Promise<unknown>
    pick?: (position: unknown) => unknown
  }
  camera?: {
    setView?: (options: Record<string, unknown>) => void
    flyTo?: (options: Record<string, unknown>) => void
  }
  flyTo?: (target: unknown) => Promise<unknown>
  destroy?: () => void
}

type SuperMapCartesian3Factory = {
  new (x: number, y: number, z: number): unknown
  fromDegrees?: (longitude: number, latitude: number, height?: number) => unknown
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
  setInputAction: (callback: (event: { position: unknown }) => void, eventType: unknown) => void
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
    }
  }
}

const DEFAULT_IPORTAL_URL =
  'http://8.130.175.232:18190/iportal/apps/mapdashboard/v2/index.html?id=1782865708&action=view&mode=pc'
const DEFAULT_SCENE_URL =
  'http://8.130.175.232:18090/iserver/services/3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace'
const DEFAULT_LAYER_CONFIG =
  'http://8.130.175.232:18090/iserver/services/3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace/datas/%E5%8C%96%E5%B7%A5%E5%9B%AD%E5%8C%BA%E5%9C%BA%E6%99%AF/config'
const DEFAULT_CAMERA = {
  longitude: SUPERMAP_CUP_SCENARIO.sceneCenterGeoPoint.longitude,
  latitude: SUPERMAP_CUP_SCENARIO.sceneCenterGeoPoint.latitude,
  height: 2600,
  heading: 0,
  pitch: -90,
  roll: 0,
}
const LOCAL_S3M_CAMERA = {
  x: -397.75005895327922,
  y: -125.91957235375594,
  z: 650,
}
const LOCAL_S3M_BOUNDS = {
  left: -1605.9164671191247,
  right: 810.41634921256627,
  bottom: -1130.1391864245234,
  top: 878.30004171701148,
}
const LOCAL_S3M_CENTER = {
  x: -397.75005895327922,
  y: -125.91957235375594,
  z: 0,
}
const GLOBE_ALGORITHM_ALTITUDE_LIFT = 180
const GLOBE_DIFFUSION_CELL_LIMIT = 24
const GLOBE_DIFFUSION_ELLIPSE_LIMIT = 8
const GLOBE_DIFFUSION_MARKER_LIMIT = 18
const NATIVE_DIFFUSION_CELL_LIMIT = 42

const sceneContainer = ref<HTMLDivElement | null>(null)
const renderMode = ref<'native' | 'fallback'>('native')
const sceneState = ref<SceneState>('loading')
const algorithmState = ref<AlgorithmState>('checking')
const algorithmHealth = ref<AlgorithmHealth | null>(null)
const sceneMessage = ref('')
const loadedLayers = ref<string[]>([])
const viewer = shallowRef<SuperMapViewer | null>(null)
const clickHandler = shallowRef<SuperMapClickHandler | null>(null)
const demoTaskState = ref<DemoTaskState>('idle')
const demoTaskMessage = ref('等待运行算法')
const diffusionResult = ref<AlgorithmRecord | null>(null)
const particleResult = ref<AlgorithmRecord | null>(null)
const evacuationResult = ref<AlgorithmRecord | null>(null)
const overlayEntities = shallowRef<unknown[]>([])
const sensorEntities = shallowRef<unknown[]>([])
const routeScreenOverlayPoints = ref<Array<{ x: number; y: number }>>([])
const evidenceRecords = ref<SuperMapCupEvidence[]>([])
const primaryS3MLayer = shallowRef<unknown>(null)
const selectedSensor = ref<SuperMapCupSensor | null>(SUPERMAP_CUP_SENSORS[0] || null)

const dashboardUrl = computed(() => import.meta.env.VITE_IPORTAL_DASHBOARD_URL || DEFAULT_IPORTAL_URL)
const statusPanelVisible = computed(() => sceneViewerProps.showStatusPanel)
const sdkBaseUrl = computed(() => trimTrailingSlash(import.meta.env.VITE_SUPERMAP3D_BASE_URL || '/supermap3d'))
const sdkScriptUrl = computed(() => import.meta.env.VITE_SUPERMAP3D_SCRIPT_URL || `${sdkBaseUrl.value}/Cesium.js`)
const sdkStyleUrl = computed(() => import.meta.env.VITE_SUPERMAP3D_STYLE_URL || `${sdkBaseUrl.value}/Widgets/widgets.css`)
const sceneUrl = computed(() => import.meta.env.VITE_SUPERMAP_3D_SCENE_URL || DEFAULT_SCENE_URL)
const sceneName = computed(() => import.meta.env.VITE_SUPERMAP_3D_SCENE_NAME || '默认场景')
const layerConfigs = computed(() => {
  const raw = import.meta.env.VITE_SUPERMAP_3D_LAYER_CONFIGS || DEFAULT_LAYER_CONFIG
  return raw.split(',').map((item) => item.trim()).filter(Boolean)
})
const s3mLayerPosition = computed(() => parseGeoPosition(import.meta.env.VITE_SUPERMAP_3D_LAYER_POSITION))
const shouldApplyLayerPosition = computed(() => import.meta.env.VITE_SUPERMAP_3D_APPLY_LAYER_POSITION === 'true')
const defaultCamera = computed(() => parseCamera(import.meta.env.VITE_SUPERMAP_3D_DEFAULT_CAMERA))
const activeSceneName = computed(() => sceneName.value || '默认场景')
const loadedLayerCount = computed(() => loadedLayers.value.length)
const loadedLayerNames = computed(() => {
  if (!loadedLayers.value.length) return '等待三维图层返回'
  return loadedLayers.value.slice(0, 3).join(' / ')
})
const sceneSourceText = computed(() => {
  if (renderMode.value === 'fallback') return 'iPortal 大屏兜底展示'
  return shouldApplyLayerPosition.value
    ? 'iClient3D WebGL + S3M config / CGCS2000(EPSG:4490) 算法叠加'
    : 'iServer Realspace + iClient3D WebGL / EPSG:0 原生缓存'
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
  if (algorithmState.value === 'offline') return '保留 /algorithm-api 统一服务入口'
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
const coordinateModeTitle = computed(() => shouldApplyLayerPosition.value ? '球面坐标' : '场景坐标')
const coordinateModeName = computed(() => shouldApplyLayerPosition.value ? 'CGCS2000 / EPSG:4490' : 'EPSG:0')
const coordinateModeDetail = computed(() => shouldApplyLayerPosition.value
  ? `河工大莲花街锚点 ${layerPositionSummary.value} / 算法源点 ${coordinateSummary.value}`
  : `S3M 本地米制中心 (${LOCAL_S3M_CENTER.x.toFixed(1)}, ${LOCAL_S3M_CENTER.y.toFixed(1)}) / 业务经纬度 ${coordinateSummary.value}`)
const layerPositionSummary = computed(() => {
  const position = s3mLayerPosition.value
  return `${position.longitude.toFixed(6)}E, ${position.latitude.toFixed(6)}N`
})
const overlayCoordinateLabel = computed(() => shouldApplyLayerPosition.value ? 'CGCS2000 EPSG:4490 经纬度' : 'EPSG:0 本地米制场景坐标')
const demoTaskStateText = computed(() => {
  if (demoTaskState.value === 'running') return '运行中'
  if (demoTaskState.value === 'success') return '已落图'
  if (demoTaskState.value === 'error') return '失败'
  return '待运行'
})
const latestEvidence = computed(() => evidenceRecords.value[0] || null)
const routeScreenOverlayPolyline = computed(() =>
  routeScreenOverlayPoints.value.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '),
)

onMounted(async () => {
  await Promise.allSettled([
    bootstrapScene(),
    refreshAlgorithmHealth(),
  ])
})

onBeforeUnmount(() => {
  destroyScene()
})

async function bootstrapScene() {
  sceneState.value = 'loading'
  renderMode.value = 'native'
  sceneMessage.value = ''
  loadedLayers.value = []
  await nextTick()

  try {
    const runtime = await loadSuperMapRuntime()
    if (!sceneContainer.value) throw new Error('三维容器未挂载')

    viewer.value = markRaw(new runtime.Viewer(sceneContainer.value, {
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
    }))
    updateDebugState(runtime)

    const currentScene = viewer.value.scene
    if (!currentScene) {
      throw new Error(`当前 SuperMap3D Viewer 未暴露 scene；runtime=${describeRuntime(runtime)}`)
    }
    if (currentScene.globe) currentScene.globe.show = shouldApplyLayerPosition.value
    if (currentScene.skyAtmosphere) currentScene.skyAtmosphere.show = shouldApplyLayerPosition.value

    await openScene()
    if (shouldApplyLayerPosition.value) {
      setDefaultCamera(runtime)
    } else {
      if (!sceneMessage.value) {
        sceneMessage.value = '当前 S3M config 标记为 epsg:0 平面米制缓存，Web 端先按原生缓存显示模型；经纬度用于业务算法坐标和后续 iDesktopX 重处理目标。'
      }
    }
    renderMonitoringSensors()
    setupPicking(runtime)
    sceneState.value = 'ready'
  } catch (error) {
    sceneState.value = 'fallback'
    renderMode.value = 'fallback'
    sceneMessage.value = error instanceof Error ? error.message : 'SuperMap 三维运行时加载失败'
  }
}

async function openScene() {
  const currentViewer = viewer.value
  if (!currentViewer) throw new Error('三维 Viewer 初始化失败')
  if (!currentViewer.scene) throw new Error('当前 SuperMap3D Viewer 未暴露 scene，请检查 SDK 入口文件是否匹配 iClient3D WebGL')

  if (shouldApplyLayerPosition.value && currentViewer.scene.addS3MTilesLayerByScp && layerConfigs.value.length) {
    await openS3MConfigLayers(currentViewer, 0, true, 1)
    if (layerConfigs.value.length > 1) void loadGlobeDetailLayers(currentViewer)
    sceneMessage.value = `旧 S3M 主场景 config 已通过 iClient3D 请求；算法图层按河工大莲花街锚点 ${layerPositionSummary.value} 落球面。旧 S3M 仍需 iDesktopX 重定位后发布 CGCS2000 Realspace，才能保证厂房、管线和算法结果真实对齐。`
    return
  }

  if (currentViewer.scene.open && sceneUrl.value) {
    try {
      await withTimeout(
        currentViewer.scene.open(sceneUrl.value, sceneName.value, { autoSetView: true }),
        30000,
        'iServer Realspace 场景加载超时，改用 S3M config 图层加载',
      )
      loadedLayers.value.push(activeSceneName.value)
      if (currentViewer.scene.addS3MTilesLayerByScp && layerConfigs.value.length > 1) {
        await openS3MConfigLayers(currentViewer, 1, false)
      }
      return
    } catch (error) {
      sceneMessage.value = error instanceof Error ? error.message : 'iServer Realspace 场景加载超时，改用 S3M config 图层加载'
      pushDebugMessage(sceneMessage.value)
    }
  }

  if (currentViewer.scene.addS3MTilesLayerByScp && layerConfigs.value.length) {
    await openS3MConfigLayers(currentViewer, 0, true)
    return
  }

  if (!currentViewer.scene.open || !sceneUrl.value) {
    throw new Error('没有可用的 iServer 三维场景或 S3M config 地址')
  }
}

async function openS3MConfigLayers(currentViewer: SuperMapViewer, startIndex = 0, strict = true, maxCount?: number) {
  if (!currentViewer.scene.addS3MTilesLayerByScp) throw new Error('当前 SuperMap3D SDK 不支持 S3M config 图层加载')
  let configs = layerConfigs.value
    .map((configUrl, index) => ({ configUrl, index }))
    .slice(startIndex)
  if (maxCount !== undefined) configs = configs.slice(0, maxCount)
  for (const { configUrl, index } of configs) {
    const layerName = resolveLayerName(configUrl, index)
    const shouldAutoFocusLayer = startIndex === 0 && index === 0
    try {
      const options: Record<string, unknown> = {
        name: layerName,
        autoSetView: shouldAutoFocusLayer,
      }
      if (shouldApplyLayerPosition.value) {
        options.position = [
          s3mLayerPosition.value.longitude,
          s3mLayerPosition.value.latitude,
          s3mLayerPosition.value.height,
        ]
      }
      const layerOrPromise = currentViewer.scene.addS3MTilesLayerByScp(configUrl, options)
      loadedLayers.value.push(layerName)
      if (isPromiseLike(layerOrPromise)) {
        void Promise.resolve(layerOrPromise)
          .then((layer: unknown) => {
            primaryS3MLayer.value ||= markExternalObject(layer)
            pushDebugLayer(layer)
            if (shouldAutoFocusLayer && shouldApplyLayerPosition.value) void flyToPrimaryLayer()
          }, (error: unknown) => {
            sceneMessage.value = error instanceof Error ? error.message : `${layerName} 后台加载异常`
            pushDebugMessage(sceneMessage.value)
          })
      } else if (shouldAutoFocusLayer && shouldApplyLayerPosition.value && currentViewer.flyTo) {
        primaryS3MLayer.value = markExternalObject(layerOrPromise)
        pushDebugLayer(layerOrPromise)
        await flyToPrimaryLayer()
      }
    } catch (error) {
      sceneMessage.value = error instanceof Error ? error.message : `${layerName} 加载异常`
      if (strict) throw error
      pushDebugMessage(sceneMessage.value)
    }
  }
}

async function loadGlobeDetailLayers(currentViewer: SuperMapViewer) {
  await wait(1200)
  try {
    await openS3MConfigLayers(currentViewer, 1, false)
    sceneMessage.value = `旧 S3M 主场景和细节图层 config 已请求完成；算法图层已按河工大莲花街锚点落球面。当前不是 CGCS2000 Realspace 重发布，模型主体不可见或不对齐时必须回到 iDesktopX 重定位重缓存。`
  } catch (error) {
    const message = error instanceof Error ? error.message : '细节图层后台加载异常'
    sceneMessage.value = `${message}；主场景和算法图层保留显示，细节模型需在 iDesktopX 重定位重缓存后最终验收。`
    pushDebugMessage(sceneMessage.value)
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
  const runtime = getRuntime()
  if (!runtime || !viewer.value) return
  if (shouldApplyLayerPosition.value) {
    setDefaultCamera(runtime)
    return
  }
  if (primaryS3MLayer.value) void flyToPrimaryLayer()
}

function focusGeoCenter() {
  const runtime = getRuntime()
  const currentViewer = viewer.value
  if (!runtime?.Cartesian3?.fromDegrees || !currentViewer) return
  if (!shouldApplyLayerPosition.value) {
    sceneMessage.value = '当前三维瓦片是 epsg:0 平面缓存，尚未重缓存为真实经纬度坐标；为避免再次绿屏，定位经纬度只记录坐标，不移动相机。'
    return
  }
  const geo = SUPERMAP_CUP_SCENARIO.sourceGeoPoint
  const destination = runtime.Cartesian3.fromDegrees(geo.longitude, geo.latitude, 900)
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

async function runDiffusionDemo() {
  await runDemoTask('diffusion', async () => {
    const response = await runDiffusionSimulation(buildSuperMapCupDiffusionPayload())
    const result = unwrapAlgorithmRecord(response, '扩散模拟未返回有效结果')
    diffusionResult.value = result
    drawDiffusionOverlay(result)
    const finalFrame = selectFinalDiffusionFrame(result)
    const maxConcentration = Number(finalFrame.maxConcentration || asRecord(result.stats).peakConcentration || 0)
    pushEvidence(buildSuperMapCupEvidence(
      'diffusion',
      '扩散模拟',
      result,
      `${getArrayLength(result.frames)} 帧 / 峰值 ${maxConcentration.toFixed(2)} ppm`,
      `${overlayCoordinateLabel.value}源点 ${describeMapPoint(SUPERMAP_CUP_SCENARIO.sourceMapPoint, 8)}`,
    ))
    return `扩散结果已转为 ${overlayCoordinateLabel.value} 三维风险云团，峰值 ${maxConcentration.toFixed(2)} ppm`
  })
}

async function runParticleDemo() {
  await runDemoTask('particle', async () => {
    const baseDiffusion = await ensureDiffusionResult()
    const response = await runParticleFilterInversion(buildSuperMapCupParticlePayload(baseDiffusion))
    const result = unwrapAlgorithmRecord(response, '粒子滤波未返回估计源点')
    particleResult.value = result
    drawParticleOverlay(result)
    const estimatedPoint = getEstimatedSourcePoint(result)
    const estimatedGeo = estimatedPoint ? mapPointToGeo(estimatedPoint, 14) : null
    pushEvidence(buildSuperMapCupEvidence(
      'particle',
      '粒子滤波溯源',
      result,
      estimatedPoint ? `估计源点 (${estimatedPoint.x.toFixed(1)}, ${estimatedPoint.y.toFixed(1)})` : '未返回源点',
      estimatedPoint ? describeMapPoint(estimatedPoint, 14) : '无可落图坐标',
    ))
    return estimatedPoint
      ? `溯源结果已落到 ${overlayCoordinateLabel.value}：${describeMapPoint(estimatedPoint, 14)}`
      : '溯源返回，但缺少可落图坐标'
  })
}

async function runEvacuationDemo() {
  await runDemoTask('evacuation', async () => {
    const baseDiffusion = await ensureDiffusionResult()
    const response = await runEvacuationPlanning(buildSuperMapCupEvacuationPayload(baseDiffusion))
    const result = unwrapAlgorithmRecord(response, '疏散规划未返回路径')
    evacuationResult.value = result
    drawEvacuationOverlay(result)
    const path = resolveRoutePath(result)
    const exitLabel = String(result.exitLabel || result.selectedExitLabel || '安全出口')
    pushEvidence(buildSuperMapCupEvidence(
      'evacuation',
      '疏散规划',
      result,
      `${path.length} 个路径点 / ${exitLabel}`,
      path.length ? `首尾点均已转换为 ${overlayCoordinateLabel.value}` : '未返回路径点',
    ))
    return `疏散路径已叠加到 SuperMap 三维场景：${path.length} 个 ${overlayCoordinateLabel.value} 路径点`
  })
}

async function runDemoTask(_kind: string, executor: () => Promise<string>) {
  demoTaskState.value = 'running'
  demoTaskMessage.value = '正在调用 FastAPI 算法服务并准备 SuperMap 图层...'
  try {
    const message = await executor()
    demoTaskState.value = 'success'
    demoTaskMessage.value = message
  } catch (error) {
    demoTaskState.value = 'error'
    demoTaskMessage.value = error instanceof Error ? error.message : '算法执行失败'
  }
}

async function ensureDiffusionResult() {
  if (diffusionResult.value) return diffusionResult.value
  const response = await runDiffusionSimulation(buildSuperMapCupDiffusionPayload())
  const result = unwrapAlgorithmRecord(response, '扩散模拟未返回有效结果')
  diffusionResult.value = result
  drawDiffusionOverlay(result)
  return result
}

function drawDiffusionOverlay(result: AlgorithmRecord) {
  const runtime = getRuntime()
  const frame = selectFinalDiffusionFrame(result)
  const cells = Array.isArray(frame.cells) ? frame.cells.map(asRecord).filter(cell => Number(cell.concentration) > 0) : []
  const peak = Math.max(...cells.map(cell => Number(cell.concentration || 0)), 1)
  addPointEntity(SUPERMAP_CUP_SCENARIO.sourceMapPoint, '泄漏源', '#ff6b4a', 18)
  const cellLimit = shouldApplyLayerPosition.value ? GLOBE_DIFFUSION_CELL_LIMIT : NATIVE_DIFFUSION_CELL_LIMIT
  const ellipseLimit = shouldApplyLayerPosition.value ? GLOBE_DIFFUSION_ELLIPSE_LIMIT : NATIVE_DIFFUSION_CELL_LIMIT
  const markerLimit = shouldApplyLayerPosition.value ? GLOBE_DIFFUSION_MARKER_LIMIT : 24
  cells
    .sort((left, right) => Number(right.concentration || 0) - Number(left.concentration || 0))
    .slice(0, cellLimit)
    .forEach((cell, index) => {
      const point = toMapPoint(cell)
      if (!point) return
      const ratio = Math.min(1, Number(cell.concentration || 0) / peak)
      const color = ratio > 0.65 ? '#ff3b30' : ratio > 0.35 ? '#ffb020' : '#35d2ff'
      if (index < ellipseLimit) {
        addEllipseEntity(point, {
          title: `扩散浓度 ${Number(cell.concentration || 0).toFixed(2)} ppm`,
          radius: Math.max(Number(cell.size || 20) * 0.7, 10),
          color,
          alpha: ratio > 0.65 ? 0.36 : 0.22,
          altitudeOffset: 8,
          verticalRadius: 8 + ratio * 42,
        })
      }
      if (index < markerLimit) {
        addDiffusionPlumeMarker(point, Number(cell.concentration || 0), color, ratio)
      }
    })
  if (!runtime) return
  if (shouldApplyLayerPosition.value) {
    focusGeoCenter()
  }
}

function renderMonitoringSensors() {
  clearMonitoringSensors()
  SUPERMAP_CUP_SENSORS.forEach((sensor) => {
    const position = mapPointToSceneCartesian(sensor.mapPoint, sensor.installationHeight + 10)
    if (!position) return
    const color = sensorColor(sensor)
    const entity = viewer.value?.entities?.add({
      name: `监控点 ${sensor.id}`,
      superMapCupSensorId: sensor.id,
      position,
      point: {
        pixelSize: sensor.priority >= 3 ? 13 : 10,
        color: colorFromCss(color, 0.96),
        outlineColor: colorFromCss('#ffffff', 0.9),
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      billboard: shouldApplyLayerPosition.value
        ? {
            image: markerSvgDataUri(color, sensor.priority >= 3 ? 'S' : ''),
            width: sensor.priority >= 3 ? 34 : 28,
            height: sensor.priority >= 3 ? 34 : 28,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }
        : undefined,
      label: sensor.priority >= 3
        ? {
            text: sensor.id,
            font: shouldApplyLayerPosition.value ? '700 15px sans-serif' : '12px sans-serif',
            fillColor: colorFromCss('#ffffff', 0.96),
            outlineColor: colorFromCss('#00111f', 0.86),
            outlineWidth: 3,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          }
        : undefined,
      description: [
        `监控点 ${sensor.id}`,
        `类型: ${sensor.type}`,
        `EPSG:4547: ${sensorProjectedText(sensor)}`,
        `EPSG:4490: ${sensorGeoText(sensor)}`,
        `安装高度: ${sensor.installationHeight.toFixed(1)}m`,
        `有效半径: ${sensor.effectiveRange.toFixed(1)}m`,
      ].join('<br/>'),
    })
    if (entity) sensorEntities.value = [...sensorEntities.value, markExternalObject(entity)]
  })
  selectedSensor.value ||= SUPERMAP_CUP_SENSORS[0] || null
}

function clearMonitoringSensors() {
  const entities = viewer.value?.entities
  if (entities) {
    sensorEntities.value.forEach(entity => entities.remove(entity))
  }
  sensorEntities.value = []
}

function drawParticleOverlay(result: AlgorithmRecord) {
  const estimatedPoint = getEstimatedSourcePoint(result)
  if (!estimatedPoint) throw new Error('粒子滤波结果缺少 estimatedSource.mapPoint')
  addPointEntity(estimatedPoint, '粒子滤波估计源点', '#ffde59', 20)
  drawParticleKdeSurface(result)
  addEllipseEntity(estimatedPoint, {
    title: '95% 置信半径',
    radius: Number(asRecord(result.estimatedSource).credibleRadius95m || 45),
    color: '#ffde59',
    alpha: 0.16,
    altitudeOffset: 8,
    verticalRadius: 2,
  })
}

function drawEvacuationOverlay(result: AlgorithmRecord) {
  const path = resolveRoutePath(result)
  if (!path.length) throw new Error('疏散规划结果缺少路径点')
  routeScreenOverlayPoints.value = path.map(mapPointToRouteScreenPoint)
  const candidateRoutes = Array.isArray(result.candidateRoutes)
    ? result.candidateRoutes.map(asRecord).slice(0, 4)
    : []
  candidateRoutes.forEach((route, index) => {
    const candidatePath = resolveRoutePath(route)
    if (candidatePath.length >= 2) {
      addPolylineEntity(candidatePath, `候选疏散路线 ${index + 1}`, '#7dd3fc', {
        width: 4,
        baseWidth: 7,
        alpha: 0.42,
        altitudeOffset: 118 + index * 5,
      })
    }
  })
  addPolylineEntity(path, '疏散路线', '#52ffb8', {
    altitudeOffset: 145,
  })
  addRouteCorridorEntities(path, '#52ffb8')
  addRouteBeaconEntities(path, '#52ffb8')
  addRouteCenterEntity(path)
  path.forEach((point, index) => {
    addPointEntity(point, `路径节点 ${index + 1}`, '#52ffb8', index === 0 || index === path.length - 1 ? 13 : 10)
  })
  addRouteLabelEntity(path, '疏散路线')
  addPointEntity(path[0], '疏散起点', '#35d2ff', 15)
  addPointEntity(path[path.length - 1], '安全出口', '#52ffb8', 17)
}

function clearAlgorithmOverlays() {
  const entities = viewer.value?.entities
  if (entities) {
    overlayEntities.value.forEach(entity => entities.remove(entity))
  }
  overlayEntities.value = []
  routeScreenOverlayPoints.value = []
  demoTaskState.value = 'idle'
  demoTaskMessage.value = '已清除算法空间图层'
}

function unwrapAlgorithmRecord(response: { ok?: boolean; code?: number; data?: unknown; message?: string | null }, fallback: string) {
  const ok = response.ok === true || response.code === 200
  const data = asRecord(response.data)
  if (!ok || !Object.keys(data).length) {
    throw new Error(response.message || fallback)
  }
  return data
}

function pushEvidence(record: SuperMapCupEvidence) {
  evidenceRecords.value = [record, ...evidenceRecords.value].slice(0, 5)
}

function drawParticleKdeSurface(result: AlgorithmRecord) {
  const densityGeoJson = asRecord(result.posteriorDensityGeoJSON)
  const features = Array.isArray(densityGeoJson.features)
    ? densityGeoJson.features.map(asRecord)
    : []
  if (!features.length) return false
  features.forEach((feature) => {
    const geometry = asRecord(feature.geometry)
    const properties = asRecord(feature.properties)
    if (geometry.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) return
    const ring = Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0] : []
    const positions = ring
      .map(geoJsonCoordinateToSceneCartesian)
      .filter((item): item is unknown => Boolean(item))
    const density = clamp(Number(properties.normalizedDensity || 0), 0, 1)
    addPolygonEntity(
      positions,
      `粒子滤波 KDE 概率地形 ${(density * 100).toFixed(1)}%`,
      density > 0.62 ? '#ff3b30' : density > 0.28 ? '#ffb020' : '#38bdf8',
      Math.max(0.1, Math.min(0.55, 0.12 + density * 0.42)),
      `Python 粒子群 KDE GeoJSON 栅格面，normalizedDensity=${density.toFixed(4)}，Z=${Number(properties.elevationZ || 0).toFixed(2)}m`,
    )
  })
  return true
}

function addPointEntity(point: SuperMapCupMapPoint, title: string, color: string, pixelSize: number) {
  const position = mapPointToSceneCartesian(point, 16)
  if (!position) return
  addEntity({
    name: title,
    position,
    point: {
      pixelSize: shouldApplyLayerPosition.value ? Math.max(pixelSize, 32) : pixelSize,
      color: colorFromCss(color, 0.96),
      outlineColor: colorFromCss('#ffffff', 0.92),
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    billboard: shouldApplyLayerPosition.value
      ? {
          image: markerSvgDataUri(color, title.includes('泄漏') ? '!' : ''),
          width: 52,
          height: 52,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
      : undefined,
    label: {
      text: title,
      font: shouldApplyLayerPosition.value ? '700 20px sans-serif' : '14px sans-serif',
      fillColor: colorFromCss('#ffffff', 0.96),
      outlineColor: colorFromCss('#00111f', 0.86),
      outlineWidth: 3,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    description: `${title}: ${describeMapPoint(point, 16)}`,
  })
}

function addDiffusionPlumeMarker(point: SuperMapCupMapPoint, concentration: number, color: string, ratio: number) {
  const ground = mapPointToSceneCartesian(point, 12)
  const top = mapPointToSceneCartesian(point, 42 + ratio * 78)
  if (!ground || !top) return
  addEntity({
    name: `扩散三维风险柱 ${concentration.toFixed(2)} ppm`,
    position: top,
    point: {
      pixelSize: shouldApplyLayerPosition.value ? 22 + ratio * 28 : 9 + ratio * 18,
      color: colorFromCss(color, 0.92),
      outlineColor: colorFromCss('#ffffff', 0.82),
      outlineWidth: 1.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    billboard: shouldApplyLayerPosition.value && ratio > 0.45
      ? {
          image: markerSvgDataUri(color, concentration.toFixed(0)),
          width: 34 + ratio * 30,
          height: 34 + ratio * 30,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
      : undefined,
    polyline: {
      positions: [ground, top],
      width: 2 + ratio * 3,
      material: colorFromCss(color, 0.68),
    },
    description: `扩散浓度 ${concentration.toFixed(2)} ppm: ${describeMapPoint(point, 42 + ratio * 78)}`,
  })
}

function addEllipseEntity(
  point: SuperMapCupMapPoint,
  options: { title: string; radius: number; color: string; alpha: number; altitudeOffset: number; verticalRadius?: number },
) {
  const verticalRadius = options.verticalRadius ?? 2
  const position = mapPointToSceneCartesian(point, options.altitudeOffset + verticalRadius)
  const radii = sceneRadii(options.radius, verticalRadius)
  if (!position) return
  if (!shouldApplyLayerPosition.value && radii) {
    addEntity({
      name: options.title,
      position,
      ellipsoid: {
        radii,
        material: colorFromCss(options.color, options.alpha),
        outline: true,
        outlineColor: colorFromCss(options.color, Math.min(options.alpha + 0.34, 0.9)),
      },
      description: `${options.title}: ${describeMapPoint(point, options.altitudeOffset)}`,
    })
    return
  }
  const geo = mapPointToGeo(
    point,
    options.altitudeOffset + (shouldApplyLayerPosition.value ? GLOBE_ALGORITHM_ALTITUDE_LIFT : 0),
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
      outlineColor: colorFromCss(options.color, Math.min(options.alpha + 0.34, 0.9)),
    },
    description: `${options.title}: ${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N`,
  })
}

function addPolylineEntity(
  points: SuperMapCupMapPoint[],
  title: string,
  color: string,
  options: { width?: number; baseWidth?: number; alpha?: number; altitudeOffset?: number } = {},
) {
  const altitudeOffset = options.altitudeOffset ?? 28
  const positions = points
    .map((point, index) => mapPointToSceneCartesian(point, altitudeOffset + index * 0.05))
    .filter((item): item is unknown => Boolean(item))
  if (positions.length < 2) return
  addEntity({
    name: `${title}底色`,
    polyline: {
      positions,
      width: options.baseWidth ?? 11,
      material: colorFromCss('#001827', Math.min((options.alpha ?? 0.88) + 0.18, 0.95)),
    },
    description: `${title}底色: 用于增强三维疏散路径截图可读性`,
  })
  addEntity({
    name: title,
    polyline: {
      positions,
      width: options.width ?? 8,
      material: colorFromCss(color, options.alpha ?? 0.98),
    },
    description: `${title}: ${positions.length} 个 ${overlayCoordinateLabel.value}路径点`,
  })
}

function addRouteLabelEntity(points: SuperMapCupMapPoint[], title: string) {
  if (!points.length) return
  const middle = points[Math.floor(points.length / 2)]
  const position = mapPointToSceneCartesian(middle, 178)
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
    const position = mapPointToSceneCartesian(point, 230 + (index % 3) * 5)
    if (!position) return
    addEntity({
      name: `疏散路线箭头 ${index + 1}`,
      position,
      point: {
        pixelSize: index % 3 === 0 ? 22 : 17,
        color: colorFromCss(color, 0.98),
        outlineColor: colorFromCss('#001827', 0.96),
        outlineWidth: 4,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      billboard: {
        image: markerSvgDataUri(color, index % 2 === 0 ? '>>' : ''),
        width: index % 2 === 0 ? 48 : 34,
        height: index % 2 === 0 ? 48 : 34,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: index % 2 === 0 ? `R${index + 1}` : '',
        font: '700 15px sans-serif',
        fillColor: colorFromCss('#ffffff', 0.98),
        outlineColor: colorFromCss('#001827', 0.96),
        outlineWidth: 4,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      description: `疏散路线箭头: ${describeMapPoint(point, 230)}`,
    })
  })
}

function addRouteCorridorEntities(points: SuperMapCupMapPoint[], color: string) {
  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]
    const end = points[index]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy)
    if (length < 1) continue
    const halfWidth = 18
    const nx = -dy / length * halfWidth
    const ny = dx / length * halfWidth
    const ring = [
      { x: start.x + nx, y: start.y + ny },
      { x: end.x + nx, y: end.y + ny },
      { x: end.x - nx, y: end.y - ny },
      { x: start.x - nx, y: start.y - ny },
      { x: start.x + nx, y: start.y + ny },
    ]
    const positions = ring
      .map(point => mapPointToSceneCartesian(point, 132 + index * 0.3))
      .filter((item): item is unknown => Boolean(item))
    addPolygonEntity(
      positions,
      `疏散路线高程走廊 ${index}`,
      color,
      index % 2 === 0 ? 0.48 : 0.58,
      `疏散路线高程走廊 ${index}: ${describeMapPoint(start, 132)} -> ${describeMapPoint(end, 132)}`,
    )
  }
}

function addRouteCenterEntity(points: SuperMapCupMapPoint[]) {
  const center = routeCenter(points)
  if (!center) return
  const position = mapPointToSceneCartesian(center, 270)
  if (!position) return
  addEntity({
    name: '疏散路线中心',
    position,
    point: {
      pixelSize: 24,
      color: colorFromCss('#52ffb8', 0.98),
      outlineColor: colorFromCss('#001827', 0.96),
      outlineWidth: 4,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    billboard: {
      image: markerSvgDataUri('#52ffb8', 'R'),
      width: 58,
      height: 58,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: '疏散路线',
      font: '700 18px sans-serif',
      fillColor: colorFromCss('#eafff6', 0.98),
      outlineColor: colorFromCss('#001827', 0.96),
      outlineWidth: 5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    description: `疏散路线中心: ${describeMapPoint(center, 205)}`,
  })
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
    { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY },
  )
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  }
}

function mapPointToRouteScreenPoint(point: SuperMapCupMapPoint) {
  const map = SUPERMAP_CUP_SCENARIO.map
  const normalizedX = clamp(point.x / map.width, 0, 1)
  const normalizedY = clamp(point.y / map.height, 0, 1)
  return {
    x: 110 + normalizedX * 920,
    y: 76 + normalizedY * 500,
  }
}

function addPolygonEntity(positions: unknown[], title: string, color: string, alpha: number, description: string) {
  if (positions.length < 4) return
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
}

function addEntity(options: Record<string, unknown>) {
  const entity = viewer.value?.entities?.add(options)
  if (entity) overlayEntities.value = [...overlayEntities.value, markExternalObject(entity)]
}

function markExternalObject<T>(value: T): T {
  return value && typeof value === 'object' ? markRaw(value as object) as T : value
}

function geoToCartesian(geo: SuperMapCupGeoPoint) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3?.fromDegrees) return null
  return runtime.Cartesian3.fromDegrees(geo.longitude, geo.latitude, geo.altitude)
}

function mapPointToSceneCartesian(point: SuperMapCupMapPoint, altitudeOffset = 0) {
  if (shouldApplyLayerPosition.value) return geoToCartesian(mapPointToGeo(point, altitudeOffset + GLOBE_ALGORITHM_ALTITUDE_LIFT))
  const runtime = getRuntime()
  const local = mapPointToS3MLocal(point, altitudeOffset)
  return runtime?.Cartesian3 ? new runtime.Cartesian3(local.x, local.y, local.z) : null
}

function geoJsonCoordinateToSceneCartesian(value: unknown) {
  if (!Array.isArray(value) || value.length < 2) return null
  const x = Number(value[0])
  const y = Number(value[1])
  const z = Number(value[2] || 0)
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null
  return mapPointToSceneCartesian({ x, y }, z)
}

function mapPointToS3MLocal(point: SuperMapCupMapPoint, z = 8) {
  const map = SUPERMAP_CUP_SCENARIO.map
  const nx = clamp(point.x / map.width, 0, 1)
  const ny = clamp(point.y / map.height, 0, 1)
  return {
    x: LOCAL_S3M_BOUNDS.left + nx * (LOCAL_S3M_BOUNDS.right - LOCAL_S3M_BOUNDS.left),
    y: LOCAL_S3M_BOUNDS.top - ny * (LOCAL_S3M_BOUNDS.top - LOCAL_S3M_BOUNDS.bottom),
    z,
  }
}

function sceneRadii(radius: number, verticalRadius: number) {
  const runtime = getRuntime()
  if (!runtime?.Cartesian3) return null
  const sceneRadius = mapDistanceToSceneMeters(radius)
  return new runtime.Cartesian3(sceneRadius, sceneRadius, mapDistanceToSceneMeters(verticalRadius))
}

function mapDistanceToSceneMeters(distance: number) {
  if (shouldApplyLayerPosition.value) return distance
  const map = SUPERMAP_CUP_SCENARIO.map
  const sx = (LOCAL_S3M_BOUNDS.right - LOCAL_S3M_BOUNDS.left) / map.width
  const sy = (LOCAL_S3M_BOUNDS.top - LOCAL_S3M_BOUNDS.bottom) / map.height
  return distance * ((sx + sy) / 2)
}

function describeMapPoint(point: SuperMapCupMapPoint, altitudeOffset = 0) {
  if (shouldApplyLayerPosition.value) {
    const geo = mapPointToGeo(point, altitudeOffset + GLOBE_ALGORITHM_ALTITUDE_LIFT)
    return `${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N, ${geo.altitude.toFixed(1)}m`
  }
  const local = mapPointToS3MLocal(point, altitudeOffset)
  const geo = mapPointToGeo(point, altitudeOffset)
  return `local(${local.x.toFixed(1)}, ${local.y.toFixed(1)}, ${local.z.toFixed(1)}) / WGS84业务参考 ${geo.longitude.toFixed(6)}E, ${geo.latitude.toFixed(6)}N`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function colorFromCss(css: string, alpha: number) {
  const runtime = getRuntime()
  const color = runtime?.Color?.fromCssColorString?.(css)
  if (color?.withAlpha) return color.withAlpha(alpha)
  if (color) return color
  return runtime?.Color?.YELLOW?.withAlpha ? runtime.Color.YELLOW.withAlpha(alpha) : undefined
}

function markerSvgDataUri(color: string, label: string) {
  const safeColor = encodeURIComponent(color)
  const safeLabel = encodeURIComponent(label)
  return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='34' fill='${safeColor}' fill-opacity='0.92' stroke='white' stroke-width='7'/%3E%3Ccircle cx='48' cy='48' r='45' fill='none' stroke='${safeColor}' stroke-opacity='0.48' stroke-width='6'/%3E%3Ctext x='48' y='57' text-anchor='middle' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white'%3E${safeLabel}%3C/text%3E%3C/svg%3E`
}

function sensorColor(sensor: SuperMapCupSensor) {
  if (sensor.priority >= 4) return '#ff6b4a'
  if (sensor.priority >= 3) return '#ffb020'
  if (sensor.type.toLowerCase().includes('wind')) return '#35d2ff'
  return '#52ffb8'
}

function sensorProjectedText(sensor: SuperMapCupSensor) {
  const projected = mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & {
    easting?: number
    northing?: number
  }
  return `E=${Number(projected.easting || 0).toFixed(3)}, N=${Number(projected.northing || 0).toFixed(3)}`
}

function sensorGeoText(sensor: SuperMapCupSensor) {
  return `${sensor.geoPoint.longitude.toFixed(6)}E, ${sensor.geoPoint.latitude.toFixed(6)}N`
}

function getEstimatedSourcePoint(result: AlgorithmRecord | null): SuperMapCupMapPoint | null {
  return toMapPoint(asRecord(asRecord(result).estimatedSource).mapPoint)
}

function toMapPoint(value: unknown): SuperMapCupMapPoint | null {
  const record = asRecord(value)
  const x = Number(record.x)
  const y = Number(record.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function getArrayLength(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return Boolean(value && typeof value === 'object' && typeof (value as Promise<unknown>).then === 'function')
}

function setDefaultCamera(runtime: SuperMapRuntime) {
  const camera = defaultCamera.value
  if (!runtime.Cartesian3?.fromDegrees) return
  const destination = runtime.Cartesian3.fromDegrees(camera.longitude, camera.latitude, camera.height)
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

function setupPicking(runtime: SuperMapRuntime) {
  const currentViewer = viewer.value
  if (!currentViewer?.scene.canvas || !runtime.ScreenSpaceEventHandler || !runtime.ScreenSpaceEventType?.LEFT_CLICK) {
    return
  }
  clickHandler.value = markRaw(new runtime.ScreenSpaceEventHandler(currentViewer.scene.canvas))
  clickHandler.value.setInputAction((event) => {
    const picked = currentViewer.scene.pick?.(event.position) as PickedFeature | undefined
    const sensor = resolvePickedSensor(picked)
    if (sensor) {
      selectedSensor.value = sensor
      emit('facility-click', sensor.id)
      emit('scene-object-pick', {
        selectedObjectId: sensor.id,
        selectedObjectName: `监控点 ${sensor.id}`,
        projectedPoint: {
          x: Number((mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & { easting?: number }).easting || 0),
          y: Number((mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & { northing?: number }).northing || 0),
          easting: Number((mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & { easting?: number }).easting || 0),
          northing: Number((mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & { northing?: number }).northing || 0),
          epsg: 4547,
          coordSys: 'CGCS2000_3GK_CM_114E',
        },
        heightMeters: sensor.installationHeight,
        source: 'supermap-iclient3d-monitoring-sensor',
        rawProperties: {
          id: sensor.id,
          type: sensor.type,
          priority: sensor.priority,
          cgcs2000E: Number((mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & { easting?: number }).easting || 0),
          cgcs2000N: Number((mapPointToGeo(sensor.mapPoint, sensor.installationHeight) as SuperMapCupGeoPoint & { northing?: number }).northing || 0),
        },
      })
      return
    }
    const payload = buildScenePickPayload(picked)
    if (!payload) return
    emit('facility-click', payload.selectedObjectId)
    emit('scene-object-pick', payload)
  }, runtime.ScreenSpaceEventType.LEFT_CLICK)
}

function resolvePickedSensor(picked: PickedFeature | undefined) {
  const entity = (picked?.id && typeof picked.id === 'object') ? picked.id as Record<string, unknown> : null
  const sensorId = stringFromUnknown(
    entity?.superMapCupSensorId
    || entity?.id
    || valueFromProperties(collectPickProperties(picked || {}), 'superMapCupSensorId', 'id', 'ID'),
  )
  if (!sensorId) return null
  return SUPERMAP_CUP_SENSORS.find(sensor => sensor.id === sensorId) || null
}

function buildScenePickPayload(picked: PickedFeature | undefined): SuperMapScenePickEventPayload | null {
  if (!picked) return null
  const rawProperties = collectPickProperties(picked)
  const rawId = valueFromProperties(rawProperties, 'SmID', 'id', 'ID', 'name') ?? picked.SmID ?? picked.id
  if (rawId === undefined || rawId === null || rawId === '') return null
  const selectedObjectName = stringFromUnknown(valueFromProperties(rawProperties, 'name', 'NAME', 'label', 'LABEL'))
  return {
    selectedObjectId: String(rawId),
    selectedObjectName: selectedObjectName || undefined,
    projectedPoint: resolveProjectedPoint(rawProperties),
    heightMeters: numberFromUnknown(valueFromProperties(rawProperties, 'heightMeters', 'HEIGHT_METERS', 'height', 'HEIGHT', 'z', 'Z')),
    source: 'supermap-iclient3d-pick',
    rawProperties,
  }
}

function collectPickProperties(picked: PickedFeature) {
  const fields = [
    'SmID',
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
    const value = direct ?? getters.map(getter => getter(field)).find(item => item !== undefined && item !== null)
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      properties[field] = value
    }
  })
  return properties
}

function resolveProjectedPoint(properties: Record<string, string | number | boolean | null>): SuperMapProjectedPoint4547 | null {
  const easting = numberFromUnknown(valueFromProperties(properties, 'cgcs2000E', 'CGCS2000E', 'easting', 'EASTING'))
  const northing = numberFromUnknown(valueFromProperties(properties, 'cgcs2000N', 'CGCS2000N', 'northing', 'NORTHING'))
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

function valueFromProperties(
  properties: Record<string, string | number | boolean | null>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = properties[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

function numberFromUnknown(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function stringFromUnknown(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

async function loadSuperMapRuntime() {
  const existing = getRuntime()
  if (existing) return existing

  await loadCss(sdkStyleUrl.value)
  await loadScript(sdkScriptUrl.value)

  const runtime = await waitForRuntime()
  if (!runtime) {
    throw new Error('SuperMap iClient3D WebGL SDK 未成功注入')
  }
  return runtime
}

function loadCss(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`SuperMap 样式加载失败：${href}`))
    document.head.appendChild(link)
  })
}

function loadScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`SuperMap SDK 加载超时：${src}`))
    }, 30000)
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      window.clearTimeout(timer)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error(`SuperMap SDK 加载失败：${src}`))
    }
    document.head.appendChild(script)
  })
}

function getRuntime() {
  const candidates = [window.SuperMap3D, window.Cesium, window.SuperMap]
  return candidates.find((runtime): runtime is SuperMapRuntime => Boolean(runtime?.Viewer)) || null
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
  clearAlgorithmOverlays()
  clearMonitoringSensors()
  clickHandler.value?.destroy()
  clickHandler.value = null
  viewer.value?.destroy?.()
  viewer.value = null
  primaryS3MLayer.value = null
  if (import.meta.env.DEV && window.__supermapCupDebug) window.__supermapCupDebug.viewer = null
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function resolveLayerName(url: string, index: number) {
  const parts = decodeURIComponent(url).split('/').filter(Boolean)
  const serviceIndex = parts.findIndex((item) => item === 'services')
  const serviceName = serviceIndex >= 0 && parts[serviceIndex + 1] ? parts[serviceIndex + 1] : ''
  const dataIndex = parts.findIndex((item) => item === 'datas')
  const dataName = dataIndex >= 0 && parts[dataIndex + 1] ? parts[dataIndex + 1] : `S3M图层`
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
  if (values.length < 2 || values.some((item) => Number.isNaN(item)) || !isValidGeoCoordinate(values[0], values[1])) {
    return fallback
  }
  return {
    longitude: values[0],
    latitude: values[1],
    height: values[2] ?? defaultPosition.altitude,
  }
}

function isValidGeoCoordinate(longitude: number, latitude: number) {
  return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timer: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) window.clearTimeout(timer)
  })
}

function wait(timeoutMs: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, timeoutMs))
}

async function flyToPrimaryLayer() {
  const currentViewer = viewer.value
  const layer = primaryS3MLayer.value
  if (currentViewer?.flyTo && layer) {
    try {
      await currentViewer.flyTo(layer)
      return
    } catch (error) {
      pushDebugMessage(error instanceof Error ? error.message : 'S3M 图层 flyTo 失败')
    }
  }
  const runtime = getRuntime()
  if (!shouldApplyLayerPosition.value || !runtime?.Cartesian3 || !currentViewer) return
  const destination = new runtime.Cartesian3(LOCAL_S3M_CAMERA.x, LOCAL_S3M_CAMERA.y, LOCAL_S3M_CAMERA.z)
  currentViewer.scene.camera?.setView?.({ destination })
  currentViewer.camera?.setView?.({ destination })
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

.route-screen-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.route-screen-overlay__halo,
.route-screen-overlay__line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-screen-overlay__halo {
  stroke: rgba(0, 20, 28, 0.86);
  stroke-width: 16;
}

.route-screen-overlay__line {
  stroke: rgba(82, 255, 184, 0.95);
  stroke-width: 7;
  stroke-dasharray: 22 12;
}

.route-screen-overlay__dot-halo {
  fill: rgba(0, 20, 28, 0.9);
}

.route-screen-overlay__dot {
  fill: #52ffb8;
  stroke: #ffffff;
  stroke-width: 2;
}

.route-screen-overlay__label {
  fill: #f2fff9;
  font-size: 18px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(0, 20, 28, 0.95);
  stroke-width: 5px;
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
