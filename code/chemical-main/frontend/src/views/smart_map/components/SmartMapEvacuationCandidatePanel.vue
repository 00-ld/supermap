<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-shoe-prints"></i> 逃生候选路线</div>
    <div v-if="planningMode === 'all' && batchResult" class="inline-actions">
      <button
        class="sensor-btn primary"
        :class="{ active: displayMode === 'selected' }"
        @click="$emit('update:displayMode', 'selected')"
      >
        仅看当前建筑
      </button>
      <button
        class="sensor-btn primary"
        :class="{ active: displayMode === 'all' }"
        @click="$emit('update:displayMode', 'all')"
      >
        显示全部路径
      </button>
    </div>
    <div v-if="routes.length" class="candidate-list">
      <button
        v-for="route in routes"
        :key="route.candidateId"
        class="candidate-item"
        :class="{ active: selectedCandidateId === route.candidateId }"
        @click="$emit('select-candidate', route.candidateId)"
      >
        <div class="candidate-main">
          <span class="candidate-rank">R{{ route.rank }}</span>
          <span class="candidate-name">{{ route.exitLabel }}</span>
          <span class="candidate-score">
            {{ route.candidateId === recommendedCandidateId ? '推荐' : '备选' }}
          </span>
        </div>
        <div class="candidate-meta">
          <span>{{ route.distanceMeters.toFixed(1) }} m</span>
          <span>{{ route.estimatedTimeSec.toFixed(0) }} s</span>
          <span>峰值 {{ Number(route.peakConcentration || 0).toFixed(1) }}</span>
          <span>{{ route.riskLevelText }}</span>
        </div>
      </button>
    </div>
    <div v-else class="empty-block">先点击“逃生规划”生成可用疏散路线</div>
    <div v-if="selectedCandidate" class="candidate-detail-card">
      <div class="candidate-detail-head">
        <span>{{ selectedCandidate.exitLabel }}</span>
        <span>
          {{ selectedCandidate.candidateId === recommendedCandidateId ? '推荐路线' : '当前查看' }}
        </span>
      </div>
      <div class="candidate-detail-grid">
        <span>排名 R{{ selectedCandidate.rank || 1 }}</span>
        <span>长度 {{ selectedCandidate.distanceMeters.toFixed(1) }} m</span>
        <span>耗时 {{ selectedCandidate.estimatedTimeSec.toFixed(0) }} s</span>
        <span>峰值 {{ Number(selectedCandidate.peakConcentration || 0).toFixed(1) }} ppm</span>
        <span>风险 {{ selectedCandidate.riskLevelText }}</span>
        <span>屏蔽节点 {{ selectedCandidate.dangerMask?.blockedNodeCount || 0 }}</span>
        <span>屏蔽路段 {{ selectedCandidate.dangerMask?.blockedEdgeCount || 0 }}</span>
        <span v-if="selectedCandidate.selectionReason" class="wide-detail">{{ selectedCandidate.selectionReason }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapEvacuationBatchResult, SmartMapEvacuationRoute } from '../useSmartMapEvacuationPlanning'

defineOptions({
  name: 'SmartMapEvacuationCandidatePanel',
})

defineProps<{
  batchResult: SmartMapEvacuationBatchResult | null
  displayMode: string
  planningMode: string
  recommendedCandidateId: string
  routes: SmartMapEvacuationRoute[]
  selectedCandidate: SmartMapEvacuationRoute | null
  selectedCandidateId: string
}>()

defineEmits<{
  'select-candidate': [candidateId: string]
  'update:displayMode': [displayMode: string]
}>()
</script>
