import type {
  AnalyzedNewsItem,
  CalendarContextItem,
  GoldImpactScore,
  ImpactDriver,
} from "./types";

const DIRECTION_SIGN = { Bullish: 1, Bearish: -1, Neutral: 0 } as const;
const CONFIDENCE_WEIGHT = { High: 1, Medium: 0.7, Low: 0.4 } as const;
const IMPACT_WEIGHT = { High: 1, Medium: 0.6, Low: 0.3 } as const;

export function bandFor(score: number): string {
  if (score >= 60) return "Strongly bullish";
  if (score >= 20) return "Moderately bullish";
  if (score > -20) return "Neutral";
  if (score > -60) return "Moderately bearish";
  return "Strongly bearish";
}

/**
 * Blend analysed headlines (70%) with released economic-calendar surprises
 * (30%) into a -100…+100 gold impact score. Pure and testable.
 */
export function computeGoldImpactScore(
  news: AnalyzedNewsItem[],
  calendar: CalendarContextItem[],
  now = new Date(),
): GoldImpactScore {
  const drivers: ImpactDriver[] = [];

  let newsSum = 0;
  let newsWeight = 0;
  for (const item of news) {
    const ageH = Math.max(0, (now.getTime() - Date.parse(item.publishedIso)) / 3_600_000);
    const recency = Math.exp(-ageH / 36);
    const w = (item.relevance / 100) * CONFIDENCE_WEIGHT[item.confidence] * recency;
    const contribution = DIRECTION_SIGN[item.direction] * w * 100;
    newsSum += contribution;
    newsWeight += w;
    if (Math.abs(contribution) >= 1) {
      drivers.push({
        label: item.headline,
        weight: Math.round(contribution),
        kind: "news",
      });
    }
  }
  const newsScore = newsWeight > 0 ? newsSum / newsWeight : 0;

  let evSum = 0;
  let evWeight = 0;
  for (const ev of calendar) {
    if (!ev.goldBias || ev.goldBias === "neutral" || ev.surprisePct == null) continue;
    const w = IMPACT_WEIGHT[ev.impact] * Math.min(1, Math.abs(ev.surprisePct) / 20);
    if (w <= 0) continue;
    const contribution = (ev.goldBias === "bullish" ? 1 : -1) * w * 100;
    evSum += contribution;
    evWeight += w;
    drivers.push({
      label: `${ev.event} ${ev.surpriseDir ?? ""} ${ev.surprisePct > 0 ? "+" : ""}${ev.surprisePct}%`.trim(),
      weight: Math.round(contribution),
      kind: "calendar",
    });
  }
  const eventScore = evWeight > 0 ? evSum / evWeight : 0;

  const hasNews = newsWeight > 0;
  const hasEvents = evWeight > 0;
  const score =
    hasNews && hasEvents
      ? newsScore * 0.7 + eventScore * 0.3
      : hasNews
        ? newsScore
        : hasEvents
          ? eventScore
          : 0;

  drivers.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));

  return {
    score: Math.round(Math.max(-100, Math.min(100, score))),
    band: bandFor(score),
    drivers: drivers.slice(0, 5),
    newsCount: news.length,
    eventCount: calendar.length,
    computedAt: now.toISOString(),
  };
}
