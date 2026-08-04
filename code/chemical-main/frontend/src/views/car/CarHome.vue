<template>
  <div class="home-container">
    <!-- 背景图片 -->
    <div class="background-image"></div>

    <el-tabs v-model="activeTab" class="integrated-tabs" @tab-click="handleTabClick">
      <!-- ========== Tab 1: 小车总览 ========== -->
      <el-tab-pane label="小车总览" name="overview">
        <!-- 横向导航栏 -->
        <nav class="nav-bar">
          <ul>
            <li @click="goToHome" :class="{ active: $route.name === 'CarInspectionHome' }">小车总览</li>
            <li
              v-for="car in carList"
              :key="car.id"
              @click="goToCarDetail(car.id)"
              :class="{ active: $route.name === 'CarDetail' && $route.params.id === car.id.toString() }"
            >
              小车 {{ car.id }}
              <span v-if="getCarStatus(car.id) === 'warning'" class="warning-dot"></span>
            </li>
          </ul>
        </nav>

        <div class="content">
          <!-- 左侧气体浓度曲线 -->
          <div class="chart-group left-charts">
            <div class="chart-item" v-for="i in [1,2]" :key="`left-${i}`">
              <div class="chart-header">
                <span class="gas-type">{{ carGasMap[i] }}</span>
                <span class="car-badge" :class="getCarStatus(i)">
                  {{ getCarStatus(i) === 'normal' ? '正常' : '异常' }}
                </span>
              </div>
              <div class="chart" :id="`chart-${i}`"></div>
            </div>
          </div>

          <!-- 中间厂区二维地图 -->
          <div class="map-container">
            <h3>厂区二维地图</h3>
            <div class="map" ref="mapContainer">
              <img
                src="/maps/real-park-dom.jpg"
                alt="厂区地图"
                class="map-img"
                @error="handleImgError"
                @load="onMapImgLoad"
              />
              <div class="markers-container">
                <div
                  v-for="car in carList"
                  :key="`marker-${car.id}`"
                  class="car-marker"
                  :class="getCarStatus(car.id)"
                  :style="getMarkerStyle(car)"
                  @click="goToCarDetail(car.id)"
                >
                  <span class="car-id">{{ car.id }}</span>
                  <span class="car-status">{{ getCarStatus(car.id) === 'normal' ? '正常' : '异常' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧气体浓度曲线 -->
          <div class="chart-group right-charts">
            <div class="chart-item" v-for="i in [3,4]" :key="`right-${i}`">
              <div class="chart-header">
                <span class="gas-type">{{ carGasMap[i] }}</span>
                <span class="car-badge" :class="getCarStatus(i)">
                  {{ getCarStatus(i) === 'normal' ? '正常' : '异常' }}
                </span>
              </div>
              <div class="chart" :id="`chart-${i}`"></div>
            </div>
          </div>
        </div>

        <!-- 预警模拟操作区 -->
        <div class="simulate-section">
          <h3 class="simulate-title">小车预警模拟操作台</h3>
          <div class="card-list">
            <div
              v-for="car in carStore.carList"
              :key="car.id"
              class="sim-card"
              :class="car.status"
            >
              <div class="card-header">
                <h4>小车 {{ car.id }}</h4>
                <span class="badge" :class="car.status">
                  {{ car.status === 'normal' ? '正常' : '异常' }}
                </span>
              </div>
              <div class="card-body">
                <p><span class="label">检测气体：</span>{{ gasType[car.id] }}</p>
                <p><span class="label">当前位置：</span>X: {{ car.x }} / Y: {{ car.y }}</p>
              </div>
              <div class="card-footer">
                <button
                  class="sim-btn warning-btn"
                  @click="handleWarningClick(car.id)"
                  :disabled="!userStore.isAdmin || car.status === 'warning'"
                >
                  预警
                </button>
                <button
                  class="sim-btn reset-btn"
                  @click="handleResetCar(car.id)"
                  :disabled="!userStore.isAdmin || car.status === 'normal'"
                >
                  重置状态
                </button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ========== Tab 2: 实时预警 ========== -->
      <el-tab-pane label="实时预警" name="alerts">
        <div class="tab-content">
          <el-card class="tab-card" shadow="hover">
            <template #header>
              <div class="card-header-wrapper">
                <span class="card-title-text">
                  <el-icon><Clock /></el-icon>
                  预警历史记录
                </span>
              </div>
            </template>
            <el-table
              :data="warningHistory"
              border
              stripe
              :header-cell-style="{background: '#f5f7fa', color: '#303133', fontWeight: '600'}"
              class="warning-table"
              max-height="400"
            >
              <el-table-column prop="carId" label="小车编号" align="center" width="120" />
              <el-table-column prop="areaName" label="所属区域" align="center" width="120" />
              <el-table-column prop="gasType" label="气体类型" align="center" width="100">
                <template #default="scope">
                  <el-tag size="small" :type="scope.row.gasType === 'ch4' ? 'danger' : 'warning'">
                    {{ scope.row.gasType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="gasValue" label="浓度值" align="center" width="120" />
              <el-table-column prop="warningTime" label="预警时间" align="center" width="180">
                <template #default="scope">
                  {{ formatWarningTime(scope.row.warningTime) }}
                </template>
              </el-table-column>
              <el-table-column label="智巡建议" align="center" min-width="220">
                <template #default="scope">
                  <template v-if="scope.row.id && aiAdviceByAlertId[scope.row.id]">
                    <el-tag size="small" :type="aiAdviceByAlertId[scope.row.id].source === 'QWEN' ? 'success' : 'warning'">
                      {{ aiAdviceByAlertId[scope.row.id].source === 'QWEN' ? '千问' : '规则兜底' }} · {{ aiAdviceByAlertId[scope.row.id].reviewStatus }}
                    </el-tag>
                  </template>
                  <el-button
                    v-if="scope.row.id"
                    size="small"
                    type="primary"
                    :loading="generatingAdviceId === scope.row.id"
                    @click="generateAdviceForAlert(scope.row.id)"
                  >
                    {{ aiAdviceByAlertId[scope.row.id] ? '重新生成' : '生成建议' }}
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="关联操作" align="center" width="200">
                <template #default="scope">
                  <el-button size="small" type="primary" @click="goToCarDetail(scope.row.carId)">
                    查看小车
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card class="tab-card" shadow="hover">
            <template #header>
              <span class="card-title-text">
                <el-icon><DataLine /></el-icon>
                各区域泄漏次数统计
              </span>
            </template>
            <div ref="alertsChartRef" class="chart-box"></div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ========== Tab 3: 智慧地图 ========== -->
      <el-tab-pane label="智慧地图" name="smartmap">
        <div class="tab-content map-tab">
          <el-card class="tab-card" shadow="hover">
            <template #header>
              <span class="card-title-text">
                <el-icon><MapLocation /></el-icon>
                厂区智慧地图
              </span>
            </template>
            <div class="map-tab-body">
              <div class="map-preview">
                <img
                  src="/maps/real-park-dom.jpg"
                  alt="厂区地图预览"
                  class="map-preview-img"
                  @click="goToSmartMap"
                />
                <!-- 在预览图上叠加小车点位 -->
                <div class="preview-markers">
                  <div
                    v-for="car in carList"
                    :key="`pv-${car.id}`"
                    class="pv-marker"
                    :class="getCarStatus(car.id)"
                    :style="{ left: `${(car.x / REAL_MAP_WIDTH) * 100}%`, top: `${(car.y / REAL_MAP_HEIGHT) * 100}%` }"
                  >
                    {{ car.id }}
                  </div>
                </div>
              </div>
              <div class="map-info">
                <h4>智慧地图平台</h4>
                <p>集成 GIS 地理信息、实时气体扩散模型、设施定位与巡检路径规划</p>
                <el-button type="primary" size="large" @click="goToSmartMap" class="action-btn">
                  <el-icon><View /></el-icon>
                  打开完整智慧地图
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- ========== Tab 4: 厂区图像巡检 ========== -->
      <el-tab-pane label="厂区图像巡检" name="yolo">
        <div class="tab-content yolo-tab">
          <el-card class="tab-card" shadow="hover">
            <template #header>
              <span class="card-title-text">
                <el-icon><Monitor /></el-icon>
                自动化图像巡检指挥中心
              </span>
            </template>
            <div class="yolo-summary">
              <div class="yolo-metrics">
                <div class="metric-box">
                  <div class="metric-value color-blue">{{ yoloMetrics.currentCount ?? '—' }}</div>
                  <div class="metric-label">当前识别人员</div>
                </div>
                <div class="metric-box">
                  <div class="metric-value color-green">
                    <template v-if="yoloMetrics.analysisTime != null">{{ yoloMetrics.analysisTime }}<small>ms</small></template>
                    <template v-else>—</template>
                  </div>
                  <div class="metric-label">识别耗时</div>
                </div>
                <div class="metric-box">
                  <div class="metric-value color-orange">{{ yoloMetrics.riskCount }}</div>
                  <div class="metric-label">告警数</div>
                </div>
                <div class="metric-box">
                  <div class="metric-value color-purple">{{ yoloMetrics.onlineDevices }}</div>
                  <div class="metric-label">在线设备</div>
                </div>
              </div>
              <div class="yolo-action">
                <input
                  ref="carYoloFileInput"
                  type="file"
                  accept="image/jpeg,image/png"
                  style="display: none"
                  @change="handleCarYoloFileChange"
                />
                <el-button
                  type="success"
                  size="large"
                  :loading="carYoloUploading"
                  :disabled="!userStore.isAdmin"
                  @click="triggerCarYoloUpload"
                  class="action-btn"
                >
                  <el-icon><UploadFilled /></el-icon>
                  导入图片识别
                </el-button>
                <el-button type="primary" size="large" @click="goToYoloMonitor" class="action-btn">
                  <el-icon><FullScreen /></el-icon>
                进入图像巡检
                </el-button>
              </div>
              <div v-if="carYoloResult" class="car-yolo-result">
                <img
                  v-if="carYoloResult.imageBase64"
                  :src="normalizeYoloImage(carYoloResult.imageBase64)"
                  alt="小车巡检识别结果"
                  class="car-yolo-result-img"
                />
                <div class="car-yolo-result-meta">
                  <span>最近识别：{{ carYoloResult.count }} 人</span>
                  <span>目标框：{{ carYoloResult.detections.length }} 个</span>
                  <span v-if="carYoloResult.frameIndex !== undefined">帧编号：{{ carYoloResult.frameIndex }}</span>
                  <span v-if="carYoloResult.capturedAt">拍摄时间：{{ formatYoloCapturedAt(carYoloResult.capturedAt) }}</span>
                  <span>耗时：{{ carYoloResult.analysisTime }}ms</span>
                  <span v-if="carYoloResult.requestId">追踪：{{ carYoloResult.requestId }}</span>
                  <span v-if="carYoloResult.modelVersion">模型：{{ carYoloResult.modelVersion }}</span>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="tab-card" shadow="hover">
            <template #header>
              <span class="card-title-text">
                <el-icon><VideoCamera /></el-icon>
                视频源未绑定
              </span>
            </template>
            <div class="video-grid">
              <div v-for="i in 4" :key="i" class="video-item-wrapper">
                <div class="video-box">
                  <img
                    src="/gas_video/novideo.png"
                    alt="视频源未绑定占位"
                    class="video-placeholder-img"
                  />
                </div>
                <div class="video-label">{{ carGasMap[i] }}</div>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 预警操作弹窗 -->
    <div v-if="showWarningDialog" class="dialog-overlay" @click.self="closeWarningDialog">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3>⚠️ 预警操作 - 小车 {{ selectedCarId }}</h3>
          <button class="dialog-close" @click="closeWarningDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="car-info">
            <p><span class="info-label">检测气体：</span>{{ gasType[selectedCarIndex] }}</p>
            <p><span class="info-label">当前位置：</span>X: {{ getCarPosition(selectedCarIndex).x }} / Y: {{ getCarPosition(selectedCarIndex).y }}</p>
          </div>
          <div class="dialog-actions">
            <button class="action-btn quick-mark" :disabled="!userStore.isAdmin" @click="handleQuickMark">
              <div class="action-icon">🚨</div>
              <div class="action-text">
                <div class="action-title">快速标记</div>
                <div class="action-desc">仅设置预警状态</div>
              </div>
            </button>
            <button class="action-btn simulate-diffusion" @click="handleSimulateDiffusion">
              <div class="action-icon">💨</div>
              <div class="action-text">
                <div class="action-title">模拟扩散</div>
                <div class="action-desc">打开扩散模拟页面</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import type { CSSProperties } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCarStore } from '@/store/carStore'
import * as echarts from 'echarts'
import { Clock, DataLine, MapLocation, View, Monitor, FullScreen, VideoCamera, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { CAR_GAS_CHART_NAME, CAR_GAS_NAV_LABEL, getCarGasSpec } from '@/data/gasCatalog'
import { reqYoloSummary } from '@/api/yoloSummary'
import { reqMonitoringOverview } from '@/api/monitoringData'
import { reqWarningHistoryList } from '@/api/warningHistory'
import { reqGenerateAiAdvice, type AiAdviceRecord } from '@/api/aiDecision'
import { reqAnalyzePersonImage } from '@/api/analysis'
import type { ConcentrationTrendPoint } from '@/api/monitoringData'
import type { WarningHistoryRecord } from '@/api/warningHistory'
import type { YoloAnalysisData, YoloDetection } from '@/api/analysis'
import useUserStore from '@/store/modules/user'

interface CarItem {
  id: number
  x: number
  y: number
}

type WarningHistoryItem = WarningHistoryRecord

interface YoloMetrics {
  currentCount: number | null
  analysisTime: number | null
  riskCount: number
  onlineDevices: number
}

type YoloAnalysisResult = YoloAnalysisData

interface CarYoloResult {
  count: number
  analysisTime: number
  imageBase64?: string
  detections: YoloDetection[]
  frameIndex?: number
  capturedAt?: string
  requestId?: string
  modelVersion?: string
}

type DisposableChart = Pick<echarts.ECharts, 'dispose'>

const router = useRouter()
const route = useRoute()
const carStore = useCarStore()
const userStore = useUserStore()

// ========== 通用 ==========
const activeTab = ref('overview')
const REAL_MAP_WIDTH = 1587.2
const REAL_MAP_HEIGHT = 947.2
const INSPECTION_CAR_POSITIONS: Record<number, { x: number; y: number }> = {
  // 坐标基于真实 DOM 二维地图米制边界，分别覆盖储罐泵区、反应装置区、塔器公用工程区和东南应急装卸区。
  1: { x: 450, y: 565 },
  2: { x: 690, y: 500 },
  3: { x: 925, y: 430 },
  4: { x: 1125, y: 610 }
}

const toFiniteCoordinate = (value: unknown): number | null => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

const carList = computed<CarItem[]>(() =>
  carStore.carList.map((car) => {
    const x = toFiniteCoordinate(car.x)
    const y = toFiniteCoordinate(car.y)
    if (x !== null && y !== null) {
      return { ...car, x, y }
    }

    const fallback = INSPECTION_CAR_POSITIONS[car.id]
    return fallback ? { ...car, ...fallback } : car
  }),
)

const mapContainer = ref<HTMLElement | null>(null)
const mapImgLoaded = ref(false)
// 气体名称映射统一引用 data/gasCatalog 单一数据源。
const carGasMap = CAR_GAS_CHART_NAME
const chartInstances = ref<DisposableChart[]>([])
const monitoringTrend = ref<ConcentrationTrendPoint[]>([])

const showWarningDialog = ref(false)
const selectedCarId = ref<number | null>(null)
const selectedCarIndex = computed(() => selectedCarId.value ?? 0)

const gasType = CAR_GAS_NAV_LABEL

// ========== Tab 切换处理 ==========
const handleTabClick = () => {
  if (activeTab.value === 'overview') {
    nextTick(() => initCharts())
  } else if (activeTab.value === 'alerts') {
    nextTick(() => renderAlertsChart())
  } else if (activeTab.value === 'yolo') {
    fetchYoloSummary()
  }
}

// ========== 导航函数（小车总览） ==========
const goToHome = () => {
  router.push('/car/home').catch(err => {
    if (!err.message.includes('Avoided redundant navigation')) {
      console.error('跳转失败:', err)
    }
  })
}

const goToCarDetail = (id: number | string) => {
  router.push({
    path: `/car/${id}`,
    query: { t: new Date().getTime() }
  }).catch(err => {
    if (!err.message.includes('Avoided redundant navigation')) {
      console.error('跳转失败:', err)
    }
  })
}

// ========== 导航函数（智慧地图 / 厂区图像巡检） ==========
const goToSmartMap = () => {
  router.push('/smart-map')
}

const goToYoloMonitor = () => {
  router.push('/yolo')
}

// ========== 真实二维地图加载状态 ==========
const handleImgError = (e: Event) => {
  mapImgLoaded.value = false
  ;(e.target as HTMLElement | null)?.style.setProperty('display', 'none')
  ElMessage.error('真实二维地图加载失败，请检查 /maps/real-park-dom.jpg')
}

const onMapImgLoad = () => {
  mapImgLoaded.value = true
  nextTick(() => {
    initCharts()
  })
}

// ========== 小车状态 ==========
const getCarStatus = (carId: number) => {
  return carStore.getCarStatus(carId)
}

const getCarPosition = (id: number) => {
  const car = carList.value.find(c => c.id === id)
  return car ? { x: car.x, y: car.y } : { x: 0, y: 0 }
}

const getMarkerStyle = computed(() => (car: CarItem): CSSProperties => {
  return {
    position: 'absolute' as const,
    top: `${(car.y / REAL_MAP_HEIGHT) * 100}%`,
    left: `${(car.x / REAL_MAP_WIDTH) * 100}%`,
    transform: 'translate(-50%, -50%)',
    zIndex: getCarStatus(car.id) === 'warning' ? 999 : 100
  }
})

// ========== 预警模拟 ==========
const handleWarningClick = (id: number) => {
  selectedCarId.value = id
  showWarningDialog.value = true
}

const closeWarningDialog = () => {
  showWarningDialog.value = false
  selectedCarId.value = null
}

const handleQuickMark = async () => {
  try {
    await carStore.setCarWarning(selectedCarId.value!)
    nextTick(() => { initCharts() })
    closeWarningDialog()
    ElMessage.success('预警设置成功')
  } catch (error) {
    ElMessage.error(`设置失败：${(error as Error).message}`)
  }
}

const handleSimulateDiffusion = async () => {
  try {
    await carStore.setCarWarning(selectedCarId.value!)
    nextTick(() => { initCharts() })

    router.push('/smart-map')

    closeWarningDialog()
  } catch (error) {
    ElMessage.error(`设置失败：${(error as Error).message}`)
  }
}

const handleResetCar = async (id: number) => {
  try {
    await carStore.resetCarStatus(id)
    nextTick(() => { initCharts() })
  } catch (error) {
    ElMessage.error(`重置失败：${(error as Error).message}`)
  }
}

// ========== 图表（小车总览） ==========
const initCharts = () => {
  if (!mapImgLoaded.value || !mapContainer.value) return

  chartInstances.value.forEach(instance => {
    if (instance.dispose) instance.dispose()
  })
  chartInstances.value = []

  for (let i = 1; i <= 4; i++) {
    try {
      const chartDom = document.getElementById(`chart-${i}`)
      if (!chartDom) continue

      const myChart = echarts.init(chartDom)
      const isWarning = getCarStatus(i) === 'warning'

      // 数据源：后端监测概览的 concentrationTrend，只消费 sensor_reading 仿真采样；
      // 无采样读数时保持空态，warning_history 只用于预警历史列表。
      const spec = getCarGasSpec(i)
      const records = monitoringTrend.value
        .filter(item => Number(item.carId) === i)
        .slice()
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

      const xAxisData = records.map(r => formatChartTime(r.time))
      const yAxisData = records.map(r => Number(r.gasValue))
      const hasData = records.length > 0
      const hasSimulatedSource = records.some(r => r.qualityStatus === 'SIMULATED')

      const lineColor = isWarning ? '#e74c3c' : (i === 3 ? '#f39c12' : (i === 4 ? '#3498db' : '#27ae60'))

      const option = {
        title: {
          text: hasData
            ? (hasSimulatedSource ? '仿真采样浓度' : '监测浓度趋势')
            : '暂无监测采样数据',
          left: 'center',
          top: 2,
          textStyle: { color: '#90a4b8', fontSize: 11, fontWeight: 'normal' as const }
        },
        graphic: hasData ? [] : [{
          type: 'text',
          left: 'center',
          top: 'middle',
          style: { text: '暂无数据', fill: '#90a4b8', fontSize: 13 }
        }],
        xAxis: { type: 'category', data: xAxisData },
        yAxis: {
          type: 'value',
          name: `浓度 (${spec.unit})`,
          min: 0
        },
        series: hasData ? [{
          data: yAxisData,
          type: 'line',
          smooth: true,
          itemStyle: { color: lineColor },
          lineStyle: { width: 2, color: lineColor },
          areaStyle: isWarning ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(231, 76, 60, 0.3)' },
              { offset: 1, color: 'rgba(231, 76, 60, 0.05)' }
            ])
          } : null
        }] : [],
        tooltip: { trigger: 'axis' },
        grid: { left: '15%', right: '10%', bottom: '15%', top: '20%' },
        textStyle: { color: '#e0e6ed' }
      }

      myChart.setOption(option)
      chartInstances.value.push(myChart)

      const resizeHandler = () => myChart.resize()
      window.addEventListener('resize', resizeHandler)
      chartInstances.value.push({
        dispose: () => {
          window.removeEventListener('resize', resizeHandler)
          myChart.dispose()
        }
      })
    } catch (error) {
      console.error(`初始化小车${i}图表失败：`, error)
    }
  }
}

// ========== 实时预警 Tab 数据 ==========
const warningHistory = ref<WarningHistoryItem[]>([])
const aiAdviceByAlertId = ref<Record<number, AiAdviceRecord>>({})
const generatingAdviceId = ref<number | null>(null)
const alertsChartRef = ref<HTMLElement | null>(null)
let alertsChart: echarts.ECharts | null = null

const formatWarningTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

// 趋势图 X 轴只显示「时:分」，更贴合浓度曲线的横轴密度。
const formatChartTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const d = new Date(timeStr)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

const fetchWarningHistory = async () => {
  try {
    const res = await reqWarningHistoryList()
    if (res.code === 200) {
      warningHistory.value = res.data
      renderAlertsChart()
      // 历史数据到位后重绘 4 个小车 mini chart，避免 initCharts 早于数据到达时只剩空态。
      if (mapImgLoaded.value) {
        nextTick(() => initCharts())
      }
    }
  } catch (error) {
    console.error('获取预警历史失败：', error)
  }
}

const generateAdviceForAlert = async (alertId: number) => {
  generatingAdviceId.value = alertId
  try {
    const response = await reqGenerateAiAdvice(alertId)
    aiAdviceByAlertId.value = { ...aiAdviceByAlertId.value, [alertId]: response.data }
    ElMessage.success('智巡建议已生成，请打开小车详情审核')
  } catch (error) {
    ElMessage.error(`生成建议失败：${(error as Error).message}`)
  } finally {
    generatingAdviceId.value = null
  }
}

const fetchMonitoringOverview = async () => {
  try {
    const res = await reqMonitoringOverview()
    if (res.code === 200 && Array.isArray(res.data?.concentrationTrend)) {
      monitoringTrend.value = res.data.concentrationTrend
      if (mapImgLoaded.value) {
        nextTick(() => initCharts())
      }
    } else {
      monitoringTrend.value = []
    }
  } catch (error) {
    console.error('获取监测概览失败：', error)
    monitoringTrend.value = []
  }
}

const renderAlertsChart = () => {
  if (!alertsChartRef.value) return
  if (!alertsChart) {
    alertsChart = echarts.init(alertsChartRef.value)
  }

  const areaCount: Record<string, number> = {}
  warningHistory.value.forEach(item => {
    const name = item.areaName || '未知区域'
    areaCount[name] = (areaCount[name] || 0) + 1
  })

  const names = Object.keys(areaCount)
  const values = names.map(k => areaCount[k])

  alertsChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '10%', right: '10%', bottom: '15%', top: '15%' },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#e0e6ed' },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#e0e6ed' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
    },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409eff' },
          { offset: 1, color: '#40e0d0' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barWidth: 40
    }]
  })
}

const yoloMetrics = ref<YoloMetrics>({
  currentCount: null,
  analysisTime: null,
  riskCount: 0,
  onlineDevices: 0
})
const carYoloFileInput = ref<HTMLInputElement | null>(null)
const carYoloUploading = ref(false)
const carYoloResult = ref<CarYoloResult | null>(null)

const fetchYoloSummary = async () => {
  try {
    const res = await reqYoloSummary()
    if (res.code === 200 && res.data) {
      yoloMetrics.value = {
        currentCount: res.data.currentCount,
        analysisTime: res.data.analysisTime,
        riskCount: Number(res.data.riskCount || 0),
        onlineDevices: Number(res.data.onlineDevices || 0)
      }
    }
  } catch (error) {
    console.error('获取 YOLO 汇总指标失败：', error)
  }
}

const triggerCarYoloUpload = () => {
  carYoloFileInput.value?.click()
}

const handleCarYoloFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await analyzeCarYoloImage(file)
}

const analyzeCarYoloImage = async (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    ElMessage.warning('小车巡检识别仅支持 JPG/PNG 图片')
    return
  }

  const formData = new FormData()
  formData.append('file', file)
  const startedAt = Date.now()
  carYoloUploading.value = true
  try {
    const res = await reqAnalyzePersonImage<YoloAnalysisResult>(formData)
    const data = res.data
    if (data?.status !== 'success' || typeof data.count !== 'number') {
      ElMessage.warning(data?.message || 'YOLO 识别未返回有效结果')
      return
    }

    const analysisTime = readYoloAnalysisTime(data, Date.now() - startedAt)
    carYoloResult.value = {
      count: data.count,
      analysisTime,
      imageBase64: data.image_base64,
      detections: data.detections || [],
      frameIndex: data.frameIndex,
      capturedAt: data.capturedAt,
      requestId: data.requestId,
      modelVersion: data.algorithm?.modelVersion || data.modelVersion,
    }
    await fetchYoloSummary()
    yoloMetrics.value = {
      ...yoloMetrics.value,
      currentCount: data.count,
      analysisTime,
    }
    ElMessage.success(`小车巡检图片识别完成，检测到 ${data.count} 人`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '算法服务异常'
    ElMessage.error(`YOLO 识别失败：${message}`)
  } finally {
    carYoloUploading.value = false
  }
}

const readYoloAnalysisTime = (data: YoloAnalysisResult, fallbackMs: number) => {
  const value = data.runtime?.costMs ?? data.analysisTime ?? data.analysis_time ?? data.processing_time_ms
  return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallbackMs)
}

const normalizeYoloImage = (imageBase64: string) => {
  if (!imageBase64) return ''
  if (imageBase64.startsWith('data:image/')) return imageBase64
  return `data:image/jpeg;base64,${imageBase64}`
}

const formatYoloCapturedAt = (capturedAt: string) => {
  const date = new Date(capturedAt)
  return Number.isNaN(date.getTime()) ? capturedAt : date.toLocaleString()
}

// ========== 监听 ==========
watch(
  () => carStore.carStatusList,
  () => {
    if (mapImgLoaded.value) {
      nextTick(() => initCharts())
    }
  },
  { deep: true }
)

// ========== 生命周期 ==========
onMounted(async () => {
  await carStore.fetchCarDataFromDB()

  nextTick(() => {
    const img = mapContainer.value?.querySelector<HTMLImageElement>('.map-img')
    if (img && img.complete) {
      mapImgLoaded.value = true
      initCharts()
    }
  })

  // 预加载预警数据
  fetchWarningHistory()
  fetchMonitoringOverview()
  fetchYoloSummary()
})

onUnmounted(() => {
  chartInstances.value.forEach(instance => {
    if (instance.dispose) instance.dispose()
  })
  chartInstances.value = []
  mapImgLoaded.value = false
  alertsChart?.dispose()
})
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  background: transparent;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/background2.jpg') center/cover no-repeat;
  filter: blur(8px) brightness(0.4);
  z-index: 0;
  opacity: 0.8;
  pointer-events: none;
}

.home-container > * {
  position: relative;
  z-index: 1;
}

/* ===== Tabs ===== */
.integrated-tabs {
  width: min(100%, 1760px);
  margin: 0 auto;
  padding: 0 24px 28px;
  background: transparent;
}

.integrated-tabs :deep(.el-tabs__header) {
  display: none !important;
}

.integrated-tabs :deep(.el-tabs__item) {
  color: #e0e6ed;
  font-size: 16px;
  font-weight: 600;
  padding: 0 24px;
  height: 52px;
  line-height: 52px;
  transition: all 0.3s;
}

.integrated-tabs :deep(.el-tabs__item:hover) {
  color: #40e0d0;
}

.integrated-tabs :deep(.el-tabs__item.is-active) {
  color: #40e0d0;
}

.integrated-tabs :deep(.el-tabs__active-bar) {
  background-color: #40e0d0;
  height: 3px;
}

/* ===== Tab 公共 ===== */
.tab-content {
  min-height: 300px;
}

.tab-card {
  margin-bottom: 20px;
  background: rgba(10, 25, 50, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(64, 224, 208, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  color: #e0e6ed;
}

.card-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title-text {
  font-size: 18px;
  font-weight: 600;
  color: #40e0d0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ===== 小车总览原有样式 ===== */
.nav-bar {
  width: 100%;
  background: rgba(10, 25, 50, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(64, 224, 208, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}
.nav-bar ul {
  list-style: none;
  display: flex;
  margin: 0;
  padding: 0;
}
.nav-bar li {
  padding: 15px 25px;
  color: #e0e6ed;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  font-weight: 500;
}
.nav-bar li.active {
  color: #40e0d0;
  background: rgba(64, 224, 208, 0.1);
  box-shadow: inset 0 -3px 0 #40e0d0;
}
.nav-bar li:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.warning-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  box-shadow: 0 0 8px #ff4d4f;
  animation: blink 1s infinite;
}

.content {
  --car-map-zoom: 1.22;
  display: grid;
  grid-template-columns: minmax(190px, 245px) minmax(760px, 1.65fr) minmax(190px, 245px);
  align-items: stretch;
  padding: 14px 0;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.chart-group {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.chart-item {
  background: rgba(10, 25, 50, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 14px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(64, 224, 208, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;
  color: #e0e6ed;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.chart-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(64, 224, 208, 0.2);
  border-color: rgba(64, 224, 208, 0.4);
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.gas-type {
  font-size: 17px;
  font-weight: 700;
  color: #40e0d0;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5), 0 0 20px rgba(64, 224, 208, 0.3);
  letter-spacing: 1px;
}
.car-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  color: #fff;
}
.car-badge.normal {
  background: rgba(39, 174, 96, 0.2);
  border: 1px solid rgba(39, 174, 96, 0.5);
  color: #2ecc71;
}
.car-badge.warning {
  background: rgba(255, 77, 79, 0.2);
  border: 1px solid rgba(255, 77, 79, 0.5);
  color: #ff4d4f;
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.4);
}

.chart {
  width: 100%;
  flex: 1 1 auto;
  min-height: 168px;
}

.map-container {
  flex: 1 1 60%;
  min-width: 0;
  background: rgba(10, 25, 50, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 14px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(64, 224, 208, 0.2);
  text-align: center;
  color: #e0e6ed;
  display: flex;
  flex-direction: column;
}
.map-container h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: 700;
  color: #40e0d0;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5), 0 0 20px rgba(64, 224, 208, 0.3);
  letter-spacing: 2px;
}

.map {
  position: relative;
  width: 100%;
  aspect-ratio: 1587.2 / 947.2;
  min-height: 0;
  flex: 1 1 auto;
  max-height: 760px;
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}
.map-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transform: scale(var(--car-map-zoom));
  transform-origin: center center;
}
.markers-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  transform: scale(var(--car-map-zoom));
  transform-origin: center center;
}
.car-marker {
  position: absolute !important;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  color: white;
  font-size: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  transform: translate(-50%, -50%) !important;
  z-index: 9999;
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
}
.car-marker:hover {
  transform: translate(-50%, -50%) scale(1.15) !important;
  box-shadow: 0 6px 20px rgba(64, 224, 208, 0.6);
  border-color: #fff;
}
.car-marker.normal {
  background: rgba(39, 174, 96, 0.95);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.6);
}
.car-marker.warning {
  background: rgba(255, 77, 79, 0.95);
  box-shadow: 0 0 20px rgba(255, 77, 79, 0.8);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1) !important; }
  50% { transform: translate(-50%, -50%) scale(1.1) !important; }
  100% { transform: translate(-50%, -50%) scale(1) !important; }
}
@keyframes blink {
  0% { opacity: 1; box-shadow: 0 0 8px #ff4d4f; }
  50% { opacity: 0.3; box-shadow: 0 0 2px #ff4d4f; }
  100% { opacity: 1; box-shadow: 0 0 8px #ff4d4f; }
}
.car-id {
  font-weight: 900;
  font-size: 13px;
  line-height: 1;
  letter-spacing: 0;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
}
.car-status {
  font-size: 8px;
  line-height: 1;
  font-weight: 700;
  opacity: 1;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
}

/* 预警模拟模块样式 */
.simulate-section {
  margin: 10px 0 0;
  padding: 25px;
  background: rgba(10, 25, 50, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(64, 224, 208, 0.2);
}

.simulate-title {
  color: #40e0d0;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(64, 224, 208, 0.2);
  padding-bottom: 10px;
}

.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.sim-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s ease;
}

.sim-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  border-color: rgba(64, 224, 208, 0.4);
}

.sim-card.warning {
  border-color: rgba(255, 77, 79, 0.5);
  box-shadow: inset 0 0 15px rgba(255, 77, 79, 0.1);
}

.sim-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.sim-card h4 {
  color: #e0e6ed;
  font-size: 16px;
  margin: 0;
}

.sim-card .badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.sim-card .badge.normal {
  background: rgba(39, 174, 96, 0.8);
  box-shadow: 0 0 8px rgba(39, 174, 96, 0.4);
}

.sim-card .badge.warning {
  background: rgba(255, 77, 79, 0.8);
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.4);
  animation: blink 1s infinite;
}

.sim-card .card-body p {
  margin: 8px 0;
  color: #b8e8e4;
  font-size: 14px;
}

.sim-card .label {
  color: #8fa6b8;
  margin-right: 4px;
}

.sim-card .card-footer {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.sim-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #fff;
}

.warning-btn {
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
}

.warning-btn:not(:disabled):hover {
  background: linear-gradient(90deg, #ff7875, #ff4d4f);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.6);
  transform: translateY(-1px);
}

.reset-btn {
  background: rgba(64, 224, 208, 0.2);
  border: 1px solid rgba(64, 224, 208, 0.5);
  color: #40e0d0;
}

.reset-btn:not(:disabled):hover {
  background: rgba(64, 224, 208, 0.4);
  box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
  transform: translateY(-1px);
  color: #fff;
}

.sim-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(1);
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-container {
  background: rgba(10, 25, 50, 0.95);
  border: 1px solid rgba(64, 224, 208, 0.3);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  min-width: 500px;
  max-width: 600px;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from { opacity: 0; transform: translateY(-50px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(64, 224, 208, 0.2);
}

.dialog-header h3 {
  color: #40e0d0;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.5);
}

.dialog-close {
  background: none;
  border: none;
  color: #e0e6ed;
  font-size: 32px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: rgba(255, 77, 79, 0.2);
  color: #ff4d4f;
}

.dialog-body {
  padding: 24px;
}

.car-info {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.car-info p {
  color: #e0e6ed;
  font-size: 15px;
  margin: 8px 0;
}

.info-label {
  color: #8fa6b8;
  font-weight: 600;
}

.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.action-btn {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(64, 224, 208, 0.3);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.action-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.action-text { text-align: left; }
.action-title { color: #e0e6ed; font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.action-desc { color: #8fa6b8; font-size: 13px; }
.quick-mark { border-color: rgba(255, 77, 79, 0.4); }
.quick-mark:hover { border-color: rgba(255, 77, 79, 0.8); background: rgba(255, 77, 79, 0.1); box-shadow: 0 6px 20px rgba(255, 77, 79, 0.3); }
.simulate-diffusion { border-color: rgba(64, 224, 208, 0.4); }
.simulate-diffusion:hover { border-color: rgba(64, 224, 208, 0.8); background: rgba(64, 224, 208, 0.1); box-shadow: 0 6px 20px rgba(64, 224, 208, 0.3); }

/* 预警历史表格 */
.warning-table {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-row-hover-bg-color: rgba(64, 224, 208, 0.1) !important;
  --el-table-border-color: rgba(66, 58, 58, 0.1) !important;
  border-radius: 8px;
}

.warning-table :deep(.el-table__header th) {
  background-color: rgba(10, 25, 50, 0.8) !important;
  color: #40e0d0 !important;
}
.warning-table :deep(.el-table__row) {
  background: rgba(0, 0, 0, 0.15) !important;
  color: #fff !important;
}
.warning-table :deep(.el-table__row:nth-child(even)) {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* 智慧地图 Tab */
.map-tab-body {
  display: flex;
  gap: 24px;
  align-items: center;
}

.map-preview {
  position: relative;
  flex: 1;
  aspect-ratio: 1587.2 / 947.2;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(64, 224, 208, 0.2);
  max-width: 720px;
  background: rgba(0, 0, 0, 0.3);
}

.map-preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.3s;
}

.map-preview-img:hover {
  transform: scale(1.02);
}

.preview-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.pv-marker {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.pv-marker.normal {
  background: rgba(39, 174, 96, 0.9);
}

.pv-marker.warning {
  background: rgba(255, 77, 79, 0.9);
  animation: pulse 1.5s infinite;
}

.map-info {
  flex: 0 0 280px;
  padding: 20px;
}

.map-info h4 {
  color: #40e0d0;
  font-size: 20px;
  margin: 0 0 12px;
}

.map-info p {
  color: #b8e8e4;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

/* YOLO Tab */
.yolo-summary {
  padding: 10px;
}

.yolo-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.metric-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
}

.metric-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(64, 224, 208, 0.15);
  border-color: rgba(64, 224, 208, 0.4);
}

.metric-value {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.metric-value small {
  font-size: 16px;
  font-weight: 400;
}

.metric-label {
  font-size: 14px;
  color: #b8e8e4;
}

.color-blue { color: #409eff; }
.color-green { color: #67c23a; }
.color-orange { color: #e6a23c; }
.color-purple { color: #b37feb; }

.yolo-action {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 220px));
  justify-content: center;
  gap: 12px;
}

.yolo-action .action-btn {
  width: 100%;
}

.car-yolo-result {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(220px, 360px) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(64, 224, 208, 0.2);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.24);
}

.car-yolo-result-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: #020617;
  border-radius: 6px;
}

.car-yolo-result-meta {
  display: grid;
  gap: 8px;
  color: #d7fffb;
  font-size: 14px;
}

/* 视频网格 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.video-item-wrapper {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(64, 224, 208, 0.15);
}

.video-box {
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
}

.video-box video,
.video-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-label {
  text-align: center;
  padding: 8px;
  font-size: 13px;
  color: #e0e6ed;
  font-weight: 500;
}

/* 实时预警图表 */
.chart-box {
  width: 100%;
  height: 300px;
}

/* 响应式 */
@media (max-width: 1680px) {
  .integrated-tabs {
    width: 100%;
    padding-inline: 14px;
  }
  .content {
    grid-template-columns: minmax(185px, 235px) minmax(660px, 1.5fr) minmax(185px, 235px);
    gap: 12px;
  }
  .chart-item {
    padding: 12px;
  }
  .gas-type {
    font-size: 15px;
  }
  .chart {
    min-height: 146px;
  }
  .map-container {
    padding: 12px;
  }
}

@media (max-width: 1400px) {
  .integrated-tabs { padding: 0 18px 24px; }
  .content {
    grid-template-columns: minmax(0, 1fr);
  }
  .chart-group,
  .map-container {
    width: 100%;
    min-width: 0;
  }
  .chart-group {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .chart-item { width: 100%; min-height: 260px; }
  .map-tab-body { flex-direction: column; }
  .map-preview { max-width: 100%; }
  .map-info { flex: none; width: 100%; text-align: center; }
  .yolo-metrics { grid-template-columns: repeat(2, 1fr); }
  .video-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .card-list { grid-template-columns: 1fr; }
  .yolo-metrics { grid-template-columns: repeat(2, 1fr); }
  .video-grid { grid-template-columns: 1fr; }
}

/* Detail polish */
.home-container {
  isolation: isolate;
}

.background-image {
  filter: blur(10px) brightness(0.42) saturate(1.08);
  opacity: 0.92;
}

.background-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 14% 10%, rgba(64, 224, 208, 0.13), transparent 32%),
    radial-gradient(circle at 86% 4%, rgba(230, 162, 60, 0.16), transparent 28%),
    linear-gradient(135deg, rgba(3, 12, 24, 0.82), rgba(7, 25, 35, 0.78));
}

.integrated-tabs {
  padding-top: 2px;
}

.nav-bar,
.tab-card,
.chart-item,
.map-container,
.simulate-section,
.dialog-container,
.metric-box,
.video-item-wrapper {
  border-radius: 8px;
  border-color: rgba(120, 211, 214, 0.22);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
}

.nav-bar {
  position: sticky;
  top: 0;
  z-index: 12;
  overflow-x: auto;
  background:
    linear-gradient(90deg, rgba(8, 23, 40, 0.9), rgba(7, 35, 42, 0.82)),
    rgba(8, 23, 40, 0.86);
  border: 1px solid rgba(120, 211, 214, 0.2);
}

.nav-bar::-webkit-scrollbar {
  height: 0;
}

.nav-bar ul {
  min-width: max-content;
  padding: 5px;
  gap: 4px;
}

.nav-bar li {
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
}

.nav-bar li.active {
  background: linear-gradient(135deg, rgba(64, 224, 208, 0.18), rgba(230, 162, 60, 0.09));
  box-shadow: inset 0 0 0 1px rgba(64, 224, 208, 0.35);
}

.content {
  gap: 14px;
}

.chart-item,
.tab-card,
.map-container,
.simulate-section {
  background:
    linear-gradient(160deg, rgba(8, 23, 40, 0.82), rgba(7, 34, 41, 0.7)),
    rgba(10, 25, 50, 0.62);
}

.chart-item:hover,
.tab-card:hover,
.map-container:hover,
.simulate-section:hover {
  transform: translateY(-2px);
  border-color: rgba(120, 211, 214, 0.42);
  box-shadow: 0 22px 52px rgba(0, 0, 0, 0.38);
}

.map-container h3,
.simulate-title,
.card-title-text,
.gas-type {
  letter-spacing: 0;
  text-shadow: 0 0 14px rgba(64, 224, 208, 0.28);
}

.map {
  border-radius: 8px;
  border-color: rgba(120, 211, 214, 0.24);
}

.map::after,
.map-preview::after,
.video-box::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 18%, rgba(0, 0, 0, 0.18));
}

.car-marker {
  width: 34px;
  height: 34px;
  border-width: 2px;
}

.sim-card {
  border-radius: 8px;
  background: rgba(2, 12, 24, 0.34);
}

.sim-card .card-footer {
  gap: 10px;
}

.sim-btn {
  min-height: 36px;
  border-radius: 7px;
}

.dialog-overlay {
  background:
    radial-gradient(circle at center, rgba(64, 224, 208, 0.08), transparent 36%),
    rgba(1, 8, 18, 0.76);
}

.dialog-container {
  width: min(560px, calc(100vw - 28px));
  min-width: 0;
  background:
    linear-gradient(160deg, rgba(9, 27, 43, 0.98), rgba(5, 19, 31, 0.96));
}

.dialog-header h3 {
  font-size: 18px;
  letter-spacing: 0;
}

.dialog-close {
  border-radius: 8px;
}

.dialog-actions .action-btn {
  min-height: 104px;
  border-radius: 8px;
  background: rgba(4, 15, 28, 0.68);
}

.metric-box {
  background:
    linear-gradient(160deg, rgba(4, 15, 28, 0.68), rgba(7, 35, 42, 0.44));
}

.metric-value {
  font-size: clamp(28px, 2.5vw, 38px);
}

.video-item-wrapper {
  overflow: hidden;
  background: rgba(4, 15, 28, 0.58);
}

.video-box {
  position: relative;
}

@media (max-width: 768px) {
  .integrated-tabs {
    padding-inline: 12px;
  }

  .nav-bar li {
    padding: 10px 14px;
  }

  .chart-group {
    grid-template-columns: 1fr;
  }

  .yolo-metrics {
    grid-template-columns: 1fr;
  }

  .dialog-actions {
    grid-template-columns: 1fr;
  }
}
</style>
