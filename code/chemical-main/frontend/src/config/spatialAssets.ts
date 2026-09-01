import { enuToAlgorithm } from '@/data/supermapGeoreference'
import { resolveIServerSceneConfigUrl } from './iServerProxy'
import registry from './spatial-assets.4490.json'

export interface SceneCameraDefinition {
  headingDegrees: number
  pitchDegrees: number
  distanceMeters: number
  fieldOfViewDegrees: number
}

export interface SceneDefinition {
  id: string
  name: string
  configUrl: string
  localConfigUrl?: string
  layerName: string
  published: boolean
  sourceCrs: 'EPSG:4490' | 'PCS_NON_EARTH_LOCAL_METER'
  target?: {
    longitude: number
    latitude: number
    heightMeters: number
  }
  camera: SceneCameraDefinition
}

export interface SceneAnchor4490 {
  entranceId: string
  name: string
  facilityId: string
  modelObjectId: string
  modelDataset: string
  modelSmId: number
  modelName: string
  bindingRole: 'FACTORY_ENTRANCE'
  bindingMethod: 'FOOTPRINT_EDGE_BOTTOM' | 'FOOTPRINT_EDGE_TOP'
  roadNodeId: string
  positionStatus: 'PUBLISHED' | 'MODEL_SURFACE_BOUND' | 'UNVERIFIED'
  longitude: number
  latitude: number
  heightMeters: number
  modelLocalEnuMeters?: {
    east: number
    north: number
    up: number
  }
  camera: SceneCameraDefinition
}

export const SPATIAL_ASSET_CRS = registry.crs
export const SCENE_BOUNDS_4490 = registry.sceneBounds

export const SCENE_DEFINITIONS = registry.scenes.map((scene) => ({
  ...scene,
  configUrl: resolveIServerSceneConfigUrl(scene.configUrl),
})) as SceneDefinition[]
export const ENTRANCE_ANCHORS_4490 = registry.entrances as SceneAnchor4490[]

export interface LeakSourceAnchor4490 {
  leakSourceId: string
  name: string
  facilityId: string
  modelObjectId: string
  modelDataset: string
  modelSmId: number
  modelName: string
  equipmentType:
    | 'PROCESS_PIPE'
    | 'VALVE_ASSEMBLY'
    | 'TANK_NOZZLE'
    | 'PUMP_OR_VALVE_SEAL'
    | 'PIPE_RACK'
    | 'PROCESS_EQUIPMENT'
    | 'BUILDING_COMPONENT'
  bindingRole: 'LEAK_SOURCE'
  bindingMethod:
    | 'MODEL_FOOTPRINT_CENTER_AT_MAX_Z'
    | 'MODEL_BOUNDS_CENTER'
    | 'FOOTPRINT_EDGE_LEFT_AT_LOW_NOZZLE'
    | 'MODEL_FOOTPRINT_CENTER_AT_PIPE_AXIS'
  positionStatus: 'PUBLISHED' | 'MODEL_SURFACE_BOUND' | 'UNVERIFIED'
  gasCode: string
  supportedGasCodes: string[]
  sourceShape: 'VOLUME'
  longitude: number
  latitude: number
  heightMeters: number
  modelLocalEnuMeters: {
    east: number
    north: number
    up: number
  }
  volumeFence: {
    maxHorizontalRadiusMeters: number
    minRelativeHeightMeters: number
    maxRelativeHeightMeters: number
  }
}

export const LEAK_SOURCE_ANCHORS_4490 =
  registry.leakSources as LeakSourceAnchor4490[]

type ModelLocalEnuPoint = {
  east: number
  north: number
  up: number
}

export type AnalysisPointLocalMeters = {
  x: number
  y: number
}

const ANALYSIS_FRAME_LOCAL_METERS = registry.analysisFrameLocalMeters

export function modelEnuToAnalysisPoint(
  modelLocalEnuMeters: ModelLocalEnuPoint,
): AnalysisPointLocalMeters {
  const frame = ANALYSIS_FRAME_LOCAL_METERS
  const metersPerUnit = frame.metersPerUnit
  if (!Number.isFinite(metersPerUnit) || metersPerUnit <= 0) {
    throw new Error('局部分析坐标适配器 metersPerUnit 必须为正数')
  }
  return {
    x:
      frame.anchorPoint.x +
      (modelLocalEnuMeters.east - frame.anchorModelEnuMeters.east) /
        metersPerUnit,
    y:
      frame.anchorPoint.y -
      (modelLocalEnuMeters.north - frame.anchorModelEnuMeters.north) /
        metersPerUnit,
  }
}

export function entranceToAnalysisPoint(
  entrance: SceneAnchor4490,
): AnalysisPointLocalMeters {
  if (!entrance.modelLocalEnuMeters) {
    throw new Error(`出入口 ${entrance.entranceId} 缺少模型 ENU 锚点`)
  }
  return modelEnuToAnalysisPoint(entrance.modelLocalEnuMeters)
}

export function leakSourceToAnalysisPoint(
  source: LeakSourceAnchor4490,
): AnalysisPointLocalMeters {
  return modelEnuToAnalysisPoint(source.modelLocalEnuMeters)
}

// F11（2026-08-01）：泄漏源锚点 → 算法系（x=east+80, y=-north+420）。
// 与 supermapCupScenario 的 B 套模型绑定点位同一坐标系，供扩散/溯源 payload 使用。
export function leakSourceToAlgorithmPoint(source: LeakSourceAnchor4490): {
  x: number
  y: number
} {
  const localEnu = source.modelLocalEnuMeters
  if (!localEnu) {
    throw new Error(`泄漏源 ${source.leakSourceId} 缺少模型 ENU 锚点`)
  }
  return enuToAlgorithm(localEnu.east, localEnu.north)
}

export function getSceneDefinition(index: number): SceneDefinition | null {
  return SCENE_DEFINITIONS[index] || null
}

export function getEntranceAnchor4490(
  entranceId: string,
): SceneAnchor4490 | null {
  return (
    ENTRANCE_ANCHORS_4490.find(
      (entrance) => entrance.entranceId === entranceId,
    ) || null
  )
}

export function getLeakSourceAnchor4490(
  leakSourceId: string,
): LeakSourceAnchor4490 | null {
  return (
    LEAK_SOURCE_ANCHORS_4490.find(
      (source) => source.leakSourceId === leakSourceId,
    ) || null
  )
}

export function isModelBoundPosition(
  positionStatus: SceneAnchor4490['positionStatus'],
): boolean {
  return (
    positionStatus === 'PUBLISHED' || positionStatus === 'MODEL_SURFACE_BOUND'
  )
}

export function isPointInsideScene4490(
  longitude: number,
  latitude: number,
): boolean {
  return (
    longitude >= SCENE_BOUNDS_4490.west &&
    longitude <= SCENE_BOUNDS_4490.east &&
    latitude >= SCENE_BOUNDS_4490.south &&
    latitude <= SCENE_BOUNDS_4490.north
  )
}
