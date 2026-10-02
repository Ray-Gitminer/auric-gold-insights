import { NewsIntelligenceView } from "@/components/auriq/NewsIntelligenceView";
import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, ClipboardPaste, ExternalLink, Loader2, RefreshCw, Send, Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { normalizeCalendarEvent } from "@/lib/economic-calendar/normalize";
import { eventLabel } from "@/locales/economic-events-th";
import { useNewsIntelligence } from "@/hooks/use-news-intelligence";
import type { NewsCategory, NewsImpactLevel } from "@/lib/news/types";
import type { CalendarEvent } from "@/lib/economic-calendar/types";
import type {
  AnalysisRunRecord,
  EventSnapshot,
  WeeklyAnalysisResult,
} from "@/lib/news/analysis-types";
import { listAnalysisRuns, newRunId, saveAnalysisRun } from "@/lib/news/analysis-audit";
import { ANALYSIS_MODEL, runWeeklyAnalysis } from "@/lib/news/weekly-analysis";
import {
  extractCalendarScreenshot,
  type ImportedCalendarRow,
} from "@/lib/news/calendar-image-import";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import { ExportImageButton } from "@/components/auriq/ExportImageButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/economic-news")({
  head: () => ({
    meta: [
      { title: "Economic News · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "US economic calendar, weekly AI analysis and named-source headlines for gold traders — market forecast, AURIQ estimate and previous values kept separate.",
      },
      { property: "og:title", content: "Economic News · AURIQ" },
      {
        property: "og:description",
        content:
          "Select US releases, send them for analysis and read the USD / XAU-USD outlook alongside real headlines.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EconomicNewsWorkspace,
});

const BKK_TZ = "Asia/Bangkok";
const CATEGORIES: NewsCategory[] = [
  "Monetary policy",
  "Inflation",
  "Employment",
  "Growth",
  "Geopolitics",
  "Gold market",
];
const IMPACTS: NewsImpactLevel[] = ["High", "Medium", "Low"];

type Tab = "calendar" | "weekly" | "other" | "history";

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function bkkTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BKK_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function bkkDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: BKK_TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function isoToBkkLocalInput(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BKK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function bkkLocalInputToIso(value: string) {
  const [date = "", time = ""] = value.split("T");
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute)).toISOString();
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function dayLabel(isoDate: string, lang: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function formatPublished(iso: string) {
  return `${new Date(iso).toUTCString().slice(5, 22)} UTC`;
}

function clean(value: string | null | undefined) {
  return value && value !== "—" ? value : null;
}

/** Immutable record of what the user actually saw when requesting the analysis. */
function snapshotOf(item: CalendarEvent): EventSnapshot {
  const { release } = item;
  const n = normalizeCalendarEvent(item);
  return {
    releaseId: n.id,
    event: n.eventName,
    currency: n.currency,
    impact: n.impact,
    nextReleaseUtc: n.releaseAt,
    marketForecast: n.marketForecast.displayValue,
    marketForecastSource: n.marketForecast.source,
    auriqEstimate: n.auriqEstimate.displayValue,
    previous: n.previous.displayValue,
    actual: n.actual.displayValue,
    source: release.actualSource,
  };
}

function ImpactSquare({ impact }: { impact: "High" | "Medium" | "Low" }) {
  const tone =
    impact === "High" ? "bg-negative" : impact === "Medium" ? "bg-primary" : "bg-warning/70";
  return (
    <span
      title={impact}
      aria-label={impact}
      className={cn("inline-block h-3 w-4 rounded-[2px] border border-border/60", tone)}
    />
  );
}

function DirectionText({ direction }: { direction: "Bullish" | "Bearish" | "Neutral" }) {
  return (
    <span
      className={cn(
        "font-semibold",
        direction === "Bullish" && "text-positive",
        direction === "Bearish" && "text-negative",
        direction === "Neutral" && "text-muted-foreground",
      )}
    >
      {direction}
    </span>
  );
}

function EconomicNewsWorkspace() {
  const { t, lang } = useI18n();
  const {
    items,
    sources,
    analysisMode,
    fetchedAt,
    isLoading,
    isFetching,
    isError,
    refetch,
    calendarEvents,
  } = useNewsIntelligence();

  const [tab, setTab] = useState<Tab>("calendar");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(dayKey(new Date().toISOString())));
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<WeeklyAnalysisResult | null>(null);
  const [runs, setRuns] = useState<AnalysisRunRecord[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(false);
  const [importedRows, setImportedRows] = useState<ImportedCalendarRow[]>([]);
  const [confirmSnapshots, setConfirmSnapshots] = useState<EventSnapshot[]>([]);
  const [lastAnalysisEvents, setLastAnalysisEvents] = useState<EventSnapshot[]>([]);

  const [category, setCategory] = useState<NewsCategory | "All">("All");
  const [impact, setImpact] = useState<NewsImpactLevel | "All">("All");

  const calendarRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => setRuns(listAnalysisRuns()), []);

  const weekEnd = addDays(weekStart, 4);

  const weekEvents = useMemo(
    () =>
      calendarEvents
        .filter((e) => (e.release.currency ?? "USD") === "USD")
        .filter((e) => {
          const day = dayKey(e.release.nextReleaseUtc);
          return day >= weekStart && day <= weekEnd;
        })
        .sort((a, b) => a.release.nextReleaseUtc.localeCompare(b.release.nextReleaseUtc)),
    [calendarEvents, weekStart, weekEnd],
  );

  const days = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of weekEvents) {
      const key = dayKey(e.release.nextReleaseUtc);
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(weekStart, i);
      return [day, map.get(day) ?? []] as const;
    });
  }, [weekEvents, weekStart]);

  const selectedEvents = useMemo(
    () => calendarEvents.filter((e) => selected.includes(e.release.releaseId)),
    [calendarEvents, selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectIds = (ids: string[]) => setSelected(Array.from(new Set(ids)));

  const filteredNews = useMemo(
    () =>
      items.filter(
        (i) =>
          (category === "All" || i.category === category) &&
          (impact === "All" || i.impactLevel === impact),
      ),
    [items, category, impact],
  );

  async function submitAnalysis() {
    const snapshot = confirmSnapshots;
    const requestedAt = new Date().toISOString();
    setConfirmOpen(false);
    setRunning(true);
    setFailed(false);
    setTab("weekly");
    setLastAnalysisEvents(snapshot);
    try {
      const analysis = await runWeeklyAnalysis({
        data: {
          events: snapshot,
          headlines: items.slice(0, 20).map((i) => ({
            headline: i.headline,
            source: i.source,
            publishedIso: i.publishedIso,
          })),
          lang,
        },
      });
      setResult(analysis);
      setRuns(
        saveAnalysisRun({
          id: newRunId(),
          user_id: null,
          selected_event_ids: snapshot.map((s) => s.releaseId),
          event_snapshot: snapshot,
          analysis_result: analysis,
          model_name: analysis.modelName,
          sources: analysis.sources,
          requested_at: requestedAt,
          completed_at: new Date().toISOString(),
          status: "completed",
        }),
      );
    } catch {
      setFailed(true);
      setResult(null);
      setRuns(
        saveAnalysisRun({
          id: newRunId(),
          user_id: null,
          selected_event_ids: snapshot.map((s) => s.releaseId),
          event_snapshot: snapshot,
          analysis_result: null,
          model_name: ANALYSIS_MODEL,
          sources: snapshot.map((s) => s.source),
          requested_at: requestedAt,
          completed_at: new Date().toISOString(),
          status: "failed",
        }),
      );
    } finally {
      setRunning(false);
    }
  }

  async function importScreenshot(file: File | null) {
    if (!file) return;
    setImporting(true);
    setImportError(false);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const rows = await extractCalendarScreenshot({ data: { imageDataUrl } });
      setImportedRows(rows);
      setImportError(rows.length === 0);
    } catch {
      setImportedRows([]);
      setImportError(true);
    } finally {
      setImporting(false);
    }
  }

  function updateImported(index: number, patch: Partial<ImportedCalendarRow>) {
    setImportedRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const [clipboardDenied, setClipboardDenied] = useState(false);

  // Read an image straight from the clipboard via a user click (works even
  // when Ctrl+V is swallowed by the preview frame or browser focus).
  async function pasteFromClipboard() {
    setClipboardDenied(false);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          await importScreenshot(new File([blob], "clipboard.png", { type: imageType }));
          return;
        }
      }
      setClipboardDenied(true);
    } catch {
      setClipboardDenied(true);
    }
  }

  // Allow pasting a copied screenshot (Ctrl+V / Cmd+V) anywhere on this tab.
  useEffect(() => {
    if (tab !== "calendar") return;
    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            void importScreenshot(file);
          }
          return;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, importing]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "calendar", label: t("enews.tab.calendar") },
    { id: "weekly", label: t("enews.tab.weekly") },
    { id: "other", label: t("enews.tab.other") },
    { id: "history", label: t("enews.tab.history") },
  ];

  return (
    <>
      <NewsIntelligenceView />
      <PageHeader
        title={t("nav.economicNews")}
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

      <nav
        className="flex min-w-0 flex-wrap gap-1 rounded-md border border-border bg-card p-1"
        aria-label={t("nav.economicNews")}
      >
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={cn(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              tab === item.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ---------------- Economic calendar + selection ---------------- */}
      {tab === "calendar" ? (
        <>
          <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                ← {t("ec.previousPeriod")}
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(startOfWeek(dayKey(new Date().toISOString())))}
                className="rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("ec.today")}
              </button>
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("ec.nextPeriod")} →
              </button>
              <span className="num text-xs text-muted-foreground">
                {dayLabel(weekStart, lang)} — {dayLabel(weekEnd, lang)} · {t("ec.tz")}
              </span>
            </div>
            <ExportImageButton
              targetRef={calendarRef}
              filePrefix="auriq-economic-calendar"
              label={t("export.calendar")}
            />
          </div>

          <PanelCard
            title={lang === "th" ? "นำเข้าปฏิทินจากภาพ" : "Import calendar screenshot"}
            subtitle={
              lang === "th"
                ? "เปิดปฏิทินต้นทาง บันทึกภาพ แล้วให้ AURIQ อ่านค่าเพื่อให้คุณตรวจสอบก่อนวิเคราะห์"
                : "Open the source calendar, capture it, then review AURIQ's extraction before analysis."
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://www.forexfactory.com/calendar"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs text-info hover:underline"
              >
                <ExternalLink className="size-3" aria-hidden />
                {lang === "th" ? "เปิด Forex Factory" : "Open Forex Factory"}
              </a>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20">
                {importing ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-3" aria-hidden />
                )}
                {lang === "th" ? "อัปโหลด Screenshot" : "Upload screenshot"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={importing}
                  onChange={(event) => void importScreenshot(event.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                disabled={importing}
                onClick={() => void pasteFromClipboard()}
                className="inline-flex items-center gap-1.5 rounded-sm border border-info/50 bg-info/12 px-3 py-1.5 text-xs font-medium text-info hover:bg-info/20 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <ClipboardPaste className="size-3" aria-hidden />
                )}
                {lang === "th" ? "วางภาพจากคลิปบอร์ด" : "Paste from clipboard"}
              </button>
              <span className="text-[11px] text-muted-foreground">
                {lang === "th"
                  ? "รองรับ PNG/JPG/WebP · ก๊อปปี้ภาพแล้วกดปุ่มวาง หรือกด Ctrl+V · AI จะไม่เดาตัวเลขที่อ่านไม่ชัด"
                  : "PNG/JPG/WebP · copy an image, then click paste or press Ctrl+V · unreadable values are never guessed"}
              </span>
            </div>
            {clipboardDenied ? (
              <p className="mt-3 text-xs text-warning">
                {lang === "th"
                  ? "อ่านคลิปบอร์ดไม่ได้ — กรุณาคลิกที่หน้านี้ก่อนแล้วกด Ctrl+V หรือใช้ปุ่มอัปโหลดแทน (บางเบราว์เซอร์ต้องอนุญาตการเข้าถึงคลิปบอร์ด)"
                  : "Clipboard read was blocked — click on this page first, then press Ctrl+V, or use the upload button (some browsers require clipboard permission)."}
              </p>
            ) : null}
            {importError ? (
              <p className="mt-3 text-xs text-negative">
                {lang === "th"
                  ? "อ่านภาพไม่สำเร็จ กรุณาใช้ภาพที่เห็นหัวตาราง วันที่ และตัวเลขชัดเจน"
                  : "The screenshot could not be read. Include clear headers, dates and values."}
              </p>
            ) : null}
            {importedRows.length ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-medium">
                  {lang === "th"
                    ? "ตรวจทุกช่องก่อนยืนยัน โดยเฉพาะเครื่องหมายลบและหน่วย K/M/%"
                    : "Verify every field, especially minus signs and K/M/% units."}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="p-2">✓</th>
                        <th className="p-2">{t("ec.colDate")} (ICT)</th>
                        <th className="p-2">{t("ec.colEvent")}</th>
                        <th className="p-2">{t("ec.colImpact")}</th>
                        <th className="p-2">{t("ec.actual")}</th>
                        <th className="p-2">{t("ec.marketForecast")}</th>
                        <th className="p-2">{t("ec.previous")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedRows.map((row, index) => (
                        <tr key={row.releaseId} className="border-b border-border/60">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={row.include}
                              onChange={(event) =>
                                updateImported(index, { include: event.target.checked })
                              }
                              className="accent-[color:var(--color-primary)]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="datetime-local"
                              value={isoToBkkLocalInput(row.nextReleaseUtc)}
                              onChange={(event) =>
                                updateImported(index, {
                                  nextReleaseUtc: bkkLocalInputToIso(event.target.value),
                                })
                              }
                              className="rounded-sm border border-border bg-surface px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              value={row.event}
                              onChange={(event) =>
                                updateImported(index, { event: event.target.value })
                              }
                              className="w-full rounded-sm border border-border bg-surface px-2 py-1"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={row.impact}
                              onChange={(event) =>
                                updateImported(index, {
                                  impact: event.target.value as EventSnapshot["impact"],
                                })
                              }
                              className="rounded-sm border border-border bg-surface px-2 py-1"
                            >
                              <option>High</option>
                              <option>Medium</option>
                              <option>Low</option>
                            </select>
                          </td>
                          {(["actual", "marketForecast", "previous"] as const).map((field) => (
                            <td key={field} className="p-2">
                              <input
                                value={row[field] ?? ""}
                                placeholder="—"
                                onChange={(event) =>
                                  updateImported(index, { [field]: clean(event.target.value) })
                                }
                                className="w-24 rounded-sm border border-border bg-surface px-2 py-1 text-right"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  disabled={!importedRows.some((row) => row.include)}
                  onClick={() => {
                    setConfirmSnapshots(
                      importedRows
                        .filter((row) => row.include)
                        .map(({ include: _include, ...row }) => ({
                          ...row,
                          source: "Calendar screenshot · verified by user",
                        })),
                    );
                    setConfirmOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-50"
                >
                  <Send className="size-3" aria-hidden />
                  {lang === "th" ? "ตรวจยืนยันและส่งวิเคราะห์" : "Confirm and analyse"}
                </button>
              </div>
            ) : null}
          </PanelCard>

          <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("sel.title")}</span>
              <button
                type="button"
                onClick={() => selectIds(weekEvents.map((e) => e.release.releaseId))}
                className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("sel.selectAll")}
              </button>
              <button
                type="button"
                onClick={() =>
                  selectIds(
                    weekEvents
                      .filter((e) => e.release.impact === "High")
                      .map((e) => e.release.releaseId),
                  )
                }
                className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("sel.highOnly")}
              </button>
              <button
                type="button"
                onClick={() =>
                  selectIds(
                    weekEvents
                      .filter((e) => e.release.impact !== "Low")
                      .map((e) => e.release.releaseId),
                  )
                }
                className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("sel.highMedium")}
              </button>
              <button
                type="button"
                onClick={() => selectIds(weekEvents.map((e) => e.release.releaseId))}
                className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("sel.thisWeek")}
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("sel.clear")}
              </button>
              <span className="num text-xs text-primary">
                {t("sel.selected", { count: selected.length })}
              </span>
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={() => {
                  setConfirmSnapshots(selectedEvents.map(snapshotOf));
                  setConfirmOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/12 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="size-3" aria-hidden />
                {t("an.submit")}
              </button>
            </div>
            {selected.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">{t("an.none")}</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">{t("an.auditNote")}</p>
          </div>

          <div ref={calendarRef} className="space-y-3">
            <PanelCard title={t("enews.calendarSection")} bodyClassName="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">{t("ec.loading")}</p>
              ) : (
                <>
                  <div
                    role="row"
                    className="sticky top-0 z-10 -mx-0 hidden gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase md:grid md:grid-cols-[auto_5rem_3rem_2rem_1fr_repeat(4,6rem)] md:items-center"
                  >
                    <span className="size-3.5" aria-hidden />
                    <span>{t("ec.colTime")}</span>
                    <span>{t("ec.colCurrency")}</span>
                    <span>{t("ec.colImpact")}</span>
                    <span>{t("ec.colEvent")}</span>
                    <span className="text-right">{t("ec.actual")}</span>
                    <span className="text-right">{t("ec.marketForecast")}</span>
                    <span className="text-right">{t("ec.auriqEstimateCol")}</span>
                    <span className="text-right">{t("ec.previous")}</span>
                  </div>
                  {days.map(([day, list]) => (
                    <section key={day} className="min-w-0 space-y-2">
                      <h3 className="text-xs font-semibold text-muted-foreground">
                        {dayLabel(day, lang)}
                        {list.length ? (
                          <button
                            type="button"
                            onClick={() =>
                              selectIds([...selected, ...list.map((e) => e.release.releaseId)])
                            }
                            className="ml-2 text-[11px] font-normal text-info hover:underline"
                          >
                            {t("sel.byDate")}
                          </button>
                        ) : null}
                      </h3>
                      {list.length === 0 ? (
                        <p className="rounded-md border border-dashed border-border px-3 py-3 text-center text-[11px] text-muted-foreground">
                          {t("ec.noEventsDay")}
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {list.map((item) => {
                            const s = snapshotOf(item);
                            const checked = selected.includes(s.releaseId);
                            return (
                              <li
                                key={s.releaseId}
                                className={cn(
                                  "grid min-w-0 gap-2 rounded-md border border-border bg-surface p-2.5 text-xs md:grid-cols-[auto_5rem_3rem_2rem_1fr_repeat(4,6rem)] md:items-center",
                                  checked && "border-primary/50 bg-primary/5",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggle(s.releaseId)}
                                  aria-label={t("sel.rowAria", {
                                    event: eventLabel(s.event, lang),
                                  })}
                                  className="size-3.5 accent-[color:var(--color-primary)]"
                                />
                                <span className="num text-muted-foreground">
                                  {bkkTime(s.nextReleaseUtc)} {t("ec.tz")}
                                </span>
                                <span className="num">{s.currency}</span>
                                <ImpactSquare impact={s.impact} />
                                <span className="min-w-0 font-medium">
                                  {eventLabel(s.event, lang)}
                                </span>
                                <span className="num md:text-right">
                                  <span className="text-muted-foreground md:hidden">
                                    {t("ec.actual")}:{" "}
                                  </span>
                                  {s.actual ?? "—"}
                                </span>
                                <span className="num md:text-right">
                                  <span className="text-muted-foreground md:hidden">
                                    {t("ec.marketForecast")}:{" "}
                                  </span>
                                  {s.marketForecast ?? (
                                    <span className="text-muted-foreground">
                                      {t("ec.noConsensusYet")}
                                    </span>
                                  )}
                                </span>
                                <span className="num text-muted-foreground md:text-right">
                                  <span className="md:hidden">{t("ec.auriqEstimateCol")}: </span>
                                  {s.auriqEstimate ?? "—"}
                                </span>
                                <span className="num text-muted-foreground md:text-right">
                                  <span className="md:hidden">{t("ec.previous")}: </span>
                                  {s.previous ?? "—"}
                                </span>
                                <span className="num col-span-full text-[10px] break-words text-muted-foreground">
                                  {t("ec.colSource")}: {s.source}
                                  {s.marketForecastSource ? ` · ${s.marketForecastSource}` : ""}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>
                  ))}
                </>
              )}

              <p className="text-[11px] text-muted-foreground">{t("ec.estimateNote")}</p>
            </PanelCard>
          </div>
        </>
      ) : null}

      {/* ---------------- Weekly analysis ---------------- */}
      {tab === "weekly" ? (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ExportImageButton
              targetRef={analysisRef}
              filePrefix="auriq-weekly-analysis"
              label={t("export.analysis")}
            />
          </div>
          <div ref={analysisRef} className="space-y-4">
            {running ? (
              <PanelCard>
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {t("an.running")}
                </p>
              </PanelCard>
            ) : failed ? (
              <PanelCard>
                <p className="text-sm text-negative">{t("an.failed")}</p>
              </PanelCard>
            ) : result ? (
              <AnalysisResultView result={result} events={lastAnalysisEvents} />
            ) : (
              <PanelCard>
                <p className="text-sm text-muted-foreground">{t("an.empty")}</p>
              </PanelCard>
            )}
          </div>
        </>
      ) : null}

      {/* ---------------- Other economic news ---------------- */}
      {tab === "other" ? (
        <>
          <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={t("enews.filterCategory")}
            >
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
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label={t("ec.filterImpact")}
            >
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
            <div className="flex justify-end">
              <ExportImageButton
                targetRef={newsRef}
                filePrefix="auriq-economic-news"
                label={t("export.news")}
              />
            </div>
          </div>

          <div ref={newsRef} className="space-y-3">
            <PanelCard title={t("enews.newsSection")} subtitle={t("enews.newsSectionSub")}>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">{t("news.loading")}</p>
              ) : isError ? (
                <p className="text-sm text-negative">{t("news.error")}</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {filteredNews.map((item) => (
                    <article
                      key={item.id}
                      className="flex min-w-0 flex-col gap-2 rounded-md border border-border bg-surface p-3"
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
                      <h3 className="min-w-0 text-sm leading-snug font-semibold">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1 hover:text-primary"
                        >
                          <span className="min-w-0">
                            {(lang === "th" && item.headlineTh) || item.headline}
                          </span>
                          <ExternalLink className="mt-0.5 size-3 shrink-0" aria-hidden />
                        </a>
                      </h3>
                      {lang === "th" && item.headlineTh ? (
                        <p className="text-[11px] text-muted-foreground/80">{item.headline}</p>
                      ) : null}
                      {(lang === "th" && item.rationaleTh) || item.rationale ? (
                        <p className="text-xs text-muted-foreground">
                          {(lang === "th" && item.rationaleTh) || item.rationale}
                        </p>
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
                        {item.linkedReleaseId ? (
                          <span className="inline-flex items-center gap-1 text-info">
                            <CalendarClock className="size-3" aria-hidden />
                            {eventLabel(
                              calendarEvents.find(
                                (e) => e.release.releaseId === item.linkedReleaseId,
                              )?.release.event ?? item.linkedReleaseId,
                              lang,
                            )}
                          </span>
                        ) : null}
                      </footer>
                    </article>
                  ))}
                  {filteredNews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("enews.noMatch")}</p>
                  ) : null}
                </div>
              )}
            </PanelCard>
          </div>

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
      ) : null}

      {/* ---------------- Analysis history ---------------- */}
      {tab === "history" ? (
        <>
          <div className="flex justify-end">
            <ExportImageButton
              targetRef={historyRef}
              filePrefix="auriq-analysis-history"
              label={t("export.page")}
            />
          </div>
          <div ref={historyRef}>
            <PanelCard title={t("an.historyTitle")} subtitle={t("an.auditNote")}>
              {runs.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("an.historyEmpty")}</p>
              ) : (
                <ul className="space-y-2">
                  {runs.map((run) => (
                    <li
                      key={run.id}
                      className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-surface p-2.5 text-xs"
                    >
                      <StatusBadge tone={run.status === "completed" ? "positive" : "negative"}>
                        {run.status}
                      </StatusBadge>
                      <span className="num text-muted-foreground">
                        {t("an.requestedAt")}: {bkkDateTime(run.requested_at)} {t("ec.tz")}
                      </span>
                      <span className="num">
                        {t("an.eventsCount", { count: run.selected_event_ids.length })}
                      </span>
                      <span className="num text-muted-foreground">
                        {t("an.model")}: {run.model_name}
                      </span>
                      {run.analysis_result ? (
                        <button
                          type="button"
                          onClick={() => {
                            setResult(run.analysis_result);
                            setFailed(false);
                            setTab("weekly");
                          }}
                          className="text-info hover:underline"
                        >
                          {t("an.resultTitle")}
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>
          </div>
        </>
      ) : null}

      {/* ---------------- Confirm dialog ---------------- */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("an.confirmTitle")}</DialogTitle>
            <DialogDescription>{t("an.confirmDesc")}</DialogDescription>
          </DialogHeader>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-medium">{t("ec.colDate")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("ec.colImpact")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("ec.colEvent")}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{t("ec.marketForecast")}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{t("ec.auriqEstimateCol")}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{t("ec.previous")}</th>
                  <th className="px-2 py-1.5 font-medium">{t("ec.colSource")}</th>
                </tr>
              </thead>
              <tbody>
                {confirmSnapshots.map((s) => (
                  <tr key={s.releaseId} className="border-b border-border/60">
                    <td className="num px-2 py-1.5 whitespace-nowrap">
                      {bkkDateTime(s.nextReleaseUtc)} {t("ec.tz")}
                    </td>
                    <td className="px-2 py-1.5">
                      <ImpactSquare impact={s.impact} />
                    </td>
                    <td className="min-w-0 px-2 py-1.5">{eventLabel(s.event, lang)}</td>
                    <td className="num px-2 py-1.5 text-right">
                      {s.marketForecast ?? t("ec.noConsensusYet")}
                    </td>
                    <td className="num px-2 py-1.5 text-right text-muted-foreground">
                      {s.auriqEstimate ?? "—"}
                    </td>
                    <td className="num px-2 py-1.5 text-right text-muted-foreground">
                      {s.previous ?? "—"}
                    </td>
                    <td className="num px-2 py-1.5 text-[10px] break-words text-muted-foreground">
                      {s.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {t("an.cancel")}
            </button>
            <button
              type="button"
              onClick={submitAnalysis}
              className="inline-flex items-center gap-1.5 rounded-sm border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/25"
            >
              <Send className="size-3" aria-hidden />
              {t("an.confirmSubmit")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AnalysisResultView({
  result,
  events,
}: {
  result: WeeklyAnalysisResult;
  events: EventSnapshot[];
}) {
  const { t, lang } = useI18n();
  const visualRef = useRef<HTMLDivElement>(null);
  const label = (id: string) =>
    eventLabel(events.find((e) => e.releaseId === id)?.event ?? id, lang);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {lang === "th" ? "ภาพสรุปพร้อมแชร์" : "Shareable visual summary"}
        </p>
        <ExportImageButton
          targetRef={visualRef}
          filePrefix="auriq-gold-impact-summary"
          label={lang === "th" ? "ดาวน์โหลดภาพสรุป" : "Download summary image"}
        />
      </div>
      <WeeklyVisualSummary ref={visualRef} result={result} events={events} lang={lang} />

      <PanelCard title={t("an.resultTitle")} subtitle={result.summary}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-surface p-3 text-xs">
            <p className="mb-1 text-muted-foreground">{t("an.usd")}</p>
            <DirectionText direction={result.usdOutlook.direction} />
            <p className="mt-1 text-muted-foreground">{result.usdOutlook.note}</p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3 text-xs">
            <p className="mb-1 text-muted-foreground">{t("an.gold")}</p>
            <DirectionText direction={result.goldOutlook.direction} />
            <p className="mt-1 text-muted-foreground">{result.goldOutlook.note}</p>
          </div>
        </div>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={t("an.fvp")}>
          <ul className="space-y-1.5 text-xs">
            {result.forecastVsPrevious.map((r) => (
              <li key={r.releaseId} className="min-w-0">
                <span className="font-medium">{label(r.releaseId)}</span>
                <span className="text-muted-foreground"> — {r.comparison}</span>
              </li>
            ))}
            {result.forecastVsPrevious.length === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : null}
          </ul>
        </PanelCard>
        <PanelCard title={t("an.evf")} subtitle={t("ec.estimateNote")}>
          <ul className="space-y-1.5 text-xs">
            {result.estimateVsForecast.map((r) => (
              <li key={r.releaseId} className="min-w-0">
                <span className="font-medium">{label(r.releaseId)}</span>
                <span className="text-muted-foreground"> — {r.comparison}</span>
              </li>
            ))}
            {result.estimateVsForecast.length === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : null}
          </ul>
        </PanelCard>
      </div>

      <PanelCard title={t("an.scenarios")}>
        <dl className="grid gap-3 text-xs md:grid-cols-3">
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="mb-1 text-positive">{t("an.above")}</dt>
            <dd className="text-muted-foreground">{result.scenarios.above}</dd>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="mb-1 text-muted-foreground">{t("an.inline")}</dt>
            <dd className="text-muted-foreground">{result.scenarios.inline}</dd>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="mb-1 text-negative">{t("an.below")}</dt>
            <dd className="text-muted-foreground">{result.scenarios.below}</dd>
          </div>
        </dl>
      </PanelCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={t("an.avoid")}>
          <ul className="space-y-1.5 text-xs">
            {result.avoidWindows.map((w) => (
              <li key={w.window} className="min-w-0">
                <span className="num font-medium">{w.window}</span>
                <span className="text-muted-foreground"> — {w.reason}</span>
              </li>
            ))}
            {result.avoidWindows.length === 0 ? <li className="text-muted-foreground">—</li> : null}
          </ul>
        </PanelCard>
        <PanelCard title={t("an.confidence")}>
          <p className="text-xs">
            <StatusBadge
              tone={
                result.confidence.level === "High"
                  ? "positive"
                  : result.confidence.level === "Medium"
                    ? "warning"
                    : "neutral"
              }
            >
              {result.confidence.level}
            </StatusBadge>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{result.confidence.reason}</p>
        </PanelCard>
      </div>

      <PanelCard title={t("an.sources")}>
        <ul className="space-y-1 text-[11px] break-words text-muted-foreground">
          {result.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="num mt-3 text-[11px] text-muted-foreground">
          {t("an.model")}: {result.modelName} · {t("an.generated")}:{" "}
          {new Date(result.generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC
        </p>
        <p className="mt-2 rounded-sm border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning">
          {result.disclaimer}
        </p>
      </PanelCard>
    </>
  );
}

const WeeklyVisualSummary = function WeeklyVisualSummary({
  ref,
  result,
  events,
  lang,
}: {
  ref: Ref<HTMLDivElement>;
  result: WeeklyAnalysisResult;
  events: EventSnapshot[];
  lang: string;
}) {
  const visualRows = result.visualSummary?.rows ?? [];
  const findVisual = (releaseId: string) => visualRows.find((row) => row.releaseId === releaseId);
  const dateRange = events.length
    ? `${bkkDateTime(events[0]!.nextReleaseUtc)} – ${bkkDateTime(events.at(-1)!.nextReleaseUtc)}`
    : "";
  const impactText = (impact: EventSnapshot["impact"]) =>
    impact === "High"
      ? lang === "th"
        ? "สูง"
        : "High"
      : impact === "Medium"
        ? lang === "th"
          ? "กลาง"
          : "Medium"
        : lang === "th"
          ? "ต่ำ"
          : "Low";

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-lg border border-[#d9ad43] bg-[#f7f4ed] text-[#071a3a] shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
    >
      <header className="border-b-4 border-[#d9ad43] bg-[linear-gradient(135deg,#03132d,#082d5e)] px-5 py-5 text-white">
        <p className="text-[10px] font-semibold tracking-[0.22em] text-[#e9bb4c]">
          AURIQ INTELLIGENCE
        </p>
        <h2 className="mt-1 text-xl leading-tight font-extrabold sm:text-3xl">
          {result.visualSummary?.title ??
            (lang === "th"
              ? "สรุปผลกระทบข่าวเศรษฐกิจต่อทองคำ (XAU/USD)"
              : "Economic impact summary for gold (XAU/USD)")}
        </h2>
        <p className="mt-2 text-xs text-blue-100">{dateRange} · ICT</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-xs sm:text-sm">
          <thead className="bg-[#082d5e] text-white">
            <tr>
              <th className="w-[15%] border-r border-white/30 px-3 py-3">
                {lang === "th" ? "วัน / เวลา" : "Date / time"}
              </th>
              <th className="w-[26%] border-r border-white/30 px-3 py-3">
                {lang === "th" ? "ข่าว" : "Release"}
              </th>
              <th className="w-[12%] border-r border-white/30 px-3 py-3 text-center">Impact</th>
              <th className="w-[24%] border-r border-white/30 px-3 py-3">
                {lang === "th" ? "ผลต่อทองคำ" : "Gold impact"}
              </th>
              <th className="w-[23%] px-3 py-3">{lang === "th" ? "แผนรับมือ" : "Response plan"}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, index) => {
              const row = findVisual(event.releaseId);
              const fallbackComparison = result.forecastVsPrevious.find(
                (item) => item.releaseId === event.releaseId,
              )?.comparison;
              return (
                <tr key={event.releaseId} className={index % 2 ? "bg-[#eef1f5]" : "bg-white"}>
                  <td className="border-r border-b border-[#9aa9bb] px-3 py-3 font-bold">
                    {bkkDateTime(event.nextReleaseUtc)}
                  </td>
                  <td className="border-r border-b border-[#9aa9bb] px-3 py-3 font-semibold">
                    {eventLabel(event.event, lang)}
                    <p className="mt-1 text-[10px] font-normal text-[#52627a]">
                      F {event.marketForecast ?? "—"} · P {event.previous ?? "—"}
                    </p>
                  </td>
                  <td
                    className={cn(
                      "border-r border-b border-[#9aa9bb] px-3 py-3 text-center text-base font-extrabold",
                      event.impact === "High"
                        ? "text-[#b51f1f]"
                        : event.impact === "Medium"
                          ? "text-[#c27a00]"
                          : "text-[#52627a]",
                    )}
                  >
                    {impactText(event.impact)}
                  </td>
                  <td className="border-r border-b border-[#9aa9bb] px-3 py-3 font-medium">
                    {row?.goldImpact || fallbackComparison || "—"}
                  </td>
                  <td className="border-b border-[#9aa9bb] px-3 py-3 font-semibold text-[#103f89]">
                    {row?.responsePlan ||
                      (lang === "th"
                        ? "รอผลจริงและสัญญาณราคายืนยัน"
                        : "Wait for actual data and price confirmation")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="grid gap-3 bg-[linear-gradient(135deg,#03132d,#082d5e)] px-5 py-4 text-white sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#e9bb4c]">
            {lang === "th" ? "ภาพรวมและการบริหารความเสี่ยง" : "MARKET & RISK CONTEXT"}
          </p>
          <p className="mt-1 text-xs text-blue-100">
            {result.visualSummary?.marketContext || result.confidence.reason}
          </p>
        </div>
        <span className="rounded border border-[#e9bb4c]/70 px-3 py-1.5 text-xs font-bold text-[#e9bb4c]">
          {lang === "th" ? "ความมั่นใจ" : "Confidence"}: {result.confidence.level}
        </span>
        <p className="text-[9px] text-blue-200 sm:col-span-2">{result.disclaimer}</p>
      </footer>
    </div>
  );
};
