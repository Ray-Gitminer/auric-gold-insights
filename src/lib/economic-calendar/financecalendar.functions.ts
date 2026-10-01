import { createServerFn } from "@tanstack/react-start";

export interface FcEvent {
  name: string;
  date: string;
  timeEt: string;
  impact: "High" | "Medium" | "Low";
  country: string;
  prior: string | null;
  forecast: string | null;
  actual: string | null;
  url: string | null;
}

export interface FcResult {
  ok: boolean;
  events: FcEvent[];
  fetchedAt: string;
  error?: string;
}

let cache: { at: number; data: FcResult } | null = null;
const TTL = 60 * 60_000;

const schema = {
  type: "object",
  properties: {
    events: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          date: { type: "string", description: "ISO date YYYY-MM-DD" },
          timeEt: { type: "string", description: "time in US Eastern as shown, e.g. 8:30 am" },
          impact: { type: "string", enum: ["High", "Medium", "Low"] },
          country: { type: "string" },
          prior: { type: ["string", "null"] },
          forecast: { type: ["string", "null"] },
          actual: { type: ["string", "null"] },
          url: { type: ["string", "null"] },
        },
        required: ["name", "date", "timeEt", "impact", "country"],
      },
    },
  },
  required: ["events"],
};

export const fetchFinanceCalendar = createServerFn({ method: "GET" }).handler(async (): Promise<FcResult> => {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const lovable = process.env["LOVABLE_API_KEY"];
  const fc = process.env["FIRECRAWL_API_KEY"];
  if (!lovable || !fc) return { ok: false, events: [], fetchedAt: new Date().toISOString(), error: "FinanceCalendar not connected" };
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": fc },
      body: JSON.stringify({
        url: "https://www.financecalendar.com/this-week/",
        formats: [{ type: "json", schema, prompt: "Extract every economic release listed for this week and next week exactly as shown. Use null when a value is not shown. Never guess numbers." }],
        onlyMainContent: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("financecalendar", res.status, body.slice(0, 300));
      return { ok: false, events: [], fetchedAt: new Date().toISOString(), error: `FinanceCalendar ${res.status}` };
    }
    const j = (await res.json()) as { data?: { json?: { events?: FcEvent[] } }; json?: { events?: FcEvent[] } };
    const events = (j.data?.json?.events ?? j.json?.events ?? []).filter((e) => e?.name);
    const data: FcResult = { ok: true, events, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    return { ok: false, events: [], fetchedAt: new Date().toISOString(), error: e instanceof Error ? e.message : "fetch failed" };
  }
});
