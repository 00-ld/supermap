<template>
  <div class="sampling-row">
    <span>当前帧有读数 {{ summary.sampled }} 个</span>
    <span>预警 {{ summary.warning }} 个</span>
    <span>危险 {{ summary.danger }} 个</span>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapSamplingSummary',
})

defineProps<{
  summary: {
    sampled: number
    warning: number
    danger: number
  }
}>()
</script>
