import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_DIFFUSION_FRAME_DURATION_MS,
  resolveDiffusionSimulationSecondsPerRealSecond,
} from '../src/utils/diffusionPlaybackTiming.ts'

test('uses a readable one-second presentation cadence by default', () => {
  assert.equal(DEFAULT_DIFFUSION_FRAME_DURATION_MS, 1000)
})

test('advances 3D particles on the same physical clock as the 2D frame sequence', () => {
  const timeScale = resolveDiffusionSimulationSecondsPerRealSecond({
    frameStepSec: 5,
    frameDurationMs: 520,
    playbackSpeed: 1,
  })
  assert.ok(Math.abs(timeScale - 5 / 0.52) < 1e-9)
})

test('applies the selected playback speed once and rejects invalid timing', () => {
  assert.equal(
    resolveDiffusionSimulationSecondsPerRealSecond({
      frameStepSec: 5,
      frameDurationMs: 1000,
      playbackSpeed: 2,
    }),
    10,
  )
  assert.equal(
    resolveDiffusionSimulationSecondsPerRealSecond({
      frameStepSec: 0,
      frameDurationMs: 1000,
      playbackSpeed: 1,
    }),
    1,
  )
})
