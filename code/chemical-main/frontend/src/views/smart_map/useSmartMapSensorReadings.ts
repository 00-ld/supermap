import { computed, reactive, ref } from 'vue'
import {
  reqRecentSensorReadings,
  type SensorReadingRecord,
} from '@/api/simulationMonitoring'
import type { SmartMapRecord } from './useSmartMapInversion'

export interface SmartMapSensorReadingTarget extends SmartMapRecord {
  id: string
  mode?: string | null
  sampledSeries?: SmartMapRecord[]
  autoSampledSeries?: SmartMapRecord[]
  sampledPeak?: number
  sampledFrames?: number
  lastSampleTime?: number | null
}

interface SmartMapSensorReadingOptions {
  getErrorMessage: (err: unknown, fallback?: string) => string
}

const SIMULATED_QUALITY = 'SIMULATED'
const SIMULATION_SOURCE = 'simulation'
export const SMART_MAP_MONITORING_DATA_TRUTH_MODE = 'simulation_only'

function toNumber(value: unknown, fallback = 0): number {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

function normalizeConcentration(value: unknown): number {
  return Number(Math.max(0, toNumber(value)).toFixed(2))
}

function readingTimeMs(reading: SensorReadingRecord): number | null {
  const timeValue = reading.sampledAt || reading.receivedAt
  if (!timeValue) return null
  const timeMs = new Date(timeValue).getTime()
  return Number.isFinite(timeMs) ? timeMs : null
}

function isSimulatedReading(reading: SensorReadingRecord): boolean {
  const source = String(reading.source || '').toLowerCase()
  const qualityStatus = String(reading.qualityStatus || '').toUpperCase()
  return source === SIMULATION_SOURCE || qualityStatus === SIMULATED_QUALITY
}

function buildSensorReadingObservationSource(reading: SensorReadingRecord): SmartMapRecord {
  const simulated = isSimulatedReading(reading)
  return {
    kind: simulated ? 'sensor_reading_simulated' : 'sensor_reading',
    label: simulated ? '后端 sensor_reading 仿真采样' : '后端非仿真读数（需来源审计）',
    trustedForRealValidation: false,
    simulated,
    manual: false,
    basis: simulated ? 'backend_sensor_reading_table' : 'backend_sensor_reading_table_requires_source_audit',
    source: reading.source || null,
    qualityStatus: reading.qualityStatus || null,
    sampledAt: reading.sampledAt || null,
    gasType: reading.gasType || null,
    unit: reading.unit || null,
  }
}

function buildSensorReadingSeries(readings: SensorReadingRecord[]): SmartMapRecord[] {
  const sortedReadings = [...readings].sort((left, right) => {
    const leftMs = readingTimeMs(left) ?? 0
    const rightMs = readingTimeMs(right) ?? 0
    return leftMs - rightMs
  })
  const firstMs = sortedReadings.map(readingTimeMs).find((timeMs): timeMs is number => timeMs !== null)
  return sortedReadings.map((reading, index) => {
    const timeMs = readingTimeMs(reading)
    return {
      frameIndex: index,
      timeSec: firstMs !== undefined && timeMs !== null ? Math.max(0, Math.round((timeMs - firstMs) / 1000)) : index * 60,
      concentration: normalizeConcentration(reading.concentration),
      sampledAt: reading.sampledAt || null,
      receivedAt: reading.receivedAt || null,
      gasType: reading.gasType || null,
      unit: reading.unit || 'ppm',
      source: reading.source || null,
      qualityStatus: reading.qualityStatus || null,
    }
  })
}

function groupReadingsBySensor(readings: SensorReadingRecord[]): Map<string, SensorReadingRecord[]> {
  return readings.reduce((groups, reading) => {
    const sensorId = String(reading.sensorId || '').trim()
    if (!sensorId) return groups
    const current = groups.get(sensorId) || []
    current.push(reading)
    groups.set(sensorId, current)
    return groups
  }, new Map<string, SensorReadingRecord[]>())
}

export function mergeSmartMapSensorReadings<TSensor extends SmartMapSensorReadingTarget>(
  sensors: TSensor[],
  readings: SensorReadingRecord[],
): TSensor[] {
  if (!readings.length || !sensors.length) return sensors
  const readingsBySensor = groupReadingsBySensor(readings)
  return sensors.map((sensor) => {
    const sensorReadings = readingsBySensor.get(sensor.id)
    if (!sensorReadings?.length) return sensor
    const series = buildSensorReadingSeries(sensorReadings)
    const latestReading = [...sensorReadings].sort((left, right) => (readingTimeMs(right) ?? 0) - (readingTimeMs(left) ?? 0))[0]
    const sampledPeak = series.reduce((peak, item) => Math.max(peak, toNumber(item.concentration)), 0)
    const usesManualSeries = String(sensor.mode || '').toLowerCase() === 'manual'
    return {
      ...sensor,
      sourceType: 'sensor_reading',
      readingSource: latestReading.source || null,
      qualityStatus: latestReading.qualityStatus || null,
      backendSensorReadingCount: sensorReadings.length,
      backendSensorReadingLatestAt: latestReading.sampledAt || latestReading.receivedAt || null,
      backendSensorReadingGasType: latestReading.gasType || null,
      backendSensorReadingUnit: latestReading.unit || 'ppm',
      observationSource: buildSensorReadingObservationSource(latestReading),
      autoSampledSeries: series,
      sampledSeries: usesManualSeries ? sensor.sampledSeries : series,
      sampledPeak: Number(sampledPeak.toFixed(2)),
      sampledFrames: series.length,
      lastSampleTime: readingTimeMs(latestReading) || sensor.lastSampleTime || Date.now(),
    } as TSensor
  })
}

export function summarizeSmartMapSensorReadings(readings: SensorReadingRecord[]) {
  const sensorIds = new Set(readings.map(reading => String(reading.sensorId || '').trim()).filter(Boolean))
  const simulatedCount = readings.filter(isSimulatedReading).length
  return {
    totalCount: readings.length,
    sensorCount: sensorIds.size,
    simulatedCount,
    realCandidateCount: readings.length - simulatedCount,
    allSimulated: readings.length > 0 && simulatedCount === readings.length,
  }
}

export function useSmartMapSensorReadings(options: SmartMapSensorReadingOptions) {
  const sensorReadingRecords = ref<SensorReadingRecord[]>([])
  const sensorReadingLoadState = reactive({
    loading: false,
    loaded: false,
    error: '',
  })
  const sensorReadingSummary = computed(() => summarizeSmartMapSensorReadings(sensorReadingRecords.value))

  const loadSensorReadings = async (limit = 200) => {
    sensorReadingLoadState.loading = true
    sensorReadingLoadState.error = ''
    try {
      const response = await reqRecentSensorReadings({ limit })
      sensorReadingRecords.value = response.code === 200 && Array.isArray(response.data) ? response.data : []
      sensorReadingLoadState.loaded = true
      return sensorReadingRecords.value
    } catch (err: unknown) {
      sensorReadingLoadState.error = options.getErrorMessage(err, '后端 sensor_reading 读取失败')
      sensorReadingRecords.value = []
      return []
    } finally {
      sensorReadingLoadState.loading = false
    }
  }

  return {
    sensorReadingLoadState,
    sensorReadingRecords,
    sensorReadingSummary,
    loadSensorReadings,
  }
}
