import { useQuery } from "@tanstack/react-query";

import type { Candle } from "@/data/fixtures";
import type { Timeframe } from "@/components/auriq/GoldChart";
import { fetchPublicGold, type PublicGoldFeed } from "@/lib/market/public-gold.functions";

export type PublicGoldData = {
  candles: Candle[];
  feed: PublicGoldFeed | null;
};

function toChartCandles(feed: PublicGoldFeed, timeframe: Timeframe): Candle[] {
  const withDate = timeframe === "1D" || timeframe === "4h";
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(withDate ? { day: "2-digit", month: "short" } : {}),
  });
  return feed.candles.map((row) => ({
    t: fmt.format(new Date(row.time)),
    o: row.open,
    h: row.high,
    l: row.low,
    c: row.close,
    v: 0,
  }));
}

export function usePublicGold(timeframe: Timeframe) {
  return useQuery<PublicGoldData>({
    queryKey: ["public-gold", timeframe],
    queryFn: async () => {
      const feed = await fetchPublicGold({ data: { timeframe } });
      return { candles: toChartCandles(feed, timeframe), feed };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}
