<template>
  <section class="monitor-directory">
    <header class="directory-header">
      <div>
        <p class="eyebrow">monitor_point</p>
        <h1>监测点目录</h1>
      </div>
      <button class="refresh-button" type="button" :disabled="loading" @click="loadMonitorPoints">
        <el-icon><Refresh /></el-icon>
        <span>{{ loading ? '刷新中' : '刷新' }}</span>
      </button>
    </header>

    <div class="summary-strip">
      <div class="summary-item">
        <span>总数</span>
        <strong>{{ monitorPoints.length }}</strong>
      </div>
      <div class="summary-item">
        <span>已绑定视频</span>
        <strong>{{ boundCameraCount }}</strong>
      </div>
      <div class="summary-item">
        <span>已绑定传感器</span>
        <strong>{{ boundSensorCount }}</strong>
      </div>
      <div class="summary-item">
        <span>来源边界</span>
        <strong>后端实体</strong>
      </div>
    </div>

    <div v-if="loadError" class="state-band error-state">
      {{ loadError }}
    </div>

    <div v-else-if="loading" class="state-band">
      正在读取后端监测点
    </div>

    <div v-else-if="monitorPoints.length === 0" class="state-band">
      暂无后端监测点实体
    </div>

    <div v-else class="monitor-grid">
      <article v-for="point in monitorPoints" :key="point.id" class="monitor-card">
        <div class="card-main">
          <div>
            <h2>{{ point.name }}</h2>
            <p>{{ point.areaName || '未配置区域' }}</p>
          </div>
          <span :class="statusClass(point.qualityStatus)" class="status-pill">
            {{ point.qualityStatus || 'UNBOUND' }}
          </span>
        </div>

        <dl class="meta-list">
          <div>
            <dt>监测点 ID</dt>
            <dd>{{ point.id }}</dd>
          </div>
          <div>
            <dt>监测来源</dt>
            <dd>{{ point.sourceType || '未配置' }}</dd>
          </div>
          <div>
            <dt>传感器</dt>
            <dd>{{ point.sensorId || '未绑定' }}</dd>
          </div>
          <div>
            <dt>视频源</dt>
            <dd>{{ point.cameraUrl ? '已绑定' : '未绑定' }}</dd>
          </div>
          <div>
            <dt>坐标</dt>
            <dd>{{ formatPoint(point) }}</dd>
          </div>
        </dl>

        <button class="open-button" type="button" @click="openMonitor(point.id)">
          <el-icon><VideoCamera /></el-icon>
          <span>查看详情</span>
        </button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, VideoCamera } from '@element-plus/icons-vue'
import { reqMonitorPointList } from '@/api/monitorPoint'
import type { MonitorPoint } from '@/api/monitorPoint'

const router = useRouter()
const monitorPoints = ref<MonitorPoint[]>([])
const loading = ref(false)
const loadError = ref('')

const boundCameraCount = computed(() => monitorPoints.value.filter(point => Boolean(point.cameraUrl)).length)
const boundSensorCount = computed(() => monitorPoints.value.filter(point => Boolean(point.sensorId)).length)

const loadMonitorPoints = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await reqMonitorPointList()
    if (!response.ok) {
      throw new Error(response.message || '监测点读取失败')
    }
    monitorPoints.value = response.data ?? []
  } catch (error) {
    const message = error instanceof Error ? error.message : '监测点读取失败'
    loadError.value = message
    monitorPoints.value = []
  } finally {
    loading.value = false
  }
}

const statusClass = (qualityStatus: MonitorPoint['qualityStatus']) => {
  if (qualityStatus === 'VERIFIED' || qualityStatus === 'CONFIGURED') return 'status-good'
  if (qualityStatus === 'SIMULATED') return 'status-simulated'
  return 'status-unbound'
}

const formatPoint = (point: MonitorPoint) => {
  if (point.x == null || point.y == null) return '未配置'
  return `${point.x.toFixed(1)}, ${point.y.toFixed(1)}`
}

const openMonitor = (id: number) => {
  router.push({ name: 'MonitorDetail', params: { id } })
}

onMounted(() => {
  void loadMonitorPoints()
})
</script>

<style scoped>
.monitor-directory {
  min-height: calc(100vh - 96px);
  padding: clamp(18px, 2vw, 30px);
  color: #eef7fb;
  background:
    radial-gradient(circle at 12% 10%, rgba(64, 224, 208, 0.14), transparent 32%),
    radial-gradient(circle at 92% 4%, rgba(230, 162, 60, 0.12), transparent 30%),
    linear-gradient(135deg, rgba(3, 12, 24, 0.86), rgba(7, 28, 38, 0.78));
}

.directory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 20px 24px;
  border: 1px solid rgba(120, 211, 214, 0.2);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(9, 25, 45, 0.92), rgba(7, 34, 41, 0.78)),
    rgba(10, 25, 50, 0.72);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.28);
}

.eyebrow {
  margin: 0 0 4px;
  color: rgba(64, 224, 208, 0.78);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  color: #eef7fb;
  font-size: clamp(24px, 1.8vw, 34px);
  line-height: 1.25;
  letter-spacing: 0;
  text-shadow: 0 0 18px rgba(64, 224, 208, 0.2);
}

.refresh-button,
.open-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.refresh-button {
  min-width: 94px;
  height: 42px;
  padding: 10px 16px;
  color: #06131f;
  background: linear-gradient(135deg, #40e0d0, #8ef6ed);
  box-shadow: 0 10px 26px rgba(64, 224, 208, 0.18);
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-item {
  min-height: 88px;
  padding: 16px 18px;
  border: 1px solid rgba(120, 211, 214, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(64, 224, 208, 0.09), rgba(230, 162, 60, 0.05)),
    rgba(2, 12, 24, 0.38);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.2);
}

.summary-item span {
  display: block;
  color: rgba(221, 239, 247, 0.68);
  font-size: 13px;
}

.summary-item strong {
  display: block;
  margin-top: 6px;
  color: #eef7fb;
  font-size: clamp(22px, 1.55vw, 30px);
  line-height: 1;
}

.state-band {
  padding: 20px;
  border: 1px solid rgba(120, 211, 214, 0.18);
  border-radius: 8px;
  color: rgba(221, 239, 247, 0.72);
  background: rgba(2, 12, 24, 0.38);
}

.error-state {
  color: #ffb4b1;
  border-color: rgba(255, 120, 117, 0.3);
  background: rgba(255, 77, 79, 0.12);
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 16px;
}

.monitor-card {
  display: flex;
  min-height: 286px;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(120, 211, 214, 0.2);
  border-radius: 8px;
  background:
    linear-gradient(160deg, rgba(8, 23, 40, 0.84), rgba(7, 34, 41, 0.68)),
    rgba(10, 25, 50, 0.62);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.monitor-card:hover {
  transform: translateY(-2px);
  border-color: rgba(64, 224, 208, 0.42);
  box-shadow: 0 22px 52px rgba(0, 0, 0, 0.38);
}

.card-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

h2 {
  margin: 0;
  color: #eef7fb;
  font-size: 18px;
  line-height: 1.35;
}

.card-main p {
  margin: 6px 0 0;
  color: #9bdfff;
}

.status-pill {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-good {
  color: #40e0d0;
  border: 1px solid rgba(64, 224, 208, 0.32);
  background: rgba(64, 224, 208, 0.1);
}

.status-simulated {
  color: #e6a23c;
  border: 1px solid rgba(230, 162, 60, 0.32);
  background: rgba(230, 162, 60, 0.1);
}

.status-unbound {
  color: rgba(221, 239, 247, 0.66);
  border: 1px solid rgba(221, 239, 247, 0.16);
  background: rgba(255, 255, 255, 0.06);
}

.meta-list {
  display: grid;
  gap: 8px;
  margin: 0;
}

.meta-list div {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 10px;
  min-height: 28px;
  align-items: center;
  padding: 4px 8px;
  border: 1px solid rgba(120, 211, 214, 0.1);
  border-radius: 6px;
  background: rgba(2, 12, 24, 0.22);
}

.meta-list dt,
.meta-list dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
}

.meta-list dt {
  color: rgba(221, 239, 247, 0.62);
}

.meta-list dd {
  color: #eef7fb;
  font-weight: 650;
}

.open-button {
  width: 100%;
  height: 42px;
  padding: 10px 12px;
  color: #06131f;
  background: linear-gradient(135deg, #40e0d0, #8ef6ed);
}

@media (max-width: 760px) {
  .monitor-directory {
    padding: 16px;
  }

  .directory-header {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
