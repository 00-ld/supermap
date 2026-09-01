import type {
  SuperMapCupGeoPoint,
  SuperMapCupMapPoint,
} from '@/data/supermapCupScenario'

export type SensorPlacementDraft = {
  modelId: string
  installationHeight: number
  effectiveRange: number
}

export type SensorPlacementPayload = {
  mapPoint: SuperMapCupMapPoint
  geoPoint: SuperMapCupGeoPoint
  scenePoint?: { x: number; y: number; z: number }
  draft: SensorPlacementDraft
}
