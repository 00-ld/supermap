<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-list-ol"></i> 粗搜候选列表</div>
    <div v-if="candidates.length" class="candidate-list">
      <button
        v-for="candidate in candidates"
        :key="candidate.candidateId"
        class="candidate-item"
        :class="{ active: selectedCandidateId === candidate.candidateId }"
        @click="$emit('select-candidate', candidate.candidateId)"
      >
        <div class="candidate-main">
          <span class="candidate-rank">C{{ candidate.rank }}</span>
          <span class="candidate-name">{{ candidate.label }}</span>
          <span class="candidate-score">S {{ candidate.score.toFixed(3) }}</span>
        </div>
        <div class="candidate-meta">
          <span>{{ candidate.center.x.toFixed(0) }}, {{ candidate.center.y.toFixed(0) }}</span>
          <span>支持 {{ candidate.supportCount }}</span>
          <span>误差 {{ candidate.error.toFixed(3) }}</span>
        </div>
      </button>
    </div>
    <div v-else class="empty-block">先点击“生成候选区域”查看粗搜结果</div>
    <div v-if="selectedCandidate" class="candidate-detail-card">
      <div class="candidate-detail-head">
        <span>{{ selectedCandidate.label }}</span>
        <span>半径 {{ selectedCandidate.radius }}m</span>
      </div>
      <div class="candidate-detail-grid">
        <span>排名 C{{ selectedCandidate.rank }}</span>
        <span>得分 {{ selectedCandidate.score.toFixed(3) }}</span>
        <span>支持传感器 {{ selectedCandidate.supportCount }}</span>
        <span>误差 {{ selectedCandidate.error.toFixed(3) }}</span>
        <span>X {{ selectedCandidate.center.x.toFixed(0) }}</span>
        <span>Y {{ selectedCandidate.center.y.toFixed(0) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapSourceCandidateRegion } from '../useSmartMapSourceInversionOverlay'

defineOptions({
  name: 'SmartMapCoarseCandidatePanel',
})

defineProps<{
  candidates: SmartMapSourceCandidateRegion[]
  selectedCandidate: SmartMapSourceCandidateRegion | null
  selectedCandidateId: string
}>()

defineEmits<{
  'select-candidate': [candidateId: string]
}>()
</script>
