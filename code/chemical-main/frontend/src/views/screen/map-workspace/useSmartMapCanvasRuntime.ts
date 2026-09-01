import { nextTick, onMounted, onUnmounted, watch, type Ref } from 'vue'

export interface SmartMapCanvasRuntimeOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  containerRef: Ref<HTMLElement | null>
  viewMode: Ref<'2d' | '3d'>
  render: () => void
  fitInitialMapView: () => void
  updateClock: () => void
  showToast: (text: string, type?: 'success' | 'warn' | 'error' | 'danger') => void
  onCanvasBound: (
    canvas: HTMLCanvasElement,
    container: HTMLElement,
    context: CanvasRenderingContext2D,
  ) => void
  onCanvasReady: () => void
  onAnimationFrame: (deltaMs: number) => void
  onAfterRuntimeStart?: () => void
  onBeforeRuntimeStop?: () => void
}

export function useSmartMapCanvasRuntime(options: SmartMapCanvasRuntimeOptions) {
  let animFrameId = 0
  let lastAnimTime = 0
  let clockTimer = 0
  let canvasEl: HTMLCanvasElement | null = null
  let containerEl: HTMLElement | null = null
  let ctx: CanvasRenderingContext2D | null = null

  const getCanvas = () => canvasEl
  const getContext = () => ctx

  function bindCanvasFromRefs(showFailure = true) {
    const mountedCanvas = options.canvasRef.value
    const mountedContainer = options.containerRef.value
    const mountedCtx = mountedCanvas?.getContext('2d') || null
    if (!mountedCanvas || !mountedContainer || !mountedCtx) {
      if (showFailure) options.showToast('地图画布初始化失败', 'warn')
      return false
    }
    canvasEl = mountedCanvas
    containerEl = mountedContainer
    ctx = mountedCtx
    options.onCanvasBound(mountedCanvas, mountedContainer, mountedCtx)
    return true
  }

  function resizeCanvas() {
    if (!canvasEl || !containerEl) return
    canvasEl.width = containerEl.clientWidth
    canvasEl.height = containerEl.clientHeight
    options.render()
  }

  function animate(timestamp = 0) {
    if (options.viewMode.value === '3d') {
      lastAnimTime = timestamp
      animFrameId = requestAnimationFrame(animate)
      return
    }
    const deltaMs = lastAnimTime ? timestamp - lastAnimTime : 16
    lastAnimTime = timestamp
    options.onAnimationFrame(deltaMs)
    options.render()
    animFrameId = requestAnimationFrame(animate)
  }

  onMounted(() => {
    if (!bindCanvasFromRefs()) return
    options.onCanvasReady()
    resizeCanvas()
    options.fitInitialMapView()
    options.updateClock()
    clockTimer = setInterval(options.updateClock, 1000)
    window.addEventListener('resize', resizeCanvas)
    animate()
    options.onAfterRuntimeStart?.()
  })

  watch(options.viewMode, (mode) => {
    if (mode !== '2d') return
    nextTick(() => {
      if (!bindCanvasFromRefs(false)) return
      resizeCanvas()
      options.render()
    })
  })

  onUnmounted(() => {
    cancelAnimationFrame(animFrameId)
    clearInterval(clockTimer)
    options.onBeforeRuntimeStop?.()
    window.removeEventListener('resize', resizeCanvas)
  })

  return {
    getCanvas,
    getContext,
    resizeCanvas,
  }
}
