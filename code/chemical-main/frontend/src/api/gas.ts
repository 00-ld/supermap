import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface GasRecord {
  id: string
  name: string
  detectionRange?: string | null
  installationHeight?: number | null
  effectiveRange?: number | null
  installRemark?: string | null
  priority?: number | null
  risk?: number | null
  type?: string | null
  mode?: string | null
  createdAt?: string
  updatedAt?: string
}

export type GasSavePayload = Omit<GasRecord, 'createdAt' | 'updatedAt'>

export const reqGasList = () =>
  request.get<null, ApiResult<GasRecord[]>>('/gas/list')

export const reqAddGas = (data: GasSavePayload) =>
  request.post<GasSavePayload, ApiResult<string>>('/gas/add', data)

export const reqUpdateGas = (data: GasSavePayload) =>
  request.post<GasSavePayload, ApiResult<string>>('/gas/update', data)

export const reqDeleteGas = (id: string) =>
  request.post<{ id: string }, ApiResult<string>>('/gas/delete', { id })
