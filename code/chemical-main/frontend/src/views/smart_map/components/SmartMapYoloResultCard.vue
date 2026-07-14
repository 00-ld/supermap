<template>
  <div v-if="visibleResult" class="yolo-result-card">
    <div class="sensor-history-head">
      <span>YOLO 检测结果</span>
      <span>{{ visibleResult.count }} 人</span>
    </div>
    <img
      v-if="visibleResult.imageBase64"
      :src="normalizeYoloImage(visibleResult.imageBase64)"
      class="yolo-result-img"
    >
    <div class="yolo-result-time">{{ new Date(visibleResult.timestamp).toLocaleTimeString() }} 检测</div>
    <div v-if="visibleResult.modelVersion" class="yolo-result-time">模型 {{ visibleResult.modelVersion }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { normalizeYoloImage, type SmartMapYoloResult } from '../useSmartMapYolo'

defineOptions({
  name: 'SmartMapYoloResultCard',
})

const props = defineProps<{
  result: SmartMapYoloResult | null
  selectedCarId: number | null
}>()

const visibleResult = computed(() => (
  props.result && props.result.carId === props.selectedCarId ? props.result : null
))
</script>

<style scoped>
.yolo-result-card {
  margin-top: 12px;
  padding: 12px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(154,168,184,0.18);
  border-radius: 8px;
}
.sensor-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--fg-muted);
  font-size: 11px;
}
.yolo-result-img {
  width: 100%;
  height: auto;
  border-radius: 6px;
  margin-top: 8px;
  border: 1px solid rgba(255,255,255,0.1);
}
.yolo-result-time {
  font-size: 11px;
  color: var(--fg-muted);
  text-align: center;
  margin-top: 6px;
}
</style>
