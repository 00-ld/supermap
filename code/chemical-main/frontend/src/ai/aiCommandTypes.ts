export type AiIntent =
  | 'OPEN_MONITORING'
  | 'RUN_DIFFUSION_SIMULATION'
  | 'RUN_SOURCE_INVERSION'
  | 'RUN_EVACUATION_PLANNING'
  | 'OPEN_3D_SCENE'
  | 'LOCATE_FACILITY'
  | 'OPEN_CAR'
  | 'OPEN_INSPECTION'
  | 'OPEN_YOLO'

export interface AiCommandPlan {
  intent: AiIntent
  title: string
  targetPath: string
  actionLabel: string
  summary: string
  parameters: Record<string, string>
  requiresConfirmation: boolean
}

export interface AiTaskDraft extends AiCommandPlan {
  id: string
  sourceText: string
  createdAt: string
}
