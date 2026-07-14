interface SmartMapFocusViewState {
  scale: number
  offsetX: number
  offsetY: number
}

interface SmartMapFocusCanvasSize {
  width: number
  height: number
}

interface SmartMapFocusPoint {
  x: number
  y: number
}

export function focusSmartMapSensorPoint(
  viewState: SmartMapFocusViewState,
  canvas: SmartMapFocusCanvasSize,
  sensor: SmartMapFocusPoint,
  targetScale = 2,
) {
  viewState.scale = targetScale
  viewState.offsetX = canvas.width / 2 / targetScale - sensor.x
  viewState.offsetY = canvas.height / 2 / targetScale - sensor.y
}
