import { ref } from 'vue'
import type { ParkSensorType } from '@/data/sensorCatalog'

export interface SmartMapCoverageSummary {
  totalCost: number
  coverageRate: number
  riskCoverRate: number
  sensorCount: number
}

export interface SmartMapRiskLevelSummary {
  critical: number
  high: number
  mid: number
  low: number
}

export interface SmartMapRiskSummaryOptions<TRiskCell, TSensor> {
  getRiskGrid: () => TRiskCell[]
  getSensors: () => TSensor[]
  sensorTypes: ParkSensorType[]
  defaultRange: number
  resolveRange: (sensor: TSensor, fallbackRange: number) => number
  calculateCoverage: (options: {
    riskGrid: TRiskCell[]
    sensors: TSensor[]
    sensorTypes: ParkSensorType[]
    defaultRange: number
    resolveRange: (sensor: TSensor, fallbackRange: number) => number
  }) => SmartMapCoverageSummary
  summarizeRiskGrid: (riskGrid: TRiskCell[]) => SmartMapRiskLevelSummary
}

export function useSmartMapRiskSummary<TRiskCell, TSensor>(
  options: SmartMapRiskSummaryOptions<TRiskCell, TSensor>,
) {
  const layoutResult = ref<SmartMapCoverageSummary>({
    totalCost: 0,
    coverageRate: 0,
    riskCoverRate: 0,
    sensorCount: 0,
  })
  const riskStat = ref<SmartMapRiskLevelSummary>({
    critical: 0,
    high: 0,
    mid: 0,
    low: 0,
  })

  function calcCoverage() {
    layoutResult.value = options.calculateCoverage({
      riskGrid: options.getRiskGrid(),
      sensors: options.getSensors(),
      sensorTypes: options.sensorTypes,
      defaultRange: options.defaultRange,
      resolveRange: options.resolveRange,
    })
  }

  function updateRiskStat() {
    riskStat.value = options.summarizeRiskGrid(options.getRiskGrid())
  }

  return {
    calcCoverage,
    layoutResult,
    riskStat,
    updateRiskStat,
  }
}
