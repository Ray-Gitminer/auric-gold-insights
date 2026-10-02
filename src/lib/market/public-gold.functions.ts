import { createServerFn } from "@tanstack/react-start";

export type PublicGoldCandle = { time: number; open: number; high: number; low: number; close: number };

export type PublicGoldFeed = {
  symbol: string;
  source: string;
  sourceUrl: string;
  fetchedAt: number;
  candles: PublicGoldCandle[];
  note: string;
};

const TIMEFRAME_CONFIG: Record<string, { range: string; interval: string; bucketHours?: number }> = {
  "5m": { range: "1d", interval: "5m" },
  "15m": { range: "5d", interval: "15m" },
  "1h": { range: "1mo", interval: "60m" },
  "4h": { range: "3mo", interval: "60m", bucketHours: 4 },
  "1D": { range: "6mo", interval: "1d" },
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; feed: PublicGoldFeed }>();

type YahooQuote = { open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close?: (number | null)[] };
type YahooChartResponse = {
  chart?: {
    result?: { timestamp?: number[]; indicators?: { quote?: YahooQuote[] } }[];
    error?: { code?: string; description?: string } | null;
  };
};

function bucketCandles(candles: PublicGoldCandle[], hours: number): PublicGoldCandle[] {
  const bucketMs = hours * 3_600_000;
  const out: PublicGoldCandle[] = [];
  for (const c of candles) {
    const bucketStart = Math.floor(c.time / bucketMs) * bucketMs;
    const last = out[out.length - 1];
    if (last && last.time === bucketStart) {
      last.high = Math.max(last.high, c.high);
      last.low = Math.min(last.low, c.low);
      last.close = c.close;
    } else {
      out.push({ time: bucketStart, open: c.open, high: c.high, low: c.low, close: c.close });
    }
  }
  return out;
}

export const fetchPublicGold = createServerFn({ method: "GET" })
  .inputValidator((input: { timeframe?: string }) => input)
  .handler(async ({ data }): Promise<PublicGoldFeed> => {
    const timeframe = data?.timeframe && TIMEFRAME_CONFIG[data.timeframe] ? data.timeframe : "1h";
    const config = TIMEFRAME_CONFIG[timeframe]!;

    const cached = cache.get(timeframe);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.feed;

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?range=${config.range}&interval=${config.interval}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AURIQ/1.0)", Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Public feed returned HTTP ${response.status}`);
    const json = (await response.json()) as YahooChartResponse;
    if (json.chart?.error) throw new Error(json.chart.error.description ?? "Public feed error");

    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0] ?? {};
    const candles: PublicGoldCandle[] = [];
    for (let i = 0; i < timestamps.length; i += 1) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      const ts = timestamps[i];
      if (ts == null || o == null || h == null || l == null || c == null) continue;
      candles.push({ time: ts * 1000, open: o, high: h, low: l, close: c });
    }
    if (candles.length < 2) throw new Error("Public feed returned no usable candles");

    const feed: PublicGoldFeed = {
      symbol: "GC=F",
      source: "Yahoo Finance (public)",
      sourceUrl: "https://finance.yahoo.com/quote/GC=F",
      fetchedAt: Date.now(),
      candles: config.bucketHours ? bucketCandles(candles, config.bucketHours) : candles,
      note: "Free public feed · COMEX gold futures · may be delayed ~10 min · not for order execution",
    };
    cache.set(timeframe, { at: Date.now(), feed });
    return feed;
  });
