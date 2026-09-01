import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getAllowedGasSourceFacilities,
  validateGasLeakSource,
} from '../src/data/gasSourceCatalog.js'

const modelSources = [
  {
    id: 'pipe',
    name: '输气管道',
    x: 100,
    y: 120,
    supportedGasCodes: ['CH4', 'CO'],
  },
  {
    id: 'tank',
    name: '立式固定顶储罐',
    x: 220,
    y: 180,
    supportedGasCodes: ['NH3', 'CH4'],
  },
]

test('filters model-bound leak candidates by supported gas code', () => {
  assert.deepEqual(
    getAllowedGasSourceFacilities(modelSources, 'co').map(
      (source) => source.id,
    ),
    ['pipe'],
  )
})

test('accepts a selected ModelName leak source even when it is not in the legacy DOM id catalog', () => {
  const validation = validateGasLeakSource({
    gasId: 'ch4',
    sourceFacilityId: 'tank',
    facilities: modelSources,
  })
  assert.equal(validation.valid, true)
  assert.equal(validation.selectedFacility?.name, '立式固定顶储罐')
})
