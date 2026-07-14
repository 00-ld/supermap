import request from '@/utils/request'
import type {
  AlgorithmIdentityMeta,
  AlgorithmFallbackMeta,
  AlgorithmGrayReleaseMeta,
  AlgorithmInputSummary,
  AlgorithmRuntimeMeta,
  ApiResult,
} from '@/types/api'

export interface InspectRecord {
  id: number
  createTime: string
  location: string
  personCount: number
  status?: string
  imageBase64?: string
  analysisTime?: number
}

export interface YoloDetectionBbox {
  format: 'xyxy_pixel'
  x1: number
  y1: number
  x2: number
  y2: number
  width: number
  height: number
}

export interface YoloDetection {
  frameIndex: number
  bbox: YoloDetectionBbox
  confidence: number
  classId: number
  className: string
}

export type GrayReleaseMeta = AlgorithmGrayReleaseMeta

export type YoloRuntimeMeta = AlgorithmRuntimeMeta

export type YoloAlgorithmMeta = AlgorithmIdentityMeta & {
  modelId: string
  modelVersion: string
  modelPath: string
  modelManifestStatus: string
}

export type YoloInputSummary = AlgorithmInputSummary & {
  sourceType: string
  filename: string
  contentType: string
  sizeBytes: number
  imageWidth: number
  imageHeight: number
  frameCount: number
}

export interface YoloAnalysisData {
  requestId?: string
  status?: string
  count?: number
  image_base64?: string
  detectionSchemaVersion?: string
  detections?: YoloDetection[]
  frameIndex?: number
  carId?: number | null
  carIdSource?: string
  capturedAt?: string
  analysisTime?: number
  analysis_time?: number
  processing_time_ms?: number
  modelId?: string
  modelVersion?: string
  modelPath?: string
  algorithm?: YoloAlgorithmMeta
  runtime?: YoloRuntimeMeta
  grayRelease?: GrayReleaseMeta
  fallback?: AlgorithmFallbackMeta
  inputSummary?: YoloInputSummary
  warnings?: string[]
  error?: string | null
  analysis_info?: string
  message?: string
}

const multipartConfig = {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 90000,
}

export const reqAnalyzePersonImage = <T extends YoloAnalysisData = YoloAnalysisData>(data: FormData) =>
  request.post<FormData, ApiResult<T>>('/analysis/person', data, multipartConfig)

export const reqInspectRecordList = () =>
  request.get<null, ApiResult<InspectRecord[]>>('/analysis/list')

export const reqDeleteInspectRecord = (id: number) =>
  request.delete<null, ApiResult<string>>(`/analysis/delete/${id}`)
