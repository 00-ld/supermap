<template>
  <div class="home-content">
    <!-- 背景图片 -->
    <div class="background-image"></div>
    <!-- 核心数据卡片 -->
    <div class="card-group">
      <el-card
          v-for="stat in parkStats"
          :key="stat.title"
          :class="['stat-card', stat.cardClass]"
          hoverable
          @mouseenter="cardHover = true"
          @mouseleave="cardHover = false"
      >
        <div class="card-header">
          <span>{{ stat.title }}</span>
          <span class="source-badge" :class="stat.sourceClass">{{ stat.sourceLabel }}</span>
        </div>
        <div class="card-value">{{ stat.value }}</div>
        <div class="card-trend" :class="stat.trendTone">{{ stat.trend }}</div>
      </el-card>
    </div>

    <!-- 可视化图表区 -->
    <div class="chart-group">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="chart-header">
            <span>近7天预警类型分布</span>
            <el-icon
                class="refresh-icon"
                @click="refreshChart('alarm')"
                :class="{ rotating: isRefreshing.alarm }"
            >
              <Refresh />
            </el-icon>
          </div>
        </template>
        <div id="alarm-type-chart" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="chart-header">
            <span>园区VOCs浓度趋势（模拟，mg/m³）</span>
            <el-icon
                class="refresh-icon"
                @click="refreshChart('env')"
                :class="{ rotating: isRefreshing.env }"
            >
              <Refresh />
            </el-icon>
          </div>
        </template>
        <div id="env-trend-chart" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 快捷操作 + 公告区 -->
    <div class="shortcut-announce-group">
      <el-card class="shortcut-card" shadow="hover">
        <template #header>
          <div class="card-header-wrapper">
            <span class="card-title">快捷操作</span>
          </div>
        </template>
        <div class="shortcut-buttons">
          <el-button
              type="primary"
              class="shortcut-btn"
              @click="goToInspect()"
              :loading="shortcutLoading.inspect"
          >
            智巡监测
          </el-button>
          <el-button
              v-if="userStore.isAdmin"
              type="primary"
              class="shortcut-btn"
              @click="goToApproval()"
              :loading="shortcutLoading.approval"
          >
            人员管理
          </el-button>
          <el-button
              type="primary"
              class="shortcut-btn"
              @click="goToManage()"
              :loading="shortcutLoading.export"
          >
            实时预警
          </el-button>
          <el-button
              type="primary"
              class="shortcut-btn"
              @click="goToSetting()"
              :loading="shortcutLoading.setting"
          >
            实时监测
          </el-button>
          <el-button
              type="primary"
              class="shortcut-btn"
              @click="goToSmartMap()"
              :loading="shortcutLoading.map"
          >
            智慧地图
          </el-button>
        </div>
      </el-card>

      <el-card class="announce-card" shadow="hover">
        <!-- 核心修改：调整公告卡片头部布局 -->
        <template #header>
          <div class="card-header-wrapper">
            <span class="card-title">园区公告（示例）</span>
          </div>
        </template>
        <el-scrollbar height="200px" class="announce-list">
          <div
              class="announce-item"
              v-for="(item, index) in announceList"
              :key="index"
              @mouseenter="hoverIndex = index"
              @mouseleave="hoverIndex = -1"
              :class="{ 'announce-hover': hoverIndex === index }"
          >
            <span class="announce-time">{{ item.time }}</span>
            <span class="announce-content">{{ item.content }}</span>
          </div>
        </el-scrollbar>
      </el-card>
    </div>

    <!-- 数据更新提示 -->
    <div class="data-update-tip">
      <el-icon><Clock /></el-icon>
      展示刷新时间：{{ formatTime(new Date()) }}；监测点指标来自 monitoring/overview；企业、入园、VOCs趋势与公告为模拟/示例数据。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { Refresh, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { reqMonitoringOverview } from '@/api/monitoringData'
import type { MonitoringOverview } from '@/api/monitoringData'
import { reqWarningHistoryList } from '@/api/warningHistory'
import type { WarningHistoryRecord } from '@/api/warningHistory'
import useUserStore from '@/store/modules/user'

// 初始化路由
const router = useRouter()
const userStore = useUserStore()

// 定义类型
type RefreshType = 'alarm' | 'env'
type ShortcutType = 'inspect' | 'approval' | 'export' | 'setting' | 'map'
type StatTrendTone = 'positive' | 'negative' | 'neutral'

interface ParkStatCard {
  title: string
  value: string | number
  trend: string
  trendTone: StatTrendTone
  sourceLabel: string
  sourceClass: string
  cardClass: string
}

type HistoryItem = WarningHistoryRecord

// 定义公告接口类型
interface AnnounceItem {
  time: string
  content: string
}

const GAS_TYPE_ORDER = ['CO', 'O2', 'NH3', 'CH4']
const GAS_TYPE_LABELS: Record<string, string> = {
  CO: 'CO',
  O2: 'O2',
  NH3: 'NH3',
  CH4: 'CH4',
}

const SIMULATED_PARK_STATS: Omit<ParkStatCard, 'sourceLabel' | 'sourceClass'>[] = [
  { title: '园区企业总数', value: 38, trend: '+2 本周', trendTone: 'positive', cardClass: 'normal-card' },
  { title: '今日入园人员', value: 247, trend: '+18 昨日', trendTone: 'positive', cardClass: 'normal-card' },
  { title: '今日入园车辆', value: 89, trend: '-5 昨日', trendTone: 'negative', cardClass: 'normal-card' },
]

const SIMULATED_ENV_TREND = {
  dates: ['3/4', '3/5', '3/6', '3/7', '3/8', '3/9', '3/10'],
  values: [15.2, 14.8, 16.5, 18.3, 17.1, 19.2, 20.5],
}

const normalizeGasType = (gasType: string | null | undefined) => {
  const raw = String(gasType || '').trim().toUpperCase()
  if (!raw) return ''
  if (raw.includes('CO') || raw.includes('一氧化碳')) return 'CO'
  if (raw.includes('O2') || raw.includes('O₂') || raw.includes('氧气')) return 'O2'
  if (raw.includes('NH3') || raw.includes('NH₃') || raw.includes('氨')) return 'NH3'
  if (raw.includes('CH4') || raw.includes('CH₄') || raw.includes('甲烷') || raw.includes('可燃')) return 'CH4'
  return ''
}

// 响应式变量
const cardHover = ref(false)
const hoverIndex = ref(-1)
const isRefreshing = ref<Record<RefreshType, boolean>>({
  alarm: false,
  env: false,
})
const shortcutLoading = ref<Record<ShortcutType, boolean>>({
  inspect: false,
  approval: false,
  export: false,
  setting: false,
  map: false,
})
// 预警历史数据（经 warningHistory API 层获取，对应 warning_history 表）
const historyList = ref<HistoryItem[]>([])
const monitoringOverview = ref<MonitoringOverview | null>(null)

const parkStats = computed<ParkStatCard[]>(() => [
  ...SIMULATED_PARK_STATS.map((stat) => ({
    ...stat,
    sourceLabel: '模拟',
    sourceClass: 'source-simulated',
  })),
  {
    title: '监测点总数',
    value: monitoringOverview.value?.environment?.sensorCount ?? '--',
    trend: monitoringOverview.value ? 'monitoring/overview' : '待加载',
    trendTone: 'neutral',
    sourceLabel: '监测概览',
    sourceClass: 'source-overview',
    cardClass: 'normal-card',
  },
  {
    title: '在线监测点',
    value: monitoringOverview.value?.environment?.onlineSensorCount ?? '--',
    trend: monitoringOverview.value
      ? `风险均值 ${Number(monitoringOverview.value.environment.averageRisk || 0).toFixed(2)}`
      : '待加载',
    trendTone: 'neutral',
    sourceLabel: '监测概览',
    sourceClass: 'source-overview',
    cardClass: 'normal-card',
  },
  {
    title: '待处理预警',
    value: historyList.value.length,
    trend: 'warning_history',
    trendTone: 'neutral',
    sourceLabel: '历史表',
    sourceClass: 'source-history',
    cardClass: 'warning-card',
  },
])

// 示例公告列表：当前没有后端公告接口，页面必须明确不能冒充真实公告。
const announceList = ref<AnnounceItem[]>([
  {
    time: '2026-03-09',
    content: '关于园区3月10日南区设备例行检修的通知',
  },
  {
    time: '2026-03-08',
    content: '园区安全培训安排：3月15日上午9点，综合楼2楼会议室',
  },
  {
    time: '2026-03-07',
    content: '紧急通知：近期雷雨天气，各企业做好防雷防静电检查',
  },
  {
    time: '2026-03-06',
    content: '园区VOCs模拟趋势看板完成演示数据更新',
  },
  {
    time: '2026-03-05',
    content: '关于开展2026年第一季度安全隐患排查的通知',
  },
])

let alarmTypeChart: echarts.ECharts | null = null
let envTrendChart: echarts.ECharts | null = null

// 格式化时间
const formatTime = (timeStr: string | Date) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString()
}

const fetchHistory = async () => {
  try {
    const res = await reqWarningHistoryList()
    if (res.code === 200) {
      historyList.value = res.data.sort((a: HistoryItem, b: HistoryItem) =>
          new Date(b.warningTime).getTime() - new Date(a.warningTime).getTime()
      )
      updateAlarmChart()
    }
  } catch (error) {
    console.error('获取历史数据失败：', error)
    ElMessage.error('网络异常，无法加载历史数据')
  }
}

const fetchMonitoringOverview = async () => {
  try {
    const res = await reqMonitoringOverview()
    if (res.code === 200) {
      monitoringOverview.value = res.data
    }
  } catch (error) {
    console.error('获取监测概览失败：', error)
    monitoringOverview.value = null
  }
}

// 页面跳转函数 - 快捷操作
const goToInspect = () => {
  shortcutLoading.value.inspect = true
  setTimeout(() => {
    shortcutLoading.value.inspect = false
    router.push({ name: 'CarInspectionHome' })
    ElMessage.success('进入智巡监测页面')
  }, 800)
}

const goToApproval = () => {
  shortcutLoading.value.approval = true
  setTimeout(() => {
    shortcutLoading.value.approval = false
    router.push({ name: 'PersonApproval' })
    ElMessage.success('进入人员管理页面')
  }, 800)
}

const goToManage = () => {
  shortcutLoading.value.export = true
  setTimeout(() => {
    shortcutLoading.value.export = false
    router.push({ name: 'monitor_history' })
    ElMessage.success('进入实时预警页面')
  }, 800)
}

const goToSetting = () => {
  shortcutLoading.value.setting = true
  setTimeout(() => {
    shortcutLoading.value.setting = false
    router.push({ path: '/monitor' })
    ElMessage.success('进入实时监测页面')
  }, 800)
}

const goToSmartMap = () => {
  shortcutLoading.value.map = true
  setTimeout(() => {
    shortcutLoading.value.map = false
    router.push({ path: '/smart-map', query: { source: 'home-shortcut' } })
    ElMessage.success('进入智慧地图页面')
  }, 800)
}

// 刷新图表
const refreshChart = (type: RefreshType) => {
  isRefreshing.value[type] = true

  if (type === 'alarm' && alarmTypeChart) {
    initAlarmTypeChart()
    updateAlarmChart()
  } else if (type === 'env' && envTrendChart) {
    envTrendChart.clear()
    initEnvTrendChart()
  }

  setTimeout(() => {
    isRefreshing.value[type] = false
    ElMessage.success(
        `已刷新${type === 'alarm' ? '预警类型分布' : 'VOCs浓度趋势'}图表`,
    )
  }, 1000)
}

// 初始化预警类型图表
const initAlarmTypeChart = () => {
  const chartDom = document.getElementById('alarm-type-chart')
  if (chartDom) {
    if(!alarmTypeChart) {
      alarmTypeChart = echarts.init(chartDom)
    }

    const data = historyList.value
    const countMap: Record<string, number> = {}
    data.forEach(item => {
      const gasType = normalizeGasType(item.gasType)
      if (!gasType) return
      countMap[gasType] = (countMap[gasType] || 0) + 1
    })

    const seriesData = GAS_TYPE_ORDER
        .filter((gasType) => countMap[gasType] > 0)
        .map((gasType) => ({ name: GAS_TYPE_LABELS[gasType], value: countMap[gasType] }))
    const finalData = seriesData.length ? seriesData : [{ name: '暂无数据', value: 1 }]

    const alarmOption: EChartsOption = {
      tooltip: { trigger: 'item', transitionDuration: 0.3 },
      legend: {
        orient: 'vertical',
        left: 'left',
        textStyle: { fontSize: 12, color: '#a0cfff' },
      },
      series: [
        {
          name: '预警类型',
          type: 'pie',
          radius: ['40%', '70%'],
          data: finalData,
          label: { fontSize: 12, color: '#e5eaf3' },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
        },
      ],
    }
    alarmTypeChart.setOption(alarmOption)
  }
}

// 更新饼图
const updateAlarmChart = () => {
  initAlarmTypeChart()
}

// 初始化环境趋势图表
const initEnvTrendChart = () => {
  const chartDom = document.getElementById('env-trend-chart')
  if (chartDom) {
    envTrendChart = echarts.init(chartDom)
    const envOption: EChartsOption = {
      tooltip: { trigger: 'axis', transitionDuration: 0.3 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: SIMULATED_ENV_TREND.dates,
        axisLabel: { color: '#a0cfff' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#a0cfff' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
      },
      series: [
        {
          name: '模拟VOCs浓度',
          type: 'line',
          data: SIMULATED_ENV_TREND.values,
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' },
            ],
          },
          markLine: {
            data: [{ type: 'average', name: '平均值' }],
          },
          smooth: true,
          lineStyle: { width: 3 },
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#67C23A' },
            ]),
          },
          animationDuration: 1500,
          animationEasing: 'cubicOut',
        },
      ],
    }
    envTrendChart.setOption(envOption)
  }
}

// 具名 resize 处理器，便于卸载时移除监听，避免内存泄漏。
const handleResize = () => {
  alarmTypeChart?.resize()
  envTrendChart?.resize()
}

// 初始化
onMounted(() => {
  fetchHistory()
  fetchMonitoringOverview()
  initAlarmTypeChart()
  initEnvTrendChart()

  window.addEventListener('resize', handleResize)
})

// 卸载时移除监听并销毁图表实例，防止双重泄漏。
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  alarmTypeChart?.dispose()
  alarmTypeChart = null
  envTrendChart?.dispose()
  envTrendChart = null
})
</script>
<style scoped>
.home-content {
  padding: 32px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.home-content > * {
  margin-bottom: 24px;
}

.home-content > *:last-child {
  margin-bottom: 0;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/background2.jpg') center/cover no-repeat;
  filter: blur(8px);
  z-index: 0;
  opacity: 0.3;
}

.home-content > * {
  position: relative;
  z-index: 1;
}

/* 核心卡片样式 - 强制6个永远一排，不换行，任何屏幕都适用 */
.card-group {
  display: flex;
  flex-wrap: nowrap;        /* 强制不换行 */
  gap: 16px;                /* 卡片间距 */
  margin-bottom: 30px;
  width: 100%;
  overflow-x: hidden;       /* 隐藏滚动条，保持美观 */
}

/* 每个卡片自动均分宽度，6个永远一排 */
.stat-card {
  flex: 1;                  /* 自动等分宽度 */
  min-width: 0;             /* 禁止挤压变形 */
  background: rgba(16, 25, 43, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #409eff, #67c23a, #409eff);
  animation: gradientFlow 3s ease-in-out infinite;
}

.stat-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.3);
  border-color: #409eff;
}

.stat-card.normal-card {
  background: linear-gradient(135deg, rgba(16, 25, 43, 0.8), rgba(20, 35, 60, 0.6));
}

.stat-card.warning-card {
  background: linear-gradient(135deg, rgba(16, 25, 43, 0.8), rgba(60, 20, 20, 0.6));
}

.card-header {
  font-size: 14px;
  color: #a0cfff;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.source-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 16px;
  font-weight: 600;
}

.source-simulated {
  color: #e6a23c;
  background: rgba(230, 162, 60, 0.12);
  border: 1px solid rgba(230, 162, 60, 0.28);
}

.source-history {
  color: #409eff;
  background: rgba(64, 158, 255, 0.12);
  border: 1px solid rgba(64, 158, 255, 0.28);
}

.source-overview {
  color: #67c23a;
  background: rgba(103, 194, 58, 0.12);
  border: 1px solid rgba(103, 194, 58, 0.28);
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
}

.card-trend {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-block;
}

.card-trend.positive {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
  border: 1px solid rgba(103, 194, 58, 0.2);
}

.card-trend.negative {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.2);
}

.card-trend.neutral {
  color: #a0cfff;
  background-color: rgba(64, 158, 255, 0.1);
  border: 1px solid rgba(64, 158, 255, 0.2);
}

/* 图表区域样式 */
.chart-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: rgba(16, 25, 43, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
      linear-gradient(rgba(64, 158, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(64, 158, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

.chart-card > * {
  position: relative;
  z-index: 1;
}

.chart-header {
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: #fff;
}

.refresh-icon {
  cursor: pointer;
  color: #409eff;
  transition: all 0.3s ease;
  font-size: 16px;
}

.refresh-icon:hover {
  transform: rotate(90deg);
  color: #67c23a;
}

.refresh-icon.rotating {
  animation: rotate 1s linear infinite;
}

.chart-container {
  width: 100%;
  height: 240px;
  transition: opacity 0.5s ease;
}

.chart-container:hover {
  opacity: 0.95;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 预警历史表格样式已移除，保留空缺占位防报错 */
/* 核心新增样式：卡片头部通用布局 */
.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 8px;
}

.card-title {
  font-weight: 600;
  color: #fff;
  font-size: 16px;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.shortcut-announce-group {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.shortcut-card,
.announce-card {
  background: rgba(16, 25, 43, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(64, 158, 255, 0.2);
  display: flex;
  flex-direction: column;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.shortcut-card::before,
.announce-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
      linear-gradient(rgba(64, 158, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(64, 158, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

.shortcut-card > *,
.announce-card > * {
  position: relative;
  z-index: 1;
}

.shortcut-header,
.announce-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #a0cfff;
  font-size: 16px;
}

.shortcut-buttons {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: center;
  align-content: center;
}

.shortcut-btn {
  flex: 1 1 160px;
  max-width: 180px;
  height: 60px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.2), rgba(10, 92, 173, 0.2));
  color: #40e0d0;
  border: 1px solid rgba(64, 224, 208, 0.3);
  font-size: 15px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 1px;
  box-sizing: border-box;
}

.shortcut-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(64, 224, 208, 0.3);
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.4), rgba(10, 92, 173, 0.4));
  color: #fff;
  border-color: rgba(64, 224, 208, 0.6);
}

.shortcut-btn:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.15);
}

.shortcut-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
  );
  transition: left 0.5s ease;
}

.shortcut-btn:hover::after {
  left: 100%;
}

/* 公告列表样式 */
.announce-list {
  flex: 1;
  overflow: auto;
  padding-right: 10px;
}

.announce-item {
  display: flex;
  margin-bottom: 10px;
  padding: 8px 10px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.3s ease;
  position: relative;
  color: #e5eaf3;
}

.announce-item.announce-hover {
  background-color: rgba(64, 158, 255, 0.1);
  transform: translateX(5px);
  border-bottom-color: #409eff;
}

.announce-time {
  width: 80px;
  color: #999;
  margin-right: 10px;
  flex-shrink: 0;
  font-weight: 500;
}

.announce-content {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
}

.announce-hover .announce-content {
  color: #409eff;
  font-weight: 500;
}

/* 数据更新提示 */
.data-update-tip {
  font-size: 12px;
  color: #a0cfff;
  text-align: right;
  margin-top: 10px;
  padding: 8px 15px;
  background-color: rgba(16, 25, 43, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}

.picture {
  img {
    width: 100%;
    height: 100%;
  }
}

/* Detail polish */
.home-content {
  padding: clamp(18px, 2.4vw, 32px);
  overflow: visible;
  isolation: isolate;
}

.background-image {
  filter: blur(10px) brightness(0.52) saturate(1.08);
  opacity: 0.58;
  transform: scale(1.04);
}

.background-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(4, 13, 28, 0.86), rgba(5, 30, 34, 0.74)),
    radial-gradient(circle at 82% 8%, rgba(230, 162, 60, 0.16), transparent 34%);
}

.card-group {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  overflow: visible;
}

.stat-card,
.chart-card,
.shortcut-card,
.announce-card,
.data-update-tip {
  border-radius: 8px;
  border-color: rgba(120, 211, 214, 0.2);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.stat-card {
  min-height: 132px;
  padding: 18px 14px;
  background:
    linear-gradient(160deg, rgba(9, 25, 45, 0.88), rgba(9, 35, 43, 0.68)),
    rgba(9, 25, 45, 0.8);
}

.stat-card::before {
  height: 3px;
  background: linear-gradient(90deg, #40e0d0, #e6a23c, #409eff);
  background-size: 180% 100%;
}

.stat-card::after {
  width: 48px;
  height: 48px;
  background: radial-gradient(circle, rgba(230, 162, 60, 0.18) 0%, transparent 72%);
}

.stat-card:hover,
.chart-card:hover,
.shortcut-card:hover,
.announce-card:hover {
  transform: translateY(-3px);
  border-color: rgba(120, 211, 214, 0.42);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.36);
}

.card-header {
  color: rgba(217, 232, 240, 0.78);
  font-size: 13px;
}

.card-value {
  font-size: clamp(22px, 1.8vw, 30px);
  font-weight: 750;
  text-shadow: 0 0 14px rgba(64, 224, 208, 0.32);
}

.card-trend {
  border-radius: 999px;
  padding: 4px 10px;
}

.chart-group {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.chart-card,
.shortcut-card,
.announce-card {
  background:
    linear-gradient(160deg, rgba(9, 25, 45, 0.84), rgba(8, 32, 40, 0.72)),
    rgba(9, 25, 45, 0.74);
}

.chart-card::before,
.shortcut-card::before,
.announce-card::before {
  opacity: 0.62;
}

.chart-header,
.card-title {
  color: #eef7fb;
  letter-spacing: 0;
}

.refresh-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(64, 224, 208, 0.08);
}

.shortcut-buttons {
  justify-content: flex-start;
  gap: 14px;
}

.shortcut-btn {
  max-width: none;
  height: 52px;
  border-radius: 8px;
  letter-spacing: 0;
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.22), rgba(230, 162, 60, 0.12));
}

.announce-item {
  min-height: 40px;
  align-items: center;
  border-radius: 8px;
}

.announce-time {
  color: rgba(205, 218, 226, 0.62);
}

.data-update-tip {
  width: fit-content;
  margin-left: auto;
  padding: 10px 14px;
}

@media (max-width: 1560px) {
  .card-group {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .card-group,
  .chart-group,
  .shortcut-announce-group {
    grid-template-columns: 1fr;
  }

  .shortcut-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .shortcut-btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .home-content {
    padding: 14px;
  }

  .card-group {
    grid-template-columns: 1fr;
  }

  .shortcut-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
