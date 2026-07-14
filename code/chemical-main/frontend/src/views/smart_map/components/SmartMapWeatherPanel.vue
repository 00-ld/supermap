<template>
  <section>
    <div class="panel-title">
      <i class="fas fa-cloud-sun"></i>
      气象环境
      <span :class="source === 'real' ? 'tag tag-green' : 'tag tag-gray'" class="weather-source-tag">
        {{ source === 'real' ? '实时天气' : '模拟天气' }}
      </span>
    </div>
    <div class="weather-stat-grid">
      <div class="weather-stat-mini">
        <div class="weather-value">
          {{ state.windSpeed.toFixed(1) }}
          <span>m/s</span>
        </div>
        <div v-if="source === 'real' && state.windSpeedKmh" class="weather-label">
          风速（{{ state.windSpeedKmh.toFixed(1) }} km/h）
        </div>
        <div v-else class="weather-label">风速（模型值）</div>
      </div>
      <div class="weather-stat-mini">
        <div class="weather-value">{{ state.windDir }}°</div>
        <div class="weather-label">风向</div>
      </div>
      <div class="weather-stat-mini">
        <div class="weather-value">{{ state.temp.toFixed(1) }}°C</div>
        <div class="weather-label">温度</div>
      </div>
    </div>
    <div v-if="source === 'real' && state.obsTime" class="weather-observed-time">
      观测时间：{{ state.obsTime }}
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SmartMapWeatherSource, SmartMapWeatherState } from '../useSmartMapWeatherState'

defineOptions({
  name: 'SmartMapWeatherPanel',
})

defineProps<{
  source: SmartMapWeatherSource
  state: SmartMapWeatherState
}>()
</script>

<style scoped>
.panel-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--fg-muted);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-title i {
  color: var(--accent);
  font-size: 12px;
}
.weather-source-tag {
  font-size: 10px;
  margin-left: 6px;
}
.weather-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}
.weather-stat-mini {
  background: #1e293b;
  border-radius: 6px;
  text-align: center;
  padding: 10px 4px;
}
.weather-value {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent);
  font-family: 'Orbitron', sans-serif;
}
.weather-value span {
  font-size: 10px;
  opacity: 0.7;
}
.weather-label {
  font-size: 10px;
  color: var(--fg-muted);
  margin-top: 4px;
}
.weather-observed-time {
  margin-top: 6px;
  font-size: 11px;
  color: var(--fg-muted);
  text-align: center;
}
</style>
