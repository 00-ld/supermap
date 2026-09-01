import assert from 'node:assert/strict'
import { stat } from 'node:fs/promises'
import test from 'node:test'
import {
  isActionablePatrolCarReading,
  PATROL_CAR_VIDEO_SOURCES,
  PRIORITY_MONITOR_VIDEO_SOURCES,
  resolvePatrolCarReadings,
} from '../src/data/patrolCarMonitoring.ts'

test('keeps sampled patrol readings when the monitoring overview provides them', () => {
  const readings = resolvePatrolCarReadings(
    [
      {
        time: '2026-08-12T10:00:00',
        carId: 1,
        gasType: 'CH4',
        gasValue: 18.2,
        source: 'simulation',
        qualityStatus: 'SIMULATED',
      },
    ],
    [
      {
        carId: 1,
        gasValue: 36.8,
        warningTime: '2026-08-12T10:05:00',
        x: 450,
        y: 565,
      },
    ],
  )

  assert.deepEqual(readings, [
    {
      time: '2026-08-12T10:00:00',
      carId: 1,
      gasType: 'CH4',
      gasValue: 18.2,
      source: 'simulation',
      qualityStatus: 'SIMULATED',
    },
  ])
})

test('uses recorded warning observations for cars missing sampled readings', () => {
  const readings = resolvePatrolCarReadings(
    [
      {
        time: '2026-08-12T10:00:00',
        carId: 1,
        gasType: 'CH4',
        gasValue: 18.2,
      },
    ],
    [
      {
        carId: '3',
        areaName: '中东塔器与管廊区',
        gasType: 'CO',
        gasValue: '126.3',
        warningTime: '2026-08-12T10:16:00',
        x: 948,
        y: 455,
      },
      {
        carId: 4,
        gasType: 'O2',
        gasValue: null,
        warningTime: '2026-08-12T10:08:00',
      },
    ],
  )

  assert.equal(readings.length, 2)
  assert.deepEqual(readings[1], {
    time: '2026-08-12T10:16:00',
    carId: 3,
    areaName: '中东塔器与管廊区',
    gasType: 'CO',
    gasValue: 126.3,
    source: 'warning_history',
    qualityStatus: 'EVENT_RECORDED',
    x: 948,
    y: 455,
  })
})

test('rejects empty and invalid observations instead of displaying a fabricated zero', () => {
  const readings = resolvePatrolCarReadings(
    [
      {
        time: '2026-08-12T10:00:00',
        carId: 1,
        gasValue: null as unknown as number,
      },
    ],
    [
      {
        carId: 2,
        gasValue: 'not-a-number',
        warningTime: '2026-08-12T10:05:00',
      },
      {
        carId: 3,
        gasValue: '',
        warningTime: '2026-08-12T10:06:00',
      },
      {
        carId: 4,
        gasValue: '   ',
        warningTime: '2026-08-12T10:07:00',
      },
    ],
  )

  assert.deepEqual(readings, [])
})

test('keeps warning-history fallback observations read-only', () => {
  assert.equal(
    isActionablePatrolCarReading({
      time: '2026-08-12T10:05:00',
      carId: 1,
      gasValue: 36.8,
      source: 'warning_history',
      qualityStatus: 'EVENT_RECORDED',
    }),
    false,
  )
  assert.equal(
    isActionablePatrolCarReading({
      time: '2026-08-12T10:00:00',
      carId: 1,
      gasValue: 18.2,
      source: 'simulation',
      qualityStatus: 'SIMULATED',
    }),
    true,
  )
})

test('maps every patrol car and priority monitor to a non-empty local asset', async () => {
  assert.deepEqual(PATROL_CAR_VIDEO_SOURCES, {
    1: '/video/小车1视频.mp4',
    2: '/video/小车2视频.mp4',
    3: '/video/小车3视频.mp4',
    4: '/video/小车4视频.mp4',
  })
  assert.deepEqual(PRIORITY_MONITOR_VIDEO_SOURCES, [
    '/gas_video/气体1.mp4',
    '/gas_video/气体2.mp4',
    '/gas_video/气体3.mp4',
    '/gas_video/气体4.mp4',
  ])

  const sources = [
    ...Object.values(PATROL_CAR_VIDEO_SOURCES),
    ...PRIORITY_MONITOR_VIDEO_SOURCES,
  ]
  for (const source of sources) {
    const asset = await stat(new URL(`../public${source}`, import.meta.url))
    assert.ok(asset.isFile(), `${source} should be a file`)
    assert.ok(asset.size > 0, `${source} should not be empty`)
  }
})
