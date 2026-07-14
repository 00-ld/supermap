import { ref } from 'vue'

export interface SmartMapCoreLayerState<TSensorList, TRiskCellList> {
  getSensors: () => TSensorList[]
  getRiskGrid: () => TRiskCellList[]
  getSelectedSensorId: () => string | undefined
}

export function useSmartMapCoreState<TSensor extends { id?: string | number }, TGas, TRiskCell>() {
  const sensors = ref<TSensor[]>([])
  const gases = ref<TGas[]>([])
  const riskGrid = ref<TRiskCell[]>([])
  const selectedSensor = ref<TSensor | null>(null)

  function getSensors() {
    return sensors.value
  }

  function getRiskGrid() {
    return riskGrid.value
  }

  function getSelectedSensorId() {
    const id = selectedSensor.value?.id
    return id == null ? undefined : String(id)
  }

  const coreLayerState: SmartMapCoreLayerState<ReturnType<typeof getSensors>[number], ReturnType<typeof getRiskGrid>[number]> = {
    getSensors,
    getRiskGrid,
    getSelectedSensorId,
  }

  return {
    coreLayerState,
    gases,
    getRiskGrid,
    getSelectedSensorId,
    getSensors,
    riskGrid,
    selectedSensor,
    sensors,
  }
}
