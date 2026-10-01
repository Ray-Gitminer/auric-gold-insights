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

async function fetchCandles(timeframe: Timeframe): Promise<Candle[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  const { data: account, error: accountError } = await client
    .from("mt5_accounts")
    .select("id, last_sync_at")
    .eq("status", "connected")
    .order("last_sync_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return [];
  const lastSync = account.last_sync_at ? new Date(account.last_sync_at).getTime() : 0;
  if (!Number.isFinite(lastSync) || Date.now() - lastSync > 20_000) return [];

  const { data, error } = await client
    .from("mt5_candles")
    .select("open_time, open, high, low, close")
    .eq("account_id", account.id)
    .eq("symbol", "XAUUSD")
    .eq("timeframe", MT5_TIMEFRAME[timeframe])
    .order("open_time", { ascending: false })
    .limit(160);
  if (error?.code === "PGRST205") return [];
  if (error) throw error;
  return (data ?? []).reverse().map((row) => ({
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
}

export function useMt5Candles(timeframe: Timeframe) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mt5-candles", user?.id, timeframe],
    queryFn: () => fetchCandles(timeframe),
    enabled: Boolean(user),
    staleTime: 900,
    refetchInterval: 1_000,
  });
}
