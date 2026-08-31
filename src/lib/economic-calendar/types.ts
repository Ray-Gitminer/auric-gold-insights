import type { EconomicEvent } from "@/data/fixtures";

export type Agency = "BLS" | "BEA" | "Census" | "Fed";

/** One historical observation for an indicator. */
export interface HistoricalPoint {
  /** ISO-8601 date for the reference period (first day of the period). */
  periodIso: string;
  value: number;
}

/** Layer 1 — official release schedule + published actual. */
export interface OfficialRelease extends EconomicEvent {
  releaseId: string;
  agency: Agency;
  nextReleaseUtc: string; // ISO-8601
  actualSource: string; // e.g. "BLS API · fetched 2026-09-01T08:31:02Z"
  actualLabel: "Actual";
  /** Display unit suffix used when formatting model output ("%" | "K"). */
  unit: string;
  actualValue: number | null;
  previousValue: number | null;
  /** Last ~24 months of actuals, oldest → newest. */
  history: HistoricalPoint[];
}

/** Layer 2 — statistical model output. */
export interface AuriqEstimate {
  value: string; // e.g. "0.3%"
  numericValue: number;
  label: "AURIQ Estimate";
  modelVersion: string; // e.g. "v1.0-seasonal-naive+linreg"
  computedAt: string; // ISO-8601
  historicalPoints: number;
}

/** Layer 3 — consensus search result. */
export interface ConsensusResult {
  value: string | null;
  label: "Market Consensus" | "Model Estimate";
  source: string | null; // e.g. "Reuters · found 2026-09-01T07:00:00Z"
  retrievedAt: string; // ISO-8601
  searchAttempts: number;
}

/** Layer 4 — post-release impact assessment. */
export interface ImpactAssessment {
  surprisePct: number;
  surpriseDir: "beat" | "miss" | "inline";
  goldBias: "bullish" | "bearish" | "neutral";
  usdBias: "strong" | "weak" | "neutral";
  magnitude: "high" | "medium" | "low";
  assessedAt: string;
}

export type ForecastLabel = "Market Consensus" | "Model Estimate" | "AURIQ Estimate";

/** Merged row rendered by the UI. */
export interface CalendarEvent {
  release: OfficialRelease;
  estimate: AuriqEstimate | null;
  consensus: ConsensusResult | null;
  forecast: {
    value: string;
    label: ForecastLabel;
    /** Source string for Market Consensus, model version otherwise. */
    detail: string;
    numericValue: number | null;
  };
  assessment: ImpactAssessment | null;
}

export interface LayerStatus {
  agency: Agency;
  ok: boolean;
  message: string;
}

export interface OfficialReleasePayload {
  releases: OfficialRelease[];
  status: LayerStatus;
}

/** Static definition of a tracked indicator. */
export interface IndicatorSpec {
  releaseId: string;
  event: string;
  agency: Agency;
  impact: "High" | "Medium" | "Low";
  unit: string;
  /** How the raw series is turned into the published number. */
  transform: "level" | "pct-change" | "diff";
  /** Provider series identifier. */
  seriesId: string;
  /** Release-time rule used when the official schedule feed is unavailable. */
  schedule:
    | { kind: "day-of-month"; day: number; timeUtc: string }
    | { kind: "nth-weekday"; weekday: number; nth: number; timeUtc: string };
}
