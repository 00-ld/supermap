export interface MonitorVideoSource {
  id: string
  name: string
  areaName: string
  sensorId: string
  cameraUrl: string
  gasLabel: string
}

export const MONITOR_VIDEO_SOURCES: MonitorVideoSource[] = [
  {
    id: 'P1',
    name: 'P1 甲烷重点监测点',
    areaName: '生产一区 P1',
    sensorId: 'P1-01H',
    cameraUrl: '/gas_video/气体1.mp4',
    gasLabel: 'CH₄ 重点监测',
  },
  {
    id: 'P2',
    name: 'P2 生产装置监测点',
    areaName: '西北生产装置区',
    sensorId: 'P2-01L',
    cameraUrl: '/gas_video/气体2.mp4',
    gasLabel: '多气体联动',
  },
  {
    id: 'TK-01',
    name: '储罐区甲烷监测点',
    areaName: '储罐与泵区',
    sensorId: 'TK-01L',
    cameraUrl: '/gas_video/气体3.mp4',
    gasLabel: 'CH₄ 储罐监测',
  },
  {
    id: 'WH-01',
    name: '仓储物流边界监测点',
    areaName: '仓储物流区',
    sensorId: 'WH-01',
    cameraUrl: '/gas_video/气体4.mp4',
    gasLabel: '园区边界监测',
  },
]

export function filterMonitorVideoSources(
  sources: MonitorVideoSource[],
  searchKey: string,
) {
  const keyword = searchKey.trim().toLocaleLowerCase()
  if (!keyword) return sources
  return sources.filter((source) =>
    [source.id, source.name, source.areaName, source.sensorId, source.gasLabel]
      .join(' ')
      .toLocaleLowerCase()
      .includes(keyword),
  )
}
