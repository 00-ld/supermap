import assert from 'node:assert/strict'
import test from 'node:test'
import {
  computeLocalS3MCameraSnapshot,
  computeLocalS3MMinimumFocusDistance,
  computeLocalS3MTarget,
  createLocalS3MCameraView,
  resolveCameraZoomPolicy,
  resolveLocalSceneWheelZoomAmount,
  resolveS3MLayerLodSettings,
  shouldEnableSdkCameraZoom,
  resolveSceneProjection,
} from '../src/components/localSceneCamera.ts'

test('keeps local-meter S3M scenes in the flat Columbus projection', () => {
  assert.deepEqual(resolveSceneProjection('local-s3m', false), {
    isGeographic: false,
    mode: 'columbus',
  })
  assert.deepEqual(resolveSceneProjection('park', false), {
    isGeographic: true,
    mode: '3d',
  })
  assert.deepEqual(resolveSceneProjection('local-s3m', true), {
    isGeographic: true,
    mode: '3d',
  })
})

test('disables globe conversion when applying a local-meter camera', () => {
  const vectorFactory = (x: number, y: number, z: number) => ({ x, y, z })
  const view = createLocalS3MCameraView(
    {
      position: { x: -420, y: -180, z: 160 },
      direction: { x: 0.6, y: 0.6, z: -0.4 },
      up: { x: 0.2, y: 0.2, z: 0.9 },
    },
    vectorFactory,
  )

  assert.equal(view.convert, false)
  assert.deepEqual(view.destination, { x: -420, y: -180, z: 160 })
})

test('derives the local model center used by the geographic placement', () => {
  const target = computeLocalS3MTarget({
    geoBounds: {
      left: -305.860501231482,
      right: -174.99067206302325,
      bottom: -48.6409556515574,
      top: 44.4084095275819,
    },
    heightRange: {
      min: -2.5983145065819175,
      max: 89.39735650061778,
    },
  })

  assert.ok(Math.abs(target.x + 240.4255866472526) < 1e-9)
  assert.ok(Math.abs(target.y + 2.11627306198775) < 1e-9)
  assert.ok(Math.abs(target.z - 43.39952099701793) < 1e-9)
})

test('frames the processing-plant SCP from its local-meter bounds', () => {
  const snapshot = computeLocalS3MCameraSnapshot({
    geoBounds: {
      left: -305.860501231482,
      right: -174.99067206302325,
      bottom: -48.6409556515574,
      top: 44.4084095275819,
    },
    heightRange: {
      min: -2.5983145065819175,
      max: 89.39735650061778,
    },
  })

  assert.ok(snapshot.position.x < -400 && snapshot.position.x > -430)
  assert.ok(snapshot.position.y < -170 && snapshot.position.y > -190)
  assert.ok(snapshot.position.z > 150 && snapshot.position.z < 170)
  assert.ok(snapshot.direction.z < 0)
  assert.ok(snapshot.up && snapshot.up.z > 0)
})

test('keeps tiny equipment models close enough to remain visible', () => {
  const snapshot = computeLocalS3MCameraSnapshot({
    geoBounds: { left: 1.94, right: 5.46, bottom: -0.21, top: 0.8 },
    heightRange: { min: 0, max: 0.27 },
  })
  const cameraDistance = Math.hypot(
    snapshot.position.x - 3.7,
    snapshot.position.y - 0.295,
    snapshot.position.z - 0.135,
  )

  assert.ok(cameraDistance > 5 && cameraDistance < 10)
})

test('reduces local-scene wheel steps near the focused model', () => {
  const farStep = resolveLocalSceneWheelZoomAmount(100, 70)
  const nearStep = resolveLocalSceneWheelZoomAmount(100, 2)
  const finalStep = resolveLocalSceneWheelZoomAmount(100, 0.12)

  assert.ok(farStep > 5 && farStep < 15)
  assert.ok(nearStep > 0.1 && nearStep < 1)
  assert.ok(finalStep > 0 && finalStep <= 0.04)
})

test('never moves through the local-scene focus target', () => {
  assert.equal(resolveLocalSceneWheelZoomAmount(1000, 0.08), 0)
})

test('stops close-range zoom near the model surface instead of its center', () => {
  const minimumDistance = computeLocalS3MMinimumFocusDistance({
    geoBounds: { left: 1.94, right: 5.46, bottom: -0.21, top: 0.8 },
    heightRange: { min: 0, max: 0.27 },
  })

  assert.ok(minimumDistance > 1.5 && minimumDistance < 1.7)
  assert.equal(
    resolveLocalSceneWheelZoomAmount(1000, minimumDistance, minimumDistance),
    0,
  )
})

test('keeps root tiles resident only for close-range local S3M scenes', () => {
  assert.deepEqual(resolveS3MLayerLodSettings('local-s3m'), {
    lodRangeScale: 1.25,
    residentRootTile: true,
  })
  assert.deepEqual(resolveS3MLayerLodSettings('park'), {
    lodRangeScale: 1.25,
    residentRootTile: false,
  })
})

test('keeps SDK wheel zoom enabled in local S3M scenes', () => {
  const wheelEventType = Symbol('wheel')

  assert.equal(shouldEnableSdkCameraZoom('local-s3m'), true)
  assert.equal(shouldEnableSdkCameraZoom('park'), true)
  assert.deepEqual(resolveCameraZoomPolicy('local-s3m', wheelEventType), {
    enableZoom: true,
    zoomEventTypes: [wheelEventType],
  })
  assert.deepEqual(resolveCameraZoomPolicy('park', wheelEventType), {
    enableZoom: true,
    zoomEventTypes: undefined,
  })
  assert.deepEqual(resolveCameraZoomPolicy('local-s3m', undefined), {
    enableZoom: false,
    zoomEventTypes: undefined,
  })
})
