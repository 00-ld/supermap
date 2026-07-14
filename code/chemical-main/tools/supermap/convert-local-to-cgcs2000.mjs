import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..')
const cupRoot = path.resolve(repoRoot, '..', '..')
const reportRoot = path.join(cupRoot, '报告素材', '二维数据集识别')
const sourceRoot = path.join(reportRoot, 'supermap_import')
const outputRoot = path.join(reportRoot, 'supermap_import_cgcs2000')
const georeference = await import(pathToFileURL(path.join(repoRoot, 'frontend', 'src', 'data', 'supermapGeoreference.js')).href)

const INPUT_FILES = [
  'road_polygons_map.geojson',
  'road_network_nodes_map.geojson',
  'road_network_edges_map.geojson',
  'building_facility_polygons_map.geojson',
  'building_footprints_map.geojson',
  'entrance_points_map.geojson',
  's3m_object_footprints_map.geojson',
]

fs.mkdirSync(outputRoot, { recursive: true })

const outputs = []
for (const fileName of INPUT_FILES) {
  const sourcePath = path.join(sourceRoot, fileName)
  if (!fs.existsSync(sourcePath)) {
    outputs.push({ fileName, skipped: true, reason: 'source missing' })
    continue
  }
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
  const transformed = transformFeatureCollection(source, fileName)
  const outputPath = path.join(outputRoot, fileName)
  fs.writeFileSync(outputPath, `${JSON.stringify(transformed, null, 2)}\n`, 'utf8')
  outputs.push({
    fileName,
    outputPath,
    featureCount: transformed.features.length,
    bounds: boundsOfFeatureCollection(transformed),
  })
}

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceRoot,
  outputRoot,
  coordSys: georeference.SUPERMAP_CGCS2000_COORD_SYS,
  epsg: georeference.SUPERMAP_CGCS2000_EPSG,
  geographicEpsg: georeference.SUPERMAP_CGCS2000_GEOGRAPHIC_EPSG,
  transform: georeference.SUPERMAP_CGCS2000_TRANSFORM,
  controlPoints: georeference.SUPERMAP_CGCS2000_CONTROL_POINTS,
  fieldContract: {
    geometry: 'EPSG:4547 CGCS2000 / 3-degree Gauss-Kruger CM 114E projected meters',
    mapX: 'retained original local X for traceability',
    mapY: 'retained original local Y for traceability',
    localMapX: 'original local X',
    localMapY: 'original local Y',
    cgcs2000E: 'projected easting in EPSG:4547',
    cgcs2000N: 'projected northing in EPSG:4547',
    longitude: 'CGCS2000 geographic reference, approximate local inverse for display',
    latitude: 'CGCS2000 geographic reference, approximate local inverse for display',
    s3mX: 'retained original current S3M local X',
    s3mY: 'retained original current S3M local Y',
  },
  outputs,
}

fs.writeFileSync(path.join(outputRoot, 'cgcs2000_transform_manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(outputRoot, 'README.md'), toReadme(manifest), 'utf8')

console.log(JSON.stringify({
  outputRoot,
  coordSys: manifest.coordSys,
  epsg: manifest.epsg,
  generated: outputs.filter(item => !item.skipped).length,
  skipped: outputs.filter(item => item.skipped).map(item => item.fileName),
}, null, 2))

function transformFeatureCollection(source, fileName) {
  return {
    ...source,
    name: fileName.replace(/\.geojson$/, ''),
    crs: {
      type: 'name',
      properties: {
        name: `EPSG:${georeference.SUPERMAP_CGCS2000_EPSG}`,
        coordSys: georeference.SUPERMAP_CGCS2000_COORD_SYS,
      },
    },
    features: (source.features || []).map(transformFeature),
  }
}

function transformFeature(sourceFeature) {
  const centroid = centroidOfGeometry(sourceFeature.geometry)
  const projected = georeference.localToProjected(centroid.x, centroid.y)
  const wgs84 = georeference.localToWgs84(centroid.x, centroid.y, 0)
  return {
    ...sourceFeature,
    properties: {
      ...(sourceFeature.properties || {}),
      localMapX: round(centroid.x),
      localMapY: round(centroid.y),
      cgcs2000E: projected.easting,
      cgcs2000N: projected.northing,
      longitude: wgs84.longitude,
      latitude: wgs84.latitude,
      coordSys: georeference.SUPERMAP_CGCS2000_COORD_SYS,
      epsg: georeference.SUPERMAP_CGCS2000_EPSG,
      anchor: 'HAUT_Lianhua_SouthGate_CP0',
    },
    geometry: transformGeometry(sourceFeature.geometry),
  }
}

function transformGeometry(geometry) {
  if (!geometry) return geometry
  if (geometry.type === 'Point') return { ...geometry, coordinates: transformCoordinate(geometry.coordinates) }
  if (geometry.type === 'LineString') {
    return { ...geometry, coordinates: geometry.coordinates.map(transformCoordinate) }
  }
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(ring => ring.map(transformCoordinate)) }
  }
  if (geometry.type === 'MultiPolygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(poly => poly.map(ring => ring.map(transformCoordinate))) }
  }
  return geometry
}

function transformCoordinate(value) {
  const projected = georeference.localToProjected(value[0], value[1])
  return value.length > 2
    ? [projected.easting, projected.northing, value[2]]
    : [projected.easting, projected.northing]
}

function centroidOfGeometry(geometry) {
  if (geometry.type === 'Point') return { x: geometry.coordinates[0], y: geometry.coordinates[1] }
  const coordinates = geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates[0]
  const open = coordinates.filter((item, index) => index === 0 || item[0] !== coordinates[0][0] || item[1] !== coordinates[0][1])
  const sum = open.reduce((acc, item) => ({ x: acc.x + item[0], y: acc.y + item[1] }), { x: 0, y: 0 })
  return { x: sum.x / open.length, y: sum.y / open.length }
}

function boundsOfFeatureCollection(collection) {
  const points = []
  for (const item of collection.features || []) collectCoordinates(item.geometry, points)
  const xs = points.map(item => item[0])
  const ys = points.map(item => item[1])
  return {
    left: round(Math.min(...xs)),
    right: round(Math.max(...xs)),
    bottom: round(Math.min(...ys)),
    top: round(Math.max(...ys)),
  }
}

function collectCoordinates(geometry, points) {
  if (!geometry) return
  if (geometry.type === 'Point') points.push(geometry.coordinates)
  if (geometry.type === 'LineString') points.push(...geometry.coordinates)
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(ring => points.push(...ring))
  if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(poly => poly.forEach(ring => points.push(...ring)))
}

function toReadme(manifestValue) {
  return [
    '# CGCS2000 二维数据转换成果',
    '',
    `生成时间：${manifestValue.generatedAt}`,
    '',
    `目标坐标系：${manifestValue.coordSys} / EPSG:${manifestValue.epsg}`,
    `经纬度备案：EPSG:${manifestValue.geographicEpsg}`,
    '',
    '## 控制点',
    '',
    '| 控制点 | 本地坐标 | EPSG:4547 坐标 | 用途 |',
    '|---|---:|---:|---|',
    ...manifestValue.controlPoints.map(item => `| ${item.id} ${item.name} | (${item.local.x}, ${item.local.y}) | (${item.projected.easting}, ${item.projected.northing}) | ${item.usage} |`),
    '',
    '## 字段契约',
    '',
    '- GeoJSON geometry 已转换为 EPSG:4547 米制投影坐标。',
    '- `mapX/mapY` 保留原始本地米制质心字段，兼容既有校核记录。',
    '- `localMapX/localMapY` 明确表示原始本地坐标。',
    '- `cgcs2000E/cgcs2000N` 表示 EPSG:4547 投影坐标。',
    '- `longitude/latitude` 为 CGCS2000 地理坐标展示参考。',
    '- `s3mX/s3mY` 保留当前 EPSG:0 三维缓存本地坐标，仅用于旧三维缓存对照。',
    '',
    '## 导入 iDesktopX',
    '',
    '```powershell',
    '$env:SUPERMAP_SOURCE_DATA_ROOT="G:\\竞赛\\超图杯\\报告素材\\二维数据集识别\\supermap_import_cgcs2000"',
    '$env:SUPERMAP_OUTPUT_DATASOURCE="G:\\竞赛\\超图杯\\报告素材\\二维数据集识别\\supermap_udbx\\chemical_park_vectors_cgcs2000.udbx"',
    '$env:SUPERMAP_SOURCE_CHARSET="UTF-8"',
    'python tools\\supermap\\import-vector-datasets-iobjectspy.py',
    '```',
    '',
    '如果 iDesktopX 导入 UTF-8 后出现中文乱码，再将本目录 GeoJSON 转为 GB18030，并把 `SUPERMAP_SOURCE_CHARSET` 改为 `GB18030`。',
    '',
  ].join('\n')
}

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits))
}
