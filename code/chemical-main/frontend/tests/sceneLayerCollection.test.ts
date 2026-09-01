import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createStagedSceneLayerName,
  findAddedSceneLayer,
  getSceneLayerKey,
  getSceneLayerCollectionValues,
  getSceneLayerInitializationState,
  monitorPromiseSettlement,
  throwIfPromiseRejected,
} from '../src/components/sceneLayerCollection.ts'

test('reads scene layers from SDK arrays', () => {
  const firstLayer = { name: 'first' }
  const secondLayer = { name: 'second' }
  assert.deepEqual(getSceneLayerCollectionValues([firstLayer, secondLayer]), [
    firstLayer,
    secondLayer,
  ])
})

test('reads scene layers from SDK keyed objects', () => {
  const firstLayer = { name: 'first' }
  const secondLayer = { name: 'second' }
  assert.deepEqual(
    getSceneLayerCollectionValues({ first: firstLayer, second: secondLayer }),
    [firstLayer, secondLayer],
  )
})

test('reads scene layers from iterable containers and ignores empty values', () => {
  const layer = { name: 'iterable' }
  assert.deepEqual(getSceneLayerCollectionValues(new Set([layer])), [layer])
  assert.deepEqual(
    getSceneLayerCollectionValues(new Map([['iterable', layer]])),
    [layer],
  )
  assert.deepEqual(getSceneLayerCollectionValues(null), [])
  assert.deepEqual(getSceneLayerCollectionValues('not-a-layer-container'), [])
})

test('uses a unique collection key for every staged scene transaction', () => {
  assert.equal(
    createStagedSceneLayerName('processing-plant', 41),
    'processing-plant__stage_41',
  )
  assert.notEqual(
    createStagedSceneLayerName('processing-plant', 41),
    createStagedSceneLayerName('processing-plant', 42),
  )
})

test('tracks a delayed SDK thenable rejection after collection adoption', async () => {
  let rejectPromise = (_error: Error) => {}
  const delayedPromise = new Promise<unknown>((_resolve, reject) => {
    rejectPromise = reject
  })
  const monitor = monitorPromiseSettlement(delayedPromise)
  assert.equal(monitor.status, 'pending')

  const delayedError = new Error('late SDK rejection')
  rejectPromise(delayedError)
  await assert.rejects(monitor.promise, delayedError)
  assert.equal(monitor.status, 'rejected')
  assert.equal(monitor.error, delayedError)
  assert.throws(() => throwIfPromiseRejected(monitor), delayedError)
})

test('finds an SDK layer added while a thenable is still pending', () => {
  const previousLayer = { name: 'park-main' }
  const addedLayer = { name: 'result_ImportFBX' }
  assert.equal(
    findAddedSceneLayer(
      [previousLayer, addedLayer],
      [previousLayer],
      'result_ImportFBX',
    ),
    addedLayer,
  )
})

test('does not guess when several unnamed SDK layers are added', () => {
  assert.equal(findAddedSceneLayer([{}, {}], [], 'expected-layer'), null)
})

test('returns an SDK collection key instead of the layer object', () => {
  assert.equal(
    getSceneLayerKey({ name: 'processing-plant' }),
    'processing-plant',
  )
  assert.equal(getSceneLayerKey({ _name: 'private-name' }), 'private-name')
  assert.equal(getSceneLayerKey({ id: 7 }), 7)
  assert.equal(getSceneLayerKey({}), null)
})

test('does not treat an SDK placeholder layer as initialized', () => {
  assert.equal(
    getSceneLayerInitializationState({ _initialized: false, scpLoaded: false }),
    'pending',
  )
  assert.equal(
    getSceneLayerInitializationState({ _initialized: true, scpLoaded: false }),
    'ready',
  )
  assert.equal(getSceneLayerInitializationState({ name: 'legacy' }), 'unknown')
})
