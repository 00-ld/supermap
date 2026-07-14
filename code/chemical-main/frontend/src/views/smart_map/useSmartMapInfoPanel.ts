import { ref } from 'vue'
import type { MapFacility } from '@/data/realMapAssets'
import {
  buildSmartMapFacilityInfo,
  type SmartMapInfoRow,
  type SmartMapInfoSubtitle,
  type SmartMapZoneLike,
} from './useSmartMapFacilityInfo'

export interface SmartMapInfoPanelContent {
  title: string
  subtitle: SmartMapInfoSubtitle
  rows: SmartMapInfoRow[]
}

export interface SmartMapFacilityLayerState<TFacility extends MapFacility, TEntrance> {
  getSelectedFacility: () => TFacility | null
  getHoveredFacility: () => TFacility | null
  getHoveredEntrance: () => TEntrance | null
}

interface SmartMapInfoPanelOptions {
  zones: SmartMapZoneLike[]
}

export function useSmartMapInfoPanel<TFacility extends MapFacility, TEntrance, TSensor>(
  options: SmartMapInfoPanelOptions,
) {
  const selectedFacility = ref<TFacility | null>(null)
  const hoveredFacility = ref<TFacility | null>(null)
  const hoveredEntrance = ref<TEntrance | null>(null)
  const hoveredSensor = ref<TSensor | null>(null)
  const panelCollapsed = ref(false)
  const infoTitle = ref('选择设施查看详情')
  const infoSubtitle = ref<SmartMapInfoSubtitle>({})
  const infoRows = ref<SmartMapInfoRow[]>([])

  function setInfoPanel(content: SmartMapInfoPanelContent) {
    infoTitle.value = content.title
    infoSubtitle.value = content.subtitle
    infoRows.value = content.rows
  }

  function showFacilityInfo(facility: TFacility) {
    panelCollapsed.value = false
    setInfoPanel(buildSmartMapFacilityInfo(facility, options.zones))
  }

  function clearFacilityInfo() {
    infoTitle.value = '选择设施查看详情'
    infoSubtitle.value = {}
    infoRows.value = []
  }

  const facilityLayerState: SmartMapFacilityLayerState<TFacility, TEntrance> = {
    getSelectedFacility: () => selectedFacility.value,
    getHoveredFacility: () => hoveredFacility.value,
    getHoveredEntrance: () => hoveredEntrance.value,
  }

  return {
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
    showFacilityInfo,
  }
}
