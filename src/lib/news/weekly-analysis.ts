import { createServerFn } from "@tanstack/react-start";

import type {
  ComparisonRow,
  ConfidenceLevel,
  Direction,
  EventSnapshot,
  WeeklyAnalysisResult,
} from "./analysis-types";

export const ANALYSIS_MODEL = "google/gemini-3.7-flash";

export interface AnalysisHeadline {
  headline: string;
  source: string;
  publishedIso: string;
}

export interface WeeklyAnalysisInput {
  events: EventSnapshot[];
  headlines: AnalysisHeadline[];
  /** UI language of the requester — the narrative is written in this language. */
  lang: "th" | "en";
}

const DISCLAIMER_TH =
  "เอกสารนี้เป็นการวิเคราะห์ข้อมูลเพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำหรือคำสั่งซื้อขาย";
const DISCLAIMER_EN =
  "This is analytical information for research purposes only — not trading advice and not an order instruction.";

function dir(value: unknown): Direction {
  return value === "Bullish" || value === "Bearish" ? value : "Neutral";
}

function level(value: unknown): ConfidenceLevel {
  return value === "High" || value === "Medium" ? value : "Low";
}

function rows(value: unknown, events: EventSnapshot[]): ComparisonRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((raw) => {
      const r = raw as { releaseId?: unknown; comparison?: unknown };
      const releaseId = typeof r.releaseId === "string" ? r.releaseId : "";
      const match = events.find((e) => e.releaseId === releaseId);
      if (!match || typeof r.comparison !== "string" || !r.comparison.trim()) return null;
      return { releaseId, event: match.event, comparison: r.comparison.trim() };
    })
    .filter((r): r is ComparisonRow => r !== null);
}

function line(e: EventSnapshot): string {
  return [
    e.releaseId,
    e.event,
    `${e.currency}`,
    `impact ${e.impact}`,
    `release ${e.nextReleaseUtc}`,
    `marketForecast ${e.marketForecast ?? "none"}`,
    `auriqEstimate ${e.auriqEstimate ?? "none"}`,
    `previous ${e.previous ?? "none"}`,
    `actual ${e.actual ?? "none"}`,
    `source ${e.source}`,
  ].join(" | ");
}

export const runWeeklyAnalysis = createServerFn({ method: "POST" })
  .inputValidator((input: WeeklyAnalysisInput) => input)
  .handler(async ({ data }): Promise<WeeklyAnalysisResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI_UNAVAILABLE");
    if (data.events.length === 0) throw new Error("NO_EVENTS");

    const disclaimer = data.lang === "th" ? DISCLAIMER_TH : DISCLAIMER_EN;
    const language = data.lang === "th" ? "Thai" : "English";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a macro analyst covering XAU/USD and the US dollar. " +
              "Use ONLY the supplied calendar rows and headlines. Never invent a number, a source, " +
              "an actual, a forecast or a previous value. When a field is 'none', say it is unavailable. " +
              `Write every narrative field in ${language}. Reply with JSON only.`,
          },
          {
            role: "user",
            content:
              `Selected US economic releases (releaseId | event | currency | impact | release UTC | marketForecast | auriqEstimate | previous | actual | source):\n` +
              data.events.map(line).join("\n") +
              `\n\nRelated headlines (source | published | headline):\n` +
              (data.headlines
                .slice(0, 20)
                .map((h) => `${h.source} | ${h.publishedIso} | ${h.headline}`)
                .join("\n") || "none") +
              `\n\nReturn JSON:\n` +
              `{"summary":"how these releases and headlines connect over the selected window",` +
              `"usdOutlook":{"direction":"Bullish|Bearish|Neutral","note":"..."},` +
              `"goldOutlook":{"direction":"Bullish|Bearish|Neutral","note":"..."},` +
              `"forecastVsPrevious":[{"releaseId":"...","comparison":"market forecast vs previous"}],` +
              `"estimateVsForecast":[{"releaseId":"...","comparison":"AURIQ estimate vs market forecast"}],` +
              `"scenarios":{"above":"if actual comes in above forecast","inline":"if in line","below":"if below"},` +
              `"avoidWindows":[{"window":"e.g. 19:30-20:15 ICT, 5 Sep","reason":"..."}],` +
              `"confidence":{"level":"High|Medium|Low","reason":"..."},` +
              `"visualSummary":{"title":"short weekly XAU/USD impact summary title",` +
              `"rows":[{"releaseId":"...","goldImpact":"conditional impact on gold based on actual vs forecast","responsePlan":"risk-first response; wait for confirmation; never invent a price"}],` +
              `"marketContext":"short risk note; include price levels only if explicitly present in input"},` +
              `"sources":["named source strings taken from the input only"]}`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI_GATEWAY_${res.status}`);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;

    const usd = (parsed["usdOutlook"] ?? {}) as { direction?: unknown; note?: unknown };
    const gold = (parsed["goldOutlook"] ?? {}) as { direction?: unknown; note?: unknown };
    const scen = (parsed["scenarios"] ?? {}) as Record<string, unknown>;
    const conf = (parsed["confidence"] ?? {}) as { level?: unknown; reason?: unknown };
    const avoid = Array.isArray(parsed["avoidWindows"]) ? parsed["avoidWindows"] : [];
    const visual = (parsed["visualSummary"] ?? {}) as Record<string, unknown>;
    const visualRows = Array.isArray(visual["rows"]) ? visual["rows"] : [];

    const inputSources = Array.from(
      new Set([...data.events.map((e) => e.source), ...data.headlines.map((h) => h.source)]),
    );
    const modelSources = Array.isArray(parsed["sources"])
      ? (parsed["sources"] as unknown[]).filter((s): s is string => typeof s === "string")
      : [];

    return {
      summary: typeof parsed["summary"] === "string" ? parsed["summary"] : "",
      usdOutlook: {
        direction: dir(usd.direction),
        note: typeof usd.note === "string" ? usd.note : "",
      },
      goldOutlook: {
        direction: dir(gold.direction),
        note: typeof gold.note === "string" ? gold.note : "",
      },
      forecastVsPrevious: rows(parsed["forecastVsPrevious"], data.events),
      estimateVsForecast: rows(parsed["estimateVsForecast"], data.events),
      scenarios: {
        above: typeof scen["above"] === "string" ? scen["above"] : "",
        inline: typeof scen["inline"] === "string" ? scen["inline"] : "",
        below: typeof scen["below"] === "string" ? scen["below"] : "",
      },
      avoidWindows: avoid
        .map((raw) => {
          const w = raw as { window?: unknown; reason?: unknown };
          return {
            window: typeof w.window === "string" ? w.window : "",
            reason: typeof w.reason === "string" ? w.reason : "",
          };
        })
        .filter((w) => w.window),
      confidence: {
        level: level(conf.level),
        reason: typeof conf.reason === "string" ? conf.reason : "",
      },
      visualSummary: {
        title:
          typeof visual["title"] === "string"
            ? visual["title"]
            : data.lang === "th"
              ? "สรุปผลกระทบข่าวเศรษฐกิจต่อทองคำ (XAU/USD)"
              : "Economic impact summary for gold (XAU/USD)",
        rows: visualRows
          .map((raw) => {
            const row = raw as {
              releaseId?: unknown;
              goldImpact?: unknown;
              responsePlan?: unknown;
            };
            const releaseId = typeof row.releaseId === "string" ? row.releaseId : "";
            if (!data.events.some((event) => event.releaseId === releaseId)) return null;
            return {
              releaseId,
              goldImpact: typeof row.goldImpact === "string" ? row.goldImpact : "",
              responsePlan: typeof row.responsePlan === "string" ? row.responsePlan : "",
            };
          })
          .filter(
            (row): row is { releaseId: string; goldImpact: string; responsePlan: string } =>
              row !== null,
          ),
        marketContext:
          typeof visual["marketContext"] === "string" ? visual["marketContext"] : disclaimer,
      },
      // Only surface sources that actually came from the supplied inputs.
      sources: modelSources.length
        ? Array.from(
            new Set(
              modelSources.filter((s) => inputSources.some((i) => i.includes(s) || s.includes(i))),
            ),
          )
        : inputSources,
      disclaimer,
      modelName: ANALYSIS_MODEL,
      generatedAt: new Date().toISOString(),
    };
  });
