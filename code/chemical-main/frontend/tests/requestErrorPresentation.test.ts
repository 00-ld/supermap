import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveRequestErrorMessageType } from '../src/utils/requestErrorPresentation.ts'

test('presents anonymous public-demo fallback as a warning', () => {
  assert.equal(
    resolveRequestErrorMessageType({ status: 401, isPublicDemoRoute: true }),
    'warning',
  )
})

test('keeps real request failures visually classified as errors', () => {
  assert.equal(
    resolveRequestErrorMessageType({ status: 401, isPublicDemoRoute: false }),
    'error',
  )
  assert.equal(
    resolveRequestErrorMessageType({ status: 500, isPublicDemoRoute: true }),
    'error',
  )
})
