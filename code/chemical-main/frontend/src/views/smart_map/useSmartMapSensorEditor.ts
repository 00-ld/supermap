import { computed, reactive, ref, type Ref } from 'vue'
import type { SensorSavePayload } from '@/api/sensor'
import type { SmartMapRecord } from './useSmartMapInversion'

export interface SmartMapEditableSensor extends SensorSavePayload {
  id: string
  x: number
  y: number
  mode?: string
  manualSeries?: SmartMapRecord[]
  autoSampledSeries?: SmartMapRecord[]
  lastSampleTime?: number | null
}

export interface SmartMapSensorEditDraft {
  id: string
  installationHeight: number
  effectiveRange: number
  detectionRange: string
  installRemark: string
  priority: number
  risk: number
}

interface SmartMapSensorEditorFrameLike {
  frameIndex: number
}

interface SmartMapSensorEditorOptions<TSensor extends SmartMapEditableSensor, TFrame extends SmartMapSensorEditorFrameLike> {
  sensors: Ref<TSensor[]>
  selectedSensor: Ref<TSensor | null>
  diffusionFrames: Ref<TFrame[]>
  getCurrentFrame: () => TFrame | null
  buildActiveSensorSeries: (sourceSensors: TSensor[], frames: TFrame[]) => TSensor[]
  buildFrameSeriesTemplate: () => SmartMapRecord[]
  normalizeManualSeries: (manualSeries: SmartMapRecord[] | undefined, frames: TFrame[]) => SmartMapRecord[]
  normalizeSeriesConcentration: (value: unknown) => number
  showSensorInfo: (sensor: TSensor) => void
  showToast: (message: string, type: 'success' | 'warn' | 'error' | 'danger') => void
  updateSensorToDB: (sensor: SensorSavePayload) => Promise<unknown>
  render: () => void
}

export function useSmartMapSensorEditor<TSensor extends SmartMapEditableSensor, TFrame extends SmartMapSensorEditorFrameLike>(
  options: SmartMapSensorEditorOptions<TSensor, TFrame>,
) {
  const sensorEditorState = reactive({
    currentFrameConcentration: 0,
    fillAllConcentration: 0,
    boundSensorId: '',
  })
  const manualSensorPanelVisible = ref(false)
  const manualSensorTargetId = ref('')
  const manualSensorTarget = computed(() => (
    options.sensors.value.find(sensor => sensor.id === manualSensorTargetId.value)
    || options.selectedSensor.value
    || options.sensors.value[0]
    || null
  ))
  const sensorEditVisible = ref(false)
  const sensorEditDraft = reactive<SmartMapSensorEditDraft>({
    id: '',
    installationHeight: 1.5,
    effectiveRange: 30,
    detectionRange: '',
    installRemark: '',
    priority: 3,
    risk: 0.3,
  })

  function syncSensorEditorState(sensor: TSensor | null = options.selectedSensor.value) {
    if (!sensor) {
      sensorEditorState.currentFrameConcentration = 0
      sensorEditorState.fillAllConcentration = 0
      sensorEditorState.boundSensorId = ''
      return
    }
    const frameIndex = Number(options.getCurrentFrame()?.frameIndex ?? 0)
    const currentManualValue = options.normalizeSeriesConcentration(
      sensor.manualSeries?.[frameIndex]?.concentration || 0,
    )
    sensorEditorState.currentFrameConcentration = currentManualValue
    if (sensorEditorState.boundSensorId !== sensor.id) {
      sensorEditorState.fillAllConcentration = currentManualValue
      sensorEditorState.boundSensorId = sensor.id
    }
  }

  function updateSensorById(sensorId: string, updater: (sensor: TSensor) => TSensor) {
    options.sensors.value = options.buildActiveSensorSeries(
      options.sensors.value.map(sensor => (sensor.id === sensorId ? updater({ ...sensor }) : sensor)),
      options.diffusionFrames.value,
    )
    options.selectedSensor.value = options.sensors.value.find(sensor => sensor.id === sensorId) || null
    if (options.selectedSensor.value) {
      options.showSensorInfo(options.selectedSensor.value)
    } else {
      syncSensorEditorState(null)
    }
    options.render()
  }

  function selectManualSensorTarget(sensorId: string) {
    manualSensorTargetId.value = sensorId
    const sensor = options.sensors.value.find(item => item.id === sensorId) || null
    options.selectedSensor.value = sensor
    if (sensor) {
      options.showSensorInfo(sensor)
    } else {
      syncSensorEditorState(null)
    }
  }

  function toggleManualSensorPanel() {
    manualSensorPanelVisible.value = !manualSensorPanelVisible.value
    if (!manualSensorPanelVisible.value) return
    const preferredSensor = options.selectedSensor.value || options.sensors.value[0] || null
    if (preferredSensor) {
      manualSensorTargetId.value = preferredSensor.id
      options.showSensorInfo(preferredSensor)
    } else {
      syncSensorEditorState(null)
    }
  }

  function setSelectedSensorMode(nextMode: string) {
    if (!options.selectedSensor.value) return
    const mode = nextMode === 'manual' ? 'manual' : 'auto'
    updateSensorById(options.selectedSensor.value.id, sensor => {
      if (mode === 'manual' && !sensor.manualSeries?.length) {
        sensor.manualSeries = options.buildFrameSeriesTemplate().map(item => ({ ...item }))
      }
      sensor.mode = mode
      return sensor
    })
    options.showToast(mode === 'manual' ? '已切换为手动数据模式' : '已切换为自动采样模式', 'success')
  }

  function setManualPanelSensorMode(nextMode: string) {
    const sensor = manualSensorTarget.value
    if (!sensor) {
      options.showToast('请先选择一个传感器', 'warn')
      return
    }
    if (!options.selectedSensor.value || options.selectedSensor.value.id !== sensor.id) {
      options.selectedSensor.value = sensor
    }
    setSelectedSensorMode(nextMode)
  }

  function openSensorEdit() {
    const sensor = options.selectedSensor.value
    if (!sensor) return
    sensorEditDraft.id = sensor.id
    sensorEditDraft.installationHeight = sensor.installationHeight ?? 1.5
    sensorEditDraft.effectiveRange = sensor.effectiveRange ?? 30
    sensorEditDraft.detectionRange = sensor.detectionRange ?? ''
    sensorEditDraft.installRemark = sensor.installRemark ?? ''
    sensorEditDraft.priority = sensor.priority ?? 3
    sensorEditDraft.risk = sensor.risk ?? 0.3
    sensorEditVisible.value = true
  }

  function closeSensorEdit() {
    sensorEditVisible.value = false
  }

  function updateSensorEditDraft(patch: Partial<SmartMapSensorEditDraft>) {
    Object.assign(sensorEditDraft, patch)
  }

  async function saveSensorEdit() {
    const sensor = options.selectedSensor.value
    if (!sensor || !sensorEditDraft.id) return
    sensor.installationHeight = sensorEditDraft.installationHeight
    sensor.effectiveRange = sensorEditDraft.effectiveRange
    sensor.detectionRange = sensorEditDraft.detectionRange
    sensor.installRemark = sensorEditDraft.installRemark
    sensor.priority = sensorEditDraft.priority
    sensor.risk = sensorEditDraft.risk
    await options.updateSensorToDB({
      id: sensor.id,
      x: sensor.x,
      y: sensor.y,
      installationHeight: sensor.installationHeight,
      effectiveRange: sensor.effectiveRange,
      detectionRange: sensor.detectionRange,
      installRemark: sensor.installRemark,
      priority: sensor.priority,
      risk: sensor.risk,
      type: sensor.type || 'gas',
      mode: sensor.mode || 'auto',
      lastSampleTime: sensor.lastSampleTime,
    })
    sensorEditVisible.value = false
    options.showToast('传感器参数已保存', 'success')
  }

  function applySelectedSensorManualValueToCurrentFrame() {
    const sensor = options.selectedSensor.value
    if (!sensor) return
    if (sensor.mode !== 'manual') {
      options.showToast('请先切换到手动数据模式', 'warn')
      return
    }
    const frame = options.getCurrentFrame()
    const frameIndex = Number(frame?.frameIndex)
    if (!frame || !Number.isFinite(frameIndex)) {
      options.showToast('请先生成扩散时间轴后再录入手动数据', 'warn')
      return
    }
    const concentration = options.normalizeSeriesConcentration(sensorEditorState.currentFrameConcentration)
    updateSensorById(sensor.id, nextSensor => {
      const manualSeries = options.normalizeManualSeries(nextSensor.manualSeries, options.diffusionFrames.value)
      nextSensor.manualSeries = manualSeries.map(item => (
        Number(item.frameIndex) === frameIndex
          ? { ...item, concentration }
          : item
      ))
      nextSensor.lastSampleTime = Date.now()
      return nextSensor
    })
    sensorEditorState.currentFrameConcentration = concentration
    options.showToast(`已写入第 ${frameIndex + 1} 帧手动浓度`, 'success')
  }

  function fillSelectedSensorManualSeries() {
    const sensor = options.selectedSensor.value
    if (!sensor) return
    if (sensor.mode !== 'manual') {
      options.showToast('请先切换到手动数据模式', 'warn')
      return
    }
    if (!options.diffusionFrames.value.length) {
      options.showToast('请先生成扩散时间轴后再批量填充', 'warn')
      return
    }
    const concentration = options.normalizeSeriesConcentration(sensorEditorState.fillAllConcentration)
    updateSensorById(sensor.id, nextSensor => {
      nextSensor.manualSeries = options.buildFrameSeriesTemplate().map(item => ({
        ...item,
        concentration,
      }))
      nextSensor.lastSampleTime = Date.now()
      return nextSensor
    })
    sensorEditorState.currentFrameConcentration = concentration
    options.showToast('已填充该传感器全时段手动浓度', 'success')
  }

  function copyAutoSeriesToSelectedSensorManual() {
    const sensor = options.selectedSensor.value
    if (!sensor) return
    if (!options.diffusionFrames.value.length) {
      options.showToast('请先生成扩散时间轴后再复制自动曲线', 'warn')
      return
    }
    updateSensorById(sensor.id, nextSensor => {
      nextSensor.mode = 'manual'
      nextSensor.manualSeries = (nextSensor.autoSampledSeries || options.buildFrameSeriesTemplate()).map(item => ({
        frameIndex: item.frameIndex,
        timeSec: item.timeSec,
        concentration: options.normalizeSeriesConcentration(item.concentration),
      }))
      nextSensor.lastSampleTime = Date.now()
      return nextSensor
    })
    options.showToast('已复制自动采样曲线到手动序列', 'success')
  }

  function clearSelectedSensorManualSeries() {
    const sensor = options.selectedSensor.value
    if (!sensor) return
    if (sensor.mode !== 'manual') {
      options.showToast('当前传感器不在手动数据模式', 'warn')
      return
    }
    updateSensorById(sensor.id, nextSensor => {
      nextSensor.manualSeries = options.buildFrameSeriesTemplate().map(item => ({ ...item }))
      return nextSensor
    })
    sensorEditorState.currentFrameConcentration = 0
    sensorEditorState.fillAllConcentration = 0
    options.showToast('已清空手动时间序列', 'warn')
  }

  return {
    sensorEditorState,
    manualSensorPanelVisible,
    manualSensorTargetId,
    manualSensorTarget,
    sensorEditVisible,
    sensorEditDraft,
    syncSensorEditorState,
    selectManualSensorTarget,
    toggleManualSensorPanel,
    setManualPanelSensorMode,
    setSelectedSensorMode,
    openSensorEdit,
    closeSensorEdit,
    updateSensorEditDraft,
    saveSensorEdit,
    applySelectedSensorManualValueToCurrentFrame,
    fillSelectedSensorManualSeries,
    copyAutoSeriesToSelectedSensorManual,
    clearSelectedSensorManualSeries,
  }
}

export function useSmartMapSensorEditorSyncBridge<TSensor>() {
  let syncAction: ((sensor: TSensor | null) => void) | null = null

  function setSyncSensorEditorStateAction(action: (sensor: TSensor | null) => void) {
    syncAction = action
  }

  function syncSensorEditorState(sensor: TSensor | null) {
    syncAction?.(sensor)
  }

  return {
    setSyncSensorEditorStateAction,
    syncSensorEditorState,
  }
}
