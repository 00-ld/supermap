import { computed, reactive, type Ref } from 'vue'

import { DEFAULT_DIFFUSION_FRAME_DURATION_MS } from '@/utils/diffusionPlaybackTiming'

export interface SmartMapDiffusionPlaybackState {
  currentFrame: number
  playing: boolean
  running: boolean
  loop: boolean
  speed: number
  accumulatorMs: number
  frameDurationMs: number
}

export interface SmartMapDiffusionRunState {
  isRunning: () => boolean
}

interface SmartMapDiffusionPlaybackOptions<TFrame> {
  frames: Ref<TFrame[]>
  render: () => void
  frameDurationMs?: number
}

function clampFrameIndex(frameIndex: number, maxIndex: number) {
  if (maxIndex < 0) return 0
  if (!Number.isFinite(frameIndex)) return 0
  return Math.min(Math.max(frameIndex, 0), maxIndex)
}

export function useSmartMapDiffusionPlayback<TFrame>(
  options: SmartMapDiffusionPlaybackOptions<TFrame>,
) {
  const diffusionState = reactive<SmartMapDiffusionPlaybackState>({
    currentFrame: 0,
    playing: false,
    running: false,
    loop: true,
    speed: 1,
    accumulatorMs: 0,
    frameDurationMs:
      options.frameDurationMs ?? DEFAULT_DIFFUSION_FRAME_DURATION_MS,
  })

  const currentDiffusionFrame = computed<TFrame | null>(
    () => options.frames.value[diffusionState.currentFrame] || null,
  )

  function getCurrentDiffusionFrame() {
    return currentDiffusionFrame.value
  }

  function getCurrentDiffusionFrameIndex() {
    return diffusionState.currentFrame
  }

  function setDiffusionRunning(running: boolean) {
    diffusionState.running = running
  }

  function resetDiffusionPlayback() {
    diffusionState.currentFrame = 0
    diffusionState.playing = false
    diffusionState.running = false
    diffusionState.accumulatorMs = 0
  }

  function startDiffusionPlaybackFromFirstFrame() {
    diffusionState.currentFrame = 0
    diffusionState.accumulatorMs = 0
    diffusionState.playing = options.frames.value.length > 1
  }

  function toggleDiffusionPlayback() {
    if (!options.frames.value.length) return
    diffusionState.playing = !diffusionState.playing
    diffusionState.accumulatorMs = 0
  }

  function seekDiffusionFrame(frameIndex: number) {
    if (!options.frames.value.length) return
    diffusionState.currentFrame = clampFrameIndex(
      frameIndex,
      options.frames.value.length - 1,
    )
    diffusionState.accumulatorMs = 0
    options.render()
  }

  function stepDiffusionFrame(direction: number) {
    if (!options.frames.value.length) return
    seekDiffusionFrame(diffusionState.currentFrame + direction)
  }

  function updateDiffusionPlayback(deltaMs: number) {
    if (!diffusionState.playing || options.frames.value.length <= 1) return
    diffusionState.accumulatorMs += deltaMs * diffusionState.speed
    while (diffusionState.accumulatorMs >= diffusionState.frameDurationMs) {
      diffusionState.accumulatorMs -= diffusionState.frameDurationMs
      if (diffusionState.currentFrame >= options.frames.value.length - 1) {
        if (diffusionState.loop) diffusionState.currentFrame = 0
        else {
          diffusionState.currentFrame = options.frames.value.length - 1
          diffusionState.playing = false
          break
        }
      } else {
        diffusionState.currentFrame += 1
      }
    }
  }

  const diffusionRunState: SmartMapDiffusionRunState = {
    isRunning: () => diffusionState.running,
  }

  return {
    currentDiffusionFrame,
    diffusionState,
    diffusionRunState,
    getCurrentDiffusionFrame,
    getCurrentDiffusionFrameIndex,
    resetDiffusionPlayback,
    seekDiffusionFrame,
    setDiffusionRunning,
    startDiffusionPlaybackFromFirstFrame,
    stepDiffusionFrame,
    toggleDiffusionPlayback,
    updateDiffusionPlayback,
  }
}
