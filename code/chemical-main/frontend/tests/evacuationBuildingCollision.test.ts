import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatParkEntranceLabel,
  measureRouteBuildingCollisionMeters,
  nearestFacilityBoundaryPointToRoads,
} from '../src/views/screen/map-workspace/evacuationRouteSafety.ts'

const facilities = [{ id: 'factory-1', x: 40, y: 40, w: 40, h: 40 }]

test('detects a road path that crosses a factory footprint', () => {
  const collisionMeters = measureRouteBuildingCollisionMeters(
    [
      { x: 20, y: 60 },
      { x: 100, y: 60 },
    ],
    facilities,
  )
  assert.ok(collisionMeters > 30)
})

test('keeps a road path outside factory footprints collision-free', () => {
  const collisionMeters = measureRouteBuildingCollisionMeters(
    [
      { x: 20, y: 20 },
      { x: 100, y: 20 },
    ],
    facilities,
  )
  assert.equal(collisionMeters, 0)
})

test('uses the published polygon instead of its broad bounding box', () => {
  const collisionMeters = measureRouteBuildingCollisionMeters(
    [
      { x: 50, y: 75 },
      { x: 100, y: 75 },
    ],
    [
      {
        x: 40,
        y: 40,
        w: 40,
        h: 40,
        footprint: [
          { x: 40, y: 40 },
          { x: 80, y: 40 },
          { x: 40, y: 80 },
        ],
      },
    ],
  )

  assert.equal(collisionMeters, 0)
})

test('places a building entrance on the boundary nearest to a real road', () => {
  const entrance = nearestFacilityBoundaryPointToRoads(
    [
      { x: 40, y: 40 },
      { x: 80, y: 40 },
      { x: 80, y: 80 },
      { x: 40, y: 80 },
    ],
    [
      [
        { x: 20, y: 90 },
        { x: 100, y: 90 },
      ],
    ],
  )

  assert.equal(entrance?.y, 80)
  assert.ok(Number(entrance?.x) >= 40 && Number(entrance?.x) <= 80)
})

test('uses a stable localized label instead of mojibake from published metadata', () => {
  assert.equal(formatParkEntranceLabel('top'), '北侧道路入口')
  assert.equal(formatParkEntranceLabel('left'), '西侧道路入口')
})
