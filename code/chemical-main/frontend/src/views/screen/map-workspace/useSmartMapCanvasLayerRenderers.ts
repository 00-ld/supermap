import type { ParkSensorType } from '@/data/sensorCatalog'
import {
  drawSmartMapCars,
  type SmartMapCarMarker,
  type SmartMapMobileSensorReading,
} from './useSmartMapCarPatrol'
import {
  drawSmartMapDiffusionLayer,
  type SmartMapDiffusionFrame,
  type SmartMapDiffusionGas,
} from './useSmartMapDiffusionLayer'
import {
  drawSmartMapDiffusionSourceMarker,
  type SmartMapSourceMarkerOptions,
} from './useSmartMapFacilityCanvas'
import {
  drawSmartMapEntrances,
  type SmartMapEntranceCanvasItem,
  type SmartMapEntranceCanvasSize,
} from './useSmartMapEntranceCanvas'
import { drawSmartMapRiskGrid } from './useSmartMapRiskGrid'
import type { SmartMapRiskGridCell } from './useSmartMapSensorPlacementRules'
import {
  drawSmartMapSensors,
  type SmartMapSensorCanvasRecord,
} from './useSmartMapSensorCanvas'

export interface SmartMapEntranceLayerOptions<
  TEntrance extends SmartMapEntranceCanvasItem,
> {
  showEntrances: boolean
  entrances: TEntrance[]
  hoveredEntrance: TEntrance | null | undefined
  mapSize: SmartMapEntranceCanvasSize
}

export interface SmartMapCarLayerOptions {
  showCars: boolean
  carMarkers: SmartMapCarMarker[]
  selectedCar: { id: number } | null
  hoveredCar: { id: number } | null
  mobileSensorReadings: SmartMapMobileSensorReading[]
}

export interface SmartMapDiffusionLayerStateOptions {
  frame: SmartMapDiffusionFrame | null | undefined
  gas: SmartMapDiffusionGas | null | undefined
}

export interface SmartMapRiskGridLayerOptions {
  riskGrid: SmartMapRiskGridCell[]
  showHeatmap: boolean
}

export interface SmartMapSensorLayerOptions<
  TSensor extends SmartMapSensorCanvasRecord,
> {
  showSensors: boolean
  showSensorRanges: boolean
  scale: number
  sensors: TSensor[]
  sensorTypes: ParkSensorType[]
  selectedSensorId?: string
  defaultRange: number
  resolveRange: (sensor: TSensor, fallbackRange: number) => number
  getPriorityColor: (priority: number) => string
  getRealtimeColor?: (sensor: TSensor) => string | null
  getRealtimeConcentration?: (sensor: TSensor) => number
}

export function drawSmartMapEntranceLayer<
  TEntrance extends SmartMapEntranceCanvasItem,
>(
  ctx: CanvasRenderingContext2D,
  options: SmartMapEntranceLayerOptions<TEntrance>,
) {
  if (!options.showEntrances) return
  drawSmartMapEntrances(
    ctx,
    options.entrances,
    options.hoveredEntrance,
    options.mapSize,
  )
}

export function drawSmartMapCarLayer(
  ctx: CanvasRenderingContext2D,
  options: SmartMapCarLayerOptions,
) {
  drawSmartMapCars(ctx, options)
}

export function drawSmartMapDiffusionLayerState(
  ctx: CanvasRenderingContext2D,
  options: SmartMapDiffusionLayerStateOptions,
) {
  drawSmartMapDiffusionLayer(ctx, options)
}

export function drawSmartMapDiffusionSourceLayer(
  ctx: CanvasRenderingContext2D,
  options: SmartMapSourceMarkerOptions,
) {
  drawSmartMapDiffusionSourceMarker(ctx, options)
}

export function drawSmartMapRiskGridLayer(
  ctx: CanvasRenderingContext2D,
  options: SmartMapRiskGridLayerOptions,
) {
  drawSmartMapRiskGrid(ctx, options.riskGrid, options.showHeatmap)
}

export function drawSmartMapSensorLayer<
  TSensor extends SmartMapSensorCanvasRecord,
>(ctx: CanvasRenderingContext2D, options: SmartMapSensorLayerOptions<TSensor>) {
  drawSmartMapSensors(ctx, options)
}
