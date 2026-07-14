import { computed, ref } from 'vue'
import {
  getBtexValidationReport,
  getPrairieGrassSourceValidationReport,
} from '@/api/algorithm'
import { getErrorStatus } from './useSmartMapUi'

type ValidationRecord = Record<string, unknown>
type ValidationLoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error'

function asRecord(value: unknown): ValidationRecord {
  return value && typeof value === 'object' ? value as ValidationRecord : {}
}

function asRecordArray(value: unknown): ValidationRecord[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as ValidationRecord[] : []
}

function sourceLocalizationFailed(item: ValidationRecord): boolean {
  const estimates = asRecord(item.estimates)
  return Object.values(estimates).some((estimate: unknown) => (
    asRecord(estimate).passes500mCheck === false
  ))
}

function btexCalibratedEstimate(item: ValidationRecord): ValidationRecord {
  return asRecord(asRecord(item.estimates).btexCalibrated)
}

function unwrapAlgorithmReport(response: unknown): ValidationRecord | null {
  const envelope = asRecord(response)
  const data = envelope.data
  const ok = envelope.ok === true || envelope.code === 200
  const report = data && ok ? asRecord(data) : envelope
  return report.dataset || report.validation ? report : null
}

export function useSmartMapValidationReports() {
  const btexValidationReport = ref<ValidationRecord | null>(null)
  const btexValidationLoadState = ref<ValidationLoadState>('idle')
  const prairieValidationReport = ref<ValidationRecord | null>(null)
  const prairieValidationLoadState = ref<ValidationLoadState>('idle')

  const btexValidationStatusClass = computed(() => {
    const report = asRecord(btexValidationReport.value)
    const acceptance = asRecord(report.acceptance)
    const validation = asRecord(report.validation)
    const localization = asRecordArray(validation.sourceLocalization)
    return {
      ready: btexValidationLoadState.value === 'ready',
      failed: acceptance.overallRealSourceTracingPassed === false,
      warning: localization.some(sourceLocalizationFailed),
      muted: btexValidationLoadState.value !== 'ready',
    }
  })

  const btexValidationSummary = computed(() => {
    const report = btexValidationReport.value
    if (btexValidationLoadState.value === 'loading') {
      return { label: '读取中', sourceText: '--', localizationText: '--' }
    }
    if (!report) {
      const label = btexValidationLoadState.value === 'missing' ? '未生成报告' : '待读取'
      return { label, sourceText: '运行 BTEX 验证', localizationText: '未验证' }
    }
    const validation = asRecord(report.validation)
    const rows = Number(report.rows)
    const inSample = asRecord(validation.inSampleCalibrationUpperBound)
    const facts = asRecordArray(report.releaseFacts)
    const rates = facts
      .map(item => Number(item.sourceRateGS))
      .filter((value: number) => Number.isFinite(value))
      .map((value: number) => `${value.toFixed(1)}g/s`)
    const localization = asRecordArray(validation.sourceLocalization)
    const calibratedErrors = localization
      .map(item => Number(btexCalibratedEstimate(item).horizontalErrorM))
      .filter((value: number) => Number.isFinite(value))
    const localizationPass = localization.length > 0 && localization.every(item => (
      btexCalibratedEstimate(item).passes500mCheck === true
    ))
    const bestText = calibratedErrors.length
      ? calibratedErrors.map((value: number) => `${Math.round(value)}m`).join('/')
      : '无定位报告'
    const rmse = Number(inSample.rmseLogPptv)
    const fac5 = Number(inSample.fac5)
    return {
      label: Number.isFinite(rmse) && Number.isFinite(fac5)
        ? `RMSE ${rmse.toFixed(2)} / FAC5 ${fac5.toFixed(2)}`
        : '报告已读取',
      sourceText: `${Number.isFinite(rows) ? rows : '--'}条 / ${rates.join(', ') || '--'}`,
      localizationText: localizationPass ? `通过 500m (${bestText})` : `验证失败: ${bestText}`,
    }
  })

  const prairieValidationStatusClass = computed(() => {
    const report = asRecord(prairieValidationReport.value)
    const acceptance = asRecord(report.acceptance)
    return {
      ready: prairieValidationLoadState.value === 'ready',
      failed: acceptance.sourceLocalizationPassed === false,
      warning: acceptance.decision === 'limited_pass_location_only'
        || acceptance.concentrationShapePassed === false,
      muted: prairieValidationLoadState.value !== 'ready',
    }
  })

  const prairieValidationSummary = computed(() => {
    const report = prairieValidationReport.value
    if (prairieValidationLoadState.value === 'loading') {
      return { label: '读取中', sourceText: '--', concentrationText: '--' }
    }
    if (!report) {
      const label = prairieValidationLoadState.value === 'missing' ? '未生成报告' : '待读取'
      return { label, sourceText: '运行 Prairie 验证', concentrationText: '未验证' }
    }
    const summary = asRecord(report.summary)
    const acceptance = asRecord(report.acceptance)
    const method = asRecord(report.method)
    const median = Number(summary.medianSourceErrorM)
    const p90 = Number(summary.p90SourceErrorM)
    const experiments = Number(summary.experimentsEvaluated)
    const boundary = Number(method.boundaryViolationCount)
    const fac2 = Number(summary.meanFac2)
    const locationText = acceptance.sourceLocalizationPassed
      ? `位置有限通过 ${Number.isFinite(median) ? median.toFixed(1) : '--'}m`
      : `位置失败 ${Number.isFinite(median) ? median.toFixed(1) : '--'}m`
    return {
      label: Number.isFinite(p90) ? `${locationText} / P90 ${p90.toFixed(1)}m` : locationText,
      sourceText: `${Number.isFinite(experiments) ? experiments : '--'}组 / 越界${Number.isFinite(boundary) ? boundary : '--'}次`,
      concentrationText: acceptance.concentrationShapePassed
        ? `FAC2 ${Number.isFinite(fac2) ? fac2.toFixed(2) : '--'}`
        : `未过 FAC2 ${Number.isFinite(fac2) ? fac2.toFixed(2) : '--'}`,
    }
  })

  async function loadBtexValidationReport() {
    btexValidationLoadState.value = 'loading'
    try {
      const report = unwrapAlgorithmReport(await getBtexValidationReport())
      btexValidationReport.value = report
      btexValidationLoadState.value = report ? 'ready' : 'error'
    } catch (error: unknown) {
      btexValidationLoadState.value = getErrorStatus(error) === 404 ? 'missing' : 'error'
    }
  }

  async function loadPrairieGrassValidationReport() {
    prairieValidationLoadState.value = 'loading'
    try {
      const report = unwrapAlgorithmReport(await getPrairieGrassSourceValidationReport())
      prairieValidationReport.value = report
      prairieValidationLoadState.value = report ? 'ready' : 'error'
    } catch (error: unknown) {
      prairieValidationLoadState.value = getErrorStatus(error) === 404 ? 'missing' : 'error'
    }
  }

  return {
    btexValidationReport,
    btexValidationLoadState,
    btexValidationStatusClass,
    btexValidationSummary,
    prairieValidationReport,
    prairieValidationLoadState,
    prairieValidationStatusClass,
    prairieValidationSummary,
    loadBtexValidationReport,
    loadPrairieGrassValidationReport,
  }
}
