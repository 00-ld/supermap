import assert from 'node:assert/strict'
import test from 'node:test'
import {
  inversionVisualizationPolicy,
  resolveInversionLegendItems,
} from '../src/components/inversionVisualizationPolicy.ts'

test('coarse stage shows only the three strongest search regions', () => {
  assert.deepEqual(inversionVisualizationPolicy('coarse'), {
    candidateLimit: 3,
    showRefinement: false,
    showDensity: false,
    showConfidence: false,
    particleLimit: 0,
    minimumParticleWeight: 0,
    confidenceAlpha: 0,
  })
})

test('final stage prioritizes the decision result over intermediate layers', () => {
  assert.deepEqual(inversionVisualizationPolicy('particle'), {
    candidateLimit: 0,
    showRefinement: false,
    showDensity: false,
    showConfidence: true,
    particleLimit: 12,
    minimumParticleWeight: 0.45,
    confidenceAlpha: 0.12,
  })
})

test('final stage legend explains only decision-ready overlays', () => {
  assert.deepEqual(
    resolveInversionLegendItems('particle').map((item) => item.label),
    ['最终估计源', '95% 置信范围', '高权重样本'],
  )
})
