<template>
  <div class="panel-section">
    <div class="panel-title"><i class="fas fa-building-shield"></i> 建筑疏散列表</div>
    <div v-if="routes.length" class="candidate-list">
      <button
        v-for="route in routes"
        :key="route.buildingId"
        class="candidate-item"
        :class="{
          active: selectedBuildingId === route.buildingId,
          blocked: !route.isReachable,
        }"
        @click="$emit('select-building', route.buildingId)"
      >
        <div class="candidate-main">
          <span class="candidate-rank">B</span>
          <span class="candidate-name">{{ route.buildingName }}</span>
          <span class="candidate-score">{{ route.isReachable ? '可达' : '阻断' }}</span>
        </div>
        <div class="candidate-meta">
          <span>{{ route.entranceLabel }}</span>
          <span>{{ route.isReachable ? route.exitLabel : '无可用出口' }}</span>
          <span>{{ route.isReachable ? `${route.distanceMeters.toFixed(1)} m` : route.message }}</span>
        </div>
      </button>
    </div>
    <div v-else class="empty-block">先点击“全建筑路径”生成园区疏散结果</div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapEvacuationRoute } from '../useSmartMapEvacuationPlanning'

defineOptions({
  name: 'SmartMapEvacuationBuildingPanel',
})

defineProps<{
  routes: SmartMapEvacuationRoute[]
  selectedBuildingId: string
}>()

defineEmits<{
  'select-building': [buildingId: string]
}>()
</script>
