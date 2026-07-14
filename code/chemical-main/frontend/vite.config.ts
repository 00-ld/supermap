// https://vitejs.dev/config/
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import type { Connect } from 'vite'
//引入svg需要用到插件
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

const superMapCesiumRoot = path.resolve(
  process.cwd(),
  'node_modules/@supermap/iclient3d-webgl/Cesium',
)

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.js') return 'application/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.wasm') return 'application/wasm'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

function serveSuperMapAsset(req: Connect.IncomingMessage, res: Connect.ServerResponse, next: Connect.NextFunction) {
  const requestPath = decodeURIComponent((req.url || '').split('?')[0] || '')
  const relativePath = requestPath.replace(/^\/supermap3d\/?/, '').replace(/^\/+/, '')
  const absolutePath = path.resolve(superMapCesiumRoot, relativePath)
  if (!absolutePath.startsWith(superMapCesiumRoot) || !fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
    next()
    return
  }
  res.setHeader('Content-Type', getContentType(absolutePath))
  fs.createReadStream(absolutePath).pipe(res)
}

function emitSuperMapCesiumAssets() {
  return {
    name: 'supermap-cesium-assets',
    configureServer(server) {
      server.middlewares.use('/supermap3d', serveSuperMapAsset)
    },
  }
}

export default defineConfig(({ mode }) => {
  //获取各种环境下的对应的变量
  const env = loadEnv(mode, process.cwd(), '')
  const appBaseApi = env.VITE_APP_BASE_API || '/api'
  const appServer = env.VITE_SERVE || 'http://localhost:8081'
  const algorithmBaseApi = env.VITE_ALGORITHM_BASE_API || '/algorithm-api'
  const algorithmServer = env.VITE_ALGORITHM_SERVE || 'http://localhost:8000'
  const algorithmApiKey = env.ALGORITHM_API_KEY || process.env.ALGORITHM_API_KEY || ''
  const superMap3dProxyBase = env.VITE_SUPERMAP3D_REMOTE_PROXY_BASE || '/supermap3d-remote'
  const superMap3dProxyTarget = env.VITE_SUPERMAP3D_REMOTE_PROXY_TARGET || 'http://8.130.175.232:18190'
  const superMapIServerProxyBase = env.VITE_SUPERMAP_ISERVER_PROXY_BASE || '/supermap-iserver'
  const superMapIServerProxyTarget = env.VITE_SUPERMAP_ISERVER_PROXY_TARGET || 'http://8.130.175.232:18090'

  return {
    plugins: [
      vue(),
      emitSuperMapCesiumAssets(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve("./src") // 相对路径别名配置，使用 @ 代替 src
      }
    },
    //scss全局变量一个配置
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          javascriptEnabled: true,
          additionalData: '@use "@/styles/variable.scss" as *;\n',
        },
      },
    },
    build: {
      // Keep deploy builds stable on Windows; bundle-size work is tracked separately.
      minify: false,
    },
    //代理跨域
    server: {
      proxy: {
        [appBaseApi]: {
          //Java后端服务器地址
          target: appServer,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // 本地演示通过 Vite 同源代理访问后端；不要把浏览器 Origin 透传给 Spring CORS。
              proxyReq.removeHeader('origin')
            })
          },
        },
        [algorithmBaseApi]: {
          //Python算法服务器地址
          target: algorithmServer,
          changeOrigin: true,
          headers: algorithmApiKey ? { 'X-API-Key': algorithmApiKey } : undefined,
          rewrite: (path: string) => path.replace(algorithmBaseApi, ''),
        },
        [superMap3dProxyBase]: {
          //SuperMap3D SDK 与 Worker 必须同源加载，避免浏览器拦截跨源 Worker。
          target: superMap3dProxyTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(superMap3dProxyBase, ''),
        },
        [superMapIServerProxyBase]: {
          //iClient3D 会继续请求同服务根路径下的 login/license/config/s3mb，必须同源代理避免 CORS。
          target: superMapIServerProxyTarget,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(superMapIServerProxyBase, ''),
        },
        '/iserver': {
          //SuperMap scene.open 会从 realspace 元数据继续派生根路径 /iserver/... 请求。
          target: superMapIServerProxyTarget,
          changeOrigin: true,
        },
      }
    }
  }
})
