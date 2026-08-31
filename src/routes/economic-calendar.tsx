import { Fragment, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { eventLabel } from "@/locales/economic-events-th";
import { useEconomicCalendar } from "@/hooks/use-economic-calendar";
import { IMPACT_RULES } from "@/lib/economic-calendar/impact-engine";
import type { CalendarEvent, ImpactAssessment } from "@/lib/economic-calendar/types";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import { ExportImageButton } from "@/components/auriq/ExportImageButton";
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
type CalendarRange = "day" | "week";

const BKK_TZ = "Asia/Bangkok";

/** Calendar day of a UTC instant in Asia/Bangkok. */
function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** HH:mm of a UTC instant in Asia/Bangkok. */
function bkkTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BKK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function addUtcDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfUtcWeek(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return date.toISOString().slice(0, 10);
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
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const { release, forecast, estimate, assessment } = item;

  const rule = IMPACT_RULES[release.event];
  const rationale = assessment
    ? t("ec.rationaleText", {
        event: eventLabel(release.event, lang),
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
        <span className="num text-xs text-muted-foreground">
          {bkkTime(release.nextReleaseUtc)} {t("ec.tz")}
        </span>
        <ImpactDots impact={release.impact} />
        <h3 className="min-w-0 flex-1 text-sm leading-snug font-semibold">
          {eventLabel(release.event, lang)}
        </h3>
      </header>

      <dl className="grid gap-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.schedule")}</dt>
          <dd className="num text-right">{release.agency}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.marketForecast")}</dt>
          <dd className="flex flex-wrap items-center justify-end gap-1.5">
            {forecast.label === "Market Consensus" ? (
              <>
                <span className="num font-medium">{forecast.value}</span>
                <ForecastBadge forecast={forecast} />
              </>
            ) : (
              <span className="text-muted-foreground">{t("ec.noConsensusYet")}</span>
            )}
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
          <dt className="text-muted-foreground">{t("ec.auriqEstimateCol")}</dt>
          <dd className="num text-muted-foreground">{estimate ? estimate.value : "—"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.previous")}</dt>
          <dd className="num">{release.previous}</dd>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <dt className="text-muted-foreground">{t("ec.colSource")}</dt>
          <dd className="num min-w-0 text-right text-[11px] break-words text-muted-foreground">
            {release.actualSource}
          </dd>
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

function ImpactSquare({ impact }: { impact: CalendarEvent["release"]["impact"] }) {
  const tone =
    impact === "High" ? "bg-negative" : impact === "Medium" ? "bg-primary" : "bg-warning/70";
  return (
    <span
      title={impact}
      className={cn("inline-block h-3 w-4 rounded-[2px] border border-border/60", tone)}
      aria-label={impact}
    />
  );
}

function CalendarTable({
  days,
  lang,
}: {
  days: readonly (readonly [string, CalendarEvent[]])[];
  lang: string;
}) {
  const { t } = useI18n();
  const [openRow, setOpenRow] = useState<string | null>(null);

  return (
    <div className="hidden min-w-0 overflow-x-auto rounded-md border border-border bg-card md:block">
      <table className="w-full min-w-[1060px] border-collapse text-sm">
        <caption className="sr-only">{t("ec.caption")}</caption>
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs text-muted-foreground">
            <th scope="col" className="w-28 px-3 py-2 font-medium">
              {t("ec.colDate")}
            </th>
            <th scope="col" className="w-24 px-3 py-2 font-medium">
              {t("ec.colTime")}
            </th>
            <th scope="col" className="w-20 px-3 py-2 font-medium">
              {t("ec.colCurrency")}
            </th>
            <th scope="col" className="w-20 px-3 py-2 font-medium">
              {t("ec.colImpact")}
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              {t("ec.colEvent")}
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              {t("ec.actual")}
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              {t("ec.marketForecast")}
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              {t("ec.auriqEstimateCol")}
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              {t("ec.previous")}
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              {t("ec.colSource")}
            </th>
            <th scope="col" className="w-24 px-3 py-2 text-right font-medium">
              {t("ec.colDetail")}
            </th>
          </tr>
        </thead>
        <tbody>
          {days.map(([day, items]) => {
            if (!items.length) {
              return (
                <tr key={day} className="border-b border-border/60">
                  <th
                    scope="row"
                    className="bg-surface/60 px-3 py-3 text-left text-xs font-semibold whitespace-pre-line"
                  >
                    {dayLabel(`${day}T00:00:00Z`, lang).replace(" ", "\n")}
                  </th>
                  <td colSpan={10} className="px-3 py-3 text-xs text-muted-foreground">
                    {t("ec.noEventsDay")}
                  </td>
                </tr>
              );
            }
            return items.map((item, index) => {
              const { release, forecast, assessment, estimate } = item;
              const id = release.releaseId;
              const open = openRow === id;
              return (
                <Fragment key={id}>
                  <tr className="border-b border-border/60 hover:bg-surface/40">
                    {index === 0 ? (
                      <th
                        scope="row"
                        rowSpan={items.length}
                        className="border-r border-border/60 bg-surface/60 px-3 py-2 align-top text-left text-xs font-semibold whitespace-pre-line"
                      >
                        {dayLabel(`${day}T00:00:00Z`, lang).replace(" ", "\n")}
                      </th>
                    ) : null}
                    <td className="num px-3 py-2 text-xs text-muted-foreground">
                      {bkkTime(release.nextReleaseUtc)} {t("ec.tz")}
                    </td>
                    <td className="num px-3 py-2 text-xs">{release.currency ?? "USD"}</td>
                    <td className="px-3 py-2">
                      <ImpactSquare impact={release.impact} />
                    </td>
                    <td className="min-w-0 px-3 py-2">{eventLabel(release.event, lang)}</td>
                    <td
                      className={cn(
                        "num px-3 py-2 text-right",
                        assessment?.goldBias === "bullish" && "text-positive",
                        assessment?.goldBias === "bearish" && "text-negative",
                      )}
                    >
                      {release.actualValue == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        release.actual
                      )}
                    </td>
                    <td className="num px-3 py-2 text-right">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        {forecast.label === "Market Consensus" ? (
                          <>
                            {forecast.value}
                            <ForecastBadge forecast={forecast} />
                          </>
                        ) : (
                          <span className="text-muted-foreground">{t("ec.noConsensusYet")}</span>
                        )}
                      </span>
                    </td>
                    <td className="num px-3 py-2 text-right text-muted-foreground">
                      {estimate ? estimate.value : "—"}
                    </td>
                    <td className="num px-3 py-2 text-right text-muted-foreground">
                      {release.previous}
                    </td>
                    <td className="px-3 py-2 text-[11px] break-words text-muted-foreground">
                      {release.actualSource}
                    </td>

                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setOpenRow(open ? null : id)}
                        aria-expanded={open}
                        className="inline-flex items-center gap-1 text-xs text-info hover:underline"
                      >
                        {t("ec.analysis")}
                        <ChevronDown
                          className={cn("size-3 transition-transform", open && "rotate-180")}
                          aria-hidden
                        />
                      </button>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="border-b border-border/60 bg-surface/60">
                      <td colSpan={index === 0 ? 10 : 11} className="px-3 py-3">
                        <div className="space-y-1.5 text-xs">
                          {assessment ? (
                            <>
                              <SurprisePill assessment={assessment} />
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
                            </>
                          ) : (
                            <p className="text-muted-foreground">{t("ec.notReleased")}</p>
                          )}
                          <p className="num text-[11px] break-words text-muted-foreground">
                            {t("ec.schedule")}: {release.actualSource}
                            {estimate
                              ? ` · ${t("ec.model")}: ${estimate.modelVersion} · ${estimate.historicalPoints} pts`
                              : ""}
                          </p>
                          {forecast.label !== "Market Consensus" ? (
                            <p className="text-[11px] text-muted-foreground">
                              {t("ec.noConsensus")}
                              {estimate ? ` · ${t("ec.auriqEstimate")}: ${estimate.value}` : ""}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

function EconomicCalendarPage() {
  const { t, lang } = useI18n();
  const { events, isLoading, isError, refetch, statuses } = useEconomicCalendar();
  const exportRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<ImpactFilter>("All");
  const [range, setRange] = useState<CalendarRange>("week");
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date().toISOString()));

  const rangeStart = range === "day" ? selectedDate : startOfUtcWeek(selectedDate);
  const rangeEnd = range === "day" ? selectedDate : addUtcDays(rangeStart, 6);

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        const day = dayKey(e.release.nextReleaseUtc);
        const inRange = day >= rangeStart && day <= rangeEnd;
        return inRange && (filter === "All" || e.release.impact === filter);
      }),
    [events, filter, rangeEnd, rangeStart],
  );

  const days = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const key = dayKey(e.release.nextReleaseUtc);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    if (range === "day") return [[rangeStart, map.get(rangeStart) ?? []] as const];

    return Array.from({ length: 5 }, (_, index) => {
      const day = addUtcDays(rangeStart, index);
      return [day, map.get(day) ?? []] as const;
    });
  }, [filtered, range, rangeStart]);

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
            <ExportImageButton
              targetRef={exportRef}
              filePrefix="auriq-economic-calendar"
              label={t("export.calendar")}
            />
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

      <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-sm border border-border bg-surface p-0.5"
            role="group"
            aria-label={t("ec.range")}
          >
            {(["day", "week"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                aria-pressed={range === value}
                className={cn(
                  "rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors",
                  range === value
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "day" ? t("ec.daily") : t("ec.weekly")}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate((date) => addUtcDays(date, range === "day" ? -1 : -7))}
            className="grid size-8 place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground"
            aria-label={t("ec.previousPeriod")}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <label className="flex items-center gap-2 rounded-sm border border-border bg-surface px-2 py-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            <span className="sr-only">{t("ec.chooseDate")}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="num bg-transparent text-foreground outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => setSelectedDate((date) => addUtcDays(date, range === "day" ? 1 : 7))}
            className="grid size-8 place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground"
            aria-label={t("ec.nextPeriod")}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(dayKey(new Date().toISOString()))}
            className="rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {t("ec.today")}
          </button>
        </div>
        <p className="num text-xs text-muted-foreground">
          {range === "day"
            ? dayLabel(`${rangeStart}T00:00:00Z`, lang)
            : `${dayLabel(`${rangeStart}T00:00:00Z`, lang)} — ${dayLabel(`${rangeEnd}T00:00:00Z`, lang)}`}
        </p>
      </div>

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
      ) : (
        <div ref={exportRef} className="space-y-4">
          <CalendarTable days={days} lang={lang} />
          <p className="text-[11px] text-muted-foreground">{t("ec.estimateNote")}</p>
          <div className="grid gap-4 md:hidden">
            {days.map(([day, items]) => (
              <PanelCard
                key={day}
                title={dayLabel(`${day}T00:00:00Z`, lang)}
                bodyClassName="space-y-3"
              >
                {items.length ? (
                  items.map((item) => <EventCard key={item.release.releaseId} item={item} />)
                ) : (
                  <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    {t("ec.noEventsDay")}
                  </p>
                )}
              </PanelCard>
            ))}
          </div>
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
