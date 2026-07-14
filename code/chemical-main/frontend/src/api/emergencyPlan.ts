import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface EmergencyPlanRecord {
  id: number
  name: string
  type: string
  description: string
  level: string
}

export const reqEmergencyPlanList = () =>
  request.get<null, ApiResult<EmergencyPlanRecord[]>>('/emergency-plan/list')
