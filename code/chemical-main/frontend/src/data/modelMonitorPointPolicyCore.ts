export interface MonitorPointIdentity {
  id?: unknown
  sourceType?: unknown
}

export interface MonitorPointPosition extends MonitorPointIdentity {
  id: string
  x: number
  y: number
}

export interface MonitorPointBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export function filterMonitorPointsInsideBounds<T extends MonitorPointPosition>(
  points: readonly T[],
  bounds: MonitorPointBounds,
): T[] {
  return points.filter(
    (point) =>
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY,
  )
}

export function selectMonitorPointsByGrid<T extends MonitorPointPosition>(
  points: readonly T[],
  gridSizeMeters: number,
): T[] {
  if (!Number.isFinite(gridSizeMeters) || gridSizeMeters <= 0) {
    throw new Error('gridSizeMeters must be greater than zero')
  }

  const selectedByCell = new Map<string, { point: T; distance: number }>()
  points.forEach((point) => {
    const column = Math.floor(point.x / gridSizeMeters)
    const row = Math.floor(point.y / gridSizeMeters)
    const centerX = (column + 0.5) * gridSizeMeters
    const centerY = (row + 0.5) * gridSizeMeters
    const distance = Math.hypot(point.x - centerX, point.y - centerY)
    const key = `${column}:${row}`
    const current = selectedByCell.get(key)
    if (
      !current ||
      distance < current.distance ||
      (distance === current.distance &&
        point.id.localeCompare(current.point.id) < 0)
    ) {
      selectedByCell.set(key, { point, distance })
    }
  })

  return [...selectedByCell.values()]
    .map(({ point }) => point)
    .sort((left, right) => left.id.localeCompare(right.id))
}

export function isModelBoundMonitorPointIn(
  sensor: MonitorPointIdentity,
  modelMonitorPointIds: ReadonlySet<string>,
): boolean {
  const sensorId = typeof sensor.id === 'string' ? sensor.id : ''
  return (
    sensor.sourceType === 'model-bound' || modelMonitorPointIds.has(sensorId)
  )
}

export function filterModelBoundMonitorPointsIn<T extends MonitorPointIdentity>(
  sensors: T[],
  modelMonitorPointIds: ReadonlySet<string>,
): T[] {
  return sensors.filter((sensor) =>
    isModelBoundMonitorPointIn(sensor, modelMonitorPointIds),
  )
}
