import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ExternalLink } from "lucide-react";

import { news } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { useNewsIntelligence } from "@/hooks/use-news-intelligence";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import { NewsImpactMap } from "@/components/auriq/NewsImpactMap";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News Intelligence · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Permitted RSS headlines with deduplication status, gold relevance, direction, horizon, confidence, rationale and citations.",
      },
      { property: "og:title", content: "News Intelligence · AURIQ" },
      {
        property: "og:description",
        content: "Sourced headlines with transparent AI rationale and citations — demo data.",
      },
    ],
  }),
  component: News,
});

function News() {
  const { lang, t } = useI18n();
  const intelligence = useNewsIntelligence();
  const events = intelligence.data?.events ?? [];
  const officialItems = intelligence.data?.items ?? [];
  const brief = intelligence.data?.brief;
  const now = Date.now();
  const nextEvent =
    events.find((event) => new Date(event.scheduled_at).getTime() >= now) ?? events[0];
  const dateFormatter = new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <PageHeader title={t("news.title")} description={t("news.desc")} actions={<AdvisoryTag />} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <PanelCard
          title={t("news.weeklyTimeline")}
          subtitle={t("news.weeklyTimelineDesc")}
          action={<StatusBadge tone="positive">{t("news.officialData")}</StatusBadge>}
          bodyClassName="p-0"
        >
          {events.length ? (
            <ol className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[160px_1fr_auto]">
                  <time className="num text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(event.scheduled_at))}
                  </time>
                  <div>
                    <p className="text-sm font-medium">{event.event_name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {event.source_name} · USD
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <StatusBadge tone={event.importance === 3 ? "negative" : "gold"}>
                      Impact {event.importance}/3
                    </StatusBadge>
                    <StatusBadge tone={event.status === "released" ? "positive" : "neutral"}>
                      {event.status === "released" ? "Released" : t("news.awaitingRelease")}
                    </StatusBadge>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
              {intelligence.isLoading ? "Loading…" : t("news.noOfficialEvents")}
            </div>
          )}
        </PanelCard>

        <PanelCard title={t("news.weeklyBrief")}>
          {brief ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={
                    brief.gold_bias === "bullish"
                      ? "positive"
                      : brief.gold_bias === "bearish"
                        ? "negative"
                        : "neutral"
                  }
                >
                  GOLD · {brief.gold_bias.toUpperCase()}
                </StatusBadge>
                <StatusBadge tone="info">
                  {t("common.confidence")} {brief.confidence}%
                </StatusBadge>
              </div>
              <h3 className="text-sm font-semibold">{brief.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{brief.narrative}</p>
              {brief.next_catalyst && (
                <p className="rounded-sm border border-border bg-surface p-2 text-xs">
                  Next: {brief.next_catalyst}
                </p>
              )}
              <p className="text-[11px] text-negative">{brief.risk_note}</p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("news.briefPending")}
            </p>
          )}
        </PanelCard>
      </div>

      <PanelCard
        title={t("news.impactMap")}
        subtitle={t("news.impactMapDesc")}
        action={<StatusBadge tone="gold">LIVE DATA REQUIRED · NO AUTO TRADE</StatusBadge>}
      >
        <NewsImpactMap event={nextEvent} />
      </PanelCard>

      {officialItems.length > 0 && (
        <PanelCard
          title={t("news.officialHeadlines")}
          subtitle={t("news.officialHeadlinesDesc")}
          action={<StatusBadge tone="positive">SUPABASE · LIVE DATA</StatusBadge>}
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {officialItems.slice(0, 8).map((item) => (
              <li
                key={item.id}
                className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center"
              >
                <div className="min-w-0">
                  <a
                    href={item.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 text-sm font-medium hover:text-info"
                  >
                    {item.headline}
                    <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden />
                  </a>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.summary || item.source_name}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-info">{item.source_name}</p>
                  <time className="num text-[11px] text-muted-foreground">
                    {dateFormatter.format(new Date(item.published_at))}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </PanelCard>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">{t("news.demoAnalysis")}</h2>
          <StatusBadge tone="neutral">DEMO</StatusBadge>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {news.map((n) => (
            <PanelCard
              key={n.id}
              title={n.headline}
              subtitle={`${n.source} · ${n.published}`}
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

              <p className="mt-3 text-xs text-muted-foreground">{n.rationale}</p>

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
          ))}
        </div>
      </div>

      <p className="rounded-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        {t("news.footer")}
      </p>
    </>
  );
}
