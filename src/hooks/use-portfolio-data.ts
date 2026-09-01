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
  source: "demo" | "supabase" | "mt5";
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

  const { data: mt5Account, error: mt5AccountError } = await client
    .from("mt5_accounts")
    .select("id, login, display_name, currency, status, last_sync_at")
    .eq("status", "connected")
    .order("last_sync_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (mt5AccountError) throw mt5AccountError;
  if (mt5Account) {
    const bangkokNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    bangkokNow.setHours(0, 0, 0, 0);
    const startUtc = new Date(bangkokNow.getTime() - 7 * 60 * 60 * 1000).toISOString();
    const [snapshotResult, positionsResult, dealsResult] = await Promise.all([
      client
        .from("account_snapshots")
        .select(
          "balance, equity, floating_pnl, drawdown_pct, margin, free_margin, margin_level, captured_at",
        )
        .eq("account_id", mt5Account.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("positions")
        .select(
          "id, symbol, side, volume, open_price, current_price, stop_loss, take_profit, profit",
        )
        .eq("account_id", mt5Account.id)
        .order("symbol"),
      client
        .from("deals")
        .select("profit, commission, swap")
        .eq("account_id", mt5Account.id)
        .gte("executed_at", startUtc),
    ]);
    if (snapshotResult.error) throw snapshotResult.error;
    if (positionsResult.error) throw positionsResult.error;
    if (dealsResult.error) throw dealsResult.error;

    const snapshot = snapshotResult.data;
    if (snapshot) {
      const todayPnl = (dealsResult.data ?? []).reduce(
        (sum, deal) => sum + deal.profit + deal.commission + deal.swap,
        0,
      );
      const equity = snapshot.equity;
      const floating = snapshot.floating_pnl;
      const margin = snapshot.margin ?? 0;
      return {
        source: "mt5",
        accountLabel: mt5Account.display_name,
        account: {
          accountId: `••••${mt5Account.login.slice(-4)}`,
          mode: "LIVE",
          netLiquidation: equity,
          availableCash: snapshot.free_margin ?? 0,
          todayPnl,
          todayPnlPct: equity ? (todayPnl / equity) * 100 : 0,
          unrealisedPnl: floating,
          unrealisedPnlPct: equity ? (floating / equity) * 100 : 0,
          marginUsed: margin,
          marginUsedPct: equity ? (margin / equity) * 100 : 0,
          drawdownPct: snapshot.drawdown_pct,
          drawdownValue: equity * (snapshot.drawdown_pct / 100),
          lastSync: timeInBangkok(snapshot.captured_at),
        },
        positions: (positionsResult.data ?? []).map((row) => {
          const basis = Math.abs(row.open_price * row.volume);
          return {
            id: String(row.id),
            symbol: row.symbol,
            name: "MT5 Spot / CFD",
            side: row.side === "SELL" ? "SHORT" : "LONG",
            qty: row.volume,
            avgPrice: row.open_price,
            lastPrice: row.current_price,
            unrealisedPnl: row.profit,
            pnlPct: basis ? (row.profit / basis) * 100 : 0,
            stopLoss: row.stop_loss,
            takeProfit: row.take_profit,
          };
        }),
        orders: [],
      };
    }
  }

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
