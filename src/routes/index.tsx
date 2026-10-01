import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown, ArrowRight, ArrowUp, Bell, Boxes, CalendarDays, CheckCircle2,
  ChevronRight, CircleAlert, Gauge, Layers, LineChart, Minus, Network,
  ShieldCheck, Sparkles, Target, Waves,
} from "lucide-react";

import mountainBackground from "@/assets/auriq-mountain-bg.jpg";
import { bias, instrument, strategy } from "@/data/fixtures";
import { num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { useI18n } from "@/contexts/I18nContext";
import { usePortfolioData } from "@/hooks/use-portfolio-data";
import { useMt5Candles } from "@/hooks/use-mt5-candles";
import { candlesByTimeframe } from "@/data/fixtures";
import { computeFormulaSignal } from "@/lib/signals/engine";
import { runAiSignal, type AiSignal } from "@/lib/signals/ai-signal.functions";

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
  return <span className="shrink-0 rounded-sm border border-primary/55 bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold text-primary shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-foreground)_8%,transparent)]">{t("dashboard.sampleData")}</span>;
}

function SoonTag() {
  const { t } = useI18n();
  return <span className="shrink-0 rounded-sm border border-info/30 bg-info/5 px-1.5 py-0.5 text-[9px] text-info">{t("dashboard.comingSoon")}</span>;
}

function Panel({ title, icon, tag, children, className }: { title: string; icon: ReactNode; tag?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("auric-glass min-w-0 overflow-hidden rounded-lg p-3", className)}>
      <header className="mb-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/50 pb-2">
        <span className="auric-icon grid size-7 shrink-0 place-items-center rounded-md text-primary">{icon}</span>
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

function ModuleVisual({ index }: { index: number }) {
  if (index === 0) {
    return <svg viewBox="0 0 80 64" className="h-16 w-20 shrink-0 border-b border-info/30" aria-hidden><polyline points="3,55 14,47 24,50 35,33 46,39 57,19 68,26 77,9" fill="none" stroke="var(--color-info)" strokeWidth="2" /><path d="M3 55L14 47L24 50L35 33L46 39L57 19L68 26L77 9L77 61L3 61Z" fill="var(--color-info)" opacity=".12" />{[14,24,35,46,57,68].map((x, i) => <line key={x} x1={x} x2={x} y1={47 - i * 5} y2={58 - i * 3} stroke={i > 2 ? "var(--color-info)" : "var(--color-primary)"} strokeWidth="3" />)}</svg>;
  }
  if (index === 1) {
    return <div className="relative h-16 w-20 shrink-0" aria-hidden><span className="absolute top-2 right-1 h-7 w-14 -skew-y-12 border border-negative/55 bg-negative/15" /><span className="absolute top-6 right-4 h-7 w-14 -skew-y-12 border border-info/55 bg-info/15" /><span className="absolute top-10 right-7 h-5 w-10 -skew-y-12 border border-primary/55 bg-primary/15" /></div>;
  }
  if (index === 2) {
    return <div className="auric-glass relative h-16 w-14 shrink-0 rounded-md p-2" aria-hidden><span className="mx-auto block h-1 w-7 rounded bg-muted" /><span className="mt-3 block h-2 rounded-sm bg-primary/55" /><span className="mt-1.5 block h-2 rounded-sm bg-info/50" /><span className="mt-1.5 block h-2 rounded-sm bg-positive/45" /></div>;
  }
  return <div className="grid h-16 w-16 shrink-0 grid-cols-4 gap-1 rounded-md border border-info/35 bg-background/35 p-2" aria-hidden>{Array.from({ length: 12 }, (_, i) => <span key={i} className={cn("rounded-[2px]", i === 6 ? "bg-primary shadow-[0_0_8px_var(--color-primary)]" : i === 9 ? "bg-negative/75" : "bg-info/22")} />)}</div>;
}

function Dashboard() {
  const { t, tx } = useI18n();
  const { data: portfolio } = usePortfolioData();
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [insightOpen, setInsightOpen] = useState(true);
  const candles = useMt5Candles(timeframe);
  const chartLive = portfolio.source === "mt5" && Boolean(candles.data && candles.data.length > 1);
  const pending = t("dashboard.awaitingData");
  const [mode, setMode] = useState<1 | 2 | 3>(1);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const source = chartLive ? candles.data! : candlesByTimeframe[timeframe] ?? [];
  const formula = useMemo(() => computeFormulaSignal(source), [source]);
  const [ai, setAi] = useState<AiSignal | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const askAi = async () => {
    setAiBusy(true); setAiErr(null);
    try {
      const r = await runAiSignal({ data: { timeframe, candles: source.slice(-80).map(({ t: tt, o, h, l, c }) => ({ t: tt, o, h, l, c })), formula: formula as unknown as Record<string, unknown> } });
      if (r.ok) setAi(r.signal); else setAiErr(r.error);
    } catch (e) { setAiErr(e instanceof Error ? e.message : "AI error"); } finally { setAiBusy(false); }
  };
  const dataTag = chartLive ? <span className="shrink-0 rounded-sm border border-positive/55 bg-positive/10 px-1.5 py-0.5 text-[8px] font-semibold text-positive">MT5 LIVE</span> : <SampleTag />;
  const f2 = (n: number | null | undefined) => (n == null ? null : num(n));
  const sig = mode === 1 && formula ? { bias: formula.bias, entry: formula.entry ? `${num(formula.entry[0])} – ${num(formula.entry[1])}` : null, stop: f2(formula.stop), tp: formula.tp1 ? `${num(formula.tp1)} / ${f2(formula.tp2)}` : null, conf: formula.confidence }
    : mode === 2 && ai ? { bias: ai.bias, entry: ai.entry, stop: ai.stop, tp: ai.tp1 ? `${ai.tp1}${ai.tp2 ? ` / ${ai.tp2}` : ""}` : null, conf: ai.confidence } : null;
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

  const insightBody = (
    <div className="space-y-2.5">
      <div><p className="text-[10px] font-semibold text-info">{t("dashboard.marketContext")}</p><p className="mt-0.5 line-clamp-3 text-[10px] leading-4 text-foreground/80">{tx(bias.rationale)}</p></div>
      <div><p className="text-[10px] font-semibold text-info">{t("dashboard.confirmation")}</p><p className="mt-0.5 text-[10px] leading-4 text-foreground/80">{t("dashboard.conditionsPassed", { passed, total: strategy.conditions.length, state: tx(strategy.state) })}</p></div>
      <div><p className="text-[10px] font-semibold text-info">{t("dashboard.suggestedBias")}</p><div className="mt-1 flex items-center gap-2"><span className="rounded-md border border-positive/60 bg-positive/10 px-3 py-1 text-xs whitespace-nowrap"><BiasValue dir={bias.direction} /></span><span className="text-[9px] text-muted-foreground">{t("dashboard.advisoryNote")}</span></div></div>
    </div>
  );

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <img src={mountainBackground} width={1920} height={1080} alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-bottom opacity-70" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background/45" />

      <div className="mx-auto w-full max-w-[1920px] px-3 py-3 sm:px-5 xl:px-6">
        <div className="grid min-w-0 gap-2.5 xl:grid-cols-[25%_50%_25%] xl:gap-3">
          {/* LEFT intro */}
          <aside className="order-3 flex min-w-0 flex-col gap-3 xl:order-1 xl:col-start-1 xl:row-start-1 xl:pt-3">
            <div className="max-w-[27rem]">
              <p className="text-[8px] font-semibold tracking-[0.3em] text-muted-foreground">PRECISION · CONTEXT · CONFIRMATION</p>
              <h1 className="mt-3 text-3xl leading-[1.1] font-extrabold sm:text-4xl xl:text-[2.25rem] 2xl:text-[2.7rem]">
                <span className="block">{t("dashboard.heroTitle")}</span>
                <span className="block whitespace-nowrap">{t("dashboard.heroWith")} <span className="text-gold-bright">AI + Context</span> +</span>
                <span className="block text-info">Confirmation</span>
              </h1>
              <p className="mt-3 max-w-[26rem] text-[12px] leading-5 text-foreground/80 2xl:text-[13px] 2xl:leading-6">{t("dashboard.heroDescription")}</p>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {features.map((feature, index) => {
                const content = <><span className={cn("auric-icon grid size-9 shrink-0 place-items-center rounded-md", index % 2 ? "text-primary" : "text-info")}><feature.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold 2xl:text-[11px]">{feature.title}</span><span className="block line-clamp-2 text-[8px] leading-3 text-muted-foreground 2xl:text-[9px]">{feature.desc}</span></span>{feature.to ? <ChevronRight className="size-3 shrink-0 text-muted-foreground" /> : null}</>;
                const className = "auric-glass flex min-w-0 items-center gap-2 rounded-md p-2 transition-colors";
                return feature.to ? <Link key={feature.title} to={feature.to} className={cn(className, "hover:border-primary/60")}>{content}</Link> : <div key={feature.title} className={className}>{content}</div>;
              })}
            </div>
          </aside>

          {/* CENTER chart workspace */}
          <div className="order-1 min-w-0 xl:order-2 xl:col-start-2 xl:row-start-1">
            <section className="auric-glass relative min-w-0 overflow-hidden rounded-lg border-info/50 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-info)_8%,transparent),0_22px_45px_-30px_var(--color-info)]">
              <div className="grid min-w-0 grid-cols-1 gap-2 border-b border-border/60 px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:gap-6">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><span className="text-xl font-extrabold">XAUUSD</span><SampleTag /></div>
                  <p className="truncate text-[10px] text-muted-foreground">{t("dashboard.instrumentName")}</p>
                </div>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-left"><span className="num text-3xl font-bold">{num(instrument.last)}</span><span className={cn("num text-xs", up ? "text-positive" : "text-negative")}>{up ? "+" : ""}{num(instrument.change)} · {pct(instrument.changePct)}</span></div>
                <dl className="flex gap-5 text-[10px] sm:ml-auto">
                  <div><dt className="text-muted-foreground">{t("common.high")}</dt><dd className="num">{num(instrument.high)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("common.low")}</dt><dd className="num">{num(instrument.low)}</dd></div>
                  <div><dt className="text-muted-foreground">{t("dashboard.open")}</dt><dd className="num text-muted-foreground">—</dd></div>
                </dl>
              </div>
               <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 border-b border-border/60 bg-background/18 px-3 py-2" role="group" aria-label="Timeframe">
                 <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
                {TF.map((tf) => <button key={tf.value} type="button" aria-pressed={timeframe === tf.value} onClick={() => setTimeframe(tf.value)} className={cn("shrink-0 rounded-sm border px-3 py-1 text-[10px] font-semibold", timeframe === tf.value ? "border-info/60 bg-info/15 text-info" : "border-border text-muted-foreground")}>{tf.label}</button>)}
                 <div className="ml-2 hidden items-center gap-1 lg:flex" aria-hidden><span className="rounded-sm border border-border/70 px-2 py-1 text-[9px] text-muted-foreground">EMA</span><span className="rounded-sm border border-border/70 px-2 py-1 text-[9px] text-muted-foreground">RSI</span><span className="rounded-sm border border-border/70 px-2 py-1 text-[9px] text-muted-foreground">Stoch</span></div>
                 </div>
                 <span className="hidden shrink-0 pl-2 text-[9px] text-muted-foreground sm:block">{chartLive ? t("dashboard.mt5ChartLive") : t("chart.staticDemo")}</span>
                 <span className="col-span-2 mt-1 truncate text-right text-[8px] text-muted-foreground sm:hidden">{chartLive ? t("dashboard.mt5ChartLive") : t("chart.staticDemo")}</span>
              </div>
              <GoldChart timeframe={timeframe} candlesOverride={chartLive ? candles.data : undefined} live={chartLive} />
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 border-t border-border/60 px-3 py-2 xl:pr-[19.5rem]">
                <span className="num text-[9px] text-muted-foreground">RSI 14</span><div className="h-10 overflow-hidden"><svg viewBox="0 0 700 32" preserveAspectRatio="none" className="h-full w-full" aria-hidden><polyline fill="none" stroke="var(--color-info)" strokeWidth="1.5" points="0,23 45,16 90,20 130,10 180,24 225,15 275,18 320,7 365,20 410,14 455,22 505,6 550,12 600,4 650,17 700,9" /></svg></div>
              </div>
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 border-t border-border/60 px-3 py-2 xl:pr-[19.5rem]">
                <span className="num text-[9px] text-muted-foreground">Stoch</span>
                <div className="grid h-10 place-items-center rounded-sm border border-dashed border-border/60 text-[9px] italic text-muted-foreground/70">{pending}</div>
              </div>

              {/* Floating AI Insight (desktop) */}
              <div className="absolute right-3 bottom-3 hidden w-[18.5rem] xl:block">
                {insightOpen ? (
                   <div className="auric-glass rounded-lg border-info/60 bg-background/92 p-3 shadow-[0_0_26px_-8px_var(--color-info)]">
                    <div className="mb-2 flex items-center gap-2 border-b border-border/50 pb-2">
                      <Sparkles className="size-4 shrink-0 text-gold-bright" />
                      <h2 className="truncate text-sm font-semibold text-gold-bright">AURIQ AI Insight</h2>
                      <SampleTag />
                      <button type="button" onClick={() => setInsightOpen(false)} aria-label={t("dashboard.hideInsight")} className="ml-auto rounded p-0.5 text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button>
                    </div>
                    {insightBody}
                  </div>
                ) : (
                  <button type="button" onClick={() => setInsightOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-md border border-info/50 bg-background/90 px-2.5 py-1.5 text-[10px] font-semibold text-gold-bright"><Sparkles className="size-3.5" />{t("dashboard.showInsight")}</button>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT column */}
          <aside className="order-2 flex min-w-0 flex-col gap-3 xl:order-3 xl:col-start-3 xl:row-span-2 xl:row-start-1">
            <Panel title={t("dashboard.signalSummary")} icon={<Target className="size-4" />} tag={dataTag}>
              <div className="mb-2 grid grid-cols-3 gap-1" role="tablist">
                {([1, 2, 3] as const).map((m) => (
                  <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cn("rounded-md border px-1 py-1 text-[10px] font-medium", mode === m ? "border-primary/70 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>
                    {m}. {t(`signals.mode${m}`)}
                  </button>
                ))}
              </div>
              {mode === 2 && (
                <div className="mb-2 space-y-1.5">
                  <button type="button" onClick={askAi} disabled={aiBusy} className="w-full rounded-md border border-info/60 bg-info/10 px-2 py-1.5 text-[11px] font-semibold text-info disabled:opacity-60">
                    <Sparkles className="mr-1 inline size-3" />{aiBusy ? t("signals.aiRunning") : t("signals.aiRun")}
                  </button>
                  <p className="text-[9px] text-muted-foreground">{t("signals.aiDisclaimer")}</p>
                  {aiErr && <p className="text-[10px] text-negative">{aiErr}</p>}
                  {ai && <p className="text-[10px] leading-4 text-foreground/80">{t("signals.reasoning")}: {t("signals.lang") === "th" ? ai.reasoningTh || ai.reasoning : ai.reasoning}</p>}
                </div>
              )}
              {mode === 3 ? (
                <p className="rounded-md border border-border/60 bg-background/30 px-2 py-3 text-[11px] text-muted-foreground">{t("signals.awaitRules")}</p>
              ) : (
                <>
                  <div className="mb-1 rounded-md border border-positive/40 bg-positive/8 px-2 py-2"><Row label={t("dashboard.bias")} value={sig ? <BiasValue dir={sig.bias} /> : pending} pending={!sig} /></div>
                  <Row label={t("dashboard.entryZone")} value={sig?.entry ?? pending} pending={!sig?.entry} />
                  <Row label={t("dashboard.stopLoss")} value={sig?.stop ?? pending} pending={!sig?.stop} />
                  <Row label={t("dashboard.targets")} value={sig?.tp ?? pending} pending={!sig?.tp} />
                  <Row label={t("signals.confidence")} value={sig ? `${sig.conf}%` : pending} pending={!sig} />
                </>
              )}
              <Row label={t("dashboard.lastUpdated")} value={now ? now.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false }) : "—"} />
              {!chartLive && <p className="mt-1 text-[9px] text-muted-foreground">{t("signals.needMt5")}</p>}
            </Panel>
            <Panel title={t("dashboard.marketContext")} icon={<Layers className="size-4" />} tag={dataTag}>
              <Row label={t("dashboard.trend")} value={formula ? <BiasValue dir={formula.trend} /> : pending} pending={!formula} />
              <Row label={t("dashboard.structure")} value={formula?.structure ?? pending} pending={!formula} />
              <Row label={t("dashboard.liquidity")} value={formula ? `${num(formula.support)} / ${num(formula.resistance)}` : pending} pending={!formula} />
              <Row label="Premium / Discount" value={formula?.zone ?? pending} pending={!formula} />
              <Row label="EMA20 / EMA50 · RSI" value={formula ? `${num(formula.ema20)} / ${num(formula.ema50)} · ${formula.rsi}` : pending} pending={!formula} />
            </Panel>
            <Panel title="AURIQ AI Insight" icon={<Sparkles className="size-4" />} tag={<SampleTag />} className="border-info/50 xl:hidden">
              {insightBody}
            </Panel>
            <Panel title="AURIQ Flow" icon={<Waves className="size-4" />} tag={<SoonTag />}>
              <Row label="Delta / Spot" value={pending} pending /><Row label="CVD" value={pending} pending /><Row label={t("dashboard.buyerPressure")} value={pending} pending /><Row label={t("dashboard.sellerPressure")} value={pending} pending />
            </Panel>
            <section className="auric-glass order-last rounded-lg p-3 max-xl:hidden">
              <HowWorks steps={steps} title={t("dashboard.howTitle")} desc={t("dashboard.howDescription")} />
            </section>
          </aside>

          {/* BOTTOM modules under left + center */}
          <div className="order-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:col-span-2 xl:col-start-1 xl:row-start-2 xl:grid-cols-4">
            {modules.map((module, index) => {
              const body = <><div className="flex min-w-0 items-center gap-2"><span className="auric-icon grid size-8 shrink-0 place-items-center rounded-md text-primary"><module.icon className="size-4" /></span><h3 className="truncate text-xs font-semibold">{module.title}</h3>{module.to ? <ChevronRight className="ml-auto size-3 shrink-0" /> : <SoonTag />}</div><div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"><ul className="min-w-0 space-y-1 text-[9px] text-muted-foreground">{module.points.map((point) => <li key={point} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 size-3 shrink-0 text-primary" /><span className="line-clamp-1">{point}</span></li>)}</ul><ModuleVisual index={index} /></div></>;
              const classes = "auric-glass min-h-32 min-w-0 overflow-hidden rounded-lg p-3";
              return module.to ? <Link key={module.title} to={module.to} className={cn(classes, "hover:border-primary/60")}>{body}</Link> : <div key={module.title} className={classes}>{body}</div>;
            })}
            <section className="auric-glass rounded-lg p-3 sm:col-span-2 xl:hidden">
              <HowWorks steps={steps} title={t("dashboard.howTitle")} desc={t("dashboard.howDescription")} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowWorks({ steps, title, desc }: { steps: string[]; title: string; desc: string }) {
  return (
    <>
      <div className="flex items-center gap-2"><span className="auric-icon grid size-7 place-items-center rounded-md"><Gauge className="size-4 text-primary" /></span><h2 className="text-xs font-semibold">{title}</h2><ShieldCheck className="ml-auto size-3.5 text-info" /></div>
      <ol className="mt-3 grid grid-cols-4 gap-1">
        {steps.map((step, index) => <li key={step} className="relative min-w-0 text-center"><span className="num mx-auto grid size-7 place-items-center rounded-full border border-info/70 bg-info/8 text-[10px] text-info shadow-[0_0_14px_-3px_var(--color-info)]">{index + 1}</span><span className="mt-1 block truncate text-[9px] text-muted-foreground">{step}</span>{index < steps.length - 1 ? <ArrowRight className="absolute top-2 -right-2 size-3 text-primary/65" aria-hidden /> : null}</li>)}
      </ol>
      <p className="mt-2 flex items-start gap-1 text-[9px] leading-3 text-muted-foreground"><CircleAlert className="size-3 shrink-0 text-primary" />{desc}</p>
    </>
  );
}
