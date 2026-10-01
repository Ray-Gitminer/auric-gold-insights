import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity, ArrowDown, ArrowRight, ArrowUp, BarChart3, CalendarClock,
  CircleAlert, Database, LineChart, Radio, RefreshCw, ShieldCheck, Target,
} from "lucide-react";

import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { TrendChart } from "@/components/auriq/TrendChart";
import { Button } from "@/components/ui/button";
import { useEconomicCalendar } from "@/hooks/use-economic-calendar";
import { useMt5Candles } from "@/hooks/use-mt5-candles";
import { useI18n } from "@/contexts/I18nContext";
import { computeFormulaSignal, type Direction } from "@/lib/signals/engine";
import { eventLabel } from "@/locales/economic-events-th";
import { cn } from "@/lib/utils";
import { num } from "@/lib/format";
import type { CalendarEvent } from "@/lib/economic-calendar/types";

export const Route = createFileRoute("/signals")({
  head: () => ({
    meta: [
      { title: "Signals · AURIQ Gold Insights" },
      { name: "description", content: "Official economic context and live MT5 XAUUSD confirmation in the AURIQ Signals workspace." },
      { property: "og:title", content: "Signals · AURIQ Gold Insights" },
      { property: "og:description", content: "Official economic releases, historical trends and live XAUUSD confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignalsPage,
});

const TIMEFRAMES: { label: string; value: Timeframe }[] = [
  { label: "M5", value: "5m" },
  { label: "M15", value: "15m" },
  { label: "H1", value: "1h" },
  { label: "H4", value: "4h" },
  { label: "D1", value: "1D" },
];

function bangkok(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", ...options }).format(new Date(iso));
}

function formatValue(value: number | null, unit: string) {
  if (value == null) return "—";
  const shown = Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  return `${shown}${unit === "%" || unit === "K" ? unit : ""}`;
}

function DirectionLabel({ direction }: { direction: Direction }) {
  const Icon = direction === "Bullish" ? ArrowUp : direction === "Bearish" ? ArrowDown : ArrowRight;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", direction === "Bullish" ? "text-positive" : direction === "Bearish" ? "text-negative" : "text-warning")}>
      <Icon className="size-4" />{direction}
    </span>
  );
}

function SignalPanel({ title, icon, children, className }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("auric-glass min-w-0 overflow-hidden rounded-lg p-3", className)}>
      <header className="mb-3 flex items-center gap-2 border-b border-border/60 pb-2">
        <span className="auric-icon grid size-8 shrink-0 place-items-center rounded-md text-primary">{icon}</span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function EventRow({ event, lang }: { event: CalendarEvent; lang: "th" | "en" }) {
  const release = event.release;
  const bias = event.assessment?.goldBias;
  const tone = release.impact === "High" ? "border-negative/60" : release.impact === "Medium" ? "border-warning/60" : "border-primary/55";
  return (
    <article className={cn("rounded-md border bg-background/35 p-2.5 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-info)_8%,transparent)]", tone)}>
      <div className="flex min-w-0 items-start gap-2">
        <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", release.impact === "High" ? "bg-negative shadow-[0_0_10px_var(--color-negative)]" : release.impact === "Medium" ? "bg-warning shadow-[0_0_10px_var(--color-warning)]" : "bg-primary")} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xs font-semibold">{eventLabel(release.event, lang)}</h3>
          <p className="num mt-0.5 text-[10px] text-info">{bangkok(release.nextReleaseUtc, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })} BKK · {release.agency}</p>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">{release.impact}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {[
          [lang === "th" ? "ค่าจริง" : "Actual", formatValue(release.actualValue, release.unit)],
          [lang === "th" ? "คาดการณ์" : "Forecast", event.consensus?.value ?? "—"],
          [lang === "th" ? "ก่อนหน้า" : "Previous", formatValue(release.previousValue, release.unit)],
        ].map(([label, value]) => <div key={label} className="rounded border border-border/60 bg-background/45 px-1 py-1"><p className="text-[9px] text-muted-foreground">{label}</p><p className="num truncate text-[11px] font-semibold">{value}</p></div>)}
      </div>
      {bias ? <p className={cn("mt-2 text-[10px] font-semibold", bias === "bullish" ? "text-positive" : bias === "bearish" ? "text-negative" : "text-warning")}>{bias === "bullish" ? "↑ Gold bullish" : bias === "bearish" ? "↓ Gold bearish" : "→ Gold neutral"}</p> : null}
    </article>
  );
}

function SignalsPage() {
  const { t, lang } = useI18n();
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const calendar = useEconomicCalendar();
  const candles = useMt5Candles(timeframe);
  const chartLive = Boolean(candles.data && candles.data.length > 29);
  const signal = useMemo(() => chartLive && candles.data ? computeFormulaSignal(candles.data) : null, [chartLive, candles.data]);
  const now = Date.now();
  const economicEvents = useMemo(() => calendar.events
    .filter((event) => event.release.currency === "USD" || !event.release.currency)
    .sort((a, b) => a.release.nextReleaseUtc.localeCompare(b.release.nextReleaseUtc)), [calendar.events]);
  const upcoming = economicEvents.filter((event) => new Date(event.release.nextReleaseUtc).getTime() >= now).slice(0, 6);
  const assessed = economicEvents.filter((event) => event.assessment).slice(-12);
  const macroScore = assessed.reduce((score, event) => score + (event.assessment?.goldBias === "bullish" ? 1 : event.assessment?.goldBias === "bearish" ? -1 : 0), 0);
  const macroDirection: Direction = macroScore > 0 ? "Bullish" : macroScore < 0 ? "Bearish" : "Neutral";
  const selectedTrend = economicEvents.find((event) => event.release.history.length > 1) ?? null;
  const nextHigh = upcoming.find((event) => event.release.impact === "High") ?? upcoming[0] ?? null;

  return (
    <div className="relative min-h-[calc(100vh-68px)] overflow-hidden px-3 py-4 sm:px-5 xl:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_8%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_30%),radial-gradient(circle_at_4%_55%,color-mix(in_oklab,var(--color-info)_12%,transparent),transparent_32%)]" />
      <div className="relative mx-auto w-full max-w-[1920px]">
        <header className="mb-4 grid min-w-0 gap-3 border-b border-info/30 pb-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)] lg:items-end">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.28em] text-info uppercase">Economic Context · Price Confirmation · Risk Filter</p>
            <h1 className="mt-1 text-3xl leading-tight font-extrabold sm:text-4xl">{t("signals.pageTitle")}</h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{t("signals.pageDesc")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="rounded-md border border-info/45 bg-info/8 px-2.5 py-1 text-[10px] font-semibold text-info">{t("signals.sourceOfficial")}</span>
            <span className={cn("rounded-md border px-2.5 py-1 text-[10px] font-semibold", chartLive ? "border-positive/55 bg-positive/10 text-positive" : "border-warning/55 bg-warning/10 text-warning")}>{chartLive ? "MT5 LIVE · READ-ONLY" : t("signals.waitingConnector")}</span>
          </div>
        </header>

        <div className="grid min-w-0 gap-3 xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          <aside className="order-2 min-w-0 space-y-3 xl:order-1">
            <SignalPanel title={t("signals.activeDrivers")} icon={<Database className="size-4" />}>
              <div className="space-y-2">
                {upcoming.length ? upcoming.map((event) => <EventRow key={`${event.release.releaseId}-${event.release.nextReleaseUtc}`} event={event} lang={lang} />) : <p className="text-xs text-muted-foreground">{calendar.isLoading ? t("common.loading") : "—"}</p>}
              </div>
            </SignalPanel>
          </aside>

          <main className="order-1 min-w-0 space-y-3 xl:order-2">
            <SignalPanel title={t("signals.goldConfirmation")} icon={<LineChart className="size-4" />} className="border-info/60">
              <div className="mb-2 flex min-w-0 flex-wrap items-center gap-1 border-b border-border/55 pb-2">
                <strong className="mr-2 text-lg">XAUUSD</strong>
                {TIMEFRAMES.map((item) => <Button key={item.value} type="button" size="sm" variant={timeframe === item.value ? "secondary" : "ghost"} onClick={() => setTimeframe(item.value)} className="h-7 px-2 text-[10px]">{item.label}</Button>)}
                <span className="ml-auto text-[10px] text-muted-foreground">{chartLive ? `${candles.data?.length ?? 0} candles` : t("signals.noTradeSignal")}</span>
              </div>
              <GoldChart timeframe={timeframe} candlesOverride={chartLive ? candles.data : undefined} live={chartLive} allowFallback={false} emptyLabel={t("signals.waitingConnector")} />
            </SignalPanel>

            <SignalPanel title={t("signals.releaseTrend")} icon={<BarChart3 className="size-4" />}>
              {selectedTrend ? <><div className="mb-2 flex flex-wrap items-center gap-2"><strong className="text-sm">{eventLabel(selectedTrend.release.event, lang)}</strong><span className="text-[10px] text-muted-foreground">{selectedTrend.release.actualSource}</span></div><TrendChart history={selectedTrend.release.history} unit={selectedTrend.release.unit} source={selectedTrend.release.agency} /></> : <p className="text-xs text-muted-foreground">{t("signals.noHistory")}</p>}
            </SignalPanel>
          </main>

          <aside className="order-3 min-w-0 space-y-3">
            <SignalPanel title={t("signals.officialContext")} icon={<Activity className="size-4" />}>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-info/45 bg-info/8 p-2"><p className="text-[10px] text-muted-foreground">Macro Gold Bias</p><p className="mt-1 text-sm"><DirectionLabel direction={macroDirection} /></p></div>
                <div className="rounded-md border border-primary/45 bg-primary/8 p-2"><p className="text-[10px] text-muted-foreground">Official releases</p><p className="num mt-1 text-lg font-bold text-primary">{economicEvents.length}</p></div>
              </div>
              <div className="mt-3 border-t border-border/50 pt-2 text-[11px]">
                <p className="text-muted-foreground">{t("signals.nextRelease")}</p>
                <p className="mt-1 font-semibold">{nextHigh ? eventLabel(nextHigh.release.event, lang) : "—"}</p>
                <p className="num mt-0.5 text-info">{nextHigh ? bangkok(nextHigh.release.nextReleaseUtc, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}</p>
              </div>
            </SignalPanel>

            <SignalPanel title={t("dashboard.signalSummary")} icon={<Target className="size-4" />}>
              {signal ? <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/45 pb-2"><span className="text-muted-foreground">{t("dashboard.bias")}</span><DirectionLabel direction={signal.bias} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">EMA20 / EMA50</span><span className="num">{num(signal.ema20)} / {num(signal.ema50)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">RSI 14</span><span className="num">{signal.rsi}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("signals.confidence")}</span><span className="num text-primary">{signal.confidence}%</span></div>
              </div> : <div className="rounded-md border border-warning/45 bg-warning/8 p-3"><p className="flex items-center gap-2 text-xs font-semibold text-warning"><Radio className="size-4" />{t("signals.waitingConnector")}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{t("signals.noTradeSignal")}</p></div>}
            </SignalPanel>

            <SignalPanel title={t("signals.eventRisk")} icon={<CalendarClock className="size-4" />}>
              <div className="space-y-2 text-[11px]">
                <p className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-positive" />{lang === "th" ? "ค่าจริงมาจากหน่วยงานต้นทาง" : "Actual values come from source agencies"}</p>
                <p className="flex items-center gap-2"><RefreshCw className="size-3.5 text-info" />{lang === "th" ? "ปฏิทินรีเฟรชตามรอบประกาศ" : "Calendar refreshes around release windows"}</p>
                <p className="flex items-start gap-2"><CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />{lang === "th" ? "สัญญาณนี้เป็นข้อมูลประกอบ ไม่ส่งคำสั่งซื้อขาย" : "Signals are advisory and never submit orders"}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full border-info/45 text-info"><Link to="/economic-calendar">{t("nav.liveCalendar")}</Link></Button>
            </SignalPanel>
          </aside>
        </div>
      </div>
    </div>
  );
}