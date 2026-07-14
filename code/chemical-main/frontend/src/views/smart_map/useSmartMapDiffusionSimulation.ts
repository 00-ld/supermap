import type { Ref } from 'vue'
import { executeSmartMapDiffusion, type SmartMapAlgorithmPayload } from './useSmartMapAlgorithmExecutors'
import type { SmartMapDiffusionFrame } from './useSmartMapDiffusionLayer'
import type { SmartMapDiffusionRunState } from './useSmartMapDiffusionPlayback'
import type {
  SmartMapDiffusionMeta,
  SmartMapDiffusionResult,
  SmartMapGas,
  SmartMapPointInput,
  SmartMapSourceFacility,
} from './useSmartMapDiffusionTypes'
import type { SmartMapRecord } from './useSmartMapInversion'
import { getErrorMessage } from './useSmartMapUi'

export interface SmartMapDiffusionRunOptions {
  silent?: boolean
}

interface SmartMapDiffusionFormLike {
  gasId: string
  sourceFacilityId: string
  sourceRate: number
  releaseDuration: number
  initialTemperature: number
  initialPressure: number
  releaseHeight: number
  windSpeed: number
  windDirection: number
  ambientTemperature: number
  humidity: number
  stabilityClass: string
  terrainRoughness: number
  obstacleInfluenceEnabled: boolean
  frameCount: number
  frameStepSec: number
}

interface SmartMapDiffusionRunnerFacility {
  id: string
  name?: string
  type?: string
  x?: number
  y?: number
  w?: number
  h?: number
  r?: number
  key?: unknown
  zone?: string
  status?: unknown
  hazardLevel?: unknown
}

interface SmartMapDiffusionRunnerRoad {
  x: number
  y: number
  w: number
  h: number
  main?: boolean
}

interface SmartMapDiffusionRunnerSensor {
  id: string | number
  x: unknown
  y: unknown
  type?: unknown
  priority?: unknown
}

interface SmartMapDiffusionRunnerMap {
  width: number
  height: number
  gridSize: number
  mapMetersPerUnit: number
}

interface SmartMapDiffusionSimulationOptions {
  diffusionForm: SmartMapDiffusionFormLike
  diffusionFrames: Ref<SmartMapDiffusionFrame[]>
  diffusionMeta: Ref<SmartMapDiffusionMeta>
  facilities: SmartMapDiffusionRunnerFacility[]
  roads: SmartMapDiffusionRunnerRoad[]
  sensors: Ref<SmartMapDiffusionRunnerSensor[]>
  map: SmartMapDiffusionRunnerMap
  diffusionRunState: SmartMapDiffusionRunState
  getCurrentLeakSourcePoint: () => { x: number; y: number } | null
  getSelectedDiffusionSource: () => SmartMapSourceFacility | null
  getGasById: (gasId: string) => SmartMapGas
  normalizeMapPoint: (point: SmartMapPointInput | null | undefined) => { x: number; y: number } | null
  setDiffusionRunning: (running: boolean) => void
  startDiffusionPlaybackFromFirstFrame: () => void
  resetDiffusionPlayback: () => void
  resampleSensorsFromDiffusion: () => void
  rerunEvacuationAfterDiffusion: () => void
  clearEvacuationPlanning: () => void
  clearSourceInversionWorkflow?: () => void
  render: () => void
  showToast: (message: string, type: 'success' | 'warn' | 'error' | 'danger') => void
}

function buildDiffusionPayload(options: SmartMapDiffusionSimulationOptions): SmartMapAlgorithmPayload | null {
  const sourceMapPoint = options.getCurrentLeakSourcePoint()
  if (!sourceMapPoint) return null
  return {
    gasId: options.diffusionForm.gasId,
    sourceFacilityId: options.diffusionForm.sourceFacilityId,
    sourceMapPoint,
    sourceRate: options.diffusionForm.sourceRate,
    releaseDuration: options.diffusionForm.releaseDuration,
    initialTemperature: options.diffusionForm.initialTemperature,
    initialPressure: options.diffusionForm.initialPressure,
    releaseHeight: options.diffusionForm.releaseHeight,
    windSpeed: options.diffusionForm.windSpeed,
    windDirection: options.diffusionForm.windDirection,
    ambientTemperature: options.diffusionForm.ambientTemperature,
    humidity: options.diffusionForm.humidity,
    stabilityClass: options.diffusionForm.stabilityClass,
    terrainRoughness: options.diffusionForm.terrainRoughness,
    obstacleInfluenceEnabled: options.diffusionForm.obstacleInfluenceEnabled,
    frameCount: options.diffusionForm.frameCount,
    frameStepSec: options.diffusionForm.frameStepSec,
    map: options.map,
    facilities: options.facilities.map(facility => ({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      x: facility.x,
      y: facility.y,
      w: facility.w,
      h: facility.h,
      r: facility.r,
      key: facility.key,
      zone: facility.zone,
      status: facility.status,
      hazardLevel: facility.hazardLevel,
    })),
    roads: options.roads.map(road => ({
      x: road.x,
      y: road.y,
      w: road.w,
      h: road.h,
      main: road.main,
    })),
    sensors: options.sensors.value.map(sensor => ({
      id: sensor.id,
      x: Number(sensor.x),
      y: Number(sensor.y),
      type: sensor.type,
      priority: sensor.priority,
      mapPoint: { x: Number(sensor.x), y: Number(sensor.y) },
    })),
  }
}

function resultToDiffusionMeta(
  result: SmartMapDiffusionResult,
  normalizeMapPoint: SmartMapDiffusionSimulationOptions['normalizeMapPoint'],
): SmartMapDiffusionMeta {
  return {
    gas: result.gas || null,
    sourceFacility: result.sourceFacility || null,
    sourcePoint: normalizeMapPoint(result.sourcePoint),
    stats: result.stats || {},
    blockedMask: result.blockedMask || null,
    map: result.map || null,
    executor: result.executor || null,
    sensorSeries: result.sensorSeries || [],
    scenarioMeta: result.scenarioMeta || null,
    outputMeta: result.outputMeta || null,
  }
}

function resetDiffusionMeta(options: SmartMapDiffusionSimulationOptions): SmartMapDiffusionMeta {
  return {
    gas: options.getGasById(options.diffusionForm.gasId),
    sourceFacility: options.getSelectedDiffusionSource(),
    sourcePoint: options.getCurrentLeakSourcePoint(),
    stats: { peakConcentration: 0, peakAffectedArea: 0, peakDangerArea: 0 } satisfies SmartMapRecord,
    blockedMask: null,
    map: null,
    executor: null,
    sensorSeries: [],
    scenarioMeta: null,
    outputMeta: null,
  }
}

export function useSmartMapDiffusionSimulation(options: SmartMapDiffusionSimulationOptions) {
  async function runDiffusionSimulation(runOptions: SmartMapDiffusionRunOptions = {}) {
    if (options.diffusionRunState.isRunning()) return
    const payload = buildDiffusionPayload(options)
    if (!payload) {
      options.showToast('请先选择有效泄漏源点或应用经纬度源点', 'warn')
      return
    }
    options.clearSourceInversionWorkflow?.()
    options.setDiffusionRunning(true)
    if (!runOptions.silent) {
      options.showToast('正在调用算法服务生成扩散动画...', 'success')
    }
    try {
      const { result: diffusionResult, error } = await executeSmartMapDiffusion(payload)
      const result = diffusionResult as SmartMapDiffusionResult | null
      if (!result) {
        options.showToast('扩散模拟失败: ' + error, 'error')
        return
      }
      options.diffusionFrames.value = result.frames || []
      options.diffusionMeta.value = resultToDiffusionMeta(result, options.normalizeMapPoint)
      options.startDiffusionPlaybackFromFirstFrame()
      options.resampleSensorsFromDiffusion()
      options.rerunEvacuationAfterDiffusion()
      options.render()
      if (!runOptions.silent) {
        options.showToast(`已生成 ${options.diffusionFrames.value.length} 帧扩散动画`, 'success')
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, '请检查算法服务是否已启动')
      options.showToast(`扩散模拟失败: ${message}`, 'error')
    } finally {
      options.setDiffusionRunning(false)
    }
  }

  function resetDiffusionSimulation() {
    options.diffusionFrames.value = []
    options.resetDiffusionPlayback()
    options.diffusionMeta.value = resetDiffusionMeta(options)
    options.clearEvacuationPlanning()
    options.clearSourceInversionWorkflow?.()
    options.resampleSensorsFromDiffusion()
    options.render()
    options.showToast('已清除扩散动画', 'warn')
  }

  return {
    resetDiffusionSimulation,
    runDiffusionSimulation,
  }
}
