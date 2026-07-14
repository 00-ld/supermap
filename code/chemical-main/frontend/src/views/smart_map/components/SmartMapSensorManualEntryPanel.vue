<template>
  <div class="candidate-detail-card" style="margin-top:10px;">
    <div class="candidate-detail-head">
      <span>传感器手动录入面板</span>
      <span>{{ target ? target.id : '未选择' }}</span>
    </div>
    <div v-if="sensors.length" class="control-grid" style="margin-top:10px;">
      <label class="control-field">
        <span>目标传感器</span>
        <select :value="targetId" @change="$emit('select-target', inputValue($event))">
          <option v-for="sensor in sensors" :key="sensor.id" :value="sensor.id">{{ sensor.id }}</option>
        </select>
      </label>
      <label class="control-field">
        <span>数据模式</span>
        <select :value="target?.mode || 'auto'" @change="$emit('set-mode', inputValue($event))">
          <option value="auto">自动采样</option>
          <option value="manual">手动录入</option>
        </select>
      </label>
      <label class="control-field">
        <span>当前帧</span>
        <input :value="currentFrame" type="number" disabled>
      </label>
      <label v-if="target?.mode === 'manual'" class="control-field">
        <span>当前帧浓度(ppm)</span>
        <input
          :value="editorState.currentFrameConcentration"
          type="number"
          min="0"
          step="0.1"
          @input="$emit('update-current-concentration', numericValue($event))"
        >
      </label>
      <label v-if="target?.mode === 'manual'" class="control-field">
        <span>全时段浓度(ppm)</span>
        <input
          :value="editorState.fillAllConcentration"
          type="number"
          min="0"
          step="0.1"
          @input="$emit('update-fill-concentration', numericValue($event))"
        >
      </label>
    </div>
    <div v-if="sensors.length && target?.mode === 'manual'" class="inline-actions" style="margin-top:10px;">
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
    <div v-if="!sensors.length" class="empty-block" style="margin-top:10px;">请先添加至少一个传感器，再进行手动录入</div>
    <div class="control-subnote" style="margin-top:8px;">
      这里提供独立的手动录入入口；选中传感器后，右侧详情区也会同步显示同一套编辑能力。
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapEditableSensor } from '../useSmartMapSensorEditor'

defineOptions({
  name: 'SmartMapSensorManualEntryPanel',
})

defineProps<{
  currentFrame: number
  editorState: {
    currentFrameConcentration: number
    fillAllConcentration: number
  }
  sensors: SmartMapEditableSensor[]
  target: SmartMapEditableSensor | null
  targetId: string
}>()

defineEmits<{
  'apply-current': []
  'clear-series': []
  'copy-auto-series': []
  'fill-series': []
  'select-target': [sensorId: string]
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
