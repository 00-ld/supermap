declare module '@supermap/iclient-leaflet' {
  import type L from 'leaflet'

  export function nonEarthCRS(options: {
    bounds: L.Bounds
    origin: L.Point
    resolutions?: number[]
  }): L.CRS

  export function tiledMapLayer(
    url: string,
    options?: L.TileLayerOptions & {
      cacheEnabled?: boolean
      noWrap?: boolean
      prjCoordSys?: { epsgCode: number }
      transparent?: boolean
    },
  ): L.TileLayer
}
