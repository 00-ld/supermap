<template>
  <section
    class="embedded-controls"
    aria-label="二维应急算法控制"
    :aria-busy="isDiffusionRunning || isTracingRunning"
  >
    <header class="control-header">
      <div>
        <strong>应急研判</strong>
        <span>设置事件位置，按需执行分析任务</span>
      </div>
      <b :class="{ ready: frameCount > 0 }" role="status">
        {{
          isDiffusionRunning
            ? '扩散计算中'
            : isTracingRunning
              ? '溯源计算中'
              : frameCount
                ? '结果就绪'
                : '等待计算'
        }}
      </b>
    </header>

    <div class="selection-fields">
      <label>
        <span>泄漏源</span>
        <select
          :value="sourceId"
          :disabled="isDiffusionRunning || isTracingRunning"
          @change="emitSourceChange"
        >
          <option
            v-for="source in EMERGENCY_SOURCE_ANCHORS"
            :key="source.id"
            :value="source.id"
          >
            {{ source.label }}
          </option>
        </select>
      </label>

      <label>
        <span>避险终点</span>
        <select
          :value="destinationId"
          :disabled="isDiffusionRunning || isTracingRunning"
          @change="emitDestinationChange"
        >
          <option value="">自动选择最低风险厂房出口</option>
          <option
            v-for="destination in evacuationDestinations"
            :key="destination.id"
            :value="destination.id"
          >
            {{ destination.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="section-label">分析任务</div>
    <div class="control-actions" aria-label="应急任务操作">
      <button
        class="action-button primary"
        type="button"
        :disabled="isDiffusionRunning || isTracingRunning"
        @click="$emit('run-diffusion')"
      >
        <span>{{ isDiffusionRunning ? '生成中…' : '扩散模拟' }}</span>
        <small>
          {{ isDiffusionRunning ? '正在计算三维浓度场' : '生成气象驱动浓度场' }}
        </small>
      </button>
      <button
        class="action-button"
        type="button"
        :disabled="frameCount === 0 || isDiffusionRunning || isTracingRunning"
        @click="$emit('toggle-playback')"
      >
        <span>{{ isPlaying ? '暂停播放' : '播放扩散' }}</span>
        <small>
          {{ frameCount ? `当前第 ${currentFrame + 1} 帧` : '等待扩散结果' }}
        </small>
      </button>
      <button
        class="action-button route"
        :class="{ active: hasEvacuationRoute }"
        type="button"
        :disabled="frameCount === 0 || isDiffusionRunning || isTracingRunning"
        @click="$emit('run-evacuation')"
      >
        <span>{{ hasEvacuationRoute ? '重新规划避险' : '三维避险路径' }}</span>
        <small>
          {{
            hasEvacuationRoute
              ? '二维/三维路线已同步'
              : 'SuperMap路网避开浓度场'
          }}
        </small>
      </button>
      <button
        class="action-button tracing"
        type="button"
        :disabled="frameCount === 0 || isDiffusionRunning || isTracingRunning"
        @click="$emit('run-leak-tracing')"
      >
        <span>{{ isTracingRunning ? '溯源计算中…' : '泄漏溯源' }}</span>
        <small>粗搜索 → EKI精修 → 粒子滤波</small>
      </button>
      <button
        class="action-button"
        type="button"
        :disabled="isDiffusionRunning || isTracingRunning"
        @click="$emit('add-sensor')"
      >
        <span>布设传感器</span>
        <small>添加模型绑定监控点</small>
      </button>
      <button
        class="action-button danger"
        type="button"
        :disabled="isDiffusionRunning || isTracingRunning"
        @click="$emit('clear-results')"
      >
        <span>清除结果</span>
        <small>重置扩散、路线与溯源</small>
      </button>
    </div>

    <div class="result-summary">
      <div>
        <span>扩散进度</span>
        <strong>
          {{ frameCount ? currentFrame + 1 : 0 }}/{{ frameCount }} 帧
        </strong>
      </div>
      <div>
        <span>避险路线</span>
        <strong :class="{ ready: hasEvacuationRoute }">
          {{ hasEvacuationRoute ? '二维、三维已同步' : '尚未生成' }}
        </strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { EMERGENCY_SOURCE_ANCHORS } from '@/data/emergencyMapAnchors'

withDefaults(
  defineProps<{
    sourceId: string
    currentFrame: number
    frameCount: number
    isPlaying: boolean
    isDiffusionRunning: boolean
    hasEvacuationRoute?: boolean
    destinationId?: string
    evacuationDestinations?: Array<{ id: string; label: string }>
    isTracingRunning?: boolean
  }>(),
  {
    hasEvacuationRoute: false,
    destinationId: '',
    evacuationDestinations: () => [],
    isTracingRunning: false,
  },
)

const emit = defineEmits<{
  'update:source-id': [sourceId: string]
  'update:destination-id': [destinationId: string]
  'run-diffusion': []
  'toggle-playback': []
  'run-evacuation': []
  'run-leak-tracing': []
  'add-sensor': []
  'clear-results': []
}>()

function emitSourceChange(event: Event) {
  const target = event.target
  if (target instanceof HTMLSelectElement)
    emit('update:source-id', target.value)
}

function emitDestinationChange(event: Event) {
  const target = event.target
  if (target instanceof HTMLSelectElement)
    emit('update:destination-id', target.value)
}
</script>

<style scoped>
.embedded-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 80;
  box-sizing: border-box;
  width: min(660px, calc(100% - 96px));
  max-height: calc(100dvh - 88px);
  padding: 0;
  overflow: hidden auto;
  background: #111a21;
  border: 1px solid #304351;
  border-radius: 6px;
  box-shadow: 0 12px 28px rgb(0 0 0 / 30%);
}

.control-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 13px 14px 12px;
  background: #17232c;
  border-bottom: 1px solid #2a3944;
}

.control-header div {
  display: grid;
  gap: 3px;
}

.control-header strong {
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: #f2f6f8;
}

.control-header span {
  font-size: 10px;
  line-height: 15px;
  color: #9caeba;
}

.control-header b {
  flex: 0 0 auto;
  padding: 3px 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  color: #b8c4cc;
  border: 1px solid #4a5963;
  border-radius: 3px;
}

.control-header b.ready {
  color: #84d6bc;
  border-color: #367765;
}

.selection-fields {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #263640;
}

label {
  display: grid;
  grid-template-columns: 52px minmax(160px, 1fr);
  gap: 8px;
  align-items: center;
}

label span {
  font-size: 11px;
  font-weight: 600;
  color: #a9bac5;
}

select,
button {
  min-height: 36px;
  color: #edf7fa;
  background: #0d171e;
  border: 1px solid #405664;
  border-radius: 4px;
}

button {
  padding: 0 9px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    background-color 140ms ease,
    color 140ms ease;
}

select {
  padding: 0 10px;
  font-size: 11px;
}

.section-label {
  padding: 11px 14px 7px;
  font-size: 10px;
  font-weight: 700;
  color: #8095a3;
  letter-spacing: 0.08em;
}

.control-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 0 14px 12px;
}

.action-button {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  justify-content: center;
  min-height: 52px;
  padding: 8px 10px 8px 12px;
  text-align: left;
  background: #17242c;
  border-color: #344955;
}

.action-button::before {
  position: absolute;
  top: 9px;
  bottom: 9px;
  left: 0;
  width: 2px;
  content: '';
  background: #526875;
}

.action-button span {
  font-size: 12px;
}

.action-button small {
  font-size: 9px;
  font-weight: 500;
  color: #8fa2ad;
}

.action-button.primary {
  background: #17303b;
  border-color: #38667a;
}

.action-button.primary::before {
  background: #46a6c5;
}

.action-button.route {
  border-color: #36584f;
}

.action-button.route.active {
  background: #193a31;
  border-color: #438a75;
}

.action-button.route.active small {
  color: #a5dccb;
}

.action-button.tracing {
  background: #292532;
  border-color: #5a4d65;
}

.action-button.danger:hover:not(:disabled) {
  background: #3d2525;
  border-color: #a45d58;
}

button:hover:not(:disabled) {
  background: #203641;
  border-color: #56849a;
}

select:focus-visible,
button:focus-visible {
  outline: 2px solid #68b7d6;
  outline-offset: 2px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

select:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.result-summary {
  display: grid;
  gap: 7px;
  padding: 10px 14px 12px;
  background: #0f181f;
  border-top: 1px solid #263640;
}

.result-summary div {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.result-summary span {
  font-size: 10px;
  color: #8599a5;
}

.result-summary strong {
  font-size: 10px;
  font-weight: 600;
  color: #ced8de;
  text-align: right;
}

.result-summary strong.ready {
  color: #7dceb5;
}

@media (width <= 760px) {
  .embedded-controls {
    width: calc(100% - 24px);
  }

  .control-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  select,
  button {
    transition: none;
  }
}
</style>
