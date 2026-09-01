/**
 * devicePointQuery.ts
 * --------------------
 * 前端按 ModelName 查询挂接的监控点位（DevicePoint）。
 *
 * 数据流：
 *   3D 点击拾取 → ModelName（如 TANK_002）
 *   → 客户端查询 DevicePoint_2D.geojson：ModelName='TANK_002'
 *   → 返回该对象上挂的 0..N 个传感器
 *   → 前端展示传感器列表 + 观测属性
 *
 * 实现：iServer 2026 beta 的 featureResults 查询引擎不可用（对任何查询返回空），
 *   故改为前端加载 GeoJSON 客户端查询，见 clientSpatialQuery.ts。本文件保留原 API 签名，
 *   内部委托给 clientSpatialQuery，确保原有调用方零改动。
 */
import {
  queryDevicePointsByModelName as clientByModelName,
  queryDevicePointsByBufferWgs84 as clientByBuffer,
  type GeoFeature,
} from './clientSpatialQuery'

export interface DevicePointFeature {
  SensorID: string
  ModelName: string
  FacilityId: string
  HazardZone: string
  SensorModel: string
  SensorModelName: string
  ObservedProps: string
  InstallHeight: number
  CoverageRadius: number
  Priority: number
  Risk: number
  DetectionRange: string
  InstallRemark: string
  Wgs84Lon: number
  Wgs84Lat: number
  SmZ: number
}

export interface DevicePointQueryResult {
  modelName: string
  sensors: DevicePointFeature[]
  totalCount: number
}

/** GeoJSON 要素属性 → DevicePointFeature（字段名与 GeoJSON properties 一致，CamelCase）。 */
function toDevicePointFeature(f: GeoFeature): DevicePointFeature {
  const a = f.properties as Record<string, unknown>
  const n = (k: string): number => {
    const v = a[k]
    return typeof v === 'number' ? v : v != null && v !== '' ? Number(v) : 0
  }
  return {
    SensorID: String(a.SensorID ?? ''),
    ModelName: String(a.ModelName ?? ''),
    FacilityId: String(a.FacilityId ?? ''),
    HazardZone: String(a.HazardZone ?? ''),
    SensorModel: String(a.SensorModel ?? ''),
    SensorModelName: String(a.SensorModelName ?? ''),
    ObservedProps: String(a.ObservedProps ?? ''),
    InstallHeight: n('InstallHeight'),
    CoverageRadius: n('CoverageRadius'),
    Priority: n('Priority'),
    Risk: n('Risk'),
    DetectionRange: String(a.DetectionRange ?? ''),
    InstallRemark: String(a.InstallRemark ?? ''),
    Wgs84Lon: n('Wgs84Lon'),
    Wgs84Lat: n('Wgs84Lat'),
    SmZ: n('InstallHeight'), // 安装高度即 SmZ（2D 几何不含 z，高度在 InstallHeight）
  }
}

/**
 * 按 ModelName 查询挂接的监控点位。
 * @param modelName 3D 拾取到的对象 ModelName，如 'TANK_002'
 */
export async function queryDevicePointsByModelName(
  modelName: string,
): Promise<DevicePointQueryResult> {
  const features = await clientByModelName(modelName)
  const sensors = features.map(toDevicePointFeature)
  return { modelName, sensors, totalCount: sensors.length }
}

/**
 * 缓冲区查询：以 (lon,lat) WGS84 为中心，查 radiusMeters 米内的传感器。
 * 精确：内部转 EPSG:4547 后按欧氏距离过滤（非旧版 bbox 近似）。
 */
export async function queryDevicePointsByBuffer(
  lon: number,
  lat: number,
  radiusMeters: number,
): Promise<DevicePointFeature[]> {
  const features = await clientByBuffer(lon, lat, radiusMeters)
  return features.map(toDevicePointFeature)
}

/**
 * 把传感器观测属性字符串解析成结构化列表。
 * 'CH4(%LEL)/CO(ppm)/NH3(ppm)/O2(%VOL)' → [{code:'CH4',unit:'%LEL'},...]
 */
export function parseObservedProps(text: string): Array<{ code: string; unit: string }> {
  if (!text) return []
  return text
    .split('/')
    .map((seg) => seg.trim())
    .filter(Boolean)
    .map((seg) => {
      const m = seg.match(/^([^(]+)\(([^)]*)\)$/)
      return m ? { code: m[1].trim(), unit: m[2].trim() } : { code: seg, unit: '' }
    })
}
