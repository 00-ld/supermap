<template>
  <div class="stat-grid">
    <div
      v-for="stat in stats"
      :key="stat.filter"
      class="stat-card"
      :class="{ active: activeFilter === stat.filter }"
      @click="$emit('set-filter', stat.filter)"
    >
      <div class="stat-value" :style="{ color: stat.color || '' }">{{ stat.value }}</div>
      <div class="stat-label">{{ stat.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapStatsGrid',
})

defineProps<{
  stats: Array<{
    filter: string
    value: number
    label: string
    color?: string
  }>
  activeFilter: string
}>()

defineEmits<{
  'set-filter': [filter: string]
}>()
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.stat-card {
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}
.stat-card:hover,
.stat-card.active {
  border-color: var(--accent);
  background: #1b2533;
}
.stat-value {
  font-family: 'Orbitron', sans-serif;
  font-size: 22px;
  font-weight: 900;
  color: var(--fg);
  line-height: 1;
}
.stat-label {
  font-size: 10px;
  color: var(--fg-muted);
  margin-top: 4px;
}
</style>
