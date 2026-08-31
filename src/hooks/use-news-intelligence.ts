import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchNewsIntelligence } from "@/lib/news/news-feed";
import { computeGoldImpactScore } from "@/lib/news/impact-score";
import type { CalendarContextItem } from "@/lib/news/types";
import { useEconomicCalendar } from "@/hooks/use-economic-calendar";

const FIFTEEN_MIN = 15 * 60_000;

/**
 * Real RSS headlines analysed against the live economic calendar, plus the
 * derived Gold Impact Score. The calendar is the upstream input — no fixtures.
 */
export function useNewsIntelligence() {
  const calendar = useEconomicCalendar();

  const context = useMemo<CalendarContextItem[]>(
    () =>
      calendar.events.slice(0, 12).map((e) => ({
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
    [calendar.events],
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
