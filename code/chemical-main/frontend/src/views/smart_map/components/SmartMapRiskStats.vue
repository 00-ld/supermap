<template>
  <div class="risk-stat-list">
    <div
      v-for="item in riskItems"
      :key="item.key"
      class="risk-stat-item"
    >
      <div>
        <span class="risk-dot" :style="{ background: item.color }"></span>
        <span>{{ item.label }}</span>
      </div>
      <span class="num">{{ stats[item.key] }} 格</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapRiskLevelSummary } from '../useSmartMapRiskSummary'

defineOptions({
  name: 'SmartMapRiskStats',
})

defineProps<{
  stats: SmartMapRiskLevelSummary
}>()

const riskItems: Array<{
  key: keyof SmartMapRiskLevelSummary
  label: string
  color: string
}> = [
  { key: 'critical', label: '重大风险', color: '#e65f5c' },
  { key: 'high', label: '较大风险', color: '#f08a34' },
  { key: 'mid', label: '一般风险', color: '#e6c845' },
  { key: 'low', label: '低风险', color: '#3fb8d4' },
]
</script>

<style scoped>
.risk-stat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.risk-stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--fg-muted);
}
.risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
}
.num {
  color: var(--fg);
  font-weight: 500;
}
</style>
