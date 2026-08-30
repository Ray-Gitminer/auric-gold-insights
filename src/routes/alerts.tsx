import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, Info, TriangleAlert } from "lucide-react";

import { alertRules, alerts, systemHealth } from "@/data/fixtures";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import { Switch } from "@/components/ui/switch";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "In-app alert rules for drawdown breaches, key gold levels, strategy state changes and stale connections, plus a system health timeline.",
      },
      { property: "og:title", content: "Alerts · AURIQ" },
      { property: "og:description", content: "Alert rules and system health timeline — demo data." },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const [rules, setRules] = useState(alertRules);
  const { t, tx } = useI18n();

  return (
    <>
      <PageHeader
        title={t("alerts.title")}
        description={t("alerts.desc")}
        actions={<StatusBadge tone="negative">{t("alerts.unread", { n: 3 })}</StatusBadge>}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <PanelCard title={t("alerts.recent")} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {alerts.map((a) => (
              <li key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {a.severity === "info" ? (
                    <Info className="size-4 shrink-0 text-info" aria-hidden />
                  ) : a.severity === "risk" ? (
                    <TriangleAlert className="size-4 shrink-0 text-negative" aria-hidden />
                  ) : (
                    <Bell className="size-4 shrink-0 text-primary" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "truncate text-sm",
                      a.severity === "risk" && "text-negative",
                      a.severity === "warning" && "text-primary",
                      a.severity === "info" && "text-info",
                    )}
                  >
                    {tx(a.message)}
                  </span>
                </div>
                <span className="num shrink-0 text-[11px] text-muted-foreground">
                  {a.time} · {a.date}
                </span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title={t("alerts.systemHealth")}>
          <ul className="space-y-2">
            {systemHealth.map((s) => (
              <li key={s.label} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{tx(s.label)}</p>
                  <p className="text-[11px] text-muted-foreground">{tx(s.detail)}</p>
                </div>
                <span
                  className={cn("mt-1 size-1.5 shrink-0 rounded-full", s.status === "ok" ? "bg-positive" : "bg-primary")}
                  aria-label={s.status === "ok" ? t("shell.operational") : t("shell.attention")}
                />
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>

      <PanelCard title={t("alerts.rules")} bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {rules.map((r) => (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{tx(r.name)}</p>
                <p className="num text-[11px] text-muted-foreground">{tx(r.condition)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{tx(r.channel)}</span>
                <Switch
                  checked={r.enabled}
                  aria-label={t("alerts.enabledAria", { name: r.name })}
                  onCheckedChange={(v) =>
                    setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)))
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </PanelCard>
    </>
  );
}
