import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface WarningHistoryRecord {
  id?: number
  carId: number | string
  areaName?: string
  x?: number
  y?: number
  gasType?: string
  gasValue: number | string | null
  warningTime: string
}

export interface WarningHistoryCreatePayload {
  carId: number
  gasType: string
  gasValue: number
}

export const reqAddWarningHistory = (data: WarningHistoryCreatePayload) =>
  request.post<WarningHistoryCreatePayload, ApiResult<string>>('/history/add', data)

export const reqWarningHistoryList = () =>
  request.get<null, ApiResult<WarningHistoryRecord[]>>('/history/list')

export const reqDeleteWarningHistory = (id: number) =>
  request.post<{ id: number }, ApiResult<string>>('/history/delete', { id })

export const buildLatestWarningByCarId = (records: WarningHistoryRecord[]) => {
  const latest: Record<number, WarningHistoryRecord> = {}

  records.forEach((record) => {
    const carId = Number(record.carId)
    if (!Number.isFinite(carId)) return

    const previous = latest[carId]
    if (!previous || new Date(record.warningTime).getTime() > new Date(previous.warningTime).getTime()) {
      latest[carId] = record
    }
  })

  return latest
}
