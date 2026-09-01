interface SmartMapRendererLike {
  render: (
    context: CanvasRenderingContext2D | null | undefined,
    canvas: HTMLCanvasElement | null | undefined,
  ) => void
}

export function useSmartMapRenderBridge() {
  let canvasEl: HTMLCanvasElement | null = null
  let context: CanvasRenderingContext2D | null = null
  let renderer: SmartMapRendererLike | null = null

  function bindCanvas(canvas: HTMLCanvasElement, nextContext: CanvasRenderingContext2D) {
    canvasEl = canvas
    context = nextContext
  }

  function bindRuntimeCanvas(
    canvas: HTMLCanvasElement,
    _container: HTMLElement,
    nextContext: CanvasRenderingContext2D,
  ) {
    bindCanvas(canvas, nextContext)
  }

  function setRenderer(nextRenderer: SmartMapRendererLike) {
    renderer = nextRenderer
  }

  function getCanvas() {
    return canvasEl
  }

  function getContext() {
    return context
  }

  function setCanvasCursor(cursor: string) {
    if (canvasEl) canvasEl.style.cursor = cursor
  }

  function createRenderImage(src: string) {
    const image = new Image()
    image.src = src
    image.onload = () => render()
    return image
  }

  function render() {
    renderer?.render(context, canvasEl)
  }

  return {
    bindCanvas,
    bindRuntimeCanvas,
    createRenderImage,
    getCanvas,
    getContext,
    render,
    setCanvasCursor,
    setRenderer,
  }
}
