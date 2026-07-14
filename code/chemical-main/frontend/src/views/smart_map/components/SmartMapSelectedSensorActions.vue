<template>
  <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
    <button class="sensor-btn primary" style="width:100%;margin-bottom:8px;" @click="$emit('edit')">
      <i class="fas fa-edit"></i> 编辑参数
    </button>
    <button class="sensor-btn danger" style="width:100%;" @click="$emit('delete')">
      <i class="fas fa-minus-circle"></i> 删除此传感器
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'SmartMapSelectedSensorActions',
})

defineEmits<{
  delete: []
  edit: []
}>()
</script>
