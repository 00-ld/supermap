/**
 * 小车巡检气体的单一数据源（single source of truth）。
 *
 * 收敛此前散落在 CarHome.vue（carGasMap / gasType / gasTypeMapping）、
 * CarDetail.vue（gasConfig）、carStore.ts（gasThreshold）里互相矛盾的多套硬编码。
 * 报警阈值此前存在「氨气 10 vs 25」的冲突，这里统一为 25（与 CarDetail 及
 * phase1Config.PHASE1_GASES 的 nh3.warningThreshold 一致）。
 *
 * 注意：本表是「小车四气检测域」的展示/判定常量（含 %LEL / %VOL 等设备量程口径），
 * 与 data/phase1Config.ts 的扩散物理域常量（ppm 口径）是不同关注点，二者不互相覆盖。
 */

export type CarGasId = 'ch4' | 'nh3' | 'co' | 'o2'
export type CarGasAlgorithmCode = 'CH4' | 'NH3' | 'CO' | 'O2'

export interface CarGasSpec {
  /** 小车编号（与后端 patrol_car.car_id 对应）。 */
  carId: number
  /** 气体标识，对齐 phase1Config / gasSourceCatalog 的 gasId。 */
  gasId: CarGasId
  /** 简短气体名（详情页基本信息「监测气体」）。 */
  type: string
  /** 图表头部 / 视频标签用名称。 */
  chartName: string
  /** 总览导航与卡片用名称。 */
  navLabel: string
  /** 浓度单位。 */
  unit: string
  /** 浓度列 / 图表纵轴标签。 */
  label: string
  /** 非氧气：报警上限阈值。 */
  warning?: number
  /** 氧气：安全下限。 */
  min?: number
  /** 氧气：安全上限。 */
  max?: number
}

export const CAR_GAS_CATALOG: Record<number, CarGasSpec> = {
  1: {
    carId: 1,
    gasId: 'ch4',
    type: '可燃气体',
    chartName: '可燃气体 (CH₄)',
    navLabel: '可燃气体',
    unit: '%LEL',
    label: '可燃气体浓度',
    warning: 25,
  },
  2: {
    carId: 2,
    gasId: 'nh3',
    type: 'NH₃',
    chartName: '氨气 (NH₃)',
    navLabel: '氨气 NH₃',
    unit: 'ppm',
    label: 'NH₃浓度',
    warning: 25,
  },
  3: {
    carId: 3,
    gasId: 'co',
    type: 'CO',
    chartName: 'CO气体',
    navLabel: '一氧化碳 CO',
    unit: 'ppm',
    label: 'CO浓度',
    warning: 20,
  },
  4: {
    carId: 4,
    gasId: 'o2',
    type: '氧气',
    chartName: '氧气 (O₂)',
    navLabel: '氧气 O₂',
    unit: '%VOL',
    label: '氧气浓度',
    min: 19.5,
    max: 23.5,
  },
}

/** 按小车编号取气体规格，缺省回退到 1 号车配置。 */
export function getCarGasSpec(carId: number): CarGasSpec {
  return CAR_GAS_CATALOG[carId] || CAR_GAS_CATALOG[1]
}

const GAS_ALGORITHM_CODE_BY_ID: Record<CarGasId, CarGasAlgorithmCode> = {
  ch4: 'CH4',
  nh3: 'NH3',
  co: 'CO',
  o2: 'O2',
}

/** 算法接口气体代码映射：carId → CH4/NH3/CO/O2。 */
export const CAR_GAS_ALGORITHM_CODE: Record<number, CarGasAlgorithmCode> = Object.fromEntries(
  Object.values(CAR_GAS_CATALOG).map((g) => [g.carId, GAS_ALGORITHM_CODE_BY_ID[g.gasId]]),
) as Record<number, CarGasAlgorithmCode>

export function getCarGasAlgorithmCode(carId: number): CarGasAlgorithmCode {
  return CAR_GAS_ALGORITHM_CODE[carId] || CAR_GAS_ALGORITHM_CODE[1]
}

export function parseCarGasValue(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const match = String(value ?? '').match(/-?\d+(\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

export function isCarGasValueInAlarm(
  carId: number,
  value: string | number | null | undefined,
): boolean {
  const numericValue = parseCarGasValue(value)
  if (numericValue == null) return false

  const spec = getCarGasSpec(carId)
  if (spec.gasId === 'o2') {
    return numericValue < (spec.min ?? 19.5) || numericValue > (spec.max ?? 23.5)
  }
  return spec.warning != null ? numericValue >= spec.warning : false
}

/** 图表头部 / 视频标签名映射：carId → chartName。 */
export const CAR_GAS_CHART_NAME: Record<number, string> = Object.fromEntries(
  Object.values(CAR_GAS_CATALOG).map((g) => [g.carId, g.chartName]),
)

/** 导航 / 卡片名映射：carId → navLabel。 */
export const CAR_GAS_NAV_LABEL: Record<number, string> = Object.fromEntries(
  Object.values(CAR_GAS_CATALOG).map((g) => [g.carId, g.navLabel]),
)

/** carStore 报警阈值结构：carId → { threshold, unit }。氧气为区间。 */
export const CAR_GAS_THRESHOLD: Record<
  number,
  { threshold: number | [number, number]; unit: string }
> = Object.fromEntries(
  Object.values(CAR_GAS_CATALOG).map((g) => [
    g.carId,
    {
      threshold:
        g.gasId === 'o2'
          ? ([g.min as number, g.max as number] as [number, number])
          : (g.warning as number),
      unit: g.unit,
    },
  ]),
)
