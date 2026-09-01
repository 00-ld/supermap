import { reactive } from 'vue'

export interface SmartMapExecutorState {
  mode: string
  fallbackReason: string
  workerAvailable?: boolean
  workerInitialized?: boolean
}

export interface SmartMapSourceInversionState {
  coarseRunning: boolean
  particleRunning: boolean
}

export interface SmartMapSourceInversionRunState {
  isCoarseRunning: () => boolean
  isParticleRunning: () => boolean
}

export interface SmartMapSourceInversionConfig {
  observationSignalMode: string
  topK: number
  gridStep: number
  candidateRadius: number
  supportRadius: number
  distanceScale: number
  mergeDistance: number
  minObservationThreshold: number
}

export interface SmartMapSourceRefinementConfig {
  animationSteps: number
  minSignalThreshold: number
  ekiConvergenceRatio: number
}

export interface SmartMapParticleFilterConfig {
  numParticles: number
  iterations: number
  sensorNoiseRelative: number
  modelNoiseRelative: number
  resampleThreshold: number
  mcmcSteps: number
  minSignalThreshold: number
  seed: number
}

export function useSmartMapAlgorithmStates() {
  const diffusionExecutorState = reactive<SmartMapExecutorState>({
    mode: 'local',
    workerAvailable: false,
    workerInitialized: false,
    fallbackReason: '',
  })
  const evacuationExecutorState = reactive<SmartMapExecutorState>({
    mode: 'local',
    fallbackReason: '',
  })
  const sourceInversionExecutorState = reactive<SmartMapExecutorState>({
    mode: 'local',
    fallbackReason: '',
  })
  const sourceInversionState = reactive<SmartMapSourceInversionState>({
    coarseRunning: false,
    particleRunning: false,
  })
  const sourceInversionRunState: SmartMapSourceInversionRunState = {
    isCoarseRunning: () => sourceInversionState.coarseRunning,
    isParticleRunning: () => sourceInversionState.particleRunning,
  }
  const sourceInversionConfig = reactive<SmartMapSourceInversionConfig>({
    observationSignalMode: 'peak',
    topK: 4,
    gridStep: 20,
    candidateRadius: 45,
    supportRadius: 260,
    distanceScale: 90,
    mergeDistance: 80,
    minObservationThreshold: 0.05,
  })
  const sourceRefinementConfig = reactive<SmartMapSourceRefinementConfig>({
    animationSteps: 18,
    minSignalThreshold: 0.05,
    ekiConvergenceRatio: 0.005,
  })
  const particleFilterConfig = reactive<SmartMapParticleFilterConfig>({
    numParticles: 12000,
    iterations: 36,
    sensorNoiseRelative: 0.10,
    modelNoiseRelative: 0.05,
    resampleThreshold: 0.55,
    mcmcSteps: 2,
    minSignalThreshold: 0.05,
    seed: 20250613,
  })

  return {
    diffusionExecutorState,
    evacuationExecutorState,
    particleFilterConfig,
    sourceInversionConfig,
    sourceInversionExecutorState,
    sourceInversionRunState,
    sourceInversionState,
    sourceRefinementConfig,
  }
}
