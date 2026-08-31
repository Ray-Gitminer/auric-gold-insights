import { createServerFn } from "@tanstack/react-start";

import type { HistoricalPoint, IndicatorSpec, OfficialReleasePayload } from "./types";
import { applyTransform, buildRelease } from "./schedule";

export const BEA_INDICATORS: IndicatorSpec[] = [
  {
    releaseId: "bea-pce-mm",
    event: "PCE m/m",
    agency: "BEA",
    impact: "High",
    unit: "%",
    transform: "pct-change",
    // NIPA table T20304 (price indexes for PCE), line 1.
    seriesId: "T20304:1",
    schedule: { kind: "day-of-month", day: 27, timeUtc: "12:30" },
  },
  {
    releaseId: "bea-gdp-qq",
    event: "GDP q/q",
    agency: "BEA",
    impact: "High",
    unit: "%",
    transform: "level",
    // NIPA table T10101 (percent change from preceding period), line 1.
    seriesId: "T10101:1",
    schedule: { kind: "day-of-month", day: 26, timeUtc: "12:30" },
  },
];

interface BeaRow {
  TimePeriod: string;
  LineNumber: string;
  DataValue: string;
}

function timePeriodIso(period: string): string | null {
  const m = /^(\d{4})M(\d{2})$/.exec(period);
  if (m) return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)).toISOString();
  const q = /^(\d{4})Q(\d)$/.exec(period);
  if (q) return new Date(Date.UTC(Number(q[1]), (Number(q[2]) - 1) * 3, 1)).toISOString();
  return null;
}

async function fetchTable(
  userId: string,
  tableName: string,
  frequency: "M" | "Q",
  line: string,
): Promise<HistoricalPoint[]> {
  const years = Array.from({ length: 4 }, (_, i) => new Date().getUTCFullYear() - 3 + i).join(",");
  const url =
    `https://apps.bea.gov/api/data?UserID=${encodeURIComponent(userId)}&method=GetData` +
    `&datasetname=NIPA&TableName=${tableName}&Frequency=${frequency}&Year=${years}&ResultFormat=JSON`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BEA responded ${res.status}`);
  const json = (await res.json()) as {
    BEAAPI?: { Results?: { Data?: BeaRow[]; Error?: { APIErrorDescription?: string } } };
  };
  const err = json.BEAAPI?.Results?.Error?.APIErrorDescription;
  if (err) throw new Error(err);
  const points: HistoricalPoint[] = [];
  for (const row of json.BEAAPI?.Results?.Data ?? []) {
    if (row.LineNumber !== line) continue;
    const iso = timePeriodIso(row.TimePeriod);
    const value = Number(String(row.DataValue).replace(/,/g, ""));
    if (iso && Number.isFinite(value)) points.push({ periodIso: iso, value });
  }
  points.sort((a, b) => a.periodIso.localeCompare(b.periodIso));
  return points;
}

export const fetchBeaReleases = createServerFn({ method: "GET" }).handler(
  async (): Promise<OfficialReleasePayload> => {
    const userId = process.env["BEA_API_KEY"];
    if (!userId) {
      return {
        releases: [],
        status: { agency: "BEA", ok: false, message: "BEA_API_KEY not configured" },
      };
    }

    const now = new Date();
    const fetchedAt = now.toISOString();
    try {
      const releases = [];
      for (const spec of BEA_INDICATORS) {
        const [table = "", line = "1"] = spec.seriesId.split(":");
        const points = await fetchTable(userId, table, spec.releaseId.includes("gdp") ? "Q" : "M", line);
        if (points.length < 3) continue;
        releases.push(buildRelease(spec, applyTransform(points, spec.transform), fetchedAt, now));
      }
      return {
        releases,
        status: {
          agency: "BEA",
          ok: releases.length > 0,
          message: releases.length
            ? `BEA API · ${releases.length} series · ${fetchedAt}`
            : "BEA returned no usable series",
        },
      };
    } catch (error) {
      return {
        releases: [],
        status: {
          agency: "BEA",
          ok: false,
          message: error instanceof Error ? error.message : "BEA request failed",
        },
      };
    }
  },
);
