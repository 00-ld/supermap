/* 园区地图常量 */
export const MAP_WIDTH = 1587.2
export const MAP_HEIGHT = 947.2
export const GRID_SIZE = 20
export const MAP_METERS_PER_UNIT = 1

/* 气体类型配置数据 — 四气检测：CO / O2 / NH3 / CH4 */
export const PHASE1_GASES = [
  {
    id: 'co',
    name: '一氧化碳',
    color: '#f59e0b',
    densityRatio: 0.97,
    molarMass: 28.01,
    diffusionBias: 1.05,
    warningThreshold: 24,
    dangerThreshold: 60,
    blockingThreshold: 75,
  },
  {
    id: 'nh3',
    name: '氨气',
    color: '#a855f7',
    densityRatio: 0.59,
    molarMass: 17.03,
    diffusionBias: 1.25,
    warningThreshold: 25,
    dangerThreshold: 50,
    blockingThreshold: 75,
  },
  {
    id: 'ch4',
    name: '甲烷 CH4',
    color: '#3fb8d4',
    densityRatio: 0.55,
    molarMass: 16.04,
    diffusionBias: 1.5,
    warningThreshold: 25,
    dangerThreshold: 50,
    blockingThreshold: 75,
  },
  {
    id: 'o2',
    name: '氧气',
    color: '#22c55e',
    densityRatio: 1.11,
    molarMass: 32.00,
    diffusionBias: 0.95,
    warningThreshold: 19,
    dangerThreshold: 23,
    blockingThreshold: 25,
  },
]

/* 默认扩散场景参数 */
export const PHASE1_DEFAULT_SCENARIO = {
  gasId: 'ch4',
  sourceFacilityId: 'pa-west-north',
  sourceRate: 42,
  releaseDuration: 120,
  initialTemperature: 35,
  initialPressure: 0.8,
  releaseHeight: 2,
  windSpeed: 3.6,
  windDirection: 25,
  ambientTemperature: 28,
  humidity: 58,
  stabilityClass: 'D',
  terrainRoughness: 0.45,
  obstacleInfluenceEnabled: true,
  frameCount: 72,
  frameStepSec: 4,
}

import { getAllowedGasSourceFacilities, type GasSourceFacility } from './gasSourceCatalog'

/* 扩散帧 / 网格单元 / 传感器类型 */
export interface DiffusionCell {
  x: number
  y: number
  size: number
  concentration: number
}

export interface DiffusionFrame {
  frameIndex: number
  timeSec: number
  cells: DiffusionCell[]
}

export interface DiffusionSensor {
  x: number
  y: number
  [key: string]: unknown
}

/** 根据气体ID查找气体配置 */
export function getGasById(gasId: string) {
  return PHASE1_GASES.find((item) => item.id === gasId) || PHASE1_GASES[0]
}

/** 获取指定气体的允许泄漏源设施 */
export function getPhase1LeakSources(facilities: GasSourceFacility[], gasId?: string): GasSourceFacility[] {
  const scopedSources = gasId ? getAllowedGasSourceFacilities(facilities, gasId) : []
  if (scopedSources.length) return scopedSources
  return facilities.filter((f) => f.type === 'tank' || f.type === 'tower' || f.key)
}

/** 从帧数据中获取指定点的浓度值 */
export function getFrameConcentrationAtPoint(frame: DiffusionFrame, x: number, y: number): number {
  if (!frame?.cells?.length) return 0
  let nearest: DiffusionCell | null = null
  let minDistance = Infinity
  for (const cell of frame.cells) {
    const distance = Math.hypot(cell.x - x, cell.y - y)
    if (distance < minDistance) {
      minDistance = distance
      nearest = cell
    }
  }
  if (!nearest) return 0
  const fade = Math.max(0, 1 - minDistance / Math.max(nearest.size * 1.8, 1))
  return Number((nearest.concentration * fade).toFixed(2))
}

/** 用传感器采集数据对帧数据进行采样 */
export function attachSensorSampleSeries(sensors: DiffusionSensor[], frames: DiffusionFrame[]) {
  return sensors.map((sensor) => {
    const sampledSeries = frames.map((frame) => ({
      frameIndex: frame.frameIndex,
      timeSec: frame.timeSec,
      concentration: getFrameConcentrationAtPoint(frame, sensor.x, sensor.y),
    }))
    const peakConcentration = sampledSeries.reduce(
      (max, item) => Math.max(max, item.concentration),
      0,
    )
    return {
      ...sensor,
      sampledSeries,
      sampledPeak: Number(peakConcentration.toFixed(2)),
      sampledFrames: sampledSeries.length,
    }
  })
}
