import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ExternalLink, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { useNewsIntelligence } from "@/hooks/use-news-intelligence";
import type { NewsCategory, NewsImpactLevel } from "@/lib/news/types";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/economic-news")({
  head: () => ({
    meta: [
      { title: "Economic News · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Named-source economic headlines filtered by topic and gold impact, dispatched automatically 24 hours before each US release.",
      },
      { property: "og:title", content: "Economic News · AURIQ" },
      {
        property: "og:description",
        content:
          "Real economic headlines with source and timestamp, filtered by category and impact level.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EconomicNews,
});

const CATEGORIES: NewsCategory[] = [
  "Monetary policy",
  "Inflation",
  "Employment",
  "Growth",
  "Geopolitics",
  "Gold market",
];

const IMPACTS: NewsImpactLevel[] = ["High", "Medium", "Low"];

function formatPublished(iso: string): string {
  const d = new Date(iso);
  return `${d.toUTCString().slice(5, 22)} UTC`;
}

function countdown(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function EconomicNews() {
  const { t } = useI18n();
  const {
    items,
    schedule,
    sources,
    analysisMode,
    fetchedAt,
    isLoading,
    isFetching,
    isError,
    refetch,
    calendarEvents,
  } = useNewsIntelligence();

  const [category, setCategory] = useState<NewsCategory | "All">("All");
  const [impact, setImpact] = useState<NewsImpactLevel | "All">("All");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === "All" || i.category === category) &&
          (impact === "All" || i.impactLevel === impact),
      ),
    [items, category, impact],
  );

  const upcoming = schedule.slice(0, 8);
  const linkedEvent = (id: string | null) =>
    id ? calendarEvents.find((e) => e.release.releaseId === id) : undefined;

  return (
    <>
      <PageHeader
        title={t("enews.title")}
        description={t("enews.desc")}
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

      <PanelCard title={t("enews.scheduleTitle")} subtitle={t("enews.scheduleSub")}>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {upcoming.map((s) => (
            <li
              key={s.releaseId}
              className="flex min-w-0 flex-col gap-1 rounded-md border border-border bg-surface p-2.5 text-xs"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 truncate font-medium">{s.event}</span>
              </div>
              <span className="num text-muted-foreground">
                {new Intl.DateTimeFormat("en-GB", {
                  timeZone: "Asia/Bangkok",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).format(new Date(s.nextReleaseUtc))}{" "}
                ICT
              </span>
              <StatusBadge tone={s.status === "dispatched" ? "positive" : "neutral"}>
                {s.status === "dispatched"
                  ? t("enews.dispatched")
                  : `${t("enews.dispatchIn")} ${countdown(s.msUntilDispatch)}`}
              </StatusBadge>
            </li>
          ))}
          {upcoming.length === 0 ? (
            <li className="text-xs text-muted-foreground">{t("enews.noSchedule")}</li>
          ) : null}
        </ul>
      </PanelCard>

      <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("enews.filterCategory")}>
          <span className="text-xs text-muted-foreground">{t("enews.filterCategory")}</span>
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c as NewsCategory | "All")}
              aria-pressed={category === c}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs transition-colors",
                category === c
                  ? "border-primary/50 bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "All" ? t("ec.all") : t(`enews.cat.${c}` as "enews.cat.Inflation")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("ec.filterImpact")}>
          <span className="text-xs text-muted-foreground">{t("ec.filterImpact")}</span>
          {(["All", ...IMPACTS] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setImpact(i as NewsImpactLevel | "All")}
              aria-pressed={impact === i}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs transition-colors",
                impact === i
                  ? "border-primary/50 bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {i === "All"
                ? t("ec.all")
                : i === "High"
                  ? t("ec.high")
                  : i === "Medium"
                    ? t("ec.medium")
                    : t("ec.low")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PanelCard>
          <p className="text-sm text-muted-foreground">{t("news.loading")}</p>
        </PanelCard>
      ) : isError ? (
        <PanelCard>
          <p className="text-sm text-negative">{t("news.error")}</p>
        </PanelCard>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => {
            const linked = linkedEvent(item.linkedReleaseId);
            return (
              <article
                key={item.id}
                className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-card p-3"
              >
                <header className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <StatusBadge
                    tone={
                      item.impactLevel === "High"
                        ? "negative"
                        : item.impactLevel === "Medium"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {item.impactLevel === "High"
                      ? t("ec.high")
                      : item.impactLevel === "Medium"
                        ? t("ec.medium")
                        : t("ec.low")}
                  </StatusBadge>
                  <StatusBadge tone="info">
                    {t(`enews.cat.${item.category}` as "enews.cat.Inflation")}
                  </StatusBadge>
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {item.source}
                  </span>
                  <span className="num">{formatPublished(item.publishedIso)}</span>
                </header>

                <h2 className="min-w-0 text-sm leading-snug font-semibold">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 hover:text-primary"
                  >
                    <span className="min-w-0">{item.headline}</span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden />
                  </a>
                </h2>

                {item.rationale ? (
                  <p className="text-xs text-muted-foreground">{item.rationale}</p>
                ) : null}

                <footer className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      item.direction === "Bullish" && "text-positive",
                      item.direction === "Bearish" && "text-negative",
                    )}
                  >
                    {item.direction}
                  </span>
                  <span className="num">{item.relevance}/100</span>
                  {linked ? (
                    <Link
                      to="/economic-calendar"
                      className="inline-flex items-center gap-1 text-info hover:underline"
                    >
                      <CalendarClock className="size-3" aria-hidden />
                      {linked.release.event}
                    </Link>
                  ) : null}
                </footer>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <PanelCard>
              <p className="text-sm text-muted-foreground">{t("enews.noMatch")}</p>
            </PanelCard>
          ) : null}
        </div>
      )}

      <PanelCard title={t("news.sources")}>
        <ul className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          {sources.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span
                className={cn("size-1.5 rounded-full", s.ok ? "bg-positive" : "bg-negative")}
                aria-hidden
              />
              {s.name} · {s.count}
            </li>
          ))}
        </ul>
        {fetchedAt ? (
          <p className="num mt-2 text-[11px] text-muted-foreground">
            {t("news.updated")}: {formatPublished(fetchedAt)}
          </p>
        ) : null}
      </PanelCard>
    </>
  );
}
