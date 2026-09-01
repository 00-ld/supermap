<template>
  <div class="emergency-ai-assistant" :class="{ open: isOpen }">
    <button
      v-if="!isOpen"
      type="button"
      class="assistant-launcher"
      aria-label="打开AI应急助手"
      @click="isOpen = true"
    >
      <el-icon><ChatDotRound /></el-icon>
      <span>AI应急</span>
    </button>

    <section v-else class="assistant-panel" aria-label="AI事故应急助手">
      <header class="assistant-header">
        <div class="assistant-title">
          <span class="assistant-icon">
            <el-icon><ChatDotRound /></el-icon>
          </span>
          <div>
            <strong>事故应急助手</strong>
            <small>知识库检索 · 千问增强</small>
          </div>
        </div>
        <button
          type="button"
          class="close-button"
          aria-label="关闭AI应急助手"
          @click="isOpen = false"
        >
          <el-icon><Close /></el-icon>
        </button>
      </header>

      <div class="assistant-disclaimer">
        <el-icon><WarningFilled /></el-icon>
        <span>辅助建议不替代现场指挥、SDS、园区预案或专业救援。</span>
      </div>

      <div class="scenario-presets" aria-label="事故场景示例">
        <button
          v-for="preset in scenarioPresets"
          :key="preset.label"
          type="button"
          @click="scenario = preset.value"
        >
          {{ preset.label }}
        </button>
      </div>

      <label class="scenario-input">
        <span>现场情况</span>
        <textarea
          v-model="scenario"
          maxlength="1000"
          placeholder="描述物质、区域、人员症状、风向和监测浓度"
        ></textarea>
      </label>

      <button
        type="button"
        class="generate-button"
        :disabled="isLoading || !scenario.trim()"
        @click="generateAdvice"
      >
        {{ isLoading ? '正在研判…' : '生成应急方案' }}
      </button>

      <div v-if="advice" class="advice-result" aria-live="polite">
        <div class="result-meta">
          <span :class="['source-badge', advice.source.toLowerCase()]">
            {{ sourceLabel }}
          </span>
          <span class="risk-badge">高风险</span>
        </div>
        <strong class="result-summary">{{ advice.summary }}</strong>
        <p class="risk-explanation">{{ advice.riskExplanation }}</p>

        <div class="recommendation-block">
          <span>建议处置</span>
          <ol>
            <li v-for="item in advice.recommendations" :key="item">
              {{ item }}
            </li>
          </ol>
        </div>

        <div v-if="advice.evidenceDocuments.length" class="evidence-block">
          <span>知识依据</span>
          <p v-for="document in advice.evidenceDocuments" :key="document">
            {{ document }}
          </p>
        </div>

        <p v-if="advice.fallbackReason" class="fallback-note">
          {{ advice.fallbackReason }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChatDotRound, Close, WarningFilled } from '@element-plus/icons-vue'
import { requestEmergencyAdvice } from '@/api/emergencyAdvice'
import {
  createEmergencyDemoAdvice,
  type EmergencyAdvice,
} from './emergencyAssistantFallback'

const scenarioPresets = [
  {
    label: '液氨泄漏',
    value:
      '东侧液氨储罐区疑似泄漏，两名人员头晕，现场东南风3.6m/s，固定监测点浓度持续升高。',
  },
  {
    label: '氯气报警',
    value:
      '氯气管线附近连续报警，西侧道路有巡检人员，当前西北风，需要给出处置和疏散建议。',
  },
  {
    label: '硫化氢',
    value: '污水处理区检测到硫化氢，低洼区域浓度上升，一名作业人员失联。',
  },
]

const isOpen = ref(false)
const isLoading = ref(false)
const scenario = ref(scenarioPresets[0].value)
const advice = ref<EmergencyAdvice | null>(null)

const sourceLabel = computed(() => {
  if (advice.value?.source === 'QWEN') return '千问增强'
  if (advice.value?.source === 'LOCAL_KNOWLEDGE_BASE') return '本地知识库'
  return '安全演示'
})

async function generateAdvice() {
  const incident = scenario.value.trim()
  if (!incident || isLoading.value) return
  isLoading.value = true
  advice.value = null
  try {
    const response = await requestEmergencyAdvice(incident)
    advice.value = response.data
  } catch {
    advice.value = createEmergencyDemoAdvice(incident)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.emergency-ai-assistant {
  position: absolute;
  right: 24px;
  bottom: 26px;
  z-index: 40;
  font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
}

.assistant-launcher {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 112px;
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(78, 209, 190, 0.7);
  border-radius: 22px;
  color: #eafffb;
  background: linear-gradient(
    135deg,
    rgba(18, 91, 83, 0.96),
    rgba(12, 44, 54, 0.96)
  );
  box-shadow:
    0 14px 34px rgba(0, 0, 0, 0.38),
    0 0 22px rgba(74, 216, 194, 0.16);
  cursor: pointer;
}

.assistant-launcher .el-icon {
  font-size: 19px;
}
.assistant-launcher span {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.assistant-panel {
  width: min(390px, calc(100vw - 34px));
  max-height: min(720px, calc(100vh - 42px));
  box-sizing: border-box;
  overflow-y: auto;
  border: 1px solid rgba(99, 171, 177, 0.42);
  border-radius: 14px;
  color: #dcebf2;
  background: rgba(8, 23, 31, 0.96);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.52);
  backdrop-filter: blur(16px);
}

.assistant-header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px 12px;
  border-bottom: 1px solid rgba(122, 175, 188, 0.18);
  background: rgba(8, 23, 31, 0.97);
}

.assistant-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.assistant-title > div {
  display: grid;
  gap: 2px;
}
.assistant-title strong {
  color: #f1fbff;
  font-size: 15px;
}
.assistant-title small {
  color: #80aaa9;
  font-size: 10px;
}
.assistant-icon {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 9px;
  color: #65dcc8;
  background: rgba(62, 183, 164, 0.13);
}
.assistant-icon .el-icon {
  font-size: 19px;
}

.close-button {
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 8px;
  color: #96afb9;
  background: transparent;
  cursor: pointer;
}
.close-button:hover {
  color: #eaf8fb;
  background: rgba(255, 255, 255, 0.07);
}

.assistant-disclaimer {
  display: flex;
  gap: 8px;
  margin: 12px 14px 0;
  padding: 9px 10px;
  border-left: 3px solid #d8a53d;
  color: #c9b985;
  background: rgba(187, 139, 42, 0.09);
  font-size: 11px;
  line-height: 1.5;
}
.assistant-disclaimer .el-icon {
  flex: none;
  margin-top: 2px;
}

.scenario-presets {
  display: flex;
  gap: 7px;
  padding: 12px 14px 0;
}
.scenario-presets button {
  padding: 6px 9px;
  border: 1px solid rgba(103, 166, 172, 0.28);
  border-radius: 5px;
  color: #9fc8ca;
  background: rgba(44, 91, 98, 0.18);
  font-size: 10px;
  cursor: pointer;
}
.scenario-presets button:hover {
  border-color: rgba(90, 204, 188, 0.55);
  color: #d9fffa;
}

.scenario-input {
  display: grid;
  gap: 6px;
  padding: 12px 14px 0;
}
.scenario-input > span,
.recommendation-block > span,
.evidence-block > span {
  color: #83aaa9;
  font-size: 10px;
  letter-spacing: 0.08em;
}
.scenario-input textarea {
  min-height: 72px;
  box-sizing: border-box;
  resize: vertical;
  padding: 10px 11px;
  border: 1px solid rgba(99, 151, 163, 0.35);
  border-radius: 7px;
  outline: none;
  color: #dcebf2;
  background: rgba(16, 39, 49, 0.86);
  font: inherit;
  font-size: 11px;
  line-height: 1.55;
}
.scenario-input textarea:focus {
  border-color: #55b7aa;
  box-shadow: 0 0 0 2px rgba(85, 183, 170, 0.12);
}

.generate-button {
  width: calc(100% - 28px);
  height: 38px;
  margin: 10px 14px 0;
  border: 1px solid #4db6a5;
  border-radius: 7px;
  color: #f2fffc;
  background: linear-gradient(135deg, #267e71, #1e5e68);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.generate-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.advice-result {
  display: grid;
  gap: 9px;
  margin: 12px 14px 15px;
  padding: 12px;
  border: 1px solid rgba(91, 171, 162, 0.3);
  border-radius: 9px;
  background: rgba(15, 42, 50, 0.72);
}
.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.source-badge,
.risk-badge {
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
}
.source-badge {
  color: #8ee4d5;
  background: rgba(61, 177, 160, 0.14);
}
.source-badge.qwen {
  color: #a9d6ff;
  background: rgba(70, 139, 202, 0.17);
}
.risk-badge {
  color: #ffb4a1;
  background: rgba(218, 80, 55, 0.14);
}
.result-summary {
  color: #f0f8fa;
  font-size: 12px;
  line-height: 1.6;
}
.risk-explanation {
  margin: 0;
  color: #a9bec7;
  font-size: 10px;
  line-height: 1.55;
}
.recommendation-block {
  display: grid;
  gap: 5px;
}
.recommendation-block ol {
  display: grid;
  gap: 5px;
  margin: 0;
  padding-left: 18px;
}
.recommendation-block li {
  padding-left: 2px;
  color: #d2e3e7;
  font-size: 10px;
  line-height: 1.55;
}
.evidence-block {
  display: grid;
  gap: 4px;
  padding-top: 7px;
  border-top: 1px solid rgba(118, 161, 170, 0.16);
}
.evidence-block p {
  margin: 0;
  color: #94b9ba;
  font-size: 9px;
}
.fallback-note {
  margin: 0;
  padding-top: 7px;
  border-top: 1px solid rgba(118, 161, 170, 0.16);
  color: #c2ad77;
  font-size: 9px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .emergency-ai-assistant {
    right: 12px;
    bottom: 14px;
  }
  .assistant-panel {
    max-height: calc(100vh - 28px);
  }
}
</style>
