<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-route"></i> 逃生规划</div>
    <div class="info-row">
      <span class="info-key">规划状态</span>
      <span class="info-val">{{ summary.statusText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">逃生起点</span>
      <span class="info-val">{{ summary.startLabel }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">目标出口</span>
      <span class="info-val">{{ summary.exitLabel }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">路线长度</span>
      <span class="info-val">{{ summary.distanceText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">预计耗时</span>
      <span class="info-val">{{ summary.etaText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">路径风险</span>
      <span class="info-val">{{ summary.riskText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">危险屏蔽</span>
      <span class="info-val">{{ summary.blockedText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">规划内核</span>
      <span class="info-val">{{ summary.plannerText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">规划范围</span>
      <span class="info-val">{{ planningMode === 'all' ? '全建筑' : '当前建筑' }}</span>
    </div>
    <div v-if="candidateRouteCount" class="info-row">
      <span class="info-key">可达出口</span>
      <span class="info-val">{{ candidateRouteCount }} 条</span>
    </div>
    <div v-if="batchResult" class="info-row">
      <span class="info-key">可达建筑</span>
      <span class="info-val">{{ batchResult.reachableCount }}/{{ batchResult.totalBuildings }}</span>
    </div>
    <div v-if="batchResult" class="info-row">
      <span class="info-key">阻断建筑</span>
      <span class="info-val">{{ batchResult.blockedCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapEvacuationBatchResult } from '../useSmartMapEvacuationPlanning'

export interface SmartMapEvacuationSummaryPanelData {
  statusText: string
  startLabel: string
  exitLabel: string
  distanceText: string
  etaText: string
  riskText: string
  blockedText: string
  plannerText: string
}

defineOptions({
  name: 'SmartMapEvacuationSummaryPanel',
})

defineProps<{
  batchResult: SmartMapEvacuationBatchResult | null
  candidateRouteCount: number
  planningMode: string
  summary: SmartMapEvacuationSummaryPanelData
}>()
</script>
