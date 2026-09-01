import { ref, type Ref } from 'vue'
import type { MapFacility } from '@/data/realMapAssets'
import type { SmartMapToolMode } from './useSmartMapMeasureTool'
import type { SmartMapToastType } from './useSmartMapToast'

export type SmartMapFilterKey = 'all' | 'building' | 'tank' | 'tower' | 'pipe' | 'key'

interface SmartMapViewControlsOptions {
  facilities: MapFacility[]
  selectedFacility: Ref<MapFacility | null>
  hoveredEntrance: Ref<unknown | null>
  getCanvas: () => HTMLCanvasElement | null | undefined
  getFacilityAnchorPoint: (facility: MapFacility) => { x: number; y: number } | null
  showFacilityInfo: (facility: MapFacility) => void
  setSmartMapTool: (tool: SmartMapToolMode, canvas: HTMLCanvasElement | null | undefined) => void
  measureCursor: () => string
  focusWorldPoint: (point: { x: number; y: number }) => void
  fitInitialMapView: () => void
  zoomViewportIn: () => void
  zoomViewportOut: () => void
  render: () => void
  showToast: (message: string, type: SmartMapToastType) => void
}

const FILTER_KEYS: SmartMapFilterKey[] = ['all', 'building', 'tank', 'tower', 'pipe', 'key']

function isFilterKey(filter: string): filter is SmartMapFilterKey {
  return FILTER_KEYS.includes(filter as SmartMapFilterKey)
}

function facilityFocusPoint(facility: MapFacility) {
  if (facility.type === 'tank' || facility.type === 'tower') {
    return { x: facility.x, y: facility.y }
  }
  return {
    x: facility.x + Number(facility.w || 0) / 2,
    y: facility.y + Number(facility.h || 0) / 2,
  }
}

export function useSmartMapViewControls(options: SmartMapViewControlsOptions) {
  const activeFilter = ref<SmartMapFilterKey>('all')
  const selectedZone = ref('')
  const searchQuery = ref('')
  const showLabels = ref(false)
  const showHeatmap = ref(false)
  const showEntrances = ref(false)
  const showSensors = ref(true)
  const showSensorRanges = ref(true)
  const viewVisibility = {
    showEntrances: () => showEntrances.value,
    showHeatmap: () => showHeatmap.value,
    showLabels: () => showLabels.value,
    showSensorRanges: () => showSensorRanges.value,
    showSensors: () => showSensors.value,
  }

  function setFilter(filter: string) {
    activeFilter.value = isFilterKey(filter) ? filter : 'all'
    options.render()
  }

  function selectZone(zoneId: string) {
    selectedZone.value = zoneId
    const first = options.facilities.find(facility => facility.zone === zoneId)
    if (!first) return
    options.selectedFacility.value = first
    options.showFacilityInfo(first)
    options.focusWorldPoint(facilityFocusPoint(first))
    options.render()
  }

  function setTool(tool: SmartMapToolMode) {
    options.setSmartMapTool(tool, options.getCanvas())
    options.render()
  }

  function toggleHeatmap() {
    showHeatmap.value = !showHeatmap.value
    options.render()
    options.showToast(showHeatmap.value ? '热力图已开启' : '热力图已关闭', 'success')
  }

  function toggleEntrances() {
    showEntrances.value = !showEntrances.value
    if (!showEntrances.value) options.hoveredEntrance.value = null
    const canvas = options.getCanvas()
    if (canvas) {
      canvas.style.cursor = showEntrances.value && options.hoveredEntrance.value ? 'pointer' : options.measureCursor()
    }
    options.render()
    options.showToast(showEntrances.value ? '出入口标记已显示' : '出入口标记已隐藏', 'success')
  }

  function toggleSensors() {
    showSensors.value = !showSensors.value
    options.render()
    options.showToast(showSensors.value ? '传感器已显示' : '传感器已隐藏', 'success')
  }

  function toggleSensorRanges() {
    showSensorRanges.value = !showSensorRanges.value
    options.render()
    options.showToast(showSensorRanges.value ? '半径范围已显示' : '半径范围已隐藏', 'success')
  }

  function toggleLabels() {
    showLabels.value = !showLabels.value
    options.render()
  }

  function zoomIn() {
    options.zoomViewportIn()
    options.render()
  }

  function zoomOut() {
    options.zoomViewportOut()
    options.render()
  }

  function zoomReset() {
    options.fitInitialMapView()
    options.render()
    options.showToast('视图已重置', 'success')
  }

  function onSearch() {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) {
      activeFilter.value = 'all'
      options.render()
      return
    }
    const match = options.facilities.find(facility => (
      facility.name.toLowerCase().includes(query) || facility.id.toLowerCase().includes(query)
    ))
    if (!match) return
    options.selectedFacility.value = match
    options.showFacilityInfo(match)
    selectedZone.value = match.zone
    const anchor = options.getFacilityAnchorPoint(match)
    if (!anchor) return
    options.focusWorldPoint(anchor)
    options.render()
  }

  return {
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
  }
}
