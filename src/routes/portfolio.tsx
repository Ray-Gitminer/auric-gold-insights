import { createFileRoute } from "@tanstack/react-router";

import { account, allocation, performance, performanceSummary, positions, risk } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KpiCard, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Portfolio allocation, exposure, margin usage, risk limits and daily, weekly and monthly performance for the AURIQ paper account.",
      },
      { property: "og:title", content: "Portfolio · AURIQ" },
      { property: "og:description", content: "Allocation, exposure, margin and performance — demo data." },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const maxPnl = Math.max(...performance.map((p) => Math.abs(p.pnl)));

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Allocation, exposure, margin usage and performance across the paper-trading account."
        actions={<StatusBadge tone="gold">Paper account {account.accountId}</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Net liquidation" value={money(account.netLiquidation)} delta={pct(1.25)} deltaTone="positive" freshness="vs yesterday" />
        <KpiCard label="Gross exposure" value={money(risk.exposure)} delta={`${risk.exposurePct}% of NLV`} deltaTone="neutral" />
        <KpiCard label="Margin headroom" value={money(risk.marginHeadroom)} delta="Comfortable" deltaTone="positive" />
        <KpiCard label="Drawdown (MTD)" value={pct(account.drawdownPct)} delta={signedMoney(account.drawdownValue)} deltaTone="negative" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Allocation" subtitle="By instrument group">
          <ul className="space-y-3">
            {allocation.map((a) => (
              <li key={a.name}>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate">{a.name}</span>
                  <span className="num shrink-0 text-muted-foreground">
                    {money(a.amount, 0)} · {a.value}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-accent">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${a.value}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Performance" subtitle="Rolling week, demo series">
          <div className="grid grid-cols-3 gap-3">
            {performanceSummary.map((p) => (
              <div key={p.label} className="rounded-sm border border-border bg-surface/60 p-3">
                <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{p.label}</p>
                <p className={cn("num mt-1 text-sm font-semibold", toneFor(p.value))}>{signedMoney(p.value, 0)}</p>
                <p className={cn("num text-[11px]", toneFor(p.pct))}>{pct(p.pct)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-32 items-end gap-3">
            {performance.map((p) => (
              <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
                <span className={cn("num text-[10px]", toneFor(p.pnl))}>{p.pnl}</span>
                <div
                  className={cn("w-full rounded-sm", p.pnl >= 0 ? "bg-positive/70" : "bg-negative/70")}
                  style={{ height: `${(Math.abs(p.pnl) / maxPnl) * 88}px` }}
                />
                <span className="text-[11px] text-muted-foreground">{p.period}</span>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>

      <PanelCard title="Exposure by position" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Exposure by position — demo data</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">Instrument</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Side</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Qty</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Avg price</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Last</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Unrealised</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">P/L %</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    <span className="num">{p.symbol}</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">{p.name}</span>
                  </th>
                  <td className={cn("px-2 py-2.5 text-xs font-semibold", p.side === "LONG" ? "text-positive" : "text-negative")}>
                    {p.side}
                  </td>
                  <td className="num px-2 py-2.5 text-right">{p.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(p.avgPrice, 3)}</td>
                  <td className="num px-2 py-2.5 text-right">{num(p.lastPrice, 3)}</td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(p.unrealisedPnl))}>
                    {signedMoney(p.unrealisedPnl, 0)}
                  </td>
                  <td className={cn("num px-4 py-2.5 text-right", toneFor(p.pnlPct))}>{pct(p.pnlPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title="Risk limits">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Daily loss limit", value: money(risk.dailyLossLimit, 0), sub: `${money(risk.dailyLossUsed, 0)} used` },
            { label: "VaR (1D, 95%)", value: money(risk.var1d, 0), sub: "Historical simulation" },
            { label: "Max position risk", value: `${risk.maxPositionRisk}%`, sub: "Limit 2.00%" },
            { label: "Margin used", value: money(account.marginUsed, 0), sub: `${account.marginUsedPct}% of NLV` },
          ].map((r) => (
            <div key={r.label} className="rounded-sm border border-border bg-surface/60 p-3">
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{r.label}</dt>
              <dd className="num mt-1 text-sm font-semibold">{r.value}</dd>
              <dd className="text-[11px] text-muted-foreground">{r.sub}</dd>
            </div>
          ))}
        </dl>
      </PanelCard>
    </>
  );
}
