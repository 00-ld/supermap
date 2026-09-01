/**
 * SuperMapSceneViewer 场景静态数据。
 *
 * 从 SuperMapSceneViewer.vue 抽离的纯数据常量：
 * - 传感器布设标准与规则
 * - 设施网格/罐组/边缘槽位
 * - Three Tiles 可见设施清单
 * - Three Tiles 设备锚点 / 路网 / 图节点
 *
 * 注意：THREE_TILES_SAFE_EXITS 依赖运行时函数 entranceToAnalysisPoint，
 * 暂保留在主文件中。
 */

import type { MapFacility } from '@/data/realMapAssets'
import type {
  FacilityPlacementRule,
  ThreeTilesEquipmentAnchor,
} from './sceneTypes'

/** 传感器布设国标依据说明。 */
export const THREE_TILES_SENSOR_STANDARD_BASIS =
  'GB/T 50493-2019：靠近释放源、阀组/法兰/泵组/出入口和气体易聚集处布设；轻气高位、重气低位；3D 展示锚到真实 DOM 识别建筑/罐组/塔器内。'

/** 传感器编号 → 设施归属规则（正则匹配）。 */
export const THREE_TILES_SENSOR_RULES: Array<
  [RegExp, FacilityPlacementRule]
> = [
  [/^(TK-|IR-01$|OP-01$)/, { facilityId: 'pa-west-south', pattern: 'tank' }],
  [/^(IR-02$|OP-02$)/, { facilityId: 'pb-north-tank', pattern: 'tank' }],
  [/^TW-/, { facilityId: 'tw-center', pattern: 'tower' }],
  [/^UT-/, { facilityId: 'ut-center', pattern: 'grid' }],
  [/^(WX-01$|GW-01$)/, { facilityId: 'ut-center', pattern: 'edge' }],
  [/^(PB-)/, { facilityId: 'pb-north-tank', pattern: 'grid' }],
  [/^(P2-)/, { facilityId: 'pb-mid-process', pattern: 'grid' }],
  [/^(WH-|PTZ-02$|AL-02$)/, { facilityId: 'wh-logistics', pattern: 'grid' }],
  [/^FS-/, { facilityId: 'fs-east-yard', pattern: 'grid' }],
  [/^(PTZ-01$|AL-01$)/, { facilityId: 'pa-west-north', pattern: 'edge' }],
  [/^(PA-|P1-)/, { facilityId: 'pa-west-north', pattern: 'grid' }],
]

/** 网格布设槽位（归一化坐标 [x, y]）。 */
export const FACILITY_GRID_SLOTS = [
  [0.2, 0.22],
  [0.38, 0.26],
  [0.56, 0.22],
  [0.74, 0.3],
  [0.26, 0.46],
  [0.46, 0.52],
  [0.66, 0.48],
  [0.82, 0.56],
  [0.22, 0.72],
  [0.42, 0.76],
  [0.62, 0.72],
  [0.78, 0.8],
  [0.5, 0.36],
  [0.34, 0.62],
  [0.68, 0.64],
] as const

/** 罐组布设槽位（归一化坐标 [x, y]）。 */
export const FACILITY_TANK_SLOTS = [
  [0.2, 0.22],
  [0.38, 0.22],
  [0.56, 0.26],
  [0.74, 0.28],
  [0.24, 0.48],
  [0.46, 0.5],
  [0.68, 0.5],
  [0.82, 0.46],
  [0.3, 0.74],
  [0.52, 0.76],
  [0.74, 0.72],
] as const

/** 边缘布设槽位（归一化坐标 [x, y]）。 */
export const FACILITY_EDGE_SLOTS = [
  [0.16, 0.18],
  [0.84, 0.18],
  [0.18, 0.82],
  [0.82, 0.82],
] as const

/** Three Tiles 可见设施清单（仅取展示所需字段）。 */
export const THREE_TILES_VISIBLE_FACILITIES: Record<
  string,
  Pick<MapFacility, 'id' | 'name' | 'type' | 'x' | 'y' | 'w' | 'h'>
> = {
  'pa-west-north': {
    id: 'pa-west-north',
    name: '3D西北生产装置区',
    type: 'production',
    x: 276,
    y: 250,
    w: 260,
    h: 136,
  },
  'pa-west-south': {
    id: 'pa-west-south',
    name: '3D西南储罐与泵区',
    type: 'production',
    x: 286,
    y: 250,
    w: 250,
    h: 150,
  },
  'pa-center-north': {
    id: 'pa-center-north',
    name: '3D中北厂房装置区',
    type: 'production',
    x: 500,
    y: 250,
    w: 170,
    h: 150,
  },
  'pa-center-south': {
    id: 'pa-center-south',
    name: '3D中南反应装置区',
    type: 'production',
    x: 552,
    y: 300,
    w: 175,
    h: 170,
  },
  'ut-center': {
    id: 'ut-center',
    name: '3D公用工程与管廊区',
    type: 'utility',
    x: 690,
    y: 285,
    w: 120,
    h: 190,
  },
  'tw-center': {
    id: 'tw-center',
    name: '3D塔器与罐组区',
    type: 'tower',
    x: 760,
    y: 260,
    w: 132,
    h: 220,
  },
  'pb-north-tank': {
    id: 'pb-north-tank',
    name: '3D东北罐组与管汇区',
    type: 'tank',
    x: 796,
    y: 250,
    w: 130,
    h: 170,
  },
  'pb-mid-process': {
    id: 'pb-mid-process',
    name: '3D东中生产装置区',
    type: 'production',
    x: 746,
    y: 320,
    w: 170,
    h: 185,
  },
  'wh-logistics': {
    id: 'wh-logistics',
    name: '3D东南仓储物流区',
    type: 'warehouse',
    x: 742,
    y: 346,
    w: 160,
    h: 170,
  },
  'fs-east-yard': {
    id: 'fs-east-yard',
    name: '3D应急与装卸边界区',
    type: 'utility',
    x: 668,
    y: 350,
    w: 140,
    h: 160,
  },
}

/** Three Tiles 设备锚点清单（罐/塔/厂房/管廊/泵/道路等）。 */
export const THREE_TILES_EQUIPMENT_ANCHORS: ThreeTilesEquipmentAnchor[] = [
  {
    id: 'tank-west-01',
    label: '西侧球罐组 T-01',
    kind: 'tank',
    point: { x: 326, y: 292 },
    height: 6,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'tank-west-02',
    label: '西侧球罐组 T-02',
    kind: 'tank',
    point: { x: 382, y: 292 },
    height: 6,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'tank-west-03',
    label: '西侧立罐/泵区 T-03',
    kind: 'tank',
    point: { x: 448, y: 330 },
    height: 5,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'pump-west-01',
    label: '西侧泵组与油管阀组',
    kind: 'pumpSkid',
    point: { x: 510, y: 370 },
    height: 2.4,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'pipe-main-01',
    label: '主管廊西段/油管法兰带',
    kind: 'pipeRack',
    point: { x: 555, y: 316 },
    height: 4.2,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'pipe-main-02',
    label: '主管廊中段/油管法兰带',
    kind: 'pipeRack',
    point: { x: 645, y: 338 },
    height: 4.2,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'pipe-main-03',
    label: '主管廊东段/塔器连通管线',
    kind: 'pipeRack',
    point: { x: 750, y: 392 },
    height: 4.4,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'pipe-main-04',
    label: '塔器进出料管廊/阀组',
    kind: 'pipeRack',
    point: { x: 818, y: 372 },
    height: 4.4,
    direction: { x: -1, y: 0 },
  },
  {
    id: 'pipe-main-05',
    label: '东北罐组装卸管汇/油管阀组',
    kind: 'pipeRack',
    point: { x: 876, y: 392 },
    height: 4.2,
    direction: { x: -1, y: 0 },
  },
  {
    id: 'tower-01',
    label: '中部塔器 D-01',
    kind: 'tower',
    point: { x: 770, y: 300 },
    height: 8,
    direction: { x: 0, y: 1 },
  },
  {
    id: 'tower-02',
    label: '中部塔器 D-02',
    kind: 'tower',
    point: { x: 808, y: 350 },
    height: 8,
    direction: { x: 0, y: 1 },
  },
  {
    id: 'tower-03',
    label: '东部塔器/反应器 R-01',
    kind: 'tower',
    point: { x: 850, y: 430 },
    height: 8,
    direction: { x: 0, y: 1 },
  },
  {
    id: 'tank-east-01',
    label: '东侧黑色罐组 T-07',
    kind: 'tank',
    point: { x: 828, y: 392 },
    height: 6,
    direction: { x: -1, y: 0 },
  },
  {
    id: 'tank-east-02',
    label: '东侧罐组 T-08',
    kind: 'tank',
    point: { x: 872, y: 430 },
    height: 6,
    direction: { x: -1, y: 0 },
  },
  {
    id: 'building-west-01',
    label: '西侧蓝顶厂房',
    kind: 'building',
    point: { x: 420, y: 300 },
    height: 4,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'building-center-01',
    label: '中部蓝顶厂房',
    kind: 'building',
    point: { x: 604, y: 382 },
    height: 4,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'building-east-01',
    label: '东侧蓝顶厂房',
    kind: 'building',
    point: { x: 830, y: 388 },
    height: 4,
    direction: { x: -1, y: 0 },
  },
  {
    id: 'utility-gw-01',
    label: '边缘采集柜/控制网络',
    kind: 'utility',
    point: { x: 690, y: 410 },
    height: 2,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'road-west',
    label: '西侧厂区道路',
    kind: 'road',
    point: { x: 292, y: 398 },
    height: 0.4,
    direction: { x: 0, y: 1 },
  },
  {
    id: 'road-main',
    label: '厂区主道路',
    kind: 'road',
    point: { x: 610, y: 492 },
    height: 0.4,
    direction: { x: 1, y: 0 },
  },
  {
    id: 'road-east',
    label: '东侧厂区道路',
    kind: 'road',
    point: { x: 916, y: 438 },
    height: 0.4,
    direction: { x: 0, y: 1 },
  },
]

/** 设备锚点 ID → 锚点映射。 */
export const THREE_TILES_EQUIPMENT_BY_ID = new Map(
  THREE_TILES_EQUIPMENT_ANCHORS.map((anchor) => [anchor.id, anchor]),
)

/** 路网矩形清单（用于疏散路径渲染）。 */
export const THREE_TILES_ROUTE_ROADS = [
  { id: 'route-west', x: 292, y: 256, w: 18, h: 268 },
  { id: 'route-north', x: 300, y: 246, w: 620, h: 18 },
  { id: 'route-mid', x: 320, y: 390, w: 590, h: 18 },
  { id: 'route-south', x: 315, y: 510, w: 600, h: 18 },
  { id: 'route-center', x: 675, y: 260, w: 18, h: 260 },
  { id: 'route-east', x: 910, y: 260, w: 18, h: 270 },
]

/** 路网图节点（9 宫格路口）。 */
export const THREE_TILES_ROUTE_GRAPH_NODES = [
  { id: 'nw', point: { x: 301, y: 255 } },
  { id: 'nc', point: { x: 684, y: 255 } },
  { id: 'ne', point: { x: 919, y: 255 } },
  { id: 'wm', point: { x: 301, y: 399 } },
  { id: 'cm', point: { x: 684, y: 399 } },
  { id: 'em', point: { x: 919, y: 399 } },
  { id: 'ws', point: { x: 301, y: 519 } },
  { id: 'cs', point: { x: 684, y: 519 } },
  { id: 'es', point: { x: 919, y: 519 } },
] as const

/** 路网图边（路口连通关系）。 */
export const THREE_TILES_ROUTE_GRAPH_EDGES = [
  ['nw', 'nc'],
  ['nc', 'ne'],
  ['nw', 'wm'],
  ['wm', 'ws'],
  ['wm', 'cm'],
  ['cm', 'em'],
  ['ws', 'cs'],
  ['cs', 'es'],
  ['nc', 'cm'],
  ['cm', 'cs'],
  ['ne', 'em'],
  ['em', 'es'],
] as const

/** 路段 → 图节点 ID 映射。 */
export const THREE_TILES_ROUTE_ROAD_NODE_IDS: Record<string, string[]> = {
  'route-west': ['nw', 'wm', 'ws'],
  'route-north': ['nw', 'nc', 'ne'],
  'route-mid': ['wm', 'cm', 'em'],
  'route-south': ['ws', 'cs', 'es'],
  'route-center': ['nc', 'cm', 'cs'],
  'route-east': ['ne', 'em', 'es'],
}
