import assert from 'node:assert/strict'
import test from 'node:test'
import { parsePublishedModelAttributes } from '../src/utils/publishedModelAttributes.ts'

test('uses the latest iServer ModelName instead of the legacy AssetId', () => {
  const attributes = parsePublishedModelAttributes({
    fieldNames: [
      'SMID',
      'MODELNAME',
      'COMPONENTID',
      'ASSETID',
      'DEVICEID',
      'DEVICENAME',
      'DEVICETYPE',
    ],
    fieldValues: [
      '15',
      '综合办公楼001',
      'CMP-05014',
      'BUILDING_009',
      'BUILDING_009',
      'BUILDING_009',
      'BUILDING_COMPONENT',
    ],
  })

  assert.equal(attributes?.modelName, '综合办公楼001')
  assert.equal(attributes?.assetId, 'BUILDING_009')
  assert.notEqual(attributes?.modelName, attributes?.assetId)
})
