<template>
  <div class="sensor-stat-grid">
    <div class="stat-mini">
      <div class="val">{{ summary.sensorCount }}</div>
      <div class="lab">传感器总数</div>
    </div>
    <div class="stat-mini">
      <div class="val">{{ summary.coverageRate }}%</div>
      <div class="lab">全域覆盖率</div>
    </div>
    <div class="stat-mini">
      <div class="val">{{ summary.riskCoverRate }}%</div>
      <div class="lab">高风险覆盖率</div>
    </div>
    <div class="stat-mini">
      <div class="val">¥{{ summary.totalCost }}</div>
      <div class="lab">部署总成本</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapCoverageSummary } from '../useSmartMapRiskSummary'

defineOptions({
  name: 'SmartMapLayoutStats',
})

defineProps<{
  summary: SmartMapCoverageSummary
}>()
</script>

<style scoped>
.sensor-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stat-mini {
  background: #1e293b;
  border-radius: 6px;
  text-align: center;
  padding: 10px 4px;
}
.stat-mini .val {
  font-size: 16px;
  font-weight: bold;
  color: var(--accent);
  font-family: 'Orbitron', sans-serif;
}
.stat-mini .lab {
  font-size: 10px;
  color: var(--fg-muted);
  margin-top: 4px;
}
</style>
