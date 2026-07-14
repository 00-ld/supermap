import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const cupRoot = path.resolve(repoRoot, '..', '..')
const outputRoot = path.join(cupRoot, '报告素材', '二维数据集识别')
const dataRoot = path.join(outputRoot, 'supermap_import')

const realMapAssets = await import(pathToFileURL(path.join(repoRoot, 'frontend', 'src', 'data', 'realMapAssets.js')).href)
const coordinate = await import(pathToFileURL(path.join(repoRoot, 'frontend', 'src', 'data', 'coordinate.js')).href)

const { REAL_MAP } = realMapAssets

const S3M_BOUNDS = {
  left: -1605.9164671191247,
  right: 810.41634921256627,
  bottom: -1130.1391864245234,
  top: 878.30004171701148,
}

const sourceFile = path.join(dataRoot, 'building_facility_polygons_map.geojson')
const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'))
const facilityById = new Map(source.features.map((item) => [item.properties.id, item]))

const drafts = [
  ['BLD_A_001', 'pa-west-north', 'A', '西部生产装置区蓝顶厂房', 'production', 1, 24, 'medium', 'pending', [0.06, 0.10, 0.46, 0.34]],
  ['BLD_A_002', 'pa-west-north', 'A', '西部生产装置框架区', 'production', 1, 8, 'low', 'pending', [0.52, 0.08, 0.88, 0.38]],
  ['BLD_A_003', 'pa-west-north', 'A', '西部北侧辅助厂房', 'utility', 0, 4, 'low', 'pending', [0.10, 0.56, 0.44, 0.84]],
  ['BLD_I_001', 'pa-west-south', 'I', '西南罐组一', 'tank', 1, 2, 'medium', 'pending', [0.08, 0.12, 0.34, 0.40]],
  ['BLD_I_002', 'pa-west-south', 'I', '西南泵区', 'pump', 1, 4, 'low', 'pending', [0.40, 0.15, 0.68, 0.38]],
  ['BLD_I_003', 'pa-west-south', 'I', '西南辅助厂房', 'utility', 0, 8, 'medium', 'pending', [0.14, 0.58, 0.54, 0.86]],
  ['BLD_B_001', 'pa-center-north', 'B', '西中长条生产厂房', 'production', 1, 36, 'high', 'confirmed', [0.10, 0.12, 0.90, 0.42]],
  ['BLD_B_002', 'pa-center-north', 'B', '西中装置区', 'production', 1, 10, 'medium', 'pending', [0.14, 0.56, 0.82, 0.86]],
  ['BLD_D_001', 'pa-center-south', 'D', '中南蓝顶厂房', 'production', 1, 24, 'high', 'confirmed', [0.08, 0.12, 0.88, 0.36]],
  ['BLD_D_002', 'pa-center-south', 'D', '中南罐组', 'tank', 1, 4, 'medium', 'pending', [0.12, 0.50, 0.46, 0.80]],
  ['BLD_D_003', 'pa-center-south', 'D', '中南装置框架', 'production', 1, 6, 'low', 'pending', [0.54, 0.50, 0.88, 0.82]],
  ['BLD_C_001', 'ut-center', 'C', '中央主厂房', 'production', 1, 28, 'high', 'confirmed', [0.08, 0.18, 0.88, 0.36]],
  ['BLD_C_002', 'ut-center', 'C', '中央塔器区', 'tower', 1, 4, 'medium', 'pending', [0.20, 0.44, 0.76, 0.64]],
  ['BLD_C_003', 'ut-center', 'C', '中央公用工程区', 'utility', 0, 6, 'medium', 'pending', [0.18, 0.72, 0.82, 0.90]],
  ['BLD_E_001', 'tw-center', 'E', '中东装置框架区', 'production', 1, 14, 'medium', 'pending', [0.10, 0.10, 0.90, 0.30]],
  ['BLD_E_002', 'tw-center', 'E', '中东塔器罐组', 'tank', 1, 4, 'medium', 'pending', [0.14, 0.38, 0.86, 0.58]],
  ['BLD_E_003', 'tw-center', 'E', '中东南侧厂房', 'production', 1, 16, 'medium', 'pending', [0.10, 0.68, 0.90, 0.88]],
  ['BLD_G_001', 'pb-north-tank', 'G', '东北西侧储罐组', 'tank', 1, 2, 'high', 'confirmed', [0.08, 0.16, 0.38, 0.62]],
  ['BLD_G_002', 'pb-north-tank', 'G', '东北东侧储罐组', 'tank', 1, 2, 'high', 'confirmed', [0.52, 0.16, 0.86, 0.62]],
  ['BLD_G_003', 'pb-north-tank', 'G', '东北管汇装卸区', 'utility', 1, 4, 'medium', 'pending', [0.18, 0.70, 0.82, 0.88]],
  ['BLD_F_001', 'pb-mid-process', 'F', '东南主生产厂房', 'production', 1, 28, 'high', 'confirmed', [0.08, 0.14, 0.92, 0.42]],
  ['BLD_F_002', 'pb-mid-process', 'F', '东南设备区', 'utility', 1, 8, 'medium', 'pending', [0.12, 0.56, 0.48, 0.84]],
  ['BLD_F_003', 'pb-mid-process', 'F', '东南辅助厂房', 'warehouse', 0, 16, 'medium', 'pending', [0.58, 0.56, 0.90, 0.84]],
  ['BLD_J_001', 'fs-east-yard', 'J', '南侧小罐组', 'tank', 1, 2, 'medium', 'pending', [0.12, 0.14, 0.88, 0.42]],
  ['BLD_J_002', 'fs-east-yard', 'J', '南侧装置区', 'production', 1, 8, 'low', 'pending', [0.16, 0.58, 0.84, 0.84]],
  ['BLD_H_001', 'wh-logistics', 'H', '东侧仓储建筑一', 'warehouse', 0, 24, 'high', 'confirmed', [0.10, 0.10, 0.42, 0.32]],
  ['BLD_H_002', 'wh-logistics', 'H', '东侧仓储建筑二', 'warehouse', 0, 18, 'high', 'confirmed', [0.58, 0.10, 0.90, 0.32]],
  ['BLD_H_003', 'wh-logistics', 'H', '东侧辅助建筑一', 'office', 0, 20, 'medium', 'pending', [0.10, 0.52, 0.42, 0.76]],
  ['BLD_H_004', 'wh-logistics', 'H', '东侧辅助建筑二', 'utility', 0, 12, 'medium', 'pending', [0.58, 0.52, 0.90, 0.76]],
]

const footprintFeatures = drafts.map(toFeature)

writeGeoJson('building_footprints_map.geojson', footprintFeatures, 'local-planar-meter-current-epsg0')
writeGeoJson('building_footprints_wgs84.geojson', transformFeatures(footprintFeatures, mapPointToWgs84), 'wgs84-reference-from-business-transform')
writeGeoJson('building_footprints_s3m_local.geojson', transformFeatures(footprintFeatures, mapPointToS3mLocal2d), 's3m-local-epsg0')
writeCsv('building_footprints.csv', footprintFeatures)
writeQaSvg(footprintFeatures)

console.log(JSON.stringify({
  outputRoot,
  buildingFootprints: footprintFeatures.length,
  map: 'building_footprints_map.geojson',
  wgs84Reference: 'building_footprints_wgs84.geojson',
  s3mLocal: 'building_footprints_s3m_local.geojson',
}, null, 2))

function toFeature([id, sourceId, zoneCode, name, type, isHazard, personnel, confidence, status, fractions]) {
  const sourceFeature = facilityById.get(sourceId)
  if (!sourceFeature) throw new Error(`Unknown facility id: ${sourceId}`)
  const bbox = bboxOfPolygon(sourceFeature.geometry)
  const [fx1, fy1, fx2, fy2] = fractions
  const x = bbox.minX + (bbox.maxX - bbox.minX) * fx1
  const y = bbox.minY + (bbox.maxY - bbox.minY) * fy1
  const w = (bbox.maxX - bbox.minX) * (fx2 - fx1)
  const h = (bbox.maxY - bbox.minY) * (fy2 - fy1)
  const geometry = rectPolygon(x, y, w, h)
  const centroid = centroidOfGeometry(geometry)
  const s3m = mapPointToS3mLocal2d([centroid.x, centroid.y])
  const geo = coordinate.worldToGeo(centroid.x, centroid.y)
  return feature(geometry, {
    dataset: 'park_building_footprint',
    building_id: id,
    name,
    zone_code: zoneCode,
    source_facility_id: sourceId,
    source_facility_name: sourceFeature.properties.name,
    type,
    is_hazard: isHazard,
    personnel,
    confidence,
    status,
    source: 's3m_oblique_manual_interpretation_draft',
    precisionLevel: 'building_footprint_draft',
    needsDesktopRefinement: status !== 'confirmed',
    remark: '基于三维斜视图和设施区底稿自动切分的建筑单体草稿，需在 iDesktopX 中对照三维瓦片最终校核。',
    mapX: round(centroid.x),
    mapY: round(centroid.y),
    s3mX: s3m[0],
    s3mY: s3m[1],
    longitude: Number(geo.longitude.toFixed(8)),
    latitude: Number(geo.latitude.toFixed(8)),
  })
}

function feature(geometry, properties) {
  return { type: 'Feature', properties, geometry }
}

function rectPolygon(x, y, w, h) {
  return {
    type: 'Polygon',
    coordinates: [[
      [round(x), round(y)],
      [round(x + w), round(y)],
      [round(x + w), round(y + h)],
      [round(x), round(y + h)],
      [round(x), round(y)],
    ]],
  }
}

function bboxOfPolygon(geometry) {
  const points = geometry.coordinates[0]
  return {
    minX: Math.min(...points.map((item) => item[0])),
    minY: Math.min(...points.map((item) => item[1])),
    maxX: Math.max(...points.map((item) => item[0])),
    maxY: Math.max(...points.map((item) => item[1])),
  }
}

function centroidOfGeometry(geometry) {
  const open = geometry.coordinates[0].slice(0, -1)
  const sum = open.reduce((acc, item) => ({ x: acc.x + item[0], y: acc.y + item[1] }), { x: 0, y: 0 })
  return { x: sum.x / open.length, y: sum.y / open.length }
}

function transformFeatures(items, transform) {
  return items.map((item) => ({
    ...item,
    geometry: transformGeometry(item.geometry, transform),
  }))
}

function transformGeometry(geometry, transform) {
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map((ring) => ring.map(transform)) }
  }
  return geometry
}

function mapPointToWgs84(coordinatesValue) {
  const geo = coordinate.worldToGeo(coordinatesValue[0], coordinatesValue[1])
  return [Number(geo.longitude.toFixed(8)), Number(geo.latitude.toFixed(8)), Number(geo.altitude.toFixed(3))]
}

function mapPointToS3mLocal2d(coordinatesValue) {
  const nx = coordinatesValue[0] / REAL_MAP.width
  const ny = coordinatesValue[1] / REAL_MAP.height
  return [
    round(S3M_BOUNDS.left + nx * (S3M_BOUNDS.right - S3M_BOUNDS.left)),
    round(S3M_BOUNDS.top - ny * (S3M_BOUNDS.top - S3M_BOUNDS.bottom)),
  ]
}

function writeGeoJson(fileName, features, crsName) {
  fs.writeFileSync(
    path.join(dataRoot, fileName),
    `${JSON.stringify({
      type: 'FeatureCollection',
      name: fileName.replace(/\.geojson$/, ''),
      crs: { type: 'name', properties: { name: crsName } },
      features,
    }, null, 2)}\n`,
    'utf8',
  )
}

function writeCsv(fileName, features) {
  const rows = features.map((item) => {
    const props = item.properties || {}
    return {
      ...props,
      geometryType: item.geometry.type,
      geometryJson: JSON.stringify(item.geometry),
    }
  })
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
  fs.writeFileSync(path.join(dataRoot, fileName), `${content}\n`, 'utf8')
}

function writeQaSvg(features) {
  const width = REAL_MAP.width
  const height = REAL_MAP.height
  const sourceFacilities = source.features.map((item) => polygonSvg(item.geometry, '#1d4ed8', '#93c5fd', 2, true))
  const footprints = features.map((item) => polygonSvg(item.geometry, item.properties.is_hazard ? '#ef4444' : '#22c55e', '#ffffff', 1.5))
  const labels = features.map((item) => {
    const c = centroidOfGeometry(item.geometry)
    return `<text x="${c.x}" y="${c.y}" fill="#fff" font-size="10" text-anchor="middle" dominant-baseline="middle">${item.properties.building_id}</text>`
  })
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#111827"/>',
    '<g opacity="0.32">',
    ...sourceFacilities,
    '</g>',
    '<g opacity="0.82">',
    ...footprints,
    '</g>',
    '<g>',
    ...labels,
    '</g>',
    '</svg>',
  ]
  fs.writeFileSync(path.join(outputRoot, 'building_footprints_qa_overlay.svg'), `${parts.join('\n')}\n`, 'utf8')
}

function polygonSvg(geometry, fill, stroke, strokeWidth, dashed = false) {
  const points = geometry.coordinates[0].map((item) => item.join(',')).join(' ')
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashed ? ' stroke-dasharray="8 5"' : ''}/>`
}

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits))
}

function csvEscape(value) {
  if (value === undefined || value === null) return ''
  const stringValue = String(value)
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue
}
