import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Globe, RefreshCw } from "lucide-react";

import { num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { GoldChart, type Timeframe } from "@/components/auriq/GoldChart";
import { usePublicGold } from "@/hooks/use-public-gold";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

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
