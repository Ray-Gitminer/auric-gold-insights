# AURIQ: Real signals, calendar charts, news redesign

Large request split into 3 phases, built in order. Each phase is verified at 1672×941 and 390×844.

## Phase 1 — Dashboard signals (3 modes, user-selectable)
A selector on the Signal Summary card: **1 Formula · 2 AI Decide · 3 Rayny/MPGP**.
- **1 Formula (default):** deterministic engine from real MT5 candles — EMA 20/50 trend, RSI 14, swing High/Low support/resistance, Premium/Discount (range midpoint), ATR-based Entry Zone / Stop Loss / TP1 / TP2, confidence = conditions passed. Replaces "รอเชื่อมข้อมูล" on Signal Summary + Market Context when MT5 data exists.
- **2 AI Decide:** button "วิเคราะห์ด้วย AI" sends the latest candles + formula output to AI; AI returns bias/entry/SL/TP + reasoning. Labeled "AI judgment — not verified". Runs only when the user presses the button.
- **3 Rayny/MPGP:** shows "รอสูตรจากคุณ" until rules are provided (no invented logic).
- Live clock + chart/price refresh every 1 second (MT5 polling); AI never runs automatically.
- If MT5 is offline: keep "ข้อมูลตัวอย่าง" labels; signals show "ต้องเชื่อม MT5".

## Phase 2 — Economic Calendar trend charts
- Every row gets an expandable trend chart (last 24 periods, actual vs previous), same style as the existing graph.
- Source A: existing official data (FRED/BLS/BEA/Census) — always available.
- Source B: FinanceCalendar.com via the Firecrawl connector (server-side, cached ~1h) to fill Forecast/Actual and indicators without official feeds (ISM/ADP). Each value shows its source badge; toggle "Official / FinanceCalendar".
- Requires connecting Firecrawl (costs credits). If their site blocks or changes, falls back to official data with an honest notice.

## Phase 3 — News pages redesigned to the reference image
Applied to both **ข่าวเศรษฐกิจ** and **วิเคราะห์ข่าว**, using the Dashboard top-nav + glass style:
- Hero "วิเคราะห์ข่าวให้เข้าใจเร็ว" + subtitle.
- Left Filters: Asset/Topic chips, Impact checkboxes, Session (Today/This Week/Upcoming), Source, Gold Bullish/Bearish/Neutral.
- Center: Upcoming Impact Timeline (horizontal), Latest & Upcoming Events cards (impact block, Previous/Consensus/Actual, gold-direction arrow, AI Interpretation line, View Scenario).
- Right: AURIQ AI News Insight (Gold Bias, Volatility Risk, Confidence), Scenario Analysis (Bullish/Bearish for Gold), Trading Plan, Impact Legend.
- Bottom: How AURIQ Reads News, Before/After News checklists.
- All numbers from real calendar/news; missing consensus stays "—". AI Insight runs on button press.

## Technical notes
- Formula engine: `src/lib/signals/engine.ts` (pure, unit-testable); AI mode via a server function on the Lovable AI Gateway (default model), structured output.
- FinanceCalendar: server function + Firecrawl `scrape` with JSON extraction; in-memory cache.
- Shared news layout component reused by both routes; existing filters/analysis/export logic kept.
- Update AGENTS.md: signals computed deterministically; AI only interprets or runs in explicit AI mode.
