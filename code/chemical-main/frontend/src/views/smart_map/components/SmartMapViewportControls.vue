<template>
  <div class="scale-bar">
    <div class="scale-text">50m</div>
    <div class="scale-line"></div>
  </div>

  <div class="map-controls">
    <button class="map-btn" @click="emit('zoom-in')" title="放大"><i class="fas fa-plus"></i></button>
    <button class="map-btn" @click="emit('zoom-out')" title="缩小"><i class="fas fa-minus"></i></button>
    <button class="map-btn" @click="emit('zoom-reset')" title="重置"><i class="fas fa-expand"></i></button>
    <button class="map-btn" :class="{ active: showLabels }" @click="emit('toggle-labels')" title="标注"><i class="fas fa-tag"></i></button>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapViewportControls',
})

defineProps<{
  showLabels: boolean
}>()

const emit = defineEmits<{
  (event: 'zoom-in'): void
  (event: 'zoom-out'): void
  (event: 'zoom-reset'): void
  (event: 'toggle-labels'): void
}>()
</script>

<style scoped>
.map-controls {
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 30;
}
.map-btn {
  width: 40px;
  height: 40px;
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.map-btn:hover {
  background: #1b2533;
  border-color: rgba(154,168,184,0.36);
  color: #eef3f8;
}
.scale-bar {
  position: absolute;
  bottom: 24px;
  left: 24px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  z-index: 30;
}
.scale-line {
  width: 80px;
  height: 2px;
  background: var(--fg-muted);
  position: relative;
}
.scale-line::before,
.scale-line::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 8px;
  background: var(--fg-muted);
  top: -3px;
}
.scale-line::before {
  left: 0;
}
.scale-line::after {
  right: 0;
}
.scale-text {
  font-size: 10px;
  color: var(--fg-muted);
  font-family: 'Orbitron', sans-serif;
}
</style>
