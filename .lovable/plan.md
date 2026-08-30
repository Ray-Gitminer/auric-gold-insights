# AURIQ — Gold Trading Intelligence (frontend prototype)

Build a responsive, multi-page clickable prototype named `auriq-gold-dashboard`. No broker connection, no backend, no database. All data is labelled `DEMO DATA`.

## Design system

Dark institutional finance UI, per the supplied colour system:
- Background `#06111F`, sidebar/elevated `#091827`, cards `#0D2235`, borders `#16364E`
- Gold `#E7B84B` / highlight `#F4D27A`, cyan `#39C6E8`, positive `#35C58A`, risk `#F06464`
- Text `#E8EEF3` / muted `#8FA4B5`
- Modern sans for UI, tabular monospace numerals for prices and timestamps
- Thin borders, subtle grid texture, restrained glow, no glassmorphism or neon

All values registered as semantic tokens in `src/styles.css` (oklch) and used through Tailwind utilities — no hardcoded hex in components.

## App shell

Left sidebar with AURIQ wordmark + tagline, `PAPER` badge, connection indicator, and nav: Overview, Portfolio, Positions & Orders, Trade History, Trader Journal, News Intelligence, Chart & Strategy, Alerts, Audit Log, Settings. Top bar: account selector, market session, last sync, notifications, user menu, Paper Trading badge. Sidebar collapses on tablet, drawer on mobile.

## Phase 1 — Overview dashboard (priority)

- KPI row: Net Liquidation, Available Cash, Today P/L, Unrealised P/L, Margin Used, Drawdown — each with freshness/comparison label
- Central gold candlestick chart component (prototype, SVG/Recharts-style rendering of fixture candles): timeframes 5m/15m/1h/4h/1D, price + time scales, support/resistance lines, session shading, news markers, current-price line, setup-state badge (WAITING / VALID / INVALID / TRIGGERED) and a pass/fail strategy-conditions panel
- Intelligence rail: Gold Impact Score (-100..+100, `AI ANALYSIS · ADVISORY ONLY`), Market Bias (direction, confidence, horizon, rationale, counter-evidence, invalidation), Risk Monitor
- Lower section: Open Positions table, Open Orders table, Economic Events card as an Investing.com widget placeholder with attribution and external link, recent Journal entries, Alerts & system-health timeline

## Phase 2 — Secondary pages

Consistent responsive shells with fixture data for: Portfolio, Positions & Orders (filters + confirmation-modal prototypes), Trade History (Win Rate, Profit Factor, Avg Win/Loss, Expectancy, export controls), Trader Journal, News Intelligence, Chart & Strategy (multi-timeframe + state machine), Alerts, Audit Log, Settings.

## Safety rules baked in

Paper mode only; every order-like control opens a detailed confirmation modal and does nothing else; no credentials, secrets, or IBKR connectivity anywhere; AI panels marked advisory only; all fixture data visibly tagged `DEMO DATA`.

## Technical notes

- TanStack Start file routes under `src/routes/`; Overview replaces `src/routes/index.tsx`
- Shared layout in a pathless layout route; reusable primitives: `KpiCard`, `DataTable`, `StatusBadge`, `PanelCard`, `ConfirmDialog`, `DemoDataTag`
- Fixture data in `src/data/*.ts` with typed interfaces mirroring future API shapes (portfolio, positions, orders, candles, news, journal, audit)
- Loading / empty / stale / offline / error / unauthorised states as reusable state components
- Per-route `head()` metadata, keyboard focus, contrast, reduced-motion support
