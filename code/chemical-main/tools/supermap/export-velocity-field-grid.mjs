/**
 * 扩散速度场 -> iDesktopX 2026「三维流场数据生成瓦片」点网格 CSV。
 *
 * iDesktopX 的官方流场工具需要一个完整、有序的三维点网格：
 *   行 * 列 * 层 个点；每个时刻由 U/V/W 三个 DOUBLE 字段组成。
 * 本脚本把 /api/diffusion/simulate 的响应转换为该结构，并同时输出导入清单。
 *
 * 用法：
 *   node tools/supermap/export-velocity-field-grid.mjs \
 *     --input output/diffusion_result.json \
 *     --output "G:/竞赛/超图杯/三维瓦片数据_4490/三维流场瓦片/输入数据"
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const cupRoot = path.resolve(repoRoot, '..', '..')

function parseArgs(argv) {
  const parsed = {}
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) continue
    const next = argv[index + 1]
    parsed[item.slice(2)] = next && !next.startsWith('--') ? next : true
    if (next && !next.startsWith('--')) index += 1
  }
  return parsed
}

const args = parseArgs(process.argv.slice(2))
const inputPath = path.resolve(
  String(args.input || path.join(repoRoot, 'output', 'diffusion_result.json')),
)
const outputRoot = path.resolve(
  String(
    args.output ||
      path.join(cupRoot, '三维瓦片数据_4490', '三维流场瓦片', '输入数据'),
  ),
)
const zLevelsMeters = String(args['z-levels'] || '8,18,35')
  .split(',')
  .map(Number)
  .filter(Number.isFinite)
  .sort((left, right) => left - right)

if (!fs.existsSync(inputPath)) {
  throw new Error(`输入文件不存在: ${inputPath}`)
}
if (!zLevelsMeters.length) {
  throw new Error('--z-levels 至少需要一个有效数字，例如 8,18,35')
}

const envelope = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
const result = envelope?.data?.frames ? envelope.data : envelope
const frames = Array.isArray(result?.frames) ? result.frames : []
if (!frames.length) {
  throw new Error('响应中没有 frames（请先调用 /api/diffusion/simulate 并保存响应）')
}

const allCells = frames.flatMap((frame) =>
  Array.isArray(frame?.velocityField?.cells) ? frame.velocityField.cells : [],
)
if (!allCells.length) {
  throw new Error('响应中没有 velocityField.cells（请确认速度场功能已开启）')
}

const uniqueSorted = (values) =>
  [...new Set(values.map((value) => Number(value)).filter(Number.isFinite))].sort(
    (left, right) => left - right,
  )
const xs = uniqueSorted(allCells.map((cell) => cell.x))
const ys = uniqueSorted(allCells.map((cell) => cell.y))
if (xs.length < 2 || ys.length < 2) {
  throw new Error('速度场至少需要 2 行 * 2 列规则格点')
}

const medianStep = (values) => {
  const deltas = values
    .slice(1)
    .map((value, index) => value - values[index])
    .filter((value) => value > 0)
    .sort((left, right) => left - right)
  return deltas[Math.floor(deltas.length / 2)]
}
const stepX = medianStep(xs)
const stepY = medianStep(ys)
const minX = xs[0]
const maxX = xs.at(-1)
const minY = ys[0]
const maxY = ys.at(-1)
const columns = Math.round((maxX - minX) / stepX) + 1
const rows = Math.round((maxY - minY) / stepY) + 1

// 与 frontend/src/data/supermapGeoreference.js 的 ALGORITHM_FRAME 和 A 锚点一致。
const ALGORITHM_OFFSET_X = 80
const ALGORITHM_OFFSET_Y = 420
const ANCHOR_EASTING = 457527.93
const ANCHOR_NORTHING = 3854574.9
const BASE_ALTITUDE_METERS = 8
const NULL_VALUE = -9999

const frameFields = frames.flatMap((_, index) => {
  const suffix = String(index).padStart(3, '0')
  return [`velocity_u_${suffix}`, `velocity_v_${suffix}`, `velocity_w_${suffix}`]
})
const header = [
  'x_coord',
  'y_coord',
  'z_coord',
  'row_index',
  'column_index',
  'layer_index',
  ...frameFields,
]

function cellKey(x, y) {
  return `${Number(x).toFixed(3)}:${Number(y).toFixed(3)}`
}

const velocityByFrame = frames.map((frame) => {
  const cells = Array.isArray(frame?.velocityField?.cells)
    ? frame.velocityField.cells
    : []
  return new Map(cells.map((cell) => [cellKey(cell.x, cell.y), cell]))
})

const csvRows = [header.join(',')]
for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
  const algorithmY = minY + rowIndex * stepY
  const localY = algorithmY - ALGORITHM_OFFSET_Y
  const northing = ANCHOR_NORTHING - localY
  for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
    const algorithmX = minX + columnIndex * stepX
    const localX = algorithmX - ALGORITHM_OFFSET_X
    const easting = ANCHOR_EASTING + localX
    const key = cellKey(algorithmX, algorithmY)
    for (let layerIndex = 0; layerIndex < zLevelsMeters.length; layerIndex += 1) {
      const heightMeters = zLevelsMeters[layerIndex]
      const values = [
        easting.toFixed(3),
        northing.toFixed(3),
        (BASE_ALTITUDE_METERS + heightMeters).toFixed(3),
        rowIndex,
        columnIndex,
        layerIndex,
      ]
      velocityByFrame.forEach((lookup) => {
        const cell = lookup.get(key)
        if (!cell) {
          values.push(0, 0, 0)
          return
        }
        // 算法 +Y 向南；EPSG:4547 +Y 向北，所以 V 分量必须反号。
        values.push(
          Number(cell.u || 0).toFixed(6),
          (-Number(cell.v || 0)).toFixed(6),
          Number(cell.w || 0).toFixed(6),
        )
      })
      csvRows.push(values.join(','))
    }
  }
}

fs.mkdirSync(outputRoot, { recursive: true })
const csvPath = path.join(outputRoot, 'diffusion_velocity_field_4547.csv')
fs.writeFileSync(csvPath, `\uFEFF${csvRows.join('\r\n')}\r\n`, 'utf8')

const manifest = {
  source: inputPath,
  outputCsv: csvPath,
  coordinateSystem: 'EPSG:4547 / CGCS2000_3GK_CM_114E',
  ordering: 'row(top-to-bottom), column(left-to-right), layer(low-to-high)',
  grid: {
    rows,
    columns,
    layers: zLevelsMeters.length,
    pointCount: rows * columns * zLevelsMeters.length,
    stepX,
    stepY,
    algorithmBounds: { minX, minY, maxX, maxY },
    zLevelsMeters,
  },
  iDesktopX2026: {
    tool: '三维流场数据生成瓦片',
    rowField: 'x_coord',
    columnField: 'y_coord',
    layerField: 'z_coord',
    temporalElementName: 'velocity',
    spatialDimension: 3,
    nullValues: [NULL_VALUE, NULL_VALUE, NULL_VALUE],
    temporalFields: frameFields,
  },
  frames: frames.map((frame, index) => ({
    index,
    frameIndex: frame.frameIndex ?? index,
    timeSec: frame.timeSec ?? index,
    fields: frameFields.slice(index * 3, index * 3 + 3),
    sourceCellCount: velocityByFrame[index].size,
  })),
}
const manifestPath = path.join(outputRoot, 'diffusion_velocity_field_manifest.json')
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log(`完成：${csvPath}`)
console.log(`清单：${manifestPath}`)
console.log(
  `网格：${rows} 行 * ${columns} 列 * ${zLevelsMeters.length} 层 = ${manifest.grid.pointCount} 点；${frames.length} 个时刻`,
)
