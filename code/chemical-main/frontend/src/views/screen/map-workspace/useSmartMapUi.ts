export interface ErrorLikeResponse {
  response?: {
    status?: number
    data?: {
      message?: string
    }
  }
  message?: string
}

export function eventValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement | null)?.value || ''
}

export function getErrorMessage(err: unknown, fallback = '操作失败'): string {
  if (err && typeof err === 'object') {
    const errorLike = err as ErrorLikeResponse
    return errorLike.response?.data?.message || errorLike.message || fallback
  }
  return fallback
}

export function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object') {
    return (err as ErrorLikeResponse).response?.status
  }
  return undefined
}
