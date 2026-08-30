import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { candlesByTimeframe, instrument, type Candle } from "@/data/fixtures";
import { num } from "@/lib/format";

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1D"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

const W = 900;
const H = 320;
const PAD_R = 62;
const PAD_B = 26;
const PAD_T = 10;

function useScale(candles: Candle[]) {
  return useMemo(() => {
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const max = Math.max(...highs) * 1.01;
    const min = Math.min(...lows) * 0.99;
    const y = (p: number) => PAD_T + ((max - p) / (max - min)) * (H - PAD_T - PAD_B);
    const slot = (W - PAD_R) / candles.length;
    const x = (i: number) => i * slot + slot / 2;
    return { min, max, y, x, slot };
  }, [candles]);
}

export function GoldChart({
  timeframe,
  onTimeframeChange,
  compact = false,
}: {
  timeframe: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const candles = candlesByTimeframe[timeframe] ?? candlesByTimeframe["1D"]!;
  const { y, x, slot } = useScale(candles);
  const last = candles[candles.length - 1]!;
  const priceTicks = useMemo(() => {
    const highs = candles.map((c) => c.h);
    const lows = candles.map((c) => c.l);
    const max = Math.max(...highs) * 1.01;
    const min = Math.min(...lows) * 0.99;
    return Array.from({ length: 6 }, (_, i) => min + ((max - min) * i) / 5);
  }, [candles]);

  return (
    <div className="flex flex-col">
      {onTimeframeChange ? (
        <div
          className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-2"
          role="tablist"
          aria-label={t("chart.timeframe")}
        >
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={tf === timeframe}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "num rounded-sm px-2.5 py-1 text-xs transition-colors",
                tf === timeframe
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              {tf}
            </button>
          ))}
          <span className="ml-auto pr-2 text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {t("chart.staticDemo")}
          </span>
        </div>
      ) : null}

      <div className="grid-texture relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={cn("w-full", compact ? "h-48" : "h-[300px] sm:h-[380px]")}
          role="img"
          aria-label={t("chart.aria", { label: instrument.label, tf: timeframe, price: num(instrument.last, 1) })}
        >
          {/* session shading */}
          <rect x={0} y={PAD_T} width={(W - PAD_R) * 0.32} height={H - PAD_T - PAD_B} fill="var(--color-info)" opacity={0.04} />
          <rect
            x={(W - PAD_R) * 0.66}
            y={PAD_T}
            width={(W - PAD_R) * 0.34}
            height={H - PAD_T - PAD_B}
            fill="var(--color-info)"
            opacity={0.04}
          />

          {/* price grid + scale */}
          {priceTicks.map((p) => (
            <g key={p}>
              <line x1={0} x2={W - PAD_R} y1={y(p)} y2={y(p)} stroke="var(--color-border)" strokeWidth={0.5} opacity={0.6} />
              <text x={W - PAD_R + 6} y={y(p) + 3.5} fontSize={10} fill="var(--color-muted-foreground)" fontFamily="var(--font-mono)">
                {num(p, 1)}
              </text>
            </g>
          ))}

          {/* support / resistance */}
          {instrument.resistance.map((r) => (
            <g key={r.label}>
              <line
                x1={(W - PAD_R) * 0.55}
                x2={W - PAD_R}
                y1={y(r.value)}
                y2={y(r.value)}
                stroke="var(--color-negative)"
                strokeWidth={1}
                strokeDasharray="5 4"
                opacity={0.8}
              />
              <text x={(W - PAD_R) * 0.55 + 4} y={y(r.value) - 4} fontSize={10} fill="var(--color-negative)" fontFamily="var(--font-mono)">
                {r.label} {num(r.value, 1)}
              </text>
            </g>
          ))}
          {instrument.support.map((s) => (
            <g key={s.label}>
              <line
                x1={(W - PAD_R) * 0.55}
                x2={W - PAD_R}
                y1={y(s.value)}
                y2={y(s.value)}
                stroke="var(--color-positive)"
                strokeWidth={1}
                strokeDasharray="5 4"
                opacity={0.8}
              />
              <text x={(W - PAD_R) * 0.55 + 4} y={y(s.value) - 4} fontSize={10} fill="var(--color-positive)" fontFamily="var(--font-mono)">
                {s.label} {num(s.value, 1)}
              </text>
            </g>
          ))}

          {/* candles */}
          {candles.map((c, i) => {
            const up = c.c >= c.o;
            const colour = up ? "var(--color-primary)" : "var(--color-negative)";
            const bodyTop = y(Math.max(c.o, c.c));
            const bodyH = Math.max(1, Math.abs(y(c.o) - y(c.c)));
            return (
              <g key={c.t}>
                <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} stroke={colour} strokeWidth={0.9} opacity={0.85} />
                <rect
                  x={x(i) - slot * 0.3}
                  y={bodyTop}
                  width={slot * 0.6}
                  height={bodyH}
                  fill={up ? colour : "var(--color-negative)"}
                  opacity={up ? 0.9 : 0.85}
                />
                {c.event ? (
                  <g>
                    <rect x={x(i) - 6} y={y(c.h) - 18} width={12} height={12} rx={2} fill="var(--color-info)" opacity={0.18} stroke="var(--color-info)" strokeWidth={0.6} />
                    <text x={x(i)} y={y(c.h) - 9} fontSize={8} textAnchor="middle" fill="var(--color-info)">
                      N
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* current price line */}
          <line
            x1={0}
            x2={W - PAD_R}
            y1={y(last.c)}
            y2={y(last.c)}
            stroke="var(--color-gold-bright)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <rect x={W - PAD_R + 1} y={y(last.c) - 8} width={PAD_R - 2} height={16} rx={2} fill="var(--color-gold-bright)" />
          <text
            x={W - PAD_R + 6}
            y={y(last.c) + 4}
            fontSize={10}
            fill="var(--color-background)"
            fontFamily="var(--font-mono)"
            fontWeight={600}
          >
            {num(last.c, 1)}
          </text>

          {/* time scale */}
          {[0, 0.25, 0.5, 0.75, 0.98].map((f) => {
            const i = Math.floor(f * (candles.length - 1));
            return (
              <text
                key={f}
                x={x(i)}
                y={H - 8}
                fontSize={10}
                textAnchor="middle"
                fill="var(--color-muted-foreground)"
                fontFamily="var(--font-mono)"
              >
                {candles[i]!.t}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export { TIMEFRAMES };
