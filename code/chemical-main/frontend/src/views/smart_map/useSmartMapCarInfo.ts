import type { SmartMapInfoPanelContent } from './useSmartMapInfoPanel'

interface SmartMapCarInfoRecord {
  id: number
  x: number
  y: number
  status?: string
}

interface SmartMapCarThreshold {
  threshold?: number | number[]
  unit?: string
}

export interface SmartMapCarInfoOptions<TCar extends SmartMapCarInfoRecord> {
  car: TCar
  threshold?: SmartMapCarThreshold | null
  navigateToCarDetail: (carId: number) => void
  toggleCarWarning: (carId: number) => void
  triggerYoloForCar: (carId: number) => void
}

const SMART_MAP_CAR_GAS_NAMES = ['', '甲烷 (CH4)', '氨气 (NH3)', 'CO气体', '氧气 (O2)']

function formatCarThreshold(threshold?: SmartMapCarThreshold | null) {
  if (!threshold) return '--'
  if (Array.isArray(threshold.threshold)) {
    return `${threshold.threshold[0]}-${threshold.threshold[1]} ${threshold.unit || ''}`.trim()
  }
  return `${threshold.threshold ?? '--'} ${threshold.unit || ''}`.trim()
}

export function buildSmartMapCarInfo<TCar extends SmartMapCarInfoRecord>(
  options: SmartMapCarInfoOptions<TCar>,
): SmartMapInfoPanelContent {
  const { car } = options
  const warning = car.status === 'warning'
  return {
    title: `小车 ${car.id}`,
    subtitle: {
      text: warning ? '预警' : '正常',
      color: warning ? '#d6a0a0' : '#b4beca',
    },
    rows: [
      { key: '车辆编号', val: `#${car.id}` },
      { key: '当前位置', val: `X: ${car.x}  Y: ${car.y}` },
      { key: '监测气体', val: SMART_MAP_CAR_GAS_NAMES[car.id] || '--' },
      { key: '状态', val: warning ? '预警' : '正常' },
      { key: '报警阈值', val: formatCarThreshold(options.threshold) },
      { key: '操作', val: '查看详情', action: () => options.navigateToCarDetail(car.id) },
      {
        key: '设警',
        val: warning ? '重置状态' : '设警',
        action: () => options.toggleCarWarning(car.id),
        btnClass: 'warning-btn',
      },
      {
        key: 'AI巡检',
        val: 'YOLO 检测',
        action: () => options.triggerYoloForCar(car.id),
        btnClass: 'warning-btn',
      },
    ],
  }
}
