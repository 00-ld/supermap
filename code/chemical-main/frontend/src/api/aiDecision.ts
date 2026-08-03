import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export type AiAdviceSource = 'QWEN' | 'RULE'
export type AiReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AiAdviceRecord {
  id: number
  alertId: number
  carId: number
  alertType: string
  source: AiAdviceSource
  model?: string | null
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  summary: string
  riskExplanation: string
  recommendations: string[]
  allowedActions: string[]
  fallbackReason?: string | null
  reviewStatus: AiReviewStatus
  reviewedBy?: string | null
  reviewComment?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export const reqGenerateAiAdvice = (alertId: number, evidence?: string) =>
  request.post<{ alertType: string; evidence?: string }, ApiResult<AiAdviceRecord>>(
    `/mobile/alerts/${alertId}/ai-advice`,
    { alertType: 'GAS_CONCENTRATION', evidence },
  )

export const reqQuickAiAdvice = (payload: {
  carId?: number
  gasType?: string
  gasValue?: number
  scenario: string
}) => request.post<typeof payload, ApiResult<AiAdviceRecord>>('/mobile/ai-advice/quick', payload)

export const reqAiAdvice = (adviceId: number) =>
  request.get<null, ApiResult<AiAdviceRecord>>(`/mobile/ai-advice/${adviceId}`)

export const reqLatestAiAdvice = (alertId: number) =>
  request.get<null, ApiResult<AiAdviceRecord | null>>(`/mobile/alerts/${alertId}/ai-advice/latest`)

export const reqApproveAiAdvice = (adviceId: number, comment?: string) =>
  request.post<{ comment?: string }, ApiResult<AiAdviceRecord>>(
    `/mobile/ai-advice/${adviceId}/approve`,
    { comment },
  )

export const reqRejectAiAdvice = (adviceId: number, comment?: string) =>
  request.post<{ comment?: string }, ApiResult<AiAdviceRecord>>(
    `/mobile/ai-advice/${adviceId}/reject`,
    { comment },
  )
