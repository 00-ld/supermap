<template>
  <section class="screen-entry">
    <SuperMapSceneViewer />
  </section>
</template>

<script setup lang="ts">
import SuperMapSceneViewer from '@/components/SuperMapSceneViewer.vue'

defineOptions({
  name: 'SuperMapScreenEntry',
})
</script>

<style scoped>
.screen-entry {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #06111f;
}
</style>
