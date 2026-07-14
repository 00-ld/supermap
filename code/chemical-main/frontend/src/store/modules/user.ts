// 用户信息相关的仓库
import { defineStore } from 'pinia'
import { reqLogin } from '@/api/user'
import type { loginFormData } from '@/api/user/type'

// 引入 token 本地存储工具（全项目统一的单一数据源，key 为 'TOKEN'）
import { GET_TOKEN, SET_TOKEN, REMOVE_TOKEN } from '@/utils/token'

interface JwtPayload {
  role?: string
  username?: string
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const base64Payload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const normalizedPayload = base64Payload.padEnd(base64Payload.length + ((4 - base64Payload.length % 4) % 4), '=')
    const parsed: unknown = JSON.parse(atob(normalizedPayload))
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Record<string, unknown>
    return {
      role: typeof record.role === 'string' ? record.role : undefined,
      username: typeof record.username === 'string' ? record.username : undefined,
    }
  } catch {
    return null
  }
}

const useUserStore = defineStore('user', {
  state: () => {
    return {
      // 初始化时从本地存储恢复登录态，保证刷新后仍保持登录
      token: GET_TOKEN() || '',
    }
  },
  actions: {
    // 用户登录
    async userLogin(data: loginFormData) {
      const result = await reqLogin(data)
      // 登录成功：同时写入内存(store)与本地存储
      if (result.code === 200) {
        this.token = result.data
        SET_TOKEN(result.data)
        return 'ok'
      } else {
        return Promise.reject(new Error(result.message))
      }
    },
    // 退出登录：清除内存与本地存储中的登录态
    logout() {
      this.token = ''
      REMOVE_TOKEN()
    },
  },
  getters: {
    currentRole: (state): string => decodeJwtPayload(state.token)?.role || '',
    currentUsername: (state): string => decodeJwtPayload(state.token)?.username || '',
    displayName: (state): string => {
      const payload = decodeJwtPayload(state.token)
      return payload?.username || (payload?.role === 'admin' ? '管理员' : '用户')
    },
    isAdmin: (state): boolean => decodeJwtPayload(state.token)?.role === 'admin',
  },
})

export default useUserStore
