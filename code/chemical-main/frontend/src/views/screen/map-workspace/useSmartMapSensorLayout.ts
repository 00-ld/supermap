import type { MapFacility } from '@/data/realMapAssets'
import { OPERATIONAL_MODEL_MONITOR_POINTS } from '@/data/modelMonitorPointPolicy'
import type { SmartMapRiskGridCell } from './useSmartMapSensorPlacementRules'
import {
  getSmartMapDynamicSensorDistance,
  SMART_MAP_SENSOR_LAYOUT_CONFIG,
} from './useSmartMapRiskGrid'

export interface SmartMapGeneratedSensor {
  id: string
  x: number
  y: number
  mapPoint: { x: number; y: number }
  type: 'gas'
  sourceType: 'model-bound' | 'risk-grid'
  modelName?: string
  facilityId?: string
  sensorModel?: string
  risk: number
  priority: number
  mode: 'auto'
  lastSampleTime: null
  manualSeries: []
}

interface StandardLayoutOptions {
  grid: SmartMapRiskGridCell[]
  facilities: MapFacility[]
  isPointNearFacility: (
    x: number,
    y: number,
    facility: MapFacility,
    factor?: number,
  ) => boolean
}

const SENSOR_CODE_COUNTERS: Record<string, number> = {}

export function resetSmartMapSensorCodeCounters() {
  Object.keys(SENSOR_CODE_COUNTERS).forEach(
    (key) => delete SENSOR_CODE_COUNTERS[key],
  )
}

export function generateSmartMapSensorCode(
  areaType: string,
  zone: string,
  isPumpArea: boolean,
) {
  let prefix = 'GN'
  if (isPumpArea) prefix = 'PF'
  else if (areaType === 'tank' || zone === 'tank_farm') prefix = 'TK'
  else if (areaType === 'tower' || zone === 'tower_area') prefix = 'TW'
  else if (
    areaType === 'production' &&
    (zone === 'prod_a' || zone === 'prod_b')
  )
    prefix = 'SC'
  else if (areaType === 'office' || zone === 'admin') prefix = 'BG'
  else if (areaType === 'warehouse' || zone === 'warehouse') prefix = 'WH'
  else if (areaType === 'utility' || zone === 'utility') prefix = 'GE'
  else if (zone === 'treatment') prefix = 'WS'

  if (!SENSOR_CODE_COUNTERS[prefix]) SENSOR_CODE_COUNTERS[prefix] = 1
  const seq = String(SENSOR_CODE_COUNTERS[prefix]++).padStart(2, '0')
  return `${prefix}-${seq}`
}

export function buildSmartMapBaseStandardLayout() {
  // 从 B 套 583 个模型绑定候选点中抽取均匀运行网络；仍然只使用
  // MonitorPoints_4490 真实点位，不生成脱离模型的虚拟点。
  return OPERATIONAL_MODEL_MONITOR_POINTS.map((point) => ({
    id: point.id,
    x: point.x,
    y: point.y,
    mapPoint: point.mapPoint,
    type: 'gas' as const,
    sourceType: 'model-bound' as const,
    modelName: point.modelName,
    facilityId: point.facilityId,
    sensorModel: point.sensorModel,
    risk: point.risk,
    priority: point.priority,
    mode: 'auto' as const,
    lastSampleTime: null,
    manualSeries: [],
  }))
}

export function buildSmartMapStandardSensorLayout(
  options: StandardLayoutOptions,
): SmartMapGeneratedSensor[] {
  const cfg = SMART_MAP_SENSOR_LAYOUT_CONFIG
  resetSmartMapSensorCodeCounters()
  const candidates = options.grid
    .filter((cell) => cell.risk > cfg.highRiskThreshold)
    .sort((a, b) => b.risk - a.risk)

  const selected: SmartMapGeneratedSensor[] = []
  for (const cell of candidates) {
    const minDist = getSmartMapDynamicSensorDistance(cell, options.facilities)
    const tooClose = selected.some(
      (sensor) => Math.hypot(cell.x - sensor.x, cell.y - sensor.y) < minDist,
    )
    if (tooClose) continue

    let areaType = 'tank'
    let zone = 'tank_farm'
    let isPumpArea = false
    for (const facility of options.facilities) {
      if (facility.type === 'tank' || facility.type === 'tower') {
        if (options.isPointNearFacility(cell.x, cell.y, facility, 1.25)) {
          areaType = facility.type
          zone = facility.zone
          break
        }
      } else if (options.isPointNearFacility(cell.x, cell.y, facility, 1.6)) {
        areaType = facility.type
        zone = facility.zone
        if (facility.name.includes('压缩机') || facility.name.includes('泵房'))
          isPumpArea = true
        break
      }
    }

    selected.push({
      id: generateSmartMapSensorCode(areaType, zone, isPumpArea),
      x: cell.x,
      y: cell.y,
      mapPoint: { x: cell.x, y: cell.y },
      type: 'gas',
      sourceType: 'risk-grid',
      sensorModel: 'risk-grid-generated',
      risk: cell.risk,
      priority: cell.priority,
      mode: 'auto',
      lastSampleTime: null,
      manualSeries: [],
    })
    if (selected.length >= cfg.maxSensors) break
  }
  return selected
}
