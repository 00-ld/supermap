import {
  SUPERMAP_CGCS2000_ANCHOR,
  SUPERMAP_CGCS2000_COORD_SYS,
  SUPERMAP_CGCS2000_EPSG,
  SUPERMAP_LOCAL_COORD_SYS,
  SUPERMAP_MAP_SIZE,
  localToProjected,
  localToWgs84,
  projectedToLocal,
} from './supermapGeoreference.js'

export const MAP_METERS_PER_UNIT = SUPERMAP_MAP_SIZE.mapMetersPerUnit
export const MAP_WIDTH_METERS = SUPERMAP_MAP_SIZE.width
export const MAP_HEIGHT_METERS = SUPERMAP_MAP_SIZE.height

export const GEO_REFERENCE = {
  originLongitude: SUPERMAP_CGCS2000_ANCHOR.wgs84.longitude,
  originLatitude: SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude,
  baseAltitude: 0,
  coordSys: SUPERMAP_CGCS2000_COORD_SYS,
  projectedEpsg: SUPERMAP_CGCS2000_EPSG,
  sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
  anchorLocal: SUPERMAP_CGCS2000_ANCHOR.local,
  anchorProjected: SUPERMAP_CGCS2000_ANCHOR.projected,
  anchorLabel: SUPERMAP_CGCS2000_ANCHOR.label,
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// F6 越界告警去重集（2026-07-18）：geoToWorld/projectedToWorld 越界时告警，去重避免刷屏。
const COORD_OUT_OF_BOUNDS_WARNED = new Set()

function warnCoordinateOutOfBounds(fnName, input, local, mapSize) {
  if (local.x < 0 || local.x > mapSize.width || local.y < 0 || local.y > mapSize.height) {
    const key = `${fnName}-${local.x.toFixed(1)}-${local.y.toFixed(1)}`
    if (COORD_OUT_OF_BOUNDS_WARNED.has(key)) return
    COORD_OUT_OF_BOUNDS_WARNED.add(key)
    // eslint-disable-next-line no-console
    console.warn(`[F6] ${fnName} 落图越界`, { input, local, mapSize })
  }
}

export function worldToGeo(wx, wy) {
  const normalizedY = clamp(wy, 0, MAP_HEIGHT_METERS)
  const altitude = GEO_REFERENCE.baseAltitude
    + (MAP_HEIGHT_METERS - normalizedY) * 0.02
    + Math.sin(wx / 90) * 1.8
    + Math.cos(wy / 70) * 1.2
  const projected = localToProjected(wx, wy)
  const geo = localToWgs84(wx, wy, altitude)

  return {
    longitude: geo.longitude,
    latitude: geo.latitude,
    altitude: geo.altitude,
    easting: projected.easting,
    northing: projected.northing,
    projectedEpsg: SUPERMAP_CGCS2000_EPSG,
  }
}

export function geoToWorld(longitude, latitude) {
  const metersX = (longitude - SUPERMAP_CGCS2000_ANCHOR.wgs84.longitude)
    * (111320 * Math.cos(SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude * Math.PI / 180))
  const metersY = (latitude - SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude) * 111320
  const local = projectedToLocal(
    SUPERMAP_CGCS2000_ANCHOR.projected.easting + metersX,
    SUPERMAP_CGCS2000_ANCHOR.projected.northing + metersY,
  )
  // F6：经纬度→本地系越界告警（经纬度离锚点过远时本地坐标会超 [0,1587]）
  warnCoordinateOutOfBounds('geoToWorld', { longitude, latitude }, local, SUPERMAP_MAP_SIZE)
  return {
    x: clamp(local.x, 0, MAP_WIDTH_METERS),
    y: clamp(local.y, 0, MAP_HEIGHT_METERS),
  }
}

export function projectedToWorld(easting, northing) {
  const point = projectedToLocal(easting, northing)
  // F6：投影→本地系越界告警（投影坐标离锚点过远时本地坐标会超 [0,1587]）
  warnCoordinateOutOfBounds('projectedToWorld', { easting, northing }, point, SUPERMAP_MAP_SIZE)
  return {
    x: clamp(point.x, 0, MAP_WIDTH_METERS),
    y: clamp(point.y, 0, MAP_HEIGHT_METERS),
  }
}

export function formatGeoCoord(wx, wy) {
  const geo = worldToGeo(wx, wy)
  return {
    longitude: `${geo.longitude.toFixed(6)}°E`,
    latitude: `${geo.latitude.toFixed(6)}°N`,
    altitude: `${geo.altitude.toFixed(1)}m`,
    easting: `${geo.easting.toFixed(3)}m`,
    northing: `${geo.northing.toFixed(3)}m`,
  }
}
