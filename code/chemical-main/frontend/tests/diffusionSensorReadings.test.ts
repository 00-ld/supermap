import test from 'node:test'
import assert from 'node:assert/strict'
import { attachSensorSampleSeries } from '../src/data/diffusionSensorSampling.ts'

test('uses the algorithm 3-D sensor reading at installation height', () => {
  const [sensor] = attachSensorSampleSeries(
    [{ id: 'S-01', x: 10, y: 20, installationHeight: 8 }],
    [
      {
        frameIndex: 2,
        timeSec: 10,
        cells: [{ x: 10, y: 20, size: 5, concentration: 999 }],
        sensorReadings: [
          {
            sensorId: 'S-01',
            concentration: 12.3456,
            heightMeters: 8,
          },
        ],
      },
    ],
  )

  assert.equal(sensor.sampledSeries[0]?.concentration, 12.3456)
  assert.equal(sensor.sampledSeries[0]?.heightMeters, 8)
  assert.equal(sensor.sampledSeries[0]?.sampleSource, 'algorithm-3d-volume')
})

test('falls back to planar sampling when a frame has no matching sensor reading', () => {
  const [sensor] = attachSensorSampleSeries(
    [{ id: 'S-02', x: 10, y: 20, installationHeight: 1.5 }],
    [
      {
        frameIndex: 0,
        timeSec: 0,
        cells: [{ x: 10, y: 20, size: 5, concentration: 7 }],
        sensorReadings: [{ sensorId: 'another-sensor', concentration: 80 }],
      },
    ],
  )

  assert.equal(sensor.sampledSeries[0]?.concentration, 7)
  assert.equal(sensor.sampledSeries[0]?.sampleSource, 'planar-fallback')
})
