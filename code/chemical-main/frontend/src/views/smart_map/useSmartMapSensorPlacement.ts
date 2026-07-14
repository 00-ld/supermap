import { computed, reactive, ref, type Ref } from 'vue'
import { clamp } from '@/data/coordinate'

export interface SmartMapPlacementPoint {
  x: number
  y: number
}

export type SmartMapPlacementPointLike = { x?: unknown; y?: unknown } | null | undefined

export interface SmartMapManualSensorConfig {
  installationHeight: number
  effectiveRange: number
  detectionRange: string
  installRemark: string
}

export interface SmartMapPlacementFacility {
  type: string
  zone: string
  name: string
  x: number
  y: number
  w?: number
  h?: number
}

export interface SmartMapManualSensorDraft {
  installationHeight: number | string | null
  effectiveRange: number | string | null
  detectionRange: string
  installRemark: string
}

export interface SmartMapPlaceableSensor {
  id: string
  x: number
  y: number
  type: string
  risk: number
  priority: number
  installationHeight?: number | null
  effectiveRange?: number | null
  detectionRange?: string | null
  installRemark?: string | null
  mode?: string
  lastSampleTime?: number | null
  manualSeries?: unknown[]
}

type SmartMapPlacementToastType = 'success' | 'warn' | 'error' | 'danger'

export const MANUAL_SENSOR_DEFAULTS = Object.freeze({
  installationHeight: 1.5,
  effectiveRange: 20,
  detectionRange: 'CO / CH4 / NH3 / O2',
  installRemark: '',
})

export function normalizeSmartMapManualSensorNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
  precision = 1,
) {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  const normalized = clamp(num, min, max)
  return Number(normalized.toFixed(precision))
}

function createManualSensorDraft(): SmartMapManualSensorDraft {
  return {
    installationHeight: MANUAL_SENSOR_DEFAULTS.installationHeight,
    effectiveRange: MANUAL_SENSOR_DEFAULTS.effectiveRange,
    detectionRange: MANUAL_SENSOR_DEFAULTS.detectionRange,
    installRemark: MANUAL_SENSOR_DEFAULTS.installRemark,
  }
}

export function useSmartMapSensorPlacementCancelBridge() {
  let cancelPickingAction: (() => void) | null = null
  let cancelOriginPickingAction: (() => void) | null = null

  function setCancelSensorPickingAction(action: () => void) {
    cancelPickingAction = action
  }

  function setCancelSensorOriginPickingAction(action: () => void) {
    cancelOriginPickingAction = action
  }

  function cancelSensorPicking() {
    cancelPickingAction?.()
  }

  function cancelSensorOriginPicking() {
    cancelOriginPickingAction?.()
  }

  return {
    cancelSensorPicking,
    cancelSensorOriginPicking,
    setCancelSensorPickingAction,
    setCancelSensorOriginPickingAction,
  }
}

interface SmartMapSensorPlacementOptions<
  TSensor extends SmartMapPlaceableSensor,
  TFacility extends SmartMapPlacementFacility,
> {
  sensors: Ref<TSensor[]>
  selectedSensor: Ref<TSensor | null>
  facilities: TFacility[]
  measureMode: Ref<boolean>
  normalizeMapPoint: (point: SmartMapPlacementPointLike) => SmartMapPlacementPoint | null
  formatGeoCoord: (x: number, y: number) => { longitude: string; latitude: string; altitude?: string }
  setCanvasCursor: (cursor: string) => void
  cancelLeakSourcePicking: () => void
  findNearestFacility: (x: number, y: number) => TFacility | null
  computeSensorRisk: (
    sensor: { detectionRange: string; installationHeight: number },
    facility: TFacility | null,
  ) => { risk: number; priority: number }
  generateSensorCode: (areaType: string, zone: string, isPumpArea: boolean) => string
  buildFrameSeriesTemplate: () => unknown[]
  resampleSensorsFromDiffusion: () => void
  saveSensorToDB: (sensor: TSensor) => unknown
  measureCursor: () => string
  deleteAllSensorsFromDB: () => unknown
  deleteSensorFromDB: (id: string) => unknown
  syncSensorEditorState: (sensor: TSensor | null) => void
  showSensorInfo: (sensor: TSensor) => void
  calcCoverage: () => void
  updateRiskStat: () => void
  clearInfo: () => void
  showToast: (message: string, type: SmartMapPlacementToastType) => void
  render: () => void
}

export function useSmartMapSensorPlacement<
  TSensor extends SmartMapPlaceableSensor,
  TFacility extends SmartMapPlacementFacility = SmartMapPlacementFacility,
>(
  options: SmartMapSensorPlacementOptions<TSensor, TFacility>,
) {
  const sensorPlacementState = reactive<{
    picking: boolean
    pickingOrigin: boolean
    pendingPoint: SmartMapPlacementPoint | null
    origin: SmartMapPlacementPoint | null
    relativeX: number
    relativeY: number
  }>({
    picking: false,
    pickingOrigin: false,
    pendingPoint: null,
    origin: { x: 70, y: 260 },
    relativeX: 0,
    relativeY: 0,
  })
  const manualSensorConfigVisible = ref(false)
  const manualSensorDraft = reactive<SmartMapManualSensorDraft>(createManualSensorDraft())

  const setDefaultCursor = () => {
    options.setCanvasCursor(options.measureMode.value ? 'crosshair' : 'grab')
  }

  const manualSensorPlacementGeo = computed(() => (
    sensorPlacementState.pendingPoint
      ? options.formatGeoCoord(sensorPlacementState.pendingPoint.x, sensorPlacementState.pendingPoint.y)
      : null
  ))
  const manualSensorPlacementPointLabel = computed(() => (
    sensorPlacementState.pendingPoint ? '已选点' : '待选点'
  ))
  const manualSensorPlacementLocationText = computed(() => {
    if (!sensorPlacementState.pendingPoint || !manualSensorPlacementGeo.value) {
      return '请先点击地图选择传感器安装位置'
    }
    const point = sensorPlacementState.pendingPoint
    const geo = manualSensorPlacementGeo.value
    return `地图坐标 (${point.x.toFixed(1)}, ${point.y.toFixed(1)}) / 经纬度 ${geo.longitude} / ${geo.latitude}`
  })
  const manualSensorDraftValidation = computed(() => {
    const hasHeight = manualSensorDraft.installationHeight !== '' && manualSensorDraft.installationHeight !== null && manualSensorDraft.installationHeight !== undefined
    const hasRange = manualSensorDraft.effectiveRange !== '' && manualSensorDraft.effectiveRange !== null && manualSensorDraft.effectiveRange !== undefined
    const height = Number(manualSensorDraft.installationHeight)
    const range = Number(manualSensorDraft.effectiveRange)
    if (hasHeight && (!Number.isFinite(height) || height < 0.3 || height > 10)) {
      return { valid: false, message: '安装高度需在 0.3 ~ 10 m 之间。' }
    }
    if (hasRange && (!Number.isFinite(range) || range < 0 || range > 20)) {
      return { valid: false, message: '有效监测范围需在 0 ~ 20 m 之间。' }
    }
    if (!sensorPlacementState.pendingPoint) {
      return { valid: false, message: '请先点击地图选择传感器安装位置，再确认添加。' }
    }
    return { valid: true, message: '参数校验通过；留空项会自动使用默认值。' }
  })

  function getNormalizedManualSensorDraft(): SmartMapManualSensorConfig {
    return {
      installationHeight: normalizeSmartMapManualSensorNumber(
        manualSensorDraft.installationHeight,
        MANUAL_SENSOR_DEFAULTS.installationHeight,
        0.3,
        10,
        1,
      ),
      effectiveRange: normalizeSmartMapManualSensorNumber(
        manualSensorDraft.effectiveRange,
        MANUAL_SENSOR_DEFAULTS.effectiveRange,
        0,
        20,
        0,
      ),
      detectionRange: manualSensorDraft.detectionRange?.trim() || MANUAL_SENSOR_DEFAULTS.detectionRange,
      installRemark: manualSensorDraft.installRemark?.trim() || MANUAL_SENSOR_DEFAULTS.installRemark,
    }
  }

  function resetManualSensorDraft(keepPoint = false) {
    Object.assign(manualSensorDraft, createManualSensorDraft())
    if (!keepPoint) {
      sensorPlacementState.pendingPoint = null
    }
  }

  function toggleOriginPicking() {
    if (sensorPlacementState.picking) {
      sensorPlacementState.picking = false
    }
    sensorPlacementState.pickingOrigin = !sensorPlacementState.pickingOrigin
    if (sensorPlacementState.pickingOrigin) {
      options.setCanvasCursor('crosshair')
      options.showToast('请点击地图设置零点位置', 'success')
    } else {
      setDefaultCursor()
    }
  }

  function captureOriginPoint(point: SmartMapPlacementPointLike) {
    const origin = options.normalizeMapPoint(point)
    if (!origin) return
    sensorPlacementState.origin = origin
    sensorPlacementState.pickingOrigin = false
    setDefaultCursor()
    options.showToast(`零点已设置: (${sensorPlacementState.origin.x.toFixed(1)}, ${sensorPlacementState.origin.y.toFixed(1)})`, 'success')
  }

  function getSensorPlacementOrigin() {
    return sensorPlacementState.origin
  }

  function applyRelativeCoordinates() {
    if (!sensorPlacementState.origin) {
      options.showToast('请先设置零点位置', 'warn')
      return
    }
    const x = sensorPlacementState.origin.x + (sensorPlacementState.relativeX || 0)
    const y = sensorPlacementState.origin.y + (sensorPlacementState.relativeY || 0)
    sensorPlacementState.pendingPoint = options.normalizeMapPoint({ x, y })
    manualSensorConfigVisible.value = true
    options.showToast(`已应用坐标: (${x.toFixed(1)}, ${y.toFixed(1)})`, 'success')
  }

  function startManualSensorPicking() {
    options.cancelLeakSourcePicking()
    manualSensorConfigVisible.value = true
    sensorPlacementState.picking = true
    options.setCanvasCursor('crosshair')
    options.showToast('请点击地图选择传感器安装位置', 'success')
  }

  function captureManualSensorPoint(point: SmartMapPlacementPointLike) {
    sensorPlacementState.pendingPoint = options.normalizeMapPoint(point)
    sensorPlacementState.picking = false
    manualSensorConfigVisible.value = true
    setDefaultCursor()
    options.showToast('已记录候选点位，请确认参数后添加传感器', 'success')
  }

  function cancelSensorPicking() {
    sensorPlacementState.picking = false
  }

  function cancelSensorOriginPicking() {
    sensorPlacementState.pickingOrigin = false
  }

  function isSensorPicking() {
    return sensorPlacementState.picking
  }

  function isSensorOriginPicking() {
    return sensorPlacementState.pickingOrigin
  }

  function cancelManualSensorPlacement() {
    sensorPlacementState.picking = false
    sensorPlacementState.pickingOrigin = false
    manualSensorConfigVisible.value = false
    resetManualSensorDraft()
    setDefaultCursor()
    options.showToast('已取消手动传感器布点', 'warn')
  }

  function confirmManualSensorPlacement() {
    if (!sensorPlacementState.pendingPoint) {
      options.showToast('请先点击地图选择传感器安装位置', 'warn')
      return
    }
    const config = getNormalizedManualSensorDraft()
    Object.assign(manualSensorDraft, config)
    placeManualSensorAtPoint(sensorPlacementState.pendingPoint, config)
  }

  function resolveManualSensorCodeScope(point: SmartMapPlacementPoint) {
    let areaType = 'tank'
    let zone = 'tank_farm'
    let isPumpArea = false
    for (const facility of options.facilities) {
      if (facility.type === 'tank' || facility.type === 'tower') {
        if (Math.hypot(point.x - facility.x, point.y - facility.y) < 100) {
          areaType = facility.type
          zone = facility.zone
          break
        }
      } else {
        const cx = facility.x + (facility.w || 0) / 2
        const cy = facility.y + (facility.h || 0) / 2
        if (Math.hypot(point.x - cx, point.y - cy) < Math.max(facility.w || 40, facility.h || 40) * 0.8) {
          areaType = facility.type
          zone = facility.zone
          isPumpArea = facility.name.includes('压缩机') || facility.name.includes('泵房')
          break
        }
      }
    }
    return { areaType, zone, isPumpArea }
  }

  function placeManualSensorAtPoint(
    point: SmartMapPlacementPointLike,
    sensorConfig: SmartMapManualSensorConfig = getNormalizedManualSensorDraft(),
  ) {
    const normalizedPoint = options.normalizeMapPoint(point)
    if (!normalizedPoint) return
    const nearestFacility = options.findNearestFacility(normalizedPoint.x, normalizedPoint.y)
    const { risk: riskVal, priority } = options.computeSensorRisk(
      {
        detectionRange: sensorConfig.detectionRange || 'CO/CH4/NH3/O2',
        installationHeight: sensorConfig.installationHeight || 1.5,
      },
      nearestFacility,
    )
    const { areaType, zone, isPumpArea } = resolveManualSensorCodeScope(normalizedPoint)
    const sensorId = options.generateSensorCode(areaType, zone, isPumpArea)
    const createdSensor = {
      id: sensorId,
      x: normalizedPoint.x,
      y: normalizedPoint.y,
      type: 'gas',
      risk: riskVal,
      priority,
      installationHeight: sensorConfig.installationHeight,
      effectiveRange: sensorConfig.effectiveRange,
      detectionRange: sensorConfig.detectionRange,
      installRemark: sensorConfig.installRemark,
      mode: 'auto',
      lastSampleTime: null,
      manualSeries: options.buildFrameSeriesTemplate().map(item => (
        item && typeof item === 'object' ? { ...item } : item
      )),
    } as TSensor

    options.sensors.value.push(createdSensor)
    sensorPlacementState.picking = false
    sensorPlacementState.pendingPoint = null
    manualSensorConfigVisible.value = false
    resetManualSensorDraft()
    options.resampleSensorsFromDiffusion()
    options.selectedSensor.value = createdSensor
    options.showSensorInfo(createdSensor)
    options.calcCoverage()
    options.updateRiskStat()
    options.setCanvasCursor(options.measureCursor())
    options.saveSensorToDB(createdSensor)
    options.showToast('手动新增传感器成功，已绑定当前扩散采样数据', 'success')
    options.render()
  }

  function addManualSensor() {
    if (sensorPlacementState.picking) {
      sensorPlacementState.picking = false
      setDefaultCursor()
      options.showToast('已取消手动传感器选点', 'warn')
      return
    }
    if (sensorPlacementState.pickingOrigin) {
      sensorPlacementState.pickingOrigin = false
      setDefaultCursor()
      options.showToast('已取消零点选取', 'warn')
      return
    }
    startManualSensorPicking()
  }

  function clearAllSensor() {
    options.deleteAllSensorsFromDB()
    options.sensors.value = []
    options.selectedSensor.value = null
    sensorPlacementState.picking = false
    sensorPlacementState.pickingOrigin = false
    sensorPlacementState.pendingPoint = null
    sensorPlacementState.origin = null
    sensorPlacementState.relativeX = 0
    sensorPlacementState.relativeY = 0
    manualSensorConfigVisible.value = false
    resetManualSensorDraft()
    options.syncSensorEditorState(null)
    options.calcCoverage()
    options.updateRiskStat()
    options.clearInfo()
    options.showToast('已清空所有传感器', 'warn')
    options.render()
  }

  function deleteCurrSensor() {
    if (!options.selectedSensor.value) return
    const id = options.selectedSensor.value.id
    options.sensors.value = options.sensors.value.filter(sensor => sensor.id !== id)
    options.selectedSensor.value = null
    options.syncSensorEditorState(null)
    options.calcCoverage()
    options.updateRiskStat()
    options.clearInfo()
    options.deleteSensorFromDB(id)
    options.showToast('已删除当前传感器', 'danger')
    options.render()
  }

  return {
    sensorPlacementState,
    manualSensorConfigVisible,
    manualSensorDraft,
    manualSensorPlacementGeo,
    manualSensorPlacementPointLabel,
    manualSensorPlacementLocationText,
    manualSensorDraftValidation,
    getNormalizedManualSensorDraft,
    resetManualSensorDraft,
    toggleOriginPicking,
    captureOriginPoint,
    getSensorPlacementOrigin,
    applyRelativeCoordinates,
    startManualSensorPicking,
    captureManualSensorPoint,
    cancelSensorPicking,
    cancelSensorOriginPicking,
    isSensorPicking,
    isSensorOriginPicking,
    cancelManualSensorPlacement,
    confirmManualSensorPlacement,
    placeManualSensorAtPoint,
    addManualSensor,
    clearAllSensor,
    deleteCurrSensor,
  }
}
