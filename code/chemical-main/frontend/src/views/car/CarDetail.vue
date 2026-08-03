<template>
  <div class="car-detail">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <button @click="$router.back()" class="back-btn">
        ← 返回
      </button>
      <div class="title-block">
        <h2 class="page-title">小车 {{ route.params.id }} 详情</h2>
        <div class="title-meta">
          <span>{{ config.type }}</span>
          <span>{{ latestGasDisplay }}</span>
          <span :class="globalStatus === 'normal' ? 'meta-pill normal' : 'meta-pill warning'">
            {{ globalStatus === 'normal' ? '运行正常' : '异常标记' }}
          </span>
        </div>
      </div>
    </div>

    <div class="detail-content">
      <!-- 左侧：视频区域 -->
      <div class="left-section">
        <div class="video-card">
          <h3 class="section-title">小车 {{ route.params.id }} 成像视频</h3>
          <div class="video-wrapper">
            <video
              v-if="!isPlaceholderVideo"
              :src="videoUrl"
              class="detail-video"
              muted
              loop
              autoplay
              playsinline
              controls
              preload="metadata"
            ></video>
            <div v-else class="video-empty-state">
              <div class="camera-mark">
                <span class="camera-body"></span>
                <span class="camera-lens"></span>
              </div>
              <strong>未上传监控影像</strong>
              <span>当前仓库未接入小车实时视频流，可上传巡检图片进行识别</span>
            </div>
            <div class="video-corners"></div>
            <div class="video-status">
              <span>CAM-{{ route.params.id }}</span>
              <strong>{{ globalStatus === 'normal' ? 'ONLINE' : 'ALERT' }}</strong>
            </div>
          </div>
        </div>
        
        <!-- 小车基本信息卡片 -->
        <div class="info-card">
          <h3 class="section-title">小车基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">小车编号</span>
              <span class="info-value">{{ route.params.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">监测气体</span>
              <span class="info-value">{{ config.type }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">安全阈值</span>
              <span class="info-value">{{ config.gasId === 'o2' ? `${config.min}-${config.max} ${config.unit}` : `≤${config.warning} ${config.unit}` }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前状态</span>
              <span class="status-badge" :class="globalStatus === 'normal' ? 'status-normal' : 'status-warning'">
                {{ globalStatus === 'normal' ? '正常' : '异常' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">最近检测</span>
              <span class="info-value">{{ detailList[detailList.length - 1]?.time || '无数据' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最近浓度</span>
              <span class="info-value">{{ latestGasDisplay }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：数据表格 + 警报 -->
      <div class="right-section">
        <div class="data-card">
          <h3 class="section-title">循环运行细节</h3>
          <div class="table-wrapper">
            <table>
              <thead>
              <tr>
                <th>检测时间</th>
                <th>{{ gasTypeLabel }}</th>
                <th>位置(X/Y)</th>
                <th>状态</th>
              </tr>
              </thead>
              <tbody>
              <tr v-if="detailList.length === 0" class="empty-row">
                <td colspan="4">暂无后端监测读数</td>
              </tr>
              <tr
                v-for="item in detailList"
                :key="item.time"
                :class="item.status === '一级预警' || globalStatus === 'warning' ? 'warning-row' : ''"
              >
                <td>{{ item.time }}</td>
                <td>{{ formatGasValue(item.gas) }}</td>
                <td>{{ formatCoordinatePair(item) }}</td>
                <td :class="(item.status === '正常' && globalStatus === 'normal') ? 'status-normal' : 'status-warning'">
                  {{ globalStatus === 'warning' ? '一级预警（手动标记）' : item.status }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 气体浓度趋势图表 -->
        <div class="chart-card">
          <h3 class="section-title">浓度趋势分析</h3>
          <div class="chart-wrapper">
            <div class="chart-placeholder">
              <div class="chart-title">{{ gasTypeLabel }}变化趋势</div>
              <div v-if="detailList.length === 0" class="chart-empty">暂无后端采样</div>
              <div v-else class="chart-bars">
                <div v-for="(item, index) in detailList" :key="index" class="chart-bar-container">
                  <div class="chart-bar" :style="{ height: getChartBarHeight(item) }"></div>
                  <div class="chart-label">{{ item.time.split(' ')[1] }}</div>
                  <div class="chart-value">{{ formatGasValue(item.gas) }}</div>
                </div>
              </div>
              <div class="chart-threshold" v-if="config.gasId !== 'o2'">
                <div class="threshold-line" :style="{ bottom: `${(config.warning / (config.warning * 1.5)) * 100}%` }"></div>
                <div class="threshold-label">安全阈值: {{ config.warning }} {{ gasUnit }}</div>
              </div>
              <div class="chart-threshold" v-else>
                <div class="threshold-line min" :style="{ bottom: `${(config.min / 25) * 100}%` }"></div>
                <div class="threshold-line max" :style="{ bottom: `${(config.max / 25) * 100}%` }"></div>
                <div class="threshold-label">安全范围: {{ config.min }}-{{ config.max }} {{ gasUnit }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 异常警报 -->
        <div v-if="hasWarning || aiAdvice" class="alert-card">
          <div class="alert-header">
            <span class="alert-icon">⚠️</span>
            <h4>异常警报处理</h4>
          </div>
          <p class="alert-desc">
            {{ globalStatus === 'warning'
            ? '该小车已被手动标记为异常！'
            : `检测到 ${gasTypeLabel} 超出安全阈值，请立即处理！`
            }}
          </p>
          <div class="decision-panel">
            <div class="decision-panel-header">
              <strong>智巡处置建议</strong>
              <span v-if="aiAdvice" class="decision-source">{{ aiAdvice.source === 'QWEN' ? '通义千问' : '规则兜底' }}</span>
            </div>
            <template v-if="aiAdvice">
              <div class="decision-risk">风险等级：{{ aiAdvice.riskLevel }} · 审核状态：{{ aiAdvice.reviewStatus }}</div>
              <p class="decision-summary">{{ aiAdvice.summary }}</p>
              <p class="decision-explanation">{{ aiAdvice.riskExplanation }}</p>
              <ul class="decision-list">
                <li v-for="item in aiAdvice.recommendations" :key="item">{{ item }}</li>
              </ul>
              <div class="decision-actions">
                <button v-if="aiAdvice.reviewStatus === 'PENDING'" class="decision-btn approve" @click="reviewAdvice('APPROVED')">采用建议</button>
                <button v-if="aiAdvice.reviewStatus === 'PENDING'" class="decision-btn reject" @click="reviewAdvice('REJECTED')">拒绝建议</button>
                <button class="decision-btn refresh" @click="handleWarning">重新生成</button>
              </div>
              <small v-if="aiAdvice.fallbackReason" class="decision-fallback">{{ aiAdvice.fallbackReason }}</small>
            </template>
            <button v-else @click="handleWarning" class="alert-btn">生成智巡建议</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCarStore } from '@/store/carStore'

import { ElMessage } from 'element-plus'
import { getCarGasSpec, type CarGasId } from '@/data/gasCatalog'
import { reqMonitoringOverview } from '@/api/monitoringData'
import { reqAddWarningHistory } from '@/api/warningHistory'
import { reqWarningHistoryList } from '@/api/warningHistory'
import { reqApproveAiAdvice, reqGenerateAiAdvice, reqLatestAiAdvice, reqRejectAiAdvice, type AiAdviceRecord } from '@/api/aiDecision'
import type { ConcentrationTrendPoint } from '@/api/monitoringData'

interface DetailItem {
  time: string
  gas: number | null
  x: number | null
  y: number | null
  status?: string
}

interface GasConfig {
  gasId: CarGasId
  type: string
  unit: string
  label: string
  warning?: number
  min?: number
  max?: number
}

type DetailGasConfig = GasConfig & {
  warning: number
  min: number
  max: number
}

const route = useRoute()
const router = useRouter()
const carStore = useCarStore()
const videoUrl = ref('')
const detailList = ref<DetailItem[]>([])
const aiAdvice = ref<AiAdviceRecord | null>(null)

// 气体配置统一引用 data/gasCatalog 单一数据源，避免与 CarHome / carStore 阈值漂移。
const toDetailGasConfig = (config: GasConfig): DetailGasConfig => ({
  warning: 0,
  min: 0,
  max: 0,
  ...config
})

const gasConfig: Record<number, DetailGasConfig> = {
  1: toDetailGasConfig(getCarGasSpec(1)),
  2: toDetailGasConfig(getCarGasSpec(2)),
  3: toDetailGasConfig(getCarGasSpec(3)),
  4: toDetailGasConfig(getCarGasSpec(4))
}

function getStatus(gasValue: number | null, config: GasConfig): string {
  if (gasValue == null) return '暂无读数'
  if (config.gasId === 'o2') {
    return (config.min !== undefined && config.max !== undefined && (gasValue < config.min || gasValue > config.max)) ? '一级预警' : '正常'
  } else {
    return (config.warning !== undefined && gasValue >= config.warning) ? '一级预警' : '正常'
  }
}

// 视频引用为真实本地资源，按 carId 单独保留映射。
// 大体积巡检视频已从版本库移除；详情页使用已跟踪占位图，避免 CI/新克隆依赖本地未跟踪 mp4。
const carVideoMap: Record<number, string> = {
  1: '/video/小车1视频.mp4',
  2: '/video/小车2视频.mp4',
  3: '/video/小车3视频.mp4',
  4: '/video/小车4视频.mp4'
}

// 巡检明细 X 轴时间格式化（年-月-日 时:分），与 CarHome 一致口径。
function formatWarningTime(timeStr: string): string {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const carId = computed(() => String(route.params.id ?? ''))
const config = computed(() => gasConfig[Number(carId.value)])
const gasTypeLabel = computed(() => config.value?.label || '气体浓度')
const gasUnit = computed(() => config.value?.unit || 'ppm')

const globalStatus = computed(() => carStore.getCarStatus(Number(carId.value)))

const latestGasDisplay = computed(() => formatGasValue(detailList.value.at(-1)?.gas ?? null))
const isPlaceholderVideo = computed(() => !videoUrl.value || videoUrl.value.includes('novideo'))

function formatGasValue(gasValue: number | null | undefined): string {
  return gasValue == null ? '暂无读数' : `${gasValue} ${gasUnit.value}`
}

function formatCoordinatePair(item: DetailItem): string {
  return item.x == null || item.y == null ? '暂无坐标' : `${item.x}/${item.y}`
}

function getChartBarHeight(item: DetailItem): string {
  if (item.gas == null) return '0%'
  const denominator = config.value.gasId === 'o2'
    ? 25
    : Math.max(config.value.warning * 1.5, item.gas, 1)
  return `${Math.min(100, Math.max(2, (item.gas / denominator) * 100))}%`
}

const hasWarning = computed(() =>
  detailList.value.some(item => item.status === '一级预警') || globalStatus.value === 'warning'
)

// 加载小车详情：视频用本地真实资源，巡检明细来自后端 sensor_reading 仿真采样。
// 没有采样读数时保持空态，warning_history 只表示告警事件。
async function getCarDetail() {
  const id = Number(carId.value)
  // 合法性基于 gasConfig（carId∈[1..4]）判断，而非依赖此前的写死假数据是否存在。
  if (!id || !gasConfig[id]) {
    ElMessage.warning('小车数据不存在')
    router.push('/car/home')
    return
  }
  videoUrl.value = carVideoMap[id] || ''

  try {
    const historyRes = await reqWarningHistoryList()
    const latestAlert = historyRes.data?.find((item) => Number(item.carId) === id)
    aiAdvice.value = latestAlert?.id ? (await reqLatestAiAdvice(latestAlert.id)).data : null
  } catch {
    aiAdvice.value = null
  }

  try {
    const res = await reqMonitoringOverview()
    if (res.code === 200 && Array.isArray(res.data?.concentrationTrend)) {
      detailList.value = res.data.concentrationTrend
        .filter(item => Number(item.carId) === id)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        .map((item: ConcentrationTrendPoint) => {
          const parsedGas = Number(item.gasValue)
          const gas = Number.isFinite(parsedGas) ? parsedGas : null
          return {
            time: formatWarningTime(item.time),
            gas,
            x: null,
            y: null,
            status: getStatus(gas, config.value)
          }
        })
    } else {
      detailList.value = []
    }
  } catch (error) {
    console.error('获取小车巡检明细失败：', error)
    detailList.value = []
  }
}

// 预警处理函数（走统一 request 实例）
const handleWarning = async () => {
  try {
    // 取最新一条历史读数作为当前浓度；无历史记录则兜底 0。
    const latestGas = detailList.value.at(-1)?.gas ?? null
    if (latestGas == null) {
      ElMessage.warning('暂无后端监测读数，不能写入 0 作为处理浓度')
      return
    }
    // 保存事件事实后生成建议，所有车辆动作仍需人工确认。
    await reqAddWarningHistory({
      carId: Number(carId.value),
      gasType: config.value.type,
      gasValue: latestGas
    })

    const historyRes = await reqWarningHistoryList()
    const latestAlert = historyRes.data?.find((item) => Number(item.carId) === Number(carId.value))
    if (!latestAlert?.id) {
      throw new Error('告警事件已保存，但未找到事件编号')
    }
    const adviceRes = await reqGenerateAiAdvice(latestAlert.id)
    aiAdvice.value = adviceRes.data

    // 2. 重置小车状态（原有逻辑）
    if (globalStatus.value === 'warning') {
      carStore.resetCarStatus(Number(carId.value))
    }
    ElMessage.success('已生成智巡建议，请人工审核')
    // 3. 处理后刷新明细，反映最新记录。
    await getCarDetail()
  } catch (error) {
    console.error('处理失败：', error)
    ElMessage.error('处理异常，请重试')
  }
}

const reviewAdvice = async (status: 'APPROVED' | 'REJECTED') => {
  if (!aiAdvice.value) return
  try {
    const res = status === 'APPROVED'
      ? await reqApproveAiAdvice(aiAdvice.value.id)
      : await reqRejectAiAdvice(aiAdvice.value.id)
    aiAdvice.value = res.data
    ElMessage.success(status === 'APPROVED' ? '建议已通过人工审核' : '建议已拒绝')
  } catch (error) {
    ElMessage.error(`审核失败：${(error as Error).message}`)
  }
}

// 修复：监听路由参数变化，即时加载数据
watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      getCarDetail()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await carStore.fetchCarDataFromDB()
  getCarDetail()
})
</script>

<style scoped>
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.car-detail {
  min-height: 100vh;
  background-color: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  color: #e0e6ed;
  position: relative;
}

.car-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/background2.jpg') center/cover no-repeat;
  filter: blur(8px) brightness(0.4);
  z-index: -1;
  opacity: 0.8;
  pointer-events: none;
}

/* 顶部导航栏 */
.top-nav {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  background: rgba(10, 25, 50, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(64, 224, 208, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 1;
}
.back-btn {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e0e6ed;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
  border-color: #40e0d0;
  color: #40e0d0;
}
.page-title {
  margin-left: 20px;
  font-size: 20px;
  font-weight: 600;
  color: #40e0d0;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.3);
}

/* 内容区域（左右分栏） */
.detail-content {
  display: flex;
  gap: 24px;
  padding: 24px;
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* 左侧视频区域 */
.left-section {
  flex: 1;
  min-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.video-card, .info-card, .data-card, .chart-card {
  background: rgba(10, 25, 50, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(64, 224, 208, 0.2);
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 14px;
  color: #b8e8e4;
  font-weight: 500;
}
.info-value {
  font-size: 16px;
  color: #e0e6ed;
  font-weight: 600;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #40e0d0;
  margin-bottom: 16px;
}
.video-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例，视频不会变形 */
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}
.detail-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.video-empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 38%, rgba(64, 224, 208, 0.18), transparent 26%),
    linear-gradient(145deg, rgba(7, 19, 34, 0.96), rgba(2, 10, 18, 0.98));
}

.video-empty-state strong {
  color: #eef7fb;
  font-size: clamp(20px, 1.5vw, 28px);
  letter-spacing: 0;
}

.video-empty-state > span {
  color: rgba(221, 239, 247, 0.64);
  font-size: 14px;
}

.camera-mark {
  position: relative;
  width: 148px;
  height: 96px;
  filter: drop-shadow(0 0 24px rgba(64, 224, 208, 0.2));
}

.camera-body {
  position: absolute;
  left: 10px;
  bottom: 12px;
  width: 78px;
  height: 58px;
  border: 7px solid rgba(238, 247, 251, 0.9);
  border-radius: 14px;
  background: rgba(2, 10, 18, 0.42);
}

.camera-body::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 18px;
  width: 22px;
  height: 22px;
  border: 7px solid rgba(238, 247, 251, 0.9);
  border-radius: 50%;
}

.camera-lens {
  position: absolute;
  right: 4px;
  top: 10px;
  width: 86px;
  height: 48px;
  border: 7px solid rgba(238, 247, 251, 0.9);
  border-left-width: 12px;
  border-radius: 16px 18px 18px 16px;
  transform: skewY(-12deg);
  background: rgba(64, 224, 208, 0.08);
}

.camera-lens::after {
  content: '';
  position: absolute;
  top: 16px;
  right: 14px;
  width: 42px;
  height: 7px;
  border-radius: 999px;
  background: rgba(238, 247, 251, 0.9);
}

/* 右侧数据区域 */
.right-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  background: transparent;
}
table {
  width: 100%;
  border-collapse: collapse;
  color: #e0e6ed;
}
thead tr {
  background: rgba(0, 0, 0, 0.3);
  color: #40e0d0;
  border-bottom: 1px solid rgba(64, 224, 208, 0.3);
}
th, td {
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
}
th {
  font-weight: 600;
}
tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: background-color 0.2s;
}
tbody tr:hover {
  background-color: rgba(64, 224, 208, 0.1);
}
.warning-row {
  background-color: rgba(229, 62, 62, 0.1) !important;
}
.status-normal {
  color: #40e0d0;
  font-weight: 600;
}
.status-warning {
  color: #ff4d4f;
  font-weight: 600;
}

/* 气体浓度趋势图表 */
.chart-wrapper {
  width: 100%;
  height: 300px;
}
.chart-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
}
.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #40e0d0;
  margin-bottom: 20px;
  text-align: center;
}
.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  position: relative;
}
.chart-bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 60px;
}
.chart-bar {
  width: 100%;
  background: linear-gradient(to top, #40e0d0, #0a5cad);
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  position: relative;
  overflow: hidden;
}
.chart-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.3));
}
.chart-label {
  font-size: 12px;
  color: #b8e8e4;
  text-align: center;
}
.chart-value {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-align: center;
}
.chart-threshold {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 40px;
  pointer-events: none;
}
.threshold-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #ff4d4f;
  z-index: 1;
}
.threshold-line.min {
  background: #40e0d0;
}
.threshold-line.max {
  background: #ff4d4f;
}
.threshold-label {
  position: absolute;
  right: 10px;
  font-size: 12px;
  color: #fff;
  background: rgba(229, 62, 62, 0.8);
  padding: 2px 8px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  z-index: 2;
}

/* 警报卡片 */
.alert-card {
  background: rgba(229, 62, 62, 0.2);
  border: 1px solid rgba(229, 62, 62, 0.5);
  border-radius: 12px;
  padding: 20px;
}
.decision-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}
.decision-panel-header,
.decision-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.decision-panel-header {
  justify-content: space-between;
}
.decision-source,
.decision-risk {
  color: #7de1d2;
  font-size: 12px;
}
.decision-summary,
.decision-explanation {
  line-height: 1.6;
}
.decision-list {
  padding-left: 20px;
  color: rgba(238, 247, 251, 0.82);
  line-height: 1.7;
}
.decision-btn {
  border: 1px solid rgba(120, 211, 214, 0.28);
  border-radius: 4px;
  padding: 8px 12px;
  color: #effffd;
  cursor: pointer;
}
.decision-btn.approve { background: rgba(24, 169, 153, 0.42); }
.decision-btn.reject { background: rgba(245, 108, 108, 0.24); }
.decision-btn.refresh { background: rgba(64, 158, 255, 0.22); }
.decision-fallback { display: block; margin-top: 10px; color: #f4bd72; line-height: 1.4; }
.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.alert-icon {
  font-size: 20px;
}
.alert-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b6b;
}
.alert-desc {
  font-size: 14px;
  color: #e0e6ed;
  margin-bottom: 16px;
}
.alert-btn {
  padding: 10px 20px;
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
}
.alert-btn:hover {
  background: linear-gradient(90deg, #ff7875, #ff4d4f);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.6);
}

/* 响应式适配（小屏幕自动堆叠） */
/* Detail polish */
.car-detail {
  isolation: isolate;
}

.car-detail::before {
  filter: blur(10px) brightness(0.42) saturate(1.08);
  opacity: 0.9;
}

.car-detail::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(circle at 12% 8%, rgba(64, 224, 208, 0.14), transparent 30%),
    radial-gradient(circle at 90% 0%, rgba(230, 162, 60, 0.15), transparent 28%),
    linear-gradient(135deg, rgba(3, 12, 24, 0.82), rgba(7, 28, 38, 0.76));
}

.top-nav {
  width: min(100%, 1760px);
  margin: 0 auto 24px;
  min-height: 78px;
  padding: 16px 24px;
  border-radius: 0 0 8px 8px;
  background:
    linear-gradient(135deg, rgba(9, 25, 45, 0.92), rgba(7, 32, 42, 0.82)),
    rgba(10, 25, 50, 0.8);
  border: 1px solid rgba(120, 211, 214, 0.2);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.3);
}

.back-btn {
  min-width: 90px;
  height: 42px;
  border-radius: 8px;
  background: rgba(2, 12, 24, 0.35);
  border-color: rgba(120, 211, 214, 0.24);
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.page-title {
  margin-left: 18px;
  font-size: clamp(21px, 1.6vw, 28px);
  line-height: 1.2;
  letter-spacing: 0;
}

.title-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: 18px;
  color: rgba(221, 239, 247, 0.72);
  font-size: 13px;
}

.title-meta span {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.title-meta .meta-pill.normal {
  color: #40e0d0;
  border-color: rgba(64, 224, 208, 0.32);
  background: rgba(64, 224, 208, 0.09);
}

.title-meta .meta-pill.warning {
  color: #ff7875;
  border-color: rgba(255, 120, 117, 0.34);
  background: rgba(255, 77, 79, 0.1);
}

.detail-content {
  width: min(100%, 1760px);
  display: grid;
  grid-template-columns: minmax(520px, 1.05fr) minmax(520px, 1fr);
  gap: 28px;
  padding: 0 24px 32px;
}

.left-section {
  min-width: 0;
}

.right-section {
  min-width: 0;
}

.video-card,
.info-card,
.data-card,
.chart-card,
.alert-card {
  border-radius: 8px;
  background:
    linear-gradient(160deg, rgba(8, 23, 40, 0.84), rgba(7, 34, 41, 0.68)),
    rgba(10, 25, 50, 0.62);
  border-color: rgba(120, 211, 214, 0.22);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
}

.video-card:hover,
.info-card:hover,
.data-card:hover,
.chart-card:hover {
  transform: translateY(-2px);
  border-color: rgba(120, 211, 214, 0.42);
  box-shadow: 0 22px 52px rgba(0, 0, 0, 0.38);
}

.section-title {
  color: #40e0d0;
  letter-spacing: 0;
  text-shadow: 0 0 14px rgba(64, 224, 208, 0.26);
}

.video-wrapper {
  border: 1px solid rgba(120, 211, 214, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.video-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 20%, rgba(0, 0, 0, 0.16)),
    linear-gradient(90deg, rgba(64, 224, 208, 0.08), transparent 18%, transparent 82%, rgba(230, 162, 60, 0.08));
}

.video-corners::before,
.video-corners::after {
  content: '';
  position: absolute;
  width: 34px;
  height: 34px;
  z-index: 2;
}

.video-corners::before {
  top: 14px;
  left: 14px;
  border-top: 3px solid #40e0d0;
  border-left: 3px solid #40e0d0;
}

.video-corners::after {
  right: 14px;
  bottom: 14px;
  border-right: 3px solid #40e0d0;
  border-bottom: 3px solid #40e0d0;
}

.video-status {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(2, 10, 18, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  color: rgba(238, 247, 251, 0.84);
  font-size: 12px;
}

.video-status strong {
  color: #40e0d0;
}

.info-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  min-height: 82px;
  padding: 14px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(64, 224, 208, 0.08), rgba(230, 162, 60, 0.04)),
    rgba(2, 12, 24, 0.35);
  border: 1px solid rgba(120, 211, 214, 0.14);
  justify-content: center;
}

.info-label {
  color: rgba(221, 239, 247, 0.68);
  font-size: 13px;
}

.info-value,
.status-badge {
  color: #eef7fb;
  font-size: 17px;
}

.status-badge {
  display: inline-flex;
  width: fit-content;
  padding: 5px 12px;
  border-radius: 999px;
}

.status-badge.status-normal {
  background: rgba(64, 224, 208, 0.1);
  border: 1px solid rgba(64, 224, 208, 0.32);
}

.status-badge.status-warning {
  background: rgba(255, 77, 79, 0.12);
  border: 1px solid rgba(255, 120, 117, 0.34);
}

.table-wrapper {
  border: 1px solid rgba(120, 211, 214, 0.14);
  background: rgba(2, 12, 24, 0.28);
}

table {
  border-collapse: separate;
  border-spacing: 0;
}

thead tr {
  background: rgba(5, 18, 34, 0.88);
}

th {
  color: #40e0d0;
  letter-spacing: 0;
}

td {
  color: rgba(238, 247, 251, 0.84);
}

tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.035);
}

.warning-row {
  background: rgba(255, 120, 117, 0.11) !important;
}

.chart-wrapper {
  height: 340px;
}

.chart-placeholder {
  background:
    linear-gradient(160deg, rgba(3, 12, 24, 0.66), rgba(30, 14, 24, 0.34)),
    rgba(0, 0, 0, 0.28);
  border-color: rgba(120, 211, 214, 0.16);
}

.chart-bars {
  gap: 10px;
}

.chart-bar {
  min-height: 4px;
  background: linear-gradient(to top, #40e0d0, #409eff 56%, #e6a23c);
  box-shadow: 0 0 16px rgba(64, 224, 208, 0.16);
}

.alert-card {
  background:
    linear-gradient(135deg, rgba(255, 77, 79, 0.18), rgba(230, 162, 60, 0.1)),
    rgba(10, 25, 50, 0.62);
}

@media (max-width: 1200px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
  .left-section {
    min-width: 100%;
  }
}

@media (max-width: 760px) {
  .top-nav {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 16px;
  }

  .page-title,
  .title-meta {
    margin-left: 0;
  }

  .detail-content {
    padding: 0 14px 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  th,
  td {
    padding: 10px 12px;
    white-space: nowrap;
  }
}
</style>
