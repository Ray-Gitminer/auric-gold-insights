/**
 * Shapes shared by the "ส่งวิเคราะห์ข่าว" flow.
 *
 * `AnalysisRunRecord` mirrors the `public.news_analysis_runs` table declared in
 * supabase/schema.sql so the local (browser-persisted) audit history can be
 * migrated to Lovable Cloud without a shape change.
 */

export type Direction = "Bullish" | "Bearish" | "Neutral";
export type ConfidenceLevel = "High" | "Medium" | "Low";

/** Immutable snapshot of one calendar row at the moment analysis was requested. */
export interface EventSnapshot {
  releaseId: string;
  event: string;
  currency: string;
  impact: "High" | "Medium" | "Low";
  /** ISO-8601 UTC release instant taken from the official schedule feed. */
  nextReleaseUtc: string;
  /** Sourced market consensus, or null when no named publication was found. */
  marketForecast: string | null;
  marketForecastSource: string | null;
  /** AURIQ statistical model output — never substituted for the consensus. */
  auriqEstimate: string | null;
  previous: string | null;
  actual: string | null;
  /** Provider / agency string plus fetch timestamp. */
  source: string;
}

export interface ComparisonRow {
  releaseId: string;
  event: string;
  comparison: string;
}

export interface WeeklyAnalysisResult {
  summary: string;
  usdOutlook: { direction: Direction; note: string };
  goldOutlook: { direction: Direction; note: string };
  forecastVsPrevious: ComparisonRow[];
  estimateVsForecast: ComparisonRow[];
  scenarios: { above: string; inline: string; below: string };
  avoidWindows: { window: string; reason: string }[];
  confidence: { level: ConfidenceLevel; reason: string };
  visualSummary?: {
    title: string;
    rows: {
      releaseId: string;
      goldImpact: string;
      responsePlan: string;
    }[];
    marketContext: string;
  };
  sources: string[];
  disclaimer: string;
  modelName: string;
  generatedAt: string;
}

export type AnalysisRunStatus = "pending" | "completed" | "failed";

/** One row of `public.news_analysis_runs`. */
export interface AnalysisRunRecord {
  id: string;
  user_id: string | null;
  selected_event_ids: string[];
  event_snapshot: EventSnapshot[];
  analysis_result: WeeklyAnalysisResult | null;
  model_name: string;
  sources: string[];
  requested_at: string;
  completed_at: string | null;
  status: AnalysisRunStatus;
}
