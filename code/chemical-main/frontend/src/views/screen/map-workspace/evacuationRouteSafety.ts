export interface EvacuationRoutePoint {
  x: number
  y: number
}

export interface EvacuationFacilityBounds {
  x?: unknown
  y?: unknown
  w?: unknown
  h?: unknown
  width?: unknown
  height?: unknown
  footprint?: EvacuationRoutePoint[]
}

export function formatParkEntranceLabel(edge: string) {
  const directionByEdge: Record<string, string> = {
    left: '西侧',
    right: '东侧',
    top: '北侧',
    bottom: '南侧',
  }
  return `${directionByEdge[edge] || '园区'}道路入口`
}

export function nearestFacilityBoundaryPointToRoads(
  footprint: EvacuationRoutePoint[],
  roadLines: EvacuationRoutePoint[][],
) {
  if (footprint.length < 2 || !roadLines.some((line) => line.length > 1)) {
    return null
  }
  let nearestPoint: EvacuationRoutePoint | null = null
  let nearestDistance = Number.POSITIVE_INFINITY
  for (const vertex of footprint) {
    for (const line of roadLines) {
      for (let index = 1; index < line.length; index += 1) {
        const projected = projectPointToSegment(
          vertex,
          line[index - 1],
          line[index],
        )
        const distance = Math.hypot(
          vertex.x - projected.x,
          vertex.y - projected.y,
        )
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestPoint = vertex
        }
      }
    }
  }
  return nearestPoint ? { ...nearestPoint } : null
}

export function measureRouteBuildingCollisionMeters(
  path: EvacuationRoutePoint[],
  facilities: EvacuationFacilityBounds[],
  sampleSpacingMeters = 6,
) {
  let collisionMeters = 0
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1]
    const end = path[index]
    const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
    if (!segmentLength) continue
    const sampleCount = Math.max(
      1,
      Math.ceil(segmentLength / Math.max(sampleSpacingMeters, 1)),
    )
    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const ratio = (sampleIndex + 0.5) / sampleCount
      const sample = {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      }
      if (
        facilities.some((facility) => pointInsideFacility(sample, facility))
      ) {
        collisionMeters += segmentLength / sampleCount
      }
    }
  }
  return collisionMeters
}

function pointInsideFacility(
  point: EvacuationRoutePoint,
  facility: EvacuationFacilityBounds,
) {
  if (Array.isArray(facility.footprint) && facility.footprint.length >= 3) {
    return pointInsidePolygon(point, facility.footprint)
  }
  const x = Number(facility.x)
  const y = Number(facility.y)
  const width = Number(facility.w || facility.width)
  const height = Number(facility.h || facility.height)
  if (![x, y, width, height].every(Number.isFinite)) return false
  return (
    point.x > x + 1 &&
    point.x < x + width - 1 &&
    point.y > y + 1 &&
    point.y < y + height - 1
  )
}

function pointInsidePolygon(
  point: EvacuationRoutePoint,
  polygon: EvacuationRoutePoint[],
) {
  let isInside = false
  for (
    let currentIndex = 0, previousIndex = polygon.length - 1;
    currentIndex < polygon.length;
    previousIndex = currentIndex, currentIndex += 1
  ) {
    const current = polygon[currentIndex]
    const previous = polygon[previousIndex]
    if (distanceToSegment(point, previous, current) <= 1) return false
    const crossesRay =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x
    if (crossesRay) isInside = !isInside
  }
  return isInside
}

function distanceToSegment(
  point: EvacuationRoutePoint,
  start: EvacuationRoutePoint,
  end: EvacuationRoutePoint,
) {
  const projected = projectPointToSegment(point, start, end)
  return Math.hypot(point.x - projected.x, point.y - projected.y)
}

function projectPointToSegment(
  point: EvacuationRoutePoint,
  start: EvacuationRoutePoint,
  end: EvacuationRoutePoint,
) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const squaredLength = dx * dx + dy * dy
  if (!squaredLength) return { ...start }
  const ratio = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / squaredLength,
    ),
  )
  return { x: start.x + dx * ratio, y: start.y + dy * ratio }
}
