import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { account, risk } from "@/data/fixtures";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
      { property: "og:description", content: "Risk limits, session security and refresh cadence — demo data." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [notifications, setNotifications] = useState({
    riskBreaches: true,
    strategyChanges: true,
    newsDigest: false,
    staleData: true,
  });

  return (
    <>
      <PageHeader
        title="Settings"
        description="Preferences for the paper-trading prototype. Values are local to this session and reset on reload."
        actions={<StatusBadge tone="gold">Paper trading only</StatusBadge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <PanelCard title="Account" subtitle="Read-only in the prototype">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Account ID</dt>
              <dd className="num">{account.accountId}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Mode</dt>
              <dd>
                <StatusBadge tone="gold">Paper</StatusBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Base currency</dt>
              <dd className="num">USD</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Net liquidation</dt>
              <dd className="num">{money(account.netLiquidation)}</dd>
            </div>
          </dl>
        </PanelCard>

        <PanelCard title="Risk limits">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              toast("Prototype control", { description: "Risk limits are not persisted in the demo." });
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="dailyLoss">Daily loss limit (USD)</Label>
              <Input id="dailyLoss" className="num" defaultValue={risk.dailyLossLimit} inputMode="numeric" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxRisk">Max risk per trade (% of NLV)</Label>
              <Input id="maxRisk" className="num" defaultValue={1} inputMode="decimal" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="maxContracts">Max gold contracts</Label>
              <Input id="maxContracts" className="num" defaultValue={3} inputMode="numeric" />
            </div>
            <Button type="submit" size="sm">
              Save limits
            </Button>
          </form>
        </PanelCard>

        <PanelCard title="Session & security">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Session timeout</dt>
              <dd className="num">30 minutes idle</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Two-factor</dt>
              <dd>
                <StatusBadge tone="positive">Enabled</StatusBadge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last sign-in</dt>
              <dd className="num">Today 07:42 UTC</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Credentials are never stored in the browser. All broker access is server-side and audited.
          </p>
        </PanelCard>

        <PanelCard title="Data & notifications">
          <div className="grid gap-1.5">
            <Label htmlFor="refresh">Refresh cadence (seconds)</Label>
            <Input id="refresh" className="num" defaultValue={15} inputMode="numeric" />
          </div>
          <ul className="mt-4 space-y-3">
            {(
              [
                ["riskBreaches", "Risk limit breaches"],
                ["strategyChanges", "Strategy state changes"],
                ["newsDigest", "Daily news digest"],
                ["staleData", "Stale data warnings"],
              ] as const
            ).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm">{label}</span>
                <Switch
                  checked={notifications[key]}
                  aria-label={label}
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
