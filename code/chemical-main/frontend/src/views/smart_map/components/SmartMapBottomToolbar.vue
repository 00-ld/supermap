<template>
  <div class="bottom-toolbar">
    <button class="tool-btn" :class="{ active: !measureMode }" @click="$emit('set-tool', 'select')">
      <i class="fas fa-mouse-pointer"></i> 选择
    </button>
    <button class="tool-btn" :class="{ active: showEntrances }" @click="$emit('toggle-entrances')">
      <i class="fas fa-door-open"></i> 出入口
    </button>
    <button class="tool-btn" :class="{ active: measureMode }" @click="$emit('set-tool', 'measure')">
      <i class="fas fa-ruler"></i> 测距
    </button>
    <button class="tool-btn" :class="{ active: showSensors }" @click="$emit('toggle-sensors')">
      <i class="fas fa-eye"></i> 传感器
    </button>
    <button class="tool-btn" :class="{ active: showSensorRanges }" @click="$emit('toggle-sensor-ranges')">
      <i class="fas fa-circle"></i> 半径范围
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapBottomToolbar',
})

defineProps<{
  measureMode: boolean
  showEntrances: boolean
  showSensors: boolean
  showSensorRanges: boolean
}>()

defineEmits<{
  'set-tool': [tool: 'select' | 'measure']
  'toggle-entrances': []
  'toggle-sensors': []
  'toggle-sensor-ranges': []
}>()
</script>

<style scoped>
.bottom-toolbar {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  z-index: 30;
}
.tool-btn {
  height: 34px;
  padding: 0 14px;
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg-muted);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.tool-btn:hover,
.tool-btn.active {
  border-color: rgba(154,168,184,0.36);
  color: #eef3f8;
  background: #1b2533;
}
</style>
