<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-wave-square"></i> 扩散监测</div>
    <div class="info-row">
      <span class="info-key">当前气体</span>
      <span class="info-val">{{ summary.gasName }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">泄漏源</span>
      <span class="info-val">{{ summary.sourceName }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">当前时间</span>
      <span class="info-val">{{ summary.timeText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">最大浓度</span>
      <span class="info-val">{{ summary.maxConcentration }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">影响面积</span>
      <span class="info-val">{{ summary.affectedArea }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">危险面积</span>
      <span class="info-val">{{ summary.dangerArea }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface SmartMapDiffusionSummaryPanelData {
  gasName: string
  sourceName: string
  timeText: string
  maxConcentration: string
  affectedArea: string
  dangerArea: string
}

defineOptions({
  name: 'SmartMapDiffusionSummaryPanel',
})

defineProps<{
  summary: SmartMapDiffusionSummaryPanelData
}>()
</script>
