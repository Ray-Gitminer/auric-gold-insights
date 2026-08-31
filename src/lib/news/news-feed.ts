import { createServerFn } from "@tanstack/react-start";

import type { AnalyzedNewsItem, CalendarContextItem, FeedArticle, NewsPayload } from "./types";

interface FeedSpec {
  name: string;
  url: string;
}

/** Publicly available RSS feeds. Each item keeps its real source and date. */
const FEEDS: FeedSpec[] = [
  {
    name: "Google News · Gold",
    url: "https://news.google.com/rss/search?q=gold+price+OR+XAUUSD+when:3d&hl=en-US&gl=US&ceid=US:en",
  },
  {
    name: "Google News · Fed & Dollar",
    url: "https://news.google.com/rss/search?q=Federal+Reserve+OR+%22US+dollar%22+inflation+when:3d&hl=en-US&gl=US&ceid=US:en",
  },
  { name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_monetary.xml" },
  { name: "BLS", url: "https://www.bls.gov/feed/bls_latest.rss" },
];

function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m?.[1] ? decode(m[1]) : "";
}

function parseRss(xml: string, feedName: string): FeedArticle[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const out: FeedArticle[] = [];
  for (const block of blocks) {
    const headline = tag(block, "title");
    const link = tag(block, "link");
    if (!headline || !link) continue;
    const date = tag(block, "pubDate") || tag(block, "dc:date");
    const parsed = date ? Date.parse(date) : NaN;
    const namedSource = tag(block, "source");
    out.push({
      id: `${feedName}-${out.length}-${headline.slice(0, 40)}`,
      headline,
      source: namedSource || feedName,
      url: link,
      publishedIso: Number.isFinite(parsed)
        ? new Date(parsed).toISOString()
        : new Date().toISOString(),
    });
  }
  return out;
}

const GOLD_TERMS =
  /(gold|bullion|xau|precious metal|federal reserve|fed |rate cut|rate hike|inflation|cpi|pce|dollar|dxy|treasury yield|payroll|fomc|jobs report)/i;

function heuristicAnalyze(a: FeedArticle): AnalyzedNewsItem {
  const h = a.headline.toLowerCase();
  const bullish =
    /(rate cut|dovish|weaker dollar|dollar slips|safe haven|inflation cools|softer|record high|buying)/;
  const bearish =
    /(rate hike|hawkish|stronger dollar|dollar rises|yields rise|inflation hot|hotter|selloff|sell-off)/;
  const direction = bullish.test(h) ? "Bullish" : bearish.test(h) ? "Bearish" : "Neutral";
  const relevance = /gold|bullion|xau/.test(h) ? 78 : 55;
  return {
    ...a,
    dedup: "Unique",
    relevance,
    direction,
    horizon: "1–3 sessions",
    confidence: "Low",
    rationale: "Keyword screen only — AI analysis was unavailable for this batch.",
    citations: [a.source],
    linkedReleaseId: null,
    analysisMode: "Heuristic",
  };
}

function dedupe(articles: FeedArticle[]): { article: FeedArticle; dup: boolean }[] {
  const seen = new Set<string>();
  return articles.map((article) => {
    const key = article.headline
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(/\s+/)
      .slice(0, 6)
      .join(" ");
    const dup = seen.has(key);
    seen.add(key);
    return { article, dup };
  });
}

export const fetchNewsIntelligence = createServerFn({ method: "POST" })
  .inputValidator((input: { calendar: CalendarContextItem[] }) => input)
  .handler(async ({ data }): Promise<NewsPayload> => {
    const fetchedAt = new Date().toISOString();
    const sources: NewsPayload["sources"] = [];
    const collected: FeedArticle[] = [];

    await Promise.all(
      FEEDS.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            headers: {
              "User-Agent": "AURIQ/1.0 (+news-intelligence)",
              Accept: "application/rss+xml, application/xml, text/xml",
            },
          });
          if (!res.ok) {
            sources.push({ name: feed.name, ok: false, count: 0 });
            return;
          }
          const items = parseRss(await res.text(), feed.name).filter((a) =>
            GOLD_TERMS.test(a.headline),
          );
          sources.push({ name: feed.name, ok: true, count: items.length });
          collected.push(...items.slice(0, 8));
        } catch {
          sources.push({ name: feed.name, ok: false, count: 0 });
        }
      }),
    );

    const ranked = dedupe(
      collected.sort((a, b) => b.publishedIso.localeCompare(a.publishedIso)).slice(0, 14),
    );

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey || ranked.length === 0) {
      return {
        items: ranked.map(({ article, dup }) => ({
          ...heuristicAnalyze(article),
          dedup: dup ? "Duplicate cluster" : "Unique",
        })),
        fetchedAt,
        sources,
        analysisMode: "Heuristic",
      };
    }

    const calendarBrief = data.calendar
      .slice(0, 10)
      .map(
        (c) =>
          `${c.releaseId} | ${c.event} | impact ${c.impact} | due ${c.nextReleaseUtc} | forecast ${c.forecast}` +
          (c.actual
            ? ` | actual ${c.actual} (${c.surpriseDir ?? "n/a"}, gold ${c.goldBias ?? "n/a"})`
            : ""),
      )
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-3.7-flash",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a gold (XAU/USD) macro analyst. Score real headlines for gold impact. " +
                "Never invent headlines, sources or numbers. Use only the supplied headlines and calendar rows. " +
                "Reply with JSON only.",
            },
            {
              role: "user",
              content:
                `US economic calendar context (releaseId | event | impact | due | forecast | actual):\n${calendarBrief || "none"}\n\n` +
                `Headlines (index | source | published | headline):\n` +
                ranked
                  .map(
                    ({ article }, i) =>
                      `${i} | ${article.source} | ${article.publishedIso} | ${article.headline}`,
                  )
                  .join("\n") +
                `\n\nReturn {"items":[{"index":0,"relevance":0-100,"direction":"Bullish|Bearish|Neutral",` +
                `"horizon":"intraday|1–3 sessions|1–2 weeks","confidence":"High|Medium|Low",` +
                `"rationale":"one or two sentences on the gold transmission channel",` +
                `"linkedReleaseId":"calendar releaseId or null"}]} for every headline index.`,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error(`gateway ${res.status}`);
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as {
        items?: {
          index?: number;
          relevance?: number;
          direction?: string;
          horizon?: string;
          confidence?: string;
          rationale?: string;
          linkedReleaseId?: string | null;
        }[];
      };

      const byIndex = new Map((parsed.items ?? []).map((r) => [Number(r.index), r]));
      const items: AnalyzedNewsItem[] = ranked.map(({ article, dup }, i) => {
        const r = byIndex.get(i);
        if (!r)
          return { ...heuristicAnalyze(article), dedup: dup ? "Duplicate cluster" : "Unique" };
        const direction =
          r.direction === "Bullish" || r.direction === "Bearish" ? r.direction : "Neutral";
        const confidence =
          r.confidence === "High" || r.confidence === "Medium" ? r.confidence : "Low";
        const linked =
          typeof r.linkedReleaseId === "string" &&
          data.calendar.some((c) => c.releaseId === r.linkedReleaseId)
            ? r.linkedReleaseId
            : null;
        return {
          ...article,
          dedup: dup ? "Duplicate cluster" : "Unique",
          relevance: Math.max(0, Math.min(100, Math.round(Number(r.relevance) || 0))),
          direction,
          horizon: typeof r.horizon === "string" && r.horizon ? r.horizon : "1–3 sessions",
          confidence,
          rationale: typeof r.rationale === "string" ? r.rationale : "",
          citations: [article.source, ...(linked ? [`AURIQ Economic Calendar · ${linked}`] : [])],
          linkedReleaseId: linked,
          analysisMode: "AI",
        };
      });

      return { items, fetchedAt, sources, analysisMode: "AI" };
    } catch {
      return {
        items: ranked.map(({ article, dup }) => ({
          ...heuristicAnalyze(article),
          dedup: dup ? "Duplicate cluster" : "Unique",
        })),
        fetchedAt,
        sources,
        analysisMode: "Heuristic",
      };
    }
  });
