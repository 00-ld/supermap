<template>
  <div class="candidate-detail-card" style="margin-top:10px;">
    <div class="candidate-detail-head">
      <span>批量导入传感器</span>
      <span>{{ preview.length }} 个点位</span>
    </div>
    <div class="control-grid" style="margin-top:10px;">
      <label class="control-field" style="grid-column:1 / -1;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span>直接粘贴Excel数据 (X Y 高度)</span>
          <button class="sensor-btn" style="padding:2px 8px;font-size:11px;" @click="$emit('paste')">
            <i class="fas fa-paste"></i> 粘贴
          </button>
        </div>
        <textarea
          :value="text"
          rows="6"
          style="width:100%;background:#0a0f1a;color:#e0e0e0;border:1px solid #2a3a2a;border-radius:6px;padding:8px;font-family:monospace;font-size:12px;resize:vertical;"
          placeholder="支持格式:&#10;15  10  1.5&#10;23  10  1.5&#10;或: 15,10,1.5&#10;或: 15 10"
          @input="$emit('update:text', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </label>
      <div style="grid-column:1 / -1;display:flex;gap:8px;align-items:center;">
        <span style="font-size:11px;color:#888;">默认:</span>
        <label style="display:flex;align-items:center;gap:4px;font-size:11px;">
          高度
          <input
            :value="defaultHeight"
            type="number"
            min="0.3"
            max="10"
            step="0.1"
            style="width:50px;background:#0a0f1a;color:#e0e0e0;border:1px solid #2a3a2a;border-radius:4px;padding:2px 4px;font-size:11px;"
            @input="$emit('update:defaultHeight', Number(($event.target as HTMLInputElement).value))"
          >
          m
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:11px;">
          范围
          <input
            :value="defaultRange"
            type="number"
            min="0"
            max="20"
            step="0.1"
            style="width:50px;background:#0a0f1a;color:#e0e0e0;border:1px solid #2a3a2a;border-radius:4px;padding:2px 4px;font-size:11px;"
            @input="$emit('update:defaultRange', Number(($event.target as HTMLInputElement).value))"
          >
          m
        </label>
      </div>
      <div v-if="preview.length > 0" style="grid-column:1 / -1;max-height:120px;overflow-y:auto;background:#0a0f1a;border-radius:6px;padding:6px;font-size:11px;">
        <div v-for="(item, idx) in preview.slice(0, 20)" :key="idx" style="display:flex;justify-content:space-between;padding:2px 0;">
          <span style="color:#b4beca;">{{ item.id }}</span>
          <span>({{ item.x.toFixed(1) }}, {{ item.y.toFixed(1) }})</span>
        </div>
        <div v-if="preview.length > 20" style="color:#888;text-align:center;padding:4px;">... 共 {{ preview.length }} 个</div>
      </div>
      <button
        class="sensor-btn primary"
        :disabled="preview.length === 0"
        style="grid-column:1 / -1;width:100%;"
        @click="$emit('execute')"
      >
        <i class="fas fa-upload"></i> 一键导入 {{ preview.length }} 个传感器
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapBatchImportPoint } from '../useSmartMapSensorBatchImport'

defineOptions({
  name: 'SmartMapSensorBatchImportPanel',
})

defineProps<{
  defaultHeight: number
  defaultRange: number
  preview: SmartMapBatchImportPoint[]
  text: string
}>()

defineEmits<{
  execute: []
  paste: []
  'update:defaultHeight': [value: number]
  'update:defaultRange': [value: number]
  'update:text': [value: string]
}>()
</script>
