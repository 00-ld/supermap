// 监测点接口：取代 monitor_history 页面此前的浏览器本地假存储，接后端真实数据源。
import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface MonitorPoint {
  id: number
  name: string
  areaName?: string | null
  sourceType?: string | null
  sensorId?: string | null
  cameraUrl?: string | null
  x?: number | null
  y?: number | null
  qualityStatus?: 'UNBOUND' | 'SIMULATED' | 'CONFIGURED' | 'VERIFIED' | string | null
  createTime?: string
  updatedAt?: string
}

export interface MonitorPointCreatePayload {
  name: string
  areaName?: string
  sourceType?: string
  sensorId?: string
  cameraUrl?: string
  x?: number
  y?: number
  qualityStatus?: string
}

enum API {
  LIST_URL = '/monitor-point/list',
  CREATE_URL = '/monitor-point',
}

// 监测点列表（登录即可读）
export const reqMonitorPointList = () =>
  request.get<null, ApiResult<MonitorPoint[]>>(API.LIST_URL)

// 新增监测点（需 admin）
export const reqCreateMonitorPoint = (payload: string | MonitorPointCreatePayload) => {
  const data = typeof payload === 'string' ? { name: payload } : payload
  return request.post<MonitorPointCreatePayload, ApiResult<MonitorPoint>>(API.CREATE_URL, data)
}

// 删除监测点（需 admin）
export const reqDeleteMonitorPoint = (id: number) =>
  request.delete<null, ApiResult<string>>(`/monitor-point/${id}`)
