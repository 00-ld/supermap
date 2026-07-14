export const SUPERMAP_LOCAL_COORD_SYS = 'PCS_NON_EARTH_LOCAL_METER'
export const SUPERMAP_CGCS2000_COORD_SYS = 'CGCS2000_3GK_CM_114E'
export const SUPERMAP_CGCS2000_EPSG = 4547
export const SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG = 4490

export const SUPERMAP_MAP_SIZE = {
  width: 1587.2,
  height: 947.2,
  mapMetersPerUnit: 1,
}

export const SUPERMAP_CGCS2000_ANCHOR = {
  local: { x: 1218, y: 682 },
  projected: { easting: 458970.343, northing: 3855563.172 },
  wgs84: { longitude: 113.551488, latitude: 34.82764 },
  label: '河南工业大学莲花街校区南门',
}

export const SUPERMAP_CGCS2000_TRANSFORM = {
  sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
  targetCoordSys: SUPERMAP_CGCS2000_COORD_SYS,
  targetEpsg: SUPERMAP_CGCS2000_EPSG,
  geographicEpsg: SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
  anchorLocal: SUPERMAP_CGCS2000_ANCHOR.local,
  anchorProjected: SUPERMAP_CGCS2000_ANCHOR.projected,
  anchorWgs84: SUPERMAP_CGCS2000_ANCHOR.wgs84,
  rotationDegrees: 0,
  scale: 1,
  xAxis: 'east',
  yAxis: 'south',
}

export const SUPERMAP_CGCS2000_CONTROL_POINTS = [
  controlPoint('CP0', '南门锚点', 1218, 682, '园区大门 = 河工大南门'),
  controlPoint('CP1', '北侧入口', 1218, 230, '控制南北方向比例'),
  controlPoint('CP2', '西侧入口', 238, 235, '控制东西方向比例'),
  controlPoint('CP3', '东侧入口', 1228, 684, '校核入口近邻位置'),
  controlPoint('CP4', '西北角', 0, 0, '校核整体包络'),
  controlPoint('CP5', '东南角', 1587.2, 947.2, '校核整体包络'),
]

function controlPoint(id, name, x, y, usage) {
  const projected = localToProjected(x, y)
  const wgs84 = localToWgs84(x, y)
  return {
    id,
    name,
    usage,
    local: { x, y },
    projected,
    wgs84,
  }
}

export function localToProjected(x, y) {
  const metersX = (Number(x) - SUPERMAP_CGCS2000_ANCHOR.local.x) * SUPERMAP_MAP_SIZE.mapMetersPerUnit
  const metersY = (Number(y) - SUPERMAP_CGCS2000_ANCHOR.local.y) * SUPERMAP_MAP_SIZE.mapMetersPerUnit
  return {
    easting: round(SUPERMAP_CGCS2000_ANCHOR.projected.easting + metersX),
    northing: round(SUPERMAP_CGCS2000_ANCHOR.projected.northing - metersY),
  }
}

export function projectedToLocal(easting, northing) {
  return {
    x: round((Number(easting) - SUPERMAP_CGCS2000_ANCHOR.projected.easting) / SUPERMAP_MAP_SIZE.mapMetersPerUnit
      + SUPERMAP_CGCS2000_ANCHOR.local.x),
    y: round((SUPERMAP_CGCS2000_ANCHOR.projected.northing - Number(northing)) / SUPERMAP_MAP_SIZE.mapMetersPerUnit
      + SUPERMAP_CGCS2000_ANCHOR.local.y),
  }
}

export function localToWgs84(x, y, altitude = 0) {
  const projected = localToProjected(x, y)
  return projectedToWgs84(projected.easting, projected.northing, altitude)
}

export function projectedToWgs84(easting, northing, altitude = 0) {
  const dx = Number(easting) - SUPERMAP_CGCS2000_ANCHOR.projected.easting
  const dy = Number(northing) - SUPERMAP_CGCS2000_ANCHOR.projected.northing
  const latitude = SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude + dy / 111320
  const longitude = SUPERMAP_CGCS2000_ANCHOR.wgs84.longitude
    + dx / (111320 * Math.cos(SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude * Math.PI / 180))
  return {
    longitude: Number(longitude.toFixed(8)),
    latitude: Number(latitude.toFixed(8)),
    altitude: round(altitude, 2),
  }
}

export function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits))
}
