<template>
  <div class="supermap2d-layer" aria-label="SuperMap iServer 2D base map">
    <div ref="mapRootRef" class="supermap2d-map"></div>
    <div class="supermap2d-status" :class="statusClass">
      <span class="status-dot"></span>
      <div>
        <strong>{{ statusTitle }}</strong>
        <span>{{ statusDetail }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@supermap/iclient-leaflet/dist/iclient-leaflet.css'
import { nonEarthCRS, tiledMapLayer } from '@supermap/iclient-leaflet'
import {
  SUPERMAP_CGCS2000_COORD_SYS,
  SUPERMAP_CGCS2000_EPSG,
  SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
  SUPERMAP_LOCAL_COORD_SYS,
} from '@/data/supermapGeoreference'

const parkMapName = '建筑单体校核图_CN'
const cgcs2000ParkMapName = '建筑单体校核图_CGCS2000'
const encodedParkMapName = encodeURIComponent(parkMapName)
const encodedCgcs2000ParkMapName = encodeURIComponent(cgcs2000ParkMapName)
const isCgcs2000Mode =
  String(import.meta.env.VITE_SUPERMAP_COORD_SYS || '').toUpperCase() ===
    SUPERMAP_CGCS2000_COORD_SYS ||
  [SUPERMAP_CGCS2000_EPSG, SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG].includes(
    Number(
      import.meta.env.VITE_SUPERMAP_2D_EPSG ||
        import.meta.env.VITE_SUPERMAP_EPSG ||
        0,
    ),
  )
const defaultMapUrl = isCgcs2000Mode
  ? `/supermap-iserver/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/${encodedCgcs2000ParkMapName}`
  : `/supermap-iserver/iserver/services/map-chemical_park_vectors_cn/rest/maps/${encodedParkMapName}`
const mapUrl = import.meta.env.VITE_SUPERMAP_2D_MAP_URL || defaultMapUrl
const mapName =
  import.meta.env.VITE_SUPERMAP_2D_MAP_NAME ||
  (isCgcs2000Mode ? cgcs2000ParkMapName : parkMapName)
const epsgCode = Number(
  import.meta.env.VITE_SUPERMAP_2D_EPSG ||
    import.meta.env.VITE_SUPERMAP_EPSG ||
    (isCgcs2000Mode ? SUPERMAP_CGCS2000_EPSG : -1000),
)
const coordSys = String(
  import.meta.env.VITE_SUPERMAP_COORD_SYS ||
    (isCgcs2000Mode ? SUPERMAP_CGCS2000_COORD_SYS : SUPERMAP_LOCAL_COORD_SYS),
)
const defaultBounds = isCgcs2000Mode
  ? epsgCode === SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG
    ? { left: 113.5345, bottom: 34.8174, right: 113.5459, top: 34.8228 }
    : {
        left: 457752.343,
        bottom: 3855297.972,
        right: 459339.543,
        top: 3856245.172,
      }
  : { left: 0, bottom: 0, right: 1587.2, top: 947.2 }
const mapBounds = {
  left: Number(import.meta.env.VITE_SUPERMAP_2D_LEFT || defaultBounds.left),
  bottom: Number(
    import.meta.env.VITE_SUPERMAP_2D_BOTTOM || defaultBounds.bottom,
  ),
  right: Number(import.meta.env.VITE_SUPERMAP_2D_RIGHT || defaultBounds.right),
  top: Number(import.meta.env.VITE_SUPERMAP_2D_TOP || defaultBounds.top),
}

const mapRootRef = ref<HTMLDivElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const statusMessage = ref('正在加载本地高清模型轮廓底图')

let map: L.Map | null = null
let baseLayer: L.Layer | null = null
let firstTileLoaded = false

const statusClass = computed(() => ({
  ready: status.value === 'ready',
  error: status.value === 'error',
}))
const statusTitle = computed(() => {
  if (status.value === 'ready') return 'SuperMap iClient2D 已加载'
  if (status.value === 'error') return 'SuperMap 二维底图异常'
  return 'SuperMap iClient2D 加载中'
})
const statusDetail = computed(() => statusMessage.value)

onMounted(async () => {
  await nextTick()
  initializeMap()
})

onUnmounted(() => {
  if (baseLayer) {
    baseLayer.off()
    baseLayer.remove()
    baseLayer = null
  }
  if (map) {
    map.remove()
    map = null
  }
})

async function initializeMap() {
  const root = mapRootRef.value
  if (!root) return
  try {
    map = L.map(root, {
      attributionControl: false,
      boxZoom: true,
      center: [
        (mapBounds.top + mapBounds.bottom) / 2,
        (mapBounds.left + mapBounds.right) / 2,
      ],
      crs: createMapCrs(),
      doubleClickZoom: true,
      dragging: true,
      keyboard: true,
      maxZoom: 18,
      minZoom: -2,
      preferCanvas: true,
      scrollWheelZoom: true,
      touchZoom: true,
      zoom: 0,
      zoomControl: true,
    })

    map.fitBounds(
      [
        [mapBounds.bottom, mapBounds.left],
        [mapBounds.top, mapBounds.right],
      ],
      { animate: false, padding: [0, 0] },
    )

    const baseLayerResult = createBaseLayer()
    baseLayer = baseLayerResult.layer
    baseLayer.on(baseLayerResult.readyEvent, () => {
      if (firstTileLoaded) return
      firstTileLoaded = true
      status.value = 'ready'
      statusMessage.value = baseLayerResult.detail
    })
    baseLayer.on('error tileerror', () => {
      if (firstTileLoaded) return
      status.value = 'error'
      statusMessage.value = `EPSG:${epsgCode} 本地高清底图不可用`
    })
    baseLayer.addTo(map)

    window.setTimeout(() => {
      map?.invalidateSize()
      if (!firstTileLoaded && status.value !== 'error') {
        statusMessage.value = `等待 ${mapName} 米制地图返回`
      }
    }, 300)
  } catch (error) {
    status.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'iClient2D 初始化失败'
  }
}

interface BaseLayerResult {
  layer: L.Layer
  detail: string
  readyEvent: 'load' | 'tileload'
}

function createBaseLayer(): BaseLayerResult {
  if (import.meta.env.VITE_FEATURE_LOCAL_2D_MAP !== 'false') {
    if (epsgCode !== SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG) {
      throw new Error(
        `本地模型底图要求 EPSG:${SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG}`,
      )
    }
    return {
      layer: L.imageOverlay('/data/Park_S3MObjectFootprint_4490.webp', [
        [mapBounds.bottom, mapBounds.left],
        [mapBounds.top, mapBounds.right],
      ]),
      detail: `本地高清模型底图 · CGCS2000 geographic · EPSG:${epsgCode}`,
      readyEvent: 'load',
    }
  }
  if (import.meta.env.VITE_FEATURE_ISERVER_2D_TILES === 'false') {
    return {
      layer: L.imageOverlay(createSuperMapImageUrl(), [
        [mapBounds.bottom, mapBounds.left],
        [mapBounds.top, mapBounds.right],
      ]),
      detail: `iServer 高清地图图像/${mapName} · ${coordSys} · EPSG:${epsgCode}`,
      readyEvent: 'load',
    }
  }
  return {
    layer: tiledMapLayer(mapUrl, {
      cacheEnabled: true,
      noWrap: true,
      transparent: true,
      tileSize: 256,
      updateWhenZooming: true,
      updateWhenIdle: false,
    }),
    detail: `iServer 园区二维地图/${mapName} · ${coordSys} · EPSG:${epsgCode}`,
    readyEvent: 'tileload',
  }
}

function createSuperMapImageUrl() {
  const viewBounds = {
    leftBottom: {
      x: mapBounds.left,
      y: mapBounds.bottom,
    },
    rightTop: {
      x: mapBounds.right,
      y: mapBounds.top,
    },
  }
  // 高分辨率请求：原 1600×954 在副屏小框或放大时模糊，提升到 3200×1908（4 倍像素）。
  const boundsWidth = Math.abs(mapBounds.right - mapBounds.left)
  const boundsHeight = Math.abs(mapBounds.top - mapBounds.bottom)
  const targetWidth = 3200
  const targetHeight = Math.round(
    (targetWidth * boundsHeight) / Math.max(boundsWidth, 1),
  )
  const params = new URLSearchParams({
    redirect: 'false',
    transparent: 'false',
    cacheEnabled: 'true',
    width: String(targetWidth),
    height: String(targetHeight),
    viewBounds: JSON.stringify(viewBounds),
  })
  return `${mapUrl.replace(/\/+$/, '')}/image.png?${params.toString()}`
}

function createMapCrs(): L.CRS {
  if (epsgCode === -1000 || epsgCode === SUPERMAP_CGCS2000_EPSG) {
    return nonEarthCRS({
      bounds: L.bounds(
        L.point(mapBounds.left, mapBounds.bottom),
        L.point(mapBounds.right, mapBounds.top),
      ),
      origin: L.point(mapBounds.left, mapBounds.top),
    }) as L.CRS
  }
  if (epsgCode === 3857) return L.CRS.EPSG3857
  if (epsgCode === SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG) return L.CRS.EPSG4326
  return L.CRS.EPSG4326
}
</script>

<style scoped>
.supermap2d-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #050814;
  pointer-events: auto;
}

.supermap2d-map {
  width: 100%;
  height: 100%;
}

.supermap2d-map :deep(.leaflet-pane),
.supermap2d-map :deep(.leaflet-top),
.supermap2d-map :deep(.leaflet-bottom) {
  pointer-events: auto;
}

.supermap2d-status {
  position: absolute;
  left: 16px;
  top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: min(320px, calc(100% - 32px));
  padding: 8px 10px;
  border: 1px solid rgba(147, 167, 189, 0.28);
  border-radius: 8px;
  background: rgba(6, 12, 24, 0.72);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.24);
  color: #d8e1ec;
  font-size: 11px;
  backdrop-filter: blur(12px);
}

.supermap2d-status strong,
.supermap2d-status span {
  display: block;
  line-height: 1.35;
}

.supermap2d-status span {
  color: rgba(216, 225, 236, 0.72);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: #c2a46d;
  box-shadow: 0 0 12px rgba(194, 164, 109, 0.55);
}

.supermap2d-status.ready .status-dot {
  background: #93a7bd;
  box-shadow: 0 0 12px rgba(147, 167, 189, 0.62);
}

.supermap2d-status.error .status-dot {
  background: #c78282;
  box-shadow: 0 0 12px rgba(199, 130, 130, 0.62);
}
</style>
