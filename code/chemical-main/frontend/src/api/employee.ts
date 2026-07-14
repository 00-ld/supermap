// 员工信息管理接口，对应后端 com.at.controller.EmployeeController。
// 读列表登录即可，新增/更新/删除需 admin 权限。取代此前 personnelDirectory 的本地假数据。
import request from '@/utils/request'
import type { ApiResult } from '@/types/api'

export type EmployeeStatus = '在岗' | '休假' | '离职'

// 员工记录。gender：1=男 2=女。
export interface Employee {
  id: number
  name: string
  age: number
  gender: number
  phone: string
  department: string
  employeeNo: number
  status: EmployeeStatus
  jobDesc: string
  createTime?: string
}

// 新增/更新共用的请求体（不含主键 id 与 createTime）。
export interface EmployeeSavePayload {
  name: string
  age: number
  gender: number
  phone: string
  department: string
  employeeNo: number
  status: EmployeeStatus
  jobDesc: string
}

// 员工列表
export const reqEmployeeList = () =>
  request.get<null, ApiResult<Employee[]>>('/employee/list')

// 新增员工
export const reqCreateEmployee = (data: EmployeeSavePayload) =>
  request.post<EmployeeSavePayload, ApiResult<Employee>>('/employee', data)

// 更新员工
export const reqUpdateEmployee = (id: number, data: EmployeeSavePayload) =>
  request.put<EmployeeSavePayload, ApiResult<Employee>>(`/employee/${id}`, data)

// 删除员工
export const reqDeleteEmployee = (id: number) =>
  request.delete<null, ApiResult<string>>(`/employee/${id}`)
