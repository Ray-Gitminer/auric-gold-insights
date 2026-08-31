import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileClock,
  LayoutDashboard,
  Menu,
  Newspaper,
  PieChart,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { account, systemHealth } from "@/data/fixtures";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./primitives";
import { useI18n, type Language } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/", key: "nav.overview", icon: LayoutDashboard },
  { to: "/portfolio", key: "nav.portfolio", icon: PieChart },
  { to: "/positions-orders", key: "nav.positionsOrders", icon: BarChart3 },
  { to: "/trade-history", key: "nav.tradeHistory", icon: Clock },
  { to: "/journal", key: "nav.journal", icon: BookOpen },
  // News, weekly analysis and the economic calendar live as tabs inside /economic-news.
  { to: "/economic-news", key: "nav.economicNews", icon: Newspaper },

  { to: "/chart-strategy", key: "nav.chartStrategy", icon: Activity },
  { to: "/alerts", key: "nav.alerts", icon: Bell },
  { to: "/audit-log", key: "nav.auditLog", icon: FileClock },
  { to: "/settings", key: "nav.settings", icon: SettingsIcon },
] as const;

function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const options: { value: Language; label: string }[] = [
    { value: "th", label: t("lang.th") },
    { value: "en", label: t("lang.en") },
  ];
  return (
    <div
      role="group"
      aria-label={t("lang.switchTo")}
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border border-border bg-card p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={cn(
            "rounded-[3px] px-2 py-1 text-[11px] font-semibold tracking-[0.08em] transition-colors",
            lang === o.value
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NavList({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: (() => void) | undefined;
  collapsed?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useI18n();
  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label={t("nav.main")}>
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? t(item.key) : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
              collapsed && "justify-center px-2",
              active
                ? "bg-primary/12 text-primary shadow-[inset_2px_0_0_0_var(--color-primary)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="leading-snug">{t(item.key)}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn("px-4 py-4", collapsed && "px-2 text-center")}>
      <span className="text-lg font-semibold tracking-[0.22em] text-primary">
        {collapsed ? "AQ" : "AURIQ"}
      </span>
      {!collapsed && (
        <p className="mt-0.5 text-[11px] tracking-wide text-muted-foreground">
          {t("brand.tagline")}
        </p>
      )}
    </div>
  );
}

function HealthPanel() {
  const { t, tx } = useI18n();
  return (
    <div className="mx-3 mb-4 rounded-md border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-3.5 text-positive" aria-hidden />
        <span className="text-xs font-semibold">{t("shell.systemHealth")}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {systemHealth.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-muted-foreground">
              {tx(s.label)} · {tx(s.detail)}
            </span>
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                s.status === "ok" ? "bg-positive" : "bg-primary",
              )}
              aria-label={s.status === "ok" ? t("shell.operational") : t("shell.attention")}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarInner({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col">
      <Wordmark collapsed={collapsed} />
      {!collapsed && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          <StatusBadge tone="gold">{t("shell.paperShort")}</StatusBadge>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-positive" aria-hidden />
            {t("shell.gatewayDemo")}
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pb-4">
        <NavList collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      {!collapsed && <HealthPanel />}
      {!collapsed && (
        <p className="px-4 pb-4 text-[10px] text-muted-foreground">{t("shell.version")}</p>
      )}
    </div>
  );
}

function TopBar({ onOpenMobile }: { onOpenMobile: ReactNode }) {
  const { t } = useI18n();
  const { configured, user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-5">
      <div className="lg:hidden">{onOpenMobile}</div>

      <StatusBadge tone="gold" className="shrink-0">
        {t("shell.paper")}
      </StatusBadge>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
        <ShieldCheck className="size-3.5" aria-hidden />
        {t("shell.humanConfirm")}
      </span>

      <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
        <LanguageSwitcher />
        <span className="num hidden text-xs text-muted-foreground lg:inline">
          {t("shell.account")} {account.accountId}
        </span>
        <span className="hidden items-center gap-1.5 text-xs md:inline-flex">
          <span className="size-1.5 rounded-full bg-positive" aria-hidden />
          <span className="text-muted-foreground">{t("shell.market")}</span>
          <span className="text-positive">{t("shell.marketOpen")}</span>
        </span>
        <span className="num hidden items-center gap-1.5 text-xs text-muted-foreground xl:inline-flex">
          <RefreshCw className="size-3" aria-hidden />
          {t("shell.lastSync")} {account.lastSync}
        </span>
        <Link
          to="/alerts"
          className="relative rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          aria-label={t("shell.alertsAria")}
        >
          <Bell className="size-4" aria-hidden />
          <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-negative text-[9px] font-semibold text-background">
            3
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-xs font-semibold"
            aria-label={t("shell.userMenu")}
          >
            AU
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {user?.email ?? "owner@auriq.demo"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">{t("shell.settings")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/audit-log">{t("shell.auditLog")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!configured} onSelect={() => void signOut()}>
              {t("shell.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <aside
        className={cn(
          "relative hidden shrink-0 border-r border-border bg-sidebar lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="sticky top-0 h-screen">
          <SidebarInner collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
          className="absolute top-16 -right-3 z-40 grid size-6 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenMobile={
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="grid size-8 place-items-center rounded-sm border border-border text-muted-foreground"
                aria-label={t("shell.openNav")}
              >
                <Menu className="size-4" aria-hidden />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-border bg-sidebar p-0">
                <SheetTitle className="sr-only">{t("shell.nav")}</SheetTitle>
                <SidebarInner collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          }
        />
        <p className="border-b border-primary/30 bg-primary/8 px-3 py-1.5 text-center text-[11px] font-medium tracking-wide text-primary sm:px-5">
          {t("shell.safety")}
        </p>
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-3 py-5 sm:px-5 lg:px-6">
          <div className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
