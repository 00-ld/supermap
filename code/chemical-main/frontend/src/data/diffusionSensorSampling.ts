export interface DiffusionCell {
  x: number
  y: number
  size: number
  concentration: number
}

export interface DiffusionSensorReading {
  sensorId: string | number
  frameIndex?: number
  timeSec?: number
  heightMeters?: number
  concentration: number
}

export interface DiffusionFrame {
  frameIndex: number
  timeSec: number
  cells: DiffusionCell[]
  sensorReadings?: DiffusionSensorReading[]
}

export interface DiffusionSensor {
  x: number
  y: number
  [key: string]: unknown
}

export function getFrameConcentrationAtPoint(
  frame: DiffusionFrame,
  x: number,
  y: number,
): number {
  if (!frame?.cells?.length) return 0
  let nearest: DiffusionCell | null = null
  let minDistance = Infinity
  for (const cell of frame.cells) {
    const distance = Math.hypot(cell.x - x, cell.y - y)
    if (distance < minDistance) {
      minDistance = distance
      nearest = cell
    }
  }
  if (!nearest) return 0
  const fade = Math.max(0, 1 - minDistance / Math.max(nearest.size * 1.8, 1))
  return Number((nearest.concentration * fade).toFixed(2))
}

/** 优先读取算法三维体场在传感器安装高度的采样，缺失时才回退二维网格插值。 */
export function attachSensorSampleSeries(
  sensors: DiffusionSensor[],
  frames: DiffusionFrame[],
) {
  return sensors.map((sensor) => {
    const sensorId = String(sensor.id ?? '')
    const sampledSeries = frames.map((frame) => {
      const volumeReading = frame.sensorReadings?.find(
        (reading) => String(reading.sensorId) === sensorId,
      )
      const sampledConcentration = Number(volumeReading?.concentration)
      return {
        frameIndex: frame.frameIndex,
        timeSec: frame.timeSec,
        concentration: Number.isFinite(sampledConcentration)
          ? sampledConcentration
          : getFrameConcentrationAtPoint(frame, sensor.x, sensor.y),
        heightMeters: Number.isFinite(Number(volumeReading?.heightMeters))
          ? Number(volumeReading?.heightMeters)
          : Number(sensor.installationHeight ?? 1.5),
        sampleSource: volumeReading ? 'algorithm-3d-volume' : 'planar-fallback',
      }
    })
    const peakConcentration = sampledSeries.reduce(
      (max, item) => Math.max(max, item.concentration),
      0,
    )
    return {
      ...sensor,
      sampledSeries,
      sampledPeak: Number(peakConcentration.toFixed(2)),
      sampledFrames: sampledSeries.length,
    }
  })
}
