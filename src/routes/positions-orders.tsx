import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { orders, positions } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PageHeader, PanelCard, StateGallery } from "@/components/auriq/primitives";

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
        title="Positions & Orders"
        description="Review paper positions and working orders. Every action here is a prototype control that opens a confirmation modal and stops there."
        actions={
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by symbol">
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
                {s}
              </button>
            ))}
          </div>
        }
      />

      <PanelCard title={`Positions (${shownPositions.length})`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <caption className="sr-only">Open positions — demo data</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">Instrument</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Side</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Qty</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Avg</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Last</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Unrealised</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">SL</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">TP</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {shownPositions.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    <span className="num">{p.symbol}</span>
                    <span className="block text-[11px] font-normal text-muted-foreground">{p.name}</span>
                  </th>
                  <td className={cn("px-2 py-2.5 text-xs font-semibold", p.side === "LONG" ? "text-positive" : "text-negative")}>
                    {p.side}
                  </td>
                  <td className="num px-2 py-2.5 text-right">{p.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(p.avgPrice, 3)}</td>
                  <td className="num px-2 py-2.5 text-right">{num(p.lastPrice, 3)}</td>
                  <td className={cn("num px-2 py-2.5 text-right", toneFor(p.unrealisedPnl))}>
                    {signedMoney(p.unrealisedPnl, 0)} <span className="text-muted-foreground">({pct(p.pnlPct)})</span>
                  </td>
                  <td className="num px-2 py-2.5 text-right text-negative">{p.stopLoss ? num(p.stopLoss, 2) : "—"}</td>
                  <td className="num px-2 py-2.5 text-right text-positive">{p.takeProfit ? num(p.takeProfit, 2) : "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDialog({
                          title: "Close position (prototype)",
                          description: `Review the simulated close for ${p.symbol}. AURIQ will not send this to any broker.`,
                          details: [
                            { label: "Instrument", value: `${p.symbol} · ${p.name}` },
                            { label: "Side / Qty", value: `${p.side} ${p.qty}` },
                            { label: "Average price", value: num(p.avgPrice, 3) },
                            { label: "Last price", value: num(p.lastPrice, 3) },
                            { label: "Unrealised P/L", value: signedMoney(p.unrealisedPnl, 0) },
                            { label: "Estimated proceeds", value: money(p.lastPrice * p.qty, 2) },
                          ],
                        })
                      }
                    >
                      Close
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title={`Working orders (${shownOrders.length})`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <caption className="sr-only">Working orders — demo data</caption>
            <thead>
              <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
                <th scope="col" className="px-4 py-2 text-left font-medium">Symbol</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Side</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Type</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Qty</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Limit / Stop</th>
                <th scope="col" className="px-2 py-2 text-left font-medium">Status</th>
                <th scope="col" className="px-2 py-2 text-right font-medium">Submitted</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {shownOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="num px-4 py-2.5 text-left font-medium">{o.symbol}</th>
                  <td className={cn("px-2 py-2.5 text-xs font-semibold", o.side === "BUY" ? "text-positive" : "text-negative")}>
                    {o.side}
                  </td>
                  <td className="px-2 py-2.5 text-xs text-info">{o.type}</td>
                  <td className="num px-2 py-2.5 text-right">{o.qty}</td>
                  <td className="num px-2 py-2.5 text-right">{num(o.price, 2)}</td>
                  <td className="px-2 py-2.5 text-xs text-info">{o.status}</td>
                  <td className="num px-2 py-2.5 text-right text-muted-foreground">{o.submitted}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDialog({
                          title: "Cancel order (prototype)",
                          description: `Review the simulated cancellation for order ${o.id}. Nothing is transmitted to IBKR.`,
                          details: [
                            { label: "Order", value: `${o.side} ${o.qty} ${o.symbol}` },
                            { label: "Type", value: o.type },
                            { label: "Price", value: num(o.price, 2) },
                            { label: "Status", value: o.status },
                            { label: "Submitted", value: o.submitted },
                          ],
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title="Connection & data states">
        <StateGallery />
      </PanelCard>

      <ConfirmDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.title ?? ""}
        description={dialog?.description ?? ""}
        details={dialog?.details ?? []}
        confirmLabel="Acknowledge (no order sent)"
        onConfirm={() => {
          toast("Prototype only — no order was transmitted", {
            description: "A production action would run risk checks and write an audit record.",
          });
          setDialog(null);
        }}
      />
    </>
  );
}
