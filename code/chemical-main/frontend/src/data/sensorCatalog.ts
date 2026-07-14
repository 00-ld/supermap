export interface ParkSensorType {
  id: string
  name: string
  radius: number
  cost: number
  color?: string
}

export interface SensorDeviceInfo {
  image: string
  name: string
  standard: string
  deviceName: string
}

export interface SensorDeviceInput {
  id?: string
}

export const sensorTypes: ParkSensorType[] = [
  { id: 'gas', name: '气体传感器', radius: 40, cost: 1200, color: '#00e5a0' },
  { id: 'temp', name: '温度传感器', radius: 20, cost: 800, color: '#38bdf8' },
  { id: 'leak', name: '泄漏传感器', radius: 25, cost: 1500, color: '#ff6b35' },
]

export const sensorDeviceMap: Record<string, SensorDeviceInfo> = {
  TK: {
    image: '/sensor-devices/tank-farm-sensors.png',
    name: '储罐区传感器布点示意',
    standard: 'GB/T 50493 4.3.1: 储罐防火堤内，可燃气体探测器距释放源水平距离≤10m，有毒气体≤4m',
    deviceName: '多种气体传感器',
  },
  TW: {
    image: '/sensor-devices/tower-area-sensors.png',
    name: '塔器区传感器布点示意',
    standard: 'GB/T 50493 4.2.1: 露天释放源，可燃气体探测器距释放源水平距离≤10m',
    deviceName: '多种气体传感器',
  },
  PA: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '生产一区传感器布点示意',
    standard: 'GB/T 50493 4.2.1: 露天释放源，有毒气体探测器距释放源水平距离≤4m',
    deviceName: '多种气体传感器',
  },
  P1: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '生产一区 P1 传感器布点示意',
    standard: 'GB/T 50493 4.2.1 / 6.1.2: 甲烷等轻质可燃气体兼顾释放源附近低位与高位积聚风险',
    deviceName: '甲烷/多气体传感器',
  },
  PB: {
    image: '/sensor-devices/fine-chemical-sensors.png',
    name: '精细化工区传感器布点示意',
    standard: 'GB/T 50493 4.2.2: 封闭厂房，有毒气体探测器距释放源水平距离≤2m',
    deviceName: '多种气体传感器',
  },
  P2: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '生产二区传感器布点示意',
    standard: 'GB/T 50493 4.2.1: 露天释放源，有毒气体探测器距释放源水平距离≤4m',
    deviceName: '多种气体传感器',
  },
  UT: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '公用工程区传感器布点示意',
    standard: 'GB/T 50493 4.4.3: 控制室空调新风引风口应设置可燃气体探测器',
    deviceName: '多种气体传感器',
  },
  WH: {
    image: '/sensor-devices/warehouse-sensors.png',
    name: '仓储物流区传感器布点示意',
    standard: 'GB/T 50493 4.1.5: 沿储运设施区域周边按适宜间隔布置探测器',
    deviceName: '多种气体传感器',
  },
  WT: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '污水处理区传感器布点示意',
    standard: 'GB/T 50493 4.4.4: 工艺阀井、管沟等场所应设探测器',
    deviceName: '多种气体传感器',
  },
  MN: {
    image: '/sensor-devices/admin-area-sensors.png',
    name: '环境监测区传感器布点示意',
    standard: 'HJ 664-2012: 环境空气质量监测点位应代表一定空间范围',
    deviceName: '多种气体传感器',
  },
  MT: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '机修维护区传感器布点示意',
    standard: 'GB/T 50493 4.1.3: 释放源检测点布置',
    deviceName: '多种气体传感器',
  },
  FS: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '消防设施区传感器布点示意',
    standard: 'GB 50160 8.3: 消防水泵房应设置双电源供电',
    deviceName: '多种气体传感器',
  },
  FD: {
    image: '/sensor-devices/tank-farm-sensors.png',
    name: '防火堤传感器布点示意',
    standard: 'GB/T 50493 4.3.1: 液化烃储罐防火堤内应设探测器',
    deviceName: '多种气体传感器',
  },
  PL: {
    image: '/sensor-devices/production-area-sensors.png',
    name: '管道区传感器布点示意',
    standard: 'GB/T 50493 4.1.3: 管道释放源检测点布置',
    deviceName: '多种气体传感器',
  },
  A: {
    image: '/sensor-devices/admin-area-sensors.png',
    name: '行政办公区传感器布点示意',
    standard: 'GB/T 50493 4.1.3: 释放源检测点布置',
    deviceName: '多种气体传感器',
  },
}

export const defaultSensorDevice: SensorDeviceInfo = {
  image: '/sensor-devices/sensor-general.jpg',
  name: '气体探测器',
  standard: 'GB/T 50493 4.1.3: 释放源检测点布置',
  deviceName: '多种气体传感器',
}

export function getSensorZonePrefix(sensorId: string | null | undefined) {
  if (!sensorId) return ''
  return sensorId.split('-')[0] || ''
}

export function getSensorDevice(
  sensor: SensorDeviceInput | string | null | undefined,
): SensorDeviceInfo {
  const sensorId = typeof sensor === 'string' ? sensor : sensor?.id
  const prefix = getSensorZonePrefix(sensorId)
  return sensorDeviceMap[prefix] || defaultSensorDevice
}
