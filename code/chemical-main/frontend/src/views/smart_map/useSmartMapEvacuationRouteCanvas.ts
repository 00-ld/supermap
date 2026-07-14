import type { SmartMapEvacuationRoute } from './useSmartMapEvacuationPlanning'

export interface SmartMapEvacuationRouteCanvasOptions {
  planningMode: string
  displayMode: string
  activeRoute: SmartMapEvacuationRoute | null | undefined
  buildingRoutes: SmartMapEvacuationRoute[]
  selectedBuildingRoute: SmartMapEvacuationRoute | null | undefined
}

function drawRouteArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  emphasized: boolean,
) {
  const scale = emphasized ? 0.78 : 0.58
  const headLength = 9 * scale
  const halfHead = 5.2 * scale

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)

  ctx.shadowColor = emphasized ? 'rgba(31,255,103,0.72)' : 'rgba(31,255,103,0.36)'
  ctx.shadowBlur = emphasized ? 6 : 3
  ctx.fillStyle = emphasized ? '#b9ff4d' : 'rgba(148,255,95,0.74)'
  ctx.beginPath()
  ctx.moveTo(headLength, 0)
  ctx.lineTo(-headLength * 0.45, -halfHead)
  ctx.lineTo(-headLength * 0.45, halfHead)
  ctx.closePath()
  ctx.fill()

  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(2,18,10,0.72)'
  ctx.lineWidth = emphasized ? 1.2 : 0.9
  ctx.beginPath()
  ctx.moveTo(headLength, 0)
  ctx.lineTo(-headLength * 0.45, -halfHead)
  ctx.lineTo(-headLength * 0.45, halfHead)
  ctx.closePath()
  ctx.stroke()

  ctx.restore()
}

function traceRoutePath(ctx: CanvasRenderingContext2D, route: SmartMapEvacuationRoute) {
  const path = route.path || []
  if (path.length < 2) return
  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)
  for (let index = 1; index < path.length; index++) {
    ctx.lineTo(path[index].x, path[index].y)
  }
}

function drawRouteDashedLine(
  ctx: CanvasRenderingContext2D,
  route: SmartMapEvacuationRoute,
  emphasized: boolean,
) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash(emphasized ? [10, 8] : [7, 9])
  ctx.lineDashOffset = 0
  ctx.shadowColor = emphasized ? 'rgba(31,255,103,0.55)' : 'rgba(31,255,103,0.24)'
  ctx.shadowBlur = emphasized ? 7 : 3
  ctx.strokeStyle = emphasized ? 'rgba(31,255,103,0.92)' : 'rgba(31,255,103,0.52)'
  ctx.lineWidth = emphasized ? 3.2 : 2
  traceRoutePath(ctx, route)
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.setLineDash(emphasized ? [3, 15] : [2, 14])
  ctx.strokeStyle = emphasized ? '#d8ff72' : 'rgba(216,255,114,0.66)'
  ctx.lineWidth = emphasized ? 1.35 : 0.9
  traceRoutePath(ctx, route)
  ctx.stroke()
  ctx.restore()
}

function drawRouteArrowHeads(
  ctx: CanvasRenderingContext2D,
  route: SmartMapEvacuationRoute,
  emphasized: boolean,
) {
  const path = route.path || []
  const spacing = emphasized ? 72 : 96
  for (let index = 1; index < path.length; index++) {
    const start = path[index - 1]
    const end = path[index]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.hypot(dx, dy)
    if (length < 28) continue
    const angle = Math.atan2(dy, dx)
    const arrowCount = Math.max(1, Math.floor(length / spacing))
    for (let arrowIndex = 0; arrowIndex < arrowCount; arrowIndex++) {
      const ratio = (arrowIndex + 0.5) / arrowCount
      drawRouteArrow(
        ctx,
        start.x + dx * ratio,
        start.y + dy * ratio,
        angle,
        emphasized,
      )
    }
  }
}

function drawSingleEvacuationRoute(
  ctx: CanvasRenderingContext2D,
  route: SmartMapEvacuationRoute,
  options: { emphasized?: boolean; showMarkers?: boolean } = {},
) {
  if (!route.isReachable || !route.path?.length || route.path.length < 2) return
  const emphasized = options.emphasized !== false
  const showMarkers = options.showMarkers !== false
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  drawRouteDashedLine(ctx, route, emphasized)
  drawRouteArrowHeads(ctx, route, emphasized)

  if (!showMarkers) {
    ctx.restore()
    return
  }

  const startPoint = route.path[0]
  const endPoint = route.path[route.path.length - 1]
  ctx.shadowColor = 'rgba(31,255,103,0.95)'
  ctx.shadowBlur = 15
  ctx.fillStyle = '#1fff67'
  ctx.beginPath()
  ctx.arc(startPoint.x, startPoint.y, 7.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#b9ff4d'
  ctx.beginPath()
  ctx.arc(endPoint.x, endPoint.y, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 9px "Noto Sans SC"'
  ctx.textAlign = 'center'
  ctx.fillText('起点', startPoint.x, startPoint.y - 14)
  ctx.fillText('出口', endPoint.x, endPoint.y - 14)
  ctx.restore()
}

export function drawSmartMapEvacuationRoutes(
  ctx: CanvasRenderingContext2D,
  options: SmartMapEvacuationRouteCanvasOptions,
) {
  const route = options.activeRoute
  if (
    options.planningMode === 'all'
    && options.displayMode === 'all'
    && options.buildingRoutes.length
  ) {
    const highlightedBuildingId = options.selectedBuildingRoute?.buildingId || route?.buildingId || ''
    options.buildingRoutes
      .filter(item => item.isReachable)
      .forEach(item => {
        drawSingleEvacuationRoute(ctx, item, {
          emphasized: item.buildingId === highlightedBuildingId,
          showMarkers: item.buildingId === highlightedBuildingId,
        })
      })
    return
  }
  if (!route) return
  drawSingleEvacuationRoute(ctx, route, {
    emphasized: true,
    showMarkers: true,
  })
}
