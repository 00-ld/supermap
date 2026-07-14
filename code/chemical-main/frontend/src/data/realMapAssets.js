export const REAL_MAP = {
  image: '/maps/real-park-dom.jpg',
  sourceWidthPx: 31744,
  sourceHeightPx: 18944,
  assetWidthPx: 3968,
  assetHeightPx: 2368,
  metersPerSourcePixel: 0.05,
  metersPerAssetPixel: 0.4,
  width: 1587.2,
  height: 947.2,
  source: 'external-real-dom-source/ResultDOM_2.tiff',
  standardBasis: 'GB/T 50493-2019',
}

export const dataBoundary = {
  x: 0,
  y: 0,
  w: REAL_MAP.width,
  h: REAL_MAP.height,
}

export const facilities = [
  { id: 'pa-west-north', name: '西北生产装置区', type: 'production', x: 248, y: 252, w: 334, h: 176, zone: 'prod_a', status: '运行中', personnel: 36, hazardLevel: 0.75, desc: '真实DOM识别：西侧北部蓝色厂房、塔器和管廊密集区' },
  { id: 'pa-west-south', name: '西南储罐与泵区', type: 'production', x: 248, y: 430, w: 334, h: 242, zone: 'tank_farm', status: '运行中', personnel: 18, hazardLevel: 0.85, desc: '真实DOM识别：西侧罐组、泵组、管道连接和小型装置区' },
  { id: 'pa-center-north', name: '中北厂房装置区', type: 'production', x: 588, y: 252, w: 168, h: 176, zone: 'prod_a', status: '运行中', personnel: 26, hazardLevel: 0.65, desc: '真实DOM识别：中部北侧厂房、装置和罐体区' },
  { id: 'pa-center-south', name: '中南反应装置区', type: 'production', x: 588, y: 430, w: 168, h: 242, zone: 'prod_a', status: '运行中', personnel: 24, hazardLevel: 0.7, desc: '真实DOM识别：中部南侧反应、换热和罐体区' },
  { id: 'tw-center', name: '中东塔器与罐组区', type: 'tower', x: 856, y: 252, w: 90, h: 420, zone: 'tower_area', status: '运行中', personnel: 12, hazardLevel: 0.8, desc: '真实DOM识别：中东部竖向塔器、小罐和管线连接区' },
  { id: 'ut-center', name: '公用工程与管廊区', type: 'utility', x: 760, y: 252, w: 88, h: 420, zone: 'utility', status: '运行中', personnel: 8, hazardLevel: 0.45, desc: '真实DOM识别：中部道路两侧公用工程、蓝色厂房和管廊' },
  { id: 'pb-north-tank', name: '东北罐组与管汇区', type: 'tank', x: 956, y: 252, w: 260, h: 170, zone: 'prod_b', status: '运行中', personnel: 14, hazardLevel: 0.75, desc: '真实DOM识别：东北部黑色罐组、管汇和装卸连接区' },
  { id: 'pb-mid-process', name: '东中生产与污水装置区', type: 'production', x: 956, y: 420, w: 260, h: 116, zone: 'prod_b2', status: '运行中', personnel: 18, hazardLevel: 0.6, desc: '真实DOM识别：东中部蓝色厂房、水池和小罐区' },
  { id: 'wh-logistics', name: '东南仓储物流区', type: 'warehouse', x: 1076, y: 536, w: 140, h: 126, zone: 'warehouse', status: '正常', personnel: 10, hazardLevel: 0.45, desc: '真实DOM识别：东南堆场、车辆、装卸和仓储区' },
  { id: 'fs-east-yard', name: '东侧应急与装卸边界区', type: 'utility', x: 984, y: 536, w: 92, h: 126, zone: 'fire_safety', status: '正常', personnel: 4, hazardLevel: 0.35, desc: '真实DOM识别：东侧灰色场地、停车和应急边界' },
]

export const facilityById = new Map(facilities.map(facility => [facility.id, facility]))

export const keyAreas = facilities
  .filter(item => item.hazardLevel >= 0.7)
  .map(item => ({
    id: `key-${item.id}`,
    name: item.name,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }))

export const roads = [
  { id: 'road-north-main', x: 0, y: 226, w: 1587.2, h: 20, main: true },
  { id: 'road-south-main', x: 0, y: 678, w: 1587.2, h: 22, main: true },
  { id: 'road-west-main', x: 229, y: 0, w: 18, h: 947.2, main: true },
  { id: 'road-east-main', x: 1216, y: 0, w: 22, h: 947.2, main: true },
  { id: 'road-center-west', x: 760, y: 226, w: 16, h: 452, main: false },
  { id: 'road-center-east', x: 940, y: 226, w: 16, h: 452, main: false },
  { id: 'road-west-service', x: 392, y: 226, w: 14, h: 452, main: false },
  { id: 'road-mid-service', x: 668, y: 226, w: 14, h: 452, main: false },
  { id: 'road-east-yard-service', x: 1068, y: 226, w: 14, h: 452, main: false },
  { id: 'road-row-north', x: 229, y: 336, w: 1009, h: 14, main: false },
  { id: 'road-row-middle', x: 229, y: 448, w: 1009, h: 16, main: false },
  { id: 'road-row-south', x: 229, y: 556, w: 1009, h: 14, main: false },
  { id: 'road-west-loop', x: 247, y: 246, w: 16, h: 432, main: false },
  { id: 'road-tank-loop', x: 582, y: 246, w: 14, h: 432, main: false },
  { id: 'road-logistics-loop', x: 984, y: 246, w: 14, h: 432, main: false },
]

export const pipes = []

export const zones = [
  { id: 'prod_a', name: '西中生产区', color: '#4d7c67', tag: '生产', status: '运行中', key: true },
  { id: 'prod_b', name: '东北罐组区', color: '#667085', tag: '罐组', status: '运行中', key: true },
  { id: 'prod_b2', name: '东中生产区', color: '#4d7c67', tag: '生产', status: '运行中' },
  { id: 'tank_farm', name: '西南储罐泵区', color: '#6b7fa3', tag: '储运', status: '运行中', key: true },
  { id: 'tower_area', name: '塔器罐组区', color: '#8a6a8a', tag: '塔器', status: '运行中', key: true },
  { id: 'utility', name: '公用工程区', color: '#5a6a7a', tag: '辅助', status: '运行中' },
  { id: 'warehouse', name: '仓储物流区', color: '#6a6a5a', tag: '仓储', status: '正常' },
  { id: 'fire_safety', name: '应急装卸边界', color: '#a05a4a', tag: '应急', status: '正常' },
]

export const stats = [
  { filter: 'all', value: facilities.length, label: '识别区域', color: 'var(--accent)' },
  { filter: 'building', value: facilities.filter(item => item.type === 'production').length, label: '生产装置', color: '' },
  { filter: 'tank', value: facilities.filter(item => item.type === 'tank').length, label: '罐组', color: '' },
  { filter: 'tower', value: facilities.filter(item => item.type === 'tower').length, label: '塔器', color: '' },
  { filter: 'key', value: keyAreas.length, label: '重点区域', color: 'var(--info)' },
]

export const legends = [
  { type: 'real-map', label: '真实二维DOM', shape: '', style: 'background:#8ea7b8;' },
  { type: 'production', label: '识别生产装置区', shape: '', style: 'background:rgba(77,124,103,0.28);border:1px solid #4d7c67;' },
  { type: 'tank', label: '识别罐组区', shape: '', style: 'background:rgba(107,127,163,0.28);border:1px solid #6b7fa3;' },
  { type: 'tower', label: '识别塔器区', shape: '', style: 'background:rgba(138,106,138,0.28);border:1px solid #8a6a8a;' },
  { type: 'warehouse', label: '仓储物流区', shape: '', style: 'background:rgba(106,106,90,0.28);border:1px solid #6a6a5a;' },
  { type: 'key-area', label: '重点设备边界', shape: '', style: 'background:rgba(56,189,248,0.18);border:1px dashed #38bdf8;' },
]

export const alerts = [
  { type: 'info', icon: 'fas fa-map-location-dot', text: '二维底图已切换为真实DOM，坐标单位为米', time: '当前' },
]

export const parkEntrances = [
  { id: 'park-west', kind: 'park', edge: 'left', x: 238, y: 235, label: '西侧道路入口', tooltipSide: 'right' },
  { id: 'park-east', kind: 'park', edge: 'right', x: 1228, y: 684, label: '东侧道路入口', tooltipSide: 'left' },
  { id: 'park-north', kind: 'park', edge: 'top', x: 1218, y: 230, label: '北侧道路入口', tooltipSide: 'bottom' },
  { id: 'park-south', kind: 'park', edge: 'bottom', x: 1218, y: 682, label: '南侧道路入口', tooltipSide: 'top' },
]

export const buildingEntrances = facilities.map((facility) => ({
  id: `building-${facility.id}`,
  kind: 'building',
  edge: 'left',
  parentId: facility.id,
  x: facility.x,
  y: facility.y + facility.h / 2,
  label: `${facility.name} 边界点`,
  tooltipSide: 'right',
}))

export const groundSpeckles = []

export function getFacilityAnchorPoint(facility) {
  if (!facility) return null
  return {
    x: facility.x + (facility.w || 0) / 2,
    y: facility.y + (facility.h || 0) / 2,
  }
}
