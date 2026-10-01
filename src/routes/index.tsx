import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown, ArrowRight, ArrowUp, Bell, Boxes, CalendarDays, CheckCircle2,
  ChevronRight, CircleAlert, Gauge, Layers, LineChart, Network, Sparkles,
  Target, Waves,
} from "lucide-react";

import mountainBackground from "@/assets/auriq-mountain-bg.jpg";
import { bias, instrument, strategy } from "@/data/fixtures";
import { num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { useI18n } from "@/contexts/I18nContext";
import { usePortfolioData } from "@/hooks/use-portfolio-data";
import { useMt5Candles } from "@/hooks/use-mt5-candles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · AURIQ Gold Insights" },
      { name: "description", content: "AURIQ Gold Insights — XAUUSD market intelligence: context, confirmation and execution in one dashboard." },
      { property: "og:title", content: "Dashboard · AURIQ Gold Insights" },
      { property: "og:description", content: "Gold market intelligence for XAUUSD with multi-timeframe context and AI insight." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TF: { label: string; value: Timeframe }[] = [
  { label: "M5", value: "5m" }, { label: "M15", value: "15m" },
  { label: "H1", value: "1h" }, { label: "H4", value: "4h" }, { label: "D1", value: "1D" },
];

function SampleTag() {
  const { t } = useI18n();
  return <span className="shrink-0 rounded-sm border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">{t("dashboard.sampleData")}</span>;
}

function SoonTag() {
  const { t } = useI18n();
  return <span className="shrink-0 rounded-sm border border-info/30 bg-info/5 px-1.5 py-0.5 text-[9px] text-info">{t("dashboard.comingSoon")}</span>;
}

function Panel({ title, icon, tag, children, className }: { title: string; icon: ReactNode; tag?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-border/90 bg-card/80 p-3 shadow-[var(--shadow-glow)] backdrop-blur-md", className)}>
      <header className="mb-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/50 pb-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {tag}
      </header>
      {children}
    </section>
  );
}

function Row({ label, value, pending = false }: { label: string; value: ReactNode; pending?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border/45 py-1.5 text-[11px] last:border-0">
      <span className="min-w-0 truncate text-muted-foreground">{label}</span>
      <span className={cn("num max-w-36 truncate text-right", pending ? "italic text-muted-foreground/60" : "text-foreground")}>{value}</span>
    </div>
  );
}

function BiasValue({ dir }: { dir: "Bullish" | "Bearish" | "Neutral" }) {
  const { tx } = useI18n();
  const Icon = dir === "Bullish" ? ArrowUp : dir === "Bearish" ? ArrowDown : ArrowRight;
  return <span className={cn("inline-flex items-center gap-1 font-semibold", dir === "Bullish" ? "text-positive" : dir === "Bearish" ? "text-negative" : "text-muted-foreground")}><Icon className="size-3" />{tx(dir)}</span>;
}

function Dashboard() {
  const { t, tx } = useI18n();
  const { data: portfolio } = usePortfolioData();
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const candles = useMt5Candles(timeframe);
  const chartLive = portfolio.source === "mt5" && Boolean(candles.data && candles.data.length > 1);
  const pending = t("dashboard.awaitingData");
  const passed = strategy.conditions.filter((condition) => condition.pass).length;
  const up = instrument.change >= 0;
  const features = [
    { icon: LineChart, title: "MTF Analysis", desc: t("dashboard.featureMtf"), to: "/chart-strategy" as const },
    { icon: Network, title: "Rayny Nexora Signals", desc: t("dashboard.featureSignals") },
    { icon: Boxes, title: "MPGP Context", desc: t("dashboard.featureMpgp") },
    { icon: Waves, title: "AURIQ Flow", desc: t("dashboard.featureFlow") },
    { icon: Bell, title: "Smart Alerts", desc: t("dashboard.featureAlerts"), to: "/alerts" as const },
  ];
  const modules = [
    { icon: Network, title: "Rayny Nexora Engine", points: [t("dashboard.enginePoint1"), t("dashboard.enginePoint2"), t("dashboard.enginePoint3")] },
    { icon: Boxes, title: "MPGP Framework", points: [t("dashboard.mpgpPoint1"), t("dashboard.mpgpPoint2"), t("dashboard.mpgpPoint3")] },
    { icon: Bell, title: "Smart Alert System", points: [t("dashboard.alertPoint1"), t("dashboard.alertPoint2"), t("dashboard.alertPoint3")], to: "/alerts" as const },
    { icon: CalendarDays, title: "Economic Event Filter", points: [t("dashboard.eventPoint1"), t("dashboard.eventPoint2"), t("dashboard.eventPoint3")], to: "/economic-news" as const },
  ];
  const steps = [t("dashboard.stepContext"), t("dashboard.stepConfirmation"), t("dashboard.stepExecution"), t("dashboard.stepReview")];

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <img src={mountainBackground} width={1920} height={1080} alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-bottom opacity-55" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background/55" />

      <div className="mx-auto w-full max-w-[1920px] px-3 py-4 sm:px-5 xl:px-7">
        <div className="grid min-w-0 gap-3 xl:grid-cols-[20rem_minmax(34rem,1fr)_20rem]">
          <aside className="order-3 flex min-w-0 flex-col justify-between gap-3 xl:order-1">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.28em] text-info">PRECISION · CONTEXT · CONFIRMATION</p>
              <h1 className="mt-3 text-3xl leading-[1.18] font-extrabold sm:text-4xl xl:text-[2.6rem]">
                {t("dashboard.heroTitle")}
                <span className="mt-1 block text-gold-bright">{t("dashboard.heroAccent")}</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-foreground/80">{t("dashboard.heroDescription")}</p>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-2">
              {features.map((feature) => {
                const content = <><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><feature.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold">{feature.title}</span><span className="block line-clamp-2 text-[9px] leading-3 text-muted-foreground">{feature.desc}</span></span>{feature.to ? <ChevronRight className="size-3 shrink-0 text-muted-foreground" /> : null}</>;
                const className = "flex min-w-0 items-center gap-2 rounded-md border border-border/80 bg-card/70 p-2 backdrop-blur-md transition-colors";
                return feature.to ? <Link key={feature.title} to={feature.to} className={cn(className, "hover:border-primary/60")}>{content}</Link> : <div key={feature.title} className={className}>{content}</div>;
              })}
            </div>
          </aside>

          <div className="order-1 min-w-0 xl:order-2">
            <section className="min-w-0 overflow-hidden rounded-lg border border-info/35 bg-card/85 shadow-[var(--shadow-glow)] backdrop-blur-md">
              <div className="grid min-w-0 grid-cols-1 gap-2 border-b border-border/60 px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xl font-extrabold">XAUUSD</span><SampleTag /></div>
                  <p className="truncate text-[10px] text-muted-foreground">{t("dashboard.instrumentName")}</p>
                </div>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-left"><span className="num text-2xl font-bold">{num(instrument.last)}</span><span className={cn("num text-xs", up ? "text-positive" : "text-negative")}>{up ? "+" : ""}{num(instrument.change)} · {pct(instrument.changePct)}</span></div>
                <dl className="flex gap-5 text-[10px] sm:ml-auto">
                  <div><dt className="text-muted-foreground">{t("common.high")}</dt><dd className="num">{num(instrument.high)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("common.low")}</dt><dd className="num">{num(instrument.low)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("dashboard.open")}</dt><dd className="num text-muted-foreground">—</dd></div>
                </dl>
              </div>
              <div className="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-border/60 px-3 py-2" role="group" aria-label="Timeframe">
                {TF.map((tf) => <button key={tf.value} type="button" aria-pressed={timeframe === tf.value} onClick={() => setTimeframe(tf.value)} className={cn("shrink-0 rounded-sm border px-3 py-1 text-[10px] font-semibold", timeframe === tf.value ? "border-info/60 bg-info/15 text-info" : "border-border text-muted-foreground")}>{tf.label}</button>)}
                <span className="ml-auto shrink-0 pl-3 text-[9px] text-muted-foreground">{chartLive ? t("dashboard.mt5ChartLive") : t("chart.staticDemo")}</span>
              </div>
              <GoldChart timeframe={timeframe} candlesOverride={chartLive ? candles.data : undefined} live={chartLive} />
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-border/60 px-3 py-2">
                <span className="num text-[9px] text-muted-foreground">RSI 14</span><div className="h-8 overflow-hidden"><svg viewBox="0 0 700 32" className="h-full w-full" aria-hidden><polyline fill="none" stroke="var(--color-info)" strokeWidth="1.5" points="0,23 45,16 90,20 130,10 180,24 225,15 275,18 320,7 365,20 410,14 455,22 505,6 550,12 600,4 650,17 700,9" /></svg></div>
              </div>
            </section>

            <Panel title="AURIQ AI Insight" icon={<Sparkles className="size-4" />} tag={<SampleTag />} className="mt-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><p className="text-[10px] font-semibold text-info">{t("dashboard.marketContext")}</p><p className="mt-1 line-clamp-3 text-[10px] leading-4 text-muted-foreground">{tx(bias.rationale)}</p></div>
                <div><p className="text-[10px] font-semibold text-info">{t("dashboard.confirmation")}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{t("dashboard.conditionsPassed", { passed, total: strategy.conditions.length, state: tx(strategy.state) })}</p></div>
                <div><p className="text-[10px] font-semibold text-info">{t("dashboard.suggestedBias")}</p><p className="mt-1"><BiasValue dir={bias.direction} /></p><p className="mt-1 text-[9px] text-muted-foreground">{t("dashboard.advisoryNote")}</p></div>
              </div>
            </Panel>
          </div>

          <aside className="order-2 flex min-w-0 flex-col gap-3 xl:order-3">
            <Panel title={t("dashboard.signalSummary")} icon={<Target className="size-4" />} tag={<SampleTag />}>
              <div className="mb-1 rounded-md border border-positive/40 bg-positive/8 px-2 py-2"><Row label={t("dashboard.bias")} value={<BiasValue dir={bias.direction} />} /></div>
              <Row label={t("dashboard.entryZone")} value={pending} pending /><Row label={t("dashboard.stopLoss")} value={pending} pending /><Row label={t("dashboard.targets")} value={pending} pending /><Row label={t("dashboard.lastUpdated")} value={portfolio.account.lastSync || pending} pending={!portfolio.account.lastSync} />
            </Panel>
            <Panel title={t("dashboard.marketContext")} icon={<Layers className="size-4" />} tag={<SampleTag />}>
              <Row label={t("dashboard.trend")} value={<BiasValue dir={bias.direction} />} /><Row label={t("dashboard.structure")} value={pending} pending /><Row label={t("dashboard.liquidity")} value={pending} pending /><Row label="Premium / Discount" value={pending} pending /><Row label={t("dashboard.confirmation")} value={tx(strategy.state)} />
            </Panel>
            <Panel title="AURIQ Flow" icon={<Waves className="size-4" />} tag={<SoonTag />}>
              <Row label="Delta / Spot" value={pending} pending /><Row label="CVD" value={pending} pending /><Row label={t("dashboard.buyerPressure")} value={pending} pending /><Row label={t("dashboard.sellerPressure")} value={pending} pending />
            </Panel>
          </aside>
        </div>

        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(22rem,1.7fr)]">
          {modules.map((module) => {
            const body = <><div className="flex min-w-0 items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><module.icon className="size-4" /></span><h3 className="truncate text-xs font-semibold">{module.title}</h3>{module.to ? <ChevronRight className="ml-auto size-3 shrink-0" /> : <SoonTag />}</div><ul className="mt-2 space-y-1 text-[10px] text-muted-foreground">{module.points.map((point) => <li key={point} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" />{point}</li>)}</ul></>;
            const classes = "min-w-0 rounded-lg border border-border/90 bg-card/80 p-3 backdrop-blur-md";
            return module.to ? <Link key={module.title} to={module.to} className={cn(classes, "hover:border-primary/60")}>{body}</Link> : <div key={module.title} className={classes}>{body}</div>;
          })}
          <section className="rounded-lg border border-border/90 bg-card/80 p-3 backdrop-blur-md sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-2"><Gauge className="size-4 text-primary" /><h2 className="text-xs font-semibold">{t("dashboard.howTitle")}</h2></div>
            <ol className="mt-3 grid grid-cols-4 gap-1">
              {steps.map((step, index) => <li key={step} className="min-w-0 text-center"><span className="num mx-auto grid size-7 place-items-center rounded-full border border-info/70 text-[10px] text-info">{index + 1}</span><span className="mt-1 block truncate text-[9px] text-muted-foreground">{step}</span></li>)}
            </ol>
            <p className="mt-2 flex items-start gap-1 text-[9px] leading-3 text-muted-foreground"><CircleAlert className="size-3 shrink-0 text-primary" />{t("dashboard.howDescription")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
