export interface EmergencyMapPoint {
  x: number
  y: number
}

export interface EmergencySourceAnchor {
  id: string
  label: string
  facilityId: string
  point: EmergencyMapPoint
  basis: string
}

/**
 * 二维 DOM、iServer LOCALMAP 与园区 3D Tiles 共用的业务锚点。
 *
 * 坐标单位为米，统一使用 4490 模型 ENU 派生的算法画布坐标。
 * 二维 DOM 先通过四角锚点配准到该画布，三维端再由同一模型 ENU 还原，
 * 禁止继续混用旧 DOM 分析坐标，否则切换源点时三维无法匹配设备。
 */
export const EMERGENCY_SOURCE_ANCHORS: readonly EmergencySourceAnchor[] =
  LEAK_SOURCE_ANCHORS_4490.map((source) => ({
    id: source.leakSourceId,
    label: source.name,
    facilityId: source.facilityId,
    point: leakSourceToAlgorithmPoint(source),
    basis: `${source.modelDataset} / SmID=${source.modelSmId} / ${source.modelName}`,
  }))

export const DEFAULT_EMERGENCY_SOURCE_ID = 'model-leak-smid-3'

export function getEmergencySourceAnchor(id: string) {
  return (
    EMERGENCY_SOURCE_ANCHORS.find((anchor) => anchor.id === id) ||
    EMERGENCY_SOURCE_ANCHORS[0]
  )
}
import {
  LEAK_SOURCE_ANCHORS_4490,
  leakSourceToAlgorithmPoint,
} from '../config/spatialAssets'
