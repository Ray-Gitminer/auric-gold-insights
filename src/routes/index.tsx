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

const PENDING = "รอเชื่อมข้อมูล";

function SampleTag() {
  return (
    <span className="shrink-0 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
      ข้อมูลตัวอย่าง
    </span>
  );
}

function SoonTag() {
  return (
    <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
      เร็ว ๆ นี้
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

function Row({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  const pending = value === PENDING;
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
  const Icon = dir === "Bullish" ? ArrowUp : dir === "Bearish" ? ArrowDown : ArrowRight;
  const tone =
    dir === "Bullish" ? "text-positive" : dir === "Bearish" ? "text-negative" : "text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", tone)}>
      <Icon className="size-3.5" aria-hidden /> {dir}
    </span>
  );
}

const FEATURES = [
  { icon: LineChart, title: "MTF Analysis", desc: "วิเคราะห์หลาย Timeframe มองภาพใหญ่และจุดเข้า", to: "/chart-strategy" as const },
  { icon: Network, title: "Rayny Nexora Signals", desc: "สัญญาณพร้อมเงื่อนไขยืนยัน" },
  { icon: Boxes, title: "MPGP Context", desc: "ระบุโซนสำคัญ Premium / Discount" },
  { icon: Waves, title: "AURIQ Flow", desc: "อ่านแรงซื้อขายและ Volume context" },
  { icon: Bell, title: "Smart Alerts", desc: "แจ้งสัญญาณและเหตุการณ์สำคัญ", to: "/alerts" as const },
];

const MODULES = [
  { icon: Network, title: "Rayny Nexora Engine", points: ["วิเคราะห์สัญญาณเชิงโครงสร้าง", "ตรวจจับโซนสำคัญ", "กรองสัญญาณตามเงื่อนไข"] },
  { icon: Boxes, title: "MPGP Framework", points: ["ระบุ Premium / Discount", "วิเคราะห์โครงสร้างตลาด", "มองโอกาสตาม Context"] },
  { icon: Bell, title: "Smart Alert System", points: ["แจ้งเตือนสัญญาณ", "เตือนเหตุการณ์สำคัญ", "ปรับตามความเสี่ยง"], to: "/alerts" as const },
  { icon: CalendarDays, title: "Economic Event Filter", points: ["ติดตามปฏิทินเศรษฐกิจ USD", "ระดับผลกระทบ สูง / กลาง / ต่ำ", "เตือนก่อนประกาศ"], to: "/economic-news" as const, impact: true },
];

const STEPS = ["Context", "Confirmation", "Execution", "Review"];

function Dashboard() {
  const { tx } = useI18n();
  const { data: portfolio } = usePortfolioData();
  const live = portfolio.source === "mt5";
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const candles = useMt5Candles(timeframe);
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
              วิเคราะห์ทองให้คมขึ้น
              <span className="mt-1 block bg-gradient-to-r from-gold-bright to-info bg-clip-text text-transparent">
                ด้วย AI + Context + Confirmation
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              อ่านบริบทตลาด XAUUSD ด้วยการวิเคราะห์หลายกรอบเวลา โครงสร้างราคา และการยืนยันจากระบบ AURIQ
            </p>
          </div>
          {FEATURES.map((f) => {
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
                  {!live && <SampleTag />}
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
              <GoldChart timeframe={timeframe} candlesOverride={live ? candles.data : undefined} live={live} />
            </div>
          </section>

          <Card title="AURIQ AI Insight" icon={<Sparkles className="size-4" />} tag={<SampleTag />}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-info">Market Context</p>
                <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-muted-foreground">{tx(bias.rationale)}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-info">Confirmation</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  เงื่อนไขผ่าน <span className="num text-foreground">{passed}/{strategy.conditions.length}</span> · สถานะ {strategy.state}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] font-semibold tracking-wide text-info">Suggested Bias</p>
                <p className="mt-1 text-sm"><BiasValue dir={bias.direction} /></p>
                <p className="mt-1 text-[10px] text-muted-foreground">ตีความจาก output ของระบบ · ไม่ใช่คำแนะนำการลงทุน</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: summaries */}
        <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-3">
          <Card title="Signal Summary" icon={<Target className="size-4" />} tag={<SampleTag />}>
            <Row label="Bias" value={<BiasValue dir={bias.direction} />} />
            <Row label="Entry Zone" value={PENDING} />
            <Row label="Stop Loss" value={PENDING} />
            <Row label="Targets" value={PENDING} />
            <Row label="อัปเดตล่าสุด" value={portfolio.account.lastSync || PENDING} />
          </Card>
          <Card title="Market Context" icon={<Layers className="size-4" />} tag={<SampleTag />}>
            <Row label="Trend" value={<BiasValue dir={bias.direction} />} />
            <Row label="Structure" value={PENDING} />
            <Row label="Liquidity" value={PENDING} />
            <Row label="Premium / Discount" value={PENDING} />
            <Row label="Confirmation" value={strategy.state} tone="text-primary" />
          </Card>
          <Card title="AURIQ Flow" icon={<Waves className="size-4" />} tag={<SoonTag />}>
            <Row label="Delta" value={PENDING} />
            <Row label="CVD" value={PENDING} />
            <Row label="Buyer Pressure" value={PENDING} />
            <Row label="Seller Pressure" value={PENDING} />
          </Card>
        </div>
      </div>

      {/* Modules */}
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => {
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
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-negative" />สูง</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-warning" />กลาง</span>
                  <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-gold-bright" />ต่ำ</span>
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
        <h2 className="text-sm font-semibold">How AURIQ Works</h2>
        <p className="text-xs text-muted-foreground">อธิบายกระบวนการวิเคราะห์ · ไม่ใช่ระบบส่งคำสั่งซื้อขาย</p>
        <ol className="mt-3 flex flex-wrap items-center gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="num grid size-8 place-items-center rounded-full border border-primary/60 text-sm font-semibold text-primary">{i + 1}</span>
                <span className="text-sm">{s}</span>
              </span>
              {i < STEPS.length - 1 && <ArrowRight className="size-4 text-muted-foreground" aria-hidden />}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
