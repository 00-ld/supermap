<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-bullseye"></i> 溯源定位结果</div>
    <div class="info-row">
      <span class="info-key">定位状态</span>
      <span class="info-val">{{ summary ? '已完成' : '待运行' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">定位方式</span>
      <span class="info-val">{{ summary?.method || '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">当前迭代</span>
      <span class="info-val">{{ currentIteration ? `${currentIteration.iteration}/${summary?.totalIterations}` : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">当前误差</span>
      <span class="info-val">{{ currentIteration ? currentIteration.loss.toFixed(4) : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">估计坐标</span>
      <span class="info-val">{{ summary ? summary.estimatedCoord : '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">可信半径</span>
      <span class="info-val">{{ summary?.credibleRadiusText || '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">释放强度</span>
      <span class="info-val">{{ summary?.emissionRateText || '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">诊断指标</span>
      <span class="info-val">{{ summary?.diagnosticText || '--' }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">播放状态</span>
      <span class="info-val">{{ playbackText }}</span>
    </div>
    <div class="info-row">
      <span class="info-key">源点偏差</span>
      <span class="info-val">{{ summary?.sourceMatchError != null ? `${summary.sourceMatchError}m` : '--' }}</span>
    </div>
    <input
      v-if="iterations.length"
      class="timeline-slider"
      type="range"
      min="0"
      :max="Math.max(iterations.length - 1, 0)"
      :value="currentStep"
      @input="$emit('seek-step', Number(($event.target as HTMLInputElement).value))"
    >
    <div v-if="inputSummary" class="sampling-row">
      <span>候选 {{ inputSummary.candidateLabel }}</span>
      <span>有效传感器 {{ inputSummary.activeSensorCount }}</span>
      <span>迭代 {{ inputSummary.animationSteps }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SmartMapRecord } from '../useSmartMapInversion'
import type { SmartMapSourceRefinementIteration } from '../useSmartMapSourceInversionOverlay'

interface SmartMapRefinementSummary extends SmartMapRecord {
  method?: string
  totalIterations?: number
  estimatedCoord?: string
  credibleRadiusText?: string
  emissionRateText?: string
  diagnosticText?: string
  sourceMatchError?: number | string | null
}

interface SmartMapRefinementInputSummary {
  candidateLabel: string
  activeSensorCount: number
  animationSteps: unknown
}

const props = defineProps<{
  currentIteration: SmartMapSourceRefinementIteration | null
  currentStep: number
  inputSummary: SmartMapRefinementInputSummary | null
  iterations: SmartMapSourceRefinementIteration[]
  summary: SmartMapRefinementSummary | null
}>()

defineOptions({
  name: 'SmartMapRefinementSummaryPanel',
})

defineEmits<{
  'seek-step': [step: number]
}>()

const playbackText = computed(() => {
  if (!props.currentIteration) return '--'
  return props.currentStep >= props.iterations.length - 1 ? '已收敛到预测源点' : '收缩搜索中'
})
</script>
