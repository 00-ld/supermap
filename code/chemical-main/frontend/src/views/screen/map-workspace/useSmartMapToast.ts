import { ref } from 'vue'

export type SmartMapToastType = 'success' | 'warn' | 'error' | 'danger'

function toastIconFor(type: SmartMapToastType) {
  if (type === 'warn') return 'fas fa-exclamation-triangle'
  if (type === 'error' || type === 'danger') return 'fas fa-circle-exclamation'
  return 'fas fa-check-circle'
}

export function useSmartMapToast() {
  const toastVisible = ref(false)
  const toastText = ref('')
  const toastType = ref<SmartMapToastType>('success')
  const toastIcon = ref('fas fa-check-circle')
  let toastTimer = 0

  function clearToastTimer() {
    clearTimeout(toastTimer)
  }

  function showToast(text: string, type: SmartMapToastType = 'success') {
    toastText.value = text
    toastType.value = type
    toastIcon.value = toastIconFor(type)
    toastVisible.value = true
    clearToastTimer()
    toastTimer = setTimeout(() => { toastVisible.value = false }, 2500)
  }

  return {
    clearToastTimer,
    showToast,
    toastIcon,
    toastText,
    toastType,
    toastVisible,
  }
}
