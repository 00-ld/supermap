import type { Ref } from 'vue'
import type { SmartMapViewportPoint, SmartMapViewportState } from './useSmartMapViewport'

export interface SmartMapCanvasFacilityLike {
  zone: string
}

export interface SmartMapCanvasIdentifiedLike {
  id: string | number
}

export interface SmartMapCanvasCandidateLike {
  candidateId: string
}

export interface SmartMapCanvasInteractionOptions<
  TFacility extends SmartMapCanvasFacilityLike,
  TEntrance extends SmartMapCanvasIdentifiedLike,
  TSensor extends SmartMapCanvasIdentifiedLike,
  TCandidate extends SmartMapCanvasCandidateLike,
  TCar extends SmartMapCanvasIdentifiedLike,
> {
  getCanvas: () => HTMLCanvasElement | null | undefined
  viewState: SmartMapViewportState
  isDragging: Ref<boolean>
  measureMode: Ref<boolean>
  screenToWorld: (sx: number, sy: number) => SmartMapViewportPoint
  updateCoordDisplay: (x: number, y: number) => void
  addMeasurePoint: (point: SmartMapViewportPoint) => void
  measureCursor: () => string
  render: () => void
  applyWheelZoom: (deltaY: number) => void
  leakSourcePicking: () => boolean
  sensorPicking: () => boolean
  sensorOriginPicking: () => boolean
  applyLeakSourcePoint: (point: SmartMapViewportPoint) => void
  captureManualSensorPoint: (point: SmartMapViewportPoint) => void
  captureOriginPoint: (point: SmartMapViewportPoint) => void
  entranceHitTest: (x: number, y: number) => TEntrance | null
  sensorHitTest: (x: number, y: number) => TSensor | null
  candidateRegionHitTest: (x: number, y: number) => TCandidate | null
  carHitTest: (x: number, y: number) => TCar | null
  facilityHitTest: (x: number, y: number) => TFacility | null
  hoveredEntrance: Ref<TEntrance | null>
  hoveredSensor: Ref<TSensor | null>
  hoveredCar: Ref<TCar | null>
  hoveredFacility: Ref<TFacility | null>
  selectedSensor: Ref<TSensor | null>
  selectedCar: Ref<TCar | null>
  selectedFacility: Ref<TFacility | null>
  selectSensor: (sensor: TSensor) => void
  selectCandidate: (candidate: TCandidate) => void
  selectCar: (car: TCar) => void
  selectFacility: (facility: TFacility) => void
  clearSelection: () => void
}

export function useSmartMapCanvasInteraction<
  TFacility extends SmartMapCanvasFacilityLike,
  TEntrance extends SmartMapCanvasIdentifiedLike,
  TSensor extends SmartMapCanvasIdentifiedLike,
  TCandidate extends SmartMapCanvasCandidateLike,
  TCar extends SmartMapCanvasIdentifiedLike,
>(
  options: SmartMapCanvasInteractionOptions<TFacility, TEntrance, TSensor, TCandidate, TCar>,
) {
  function getCanvas() {
    return options.getCanvas()
  }

  function pointFromEvent(event: MouseEvent) {
    const canvas = getCanvas()
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    return options.screenToWorld(event.clientX - rect.left, event.clientY - rect.top)
  }

  function resetDrag() {
    options.viewState.dragging = false
    options.isDragging.value = false
  }

  function onCanvasMouseDown(event: MouseEvent) {
    const canvas = getCanvas()
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (options.measureMode.value) {
      const point = options.screenToWorld(event.clientX - rect.left, event.clientY - rect.top)
      options.addMeasurePoint({ x: point.x, y: point.y })
      options.render()
      return
    }
    options.viewState.dragging = true
    options.viewState.lastX = event.clientX
    options.viewState.lastY = event.clientY
    options.isDragging.value = true
  }

  function onCanvasMouseMove(event: MouseEvent) {
    const canvas = getCanvas()
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = event.clientX - rect.left
    const sy = event.clientY - rect.top
    const point = options.screenToWorld(sx, sy)
    options.updateCoordDisplay(point.x, point.y)

    if (options.viewState.dragging) {
      const dx = event.clientX - options.viewState.lastX
      const dy = event.clientY - options.viewState.lastY
      options.viewState.offsetX += dx / options.viewState.scale
      options.viewState.offsetY += dy / options.viewState.scale
      options.viewState.lastX = event.clientX
      options.viewState.lastY = event.clientY
      options.render()
      return
    }

    if (options.leakSourcePicking() || options.sensorPicking() || options.sensorOriginPicking()) {
      canvas.style.cursor = 'crosshair'
      return
    }

    const entranceHit = options.entranceHitTest(point.x, point.y)
    const sensorHit = entranceHit ? null : options.sensorHitTest(point.x, point.y)
    const candidateHit = entranceHit || sensorHit ? null : options.candidateRegionHitTest(point.x, point.y)
    const carHit = (!entranceHit && !sensorHit && !candidateHit) ? options.carHitTest(point.x, point.y) : null
    const facilityHit = (!entranceHit && !sensorHit && !candidateHit && !carHit) ? options.facilityHitTest(point.x, point.y) : null

    if (
      entranceHit?.id !== options.hoveredEntrance.value?.id ||
      facilityHit !== options.hoveredFacility.value ||
      sensorHit?.id !== options.hoveredSensor.value?.id ||
      carHit?.id !== options.hoveredCar.value?.id
    ) {
      options.hoveredEntrance.value = entranceHit
      options.hoveredSensor.value = sensorHit
      options.hoveredCar.value = carHit
      options.hoveredFacility.value = facilityHit
      canvas.style.cursor = entranceHit || sensorHit || candidateHit || carHit || facilityHit ? 'pointer' : options.measureCursor()
      options.render()
    }
  }

  function handleCanvasClick(event: MouseEvent) {
    const point = pointFromEvent(event)
    if (!point) return

    if (options.leakSourcePicking()) {
      options.applyLeakSourcePoint(point)
      resetDrag()
      return
    }
    if (options.sensorPicking()) {
      options.captureManualSensorPoint(point)
      resetDrag()
      return
    }
    if (options.sensorOriginPicking()) {
      options.captureOriginPoint(point)
      resetDrag()
      return
    }

    const entranceHit = options.entranceHitTest(point.x, point.y)
    const sensorHit = options.sensorHitTest(point.x, point.y)
    const candidateHit = sensorHit ? null : options.candidateRegionHitTest(point.x, point.y)
    const carHit = (!sensorHit && !candidateHit) ? options.carHitTest(point.x, point.y) : null
    const facilityHit = (!sensorHit && !candidateHit && !carHit) ? options.facilityHitTest(point.x, point.y) : null

    if (entranceHit) {
      options.hoveredEntrance.value = entranceHit
    } else if (sensorHit) {
      options.selectSensor(sensorHit)
    } else if (candidateHit) {
      options.selectCandidate(candidateHit)
    } else if (carHit) {
      options.selectCar(carHit)
    } else if (facilityHit) {
      options.selectFacility(facilityHit)
    } else {
      options.clearSelection()
    }
    options.render()
  }

  function onCanvasMouseUp(event: MouseEvent) {
    if (!options.viewState.dragging) return
    const dx = Math.abs(event.clientX - options.viewState.lastX)
    const dy = Math.abs(event.clientY - options.viewState.lastY)
    if (dx < 5 && dy < 5 && !options.measureMode.value) {
      handleCanvasClick(event)
    }
    resetDrag()
  }

  function onCanvasMouseLeave() {
    const canvas = getCanvas()
    options.viewState.dragging = false
    options.hoveredFacility.value = null
    options.hoveredEntrance.value = null
    options.hoveredSensor.value = null
    options.isDragging.value = false
    if (canvas && !options.leakSourcePicking() && !options.sensorPicking()) {
      canvas.style.cursor = options.measureCursor()
    }
    options.render()
  }

  function onCanvasWheel(event: WheelEvent) {
    options.applyWheelZoom(event.deltaY)
    options.render()
  }

  return {
    onCanvasMouseDown,
    onCanvasMouseMove,
    onCanvasMouseUp,
    onCanvasMouseLeave,
    onCanvasWheel,
  }
}
