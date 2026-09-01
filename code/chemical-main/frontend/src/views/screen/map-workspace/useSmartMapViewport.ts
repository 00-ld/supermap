import { computed, reactive } from 'vue'

export interface SmartMapViewportState {
  offsetX: number
  offsetY: number
  scale: number
  dragging: boolean
  lastX: number
  lastY: number
}

export interface SmartMapViewportPoint {
  x: number
  y: number
}

export interface SmartMapViewportOptions {
  getCanvas: () => HTMLCanvasElement | null | undefined
  map: {
    width: number
    height: number
  }
  maxScale?: number
  render?: () => void
}

export interface SmartMapViewportRenderControls {
  clampMapViewToCanvas: () => void
}

export function useSmartMapViewport(options: SmartMapViewportOptions) {
  const maxScale = options.maxScale ?? 3
  let focusAnimationFrameId: number | null = null
  const viewState = reactive<SmartMapViewportState>({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    dragging: false,
    lastX: 0,
    lastY: 0,
  })
  const zoomLevel = computed(() => viewState.scale.toFixed(1))

  function getCanvas() {
    return options.getCanvas()
  }

  function worldToScreen(wx: number, wy: number): SmartMapViewportPoint {
    const canvas = getCanvas()
    const marginX = canvas ? canvas.width * 0.05 : 0
    const marginY = canvas ? canvas.height * 0.05 : 0
    return {
      x: (wx + viewState.offsetX) * viewState.scale + marginX,
      y: (wy + viewState.offsetY) * viewState.scale + marginY,
    }
  }

  function screenToWorld(sx: number, sy: number): SmartMapViewportPoint {
    const canvas = getCanvas()
    const marginX = canvas ? canvas.width * 0.05 : 0
    const marginY = canvas ? canvas.height * 0.05 : 0
    return {
      x: (sx - marginX) / viewState.scale - viewState.offsetX,
      y: (sy - marginY) / viewState.scale - viewState.offsetY,
    }
  }

  function getBoundarySafeScale() {
    const canvas = getCanvas()
    if (!canvas) return 0.15
    const scaleX = (canvas.width - 12) / options.map.width
    const scaleY = (canvas.height - 12) / options.map.height
    return Math.max(0.15, Math.min(scaleX, scaleY))
  }

  function fitInitialMapView() {
    const canvas = getCanvas()
    if (!canvas) return
    const scaleX = (canvas.width * 0.98) / options.map.width
    const scaleY = (canvas.height * 0.98) / options.map.height
    viewState.scale = Math.min(scaleX, scaleY)

    const renderedWidth = options.map.width * viewState.scale
    const renderedHeight = options.map.height * viewState.scale
    const leftPadding = Math.max(8, (canvas.width - renderedWidth) / 2)
    const topPadding = Math.max(8, (canvas.height - renderedHeight) / 2)
    const builtInMarginX = canvas.width * 0.05
    const builtInMarginY = canvas.height * 0.05
    viewState.offsetX = (leftPadding - builtInMarginX) / viewState.scale
    viewState.offsetY = (topPadding - builtInMarginY) / viewState.scale
    clampMapViewToCanvas()
  }

  function clampMapViewToCanvas() {
    const canvas = getCanvas()
    if (!canvas) return
    const s = Math.max(viewState.scale, getBoundarySafeScale())
    if (viewState.scale !== s) viewState.scale = s

    const pad = 6
    const builtInMarginX = canvas.width * 0.05
    const builtInMarginY = canvas.height * 0.05
    const mapW = options.map.width * s
    const mapH = options.map.height * s

    if (mapW <= canvas.width - pad * 2) {
      viewState.offsetX = ((canvas.width - mapW) / 2 - builtInMarginX) / s
    } else {
      let left = viewState.offsetX * s + builtInMarginX
      let right = left + mapW
      if (left > pad) {
        viewState.offsetX += (pad - left) / s
        left = viewState.offsetX * s + builtInMarginX
        right = left + mapW
      }
      if (right < canvas.width - pad) {
        viewState.offsetX += (canvas.width - pad - right) / s
      }
    }

    if (mapH <= canvas.height - pad * 2) {
      viewState.offsetY = ((canvas.height - mapH) / 2 - builtInMarginY) / s
    } else {
      let top = viewState.offsetY * s + builtInMarginY
      let bottom = top + mapH
      if (top > pad) {
        viewState.offsetY += (pad - top) / s
        top = viewState.offsetY * s + builtInMarginY
        bottom = top + mapH
      }
      if (bottom < canvas.height - pad) {
        viewState.offsetY += (canvas.height - pad - bottom) / s
      }
    }
  }

  function zoomIn() {
    viewState.scale = Math.min(maxScale, viewState.scale * 1.2)
  }

  function zoomOut() {
    viewState.scale = Math.max(getBoundarySafeScale(), viewState.scale / 1.2)
  }

  function applyWheelZoom(deltaY: number) {
    const factor = deltaY < 0 ? 1.1 : 0.9
    viewState.scale = Math.max(
      getBoundarySafeScale(),
      Math.min(maxScale, viewState.scale * factor),
    )
  }

  function focusWorldPoint(point: SmartMapViewportPoint) {
    const canvas = getCanvas()
    if (!canvas) return
    viewState.offsetX = canvas.width / 2 / viewState.scale - point.x
    viewState.offsetY = canvas.height / 2 / viewState.scale - point.y
  }

  function flyToWorldPoint(
    point: SmartMapViewportPoint,
    durationMs = 720,
    targetScale = Math.max(viewState.scale, 1),
  ) {
    const canvas = getCanvas()
    if (!canvas) return
    if (focusAnimationFrameId !== null)
      cancelAnimationFrame(focusAnimationFrameId)

    const startOffsetX = viewState.offsetX
    const startOffsetY = viewState.offsetY
    const startScale = viewState.scale
    const safeTargetScale = Math.min(
      maxScale,
      Math.max(getBoundarySafeScale(), targetScale),
    )
    const targetOffsetX = canvas.width / 2 / safeTargetScale - point.x
    const targetOffsetY = canvas.height / 2 / safeTargetScale - point.y
    const startedAt = performance.now()

    const animate = (timestamp: number) => {
      const progress = Math.min(
        1,
        Math.max(0, (timestamp - startedAt) / Math.max(durationMs, 1)),
      )
      const eased = 1 - Math.pow(1 - progress, 3)
      viewState.scale = startScale + (safeTargetScale - startScale) * eased
      viewState.offsetX = startOffsetX + (targetOffsetX - startOffsetX) * eased
      viewState.offsetY = startOffsetY + (targetOffsetY - startOffsetY) * eased
      options.render?.()
      if (progress < 1) {
        focusAnimationFrameId = requestAnimationFrame(animate)
        return
      }
      focusAnimationFrameId = null
      clampMapViewToCanvas()
      options.render?.()
    }

    focusAnimationFrameId = requestAnimationFrame(animate)
  }

  const viewportRenderControls: SmartMapViewportRenderControls = {
    clampMapViewToCanvas,
  }

  return {
    viewState,
    viewportRenderControls,
    zoomLevel,
    worldToScreen,
    screenToWorld,
    getBoundarySafeScale,
    fitInitialMapView,
    clampMapViewToCanvas,
    zoomIn,
    zoomOut,
    applyWheelZoom,
    focusWorldPoint,
    flyToWorldPoint,
  }
}
