<template>
  <main class="not-found-page">
    <section class="not-found-panel">
      <div class="status-mark">
        <span class="status-code">404</span>
        <span class="status-line"></span>
      </div>

      <div class="copy">
        <p class="eyebrow">PAGE NOT FOUND</p>
        <h1>页面不存在</h1>
        <p class="summary">
          当前地址无效或页面已下线，请返回系统首页或进入数字园区继续查看园区安全态势。
        </p>
      </div>

      <div class="actions">
        <el-button class="ghost-action" :icon="ArrowLeft" @click="goBack">
          返回上一页
        </el-button>
        <el-button class="primary-action" :icon="House" @click="goHome">
          回到首页
        </el-button>
        <el-button class="ghost-action" :icon="Platform" @click="goTwin">
          数字园区
        </el-button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft, House, Platform } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

defineOptions({
  name: 'NotFound',
})

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/home')
}

const goHome = () => {
  router.push('/home')
}

const goTwin = () => {
  router.push('/screen')
}
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  box-sizing: border-box;
  background:
    linear-gradient(135deg, rgba(10, 25, 47, 0.96), rgba(17, 34, 64, 0.92)),
    url('@/assets/images/background2.jpg') center/cover no-repeat;
  color: #e6f7ff;
}

.not-found-panel {
  width: min(880px, 100%);
  min-height: 380px;
  padding: 54px 58px;
  box-sizing: border-box;
  border: 1px solid rgba(64, 224, 208, 0.32);
  background: rgba(10, 25, 47, 0.78);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(12px);
}

.status-mark {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 34px;
}

.status-code {
  color: #40e0d0;
  font-size: 88px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
}

.status-line {
  width: min(280px, 38vw);
  height: 2px;
  background: linear-gradient(90deg, rgba(64, 224, 208, 0.95), rgba(64, 224, 208, 0));
}

.copy {
  max-width: 640px;
}

.eyebrow {
  margin: 0 0 12px;
  color: rgba(64, 224, 208, 0.86);
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 0;
  color: #fff;
  font-size: 34px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: 0;
}

.summary {
  margin: 18px 0 0;
  color: rgba(230, 247, 255, 0.78);
  font-size: 16px;
  line-height: 1.8;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 38px;
}

.primary-action,
.ghost-action {
  height: 42px;
  padding: 0 18px;
  border-radius: 4px;
  font-weight: 600;
}

.primary-action {
  border-color: #40e0d0;
  background: #40e0d0;
  color: #0a192f;
}

.primary-action:hover,
.primary-action:focus {
  border-color: #69fff0;
  background: #69fff0;
  color: #0a192f;
}

.ghost-action {
  border-color: rgba(64, 224, 208, 0.45);
  background: rgba(64, 224, 208, 0.08);
  color: #e6f7ff;
}

.ghost-action:hover,
.ghost-action:focus {
  border-color: #40e0d0;
  background: rgba(64, 224, 208, 0.16);
  color: #fff;
}

@media (max-width: 640px) {
  .not-found-page {
    padding: 18px;
  }

  .not-found-panel {
    min-height: auto;
    padding: 36px 24px;
  }

  .status-code {
    font-size: 64px;
  }

  .status-line {
    flex: 1;
    width: auto;
  }

  h1 {
    font-size: 26px;
  }

  .actions {
    flex-direction: column;
  }

  .primary-action,
  .ghost-action {
    width: 100%;
  }
}
</style>
