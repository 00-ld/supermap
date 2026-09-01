import { computed, type Ref } from 'vue'
import type { SmartMapDiffusionFrame } from './useSmartMapDiffusionLayer'
import type { SmartMapDiffusionMeta, SmartMapGas, SmartMapSourceFacility } from './useSmartMapDiffusionTypes'
import type { SmartMapSensorGasThreshold } from './useSmartMapSensorSeries'

interface SmartMapSensorIdentity {
  id: string
}

interface SmartMapDiffusionFormState {
  gasId: string
  sourceFacilityId: string
}

interface SmartMapDiffusionPlaybackState {
  currentFrame: number
}

interface SmartMapMonitoringSummaryStateOptions<TSensor extends SmartMapSensorIdentity> {
  sensors: Ref<TSensor[]>
  diffusionForm: SmartMapDiffusionFormState
  diffusionFrames: Ref<SmartMapDiffusionFrame[]>
  diffusionMeta: Ref<SmartMapDiffusionMeta>
  diffusionState: SmartMapDiffusionPlaybackState
  currentDiffusionFrame: Ref<SmartMapDiffusionFrame | null>
  selectedDiffusionSource: Ref<SmartMapSourceFacility | null>
  getGasById: (gasId: string) => SmartMapGas & SmartMapSensorGasThreshold
  getCurrentLeakSourcePoint: () => unknown
  getSensorCurrentConcentration: (sensor: TSensor) => number
}

export function useSmartMapMonitoringSummaryState<TSensor extends SmartMapSensorIdentity>(
  options: SmartMapMonitoringSummaryStateOptions<TSensor>,
) {
  // 后端 sensor_reading 链路已下线：不再统计后端读数匹配与审计边界。
  const isSimulatedConcentration = computed(() =>
    !options.diffusionFrames.value.length || !options.getCurrentLeakSourcePoint()
  )
  const diffusionSummary = computed(() => {
    const gas = options.diffusionMeta.value.gas || options.getGasById(options.diffusionForm.gasId)
    const source = options.diffusionMeta.value.sourceFacility || options.selectedDiffusionSource.value
    const frame = options.currentDiffusionFrame.value
    return {
      gasName: gas?.name || '--',
      sourceName: source?.name || '未设置',
      frameText: options.diffusionFrames.value.length
        ? `${options.diffusionState.currentFrame + 1}/${options.diffusionFrames.value.length}`
        : '0/0',
      timeText: frame ? `${frame.timeSec.toFixed(0)} s` : '--',
      maxConcentration: frame ? `${frame.maxConcentration.toFixed(1)} ppm` : '--',
      affectedArea: frame ? `${frame.affectedArea.toFixed(0)} m²` : '--',
      dangerArea: frame ? `${frame.dangerArea.toFixed(0)} m²` : '--',
    }
  })
  const diffusionModelLabel = computed(() => {
    const model = options.diffusionMeta.value.scenarioMeta?.diffusionModel
    if (model === 'conditioned-advection-diffusion-3d') return '三维条件化平流扩散'
    if (model === 'deep-learning-surrogate-diffusion') return '深度学习代理扩散'
    if (model === 'conditioned-advection-diffusion') return '条件化对流-扩散'
    if (options.diffusionFrames.value.length) return model || '算法服务扩散'
    return '待生成'
  })
  const diffusionConditionLabel = computed(() => {
    const condition = options.diffusionMeta.value.scenarioMeta?.conditionVector
    if (!condition) return '等待后端返回'
    const density = Number(condition.relativeDensity)
    const buoyancy = Number(condition.condBuoyancy)
    const diffusivity = Number(condition.condDiffusivity)
    const parts = []
    if (Number.isFinite(density)) parts.push(`ρ=${density.toFixed(2)}`)
    if (Number.isFinite(buoyancy)) parts.push(`B=${buoyancy.toFixed(2)}`)
    if (Number.isFinite(diffusivity)) parts.push(`D=${diffusivity.toFixed(2)}`)
    return parts.length ? parts.join(' / ') : '已接入'
  })
  const sensorSamplingSummary = computed(() => {
    const gas = options.diffusionMeta.value.gas || options.getGasById(options.diffusionForm.gasId)
    let sampled = 0
    let warning = 0
    let danger = 0
    options.sensors.value.forEach((sensor) => {
      const current = options.getSensorCurrentConcentration(sensor)
      if (current > 0) sampled += 1
      if (current >= Number(gas.warningThreshold || 0)) warning += 1
      if (current >= Number(gas.dangerThreshold || 0)) danger += 1
    })
    return { sampled, warning, danger }
  })

  return {
    diffusionConditionLabel,
    diffusionModelLabel,
    diffusionSummary,
    isSimulatedConcentration,
    sensorSamplingSummary,
  }
}
