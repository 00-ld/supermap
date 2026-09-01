// CDP driver: check scene state + take high-quality screenshot of 3D model + path.
// Usage: node scripts/cdp-check-scene.cjs
const http = require('http')
const fs = require('fs')
const path = require('path')

const CDP_PORT = 9223
const TARGET_URL = 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = path.resolve(__dirname, '..', 'logs')

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

async function cdpCall(ws, method, params = {}) {
  const id = cdpCall._id = (cdpCall._id || 0) + 1
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const text = typeof ev === 'string' ? ev : (ev.data || '')
      let msg
      try { msg = JSON.parse(text) } catch { return }
      if (msg.id === id) {
        ws.removeEventListener('message', onMsg)
        if (msg.error) reject(new Error(JSON.stringify(msg.error)))
        else resolve(msg.result)
      }
    }
    ws.addEventListener('message', onMsg)
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evalJS(ws, expr) {
  const r = await cdpCall(ws, 'Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  })
  return r.result?.value
}

async function main() {
  const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json`)
  let target = targets.find(t => t.type === 'page' && (t.url || '').includes('#/screen'))
    || targets.find(t => t.type === 'page' && (t.url || '').includes('127.0.0.1'))
    || targets.find(t => t.type === 'page')
  if (!target) throw new Error('No page target found.')
  console.log('target:', target.url)

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((r, x) => {
    ws.addEventListener('open', () => r())
    ws.addEventListener('error', e => x(new Error('ws error: ' + (e.message || 'unknown'))))
  })

  await cdpCall(ws, 'Runtime.enable')
  await cdpCall(ws, 'Page.enable')

  // Navigate to the digital park scene if the current page is elsewhere.
  if (!target.url.includes('#/screen')) {
    await evalJS(ws, `location.href = ${JSON.stringify(TARGET_URL)}`)
    console.log('navigating to digital park...')
    await new Promise(r => setTimeout(r, 20000))
  }

  // scene state probe
  const state = await evalJS(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button, .el-button'));
    const pathBtns = btns.filter(b => /当前建筑|路径|疏散|最近设备|全建筑/i.test(b.textContent || ''));
    const cv = document.querySelector('.scene-canvas canvas, .cesium-widget canvas, canvas');
    // 检查 Vue 实例中的 evacuation overlay 数据
    let overlayInfo = 'no-vue';
    const sceneEl = document.querySelector('.supermap-scene-viewer, #scene-container, [class*="scene"]');
    return {
      url: location.href,
      title: document.title,
      hasCanvas: !!cv,
      canvasSize: cv ? (cv.width + 'x' + cv.height) : 'none',
      pathBtns: pathBtns.map(b => (b.textContent || '').trim().slice(0, 30) + ' [disabled=' + b.disabled + ']'),
      bodyTextLen: document.body.innerText.length,
      bodyTextSample: document.body.innerText.slice(0, 500),
    };
  })()`)
  console.log('STATE:', JSON.stringify(state, null, 2))

  // wait extra for 3D model to fully stream
  console.log('waiting 12s for 3D model streaming...')
  await new Promise(r => setTimeout(r, 12000))

  // click the evacuation trigger
  const clickRes = await evalJS(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button, .el-button, [class*="btn"]'));
    const candidates = btns.filter(b => /当前建筑|路径|疏散/i.test(b.textContent || ''));
    const target = candidates.find(b => /当前建筑/.test(b.textContent || '')) || candidates[0];
    if (target) { target.click(); return 'clicked: ' + (target.textContent || '').trim().slice(0, 50); }
    return 'no button; totalBtns=' + btns.length;
  })()`)
  console.log('click:', clickRes)

  // wait for path render
  await new Promise(r => setTimeout(r, 12000))

  // hi-res screenshot
  const ss = await cdpCall(ws, 'Page.captureScreenshot', { format: 'jpeg', quality: 95 })
  fs.writeFileSync(path.join(OUT_DIR, '3d-path-verify-hi.jpg'), Buffer.from(ss.data, 'base64'))
  console.log('hi-res screenshot saved')

  // final scene probe: check if polylines / primitives exist
  const finalState = await evalJS(ws, `(() => {
    // try to access Cesium viewer globally if exposed
    const cv = document.querySelector('.scene-canvas canvas, .cesium-widget canvas, canvas');
    let cesiumInfo = 'no-cesium-global';
    try {
      // look for any viewer on window
      const keys = Object.keys(window).filter(k => /viewer|cesium|scene/i.test(k));
      cesiumInfo = keys.slice(0, 10).join(',');
    } catch(e) { cesiumInfo = 'err:' + e.message; }
    // count entities/primitives via DOM-ish hints
    const overlayEls = document.querySelectorAll('[class*="path"], [class*="evacuation"], [class*="overlay"], [class*="route"]');
    return {
      hasCanvas: !!cv,
      canvasW: cv ? cv.width : 0,
      canvasH: cv ? cv.height : 0,
      cesiumGlobals: cesiumInfo,
      overlayEls: Array.from(overlayEls).slice(0, 5).map(e => e.className + ':' + (e.textContent || '').slice(0, 40)),
      bodyTextTail: document.body.innerText.slice(-500),
    };
  })()`)
  console.log('FINAL:', JSON.stringify(finalState, null, 2))

  ws.close()
  process.exit(0)
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1) })
