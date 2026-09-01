/**
 * geoQueryUtils.ts
 * ----------------
 * 纯函数空间查询工具（无浏览器依赖，可在 Node 中单测）。
 *
 * 背景：iServer 2026 beta 的 featureResults 查询引擎对本构建不可用（对任何查询都返回空，
 *   许可为通过的 TRIAL，属 beta 构建问题）。故空间查询改为前端加载 GeoJSON 后客户端完成。
 *
 * 坐标系：所有几何坐标均为 EPSG:4547（CGCS2000 / 3-degree Gauss-Kruger CM 114E）投影米，
 *   与 DevicePoint_2D.geojson、Park_S3MObjectFootprint_2D.geojson 同系。
 *
 * 数据形状：
 *   - DevicePoint_2D.geojson：1072 个 Point，geometry=[SmX, SmY]（4547 米），38 个属性
 *     （SensorID/ModelName/InstallHeight/Wgs84Lon/Wgs84Lat/View…/Pov…/MonitorAzimuth/AlarmLow/High…）。
 *   - Park_S3MObjectFootprint_2D.geojson：10286 个 Polygon，**全部为轴对齐矩形**（5 点=4 顶点+闭合），
 *     属性 name(=ModelName)/minHeight/maxHeight/s3mLeft/s3mRight/s3mBottom/s3mTop/sourceScp。
 *     矩形 ⇒ bbox 相交/包含即精确，无需点在多边形内（ray-casting）算法。
 */

/** EPSG:4547 投影米包围盒（左、下、右、上） */
export interface BBox4547 {
  left: number
  bottom: number
  right: number
  top: number
}

/** GeoJSON 要素的极简类型（只用到 geometry 与 properties） */
export interface GeoFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: unknown
  }
  properties: Record<string, unknown>
}

/** 带距离的要素（邻近查询返回） */
export type FeatureWithDistance = GeoFeature & { distance: number }

export type EquipmentAssemblyType =
  | 'BUILDING'
  | 'TANK'
  | 'PIPE'
  | 'EQUIPMENT'
  | 'UNKNOWN'

export interface EquipmentAssembly {
  equipmentId: string
  displayName: string
  equipmentType: EquipmentAssemblyType
  primaryModelName: string
  primarySmId: number
  selectedModelName: string
  selectedSmId: number
  componentModelNames: string[]
  componentSmIds: number[]
  componentCount: number
  bounds: BBox4547
  minHeightMeters: number
  maxHeightMeters: number
  bindingMethod: 'MODELNAME_SPATIAL_ASSEMBLY'
}

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : typeof v === 'string' && v !== ''
      ? Number(v)
      : fallback

// ---------- 基础几何 ----------

/** 取 Point 要素的 (x, y)（4547 米）。 */
export function pointXY(feature: GeoFeature): [number, number] {
  const c = feature.geometry.coordinates as number[]
  return [num(c[0]), num(c[1])]
}

/** 取 Footprint（矩形面）的包围盒。优先用属性里的 s3m* 字段（精确），否则从几何算。 */
export function footprintBBox(feature: GeoFeature): BBox4547 {
  const p = feature.properties
  if (
    p.s3mLeft != null &&
    p.s3mRight != null &&
    p.s3mBottom != null &&
    p.s3mTop != null
  ) {
    return {
      left: num(p.s3mLeft),
      right: num(p.s3mRight),
      bottom: num(p.s3mBottom),
      top: num(p.s3mTop),
    }
  }
  // 兜底：从多边形坐标算 min/max
  const rings = (feature.geometry.coordinates as number[][][])[0]
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const [x, y] of rings) {
    const X = num(x),
      Y = num(y)
    if (X < minX) minX = X
    if (Y < minY) minY = Y
    if (X > maxX) maxX = X
    if (Y > maxY) maxY = Y
  }
  return { left: minX, bottom: minY, right: maxX, top: maxY }
}

/** 两个轴对齐 bbox 是否相交。 */
export function bboxIntersect(a: BBox4547, b: BBox4547): boolean {
  return (
    a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom
  )
}

/** 点是否在 bbox 内（含边界）。 */
export function pointInBBox(b: BBox4547, x: number, y: number): boolean {
  return x >= b.left && x <= b.right && y >= b.bottom && y <= b.top
}

/** 两点平面距离（4547 米，近似欧氏）。 */
export function distance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx,
    dy = ay - by
  return Math.sqrt(dx * dx + dy * dy)
}

/** bbox 中心点。 */
export function bboxCenter(b: BBox4547): [number, number] {
  return [(b.left + b.right) / 2, (b.bottom + b.top) / 2]
}

/** 两个 bbox 的最短平面间距；相交或相切时为 0。 */
export function bboxGapDistance(a: BBox4547, b: BBox4547): number {
  const gapX = Math.max(a.left - b.right, b.left - a.right, 0)
  const gapY = Math.max(a.bottom - b.top, b.bottom - a.top, 0)
  return Math.hypot(gapX, gapY)
}

function equipmentTypeFromModelName(modelName: string): EquipmentAssemblyType {
  const prefix = modelName.split('_', 1)[0]?.toUpperCase()
  if (
    prefix === 'BUILDING' ||
    prefix === 'TANK' ||
    prefix === 'PIPE' ||
    prefix === 'EQUIPMENT'
  ) {
    return prefix
  }
  return 'UNKNOWN'
}

function footprintSmId(feature: GeoFeature, recordIndex: number): number {
  const propertySmId = num(
    feature.properties.SmID ?? feature.properties.smid,
    Number.NaN,
  )
  return Number.isInteger(propertySmId) && propertySmId > 0
    ? propertySmId
    : recordIndex + 1
}

function expandedBounds(features: GeoFeature[]): BBox4547 {
  return features.reduce<BBox4547>(
    (bounds, feature) => {
      const footprint = footprintBBox(feature)
      return {
        left: Math.min(bounds.left, footprint.left),
        bottom: Math.min(bounds.bottom, footprint.bottom),
        right: Math.max(bounds.right, footprint.right),
        top: Math.max(bounds.top, footprint.top),
      }
    },
    {
      left: Number.POSITIVE_INFINITY,
      bottom: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      top: Number.NEGATIVE_INFINITY,
    },
  )
}

/**
 * 把模型小组件聚合为可查询设备。
 *
 * 当前发布层尚无 EquipmentID，唯一可用字段是 SmID/ModelName/包围盒。本函数使用稳定
 * ModelName 定位所选组件，再优先吸附到 8m 内最近的 TANK/EQUIPMENT 主体，最后把与主体
 * 物理相邻的管件和结构件纳入同一设备。Footprint 导出顺序与模型 SmID 顺序一致；若后续
 * 数据补齐 SmID/EquipmentID，本函数会优先读取显式 SmID，外部接口无需变化。
 */
export function assembleEquipmentFromFootprints(
  footprints: GeoFeature[],
  selectedModelName: string,
): EquipmentAssembly | null {
  const selectedIndex = footprints.findIndex(
    (feature) => footprintModelName(feature) === selectedModelName,
  )
  if (selectedIndex < 0) return null

  const selected = footprints[selectedIndex]
  const selectedBounds = footprintBBox(selected)
  const selectedType = equipmentTypeFromModelName(selectedModelName)
  let primaryIndex = selectedIndex

  if (selectedType === 'PIPE' || selectedType === 'BUILDING') {
    let nearestDistanceMeters = Number.POSITIVE_INFINITY
    footprints.forEach((candidate, candidateIndex) => {
      const candidateType = equipmentTypeFromModelName(
        footprintModelName(candidate),
      )
      if (candidateType !== 'TANK' && candidateType !== 'EQUIPMENT') return
      const gapDistanceMeters = bboxGapDistance(
        selectedBounds,
        footprintBBox(candidate),
      )
      if (gapDistanceMeters <= 8 && gapDistanceMeters < nearestDistanceMeters) {
        primaryIndex = candidateIndex
        nearestDistanceMeters = gapDistanceMeters
      }
    })
  }

  const primary = footprints[primaryIndex]
  const primaryModelName = footprintModelName(primary)
  const primaryBounds = footprintBBox(primary)
  const primaryType = equipmentTypeFromModelName(primaryModelName)
  const primaryWidthMeters = Math.max(
    primaryBounds.right - primaryBounds.left,
    0,
  )
  const primaryHeightMeters = Math.max(
    primaryBounds.top - primaryBounds.bottom,
    0,
  )
  const assemblyGapMeters =
    primaryType === 'BUILDING'
      ? 0.6
      : Math.min(
          5,
          Math.max(
            1.5,
            Math.max(primaryWidthMeters, primaryHeightMeters) * 0.18,
          ),
        )

  const componentEntries = footprints
    .map((candidate, candidateIndex) => ({
      feature: candidate,
      index: candidateIndex,
      modelName: footprintModelName(candidate),
      type: equipmentTypeFromModelName(footprintModelName(candidate)),
    }))
    .filter((candidate) => {
      if (candidate.index === primaryIndex || candidate.index === selectedIndex)
        return true
      if (
        (candidate.type === 'TANK' || candidate.type === 'EQUIPMENT') &&
        primaryType !== 'BUILDING'
      ) {
        return false
      }
      if (candidate.type === 'BUILDING' && primaryType !== 'BUILDING') {
        const candidateBounds = footprintBBox(candidate.feature)
        const candidateAreaSquareMeters =
          Math.max(candidateBounds.right - candidateBounds.left, 0) *
          Math.max(candidateBounds.top - candidateBounds.bottom, 0)
        const primaryAreaSquareMeters = Math.max(
          primaryWidthMeters * primaryHeightMeters,
          1,
        )
        if (
          candidateAreaSquareMeters > Math.max(primaryAreaSquareMeters * 4, 120)
        ) {
          return false
        }
      }
      return (
        bboxGapDistance(primaryBounds, footprintBBox(candidate.feature)) <=
        assemblyGapMeters
      )
    })
    .sort((left, right) => left.index - right.index)
    .slice(0, 160)

  const componentFeatures = componentEntries.map((entry) => entry.feature)
  const componentSmIds = componentEntries.map((entry) =>
    footprintSmId(entry.feature, entry.index),
  )
  const minHeightMeters = Math.min(
    ...componentEntries.map((entry) =>
      num(entry.feature.properties.minHeight, 0),
    ),
  )
  const maxHeightMeters = Math.max(
    ...componentEntries.map((entry) =>
      num(entry.feature.properties.maxHeight, 0),
    ),
  )

  return {
    equipmentId: `EQ-${primaryModelName}`,
    displayName: primaryModelName,
    equipmentType: primaryType,
    primaryModelName,
    primarySmId: footprintSmId(primary, primaryIndex),
    selectedModelName,
    selectedSmId: footprintSmId(selected, selectedIndex),
    componentModelNames: componentEntries.map((entry) => entry.modelName),
    componentSmIds,
    componentCount: componentEntries.length,
    bounds: expandedBounds(componentFeatures),
    minHeightMeters,
    maxHeightMeters,
    bindingMethod: 'MODELNAME_SPATIAL_ASSEMBLY',
  }
}

/** 按发布模型 SmID 聚合设备；兼容当前 Footprint 导出未显式带 SmID 的情况。 */
export function assembleEquipmentFromSmId(
  footprints: GeoFeature[],
  selectedSmId: number,
): EquipmentAssembly | null {
  if (!Number.isInteger(selectedSmId) || selectedSmId <= 0) return null
  const explicitMatch = footprints.findIndex(
    (feature, index) => footprintSmId(feature, index) === selectedSmId,
  )
  if (explicitMatch < 0) return null
  const selectedModelName = footprintModelName(footprints[explicitMatch])
  return selectedModelName
    ? assembleEquipmentFromFootprints(footprints, selectedModelName)
    : null
}

// ---------- DevicePoint（点）查询 ----------

/** 按 ModelName 过滤监控点（3D 点击拾取 ModelName → 挂接的传感器）。 */
export function filterByModelName(
  features: GeoFeature[],
  modelName: string,
): GeoFeature[] {
  return features.filter(
    (f) => String(f.properties.ModelName ?? '') === modelName,
  )
}

/** 按 SensorID 过滤。 */
export function filterBySensorId(
  features: GeoFeature[],
  sensorId: string,
): GeoFeature[] {
  return features.filter(
    (f) => String(f.properties.SensorID ?? '') === sensorId,
  )
}

/** 范围查询：返回落在 bbox 内的监控点。 */
export function pointsInBBox(
  features: GeoFeature[],
  bbox: BBox4547,
): GeoFeature[] {
  return features.filter((f) => {
    const [x, y] = pointXY(f)
    return pointInBBox(bbox, x, y)
  })
}

/** 缓冲区查询：返回离中心 (cx,cy) radiusM 米内的监控点。 */
export function pointsInBuffer(
  features: GeoFeature[],
  cx: number,
  cy: number,
  radiusM: number,
): GeoFeature[] {
  return features.filter((f) => {
    const [x, y] = pointXY(f)
    return distance(x, y, cx, cy) <= radiusM
  })
}

/** 邻近查询：离 (cx,cy) 最近的 count 个监控点（带 distance，米）。 */
export function nearestPoints(
  features: GeoFeature[],
  cx: number,
  cy: number,
  count: number,
): FeatureWithDistance[] {
  return features
    .map((f) => {
      const [x, y] = pointXY(f)
      return { ...f, distance: distance(x, y, cx, cy) }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
}

// ---------- Footprint（矩形面）查询 ----------

/** 范围查询：返回 bbox 与查询范围相交的模型对象足迹。矩形 ⇒ 精确。 */
export function footprintsIntersectBBox(
  footprints: GeoFeature[],
  bbox: BBox4547,
): GeoFeature[] {
  return footprints.filter((f) => bboxIntersect(footprintBBox(f), bbox))
}

/**
 * 点查：返回包含点 (x,y) 的最小模型对象足迹。
 * 场景里地面、管廊和单体设备的包围盒会互相覆盖，取首个结果会经常命中大地块；
 * 选择面积最小的包含项，才能稳定落到用户实际点击的单体建筑或设备。
 */
export function footprintAtPoint(
  footprints: GeoFeature[],
  x: number,
  y: number,
): GeoFeature | null {
  let bestMatch: GeoFeature | null = null
  let bestArea = Number.POSITIVE_INFINITY
  for (const f of footprints) {
    const bbox = footprintBBox(f)
    if (!pointInBBox(bbox, x, y)) continue
    const area =
      Math.max(bbox.right - bbox.left, 0) * Math.max(bbox.top - bbox.bottom, 0)
    if (area >= bestArea) continue
    bestMatch = f
    bestArea = area
  }
  return bestMatch
}

/** 缓冲区查询：返回与"中心 (cx,cy) 半径 radiusM 米"圆外接 bbox 相交的足迹。
 *  矩形足迹 + 圆外接 bbox 相交会多召回少量边缘对象，调用方可再按需精确过滤；
 *  对化工园区泄漏点周边设备检索场景足够。 */
export function footprintsInBuffer(
  footprints: GeoFeature[],
  cx: number,
  cy: number,
  radiusM: number,
): GeoFeature[] {
  const circleBBox: BBox4547 = {
    left: cx - radiusM,
    bottom: cy - radiusM,
    right: cx + radiusM,
    top: cy + radiusM,
  }
  return footprints.filter((f) => {
    const fb = footprintBBox(f)
    if (!bboxIntersect(fb, circleBBox)) return false
    // 进一步用足迹中心到查询点的距离 <= radiusM + 足迹半对角线，保证不漏；这里用中心距离粗筛
    const [fx, fy] = bboxCenter(fb)
    return (
      distance(fx, fy, cx, cy) <=
      radiusM + Math.max(fb.right - fb.left, fb.top - fb.bottom) / 2
    )
  })
}

/** 邻近查询：离 (cx,cy) 最近的 count 个足迹（按足迹中心距离，带 distance）。 */
export function nearestFootprints(
  footprints: GeoFeature[],
  cx: number,
  cy: number,
  count: number,
): FeatureWithDistance[] {
  return footprints
    .map((f) => {
      const [x, y] = bboxCenter(footprintBBox(f))
      return { ...f, distance: distance(x, y, cx, cy) }
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
}

/** 从足迹要素取模型名。发布数据的权威字段为 ModelName；name 仅兼容现有离线足迹导出物。 */
export function footprintModelName(f: GeoFeature): string {
  return String(f.properties.ModelName ?? f.properties.name ?? '')
}
