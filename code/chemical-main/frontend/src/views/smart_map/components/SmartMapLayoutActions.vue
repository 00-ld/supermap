<template>
  <div class="sensor-layout-actions">
    <button class="sensor-btn primary" :class="{ active: sensorPicking }" @click="$emit('add-manual-sensor')">
      <i :class="sensorPicking ? 'fas fa-ban' : 'fas fa-plus'"></i>
      {{ sensorPicking ? '取消选点' : (manualConfigVisible ? '重新选点' : '手动添加') }}
    </button>
    <button class="sensor-btn primary" :class="{ active: manualPanelVisible }" @click="$emit('toggle-manual-panel')">
      <i class="fas fa-pen-to-square"></i> 手动录入
    </button>
    <button class="sensor-btn danger" @click="$emit('clear-all-sensors')">
      <i class="fas fa-trash"></i> 清空全部
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapLayoutActions',
})

defineProps<{
  sensorPicking: boolean
  manualPanelVisible: boolean
  manualConfigVisible: boolean
}>()

defineEmits<{
  'add-manual-sensor': []
  'toggle-manual-panel': []
  'clear-all-sensors': []
}>()
</script>

<style scoped>
.sensor-layout-actions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.sensor-btn {
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(154,168,184,0.18);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.sensor-btn.primary {
  background: #1b2533;
  color: #d1dae5;
}
.sensor-btn.primary.active {
  background: #243144;
  color: #eef3f8;
  outline: 1px solid rgba(154,168,184,0.30);
}
.sensor-btn.danger {
  background: rgba(199,130,130,0.12);
  color: #d6a0a0;
  border-color: rgba(199,130,130,0.18);
}
</style>
