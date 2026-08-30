import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { orders, positions } from "@/data/fixtures";
import { money, num, pct, signedMoney, toneFor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, PageHeader, PanelCard, StateGallery, StatusBadge } from "@/components/auriq/primitives";

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
      { property: "og:description", content: "Filterable positions and orders with confirmation prototypes — demo data." },
    ],
  }),
  component: PositionsOrders;
});

function PositionsOrders() {
  return null;
}
