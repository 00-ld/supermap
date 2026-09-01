import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isUsableSuperMapRuntime,
  resolveSuperMapRuntimeScriptCandidates,
} from '../src/components/superMapRuntimeLoader.ts'

test('accepts an already injected SuperMap runtime with Viewer', () => {
  const runtime = { Viewer: class Viewer {} }

  assert.equal(isUsableSuperMapRuntime(runtime), true)
})

test('uses real SuperMap3D entry points without inventing a Cesium.js fallback', () => {
  const candidates = resolveSuperMapRuntimeScriptCandidates(
    '/supermap3d/SuperMap3D.js',
    '/supermap3d',
  )

  assert.deepEqual(candidates, [
    '/supermap3d/SuperMap3D.js',
    '/iserver/representations/realspace/iClient3DForWebGL/SuperMap3D.js',
  ])
  assert.equal(
    candidates.some((candidate) => candidate.endsWith('/Cesium.js')),
    false,
  )
})
