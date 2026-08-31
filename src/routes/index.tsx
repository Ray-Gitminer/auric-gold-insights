import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CircleDollarSign,
  Gauge,
  Info,
  Landmark,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  account,
  alerts,
  bias,
  impact,
  instrument,
  journal,
  orders,
  positions,
  risk,
  strategy,
} from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { useI18n } from "@/contexts/I18nContext";
import { useEconomicCalendar } from "@/hooks/use-economic-calendar";
import {
  ActualBadge,
  ForecastBadge,
  ImpactDots,
  SurprisePill,
} from "@/components/auriq/CalendarBadges";
import {
  AdvisoryTag,
  DemoDataTag,
  KpiCard,
  PageHeader,
  PanelCard,
  StaleState,
  StatusBadge,
} from "@/components/auriq/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Paper-trading overview: account KPIs, gold market workspace, AI advisory rail, positions, orders and risk monitoring.",
      },
      { property: "og:title", content: "Overview · AURIQ Gold Trading Intelligence" },
      {
        property: "og:description",
        content: "Account KPIs, gold chart workspace, AI advisory rail and risk monitor — demo data.",
      },
    ],
  }),
  component: Overview,
});

const setupTone: Record<string, "gold" | "positive" | "negative" | "info"> = {
  WAITING: "gold",
  VALID: "positive",
  INVALID: "negative",
  TRIGGERED: "info",
};

function Overview() {
  const { t, tx } = useI18n();
  const { impact: goldImpact, isLoading: newsLoading } = useNewsIntelligence();

  const [timeframe, setTimeframe] = useState<Timeframe>("1D");

  return (
    <>
      <PageHeader
        title={t("overview.title")}
        description={t("overview.desc")}
        actions={
          <>
            <StatusBadge tone="positive">{t("overview.feedLive")}</StatusBadge>
            <StatusBadge tone="neutral">{t("common.timezone")}</StatusBadge>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label={t("kpi.netLiquidation")}
          value={money(account.netLiquidation)}
          delta={pct(1.25)}
          deltaTone="positive"
          freshness={t("kpi.vsYesterday")}
          icon={<CircleDollarSign className="size-3.5" />}
        />
        <KpiCard
          label={t("kpi.availableCash")}
          value={money(account.availableCash)}
          delta={pct(0.68)}
          deltaTone="positive"
          freshness={t("kpi.settled")}
          icon={<Wallet className="size-3.5" />}
        />
        <KpiCard
          label={t("kpi.todayPnl")}
          value={signedMoney(account.todayPnl)}
          delta={pct(account.todayPnlPct)}
          deltaTone="positive"
          freshness={t("kpi.asOf", { time: account.lastSync })}
          icon={<TrendingUp className="size-3.5" />}
        />
        <KpiCard
          label={t("kpi.unrealisedPnl")}
          value={signedMoney(account.unrealisedPnl)}
          delta={pct(account.unrealisedPnlPct)}
          deltaTone="positive"
          freshness={t("kpi.openPositions", { count: 4 })}
          icon={<Gauge className="size-3.5" />}
        />
        <KpiCard
          label={t("kpi.marginUsed")}
          value={money(account.marginUsed)}
          delta={t("kpi.ofNlv", { pct: account.marginUsedPct })}
          deltaTone="neutral"
          freshness={t("kpi.withinLimits")}
          icon={<Landmark className="size-3.5" />}
        />
        <KpiCard
          label={t("kpi.drawdown")}
          value={pct(account.drawdownPct)}
          delta={signedMoney(account.drawdownValue)}
          deltaTone="negative"
          freshness={t("kpi.limit", { value: "-1.00%" })}
          icon={<ShieldAlert className="size-3.5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Market workspace */}
        <div className="flex flex-col gap-4">
          <section className="min-w-0 max-w-full overflow-hidden rounded-md border border-border bg-card">
            <div className="flex min-w-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold break-words">{instrument.label}</h2>
                  <DemoDataTag />
                </div>
                <p className="num mt-1 text-xs text-muted-foreground">
                  {instrument.exchange} · {timeframe}
                </p>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:shrink-0">
                <div className="text-left sm:text-right">
                  <p className="num text-lg font-semibold">{num(instrument.last, 1)}</p>
                  <p className={cn("num text-xs", toneFor(instrument.change))}>
                    {instrument.change > 0 ? "+" : ""}
                    {num(instrument.change, 1)} ({pct(instrument.changePct)})
                  </p>
                </div>
                <dl className="num hidden gap-x-4 text-xs text-muted-foreground sm:grid sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] uppercase">{t("common.high")}</dt>
                    <dd className="text-foreground">{num(instrument.high, 1)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase">{t("common.low")}</dt>
                    <dd className="text-foreground">{num(instrument.low, 1)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase">{t("common.vol")}</dt>
                    <dd className="text-foreground">{instrument.volume}</dd>
                  </div>
                </dl>
                <StatusBadge tone={setupTone[strategy.state] ?? "neutral"}>
                  {t("overview.setup")}: {strategy.state}
                </StatusBadge>
              </div>
            </div>
            <GoldChart timeframe={timeframe} onTimeframeChange={setTimeframe} />
            <div className="border-t border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wide uppercase">
                  {t("overview.strategyConditions")} · {tx(strategy.name)}
                </h3>
                <Link to="/chart-strategy" className="text-xs text-info hover:underline">
                  {t("overview.openChartStrategy")}
                </Link>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {strategy.conditions.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-start gap-2 rounded-sm border border-border bg-surface/60 px-3 py-2"
                  >
                    <span
                      className={cn(
                        "mt-1 size-1.5 shrink-0 rounded-full",
                        c.pass ? "bg-positive" : "bg-negative",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-xs leading-snug font-medium">{tx(c.label)}</p>
                      <p className="num text-[11px] leading-snug text-muted-foreground">{tx(c.detail)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <PanelCard
              title={`${t("overview.openPositions")} (${positions.length})`}
              action={
                <Link to="/positions-orders" className="text-xs text-info hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <caption className="sr-only">{t("overview.positionsCaption")}</caption>
                  <thead>
                    <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                      <th scope="col" className="px-4 py-2 text-left font-medium">{t("common.symbol")}</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.qty")}</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.avg")}</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.last")}</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.unrlzd")}</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">{t("common.plPct")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0">
                        <th scope="row" className="num px-4 py-2 text-left font-medium">
                          {p.symbol}
                        </th>
                        <td className="num px-2 py-2 text-right">{p.qty}</td>
                        <td className="num px-2 py-2 text-right">{num(p.avgPrice, 3)}</td>
                        <td className="num px-2 py-2 text-right">{num(p.lastPrice, 3)}</td>
                        <td className={cn("num px-2 py-2 text-right", toneFor(p.unrealisedPnl))}>
                          {signedMoney(p.unrealisedPnl, 0)}
                        </td>
                        <td className={cn("num px-4 py-2 text-right", toneFor(p.pnlPct))}>
                          {pct(p.pnlPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>

            <PanelCard
              title={`${t("overview.openOrders")} (${orders.length})`}
              action={
                <Link to="/positions-orders" className="text-xs text-info hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <caption className="sr-only">{t("overview.ordersCaption")}</caption>
                  <thead>
                    <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                      <th scope="col" className="px-4 py-2 text-left font-medium">{t("common.symbol")}</th>
                      <th scope="col" className="px-2 py-2 text-left font-medium">{t("common.side")}</th>
                      <th scope="col" className="px-2 py-2 text-left font-medium">{t("common.type")}</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.qty")}</th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.price")}</th>
                      <th scope="col" className="px-4 py-2 text-right font-medium">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-border/60 last:border-0">
                        <th scope="row" className="num px-4 py-2 text-left font-medium">
                          {o.symbol}
                        </th>
                        <td className={cn("px-2 py-2 text-xs font-semibold", o.side === "BUY" ? "text-positive" : "text-negative")}>
                          {o.side}
                        </td>
                        <td className="px-2 py-2 text-xs text-info">{o.type}</td>
                        <td className="num px-2 py-2 text-right">{o.qty}</td>
                        <td className="num px-2 py-2 text-right">{num(o.price, 2)}</td>
                        <td className="px-4 py-2 text-right text-xs text-info">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <EconomicCalendarPanel />

            <PanelCard
              title={t("overview.journalLatest")}
              action={
                <Link to="/journal" className="text-xs text-info hover:underline">
                  {t("overview.fullJournal")}
                </Link>
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {journal.slice(0, 3).map((j) => (
                  <li key={j.id} className="flex gap-3 px-4 py-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-sm border border-border bg-surface text-muted-foreground">
                      <BookOpen className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tx(j.title)}</p>
                      <p className="truncate text-xs text-muted-foreground">{tx(j.thesis)}</p>
                      <p className="num mt-1 text-[11px] text-muted-foreground">
                        {tx(j.setup)} · {tx(j.emotion)} · {t("overview.discipline")} {j.disciplineScore}/10
                      </p>
                    </div>
                    <span className="num shrink-0 text-[11px] text-muted-foreground">
                      {j.date} {j.time}
                    </span>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>

          <PanelCard
            title={t("overview.alertsHealth")}
            action={
              <Link to="/alerts" className="inline-flex items-center gap-1 text-xs text-info hover:underline">
                {t("overview.viewAllAlerts")} <ArrowRight className="size-3" aria-hidden />
              </Link>
            }
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    {a.severity === "info" ? (
                      <Info className="size-3.5 shrink-0 text-info" aria-hidden />
                    ) : (
                      <Bell
                        className={cn("size-3.5 shrink-0", a.severity === "risk" ? "text-negative" : "text-primary")}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm",
                        a.severity === "risk" && "text-negative",
                        a.severity === "warning" && "text-primary",
                        a.severity === "info" && "text-info",
                      )}
                    >
                      {tx(a.message)}
                    </span>
                  </div>
                  <span className="num shrink-0 text-[11px] text-muted-foreground">
                    {a.time} · {a.date}
                  </span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>

        {/* Intelligence rail */}
        <aside className="flex flex-col gap-4" aria-label={t("overview.rail")}>
          <PanelCard title={t("overview.impactScore")} subtitle={t("overview.impactRange")}>
            <AdvisoryTag />
            <div className="mt-3 flex items-center gap-4">
              <div className="num grid size-20 shrink-0 place-items-center rounded-full border-4 border-primary/70 text-xl font-semibold text-primary">
                {goldImpact.score > 0 ? "+" : ""}
                {goldImpact.score}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary">{tx(goldImpact.band)}</p>
                <p className="num text-xs text-muted-foreground">
                  {goldImpact.newsCount} {t("news.title")} · {goldImpact.eventCount} {t("ec.title")}
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {goldImpact.drivers.map((d) => (
                <li key={d.label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground" title={d.label}>
                    {d.kind === "calendar" ? "📅 " : ""}
                    {d.label}
                  </span>
                  <span className={cn("num shrink-0", toneFor(d.weight))}>
                    {d.weight > 0 ? "+" : ""}
                    {d.weight}
                  </span>
                </li>
              ))}
              {goldImpact.drivers.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  {newsLoading ? t("common.loading") : t("news.empty")}
                </li>
              )}
            </ul>
          </PanelCard>


          <PanelCard title={t("overview.marketBias")} subtitle={t("overview.biasSubtitle")}>
            <AdvisoryTag />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge tone={bias.direction === "Bullish" ? "positive" : bias.direction === "Bearish" ? "negative" : "neutral"}>
                {tx(bias.direction)}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                {t("common.confidence")} <span className="text-foreground">{tx(bias.confidence)}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {t("common.horizon")} <span className="text-foreground">{tx(bias.horizon)}</span>
              </span>
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="font-medium text-foreground">{t("overview.rationale")}</dt>
                <dd className="text-muted-foreground">{tx(bias.rationale)}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">{t("overview.counterEvidence")}</dt>
                <dd className="text-muted-foreground">{tx(bias.counterEvidence)}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">{t("overview.invalidation")}</dt>
                <dd className="text-negative">{tx(bias.invalidation)}</dd>
              </div>
            </dl>
          </PanelCard>

          <PanelCard title={t("overview.riskMonitor")}>
            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("risk.exposure")}</dt>
                <dd className="num">
                  {money(risk.exposure, 0)} <span className="text-muted-foreground">({risk.exposurePct}%)</span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("risk.marginHeadroom")}</dt>
                <dd className="num">{money(risk.marginHeadroom, 0)}</dd>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">{t("risk.dailyLossUsed")}</dt>
                  <dd className="num">
                    {money(risk.dailyLossUsed, 0)} / {money(risk.dailyLossLimit, 0)}
                  </dd>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(risk.dailyLossUsed / risk.dailyLossLimit) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("risk.var")}</dt>
                <dd className="num">{money(risk.var1d, 0)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("risk.maxPositionRisk")}</dt>
                <dd className="num">{risk.maxPositionRisk}%</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("risk.freshness")}</dt>
                <dd className="num text-positive">{t("risk.secondsAgo", { n: risk.connectionAgeSeconds })}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">{t("risk.status")}</dt>
                <dd className="text-positive">{tx(risk.status)}</dd>
              </div>
            </dl>
          </PanelCard>

          <div className="rounded-md border border-primary/40 bg-primary/8 p-3">
            <p className="text-xs font-semibold tracking-[0.1em] text-primary uppercase">
              {t("overview.aiOnly")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("overview.aiOnlyBody")}
            </p>
          </div>

          <StaleState age={t("overview.staleAge")} />
        </aside>
      </div>
    </>
  );
}

function EconomicCalendarPanel() {
  const { t } = useI18n();
  const { events, isLoading, isError, refetch } = useEconomicCalendar();
  const rows = events.slice(0, 6);

  return (
    <PanelCard
      title={t("overview.events")}
      subtitle={t("ec.dashSubtitle")}
      action={
        <Link to="/economic-calendar" className="inline-flex items-center gap-1 text-xs text-info hover:underline">
          {t("ec.openFull")} <ArrowRight className="size-3" aria-hidden />
        </Link>
      }
      bodyClassName="p-0"
    >
      {isLoading ? (
        <p className="p-4 text-sm text-muted-foreground">{t("ec.loading")}</p>
      ) : isError ? (
        <div className="p-4">
          <p className="text-sm text-negative">{t("ec.unavailable")}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-2 rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs"
          >
            {t("ec.retry")}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">{t("ec.caption")}</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">{t("common.time")}</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">{t("common.event")}</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">{t("common.impact")}</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">{t("common.actual")}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{t("common.forecast")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ release, forecast, assessment }) => (
                <tr key={release.releaseId} className="border-b border-border/60 last:border-0">
                  <td className="num px-4 py-2 align-top">{release.time}</td>
                  <td className="px-2 py-2 align-top">{release.event}</td>
                  <td className="px-2 py-2 align-top">
                    <ImpactDots impact={release.impact} />
                  </td>
                  <td className="px-2 py-2 text-right align-top">
                    {release.actualValue == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            "num",
                            assessment?.goldBias === "bullish" && "text-positive",
                            assessment?.goldBias === "bearish" && "text-negative",
                          )}
                        >
                          {release.actual}
                        </span>
                        <ActualBadge source={release.actualSource} />
                        {assessment ? <SurprisePill assessment={assessment} /> : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right align-top">
                    <div className="flex flex-col items-end gap-1">
                      <span className="num">{forecast.value}</span>
                      <ForecastBadge forecast={forecast} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        {t("ec.pollNote")}
      </p>
    </PanelCard>
  );
}
