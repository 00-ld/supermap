// 传感器点位记录类型（纯客户端数据结构）。
// 后端 sensor 表与 /sensor/* 接口已下线，此处仅保留前端布点所需的字段形状。
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
