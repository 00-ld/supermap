import { computed, type Ref } from 'vue'

interface SmartMapSelectionDisplayStateOptions<TSensor, THistoryChart> {
  selectedSensor: Ref<TSensor | null>
  buildSensorHistoryChart: (sensor: TSensor | null | undefined) => THistoryChart
  getObservationReadySensors: () => unknown[]
  getInversionObservationSensors: () => unknown[]
}

export function useSmartMapSelectionDisplayState<TSensor, THistoryChart>(
  options: SmartMapSelectionDisplayStateOptions<TSensor, THistoryChart>,
) {
  const selectedSensorHistoryChart = computed(() =>
    options.buildSensorHistoryChart(options.selectedSensor.value)
  )
  const inversionObservationSummary = computed(() => {
    const total = options.getObservationReadySensors().length
    const ready = options.getInversionObservationSensors().length
    return { total, ready }
  })

  return {
    inversionObservationSummary,
    selectedSensorHistoryChart,
  }
}
