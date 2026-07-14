import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface CarRecord {
  id?: number
  carId: number
  warning: 0 | 1
  x: number
  y: number
  gasType?: string | null
}

export const reqCarList = () =>
  request.get<null, ApiResult<CarRecord[]>>('/car/getAllCars')

export const reqSetCarWarning = (carId: number) =>
  request.post<{ carId: number }, ApiResult<string>>('/car/setWarning', { carId })

export const reqResetCarStatus = (carId: number) =>
  request.post<{ carId: number }, ApiResult<string>>('/car/resetStatus', { carId })
