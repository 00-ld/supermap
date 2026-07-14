import { reactive, ref, type Ref } from 'vue'
import type { CarItem } from '@/store/carStore'
import type { DiffusionFrame } from '@/data/phase1Config'
import type { SmartMapRecord } from './useSmartMapInversion'

export interface SmartMapCarMarker {
  id: number
  x: number
  y: number
  status?: string
  gasLabel?: string
  [key: string]: unknown
}

export interface SmartMapMobileSensorReading extends SmartMapRecord {
  id: string
  x: number
  y: number
  type: 'gas'
  priority: number
  mode: 'auto'
  sampledSeries: Array<{
    frameIndex: number
    timeSec: number
    concentration: number
  }>
  sampledPeak: number
  manualSeries: []
  risk: number
  carId: number
  currentConcentration: number
}

export interface SmartMapCarPatrolRoute {
  waypoints: Array<{ x: number; y: number }>
  speed: number
}

interface DrawSmartMapCarsOptions {
  showCars: boolean
  carMarkers: SmartMapCarMarker[]
  selectedCar: { id: number } | null
  hoveredCar: { id: number } | null
  mobileSensorReadings: SmartMapMobileSensorReading[]
  now?: number
}

interface SmartMapCarStoreLike {
  carList: CarItem[]
  fetchCarDataFromDB: () => Promise<void>
}

interface SmartMapCarPatrolOptions {
  carStore: SmartMapCarStoreLike
  carPatrolRoutes: Record<number, SmartMapCarPatrolRoute | undefined>
  diffusionFrames: Ref<DiffusionFrame[]>
  getCurrentFrame: () => DiffusionFrame | null
  getCurrentFrameIndex: () => number
  getFrameConcentrationAtPoint: (frame: DiffusionFrame, x: number, y: number) => number
  render: () => void
  showToast: (text: string, type?: 'success' | 'warn' | 'error' | 'danger') => void
}

export interface SmartMapCarLayerState {
  showCars: () => boolean
  getCarMarkers: () => SmartMapCarMarker[]
  getMobileSensorReadings: () => SmartMapMobileSensorReading[]
}

const GAS_LABEL_BY_CAR_ID: Record<number, string> = {
  1: '甲烷',
  2: '氨气',
  3: '一氧化碳',
  4: '氧气',
}

export function useSmartMapCarPatrol(options: SmartMapCarPatrolOptions) {
  const showCars = ref(false)
  const carRefreshTimer = ref(0)
  const carMarkers = ref<SmartMapCarMarker[]>([])
  const carPatrolEnabled = ref(false)
  const carPatrolState = reactive<Record<number, { waypointIndex: number }>>({})
  const mobileSensorReadings = ref<SmartMapMobileSensorReading[]>([])
  const carLayerState: SmartMapCarLayerState = {
    showCars: () => showCars.value,
    getCarMarkers: () => carMarkers.value,
    getMobileSensorReadings: () => mobileSensorReadings.value,
  }

  const syncCarMarkers = () => {
    carMarkers.value = options.carStore.carList.map(car => ({
      id: car.id,
      x: car.x,
      y: car.y,
      status: car.status,
      gasLabel: GAS_LABEL_BY_CAR_ID[car.id] || '',
    }))
  }

  const syncCarMobileSensors = () => {
    if (!options.diffusionFrames.value.length) return
    const frame = options.getCurrentFrame()
    if (!frame) return
    const frameIndex = options.getCurrentFrameIndex()
    mobileSensorReadings.value = options.carStore.carList.map(car => {
      const concentration = options.getFrameConcentrationAtPoint(frame, car.x, car.y)
      return {
        id: `car_sensor_${car.id}`,
        x: car.x,
        y: car.y,
        type: 'gas',
        priority: 2,
        mode: 'auto',
        sampledSeries: [{ frameIndex, timeSec: frame.timeSec, concentration }],
        sampledPeak: concentration,
        manualSeries: [],
        risk: 0,
        carId: car.id,
        currentConcentration: concentration,
      }
    })
  }

  const toggleCars = () => {
    showCars.value = !showCars.value
    options.render()
    options.showToast(showCars.value ? '小车标记已显示' : '小车标记已隐藏', 'success')
  }

  const toggleCarPatrol = () => {
    carPatrolEnabled.value = !carPatrolEnabled.value
    if (carPatrolEnabled.value) {
      options.carStore.carList.forEach(car => {
        const route = options.carPatrolRoutes[car.id]
        if (route) {
          carPatrolState[car.id] = { waypointIndex: 0 }
          const start = route.waypoints[0]
          car.x = start.x
          car.y = start.y
        }
      })
      syncCarMarkers()
      options.showToast('小车巡逻已启动', 'success')
    } else {
      options.showToast('小车巡逻已停止', 'warn')
    }
    options.render()
  }

  const refreshCarData = () => {
    if (carPatrolEnabled.value) {
      syncCarMarkers()
      options.render()
      return
    }
    options.carStore.fetchCarDataFromDB().then(() => {
      syncCarMarkers()
      options.render()
    }).catch(() => {
      syncCarMarkers()
      options.render()
    })
  }

  const updateCarPatrol = (deltaMs: number) => {
    if (!carPatrolEnabled.value) return
    for (const car of options.carStore.carList) {
      const route = options.carPatrolRoutes[car.id]
      if (!route) continue
      let state = carPatrolState[car.id]
      if (!state) {
        state = { waypointIndex: 0 }
        carPatrolState[car.id] = state
      }
      const waypoints = route.waypoints
      const toIdx = (state.waypointIndex + 1) % waypoints.length
      const to = waypoints[toIdx]
      const dx = to.x - car.x
      const dy = to.y - car.y
      const remaining = Math.hypot(dx, dy)
      const step = route.speed * deltaMs / 16
      if (remaining <= step + 0.1) {
        state.waypointIndex = toIdx
        car.x = to.x
        car.y = to.y
      } else {
        const ratio = step / remaining
        car.x += dx * ratio
        car.y += dy * ratio
      }
    }
    syncCarMarkers()
    syncCarMobileSensors()
  }

  const carHitTest = (wx: number, wy: number): CarItem | null => {
    for (let index = carMarkers.value.length - 1; index >= 0; index--) {
      const car = carMarkers.value[index]
      if (Math.hypot(wx - car.x, wy - car.y) <= 16) {
        return options.carStore.carList.find(item => item.id === car.id) || null
      }
    }
    return null
  }

  syncCarMarkers()

  return {
    carLayerState,
    carMarkers,
    carPatrolEnabled,
    carRefreshTimer,
    mobileSensorReadings,
    showCars,
    refreshCarData,
    syncCarMarkers,
    syncCarMobileSensors,
    toggleCarPatrol,
    toggleCars,
    carHitTest,
    updateCarPatrol,
  }
}

export function drawSmartMapCars(ctx: CanvasRenderingContext2D, options: DrawSmartMapCarsOptions) {
  if (!options.showCars || !options.carMarkers.length) return
  const now = options.now ?? Date.now()
  options.carMarkers.forEach(car => {
    const isSelected = options.selectedCar?.id === car.id
    const isHovered = options.hoveredCar?.id === car.id
    const isWarning = car.status === 'warning'
    const cx = car.x
    const cy = car.y

    ctx.save()
    ctx.translate(cx, cy)

    if (isWarning) {
      const glow = 0.3 + 0.3 * Math.sin(now / 250)
      ctx.fillStyle = `rgba(199,130,130,${glow * 0.20})`
      ctx.beginPath()
      ctx.arc(0, 0, 22, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(199,130,130,${glow * 0.42})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(0, 0, 26, 0, Math.PI * 2)
      ctx.stroke()
    }

    if (isSelected) {
      ctx.strokeStyle = '#b4beca'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(0, 0, 20, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    const bodyColor = isWarning ? '#c78282' : (isHovered ? '#b4beca' : '#60758f')
    ctx.fillStyle = bodyColor
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 1.5
    const bw = 20
    const bh = 12
    const rx = bw / 2
    const ry = bh / 2
    ctx.beginPath()
    ctx.moveTo(-rx + 3, -ry)
    ctx.lineTo(rx - 3, -ry)
    ctx.quadraticCurveTo(rx, -ry, rx, -ry + 3)
    ctx.lineTo(rx, ry - 3)
    ctx.quadraticCurveTo(rx, ry, rx - 3, ry)
    ctx.lineTo(-rx + 3, ry)
    ctx.quadraticCurveTo(-rx, ry, -rx, ry - 3)
    ctx.lineTo(-rx, -ry + 3)
    ctx.quadraticCurveTo(-rx, -ry, -rx + 3, -ry)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = isWarning ? '#d6a0a0' : '#aab6c4'
    ctx.beginPath()
    ctx.arc(0, -2, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 0.8
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.font = 'bold 10px "Noto Sans SC"'
    const label = `#${car.id}`
    const tw = ctx.measureText(label).width
    const lx = 0
    const ly = -ry - 6
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(lx - tw / 2 - 3, ly - 10, tw + 6, 13)
    ctx.fillStyle = '#fff'
    ctx.fillText(label, lx, ly)

    ctx.textBaseline = 'top'
    ctx.font = '8px "Noto Sans SC"'
    const statusText = isWarning ? '异常' : '正常'
    ctx.fillStyle = isWarning ? '#d6a0a0' : '#b4beca'
    ctx.fillText(statusText, 0, ry + 3)

    const mobileSensor = options.mobileSensorReadings.find(item => item.carId === car.id)
    if (mobileSensor && mobileSensor.currentConcentration > 0) {
      ctx.textBaseline = 'bottom'
      ctx.font = 'bold 9px "Noto Sans SC"'
      const concText = mobileSensor.currentConcentration.toFixed(1) + ' ppm'
      const concColor = mobileSensor.currentConcentration > 20
        ? '#d6a0a0'
        : mobileSensor.currentConcentration > 10
          ? '#d2b878'
          : '#aab6c4'
      ctx.fillStyle = concColor
      ctx.fillText(concText, 12, -ry + 4)
    }

    ctx.restore()
  })
}
