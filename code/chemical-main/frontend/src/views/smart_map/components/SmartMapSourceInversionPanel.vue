<template>
  <div class="panel-section inversion-panel">
    <div class="panel-title"><i class="fas fa-crosshairs"></i> 泄漏溯源</div>
    <div class="workflow-strip">
      <div
        v-for="step in sourceWorkflowSteps"
        :key="step.key"
        class="workflow-step"
        :class="step.state"
      >
        <span class="step-index">{{ step.index }}</span>
        <span>{{ step.label }}</span>
      </div>
    </div>
    <div class="compact-metrics">
      <div>
        <span>观测点</span>
        <strong>{{ observationSummary.ready }}/{{ observationSummary.total }}</strong>
      </div>
      <div>
        <span>当前帧</span>
        <strong>{{ diffusionFrameCount ? currentFrame + 1 : 0 }}</strong>
      </div>
      <div>
        <span>定位方式</span>
        <strong>{{ deepParticleResult ? '深度学习+粒子滤波' : '待运行' }}</strong>
      </div>
    </div>
    <div class="inline-actions">
      <button class="sensor-btn primary" @click="$emit('prepare-observations')">
        <i class="fas fa-file-waveform"></i> 检查观测数据
      </button>
      <button class="sensor-btn primary" :disabled="sourceInversionState.particleRunning" @click="$emit('run-particle-filter')">
        <i :class="sourceInversionState.particleRunning ? 'fas fa-spinner fa-spin' : 'fas fa-bullseye'"></i>
        {{ sourceInversionState.particleRunning ? '正在定位' : '一键溯源定位' }}
      </button>
      <button class="sensor-btn primary subtle" :disabled="sourceInversionState.coarseRunning" @click="$emit('run-coarse-search')">
        <i :class="sourceInversionState.coarseRunning ? 'fas fa-spinner fa-spin' : 'fas fa-location-dot'"></i>
        {{ sourceInversionState.coarseRunning ? '正在生成' : '候选区预览' }}
      </button>
      <button class="sensor-btn primary" @click="$emit('toggle-playback')">
        <i :class="refinementState.playing ? 'fas fa-pause' : 'fas fa-play'"></i>
        {{ refinementState.playing ? '暂停轨迹' : '播放定位轨迹' }}
      </button>
      <button class="sensor-btn primary" @click="$emit('export-observations')">
        <i class="fas fa-download"></i> 导出观测JSON
      </button>
      <button class="sensor-btn danger" @click="$emit('clear-workflow')">
        <i class="fas fa-eraser"></i> 清空溯源
      </button>
    </div>
    <button class="soft-toggle" @click="$emit('toggle-expert')">
      <i :class="expertVisible ? 'fas fa-chevron-up' : 'fas fa-sliders'"></i>
      {{ expertVisible ? '收起专家算法参数' : '专家算法参数' }}
    </button>
    <div v-if="expertVisible" class="expert-block">
      <div class="expert-caption">定位初始化参数</div>
      <div class="control-grid">
        <label class="control-field">
          <span>观测取样</span>
          <select v-model="sourceInversionConfig.observationSignalMode">
            <option value="peak">全时段峰值</option>
            <option value="weighted_peak">峰值加权</option>
            <option value="current">当前帧</option>
          </select>
        </label>
        <label class="control-field">
          <span>候选数量 Top-K</span>
          <input v-model.number="sourceInversionConfig.topK" type="number" min="1" max="8" step="1">
        </label>
        <label class="control-field">
          <span>粗搜网格步长</span>
          <input v-model.number="sourceInversionConfig.gridStep" type="number" min="20" max="120" step="10">
        </label>
        <label class="control-field">
          <span>候选半径</span>
          <input v-model.number="sourceInversionConfig.candidateRadius" type="number" min="20" max="100" step="5">
        </label>
        <label class="control-field">
          <span>精搜范围</span>
          <input v-model.number="sourceInversionConfig.supportRadius" type="number" min="80" max="360" step="20">
        </label>
        <label class="control-field">
          <span>最小观测阈值</span>
          <input v-model.number="sourceInversionConfig.minObservationThreshold" type="number" min="0" max="20" step="0.05">
        </label>
      </div>
      <div class="expert-caption">粒子滤波参数</div>
      <div class="control-grid">
        <label class="control-field">
          <span>粒子数</span>
          <input v-model.number="particleFilterConfig.numParticles" type="number" min="1000" max="20000" step="500">
        </label>
        <label class="control-field">
          <span>迭代轮数</span>
          <input v-model.number="particleFilterConfig.iterations" type="number" min="8" max="60" step="2">
        </label>
        <label class="control-field">
          <span>观测噪声</span>
          <input v-model.number="particleFilterConfig.sensorNoiseRelative" type="number" min="0.02" max="0.5" step="0.01">
        </label>
        <label class="control-field">
          <span>最小信号</span>
          <input v-model.number="particleFilterConfig.minSignalThreshold" type="number" min="0" max="20" step="0.05">
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  SmartMapParticleFilterConfig,
  SmartMapSourceInversionConfig,
  SmartMapSourceInversionState,
} from '../useSmartMapAlgorithmStates'
import type { SmartMapRefinementPlaybackState } from '../useSmartMapRefinementPlayback'
import type { SmartMapWorkflowStep } from '../useSmartMapWorkflowSteps'

defineOptions({
  name: 'SmartMapSourceInversionPanel',
})

interface SmartMapInversionObservationMetrics {
  ready: number
  total: number
}

defineProps<{
  currentFrame: number
  deepParticleResult: boolean
  diffusionFrameCount: number
  expertVisible: boolean
  observationSummary: SmartMapInversionObservationMetrics
  particleFilterConfig: SmartMapParticleFilterConfig
  refinementState: SmartMapRefinementPlaybackState
  sourceInversionConfig: SmartMapSourceInversionConfig
  sourceInversionState: SmartMapSourceInversionState
  sourceWorkflowSteps: SmartMapWorkflowStep[]
}>()

defineEmits<{
  'clear-workflow': []
  'export-observations': []
  'prepare-observations': []
  'run-coarse-search': []
  'run-particle-filter': []
  'toggle-expert': []
  'toggle-playback': []
}>()
</script>
