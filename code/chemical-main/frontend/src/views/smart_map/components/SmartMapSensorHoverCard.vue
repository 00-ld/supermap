<template>
  <div v-if="card" class="sensor-hover-card">
    <div class="sensor-hover-head">
      <div>
        <div class="sensor-hover-title">{{ card.id }}</div>
        <div class="sensor-hover-sub">{{ card.typeName }} / {{ card.levelText }}</div>
      </div>
      <span class="sensor-hover-badge" :class="card.levelClass">{{ card.levelLabel }}</span>
    </div>
    <div class="sensor-hover-metric">
      <span>当前浓度</span>
      <strong>{{ card.currentLabel }}</strong>
    </div>
    <div class="sensor-hover-grid">
      <span>当前时间 {{ card.timeLabel }}</span>
      <span>采样峰值 {{ card.peakLabel }}</span>
      <span>风险等级 <span :style="{ color: priorityColor(card.priority), fontWeight: 600 }">P{{ card.priority }} {{ card.priorityLabel }}</span></span>
      <span>{{ card.coordLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapSensorHoverCard } from '../useSmartMapSensorHoverCard'

defineOptions({
  name: 'SmartMapSensorHoverCard',
})

defineProps<{
  card: SmartMapSensorHoverCard | null
  priorityColor: (priority: number) => string
}>()
</script>

<style scoped>
.sensor-hover-card {
  position: absolute;
  top: 60px;
  right: 12px;
  width: 250px;
  background: rgba(17,24,39,0.94);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  z-index: 32;
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.28);
}
.sensor-hover-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.sensor-hover-title {
  color: var(--fg);
  font-size: 13px;
  font-weight: 700;
}
.sensor-hover-sub {
  color: var(--fg-muted);
  font-size: 11px;
  margin-top: 3px;
}
.sensor-hover-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.sensor-hover-badge.normal {
  background: rgba(154,168,184,0.14);
  color: #c6d0dc;
}
.sensor-hover-badge.warning {
  background: rgba(194,164,109,0.14);
  color: #d2b878;
}
.sensor-hover-badge.danger {
  background: rgba(199,130,130,0.14);
  color: #d6a0a0;
}
.sensor-hover-metric {
  margin-top: 12px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: var(--fg-muted);
  font-size: 11px;
}
.sensor-hover-metric strong {
  color: var(--fg);
  font-size: 18px;
  font-family: 'Orbitron', sans-serif;
}
.sensor-hover-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 10px;
  color: var(--fg-muted);
  font-size: 11px;
}
</style>
