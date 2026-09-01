import type {
  YoloAnalysisData,
  YoloAlgorithmMeta,
  YoloDetection,
  YoloRuntimeMeta,
} from '@/api/analysis'

export interface SmartMapCarPosition {
  id: number
  x: number
  y: number
}

export interface SmartMapViewState {
  offsetX: number
  offsetY: number
  scale: number
}

export type YoloCaptureResult = YoloAnalysisData

export interface SmartMapYoloResult {
  carId: number
  count: number
  imageBase64?: string
  detections: YoloDetection[]
  frameIndex?: number
  sourceCarId?: number | null
  carIdSource?: string
  capturedAt?: string
  requestId?: string
  algorithm?: YoloAlgorithmMeta
  runtime?: YoloRuntimeMeta
  warnings?: string[]
  modelId?: string
  modelVersion?: string
  modelPath?: string
  timestamp: number
}

export async function captureCarSnapshot(
  canvasEl: HTMLCanvasElement,
  viewState: SmartMapViewState,
  car: SmartMapCarPosition,
  snapSize = 150,
): Promise<Blob | null> {
  const scale = viewState.scale
  const offsetX = viewState.offsetX * scale + canvasEl.width * 0.05
  const offsetY = viewState.offsetY * scale + canvasEl.height * 0.05
  const screenX = car.x * scale + offsetX
  const screenY = car.y * scale + offsetY
  const snapX = Math.max(0, Math.min(canvasEl.width - snapSize, screenX - snapSize / 2))
  const snapY = Math.max(0, Math.min(canvasEl.height - snapSize, screenY - snapSize / 2))

  const snapshot = document.createElement('canvas')
  snapshot.width = snapSize
  snapshot.height = snapSize
  const snapCtx = snapshot.getContext('2d')
  if (!snapCtx) {
    return null
  }
  snapCtx.drawImage(canvasEl, snapX, snapY, snapSize, snapSize, 0, 0, snapSize, snapSize)

  return new Promise((resolve) => {
    snapshot.toBlob((blob) => resolve(blob), 'image/png')
  })
}

export function buildYoloResult(carId: number, data: YoloCaptureResult): SmartMapYoloResult | null {
  if (data.status !== 'success' || typeof data.count !== 'number') {
    return null
  }
  return {
    carId,
    count: data.count,
    imageBase64: data.image_base64,
    detections: data.detections || [],
    frameIndex: data.frameIndex,
    sourceCarId: data.carId,
    carIdSource: data.carIdSource,
    capturedAt: data.capturedAt,
    requestId: data.requestId,
    algorithm: data.algorithm,
    runtime: data.runtime,
    warnings: data.warnings,
    modelId: data.modelId,
    modelVersion: data.modelVersion,
    modelPath: data.modelPath,
    timestamp: Date.now(),
  }
}

export function normalizeYoloImage(imageBase64: string) {
  if (!imageBase64) return ''
  if (String(imageBase64).startsWith('data:image/')) return imageBase64
  return `data:image/jpeg;base64,${imageBase64}`
}
