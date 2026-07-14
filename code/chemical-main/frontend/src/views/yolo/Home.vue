<template>
  <div class="big-screen-container">
    <header class="screen-header">
      <div class="header-bg-line"></div>
      <div class="header-left">
        <span class="time-box">{{ currentTime }}</span>
        <span class="weather-tag">模拟环境温感：{{ SIMULATED_AMBIENT_TEMPERATURE }}°C</span>
      </div>
      <div class="header-center">
        <div class="main-title">智慧化工园区 - 自动化图像巡检指挥中心</div>
        <div class="sub-title-line">SMART CHEMICAL PARK IMAGE INSPECTION SYSTEM</div>
      </div>
      <div class="header-right">
        <div class="status-indicator">
          <span class="dot" :class="{ 'is-active': isAutoPolling }"></span>
          任务状态：{{ isAutoPolling ? 'AI 素材分析中' : '系统就绪' }}
        </div>
      </div>
    </header>

    <el-row :gutter="15" class="screen-body">
      <el-col :span="6">
        <div class="data-box panel-left-top">
          <div class="box-title"><el-icon><DataLine /></el-icon> 巡检素材人员识别</div>
          <div ref="gaugeRef" class="chart-container"></div>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="m-label">当前识别</div>
              <div class="m-value color-blue">{{ currentCount }}<span>人</span></div>
            </div>
            <div class="metric-card">
              <div class="m-label">识别耗时</div>
              <div class="m-value color-green">{{ analysisTime }}<span>ms</span></div>
            </div>
          </div>
          <div class="metric-source">{{ yoloSummarySource }}</div>
        </div>

        <div class="data-box panel-left-bottom">
          <div class="box-title"><el-icon><PieChart /></el-icon> 区域风险分布（模拟）</div>
          <div ref="pieRef" class="chart-container-small"></div>
        </div>

        <div class="data-box panel-left-bottom">
          <div class="box-title"><el-icon><TrendCharts /></el-icon> 近 1 小时巡检量趋势（模拟）</div>
          <div ref="lineRef" class="chart-container-small"></div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="data-box main-video-panel">
          <div class="video-header">
            <div class="cam-name">
              <span class="demo-tag">素材</span> 核心作业区 A7 巡检素材回放
            </div>
            <div v-if="currentModelVersion" class="model-version">模型 {{ currentModelVersion }}</div>
            <div v-if="currentDetectionSummary" class="model-version">{{ currentDetectionSummary }}</div>
            <div v-if="imageQueue.length > 0" class="task-progress">
              进度：{{ currentIndex + 1 }} / {{ imageQueue.length }}
            </div>
          </div>

          <div class="display-area" v-loading="loading" element-loading-background="rgba(0, 0, 0, 0.7)">
            <div class="corner-line top-left"></div>
            <div class="corner-line top-right"></div>
            <div class="corner-line bottom-left"></div>
            <div class="corner-line bottom-right"></div>

            <div v-if="resultImage" class="img-container">
              <el-image :src="resultImage" fit="contain" class="main-img" />
              <div v-if="isAutoPolling" class="scanner-line"></div>
            </div>

            <div
              v-else
              class="upload-guide"
              :class="{ disabled: !userStore.isAdmin }"
              @click="userStore.isAdmin && triggerUpload()"
            >
              <div class="radar-circle"></div>
              <el-icon class="guide-icon"><VideoCamera /></el-icon>
              <p>点击导入巡检素材</p>
              <span>SUPPORT: JPG/PNG BATCH MODE</span>
            </div>
          </div>

          <div class="control-footer">
            <input ref="fileInput" type="file" style="display: none" multiple accept="image/*" @change="handleFileSelect" />
            <el-button-group>
              <el-button type="primary" :icon="UploadFilled" :disabled="!userStore.isAdmin || isAutoPolling" @click="triggerUpload">导入素材</el-button>
              <el-button type="success" :icon="CaretRight" :disabled="!userStore.isAdmin || imageQueue.length === 0 || isAutoPolling" @click="toggleAutoPolling">启动巡检</el-button>
              <el-button type="danger" :icon="RefreshRight" @click="resetTask">重置任务</el-button>
            </el-button-group>
            <div class="queue-info">待处理队列：{{ Math.max(0, imageQueue.length - currentIndex) }} 张</div>
          </div>
        </div>
      </el-col>

      <el-col :span="6">
        <div class="data-box log-panel">
          <div class="box-title"><el-icon><List /></el-icon> 巡检记录流水</div>
          <div class="log-list-wrapper">
            <transition-group name="list" tag="div">
              <div v-for="log in detectionLogs" :key="log.id" class="log-item" :class="{ 'warning-log': log.count > 5 }">
                <div class="log-header">
                  <span class="log-time">{{ log.time }}</span>
                  <el-tag size="small" :type="log.count > 5 ? 'danger' : 'success'">
                    {{ log.count > 5 ? '异常' : '正常' }}
                  </el-tag>
                  <el-button v-if="userStore.isAdmin" text size="small" class="delete-btn" @click="delLog(log.id)">删除</el-button>
                </div>
                <div class="log-content">
                  检测到人员：<strong>{{ log.count }}</strong>，位置：{{ log.location }}
                </div>
              </div>
            </transition-group>
          </div>
        </div>

        <div class="data-box alert-panel">
          <div class="box-title">模拟安全运行天数</div>
          <div class="safety-days">{{ SIMULATED_SAFETY_DAYS.toLocaleString() }}<span>Days</span></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UploadFilled,
  VideoCamera,
  DataLine,
  PieChart,
  TrendCharts,
  List,
  CaretRight,
  RefreshRight,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  reqAnalyzePersonImage,
  reqDeleteInspectRecord,
  reqInspectRecordList,
} from '@/api/analysis'
import { reqYoloSummary } from '@/api/yoloSummary'
import type {
  InspectRecord,
  YoloAnalysisData as AnalysisData,
} from '@/api/analysis'
import useUserStore from '@/store/modules/user'

interface DetectionLog {
  id: number
  time: string
  location: string
  count: number
}

interface RequestErrorLike {
  response?: {
    data?: {
      message?: string
    }
  }
  message?: string
}

const SIMULATED_AMBIENT_TEMPERATURE = 24.5
const SIMULATED_SAFETY_DAYS = 1284
const SIMULATED_RISK_DISTRIBUTION = [
  { value: 10, name: '生产 A 区' },
  { value: 5, name: '仓储区' },
  { value: 15, name: '装卸站' },
]
const SIMULATED_INSPECTION_TREND = {
  times: ['10:00', '10:15', '10:30', '10:45', '11:00'],
  counts: [12, 18, 15, 25, 21],
}
const userStore = useUserStore()

const getRequestErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) {
    return '算法节点响应异常'
  }
  const requestError = error as RequestErrorLike
  return requestError.response?.data?.message || requestError.message || '算法节点响应异常'
}

const resultImage = ref('')
const loading = ref(false)
const currentTime = ref('')
const analysisTime = ref(0)
const currentCount = ref(0)
const currentModelVersion = ref('')
const currentDetectionSummary = ref('')
const yoloSummarySource = ref('后端巡检记录加载中')
const isAutoPolling = ref(false)
const imageQueue = ref<File[]>([])
const currentIndex = ref(0)
const detectionLogs = ref<DetectionLog[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
let pollingTimer: ReturnType<typeof setTimeout> | null = null

const gaugeRef = ref<HTMLElement | null>(null)
const pieRef = ref<HTMLElement | null>(null)
const lineRef = ref<HTMLElement | null>(null)
let gaugeChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let clockTimer: ReturnType<typeof setInterval> | null = null

const loadLogList = async () => {
  try {
    const res = await reqInspectRecordList()
    const logItems = Array.isArray(res.data) ? res.data : []
    detectionLogs.value = logItems.map((item) => ({
      id: item.id,
      time: new Date(item.createTime).toLocaleTimeString(),
      location: item.location,
      count: item.personCount,
    }))
  } catch {
    detectionLogs.value = []
    ElMessage.warning('巡检历史加载失败，请检查后端服务')
  }
}

const loadYoloSummary = async () => {
  try {
    const res = await reqYoloSummary()
    const summary = res.data
    if (!summary) {
      yoloSummarySource.value = '暂无后端巡检记录'
      return
    }
    currentCount.value = summary.currentCount ?? 0
    analysisTime.value = summary.analysisTime ?? 0
    yoloSummarySource.value = summary.currentCount === null ? '暂无后端巡检记录' : '来源：后端巡检记录'
    if (summary.lastAnalysisTime && !currentDetectionSummary.value) {
      currentDetectionSummary.value = `最近记录 ${new Date(summary.lastAnalysisTime).toLocaleTimeString()}`
    }
    gaugeChart?.setOption({ series: [{ data: [{ value: currentCount.value }] }] })
  } catch {
    yoloSummarySource.value = '后端巡检汇总加载失败'
  }
}

const delLog = async (id: number) => {
  try {
    await reqDeleteInspectRecord(id)
    await loadLogList()
    await loadYoloSummary()
    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除失败，请确认当前账号具有管理员权限')
  }
}

const initCharts = () => {
  if (gaugeRef.value) {
    gaugeChart = echarts.init(gaugeRef.value, 'dark')
    gaugeChart.setOption({
      backgroundColor: 'transparent',
      series: [{
        type: 'gauge',
        min: 0,
        max: 20,
        splitNumber: 4,
        axisLine: { lineStyle: { width: 6, color: [[0.3, '#67C23A'], [0.7, '#E6A23C'], [1, '#F56C6C']] } },
        pointer: { width: 3 },
        detail: { fontSize: 20, color: '#fff', offsetCenter: [0, '70%'], formatter: '{value}' },
        data: [{ value: 0 }],
      }],
    })
  }

  if (pieRef.value) {
    pieChart = echarts.init(pieRef.value, 'dark')
    pieChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#102038', borderWidth: 2 },
        label: { show: false },
        data: SIMULATED_RISK_DISTRIBUTION,
      }],
    })
  }

  if (lineRef.value) {
    lineChart = echarts.init(lineRef.value, 'dark')
    lineChart.setOption({
      backgroundColor: 'transparent',
      grid: { top: 10, bottom: 20, left: 30, right: 10 },
      xAxis: { type: 'category', data: SIMULATED_INSPECTION_TREND.times, axisLine: { show: false } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1a3a61' } } },
      series: [{
        name: '模拟巡检量',
        data: SIMULATED_INSPECTION_TREND.counts,
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(0, 242, 254, 0.2)' },
      }],
    })
  }
}

const updateTime = () => {
  currentTime.value = new Date().toLocaleString()
}

const handleResize = () => {
  gaugeChart?.resize()
  pieChart?.resize()
  lineChart?.resize()
}

const stopPolling = () => {
  isAutoPolling.value = false
  if (pollingTimer) {
    clearTimeout(pollingTimer)
    pollingTimer = null
  }
}

const triggerUpload = () => fileInput.value?.click()

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || []) as File[]
  if (files.length > 0) {
    imageQueue.value = files
    currentIndex.value = 0
    resultImage.value = ''
    currentDetectionSummary.value = ''
    ElMessage.success({ message: `系统已就绪，导入 ${files.length} 组巡检数据`, plain: true })
  }
}

const analyzeImage = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  const start = Date.now()
  loading.value = true

  try {
    const res = await reqAnalyzePersonImage<AnalysisData>(formData)
    const analysisData = res.data
    if (analysisData.status === 'success') {
      resultImage.value = normalizeResultImage(analysisData.image_base64 || '')
      analysisTime.value = readAnalysisTime(analysisData, Date.now() - start)
      currentCount.value = analysisData.count ?? 0
      currentModelVersion.value = analysisData.algorithm?.modelVersion || analysisData.modelVersion || ''
      currentDetectionSummary.value = formatDetectionSummary(analysisData)
      gaugeChart?.setOption({ series: [{ data: [{ value: analysisData.count ?? 0 }] }] })
      await loadLogList()
      await loadYoloSummary()
      ElMessage.success(`识别完成，检测到 ${analysisData.count ?? 0} 人`)
    } else {
      stopPolling()
      ElMessage.warning(analysisData?.message || '算法服务未返回有效识别结果')
    }
  } catch (err: unknown) {
    stopPolling()
    const message = getRequestErrorMessage(err)
    ElMessage.error(`识别失败：${message}`)
  } finally {
    loading.value = false
  }
}

const normalizeResultImage = (imageBase64: string) => {
  if (!imageBase64) return ''
  if (imageBase64.startsWith('data:image/')) return imageBase64
  return `data:image/jpeg;base64,${imageBase64}`
}

const readAnalysisTime = (analysisData: AnalysisData, fallbackMs: number) => {
  const value = analysisData.runtime?.costMs ?? fallbackMs
  return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallbackMs)
}

const formatDetectionSummary = (analysisData: AnalysisData) => {
  const detections = analysisData.detections || []
  const parts = [`目标框 ${detections.length}`]
  if (analysisData.frameIndex !== undefined) {
    parts.push(`帧 ${analysisData.frameIndex}`)
  }
  if (analysisData.capturedAt) {
    const capturedAt = new Date(analysisData.capturedAt)
    const timeText = Number.isNaN(capturedAt.getTime())
      ? analysisData.capturedAt
      : capturedAt.toLocaleTimeString()
    parts.push(timeText)
  }
  if (analysisData.requestId) {
    parts.push(`ID ${analysisData.requestId.slice(0, 8)}`)
  }
  return parts.join(' / ')
}

const toggleAutoPolling = () => {
  if (imageQueue.value.length === 0) return
  isAutoPolling.value = true
  runPollingTask()
}

const runPollingTask = async () => {
  if (!isAutoPolling.value) return

  if (currentIndex.value >= imageQueue.value.length) {
    stopPolling()
    ElMessage.success('巡检任务完成')
    return
  }

  await analyzeImage(imageQueue.value[currentIndex.value])
  currentIndex.value++
  pollingTimer = setTimeout(runPollingTask, 2500)
}

const resetTask = () => {
  stopPolling()
  imageQueue.value = []
  currentIndex.value = 0
  resultImage.value = ''
  currentCount.value = 0
  analysisTime.value = 0
  currentModelVersion.value = ''
  currentDetectionSummary.value = ''
  gaugeChart?.setOption({ series: [{ data: [{ value: 0 }] }] })
  loadYoloSummary()
  ElMessage.info('任务已重置')
}

onMounted(() => {
  updateTime()
  clockTimer = setInterval(updateTime, 1000)
  initCharts()
  loadLogList()
  loadYoloSummary()

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
  stopPolling()
  window.removeEventListener('resize', handleResize)
  gaugeChart?.dispose()
  pieChart?.dispose()
  lineChart?.dispose()
  gaugeChart = null
  pieChart = null
  lineChart = null
})
</script>

<style scoped>
.big-screen-container {
  min-height: 100vh;
  background: radial-gradient(ellipse at top, #07203f 0%, #020b1a 70%) no-repeat center;
  background-size: cover;
  color: #fff;
  padding: 0 20px 20px;
  overflow: hidden;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}

.screen-header {
  height: 80px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.header-bg-line {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f2fe, transparent);
}
.main-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 4px;
  background: linear-gradient(to bottom, #fff, #00f2fe);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 15px rgba(0, 242, 254, 0.5);
}
.sub-title-line {
  font-size: 10px;
  color: #3a5a85;
  text-align: center;
  letter-spacing: 1px;
}

.data-box {
  background: rgba(6, 30, 61, 0.8);
  border: 1px solid #1a3a61;
  padding: 15px;
  margin-bottom: 15px;
  position: relative;
  box-shadow: inset 0 0 15px rgba(0, 242, 254, 0.1);
}
.box-title {
  font-size: 14px;
  color: #00f2fe;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 242, 254, 0.2);
  padding-bottom: 8px;
}
.chart-container { height: 180px; }
.chart-container-small { height: 140px; }

.main-video-panel {
  border: 1px solid rgba(0, 242, 254, 0.5);
  padding: 5px;
}
.video-header {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
  background: rgba(0, 242, 254, 0.1);
  font-size: 12px;
  color: #00f2fe;
}
.demo-tag {
  background: rgba(230, 162, 60, 0.18);
  color: #e6a23c;
  border: 1px solid rgba(230, 162, 60, 0.35);
  padding: 0 5px;
  border-radius: 2px;
  margin-right: 5px;
  font-weight: bold;
}
.model-version {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #89f7ff;
}

.display-area {
  height: 540px;
  background: #000;
  position: relative;
  border: 1px solid #1a3a61;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.img-container {
  width: 100%;
  height: 100%;
  position: relative;
}
.main-img {
  width: 100%;
  height: 100%;
}

.corner-line {
  position: absolute;
  width: 15px;
  height: 15px;
  border: 2px solid #00f2fe;
}
.top-left { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
.top-right { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
.bottom-left { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
.bottom-right { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, #00f2fe, transparent);
  box-shadow: 0 0 8px #00f2fe;
  animation: scan 3s linear infinite;
  z-index: 10;
}
@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.upload-guide {
  text-align: center;
  color: #3a5a85;
  cursor: pointer;
}
.radar-circle {
  position: absolute;
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  margin: -75px 0 0 -75px;
  border: 1px solid #00f2fe;
  border-radius: 50%;
  animation: radar 2s infinite;
}
@keyframes radar {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
.guide-icon {
  font-size: 60px;
  margin-bottom: 10px;
  color: #1a3a61;
}

.metric-grid {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.metric-card {
  flex: 1;
  background: rgba(0, 242, 254, 0.05);
  padding: 10px;
  border-radius: 4px;
  text-align: center;
}
.m-label {
  font-size: 11px;
  color: #8492a6;
  margin-bottom: 5px;
}
.m-value {
  font-size: 22px;
  font-weight: bold;
}
.m-value span {
  font-size: 12px;
  margin-left: 4px;
  color: #fff;
}
.metric-source {
  margin-top: 8px;
  font-size: 11px;
  color: #8aa8c8;
  text-align: center;
}
.color-blue { color: #00f2fe; }
.color-green { color: #67c23a; }

.log-list-wrapper {
  height: 320px;
  overflow-y: auto;
  padding-right: 5px;
}
.log-item {
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 8px;
  padding: 10px;
  border-left: 3px solid #00f2fe;
  transition: all 0.3s;
}
.warning-log {
  border-left-color: #f56c6c;
  background: rgba(245, 108, 108, 0.05);
}
.log-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 11px;
}
.log-time { color: #8492a6; }
.log-content {
  font-size: 12px;
  color: #eee;
}
.delete-btn {
  color: #f56c6c;
  margin-left: 6px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #00f2fe;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
}
.is-active {
  background: #67c23a;
  box-shadow: 0 0 10px #67c23a;
  animation: blink 1s infinite;
}
@keyframes blink {
  50% { opacity: 0.3; }
}

.safety-days {
  font-size: 42px;
  color: #e6a23c;
  text-align: center;
  font-weight: bold;
  font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif;
}
.safety-days span {
  font-size: 14px;
  margin-left: 8px;
  color: #8492a6;
  font-weight: normal;
}

.control-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.queue-info {
  font-size: 12px;
  color: #8492a6;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb {
  background: #1a3a61;
  border-radius: 2px;
}
</style>
