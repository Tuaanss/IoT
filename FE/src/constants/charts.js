/** Max points per dashboard chart series */
export const CHART_SAMPLE_COUNT = 30;

/** ESP8266 ADC (0–1023) → brightness % (0–100) */
export function adcToBrightnessPercent(adc) {
  const n = Number(adc);
  if (!Number.isFinite(n)) return 0;
  return Math.round((Math.max(0, Math.min(1023, n)) / 1023) * 100);
}
