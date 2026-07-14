export interface SmartMapSourcePoint {
  x: number
  y: number
}

export interface SmartMapSourceCandidateRegion {
  candidateId: string
  label: string
  rank: number
  score: number
  supportCount: number
  error: number
  center: SmartMapSourcePoint
  radius: number
  bounds?: Partial<Record<'minX' | 'maxX' | 'minY' | 'maxY' | 'left' | 'right' | 'top' | 'bottom', number>>
  polygon?: SmartMapSourcePoint[]
  confidence?: number
  sourceMatchError?: number
  sourceLocationErrorM?: number
  confidenceRadius?: number
  rankScore?: number
}

export interface SmartMapSourceRefinementIteration {
  iteration: number
  center: SmartMapSourcePoint
  radius: number
  loss: number
  polygon?: SmartMapSourcePoint[]
}

export interface SmartMapEstimatedSource {
  mapPoint: SmartMapSourcePoint
  iconSize?: number
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#93a7bd'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function drawSmartMapSourceCandidateRegions(
  ctx: CanvasRenderingContext2D,
  regions: SmartMapSourceCandidateRegion[],
  selectedCandidateId: string,
) {
  if (!regions.length) return
  regions.forEach(region => {
    const isSelected = selectedCandidateId === region.candidateId
    const alpha = Math.max(0.12, 0.32 - (region.rank - 1) * 0.05)
    const color = region.rank === 1 ? '#c2a46d' : '#93a7bd'
    const rgb = hexToRgb(color)
    ctx.fillStyle = `rgba(${rgb},${isSelected ? alpha * 0.7 : alpha * 0.45})`
    ctx.strokeStyle = isSelected ? '#ffffff' : `rgba(${rgb},${alpha + 0.2})`
    ctx.lineWidth = isSelected ? 2.8 : region.rank === 1 ? 2.2 : 1.4
    ctx.beginPath()
    ctx.arc(region.center.x, region.center.y, region.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (isSelected) {
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = `rgba(${rgb},0.9)`
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(region.center.x, region.center.y, region.radius + 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.fillStyle = color
    ctx.font = 'bold 9px "Noto Sans SC"'
    ctx.textAlign = 'center'
    ctx.fillText(`C${region.rank}`, region.center.x, region.center.y - region.radius - 6)
  })
}

function drawRefinementPolygon(ctx: CanvasRenderingContext2D, iteration: SmartMapSourceRefinementIteration) {
  const points = iteration.polygon || []
  if (!points.length) return
  ctx.fillStyle = 'rgba(154,168,184,0.12)'
  ctx.strokeStyle = 'rgba(154,168,184,0.78)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.beginPath()
  ctx.arc(iteration.center.x, iteration.center.y, iteration.radius + 8, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawEstimatedSourceIcon(
  ctx: CanvasRenderingContext2D,
  estimatedSource: SmartMapEstimatedSource,
  emphasized: boolean,
) {
  const { x, y } = estimatedSource.mapPoint
  const size = Math.max(estimatedSource.iconSize || 0, emphasized ? 20 : 16)
  const outerSize = size + 12
  ctx.save()
  ctx.translate(x, y)

  ctx.shadowColor = 'rgba(255, 36, 64, 0.96)'
  ctx.shadowBlur = emphasized ? 22 : 16
  ctx.fillStyle = emphasized ? 'rgba(255, 36, 64, 0.22)' : 'rgba(255, 36, 64, 0.16)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)'
  ctx.lineWidth = emphasized ? 3.8 : 3
  ctx.beginPath()
  ctx.arc(0, 0, outerSize, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.shadowBlur = emphasized ? 16 : 11
  ctx.strokeStyle = '#ff2440'
  ctx.lineWidth = emphasized ? 6 : 4.8
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = emphasized ? 2.6 : 2.1
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.58, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = emphasized ? 3.4 : 2.8
  ctx.beginPath()
  ctx.moveTo(-outerSize - 7, 0)
  ctx.lineTo(-size * 0.42, 0)
  ctx.moveTo(size * 0.42, 0)
  ctx.lineTo(outerSize + 7, 0)
  ctx.moveTo(0, -outerSize - 7)
  ctx.lineTo(0, -size * 0.42)
  ctx.moveTo(0, size * 0.42)
  ctx.lineTo(0, outerSize + 7)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, emphasized ? 7.5 : 6.2, 0, Math.PI * 2)
  ctx.fillStyle = '#0b0f17'
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.6
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(0, 0, emphasized ? 3.8 : 3.2, 0, Math.PI * 2)
  ctx.fillStyle = '#ff2440'
  ctx.fill()

  ctx.setLineDash([8, 6])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)'
  ctx.lineWidth = 1.8
  ctx.beginPath()
  ctx.arc(0, 0, outerSize + 9, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  const labelText = '预测源点'
  ctx.font = 'bold 14px "Noto Sans SC"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const labelWidth = ctx.measureText(labelText).width + 22
  const labelHeight = 24
  const labelY = -outerSize - 32
  ctx.fillStyle = 'rgba(8, 13, 23, 0.88)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.roundRect(-labelWidth / 2, labelY - labelHeight / 2, labelWidth, labelHeight, 6)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(labelText, 0, labelY)
  ctx.restore()
}

export function drawSmartMapSourceRefinementOverlay(
  ctx: CanvasRenderingContext2D,
  iteration: SmartMapSourceRefinementIteration | null | undefined,
  estimatedSource: SmartMapEstimatedSource | null | undefined,
  emphasized: boolean,
) {
  if (!iteration && !estimatedSource) return
  ctx.save()
  if (iteration) {
    drawRefinementPolygon(ctx, iteration)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 9px "Noto Sans SC"'
    ctx.textAlign = 'center'
    ctx.fillText(`R${iteration.iteration}`, iteration.center.x, iteration.center.y - iteration.radius - 12)
  }
  if (estimatedSource) {
    drawEstimatedSourceIcon(ctx, estimatedSource, emphasized)
  }
  ctx.restore()
}
