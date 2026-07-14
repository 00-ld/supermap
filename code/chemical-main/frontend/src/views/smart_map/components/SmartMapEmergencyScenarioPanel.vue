<template>
  <div class="panel-section scenario-panel">
    <div class="panel-title"><i class="fas fa-smog"></i> 应急场景</div>
    <div class="workflow-strip compact">
      <div
        v-for="step in commandWorkflowSteps"
        :key="step.key"
        class="workflow-step"
        :class="step.state"
      >
        <span class="step-index">{{ step.index }}</span>
        <span>{{ step.label }}</span>
      </div>
    </div>
    <div class="control-grid">
      <label class="control-field">
        <span>气体类型</span>
        <select v-model="diffusionForm.gasId">
          <option v-for="gas in diffusionGasOptions" :key="gas.id" :value="gas.id">{{ gas.name }}</option>
        </select>
      </label>
      <label class="control-field">
        <span>泄漏源设施</span>
        <select v-model="diffusionForm.sourceFacilityId">
          <option v-for="facility in diffusionSourceOptions" :key="facility.id" :value="facility.id">{{ facility.name || facility.id }}</option>
        </select>
      </label>
      <label class="control-field">
        <span>泄漏速率</span>
        <input v-model.number="diffusionForm.sourceRate" type="number" min="5" max="120" step="1">
      </label>
      <label class="control-field">
        <span>稳定度</span>
        <select v-model="diffusionForm.stabilityClass">
          <option value="A">A 强对流</option>
          <option value="B">B 不稳定</option>
          <option value="C">C 弱不稳定</option>
          <option value="D">D 中性</option>
          <option value="E">E 稳定</option>
          <option value="F">F 强稳定</option>
        </select>
      </label>
      <label class="control-field">
        <span>风速(m/s)</span>
        <input v-model.number="diffusionForm.windSpeed" type="number" min="1" max="12" step="0.1">
      </label>
      <label class="control-field">
        <span>风向(°)</span>
        <input v-model.number="diffusionForm.windDirection" type="number" min="0" max="359" step="1">
      </label>
    </div>
    <div class="control-note" :class="{ invalid: !diffusionSourceValidation.valid }">
      {{ diffusionSourceHint }}
    </div>
    <div class="control-subnote">
      当前入口：{{ leakSourceEntryLabel }} | 当前坐标：{{ leakSourceLocationText }}
    </div>
    <div class="model-strip" :class="{ ready: diffusionFrameCount > 0 }">
      <div>
        <span>扩散内核</span>
        <strong>{{ diffusionModelLabel }}</strong>
      </div>
      <div>
        <span>条件向量</span>
        <strong>{{ diffusionConditionLabel }}</strong>
      </div>
    </div>
    <div class="validation-strip" :class="btexValidationStatusClass">
      <div>
        <span>真实数据校准</span>
        <strong>{{ btexValidationSummary.label }}</strong>
      </div>
      <div>
        <span>BTEX 样本/源强</span>
        <strong>{{ btexValidationSummary.sourceText }}</strong>
      </div>
      <div>
        <span>真实溯源结论</span>
        <strong>{{ btexValidationSummary.localizationText }}</strong>
      </div>
    </div>
    <div class="validation-strip" :class="prairieValidationStatusClass">
      <div>
        <span>Prairie Grass 溯源</span>
        <strong>{{ prairieValidationSummary.label }}</strong>
      </div>
      <div>
        <span>真实实验/边界</span>
        <strong>{{ prairieValidationSummary.sourceText }}</strong>
      </div>
      <div>
        <span>浓度形状验证</span>
        <strong>{{ prairieValidationSummary.concentrationText }}</strong>
      </div>
    </div>
    <button class="soft-toggle" @click="$emit('toggle-advanced')">
      <i :class="advancedVisible ? 'fas fa-chevron-up' : 'fas fa-sliders'"></i>
      {{ advancedVisible ? '收起高级场景参数' : '高级场景参数' }}
    </button>
    <div v-if="advancedVisible" class="expert-block">
      <div class="control-grid">
        <label class="control-field">
          <span>手动经度</span>
          <input v-model.trim="leakSourceState.manualLongitude" type="text" placeholder="118.780">
        </label>
        <label class="control-field">
          <span>手动纬度</span>
          <input v-model.trim="leakSourceState.manualLatitude" type="text" placeholder="32.040">
        </label>
        <label class="control-field">
          <span>持续时间(s)</span>
          <input v-model.number="diffusionForm.releaseDuration" type="number" min="20" max="300" step="10">
        </label>
        <label class="control-field">
          <span>泄漏高度(m)</span>
          <input v-model.number="diffusionForm.releaseHeight" type="number" min="0" max="30" step="0.5">
        </label>
        <label class="control-field">
          <span>初始温度(°C)</span>
          <input v-model.number="diffusionForm.initialTemperature" type="number" min="-20" max="180" step="1">
        </label>
        <label class="control-field">
          <span>初始压力(MPa)</span>
          <input v-model.number="diffusionForm.initialPressure" type="number" min="0.1" max="2.5" step="0.1">
        </label>
        <label class="control-field">
          <span>环境温度(°C)</span>
          <input v-model.number="diffusionForm.ambientTemperature" type="number" min="-30" max="60" step="1">
        </label>
        <label class="control-field">
          <span>相对湿度(%)</span>
          <input v-model.number="diffusionForm.humidity" type="number" min="0" max="100" step="1">
        </label>
        <label class="control-field">
          <span>地表粗糙度</span>
          <input v-model.number="diffusionForm.terrainRoughness" type="number" min="0.05" max="1.5" step="0.05">
        </label>
        <label class="control-field">
          <span>障碍物影响</span>
          <select v-model="diffusionForm.obstacleInfluenceEnabled">
            <option :value="true">开启</option>
            <option :value="false">关闭</option>
          </select>
        </label>
        <label class="control-field">
          <span>模拟帧数</span>
          <input v-model.number="diffusionForm.frameCount" type="number" min="12" max="240" step="12">
        </label>
        <label class="control-field">
          <span>时间步长(s)</span>
          <input v-model.number="diffusionForm.frameStepSec" type="number" min="1" max="30" step="1">
        </label>
      </div>
    </div>
    <div class="inline-actions">
      <button class="sensor-btn primary" @click="$emit('use-selected-facility')">
        <i class="fas fa-bullseye"></i> 当前设施设为源点
      </button>
      <button class="sensor-btn primary" :class="{ active: leakSourceState.picking }" @click="$emit('toggle-leak-source-picking')">
        <i :class="leakSourceState.picking ? 'fas fa-ban' : 'fas fa-location-crosshairs'"></i>
        {{ leakSourceState.picking ? '取消地图取点' : '地图点击选点' }}
      </button>
      <button class="sensor-btn primary" @click="$emit('apply-manual-geo')">
        <i class="fas fa-earth-asia"></i> 应用经纬度源点
      </button>
      <button class="sensor-btn primary" :disabled="diffusionRunning" @click="$emit('run-diffusion')">
        <i :class="diffusionRunning ? 'fas fa-spinner fa-spin' : 'fas fa-play'"></i>
        {{ diffusionRunning ? '正在模拟' : '扩散模拟' }}
      </button>
      <button class="sensor-btn primary" :disabled="diffusionRunning" @click="$emit('run-conditioned-demo')">
        <i class="fas fa-wand-magic-sparkles"></i> 演示新模型
      </button>
      <button class="sensor-btn danger" @click="$emit('reset-diffusion')">
        <i class="fas fa-rotate-left"></i> 清除动画
      </button>
      <button class="sensor-btn primary" @click="$emit('run-evacuation')">
        <i class="fas fa-route"></i> 当前建筑路径
      </button>
      <button class="sensor-btn primary" @click="$emit('run-batch-evacuation')">
        <i class="fas fa-people-arrows-left-right"></i> 全建筑路径
      </button>
      <button class="sensor-btn danger" @click="$emit('clear-evacuation')">
        <i class="fas fa-road-circle-xmark"></i> 清除路径
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SmartMapWorkflowStep } from '../useSmartMapWorkflowSteps'

defineOptions({
  name: 'SmartMapEmergencyScenarioPanel',
})

type ClassFlags = Record<string, boolean>

interface SmartMapOption {
  id: string
  name?: string
}

interface SmartMapDiffusionForm {
  gasId: string
  sourceFacilityId: string
  sourceRate: number
  stabilityClass: string
  windSpeed: number
  windDirection: number
  releaseDuration: number
  releaseHeight: number
  initialTemperature: number
  initialPressure: number
  ambientTemperature: number
  humidity: number
  terrainRoughness: number
  obstacleInfluenceEnabled: boolean
  frameCount: number
  frameStepSec: number
}

interface SmartMapLeakSourceState {
  manualLongitude: string
  manualLatitude: string
  picking: boolean
}

interface SmartMapDiffusionSourceValidation {
  valid: boolean
}

interface SmartMapBtexValidationSummary {
  label: string
  sourceText: string
  localizationText: string
}

interface SmartMapPrairieValidationSummary {
  label: string
  sourceText: string
  concentrationText: string
}

defineProps<{
  advancedVisible: boolean
  btexValidationStatusClass: ClassFlags
  btexValidationSummary: SmartMapBtexValidationSummary
  commandWorkflowSteps: SmartMapWorkflowStep[]
  diffusionConditionLabel: string
  diffusionForm: SmartMapDiffusionForm
  diffusionFrameCount: number
  diffusionGasOptions: SmartMapOption[]
  diffusionModelLabel: string
  diffusionRunning: boolean
  diffusionSourceHint: string
  diffusionSourceOptions: SmartMapOption[]
  diffusionSourceValidation: SmartMapDiffusionSourceValidation
  leakSourceEntryLabel: string
  leakSourceLocationText: string
  leakSourceState: SmartMapLeakSourceState
  prairieValidationStatusClass: ClassFlags
  prairieValidationSummary: SmartMapPrairieValidationSummary
}>()

defineEmits<{
  'apply-manual-geo': []
  'clear-evacuation': []
  'reset-diffusion': []
  'run-batch-evacuation': []
  'run-conditioned-demo': []
  'run-diffusion': []
  'run-evacuation': []
  'toggle-advanced': []
  'toggle-leak-source-picking': []
  'use-selected-facility': []
}>()
</script>
