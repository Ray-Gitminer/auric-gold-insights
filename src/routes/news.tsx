import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ExternalLink, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { useNewsIntelligence } from "@/hooks/use-news-intelligence";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News Intelligence · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Live RSS headlines with named sources and timestamps, scored for gold relevance against the AURIQ economic calendar.",
      },
      { property: "og:title", content: "News Intelligence · AURIQ" },
      {
        property: "og:description",
        content: "Live sourced headlines analysed against US economic releases for gold impact.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: News,
});

function formatPublished(iso: string): string {
  const d = new Date(iso);
  return `${d.toUTCString().slice(5, 22)} UTC`;
}

function News() {
  const { t, lang } = useI18n();
  const {
    items,
    calendarEvents,
    sources,
    analysisMode,
    fetchedAt,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useNewsIntelligence();

  const linkedEvent = (id: string | null) =>
    id ? calendarEvents.find((e) => e.release.releaseId === id) : undefined;

  return (
    <>
      <PageHeader
        title={t("news.title")}
        description={t("news.desc")}
        dataTag={<StatusBadge tone="positive">{t("common.liveOfficialData")}</StatusBadge>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <AdvisoryTag />
            <StatusBadge tone={analysisMode === "AI" ? "info" : "neutral"}>
              {analysisMode === "AI" ? t("news.modeAi") : t("news.modeHeuristic")}
            </StatusBadge>
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn("size-3", isFetching && "animate-spin")} aria-hidden />
              {t("news.refresh")}
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {sources.map((s) => (
          <span
            key={s.name}
            className={cn(
              "rounded-full border px-2 py-0.5",
              s.ok ? "border-border" : "border-negative/50 text-negative",
            )}
          >
            {s.name} · {s.count}
          </span>
        ))}
        {fetchedAt && (
          <span className="num">
            {t("news.fetchedAt")} {formatPublished(fetchedAt)}
          </span>
        )}
      </div>

      {isLoading && (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          {t("common.loading")}
        </p>
      )}

      {!isLoading && isError && items.length === 0 && (
        <p className="rounded-md border border-negative/50 bg-card px-4 py-6 text-sm text-negative">
          {t("news.error")}
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className="rounded-md border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          {t("news.empty")}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((n) => {
          const linked = linkedEvent(n.linkedReleaseId);
          return (
            <PanelCard
              key={n.id}
              title={(lang === "th" && n.headlineTh) || n.headline}
              subtitle={`${n.source} · ${formatPublished(n.publishedIso)}`}
              action={
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-info hover:underline"
                >
                  {t("news.source")} <ExternalLink className="size-3" aria-hidden />
                </a>
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={
                    n.direction === "Bullish"
                      ? "positive"
                      : n.direction === "Bearish"
                        ? "negative"
                        : "neutral"
                  }
                >
                  {n.direction}
                </StatusBadge>
                <StatusBadge tone="info">
                  {t("common.confidence")} {n.confidence}
                </StatusBadge>
                <StatusBadge tone="neutral">{n.horizon}</StatusBadge>
                <StatusBadge tone={n.dedup === "Unique" ? "gold" : "neutral"}>
                  {n.dedup}
                </StatusBadge>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{t("news.relevance")}</span>
                  <span className="num">{n.relevance}/100</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-accent">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      n.relevance > 70 ? "bg-primary" : "bg-info",
                    )}
                    style={{ width: `${n.relevance}%` }}
                  />
                </div>
              </div>

              {lang === "th" && n.headlineTh && (
                <p className="mt-2 text-[11px] text-muted-foreground/80">{n.headline}</p>
              )}

              {(lang === "th" && n.rationaleTh) || n.rationale ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {(lang === "th" && n.rationaleTh) || n.rationale}
                </p>
              ) : null}

              {linked && (
                <Link
                  to="/economic-calendar"
                  className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-accent/40 px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <CalendarClock className="size-3 text-primary" aria-hidden />
                  <span className="text-foreground">{linked.release.event}</span>
                  <span className="num">
                    {t("ec.forecast")} {linked.forecast.value}
                  </span>
                  {linked.release.actual && (
                    <span className="num">
                      {t("ec.actual")} {linked.release.actual}
                    </span>
                  )}
                  {linked.assessment && (
                    <span
                      className={cn(
                        "num",
                        linked.assessment.goldBias === "bullish" && "text-positive",
                        linked.assessment.goldBias === "bearish" && "text-negative",
                      )}
                    >
                      {linked.assessment.surprisePct > 0 ? "+" : ""}
                      {linked.assessment.surprisePct}%
                    </span>
                  )}
                </Link>
              )}

              <div className="mt-3 border-t border-border pt-2">
                <p className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                  {t("news.citations")}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {n.citations.map((c) => (
                    <li key={c} className="text-[11px] text-info">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </PanelCard>
          );
        })}
      </div>

      <p className="rounded-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        {t("news.footer")}
      </p>
    </>
  );
}
