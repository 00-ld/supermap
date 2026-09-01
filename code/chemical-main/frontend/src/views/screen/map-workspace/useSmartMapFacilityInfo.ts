import type { MapFacility } from '@/data/realMapAssets'

export type SmartMapInfoSubtitle = Partial<{
  text: string
  color: string
  tag: string
  tagClass: string
  desc: string
}>

export type SmartMapInfoRow = {
  key: string
  val: unknown
  style?: Record<string, string>
  tag?: boolean
  tagClass?: string
  action?: () => void
  btnClass?: string
}

export interface SmartMapZoneLike {
  id: string
  name: string
}

export interface SmartMapFacilityInfo {
  title: string
  subtitle: SmartMapInfoSubtitle
  rows: SmartMapInfoRow[]
}

export function smartMapStatusTagClass(status: string | undefined) {
  if (status === '告警') return 'tag-red'
  if (status === '维护中' || status === '待机') return 'tag-orange'
  if (status === '运行中') return 'tag-blue'
  return 'tag-green'
}

export function getSmartMapZoneName(zones: SmartMapZoneLike[], zoneId: string) {
  return zones.find(zone => zone.id === zoneId)?.name || zoneId
}

export function buildSmartMapFacilityInfo(facility: MapFacility, zones: SmartMapZoneLike[]): SmartMapFacilityInfo {
  const rows: SmartMapInfoRow[] = []
  const zoneName = getSmartMapZoneName(zones, facility.zone)
  const statusTag = smartMapStatusTagClass(facility.status)

  if (facility.type === 'tank') {
    const level = Number(facility.level ?? 0)
    const temperature = Number(facility.temp ?? 0)
    rows.push({ key: '储罐编号', val: facility.id.toUpperCase() })
    rows.push({ key: '所属区域', val: zoneName })
    rows.push({ key: '容量', val: facility.capacity })
    rows.push({ key: '存储介质', val: facility.material })
    rows.push({ key: '液位', val: `${level}%`, style: { color: level > 85 ? 'var(--danger)' : 'var(--accent)' } })
    rows.push({ key: '温度', val: `${temperature}℃`, style: { color: temperature > 80 ? 'var(--warning)' : 'var(--fg)' } })
  } else if (facility.type === 'tower') {
    rows.push({ key: '设备编号', val: facility.id.toUpperCase() })
    rows.push({ key: '所属区域', val: zoneName })
    rows.push({ key: '塔高', val: facility.height })
    rows.push({ key: '操作压力', val: facility.pressure })
    rows.push({ key: '操作温度', val: `${facility.temp}℃` })
  } else {
    rows.push({ key: '建筑编号', val: facility.id.toUpperCase() })
    rows.push({ key: '所属区域', val: zoneName })
    if (facility.area) rows.push({ key: '建筑面积', val: facility.area })
    if (facility.floors) rows.push({ key: '楼层', val: `${facility.floors} 层` })
    if (facility.personnel) rows.push({ key: '在岗人数', val: `${facility.personnel} 人` })
    if (facility.power) rows.push({ key: '额定功率', val: facility.power })
    if (facility.capacity) rows.push({ key: '仓储容量', val: facility.capacity })
    if (facility.flow) rows.push({ key: '处理流量', val: facility.flow })
    if (facility.volume) rows.push({ key: '池容', val: facility.volume })
    if (facility.bays) rows.push({ key: '装卸位', val: `${facility.bays} 个` })
  }
  rows.push({ key: '状态', val: facility.status, tag: true, tagClass: statusTag })

  return {
    title: facility.name,
    subtitle: { tag: facility.status, tagClass: statusTag, desc: facility.desc || '' },
    rows,
  }
}
