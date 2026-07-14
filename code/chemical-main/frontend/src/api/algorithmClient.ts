import axios from 'axios'
import { createHttpClient } from '@/utils/request'
import type { HttpClient } from '@/utils/request'

interface AlgorithmErrorBody {
  message?: string
  error?: string
  requestId?: string
}

interface AlgorithmClientError extends Error {
  response?: {
    status?: number
    data?: AlgorithmErrorBody
  }
  cause?: unknown
}

const algorithmClient = createHttpClient({
  baseURL: import.meta.env.VITE_ALGORITHM_BASE_API || '/algorithm-api',
  timeout: 30000,
  onRejected: (error) => {
    const axiosError = axios.isAxiosError<AlgorithmErrorBody>(error) ? error : null
    const response = axiosError?.response
    const responseBody = response?.data
    const message = !response || response.status === 0
      ? '算法服务连接失败'
      : responseBody?.message || responseBody?.error || '算法服务请求异常'

    const normalizedError = new Error(message) as AlgorithmClientError
    normalizedError.response = response
    normalizedError.cause = error
    return Promise.reject(normalizedError)
  },
}) as HttpClient

algorithmClient.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_ALGORITHM_API_KEY
  if (apiKey) {
    config.headers.set('X-API-Key', apiKey)
  }
  return config
})

export default algorithmClient
