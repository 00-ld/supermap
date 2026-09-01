<template>
  <div class="container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-card class="card video-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><VideoPlay /></el-icon>
              监测点与视频源绑定
            </span>
            <div class="video-toolbar">
              <el-input
                v-model="videoSearchKey"
                placeholder="搜索监测区域"
                clearable
                aria-label="搜索监控视频"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <span>{{ monitorVideoSources.length }} 路在线</span>
            </div>
          </div>
        </template>

        <p class="monitor-source-note">
          视频监控与气体传感器联动，辅助值守人员快速复核预警现场。
        </p>

        <div class="monitor-summary">
          <div class="summary-item">
            <span class="summary-label">监测点</span>
            <strong>{{ monitorVideoSources.length }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">预警记录</span>
            <strong>{{ historyList.length }}</strong>
          </div>
          <div class="summary-item danger">
            <span class="summary-label">高风险</span>
            <strong>{{ highRiskCount }}</strong>
          </div>
          <div class="summary-item">
            <span class="summary-label">最近预警</span>
            <strong>{{ latestWarningText }}</strong>
          </div>
        </div>

        <div v-if="filteredMonitorVideoSources.length" class="video-container">
          <article
            v-for="source in filteredMonitorVideoSources"
            :key="source.id"
            class="monitor-video-item"
          >
            <header>
              <strong>{{ source.name }}</strong>
              <span>在线</span>
            </header>
            <div class="monitor-meta">
              <span>{{ source.areaName }}</span>
              <span>传感器 {{ source.sensorId }}</span>
            </div>
            <div class="video-frame">
              <video
                :src="source.cameraUrl"
                :aria-label="`${source.name}监控视频`"
                muted
                loop
                autoplay
                playsinline
                controls
                preload="metadata"
              ></video>
              <span class="video-source-badge">
                实时监控 · {{ source.gasLabel }}
              </span>
            </div>
          </article>
        </div>
        <div v-else class="monitor-empty">
          没有匹配的监测点，请尝试区域、点位或传感器编号。
        </div>
      </el-card>

      <!-- 优化后的预警历史记录区域 -->
      <el-card class="card history-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">
              <el-icon><Clock /></el-icon>
              预警历史记录
            </span>
          </div>
        </template>

        <div class="history-summary">
          <div class="history-metric">
            <span>安全</span>
            <strong>{{ safeCount }}</strong>
          </div>
          <div class="history-metric warning">
            <span>预警</span>
            <strong>{{ warningCount }}</strong>
          </div>
          <div class="history-metric danger">
            <span>危险</span>
            <strong>{{ dangerCount }}</strong>
          </div>
          <div class="history-metric">
            <span>气体类型</span>
            <strong>{{ gasTypeCount }}</strong>
          </div>
        </div>
        <div class="table-container">
          <el-table
            :data="historyList"
            border
            stripe
            :header-cell-style="{
              background: '#f5f7fa',
              color: '#303133',
              fontWeight: '600',
            }"
            :row-class-name="
              ({ row }: { row: HistoryItem }) =>
                `level-${getLevelTagType(getRiskLevel(row))}`
            "
            class="history-table"
          >
            <el-table-column
              prop="carId"
              label="小车编号"
              align="center"
              width="120"
            />
            <el-table-column
              prop="areaName"
              label="所属区域"
              align="center"
              width="120"
            />
            <el-table-column
              prop="x"
              label="坐标X"
              align="center"
              width="120"
            />
            <el-table-column
              prop="y"
              label="坐标Y"
              align="center"
              width="120"
            />
            <el-table-column
              prop="gasType"
              label="气体类型"
              align="center"
              width="100"
            >
              <template #default="scope">
                <el-tag size="small" type="info" class="gas-tag">
                  {{ formatGasType(scope.row.gasType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="gasValue"
              label="浓度值"
              align="center"
              width="170"
            >
              <template #default="scope">
                <span class="concentration-text">
                  {{ scope.row.gasValue }}
                  {{
                    normalizeGasType(scope.row.gasType) === 'O2'
                      ? '%VOL'
                      : 'ppm'
                  }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="危险等级" align="center" width="130">
              <template #default="scope">
                <div
                  class="level-tag"
                  :class="getLevelTagType(getRiskLevel(scope.row))"
                >
                  {{ getRiskLevelText(getRiskLevel(scope.row)) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="warningTime"
              label="预警时间"
              align="center"
              width="220"
            >
              <template #default="scope">
                {{ formatTime(scope.row.warningTime) }}
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="120"
              fixed="right"
            >
              <template #default="scope">
                <el-button
                  type="danger"
                  size="small"
                  icon="Delete"
                  @click="handleDelete(scope.row.id)"
                  class="delete-btn"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 泄漏统计图表（只保留一个，美观居中） -->
        <el-card class="card chart-card" shadow="hover">
          <div class="chart-item">
            <div class="chart-title">
              <el-icon><Histogram /></el-icon>
              各区域泄漏次数统计
            </div>
            <div ref="areaChartRef" class="chart-box"></div>
          </div>
        </el-card>
      </el-card>
    </div>

    <!-- 气体等级划分区域 -->
    <el-card class="card level-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><WarnTriangleFilled /></el-icon>
            气体泄漏危险等级划分标准（中国职业卫生/工业安全国标）
          </span>
        </div>
      </template>

      <!-- 气体类型切换 -->
      <div class="gas-tabs">
        <el-radio-group
          v-model="activeGasType"
          size="default"
          class="radio-group"
        >
          <el-radio-button label="all">全部气体</el-radio-button>
          <el-radio-button label="ch4">甲烷(CH₄)</el-radio-button>
          <el-radio-button label="nh3">氨气(NH₃)</el-radio-button>
          <el-radio-button label="co">一氧化碳(CO)</el-radio-button>
          <el-radio-button label="o2">氧气(O₂)</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 表格容器 - 增加滚动适配 -->
      <div class="table-container">
        <!-- 全部气体汇总表 -->
        <el-table
          v-if="activeGasType === 'all'"
          :data="allGasLevelList"
          border
          stripe
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#303133',
            fontWeight: '600',
          }"
          class="level-table"
        >
          <el-table-column
            prop="level"
            label="危险等级"
            align="center"
            min-width="120"
          />
          <el-table-column
            prop="color"
            label="预警色"
            align="center"
            min-width="120"
          >
            <template #default="scope">
              <div class="color-tag" :class="scope.row.tagType">
                {{ scope.row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="ch4"
            label="甲烷(CH₄)"
            align="center"
            min-width="200"
          >
            <template #default="scope">
              <div class="cell-content" style="white-space: pre-line">
                {{ scope.row.ch4 }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="nh3"
            label="氨气(NH₃)"
            align="center"
            min-width="220"
          >
            <template #default="scope">
              <div class="cell-content" style="white-space: pre-line">
                {{ scope.row.nh3 }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="co"
            label="一氧化碳(CO)"
            align="center"
            min-width="220"
          >
            <template #default="scope">
              <div class="cell-content" style="white-space: pre-line">
                {{ scope.row.co }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="o2"
            label="氧气(O₂)"
            align="center"
            min-width="200"
          >
            <template #default="scope">
              <div class="cell-content" style="white-space: pre-line">
                {{ scope.row.o2 }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="risk"
            label="风险描述"
            align="center"
            min-width="200"
          />
          <el-table-column
            prop="response"
            label="应急响应"
            align="center"
            min-width="180"
          />
        </el-table>

        <!-- 甲烷单独表格 -->
        <el-table
          v-else-if="activeGasType === 'ch4'"
          :data="ch4LevelList"
          border
          stripe
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#303133',
            fontWeight: '600',
          }"
          class="level-table"
        >
          <el-table-column
            prop="level"
            label="危险等级"
            align="center"
            min-width="120"
          />
          <el-table-column
            prop="color"
            label="预警色"
            align="center"
            min-width="120"
          >
            <template #default="scope">
              <div class="color-tag" :class="scope.row.tagType">
                {{ scope.row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="concentration"
            label="浓度范围（占LEL%）"
            align="center"
            min-width="180"
          />
          <el-table-column
            prop="ppm"
            label="对应浓度(ppm)"
            align="center"
            min-width="180"
          />
          <el-table-column
            prop="risk"
            label="爆炸风险描述"
            align="center"
            min-width="250"
          />
          <el-table-column
            prop="response"
            label="应急响应措施"
            align="center"
            min-width="200"
          />
        </el-table>

        <!-- 氨气单独表格 -->
        <el-table
          v-else-if="activeGasType === 'nh3'"
          :data="nh3LevelList"
          border
          stripe
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#303133',
            fontWeight: '600',
          }"
          class="level-table"
        >
          <el-table-column
            prop="level"
            label="危险等级"
            align="center"
            min-width="120"
          />
          <el-table-column
            prop="color"
            label="预警色"
            align="center"
            min-width="120"
          >
            <template #default="scope">
              <div class="color-tag" :class="scope.row.tagType">
                {{ scope.row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="mg"
            label="浓度(mg/m³)"
            align="center"
            min-width="150"
          />
          <el-table-column
            prop="ppm"
            label="浓度(ppm)"
            align="center"
            min-width="150"
          />
          <el-table-column
            prop="risk"
            label="健康风险描述"
            align="center"
            min-width="280"
          />
          <el-table-column
            prop="response"
            label="应急响应措施"
            align="center"
            min-width="200"
          />
        </el-table>

        <!-- 一氧化碳单独表格 -->
        <el-table
          v-else-if="activeGasType === 'co'"
          :data="coLevelList"
          border
          stripe
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#303133',
            fontWeight: '600',
          }"
          class="level-table"
        >
          <el-table-column
            prop="level"
            label="危险等级"
            align="center"
            min-width="120"
          />
          <el-table-column
            prop="color"
            label="预警色"
            align="center"
            min-width="120"
          >
            <template #default="scope">
              <div class="color-tag" :class="scope.row.tagType">
                {{ scope.row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="mg"
            label="浓度(mg/m³)"
            align="center"
            min-width="150"
          />
          <el-table-column
            prop="ppm"
            label="浓度(ppm)"
            align="center"
            min-width="150"
          />
          <el-table-column
            prop="risk"
            label="健康风险描述"
            align="center"
            min-width="280"
          />
          <el-table-column
            prop="response"
            label="应急响应措施"
            align="center"
            min-width="200"
          />
        </el-table>

        <!-- 氧气单独表格 -->
        <el-table
          v-else-if="activeGasType === 'o2'"
          :data="o2LevelList"
          border
          stripe
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#303133',
            fontWeight: '600',
          }"
          class="level-table"
        >
          <el-table-column
            prop="level"
            label="危险等级"
            align="center"
            min-width="120"
          />
          <el-table-column
            prop="color"
            label="预警色"
            align="center"
            min-width="120"
          >
            <template #default="scope">
              <div class="color-tag" :class="scope.row.tagType">
                {{ scope.row.color }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="concentration"
            label="浓度(%VOL)"
            align="center"
            min-width="180"
          />
          <el-table-column
            prop="risk"
            label="风险描述"
            align="center"
            min-width="300"
          />
          <el-table-column
            prop="response"
            label="应急响应措施"
            align="center"
            min-width="200"
          />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  Clock,
  Histogram,
  Search,
  VideoPlay,
  WarnTriangleFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  reqDeleteWarningHistory,
  reqWarningHistoryList,
} from '@/api/warningHistory'
import type { WarningHistoryRecord } from '@/api/warningHistory'
import {
  filterMonitorVideoSources,
  MONITOR_VIDEO_SOURCES,
} from './monitorVideoSources'

const videoSearchKey = ref('')
const monitorVideoSources = MONITOR_VIDEO_SOURCES
const filteredMonitorVideoSources = computed(() =>
  filterMonitorVideoSources(monitorVideoSources, videoSearchKey.value),
)

// 气体类型切换
const activeGasType = ref('all')

// 图表DOM引用
const areaChartRef = ref<HTMLElement | null>(null)
let areaChart: echarts.ECharts | null = null

// ==================== ECharts 绘图（已按你的要求修改） ====================
const renderCharts = () => {
  if (!areaChart) return
  // 统计区域
  const areaCount: Record<string, number> = {}
  historyList.value.forEach(({ areaName }) => {
    if (!areaName) return
    areaCount[areaName] = (areaCount[areaName] || 0) + 1
  })
  const areaNames = Object.keys(areaCount)
  const areaValues = areaNames.map((k) => areaCount[k])

  // 区域图表配置
  areaChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 20, 40, 0.8)',
      borderColor: '#40e0d0',
      textStyle: { color: '#fff', fontSize: 14 },
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%',
    },
    xAxis: {
      type: 'category',
      data: areaNames,
      axisLabel: {
        fontSize: 16, // 放大X轴字体
        color: '#e0e6ed', // 适配深色背景
      },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisTick: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 16, // 放大Y轴字体
        color: '#e0e6ed',
      },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      axisTick: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    series: [
      {
        type: 'bar',
        data: areaValues,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#40e0d0' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#66b1ff' },
              { offset: 1, color: '#66f0e0' },
            ]),
          },
        },
        barWidth: 45, // 缩小柱状体粗度
        barMaxWidth: 40,
        barMinWidth: 20,
        barGap: '5%',
        barCategoryGap: '15%',
      },
    ],
  })
}

// 初始化图表
const handleResize = () => {
  areaChart?.resize()
}
onMounted(() => {
  if (areaChartRef.value) {
    areaChart = echarts.init(areaChartRef.value)
  }
  fetchHistory()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  areaChart?.dispose()
})

// ========== 核心：按国标定义的四种气体等级划分 ==========
const allGasLevelList = reactive([
  {
    level: '极高危险',
    color: '红色',
    tagType: 'danger',
    ch4: '≥ 50% LEL\n(≈25000ppm)',
    nh3: '≥ 52mg/m³\n(≥ 75ppm)',
    co: '≥ 300mg/m³\n(≥ 262ppm)',
    o2: '< 16%VOL 或 >23.5%VOL',
    risk: '致命风险/爆炸极高风险',
    response: '立即疏散/专业应急',
  },
  {
    level: '危险',
    color: '橙色',
    tagType: 'warning',
    ch4: '25% ~ 50% LEL\n(12500-25000ppm)',
    nh3: '35 ~ 52mg/m³\n(50 ~ 75ppm)',
    co: '100 ~ 300mg/m³\n(87 ~ 262ppm)',
    o2: '16% ~ 19.5%VOL',
    risk: '中毒重伤/爆炸高风险',
    response: '禁止动火/人员撤离',
  },
  {
    level: '预警',
    color: '黄色',
    tagType: 'primary',
    ch4: '10% ~ 25% LEL\n(5000-12500ppm)',
    nh3: '17 ~ 35mg/m³\n(25 ~ 50ppm)',
    co: '50 ~ 100mg/m³\n(43 ~ 87ppm)',
    o2: '19.5% ~ 20.9%VOL',
    risk: '刺激不适/爆炸预警',
    response: '启动报警/加强通风',
  },
  {
    level: '安全',
    color: '灰色',
    tagType: 'info',
    ch4: '< 10% LEL\n(< 5000ppm)',
    nh3: '≤ 17mg/m³\n(≤ 25ppm)',
    co: '≤ 20mg/m³\n(≤ 17ppm)',
    o2: '20.9% ~ 23.5%VOL',
    risk: '无急性风险/可正常作业',
    response: '常规监测/定期巡检',
  },
])

// 甲烷(CH₄) - 按爆炸下限LEL划分
const ch4LevelList = reactive([
  {
    level: '极高危险',
    color: '红色',
    tagType: 'danger',
    concentration: '≥ 50% LEL',
    ppm: '≈25000ppm',
    risk: '接近爆炸极限，随时可能爆炸，立即疏散',
    response: '紧急撤离/切断气源/防爆通风',
  },
  {
    level: '危险',
    color: '橙色',
    tagType: 'warning',
    concentration: '25% ~ 50% LEL',
    ppm: '12500-25000ppm',
    risk: '禁止动火，人员撤离，紧急处置',
    response: '区域隔离/专业防爆处置',
  },
  {
    level: '预警',
    color: '黄色',
    tagType: 'primary',
    concentration: '10% ~ 25% LEL',
    ppm: '5000-12500ppm',
    risk: '需启动报警，加强通风，排查泄漏源',
    response: '启动报警/加强通风/排查泄漏',
  },
  {
    level: '安全',
    color: '灰色',
    tagType: 'info',
    concentration: '< 10% LEL',
    ppm: '< 5000ppm',
    risk: '无爆炸风险，可正常作业',
    response: '常规监测/定期巡检',
  },
])

// 氨气(NH₃) - 刺激性有毒气体
const nh3LevelList = reactive([
  {
    level: '极高危险',
    color: '红色',
    tagType: 'danger',
    mg: '≥ 52mg/m³',
    ppm: '≥ 75ppm',
    risk: '强烈刺激呼吸道和眼部，存在急性中毒风险',
    response: '佩戴正压呼吸器/紧急撤离/专业处置',
  },
  {
    level: '危险',
    color: '橙色',
    tagType: 'warning',
    mg: '35 ~ 52mg/m³',
    ppm: '50 ~ 75ppm',
    risk: '刺激明显，可能引起咳嗽、胸闷等症状',
    response: '立即通风/人员撤离/医学观察',
  },
  {
    level: '预警',
    color: '黄色',
    tagType: 'primary',
    mg: '17 ~ 35mg/m³',
    ppm: '25 ~ 50ppm',
    risk: '刺激眼睛和呼吸道，需报警',
    response: '启动报警/加强通风/佩戴防护装备',
  },
  {
    level: '安全',
    color: '灰色',
    tagType: 'info',
    mg: '≤ 17mg/m³',
    ppm: '≤ 25ppm',
    risk: '低于预警阈值，可维持常规监测',
    response: '常规监测/定期巡检',
  },
])

// 一氧化碳(CO) - 血液窒息性气体
const coLevelList = reactive([
  {
    level: '极高危险',
    color: '红色',
    tagType: 'danger',
    mg: '≥ 300mg/m³',
    ppm: '≥ 262ppm',
    risk: '昏迷、呼吸衰竭，数小时内死亡',
    response: '紧急送医/高压氧治疗/环境通风',
  },
  {
    level: '危险',
    color: '橙色',
    tagType: 'warning',
    mg: '100 ~ 300mg/m³',
    ppm: '87 ~ 262ppm',
    risk: '恶心、呕吐，意识模糊',
    response: '立即撤离/新鲜空气/医学观察',
  },
  {
    level: '预警',
    color: '黄色',
    tagType: 'primary',
    mg: '50 ~ 100mg/m³',
    ppm: '43 ~ 87ppm',
    risk: '头痛、头晕，需报警',
    response: '启动报警/加强通风/人员防护',
  },
  {
    level: '安全',
    color: '灰色',
    tagType: 'info',
    mg: '≤ 20mg/m³',
    ppm: '≤ 17ppm',
    risk: '8小时加权平均容许浓度（PC-TWA）',
    response: '常规监测/定期巡检',
  },
])

// 氧气(O₂) - 浓度异常风险
const o2LevelList = reactive([
  {
    level: '极高危险',
    color: '红色',
    tagType: 'danger',
    concentration: '< 16%VOL 或 >23.5%VOL',
    risk: '严重缺氧致死亡 / 富氧环境火灾爆炸风险剧增',
    response: '缺氧：供氧撤离 / 富氧：严禁明火/通风稀释',
  },
  {
    level: '危险',
    color: '橙色',
    tagType: 'warning',
    concentration: '16% ~ 19.5%VOL',
    risk: '呼吸急促、心跳加快，判断力下降',
    response: '补充氧气/人员撤离/通风换气',
  },
  {
    level: '预警',
    color: '黄色',
    tagType: 'primary',
    concentration: '19.5% ~ 20.9%VOL',
    risk: '开始出现缺氧症状，需关注',
    response: '加强监测/通风换气/人员观察',
  },
  {
    level: '安全',
    color: '灰色',
    tagType: 'info',
    concentration: '20.9% ~ 23.5%VOL',
    risk: '大气正常浓度，安全',
    response: '常规监测/定期巡检',
  },
])

// ========== 预警历史记录相关逻辑 ==========
type HistoryItem = WarningHistoryRecord
const historyList = ref<HistoryItem[]>([])

const safeCount = computed(
  () => historyList.value.filter((item) => getRiskLevel(item) === 4).length,
)
const warningCount = computed(
  () => historyList.value.filter((item) => getRiskLevel(item) === 3).length,
)
const dangerCount = computed(
  () => historyList.value.filter((item) => getRiskLevel(item) === 2).length,
)
const highRiskCount = computed(
  () => historyList.value.filter((item) => getRiskLevel(item) <= 2).length,
)
const gasTypeCount = computed(
  () =>
    new Set(
      historyList.value
        .map((item) => normalizeGasType(item.gasType))
        .filter(Boolean),
    ).size,
)
const latestWarningText = computed(() => {
  const latest = historyList.value[0]
  if (!latest) return '暂无'
  return formatTime(latest.warningTime).slice(5, 16)
})

// 格式化气体类型显示
const normalizeGasType = (gasType: string | null | undefined) => {
  const raw = String(gasType || '')
    .trim()
    .toUpperCase()
  if (!raw) return ''
  if (raw.includes('CO') || raw.includes('一氧化碳')) return 'CO'
  if (raw.includes('O2') || raw.includes('O₂') || raw.includes('氧气'))
    return 'O2'
  if (raw.includes('NH3') || raw.includes('NH₃') || raw.includes('氨'))
    return 'NH3'
  if (
    raw.includes('CH4') ||
    raw.includes('CH₄') ||
    raw.includes('甲烷') ||
    raw.includes('可燃')
  )
    return 'CH4'
  return raw
}

const formatGasType = (gasType: string) => {
  const gasMap: Record<string, string> = {
    CH4: '甲烷(CH₄)',
    NH3: '氨气(NH₃)',
    CO: '一氧化碳(CO)',
    O2: '氧气(O₂)',
  }
  const normalized = normalizeGasType(gasType)
  return gasMap[normalized] || gasType
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

// 核心：根据气体类型和浓度计算危险等级
const getRiskLevel = (item: HistoryItem | null | undefined) => {
  if (!item || !item.gasType || !item.gasValue) return 4

  const gasType = normalizeGasType(item.gasType)
  const value = Number(item.gasValue)

  if (isNaN(value)) return 4

  switch (gasType) {
    case 'CH4':
      return value >= 50 ? 1 : value >= 20 ? 2 : value >= 10 ? 3 : 4
    case 'NH3':
      return value >= 75 ? 1 : value >= 50 ? 2 : value >= 25 ? 3 : 4
    case 'CO':
      return value >= 262 ? 1 : value >= 87 ? 2 : value >= 19 ? 3 : 4
    case 'O2':
      return value >= 20.9 ? 1 : value >= 19.9 ? 2 : value >= 19.5 ? 3 : 4
    default:
      return 4
  }
}

// 获取危险等级文本
const getRiskLevelText = (level: number) => {
  const levelMap: Record<number, string> = {
    1: '极高危险',
    2: '危险',
    3: '预警',
    4: '安全',
  }
  return levelMap[level] || '未知'
}

// 获取危险等级标签样式类型
const getLevelTagType = (level: number) => {
  const typeMap: Record<number, string> = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'info',
  }
  return typeMap[level] || 'info'
}

// 获取历史数据
const fetchHistory = async () => {
  try {
    const res = await reqWarningHistoryList()
    if (res.code === 200) {
      historyList.value = res.data.sort(
        (a: HistoryItem, b: HistoryItem) =>
          new Date(b.warningTime).getTime() - new Date(a.warningTime).getTime(),
      )
      renderCharts()
    }
  } catch (error) {
    console.error('获取历史数据失败：', error)
    ElMessage.error('网络异常，无法加载历史数据')
  }
}

// 删除单条记录
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条预警记录吗？', '删除确认', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const res = await reqDeleteWarningHistory(id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchHistory()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error)
      ElMessage.error('删除异常，请稍后重试')
    }
  }
}
</script>

<style scoped>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 主容器样式 */
.container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 20px;
  background: transparent;
  min-height: 100vh;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 通用卡片样式 - 玻璃拟态科技风 */
.card {
  border-radius: 12px;
  background: rgba(10, 25, 50, 0.75) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(64, 224, 208, 0.2) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  transition: all 0.3s ease;
  overflow: hidden;
}

.card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6) !important;
  border-color: rgba(64, 224, 208, 0.4) !important;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: #40e0d0;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 0 10px rgba(64, 224, 208, 0.3);
}

/* 气体等级划分区域 */
.level-card {
  padding: 0;
}

.gas-tabs {
  padding: 20px 20px 0;
}

.radio-group {
  display: flex;
  gap: 4px;
  background-color: #f8fafc;
  padding: 8px;
  border-radius: 8px;
}

:deep(.radio-group .el-radio-button__inner) {
  border-radius: 6px !important;
  padding: 8px 20px;
}

.table-container {
  padding: 20px;
  overflow-x: auto;
}

.level-table {
  --el-table-row-hover-bg-color: #f1f5f9;
  font-size: 14px;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.level-table .el-table__header) {
  background-color: #f8fafc;
}

:deep(.level-table .el-table__cell) {
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.cell-content {
  line-height: 1.6;
}

/* 预警色标签样式 */
.color-tag {
  width: 80px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 6px;
  font-weight: 600;
  color: white;
}

.color-tag.danger {
  background-color: #e53e3e;
  box-shadow: 0 2px 4px rgba(229, 62, 62, 0.3);
}

.color-tag.warning {
  background-color: #ed8936;
  box-shadow: 0 2px 4px rgba(237, 137, 54, 0.3);
}

.color-tag.primary {
  background-color: #ecc94b;
  color: #2d3748;
  box-shadow: 0 2px 4px rgba(236, 201, 75, 0.3);
}

.color-tag.info {
  background-color: #718096;
  box-shadow: 0 2px 4px rgba(113, 128, 150, 0.3);
}

/* ========== 优化后的预警历史记录样式 ========== */
.history-card {
  padding: 0;
}

.history-table {
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  --el-table-row-hover-bg-color: rgba(64, 224, 208, 0.1) !important;
  --el-table-border-color: rgba(66, 58, 58, 0.1) !important;
  font-size: 14px;
  border-radius: 8px;
  overflow: hidden;
  color: #ffffff;
}

:deep(.el-table) {
  background-color: transparent !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: rgba(171, 42, 42, 0.3) !important;
  color: #40e0d0 !important;
  border-bottom: 1px solid rgba(135, 117, 126, 0.3) !important;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(142, 163, 137, 0.1) !important;
}

:deep(.el-table__row:nth-child(even)) {
  background: rgba(255, 255, 255, 0.9) !important;
  color: #000 !important;
}
:deep(.el-table__row:nth-child(odd)) {
  background: rgba(0, 0, 0, 0.15) !important;
  color: #fff !important;
}

:deep(.level-danger) {
  background-color: rgba(229, 62, 62, 0.1) !important;
}
:deep(.level-warning) {
  background-color: rgba(237, 137, 54, 0.1) !important;
}
:deep(.level-primary) {
  background-color: rgba(236, 201, 75, 0.1) !important;
}
:deep(.level-info) {
  background-color: rgba(113, 128, 150, 0.1) !important;
}

.gas-tag {
  border-radius: 4px;
  font-weight: 500;
  color: #000000 !important;
}

.concentration-text {
  font-weight: 600;
  color: #bda9a9;
  font-size: 14px;
}

.level-tag {
  width: 100px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  border-radius: 6px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.level-tag.danger {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
}

.level-tag.warning {
  background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
}

.level-tag.primary {
  background: linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%);
  color: #2d3748;
}

.level-tag.info {
  background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
}

.delete-btn {
  border-radius: 6px;
  padding: 6px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: linear-gradient(90deg, #ff4d4f, #ff7875);
  border: none;
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
}

:deep(.delete-btn:hover) {
  transform: translateY(-2px);
  background: linear-gradient(90deg, #ff7875, #ff4d4f);
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.6);
  color: #fff;
}

/* 图表样式 */
.chart-card {
  margin: 0 20px 20px;
  padding: 15px;
}
.chart-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chart-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}
.chart-box {
  width: 100%;
  height: 360px;
  margin: 0 auto;
}

/* 响应式适配 */
@media (max-width: 1400px) {
  .history-table {
    font-size: 13px;
  }
  .level-tag {
    width: 80px;
    height: 28px;
    line-height: 28px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .card-title {
    font-size: 16px;
  }
  :deep(.radio-group) {
    flex-wrap: wrap;
  }
  .color-tag {
    height: 28px;
    line-height: 28px;
    font-size: 12px;
  }
  .delete-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
}

/* Detail polish */
.container {
  padding: clamp(16px, 2vw, 28px);
  color: #eef7fb;
}

.main-content {
  gap: 28px;
}

.card {
  border-radius: 8px;
  background:
    linear-gradient(160deg, rgba(8, 23, 40, 0.84), rgba(7, 34, 41, 0.68)),
    rgba(10, 25, 50, 0.62) !important;
  border-color: rgba(120, 211, 214, 0.22) !important;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32) !important;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(120, 211, 214, 0.42) !important;
  box-shadow: 0 22px 52px rgba(0, 0, 0, 0.38) !important;
}

.card-header {
  min-height: 74px;
  padding: 16px 24px;
  background: rgba(5, 18, 34, 0.62);
  border-bottom-color: rgba(120, 211, 214, 0.16);
}

.card-title {
  color: #40e0d0;
  letter-spacing: 0;
  text-shadow: 0 0 14px rgba(64, 224, 208, 0.26);
}

.video-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-toolbar :deep(.el-input) {
  width: 230px;
}

.video-toolbar :deep(.el-input__wrapper) {
  background: rgba(2, 12, 24, 0.62);
  box-shadow: 0 0 0 1px rgba(120, 211, 214, 0.22) inset;
}

.video-toolbar :deep(.el-input__inner) {
  color: #eef7fb;
}

.video-toolbar > span {
  padding: 7px 10px;
  border: 1px solid rgba(64, 224, 208, 0.28);
  border-radius: 999px;
  color: #7ee6d4;
  background: rgba(64, 224, 208, 0.08);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.monitor-source-note {
  margin: 16px 24px 0;
  padding: 11px 13px;
  border: 1px solid rgba(120, 211, 214, 0.16);
  border-radius: 8px;
  color: rgba(221, 239, 247, 0.7);
  background: rgba(2, 12, 24, 0.3);
  font-size: 13px;
  line-height: 1.6;
}

.video-container {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 18px 24px 24px;
}

.monitor-video-item {
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(120, 211, 214, 0.17);
  border-radius: 9px;
  background: rgba(2, 12, 24, 0.34);
}

.monitor-video-item > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 32px;
}

.monitor-video-item > header strong {
  overflow: hidden;
  color: #eef7fb;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monitor-video-item > header span {
  position: relative;
  padding-left: 11px;
  color: #66e4ae;
  font-size: 11px;
}

.monitor-video-item > header span::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #45d69d;
  box-shadow: 0 0 8px rgba(69, 214, 157, 0.8);
  content: '';
  transform: translateY(-50%);
}

.monitor-meta {
  display: flex;
  gap: 6px;
  margin: 5px 0 8px;
}

.monitor-meta span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  padding: 4px 6px;
  border: 1px solid rgba(120, 211, 214, 0.12);
  border-radius: 4px;
  color: rgba(221, 239, 247, 0.64);
  background: rgba(64, 224, 208, 0.05);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-frame {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid rgba(120, 211, 214, 0.2);
  border-radius: 7px;
  background: #02080e;
}

.video-frame video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-source-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  max-width: calc(100% - 16px);
  overflow: hidden;
  padding: 5px 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(2, 12, 24, 0.76);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.monitor-empty {
  margin: 18px 24px 24px;
  padding: 28px 20px;
  border: 1px dashed rgba(120, 211, 214, 0.24);
  border-radius: 8px;
  color: rgba(221, 239, 247, 0.62);
  text-align: center;
  background: rgba(2, 12, 24, 0.28);
}

.monitor-summary,
.history-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  padding: 18px 24px 0;
}

.summary-item,
.history-metric {
  min-height: 78px;
  padding: 14px 16px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(64, 224, 208, 0.1), rgba(230, 162, 60, 0.05)),
    rgba(2, 12, 24, 0.32);
  border: 1px solid rgba(120, 211, 214, 0.16);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
}

.summary-label,
.history-metric span {
  color: rgba(221, 239, 247, 0.68);
  font-size: 13px;
}

.summary-item strong,
.history-metric strong {
  color: #eef7fb;
  font-size: clamp(20px, 1.45vw, 28px);
  line-height: 1;
}

.summary-item.danger strong,
.history-metric.danger strong {
  color: #ff7875;
}

.history-metric.warning strong {
  color: #e6a23c;
}

.table-container {
  padding: 22px 24px;
}

.history-card :deep(.el-table),
.level-card :deep(.el-table) {
  background: transparent !important;
  border-radius: 8px;
  overflow: hidden;
}

.history-card :deep(.el-table__inner-wrapper::before),
.level-card :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.history-card :deep(.el-table th.el-table__cell),
.level-card :deep(.el-table th.el-table__cell) {
  background: rgba(5, 18, 34, 0.92) !important;
  color: #40e0d0 !important;
  border-bottom: 1px solid rgba(120, 211, 214, 0.22) !important;
}

.history-card :deep(.el-table td.el-table__cell),
.level-card :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid rgba(120, 211, 214, 0.08) !important;
  color: rgba(238, 247, 251, 0.88) !important;
}

.history-card :deep(.el-table__body tr:nth-child(even) > td.el-table__cell),
.level-card :deep(.el-table__body tr:nth-child(even) > td.el-table__cell),
.history-card
  :deep(
    .el-table--striped
      .el-table__body
      tr.el-table__row--striped
      > td.el-table__cell
  ),
.level-card
  :deep(
    .el-table--striped
      .el-table__body
      tr.el-table__row--striped
      > td.el-table__cell
  ) {
  background: rgba(255, 255, 255, 0.045) !important;
  color: rgba(238, 247, 251, 0.88) !important;
}

.history-card :deep(.el-table__body tr:nth-child(odd) > td.el-table__cell),
.level-card :deep(.el-table__body tr:nth-child(odd) > td.el-table__cell) {
  background: rgba(2, 12, 24, 0.36) !important;
  color: rgba(238, 247, 251, 0.88) !important;
}

.history-card :deep(.el-table__row.level-danger > td.el-table__cell),
.level-card :deep(.el-table__row.level-danger > td.el-table__cell) {
  background: rgba(255, 77, 79, 0.13) !important;
}

.history-card :deep(.el-table__row.level-warning > td.el-table__cell),
.level-card :deep(.el-table__row.level-warning > td.el-table__cell) {
  background: rgba(230, 162, 60, 0.12) !important;
}

.history-card :deep(.el-table__row.level-primary > td.el-table__cell),
.level-card :deep(.el-table__row.level-primary > td.el-table__cell) {
  background: rgba(236, 201, 75, 0.11) !important;
}

.history-card :deep(.el-table__row:nth-child(even)),
.level-card :deep(.el-table__row:nth-child(even)) {
  background: rgba(255, 255, 255, 0.045) !important;
  color: #eef7fb !important;
}

.history-card :deep(.el-table__row:nth-child(odd)),
.level-card :deep(.el-table__row:nth-child(odd)) {
  background: rgba(2, 12, 24, 0.36) !important;
  color: #eef7fb !important;
}

.history-card :deep(.el-table__row:hover > td.el-table__cell),
.level-card :deep(.el-table__row:hover > td.el-table__cell) {
  background: rgba(64, 224, 208, 0.09) !important;
}

.history-card :deep(.el-table__fixed-right),
.history-card :deep(.el-table__fixed-right-patch),
.history-card :deep(.el-table__fixed-right .el-table__fixed-body-wrapper),
.history-card :deep(.el-table__fixed-right .el-table__fixed-header-wrapper) {
  background: rgba(5, 18, 34, 0.96) !important;
}

.history-card :deep(.el-table__fixed-right td.el-table__cell),
.history-card :deep(.el-table__fixed-right th.el-table__cell) {
  background-clip: padding-box !important;
}

.gas-tag {
  border-radius: 999px;
  color: #0b1726 !important;
  font-weight: 700;
}

.concentration-text {
  color: #eef7fb;
  font-weight: 750;
}

.level-tag {
  width: 104px;
  border-radius: 8px;
  box-shadow: none;
}

.delete-btn {
  border-radius: 8px;
}

.chart-card {
  margin: 0 24px 24px;
  background: rgba(2, 12, 24, 0.26) !important;
}

.chart-title {
  color: #40e0d0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-card {
  margin-top: 28px;
}

.gas-tabs {
  padding: 20px 24px 0;
}

.radio-group {
  background: rgba(2, 12, 24, 0.34);
  border: 1px solid rgba(120, 211, 214, 0.14);
}

:deep(.radio-group .el-radio-button__inner) {
  background: transparent;
  color: rgba(221, 239, 247, 0.72);
  border-color: rgba(120, 211, 214, 0.14);
}

:deep(
  .radio-group
    .el-radio-button__original-radio:checked
    + .el-radio-button__inner
) {
  color: #06131f;
  background: #40e0d0;
  border-color: #40e0d0;
}

@media (max-width: 980px) {
  .card-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .monitor-summary,
  .history-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .video-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .video-toolbar {
    width: 100%;
  }

  .video-toolbar :deep(.el-input) {
    width: min(280px, 100%);
  }
}

@media (max-width: 560px) {
  .container {
    padding: 12px;
  }

  .monitor-summary,
  .history-summary {
    grid-template-columns: 1fr;
  }

  .video-container {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .video-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .video-toolbar > span {
    align-self: flex-start;
  }

  .monitor-source-note {
    margin: 14px 16px 0;
  }

  .table-container {
    padding: 16px;
  }

  .chart-card {
    margin: 0 16px 16px;
  }
}
</style>
