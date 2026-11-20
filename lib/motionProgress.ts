// Keep visual and accessible progress bounded even while data is changing.
export function boundedProgress(value: number, max: number) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 0;
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(value, safeMax)) : 0;
  return { value: safeValue, max: safeMax, fraction: safeMax ? safeValue / safeMax : 0 };
}
