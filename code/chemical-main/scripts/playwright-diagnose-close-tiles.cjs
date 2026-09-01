const fs = require('fs')
const path = require('path')
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'playwright'))

const URL = process.env.SCREEN_URL || 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'logs', `codex-close-tiles-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sceneProbe(page, hiddenPatterns = []) {
  return page.evaluate(async (patterns) => {
    const dbg = window.__supermapCupDebug || {}
    const viewer = dbg.viewer
    const runtime = window.SuperMap3D || window.Cesium || window.SuperMap
    if (!viewer || !runtime) return { error: 'viewer/runtime not ready' }

    const primitives = viewer.scene?.primitives
    const tilesets = []
    for (let i = 0; i < (primitives?.length || 0); i += 1) {
      const primitive = primitives.get(i)
      if (!primitive?.root) continue
      tilesets.push(primitive)
    }
    const tileset = tilesets[0]
    if (!tileset) return { error: 'tileset not found' }

    const camera = viewer.scene.camera || viewer.camera
    const georef = {
      lon: 113.569463,
      lat: 34.76965,
      height: 8,
    }
    if (runtime.Cartesian3?.fromDegrees && camera?.setView) {
      const destination = runtime.Cartesian3.fromDegrees(113.5690072, 34.7692, 82)
      const orientation = {
        heading: runtime.Math?.toRadians ? runtime.Math.toRadians(0) : 0,
        pitch: runtime.Math?.toRadians ? runtime.Math.toRadians(-58) : -1.012290966,
        roll: 0,
      }
      camera.setView({ destination, orientation })
    }

    await new Promise(resolve => setTimeout(resolve, 3500))

    const stateName = ['UNLOADED', 'LOADING', 'LOADED', 'READY', 'FAILED']
    const selected = []
    const all = []
    const stack = [tileset.root]
    const seen = new Set()
    while (stack.length) {
      const tile = stack.pop()
      if (!tile || seen.has(tile)) continue
      seen.add(tile)
      const content = tile.content || tile._content
      const uri = content?.uri || tile._contentResource?._url || tile._header?.content?.uri || null
      const shortUri = uri ? String(uri).split('/').pop() : null
      const state = tile._contentState !== undefined ? stateName[tile._contentState] || String(tile._contentState) : undefined
      const visibleByName = shortUri && patterns.some(pattern => shortUri.includes(pattern))
      if (visibleByName) tile.show = false
      else if (patterns.length) tile.show = true
      const entry = {
        uri: shortUri,
        state,
        selected: Boolean(tile._selected || tile.selected),
        show: tile.show !== false,
        geometricError: tile.geometricError,
      }
      if (entry.uri) all.push(entry)
      if (entry.selected) selected.push(entry)
      if (tile.children) {
        for (const child of tile.children) stack.push(child)
      }
    }
    viewer.scene.requestRender?.()
    await new Promise(resolve => setTimeout(resolve, 800))

    const entities = viewer.entities?._entities?._array || viewer.entities?.values || []
    const counted = {
      total: entities.length,
      sensors: entities.filter(entity => entity?.superMapCupSensorId).length,
      polygon: entities.filter(entity => entity?.polygon).length,
      cylinder: entities.filter(entity => entity?.cylinder).length,
      box: entities.filter(entity => entity?.box).length,
      ellipsoid: entities.filter(entity => entity?.ellipsoid).length,
      polyline: entities.filter(entity => entity?.polyline).length,
      pl: entities.filter(entity => /^PL-/.test(String(entity?.superMapCupSensorId || ''))).length,
    }

    return {
      hiddenPatterns: patterns,
      tilesLoaded: tileset._tilesLoaded,
      renderStopped: Boolean(viewer.scene?._renderError),
      selected: selected.map(item => item.uri).filter(Boolean),
      selectedDetailed: selected,
      allCount: all.length,
      counted,
      messages: dbg.messages || [],
    }
  }, hiddenPatterns)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 })
  const failed = []
  page.on('requestfailed', request => {
    const url = request.url().replace(/key=[^&]+/i, 'key=REDACTED')
    failed.push({ url, error: request.failure()?.errorText })
  })
  page.on('console', message => {
    const text = message.text()
    if (/error|failed|Rendering has stopped|b3dm|tiles/i.test(text)) console.log('[browser]', text)
  })
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => Boolean(window.__supermapCupDebug?.viewer), null, { timeout: 60000 })
  await sleep(18000)

  const groups = [
    { name: '00-baseline', hide: [] },
    { name: '01-hide-0000-0000', hide: ['Tile_0000_0000_0000'] },
    { name: '02-hide-0000-minus0001', hide: ['Tile_0000_-0001_0000'] },
    { name: '03-hide-minus0001-minus0001', hide: ['Tile_-0001_-0001_0000'] },
    { name: '04-hide-minus0001-0000', hide: ['Tile_-0001_0000_0000'] },
    { name: '05-hide-east-open', hide: ['Tile_0000_0001_0000', 'Tile_-0001_0001_0000'] },
    { name: '06-hide-pipe-area', hide: ['Tile_0000_0000_0000', 'Tile_-0001_-0001_0000'] },
  ]
  const results = []
  for (const group of groups) {
    const result = await sceneProbe(page, group.hide)
    const png = path.join(OUT_DIR, `${group.name}.png`)
    await page.screenshot({ path: png, fullPage: false })
    results.push({ group, png, result })
  }
  fs.writeFileSync(path.join(OUT_DIR, 'result.json'), JSON.stringify({ url: URL, failed, results }, null, 2))
  await browser.close()
  console.log(JSON.stringify({ outDir: OUT_DIR, failed, groups: results.map(item => ({ name: item.group.name, selected: item.result.selected, counted: item.result.counted })) }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
