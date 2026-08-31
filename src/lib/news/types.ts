/** Real headline pulled from a named RSS source. */
export interface FeedArticle {
  id: string;
  headline: string;
  source: string;
  url: string;
  /** ISO-8601 publication timestamp from the feed. */
  publishedIso: string;
}

export type NewsCategory =
  | "Monetary policy"
  | "Inflation"
  | "Employment"
  | "Growth"
  | "Geopolitics"
  | "Gold market";

export type NewsImpactLevel = "High" | "Medium" | "Low";

export interface AnalyzedNewsItem extends FeedArticle {
  category: NewsCategory;
  impactLevel: NewsImpactLevel;
  dedup: "Unique" | "Duplicate cluster";
  relevance: number;
  direction: "Bullish" | "Bearish" | "Neutral";
  horizon: string;
  confidence: "High" | "Medium" | "Low";
  rationale: string;
  citations: string[];
  /** Release id of the economic-calendar event this headline is tied to, if any. */
  linkedReleaseId: string | null;
  analysisMode: "AI" | "Heuristic";
}

/** Compact calendar snapshot handed to the news layer. */
export interface CalendarContextItem {
  releaseId: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  nextReleaseUtc: string;
  forecast: string;
  actual: string | null;
  surprisePct: number | null;
  surpriseDir: "beat" | "miss" | "inline" | null;
  goldBias: "bullish" | "bearish" | "neutral" | null;
}

export interface NewsPayload {
  items: AnalyzedNewsItem[];
  fetchedAt: string;
  sources: { name: string; ok: boolean; count: number }[];
  analysisMode: "AI" | "Heuristic";
}

export interface ImpactDriver {
  label: string;
  weight: number;
  kind: "news" | "calendar";
}

export interface GoldImpactScore {
  score: number;
  band: string;
  drivers: ImpactDriver[];
  newsCount: number;
  eventCount: number;
  computedAt: string;
}
