import { computed, reactive, watch, type ComputedRef, type Ref } from 'vue'
import type { GasSourceFacility } from '@/data/gasSourceCatalog'
import type { MapFacility } from '@/data/realMapAssets'
import type { SmartMapDiffusionMeta, SmartMapGas, SmartMapSourceFacility } from './useSmartMapDiffusionTypes'

export interface SmartMapLeakSourcePoint {
  x: number
  y: number
}

export type SmartMapLeakSourcePointLike = { x?: unknown; y?: unknown } | null | undefined
type SmartMapLeakSourceMode = 'facility' | 'map' | 'geo' | string
type SmartMapLeakSourceToastType = 'success' | 'warn' | 'error' | 'danger'

interface SmartMapLeakSourceValidation {
  valid: boolean
  config?: { validRadiusMeters?: number } | null
  selectedFacility?: SmartMapSourceFacility | null
  allowedFacilities: SmartMapSourceFacility[]
  nearestAllowedFacility?: SmartMapSourceFacility | null
  distanceToNearestAllowedMeters?: number | string | null
  message: string
}

interface SmartMapNearestGasSourceFacility {
  facility: SmartMapSourceFacility
  distanceMeters: number
}

interface SmartMapDiffusionSourceLayer {
  getPoint: () => SmartMapLeakSourcePoint | null | undefined
  getName: () => string | undefined
  shouldShowName: () => boolean
}

interface SmartMapDiffusionFormLike {
  gasId: string
  sourceFacilityId: string
}

interface SmartMapLeakSourceOptions {
  diffusionForm: SmartMapDiffusionFormLike
  diffusionMeta: Ref<SmartMapDiffusionMeta>
  facilities: MapFacility[]
  facilityById: Map<string, MapFacility>
  diffusionSourceOptions: ComputedRef<SmartMapSourceFacility[]>
  selectedDiffusionSource: ComputedRef<SmartMapSourceFacility | null>
  selectedFacility: Ref<MapFacility | null>
  normalizeMapPoint: (point: SmartMapLeakSourcePointLike) => SmartMapLeakSourcePoint | null
  worldToGeo: (x: number, y: number) => { longitude: number; latitude: number }
  geoToWorld: (longitude: number, latitude: number) => SmartMapLeakSourcePoint
  getFacilityAnchorPoint: (facility: SmartMapSourceFacility | null | undefined) => SmartMapLeakSourcePoint | null
  getGasById: (gasId: string) => SmartMapGas
  getGasSourceConfig: (gasId: string) => { validRadiusMeters?: number } | null
  findNearestAllowedGasSourceFacility: (
    facilities: GasSourceFacility[],
    gasId: string,
    mapPoint: SmartMapLeakSourcePoint | null,
  ) => SmartMapNearestGasSourceFacility | null
  validateGasLeakSource: (params: {
    gasId: string
    sourceFacilityId: string
    facilities: GasSourceFacility[]
    mapPoint?: SmartMapLeakSourcePoint | null
  }) => SmartMapLeakSourceValidation
  cancelSensorPicking: () => void
  cancelSensorOriginPicking: () => void
  setCanvasCursor: (cursor: string) => void
  measureCursor: () => string
  showToast: (message: string, type: SmartMapLeakSourceToastType) => void
  render: () => void
}

export function useSmartMapLeakSource(options: SmartMapLeakSourceOptions) {
  const leakSourceState = reactive<{
    mode: SmartMapLeakSourceMode
    picking: boolean
    mapPoint: SmartMapLeakSourcePoint | null
    manualLongitude: string
    manualLatitude: string
  }>({
    mode: 'facility',
    picking: false,
    mapPoint: null,
    manualLongitude: '',
    manualLatitude: '',
  })

  function syncManualGeoInputsFromWorld(point: SmartMapLeakSourcePoint | null | undefined) {
    if (!point) return
    const geo = options.worldToGeo(point.x, point.y)
    leakSourceState.manualLongitude = geo.longitude.toFixed(6)
    leakSourceState.manualLatitude = geo.latitude.toFixed(6)
  }

  function buildLeakSourceValidation() {
    const gasId = options.diffusionForm.gasId
    if (leakSourceState.mode !== 'facility' && leakSourceState.mapPoint) {
      const nearest = options.findNearestAllowedGasSourceFacility(
        options.facilities,
        gasId,
        leakSourceState.mapPoint,
      )
      return options.validateGasLeakSource({
        gasId,
        sourceFacilityId: nearest?.facility?.id || options.diffusionForm.sourceFacilityId,
        facilities: options.facilities,
        mapPoint: leakSourceState.mapPoint,
      })
    }
    return options.validateGasLeakSource({
      gasId,
      sourceFacilityId: options.diffusionForm.sourceFacilityId,
      facilities: options.facilities,
    })
  }

  function updateDiffusionMetaSource({
    sourceFacility,
    sourcePoint,
  }: {
    sourceFacility?: SmartMapSourceFacility | null
    sourcePoint?: SmartMapLeakSourcePointLike
  }) {
    options.diffusionMeta.value = {
      ...options.diffusionMeta.value,
      gas: options.getGasById(options.diffusionForm.gasId),
      sourceFacility: sourceFacility || null,
      sourcePoint: sourcePoint ? options.normalizeMapPoint(sourcePoint) : null,
    }
  }

  function applyLeakSourcePoint(
    point: SmartMapLeakSourcePointLike,
    mode: SmartMapLeakSourceMode,
    applyOptions: { silent?: boolean } = {},
  ) {
    const normalizedPoint = options.normalizeMapPoint(point)
    const nearest = options.findNearestAllowedGasSourceFacility(
      options.facilities,
      options.diffusionForm.gasId,
      normalizedPoint,
    )
    const validation = options.validateGasLeakSource({
      gasId: options.diffusionForm.gasId,
      sourceFacilityId: nearest?.facility?.id || options.diffusionForm.sourceFacilityId,
      facilities: options.facilities,
      mapPoint: normalizedPoint,
    })
    if (!validation.valid) {
      leakSourceState.picking = false
      if (!applyOptions.silent) options.showToast(validation.message, 'warn')
      return false
    }
    leakSourceState.mode = mode
    leakSourceState.picking = false
    leakSourceState.mapPoint = normalizedPoint
    options.diffusionForm.sourceFacilityId = validation.nearestAllowedFacility?.id
      || validation.selectedFacility?.id
      || options.diffusionForm.sourceFacilityId
    syncManualGeoInputsFromWorld(normalizedPoint)
    updateDiffusionMetaSource({
      sourceFacility: options.facilityById.get(options.diffusionForm.sourceFacilityId)
        || validation.nearestAllowedFacility
        || validation.selectedFacility,
      sourcePoint: normalizedPoint,
    })
    options.render()
    if (!applyOptions.silent) {
      const actionLabel = mode === 'geo' ? '经纬度源点' : '地图源点'
      options.showToast(
        `${actionLabel}已通过校验并绑定到 ${options.facilityById.get(options.diffusionForm.sourceFacilityId)?.name || '合法设施'}`,
        'success',
      )
    }
    return true
  }

  function applyMapLeakSourcePoint(point: SmartMapLeakSourcePointLike) {
    return applyLeakSourcePoint(point, 'map')
  }

  function toggleLeakSourcePicking() {
    options.cancelSensorPicking()
    options.cancelSensorOriginPicking()
    leakSourceState.picking = !leakSourceState.picking
    if (leakSourceState.picking) {
      options.setCanvasCursor('crosshair')
      options.showToast('点击地图设置泄漏源点，系统会自动做合法性校验', 'success')
      return
    }
    options.setCanvasCursor(options.measureCursor())
  }

  function applyManualGeoLeakSource() {
    const longitude = Number(leakSourceState.manualLongitude)
    const latitude = Number(leakSourceState.manualLatitude)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      options.showToast('请输入有效的经纬度坐标', 'warn')
      return
    }
    applyLeakSourcePoint(options.geoToWorld(longitude, latitude), 'geo')
  }

  function syncDiffusionSourceSelection() {
    const validation = buildLeakSourceValidation()
    if (validation.valid) {
      const nextFacilityId = validation.nearestAllowedFacility?.id
        || validation.selectedFacility?.id
        || options.diffusionForm.sourceFacilityId
      options.diffusionForm.sourceFacilityId = nextFacilityId
      updateDiffusionMetaSource({
        sourceFacility: options.facilityById.get(nextFacilityId) || null,
        sourcePoint: leakSourceState.mode === 'facility' ? null : leakSourceState.mapPoint,
      })
      return validation
    }
    const fallback = options.diffusionSourceOptions.value[0] || null
    if (!fallback) return validation
    leakSourceState.mode = 'facility'
    leakSourceState.mapPoint = null
    leakSourceState.picking = false
    options.diffusionForm.sourceFacilityId = fallback.id
    syncManualGeoInputsFromWorld(options.getFacilityAnchorPoint(fallback))
    const fallbackValidation = options.validateGasLeakSource({
      gasId: options.diffusionForm.gasId,
      sourceFacilityId: fallback.id,
      facilities: options.facilities,
    })
    updateDiffusionMetaSource({
      sourceFacility: fallback,
      sourcePoint: null,
    })
    return fallbackValidation
  }

  function useSelectedFacilityAsLeakSource() {
    const selected = options.selectedFacility.value
    if (!selected) {
      options.showToast('请先在地图上选择一个设施', 'warn')
      return
    }
    const validation = options.validateGasLeakSource({
      gasId: options.diffusionForm.gasId,
      sourceFacilityId: selected.id,
      facilities: options.facilities,
    })
    if (!validation.valid) {
      options.showToast(validation.message, 'warn')
      return
    }
    leakSourceState.mode = 'facility'
    leakSourceState.picking = false
    leakSourceState.mapPoint = null
    options.diffusionForm.sourceFacilityId = selected.id
    syncManualGeoInputsFromWorld(options.getFacilityAnchorPoint(selected))
    updateDiffusionMetaSource({
      sourceFacility: selected,
      sourcePoint: null,
    })
    options.render()
    options.showToast(`已将 ${selected.name} 设为泄漏源`, 'success')
  }

  const diffusionSourceValidation = computed(() => buildLeakSourceValidation())
  const diffusionSourceHint = computed(() => {
    const validation = diffusionSourceValidation.value
    const config = validation.config || options.getGasSourceConfig(options.diffusionForm.gasId)
    const allowedNames = validation.allowedFacilities.length
      ? validation.allowedFacilities.map(item => item.name).join(' / ')
      : '未配置'
    if (validation.valid) {
      if (leakSourceState.mode === 'facility') {
        return `合法泄漏源：${allowedNames}，校验半径 ${config?.validRadiusMeters ?? '--'}m`
      }
      const nearestName = validation.nearestAllowedFacility?.name || validation.selectedFacility?.name || '--'
      const distance = validation.distanceToNearestAllowedMeters ?? '--'
      return `当前点位已绑定 ${nearestName}，与允许区域距离 ${distance}m`
    }
    return `仅允许：${allowedNames}，超出 ${config?.validRadiusMeters ?? '--'}m 将拦截模拟`
  })
  const currentLeakSourcePoint = computed(() => {
    if (leakSourceState.mode !== 'facility' && leakSourceState.mapPoint) {
      return leakSourceState.mapPoint
    }
    return options.getFacilityAnchorPoint(options.selectedDiffusionSource.value)
  })

  function getCurrentLeakSourcePoint() {
    return currentLeakSourcePoint.value
  }

  function cancelLeakSourcePicking() {
    leakSourceState.picking = false
  }

  function isLeakSourcePicking() {
    return leakSourceState.picking
  }

  const diffusionSourceLayer: SmartMapDiffusionSourceLayer = {
    getPoint: () => options.diffusionMeta.value.sourcePoint || currentLeakSourcePoint.value,
    getName: () => (options.diffusionMeta.value.sourceFacility || options.selectedDiffusionSource.value)?.name,
    shouldShowName: () => leakSourceState.mode !== 'facility',
  }

  const leakSourceEntryLabel = computed(() => {
    if (leakSourceState.picking) return '等待地图点击'
    if (leakSourceState.mode === 'map') return '地图点选'
    if (leakSourceState.mode === 'geo') return '经纬输入'
    return '设施锚点'
  })
  const leakSourceLocationText = computed(() => {
    const point = currentLeakSourcePoint.value
    if (!point) return '--'
    const geo = options.worldToGeo(point.x, point.y)
    return `${geo.longitude.toFixed(6)}°E / ${geo.latitude.toFixed(6)}°N`
  })

  watch(() => options.diffusionForm.gasId, () => {
    const nextValidation = syncDiffusionSourceSelection()
    updateDiffusionMetaSource({
      sourceFacility: nextValidation?.valid
        ? options.facilityById.get(options.diffusionForm.sourceFacilityId) || null
        : null,
      sourcePoint: leakSourceState.mode === 'facility' ? null : leakSourceState.mapPoint,
    })
  })

  watch(() => options.diffusionForm.sourceFacilityId, () => {
    if (leakSourceState.mode !== 'facility') return
    syncManualGeoInputsFromWorld(options.getFacilityAnchorPoint(options.selectedDiffusionSource.value))
    updateDiffusionMetaSource({
      sourceFacility: options.selectedDiffusionSource.value,
      sourcePoint: null,
    })
  })

  return {
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
    buildLeakSourceValidation,
    updateDiffusionMetaSource,
    applyLeakSourcePoint,
    applyMapLeakSourcePoint,
    toggleLeakSourcePicking,
    applyManualGeoLeakSource,
    syncDiffusionSourceSelection,
    useSelectedFacilityAsLeakSource,
  }
}
