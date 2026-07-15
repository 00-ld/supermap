import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import useUserStore from '@/store/modules/user'
import { GET_TOKEN, REMOVE_TOKEN } from '@/utils/token'
import router from '@/router'
import type { ApiResult } from '@/types/api'

export type { ApiResult } from '@/types/api'

export type HttpClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> & {
  get<T = unknown, R = ApiResult<T>>(url: string, config?: AxiosRequestConfig): Promise<R>
  post<T = unknown, R = ApiResult<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R>
  put<T = unknown, R = ApiResult<T>>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<R>
  delete<T = unknown, R = ApiResult<T>>(url: string, config?: AxiosRequestConfig): Promise<R>
}

interface HttpClientOptions {
  baseURL: string
  timeout: number
  withAuthToken?: boolean
  onRejected?: (error: unknown) => Promise<never>
}

interface ErrorResponseBody {
  message?: string
}

const publicDemoRoutes = new Set(['/screen', '/smart-map'])

const attachAuthToken = (config: InternalAxiosRequestConfig) => {
  const userStore = useUserStore()
  const token = userStore.token || GET_TOKEN()
  if (token) {
    config.headers.set('token', token)
  }
  return config
}

const handleDefaultError = (error: unknown) => {
  const axiosError = axios.isAxiosError<ErrorResponseBody>(error) ? error : null
  let message = ''
  const status = axiosError?.response?.status
  const url: string = axiosError?.config?.url || ''
  const isAuthEntry = /\/(login|register)\b/.test(url)
  const isPublicDemoRoute = publicDemoRoutes.has(router.currentRoute.value.path)
  const responseMessage = axiosError?.response?.data?.message

  switch (status) {
    case 401:
      if (isAuthEntry) {
        message = responseMessage || '用户名或密码错误'
      } else if (isPublicDemoRoute) {
        message = '未登录，演示入口已降级为本地默认数据'
      } else {
        message = '登录已过期，请重新登录'
        REMOVE_TOKEN()
        try {
          useUserStore().logout()
        } catch {
          // Pinia 尚未初始化时忽略清理错误。
        }
        if (router.currentRoute.value.path !== '/login') {
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.value.fullPath },
          })
        }
      }
      break
    case 403:
      message = '无权访问'
      break
    case 404:
      message = '请求地址错误'
      break
    case 500:
      message = responseMessage || '服务器错误'
      break
    default:
      message = responseMessage || '网络连接异常，请检查后端服务是否已启动'
      break
  }

  ElMessage({
    type: 'error',
    message,
  })
  return Promise.reject(error)
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const client = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeout,
  }) as HttpClient

  if (options.withAuthToken) {
    client.interceptors.request.use(attachAuthToken)
  }

  client.interceptors.response.use(
    (response) => response.data,
    options.onRejected ?? handleDefaultError,
  )

  return client
}

const request = createHttpClient({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api',
  timeout: 5000,
  withAuthToken: true,
})

export default request
