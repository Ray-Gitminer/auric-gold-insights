import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDown, ArrowRight, ArrowUp, BarChart3, CalendarClock, CheckCircle2, Clock, Filter,
  Scale, Search, ShieldCheck, Sparkles, Target, XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { useNewsIntelligence } from "@/hooks/use-news-intelligence";
import { eventLabel } from "@/locales/economic-events-th";
import type { CalendarEvent } from "@/lib/economic-calendar/types";

type Impact = "High" | "Medium" | "Low";
type Session = "today" | "week" | "upcoming";
type Topic = "All" | "USD" | "Labor" | "Inflation" | "Fed";

const IMPACT_STYLE: Record<Impact, string> = {
  High: "border-negative/60 bg-negative/10 text-negative",
  Medium: "border-warning/60 bg-warning/10 text-warning",
  Low: "border-primary/60 bg-primary/10 text-primary",
};

function topicOf(name: string): Topic {
  const n = name.toLowerCase();
  if (/payroll|employ|job|claims|labor|labour|adp|jolts/.test(n)) return "Labor";
  if (/cpi|pce|price|inflation/.test(n)) return "Inflation";
  if (/fomc|fed|rate/.test(n)) return "Fed";
  return "USD";
}

const bkk = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", ...opts }).format(new Date(iso));

function fmtVal(v: number | null, unit: string) {
  if (v == null) return "—";
  return `${Number.isInteger(v) ? v.toLocaleString() : v.toFixed(unit === "%" ? 1 : 2)}${unit === "%" ? "%" : unit === "K" ? "K" : ""}`;
}

function Glass({ title, icon, children, action, className }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("auric-glass min-w-0 overflow-hidden rounded-lg p-3", className)}>
      <header className="mb-2.5 flex items-center gap-2">
        <span className="auric-icon grid size-7 shrink-0 place-items-center rounded-md text-primary">{icon}</span>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Check({ checked, onChange, label, dot }: { checked: boolean; onChange: () => void; label: string; dot?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/30 px-2 py-1.5 text-xs">
      {dot && <span className={cn("size-2.5 rounded-full", dot)} />}
      <span className="flex-1">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[var(--color-primary)]" />
    </label>
  );
}

export function NewsIntelligenceView() {
  const { lang } = useI18n();
  const th = lang === "th";
  const { items, calendarEvents, fetchedAt } = useNewsIntelligence();
  const [topic, setTopic] = useState<Topic>("All");
  const [impacts, setImpacts] = useState<Record<Impact, boolean>>({ High: true, Medium: true, Low: true });
  const [session, setSession] = useState<Session>("week");
  const [query, setQuery] = useState("");
  const [scenario, setScenario] = useState<string | null>(null);

  const now = Date.now();
  const events = useMemo(() => {
    const day = 86_400_000;
    return (calendarEvents as CalendarEvent[])
      .filter((e) => {
        const ts = new Date(e.release.nextReleaseUtc).getTime();
        if (!impacts[e.release.impact]) return false;
        if (topic !== "All" && topicOf(e.release.event) !== topic && topic !== "USD") return false;
        if (query && !e.release.event.toLowerCase().includes(query.toLowerCase())) return false;
        if (session === "today") return bkk(e.release.nextReleaseUtc, { dateStyle: "short" }) === bkk(new Date().toISOString(), { dateStyle: "short" });
        if (session === "upcoming") return ts >= now;
        return ts >= now - 2 * day && ts <= now + 7 * day;
      })
      .sort((a, b) => a.release.nextReleaseUtc.localeCompare(b.release.nextReleaseUtc));
  }, [calendarEvents, impacts, topic, query, session, now]);

  const timeline = useMemo(
    () => (calendarEvents as CalendarEvent[]).filter((e) => new Date(e.release.nextReleaseUtc).getTime() >= now && e.release.impact !== "Low").slice(0, 4),
    [calendarEvents, now],
  );

  // Deterministic news-based bias (no AI): weighted vote of analysed headlines.
  const insight = useMemo(() => {
    let score = 0, weight = 0;
    for (const n of items) {
      const w = n.relevance / 100;
      weight += w;
      score += n.direction === "Bullish" ? w : n.direction === "Bearish" ? -w : 0;
    }
    const s = weight ? score / weight : 0;
    const bias = s > 0.15 ? "Bullish" : s < -0.15 ? "Bearish" : "Neutral";
    const highSoon = (calendarEvents as CalendarEvent[]).filter((e) => e.release.impact === "High" && Math.abs(new Date(e.release.nextReleaseUtc).getTime() - now) < 48 * 3600_000).length;
    const vol = highSoon >= 2 ? "High" : highSoon === 1 ? "Medium" : "Low";
    const agree = items.length ? Math.round((items.filter((n) => n.direction === bias).length / items.length) * 100) : 0;
    return { bias, vol, confidence: agree, n: items.length };
  }, [items, calendarEvents, now]);

  const biasTone = insight.bias === "Bullish" ? "text-positive" : insight.bias === "Bearish" ? "text-negative" : "text-muted-foreground";
  const BiasIcon = insight.bias === "Bullish" ? ArrowUp : insight.bias === "Bearish" ? ArrowDown : ArrowRight;

  return (
    <div className="space-y-3">
      {/* Hero */}
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Economic Calendar · News Impact · AI Interpretation</p>
          <h1 className="mt-1 text-3xl leading-tight font-bold sm:text-4xl">
            {th ? "วิเคราะห์ข่าวให้เข้าใจ" : "Understand the news "}<span className="text-gold-bright">{th ? "เร็ว" : "fast"}</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-info">{th ? "รู้ก่อนข่าวออก • รู้ผลกระทบทันที • แปลเป็นแผนเทรดทอง" : "Know before release • See impact instantly • Turn it into a gold plan"}</p>
        </div>
        <p className="min-w-0 text-xs leading-5 text-muted-foreground">
          {th
            ? "AURIQ รวบรวมเหตุการณ์เศรษฐกิจจากแหล่งทางการ คัดกรองระดับผลกระทบ และเชื่อมกับข่าวจริงที่มีชื่อแหล่งและเวลา เพื่อให้เห็นผลต่อทองคำได้รวดเร็ว"
            : "AURIQ gathers official economic releases, ranks their impact and links them to named, timestamped headlines to show the effect on gold quickly."}
        </p>
      </div>

      <div className="grid min-w-0 gap-3 xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
        {/* Filters */}
        <aside className="order-2 min-w-0 xl:order-1">
          <Glass title={th ? "ตัวกรอง" : "Filters"} icon={<Filter className="size-4" />}>
            <p className="mb-1.5 text-[11px] text-muted-foreground">{th ? "สินทรัพย์ / หัวข้อ" : "Asset / Topic"}</p>
            <div className="mb-3 grid grid-cols-3 gap-1">
              {(["All", "USD", "Labor", "Inflation", "Fed"] as Topic[]).map((tp) => (
                <button key={tp} type="button" onClick={() => setTopic(tp)} className={cn("rounded-md border px-1 py-1 text-[11px]", topic === tp ? "border-primary/70 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>{tp}</button>
              ))}
            </div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">{th ? "ผลกระทบ" : "Impact"}</p>
            <div className="mb-3 space-y-1">
              {(["High", "Medium", "Low"] as Impact[]).map((im) => (
                <Check key={im} label={im} checked={impacts[im]} onChange={() => setImpacts((p) => ({ ...p, [im]: !p[im] }))} dot={im === "High" ? "bg-negative" : im === "Medium" ? "bg-warning" : "bg-primary"} />
              ))}
            </div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">{th ? "ช่วงเวลา" : "Session"}</p>
            <div className="space-y-1">
              {([["today", th ? "วันนี้" : "Today"], ["week", th ? "สัปดาห์นี้" : "This Week"], ["upcoming", th ? "กำลังจะมา" : "Upcoming"]] as [Session, string][]).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setSession(v)} className={cn("block w-full rounded-md border px-2 py-1.5 text-left text-xs", session === v ? "border-primary/70 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground")}>{l}</button>
              ))}
            </div>
          </Glass>
        </aside>

        {/* Center */}
        <div className="order-1 min-w-0 space-y-3 xl:order-2">
          <Glass title="Upcoming Impact Timeline" icon={<Clock className="size-4" />} action={<Link to="/economic-calendar" className="rounded-md border border-info/40 px-2 py-0.5 text-[10px] text-info">{th ? "ดูปฏิทินเต็ม" : "View Full Calendar"} →</Link>}>
            {timeline.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : (
              <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="absolute top-[34px] right-4 left-4 hidden h-px bg-gradient-to-r from-primary/60 via-info/60 to-primary/60 md:block" />
                {timeline.map((e) => (
                  <div key={e.release.releaseId} className="relative min-w-0 text-center">
                    <p className="text-[10px] text-muted-foreground">{bkk(e.release.nextReleaseUtc, { weekday: "short", day: "numeric", month: "short" })}</p>
                    <p className="num text-xs font-semibold text-primary">{bkk(e.release.nextReleaseUtc, { hour: "2-digit", minute: "2-digit", hour12: false })}</p>
                    <span className={cn("mx-auto my-1 block size-3 rounded-full ring-4", e.release.impact === "High" ? "bg-negative ring-negative/25" : "bg-warning ring-warning/25")} />
                    <p className={cn("rounded-md border px-1.5 py-1 text-[11px] font-medium", IMPACT_STYLE[e.release.impact])}>{eventLabel(e.release.event, lang)}</p>
                  </div>
                ))}
              </div>
            )}
          </Glass>

          <Glass title="Latest & Upcoming Events" icon={<CalendarClock className="size-4" />} action={
            <label className="relative hidden sm:block"><Search className="absolute top-1.5 left-2 size-3 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={th ? "ค้นหาเหตุการณ์…" : "Search event…"} className="w-44 rounded-md border border-border/60 bg-background/40 py-1 pr-2 pl-6 text-[11px]" /></label>
          }>
            <div className="space-y-2">
              {events.length === 0 && <p className="text-xs text-muted-foreground">{th ? "ไม่มีเหตุการณ์ตามตัวกรอง" : "No events match the filters"}</p>}
              {events.slice(0, 12).map((e) => {
                const r = e.release;
                const consensus = e.consensus?.value ?? null;
                const rule = e.assessment;
                const tone = rule?.goldBias === "bullish" ? "text-positive" : rule?.goldBias === "bearish" ? "text-negative" : "text-primary";
                const Icon = rule?.goldBias === "bullish" ? ArrowUp : rule?.goldBias === "bearish" ? ArrowDown : ArrowRight;
                const linked = items.find((n) => n.linkedReleaseId === r.releaseId);
                return (
                  <article key={r.releaseId + r.nextReleaseUtc} className={cn("rounded-lg border bg-background/30 p-2.5", IMPACT_STYLE[r.impact].split(" ")[0])}>
                    <div className="grid min-w-0 gap-2 md:grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] md:items-center">
                      <div className={cn("grid place-items-center rounded-md border px-1 py-2 text-center text-[10px] leading-tight font-bold uppercase", IMPACT_STYLE[r.impact])}>
                        <BarChart3 className="mb-0.5 size-4" />{r.impact}<span className="font-medium">impact</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{eventLabel(r.event, lang)}</h3>
                        <p className="num text-[11px] text-primary">{bkk(r.nextReleaseUtc, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} • {bkk(r.nextReleaseUtc, { hour: "2-digit", minute: "2-digit", hour12: false })} Bangkok</p>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px]"><span className="rounded border border-info/40 px-1.5 text-info">{r.currency ?? "USD"}</span><span className="rounded border border-info/40 px-1.5 text-info">{topicOf(r.event)}</span><span className="rounded border border-border px-1.5 text-muted-foreground">{r.agency}</span></div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        {[[th ? "ก่อนหน้า" : "Previous", fmtVal(r.previousValue, r.unit)], ["Consensus", consensus ?? "—"], ["Actual", r.actualValue != null && r.actualPeriodIso && new Date(r.nextReleaseUtc).getTime() <= now ? fmtVal(r.actualValue, r.unit) : "Pending"]].map(([l, v]) => (
                          <div key={l} className="min-w-16 rounded-md border border-border/60 bg-background/40 px-1.5 py-1"><p className="text-[9px] text-muted-foreground">{l}</p><p className="num text-xs font-semibold">{v}</p></div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("size-5", tone)} />
                        <button type="button" onClick={() => setScenario(scenario === r.releaseId ? null : r.releaseId)} className="rounded-md border border-primary/60 px-2 py-1 text-[11px] text-primary">{th ? "ดูสถานการณ์" : "View Scenario"} →</button>
                      </div>
                    </div>
                    {(linked || scenario === r.releaseId) && (
                      <div className="mt-2 flex gap-2 rounded-md border border-border/50 bg-background/30 px-2 py-1.5 text-[11px]">
                        <Sparkles className="size-3.5 shrink-0 text-info" />
                        <p className="min-w-0 text-foreground/80">
                          {linked ? ((th && linked.rationaleTh) || linked.rationale) : ""}
                          {scenario === r.releaseId && (
                            <span className="block text-muted-foreground">
                              {th ? "ถ้า Actual สูงกว่าคาด → USD แข็ง กดดันทอง · ถ้าต่ำกว่าคาด → USD อ่อน หนุนทอง" : "Actual above forecast → stronger USD, pressure on gold · below → weaker USD, gold support"}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </Glass>
        </div>

        {/* Right rail */}
        <aside className="order-3 min-w-0 space-y-3">
          <Glass title="AURIQ AI News Insight" icon={<Sparkles className="size-4" />} action={fetchedAt ? <span className="text-[10px] text-muted-foreground">{bkk(fetchedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}</span> : undefined}>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border/60 bg-background/40 p-2"><p className="text-[10px] text-muted-foreground">Gold Bias</p><p className={cn("flex items-center gap-1 text-sm font-bold", biasTone)}><BiasIcon className="size-4" />{insight.bias}</p></div>
              <div className="rounded-md border border-border/60 bg-background/40 p-2"><p className="text-[10px] text-muted-foreground">Volatility Risk</p><p className={cn("text-sm font-bold", insight.vol === "High" ? "text-negative" : insight.vol === "Medium" ? "text-warning" : "text-positive")}>{insight.vol}</p></div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px]"><span className="text-muted-foreground">{th ? "ความสอดคล้อง" : "Agreement"}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-accent"><div className="h-full rounded-full bg-info" style={{ width: `${insight.confidence}%` }} /></div><span className="num font-semibold">{insight.confidence}%</span></div>
            <p className="mt-2 text-[10px] text-muted-foreground">{th ? `คำนวณจากข่าวจริง ${insight.n} ข่าว และเหตุการณ์ High impact ภายใน 48 ชม.` : `Computed from ${insight.n} real headlines and High-impact events within 48h.`}</p>
          </Glass>

          <Glass title="Scenario Analysis" icon={<Scale className="size-4" />}>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><p className="mb-1 flex items-center gap-1 font-semibold text-positive"><ArrowUp className="size-3.5" />Bullish for Gold</p>{["Actual < Forecast", th ? "Fed โทน Dovish" : "Dovish Fed", th ? "USD อ่อนค่า" : "Weaker USD", th ? "Yield ลดลง" : "Lower yields"].map((x) => <p key={x} className="flex items-center gap-1 py-0.5"><CheckCircle2 className="size-3 text-positive" />{x}</p>)}</div>
              <div><p className="mb-1 flex items-center gap-1 font-semibold text-negative"><ArrowDown className="size-3.5" />Bearish for Gold</p>{["Actual > Forecast", th ? "Fed โทน Hawkish" : "Hawkish Fed", th ? "USD แข็งค่า" : "Stronger USD", th ? "Yield ปรับขึ้น" : "Higher yields"].map((x) => <p key={x} className="flex items-center gap-1 py-0.5"><XCircle className="size-3 text-negative" />{x}</p>)}</div>
            </div>
          </Glass>

          <Glass title="Trading Plan" icon={<Target className="size-4" />}>
            <ul className="space-y-1.5 text-[11px]">
              <li><b>{th ? "ก่อนข่าว:" : "Before:"}</b> {th ? "ลดขนาดไม้ / ระวัง spread" : "Reduce size / watch spread"}</li>
              <li><b>{th ? "หลังข่าว:" : "After:"}</b> {th ? "รอแท่งยืนยัน 1–2 แท่ง (M5/M15)" : "Wait 1–2 confirmation candles (M5/M15)"}</li>
              <li><b>{th ? "โซนสำคัญ:" : "Key zones:"}</b> <Link to="/" className="text-info hover:underline">{th ? "ดูจากสัญญาณบน Dashboard" : "See Dashboard signal"}</Link></li>
              <li><b>{th ? "แผนเสี่ยง:" : "Risk:"}</b> 1–2% {th ? "ต่อครั้ง" : "per trade"}</li>
            </ul>
          </Glass>

          <Glass title="Impact Legend" icon={<BarChart3 className="size-4" />}>
            {([["High", "bg-negative", "w-4/5"], ["Medium", "bg-warning", "w-1/2"], ["Low", "bg-primary", "w-1/4"]] as const).map(([l, c, w]) => (
              <div key={l} className="flex items-center gap-2 py-0.5 text-[11px]"><span className={cn("size-2.5 rounded-full", c)} /><span className="w-14">{l}</span><div className="h-1.5 flex-1 rounded-full bg-accent"><div className={cn("h-full rounded-full", c, w)} /></div></div>
            ))}
          </Glass>
        </aside>
      </div>

      {/* Bottom */}
      <div className="grid min-w-0 gap-3 lg:grid-cols-3">
        <Glass title="How AURIQ Reads News" icon={<Sparkles className="size-4" />}>
          <ol className="grid grid-cols-2 gap-2 text-[11px]">
            {(th ? ["ตรวจจับเหตุการณ์", "เทียบ Previous / Consensus / Actual", "แปลผล USD / Yield", "แปลงเป็นมุมมองทอง"] : ["Detect event", "Compare Previous / Consensus / Actual", "Interpret USD / Yield", "Convert to gold bias"]).map((s, i) => (
              <li key={s} className="flex items-start gap-1.5"><span className="grid size-5 shrink-0 place-items-center rounded-full border border-info/60 text-[10px] text-info">{i + 1}</span>{s}</li>
            ))}
          </ol>
        </Glass>
        <Glass title="Before News Checklist" icon={<ShieldCheck className="size-4" />}>
          {(th ? ["ตรวจสอบเวลาและความสำคัญของข่าว", "ดูค่าคาดการณ์ (Consensus) ล่าสุด", "เช็กสภาพคล่อง / spread", "ลดขนาด position หากความเสี่ยงสูง"] : ["Check release time and importance", "Review latest consensus", "Check liquidity / spread", "Reduce position if risk is high"]).map((x) => <p key={x} className="flex items-center gap-1.5 py-0.5 text-[11px]"><CheckCircle2 className="size-3 text-positive" />{x}</p>)}
        </Glass>
        <Glass title="After News Checklist" icon={<CheckCircle2 className="size-4" />}>
          {(th ? ["รอแท่งยืนยัน 1–2 แท่ง (M5/M15)", "ดู Actual เทียบกับ Forecast", "ติดตามการเคลื่อนไหวของ USD และ Yield", "บันทึกผลเพื่อพัฒนาการเทรด"] : ["Wait 1–2 confirmation candles", "Compare Actual vs Forecast", "Track USD and yields", "Log the outcome"]).map((x) => <p key={x} className="flex items-center gap-1.5 py-0.5 text-[11px]"><CheckCircle2 className="size-3 text-positive" />{x}</p>)}
        </Glass>
      </div>
    </div>
  );
}
