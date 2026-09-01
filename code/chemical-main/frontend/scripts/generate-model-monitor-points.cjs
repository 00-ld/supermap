#!/usr/bin/env node
/**
 * 生成 B 套模型绑定点位（算法传感器）静态数据。
 *
 * 输入：public/data/DevicePoint_2D.geojson（iServer MonitorPoints_4490 导出，
 *       Wgs84 经纬高 + ModelName 模型绑定，1072 条）。
 * 输出：src/data/modelMonitorPoints.generated.ts（583 个唯一位置气体点位，
 *       高低位同坐标配对去重后保留低位 fixed-gas-low，坐标已转算法系）。
 *
 * 算法坐标系（与 src/data/supermapGeoreference.js ALGORITHM_FRAME 严格一致）：
 *   east  = (lon - A锚点lon) * 111320 * cos(A锚点lat)
 *   north = (lat - A锚点lat) * 111320
 *   x = east + 80,  y = -north + 420
 * 修改 ALGORITHM_FRAME 时必须同步修改本脚本与 payload 的 map 参数。
 */
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const INPUT = path.join(ROOT, 'public/data/DevicePoint_2D.geojson')
const OUTPUT = path.join(ROOT, 'src/data/modelMonitorPoints.generated.ts')

const ALON = 113.535771
const ALAT = 34.818673
const OFFSET_X = 80
const OFFSET_Y = 420

function wgs84ToAlgorithm(longitude, latitude) {
  const east =
    (Number(longitude) - ALON) * 111320 * Math.cos((ALAT * Math.PI) / 180)
  const north = (Number(latitude) - ALAT) * 111320
  return {
    x: Math.round(east + OFFSET_X),
    y: Math.round(-north + OFFSET_Y),
  }
}

function parseGasCodes(observedProps) {
  return String(observedProps || '')
    .split('/')
    .map((part) => part.split('(')[0].trim())
    .filter(Boolean)
}

function main() {
  const geojson = JSON.parse(fs.readFileSync(INPUT, 'utf-8'))
  const features = Array.isArray(geojson.features) ? geojson.features : []

  // 只取气体点位（ObservedProps 含 CH4；火焰热成像/摄像头/报警/网关/气象站不含）
  const gasProps = features
    .map((feature) => feature.properties)
    .filter((p) => String(p.ObservedProps || '').includes('CH4'))

  // 同坐标高低位配对去重：保留安装高度最低的点位（低位更贴地敏感）
  const byPosition = new Map()
  for (const p of gasProps) {
    const key = `${Number(p.Wgs84Lon).toFixed(6)},${Number(p.Wgs84Lat).toFixed(6)}`
    const existing = byPosition.get(key)
    if (
      !existing ||
      Number(p.InstallHeight) < Number(existing.InstallHeight)
    ) {
      byPosition.set(key, p)
    }
  }
  const points = [...byPosition.values()]
    .map((p) => {
      const { x, y } = wgs84ToAlgorithm(p.Wgs84Lon, p.Wgs84Lat)
      return {
        id: String(p.SensorID || '').trim(),
        modelName: String(p.ModelName || '').trim(),
        facilityId: String(p.FacilityId || '').trim(),
        sensorModel: String(p.SensorModel || '').trim(),
        x,
        y,
        mapPoint: { x, y },
        priority: Number(p.Priority || 1),
        risk: Number(p.Risk || 0),
        installationHeight: Number(p.InstallHeight || 0.5),
        effectiveRange: Number(p.CoverageRadius || 4),
        observedProps: String(p.ObservedProps || '').trim(),
        gasCodes: parseGasCodes(p.ObservedProps),
        wgs84: {
          longitude: Number(p.Wgs84Lon),
          latitude: Number(p.Wgs84Lat),
        },
        alarmLow: Number(p.AlarmLow || 0),
        alarmHigh: Number(p.AlarmHigh || 0),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))

  const lines = [
    '// 本文件由 scripts/generate-model-monitor-points.cjs 自动生成，勿手改。',
    '// 数据源：public/data/DevicePoint_2D.geojson（iServer MonitorPoints_4490，',
    '// 模型绑定点位，Wgs84 经纬高）。气体点位高低位同坐标配对去重后保留低位。',
    '// 坐标已换算为算法系（x=east+80, y=-north+420，见 supermapGeoreference.js ALGORITHM_FRAME）。',
    '',
    'export interface ModelMonitorPoint {',
    '  id: string',
    '  modelName: string',
    '  facilityId: string',
    '  sensorModel: string',
    '  x: number',
    '  y: number',
    '  mapPoint: { x: number; y: number }',
    '  priority: number',
    '  risk: number',
    '  installationHeight: number',
    '  effectiveRange: number',
    '  observedProps: string',
    '  gasCodes: string[]',
    '  wgs84: { longitude: number; latitude: number }',
    '  alarmLow: number',
    '  alarmHigh: number',
    '}',
    '',
    `export const MODEL_MONITOR_POINTS: ModelMonitorPoint[] = [`,
    ...points.map(
      (p) =>
        `  ${JSON.stringify(p, null, 2)
          .replace(/\n/g, '\n  ')
          .replace(/^  \{/, '{')},`,
    ),
    ']',
    '',
    `export const MODEL_MONITOR_POINT_COUNT = ${points.length}`,
    '',
  ]
  fs.writeFileSync(OUTPUT, lines.join('\n'), 'utf-8')
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  console.log(
    `生成完成：${points.length} 个点位（源 ${features.length} 条 → 气体 ${gasProps.length} 条 → 去重后 ${points.length} 条）`,
  )
  console.log(
    `算法系范围：x [${Math.min(...xs)}, ${Math.max(...xs)}], y [${Math.min(...ys)}, ${Math.max(...ys)}]（网格 0~1000 × 0~540）`,
  )
  console.log(`输出：${OUTPUT}`)
}

main()
