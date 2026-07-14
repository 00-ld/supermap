<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-satellite-dish"></i> 溯源观测</div>
    <div class="info-row">
      <span class="info-key">数据集状态</span>
      <span class="info-val">{{ observationSummary ? '已整理' : '待整理' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">有效传感器</span>
      <span class="info-val">{{ observationSummary ? `${observationSummary.activeSensors}/${observationSummary.sensorCount}` : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">读数来源</span>
      <span class="info-val">{{ observationSummary ? observationSummary.sourceBreakdownText : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">真实性边界</span>
      <span class="info-val">{{ observationSummary ? observationSummary.evidenceLabel : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">后端读数</span>
      <span class="info-val">{{ sensorReadingStatusText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">后端边界</span>
      <span class="info-val">{{ sensorReadingBoundaryText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">时序点数</span>
      <span class="info-val">{{ observationSummary ? observationSummary.totalSeriesPoints : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">总时长</span>
      <span class="info-val">{{ observationSummary ? `${observationSummary.totalDurationSec}s` : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">候选区域</span>
      <span class="info-val">{{ coarseSearchSummary ? coarseSearchSummary.candidateCount : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">推荐候选</span>
      <span class="info-val">{{ coarseSearchSummary ? coarseSearchSummary.bestLabel : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">候选坐标</span>
      <span class="info-val">{{ coarseSearchSummary ? coarseSearchSummary.bestCoord : '--' }}</span>
    </div>
    <div v-if="observationPayloadPreview" class="json-preview">{{ observationPayloadPreview }}</div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapCoarseSummary, SmartMapObservationSummary } from '../useSmartMapInversion'

defineOptions({
  name: 'SmartMapObservationSummaryPanel',
})

defineProps<{
  coarseSearchSummary: SmartMapCoarseSummary | null
  observationPayloadPreview: string
  observationSummary: SmartMapObservationSummary | null
  sensorReadingBoundaryText: string
  sensorReadingStatusText: string
}>()
</script>
