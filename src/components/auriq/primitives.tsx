import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, Lock, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DemoDataTag({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-primary uppercase",
        className,
      )}
    >
      {t("common.demoData")}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border pb-5 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          <DemoDataTag />
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PanelCard({
  title,
  subtitle,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("flex flex-col rounded-md border border-border bg-card", className)}>
      {title ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  freshness,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  freshness?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <p className="num mt-3 text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {delta ? (
          <span
            className={cn(
              "num font-medium",
              deltaTone === "positive" && "text-positive",
              deltaTone === "negative" && "text-negative",
              deltaTone === "neutral" && "text-muted-foreground",
            )}
          >
            {delta}
          </span>
        ) : null}
        {freshness ? <span className="text-muted-foreground">{freshness}</span> : null}
      </div>
    </div>
  );
}

const statusStyles: Record<string, string> = {
  gold: "border-primary/45 bg-primary/10 text-primary",
  info: "border-info/45 bg-info/10 text-info",
  positive: "border-positive/45 bg-positive/10 text-positive",
  negative: "border-negative/45 bg-negative/10 text-negative",
  neutral: "border-border bg-accent/40 text-muted-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof statusStyles;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase",
        statusStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AdvisoryTag() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] text-info uppercase">
      {t("common.advisory")}
    </span>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  details,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  details?: { label: string; value: string }[];
  confirmLabel?: string;
  onConfirm?: () => void;
}) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-border bg-popover">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-primary" aria-hidden />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {details?.length ? (
          <dl className="grid gap-px overflow-hidden rounded-md border border-border bg-border text-sm">
            {details.map((d) => (
              <div key={d.label} className="grid grid-cols-2 gap-2 bg-card px-3 py-2">
                <dt className="text-xs text-muted-foreground">{d.label}</dt>
                <dd className="num text-right text-xs">{d.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <p className="rounded-md border border-primary/35 bg-primary/10 px-3 py-2 text-xs text-primary">
          {t("confirm.notice")}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {confirmLabel ?? t("common.acknowledge")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-10 text-center">
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-4 py-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label ?? t("common.loading")}…
    </div>
  );
}

export function StaleState({ age }: { age: string }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      {t("state.stale", { age })}
    </div>
  );
}

export function OfflineState() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 rounded-md border border-negative/40 bg-negative/10 px-3 py-2 text-xs text-negative">
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      {t("state.offline")}
    </div>
  );
}

export function UnauthorisedState() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-accent/30 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="size-3.5 shrink-0" aria-hidden />
      {t("state.unauthorised")}
    </div>
  );
}

export function StateGallery() {
  return (
    <div className="grid gap-2">
      <StaleState age="4m 12s ago" />
      <OfflineState />
      <UnauthorisedState />
    </div>
  );
}
