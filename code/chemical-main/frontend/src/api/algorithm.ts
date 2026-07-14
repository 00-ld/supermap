import algorithmClient from './algorithmClient'
import type { AlgorithmResponse, AlgorithmTraceFields } from '@/types/api'

export type { AlgorithmResponse } from '@/types/api'

export type AlgorithmPayload = Record<string, unknown>
export type AlgorithmRecord = Record<string, unknown>

export interface AlgorithmHealth extends AlgorithmTraceFields {
  status: string
  version: string
  service: string
}

export interface DiffusionSimulationResult extends AlgorithmRecord, AlgorithmTraceFields {
  frames?: AlgorithmRecord[]
  metadata?: AlgorithmRecord
}

export interface SourceInversionResult extends AlgorithmRecord, AlgorithmTraceFields {
  estimatedSource?: AlgorithmRecord
  candidateRegions?: AlgorithmRecord[]
}

export interface EvacuationPlanningResult extends AlgorithmRecord, AlgorithmTraceFields {
  isReachable?: boolean
  routesByBuilding?: AlgorithmRecord[]
  selectedRoute?: AlgorithmRecord
}

export interface GasTypeItem extends AlgorithmRecord {
  id?: string | number
  name?: string
}

export type ValidationReport = AlgorithmRecord & AlgorithmTraceFields

export function runDiffusionSimulation<TResult = DiffusionSimulationResult>(payload: AlgorithmPayload) {
  return algorithmClient.post<AlgorithmPayload, AlgorithmResponse<TResult>>(
    '/api/diffusion/simulate',
    payload,
  )
}

export function runAnalyticCoarseSearch(payload: AlgorithmPayload) {
  return algorithmClient.post<AlgorithmPayload, AlgorithmResponse<SourceInversionResult>>(
    '/api/inversion/coarse-search',
    payload,
  )
}

export function runAnalyticSourceInversion(payload: AlgorithmPayload) {
  return algorithmClient.post<AlgorithmPayload, AlgorithmResponse<SourceInversionResult>>(
    '/api/inversion/solve',
    payload,
  )
}

export function runParticleFilterInversion(payload: AlgorithmPayload) {
  return algorithmClient.post<AlgorithmPayload, AlgorithmResponse<SourceInversionResult>>(
    '/api/inversion/particle-filter',
    payload,
  )
}

export function getBtexValidationReport() {
  return algorithmClient.get<null, AlgorithmResponse<ValidationReport>>('/api/deep-learning/btex-validation')
}

export function getPrairieGrassSourceValidationReport() {
  return algorithmClient.get<null, AlgorithmResponse<ValidationReport>>(
    '/api/deep-learning/prairie-grass-source-validation',
  )
}

export function runEvacuationPlanning<TResult = EvacuationPlanningResult>(payload: AlgorithmPayload) {
  return algorithmClient.post<AlgorithmPayload, AlgorithmResponse<TResult>>(
    '/api/planning/evacuation',
    payload,
  )
}

export function getGasTypes() {
  return algorithmClient.get<null, AlgorithmResponse<GasTypeItem[]>>('/api/gas-types')
}

export function checkAlgorithmHealth() {
  return algorithmClient.get<null, AlgorithmResponse<AlgorithmHealth>>('/api/health')
}
