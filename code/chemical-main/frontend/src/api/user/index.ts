//统一管理咱们项目用户相关的接口
import request from '@/utils/request'
import type {
  loginFormData,
  loginResponseData,
  registerFormData,
  registerResponseData,
} from './type'

//项目用户相关的请求地址
enum API {
  LOGIN_URL = '/auth/login',
  REGISTER_URL = '/auth/register'
}

//登录接口
export const reqLogin = (data: loginFormData) =>
    request.post<loginFormData, loginResponseData>(API.LOGIN_URL, data)

//注册接口
export const reqRegister = (data: registerFormData) =>
    request.post<registerFormData, registerResponseData>(API.REGISTER_URL, data)
