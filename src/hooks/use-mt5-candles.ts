import { useQuery } from "@tanstack/react-query";

import type { Candle } from "@/data/fixtures";
import type { Timeframe } from "@/components/auriq/GoldChart";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MT5_TIMEFRAME: Record<Timeframe, string> = {
  "5m": "M5",
  "15m": "M15",
  "1h": "H1",
  "4h": "H4",
  "1D": "D1",
};

export type Mt5CandleFeed = { candles: Candle[]; lastSyncAt: number | null };

export const MT5_LIVE_WINDOW_MS = 20_000;

export function isMt5Fresh(feed: Mt5CandleFeed | undefined, now = Date.now()) {
  return Boolean(feed?.lastSyncAt && now - feed.lastSyncAt <= MT5_LIVE_WINDOW_MS);
}

async function fetchCandles(timeframe: Timeframe): Promise<Mt5CandleFeed> {
  const client = getSupabaseBrowserClient();
  if (!client) return { candles: [], lastSyncAt: null };
  const { data: account, error: accountError } = await client
    .from("mt5_accounts")
    .select("id, last_sync_at")
    .eq("status", "connected")
    .order("last_sync_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return { candles: [], lastSyncAt: null };
  const parsed = account.last_sync_at ? new Date(account.last_sync_at).getTime() : NaN;
  const lastSyncAt = Number.isFinite(parsed) ? parsed : null;

  const { data, error } = await client
    .from("mt5_candles")
    .select("open_time, open, high, low, close")
    .eq("account_id", account.id)
    .eq("symbol", "XAUUSD")
    .eq("timeframe", MT5_TIMEFRAME[timeframe])
    .order("open_time", { ascending: false })
    .limit(160);
  if (error?.code === "PGRST205") return { candles: [], lastSyncAt };
  if (error) throw error;
  const candles = (data ?? []).reverse().map((row) => ({
    t: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(row.open_time)),
    o: row.open,
    h: row.high,
    l: row.low,
    c: row.close,
    v: 0,
  }));
  return { candles, lastSyncAt };
}

export function useMt5Candles(timeframe: Timeframe) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mt5-candles", user?.id, timeframe],
    queryFn: () => fetchCandles(timeframe),
    enabled: Boolean(user),
    staleTime: 900,
    placeholderData: (previous) => previous,
    refetchInterval: 1_000,
  });
}
