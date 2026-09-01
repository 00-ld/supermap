import { MODEL_MONITOR_POINTS } from './modelMonitorPoints.generated'
import {
  filterModelBoundMonitorPointsIn,
  filterMonitorPointsInsideBounds,
  isModelBoundMonitorPointIn,
  selectMonitorPointsByGrid,
  type MonitorPointIdentity,
} from './modelMonitorPointPolicyCore'

const OPERATIONAL_GRID_SIZE_METERS = 70
export const OPERATIONAL_MODEL_INTERIOR_BOUNDS = {
  minX: 25,
  maxX: 975,
  minY: 40,
  maxY: 460,
} as const

// 583 个模型绑定候选位全部保留用于查询；二维展示和溯源观测采用每个 70m
// 网格内最靠近中心的真实模型点，避免同一设备边缘连续布几十个重复监控点。
export const OPERATIONAL_MODEL_MONITOR_POINTS = selectMonitorPointsByGrid(
  filterMonitorPointsInsideBounds(
    MODEL_MONITOR_POINTS,
    OPERATIONAL_MODEL_INTERIOR_BOUNDS,
  ),
  OPERATIONAL_GRID_SIZE_METERS,
)

const MODEL_MONITOR_POINT_IDS = new Set(
  MODEL_MONITOR_POINTS.map((point) => point.id),
)

export function isModelBoundMonitorPoint(
  sensor: MonitorPointIdentity,
): boolean {
  return isModelBoundMonitorPointIn(sensor, MODEL_MONITOR_POINT_IDS)
}

export function filterModelBoundMonitorPoints<T extends MonitorPointIdentity>(
  sensors: T[],
): T[] {
  return filterModelBoundMonitorPointsIn(sensors, MODEL_MONITOR_POINT_IDS)
}
