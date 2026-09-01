import assert from 'node:assert/strict'
import test from 'node:test'
import { mapLocalPlaneToThreeTilesAxes } from '../src/utils/threeTilesAxisMapping.ts'

test('maps LOCALMAP northing to the published 3D Tiles south axis', () => {
  assert.deepEqual(mapLocalPlaneToThreeTilesAxes({ x: -965, y: 158 }), {
    x: -965,
    y: 0,
    z: -158,
  })
})

test('preserves east-west and reverses south-axis sign', () => {
  assert.deepEqual(mapLocalPlaneToThreeTilesAxes({ x: 133, y: -390 }), {
    x: 133,
    y: 0,
    z: 390,
  })
})
