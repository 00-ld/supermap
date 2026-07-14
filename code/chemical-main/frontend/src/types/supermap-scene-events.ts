export interface SuperMapProjectedPoint4547 {
  x: number
  y: number
  easting: number
  northing: number
  epsg: 4547
  coordSys: 'CGCS2000_3GK_CM_114E'
}

export interface SuperMapScenePickEventPayload {
  selectedObjectId: string
  selectedObjectName?: string
  projectedPoint: SuperMapProjectedPoint4547 | null
  heightMeters: number | null
  source: 'supermap-iclient3d-pick'
  rawProperties: Record<string, string | number | boolean | null>
}
