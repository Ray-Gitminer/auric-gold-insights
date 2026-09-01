import { canonicalEconomicEventId } from "./canonical-event";
import { formatValue } from "./schedule";
import type { OfficialRelease, OfficialReleasePayload } from "./types";
import type { ScheduledRelease } from "./us-release-calendar";

/** Join official observations to dated schedule rows without relying on display names. */
export function mergeScheduledReleases(
  scheduled: ScheduledRelease[],
  historical: OfficialReleasePayload[],
  now = new Date(),
): { releases: OfficialRelease[]; uncovered: string[] } {
  const history = new Map<string, OfficialRelease>();
  for (const payload of historical) {
    for (const release of payload.releases) {
      history.set(canonicalEconomicEventId(release.event), release);
    }
  }

  const ordered = [...scheduled].sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc));
  const futureSeen = new Set<string>();
  const nowMs = now.getTime();

  const releases = ordered.map<OfficialRelease>((row) => {
    const canonicalId = canonicalEconomicEventId(row.event);
    const live = history.get(canonicalId);
    if (!live) return row;

    const points = live.history;
    const releaseMs = Date.parse(row.nextReleaseUtc);
    const maxLagMs = row.maxLagDays * 86_400_000;
    let idx = -1;
    for (let i = 0; i < points.length; i++) {
      const periodMs = Date.parse(points[i]!.periodIso);
      if (periodMs <= releaseMs && releaseMs - periodMs <= maxLagMs) idx = i;
    }

    const isPast = releaseMs <= nowMs;
    const actualPoint = isPast && idx >= 0 ? points[idx]! : null;
    let previousPoint: (typeof points)[number] | null = null;
    if (actualPoint) {
      previousPoint = points[idx - 1] ?? null;
    } else if (!isPast && !futureSeen.has(canonicalId)) {
      previousPoint = points.at(-1) ?? null;
    }
    if (!isPast) futureSeen.add(canonicalId);

    return {
      ...row,
      unit: live.unit,
      history: points,
      agency: live.agency,
      actualSource: `${row.provider} · ${live.actualSource}`,
      actualValue: actualPoint?.value ?? null,
      actualPeriodIso: actualPoint?.periodIso ?? null,
      actual: actualPoint ? formatValue(actualPoint.value, live.unit) : "—",
      previousValue: previousPoint?.value ?? null,
      previousPeriodIso: previousPoint?.periodIso ?? null,
      previous: previousPoint ? formatValue(previousPoint.value, live.unit) : "—",
    };
  });

  const uncovered = Array.from(
    new Set(
      scheduled
        .filter((row) => !history.has(canonicalEconomicEventId(row.event)))
        .map((row) => row.event),
    ),
  ).sort();

  return { releases, uncovered };
}
