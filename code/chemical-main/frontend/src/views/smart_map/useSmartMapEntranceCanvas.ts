export interface SmartMapEntranceCanvasItem {
  id: string
  x: number
  y: number
  label: string
  kind?: string
  edge?: string
  tooltipSide?: string
}

export type SmartMapEntranceRecord = SmartMapEntranceCanvasItem & {
  parentId?: string
}

export interface SmartMapEntranceCanvasSize {
  width: number
  height: number
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#93a7bd'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function drawEntranceConnector(ctx: CanvasRenderingContext2D, edge: string | undefined, length: number) {
  ctx.beginPath()
  if (edge === 'left') {
    ctx.moveTo(4, 0)
    ctx.lineTo(length, 0)
  } else if (edge === 'right') {
    ctx.moveTo(-4, 0)
    ctx.lineTo(-length, 0)
  } else if (edge === 'top') {
    ctx.moveTo(0, 4)
    ctx.lineTo(0, length)
  } else {
    ctx.moveTo(0, -4)
    ctx.lineTo(0, -length)
  }
  ctx.stroke()
}

function drawEntranceMarker(
  ctx: CanvasRenderingContext2D,
  entrance: SmartMapEntranceCanvasItem,
  hoveredEntranceId: string,
) {
  const isHovered = hoveredEntranceId === entrance.id
  const color = entrance.kind === 'park' ? '#6ee7ff' : '#ffd166'
  const rgb = hexToRgb(color)
  ctx.save()
  ctx.translate(entrance.x, entrance.y)
  ctx.shadowColor = `rgba(${rgb},${isHovered ? 0.85 : 0.58})`
  ctx.shadowBlur = isHovered ? 12 : 8
  ctx.strokeStyle = `rgba(${rgb}, ${isHovered ? 0.98 : 0.86})`
  ctx.lineWidth = entrance.kind === 'park' ? 2.2 : 1.8
  drawEntranceConnector(ctx, entrance.edge, entrance.kind === 'park' ? 16 : 10)
  ctx.stroke()
  ctx.shadowBlur = isHovered ? 14 : 10
  ctx.fillStyle = `rgba(${rgb}, ${isHovered ? 0.42 : 0.30})`
  ctx.strokeStyle = color
  ctx.lineWidth = isHovered ? 2.2 : 1.7
  ctx.beginPath()
  ctx.moveTo(0, -8)
  ctx.lineTo(7, -3)
  ctx.lineTo(7, 4)
  ctx.lineTo(0, 9)
  ctx.lineTo(-7, 4)
  ctx.lineTo(-7, -3)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(4,8,16,0.86)'
  ctx.fillRect(-2.2, -4, 4.4, 8)
  ctx.strokeStyle = `rgba(${rgb}, ${isHovered ? 0.95 : 0.70})`
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.arc(0, 0, entrance.kind === 'park' ? 12 : 10, 0, Math.PI * 2)
  ctx.stroke()
  if (entrance.kind === 'park') {
    ctx.strokeStyle = `rgba(${rgb}, 0.46)`
    ctx.beginPath()
    ctx.arc(0, 0, 16, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawEntranceTooltip(
  ctx: CanvasRenderingContext2D,
  entrance: SmartMapEntranceCanvasItem,
  mapSize: SmartMapEntranceCanvasSize,
) {
  const header = entrance.kind === 'park' ? '园区出入口' : '建筑出入口'
  const color = entrance.kind === 'park' ? '#9aa8b8' : '#a6b3c2'
  const rgb = hexToRgb(color)
  ctx.save()
  ctx.textBaseline = 'top'
  ctx.textAlign = 'center'
  ctx.font = 'bold 10px "Noto Sans SC"'
  const headerWidth = ctx.measureText(header).width
  ctx.font = '9px "Noto Sans SC"'
  const detailWidth = ctx.measureText(entrance.label).width
  const boxWidth = Math.max(headerWidth, detailWidth) + 28
  const boxHeight = 38
  let boxX = entrance.x - boxWidth / 2
  let boxY = entrance.y - boxHeight - 16
  if (entrance.tooltipSide === 'right') boxX = entrance.x + 14
  if (entrance.tooltipSide === 'left') boxX = entrance.x - boxWidth - 14
  if (entrance.tooltipSide === 'bottom') boxY = entrance.y + 14
  boxX = clampValue(boxX, 22, mapSize.width - boxWidth - 22)
  boxY = clampValue(boxY, 22, mapSize.height - boxHeight - 22)
  ctx.strokeStyle = `rgba(${rgb}, 0.85)`
  ctx.fillStyle = 'rgba(10,15,26,0.95)'
  ctx.lineWidth = 1.2
  drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 8)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = 'bold 10px "Noto Sans SC"'
  ctx.fillText(header, boxX + boxWidth / 2, boxY + 7)
  ctx.fillStyle = '#e8ecf4'
  ctx.font = '9px "Noto Sans SC"'
  ctx.fillText(entrance.label, boxX + boxWidth / 2, boxY + 21)
  ctx.restore()
}

export function drawSmartMapEntrances(
  ctx: CanvasRenderingContext2D,
  entrances: SmartMapEntranceCanvasItem[],
  hoveredEntrance: SmartMapEntranceCanvasItem | null | undefined,
  mapSize: SmartMapEntranceCanvasSize,
) {
  const hoveredEntranceId = hoveredEntrance?.id || ''
  entrances.forEach(entrance => drawEntranceMarker(ctx, entrance, hoveredEntranceId))
  if (hoveredEntrance) drawEntranceTooltip(ctx, hoveredEntrance, mapSize)
}
