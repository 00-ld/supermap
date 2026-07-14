import { computed, ref } from 'vue'
import { getSensorDevice } from '@/data/sensorCatalog'

export interface SmartMapDeviceImageCard {
  image?: string
  deviceName?: string
  location?: string
  concentration?: string
  standard?: string
  [key: string]: unknown
}

interface SmartMapDeviceSensor {
  id?: string
  [key: string]: unknown
}

interface SmartMapDeviceImageOptions<TSensor extends SmartMapDeviceSensor> {
  selectedSensor: { readonly value: TSensor | null }
  getCurrentConcentration: (sensor: TSensor) => number
  render: () => void
}

export function useSmartMapDeviceImage<TSensor extends SmartMapDeviceSensor>(options: SmartMapDeviceImageOptions<TSensor>) {
  const sensorDeviceImageCache = new Map<string, HTMLImageElement>()
  const sensorDeviceCard = computed<SmartMapDeviceImageCard | null>(() => {
    if (!options.selectedSensor.value) return null
    const sensor = options.selectedSensor.value
    const device = getSensorDevice(sensor)
    const concentration = options.getCurrentConcentration(sensor)
    const zonePrefix = (sensor.id || '').split('-')[0] || ''
    const zoneNames: Record<string, string> = {
      TK: '储罐区',
      TW: '塔器区',
      PA: '生产一区',
      PB: '精细化工区',
      P2: '生产二区',
      UT: '公用工程区',
      WH: '仓储物流区',
      WT: '污水处理区',
      MN: '环境监测区',
      MT: '机修维护区',
      FS: '消防设施区',
      FD: '防火堤',
      PL: '管道区',
      A: '行政办公区',
    }
    return {
      ...device,
      location: `${zoneNames[zonePrefix] || '园区'} / ${sensor.id}`,
      concentration: `${concentration.toFixed(2)} ppm`,
    }
  })
  const deviceFullscreenVisible = ref(false)
  const deviceImgZoom = ref(1)
  const deviceImgPanX = ref(0)
  const deviceImgPanY = ref(0)
  const deviceImgDragging = ref(false)
  const deviceImgDragStartX = ref(0)
  const deviceImgDragStartY = ref(0)
  const deviceImgPanStartX = ref(0)
  const deviceImgPanStartY = ref(0)
  const deviceImgWrapRef = ref<HTMLElement | null>(null)
  const deviceFullscreenData = computed<SmartMapDeviceImageCard>(() => {
    if (!options.selectedSensor.value) return {}
    const card = sensorDeviceCard.value
    if (!card) return {}
    return { ...card }
  })

  function getSensorDeviceImage(sensor: SmartMapDeviceSensor): HTMLImageElement | null {
    const device = getSensorDevice(sensor)
    if (!device?.image) return null
    if (sensorDeviceImageCache.has(device.image)) return sensorDeviceImageCache.get(device.image) ?? null
    const img = new Image()
    img.src = device.image
    img.onload = () => options.render()
    sensorDeviceImageCache.set(device.image, img)
    return img
  }

  function resetDeviceImageView() {
    deviceImgZoom.value = 1
    deviceImgPanX.value = 0
    deviceImgPanY.value = 0
  }

  function openDeviceFullscreen() {
    deviceFullscreenVisible.value = true
    resetDeviceImageView()
  }

  function closeDeviceFullscreen() {
    deviceFullscreenVisible.value = false
  }

  function onDeviceImgWheel(e: WheelEvent) {
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    deviceImgZoom.value = Math.max(0.5, Math.min(5, deviceImgZoom.value + delta))
  }

  function onDeviceImgDragStart(e: MouseEvent) {
    if (deviceImgZoom.value <= 1) return
    deviceImgDragging.value = true
    deviceImgDragStartX.value = e.clientX
    deviceImgDragStartY.value = e.clientY
    deviceImgPanStartX.value = deviceImgPanX.value
    deviceImgPanStartY.value = deviceImgPanY.value
  }

  function onDeviceImgDragMove(e: MouseEvent) {
    if (!deviceImgDragging.value) return
    const dx = (e.clientX - deviceImgDragStartX.value) / deviceImgZoom.value
    const dy = (e.clientY - deviceImgDragStartY.value) / deviceImgZoom.value
    deviceImgPanX.value = deviceImgPanStartX.value + dx
    deviceImgPanY.value = deviceImgPanStartY.value + dy
  }

  function onDeviceImgDragEnd() {
    deviceImgDragging.value = false
  }

  function onDeviceImgDblClick() {
    if (deviceImgZoom.value > 1) {
      resetDeviceImageView()
    } else {
      deviceImgZoom.value = 2.5
    }
  }

  function deviceImgZoomIn() {
    deviceImgZoom.value = Math.min(5, deviceImgZoom.value + 0.3)
  }

  function deviceImgZoomOut() {
    deviceImgZoom.value = Math.max(0.5, deviceImgZoom.value - 0.3)
  }

  return {
    sensorDeviceCard,
    getSensorDeviceImage,
    deviceFullscreenVisible,
    deviceFullscreenData,
    deviceImgZoom,
    deviceImgPanX,
    deviceImgPanY,
    deviceImgWrapRef,
    openDeviceFullscreen,
    closeDeviceFullscreen,
    onDeviceImgWheel,
    onDeviceImgDragStart,
    onDeviceImgDragMove,
    onDeviceImgDragEnd,
    onDeviceImgDblClick,
    deviceImgZoomIn,
    deviceImgZoomOut,
    deviceImgZoomReset: resetDeviceImageView,
  }
}
