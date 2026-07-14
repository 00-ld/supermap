<template>
  <div class="coord-display" aria-live="polite">
    <span class="coord-item">
      <span class="coord-label">经度</span>
      <strong>{{ longitude }}</strong>
    </span>
    <span class="coord-item">
      <span class="coord-label">纬度</span>
      <strong>{{ latitude }}</strong>
    </span>
    <span class="coord-item">
      <span class="coord-label">海拔</span>
      <strong>{{ altitude }}</strong>
    </span>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapCoordinateDisplay',
})

defineProps<{
  longitude: string
  latitude: string
  altitude: string
}>()
</script>

<style scoped>
.coord-display {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  max-width: min(560px, calc(100% - 24px));
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  color: var(--fg-muted);
  z-index: 30;
  backdrop-filter: blur(10px);
}
.coord-item {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}
.coord-label {
  color: var(--fg-muted);
}
.coord-display strong {
  color: var(--accent);
  font-weight: 700;
}
</style>
