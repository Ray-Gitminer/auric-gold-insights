import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { journal } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trader Journal · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Trade journaling with thesis, setup, pre-trade checklist, emotions, errors, review notes and a discipline score.",
      },
      { property: "og:title", content: "Trader Journal · AURIQ" },
      { property: "og:description", content: "Thesis, checklist, emotions and discipline scoring — demo data." },
    ],
  }),
  component: Journal,
});

const CHECKLIST = [
  "Setup matches a written plan",
  "Risk per trade ≤ 1% of NLV",
  "Stop and target defined before entry",
  "No high-impact event within 60 minutes",
  "Position size verified against margin",
];

function Journal() {
  return (
    <>
      <PageHeader
        title="Trader Journal"
        description="Capture the thesis, follow the checklist, record emotions and errors, then review the outcome and score discipline."
        actions={
          <Button
            size="sm"
            onClick={() => toast("Prototype control", { description: "Journal entries will persist once the backend is connected." })}
          >
            New entry
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {journal.map((j) => (
            <PanelCard
              key={j.id}
              title={j.title}
              subtitle={`${j.date} ${j.time} · ${j.setup}`}
              action={
                <StatusBadge tone={j.disciplineScore >= 8 ? "positive" : j.disciplineScore >= 6 ? "gold" : "negative"}>
                  Discipline {j.disciplineScore}/10
                </StatusBadge>
              }
            >
              <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
                <div className="grid h-20 place-items-center rounded-sm border border-dashed border-border bg-surface/60 text-muted-foreground">
                  {j.hasScreenshot ? <ImageIcon className="size-5" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
                  <span className="sr-only">{j.hasScreenshot ? "Chart screenshot attached" : "No screenshot"}</span>
                </div>
                <dl className="min-w-0 space-y-2 text-xs">
                  <div>
                    <dt className="font-medium">Thesis</dt>
                    <dd className="text-muted-foreground">{j.thesis}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Review</dt>
                    <dd className="text-muted-foreground">{j.review}</dd>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusBadge tone="info">{j.emotion}</StatusBadge>
                    {j.errors.length ? (
                      j.errors.map((e) => (
                        <StatusBadge key={e} tone="negative">
                          {e}
                        </StatusBadge>
                      ))
                    ) : (
                      <StatusBadge tone="positive">No process errors</StatusBadge>
                    )}
                  </div>
                </dl>
              </div>
            </PanelCard>
          ))}
        </div>

        <aside className="flex flex-col gap-4">
          <PanelCard title="Pre-trade checklist">
            <ul className="space-y-2 text-xs">
              {CHECKLIST.map((c, i) => (
                <li key={c} className="flex items-start gap-2">
                  <span
                    className={cn("mt-1 size-1.5 shrink-0 rounded-full", i < 4 ? "bg-positive" : "bg-muted-foreground")}
                    aria-hidden
                  />
                  <span className={cn(i < 4 ? "text-foreground" : "text-muted-foreground")}>{c}</span>
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard title="Chart upload">
            <div className="grid place-items-center rounded-sm border border-dashed border-border px-4 py-8 text-center">
              <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-xs text-muted-foreground">
                Drop a chart screenshot here. Upload is a placeholder until storage is connected.
              </p>
            </div>
          </PanelCard>

          <PanelCard title="Discipline trend">
            <div className="flex h-24 items-end gap-2">
              {[7, 6, 9, 5, 8, 9, 10].map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-sm bg-primary/70" style={{ height: `${v * 8}px` }} />
                  <span className="num text-[10px] text-muted-foreground">{v}</span>
                </div>
              ))}
            </div>
          </PanelCard>
        </aside>
      </div>
    </>
  );
}
