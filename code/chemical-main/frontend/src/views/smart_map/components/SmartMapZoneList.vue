<template>
  <div class="zone-list">
    <div
      v-for="zone in zones"
      :key="zone.id"
      class="zone-item"
      :class="{ selected: selectedZone === zone.id }"
      @click="$emit('select-zone', zone.id)"
    >
      <div class="zone-name">
        <div class="zone-color" :style="{ background: zone.color }"></div>
        {{ zone.name }}
      </div>
      <span class="zone-tag">{{ zone.tag }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapZoneList',
})

defineProps<{
  zones: Array<{
    id: string
    name: string
    color: string
    tag: string
  }>
  selectedZone: string
}>()

defineEmits<{
  'select-zone': [zoneId: string]
}>()
</script>

<style scoped>
.zone-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.zone-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s;
  font-size: 13px;
  border: 1px solid transparent;
}
.zone-item:hover {
  background: #1e293b;
}
.zone-item.selected {
  background: #1b2533;
  border-color: var(--accent);
  color: var(--accent);
}
.zone-name {
  display: flex;
  align-items: center;
  gap: 8px;
}
.zone-color {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
.zone-tag {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #2d3748;
  color: var(--fg-muted);
}
.zone-item.selected .zone-tag {
  background: #1b2533;
  color: var(--accent);
}
</style>
