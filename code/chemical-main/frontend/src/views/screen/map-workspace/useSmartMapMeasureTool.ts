import { ref } from 'vue'

export type SmartMapToolMode = 'select' | 'measure'

export interface SmartMapMeasurePoint {
  x: number
  y: number
}

export interface SmartMapMeasureToolOptions {
  showToast: (text: string, type?: 'success' | 'warn' | 'error' | 'danger') => void
}

export interface SmartMapMeasureLayer {
  hasMeasurePoints: () => boolean
  drawMeasure: (ctx: CanvasRenderingContext2D, scale: number) => void
}

export function useSmartMapMeasureTool(options: SmartMapMeasureToolOptions) {
  const measureMode = ref(false)
  const measurePoints: SmartMapMeasurePoint[] = []

  function clearMeasurePoints() {
    measurePoints.splice(0, measurePoints.length)
  }

  function addMeasurePoint(point: SmartMapMeasurePoint) {
    measurePoints.push({ x: point.x, y: point.y })
  }

  function hasMeasurePoints() {
    return measurePoints.length > 0
  }

  function measureCursor() {
    return measureMode.value ? 'crosshair' : 'grab'
  }

  function setSmartMapTool(tool: SmartMapToolMode, canvas?: HTMLCanvasElement | null) {
    if (tool === 'select') {
      measureMode.value = false
      clearMeasurePoints()
      if (canvas) canvas.style.cursor = 'grab'
      return
    }

    measureMode.value = !measureMode.value
    clearMeasurePoints()
    if (canvas) canvas.style.cursor = measureCursor()
    if (measureMode.value) options.showToast('点击地图添加测距点', 'success')
  }

  function drawSmartMapMeasure(ctx: CanvasRenderingContext2D, scale: number) {
    if (!hasMeasurePoints()) return
    const s = Math.max(0.1, scale || 1)
    ctx.strokeStyle = '#c2a46d'
    ctx.lineWidth = 1.5 / s
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(measurePoints[0].x, measurePoints[0].y)
    for (let i = 1; i < measurePoints.length; i++) ctx.lineTo(measurePoints[i].x, measurePoints[i].y)
    ctx.stroke()
    ctx.setLineDash([])

    let totalDist = 0
    for (let i = 1; i < measurePoints.length; i++) {
      const dx = measurePoints[i].x - measurePoints[i - 1].x
      const dy = measurePoints[i].y - measurePoints[i - 1].y
      const dist = Math.sqrt(dx * dx + dy * dy)
      totalDist += dist
      const mx = (measurePoints[i].x + measurePoints[i - 1].x) / 2
      const my = (measurePoints[i].y + measurePoints[i - 1].y) / 2
      ctx.fillStyle = '#c2a46d'
      ctx.font = 'bold 8px Orbitron'
      ctx.textAlign = 'center'
      ctx.fillText((dist * 0.5).toFixed(1) + 'm', mx, my - 6 / s)
    }

    if (measurePoints.length > 1) {
      ctx.fillStyle = '#c2a46d'
      ctx.font = 'bold 9px Orbitron'
      ctx.textAlign = 'left'
      const lastPoint = measurePoints[measurePoints.length - 1]
      ctx.fillText('Total: ' + (totalDist * 0.5).toFixed(1) + 'm', lastPoint.x + 6 / s, lastPoint.y)
    }

    measurePoints.forEach(point => {
      ctx.fillStyle = '#c2a46d'
      ctx.beginPath()
      ctx.arc(point.x, point.y, 2 / s, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const measureLayer: SmartMapMeasureLayer = {
    hasMeasurePoints,
    drawMeasure: drawSmartMapMeasure,
  }

  return {
    measureMode,
    addMeasurePoint,
    clearMeasurePoints,
    measureLayer,
    measureCursor,
    setSmartMapTool,
    drawSmartMapMeasure,
  }
}
