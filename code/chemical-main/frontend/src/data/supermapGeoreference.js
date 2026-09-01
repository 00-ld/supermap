export const SUPERMAP_LOCAL_COORD_SYS = 'PCS_NON_EARTH_LOCAL_METER'
export const SUPERMAP_CGCS2000_COORD_SYS = 'CGCS2000_3GK_CM_114E'
export const SUPERMAP_CGCS2000_EPSG = 4547
export const SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG = 4490

// F10 修复（2026-07-19）：mapMetersPerUnit 0.5→1.0。
// 实锤：iServer 路网全量 30 个 edge 中心点 LOCALMAP↔CGCS2000 零方差反算 sE=1.0/sN=-1.0（1 unit=1m）。
// DOM 底图 assetWidthPx=3968 × metersPerAssetPixel=0.4 = 1587.2m = width，物理尺度即 1 unit=1m。
// 旧 0.5 把本地系压成一半（1587.2 units→793.6m），但路网实际跨度 1587.2m，导致路径东半部越界 rawNx>1。
// 注：A 锚点 SUPERMAP_CGCS2000_ANCHOR.projected 是经纬度手算投影值，不受 mapMetersPerUnit 影响；
// localToProjected/projectedToLocal 的映射关系随尺度修正后自洽（local 0,0 ↔ A 投影）。
export const SUPERMAP_MAP_SIZE = {
  width: 1587.2,
  height: 947.2,
  mapMetersPerUnit: 1,
}

export const ZHENGZHOU_STATION_57083 = {
  id: '57083',
  name: '郑州国家基本气象站',
  address: '郑州市二七区连云路 68 号',
  longitude: 113.6650,
  latitude: 34.7178,
  altitude: 108.0,
  geographicEpsg: 4490,
}

// 三维展示唯一锚点：直接取已发布 huangong_4490 S3M config 的插入点。
// 4490 是持久化/展示口径；此处 projected 只供受控 4547 米制分析适配层使用。
// 路网历史数据仍有独立 D 锚点，必须先经 local 桥接，不能直接混入三维展示。
export const SUPERMAP_CGCS2000_ANCHOR = {
  local: { x: 0, y: 0 },
  projected: { easting: 457527.93, northing: 3854574.9 },
  wgs84: {
    longitude: 113.535771,
    latitude: 34.818673,
  },
  altitude: 8.0,
  label: '化工园区已配准 S3M 锚点（EPSG:4490，113.535771,34.818673）',
}

export const SUPERMAP_CGCS2000_TRANSFORM = {
  sourceCoordSys: SUPERMAP_LOCAL_COORD_SYS,
  targetCoordSys: SUPERMAP_CGCS2000_COORD_SYS,
  targetEpsg: SUPERMAP_CGCS2000_EPSG,
  geographicEpsg: SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
  anchorLocal: SUPERMAP_CGCS2000_ANCHOR.local,
  anchorProjected: SUPERMAP_CGCS2000_ANCHOR.projected,
  anchorWgs84: SUPERMAP_CGCS2000_ANCHOR.wgs84,
  rotationDegrees: 0,
  scale: 1,
  xAxis: 'east',
  yAxis: 'south',
}

export const SUPERMAP_CGCS2000_CONTROL_POINTS = [
  controlPoint('CP0', '3D Tiles 模型锚点 A', 0, 0, '场景原点 = 化工园区 3D Tiles 模型锚点 (113.569463,34.76965)'),
  controlPoint('CP1', '北侧入口', 1218, 230, '控制南北方向比例'),
  controlPoint('CP2', '西侧入口', 238, 235, '控制东西方向比例'),
  controlPoint('CP3', '东侧入口', 1228, 684, '校核入口近邻位置'),
  controlPoint('CP4', '西北角', 0, 0, '校核整体包络'),
  controlPoint('CP5', '东南角', 1587.2, 947.2, '校核整体包络'),
]

function controlPoint(id, name, x, y, usage) {
  const projected = localToProjected(x, y)
  const wgs84 = localToWgs84(x, y)
  return {
    id,
    name,
    usage,
    local: { x, y },
    projected,
    wgs84,
  }
}

export function localToProjected(x, y) {
  const metersX = (Number(x) - SUPERMAP_CGCS2000_ANCHOR.local.x) * SUPERMAP_MAP_SIZE.mapMetersPerUnit
  const metersY = (Number(y) - SUPERMAP_CGCS2000_ANCHOR.local.y) * SUPERMAP_MAP_SIZE.mapMetersPerUnit
  return {
    easting: round(SUPERMAP_CGCS2000_ANCHOR.projected.easting + metersX),
    northing: round(SUPERMAP_CGCS2000_ANCHOR.projected.northing - metersY),
  }
}

export function projectedToLocal(easting, northing) {
  return {
    x: round((Number(easting) - SUPERMAP_CGCS2000_ANCHOR.projected.easting) / SUPERMAP_MAP_SIZE.mapMetersPerUnit
      + SUPERMAP_CGCS2000_ANCHOR.local.x),
    y: round((SUPERMAP_CGCS2000_ANCHOR.projected.northing - Number(northing)) / SUPERMAP_MAP_SIZE.mapMetersPerUnit
      + SUPERMAP_CGCS2000_ANCHOR.local.y),
  }
}

export function localToWgs84(x, y, altitude = 0) {
  const projected = localToProjected(x, y)
  return projectedToWgs84(projected.easting, projected.northing, altitude)
}

export function projectedToWgs84(easting, northing, altitude = 0) {
  const dx = Number(easting) - SUPERMAP_CGCS2000_ANCHOR.projected.easting
  const dy = Number(northing) - SUPERMAP_CGCS2000_ANCHOR.projected.northing
  const latitude = SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude + dy / 111320
  const longitude = SUPERMAP_CGCS2000_ANCHOR.wgs84.longitude
    + dx / (111320 * Math.cos(SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude * Math.PI / 180))
  return {
    longitude: Number(longitude.toFixed(8)),
    latitude: Number(latitude.toFixed(8)),
    altitude: round(SUPERMAP_CGCS2000_ANCHOR.altitude + altitude, 2),
  }
}

export function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits))
}

// =============================================================================
// F2 双锚点转换（2026-07-18，路 B 方案）
// =============================================================================
// 背景：iServer 路网数据集锚定在 D（HAUT 莲花南门 113.539/34.832，投影 457752/3856009 系），
// 但 3D Tiles 模型锚在 A（113.569463/34.76965，投影 460587.110/3849122.673），差 7.4km。
// iServer 数据服务不可在线编辑（PUT 405），重发布需 iDesktopX（codex 额度）。
// 路 B：iServer 链路发 D 锚点投影坐标 → iServer 返回 D 系 path → D 锚点逆变换回本地系
//      → A 锚点正变换落三维模型。本地系（0~1587，0.5 m/unit）作桥梁，与 realMapAssets 同源。
// 数值验证：iServer path(457752,3856009) → D逆 → 本地(119,236)[=iServer LOCALMAP字段值] → A正 → A投影(460646,3849004)。
// 详见 docs/f1-f2-investigation/09-f2-decision-final-and-iserver-republish-spec.md 第 8 节。
// =============================================================================

// D 锚点：iServer 数据集真实锚点。
// F10 修正（2026-07-19）：用 edge-01 **中心点** LOCALMAP(119,236) ↔ CGCS2000(457871.343,3856009.172)
// + mapMetersPerUnit=1.0 重算：anchor_e = 457871.343 - 119×1.0 = 457752.343,
// anchor_n = 3856009.172 + 236×1.0 = 3856245.172（Y 向南：northing = anchor_n - 1.0×y）。
// 旧值 (457692.843, 3856127.172) 是 0.5 尺度下的反算，用 edge 端点 457752.343 凑出，碰巧满足 0.5 公式
// 但中心点 457871.343 用 0.5 算不出（需 1.5），故旧锚点在 0.5 体系下只对端点不对中心。
// 验证：localToProjectedD(119,236) = (457752.343+119, 3856245.172-236) = (457871.343, 3856009.172) ✅
// 全量 30 edge 中心点零方差确认 sE=1.0/sN=-1.0。
export const SUPERMAP_ISERVER_DATA_ANCHOR = {
  local: { x: 0, y: 0 },
  projected: { easting: 457752.343, northing: 3856245.172 },
  wgs84: { longitude: 113.53946126, latitude: 34.83164647 },
  label: 'iServer 数据集真实锚点 D（HAUT 莲花南门 CP0，F10 1.0 尺度重算）',
}

// D 锚点投影 → 本地系（iServer path 逆变换用）
// 与 projectedToLocal 同构，但用 D 锚点。Y 轴向南（northing 减小 = y 增大）。
export function projectedToLocalD(easting, northing) {
  return {
    x: round((Number(easting) - SUPERMAP_ISERVER_DATA_ANCHOR.projected.easting) / SUPERMAP_MAP_SIZE.mapMetersPerUnit
      + SUPERMAP_ISERVER_DATA_ANCHOR.local.x),
    y: round((SUPERMAP_ISERVER_DATA_ANCHOR.projected.northing - Number(northing)) / SUPERMAP_MAP_SIZE.mapMetersPerUnit
      + SUPERMAP_ISERVER_DATA_ANCHOR.local.y),
  }
}

// 本地系 → D 锚点投影（iServer 请求起点正变换用）
export function localToProjectedD(x, y) {
  const metersX = (Number(x) - SUPERMAP_ISERVER_DATA_ANCHOR.local.x) * SUPERMAP_MAP_SIZE.mapMetersPerUnit
  const metersY = (Number(y) - SUPERMAP_ISERVER_DATA_ANCHOR.local.y) * SUPERMAP_MAP_SIZE.mapMetersPerUnit
  return {
    easting: round(SUPERMAP_ISERVER_DATA_ANCHOR.projected.easting + metersX),
    northing: round(SUPERMAP_ISERVER_DATA_ANCHOR.projected.northing - metersY),
  }
}

// =============================================================================
// F11 算法坐标系（2026-08-01，B 套模型绑定点位迁移）
// =============================================================================
// 背景：算法点位由 DOM 底图系（A 套，0~1587×0~947）切换为 iServer MonitorPoints_4490
// 模型绑定点位（B 套，DevicePoint_2D.geojson 的 Wgs84 经纬高）。B 套 887 个气体点位
// 换算到 A 锚点 ENU 后分布在 east∈[-65.7,878.6]、north∈[-83.2,403.1]——模型真实位置，
// 与 DOM 底图系存在约 300~1000m 错位（A 套点位"跑出模型"的根源）。
// 定义算法坐标系 = 模型 ENU + 平移（X=east+80, Y=-north+420），使 B 套点位全部落在
// 正坐标网格（0~1000 × 0~540）内；泄漏源（spatial-assets.4490.json 模型 ENU 锚点）
// 经同一变换进网格。B 套点位三维显示仍用 Wgs84 原值（零偏差），算法 overlay 经
// algorithmToLocal 逆变换回模型位置。diffusion/particle-filter payload 的
// map.width=1000/map.height=540/mapMetersPerUnit=1 与 ALGORITHM_FRAME 必须同步。
export const ALGORITHM_FRAME = {
  offsetX: 80,
  offsetY: 420,
  width: 1000,
  height: 540,
  label: '模型系算法坐标（ENU+平移，B 套 MonitorPoints 基准）',
}

export function wgs84ToEnu(longitude, latitude) {
  const dx = Number(longitude) - SUPERMAP_CGCS2000_ANCHOR.wgs84.longitude
  const dy = Number(latitude) - SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude
  return {
    east: dx * 111320 * Math.cos(SUPERMAP_CGCS2000_ANCHOR.wgs84.latitude * Math.PI / 180),
    north: dy * 111320,
  }
}

export function enuToAlgorithm(east, north) {
  return {
    x: round(Number(east) + ALGORITHM_FRAME.offsetX),
    y: round(-Number(north) + ALGORITHM_FRAME.offsetY),
  }
}

export function wgs84ToAlgorithmPoint(longitude, latitude) {
  const { east, north } = wgs84ToEnu(longitude, latitude)
  return enuToAlgorithm(east, north)
}

// 算法系 → 底图系 local（2D 底图/三维 A 锚点换算的逆变换）。
// 接收点对象 {x,y}（与 wgs84ToAlgorithmPoint 等对象化调用保持一致）。
export function algorithmToLocal(point) {
  return {
    x: round(Number(point.x) - ALGORITHM_FRAME.offsetX),
    y: round(Number(point.y) - ALGORITHM_FRAME.offsetY),
  }
}

// 底图系 local → 算法系（兼容旧数据/分析框换算）
export function localToAlgorithm(x, y) {
  return {
    x: round(Number(x) + ALGORITHM_FRAME.offsetX),
    y: round(-Number(y) + ALGORITHM_FRAME.offsetY),
  }
}
