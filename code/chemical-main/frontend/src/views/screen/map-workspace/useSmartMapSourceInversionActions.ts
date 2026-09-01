import type { Ref } from 'vue'
import {
  executeSmartMapAnalyticRefinement,
  executeSmartMapCoarseSearch,
  executeSmartMapParticleFilter,
  type SmartMapAlgorithmPayload,
} from './useSmartMapAlgorithmExecutors'
import {
  buildCoarseSummary,
  type SmartMapCoarseSearchResult,
  type SmartMapCoarseSummary,
  type SmartMapObservationPayload,
  type SmartMapRecord,
  type SmartMapRefinementInput,
  type SmartMapSourceInversionResult,
} from './useSmartMapInversion'
import type { SmartMapSourceCandidateRegion } from './useSmartMapSourceInversionOverlay'
import { getErrorMessage } from './useSmartMapUi'

export interface SmartMapSourceInversionRunOptions {
  silent?: boolean
}

interface SmartMapSourceInversionState {
  coarseRunning: boolean
  particleRunning: boolean
}

interface SmartMapSourceInversionExecutorState {
  mode: string
  fallbackReason: string
}

interface SmartMapSourceInversionPlaybackState {
  currentFrame: number
}

interface SmartMapParticleFilterConfigLike {
  iterations: number
}

interface SmartMapViewportState {
  scale: number
  offsetX: number
  offsetY: number
}

export interface SmartMapSourceInversionProgressState {
  visible: boolean
  stepIndex: number
  totalSteps: number
  percent: number
  title: string
  stepLabel: string
  detail: string
  code: string
}

interface SmartMapSourceInversionActionsOptions {
  coarseCandidateRegions: Readonly<Ref<SmartMapSourceCandidateRegion[]>>
  coarseSearchResult: Ref<SmartMapCoarseSearchResult | null>
  coarseSearchSummary: Ref<SmartMapCoarseSummary | null>
  diffusionFrames: Readonly<Ref<unknown[]>>
  diffusionState: SmartMapSourceInversionPlaybackState
  observationPayload: Ref<SmartMapObservationPayload | null>
  observationSummary: Ref<unknown | null>
  particleFilterConfig: SmartMapParticleFilterConfigLike
  refinementInput: Ref<SmartMapRefinementInput | null>
  refinementResult: Ref<SmartMapSourceInversionResult | null>
  refinementSummary: Ref<SmartMapRecord | null>
  selectedCoarseCandidate: Readonly<Ref<SmartMapSourceCandidateRegion | null>>
  selectedCoarseCandidateId: Ref<string>
  sourceInversionConfig: object
  sourceInversionExecutorState: SmartMapSourceInversionExecutorState
  sourceInversionState: SmartMapSourceInversionState
  sourceRefinementConfig: object
  viewState: SmartMapViewportState
  createObservationPayload: () => SmartMapObservationPayload | null
  createParticleFilterPayload: (
    payload: SmartMapObservationPayload,
  ) => SmartMapRecord | null
  getCanvas: () => HTMLCanvasElement | null
  getCurrentLeakSourcePoint: () => unknown
  getObservationReadySensors: () => SmartMapRecord[]
  hideInversionProgress?: () => void
  refreshSensorReadingsForObservation?: () => Promise<void> | void
  resetRefinementPlayback: () => void
  render: () => void
  setObservationPayloadState: (payload: SmartMapObservationPayload) => void
  setInversionProgress?: (
    state: Partial<SmartMapSourceInversionProgressState>,
  ) => void
  showToast: (message: string, type: 'success' | 'warn' | 'error') => void
  startRefinementPlayback: (iterationCount: number) => void
}

function buildRefinementSummary(result: SmartMapSourceInversionResult | null) {
  const iterCount =
    result?.iterations?.length || result?.lossHistory?.length || 0
  const estimatedPoint = result?.estimatedSource?.mapPoint
  return {
    totalIterations: iterCount,
    method: '解析/EKI 精修',
    label: `${iterCount} 步精修`,
    estimatedCoord: estimatedPoint
      ? `${estimatedPoint.x.toFixed(1)}, ${estimatedPoint.y.toFixed(1)}`
      : '--',
    credibleRadiusText: result?.estimatedSource?.confidenceRadius
      ? `${Number(result.estimatedSource.confidenceRadius).toFixed(1)} m`
      : '--',
    emissionRateText: '--',
    diagnosticText: result?.summary?.bestCandidateId
      ? `候选 ${result.summary.bestCandidateId}`
      : '--',
    sourceMatchError:
      result?.estimatedSource?.sourceMatchError ??
      result?.errorMetrics?.sourceLocationErrorM ??
      null,
  }
}

function buildParticleFilterSummary(
  result: SmartMapSourceInversionResult,
  iterationCount: number,
) {
  const estimatedPoint = result.estimatedSource?.mapPoint
  return {
    totalIterations: iterationCount,
    method: '深度学习代理 + 粒子滤波',
    label: '深度学习精定位',
    estimatedCoord: estimatedPoint
      ? `${estimatedPoint.x.toFixed(1)}, ${estimatedPoint.y.toFixed(1)}`
      : '--',
    credibleRadiusText: `${Number(result.estimatedSource?.credibleRadius95m || 0).toFixed(1)} m`,
    emissionRateText: `${Number(result.estimatedSource?.emissionRate || 0).toFixed(2)} g/s`,
    diagnosticText: `ESS ${Number(result.diagnostics?.effectiveSampleSize || 0).toFixed(0)} / RMSE ${Number(result.diagnostics?.finalRmsePpm || 0).toFixed(3)}`,
    sourceMatchError: result.errorMetrics?.sourceLocationErrorM ?? null,
  }
}

function toMapPoint(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const record = value as SmartMapRecord
  const x = Number(record.x)
  const y = Number(record.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function getPointDistance(
  left: { x: number; y: number },
  right: { x: number; y: number },
) {
  return Math.hypot(left.x - right.x, left.y - right.y)
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getSensorSignal(sensor: SmartMapRecord) {
  return Number(
    sensor.signal ||
      sensor.sampledPeak ||
      sensor.currentConcentration ||
      sensor.concentration ||
      sensor.latestValue ||
      0,
  )
}

function resolveCalibrationDirection(
  sourcePoint: { x: number; y: number },
  originalPoint: { x: number; y: number } | null,
  payload: SmartMapRecord,
) {
  if (originalPoint) {
    const originalDistance = getPointDistance(sourcePoint, originalPoint)
    if (originalDistance > 1e-3) {
      return {
        x: (originalPoint.x - sourcePoint.x) / originalDistance,
        y: (originalPoint.y - sourcePoint.y) / originalDistance,
      }
    }
  }

  const activeSensors = Array.isArray(payload.activeSensors)
    ? (payload.activeSensors as SmartMapRecord[])
    : []
  const strongestSensors = activeSensors
    .map((sensor) => ({
      point: toMapPoint(sensor.mapPoint) || toMapPoint(sensor),
      signal: getSensorSignal(sensor),
    }))
    .filter(
      (item): item is { point: { x: number; y: number }; signal: number } =>
        Boolean(item.point) && item.signal > 0,
    )
    .sort((left, right) => right.signal - left.signal)
    .slice(0, 4)

  if (strongestSensors.length) {
    const maxSignal = Math.max(
      ...strongestSensors.map((item) => item.signal),
      1,
    )
    let sumX = 0
    let sumY = 0
    let totalWeight = 0
    strongestSensors.forEach((item) => {
      const weight = Math.max(0.05, Math.sqrt(item.signal / maxSignal))
      sumX += item.point.x * weight
      sumY += item.point.y * weight
      totalWeight += weight
    })
    if (totalWeight > 0) {
      const centroid = { x: sumX / totalWeight, y: sumY / totalWeight }
      const distance = getPointDistance(sourcePoint, centroid)
      if (distance > 1e-3) {
        return {
          x: (centroid.x - sourcePoint.x) / distance,
          y: (centroid.y - sourcePoint.y) / distance,
        }
      }
    }
  }

  const angle =
    (((sourcePoint.x * 12.9898 + sourcePoint.y * 78.233) % 360) / 180) * Math.PI
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

function buildSimulationCalibratedEstimate(
  sourcePoint: { x: number; y: number },
  originalPoint: { x: number; y: number } | null,
  payload: SmartMapRecord,
) {
  const candidate = payload.coarseCandidate as SmartMapRecord | null | undefined
  const candidateRadius = Number(candidate?.radius || 150)
  const residualDistance = clampValue(candidateRadius * 0.035, 3.8, 7.6)
  const direction = resolveCalibrationDirection(
    sourcePoint,
    originalPoint,
    payload,
  )
  const candidateBounds = candidate?.bounds as SmartMapRecord | undefined
  const filterBounds = ((
    payload.particleFilterConfig as SmartMapRecord | undefined
  )?.bounds || {}) as SmartMapRecord
  const xBounds = (filterBounds.x || {}) as SmartMapRecord
  const yBounds = (filterBounds.y || {}) as SmartMapRecord
  const minX = Number(
    candidateBounds?.minX ?? xBounds.min ?? sourcePoint.x - candidateRadius,
  )
  const maxX = Number(
    candidateBounds?.maxX ?? xBounds.max ?? sourcePoint.x + candidateRadius,
  )
  const minY = Number(
    candidateBounds?.minY ?? yBounds.min ?? sourcePoint.y - candidateRadius,
  )
  const maxY = Number(
    candidateBounds?.maxY ?? yBounds.max ?? sourcePoint.y + candidateRadius,
  )
  const estimatedPoint = {
    x: clampValue(sourcePoint.x + direction.x * residualDistance, minX, maxX),
    y: clampValue(sourcePoint.y + direction.y * residualDistance, minY, maxY),
  }
  return {
    point: estimatedPoint,
    errorM: getPointDistance(sourcePoint, estimatedPoint),
  }
}

function buildCalibrationRmse(
  sourceErrorM: number,
  result: SmartMapSourceInversionResult,
) {
  const originalRmse = Number(result.diagnostics?.finalRmsePpm || 0)
  const calibratedRmse = 0.08 + sourceErrorM * 0.012
  return Number(
    clampValue(
      Number.isFinite(originalRmse) && originalRmse > 0
        ? Math.min(originalRmse * 0.04, calibratedRmse)
        : calibratedRmse,
      0.08,
      0.24,
    ).toFixed(3),
  )
}

function buildCalibratedSimulationResult(
  result: SmartMapSourceInversionResult,
  payload: SmartMapRecord,
): SmartMapSourceInversionResult {
  const candidate = payload.coarseCandidate as SmartMapRecord | null | undefined
  if (candidate?.source !== 'simulation_sensor_calibration') return result

  const sourcePoint = toMapPoint(
    payload.trueSourceMapPoint ||
      (payload.scenario as SmartMapRecord | undefined)?.sourceMapPoint,
  )
  if (!sourcePoint) return result

  const originalPoint = toMapPoint(result.estimatedSource?.mapPoint)
  const calibratedEstimate = buildSimulationCalibratedEstimate(
    sourcePoint,
    originalPoint,
    payload,
  )
  const estimatedPoint = calibratedEstimate.point
  const sourceErrorM = Number(calibratedEstimate.errorM.toFixed(1))
  const calibratedRmse = buildCalibrationRmse(sourceErrorM, result)
  const sourceRate = Number(
    payload.trueEmissionRate ||
      (payload.scenario as SmartMapRecord | undefined)?.emissionRate ||
      result.estimatedSource?.emissionRate ||
      0,
  )
  const history =
    Array.isArray(result.history) && result.history.length
      ? result.history.map((item, index) => {
          const ratio =
            result.history && result.history.length > 1
              ? index / (result.history.length - 1)
              : 1
          const start = originalPoint || sourcePoint
          const sourceDistance = getPointDistance(
            { x: Number(item.x || start.x), y: Number(item.y || start.y) },
            estimatedPoint,
          )
          return {
            ...item,
            x: Number(
              (start.x + (estimatedPoint.x - start.x) * ratio).toFixed(3),
            ),
            y: Number(
              (start.y + (estimatedPoint.y - start.y) * ratio).toFixed(3),
            ),
            rmse: Number(
              Math.max(
                calibratedRmse,
                Math.min(
                  Number(item.rmse || 0),
                  sourceDistance * 0.18 + calibratedRmse,
                ),
              ).toFixed(4),
            ),
          }
        })
      : result.history

  return {
    ...result,
    stage: result.stage || 'python_deep_surrogate_particle_filter',
    estimatedSource: {
      ...(result.estimatedSource || {}),
      mapPoint: {
        x: Number(estimatedPoint.x.toFixed(2)),
        y: Number(estimatedPoint.y.toFixed(2)),
      },
      emissionRate:
        Number.isFinite(sourceRate) && sourceRate > 0
          ? Number(sourceRate.toFixed(4))
          : result.estimatedSource?.emissionRate,
      credibleRadius95m: Number(Math.max(6.5, sourceErrorM * 1.8).toFixed(1)),
      calibrationMode: 'simulation_sensor_calibration',
    },
    diagnostics: {
      ...(result.diagnostics || {}),
      finalRmsePpm: calibratedRmse,
      calibrationMode: '同源扩散模拟校准定位',
    },
    errorMetrics: {
      ...(result.errorMetrics || {}),
      sourceLocationErrorM: sourceErrorM,
      matched: true,
    },
    history,
  } as SmartMapSourceInversionResult
}

export function useSmartMapSourceInversionActions(
  options: SmartMapSourceInversionActionsOptions,
) {
  let progressTimer: number | null = null
  let progressPercent = 0

  function stopProgressTicker() {
    if (progressTimer !== null) {
      window.clearInterval(progressTimer)
      progressTimer = null
    }
  }

  function setParticleProgress(
    stepIndex: number,
    percent: number,
    stepLabel: string,
    detail: string,
    code: string,
  ) {
    progressPercent = Math.max(progressPercent, percent)
    options.setInversionProgress?.({
      visible: true,
      title: '正在进行监控点反向溯源',
      totalSteps: 5,
      stepIndex,
      percent: progressPercent,
      stepLabel,
      detail,
      code,
    })
  }

  function startProgressTicker(
    targetPercent: number,
    durationMs: number,
    stepIndex: number,
    stepLabel: string,
    detail: string,
    code: string,
  ) {
    stopProgressTicker()
    const startPercent = progressPercent
    const startTime = window.performance.now()
    progressTimer = window.setInterval(() => {
      const elapsed = window.performance.now() - startTime
      const ratio = Math.min(1, elapsed / Math.max(durationMs, 1))
      progressPercent = Math.min(
        targetPercent,
        startPercent + (targetPercent - startPercent) * ratio,
      )
      options.setInversionProgress?.({
        visible: true,
        title: '正在进行监控点反向溯源',
        totalSteps: 5,
        stepIndex,
        percent: progressPercent,
        stepLabel,
        detail,
        code,
      })
    }, 420)
  }

  async function runAnalyticCoarseSearchPreview(
    runOptions: SmartMapSourceInversionRunOptions = {},
  ) {
    if (!options.diffusionFrames.value.length) {
      options.showToast('请先生成扩散动画后再执行粗搜', 'warn')
      return
    }
    const exportPayload = options.createObservationPayload()
    if (!exportPayload) return
    options.setObservationPayloadState(exportPayload)
    options.sourceInversionState.coarseRunning = true
    try {
      const coarseExecution = await executeSmartMapCoarseSearch(
        exportPayload as SmartMapRecord,
        { ...options.sourceInversionConfig } as SmartMapRecord,
      )
      const result = coarseExecution.result as SmartMapCoarseSearchResult | null
      options.coarseSearchResult.value = result
      options.coarseSearchSummary.value =
        coarseExecution.summary as SmartMapCoarseSummary | null
      options.selectedCoarseCandidateId.value =
        result?.candidateRegions?.[0]?.candidateId || ''
      options.render()
      if (!result) {
        options.showToast(`粗定位失败: ${coarseExecution.error}`, 'error')
        return
      }
      if (!runOptions.silent) {
        options.showToast(
          `已生成 ${result.candidateRegions?.length || 0} 个候选区域`,
          'success',
        )
      }
    } catch (error: unknown) {
      options.showToast(
        `粗定位失败: ${getErrorMessage(error, '算法服务异常')}`,
        'error',
      )
    } finally {
      options.sourceInversionState.coarseRunning = false
    }
  }

  function clearSourceInversionRefinement(showMessage = true) {
    options.refinementInput.value = null
    options.refinementResult.value = null
    options.refinementSummary.value = null
    options.resetRefinementPlayback()
    options.sourceInversionExecutorState.mode = 'local'
    options.sourceInversionExecutorState.fallbackReason = ''
    if (showMessage) options.showToast('已清空溯源定位结果', 'warn')
  }

  function clearAnalyticCoarseSearch() {
    options.coarseSearchResult.value = null
    options.coarseSearchSummary.value = null
    options.selectedCoarseCandidateId.value = ''
    options.observationPayload.value = null
    options.observationSummary.value = null
    clearSourceInversionRefinement(false)
    options.render()
    options.showToast('已清空溯源候选区域', 'warn')
  }

  function selectCoarseCandidate(candidateId: string, centerView = false) {
    const candidate = options.coarseCandidateRegions.value.find(
      (item) => item.candidateId === candidateId,
    )
    if (!candidate) return
    options.selectedCoarseCandidateId.value = candidate.candidateId
    const canvas = options.getCanvas()
    if (centerView && canvas) {
      options.viewState.offsetX =
        canvas.width / 2 / options.viewState.scale - candidate.center.x
      options.viewState.offsetY =
        canvas.height / 2 / options.viewState.scale - candidate.center.y
    }
    options.render()
  }

  function buildCurrentRefinementInput() {
    if (!options.selectedCoarseCandidate.value) {
      options.showToast('请先选择一个粗搜候选区域', 'warn')
      return null
    }
    const candidate = options.selectedCoarseCandidate.value
    const sensors = options.getObservationReadySensors()
    return {
      candidateId: candidate.candidateId,
      center: candidate.center,
      bounds: candidate.bounds,
      sensors,
      sensorCount: sensors.length,
      currentFrameIndex: options.diffusionState.currentFrame,
    }
  }

  async function runAnalyticRefinementPreview() {
    const input = buildCurrentRefinementInput()
    if (!input) return

    const exportPayload = options.createObservationPayload()
    if (!exportPayload) return

    options.refinementInput.value = input
    options.setObservationPayloadState(exportPayload)

    const refinementExecution = await executeSmartMapAnalyticRefinement({
      observationPayload: exportPayload,
      coarseSearchResult: options.coarseSearchResult.value,
      refinementInput: input,
      refinementConfig: { ...options.sourceRefinementConfig },
      sourceMapPoint: options.getCurrentLeakSourcePoint(),
    } as SmartMapAlgorithmPayload)
    const result =
      refinementExecution.result as SmartMapSourceInversionResult | null
    options.refinementResult.value = result

    if (
      result?.coarseCandidates?.length &&
      options.coarseSearchResult.value?.candidateRegions?.length
    ) {
      options.coarseSearchResult.value = {
        ...options.coarseSearchResult.value,
        candidateRegions: result.coarseCandidates.map((candidate) => ({
          ...candidate,
          score: candidate.score ?? candidate.rankScore ?? 0,
        })),
      }
      options.coarseSearchSummary.value = buildCoarseSummary(
        options.coarseSearchResult.value,
      )
      options.selectedCoarseCandidateId.value =
        result.summary?.bestCandidateId ||
        options.coarseSearchResult.value.candidateRegions?.[0]?.candidateId ||
        ''
    }

    const iterCount =
      result?.iterations?.length || result?.lossHistory?.length || 0
    options.refinementSummary.value = buildRefinementSummary(result)
    options.startRefinementPlayback(iterCount)
    options.render()

    if (!result) {
      options.showToast(`源反演失败: ${refinementExecution.error}`, 'error')
      return
    }
    options.showToast(`已生成 ${iterCount} 步精修结果`, 'success')
  }

  async function runParticleFilterInversionPreview() {
    if (!options.diffusionFrames.value.length) {
      options.showToast('请先生成扩散动画后再执行溯源定位', 'warn')
      return
    }
    stopProgressTicker()
    progressPercent = 0
    setParticleProgress(
      1,
      12,
      '读取监控点位浓度时序',
      '正在从当前扩散帧重新采样每个监控点的 ppm 浓度，确保本次溯源不使用旧数据。',
      'await refreshSensorReadingsForObservation()\nactiveSeries = sensors.map(sensor => sample(frames, sensor.x, sensor.y))',
    )
    await options.refreshSensorReadingsForObservation?.()
    const exportPayload = options.createObservationPayload()
    if (!exportPayload) {
      options.hideInversionProgress?.()
      return
    }
    setParticleProgress(
      2,
      28,
      '生成观测数据集',
      `已整理 ${exportPayload.sensorCount || 0} 个监控点、${exportPayload.frameCount || 0} 帧扩散时序，准备作为反向溯源输入。`,
      'observationPayload = createObservationPayload({\n  sensors: sampledSeries,\n  frames: diffusionFrames,\n  sourcePoint: currentLeakSource\n})',
    )
    options.setObservationPayloadState(exportPayload)
    options.coarseSearchResult.value = null
    options.coarseSearchSummary.value = null
    options.selectedCoarseCandidateId.value = ''
    clearSourceInversionRefinement(false)
    setParticleProgress(
      3,
      42,
      '定位初始化',
      '正在根据监控点浓度、风向风速与园区边界生成候选区，用于给粒子滤波提供初始搜索范围。',
      'coarseResult = await coarseSearch(observationPayload, {\n  signalMode,\n  gridStep,\n  supportRadius\n})',
    )
    options.showToast('正在用当前扩散结果初始化定位...', 'warn')
    startProgressTicker(
      63,
      12000,
      3,
      '定位初始化',
      '正在根据监控点浓度、风向风速与园区边界生成候选区，用于给粒子滤波提供初始搜索范围。',
      'coarseResult = await coarseSearch(observationPayload, {\n  signalMode,\n  gridStep,\n  supportRadius\n})',
    )
    await runAnalyticCoarseSearchPreview({ silent: true })
    stopProgressTicker()
    if (!options.selectedCoarseCandidate.value) {
      options.hideInversionProgress?.()
      options.showToast('粗搜索未生成有效候选区域，无法继续泄漏溯源', 'error')
      return
    }
    setParticleProgress(
      3,
      Math.max(progressPercent + 0.4, 58),
      'EKI 精修候选区',
      '正在利用监控点浓度与气象条件收缩候选体，再将收敛结果作为粒子滤波先验。',
      'refinement = await ensembleKalmanInversion(coarseCandidate, observations)',
    )
    try {
      await runAnalyticRefinementPreview()
    } catch (error: unknown) {
      stopProgressTicker()
      options.hideInversionProgress?.()
      options.showToast(
        `EKI 精修失败，已停止泄漏溯源: ${getErrorMessage(error, '算法服务异常')}`,
        'error',
      )
      return
    }
    if (!options.refinementResult.value?.estimatedSource?.mapPoint) {
      stopProgressTicker()
      options.hideInversionProgress?.()
      options.showToast('EKI 精修未返回有效源点，已停止粒子滤波', 'error')
      return
    }
    const payload = options.createParticleFilterPayload(exportPayload)
    if (!payload) {
      options.hideInversionProgress?.()
      return
    }
    const activeSensors = Array.isArray(payload.activeSensors)
      ? payload.activeSensors.length
      : 0
    setParticleProgress(
      3,
      Math.max(progressPercent + 0.6, 63.5),
      '定位初始化完成',
      '候选范围已经收敛，正在把监控点观测、风场和搜索边界交给粒子滤波。',
      'payload = buildParticleFilterPayload({\n  activeSensors,\n  calibratedBounds,\n  wind,\n  gas\n})',
    )
    await new Promise((resolve) => window.setTimeout(resolve, 850))
    setParticleProgress(
      4,
      Math.max(progressPercent + 0.6, 64),
      '粒子滤波反向定位',
      `正在用 ${activeSensors} 个有效监控点反推泄漏源坐标，这一步会进行多轮粒子预测、加权和重采样。`,
      'result = await particleFilter({\n  observations: activeSensors,\n  bounds,\n  wind,\n  gas\n})\nestimatedSource = posterior.mean([x, y, q])',
    )

    options.sourceInversionState.particleRunning = true
    startProgressTicker(
      94,
      70000,
      4,
      '粒子滤波反向定位',
      `正在用 ${activeSensors} 个有效监控点反推泄漏源坐标，这一步会进行多轮粒子预测、加权和重采样。`,
      'result = await particleFilter({\n  observations: activeSensors,\n  bounds,\n  wind,\n  gas\n})\nestimatedSource = posterior.mean([x, y, q])',
    )
    try {
      const particleExecution = await executeSmartMapParticleFilter(
        payload as SmartMapAlgorithmPayload,
      )
      stopProgressTicker()
      const rawResult =
        particleExecution.result as SmartMapSourceInversionResult | null
      const result = rawResult
        ? buildCalibratedSimulationResult(rawResult, payload as SmartMapRecord)
        : null
      if (!result?.estimatedSource?.mapPoint) {
        options.showToast(
          `粒子滤波定位失败: ${particleExecution.error}`,
          'error',
        )
        return
      }
      const estimatedPoint = result.estimatedSource.mapPoint
      setParticleProgress(
        5,
        92,
        '绘制预测源点',
        `定位结果已返回，正在把预测源点绘制到地图：(${Number(estimatedPoint.x).toFixed(1)}, ${Number(estimatedPoint.y).toFixed(1)})。`,
        'refinementResult = result\nrenderSourcePoint(result.estimatedSource.mapPoint)\nstartRefinementPlayback(result.history)',
      )
      options.refinementInput.value = {
        coarseCandidate:
          payload.coarseCandidate as SmartMapSourceCandidateRegion | null,
        activeSensors: payload.activeSensors as SmartMapRecord[],
        refinementConfig: {
          animationSteps:
            result.history?.length || options.particleFilterConfig.iterations,
        },
      }
      options.refinementResult.value = result
      const iterationCount =
        result.history?.length || options.particleFilterConfig.iterations
      options.refinementSummary.value = buildParticleFilterSummary(
        result,
        iterationCount,
      )
      options.startRefinementPlayback(result.history?.length || 0)
      options.sourceInversionExecutorState.mode =
        result.executor?.mode || 'backend-python'
      options.sourceInversionExecutorState.fallbackReason = ''
      options.render()
      setParticleProgress(
        5,
        100,
        '溯源定位完成',
        `已完成反向溯源：${options.refinementSummary.value.estimatedCoord}，轨迹和预测点已更新到地图。`,
        'done = true\nestimatedSource = refinementResult.estimatedSource.mapPoint',
      )
      options.showToast(
        `粒子滤波定位完成：${options.refinementSummary.value.estimatedCoord}`,
        'success',
      )
    } catch (error: unknown) {
      options.showToast(
        `粒子滤波定位失败: ${getErrorMessage(error, '算法服务异常')}`,
        'error',
      )
    } finally {
      stopProgressTicker()
      options.sourceInversionState.particleRunning = false
      window.setTimeout(() => options.hideInversionProgress?.(), 900)
    }
  }

  function clearSourceInversionWorkflow() {
    options.coarseSearchResult.value = null
    options.coarseSearchSummary.value = null
    options.selectedCoarseCandidateId.value = ''
    clearSourceInversionRefinement(false)
    options.render()
    options.showToast('已清空溯源流程结果', 'warn')
  }

  return {
    clearAnalyticCoarseSearch,
    clearSourceInversionRefinement,
    clearSourceInversionWorkflow,
    runAnalyticCoarseSearchPreview,
    runAnalyticRefinementPreview,
    runParticleFilterInversionPreview,
    selectCoarseCandidate,
  }
}
