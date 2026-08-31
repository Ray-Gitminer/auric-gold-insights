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
  // release date/time. Actuals are joined in only when the publication window
  // for that specific release has actually passed.
  const releases = schedule.releases.map<OfficialRelease>((row) => {
    const live = history.get(row.event);
    if (!live) return row;

    const unit = live.unit;
    const points = live.history;
    const latest = points.at(-1) ?? null;
    const prior = points.at(-2) ?? null;
    const releaseMs = Date.parse(row.nextReleaseUtc);
    const lagOk =
      latest != null &&
      releaseMs - Date.parse(latest.periodIso) <= row.maxLagDays * 86_400_000 &&
      Date.parse(latest.periodIso) <= releaseMs;
    const released = releaseMs <= nowMs && lagOk;

    const actualPoint = released ? latest : null;
    const previousPoint = released ? prior : latest;

    return {
      ...row,
      unit,
      history: points,
      agency: live.agency,
      actualSource: `${row.provider} · ${live.actualSource}`,
      actualValue: actualPoint ? actualPoint.value : null,
      actual: actualPoint ? formatValue(actualPoint.value, unit) : "—",
      previousValue: previousPoint ? previousPoint.value : null,
      previous: previousPoint ? formatValue(previousPoint.value, unit) : "—",
    };
  });

  return {
    releases: releases.sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc)),
    statuses: [schedule.status, ...historical.map((r) => r.status)],
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
