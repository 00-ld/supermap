export interface DiffusionPlaybackTiming {
  frameStepSec: number
  frameDurationMs: number
  playbackSpeed: number
}

export const DEFAULT_DIFFUSION_FRAME_DURATION_MS = 1000

export function resolveDiffusionSimulationSecondsPerRealSecond(
  timing: DiffusionPlaybackTiming,
): number {
  const frameStepSec = Number(timing.frameStepSec)
  const frameDurationMs = Number(timing.frameDurationMs)
  const playbackSpeed = Number(timing.playbackSpeed)
  if (
    !Number.isFinite(frameStepSec) ||
    frameStepSec <= 0 ||
    !Number.isFinite(frameDurationMs) ||
    frameDurationMs <= 0 ||
    !Number.isFinite(playbackSpeed) ||
    playbackSpeed <= 0
  ) {
    return 1
  }
  return (frameStepSec * 1000 * playbackSpeed) / frameDurationMs
}
