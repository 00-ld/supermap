import type { LocalCameraSnapshot } from './sceneTypes'

type LocalSceneConfig = {
  geoBounds?: {
    left?: unknown
    right?: unknown
    bottom?: unknown
    top?: unknown
  }
  heightRange?: {
    min?: unknown
    max?: unknown
  }
}

export type ScenePresentationMode = 'park' | 'local-s3m'

const LOCAL_SCENE_MIN_FOCUS_DISTANCE_METERS = 0.08

export function resolveSceneProjection(
  presentationMode: ScenePresentationMode,
  shouldUseThreeDTiles: boolean,
) {
  const isGeographic = presentationMode === 'park' || shouldUseThreeDTiles
  return {
    isGeographic,
    mode: isGeographic ? ('3d' as const) : ('columbus' as const),
  }
}

export function resolveS3MLayerLodSettings(
  presentationMode: ScenePresentationMode,
) {
  return {
    lodRangeScale: 1.25,
    residentRootTile: presentationMode === 'local-s3m',
  }
}

export function shouldEnableSdkCameraZoom(
  presentationMode: ScenePresentationMode,
) {
  return presentationMode === 'park' || presentationMode === 'local-s3m'
}

export function resolveCameraZoomPolicy<TEventType>(
  presentationMode: ScenePresentationMode,
  wheelEventType: TEventType | undefined,
) {
  const hasSdkWheelEvent = wheelEventType !== undefined
  return {
    enableZoom: presentationMode === 'park' || hasSdkWheelEvent,
    zoomEventTypes:
      presentationMode === 'local-s3m' && hasSdkWheelEvent
        ? [wheelEventType]
        : undefined,
  }
}

export function createLocalS3MCameraView<TVector>(
  snapshot: LocalCameraSnapshot,
  createVector: (x: number, y: number, z: number) => TVector,
) {
  const destination = createVector(
    snapshot.position.x,
    snapshot.position.y,
    snapshot.position.z,
  )
  const orientation =
    snapshot.direction && snapshot.up
      ? {
          direction: createVector(
            snapshot.direction.x,
            snapshot.direction.y,
            snapshot.direction.z,
          ),
          up: createVector(snapshot.up.x, snapshot.up.y, snapshot.up.z),
        }
      : undefined
  return {
    destination,
    orientation,
    // Cesium/SuperMap3D otherwise interprets these local metres as ECEF and
    // projects them again while in COLUMBUS_VIEW, sending the camera millions
    // of metres away from the model.
    convert: false as const,
  }
}

function finiteOr(value: unknown, fallback: number): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function normalize(x: number, y: number, z: number) {
  const magnitude = Math.hypot(x, y, z)
  if (!Number.isFinite(magnitude) || magnitude <= 0) return null
  return { x: x / magnitude, y: y / magnitude, z: z / magnitude }
}

export function computeLocalS3MTarget(config: LocalSceneConfig) {
  const bounds = config.geoBounds ?? {}
  const heightRange = config.heightRange ?? {}
  const left = finiteOr(bounds.left, -100)
  const right = finiteOr(bounds.right, 100)
  const bottom = finiteOr(bounds.bottom, -100)
  const top = finiteOr(bounds.top, 100)
  const minHeight = finiteOr(heightRange.min, 0)
  const maxHeight = finiteOr(heightRange.max, 40)
  return {
    x: (left + right) / 2,
    y: (bottom + top) / 2,
    z: (minHeight + maxHeight) / 2,
  }
}

function computeLocalS3MSpan(config: LocalSceneConfig) {
  const bounds = config.geoBounds ?? {}
  const heightRange = config.heightRange ?? {}
  return Math.max(
    finiteOr(bounds.right, 100) - finiteOr(bounds.left, -100),
    finiteOr(bounds.top, 100) - finiteOr(bounds.bottom, -100),
    finiteOr(heightRange.max, 40) - finiteOr(heightRange.min, 0),
    0.5,
  )
}

export function computeLocalS3MMinimumFocusDistance(config: LocalSceneConfig) {
  return Math.max(
    LOCAL_SCENE_MIN_FOCUS_DISTANCE_METERS,
    computeLocalS3MSpan(config) * 0.45,
  )
}

export function computeLocalS3MCameraSnapshot(
  config: LocalSceneConfig,
): LocalCameraSnapshot {
  const center = computeLocalS3MTarget(config)
  const span = computeLocalS3MSpan(config)
  const position = {
    x: center.x - span * 1.35,
    y: center.y - span * 1.35,
    z: center.z + span * 0.9,
  }
  const direction = normalize(
    center.x - position.x,
    center.y - position.y,
    center.z - position.z,
  )
  if (!direction) throw new Error('S3M 本地相机方向无效')
  const rightVector = normalize(direction.y, -direction.x, 0)
  if (!rightVector) throw new Error('S3M 本地相机右向量无效')
  const up = normalize(
    rightVector.y * direction.z,
    -rightVector.x * direction.z,
    rightVector.x * direction.y - rightVector.y * direction.x,
  )
  if (!up) throw new Error('S3M 本地相机上向量无效')

  return { position, direction, up }
}

export function resolveLocalSceneWheelZoomAmount(
  deltaY: number,
  distanceToTargetMeters: number,
  minimumDistanceMeters = LOCAL_SCENE_MIN_FOCUS_DISTANCE_METERS,
) {
  const availableDistanceMeters = Math.max(
    0,
    distanceToTargetMeters - minimumDistanceMeters,
  )
  if (availableDistanceMeters === 0) return 0

  const distanceScaledStepMeters =
    Math.abs(deltaY) * 0.0015 * Math.max(distanceToTargetMeters, 1)
  const maximumStepMeters = Math.max(0.02, distanceToTargetMeters * 0.18)
  const desiredStepMeters = Math.min(
    Math.max(distanceScaledStepMeters, 0.02),
    maximumStepMeters,
  )
  return Math.min(desiredStepMeters, availableDistanceMeters)
}
