import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const registry = JSON.parse(
  readFileSync(
    new URL('../src/config/spatial-assets.4490.json', import.meta.url),
    'utf8',
  ),
) as {
  scenes: Array<{
    id: string
    name: string
    configUrl: string
    published: boolean
  }>
  entrances: Array<{
    entranceId: string
    name: string
    facilityId: string
    positionStatus: string
  }>
}

test('registers the six independent chemical scenes through local iServer', () => {
  const localScenes = registry.scenes.filter(
    (scene) => scene.id !== 'park-main',
  )
  assert.equal(localScenes.length, 6)
  assert.deepEqual(
    new Set(localScenes.map((scene) => scene.name)),
    new Set([
      '加工厂房',
      '生产厂房',
      '原材料仓库',
      '换热器',
      '立式罐',
      '蒸馏塔',
    ]),
  )
  localScenes.forEach((scene) => {
    assert.ok(scene.configUrl.startsWith('/iserver/'))
    assert.equal(scene.published, true)
  })
  assert.equal(
    registry.scenes.some((scene) => scene.configUrl.includes('remote-iserver')),
    false,
  )
})

test('offers only model-bound factory entrances as selectable escape points', () => {
  assert.ok(registry.entrances.length >= 4)
  assert.equal(
    new Set(registry.entrances.map((entrance) => entrance.entranceId)).size,
    registry.entrances.length,
  )
  registry.entrances.forEach((entrance) => {
    assert.ok(entrance.name.endsWith('门'))
    assert.ok(entrance.facilityId)
    assert.equal(entrance.positionStatus, 'MODEL_SURFACE_BOUND')
  })
})
