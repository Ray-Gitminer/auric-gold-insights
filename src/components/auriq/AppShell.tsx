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

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
  { to: "/positions-orders", label: "Positions & Orders", icon: BarChart3 },
  { to: "/trade-history", label: "Trade History", icon: Clock },
  { to: "/journal", label: "Trader Journal", icon: BookOpen },
  { to: "/news", label: "News Intelligence", icon: Newspaper },
  { to: "/chart-strategy", label: "Chart & Strategy", icon: Activity },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/audit-log", label: "Audit Log", icon: FileClock },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavList({ onNavigate, collapsed = false }: { onNavigate?: (() => void) | undefined; collapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5 px-2" aria-label="Main">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors",
              collapsed && "justify-center px-2",
              active
                ? "bg-primary/12 text-primary shadow-[inset_2px_0_0_0_var(--color-primary)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Wordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className={cn("px-4 py-4", collapsed && "px-2 text-center")}>
      <span className="text-lg font-semibold tracking-[0.22em] text-primary">
        {collapsed ? "AQ" : "AURIQ"}
      </span>
      {!collapsed && (
        <p className="mt-0.5 text-[11px] tracking-wide text-muted-foreground">
          See Gold Clearly. Trade with Intelligence.
        </p>
      )}
    </div>
  );
}

function HealthPanel() {
  return (
    <div className="mx-3 mb-4 rounded-md border border-border bg-card/60 p-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-3.5 text-positive" aria-hidden />
        <span className="text-xs font-semibold">System Health</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {systemHealth.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="truncate text-muted-foreground">{s.label}</span>
            <span
              className={cn("size-1.5 shrink-0 rounded-full", s.status === "ok" ? "bg-positive" : "bg-primary")}
              aria-label={s.status === "ok" ? "Operational" : "Attention"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SidebarInner({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col">
      <Wordmark collapsed={collapsed} />
      {!collapsed && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          <StatusBadge tone="gold">Paper</StatusBadge>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-positive" aria-hidden />
            Gateway connected
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto pb-4">
        <NavList collapsed={collapsed} onNavigate={onNavigate} />
      </div>
      {!collapsed && <HealthPanel />}
      {!collapsed && (
        <p className="px-4 pb-4 text-[10px] text-muted-foreground">AURIQ v1.2.0 · prototype</p>
      )}
    </div>
  );
}

function TopBar({ onOpenMobile }: { onOpenMobile: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-3 backdrop-blur sm:px-5">
      <div className="lg:hidden">{onOpenMobile}</div>

      <StatusBadge tone="gold" className="shrink-0">
        Paper trading
      </StatusBadge>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
        <ShieldCheck className="size-3.5" aria-hidden />
        Human confirmation required
      </span>

      <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
        <span className="num hidden text-xs text-muted-foreground lg:inline">
          Account {account.accountId}
        </span>
        <span className="hidden items-center gap-1.5 text-xs md:inline-flex">
          <span className="size-1.5 rounded-full bg-positive" aria-hidden />
          <span className="text-muted-foreground">New York</span>
          <span className="text-positive">OPEN</span>
        </span>
        <span className="num hidden items-center gap-1.5 text-xs text-muted-foreground xl:inline-flex">
          <RefreshCw className="size-3" aria-hidden />
          Last sync {account.lastSync}
        </span>
        <Link
          to="/alerts"
          className="relative rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          aria-label="Alerts, 3 unread"
        >
          <Bell className="size-4" aria-hidden />
          <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-negative text-[9px] font-semibold text-background">
            3
          </span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-xs font-semibold"
            aria-label="User menu"
          >
            AU
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              owner@auriq.demo
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/audit-log">Audit log</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Sign out (prototype)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "relative hidden shrink-0 border-r border-border bg-sidebar lg:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="sticky top-0 h-screen">
          <SidebarInner collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                aria-label="Open navigation"
              >
                <Menu className="size-4" aria-hidden />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-border bg-sidebar p-0">
                <SheetTitle className="sr-only">AURIQ navigation</SheetTitle>
                <SidebarInner collapsed={false} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
          }
        />
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
