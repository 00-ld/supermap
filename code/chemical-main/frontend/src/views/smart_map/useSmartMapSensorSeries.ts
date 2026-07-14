import { attachSensorSampleSeries, type DiffusionFrame, type DiffusionSensor } from '@/data/phase1Config'
import type { SensorReadingRecord } from '@/api/simulationMonitoring'
import {
  normalizeManualSeries,
  normalizeSeriesConcentration,
  type SmartMapPoint,
  type SmartMapRecord,
} from './useSmartMapInversion'
import {
  mergeSmartMapSensorReadings,
  type SmartMapSensorReadingTarget,
} from './useSmartMapSensorReadings'

export interface SmartMapSensorSeriesRecord extends SmartMapRecord {
  x?: number
  y?: number
  sampledSeries?: SmartMapRecord[]
  autoSampledSeries?: SmartMapRecord[]
  sampledPeak?: number
}

export interface SmartMapSensorGasThreshold {
  warningThreshold?: number
  dangerThreshold?: number
}

export interface SmartMapActiveSensorRiskInput {
  id?: string
  x?: number
  y?: number
  type?: string
  priority?: number
  risk?: number
  detectionRange?: string
  installationHeight?: number
}

export interface SmartMapActiveSensorSource extends SmartMapRecord {
  id?: unknown
  x?: unknown
  y?: unknown
  type?: unknown
  priority?: unknown
  risk?: unknown
  mode?: unknown
  detectionRange?: unknown
  installationHeight?: unknown
  manualSeries?: SmartMapRecord[]
  sampledSeries?: SmartMapRecord[]
  lastSampleTime?: unknown
}

export interface SmartMapActiveSensor
  extends SmartMapSensorReadingTarget, SmartMapSensorSeriesRecord {
  id: string
  x: number
  y: number
  type: string
  risk: number
  priority: number
  mode?: string
  lastSampleTime?: number | null
}

interface SensorConcentrationOptions {
  frameIndex: number
  currentFrame: DiffusionFrame | null
  getFrameConcentrationAtPoint: (frame: DiffusionFrame, x: number, y: number) => number
}

interface SensorHistoryChartOptions extends SensorConcentrationOptions {
  gas: SmartMapSensorGasThreshold | null | undefined
}

interface BuildActiveSensorSeriesOptions<TFacility> {
  frames: DiffusionFrame[]
  leakPoint: SmartMapPoint | null
  windSpeed: number
  windDir: number
  sourceRate: number
  sensorReadingRecords: SensorReadingRecord[]
  findNearestFacility: (x: number, y: number) => TFacility
  computeSensorRisk: (
    sensor: SmartMapActiveSensorRiskInput,
    nearestFacility: TFacility,
  ) => { risk: number; priority: number }
  computeGasConcentration: (
    sensor: SmartMapPoint,
    leakPoint: SmartMapPoint,
    windSpeed: number,
    windDir: number,
    sourceRate: number,
  ) => number
}

export interface SmartMapSensorHistoryChart {
  padding: number
  points: string
  markerX: number
  markerY: number
  warningY: number
  dangerY: number
  currentLabel: string
  peakLabel: string
  endLabel: string
}

function toSeriesValue(item: SmartMapRecord | undefined, key: string, fallback = 0): number {
  const value = Number(item?.[key])
  return Number.isFinite(value) ? value : fallback
}

export function getSmartMapSensorCurrentConcentration(
  sensor: SmartMapSensorSeriesRecord,
  options: SensorConcentrationOptions,
): number {
  if (sensor.sampledSeries?.length) {
    return toSeriesValue(sensor.sampledSeries[options.frameIndex], 'concentration')
  }
  if (!options.currentFrame) return 0
  return options.getFrameConcentrationAtPoint(
    options.currentFrame,
    Number(sensor.x || 0),
    Number(sensor.y || 0),
  )
}

export function getSmartMapSensorAutoConcentration(
  sensor: SmartMapSensorSeriesRecord | null | undefined,
  frameIndex: number,
): number {
  if (!sensor?.autoSampledSeries?.length) return 0
  return toSeriesValue(sensor.autoSampledSeries[frameIndex], 'concentration')
}

export function getSmartMapSensorAlarmLevel(
  concentration: number,
  gas: SmartMapSensorGasThreshold | null | undefined,
) {
  if (!gas) return 'normal'
  if (concentration >= Number(gas.dangerThreshold || 0)) return 'danger'
  if (concentration >= Number(gas.warningThreshold || 0)) return 'warning'
  return 'normal'
}

export function buildSmartMapActiveSensorSeries<
  TSensor extends SmartMapActiveSensor = SmartMapActiveSensor,
  TFacility = unknown,
>(
  sensorList: SmartMapActiveSensorSource[],
  options: BuildActiveSensorSeriesOptions<TFacility>,
): TSensor[] {
  const frames = options.frames || []
  const hasFrames = frames.length > 0
  const autoSampledSensors = attachSensorSampleSeries(
    sensorList.map((sensor): DiffusionSensor => {
      const normalizedSensor = {
        ...sensor,
        x: Number(sensor.x),
        y: Number(sensor.y),
      }
      const riskInput: SmartMapActiveSensorRiskInput = {
        id: typeof sensor.id === 'string' ? sensor.id : undefined,
        x: normalizedSensor.x,
        y: normalizedSensor.y,
        type: typeof sensor.type === 'string' ? sensor.type : undefined,
        priority: typeof sensor.priority === 'number' ? sensor.priority : undefined,
        risk: typeof sensor.risk === 'number' ? sensor.risk : undefined,
        detectionRange: typeof sensor.detectionRange === 'string' ? sensor.detectionRange : undefined,
        installationHeight: typeof sensor.installationHeight === 'number' ? sensor.installationHeight : undefined,
      }
      const nearestFacility = options.findNearestFacility(normalizedSensor.x, normalizedSensor.y)
      const { risk, priority } = options.computeSensorRisk(riskInput, nearestFacility)
      return {
        ...normalizedSensor,
        mode: sensor.mode || 'auto',
        risk,
        priority,
      }
    }),
    frames,
  ) as SmartMapActiveSensorSource[]

  const activeSensors = autoSampledSensors.map((sensor): SmartMapActiveSensor => {
    const autoSampledSeries = (sensor.sampledSeries || []).map(item => ({
      frameIndex: item.frameIndex,
      timeSec: item.timeSec,
      concentration: normalizeSeriesConcentration(item.concentration),
    }))

    if (!hasFrames && options.leakPoint) {
      for (let t = 0; t < 12; t += 1) {
        const timeSec = t * 10
        const timeFactor = Math.min(1, t / 6)
        const baseConc = options.computeGasConcentration(
          { x: Number(sensor.x), y: Number(sensor.y) },
          options.leakPoint,
          options.windSpeed,
          options.windDir,
          options.sourceRate,
        )
        autoSampledSeries.push({
          frameIndex: t,
          timeSec,
          concentration: baseConc * timeFactor,
        })
      }
    }

    const manualSeries = normalizeManualSeries(sensor.manualSeries, frames)
    const activeSeries = String(sensor.mode || 'auto') === 'manual' ? manualSeries : autoSampledSeries
    const sampledPeak = activeSeries.reduce((max, item) => Math.max(max, Number(item.concentration || 0)), 0)
    const lastSampleTime = Number(sensor.lastSampleTime)
    return {
      ...sensor,
      id: String(sensor.id),
      x: Number(sensor.x),
      y: Number(sensor.y),
      type: String(sensor.type || 'gas'),
      risk: Number(sensor.risk || 0),
      priority: Number(sensor.priority || 4),
      mode: String(sensor.mode || 'auto'),
      autoSampledSeries,
      manualSeries,
      sampledSeries: activeSeries,
      sampledPeak: Number(sampledPeak.toFixed(2)),
      sampledFrames: activeSeries.length,
      lastSampleTime: Number.isFinite(lastSampleTime) ? lastSampleTime : Date.now(),
    }
  })

  return mergeSmartMapSensorReadings(
    activeSensors as SmartMapSensorReadingTarget[],
    options.sensorReadingRecords,
  ) as TSensor[]
}

export function buildSmartMapSensorHistoryChart(
  sensor: SmartMapSensorSeriesRecord | null | undefined,
  options: SensorHistoryChartOptions,
): SmartMapSensorHistoryChart | null {
  if (!sensor?.sampledSeries?.length) return null
  const width = 280
  const padding = 16
  const top = 12
  const bottom = 80
  const maxConcentration = Math.max(
    Number(options.gas?.dangerThreshold || 1),
    ...sensor.sampledSeries.map(item => toSeriesValue(item, 'concentration')),
    1,
  )
  const maxFrameIndex = Math.max(sensor.sampledSeries.length - 1, 1)
  const xAt = (frameIndex: number) => padding + (frameIndex / maxFrameIndex) * (width - padding * 2)
  const yAt = (concentration: number) => (
    bottom - (Math.min(concentration, maxConcentration) / maxConcentration) * (bottom - top)
  )
  const current = getSmartMapSensorCurrentConcentration(sensor, options)
  return {
    padding,
    points: sensor.sampledSeries
      .map(item => `${xAt(toSeriesValue(item, 'frameIndex')).toFixed(1)},${yAt(toSeriesValue(item, 'concentration')).toFixed(1)}`)
      .join(' '),
    markerX: xAt(Math.min(options.frameIndex, maxFrameIndex)),
    markerY: yAt(current),
    warningY: yAt(Number(options.gas?.warningThreshold || 0)),
    dangerY: yAt(Number(options.gas?.dangerThreshold || 0)),
    currentLabel: `${current.toFixed(2)} ppm`,
    peakLabel: `${Number(sensor.sampledPeak || 0).toFixed(2)} ppm`,
    endLabel: `${toSeriesValue(sensor.sampledSeries[maxFrameIndex], 'timeSec').toFixed(0)}s`,
  }
}
