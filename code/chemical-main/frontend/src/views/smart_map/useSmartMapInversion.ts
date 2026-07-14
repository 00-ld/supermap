import type {
  SmartMapEstimatedSource,
  SmartMapSourceCandidateRegion,
  SmartMapSourceRefinementIteration,
} from './useSmartMapSourceInversionOverlay'

export type SmartMapRecord = Record<string, unknown>
export const SMART_MAP_FORMAL_VALIDATION_POLICY = 'requires_trusted_sensor_reading'

export interface SmartMapPoint {
  x: number
  y: number
}

export interface SmartMapSeriesPoint extends SmartMapRecord {
  frameIndex?: number | null
  timeSec?: number | null
  concentration?: number | null
}

export interface SmartMapBoundary {
  x: number
  y: number
  w: number
  h: number
}

export interface SmartMapObservationSourceSummary extends SmartMapRecord {
  byKind: Record<string, number>
  auditedSensorReadingCount: number
  simulatedSensorReadingCount: number
  manualEntryCount: number
  simulatedCount: number
  hasAuditedSensorReadings: boolean
  evidenceLevel: string
  formalValidationAllowed: boolean
}

export interface SmartMapObservationPayload extends SmartMapRecord {
  gas: unknown
  sourceFacility: unknown
  scenario: SmartMapRecord
  sensors: SmartMapRecord[]
  frames: SmartMapRecord[]
  currentFrameIndex: number
  timeline: SmartMapRecord
  inversionConfig: SmartMapRecord
  observationSourceSummary: SmartMapObservationSourceSummary
  warnings: string[]
  sensorCount: number
  frameCount: number
  sourceFacilityName: string | unknown
}

export interface SmartMapObservationSummary extends SmartMapRecord {
  sensorCount: number
  activeSensors: number
  frameCount: number
  totalSeriesPoints: number
  totalDurationSec: number
  sourceLabel: unknown
  observationSourceSummary: SmartMapRecord
  sourceBreakdownText: string
  evidenceLevel: unknown
  evidenceLabel: string
  formalValidationAllowed: boolean
  sourceByKind: SmartMapRecord
}

export interface SmartMapCoarseSearchResult extends SmartMapRecord {
  candidateRegions?: SmartMapSourceCandidateRegion[]
}

export interface SmartMapCoarseSummary extends SmartMapRecord {
  candidateCount: number
  topCandidate: unknown
  bestLabel: string
  bestCoord: string
  label: string
}

export interface SmartMapInversionEstimatedSource extends SmartMapEstimatedSource {
  confidenceRadius?: number
  credibleRadius95m?: number
  emissionRate?: number
  sourceMatchError?: number
}

export interface SmartMapSourceInversionResult extends SmartMapRecord {
  stage?: string
  candidateRegions?: SmartMapSourceCandidateRegion[]
  coarseCandidates?: SmartMapSourceCandidateRegion[]
  iterations?: SmartMapSourceRefinementIteration[]
  history?: SmartMapRecord[]
  lossHistory?: unknown[]
  estimatedSource?: SmartMapInversionEstimatedSource
  summary?: SmartMapRecord & { bestCandidateId?: string }
  diagnostics?: SmartMapRecord
  errorMetrics?: SmartMapRecord & {
    sourceLocationErrorM?: number
  }
  executor?: SmartMapRecord & {
    mode?: string
  }
}

export interface SmartMapRefinementInput extends SmartMapRecord {
  coarseCandidate?: SmartMapSourceCandidateRegion | null
  activeSensors?: SmartMapRecord[]
  refinementConfig?: SmartMapRecord & {
    animationSteps?: number
  }
  candidateId?: string
  center?: SmartMapPoint
  bounds?: SmartMapSourceCandidateRegion['bounds']
  sensors?: SmartMapRecord[]
  sensorCount?: number
  currentFrameIndex?: number
}

export interface SmartMapParticleFilterPayload extends SmartMapRecord {
  observationPayload: SmartMapObservationPayload
  gas: unknown
  activeSensors: SmartMapRecord[]
  observations: SmartMapRecord[]
  coarseCandidate: SmartMapSourceCandidateRegion | null
  trueSourceMapPoint: unknown
  trueEmissionRate: unknown
  particleFilterConfig: SmartMapRecord
}

interface ObservationSensorOptions {
  frameIndex: number
  signalMode: unknown
  minSignal?: number
}

interface ObservationPayloadOptions {
  gas: unknown
  sourceFacility: unknown
  sourcePoint: unknown
  diffusionForm: SmartMapRecord
  scenarioMeta: SmartMapRecord
  observationSignalMode: unknown
  sensors: SmartMapRecord[]
  frames: SmartMapRecord[]
  currentFrameIndex: number
  currentTimeSec: number
  inversionConfig: SmartMapRecord
}

interface ParticleBoundsOptions {
  candidateRegions: SmartMapRecord[]
  topK: unknown
  supportRadius: unknown
  sourceRate: unknown
  dataBoundary: SmartMapBoundary
}

interface ParticlePayloadOptions {
  gas: unknown
  activeSensors: SmartMapRecord[]
  coarseCandidate: SmartMapSourceCandidateRegion | null
  sourcePoint: unknown
  sourceRate: unknown
  sourceInversionConfig: SmartMapRecord
  particleFilterConfig: SmartMapRecord
  bounds: unknown
}

function asRecord(value: unknown): SmartMapRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as SmartMapRecord : {}
}

function asArray(value: unknown): SmartMapRecord[] {
  return Array.isArray(value) ? value as SmartMapRecord[] : []
}

function toNumber(value: unknown, fallback = 0): number {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

function toMapPoint(value: unknown): SmartMapPoint | null {
  const record = asRecord(value)
  const x = toNumber(record.x, Number.NaN)
  const y = toNumber(record.y, Number.NaN)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function classifyObservationSource(sensor: SmartMapRecord): SmartMapRecord {
  const existingSource = asRecord(sensor.observationSource)
  if (existingSource.kind) return existingSource
  const sourceType = String(sensor.sourceType || sensor.readingSource || '').toLowerCase()
  const qualityStatus = String(sensor.qualityStatus || existingSource.qualityStatus || '').toUpperCase()
  const readingSource = String(sensor.source || sensor.readingSource || existingSource.source || '').toLowerCase()
  const simulatedSensorReading = readingSource === 'simulation' || qualityStatus === 'SIMULATED'
  const declaresBackendReading = sourceType === 'sensor_reading' || sourceType === 'real_backend' || sourceType === 'real'
  if (declaresBackendReading && simulatedSensorReading) {
    return {
      kind: 'sensor_reading_simulated',
      label: '后端 sensor_reading 仿真采样',
      trustedForRealValidation: false,
      simulated: true,
      manual: false,
      basis: 'backend_sensor_reading_table',
      source: readingSource || null,
      qualityStatus: qualityStatus || null,
    }
  }
  if (declaresBackendReading) {
    return {
      kind: 'sensor_reading',
      label: '后端非仿真读数（需来源审计）',
      trustedForRealValidation: false,
      simulated: false,
      manual: false,
      basis: 'backend_sensor_reading_table_requires_source_audit',
    }
  }
  if (sensor.carId || String(sensor.id || '').startsWith('CAR-')) {
    return {
      kind: 'mobile_diffusion_sample',
      label: '巡检车移动采样',
      trustedForRealValidation: false,
      simulated: true,
      manual: false,
      basis: 'diffusion_frame_at_vehicle_position',
    }
  }
  if (String(sensor.mode || '').toLowerCase() === 'manual') {
    return {
      kind: 'manual_entry',
      label: '人工录入读数',
      trustedForRealValidation: false,
      simulated: false,
      manual: true,
      basis: 'operator_input',
    }
  }
  return {
    kind: 'diffusion_frame_sample',
    label: '扩散帧仿真采样',
    trustedForRealValidation: false,
    simulated: true,
    manual: false,
    basis: 'simulated_diffusion_frame',
  }
}

function buildObservationSourceSummary(sensors: SmartMapRecord[]): SmartMapRecord {
  const byKind = sensors.reduce<Record<string, number>>((summary, sensor) => {
    const source = asRecord(sensor.observationSource)
    const kind = String(source.kind || 'unknown')
    summary[kind] = (summary[kind] || 0) + 1
    return summary
  }, {})
  const auditedSensorReadingCount = byKind.sensor_reading || 0
  const simulatedSensorReadingCount = byKind.sensor_reading_simulated || 0
  const manualEntryCount = byKind.manual_entry || 0
  const simulatedCount = sensors.filter(sensor => {
    const source = asRecord(sensor.observationSource)
    return source.simulated === true && source.kind !== 'sensor_reading_simulated'
  }).length
  const hasAuditedSensorReadings = auditedSensorReadingCount > 0
  return {
    byKind,
    auditedSensorReadingCount,
    simulatedSensorReadingCount,
    manualEntryCount,
    simulatedCount,
    hasAuditedSensorReadings,
    evidenceLevel: hasAuditedSensorReadings ? 'contains_non_simulated_sensor_reading_needs_audit' : 'simulation_or_manual_only',
    formalValidationAllowed: false,
  }
}

export function normalizeSeriesConcentration(value: unknown): number {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return 0
  return Number(Math.max(0, numericValue).toFixed(2))
}

interface SmartMapFrameLike {
  frameIndex?: unknown
  timeSec?: unknown
}

export function buildFrameSeriesTemplate(frames: SmartMapFrameLike[] = []): SmartMapSeriesPoint[] {
  return (frames || []).map(frame => ({
    frameIndex: toNumber(frame.frameIndex, 0),
    timeSec: toNumber(frame.timeSec, 0),
    concentration: 0,
  }))
}

export function normalizeManualSeries(
  manualSeries: SmartMapRecord[] = [],
  frames: SmartMapFrameLike[] = [],
): SmartMapSeriesPoint[] {
  const template = buildFrameSeriesTemplate(frames)
  if (!template.length) return []
  const valueByFrame = new Map(
    (manualSeries || [])
      .filter(item => Number.isFinite(Number(item.frameIndex)))
      .map(item => [Number(item.frameIndex), normalizeSeriesConcentration(item.concentration)]),
  )
  return template.map(item => {
    const frameIndex = Number(item.frameIndex)
    return {
      frameIndex,
      timeSec: item.timeSec,
      concentration: valueByFrame.has(frameIndex) ? valueByFrame.get(frameIndex) : 0,
    }
  })
}

export function getSeriesConcentrationAt(
  sampledSeries: SmartMapRecord[] = [],
  frameIndex = 0,
): number {
  if (!sampledSeries.length) return 0
  const matched = sampledSeries.find(item => Number(item.frameIndex) === Number(frameIndex))
  const fallback = sampledSeries[Math.min(Math.max(frameIndex, 0), sampledSeries.length - 1)]
    || sampledSeries[sampledSeries.length - 1]
  return normalizeSeriesConcentration(asRecord(matched || fallback).concentration || 0)
}

export function getSeriesPeak(sampledSeries: SmartMapRecord[] = []): number {
  if (!sampledSeries.length) return 0
  return normalizeSeriesConcentration(
    sampledSeries.reduce((peak, item) => Math.max(peak, Number(item.concentration || 0)), 0),
  )
}

export function getSeriesArrival(sampledSeries: SmartMapRecord[] = [], peak = getSeriesPeak(sampledSeries)) {
  if (!sampledSeries.length || peak <= 0) return { arrivalFrame: null, arrivalTimeSec: null }
  const threshold = Math.max(peak * 0.01, 0.001)
  const arrived = sampledSeries.find(item => Number(item.concentration || 0) >= threshold)
  return {
    arrivalFrame: arrived?.frameIndex ?? null,
    arrivalTimeSec: arrived?.timeSec ?? null,
  }
}

export function buildInversionSignalStats(sensor: SmartMapRecord, options: ObservationSensorOptions) {
  const sampledSeries = asArray(sensor.sampledSeries)
  const current = getSeriesConcentrationAt(sampledSeries, options.frameIndex)
  const peak = normalizeSeriesConcentration(sensor.sampledPeak || getSeriesPeak(sampledSeries) || current)
  const mode = String(options.signalMode || 'peak')
  let signal = peak
  if (mode === 'current') {
    signal = current
  } else if (mode === 'weighted_peak') {
    signal = normalizeSeriesConcentration(Math.max(current, peak * 0.85))
  }
  return {
    current,
    peak,
    signal,
    mode,
    ...getSeriesArrival(sampledSeries, peak),
  }
}

export function collectObservationReadySensors(
  sensors: SmartMapRecord[],
  mobileSensorReadings: SmartMapRecord[],
): SmartMapRecord[] {
  if (mobileSensorReadings.length) {
    return [...sensors, ...mobileSensorReadings]
  }
  return sensors
}

export function buildObservationSensorsWithSignals(
  readySensors: SmartMapRecord[],
  options: ObservationSensorOptions,
): SmartMapRecord[] {
  const minSignal = options.minSignal ?? 0
  return readySensors
    .map(sensor => {
      const point = toMapPoint(sensor.mapPoint) || {
        x: toNumber(sensor.x, Number.NaN),
        y: toNumber(sensor.y, Number.NaN),
      }
      const stats = buildInversionSignalStats(sensor, options)
      return {
        ...sensor,
        x: point.x,
        y: point.y,
        mapPoint: { x: point.x, y: point.y },
        observationSource: classifyObservationSource(sensor),
        signal: Number(stats.signal.toFixed(4)),
        signalMode: stats.mode,
        currentConcentration: Number(stats.current.toFixed(4)),
        sampledPeak: Number(stats.peak.toFixed(4)),
        arrivalFrame: stats.arrivalFrame,
        arrivalTimeSec: stats.arrivalTimeSec,
      }
    })
    .filter(sensor => (
      Number.isFinite(sensor.x)
      && Number.isFinite(sensor.y)
      && Number.isFinite(sensor.signal)
      && Number(sensor.signal) >= minSignal
    ))
}

export function createObservationPayload(options: ObservationPayloadOptions): SmartMapObservationPayload {
  const sourceFacility = asRecord(options.sourceFacility)
  const observationSourceSummary = buildObservationSourceSummary(options.sensors)
  const sourceWarnings = observationSourceSummary.hasAuditedSensorReadings
    ? ['当前观测 payload 含后端非仿真读数，但仓库未接入真实硬件链路，需来源审计后才能作为实测证据']
    : ['当前观测 payload 仅包含仿真/手工读数，不能作为真实传感器实测验证证据']
  return {
    gas: options.gas,
    sourceFacility: options.sourceFacility,
    scenario: {
      ...options.diffusionForm,
      ...options.scenarioMeta,
      sourceMapPoint: options.sourcePoint,
      observationSignalMode: options.observationSignalMode,
    },
    sensors: options.sensors,
    frames: options.frames,
    currentFrameIndex: options.currentFrameIndex,
    timeline: {
      currentFrameIndex: options.currentFrameIndex,
      currentTimeSec: options.currentTimeSec,
      observationSignalMode: options.observationSignalMode,
    },
    inversionConfig: { ...options.inversionConfig },
    observationSourceSummary: observationSourceSummary as SmartMapObservationSourceSummary,
    warnings: sourceWarnings,
    sensorCount: options.sensors.length,
    frameCount: options.frames.length,
    sourceFacilityName: sourceFacility.name || '手动点位',
  }
}

export function buildCirclePolygon(center: SmartMapPoint, radius: number, sides = 18): SmartMapPoint[] {
  return Array.from({ length: sides }, (_, index) => {
    const angle = (Math.PI * 2 * index) / sides
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    }
  })
}

export function buildParticleFilterHistoryIterations(
  result: SmartMapRecord | null | undefined,
  selectedCandidate: SmartMapRecord | null | undefined,
  candidateRadius: unknown,
): SmartMapSourceRefinementIteration[] {
  const resultRecord = asRecord(result)
  const history = asArray(resultRecord.history)
  const startRadius = toNumber(asRecord(selectedCandidate).radius, toNumber(candidateRadius, 45))
  return history.map((item, index) => {
    const ratio = history.length > 1 ? index / (history.length - 1) : 1
    const radius = Math.max(10, startRadius * (1 - ratio * 0.72))
    const center = { x: toNumber(item.x), y: toNumber(item.y) }
    return {
      iteration: toNumber(item.iteration, index + 1),
      center,
      radius,
      polygon: buildCirclePolygon(center, radius),
      loss: toNumber(item.rmse, toNumber(asRecord(resultRecord.diagnostics).finalRmsePpm)),
    }
  })
}

export function buildObservationSummary(
  payload: SmartMapRecord | null | undefined,
  readySensors: SmartMapRecord[],
): SmartMapObservationSummary {
  const payloadRecord = asRecord(payload)
  const frames = asArray(payloadRecord.frames)
  const lastFrame = frames[frames.length - 1] || null
  const totalDurationSec = toNumber(asRecord(lastFrame).timeSec ?? asRecord(lastFrame).timeElapsed, 0)
  const sourceSummary = asRecord(payloadRecord.observationSourceSummary)
  const sourceByKind = asRecord(sourceSummary.byKind)
  const auditedSensorReadingCount = toNumber(sourceSummary.auditedSensorReadingCount)
  const simulatedSensorReadingCount = toNumber(sourceSummary.simulatedSensorReadingCount)
  const manualEntryCount = toNumber(sourceSummary.manualEntryCount)
  const simulatedCount = toNumber(sourceSummary.simulatedCount)
  const sourceParts = [
    auditedSensorReadingCount ? `待审计读数${auditedSensorReadingCount}` : '',
    simulatedSensorReadingCount ? `后端仿真${simulatedSensorReadingCount}` : '',
    simulatedCount ? `仿真${simulatedCount}` : '',
    manualEntryCount ? `手工${manualEntryCount}` : '',
  ].filter(Boolean)
  const formalValidationAllowed = sourceSummary.formalValidationAllowed === true
  return {
    sensorCount: asArray(payloadRecord.sensors).length,
    activeSensors: readySensors.length,
    frameCount: frames.length,
    totalSeriesPoints: readySensors.reduce((sum, sensor) => sum + (asArray(sensor.sampledSeries).length || frames.length || 1), 0),
    totalDurationSec: Number.isFinite(totalDurationSec) ? Math.round(totalDurationSec) : 0,
    sourceLabel: payloadRecord.sourceFacilityName || '',
    observationSourceSummary: sourceSummary,
    sourceBreakdownText: sourceParts.length ? sourceParts.join(' / ') : '未标注',
    evidenceLevel: sourceSummary.evidenceLevel || 'unknown',
    evidenceLabel: formalValidationAllowed ? '来源已审计，可作正式验证' : '仿真/手工/待审计，不可作真实验证',
    formalValidationAllowed,
    sourceByKind,
  }
}

export function buildCoarseSummary(result: SmartMapRecord | null | undefined): SmartMapCoarseSummary | null {
  const resultRecord = asRecord(result)
  const candidateRegions = asArray(resultRecord.candidateRegions)
  const best = candidateRegions[0] || null
  if (!result || !Object.keys(resultRecord).length) return null
  const bestCenter = asRecord(best?.center)
  return {
    candidateCount: candidateRegions.length,
    topCandidate: best?.candidateId || '',
    bestLabel: best ? `${best.label || best.candidateId || '候选区'} C${best.rank || 1}` : '--',
    bestCoord: best ? `${toNumber(bestCenter.x).toFixed(0)}, ${toNumber(bestCenter.y).toFixed(0)}` : '--',
    label: `${candidateRegions.length} 个候选区域`,
  }
}

export function buildParticleFilterBounds(
  candidate: SmartMapRecord | null | undefined,
  options: ParticleBoundsOptions,
) {
  const candidateRecord = asRecord(candidate)
  const candidateCenter = toMapPoint(candidateRecord.center)
  const regions = (options.candidateRegions.length ? options.candidateRegions : (candidateCenter ? [candidateRecord] : []))
    .filter(item => toMapPoint(item.center))
    .slice(0, Math.max(1, toNumber(options.topK, 4)))
  if (!regions.length) return undefined
  const radius = Math.max(
    ...regions.map(item => toNumber(item.radius)),
    toNumber(options.supportRadius, 260),
  )
  const centers = regions.map(item => toMapPoint(item.center)).filter((point): point is SmartMapPoint => Boolean(point))
  const minX = Math.min(...centers.map(point => point.x - radius))
  const maxX = Math.max(...centers.map(point => point.x + radius))
  const minY = Math.min(...centers.map(point => point.y - radius))
  const maxY = Math.max(...centers.map(point => point.y + radius))
  return {
    x: {
      min: Math.max(0, minX),
      max: Math.min(options.dataBoundary.x + options.dataBoundary.w, maxX),
    },
    y: {
      min: Math.max(0, minY),
      max: Math.min(options.dataBoundary.y + options.dataBoundary.h, maxY),
    },
    q: [
      Math.max(0.001, toNumber(options.sourceRate, 1) * 0.05),
      Math.max(10, toNumber(options.sourceRate, 1) * 20),
    ],
  }
}

export function createParticleFilterPayload(
  exportPayload: SmartMapObservationPayload,
  options: ParticlePayloadOptions,
): SmartMapParticleFilterPayload {
  return {
    observationPayload: exportPayload,
    scenario: {
      ...asRecord(exportPayload.scenario),
      sourceMapPoint: options.sourcePoint,
      emissionRate: options.sourceRate,
    },
    gas: options.gas,
    activeSensors: options.activeSensors,
    observations: options.activeSensors,
    coarseCandidate: options.coarseCandidate,
    trueSourceMapPoint: options.sourcePoint,
    trueEmissionRate: options.sourceRate,
    config: {
      minSignalThreshold: options.particleFilterConfig.minSignalThreshold,
      observationSignalMode: options.sourceInversionConfig.observationSignalMode,
    },
    particleFilterConfig: {
      numParticles: options.particleFilterConfig.numParticles,
      iterations: options.particleFilterConfig.iterations,
      sensorNoiseRelative: options.particleFilterConfig.sensorNoiseRelative,
      modelNoiseRelative: options.particleFilterConfig.modelNoiseRelative,
      resampleThreshold: options.particleFilterConfig.resampleThreshold,
      mcmcSteps: options.particleFilterConfig.mcmcSteps,
      seed: options.particleFilterConfig.seed,
      bounds: options.bounds,
    },
  }
}
