import type { ImpactAssessment } from "./types";

export const IMPACT_RULES: Record<string, { bullishIfBelow: boolean }> = {
  "CPI m/m": { bullishIfBelow: true },
  "Core CPI m/m": { bullishIfBelow: true },
  NFP: { bullishIfBelow: true },
  Unemployment: { bullishIfBelow: false },
  "PCE m/m": { bullishIfBelow: true },
  "PPI m/m": { bullishIfBelow: true },
  "GDP q/q": { bullishIfBelow: true },
  "Fed Funds Rate": { bullishIfBelow: true },
};

/**
 * Compare a published actual against the effective forecast (consensus when
 * available, otherwise the AURIQ Estimate) and derive the gold/USD bias.
 */
export function assessImpact(
  eventName: string,
  actual: number | null,
  forecast: number | null,
  now = new Date(),
): ImpactAssessment | null {
  if (actual == null || forecast == null) return null;

  const surprisePct =
    forecast === 0 ? (actual === 0 ? 0 : 100) : ((actual - forecast) / Math.abs(forecast)) * 100;
  const abs = Math.abs(surprisePct);

  const surpriseDir: ImpactAssessment["surpriseDir"] =
    abs < 5 ? "inline" : surprisePct > 0 ? "beat" : "miss";
  const magnitude: ImpactAssessment["magnitude"] = abs > 10 ? "high" : abs > 5 ? "medium" : "low";

  const rule = IMPACT_RULES[eventName];
  let goldBias: ImpactAssessment["goldBias"] = "neutral";
  if (rule && surpriseDir !== "inline") {
    const below = surprisePct < 0;
    goldBias = below === rule.bullishIfBelow ? "bullish" : "bearish";
  }
  const usdBias: ImpactAssessment["usdBias"] =
    goldBias === "bullish" ? "weak" : goldBias === "bearish" ? "strong" : "neutral";

  return {
    surprisePct: Number(surprisePct.toFixed(1)),
    surpriseDir,
    goldBias,
    usdBias,
    magnitude,
    assessedAt: now.toISOString(),
  };
}
