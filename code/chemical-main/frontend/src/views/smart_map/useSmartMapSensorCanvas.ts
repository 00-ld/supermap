import type { ParkSensorType } from '@/data/sensorCatalog'

export interface SmartMapSensorCanvasRecord {
  id: string
  type: string
  x: number
  y: number
  priority: number
}

export interface SmartMapSensorCanvasOptions<TSensor extends SmartMapSensorCanvasRecord> {
  showSensors: boolean
  showSensorRanges: boolean
  scale: number
  sensors: TSensor[]
  sensorTypes: ParkSensorType[]
  selectedSensorId?: string
  defaultRange: number
  resolveRange: (sensor: TSensor, fallbackRange: number) => number
  getPriorityColor: (priority: number) => string
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#39ff7a'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function drawSensorPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  rgb: string,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 4)

  ctx.shadowColor = `rgba(${rgb},1)`
  ctx.shadowBlur = size * 2.8
  ctx.fillStyle = `rgba(${rgb},0.18)`
  ctx.fillRect(-size * 0.92, -size * 0.92, size * 1.84, size * 1.84)

  ctx.shadowBlur = size * 1.6
  ctx.fillStyle = color
  ctx.fillRect(-size * 0.46, -size * 0.46, size * 0.92, size * 0.92)

  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.fillRect(-size * 0.12, -size * 0.12, size * 0.24, size * 0.24)
  ctx.restore()
}

function drawSelectedSensorCorners(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  scale: number,
) {
  const arm = size * 1.05
  const inset = size * 1.38
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.shadowColor = 'rgba(255,255,255,0.65)'
  ctx.shadowBlur = size
  ctx.lineWidth = Math.max(1.1 / scale, 0.65)
  ctx.beginPath()
  ctx.moveTo(x - inset - arm, y - inset)
  ctx.lineTo(x - inset, y - inset)
  ctx.lineTo(x - inset, y - inset - arm)
  ctx.moveTo(x + inset + arm, y - inset)
  ctx.lineTo(x + inset, y - inset)
  ctx.lineTo(x + inset, y - inset - arm)
  ctx.moveTo(x - inset - arm, y + inset)
  ctx.lineTo(x - inset, y + inset)
  ctx.lineTo(x - inset, y + inset + arm)
  ctx.moveTo(x + inset + arm, y + inset)
  ctx.lineTo(x + inset, y + inset)
  ctx.lineTo(x + inset, y + inset + arm)
  ctx.stroke()
  ctx.restore()
}

export function drawSmartMapSensors<TSensor extends SmartMapSensorCanvasRecord>(
  ctx: CanvasRenderingContext2D,
  options: SmartMapSensorCanvasOptions<TSensor>,
) {
  if (!options.showSensors) return
  const scale = Math.max(0.1, options.scale || 1)
  options.sensors.forEach(sensor => {
    const type = options.sensorTypes.find(item => item.id === sensor.type) || options.sensorTypes[0]
    const range = options.resolveRange(sensor, type?.radius || options.defaultRange)
    const riskColor = options.getPriorityColor(sensor.priority)
    const riskColorRgb = hexToRgb(riskColor)

    if (options.showSensorRanges) {
      ctx.fillStyle = `rgba(${riskColorRgb}, 0.045)`
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, range, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = `rgba(${riskColorRgb}, 0.34)`
      ctx.lineWidth = 1 / scale
      ctx.setLineDash([4, 5])
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, range, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    const pointSize = Math.max(2.7 / scale, 1.55)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    drawSensorPoint(ctx, sensor.x, sensor.y, pointSize, riskColor, riskColorRgb)
    ctx.restore()

    if (options.selectedSensorId === sensor.id) {
      drawSelectedSensorCorners(ctx, sensor.x, sensor.y, pointSize, scale)
    }
  })
}
