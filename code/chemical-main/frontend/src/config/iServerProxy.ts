export function rewriteIServerProxyPath(
  requestPath: string,
  proxyBase: string,
): string {
  return requestPath
    .replace(proxyBase, '')
    .replace(/\/configindexData\.dat(\?.*)?$/, '/data/path/indexData.dat$1')
}

export function resolveIServerSceneConfigUrl(configUrl: string): string {
  return configUrl.replace(/^\/supermap-iserver(?=\/iserver(?:\/|$))/, '')
}

export function getIServerProxyForwardingOptions() {
  return {
    // iServer builds the encrypted tunnel URL from the incoming Host header.
    // Keeping the Vite origin makes that URL return through /iserver instead
    // of escaping to localhost:8090 without the browser session cookie.
    changeOrigin: false as const,
    cookiePathRewrite: '/' as const,
  }
}
