import type { Ref } from 'vue'
import type { MapFacility } from '@/data/realMapAssets'
import type { ParkSensorType } from '@/data/sensorCatalog'
import {
  getSmartMapFacilitySensorAnchor,
  type SmartMapRiskGridCell,
  type SmartMapRiskGridLevel,
} from './useSmartMapSensorPlacementRules'
import type { SmartMapPoint } from './useSmartMapInversion'

export const SMART_MAP_SENSOR_LAYOUT_CONFIG = {
  maxSensors: 60,
  minSensorDistance: 80,
  highRiskThreshold: 0.55,
  sourceInfluenceRadius: 180,
  downwindBonus: 0.35,
  alertBonus: 0.35,
  maintenanceBonus: 0.15,
  highDensityMinDistance: 45,
}

export interface SmartMapRiskStat {
  critical: number
  high: number
  mid: number
  low: number
}

export interface SmartMapCoverageResult {
  totalCost: number
  coverageRate: number
  riskCoverRate: number
  sensorCount: number
}

interface RiskGridOptions {
  mapWidth: number
  mapHeight: number
  facilities: MapFacility[]
  windSpeed: number
  windDir: number
  gridSize?: number
}

interface CoverageSensor {
  x: number
  y: number
  type: string
}

interface CoverageOptions<TSensor extends CoverageSensor> {
  riskGrid: SmartMapRiskGridCell[]
  sensors: TSensor[]
  sensorTypes: ParkSensorType[]
  defaultRange: number
  resolveRange: (sensor: TSensor, fallback: number) => number
}

interface SmartMapRiskGridActionsOptions {
  riskGrid: Ref<SmartMapRiskGridCell[]>
  weatherState: Ref<{
    windSpeed: number
    windDir: number
  }>
  mapWidth: number
  mapHeight: number
  facilities: MapFacility[]
}

export function isSmartMapDownwind(
  cell: SmartMapPoint,
  source: SmartMapPoint,
  windDir: number,
  angleTolerance = 50,
) {
  const dx = cell.x - source.x
  const dy = cell.y - source.y
  const len = Math.hypot(dx, dy)
  if (len < 1) return false

  const windRad = windDir * Math.PI / 180
  const wx = Math.sin(windRad)
  const wy = -Math.cos(windRad)
  const cx = dx / len
  const cy = dy / len
  const dot = cx * wx + cy * wy
  return dot >= Math.cos(angleTolerance * Math.PI / 180)
}

export function getSmartMapDynamicSensorDistance(
  cell: SmartMapPoint,
  facilities: MapFacility[],
) {
  for (const facility of facilities) {
    const hazard = Number(facility.hazardLevel || 0.3)
    if (hazard < 0.7) continue
    const anchor = getSmartMapFacilitySensorAnchor(facility)
    const distance = Math.hypot(cell.x - anchor.x, cell.y - anchor.y)
    if (distance < SMART_MAP_SENSOR_LAYOUT_CONFIG.sourceInfluenceRadius) {
      return SMART_MAP_SENSOR_LAYOUT_CONFIG.highDensityMinDistance
    }
  }
  return SMART_MAP_SENSOR_LAYOUT_CONFIG.minSensorDistance
}

export function computeSmartMapRiskGrid(options: RiskGridOptions): SmartMapRiskGridCell[] {
  const gridSize = options.gridSize || 10
  const gridW = Math.ceil(options.mapWidth / gridSize)
  const gridH = Math.ceil(options.mapHeight / gridSize)
  const cfg = SMART_MAP_SENSOR_LAYOUT_CONFIG
  const facilityPoints = options.facilities.map(facility => {
    const anchor = getSmartMapFacilitySensorAnchor(facility)
    return {
      fx: anchor.x,
      fy: anchor.y,
      isHighRisk: facility.type === 'tank' || facility.type === 'tower' || facility.key,
      status: facility.status,
      hazardLevel: Number(facility.hazardLevel || 0.3),
    }
  })

  const grid: SmartMapRiskGridCell[] = []
  for (let i = 0; i < gridW; i += 1) {
    for (let j = 0; j < gridH; j += 1) {
      const x = Math.min(i * gridSize + gridSize / 2, options.mapWidth)
      const y = Math.min(j * gridSize + gridSize / 2, options.mapHeight)
      let risk = 0
      let distRisk = 0

      facilityPoints.forEach(facility => {
        const distance = Math.hypot(x - facility.fx, y - facility.fy)
        if (distance < cfg.sourceInfluenceRadius) {
          distRisk += (1 - distance / cfg.sourceInfluenceRadius) * facility.hazardLevel
        }
      })
      risk += distRisk * 0.35

      facilityPoints.forEach(facility => {
        if (facility.status !== '告警' && facility.status !== '维护中') return
        const distance = Math.hypot(x - facility.fx, y - facility.fy)
        const radius = 150
        if (distance >= radius) return
        const influence = 1 - distance / radius
        const factor = facility.status === '告警' ? cfg.alertBonus : cfg.maintenanceBonus
        risk += factor * influence * 0.25
      })

      if (options.windSpeed > 0.5) {
        const windSpeedFactor = Math.min(1, options.windSpeed / 10)
        facilityPoints.forEach(facility => {
          if (facility.hazardLevel <= 0.6) return
          const downwind = isSmartMapDownwind(
            { x, y },
            { x: facility.fx, y: facility.fy },
            options.windDir,
            50,
          )
          if (!downwind) return
          const distance = Math.hypot(x - facility.fx, y - facility.fy)
          if (distance >= cfg.sourceInfluenceRadius) return
          const influence = 1 - distance / cfg.sourceInfluenceRadius
          risk += influence * cfg.downwindBonus * windSpeedFactor
        })
      }

      risk = Math.min(1, Math.max(0, risk))
      let level: SmartMapRiskGridLevel
      let priority: number
      let color: string
      if (risk >= 0.85) { level = '重大'; priority = 1; color = '#e65f5c' }
      else if (risk >= 0.65) { level = '较大'; priority = 2; color = '#f08a34' }
      else if (risk >= 0.40) { level = '一般'; priority = 3; color = '#e6c845' }
      else { level = '低'; priority = 4; color = '#3fb8d4' }
      grid.push({ x, y, gridSize, risk, level, priority, color })
    }
  }
  return grid
}

export function useSmartMapRiskGridActions(options: SmartMapRiskGridActionsOptions) {
  function computeRiskGrid() {
    const weather = options.weatherState.value
    const grid = computeSmartMapRiskGrid({
      mapWidth: options.mapWidth,
      mapHeight: options.mapHeight,
      facilities: options.facilities,
      windSpeed: weather.windSpeed,
      windDir: weather.windDir,
    })
    options.riskGrid.value = grid
    return grid
  }

  return {
    computeRiskGrid,
  }
}

export function calculateSmartMapSensorCoverage<TSensor extends CoverageSensor>(
  options: CoverageOptions<TSensor>,
): SmartMapCoverageResult {
  let coverCount = 0
  let highRiskCover = 0
  const highRiskTotal = options.riskGrid.filter(cell => cell.priority <= 2).length
  options.riskGrid.forEach(cell => {
    let covered = false
    options.sensors.forEach(sensor => {
      const type = options.sensorTypes.find(item => item.id === sensor.type)
      const range = options.resolveRange(sensor, type?.radius || options.defaultRange)
      const distance = Math.hypot(cell.x - sensor.x, cell.y - sensor.y)
      if (distance <= range) covered = true
    })
    if (covered) coverCount += 1
    if (covered && cell.priority <= 2) highRiskCover += 1
  })
  return {
    sensorCount: options.sensors.length,
    totalCost: options.sensors.reduce((sum, sensor) => (
      sum + (options.sensorTypes.find(type => type.id === sensor.type)?.cost || 0)
    ), 0),
    coverageRate: options.riskGrid.length
      ? Number(((coverCount / options.riskGrid.length) * 100).toFixed(1))
      : 0,
    riskCoverRate: highRiskTotal === 0
      ? 100
      : Number(((highRiskCover / highRiskTotal) * 100).toFixed(1)),
  }
}

export function summarizeSmartMapRiskGrid(grid: SmartMapRiskGridCell[]): SmartMapRiskStat {
  return {
    critical: grid.filter(cell => cell.level === '重大').length,
    high: grid.filter(cell => cell.level === '较大').length,
    mid: grid.filter(cell => cell.level === '一般').length,
    low: grid.filter(cell => cell.level === '低').length,
  }
}

export function drawSmartMapRiskGrid(
  ctx: CanvasRenderingContext2D,
  grid: SmartMapRiskGridCell[],
  showHeatmap: boolean,
) {
  if (!showHeatmap) return
  grid.forEach(cell => {
    const alpha = 0.12
    let color: string
    if (cell.level === '重大') color = `rgba(230,95,92,${alpha + 0.06})`
    else if (cell.level === '较大') color = `rgba(240,138,52,${alpha + 0.01})`
    else if (cell.level === '一般') color = `rgba(230,200,69,${alpha - 0.02})`
    else color = `rgba(63,184,212,${alpha - 0.03})`
    ctx.fillStyle = color
    ctx.fillRect(
      cell.x - cell.gridSize / 2,
      cell.y - cell.gridSize / 2,
      cell.gridSize,
      cell.gridSize,
    )
  })
}
