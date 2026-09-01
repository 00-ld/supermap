import { chromium } from 'playwright'

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text().slice(0, 400))
})
page.on('pageerror', (err) =>
  errors.push('PAGEERROR: ' + String(err).slice(0, 400)),
)
const failedUrls = []
page.on('response', (res) => {
  if (res.status() >= 400) failedUrls.push(`${res.status()} ${res.url().slice(0, 160)}`)
})

try {
  await page.goto('http://localhost:5173/#/screen', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })
  await page.waitForSelector('button[aria-label="加工厂房"]', {
    timeout: 60000,
  })
  console.log('页面打开，等待三维 canvas 初始化…')
  await page.waitForSelector('.supermap-scene-viewer canvas', {
    timeout: 180000,
  })
  console.log('三维 canvas 已出现，等待场景就绪…')
  await page.waitForTimeout(10000)

  console.log('点击「加工厂房」…')
  await page.locator('button[aria-label="加工厂房"]').click({ force: true })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'explode-shot-preload.png' })
  const btnLabel = await page
    .locator('button[aria-label*="加工厂房"]')
    .getAttribute('aria-label')
    .catch(() => '')
  console.log('点击后按钮状态:', btnLabel)
  await page.waitForTimeout(8000)
  const sceneMsg = await page
    .locator('.scene-message')
    .textContent()
    .catch(() => '')
  const canvasCount = await page.locator('canvas').count().catch(() => 0)
  const fallbackFrame = await page
    .locator('.scene-fallback-frame')
    .count()
    .catch(() => 0)
  const statusTexts = await page
    .locator('.status-grid article')
    .allTextContents()
    .catch(() => [])
  const activeBtn = await page
    .locator('.scene-model-list button.active')
    .count()
    .catch(() => 0)
  console.log('scene-message:', sceneMsg)
  console.log('canvas 数量:', canvasCount, '| 兜底 iframe 数量:', fallbackFrame)
  console.log('状态栏:', statusTexts.map((t) => t.trim()).filter(Boolean))
  console.log('active 场景按钮数量:', activeBtn)

  console.log('等待爆炸面板出现（场景加载 + datasetInfo 初始化）…')
  try {
    await page.waitForSelector('.explode-panel', { timeout: 300000 })
    console.log('爆炸面板已出现')
  } catch {
    console.log('爆炸面板未出现，可能场景加载失败')
  }

  await page
    .waitForFunction(
      () => {
        const el = document.querySelector('.explode-summary')
        return el && el.textContent.includes('分')
      },
      { timeout: 60000 },
    )
    .then(() => console.log('爆炸分层初始化完成'))
    .catch(() => console.log('爆炸初始化未完成（检查 summary）'))

  const summary = await page
    .locator('.explode-summary')
    .textContent()
    .catch(() => '')
  console.log('explode-summary:', summary)

  const slider = page.locator('.explode-panel input[type="range"]')
  const disabled = await slider.isDisabled().catch(() => true)
  console.log('滑块可用状态:', !disabled)
  await page.screenshot({ path: 'explode-shot-0-initial.png' })

  if (!disabled) {
    await slider.fill('100')
    console.log('滑块已拉到 100（Z 轴）')
    await page.waitForTimeout(4000)
    await page.screenshot({ path: 'explode-shot-1-z100.png' })

    await page.locator('.explode-axis button', { hasText: 'X' }).click()
    console.log('切换 X 轴')
    await page.waitForTimeout(4000)
    await page.screenshot({ path: 'explode-shot-2-x100.png' })

    await page.locator('.explode-head button').click()
    console.log('点击复位')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'explode-shot-3-reset.png' })
  }
} catch (err) {
  console.log('脚本异常:', String(err).slice(0, 500))
}

console.log('console/page errors:', errors.length ? errors.slice(0, 8) : '无')
console.log('4xx/5xx 请求:')
failedUrls.slice(0, 12).forEach((u) => console.log('  ', u))
await browser.close()
