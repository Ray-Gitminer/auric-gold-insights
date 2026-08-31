import { createServerFn } from "@tanstack/react-start";

import type { Agency, LayerStatus, OfficialRelease } from "./types";

/**
 * Layer 1a — the *real* US release calendar.
 *
 * Release DATES come from the ALFRED/FRED release-dates endpoint, which mirrors
 * each source agency's own published schedule (BLS, BEA, Census, DOL, Federal
 * Reserve). Nothing here is derived from a "day-of-month" guess.
 *
 * Release TIMES are the standing publication slots documented by each agency
 * (e.g. BLS news releases at 08:30 ET), converted from US Eastern to UTC with
 * the correct DST rule.
 *
 * ISM is not redistributed through FRED, so its two releases follow ISM's own
 * published rule (1st / 3rd business day of the month, 10:00 ET). Those rows
 * are schedule-only: no actual, forecast or previous is ever invented.
 */

export interface ScheduledEvent {
  /** Event name — matches the historical-data layer so actuals can be joined. */
  event: string;
  impact: "High" | "Medium" | "Low";
  agency: Agency;
  /** US Eastern publication time, HH:mm. */
  timeEt: string;
  /** How stale the newest observation may be and still count as this release. */
  maxLagDays: number;
}

interface FredReleaseSpec {
  releaseId: number;
  provider: string;
  sourceUrl: string;
  events: ScheduledEvent[];
}

const BLS = (event: string, impact: ScheduledEvent["impact"], maxLagDays = 75): ScheduledEvent => ({
  event,
  impact,
  agency: "BLS",
  timeEt: "08:30",
  maxLagDays,
});

/** FRED release id → the indicator rows published by that release. */
export const FRED_RELEASE_MAP: FredReleaseSpec[] = [
  {
    releaseId: 50,
    provider: "Bureau of Labor Statistics — Employment Situation",
    sourceUrl: "https://www.bls.gov/schedule/news_release/empsit.htm",
    events: [
      BLS("NFP", "High"),
      BLS("Unemployment", "High"),
      BLS("Average Hourly Earnings m/m", "High"),
      BLS("Labor Force Participation Rate", "Low"),
    ],
  },
  {
    releaseId: 10,
    provider: "Bureau of Labor Statistics — Consumer Price Index",
    sourceUrl: "https://www.bls.gov/schedule/news_release/cpi.htm",
    events: [BLS("CPI m/m", "High"), BLS("Core CPI m/m", "High")],
  },
  {
    releaseId: 46,
    provider: "Bureau of Labor Statistics — Producer Price Index",
    sourceUrl: "https://www.bls.gov/schedule/news_release/ppi.htm",
    events: [BLS("PPI m/m", "Medium"), BLS("Core PPI m/m", "Medium")],
  },
  {
    releaseId: 192,
    provider: "Bureau of Labor Statistics — JOLTS",
    sourceUrl: "https://www.bls.gov/schedule/news_release/jolts.htm",
    events: [
      {
        event: "JOLTS Job Openings",
        impact: "Medium",
        agency: "BLS",
        timeEt: "10:00",
        maxLagDays: 100,
      },
    ],
  },
  {
    releaseId: 180,
    provider: "US Department of Labor — Unemployment Insurance Weekly Claims",
    sourceUrl: "https://www.dol.gov/ui/data.pdf",
    events: [
      {
        event: "Initial Jobless Claims",
        impact: "Medium",
        agency: "DOL",
        timeEt: "08:30",
        maxLagDays: 14,
      },
      {
        event: "Continuing Jobless Claims",
        impact: "Low",
        agency: "DOL",
        timeEt: "08:30",
        maxLagDays: 21,
      },
    ],
  },
  {
    releaseId: 194,
    provider: "ADP Research Institute — National Employment Report",
    sourceUrl: "https://adpemploymentreport.com/",
    events: [
      {
        event: "ADP Non-Farm Employment Change",
        impact: "High",
        agency: "Other",
        timeEt: "08:15",
        maxLagDays: 45,
      },
    ],
  },
  {
    releaseId: 54,
    provider: "Bureau of Economic Analysis — Personal Income and Outlays",
    sourceUrl: "https://www.bea.gov/news/schedule",
    events: [{ event: "PCE m/m", impact: "High", agency: "BEA", timeEt: "08:30", maxLagDays: 75 }],
  },
  {
    releaseId: 53,
    provider: "Bureau of Economic Analysis — Gross Domestic Product",
    sourceUrl: "https://www.bea.gov/news/schedule",
    events: [{ event: "GDP q/q", impact: "High", agency: "BEA", timeEt: "08:30", maxLagDays: 160 }],
  },
  {
    releaseId: 9,
    provider: "US Census Bureau — Advance Monthly Retail Trade",
    sourceUrl: "https://www.census.gov/retail/index.html",
    events: [
      {
        event: "Retail Sales m/m",
        impact: "High",
        agency: "Census",
        timeEt: "08:30",
        maxLagDays: 75,
      },
    ],
  },
  {
    releaseId: 27,
    provider: "US Census Bureau — New Residential Construction",
    sourceUrl: "https://www.census.gov/construction/nrc/index.html",
    events: [
      { event: "Housing Starts", impact: "Low", agency: "Census", timeEt: "08:30", maxLagDays: 75 },
      {
        event: "Building Permits",
        impact: "Low",
        agency: "Census",
        timeEt: "08:30",
        maxLagDays: 75,
      },
    ],
  },
  {
    releaseId: 97,
    provider: "US Census Bureau — New Residential Sales",
    sourceUrl: "https://www.census.gov/construction/nrs/index.html",
    events: [
      {
        event: "New Home Sales",
        impact: "Medium",
        agency: "Census",
        timeEt: "10:00",
        maxLagDays: 75,
      },
    ],
  },
  {
    releaseId: 51,
    provider: "US Census Bureau / BEA — International Trade in Goods and Services",
    sourceUrl: "https://www.census.gov/foreign-trade/index.html",
    events: [
      { event: "Trade Balance", impact: "Low", agency: "Census", timeEt: "08:30", maxLagDays: 90 },
    ],
  },
  {
    releaseId: 229,
    provider: "US Census Bureau — Construction Spending",
    sourceUrl: "https://www.census.gov/construction/c30/c30index.html",
    events: [
      {
        event: "Construction Spending m/m",
        impact: "Low",
        agency: "Census",
        timeEt: "10:00",
        maxLagDays: 90,
      },
    ],
  },
  {
    releaseId: 13,
    provider: "Federal Reserve — G.17 Industrial Production",
    sourceUrl: "https://www.federalreserve.gov/releases/g17/",
    events: [
      {
        event: "Industrial Production m/m",
        impact: "Low",
        agency: "Fed",
        timeEt: "09:15",
        maxLagDays: 75,
      },
    ],
  },
];

/** ISM releases — schedule published by ISM itself, business-day based. */
const ISM_SOURCE =
  "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/";
const ISM_EVENTS: { event: string; impact: ScheduledEvent["impact"]; businessDay: 1 | 3 }[] = [
  { event: "ISM Manufacturing PMI", impact: "High", businessDay: 1 },
  { event: "ISM Manufacturing Prices", impact: "Medium", businessDay: 1 },
  { event: "ISM Services PMI", impact: "High", businessDay: 3 },
];

/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

function nthWeekdayUtcDate(year: number, monthIndex: number, weekday: number, nth: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  return 1 + ((weekday - first + 7) % 7) + (nth - 1) * 7;
}

/** true when the given UTC date falls inside US Eastern daylight time. */
export function isUsDst(date: Date): boolean {
  const y = date.getUTCFullYear();
  const start = Date.UTC(y, 2, nthWeekdayUtcDate(y, 2, 0, 2), 7); // 2nd Sunday of March, 02:00 ET
  const end = Date.UTC(y, 10, nthWeekdayUtcDate(y, 10, 0, 1), 6); // 1st Sunday of November
  const t = date.getTime();
  return t >= start && t < end;
}

/** Convert a calendar date (YYYY-MM-DD) + Eastern HH:mm into a UTC instant. */
export function etToUtc(isoDate: string, timeEt: string): Date {
  const [y = 0, m = 1, d = 1] = isoDate.split("-").map(Number);
  const [h = 0, min = 0] = timeEt.split(":").map(Number);
  const naive = new Date(Date.UTC(y, m - 1, d, h, min));
  const offset = isUsDst(naive) ? 4 : 5;
  return new Date(naive.getTime() + offset * 3_600_000);
}

function utcDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isBusinessDay(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

/** Nth business day of a month, as YYYY-MM-DD. */
function nthBusinessDay(year: number, monthIndex: number, nth: number): string {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    if (date.getUTCMonth() !== monthIndex) break;
    if (!isBusinessDay(date)) continue;
    count += 1;
    if (count === nth) return utcDateOnly(date);
  }
  return utcDateOnly(new Date(Date.UTC(year, monthIndex, 1)));
}

/* ------------------------------------------------------------------ */
/* Row construction                                                    */
/* ------------------------------------------------------------------ */

function scheduleRow(args: {
  key: string;
  isoDate: string;
  event: ScheduledEvent;
  provider: string;
  sourceUrl: string;
  fetchedAt: string;
}): OfficialRelease & { provider: string; sourceUrl: string; fetchedAt: string } {
  const when = etToUtc(args.isoDate, args.event.timeEt);
  return {
    releaseId: `${args.key}-${args.event.event.replace(/\s+/g, "-").toLowerCase()}-${args.isoDate}`,
    agency: args.event.agency,
    currency: "USD",
    event: args.event.event,
    impact: args.event.impact,
    unit: "",
    nextReleaseUtc: when.toISOString(),
    actualLabel: "Actual",
    actualSource: `${args.provider} · ${args.sourceUrl}`,
    time: `${String(when.getUTCHours()).padStart(2, "0")}:${String(when.getUTCMinutes()).padStart(2, "0")}`,
    actualValue: null,
    previousValue: null,
    actual: "—",
    forecast: "—",
    previous: "—",
    history: [],
    provider: args.provider,
    sourceUrl: args.sourceUrl,
    fetchedAt: args.fetchedAt,
  };
}

export type ScheduledRelease = ReturnType<typeof scheduleRow> & { maxLagDays: number };

export interface UsSchedulePayload {
  releases: ScheduledRelease[];
  status: LayerStatus;
}

/**
 * Real US release schedule for the window [now - 14d, now + 45d].
 */
export const fetchUsReleaseSchedule = createServerFn({ method: "GET" }).handler(
  async (): Promise<UsSchedulePayload> => {
    const now = new Date();
    const fetchedAt = now.toISOString();
    const start = utcDateOnly(new Date(now.getTime() - 14 * 86_400_000));
    const end = utcDateOnly(new Date(now.getTime() + 45 * 86_400_000));

    const rows: ScheduledRelease[] = [];

    // --- ISM: business-day rule from ISM's own publication schedule ---
    for (let monthOffset = -1; monthOffset <= 2; monthOffset++) {
      const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1));
      for (const ism of ISM_EVENTS) {
        const isoDate = nthBusinessDay(ref.getUTCFullYear(), ref.getUTCMonth(), ism.businessDay);
        if (isoDate < start || isoDate > end) continue;
        rows.push({
          ...scheduleRow({
            key: "ism",
            isoDate,
            event: {
              event: ism.event,
              impact: ism.impact,
              agency: "Other",
              timeEt: "10:00",
              maxLagDays: 45,
            },
            provider: "Institute for Supply Management",
            sourceUrl: ISM_SOURCE,
            fetchedAt,
          }),
          maxLagDays: 45,
        });
      }
    }

    const key = process.env["FRED_API_KEY"];
    if (!key) {
      return {
        releases: rows.sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc)),
        status: {
          agency: "Other",
          ok: false,
          message: "FRED_API_KEY not configured — only the ISM business-day schedule is available",
        },
      };
    }

    let ok = 0;
    let failed = 0;

    await Promise.all(
      FRED_RELEASE_MAP.map(async (spec) => {
        const url =
          `https://api.stlouisfed.org/fred/release/dates?release_id=${spec.releaseId}` +
          `&file_type=json&include_release_dates_with_no_data=true` +
          `&realtime_start=${start}&realtime_end=${end}&api_key=${encodeURIComponent(key)}`;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`FRED responded ${res.status}`);
          const json = (await res.json()) as { release_dates?: { date: string }[] };
          const dates = (json.release_dates ?? []).map((d) => d.date);
          // Server-only diagnostics. Never logs the API key or the raw URL.
          console.info(
            `[calendar] FRED release ${spec.releaseId} (${spec.provider}) → ${dates.length} dates`,
          );
          if (!dates.length) return;
          ok += 1;
          for (const isoDate of dates) {
            if (isoDate < start || isoDate > end) continue;
            for (const event of spec.events) {
              rows.push({
                ...scheduleRow({
                  key: `fred${spec.releaseId}`,
                  isoDate,
                  event,
                  provider: spec.provider,
                  sourceUrl: spec.sourceUrl,
                  fetchedAt,
                }),
                maxLagDays: event.maxLagDays,
              });
            }
          }
        } catch {
          failed += 1;
        }
      }),
    );

    return {
      releases: rows.sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc)),
      status: {
        agency: "Other",
        ok: ok > 0,
        message: `Official release dates · ${ok} agency schedules${failed ? ` · ${failed} unavailable` : ""} · fetched ${fetchedAt}`,
      },
    };
  },
);
