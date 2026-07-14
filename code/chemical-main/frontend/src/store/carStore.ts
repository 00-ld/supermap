import { defineStore } from 'pinia'
import { reqCarList, reqResetCarStatus, reqSetCarWarning } from '@/api/car'
import type { CarRecord } from '@/api/car'
import { CAR_GAS_THRESHOLD } from '@/data/gasCatalog'

// 完整小车数据接口（包含坐标，用于管理页）
export interface CarItem {
  id: number
  x: number
  y: number
  status: 'normal' | 'warning'
}

// 状态接口（保留）
export interface CarStatusItem {
  id: number
  status: 'normal' | 'warning'
}

interface GasThreshold {
  [key: number]: {
    threshold: number | [number, number]
    unit: string
  }
}

export const useCarStore = defineStore('car', {
  state: (): {
    carList: CarItem[]; // 唯一数据源（含坐标+状态）
    gasThreshold: GasThreshold
  } => ({
    // 管理页完整数据（仅用于后端不可用时维持地图布局，不制造业务告警状态）
    carList: [
      { id: 1, x: 450, y: 565, status: 'normal' },
      { id: 2, x: 690, y: 500, status: 'normal' },
      { id: 3, x: 925, y: 430, status: 'normal' },
      { id: 4, x: 1125, y: 610, status: 'normal' }
    ],
    // 报警阈值统一引用 data/gasCatalog 的单一数据源，避免多处硬编码漂移。
    gasThreshold: CAR_GAS_THRESHOLD
  }),
  actions: {
    // 核心：从后端加载所有小车数据（含坐标+状态）
    async fetchCarDataFromDB() {
      try {
        const res = await reqCarList()
        if (res.code === 200 && Array.isArray(res.data)) {
          // 格式化后端数据为前端结构，写入唯一数据源 carList
          this.carList = res.data.map((item: CarRecord) => ({
            id: item.carId,
            x: item.x,
            y: item.y,
            status: item.warning === 1 ? 'warning' : 'normal'
          }))
        }
      } catch (error) {
        console.error('加载数据库数据失败，使用本地默认：', error)
        // 失败时保留本地默认值，保证页面能渲染
      }
    },

    // 手动设置异常（同步后端+更新本地状态）
    async setCarWarning(carId: number): Promise<void> {
      try {
        // 1. 同步到后端
        await reqSetCarWarning(carId)
        // 2. 更新唯一数据源
        const car = this.carList.find(item => item.id === carId)
        if (car) car.status = 'warning'
      } catch (error) {
        console.error(`设置小车${carId}异常失败：`, error)
        throw error // 抛出错误让组件层提示
      }
    },

    // 重置状态（同步后端+更新本地状态）
    async resetCarStatus(carId: number): Promise<void> {
      try {
        // 1. 同步到后端
        await reqResetCarStatus(carId)
        // 2. 更新唯一数据源
        const car = this.carList.find(item => item.id === carId)
        if (car) car.status = 'normal'
      } catch (error) {
        console.error(`重置小车${carId}状态失败：`, error)
        throw error
      }
    }
  },
  getters: {
    // 状态列表由唯一数据源 carList 派生（供 Home/Detail 使用），避免双数据源漂移
    carStatusList: (state): CarStatusItem[] =>
      state.carList.map(car => ({ id: car.id, status: car.status })),
    // 获取指定小车状态（全局通用）
    getCarStatus: (state) => (carId: number): 'normal' | 'warning' => {
      const car = state.carList.find(item => item.id === carId)
      return car ? car.status : 'normal'
    }
  }
})
