<template>
  <div v-if="frameCount" class="timeline-panel">
    <div class="timeline-head">
      <div>
        <div class="timeline-title">扩散时间轴</div>
        <div class="timeline-meta">{{ summary.sourceName }} / {{ summary.gasName }}</div>
      </div>
      <div class="timeline-meta">第 {{ summary.frameText }} 帧</div>
    </div>
    <input
      class="timeline-slider"
      type="range"
      min="0"
      :max="Math.max(frameCount - 1, 0)"
      :value="currentFrame"
      @input="emitSeek"
    >
    <div class="timeline-controls-row">
      <div class="timeline-actions">
        <button class="timeline-btn" @click="emit('step', -1)" title="上一帧"><i class="fas fa-backward-step"></i></button>
        <button class="timeline-btn primary" @click="emit('toggle')" :title="playing ? '暂停' : '播放'">
          <i :class="playing ? 'fas fa-pause' : 'fas fa-play'"></i>
        </button>
        <button class="timeline-btn" @click="emit('step', 1)" title="下一帧"><i class="fas fa-forward-step"></i></button>
      </div>
      <div class="timeline-readout">
        <span>{{ summary.timeText }}</span>
        <span>峰值 {{ summary.maxConcentration }}</span>
        <span>影响 {{ summary.affectedArea }}</span>
        <span>{{ modelLabel }}</span>
      </div>
      <div class="timeline-settings">
        <select :value="speed" @change="emitSpeed">
          <option v-for="option in speedOptions" :key="option" :value="option">{{ option }}x</option>
        </select>
        <label class="timeline-loop">
          <input :checked="loop" type="checkbox" @change="emitLoop">
          循环
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface SmartMapDiffusionTimelineSummary {
  sourceName: string
  gasName: string
  frameText: string
  timeText: string
  maxConcentration: string
  affectedArea: string
}

defineOptions({
  name: 'SmartMapDiffusionTimeline',
})

defineProps<{
  frameCount: number
  currentFrame: number
  playing: boolean
  speed: number
  loop: boolean
  speedOptions: number[]
  summary: SmartMapDiffusionTimelineSummary
  modelLabel: string
}>()

const emit = defineEmits<{
  (event: 'seek', frameIndex: number): void
  (event: 'step', direction: number): void
  (event: 'toggle'): void
  (event: 'update-speed', speed: number): void
  (event: 'update-loop', loop: boolean): void
}>()

function emitSeek(event: Event) {
  emit('seek', Number((event.target as HTMLInputElement).value))
}

function emitSpeed(event: Event) {
  emit('update-speed', Number((event.target as HTMLSelectElement).value))
}

function emitLoop(event: Event) {
  emit('update-loop', (event.target as HTMLInputElement).checked)
}
</script>

<style scoped>
.timeline-panel {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  width: min(760px, calc(100% - 180px));
  background: rgba(17,24,39,0.94);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 16px;
  z-index: 35;
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 28px rgba(0,0,0,0.25);
}
.timeline-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.timeline-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--fg);
}
.timeline-meta {
  font-size: 11px;
  color: var(--fg-muted);
  margin-top: 3px;
}
.timeline-controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.timeline-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.timeline-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #1e293b;
  color: var(--fg);
  cursor: pointer;
  transition: all 0.2s;
}
.timeline-btn:hover,
.timeline-btn.primary {
  border-color: rgba(154,168,184,0.36);
  color: #eef3f8;
  background: #1b2533;
}
.timeline-readout {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--fg-muted);
  font-size: 11px;
  flex-wrap: wrap;
}
.timeline-settings {
  display: flex;
  align-items: center;
  gap: 10px;
}
.timeline-settings select {
  width: 100%;
  height: 34px;
  background: #1e293b;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg);
  padding: 0 10px;
  outline: none;
}
.timeline-settings select:focus {
  border-color: var(--accent);
}
.timeline-loop {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--fg-muted);
  font-size: 11px;
}
</style>
