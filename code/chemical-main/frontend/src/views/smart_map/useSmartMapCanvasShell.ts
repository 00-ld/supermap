import { ref } from 'vue'

export function useSmartMapCanvasShell<TScene>() {
  const mapCanvasRef = ref<HTMLCanvasElement | null>(null)
  const mapContainerRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)
  const viewMode = ref<'2d' | '3d'>('2d')
  const scene3DRef = ref<TScene>()

  return {
    isDragging,
    mapCanvasRef,
    mapContainerRef,
    scene3DRef,
    viewMode,
  }
}
