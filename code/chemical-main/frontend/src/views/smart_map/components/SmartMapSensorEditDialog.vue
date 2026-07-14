<template>
  <div v-if="visible" class="sensor-edit-overlay" @click.self="emit('close')">
    <div class="sensor-edit-panel">
      <div class="sensor-edit-header">
        <span>编辑传感器参数</span>
        <button class="close-btn" @click="emit('close')"><i class="fas fa-times"></i></button>
      </div>
      <div class="sensor-edit-body">
        <label class="control-field">
          <span>安装高度 (m)</span>
          <input :value="draft.installationHeight" type="number" min="0.3" max="10" step="0.1" @input="updateNumber('installationHeight', $event)">
        </label>
        <label class="control-field">
          <span>有效监测范围 (m)</span>
          <input :value="draft.effectiveRange" type="number" min="5" max="100" step="1" @input="updateNumber('effectiveRange', $event)">
        </label>
        <label class="control-field">
          <span>检测范围</span>
          <input :value="draft.detectionRange" type="text" placeholder="如 0-1000 ppm" @input="updateText('detectionRange', $event)">
        </label>
        <label class="control-field">
          <span>优先级</span>
          <select :value="draft.priority" @change="updateNumber('priority', $event)">
            <option :value="1">1 - 重大风险</option>
            <option :value="2">2 - 较大风险</option>
            <option :value="3">3 - 一般风险</option>
            <option :value="4">4 - 低风险</option>
          </select>
        </label>
        <label class="control-field">
          <span>风险值</span>
          <input :value="draft.risk" type="number" min="0" max="1" step="0.05" @input="updateNumber('risk', $event)">
        </label>
        <label class="control-field wide-field">
          <span>布点说明</span>
          <input :value="draft.installRemark" type="text" placeholder="安装位置备注" @input="updateText('installRemark', $event)">
        </label>
        <div class="inline-actions sensor-edit-actions">
          <button class="sensor-btn cancel-btn" @click="emit('close')">取消</button>
          <button class="sensor-btn primary" @click="emit('save')"><i class="fas fa-save"></i> 保存修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapSensorEditDraft } from '../useSmartMapSensorEditor'

defineOptions({
  name: 'SmartMapSensorEditDialog',
})

defineProps<{
  visible: boolean
  draft: SmartMapSensorEditDraft
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save'): void
  (event: 'update-draft', patch: Partial<SmartMapSensorEditDraft>): void
}>()

type NumberDraftField = 'installationHeight' | 'effectiveRange' | 'priority' | 'risk'
type TextDraftField = 'detectionRange' | 'installRemark'

function getEventValue(event: Event) {
  return (event.target as HTMLInputElement | HTMLSelectElement).value
}

function updateNumber(field: NumberDraftField, event: Event) {
  const value = Number(getEventValue(event))
  if (field === 'installationHeight') {
    emit('update-draft', { installationHeight: value })
    return
  }
  if (field === 'effectiveRange') {
    emit('update-draft', { effectiveRange: value })
    return
  }
  if (field === 'priority') {
    emit('update-draft', { priority: value })
    return
  }
  emit('update-draft', { risk: value })
}

function updateText(field: TextDraftField, event: Event) {
  const value = getEventValue(event).trim()
  if (field === 'detectionRange') {
    emit('update-draft', { detectionRange: value })
    return
  }
  emit('update-draft', { installRemark: value })
}
</script>

<style scoped>
.sensor-edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.sensor-edit-panel {
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--bg-card, #1a2332);
  border: 1px solid var(--border, rgba(255,255,255,0.1));
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.sensor-edit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.1));
  font-weight: 600;
  font-size: 14px;
  color: var(--fg, #e0e8f0);
}
.sensor-edit-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}
.wide-field {
  grid-column: 1 / -1;
}
.sensor-edit-actions {
  margin-top: 16px;
  justify-content: flex-end;
}
.cancel-btn {
  background: var(--bg-elevated);
  color: var(--fg);
  border: 1px solid var(--border);
}
</style>
