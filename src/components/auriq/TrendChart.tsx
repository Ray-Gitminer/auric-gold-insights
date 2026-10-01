import type { HistoricalPoint } from "@/lib/economic-calendar/types";

/** Real-data trend line for an indicator (last 24 periods, first print when available). */
export function TrendChart({ history, unit, source }: { history: HistoricalPoint[]; unit?: string; source?: string }) {
  const pts = history.slice(-24).map((p) => ({ d: p.periodIso.slice(0, 7), v: p.firstValue ?? p.value }));
  if (pts.length < 2) return <p className="text-[11px] text-muted-foreground">—</p>;
  const W = 560, H = 140, P = 24;
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => P + (i * (W - 2 * P)) / (pts.length - 1);
  const y = (v: number) => H - P - ((v - min) / span) * (H - 2 * P);
  const line = pts.map((p, i) => `${x(i)},${y(p.v)}`).join(" ");
  const last = pts[pts.length - 1]!, prev = pts[pts.length - 2]!;
  const fmt = (v: number) => `${Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2)}${unit === "%" ? "%" : ""}`;
  return (
    <figure className="min-w-0">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-3 text-[11px]">
        <span className="num font-semibold text-foreground">{fmt(last.v)}</span>
        <span className={last.v >= prev.v ? "num text-positive" : "num text-negative"}>{last.v >= prev.v ? "▲" : "▼"} {fmt(Math.abs(last.v - prev.v))}</span>
        <span className="text-muted-foreground">{pts[0]!.d} → {last.d}</span>
        {source && <span className="ml-auto text-muted-foreground">{source}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full max-w-full" role="img" aria-label="trend">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke="var(--color-border)" strokeDasharray="3 4" />
            <text x={2} y={P + f * (H - 2 * P) + 3} fontSize="9" fill="var(--color-muted-foreground)">{fmt(max - f * span)}</text>
          </g>
        ))}
        {pts.map((p, i) => (
          <rect key={p.d} x={x(i) - 5} y={y(Math.max(p.v, min))} width={10} height={H - P - y(p.v)} fill="var(--color-info)" opacity={0.15} />
        ))}
        <polyline points={line} fill="none" stroke="var(--color-primary)" strokeWidth={2} />
        {pts.map((p, i) => (
          <circle key={p.d} cx={x(i)} cy={y(p.v)} r={i === pts.length - 1 ? 4 : 2} fill="var(--color-primary)"><title>{`${p.d}: ${fmt(p.v)}`}</title></circle>
        ))}
      </svg>
    </figure>
  );
}
