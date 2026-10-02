import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Globe, RefreshCw } from "lucide-react";

import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { usePublicGold } from "@/hooks/use-public-gold";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import { supabase } from "@/integrations/supabase/client";
import { fetchXauCandles } from "@/lib/market/twelve-data.functions";

export const Route = createFileRoute("/market-data")({
  head: () => ({
    meta: [
      { title: "Market Data · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Live XAUUSD gold chart from a free public price feed, with clear source attribution and no account connection required.",
      },
      { property: "og:title", content: "Market Data · AURIQ" },
      {
        property: "og:description",
        content: "XAUUSD chart from a free public feed — no signup, no broker account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketDataPage,
});

function bangkokTime(timestamp: number): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

type M5Row = { timestamp: string; open: number; high: number; low: number; close: number };

function TwelveDataTest() {
  const [busy, setBusy] = useState(false);
  const [row, setRow] = useState<M5Row | null>(null);
  const [status, setStatus] = useState<"idle" | "live" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const result = await fetchXauCandles();
      const { data, error } = await supabase
        .from("market_candles_m5" as never)
        .select("timestamp,open,high,low,close")
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      const latest = (data as M5Row | null) ?? null;
      setRow(latest);
      const fresh = latest && Date.now() - new Date(latest.timestamp).getTime() < 30 * 60_000;
      if (!result.ok) { setStatus("error"); setMessage(result.error); }
      else if (error || !latest) { setStatus("error"); setMessage("Could not read latest candle"); }
      else if (!fresh) { setStatus("error"); setMessage("Latest candle is stale (market may be closed)"); }
      else { setStatus("live"); setMessage(`Upserted ${result.upserted} candles`); }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed (sign in required)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PanelCard
      title="Twelve Data · XAU/USD M5"
      action={status === "idle" ? undefined : <StatusBadge tone={status === "live" ? "gold" : "negative"}>{status === "live" ? "LIVE" : "ERROR"}</StatusBadge>}
    >
      <div className="space-y-2 text-xs">
        <button type="button" onClick={run} disabled={busy} className="rounded-sm border border-primary/40 px-3 py-1.5 text-primary disabled:opacity-50">
          {busy ? "…" : "Test Twelve Data"}
        </button>
        {row ? (
          <p className="num text-muted-foreground">
            {new Date(row.timestamp).toISOString().replace("T", " ").slice(0, 16)} UTC · O {num(row.open, 2)} H {num(row.high, 2)} L {num(row.low, 2)} C {num(row.close, 2)}
          </p>
        ) : null}
        {message ? <p className={status === "error" ? "text-negative" : "text-muted-foreground"}>{message}</p> : null}
      </div>
    </PanelCard>
  );
}

function MarketDataPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const { t } = useI18n();
  const query = usePublicGold(timeframe);
  const feed = query.data?.feed ?? null;
  const candles = query.data?.candles ?? [];
  const last = candles[candles.length - 1];

  return (
    <>
      <PageHeader
        title={t("md.title")}
        description={t("md.desc")}
        actions={
          feed ? (
            <StatusBadge tone="gold">
              <Globe className="size-3" aria-hidden />
              {feed.source}
            </StatusBadge>
          ) : undefined
        }
      />

      <PanelCard
        title={t("md.chartTitle")}
        subtitle={feed ? `${t("md.updated")} ${bangkokTime(feed.fetchedAt)} ICT` : t("md.loading")}
        action={
          last ? (
            <span className="num text-sm text-primary">{num(last.c, 2)}</span>
          ) : undefined
        }
        bodyClassName="p-0"
      >
        {query.isError ? (
          <div className="grid h-[300px] place-items-center px-6 text-center sm:h-[360px]">
            <div>
              <p className="text-sm font-semibold text-negative">{t("md.error")}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{t("md.errorHint")}</p>
            </div>
          </div>
        ) : (
          <GoldChart
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            candlesOverride={candles}
            live={candles.length > 1}
            allowFallback={false}
            emptyLabel={t("md.loading")}
            statusLabel={feed ? `${feed.source} · ${t("md.publicFeed")}` : t("md.loading")}
          />
        )}
      </PanelCard>

      <TwelveDataTest />

      <PanelCard title={t("md.sourceTitle")}>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <Globe className="mt-0.5 size-3.5 shrink-0 text-info" aria-hidden />
            <span>
              {t("md.sourceLine")}{" "}
              {feed ? (
                <a
                  href={feed.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-info underline-offset-2 hover:underline"
                >
                  {feed.sourceUrl}
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <RefreshCw className={cn("mt-0.5 size-3.5 shrink-0 text-primary", query.isFetching && "animate-spin")} aria-hidden />
            <span>{t("md.refreshLine")}</span>
          </li>
          <li className="rounded-sm border border-primary/30 bg-primary/8 px-3 py-2 text-primary">
            {t("md.disclaimer")}
          </li>
        </ul>
      </PanelCard>
    </>
  );
}
