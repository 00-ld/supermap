export interface PublishedModelAttributes {
  smId: number
  modelName: string
  componentId: string
  assetId: string
  deviceId: string
  deviceName: string
  deviceType: string
}

export interface PublishedModelFeatureResponse {
  fieldNames?: unknown[]
  fieldValues?: unknown[]
}

/** 把 iServer 单要素响应按字段名解析，ModelName 是设备显示名称的权威来源。 */
export function parsePublishedModelAttributes(
  payload: PublishedModelFeatureResponse,
): PublishedModelAttributes | null {
  const fieldNames = Array.isArray(payload.fieldNames) ? payload.fieldNames : []
  const fieldValues = Array.isArray(payload.fieldValues)
    ? payload.fieldValues
    : []
  const fields = new Map<string, unknown>()
  fieldNames.forEach((fieldName, index) => {
    fields.set(String(fieldName).toUpperCase(), fieldValues[index])
  })
  const smId = Number(fields.get('SMID'))
  if (!Number.isInteger(smId) || smId <= 0) return null
  return {
    smId,
    modelName: String(fields.get('MODELNAME') ?? '').trim(),
    componentId: String(fields.get('COMPONENTID') ?? '').trim(),
    assetId: String(fields.get('ASSETID') ?? '').trim(),
    deviceId: String(fields.get('DEVICEID') ?? '').trim(),
    deviceName: String(fields.get('DEVICENAME') ?? '').trim(),
    deviceType: String(fields.get('DEVICETYPE') ?? '').trim(),
  }
}
