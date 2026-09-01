import { worldToGeo } from '@/data/coordinate'
import {
  SUPERMAP_CGCS2000_CONTROL_POINTS,
  SUPERMAP_CGCS2000_COORD_SYS,
  SUPERMAP_CGCS2000_EPSG,
  SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
  SUPERMAP_CGCS2000_TRANSFORM,
  SUPERMAP_LOCAL_COORD_SYS,
  localToProjected,
} from '@/data/supermapGeoreference'
import {
  REAL_MAP,
  buildingEntrances,
  facilities,
  getFacilityAnchorPoint,
  parkEntrances,
  roads,
  type MapFacility,
} from '@/data/realMapAssets'
import { ALGORITHM_FRAME } from '@/data/supermapGeoreference'
import { OPERATIONAL_MODEL_MONITOR_POINTS } from '@/data/modelMonitorPointPolicy'
import {
  LEAK_SOURCE_ANCHORS_4490,
  leakSourceToAlgorithmPoint,
} from '@/config/spatialAssets'
import type { AlgorithmPayload, AlgorithmRecord } from '@/api/algorithm'

export interface SuperMapCupGeoPoint {
  longitude: number
  latitude: number
  altitude: number
  easting: number
  northing: number
  projectedEpsg: number
}

export interface SuperMapCupMapPoint {
  x: number
  y: number
}

export interface SuperMapCupEvidence {
  kind: string
  label: string
  requestId: string
  algorithmName: string
  costMs: number
  inputDigest: string
  outputSummary: string
  geoSummary: string
}

const DEFAULT_SOURCE_FACILITY_ID = 'pa-center-north'
const DEFAULT_START_FACILITY_ID = 'pa-west-north'
const DEFAULT_VISIBLE_EXIT_IDS = new Set(['park-south', 'park-east'])

const sourceFacility =
  resolveFacility(DEFAULT_SOURCE_FACILITY_ID) || facilities[0]
const startFacility =
  resolveFacility(DEFAULT_START_FACILITY_ID) ||
  facilities[facilities.length - 1]
const sourceMapPoint = getFacilityCenter(sourceFacility)

// F11（2026-08-01）：算法源点改用模型系泄漏源锚点（spatial-assets.4490.json
// 已配准 6 个设备泄漏源，modelLocalEnuMeters 与 B 套点位同一 ENU 基准），
// 经 ENU → 算法系（x=east+80, y=-north+420，见 spatialAssets.leakSourceToAlgorithmPoint）。
// 默认取第一源（中南装置主管低位法兰）。
const algorithmSourceMapPoint = leakSourceToAlgorithmPoint(
  LEAK_SOURCE_ANCHORS_4490[0],
)
const sceneCenterMapPoint = {
  x: REAL_MAP.width / 2,
  y: REAL_MAP.height / 2,
}
const northWestMapPoint = { x: 0, y: 0 }
const southEastMapPoint = { x: REAL_MAP.width, y: REAL_MAP.height }

export const SUPERMAP_CUP_SCENARIO = {
  name: '超图杯三维应急态势演示场景',
  coordinateSystem: `${SUPERMAP_CGCS2000_COORD_SYS} / EPSG:${SUPERMAP_CGCS2000_EPSG}`,
  displayCoordinateSystem: `CGCS2000 geographic / EPSG:${SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG}`,
  planarCoordinateBoundary:
    '当前三维 S3M 缓存仍保留旧本地坐标；CGCS2000 目标口径使用郑州国家基本气象站 57083 作为 CP0 锚点，算法坐标按 0.5m/unit 相对该原点换算。',
  georeference: SUPERMAP_CGCS2000_TRANSFORM,
  controlPoints: SUPERMAP_CGCS2000_CONTROL_POINTS,
  sourceFacility,
  startFacility,
  sourceMapPoint,
  sourceGeoPoint: mapPointToGeo(sourceMapPoint, 8),
  sceneCenterMapPoint,
  sceneCenterGeoPoint: mapPointToGeo(sceneCenterMapPoint, 0),
  geoBounds: {
    northWest: mapPointToGeo(northWestMapPoint, 0),
    southEast: mapPointToGeo(southEastMapPoint, 0),
  },
  map: {
    width: REAL_MAP.width,
    height: REAL_MAP.height,
    gridSize: 20,
    mapMetersPerUnit: 1, // F10（2026-07-19）：0.5→1.0，与 supermapGeoreference.js SUPERMAP_MAP_SIZE 对齐（见该文件头注释）
    sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
    targetCoordSys: SUPERMAP_CGCS2000_COORD_SYS,
    targetEpsg: SUPERMAP_CGCS2000_EPSG,
    geographicEpsg: SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
    georeference: SUPERMAP_CGCS2000_TRANSFORM,
  },
}

// F11（2026-08-01）：算法网格，与 supermapGeoreference.js ALGORITHM_FRAME 同步。
// diffusion/particle-filter payload 的 map 使用此常量，传感器与源点均为算法系坐标。
export const ALGORITHM_MAP = {
  width: ALGORITHM_FRAME.width,
  height: ALGORITHM_FRAME.height,
  gridSize: 20,
  mapMetersPerUnit: 1,
}

// F11（2026-08-01）：算法点位由 A 套（DOM 底图系 81+29 点，与模型错位）切换为
// B 套模型绑定点位（iServer MonitorPoints_4490，583 个唯一位置低位气体点位）。
// 坐标已换算为算法系（x=east+80, y=-north+420，见 supermapGeoreference.js ALGORITHM_FRAME）。
// B 套点位在三维场景仍按 Wgs84 原值放置（零偏差），此处仅驱动扩散采样与溯源观测。
export interface ModelBoundMonitorSensor {
  id: string
  modelName: string
  facilityId: string
  x: number
  y: number
  mapPoint: SuperMapCupMapPoint
  priority: number
  installationHeight: number
  effectiveRange: number
  observationRole: 'gas-concentration'
  observedProps: string
  wgs84: { longitude: number; latitude: number }
}

export const SUPERMAP_CUP_SENSORS: ModelBoundMonitorSensor[] =
  OPERATIONAL_MODEL_MONITOR_POINTS.map((point) => ({
    id: point.id,
    modelName: point.modelName,
    facilityId: point.facilityId,
    x: point.x,
    y: point.y,
    mapPoint: point.mapPoint,
    priority: point.priority,
    installationHeight: point.installationHeight,
    effectiveRange: point.effectiveRange,
    observationRole: 'gas-concentration' as const,
    observedProps: point.observedProps,
    wgs84: point.wgs84,
  }))

export const SUPERMAP_CUP_GAS_OBSERVATION_SENSORS = SUPERMAP_CUP_SENSORS

export function mapPointToGeo(
  point: SuperMapCupMapPoint,
  altitudeOffset = 0,
): SuperMapCupGeoPoint {
  const geo = worldToGeo(point.x, point.y)
  const projected = localToProjected(point.x, point.y)
  return {
    longitude: Number(geo.longitude.toFixed(8)),
    latitude: Number(geo.latitude.toFixed(8)),
    altitude: Number((geo.altitude + altitudeOffset).toFixed(2)),
    easting: projected.easting,
    northing: projected.northing,
    projectedEpsg: SUPERMAP_CGCS2000_EPSG,
  }
}

export function buildSuperMapCupDiffusionPayload(): AlgorithmPayload {
  return {
    gasId: 'ch4',
    sourceFacilityId: sourceFacility.id,
    sourceMapPoint: algorithmSourceMapPoint,
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
    // 0~235 秒：覆盖 120 秒持续泄漏及其后的衰减阶段。
    frameCount: 48,
    frameStepSec: 5,
    map: ALGORITHM_MAP,
    // F1 修复（2026-07-18）：payload 顶层如实声明输入/目标坐标系。
    // F11（2026-08-01）：sensors/sourceMapPoint 已切换为算法系
    // （x=east+80, y=-north+420，网格 1000×540，mapMetersPerUnit=1，见 ALGORITHM_FRAME），
    // 数据源为 B 套模型绑定点位（MonitorPoints_4490）；roads/facilities 仍为底图系
    // （dstar_lite 不读 coordSys，已核实 grep 零匹配，本地系内自洽）。
    sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
    coordSys: SUPERMAP_CUP_SCENARIO.coordinateSystem,
    georeference: SUPERMAP_CUP_SCENARIO.georeference,
    facilities: facilities.map(toAlgorithmFacility),
    roads: roads.map(toAlgorithmRoad),
    sensors: SUPERMAP_CUP_GAS_OBSERVATION_SENSORS.map((sensor) => ({
      id: sensor.id,
      x: sensor.x,
      y: sensor.y,
      priority: sensor.priority,
      installationHeight: sensor.installationHeight,
      mapPoint: sensor.mapPoint,
    })),
  }
}

export function buildSuperMapCupParticlePayload(
  diffusionResult: AlgorithmRecord,
): AlgorithmPayload {
  const finalFrame = selectFinalDiffusionFrame(diffusionResult)
  const activeSensors = buildActiveSensorsFromDiffusion(finalFrame)
  const gas = asRecord(diffusionResult.gas)
  return {
    activeSensors,
    scenario: {
      sourceMapPoint: algorithmSourceMapPoint,
      emissionRate: 42,
      windSpeed: 3.6,
      windDirection: 25,
      stabilityClass: 'D',
      mapWidth: ALGORITHM_MAP.width,
      mapHeight: ALGORITHM_MAP.height,
      mapMetersPerUnit: ALGORITHM_MAP.mapMetersPerUnit,
      // F1 修复（2026-07-18）：scenario.sourceMapPoint/bounds 是本地米制，
      // sourceCoordSys 如实声明为本地系，coordSys 保留为目标系 CGCS2000。
      // F11（2026-08-01）：源点与点位均为算法系（B 套 MonitorPoints 基准）。
      sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
      coordSys: SUPERMAP_CUP_SCENARIO.coordinateSystem,
      georeference: SUPERMAP_CUP_SCENARIO.georeference,
    },
    gas,
    trueSourceMapPoint: algorithmSourceMapPoint,
    trueEmissionRate: 42,
    particleFilterConfig: {
      numParticles: 3200,
      iterations: 18,
      seed: 20260713,
      bounds: {
        x: { min: 20, max: 980 },
        y: { min: 20, max: 520 },
      },
      minSignalThreshold: 0.0001,
    },
  }
}

export function buildSuperMapCupEvacuationPayload(
  diffusionResult: AlgorithmRecord,
): AlgorithmPayload {
  const finalFrame = selectFinalDiffusionFrame(diffusionResult)
  const gas = asRecord(diffusionResult.gas)
  const startEntrance =
    buildingEntrances.find((item) => item.parentId === startFacility.id) ||
    buildingEntrances[0]
  return {
    roads: roads.map(toAlgorithmRoad),
    parkEntrances: parkEntrances.filter((item) =>
      DEFAULT_VISIBLE_EXIT_IDS.has(item.id),
    ),
    startPoint: {
      x: startEntrance.x,
      y: startEntrance.y,
    },
    startLabel: startEntrance.label,
    frame: finalFrame,
    gas,
    blockedMask: diffusionResult.blockedMask || null,
    map: SUPERMAP_CUP_SCENARIO.map,
    // F1 修复（2026-07-18，原任务点 :237）：roads/startPoint/parkEntrances 是本地米制
    // （0~1587，0.5 m/unit）。原顶层 coordSys 标 CGCS2000 与数据矛盾，误导下游。
    // 加 sourceCoordSys=LOCAL 如实声明输入系，coordSys 保留为目标系。
    // Python dstar_lite.py 不读 coordSys（已核实），本地系自洽建图，零副作用。
    sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
    coordSys: SUPERMAP_CUP_SCENARIO.coordinateSystem,
    georeference: SUPERMAP_CUP_SCENARIO.georeference,
  }
}

export function buildSuperMapCupEvidence(
  kind: string,
  label: string,
  result: AlgorithmRecord | null,
  outputSummary: string,
  geoSummary: string,
): SuperMapCupEvidence {
  const runtime = asRecord(result?.runtime)
  const algorithm = asRecord(result?.algorithm)
  const inputSummary = asRecord(result?.inputSummary)
  return {
    kind,
    label,
    requestId: String(result?.requestId || '--'),
    algorithmName: String(algorithm.name || result?.algorithmName || kind),
    costMs: Number(runtime.costMs || result?.costMs || 0),
    inputDigest: String(inputSummary.payloadDigest || '--'),
    outputSummary,
    geoSummary,
  }
}

export function selectFinalDiffusionFrame(
  diffusionResult: AlgorithmRecord,
): AlgorithmRecord {
  const frames = Array.isArray(diffusionResult.frames)
    ? diffusionResult.frames
    : []
  return asRecord(frames[Math.max(frames.length - 1, 0)] || {})
}

export function resolveRoutePath(
  result: AlgorithmRecord | null,
): SuperMapCupMapPoint[] {
  const candidate = asRecord(result?.selectedRoute || result)
  const path = candidate.path || candidate.points || candidate.routePoints
  if (!Array.isArray(path)) return []
  return path
    .map((item) => asMapPoint(item))
    .filter((item): item is SuperMapCupMapPoint => Boolean(item))
}

export function asRecord(value: unknown): AlgorithmRecord {
  return value && typeof value === 'object' ? (value as AlgorithmRecord) : {}
}

function buildActiveSensorsFromDiffusion(
  frame: AlgorithmRecord,
): AlgorithmRecord[] {
  const readings = Array.isArray(frame.sensorReadings)
    ? frame.sensorReadings
    : []
  const byId = new Map(
    SUPERMAP_CUP_GAS_OBSERVATION_SENSORS.map((sensor) => [sensor.id, sensor]),
  )
  const activeSensors: AlgorithmRecord[] = []
  readings.forEach((reading) => {
    const record = asRecord(reading)
    const sensor = byId.get(String(record.sensorId || record.id))
    if (!sensor) return
    activeSensors.push({
      id: sensor.id,
      x: sensor.x,
      y: sensor.y,
      mapPoint: sensor.mapPoint,
      signal: Number(record.concentration || 0),
      currentConcentration: Number(record.concentration || 0),
      arrivalTimeSec: Number(record.timeSec || 0),
      priority: sensor.priority,
    })
  })
  const uniquePositions = new Map<string, AlgorithmRecord>()
  activeSensors
    .sort((left, right) => Number(right.signal || 0) - Number(left.signal || 0))
    .forEach((sensor) => {
      const point = asRecord(sensor.mapPoint)
      const x = Number(sensor.x ?? point.x)
      const y = Number(sensor.y ?? point.y)
      const positionKey = `${x.toFixed(6)},${y.toFixed(6)}`
      if (!uniquePositions.has(positionKey)) {
        uniquePositions.set(positionKey, sensor)
      }
    })
  return Array.from(uniquePositions.values()).slice(0, 14)
}

function resolveFacility(id: string): MapFacility | null {
  return facilities.find((item) => item.id === id) || null
}

function getFacilityCenter(facility: MapFacility): SuperMapCupMapPoint {
  return (
    getFacilityAnchorPoint(facility) || {
      x: facility.x + facility.w / 2,
      y: facility.y + facility.h / 2,
    }
  )
}

function toAlgorithmFacility(facility: MapFacility) {
  return {
    id: facility.id,
    name: facility.name,
    type: facility.type,
    x: facility.x,
    y: facility.y,
    w: facility.w,
    h: facility.h,
    zone: facility.zone,
    status: facility.status,
    hazardLevel: facility.hazardLevel,
  }
}

function toAlgorithmRoad(road: {
  id?: string
  x: number
  y: number
  w: number
  h: number
  main?: boolean
}) {
  return {
    id: road.id,
    x: road.x,
    y: road.y,
    w: road.w,
    h: road.h,
    main: road.main,
  }
}

function asMapPoint(value: unknown): SuperMapCupMapPoint | null {
  if (!value || typeof value !== 'object') return null
  const record = value as AlgorithmRecord
  const x = Number(record.x)
  const y = Number(record.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}
