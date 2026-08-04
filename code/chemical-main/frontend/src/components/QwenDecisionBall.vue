<template>
  <div v-if="userStore.token" class="qwen-assistant" :style="ballStyle">
    <button
      class="qwen-ball"
      type="button"
      aria-label="打开千问应急辅助决策"
      title="应急助手"
      @pointerdown="startDrag"
      @click="handleBallClick"
    >
      <img :src="assistantIcon" alt="应急助手" class="qwen-ball-icon" />
      <span v-if="latestAdvice?.reviewStatus === 'PENDING'" class="qwen-ball-dot"></span>
    </button>

    <section v-if="open" class="qwen-panel" @pointerdown.stop>
      <header class="qwen-panel-header">
        <div>
          <strong>千问应急辅助决策</strong>
          <small>仅生成方案，车辆动作需人工审核</small>
        </div>
        <button type="button" class="qwen-close" aria-label="关闭" @click="open = false">×</button>
      </header>

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

      <button type="button" class="qwen-submit" :disabled="loading || !scenario.trim()" @click="generate">
        {{ loading ? '正在分析…' : '生成快速应急方案' }}
      </button>

      <article v-if="latestAdvice" class="qwen-result">
        <div class="qwen-result-meta">
          <span>应急辅助方案</span>
          <b>{{ latestAdvice.riskLevel }}</b>
        </div>
        <h4>{{ latestAdvice.summary }}</h4>
        <h5>立即处置</h5>
        <ol class="qwen-numbered-list">
          <li v-for="(item, index) in latestAdvice.recommendations.slice(0, 4)" :key="`${index}-${item}`">{{ item }}</li>
        </ol>
        <h5>页面操作建议</h5>
        <ol class="qwen-numbered-list">
          <li v-for="(item, index) in latestAdvice.pageOperations.slice(0, 3)" :key="`${index}-${item}`">{{ item }}</li>
        </ol>
        <div v-if="latestAdvice.uncertainties?.length" class="qwen-uncertainties">
          <details>
            <summary>待确认信息（{{ latestAdvice.uncertainties.length }}）</summary>
            <ul>
              <li v-for="item in latestAdvice.uncertainties.slice(0, 3)" :key="item">{{ item }}</li>
            </ul>
          </details>
        </div>
        <div v-if="userStore.isAdmin && latestAdvice.reviewStatus === 'PENDING' && latestAdvice.id" class="qwen-review-actions">
          <button type="button" @click="review('APPROVED')">采用建议</button>
          <button type="button" @click="review('REJECTED')">拒绝建议</button>
        </div>
        <small v-if="latestAdvice.fallbackReason">{{ latestAdvice.fallbackReason }}</small>
        <div class="qwen-evidence">
          <strong>依据标准</strong>
          <ol class="qwen-numbered-list">
            <li v-for="(item, index) in latestAdvice.evidenceStandards?.slice(0, 3)" :key="`${index}-${item}`">{{ item }}</li>
          </ol>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import useUserStore from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import assistantIcon from '@/assets/icons/emergency-assistant.svg'
import {
  reqApproveAiAdvice,
  reqGenerateAiAdvice,
  reqQuickAiAdvice,
  reqRejectAiAdvice,
  type AiAdviceRecord,
} from '@/api/aiDecision'
import { reqWarningHistoryList, type WarningHistoryRecord } from '@/api/warningHistory'

const userStore = useUserStore()
const open = ref(false)
const loading = ref(false)
const alerts = ref<WarningHistoryRecord[]>([])
const selectedAlertId = ref('')
const scenario = ref('')
const latestAdvice = ref<AiAdviceRecord | null>(null)
const storedPosition = (() => {
  try {
    const value = JSON.parse(localStorage.getItem('qwen-decision-ball-position') || 'null') as { x?: number; y?: number } | null
    return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? { x: value.x!, y: value.y! } : null
  } catch {
    return null
  }
})()
const position = ref(storedPosition || { x: Math.max(16, window.innerWidth - 82), y: Math.max(100, window.innerHeight * 0.62) })
const dragging = ref(false)
const moved = ref(false)
let dragOffset = { x: 0, y: 0 }

const ballStyle = computed(() => ({ left: `${position.value.x}px`, top: `${position.value.y}px` }))

const startDrag = (event: PointerEvent) => {
  event.preventDefault()
  dragging.value = true
  moved.value = false
  dragOffset = { x: event.clientX - position.value.x, y: event.clientY - position.value.y }
  window.addEventListener('pointermove', moveBall)
  window.addEventListener('pointerup', stopDrag, { once: true })
}

const moveBall = (event: PointerEvent) => {
  if (!dragging.value) return
  const nextX = Math.min(Math.max(8, event.clientX - dragOffset.x), window.innerWidth - 66)
  const nextY = Math.min(Math.max(70, event.clientY - dragOffset.y), window.innerHeight - 66)
  moved.value = Math.abs(nextX - position.value.x) > 4 || Math.abs(nextY - position.value.y) > 4
  position.value = { x: nextX, y: nextY }
}

const stopDrag = () => {
  if (!dragging.value) return
  dragging.value = false
  window.removeEventListener('pointermove', moveBall)
  const edgeX = position.value.x + 33 < window.innerWidth / 2 ? 8 : window.innerWidth - 66
  position.value = { x: edgeX, y: position.value.y }
  localStorage.setItem('qwen-decision-ball-position', JSON.stringify(position.value))
}

const clampPosition = () => {
  position.value = {
    x: Math.min(Math.max(8, position.value.x), Math.max(8, window.innerWidth - 66)),
    y: Math.min(Math.max(70, position.value.y), Math.max(70, window.innerHeight - 66)),
  }
}

const handleBallClick = async () => {
  if (moved.value) return
  open.value = !open.value
  if (open.value) {
    try {
      const response = await reqWarningHistoryList()
      alerts.value = response.data || []
    } catch {
      alerts.value = []
    }
  }
}

const generate = async () => {
  loading.value = true
  try {
    const response = selectedAlertId.value
      ? await reqGenerateAiAdvice(Number(selectedAlertId.value), scenario.value.trim())
      : await reqQuickAiAdvice({ scenario: scenario.value.trim() })
    latestAdvice.value = response.data
    ElMessage.success('应急辅助方案已生成，请人工审核')
  } catch (error) {
    ElMessage.error(`生成方案失败：${(error as Error).message}`)
  } finally {
    loading.value = false
  }
}

const review = async (status: 'APPROVED' | 'REJECTED') => {
  if (!latestAdvice.value?.id) return
  try {
    latestAdvice.value = status === 'APPROVED'
      ? (await reqApproveAiAdvice(latestAdvice.value.id)).data
      : (await reqRejectAiAdvice(latestAdvice.value.id)).data
  } catch (error) {
    ElMessage.error(`审核失败：${(error as Error).message}`)
  }
}

const formatTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-'

window.addEventListener('resize', clampPosition)
onBeforeUnmount(() => {
  window.removeEventListener('pointermove', moveBall)
  window.removeEventListener('resize', clampPosition)
})
</script>

<style scoped>
.qwen-assistant { position: fixed; z-index: 3000; width: 58px; height: 58px; touch-action: none; }
.qwen-ball { width: 58px; height: 58px; padding: 0; border: 0; background: transparent; color: #effffd; filter: drop-shadow(0 8px 12px rgba(0, 0, 0, .34)); cursor: grab; }
.qwen-ball:active { cursor: grabbing; }
.qwen-ball-icon { display: block; width: 58px; height: 58px; object-fit: contain; }
.qwen-ball-dot { position: absolute; top: 1px; right: 2px; width: 11px; height: 11px; border-radius: 50%; background: #f56c6c; border: 2px solid #081a2a; }
.qwen-panel { position: absolute; right: 0; bottom: 72px; width: min(380px, calc(100vw - 24px)); max-height: min(660px, calc(100vh - 96px)); overflow: auto; padding: 16px; border: 1px solid rgba(120, 211, 214, .32); border-radius: 8px; background: rgba(7, 24, 38, .98); color: #eaf8f7; box-shadow: 0 20px 52px rgba(0, 0, 0, .42); }
.qwen-panel-header { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.qwen-panel-header strong, .qwen-panel-header small { display: block; }
.qwen-panel-header small { margin-top: 5px; color: rgba(234, 248, 247, .62); font-size: 12px; }
.qwen-close { border: 0; background: transparent; color: #9adbd7; font-size: 22px; cursor: pointer; }
.qwen-field-label { display: block; margin: 12px 0 6px; color: rgba(234, 248, 247, .72); font-size: 12px; }
.qwen-select, .qwen-textarea { width: 100%; border: 1px solid rgba(120, 211, 214, .24); border-radius: 4px; background: rgba(0, 9, 18, .48); color: #effffd; padding: 9px 10px; font: inherit; }
.qwen-textarea { min-height: 88px; resize: vertical; }
.qwen-submit { width: 100%; margin-top: 12px; border: 0; border-radius: 4px; padding: 10px; background: #18a999; color: #071c24; font-weight: 700; cursor: pointer; }
.qwen-submit:disabled { opacity: .52; cursor: not-allowed; }
.qwen-result { margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(120, 211, 214, .18); }
.qwen-result-meta { display: flex; gap: 8px; align-items: center; color: #7de1d2; font-size: 12px; }
.qwen-result-meta b { color: #f4bd72; }
.qwen-result-meta em { color: rgba(234, 248, 247, .68); font-style: normal; }
.qwen-result h4 { margin: 9px 0; line-height: 1.5; }
.qwen-result p, .qwen-result li { color: rgba(234, 248, 247, .78); line-height: 1.55; font-size: 13px; }
.qwen-numbered-list { margin: 6px 0 0; padding-left: 24px; list-style: decimal; }
.qwen-numbered-list li { padding-left: 3px; }
.qwen-result h5 { margin: 14px 0 6px; color: #7de1d2; font-size: 13px; }
.qwen-uncertainties { margin-top: 10px; color: #f4bd72; font-size: 12px; }
.qwen-uncertainties summary { cursor: pointer; }
.qwen-uncertainties ul { margin: 6px 0 0; padding-left: 18px; }
.qwen-evidence { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(120, 211, 214, .18); color: #f4bd72; font-size: 12px; line-height: 1.5; }
.qwen-evidence p { margin: 5px 0 0; color: rgba(234, 248, 247, .72); font-size: 12px; }
.qwen-review-actions { display: flex; gap: 8px; margin-top: 12px; }
.qwen-review-actions button { flex: 1; border: 1px solid rgba(120, 211, 214, .3); border-radius: 4px; padding: 7px; background: rgba(24, 169, 153, .14); color: #a9fff1; cursor: pointer; }
.qwen-result small { display: block; margin-top: 10px; color: #f4bd72; line-height: 1.4; }
</style>
