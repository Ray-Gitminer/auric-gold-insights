import { createFileRoute } from "@tanstack/react-router";

import { allocation, performance, performanceSummary, risk } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { KpiCard, PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";
import { useI18n } from "@/contexts/I18nContext";
import { usePortfolioData } from "@/hooks/use-portfolio-data";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Portfolio allocation, exposure, margin usage, risk limits and daily, weekly and monthly performance for the AURIQ paper account.",
      },
      { property: "og:title", content: "Portfolio · AURIQ" },
      {
        property: "og:description",
        content: "Allocation, exposure, margin and performance — demo data.",
      },
       { property: "og:type", content: "website" },
       { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const { t } = useI18n();
  const { data, loading, error } = usePortfolioData();
  const { account, positions } = data;
  const liveExposure = positions.reduce((sum, p) => sum + Math.abs(p.lastPrice * p.qty), 0);
  const effectiveRisk =
    data.source === "mt5"
      ? {
          ...risk,
          exposure: liveExposure,
          exposurePct: account.netLiquidation ? (liveExposure / account.netLiquidation) * 100 : 0,
          marginHeadroom: account.availableCash,
          dailyLossUsed: Math.max(0, -account.todayPnl),
          dailyLossLimit: Math.max(account.netLiquidation * 0.02, 0),
        }
      : risk;
  const maxPnl = Math.max(...performance.map((p) => Math.abs(p.pnl)));

  return (
    <>
      <PageHeader
        title={t("portfolio.title")}
        description={
          data.source === "mt5"
            ? "ข้อมูลพอร์ต Exness MT5 จริงแบบ Read-only — ไม่มีการส่งคำสั่งซื้อขาย"
            : t("portfolio.desc")
        }
        dataTag={
          data.source === "mt5" ? (
            <StatusBadge tone="positive">ข้อมูล MT5 จริง</StatusBadge>
          ) : undefined
        }
        actions={
          <StatusBadge tone="gold">{t("portfolio.account", { id: account.accountId })}</StatusBadge>
        }
      />

      {data.source === "mt5" ? (
        <div className="rounded-md border border-positive/40 bg-positive/10 px-3 py-2 text-xs text-positive">
          MT5 LIVE · READ-ONLY · {data.accountLabel} ·{" "}
          {loading ? "กำลังซิงก์" : `อัปเดต ${account.lastSync}`}
        </div>
      ) : (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
          {error
            ? `เชื่อมข้อมูลจริงไม่สำเร็จ: ${error}`
            : "ยังไม่มีข้อมูล MT5 จริง — กำลังแสดงข้อมูลตัวอย่าง"}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={t("kpi.netLiquidation")}
          value={money(account.netLiquidation)}
          delta={pct(1.25)}
          deltaTone="positive"
          freshness={t("kpi.vsYesterday")}
        />
        <KpiCard
          label={t("portfolio.grossExposure")}
          value={money(effectiveRisk.exposure)}
          delta={t("kpi.ofNlv", { pct: effectiveRisk.exposurePct })}
          deltaTone="neutral"
        />
        <KpiCard
          label={t("risk.marginHeadroom")}
          value={money(effectiveRisk.marginHeadroom)}
          delta={t("portfolio.comfortable")}
          deltaTone="positive"
        />
        <KpiCard
          label={t("kpi.drawdown")}
          value={pct(account.drawdownPct)}
          delta={signedMoney(account.drawdownValue)}
          deltaTone="negative"
        />
      </div>

      {data.source !== "mt5" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelCard title={t("portfolio.allocation")} subtitle={t("portfolio.allocationSub")}>
            <ul className="space-y-3">
              {allocation.map((a) => (
                <li key={a.name}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate">{a.name}</span>
                    <span className="num shrink-0 text-muted-foreground">
                      {money(a.amount, 0)} · {a.value}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${a.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </PanelCard>

          <PanelCard title={t("portfolio.performance")} subtitle={t("portfolio.performanceSub")}>
            <div className="grid grid-cols-3 gap-3">
              {performanceSummary.map((p) => (
                <div key={p.label} className="rounded-sm border border-border bg-surface/60 p-3">
                  <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    {p.label}
                  </p>
                  <p className={cn("num mt-1 text-sm font-semibold", toneFor(p.value))}>
                    {signedMoney(p.value, 0)}
                  </p>
                  <p className={cn("num text-[11px]", toneFor(p.pct))}>{pct(p.pct)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-32 items-end gap-3">
              {performance.map((p) => (
                <div key={p.period} className="flex flex-1 flex-col items-center gap-1">
                  <span className={cn("num text-[10px]", toneFor(p.pnl))}>{p.pnl}</span>
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      p.pnl >= 0 ? "bg-positive/70" : "bg-negative/70",
                    )}
                    style={{ height: `${(Math.abs(p.pnl) / maxPnl) * 88}px` }}
                  />
                  <span className="text-[11px] text-muted-foreground">{p.period}</span>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      ) : null}

      <PanelCard title={t("portfolio.exposure")} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">{t("portfolio.exposureCaption")}</caption>
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
                  {t("common.avgPrice")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.last")}
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  {t("common.unrealised")}
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  {t("common.plPct")}
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
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
                    {signedMoney(p.unrealisedPnl, 0)}
                  </td>
                  <td className={cn("num px-4 py-2.5 text-right", toneFor(p.pnlPct))}>
                    {pct(p.pnlPct)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard title={t("portfolio.riskLimits")}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: t("portfolio.dailyLossLimit"),
              value: money(effectiveRisk.dailyLossLimit, 0),
              sub: t("portfolio.used", { value: money(effectiveRisk.dailyLossUsed, 0) }),
            },
            {
              label: t("portfolio.grossExposure"),
              value: money(effectiveRisk.exposure, 0),
              sub: t("kpi.ofNlv", { pct: effectiveRisk.exposurePct }),
            },
            {
              label: t("risk.maxPositionRisk"),
              value: data.source === "mt5" ? "รอตั้งค่า" : `${effectiveRisk.maxPositionRisk}%`,
              sub: data.source === "mt5" ? "ยังไม่เปิด Auto Trade" : t("portfolio.limitTwo"),
            },
            {
              label: t("kpi.marginUsed"),
              value: money(account.marginUsed, 0),
              sub: t("kpi.ofNlv", { pct: account.marginUsedPct }),
            },
          ].map((r) => (
            <div key={r.label} className="rounded-sm border border-border bg-surface/60 p-3">
              <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                {r.label}
              </dt>
              <dd className="num mt-1 text-sm font-semibold">{r.value}</dd>
              <dd className="text-[11px] text-muted-foreground">{r.sub}</dd>
            </div>
          ))}
        </dl>
      </PanelCard>
    </>
  );
}
