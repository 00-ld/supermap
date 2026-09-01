import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const exporterPath = path.join(currentDirectory, 'export-velocity-field-grid.mjs')

test('exports a dense ordered 3D grid and converts south-positive V to north-positive', () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'chemical-flow-grid-'),
  )
  try {
    const inputPath = path.join(temporaryDirectory, 'input.json')
    const outputPath = path.join(temporaryDirectory, 'output')
    fs.writeFileSync(
      inputPath,
      JSON.stringify({
        data: {
          frames: [
            {
              frameIndex: 0,
              timeSec: 5,
              velocityField: {
                cells: [
                  { x: 80, y: 420, u: 1.25, v: 2.5, w: 0.1 },
                  { x: 100, y: 420, u: 1, v: 2, w: 0 },
                  { x: 80, y: 440, u: 0.5, v: 1.5, w: -0.1 },
                  { x: 100, y: 440, u: 0, v: 1, w: 0.2 },
                ],
              },
            },
          ],
        },
      }),
    )

    const result = spawnSync(
      process.execPath,
      [
        exporterPath,
        '--input',
        inputPath,
        '--output',
        outputPath,
        '--z-levels',
        '8,18',
      ],
      { encoding: 'utf8' },
    )
    assert.equal(result.status, 0, result.stderr)

    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(outputPath, 'diffusion_velocity_field_manifest.json'),
        'utf8',
      ),
    )
    assert.deepEqual(manifest.grid, {
      rows: 2,
      columns: 2,
      layers: 2,
      pointCount: 8,
      stepX: 20,
      stepY: 20,
      algorithmBounds: { minX: 80, minY: 420, maxX: 100, maxY: 440 },
      zLevelsMeters: [8, 18],
    })

    const csvLines = fs
      .readFileSync(
        path.join(outputPath, 'diffusion_velocity_field_4547.csv'),
        'utf8',
      )
      .replace(/^\uFEFF/, '')
      .trim()
      .split(/\r?\n/)
    assert.equal(csvLines.length, 9)
    assert.equal(
      csvLines[0],
      'x_coord,y_coord,z_coord,row_index,column_index,layer_index,velocity_u_000,velocity_v_000,velocity_w_000',
    )
    assert.equal(
      csvLines[1],
      '457527.930,3854574.900,16.000,0,0,0,1.250000,-2.500000,0.100000',
    )
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
  }
})
