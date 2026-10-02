import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TwelveDataResult =
  | { ok: true; upserted: number; latest: string }
  | { ok: false; error: string };

type TdValue = { datetime?: string; open?: string; high?: string; low?: string; close?: string };
type TdResponse = { status?: string; code?: unknown; values?: TdValue[] };

// Fetches XAU/USD M5 from Twelve Data and upserts into market_candles_m5.
export const fetchXauCandles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<TwelveDataResult> => {
    const apiKey = process.env["TWELVE_DATA_API_KEY"];
    if (!apiKey) return { ok: false, error: "TWELVE_DATA_API_KEY is not configured" };

    const url = new URL("https://api.twelvedata.com/time_series");
    url.search = new URLSearchParams({
      symbol: "XAU/USD",
      interval: "5min",
      outputsize: "500",
      timezone: "UTC",
      apikey: apiKey,
    }).toString();

    let body: TdResponse;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) return { ok: false, error: `Provider HTTP ${res.status}` };
      body = (await res.json()) as TdResponse;
    } catch {
      return { ok: false, error: "Provider request failed" };
    }
    if (body.status === "error") {
      const code = typeof body.code === "number" ? body.code : 0;
      return { ok: false, error: `Provider error code ${code}` };
    }

    const pos = (v: unknown): number | null => {
      if (typeof v !== "string" || v.trim() === "") return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const now = new Date().toISOString();
    const rows = (Array.isArray(body.values) ? body.values : []).flatMap((v) => {
      if (typeof v.datetime !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v.datetime)) return [];
      const ts = new Date(`${v.datetime.replace(" ", "T")}Z`);
      const o = pos(v.open), h = pos(v.high), l = pos(v.low), c = pos(v.close);
      if (Number.isNaN(ts.getTime()) || o === null || h === null || l === null || c === null) return [];
      if (h < l || o > h || o < l || c > h || c < l) return [];
      return [{ timestamp: ts.toISOString(), open: o, high: h, low: l, close: c, updated_at: now }];
    });
    if (rows.length === 0) return { ok: false, error: "Provider returned no valid candles" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("market_candles_m5").upsert(rows, { onConflict: "timestamp" });
    if (error) return { ok: false, error: "Database write failed" };

    const latest = rows.reduce((a, b) => (a.timestamp > b.timestamp ? a : b)).timestamp;
    return { ok: true, upserted: rows.length, latest };
  });
