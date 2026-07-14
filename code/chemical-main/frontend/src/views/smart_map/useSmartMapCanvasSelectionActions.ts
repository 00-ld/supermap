import type { Ref } from 'vue'

interface SmartMapZoneFacility {
  zone: string
}

interface SmartMapCandidateSelection {
  candidateId: string
}

interface SmartMapCanvasSelectionActionOptions<TFacility extends SmartMapZoneFacility, TSensor, TCar> {
  facilityById: ReadonlyMap<string, TFacility>
  hoveredSensor: Ref<TSensor | null>
  selectedSensor: Ref<TSensor | null>
  selectedFacility: Ref<TFacility | null>
  selectedCar: Ref<TCar | null>
  selectedZone: Ref<string>
  showSensorInfo: (sensor: TSensor) => void
  showFacilityInfo: (facility: TFacility) => void
  clearInfo: () => void
  selectCar: (car: TCar) => void
  selectCoarseCandidate: (candidateId: string, emphasized?: boolean) => void
}

export function useSmartMapCanvasSelectionActions<
  TFacility extends SmartMapZoneFacility,
  TSensor,
  TCar,
  TCandidate extends SmartMapCandidateSelection,
>(options: SmartMapCanvasSelectionActionOptions<TFacility, TSensor, TCar>) {
  function selectSensor(sensor: TSensor) {
    options.hoveredSensor.value = sensor
    options.selectedSensor.value = sensor
    options.selectedFacility.value = null
    options.selectedCar.value = null
    options.showSensorInfo(sensor)
  }

  function selectCandidate(candidate: TCandidate) {
    options.selectCoarseCandidate(candidate.candidateId, true)
  }

  function selectFacility(facility: TFacility) {
    options.selectedFacility.value = facility
    options.selectedSensor.value = null
    options.selectedCar.value = null
    options.showFacilityInfo(facility)
    options.selectedZone.value = facility.zone
  }

  function setSelectedFacilityById(facilityId: string) {
    options.selectedFacility.value = options.facilityById.get(facilityId) || null
  }

  function clearSelection() {
    options.selectedFacility.value = null
    options.selectedSensor.value = null
    options.clearInfo()
  }

  return {
    clearSelection,
    selectCandidate,
    selectCar: options.selectCar,
    selectFacility,
    setSelectedFacilityById,
    selectSensor,
  }
}
