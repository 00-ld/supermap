export interface EmergencyAdvice {
  source: 'QWEN' | 'LOCAL_KNOWLEDGE_BASE' | 'SAFETY_DEMO'
  model?: string
  riskLevel: string
  summary: string
  riskExplanation: string
  recommendations: string[]
  allowedActions: string[]
  pageOperations: string[]
  evidenceDocuments: string[]
  fallbackReason?: string
}

export function createEmergencyDemoAdvice(scenario: string): EmergencyAdvice {
  const isAmmonia = /液氨|氨气/.test(scenario)
  return {
    source: 'SAFETY_DEMO',
    model: 'local-safety-demo',
    riskLevel: 'HIGH',
    summary: isAmmonia
      ? '疑似液氨泄漏并伴随人员不适，应立即按高风险气体暴露场景处置。'
      : '疑似危险气体泄漏，应先控制人员暴露并核实物质、浓度与风向。',
    riskExplanation:
      '人员不适表明可能已经发生吸入暴露；在检测结果明确前，不应安排无防护人员靠近泄漏区。',
    recommendations: [
      '立即报警并启动园区应急响应，禁止无防护人员进入事故区。',
      '组织人员沿上风向或侧上风向撤离，在安全区清点人数并救治不适人员。',
      '结合固定监测、便携检测和气象数据划定警戒区，持续复测边界浓度。',
      '仅由具备资质且佩戴正压式空气呼吸器的人员确认泄漏源并实施堵漏。',
      '同步通知消防、医疗和环保联动单位，防止气体进入低洼区或受限空间。',
    ],
    allowedActions: [],
    pageOperations: [],
    evidenceDocuments: [],
    fallbackReason:
      '当前为未登录安全演示；登录并配置服务端后可检索知识库并由千问增强。',
  }
}
