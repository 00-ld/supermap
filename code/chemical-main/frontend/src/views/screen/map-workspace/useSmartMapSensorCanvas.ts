import type { ParkSensorType } from '@/data/sensorCatalog'

export interface SmartMapSensorCanvasRecord {
  id: string
  type: string
  x: number
  y: number
  priority: number
}

export interface SmartMapSensorCanvasOptions<
  TSensor extends SmartMapSensorCanvasRecord,
> {
  showSensors: boolean
  showSensorRanges: boolean
  scale: number
  sensors: TSensor[]
  sensorTypes: ParkSensorType[]
  selectedSensorId?: string
  defaultRange: number
  resolveRange: (sensor: TSensor, fallbackRange: number) => number
  getPriorityColor: (priority: number) => string
  getRealtimeColor?: (sensor: TSensor) => string | null
  getRealtimeConcentration?: (sensor: TSensor) => number
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
) {
  ctx.save()
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(255,255,255,0.88)'
  ctx.lineWidth = Math.max(size * 0.24, 0.65)
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawSelectedSensorRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  scale: number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.lineWidth = Math.max(1.25 / scale, 0.75)
  ctx.beginPath()
  ctx.arc(x, y, size * 1.9, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function drawSmartMapSensors<TSensor extends SmartMapSensorCanvasRecord>(
  ctx: CanvasRenderingContext2D,
  options: SmartMapSensorCanvasOptions<TSensor>,
) {
  if (!options.showSensors) return
  const scale = Math.max(0.1, options.scale || 1)
  const realtimeLabelSensorIds = new Set(
    options.sensors
      .map((sensor) => ({
        id: sensor.id,
        concentration: Number(options.getRealtimeConcentration?.(sensor) || 0),
      }))
      .filter((item) => item.concentration > 0.0001)
      .sort((left, right) => right.concentration - left.concentration)
      .slice(0, 18)
      .map((item) => item.id),
  )
  options.sensors.forEach((sensor) => {
    const type =
      options.sensorTypes.find((item) => item.id === sensor.type) ||
      options.sensorTypes[0]
    const range = options.resolveRange(
      sensor,
      type?.radius || options.defaultRange,
    )
    const riskColor =
      options.getRealtimeColor?.(sensor) ||
      options.getPriorityColor(sensor.priority)
    const riskColorRgb = hexToRgb(riskColor)

    if (options.showSensorRanges && options.selectedSensorId === sensor.id) {
      ctx.strokeStyle = `rgba(${riskColorRgb}, 0.34)`
      ctx.lineWidth = 1 / scale
      ctx.setLineDash([4, 5])
      ctx.beginPath()
      ctx.arc(sensor.x, sensor.y, range, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }

    const pointSize = Math.max(3.1 / scale, 1.8)
    drawSensorPoint(ctx, sensor.x, sensor.y, pointSize, riskColor)

    if (realtimeLabelSensorIds.has(sensor.id)) {
      const concentration = Number(
        options.getRealtimeConcentration?.(sensor) || 0,
      )
      const label = `${sensor.id}  ${concentration.toFixed(3)} ppm`
      ctx.save()
      ctx.font = `${Math.max(9 / scale, 5.5)}px sans-serif`
      const textWidth = ctx.measureText(label).width
      const labelX = sensor.x + pointSize * 1.8
      const labelY = sensor.y - pointSize * 1.6
      ctx.fillStyle = 'rgba(5,24,34,0.88)'
      ctx.fillRect(
        labelX - 2 / scale,
        labelY - 9 / scale,
        textWidth + 5 / scale,
        12 / scale,
      )
      ctx.fillStyle = riskColor
      ctx.fillText(label, labelX, labelY)
      ctx.restore()
    }

    if (options.selectedSensorId === sensor.id) {
      drawSelectedSensorRing(ctx, sensor.x, sensor.y, pointSize, scale)
    }
  })
}
