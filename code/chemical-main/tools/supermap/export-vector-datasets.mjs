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

const {
  REAL_MAP,
  facilities,
  roads,
  parkEntrances,
  buildingEntrances,
} = realMapAssets

const S3M_BOUNDS = {
  left: -1605.9164671191247,
  right: 810.41634921256627,
  bottom: -1130.1391864245234,
  top: 878.30004171701148,
}

const scpFiles = [
  ['factory_processing', '加工厂房', path.join(cupRoot, '园区大屏部署', '瓦片', '厂房三维瓦片', '加工厂房', 'result_ImportFBX', 'result_ImportFBX.scp')],
  ['factory_production', '生产装置厂房', path.join(cupRoot, '园区大屏部署', '瓦片', '厂房三维瓦片', '生产装置厂房', 'result_ImportFBX', 'result_ImportFBX.scp')],
  ['warehouse_raw_material', '原材料仓库', path.join(cupRoot, '园区大屏部署', '瓦片', '厂房三维瓦片', '原材料仓库', 'result_ImportFBX.scp')],
  ['equipment_heat_exchanger', '换热器', path.join(cupRoot, '园区大屏部署', '瓦片', '设备三维瓦片', '换热器', '换热器.scp')],
  ['equipment_vertical_tank', '立式罐子', path.join(cupRoot, '园区大屏部署', '瓦片', '设备三维瓦片', '立式罐子', '罐子.scp')],
  ['equipment_distillation_tower', '蒸馏塔', path.join(cupRoot, '园区大屏部署', '瓦片', '设备三维瓦片', '蒸馏塔', '蒸馏塔.scp')],
]

fs.mkdirSync(dataRoot, { recursive: true })

const roadPolygons = roads.map((road) => feature(
  rectPolygon(road.x, road.y, road.w, road.h),
  {
    dataset: 'park_road_polygon',
    id: road.id,
    type: 'road',
    main: Boolean(road.main),
    width_m: Math.min(road.w, road.h),
    source: 'frontend.realMapAssets.roads',
    precisionLevel: 'manual_dom_annotation',
  },
))

const { nodes, edges } = buildRoadNetwork(roads)

const roadNodeFeatures = nodes.map((node) => feature(
  point(node.x, node.y),
  {
    dataset: 'park_road_network_node',
    id: node.id,
    type: node.kind,
    degree: node.degree,
    x_m: round(node.x),
    y_m: round(node.y),
    source: 'derived_from_road_centerlines',
  },
))

const roadEdgeFeatures = edges.map((edge) => feature(
  line(edge.points),
  {
    dataset: 'park_road_network_edge',
    id: edge.id,
    roadId: edge.roadId,
    fromNode: edge.fromNode,
    toNode: edge.toNode,
    main: edge.main,
    length_m: round(edge.length),
    direction: edge.direction,
    source: 'derived_from_road_centerlines',
    networkReady: true,
  },
))

const facilityFeatures = facilities.map((facilityItem) => feature(
  rectPolygon(facilityItem.x, facilityItem.y, facilityItem.w, facilityItem.h),
  {
    dataset: 'park_building_facility_polygon',
    id: facilityItem.id,
    name: facilityItem.name,
    facilityType: facilityItem.type,
    zone: facilityItem.zone,
    status: facilityItem.status,
    personnel: facilityItem.personnel,
    hazardLevel: facilityItem.hazardLevel,
    source: 'frontend.realMapAssets.facilities',
    precisionLevel: 'facility_zone',
    needsDesktopRefinement: true,
    note: 'Current feature is a manually interpreted facility/building zone. Refine into single-building footprints in iDesktopX before final publication when necessary.',
  },
))

const entranceFeatures = [...parkEntrances, ...buildingEntrances].map((entrance) => feature(
  point(entrance.x, entrance.y),
  {
    dataset: 'park_entrance_point',
    id: entrance.id,
    kind: entrance.kind,
    parentId: entrance.parentId || '',
    label: entrance.label,
    source: 'frontend.realMapAssets.entrances',
  },
))

const s3mObjectFeatures = scpFiles
  .filter(([, , filePath]) => fs.existsSync(filePath))
  .map(([id, name, filePath]) => {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const bounds = raw.geoBounds || {}
    const height = raw.heightRange || {}
    return feature(
      localBoundsToMapPolygon(bounds),
      {
        dataset: 's3m_object_footprint',
        id,
        name,
        crs: raw.crs || '',
        dataType: raw.dataType || '',
        s3mLeft: bounds.left,
        s3mRight: bounds.right,
        s3mBottom: bounds.bottom,
        s3mTop: bounds.top,
        minHeight: height.min,
        maxHeight: height.max,
        sourceScp: filePath,
        source: 'scp.geoBounds',
        precisionLevel: 's3m_object_bounds',
      },
    )
  })

writeGeoJson('road_polygons_map.geojson', roadPolygons)
writeGeoJson('road_network_nodes_map.geojson', roadNodeFeatures)
writeGeoJson('road_network_edges_map.geojson', roadEdgeFeatures)
writeGeoJson('building_facility_polygons_map.geojson', facilityFeatures)
writeGeoJson('entrance_points_map.geojson', entranceFeatures)
writeGeoJson('s3m_object_footprints_map.geojson', s3mObjectFeatures)

writeGeoJson('road_network_edges_wgs84.geojson', transformFeatures(roadEdgeFeatures, mapPointToWgs84))
writeGeoJson('building_facility_polygons_wgs84.geojson', transformFeatures(facilityFeatures, mapPointToWgs84))
writeGeoJson('road_network_edges_s3m_local.geojson', transformFeatures(roadEdgeFeatures, mapPointToS3mLocal2d))
writeGeoJson('building_facility_polygons_s3m_local.geojson', transformFeatures(facilityFeatures, mapPointToS3mLocal2d))

writeCsv('road_network_nodes.csv', roadNodeFeatures)
writeCsv('road_network_edges.csv', roadEdgeFeatures)
writeCsv('building_facility_polygons.csv', facilityFeatures)
writeCsv('entrance_points.csv', entranceFeatures)
writeCsv('s3m_object_footprints.csv', s3mObjectFeatures)

writeQaSvg([...roadPolygons, ...facilityFeatures, ...entranceFeatures, ...roadEdgeFeatures, ...s3mObjectFeatures])
writeManifest({
  generatedAt: new Date().toISOString(),
  map: REAL_MAP,
  datasets: {
    roadPolygons: roadPolygons.length,
    roadNetworkNodes: roadNodeFeatures.length,
    roadNetworkEdges: roadEdgeFeatures.length,
    buildingFacilityPolygons: facilityFeatures.length,
    entrances: entranceFeatures.length,
    s3mObjectFootprints: s3mObjectFeatures.length,
  },
  outputs: fs.readdirSync(dataRoot).sort(),
  nextDesktopSteps: [
    'Import *_map.geojson into iDesktopX as planar meter datasets for current EPSG:0 alignment.',
    'Use road_network_edges_map.geojson and road_network_nodes_map.geojson to build the network dataset.',
    'Compare building_facility_polygons_map.geojson with S3M model and refine facility zones into individual building footprints.',
    'When real CGCS2000/WGS84 control points are available, republish using *_wgs84.geojson or reproject in iDesktopX.',
  ],
})

console.log(JSON.stringify({
  outputRoot,
  roadPolygons: roadPolygons.length,
  roadNetworkNodes: roadNodeFeatures.length,
  roadNetworkEdges: roadEdgeFeatures.length,
  buildingFacilityPolygons: facilityFeatures.length,
  entrances: entranceFeatures.length,
  s3mObjectFootprints: s3mObjectFeatures.length,
}, null, 2))

function buildRoadNetwork(roadItems) {
  const centerlines = roadItems.map((road) => {
    const horizontal = road.w >= road.h
    return {
      id: road.id,
      main: Boolean(road.main),
      direction: horizontal ? 'horizontal' : 'vertical',
      x1: horizontal ? road.x : road.x + road.w / 2,
      y1: horizontal ? road.y + road.h / 2 : road.y,
      x2: horizontal ? road.x + road.w : road.x + road.w / 2,
      y2: horizontal ? road.y + road.h / 2 : road.y + road.h,
      road,
    }
  })

  const pointsByRoad = new Map(centerlines.map((item) => [item.id, [
    { x: item.x1, y: item.y1, kind: 'endpoint' },
    { x: item.x2, y: item.y2, kind: 'endpoint' },
  ]]))

  for (const a of centerlines) {
    for (const b of centerlines) {
      if (a.id >= b.id || a.direction === b.direction) continue
      const h = a.direction === 'horizontal' ? a : b
      const v = a.direction === 'vertical' ? a : b
      const ix = v.x1
      const iy = h.y1
      if (between(ix, h.x1, h.x2) && between(iy, v.y1, v.y2)) {
        pointsByRoad.get(h.id).push({ x: ix, y: iy, kind: 'intersection' })
        pointsByRoad.get(v.id).push({ x: ix, y: iy, kind: 'intersection' })
      }
    }
  }

  const nodeByCoord = new Map()
  const edgesOut = []
  for (const centerline of centerlines) {
    const roadPoints = uniquePoints(pointsByRoad.get(centerline.id))
      .sort((left, right) => centerline.direction === 'horizontal' ? left.x - right.x : left.y - right.y)
    for (let index = 0; index < roadPoints.length - 1; index += 1) {
      const from = roadPoints[index]
      const to = roadPoints[index + 1]
      if (distance(from, to) < 0.1) continue
      const fromNode = getNode(nodeByCoord, from)
      const toNode = getNode(nodeByCoord, to)
      edgesOut.push({
        id: `${centerline.id}-edge-${String(index + 1).padStart(2, '0')}`,
        roadId: centerline.id,
        fromNode: fromNode.id,
        toNode: toNode.id,
        main: centerline.main,
        direction: centerline.direction,
        length: distance(from, to),
        points: [from, to],
      })
      fromNode.degree += 1
      toNode.degree += 1
    }
  }

  return {
    nodes: [...nodeByCoord.values()].map((node) => ({
      ...node,
      kind: node.degree > 2 ? 'intersection' : 'endpoint_or_junction',
    })),
    edges: edgesOut,
  }
}

function getNode(nodeByCoord, pointValue) {
  const key = `${round(pointValue.x)}:${round(pointValue.y)}`
  if (!nodeByCoord.has(key)) {
    const id = `node-${String(nodeByCoord.size + 1).padStart(3, '0')}`
    nodeByCoord.set(key, { id, x: round(pointValue.x), y: round(pointValue.y), degree: 0 })
  }
  return nodeByCoord.get(key)
}

function uniquePoints(items) {
  const seen = new Map()
  for (const item of items) {
    seen.set(`${round(item.x)}:${round(item.y)}`, { x: round(item.x), y: round(item.y), kind: item.kind })
  }
  return [...seen.values()]
}

function feature(geometry, properties) {
  const centroid = centroidOfGeometry(geometry)
  const geo = coordinate.worldToGeo(centroid.x, centroid.y)
  const s3m = mapPointToS3mLocal2d([centroid.x, centroid.y])
  return {
    type: 'Feature',
    properties: {
      ...properties,
      mapX: round(centroid.x),
      mapY: round(centroid.y),
      s3mX: round(s3m[0]),
      s3mY: round(s3m[1]),
      longitude: Number(geo.longitude.toFixed(8)),
      latitude: Number(geo.latitude.toFixed(8)),
    },
    geometry,
  }
}

function point(x, y) {
  return { type: 'Point', coordinates: [round(x), round(y)] }
}

function line(points) {
  return { type: 'LineString', coordinates: points.map((item) => [round(item.x), round(item.y)]) }
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

function localBoundsToMapPolygon(bounds) {
  const leftTop = s3mLocalToMapPoint([Number(bounds.left), Number(bounds.top)])
  const rightBottom = s3mLocalToMapPoint([Number(bounds.right), Number(bounds.bottom)])
  return rectPolygon(leftTop.x, leftTop.y, rightBottom.x - leftTop.x, rightBottom.y - leftTop.y)
}

function centroidOfGeometry(geometry) {
  if (geometry.type === 'Point') return { x: geometry.coordinates[0], y: geometry.coordinates[1] }
  const coordinates = geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates[0]
  const open = coordinates.filter((item, index) => index === 0 || item[0] !== coordinates[0][0] || item[1] !== coordinates[0][1])
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
  if (geometry.type === 'Point') {
    return { ...geometry, coordinates: transform(geometry.coordinates) }
  }
  if (geometry.type === 'LineString') {
    return { ...geometry, coordinates: geometry.coordinates.map(transform) }
  }
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

function s3mLocalToMapPoint(coordinatesValue) {
  const nx = (coordinatesValue[0] - S3M_BOUNDS.left) / (S3M_BOUNDS.right - S3M_BOUNDS.left)
  const ny = (S3M_BOUNDS.top - coordinatesValue[1]) / (S3M_BOUNDS.top - S3M_BOUNDS.bottom)
  return {
    x: round(nx * REAL_MAP.width),
    y: round(ny * REAL_MAP.height),
  }
}

function writeGeoJson(fileName, features) {
  fs.writeFileSync(
    path.join(dataRoot, fileName),
    `${JSON.stringify({
      type: 'FeatureCollection',
      name: fileName.replace(/\.geojson$/, ''),
      crs: { type: 'name', properties: { name: 'local-planar-meter-current-epsg0' } },
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
  const width = 1587.2
  const height = 947.2
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    '<rect width="100%" height="100%" fill="#111827"/>',
    '<g opacity="0.55">',
    ...roadPolygons.map((item) => polygonSvg(item.geometry, '#6b7280', '#d1d5db', 1)),
    '</g>',
    '<g opacity="0.55">',
    ...facilityFeatures.map((item) => polygonSvg(item.geometry, '#2563eb', '#93c5fd', 2)),
    '</g>',
    '<g opacity="0.95">',
    ...roadEdgeFeatures.map((item) => lineSvg(item.geometry, item.properties.main ? '#facc15' : '#22d3ee', item.properties.main ? 4 : 2)),
    '</g>',
    '<g opacity="0.75">',
    ...s3mObjectFeatures.map((item) => polygonSvg(item.geometry, '#f97316', '#fed7aa', 2, true)),
    '</g>',
    ...entranceFeatures.map((item) => pointSvg(item.geometry, item.properties.kind === 'park' ? '#22c55e' : '#f43f5e')),
    '</svg>',
  ]
  fs.writeFileSync(path.join(outputRoot, 'dataset_qa_overlay.svg'), `${parts.join('\n')}\n`, 'utf8')
}

function writeManifest(meta) {
  fs.writeFileSync(path.join(outputRoot, 'dataset_manifest.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
  fs.writeFileSync(path.join(outputRoot, 'README.md'), [
    '# 二维道路与建筑数据集识别成果',
    '',
    `生成时间：${meta.generatedAt}`,
    '',
    '## 数据集',
    '',
    `- 道路面：${meta.datasets.roadPolygons} 条`,
    `- 道路网络节点：${meta.datasets.roadNetworkNodes} 个`,
    `- 道路网络边：${meta.datasets.roadNetworkEdges} 条`,
    `- 建筑/设施区面：${meta.datasets.buildingFacilityPolygons} 个`,
    `- 出入口点：${meta.datasets.entrances} 个`,
    `- 独立 S3M 对象足迹：${meta.datasets.s3mObjectFootprints} 个`,
    '',
    '## 使用方式',
    '',
    '1. 在 iDesktopX 中优先导入 `supermap_import/*_map.geojson`，坐标单位为当前园区平面米制坐标。',
    '2. 用 `road_network_edges_map.geojson` 和 `road_network_nodes_map.geojson` 构建二维道路网络数据集。',
    '3. 用 `building_facility_polygons_map.geojson` 作为建筑/设施识别底稿，对照三维模型逐栋精修。',
    '4. `s3m_object_footprints_map.geojson` 来自独立 SCP 的 geoBounds，可辅助确认厂房和设备对象位置。',
    '5. 当前三维瓦片仍是 EPSG:0，本数据先服务当前模型贴合；真实 CRS 需后续 iDesktopX 控制点重处理。',
    '',
  ].join('\n'), 'utf8')
}

function polygonSvg(geometry, fill, stroke, strokeWidth, dashed = false) {
  const points = geometry.coordinates[0].map((item) => item.join(',')).join(' ')
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dashed ? ' stroke-dasharray="8 5"' : ''}/>`
}

function lineSvg(geometry, stroke, strokeWidth) {
  const points = geometry.coordinates.map((item) => item.join(',')).join(' ')
  return `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`
}

function pointSvg(geometry, fill) {
  return `<circle cx="${geometry.coordinates[0]}" cy="${geometry.coordinates[1]}" r="8" fill="${fill}" stroke="#fff" stroke-width="2"/>`
}

function between(value, a, b) {
  return value >= Math.min(a, b) - 0.001 && value <= Math.max(a, b) + 0.001
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits))
}

function csvEscape(value) {
  if (value === undefined || value === null) return ''
  const stringValue = String(value)
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue
}
