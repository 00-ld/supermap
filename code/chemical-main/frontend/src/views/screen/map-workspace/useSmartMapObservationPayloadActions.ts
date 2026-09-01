import type { Ref } from 'vue'
import type {
  SmartMapObservationPayload,
  SmartMapObservationSummary,
  SmartMapRecord,
} from './useSmartMapInversion'

interface SmartMapObservationPayloadActionsOptions {
  observationPayload: Ref<SmartMapObservationPayload | null>
  observationSummary: Ref<SmartMapObservationSummary | null>
  createObservationPayload: () => SmartMapObservationPayload | null
  buildObservationSummary: (
    payload: SmartMapObservationPayload | null | undefined,
  ) => SmartMapObservationSummary
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void
}

export function useSmartMapObservationPayloadActions(
  options: SmartMapObservationPayloadActionsOptions,
) {
  function setObservationPayloadState(payload: SmartMapObservationPayload) {
    options.observationPayload.value = payload
    const summary = options.buildObservationSummary(payload)
    options.observationSummary.value = summary
    return summary
  }

  function prepareObservationDataset() {
    const payload = options.createObservationPayload()
    if (!payload) return null
    const summary = setObservationPayloadState(payload)
    if (!summary.activeSensors || summary.activeSensors < 3) {
      options.showToast(`有效观测点 ${summary.activeSensors} 个，建议至少 3 个再做溯源`, 'warn')
      return payload
    }
    if (!summary.formalValidationAllowed) {
      options.showToast(`观测数据已整理：${summary.activeSensors} 个有效点，来源为仿真/手工，不可作为真实验证`, 'warn')
      return payload
    }
    options.showToast(`观测数据已整理：${summary.activeSensors} 个有效点，${summary.frameCount} 帧`, 'success')
    return payload
  }

  function generateObservationPayloadExport() {
    const payload = options.createObservationPayload()
    if (!payload) return
    const summary = setObservationPayloadState(payload)
    options.showToast(`观测数据已整理，包含 ${summary.activeSensors} 个有效传感器`, 'success')
  }

  function exportObservationPayloadJson() {
    const payload = options.createObservationPayload()
    if (!payload) return
    setObservationPayloadState(payload)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const gasRecord = payload.gas && typeof payload.gas === 'object'
      ? payload.gas as SmartMapRecord
      : {}
    link.download = `observation-payload-${gasRecord.gasId || gasRecord.id || 'dataset'}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    options.showToast('溯源观测 JSON 已导出', 'success')
  }

  return {
    exportObservationPayloadJson,
    generateObservationPayloadExport,
    prepareObservationDataset,
    setObservationPayloadState,
  }
}
