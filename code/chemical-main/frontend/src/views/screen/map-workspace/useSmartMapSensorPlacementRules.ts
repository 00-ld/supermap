import { getFacilityAnchorPoint } from '@/data/realMapAssets'
import type { MapFacility } from '@/data/realMapAssets'

export type SmartMapFacilityLike = MapFacility

export interface SmartMapSensorRiskInput {
  id?: string
  detectionRange?: string
  installationHeight?: number
}

export type SmartMapRiskGridLevel = '重大' | '较大' | '一般' | '低'

export interface SmartMapRiskGridCell {
  x: number
  y: number
  gridSize: number
  risk: number
  level: SmartMapRiskGridLevel
  priority: number
  color: string
}

export function getSmartMapFacilitySensorAnchor(facility: SmartMapFacilityLike) {
  return getFacilityAnchorPoint(facility) || {
    x: Number(facility?.x || 0),
    y: Number(facility?.y || 0),
  }
}

export function getSmartMapFacilitySensorSpan(facility: SmartMapFacilityLike, axis: 'x' | 'y' = 'x') {
  const diameterSpan = Number(facility?.r || 0)
  const rectSpan = Number(axis === 'x' ? facility?.w || 0 : facility?.h || 0) / 2
  return Math.max(diameterSpan, rectSpan, 28)
}

export function isSmartMapPointNearFacility(
  x: number,
  y: number,
  facility: SmartMapFacilityLike,
  factor = 0.8,
) {
  const anchor = getSmartMapFacilitySensorAnchor(facility)
  const span = Math.max(
    getSmartMapFacilitySensorSpan(facility, 'x'),
    getSmartMapFacilitySensorSpan(facility, 'y'),
    40,
  )
  return Math.hypot(x - anchor.x, y - anchor.y) < span * factor
}

export function getSmartMapPriorityLabel(priority: number) {
  const labels: Record<number, string> = { 1: '重大风险', 2: '较大风险', 3: '一般风险', 4: '低风险' }
  return labels[priority] || '一般风险'
}

export function getSmartMapPriorityColor(priority: number) {
  const colors: Record<number, string> = {
    1: '#ff2f3f',
    2: '#ff9d1f',
    3: '#ff4fd8',
    4: '#39ff7a',
  }
  return colors[priority] || '#ff4fd8'
}

/**
 * Sensor risk calculation based on the GB 18218-2018 R-value method:
 * R = alpha * beta * (q / Q) * locationCorrection.
 */
export function computeSmartMapSensorRisk(
  sensor: SmartMapSensorRiskInput,
  facility: SmartMapFacilityLike | null,
) {
  const detectionRange = (sensor.detectionRange || '').toLowerCase()
  let beta = 1.0
  if (detectionRange.includes('nh3') || detectionRange.includes('氨')) beta = 2
  else if (detectionRange.includes('co') && !detectionRange.includes('co2')) beta = 2
  else if (detectionRange.includes('ch4') || detectionRange.includes('c2h4') || detectionRange.includes('c3h6')) beta = 1.5
  else if (detectionRange.includes('o2') || detectionRange.includes('氧')) beta = 1.0

  const zoneAlpha: Record<string, number> = {
    PA: 1.2, P1: 1.2, PB: 1.2, P2: 1.2,
    A: 1.5,
    TK: 1.0, TW: 1.0, WH: 1.0,
    MN: 1.0, PL: 1.0,
    UT: 0.5, WT: 0.5, MT: 0.5,
    FS: 0.5, FD: 0.5,
  }
  const zonePrefix = (sensor.id || '').split('-')[0] || ''
  let alpha = zoneAlpha[zonePrefix] ?? 0.5
  const personnel = Number(facility?.personnel)
  if (alpha === 0.5 && Number.isFinite(personnel) && personnel > 0) {
    if (personnel >= 100) alpha = 2.0
    else if (personnel >= 50) alpha = 1.5
    else if (personnel >= 30) alpha = 1.2
    else alpha = 1.0
  }

  const hazardLevel = Number(facility?.hazardLevel ?? 0.3)
  const quantityRatio = 0.5 + (Number.isFinite(hazardLevel) ? hazardLevel : 0.3) * 9.5
  const installationHeight = Number(sensor.installationHeight || 1.5)
  let locationCorrection = 1.0
  if (installationHeight <= 0.5) locationCorrection = 1.10
  else if (installationHeight >= 2.0) locationCorrection = 1.05

  const risk = alpha * beta * quantityRatio * locationCorrection
  let priority
  if (risk >= 50) priority = 1
  else if (risk >= 10) priority = 2
  else if (risk >= 5) priority = 3
  else priority = 4
  return { risk: Math.round(risk * 100) / 100, priority }
}

export function findNearestSmartMapFacility(
  x: number,
  y: number,
  facilities: SmartMapFacilityLike[],
) {
  let nearest: SmartMapFacilityLike | null = null
  let minDist = Infinity
  for (const facility of facilities) {
    const anchor = getSmartMapFacilitySensorAnchor(facility)
    const distance = Math.hypot(x - anchor.x, y - anchor.y)
    if (distance < minDist) {
      minDist = distance
      nearest = facility
    }
  }
  return minDist < 150 ? nearest : null
}

export function createSmartMapNearestFacilityLookup(facilities: SmartMapFacilityLike[]) {
  return (x: number, y: number) => findNearestSmartMapFacility(x, y, facilities)
}
