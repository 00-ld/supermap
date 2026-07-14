export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
  ok: boolean
  timestamp?: number
  requestId?: string
  error?: string | null
}

export type AlgorithmResponse<T = unknown> = ApiResult<T | null>

export interface AlgorithmRuntimeMeta {
  costMs: number
  worker?: string
  device?: string
  imageSize?: number
  confidenceThreshold?: number
}

export interface AlgorithmIdentityMeta {
  name: string
  version: string
  configVersion: string
  modelId?: string
  modelVersion?: string
  modelPath?: string
  modelManifestStatus?: string
}

export interface AlgorithmInputSummary {
  payloadType: string
  payloadDigest?: string
  payloadKeys?: string[]
  sensorCount?: number | null
  candidateCount?: number | null
  sourceType?: string
  filename?: string
  contentType?: string
  sizeBytes?: number
  imageWidth?: number
  imageHeight?: number
  frameCount?: number
}

export interface AlgorithmFallbackMeta {
  used: boolean
  reason?: string | null
  strategy: string
}

export interface AlgorithmGrayReleaseMeta {
  channel?: string
  trafficPercent?: number
  enabled?: boolean
  rollbackTarget?: string
  bucket?: string
  rule?: string
  fallbackUsed?: boolean
}

export interface AlgorithmTraceFields {
  requestId?: string
  algorithm?: AlgorithmIdentityMeta
  runtime?: AlgorithmRuntimeMeta
  inputSummary?: AlgorithmInputSummary
  warnings?: string[]
  errors?: string[]
  error?: string | null
  algorithmVersion?: string
  configVersion?: string
  costMs?: number
  worker?: string
  grayRelease?: AlgorithmGrayReleaseMeta
  fallback?: AlgorithmFallbackMeta
}
