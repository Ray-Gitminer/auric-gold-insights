import type { HistoricalPoint, IndicatorSpec, OfficialRelease } from "./types";

/** Format a model/actual number using the indicator unit. */
export function formatValue(value: number, unit: string): string {
  if (unit === "K") return `${Math.round(value).toLocaleString("en-US")}K`;
  if (unit === "%") return `${value.toFixed(1)}%`;
  return `${value.toFixed(1)}${unit}`;
}

export function parseValue(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[,%\sK]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function atUtc(year: number, monthIndex: number, day: number, timeUtc: string): Date {
  const [h = "12", m = "30"] = timeUtc.split(":");
  return new Date(Date.UTC(year, monthIndex, day, Number(h), Number(m), 0));
}

function nthWeekdayDate(year: number, monthIndex: number, weekday: number, nth: number): number {
  const first = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const offset = (weekday - first + 7) % 7;
  return 1 + offset + (nth - 1) * 7;
}

/** Next scheduled release for an indicator, derived from its recurrence rule. */
export function nextReleaseUtc(spec: IndicatorSpec, now = new Date()): string {
  if (spec.schedule.kind === "weekly") {
    const daysAhead = (spec.schedule.weekday - now.getUTCDay() + 7) % 7;
    const candidate = atUtc(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysAhead,
      spec.schedule.timeUtc,
    );
    if (candidate.getTime() <= now.getTime()) candidate.setUTCDate(candidate.getUTCDate() + 7);
    return candidate.toISOString();
  }
  for (let i = 0; i < 3; i++) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + i;
    const date =
      spec.schedule.kind === "day-of-month"
        ? atUtc(y, m, spec.schedule.day, spec.schedule.timeUtc)
        : atUtc(
            y,
            m,
            nthWeekdayDate(y, m, spec.schedule.weekday, spec.schedule.nth),
            spec.schedule.timeUtc,
          );
    if (date.getUTCDay() === 6) date.setUTCDate(date.getUTCDate() - 1);
    if (date.getUTCDay() === 0) date.setUTCDate(date.getUTCDate() + 1);
    if (date.getTime() > now.getTime()) return date.toISOString();
  }
  return new Date(now.getTime() + 30 * 86_400_000).toISOString();
}

/** Local (Asia/Bangkok-independent) HH:mm rendering of a UTC ISO timestamp. */
export function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function isWithinHours(iso: string, hours: number, now = new Date()): boolean {
  const diff = new Date(iso).getTime() - now.getTime();
  return diff >= 0 && diff <= hours * 3_600_000;
}

export function isReleaseDay(iso: string, now = new Date()): boolean {
  return new Date(iso).toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
}

/**
 * Build the Layer 1 record. `history` is oldest → newest; the newest point is
 * treated as the most recently published actual for the previous period.
 */
export function buildRelease(
  spec: IndicatorSpec,
  history: HistoricalPoint[],
  fetchedAt: string,
  now = new Date(),
): OfficialRelease {
  const next = nextReleaseUtc(spec, now);
  const latest = history.at(-1) ?? null;
  const prior = history.at(-2) ?? null;
  const releasedToday = latest
    ? latest.periodIso.slice(0, 7) === now.toISOString().slice(0, 7)
    : false;

  return {
    releaseId: spec.releaseId,
    agency: spec.agency,
    event: spec.event,
    impact: spec.impact,
    unit: spec.unit,
    nextReleaseUtc: next,
    actualLabel: "Actual",
    actualSource: `${spec.agency} API · fetched ${fetchedAt}`,
    time: timeLabel(next),
    actualValue: releasedToday && latest ? latest.value : null,
    previousValue: latest ? latest.value : null,
    actual: releasedToday && latest ? formatValue(latest.value, spec.unit) : "—",
    forecast: "—",
    previous: latest
      ? formatValue(latest.value, spec.unit)
      : prior
        ? formatValue(prior.value, spec.unit)
        : "—",
    history: history.slice(-24),
  };
}

/** Transform a raw index/level series into the published indicator series. */
export function applyTransform(
  points: HistoricalPoint[],
  transform: IndicatorSpec["transform"],
): HistoricalPoint[] {
  if (transform === "level") return points;
  const out: HistoricalPoint[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    const value =
      transform === "pct-change"
        ? prev.value === 0
          ? 0
          : ((cur.value - prev.value) / prev.value) * 100
        : cur.value - prev.value;
    out.push({ periodIso: cur.periodIso, value: Number(value.toFixed(2)) });
  }
  return out;
}
