import { createServerFn } from "@tanstack/react-start";

import type { HistoricalPoint, IndicatorSpec, OfficialReleasePayload } from "./types";
import { applyTransform, buildRelease } from "./schedule";

interface CensusSpec extends IndicatorSpec {
  /** Census EITS timeseries dataset (marts, advm3, resconst, ressales). */
  dataset: string;
  categoryCode: string;
  dataTypeCode: string;
}

/** Indicators sourced directly from the Census Bureau EITS API. */
export const CENSUS_INDICATORS: CensusSpec[] = [
  {
    releaseId: "census-retail-sales",
    event: "Retail Sales m/m",
    agency: "Census",
    impact: "High",
    unit: "%",
    transform: "pct-change",
    seriesId: "MARTS-44000-SM",
    dataset: "marts",
    categoryCode: "44000",
    dataTypeCode: "SM",
    schedule: { kind: "day-of-month", day: 16, timeUtc: "12:30" },
  },
  {
    releaseId: "census-durable-goods",
    event: "Durable Goods Orders m/m",
    agency: "Census",
    impact: "Medium",
    unit: "%",
    transform: "pct-change",
    seriesId: "ADVM3-MDM-NO",
    dataset: "advm3",
    categoryCode: "MDM",
    dataTypeCode: "NO",
    schedule: { kind: "day-of-month", day: 26, timeUtc: "12:30" },
  },
  {
    releaseId: "census-housing-starts",
    event: "Housing Starts",
    agency: "Census",
    impact: "Medium",
    unit: "K",
    transform: "level",
    seriesId: "RESCONST-ASTARTS-TOTAL",
    dataset: "resconst",
    categoryCode: "ASTARTS",
    dataTypeCode: "TOTAL",
    schedule: { kind: "day-of-month", day: 18, timeUtc: "12:30" },
  },
  {
    releaseId: "census-building-permits",
    event: "Building Permits",
    agency: "Census",
    impact: "Medium",
    unit: "K",
    transform: "level",
    seriesId: "RESCONST-APERMITS-TOTAL",
    dataset: "resconst",
    categoryCode: "APERMITS",
    dataTypeCode: "TOTAL",
    schedule: { kind: "day-of-month", day: 18, timeUtc: "12:30" },
  },
];

function parseRows(rows: string[][]): HistoricalPoint[] {
  const [header, ...body] = rows;
  if (!header) return [];
  const valueIndex = header.indexOf("cell_value");
  const timeIndex = header.indexOf("time");
  if (valueIndex < 0 || timeIndex < 0) return [];

  const points: HistoricalPoint[] = [];
  for (const row of body) {
    const value = Number(row[valueIndex]);
    const period = row[timeIndex];
    if (!Number.isFinite(value) || !period) continue;
    points.push({ periodIso: `${period}-01T00:00:00.000Z`, value });
  }
  return points.sort((a, b) => a.periodIso.localeCompare(b.periodIso));
}

export const fetchCensusReleases = createServerFn({ method: "GET" }).handler(
  async (): Promise<OfficialReleasePayload> => {
    const key = process.env["CENSUS_API_KEY"];
    if (!key) {
      return {
        releases: [],
        status: { agency: "Census", ok: false, message: "CENSUS_API_KEY not configured" },
      };
    }

    const now = new Date();
    const fetchedAt = now.toISOString();
    const years = [now.getUTCFullYear() - 2, now.getUTCFullYear() - 1, now.getUTCFullYear()];

    try {
      const releases = [];
      for (const spec of CENSUS_INDICATORS) {
        const raw: HistoricalPoint[] = [];
        for (const year of years) {
          const url =
            `https://api.census.gov/data/timeseries/eits/${spec.dataset}` +
            `?get=cell_value,time_slot_id&for=us:*&time=${year}` +
            `&category_code=${spec.categoryCode}&data_type_code=${spec.dataTypeCode}` +
            `&seasonally_adj=yes&key=${encodeURIComponent(key)}`;
          const res = await fetch(url);
          if (!res.ok) {
            // Server-only diagnostics; the URL (which carries the key) is never logged.
            console.warn(`[calendar] Census ${spec.seriesId} ${year} → HTTP ${res.status}`);
            continue;
          }
          const text = await res.text();
          if (!text.trim().startsWith("[")) {
            console.warn(
              `[calendar] Census ${spec.seriesId} ${year} → non-JSON: ${text.slice(0, 120)}`,
            );
            continue;
          }
          raw.push(...parseRows(JSON.parse(text) as string[][]));
        }

        const ordered = raw.sort((a, b) => a.periodIso.localeCompare(b.periodIso));
        const points = applyTransform(ordered, spec.transform);
        console.info(
          `[calendar] Census ${spec.seriesId} → ${ordered.length} raw obs, ${points.length} points`,
        );
        if (points.length < 3) continue;
        releases.push(buildRelease({ ...spec, transform: "level" }, points, fetchedAt, now));
      }

      return {
        releases,
        status: {
          agency: "Census",
          ok: releases.length > 0,
          message: releases.length
            ? `Census EITS API · ${releases.length} series · ${fetchedAt}`
            : "Census returned no usable series",
        },
      };
    } catch (error) {
      return {
        releases: [],
        status: {
          agency: "Census",
          ok: false,
          message: error instanceof Error ? error.message : "Census request failed",
        },
      };
    }
  },
);
