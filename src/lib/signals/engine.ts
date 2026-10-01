import type { Candle } from "@/data/fixtures";

export type Direction = "Bullish" | "Bearish" | "Neutral";

export interface FormulaSignal {
  bias: Direction;
  trend: Direction;
  last: number;
  ema20: number;
  ema50: number;
  rsi: number;
  atr: number;
  support: number;
  resistance: number;
  zone: "Premium" | "Discount" | "Equilibrium";
  structure: string;
  entry: [number, number] | null;
  stop: number | null;
  tp1: number | null;
  tp2: number | null;
  confidence: number;
  checks: { label: string; pass: boolean }[];
}

function ema(values: number[], period: number): number {
  const k = 2 / (period + 1);
  let e = values[0]!;
  for (let i = 1; i < values.length; i++) e = values[i]! * k + e * (1 - k);
  return e;
}

function rsi(values: number[], period = 14): number {
  let gain = 0;
  let loss = 0;
  const start = Math.max(1, values.length - period);
  for (let i = start; i < values.length; i++) {
    const d = values[i]! - values[i - 1]!;
    if (d > 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}

function atr(c: Candle[], period = 14): number {
  const s = c.slice(-period - 1);
  let sum = 0;
  for (let i = 1; i < s.length; i++) {
    const p = s[i - 1]!.c;
    const x = s[i]!;
    sum += Math.max(x.h - x.l, Math.abs(x.h - p), Math.abs(x.l - p));
  }
  return sum / Math.max(1, s.length - 1);
}

/** Deterministic AURIQ formula signal. Returns null with fewer than 30 candles. */
export function computeFormulaSignal(candles: Candle[]): FormulaSignal | null {
  if (candles.length < 30) return null;
  const closes = candles.map((c) => c.c);
  const last = closes[closes.length - 1]!;
  const e20 = ema(closes, 20);
  const e50 = ema(closes, 50);
  const r = rsi(closes);
  const a = atr(candles);
  const window = candles.slice(-50);
  const support = Math.min(...window.map((c) => c.l));
  const resistance = Math.max(...window.map((c) => c.h));
  const mid = (support + resistance) / 2;
  const band = (resistance - support) * 0.1;
  const zone = last > mid + band ? "Premium" : last < mid - band ? "Discount" : "Equilibrium";

  const half = window.slice(0, 25);
  const recent = window.slice(25);
  const hh = Math.max(...recent.map((c) => c.h)) > Math.max(...half.map((c) => c.h));
  const hl = Math.min(...recent.map((c) => c.l)) > Math.min(...half.map((c) => c.l));
  const structure = hh && hl ? "HH / HL" : !hh && !hl ? "LH / LL" : "Range";

  const trend: Direction = e20 > e50 && last > e20 ? "Bullish" : e20 < e50 && last < e20 ? "Bearish" : "Neutral";
  const checks = [
    { label: "EMA20 vs EMA50", pass: trend !== "Neutral" },
    { label: "RSI 14", pass: trend === "Bullish" ? r > 50 && r < 70 : trend === "Bearish" ? r < 50 && r > 30 : false },
    { label: "Structure", pass: (trend === "Bullish" && structure === "HH / HL") || (trend === "Bearish" && structure === "LH / LL") },
    { label: "Premium / Discount", pass: (trend === "Bullish" && zone !== "Premium") || (trend === "Bearish" && zone !== "Discount") },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const bias: Direction = trend !== "Neutral" && passed >= 3 ? trend : "Neutral";
  const r2 = (n: number) => Math.round(n * 100) / 100;

  let entry: [number, number] | null = null;
  let stop: number | null = null;
  let tp1: number | null = null;
  let tp2: number | null = null;
  if (bias === "Bullish") {
    entry = [r2(e20 - a * 0.25), r2(e20 + a * 0.25)];
    stop = r2(Math.max(support, e20 - a * 1.5));
    tp1 = r2(e20 + a * 1.5);
    tp2 = r2(Math.max(resistance, e20 + a * 3));
  } else if (bias === "Bearish") {
    entry = [r2(e20 - a * 0.25), r2(e20 + a * 0.25)];
    stop = r2(Math.min(resistance, e20 + a * 1.5));
    tp1 = r2(e20 - a * 1.5);
    tp2 = r2(Math.min(support, e20 - a * 3));
  }

  return {
    bias, trend, last, ema20: r2(e20), ema50: r2(e50), rsi: Math.round(r), atr: r2(a),
    support: r2(support), resistance: r2(resistance), zone, structure,
    entry, stop, tp1, tp2, confidence: Math.round((passed / checks.length) * 100), checks,
  };
}
