type JsModuleRecord = Record<string, unknown>
type JsMapPoint = { x: number; y: number }
type ElementPlusTranslate = string | string[] | { [key: string]: ElementPlusTranslate }
type ElementPlusLocale = { name: string; el: Record<string, ElementPlusTranslate> }
type JsRect = JsMapPoint & { w: number; h: number }
type FacilityAnchorLike = JsMapPoint & { w?: number; h?: number; r?: number }

interface UiStat {
  filter: string
  value: number
  label: string
  color: string
}

interface UiLegend {
  type: string
  label: string
  shape: string
  style: string
}

interface UiZone {
  id: string
  name: string
  color: string
  tag: string
  status: string
  key?: boolean
}

interface UiAlert {
  type: string
  icon: string
  text: string
  time: string
}

interface RoadRect extends JsRect {
  main: boolean
}

interface PipeLine {
  id?: string
  name?: string
  from: [number, number]
  to: [number, number]
  status: string
  medium?: string
  diameter?: string
}

interface MapEntrance extends JsMapPoint {
  id: string
  kind: string
  edge: string
  label: string
  tooltipSide: string
}

interface BuildingEntrance extends MapEntrance {
  parentId: string
}

declare module 'element-plus/dist/locale/zh-cn.mjs' {
  const zhCn: ElementPlusLocale
  export default zhCn
}

declare module '@/data/coordinate' {
  export const MAP_METERS_PER_UNIT: number
  export const MAP_WIDTH_METERS: number
  export const MAP_HEIGHT_METERS: number
  export const GEO_REFERENCE: JsModuleRecord

  export function clamp(value: number, min: number, max: number): number
  export function worldToGeo(wx: number, wy: number): {
    longitude: number
    latitude: number
    altitude: number
    easting?: number
    northing?: number
    projectedEpsg?: number
  }
  export function geoToWorld(longitude: number, latitude: number): JsMapPoint
  export function projectedToWorld(easting: number, northing: number): JsMapPoint
  export function formatGeoCoord(wx: number, wy: number): {
    longitude: string
    latitude: string
    altitude: string
    easting?: string
    northing?: string
  }
}

declare module '@/data/supermapGeoreference' {
  export const SUPERMAP_LOCAL_COORD_SYS: string
  export const SUPERMAP_CGCS2000_COORD_SYS: string
  export const SUPERMAP_CGCS2000_EPSG: number
  export const SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG: number
  export const SUPERMAP_CGCS2000_TRANSFORM: JsModuleRecord
  export const SUPERMAP_CGCS2000_CONTROL_POINTS: JsModuleRecord[]
  export function localToProjected(x: number, y: number): { easting: number; northing: number }
  export function projectedToLocal(easting: number, northing: number): JsMapPoint
  export function localToWgs84(x: number, y: number, altitude?: number): {
    longitude: number
    latitude: number
    altitude: number
  }
  export function projectedToWgs84(easting: number, northing: number, altitude?: number): {
    longitude: number
    latitude: number
    altitude: number
  }
}

declare module '@/data/sensorCatalog' {
  export interface ParkSensorType {
    id: string
    name: string
    radius: number
    cost: number
    color?: string
  }

  export interface SensorDeviceInfo {
    image: string
    name: string
    standard: string
    deviceName: string
  }

  export const sensorTypes: ParkSensorType[]
  export function getSensorDevice(sensor: { id?: string } | string | null | undefined): SensorDeviceInfo
}

declare module '@/data/parkAssets' {
  export { defaultSensorDevice, getSensorDevice, getSensorZonePrefix, sensorDeviceMap, sensorTypes } from '@/data/sensorCatalog'
  export type { ParkSensorType, SensorDeviceInfo } from '@/data/sensorCatalog'
}

declare module '@/data/realMapAssets' {
  export interface RealMapInfo {
    image: string
    sourceWidthPx?: number
    sourceHeightPx?: number
    assetWidthPx?: number
    assetHeightPx?: number
    metersPerSourcePixel?: number
    metersPerAssetPixel?: number
    width: number
    height: number
    source?: string
    standardBasis?: string
  }

  export interface MapFacility extends FacilityAnchorLike {
    id: string
    name: string
    type: string
    w: number
    h: number
    r?: number
    zone: string
    status: string
    personnel?: number
    desc?: string
    key?: boolean
    area?: string
    floors?: number
    capacity?: string
    material?: string
    level?: number
    temp?: number
    height?: string
    pressure?: string
    power?: string
    flow?: string
    volume?: string
    bays?: number
    hazardLevel?: number
  }

  export const REAL_MAP: RealMapInfo
  export const alerts: UiAlert[]
  export const buildingEntrances: BuildingEntrance[]
  export const dataBoundary: JsRect
  export const facilities: MapFacility[]
  export const facilityById: Map<string, MapFacility>
  export const keyAreas: JsRect[]
  export const legends: UiLegend[]
  export const parkEntrances: MapEntrance[]
  export const pipes: PipeLine[]
  export const roads: RoadRect[]
  export const stats: UiStat[]
  export const zones: UiZone[]

  export function getFacilityAnchorPoint(facility: FacilityAnchorLike | JsModuleRecord | null | undefined): JsMapPoint | null
}

declare module '@/data/carPatrolRoutes' {
  export interface CarPatrolRoute {
    waypoints: JsMapPoint[]
    speed: number
  }

  export const CAR_PATROL_ROUTES: Record<number, CarPatrolRoute>
  export function getCarPatrolRoute(carId: number): CarPatrolRoute | null
  export function getPatrolCarIds(): number[]
}
