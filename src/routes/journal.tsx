import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { journal } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import { useMt5Deals } from "@/hooks/use-mt5-deals";
import { num, signedMoney, toneFor } from "@/lib/format";

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
      {
        property: "og:description",
        content: "Thesis, checklist, emotions and discipline scoring — demo data.",
      },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Journal,
});

function Journal() {
  const { t, tx } = useI18n();
  const deals = useMt5Deals();

  const CHECKLIST = [
    t("journal.check1"),
    t("journal.check2"),
    t("journal.check3"),
    t("journal.check4"),
    t("journal.check5"),
  ];

  return (
    <>
      <PageHeader
        title={t("journal.title")}
        description={t("journal.desc")}
        actions={
          <Button
            size="sm"
            onClick={() => toast(t("toast.prototype"), { description: t("journal.newToast") })}
          >
            {t("journal.new")}
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          {deals.data?.length ? (
            <PanelCard
              title="MT5 Trade Journal · Auto-created"
              subtitle="รายการจริงแบบ Read-only — เพิ่มเหตุผลและรีวิวได้ในขั้นถัดไป"
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-3 py-2 text-left">เวลา ICT</th>
                      <th className="px-3 py-2 text-left">Symbol</th>
                      <th className="px-3 py-2 text-left">Side</th>
                      <th className="px-3 py-2 text-right">Lot</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Net P/L</th>
                      <th className="px-3 py-2 text-left">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.data.map((deal) => (
                      <tr key={deal.id} className="border-b border-border/60">
                        <td className="px-3 py-2">
                          {new Intl.DateTimeFormat("th-TH", {
                            timeZone: "Asia/Bangkok",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }).format(new Date(deal.executedAt))}
                        </td>
                        <td className="num px-3 py-2 font-semibold">{deal.symbol}</td>
                        <td
                          className={cn(
                            "px-3 py-2 font-semibold",
                            deal.side === "BUY" ? "text-positive" : "text-negative",
                          )}
                        >
                          {deal.side}
                        </td>
                        <td className="num px-3 py-2 text-right">{deal.volume}</td>
                        <td className="num px-3 py-2 text-right">{num(deal.price, 3)}</td>
                        <td className={cn("num px-3 py-2 text-right", toneFor(deal.netPnl))}>
                          {signedMoney(deal.netPnl)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">รอรีวิว</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          ) : null}

          {(deals.data?.length ? [] : journal).map((j) => (
            <PanelCard
              key={j.id}
              title={tx(j.title)}
              subtitle={`${j.date} ${j.time} · ${tx(j.setup)}`}
              action={
                <StatusBadge
                  tone={
                    j.disciplineScore >= 8
                      ? "positive"
                      : j.disciplineScore >= 6
                        ? "gold"
                        : "negative"
                  }
                >
                  {t("journal.discipline", { score: j.disciplineScore })}
                </StatusBadge>
              }
            >
              <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
                <div className="grid h-20 place-items-center rounded-sm border border-dashed border-border bg-surface/60 text-muted-foreground">
                  {j.hasScreenshot ? (
                    <ImageIcon className="size-5" aria-hidden />
                  ) : (
                    <ImagePlus className="size-5" aria-hidden />
                  )}
                  <span className="sr-only">
                    {j.hasScreenshot ? t("journal.screenshot") : t("journal.noScreenshot")}
                  </span>
                </div>
                <dl className="min-w-0 space-y-2 text-xs">
                  <div>
                    <dt className="font-medium">{t("journal.thesis")}</dt>
                    <dd className="text-muted-foreground">{tx(j.thesis)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">{t("journal.review")}</dt>
                    <dd className="text-muted-foreground">{tx(j.review)}</dd>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusBadge tone="info">{tx(j.emotion)}</StatusBadge>
                    {j.errors.length ? (
                      j.errors.map((e) => (
                        <StatusBadge key={e} tone="negative">
                          {tx(e)}
                        </StatusBadge>
                      ))
                    ) : (
                      <StatusBadge tone="positive">{t("journal.noErrors")}</StatusBadge>
                    )}
                  </div>
                </dl>
              </div>
            </PanelCard>
          ))}
        </div>

        <aside className="flex flex-col gap-4">
          <PanelCard title={t("journal.checklist")}>
            <ul className="space-y-2 text-xs">
              {CHECKLIST.map((c, i) => (
                <li key={c} className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1 size-1.5 shrink-0 rounded-full",
                      i < 4 ? "bg-positive" : "bg-muted-foreground",
                    )}
                    aria-hidden
                  />
                  <span className={cn(i < 4 ? "text-foreground" : "text-muted-foreground")}>
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard title={t("journal.upload")}>
            <div className="grid place-items-center rounded-sm border border-dashed border-border px-4 py-8 text-center">
              <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
              <p className="mt-2 text-xs text-muted-foreground">{t("journal.uploadHint")}</p>
            </div>
          </PanelCard>

          <PanelCard title={t("journal.trend")}>
            <div className="flex h-24 items-end gap-2">
              {[7, 6, 9, 5, 8, 9, 10].map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-primary/70"
                    style={{ height: `${v * 8}px` }}
                  />
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
