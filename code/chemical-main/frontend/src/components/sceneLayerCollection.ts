function isIterable(value: object): value is Iterable<unknown> {
  return typeof Reflect.get(value, Symbol.iterator) === 'function'
}

export function getSceneLayerCollectionValues(container: unknown): unknown[] {
  if (!container || typeof container !== 'object') return []
  if (Array.isArray(container)) return container
  if (container instanceof Map) return Array.from(container.values())
  if (isIterable(container)) return Array.from(container)
  return Object.values(container)
}

export function createStagedSceneLayerName(
  sceneId: string,
  transactionId: number,
): string {
  return `${sceneId}__stage_${transactionId}`
}

export type PromiseSettlementMonitor<T> = {
  promise: Promise<T>
  status: 'pending' | 'resolved' | 'rejected'
  error: unknown
}

export function monitorPromiseSettlement<T>(
  promise: PromiseLike<T>,
): PromiseSettlementMonitor<T> {
  const monitor: PromiseSettlementMonitor<T> = {
    promise: Promise.resolve(undefined as T),
    status: 'pending',
    error: null,
  }
  monitor.promise = Promise.resolve(promise).then(
    (value) => {
      monitor.status = 'resolved'
      return value
    },
    (error: unknown) => {
      monitor.status = 'rejected'
      monitor.error = error
      throw error
    },
  )
  void monitor.promise.catch(() => undefined)
  return monitor
}

export function throwIfPromiseRejected(
  ...monitors: Array<PromiseSettlementMonitor<unknown> | null>
): void {
  const rejectedMonitor = monitors.find(
    (monitor) => monitor?.status === 'rejected',
  )
  if (rejectedMonitor) throw rejectedMonitor.error
}

export function getSceneLayerKey(layer: unknown): string | number | null {
  if (!layer || typeof layer !== 'object') return null
  for (const property of ['name', '_name', 'caption', 'id'] as const) {
    const value = Reflect.get(layer, property)
    if (typeof value === 'string' || typeof value === 'number') return value
  }
  return null
}

export function getSceneLayerInitializationState(
  layer: unknown,
): 'ready' | 'pending' | 'unknown' {
  if (!layer || typeof layer !== 'object') return 'unknown'
  const initializationFlags = ['_initialized', 'scpLoaded']
    .map((property) => Reflect.get(layer, property))
    .filter((value): value is boolean => typeof value === 'boolean')
  if (!initializationFlags.length) return 'unknown'
  return initializationFlags.some(Boolean) ? 'ready' : 'pending'
}

export function findAddedSceneLayer(
  currentLayers: unknown[],
  previousLayers: unknown[],
  expectedName: string,
): unknown | null {
  const previousLayerSet = new Set(previousLayers)
  const addedLayers = currentLayers.filter(
    (layer) => Boolean(layer) && !previousLayerSet.has(layer),
  )
  const namedLayer = addedLayers.find(
    (layer) => String(getSceneLayerKey(layer) ?? '') === expectedName,
  )
  if (namedLayer) return namedLayer
  return addedLayers.length === 1 ? addedLayers[0] : null
}
