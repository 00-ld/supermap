export const zones = [
  { id: 'admin', name: '行政办公区', color: '#7a6a55', tag: '办公', status: '正常' },
  { id: 'prod_a', name: '化工生产一区', color: '#5a7a6a', tag: '生产', status: '运行中' },
  { id: 'prod_b', name: '精细化工厂房', color: '#5a7a6a', tag: '生产', status: '运行中' },
  { id: 'tank_farm', name: '储罐区', color: '#6b7fa3', tag: '储运', status: '告警', key: true },
  { id: 'utility', name: '公用工程区', color: '#5a6a7a', tag: '辅助', status: '正常' },
  { id: 'warehouse', name: '仓储物流区', color: '#6a6a5a', tag: '仓储', status: '正常' },
  { id: 'treatment', name: '污水处理区', color: '#4a6a7a', tag: '环保', status: '正常' },
  { id: 'tower_area', name: '塔器区', color: '#8a6a8a', tag: '核心', status: '运行中', key: true },
  { id: 'prod_b2', name: '化工生产二区', color: '#5a7a6a', tag: '生产', status: '运行中', key: true },
  { id: 'greenbelt', name: '绿化隔离带', color: '#4a8a5a', tag: '环保', status: '正常' },
  { id: 'monitoring', name: '环境监测区', color: '#5a8a7a', tag: '监测', status: '正常' },
  { id: 'fire_safety', name: '消防设施区', color: '#a05a4a', tag: '消防', status: '正常', key: true },
  { id: 'central_control', name: '中央控制区', color: '#5a6a8a', tag: '管控', status: '运行中', key: true },
  { id: 'maintenance', name: '机修维护区', color: '#6a6a5a', tag: '辅助', status: '正常' },
]

/**
 * 设施列表
 * hazardLevel: 物料危险等级（0~1），影响风险计算和传感器布点优先级
 *   - 液氨等高毒物质: 0.90~1.00
 *   - 甲烷 / CO 等可燃有毒: 0.70~0.85
 *   - 一般化工原料: 0.40~0.60
 *   - 办公 / 辅助设施: 0.10~0.25
 */
export const facilities = [
  { id:'b01', name:'综合办公楼', type:'office', x:120, y:80, w:100, h:50, zone:'admin', status:'正常', area:'5200m²', floors:6, personnel:180, desc:'园区行政管理中心', hazardLevel:0.15 },
  { id:'b02', name:'研发中心', type:'office', x:120, y:150, w:70, h:40, zone:'admin', status:'正常', area:'2800m²', floors:4, personnel:65, desc:'新产品研发与测试实验室', hazardLevel:0.15 },
  { id:'b03', name:'食堂', type:'office', x:220, y:100, w:50, h:35, zone:'admin', status:'正常', area:'1500m²', floors:2, personnel:30, desc:'员工餐饮服务', hazardLevel:0.10 },
  { id:'b04', name:'消防站', type:'office', x:220, y:155, w:40, h:30, zone:'admin', status:'正常', area:'1200m²', floors:1, personnel:24, desc:'园区消防应急中心', hazardLevel:0.10 },
  { id:'b05', name:'聚合车间', type:'production', x:380, y:60, w:110, h:55, zone:'prod_a', status:'运行中', area:'6800m²', floors:1, personnel:45, desc:'高分子聚合反应生产线', hazardLevel:0.65 },
  { id:'b06', name:'裂解车间', type:'production', x:380, y:135, w:80, h:50, zone:'prod_a', status:'运行中', area:'4200m²', floors:1, personnel:35, desc:'催化裂解生产装置', hazardLevel:0.70 },
  { id:'b07', name:'压缩机房', type:'production', x:490, y:70, w:55, h:40, zone:'prod_a', status:'运行中', area:'2100m²', floors:1, personnel:12, desc:'气体压缩与输送系统', hazardLevel:0.75 },
  { id:'b08', name:'控制室', type:'production', x:490, y:130, w:55, h:35, zone:'prod_a', status:'运行中', area:'1800m²', floors:2, personnel:20, desc:'DCS集散控制系统中心', hazardLevel:0.20 },
  { id:'b09', name:'配料间', type:'production', x:565, y:65, w:45, h:35, zone:'prod_a', status:'正常', area:'1500m²', floors:1, personnel:8, desc:'原料配比与预处理', hazardLevel:0.55 },
  { id:'b10', name:'精制车间', type:'production', x:705, y:70, w:95, h:50, zone:'prod_b', status:'运行中', area:'5500m²', floors:1, personnel:38, desc:'产品精制与提纯生产线', hazardLevel:0.60 },
  { id:'b11', name:'合成车间', type:'production', x:700, y:140, w:75, h:45, zone:'prod_b', status:'运行中', area:'3600m²', floors:1, personnel:28, desc:'精细化学品合成装置', hazardLevel:0.65 },
  { id:'b12', name:'干燥车间', type:'production', x:810, y:75, w:60, h:40, zone:'prod_b', status:'维护中', area:'2400m²', floors:1, personnel:5, desc:'产品干燥与包装工段', hazardLevel:0.40 },
  { id:'b13', name:'分析化验室', type:'production', x:810, y:135, w:60, h:35, zone:'prod_b', status:'正常', area:'1800m²', floors:2, personnel:15, desc:'产品质量检测分析', hazardLevel:0.25 },
  { id:'t01', name:'T-01 原油储罐', type:'tank', x:100, y:300, r:28, zone:'tank_farm', status:'正常', capacity:'5000m³', material:'原油', level:72, temp:35.2, desc:'原油中间存储', hazardLevel:0.55 },
  { id:'t02', name:'T-02 溶剂储罐', type:'tank', x:170, y:290, r:24, zone:'tank_farm', status:'正常', capacity:'3000m³', material:'甲苯', level:55, temp:28.1, desc:'有机溶剂存储', hazardLevel:0.65 },
  { id:'t03', name:'T-03 成品储罐', type:'tank', x:240, y:300, r:30, zone:'tank_farm', status:'告警', capacity:'8000m³', material:'成品油', level:88, temp:87.3, desc:'成品油出厂存储', hazardLevel:0.50 },
  { id:'t04', name:'T-04 酸液储罐', type:'tank', x:100, y:380, r:22, zone:'tank_farm', status:'正常', capacity:'2000m³', material:'硫酸', level:40, temp:25.6, desc:'浓硫酸安全存储', hazardLevel:0.60 },
  { id:'t05', name:'T-05 碱液储罐', type:'tank', x:170, y:385, r:22, zone:'tank_farm', status:'正常', capacity:'2000m³', material:'NaOH', level:35, temp:26.8, desc:'液碱安全存储', hazardLevel:0.50 },
  { id:'t06', name:'T-06 中间体罐', type:'tank', x:240, y:380, r:20, zone:'tank_farm', status:'正常', capacity:'1500m³', material:'中间体A', level:60, temp:42.1, desc:'反应中间体暂存', hazardLevel:0.50 },
  { id:'t07', name:'T-07 氨气储罐', type:'tank', x:300, y:310, r:18, zone:'tank_farm', status:'正常', capacity:'500m³', material:'液氨', level:80, temp:-33.4, desc:'液氨安全储存与供应', hazardLevel:1.00 },
  { id:'t08', name:'T-08 氨气备用储罐', type:'tank', x:300, y:380, r:25, zone:'tank_farm', status:'正常', capacity:'4000m³', material:'氨气', level:62, temp:18.5, desc:'氨气备用存储与应急调峰', hazardLevel:0.95 },
  { id:'tw01', name:'蒸馏塔 D-01', type:'tower', x:470, y:280, r:14, h:70, zone:'tower_area', status:'运行中', height:'45m', pressure:'2.1MPa', temp:185, desc:'常压蒸馏分离塔', hazardLevel:0.60 },
  { id:'tw02', name:'精馏塔 D-02', type:'tower', x:520, y:290, r:12, h:60, zone:'tower_area', status:'运行中', height:'38m', pressure:'1.8MPa', temp:165, desc:'精密精馏提纯塔', hazardLevel:0.60 },
  { id:'tw03', name:'吸收塔 A-01', type:'tower', x:570, y:280, r:13, h:55, zone:'tower_area', status:'运行中', height:'32m', pressure:'1.5MPa', temp:95, desc:'气体吸收净化塔', hazardLevel:0.70 },
  { id:'tw04', name:'反应塔 R-01', type:'tower', x:470, y:370, r:15, h:65, zone:'tower_area', status:'运行中', height:'42m', pressure:'3.2MPa', temp:220, desc:'催化反应核心塔', hazardLevel:0.80 },
  { id:'tw05', name:'脱硫塔 S-01', type:'tower', x:530, y:375, r:11, h:45, zone:'tower_area', status:'运行中', height:'28m', pressure:'0.8MPa', temp:65, desc:'烟气脱硫处理塔', hazardLevel:0.60 },
  { id:'tw06', name:'再生塔 RG-01', type:'tower', x:580, y:365, r:12, h:50, zone:'tower_area', status:'运行中', height:'35m', pressure:'1.2MPa', temp:130, desc:'溶剂再生回收塔', hazardLevel:0.50 },
  { id:'tw07', name:'萃取塔 E-01', type:'tower', x:640, y:280, r:11, h:40, zone:'tower_area', status:'维护中', height:'25m', pressure:'0.5MPa', temp:55, desc:'液液萃取分离塔', hazardLevel:0.55 },
  { id:'tw08', name:'干燥塔 DR-01', type:'tower', x:640, y:370, r:10, h:35, zone:'tower_area', status:'正常', height:'22m', pressure:'0.3MPa', temp:80, desc:'气体干燥脱水塔', hazardLevel:0.40 },
  { id:'b14', name:'锅炉房', type:'utility', x:430, y:452, w:70, h:45, zone:'utility', status:'运行中', area:'3200m²', power:'35t/h', desc:'蒸汽供应中心', hazardLevel:0.35 },
  { id:'b15', name:'变电站', type:'utility', x:520, y:452, w:50, h:40, zone:'utility', status:'正常', area:'2000m²', power:'110kV', desc:'园区主变配电站', hazardLevel:0.20 },
  { id:'b16', name:'循环水站', type:'utility', x:590, y:450, w:55, h:35, zone:'utility', status:'运行中', area:'1800m²', flow:'8000m³/h', desc:'冷却循环水系统', hazardLevel:0.15 },
  { id:'b17', name:'空压站', type:'utility', x:430, y:510, w:50, h:30, zone:'utility', status:'运行中', area:'1200m²', power:'40Nm³/min', desc:'仪表与工厂空气供应', hazardLevel:0.20 },
  { id:'b18', name:'氧气制备站', type:'utility', x:510, y:510, w:45, h:30, zone:'utility', status:'正常', area:'1000m²', power:'500Nm³/h', desc:'工业氧气分离制备与输送', hazardLevel:0.45 },
  { id:'b19', name:'火炬系统', type:'utility', x:580, y:510, w:40, h:30, zone:'utility', status:'待机', area:'800m²', height:'60m', desc:'安全放空燃烧系统', hazardLevel:0.50 },
  { id:'b20', name:'甲烷储配库', type:'warehouse', x:712, y:452, w:90, h:45, zone:'warehouse', status:'正常', area:'4800m²', capacity:'2000t', desc:'甲烷原料储存与调配', hazardLevel:0.80 },
  { id:'b21', name:'原料仓库B', type:'warehouse', x:712, y:510, w:70, h:40, zone:'warehouse', status:'正常', area:'3200m²', capacity:'1500t', desc:'辅助原料存储', hazardLevel:0.40 },
  { id:'b22', name:'成品仓库', type:'warehouse', x:812, y:452, w:80, h:50, zone:'warehouse', status:'正常', area:'4500m²', capacity:'1800t', desc:'成品暂存与发货', hazardLevel:0.30 },
  { id:'b23', name:'一氧化碳钢瓶库', type:'warehouse', x:812, y:520, w:55, h:35, zone:'warehouse', status:'正常', area:'1800m²', capacity:'200t', desc:'一氧化碳钢瓶专用存储区', key:true, hazardLevel:0.85 },
  { id:'b24', name:'装卸站台', type:'warehouse', x:892, y:460, w:30, h:80, zone:'warehouse', status:'运行中', area:'2400m²', bays:8, desc:'货物装卸与物流发运', hazardLevel:0.45 },
  { id:'b25', name:'调节池', type:'treatment', x:80, y:510, w:80, h:35, zone:'treatment', status:'运行中', volume:'3000m³', desc:'废水均质调节', hazardLevel:0.30 },
  { id:'b26', name:'生化池', type:'treatment', x:180, y:505, w:90, h:40, zone:'treatment', status:'运行中', volume:'5000m³', desc:'活性污泥生化处理', hazardLevel:0.25 },
  { id:'b27', name:'深度处理间', type:'treatment', x:80, y:570, w:70, h:30, zone:'treatment', status:'运行中', area:'2100m²', desc:'膜过滤与高级氧化', hazardLevel:0.20 },
  { id:'b28', name:'污泥脱水间', type:'treatment', x:180, y:565, w:55, h:30, zone:'treatment', status:'正常', area:'1500m²', desc:'污泥浓缩脱水处理', hazardLevel:0.20 },
  { id:'b33', name:'反应车间B', type:'production', x:700, y:260, w:90, h:50, zone:'prod_b2', status:'运行中', area:'4500m²', personnel:35, desc:'二次反应与聚合生产线', hazardLevel:0.65 },
  { id:'b34', name:'分离纯化车间', type:'production', x:820, y:260, w:80, h:50, zone:'prod_b2', status:'运行中', area:'4000m²', personnel:30, desc:'产品分离与纯化精制', hazardLevel:0.55 },
  { id:'b35', name:'配料混合车间', type:'production', x:700, y:340, w:80, h:45, zone:'prod_b2', status:'正常', area:'3600m²', personnel:20, desc:'原料配料与混合预处理', hazardLevel:0.50 },
  { id:'b36', name:'质检包装车间', type:'production', x:820, y:340, w:80, h:45, zone:'prod_b2', status:'正常', area:'3600m²', personnel:18, desc:'成品质量检测与包装入库', hazardLevel:0.30 },
  { id:'b30', name:'消防水泵房', type:'utility', x:350, y:452, w:60, h:40, zone:'fire_safety', status:'运行中', area:'2400m²', power:'双电源供电', desc:'消防主泵/稳压泵/柴油泵+1800m³消防水池(GB50160 8.3)', hazardLevel:0.25 },
  { id:'b31', name:'机修间', type:'utility', x:740, y:190, w:75, h:35, zone:'maintenance', status:'正常', area:'2625m²', desc:'设备维修保养与备品备件库(GB50489 5.3)', hazardLevel:0.30 },
  { id:'b32', name:'绿化隔离带', type:'utility', x:300, y:575, w:370, h:25, zone:'greenbelt', status:'正常', area:'9250m²', desc:'园区南侧安全绿化隔离带(GB50160 4.2.11)', hazardLevel:0.05 },
  { id:'b37', name:'环境空气质量监测站', type:'utility', x:750, y:570, w:70, h:30, zone:'monitoring', status:'正常', area:'2100m²', personnel:8, desc:'园区环境空气质量监测与预警中心(HJ664)', hazardLevel:0.10 },
]

export const facilityById = new Map(facilities.map(facility => [facility.id, facility]))

export const pipes = [
  { id:'p01', name:'原油主管线', from:[100,328], to:[380,135], status:'运行中', medium:'原油', diameter:'DN300' },
  { id:'p02', name:'溶剂管线', from:[170,314], to:[380,160], status:'运行中', medium:'甲苯', diameter:'DN200' },
  { id:'p03', name:'成品输出管线', from:[270,300], to:[700,95], status:'运行中', medium:'成品油', diameter:'DN250' },
  { id:'p04', name:'蒸汽主管线', from:[465,440], to:[380,190], status:'运行中', medium:'蒸汽', diameter:'DN200' },
  { id:'p05', name:'蒸汽至塔器', from:[465,440], to:[470,350], status:'运行中', medium:'蒸汽', diameter:'DN150' },
  { id:'p06', name:'氮气供应管线', from:[300,310], to:[470,280], status:'运行中', medium:'氮气', diameter:'DN100' },
  { id:'p07', name:'循环水管线', from:[618,450], to:[470,350], status:'运行中', medium:'冷却水', diameter:'DN250' },
  { id:'p08', name:'废水排放管线', from:[240,380], to:[160,505], status:'运行中', medium:'废水', diameter:'DN200' },
  { id:'p09', name:'LPG输送管线', from:[325,380], to:[712,460], status:'运行中', medium:'LPG', diameter:'DN150' },
]

export const keyAreas = [
  { id:'ka1', name:'储罐区', x:70, y:260, w:280, h:160 },
  { id:'ka2', name:'塔器区', x:440, y:250, w:230, h:160 },
  { id:'ka3', name:'危化品库', x:797, y:510, w:75, h:55 },
  { id:'ka4', name:'裂解车间', x:370, y:120, w:100, h:75 },
  { id:'ka5', name:'反应塔区', x:530, y:340, w:95, h:75 },
]

export const roads = [
  { x:30, y:230, w:940, h:22, main:true },
  { x:30, y:425, w:940, h:22, main:true },
  { x:330, y:40, w:22, h:580, main:true },
  { x:680, y:40, w:22, h:580, main:true },
  { x:60, y:40, w:15, h:600, main:false },
  { x:950, y:40, w:15, h:600, main:false },
  { x:60, y:40, w:900, h:12, main:false },
  { x:60, y:600, w:900, h:12, main:false },
  { x:450, y:230, w:12, h:195, main:false },
  { x:780, y:230, w:12, h:195, main:false },
  { x:330, y:330, w:350, h:10, main:false },
  { x:60, y:480, w:270, h:10, main:false },
]

export const stats = [
  { filter:'all', value:47, label:'设施总数', color:'var(--accent)' },
  { filter:'building', value:18, label:'建筑', color:'' },
  { filter:'tank', value:12, label:'储罐', color:'' },
  { filter:'tower', value:8, label:'塔器', color:'' },
  { filter:'pipe', value:9, label:'管道段', color:'' },
  { filter:'key', value:5, label:'重点区域', color:'var(--info)' },
]

export const legends = [
  { type:'production', label:'生产厂房', shape:'', style:'background:#5a7a6a;' },
  { type:'office', label:'办公建筑', shape:'', style:'background:#7a6a55;' },
  { type:'tank', label:'储罐', shape:'circle', style:'background:#6b7fa3;' },
  { type:'tower', label:'塔器', shape:'', style:'background:#8a6a8a;border-radius:50% 50% 2px 2px;width:12px;height:16px;' },
  { type:'pipe', label:'管道', shape:'line', style:'background:#8899aa;' },
  { type:'road', label:'道路', shape:'', style:'background:#3a4255;' },
  { type:'key-area', label:'重点区域', shape:'', style:'background:rgba(56,189,248,0.25);border:1px dashed #38bdf8;' },
]

export const alerts = [
  { type:'error', icon:'fas fa-exclamation', text:'储罐区T-03温度超限 (87.3℃)', time:'2 分钟前' },
  { type:'warn', icon:'fas fa-triangle-exclamation', text:'精制车间管道压力异常', time:'15 分钟前' },
  { type:'info', icon:'fas fa-info', text:'公用工程区巡检已完成', time:'1 小时前' },
]

export const BUILDING_TYPES_WITH_ENTRANCES = ['office', 'production', 'utility', 'warehouse', 'treatment']

export const parkEntrances = [
  { id: 'park-west', kind: 'park', edge: 'left', x: 36, y: 241, label: '西侧主入口', tooltipSide: 'right' },
  { id: 'park-north', kind: 'park', edge: 'top', x: 341, y: 36, label: '北侧行政入口', tooltipSide: 'bottom' },
  { id: 'park-east', kind: 'park', edge: 'right', x: 984, y: 436, label: '东侧物流入口', tooltipSide: 'left' },
  { id: 'park-south', kind: 'park', edge: 'bottom', x: 691, y: 606, label: '南侧工程入口', tooltipSide: 'top' },
]

export const buildingEntrances = facilities
  .filter(facility => BUILDING_TYPES_WITH_ENTRANCES.includes(facility.type))
  .map((facility, index) => {
    const edge = facility.x + facility.w / 2 < 520 ? 'left' : 'right'
    const yOffset = 10 + (index % 3) * 8
    return {
      id: `building-${facility.id}`,
      kind: 'building',
      edge,
      parentId: facility.id,
      x: edge === 'left' ? facility.x - 8 : facility.x + facility.w + 8,
      y: facility.y + Math.min(facility.h - 9, yOffset),
      label: `${facility.name} 1号门`,
      tooltipSide: edge === 'left' ? 'right' : 'left',
    }
  })

export {
  defaultSensorDevice,
  getSensorDevice,
  getSensorZonePrefix,
  sensorDeviceMap,
  sensorTypes,
} from './sensorCatalog'

function deterministicUnit(index, salt) {
  const raw = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return raw - Math.floor(raw)
}

export const groundSpeckles = Array.from({ length: 200 }, (_, index) => ({
  id: index,
  x: 30 + deterministicUnit(index, 1) * 960,
  y: 30 + deterministicUnit(index, 2) * 600,
  r: 2 + deterministicUnit(index, 3) * 4,
}))

export function getFacilityAnchorPoint(facility) {
  if (!facility) return null
  if (facility.type === 'tank' || facility.type === 'tower') {
    return { x: facility.x, y: facility.y }
  }
  return {
    x: facility.x + (facility.w || 0) / 2,
    y: facility.y + (facility.h || 0) / 2,
  }
}
