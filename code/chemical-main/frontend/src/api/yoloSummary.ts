import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export interface YoloSummary {
  currentCount: number | null
  analysisTime: number | null
  riskCount: number
  onlineDevices: number
  lastAnalysisTime?: string | null
}

export const reqYoloSummary = () =>
  request.get<null, ApiResult<YoloSummary>>('/analysis/summary')
