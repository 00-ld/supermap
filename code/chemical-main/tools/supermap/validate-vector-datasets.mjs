import fs from 'node:fs'
import path from 'node:path'

const root = 'G:/竞赛/超图杯/报告素材/二维数据集识别'
const dataRoot = path.join(root, 'supermap_import')
const reportPath = path.join(root, 'dataset_validation_report.json')
const markdownPath = path.join(root, 'dataset_validation_report.md')

const roads = load('road_network_edges_map.geojson')
const nodes = load('road_network_nodes_map.geojson')
const roadPolygons = load('road_polygons_map.geojson')
const buildings = load('building_facility_polygons_map.geojson')
const entrances = load('entrance_points_map.geojson')
const s3mFootprints = load('s3m_object_footprints_map.geojson')

const nodeById = new Map(nodes.map((item) => [item.properties.id, item]))
const graph = new Map(nodes.map((item) => [item.properties.id, new Set()]))
const edgeIssues = []
let totalEdgeLength = 0

for (const edge of roads) {
  const from = edge.properties.fromNode
  const to = edge.properties.toNode
  const fromNode = nodeById.get(from)
  const toNode = nodeById.get(to)
  if (!fromNode || !toNode) {
    edgeIssues.push({ edge: edge.properties.id, issue: 'missing from/to node' })
    continue
  }
  const coords = edge.geometry.coordinates
  const length = distance(coords[0], coords[coords.length - 1])
  totalEdgeLength += length
  if (Math.abs(length - Number(edge.properties.length_m)) > 0.01) {
    edgeIssues.push({ edge: edge.properties.id, issue: 'length mismatch', computed: length, recorded: edge.properties.length_m })
  }
  graph.get(from).add(to)
  graph.get(to).add(from)
}

const components = connectedComponents(graph)
const isolatedNodes = nodes.filter((item) => (graph.get(item.properties.id)?.size || 0) === 0)
const deadEnds = nodes.filter((item) => (graph.get(item.properties.id)?.size || 0) === 1)

const buildingRoadChecks = buildings.map((building) => {
  const center = centroid(building.geometry)
  const nearestRoad = nearestLine(center, roads)
  return {
    id: building.properties.id,
    name: building.properties.name,
    facilityType: building.properties.facilityType,
    nearestRoadId: nearestRoad.id,
    nearestRoadDistanceM: round(nearestRoad.distance),
    needsDesktopRefinement: building.properties.needsDesktopRefinement === true,
  }
})

const entranceChecks = entrances.map((entrance) => {
  const p = entrance.geometry.coordinates
  const nearestRoad = nearestLine({ x: p[0], y: p[1] }, roads)
  return {
    id: entrance.properties.id,
    kind: entrance.properties.kind,
    parentId: entrance.properties.parentId || '',
    label: entrance.properties.label,
    nearestRoadId: nearestRoad.id,
    nearestRoadDistanceM: round(nearestRoad.distance),
    status: nearestRoad.distance <= 25 ? 'ok' : 'review',
  }
})

const report = {
  generatedAt: new Date().toISOString(),
  dataSource: {
    udbx: path.join(root, 'supermap_udbx', 'chemical_park_vectors.udbx'),
    geojsonDirectory: dataRoot,
  },
  counts: {
    roadPolygons: roadPolygons.length,
    roadNetworkNodes: nodes.length,
    roadNetworkEdges: roads.length,
    buildingFacilityPolygons: buildings.length,
    entrances: entrances.length,
    s3mObjectFootprints: s3mFootprints.length,
  },
  network: {
    componentCount: components.length,
    largestComponentNodeCount: Math.max(...components.map((item) => item.length)),
    isolatedNodeCount: isolatedNodes.length,
    deadEndNodeCount: deadEnds.length,
    totalEdgeLengthM: round(totalEdgeLength),
    edgeIssueCount: edgeIssues.length,
    edgeIssues,
    components: components.map((item, index) => ({ index: index + 1, nodeCount: item.length, nodes: item })),
  },
  buildingRoadChecks,
  entranceChecks,
  conclusions: [
    components.length === 1
      ? 'Road network is topologically connected as a single component.'
      : `Road network has ${components.length} components and needs topology review.`,
    edgeIssues.length === 0
      ? 'All road edges reference valid nodes and recorded lengths match geometry.'
      : `${edgeIssues.length} road edge issues were found.`,
    'Building polygons are current facility-zone footprints and must be refined into single-building footprints in iDesktopX before final public data publication.',
    entranceChecks.filter((item) => item.status === 'review').length === 0
      ? 'All entrances are within the 25 m snapping tolerance from the road centerline.'
      : 'Entrances marked review should be snapped to the nearest network edge or adjusted manually in iDesktopX.',
  ],
}

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
fs.writeFileSync(markdownPath, toMarkdown(report), 'utf8')
console.log(JSON.stringify({
  reportPath,
  markdownPath,
  counts: report.counts,
  network: report.network,
  reviewEntrances: entranceChecks.filter((item) => item.status === 'review'),
}, null, 2))

function load(fileName) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, fileName), 'utf8')).features
}

function connectedComponents(graphMap) {
  const seen = new Set()
  const result = []
  for (const node of graphMap.keys()) {
    if (seen.has(node)) continue
    const stack = [node]
    const component = []
    seen.add(node)
    while (stack.length) {
      const current = stack.pop()
      component.push(current)
      for (const next of graphMap.get(current) || []) {
        if (!seen.has(next)) {
          seen.add(next)
          stack.push(next)
        }
      }
    }
    result.push(component.sort())
  }
  return result.sort((left, right) => right.length - left.length)
}

function nearestLine(point, lines) {
  let best = { id: '', distance: Number.POSITIVE_INFINITY }
  for (const lineFeature of lines) {
    const coords = lineFeature.geometry.coordinates
    for (let index = 0; index < coords.length - 1; index += 1) {
      const distanceValue = pointToSegmentDistance(point, coords[index], coords[index + 1])
      if (distanceValue < best.distance) {
        best = { id: lineFeature.properties.id, distance: distanceValue }
      }
    }
  }
  return best
}

function pointToSegmentDistance(point, a, b) {
  const ax = a[0]
  const ay = a[1]
  const bx = b[0]
  const by = b[1]
  const dx = bx - ax
  const dy = by - ay
  if (dx === 0 && dy === 0) return Math.hypot(point.x - ax, point.y - ay)
  const t = Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.y - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(point.x - (ax + t * dx), point.y - (ay + t * dy))
}

function centroid(geometry) {
  const coords = geometry.type === 'Polygon' ? geometry.coordinates[0].slice(0, -1) : geometry.coordinates
  const sum = coords.reduce((acc, item) => ({ x: acc.x + item[0], y: acc.y + item[1] }), { x: 0, y: 0 })
  return { x: sum.x / coords.length, y: sum.y / coords.length }
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function round(value, digits = 3) {
  return Number(Number(value).toFixed(digits))
}

function toMarkdown(reportValue) {
  const reviewEntrances = reportValue.entranceChecks.filter((item) => item.status === 'review')
  return [
    '# 二维道路与建筑数据集校核报告',
    '',
    `生成时间：${reportValue.generatedAt}`,
    '',
    '## 数据量',
    '',
    `- 道路面：${reportValue.counts.roadPolygons}`,
    `- 道路网络节点：${reportValue.counts.roadNetworkNodes}`,
    `- 道路网络边：${reportValue.counts.roadNetworkEdges}`,
    `- 建筑/设施区面：${reportValue.counts.buildingFacilityPolygons}`,
    `- 出入口点：${reportValue.counts.entrances}`,
    `- S3M 对象足迹：${reportValue.counts.s3mObjectFootprints}`,
    '',
    '## 道路网络拓扑',
    '',
    `- 连通分量：${reportValue.network.componentCount}`,
    `- 最大连通分量节点数：${reportValue.network.largestComponentNodeCount}`,
    `- 孤立节点：${reportValue.network.isolatedNodeCount}`,
    `- 断头节点：${reportValue.network.deadEndNodeCount}`,
    `- 网络边总长度：${reportValue.network.totalEdgeLengthM} m`,
    `- 边字段问题：${reportValue.network.edgeIssueCount}`,
    '',
    '## 出入口校核',
    '',
    reviewEntrances.length
      ? `以下 ${reviewEntrances.length} 个出入口距离道路中心线超过 25m，建议在 iDesktopX 中吸附到道路网络：`
      : '所有出入口距离道路中心线不超过 25m。',
    ...reviewEntrances.map((item) => `- ${item.id} / ${item.label}：距 ${item.nearestRoadId} ${item.nearestRoadDistanceM}m`),
    '',
    '## 结论',
    '',
    ...reportValue.conclusions.map((item) => `- ${item}`),
    '',
  ].join('\n')
}
