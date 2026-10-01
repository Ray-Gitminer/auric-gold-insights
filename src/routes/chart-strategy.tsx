import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { instrument, strategy } from "@/data/fixtures";
import { num, pct, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { useMt5Candles } from "@/hooks/use-mt5-candles";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/chart-strategy")({
  head: () => ({
    meta: [
      { title: "Chart & Strategy · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Multi-timeframe gold chart workspace with an explicit setup state machine and pass/fail strategy conditions.",
      },
      { property: "og:title", content: "Chart & Strategy · AURIQ" },
      {
        property: "og:description",
        content: "Multi-timeframe workspace and setup state machine — demo data.",
      },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChartStrategy,
});

const STATE_KEYS = ["WAITING", "VALID", "INVALID", "TRIGGERED"] as const;

function ChartStrategy() {
  const [primary, setPrimary] = useState<Timeframe>("1D");
  const { t, tx } = useI18n();
  const primaryCandles = useMt5Candles(primary);
  const live = Boolean(primaryCandles.data?.length);

  const STATES = STATE_KEYS.map((state) => ({
    state,
    detail: t(`state.${state}.detail` as const),
  }));

  return (
    <>
      <PageHeader
        title={t("cs.title")}
        description={t("cs.desc")}
        actions={
          <StatusBadge tone="gold">
            {t("common.setup")}: {strategy.state}
          </StatusBadge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <PanelCard
            title={instrument.label}
            subtitle={`${instrument.exchange} · ${t("cs.primary", { tf: primary })}`}
            action={
              <span className={cn("num text-sm", toneFor(instrument.change))}>
                {num(instrument.last, 1)} ({pct(instrument.changePct)})
              </span>
            }
            bodyClassName="p-0"
          >
            <GoldChart
              timeframe={primary}
              onTimeframeChange={setPrimary}
              candlesOverride={primaryCandles.data}
              live={live}
            />
          </PanelCard>

          <div className="grid gap-4 lg:grid-cols-3">
            {(["1h", "4h", "1D"] as Timeframe[]).map((tf) => (
              <PanelCard key={tf} title={t("cs.context", { tf })} bodyClassName="p-0">
                <LiveContextChart timeframe={tf} />
              </PanelCard>
            ))}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <PanelCard title={t("cs.stateMachine")}>
            <ol className="space-y-2">
              {STATES.map((s) => (
                <li
                  key={s.state}
                  className={cn(
                    "rounded-sm border px-3 py-2",
                    s.state === strategy.state
                      ? "border-primary/50 bg-primary/10"
                      : "border-border",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-semibold tracking-[0.1em] uppercase",
                      s.state === strategy.state ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {t(`state.${s.state}` as const)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.detail}</p>
                </li>
              ))}
            </ol>
          </PanelCard>

          <PanelCard title={t("cs.conditions")} subtitle={tx(strategy.name)}>
            <ul className="space-y-2">
              {strategy.conditions.map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 size-1.5 shrink-0 rounded-full",
                      c.pass ? "bg-positive" : "bg-negative",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{tx(c.label)}</p>
                    <p className="num text-[11px] text-muted-foreground">{tx(c.detail)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard title={t("cs.keyLevels")}>
            <ul className="space-y-1.5 text-xs">
              {instrument.resistance.map((r) => (
                <li key={r.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("cs.resistance", { label: r.label })}
                  </span>
                  <span className="num text-negative">{num(r.value, 1)}</span>
                </li>
              ))}
              {instrument.support.map((s) => (
                <li key={s.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {t("cs.support", { label: s.label })}
                  </span>
                  <span className="num text-positive">{num(s.value, 1)}</span>
                </li>
              ))}
            </ul>
          </PanelCard>
        </aside>
      </div>
    </>
  );
}

function LiveContextChart({ timeframe }: { timeframe: Timeframe }) {
  const candles = useMt5Candles(timeframe);
  return (
    <GoldChart
      timeframe={timeframe}
      compact
      candlesOverride={candles.data}
      live={Boolean(candles.data?.length)}
    />
  );
}
