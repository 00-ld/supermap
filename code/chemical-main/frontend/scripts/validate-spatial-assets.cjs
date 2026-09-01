const fs = require('node:fs')
const path = require('node:path')

const registryPath = path.resolve(
  __dirname,
  '../src/config/spatial-assets.4490.json',
)
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
const footprintPath = path.resolve(
  __dirname,
  '../public/data/Park_S3MObjectFootprint_2D.geojson',
)
const footprints = JSON.parse(fs.readFileSync(footprintPath, 'utf8')).features
const errors = []
const ids = new Set()
const modelObjectIds = new Set()
const sceneBounds = registry.sceneBounds || {}
const modelInsertionPoint = registry.modelInsertionPoint4490 || {}
const analysisFrame = registry.analysisFrameLocalMeters || {}
const latestPublishedModelNames = new Map([
  [3, '输气管道'],
  [17, '立式缓冲罐011'],
  [34, '立式架空常压储罐009'],
  [42, '立式固定顶储罐'],
  [79, '立式压力容器001'],
  [3156, '3号输气管道'],
])

function isFinitePoint(point, fields) {
  return Boolean(
    point && fields.every((field) => Number.isFinite(point[field])),
  )
}

function validateCamera(assetId, camera) {
  if (
    !camera ||
    !Number.isFinite(camera.headingDegrees) ||
    !Number.isFinite(camera.pitchDegrees) ||
    camera.pitchDegrees < -80 ||
    camera.pitchDegrees > -5 ||
    !Number.isFinite(camera.distanceMeters) ||
    camera.distanceMeters < 20 ||
    camera.distanceMeters > 1500 ||
    !Number.isFinite(camera.fieldOfViewDegrees) ||
    camera.fieldOfViewDegrees < 20 ||
    camera.fieldOfViewDegrees > 60
  ) {
    errors.push(`资产 ${assetId} 缺少有效近景相机参数`)
  }
}

function validateModelSurfaceBinding(asset, assetId) {
  if (!isFinitePoint(asset.modelLocalEnuMeters, ['east', 'north', 'up'])) {
    errors.push(`资产 ${assetId} 缺少有效模型 ENU 锚点`)
    return
  }
  if (
    !Number.isFinite(modelInsertionPoint.longitude) ||
    !Number.isFinite(modelInsertionPoint.latitude)
  ) {
    errors.push('缺少有效 modelInsertionPoint4490')
    return
  }
  const metersPerDegreeLatitude = 111320
  const metersPerDegreeLongitude =
    metersPerDegreeLatitude *
    Math.cos((modelInsertionPoint.latitude * Math.PI) / 180)
  const derivedEast =
    (asset.longitude - modelInsertionPoint.longitude) * metersPerDegreeLongitude
  const derivedNorth =
    (asset.latitude - modelInsertionPoint.latitude) * metersPerDegreeLatitude
  const horizontalErrorMeters = Math.hypot(
    derivedEast - asset.modelLocalEnuMeters.east,
    derivedNorth - asset.modelLocalEnuMeters.north,
  )
  if (horizontalErrorMeters > 3) {
    errors.push(
      `资产 ${assetId} 的 4490 与模型 ENU 锚点偏差 ${horizontalErrorMeters.toFixed(2)}m`,
    )
  }
}

function validatePublishedModelObject(asset, assetId) {
  if (!Number.isInteger(asset.modelSmId) || asset.modelSmId <= 0) {
    errors.push(`资产 ${assetId} 缺少有效 modelSmId`)
    return
  }
  if (!asset.modelDataset || !asset.modelName || !asset.bindingMethod) {
    errors.push(`资产 ${assetId} 缺少模型数据集、模型名称或绑定方法`)
    return
  }
  if (asset.modelDataset === 'modelComposeResult@huagong-finally-fbx-4490') {
    const expectedModelName = latestPublishedModelNames.get(asset.modelSmId)
    if (!expectedModelName) {
      errors.push(
        `资产 ${assetId} 的 SmID=${asset.modelSmId} 不在最新 4490 泄漏源白名单`,
      )
    } else if (expectedModelName !== asset.modelName) {
      errors.push(
        `资产 ${assetId} 的 SmID=${asset.modelSmId} 最新 ModelName 应为 ${expectedModelName}，不是 ${asset.modelName}`,
      )
    }
    if (!asset.modelObjectId.endsWith(`SmID=${asset.modelSmId}`)) {
      errors.push(`资产 ${assetId} 的 modelObjectId 与 modelSmId 不一致`)
    }
    return
  }
  const feature = footprints[asset.modelSmId - 1]
  const properties = feature && feature.properties
  if (!properties) {
    errors.push(
      `资产 ${assetId} 的 SmID=${asset.modelSmId} 不存在于发布足迹数据`,
    )
    return
  }
  if (properties.name !== asset.modelName) {
    errors.push(
      `资产 ${assetId} 的 SmID=${asset.modelSmId} 实际为 ${properties.name}，不是 ${asset.modelName}`,
    )
  }
  if (!asset.modelObjectId.endsWith(`SmID=${asset.modelSmId}`)) {
    errors.push(`资产 ${assetId} 的 modelObjectId 与 modelSmId 不一致`)
  }
  const projectedOrigin = analysisFrame.modelInsertionPoint4547 || {}
  if (
    projectedOrigin.epsg !== 4547 ||
    !Number.isFinite(projectedOrigin.easting) ||
    !Number.isFinite(projectedOrigin.northing)
  ) {
    errors.push('二维米制适配层缺少模型插入点 EPSG:4547')
    return
  }
  const projectedX = projectedOrigin.easting + asset.modelLocalEnuMeters.east
  const projectedY = projectedOrigin.northing + asset.modelLocalEnuMeters.north
  const toleranceMeters = 0.8
  if (
    projectedX < properties.s3mLeft - toleranceMeters ||
    projectedX > properties.s3mRight + toleranceMeters ||
    projectedY < properties.s3mBottom - toleranceMeters ||
    projectedY > properties.s3mTop + toleranceMeters
  ) {
    errors.push(`资产 ${assetId} 的锚点未落在 ${asset.modelName} 模型足迹内`)
  }
  if (
    asset.bindingMethod === 'FOOTPRINT_EDGE_BOTTOM' &&
    Math.abs(projectedY - properties.s3mBottom) > toleranceMeters
  ) {
    errors.push(`出入口 ${assetId} 未绑定到 ${asset.modelName} 的南侧边缘`)
  }
  if (
    asset.bindingMethod === 'FOOTPRINT_EDGE_TOP' &&
    Math.abs(projectedY - properties.s3mTop) > toleranceMeters
  ) {
    errors.push(`出入口 ${assetId} 未绑定到 ${asset.modelName} 的北侧边缘`)
  }
}

function modelEnuToAnalysisPoint(modelLocalEnuMeters) {
  if (
    !isFinitePoint(analysisFrame.anchorModelEnuMeters, [
      'east',
      'north',
      'up',
    ]) ||
    !isFinitePoint(analysisFrame.anchorPoint, ['x', 'y']) ||
    !Number.isFinite(analysisFrame.metersPerUnit) ||
    analysisFrame.metersPerUnit <= 0 ||
    analysisFrame.xAxis !== 'east' ||
    analysisFrame.yAxis !== 'south'
  ) {
    errors.push('局部分析坐标适配器配置无效')
    return null
  }
  return {
    x:
      analysisFrame.anchorPoint.x +
      (modelLocalEnuMeters.east - analysisFrame.anchorModelEnuMeters.east) /
        analysisFrame.metersPerUnit,
    y:
      analysisFrame.anchorPoint.y -
      (modelLocalEnuMeters.north - analysisFrame.anchorModelEnuMeters.north) /
        analysisFrame.metersPerUnit,
  }
}

if (registry.crs !== 'EPSG:4490') {
  errors.push(`统一 CRS 必须为 EPSG:4490，当前为 ${registry.crs}`)
}

for (const scene of registry.scenes || []) {
  if (ids.has(scene.id)) errors.push(`重复资产 ID: ${scene.id}`)
  ids.add(scene.id)
  if (!scene.configUrl || !scene.layerName) {
    errors.push(`场景 ${scene.id} 缺少 configUrl/layerName`)
  }
  if (!['EPSG:4490', 'PCS_NON_EARTH_LOCAL_METER'].includes(scene.sourceCrs)) {
    errors.push(`场景 ${scene.id} 的 sourceCrs 不受支持: ${scene.sourceCrs}`)
  }
  validateCamera(scene.id, scene.camera)
}

for (const entrance of registry.entrances || []) {
  if (ids.has(entrance.entranceId)) {
    errors.push(`重复资产 ID: ${entrance.entranceId}`)
  }
  ids.add(entrance.entranceId)
  for (const field of ['facilityId', 'modelObjectId', 'roadNodeId']) {
    if (!entrance[field])
      errors.push(`出入口 ${entrance.entranceId} 缺少 ${field}`)
  }
  if (
    !['PUBLISHED', 'MODEL_SURFACE_BOUND', 'UNVERIFIED'].includes(
      entrance.positionStatus,
    )
  ) {
    errors.push(`出入口 ${entrance.entranceId} 缺少有效 positionStatus`)
  }
  if (modelObjectIds.has(entrance.modelObjectId)) {
    errors.push(`重复模型对象绑定: ${entrance.modelObjectId}`)
  }
  modelObjectIds.add(entrance.modelObjectId)
  if (
    entrance.analysisPoint4547 ||
    entrance.analysisPointLocalMeters ||
    entrance.analysisPoint
  ) {
    errors.push(
      `出入口 ${entrance.entranceId} 禁止保存第二套分析坐标，必须由模型 ENU 锚点派生`,
    )
  }
  validateModelSurfaceBinding(entrance, entrance.entranceId)
  validatePublishedModelObject(entrance, entrance.entranceId)
  const derivedAnalysisPoint = entrance.modelLocalEnuMeters
    ? modelEnuToAnalysisPoint(entrance.modelLocalEnuMeters)
    : null
  if (
    !derivedAnalysisPoint ||
    !Number.isFinite(derivedAnalysisPoint.x) ||
    !Number.isFinite(derivedAnalysisPoint.y)
  ) {
    errors.push(`出入口 ${entrance.entranceId} 无法派生局部米制分析点`)
  }
  validateCamera(entrance.entranceId, entrance.camera)
  const { west, south, east, north } = sceneBounds
  if (
    entrance.longitude < west ||
    entrance.longitude > east ||
    entrance.latitude < south ||
    entrance.latitude > north
  ) {
    errors.push(`出入口 ${entrance.entranceId} 超出主场景 4490 包络`)
  }
}

for (const source of registry.leakSources || []) {
  if (ids.has(source.leakSourceId)) {
    errors.push(`重复资产 ID: ${source.leakSourceId}`)
  }
  ids.add(source.leakSourceId)
  for (const field of [
    'facilityId',
    'modelObjectId',
    'gasCode',
    'equipmentType',
  ]) {
    if (!source[field])
      errors.push(`泄漏源 ${source.leakSourceId} 缺少 ${field}`)
  }
  if (!['PUBLISHED', 'MODEL_SURFACE_BOUND'].includes(source.positionStatus)) {
    errors.push(`泄漏源 ${source.leakSourceId} 尚未绑定模型表面`)
  }
  if (source.sourceShape !== 'VOLUME') {
    errors.push(`泄漏源 ${source.leakSourceId} 必须声明为 VOLUME`)
  }
  if (modelObjectIds.has(source.modelObjectId)) {
    errors.push(`重复模型对象绑定: ${source.modelObjectId}`)
  }
  modelObjectIds.add(source.modelObjectId)
  if (
    source.analysisPoint4547 ||
    source.analysisPointLocalMeters ||
    source.analysisPoint
  ) {
    errors.push(
      `泄漏源 ${source.leakSourceId} 禁止保存第二套分析坐标，必须由模型 ENU 锚点派生`,
    )
  }
  validateModelSurfaceBinding(source, source.leakSourceId)
  validatePublishedModelObject(source, source.leakSourceId)
  if (
    !Array.isArray(source.supportedGasCodes) ||
    !source.supportedGasCodes.includes(source.gasCode)
  ) {
    errors.push(`泄漏源 ${source.leakSourceId} 的气体绑定目录无效`)
  }
  const derivedSourcePoint = source.modelLocalEnuMeters
    ? modelEnuToAnalysisPoint(source.modelLocalEnuMeters)
    : null
  if (
    !derivedSourcePoint ||
    !Number.isFinite(derivedSourcePoint.x) ||
    !Number.isFinite(derivedSourcePoint.y)
  ) {
    errors.push(`泄漏源 ${source.leakSourceId} 无法派生局部米制分析点`)
  }
  const { west, south, east, north } = sceneBounds
  if (
    source.longitude < west ||
    source.longitude > east ||
    source.latitude < south ||
    source.latitude > north
  ) {
    errors.push(`泄漏源 ${source.leakSourceId} 超出主场景 4490 包络`)
  }
  if (
    !source.volumeFence ||
    !Number.isFinite(source.volumeFence.maxHorizontalRadiusMeters) ||
    source.volumeFence.maxHorizontalRadiusMeters <= 0 ||
    !Number.isFinite(source.volumeFence.minRelativeHeightMeters) ||
    !Number.isFinite(source.volumeFence.maxRelativeHeightMeters) ||
    source.volumeFence.minRelativeHeightMeters >=
      source.volumeFence.maxRelativeHeightMeters
  ) {
    errors.push(`泄漏源 ${source.leakSourceId} 缺少有效三维体扩散围栏`)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  const geographicScenes = registry.scenes.filter(
    (scene) => scene.sourceCrs === 'EPSG:4490',
  ).length
  const localScenes = registry.scenes.length - geographicScenes
  console.log(
    `[OK] ${registry.scenes.length} 个场景（4490=${geographicScenes}, 独立本地米制=${localScenes}）、${registry.entrances.length} 个厂房出入口、${registry.leakSources.length} 个体泄漏源通过空间契约校验`,
  )
}
