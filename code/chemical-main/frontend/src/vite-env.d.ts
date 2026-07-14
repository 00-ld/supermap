/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

// 环境变量类型声明。
interface ImportMetaEnv {
  readonly VITE_APP_BASE_API: string
  readonly VITE_ALGORITHM_BASE_API: string
  readonly VITE_ALGORITHM_API_KEY: string
  readonly VITE_IPORTAL_DASHBOARD_URL: string
  readonly VITE_SUPERMAP3D_BASE_URL: string
  readonly VITE_SUPERMAP3D_REMOTE_PROXY_BASE: string
  readonly VITE_SUPERMAP3D_REMOTE_PROXY_TARGET: string
  readonly VITE_SUPERMAP_ISERVER_PROXY_BASE: string
  readonly VITE_SUPERMAP_ISERVER_PROXY_TARGET: string
  readonly VITE_SUPERMAP3D_SCRIPT_URL: string
  readonly VITE_SUPERMAP3D_STYLE_URL: string
  readonly VITE_SUPERMAP_3D_SCENE_URL: string
  readonly VITE_SUPERMAP_3D_SCENE_NAME: string
  readonly VITE_SUPERMAP_3D_LAYER_CONFIGS: string
  readonly VITE_SUPERMAP_3D_LAYER_POSITION: string
  readonly VITE_SUPERMAP_3D_APPLY_LAYER_POSITION: string
  readonly VITE_SUPERMAP_3D_DEFAULT_CAMERA: string
  readonly VITE_SUPERMAP_COORD_SYS: string
  readonly VITE_SUPERMAP_EPSG: string
  readonly VITE_SUPERMAP_MAP_METERS_PER_UNIT: string
  readonly VITE_SUPERMAP_ANCHOR_LOCAL: string
  readonly VITE_SUPERMAP_ANCHOR_CGCS2000: string
  readonly VITE_SUPERMAP_ANCHOR_WGS84: string
  readonly VITE_SUPERMAP_DATA_SERVICE_URL: string
  readonly VITE_SUPERMAP_DATA_DATASOURCE: string
  readonly VITE_SUPERMAP_2D_MAP_URL: string
  readonly VITE_SUPERMAP_2D_MAP_NAME: string
  readonly VITE_SUPERMAP_2D_EPSG: string
  readonly VITE_SUPERMAP_2D_LEFT: string
  readonly VITE_SUPERMAP_2D_BOTTOM: string
  readonly VITE_SUPERMAP_2D_RIGHT: string
  readonly VITE_SUPERMAP_2D_TOP: string
  readonly VITE_SUPERMAP_NETWORK_ANALYSIS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
