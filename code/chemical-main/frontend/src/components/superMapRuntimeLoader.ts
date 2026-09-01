const DEFAULT_ISERVER_RUNTIME_URL =
  '/iserver/representations/realspace/iClient3DForWebGL/SuperMap3D.js'

function uniqueUrls(urls: string[]) {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)))
}

export function isUsableSuperMapRuntime(runtime: unknown) {
  if (
    !runtime ||
    (typeof runtime !== 'object' && typeof runtime !== 'function')
  ) {
    return false
  }
  return typeof (runtime as { Viewer?: unknown }).Viewer === 'function'
}

export function resolveSuperMapRuntimeScriptCandidates(
  configuredScriptUrl: string,
  sdkBaseUrl: string,
) {
  const normalizedBaseUrl = sdkBaseUrl.replace(/\/+$/, '')
  const primaryScriptUrl =
    configuredScriptUrl.trim() || `${normalizedBaseUrl}/SuperMap3D.js`
  return uniqueUrls([
    primaryScriptUrl,
    `${normalizedBaseUrl}/SuperMap3D.js`,
    DEFAULT_ISERVER_RUNTIME_URL,
  ])
}
