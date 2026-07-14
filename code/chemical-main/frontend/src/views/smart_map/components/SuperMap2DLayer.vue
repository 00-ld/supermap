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
  SUPERMAP_LOCAL_COORD_SYS,
} from '@/data/supermapGeoreference'

const parkMapName = '建筑单体校核图_CN'
const cgcs2000ParkMapName = '建筑单体校核图_CGCS2000'
const encodedParkMapName = encodeURIComponent(parkMapName)
const encodedCgcs2000ParkMapName = encodeURIComponent(cgcs2000ParkMapName)
const isCgcs2000Mode = String(import.meta.env.VITE_SUPERMAP_COORD_SYS || '').toUpperCase() === SUPERMAP_CGCS2000_COORD_SYS
  || Number(import.meta.env.VITE_SUPERMAP_EPSG || 0) === SUPERMAP_CGCS2000_EPSG
const defaultMapUrl = isCgcs2000Mode
  ? `/supermap-iserver/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/${encodedCgcs2000ParkMapName}`
  : `/supermap-iserver/iserver/services/map-chemical_park_vectors_cn/rest/maps/${encodedParkMapName}`
const mapUrl = import.meta.env.VITE_SUPERMAP_2D_MAP_URL || defaultMapUrl
const mapName = import.meta.env.VITE_SUPERMAP_2D_MAP_NAME || (isCgcs2000Mode ? cgcs2000ParkMapName : parkMapName)
const epsgCode = Number(import.meta.env.VITE_SUPERMAP_2D_EPSG || import.meta.env.VITE_SUPERMAP_EPSG || (isCgcs2000Mode ? SUPERMAP_CGCS2000_EPSG : -1000))
const coordSys = String(import.meta.env.VITE_SUPERMAP_COORD_SYS || (isCgcs2000Mode ? SUPERMAP_CGCS2000_COORD_SYS : SUPERMAP_LOCAL_COORD_SYS))
const defaultBounds = isCgcs2000Mode
  ? { left: 457752.343, bottom: 3855297.972, right: 459339.543, top: 3856245.172 }
  : { left: 0, bottom: 0, right: 1587.2, top: 947.2 }
const mapBounds = {
  left: Number(import.meta.env.VITE_SUPERMAP_2D_LEFT || defaultBounds.left),
  bottom: Number(import.meta.env.VITE_SUPERMAP_2D_BOTTOM || defaultBounds.bottom),
  right: Number(import.meta.env.VITE_SUPERMAP_2D_RIGHT || defaultBounds.right),
  top: Number(import.meta.env.VITE_SUPERMAP_2D_TOP || defaultBounds.top),
}

const mapRootRef = ref<HTMLDivElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const statusMessage = ref('正在连接 iServer 二维地图服务')

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

function initializeMap() {
  const root = mapRootRef.value
  if (!root) return
  try {
    map = L.map(root, {
      attributionControl: false,
      boxZoom: false,
      center: [(mapBounds.top + mapBounds.bottom) / 2, (mapBounds.left + mapBounds.right) / 2],
      crs: createMapCrs(),
      doubleClickZoom: false,
      dragging: false,
      keyboard: false,
      maxZoom: 8,
      minZoom: -2,
      preferCanvas: true,
      scrollWheelZoom: false,
      touchZoom: false,
      zoom: 0,
      zoomControl: false,
    })

    baseLayer = createBaseLayer().addTo(map)
    map.fitBounds([
      [mapBounds.bottom, mapBounds.left],
      [mapBounds.top, mapBounds.right],
    ], { animate: false, padding: [0, 0] })

    baseLayer.on('load tileload', () => {
      if (firstTileLoaded) return
      firstTileLoaded = true
      status.value = 'ready'
      statusMessage.value = `iServer 园区二维地图/${mapName} · ${coordSys} · EPSG:${epsgCode}`
    })
    baseLayer.on('error tileerror', () => {
      if (firstTileLoaded) return
      status.value = 'error'
      statusMessage.value = '地图图像请求失败，请检查 iServer 服务'
    })

    window.setTimeout(() => {
      map?.invalidateSize()
      if (!firstTileLoaded && status.value !== 'error') {
        statusMessage.value = `等待 ${mapName} 米制地图返回`
      }
    }, 300)
  } catch (error) {
    status.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'iClient2D 初始化失败'
  }
}

function createBaseLayer(): L.Layer {
  if (epsgCode === -1000 || epsgCode === SUPERMAP_CGCS2000_EPSG) {
    const imageBounds: L.LatLngBoundsExpression = [
      [mapBounds.bottom, mapBounds.left],
      [mapBounds.top, mapBounds.right],
    ]
    return L.imageOverlay(createSuperMapImageUrl(), imageBounds, {
      interactive: false,
      opacity: 1,
    })
  }
  return tiledMapLayer(mapUrl, {
    cacheEnabled: true,
    noWrap: true,
    prjCoordSys: { epsgCode },
    transparent: false,
  })
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
  const params = new URLSearchParams({
    redirect: 'false',
    transparent: 'false',
    cacheEnabled: 'true',
    width: '1600',
    height: '954',
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
  pointer-events: none;
}

.supermap2d-map {
  width: 100%;
  height: 100%;
  filter: saturate(0.85) brightness(0.72) contrast(1.08);
}

.supermap2d-map :deep(.leaflet-pane),
.supermap2d-map :deep(.leaflet-top),
.supermap2d-map :deep(.leaflet-bottom) {
  pointer-events: none;
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
