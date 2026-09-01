import { createServerFn } from "@tanstack/react-start";

import type { HistoricalPoint, IndicatorSpec, OfficialReleasePayload } from "./types";
import { applyTransform, buildRelease } from "./schedule";

export const BLS_INDICATORS: IndicatorSpec[] = [
  {
    releaseId: "bls-cpi-mm",
    event: "CPI m/m",
    agency: "BLS",
    impact: "High",
    unit: "%",
    transform: "pct-change",
    seriesId: "CUSR0000SA0",
    schedule: { kind: "day-of-month", day: 13, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-core-cpi-mm",
    event: "Core CPI m/m",
    agency: "BLS",
    impact: "High",
    unit: "%",
    transform: "pct-change",
    seriesId: "CUSR0000SA0L1E",
    schedule: { kind: "day-of-month", day: 13, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-ppi-mm",
    event: "PPI m/m",
    agency: "BLS",
    impact: "Medium",
    unit: "%",
    transform: "pct-change",
    seriesId: "WPSFD4",
    schedule: { kind: "day-of-month", day: 15, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-nfp",
    event: "NFP",
    agency: "BLS",
    impact: "High",
    unit: "K",
    transform: "diff",
    seriesId: "CES0000000001",
    schedule: { kind: "nth-weekday", weekday: 5, nth: 1, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-unemployment",
    event: "Unemployment",
    agency: "BLS",
    impact: "High",
    unit: "%",
    transform: "level",
    seriesId: "LNS14000000",
    schedule: { kind: "nth-weekday", weekday: 5, nth: 1, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-average-hourly-earnings",
    event: "Average Hourly Earnings m/m",
    agency: "BLS",
    impact: "High",
    unit: "%",
    transform: "pct-change",
    seriesId: "CES0500000003",
    schedule: { kind: "nth-weekday", weekday: 5, nth: 1, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-participation-rate",
    event: "Labor Force Participation Rate",
    agency: "BLS",
    impact: "Medium",
    unit: "%",
    transform: "level",
    seriesId: "LNS11300000",
    schedule: { kind: "nth-weekday", weekday: 5, nth: 1, timeUtc: "12:30" },
  },
  {
    releaseId: "bls-jolts",
    event: "JOLTS Job Openings",
    agency: "BLS",
    impact: "Medium",
    unit: "K",
    transform: "level",
    seriesId: "JTS000000000000000JOL",
    schedule: { kind: "day-of-month", day: 5, timeUtc: "14:00" },
  },
  {
    releaseId: "bls-core-ppi-mm",
    event: "Core PPI m/m",
    agency: "BLS",
    impact: "Medium",
    unit: "%",
    transform: "pct-change",
    seriesId: "WPSFD4131",
    schedule: { kind: "day-of-month", day: 15, timeUtc: "12:30" },
  },
];

interface BlsSeriesRow {
  year: string;
  period: string;
  value: string;
}

/** Convert a BLS {year, period:"M01"} row into an ISO period date. */
function periodIso(row: BlsSeriesRow): string | null {
  if (!row.period.startsWith("M") || row.period === "M13") return null;
  const month = Number(row.period.slice(1));
  if (!Number.isFinite(month)) return null;
  return new Date(Date.UTC(Number(row.year), month - 1, 1)).toISOString();
}

export const fetchBlsReleases = createServerFn({ method: "GET" }).handler(
  async (): Promise<OfficialReleasePayload> => {
    const key = process.env["BLS_API_KEY"];
    const now = new Date();
    const endyear = now.getUTCFullYear();
    const startyear = endyear - 3;

    async function request(registrationKey?: string) {
      const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesid: BLS_INDICATORS.map((i) => i.seriesId),
          startyear: String(startyear),
          endyear: String(endyear),
          ...(registrationKey ? { registrationkey: registrationKey } : {}),
        }),
      });
      if (!res.ok) throw new Error(`BLS responded ${res.status}`);
      return (await res.json()) as {
        status?: string;
        message?: string[];
        Results?: { series?: { seriesID: string; data?: BlsSeriesRow[] }[] };
      };
    }

    try {
      let json = await request(key);
      // A stale/invalid optional key must not take down public BLS data. The
      // current request is below BLS's unauthenticated series limit, so retry
      // once without the key and keep secrets out of logs.
      if (json.status !== "REQUEST_SUCCEEDED" && key) json = await request();
      if (json.status !== "REQUEST_SUCCEEDED") {
        throw new Error(json.message?.join(" · ") || "BLS request not succeeded");
      }

      const fetchedAt = new Date().toISOString();
      const bySeries = new Map<string, HistoricalPoint[]>();
      for (const s of json.Results?.series ?? []) {
        const points: HistoricalPoint[] = [];
        for (const row of s.data ?? []) {
          const iso = periodIso(row);
          const value = Number(row.value);
          if (iso && Number.isFinite(value)) points.push({ periodIso: iso, value });
        }
        points.sort((a, b) => a.periodIso.localeCompare(b.periodIso));
        bySeries.set(s.seriesID, points);
      }

      const releases = BLS_INDICATORS.flatMap((spec) => {
        const raw = bySeries.get(spec.seriesId);
        if (!raw || raw.length < 3) return [];
        return [buildRelease(spec, applyTransform(raw, spec.transform), fetchedAt, now)];
      });

      return {
        releases,
        status: {
          agency: "BLS",
          ok: releases.length > 0,
          message: releases.length
            ? `BLS API · ${releases.length} series · ${fetchedAt}`
            : "BLS returned no usable series",
        },
      };
    } catch (error) {
      return {
        releases: [],
        status: {
          agency: "BLS",
          ok: false,
          message: error instanceof Error ? error.message : "BLS request failed",
        },
      };
    }
  },
);
