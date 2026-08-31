import type { AuriqEstimate, HistoricalPoint } from "./types";
import { formatValue } from "./schedule";

export const MODEL_VERSION = "v1.0-seasonal-naive+linreg";

/** Ordinary least squares slope/intercept over the last n points. */
function linearTrend(points: HistoricalPoint[], n = 6): number | null {
  const tail = points.slice(-n);
  if (tail.length < 3) return null;
  const xs = tail.map((_, i) => i);
  const ys = tail.map((p) => p.value);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i]! - meanX) * (ys[i]! - meanY);
    den += (xs[i]! - meanX) ** 2;
  }
  if (den === 0) return meanY;
  const slope = num / den;
  const intercept = meanY - slope * meanX;
  return slope * xs.length + intercept;
}

/** Same-period value 12 periods ago; falls back to the latest value. */
function seasonalNaive(points: HistoricalPoint[]): number | null {
  if (points.length === 0) return null;
  return (points.at(-12) ?? points.at(-1))!.value;
}

/**
 * Ensemble forecast: 60% seasonal naive + 40% linear trend, rounded to 1 dp.
 * Returns null when there is not enough history to model.
 */
export function computeAuriqEstimate(
  history: HistoricalPoint[],
  unit: string,
  now = new Date(),
): AuriqEstimate | null {
  if (history.length < 3) return null;
  const seasonal = seasonalNaive(history);
  const trend = linearTrend(history);
  if (seasonal == null && trend == null) return null;

  const blended =
    seasonal != null && trend != null ? seasonal * 0.6 + trend * 0.4 : (seasonal ?? trend)!;
  const rounded = Number(blended.toFixed(1));

  return {
    value: formatValue(rounded, unit),
    numericValue: rounded,
    label: "AURIQ Estimate",
    modelVersion: MODEL_VERSION,
    computedAt: now.toISOString(),
    historicalPoints: history.length,
  };
}
