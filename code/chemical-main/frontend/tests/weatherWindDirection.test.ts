import test from 'node:test'
import assert from 'node:assert/strict'
import { meteorologicalWindFromToTransportDegrees } from '../src/utils/weatherWindDirection.ts'

test('converts meteorological wind-from direction into plume transport direction', () => {
  assert.equal(meteorologicalWindFromToTransportDegrees(0), 180)
  assert.equal(meteorologicalWindFromToTransportDegrees(180), 0)
  assert.equal(meteorologicalWindFromToTransportDegrees(225), 45)
  assert.equal(meteorologicalWindFromToTransportDegrees(-90), 90)
})
