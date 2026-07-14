<template>
  <div class="panel-section">
    <div class="panel-title" style="cursor:pointer;" @click="$emit('toggle-visible')">
      <i class="fas fa-flask"></i> 气体类型管理
      <span style="margin-left:auto;font-size:11px;color:var(--fg-muted);">{{ gases.length }} 种</span>
      <i class="fas" :class="visible ? 'fa-chevron-up' : 'fa-chevron-down'" style="margin-left:6px;"></i>
    </div>
    <div v-if="visible">
      <div v-if="gases.length === 0" class="control-note" style="margin-top:6px;">暂无气体类型数据</div>
      <div v-for="gas in gases" :key="gas.id" class="gas-item" style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-weight:bold;min-width:40px;font-size:12px;color:#b4beca;">{{ gas.id }}</span>
        <span style="flex:1;font-size:11px;">{{ gas.name }}</span>
        <span style="font-size:10px;color:var(--fg-muted);">{{ gas.detectionRange }}</span>
        <button class="tool-btn" style="padding:2px 6px;font-size:10px;" @click="$emit('edit-gas', gas)"><i class="fas fa-pen"></i></button>
        <button class="tool-btn" style="padding:2px 6px;font-size:10px;color:#d6a0a0;" @click="$emit('remove-gas', gas.id)"><i class="fas fa-trash"></i></button>
      </div>
      <div class="inline-actions" style="margin-top:8px;">
        <button class="sensor-btn primary" style="font-size:11px;padding:4px 10px;" @click="$emit('reset-draft')">
          <i class="fas fa-plus"></i> 新增气体
        </button>
        <button class="sensor-btn primary" style="font-size:11px;padding:4px 10px;" :disabled="!draft.id" @click="$emit('save-draft')">
          <i class="fas fa-save"></i> 保存
        </button>
      </div>
      <div class="control-grid" style="margin-top:6px;grid-template-columns:1fr 1fr;">
        <label class="control-field" style="grid-column:1 / -1;">
          <span>气体编号 / 名称</span>
          <div style="display:flex;gap:4px;">
            <input v-model.trim="draft.id" type="text" placeholder="编号 (如 CO)" style="width:80px;">
            <input v-model.trim="draft.name" type="text" placeholder="名称 (如一氧化碳)" style="flex:1;">
          </div>
        </label>
        <label class="control-field" style="grid-column:1 / -1;">
          <span>检测范围</span>
          <input v-model.trim="draft.detectionRange" type="text" placeholder="如 0-1000 ppm">
        </label>
        <label class="control-field">
          <span>安装高度 (m)</span>
          <input v-model.number="draft.installationHeight" type="number" min="0.3" max="10" step="0.1">
        </label>
        <label class="control-field">
          <span>有效范围 (m)</span>
          <input v-model.number="draft.effectiveRange" type="number" min="5" max="100" step="1">
        </label>
        <label class="control-field">
          <span>优先级</span>
          <select v-model.number="draft.priority">
            <option :value="1">1 - 重大风险</option>
            <option :value="2">2 - 较大风险</option>
            <option :value="3">3 - 一般风险</option>
            <option :value="4">4 - 低风险</option>
          </select>
        </label>
        <label class="control-field">
          <span>风险值</span>
          <input v-model.number="draft.risk" type="number" min="0" max="1" step="0.05">
        </label>
        <label class="control-field" style="grid-column:1 / -1;">
          <span>备注</span>
          <input v-model.trim="draft.installRemark" type="text" placeholder="布点说明">
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GasRecord, GasSavePayload } from '@/api/gas'

defineOptions({
  name: 'SmartMapGasEditorPanel',
})

defineProps<{
  draft: GasSavePayload
  gases: GasRecord[]
  visible: boolean
}>()

defineEmits<{
  'edit-gas': [gas: GasRecord]
  'remove-gas': [gasId: string]
  'reset-draft': []
  'save-draft': []
  'toggle-visible': []
}>()
</script>
