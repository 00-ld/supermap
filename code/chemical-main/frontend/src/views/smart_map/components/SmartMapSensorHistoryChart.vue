<template>
  <div v-if="chart" class="sensor-history-chart-card">
    <div class="sensor-history-chart-head">
      <span>历史浓度曲线</span>
      <span>{{ chart.currentLabel }}</span>
    </div>
    <svg class="sensor-history-chart-svg" viewBox="0 0 280 96" preserveAspectRatio="none">
      <line
        :x1="chart.padding"
        y1="80"
        :x2="280 - chart.padding"
        y2="80"
        class="sensor-history-chart-axis"
      />
      <line
        :x1="chart.padding"
        y1="12"
        :x2="chart.padding"
        y2="80"
        class="sensor-history-chart-axis"
      />
      <line
        :x1="chart.padding"
        :x2="280 - chart.padding"
        :y1="chart.warningY"
        :y2="chart.warningY"
        class="sensor-history-chart-threshold warning"
      />
      <line
        :x1="chart.padding"
        :x2="280 - chart.padding"
        :y1="chart.dangerY"
        :y2="chart.dangerY"
        class="sensor-history-chart-threshold danger"
      />
      <polyline :points="chart.points" class="sensor-history-chart-line" />
      <line
        :x1="chart.markerX"
        :x2="chart.markerX"
        y1="12"
        y2="80"
        class="sensor-history-chart-marker"
      />
      <circle
        :cx="chart.markerX"
        :cy="chart.markerY"
        r="3.5"
        class="sensor-history-chart-marker-dot"
      />
    </svg>
    <div class="sensor-history-chart-foot">
      <span>0s</span>
      <span>峰值 {{ chart.peakLabel }}</span>
      <span>{{ chart.endLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapSensorHistoryChart } from '../useSmartMapSensorSeries'

defineOptions({
  name: 'SmartMapSensorHistoryChart',
})

defineProps<{
  chart: SmartMapSensorHistoryChart | null
}>()
</script>

<style scoped>
.sensor-history-chart-card {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #161f2d;
  padding: 12px;
}
.sensor-history-chart-head,
.sensor-history-chart-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--fg-muted);
  font-size: 11px;
}
.sensor-history-chart-svg {
  display: block;
  width: 100%;
  height: 96px;
  margin: 8px 0;
}
.sensor-history-chart-axis {
  stroke: rgba(122,139,168,0.28);
  stroke-width: 1;
}
.sensor-history-chart-threshold {
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.sensor-history-chart-threshold.warning {
  stroke: rgba(194,164,109,0.58);
}
.sensor-history-chart-threshold.danger {
  stroke: rgba(199,130,130,0.62);
}
.sensor-history-chart-line {
  fill: none;
  stroke: #93a7bd;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.sensor-history-chart-marker {
  stroke: rgba(255,255,255,0.45);
  stroke-width: 1;
  stroke-dasharray: 3 4;
}
.sensor-history-chart-marker-dot {
  fill: #b4beca;
  stroke: #ffffff;
  stroke-width: 1;
}
</style>
