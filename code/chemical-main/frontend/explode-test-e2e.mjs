import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: false,
  args: ['--use-angle=default'],
})
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const errors = []
const failedUrls = []
const allConsoles = []
page.on('console', (msg) => {
  allConsoles.push(`[${msg.type()}] ${msg.text().slice(0, 250)}`)
  if (msg.type() === 'error') errors.push(msg.text().slice(0, 300))
})
page.on('request', (req) => {
  const url = req.url()
  if (url.includes('supermap-iserver') || url.includes('tunnel')) {
    allConsoles.push(`[req:${req.method()}] ${url.slice(0, 180)}`)
  }
})
page.on('pageerror', (err) =>
  errors.push(
    'PAGEERROR: ' + String(err && err.stack ? err.stack : err).slice(0, 900),
  ),
)
page.on('response', (res) => {
  if (res.status() >= 400)
    failedUrls.push(`${res.status()} ${res.url().slice(0, 140)}`)
})

try {
  await page.goto('http://localhost:5173/explode-test.html', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  console.log('测试页已打开，等待三维初始化 + 场景加载…')
  await page.waitForSelector('canvas', { timeout: 120000 })
  console.log('canvas 出现，等待场景加载（最长 150 秒）…')
  await page.waitForTimeout(150000)
  const logText = await page.locator('#log').textContent()
  console.log('LOG:', logText)
  await page.screenshot({ path: 'explode-test-diag.png' })

  const sliderDisabled = await page.locator('#slider').isDisabled()
  console.log('滑块可用:', !sliderDisabled)

  if (!sliderDisabled) {
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'explode-test-0-initial.png' })
    await page.locator('#slider').fill('100')
    console.log('滑块拉到 100（Z 轴）')
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'explode-test-1-z100.png' })
    await page.locator('#axis button[data-axis="y"]').click()
    console.log('切到 Y 轴')
    await page.waitForTimeout(6000)
    await page.screenshot({ path: 'explode-test-2-y100.png' })
    await page.locator('#reset').click()
    console.log('复位')
    await page.waitForTimeout(4000)
    await page.screenshot({ path: 'explode-test-3-reset.png' })
  }
} catch (err) {
  console.log('脚本异常:', String(err).slice(0, 600))
}

console.log('errors:', errors.length ? errors.slice(0, 6) : '无')
console.log('failed urls:', failedUrls.length ? failedUrls.slice(0, 8) : '无')
console.log('关键控制台/请求日志:')
allConsoles.slice(-30).forEach((line) => console.log('  ', line))
await browser.close()
