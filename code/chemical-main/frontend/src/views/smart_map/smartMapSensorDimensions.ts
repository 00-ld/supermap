import {
  MANUAL_SENSOR_DEFAULTS,
  normalizeSmartMapManualSensorNumber,
} from './useSmartMapSensorPlacement'
import { sensorTypes } from '@/data/sensorCatalog'
import { getSmartMapPriorityColor } from './useSmartMapSensorPlacementRules'

export interface SmartMapSensorDimensionInput {
  installationHeight?: unknown
  effectiveRange?: unknown
  detectionRange?: string | null
  installRemark?: string | null
}

export function resolveSmartMapSensorInstallationHeight(
  sensor: SmartMapSensorDimensionInput | null | undefined,
) {
  return normalizeSmartMapManualSensorNumber(
    sensor?.installationHeight,
    MANUAL_SENSOR_DEFAULTS.installationHeight,
    0.3,
    10,
    1,
  )
}

export function resolveSmartMapSensorEffectiveRange(
  sensor: SmartMapSensorDimensionInput | null | undefined,
  fallbackRadius: number = MANUAL_SENSOR_DEFAULTS.effectiveRange,
) {
  return normalizeSmartMapManualSensorNumber(
    sensor?.effectiveRange,
    fallbackRadius,
    0,
    20,
    0,
  )
}

export function resolveSmartMapSensorDetectionRange(
  sensor: SmartMapSensorDimensionInput | null | undefined,
) {
  return sensor?.detectionRange?.trim() || MANUAL_SENSOR_DEFAULTS.detectionRange
}

export function resolveSmartMapSensorInstallRemark(
  sensor: SmartMapSensorDimensionInput | null | undefined,
) {
  return sensor?.installRemark?.trim() || MANUAL_SENSOR_DEFAULTS.installRemark
}

export function createSmartMapSensorRenderRules() {
  return {
    sensorTypes,
    defaultRange: MANUAL_SENSOR_DEFAULTS.effectiveRange,
    resolveRange: resolveSmartMapSensorEffectiveRange,
    getPriorityColor: getSmartMapPriorityColor,
  }
}
