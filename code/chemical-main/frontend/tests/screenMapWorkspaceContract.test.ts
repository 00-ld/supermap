import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const routesSource = readFileSync(
  new URL('../src/router/routes.ts', import.meta.url),
  'utf8',
)
const screenSource = readFileSync(
  new URL('../src/views/screen/index.vue', import.meta.url),
  'utf8',
)
const workspaceSource = readFileSync(
  new URL('../src/views/screen/map-workspace/index.vue', import.meta.url),
  'utf8',
)

test('keeps the removed smart-map route unavailable', () => {
  assert.doesNotMatch(routesSource, /path:\s*['"]\/smart-map['"]/)
  assert.match(routesSource, /path:\s*['"]\/screen['"]/)
})

test('keeps the two-dimensional workspace owned by the digital park page', () => {
  assert.match(screenSource, /from ['"]\.\/map-workspace\/index\.vue['"]/)
  assert.match(workspaceSource, /<SuperMap2DLayer\s*\/>/)
  const mapContainerMarkup = workspaceSource.match(
    /<main\b(?=[^>]*\bclass=["'][^"']*\bmap-container\b[^"']*["'])[^>]*>([\s\S]*?)<\/main>/,
  )
  assert.ok(mapContainerMarkup, 'map-container markup must remain available')
  const firstChildMarkup = mapContainerMarkup[1]
    .replace(/<!--[\s\S]*?-->/g, '')
    .trimStart()
  assert.doesNotMatch(firstChildMarkup, /^<template(?:\s[^>]*)?>/)
  assert.match(workspaceSource, /runDiffusion:\s*runDiffusionSimulation/)
  assert.match(
    workspaceSource,
    /runLeakTracing:\s*runParticleFilterInversionPreview/,
  )
  assert.doesNotMatch(workspaceSource, /defineProps<\{\s*embedded\?/)
})
