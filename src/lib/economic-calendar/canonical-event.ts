/** Stable IDs used to join schedule rows with provider observations. */
const EVENT_ALIASES: Record<string, string> = {
  nfp: "US_NFP_CHANGE",
  "non farm payrolls": "US_NFP_CHANGE",
  "non farm employment change": "US_NFP_CHANGE",
  unemployment: "US_UNEMPLOYMENT_RATE",
  "unemployment rate": "US_UNEMPLOYMENT_RATE",
  "average hourly earnings m m": "US_AVG_HOURLY_EARNINGS_MOM",
  "labor force participation rate": "US_LABOR_FORCE_PARTICIPATION",
  "jolts job openings": "US_JOLTS_OPENINGS",
  "initial jobless claims": "US_INITIAL_JOBLESS_CLAIMS",
  "continuing jobless claims": "US_CONTINUING_JOBLESS_CLAIMS",
  "ism manufacturing pmi": "US_ISM_MANUFACTURING_PMI",
  "ism manufacturing prices": "US_ISM_MANUFACTURING_PRICES",
  "ism services pmi": "US_ISM_SERVICES_PMI",
  "adp non farm employment change": "US_ADP_EMPLOYMENT_CHANGE",
};

function normalizedName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalEconomicEventId(event: string): string {
  const normalized = normalizedName(event);
  return EVENT_ALIASES[normalized] ?? `US_${normalized.replace(/ /g, "_").toUpperCase()}`;
}
