import type { MapFacility } from '@/data/realMapAssets'

export interface SmartMapFacilityBounds {
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
  r: number
}

export interface SmartMapSourceMarkerOptions {
  point: { x: number; y: number } | null | undefined
  gas: { color: string } | null | undefined
  sourceName?: string
  showSourceName?: boolean
  now?: number
}

function hexToRgb(hex: string) {
  const normalized = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#93a7bd'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function getSmartMapFacilityBounds(facility: MapFacility): SmartMapFacilityBounds {
  const hasRect = Number.isFinite(facility.x)
    && Number.isFinite(facility.y)
    && Number.isFinite(facility.w)
    && Number.isFinite(facility.h)
  if (hasRect) {
    return {
      x: facility.x,
      y: facility.y,
      w: facility.w,
      h: facility.h,
      cx: facility.x + facility.w / 2,
      cy: facility.y + facility.h / 2,
      r: Math.max(8, Math.min(facility.w, facility.h) / 2),
    }
  }

  const r = Number.isFinite(facility.r) ? Number(facility.r) : 20
  const h = Number.isFinite(facility.h) ? Number(facility.h) : r * 2
  return {
    x: facility.x - r,
    y: facility.y - h / 2,
    w: r * 2,
    h,
    cx: facility.x,
    cy: facility.y,
    r,
  }
}

export function smartMapHasRadiusFacility(facility: MapFacility): facility is MapFacility & { r: number } {
  return Number.isFinite(facility.r)
}

export function drawSmartMapDiffusionSourceMarker(
  ctx: CanvasRenderingContext2D,
  options: SmartMapSourceMarkerOptions,
) {
  const { point, gas } = options
  if (!point || !gas) return
  const x = point.x
  const y = point.y
  const pulse = 6 + Math.sin((options.now ?? Date.now()) / 240) * 2
  ctx.save()
  ctx.strokeStyle = gas.color
  ctx.fillStyle = 'rgba(10,15,26,0.88)'
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(x, y, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = `rgba(${hexToRgb(gas.color)},0.35)`
  ctx.beginPath()
  ctx.arc(x, y, 11 + pulse, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = gas.color
  ctx.beginPath()
  ctx.arc(x, y, 2.6, 0, Math.PI * 2)
  ctx.fill()
  if (options.showSourceName && options.sourceName) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 9px "Noto Sans SC"'
    ctx.textAlign = 'center'
    ctx.fillText(options.sourceName, x, y - 18)
  }
  ctx.restore()
}

export function drawSmartMapFacilitySelection(ctx: CanvasRenderingContext2D, facility: MapFacility) {
  ctx.strokeStyle = '#a6b3c2'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 3])
  const bounds = getSmartMapFacilityBounds(facility)
  if (smartMapHasRadiusFacility(facility) && facility.type === 'tank') {
    ctx.beginPath()
    ctx.arc(facility.x, facility.y, facility.r + 6, 0, Math.PI * 2)
    ctx.stroke()
  } else if (smartMapHasRadiusFacility(facility) && facility.type === 'tower') {
    ctx.beginPath()
    ctx.ellipse(facility.x, facility.y, facility.r + 8, facility.h / 2 + 8, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8)
  }
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(198,208,220,0.92)'
  ctx.font = 'bold 10px "Noto Sans SC"'
  ctx.textAlign = 'center'
  ctx.fillText(facility.name, bounds.cx, bounds.y - 15)
}

export function drawSmartMapFacilityHover(ctx: CanvasRenderingContext2D, facility: MapFacility) {
  ctx.strokeStyle = 'rgba(147,167,189,0.52)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 3])
  const bounds = getSmartMapFacilityBounds(facility)
  if (smartMapHasRadiusFacility(facility) && facility.type === 'tank') {
    ctx.beginPath()
    ctx.arc(facility.x, facility.y, facility.r + 5, 0, Math.PI * 2)
    ctx.stroke()
  } else if (smartMapHasRadiusFacility(facility) && facility.type === 'tower') {
    ctx.beginPath()
    ctx.ellipse(facility.x, facility.y, facility.r + 6, facility.h / 2 + 6, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.strokeRect(bounds.x - 3, bounds.y - 3, bounds.w + 6, bounds.h + 6)
  }
  ctx.setLineDash([])
}
