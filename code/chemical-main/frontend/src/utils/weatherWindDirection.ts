/**
 * 将气象风向（风从该方向吹来）转换为扩散输运方向（气团吹向该方向）。
 * 和风 weather/now 的 wind360 以及常规气象站风向都使用“来向”定义。
 */
export function meteorologicalWindFromToTransportDegrees(
  windFromDegrees: number,
): number {
  const normalizedWindFrom = ((windFromDegrees % 360) + 360) % 360
  return (normalizedWindFrom + 180) % 360
}
