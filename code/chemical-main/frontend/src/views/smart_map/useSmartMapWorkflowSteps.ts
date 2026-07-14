import { computed, type ComputedRef, type Ref } from 'vue'
import type { SmartMapSourceInversionRunState } from './useSmartMapAlgorithmStates'
import type { SmartMapDiffusionRunState } from './useSmartMapDiffusionPlayback'

export type SmartMapWorkflowStepState = 'done' | 'active' | 'pending'

export interface SmartMapWorkflowStep {
  key: string
  index: string
  label: string
  state: SmartMapWorkflowStepState
}

interface SmartMapWorkflowRoute {
  isReachable?: boolean
}

interface SmartMapWorkflowOptions {
  currentLeakSourcePoint: ComputedRef<unknown>
  diffusionFrames: Ref<unknown[]>
  diffusionRunState: SmartMapDiffusionRunState
  activeEvacuationRoute: ComputedRef<SmartMapWorkflowRoute | null | undefined>
  observationSummary: Ref<unknown>
  coarseCandidateRegions: ComputedRef<unknown[]>
  sourceInversionRunState: SmartMapSourceInversionRunState
  isDeepParticleResult: ComputedRef<boolean>
}

export function useSmartMapWorkflowSteps(options: SmartMapWorkflowOptions) {
  const commandWorkflowSteps = computed<SmartMapWorkflowStep[]>(() => [
    {
      key: 'source',
      index: '1',
      label: options.currentLeakSourcePoint.value ? '源点已选' : '选择源点',
      state: options.currentLeakSourcePoint.value ? 'done' : 'pending',
    },
    {
      key: 'diffusion',
      index: '2',
      label: options.diffusionFrames.value.length ? '扩散已生成' : '扩散模拟',
      state: options.diffusionFrames.value.length
        ? 'done'
        : options.diffusionRunState.isRunning() ? 'active' : 'pending',
    },
    {
      key: 'evacuation',
      index: '3',
      label: options.activeEvacuationRoute.value?.isReachable ? '路径已规划' : '逃生规划',
      state: options.activeEvacuationRoute.value?.isReachable ? 'done' : 'pending',
    },
  ])

  const sourceWorkflowSteps = computed<SmartMapWorkflowStep[]>(() => [
    {
      key: 'observations',
      index: '1',
      label: options.observationSummary.value ? '观测已整理' : '整理观测',
      state: options.observationSummary.value ? 'done' : 'pending',
    },
    {
      key: 'coarse',
      index: '2',
      label: options.coarseCandidateRegions.value.length ? '候选已生成' : '定位初始化',
      state: options.coarseCandidateRegions.value.length
        ? 'done'
        : options.sourceInversionRunState.isCoarseRunning() ? 'active' : 'pending',
    },
    {
      key: 'particle',
      index: '3',
      label: options.isDeepParticleResult.value ? '精定位完成' : '深度学习',
      state: options.isDeepParticleResult.value
        ? 'done'
        : options.sourceInversionRunState.isParticleRunning() ? 'active' : 'pending',
    },
  ])

  return {
    commandWorkflowSteps,
    sourceWorkflowSteps,
  }
}
