import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SERVICE_BASE = 'http://8.130.175.232:18090/iserver/services/data-chemical_park_vectors_cgcs2000/rest'
const DATASOURCE = 'chemical_park_vectors_cgcs2000'
const OUT_DIR = 'G:/竞赛/超图杯/报告素材/NetworkAnalysis发布验收'

const DATASETS = {
  buildings: 'Park_BuildingFootprint_R',
  roads: 'Park_RoadNetworkEdge_L',
  entrances: 'Park_EntrancePoint_P',
}

const ROAD_RENDER_WIDTH = 10
const POINT_QUERY = { x: 458970.343, y: 3855563.172, toleranceMeters: 35 }

function datasetFeaturesUrl(datasetName) {
  return `${SERVICE_BASE}/data/datasources/${encodeURIComponent(DATASOURCE)}/datasets/${encodeURIComponent(datasetName)}/features.rjson?fromIndex=0&toIndex=999`
}

function proxiedFeatureUrl(url) {
  return `${url}.rjson`
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`)
  }
  return response.json()
}

async function fetchDataset(datasetName) {
  const list = await fetchJson(datasetFeaturesUrl(datasetName))
  const childUriList = Array.isArray(list.childUriList) ? list.childUriList : []
  const features = await Promise.all(childUriList.map(url => fetchJson(proxiedFeatureUrl(url))))
  return {
    datasetName,
    featureCount: list.featureCount ?? features.length,
    geometryType: list.geometryType,
    features,
  }
}

function fieldsOf(feature) {
  const fields = {}
  const names = feature.fieldNames || []
  const values = feature.fieldValues || []
  names.forEach((name, index) => {
    fields[String(name).toUpperCase()] = values[index] == null ? '' : String(values[index])
  })
  return fields
}

function numberValue(value, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function stringValue(fields, name, fallback = '') {
  const value = fields[String(name).toUpperCase()]
  return value == null || value === '' ? fallback : String(value)
}

function pointOf(feature) {
  const center = feature.geometry?.center || feature.geometry?.points?.[0] || {}
  return { x: numberValue(center.x), y: numberValue(center.y) }
}

function boundsOf(feature) {
  const points = feature.geometry?.points || []
  if (!points.length) {
    const center = pointOf(feature)
    return { x: center.x, y: center.y, w: 1, h: 1, cx: center.x, cy: center.y }
  }
  const xs = points.map(point => numberValue(point.x))
  const ys = points.map(point => numberValue(point.y))
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  }
}

function distanceToBounds(point, bounds) {
  const dx = Math.max(bounds.x - point.x, 0, point.x - (bounds.x + bounds.w))
  const dy = Math.max(bounds.y - point.y, 0, point.y - (bounds.y + bounds.h))
  return Math.sqrt(dx * dx + dy * dy)
}

function featureSummary(datasetName, feature, distanceMeters) {
  const fields = fieldsOf(feature)
  const bounds = boundsOf(feature)
  return {
    datasetName,
    smId: String(feature.ID ?? stringValue(fields, 'SMID')),
    id: stringValue(fields, 'ID', stringValue(fields, 'BUILDING_ID', String(feature.ID ?? ''))),
    name: stringValue(fields, 'NAME', stringValue(fields, 'LABEL', '')),
    type: stringValue(fields, 'TYPE', stringValue(fields, 'KIND', '')),
    isHazard: /^(1|true|yes)$/i.test(stringValue(fields, 'IS_HAZARD')),
    centroid: { x: round2(bounds.cx), y: round2(bounds.cy) },
    distanceMeters: distanceMeters == null ? undefined : round2(distanceMeters),
  }
}

function queryById(datasetName, features, id) {
  const target = String(id)
  const matched = features.find((feature) => {
    const fields = fieldsOf(feature)
    return String(feature.ID ?? '') === target
      || stringValue(fields, 'SMID') === target
      || stringValue(fields, 'ID') === target
      || stringValue(fields, 'BUILDING_ID') === target
  })
  return matched ? featureSummary(datasetName, matched) : null
}

function queryAtPoint(datasetName, features, point) {
  return features
    .map(feature => ({ feature, distance: distanceToBounds(point, boundsOf(feature)) }))
    .filter(item => item.distance <= point.toleranceMeters)
    .sort((a, b) => a.distance - b.distance)
    .map(item => featureSummary(datasetName, item.feature, item.distance))
}

function roadRect(feature) {
  const fields = fieldsOf(feature)
  const points = feature.geometry?.points || []
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  const x1 = numberValue(first.x)
  const y1 = numberValue(first.y)
  const x2 = numberValue(last.x)
  const y2 = numberValue(last.y)
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
  const id = stringValue(fields, 'ID', String(feature.ID ?? 'road'))
  if (horizontal) {
    return {
      id,
      x: Math.min(x1, x2),
      y: y1 - ROAD_RENDER_WIDTH / 2,
      w: Math.max(1, Math.abs(x2 - x1)),
      h: ROAD_RENDER_WIDTH,
    }
  }
  return {
    id,
    x: x1 - ROAD_RENDER_WIDTH / 2,
    y: Math.min(y1, y2),
    w: ROAD_RENDER_WIDTH,
    h: Math.max(1, Math.abs(y2 - y1)),
  }
}

function rectsIntersect(a, b) {
  return a.x <= b.x + b.w
    && a.x + a.w >= b.x
    && a.y <= b.y + b.h
    && a.y + a.h >= b.y
}

function cellRect(cell) {
  const size = Math.max(1, numberValue(cell.size, 1))
  return {
    x: numberValue(cell.x) - size / 2,
    y: numberValue(cell.y) - size / 2,
    w: size,
    h: size,
  }
}

function buildDemoDiffusionFrame() {
  const cells = []
  const center = { x: 458650, y: 3855780 }
  const spacing = 35
  for (let ix = -4; ix <= 4; ix += 1) {
    for (let iy = -4; iy <= 4; iy += 1) {
      const distance = Math.hypot(ix, iy)
      const concentration = Math.max(0, 100 - distance * 18)
      if (concentration <= 0) continue
      cells.push({
        x: center.x + ix * spacing,
        y: center.y + iy * spacing,
        size: 42,
        concentration: round2(concentration),
        level: concentration >= 65 ? 'danger' : concentration >= 30 ? 'warning' : 'affected',
      })
    }
  }
  return { maxConcentration: 100, cells }
}

function analyzeOverlay({ buildings, roads, entrances, frame }) {
  const affectedCells = frame.cells.filter(cell => numberValue(cell.concentration) > 0)
  const dangerCells = frame.cells.filter(cell => cell.level === 'danger' || numberValue(cell.concentration) >= frame.maxConcentration * 0.65)
  const affectedRects = affectedCells.map(cell => ({ cell, rect: cellRect(cell) }))
  const dangerRects = dangerCells.map(cell => ({ cell, rect: cellRect(cell) }))

  const affectedFacilities = buildings.features.flatMap((feature) => {
    const rect = boundsOf(feature)
    const hits = affectedRects.filter(item => rectsIntersect(rect, item.rect))
    if (!hits.length) return []
    const maxHit = hits.reduce((best, item) => (item.cell.concentration > best.cell.concentration ? item : best), hits[0])
    return [{ ...featureSummary(buildings.datasetName, feature), maxConcentration: maxHit.cell.concentration, maxLevel: maxHit.cell.level }]
  })

  const blockedRoads = roads.features.flatMap((feature) => {
    const rect = roadRect(feature)
    if (!rect) return []
    const hits = dangerRects.filter(item => rectsIntersect(rect, item.rect))
    if (!hits.length) return []
    return [{ ...featureSummary(roads.datasetName, feature), reason: 'diffusion-danger-overlay' }]
  })

  const candidateExits = entrances.features
    .map((feature) => {
      const point = pointOf(feature)
      const nearestDangerDistance = dangerRects.reduce((min, item) => (
        Math.min(min, Math.hypot(point.x - item.cell.x, point.y - item.cell.y))
      ), Number.POSITIVE_INFINITY)
      return {
        ...featureSummary(entrances.datasetName, feature),
        score: Number.isFinite(nearestDangerDistance) ? round2(nearestDangerDistance) : 999999,
        status: nearestDangerDistance <= 50 ? 'risk-adjacent' : 'candidate',
      }
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'candidate' ? -1 : 1
      return b.score - a.score
    })

  return {
    executor: 'iclient2d-overlay',
    note: '当前验收为 SuperMap iServer Data 几何读取后的前端/iClient2D 叠加分析，不等同于已发布 iServer Spatial Analyst 或 Transportation Analyst 服务。',
    coordinateSystem: {
      coordSys: 'CGCS2000_3GK_CM_114E',
      epsg: 4547,
      geographicEpsg: 4490,
    },
    summary: {
      affectedFacilityCount: affectedFacilities.length,
      blockedRoadCount: blockedRoads.length,
      candidateExitCount: candidateExits.filter(exit => exit.status === 'candidate').length,
      dangerCellCount: dangerCells.length,
      affectedCellCount: affectedCells.length,
    },
    affectedFacilities: affectedFacilities.slice(0, 20),
    blockedRoads: blockedRoads.slice(0, 30),
    candidateExits: candidateExits.slice(0, 14),
  }
}

function round2(value) {
  return Math.round(numberValue(value) * 100) / 100
}

function markdownReport(result) {
  return `# Network/Data/Overlay 验收记录

时间：${new Date().toLocaleString('zh-CN', { hour12: false })}

## 结论

- 已完成：iServer Data 属性查询、CGCS2000 点缓冲查询、扩散风险区与道路/建筑/出口的前端几何叠加验收。
- 未完成：化工园区专属 iServer Transportation/Network Analysis 服务尚未发布；本次结果不是 SuperMap 网络分析服务输出。
- 未完成：CGCS2000 三维 Realspace 尚未发布；旧三维服务仍是 \`epsg:0\` 回滚场景。

## 数据源

- Data 服务：${SERVICE_BASE}
- 数据源：\`${DATASOURCE}\`
- 坐标系：\`EPSG:4547 / CGCS2000_3GK_CM_114E\`

## 数据集记录数

| 数据集 | 类型 | 记录数 |
|---|---|---:|
| \`${DATASETS.buildings}\` | 建筑面 | ${result.datasets.buildings.featureCount} |
| \`${DATASETS.roads}\` | 道路线 | ${result.datasets.roads.featureCount} |
| \`${DATASETS.entrances}\` | 出入口点 | ${result.datasets.entrances.featureCount} |

## 查询验收

- 建筑按 ID/SmID 查询：${result.queries.byId.building ? '成功' : '失败'}
- 道路按 ID/SmID 查询：${result.queries.byId.road ? '成功' : '失败'}
- 出入口按 ID/SmID 查询：${result.queries.byId.entrance ? '成功' : '失败'}
- CGCS2000 点查询：点 \`${POINT_QUERY.x}, ${POINT_QUERY.y}\`，容差 \`${POINT_QUERY.toleranceMeters}m\`，命中 ${result.queries.point.totalHits} 条。

## 扩散叠加验收

- 执行器：\`${result.overlay.executor}\`
- 危险网格：${result.overlay.summary.dangerCellCount}
- 受影响设施：${result.overlay.summary.affectedFacilityCount}
- 阻断道路：${result.overlay.summary.blockedRoadCount}
- 候选出口：${result.overlay.summary.candidateExitCount}

## 严格说明

当前叠加分析使用的是 SuperMap iServer Data 返回的 CGCS2000 几何，由前端/iClient2D 侧完成矩形相交和距离排序。它能证明数据接入、空间坐标和业务 payload 可用，但不能替代 iDesktopX 构建网络数据集后发布的 iServer Transportation Analyst 服务。
`
}

async function main() {
  const [buildings, roads, entrances] = await Promise.all([
    fetchDataset(DATASETS.buildings),
    fetchDataset(DATASETS.roads),
    fetchDataset(DATASETS.entrances),
  ])

  const result = {
    serviceBase: SERVICE_BASE,
    datasource: DATASOURCE,
    generatedAt: new Date().toISOString(),
    datasets: {
      buildings: { datasetName: buildings.datasetName, featureCount: buildings.featureCount, geometryType: buildings.geometryType },
      roads: { datasetName: roads.datasetName, featureCount: roads.featureCount, geometryType: roads.geometryType },
      entrances: { datasetName: entrances.datasetName, featureCount: entrances.featureCount, geometryType: entrances.geometryType },
    },
    queries: {
      byId: {
        building: queryById(buildings.datasetName, buildings.features, buildings.features[0]?.ID),
        road: queryById(roads.datasetName, roads.features, roads.features[0]?.ID),
        entrance: queryById(entrances.datasetName, entrances.features, entrances.features[0]?.ID),
      },
      point: {
        input: POINT_QUERY,
        hits: [
          ...queryAtPoint(buildings.datasetName, buildings.features, POINT_QUERY),
          ...queryAtPoint(roads.datasetName, roads.features, POINT_QUERY),
          ...queryAtPoint(entrances.datasetName, entrances.features, POINT_QUERY),
        ],
      },
    },
    overlay: analyzeOverlay({
      buildings,
      roads,
      entrances,
      frame: buildDemoDiffusionFrame(),
    }),
  }
  result.queries.point.totalHits = result.queries.point.hits.length

  await mkdir(OUT_DIR, { recursive: true })
  const jsonPath = path.join(OUT_DIR, 'cgcs2000_data_query_overlay_validation.json')
  const mdPath = path.join(OUT_DIR, 'network_data_overlay_validation.md')
  await writeFile(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
  await writeFile(mdPath, markdownReport(result), 'utf8')
  console.log(JSON.stringify({
    ok: true,
    jsonPath,
    mdPath,
    datasets: result.datasets,
    pointHits: result.queries.point.totalHits,
    overlay: result.overlay.summary,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
