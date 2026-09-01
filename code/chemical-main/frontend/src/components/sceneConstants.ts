/**
 * SuperMapSceneViewer 场景常量配置。
 *
 * 从 SuperMapSceneViewer.vue 抽离的静态配置常量：
 * - 默认服务 URL / 场景地址 / 图层配置
 * - 默认相机参数（球面 + 局部 S3M）
 * - Three Tiles 地理参考兜底
 * - 扩散 / 相机 / 传感器运行参数
 *
 * 这些值在编译期固定，不依赖运行时状态或 Vue 响应式。
 */

import type { LocalCameraSnapshot, ThreeTilesGeoreference } from './sceneTypes'

/** iPortal 大屏默认地址。 */
export const DEFAULT_IPORTAL_URL =
  'http://127.0.0.1:8190/iportal/'
/** iServer 三维场景默认服务地址。 */
export const DEFAULT_SCENE_URL =
  '/iserver/services/3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace'
/** iServer 图层配置默认地址。 */
export const DEFAULT_LAYER_CONFIG =
  '/iserver/services/3D-local3DCache-HuaGongYuanQuChangJing/rest/realspace/datas/%E5%8C%96%E5%B7%A5%E5%9B%AD%E5%8C%BA%E5%9C%BA%E6%99%AF/config'
/** 默认 tileset URL（空表示未配置）。 */
export const DEFAULT_TILESET_URL = ''
/** 默认球面相机参数。 */
export const DEFAULT_CAMERA = {
  longitude: 113.569463,
  latitude: 34.76965,
  height: 760,
  heading: 0,
  pitch: -90,
  roll: 0,
}
/** Three Tiles 地理参考兜底（当远端清单加载失败时使用）。 */
export const THREE_TILES_FALLBACK_GEOREFERENCE: ThreeTilesGeoreference = {
  transform: [
    -0.1740248413607987, -0.07625847224635991, 0, 0, -0.0725794435405089,
    0.16562915275023768, 0.12529648093457577, 0, -0.036573849622644636,
    0.08346296734050102, -0.13151534741808135, 0, -2097359.589449915,
    4807542.341291077, 3616968.422988921, 1,
  ],
  sourceXOrigin: -1345.9164671191247,
  sourceYOrigin: 878.3000417170115,
  scaleX: 0.19,
  scaleY: 0.22,
  scaleZ: 0.16,
  anchor: {
    longitude: 113.569463,
    latitude: 34.76965,
    height: 8,
  },
  viewCenter: {
    longitude: 113.569463,
    latitude: 34.76965,
    altitude: 108,
  },
}
/** 局部 S3M 场景默认相机位置。 */
export const LOCAL_S3M_CAMERA = {
  x: -760,
  y: -820,
  z: 780,
}
/** 局部 S3M 场景边界。 */
export const LOCAL_S3M_BOUNDS = {
  left: -1605.9164671191247,
  right: 810.41634921256627,
  bottom: -1130.1391864245234,
  top: 878.30004171701148,
}
/** 局部 S3M 场景中心。 */
export const LOCAL_S3M_CENTER = {
  x: -397.75005895327922,
  y: -125.91957235375594,
  z: 0,
}
/** 局部 S3M 业务偏移。 */
export const LOCAL_S3M_BUSINESS_OFFSET = {
  x: 260,
  y: 0,
}
/** 局部 S3M 默认相机快照。 */
export const LOCAL_S3M_DEFAULT_CAMERA: LocalCameraSnapshot = {
  position: { ...LOCAL_S3M_CAMERA },
  direction: { x: 0.342, y: 0.656, z: -0.671 },
  up: { x: 0.31, y: 0.6, z: 0.738 },
}
/** 算法叠加在球面上的高度抬升（米），避免 Z-fighting。 */
export const GLOBE_ALGORITHM_ALTITUDE_LIFT = 0.7
/** 原生扩散渲染的体素上限。 */
export const NATIVE_DIFFUSION_CELL_LIMIT = 36
/** 体素扩散渲染的体素上限。 */
export const VOLUMETRIC_DIFFUSION_CELL_LIMIT = 110
/** Three Tiles 性能参数。 */
export const THREE_TILES_PERFORMANCE_OPTIONS = {
  maximumScreenSpaceError: 8,
  dynamicScreenSpaceErrorFactor: 4,
  maximumMemoryUsage: 768,
  cacheBytes: 805306368,
} as const
/** S3M config 与首瓦片预检超时（毫秒）。 */
export const S3M_PREFLIGHT_TIMEOUT_MS = 30000
// S3M 首次加载会继续拉取多个瓦片；图层就绪需要覆盖本地 iServer 冷缓存场景。
/** S3M 图层就绪超时（毫秒）。 */
export const S3M_LAYER_READY_TIMEOUT_MS = 90000
/** 局部相机守卫边距。 */
export const LOCAL_CAMERA_GUARD_MARGIN = 900
/** 局部相机最大高度。 */
export const LOCAL_CAMERA_MAX_HEIGHT = 3600
/** 局部相机最小高度。 */
export const LOCAL_CAMERA_MIN_HEIGHT = 45
/** 局部相机最大世界漂移。 */
export const LOCAL_CAMERA_MAX_WORLD_DRIFT = 4200
/** 局部相机安全检查间隔（毫秒）。 */
export const LOCAL_CAMERA_SAFETY_CHECK_MS = 520
/** 传感器视觉抬升（米），避免穿模。 */
export const SENSOR_VISUAL_LIFT = 0.18
/** 设备点聚合网格度数。 */
export const DEVICE_POINT_GRID_DEGREES = 0.00025
