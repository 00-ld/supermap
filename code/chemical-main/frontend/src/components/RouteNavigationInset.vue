<template>
  <aside
    class="route-navigation-inset"
    :class="{ empty: !hasContent, 'is-primary': isPrimary }"
    aria-label="二维应急态势图"
  >
    <header>
      <div>
        <strong>二维应急态势图</strong>
        <span>{{ hasHeatmap ? '与三维同步的扩散浓度热力图' : '与三维同一条SuperMap道路路径' }}</span>
      </div>
      <b v-if="hasHeatmap">峰值 {{ heatmap?.peakConcentration.toFixed(1) }} ppm</b>
      <b v-else-if="hasRoute">{{ route?.points.length }}点</b>
    </header>

    <div class="route-map-frame">
      <img src="/maps/real-park-dom.jpg" alt="化工园区二维DOM底图" />
      <svg
        viewBox="0 0 1587.2 947.2"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g v-if="hasHeatmap" class="diffusion-heatmap">
          <circle
            v-for="(cell, index) in heatCells"
            :key="`${cell.x}-${cell.y}-${index}`"
            class="diffusion-heat-cell"
            :cx="cell.x"
            :cy="cell.y"
            :r="cell.radius"
            :fill="cell.color"
            :opacity="cell.opacity"
          />
          <circle
            v-if="heatmap"
            class="diffusion-source-halo"
            :cx="heatmap.source.x"
            :cy="heatmap.source.y"
            r="22"
          />
          <circle
            v-if="heatmap"
            class="diffusion-source-core"
            :cx="heatmap.source.x"
            :cy="heatmap.source.y"
            r="9"
          />
        </g>
        <polyline
          v-if="routePolyline"
          class="route-outline"
          :points="routePolyline"
        />
        <polyline
          v-if="routePolyline"
          class="route-line"
          :points="routePolyline"
        />
        <circle
          v-if="startPoint"
          class="route-start"
          :cx="startPoint.x"
          :cy="startPoint.y"
          r="18"
        />
        <circle
          v-if="startPoint"
          class="route-start-core"
          :cx="startPoint.x"
          :cy="startPoint.y"
          r="8"
        />
        <circle
          v-if="endPoint"
          class="route-end"
          :cx="endPoint.x"
          :cy="endPoint.y"
          r="20"
        />
        <path
          v-if="endPoint"
          class="route-end-mark"
          :d="`M ${endPoint.x - 9} ${endPoint.y} L ${endPoint.x - 2} ${endPoint.y + 8} L ${endPoint.x + 11} ${endPoint.y - 10}`"
        />
      </svg>
      <div v-if="!hasContent" class="route-empty-state">
        运行扩散模拟或路径规划后显示
      </div>
    </div>

    <footer v-if="hasContent">
      <span>{{ hasHeatmap ? '红：高浓度 · 黄：中浓度 · 蓝：低浓度' : (route?.exitLabel || '目标出口') }}</span>
      <b>{{ hasHeatmap ? `${heatCells.length} 格网` : distanceText }}</b>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type RouteNavigationSummary = {
  points: Array<{ x: number; y: number }>
  exitLabel: string
  planner: string
  distanceMeters: number
}

export type DiffusionHeatmapSummary = {
  source: { x: number; y: number }
  cells: Array<{ x: number; y: number; size: number; concentration: number }>
  peakConcentration: number
}

const props = defineProps<{
  route: RouteNavigationSummary | null
  heatmap?: DiffusionHeatmapSummary | null
  isPrimary?: boolean
}>()

const hasRoute = computed(() =>
  Boolean(props.route && props.route.points.length >= 2),
)
const hasHeatmap = computed(() =>
  Boolean(props.heatmap && props.heatmap.cells.length > 0),
)
const hasContent = computed(() => hasRoute.value || hasHeatmap.value)
const heatCells = computed(() => {
  const peak = Math.max(Number(props.heatmap?.peakConcentration || 0), 1)
  return (props.heatmap?.cells || []).map((cell) => {
    const ratio = Math.min(1, Math.max(0, cell.concentration / peak))
    return {
      ...cell,
      radius: Math.max(24, cell.size * (1.7 + ratio * 3.2)),
      color: ratio > 0.65 ? '#ff3b30' : ratio > 0.35 ? '#ffbd3b' : '#25b8ff',
      opacity: 0.15 + ratio * 0.42,
    }
  })
})
const routePolyline = computed(
  () =>
    props.route?.points
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ') || '',
)
const startPoint = computed(() => props.route?.points[0] || null)
const endPoint = computed(() => props.route?.points.at(-1) || null)
const distanceText = computed(() => {
  const distanceMeters = Number(props.route?.distanceMeters || 0)
  return distanceMeters > 0 ? `${distanceMeters.toFixed(0)}m` : '道路路径'
})
</script>

<style scoped>
.route-navigation-inset {
  width: min(300px, calc(100vw - 56px));
  overflow: hidden;
  border: 1px solid rgba(133, 164, 182, 0.42);
  border-radius: 4px;
  background: rgba(12, 19, 24, 0.93);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.34);
  color: #edf5f7;
}

.route-navigation-inset.is-primary {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
}

.route-navigation-inset.is-primary .route-map-frame {
  flex: 1;
  min-height: 0;
  aspect-ratio: auto;
}

.route-navigation-inset header,
.route-navigation-inset footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  padding: 0 10px;
}

.route-navigation-inset header {
  border-bottom: 1px solid rgba(133, 164, 182, 0.2);
}

.route-navigation-inset header div {
  display: grid;
  gap: 1px;
}

.route-navigation-inset strong {
  color: #f2f8f8;
  font-size: 12px;
  line-height: 15px;
}

.route-navigation-inset header span,
.route-navigation-inset footer span {
  color: #92a9b3;
  font-size: 10px;
  line-height: 13px;
}

.route-navigation-inset header b {
  padding: 2px 5px;
  border: 1px solid rgba(82, 255, 184, 0.38);
  border-radius: 2px;
  color: #7de5b7;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 10px;
}

.route-map-frame {
  position: relative;
  aspect-ratio: 1587.2 / 947.2;
  overflow: hidden;
  background: #31444b;
}

.route-map-frame img,
.route-map-frame svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.diffusion-heatmap {
  filter: blur(8px);
}

.diffusion-heat-cell {
  mix-blend-mode: screen;
}

.diffusion-source-halo {
  fill: rgba(255, 76, 56, 0.28);
  stroke: #ffe8d8;
  stroke-width: 4;
}

.diffusion-source-core {
  fill: #ff4b36;
  stroke: #ffffff;
  stroke-width: 3;
}

.route-map-frame img {
  display: block;
  object-fit: fill;
  filter: saturate(0.78) contrast(1.08) brightness(0.72);
}

.route-map-frame svg {
  overflow: visible;
}

.route-outline,
.route-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.route-outline {
  stroke: rgba(3, 18, 18, 0.78);
  stroke-width: 31;
}

.route-line {
  stroke: #54f4af;
  stroke-width: 15;
  stroke-dasharray: 25 15;
}

.route-start {
  fill: rgba(45, 127, 249, 0.34);
  stroke: #dceeff;
  stroke-width: 6;
}

.route-start-core {
  fill: #2d7ff9;
  stroke: #ffffff;
  stroke-width: 3;
}

.route-end {
  fill: rgba(82, 255, 184, 0.34);
  stroke: #effff9;
  stroke-width: 6;
}

.route-end-mark {
  fill: none;
  stroke: #17362b;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 7;
}

.route-empty-state {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(8, 15, 18, 0.55);
  color: #d2e0e5;
  font-size: 11px;
  line-height: 17px;
  text-align: center;
}

.route-navigation-inset.empty .route-map-frame img {
  filter: saturate(0.42) contrast(0.94) brightness(0.5);
}

.route-navigation-inset footer {
  min-height: 28px;
  border-top: 1px solid rgba(133, 164, 182, 0.18);
}

.route-navigation-inset footer b {
  color: #9eedc7;
  font-family: Consolas, 'Roboto Mono', monospace;
  font-size: 11px;
}
</style>
