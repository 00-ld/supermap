import type { ConcentrationTrendPoint } from '@/api/monitoringData'
import type { WarningHistoryRecord } from '@/api/warningHistory'

export interface PatrolCarReading extends ConcentrationTrendPoint {
  x?: number
  y?: number
}

export function isActionablePatrolCarReading(
  reading: PatrolCarReading,
): boolean {
  return (
    reading.source !== 'warning_history' &&
    reading.qualityStatus !== 'EVENT_RECORDED'
  )
}

export const PATROL_CAR_VIDEO_SOURCES: Readonly<Record<number, string>> = {
  1: '/video/小车1视频.mp4',
  2: '/video/小车2视频.mp4',
  3: '/video/小车3视频.mp4',
  4: '/video/小车4视频.mp4',
}

export const PRIORITY_MONITOR_VIDEO_SOURCES: readonly string[] = [
  '/gas_video/气体1.mp4',
  '/gas_video/气体2.mp4',
  '/gas_video/气体3.mp4',
  '/gas_video/气体4.mp4',
]

function toFiniteNumber(value: unknown): number | null {
  if (value == null || (typeof value === 'string' && value.trim() === '')) {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function isValidReading(reading: ConcentrationTrendPoint): boolean {
  const carId = toFiniteNumber(reading.carId)
  return (
    carId !== null && carId > 0 && toFiniteNumber(reading.gasValue) !== null
  )
}

function warningToReading(
  warning: WarningHistoryRecord,
): PatrolCarReading | null {
  const carId = toFiniteNumber(warning.carId)
  const gasValue = toFiniteNumber(warning.gasValue)
  if (
    carId === null ||
    carId <= 0 ||
    gasValue === null ||
    !warning.warningTime
  ) {
    return null
  }

  return {
    time: warning.warningTime,
    carId,
    areaName: warning.areaName,
    gasType: warning.gasType,
    gasValue,
    source: 'warning_history',
    qualityStatus: 'EVENT_RECORDED',
    x: toFiniteNumber(warning.x) ?? undefined,
    y: toFiniteNumber(warning.y) ?? undefined,
  }
}

export function resolvePatrolCarReadings(
  sampledReadings: readonly ConcentrationTrendPoint[],
  warningHistory: readonly WarningHistoryRecord[],
): PatrolCarReading[] {
  const validSamples = sampledReadings
    .filter(isValidReading)
    .map((reading) => ({
      ...reading,
      carId: Number(reading.carId),
      gasValue: Number(reading.gasValue),
    }))
  const sampledCarIds = new Set(validSamples.map((reading) => reading.carId))
  const eventReadings = warningHistory
    .map(warningToReading)
    .filter((reading): reading is PatrolCarReading => reading !== null)
    .filter((reading) => !sampledCarIds.has(reading.carId))

  return [...validSamples, ...eventReadings].sort(
    (left, right) =>
      new Date(left.time).getTime() - new Date(right.time).getTime(),
  )
}
