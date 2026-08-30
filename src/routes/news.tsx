import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";

import { news } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { AdvisoryTag, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

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
      { property: "og:description", content: "Sourced headlines with transparent AI rationale and citations — demo data." },
    ],
  }),
  component: News,
});

function News() {
  return (
    <>
      <PageHeader
        title="News Intelligence"
        description="Headlines collected from permitted RSS sources, deduplicated, scored for gold relevance and explained with citations."
        actions={<AdvisoryTag />}
      />

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
                Source <ExternalLink className="size-3" aria-hidden />
              </a>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={n.direction === "Bullish" ? "positive" : n.direction === "Bearish" ? "negative" : "neutral"}
              >
                {n.direction}
              </StatusBadge>
              <StatusBadge tone="info">Confidence {n.confidence}</StatusBadge>
              <StatusBadge tone="neutral">{n.horizon}</StatusBadge>
              <StatusBadge tone={n.dedup === "Unique" ? "gold" : "neutral"}>{n.dedup}</StatusBadge>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Gold relevance</span>
                <span className="num">{n.relevance}/100</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-accent">
                <div
                  className={cn("h-full rounded-full", n.relevance > 70 ? "bg-primary" : "bg-info")}
                  style={{ width: `${n.relevance}%` }}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{n.rationale}</p>

            <div className="mt-3 border-t border-border pt-2">
              <p className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">Citations</p>
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

      <p className="rounded-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        AURIQ links to original sources and never republishes licensed content. Analysis is generated
        server-side and is advisory only — it can never place an order.
      </p>
    </>
  );
}
