import { ref, type Ref } from 'vue'
import type { SensorSavePayload } from '@/api/sensor'
import type { SmartMapPlacementPoint } from './useSmartMapSensorPlacement'

export interface SmartMapBatchSensor {
  id: string
}

export interface SmartMapBatchImportPoint {
  id: string
  xRel: number
  yRel: number
  x: number
  y: number
  height: number
  effectiveRange: number
}

type SmartMapBatchToastType = 'success' | 'warn' | 'error' | 'danger'

interface SmartMapSensorBatchImportOptions<TSensor extends SmartMapBatchSensor, TFacility> {
  sensors: Ref<TSensor[]>
  getOrigin: () => SmartMapPlacementPoint | null
  findNearestFacility: (x: number, y: number) => TFacility
  computeSensorRisk: (
    sensor: { detectionRange: string; installationHeight: number },
    facility: TFacility,
  ) => { risk: number; priority: number }
  saveSensorToDB: (sensor: SensorSavePayload) => Promise<boolean>
  fetchSensorsFromDB: () => Promise<unknown>
  showToast: (message: string, type: SmartMapBatchToastType) => void
}

export function useSmartMapSensorBatchImport<TSensor extends SmartMapBatchSensor, TFacility>(
  options: SmartMapSensorBatchImportOptions<TSensor, TFacility>,
) {
  const batchImportText = ref('')
  const batchImportPreview = ref<SmartMapBatchImportPoint[]>([])
  const batchDefaultHeight = ref(1.5)
  const batchDefaultRange = ref(4)

  function parseBatchImport() {
    const origin = options.getOrigin()
    if (!origin) {
      options.showToast('请先设置零点位置', 'warn')
      return
    }
    const preview: SmartMapBatchImportPoint[] = []
    let sensorIndex = options.sensors.value.length + 1
    const lines = batchImportText.value.split('\n').filter(line => line.trim())
    for (const line of lines) {
      const cleaned = line.replace(/m/gi, ' ')
      const parts = cleaned.split(/[\t,\s]+/).filter(part => part.trim() !== '')
      if (parts.length < 2) continue
      const nums = parts.map(part => Number.parseFloat(part)).filter(Number.isFinite)
      if (nums.length < 2) continue
      const xRel = nums[0]
      const yRel = nums[1]
      const parsedHeight = nums.length >= 3 ? nums[2] : batchDefaultHeight.value
      const mapX = origin.x + xRel
      const mapY = origin.y + yRel
      preview.push({
        id: `B-${String(sensorIndex++).padStart(2, '0')}`,
        xRel,
        yRel,
        x: mapX,
        y: mapY,
        height: Number.isNaN(parsedHeight) ? batchDefaultHeight.value : parsedHeight,
        effectiveRange: batchDefaultRange.value,
      })
    }
    batchImportPreview.value = preview
    options.showToast(`解析完成，共 ${preview.length} 个点位`, 'success')
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim()) {
        batchImportText.value = text
        parseBatchImport()
      } else {
        options.showToast('剪贴板为空，请先从Excel复制数据', 'warn')
      }
    } catch {
      options.showToast('请手动粘贴: Ctrl+V', 'warn')
    }
  }

  async function executeBatchImport() {
    if (batchImportPreview.value.length === 0) return
    let count = 0
    for (const item of batchImportPreview.value) {
      const nearestFacility = options.findNearestFacility(item.x, item.y)
      const tempSensor = {
        detectionRange: 'CO/CH4/NH3/O2',
        installationHeight: item.height || 1.5,
      }
      const { risk, priority } = options.computeSensorRisk(tempSensor, nearestFacility)
      const sensor: SensorSavePayload = {
        id: item.id,
        x: item.x,
        y: item.y,
        installationHeight: item.height,
        effectiveRange: item.effectiveRange,
        detectionRange: 'CO/CH4/NH3/O2',
        installRemark: `批量导入: 相对坐标(${item.xRel},${item.yRel})`,
        priority,
        risk,
        type: 'gas',
        mode: 'auto',
        lastSampleTime: null,
      }
      const success = await options.saveSensorToDB(sensor)
      if (success) count += 1
    }
    await options.fetchSensorsFromDB()
    batchImportText.value = ''
    batchImportPreview.value = []
    options.showToast(`批量导入完成，成功 ${count} 个传感器`, 'success')
  }

  return {
    batchImportText,
    batchImportPreview,
    batchDefaultHeight,
    batchDefaultRange,
    parseBatchImport,
    pasteFromClipboard,
    executeBatchImport,
  }
}
