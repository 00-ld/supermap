//定义用户相关数据的ts类型
import type { ApiResult } from '@/types/api'

//用户登录接口携带参数的ts类型
export interface loginFormData {
  username: string
  password: string
}

//定义注册接口
export interface registerFormData {
  username: string
  password: string
}
//定义登录接口返回数据类型
export type loginResponseData = ApiResult<string>

//定义注册接口返回数据类型
export type registerResponseData = ApiResult<string>
