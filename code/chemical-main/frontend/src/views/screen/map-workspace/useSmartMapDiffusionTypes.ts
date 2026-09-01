import type { GasRecord } from '@/api/gas'
import type { GasSourceFacility } from '@/data/gasSourceCatalog'
import type { MapFacility } from '@/data/realMapAssets'
import type { SmartMapDiffusionFrame, SmartMapDiffusionGas } from './useSmartMapDiffusionLayer'
import type { SmartMapRecord } from './useSmartMapInversion'
import type { SmartMapSensorGasThreshold } from './useSmartMapSensorSeries'

export type SmartMapSourceFacility = (MapFacility | GasSourceFacility) & { name?: string }

export type SmartMapGas = GasRecord & SmartMapSensorGasThreshold & Partial<SmartMapDiffusionGas>

export interface SmartMapPointInput {
  x?: unknown
  y?: unknown
}

export type SmartMapConditionVector = SmartMapRecord & {
  relativeDensity?: unknown
  condBuoyancy?: unknown
  condDiffusivity?: unknown
}

export type SmartMapDiffusionScenarioMeta = SmartMapRecord & {
  diffusionModel?: string
  conditionVector?: SmartMapConditionVector | null
}

export interface SmartMapDiffusionMeta {
  gas: SmartMapGas | null
  sourceFacility: SmartMapSourceFacility | null
  sourcePoint: { x: number; y: number } | null
  stats: SmartMapRecord
  blockedMask: unknown | null
  map: SmartMapRecord | null
  executor: SmartMapRecord | null
  sensorSeries: SmartMapRecord[]
  scenarioMeta: SmartMapDiffusionScenarioMeta | null
  outputMeta: SmartMapRecord | null
}

export type SmartMapDiffusionResult = SmartMapRecord & {
  frames?: SmartMapDiffusionFrame[]
  gas?: SmartMapGas
  sourceFacility?: SmartMapSourceFacility | null
  sourcePoint?: SmartMapPointInput | null
  stats?: SmartMapRecord
  blockedMask?: unknown
  map?: SmartMapRecord | null
  executor?: SmartMapRecord | null
  sensorSeries?: SmartMapRecord[]
  scenarioMeta?: SmartMapDiffusionScenarioMeta | null
  outputMeta?: SmartMapRecord | null
}
