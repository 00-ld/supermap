<script setup lang="ts" name="Login">
import { User, Lock } from '@element-plus/icons-vue'
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()

const loginForms = ref<FormInstance>()
const $router = useRouter()
const $route = useRoute()

const loading = ref(false)
const isUsernameFocus = ref(false)
const isPasswordFocus = ref(false)

interface LoginForm {
  username: string
  password: string
}

const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
})

const validatorUserName = (
  _rule: unknown,
  value: string,
  callback: (error?: string | Error) => void,
) => {
  if (value.length >= 5) {
    callback()
  } else {
    callback(new Error('账号长度不能少于 5 位'))
  }
}

const validatorPassword = (
  _rule: unknown,
  value: string,
  callback: (error?: string | Error) => void,
) => {
  if (value.length >= 6) {
    callback()
  } else {
    callback(new Error('密码长度不能少于 6 位'))
  }
}

const rules: FormRules<LoginForm> = {
  username: [{ trigger: 'change', validator: validatorUserName }],
  password: [{ trigger: 'change', validator: validatorPassword }],
}

const login = async () => {
  try {
    await loginForms.value?.validate()
  } catch {
    ElNotification({
      type: 'warning',
      message: '请检查账号和密码',
      title: '校验未通过',
    })
    return
  }

  loading.value = true

  try {
    await userStore.userLogin(loginForm)
    const redirect = $route.query.redirect as string | undefined
    $router.push({ path: redirect || '/home' })
  } catch (error: unknown) {
    ElNotification.error(error instanceof Error ? error.message : '登录失败')
  } finally {
    loading.value = false
  }
}

const goRegister = () => {
  $router.push({ path: '/register' })
}
</script>

<template>
  <div class="login-container">
    <div class="mask-layer"></div>

    <!-- 左侧品牌区 -->
    <div class="theme-logo">
      <div class="logo-icon-wrapper">
        <div class="logo-icon">
          <i class="iconfont">⬡</i>
        </div>
        <div class="icon-glow"></div>
      </div>

      <div class="logo-title-group">
        <div class="logo-badge">超图杯参赛作品</div>
        <div class="logo-title">
          <span class="title-gradient">时空智能 · 数字孪生</span>
        </div>
        <div class="logo-subtitle">化工园区危险气体监测与溯源系统</div>
        <div class="logo-desc">
          基于时空智能与数字孪生技术，融合气体扩散模拟、泄漏源溯源、逃生路径规划与三维态势展示，实现化工园区全域感知与精准研判。
        </div>
        <div class="feature-row">
          <div class="feature-tag">
            <span class="dot"></span>扩散模拟
          </div>
          <div class="feature-tag">
            <span class="dot"></span>泄漏溯源
          </div>
          <div class="feature-tag">
            <span class="dot"></span>路径规划
          </div>
          <div class="feature-tag">
            <span class="dot"></span>三维态势
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录卡 -->
    <div class="login-box">
      <div class="card-highlight"></div>
      <div class="login-header">
        <div class="login-title">系统登录</div>
        <div class="login-subtitle">欢迎使用化工园区气体监测与溯源系统</div>
      </div>

      <el-form ref="loginForms" :rules="rules" :model="loginForm" class="login-form">
        <el-form-item prop="username" class="form-item">
          <div class="input-label">账号</div>
          <el-input
            size="large"
            v-model="loginForm.username"
            :prefix-icon="User"
            placeholder="请输入账号"
            class="login-input"
            :class="{ 'input-focus': isUsernameFocus }"
            @focus="isUsernameFocus = true"
            @blur="isUsernameFocus = false"
          />
        </el-form-item>

        <el-form-item prop="password" class="form-item">
          <div class="input-label">密码</div>
          <el-input
            show-password
            size="large"
            v-model="loginForm.password"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            class="login-input"
            :class="{ 'input-focus': isPasswordFocus }"
            @focus="isPasswordFocus = true"
            @blur="isPasswordFocus = false"
          />
        </el-form-item>

        <el-form-item class="login-btn-item">
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            @click="login"
            class="login-btn"
            :loading="loading"
          >
            登 录
          </el-button>
        </el-form-item>

        <div class="register-tip">
          还没有账号？<a @click="goRegister">立即注册</a>
        </div>
      </el-form>

      <div class="footer-copy">© 2026 时空智能与数字孪生 · 化工园区气体监测溯源</div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  overflow: hidden;
  background-image: url('/登录背景图.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  position: relative;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.mask-layer {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 28, 58, 0.7);
  backdrop-filter: blur(2px);
  z-index: 1;
}

/* ====================== 左侧品牌区 ====================== */
.theme-logo {
  position: absolute;
  z-index: 3;
  left: 8%;
  top: 50%;
  transform: translateY(-50%);
  color: #ffffff;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 26px;
}

.logo-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 64px;
  color: #6ee7ff;
  filter: drop-shadow(0 0 18px rgba(110, 231, 255, 0.65));
  position: relative;
  z-index: 2;
  animation: iconFloat 4s ease-in-out infinite;
}

.icon-glow {
  position: absolute;
  width: 110px;
  height: 110px;
  background: radial-gradient(circle, rgba(110, 231, 255, 0.28) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 1;
  animation: glowPulse 4s ease-in-out infinite;
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.25);
    opacity: 0.3;
  }
}

.logo-title-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.logo-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 5px 14px;
  font-size: 13px;
  letter-spacing: 2px;
  color: #6ee7ff;
  background: rgba(110, 231, 255, 0.1);
  border: 1px solid rgba(110, 231, 255, 0.4);
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.logo-title {
  font-size: 50px;
  font-weight: 800;
  letter-spacing: 3px;
  line-height: 1.15;
}

.title-gradient {
  background: linear-gradient(90deg, #6ee7ff 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(110, 231, 255, 0.35);
}

.logo-subtitle {
  font-size: 24px;
  color: #d6e8ff;
  font-weight: 600;
  letter-spacing: 2px;
  opacity: 0.95;
}

.logo-desc {
  font-size: 15px;
  color: #9fb8d4;
  opacity: 0.9;
  letter-spacing: 0.5px;
  line-height: 1.8;
  padding: 6px 0 6px 16px;
  border-left: 3px solid rgba(110, 231, 255, 0.6);
  max-width: 540px;
}

.feature-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 4px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  color: #b8d4ee;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(4px);
}

.feature-tag .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6ee7ff;
  box-shadow: 0 0 6px #6ee7ff;
}

/* ====================== 登录卡 ====================== */
.login-box {
  position: absolute;
  z-index: 3;
  top: 50%;
  right: 8%;
  transform: translateY(-50%);
  width: 440px;
  background: linear-gradient(160deg, rgba(12, 30, 64, 0.85) 0%, rgba(6, 20, 48, 0.78) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(110, 231, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  padding: 52px 42px 36px;
  box-sizing: border-box;
  overflow: hidden;
}

.card-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, #6ee7ff 50%, transparent 100%);
  opacity: 0.8;
}

.login-header {
  text-align: center;
  margin-bottom: 38px;
}

.login-title {
  font-size: 30px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10px;
  letter-spacing: 2px;
  text-shadow: 0 0 18px rgba(110, 231, 255, 0.3);
}

.login-subtitle {
  font-size: 13px;
  color: #8fa8c4;
  letter-spacing: 1px;
}

.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 22px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: #c9d8ee;
  margin-bottom: 8px;
  display: block;
  letter-spacing: 0.5px;
}

.login-input {
  width: 100%;
  height: 50px;
  border-radius: 10px;
}

:deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.25) !important;
  border-radius: 10px;
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:focus-within) {
  border-color: #6ee7ff !important;
  box-shadow: 0 0 0 3px rgba(110, 231, 255, 0.15) !important;
  background-color: rgba(6, 182, 212, 0.08) !important;
}

:deep(.el-input__inner) {
  color: #fff !important;
  height: 50px;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.45) !important;
}

:deep(.el-input__prefix) {
  color: #6ee7ff;
}

.login-btn-item {
  margin-bottom: 14px;
  margin-top: 8px;
}

.login-btn {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%) !important;
  border: none !important;
  font-weight: 600;
  height: 52px;
  font-size: 16px;
  letter-spacing: 4px;
  border-radius: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.35);
}

.login-btn:hover {
  background: linear-gradient(135deg, #0bbfe0 0%, #4f93f8 100%) !important;
  box-shadow: 0 8px 26px rgba(6, 182, 212, 0.5);
  transform: translateY(-2px);
}

.login-btn:active {
  transform: translateY(0);
}

.register-tip {
  text-align: center;
  font-size: 14px;
  color: #8fa8c4;
  margin-top: 12px;
}

.register-tip a {
  color: #6ee7ff;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.register-tip a:hover {
  color: #fff;
  text-shadow: 0 0 8px rgba(110, 231, 255, 0.6);
}

.footer-copy {
  text-align: center;
  font-size: 11px;
  color: rgba(143, 168, 196, 0.5);
  margin-top: 28px;
  letter-spacing: 0.5px;
}

@media (max-width: 1200px) {
  .theme-logo {
    display: none;
  }
  .login-box {
    right: 50%;
    transform: translate(50%, -50%);
  }
}

@media (max-width: 480px) {
  .login-box {
    width: 92%;
    padding: 40px 24px 28px;
    border-radius: 16px;
  }
  .login-title {
    font-size: 24px;
  }
}
</style>
