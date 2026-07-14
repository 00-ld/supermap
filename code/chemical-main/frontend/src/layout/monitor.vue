<template>
  <div class="monitor-page">
    <div class="bg-grid"></div>

    <!-- 顶部 -->
    <div class="header">
      <el-button type="primary" @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>

      <div class="title">
        <span class="top">化工园区重点监测区域 - {{ monitorTitle }}</span>
      </div>

      <div class="info">
        <span class="tag-live">{{ monitorPointSourceLabel }}</span>
        <span :class="hasAlarm ? 'tag-danger' : 'tag-safe'">
          {{ hasAlarm ? '全局采样存在异常' : '无专属报警' }}
        </span>
        <span :class="monitorPointExists ? 'tag-online' : 'tag-offline'">
          {{ monitorPointExists ? '实体已闭链' : monitorPointMissingLabel }}
        </span>
      </div>
    </div>

    <!-- 中间主体 -->
    <div class="main-body">

      <!-- 左侧面板 -->
      <div class="left-panel">
        <div class="card">
          <div class="card-title">气体最新记录（全局采样）</div>
          <div class="card-data source-note">读数来源：{{ gasReadingSourceText }}</div>
          <div class="card-data source-note">绑定状态：{{ monitorBindingText }}</div>
          <div class="card-data source-note">区域：{{ selectedMonitorPoint?.areaName || '未配置' }}</div>
          <div class="card-data">
            CH₄ 甲烷：
            <span :class="isGasAlarm('methane') ? 'text-red' : 'text-green'">
              {{ gasData.methane }}
            </span>
          </div>
          <div class="card-data">
            NH₃ 氨气：
            <span :class="isGasAlarm('nh3') ? 'text-red' : 'text-green'">
              {{ gasData.nh3 }}
            </span>
          </div>
          <div class="card-data">
            CO 一氧化碳：
            <span :class="isGasAlarm('co') ? 'text-red' : 'text-green'">
              {{ gasData.co }}
            </span>
          </div>
          <div class="card-data">
            O₂ 氧气：
            <span :class="isOxygenAlarm ? 'text-red' : 'text-green'">
              {{ gasData.oxygen }}
            </span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">环境概览（全局）</div>
          <template v-if="envData.available">
            <div class="card-data">风场：{{ envData.windDirectionText || '未知风向' }} {{ formatReading(envData.windSpeed, 'm/s') }}</div>
            <div class="card-data">温度：{{ formatReading(envData.temperature, '℃') }}</div>
            <div class="card-data">湿度：{{ formatReading(envData.humidity, '%') }}</div>
            <div class="card-data">气压：{{ formatReading(envData.pressure, 'kPa') }}</div>
            <div class="card-data">噪声：{{ formatReading(envData.noise, 'dB') }}</div>
            <div class="card-data">来源：{{ envData.source }}</div>
          </template>
          <template v-else>
            <div class="card-data status-none">未接入外部环境观测数据</div>
            <div class="card-data">请通过环境采样接口写入气象 API 或人工观测数据</div>
          </template>
          <div class="card-data source-note">绑定边界：monitoring/overview 全局概览，非当前监测点专属读数</div>
          <div class="card-data">传感器：{{ envData.onlineSensorCount }}/{{ envData.sensorCount }} 在线</div>
          <div class="card-data">平均风险：{{ formatReading(envData.averageRisk, '') }}</div>
        </div>

        <!-- 动态环形图 -->
        <div class="card chart-card">
          <div class="card-title">报警状态指数</div>
          <div class="chart_round_text">状态指数</div>
          <div class="pie-chart">
            <div class="pie" :style="{ background: `conic-gradient(#00d1ff ${safeValue}%, transparent ${safeValue}%)` }"></div>
            <div :class="safeValue < 80 ? 'pie-text text-red' : 'pie-text'">
              <div>{{ safeValue }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间视频 -->
      <div class="video-container">
        <div class="tech-border">
          <div class="corner lt"></div>
          <div class="corner rt"></div>
          <div class="corner lb"></div>
          <div class="corner rb"></div>

          <video
            v-if="camera.sourceBound"
            class="video-player"
            :src="camera.url"
            muted
            loop
            autoplay
            playsinline
            controls
            preload="metadata"
          ></video>
          <img
            v-else
            class="video-player"
            :src="camera.url"
            alt="监测视频占位"
          />

          <div class="status">{{ camera.sourceBound ? 'VIDEO' : '未绑定视频源' }}</div>
          <div class="video-overlay">
            <div class="label">监测ID：{{ monitorCode }}</div>
            <div class="label">定位：{{ camera.name }}</div>
            <div class="label">实体来源：{{ monitorPointSourceLabel }}</div>
            <div class="label">视频源：{{ camera.sourceBound ? '已绑定' : '未绑定' }}</div>
            <div class="label">传感器：{{ selectedMonitorPoint?.sensorId || '未绑定' }}</div>
            <div class="label">质量状态：{{ selectedMonitorPoint?.qualityStatus || 'UNBOUND' }}</div>
            <div v-if="!monitorPointExists" class="label status-alarm">后端 monitor_point 表未找到该 ID</div>
            <div class="label">
              当前状态：
              <span :class="hasAlarm ? 'status-alarm' : 'status-ok'">
                {{ hasAlarm ? '全局采样异常' : '无专属报警' }}
              </span>
            </div>
            <div class="label">更新时间：{{ nowTime }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <div class="card">
          <div class="card-title">设备状态</div>
          <div class="card-data">
            摄像头：
            <span :class="camera.sourceBound ? 'status-ok' : 'status-none'">
              {{ camera.sourceBound ? '正常在线' : '未绑定视频源' }}
            </span>
          </div>
          <div class="card-data">
            气体传感器：
            <span :class="hasGasAlarm ? 'status-alarm' : 'status-none'">
              {{ hasGasAlarm ? '全局采样异常（未绑定本监测点）' : '未绑定本监测点' }}
            </span>
          </div>
          <div class="card-data">环境传感器：<span class="status-none">未绑定本监测点</span></div>
          <div class="card-data">
            报警状态：
            <span :class="hasAlarm ? 'status-alarm' : 'status-none'">
              {{ hasAlarm ? '全局采样异常' : '无专属报警' }}
            </span>
          </div>
          <div class="card-data">监测点接口：<span :class="monitorPointLoadState === 'loaded' ? 'status-ok' : 'status-alarm'">{{ monitorPointLoadText }}</span></div>
        </div>

        <div class="card">
          <div class="card-title">安全监测</div>
          <div class="card-data">火焰检测：<span class="status-none">未接入</span></div>
          <div class="card-data">烟雾检测：<span class="status-none">未接入</span></div>
          <div class="card-data">人员入侵：<span class="status-none">未接入</span></div>
          <div class="card-data">阀门状态：<span class="status-none">未接入</span></div>
          <div class="card-data">应急状态：<span class="status-none">未绑定本监测点</span></div>
        </div>

        <!-- 折线图 -->
        <div class="card chart-card">
          <div class="card-title">浓度记录趋势</div>
          <div class="line-chart">
            <div class="grid"></div>
            <div class="trend-meta">{{ trendSummary }}</div>
            <svg class="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline v-if="trendSvgPoints" :points="trendSvgPoints" class="trend-line" />
            </svg>
            <div class="dots">
              <span
                v-for="point in trendDots"
                :key="point.key"
                class="dot"
                :style="{ left: `${point.left}%`, bottom: `${point.bottom}%` }"
                :title="point.title"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useCarStore } from '@/store/carStore'
import { buildLatestReadingByCarId, reqMonitoringOverview } from '@/api/monitoringData'
import type { ConcentrationTrendPoint, EnvironmentSnapshot, LatestReading } from '@/api/monitoringData'
import { reqMonitorPointList } from '@/api/monitorPoint'
import type { MonitorPoint } from '@/api/monitorPoint'
import { getCarGasSpec, isCarGasValueInAlarm } from '@/data/gasCatalog'

// 发射异常状态给父组件
const emit = defineEmits(['monitor-status'])

const route = useRoute()
const router = useRouter()
const carStore = useCarStore()
const id = ref('')
const nowTime = ref('')
let timeTimer: ReturnType<typeof setInterval> | null = null

interface MonitorCamera {
  name: string
  url: string
  sourceBound: boolean
}

type MonitorPointLoadState = 'idle' | 'loading' | 'loaded' | 'failed'

const VIDEO_PLACEHOLDER = '/gas_video/novideo.png'
const monitorPointById = ref<Record<number, MonitorPoint>>({})
const monitorPointLoadState = ref<MonitorPointLoadState>('idle')
const camera = ref<MonitorCamera>({
  name: '未选择监测点',
  url: VIDEO_PLACEHOLDER,
  sourceBound: false,
})

const monitorTitle = computed(() => camera.value.name || (id.value ? `监测点 ${id.value}` : '未选择'))
const monitorCode = computed(() => (currentMonitorId.value ? `MONITOR-POINT-${currentMonitorId.value}` : 'MONITOR-UNSELECTED'))

const routeParamToString = (value: unknown) => {
  if (Array.isArray(value)) return String(value[0] ?? '')
  return String(value ?? '')
}

const currentMonitorId = computed(() => {
  const monitorId = Number(id.value)
  return Number.isInteger(monitorId) && monitorId > 0 ? monitorId : null
})

const selectedMonitorPoint = computed(() => {
  const monitorId = currentMonitorId.value
  return monitorId == null ? null : monitorPointById.value[monitorId] ?? null
})

const monitorPointExists = computed(() => selectedMonitorPoint.value !== null)

const monitorPointSourceLabel = computed(() => {
  if (currentMonitorId.value == null) return '未选择监测点'
  if (monitorPointLoadState.value === 'failed') return '监测点表加载失败'
  return monitorPointExists.value ? '来源：monitor_point 表' : '未找到后端监测点'
})

const monitorPointMissingLabel = computed(() => {
  if (currentMonitorId.value == null) return '未选择'
  if (monitorPointLoadState.value === 'loading' || monitorPointLoadState.value === 'idle') return '加载中'
  if (monitorPointLoadState.value === 'failed') return '列表加载失败'
  return '实体不存在'
})

const monitorPointLoadText = computed(() => {
  if (monitorPointLoadState.value === 'loaded') return '已加载 monitor_point'
  if (monitorPointLoadState.value === 'loading') return '加载中'
  if (monitorPointLoadState.value === 'failed') return '加载失败'
  return '未请求'
})

const gasReadingSourceText = computed(() => {
  const hasReadings = Object.keys(latestGasReadings.value).length > 0
  return hasReadings
    ? 'monitoring/overview 全局采样，不是当前监测点专属绑定'
    : '暂无 sampling/overview 读数'
})

const monitorBindingText = computed(() => {
  const point = selectedMonitorPoint.value
  if (!point) return '未找到 monitor_point 实体'
  return [
    point.sensorId ? `传感器 ${point.sensorId}` : '传感器未绑定',
    point.cameraUrl ? '视频源已绑定' : '视频源未绑定',
    `质量 ${point.qualityStatus || 'UNBOUND'}`,
  ].join(' / ')
})

const resolveCamera = () => {
  const monitorId = currentMonitorId.value
  if (monitorId == null) {
    camera.value = {
      name: '未选择监测点',
      url: VIDEO_PLACEHOLDER,
      sourceBound: false,
    }
    return
  }

  const point = selectedMonitorPoint.value
  camera.value = {
    name: point?.name || `未找到后端监测点 ${monitorId}`,
    url: point?.cameraUrl || VIDEO_PLACEHOLDER,
    sourceBound: Boolean(point?.cameraUrl),
  }
}

const loadMonitorPointMetadata = async () => {
  monitorPointLoadState.value = 'loading'
  try {
    const res = await reqMonitorPointList()
    if (res.code === 200 && Array.isArray(res.data)) {
      monitorPointById.value = res.data.reduce<Record<number, MonitorPoint>>((acc, item: MonitorPoint) => {
        if (Number.isInteger(item.id) && item.id > 0) {
          acc[item.id] = item
        }
        return acc
      }, {})
      monitorPointLoadState.value = 'loaded'
    } else {
      monitorPointById.value = {}
      monitorPointLoadState.value = 'failed'
    }
  } catch (error) {
    console.error('加载监测点元数据失败：', error)
    monitorPointById.value = {}
    monitorPointLoadState.value = 'failed'
  } finally {
    resolveCamera()
  }
}

type MonitorGasKey = 'methane' | 'nh3' | 'co' | 'oxygen'

const MONITOR_GAS_CAR_ID: Record<MonitorGasKey, number> = {
  methane: 1,
  nh3: 2,
  co: 3,
  oxygen: 4,
}

const latestGasReadings = ref<Record<number, LatestReading>>({})
const EMPTY_GAS_READING = '暂无记录'

const formatGasReading = (carId: number, value: string | number | null | undefined) => {
  const text = String(value ?? '').trim()
  if (!text) return EMPTY_GAS_READING
  return /(ppm|LEL|VOL|%)/i.test(text) ? text : `${text} ${getCarGasSpec(carId).unit}`
}

// 气体浓度来自后端监测概览的 sensor_reading 仿真采样读数；
// 没有采样读数时保持空态，warning_history 只表示告警事件。
const gasData = computed<Record<MonitorGasKey, string>>(() => ({
  methane: formatGasReading(1, latestGasReadings.value[1]?.gasValue),
  nh3: formatGasReading(2, latestGasReadings.value[2]?.gasValue),
  co: formatGasReading(3, latestGasReadings.value[3]?.gasValue),
  oxygen: formatGasReading(4, latestGasReadings.value[4]?.gasValue),
}))

const envData = ref<EnvironmentSnapshot>({
  available: false,
  windSpeed: null,
  windDirection: null,
  windDirectionText: null,
  temperature: null,
  humidity: null,
  pressure: null,
  noise: null,
  sensorCount: 0,
  onlineSensorCount: 0,
  averageRisk: 0,
  maxRisk: 0,
  warningCarCount: 0,
  observedAt: '',
  source: '',
})
const concentrationTrend = ref<ConcentrationTrendPoint[]>([])

const safeValue = ref(97)

const formatReading = (value: number | null | undefined, unit: string) => {
  if (value == null || Number.isNaN(Number(value))) return '未接入'
  return `${Number(value).toFixed(unit ? 1 : 3).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1')}${unit}`
}

const trendPoints = computed(() => concentrationTrend.value.slice(-12))

const trendRange = computed(() => {
  const values = trendPoints.value.map(item => Number(item.gasValue)).filter(Number.isFinite)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  return max === min ? { min: Math.max(0, min - 1), max: max + 1 } : { min, max }
})

const normalizeTrend = (value: number) => {
  const { min, max } = trendRange.value
  return 14 + ((value - min) / (max - min)) * 68
}

const trendDots = computed(() => {
  const points = trendPoints.value
  const lastIndex = Math.max(points.length - 1, 1)
  return points
    .map((point, index) => {
      const value = Number(point.gasValue)
      if (!Number.isFinite(value)) return null
      const time = point.time ? new Date(point.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''
      return {
        key: `${point.time}-${point.carId}-${index}`,
        left: points.length === 1 ? 50 : 8 + (index / lastIndex) * 84,
        bottom: normalizeTrend(value),
        title: `${time} ${point.gasType || '气体'} ${value}`,
      }
    })
    .filter(Boolean) as Array<{ key: string; left: number; bottom: number; title: string }>
})

const trendSvgPoints = computed(() => {
  if (!trendDots.value.length) return ''
  return trendDots.value
    .map(point => `${point.left},${100 - point.bottom}`)
    .join(' ')
})

const trendSummary = computed(() => {
  const latest = trendPoints.value.at(-1)
  if (!latest) return '监测采样记录 0 条'
  const time = new Date(latest.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const sourceText = latest.qualityStatus === 'SIMULATED' ? '仿真采样' : '监测记录'
  return `${latest.gasType || '气体'} 最新 ${Number(latest.gasValue).toFixed(1)} | ${sourceText} | ${time}`
})

const hasGasReadings = computed(() => Object.keys(latestGasReadings.value).length > 0)

const isGasAlarm = (type: MonitorGasKey) => {
  if (!hasGasReadings.value) return false
  const carId = MONITOR_GAS_CAR_ID[type]
  const reading = latestGasReadings.value[carId]
  if (!reading) return false
  return isCarGasValueInAlarm(carId, reading.gasValue)
}

const isOxygenAlarm = computed(() => isGasAlarm('oxygen'))

// 当前还没有 monitor_point 与传感器/小车的关系表；1..4 小车状态只作为全局采样参考。
const legacyCarReferenceWarning = computed(() => {
  const monitorId = currentMonitorId.value
  if (monitorId == null || monitorId < 1 || monitorId > 4) return false
  return carStore.getCarStatus(monitorId) === 'warning'
})

const hasGasAlarm = computed(() => {
  return legacyCarReferenceWarning.value || isGasAlarm('methane') || isGasAlarm('nh3') || isGasAlarm('co') || isOxygenAlarm.value
})

// 没有专属绑定前，页面只能呈现全局采样异常，不能声明当前监测点已经报警。
const hasAlarm = computed(() => hasGasAlarm.value)

// 安全指数
const updateSafeValue = () => {
  let s = legacyCarReferenceWarning.value ? 72 : 97
  if (isGasAlarm('methane')) s -= 5
  if (isGasAlarm('nh3')) s -= 10
  if (isGasAlarm('co')) s -= 8
  if (isOxygenAlarm.value) s -= 12
  safeValue.value = Math.max(s, 0)
}

// 发送状态给父组件
watch(hasAlarm, (val) => {
  emit('monitor-status', {
    id: id.value,
    alarm: val
  })
}, { immediate: true })

watch(
  () => route.params.id,
  async (value) => {
    id.value = routeParamToString(value)
    resolveCamera()
    await loadMonitorPointMetadata()
    updateSafeValue()
  },
)

// —————— 时间 & 自动刷新 ——————
const getTime = () => {
  const d = new Date()
  nowTime.value = d.toLocaleString()
}

const startAutoUpdate = () => {
  updateSafeValue()
}

const goBack = () => router.back()

const loadMonitoringOverview = async () => {
  try {
    const res = await reqMonitoringOverview()
    if (res.code === 200 && res.data) {
      envData.value = res.data.environment
      concentrationTrend.value = Array.isArray(res.data.concentrationTrend) ? res.data.concentrationTrend : []
      latestGasReadings.value = Array.isArray(res.data.latestReadings)
        ? buildLatestReadingByCarId(res.data.latestReadings)
        : {}
    }
  } catch (error) {
    console.error('加载监测概览失败：', error)
    latestGasReadings.value = {}
  }
}

onMounted(async () => {
  id.value = routeParamToString(route.params.id)
  resolveCamera()
  getTime()
  timeTimer = setInterval(getTime, 1000)
  // 拉取小车真实状态（warning 标志来自 patrol_car 表），驱动报警显示。
  await carStore.fetchCarDataFromDB()
  await loadMonitorPointMetadata()
  await loadMonitoringOverview()
  startAutoUpdate()
  updateSafeValue()
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style scoped>
.monitor-page {
  width: 100%;
  min-height: 100vh;
  background: #050d25;
  position: relative;
  overflow: hidden;
  color: #fff;
  font-family: "Microsoft YaHei", sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.back-btn {
  --el-button-text-color: #00d1ff;
  --el-button-bg-color: transparent;
  --el-button-border-color: rgba(0, 160, 255, 0.5);
  --el-button-hover-border-color: #00d1ff;
  --el-button-hover-text-color: #00d1ff;
  font-size: 16px;
  padding: 8px 16px;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 209, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 209, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 0;
  pointer-events: none;
}

.header {
  position: relative;
  z-index: 10;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.3);
}
.title .top {
  font-size: 26px;
  font-weight: bold;
  color: #00d1ff;
  text-shadow: 0 0 10px #00d1ff;
  margin-left: 125px;
}
.info {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.main-body {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 24px;
  padding: 30px 40px;
  width: 100%;
  max-width: 1760px;
  margin: 0 auto;
  height: calc(100vh - 80px);
}

.left-panel,
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 290px;
  flex-shrink: 0;
  margin-top: 60px;
}

.card {
  background: rgba(0, 30, 80, 0.4);
  border: 1px solid rgba(0, 170, 255, 0.3);
  padding: 18px 20px;
  border-radius: 10px;
  transition: all 0.3s;
}
.card-title {
  font-size: 16px;
  color: #00d1ff;
  font-weight: bold;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 170, 255, 0.2);
  text-shadow: 0 0 6px #00d1ff;
}
.card-data {
  font-size: 14px;
  color: #cceeff;
  line-height: 1.9;
  text-shadow: 0 0 4px rgba(255,255,255,0.3);
  transition: all 0.3s;
}

.text-green {
  color: #00ff88;
  font-weight: bold;
}
.text-red {
  color: #ff3333 !important;
  font-weight: bold;
  animation: flash 1s infinite alternate;
}

.chart-card {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.pie-chart {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 140px;
}
.pie {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 1s ease;
}
.pie::after {
  content: "";
  width: 80px;
  height: 80px;
  background: #050d25;
  border-radius: 50%;
  position: absolute;
}
.chart_round_text {
  position: absolute;
  color: #00d1ff;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 0 8px #00d1ff;
  left: 110px;
  top: 50px;
}
.pie-text {
  position: absolute;
  color: #00d1ff;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 0 8px #00d1ff;
}

.line-chart {
  width: calc(100% - 20px);
  height: 160px;
  position: relative;
  border-left: 1px solid rgba(0, 209, 255, 0.6);
  border-bottom: 1px solid rgba(0, 209, 255, 0.6);
  margin: 0 0 0 12px;
  overflow: hidden;
  border-radius: 0 0 4px 4px;
}
.trend-meta {
  position: absolute;
  top: 8px;
  left: 10px;
  z-index: 4;
  color: #99ccff;
  font-size: 12px;
  text-shadow: 0 0 6px #00d1ff;
}
.trend-svg {
  position: absolute;
  inset: 0;
  z-index: 2;
  overflow: hidden;
}
.trend-line {
  fill: none;
  stroke: #00d1ff;
  stroke-width: 1.35;
  filter: drop-shadow(0 0 3px #00d1ff);
}
.y-axis {
  position: absolute;
  left: -40px;
  top: 16px;
  height: 100%;
  width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #99ccff;
  font-size: 14px;
  text-align: right;
  padding-right: 8px;
  text-shadow: 0 0 4px #99ccff;
}
.x-axis {
  position: absolute;
  left: 0;
  bottom: -20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  color: #99ccff;
  font-size: 14px;
  text-shadow: 0 0 4px #99ccff;
}
.grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(0, 209, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 209, 255, 0.1) 1px, transparent 1px);
  background-size: 20% 20%;
  pointer-events: none;
}
.line-area {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  transition: all 1s ease;
}
.dots {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}
.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #00d1ff;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  box-shadow: 0 0 8px #00d1ff, 0 0 16px #00d1ff;
  z-index: 3;
}

.video-container {
  flex: 1 1 760px;
  margin-top: 100px;
  min-width: 0;
  max-width: 1080px;
  display: flex;
  justify-content: center;
}
.tech-border {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  border: 2px solid rgba(0, 160, 255, 0.6);
  background: #000;
  overflow: hidden;
  border-radius: 8px;
}
.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.corner {
  position: absolute;
  width: 32px;
  height: 32px;
  border: 3px solid #00d1ff;
  z-index: 6;
}
.corner.lt { top: 12px; left: 12px; border-right: none; border-bottom: none; }
.corner.rt { top: 12px; right: 12px; border-left: none; border-bottom: none; }
.corner.lb { bottom: 12px; left: 12px; border-right: none; border-top: none; }
.corner.rb { bottom: 12px; right: 12px; border-left: none; border-top: none; }

.video-overlay {
  position: absolute;
  top: 44px;
  left: 20px;
  color: #ffffff;
  font-size: 14px;
  font-weight: bolder;
  flex-direction: column;
  gap: 6px;
  z-index: 7;
  text-shadow: 0 0 6px rgba(0,0,0,0.8);
}
.status {
  position: absolute;
  top: 20px;
  left: 20px;
  color: #00d1ff;
  font-weight: 700;
  font-size: 20px;
  z-index: 7;
  text-shadow: 0 0 8px #00d1ff;
}

.tooltip {
  position: absolute;
  background: #0a2a4a;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #00d1ff;
  pointer-events: none;
  z-index: 9999;
  white-space: nowrap;
}

.info span {
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: bold;
}
.tag-live {
  color: #00eaff;
  background: rgba(0, 234, 255, 0.1);
  text-shadow: 0 0 6px #00eaff;
}
.tag-safe {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
  text-shadow: 0 0 6px #409eff;
}
.tag-danger {
  color: #fff;
  background: #ff3333;
  animation: flash 1s infinite alternate;
}
.tag-online {
  color: #00ff7f;
  background: rgba(0, 255, 127, 0.15);
  text-shadow: 0 0 8px #00ff7f;
}
.tag-offline {
  color: #ffd166;
  background: rgba(255, 209, 102, 0.14);
  text-shadow: 0 0 8px rgba(255, 209, 102, 0.5);
}

.status-ok {
  color: #00ff7f !important;
  font-weight: bold;
  text-shadow: 0 0 6px #00ff7f;
}
.status-alarm {
  color: #ff3333 !important;
  font-weight: bold;
  animation: flash 1s infinite alternate;
}
.status-none {
  color: #a0cfff !important;
  font-weight: 500;
}

.source-note {
  color: rgba(221, 239, 247, 0.66);
  font-size: 12px;
}

.video-overlay .label {
  margin-bottom: 6px;
  text-shadow: 0 0 8px #000;
}

@keyframes flash {
  from { opacity: 1; }
  to { opacity: 0.6; }
}

/* Detail polish */
.monitor-page {
  background:
    radial-gradient(circle at 18% 8%, rgba(64, 224, 208, 0.13), transparent 30%),
    radial-gradient(circle at 88% 10%, rgba(230, 162, 60, 0.13), transparent 26%),
    linear-gradient(135deg, #050d25 0%, #081827 54%, #041118 100%);
}

.bg-grid {
  opacity: 0.74;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.75), transparent 86%);
}

.header {
  height: 76px;
  padding: 0 clamp(18px, 2.5vw, 40px);
  background: rgba(4, 14, 28, 0.68);
  backdrop-filter: blur(14px);
  border-bottom-color: rgba(120, 211, 214, 0.24);
}

.back-btn {
  border-radius: 8px;
  min-height: 36px;
}

.title .top {
  margin-left: 0;
  font-size: clamp(19px, 1.55vw, 26px);
  letter-spacing: 0;
  color: #eef7fb;
  text-shadow: 0 0 16px rgba(64, 224, 208, 0.34);
}

.info {
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.info span {
  border-radius: 999px;
  padding: 5px 11px;
  font-size: 12px;
}

.main-body {
  gap: clamp(16px, 1.7vw, 28px);
  padding: clamp(18px, 2vw, 30px) clamp(18px, 2.5vw, 40px);
  height: calc(100vh - 76px);
}

.left-panel,
.right-panel {
  width: clamp(260px, 18vw, 310px);
  margin-top: clamp(20px, 4vw, 60px);
}

.card {
  border-radius: 8px;
  background:
    linear-gradient(160deg, rgba(6, 22, 43, 0.78), rgba(4, 31, 39, 0.58)),
    rgba(0, 30, 80, 0.38);
  border-color: rgba(120, 211, 214, 0.24);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.28);
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(120, 211, 214, 0.42);
  box-shadow: 0 20px 46px rgba(0, 0, 0, 0.36);
}

.card-title {
  color: #eef7fb;
  text-shadow: none;
  letter-spacing: 0;
}

.card-data {
  color: rgba(221, 239, 247, 0.86);
  text-shadow: none;
}

.chart_round_text {
  left: 50%;
  top: 52px;
  transform: translateX(-50%);
  font-size: 13px;
}

.pie {
  background-color: rgba(64, 224, 208, 0.08);
  box-shadow: 0 0 24px rgba(64, 224, 208, 0.14);
}

.line-chart {
  margin-left: 8px;
  width: calc(100% - 8px);
}

.video-container {
  margin-top: clamp(34px, 6vw, 100px);
}

.tech-border {
  border-radius: 8px;
  border-color: rgba(120, 211, 214, 0.48);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.44);
}

.tech-border::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 16%, rgba(0, 0, 0, 0.18)),
    linear-gradient(90deg, rgba(64, 224, 208, 0.08), transparent 18%, transparent 82%, rgba(230, 162, 60, 0.08));
  z-index: 5;
}

.corner {
  width: 26px;
  height: 26px;
  border-color: #40e0d0;
}

.status {
  font-size: 16px;
  letter-spacing: 0.08em;
}

.video-overlay {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(2, 10, 18, 0.56);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
}

@media (max-width: 1320px) {
  .monitor-page {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }

  .header {
    gap: 12px;
  }

  .main-body {
    height: auto;
    display: grid;
    grid-template-columns: 1fr;
  }

  .left-panel,
  .right-panel,
  .video-container {
    width: 100%;
    max-width: none;
    margin-top: 0;
  }

  .left-panel,
  .right-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .header {
    height: auto;
    min-height: 76px;
    align-items: flex-start;
    flex-direction: column;
    padding-block: 12px;
  }

  .main-body {
    padding: 14px;
  }

  .left-panel,
  .right-panel {
    grid-template-columns: 1fr;
  }

  .video-overlay {
    position: static;
    margin: 10px;
  }
}
</style>
