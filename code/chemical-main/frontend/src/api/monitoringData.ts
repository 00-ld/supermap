import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface EnvironmentSnapshot {
  available: boolean
  windSpeed: number | null
  windDirection: number | null
  windDirectionText: string | null
  temperature: number | null
  humidity: number | null
  pressure: number | null
  noise: number | null
  sensorCount: number
  onlineSensorCount: number
  averageRisk: number
  maxRisk: number
  warningCarCount: number
  observedAt: string | null
  source: string | null
}

export interface ConcentrationTrendPoint {
  time: string
  carId: number
  areaName?: string | null
  gasType?: string | null
  gasValue: number
  sensorId?: string | null
  source?: string | null
  qualityStatus?: string | null
}

export interface LatestReading {
  carId: number
  areaName?: string | null
  gasType?: string | null
  gasValue: number
  warningTime: string | null
  sensorId?: string | null
  source?: string | null
  qualityStatus?: string | null
}

export interface MonitoringOverview {
  environment: EnvironmentSnapshot
  concentrationTrend: ConcentrationTrendPoint[]
  latestReadings: LatestReading[]
  weatherText: string
  activeWarningCount: number
}

export const reqMonitoringOverview = () =>
  request.get<null, ApiResult<MonitoringOverview>>('/monitoring/overview')

export const buildLatestReadingByCarId = (records: LatestReading[]) => {
  const latest: Record<number, LatestReading> = {}

  records.forEach((record) => {
    const carId = Number(record.carId)
    if (!Number.isFinite(carId) || carId <= 0) return

    const previous = latest[carId]
    const recordTime = record.warningTime ? new Date(record.warningTime).getTime() : 0
    const previousTime = previous?.warningTime ? new Date(previous.warningTime).getTime() : -1
    if (!previous || recordTime >= previousTime) {
      latest[carId] = record
    }
  })

  return latest
}
