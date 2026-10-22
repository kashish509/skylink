export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = clamp((value - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * t;
}
