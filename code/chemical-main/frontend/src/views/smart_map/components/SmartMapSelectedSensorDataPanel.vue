<template>
  <div class="sensor-history-card" style="margin-top:12px;">
    <div class="sensor-history-head">
      <span>数据模式</span>
      <span>{{ sensor.mode === 'manual' ? '手动录入' : '自动采样' }}</span>
    </div>
    <div class="control-grid" style="margin-top:10px;">
      <label class="control-field">
        <span>传感器数据源</span>
        <select :value="sensor.mode || 'auto'" @change="$emit('set-mode', inputValue($event))">
          <option value="auto">自动采样</option>
          <option value="manual">手动录入</option>
        </select>
      </label>
      <label v-if="sensor.mode === 'manual'" class="control-field">
        <span>当前帧手动浓度(ppm)</span>
        <input
          :value="editorState.currentFrameConcentration"
          type="number"
          min="0"
          step="0.1"
          @input="$emit('update-current-concentration', numericValue($event))"
        >
      </label>
      <label v-if="sensor.mode === 'manual'" class="control-field">
        <span>全时段批量浓度(ppm)</span>
        <input
          :value="editorState.fillAllConcentration"
          type="number"
          min="0"
          step="0.1"
          @input="$emit('update-fill-concentration', numericValue($event))"
        >
      </label>
    </div>
    <div v-if="sensor.mode === 'manual'" class="inline-actions" style="margin-top:10px;">
      <button class="sensor-btn primary" @click="$emit('apply-current')">
        <i class="fas fa-pen"></i> 写入当前帧
      </button>
      <button class="sensor-btn primary" @click="$emit('fill-series')">
        <i class="fas fa-wave-square"></i> 填充全时段
      </button>
      <button class="sensor-btn primary" @click="$emit('copy-auto-series')">
        <i class="fas fa-copy"></i> 复制自动曲线
      </button>
      <button class="sensor-btn danger" @click="$emit('clear-series')">
        <i class="fas fa-eraser"></i> 清空手动曲线
      </button>
    </div>
    <div class="control-subnote" style="margin-top:8px;">
      自动采样：系统定时生成仿真采样数据，跟随当前扩散场浓度变化。手动采样：用户点击按钮后生成一次采样数据，使用独立时间序列，并同步影响图表、告警显示和观测输入。
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapEditableSensor } from '../useSmartMapSensorEditor'

defineOptions({
  name: 'SmartMapSelectedSensorDataPanel',
})

defineProps<{
  editorState: {
    currentFrameConcentration: number
    fillAllConcentration: number
  }
  sensor: SmartMapEditableSensor
}>()

defineEmits<{
  'apply-current': []
  'clear-series': []
  'copy-auto-series': []
  'fill-series': []
  'set-mode': [mode: string]
  'update-current-concentration': [value: number]
  'update-fill-concentration': [value: number]
}>()

function inputValue(event: Event): string {
  return event.target instanceof HTMLSelectElement ? event.target.value : ''
}

function numericValue(event: Event): number {
  if (!(event.target instanceof HTMLInputElement)) return 0
  return Number(event.target.value)
}
</script>
