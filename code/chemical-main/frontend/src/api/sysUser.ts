// 用户账号管理接口（admin 权限），对应后端 com.at.controller.UserController。
// 取代 acl/role 页面此前基于 personnelDirectory 的内存假数据 CRUD。
import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export type UserRole = 'admin' | 'user'

// 列表项：后端响应 DTO 不返回 password。
export interface SysUser {
  id: number
  username: string
  role: UserRole
}

export interface UserCreatePayload {
  username: string
  password: string
  role: UserRole
}

export interface UserUpdatePayload {
  role: UserRole
  // 留空表示不改密码。
  password?: string
}

// 用户列表
export const reqUserList = () =>
  request.get<null, ApiResult<SysUser[]>>('/user/list')

// 新增用户
export const reqCreateUser = (data: UserCreatePayload) =>
  request.post<UserCreatePayload, ApiResult<string>>('/user', data)

// 更新用户（角色 / 可选改密）
export const reqUpdateUser = (id: number, data: UserUpdatePayload) =>
  request.put<UserUpdatePayload, ApiResult<string>>(`/user/${id}`, data)

// 删除用户
export const reqDeleteUser = (id: number) =>
  request.delete<null, ApiResult<string>>(`/user/${id}`)
