import request from '@/utils/request'
import type { ApiResult } from '@/types/api'
import type { EmergencyAdvice } from '@/components/emergencyAssistantFallback'

export function requestEmergencyAdvice(scenario: string) {
  return request.post<EmergencyAdvice, ApiResult<EmergencyAdvice>>(
    '/mobile/ai-advice/quick',
    { scenario },
  )
}
