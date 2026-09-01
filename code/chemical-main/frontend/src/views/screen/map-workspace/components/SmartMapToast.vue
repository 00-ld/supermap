<template>
  <div class="toast" :class="[visible ? 'show' : '', type]">
    <i :class="icon"></i>
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapToastType } from '../useSmartMapToast'

defineOptions({
  name: 'SmartMapToast',
})

defineProps<{
  visible: boolean
  text: string
  type: SmartMapToastType
  icon: string
}>()
</script>

<style scoped>
.toast {
  position: fixed;
  top: 72px;
  right: 24px;
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 20px;
  font-size: 13px;
  color: var(--fg);
  z-index: 200;
  backdrop-filter: blur(20px);
  transform: translateX(400px);
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.toast.show {
  transform: translateX(0);
}
.toast i {
  font-size: 16px;
}
.toast.success i {
  color: var(--accent);
}
.toast.warn i {
  color: var(--warning);
}
</style>
