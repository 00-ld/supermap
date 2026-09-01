<template>
  <div class="candidate-detail-card" style="margin-top:10px;">
    <div class="candidate-detail-head">
      <span>手动添加传感器参数</span>
      <span>{{ pointLabel }}</span>
    </div>
    <div class="control-grid" style="margin-top:10px;">
      <label class="control-field" style="grid-column:1 / -1;">
        <span>零点坐标</span>
        <div style="display:flex;gap:8px;align-items:center;">
          <input
            type="text"
            :value="origin ? `(${origin.x.toFixed(1)}, ${origin.y.toFixed(1)})` : '未设置'"
            disabled
            style="flex:1;"
          >
          <button
            class="sensor-btn primary"
            :class="{ active: pickingOrigin }"
            style="white-space:nowrap;"
            @click="$emit('toggle-origin-picking')"
          >
            <i class="fas fa-crosshairs"></i> {{ originButtonText }}
          </button>
        </div>
      </label>
      <label class="control-field">
        <span>X 偏移 (m)</span>
        <input
          :value="relativeX"
          type="number"
          step="0.1"
          placeholder="0"
          @input="$emit('update-relative-x', numericValue($event))"
        >
      </label>
      <label class="control-field">
        <span>Y 偏移 (m)</span>
        <input
          :value="relativeY"
          type="number"
          step="0.1"
          placeholder="0"
          @input="$emit('update-relative-y', numericValue($event))"
        >
      </label>
      <label class="control-field" style="grid-column:1 / -1;">
        <button
          class="sensor-btn primary"
          :disabled="!origin"
          style="width:100%;"
          @click="$emit('apply-relative-coordinates')"
        >
          <i class="fas fa-check"></i> 应用坐标
        </button>
      </label>
      <label class="control-field">
        <span>安装高度 (m)</span>
        <input
          :value="draft.installationHeight"
          type="number"
          min="0.3"
          max="10"
          step="0.1"
          @input="$emit('update-draft', { installationHeight: numericValue($event) })"
        >
      </label>
      <label class="control-field">
        <span>有效监测范围 (m)</span>
        <input
          :value="draft.effectiveRange"
          type="number"
          min="5"
          max="100"
          step="1"
          @input="$emit('update-draft', { effectiveRange: numericValue($event) })"
        >
      </label>
      <label class="control-field" style="grid-column:1 / -1;">
        <span>检测范围</span>
        <input
          :value="draft.detectionRange"
          type="text"
          placeholder="CO / CH4 / NH3 / O2"
          @input="$emit('update-draft', { detectionRange: inputValue($event) })"
        >
      </label>
      <label class="control-field" style="grid-column:1 / -1;">
        <span>布点说明 / 备注（可选）</span>
        <input
          :value="draft.installRemark"
          type="text"
          placeholder="如：靠近阀组、下风向重点监测"
          @input="$emit('update-draft', { installRemark: inputValue($event) })"
        >
      </label>
    </div>
    <div class="control-note" :class="{ invalid: !validation.valid }" style="margin-top:10px;">
      {{ validation.message }}
    </div>
    <div class="control-subnote" style="margin-top:8px;">
      默认值：安装高度 {{ defaults.installationHeight }} m，有效监测范围 {{ defaults.effectiveRange }} m，检测范围 {{ defaults.detectionRange }}
    </div>
    <div class="control-subnote" style="margin-top:4px;">
      当前点位：{{ locationText }}
    </div>
    <div class="inline-actions" style="margin-top:10px;">
      <button class="sensor-btn primary" @click="$emit('start-picking')">
        <i class="fas fa-location-crosshairs"></i> {{ pickingButtonText }}
      </button>
      <button class="sensor-btn primary" @click="$emit('reset-draft')">
        <i class="fas fa-rotate-left"></i> 恢复默认值
      </button>
      <button class="sensor-btn primary" @click="$emit('confirm')">
        <i class="fas fa-circle-check"></i> 确认添加
      </button>
      <button class="sensor-btn danger" @click="$emit('cancel')">
        <i class="fas fa-xmark"></i> 取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  SmartMapManualSensorConfig,
  SmartMapManualSensorDraft,
  SmartMapPlacementPoint,
} from '../useSmartMapSensorPlacement'

defineOptions({
  name: 'SmartMapSensorManualConfigPanel',
})

const props = defineProps<{
  defaults: SmartMapManualSensorConfig
  draft: SmartMapManualSensorDraft
  locationText: string
  origin: SmartMapPlacementPoint | null
  pendingPoint: SmartMapPlacementPoint | null
  picking: boolean
  pickingOrigin: boolean
  pointLabel: string
  relativeX: number
  relativeY: number
  validation: {
    valid: boolean
    message: string
  }
}>()

defineEmits<{
  'apply-relative-coordinates': []
  cancel: []
  confirm: []
  'reset-draft': []
  'start-picking': []
  'toggle-origin-picking': []
  'update-draft': [patch: Partial<SmartMapManualSensorDraft>]
  'update-relative-x': [value: number]
  'update-relative-y': [value: number]
}>()

const originButtonText = computed(() => {
  if (props.pickingOrigin) return '选择中...'
  return props.origin ? '重设零点' : '设置零点'
})

const pickingButtonText = computed(() => {
  if (props.picking) return '正在地图选点'
  return props.pendingPoint ? '重新地图选点' : '开始地图选点'
})

function inputValue(event: Event): string {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

function numericValue(event: Event): number {
  if (!(event.target instanceof HTMLInputElement)) return 0
  return Number(event.target.value)
}
</script>
