<template>
  <div class="chempark-container">
    <SmartMapAiDraftBanner />
    <div class="main-layout">
      <aside class="left-panel">
        <div class="panel-section">
          <SmartMapSearchBox v-model="searchQuery" @search="onSearch" />
        </div>
        <SmartMapEmergencyScenarioPanel
          :advanced-visible="showAdvancedDiffusion"
          :btex-validation-status-class="btexValidationStatusClass"
          :btex-validation-summary="btexValidationSummary"
          :command-workflow-steps="commandWorkflowSteps"
          :diffusion-condition-label="diffusionConditionLabel"
          :diffusion-form="diffusionForm"
          :diffusion-frame-count="diffusionFrames.length"
          :diffusion-gas-options="diffusionGasOptions"
          :diffusion-model-label="diffusionModelLabel"
          :diffusion-running="diffusionState.running"
          :diffusion-source-hint="diffusionSourceHint"
          :diffusion-source-options="diffusionSourceOptions"
          :diffusion-source-validation="diffusionSourceValidation"
          :leak-source-entry-label="leakSourceEntryLabel"
          :leak-source-location-text="leakSourceLocationText"
          :leak-source-state="leakSourceState"
          :prairie-validation-status-class="prairieValidationStatusClass"
          :prairie-validation-summary="prairieValidationSummary"
          @apply-manual-geo="applyManualGeoLeakSource"
          @clear-evacuation="clearEvacuationPlanning"
          @reset-diffusion="resetDiffusionSimulation"
          @run-batch-evacuation="runBatchEvacuationPlanning({ displayMode: 'all' })"
          @run-conditioned-demo="runConditionedDiffusionDemo"
          @run-diffusion="runDiffusionSimulation()"
          @run-evacuation="runEvacuationPlanning()"
          @toggle-advanced="showAdvancedDiffusion = !showAdvancedDiffusion"
          @toggle-leak-source-picking="toggleLeakSourcePicking"
          @use-selected-facility="useSelectedFacilityAsLeakSource"
        />
        <SmartMapSourceInversionPanel
          :current-frame="diffusionState.currentFrame"
          :deep-particle-result="isDeepParticleResult"
          :diffusion-frame-count="diffusionFrames.length"
          :expert-visible="showSourceInversionExpertSettings"
          :observation-summary="inversionObservationSummary"
          :particle-filter-config="particleFilterConfig"
          :refinement-state="refinementState"
          :source-inversion-config="sourceInversionConfig"
          :source-inversion-state="sourceInversionState"
          :source-workflow-steps="sourceWorkflowSteps"
          @clear-workflow="clearSourceInversionWorkflow"
          @export-observations="exportObservationPayloadJson"
          @prepare-observations="prepareObservationDataset"
          @run-coarse-search="runAnalyticCoarseSearchPreview()"
          @run-particle-filter="runParticleFilterInversionPreview"
          @toggle-expert="showSourceInversionExpertSettings = !showSourceInversionExpertSettings"
          @toggle-playback="toggleRefinementPlayback"
        />
        <div class="panel-section">
          <div class="panel-title"><i class="fas fa-chart-pie"></i> 园区概览</div>
          <SmartMapStatsGrid
            :stats="stats"
            :active-filter="activeFilter"
            @set-filter="setFilter"
          />
        </div>
        <div class="panel-section">
          <div class="panel-title"><i class="fas fa-palette"></i> 图例</div>
          <SmartMapLegendList :legends="legends" />
        </div>
        <div class="panel-section" style="flex:1;">
          <div class="panel-title"><i class="fas fa-map-marked-alt"></i> 功能分区</div>
          <SmartMapZoneList
            :zones="zones"
            :selected-zone="selectedZone"
            @select-zone="selectZone"
          />
        </div>
      </aside>

      <main class="map-container" ref="mapContainerRef">
        <template v-if="viewMode === '2d'">
        <SuperMap2DLayer />
        <div class="grid-overlay"></div>
        <canvas
            ref="mapCanvasRef"
            id="mapCanvas"
            :class="{ grabbing: isDragging }"
            @mousedown="onCanvasMouseDown"
            @mousemove="onCanvasMouseMove"
            @mouseup="onCanvasMouseUp"
            @mouseleave="onCanvasMouseLeave"
            @wheel.prevent="onCanvasWheel"
        ></canvas>

        <SmartMapCoordinateDisplay
          :longitude="coordLongitude"
          :latitude="coordLatitude"
          :altitude="coordAltitude"
        />

        <SmartMapSensorHoverCard
          :card="hoveredSensorCard"
          :priority-color="getPriorityColor"
        />

        <SmartMapBottomToolbar
          :measure-mode="measureMode"
          :show-entrances="showEntrances"
          :show-sensors="showSensors"
          :show-sensor-ranges="showSensorRanges"
          @set-tool="setTool"
          @toggle-entrances="toggleEntrances"
          @toggle-sensors="toggleSensors"
          @toggle-sensor-ranges="toggleSensorRanges"
        />

        <SmartMapDiffusionTimeline
          :frame-count="diffusionFrames.length"
          :current-frame="diffusionState.currentFrame"
          :playing="diffusionState.playing"
          :speed="diffusionState.speed"
          :loop="diffusionState.loop"
          :speed-options="playbackSpeedOptions"
          :summary="diffusionSummary"
          :model-label="diffusionModelLabel"
          @seek="seekDiffusionFrame"
          @step="stepDiffusionFrame"
          @toggle="toggleDiffusionPlayback"
          @update-speed="diffusionState.speed = $event"
          @update-loop="diffusionState.loop = $event"
        />

        <SmartMapViewportControls
          :show-labels="showLabels"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @zoom-reset="zoomReset"
          @toggle-labels="toggleLabels"
        />
        </template>

        <ParkScene3D
            v-if="viewMode === '3d'"
            ref="scene3DRef"
            :selected-facility-id="selectedFacility?.id"
            @facility-click="smartMapSelectionActions.setSelectedFacilityById"
            @scene-object-pick="handleSceneObjectPick" />
      </main>

      <aside class="right-panel" :class="{ collapsed: panelCollapsed }">
        <div class="info-header">
          <div>
            <h2>{{ infoTitle }}</h2>
            <div style="margin-top:4px;">
              <span v-if="infoSubtitle.text" :style="{ color: infoSubtitle.color }">{{ infoSubtitle.text }}</span>
              <span v-if="infoSubtitle.tag" :class="infoSubtitle.tagClass" style="margin-left:4px;">{{ infoSubtitle.tag }}</span>
              <span v-if="infoSubtitle.desc" style="color:var(--fg-muted);font-size:12px;margin-left:4px;">{{ infoSubtitle.desc }}</span>
            </div>
          </div>
          <button class="close-btn" @click="closeInfo"><i class="fas fa-times"></i></button>
        </div>
        <div class="info-body">
          <template v-if="selectedFacility || selectedSensor || selectedCar">
            <div v-for="(row, idx) in infoRows" :key="idx" class="info-row">
              <span class="info-key">{{ row.key }}</span>
              <span class="info-val" v-if="row.action" @click="row.action" style="cursor:pointer;">
                <button class="info-car-btn" :class="row.btnClass">{{ row.val }}</button>
              </span>
              <span class="info-val" v-else-if="row.tag" :class="row.tagClass">{{ row.val }}</span>
              <span class="info-val" v-else :style="row.style || {}">{{ row.val }}</span>
            </div>
            <SmartMapYoloResultCard
              :result="yoloResult"
              :selected-car-id="selectedCar?.id ?? null"
            />
            <div v-if="selectedFacility?.type === 'tank' && selectedFacility.level != null" class="info-row">
              <span class="info-key">液位指示</span>
              <div class="mini-bar">
                <div class="mini-bar-fill"
                     :style="{ width: selectedFacility.level + '%', background: selectedFacility.level > 85 ? 'var(--danger)' : 'var(--info)' }"
                ></div>
              </div>
            </div>
            <SmartMapSensorHistoryChart :chart="selectedSensorHistoryChart" />
            <SmartMapSelectedSensorDataPanel
              v-if="selectedSensor"
              :editor-state="sensorEditorState"
              :sensor="selectedSensor"
              @apply-current="applySelectedSensorManualValueToCurrentFrame"
              @clear-series="clearSelectedSensorManualSeries"
              @copy-auto-series="copyAutoSeriesToSelectedSensorManual"
              @fill-series="fillSelectedSensorManualSeries"
              @set-mode="setSelectedSensorMode"
              @update-current-concentration="sensorEditorState.currentFrameConcentration = $event"
              @update-fill-concentration="sensorEditorState.fillAllConcentration = $event"
            />
          </template>
          <SmartMapSelectedSensorActions
            v-if="selectedSensor"
            @delete="deleteCurrSensor"
            @edit="openSensorEdit"
          />
          <SmartMapSensorDeviceCard
            :card="selectedSensor ? sensorDeviceCard : null"
            @open-fullscreen="openDeviceFullscreen"
          />
          <div v-if="!selectedFacility && !selectedSensor && !selectedCar" style="text-align:center;padding:40px 0;color:var(--fg-muted);font-size:13px;">
            <i class="fas fa-mouse-pointer" style="font-size:32px;opacity:0.2;display:block;margin-bottom:12px;"></i>
            点击地图上的设施查看详细信息
          </div>
        </div>

        <SmartMapDiffusionSummaryPanel :summary="diffusionSummary" />

        <SmartMapEvacuationSummaryPanel
          :batch-result="evacuationBatchResult"
          :candidate-route-count="evacuationCandidateRoutes.length"
          :planning-mode="evacuationPlanningMode"
          :summary="evacuationSummary"
        />

        <SmartMapEvacuationCandidatePanel
          :batch-result="evacuationBatchResult"
          :display-mode="evacuationDisplayMode"
          :planning-mode="evacuationPlanningMode"
          :recommended-candidate-id="evacuationRecommendedCandidateId"
          :routes="evacuationCandidateRoutes"
          :selected-candidate="selectedEvacuationCandidate"
          :selected-candidate-id="selectedEvacuationCandidateId"
          @select-candidate="selectEvacuationCandidate"
          @update:display-mode="evacuationDisplayMode = $event"
        />

        <SmartMapEvacuationBuildingPanel
          :routes="evacuationBuildingRoutes"
          :selected-building-id="selectedEvacuationBuildingId"
          @select-building="selectEvacuationBuilding($event, true)"
        />

        <SmartMapObservationSummaryPanel
          :coarse-search-summary="coarseSearchSummary"
          :observation-payload-preview="observationPayloadPreview"
          :observation-summary="observationSummary"
          :sensor-reading-boundary-text="sensorReadingBoundaryText"
          :sensor-reading-status-text="sensorReadingStatusText"
        />

        <SmartMapRefinementSummaryPanel
          :current-iteration="refinementCurrentIteration"
          :current-step="refinementState.currentStep"
          :input-summary="refinementInputSummary"
          :iterations="refinementIterations"
          :summary="refinementSummary"
          @seek-step="seekRefinementStep"
        />

        <SmartMapCoarseCandidatePanel
          :candidates="coarseCandidateRegions"
          :selected-candidate="selectedCoarseCandidate"
          :selected-candidate-id="selectedCoarseCandidateId"
          @select-candidate="selectCoarseCandidate($event, true)"
        />

        <div class="panel-section">
          <div class="panel-title"><i class="fas fa-signal"></i> 区域风险等级</div>
          <SmartMapRiskStats :stats="riskStat" />
        </div>

        <div class="panel-section">
          <SmartMapWeatherPanel
            :source="weatherSource"
            :state="weatherState"
          />
        </div>

        <div class="panel-section">
          <div class="panel-title"><i class="fas fa-microchip"></i> 传感器布局统计</div>
          <SmartMapLayoutStats :summary="layoutResult" />

          <SmartMapLayoutActions
            :sensor-picking="sensorPlacementState.picking"
            :manual-panel-visible="manualSensorPanelVisible"
            :manual-config-visible="manualSensorConfigVisible"
            @add-manual-sensor="addManualSensor"
            @toggle-manual-panel="toggleManualSensorPanel"
            @clear-all-sensors="clearAllSensor"
          />
          <SmartMapSensorManualConfigPanel
            v-if="manualSensorConfigVisible"
            :defaults="MANUAL_SENSOR_DEFAULTS"
            :draft="manualSensorDraft"
            :location-text="manualSensorPlacementLocationText"
            :origin="sensorPlacementState.origin"
            :pending-point="sensorPlacementState.pendingPoint"
            :picking="sensorPlacementState.picking"
            :picking-origin="sensorPlacementState.pickingOrigin"
            :point-label="manualSensorPlacementPointLabel"
            :relative-x="sensorPlacementState.relativeX"
            :relative-y="sensorPlacementState.relativeY"
            :validation="manualSensorDraftValidation"
            @apply-relative-coordinates="applyRelativeCoordinates"
            @cancel="cancelManualSensorPlacement"
            @confirm="confirmManualSensorPlacement"
            @reset-draft="resetManualSensorDraft(true)"
            @start-picking="startManualSensorPicking"
            @toggle-origin-picking="toggleOriginPicking"
            @update-draft="Object.assign(manualSensorDraft, $event)"
            @update-relative-x="sensorPlacementState.relativeX = $event"
            @update-relative-y="sensorPlacementState.relativeY = $event"
          />
          <SmartMapSensorBatchImportPanel
            v-if="manualSensorConfigVisible"
            :default-height="batchDefaultHeight"
            :default-range="batchDefaultRange"
            :preview="batchImportPreview"
            :text="batchImportText"
            @execute="executeBatchImport"
            @paste="pasteFromClipboard"
            @update:default-height="batchDefaultHeight = $event"
            @update:default-range="batchDefaultRange = $event"
            @update:text="batchImportText = $event"
          />
          <SmartMapSensorManualEntryPanel
            v-if="manualSensorPanelVisible"
            :current-frame="diffusionFrames.length ? diffusionState.currentFrame + 1 : 0"
            :editor-state="sensorEditorState"
            :sensors="sensors"
            :target="manualSensorTarget"
            :target-id="manualSensorTargetId"
            @apply-current="applySelectedSensorManualValueToCurrentFrame"
            @clear-series="clearSelectedSensorManualSeries"
            @copy-auto-series="copyAutoSeriesToSelectedSensorManual"
            @fill-series="fillSelectedSensorManualSeries"
            @select-target="selectManualSensorTarget"
            @set-mode="setManualPanelSensorMode"
            @update-current-concentration="sensorEditorState.currentFrameConcentration = $event"
            @update-fill-concentration="sensorEditorState.fillAllConcentration = $event"
          />
          <SmartMapSamplingSummary :summary="sensorSamplingSummary" />
        </div>

        <SmartMapGasEditorPanel
          :draft="gasEditDraft"
          :gases="gases"
          :visible="gasPanelVisible"
          @edit-gas="editGas"
          @remove-gas="removeGas"
          @reset-draft="resetGasDraft"
          @save-draft="saveGasDraft"
          @toggle-visible="gasPanelVisible = !gasPanelVisible"
        />

        <div class="panel-section" style="margin-top:auto;">
          <div class="panel-title"><i class="fas fa-bell"></i> 实时告警</div>
          <SmartMapAlertList :alerts="alerts" />
        </div>
      </aside>
    </div>

    <SmartMapDeviceFullscreen
      :visible="deviceFullscreenVisible"
      :data="deviceFullscreenData"
      :zoom="deviceImgZoom"
      :pan-x="deviceImgPanX"
      :pan-y="deviceImgPanY"
      @close="closeDeviceFullscreen"
      @wheel="onDeviceImgWheel"
      @drag-start="onDeviceImgDragStart"
      @drag-move="onDeviceImgDragMove"
      @drag-end="onDeviceImgDragEnd"
      @double-click="onDeviceImgDblClick"
      @zoom-in="deviceImgZoomIn"
      @zoom-out="deviceImgZoomOut"
      @zoom-reset="deviceImgZoomReset"
    />

    <SmartMapSensorEditDialog
      :visible="sensorEditVisible"
      :draft="sensorEditDraft"
      @close="closeSensorEdit"
      @save="saveSensorEdit"
      @update-draft="updateSensorEditDraft"
    />
    <SmartMapSourceInversionProgressModal :state="sourceInversionProgress" />
    <SmartMapToast
      :visible="toastVisible"
      :text="toastText"
      :type="toastType"
      :icon="toastIcon"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { GasRecord, GasSavePayload } from '@/api/gas'
import type { SensorRecord } from '@/api/sensor'
import {
  GRID_SIZE as PHASE1_GRID_SIZE,
  MAP_HEIGHT as PHASE1_MAP_HEIGHT,
  MAP_METERS_PER_UNIT as PHASE1_MAP_METERS_PER_UNIT,
  MAP_WIDTH as PHASE1_MAP_WIDTH,
  getFrameConcentrationAtPoint,
  getGasById,
} from '@/data/phase1Config'
import {
  findNearestAllowedGasSourceFacility,
  getGasSourceConfig,
  validateGasLeakSource,
} from '@/data/gasSourceCatalog'
import { formatGeoCoord, geoToWorld, worldToGeo } from '@/data/coordinate'
import {
  sensorTypes,
} from '@/data/sensorCatalog'
import {
  REAL_MAP,
  alerts,
  buildingEntrances,
  dataBoundary,
  facilities,
  facilityById,
  getFacilityAnchorPoint,
  keyAreas,
  legends,
  parkEntrances,
  pipes,
  roads,
  stats,
  zones,
} from '@/data/realMapAssets'
import { REAL_SENSOR_LAYOUT_COUNT } from '@/data/realSensorLayout'
import { CAR_PATROL_ROUTES } from '@/data/carPatrolRoutes'
import type { MapFacility } from '@/data/realMapAssets'
import { useCarStore } from '@/store/carStore'
import { useSmartMapCarInteraction } from './useSmartMapCarInteraction'
import {
  normalizeSeriesConcentration,
  type SmartMapRecord,
} from './useSmartMapInversion'
import type { SmartMapObservationPayload, SmartMapObservationSummary, SmartMapRefinementInput } from './useSmartMapInversion'
import { eventValue, getErrorMessage, getErrorStatus } from './useSmartMapUi'
import { useSmartMapAlgorithmStates } from './useSmartMapAlgorithmStates'
import { useSmartMapCatalogPersistence } from './useSmartMapCatalogPersistence'
import {
  useSmartMapCarPatrol,
  type SmartMapCarPatrolRoute,
} from './useSmartMapCarPatrol'
import {
  type SmartMapDiffusionFrame,
} from './useSmartMapDiffusionLayer'
import { useSmartMapDiffusionPlayback } from './useSmartMapDiffusionPlayback'
import { useSmartMapRefinementPlayback } from './useSmartMapRefinementPlayback'
import { useSmartMapDiffusionScenario } from './useSmartMapDiffusionScenario'
import { useSmartMapDiffusionSimulation } from './useSmartMapDiffusionSimulation'
import type { SmartMapGas as SmartGas, SmartMapSourceFacility } from './useSmartMapDiffusionTypes'
import {
  type SmartMapSourceCandidateRegion,
  type SmartMapSourceRefinementIteration,
} from './useSmartMapSourceInversionOverlay'
import {
  type SmartMapActiveSensor,
  type SmartMapSensorSeriesRecord,
} from './useSmartMapSensorSeries'
import { useSmartMapSensorSeriesActions } from './useSmartMapSensorSeriesActions'
import { useSmartMapDeviceImage } from './useSmartMapDeviceImage'
import { useSmartMapGasEditor } from './useSmartMapGasEditor'
import { useSmartMapToast } from './useSmartMapToast'
import { useSmartMapValidationReports } from './useSmartMapValidationReports'
import {
  computeSmartMapSensorRisk as computeSensorRisk,
  createSmartMapNearestFacilityLookup,
  getSmartMapFacilitySensorAnchor as getFacilitySensorAnchor,
  getSmartMapPriorityColor as getPriorityColor,
  getSmartMapPriorityLabel as getPriorityLabel,
  isSmartMapPointNearFacility as isPointNearFacility,
  type SmartMapRiskGridCell,
} from './useSmartMapSensorPlacementRules'
import {
  calculateSmartMapSensorCoverage,
  summarizeSmartMapRiskGrid,
  useSmartMapRiskGridActions,
} from './useSmartMapRiskGrid'
import {
  buildSmartMapBaseStandardLayout,
  generateSmartMapSensorCode,
} from './useSmartMapSensorLayout'
import {
  useSmartMapSensorReadings,
} from './useSmartMapSensorReadings'
import { useSmartMapSensorEditor, useSmartMapSensorEditorSyncBridge } from './useSmartMapSensorEditor'
import {
  MANUAL_SENSOR_DEFAULTS,
  normalizeSmartMapManualSensorNumber,
  useSmartMapSensorPlacement,
  useSmartMapSensorPlacementCancelBridge,
} from './useSmartMapSensorPlacement'
import { useSmartMapSensorBatchImport } from './useSmartMapSensorBatchImport'
import {
  useSmartMapHitTestingActions,
} from './useSmartMapHitTesting'
import { useSmartMapInfoPanel } from './useSmartMapInfoPanel'
import { useSmartMapSensorInfoActionBridge, useSmartMapSensorInfoActions } from './useSmartMapSensorInfo'
import { useSmartMapSensorHoverCard } from './useSmartMapSensorHoverCard'
import { useSmartMapRiskSummary } from './useSmartMapRiskSummary'
import {
  getSmartMapFacilityBounds,
  smartMapHasRadiusFacility,
} from './useSmartMapFacilityCanvas'
import type { SmartMapEntranceRecord as EntranceLike } from './useSmartMapEntranceCanvas'
import type { SmartMapSensorCanvasRecord } from './useSmartMapSensorCanvas'
import { useSmartMapRenderer } from './useSmartMapRenderer'
import { useSmartMapRenderBridge } from './useSmartMapRenderBridge'
import { useSmartMapViewport } from './useSmartMapViewport'
import { useSmartMapRuntimeDisplay } from './useSmartMapRuntimeDisplay'
import { useSmartMapWeatherState } from './useSmartMapWeatherState'
import { useSmartMapMeasureTool } from './useSmartMapMeasureTool'
import { useSmartMapViewControls } from './useSmartMapViewControls'
import { useSmartMapCanvasShell } from './useSmartMapCanvasShell'
import { useSmartMapCanvasInteraction } from './useSmartMapCanvasInteraction'
import { useSmartMapCanvasSelectionActions } from './useSmartMapCanvasSelectionActions'
import { useSmartMapCanvasRuntime } from './useSmartMapCanvasRuntime'
import { useSmartMapLifecycleCoordinator } from './useSmartMapLifecycleCoordinator'
import { useSmartMapCoreState } from './useSmartMapCoreState'
import { useSmartMapLeakSource } from './useSmartMapLeakSource'
import { useSmartMapWorkflowSteps } from './useSmartMapWorkflowSteps'
import { useSmartMapSourceWorkflowState } from './useSmartMapSourceWorkflowState'
import { useSmartMapObservationBuilders } from './useSmartMapObservationBuilders'
import { useSmartMapObservationPayloadActions } from './useSmartMapObservationPayloadActions'
import {
  useSmartMapSourceInversionActions,
  type SmartMapSourceInversionProgressState,
} from './useSmartMapSourceInversionActions'
import { useSmartMapMonitoringSummaryState } from './useSmartMapMonitoringSummaryState'
import { useSmartMapSelectionDisplayState } from './useSmartMapSelectionDisplayState'
import {
  normalizeSmartMapPoint,
} from './smartMapLightweightConcentration'
import {
  createSmartMapSensorRenderRules,
  resolveSmartMapSensorDetectionRange as resolveSensorDetectionRange,
  resolveSmartMapSensorEffectiveRange as resolveSensorEffectiveRange,
  resolveSmartMapSensorInstallationHeight as resolveSensorInstallationHeight,
  resolveSmartMapSensorInstallRemark as resolveSensorInstallRemark,
} from './smartMapSensorDimensions'
import {
  createSmartMapInfoClearAction,
  useSmartMapPageActions,
} from './useSmartMapPageActions'
import { useSmartMapEvacuationPlanning } from './useSmartMapEvacuationPlanning'
import { useSmartMapEvacuationPlanningActions } from './useSmartMapEvacuationPlanningActions'
import {
  loadSuperMapPlanningInputs,
  type SuperMapPlanningInputs,
} from './useSuperMapIserverData'
import ParkScene3D from './components/ParkScene3D.vue'
import SmartMapAlertList from './components/SmartMapAlertList.vue'
import SmartMapAiDraftBanner from './components/SmartMapAiDraftBanner.vue'
import SmartMapBottomToolbar from './components/SmartMapBottomToolbar.vue'
import SmartMapCoarseCandidatePanel from './components/SmartMapCoarseCandidatePanel.vue'
import SmartMapCoordinateDisplay from './components/SmartMapCoordinateDisplay.vue'
import SmartMapDiffusionTimeline from './components/SmartMapDiffusionTimeline.vue'
import SmartMapDiffusionSummaryPanel from './components/SmartMapDiffusionSummaryPanel.vue'
import SmartMapDeviceFullscreen from './components/SmartMapDeviceFullscreen.vue'
import SmartMapEmergencyScenarioPanel from './components/SmartMapEmergencyScenarioPanel.vue'
import SmartMapEvacuationBuildingPanel from './components/SmartMapEvacuationBuildingPanel.vue'
import SmartMapEvacuationCandidatePanel from './components/SmartMapEvacuationCandidatePanel.vue'
import SmartMapEvacuationSummaryPanel from './components/SmartMapEvacuationSummaryPanel.vue'
import SmartMapGasEditorPanel from './components/SmartMapGasEditorPanel.vue'
import SmartMapLayoutActions from './components/SmartMapLayoutActions.vue'
import SmartMapLayoutStats from './components/SmartMapLayoutStats.vue'
import SmartMapLegendList from './components/SmartMapLegendList.vue'
import SmartMapObservationSummaryPanel from './components/SmartMapObservationSummaryPanel.vue'
import SmartMapRefinementSummaryPanel from './components/SmartMapRefinementSummaryPanel.vue'
import SmartMapRiskStats from './components/SmartMapRiskStats.vue'
import SmartMapSamplingSummary from './components/SmartMapSamplingSummary.vue'
import SmartMapSensorBatchImportPanel from './components/SmartMapSensorBatchImportPanel.vue'
import SmartMapSensorHistoryChart from './components/SmartMapSensorHistoryChart.vue'
import SmartMapSensorDeviceCard from './components/SmartMapSensorDeviceCard.vue'
import SmartMapSensorManualConfigPanel from './components/SmartMapSensorManualConfigPanel.vue'
import SmartMapSensorManualEntryPanel from './components/SmartMapSensorManualEntryPanel.vue'
import SmartMapSelectedSensorActions from './components/SmartMapSelectedSensorActions.vue'
import SmartMapSelectedSensorDataPanel from './components/SmartMapSelectedSensorDataPanel.vue'
import SmartMapSourceInversionPanel from './components/SmartMapSourceInversionPanel.vue'
import SmartMapSourceInversionProgressModal from './components/SmartMapSourceInversionProgressModal.vue'
import SmartMapSensorHoverCard from './components/SmartMapSensorHoverCard.vue'
import SmartMapSensorEditDialog from './components/SmartMapSensorEditDialog.vue'
import SmartMapSearchBox from './components/SmartMapSearchBox.vue'
import SmartMapStatsGrid from './components/SmartMapStatsGrid.vue'
import SuperMap2DLayer from './components/SuperMap2DLayer.vue'
import SmartMapToast from './components/SmartMapToast.vue'
import SmartMapViewportControls from './components/SmartMapViewportControls.vue'
import SmartMapWeatherPanel from './components/SmartMapWeatherPanel.vue'
import SmartMapYoloResultCard from './components/SmartMapYoloResultCard.vue'
import SmartMapZoneList from './components/SmartMapZoneList.vue'
import type { SuperMapScenePickEventPayload } from '@/types/supermap-scene-events'

type SmartCar = { id: number; x: number; y: number; status?: string }
type SmartSensor = SensorRecord & SmartMapActiveSensor & SmartMapSensorCanvasRecord
type SmartOptions = {
  silent?: boolean
  emphasized?: boolean
  showMarkers?: boolean
  preferredCandidateId?: string
  preferredBuildingId?: string
  displayMode?: string
}
type CandidateRegion = SmartMapSourceCandidateRegion
const router = useRouter()
const carStore = useCarStore()

const { mapCanvasRef, mapContainerRef, isDragging, viewMode, scene3DRef } = useSmartMapCanvasShell<InstanceType<typeof ParkScene3D>>()
const smartMapRenderBridge = useSmartMapRenderBridge()
const {
  bindRuntimeCanvas,
  createRenderImage,
  getCanvas,
  render,
  setCanvasCursor,
} = smartMapRenderBridge
const { setShowSensorInfoAction, showSensorInfo } = useSmartMapSensorInfoActionBridge<SmartSensor>()
const { setSyncSensorEditorStateAction, syncSensorEditorState: syncSensorEditorStateBridge } = useSmartMapSensorEditorSyncBridge<SmartSensor>()
const { cancelSensorPicking: cancelSensorPickingBridge, cancelSensorOriginPicking: cancelSensorOriginPickingBridge, setCancelSensorPickingAction, setCancelSensorOriginPickingAction } = useSmartMapSensorPlacementCancelBridge()
const realMapImage = createRenderImage(REAL_MAP.image)
const {
  clearFacilityInfo,
  facilityLayerState,
  hoveredEntrance,
  hoveredFacility,
  hoveredSensor,
  infoRows,
  infoSubtitle,
  infoTitle,
  panelCollapsed,
  selectedFacility,
  setInfoPanel,
  showFacilityInfo: showFacilityInfoPanel,
} = useSmartMapInfoPanel<MapFacility, EntranceLike, SmartSensor>({ zones })
const {
  clearToastTimer,
  showToast,
  toastIcon,
  toastText,
  toastType,
  toastVisible,
} = useSmartMapToast()
const superMapPlanningInputs = ref<SuperMapPlanningInputs | null>(null)
const superMapPlanningLoadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const latestScenePickPayload = ref<SuperMapScenePickEventPayload | null>(null)
const superMapPlanningSourceLabel = computed(() => (
  superMapPlanningInputs.value?.sourceLabel || '前端静态数据兜底'
))

onMounted(() => {
  superMapPlanningLoadState.value = 'loading'
  loadSuperMapPlanningInputs().then((inputs) => {
    superMapPlanningInputs.value = inputs
    superMapPlanningLoadState.value = 'ready'
    showToast(`已接入 ${inputs.sourceLabel}`, 'success')
  }).catch((error: unknown) => {
    superMapPlanningLoadState.value = 'error'
    console.warn('[SuperMap] iServer Data 疏散数据加载失败，保留静态数据兜底', error)
    showToast(`iServer Data 疏散数据加载失败: ${getErrorMessage(error, '服务异常')}`, 'warn')
  })
})
function handleSceneObjectPick(payload: SuperMapScenePickEventPayload) {
  latestScenePickPayload.value = payload
  if (payload.projectedPoint) {
    showToast(
      `三维选中 ${payload.selectedObjectId} · CGCS2000(${payload.projectedPoint.easting.toFixed(2)}, ${payload.projectedPoint.northing.toFixed(2)})`,
      'success',
    )
    return
  }
  showToast(`三维选中 ${payload.selectedObjectId}，等待 CGCS2000 属性或新 Realspace 服务`, 'warn')
}
const sourceInversionProgress = ref<SmartMapSourceInversionProgressState>({
  visible: false,
  stepIndex: 0,
  totalSteps: 5,
  percent: 0,
  title: '正在进行监控点反向溯源',
  stepLabel: '等待启动',
  detail: '',
  code: '',
})
function setSourceInversionProgress(state: Partial<SmartMapSourceInversionProgressState>) {
  sourceInversionProgress.value = {
    ...sourceInversionProgress.value,
    ...state,
  }
}
function hideSourceInversionProgress() {
  sourceInversionProgress.value = {
    ...sourceInversionProgress.value,
    visible: false,
  }
}
const {
  clock,
  coordAltitude,
  coordLatitude,
  coordLongitude,
  updateClock,
  updateCoordDisplay,
} = useSmartMapRuntimeDisplay()

const {
  viewState,
  zoomLevel,
  worldToScreen,
  screenToWorld,
  getBoundarySafeScale,
  fitInitialMapView,
  zoomIn: zoomViewportIn,
  zoomOut: zoomViewportOut,
  applyWheelZoom,
  focusWorldPoint,
  viewportRenderControls,
} = useSmartMapViewport({
  getCanvas,
  map: REAL_MAP,
})
const {
  measureMode,
  addMeasurePoint,
  measureLayer,
  measureCursor,
  setSmartMapTool,
} = useSmartMapMeasureTool({ showToast })
const {
  activeFilter,
  onSearch,
  searchQuery,
  selectedZone,
  selectZone,
  setFilter,
  setTool,
  showEntrances,
  showHeatmap,
  showLabels,
  showSensorRanges,
  showSensors,
  toggleEntrances,
  toggleHeatmap,
  toggleLabels,
  toggleSensorRanges,
  toggleSensors,
  viewVisibility,
  zoomIn,
  zoomOut,
  zoomReset,
} = useSmartMapViewControls({
  facilities,
  selectedFacility,
  hoveredEntrance,
  getCanvas,
  getFacilityAnchorPoint,
  showFacilityInfo: showFacilityInfoPanel,
  setSmartMapTool,
  measureCursor,
  focusWorldPoint,
  fitInitialMapView,
  zoomViewportIn,
  zoomViewportOut,
  render,
  showToast,
})
const { sensors, gases, riskGrid, selectedSensor, coreLayerState, getRiskGrid, getSensors } = useSmartMapCoreState<SmartSensor, SmartGas, SmartMapRiskGridCell>()
const sensorRenderRules = createSmartMapSensorRenderRules(), findNearestFacility = createSmartMapNearestFacilityLookup(facilities)
const {
  sensorReadingLoadState,
  sensorReadingRecords,
  sensorReadingSummary,
  loadSensorReadings,
} = useSmartMapSensorReadings({ getErrorMessage })
const {
  initializeWeatherData,
  weatherSource,
  weatherState,
} = useSmartMapWeatherState()
const { computeRiskGrid } = useSmartMapRiskGridActions({
  riskGrid,
  weatherState,
  mapWidth: REAL_MAP.width,
  mapHeight: REAL_MAP.height,
  facilities,
})

const {
  calcCoverage,
  layoutResult,
  riskStat,
  updateRiskStat,
} = useSmartMapRiskSummary<SmartMapRiskGridCell, SmartSensor>({
  getRiskGrid,
  getSensors,
  sensorTypes,
  defaultRange: MANUAL_SENSOR_DEFAULTS.effectiveRange,
  resolveRange: resolveSensorEffectiveRange,
  calculateCoverage: calculateSmartMapSensorCoverage,
  summarizeRiskGrid: summarizeSmartMapRiskGrid,
})
const {
  currentDiffusionGas,
  diffusionForm,
  diffusionFrames,
  diffusionGasOptions,
  diffusionMeta,
  diffusionSourceOptions,
  getCurrentDiffusionGas,
  getSelectedDiffusionSource,
  playbackSpeedOptions,
  selectedDiffusionSource,
  showAdvancedDiffusion,
  showSourceInversionExpertSettings,
} = useSmartMapDiffusionScenario({
  facilities,
})
const {
  btexValidationReport,
  btexValidationLoadState,
  btexValidationStatusClass,
  btexValidationSummary,
  prairieValidationReport,
  prairieValidationLoadState,
  prairieValidationStatusClass,
  prairieValidationSummary,
  loadBtexValidationReport,
  loadPrairieGrassValidationReport,
} = useSmartMapValidationReports()
const {
  diffusionExecutorState,
  evacuationExecutorState,
  particleFilterConfig,
  sourceInversionConfig,
  sourceInversionExecutorState,
  sourceInversionRunState,
  sourceInversionState,
  sourceRefinementConfig,
} = useSmartMapAlgorithmStates()
const {
  currentDiffusionFrame, diffusionRunState,
  diffusionState,
  getCurrentDiffusionFrame,
  getCurrentDiffusionFrameIndex,
  resetDiffusionPlayback,
  seekDiffusionFrame,
  setDiffusionRunning,
  startDiffusionPlaybackFromFirstFrame,
  stepDiffusionFrame,
  toggleDiffusionPlayback,
  updateDiffusionPlayback,
} = useSmartMapDiffusionPlayback<SmartMapDiffusionFrame>({
  frames: diffusionFrames,
  render,
})
const {
  carLayerState,
  carMarkers,
  carPatrolEnabled,
  carRefreshTimer,
  mobileSensorReadings,
  carHitTest,
  refreshCarData,
  syncCarMarkers,
  syncCarMobileSensors,
  toggleCarPatrol,
  toggleCars,
  updateCarPatrol,
} = useSmartMapCarPatrol({
  carStore,
  carPatrolRoutes: CAR_PATROL_ROUTES as Record<number, SmartMapCarPatrolRoute | undefined>,
  diffusionFrames,
  getCurrentFrame: getCurrentDiffusionFrame,
  getCurrentFrameIndex: getCurrentDiffusionFrameIndex,
  getFrameConcentrationAtPoint,
  render,
  showToast,
})
const {
  carInteractionLayerState,
  hoveredCar,
  selectedCar,
  selectCar,
  showCarInfo,
  yoloResult,
} = useSmartMapCarInteraction<SmartCar>({
  carStore,
  router,
  getCanvas,
  getErrorMessage,
  refreshCarData,
  render,
  selectedFacility,
  selectedSensor,
  setInfoPanel,
  showToast,
  viewState,
})
const {
  leakSourceState,
  diffusionSourceValidation,
  diffusionSourceHint,
  currentLeakSourcePoint,
  getCurrentLeakSourcePoint,
  cancelLeakSourcePicking,
  isLeakSourcePicking,
  diffusionSourceLayer,
  leakSourceEntryLabel,
  leakSourceLocationText,
  syncManualGeoInputsFromWorld,
  updateDiffusionMetaSource,
  applyMapLeakSourcePoint,
  toggleLeakSourcePicking,
  applyManualGeoLeakSource,
  useSelectedFacilityAsLeakSource,
} = useSmartMapLeakSource({
  diffusionForm,
  diffusionMeta,
  facilities,
  facilityById,
  diffusionSourceOptions,
  selectedDiffusionSource,
  selectedFacility,
  normalizeMapPoint: normalizeSmartMapPoint,
  worldToGeo,
  geoToWorld,
  getFacilityAnchorPoint,
  getGasById,
  getGasSourceConfig,
  findNearestAllowedGasSourceFacility,
  validateGasLeakSource,
  cancelSensorPicking: cancelSensorPickingBridge,
  cancelSensorOriginPicking: cancelSensorOriginPickingBridge,
  setCanvasCursor,
  measureCursor,
  showToast,
  render,
})
const {
  buildActiveSensorSeries,
  buildFrameSeriesTemplate,
  buildSensorHistoryChart,
  getSensorAlarmLevel,
  getSensorAutoConcentration,
  getSensorCurrentConcentration,
  normalizeManualSeries,
  resampleSensorsFromDiffusion,
} = useSmartMapSensorSeriesActions<SmartSensor, MapFacility | null>({
  sensors,
  selectedSensor,
  diffusionFrames,
  currentDiffusionFrame,
  diffusionMeta,
  diffusionState,
  diffusionForm,
  weatherState,
  sensorReadingRecords,
  getCurrentLeakSourcePoint,
  getGasById,
  getFrameConcentrationAtPoint,
  findNearestFacility,
  computeSensorRisk,
  showSensorInfo,
  syncSensorEditorState: syncSensorEditorStateBridge,
})
const {
  diffusionConditionLabel,
  diffusionModelLabel,
  diffusionSummary,
  isSimulatedConcentration,
  sensorReadingBoundaryText,
  sensorReadingStatusText,
  sensorSamplingSummary,
} = useSmartMapMonitoringSummaryState<SmartSensor>({
  currentDiffusionFrame,
  diffusionForm,
  diffusionFrames,
  diffusionMeta,
  diffusionState,
  selectedDiffusionSource,
  getCurrentLeakSourcePoint,
  getGasById,
  getSensorCurrentConcentration,
  sensorReadingLoadState,
  sensorReadingRecords,
  sensorReadingSummary,
  sensors,
})
const {
  sensorDeviceCard,
  getSensorDeviceImage,
  deviceFullscreenVisible,
  deviceFullscreenData,
  deviceImgZoom,
  deviceImgPanX,
  deviceImgPanY,
  openDeviceFullscreen,
  closeDeviceFullscreen,
  onDeviceImgWheel,
  onDeviceImgDragStart,
  onDeviceImgDragMove,
  onDeviceImgDragEnd,
  onDeviceImgDblClick,
  deviceImgZoomIn,
  deviceImgZoomOut,
  deviceImgZoomReset,
} = useSmartMapDeviceImage<SmartSensor>({
  selectedSensor,
  getCurrentConcentration: getSensorCurrentConcentration,
  render,
})
const { hoveredSensorCard } = useSmartMapSensorHoverCard<SmartSensor, ReturnType<typeof getCurrentDiffusionGas>>({
  hoveredSensor,
  sensorTypes,
  getCurrentGas: getCurrentDiffusionGas,
  getCurrentFrame: getCurrentDiffusionFrame,
  getCurrentConcentration: getSensorCurrentConcentration,
  getAlarmLevel: getSensorAlarmLevel,
  getPriorityLabel,
})
const {
  coarseCandidateRegions,
  coarseSearchResult,
  coarseSearchSummary,
  isDeepParticleResult,
  observationPayload,
  observationPayloadPreview,
  observationSummary,
  refinementInput,
  refinementInputSummary,
  refinementIterations,
  refinementResult,
  refinementSummary,
  selectedCoarseCandidate,
  selectedCoarseCandidateId,
  sourceWorkflowLayerState,
} = useSmartMapSourceWorkflowState({
  candidateRadius: sourceInversionConfig.candidateRadius,
})
const {
  buildObservationSummary,
  createObservationPayload,
  createParticleFilterPayload,
  getInversionObservationSensors,
  getObservationReadySensors,
  refreshSensorReadingsForObservation,
} = useSmartMapObservationBuilders<SmartSensor, SmartMapRecord, SmartMapDiffusionFrame>({
  sensors,
  mobileSensorReadings,
  diffusionFrames,
  currentDiffusionFrame,
  diffusionState,
  diffusionForm,
  diffusionMeta,
  sourceInversionConfig,
  particleFilterConfig,
  currentDiffusionGas,
  selectedDiffusionSource,
  selectedCoarseCandidate,
  coarseCandidateRegions,
  coarseSearchResult,
  sensorReadingLoadState,
  dataBoundary,
  getCurrentLeakSourcePoint,
  loadSensorReadings,
  buildActiveSensorSeries,
  render,
  showToast,
})
const {
  inversionObservationSummary,
  selectedSensorHistoryChart,
} = useSmartMapSelectionDisplayState({
  buildSensorHistoryChart,
  getInversionObservationSensors,
  getObservationReadySensors,
  selectedSensor,
})
const {
  exportObservationPayloadJson,
  generateObservationPayloadExport,
  prepareObservationDataset,
  setObservationPayloadState,
} = useSmartMapObservationPayloadActions({
  buildObservationSummary,
  createObservationPayload,
  observationPayload,
  observationSummary,
  showToast,
})
const {
  refinementLayerState,
  refinementCurrentIteration,
  refinementState,
  resetRefinementPlayback,
  seekRefinementStep,
  startRefinementPlayback,
  toggleRefinementPlayback,
  updateRefinementPlayback,
} = useSmartMapRefinementPlayback({
  iterations: refinementIterations,
  render,
  showToast,
})
const {
  clearAnalyticCoarseSearch,
  clearSourceInversionRefinement,
  clearSourceInversionWorkflow,
  runAnalyticCoarseSearchPreview,
  runAnalyticRefinementPreview,
  runParticleFilterInversionPreview,
  selectCoarseCandidate,
} = useSmartMapSourceInversionActions({
  coarseCandidateRegions,
  coarseSearchResult,
  coarseSearchSummary,
  diffusionFrames,
  diffusionState,
  observationPayload,
  observationSummary,
  particleFilterConfig,
  refinementInput,
  refinementResult,
  refinementSummary,
  selectedCoarseCandidate,
  selectedCoarseCandidateId,
  sourceInversionConfig,
  sourceInversionExecutorState,
  sourceInversionState,
  sourceRefinementConfig,
  viewState,
  createObservationPayload,
  createParticleFilterPayload,
  getCanvas,
  getCurrentLeakSourcePoint,
  getObservationReadySensors,
  hideInversionProgress: hideSourceInversionProgress,
  refreshSensorReadingsForObservation,
  resetRefinementPlayback,
  render,
  setObservationPayloadState,
  setInversionProgress: setSourceInversionProgress,
  showToast,
  startRefinementPlayback,
})
const {
  activeEvacuationRoute,
  clearEvacuationPlanningState,
  evacuationBatchResult,
  evacuationBuildingRoutes,
  evacuationCandidateRoutes,
  evacuationDisplayMode,
  evacuationLayerState,
  evacuationPlan,
  evacuationPlanningMode,
  evacuationRecommendedCandidateId,
  evacuationSummary,
  selectEvacuationBuilding: selectEvacuationBuildingState,
  selectEvacuationCandidate: selectEvacuationCandidateState,
  selectedEvacuationBuildingId,
  selectedEvacuationBuildingRoute,
  selectedEvacuationCandidate,
  selectedEvacuationCandidateId,
  syncSelectedEvacuationBuilding: syncSelectedEvacuationBuildingState,
  syncSelectedEvacuationCandidate: syncSelectedEvacuationCandidateState,
} = useSmartMapEvacuationPlanning({
  selectedFacility,
})
const {
  clearEvacuationPlanning,
  clearEvacuationPlanningSilently,
  rerunEvacuationAfterDiffusion,
  runBatchEvacuationPlanning,
  runEvacuationPlanning,
  selectEvacuationBuilding,
  selectEvacuationCandidate,
  syncSelectedEvacuationCandidate,
  syncSelectedFacilityToEvacuationPlan,
} = useSmartMapEvacuationPlanningActions({
  selectedFacility,
  currentDiffusionFrame,
  diffusionMeta,
  evacuationPlan,
  evacuationBatchResult,
  evacuationPlanningMode,
  evacuationDisplayMode,
  selectedEvacuationBuildingId,
  selectedEvacuationCandidateId,
  evacuationBuildingRoutes,
  buildingEntrances,
  facilityById,
  roads,
  parkEntrances,
  facilities,
  getPlanningInputs: () => {
    if (!superMapPlanningInputs.value) {
      return {
        roads,
        parkEntrances,
        buildingEntrances,
        facilities,
        facilityById,
        sourceLabel: superMapPlanningSourceLabel.value,
        usesSuperMapData: false,
      }
    }
    return {
      roads: superMapPlanningInputs.value.roads,
      parkEntrances: superMapPlanningInputs.value.parkEntrances as EntranceLike[],
      buildingEntrances: superMapPlanningInputs.value.buildingEntrances as EntranceLike[],
      facilities: superMapPlanningInputs.value.facilities,
      facilityById: superMapPlanningInputs.value.facilityById,
      map: superMapPlanningInputs.value.map,
      sourceLabel: superMapPlanningInputs.value.sourceLabel,
      usesSuperMapData: true,
    }
  },
  syncSelectedEvacuationCandidateState,
  syncSelectedEvacuationBuildingState,
  selectEvacuationCandidateState,
  selectEvacuationBuildingState,
  clearEvacuationPlanningState,
  render,
  showToast,
})
const {
  deleteAllSensorsFromDB,
  deleteGasFromDB,
  deleteSensorFromDB,
  fetchGasList,
  fetchSensorsFromDB,
  saveGasToDB,
  saveSensorToDB,
  updateGasToDB,
  updateSensorToDB,
} = useSmartMapCatalogPersistence({
  sensors,
  gases,
  diffusionFrames,
  buildActiveSensorSeries,
  generateBaseStandardLayout: buildSmartMapBaseStandardLayout,
  realSensorLayoutCount: REAL_SENSOR_LAYOUT_COUNT,
  computeRiskGrid,
  calcCoverage,
  render,
  getErrorMessage,
})
const {
  editGas,
  gasEditDraft,
  gasPanelVisible,
  removeGas,
  resetGasDraft,
  saveGasDraft,
} = useSmartMapGasEditor({
  gases,
  saveGasToDB,
  updateGasToDB,
  deleteGasFromDB,
  showToast,
})

const {
  sensorEditorState,
  manualSensorPanelVisible,
  manualSensorTargetId,
  manualSensorTarget,
  sensorEditVisible,
  sensorEditDraft,
  syncSensorEditorState,
  selectManualSensorTarget,
  toggleManualSensorPanel,
  setManualPanelSensorMode,
  setSelectedSensorMode,
  openSensorEdit,
  closeSensorEdit,
  updateSensorEditDraft,
  saveSensorEdit,
  applySelectedSensorManualValueToCurrentFrame,
  fillSelectedSensorManualSeries,
  copyAutoSeriesToSelectedSensorManual,
  clearSelectedSensorManualSeries,
} = useSmartMapSensorEditor<SmartSensor, SmartMapDiffusionFrame>({
  sensors,
  selectedSensor,
  diffusionFrames,
  getCurrentFrame: getCurrentDiffusionFrame,
  buildActiveSensorSeries,
  buildFrameSeriesTemplate,
  normalizeManualSeries,
  normalizeSeriesConcentration,
  showSensorInfo,
  showToast,
  updateSensorToDB,
  render,
})
setSyncSensorEditorStateAction(syncSensorEditorState)
const sensorInfoActions = useSmartMapSensorInfoActions<SmartSensor>({
  sensorTypes,
  defaultRange: MANUAL_SENSOR_DEFAULTS.effectiveRange,
  panelCollapsed,
  manualSensorTargetId,
  setInfoPanel,
  syncSensorEditorState,
  getCurrentConcentration: getSensorCurrentConcentration,
  getAutoConcentration: getSensorAutoConcentration,
  getPriorityLabel,
  resolveEffectiveRange: resolveSensorEffectiveRange,
  resolveInstallationHeight: resolveSensorInstallationHeight,
  resolveDetectionRange: resolveSensorDetectionRange,
  resolveInstallRemark: resolveSensorInstallRemark,
})
setShowSensorInfoAction(sensorInfoActions.showSensorInfo)
const {
  sensorPlacementState,
  getSensorPlacementOrigin,
  manualSensorConfigVisible,
  manualSensorDraft,
  manualSensorPlacementPointLabel,
  manualSensorPlacementLocationText,
  manualSensorDraftValidation,
  resetManualSensorDraft,
  toggleOriginPicking,
  captureOriginPoint,
  applyRelativeCoordinates,
  startManualSensorPicking,
  captureManualSensorPoint,
  cancelSensorPicking,
  cancelSensorOriginPicking,
  isSensorPicking,
  isSensorOriginPicking,
  cancelManualSensorPlacement,
  confirmManualSensorPlacement,
  addManualSensor,
  clearAllSensor,
  deleteCurrSensor,
} = useSmartMapSensorPlacement<SmartSensor, MapFacility>({
  sensors,
  selectedSensor,
  facilities,
  measureMode,
  normalizeMapPoint: normalizeSmartMapPoint,
  formatGeoCoord,
  setCanvasCursor,
  cancelLeakSourcePicking,
  findNearestFacility,
  computeSensorRisk,
  generateSensorCode: generateSmartMapSensorCode,
  buildFrameSeriesTemplate,
  resampleSensorsFromDiffusion,
  saveSensorToDB,
  measureCursor,
  deleteAllSensorsFromDB,
  deleteSensorFromDB,
  syncSensorEditorState,
  showSensorInfo,
  calcCoverage,
  updateRiskStat,
  clearInfo: createSmartMapInfoClearAction({ clearFacilityInfo, selectedZone, selectedCar }),
  showToast,
  render,
})
setCancelSensorPickingAction(cancelSensorPicking); setCancelSensorOriginPickingAction(cancelSensorOriginPicking)
const { commandWorkflowSteps, sourceWorkflowSteps } = useSmartMapWorkflowSteps({
  currentLeakSourcePoint,
  diffusionFrames,
  diffusionRunState,
  activeEvacuationRoute,
  observationSummary,
  coarseCandidateRegions,
  sourceInversionRunState,
  isDeepParticleResult,
})
function clearSourceInversionArtifactsForDiffusion() {
  coarseSearchResult.value = null
  coarseSearchSummary.value = null
  selectedCoarseCandidateId.value = ''
  observationPayload.value = null
  observationSummary.value = null
  refinementInput.value = null
  refinementResult.value = null
  refinementSummary.value = null
  sourceInversionExecutorState.mode = 'local'
  sourceInversionExecutorState.fallbackReason = ''
  resetRefinementPlayback()
  hideSourceInversionProgress()
}

const {
  resetDiffusionSimulation,
  runDiffusionSimulation,
} = useSmartMapDiffusionSimulation({
  diffusionForm,
  diffusionFrames,
  diffusionMeta,
  facilities,
  roads,
  sensors,
  map: {
    width: REAL_MAP.width || PHASE1_MAP_WIDTH,
    height: REAL_MAP.height || PHASE1_MAP_HEIGHT,
    gridSize: PHASE1_GRID_SIZE,
    mapMetersPerUnit: PHASE1_MAP_METERS_PER_UNIT,
  },
  diffusionRunState,
  getCurrentLeakSourcePoint,
  getSelectedDiffusionSource,
  getGasById,
  normalizeMapPoint: normalizeSmartMapPoint,
  setDiffusionRunning,
  startDiffusionPlaybackFromFirstFrame,
  resetDiffusionPlayback,
  resampleSensorsFromDiffusion,
  rerunEvacuationAfterDiffusion,
  clearEvacuationPlanning: clearEvacuationPlanningSilently,
  clearSourceInversionWorkflow: clearSourceInversionArtifactsForDiffusion,
  render,
  showToast,
})
const {
  batchImportText,
  batchImportPreview,
  batchDefaultHeight,
  batchDefaultRange,
  parseBatchImport,
  pasteFromClipboard,
  executeBatchImport,
} = useSmartMapSensorBatchImport({
  sensors,
  getOrigin: getSensorPlacementOrigin,
  findNearestFacility,
  computeSensorRisk,
  saveSensorToDB,
  fetchSensorsFromDB,
  showToast,
})

const {
  closeInfo,
  clearInfo,
  goBackHome,
  runConditionedDiffusionDemo,
  showFacilityInfo,
  zoomToSensor,
} = useSmartMapPageActions<SmartSensor, SmartCar>({
  router,
  viewState,
  getCanvas,
  selectedFacility,
  selectedSensor,
  selectedCar,
  selectedZone,
  diffusionForm,
  diffusionSourceOptions,
  leakSourceState,
  facilities,
  facilityById,
  clearFacilityInfo,
  showFacilityInfoPanel,
  getFacilityAnchorPoint,
  syncManualGeoInputsFromWorld,
  updateDiffusionMetaSource,
  runDiffusionSimulation,
  render,
})
const smartMapLifecycle = useSmartMapLifecycleCoordinator({
  selectedSensor,
  sensors,
  selectedFacility,
  diffusionState,
  diffusionForm,
  diffusionFrames,
  evacuationPlan,
  evacuationBatchResult,
  observationPayload,
  observationSummary,
  coarseSearchResult,
  coarseSearchSummary,
  selectedCoarseCandidateId,
  carRefreshTimer,
  getInitialSourceFacility: getSelectedDiffusionSource,
  getInitialSourcePoint: getCurrentLeakSourcePoint,
  syncManualGeoInputsFromWorld,
  updateDiffusionMetaSource,
  updateCoordDisplay,
  updateDiffusionPlayback,
  updateRefinementPlayback,
  updateCarPatrol,
  computeRiskGrid,
  updateRiskStat,
  calcCoverage,
  fetchSensorsFromDB,
  refreshSensorReadingsForObservation,
  fetchGasList,
  refreshCarData,
  initializeWeatherData,
  loadBtexValidationReport,
  loadPrairieGrassValidationReport,
  clearToastTimer,
  showSensorInfo,
  syncCarMobileSensors,
  syncSelectedFacilityToEvacuationPlan,
  clearSourceInversionRefinement,
  clearEvacuationPlanning,
})
useSmartMapCanvasRuntime({
  canvasRef: mapCanvasRef,
  containerRef: mapContainerRef,
  viewMode,
  render,
  fitInitialMapView,
  updateClock,
  showToast,
  onCanvasBound: bindRuntimeCanvas,
  onCanvasReady: smartMapLifecycle.handleCanvasReady,
  onAnimationFrame: smartMapLifecycle.handleAnimationFrame,
  onAfterRuntimeStart: smartMapLifecycle.startBusinessRuntime,
  onBeforeRuntimeStop: smartMapLifecycle.stopBusinessRuntime,
})

const smartMapHitTesting = useSmartMapHitTestingActions({
  facilities,
  parkEntrances: parkEntrances as EntranceLike[],
  buildingEntrances: buildingEntrances as EntranceLike[],
  facilityById,
  activeFilter,
  showEntrances,
  candidateRegions: coarseCandidateRegions,
  sensors,
  getFacilityBounds: getSmartMapFacilityBounds,
  hasRadiusFacility: smartMapHasRadiusFacility,
})
const smartMapRenderer = useSmartMapRenderer<EntranceLike, SmartSensor, SmartCar>({
  dataBoundary,
  realMap: REAL_MAP,
  realMapImage,
  viewState,
  facilities,
  keyAreas,
  sensorRenderRules,
  viewportRenderControls,
  hitTestingLayer: smartMapHitTesting,
  getCurrentDiffusionFrame,
  getCurrentDiffusionGas,
  sourceWorkflowLayerState,
  refinementLayerState,
  evacuationLayerState,
  coreLayerState,
  viewVisibility,
  diffusionSourceLayer,
  facilityLayerState,
  carLayerState,
  carInteractionLayerState,
  measureLayer,
})

smartMapRenderBridge.setRenderer(smartMapRenderer)
const smartMapSelectionActions = useSmartMapCanvasSelectionActions<MapFacility, SmartSensor, SmartCar, CandidateRegion>({
  facilityById,
  hoveredSensor,
  selectedSensor,
  selectedFacility,
  selectedCar,
  selectedZone,
  showSensorInfo,
  showFacilityInfo,
  clearInfo,
  selectCar,
  selectCoarseCandidate,
})
const {
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasMouseLeave,
  onCanvasWheel,
} = useSmartMapCanvasInteraction<MapFacility, EntranceLike, SmartSensor, CandidateRegion, SmartCar>({
  getCanvas,
  viewState,
  isDragging,
  measureMode,
  screenToWorld,
  updateCoordDisplay,
  addMeasurePoint,
  measureCursor,
  render,
  applyWheelZoom,
  leakSourcePicking: isLeakSourcePicking,
  sensorPicking: isSensorPicking,
  sensorOriginPicking: isSensorOriginPicking,
  applyLeakSourcePoint: applyMapLeakSourcePoint,
  captureManualSensorPoint,
  captureOriginPoint,
  entranceHitTest: smartMapHitTesting.entranceHitTest,
  sensorHitTest: smartMapHitTesting.sensorHitTest,
  candidateRegionHitTest: smartMapHitTesting.candidateRegionHitTest,
  carHitTest,
  facilityHitTest: smartMapHitTesting.hitTest,
  hoveredEntrance,
  hoveredSensor,
  hoveredCar,
  hoveredFacility,
  selectedSensor,
  selectedCar,
  selectedFacility,
  selectSensor: smartMapSelectionActions.selectSensor,
  selectCandidate: smartMapSelectionActions.selectCandidate,
  selectCar: smartMapSelectionActions.selectCar,
  selectFacility: smartMapSelectionActions.selectFacility,
  clearSelection: smartMapSelectionActions.clearSelection,
})

</script>

<style src="./index.css"></style>
