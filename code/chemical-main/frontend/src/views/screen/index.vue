<template>
  <section
    class="screen-entry"
    :class="{
      'two-d-primary': primaryView === '2d',
      'right-rail-open': primaryView === '3d' && !rightCollapsed,
    }"
  >
    <SuperMapSceneViewer
      ref="sceneViewerRef"
      :show-status-panel="false"
      :show-device-points-2026="true"
      :environment-snapshot="monitoringOverview?.environment || null"
      class="screen-scene"
      @click="switchFromInset('3d')"
      @scene-object-pick="handleSceneObjectPick"
    />

    <aside
      v-if="pickedBuilding || pickedBuildingLoading"
      class="picked-building-panel"
      :class="{ shifted: !rightCollapsed }"
      aria-label="建筑与传感器信息"
    >
      <header class="picked-building-head">
        <strong>空间对象 · 监控信息</strong>
        <button
          type="button"
          class="picked-building-close"
          aria-label="关闭"
          @click="pickedBuilding = null"
        >
          ×
        </button>
      </header>
      <div v-if="pickedBuildingLoading" class="picked-building-loading">
        查询中…
      </div>
      <template v-else-if="pickedBuilding">
        <div class="picked-building-name">{{ pickedBuilding.modelName }}</div>
        <dl class="picked-building-meta">
          <div>
            <dt>设备编号</dt>
            <dd>{{ pickedBuilding.equipmentId }}</dd>
          </div>
          <div>
            <dt>设备类型</dt>
            <dd>{{ pickedBuilding.equipmentType }}</dd>
          </div>
          <div>
            <dt>聚合组件</dt>
            <dd>{{ pickedBuilding.componentCount }} 个</dd>
          </div>
          <div>
            <dt>当前组件</dt>
            <dd>{{ pickedBuilding.componentModelName }}</dd>
          </div>
          <div>
            <dt>已接入点位</dt>
            <dd>{{ pickedBuilding.sensors.length }} 个</dd>
          </div>
        </dl>
        <ul v-if="pickedBuilding.sensors.length" class="picked-sensor-list">
          <li
            v-for="s in pickedBuilding.sensors.slice(0, 12)"
            :key="s.SensorID"
          >
            <span class="ps-id">{{ s.SensorID }}</span>
            <span class="ps-model">{{ s.SensorModel }}</span>
            <span class="ps-props">{{ s.ObservedProps }}</span>
            <span class="ps-status">已接入三维点位</span>
          </li>
        </ul>
        <p v-if="!pickedBuilding.sensors.length" class="picked-sensor-empty">
          该建筑未挂接传感器
        </p>
      </template>
    </aside>

    <SmartMapWorkspace
      ref="smartMapRef"
      class="screen-route-navigation"
      :class="{ shifted: !rightCollapsed }"
      @click="switchFromInset('2d')"
      @source-change="handleUnifiedSourceChange"
      @diffusion-frame="handleUnifiedDiffusionFrame"
      @inversion-stage="handleUnifiedInversionStage"
      @evacuation-route="handleUnifiedEvacuationRoute"
    />

    <header class="screen-title">
      <strong>化工园区应急态势</strong>
      <small>CGCS2000 / EPSG:4490 · SuperMap iClient3D</small>
      <div
        class="weather-strip"
        :class="{ simulated: weatherSourceLabel !== '实况' }"
      >
        <i class="live-dot" aria-hidden="true"></i>
        <span>{{ weatherSourceLabel }}</span>
        <b>{{ weatherSnapshot.windText }}</b>
        <b>{{ weatherSnapshot.temperatureText }}</b>
        <b>{{ weatherSnapshot.humidityText }}</b>
        <em>{{ weatherRefreshText }}</em>
      </div>
    </header>

    <aside
      v-if="primaryView === '3d'"
      class="action-rail"
      :class="{ collapsed: rightCollapsed }"
      aria-label="三维场景操作"
    >
      <button
        type="button"
        class="rail-toggle rail-toggle-right"
        :aria-label="rightCollapsed ? '展开三维场景操作' : '收起三维场景操作'"
        :aria-expanded="!rightCollapsed"
        aria-controls="scene-control-panel"
        @click="rightCollapsed = !rightCollapsed"
      >
        <span>{{ rightCollapsed ? '场景' : '收起' }}</span>
      </button>
      <div
        id="scene-control-panel"
        class="rail-content"
        :aria-hidden="rightCollapsed"
        :inert="rightCollapsed"
      >
        <div class="rail-head">
          <strong>三维场景</strong>
          <button
            type="button"
            class="icon-action"
            @click="callScene('focusScene')"
          >
            全景
          </button>
        </div>
        <div class="scene-model-panel">
          <div class="panel-title">
            <strong>iServer 三维模型</strong>
            <span>最新合并模型</span>
          </div>
          <div class="scene-model-list">
            <button
              v-for="target in sceneModelTargets"
              :key="target.id"
              type="button"
              :class="{
                active: selectedSceneModelIndex === target.index,
                loading: loadingSceneModelIndex === target.index,
              }"
              :disabled="loadingSceneModelIndex !== null"
              :aria-label="`${target.label}${loadingSceneModelIndex === target.index ? '正在加载' : ''}`"
              @click="locateSceneModel(target.index)"
            >
              {{
                loadingSceneModelIndex === target.index
                  ? `${target.label}（加载中）`
                  : target.label
              }}
            </button>
          </div>
        </div>
        <div class="viewpoint-panel">
          <div class="panel-title">
            <strong>视角</strong>
            <button type="button" @click="saveCurrentViewpoint">
              保存当前
            </button>
          </div>
          <div class="viewpoint-list">
            <div
              v-for="viewpoint in cameraViewpoints"
              :key="viewpoint.id"
              class="viewpoint-item"
            >
              <button
                type="button"
                class="viewpoint-apply"
                @click="applyViewpoint(viewpoint.id)"
              >
                <span>{{ viewpoint.name }}</span>
              </button>
              <button
                type="button"
                class="viewpoint-rename"
                @click="renameViewpoint(viewpoint.id)"
              >
                重命名
              </button>
              <button
                type="button"
                class="viewpoint-remove"
                aria-label="删除视角"
                @click="removeViewpoint(viewpoint.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        <div class="portal-actions">
          <button type="button" @click="callScene('reloadScene')">
            重载三维
          </button>
          <button type="button" @click="callScene('clearAlgorithmOverlays')">
            清除结果
          </button>
          <a
            v-if="iportalAvailable"
            :href="iportalUrl"
            target="_blank"
            rel="noreferrer"
          >
            {{
              isLocalIportalDashboard
                ? 'iPortal 大屏（本地）'
                : 'iPortal 大屏（在线）'
            }}
          </a>
          <a
            v-else
            href="/local-iportal-dashboard/"
            target="_blank"
            rel="noreferrer"
            :title="iportalHealthMessage"
          >
            iPortal 大屏（本地静态）
          </a>
        </div>
      </div>
    </aside>

    <SmartMapEmbeddedControls
      class="screen-algorithm-bar"
      :source-id="embeddedSourceId"
      :current-frame="embeddedFrame"
      :frame-count="embeddedFrameCount"
      :is-playing="embeddedPlaying"
      :is-diffusion-running="embeddedRunning"
      :has-evacuation-route="Boolean(embeddedEvacuationRoute)"
      :destination-id="embeddedDestinationId"
      :evacuation-destinations="embeddedEvacuationDestinations"
      :is-tracing-running="embeddedTracingRunning"
      @update:source-id="selectEmbeddedSourceFromBar"
      @update:destination-id="selectEmbeddedDestinationFromBar"
      @run-diffusion="runDiffusionFromBar"
      @toggle-playback="() => smartMapRef?.toggleDiffusionPlayback()"
      @run-evacuation="() => smartMapRef?.runEvacuation(embeddedDestinationId)"
      @run-leak-tracing="runLeakTracingFromBar"
      @add-sensor="() => smartMapRef?.addSensor()"
      @clear-results="clearResultsFromBar"
    />
    <EmergencyAiAssistant />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { meteorologicalWindFromToTransportDegrees } from '@/utils/weatherWindDirection'
import {
  reqMonitoringOverview,
  type EnvironmentSnapshot,
  type MonitoringOverview,
} from '@/api/monitoringData'
import SuperMapSceneViewer from '@/components/SuperMapSceneViewer.vue'
import {
  buildSuperMapCupDiffusionPayload,
  type SuperMapCupMapPoint,
} from '@/data/supermapCupScenario'
import {
  DEFAULT_EMERGENCY_SOURCE_ID,
  type EmergencyMapPoint,
} from '@/data/emergencyMapAnchors'
import SmartMapWorkspace from './map-workspace/index.vue'
import SmartMapEmbeddedControls from './map-workspace/components/SmartMapEmbeddedControls.vue'
import EmergencyAiAssistant from '@/components/EmergencyAiAssistant.vue'
import {
  ENTRANCE_ANCHORS_4490,
  SCENE_DEFINITIONS,
} from '@/config/spatialAssets'
import type { SmartMapDiffusionFrame } from './map-workspace/useSmartMapDiffusionLayer'
import type {
  SmartMapSourceCandidateRegion,
  SmartMapSourceRefinementIteration,
} from './map-workspace/useSmartMapSourceInversionOverlay'
import {
  footprintSummary,
  queryDevicePointBySensorId,
  queryDevicePointsByBounds,
  queryDevicePointsByModelName,
  queryEquipmentAssemblyByModelName,
  queryEquipmentAssemblyBySmId,
  queryFootprintAtPoint,
  queryFootprintsByModelName,
  queryNearestDevicePoints,
  queryNearestFootprints,
  queryPublishedModelAttributesBySmId,
  type GeoFeature,
} from '@/utils/clientSpatialQuery'
import type { SuperMapScenePickEventPayload } from '@/types/supermap-scene-events'

defineOptions({
  name: 'SuperMapScreenEntry',
})

type SceneViewerExpose = {
  focusScene: () => void | Promise<void>
  focusS3MLayer: (index: number) => void | Promise<void>
  reloadScene: () => void | Promise<void>
  clearAlgorithmOverlays: () => void | Promise<void>
  selectFixedLeakSource: (point: SuperMapCupMapPoint, label: string) => void
  renderUnifiedDiffusionFrame: (payload: UnifiedDiffusionFramePayload) => void
  renderUnifiedInversionStage: (payload: UnifiedInversionStagePayload) => void
  renderUnifiedEvacuationRoute: (
    payload: UnifiedEvacuationRoutePayload | null,
  ) => void
  captureCameraView: () => LocalCameraSnapshot | null
  applyCameraView: (snapshot: LocalCameraSnapshot) => boolean
  setSceneProjectionMode: (mode: '2d' | '3d') => boolean | Promise<boolean>
}

type SceneCommandName = 'focusScene' | 'reloadScene' | 'clearAlgorithmOverlays'
type LocalCameraSnapshot = {
  position: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  up?: { x: number; y: number; z: number }
  coordinateSpace?: 'ecef' | 'local-s3m'
}
type CameraViewpoint = {
  id: string
  name: string
  snapshot: LocalCameraSnapshot
}
type UnifiedDiffusionFramePayload = {
  frame: SmartMapDiffusionFrame | null
  frameIndex: number
  frameCount: number
  source: EmergencyMapPoint | null
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
  estimatedPoint: EmergencyMapPoint | null
  credibleRadius95m?: number | null
  posteriorDensityGeoJSON?: Record<string, unknown> | null
  posteriorParticles?: Array<Record<string, unknown>> | null
}
type UnifiedEvacuationRoutePayload = {
  path?: EmergencyMapPoint[]
  candidateRoutes?: UnifiedEvacuationRoutePayload[]
  isReachable?: boolean
  exitLabel?: string
  exitId?: string
  selectedExitId?: string
  distanceMeters?: number
  estimatedTimeSec?: number
  planner?: string
  [key: string]: unknown
}

const sceneViewerRef = ref<SceneViewerExpose | null>(null)
const smartMapRef = ref<InstanceType<typeof SmartMapWorkspace> | null>(null)
const selectedSceneModelIndex = ref<number | null>(null)
const loadingSceneModelIndex = ref<number | null>(null)
const rightCollapsed = ref(true)
// 顶层浮动算法控制条状态：由数字园区二维工作区的只读 diffusionStatus 同步驱动。
const embeddedSourceId = ref<string>(DEFAULT_EMERGENCY_SOURCE_ID)
const embeddedFrame = ref(0)
const embeddedFrameCount = ref(0)
const embeddedPlaying = ref(false)
const embeddedRunning = ref(false)
const embeddedEvacuationRoute = ref<UnifiedEvacuationRoutePayload | null>(null)
const embeddedDestinationId = ref('')
const embeddedTracingRunning = ref(false)
const monitoringOverview = ref<MonitoringOverview | null>(null)
const cameraViewpoints = ref<CameraViewpoint[]>([])
const weatherLastRefreshAt = ref<Date | null>(null)
const weatherNowTick = ref(Date.now())
let weatherRefreshTimer: number | undefined
let weatherTickTimer: number | undefined
let primaryViewpointTimer: number | undefined
let primaryViewpointRetryTimer: number | undefined
let diffusionRenderAnimationFrame: number | null = null
let pendingDiffusionRenderPayload: UnifiedDiffusionFramePayload | null = null
let lastRenderedDiffusionFrame: SmartMapDiffusionFrame | null = null
const sceneModelTargets = SCENE_DEFINITIONS.map((definition, index) => ({
  id: definition.id,
  index,
  label: index === 0 ? '最新合并场景' : definition.name,
}))
const embeddedEvacuationDestinations = ENTRANCE_ANCHORS_4490.map(
  (entrance) => ({ id: entrance.entranceId, label: entrance.name }),
)
// 默认以三维应急场景为主屏，二维作为右上角可点击副屏。
const primaryView = ref<'2d' | '3d'>('3d')
const isSceneModeSwitching = ref(false)

// 点击三维建筑 → 查询建筑信息 + 挂接传感器（客户端 GeoJSON 查询，绕开 iServer beta 坏查询）
interface PickedSensorBrief {
  SensorID: string
  SensorModel: string
  ObservedProps: string
}
interface PickedBuilding {
  equipmentId: string
  equipmentType: string
  componentCount: number
  componentModelName: string
  modelName: string
  sensors: PickedSensorBrief[]
}
const pickedBuilding = ref<PickedBuilding | null>(null)
const pickedBuildingLoading = ref(false)
let pickedBuildingQuerySequence = 0

async function handleSceneObjectPick(payload: SuperMapScenePickEventPayload) {
  const querySequence = ++pickedBuildingQuerySequence
  const pickedId = payload.selectedObjectId || ''
  if (!pickedId) {
    pickedBuilding.value = null
    pickedBuildingLoading.value = false
    return
  }
  const rawSensorId = String(payload.rawProperties.SensorID ?? '').trim()
  const sensorId = rawSensorId || pickedId.replace(/^devicepoint-/, '')
  pickedBuildingLoading.value = true
  try {
    const isDevicePoint =
      Boolean(rawSensorId) || pickedId.startsWith('devicepoint-')
    const selectedSensorFeature = isDevicePoint
      ? await queryDevicePointBySensorId(sensorId)
      : null
    const selectedSensorModelName = String(
      selectedSensorFeature?.properties.ModelName ?? '',
    ).trim()
    const pickedSmId = Number(
      payload.rawProperties.PickedSmID ??
        payload.rawProperties.SmID ??
        payload.rawProperties.ModelSmID ??
        payload.rawProperties.ComponentSmID ??
        pickedId,
    )
    const publishedModelAttributes = Number.isInteger(pickedSmId)
      ? await queryPublishedModelAttributesBySmId(pickedSmId)
      : null
    const pickedModelName = String(
      publishedModelAttributes?.modelName ||
        payload.rawProperties.ModelName ||
        payload.rawProperties.ComponentModelName ||
        '',
    ).trim()
    const usablePickedModelName =
      pickedModelName && !/^\d+$/.test(pickedModelName) ? pickedModelName : ''
    const pickedName = String(payload.selectedObjectName ?? '').trim()
    const usablePickedName =
      usablePickedModelName ||
      (pickedName && !/^\d+$/.test(pickedName) ? pickedName : '')
    const equipmentAssembly = usablePickedName
      ? await queryEquipmentAssemblyByModelName(usablePickedName)
      : Number.isInteger(pickedSmId)
        ? await queryEquipmentAssemblyBySmId(pickedSmId)
        : null
    const projectedPoint = payload.projectedPoint
    let footprint: GeoFeature | null = null
    if (selectedSensorModelName) {
      const matches = await queryFootprintsByModelName(selectedSensorModelName)
      footprint = matches[0] ?? null
    }
    if (!footprint && projectedPoint) {
      footprint = await queryFootprintAtPoint(
        projectedPoint.easting,
        projectedPoint.northing,
      )
    }
    if (!footprint && usablePickedName) {
      const matches = await queryFootprintsByModelName(usablePickedName)
      footprint = matches[0] ?? null
    }
    if (!footprint && projectedPoint) {
      const nearest = await queryNearestFootprints(
        projectedPoint.easting,
        projectedPoint.northing,
        1,
      )
      if ((nearest[0]?.distance ?? Number.POSITIVE_INFINITY) <= 30) {
        footprint = nearest[0]
      }
    }
    const summary = footprint ? footprintSummary(footprint) : null
    const equipmentId = String(
      payload.rawProperties.EquipmentID ??
        equipmentAssembly?.equipmentId ??
        pickedId,
    ).trim()
    const equipmentType = String(
      publishedModelAttributes?.deviceType ||
        payload.rawProperties.EquipmentType ||
        equipmentAssembly?.equipmentType ||
        'SPACE_OBJECT',
    ).trim()
    const componentCount = Number(
      payload.rawProperties.ComponentCount ??
        equipmentAssembly?.componentCount ??
        (summary ? 1 : 0),
    )
    const componentModelName = String(
      usablePickedModelName ||
        payload.rawProperties.ComponentModelName ||
        equipmentAssembly?.selectedModelName ||
        selectedSensorModelName ||
        usablePickedName ||
        pickedId,
    ).trim()
    const modelName =
      selectedSensorModelName ||
      usablePickedModelName ||
      String(payload.rawProperties.PrimaryModelName ?? '').trim() ||
      equipmentAssembly?.primaryModelName ||
      summary?.modelName ||
      usablePickedName ||
      `对象 ${pickedId}`
    let sensors = modelName ? await queryDevicePointsByModelName(modelName) : []
    if (!sensors.length && summary) {
      const footprintWidth = summary.s3mRight - summary.s3mLeft
      const footprintHeight = summary.s3mTop - summary.s3mBottom
      const isBroadFootprint =
        footprintWidth > 120 ||
        footprintHeight > 120 ||
        footprintWidth * footprintHeight > 10000
      if (isBroadFootprint && projectedPoint) {
        const nearbySensors = await queryNearestDevicePoints(
          projectedPoint.easting,
          projectedPoint.northing,
          12,
        )
        sensors = nearbySensors.filter((feature) => feature.distance <= 36)
      } else {
        sensors = await queryDevicePointsByBounds({
          left: summary.s3mLeft - 1,
          right: summary.s3mRight + 1,
          bottom: summary.s3mBottom - 1,
          top: summary.s3mTop + 1,
        })
      }
    }
    if (!sensors.length && projectedPoint) {
      const nearbySensors = await queryNearestDevicePoints(
        projectedPoint.easting,
        projectedPoint.northing,
        8,
      )
      sensors = nearbySensors.filter((feature) => feature.distance <= 24)
    }
    if (
      selectedSensorFeature &&
      !sensors.some(
        (feature) => String(feature.properties.SensorID ?? '') === sensorId,
      )
    ) {
      sensors = [selectedSensorFeature, ...sensors]
    }
    const boundedSensors = Array.from(
      new Map(
        sensors.map((feature) => [
          String(feature.properties.SensorID ?? ''),
          feature,
        ]),
      ).values(),
    ).slice(0, 12)
    if (querySequence !== pickedBuildingQuerySequence) return
    pickedBuilding.value = {
      equipmentId,
      equipmentType,
      componentCount: Number.isFinite(componentCount) ? componentCount : 1,
      componentModelName,
      modelName,
      sensors: boundedSensors.map((f) => {
        const p = f.properties as Record<string, unknown>
        return {
          SensorID: String(p.SensorID ?? ''),
          SensorModel: String(p.SensorModel ?? ''),
          ObservedProps: String(p.ObservedProps ?? ''),
        }
      }),
    }
  } catch (error) {
    console.warn('设备级空间查询失败', error)
    if (querySequence === pickedBuildingQuerySequence) {
      pickedBuilding.value = null
    }
  } finally {
    if (querySequence === pickedBuildingQuerySequence) {
      pickedBuildingLoading.value = false
    }
  }
}
const fallbackWeather = buildSuperMapCupDiffusionPayload()
const iportalUrl =
  import.meta.env.VITE_IPORTAL_DASHBOARD_URL ||
  'http://127.0.0.1:8190/iportal/'
const isLocalIportalDashboard = iportalUrl.startsWith(
  '/local-iportal-dashboard',
)
const iportalAvailable = ref(false)
const iportalHealthMessage = ref('正在检查 iPortal')

async function checkIportalHealth() {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(iportalUrl, {
      cache: 'no-store',
      signal: controller.signal,
    })
    const contentType = response.headers.get('content-type') || ''
    const bodyPrefix = (await response.text()).slice(0, 4096).toLowerCase()
    const isDashboardHtml =
      response.ok &&
      contentType.toLowerCase().includes('text/html') &&
      (bodyPrefix.includes('mapdashboard') || bodyPrefix.includes('iportal'))
    iportalAvailable.value = isDashboardHtml
    iportalHealthMessage.value = isDashboardHtml
      ? 'iPortal 大屏可用'
      : `iPortal 未返回有效大屏页面（HTTP ${response.status}），继续使用 /screen`
  } catch {
    iportalAvailable.value = false
    iportalHealthMessage.value = 'iPortal 上游无有效响应，继续使用 /screen'
  } finally {
    window.clearTimeout(timeout)
  }
}

const weatherSnapshot = computed(() => {
  const env = monitoringOverview.value?.environment
  const hasWeather = Boolean(env?.available)
  const windSpeed = numberOrFallback(
    hasWeather ? env?.windSpeed : null,
    fallbackWeather.windSpeed,
    3.6,
  )
  const windDirection = numberOrFallback(
    hasWeather ? env?.windDirection : null,
    fallbackWeather.windDirection,
    25,
  )
  const temperature = numberOrFallback(
    hasWeather ? env?.temperature : null,
    fallbackWeather.ambientTemperature,
    28,
  )
  const humidity = numberOrFallback(
    hasWeather ? env?.humidity : null,
    fallbackWeather.humidity,
    58,
  )
  const windDirectionText =
    hasWeather && env?.windDirectionText
      ? env.windDirectionText
      : `${Math.round(windDirection)}°`

  return {
    source: env?.source || null,
    windText: `${windDirectionText} ${windSpeed.toFixed(1)}m/s`,
    temperatureText: `${temperature.toFixed(1)}℃`,
    humidityText: `${Math.round(humidity)}%RH`,
  }
})

function numberOrFallback(
  value: unknown,
  fallback: unknown,
  defaultValue: number,
) {
  const parsed = Number(value ?? fallback ?? defaultValue)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

const weatherSourceLabel = computed(() => {
  const source = weatherSnapshot.value.source || ''
  if (source.startsWith('qweather:')) return '实况'
  if (monitoringOverview.value?.environment?.available) return '环境'
  return '模拟'
})

const weatherRefreshText = computed(() => {
  const observedAt = monitoringOverview.value?.environment?.observedAt
  const observedText = formatWeatherTime(observedAt)
  const refreshedAt = weatherLastRefreshAt.value?.getTime()
  if (!refreshedAt) return observedText || '等待刷新'
  const elapsedSeconds = Math.max(
    0,
    Math.floor((weatherNowTick.value - refreshedAt) / 1000),
  )
  const refreshText =
    elapsedSeconds < 10
      ? '刚刚刷新'
      : elapsedSeconds < 60
        ? `${elapsedSeconds}s刷新`
        : `${Math.floor(elapsedSeconds / 60)}min刷新`
  return observedText ? `${observedText} · ${refreshText}` : refreshText
})

onMounted(() => {
  document.title = '化工园区应急态势'
  cameraViewpoints.value = loadStoredJson<CameraViewpoint[]>(
    'supermap-cup-camera-viewpoints',
    [],
  )
  schedulePrimaryViewpoint()
  void loadWeatherOverview()
  void checkIportalHealth()
  weatherRefreshTimer = window.setInterval(() => {
    void loadWeatherOverview()
  }, 60000)
  weatherTickTimer = window.setInterval(() => {
    weatherNowTick.value = Date.now()
  }, 5000)
})

onBeforeUnmount(() => {
  if (weatherRefreshTimer !== undefined)
    window.clearInterval(weatherRefreshTimer)
  if (weatherTickTimer !== undefined) window.clearInterval(weatherTickTimer)
  if (primaryViewpointTimer !== undefined)
    window.clearTimeout(primaryViewpointTimer)
  if (primaryViewpointRetryTimer !== undefined)
    window.clearTimeout(primaryViewpointRetryTimer)
  if (diffusionRenderAnimationFrame !== null)
    window.cancelAnimationFrame(diffusionRenderAnimationFrame)
})

watch(
  cameraViewpoints,
  (value) => saveStoredJson('supermap-cup-camera-viewpoints', value),
  { deep: true },
)

// 天气请求通常早于副屏组件挂载完成；副屏一就绪就补同步，消除首轮模拟使用默认风场的竞态。
watch(smartMapRef, () => syncRealtimeWeatherToDiffusion(), { flush: 'post' })

async function loadWeatherOverview() {
  try {
    const res = await reqMonitoringOverview()
    // 后端概览可用且 environment.available=true 时才采用；否则降级到和风直连。
    // 后端 source="not_configured" 时 available=false，需继续走和风兜底。
    if (res.code === 200 && res.data && res.data.environment?.available) {
      monitoringOverview.value = res.data
      weatherLastRefreshAt.value = new Date()
      weatherNowTick.value = Date.now()
      syncRealtimeWeatherToDiffusion()
      return
    }
  } catch {
    // 未登录时后端概览可能返回 401，大屏继续用和风实况兜底。
  }
  // 后端天气不可用，前端直连和风 API 获取实况。
  const qWeatherOverview = await loadQWeatherOverview()
  if (qWeatherOverview) {
    monitoringOverview.value = qWeatherOverview
  }
  weatherLastRefreshAt.value = new Date()
  weatherNowTick.value = Date.now()
  syncRealtimeWeatherToDiffusion()
}

// 将实时天气（后端概览或和风实况）同步到副屏扩散表单，确保扩散算法用真实气象参数。
function syncRealtimeWeatherToDiffusion() {
  const env = monitoringOverview.value?.environment
  if (!env?.available) return
  smartMapRef.value?.applyRealtimeWeather({
    windSpeed: env.windSpeed,
    // 页面仍展示气象“来向”；算法输入必须使用气团“去向”。
    windDirection: Number.isFinite(env.windDirection)
      ? meteorologicalWindFromToTransportDegrees(env.windDirection as number)
      : env.windDirection,
    temperature: env.temperature,
    humidity: env.humidity,
  })
}

async function loadQWeatherOverview(): Promise<MonitoringOverview | null> {
  const key = String(import.meta.env.VITE_QWEATHER_API_KEY || '').trim()
  const rawHost = String(import.meta.env.VITE_QWEATHER_API_HOST || '').trim()
  const location = String(
    import.meta.env.VITE_QWEATHER_LOCATION || '113.6650,34.7178',
  ).trim()
  if (!key || !rawHost) return null
  // 开发环境经同源 Vite 代理访问和风，规避浏览器 CORS 与桌面代理对直连请求的影响。
  const weatherApiBase = import.meta.env.DEV
    ? '/qweather-api'
    : rawHost.startsWith('http')
      ? rawHost
      : `https://${rawHost}`
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)
  try {
    const response = await fetch(
      `${weatherApiBase.replace(/\/$/, '')}/v7/weather/now?location=${encodeURIComponent(location)}&key=${encodeURIComponent(key)}`,
      {
        signal: controller.signal,
      },
    )
    const payload = await response.json()
    const now = payload?.now || {}
    if (payload?.code !== '200') return null
    const environment: EnvironmentSnapshot = {
      available: true,
      windSpeed: numberOrNull(now.windSpeed),
      windDirection: numberOrNull(now.wind360),
      windDirectionText: now.windDir || null,
      temperature: numberOrNull(now.temp),
      humidity: numberOrNull(now.humidity),
      pressure: numberOrNull(now.pressure),
      noise: null,
      sensorCount: 0,
      onlineSensorCount: 0,
      averageRisk: 0,
      maxRisk: 0,
      warningCarCount: 0,
      observedAt: now.obsTime || payload.updateTime || null,
      source: `qweather:${location}`,
    }
    return {
      environment,
      concentrationTrend: [],
      latestReadings: [],
      weatherText: `${now.text || '实况'} ${environment.windDirectionText || ''} ${environment.windSpeed ?? '--'}m/s`,
      activeWarningCount: 0,
    }
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function numberOrNull(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatWeatherTime(value: unknown) {
  if (!value) return ''
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return ''
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}观测`
}

function handleUnifiedSourceChange(payload: {
  id: string
  label: string
  point: EmergencyMapPoint
}) {
  embeddedSourceId.value = payload.id
  sceneViewerRef.value?.selectFixedLeakSource(payload.point, payload.label)
}

function handleUnifiedDiffusionFrame(payload: UnifiedDiffusionFramePayload) {
  // 同步副屏扩散状态到顶层浮动控制条，驱动帧进度与按钮 disabled 态。
  embeddedFrame.value = payload.frameIndex
  embeddedFrameCount.value = payload.frameCount
  embeddedPlaying.value = payload.isPlaying
  embeddedRunning.value = false
  pendingDiffusionRenderPayload = payload
  if (!payload.isPlaying) {
    if (diffusionRenderAnimationFrame !== null) {
      window.cancelAnimationFrame(diffusionRenderAnimationFrame)
      diffusionRenderAnimationFrame = null
    }
    if (payload.frame === lastRenderedDiffusionFrame) return
  }
  if (diffusionRenderAnimationFrame !== null) return
  diffusionRenderAnimationFrame = window.requestAnimationFrame(() => {
    diffusionRenderAnimationFrame = null
    const nextPayload = pendingDiffusionRenderPayload
    pendingDiffusionRenderPayload = null
    if (nextPayload?.frame) {
      sceneViewerRef.value?.renderUnifiedDiffusionFrame(nextPayload)
      lastRenderedDiffusionFrame = nextPayload.frame
    }
  })
}

function handleUnifiedInversionStage(payload: UnifiedInversionStagePayload) {
  sceneViewerRef.value?.renderUnifiedInversionStage(payload)
}

function handleUnifiedEvacuationRoute(
  payload: UnifiedEvacuationRoutePayload | null,
) {
  embeddedEvacuationRoute.value = payload
  sceneViewerRef.value?.renderUnifiedEvacuationRoute(payload)
}

// 顶层浮动控制条：泄漏源切换。二维工作区会 emit source-change 回写到 embeddedSourceId。
function selectEmbeddedSourceFromBar(sourceId: string) {
  embeddedSourceId.value = sourceId
  smartMapRef.value?.selectSource(sourceId)
}

function selectEmbeddedDestinationFromBar(destinationId: string) {
  embeddedDestinationId.value = destinationId
  smartMapRef.value?.selectEvacuationDestination(destinationId)
}

async function runLeakTracingFromBar() {
  if (embeddedTracingRunning.value) return
  embeddedTracingRunning.value = true
  try {
    await smartMapRef.value?.runLeakTracing()
  } finally {
    embeddedTracingRunning.value = false
  }
}

// 顶层浮动控制条：启动扩散模拟，并在成功或失败后统一释放按钮状态。
async function runDiffusionFromBar() {
  if (embeddedRunning.value) return
  // 每次运行前锁定当前和风快照，避免表单保留旧气象条件。
  syncRealtimeWeatherToDiffusion()
  embeddedRunning.value = true
  try {
    await smartMapRef.value?.runDiffusion()
  } finally {
    embeddedRunning.value = false
  }
}

// 顶层浮动控制条：清除扩散/溯源/疏散结果。
function clearResultsFromBar() {
  if (diffusionRenderAnimationFrame !== null) {
    window.cancelAnimationFrame(diffusionRenderAnimationFrame)
    diffusionRenderAnimationFrame = null
  }
  pendingDiffusionRenderPayload = null
  embeddedFrame.value = 0
  embeddedFrameCount.value = 0
  embeddedPlaying.value = false
  embeddedRunning.value = false
  embeddedEvacuationRoute.value = null
  lastRenderedDiffusionFrame = null
  smartMapRef.value?.clearResults()
  sceneViewerRef.value?.clearAlgorithmOverlays()
}

async function setPrimaryView(view: '2d' | '3d') {
  if (isSceneModeSwitching.value || view === primaryView.value) return
  isSceneModeSwitching.value = true
  try {
    primaryView.value = view
    await nextTick()
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 380)
  } finally {
    isSceneModeSwitching.value = false
  }
}

function switchFromInset(view: '2d' | '3d') {
  if (primaryView.value !== view) void setPrimaryView(view)
}

function callScene(method: SceneCommandName) {
  void sceneViewerRef.value?.[method]?.()
}

function locateSceneModel(index: number) {
  const focusLayer = sceneViewerRef.value?.focusS3MLayer
  if (!focusLayer) return
  selectedSceneModelIndex.value = index
  loadingSceneModelIndex.value = index
  void Promise.resolve(focusLayer(index)).finally(() => {
    if (loadingSceneModelIndex.value === index) {
      loadingSceneModelIndex.value = null
    }
  })
}

function saveCurrentViewpoint() {
  const snapshot = sceneViewerRef.value?.captureCameraView?.()
  if (!snapshot) return
  const name = `视角 ${cameraViewpoints.value.length + 1}`
  cameraViewpoints.value = [
    ...cameraViewpoints.value,
    { id: `VIEW-${Date.now().toString(36).toUpperCase()}`, name, snapshot },
  ]
}

function applyViewpoint(id: string) {
  const viewpoint = cameraViewpoints.value.find((item) => item.id === id)
  if (!viewpoint) return
  void sceneViewerRef.value?.applyCameraView?.(viewpoint.snapshot)
}

function renameViewpoint(id: string) {
  const viewpoint = cameraViewpoints.value.find((item) => item.id === id)
  if (!viewpoint) return
  const nextName = window.prompt('请输入视角名称', viewpoint.name)?.trim()
  if (!nextName) return
  cameraViewpoints.value = cameraViewpoints.value.map((item) =>
    item.id === id ? { ...item, name: nextName.slice(0, 32) } : item,
  )
}

function schedulePrimaryViewpoint() {
  const primary =
    cameraViewpoints.value.find((viewpoint) => viewpoint.name === '视角 1') ||
    cameraViewpoints.value[0]
  if (!primary) return
  const applyPrimary = () =>
    sceneViewerRef.value?.applyCameraView?.(primary.snapshot) || false
  // 等待 3D Tiles 初始全景相机落定后再应用用户保存的“视角 1”。
  primaryViewpointTimer = window.setTimeout(applyPrimary, 1200)
  primaryViewpointRetryTimer = window.setTimeout(applyPrimary, 2600)
}

function removeViewpoint(id: string) {
  cameraViewpoints.value = cameraViewpoints.value.filter(
    (item) => item.id !== id,
  )
}

function loadStoredJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function saveStoredJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 可能被浏览器策略禁用，编辑态继续在内存中可用。
  }
}
</script>

<style scoped>
.screen-entry {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0c1117;
  color: #e8f1f8;
  font-family: 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
}

.screen-scene {
  position: absolute;
  inset: 0;
  z-index: 1;
  transition:
    top 360ms cubic-bezier(0.22, 1, 0.36, 1),
    right 360ms cubic-bezier(0.22, 1, 0.36, 1),
    bottom 360ms cubic-bezier(0.22, 1, 0.36, 1),
    left 360ms cubic-bezier(0.22, 1, 0.36, 1),
    width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    height 360ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 360ms ease;
}

.screen-route-navigation {
  position: absolute;
  top: 70px;
  right: 16px;
  z-index: 9;
  width: min(320px, calc(100vw - 36px));
  height: min(200px, calc(100vh - 128px));
  overflow: hidden;
  border: 1px solid rgba(103, 151, 169, 0.34);
  border-radius: 12px;
  background: rgba(7, 17, 25, 0.86);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
  transition:
    top 360ms cubic-bezier(0.22, 1, 0.36, 1),
    right 360ms cubic-bezier(0.22, 1, 0.36, 1),
    bottom 360ms cubic-bezier(0.22, 1, 0.36, 1),
    left 360ms cubic-bezier(0.22, 1, 0.36, 1),
    width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    height 360ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 360ms ease;
  cursor: pointer;
}

.two-d-primary .screen-route-navigation {
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  cursor: default;
}

.two-d-primary .screen-scene {
  top: 70px;
  right: 16px;
  bottom: auto;
  left: auto;
  z-index: 10;
  width: min(320px, calc(100vw - 36px));
  height: min(200px, calc(100vh - 128px));
  overflow: hidden;
  border: 1px solid rgba(103, 151, 169, 0.34);
  border-radius: 12px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
  cursor: pointer;
}

/* 三维主屏模式下，副屏小框内的传感器布设弹层无意义（副屏仅作预览），隐藏避免遮挡。
   算法控制条已由 screen 顶层 .screen-algorithm-bar 接管，副屏内不再渲染 .embedded-controls。 */
.screen-entry:not(.two-d-primary)
  .screen-route-navigation
  :deep(.embedded-sensor-panel) {
  display: none;
}

.screen-route-navigation.shifted {
  right: 282px;
}

.two-d-primary .screen-route-navigation.shifted {
  right: 0;
}

.screen-title,
.sensor-rail,
.action-rail {
  position: absolute;
  z-index: 8;
  box-sizing: border-box;
}

.screen-title {
  top: 14px;
  right: 16px;
  left: 18px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 12px;
  max-width: none;
  pointer-events: none;
  text-align: left;
}

.screen-title strong {
  color: #f4f8fb;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.48);
  white-space: nowrap;
}

.screen-title small {
  min-width: 0;
  overflow: hidden;
  color: #8b9aa8;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.weather-strip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 26px;
  padding: 2px 10px;
  border: 1px solid rgba(123, 156, 171, 0.22);
  border-radius: 9px;
  background: rgba(10, 23, 32, 0.78);
  color: #c9d7e2;
  font-size: 12px;
  line-height: 26px;
  white-space: nowrap;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 99px;
  background: #2f9e68;
  animation: livePulse 1.4s ease-out infinite;
}

.weather-strip span {
  color: #4ba3ff;
  font-weight: 700;
}

.weather-strip.simulated span {
  color: #c99538;
}

.weather-strip b,
.weather-strip em {
  color: #e6edf3;
  font-style: normal;
  font-weight: 700;
}

.weather-strip em {
  color: #9aa8b5;
}

.weather-strip.simulated .live-dot {
  background: #c99538;
}

@keyframes livePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(47, 158, 104, 0.42);
  }

  80% {
    box-shadow: 0 0 0 8px rgba(47, 158, 104, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(47, 158, 104, 0);
  }
}

.sensor-rail,
.action-rail {
  top: 70px;
  bottom: 58px;
  width: 250px;
  overflow: hidden;
  border: 1px solid rgba(123, 156, 171, 0.2);
  border-radius: 12px;
  background: rgba(10, 23, 32, 0.82);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 18px 36px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.sensor-rail {
  left: 16px;
}

.action-rail {
  right: 16px;
}

.sensor-rail.collapsed {
  transform: translateX(calc(-100% + 40px));
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.action-rail.collapsed {
  transform: translateX(calc(100% - 40px));
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}

.rail-content {
  height: 100%;
  transition: opacity 140ms ease;
}

.sensor-rail .rail-content {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
}

.action-rail .rail-content {
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-color: rgba(78, 104, 130, 0.8) rgba(255, 255, 255, 0.05);
  scrollbar-width: thin;
}

.sensor-rail.collapsed .rail-content,
.action-rail.collapsed .rail-content {
  opacity: 0;
  pointer-events: none;
}

.rail-toggle {
  position: absolute;
  top: 10px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 28px;
  padding: 0 9px;
  border: 1px solid rgba(45, 127, 249, 0.42);
  border-radius: 3px;
  background: #1e2730;
  color: #cfe4ff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.rail-toggle-left {
  right: 48px;
}

.rail-toggle-right {
  right: 48px;
}

.sensor-rail.collapsed .rail-toggle,
.action-rail.collapsed .rail-toggle {
  top: 50%;
  width: 32px;
  height: 90px;
  padding: 0;
  transform: translateY(-50%);
}

.sensor-rail.collapsed .rail-toggle-left {
  right: 5px;
}

.action-rail.collapsed .rail-toggle-right {
  right: auto;
  left: 5px;
}

.sensor-rail.collapsed .rail-toggle span,
.action-rail.collapsed .rail-toggle span {
  writing-mode: vertical-rl;
}

.rail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid rgba(132, 154, 175, 0.14);
  background: #1b232c;
}

.action-rail .rail-head {
  position: sticky;
  top: 0;
  z-index: 1;
}

.rail-head strong {
  color: #f0f5f8;
  font-size: 14px;
  font-weight: 700;
}

.rail-head span {
  min-width: 30px;
  height: 22px;
  border-radius: 3px;
  background: rgba(45, 127, 249, 0.15);
  color: #7db8ff;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
}

.sensor-list {
  min-height: 0;
  overflow: auto;
  padding: 6px;
  scrollbar-color: rgba(78, 104, 130, 0.8) rgba(255, 255, 255, 0.05);
  scrollbar-width: thin;
}

.editor-panel,
.viewpoint-panel,
.scene-model-panel {
  margin: 6px;
  padding: 7px;
  border: 1px solid rgba(132, 154, 175, 0.14);
  border-radius: 3px;
  background: #111820;
}

.editor-panel.active {
  border-color: rgba(45, 127, 249, 0.62);
}

.editor-row select,
.editor-grid input {
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid rgba(132, 154, 175, 0.18);
  border-radius: 3px;
  background: #0f151c;
  color: #edf4f8;
  font-size: 11px;
}

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 6px;
}

.editor-grid label {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  color: #9aa8b5;
  font-size: 11px;
}

.editor-actions,
.panel-title {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 7px;
}

.panel-title {
  align-items: center;
  margin-top: 0;
}

.panel-title strong {
  color: #dce8f0;
  font-size: 12px;
}

.panel-title span {
  color: #7db8ff;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  text-align: right;
}

.editor-actions button,
.panel-title button,
.viewpoint-list button,
.icon-action,
.action-list button,
.portal-actions button,
.portal-actions a {
  min-height: 30px;
  border: 1px solid rgba(132, 154, 175, 0.14);
  border-radius: 3px;
  background: #1e2730;
  color: #e6edf3;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    background 140ms ease;
}

.editor-actions button:disabled,
.action-list button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.viewpoint-list {
  display: grid;
  gap: 6px;
  max-height: 96px;
  margin-top: 7px;
  overflow: auto;
}

.scene-model-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: 7px;
}

.scene-model-list button {
  min-height: 30px;
  overflow: hidden;
  border: 1px solid rgba(85, 155, 218, 0.25);
  border-radius: 3px;
  background: #1b2732;
  color: #dcecf6;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-model-list button:first-child {
  grid-column: 1 / -1;
}

.scene-model-list button:hover,
.scene-model-list button:focus-visible {
  border-color: rgba(81, 183, 255, 0.78);
  background: #223545;
  outline: none;
}

.scene-model-list button.active {
  border-color: rgba(77, 219, 173, 0.84);
  background: #1d3b3b;
}

.scene-model-list button.loading,
.scene-model-list button:disabled {
  cursor: wait;
  opacity: 0.75;
}

.viewpoint-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 24px;
  align-items: center;
  gap: 4px;
}

.viewpoint-apply {
  min-width: 0;
  height: 30px;
  padding: 0 6px 0 9px;
  text-align: left;
}

.viewpoint-rename,
.viewpoint-remove {
  min-height: 28px;
  padding: 0 5px;
  font-size: 10px;
}

.viewpoint-rename {
  color: #a9cae7;
}

.viewpoint-remove {
  color: #d67461;
}

.viewpoint-list span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sensor-list button {
  position: relative;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 8px;
  width: 100%;
  min-height: 62px;
  margin: 0 0 6px;
  padding: 7px 7px 7px 9px;
  overflow: hidden;
  border: 1px solid rgba(132, 154, 175, 0.14);
  border-radius: 3px;
  background: #1b232c;
  color: #eef6fb;
  text-align: left;
  cursor: pointer;
}

.sensor-list button::before,
.action-list button::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: transparent;
  content: '';
}

.sensor-list button.active,
.action-list button.active {
  border-color: rgba(45, 127, 249, 0.66);
  background: #202b35;
}

.sensor-list button.active::before,
.action-list button.active::before,
.action-list button.success::before {
  background: #2d7ff9;
}

.action-list button.running::before {
  background: #c99538;
}

.action-list button.error::before {
  background: #d66558;
}

.sensor-list i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 3px;
  color: #071017;
  font-size: 10px;
  font-style: normal;
  font-weight: 800;
}

.sensor-list span,
.sensor-list strong,
.sensor-list em,
.sensor-list small,
.sensor-list b {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sensor-list strong {
  color: #f4f8fb;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
}

.sensor-list em,
.sensor-list small,
.sensor-list b {
  color: #aebdca;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 15px;
}

.sensor-list small {
  color: #7d8d9b;
  font-family: Consolas, 'Roboto Mono', monospace;
  white-space: nowrap;
}

.sensor-list b {
  grid-column: 2;
  color: #d0d9e2;
  white-space: normal;
}

.sensor-detail,
.algorithm-result {
  margin: 0 6px 6px;
  padding: 8px;
  overflow: hidden;
  border: 1px solid rgba(132, 154, 175, 0.14);
  border-radius: 3px;
  background: #1b232c;
}

.sensor-detail strong,
.sensor-detail span,
.algorithm-result span,
.algorithm-result strong,
.algorithm-result em {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sensor-detail strong,
.algorithm-result strong {
  color: #f0f5f8;
  font-size: 12px;
  line-height: 17px;
}

.sensor-detail span,
.algorithm-result em {
  color: #aebdca;
  font-size: 10px;
  line-height: 15px;
  white-space: normal;
}

.sensor-video {
  margin-top: 8px;
  overflow: hidden;
  border: 1px solid rgba(132, 154, 175, 0.14);
  border-radius: 3px;
  background: #06090d;
}

.video-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  padding: 0 8px;
  border-bottom: 1px solid rgba(132, 154, 175, 0.12);
  background: #111820;
}

.video-head span,
.video-head b {
  overflow: hidden;
  color: #c8d5df;
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-head b {
  max-width: 120px;
  color: #7db8ff;
}

.sensor-video video {
  display: block;
  width: 100%;
  height: 118px;
  object-fit: cover;
  background: #030507;
}

.icon-action {
  height: 28px;
  padding: 0 10px;
  border-color: rgba(45, 127, 249, 0.36);
  color: #cfe4ff;
}

.action-list,
.portal-actions {
  display: grid;
  gap: 6px;
  padding: 8px;
}

.setup-action-list {
  grid-template-columns: 1fr;
  padding-bottom: 0;
}

.exit-selector,
.diffusion-source-selector {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px;
  color: #94a9bc;
  font-size: 12px;
}

.exit-selector select,
.diffusion-source-selector select {
  min-width: 0;
  height: 32px;
  border: 1px solid rgba(85, 155, 218, 0.3);
  border-radius: 4px;
  background: rgba(7, 20, 33, 0.86);
  color: #dcecf6;
  padding: 0 8px;
}

.diffusion-source-selector em {
  grid-column: 2;
  color: #75a9c8;
  font-size: 10px;
  font-style: normal;
  line-height: 14px;
}

.action-list button,
.portal-actions button,
.portal-actions a {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
}

.algorithm-result {
  min-height: 64px;
}

.algorithm-result span {
  color: #2d7ff9;
  font-size: 11px;
  font-weight: 800;
  line-height: 16px;
}

.algorithm-result.running span {
  color: #c99538;
}

.algorithm-result.error span {
  color: #d66558;
}

.algorithm-result strong {
  display: -webkit-box;
  margin-top: 2px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.algorithm-result em {
  margin-top: 6px;
  color: #7d8d9b;
}

.portal-actions {
  align-self: end;
  border-top: 1px solid rgba(132, 154, 175, 0.12);
}

button:hover,
.portal-actions a:hover {
  border-color: rgba(45, 127, 249, 0.62);
  background: #24313c;
}

@media (max-width: 1024px) {
  .screen-title {
    column-gap: 8px;
  }

  .screen-title small {
    display: none;
  }

  .sensor-rail,
  .action-rail {
    width: 228px;
  }
}

@media (max-width: 760px) {
  .screen-title {
    top: 10px;
    left: 12px;
  }

  .screen-title strong {
    font-size: 16px;
  }

  .screen-route-navigation {
    top: 68px;
    right: 12px;
    width: min(250px, calc(100vw - 24px));
    height: 174px;
  }

  .screen-route-navigation.shifted {
    right: 12px;
  }

  .sensor-rail,
  .action-rail {
    top: auto;
    bottom: 12px;
    width: calc(50% - 18px);
    max-height: 46vh;
  }

  .sensor-rail {
    left: 12px;
  }

  .action-rail {
    right: 12px;
  }

  .screen-algorithm-bar {
    top: 70px !important;
    left: 12px !important;
    width: min(252px, calc(100vw - 24px)) !important;
    max-width: calc(100vw - 24px) !important;
    max-height: calc(100vh - 82px);
    overflow-y: auto;
  }

  .screen-entry.right-rail-open .screen-algorithm-bar {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
  }

  .picked-building-panel,
  .picked-building-panel.shifted {
    top: 254px;
    right: 12px;
    max-height: calc(100vh - 318px);
  }
}

/* 顶层浮动算法控制条：贴左侧垂直排列，主副屏切换时位置稳定。
   .screen-algorithm-bar 即 SmartMapEmbeddedControls 根元素（section），直接覆盖其内部绝对定位。 */
.screen-algorithm-bar {
  position: absolute !important;
  top: 76px !important;
  bottom: auto !important;
  left: 18px !important;
  right: auto !important;
  width: 252px !important;
  max-width: 252px !important;
  z-index: 9;
  box-sizing: border-box;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  border-color: #304351 !important;
  border-radius: 6px !important;
  background: #111a21 !important;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.3) !important;
}

.screen-algorithm-bar :deep(label) {
  display: grid !important;
  grid-template-columns: 44px minmax(0, 1fr) !important;
  align-items: center;
  gap: 8px;
}

.screen-algorithm-bar :deep(label span) {
  font-size: 10px;
}

.screen-algorithm-bar :deep(.control-actions) {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 7px;
  margin-top: 0 !important;
}

.screen-algorithm-bar :deep(.control-actions button) {
  min-height: 52px;
  padding: 8px 10px 8px 12px;
  border-color: #344955;
  border-radius: 4px;
  background: #17242c;
  font-size: 11px;
  white-space: normal;
  width: 100%;
}

.screen-algorithm-bar :deep(.control-actions button small) {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.screen-algorithm-bar :deep(.control-actions button.route.active) {
  border-color: #438a75;
  background: #193a31;
  box-shadow: none;
}

.screen-algorithm-bar :deep(.control-actions button:hover:not(:disabled)) {
  border-color: #56849a;
  background: #203641;
}

.screen-algorithm-bar :deep(select),
.screen-algorithm-bar :deep(button) {
  min-height: 36px;
}

.screen-algorithm-bar :deep(select:focus-visible),
.screen-algorithm-bar :deep(button:focus-visible) {
  outline: 2px solid #68b7d6;
  outline-offset: 2px;
}

/* 副屏小框模式下隐藏信息密度过低的冗余控件，避免与算法/工具按钮争位。 */
.screen-entry:not(.two-d-primary)
  .screen-route-navigation
  :deep(.coord-display),
.screen-entry:not(.two-d-primary) .screen-route-navigation :deep(.scale-bar) {
  display: none;
}
/* 点击建筑信息面板 */
.picked-building-panel {
  position: absolute;
  top: 282px;
  right: 16px;
  z-index: 20;
  width: min(320px, calc(100vw - 36px));
  max-height: calc(100vh - 342px);
  box-sizing: border-box;
  overflow-y: auto;
  padding: 12px 14px;
  background: rgba(9, 22, 31, 0.9);
  border: 1px solid rgba(90, 167, 161, 0.36);
  border-radius: 12px;
  color: #e6f0ff;
  font-size: 12px;
  line-height: 1.5;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(12px);
  transition: right 180ms ease;
}
.picked-building-panel.shifted {
  right: 282px;
}
.picked-building-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(123, 156, 171, 0.18);
  padding-bottom: 8px;
}
.picked-building-close {
  background: transparent;
  border: 0;
  color: #9db8d8;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}
.picked-building-name {
  font-size: 14px;
  font-weight: 600;
  color: #72b9b2;
  margin: 8px 0;
}
.picked-building-meta {
  display: grid;
  gap: 2px;
  margin: 0 0 8px;
}
.picked-building-meta div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.picked-building-meta dt {
  color: #8aa6c4;
}
.picked-building-meta dd {
  margin: 0;
  color: #cfe3ff;
}
.picked-sensor-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.picked-sensor-list li {
  display: grid;
  gap: 1px;
  padding: 7px 8px;
  background: rgba(83, 126, 143, 0.1);
  border-radius: 8px;
}
.ps-id {
  font-weight: 600;
  color: #79beb7;
}
.ps-model {
  color: #b5d5d1;
  font-size: 11px;
}
.ps-props {
  color: #b8c8e0;
  font-size: 11px;
}
.ps-status {
  color: #9db8d8;
  font-size: 11px;
}
.picked-sensor-empty {
  color: #9db8d8;
  margin: 0;
}
.picked-building-loading {
  color: #9db8d8;
}
</style>
