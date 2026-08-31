# AURIQ Economic Calendar — automated data pipeline

Replaces the static `economicEvents` fixture with a live, labelled pipeline (Official schedule → AURIQ Estimate → Consensus → Impact), plus a dedicated `/economic-calendar` page.

## Blockers / corrections to the brief (need your call)

1. **API keys.** Only BLS works truly key-free (v2 unregistered: 25 requests/day/IP, 10-year span, no key). The others do NOT have usable demo keys:
   - **BEA** — `UserID=DEMO_KEY` is not a real BEA key; BEA rejects it. Needs a free registered key.
   - **FRED** — no public demo key; the API requires `api_key`. `fredgraph.csv` works without a key but is a CSV graph endpoint with no CORS guarantee.
   - **Census** — free key required above 500 calls/day.
   Proposal: add `BLS_API_KEY`, `BEA_API_KEY`, `FRED_API_KEY`, `CENSUS_API_KEY` as optional project secrets. Each fetcher degrades gracefully when its key is absent (that indicator falls back to AURIQ Estimate / "Data unavailable"). You can supply keys later without a code change.

2. **"All API calls client-side" is not workable here.** Browser calls would (a) leak API keys, (b) hit CORS on FRED/BEA/Census, (c) blow BLS's 25/day/IP limit. Plan: fetch through TanStack Start **server functions** (`src/lib/economic-calendar/*.functions.ts`) with a short in-memory server cache; React Query still owns client caching, polling, retries and error boundaries exactly as specified.

3. **Anthropic is not integrated.** The project has the Lovable AI gateway key only (no `openai`/`@anthropic-ai/sdk` package). Consensus search will use the gateway from a server function. Gateway chat models do not do live web search, so the "consensus" would be model recall, not a sourced quote — which would violate your own labelling rule. Proposal: the consensus layer returns `null` unless the model returns a named publication **and** a retrieval timestamp it can justify; otherwise the row shows `Model Estimate` (amber). Say the word if you'd rather drop Layer 3 entirely for MVP.

4. **No persistence.** Lovable Cloud is off, so estimates/consensus/impact live in server memory + React Query cache and reset on redeploy. Cross-user history and true 5-minute cron polling need Cloud; MVP polls only while a tab is open.

## What gets built

**Types** — `src/lib/economic-calendar/types.ts`: `OfficialRelease` (extends existing `EconomicEvent`, unchanged fields), `AuriqEstimate`, `ConsensusResult`, `ImpactAssessment`, `CalendarEvent` (the merged row the UI renders).

**Layer 1 — official schedule + actuals**
`bls-api.ts` (CPI, Core CPI, PPI, NFP, Unemployment), `bea-api.ts` (PCE, GDP), `fred-api.ts` (FOMC / Fed Funds), each exposing a server function returning `OfficialRelease[]` with `actualSource` stamped `"<AGENCY> API · fetched <ISO>"`. Release dates come from the BLS schedule endpoint plus a small hard-coded fallback table so the calendar is never empty.

**Layer 2 — AURIQ Estimate** — `auriq-model.ts`: pure, testable. 24 months of actuals → 60% seasonal naive (t−12) + 40% linear regression over last 6 points, rounded to 1 dp, tagged `v1.0-seasonal-naive+linreg` with `historicalPoints`.

**Layer 3 — consensus** — `consensus-search.ts`: server function, only invoked when `nextReleaseUtc` is inside 24h, strict JSON schema, `searchAttempts` tracked, null-safe.

**Layer 4 — impact** — `impact-engine.ts`: pure. `surprisePct`, `beat|miss|inline` (<5%), `IMPACT_RULES` table as specified, `goldBias`/`usdBias`/`magnitude`.

**Hook** — `src/hooks/use-economic-calendar.ts`: one React Query query per layer, merged into `CalendarEvent[]`; `refetchInterval` 5 min on a release day, else 60 min; exposes `isLoading`, `error`, `refetch`.

**UI**
- `src/routes/index.tsx` — the Economic Events card switches to the hook. Forecast cell renders exactly one badge (green `Market Consensus` + source tooltip / amber `Model Estimate` + model version / blue `AURIQ Estimate`), never blank. Actual cell: dash before release, then value + `Actual` source badge + surprise pill (`+0.1% beat` / `-0.2% miss` / `inline`).
- `src/routes/economic-calendar.tsx` — week view with day columns, per-event card showing all three layers, impact filter (High/Medium/Low using existing impact colours), collapsible "AURIQ Analysis" with goldBias/usdBias/rationale, own `head()` metadata, loading/empty/error+retry states from the existing state primitives.
- `AppShell.tsx` — nav entry right after "วิเคราะห์ข่าว" (News).
- `th.ts` / `en.ts` — all new labels; `Actual`, `Market Consensus`, `AURIQ Estimate`, `Model Estimate`, `CPI`, `NFP`, `PCE` etc. kept as technical terms per the existing convention.

`economicEvents` stays exported in `fixtures.ts` as the offline fallback so nothing breaks if every layer fails.

## Out of scope

No paid APIs, no Investing.com scraping, no Supabase/IBKR/live orders, no new paid dependencies. Existing design, routes, TH/EN switcher and chart behaviour untouched.
