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
import { REAL_SENSOR_LAYOUT, type RealSensorLayoutPoint } from '@/data/realSensorLayout'
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

export interface SuperMapCupSensor {
  id: string
  x: number
  y: number
  type: string
  priority: number
  installationHeight: number
  effectiveRange: number
  mapPoint: SuperMapCupMapPoint
  geoPoint: SuperMapCupGeoPoint
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
const DEFAULT_START_FACILITY_ID = 'pa-center-south'
const DEFAULT_VISIBLE_EXIT_IDS = new Set(['park-south', 'park-east'])
const MAX_DEMO_SENSORS = 28

const sourceFacility = resolveFacility(DEFAULT_SOURCE_FACILITY_ID) || facilities[0]
const startFacility = resolveFacility(DEFAULT_START_FACILITY_ID) || facilities[facilities.length - 1]
const sourceMapPoint = getFacilityCenter(sourceFacility)
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
  planarCoordinateBoundary: '当前可运行 iServer Data 基线仍保留本地米制服务；CGCS2000 目标口径使用河工大莲花街校区南门 CP0 锚点，不旋转、不缩放，等待新 iServer/iPortal 服务发布后切换。',
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
    mapMetersPerUnit: 1,
    sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
    targetCoordSys: SUPERMAP_CGCS2000_COORD_SYS,
    targetEpsg: SUPERMAP_CGCS2000_EPSG,
    geographicEpsg: SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
    georeference: SUPERMAP_CGCS2000_TRANSFORM,
  },
}

export const SUPERMAP_CUP_SENSORS: SuperMapCupSensor[] = REAL_SENSOR_LAYOUT
  .slice(0, MAX_DEMO_SENSORS)
  .map(toScenarioSensor)

export function mapPointToGeo(point: SuperMapCupMapPoint, altitudeOffset = 0): SuperMapCupGeoPoint {
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
    sourceMapPoint,
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
    frameCount: 12,
    frameStepSec: 4,
    map: SUPERMAP_CUP_SCENARIO.map,
    coordSys: SUPERMAP_CUP_SCENARIO.coordinateSystem,
    georeference: SUPERMAP_CUP_SCENARIO.georeference,
    facilities: facilities.map(toAlgorithmFacility),
    roads: roads.map(toAlgorithmRoad),
    sensors: SUPERMAP_CUP_SENSORS.map(sensor => ({
      id: sensor.id,
      x: sensor.x,
      y: sensor.y,
      type: sensor.type,
      priority: sensor.priority,
      mapPoint: sensor.mapPoint,
    })),
  }
}

export function buildSuperMapCupParticlePayload(diffusionResult: AlgorithmRecord): AlgorithmPayload {
  const finalFrame = selectFinalDiffusionFrame(diffusionResult)
  const activeSensors = buildActiveSensorsFromDiffusion(finalFrame)
  const gas = asRecord(diffusionResult.gas)
  return {
    activeSensors,
    scenario: {
      sourceMapPoint,
      emissionRate: 42,
      windSpeed: 3.6,
      windDirection: 25,
      stabilityClass: 'D',
      mapWidth: SUPERMAP_CUP_SCENARIO.map.width,
      mapHeight: SUPERMAP_CUP_SCENARIO.map.height,
      mapMetersPerUnit: SUPERMAP_CUP_SCENARIO.map.mapMetersPerUnit,
      coordSys: SUPERMAP_CUP_SCENARIO.coordinateSystem,
      georeference: SUPERMAP_CUP_SCENARIO.georeference,
    },
    gas,
    trueSourceMapPoint: sourceMapPoint,
    trueEmissionRate: 42,
    particleFilterConfig: {
      numParticles: 3200,
      iterations: 18,
      seed: 20260713,
      bounds: {
        x: { min: 120, max: 720 },
        y: { min: 160, max: 520 },
      },
      minSignalThreshold: 0.0001,
    },
  }
}

export function buildSuperMapCupEvacuationPayload(diffusionResult: AlgorithmRecord): AlgorithmPayload {
  const finalFrame = selectFinalDiffusionFrame(diffusionResult)
  const gas = asRecord(diffusionResult.gas)
  const startEntrance = buildingEntrances.find(item => item.parentId === startFacility.id) || buildingEntrances[0]
  return {
    roads: roads.map(toAlgorithmRoad),
    parkEntrances: parkEntrances.filter(item => DEFAULT_VISIBLE_EXIT_IDS.has(item.id)),
    startPoint: {
      x: startEntrance.x,
      y: startEntrance.y,
    },
    startLabel: startEntrance.label,
    frame: finalFrame,
    gas,
    blockedMask: diffusionResult.blockedMask || null,
    map: SUPERMAP_CUP_SCENARIO.map,
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

export function selectFinalDiffusionFrame(diffusionResult: AlgorithmRecord): AlgorithmRecord {
  const frames = Array.isArray(diffusionResult.frames) ? diffusionResult.frames : []
  return asRecord(frames[Math.max(frames.length - 1, 0)] || {})
}

export function resolveRoutePath(result: AlgorithmRecord | null): SuperMapCupMapPoint[] {
  const candidate = asRecord(result?.selectedRoute || result)
  const path = candidate.path || candidate.points || candidate.routePoints
  if (!Array.isArray(path)) return []
  return path
    .map(item => asMapPoint(item))
    .filter((item): item is SuperMapCupMapPoint => Boolean(item))
}

export function asRecord(value: unknown): AlgorithmRecord {
  return value && typeof value === 'object' ? value as AlgorithmRecord : {}
}

function buildActiveSensorsFromDiffusion(frame: AlgorithmRecord): AlgorithmRecord[] {
  const readings = Array.isArray(frame.sensorReadings) ? frame.sensorReadings : []
  const byId = new Map(SUPERMAP_CUP_SENSORS.map(sensor => [sensor.id, sensor]))
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
  return activeSensors
    .sort((left, right) => Number(right.signal || 0) - Number(left.signal || 0))
    .slice(0, 14)
}

function resolveFacility(id: string): MapFacility | null {
  return facilities.find(item => item.id === id) || null
}

function getFacilityCenter(facility: MapFacility): SuperMapCupMapPoint {
  return getFacilityAnchorPoint(facility) || {
    x: facility.x + facility.w / 2,
    y: facility.y + facility.h / 2,
  }
}

function toScenarioSensor(sensor: RealSensorLayoutPoint): SuperMapCupSensor {
  const mapPoint = { x: sensor.x, y: sensor.y }
  return {
    id: sensor.id,
    x: sensor.x,
    y: sensor.y,
    type: sensor.type,
    priority: sensor.priority,
    installationHeight: sensor.installationHeight,
    effectiveRange: sensor.effectiveRange,
    mapPoint,
    geoPoint: mapPointToGeo(mapPoint, sensor.installationHeight),
  }
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

function toAlgorithmRoad(road: { id?: string; x: number; y: number; w: number; h: number; main?: boolean }) {
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
