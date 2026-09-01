const fs = require('fs')
const path = require('path')
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'playwright'))

const URL = process.env.SCREEN_URL || 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'logs', `codex-layer-source-probe-${Date.now()}`)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function setView(page) {
  await page.evaluate(() => window.__supermapCupDebug?.flyToSensor?.('PL-10L'))
  await sleep(5000)
}

async function snapshot(page, cdp, name) {
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), Buffer.from(screenshot.data, 'base64'))
  return page.evaluate(() => {
    const dbg = window.__supermapCupDebug || {}
    const viewer = dbg.viewer
    const scene = viewer?.scene
    const primitives = scene?.primitives
    const primitiveStates = []
    for (let i = 0; i < (primitives?.length || 0); i += 1) {
      const primitive = primitives.get(i)
      primitiveStates.push({
        index: i,
        hasRoot: Boolean(primitive?.root),
        show: primitive?.show !== false,
        constructor: primitive?.constructor?.name || '',
      })
    }
    const entities = viewer?.entities?._entities?._array || viewer?.entities?.values || []
    return {
      primitiveStates,
      entityCount: entities.length,
      shownEntityCount: entities.filter(entity => entity.show !== false).length,
      imageryLayers: viewer?.imageryLayers?.length || scene?.imageryLayers?.length || 0,
      globeShow: scene?.globe?.show !== false,
    }
  })
}

async function restoreAll(page) {
  await page.evaluate(() => {
    const viewer = window.__supermapCupDebug?.viewer
    const scene = viewer?.scene
    const primitives = scene?.primitives
    for (let i = 0; i < (primitives?.length || 0); i += 1) {
      const primitive = primitives.get(i)
      if (primitive) primitive.show = true
    }
    const entities = viewer?.entities?._entities?._array || viewer?.entities?.values || []
    entities.forEach(entity => { entity.show = true })
    const layers = viewer?.imageryLayers || scene?.imageryLayers
    for (let i = 0; i < (layers?.length || 0); i += 1) {
      const layer = layers.get ? layers.get(i) : layers[i]
      if (layer) layer.show = true
    }
    if (scene?.globe) scene.globe.show = true
    scene?.requestRender?.()
  })
  await sleep(1500)
}

async function toggle(page, mode) {
  await restoreAll(page)
  await page.evaluate((toggleMode) => {
    const viewer = window.__supermapCupDebug?.viewer
    const scene = viewer?.scene
    const primitives = scene?.primitives
    if (toggleMode === 'hide-tileset') {
      for (let i = 0; i < (primitives?.length || 0); i += 1) {
        const primitive = primitives.get(i)
        if (primitive?.root) primitive.show = false
      }
    }
    if (toggleMode === 'hide-primitives') {
      for (let i = 0; i < (primitives?.length || 0); i += 1) {
        const primitive = primitives.get(i)
        if (primitive) primitive.show = false
      }
    }
    if (toggleMode === 'hide-entities') {
      const entities = viewer?.entities?._entities?._array || viewer?.entities?.values || []
      entities.forEach(entity => { entity.show = false })
    }
    if (toggleMode === 'hide-imagery') {
      const layers = viewer?.imageryLayers || scene?.imageryLayers
      for (let i = 0; i < (layers?.length || 0); i += 1) {
        const layer = layers.get ? layers.get(i) : layers[i]
        if (layer) layer.show = false
      }
    }
    if (toggleMode === 'hide-globe' && scene?.globe) {
      scene.globe.show = false
    }
    scene?.requestRender?.()
  }, mode)
  await sleep(2200)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 })
  const cdp = await page.context().newCDPSession(page)
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => Boolean(window.__supermapCupDebug?.viewer), null, { timeout: 60000 })
  await sleep(14000)
  await setView(page)

  const results = []
  results.push({ name: 'baseline', state: await snapshot(page, cdp, '00-baseline') })
  for (const mode of ['hide-tileset', 'hide-primitives', 'hide-entities', 'hide-imagery', 'hide-globe']) {
    await toggle(page, mode)
    results.push({ name: mode, state: await snapshot(page, cdp, mode) })
  }
  await restoreAll(page)
  fs.writeFileSync(path.join(OUT_DIR, 'result.json'), JSON.stringify(results, null, 2))
  await browser.close()
  console.log(JSON.stringify({ outDir: OUT_DIR, results }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
