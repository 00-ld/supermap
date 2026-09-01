import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assembleEquipmentFromFootprints,
  assembleEquipmentFromSmId,
  footprintAtPoint,
  footprintModelName,
  type GeoFeature,
} from '../src/utils/geoQueryUtils.ts'

function footprint(
  name: string,
  left: number,
  bottom: number,
  right: number,
  top: number,
): GeoFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [],
    },
    properties: {
      name,
      s3mLeft: left,
      s3mBottom: bottom,
      s3mRight: right,
      s3mTop: top,
    },
  }
}

test('selects the smallest footprint when scene objects overlap', () => {
  const parkGround = footprint('GROUND', 0, 0, 100, 100)
  const building = footprint('BUILDING_7080', 40, 40, 60, 60)
  const equipment = footprint('TOWER_7080', 47, 47, 53, 53)

  assert.equal(
    footprintAtPoint([parkGround, building, equipment], 50, 50)?.properties
      .name,
    'TOWER_7080',
  )
})

test('returns null when no footprint contains the picked point', () => {
  assert.equal(footprintAtPoint([footprint('A', 0, 0, 10, 10)], 20, 20), null)
})

test('uses the published ModelName field as the authoritative model name', () => {
  const feature = footprint('LEGACY_NAME', 0, 0, 10, 10)
  feature.properties.ModelName = 'TANK_002'

  assert.equal(footprintModelName(feature), 'TANK_002')
})

test('aggregates a picked pipe into the nearest equipment assembly', () => {
  const footprints = [
    footprint('BUILDING_001', 0, 0, 50, 50),
    footprint('EQUIPMENT_001', 10, 10, 14, 14),
    footprint('PIPE_001', 13.5, 11, 20, 12),
    footprint('PIPE_002', 14, 12, 18, 13),
    footprint('EQUIPMENT_002', 26, 26, 30, 30),
  ]

  const assembly = assembleEquipmentFromFootprints(footprints, 'PIPE_001')

  assert.equal(assembly?.equipmentId, 'EQ-EQUIPMENT_001')
  assert.equal(assembly?.primarySmId, 2)
  assert.equal(assembly?.selectedSmId, 3)
  assert.deepEqual(assembly?.componentSmIds, [2, 3, 4])
})

test('uses an explicit footprint SmID when the published field is available', () => {
  const tank = footprint('TANK_059', 0, 0, 6, 6)
  tank.properties.SmID = 351

  const assembly = assembleEquipmentFromFootprints([tank], 'TANK_059')

  assert.equal(assembly?.primarySmId, 351)
  assert.deepEqual(assembly?.componentSmIds, [351])
})

test('resolves an equipment assembly from the picked SmID record order', () => {
  const footprints = [
    footprint('BUILDING_001', 0, 0, 50, 50),
    footprint('EQUIPMENT_001', 10, 10, 14, 14),
    footprint('PIPE_001', 13.5, 11, 20, 12),
  ]

  const assembly = assembleEquipmentFromSmId(footprints, 3)

  assert.equal(assembly?.selectedModelName, 'PIPE_001')
  assert.equal(assembly?.equipmentId, 'EQ-EQUIPMENT_001')
})
