import type { Ref } from 'vue'
import type { SensorRecord } from '@/api/sensor'
import type { SensorReadingRecord } from '@/api/simulationMonitoring'
import type { DiffusionFrame } from '@/data/phase1Config'
import {
  computeSmartMapLightweightGasConcentration,
  normalizeSmartMapPoint,
} from './smartMapLightweightConcentration'
import type { SmartMapPoint, SmartMapRecord, SmartMapSeriesPoint } from './useSmartMapInversion'
import {
  buildFrameSeriesTemplate as buildSmartMapFrameSeriesTemplate,
  normalizeManualSeries as normalizeSmartMapManualSeries,
} from './useSmartMapInversion'
import {
  buildSmartMapActiveSensorSeries,
  buildSmartMapSensorHistoryChart,
  getSmartMapSensorAlarmLevel,
  getSmartMapSensorAutoConcentration,
  getSmartMapSensorCurrentConcentration,
  type SmartMapActiveSensor,
  type SmartMapActiveSensorSource,
  type SmartMapSensorGasThreshold,
  type SmartMapSensorSeriesRecord,
} from './useSmartMapSensorSeries'

interface SmartMapSensorSeriesDiffusionState {
  currentFrame: number
}

interface SmartMapSensorSeriesDiffusionForm {
  gasId: string
  sourceRate: number
}

interface SmartMapSensorSeriesWeatherState {
  windSpeed: number
  windDir: number
}

interface SmartMapSensorSeriesDiffusionMeta {
  sourcePoint?: unknown
  gas?: SmartMapSensorGasThreshold | null
}

interface SmartMapSensorSeriesGas extends SmartMapSensorGasThreshold {
  densityRatio?: unknown
  diffusionBias?: unknown
}

interface SmartMapSensorSeriesActionsOptions<TSensor extends SensorRecord & SmartMapActiveSensor, TFacility> {
  sensors: Ref<TSensor[]>
  selectedSensor: Ref<TSensor | null>
  diffusionFrames: Ref<DiffusionFrame[]>
  currentDiffusionFrame: Ref<DiffusionFrame | null>
  diffusionMeta: Ref<SmartMapSensorSeriesDiffusionMeta>
  diffusionState: SmartMapSensorSeriesDiffusionState
  diffusionForm: SmartMapSensorSeriesDiffusionForm
  weatherState: Ref<SmartMapSensorSeriesWeatherState>
  sensorReadingRecords: Ref<SensorReadingRecord[]>
  getCurrentLeakSourcePoint: () => SmartMapPoint | null
  getGasById: (gasId: string) => SmartMapSensorSeriesGas
  getFrameConcentrationAtPoint: (frame: DiffusionFrame, x: number, y: number) => number
  findNearestFacility: (x: number, y: number) => TFacility
  computeSensorRisk: (
    sensor: {
      id?: string
      x?: number
      y?: number
      type?: string
      priority?: number
      risk?: number
      detectionRange?: string
      installationHeight?: number
    },
    nearestFacility: TFacility,
  ) => { risk: number; priority: number }
  showSensorInfo: (sensor: TSensor) => void
  syncSensorEditorState: (sensor: TSensor | null) => void
}

export function useSmartMapSensorSeriesActions<TSensor extends SensorRecord & SmartMapActiveSensor, TFacility>(
  options: SmartMapSensorSeriesActionsOptions<TSensor, TFacility>,
) {
  function getSensorCurrentConcentration(
    sensor: TSensor | SmartMapSensorSeriesRecord,
    frameIndex = options.diffusionState.currentFrame,
  ) {
    return getSmartMapSensorCurrentConcentration(sensor as SmartMapSensorSeriesRecord, {
      frameIndex,
      currentFrame: options.currentDiffusionFrame.value,
      getFrameConcentrationAtPoint: options.getFrameConcentrationAtPoint,
    })
  }

  function getSensorAutoConcentration(sensor: TSensor, frameIndex = options.diffusionState.currentFrame) {
    return getSmartMapSensorAutoConcentration(sensor, frameIndex)
  }

  function getSensorAlarmLevel(concentration: number, gas: SmartMapSensorGasThreshold | null | undefined) {
    return getSmartMapSensorAlarmLevel(concentration, gas)
  }

  function buildFrameSeriesTemplate(frames: DiffusionFrame[] = options.diffusionFrames.value): SmartMapSeriesPoint[] {
    return buildSmartMapFrameSeriesTemplate(frames)
  }

  function normalizeManualSeries(
    manualSeries: SmartMapRecord[] = [],
    frames: DiffusionFrame[] = options.diffusionFrames.value,
  ): SmartMapSeriesPoint[] {
    return normalizeSmartMapManualSeries(manualSeries, frames)
  }

  function buildActiveSensorSeries(
    sensorList: Array<SensorRecord | SmartMapRecord>,
    frames: DiffusionFrame[] = options.diffusionFrames.value,
  ): TSensor[] {
    const leakPoint = options.getCurrentLeakSourcePoint()
      || (options.diffusionMeta.value?.sourcePoint ? normalizeSmartMapPoint(options.diffusionMeta.value.sourcePoint) : null)
    return buildSmartMapActiveSensorSeries<TSensor, TFacility>(
      sensorList as SmartMapActiveSensorSource[],
      {
        frames,
        leakPoint,
        windSpeed: options.weatherState.value.windSpeed,
        windDir: options.weatherState.value.windDir,
        sourceRate: Number(options.diffusionForm.sourceRate || 50),
        sensorReadingRecords: options.sensorReadingRecords.value,
        findNearestFacility: options.findNearestFacility,
        computeSensorRisk: options.computeSensorRisk,
        computeGasConcentration: (sensor, leakPointValue, windSpeed, windDir, sourceRate) =>
          computeSmartMapLightweightGasConcentration({
            gas: options.getGasById(options.diffusionForm.gasId),
            leakPoint: leakPointValue,
            sensor,
            sourceRate,
            windDir,
            windSpeed,
          }),
      },
    )
  }

  function buildSensorHistoryChart(sensor: TSensor | null | undefined) {
    return buildSmartMapSensorHistoryChart(sensor, {
      frameIndex: options.diffusionState.currentFrame,
      currentFrame: options.currentDiffusionFrame.value,
      getFrameConcentrationAtPoint: options.getFrameConcentrationAtPoint,
      gas: options.diffusionMeta.value.gas || options.getGasById(options.diffusionForm.gasId),
    })
  }

  function resampleSensorsFromDiffusion() {
    options.sensors.value = buildActiveSensorSeries(options.sensors.value, options.diffusionFrames.value)
    if (options.selectedSensor.value) {
      const selected = options.selectedSensor.value
      const next = options.sensors.value.find(sensor => sensor.id === selected.id) || null
      options.selectedSensor.value = next
      if (next) options.showSensorInfo(next)
      else options.syncSensorEditorState(null)
    } else {
      options.syncSensorEditorState(null)
    }
  }

  function seedDemoSensors() {
    // 不再自动生成传感器，全部由用户手动添加
    options.sensors.value = []
  }

  return {
    buildActiveSensorSeries,
    buildFrameSeriesTemplate,
    buildSensorHistoryChart,
    getSensorAlarmLevel,
    getSensorAutoConcentration,
    getSensorCurrentConcentration,
    normalizeManualSeries,
    resampleSensorsFromDiffusion,
    seedDemoSensors,
  }
}
