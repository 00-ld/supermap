<template>
  <div class="alert-list">
    <div v-for="(alert, index) in alerts" :key="index" class="alert-item" :class="alert.type">
      <div class="alert-icon"><i :class="alert.icon"></i></div>
      <div>
        <div class="alert-text">{{ alert.text }}</div>
        <div class="alert-time">{{ alert.time }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapAlertList',
})

defineProps<{
  alerts: Array<{
    type: string
    icon: string
    text: string
    time: string
  }>
}>()
</script>

<style scoped>
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #1e293b;
  border-radius: 8px;
  border-left: 3px solid transparent;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.alert-item:hover {
  background: #253345;
}
.alert-item.warn {
  border-left-color: var(--warning);
}
.alert-item.error {
  border-left-color: var(--danger);
}
.alert-item.info {
  border-left-color: var(--info);
}
.alert-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  flex-shrink: 0;
  margin-top: 1px;
}
.alert-item.warn .alert-icon {
  background: #2a2418;
  color: var(--warning);
}
.alert-item.error .alert-icon {
  background: #2b1d22;
  color: var(--danger);
}
.alert-item.info .alert-icon {
  background: #192433;
  color: var(--info);
}
.alert-text {
  color: var(--fg-muted);
  line-height: 1.4;
}
.alert-time {
  font-size: 10px;
  color: #4a5568;
  margin-top: 3px;
}
</style>
