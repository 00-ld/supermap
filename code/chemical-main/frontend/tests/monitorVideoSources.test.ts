import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MONITOR_VIDEO_SOURCES,
  filterMonitorVideoSources,
} from '../src/views/thing/monitor_history/monitorVideoSources.ts'

test('monitor page exposes four playable local video sources', () => {
  assert.equal(MONITOR_VIDEO_SOURCES.length, 4)
  assert.equal(
    new Set(MONITOR_VIDEO_SOURCES.map((source) => source.cameraUrl)).size,
    4,
  )
  assert.ok(
    MONITOR_VIDEO_SOURCES.every((source) =>
      source.cameraUrl.startsWith('/gas_video/'),
    ),
  )
})

test('video source search matches monitoring point, area, and sensor id', () => {
  assert.deepEqual(
    filterMonitorVideoSources(MONITOR_VIDEO_SOURCES, 'P2').map(
      (source) => source.id,
    ),
    ['P2'],
  )
  assert.deepEqual(
    filterMonitorVideoSources(MONITOR_VIDEO_SOURCES, '储罐').map(
      (source) => source.id,
    ),
    ['TK-01'],
  )
  assert.deepEqual(
    filterMonitorVideoSources(MONITOR_VIDEO_SOURCES, 'wh-01').map(
      (source) => source.id,
    ),
    ['WH-01'],
  )
})

test('blank search returns all configured monitor videos', () => {
  assert.equal(
    filterMonitorVideoSources(MONITOR_VIDEO_SOURCES, '   ').length,
    MONITOR_VIDEO_SOURCES.length,
  )
})
