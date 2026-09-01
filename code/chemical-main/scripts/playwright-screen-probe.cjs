const fs = require('fs')
const path = require('path')
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'playwright'))

const URL = process.env.SCREEN_URL || 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'logs', `codex-screen-probe-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function probe(page, cameraMode) {
  return page.evaluate(async (mode) => {
    const dbg = window.__supermapCupDebug || {}
    const viewer = dbg.viewer
    const runtime = window.SuperMap3D || window.Cesium || window.SuperMap
    const scene = viewer?.scene
    const camera = scene?.camera || viewer?.camera
    if (!viewer || !scene || !runtime || !camera) return { error: 'viewer/runtime/camera not ready' }

    if (mode === 'close' && typeof dbg.flyToSensor === 'function') {
      dbg.flyToSensor('PL-10L')
    } else if (typeof dbg.focusScene === 'function') {
      dbg.focusScene()
    }
    scene.requestRender?.()
    await new Promise(resolve => setTimeout(resolve, 6500))

    const primitives = scene.primitives
    let tileset = null
    for (let i = 0; i < (primitives?.length || 0); i += 1) {
      const primitive = primitives.get(i)
      if (primitive?.root) {
        tileset = primitive
        break
      }
    }
    const selected = []
    const loaded = []
    if (tileset?.root) {
      const stack = [tileset.root]
      const seen = new Set()
      while (stack.length) {
        const tile = stack.pop()
        if (!tile || seen.has(tile)) continue
        seen.add(tile)
        const content = tile.content || tile._content
        const uri = content?.uri || tile._contentResource?._url || tile._header?.content?.uri || null
        const shortUri = uri ? String(uri).split('/').pop() : null
        const entry = {
          uri: shortUri,
          selected: Boolean(tile._selected || tile.selected),
          show: tile.show !== false,
          geometricError: Number(tile.geometricError || 0),
          contentState: tile._contentState,
        }
        if (shortUri && entry.selected) selected.push(entry)
        if (shortUri && entry.contentState >= 2) loaded.push(entry)
        if (tile.children) {
          for (const child of tile.children) stack.push(child)
        }
      }
    }

    const entities = viewer.entities?._entities?._array || viewer.entities?.values || []
    const sensorIds = entities
      .map(entity => String(entity?.superMapCupSensorId || ''))
      .filter(Boolean)
    return {
      mode,
      renderErrorType: typeof scene._renderError,
      renderErrorText: scene._renderError?.message || scene._renderError?.name || '',
      tilesLoaded: Boolean(tileset?._tilesLoaded),
      selectedTiles: selected,
      loadedTileCount: loaded.length,
      entityCount: entities.length,
      sensorEntityCount: sensorIds.length,
      uniqueSensorCount: new Set(sensorIds).size,
      pipeSensorCount: sensorIds.filter(id => id.startsWith('PL-')).length,
      messages: dbg.messages || [],
    }
  }, cameraMode)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 })
  const failed = []
  const consoleLogs = []
  page.on('requestfailed', request => {
    failed.push({
      url: request.url().replace(/key=[^&]+/i, 'key=REDACTED'),
      error: request.failure()?.errorText,
    })
  })
  page.on('console', message => {
    const text = message.text()
    if (/error|failed|Rendering has stopped|b3dm|tiles|F\d/i.test(text)) consoleLogs.push(text)
  })
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => Boolean(window.__supermapCupDebug?.viewer), null, { timeout: 60000 })
  await sleep(14000)

  const overview = await probe(page, 'overview')
  await page.screenshot({ path: path.join(OUT_DIR, 'overview.png'), fullPage: false })
  const close = await probe(page, 'close')
  await page.screenshot({ path: path.join(OUT_DIR, 'close.png'), fullPage: false })

  const result = { url: URL, failed, consoleLogs, overview, close }
  fs.writeFileSync(path.join(OUT_DIR, 'state.json'), JSON.stringify(result, null, 2))
  await browser.close()
  console.log(JSON.stringify({ outDir: OUT_DIR, overview, close, failedCount: failed.length, consoleCount: consoleLogs.length }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
