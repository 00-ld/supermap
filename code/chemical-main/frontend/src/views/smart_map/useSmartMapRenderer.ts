import type { MapFacility } from '@/data/realMapAssets'
import type { ParkSensorType } from '@/data/sensorCatalog'
import {
  drawSmartMapGround,
  drawSmartMapHeatmap,
  drawSmartMapKeyAreas,
  drawSmartMapLabels,
  type SmartMapBaseCanvasSize,
  type SmartMapRect,
} from './useSmartMapBaseCanvas'
import {
  drawSmartMapCarLayer,
  drawSmartMapDiffusionLayerState,
  drawSmartMapDiffusionSourceLayer,
  drawSmartMapEntranceLayer,
  drawSmartMapRiskGridLayer,
  drawSmartMapSensorLayer,
} from './useSmartMapCanvasLayerRenderers'
import type {
  SmartMapCarLayerState,
} from './useSmartMapCarPatrol'
import type { SmartMapCarInteractionLayerState } from './useSmartMapCarInteraction'
import {
  drawSmartMapFacilityHover,
  drawSmartMapFacilitySelection,
  type SmartMapFacilityBounds,
} from './useSmartMapFacilityCanvas'
import type { SmartMapEntranceCanvasItem } from './useSmartMapEntranceCanvas'
import type { SmartMapHitTestingLayer } from './useSmartMapHitTesting'
import { drawSmartMapEvacuationRoutes } from './useSmartMapEvacuationRouteCanvas'
import type { SmartMapEvacuationLayerState } from './useSmartMapEvacuationPlanning'
import type { SmartMapDiffusionFrame, SmartMapDiffusionGas } from './useSmartMapDiffusionLayer'
import type { SmartMapFacilityLayerState } from './useSmartMapInfoPanel'
import type { SmartMapRiskGridCell } from './useSmartMapSensorPlacementRules'
import type { SmartMapSensorCanvasRecord } from './useSmartMapSensorCanvas'
import type { SmartMapCoreLayerState } from './useSmartMapCoreState'
import type { SmartMapMeasureLayer } from './useSmartMapMeasureTool'
import {
  drawSmartMapSourceCandidateRegions,
  drawSmartMapSourceRefinementOverlay,
  type SmartMapSourceRefinementIteration,
} from './useSmartMapSourceInversionOverlay'
import type { SmartMapSourceWorkflowLayerState } from './useSmartMapSourceWorkflowState'
import type { SmartMapRefinementLayerState } from './useSmartMapRefinementPlayback'
import type { SmartMapViewportRenderControls, SmartMapViewportState } from './useSmartMapViewport'

interface SmartMapSourcePoint {
  x: number
  y: number
}

interface SmartMapDiffusionSourceLayer {
  getPoint: () => SmartMapSourcePoint | null | undefined
  getName: () => string | undefined
  shouldShowName: () => boolean
}

interface SmartMapViewVisibility {
  showEntrances: () => boolean
  showHeatmap: () => boolean
  showLabels: () => boolean
  showSensorRanges: () => boolean
  showSensors: () => boolean
}

interface SmartMapCarLike {
  id: number
}

interface SmartMapRendererOptions<
  TEntrance extends SmartMapEntranceCanvasItem,
  TSensor extends SmartMapSensorCanvasRecord,
  TCar extends SmartMapCarLike,
> {
  dataBoundary: SmartMapRect
  realMap: SmartMapBaseCanvasSize
  realMapImage: HTMLImageElement
  viewState: SmartMapViewportState
  facilities: MapFacility[]
  keyAreas: SmartMapRect[]
  sensorRenderRules: SmartMapSensorRenderRules<TSensor>
  viewportRenderControls: SmartMapViewportRenderControls
  hitTestingLayer: SmartMapHitTestingLayer<TEntrance, SmartMapFacilityBounds>
  getCurrentDiffusionFrame: () => SmartMapDiffusionFrame | null | undefined
  getCurrentDiffusionGas: () => SmartMapDiffusionGas | null | undefined
  sourceWorkflowLayerState: SmartMapSourceWorkflowLayerState
  refinementLayerState: SmartMapRefinementLayerState<SmartMapSourceRefinementIteration>
  evacuationLayerState: SmartMapEvacuationLayerState
  coreLayerState: SmartMapCoreLayerState<TSensor, SmartMapRiskGridCell>
  viewVisibility: SmartMapViewVisibility
  diffusionSourceLayer: SmartMapDiffusionSourceLayer
  facilityLayerState: SmartMapFacilityLayerState<MapFacility, TEntrance>
  carLayerState: SmartMapCarLayerState
  carInteractionLayerState: SmartMapCarInteractionLayerState<TCar>
  measureLayer: SmartMapMeasureLayer
}

interface SmartMapSensorRenderRules<TSensor extends SmartMapSensorCanvasRecord> {
  sensorTypes: ParkSensorType[]
  defaultRange: number
  resolveRange: (sensor: TSensor, fallbackRange: number) => number
  getPriorityColor: (priority: number) => string
}

export function useSmartMapRenderer<
  TEntrance extends SmartMapEntranceCanvasItem,
  TSensor extends SmartMapSensorCanvasRecord,
  TCar extends SmartMapCarLike,
>(options: SmartMapRendererOptions<TEntrance, TSensor, TCar>) {
  function withMapBoundaryClip(ctx: CanvasRenderingContext2D, drawer: () => void) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(
      options.dataBoundary.x,
      options.dataBoundary.y,
      options.dataBoundary.w,
      options.dataBoundary.h,
    )
    ctx.clip()
    drawer()
    ctx.restore()
  }

  function render(ctx: CanvasRenderingContext2D | null | undefined, canvas: HTMLCanvasElement | null | undefined) {
    if (!ctx || !canvas) return
    options.viewportRenderControls.clampMapViewToCanvas()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(7, 9, 33, 0.18)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const scale = options.viewState.scale
    ctx.save()
    ctx.translate(
      options.viewState.offsetX * scale + canvas.width * 0.05,
      options.viewState.offsetY * scale + canvas.height * 0.05,
    )
    ctx.scale(scale, scale)
    drawSmartMapGround(ctx, {
      boundary: options.dataBoundary,
      realMap: options.realMap,
      realMapImage: options.realMapImage,
      scale: options.viewState.scale,
    })
    withMapBoundaryClip(ctx, () => {
      drawSmartMapDiffusionLayerState(ctx, {
        frame: options.getCurrentDiffusionFrame(),
        gas: options.getCurrentDiffusionGas(),
      })
    })
    drawSmartMapSourceCandidateRegions(
      ctx,
      options.sourceWorkflowLayerState.getCoarseCandidateRegions(),
      options.sourceWorkflowLayerState.getSelectedCoarseCandidateId(),
    )
    drawSmartMapSourceRefinementOverlay(
      ctx,
      options.refinementLayerState.getCurrentIteration(),
      options.sourceWorkflowLayerState.getEstimatedSource(),
      options.refinementLayerState.isEmphasized(),
    )
    drawSmartMapKeyAreas(ctx, options.keyAreas)
    drawSmartMapEvacuationRoutes(ctx, {
      planningMode: options.evacuationLayerState.getPlanningMode(),
      displayMode: options.evacuationLayerState.getDisplayMode(),
      activeRoute: options.evacuationLayerState.getActiveRoute(),
      buildingRoutes: options.evacuationLayerState.getBuildingRoutes(),
      selectedBuildingRoute: options.evacuationLayerState.getSelectedBuildingRoute(),
    })
    drawSmartMapRiskGridLayer(ctx, {
      riskGrid: options.coreLayerState.getRiskGrid(),
      showHeatmap: options.viewVisibility.showHeatmap(),
    })
    drawSmartMapSensorLayer(ctx, {
      showSensors: options.viewVisibility.showSensors(),
      showSensorRanges: options.viewVisibility.showSensorRanges(),
      scale: options.viewState.scale,
      sensors: options.coreLayerState.getSensors(),
      sensorTypes: options.sensorRenderRules.sensorTypes,
      selectedSensorId: options.coreLayerState.getSelectedSensorId(),
      defaultRange: options.sensorRenderRules.defaultRange,
      resolveRange: options.sensorRenderRules.resolveRange,
      getPriorityColor: options.sensorRenderRules.getPriorityColor,
    })
    if (options.viewVisibility.showHeatmap()) {
      drawSmartMapHeatmap(ctx, {
        facilities: options.facilities,
        getFacilityBounds: options.hitTestingLayer.getFacilityBounds,
      })
    }
    if (options.viewVisibility.showLabels()) {
      drawSmartMapLabels(ctx, {
        facilities: options.facilities,
        matchFilter: options.hitTestingLayer.matchFilter,
        getFacilityBounds: options.hitTestingLayer.getFacilityBounds,
      })
    }
    drawSmartMapDiffusionSourceLayer(ctx, {
      point: options.diffusionSourceLayer.getPoint(),
      gas: options.getCurrentDiffusionGas(),
      sourceName: options.diffusionSourceLayer.getName(),
      showSourceName: options.diffusionSourceLayer.shouldShowName(),
    })
    const selectedFacility = options.facilityLayerState.getSelectedFacility()
    const hoveredFacility = options.facilityLayerState.getHoveredFacility()
    if (selectedFacility) drawSmartMapFacilitySelection(ctx, selectedFacility)
    if (hoveredFacility && hoveredFacility !== selectedFacility) {
      drawSmartMapFacilityHover(ctx, hoveredFacility)
    }
    drawSmartMapEntranceLayer(ctx, {
      showEntrances: options.viewVisibility.showEntrances(),
      entrances: options.hitTestingLayer.getVisibleEntrances(),
      hoveredEntrance: options.facilityLayerState.getHoveredEntrance(),
      mapSize: options.realMap,
    })
    drawSmartMapCarLayer(ctx, {
      showCars: options.carLayerState.showCars(),
      carMarkers: options.carLayerState.getCarMarkers(),
      selectedCar: options.carInteractionLayerState.getSelectedCar(),
      hoveredCar: options.carInteractionLayerState.getHoveredCar(),
      mobileSensorReadings: options.carLayerState.getMobileSensorReadings(),
    })
    if (options.measureLayer.hasMeasurePoints()) options.measureLayer.drawMeasure(ctx, options.viewState.scale)
    ctx.restore()
  }

  return {
    render,
  }
}
