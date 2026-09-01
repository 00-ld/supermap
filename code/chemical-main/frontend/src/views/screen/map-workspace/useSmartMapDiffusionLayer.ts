import type { DiffusionFrame } from '@/data/phase1Config'
import type { SmartMapRecord } from './useSmartMapInversion'

export type SmartMapDiffusionLevel = 'danger' | 'warning' | 'affected' | 'low' | string

export interface SmartMapDiffusionPoint {
  x: number
  y: number
}

export interface SmartMapDiffusionCell extends SmartMapDiffusionPoint {
  size: number
  concentration: number
  level?: SmartMapDiffusionLevel
  alpha?: number
}

export interface SmartMapDiffusionBoundary {
  points?: SmartMapDiffusionPoint[]
  segments?: Array<{ points: SmartMapDiffusionPoint[] }>
}

export interface SmartMapDiffusionSkeleton {
  centerline?: SmartMapDiffusionPoint[]
  segments?: Array<{ centerline: SmartMapDiffusionPoint[] }>
}

export interface SmartMapDiffusionPlume {
  sourceX: number
  sourceY: number
  angle: number
  driftDistance: number
  majorAxis: number
  minorAxis: number
}

export interface SmartMapDiffusionFrame extends SmartMapRecord, Omit<DiffusionFrame, 'cells'> {
  cells: SmartMapDiffusionCell[]
  maxConcentration: number
  affectedArea: number
  dangerArea: number
  boundaryPolygons?: Partial<Record<'affected' | 'warning' | 'danger', SmartMapDiffusionBoundary>>
  contourSkeletons?: Partial<Record<'affected' | 'warning' | 'danger', SmartMapDiffusionSkeleton>>
  plume?: SmartMapDiffusionPlume | null
}

export interface SmartMapDiffusionGas {
  color: string
}

export interface SmartMapDiffusionLayerOptions {
  frame: SmartMapDiffusionFrame | null | undefined
  gas: SmartMapDiffusionGas | null | undefined
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#66aebc'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getCellIntensity(cell: SmartMapDiffusionCell, maxConcentration: number) {
  if (maxConcentration > 0 && Number.isFinite(cell.concentration)) {
    return clamp(Number(cell.concentration) / maxConcentration, 0, 1)
  }
  return clamp(Number(cell.alpha || 0) / 0.5, 0, 1)
}

function getDiffusionCellRgb(cell: SmartMapDiffusionCell, gasRgb: string) {
  if (cell.level === 'danger') return '255,78,78'
  if (cell.level === 'warning') return '255,184,54'
  return gasRgb
}

function drawDiffusionPlumeGlow(
  ctx: CanvasRenderingContext2D,
  plume: SmartMapDiffusionPlume | null | undefined,
  gasRgb: string,
) {
  if (!plume) return

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.translate(plume.sourceX, plume.sourceY)
  ctx.rotate(plume.angle)

  const outer = ctx.createRadialGradient(
    plume.driftDistance * 0.22,
    0,
    0,
    plume.driftDistance * 0.52,
    0,
    Math.max(plume.majorAxis * 1.15, plume.minorAxis * 2.4),
  )
  outer.addColorStop(0, `rgba(${gasRgb},0.14)`)
  outer.addColorStop(0.42, `rgba(${gasRgb},0.08)`)
  outer.addColorStop(0.72, 'rgba(255,184,54,0.035)')
  outer.addColorStop(1, `rgba(${gasRgb},0)`)
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.ellipse(plume.driftDistance * 0.5, 0, plume.majorAxis * 1.28, plume.minorAxis * 1.72, 0, 0, Math.PI * 2)
  ctx.fill()

  const hotCore = ctx.createLinearGradient(0, 0, plume.driftDistance + plume.majorAxis, 0)
  hotCore.addColorStop(0, 'rgba(255,255,255,0.08)')
  hotCore.addColorStop(0.18, `rgba(${gasRgb},0.14)`)
  hotCore.addColorStop(0.55, 'rgba(255,184,54,0.07)')
  hotCore.addColorStop(1, 'rgba(255,78,78,0.01)')
  ctx.fillStyle = hotCore
  ctx.beginPath()
  ctx.ellipse(plume.driftDistance * 0.44, 0, plume.majorAxis * 0.72, plume.minorAxis * 0.72, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawDiffusionBoundary(
  ctx: CanvasRenderingContext2D,
  boundary: SmartMapDiffusionBoundary | null | undefined,
  strokeStyle: string,
  lineWidth = 1.2,
) {
  const segments = boundary?.segments?.length
    ? boundary.segments.map(segment => segment.points).filter(points => points.length >= 3)
    : [boundary?.points || []].filter(points => points.length >= 3)
  if (!segments.length) return

  ctx.save()
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
  for (const points of segments) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let index = 1; index < points.length; index++) {
      ctx.lineTo(points[index].x, points[index].y)
    }
    ctx.closePath()
    ctx.stroke()
  }
  ctx.restore()
}

function drawDiffusionSkeleton(
  ctx: CanvasRenderingContext2D,
  skeleton: SmartMapDiffusionSkeleton | null | undefined,
  strokeStyle: string,
  dash: number[] = [],
) {
  const segments = skeleton?.segments?.length
    ? skeleton.segments.map(segment => segment.centerline).filter(points => points.length >= 2)
    : [skeleton?.centerline || []].filter(points => points.length >= 2)
  if (!segments.length) return

  ctx.save()
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = 1
  ctx.setLineDash(dash)
  for (const points of segments) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let index = 1; index < points.length; index++) {
      ctx.lineTo(points[index].x, points[index].y)
    }
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.restore()
}

export function drawSmartMapDiffusionLayer(
  ctx: CanvasRenderingContext2D,
  options: SmartMapDiffusionLayerOptions,
) {
  const { frame, gas } = options
  if (!frame || !gas) return

  const gasRgb = hexToRgb(gas.color)
  drawDiffusionPlumeGlow(ctx, frame.plume, gasRgb)

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  frame.cells.forEach(cell => {
    const intensity = getCellIntensity(cell, frame.maxConcentration)
    if (intensity <= 0.01 && Number(cell.alpha || 0) <= 0.01) return
    const shapedIntensity = Math.pow(intensity, 0.55)
    const alpha = Number.isFinite(cell.alpha) ? Number(cell.alpha) : 0.18
    const tunedAlpha = clamp(alpha * 0.82 + shapedIntensity * 0.10, 0.035, 0.34)
    const color = getDiffusionCellRgb(cell, gasRgb)
    const bloomSize = cell.size * (1.06 + shapedIntensity * 0.42)
    ctx.fillStyle = `rgba(${color},${tunedAlpha * 0.20})`
    ctx.fillRect(cell.x - bloomSize / 2, cell.y - bloomSize / 2, bloomSize, bloomSize)
  })

  frame.cells.forEach(cell => {
    const intensity = getCellIntensity(cell, frame.maxConcentration)
    const shapedIntensity = Math.pow(intensity, 0.55)
    const alpha = Number.isFinite(cell.alpha) ? Number(cell.alpha) : 0.18
    const tunedAlpha = clamp(alpha * 0.92 + shapedIntensity * 0.08, 0.05, 0.42)
    const color = getDiffusionCellRgb(cell, gasRgb)
    const coreSize = cell.size * (0.98 + shapedIntensity * 0.22)
    ctx.fillStyle = `rgba(${color},${tunedAlpha})`
    ctx.fillRect(cell.x - coreSize / 2, cell.y - coreSize / 2, coreSize, coreSize)
  })
  ctx.restore()

  drawDiffusionBoundary(ctx, frame.boundaryPolygons?.affected, `rgba(${gasRgb},0.34)`, 1.4)
  drawDiffusionBoundary(ctx, frame.boundaryPolygons?.warning, 'rgba(255,184,54,0.48)', 1.7)
  drawDiffusionBoundary(ctx, frame.boundaryPolygons?.danger, 'rgba(255,78,78,0.56)', 2)
  drawDiffusionSkeleton(ctx, frame.contourSkeletons?.affected, `rgba(${gasRgb},0.24)`, [6, 5])
  drawDiffusionSkeleton(ctx, frame.contourSkeletons?.warning, 'rgba(255,184,54,0.36)', [7, 4])
  drawDiffusionSkeleton(ctx, frame.contourSkeletons?.danger, 'rgba(255,78,78,0.42)', [2, 5])

  const plume = frame.plume
  if (!plume) return
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.translate(plume.sourceX, plume.sourceY)
  ctx.rotate(plume.angle)
  ctx.strokeStyle = `rgba(${gasRgb},0.42)`
  ctx.fillStyle = `rgba(${gasRgb},0.045)`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(plume.driftDistance * 0.5, 0, plume.majorAxis, plume.minorAxis, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
