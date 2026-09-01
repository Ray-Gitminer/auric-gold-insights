import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface Mt5Deal {
  id: number;
  ticket: number;
  positionTicket: number | null;
  symbol: string;
  side: string;
  volume: number;
  price: number;
  netPnl: number;
  executedAt: string;
}

async function fetchDeals(): Promise<Mt5Deal[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  const { data: account, error: accountError } = await client
    .from("mt5_accounts")
    .select("id")
    .eq("status", "connected")
    .order("last_sync_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (accountError) throw accountError;
  if (!account) return [];
  const { data, error } = await client
    .from("deals")
    .select(
      "id, ticket, position_ticket, symbol, side, volume, price, profit, commission, swap, executed_at",
    )
    .eq("account_id", account.id)
    .order("executed_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    ticket: row.ticket,
    positionTicket: row.position_ticket,
    symbol: row.symbol,
    side: row.side,
    volume: row.volume,
    price: row.price,
    netPnl: row.profit + row.commission + row.swap,
    executedAt: row.executed_at,
  }));
}

export function useMt5Deals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mt5-deals", user?.id],
    queryFn: fetchDeals,
    enabled: Boolean(user),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
