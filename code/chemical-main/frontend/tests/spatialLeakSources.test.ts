import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const registry = JSON.parse(
  readFileSync(
    new URL('../src/config/spatial-assets.4490.json', import.meta.url),
    'utf8',
  ),
)
const LEAK_SOURCE_ANCHORS_4490 = registry.leakSources as Array<{
  modelSmId: number
  modelName: string
  modelDataset: string
  positionStatus: string
  modelLocalEnuMeters: { east: number; north: number }
  heightMeters: number
}>

function leakSourceToAlgorithmPoint(
  source: (typeof LEAK_SOURCE_ANCHORS_4490)[number],
) {
  return {
    x: source.modelLocalEnuMeters.east + 80,
    y: -source.modelLocalEnuMeters.north + 420,
  }
}

const expectedSources = new Map([
  [3, '输气管道'],
  [17, '立式缓冲罐011'],
  [34, '立式架空常压储罐009'],
  [42, '立式固定顶储罐'],
  [79, '立式压力容器001'],
  [3156, '3号输气管道'],
])

test('registers the six latest 4490 ModelName leak sources', () => {
  assert.equal(LEAK_SOURCE_ANCHORS_4490.length, expectedSources.size)
  LEAK_SOURCE_ANCHORS_4490.forEach((source) => {
    assert.equal(source.modelName, expectedSources.get(source.modelSmId))
    assert.equal(
      source.modelDataset,
      'modelComposeResult@huagong-finally-fbx-4490',
    )
    assert.equal(source.positionStatus, 'MODEL_SURFACE_BOUND')
  })
})

test('applies the requested vertical offsets to the two three-dimensional leak markers', () => {
  const heightsByName = new Map(
    LEAK_SOURCE_ANCHORS_4490.map((source) => [
      source.modelName,
      source.heightMeters,
    ]),
  )
  assert.equal(heightsByName.get('立式压力容器001'), 3.5)
  assert.equal(heightsByName.get('立式架空常压储罐009'), 6)
})

test('keeps every leak source inside the registered two-dimensional model frame', () => {
  LEAK_SOURCE_ANCHORS_4490.forEach((source) => {
    const point = leakSourceToAlgorithmPoint(source)
    assert.ok(
      point.x >= 0 && point.x <= 1000,
      `${source.modelName} x=${point.x}`,
    )
    assert.ok(
      point.y >= 0 && point.y <= 540,
      `${source.modelName} y=${point.y}`,
    )
  })
})
