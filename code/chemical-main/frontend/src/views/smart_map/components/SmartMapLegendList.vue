<template>
  <div class="legend-list">
    <div v-for="legend in legends" :key="legend.type" class="legend-item">
      <div class="legend-swatch" :class="legend.shape" :style="legend.style"></div>
      <span>{{ legend.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapLegendList',
})

defineProps<{
  legends: Array<{
    type: string
    label: string
    shape: string
    style: string
  }>
}>()
</script>

<style scoped>
.legend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--fg-muted);
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}
.legend-item:hover {
  background: #1e293b;
  color: var(--fg);
}
.legend-swatch {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}
.legend-swatch.circle {
  border-radius: 50%;
}
.legend-swatch.line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}
</style>
