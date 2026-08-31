import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { useEconomicCalendar } from "@/hooks/use-economic-calendar";
import { IMPACT_RULES } from "@/lib/economic-calendar/impact-engine";
import type { CalendarEvent, ImpactAssessment } from "@/lib/economic-calendar/types";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import {
  ActualBadge,
  ForecastBadge,
  ImpactDots,
  SurprisePill,
} from "@/components/auriq/CalendarBadges";

export const Route = createFileRoute("/economic-calendar")({
  head: () => ({
    meta: [
      { title: "Economic Calendar — AURIQ Gold Intelligence" },
      {
        name: "description",
        content:
          "US economic release schedule with official actuals, AURIQ statistical estimates, sourced market consensus and post-release gold impact assessment.",
      },
      { property: "og:title", content: "Economic Calendar — AURIQ Gold Intelligence" },
      {
        property: "og:description",
        content:
          "Official schedule, AURIQ Estimate model output and gold/USD bias for every US macro release.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EconomicCalendarPage,
});

type ImpactFilter = "All" | "High" | "Medium" | "Low";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function dayLabel(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function biasTone(bias: ImpactAssessment["goldBias"]) {
  return bias === "bullish"
    ? "text-positive"
    : bias === "bearish"
      ? "text-negative"
      : "text-muted-foreground";
}

function EventCard({ item }: { item: CalendarEvent }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const { release, forecast, estimate, assessment } = item;

  const rule = IMPACT_RULES[release.event];
  const rationale = assessment
    ? t("ec.rationaleText", {
        event: release.event,
        dir:
          assessment.surpriseDir === "beat"
            ? t("ec.beat")
            : assessment.surpriseDir === "miss"
              ? t("ec.miss")
              : t("ec.inline"),
        pct: Math.abs(assessment.surprisePct),
        rule: rule?.bullishIfBelow === false ? t("ec.ruleBullishAbove") : t("ec.ruleBullishBelow"),
        gold: t(`ec.${assessment.goldBias}` as "ec.bullish"),
        usd:
          assessment.usdBias === "strong"
            ? t("ec.usdStrong")
            : assessment.usdBias === "weak"
              ? t("ec.usdWeak")
              : t("ec.usdNeutral"),
      })
    : null;

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-md border border-border bg-card p-3">
      <header className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="num text-xs text-muted-foreground">{release.time} UTC</span>
        <ImpactDots impact={release.impact} />
        <h3 className="min-w-0 flex-1 text-sm leading-snug font-semibold">{release.event}</h3>
      </header>

      <dl className="grid gap-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.schedule")}</dt>
          <dd className="num text-right">{release.agency}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.forecast")}</dt>
          <dd className="flex flex-wrap items-center justify-end gap-1.5">
            <span className="num font-medium">{forecast.value}</span>
            <ForecastBadge forecast={forecast} />
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.actual")}</dt>
          <dd className="flex flex-wrap items-center justify-end gap-1.5">
            {release.actualValue == null ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <>
                <span
                  className={cn(
                    "num font-medium",
                    assessment?.goldBias === "bullish" && "text-positive",
                    assessment?.goldBias === "bearish" && "text-negative",
                  )}
                >
                  {release.actual}
                </span>
                <ActualBadge source={release.actualSource} />
              </>
            )}
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.previous")}</dt>
          <dd className="num">{release.previous}</dd>
        </div>
      </dl>

      {assessment ? <SurprisePill assessment={assessment} /> : null}

      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 text-xs text-info hover:underline"
        >
          {t("ec.analysis")}
          <ChevronDown
            className={cn("size-3 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="mt-2 space-y-1.5 rounded-sm border border-border bg-surface p-2.5 text-xs">
            {assessment ? (
              <>
                <p>
                  <span className="text-muted-foreground">{t("ec.goldBias")}: </span>
                  <span className={biasTone(assessment.goldBias)}>
                    {t(`ec.${assessment.goldBias}` as "ec.bullish")}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">{t("ec.usdBias")}: </span>
                  {assessment.usdBias === "strong"
                    ? t("ec.usdStrong")
                    : assessment.usdBias === "weak"
                      ? t("ec.usdWeak")
                      : t("ec.usdNeutral")}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("ec.magnitude")}: </span>
                  {assessment.magnitude === "high"
                    ? t("ec.high")
                    : assessment.magnitude === "medium"
                      ? t("ec.medium")
                      : t("ec.low")}
                </p>
                <p className="text-muted-foreground">{rationale}</p>
              </>
            ) : (
              <p className="text-muted-foreground">{t("ec.notReleased")}</p>
            )}
            {estimate ? (
              <p className="num text-[11px] text-muted-foreground">
                {t("ec.model")}: {estimate.modelVersion} · {estimate.historicalPoints} pts
              </p>
            ) : null}
            {forecast.label !== "Market Consensus" ? (
              <p className="text-[11px] text-muted-foreground">{t("ec.noConsensus")}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function EconomicCalendarPage() {
  const { t, lang } = useI18n();
  const { events, isLoading, isError, refetch, statuses } = useEconomicCalendar();
  const [filter, setFilter] = useState<ImpactFilter>("All");

  const filtered = useMemo(
    () => events.filter((e) => filter === "All" || e.release.impact === filter),
    [events, filter],
  );

  const days = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const key = dayKey(e.release.nextReleaseUtc);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 7);
  }, [filtered]);

  const filters: ImpactFilter[] = ["All", "High", "Medium", "Low"];

  return (
    <>
      <PageHeader
        title={t("ec.title")}
        description={t("ec.desc")}
        dataTag={<StatusBadge tone="positive">{t("common.liveOfficialData")}</StatusBadge>}
        actions={
          <>
            <AdvisoryTag />
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3" aria-hidden />
              {t("ec.retry")}
            </button>
          </>
        }
      />

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("ec.filterImpact")}
      >
        <span className="text-xs text-muted-foreground">{t("ec.filterImpact")}</span>
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-sm border px-2.5 py-1 text-xs transition-colors",
              filter === f
                ? "border-primary/50 bg-primary/12 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "All"
              ? t("ec.all")
              : f === "High"
                ? `🔴 ${t("ec.high")}`
                : f === "Medium"
                  ? `🟠 ${t("ec.medium")}`
                  : `🟡 ${t("ec.low")}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PanelCard>
          <p className="text-sm text-muted-foreground">{t("ec.loading")}</p>
        </PanelCard>
      ) : isError ? (
        <PanelCard title={t("ec.week")}>
          <p className="text-sm text-negative">{t("ec.unavailable")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("ec.offlineFallback")}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1.5 text-xs"
          >
            <RefreshCw className="size-3" aria-hidden /> {t("ec.retry")}
          </button>
        </PanelCard>
      ) : days.length === 0 ? (
        <PanelCard>
          <p className="text-sm text-muted-foreground">{t("ec.empty")}</p>
        </PanelCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map(([day, items]) => (
            <PanelCard
              key={day}
              title={dayLabel(`${day}T00:00:00Z`, lang)}
              bodyClassName="space-y-3"
            >
              {items.map((item) => (
                <EventCard key={item.release.releaseId} item={item} />
              ))}
            </PanelCard>
          ))}
        </div>
      )}

      <PanelCard title={t("ec.sources")}>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {statuses.map((s) => (
            <li key={s.agency} className="flex flex-wrap items-center gap-2">
              <span
                className={cn("size-1.5 rounded-full", s.ok ? "bg-positive" : "bg-negative")}
                aria-hidden
              />
              <span className="font-medium text-foreground">{s.agency}</span>
              <span className="min-w-0 break-words">{s.message}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">{t("ec.pollNote")}</p>
      </PanelCard>
    </>
  );
}
