/**
 * 超图三维场景纯数学工具集。
 *
 * 从 SuperMapSceneViewer.vue 抽离的零依赖纯函数：
 * - 大地坐标 ↔ ECEF 直角坐标转换
 * - 经纬度 → 投影近似（CGCS2000 4490 局部切平面）
 * - 通用数值/字符串/属性工具
 *
 * 设计原则：所有函数均为纯函数，不依赖 Vue 响应式状态、
 * SuperMap 运行时（viewer/scene）或组件内部常量。
 *
 * 仅 geoToProjectedApprox 依赖外部常量 GEO_REFERENCE（来自 @/data/coordinate），
 * 该常量为静态地理参考锚点，本身也是纯数据。
 */

import { GEO_REFERENCE } from '@/data/coordinate'

/** WGS84 椭球体半长轴（米）。 */
const SEMI_MAJOR_AXIS = 6378137.0
/** WGS84 第一偏心率平方。 */
const ECCENTRICITY_SQUARED = 6.69437999014e-3
/** 每纬度对应的米数（近似）。 */
const METERS_PER_DEGREE_LATITUDE = 111320

/** 三维向量（ECEF 或局部直角坐标）。 */
export interface Vector3 {
  x: number
  y: number
  z: number
}

/** 地理坐标（经纬高 + 投影近似）。 */
export interface GeoPoint {
  longitude: number
  latitude: number
  altitude: number
  easting: number
  northing: number
  projectedEpsg: 4490
}

/**
 * ECEF 直角坐标 → WGS84 经纬高 + 投影近似。
 *
 * 使用 Bowring 闭环迭代 8 次求解大地纬度，精度满足园区级可视化需求。
 * 与 geoToEcef 互逆。
 */
export function ecefToGeo(x: number, y: number, z: number): GeoPoint {
  const longitude = Math.atan2(y, x)
  const p = Math.sqrt(x * x + y * y)
  let latitude = Math.atan2(z, p * (1 - ECCENTRICITY_SQUARED))
  let height = 0
  for (let index = 0; index < 8; index += 1) {
    const sinLatitude = Math.sin(latitude)
    const primeVertical =
      SEMI_MAJOR_AXIS /
      Math.sqrt(1 - ECCENTRICITY_SQUARED * sinLatitude * sinLatitude)
    height = p / Math.cos(latitude) - primeVertical
    latitude = Math.atan2(
      z,
      p *
        (1 - (ECCENTRICITY_SQUARED * primeVertical) / (primeVertical + height)),
    )
  }
  const sinLatitude = Math.sin(latitude)
  const primeVertical =
    SEMI_MAJOR_AXIS /
    Math.sqrt(1 - ECCENTRICITY_SQUARED * sinLatitude * sinLatitude)
  height = p / Math.cos(latitude) - primeVertical
  const projected = geoToProjectedApprox(
    (longitude * 180) / Math.PI,
    (latitude * 180) / Math.PI,
  )
  return {
    longitude: Number(((longitude * 180) / Math.PI).toFixed(8)),
    latitude: Number(((latitude * 180) / Math.PI).toFixed(8)),
    altitude: Number(height.toFixed(2)),
    easting: projected.easting,
    northing: projected.northing,
    projectedEpsg: 4490,
  }
}

/**
 * WGS84 经纬高 → ECEF 直角坐标。
 *
 * F11 监控点高度修复（2026-07-20）：与 ecefToGeo 互逆，
 * 用于已知经纬度后用锚点地表高度重构贴地 ECEF。
 */
export function geoToEcef(
  longitude: number,
  latitude: number,
  altitude: number,
): Vector3 {
  const longitudeRad = (longitude * Math.PI) / 180
  const latitudeRad = (latitude * Math.PI) / 180
  const sinLatitude = Math.sin(latitudeRad)
  const primeVertical =
    SEMI_MAJOR_AXIS /
    Math.sqrt(1 - ECCENTRICITY_SQUARED * sinLatitude * sinLatitude)
  const cosLatitude = Math.cos(latitudeRad)
  return {
    x: (primeVertical + altitude) * cosLatitude * Math.cos(longitudeRad),
    y: (primeVertical + altitude) * cosLatitude * Math.sin(longitudeRad),
    z: (primeVertical * (1 - ECCENTRICITY_SQUARED) + altitude) * sinLatitude,
  }
}

/**
 * 经纬度 → 局部投影近似（CGCS2000 4490 切平面）。
 *
 * 以 GEO_REFERENCE 锚点为原点，按经纬度差乘以每度米数近似求 easting/northing。
 * 适用于园区级（数公里范围内）可视化，非高精度测量。
 */
export function geoToProjectedApprox(
  longitude: number,
  latitude: number,
): { easting: number; northing: number } {
  const anchor = GEO_REFERENCE
  const anchorProjected = anchor.anchorProjected as {
    easting: number
    northing: number
  }
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LATITUDE *
    Math.cos((Number(anchor.originLatitude) * Math.PI) / 180)
  return {
    easting: Number(
      (
        anchorProjected.easting +
        (longitude - Number(anchor.originLongitude)) * metersPerDegreeLongitude
      ).toFixed(3),
    ),
    northing: Number(
      (
        anchorProjected.northing +
        (latitude - Number(anchor.originLatitude)) * METERS_PER_DEGREE_LATITUDE
      ).toFixed(3),
    ),
  }
}

/** 数值夹紧到 [min, max] 区间。 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * 生成传感器标记用的 SVG data URI。
 *
 * 输出 96×96 圆形标记，含双圈与文字标签，作为实体 billboard 图标。
 */
export function markerSvgDataUri(color: string, label: string): string {
  const safeColor = encodeURIComponent(color)
  const safeLabel = encodeURIComponent(label)
  return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Ccircle cx='48' cy='48' r='34' fill='${safeColor}' fill-opacity='0.92' stroke='white' stroke-width='7'/%3E%3Ccircle cx='48' cy='48' r='45' fill='none' stroke='${safeColor}' stroke-opacity='0.48' stroke-width='6'/%3E%3Ctext x='48' y='57' text-anchor='middle' font-family='Arial,sans-serif' font-size='28' font-weight='700' fill='white'%3E${safeLabel}%3C/text%3E%3C/svg%3E`
}

/**
 * 从未知值中提取有限数值，无法转换时返回 null。
 *
 * 用于从 iServer 属性表等弱类型来源安全读取数值字段。
 */
export function numberFromUnknown(value: unknown): number | null {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

/**
 * 从未知值中提取字符串，null/undefined 归一为空串。
 */
export function stringFromUnknown(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value)
}

/**
 * 按候选键顺序从属性表中取第一个非空值。
 *
 * 用于适配 iServer 不同图层字段命名差异（如 Wgs84Lon / WGS84_LON）。
 */
export function valueFromProperties(
  properties: Record<string, string | number | boolean | null>,
  ...keys: string[]
): string | number | boolean | null {
  for (const key of keys) {
    const value = properties[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

/** 值是否为 Promise（鸭子类型判断）。 */
export function isPromiseLike(value: unknown): value is Promise<unknown> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as Promise<unknown>).then === 'function',
  )
}

/** 取数组的长度；非数组返回 0。 */
export function getArrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}
