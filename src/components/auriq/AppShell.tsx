import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileClock,
  LayoutDashboard,
  Menu,
  Newspaper,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { systemHealth } from "@/data/fixtures";
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
import { Button } from "@/components/ui/button";
import { useI18n, type Language } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolioData } from "@/hooks/use-portfolio-data";
import auriqLogo from "@/assets/auriq-logo-transparent.png.asset.json";

const NAV = [
  { to: "/", key: "nav.overview", icon: LayoutDashboard },
  { to: "/signals", key: "nav.signals", icon: Activity },
  { to: "/positions-orders", key: "nav.positionsOrders", icon: BarChart3 },
  { to: "/trade-history", key: "nav.tradeHistory", icon: Clock },
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
  return (
    <div className={cn("px-4 py-4", collapsed && "px-2")}>
      <img
        src={collapsed ? "/favicon.png" : auriqLogo.url}
        alt="AURIQ Gold Insights"
        className={cn(
          "object-contain object-left drop-shadow-[0_0_14px_color-mix(in_oklab,var(--color-primary)_24%,transparent)]",
          collapsed ? "mx-auto size-9" : "h-auto w-full max-w-[190px]",
        )}
      />
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
  live = false,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
  live?: boolean;
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
            {live ? "MT5 Connected" : t("shell.gatewayDemo")}
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

function TopBar({
  onOpenMobile,
  accountId,
  lastSync,
  live,
}: {
  onOpenMobile: ReactNode;
  accountId: string;
  lastSync: string;
  live: boolean;
}) {
  const { t } = useI18n();
  const { configured, user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-5">
      <div className="lg:hidden">{onOpenMobile}</div>

      <StatusBadge tone="gold" className="shrink-0">{t("shell.paper")}</StatusBadge>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
        <ShieldCheck className="size-3.5" aria-hidden />
        {t("shell.humanConfirm")}
      </span>

      <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
        <LanguageSwitcher />
        <span className="num hidden text-xs text-muted-foreground lg:inline">
          {t("shell.account")} {accountId}
        </span>
        <span className="hidden items-center gap-1.5 text-xs md:inline-flex">
          <span className="size-1.5 rounded-full bg-positive" aria-hidden />
          <span className="text-muted-foreground">{t("shell.market")}</span>
          <span className="text-positive">{t("shell.marketOpen")}</span>
        </span>
        <span className="num hidden items-center gap-1.5 text-xs text-muted-foreground xl:inline-flex">
          <RefreshCw className="size-3" aria-hidden />
          {t("shell.lastSync")} {lastSync}
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

function DashboardHeader({ onOpenMobile }: { onOpenMobile: ReactNode }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const links = [
    { to: "/" as const, label: "Dashboard" },
    { to: "/signals" as const, label: "Signals" },
    { to: "/economic-news" as const, label: "News" },
    { to: "/chart-strategy" as const, label: "Strategy" },
  ];
  const comingSoonLinks = ["AURIQ Flow", "Pricing"];

  return (
    <header className="sticky top-0 z-40 border-b border-info/30 bg-background/90 shadow-[0_12px_34px_-22px_var(--color-info)] backdrop-blur-xl">
      <div className="mx-auto grid h-[68px] w-full max-w-[1920px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5 xl:grid-cols-[27%_46%_27%] xl:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">{onOpenMobile}</div>
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/favicon.png"
              alt=""
              className="size-9 shrink-0 object-contain sm:hidden"
              aria-hidden
            />
            <img
              src={auriqLogo.url}
              alt="AURIQ Gold Insights"
              className="hidden h-14 w-[260px] max-w-full object-contain object-left drop-shadow-[0_0_18px_color-mix(in_oklab,var(--color-primary)_34%,transparent)] sm:block"
            />
          </Link>
        </div>

        <nav className="hidden items-stretch justify-center gap-8 self-stretch xl:flex" aria-label={t("nav.main")}>
          {links.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center text-xs font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                   active && "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary after:shadow-[0_0_10px_var(--color-primary)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          {comingSoonLinks.map((label) => (
            <span key={label} className="flex items-center text-xs font-semibold text-muted-foreground/55" title={t("dashboard.comingSoon")}>{label}</span>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button variant="ghost" size="icon" className="hidden text-muted-foreground sm:inline-flex" aria-label="Search">
            <Search aria-hidden />
          </Button>
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Button asChild size="sm" className="shadow-[0_0_22px_color-mix(in_oklab,var(--color-primary)_35%,transparent)]">
            <Link to="/chart-strategy"><Sparkles aria-hidden />{t("dashboard.startAnalysis")}</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden border-info/45 bg-info/5 text-info 2xl:inline-flex">
            <Link to="/economic-calendar">{t("nav.liveCalendar")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: portfolio } = usePortfolioData();
  const live = portfolio.source === "mt5";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dashboard = pathname === "/" || pathname === "/signals";

  const mobileNavigation = (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger
        className="grid size-8 place-items-center rounded-sm border border-border text-muted-foreground"
        aria-label={t("shell.openNav")}
      >
        <Menu className="size-4" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-border bg-sidebar p-0">
        <SheetTitle className="sr-only">{t("shell.nav")}</SheetTitle>
        <SidebarInner collapsed={false} live={live} onNavigate={() => setMobileOpen(false)} />
      </SheetContent>
    </Sheet>
  );

  if (dashboard) {
    return (
      <div className="auric-page min-h-screen w-full overflow-x-hidden bg-background">
        <DashboardHeader onOpenMobile={mobileNavigation} />
        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <aside
        className={cn(
          "relative hidden shrink-0 border-r border-border bg-sidebar lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="sticky top-0 h-screen">
          <SidebarInner collapsed={collapsed} live={live} />
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
          accountId={portfolio.account.accountId}
          lastSync={portfolio.account.lastSync}
          live={live}
          onOpenMobile={mobileNavigation}
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
