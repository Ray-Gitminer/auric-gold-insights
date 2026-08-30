import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { riskLimits, sessionInfo } from "@/data/fixtures";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader, PanelCard, PaperTradingNotice, StatusBadge } from "@/components/auriq/primitives";

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
  component: Settings;
});

function Settings() {
  return null;
}
