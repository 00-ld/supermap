<template>
  <div class="search-box">
    <i class="fas fa-search"></i>
    <input
      type="text"
      placeholder="搜索设施 / 区域..."
      :value="modelValue"
      @input="handleInput"
    >
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapSearchBox',
})

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
}>()

function handleInput(event: Event) {
  const target = event.target
  emit('update:modelValue', target instanceof HTMLInputElement ? target.value : '')
  emit('search')
}
</script>

<style scoped>
.search-box {
  position: relative;
  margin-bottom: 12px;
}
.search-box input {
  width: 100%;
  height: 36px;
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 12px 0 36px;
  color: var(--fg);
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
}
.search-box input::placeholder {
  color: #4a5568;
}
.search-box input:focus {
  border-color: var(--accent);
  background: #1b2533;
}
.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--fg-muted);
  font-size: 13px;
}
</style>
