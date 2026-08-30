/**
 * AURIQ demo fixtures.
 *
 * Every value below is synthetic DEMO DATA. These interfaces intentionally mirror
 * the shapes the future backend API (IBKR connector, market-data service, strategy
 * engine, news/AI service, audit log) is expected to return, so screens can be
 * repointed at real endpoints without changing component code.
 */

export const DEMO = true;

export interface AccountSnapshot {
  accountId: string;
  mode: "PAPER" | "LIVE";
  netLiquidation: number;
  availableCash: number;
  todayPnl: number;
  todayPnlPct: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  marginUsed: number;
  marginUsedPct: number;
  drawdownPct: number;
  drawdownValue: number;
  lastSync: string;
}

export const account: AccountSnapshot = {
  accountId: "DU-4417802",
  mode: "PAPER",
  netLiquidation: 250846.23,
  availableCash: 112350.12,
  todayPnl: 1842.35,
  todayPnlPct: 0.74,
  unrealisedPnl: 2145.6,
  unrealisedPnlPct: 0.86,
  marginUsed: 26315.4,
  marginUsedPct: 10.5,
  drawdownPct: -1.28,
  drawdownValue: -3267.8,
  lastSync: "09:32:15",
};

export interface Position {
  id: string;
  symbol: string;
  name: string;
  side: "LONG" | "SHORT";
  qty: number;
  avgPrice: number;
  lastPrice: number;
  unrealisedPnl: number;
  pnlPct: number;
  stopLoss: number | null;
  takeProfit: number | null;
}

export const positions: Position[] = [
  {
    id: "pos-1",
    symbol: "GCM5",
    name: "Gold Futures Jun 25",
    side: "LONG",
    qty: 2,
    avgPrice: 2282.1,
    lastPrice: 2354.6,
    unrealisedPnl: 1450,
    pnlPct: 3.18,
    stopLoss: 2240,
    takeProfit: 2430,
  },
  {
    id: "pos-2",
    symbol: "SILM5",
    name: "Silver Futures Jun 25",
    side: "LONG",
    qty: 5,
    avgPrice: 31.245,
    lastPrice: 32.18,
    unrealisedPnl: 4675,
    pnlPct: 2.99,
    stopLoss: 30.4,
    takeProfit: 34.5,
  },
  {
    id: "pos-3",
    symbol: "HGK5",
    name: "Copper Futures May 25",
    side: "SHORT",
    qty: 1,
    avgPrice: 4.124,
    lastPrice: 4.192,
    unrealisedPnl: -680,
    pnlPct: -1.65,
    stopLoss: 4.31,
    takeProfit: 3.94,
  },
  {
    id: "pos-4",
    symbol: "XAUUSD",
    name: "Spot Gold",
    side: "LONG",
    qty: 40,
    avgPrice: 2338.4,
    lastPrice: 2354.6,
    unrealisedPnl: 648,
    pnlPct: 0.69,
    stopLoss: 2312,
    takeProfit: 2405,
  },
];

export interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "STOP" | "STOP LIMIT" | "MARKET";
  qty: number;
  price: number;
  status: "Working" | "Submitted" | "PreSubmitted" | "Cancelled" | "Filled";
  submitted: string;
}

export const orders: Order[] = [
  { id: "ord-1", symbol: "GCM5", side: "BUY", type: "LIMIT", qty: 1, price: 2300, status: "Working", submitted: "08:41:02" },
  { id: "ord-2", symbol: "GCM5", side: "SELL", type: "LIMIT", qty: 1, price: 2410, status: "Working", submitted: "08:41:20" },
  { id: "ord-3", symbol: "SILM5", side: "SELL", type: "STOP", qty: 5, price: 30.25, status: "PreSubmitted", submitted: "09:02:55" },
  { id: "ord-4", symbol: "HGK5", side: "BUY", type: "LIMIT", qty: 1, price: 4.08, status: "Working", submitted: "09:14:33" },
  { id: "ord-5", symbol: "XAUUSD", side: "SELL", type: "STOP LIMIT", qty: 20, price: 2312, status: "Submitted", submitted: "09:20:07" },
];

export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  event?: string | undefined;
}

/** Deterministic pseudo-random walk so SSR and client render identically. */
function buildCandles(count: number, start: number, step: number, seed = 7): Candle[] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const out: Candle[] = [];
  let price = start;
  for (let i = 0; i < count; i++) {
    const drift = (rand() - 0.42) * step;
    const o = price;
    const c = Math.max(1, o + drift);
    const h = Math.max(o, c) + rand() * step * 0.6;
    const l = Math.min(o, c) - rand() * step * 0.6;
    out.push({
      t: `T-${count - i}`,
      o: +o.toFixed(2),
      h: +h.toFixed(2),
      l: +l.toFixed(2),
      c: +c.toFixed(2),
      v: Math.round(40000 + rand() * 90000),
      event: i === 18 || i === 42 || i === 66 ? "News" : undefined,
    });
    price = c;
  }
  return out;
}

export const candlesByTimeframe: Record<string, Candle[]> = {
  "5m": buildCandles(80, 2338, 3.2, 11),
  "15m": buildCandles(80, 2320, 5.5, 23),
  "1h": buildCandles(80, 2295, 9, 41),
  "4h": buildCandles(80, 2240, 16, 67),
  "1D": buildCandles(80, 2120, 26, 97),
};

export const instrument = {
  symbol: "XAUUSD",
  label: "Spot Gold · XAU/USD",
  exchange: "OTC · USD/oz",
  last: 2354.6,
  change: 18.7,
  changePct: 0.8,
  high: 2361.1,
  low: 2330.2,
  volume: "142.3K",
  resistance: [
    { label: "R2", value: 2430 },
    { label: "R1", value: 2390 },
  ],
  support: [
    { label: "S1", value: 2300 },
    { label: "S2", value: 2240 },
  ],
};

export type SetupState = "WAITING" | "VALID" | "INVALID" | "TRIGGERED";

export interface StrategyCondition {
  label: string;
  pass: boolean;
  detail: string;
}

export const strategy: { state: SetupState; name: string; conditions: StrategyCondition[] } = {
  state: "WAITING",
  name: "Gold trend continuation (1D)",
  conditions: [
    { label: "Price above 50 EMA", pass: true, detail: "2,354.6 > 2,301.4" },
    { label: "Higher high structure", pass: true, detail: "Last swing high broken 14 May" },
    { label: "Pullback into value zone", pass: false, detail: "Awaiting retest of 2,330" },
    { label: "Momentum not overextended", pass: true, detail: "RSI 61.4" },
    { label: "No high-impact event < 60m", pass: false, detail: "CPI y/y in 42m" },
    { label: "Spread within tolerance", pass: true, detail: "0.28 vs max 0.45" },
  ],
};

export const impact = {
  score: 42,
  band: "Moderately bullish",
  vsYesterday: 6,
  drivers: [
    { label: "Softer USD (DXY -0.4%)", weight: 18 },
    { label: "Core CPI in line", weight: 11 },
    { label: "Central bank buying headlines", weight: 9 },
    { label: "Rising real yields", weight: -7 },
  ],
};

export const bias = {
  direction: "Bullish" as "Bullish" | "Bearish" | "Neutral",
  confidence: "High" as "High" | "Medium" | "Low",
  horizon: "1–3 sessions",
  rationale:
    "Trend structure intact on the daily with dollar weakness and steady central-bank demand supporting dips toward the 2,330 value zone.",
  counterEvidence:
    "Real yields have ticked higher for three sessions and positioning is crowded; a hot core CPI print would invalidate the pullback thesis.",
  invalidation: "Daily close below 2,300 (S1) or a >1.2% USD rally.",
};

export const risk = {
  exposure: 68240.5,
  exposurePct: 27.2,
  marginHeadroom: 86034.72,
  dailyLossLimit: 5000,
  dailyLossUsed: 1180,
  var1d: 2180,
  maxPositionRisk: 1.62,
  status: "Normal" as "Normal" | "Elevated" | "Breach",
  connectionAgeSeconds: 12,
};

export interface EconomicEvent {
  time: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  actual: string;
  forecast: string;
  previous: string;
}

export const economicEvents: EconomicEvent[] = [
  { time: "08:30", event: "CPI m/m (Apr)", impact: "High", actual: "0.3%", forecast: "0.3%", previous: "0.4%" },
  { time: "08:30", event: "CPI y/y (Apr)", impact: "High", actual: "3.4%", forecast: "3.5%", previous: "3.5%" },
  { time: "10:00", event: "Core CPI m/m (Apr)", impact: "High", actual: "0.3%", forecast: "0.3%", previous: "0.4%" },
  { time: "10:00", event: "Core CPI y/y (Apr)", impact: "Medium", actual: "3.6%", forecast: "3.6%", previous: "3.8%" },
  { time: "14:00", event: "FOMC Member Speech", impact: "Medium", actual: "—", forecast: "—", previous: "—" },
];

export interface JournalEntry {
  id: string;
  date: string;
  time: string;
  title: string;
  setup: string;
  thesis: string;
  emotion: "Calm" | "Confident" | "Anxious" | "Frustrated" | "Impatient";
  disciplineScore: number;
  errors: string[];
  review: string;
  hasScreenshot: boolean;
}

export const journal: JournalEntry[] = [
  {
    id: "j-1",
    date: "14 May",
    time: "09:15",
    title: "GCM5 swing setup monitored",
    setup: "Trend continuation",
    thesis: "Watching the 2,300 support zone for a controlled retest before adding to the June future.",
    emotion: "Calm",
    disciplineScore: 9,
    errors: [],
    review: "Waited for the level instead of chasing. Good process.",
    hasScreenshot: true,
  },
  {
    id: "j-2",
    date: "14 May",
    time: "08:47",
    title: "SILM5 trailing stop adjusted",
    setup: "Position management",
    thesis: "Moved stop to 31.50 to lock in gains after the breakout extended.",
    emotion: "Confident",
    disciplineScore: 8,
    errors: ["Adjusted stop slightly early"],
    review: "Reasonable, but the plan called for 31.20.",
    hasScreenshot: true,
  },
  {
    id: "j-3",
    date: "14 May",
    time: "08:22",
    title: "Market recap",
    setup: "Pre-session prep",
    thesis: "Gold firm on softer USD, CPI in focus. No new risk before the print.",
    emotion: "Calm",
    disciplineScore: 10,
    errors: [],
    review: "Prep completed before the open.",
    hasScreenshot: false,
  },
  {
    id: "j-4",
    date: "13 May",
    time: "15:40",
    title: "HGK5 short — early entry",
    setup: "Mean reversion",
    thesis: "Faded the copper spike without waiting for confirmation.",
    emotion: "Impatient",
    disciplineScore: 5,
    errors: ["Entered before signal", "Size above plan"],
    review: "Cut size next time; the setup was not yet valid.",
    hasScreenshot: true,
  },
];

export interface AlertItem {
  id: string;
  severity: "risk" | "warning" | "info";
  message: string;
  time: string;
  date: string;
}

export const alerts: AlertItem[] = [
  { id: "a-1", severity: "risk", message: "Risk Alert: Drawdown 1.28% exceeds daily threshold 1.00%", time: "09:31", date: "14 May" },
  { id: "a-2", severity: "warning", message: "GCM5 reached resistance R1 (2,390.0)", time: "09:27", date: "14 May" },
  { id: "a-3", severity: "info", message: "CPI data released: Core CPI m/m 0.3% (in line)", time: "08:30", date: "14 May" },
  { id: "a-4", severity: "info", message: "Market data snapshot refreshed", time: "08:05", date: "14 May" },
];

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  channel: "In-app" | "In-app + Email";
  enabled: boolean;
}

export const alertRules: AlertRule[] = [
  { id: "r-1", name: "Daily drawdown breach", condition: "Drawdown ≤ -1.00% intraday", channel: "In-app + Email", enabled: true },
  { id: "r-2", name: "Gold key level", condition: "XAUUSD crosses 2,390 or 2,300", channel: "In-app", enabled: true },
  { id: "r-3", name: "Strategy setup valid", condition: "Setup state changes to VALID", channel: "In-app", enabled: true },
  { id: "r-4", name: "High-impact US event", condition: "60 minutes before High impact event", channel: "In-app + Email", enabled: false },
  { id: "r-5", name: "Connection stale", condition: "Data feed age > 60s", channel: "In-app", enabled: true },
];

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  published: string;
  dedup: "Unique" | "Duplicate cluster";
  relevance: number;
  direction: "Bullish" | "Bearish" | "Neutral";
  horizon: string;
  confidence: "High" | "Medium" | "Low";
  rationale: string;
  citations: string[];
}

export const news: NewsItem[] = [
  {
    id: "n-1",
    headline: "Dollar slips as traders raise odds of a September rate cut",
    source: "Reuters (RSS)",
    url: "https://example.com/demo-article-1",
    published: "14 May 09:12",
    dedup: "Unique",
    relevance: 86,
    direction: "Bullish",
    horizon: "1–3 sessions",
    confidence: "High",
    rationale: "A weaker dollar historically supports gold pricing; rate-cut odds reduce the opportunity cost of holding bullion.",
    citations: ["Reuters FX wrap", "CME FedWatch summary"],
  },
  {
    id: "n-2",
    headline: "Central bank gold purchases stay elevated in Q1",
    source: "World Gold Council (RSS)",
    url: "https://example.com/demo-article-2",
    published: "14 May 08:40",
    dedup: "Duplicate cluster",
    relevance: 74,
    direction: "Bullish",
    horizon: "1–2 quarters",
    confidence: "Medium",
    rationale: "Sustained official-sector demand provides a structural bid, though it moves slowly relative to intraday price action.",
    citations: ["WGC quarterly demand trends"],
  },
  {
    id: "n-3",
    headline: "Real yields climb to a three-week high",
    source: "Bloomberg (RSS)",
    url: "https://example.com/demo-article-3",
    published: "14 May 07:55",
    dedup: "Unique",
    relevance: 69,
    direction: "Bearish",
    horizon: "1 week",
    confidence: "Medium",
    rationale: "Higher real yields raise the carrying cost of non-yielding assets and typically pressure gold.",
    citations: ["US TIPS curve", "Bloomberg rates desk note"],
  },
  {
    id: "n-4",
    headline: "Physical premiums in Asia soften after the recent rally",
    source: "Kitco (RSS)",
    url: "https://example.com/demo-article-4",
    published: "13 May 22:18",
    dedup: "Unique",
    relevance: 41,
    direction: "Neutral",
    horizon: "Intraday",
    confidence: "Low",
    rationale: "Regional premium changes are a weak short-term signal and are already reflected in spot pricing.",
    citations: ["Kitco Asia physical market report"],
  },
];

export interface Trade {
  id: string;
  closed: string;
  symbol: string;
  side: "LONG" | "SHORT";
  qty: number;
  entry: number;
  exit: number;
  pnl: number;
  rMultiple: number;
  setup: string;
}

export const trades: Trade[] = [
  { id: "t-1", closed: "13 May", symbol: "GCM5", side: "LONG", qty: 1, entry: 2268.4, exit: 2312.8, pnl: 4440, rMultiple: 2.1, setup: "Trend continuation" },
  { id: "t-2", closed: "12 May", symbol: "XAUUSD", side: "LONG", qty: 30, entry: 2301.2, exit: 2294.6, pnl: -198, rMultiple: -0.6, setup: "Breakout" },
  { id: "t-3", closed: "10 May", symbol: "SILM5", side: "LONG", qty: 3, entry: 30.12, exit: 31.04, pnl: 13800, rMultiple: 1.8, setup: "Trend continuation" },
  { id: "t-4", closed: "09 May", symbol: "GCM5", side: "SHORT", qty: 1, entry: 2288.0, exit: 2299.5, pnl: -1150, rMultiple: -1.0, setup: "Mean reversion" },
  { id: "t-5", closed: "08 May", symbol: "XAUUSD", side: "LONG", qty: 25, entry: 2276.5, exit: 2298.9, pnl: 560, rMultiple: 1.4, setup: "Pullback" },
  { id: "t-6", closed: "07 May", symbol: "HGK5", side: "SHORT", qty: 2, entry: 4.31, exit: 4.24, pnl: 3500, rMultiple: 1.2, setup: "Mean reversion" },
  { id: "t-7", closed: "06 May", symbol: "GCM5", side: "LONG", qty: 2, entry: 2255.0, exit: 2246.2, pnl: -1760, rMultiple: -0.9, setup: "Breakout" },
  { id: "t-8", closed: "03 May", symbol: "XAUUSD", side: "LONG", qty: 40, entry: 2240.8, exit: 2268.4, pnl: 1104, rMultiple: 2.4, setup: "Trend continuation" },
];

export const tradeStats = {
  winRate: 62.5,
  profitFactor: 2.14,
  avgWin: 4680.8,
  avgLoss: -1036,
  expectancy: 2537.0,
  totalTrades: 8,
};

export interface AuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  before: string;
  after: string;
  result: "Success" | "Blocked" | "Failed";
  correlationId: string;
}

export const auditLog: AuditRecord[] = [
  {
    id: "au-1",
    timestamp: "14 May 09:31:02",
    actor: "owner@auriq.demo",
    action: "risk.threshold.breach",
    entity: "risk_monitor",
    before: "drawdown -0.94%",
    after: "drawdown -1.28%",
    result: "Success",
    correlationId: "c-8f21a4",
  },
  {
    id: "au-2",
    timestamp: "14 May 09:14:33",
    actor: "owner@auriq.demo",
    action: "order.prototype.preview",
    entity: "order/ord-4",
    before: "—",
    after: "BUY 1 HGK5 LIMIT 4.0800",
    result: "Blocked",
    correlationId: "c-77bd10",
  },
  {
    id: "au-3",
    timestamp: "14 May 08:47:11",
    actor: "owner@auriq.demo",
    action: "position.stop.update",
    entity: "position/pos-2",
    before: "SL 30.10",
    after: "SL 31.50",
    result: "Success",
    correlationId: "c-2ae913",
  },
  {
    id: "au-4",
    timestamp: "14 May 08:30:00",
    actor: "system.scheduler",
    action: "news.ingest",
    entity: "news_batch/2026-05-14-0830",
    before: "12 items",
    after: "9 unique items",
    result: "Success",
    correlationId: "c-51c0de",
  },
  {
    id: "au-5",
    timestamp: "14 May 08:05:44",
    actor: "system.connector",
    action: "marketdata.snapshot",
    entity: "feed/gold",
    before: "age 92s",
    after: "age 2s",
    result: "Success",
    correlationId: "c-13fa77",
  },
];

export const systemHealth = [
  { label: "Data Feed", status: "ok" as const, detail: "Snapshot age 12s" },
  { label: "IBKR Connection", status: "ok" as const, detail: "Paper gateway reachable" },
  { label: "News Engine", status: "ok" as const, detail: "Last run 08:30" },
  { label: "AI Analysis", status: "ok" as const, detail: "Advisory only" },
  { label: "Risk Engine", status: "warn" as const, detail: "Drawdown near limit" },
  { label: "Alerts Engine", status: "ok" as const, detail: "5 rules active" },
];

export const allocation = [
  { name: "Gold futures", value: 46, amount: 115389.26 },
  { name: "Spot gold", value: 24, amount: 60203.09 },
  { name: "Silver futures", value: 17, amount: 42643.86 },
  { name: "Copper futures", value: 5, amount: 12542.31 },
  { name: "Cash", value: 8, amount: 20067.71 },
];

export const performance = [
  { period: "Mon", pnl: 820 },
  { period: "Tue", pnl: -410 },
  { period: "Wed", pnl: 1560 },
  { period: "Thu", pnl: 2240 },
  { period: "Fri", pnl: 1842 },
];

export const performanceSummary = [
  { label: "Daily", value: 1842.35, pct: 0.74 },
  { label: "Weekly", value: 6052.0, pct: 2.48 },
  { label: "Monthly", value: 18420.9, pct: 7.92 },
];
