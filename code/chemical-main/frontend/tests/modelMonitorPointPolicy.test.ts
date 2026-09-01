import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterModelBoundMonitorPointsIn,
  filterMonitorPointsInsideBounds,
  isModelBoundMonitorPointIn,
  selectMonitorPointsByGrid,
} from '../src/data/modelMonitorPointPolicyCore.ts'

const modelMonitorPointIds = new Set(['EQ-001L'])

test('accepts generated model monitor point ids for persisted layouts', () => {
  assert.equal(
    isModelBoundMonitorPointIn({ id: 'EQ-001L' }, modelMonitorPointIds),
    true,
  )
})

test('selects one real model-bound point nearest each monitoring grid center', () => {
  const points = [
    { id: 'near-center', x: 48, y: 52 },
    { id: 'cell-edge', x: 2, y: 3 },
    { id: 'next-cell', x: 120, y: 50 },
  ]

  assert.deepEqual(selectMonitorPointsByGrid(points, 100), [
    points[0],
    points[2],
  ])
})

test('rejects invalid monitoring grid sizes', () => {
  assert.throws(() => selectMonitorPointsByGrid([], 0), /greater than zero/)
})

test('keeps operational monitor points inside the visible model footprint', () => {
  const points = [
    { id: 'inside', x: 120, y: 80 },
    { id: 'left-outside', x: 20, y: 80 },
    { id: 'bottom-outside', x: 120, y: 470 },
  ]

  assert.deepEqual(
    filterMonitorPointsInsideBounds(points, {
      minX: 25,
      maxX: 975,
      minY: 40,
      maxY: 460,
    }),
    [points[0]],
  )
})

test('accepts explicit model-bound points and rejects manual or mobile points', () => {
  assert.equal(
    isModelBoundMonitorPointIn(
      { id: 'persisted', sourceType: 'model-bound' },
      modelMonitorPointIds,
    ),
    true,
  )
  assert.equal(
    isModelBoundMonitorPointIn(
      { id: 'manual-1', sourceType: 'manual' },
      modelMonitorPointIds,
    ),
    false,
  )
  assert.equal(
    isModelBoundMonitorPointIn(
      { id: 'mobile-1', sourceType: 'mobile' },
      modelMonitorPointIds,
    ),
    false,
  )
})

test('filters tracing observations to model-bound monitor points only', () => {
  const sensors = [
    { id: 'EQ-001L' },
    { id: 'manual-1', sourceType: 'manual' },
    { id: 'bound-extra', sourceType: 'model-bound' },
  ]
  assert.deepEqual(
    filterModelBoundMonitorPointsIn(sensors, modelMonitorPointIds),
    [sensors[0], sensors[2]],
  )
})
