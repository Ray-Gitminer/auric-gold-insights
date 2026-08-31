import type { AnalysisRunRecord } from "./analysis-types";

/**
 * Browser-persisted analysis history + audit trail.
 *
 * Deliberately shaped like `public.news_analysis_runs` (see supabase/schema.sql)
 * so the store can be swapped for Lovable Cloud without touching callers.
 */
const KEY = "auriq.analysis.runs";
const MAX_RUNS = 50;

export function listAnalysisRuns(): AnalysisRunRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnalysisRunRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAnalysisRun(run: AnalysisRunRecord): AnalysisRunRecord[] {
  const next = [run, ...listAnalysisRuns().filter((r) => r.id !== run.id)].slice(0, MAX_RUNS);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — history stays in memory for this session */
  }
  return next;
}

export function newRunId(): string {
  return `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
