import { createServerFn } from "@tanstack/react-start";

import type { HistoricalPoint, IndicatorSpec, OfficialReleasePayload } from "./types";
import { buildRelease } from "./schedule";

export const FRED_INDICATORS: IndicatorSpec[] = [
  {
    releaseId: "fred-fed-funds",
    event: "Fed Funds Rate",
    agency: "Fed",
    impact: "High",
    unit: "%",
    transform: "level",
    seriesId: "FEDFUNDS",
    schedule: { kind: "day-of-month", day: 18, timeUtc: "18:00" },
  },
  {
    releaseId: "dol-initial-claims",
    event: "Initial Jobless Claims",
    agency: "DOL",
    impact: "Medium",
    unit: "K",
    transform: "level",
    seriesId: "ICSA",
    schedule: { kind: "weekly", weekday: 4, timeUtc: "12:30" },
  },
  {
    releaseId: "dol-continuing-claims",
    event: "Continuing Jobless Claims",
    agency: "DOL",
    impact: "Low",
    unit: "K",
    transform: "level",
    seriesId: "CCSA",
    schedule: { kind: "weekly", weekday: 4, timeUtc: "12:30" },
  },
  {
    releaseId: "fed-industrial-production",
    event: "Industrial Production m/m",
    agency: "Fed",
    impact: "Medium",
    unit: "%",
    transform: "pct-change",
    seriesId: "INDPRO",
    schedule: { kind: "day-of-month", day: 17, timeUtc: "13:15" },
  },
  {
    releaseId: "census-new-home-sales",
    event: "New Home Sales",
    agency: "Census",
    impact: "Medium",
    unit: "K",
    transform: "level",
    seriesId: "HSN1F",
    schedule: { kind: "day-of-month", day: 24, timeUtc: "14:00" },
  },
  {
    releaseId: "other-existing-home-sales",
    event: "Existing Home Sales",
    agency: "Other",
    impact: "Medium",
    unit: "M",
    transform: "level",
    seriesId: "EXHOSLUSM495S",
    schedule: { kind: "day-of-month", day: 23, timeUtc: "14:00" },
  },
  {
    releaseId: "other-consumer-sentiment",
    event: "Consumer Sentiment",
    agency: "Other",
    impact: "Medium",
    unit: "",
    transform: "level",
    seriesId: "UMCSENT",
    schedule: { kind: "nth-weekday", weekday: 5, nth: 2, timeUtc: "14:00" },
  },
];

export const fetchFredReleases = createServerFn({ method: "GET" }).handler(
  async (): Promise<OfficialReleasePayload> => {
    const key = process.env["FRED_API_KEY"];
    if (!key) {
      return {
        releases: [],
        status: { agency: "Fed", ok: false, message: "FRED_API_KEY not configured" },
      };
    }

    const now = new Date();
    const fetchedAt = now.toISOString();
    const start = new Date(Date.UTC(now.getUTCFullYear() - 3, 0, 1)).toISOString().slice(0, 10);

    try {
      const releases = [];
      for (const spec of FRED_INDICATORS) {
        const base =
          `https://api.stlouisfed.org/fred/series/observations?series_id=${spec.seriesId}` +
          `&observation_start=${start}&file_type=json&api_key=${encodeURIComponent(key)}`;
        // DOL claims series are reported as persons; the calendar shows thousands.
        const divisor = spec.seriesId === "ICSA" || spec.seriesId === "CCSA" ? 1000 : 1;

        const [res, firstRes] = await Promise.all([
          fetch(base),
          // ALFRED vintage: output_type=4 returns the value as FIRST published,
          // before any revision — the number a public calendar shows.
          fetch(`${base}&output_type=4&realtime_start=1776-07-04&realtime_end=9999-12-31`),
        ]);
        if (!res.ok) throw new Error(`FRED responded ${res.status}`);
        const json = (await res.json()) as { observations?: { date: string; value: string }[] };

        const firstPrint = new Map<string, number>();
        if (firstRes.ok) {
          const vintage = (await firstRes.json()) as {
            observations?: Record<string, string>[];
          };
          for (const row of vintage.observations ?? []) {
            const date = row["date"];
            if (!date) continue;
            // The initial-release column is named after the first vintage date,
            // e.g. "ICSA_19670107". Take the first non-date, non-"." value.
            const raw = Object.entries(row).find(
              ([k, v]) => !k.startsWith("realtime") && k !== "date" && v !== ".",
            )?.[1];
            const value = Number(raw) / divisor;
            if (raw !== undefined && Number.isFinite(value)) firstPrint.set(date, value);
          }
        }

        const points: HistoricalPoint[] = [];
        for (const o of json.observations ?? []) {
          const value = Number(o.value) / divisor;
          if (!Number.isFinite(value)) continue;
          const first = firstPrint.get(o.date);
          points.push({
            periodIso: `${o.date}T00:00:00.000Z`,
            value,
            ...(first !== undefined ? { firstValue: first } : {}),
          });
        }
        if (points.length < 3) continue;
        // Server-only diagnostics: shape of the normalized series, no secrets.
        console.info(
          `[calendar] FRED series ${spec.seriesId} → ${points.length} obs · latest ${points.at(-1)?.periodIso} = ${points.at(-1)?.value}`,
        );
        releases.push(buildRelease(spec, points, fetchedAt, now));
      }
      return {
        releases,
        status: {
          agency: "Fed",
          ok: releases.length > 0,
          message: releases.length
            ? `FRED API · ${releases.length} series · ${fetchedAt}`
            : "FRED returned no usable series",
        },
      };
    } catch (error) {
      return {
        releases: [],
        status: {
          agency: "Fed",
          ok: false,
          message: error instanceof Error ? error.message : "FRED request failed",
        },
      };
    }
  },
);
