export type InversionVisualizationStage = 'coarse' | 'refinement' | 'particle'

export interface InversionVisualizationPolicy {
  candidateLimit: number
  showRefinement: boolean
  showDensity: boolean
  showConfidence: boolean
  particleLimit: number
  minimumParticleWeight: number
  confidenceAlpha: number
}

export interface InversionLegendItem {
  id: 'candidate' | 'refinement' | 'estimate' | 'confidence' | 'particle'
  label: string
  detail: string
  color: string
  appearance: 'dot' | 'ring' | 'sample'
}

export function inversionVisualizationPolicy(
  stage: InversionVisualizationStage,
): InversionVisualizationPolicy {
  if (stage === 'coarse') {
    return {
      candidateLimit: 3,
      showRefinement: false,
      showDensity: false,
      showConfidence: false,
      particleLimit: 0,
      minimumParticleWeight: 0,
      confidenceAlpha: 0,
    }
  }
  if (stage === 'refinement') {
    return {
      candidateLimit: 0,
      showRefinement: true,
      showDensity: false,
      showConfidence: false,
      particleLimit: 0,
      minimumParticleWeight: 0,
      confidenceAlpha: 0,
    }
  }
  return {
    candidateLimit: 0,
    showRefinement: false,
    showDensity: false,
    showConfidence: true,
    particleLimit: 12,
    minimumParticleWeight: 0.45,
    confidenceAlpha: 0.12,
  }
}

export function resolveInversionLegendItems(
  stage: InversionVisualizationStage,
): InversionLegendItem[] {
  if (stage === 'coarse') {
    return [
      {
        id: 'candidate',
        label: '粗搜索候选区',
        detail: '最多显示 3 处',
        color: '#38bdf8',
        appearance: 'ring',
      },
    ]
  }
  if (stage === 'refinement') {
    return [
      {
        id: 'refinement',
        label: 'EKI 收敛中心',
        detail: '当前迭代结果',
        color: '#fbbf24',
        appearance: 'dot',
      },
    ]
  }
  return [
    {
      id: 'estimate',
      label: '最终估计源',
      detail: '应急决策定位',
      color: '#ff5a4f',
      appearance: 'dot',
    },
    {
      id: 'confidence',
      label: '95% 置信范围',
      detail: '位置不确定区',
      color: '#f472b6',
      appearance: 'ring',
    },
    {
      id: 'particle',
      label: '高权重样本',
      detail: '最多 12 个',
      color: '#fbbf24',
      appearance: 'sample',
    },
  ]
}
