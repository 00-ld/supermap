import type { MapFacility } from '@/data/realMapAssets'
import {
  getSmartMapFacilityBounds,
  smartMapHasRadiusFacility,
  type SmartMapFacilityBounds,
} from './useSmartMapFacilityCanvas'

export interface SmartMapRect {
  x: number
  y: number
  w: number
  h: number
}

export interface SmartMapRoad extends SmartMapRect {
  main?: boolean
}

export interface SmartMapPipe {
  from: [number, number]
  to: [number, number]
  status?: string
}

export interface SmartMapBaseCanvasSize {
  width: number
  height: number
}

type SmartMapFacilityMatcher = (facility: MapFacility) => boolean
type SmartMapFacilityBoundsResolver = (facility: MapFacility) => SmartMapFacilityBounds
type SmartMapRadiusFacilityPredicate = (facility: MapFacility) => facility is MapFacility & { r: number }

export function drawSmartMapGround(
  ctx: CanvasRenderingContext2D,
  options: {
    boundary: SmartMapRect
    realMap: SmartMapBaseCanvasSize
    realMapImage: HTMLImageElement
    scale: number
  },
) {
  const { boundary, realMap, realMapImage } = options
  ctx.fillStyle = 'rgba(7, 9, 33, 0.38)'
  ctx.fillRect(boundary.x, boundary.y, boundary.w, boundary.h)
  if (realMapImage.complete && realMapImage.naturalWidth > 0) {
    ctx.save()
    ctx.globalAlpha = 0.78
    ctx.drawImage(realMapImage, 0, 0, realMap.width, realMap.height)
    ctx.restore()
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1 / Math.max(options.scale, 0.1)
  ctx.strokeRect(boundary.x, boundary.y, boundary.w, boundary.h)
}

export function drawSmartMapRoads(ctx: CanvasRenderingContext2D, roads: SmartMapRoad[]) {
  roads.forEach(road => {
    ctx.fillStyle = road.main ? '#3a4255' : '#2e3648'
    ctx.fillRect(road.x, road.y, road.w, road.h)
    if (road.main) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 1
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      if (road.w > road.h) {
        ctx.moveTo(road.x, road.y + road.h / 2)
        ctx.lineTo(road.x + road.w, road.y + road.h / 2)
      } else {
        ctx.moveTo(road.x + road.w / 2, road.y)
        ctx.lineTo(road.x + road.w / 2, road.y + road.h)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(road.x, road.y, road.w, road.h)
  })
}

export function drawSmartMapKeyAreas(ctx: CanvasRenderingContext2D, keyAreas: SmartMapRect[]) {
  keyAreas.forEach(area => {
    ctx.strokeStyle = 'rgba(147,167,189,0.46)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(area.x, area.y, area.w, area.h)
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(147,167,189,0.05)'
    ctx.fillRect(area.x, area.y, area.w, area.h)
    const cornerLength = 10
    ctx.strokeStyle = '#93a7bd'
    ctx.lineWidth = 2.5
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(area.x, area.y + cornerLength)
    ctx.lineTo(area.x, area.y)
    ctx.lineTo(area.x + cornerLength, area.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(area.x + area.w - cornerLength, area.y)
    ctx.lineTo(area.x + area.w, area.y)
    ctx.lineTo(area.x + area.w, area.y + cornerLength)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(area.x, area.y + area.h - cornerLength)
    ctx.lineTo(area.x, area.y + area.h)
    ctx.lineTo(area.x + cornerLength, area.y + area.h)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(area.x + area.w - cornerLength, area.y + area.h)
    ctx.lineTo(area.x + area.w, area.y + area.h)
    ctx.lineTo(area.x + area.w, area.y + area.h - cornerLength)
    ctx.stroke()
  })
}

export function drawSmartMapPipes(ctx: CanvasRenderingContext2D, pipes: SmartMapPipe[]) {
  pipes.forEach(pipe => {
    const [fromX, fromY] = pipe.from
    const [toX, toY] = pipe.to
    const midX = (fromX + toX) / 2
    ctx.strokeStyle = pipe.status === '运行中' ? '#6a7a8a' : '#4a5a6a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.lineTo(midX, fromY)
    ctx.lineTo(midX, toY)
    ctx.lineTo(toX, toY)
    ctx.stroke()
  })
}

export function drawSmartMapBuildings(
  ctx: CanvasRenderingContext2D,
  facilities: MapFacility[],
  matchFilter: SmartMapFacilityMatcher,
) {
  const typeColors: Record<string, string> = {
    office: '#5a4a3a',
    production: '#3a5a4a',
    utility: '#3a4a5a',
    warehouse: '#4a4a3a',
    treatment: '#2a4a5a',
  }
  facilities
    .filter(facility => ['office', 'production', 'utility', 'warehouse', 'treatment'].includes(facility.type))
    .forEach(facility => {
      if (!matchFilter(facility)) return
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(facility.x + 3, facility.y + 3, facility.w, facility.h)
      ctx.fillStyle = typeColors[facility.type] || '#4a5568'
      ctx.fillRect(facility.x, facility.y, facility.w, facility.h)
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 0.8
      ctx.strokeRect(facility.x, facility.y, facility.w, facility.h)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 0.5
      for (let lineX = facility.x + 8; lineX < facility.x + facility.w; lineX += 10) {
        ctx.beginPath()
        ctx.moveTo(lineX, facility.y)
        ctx.lineTo(lineX, facility.y + facility.h)
        ctx.stroke()
      }
    })
}

export function drawSmartMapTanks(
  ctx: CanvasRenderingContext2D,
  options: {
    facilities: MapFacility[]
    matchFilter: SmartMapFacilityMatcher
    getFacilityBounds?: SmartMapFacilityBoundsResolver
    scale: number
    now?: number
  },
) {
  const boundsFor = options.getFacilityBounds || getSmartMapFacilityBounds
  const now = options.now ?? Date.now()
  options.facilities.filter(facility => facility.type === 'tank').forEach(facility => {
    if (!options.matchFilter(facility)) return
    const { x, y, w, h, cx, cy, r } = boundsFor(facility)
    if (Number.isFinite(facility.w) && Number.isFinite(facility.h)) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(x + 3, y + 3, w, h)
      const grad = ctx.createLinearGradient(x, y, x + w, y + h)
      grad.addColorStop(0, 'rgba(138,154,184,0.52)')
      grad.addColorStop(0.7, 'rgba(90,106,131,0.38)')
      grad.addColorStop(1, 'rgba(58,74,90,0.32)')
      ctx.fillStyle = grad
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1 / Math.max(options.scale, 0.1)
      ctx.strokeRect(x, y, w, h)
      return
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.arc(cx + 2, cy + 2, r, 0, Math.PI * 2)
    ctx.fill()
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r)
    grad.addColorStop(0, '#8a9ab8')
    grad.addColorStop(0.7, '#5a6a83')
    grad.addColorStop(1, '#3a4a5a')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    if (facility.level) {
      const levelAngle = Math.PI * (1 - facility.level / 100)
      ctx.fillStyle = facility.level > 85 ? 'rgba(199,130,130,0.28)' : 'rgba(147,167,189,0.20)'
      ctx.beginPath()
      ctx.arc(cx, cy, r - 2, levelAngle, Math.PI)
      ctx.lineTo(cx + (r - 2) * Math.cos(levelAngle), cy + (r - 2) * Math.sin(levelAngle))
      ctx.closePath()
      ctx.fill()
    }
    if (facility.status === '告警') {
      const blinkAlpha = 0.3 + 0.3 * Math.sin(now / 300)
      ctx.strokeStyle = `rgba(199,130,130,${blinkAlpha})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2)
      ctx.stroke()
    }
  })
}

export function drawSmartMapTowers(
  ctx: CanvasRenderingContext2D,
  options: {
    facilities: MapFacility[]
    matchFilter: SmartMapFacilityMatcher
    getFacilityBounds?: SmartMapFacilityBoundsResolver
    hasRadiusFacility?: SmartMapRadiusFacilityPredicate
    scale: number
  },
) {
  const boundsFor = options.getFacilityBounds || getSmartMapFacilityBounds
  const hasRadius = options.hasRadiusFacility || smartMapHasRadiusFacility
  options.facilities.filter(facility => facility.type === 'tower').forEach(facility => {
    if (!options.matchFilter(facility)) return
    const bounds = boundsFor(facility)
    if (!hasRadius(facility)) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)'
      ctx.fillRect(bounds.x + 3, bounds.y + 3, bounds.w, bounds.h)
      ctx.fillStyle = 'rgba(138,106,138,0.36)'
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.lineWidth = 1 / Math.max(options.scale, 0.1)
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h)
      return
    }
    const { x: cx, y: cy, r, h } = facility
    const topY = cy - h / 2
    const bottomY = cy + h / 2
    const topWidth = r * 0.85
    const bottomWidth = r
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath()
    ctx.ellipse(cx + 2, bottomY + 2, r, r * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#6a5a7a'
    ctx.beginPath()
    ctx.moveTo(cx - topWidth, topY)
    ctx.lineTo(cx + topWidth, topY)
    ctx.lineTo(cx + bottomWidth, bottomY)
    ctx.lineTo(cx - bottomWidth, bottomY)
    ctx.closePath()
    ctx.fill()
    const gradient = ctx.createLinearGradient(cx - r, 0, cx + r, 0)
    gradient.addColorStop(0, 'rgba(255,255,255,0.05)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.1)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(cx - topWidth, topY)
    ctx.lineTo(cx + topWidth, topY)
    ctx.lineTo(cx + bottomWidth, bottomY)
    ctx.lineTo(cx - bottomWidth, bottomY)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(cx - topWidth, topY)
    ctx.lineTo(cx + topWidth, topY)
    ctx.lineTo(cx + bottomWidth, bottomY)
    ctx.lineTo(cx - bottomWidth, bottomY)
    ctx.closePath()
    ctx.stroke()
    for (let i = 1; i <= 3; i++) {
      const platformY = topY + (h / 4) * i
      const platformWidth = topWidth + (bottomWidth - topWidth) * (i / 4)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(cx - platformWidth - 2, platformY)
      ctx.lineTo(cx + platformWidth + 2, platformY)
      ctx.stroke()
    }
    ctx.fillStyle = '#8a7a9a'
    ctx.beginPath()
    ctx.ellipse(cx, topY, topWidth, topWidth * 0.25, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 0.5
    ctx.stroke()
    if (facility.status === '维护中') {
      ctx.strokeStyle = 'rgba(194,164,109,0.36)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.ellipse(cx, cy, r + 6, h / 2 + 6, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  })
}

export function drawSmartMapLabels(
  ctx: CanvasRenderingContext2D,
  options: {
    facilities: MapFacility[]
    matchFilter: SmartMapFacilityMatcher
    getFacilityBounds?: SmartMapFacilityBoundsResolver
  },
) {
  const boundsFor = options.getFacilityBounds || getSmartMapFacilityBounds
  ctx.font = '9px "Noto Sans SC"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  options.facilities.forEach(facility => {
    if (!options.matchFilter(facility)) return
    const bounds = boundsFor(facility)
    const labelX = bounds.cx
    const labelY = bounds.y + bounds.h + 4
    const textWidth = ctx.measureText(facility.name).width
    ctx.fillStyle = '#0a0f1a'
    ctx.fillRect(labelX - textWidth / 2 - 3, labelY - 1, textWidth + 6, 13)
    ctx.fillStyle = '#e8ecf4'
    ctx.fillText(facility.name, labelX, labelY)
  })
  ctx.font = 'bold 11px "Noto Sans SC"'
  const zoneLabels = [
    { text: '行政办公区', x: 185, y: 60 },
    { text: '化工生产一区', x: 495, y: 60 },
    { text: '精细化工厂房', x: 790, y: 60 },
    { text: '储罐区', x: 210, y: 270 },
    { text: '塔器区', x: 555, y: 260 },
    { text: '公用工程区', x: 530, y: 438 },
    { text: '仓储物流区', x: 822, y: 438 },
    { text: '污水处理区', x: 170, y: 498 },
  ]
  zoneLabels.forEach(zone => {
    const textWidth = ctx.measureText(zone.text).width
    ctx.fillStyle = '#0a0f1a'
    ctx.fillRect(zone.x - textWidth / 2 - 4, zone.y - 2, textWidth + 8, 16)
    ctx.fillStyle = '#e8ecf4'
    ctx.textAlign = 'center'
    ctx.fillText(zone.text, zone.x, zone.y)
  })
}

export function drawSmartMapHeatmap(
  ctx: CanvasRenderingContext2D,
  options: {
    facilities: MapFacility[]
    getFacilityBounds?: SmartMapFacilityBoundsResolver
  },
) {
  const boundsFor = options.getFacilityBounds || getSmartMapFacilityBounds
  options.facilities.forEach(facility => {
    const { cx, cy } = boundsFor(facility)
    let heat = 0.3
    if (facility.temp != null) heat = Math.min(1, Math.max(0.1, facility.temp / 250))
    if (facility.status === '告警') heat = 0.9
    if (facility.status === '维护中') heat = 0.6
    const radius = 40
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    if (heat > 0.7) {
      grad.addColorStop(0, `rgba(199,130,130,${heat * 0.38})`)
      grad.addColorStop(0.5, `rgba(194,164,109,${heat * 0.20})`)
      grad.addColorStop(1, 'rgba(194,164,109,0)')
    } else if (heat > 0.4) {
      grad.addColorStop(0, `rgba(255,165,0,${heat * 0.4})`)
      grad.addColorStop(0.5, `rgba(255,200,0,${heat * 0.2})`)
      grad.addColorStop(1, 'rgba(255,200,0,0)')
    } else {
      grad.addColorStop(0, `rgba(154,168,184,${heat * 0.20})`)
      grad.addColorStop(0.5, `rgba(147,167,189,${heat * 0.12})`)
      grad.addColorStop(1, 'rgba(147,167,189,0)')
    }
    ctx.fillStyle = grad
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
  })
}
