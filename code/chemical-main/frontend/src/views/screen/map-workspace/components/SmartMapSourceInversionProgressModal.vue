<template>
  <Teleport to="body">
    <Transition name="inversion-progress-fade">
      <div v-if="state.visible" class="inversion-progress-backdrop">
        <section class="inversion-progress-modal" role="status" aria-live="polite">
          <header class="inversion-progress-head">
            <div>
              <span class="inversion-progress-kicker">Source Inversion</span>
              <h3>{{ state.title }}</h3>
            </div>
            <strong>{{ normalizedPercent }}%</strong>
          </header>

          <div class="inversion-progress-track">
            <div class="inversion-progress-fill" :style="{ width: `${normalizedPercent}%` }"></div>
          </div>

          <ol class="inversion-progress-steps">
            <li
              v-for="step in steps"
              :key="step.index"
              :class="{
                done: step.index < state.stepIndex,
                active: step.index === state.stepIndex,
              }"
            >
              <span>{{ step.index }}</span>
              <p>{{ step.label }}</p>
            </li>
          </ol>

          <div class="inversion-progress-detail">
            <span>当前步骤</span>
            <strong>{{ state.stepLabel }}</strong>
            <p>{{ state.detail }}</p>
          </div>

          <pre class="inversion-progress-code"><code>{{ state.code }}</code></pre>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SmartMapSourceInversionProgressState } from '../useSmartMapSourceInversionActions'

defineOptions({
  name: 'SmartMapSourceInversionProgressModal',
})

const props = defineProps<{
  state: SmartMapSourceInversionProgressState
}>()

const steps = [
  { index: 1, label: '读取监控点浓度时序' },
  { index: 2, label: '生成观测数据集' },
  { index: 3, label: '定位初始化' },
  { index: 4, label: '粒子滤波反向定位' },
  { index: 5, label: '绘制预测源点' },
]

const normalizedPercent = computed(() => Math.max(0, Math.min(100, Math.round(props.state.percent || 0))))
</script>

<style scoped>
.inversion-progress-backdrop {
  position: fixed;
  inset: 0;
  z-index: 180;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(4, 7, 14, 0.46);
  backdrop-filter: blur(4px);
}

.inversion-progress-modal {
  width: min(560px, calc(100vw - 32px));
  border: 1px solid rgba(128, 226, 255, 0.24);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(16, 26, 39, 0.96), rgba(9, 14, 24, 0.98)),
    #101a27;
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.46), 0 0 32px rgba(54, 211, 255, 0.10);
  color: #eef6ff;
  overflow: hidden;
}

.inversion-progress-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 14px;
}

.inversion-progress-kicker {
  display: block;
  margin-bottom: 5px;
  color: #77d8ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.inversion-progress-head h3 {
  margin: 0;
  font-size: 18px;
  line-height: 1.35;
}

.inversion-progress-head strong {
  flex: 0 0 auto;
  color: #9ef2c6;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 20px;
}

.inversion-progress-track {
  height: 7px;
  margin: 0 22px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.inversion-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #56d4ff, #88f7b1);
  box-shadow: 0 0 18px rgba(86, 212, 255, 0.45);
  transition: width 0.35s ease;
}

.inversion-progress-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin: 16px 22px 0;
  padding: 0;
  list-style: none;
}

.inversion-progress-steps li {
  min-width: 0;
  padding: 9px 8px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
  color: #8796a8;
  transition: background 0.42s ease, border-color 0.42s ease, color 0.42s ease, transform 0.42s ease;
}

.inversion-progress-steps li.done {
  border-color: rgba(136, 247, 177, 0.28);
  color: #9ef2c6;
}

.inversion-progress-steps li.active {
  border-color: rgba(86, 212, 255, 0.46);
  background: rgba(28, 61, 80, 0.56);
  color: #dcf7ff;
  transform: translateY(-1px);
}

.inversion-progress-steps span {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 10px;
  font-weight: 700;
}

.inversion-progress-steps p {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.inversion-progress-detail {
  margin: 16px 22px 0;
  padding: 13px 14px;
  border: 1px solid rgba(128, 226, 255, 0.18);
  border-radius: 8px;
  background: rgba(8, 13, 23, 0.62);
}

.inversion-progress-detail span {
  display: block;
  color: #7f90a4;
  font-size: 11px;
}

.inversion-progress-detail strong {
  display: block;
  margin-top: 4px;
  color: #eef6ff;
  font-size: 14px;
}

.inversion-progress-detail p {
  margin: 7px 0 0;
  color: #adbac9;
  font-size: 12px;
  line-height: 1.55;
}

.inversion-progress-code {
  max-height: 150px;
  margin: 14px 22px 22px;
  padding: 13px 14px;
  overflow: auto;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 8px;
  background: #060b12;
  color: #bce9ff;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
}

.inversion-progress-fade-enter-active,
.inversion-progress-fade-leave-active {
  transition: opacity 0.18s ease;
}

.inversion-progress-fade-enter-from,
.inversion-progress-fade-leave-to {
  opacity: 0;
}

@media (max-width: 680px) {
  .inversion-progress-steps {
    grid-template-columns: 1fr;
  }
}
</style>
