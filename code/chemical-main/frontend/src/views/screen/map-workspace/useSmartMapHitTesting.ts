import type { Ref } from 'vue'
import type { MapFacility } from '@/data/realMapAssets'
import { ALGORITHM_FRAME } from '@/data/supermapGeoreference'

export type SmartMapHitFilterKey = 'all' | 'building' | 'tank' | 'tower' | 'pipe' | 'key'

export interface SmartMapHitPoint {
  x: number
  y: number
}

export interface SmartMapEntranceLike extends SmartMapHitPoint {
  id: string
  parentId?: string
}

export interface SmartMapCandidateRegionLike {
  center?: SmartMapHitPoint | null
  radius?: number
}

export interface SmartMapFacilityBounds {
  x: number
  y: number
  w: number
  h: number
}

type SmartMapRadiusFacility = MapFacility & { r: number }
type FacilityBoundsResolver<TBounds extends SmartMapFacilityBounds = SmartMapFacilityBounds> = (facility: MapFacility) => TBounds
type FacilityRadiusPredicate = (facility: MapFacility) => facility is SmartMapRadiusFacility

interface SmartMapHitTestingActionsOptions<
  TEntrance extends SmartMapEntranceLike,
  TSensor extends SmartMapHitPoint,
  TRegion extends SmartMapCandidateRegionLike,
  TBounds extends SmartMapFacilityBounds,
> {
  facilities: MapFacility[]
  parkEntrances: TEntrance[]
  buildingEntrances: TEntrance[]
  facilityById: Map<string, MapFacility>
  activeFilter: Ref<SmartMapHitFilterKey>
  showEntrances: Ref<boolean>
  candidateRegions: Readonly<Ref<TRegion[]>>
  sensors: Ref<TSensor[]>
  getFacilityBounds: FacilityBoundsResolver<TBounds>
  hasRadiusFacility: FacilityRadiusPredicate
}

export interface SmartMapHitTestingLayer<
  TEntrance extends SmartMapEntranceLike,
  TBounds extends SmartMapFacilityBounds = SmartMapFacilityBounds,
> {
  matchFilter: (facility: MapFacility) => boolean
  getFacilityBounds: FacilityBoundsResolver<TBounds>
  getVisibleEntrances: () => TEntrance[]
}

export function smartMapFacilityMatchesFilter(facility: MapFacility, activeFilter: SmartMapHitFilterKey) {
  if (activeFilter === 'all') return true
  if (activeFilter === 'building') {
    return ['office', 'production', 'utility', 'warehouse', 'treatment'].includes(facility.type)
  }
  if (activeFilter === 'tank') return facility.type === 'tank'
  if (activeFilter === 'tower') return facility.type === 'tower'
  if (activeFilter === 'pipe') return false
  if (activeFilter === 'key') return facility.key || facility.zone === 'tank_farm' || facility.zone === 'tower_area'
  return true
}

export function getSmartMapVisibleEntrances<TEntrance extends SmartMapEntranceLike>(
  parkEntrances: TEntrance[],
  buildingEntrances: TEntrance[],
  facilityById: Map<string, MapFacility>,
  activeFilter: SmartMapHitFilterKey,
) {
  return parkEntrances.concat(
    buildingEntrances.filter(entrance => {
      const facility = entrance.parentId ? facilityById.get(entrance.parentId) : null
      return facility ? smartMapFacilityMatchesFilter(facility, activeFilter) : true
    }),
  )
}

export function smartMapFacilityHitTest(
  facilities: MapFacility[],
  wx: number,
  wy: number,
  activeFilter: SmartMapHitFilterKey,
  getFacilityBounds: FacilityBoundsResolver,
  hasRadiusFacility: FacilityRadiusPredicate,
) {
  for (let i = facilities.length - 1; i >= 0; i--) {
    const facility = facilities[i]
    if (!smartMapFacilityMatchesFilter(facility, activeFilter)) continue
    const bounds = getFacilityBounds(facility)
    if (hasRadiusFacility(facility) && facility.type === 'tank') {
      const dx = wx - facility.x
      const dy = wy - facility.y
      if (dx * dx + dy * dy <= facility.r * facility.r) return facility
    } else if (hasRadiusFacility(facility) && facility.type === 'tower') {
      if (Math.abs(wx - facility.x) <= facility.r && wy >= facility.y - facility.h / 2 && wy <= facility.y + facility.h / 2) {
        return facility
      }
    } else if (wx >= bounds.x && wx <= bounds.x + bounds.w && wy >= bounds.y && wy <= bounds.y + bounds.h) {
      return facility
    }
  }
  return null
}

export function smartMapEntranceHitTest<TEntrance extends SmartMapEntranceLike>(
  entrances: TEntrance[],
  wx: number,
  wy: number,
  visible: boolean,
) {
  if (!visible) return null
  for (let i = entrances.length - 1; i >= 0; i--) {
    const entrance = entrances[i]
    if (Math.hypot(wx - entrance.x, wy - entrance.y) <= 12) return entrance
  }
  return null
}

export function smartMapCandidateRegionHitTest<TRegion extends SmartMapCandidateRegionLike>(
  regions: TRegion[],
  wx: number,
  wy: number,
) {
  for (let i = regions.length - 1; i >= 0; i--) {
    const region = regions[i]
    if (!region.center || !Number.isFinite(region.radius)) continue
    if (Math.hypot(wx - region.center.x, wy - region.center.y) <= Number(region.radius)) return region
  }
  return null
}

export function smartMapPointHitTest<TPoint extends SmartMapHitPoint>(
  points: TPoint[],
  wx: number,
  wy: number,
  radius = 12,
) {
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i]
    if (Math.hypot(wx - point.x, wy - point.y) < radius) return point
  }
  return null
}

export function useSmartMapHitTestingActions<
  TEntrance extends SmartMapEntranceLike,
  TSensor extends SmartMapHitPoint,
  TRegion extends SmartMapCandidateRegionLike,
  TBounds extends SmartMapFacilityBounds,
>(options: SmartMapHitTestingActionsOptions<TEntrance, TSensor, TRegion, TBounds>) {
  function getVisibleEntrances() {
    return getSmartMapVisibleEntrances(
      options.parkEntrances,
      options.buildingEntrances,
      options.facilityById,
      options.activeFilter.value,
    )
  }

  function matchFilter(facility: MapFacility) {
    return smartMapFacilityMatchesFilter(facility, options.activeFilter.value)
  }

  function hitTest(wx: number, wy: number) {
    return smartMapFacilityHitTest(
      options.facilities,
      wx,
      wy,
      options.activeFilter.value,
      options.getFacilityBounds,
      options.hasRadiusFacility,
    )
  }

  function entranceHitTest(wx: number, wy: number) {
    return smartMapEntranceHitTest(getVisibleEntrances(), wx, wy, options.showEntrances.value)
  }

  function candidateRegionHitTest(wx: number, wy: number) {
    // F11（2026-08-01）：溯源候选区为算法系坐标，点击点先转算法系
    return smartMapCandidateRegionHitTest(
      options.candidateRegions.value,
      wx + ALGORITHM_FRAME.offsetX,
      wy + ALGORITHM_FRAME.offsetY,
    )
  }

  function sensorHitTest(wx: number, wy: number) {
    // F11（2026-08-01）：传感器为算法系坐标，点击点（底图系）先转算法系再命中
    return smartMapPointHitTest(
      options.sensors.value,
      wx + ALGORITHM_FRAME.offsetX,
      wy + ALGORITHM_FRAME.offsetY,
    )
  }

  return {
    candidateRegionHitTest,
    entranceHitTest,
    getFacilityBounds: options.getFacilityBounds,
    getVisibleEntrances,
    hasRadiusFacility: options.hasRadiusFacility,
    hitTest,
    matchFilter,
    sensorHitTest,
  }
}
