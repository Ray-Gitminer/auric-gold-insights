import { useQuery } from "@tanstack/react-query";

import {
  account as demoAccount,
  orders as demoOrders,
  positions as demoPositions,
  type AccountSnapshot,
  type Order,
  type Position,
} from "@/data/fixtures";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PortfolioData = {
  source: "demo" | "supabase";
  account: AccountSnapshot;
  positions: Position[];
  orders: Order[];
  accountLabel: string;
};

const demoData: PortfolioData = {
  source: "demo",
  account: demoAccount,
  positions: demoPositions,
  orders: demoOrders,
  accountLabel: "Demo portfolio",
};

const allowedOrderTypes: Order["type"][] = ["LIMIT", "STOP", "STOP LIMIT", "MARKET"];
const allowedOrderStatuses: Order["status"][] = [
  "Working",
  "Submitted",
  "PreSubmitted",
  "Cancelled",
  "Filled",
];

function normaliseOrderType(value: string): Order["type"] {
  const type = value.trim().toUpperCase().replaceAll("_", " ") as Order["type"];
  return allowedOrderTypes.includes(type) ? type : "MARKET";
}

function normaliseOrderStatus(value: string): Order["status"] {
  const match = allowedOrderStatuses.find(
    (status) => status.toLowerCase() === value.trim().toLowerCase(),
  );
  return match ?? "Submitted";
}

function timeInBangkok(timestamp: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

async function fetchPortfolioData(): Promise<PortfolioData> {
  const client = getSupabaseBrowserClient();
  if (!client) return demoData;

  const { data: brokerAccount, error: accountError } = await client
    .from("broker_accounts")
    .select("id, broker_account_id, display_name, account_type")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (accountError) throw accountError;
  if (!brokerAccount) return demoData;

  const [snapshotResult, positionsResult, ordersResult] = await Promise.all([
    client
      .from("portfolio_snapshots")
      .select(
        "net_liquidation, cash_balance, realized_pnl, unrealized_pnl, margin_used, drawdown_pct, source_timestamp",
      )
      .eq("account_id", brokerAccount.id)
      .order("source_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("ibkr_positions")
      .select("id, symbol, asset_class, quantity, average_cost, market_price, unrealized_pnl")
      .eq("account_id", brokerAccount.id)
      .order("symbol"),
    client
      .from("ibkr_orders")
      .select(
        "id, symbol, side, order_type, quantity, limit_price, stop_price, status, submitted_at, source_timestamp",
      )
      .eq("account_id", brokerAccount.id)
      .order("source_timestamp", { ascending: false }),
  ]);

  if (snapshotResult.error) throw snapshotResult.error;
  if (positionsResult.error) throw positionsResult.error;
  if (ordersResult.error) throw ordersResult.error;

  const snapshot = snapshotResult.data;
  if (!snapshot) return demoData;

  const netLiquidation = snapshot.net_liquidation ?? 0;
  const todayPnl = snapshot.realized_pnl ?? 0;
  const unrealisedPnl = snapshot.unrealized_pnl ?? 0;
  const marginUsed = snapshot.margin_used ?? 0;
  const drawdownPct = snapshot.drawdown_pct ?? 0;

  const account: AccountSnapshot = {
    accountId: brokerAccount.broker_account_id,
    mode: brokerAccount.account_type.toUpperCase() === "LIVE" ? "LIVE" : "PAPER",
    netLiquidation,
    availableCash: snapshot.cash_balance ?? 0,
    todayPnl,
    todayPnlPct: netLiquidation ? (todayPnl / netLiquidation) * 100 : 0,
    unrealisedPnl,
    unrealisedPnlPct: netLiquidation ? (unrealisedPnl / netLiquidation) * 100 : 0,
    marginUsed,
    marginUsedPct: netLiquidation ? (marginUsed / netLiquidation) * 100 : 0,
    drawdownPct,
    drawdownValue: (netLiquidation * drawdownPct) / 100,
    lastSync: timeInBangkok(snapshot.source_timestamp),
  };

  const positions: Position[] = (positionsResult.data ?? []).map((row) => {
    const avgPrice = row.average_cost ?? 0;
    const unrealised = row.unrealized_pnl ?? 0;
    const costBasis = Math.abs(avgPrice * row.quantity);
    return {
      id: row.id,
      symbol: row.symbol,
      name: row.asset_class,
      side: row.quantity < 0 ? "SHORT" : "LONG",
      qty: Math.abs(row.quantity),
      avgPrice,
      lastPrice: row.market_price ?? 0,
      unrealisedPnl: unrealised,
      pnlPct: costBasis ? (unrealised / costBasis) * 100 : 0,
      stopLoss: null,
      takeProfit: null,
    };
  });

  const orders: Order[] = (ordersResult.data ?? []).map((row) => ({
    id: row.id,
    symbol: row.symbol,
    side: row.side.toUpperCase() === "SELL" ? "SELL" : "BUY",
    type: normaliseOrderType(row.order_type),
    qty: Math.abs(row.quantity),
    price: row.limit_price ?? row.stop_price ?? 0,
    status: normaliseOrderStatus(row.status),
    submitted: timeInBangkok(row.submitted_at ?? row.source_timestamp),
  }));

  return {
    source: "supabase",
    account,
    positions,
    orders,
    accountLabel: brokerAccount.display_name ?? brokerAccount.broker_account_id,
  };
}

export function usePortfolioData() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["portfolio-overview", user?.id],
    queryFn: fetchPortfolioData,
    enabled: Boolean(user),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return {
    data: query.data ?? demoData,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
