import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, ShieldCheck } from "lucide-react";

import { useI18n } from "@/contexts/I18nContext";
import { StatusBadge } from "@/components/auriq/primitives";

type ImpactEvent = {
  event_name: string;
  scheduled_at: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
};

const W = 920;
const H = 330;
const CURRENT_X = 255;
const CURRENT_Y = 164;

function formatCountdown(target: string, now: number) {
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function NewsImpactMap({
  event,
  currentPrice,
}: {
  event?: ImpactEvent;
  currentPrice?: number | null;
}) {
  const { lang } = useI18n();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const target = event?.scheduled_at ?? new Date(Date.now() + 45 * 60_000).toISOString();
  const eventTime = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(target)),
    [lang, target],
  );
  if (!currentPrice) {
    return (
      <div className="rounded-md border border-info/35 bg-info/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-info" />
          <div>
            <h3 className="text-sm font-semibold">Waiting for verified live XAU/USD market data</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              The simulated price and entry levels have been removed. This map will render only
              after the server-side market-data service supplies a timestamped live price.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const price = currentPrice;
  const levels = {
    buyEntry: price + 4.2,
    buyTarget: price + 15.4,
    sellEntry: price - 4.2,
    sellTarget: price - 15.4,
    upperStop: price + 9.5,
    lowerStop: price - 9.5,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 overflow-hidden rounded-md border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
            <StatusBadge tone="gold">XAU/USD · SIMULATED PRICE</StatusBadge>
            <span className="text-xs text-muted-foreground">
              {event?.event_name ?? "Upcoming US high-impact release"}
            </span>
            <span className="num ml-auto text-xs text-primary">{price.toFixed(1)}</span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[280px] w-full sm:h-[340px]"
            role="img"
            aria-label="Three-scenario news impact map for gold"
          >
            <defs>
              <linearGradient id="impactBuy" x1="0" x2="1">
                <stop offset="0" stopColor="var(--color-positive)" stopOpacity="0.05" />
                <stop offset="1" stopColor="var(--color-positive)" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="impactSell" x1="0" x2="1">
                <stop offset="0" stopColor="var(--color-negative)" stopOpacity="0.05" />
                <stop offset="1" stopColor="var(--color-negative)" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {Array.from({ length: 8 }, (_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 125}
                x2={i * 125}
                y1={0}
                y2={H}
                stroke="var(--color-border)"
                opacity="0.45"
              />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                x2={W}
                y1={i * 55}
                y2={i * 55}
                stroke="var(--color-border)"
                opacity="0.45"
              />
            ))}

            <rect
              x={CURRENT_X - 48}
              y={0}
              width={96}
              height={H}
              fill="var(--color-primary)"
              opacity="0.055"
            />
            <line
              x1={CURRENT_X}
              x2={CURRENT_X}
              y1={0}
              y2={H}
              stroke="var(--color-primary)"
              strokeDasharray="5 4"
            />
            <text
              x={CURRENT_X}
              y={18}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-primary)"
            >
              NEWS RELEASE
            </text>

            <rect
              x={340}
              y={50}
              width={550}
              height={60}
              rx={4}
              fill="url(#impactBuy)"
              stroke="var(--color-positive)"
              strokeOpacity="0.55"
            />
            <rect
              x={340}
              y={220}
              width={550}
              height={60}
              rx={4}
              fill="url(#impactSell)"
              stroke="var(--color-negative)"
              strokeOpacity="0.55"
            />

            <path
              d={`M 20 182 C 90 174, 155 170, ${CURRENT_X} ${CURRENT_Y}`}
              fill="none"
              stroke="var(--color-gold-bright)"
              strokeWidth="2"
            />
            <path
              d={`M ${CURRENT_X} ${CURRENT_Y} C 330 150, 405 82, 520 76 S 760 66, 888 58`}
              fill="none"
              stroke="var(--color-positive)"
              strokeWidth="3"
            />
            <path
              d={`M ${CURRENT_X} ${CURRENT_Y} C 360 158, 440 166, 555 160 S 760 165, 888 152`}
              fill="none"
              stroke="var(--color-info)"
              strokeWidth="2.5"
              strokeDasharray="7 5"
            />
            <path
              d={`M ${CURRENT_X} ${CURRENT_Y} C 330 185, 405 245, 520 253 S 760 264, 888 278`}
              fill="none"
              stroke="var(--color-negative)"
              strokeWidth="3"
            />

            <circle cx={CURRENT_X} cy={CURRENT_Y} r={5} fill="var(--color-gold-bright)" />
            <text
              x={CURRENT_X - 10}
              y={CURRENT_Y - 12}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-gold-bright)"
            >
              CURRENT {price.toFixed(1)}
            </text>
            <text x={360} y={43} fontSize="11" fill="var(--color-positive)">
              GOLD POSITIVE · BUY only after confirmation
            </text>
            <text x={360} y={151} fontSize="11" fill="var(--color-info)">
              INLINE · WAIT / NO TRADE
            </text>
            <text x={360} y={213} fontSize="11" fill="var(--color-negative)">
              GOLD NEGATIVE · SELL only after confirmation
            </text>
            <text x={888} y={48} textAnchor="end" fontSize="10" fill="var(--color-positive)">
              TP {levels.buyTarget.toFixed(1)}
            </text>
            <text x={888} y={294} textAnchor="end" fontSize="10" fill="var(--color-negative)">
              TP {levels.sellTarget.toFixed(1)}
            </text>
          </svg>
        </div>

        <aside className="space-y-3 rounded-md border border-border bg-surface p-3">
          <div>
            <p className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
              Event countdown
            </p>
            <p className="num mt-1 text-2xl font-semibold text-primary">
              {now ? formatCountdown(target, now) : "--:--:--"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{eventTime} · Asia/Bangkok</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-border p-2">
              <span className="text-muted-foreground">Forecast</span>
              <p className="num mt-1">{event?.forecast ?? "Pending"}</p>
            </div>
            <div className="rounded border border-border p-2">
              <span className="text-muted-foreground">Previous</span>
              <p className="num mt-1">{event?.previous ?? "Pending"}</p>
            </div>
          </div>
          <div className="space-y-2 border-t border-border pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-positive">BUY trigger</span>
              <span className="num">&gt; {levels.buyEntry.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-negative">SELL trigger</span>
              <span className="num">&lt; {levels.sellEntry.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Risk boundary</span>
              <span className="num">± {Math.abs(levels.upperStop - price).toFixed(1)}</span>
            </div>
          </div>
          <div className="rounded border border-info/35 bg-info/5 p-2 text-[11px] leading-relaxed text-muted-foreground">
            <Clock3 className="mr-1 inline size-3 text-info" /> 5–10 minutes before release:
            scenario planning only.
          </div>
        </aside>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-positive/35 bg-positive/5 p-3 text-xs">
          <strong className="text-positive">VALID</strong>
          <p className="mt-1 text-muted-foreground">
            Actual surprise, spread normal and candle closes beyond trigger.
          </p>
        </div>
        <div className="rounded-md border border-primary/35 bg-primary/5 p-3 text-xs">
          <strong className="text-primary">WAITING</strong>
          <p className="mt-1 text-muted-foreground">
            Before release or first candle has not confirmed direction.
          </p>
        </div>
        <div className="rounded-md border border-negative/35 bg-negative/5 p-3 text-xs">
          <strong className="text-negative">NO TRADE</strong>
          <p className="mt-1 text-muted-foreground">
            Wide spread, conflicting data or confidence below threshold.
          </p>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-md border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>
          <strong className="text-foreground">Human confirmation required.</strong> This prototype
          never sends an order. Entry levels use simulated fixture price until the market-data
          service is connected.
        </span>
      </p>
      <p className="sr-only">
        <AlertTriangle /> Trading around economic releases can involve abnormal spread and slippage.
      </p>
    </div>
  );
}
