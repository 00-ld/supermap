import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface SensorRecord {
  id: string
  x?: number | null
  y?: number | null
  installationHeight?: number | null
  effectiveRange?: number | null
  detectionRange?: string | null
  installRemark?: string | null
  priority?: number | null
  risk?: number | null
  type?: string | null
  mode?: string | null
  lastSampleTime?: number | null
  createdAt?: string
  updatedAt?: string
}

export type SensorSavePayload = Omit<SensorRecord, 'createdAt' | 'updatedAt'>

export const reqSensorList = () =>
  request.get<null, ApiResult<SensorRecord[]>>('/sensor/list')

export const reqAddSensor = (data: SensorSavePayload) =>
  request.post<SensorSavePayload, ApiResult<string>>('/sensor/add', data)

export const reqUpdateSensor = (data: SensorSavePayload) =>
  request.post<SensorSavePayload, ApiResult<string>>('/sensor/update', data)

export const reqDeleteSensor = (id: string) =>
  request.post<{ id: string }, ApiResult<string>>('/sensor/delete', { id })
