import type { Ref } from 'vue'
import { formatGeoCoord } from '@/data/coordinate'
import type { ParkSensorType } from '@/data/sensorCatalog'
import type { SmartMapInfoRow, SmartMapInfoSubtitle } from './useSmartMapFacilityInfo'

interface SmartMapSensorInfoRecord {
  id: string
  type: string
  x: number
  y: number
  priority: number
  risk: number
  mode?: string
  sampledPeak?: number
  sampledFrames?: number
  lastSampleTime?: number | string | null
}

export interface SmartMapSensorInfoOptions<TSensor extends SmartMapSensorInfoRecord> {
  sensor: TSensor
  sensorTypes: ParkSensorType[]
  defaultRange: number
  getCurrentConcentration: (sensor: TSensor) => number
  getAutoConcentration: (sensor: TSensor) => number
  getPriorityLabel: (priority: number) => string
  resolveEffectiveRange: (sensor: Partial<TSensor>, fallbackRange: number) => number
  resolveInstallationHeight: (sensor: Partial<TSensor>) => number
  resolveDetectionRange: (sensor: Partial<TSensor>) => string
  resolveInstallRemark: (sensor: Partial<TSensor>) => string
}

export interface SmartMapSensorInfo {
  title: string
  subtitle: SmartMapInfoSubtitle
  rows: SmartMapInfoRow[]
}

export interface SmartMapSensorInfoActionOptions<TSensor extends SmartMapSensorInfoRecord> {
  sensorTypes: ParkSensorType[]
  defaultRange: number
  panelCollapsed: Ref<boolean>
  manualSensorTargetId: Ref<string>
  setInfoPanel: (info: SmartMapSensorInfo) => void
  syncSensorEditorState: (sensor: TSensor) => void
  getCurrentConcentration: (sensor: TSensor) => number
  getAutoConcentration: (sensor: TSensor) => number
  getPriorityLabel: (priority: number) => string
  resolveEffectiveRange: (sensor: Partial<TSensor>, fallbackRange: number) => number
  resolveInstallationHeight: (sensor: Partial<TSensor>) => number
  resolveDetectionRange: (sensor: Partial<TSensor>) => string
  resolveInstallRemark: (sensor: Partial<TSensor>) => string
}

export function buildSmartMapSensorInfo<TSensor extends SmartMapSensorInfoRecord>(
  options: SmartMapSensorInfoOptions<TSensor>,
): SmartMapSensorInfo | null {
  const { sensor } = options
  const type = options.sensorTypes.find(item => item.id === sensor.type) || options.sensorTypes[0]
  if (!type) return null

  const geo = formatGeoCoord(sensor.x, sensor.y)
  const currentConcentration = options.getCurrentConcentration(sensor)
  const autoConcentration = options.getAutoConcentration(sensor)
  const peakConcentration = sensor.sampledPeak || 0
  const modeLabel = sensor.mode === 'manual' ? '手动录入' : '自动采样'
  const priorityLabel = options.getPriorityLabel(sensor.priority)
  const effectiveRange = options.resolveEffectiveRange(sensor, type.radius || options.defaultRange)
  const installationHeight = options.resolveInstallationHeight(sensor)
  const detectionRange = options.resolveDetectionRange(sensor)
  const installRemark = options.resolveInstallRemark(sensor)
  const lastTimeStr = sensor.lastSampleTime
    ? new Date(sensor.lastSampleTime).toLocaleTimeString('zh-CN')
    : '尚未采样'

  return {
    title: `${sensor.id}（${priorityLabel}）`,
    subtitle: { tag: type.name, tagClass: 'tag tag-blue', desc: modeLabel },
    rows: [
      { key: '传感器类型', val: '多种气体传感器' },
      { key: '安装高度', val: `${installationHeight.toFixed(1)} m` },
      { key: '有效监测范围', val: `${effectiveRange} m` },
      { key: '检测范围', val: detectionRange },
      { key: '优先级', val: `P${sensor.priority}（${priorityLabel}）` },
      { key: '模拟浓度', val: `${currentConcentration.toFixed(2)} ppm` },
      { key: '最近采样时间', val: lastTimeStr },
      { key: '数据模式', val: modeLabel },
      { key: '自动基线', val: `${autoConcentration.toFixed(2)} ppm` },
      { key: '采样峰值', val: `${peakConcentration.toFixed(2)} ppm` },
      { key: '采样帧数', val: `${sensor.sampledFrames || 0}` },
      { key: '布点说明', val: installRemark || '无' },
      { key: '单点成本', val: `¥${type.cost}` },
      { key: '所在风险值', val: `${(sensor.risk * 100).toFixed(1)}%` },
      { key: '经纬海拔', val: `${geo.longitude} / ${geo.latitude} / ${geo.altitude}` },
    ],
  }
}

export function useSmartMapSensorInfoActions<TSensor extends SmartMapSensorInfoRecord>(
  options: SmartMapSensorInfoActionOptions<TSensor>,
) {
  function showSensorInfo(sensor: TSensor) {
    options.panelCollapsed.value = false
    options.manualSensorTargetId.value = sensor.id
    const sensorInfo = buildSmartMapSensorInfo({
      sensor,
      sensorTypes: options.sensorTypes,
      defaultRange: options.defaultRange,
      getCurrentConcentration: options.getCurrentConcentration,
      getAutoConcentration: options.getAutoConcentration,
      getPriorityLabel: options.getPriorityLabel,
      resolveEffectiveRange: options.resolveEffectiveRange,
      resolveInstallationHeight: options.resolveInstallationHeight,
      resolveDetectionRange: options.resolveDetectionRange,
      resolveInstallRemark: options.resolveInstallRemark,
    })
    if (!sensorInfo) return
    options.setInfoPanel(sensorInfo)
    options.syncSensorEditorState(sensor)
  }

  return {
    showSensorInfo,
  }
}

export function useSmartMapSensorInfoActionBridge<TSensor extends SmartMapSensorInfoRecord>() {
  let showSensorInfoAction: ((sensor: TSensor) => void) | null = null

  function setShowSensorInfoAction(action: (sensor: TSensor) => void) {
    showSensorInfoAction = action
  }

  function showSensorInfo(sensor: TSensor) {
    showSensorInfoAction?.(sensor)
  }

  return {
    setShowSensorInfoAction,
    showSensorInfo,
  }
}
