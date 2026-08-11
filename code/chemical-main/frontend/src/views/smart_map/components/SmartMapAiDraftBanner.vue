<template>
  <section v-if="draft" class="ai-draft-banner" aria-live="polite">
    <div>
      <span class="ai-draft-eyebrow">AI 智能副驾驶已准备任务</span>
      <strong>{{ draft.title }}</strong>
      <p>{{ draft.summary }}</p>
      <div v-if="parameterEntries.length" class="ai-draft-parameters">
        <span v-for="[key, value] in parameterEntries" :key="key">{{ parameterLabel(key) }}: {{ value }}</span>
      </div>
      <small v-if="draft.requiresConfirmation">当前仅完成页面导航与参数准备，启动算法或发布方案前仍需人工确认。</small>
    </div>
    <button type="button" title="关闭已准备任务" @click="clearDraft">×</button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAiTaskDraft, removeAiTaskDraft } from '@/ai/aiTaskDraftStore'

const route = useRoute()
const router = useRouter()
const draftId = computed(() => typeof route.query.aiDraft === 'string' ? route.query.aiDraft : null)
const draft = computed(() => getAiTaskDraft(draftId.value))
const parameterEntries = computed(() => Object.entries(draft.value?.parameters || {}))
const parameterLabel = (key: string) => ({ gas: '气体', zone: '区域', facility: '设施' }[key] || key)

const clearDraft = () => {
  if (draftId.value) removeAiTaskDraft(draftId.value)
  router.replace({ query: { ...route.query, aiDraft: undefined } })
}
</script>

<style scoped>
.ai-draft-banner { position: absolute; z-index: 30; top: 14px; left: 50%; display: flex; width: min(620px, calc(100% - 40px)); transform: translateX(-50%); gap: 14px; align-items: flex-start; padding: 12px 14px; border: 1px solid rgba(74, 222, 181, .55); border-radius: 6px; background: rgba(5, 26, 37, .96); color: #eaf8f7; box-shadow: 0 10px 30px rgba(0, 0, 0, .26); }
.ai-draft-banner > div { min-width: 0; flex: 1; }
.ai-draft-eyebrow, .ai-draft-banner strong, .ai-draft-banner small { display: block; }
.ai-draft-eyebrow { color: #68ddc8; font-size: 12px; }
.ai-draft-banner strong { margin-top: 3px; font-size: 15px; }
.ai-draft-banner p { margin: 5px 0; color: rgba(234, 248, 247, .78); font-size: 13px; line-height: 1.45; }
.ai-draft-banner small { color: #f5c675; font-size: 12px; line-height: 1.4; }
.ai-draft-parameters { display: flex; flex-wrap: wrap; gap: 6px; margin: 7px 0; }
.ai-draft-parameters span { padding: 3px 7px; border: 1px solid rgba(104, 221, 200, .28); border-radius: 3px; color: #9df5e5; font-size: 12px; }
.ai-draft-banner button { width: 26px; height: 26px; padding: 0; border: 0; background: transparent; color: #9df5e5; font-size: 22px; cursor: pointer; }
</style>
