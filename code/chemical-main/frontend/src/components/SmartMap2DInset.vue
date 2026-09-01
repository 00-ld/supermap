<template>
  <aside class="smart-map-inset" :class="{ 'is-primary': isPrimary }" aria-label="SuperMap 二维应急地图">
    <header>
      <div>
        <strong>SuperMap 二维应急地图</strong>
        <span>拖拽平移 · 滚轮缩放 · 与三维共用泄漏源锚点</span>
      </div>
      <b v-if="diffusion">峰值 {{ diffusion.peakConcentration.toFixed(1) }} ppm</b>
      <b v-else-if="inversion">溯源结果</b>
      <b v-else-if="source">泄漏源已锚定</b>
    </header>
    <div ref="mapRootRef" class="map-root"></div>
    <footer>
      <span v-if="diffusion">红：高浓度 · 黄：中浓度 · 蓝：低浓度</span>
      <span v-else-if="inversion">橙色十字：粒子滤波估计源点</span>
      <span v-else-if="source">红色圆点：当前扩散原点</span>
      <span v-else>SuperMap iServer 二维底图</span>
      <b>{{ statusText }}</b>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nonEarthCRS } from '@supermap/iclient-leaflet'
import {
  ALGORITHM_FRAME,
  SUPERMAP_CGCS2000_COORD_SYS,
  SUPERMAP_CGCS2000_EPSG,
  SUPERMAP_LOCAL_COORD_SYS,
} from '@/data/supermapGeoreference'

// iServer 数据集真实锚点 D 的投影值（supermapGeoreference SUPERMAP_ISERVER_DATA_ANCHOR）
const DEFAULT_ISERVER_ANCHOR_PROJECTED = {
  easting: 457752.343,
  northing: 3856245.172,
}

export type SmartMapDiffusionOverlay = {
  source: { x: number; y: number }
  cells: Array<{ x: number; y: number; size: number; concentration: number }>
  peakConcentration: number
}

export type SmartMapInversionOverlay = {
  point: { x: number; y: number }
  radiusMeters: number
}

const props = defineProps<{
  diffusion?: SmartMapDiffusionOverlay | null
  inversion?: SmartMapInversionOverlay | null
  source?: { x: number; y: number } | null
  isPrimary?: boolean
}>()

const parkMapName = '建筑单体校核图_CN'
const cgcs2000ParkMapName = '建筑单体校核图_CGCS2000'
const isCgcs2000Mode = String(import.meta.env.VITE_SUPERMAP_COORD_SYS || '').toUpperCase() === SUPERMAP_CGCS2000_COORD_SYS
  || Number(import.meta.env.VITE_SUPERMAP_EPSG || 0) === SUPERMAP_CGCS2000_EPSG
const mapName = isCgcs2000Mode ? cgcs2000ParkMapName : parkMapName
const defaultMapUrl = isCgcs2000Mode
  ? `/supermap-iserver/iserver/services/map-chemical_park_vectors_cgcs2000/rest/maps/${encodeURIComponent(cgcs2000ParkMapName)}`
  : `/supermap-iserver/iserver/services/map-chemical_park_vectors_cn/rest/maps/${encodeURIComponent(parkMapName)}`
const mapUrl = import.meta.env.VITE_SUPERMAP_2D_MAP_URL || defaultMapUrl
const defaultBounds = isCgcs2000Mode
  ? { left: 457752.343, bottom: 3855297.972, right: 459339.543, top: 3856245.172 }
  : { left: 0, bottom: 0, right: 1587.2, top: 947.2 }
const mapBounds = {
  left: Number(import.meta.env.VITE_SUPERMAP_2D_LEFT || defaultBounds.left),
  bottom: Number(import.meta.env.VITE_SUPERMAP_2D_BOTTOM || defaultBounds.bottom),
  right: Number(import.meta.env.VITE_SUPERMAP_2D_RIGHT || defaultBounds.right),
  top: Number(import.meta.env.VITE_SUPERMAP_2D_TOP || defaultBounds.top),
}
// F11（2026-08-01）：DOM 底图与模型存在错位，2D 小地图视口切换到算法系
// （B 套 MonitorPoints 基准，网格 1000×540），底图按其真实位置（原 4547 范围）
// 放置，算法 overlay 直接用算法系坐标绘制。SVG viewBox 与视口同源。
const sourceMapSize = {
  width: ALGORITHM_FRAME.width,
  height: ALGORITHM_FRAME.height,
}
// 算法系 (X,Y) → 4547：easting = D.e + (X-80)，northing = D.n - (Y-420)
// D 锚点与 A 锚点同米制（1 unit=1m），视口即算法全图 0~1000 × 0~540。
const viewportBounds = {
  left: DEFAULT_ISERVER_ANCHOR_PROJECTED.easting - ALGORITHM_FRAME.offsetX,
  right:
    DEFAULT_ISERVER_ANCHOR_PROJECTED.easting +
    ALGORITHM_FRAME.width -
    ALGORITHM_FRAME.offsetX,
  bottom:
    DEFAULT_ISERVER_ANCHOR_PROJECTED.northing -
    ALGORITHM_FRAME.height +
    ALGORITHM_FRAME.offsetY,
  top: DEFAULT_ISERVER_ANCHOR_PROJECTED.northing + ALGORITHM_FRAME.offsetY,
}
const mapRootRef = ref<HTMLDivElement | null>(null)
const isReady = ref(false)
let map: L.Map | null = null
let overlay: L.SVGOverlay | null = null
let resizeObserver: ResizeObserver | null = null

const statusText = computed(() => isReady.value ? `${mapName} · 可自由浏览` : '正在加载 iServer 地图')

onMounted(async () => {
  await nextTick()
  initializeMap()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  map?.remove()
  map = null
  overlay = null
})

watch(() => [props.diffusion, props.inversion, props.source] as const, () => {
  renderAnalysisOverlay()
  if (props.source) focusSource(props.source)
}, { deep: true })
watch(() => props.isPrimary, () => window.setTimeout(() => map?.invalidateSize(), 380))

function initializeMap() {
  const root = mapRootRef.value
  if (!root) return
  const crs = nonEarthCRS({
    bounds: L.bounds(L.point(viewportBounds.left, viewportBounds.bottom), L.point(viewportBounds.right, viewportBounds.top)),
    origin: L.point(viewportBounds.left, viewportBounds.top),
  }) as L.CRS
  map = L.map(root, {
    attributionControl: false,
    crs,
    center: [(viewportBounds.top + viewportBounds.bottom) / 2, (viewportBounds.left + viewportBounds.right) / 2],
    zoomControl: false,
    minZoom: -2,
    maxZoom: 8,
    zoom: 0,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
    preferCanvas: true,
  })
  // 视口 = 算法系全图（模型区域）；DOM 底图按其真实 4547 范围放置（与模型错位部分在视口外）
  const viewport: L.LatLngBoundsExpression = [[viewportBounds.bottom, viewportBounds.left], [viewportBounds.top, viewportBounds.right]]
  const baseMap: L.LatLngBoundsExpression = [[mapBounds.bottom, mapBounds.left], [mapBounds.top, mapBounds.right]]
  // iServer 当前 image.png 返回空白 Trial Use 图；园区 DOM 本地镜像已校验可见，作为可靠底图。
  L.imageOverlay('/maps/real-park-dom.jpg', baseMap, { interactive: false, opacity: 1 }).addTo(map)
  map.fitBounds(viewport, { animate: false, padding: [0, 0] })
  isReady.value = true
  renderAnalysisOverlay()
  if (props.source) focusSource(props.source)
  resizeObserver = new ResizeObserver(() => map?.invalidateSize())
  resizeObserver.observe(root)
}

function createImageUrl() {
  const params = new URLSearchParams({
    redirect: 'false', transparent: 'false', cacheEnabled: 'true', width: '1600', height: '954',
    viewBounds: JSON.stringify({ leftBottom: { x: mapBounds.left, y: mapBounds.bottom }, rightTop: { x: mapBounds.right, y: mapBounds.top } }),
  })
  return `${mapUrl.replace(/\/+$/, '')}/image.png?${params.toString()}`
}

function renderAnalysisOverlay() {
  if (!map) return
  overlay?.remove()
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', `0 0 ${sourceMapSize.width} ${sourceMapSize.height}`)
  svg.setAttribute('preserveAspectRatio', 'none')
  if (props.diffusion) renderDiffusion(svg, props.diffusion)
  else if (props.source) renderSource(svg, props.source)
  if (props.inversion) renderInversion(svg, props.inversion)
  const bounds: L.LatLngBoundsExpression = [[viewportBounds.bottom, viewportBounds.left], [viewportBounds.top, viewportBounds.right]]
  overlay = L.svgOverlay(svg, bounds, { interactive: false, opacity: 1 }).addTo(map)
}

function svgElement(name: string, attributes: Record<string, string>) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name)
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
  return element
}

function renderDiffusion(svg: SVGSVGElement, diffusion: SmartMapDiffusionOverlay) {
  const peak = Math.max(diffusion.peakConcentration, 1)
  for (const cell of diffusion.cells) {
    const ratio = Math.min(1, Math.max(0, cell.concentration / peak))
    const color = ratio > 0.65 ? '#ff3b30' : ratio > 0.35 ? '#ffbc3a' : '#25b8ff'
    svg.appendChild(svgElement('circle', {
      cx: String(cell.x), cy: String(cell.y), r: String(Math.max(24, cell.size * (1.7 + ratio * 3.2))),
      fill: color, opacity: String(0.15 + ratio * 0.38), filter: 'url(#heat-blur)',
    }))
  }
  const defs = svgElement('defs', {})
  const filter = svgElement('filter', { id: 'heat-blur' })
  filter.appendChild(svgElement('feGaussianBlur', { stdDeviation: '8' }))
  defs.appendChild(filter)
  svg.appendChild(defs)
  renderSource(svg, diffusion.source)
}

function renderSource(svg: SVGSVGElement, source: { x: number; y: number }) {
  svg.appendChild(svgElement('circle', { cx: String(source.x), cy: String(source.y), r: '28', fill: '#ff4936', opacity: '0.18', stroke: '#fff3eb', 'stroke-width': '3', 'stroke-dasharray': '8 6' }))
  svg.appendChild(svgElement('circle', { cx: String(source.x), cy: String(source.y), r: '14', fill: '#ff4936', opacity: '0.42', stroke: '#ffffff', 'stroke-width': '3' }))
  svg.appendChild(svgElement('circle', { cx: String(source.x), cy: String(source.y), r: '7', fill: '#ff4936', stroke: '#ffffff', 'stroke-width': '2' }))
}

function focusSource(source: { x: number; y: number }) {
  if (!map) return
  const latitude = viewportBounds.top - (source.y / sourceMapSize.height) * (viewportBounds.top - viewportBounds.bottom)
  const longitude = viewportBounds.left + (source.x / sourceMapSize.width) * (viewportBounds.right - viewportBounds.left)
  map.flyTo([latitude, longitude], Math.max(map.getZoom(), 1), { animate: true, duration: 0.8 })
}

function renderInversion(svg: SVGSVGElement, inversion: SmartMapInversionOverlay) {
  const radius = Math.max(18, inversion.radiusMeters * 0.7)
  svg.appendChild(svgElement('circle', { cx: String(inversion.point.x), cy: String(inversion.point.y), r: String(radius), fill: '#ffb020', opacity: '0.16', stroke: '#fff2ca', 'stroke-width': '3', 'stroke-dasharray': '10 7' }))
  svg.appendChild(svgElement('path', { d: `M ${inversion.point.x - 24} ${inversion.point.y} H ${inversion.point.x + 24} M ${inversion.point.x} ${inversion.point.y - 24} V ${inversion.point.y + 24}`, fill: 'none', stroke: '#ffb020', 'stroke-width': '5', 'stroke-linecap': 'round' }))
  svg.appendChild(svgElement('circle', { cx: String(inversion.point.x), cy: String(inversion.point.y), r: '7', fill: '#ffb020', stroke: '#ffffff', 'stroke-width': '3' }))
}
</script>

<style scoped>
.smart-map-inset { width: min(300px, calc(100vw - 56px)); overflow: hidden; border: 1px solid rgba(133,164,182,.42); border-radius: 4px; background: #0c1318; box-shadow: 0 12px 34px rgba(0,0,0,.34); color: #edf5f7; }
.smart-map-inset.is-primary { display: flex; width: 100%; height: 100%; flex-direction: column; }
header, footer { display:flex; align-items:center; justify-content:space-between; min-height:34px; padding:0 10px; gap:8px; }
header { border-bottom:1px solid rgba(133,164,182,.2); } header div { display:grid; gap:1px; } strong { font-size:12px; } header span, footer span { color:#92a9b3; font-size:10px; } header b, footer b { color:#9eedc7; font:700 10px Consolas, monospace; white-space:nowrap; }
.map-root { position:relative; aspect-ratio:1587.2 / 947.2; min-height:0; background:#07111b; } .is-primary .map-root { flex:1; aspect-ratio:auto; }
footer { min-height:28px; border-top:1px solid rgba(133,164,182,.18); } .map-root :deep(.leaflet-control-container) { display:none; }
</style>
