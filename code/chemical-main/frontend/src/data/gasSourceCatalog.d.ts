export interface GasSourceFacility {
  id: string
  name?: string
  type?: string
  key?: boolean
  x: number
  y: number
  w?: number
  h?: number
  modelSmId?: number
  modelName?: string
  supportedGasCodes?: string[]
}

interface GasSourcePoint {
  x: number
  y: number
}

interface GasSourceConfig {
  gasId: string
  gasName: string
  validRadiusMeters: number
  allowedSourceFacilityIds: string[]
  description: string
}

interface NearestGasSourceFacility {
  facility: GasSourceFacility
  distanceMeters: number
}

interface GasLeakSourceValidation {
  valid: boolean
  reasonCode: string
  gasId: string
  config: GasSourceConfig | null
  selectedFacility: GasSourceFacility | null
  allowedFacilities: GasSourceFacility[]
  nearestAllowedFacility: GasSourceFacility | null
  distanceToNearestAllowedMeters: number | null
  message: string
}

export const GAS_SOURCE_CATALOG: GasSourceConfig[]

export function getGasSourceConfig(gasId: string): GasSourceConfig | null

export function getAllowedGasSourceFacilityIds(gasId: string): string[]

export function getAllowedGasSourceFacilities(
  facilities: GasSourceFacility[],
  gasId: string,
): GasSourceFacility[]

export function findNearestAllowedGasSourceFacility(
  facilities: GasSourceFacility[],
  gasId: string,
  mapPoint: GasSourcePoint | null,
): NearestGasSourceFacility | null

export function validateGasLeakSource(params: {
  gasId: string
  sourceFacilityId: string
  facilities: GasSourceFacility[]
  mapPoint?: GasSourcePoint | null
}): GasLeakSourceValidation
