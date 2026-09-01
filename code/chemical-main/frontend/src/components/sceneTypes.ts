/**
 * SuperMapSceneViewer 场景类型定义。
 *
 * 从 SuperMapSceneViewer.vue 抽离的纯类型声明，
 * 供主组件与 constants.ts / composables 共享。
 */

import type { SuperMapCupMapPoint } from '@/data/supermapCupScenario'

/** 相机快照（可来自 ECEF 球面或局部 S3M 坐标系）。 */
export type LocalCameraSnapshot = {
  position: { x: number; y: number; z: number }
  direction?: { x: number; y: number; z: number }
  up?: { x: number; y: number; z: number }
  coordinateSpace?: 'ecef' | 'local-s3m'
}

/** Three Tiles 地理参考锚点（根矩阵 + 缩放 + 锚点经纬高）。 */
export type ThreeTilesGeoreference = {
  transform: number[]
  sourceXOrigin: number
  sourceYOrigin: number
  scaleX: number
  scaleY: number
  scaleZ: number
  anchor: {
    longitude: number
    latitude: number
    height: number
  }
  viewCenter: {
    longitude: number
    latitude: number
    altitude: number
  }
}

/** 传感器布设规则匹配后的设施归属。 */
export type FacilityPlacementRule = {
  facilityId: string
  pattern?: 'grid' | 'tank' | 'tower' | 'edge' | 'center'
}

/** Three Tiles 设施种类。 */
export type ThreeTilesEquipmentKind =
  | 'tank'
  | 'tower'
  | 'building'
  | 'pipeRack'
  | 'pumpSkid'
  | 'road'
  | 'utility'

/** Three Tiles 设施锚点（带地图坐标与朝向）。 */
export type ThreeTilesEquipmentAnchor = {
  id: string
  label: string
  kind: ThreeTilesEquipmentKind
  point: SuperMapCupMapPoint
  height?: number
  direction?: { x: number; y: number }
}
