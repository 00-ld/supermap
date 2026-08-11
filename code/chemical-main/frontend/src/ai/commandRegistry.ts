import type { AiCommandPlan, AiIntent } from './aiCommandTypes'

type CommandDefinition = Omit<AiCommandPlan, 'parameters'>

const commandRegistry: Record<AiIntent, CommandDefinition> = {
  OPEN_MONITORING: {
    intent: 'OPEN_MONITORING',
    title: '打开实时监测',
    targetPath: '/thing/monitor_history',
    actionLabel: '进入实时监测',
    summary: '打开实时监测页面，供值守人员查看最新告警与监测数据。',
    requiresConfirmation: false,
  },
  RUN_DIFFUSION_SIMULATION: {
    intent: 'RUN_DIFFUSION_SIMULATION',
    title: '准备气体扩散模拟',
    targetPath: '/smart-map',
    actionLabel: '进入并准备模拟',
    summary: '在智慧地图中预填扩散模拟条件；确认后由现场人员启动模拟。',
    requiresConfirmation: true,
  },
  RUN_SOURCE_INVERSION: {
    intent: 'RUN_SOURCE_INVERSION',
    title: '准备泄漏源反演',
    targetPath: '/smart-map',
    actionLabel: '进入并准备反演',
    summary: '在智慧地图中准备当前监测数据的溯源分析，算法启动仍需人工确认。',
    requiresConfirmation: true,
  },
  RUN_EVACUATION_PLANNING: {
    intent: 'RUN_EVACUATION_PLANNING',
    title: '准备疏散规划',
    targetPath: '/smart-map',
    actionLabel: '进入并准备规划',
    summary: '在智慧地图中准备疏散规划参数，路线发布仍由值守人员确认。',
    requiresConfirmation: true,
  },
  OPEN_3D_SCENE: {
    intent: 'OPEN_3D_SCENE',
    title: '打开园区三维场景',
    targetPath: '/smart-map',
    actionLabel: '进入三维场景',
    summary: '进入智慧地图，由操作人员切换三维场景进行查看。',
    requiresConfirmation: false,
  },
  LOCATE_FACILITY: {
    intent: 'LOCATE_FACILITY',
    title: '定位园区设施',
    targetPath: '/smart-map',
    actionLabel: '进入并查看定位',
    summary: '进入智慧地图并保留设施定位任务，最终定位由页面受控状态执行。',
    requiresConfirmation: false,
  },
  OPEN_CAR: {
    intent: 'OPEN_CAR',
    title: '打开智巡监测',
    targetPath: '/car/home',
    actionLabel: '进入智巡监测',
    summary: '打开车辆智巡监测页面。',
    requiresConfirmation: false,
  },
  OPEN_INSPECTION: {
    intent: 'OPEN_INSPECTION',
    title: '打开巡检任务',
    targetPath: '/car/home',
    actionLabel: '进入巡检任务',
    summary: '打开智巡监测页面，供人员查看巡检任务。',
    requiresConfirmation: false,
  },
  OPEN_YOLO: {
    intent: 'OPEN_YOLO',
    title: '打开厂区图像巡检',
    targetPath: '/yolo',
    actionLabel: '进入图像巡检',
    summary: '打开 YOLO 厂区图像巡检页面，查看已有巡检汇总或提交图像进行识别。',
    requiresConfirmation: false,
  },
}

export const supportedAiCapabilities = [
  '智慧地图设施定位',
  '气体扩散模拟准备',
  '泄漏源反演准备',
  '疏散规划准备',
  '实时预警查看',
  '智巡监测查看',
  'YOLO 厂区图像巡检',
] as const

const gasByText: Array<[RegExp, string]> = [
  [/氨气|NH3/i, 'NH3'],
  [/氯气|CL2/i, 'CL2'],
  [/硫化氢|H2S/i, 'H2S'],
  [/甲烷|CH4/i, 'CH4'],
]

const detectGas = (text: string) => gasByText.find(([pattern]) => pattern.test(text))?.[1] || ''

const detectZone = (text: string) => {
  if (/储罐/.test(text)) return '储罐区'
  if (/装置/.test(text)) return '生产装置区'
  if (/仓储|仓库/.test(text)) return '仓储区'
  if (/办公/.test(text)) return '办公区'
  return ''
}

const buildPlan = (intent: AiIntent, parameters: Record<string, string> = {}): AiCommandPlan => ({
  ...commandRegistry[intent],
  parameters,
})

export const resolveAiCommand = (sourceText: string): AiCommandPlan | null => {
  const text = sourceText.trim()
  if (!text) return null
  const parameters: Record<string, string> = {}
  const gas = detectGas(text)
  const zone = detectZone(text)
  if (gas) parameters.gas = gas
  if (zone) parameters.zone = zone

  if (/扩散|模拟|仿真/.test(text)) return buildPlan('RUN_DIFFUSION_SIMULATION', parameters)
  if (/泄漏源|溯源|反演/.test(text)) return buildPlan('RUN_SOURCE_INVERSION', parameters)
  if (/疏散|撤离|逃生/.test(text)) return buildPlan('RUN_EVACUATION_PLANNING', parameters)
  if (/三维|3D/.test(text)) return buildPlan('OPEN_3D_SCENE', parameters)
  if (/图像|图片|视频|YOLO|人员识别/i.test(text)) return buildPlan('OPEN_YOLO', parameters)
  if (/小车|车辆|智巡/.test(text)) return buildPlan(/巡检/.test(text) ? 'OPEN_INSPECTION' : 'OPEN_CAR', parameters)
  if (/监测|告警|预警/.test(text)) return buildPlan('OPEN_MONITORING', parameters)

  const facility = text.match(/(?:看|查|定位|找到)\s*([A-Za-z]+[-_]?\d+)/i)?.[1]
  if (facility) return buildPlan('LOCATE_FACILITY', { ...parameters, facility: facility.toUpperCase() })
  return null
}
