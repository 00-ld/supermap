import assert from 'node:assert/strict'
import test from 'node:test'
import { createEmergencyDemoAdvice } from '../src/components/emergencyAssistantFallback.ts'

test('labels the unauthenticated example as a local safety demonstration', () => {
  const advice = createEmergencyDemoAdvice('液氨泄漏，有人员头晕，东南风')

  assert.equal(advice.source, 'SAFETY_DEMO')
  assert.match(advice.summary, /液氨|危险气体/)
  assert.ok(advice.recommendations.some((item) => item.includes('上风向')))
  assert.match(advice.fallbackReason, /登录/)
})
