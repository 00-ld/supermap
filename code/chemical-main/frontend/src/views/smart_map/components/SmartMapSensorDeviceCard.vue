<template>
  <div v-if="card" class="sensor-device-card">
    <div class="sensor-device-head">
      <span>设备安装详情</span>
      <button class="sensor-device-expand-btn" @click="$emit('open-fullscreen')">
        <i class="fas fa-expand"></i>
      </button>
    </div>
    <div class="sensor-device-compact">
      <img v-if="card.image" :src="card.image" class="sensor-device-thumb">
      <div class="sensor-device-compact-info">
        <div class="sensor-device-compact-name">{{ card.deviceName }}</div>
        <div class="sensor-device-compact-status">
          <span class="sensor-status-dot online"></span> 在线
          <span class="sensor-status-sep">|</span>
          <span class="sensor-conc-val">{{ card.concentration }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapDeviceImageCard } from '../useSmartMapDeviceImage'

defineOptions({
  name: 'SmartMapSensorDeviceCard',
})

defineEmits<{
  (event: 'open-fullscreen'): void
}>()

defineProps<{
  card: SmartMapDeviceImageCard | null
}>()
</script>

<style scoped>
.sensor-device-card {
  margin-top: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #161f2d;
  padding: 10px 12px;
}
.sensor-device-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--fg-muted);
  font-size: 11px;
}
.sensor-device-expand-btn {
  background: #ffffff;
  color: #1a1a2e;
  border: none;
  border-radius: 6px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.sensor-device-expand-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 0 8px rgba(255,255,255,0.3);
}
.sensor-device-compact {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
}
.sensor-device-thumb {
  flex: 0 0 56px;
  width: 56px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.sensor-device-compact-info {
  flex: 1;
  min-width: 0;
}
.sensor-device-compact-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--fg);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sensor-device-compact-status {
  font-size: 11px;
  color: var(--fg-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
.sensor-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.sensor-status-dot.online {
  background: #9aa8b8;
}
.sensor-status-sep {
  opacity: 0.3;
}
.sensor-conc-val {
  color: #b4beca;
  font-weight: 500;
}
</style>
