import { computed, reactive, type ComputedRef } from 'vue'
import type { SmartMapToastType } from './useSmartMapToast'

export interface SmartMapRefinementPlaybackState {
  currentStep: number
  playing: boolean
  speed: number
  accumulatorMs: number
  frameDurationMs: number
}

interface SmartMapRefinementPlaybackOptions<TIteration> {
  iterations: ComputedRef<TIteration[]>
  render: () => void
  showToast: (message: string, type: SmartMapToastType) => void
  frameDurationMs?: number
}

export interface SmartMapRefinementLayerState<TIteration> {
  getCurrentIteration: () => TIteration | null
  isEmphasized: () => boolean
}

function clampStep(step: number, maxStep: number) {
  if (maxStep < 0) return 0
  if (!Number.isFinite(step)) return 0
  return Math.min(Math.max(step, 0), maxStep)
}

export function useSmartMapRefinementPlayback<TIteration>(
  options: SmartMapRefinementPlaybackOptions<TIteration>,
) {
  const refinementState = reactive<SmartMapRefinementPlaybackState>({
    currentStep: 0,
    playing: false,
    speed: 1,
    accumulatorMs: 0,
    frameDurationMs: options.frameDurationMs ?? 180,
  })

  const refinementCurrentIteration = computed(() => (
    options.iterations.value[refinementState.currentStep] || null
  ))

  function startRefinementPlayback(iterationCount: number) {
    refinementState.currentStep = 0
    refinementState.accumulatorMs = 0
    refinementState.playing = iterationCount > 1
  }

  function resetRefinementPlayback() {
    refinementState.currentStep = 0
    refinementState.accumulatorMs = 0
    refinementState.playing = false
  }

  function toggleRefinementPlayback() {
    if (!options.iterations.value.length) {
      options.showToast('请先完成溯源定位', 'warn')
      return
    }
    refinementState.playing = !refinementState.playing
    refinementState.accumulatorMs = 0
  }

  function seekRefinementStep(step: number) {
    if (!options.iterations.value.length) return
    refinementState.currentStep = clampStep(step, options.iterations.value.length - 1)
    refinementState.accumulatorMs = 0
    options.render()
  }

  function updateRefinementPlayback(deltaMs: number) {
    if (!refinementState.playing || options.iterations.value.length <= 1) return
    refinementState.accumulatorMs += deltaMs * refinementState.speed
    while (refinementState.accumulatorMs >= refinementState.frameDurationMs) {
      refinementState.accumulatorMs -= refinementState.frameDurationMs
      if (refinementState.currentStep >= options.iterations.value.length - 1) {
        refinementState.currentStep = options.iterations.value.length - 1
        refinementState.playing = false
        break
      }
      refinementState.currentStep += 1
    }
  }

  const refinementLayerState: SmartMapRefinementLayerState<TIteration> = {
    getCurrentIteration: () => refinementCurrentIteration.value,
    isEmphasized: () => Boolean(
      refinementCurrentIteration.value
      && refinementState.currentStep >= options.iterations.value.length - 1,
    ),
  }

  return {
    refinementLayerState,
    refinementCurrentIteration,
    refinementState,
    resetRefinementPlayback,
    seekRefinementStep,
    startRefinementPlayback,
    toggleRefinementPlayback,
    updateRefinementPlayback,
  }
}
