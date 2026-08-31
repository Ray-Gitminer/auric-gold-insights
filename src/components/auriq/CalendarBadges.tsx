import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import type { CalendarEvent, ForecastLabel, ImpactAssessment } from "@/lib/economic-calendar/types";

const FORECAST_TONE: Record<ForecastLabel, string> = {
  "Market Consensus": "border-positive/40 bg-positive/10 text-positive",
  "Model Estimate": "border-primary/45 bg-primary/10 text-primary",
  "AURIQ Estimate": "border-info/40 bg-info/10 text-info",
};

const FORECAST_KEY: Record<
  ForecastLabel,
  "ec.consensus" | "ec.modelEstimate" | "ec.auriqEstimate"
> = {
  "Market Consensus": "ec.consensus",
  "Model Estimate": "ec.modelEstimate",
  "AURIQ Estimate": "ec.auriqEstimate",
};

/** Exactly one forecast badge per row — never blank, never two. */
export function ForecastBadge({
  forecast,
  className,
}: {
  forecast: CalendarEvent["forecast"];
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <span
      title={forecast.detail || undefined}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase",
        FORECAST_TONE[forecast.label],
        className,
      )}
    >
      {t(FORECAST_KEY[forecast.label])}
    </span>
  );
}

export function ActualBadge({ source }: { source: string }) {
  const { t } = useI18n();
  return (
    <span
      title={source}
      className="inline-flex items-center rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase"
    >
      {t("ec.actualLabel")}
    </span>
  );
}

export function SurprisePill({ assessment }: { assessment: ImpactAssessment }) {
  const { t } = useI18n();
  const tone =
    assessment.surpriseDir === "beat"
      ? "border-positive/40 bg-positive/10 text-positive"
      : assessment.surpriseDir === "miss"
        ? "border-negative/40 bg-negative/10 text-negative"
        : "border-border bg-surface text-muted-foreground";
  const dot =
    assessment.surpriseDir === "beat" ? "🟢" : assessment.surpriseDir === "miss" ? "🔴" : "⚪";
  const label =
    assessment.surpriseDir === "beat"
      ? t("ec.beat")
      : assessment.surpriseDir === "miss"
        ? t("ec.miss")
        : t("ec.inline");

  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        tone,
      )}
    >
      {assessment.surprisePct > 0 ? "+" : ""}
      {assessment.surprisePct}% {label} {dot}
    </span>
  );
}

export function ImpactDots({ impact }: { impact: "High" | "Medium" | "Low" }) {
  const { t } = useI18n();
  const count = impact === "High" ? 3 : impact === "Medium" ? 2 : 1;
  const tone = impact === "High" ? "bg-negative" : impact === "Medium" ? "bg-primary" : "bg-info";
  return (
    <span className="flex gap-0.5" aria-label={t("overview.impactAria", { impact })}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={cn("size-1.5 rounded-full", tone)} aria-hidden />
      ))}
    </span>
  );
}
