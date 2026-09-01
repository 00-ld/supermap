const fs = require('fs')
const path = require('path')
const { chromium } = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'playwright'))

const URL = process.env.SCREEN_URL || 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = path.resolve(__dirname, '..', 'frontend', 'logs', `codex-render-error-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`)

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 1 })
  const logs = []
  const failed = []
  page.on('pageerror', error => logs.push({ type: 'pageerror', text: error.stack || error.message }))
  page.on('console', message => logs.push({ type: message.type(), text: message.text() }))
  page.on('requestfailed', request => {
    failed.push({
      url: request.url().replace(/key=[^&]+/i, 'key=REDACTED'),
      error: request.failure()?.errorText,
    })
  })
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => Boolean(window.__supermapCupDebug?.viewer), null, { timeout: 60000 })
  await page.evaluate(() => {
    const dbg = window.__supermapCupDebug || {}
    const viewer = dbg.viewer
    const scene = viewer?.scene
    window.__codexRenderErrors = []
    if (scene?.renderError?.addEventListener) {
      scene.renderError.addEventListener((sceneArg, error) => {
        window.__codexRenderErrors.push({
          message: error?.message || String(error || ''),
          stack: error?.stack || '',
          name: error?.name || '',
        })
      })
    }
  })
  await sleep(20000)
  const state = await page.evaluate(async () => {
    const dbg = window.__supermapCupDebug || {}
    const viewer = dbg.viewer
    const scene = viewer?.scene
    const primitives = scene?.primitives
    const primitiveTypes = []
    for (let i = 0; i < (primitives?.length || 0); i += 1) {
      const primitive = primitives.get(i)
      primitiveTypes.push({
        index: i,
        type: primitive?.constructor?.name || typeof primitive,
        hasRoot: Boolean(primitive?.root),
        show: primitive?.show,
      })
    }
    return {
      renderErrorFlag: Boolean(scene?._renderError),
      renderErrors: window.__codexRenderErrors || [],
      primitiveTypes,
      messages: dbg.messages || [],
      canvas: Array.from(document.querySelectorAll('canvas')).map(canvas => ({
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
      })),
    }
  })
  await page.screenshot({ path: path.join(OUT_DIR, 'render-error.png'), fullPage: false })
  fs.writeFileSync(path.join(OUT_DIR, 'state.json'), JSON.stringify({ failed, logs, state }, null, 2))
  await browser.close()
  console.log(JSON.stringify({ outDir: OUT_DIR, state, failedCount: failed.length, logCount: logs.length }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
