import { ref } from 'vue'

export function useSmartMapCanvasShell() {
  const mapCanvasRef = ref<HTMLCanvasElement | null>(null)
  const mapContainerRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const viewMode = ref<'2d' | '3d'>('2d')

  return {
    isDragging,
    mapCanvasRef,
    mapContainerRef,
    viewMode,
  }
}
