export function resolveRequestErrorMessageType(options: {
  status?: number
  isPublicDemoRoute: boolean
}): 'warning' | 'error' {
  return options.status === 401 && options.isPublicDemoRoute
    ? 'warning'
    : 'error'
}
