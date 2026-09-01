import { computed, type Ref } from 'vue'
import { formatGeoCoord } from '@/data/coordinate'
import type { ParkSensorType } from '@/data/sensorCatalog'

type SmartMapSensorAlarmLevel = 'normal' | 'warning' | 'danger'

interface SmartMapHoverSensorRecord {
  id: string
  type: string
  x: number
  y: number
  priority: number
  sampledPeak?: number
}

interface SmartMapHoverFrameRecord {
  timeSec?: number
}

export interface SmartMapSensorHoverCard {
  id: string
  priority: number
  priorityLabel: string
  typeName: string
  currentLabel: string
  peakLabel: string
  timeLabel: string
  coordLabel: string
  levelLabel: string
  levelText: string
  levelClass: SmartMapSensorAlarmLevel
}

export interface SmartMapSensorHoverCardOptions<TSensor extends SmartMapHoverSensorRecord, TGas> {
  hoveredSensor: Ref<TSensor | null>
  sensorTypes: ParkSensorType[]
  getCurrentGas: () => TGas
  getCurrentFrame: () => SmartMapHoverFrameRecord | null
  getCurrentConcentration: (sensor: TSensor) => number
  getAlarmLevel: (concentration: number, gas: TGas) => SmartMapSensorAlarmLevel
  getPriorityLabel: (priority: number) => string
}

export function useSmartMapSensorHoverCard<TSensor extends SmartMapHoverSensorRecord, TGas>(
  options: SmartMapSensorHoverCardOptions<TSensor, TGas>,
) {
  const hoveredSensorCard = computed<SmartMapSensorHoverCard | null>(() => {
    if (!options.hoveredSensor.value) return null
    const sensor = options.hoveredSensor.value
    const type = options.sensorTypes.find(item => item.id === sensor.type)
    const concentration = options.getCurrentConcentration(sensor)
    const level = options.getAlarmLevel(concentration, options.getCurrentGas())
    const geo = formatGeoCoord(sensor.x, sensor.y)
    const priorityLabel = options.getPriorityLabel(sensor.priority)

    return {
      id: sensor.id,
      priority: sensor.priority,
      priorityLabel,
      typeName: type?.name || '传感器',
      currentLabel: `${concentration.toFixed(2)} ppm`,
      peakLabel: `${(sensor.sampledPeak || 0).toFixed(2)} ppm`,
      timeLabel: `${(options.getCurrentFrame()?.timeSec || 0).toFixed(0)} s`,
      coordLabel: `${geo.longitude} / ${geo.latitude}`,
      levelLabel: level === 'danger' ? '危险' : level === 'warning' ? '预警' : '正常',
      levelText: level === 'danger' ? '超危险阈值' : level === 'warning' ? '超预警阈值' : '正常',
      levelClass: level,
    }
  })

  return {
    hoveredSensorCard,
  }
}
