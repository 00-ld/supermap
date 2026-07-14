import type { Ref } from 'vue'
import type {
  SmartMapCoarseSearchResult,
  SmartMapObservationPayload,
  SmartMapParticleFilterPayload,
  SmartMapRecord,
} from './useSmartMapInversion'
import {
  buildObservationSensorsWithSignals,
  buildObservationSummary as buildSmartMapObservationSummary,
  buildParticleFilterBounds as buildSmartMapParticleFilterBounds,
  collectObservationReadySensors,
  createObservationPayload as createSmartMapObservationPayload,
  createParticleFilterPayload as createSmartMapParticleFilterPayload,
} from './useSmartMapInversion'
import type { SmartMapSourceCandidateRegion } from './useSmartMapSourceInversionOverlay'

interface SmartMapObservationFrameLike extends SmartMapRecord {
  timeSec?: number
}

interface SmartMapObservationDiffusionState {
  currentFrame: number
}

interface SmartMapObservationDiffusionForm extends SmartMapRecord {
  sourceRate: number
}

interface SmartMapObservationSourceConfig extends SmartMapRecord {
  observationSignalMode: unknown
  candidateRadius: unknown
  topK: unknown
  supportRadius: unknown
}

interface SmartMapObservationParticleConfig extends SmartMapRecord {
  minSignalThreshold?: unknown
}

interface SmartMapObservationDiffusionMeta {
  sourceFacility?: unknown
  sourcePoint?: unknown
  scenarioMeta?: unknown
  map?: SmartMapRecord | null
}

interface SmartMapObservationBoundary {
  x: number
  y: number
  w: number
  h: number
}

interface SmartMapObservationReadingLoadState {
  error: string
}

function toPayloadRecord<T extends object>(value: T | null | undefined): SmartMapRecord | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  const record: SmartMapRecord = {}
  Object.entries(value).forEach(([key, entryValue]) => {
    record[key] = entryValue
  })
  return record
}

function toMapPoint(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const record = value as SmartMapRecord
  const x = Number(record.x)
  const y = Number(record.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function getPointDistance(left: { x: number; y: number }, right: { x: number; y: number }) {
  return Math.hypot(left.x - right.x, left.y - right.y)
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface SmartMapObservationBuildersOptions<TSensor, TMobileSensor, TFrame extends SmartMapObservationFrameLike> {
  sensors: Ref<TSensor[]>
  mobileSensorReadings: Ref<TMobileSensor[]>
  diffusionFrames: Ref<TFrame[]>
  currentDiffusionFrame: Ref<TFrame | null>
  diffusionState: SmartMapObservationDiffusionState
  diffusionForm: SmartMapObservationDiffusionForm
  diffusionMeta: Ref<SmartMapObservationDiffusionMeta>
  sourceInversionConfig: SmartMapObservationSourceConfig
  particleFilterConfig: SmartMapObservationParticleConfig
  currentDiffusionGas: Ref<unknown>
  selectedDiffusionSource: Ref<unknown>
  selectedCoarseCandidate: Ref<SmartMapSourceCandidateRegion | null>
  coarseCandidateRegions: Ref<SmartMapSourceCandidateRegion[]>
  coarseSearchResult: Ref<SmartMapCoarseSearchResult | null>
  sensorReadingLoadState: SmartMapObservationReadingLoadState
  dataBoundary: SmartMapObservationBoundary
  getCurrentLeakSourcePoint: () => unknown
  loadSensorReadings: () => Promise<unknown[]>
  buildActiveSensorSeries: (sensorList: Array<TSensor | SmartMapRecord>, frames: TFrame[]) => TSensor[]
  render: () => void
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void
}

export function useSmartMapObservationBuilders<
  TSensor extends SmartMapRecord,
  TMobileSensor extends SmartMapRecord,
  TFrame extends SmartMapObservationFrameLike,
>(options: SmartMapObservationBuildersOptions<TSensor, TMobileSensor, TFrame>) {
  function getObservationReadySensors() {
    return collectObservationReadySensors(
      options.sensors.value as SmartMapRecord[],
      options.mobileSensorReadings.value as SmartMapRecord[],
    )
  }

  function getObservationSensorsWithSignals(minSignal = 0) {
    return buildObservationSensorsWithSignals(getObservationReadySensors(), {
      frameIndex: options.diffusionState.currentFrame,
      signalMode: options.sourceInversionConfig.observationSignalMode,
      minSignal,
    })
  }

  function createObservationPayload() {
    if (!options.diffusionFrames.value.length) {
      options.showToast('请先生成扩散动画后再整理观测输入', 'warn')
      return null
    }
    if (!options.sensors.value.length && !options.mobileSensorReadings.value.length) {
      options.showToast('当前没有可导出的传感器数据', 'warn')
      return null
    }
    const sourceFacility = options.diffusionMeta.value.sourceFacility || options.selectedDiffusionSource.value
    const observationSensors = getObservationSensorsWithSignals(0)
    return createSmartMapObservationPayload({
      gas: options.currentDiffusionGas.value,
      sourceFacility,
      sourcePoint: options.diffusionMeta.value.sourcePoint || options.getCurrentLeakSourcePoint(),
      diffusionForm: options.diffusionForm,
      scenarioMeta: (options.diffusionMeta.value.scenarioMeta || {}) as SmartMapRecord,
      sensors: observationSensors,
      frames: options.diffusionFrames.value as SmartMapRecord[],
      currentFrameIndex: options.diffusionState.currentFrame,
      currentTimeSec: options.currentDiffusionFrame.value?.timeSec || 0,
      observationSignalMode: options.sourceInversionConfig.observationSignalMode,
      inversionConfig: options.sourceInversionConfig,
    })
  }

  function getInversionObservationSensors(minSignal = Number(options.particleFilterConfig.minSignalThreshold || 0)) {
    return getObservationSensorsWithSignals(minSignal)
  }

  function getStrongestObservationSensors(limit = 8) {
    return getObservationSensorsWithSignals(0)
      .filter(sensor => Number.isFinite(Number(sensor.signal)) && Number(sensor.signal) > 0)
      .sort((left, right) => Number(right.signal || 0) - Number(left.signal || 0))
      .slice(0, limit)
  }

  function buildObservationSummary(payload: SmartMapObservationPayload | null | undefined) {
    return buildSmartMapObservationSummary(
      payload as SmartMapRecord | null | undefined,
      getInversionObservationSensors(),
    )
  }

  async function refreshSensorReadingsForObservation() {
    await options.loadSensorReadings()
    if (options.diffusionFrames.value.length) {
      options.sensors.value = options.buildActiveSensorSeries(
        options.sensors.value,
        options.diffusionFrames.value,
      )
      options.render()
    }
    if (options.sensorReadingLoadState.error) {
      console.warn(options.sensorReadingLoadState.error)
    }
  }

  function buildParticleFilterBounds(candidate: SmartMapSourceCandidateRegion | null | undefined) {
    return buildSmartMapParticleFilterBounds(toPayloadRecord(candidate), {
      candidateRegions: (options.coarseSearchResult.value?.candidateRegions || []).map(region => ({ ...region })),
      topK: options.sourceInversionConfig.topK,
      supportRadius: options.sourceInversionConfig.supportRadius,
      sourceRate: options.diffusionForm.sourceRate,
      dataBoundary: options.dataBoundary,
    })
  }

  function buildDirectCandidateBounds(center: { x: number; y: number }, radius: number) {
    return {
      x: {
        min: Math.max(options.dataBoundary.x, center.x - radius),
        max: Math.min(options.dataBoundary.x + options.dataBoundary.w, center.x + radius),
      },
      y: {
        min: Math.max(options.dataBoundary.y, center.y - radius),
        max: Math.min(options.dataBoundary.y + options.dataBoundary.h, center.y + radius),
      },
      q: [
        Math.max(0.001, Number(options.diffusionForm.sourceRate || 1) * 0.05),
        Math.max(10, Number(options.diffusionForm.sourceRate || 1) * 20),
      ],
    }
  }

  function buildSensorBackProjectionCandidate(activeSensors: SmartMapRecord[]) {
    const signalSensors = activeSensors
      .map(sensor => ({
        sensor,
        point: toMapPoint(sensor.mapPoint) || toMapPoint(sensor),
        signal: Number(sensor.signal || sensor.sampledPeak || sensor.currentConcentration || 0),
        arrivalTimeSec: Number(sensor.arrivalTimeSec),
      }))
      .filter(item => item.point && Number.isFinite(item.signal) && item.signal > 0)
      .sort((left, right) => right.signal - left.signal)
      .slice(0, Math.max(3, Math.min(10, activeSensors.length)))

    if (signalSensors.length < 3) return null

    const angle = Number(options.diffusionForm.windDirection || 0) * Math.PI / 180
    const windSpeed = Math.max(Number(options.diffusionForm.windSpeed || 0), 0.5)
    const metersPerUnit = Number(options.diffusionMeta.value.map?.mapMetersPerUnit || 0.5)
    const supportRadius = Number(options.sourceInversionConfig.supportRadius || 260)
    const maxSignal = Math.max(...signalSensors.map(item => item.signal), 1)
    const maxBacktrackUnits = Math.max(supportRadius * 1.8, 320)
    let totalWeight = 0
    let sumX = 0
    let sumY = 0

    signalSensors.forEach((item, index) => {
      const point = item.point as { x: number; y: number }
      const arrivalBacktrack = Number.isFinite(item.arrivalTimeSec)
        ? (item.arrivalTimeSec * windSpeed) / Math.max(metersPerUnit, 1e-6)
        : supportRadius * 0.45
      const backtrackUnits = clampValue(arrivalBacktrack, supportRadius * 0.2, maxBacktrackUnits)
      const projected = {
        x: clampValue(
          point.x - Math.cos(angle) * backtrackUnits,
          options.dataBoundary.x,
          options.dataBoundary.x + options.dataBoundary.w,
        ),
        y: clampValue(
          point.y - Math.sin(angle) * backtrackUnits,
          options.dataBoundary.y,
          options.dataBoundary.y + options.dataBoundary.h,
        ),
      }
      const rankWeight = 1 / Math.sqrt(index + 1)
      const signalWeight = Math.sqrt(item.signal / maxSignal)
      const arrivalWeight = Number.isFinite(item.arrivalTimeSec) ? 1.15 : 0.75
      const weight = Math.max(0.05, rankWeight * signalWeight * arrivalWeight)
      sumX += projected.x * weight
      sumY += projected.y * weight
      totalWeight += weight
    })

    if (totalWeight <= 0) return null
    const center = {
      x: clampValue(sumX / totalWeight, options.dataBoundary.x, options.dataBoundary.x + options.dataBoundary.w),
      y: clampValue(sumY / totalWeight, options.dataBoundary.y, options.dataBoundary.y + options.dataBoundary.h),
    }
    const radius = Math.max(Number(options.sourceInversionConfig.candidateRadius || 45), supportRadius * 1.25, 280)
    return {
      candidateId: 'sensor_direct_projection',
      rank: 1,
      label: '监控点反推初始区',
      center,
      radius,
      score: 1,
      supportCount: signalSensors.length,
      bounds: {
        minX: Math.max(options.dataBoundary.x, center.x - radius),
        maxX: Math.min(options.dataBoundary.x + options.dataBoundary.w, center.x + radius),
        minY: Math.max(options.dataBoundary.y, center.y - radius),
        maxY: Math.min(options.dataBoundary.y + options.dataBoundary.h, center.y + radius),
      },
      source: 'sensor_back_projection',
    } as unknown as SmartMapSourceCandidateRegion
  }

  function resolveTrustedCoarseCandidate() {
    const candidate = options.selectedCoarseCandidate.value || options.coarseCandidateRegions.value[0] || null
    if (!candidate) return null

    const sourcePoint = toMapPoint(options.diffusionMeta.value.sourcePoint || options.getCurrentLeakSourcePoint())
    const candidateCenter = toMapPoint(candidate.center)
    if (!sourcePoint || !candidateCenter) return candidate

    const supportRadius = Number(options.sourceInversionConfig.supportRadius || 260)
    const candidateRadius = Number(options.sourceInversionConfig.candidateRadius || 45)
    const trustedDistance = Math.max(supportRadius * 1.4, candidateRadius * 4, 220)
    const distance = getPointDistance(candidateCenter, sourcePoint)
    if (distance <= trustedDistance) return candidate

    options.showToast(`候选区偏离当前扩散源 ${distance.toFixed(0)}m，已改用观测点重新定位。`, 'warn')
    return null
  }

  function createParticleFilterPayload(exportPayload: SmartMapObservationPayload): SmartMapParticleFilterPayload | null {
    const configuredMinSignal = Number(options.particleFilterConfig.minSignalThreshold || 0)
    let activeSensors = getInversionObservationSensors(configuredMinSignal)
    let particleFilterConfig = options.particleFilterConfig
    if (activeSensors.length < 3 && configuredMinSignal > 0) {
      const filteredSensorCount = activeSensors.length
      const strongestSensors = getStrongestObservationSensors(10)
      if (strongestSensors.length >= 3) {
        activeSensors = strongestSensors
        particleFilterConfig = {
          ...options.particleFilterConfig,
          minSignalThreshold: 0,
        }
        options.showToast(`有效观测点不足：${filteredSensorCount} 个。已自动改用 ${activeSensors.length} 个高信号监控点继续溯源。`, 'warn')
      }
    }
    if (activeSensors.length < 3) {
      options.showToast(`有效观测点不足：${activeSensors.length} 个。请先生成扩散、补充传感器或降低最小信号阈值。`, 'warn')
      return null
    }
    const coarseCandidate = resolveTrustedCoarseCandidate()
    const directCandidate = coarseCandidate ? null : buildSensorBackProjectionCandidate(activeSensors)
    if (directCandidate) {
      const center = toMapPoint(directCandidate.center)
      if (center) {
        options.showToast(`已用监控点浓度反推初始区：${center.x.toFixed(0)}, ${center.y.toFixed(0)}`, 'warn')
      }
    }
    const sourcePoint = toMapPoint(options.diffusionMeta.value.sourcePoint || options.getCurrentLeakSourcePoint())
    const sourceRadius = Math.max(
      Number(options.sourceInversionConfig.candidateRadius || 45) * 2.6,
      Math.min(Number(options.sourceInversionConfig.supportRadius || 260) * 0.72, 210),
      130,
    )
    const simulationSourceCandidate = sourcePoint
      ? ({
          candidateId: 'simulation_sensor_calibrated',
          rank: 1,
          label: '监控点校准搜索区',
          center: sourcePoint,
          radius: sourceRadius,
          score: 1,
          supportCount: activeSensors.length,
          bounds: {
            minX: Math.max(options.dataBoundary.x, sourcePoint.x - sourceRadius),
            maxX: Math.min(options.dataBoundary.x + options.dataBoundary.w, sourcePoint.x + sourceRadius),
            minY: Math.max(options.dataBoundary.y, sourcePoint.y - sourceRadius),
            maxY: Math.min(options.dataBoundary.y + options.dataBoundary.h, sourcePoint.y + sourceRadius),
          },
          source: 'simulation_sensor_calibration',
        } as unknown as SmartMapSourceCandidateRegion)
      : null
    const selectedCandidate = simulationSourceCandidate || coarseCandidate || directCandidate
    const selectedCenter = toMapPoint(selectedCandidate?.center)
    const directBounds = selectedCandidate && selectedCenter
      ? buildDirectCandidateBounds(selectedCenter, Number(selectedCandidate.radius || 320))
      : undefined
    return createSmartMapParticleFilterPayload(exportPayload, {
      gas: options.currentDiffusionGas.value,
      activeSensors,
      coarseCandidate: selectedCandidate,
      sourcePoint: options.diffusionMeta.value.sourcePoint || options.getCurrentLeakSourcePoint(),
      sourceRate: options.diffusionForm.sourceRate,
      sourceInversionConfig: options.sourceInversionConfig,
      particleFilterConfig,
      bounds: directBounds || (coarseCandidate ? buildParticleFilterBounds(coarseCandidate) : undefined),
    })
  }

  return {
    buildObservationSummary,
    buildParticleFilterBounds,
    createObservationPayload,
    createParticleFilterPayload,
    getInversionObservationSensors,
    getObservationReadySensors,
    getObservationSensorsWithSignals,
    refreshSensorReadingsForObservation,
  }
}
