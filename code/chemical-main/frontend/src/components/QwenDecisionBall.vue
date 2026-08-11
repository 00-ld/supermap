<template>
  <div v-if="userStore.token" class="qwen-assistant" :style="ballStyle">
    <button
      class="qwen-ball"
      type="button"
      aria-label="打开 AI 智能副驾驶"
      title="AI 智能副驾驶"
      @pointerdown="startDrag"
      @click="handleBallClick"
    >
      <img :src="assistantIcon" alt="AI 智能副驾驶" class="qwen-ball-icon" />
      <span v-if="latestAdvice?.reviewStatus === 'PENDING'" class="qwen-ball-dot"></span>
    </button>

    <section v-if="open" class="qwen-panel" @pointerdown.stop>
      <header class="qwen-panel-header">
        <div>
          <strong>AI 智能副驾驶</strong>
          <small>理解任务、准备页面操作；高风险动作始终保留人工确认。</small>
        </div>
        <button type="button" class="qwen-close" aria-label="关闭" @click="open = false">×</button>
      </header>

      <div class="qwen-tabs" role="tablist">
        <button :class="{ active: activeTab === 'copilot' }" type="button" @click="activeTab = 'copilot'">业务编排</button>
        <button :class="{ active: activeTab === 'advice' }" type="button" @click="activeTab = 'advice'">应急建议</button>
      </div>

      <div v-if="activeTab === 'copilot'">
        <label class="qwen-field-label" for="qwen-command">告诉我你要处理什么</label>
        <textarea
          id="qwen-command"
          v-model="commandText"
          class="qwen-textarea"
          maxlength="300"
          placeholder="例如：我要对储罐区进行氨气扩散模拟"
          @input="resolveCommand"
        ></textarea>
        <p class="qwen-capability-note">仅基于当前已接入功能编排。点击下方功能可直接填入对应指令。</p>
        <div class="qwen-capabilities">
          <button
            v-for="capability in assistantCommands"
            :key="capability.label"
            type="button"
            :title="`示例：${capability.command}`"
            @click="useExample(capability.command)"
          >
            {{ capability.label }}
          </button>
        </div>

        <article v-if="commandPlan" class="qwen-command-result">
          <span class="qwen-result-kicker">已识别受控意图</span>
          <h4>{{ commandPlan.title }}</h4>
          <p>{{ commandPlan.summary }}</p>
          <dl>
            <div><dt>目标页面</dt><dd>{{ commandPlan.targetPath }}</dd></div>
            <div><dt>受控动作</dt><dd>{{ commandPlan.actionLabel }}</dd></div>
            <div v-for="[key, value] in commandParameters" :key="key"><dt>{{ parameterLabel(key) }}</dt><dd>{{ value }}</dd></div>
          </dl>
          <small v-if="commandPlan.requiresConfirmation">将仅导航并准备参数，不会自动启动算法或发布处置指令。</small>
          <button type="button" class="qwen-submit" @click="executeCommand">{{ commandPlan.actionLabel }}</button>
        </article>
        <p v-else-if="commandText.trim()" class="qwen-empty-state">暂未识别为可执行任务。可以尝试“看 T-07”“氨气扩散模拟”“找泄漏源”或“打开智巡监测”。</p>
      </div>

      <div v-else>
        <label class="qwen-field-label" for="qwen-alert">关联最近告警</label>
        <select id="qwen-alert" v-model="selectedAlertId" class="qwen-select">
          <option value="">现场临时情况，不关联告警</option>
          <option v-for="alert in alerts" :key="alert.id" :value="String(alert.id)">
            小车 {{ alert.carId }} · {{ alert.gasType || '异常目标' }} · {{ formatTime(alert.warningTime) }}
          </option>
        </select>

        <label class="qwen-field-label" for="qwen-scenario">现场情况</label>
        <textarea
          id="qwen-scenario"
          v-model="scenario"
          class="qwen-textarea"
          maxlength="1000"
          placeholder="例如：小车发现疑似泄漏，现场有人员靠近，风向从东向西"
        ></textarea>
        <button type="button" class="qwen-submit" :disabled="loading || !scenario.trim()" @click="generateAdvice">
          {{ loading ? '正在分析...' : '生成快速应急方案' }}
        </button>

        <article v-if="latestAdvice" class="qwen-result">
          <div class="qwen-result-meta"><span>应急辅助方案</span><b>{{ latestAdvice.riskLevel }}</b></div>
          <h4>{{ latestAdvice.summary }}</h4>
          <h5>立即处置</h5>
          <ol class="qwen-numbered-list"><li v-for="(item, index) in latestAdvice.recommendations.slice(0, 4)" :key="`${index}-${item}`">{{ item }}</li></ol>
          <h5>页面操作建议</h5>
          <ol class="qwen-numbered-list"><li v-for="(item, index) in latestAdvice.pageOperations.slice(0, 3)" :key="`${index}-${item}`">{{ item }}</li></ol>
          <div v-if="latestAdvice.uncertainties?.length" class="qwen-uncertainties"><details><summary>待确认信息（{{ latestAdvice.uncertainties.length }}）</summary><ul><li v-for="item in latestAdvice.uncertainties.slice(0, 3)" :key="item">{{ item }}</li></ul></details></div>
          <div v-if="userStore.isAdmin && latestAdvice.reviewStatus === 'PENDING' && latestAdvice.id" class="qwen-review-actions"><button type="button" @click="review('APPROVED')">采用建议</button><button type="button" @click="review('REJECTED')">拒绝建议</button></div>
          <small v-if="latestAdvice.fallbackReason">{{ latestAdvice.fallbackReason }}</small>
          <div class="qwen-evidence"><strong>依据标准</strong><ol class="qwen-numbered-list"><li v-for="(item, index) in latestAdvice.evidenceStandards?.slice(0, 3)" :key="`${index}-${item}`">{{ item }}</li></ol></div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import useUserStore from '@/store/modules/user'
import assistantIcon from '@/assets/icons/emergency-assistant.svg'
import { createAiTaskDraft } from '@/ai/aiTaskDraftStore'
import { resolveAiCommand } from '@/ai/commandRegistry'
import type { AiCommandPlan } from '@/ai/aiCommandTypes'
import { reqApproveAiAdvice, reqRejectAiAdvice, type AiAdviceRecord } from '@/api/aiDecision'
import type { WarningHistoryRecord } from '@/api/warningHistory'
import { GET_TOKEN } from '@/utils/token'

const userStore = useUserStore()
const router = useRouter()
const open = ref(false)
const activeTab = ref<'copilot' | 'advice'>('copilot')
const loading = ref(false)
const alerts = ref<WarningHistoryRecord[]>([])
const selectedAlertId = ref('')
const scenario = ref('')
const latestAdvice = ref<AiAdviceRecord | null>(null)
const commandText = ref('')
const commandPlan = ref<AiCommandPlan | null>(null)
const commandExamples = ['带我去看 T-07', '我要对储罐区进行氨气扩散模拟', '用现在的监测数据帮我找泄漏源', '打开智巡监测']
const capabilityCommands = [
  { label: '设施定位', command: '带我去看 T-07' },
  { label: '气体扩散模拟', command: '我要对储罐区进行氨气扩散模拟' },
  { label: '泄漏源反演', command: '用现在的监测数据帮我找泄漏源' },
  { label: '疏散规划', command: '准备储罐区疏散规划' },
  { label: '实时预警', command: '打开实时监测' },
  { label: '智巡监测', command: '打开智巡监测' },
  { label: 'YOLO 图像巡检', command: '打开 YOLO 图像巡检' },
]
const assistantCommands = [
  ...capabilityCommands,
  ...commandExamples.map((command) => ({ label: command, command })),
]
const commandParameters = computed(() => Object.entries(commandPlan.value?.parameters || {}))
const parameterLabel = (key: string) => ({ gas: '气体', zone: '区域', facility: '设施' }[key] || key)

const storedPosition = (() => {
  try {
    const value = JSON.parse(localStorage.getItem('qwen-decision-ball-position') || 'null') as { x?: number; y?: number } | null
    return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: value.x!, y: value.y! } : null
  } catch { return null }
})()
const position = ref(storedPosition || { x: Math.max(16, window.innerWidth - 82), y: Math.max(100, window.innerHeight * 0.62) })
const dragging = ref(false)
const moved = ref(false)
let dragOffset = { x: 0, y: 0 }
const ballStyle = computed(() => ({ left: `${position.value.x}px`, top: `${position.value.y}px` }))

const resolveCommand = () => { commandPlan.value = resolveAiCommand(commandText.value) }
const useExample = (example: string) => { commandText.value = example; resolveCommand() }
const loadAlerts = async () => {
  try {
    const token = userStore.token || GET_TOKEN()
    const response = await fetch(`${import.meta.env.VITE_APP_BASE_API || '/api'}/history/list`, {
      headers: token ? { token } : undefined,
    })
    if (!response.ok) return
    const result = await response.json() as { data?: WarningHistoryRecord[] }
    alerts.value = Array.isArray(result.data) ? result.data : []
  } catch { alerts.value = [] }
}
const handleBallClick = async () => {
  if (moved.value) return
  open.value = !open.value
  if (open.value && !alerts.value.length) await loadAlerts()
}
const executeCommand = async () => {
  if (!commandPlan.value) return
  const draft = createAiTaskDraft(commandPlan.value, commandText.value.trim())
  await router.push({ path: commandPlan.value.targetPath, query: { aiDraft: draft.id } })
  open.value = false
  ElMessage.success(commandPlan.value.requiresConfirmation ? '已进入页面并准备任务，请确认后再执行。' : '已进入目标页面。')
}
const generateAdvice = async () => {
  loading.value = true
  try {
    latestAdvice.value = await requestAdvice()
    ElMessage.success('应急辅助方案已生成，请人工审核。')
  } catch {
    latestAdvice.value = createLocalFallbackAdvice()
    ElMessage.warning('后端 AI 服务暂不可用，已切换为本地规则建议。')
  } finally { loading.value = false }
}

const requestAdvice = async (): Promise<AiAdviceRecord> => {
  const token = userStore.token || GET_TOKEN()
  const alertId = selectedAlertId.value ? Number(selectedAlertId.value) : null
  const path = alertId ? `/mobile/alerts/${alertId}/ai-advice` : '/mobile/ai-advice/quick'
  const body = alertId
    ? { alertType: 'GAS_CONCENTRATION', evidence: scenario.value.trim() }
    : { scenario: scenario.value.trim() }
  const response = await fetch(`${import.meta.env.VITE_APP_BASE_API || '/api'}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { token } : {}) },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`AI advice request failed with ${response.status}`)
  const result = await response.json() as { data?: AiAdviceRecord }
  if (!result.data) throw new Error('AI advice response is empty')
  return result.data
}

const createLocalFallbackAdvice = (): AiAdviceRecord => {
  const selectedAlert = alerts.value.find((alert) => String(alert.id) === selectedAlertId.value)
  const scenarioText = scenario.value.trim()
  const hasLeak = /泄漏|泄露|超标|异常/.test(scenarioText)
  return {
    id: 0,
    alertId: Number(selectedAlert?.id) || 0,
    carId: Number(selectedAlert?.carId) || 0,
    alertType: selectedAlert?.gasType || 'EMERGENCY_QUICK_DECISION',
    source: 'RULE',
    model: null,
    riskLevel: hasLeak ? 'HIGH' : 'MEDIUM',
    summary: hasLeak ? '检测到疑似气体异常，请先隔离风险并核实现场状态。' : '已根据现场描述生成基础处置建议，请结合实时监测结果复核。',
    riskExplanation: '后端 AI 服务暂不可用，本建议仅使用前端固定规则生成，不替代现场判断。',
    recommendations: [
      '确认现场人员安全，按现场制度保持安全距离并限制无关人员进入。',
      '进入“实时预警”查看相关告警与监测值，确认异常是否持续。',
      '进入“智慧地图”查看扩散范围；需要启动模拟或疏散规划时由人员确认。',
      '记录现场情况，待后端服务恢复后重新生成完整 AI 建议。',
    ],
    allowedActions: ['查看实时预警', '进入智慧地图准备分析任务'],
    pageOperations: ['实时预警：查看当前告警', '智慧地图：确认扩散范围并准备受控任务'],
    evidenceStandards: ['当前输入的现场描述', '系统实时预警页面', '智慧地图中的监测数据'],
    evidenceDocuments: [],
    dataQuality: 'degraded',
    uncertainties: ['后端 AI 服务未返回模型分析结果', '现场气体浓度和风向需要人工核实'],
    fallbackReason: '后端 AI 服务暂不可用，当前展示前端本地规则建议。',
    reviewStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
const review = async (status: 'APPROVED' | 'REJECTED') => {
  if (!latestAdvice.value?.id) return
  try { latestAdvice.value = status === 'APPROVED' ? (await reqApproveAiAdvice(latestAdvice.value.id)).data : (await reqRejectAiAdvice(latestAdvice.value.id)).data } catch (error) { ElMessage.error(`审核失败：${(error as Error).message}`) }
}
const startDrag = (event: PointerEvent) => { event.preventDefault(); dragging.value = true; moved.value = false; dragOffset = { x: event.clientX - position.value.x, y: event.clientY - position.value.y }; window.addEventListener('pointermove', moveBall); window.addEventListener('pointerup', stopDrag, { once: true }) }
const moveBall = (event: PointerEvent) => { if (!dragging.value) return; const nextX = Math.min(Math.max(8, event.clientX - dragOffset.x), window.innerWidth - 66); const nextY = Math.min(Math.max(70, event.clientY - dragOffset.y), window.innerHeight - 66); moved.value = Math.abs(nextX - position.value.x) > 4 || Math.abs(nextY - position.value.y) > 4; position.value = { x: nextX, y: nextY } }
const stopDrag = () => { if (!dragging.value) return; dragging.value = false; window.removeEventListener('pointermove', moveBall); position.value = { x: position.value.x + 33 < window.innerWidth / 2 ? 8 : window.innerWidth - 66, y: position.value.y }; localStorage.setItem('qwen-decision-ball-position', JSON.stringify(position.value)) }
const clampPosition = () => { position.value = { x: Math.min(Math.max(8, position.value.x), Math.max(8, window.innerWidth - 66)), y: Math.min(Math.max(70, position.value.y), Math.max(70, window.innerHeight - 66)) } }
const formatTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'
window.addEventListener('resize', clampPosition)
onBeforeUnmount(() => { window.removeEventListener('pointermove', moveBall); window.removeEventListener('resize', clampPosition) })
</script>

<style scoped>
.qwen-assistant { position: fixed; z-index: 3000; width: 58px; height: 58px; touch-action: none; }.qwen-ball { width: 58px; height: 58px; padding: 0; border: 0; background: transparent; filter: drop-shadow(0 8px 12px rgba(0, 0, 0, .34)); cursor: grab; }.qwen-ball:active { cursor: grabbing; }.qwen-ball-icon { display: block; width: 58px; height: 58px; object-fit: contain; }.qwen-ball-dot { position: absolute; top: 1px; right: 2px; width: 11px; height: 11px; border: 2px solid #081a2a; border-radius: 50%; background: #f56c6c; }.qwen-panel { position: absolute; right: 0; bottom: 72px; width: min(390px, calc(100vw - 24px)); max-height: min(680px, calc(100vh - 96px)); overflow: auto; padding: 16px; border: 1px solid rgba(120, 211, 214, .32); border-radius: 8px; background: rgba(7, 24, 38, .98); color: #eaf8f7; box-shadow: 0 20px 52px rgba(0, 0, 0, .42); }.qwen-panel-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 14px; }.qwen-panel-header strong, .qwen-panel-header small { display: block; }.qwen-panel-header small { margin-top: 5px; color: rgba(234, 248, 247, .62); font-size: 12px; line-height: 1.45; }.qwen-close { border: 0; background: transparent; color: #9adbd7; font-size: 22px; cursor: pointer; }.qwen-tabs { display: flex; margin-bottom: 14px; border-bottom: 1px solid rgba(120, 211, 214, .22); }.qwen-tabs button { flex: 1; padding: 8px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: rgba(234, 248, 247, .6); cursor: pointer; }.qwen-tabs button.active { border-bottom-color: #18a999; color: #9df5e5; }.qwen-field-label { display: block; margin: 12px 0 6px; color: rgba(234, 248, 247, .72); font-size: 12px; }.qwen-select, .qwen-textarea { box-sizing: border-box; width: 100%; border: 1px solid rgba(120, 211, 214, .24); border-radius: 4px; background: rgba(0, 9, 18, .48); color: #effffd; padding: 9px 10px; font: inherit; }.qwen-textarea { min-height: 82px; resize: vertical; }.qwen-capability-note { margin: 9px 0 6px; color: rgba(234, 248, 247, .62); font-size: 12px; line-height: 1.4; }.qwen-capabilities { display: flex; flex-wrap: wrap; gap: 5px; }.qwen-capabilities span { border: 1px solid rgba(120, 211, 214, .2); border-radius: 3px; padding: 3px 6px; color: #a9fff1; font-size: 11px; }.qwen-shortcuts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }.qwen-shortcuts button { max-width: 100%; overflow: hidden; border: 1px solid rgba(120, 211, 214, .26); border-radius: 3px; background: rgba(24, 169, 153, .09); color: #a9fff1; padding: 5px 7px; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }.qwen-submit { width: 100%; margin-top: 12px; border: 0; border-radius: 4px; padding: 10px; background: #18a999; color: #071c24; font-weight: 700; cursor: pointer; }.qwen-submit:disabled { opacity: .52; cursor: not-allowed; }.qwen-command-result, .qwen-result { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(120, 211, 214, .18); }.qwen-result-kicker, .qwen-result-meta { color: #7de1d2; font-size: 12px; }.qwen-command-result h4, .qwen-result h4 { margin: 8px 0; line-height: 1.5; }.qwen-command-result p, .qwen-result li { color: rgba(234, 248, 247, .78); line-height: 1.55; font-size: 13px; }.qwen-command-result dl { margin: 10px 0; }.qwen-command-result dl div { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px solid rgba(120, 211, 214, .1); font-size: 12px; }.qwen-command-result dt { flex: 0 0 64px; color: rgba(234, 248, 247, .55); }.qwen-command-result dd { margin: 0; color: #b4fff2; word-break: break-word; }.qwen-command-result small, .qwen-result small { display: block; color: #f4bd72; font-size: 12px; line-height: 1.45; }.qwen-empty-state { margin: 14px 0 0; color: rgba(234, 248, 247, .64); font-size: 12px; line-height: 1.55; }.qwen-result-meta { display: flex; gap: 8px; align-items: center; }.qwen-result-meta b { color: #f4bd72; }.qwen-numbered-list { margin: 6px 0 0; padding-left: 24px; list-style: decimal; }.qwen-numbered-list li { padding-left: 3px; }.qwen-result h5 { margin: 14px 0 6px; color: #7de1d2; font-size: 13px; }.qwen-uncertainties { margin-top: 10px; color: #f4bd72; font-size: 12px; }.qwen-uncertainties summary { cursor: pointer; }.qwen-uncertainties ul { margin: 6px 0 0; padding-left: 18px; }.qwen-evidence { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(120, 211, 214, .18); color: #f4bd72; font-size: 12px; line-height: 1.5; }.qwen-review-actions { display: flex; gap: 8px; margin-top: 12px; }.qwen-review-actions button { flex: 1; border: 1px solid rgba(120, 211, 214, .3); border-radius: 4px; padding: 7px; background: rgba(24, 169, 153, .14); color: #a9fff1; cursor: pointer; }
.qwen-capabilities { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.qwen-capabilities button { display: flex; width: 100%; min-width: 0; height: 54px; align-items: center; justify-content: center; border: 1px solid rgba(120, 211, 214, .26); border-radius: 4px; background: rgba(24, 169, 153, .09); color: #a9fff1; padding: 6px 8px; font-size: 12px; line-height: 1.25; text-align: center; cursor: pointer; }
.qwen-capabilities button:hover, .qwen-capabilities button:focus-visible { border-color: #55d8c4; background: rgba(24, 169, 153, .2); outline: none; }
@media (max-width: 420px) { .qwen-capabilities { grid-template-columns: 1fr; } }
</style>
