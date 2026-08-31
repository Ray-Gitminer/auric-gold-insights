import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { account, risk } from "@/data/fixtures";
import { money } from "@/lib/format";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PageHeader, PanelCard, StatusBadge } from "@/components/auriq/primitives";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · AURIQ Gold Trading Intelligence" },
      {
        name: "description",
        content:
          "Account mode, risk limits, session security, data refresh cadence and notification preferences for the AURIQ prototype.",
      },
      { property: "og:title", content: "Settings · AURIQ" },
      {
        property: "og:description",
        content: "Risk limits, session security and refresh cadence — demo data.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { t, lang, setLang } = useI18n();
  const [notifications, setNotifications] = useState({
    riskBreaches: true,
    strategyChanges: true,
    newsDigest: false,
    staleData: true,
  });

  const NOTIFY_LABELS: Record<keyof typeof notifications, string> = {
    riskBreaches: t("settings.notifyRisk"),
    strategyChanges: t("settings.notifyStrategy"),
    newsDigest: t("settings.notifyNews"),
    staleData: t("settings.notifyStale"),
  };

  return (
    <>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.desc")}
        actions={<StatusBadge tone="gold">{t("settings.paperOnly")}</StatusBadge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title={t("settings.account")} subtitle={t("settings.accountSub")}>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("settings.accountId")}</dt>
              <dd className="num">{account.accountId}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("settings.mode")}</dt>
              <dd>
                <StatusBadge tone="gold">Paper</StatusBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("settings.baseCurrency")}</dt>
              <dd className="num">USD</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("kpi.netLiquidation")}</dt>
              <dd className="num">{money(account.netLiquidation)}</dd>
            </div>
          </dl>
        </PanelCard>

        <PanelCard title={t("settings.riskLimits")}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              toast(t("toast.prototype"), { description: t("settings.saveToast") });
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="dailyLoss">{t("settings.dailyLoss")}</Label>
              <Input
                id="dailyLoss"
                className="num"
                defaultValue={risk.dailyLossLimit}
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxRisk">{t("settings.maxRisk")}</Label>
              <Input id="maxRisk" className="num" defaultValue={1} inputMode="decimal" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxContracts">{t("settings.maxContracts")}</Label>
              <Input id="maxContracts" className="num" defaultValue={3} inputMode="numeric" />
            </div>
            <Button type="submit" size="sm">
              {t("settings.save")}
            </Button>
          </form>
        </PanelCard>

        <PanelCard title={t("settings.session")}>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("settings.timeout")}</dt>
              <dd className="num">{t("settings.timeoutValue")}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("settings.twoFactor")}</dt>
              <dd>
                <StatusBadge tone="positive">{t("settings.enabled")}</StatusBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">{t("settings.lastSignIn")}</dt>
              <dd className="num">{t("settings.lastSignInValue")}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">{t("settings.securityNote")}</p>
        </PanelCard>

        <PanelCard title={t("settings.data")}>
          <div className="grid gap-1.5">
            <Label htmlFor="refresh">{t("settings.refresh")}</Label>
            <Input id="refresh" className="num" defaultValue={15} inputMode="numeric" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-sm">{t("settings.language")}</span>
            <div
              className="inline-flex overflow-hidden rounded-sm border border-border"
              role="group"
              aria-label={t("lang.switchTo")}
            >
              <button
                type="button"
                onClick={() => setLang("th")}
                aria-pressed={lang === "th"}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  lang === "th"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                ไทย (TH)
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
                className={cn(
                  "px-3 py-1 text-xs font-medium transition-colors",
                  lang === "en"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                English (EN)
              </button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {(Object.keys(notifications) as Array<keyof typeof notifications>).map((key) => (
              <li key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm">{NOTIFY_LABELS[key]}</span>
                <Switch
                  checked={notifications[key]}
                  aria-label={NOTIFY_LABELS[key]}
                  onCheckedChange={(v) => setNotifications((p) => ({ ...p, [key]: v }))}
                />
              </li>
            ))}
          </ul>
        </PanelCard>
      </div>
    </>
  );
}
