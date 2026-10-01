import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  Boxes,
  CalendarDays,
  ChevronRight,
  Layers,
  LineChart,
  Network,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";

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
      {
        name: "description",
        content:
          "AURIQ Gold Insights — XAUUSD market intelligence: context, confirmation and execution in one dashboard.",
      },
      { property: "og:title", content: "Dashboard · AURIQ Gold Insights" },
      {
        property: "og:description",
        content: "Gold market intelligence for XAUUSD with multi-timeframe context and AI insight.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TF: { label: string; value: Timeframe }[] = [
  { label: "M5", value: "5m" },
  { label: "M15", value: "15m" },
  { label: "H1", value: "1h" },
  { label: "H4", value: "4h" },
  { label: "D1", value: "1D" },
];

function SampleTag() {
  const { t } = useI18n();
  return (
    <span className="shrink-0 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
      {t("dashboard.sampleData")}
    </span>
  );
}

function SoonTag() {
  const { t } = useI18n();
  return (
    <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {t("dashboard.comingSoon")}
    </span>
  );
}

function Card({
  title,
  icon,
  tag,
  children,
  className,
}: {
  title: string;
  icon: ReactNode;
  tag?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border bg-card/70 p-4 shadow-[var(--shadow-glow)] backdrop-blur-sm",
        className,
      )}
    >
      <header className="mb-3 flex min-w-0 items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <span className="ml-auto">{tag}</span>
      </header>
      {children}
    </section>
  );
}

function Row({ label, value, tone, pending = false }: { label: string; value: ReactNode; tone?: string; pending?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num truncate text-right",
          pending ? "text-xs text-muted-foreground/70 italic" : tone ?? "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function BiasValue({ dir }: { dir: "Bullish" | "Bearish" | "Neutral" }) {
  const { tx } = useI18n();
  const Icon = dir === "Bullish" ? ArrowUp : dir === "Bearish" ? ArrowDown : ArrowRight;
  const tone =
    dir === "Bullish" ? "text-positive" : dir === "Bearish" ? "text-negative" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", tone)}>
      <Icon className="size-3.5" aria-hidden /> {tx(dir)}
    </span>
  );
}

function Dashboard() {
  const { t, tx } = useI18n();
  const { data: portfolio } = usePortfolioData();
  const live = portfolio.source === "mt5";
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const candles = useMt5Candles(timeframe);
  const chartLive = live && Boolean(candles.data && candles.data.length > 1);
  const pending = t("dashboard.awaitingData");
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
    { icon: CalendarDays, title: "Economic Event Filter", points: [t("dashboard.eventPoint1"), t("dashboard.eventPoint2"), t("dashboard.eventPoint3")], to: "/economic-news" as const, impact: true },
  ];
  const steps = [t("dashboard.stepContext"), t("dashboard.stepConfirmation"), t("dashboard.stepExecution"), t("dashboard.stepReview")];
  const passed = strategy.conditions.filter((c) => c.pass).length;
  const up = instrument.change >= 0;

  return (
    <div className="relative -mx-3 -my-5 min-w-0 px-3 py-5 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6" style={{ backgroundImage: "var(--gradient-hero)" }}>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left: brand + features */}
        <div className="order-3 flex min-w-0 flex-col gap-3 lg:order-1">
          <div className="py-2">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-primary">AURIQ GOLD INSIGHTS</p>
            <h1 className="mt-2 text-2xl leading-tight font-bold sm:text-3xl">
              {t("dashboard.heroTitle")}
              <span className="mt-1 block bg-gradient-to-r from-gold-bright to-info bg-clip-text text-transparent">
                {t("dashboard.heroAccent")}
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("dashboard.heroDescription")}
            </p>
          </div>
           {features.map((f) => {
            const inner = (
              <>
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{f.title}</span>
                  <span className="block text-xs text-muted-foreground">{f.desc}</span>
                </span>
                {f.to ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : <SoonTag />}
              </>
            );
            const cls = "flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card/60 p-3 transition-colors";
            return f.to ? (
              <Link key={f.title} to={f.to} className={cn(cls, "hover:border-primary/50 focus-visible:border-primary")}>
                {inner}
              </Link>
            ) : (
              <div key={f.title} className={cls}>{inner}</div>
            );
          })}
        </div>

        {/* Center: chart + AI insight */}
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
          <section className="min-w-0 rounded-xl border border-border bg-card/70 p-4 shadow-[var(--shadow-glow)]">
            <div className="flex min-w-0 flex-wrap items-end gap-x-6 gap-y-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">XAUUSD</span>
                   <SampleTag />
                </div>
                <p className="text-xs text-muted-foreground">Gold Spot / U.S. Dollar</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="num text-2xl font-semibold">{num(instrument.last)}</span>
                <span className={cn("num text-sm", up ? "text-positive" : "text-negative")}>
                  {up ? "+" : ""}{num(instrument.change)} ({pct(instrument.changePct)})
                </span>
              </div>
              <dl className="num flex gap-5 text-xs">
                <div><dt className="text-muted-foreground">High</dt><dd>{num(instrument.high)}</dd></div>
                <div><dt className="text-muted-foreground">Low</dt><dd>{num(instrument.low)}</dd></div>
                <div><dt className="text-muted-foreground">Open</dt><dd className="text-muted-foreground/70">—</dd></div>
              </dl>
            </div>
            <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Timeframe">
              {TF.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  aria-pressed={timeframe === tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    "rounded-md border px-3 py-1 text-xs font-semibold transition-colors",
                    timeframe === tf.value
                      ? "border-info/60 bg-info/15 text-info"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            <div className="mt-3 min-w-0">
               <GoldChart timeframe={timeframe} candlesOverride={chartLive ? candles.data : undefined} live={chartLive} />
            </div>
          </section>

          <Card title="AURIQ AI Insight" icon={<Sparkles className="size-4" />} tag={<SampleTag />}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                 <p className="text-[11px] font-semibold tracking-wide text-info">{t("dashboard.marketContext")}</p>
                <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{tx(bias.rationale)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                 <p className="text-[11px] font-semibold tracking-wide text-info">{t("dashboard.confirmation")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                   {t("dashboard.conditionsPassed", { passed, total: strategy.conditions.length, state: tx(strategy.state) })}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                 <p className="text-[11px] font-semibold tracking-wide text-info">{t("dashboard.suggestedBias")}</p>
                <p className="mt-1 text-sm"><BiasValue dir={bias.direction} /></p>
                 <p className="mt-1 text-[10px] text-muted-foreground">{t("dashboard.advisoryNote")}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: summaries */}
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-3">
           <Card title={t("dashboard.signalSummary")} icon={<Target className="size-4" />} tag={<SampleTag />}>
             <Row label={t("dashboard.bias")} value={<BiasValue dir={bias.direction} />} />
             <Row label={t("dashboard.entryZone")} value={pending} pending />
             <Row label={t("dashboard.stopLoss")} value={pending} pending />
             <Row label={t("dashboard.targets")} value={pending} pending />
             <Row label={t("dashboard.lastUpdated")} value={portfolio.account.lastSync || pending} pending={!portfolio.account.lastSync} />
          </Card>
           <Card title={t("dashboard.marketContext")} icon={<Layers className="size-4" />} tag={<SampleTag />}>
             <Row label={t("dashboard.trend")} value={<BiasValue dir={bias.direction} />} />
             <Row label={t("dashboard.structure")} value={pending} pending />
             <Row label={t("dashboard.liquidity")} value={pending} pending />
             <Row label="Premium / Discount" value={pending} pending />
             <Row label={t("dashboard.confirmation")} value={tx(strategy.state)} tone="text-primary" />
          </Card>
          <Card title="AURIQ Flow" icon={<Waves className="size-4" />} tag={<SoonTag />}>
             <Row label="Delta" value={pending} pending />
             <Row label="CVD" value={pending} pending />
             <Row label={t("dashboard.buyerPressure")} value={pending} pending />
             <Row label={t("dashboard.sellerPressure")} value={pending} pending />
          </Card>
        </div>
      </div>

      {/* Modules */}
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
         {modules.map((m) => {
          const body = (
            <>
              <div className="flex items-center gap-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="size-4" aria-hidden />
                </span>
                <h3 className="truncate text-sm font-semibold">{m.title}</h3>
                <span className="ml-auto">{m.to ? <ChevronRight className="size-4 text-muted-foreground" /> : <SoonTag />}</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {m.points.map((p) => (
                  <li key={p} className="flex gap-2"><span className="text-primary">•</span>{p}</li>
                ))}
              </ul>
              {m.impact && (
                <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                   <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-negative" />{t("dashboard.impactHigh")}</span>
                   <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />{t("dashboard.impactMedium")}</span>
                   <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-gold-bright" />{t("dashboard.impactLow")}</span>
                </div>
              )}
            </>
          );
          const cls = "min-w-0 rounded-xl border border-border bg-card/60 p-4 transition-colors";
          return m.to ? (
            <Link key={m.title} to={m.to} className={cn(cls, "hover:border-primary/50")}>{body}</Link>
          ) : (
            <div key={m.title} className={cls}>{body}</div>
          );
        })}
      </div>

      {/* How AURIQ works */}
      <section className="mt-4 rounded-xl border border-border bg-card/50 p-4">
         <h2 className="text-sm font-semibold">{t("dashboard.howTitle")}</h2>
         <p className="text-xs text-muted-foreground">{t("dashboard.howDescription")}</p>
        <ol className="mt-3 flex flex-wrap items-center gap-3">
           {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="num grid size-8 place-items-center rounded-full border border-primary/60 text-sm font-semibold text-primary">{i + 1}</span>
                <span className="text-sm">{s}</span>
              </span>
               {i < steps.length - 1 && <ArrowRight className="size-4 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
