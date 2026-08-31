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
        const url =
          `https://api.stlouisfed.org/fred/series/observations?series_id=${spec.seriesId}` +
          `&observation_start=${start}&file_type=json&api_key=${encodeURIComponent(key)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`FRED responded ${res.status}`);
        const json = (await res.json()) as { observations?: { date: string; value: string }[] };
        const points: HistoricalPoint[] = [];
        for (const o of json.observations ?? []) {
          const value = Number(o.value);
          if (Number.isFinite(value)) points.push({ periodIso: `${o.date}T00:00:00.000Z`, value });
        }
        if (points.length < 3) continue;
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
