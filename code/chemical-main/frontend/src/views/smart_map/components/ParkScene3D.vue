<template>
  <div class="scene-3d-container">
    <SuperMapSceneViewer
      :show-status-panel="false"
      @facility-click="emit('facility-click', $event)"
      @scene-object-pick="emit('scene-object-pick', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import SuperMapSceneViewer from '@/components/SuperMapSceneViewer.vue'
import type { SuperMapScenePickEventPayload } from '@/types/supermap-scene-events'

defineOptions({
  name: 'ParkScene3D',
})

const emit = defineEmits<{
  (e: 'facility-click', id: string): void
  (e: 'scene-object-pick', payload: SuperMapScenePickEventPayload): void
}>()
</script>

<style scoped>
.scene-3d-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #06111f;
}
</style>
