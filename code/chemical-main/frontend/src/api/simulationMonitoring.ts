import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface SensorReadingRecord {
  id?: number | null
  scenarioId?: number | null
  sensorId: string
  gasType?: string | null
  concentration?: number | null
  unit?: string | null
  sampledAt?: string | null
  receivedAt?: string | null
  source?: string | null
  qualityStatus?: string | null
  rawPayload?: string | null
}

export interface SensorReadingQuery {
  limit?: number
  sensorId?: string
}

export const reqRecentSensorReadings = (params: SensorReadingQuery = {}) =>
  request.get<null, ApiResult<SensorReadingRecord[]>>('/simulation-monitoring/readings/recent', { params })

export const reqLatestSensorReading = () =>
  request.get<null, ApiResult<SensorReadingRecord | null>>('/simulation-monitoring/readings/latest')
