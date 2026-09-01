export type SmartMapPointLike = { x?: unknown; y?: unknown } | null | undefined

interface SmartMapLightweightGas {
  densityRatio?: unknown
  diffusionBias?: unknown
}

interface SmartMapLightweightConcentrationOptions {
  sensor: SmartMapPointLike
  leakPoint: SmartMapPointLike
  windSpeed: number
  windDir: number
  sourceRate: number
  gas: SmartMapLightweightGas
}

export function normalizeSmartMapPoint(point: SmartMapPointLike) {
  if (!point) return null
  const x = Number(point.x)
  const y = Number(point.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  }
}

/**
 * Frontend lightweight physical response for simulated/manual observations.
 * Formal diffusion fields, thresholds, and source inversion observations must
 * still prefer backend algorithm output or explicit sensor_reading records.
 */
export function computeSmartMapLightweightGasConcentration(
  options: SmartMapLightweightConcentrationOptions,
) {
  const sensorPoint = normalizeSmartMapPoint(options.sensor)
  const leakMapPoint = normalizeSmartMapPoint(options.leakPoint)
  if (!leakMapPoint || !sensorPoint) return 0
  const dx = sensorPoint.x - leakMapPoint.x
  const dy = sensorPoint.y - leakMapPoint.y
  const dist = Math.hypot(dx, dy)
  if (dist < 1) return Math.min(500, (options.sourceRate || 50) * 10)

  const windAngleRad = (options.windDir || 135) * Math.PI / 180
  const along = dx * Math.cos(windAngleRad) + dy * Math.sin(windAngleRad)
  const cross = -dx * Math.sin(windAngleRad) + dy * Math.cos(windAngleRad)
  const downwindFactor = along > 0 ? 1.0 : 0.1
  const windSpeed = Math.max(0.5, options.windSpeed || 2)
  const distMeters = dist * 0.5
  const density = Number(options.gas.densityRatio || 1)
  const diffusionBias = Number(options.gas.diffusionBias || 1)
  const buoyancy = Math.max(0, 2 * (1 - density))
  const sigmaY = (0.08 + buoyancy * 0.015) * distMeters * diffusionBias / Math.sqrt(windSpeed)
  const sigmaZ = (0.06 + Math.max(0, density - 1) * 0.012) * distMeters / Math.sqrt(windSpeed)
  const sourceRate = (options.sourceRate || 50) * 1000
  const normFactor = Math.PI * windSpeed * sigmaY * sigmaZ
  const lateralShape = Math.exp(-(cross * cross) / (2 * sigmaY * sigmaY))
  const retention = Math.exp(-Math.max(0, 1 - density) * distMeters / 260)
  const concentration = (
    sourceRate / Math.max(normFactor, 0.01)
  ) * downwindFactor * lateralShape * retention
  const ppm = Math.min(1000, Math.max(0, concentration * 0.5))
  return Math.round(ppm * 100) / 100
}
