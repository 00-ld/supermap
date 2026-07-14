import { MAP_METERS_PER_UNIT } from './coordinate'

export const GAS_SOURCE_CATALOG = [
  {
    gasId: 'co',
    gasName: 'CO',
    validRadiusMeters: 36,
    allowedSourceFacilityIds: ['pa-west-north', 'pa-center-north', 'pa-center-south', 'pb-mid-process', 'wh-logistics'],
    description: 'Allowed near real-DOM production, process and warehouse areas',
  },
  {
    gasId: 'nh3',
    gasName: 'NH3',
    validRadiusMeters: 38,
    allowedSourceFacilityIds: ['pa-west-south', 'tw-center', 'pb-north-tank', 'pb-mid-process'],
    description: 'Allowed near real-DOM tank, tower and process equipment areas',
  },
  {
    gasId: 'ch4',
    gasName: 'CH4',
    validRadiusMeters: 40,
    allowedSourceFacilityIds: ['pa-west-north', 'pa-west-south', 'pb-north-tank', 'wh-logistics'],
    description: 'Allowed near real-DOM combustible gas process, tank and warehouse areas',
  },
  {
    gasId: 'o2',
    gasName: 'O2',
    validRadiusMeters: 30,
    allowedSourceFacilityIds: ['ut-center', 'pa-center-south', 'pb-mid-process'],
    description: 'Allowed near real-DOM utility and process areas',
  },
]

export function getGasSourceConfig(gasId) {
  return GAS_SOURCE_CATALOG.find(item => item.gasId === gasId) || null
}

export function getAllowedGasSourceFacilityIds(gasId) {
  return getGasSourceConfig(gasId)?.allowedSourceFacilityIds || []
}

export function getAllowedGasSourceFacilities(facilities, gasId) {
  const allowedIds = new Set(getAllowedGasSourceFacilityIds(gasId))
  return facilities.filter(facility => allowedIds.has(facility.id))
}

export function findNearestAllowedGasSourceFacility(facilities, gasId, mapPoint) {
  if (!mapPoint) return null
  const allowedFacilities = getAllowedGasSourceFacilities(facilities, gasId)
  if (!allowedFacilities.length) return null
  return findNearestAllowedFacility(mapPoint, allowedFacilities)
}

export function validateGasLeakSource({
  gasId,
  sourceFacilityId,
  facilities,
  mapPoint,
}) {
  const config = getGasSourceConfig(gasId)
  if (!config) {
    return {
      valid: false,
      reasonCode: 'missing_catalog',
      gasId,
      config: null,
      selectedFacility: null,
      allowedFacilities: [],
      nearestAllowedFacility: null,
      distanceToNearestAllowedMeters: null,
      message: '当前气体尚未配置允许的泄漏源范围',
    }
  }

  const selectedFacility = facilities.find(item => item.id === sourceFacilityId) || null
  const allowedFacilities = getAllowedGasSourceFacilities(facilities, gasId)
  if (!selectedFacility) {
    return {
      valid: false,
      reasonCode: 'missing_source',
      gasId,
      config,
      selectedFacility: null,
      allowedFacilities,
      nearestAllowedFacility: null,
      distanceToNearestAllowedMeters: null,
      message: '请先选择一个泄漏源设施',
    }
  }

  if (!allowedFacilities.length) {
    return {
      valid: false,
      reasonCode: 'missing_allowed_facilities',
      gasId,
      config,
      selectedFacility,
      allowedFacilities: [],
      nearestAllowedFacility: null,
      distanceToNearestAllowedMeters: null,
      message: `${config.gasName} 暂未配置合法泄漏设施`,
    }
  }

  const selectedPoint = mapPoint || getFacilityCenter(selectedFacility)
  const nearest = findNearestAllowedFacility(selectedPoint, allowedFacilities)
  const isDirectlyAllowed = config.allowedSourceFacilityIds.includes(selectedFacility.id)
  const isWithinRadius = nearest && nearest.distanceMeters <= config.validRadiusMeters
  const valid = Boolean(isDirectlyAllowed || isWithinRadius)

  if (valid) {
    return {
      valid: true,
      reasonCode: isDirectlyAllowed ? 'allowed_facility' : 'within_radius',
      gasId,
      config,
      selectedFacility,
      allowedFacilities,
      nearestAllowedFacility: nearest?.facility || null,
      distanceToNearestAllowedMeters: nearest ? round2(nearest.distanceMeters) : 0,
      message: `${config.gasName} 泄漏源校验通过`,
    }
  }

  const nearestLabel = nearest?.facility?.name || '允许区域'
  const distanceLabel = nearest ? `${round2(nearest.distanceMeters)}m` : '--'
  return {
    valid: false,
    reasonCode: 'out_of_range',
    gasId,
    config,
    selectedFacility,
    allowedFacilities,
    nearestAllowedFacility: nearest?.facility || null,
    distanceToNearestAllowedMeters: nearest ? round2(nearest.distanceMeters) : null,
    message: `当前泄漏点不在 ${config.gasName} 允许的生产/储存区域附近，最近允许设施为 ${nearestLabel}，距离 ${distanceLabel}`,
  }
}

function findNearestAllowedFacility(point, facilities) {
  let nearest = null
  for (const facility of facilities) {
    const center = getFacilityCenter(facility)
    const distanceMeters = Math.hypot(point.x - center.x, point.y - center.y) * MAP_METERS_PER_UNIT
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      nearest = {
        facility,
        distanceMeters,
      }
    }
  }
  return nearest
}

function getFacilityCenter(facility) {
  return {
    x: facility.x + (facility.w || 0) / 2,
    y: facility.y + (facility.h || 0) / 2,
  }
}

function round2(value) {
  return Number(value.toFixed(2))
}
