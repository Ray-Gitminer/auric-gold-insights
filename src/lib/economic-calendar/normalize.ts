/**
 * Central normalization layer for the economic calendar.
 *
 * Every provider (BLS, BEA, Census, FRED/ALFRED, DOL) uses its own field names
 * for the same four numbers. This module turns any raw payload into ONE shape
 * so the UI never has to guess which column a value belongs to.
 *
 * Hard rules encoded here:
 *  - 0 is a real value. `null`, `undefined` and "" are not. Never use `if (v)`.
 *  - Actual / Market Forecast / Previous / AURIQ Estimate never substitute for
 *    each other; each carries its own provenance.
 *  - Units (%, K, M, B, index points) are preserved, never re-scaled.
 */

import type { CalendarEvent } from "./types";

/* ------------------------------------------------------------------ */
/* Field aliases                                                       */
/* ------------------------------------------------------------------ */

export const FIELD_ALIASES = {
  actual: ["actual", "actualValue", "value"],
  marketForecast: ["forecast", "estimate", "consensus", "marketForecast"],
  previous: ["previous", "prev", "previousValue", "prior"],
  unit: ["unit"],
  releaseAt: ["date", "datetime", "time", "timestamp"],
  impact: ["impact", "importance"],
} as const;

/** Strict numeric coercion: keeps 0, rejects null / undefined / "" / NaN. */
export function toNumber(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed === "") return null;
    // Strip thousands separators, unit suffixes and percent signs.
    const cleaned = trimmed
      .replace(/,/g, "")
      .replace(/[%\s]/g, "")
      .replace(/[KkMmBb]$/, "");
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Read the first alias present on a raw provider record. `0` wins over `null`. */
export function pickNumber(
  raw: Record<string, unknown> | null | undefined,
  aliases: readonly string[],
): number | null {
  if (!raw) return null;
  for (const key of aliases) {
    if (!(key in raw)) continue;
    const value = toNumber(raw[key]);
    if (value !== null) return value;
  }
  return null;
}

export function pickString(
  raw: Record<string, unknown> | null | undefined,
  aliases: readonly string[],
): string | null {
  if (!raw) return null;
  for (const key of aliases) {
    const value = raw?.[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Unit-preserving formatting                                          */
/* ------------------------------------------------------------------ */

/** Format a value in its published unit. K/M/B are suffixes, never conversions. */
export function formatUnitValue(value: number | null, unit: string): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  switch (unit) {
    case "%":
      return `${value.toFixed(1)}%`;
    case "K":
      return `${Math.round(value).toLocaleString("en-US")}K`;
    case "M":
      return `${value.toFixed(2)}M`;
    case "B":
      return `${value.toFixed(2)}B`;
    default:
      // Index points and unitless levels.
      return value.toFixed(1);
  }
}

/* ------------------------------------------------------------------ */
/* Normalized shape                                                    */
/* ------------------------------------------------------------------ */

export interface NormalizedFigure {
  value: number | null;
  displayValue: string | null;
  source: string | null;
  fetchedAt: string | null;
}

export interface NormalizedPrevious extends Omit<NormalizedFigure, "fetchedAt"> {
  referencePeriod: string | null;
}

export interface NormalizedEstimate {
  value: number | null;
  displayValue: string | null;
  modelVersion: string | null;
  computedAt: string | null;
}

export interface NormalizedEvent {
  id: string;
  eventName: string;
  country: string;
  currency: string;
  /** Always UTC ISO-8601. UI converts to Asia/Bangkok at render time. */
  releaseAt: string;
  impact: "High" | "Medium" | "Low";
  actual: NormalizedFigure;
  marketForecast: NormalizedFigure;
  previous: NormalizedPrevious;
  auriqEstimate: NormalizedEstimate;
  unit: string;
  /** true once the scheduled release instant has passed. */
  isReleased: boolean;
}

/** Merge a pipeline CalendarEvent into the single canonical shape. */
export function normalizeCalendarEvent(item: CalendarEvent, now = new Date()): NormalizedEvent {
  const { release, forecast, estimate, consensus } = item;
  const unit = release.unit ?? "";
  const releaseAt = release.nextReleaseUtc;
  const isReleased = Date.parse(releaseAt) <= now.getTime();

  const actualValue = toNumber(release.actualValue);
  const previousValue = toNumber(release.previousValue);
  const consensusValue =
    forecast.label === "Market Consensus" ? toNumber(forecast.numericValue) : null;

  return {
    id: release.releaseId,
    eventName: release.event,
    country: "United States",
    currency: release.currency ?? "USD",
    releaseAt,
    impact: release.impact,
    unit,
    isReleased,
    actual: {
      value: actualValue,
      displayValue:
        actualValue === null
          ? null
          : (formatUnitValue(actualValue, unit) ?? release.actual ?? null),
      source: actualValue === null ? null : (release.actualSource ?? null),
      fetchedAt: release.fetchedAt ?? null,
    },
    marketForecast: {
      value: consensusValue,
      displayValue: consensusValue === null ? null : forecast.value,
      source: consensusValue === null ? null : (consensus?.source ?? forecast.detail ?? null),
      fetchedAt: consensusValue === null ? null : (consensus?.retrievedAt ?? null),
    },
    previous: {
      value: previousValue,
      displayValue:
        previousValue === null
          ? null
          : (formatUnitValue(previousValue, unit) ?? release.previous ?? null),
      source: previousValue === null ? null : (release.actualSource ?? null),
      referencePeriod: previousValue === null ? null : (release.previousPeriodIso ?? null),
    },
    auriqEstimate: {
      value: estimate ? estimate.numericValue : null,
      displayValue: estimate ? estimate.value : null,
      modelVersion: estimate ? estimate.modelVersion : null,
      computedAt: estimate ? estimate.computedAt : null,
    },
  };
}
