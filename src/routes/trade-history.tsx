import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { trades, tradeStats } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, PanelCard } from "@/components/auriq/primitives";

export const Route = createFileRoute("/trade-history")({
  head: () => ({
    meta: [
      { title: "Trade History · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Closed paper trades with win rate, profit factor, average win and loss, expectancy and export controls.",
      },
      { property: "og:title", content: "Trade History · AURIQ" },
      { property: "og:description", content: "Closed trades and performance statistics — demo data." },
    ],
  }),
  component: TradeHistory,
});

const SETUPS = ["All", "Trend continuation", "Breakout", "Mean reversion", "Pullback"] as const;
const RESULTS = ["All", "Winners", "Losers"] as const;

function TradeHistory() {
  const [setup, setSetup] = useState<(typeof SETUPS)[number]>("All");
  const [result, setResult] = useState<(typeof RESULTS)[number]>("All");

  const rows = useMemo(
    () =>
      trades.filter(
        (t) =>
          (setup === "All" || t.setup === setup) &&
          (result === "All" || (result === "Winners" ? t.pnl > 0 : t.pnl < 0)),
      ),
    [setup, result],
  );

  const exportNote = (format: string) =>
    toast(`${format} export is a prototype control`, {
      description: "The production build will stream a signed export from the backend API.",
    });

  return (
    <>
      <PageHeader
        title="Trade History"
        description="Closed paper trades with performance statistics. Export controls are prototype placeholders."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => exportNote("CSV")}>
              <Download className="size-3.5" aria-hidden /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportNote("Excel")}>
              <Download className="size-3.5" aria-hidden /> Excel
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Win rate" value={`${tradeStats.winRate}%`} delta={`${tradeStats.totalTrades} trades`} />
        <KpiCard label="Profit factor" value={num(tradeStats.profitFactor, 2)} delta="Target > 1.50" deltaTone="positive" />
        <KpiCard label="Average win" value={money(tradeStats.avgWin, 0)} deltaTone="positive" />
        <KpiCard label="Average loss" value={money(tradeStats.avgLoss, 0)} deltaTone="negative" />
        <KpiCard label="Expectancy" value={money(tradeStats.expectancy, 0)} delta="per trade" />
      </div>

      <PanelCard
        title={`Closed trades (${rows.length})`}
        action={
          <div className="flex flex-wrap gap-1">
            {RESULTS.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={result === r}
                onClick={() => setResult(r)}
                className={cn(
                  "rounded-sm border px-2 py-0.5 text-[11px] transition-colors",
                  result === r ? "border-primary/50 bg-primary/15 text-primary" : "border-border text-muted-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="flex flex-wrap gap-1 border-b border-border px-4 py-2" role="group" aria-label="Filter by setup">
          {SETUPS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={setup === s}
              onClick={() => setSetup(s)}
              className={cn(
                "rounded-sm border px-2 py-0.5 text-[11px] transition-colors",
                setup === s ? "border-info/50 bg-info/15 text-info" : "border-border text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">Closed trades — demo data</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">Closed</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Symbol</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Side</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Qty</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Entry</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Exit</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">P/L</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">R</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Setup</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-border/60 last:border-0">
                  <td className="num px-4 py-2.5">{t.closed}</td>
                  <th scope="row" className="num px-2 py-2.5 text-left font-medium">{t.symbol}</th>
                  <td className={cn("px-2 py-2.5 text-xs font-semibold", t.side === "LONG" ? "text-positive" : "text-negative")}>
                    {t.side}
                  </td>
                  <td className="num px-2 py-2.5 text-right">{t.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(t.entry, 2)}</td>
                  <td className="num px-2 py-2.5 text-right">{num(t.exit, 2)}</td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(t.pnl))}>{signedMoney(t.pnl, 0)}</td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(t.rMultiple))}>{t.rMultiple.toFixed(1)}R</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.setup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          Aggregate return on the filtered set: {pct(4.62)} (demo).
        </p>
      </PanelCard>
    </>
  );
}
