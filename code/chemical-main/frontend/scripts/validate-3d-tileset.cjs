const fs = require('fs')
const path = require('path')

const tilesetPath = path.resolve(
  process.cwd(),
  process.argv[2] || 'public/pic/chemical-park-3dtiles/tileset_zhengzhou_57083.json',
)
const errors = []
const visitedJsonPaths = new Set()
let nodeCount = 0
let contentCount = 0

function report(filePath, message) {
  errors.push(`${path.relative(process.cwd(), filePath)}: ${message}`)
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function validateBoundingVolume(filePath, boundingVolume) {
  if (!boundingVolume || typeof boundingVolume !== 'object') {
    report(filePath, '节点缺少 boundingVolume')
    return
  }
  const values = Object.values(boundingVolume).find(Array.isArray)
  if (!values || !values.every(isFiniteNumber)) {
    report(filePath, 'boundingVolume 不是完整的有限数值数组')
  }
}

function validateNode(filePath, node, parentGeometricError) {
  nodeCount += 1
  const geometricError = Number(node?.geometricError)
  if (!Number.isFinite(geometricError) || geometricError < 0) {
    report(filePath, '节点 geometricError 必须为非负有限数值')
  }
  if (
    Number.isFinite(parentGeometricError) &&
    Number.isFinite(geometricError) &&
    geometricError > parentGeometricError + 1e-6
  ) {
    report(
      filePath,
      `子节点 geometricError ${geometricError} 大于父节点 ${parentGeometricError}`,
    )
  }
  validateBoundingVolume(filePath, node?.boundingVolume)

  const contentUri = node?.content?.uri || node?.content?.url
  if (typeof contentUri === 'string') {
    contentCount += 1
    const contentPath = path.resolve(path.dirname(filePath), contentUri)
    if (!fs.existsSync(contentPath)) {
      report(filePath, `content 不存在：${contentUri}`)
    } else if (contentPath.toLowerCase().endsWith('.json')) {
      validateTilesetJson(contentPath)
    }
  }
  for (const child of node?.children || []) {
    validateNode(filePath, child, geometricError)
  }
}

function validateTilesetJson(filePath) {
  if (visitedJsonPaths.has(filePath)) return
  visitedJsonPaths.add(filePath)
  let payload
  try {
    payload = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    report(filePath, `JSON 无法解析：${error.message}`)
    return
  }
  if (!payload.root || typeof payload.root !== 'object') {
    report(filePath, '缺少 root 节点')
    return
  }
  if (payload.root.transform) {
    if (
      !Array.isArray(payload.root.transform) ||
      payload.root.transform.length !== 16 ||
      !payload.root.transform.every(isFiniteNumber)
    ) {
      report(filePath, 'root.transform 必须是 16 个有限数值')
    }
  }
  validateNode(filePath, payload.root, undefined)
}

if (!fs.existsSync(tilesetPath)) {
  console.error(`找不到 tileset：${tilesetPath}`)
  process.exitCode = 1
} else {
  validateTilesetJson(tilesetPath)
  const summary = `3D Tiles 验收：${visitedJsonPaths.size} 个 JSON，${nodeCount} 个节点，${contentCount} 个 content，${errors.length} 个错误。`
  if (errors.length) {
    console.error(summary)
    errors.slice(0, 80).forEach((error) => console.error(`- ${error}`))
    if (errors.length > 80) console.error(`- 其余 ${errors.length - 80} 个错误已省略`)
    process.exitCode = 1
  } else {
    console.log(summary)
  }
}
