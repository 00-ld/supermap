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
    particleProfile: {
      shape: 'NEUTRAL_PUFF',
      speedFactor: 1,
      buoyancyMetersPerSecond: 0.02,
      densityFactor: 0.9,
      alongScale: 1.9,
      crossScale: 0.9,
      verticalScale: 0.72,
      turbulence: 0.34,
    },
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
    particleProfile: {
      shape: 'BUOYANT_WISPY_PUFF',
      speedFactor: 1.18,
      buoyancyMetersPerSecond: 0.2,
      densityFactor: 0.72,
      alongScale: 2.35,
      crossScale: 0.82,
      verticalScale: 1.08,
      turbulence: 0.48,
    },
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
    particleProfile: {
      shape: 'FAST_BUOYANT_PUFF',
      speedFactor: 1.32,
      buoyancyMetersPerSecond: 0.29,
      densityFactor: 0.62,
      alongScale: 2.55,
      crossScale: 0.76,
      verticalScale: 1.2,
      turbulence: 0.42,
    },
    warningThreshold: 25,
    dangerThreshold: 50,
    blockingThreshold: 75,
  },
  {
    id: 'o2',
    name: '氧气',
    color: '#22c55e',
    densityRatio: 1.11,
    molarMass: 32.0,
    diffusionBias: 0.95,
    particleProfile: {
      shape: 'LOW_DENSE_PUFF',
      speedFactor: 0.9,
      buoyancyMetersPerSecond: -0.035,
      densityFactor: 1.15,
      alongScale: 1.65,
      crossScale: 1.05,
      verticalScale: 0.58,
      turbulence: 0.24,
    },
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
  releaseDuration: 210,
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
  // 约 4 分钟物理时长；泄漏持续到 210 秒，末段保留衰减过程。
  frameCount: 48,
  frameStepSec: 5,
}

import {
  getAllowedGasSourceFacilities,
  type GasSourceFacility,
} from './gasSourceCatalog'
export {
  attachSensorSampleSeries,
  getFrameConcentrationAtPoint,
  type DiffusionCell,
  type DiffusionFrame,
  type DiffusionSensor,
  type DiffusionSensorReading,
} from './diffusionSensorSampling'

/** 根据气体ID查找气体配置 */
export function getGasById(gasId: string) {
  return PHASE1_GASES.find((item) => item.id === gasId) || PHASE1_GASES[0]
}

/** 获取指定气体的允许泄漏源设施 */
export function getPhase1LeakSources(
  facilities: GasSourceFacility[],
  gasId?: string,
): GasSourceFacility[] {
  const scopedSources = gasId
    ? getAllowedGasSourceFacilities(facilities, gasId)
    : []
  if (scopedSources.length) return scopedSources
  return facilities.filter(
    (f) => f.type === 'tank' || f.type === 'tower' || f.key,
  )
}
