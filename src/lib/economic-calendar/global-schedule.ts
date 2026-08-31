import type { Agency, OfficialRelease } from "./types";

/**
 * Layer 1b — recurring global release calendar.
 *
 * The API layers (BLS/BEA/Census/FRED) only publish the *next* occurrence of the
 * ~23 indicators they cover, which leaves most calendar days empty. This catalog
 * fills the grid with the standard recurring macro releases for the major
 * currencies, matching the density of a professional economic calendar.
 * Rows carry schedule metadata only — no actuals are invented.
 */

type Recurrence =
  | { kind: "weekly"; weekday: number }
  | { kind: "day-of-month"; day: number }
  | { kind: "nth-weekday"; weekday: number; nth: number };

interface ScheduledEventSpec {
  id: string;
  currency: string;
  agency: Agency;
  event: string;
  impact: "High" | "Medium" | "Low";
  /** UTC HH:mm */
  timeUtc: string;
  recurrence: Recurrence;
}

/** Recurring releases by currency. Times are UTC and follow the usual publication slots. */
export const GLOBAL_SCHEDULE: ScheduledEventSpec[] = [
  // ---- USD ----
  { id: "usd-ism-mfg", currency: "USD", agency: "Other", event: "ISM Manufacturing PMI", impact: "High", timeUtc: "14:00", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "usd-sp-mfg-pmi", currency: "USD", agency: "Other", event: "S&P Global Manufacturing PMI", impact: "Medium", timeUtc: "13:45", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "usd-construction-spending", currency: "USD", agency: "Census", event: "Construction Spending m/m", impact: "Low", timeUtc: "14:00", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "usd-factory-orders", currency: "USD", agency: "Census", event: "Factory Orders m/m", impact: "Medium", timeUtc: "14:00", recurrence: { kind: "day-of-month", day: 3 } },
  { id: "usd-adp", currency: "USD", agency: "Other", event: "ADP Non-Farm Employment Change", impact: "High", timeUtc: "12:15", recurrence: { kind: "day-of-month", day: 3 } },
  { id: "usd-ism-services", currency: "USD", agency: "Other", event: "ISM Services PMI", impact: "High", timeUtc: "14:00", recurrence: { kind: "day-of-month", day: 4 } },
  { id: "usd-trade-balance", currency: "USD", agency: "Census", event: "Trade Balance", impact: "Medium", timeUtc: "12:30", recurrence: { kind: "day-of-month", day: 5 } },
  { id: "usd-eia-crude", currency: "USD", agency: "Other", event: "EIA Crude Oil Inventories", impact: "Medium", timeUtc: "14:30", recurrence: { kind: "weekly", weekday: 3 } },
  { id: "usd-10y-auction", currency: "USD", agency: "Other", event: "10-y Bond Auction", impact: "Low", timeUtc: "17:00", recurrence: { kind: "day-of-month", day: 10 } },
  { id: "usd-30y-auction", currency: "USD", agency: "Other", event: "30-y Bond Auction", impact: "Low", timeUtc: "17:00", recurrence: { kind: "day-of-month", day: 11 } },
  { id: "usd-fomc-minutes", currency: "USD", agency: "Fed", event: "FOMC Meeting Minutes", impact: "High", timeUtc: "18:00", recurrence: { kind: "day-of-month", day: 20 } },
  { id: "usd-fed-speech", currency: "USD", agency: "Fed", event: "FOMC Member Speaks", impact: "Medium", timeUtc: "16:00", recurrence: { kind: "weekly", weekday: 2 } },
  { id: "usd-cb-consumer-confidence", currency: "USD", agency: "Other", event: "CB Consumer Confidence", impact: "High", timeUtc: "14:00", recurrence: { kind: "day-of-month", day: 27 } },
  { id: "usd-chicago-pmi", currency: "USD", agency: "Other", event: "Chicago PMI", impact: "Medium", timeUtc: "13:45", recurrence: { kind: "day-of-month", day: 28 } },
  { id: "usd-baker-hughes", currency: "USD", agency: "Other", event: "Baker Hughes Rig Count", impact: "Low", timeUtc: "17:00", recurrence: { kind: "weekly", weekday: 5 } },

  // ---- EUR ----
  { id: "eur-mfg-pmi", currency: "EUR", agency: "Other", event: "Eurozone Final Manufacturing PMI", impact: "Medium", timeUtc: "08:00", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "eur-services-pmi", currency: "EUR", agency: "Other", event: "Eurozone Final Services PMI", impact: "Medium", timeUtc: "08:00", recurrence: { kind: "day-of-month", day: 3 } },
  { id: "eur-cpi-flash", currency: "EUR", agency: "Other", event: "Eurozone Flash CPI y/y", impact: "High", timeUtc: "09:00", recurrence: { kind: "day-of-month", day: 2 } },
  { id: "eur-retail-sales", currency: "EUR", agency: "Other", event: "Eurozone Retail Sales m/m", impact: "Medium", timeUtc: "09:00", recurrence: { kind: "day-of-month", day: 5 } },
  { id: "eur-ecb-rate", currency: "EUR", agency: "Other", event: "ECB Main Refinancing Rate", impact: "High", timeUtc: "12:15", recurrence: { kind: "day-of-month", day: 12 } },
  { id: "eur-ecb-press", currency: "EUR", agency: "Other", event: "ECB Press Conference", impact: "High", timeUtc: "12:45", recurrence: { kind: "day-of-month", day: 12 } },
  { id: "eur-german-ifo", currency: "EUR", agency: "Other", event: "German ifo Business Climate", impact: "Medium", timeUtc: "08:00", recurrence: { kind: "day-of-month", day: 25 } },
  { id: "eur-german-zew", currency: "EUR", agency: "Other", event: "German ZEW Economic Sentiment", impact: "Medium", timeUtc: "09:00", recurrence: { kind: "nth-weekday", weekday: 2, nth: 2 } },
  { id: "eur-german-factory-orders", currency: "EUR", agency: "Other", event: "German Factory Orders m/m", impact: "Low", timeUtc: "06:00", recurrence: { kind: "day-of-month", day: 6 } },
  { id: "eur-german-ind-prod", currency: "EUR", agency: "Other", event: "German Industrial Production m/m", impact: "Low", timeUtc: "06:00", recurrence: { kind: "day-of-month", day: 8 } },

  // ---- GBP ----
  { id: "gbp-mfg-pmi", currency: "GBP", agency: "Other", event: "UK Final Manufacturing PMI", impact: "Medium", timeUtc: "08:30", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "gbp-services-pmi", currency: "GBP", agency: "Other", event: "UK Final Services PMI", impact: "Medium", timeUtc: "08:30", recurrence: { kind: "day-of-month", day: 3 } },
  { id: "gbp-cpi", currency: "GBP", agency: "Other", event: "UK CPI y/y", impact: "High", timeUtc: "06:00", recurrence: { kind: "nth-weekday", weekday: 3, nth: 3 } },
  { id: "gbp-boe-rate", currency: "GBP", agency: "Other", event: "BOE Official Bank Rate", impact: "High", timeUtc: "11:00", recurrence: { kind: "nth-weekday", weekday: 4, nth: 1 } },
  { id: "gbp-gdp-mm", currency: "GBP", agency: "Other", event: "UK GDP m/m", impact: "Medium", timeUtc: "06:00", recurrence: { kind: "day-of-month", day: 13 } },
  { id: "gbp-retail-sales", currency: "GBP", agency: "Other", event: "UK Retail Sales m/m", impact: "Medium", timeUtc: "06:00", recurrence: { kind: "day-of-month", day: 20 } },

  // ---- JPY ----
  { id: "jpy-boj-rate", currency: "JPY", agency: "Other", event: "BOJ Policy Rate", impact: "High", timeUtc: "03:00", recurrence: { kind: "day-of-month", day: 19 } },
  { id: "jpy-tankan", currency: "JPY", agency: "Other", event: "Tankan Manufacturing Index", impact: "Medium", timeUtc: "23:50", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "jpy-tokyo-cpi", currency: "JPY", agency: "Other", event: "Tokyo Core CPI y/y", impact: "Medium", timeUtc: "23:30", recurrence: { kind: "day-of-month", day: 25 } },
  { id: "jpy-ind-prod", currency: "JPY", agency: "Other", event: "Japan Industrial Production m/m", impact: "Low", timeUtc: "23:50", recurrence: { kind: "day-of-month", day: 28 } },

  // ---- CHF ----
  { id: "chf-mfg-pmi", currency: "CHF", agency: "Other", event: "Swiss Manufacturing PMI", impact: "Medium", timeUtc: "07:30", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "chf-cpi", currency: "CHF", agency: "Other", event: "Swiss CPI m/m", impact: "Medium", timeUtc: "06:30", recurrence: { kind: "day-of-month", day: 2 } },
  { id: "chf-snb-rate", currency: "CHF", agency: "Other", event: "SNB Policy Rate", impact: "High", timeUtc: "07:30", recurrence: { kind: "day-of-month", day: 21 } },
  { id: "chf-retail-sales", currency: "CHF", agency: "Other", event: "Swiss Retail Sales y/y", impact: "Low", timeUtc: "06:30", recurrence: { kind: "day-of-month", day: 29 } },

  // ---- AUD / NZD / CAD / CNY ----
  { id: "aud-rba-rate", currency: "AUD", agency: "Other", event: "RBA Cash Rate", impact: "High", timeUtc: "03:30", recurrence: { kind: "nth-weekday", weekday: 2, nth: 1 } },
  { id: "aud-employment", currency: "AUD", agency: "Other", event: "Australia Employment Change", impact: "High", timeUtc: "00:30", recurrence: { kind: "nth-weekday", weekday: 4, nth: 3 } },
  { id: "aud-retail-sales", currency: "AUD", agency: "Other", event: "Australia Retail Sales m/m", impact: "Medium", timeUtc: "00:30", recurrence: { kind: "day-of-month", day: 4 } },
  { id: "nzd-rbnz-rate", currency: "NZD", agency: "Other", event: "RBNZ Official Cash Rate", impact: "High", timeUtc: "01:00", recurrence: { kind: "nth-weekday", weekday: 3, nth: 3 } },
  { id: "cad-employment", currency: "CAD", agency: "Other", event: "Canada Employment Change", impact: "High", timeUtc: "12:30", recurrence: { kind: "nth-weekday", weekday: 5, nth: 1 } },
  { id: "cad-boc-rate", currency: "CAD", agency: "Other", event: "BOC Overnight Rate", impact: "High", timeUtc: "14:45", recurrence: { kind: "nth-weekday", weekday: 3, nth: 2 } },
  { id: "cad-cpi", currency: "CAD", agency: "Other", event: "Canada CPI m/m", impact: "High", timeUtc: "12:30", recurrence: { kind: "nth-weekday", weekday: 2, nth: 3 } },
  { id: "cad-gdp", currency: "CAD", agency: "Other", event: "Canada GDP m/m", impact: "Medium", timeUtc: "12:30", recurrence: { kind: "day-of-month", day: 30 } },
  { id: "cny-mfg-pmi", currency: "CNY", agency: "Other", event: "China Manufacturing PMI", impact: "Medium", timeUtc: "01:30", recurrence: { kind: "day-of-month", day: 31 } },
  { id: "cny-caixin-pmi", currency: "CNY", agency: "Other", event: "China Caixin Manufacturing PMI", impact: "Medium", timeUtc: "01:45", recurrence: { kind: "day-of-month", day: 1 } },
  { id: "cny-trade-balance", currency: "CNY", agency: "Other", event: "China Trade Balance", impact: "Medium", timeUtc: "03:00", recurrence: { kind: "day-of-month", day: 7 } },
];

function nthWeekdayOfMonth(date: Date): number {
  return Math.floor((date.getUTCDate() - 1) / 7) + 1;
}

function lastDayOfMonth(date: Date): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function matches(spec: ScheduledEventSpec, date: Date): boolean {
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return false; // markets closed
  if (spec.recurrence.kind === "weekly") return weekday === spec.recurrence.weekday;
  if (spec.recurrence.kind === "nth-weekday")
    return weekday === spec.recurrence.weekday && nthWeekdayOfMonth(date) === spec.recurrence.nth;
  const target = Math.min(spec.recurrence.day, lastDayOfMonth(date));
  const day = date.getUTCDate();
  if (day === target) return true;
  // A release scheduled on a weekend day moves to the preceding Friday.
  if (weekday === 5 && (day + 1 === target || day + 2 === target)) return true;
  return false;
}

/**
 * Expand the recurring catalog into calendar rows for the coming `horizonDays`
 * (and the trailing `pastDays`, so the current week is never half-empty).
 */
export function buildScheduledReleases(
  now = new Date(),
  horizonDays = 21,
  pastDays = 7,
): OfficialRelease[] {
  const out: OfficialRelease[] = [];
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - pastDays),
  );

  for (let offset = 0; offset <= pastDays + horizonDays; offset++) {
    const date = new Date(start.getTime() + offset * 86_400_000);
    for (const spec of GLOBAL_SCHEDULE) {
      if (!matches(spec, date)) continue;
      const [h = "12", m = "00"] = spec.timeUtc.split(":");
      const when = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          Number(h),
          Number(m),
        ),
      );
      out.push({
        releaseId: `${spec.id}-${when.toISOString().slice(0, 10)}`,
        agency: spec.agency,
        currency: spec.currency,
        event: spec.event,
        impact: spec.impact,
        unit: "",
        nextReleaseUtc: when.toISOString(),
        actualLabel: "Actual",
        actualSource: "Scheduled release · official calendar",
        time: spec.timeUtc,
        actualValue: null,
        previousValue: null,
        actual: "—",
        forecast: "—",
        previous: "—",
        history: [],
      });
    }
  }

  return out.sort((a, b) => a.nextReleaseUtc.localeCompare(b.nextReleaseUtc));
}
