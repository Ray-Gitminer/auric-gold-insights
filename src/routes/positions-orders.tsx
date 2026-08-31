import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { orders, positions } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PageHeader, PanelCard, StateGallery } from "@/components/auriq/primitives";
import { useI18n } from "@/contexts/I18nContext";

export const Route = createFileRoute("/positions-orders")({
  head: () => ({
    meta: [
      { title: "Positions & Orders · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Filterable paper-trading positions and working orders with prototype confirmation modals. No order is ever transmitted to a broker.",
      },
      { property: "og:title", content: "Positions & Orders · AURIQ" },
      {
        property: "og:description",
        content: "Filterable positions and orders with confirmation prototypes — demo data.",
      },
    ],
  }),
  component: PositionsOrders,
});

const SYMBOLS = ["All", "GCM5", "SILM5", "HGK5", "XAUUSD"] as const;

function PositionsOrders() {
  const { t } = useI18n();
  const [symbol, setSymbol] = useState<(typeof SYMBOLS)[number]>("All");
  const [dialog, setDialog] = useState<null | {
    title: string;
    description: string;
    details: { label: string; value: string }[];
  }>(null);

  const shownPositions = useMemo(
    () => positions.filter((p) => symbol === "All" || p.symbol === symbol),
    [symbol],
  );
  const shownOrders = useMemo(
    () => orders.filter((o) => symbol === "All" || o.symbol === symbol),
    [symbol],
  );

  return (
    <>
      <PageHeader
        title={t("po.title")}
        description={t("po.desc")}
        actions={
          <div className="flex flex-wrap gap-1" role="group" aria-label={t("po.filterSymbol")}>
            {SYMBOLS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={symbol === s}
                onClick={() => setSymbol(s)}
                className={cn(
                  "num rounded-sm border px-2.5 py-1 text-xs transition-colors",
                  symbol === s
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "All" ? t("po.all") : s}
              </button>
            ))}
          </div>
        }
      />

      <PanelCard title={`${t("po.positions")} (${shownPositions.length})`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <caption className="sr-only">{t("overview.positionsCaption")}</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  {t("common.instrument")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("common.side")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.qty")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.avg")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.last")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.unrealised")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("po.sl")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("po.tp")}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {t("common.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {shownPositions.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    <span className="num">{p.symbol}</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {p.name}
                    </span>
                  </th>
                  <td
                    className={cn(
                      "px-2 py-2.5 text-xs font-semibold",
                      p.side === "LONG" ? "text-positive" : "text-negative",
                    )}
                  >
                    {p.side}
                  </td>
                  <td className="num px-2 py-2.5 text-right">{p.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(p.avgPrice, 3)}</td>
                  <td className="num px-2 py-2.5 text-right">{num(p.lastPrice, 3)}</td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(p.unrealisedPnl))}>
                    {signedMoney(p.unrealisedPnl, 0)}{" "}
                    <span className="text-muted-foreground">({pct(p.pnlPct)})</span>
                  </td>
                  <td className="num px-2 py-2.5 text-right text-negative">
                    {p.stopLoss ? num(p.stopLoss, 2) : "—"}
                  </td>
                  <td className="num px-2 py-2.5 text-right text-positive">
                    {p.takeProfit ? num(p.takeProfit, 2) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDialog({
                          title: t("po.closeTitle"),
                          description: t("po.closeDesc", { symbol: p.symbol }),
                          details: [
                            { label: t("common.instrument"), value: `${p.symbol} · ${p.name}` },
                            { label: t("po.sideQty"), value: `${p.side} ${p.qty}` },
                            { label: t("common.avgPrice"), value: num(p.avgPrice, 3) },
                            { label: t("po.lastPrice"), value: num(p.lastPrice, 3) },
                            { label: t("po.unrealisedPl"), value: signedMoney(p.unrealisedPnl, 0) },
                            { label: t("po.estProceeds"), value: money(p.lastPrice * p.qty, 2) },
                          ],
                        })
                      }
                    >
                      {t("common.close")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title={`${t("po.workingOrders")} (${shownOrders.length})`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">{t("po.ordersCaption")}</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  {t("common.symbol")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("common.side")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("common.type")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.qty")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("po.limitStop")}
                </th>
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  {t("common.status")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.submitted")}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {t("common.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {shownOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="num px-4 py-2.5 text-left font-medium">
                    {o.symbol}
                  </th>
                  <td
                    className={cn(
                      "px-2 py-2.5 text-xs font-semibold",
                      o.side === "BUY" ? "text-positive" : "text-negative",
                    )}
                  >
                    {o.side}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-info">{o.type}</td>
                  <td className="num px-2 py-2.5 text-right">{o.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(o.price, 2)}</td>
                  <td className="px-2 py-2.5 text-xs text-info">{o.status}</td>
                  <td className="num px-2 py-2.5 text-right text-muted-foreground">
                    {o.submitted}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDialog({
                          title: t("po.cancelTitle"),
                          description: t("po.cancelDesc", { id: o.id }),
                          details: [
                            { label: t("po.order"), value: `${o.side} ${o.qty} ${o.symbol}` },
                            { label: t("common.type"), value: o.type },
                            { label: t("common.price"), value: num(o.price, 2) },
                            { label: t("common.status"), value: o.status },
                            { label: t("common.submitted"), value: o.submitted },
                          ],
                        })
                      }
                    >
                      {t("common.cancel")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title={t("po.states")}>
        <StateGallery />
      </PanelCard>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.title ?? ""}
        description={dialog?.description ?? ""}
        details={dialog?.details ?? []}
        confirmLabel={t("po.confirmLabel")}
        onConfirm={() => {
          toast(t("po.toast"), {
            description: t("po.toastDesc"),
          });
          setDialog(null);
        }}
      />
    </>
  );
}
