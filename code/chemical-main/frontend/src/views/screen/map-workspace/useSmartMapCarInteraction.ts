import { ref, type Ref } from 'vue'
import type { Router } from 'vue-router'
import { reqAnalyzePersonImage } from '@/api/analysis'
import { buildSmartMapCarInfo } from './useSmartMapCarInfo'
import { navigateToSmartMapCarDetail } from './useSmartMapPageActions'
import {
  buildYoloResult,
  captureCarSnapshot,
  type SmartMapViewState,
  type SmartMapYoloResult,
  type YoloCaptureResult,
} from './useSmartMapYolo'
import type { SmartMapInfoPanelContent } from './useSmartMapInfoPanel'

export interface SmartMapCarRecord {
  id: number
  x: number
  y: number
  status?: string
}

interface SmartMapCarThreshold {
  threshold?: number | number[]
  unit?: string
}

interface SmartMapCarStore<TCar extends SmartMapCarRecord> {
  carList: TCar[]
  gasThreshold: Record<number, SmartMapCarThreshold | undefined>
  resetCarStatus: (carId: number) => Promise<unknown>
  setCarWarning: (carId: number) => Promise<unknown>
}

interface SmartMapCarInteractionOptions<TCar extends SmartMapCarRecord> {
  carStore: SmartMapCarStore<TCar>
  router: Router
  getCanvas: () => HTMLCanvasElement | null
  viewState: SmartMapViewState
  selectedFacility: Ref<unknown | null>
  selectedSensor: Ref<unknown | null>
  setInfoPanel: (content: SmartMapInfoPanelContent) => void
  refreshCarData: () => unknown
  render: () => void
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void
  getErrorMessage: (err: unknown, fallback?: string) => string
}

export interface SmartMapCarInteractionLayerState<TCar> {
  getSelectedCar: () => TCar | null
  getHoveredCar: () => TCar | null
}

export function useSmartMapCarInteraction<TCar extends SmartMapCarRecord>(
  options: SmartMapCarInteractionOptions<TCar>,
) {
  const selectedCar = ref<TCar | null>(null)
  const hoveredCar = ref<TCar | null>(null)
  const yoloResult = ref<SmartMapYoloResult | null>(null)

  function showCarInfo(car: TCar) {
    options.setInfoPanel(buildSmartMapCarInfo({
      car,
      threshold: options.carStore.gasThreshold[car.id],
      navigateToCarDetail,
      toggleCarWarning,
      triggerYoloForCar,
    }))
    options.selectedFacility.value = null
    options.selectedSensor.value = null
    options.render()
  }

  function selectCar(car: TCar) {
    selectedCar.value = car
    options.selectedFacility.value = null
    options.selectedSensor.value = null
    showCarInfo(car)
  }

  function navigateToCarDetail(carId: number | string) {
    navigateToSmartMapCarDetail(options.router, carId)
  }

  function handleCarClick(carId: number) {
    const car = options.carStore.carList.find(item => item.id === carId)
    if (!car) return
    selectCar(car)
  }

  async function triggerYoloForCar(carId: number) {
    const car = options.carStore.carList.find(item => item.id === carId)
    if (!car) return
    options.showToast(`小车 ${carId} YOLO 检测中...`, 'success')
    try {
      const canvas = options.getCanvas()
      if (!canvas) {
        options.showToast('YOLO capture failed: image capture unavailable', 'warn')
        return
      }
      const blob = await captureCarSnapshot(canvas, options.viewState, car)
      if (!blob) {
        options.showToast('YOLO capture failed: image capture unavailable', 'warn')
        return
      }
      const formData = new FormData()
      formData.append('file', blob, `car_${carId}_capture.png`)
      try {
        const responseBody = await reqAnalyzePersonImage<YoloCaptureResult>(formData)
        const data = responseBody.data
        const nextResult = buildYoloResult(carId, data)
        if (nextResult) {
          yoloResult.value = nextResult
          options.showToast(`小车 ${carId} 检测到 ${nextResult.count} 人`, 'success')
          if (selectedCar.value?.id === carId) {
            showCarInfo(selectedCar.value)
          }
          options.render()
        } else {
          options.showToast(data?.message || 'YOLO 检测未返回结果', 'warn')
        }
      } catch (err: unknown) {
        options.showToast(`YOLO API 请求失败：${options.getErrorMessage(err, '请确认后端服务已启动')}`, 'warn')
      }
    } catch (err: unknown) {
      options.showToast(`YOLO 检测失败: ${options.getErrorMessage(err)}`, 'warn')
    }
  }

  async function toggleCarWarning(carId: number) {
    const car = options.carStore.carList.find(item => item.id === carId)
    if (!car) return
    try {
      if (car.status === 'warning') {
        await options.carStore.resetCarStatus(carId)
        options.showToast(`小车 ${carId} 状态已重置`, 'success')
      } else {
        await options.carStore.setCarWarning(carId)
        options.showToast(`小车 ${carId} 预警已触发`, 'warn')
      }
      options.refreshCarData()
    } catch (err: unknown) {
      options.showToast(`操作失败: ${options.getErrorMessage(err)}`, 'warn')
    }
  }

  const carInteractionLayerState: SmartMapCarInteractionLayerState<TCar> = {
    getSelectedCar: () => selectedCar.value,
    getHoveredCar: () => hoveredCar.value,
  }

  return {
    carInteractionLayerState,
    handleCarClick,
    hoveredCar,
    selectedCar,
    selectCar,
    showCarInfo,
    toggleCarWarning,
    triggerYoloForCar,
    yoloResult,
  }
}
