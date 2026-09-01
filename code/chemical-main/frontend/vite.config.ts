// https://vitejs.dev/config/
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import type { Connect } from 'vite'
import {
  getIServerProxyForwardingOptions,
  rewriteIServerProxyPath,
} from './src/config/iServerProxy'
//引入svg需要用到插件
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'

const bundledSuperMap2026Root = path.resolve(
  process.env.VITE_SUPERMAP3D_2026_ROOT ||
    'D:/BaiduNetdiskDownload/supermap-iclient3d-for-webgl_webgpu-2026/supermap-iclient3d-for-webgl_webgpu-2026/Build/SuperMap3D',
)
const superMapCesiumRoot = fs.existsSync(bundledSuperMap2026Root)
  ? bundledSuperMap2026Root
  : path.resolve(process.cwd(), 'node_modules/@supermap/iclient3d-webgl/Cesium')

const localPublishedSceneRoot = path.resolve(
  process.env.VITE_LOCAL_PUBLISHED_SCENE_ROOT ||
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/主园区及配套_4490/单体模型瓦片/FinallyFBX_4490_S3M301_发布场景',
)

const localMiniSceneRoots: Record<string, string> = {
  'processing-plant': path.resolve(
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/六个独立场景/加工厂房/result_ImportFBX',
  ),
  'production-plant': path.resolve(
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/六个独立场景/生产装置厂房/result_ImportFBX',
  ),
  'raw-material-warehouse': path.resolve(
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/六个独立场景/原材料仓库',
  ),
  'heat-exchanger': path.resolve(
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/六个独立场景/换热器',
  ),
  'vertical-tank': path.resolve(
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/六个独立场景/立式罐子',
  ),
  'distillation-tower': path.resolve(
    'G:/竞赛/超图杯/1 所有用到的数据/iServer发布数据/三维场景/六个独立场景/蒸馏塔',
  ),
}

function getContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.js') return 'application/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json' || ext === '.scp')
    return 'application/json; charset=utf-8'
  if (ext === '.wasm') return 'application/wasm'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.gif') return 'image/gif'
  if (ext === '.svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

function serveSuperMapAsset(
  req: Connect.IncomingMessage,
  res: Connect.ServerResponse,
  next: Connect.NextFunction,
) {
  const requestPath = decodeURIComponent((req.url || '').split('?')[0] || '')
  const relativePath = requestPath
    .replace(/^\/supermap3d\/?/, '')
    .replace(/^\/+/, '')
  const absolutePath = path.resolve(superMapCesiumRoot, relativePath)
  if (
    !absolutePath.startsWith(superMapCesiumRoot) ||
    !fs.existsSync(absolutePath) ||
    fs.statSync(absolutePath).isDirectory()
  ) {
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

function emitLocalPublishedSceneAssets() {
  return {
    name: 'local-published-scene-assets',
    configureServer(server) {
      server.middlewares.use(
        '/local-published-scene-4490',
        (req, res, next) => {
          const requestPath = decodeURIComponent(
            (req.url || '').split('?')[0] || '',
          )
          const relativePath = requestPath.replace(/^\/+/, '')
          const absolutePath = path.resolve(
            localPublishedSceneRoot,
            relativePath,
          )
          if (
            !absolutePath.startsWith(`${localPublishedSceneRoot}${path.sep}`) ||
            !fs.existsSync(absolutePath) ||
            fs.statSync(absolutePath).isDirectory()
          ) {
            next()
            return
          }
          const fileSize = fs.statSync(absolutePath).size
          const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
          res.setHeader('Accept-Ranges', 'bytes')
          res.setHeader('Content-Type', getContentType(absolutePath))
          res.setHeader('Cache-Control', 'no-store')
          if (range) {
            const start = Number(range[1])
            const requestedEnd = range[2] ? Number(range[2]) : fileSize - 1
            const end = Math.min(requestedEnd, fileSize - 1)
            if (start >= fileSize || end < start) {
              res.statusCode = 416
              res.setHeader('Content-Range', `bytes */${fileSize}`)
              res.end()
              return
            }
            res.statusCode = 206
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
            res.setHeader('Content-Length', String(end - start + 1))
            fs.createReadStream(absolutePath, { start, end }).pipe(res)
            return
          }
          res.setHeader('Content-Length', String(fileSize))
          fs.createReadStream(absolutePath).pipe(res)
        },
      )
    },
  }
}

function emitLocalMiniSceneAssets() {
  return {
    name: 'local-mini-scene-assets',
    configureServer(server) {
      server.middlewares.use('/local-mini-scene', (req, res, next) => {
        const requestPath = decodeURIComponent(
          (req.url || '').split('?')[0] || '',
        )
        const segments = requestPath.replace(/^\/+/, '').split('/')
        const sceneId = segments.shift() || ''
        const root = localMiniSceneRoots[sceneId]
        if (!root || segments.length === 0) {
          next()
          return
        }
        const absolutePath = path.resolve(root, ...segments)
        if (
          !absolutePath.startsWith(`${root}${path.sep}`) ||
          !fs.existsSync(absolutePath) ||
          fs.statSync(absolutePath).isDirectory()
        ) {
          next()
          return
        }
        const fileSize = fs.statSync(absolutePath).size
        const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
        res.setHeader('Accept-Ranges', 'bytes')
        res.setHeader('Content-Type', getContentType(absolutePath))
        res.setHeader('Cache-Control', 'no-store')
        if (range) {
          const start = Number(range[1])
          const requestedEnd = range[2] ? Number(range[2]) : fileSize - 1
          const end = Math.min(requestedEnd, fileSize - 1)
          if (start >= fileSize || end < start) {
            res.statusCode = 416
            res.setHeader('Content-Range', `bytes */${fileSize}`)
            res.end()
            return
          }
          res.statusCode = 206
          res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
          res.setHeader('Content-Length', String(end - start + 1))
          fs.createReadStream(absolutePath, { start, end }).pipe(res)
          return
        }
        res.setHeader('Content-Length', String(fileSize))
        fs.createReadStream(absolutePath).pipe(res)
      })
    },
  }
}

function emitLocalIPortalDashboard() {
  const cards = [
    ['processing-plant', '成品加工厂房'],
    ['production-plant', '生产装置厂房'],
    ['raw-material-warehouse', '原材料仓库'],
    ['heat-exchanger', '换热器'],
    ['vertical-tank', '立式罐子'],
    ['distillation-tower', '蒸馏塔'],
  ]
  return {
    name: 'local-iportal-dashboard',
    configureServer(server) {
      server.middlewares.use('/local-iportal-dashboard', (req, res, next) => {
        const requestPath = (req.url || '').split('?')[0] || '/'
        if (requestPath !== '/' && requestPath !== '/index.html') {
          next()
          return
        }
        const cardMarkup = cards
          .map(
            ([id, label]) =>
              `<a class=\"scene-card\" href=\"/#/screen\" target=\"_top\" data-scene-id=\"${id}\"><span class=\"scene-dot\"></span><strong>${label}</strong><small>本地 iServer / S3M</small></a>`,
          )
          .join('')
        const html = `<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>化工园区 iPortal 静态大屏</title><style>html,body{margin:0;min-height:100%;background:#07131d;color:#d8ecf5;font-family:Segoe UI,Microsoft YaHei,sans-serif}body{padding:28px;box-sizing:border-box}.head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #244155;padding-bottom:18px}.head h1{margin:0;font-size:26px;letter-spacing:1px}.head p{margin:8px 0 0;color:#7fa6bb;font-size:12px}.status{color:#67d6a0;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:22px}.scene-card{display:flex;flex-direction:column;gap:8px;min-height:120px;padding:18px;background:#0e2331;border:1px solid #254c60;border-radius:6px;color:inherit;text-decoration:none;box-sizing:border-box;transition:.18s}.scene-card:hover{border-color:#4bb6d1;background:#123044}.scene-dot{width:10px;height:10px;border-radius:50%;background:#59d9b0;box-shadow:0 0 12px #59d9b0}.scene-card strong{font-size:16px}.scene-card small{color:#82a8bb;font-size:11px}@media(max-width:720px){body{padding:16px}.grid{grid-template-columns:1fr}}</style></head><body><div class=\"head\"><div><h1>化工园区数字孪生大屏</h1><p>iPortal 静态展示 · SuperMap 2026 · EPSG:4490</p></div><span class=\"status\">本地只读回退</span></div><div class=\"grid\">${cardMarkup}</div></body></html>`
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(html)
      })
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
  const algorithmApiKey =
    env.ALGORITHM_API_KEY || process.env.ALGORITHM_API_KEY || ''
  const superMapIServerProxyBase =
    env.VITE_SUPERMAP_ISERVER_PROXY_BASE || '/supermap-iserver'
  const superMapIServerProxyTarget =
    env.VITE_SUPERMAP_ISERVER_PROXY_TARGET || 'http://127.0.0.1:8090'
  const qWeatherProxyBase = '/qweather-api'
  const qWeatherApiHost = env.VITE_QWEATHER_API_HOST || ''
  const qWeatherProxyTarget = qWeatherApiHost.startsWith('http')
    ? qWeatherApiHost
    : `https://${qWeatherApiHost}`
  const allowInsecureLocalProxy = env.VITE_ALLOW_INSECURE_LOCAL_PROXY === 'true'
  const proxyDebug = env.VITE_PROXY_DEBUG === 'true'
  const iServerProxyForwardingOptions = getIServerProxyForwardingOptions()

  return {
    plugins: [
      vue(),
      emitSuperMapCesiumAssets(),
      emitLocalPublishedSceneAssets(),
      emitLocalMiniSceneAssets(),
      emitLocalIPortalDashboard(),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/icons')],
        symbolId: 'icon-[dir]-[name]',
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('./src'), // 相对路径别名配置，使用 @ 代替 src
      },
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
        [qWeatherProxyBase]: {
          // 和风实况改由本地 Vite 同源代理转发，避免浏览器 CORS/系统代理造成请求失败。
          target: qWeatherProxyTarget,
          changeOrigin: true,
          secure: !allowInsecureLocalProxy,
          timeout: 12000,
          proxyTimeout: 12000,
          rewrite: (requestPath: string) =>
            requestPath.replace(qWeatherProxyBase, ''),
        },
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
          headers: algorithmApiKey
            ? { 'X-API-Key': algorithmApiKey }
            : undefined,
          rewrite: (path: string) => path.replace(algorithmBaseApi, ''),
        },
        [superMapIServerProxyBase]: {
          // iClient3D 11.1.4 会把旧式属性索引错误地拼成 configindexData.dat。
          // 本地发布目录保留兼容索引，并在开发代理中纠正为 iServer 的 data/path 路径。
          target: superMapIServerProxyTarget,
          ...iServerProxyForwardingOptions,
          rewrite: (requestPath: string) =>
            rewriteIServerProxyPath(requestPath, superMapIServerProxyBase),
        },
        '/services/security': {
          // iClient3D 2026 会按当前页面根路径访问加密隧道。开发站点与
          // iServer 分属 5173/8090 时必须补回 /iserver 上下文，否则
          // publickey.json 会被 Vite SPA 回退页冒充成功响应，S3M 随后停止加载。
          target: superMapIServerProxyTarget,
          ...iServerProxyForwardingOptions,
          timeout: 120000,
          proxyTimeout: 120000,
          rewrite: (requestPath: string) => `/iserver${requestPath}`,
        },
        '/iserver': {
          //SuperMap scene.open 会从 realspace 元数据继续派生根路径 /iserver/... 请求。
          target: superMapIServerProxyTarget,
          ...iServerProxyForwardingOptions,
          secure: !allowInsecureLocalProxy,
          timeout: 120000,
          proxyTimeout: 120000,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, request) => {
              // iClient3D 的 license/config/tile 请求必须由代理以服务端请求发出；
              // 否则远端 CORS 过滤会令 license.json 间歇 500，S3M 不会进入瓦片下载。
              proxyReq.removeHeader('origin')
              if (proxyDebug)
                console.log('[vite proxy request]', request.method)
            })
            proxy.on('proxyRes', (proxyResponse) => {
              if (proxyDebug)
                console.log('[vite proxy response]', proxyResponse.statusCode)
            })
            proxy.on('error', (error) => {
              console.error('[vite proxy error]', error.message)
            })
          },
        },
      },
    },
  }
})
