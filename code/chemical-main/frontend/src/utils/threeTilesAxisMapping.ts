export interface LocalPlanarPoint {
  x: number
  y: number
}

export interface ThreeTilesLocalPoint {
  x: number
  y: number
  z: number
}

/**
 * Convert the legacy S3M planar axes into the published park tileset axes.
 *
 * LOCALMAP/S3M: X east, Y north.
 * Published 3D Tiles: X east, Y up, Z south.
 */
export function mapLocalPlaneToThreeTilesAxes(
  point: LocalPlanarPoint,
): ThreeTilesLocalPoint {
  return {
    x: point.x,
    y: 0,
    z: -point.y,
  }
}
