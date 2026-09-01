const fs = require('fs')
const path = require('path')
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'playwright'))

const URL = process.env.SCREEN_URL || 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'logs', `codex-isolate-top-tiles-${Date.now()}`)
const CANDIDATES = [
  'Tile_-0001_-0002_0000',
  'Tile_0000_-0002_0000',
  'Tile_-0001_0001_0000',
  'Tile_-0001_0000_0000',
  'Tile_0000_-0003_0000',
  'Tile_-0001_-0001_0000',
  'Tile_0000_0000_0000',
  'Tile_0000_-0001_0000',
  'Tile_0000_0001_0000',
]

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function hideTop(page, pattern) {
  return page.evaluate(async (hidePattern) => {
    const dbg = window.__supermapCupDebug || {}
    const viewer = dbg.viewer
    const scene = viewer?.scene
    const primitives = scene?.primitives
    const matched = []
    for (let i = 0; i < (primitives?.length || 0); i += 1) {
      const primitive = primitives.get(i)
      if (!primitive?.root) continue
      const stack = [primitive.root]
      const seen = new Set()
      while (stack.length) {
        const tile = stack.pop()
        if (!tile || seen.has(tile)) continue
        seen.add(tile)
        const uri = tile.content?.uri || tile._contentResource?._url || tile._header?.content?.uri || ''
        const headerUri = tile._header?.content?.uri || ''
        const shortUri = String(uri || headerUri)
        const isTarget = shortUri.includes(hidePattern)
        tile.show = !isTarget
        if (isTarget) matched.push(shortUri.split('/').slice(-2).join('/'))
        if (tile.children) {
          for (const child of tile.children) stack.push(child)
        }
      }
    }
    if (typeof dbg.flyToSensor === 'function') dbg.flyToSensor('PL-10L')
    scene?.requestRender?.()
    await new Promise(resolve => setTimeout(resolve, 4000))
    return { hidden: hidePattern, matched }
  }, pattern)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 })
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => Boolean(window.__supermapCupDebug?.viewer), null, { timeout: 60000 })
  await sleep(15000)
  await page.evaluate(() => window.__supermapCupDebug?.flyToSensor?.('PL-10L'))
  await sleep(6000)
  await page.screenshot({ path: path.join(OUT_DIR, '00-baseline.png'), fullPage: false })
  const results = []
  for (const candidate of CANDIDATES) {
    const result = await hideTop(page, candidate)
    await page.screenshot({ path: path.join(OUT_DIR, `${candidate}.png`), fullPage: false })
    results.push(result)
  }
  fs.writeFileSync(path.join(OUT_DIR, 'result.json'), JSON.stringify(results, null, 2))
  await browser.close()
  console.log(JSON.stringify({ outDir: OUT_DIR, results }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
