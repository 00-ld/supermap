import * as THREE from 'three'

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  return [canvas, ctx]
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, alpha: number, rand: () => number) {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * 255 * alpha
    data[i] += n
    data[i + 1] += n
    data[i + 2] += n
  }
  ctx.putImageData(imageData, 0, 0)
}

function canvasToTexture(canvas: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
  }
  tex.needsUpdate = true
  return tex
}

export function generateConcreteTexture(size = 256): THREE.CanvasTexture {
  const rand = createSeededRandom(1001 + size)
  const [canvas, ctx] = createCanvas(size, size)
  ctx.fillStyle = '#8a8a82'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 800; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = rand() * 2 + 0.5
    const gray = 100 + rand() * 60
    ctx.fillStyle = `rgb(${gray},${gray},${gray - 5})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  noise(ctx, size, size, 0.08, rand)
  return canvasToTexture(canvas)
}

export function generateConcreteNormal(size = 256): THREE.CanvasTexture {
  const rand = createSeededRandom(2001 + size)
  const [canvas, ctx] = createCanvas(size, size)
  ctx.fillStyle = '#8080ff'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 600; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = rand() * 3 + 1
    const nx = 128 + (rand() - 0.5) * 30
    const ny = 128 + (rand() - 0.5) * 30
    ctx.fillStyle = `rgb(${nx},${ny},220)`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvasToTexture(canvas)
}

export function generateMetalTexture(size = 256): THREE.CanvasTexture {
  const rand = createSeededRandom(3001 + size)
  const [canvas, ctx] = createCanvas(size, size)
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  grad.addColorStop(0, '#7a7a7a')
  grad.addColorStop(0.3, '#8a8a8a')
  grad.addColorStop(0.7, '#757575')
  grad.addColorStop(1, '#858585')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  for (let y = 0; y < size; y += 1) {
    if (rand() > 0.7) {
      ctx.strokeStyle = `rgba(${120 + rand() * 40},${120 + rand() * 40},${120 + rand() * 40},0.3)`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y + (rand() - 0.5) * 2)
      ctx.stroke()
    }
  }
  noise(ctx, size, size, 0.04, rand)
  return canvasToTexture(canvas)
}

export function generateRustTexture(size = 256): THREE.CanvasTexture {
  const rand = createSeededRandom(4001 + size)
  const [canvas, ctx] = createCanvas(size, size)
  ctx.fillStyle = '#6a6a6a'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 30; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = rand() * 30 + 10
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, `rgba(${140 + rand() * 40},${60 + rand() * 30},${20 + rand() * 20},0.8)`)
    grad.addColorStop(1, 'rgba(100,80,70,0)')
    ctx.fillStyle = grad
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  noise(ctx, size, size, 0.06, rand)
  return canvasToTexture(canvas)
}

export function generateAsphaltTexture(size = 256): THREE.CanvasTexture {
  const rand = createSeededRandom(5001 + size)
  const [canvas, ctx] = createCanvas(size, size)
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 1500; i++) {
    const x = rand() * size
    const y = rand() * size
    const r = rand() * 1.5 + 0.3
    const gray = 40 + rand() * 40
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  noise(ctx, size, size, 0.05, rand)
  return canvasToTexture(canvas)
}

export function generateGrassTexture(size = 256): THREE.CanvasTexture {
  const rand = createSeededRandom(6001 + size)
  const [canvas, ctx] = createCanvas(size, size)
  ctx.fillStyle = '#3a5a2a'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 2000; i++) {
    const x = rand() * size
    const y = rand() * size
    const len = rand() * 6 + 2
    const angle = -Math.PI / 2 + (rand() - 0.5) * 0.8
    const g = 50 + rand() * 80
    ctx.strokeStyle = `rgba(${30 + rand() * 30},${g},${20 + rand() * 20},0.6)`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len)
    ctx.stroke()
  }
  noise(ctx, size, size, 0.04, rand)
  return canvasToTexture(canvas)
}

export function generateRoughnessMap(size = 256, base = 180, variation = 40): THREE.CanvasTexture {
  const rand = createSeededRandom(7001 + size + base + variation)
  const [canvas, ctx] = createCanvas(size, size)
  const imageData = ctx.createImageData(size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const v = base + (rand() - 0.5) * variation
    data[i] = v
    data[i + 1] = v
    data[i + 2] = v
    data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return canvasToTexture(canvas)
}

const texCache = new Map<string, THREE.CanvasTexture>()

export function getCachedTexture(key: string, generator: () => THREE.CanvasTexture): THREE.CanvasTexture {
  if (!texCache.has(key)) texCache.set(key, generator())
  return texCache.get(key)!
}

export function disposeTextures() {
  texCache.forEach((tex) => tex.dispose())
  texCache.clear()
}
