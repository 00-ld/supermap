<template>
  <Transition name="device-fullscreen">
    <div v-if="visible" class="device-fullscreen-overlay" @click.self="emit('close')">
      <div class="device-fullscreen-card">
        <button class="device-fullscreen-close" title="关闭" @click="emit('close')">
          <i class="fas fa-times"></i>
        </button>
        <div
          class="device-fullscreen-img-wrap"
          @wheel.prevent="emit('wheel', $event)"
          @mousedown="emit('drag-start', $event)"
          @mousemove="emit('drag-move', $event)"
          @mouseup="emit('drag-end')"
          @mouseleave="emit('drag-end')"
          @dblclick="emit('double-click')"
        >
          <img
            :src="data.image"
            class="device-fullscreen-img"
            :style="{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)` }"
            draggable="false"
          />
          <div class="device-img-zoom-bar">
            <button class="df-zoom-btn" title="放大" @click.stop="emit('zoom-in')"><i class="fas fa-plus"></i></button>
            <span class="df-zoom-val">{{ Math.round(zoom * 100) }}%</span>
            <button class="df-zoom-btn" title="缩小" @click.stop="emit('zoom-out')"><i class="fas fa-minus"></i></button>
            <div class="df-zoom-divider"></div>
            <button class="df-zoom-btn" title="重置视图" @click.stop="emit('zoom-reset')"><i class="fas fa-crosshairs"></i></button>
          </div>
          <div v-if="zoom <= 1" class="device-img-hint">
            <i class="fas fa-mouse-pointer"></i> 滚轮缩放 · 双击放大 · 拖拽平移
          </div>
        </div>
        <div class="device-fullscreen-info">
          <div class="df-info-head">
            <div class="df-info-icon"><i class="fas fa-microchip"></i></div>
            <div>
              <div class="device-fullscreen-title">{{ data.deviceName }}</div>
              <div class="df-info-subtitle">{{ data.location }}</div>
            </div>
          </div>
          <div class="df-info-divider"></div>
          <div class="device-fullscreen-row">
            <span class="df-label"><i class="fas fa-signal df-label-icon"></i> 设备状态</span>
            <span class="df-badge df-badge-online"><span class="df-badge-dot"></span>在线运行</span>
          </div>
          <div class="device-fullscreen-row">
            <span class="df-label"><i class="fas fa-shield-halved df-label-icon"></i> 报警状态</span>
            <span class="df-badge df-badge-safe"><i class="fas fa-check" style="font-size:9px;margin-right:2px;"></i>正常</span>
          </div>
          <div class="device-fullscreen-row">
            <span class="df-label"><i class="fas fa-wave-square df-label-icon"></i> 实时浓度</span>
            <span class="df-conc">{{ data.concentration }}</span>
          </div>
          <div class="df-info-divider"></div>
          <div class="df-std-block">
            <div class="df-std-head"><i class="fas fa-book-open"></i> 安装标准依据</div>
            <div class="df-std-text">{{ data.standard }}</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { SmartMapDeviceImageCard } from '../useSmartMapDeviceImage'

defineOptions({
  name: 'SmartMapDeviceFullscreen',
})

withDefaults(defineProps<{
  visible: boolean
  data: SmartMapDeviceImageCard
  zoom: number
  panX: number
  panY: number
}>(), {
  data: () => ({}),
})

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'wheel', value: WheelEvent): void
  (event: 'drag-start', value: MouseEvent): void
  (event: 'drag-move', value: MouseEvent): void
  (event: 'drag-end'): void
  (event: 'double-click'): void
  (event: 'zoom-in'): void
  (event: 'zoom-out'): void
  (event: 'zoom-reset'): void
}>()
</script>

<style scoped>
.device-fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(ellipse at 30% 40%, rgba(154,168,184,0.06) 0%, rgba(0,0,0,0.88) 60%);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}
.device-fullscreen-card {
  position: relative;
  display: flex;
  max-width: 1200px;
  width: 94vw;
  max-height: 90vh;
  background: linear-gradient(135deg, #141e2b 0%, #1a2738 50%, #162030 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05);
}
.device-fullscreen-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.7);
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.device-fullscreen-close:hover {
  background: rgba(199,130,130,0.22);
  border-color: rgba(199,130,130,0.30);
  color: #d6a0a0;
  transform: rotate(90deg);
}
.device-fullscreen-img-wrap {
  flex: 0 0 65%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060a12;
  position: relative;
  cursor: grab;
  user-select: none;
}
.device-fullscreen-img-wrap::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(6,10,18,0.5) 0%, transparent 15%, transparent 85%, rgba(6,10,18,0.6) 100%),
    linear-gradient(90deg, rgba(6,10,18,0.3) 0%, transparent 10%, transparent 90%, rgba(6,10,18,0.3) 100%);
}
.device-fullscreen-img-wrap::after {
  content: '';
  position: absolute;
  inset: -1px;
  pointer-events: none;
  z-index: 3;
  border-radius: 0;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(154,168,184,0.12), transparent 40%, transparent 60%, rgba(147,167,189,0.08)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
.device-fullscreen-img-wrap:active { cursor: grabbing; }
.device-fullscreen-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s cubic-bezier(0.33,1,0.68,1);
  transform-origin: center center;
  filter: brightness(1.02) contrast(1.03);
}
.device-img-zoom-bar {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(8,12,20,0.8);
  backdrop-filter: blur(20px) saturate(1.4);
  border-radius: 14px;
  padding: 4px 8px;
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  z-index: 5;
}
.df-zoom-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.5);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.df-zoom-btn:hover {
  background: rgba(154,168,184,0.12);
  color: #c6d0dc;
  transform: scale(1.08);
}
.df-zoom-btn:active { transform: scale(0.95); }
.df-zoom-divider {
  width: 1px;
  height: 18px;
  background: rgba(255,255,255,0.07);
  margin: 0 4px;
}
.df-zoom-val {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  min-width: 42px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.3px;
}
.device-img-hint {
  position: absolute;
  top: 18px;
  left: 18px;
  font-size: 11px;
  color: rgba(255,255,255,0.25);
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(12px);
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.05);
  z-index: 5;
  pointer-events: none;
  letter-spacing: 0.3px;
}
.device-img-hint i {
  margin-right: 5px;
  color: rgba(154,168,184,0.46);
}
.device-fullscreen-info {
  flex: 1;
  padding: 36px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  min-width: 0;
}
.df-info-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
}
.df-info-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(154,168,184,0.12), rgba(147,167,189,0.08));
  border: 1px solid rgba(154,168,184,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c6d0dc;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(154,168,184,0.08), inset 0 1px 0 rgba(255,255,255,0.05);
  position: relative;
}
.df-info-icon::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 18px;
  background: radial-gradient(circle, rgba(154,168,184,0.08), transparent 70%);
  pointer-events: none;
}
.device-fullscreen-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  letter-spacing: -0.5px;
}
.df-info-subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.df-info-subtitle::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
}
.df-info-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  margin: 18px 0;
}
.device-fullscreen-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 12px 0;
}
.df-label {
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.df-label-icon {
  font-size: 13px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.df-label-icon.fa-signal {
  background: rgba(154,168,184,0.10);
  color: #c6d0dc;
}
.df-label-icon.fa-shield-halved {
  background: rgba(147,167,189,0.10);
  color: #b4beca;
}
.df-label-icon.fa-wave-square {
  background: rgba(154,168,184,0.10);
  color: #aab6c4;
}
.df-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.df-badge-online {
  background: rgba(154,168,184,0.08);
  color: #c6d0dc;
  border: 1px solid rgba(154,168,184,0.12);
  box-shadow: 0 0 12px rgba(154,168,184,0.06);
}
.df-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9aa8b8;
  box-shadow: 0 0 6px rgba(154,168,184,0.42);
  animation: df-pulse 2s ease-in-out infinite;
}
@keyframes df-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(154,168,184,0.42), 0 0 0 0 rgba(154,168,184,0.26); }
  50% { opacity: 0.75; box-shadow: 0 0 4px rgba(154,168,184,0.26), 0 0 0 5px rgba(154,168,184,0); }
}
.df-badge-safe {
  background: rgba(147,167,189,0.08);
  color: #b4beca;
  border: 1px solid rgba(147,167,189,0.12);
  box-shadow: 0 0 12px rgba(147,167,189,0.06);
}
.df-conc {
  font-family: 'JetBrains Mono', 'Orbitron', monospace;
  font-size: 16px;
  font-weight: 600;
  color: #c6d0dc;
  letter-spacing: 0.5px;
  text-shadow: 0 0 12px rgba(154,168,184,0.16);
}
.df-std-block {
  background: linear-gradient(135deg, rgba(147,167,189,0.03), rgba(154,168,184,0.02));
  border: 1px solid rgba(147,167,189,0.06);
  border-radius: 12px;
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}
.df-std-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #93a7bd, #7f8d9d);
  border-radius: 0 2px 2px 0;
}
.df-std-head {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.df-std-head i { font-size: 11px; color: #93a7bd; }
.df-std-text {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  padding-left: 2px;
}
.device-fullscreen-enter-active { transition: opacity 0.3s ease; }
.device-fullscreen-leave-active { transition: opacity 0.2s ease; }
.device-fullscreen-enter-from,
.device-fullscreen-leave-to { opacity: 0; }
.device-fullscreen-enter-active .device-fullscreen-card {
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease;
}
.device-fullscreen-enter-from .device-fullscreen-card {
  transform: scale(0.92);
  opacity: 0;
}
</style>
