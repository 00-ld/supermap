<template>
  <div class="emergency-command-center">
    <div class="top-status-bar">
      <div class="status-left">
        <h2 class="page-title">应急指挥中心 v2.0</h2>
        <div class="emergency-level" :class="currentEmergencyLevel">
          <el-icon><Warning /></el-icon>
          <span>{{ getEmergencyLevelText() }}</span>
        </div>
      </div>
      <div class="status-center">
        <div class="time-display">
          <el-icon><Clock /></el-icon>
          <span>{{ currentTime }}</span>
        </div>
        <div class="weather-info">
          <el-icon><Sunny /></el-icon>
          <span>{{ weatherText }}</span>
        </div>
      </div>
      <div class="status-right">
        <el-button type="danger" :icon="Bell" @click="triggerEmergency" :loading="emergencyLoading">触发应急</el-button>
        <el-button type="success" :icon="Switch" @click="resetEmergency">解除警报</el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><DataAnalysis /></el-icon>监测状态与最新读数</span>
              <el-button type="text" :icon="Refresh" @click="refreshMonitoringData" />
            </div>
          </template>
          <div class="monitoring-grid">
            <div class="monitor-item" v-for="car in carList" :key="car.id">
              <div class="monitor-header">
                <span class="car-name">小车{{ car.id }}</span>
                <el-tag :type="car.status === 'warning' ? 'danger' : 'success'" size="small">{{ car.status === 'warning' ? '异常' : '正常' }}</el-tag>
              </div>
              <div class="monitor-data">
                <div class="data-row"><span class="data-label">位置:</span><span class="data-value">({{ car.x }}, {{ car.y }})</span></div>
                <div class="data-row"><span class="data-label">气体:</span><span class="data-value">{{ getGasType(car.id) }}</span></div>
                <div class="data-row"><span class="data-label">最新读数:</span><span class="data-value" :class="{ 'warning': car.status === 'warning' }">{{ getGasValue(car.id) }}</span></div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="card-header"><span class="card-title"><el-icon><Clock /></el-icon>预警历史</span></div>
          </template>
          <div class="history-list">
            <div class="history-item" v-for="(item, index) in recentHistory" :key="index" :class="{ 'high-risk': getRiskLevel(item) === 'high' }">
              <div class="history-time">{{ formatTime(item.warningTime) }}</div>
              <div class="history-content">
                <div class="history-location">{{ item.areaName }}</div>
                <div class="history-detail">{{ item.gasType }}: {{ item.gasValue }}</div>
              </div>
              <el-tag :type="getRiskLevel(item) === 'high' ? 'danger' : 'warning'" size="small">{{ getRiskLevel(item) === 'high' ? '高危' : '预警' }}</el-tag>
            </div>
          </div>
        </el-card>

        <el-card class="panel-card safety-panel" shadow="hover" v-if="safetyAnalysisVisible">
          <template #header>
            <div class="card-header"><span class="card-title"><el-icon><Lock /></el-icon>安全分析报告</span></div>
          </template>
          <div class="safety-grid">
            <div class="safety-item" :class="{ 'safe': currentSafety.isSafe, 'unsafe': !currentSafety.isSafe }">
              <div class="safety-label">路径安全性</div>
              <div class="safety-value">{{ currentSafety.isSafe ? '安全' : '警告' }}</div>
            </div>
            <div class="safety-item">
              <div class="safety-label">平均浓度</div>
              <div class="safety-value">{{ currentSafety.avgConcentration?.toFixed(1) || 0 }} ppm</div>
            </div>
            <div class="safety-item">
              <div class="safety-label">峰值浓度</div>
              <div class="safety-value">{{ currentSafety.maxConcentration?.toFixed(1) || 0 }} ppm</div>
            </div>
            <div class="safety-item">
              <div class="safety-label">安全比例</div>
              <div class="safety-value">{{ ((currentSafety.safeRatio || 0) * 100).toFixed(1) }}%</div>
            </div>
            <div class="safety-item full-width">
              <div class="safety-label">综合风险评分</div>
              <el-progress :percentage="Math.min(100, (currentSafety.riskScore || 0) / 10)" :status="currentSafety.riskScore < 50 ? 'success' : currentSafety.riskScore < 100 ? 'warning' : 'exception'" />
            </div>
          </div>
        </el-card>
      </div>

      <div class="center-panel">
        <el-card class="map-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title"><el-icon><Location /></el-icon>园区地图与路径规划</span>
              <div class="map-controls-top">
                <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
                  <el-radio-button value="global">全局概览</el-radio-button>
                  <el-radio-button value="local">局部细节</el-radio-button>
                  <el-radio-button value="path">路径聚焦</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div class="map-container" ref="mapContainer">
            <div class="map-2d" :class="'view-' + viewMode" :style="mapTransformStyle">
              <svg class="campus-map" viewBox="0 0 1200 600" width="1200" height="600" ref="svgMap">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>
                  </pattern>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto" fill="#ff0000">
                    <polygon points="0 0, 10 3.5, 0 7"/>
                  </marker>
                  <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#00ff00;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#ffff00;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ff0000;stop-opacity:1" />
                  </linearGradient>
                  <radialGradient id="leak-pulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:rgba(255,0,0,0.6);stop-opacity:1" />
                    <stop offset="70%" style="stop-color:rgba(255,0,0,0.3);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(255,0,0,0);stop-opacity:1" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <g class="roads">
                  <path d="M 100 300 L 1100 300" stroke="#444" stroke-width="8" fill="none" class="main-road"/>
                  <path d="M 250 180 L 850 180" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 250 240 L 850 240" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 250 360 L 850 360" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 250 440 L 850 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>

                  <path d="M 250 180 L 250 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 350 180 L 350 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 450 180 L 450 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 550 180 L 550 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 650 180 L 650 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 750 180 L 750 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 850 180 L 850 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>

                  <path d="M 600 100 L 600 300" stroke="#444" stroke-width="8" fill="none" class="main-road"/>
                  <path d="M 270 300 L 270 240 L 250 240" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 270 300 L 250 300 L 180 300" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>

                  <path d="M 400 240 L 450 240" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 350 200 L 350 180" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 700 240 L 650 240" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 750 200 L 750 180" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 800 240 L 850 240" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 400 440 L 450 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 350 400 L 350 360" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 700 440 L 650 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 750 400 L 750 360" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 800 440 L 850 440" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 600 230 L 600 240" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                  <path d="M 600 150 L 600 180" stroke="#666" stroke-width="5" fill="none" class="secondary-road"/>
                </g>

                <g class="buildings">
                  <rect x="300" y="200" width="100" height="80" fill="rgba(231,76,60,0.8)" stroke="#c0392b" stroke-width="2"/><text x="350" y="240" text-anchor="middle" dominant-baseline="middle">车间1</text>
                  <rect x="700" y="200" width="100" height="80" fill="rgba(231,76,60,0.8)" stroke="#c0392b" stroke-width="2"/><text x="750" y="240" text-anchor="middle" dominant-baseline="middle">车间2</text>
                  <rect x="550" y="150" width="100" height="80" fill="rgba(52,152,219,0.8)" stroke="#2980b9" stroke-width="2"/><text x="600" y="190" text-anchor="middle" dominant-baseline="middle">办公楼</text>
                  <rect x="300" y="400" width="100" height="80" fill="rgba(243,156,18,0.8)" stroke="#d35400" stroke-width="2"/><text x="350" y="440" text-anchor="middle" dominant-baseline="middle">仓库</text>
                  <rect x="700" y="400" width="100" height="80" fill="rgba(149,165,166,0.8)" stroke="#7f8c8d" stroke-width="2"/><text x="750" y="440" text-anchor="middle" dominant-baseline="middle">设备房</text>
                  <rect x="150" y="250" width="120" height="100" fill="rgba(155,89,182,0.8)" stroke="#8e44ad" stroke-width="2"/><text x="210" y="300" text-anchor="middle" dominant-baseline="middle">行政楼</text>
                </g>

                <g class="building-exits">
                  <circle cx="400" cy="240" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="350" cy="200" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="700" cy="240" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="750" cy="200" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="800" cy="240" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="400" cy="440" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="350" cy="400" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="700" cy="440" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="750" cy="400" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="800" cy="440" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="600" cy="230" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="600" cy="150" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                  <circle cx="270" cy="300" r="5" fill="#fff" stroke="#1f2937" stroke-width="2"/>
                </g>

                <g class="greenery">
                  <rect x="100" y="100" width="200" height="50" fill="rgba(144,238,144,0.6)" stroke="#228b22" stroke-width="1"/>
                  <rect x="900" y="100" width="200" height="50" fill="rgba(144,238,144,0.6)" stroke="#228b22" stroke-width="1"/>
                  <rect x="100" y="450" width="200" height="50" fill="rgba(144,238,144,0.6)" stroke="#228b22" stroke-width="1"/>
                  <rect x="900" y="450" width="200" height="50" fill="rgba(144,238,144,0.6)" stroke="#228b22" stroke-width="1"/>
                  <rect x="450" y="100" width="300" height="50" fill="rgba(144,238,144,0.6)" stroke="#228b22" stroke-width="1"/>
                </g>

                <g class="exit-points">
                  <circle cx="100" cy="300" r="12" fill="#44ff44" stroke="#228b22" stroke-width="3"/>
                  <text x="100" y="280" text-anchor="middle">出口1</text>
                  <circle cx="1100" cy="300" r="12" fill="#44ff44" stroke="#228b22" stroke-width="3"/>
                  <text x="1100" y="280" text-anchor="middle">出口2</text>
                  <circle cx="600" cy="100" r="12" fill="#44ff44" stroke="#228b22" stroke-width="3"/>
                  <text x="600" y="80" text-anchor="middle">出口3</text>
                </g>

                <g class="car-markers">
                  <circle v-for="car in carList" :key="car.id"
                          :cx="car.x" :cy="car.y" r="15"
                          :fill="car.status === 'warning' ? '#f56c6c' : '#67c23a'"
                          stroke="#fff" stroke-width="3"
                          @click="selectCar(car)"/>
                  <text v-for="car in carList" :key="'t'+car.id"
                        :x="car.x" :y="car.y"
                        text-anchor="middle" dominant-baseline="middle"
                        fill="#fff" font-weight="bold">{{ car.id }}</text>
                </g>

                <g v-if="gasDiffusionVisible && currentDiffusionFrame" class="gas-diffusion-layer">
                  <polygon v-for="(ps, idx) in currentDiffusionFrame.high" :key="'h'+idx"
                           :points="formatPolygonPoints(ps)"
                           :fill="currentGasColor + '55'"
                           :stroke="currentGasColor"
                           stroke-width="2" stroke-dasharray="4,2"
                           class="diffusion-polygon high-zone"
                           :class="{ 'animating': isAnimating }"/>
                  <polygon v-for="(ps, idx) in currentDiffusionFrame.medium" :key="'m'+idx"
                           :points="formatPolygonPoints(ps)"
                           :fill="currentGasColor + '35'"
                           :stroke="currentGasColor"
                           stroke-width="1.5"
                           class="diffusion-polygon medium-zone"
                           :class="{ 'animating': isAnimating }"/>
                  <polygon v-for="(ps, idx) in currentDiffusionFrame.low" :key="'l'+idx"
                           :points="formatPolygonPoints(ps)"
                           :fill="currentGasColor + '20'"
                           :stroke="currentGasColor"
                           stroke-width="1"
                           class="diffusion-polygon low-zone"
                           :class="{ 'animating': isAnimating }"/>
                </g>

                <g v-if="selectedLeakPoint" class="leak-indicator">
                  <circle :cx="getLeakPointX()" :cy="getLeakPointY()"
                          :r="isAnimating ? leakPulseRadius : 25"
                          fill="url(#leak-pulse)"
                          class="leak-pulse-circle"/>
                  <circle :cx="getLeakPointX()" :cy="getLeakPointY()" r="8"
                          fill="#ff0000" stroke="#fff" stroke-width="2"/>
                  <text :x="getLeakPointX()" :y="getLeakPointY() - 15"
                        text-anchor="middle" font-size="11" fill="#ff0000" font-weight="bold">泄漏点</text>
                </g>

                <g v-if="showEscapePath && escapePathData" class="escape-path-layer">
                  <path :d="escapePathData"
                        stroke="url(#path-gradient)"
                        stroke-width="14"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        filter="url(#glow)"
                        class="escape-path-main"/>

                  <path :d="escapePathData"
                        stroke="#ffffff"
                        stroke-width="4"
                        fill="none"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-dasharray="12,6"
                        class="escape-path-dashed"
                        :class="{ 'path-animated': isAnimating }"/>

                  <g v-for="(node, idx) in visiblePathNodes" :key="'node-'+idx" class="path-node">
                    <circle :cx="node.x" :cy="node.y"
                            :r="idx === 0 || idx === visiblePathNodes.length - 1 ? 10 : 6"
                            :fill="getNodeColor(idx, visiblePathNodes.length)"
                            stroke="#fff" :stroke-width="idx % 5 === 0 ? 3 : 2"
                            filter="url(#glow-strong)"
                            class="node-circle"/>
                    <text v-if="idx % Math.ceil(visiblePathNodes.length / 8) === 0 || idx === 0 || idx === visiblePathNodes.length - 1"
                          :x="node.x" :y="node.y - 14"
                          text-anchor="middle" font-size="10"
                          fill="#333" font-weight="bold"
                          class="node-label">{{ getNodeLabel(idx, visiblePathNodes.length) }}</text>
                  </g>

                  <g v-for="(arrow, idx) in pathDirectionArrows" :key="'arr-'+idx" class="direction-arrow">
                    <line :x1="arrow.x1" :y1="arrow.y1" :x2="arrow.x2" :y2="arrow.y2"
                          stroke="#ff0000" stroke-width="3" marker-end="url(#arrowhead)"/>
                  </g>
                </g>

                <g class="wind-indicator" v-if="showEscapePath">
                  <circle cx="1050" cy="80" r="40" fill="rgba(255,255,255,0.95)" stroke="#3498db" stroke-width="2"/>
                  <path d="M1050 58 L1050 102 L1070 80Z"
                        :transform="`rotate(${windDirectionAngle},1050,80)`" fill="#3498db"/>
                  <text x="1050" y="73" text-anchor="middle" font-weight="bold" font-size="11">{{ getWindDirectionText() }}</text>
                  <text x="1050" y="90" text-anchor="middle" font-size="10">{{ windSpeed }}m/s</text>
                </g>
              </svg>
            </div>
          </div>

          <div class="timeline-control" v-if="timeSeriesFrames.length > 0">
            <div class="timeline-header">
              <span class="timeline-title">时间轴控制</span>
              <div class="timeline-actions">
                <el-button-group size="small">
                  <el-button :icon="DArrowLeft" @click="goToFirstFrame" :disabled="currentFrameIndex === 0"/>
                  <el-button :icon="ArrowLeft" @click="previousFrame" :disabled="currentFrameIndex === 0"/>
                  <el-button @click="toggleAnimation" :type="isAnimating ? 'danger' : 'primary'">
                    {{ isAnimating ? '暂停' : '播放' }}
                  </el-button>
                  <el-button :icon="ArrowRight" @click="nextFrame" :disabled="currentFrameIndex >= timeSeriesFrames.length - 1"/>
                  <el-button :icon="DArrowRight" @click="goToLastFrame" :disabled="currentFrameIndex >= timeSeriesFrames.length - 1"/>
                </el-button-group>
              </div>
            </div>
            <div class="timeline-slider-container">
              <el-slider v-model="currentFrameIndex" :min="0" :max="timeSeriesFrames.length - 1" :step="1" :show-tooltip="true"
                         :format-tooltip="formatTimelineTooltip" @change="onFrameChange" />
            </div>
            <div class="timeline-info">
              <span>帧: {{ currentFrameIndex + 1 }} / {{ timeSeriesFrames.length }}</span>
              <span>时间: {{ currentTimeElapsed.toFixed(0) }}秒</span>
              <span>最高浓度: {{ currentMaxConcentration.toFixed(1) }} ppm</span>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="card-header"><span class="card-title"><el-icon><Guide /></el-icon>疏散路径规划</span></div>
          </template>
          <div class="path-control">
            <div class="control-section">
              <div class="section-title">气体参数设置</div>
              <div class="control-row">
                <span class="control-label">气体类型:</span>
                <el-select v-model="selectedGasType" placeholder="选择气体类型" style="width: 180px" @change="onGasTypeChange">
                  <el-option label="甲烷(CH4)" value="CH4" />
                  <el-option label="氨气(NH3)" value="NH3" />
                  <el-option label="一氧化碳(CO)" value="CO" />
                  <el-option label="氧气(O2)" value="O2" />
                </el-select>
              </div>
              <div class="control-row">
                <span class="control-label">泄漏强度:</span>
                <el-slider v-model="sourceRate" :min="1" :max="50" :step="1" style="width: 160px" />
                <span class="param-value">{{ sourceRate }}</span>
              </div>
              <div class="control-row">
                <span class="control-label">大气稳定度:</span>
                <el-select v-model="stability" style="width: 180px">
                  <el-option label="极不稳定(A)" :value="1" />
                  <el-option label="不稳定(B)" :value="2" />
                  <el-option label="弱不稳定(C)" :value="3" />
                  <el-option label="中性(D)" :value="4" />
                  <el-option label="稳定(E)" :value="5" />
                  <el-option label="极稳定(F)" :value="6" />
                </el-select>
              </div>
            </div>

            <div class="control-section">
              <div class="section-title">环境参数</div>
              <div class="control-row">
                <span class="control-label">泄漏点:</span>
                <el-select v-model="selectedLeakPoint" placeholder="选择泄漏点" style="width: 180px">
                  <el-option v-for="car in carList" :key="car.id"
                             :label="`小车${car.id} (${car.x}, ${car.y})`" :value="car.id" />
                </el-select>
              </div>
              <div class="control-row">
                <span class="control-label">疏散起点:</span>
                <el-select v-model="selectedStartPoint" placeholder="选择疏散起点" style="width: 180px">
                  <el-option label="行政楼 (210, 300)" :value="'admin'" />
                  <el-option label="办公楼 (600, 190)" :value="'office'" />
                  <el-option label="车间1 (350, 240)" :value="'workshop1'" />
                  <el-option label="车间2 (750, 240)" :value="'workshop2'" />
                  <el-option label="设备房 (750, 440)" :value="'equipment_room'" />
                  <el-option label="仓库 (350, 440)" :value="'warehouse'" />
                </el-select>
              </div>
              <div class="control-row">
                <span class="control-label">疏散人数:</span>
                <el-input-number v-model="evacuationCount" :min="1" :max="1000" style="width: 160px" />
              </div>
              <div class="control-row">
                <span class="control-label">风向角度:</span>
                <el-slider v-model="windDirectionAngle" :min="0" :max="360" :step="1" style="width: 140px" />
                <span class="param-value small">{{ windDirectionAngle }}°</span>
              </div>
              <div class="control-row">
                <span class="control-label">风速:</span>
                <el-slider v-model="windSpeed" :min="0.5" :max="20" :step="0.5" style="width: 140px" />
                <span class="param-value small">{{ windSpeed }}m/s</span>
              </div>
            </div>

            <div class="control-section">
              <div class="section-title">路径策略</div>
              <div class="control-row">
                <span class="control-label">优化目标:</span>
                <el-tag type="danger" effect="dark">生命安全优先（自动）</el-tag>
              </div>
            </div>

            <div class="control-buttons">
              <el-button type="primary" :icon="Aim" @click="calculateEscapePath" :loading="pathCalculating" size="default" block>
                计算最优逃生路径
              </el-button>
              <el-button type="success" :icon="VideoPlay" @click="startTimeSimulation" :loading="simulating" block>
                启动时间序列模拟
              </el-button>
              <el-button @click="resetVisualization" block>重置可视化</el-button>
            </div>

            <div class="path-info-panel" v-if="currentPathResult">
              <div class="info-title">路径评估结果</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">总距离</span>
                  <span class="info-value">{{ getDistanceText() }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">路径节点</span>
                  <span class="info-value">{{ currentPathResult.pathInfo?.nodeCount }} 个</span>
                </div>
                <div class="info-item">
                  <span class="info-label">预计时间</span>
                  <span class="info-value">{{ getEstimatedTime() }} min</span>
                </div>
                <div class="info-item">
                  <span class="info-label">计算状态</span>
                  <el-tag :type="currentPathResult.pathInfo?.status === 'success' ? 'success' : 'warning'" size="small">
                    {{ currentPathResult.pathInfo?.status === 'success' ? 'A*寻路成功' : '直线路径' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="card-header"><span class="card-title"><el-icon><Document /></el-icon>应急预案</span></div>
          </template>
          <div class="plan-list">
            <div class="plan-item" v-for="plan in emergencyPlans" :key="plan.id"
                 :class="{ active: selectedPlanId === plan.id }" @click="selectPlan(plan.id)">
              <div class="plan-name">{{ plan.name }}</div>
              <el-tag :type="getPlanTypeColor(plan.type)" size="small">{{ plan.type }}</el-tag>
              <div class="plan-actions">
                <el-button type="primary" size="small" :icon="View" @click.stop="viewPlan(plan)">查看</el-button>
                <el-button type="warning" size="small" :icon="Promotion" @click.stop="executePlan(plan)">执行</el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="card-header"><span class="card-title"><el-icon><ChatDotRound /></el-icon>指挥日志</span></div>
          </template>
          <div class="log-list">
            <div class="log-item" v-for="(log, index) in commandLogs.slice(0, 15)" :key="index">
              <div class="log-time">{{ formatTime(log.time) }}</div>
              <div class="log-content">{{ log.content }}</div>
              <div class="log-operator">{{ log.operator }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  runDiffusionSimulation,
  runEvacuationPlanning,
  type AlgorithmPayload,
  type AlgorithmResponse,
} from '@/api/algorithm'
import {
  Warning, Clock, Sunny, Bell, Switch, Refresh, DataAnalysis,
  Location, Guide, Lock, Document, ChatDotRound, View, Promotion,
  Aim, VideoPlay, DArrowLeft, ArrowLeft, ArrowRight, DArrowRight
} from '@element-plus/icons-vue'
import { useCarStore } from '@/store/carStore'
import { reqWarningHistoryList } from '@/api/warningHistory'
import type { WarningHistoryRecord } from '@/api/warningHistory'
import { reqEmergencyPlanList } from '@/api/emergencyPlan'
import { buildLatestReadingByCarId, reqMonitoringOverview } from '@/api/monitoringData'
import type { EnvironmentSnapshot, LatestReading } from '@/api/monitoringData'
import {
  getCarGasAlgorithmCode,
  getCarGasSpec,
  isCarGasValueInAlarm,
} from '@/data/gasCatalog'
import type { CarGasAlgorithmCode } from '@/data/gasCatalog'

const router = useRouter()
const carStore = useCarStore()

interface CarData {
  id: number
  x: number
  y: number
  status: 'normal' | 'warning'
}

interface HistoryItem {
  id: number
  carId: string
  areaName: string
  x: number
  y: number
  gasType: string
  gasValue: string | number
  warningTime: string
}

interface EmergencyPlan {
  id: number
  name: string
  type: string
  description: string
  level: string
}

interface CommandLog {
  time: string
  content: string
  operator: string
}

interface DiffusionFrame {
  high: number[][]
  medium: number[][]
  low: number[][]
  maxConcentration: number
  affectedArea: number
  timeElapsed?: number
}

interface SafetyAnalysis {
  avgConcentration: number
  maxConcentration: number
  safeRatio: number
  riskScore: number
  isSafe: boolean
}

interface PathResult {
  diffusion: DiffusionFrame
  escapePath: number[][]
  pathInfo: { distance: number; nodeCount: number; iterations: number; status: string }
  safetyAnalysis: SafetyAnalysis
  gasInfo: { type: string; name: string; color: string; safetyThreshold: number; idlhThreshold: number }
  isReachable?: boolean
  error?: string | null
}

interface EmergencyFacility {
  id: string
  name: string
  type: string
  x: number
  y: number
  w: number
  h: number
  zone: string
  status: string
  hazardLevel: string
}

interface EmergencyRoad {
  x: number
  y: number
  w: number
  h: number
  main?: boolean
}

interface EmergencyParkEntrance extends MapPoint {
  id: string
  label: string
}

interface DiffusionCell extends MapPoint {
  size?: number
  concentration?: number
  level?: string
}

interface AlgorithmDiffusionFrame {
  frameIndex?: number
  timeSec?: number
  maxConcentration?: number
  affectedArea?: number
  cells?: DiffusionCell[]
}

interface AlgorithmDiffusionResult {
  gas?: Record<string, unknown>
  frames?: AlgorithmDiffusionFrame[]
  blockedMask?: Record<string, unknown> | null
}

interface AlgorithmRoadAccess {
  startRoadPoint?: MapPoint
  exitRoadPoint?: MapPoint
  startOriginalPoint?: MapPoint
  exitOriginalPoint?: MapPoint
}

interface AlgorithmEvacuationResult {
  isReachable?: boolean
  message?: string
  path?: MapPoint[]
  distanceMeters?: number
  estimatedTimeSec?: number
  peakConcentration?: number
  exitLabel?: string
  candidateRoutes?: unknown[]
  roadAccess?: AlgorithmRoadAccess
}

interface MapPoint {
  x: number
  y: number
}

// 算法服务统一返回信封 { code, message, data, ok, requestId }（见 response_utils.py）。
// 疏散业务对象用 isReachable 表达可达性；外层信封用 ok/code 表达 HTTP 业务结果。
const unwrapAlgorithm = <T,>(response: AlgorithmResponse<T>): { data: T | null; success: boolean; error: string | null } => {
  const ok = response?.ok === true || response?.code === 200
  return {
    data: response?.data ?? null,
    success: ok,
    error: ok ? null : response?.message ?? '算法服务返回失败',
  }
}

const currentTime = ref('')
const currentEmergencyLevel = ref<'normal' | 'warning' | 'danger'>('normal')
const emergencyLoading = ref(false)
const carList = ref<CarData[]>([])
const recentHistory = ref<HistoryItem[]>([])
const latestGasReadings = ref<Record<number, LatestReading>>({})
const selectedLeakPoint = ref<number | null>(null)
const selectedStartPoint = ref<string>('admin')
const evacuationCount = ref(50)
const windDirectionAngle = ref(90)
const windSpeed = ref(5)
const environmentData = ref<EnvironmentSnapshot | null>(null)
const sourceRate = ref(10)
const stability = ref(4)
const selectedGasType = ref<CarGasAlgorithmCode>('CH4')
const pathCalculating = ref(false)
const simulating = ref(false)
const showEscapePath = ref(false)
const gasDiffusionVisible = ref(true)
const safetyAnalysisVisible = ref(false)
const currentPathResult = ref<PathResult | null>(null)
const escapePathData = ref('')
const escapePoints = ref<{x: number, y: number}[]>([])
const emergencyPlans = ref<EmergencyPlan[]>([])
const selectedPlanId = ref<number | null>(null)
const commandLogs = ref<CommandLog[]>([])

const viewMode = ref<'global' | 'local' | 'path'>('global')
const isAnimating = ref(false)
const currentFrameIndex = ref(0)
const timeSeriesFrames = ref<DiffusionFrame[]>([])
const animationFrameId = ref<number | null>(null)
let animationInterval: number | null = null

const currentSafety = computed<SafetyAnalysis>(() => ({
  avgConcentration: currentPathResult.value?.safetyAnalysis?.avgConcentration ?? 0,
  maxConcentration: currentPathResult.value?.safetyAnalysis?.maxConcentration ?? 0,
  safeRatio: currentPathResult.value?.safetyAnalysis?.safeRatio ?? 0,
  riskScore: currentPathResult.value?.safetyAnalysis?.riskScore ?? 999,
  isSafe: currentPathResult.value?.safetyAnalysis?.isSafe ?? false
}))

const currentDiffusionFrame = computed(() => {
  if (timeSeriesFrames.value.length > 0) {
    return timeSeriesFrames.value[currentFrameIndex.value]
  }
  return currentPathResult.value?.diffusion || null
})

const currentMaxConcentration = computed(() => {
  return currentDiffusionFrame.value?.maxConcentration || 0
})

const currentTimeElapsed = computed(() => {
  return currentDiffusionFrame.value?.timeElapsed || (currentFrameIndex.value + 1) * 5
})

const currentGasColor = computed(() => {
  const colors: Record<CarGasAlgorithmCode, string> = {
    CH4: '#E74C3C', NH3: '#9B59B6', CO: '#3498DB', O2: '#2ECC71'
  }
  return colors[selectedGasType.value] || '#E74C3C'
})

const mapTransformStyle = computed(() => {
  switch (viewMode.value) {
    case 'local':
      return { transform: 'scale(1.5)', transformOrigin: 'center center' }
    case 'path':
      return { transform: 'scale(1.8)', transformOrigin: 'center center' }
    default:
      return {}
  }
})

const leakPulseRadius = ref(25)

const visiblePathNodes = computed(() => {
  if (!escapePoints.value || escapePoints.value.length === 0) return []
  if (viewMode.value === 'local') {
    return escapePoints.value.filter((_, i) => i % 2 === 0)
  }
  return escapePoints.value.filter((_, i) => i % 3 === 0 || i === 0 || i === escapePoints.value.length - 1)
})

const pathDirectionArrows = computed(() => {
  if (!escapePoints.value || escapePoints.value.length < 4) return []
  const arrows: Array<{x1: number, y1: number, x2: number, y2: number}> = []
  const step = Math.ceil(escapePoints.value.length / 6)
  for (let i = step; i < escapePoints.value.length - step; i += step) {
    const p1 = escapePoints.value[i]
    const nextIdx = Math.min(i + Math.max(1, Math.floor(step / 2)), escapePoints.value.length - 1)
    const p2 = escapePoints.value[nextIdx]
    if (p1 && p2) {
      arrows.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
    }
  }
  return arrows
})

let timeInterval: number | null = null
let pulseAnimationId: number | null = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const getEmergencyLevelText = () => ({ normal: '正常', warning: '预警', danger: '危险' })[currentEmergencyLevel.value]

const triggerEmergency = async () => {
  try {
    await ElMessageBox.confirm('确定要触发应急响应吗？这将启动所有应急程序。', '确认触发应急',
      { confirmButtonText: '确认触发', cancelButtonText: '取消', type: 'warning' })
    emergencyLoading.value = true
    setTimeout(() => {
      currentEmergencyLevel.value = 'danger'
      emergencyLoading.value = false
      ElMessage.success('应急响应已启动')
      addCommandLog('应急响应已启动', '系统')
      selectedLeakPoint.value = carList.value.find(c => c.status === 'warning')?.id || null
      if (selectedLeakPoint.value) calculateEscapePath()
    }, 1000)
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('触发应急失败')
  }
}

const resetEmergency = async () => {
  try {
    await ElMessageBox.confirm('确定要解除警报吗？', '确认解除警报',
      { confirmButtonText: '确认解除', cancelButtonText: '取消', type: 'info' })
    currentEmergencyLevel.value = 'normal'
    resetVisualization()
    ElMessage.success('警报已解除')
    addCommandLog('警报已解除', '系统')
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('解除警报失败')
  }
}

const refreshMonitoringData = async () => {
  try {
    await carStore.fetchCarDataFromDB()
    carList.value = carStore.carList
    await Promise.all([loadWarningHistory(), loadMonitoringOverview(false)])
    ElMessage.success('监测数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const getGasType = (carId: number) => getCarGasSpec(carId).chartName

const EMPTY_GAS_READING = '暂无读数'

const formatGasReading = (carId: number, value: string | number | null | undefined) => {
  const text = String(value ?? '').trim()
  if (!text) return EMPTY_GAS_READING
  return /(ppm|LEL|VOL|%)/i.test(text) ? text : `${text} ${getCarGasSpec(carId).unit}`
}

// 最新读数来自后端监测概览：优先使用 sensor_reading 仿真采样读数；
// warning_history 只作为后端兜底和本页预警历史列表来源。
const getGasValue = (carId: number) =>
  formatGasReading(carId, latestGasReadings.value[carId]?.gasValue)

const getAreaNameByCarId = (carId: number) => ({
  1: '车间1',
  2: '设备房',
  3: '车间2',
  4: '仓库'
})[carId] || '未知区域'

const normalizeWarningHistory = (record: WarningHistoryRecord): HistoryItem => {
  const carId = Number(record.carId)
  const car = carList.value.find(item => item.id === carId)
  const hasCarId = Number.isFinite(carId)

  return {
    id: record.id ?? new Date(record.warningTime).getTime(),
    carId: hasCarId ? `小车${carId}` : String(record.carId || '未知小车'),
    areaName: record.areaName || (hasCarId ? getAreaNameByCarId(carId) : '未知区域'),
    x: Number(record.x ?? car?.x ?? 0),
    y: Number(record.y ?? car?.y ?? 0),
    gasType: record.gasType || (hasCarId ? getGasType(carId) : '未知气体'),
    gasValue: hasCarId ? formatGasReading(carId, record.gasValue) : String(record.gasValue ?? EMPTY_GAS_READING),
    warningTime: record.warningTime,
  }
}

const loadWarningHistory = async () => {
  try {
    const res = await reqWarningHistoryList()
    const records = res.code === 200 && Array.isArray(res.data) ? res.data : []
    recentHistory.value = records
      .slice()
      .sort((a, b) => new Date(b.warningTime).getTime() - new Date(a.warningTime).getTime())
      .slice(0, 30)
      .map(normalizeWarningHistory)
  } catch (error) {
    console.error('加载预警历史失败：', error)
  }
}

const loadMonitoringOverview = async (syncWind = true) => {
  try {
    const res = await reqMonitoringOverview()
    if (res.code === 200 && res.data?.environment) {
      environmentData.value = res.data.environment
      latestGasReadings.value = Array.isArray(res.data.latestReadings)
        ? buildLatestReadingByCarId(res.data.latestReadings)
        : {}
      if (syncWind && res.data.environment.available) {
        if (res.data.environment.windSpeed != null) {
          windSpeed.value = Number(res.data.environment.windSpeed)
        }
        if (res.data.environment.windDirection != null) {
          windDirectionAngle.value = Number(res.data.environment.windDirection)
        }
      }
    }
  } catch (error) {
    console.error('加载监测环境数据失败：', error)
    latestGasReadings.value = {}
  }
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const getRiskLevel = (item: HistoryItem) => {
  const carId = Number(String(item.carId).replace(/\D/g, ''))
  return isCarGasValueInAlarm(carId, item.gasValue) ? 'high' : 'low'
}

const selectCar = (car: CarData) => {
  if (car.status === 'warning') {
    selectedLeakPoint.value = car.id
    selectedGasType.value = getCarGasAlgorithmCode(car.id)
    ElMessage.info(`已选择泄漏点：小车${car.id}`)
  } else {
    ElMessage.info(`小车${car.id}状态正常`)
  }
}

const addCommandLog = (content: string, operator: string) => {
  commandLogs.value.unshift({ time: new Date().toISOString(), content, operator })
  if (commandLogs.value.length > 50) commandLogs.value.pop()
}

const handleViewModeChange = () => {
  addCommandLog(`切换视图模式: ${viewMode.value}`, '用户')
}

const formatPolygonPoints = (points: number[]) => {
  return points.map((p, i) => `${i % 2 === 0 ? points[i] : points[i+1]},${i % 2 === 0 ? points[i+1] : points[i]}`).filter((_, i) => i % 2 === 0).join(' ')
}

const getLeakPointX = () => {
  const car = carList.value.find(c => c.id === selectedLeakPoint.value)
  return car?.x || 350
}

const getLeakPointY = () => {
  const car = carList.value.find(c => c.id === selectedLeakPoint.value)
  return car?.y || 240
}

const getNodeColor = (idx: number, total: number) => {
  if (idx === 0) return '#00ff00'
  if (idx === total - 1) return '#ff0000'
  const ratio = idx / total
  if (ratio < 0.33) return '#00cc00'
  if (ratio < 0.66) return '#ffaa00'
  return '#ff5500'
}

const getNodeLabel = (idx: number, total: number) => {
  if (idx === 0) return '起点'
  if (idx === total - 1) return '终点'
  return `节点${idx}`
}

const FACTORY_AREA_MU = 100
const MU_TO_M2 = 666.6667
const MAP_WIDTH_PX = 1200
const MAP_HEIGHT_PX = 600
const METERS_PER_PX = Math.sqrt((FACTORY_AREA_MU * MU_TO_M2) / (MAP_WIDTH_PX * MAP_HEIGHT_PX))

const convertMapDistanceToMeters = (rawDistance: number) => {
  if (!Number.isFinite(rawDistance) || rawDistance <= 0) return 0
  return rawDistance * METERS_PER_PX
}

const getPathDistanceMeters = () => {
  const raw = Number(currentPathResult.value?.pathInfo?.distance ?? 0)
  return convertMapDistanceToMeters(raw)
}

const getDistanceText = () => {
  const meters = getPathDistanceMeters()
  return meters > 0 ? `${meters.toFixed(1)} m` : '--'
}

const getEstimatedTime = () => {
  if (!currentPathResult.value?.pathInfo) return '--'
  const dist = getPathDistanceMeters()
  if (dist <= 0) return '--'
  // 疏散人数越多，拥挤越明显，人均行进速度会下降
  const baseSpeed = 1.2 // m/s
  const crowdFactor = Math.min(0.6, Math.max(0, (evacuationCount.value - 50) * 0.0025))
  const effectiveSpeed = Math.max(0.55, baseSpeed * (1 - crowdFactor))
  // 叠加组织响应与集结延迟，避免出现不符合现场经验的过短时间
  const preMovementMin = 1.2
  const assemblyDelayMin = Math.max(0, evacuationCount.value - 20) * 0.012
  const travelMin = dist / effectiveSpeed / 60
  return (travelMin + preMovementMin + assemblyDelayMin).toFixed(1)
}

const getWindDirectionText = () => {
  const directions = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风']
  const index = Math.round((windDirectionAngle.value % 360) / 45) % 8
  return directions[index]
}

const weatherText = computed(() => {
  const env = environmentData.value
  if (!env?.available) return '未接入外部环境观测数据'
  const windText = env.windSpeed == null
    ? '风速未接入'
    : `${env.windDirectionText || getWindDirectionText()} ${Number(env.windSpeed).toFixed(1)}m/s`
  const temp = env.temperature == null ? '温度未接入' : `${Number(env.temperature).toFixed(1)}℃`
  const humidity = env.humidity == null ? '' : ` | ${env.humidity}%RH`
  return `${windText} | ${temp}${humidity}`
})

const formatTimelineTooltip = (val: number) => {
  if (!timeSeriesFrames.value[val]) return ''
  return `第 ${val + 1} 帧 | ${(timeSeriesFrames.value[val].timeElapsed || val * 5).toFixed(0)} 秒`
}

const stabilityClassByLevel: Record<number, string> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'F',
}

const evacuationStartPoints: Record<string, MapPoint> = {
  admin: { x: 210, y: 300 },
  office: { x: 600, y: 190 },
  workshop1: { x: 350, y: 240 },
  workshop2: { x: 750, y: 240 },
  equipment_room: { x: 750, y: 440 },
  warehouse: { x: 350, y: 440 }
}

const emergencyFacilities: EmergencyFacility[] = [
  { id: 'workshop1', name: '车间1', type: 'building', x: 300, y: 200, w: 100, h: 80, zone: 'production', status: 'active', hazardLevel: 'high' },
  { id: 'workshop2', name: '车间2', type: 'building', x: 700, y: 200, w: 100, h: 80, zone: 'production', status: 'active', hazardLevel: 'high' },
  { id: 'office', name: '办公楼', type: 'building', x: 550, y: 150, w: 100, h: 80, zone: 'office', status: 'active', hazardLevel: 'low' },
  { id: 'warehouse', name: '仓库', type: 'building', x: 300, y: 400, w: 100, h: 80, zone: 'storage', status: 'active', hazardLevel: 'medium' },
  { id: 'equipment_room', name: '设备房', type: 'building', x: 700, y: 400, w: 100, h: 80, zone: 'utility', status: 'active', hazardLevel: 'medium' },
  { id: 'admin', name: '行政楼', type: 'building', x: 150, y: 250, w: 120, h: 100, zone: 'office', status: 'active', hazardLevel: 'low' },
]

const emergencyRoads: EmergencyRoad[] = [
  { x: 100, y: 296, w: 1000, h: 8, main: true },
  { x: 250, y: 178, w: 600, h: 5 },
  { x: 250, y: 238, w: 600, h: 5 },
  { x: 250, y: 358, w: 600, h: 5 },
  { x: 250, y: 438, w: 600, h: 5 },
  { x: 248, y: 180, w: 5, h: 260 },
  { x: 348, y: 180, w: 5, h: 260 },
  { x: 448, y: 180, w: 5, h: 260 },
  { x: 548, y: 180, w: 5, h: 260 },
  { x: 648, y: 180, w: 5, h: 260 },
  { x: 748, y: 180, w: 5, h: 260 },
  { x: 848, y: 180, w: 5, h: 260 },
  { x: 596, y: 100, w: 8, h: 200, main: true },
]

const emergencyParkEntrances: EmergencyParkEntrance[] = [
  { id: 'exit-west', label: '出口1', x: 100, y: 300 },
  { id: 'exit-east', label: '出口2', x: 1100, y: 300 },
  { id: 'exit-north', label: '出口3', x: 600, y: 100 },
]

const currentStartPoint = () => evacuationStartPoints[selectedStartPoint.value] || evacuationStartPoints.admin

const buildEmergencyDiffusionPayload = (leakCar: CarData, frameCount: number): AlgorithmPayload => ({
  gasId: selectedGasType.value,
  sourceMapPoint: { x: leakCar.x, y: leakCar.y },
  sourceRate: sourceRate.value,
  releaseDuration: Math.max(60, frameCount * 5),
  initialTemperature: environmentData.value?.temperature ?? 25,
  initialPressure: 1,
  releaseHeight: 2,
  windSpeed: windSpeed.value,
  windDirection: windDirectionAngle.value,
  ambientTemperature: environmentData.value?.temperature ?? 25,
  humidity: environmentData.value?.humidity ?? 55,
  stabilityClass: stabilityClassByLevel[stability.value] || 'D',
  terrainRoughness: 0.45,
  obstacleInfluenceEnabled: true,
  frameCount,
  frameStepSec: 5,
  map: {
    width: MAP_WIDTH_PX,
    height: MAP_HEIGHT_PX,
    gridSize: 20,
    mapMetersPerUnit: METERS_PER_PX,
  },
  facilities: emergencyFacilities,
  roads: emergencyRoads,
  sensors: [],
})

const cellPolygon = (cell: DiffusionCell): number[] => {
  const half = Number(cell.size ?? 20) / 2
  return [
    cell.x - half, cell.y - half,
    cell.x + half, cell.y - half,
    cell.x + half, cell.y + half,
    cell.x - half, cell.y + half,
  ]
}

const adaptDiffusionFrame = (frame: AlgorithmDiffusionFrame | null | undefined): DiffusionFrame => {
  const high: number[][] = []
  const medium: number[][] = []
  const low: number[][] = []
  for (const cell of frame?.cells || []) {
    const polygon = cellPolygon(cell)
    if (cell.level === 'danger') high.push(polygon)
    else if (cell.level === 'warning') medium.push(polygon)
    else low.push(polygon)
  }
  return {
    high,
    medium,
    low,
    maxConcentration: Number(frame?.maxConcentration ?? 0),
    affectedArea: Number(frame?.affectedArea ?? 0),
    timeElapsed: Number(frame?.timeSec ?? 0),
  }
}

const selectPlanningDiffusionFrame = (frames: AlgorithmDiffusionFrame[] | undefined) => {
  return frames?.slice().reverse().find(frame => (frame.cells?.length || 0) > 0) || frames?.at(-1) || null
}

const buildSafetyAnalysis = (
  route: AlgorithmEvacuationResult,
  frame: AlgorithmDiffusionFrame | null | undefined,
): SafetyAnalysis => {
  const cells = frame?.cells || []
  const concentrations = cells.map(cell => Number(cell.concentration ?? 0)).filter(Number.isFinite)
  const avgConcentration = concentrations.length
    ? concentrations.reduce((sum, value) => sum + value, 0) / concentrations.length
    : 0
  const peak = Number(route.peakConcentration ?? frame?.maxConcentration ?? 0)
  const dangerThreshold = Number(currentAlgorithmGas.value?.dangerThreshold ?? currentAlgorithmGas.value?.blockingThreshold ?? 1)
  const isReachable = routeReachable(route)
  return {
    avgConcentration,
    maxConcentration: peak,
    safeRatio: isReachable ? 1 : 0,
    riskScore: dangerThreshold > 0 ? Math.min(999, (peak / dangerThreshold) * 100) : 999,
    isSafe: isReachable,
  }
}

const currentAlgorithmGas = ref<Record<string, unknown> | null>(null)

const routeReachable = (route: AlgorithmEvacuationResult | null | undefined) => (
  route?.isReachable === true
)

const isFinitePoint = (point: MapPoint | null | undefined): point is MapPoint => (
  Boolean(point)
  && Number.isFinite(Number(point?.x))
  && Number.isFinite(Number(point?.y))
)

const pushRoutePoint = (points: number[][], point: MapPoint | null | undefined) => {
  if (!isFinitePoint(point)) return
  const next = [Number(point.x), Number(point.y)]
  const previous = points.at(-1)
  if (previous && Math.hypot(previous[0] - next[0], previous[1] - next[1]) < 0.5) return
  points.push(next)
}

const buildRoutePathPoints = (route: AlgorithmEvacuationResult): number[][] => {
  const path: number[][] = []
  for (const point of route.path || []) {
    pushRoutePoint(path, point)
  }
  if (path.length >= 2) return path

  const access = route.roadAccess || {}
  const accessPath: number[][] = []
  pushRoutePoint(accessPath, access.startOriginalPoint)
  pushRoutePoint(accessPath, access.startRoadPoint)
  pushRoutePoint(accessPath, access.exitRoadPoint)
  pushRoutePoint(accessPath, access.exitOriginalPoint)
  return accessPath.length >= 2 ? accessPath : path
}

const adaptEvacuationResult = (
  route: AlgorithmEvacuationResult,
  diffusion: DiffusionFrame,
  rawFrame: AlgorithmDiffusionFrame | null | undefined,
): PathResult => {
  const path = buildRoutePathPoints(route)
  const distanceMeters = Number(route.distanceMeters ?? 0)
  const isReachable = routeReachable(route)
  return {
    diffusion,
    escapePath: path,
    pathInfo: {
      distance: distanceMeters / METERS_PER_PX,
      nodeCount: path.length,
      iterations: Array.isArray(route.candidateRoutes) ? route.candidateRoutes.length : 0,
      status: isReachable ? 'success' : 'blocked',
    },
    safetyAnalysis: buildSafetyAnalysis(route, rawFrame),
    gasInfo: {
      type: selectedGasType.value,
      name: getCarGasSpec(selectedLeakPoint.value || 1).chartName,
      color: currentGasColor.value,
      safetyThreshold: Number(currentAlgorithmGas.value?.warningThreshold ?? 0),
      idlhThreshold: Number(currentAlgorithmGas.value?.dangerThreshold ?? 0),
    },
    isReachable,
    error: isReachable ? null : route.message || '当前场景未找到可达疏散路径',
  }
}

const calculateEscapePath = async () => {
  if (!selectedLeakPoint.value) {
    ElMessage.warning('请先选择泄漏点')
    return
  }

  pathCalculating.value = true
  const startTime = performance.now()

  try {
    const leakCar = carList.value.find(c => c.id === selectedLeakPoint.value)!

    const diffusionResponse = await runDiffusionSimulation<AlgorithmDiffusionResult>(
      buildEmergencyDiffusionPayload(leakCar, 13),
    )
    const { data: diffusionData, success: diffusionSuccess, error: diffusionError } = unwrapAlgorithm(diffusionResponse)
    const rawFrame = selectPlanningDiffusionFrame(diffusionData?.frames)
    if (!diffusionSuccess || !rawFrame || !diffusionData?.gas) {
      throw new Error(diffusionError || '新扩散链未返回有效帧')
    }
    currentAlgorithmGas.value = diffusionData.gas
    const diffusion = adaptDiffusionFrame(rawFrame)

    const routeResponse = await runEvacuationPlanning<AlgorithmEvacuationResult>({
      roads: emergencyRoads,
      parkEntrances: emergencyParkEntrances,
      startPoint: currentStartPoint(),
      startLabel: selectedStartPoint.value,
      frame: rawFrame,
      gas: diffusionData.gas,
      blockedMask: diffusionData.blockedMask || null,
    })
    const { data, success, error } = unwrapAlgorithm(routeResponse)

    const adaptedResult = data ? adaptEvacuationResult(data, diffusion, rawFrame) : null

    const routeReady = Boolean(
      success
      && adaptedResult?.isReachable !== false
      && adaptedResult?.pathInfo?.status === 'success'
      && Array.isArray(adaptedResult?.escapePath)
      && adaptedResult.escapePath.length >= 2
    )

    if (routeReady && adaptedResult) {
      currentPathResult.value = adaptedResult
      escapePoints.value = adaptedResult.escapePath.map((p: number[]) => ({ x: p[0], y: p[1] }))
      safetyAnalysisVisible.value = true

      let pathD = `M ${escapePoints.value[0].x} ${escapePoints.value[0].y}`
      for (let i = 1; i < escapePoints.value.length; i++) {
        pathD += ` L ${escapePoints.value[i].x} ${escapePoints.value[i].y}`
      }
      escapePathData.value = pathD

      showEscapePath.value = true
      gasDiffusionVisible.value = true

      const endTime = performance.now()
      const calcTime = (endTime - startTime).toFixed(1)

      ElMessage.success({
        message: `D* Lite 路径计算完成！距离${convertMapDistanceToMeters(Number(adaptedResult.pathInfo.distance || 0)).toFixed(1)}m，耗时${calcTime}ms`,
        duration: 4000
      })

      addCommandLog(
        `D* Lite 算法计算完成: 距离${convertMapDistanceToMeters(Number(adaptedResult.pathInfo.distance || 0)).toFixed(1)}m, 节点${adaptedResult.pathInfo.nodeCount}个, 候选路线${adaptedResult.pathInfo.iterations}条, 风险评分${adaptedResult.safetyAnalysis.riskScore.toFixed(1)}, ${adaptedResult.safetyAnalysis.isSafe ? '路径安全' : '存在风险'}`,
        '系统'
      )
    } else {
      throw new Error(error || adaptedResult?.error || data?.message || '当前场景未找到可达疏散路径')
    }
  } catch (err) {
    console.error('路径计算错误:', err)
    ElMessage.error('路径计算失败，请检查后端服务是否启动')
  } finally {
    pathCalculating.value = false
  }
}

const startTimeSimulation = async () => {
  if (!selectedLeakPoint.value) {
    ElMessage.warning('请先选择泄漏点')
    return
  }

  simulating.value = true
  const leakCar = carList.value.find(c => c.id === selectedLeakPoint.value)!

  try {
    const response = await runDiffusionSimulation<AlgorithmDiffusionResult>(
      buildEmergencyDiffusionPayload(leakCar, 30),
    )

    const { data, success, error } = unwrapAlgorithm(response)

    if (success && data?.frames?.length) {
      currentAlgorithmGas.value = data.gas || currentAlgorithmGas.value
      timeSeriesFrames.value = data.frames.map(adaptDiffusionFrame)
      currentFrameIndex.value = 0
      gasDiffusionVisible.value = true

      const duration = timeSeriesFrames.value.at(-1)?.timeElapsed ?? timeSeriesFrames.value.length * 5
      ElMessage.success(`时间序列模拟完成，共${timeSeriesFrames.value.length}帧（${duration}秒）`)
      addCommandLog(`新扩散链时间序列模拟加载完成: ${timeSeriesFrames.value.length}帧, 总时长${duration}秒`, '系统')

      startAnimation()
    } else {
      throw new Error(error || '模拟失败')
    }
  } catch (err) {
    console.error('时间序列错误:', err)
    ElMessage.error('时间序列模拟失败')
  } finally {
    simulating.value = false
  }
}

const startAnimation = () => {
  stopAnimation()
  isAnimating.value = true
  animationInterval = window.setInterval(() => {
    if (currentFrameIndex.value < timeSeriesFrames.value.length - 1) {
      currentFrameIndex.value++
    } else {
      stopAnimation()
    }
  }, 500)
}

const stopAnimation = () => {
  isAnimating.value = false
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
}

const toggleAnimation = () => {
  if (isAnimating.value) {
    stopAnimation()
  } else {
    startAnimation()
  }
}

const nextFrame = () => {
  if (currentFrameIndex.value < timeSeriesFrames.value.length - 1) {
    currentFrameIndex.value++
  }
}

const previousFrame = () => {
  if (currentFrameIndex.value > 0) {
    currentFrameIndex.value--
  }
}

const goToFirstFrame = () => {
  currentFrameIndex.value = 0
}

const goToLastFrame = () => {
  currentFrameIndex.value = timeSeriesFrames.value.length - 1
}

const onFrameChange = (val: number) => {
  currentFrameIndex.value = val
}

const onGasTypeChange = () => {
  addCommandLog(`切换气体类型为: ${selectedGasType.value}`, '用户')
}

watch(selectedLeakPoint, (carId) => {
  if (carId) {
    selectedGasType.value = getCarGasAlgorithmCode(carId)
  }
})

const resetVisualization = () => {
  showEscapePath.value = false
  escapePathData.value = ''
  escapePoints.value = []
  currentPathResult.value = null
  safetyAnalysisVisible.value = false
  timeSeriesFrames.value = []
  currentFrameIndex.value = 0
  stopAnimation()
  addCommandLog('可视化界面已重置', '用户')
}

const getPlanTypeColor = (type: string) =>
  ({ gas: 'danger', fire: 'warning', explosion: 'danger', natural: 'info' })[type] || 'info'

const viewPlan = (plan: EmergencyPlan) => {
  ElMessageBox.alert(
    `预案名称: ${plan.name}\n预案类型: ${plan.type}\n响应级别: ${plan.level}\n\n预案描述:\n${plan.description}`,
    '预案详情',
    { confirmButtonText: '关闭' }
  )
}

const executePlan = (plan: EmergencyPlan) => {
  ElMessageBox.confirm(
    `确定要执行预案"${plan.name}"吗？`, '确认执行预案',
    { confirmButtonText: '确认执行', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    ElMessage.success(`预案"${plan.name}"已启动执行`)
    addCommandLog(`启动执行预案: ${plan.name}`, '指挥员')
    if (plan.type === 'gas' && selectedLeakPoint.value) calculateEscapePath()
  }).catch(() => {})
}

const loadEmergencyPlans = async () => {
  try {
    const response = await reqEmergencyPlanList()
    emergencyPlans.value = Array.isArray(response.data) ? response.data : []
    selectedPlanId.value = emergencyPlans.value[0]?.id ?? null
  } catch (error) {
    console.warn('Failed to load emergency plans:', error)
    emergencyPlans.value = []
    selectedPlanId.value = null
    ElMessage.warning('应急预案加载失败')
  }
}

const selectPlan = (id: number) => { selectedPlanId.value = id }

const startPulseAnimation = () => {
  let growing = true
  const animate = () => {
    if (growing) {
      leakPulseRadius.value += 0.5
      if (leakPulseRadius.value >= 45) growing = false
    } else {
      leakPulseRadius.value -= 0.5
      if (leakPulseRadius.value <= 25) growing = true
    }
    pulseAnimationId = requestAnimationFrame(animate)
  }
  pulseAnimationId = requestAnimationFrame(animate)
}

const loadInitialData = async () => {
  try {
    await carStore.fetchCarDataFromDB()
    carList.value = carStore.carList
    await Promise.all([loadWarningHistory(), loadMonitoringOverview(true)])

    const warningCar = carList.value.find(c => c.status === 'warning')
    if (warningCar) {
      selectedLeakPoint.value = warningCar.id
    } else if (carList.value.length > 0) {
      selectedLeakPoint.value = carList.value[0].id
    }
    await loadEmergencyPlans()
  } catch (error) {
    console.warn('数据加载失败:', error)
  }
}

onMounted(async () => {
  updateTime()
  timeInterval = window.setInterval(updateTime, 1000)
  await loadInitialData()
  startPulseAnimation()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  stopAnimation()
  if (pulseAnimationId) cancelAnimationFrame(pulseAnimationId)
})
</script>

<style scoped>
.emergency-command-center {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0d2137 100%);
  padding: 16px;
  color: #e0e6ed;
}

.top-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 58, 95, 0.85);
  border-radius: 12px;
  padding: 14px 24px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.status-left, .status-center, .status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.emergency-level {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
}
.emergency-level.normal { background: rgba(103, 194, 58, 0.2); color: #67c23a; border: 1px solid #67c23a; }
.emergency-level.warning { background: rgba(230, 162, 60, 0.2); color: #e6a23c; border: 1px solid #e6a23c; animation: pulse-warning 1.5s infinite; }
.emergency-level.danger { background: rgba(245, 108, 108, 0.2); color: #f56c6c; border: 1px solid #f56c6c; animation: pulse-danger 0.8s infinite; }

@keyframes pulse-warning { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes pulse-danger { 0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(245, 108, 108, 0.5); } 50% { opacity: 0.8; box-shadow: 0 0 20px rgba(245, 108, 108, 0.8); } }

.time-display, .weather-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #a0aec0;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 14px;
  border-radius: 8px;
}

.main-content {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 120px);
}

.left-panel, .right-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  max-height: calc(100vh - 130px);
}

.center-panel {
  flex: 1;
  min-width: 600px;
}

.panel-card {
  background: rgba(30, 58, 95, 0.75);
  border: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
}
.panel-card:hover { border-color: rgba(64, 158, 255, 0.35); box-shadow: 0 4px 20px rgba(64, 158, 255, 0.1); }
.panel-card :deep(.el-card__header) { background: rgba(26, 54, 93, 0.6); border-bottom: 1px solid rgba(64, 158, 255, 0.15); padding: 12px 16px; }
.panel-card :deep(.el-card__body) { padding: 16px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: #e0e6ed; }

.monitoring-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
.monitor-item {
  padding: 14px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(103, 194, 58, 0.1) 100%);
  border-radius: 10px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  color: #e0e6ed;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
}
.monitor-item::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  transition: left 0.5s ease;
}
.monitor-item:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(64, 158, 255, 0.2); }
.monitor-item:hover::before { left: 100%; }

.monitor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.car-name { font-weight: 600; font-size: 15px; }
.monitor-data { display: flex; flex-direction: column; gap: 6px; }
.data-row { display: flex; justify-content: space-between; font-size: 13px; }
.data-label { opacity: 0.7; }
.data-value { font-weight: 600; color: #67c23a; }
.data-value.warning { color: #f56c6c; }

.history-list { max-height: 260px; overflow-y: auto; }
.history-item {
  padding: 10px 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  border-left: 3px solid #409eff;
  transition: all 0.3s;
}
.history-item:hover { background: rgba(255, 255, 255, 0.08); transform: translateX(4px); }
.history-item.high-risk { border-left-color: #f56c6c; background: rgba(245, 108, 108, 0.08); }

.history-time { font-size: 11px; color: #718096; margin-bottom: 4px; }
.history-content { margin-bottom: 4px; }
.history-location { font-weight: 600; font-size: 13px; color: #e0e6ed; }
.history-detail { font-size: 12px; color: #a0aec0; }

.safety-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.safety-item {
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.safety-item.full-width { grid-column: span 2; }
.safe { border-color: rgba(103, 194, 58, 0.4); background: rgba(103, 194, 58, 0.08); }
.unsafe { border-color: rgba(245, 108, 108, 0.4); background: rgba(245, 108, 108, 0.08); }
.safety-label { font-size: 11px; color: #a0aec0; margin-bottom: 4px; }
.safety-value { font-size: 16px; font-weight: 700; color: #fff; }

.map-card { min-height: 650px; }
.map-controls-top { display: flex; gap: 10px; align-items: center; }

.map-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: #0d1520;
  border-radius: 10px;
  overflow: auto;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.map-2d {
  position: relative;
  width: 1200px;
  height: 600px;
  min-width: 1200px;
  min-height: 600px;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
}
.view-local .map-2d { cursor: grab; }
.view-path .map-2d { cursor: crosshair; }

.campus-map { width: 100%; height: 100%; }

.diffusion-polygon {
  transition: all 0.3s ease;
}
.diffusion-polygon.animating {
  animation: breathe 2s ease-in-out infinite alternate;
}
@keyframes breathe {
  0% { opacity: 0.6; }
  100% { opacity: 0.9; }
}

.leak-pulse-circle {
  transition: r 0.1s linear;
}

.escape-path-main {
  filter: url(#glow);
}
.escape-path-dashed {
  animation: dash-flow 1s linear infinite;
}
@keyframes dash-flow {
  to { stroke-dashoffset: -36; }
}

.path-node { cursor: pointer; }
.node-circle {
  transition: all 0.2s ease;
}
.node-circle:hover {
  r: 12 !important;
  filter: url(#glow-strong);
}
.node-label {
  pointer-events: none;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.direction-arrow {
  pointer-events: none;
}

.timeline-control {
  margin-top: 14px;
  padding: 14px;
  background: rgba(26, 54, 93, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.timeline-title {
  font-weight: 600;
  font-size: 14px;
  color: #e0e6ed;
}
.timeline-info {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
  font-size: 12px;
  color: #a0aec0;
}

.path-control { display: flex; flex-direction: column; gap: 12px; }
.control-section {
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.control-row:last-child { margin-bottom: 0; }
.control-label {
  width: 72px;
  font-size: 13px;
  font-weight: 500;
  color: #cbd5e0;
  flex-shrink: 0;
}
.param-value {
  font-size: 13px;
  color: #409eff;
  font-weight: 600;
  min-width: 32px;
}
.param-value.small { font-size: 12px; min-width: 28px; }

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.path-info-panel {
  margin-top: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border-radius: 10px;
  border: 1px solid rgba(102, 126, 234, 0.3);
}
.info-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-align: center;
  color: #e0e6ed;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}
.info-label { font-size: 11px; color: #a0aec0; }
.info-value { font-size: 16px; font-weight: 700; color: #fff; }

.plan-list { max-height: 280px; overflow-y: auto; }
.plan-item {
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.plan-item:hover { background: rgba(255, 255, 255, 0.08); transform: translateX(4px); }
.plan-item.active { border-color: #409eff; background: rgba(64, 158, 255, 0.1); }
.plan-name { font-weight: 600; font-size: 13px; color: #e0e6ed; margin-bottom: 6px; }
.plan-type { margin-bottom: 8px; }
.plan-actions { display: flex; gap: 6px; }

.log-list { max-height: 280px; overflow-y: auto; }
.log-item {
  padding: 8px 10px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 11px;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}
.log-item:hover { background: rgba(255, 255, 255, 0.06); border-left-color: #409eff; }
.log-time { color: #718096; margin-bottom: 2px; }
.log-content { color: #cbd5e0; margin-bottom: 2px; word-break: break-all; }
.log-operator { color: #63b3ed; font-style: italic; font-size: 10px; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 3px; }
::-webkit-scrollbar-thumb { background: rgba(64, 158, 255, 0.3); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(64, 158, 255, 0.5); }

@media (max-width: 1500px) {
  .left-panel, .right-panel { width: 280px; }
}
@media (max-width: 1300px) {
  .main-content { flex-direction: column; overflow-y: auto; }
  .left-panel, .right-panel, .center-panel { width: 100%; max-height: none; }
  .map-container { height: 450px; }
}

/* Detail polish */
.emergency-command-center {
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 12% 4%, rgba(64, 224, 208, 0.13), transparent 30%),
    radial-gradient(circle at 88% 6%, rgba(230, 162, 60, 0.14), transparent 26%),
    linear-gradient(135deg, #081422 0%, #102a3f 48%, #071923 100%);
}

.emergency-command-center::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(120, 211, 214, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 211, 214, 0.04) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 84%);
}

.top-status-bar {
  min-height: 68px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(15, 42, 65, 0.9), rgba(9, 31, 42, 0.82)),
    rgba(30, 58, 95, 0.78);
  border-color: rgba(120, 211, 214, 0.22);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.3);
}

.page-title {
  font-size: clamp(19px, 1.35vw, 22px);
  letter-spacing: 0;
}

.emergency-level,
.time-display,
.weather-info {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.status-right .el-button {
  border-radius: 8px;
  min-height: 36px;
}

.main-content {
  gap: 18px;
}

.left-panel,
.right-panel {
  width: clamp(292px, 18vw, 330px);
}

.panel-card,
.map-card,
.timeline-control,
.control-section,
.path-info-panel,
.plan-item,
.log-item,
.safety-item,
.monitor-item {
  border-radius: 8px;
}

.panel-card {
  background:
    linear-gradient(160deg, rgba(12, 36, 58, 0.82), rgba(9, 35, 44, 0.7)),
    rgba(30, 58, 95, 0.68);
  border-color: rgba(120, 211, 214, 0.2);
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.24);
}

.panel-card:hover {
  transform: translateY(-2px);
  border-color: rgba(120, 211, 214, 0.42);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.34);
}

.panel-card :deep(.el-card__header) {
  background: rgba(5, 20, 34, 0.48);
  border-bottom-color: rgba(120, 211, 214, 0.18);
}

.card-title {
  color: #eef7fb;
  letter-spacing: 0;
}

.monitor-item {
  background:
    linear-gradient(135deg, rgba(64, 224, 208, 0.12), rgba(230, 162, 60, 0.07)),
    rgba(255, 255, 255, 0.035);
}

.map-container {
  height: min(60vh, 620px);
  min-height: 480px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(5, 16, 27, 0.96), rgba(9, 24, 33, 0.94));
  border-color: rgba(120, 211, 214, 0.2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
}

.map-2d {
  background: #f6f1e7;
}

.campus-map {
  display: block;
}

.timeline-control,
.control-section,
.path-info-panel {
  background: rgba(4, 17, 29, 0.52);
  border-color: rgba(120, 211, 214, 0.15);
}

.control-row {
  min-height: 34px;
}

.control-label {
  width: 78px;
  color: rgba(221, 235, 244, 0.82);
}

.param-value {
  color: #40e0d0;
}

.plan-item,
.log-item,
.history-item {
  background: rgba(4, 17, 29, 0.42);
}

.plan-item:hover,
.log-item:hover,
.history-item:hover {
  background: rgba(64, 224, 208, 0.08);
}

.info-grid,
.safety-grid {
  gap: 9px;
}

:deep(.el-radio-button__inner),
:deep(.el-button) {
  letter-spacing: 0;
}

@media (max-width: 1500px) {
  .top-status-bar {
    flex-wrap: wrap;
    gap: 12px;
  }

  .status-right {
    margin-left: auto;
  }
}

@media (max-width: 1300px) {
  .left-panel,
  .right-panel,
  .center-panel {
    width: 100%;
  }

  .left-panel,
  .right-panel {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .map-container {
    height: 520px;
  }
}

@media (max-width: 760px) {
  .emergency-command-center {
    padding: 12px;
  }

  .top-status-bar,
  .status-left,
  .status-center,
  .status-right {
    align-items: stretch;
    width: 100%;
  }

  .top-status-bar,
  .status-left,
  .status-center,
  .status-right {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    grid-template-columns: 1fr;
  }

  .map-controls-top {
    overflow-x: auto;
  }

  .map-container {
    min-height: 360px;
    height: 420px;
  }
}
</style>
