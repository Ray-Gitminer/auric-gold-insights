import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchNewsIntelligence } from "@/lib/news/news-feed";
import { computeGoldImpactScore } from "@/lib/news/impact-score";
import type { CalendarContextItem } from "@/lib/news/types";
import { useEconomicCalendar } from "@/hooks/use-economic-calendar";

const FIFTEEN_MIN = 15 * 60_000;
const DISPATCH_LEAD_MS = 24 * 60 * 60_000;

export interface ScheduledDispatch {
  releaseId: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  nextReleaseUtc: string;
  /** Moment the release is handed to the news analyser (T-24h). */
  dispatchAtUtc: string;
  status: "dispatched" | "scheduled";
  /** Milliseconds until dispatch; 0 once dispatched. */
  msUntilDispatch: number;
}

/**
 * Real RSS headlines analysed against the live economic calendar, plus the
 * derived Gold Impact Score. Calendar rows are dispatched to the news layer
 * automatically 24 hours before their release time — not on page open.
 */
export function useNewsIntelligence() {
  const calendar = useEconomicCalendar();

  // Ticks every minute so the T-24h boundary fires without a page reload.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const schedule = useMemo<ScheduledDispatch[]>(
    () =>
      calendar.events
        .map((e) => {
          const releaseMs = Date.parse(e.release.nextReleaseUtc);
          const dispatchMs = releaseMs - DISPATCH_LEAD_MS;
          return {
            releaseId: e.release.releaseId,
            event: e.release.event,
            impact: e.release.impact,
            nextReleaseUtc: e.release.nextReleaseUtc,
            dispatchAtUtc: new Date(dispatchMs).toISOString(),
            status: (now >= dispatchMs ? "dispatched" : "scheduled") as ScheduledDispatch["status"],
            msUntilDispatch: Math.max(0, dispatchMs - now),
          };
        })
        .sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc)),
    [calendar.events, now],
  );

  const dispatchedIds = useMemo(
    () => new Set(schedule.filter((s) => s.status === "dispatched").map((s) => s.releaseId)),
    [schedule],
  );

  const context = useMemo<CalendarContextItem[]>(
    () =>
      calendar.events
        .filter((e) => dispatchedIds.has(e.release.releaseId))
        .slice(0, 12)
        .map((e) => ({
          releaseId: e.release.releaseId,
          event: e.release.event,
          impact: e.release.impact,
          nextReleaseUtc: e.release.nextReleaseUtc,
          forecast: e.forecast.value,
          actual: e.release.actual ?? null,
          surprisePct: e.assessment?.surprisePct ?? null,
          surpriseDir: e.assessment?.surpriseDir ?? null,
          goldBias: e.assessment?.goldBias ?? null,
        })),
    [calendar.events, dispatchedIds],
  );

  const newsQuery = useQuery({
    queryKey: [
      "news-intelligence",
      context.map((c) => `${c.releaseId}:${c.actual ?? ""}`).join("|"),
    ],
    queryFn: () => fetchNewsIntelligence({ data: { calendar: context } }),
    enabled: !calendar.isLoading,
    staleTime: FIFTEEN_MIN,
    refetchInterval: FIFTEEN_MIN,
    retry: 1,
  });

  const items = useMemo(() => newsQuery.data?.items ?? [], [newsQuery.data]);

  const impact = useMemo(() => computeGoldImpactScore(items, context), [items, context]);

  return {
    items,
    impact,
    schedule,
    dispatchLeadHours: 24,
    calendarEvents: calendar.events,
    sources: newsQuery.data?.sources ?? [],
    analysisMode: newsQuery.data?.analysisMode ?? "Heuristic",
    fetchedAt: newsQuery.data?.fetchedAt ?? null,
    isLoading: calendar.isLoading || newsQuery.isLoading,
    isFetching: newsQuery.isFetching,
    isError: newsQuery.isError,
    error: newsQuery.error,
    refetch: () => {
      calendar.refetch();
      void newsQuery.refetch();
    },
  };
}
