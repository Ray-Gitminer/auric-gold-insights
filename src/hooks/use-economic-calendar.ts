import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchBlsReleases } from "@/lib/economic-calendar/bls-api";
import { fetchBeaReleases } from "@/lib/economic-calendar/bea-api";
import { fetchFredReleases } from "@/lib/economic-calendar/fred-api";
import { fetchCensusReleases } from "@/lib/economic-calendar/census-api";
import { fetchUsReleaseSchedule } from "@/lib/economic-calendar/us-release-calendar";
import { computeAuriqEstimate } from "@/lib/economic-calendar/auriq-model";
import { assessImpact } from "@/lib/economic-calendar/impact-engine";
import { searchConsensus } from "@/lib/economic-calendar/consensus-search";
import {
  formatValue,
  isReleaseDay,
  isWithinHours,
  parseValue,
} from "@/lib/economic-calendar/schedule";
import type {
  CalendarEvent,
  ConsensusResult,
  LayerStatus,
  OfficialRelease,
} from "@/lib/economic-calendar/types";

const FIVE_MIN = 5 * 60_000;
const SIXTY_MIN = 60 * 60_000;

async function loadReleases(): Promise<{ releases: OfficialRelease[]; statuses: LayerStatus[] }> {
  const [schedule, ...historical] = await Promise.all([
    fetchUsReleaseSchedule(),
    fetchBlsReleases(),
    fetchBeaReleases(),
    fetchFredReleases(),
    fetchCensusReleases(),
  ]);

  // Historical layer: published actuals per indicator, keyed by event name.
  const history = new Map<string, OfficialRelease>();
  for (const payload of historical) {
    for (const release of payload.releases) history.set(release.event, release);
  }

  const nowMs = Date.now();

  // Schedule layer drives the grid: every row carries a real, source-published
  // release date/time. Actuals are joined per OCCURRENCE — the observation whose
  // reference period belongs to that specific release — so two CPI rows in
  // different months never share the same number.
  const ordered = [...schedule.releases].sort((a, b) =>
    a.nextReleaseUtc.localeCompare(b.nextReleaseUtc),
  );
  const futureSeen = new Set<string>();

  const releases = ordered.map<OfficialRelease>((row) => {
    const live = history.get(row.event);
    if (!live) return row;

    const unit = live.unit;
    const points = live.history;
    const releaseMs = Date.parse(row.nextReleaseUtc);
    const maxLagMs = row.maxLagDays * 86_400_000;

    // Newest observation whose reference period is covered by THIS release.
    let idx = -1;
    for (let i = 0; i < points.length; i++) {
      const periodMs = Date.parse(points[i]!.periodIso);
      if (periodMs <= releaseMs && releaseMs - periodMs <= maxLagMs) idx = i;
    }

    const isPast = releaseMs <= nowMs;
    const actualPoint = isPast && idx >= 0 ? points[idx]! : null;

    let previousPoint = null as (typeof points)[number] | null;
    if (actualPoint) {
      previousPoint = points[idx - 1] ?? null;
    } else if (!isPast && !futureSeen.has(row.event)) {
      // For the next upcoming occurrence, "previous" is the last published value.
      previousPoint = points.at(-1) ?? null;
    }
    if (!isPast) futureSeen.add(row.event);

    return {
      ...row,
      unit,
      history: points,
      agency: live.agency,
      actualSource: `${row.provider} · ${live.actualSource}`,
      actualValue: actualPoint ? actualPoint.value : null,
      actualPeriodIso: actualPoint ? actualPoint.periodIso : null,
      actual: actualPoint ? formatValue(actualPoint.value, unit) : "—",
      previousValue: previousPoint ? previousPoint.value : null,
      previousPeriodIso: previousPoint ? previousPoint.periodIso : null,
      previous: previousPoint ? formatValue(previousPoint.value, unit) : "—",
    };
  });

  // Honest coverage report: which scheduled indicators still have no licensed
  // numeric feed (ISM and ADP are not redistributed). Never fabricate values.
  const uncovered = Array.from(
    new Set(schedule.releases.filter((r) => !history.has(r.event)).map((r) => r.event)),
  ).sort();

  const coverage: LayerStatus = {
    agency: "Other",
    ok: uncovered.length === 0,
    message: uncovered.length
      ? `Schedule only — no licensed data source for: ${uncovered.join(", ")}`
      : "All scheduled indicators have a licensed numeric source",
  };

  return {
    releases: releases.sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc)),
    statuses: [schedule.status, ...historical.map((r) => r.status), coverage],
  };
}

export function useEconomicCalendar() {
  const releasesQuery = useQuery({
    queryKey: ["economic-calendar", "releases"],
    queryFn: loadReleases,
    staleTime: FIVE_MIN,
    retry: 1,
    // 5 minutes on a release day, 60 minutes otherwise.
    refetchInterval: (query) =>
      (query.state.data?.releases ?? []).some((r) => isReleaseDay(r.nextReleaseUtc))
        ? FIVE_MIN
        : SIXTY_MIN,
  });

  const releases = useMemo(() => releasesQuery.data?.releases ?? [], [releasesQuery.data]);

  const anyReleaseDay = releases.some((r) => isReleaseDay(r.nextReleaseUtc));

  const imminent = useMemo(
    () =>
      releases
        .filter((r) => isWithinHours(r.nextReleaseUtc, 24))
        .map((r) => ({ releaseId: r.releaseId, event: r.event, nextReleaseUtc: r.nextReleaseUtc })),
    [releases],
  );

  const consensusQuery = useQuery({
    queryKey: ["economic-calendar", "consensus", imminent.map((i) => i.releaseId).join(",")],
    queryFn: () => searchConsensus({ data: { items: imminent } }),
    enabled: imminent.length > 0,
    staleTime: SIXTY_MIN,
    retry: 0,
  });

  const events = useMemo<CalendarEvent[]>(() => {
    const consensusMap: Record<string, ConsensusResult> = consensusQuery.data ?? {};
    return releases.map((release) => {
      const estimate = computeAuriqEstimate(release.history, release.unit);
      const consensus = consensusMap[release.releaseId] ?? null;
      const withinDay = isWithinHours(release.nextReleaseUtc, 24);

      let forecast: CalendarEvent["forecast"];
      if (consensus?.value) {
        forecast = {
          value: consensus.value,
          label: "Market Consensus",
          detail: consensus.source ?? "",
          numericValue: parseValue(consensus.value),
        };
      } else if (estimate) {
        forecast = {
          value: estimate.value,
          label: withinDay ? "Model Estimate" : "AURIQ Estimate",
          detail: estimate.modelVersion,
          numericValue: estimate.numericValue,
        };
      } else {
        forecast = { value: "—", label: "Model Estimate", detail: "", numericValue: null };
      }

      const assessment = assessImpact(release.event, release.actualValue, forecast.numericValue);

      return { release, estimate, consensus, forecast, assessment };
    });
  }, [releases, consensusQuery.data]);

  return {
    events,
    statuses: releasesQuery.data?.statuses ?? [],
    isLoading: releasesQuery.isLoading,
    isFetching: releasesQuery.isFetching || consensusQuery.isFetching,
    isError: releasesQuery.isError || events.length === 0,
    error: releasesQuery.error,
    refetch: () => {
      void releasesQuery.refetch();
      void consensusQuery.refetch();
    },
    pollIntervalMs: anyReleaseDay ? FIVE_MIN : SIXTY_MIN,
  };
}
