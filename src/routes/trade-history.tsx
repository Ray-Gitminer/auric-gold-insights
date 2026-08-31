import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { trades, tradeStats } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader, PanelCard } from "@/components/auriq/primitives";
import { useI18n } from "@/contexts/I18nContext";

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
      {
        property: "og:description",
        content: "Closed trades and performance statistics — demo data.",
      },
    ],
  }),
  component: TradeHistory,
});

const SETUPS = ["All", "Trend continuation", "Breakout", "Mean reversion", "Pullback"] as const;
const RESULTS = ["All", "Winners", "Losers"] as const;

function TradeHistory() {
  const { t } = useI18n();
  const [setup, setSetup] = useState<(typeof SETUPS)[number]>("All");
  const [result, setResult] = useState<(typeof RESULTS)[number]>("All");

  const setupLabels: Record<(typeof SETUPS)[number], string> = {
    All: t("po.all"),
    "Trend continuation": t("th.setup.trend"),
    Breakout: t("th.setup.breakout"),
    "Mean reversion": t("th.setup.mean"),
    Pullback: t("th.setup.pullback"),
  };
  const resultLabels: Record<(typeof RESULTS)[number], string> = {
    All: t("po.all"),
    Winners: t("th.winners"),
    Losers: t("th.losers"),
  };

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
    toast(t("th.exportToast", { format }), {
      description: t("th.exportDesc"),
    });

  return (
    <>
      <PageHeader
        title={t("th.title")}
        description={t("th.desc")}
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
        <KpiCard
          label={t("th.winRate")}
          value={`${tradeStats.winRate}%`}
          delta={t("th.trades", { n: tradeStats.totalTrades })}
        />
        <KpiCard
          label={t("th.profitFactor")}
          value={num(tradeStats.profitFactor, 2)}
          delta={t("th.target")}
          deltaTone="positive"
        />
        <KpiCard label={t("th.avgWin")} value={money(tradeStats.avgWin, 0)} deltaTone="positive" />
        <KpiCard
          label={t("th.avgLoss")}
          value={money(tradeStats.avgLoss, 0)}
          deltaTone="negative"
        />
        <KpiCard
          label={t("th.expectancy")}
          value={money(tradeStats.expectancy, 0)}
          delta={t("th.perTrade")}
        />
      </div>

      <PanelCard
        title={`${t("th.closedTrades")} (${rows.length})`}
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
                  result === r
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {resultLabels[r]}
              </button>
            ))}
          </div>
        }
        bodyClassName="p-0"
      >
        <div
          className="flex flex-wrap gap-1 border-b border-border px-4 py-2"
          role="group"
          aria-label={t("th.filterSetup")}
        >
          {SETUPS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={setup === s}
              onClick={() => setSetup(s)}
              className={cn(
                "rounded-sm border px-2 py-0.5 text-[11px] transition-colors",
                setup === s
                  ? "border-info/50 bg-info/15 text-info"
                  : "border-border text-muted-foreground",
              )}
            >
              {setupLabels[s]}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">{t("th.caption")}</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  {t("th.closed")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("common.symbol")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("common.side")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.qty")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("th.entry")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("th.exit")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("th.pl")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("th.r")}
                </th>
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  {t("common.setup")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tr) => (
                <tr key={tr.id} className="border-b border-border/60 last:border-0">
                  <td className="num px-4 py-2.5">{tr.closed}</td>
                  <th scope="row" className="num px-2 py-2.5 text-left font-medium">
                    {tr.symbol}
                  </th>
                  <td
                    className={cn(
                      "px-2 py-2.5 text-xs font-semibold",
                      tr.side === "LONG" ? "text-positive" : "text-negative",
                    )}
                  >
                    {tr.side}
                  </td>
                  <td className="num px-2 py-2.5 text-right">{tr.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(tr.entry, 2)}</td>
                  <td className="num px-2 py-2.5 text-right">{num(tr.exit, 2)}</td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(tr.pnl))}>
                    {signedMoney(tr.pnl, 0)}
                  </td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(tr.rMultiple))}>
                    {tr.rMultiple.toFixed(1)}R
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{tr.setup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          {t("th.aggregate", { value: pct(4.62) })}
        </p>
      </PanelCard>
    </>
  );
}
