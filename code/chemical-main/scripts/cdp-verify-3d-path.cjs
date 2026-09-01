// CDP driver: open the digital park, capture console + [F2]/[F6] probes, trigger evacuation, screenshot.
// Usage: node scripts/cdp-verify-3d-path.cjs
const http = require('http')

const CDP_PORT = 9223
const TARGET_URL = 'http://127.0.0.1:5173/#/screen'
const OUT_DIR = require('path').resolve(__dirname, '..', 'logs')

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch (e) { reject(e) } })
    }).on('error', reject)
  })
}

// Minimal CDP client over raw WebSocket (node 22+ has global WebSocket)
async function cdpCall(ws, method, params = {}) {
  const id = cdpCall._id = (cdpCall._id || 0) + 1
  return new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      let msg
      const text = typeof ev === 'string' ? ev : (ev.data || '')
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

async function main() {
  const targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json`)
  // Find a page-type target, preferring the digital park or another local page.
  let target = targets.find(t => t.type === 'page' && (t.url || '').includes('#/screen'))
    || targets.find(t => t.type === 'page' && (t.url || '').includes('127.0.0.1'))
    || targets.find(t => t.type === 'page')
  if (!target) throw new Error('No page target found. Open a Chrome tab first.')
  console.log('Using target:', target.url)

  const wsUrl = target.webSocketDebuggerUrl
  const ws = new WebSocket(wsUrl)
  await new Promise((r, x) => { ws.addEventListener('open', () => r()); ws.addEventListener('error', (e) => x(new Error('ws error: ' + (e.message || 'unknown')))) })

  const logs = []
  ws.addEventListener('message', (ev) => {
    let msg
    const text = typeof ev.data === 'string' ? ev.data : ev.data.toString()
    try { msg = JSON.parse(text) } catch { return }
    if (msg.method === 'Runtime.consoleAPICalled' || msg.method === 'Runtime.exceptionThrown') {
      const entry = msg.method === 'Runtime.consoleAPICalled'
        ? `[${msg.params.type}] ${msg.params.args.map(a => a.value || a.description || '').join(' ')}`
        : `[exception] ${msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text}`
      logs.push(entry)
      if (/\[F2\]|\[F6\]|网络分析|降级|evacuation|render-chain|georefTransformLen|越界/i.test(entry)) {
        console.log('PROBE>', entry.slice(0, 300))
      }
    }
  })

  await cdpCall(ws, 'Runtime.enable')
  await cdpCall(ws, 'Page.enable')
  await cdpCall(ws, 'Runtime.evaluate', { expression: `location.href = ${JSON.stringify(TARGET_URL)}` })

  console.log('Waiting 25s for 3D model + page load...')
  await new Promise(r => setTimeout(r, 25000))

  // Try to click the "当前建筑路径" / evacuation trigger button
  const clickRes = await cdpCall(ws, 'Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button, .el-button, [class*="btn"]'));
      const candidates = btns.filter(b => /当前建筑|路径|疏散|evacuation/i.test(b.textContent || ''));
      const target = candidates.find(b => /当前建筑/.test(b.textContent || '')) || candidates[0];
      if (target) { target.click(); return 'clicked: ' + (target.textContent || '').trim().slice(0, 40); }
      return 'no button found; btns=' + btns.length;
    })()`,
    returnByValue: true,
  })
  console.log('Click result:', clickRes.result?.value)

  console.log('Waiting 18s for evacuation result + path render...')
  await new Promise(r => setTimeout(r, 18000))

  // Screenshot
  const ss = await cdpCall(ws, 'Page.captureScreenshot', { format: 'jpeg', quality: 80 })
  const fs = require('fs')
  const outPath = require('path').join(OUT_DIR, '3d-path-verify.jpg')
  fs.writeFileSync(outPath, Buffer.from(ss.data, 'base64'))
  console.log('Screenshot saved:', outPath)

  // Dump all probe-relevant logs
  const probeLogs = logs.filter(l => /\[F2\]|\[F6\]|网络分析|降级|evacuation|render-chain|georefTransformLen|越界|不可达|不可用/i.test(l))
  fs.writeFileSync(require('path').join(OUT_DIR, 'cdp-probe-logs.txt'),
    logs.join('\n') + '\n\n=== PROBE LOGS ===\n' + probeLogs.join('\n'))
  console.log('Logs saved. Total console entries:', logs.length, '| Probe entries:', probeLogs.length)

  ws.close()
  process.exit(0)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
