import { describe, expect, it } from "vitest";

import { formatUnitValue, normalizeCalendarEvent, pickNumber, toNumber } from "./normalize";
import type { CalendarEvent, OfficialRelease } from "./types";

const baseRelease: OfficialRelease = {
  releaseId: "cpi-2026-09-10",
  agency: "BLS",
  event: "CPI m/m",
  impact: "High",
  currency: "USD",
  unit: "%",
  nextReleaseUtc: "2026-09-10T12:30:00.000Z",
  actualSource: "BLS API · fetched 2026-09-10T12:31:00Z",
  actualLabel: "Actual",
  time: "12:30",
  actual: "0.0%",
  forecast: "—",
  previous: "0.0%",
  actualValue: 0,
  previousValue: 0,
  previousPeriodIso: "2026-08-01T00:00:00.000Z",
  history: [],
};

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    release: baseRelease,
    estimate: null,
    consensus: null,
    forecast: { value: "—", label: "Model Estimate", detail: "", numericValue: null },
    assessment: null,
    ...overrides,
  };
}

describe("toNumber", () => {
  it("keeps zero and rejects empty-ish input", () => {
    expect(toNumber(0)).toBe(0);
    expect(toNumber("0")).toBe(0);
    expect(toNumber("0.0%")).toBe(0);
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber("   ")).toBeNull();
    expect(toNumber("n/a")).toBeNull();
  });

  it("parses separators and unit suffixes", () => {
    expect(toNumber("1,234K")).toBe(1234);
    expect(toNumber("-0.3%")).toBe(-0.3);
  });
});

describe("pickNumber", () => {
  it("resolves provider field aliases and keeps 0", () => {
    expect(pickNumber({ prev: 0 }, ["previous", "prev", "previousValue"])).toBe(0);
    expect(pickNumber({ consensus: "0" }, ["forecast", "consensus"])).toBe(0);
    expect(pickNumber({ previous: null, prior: 1.2 }, ["previous", "prior"])).toBe(1.2);
    expect(pickNumber({}, ["previous"])).toBeNull();
  });
});

describe("formatUnitValue", () => {
  it("preserves units without rescaling", () => {
    expect(formatUnitValue(0, "%")).toBe("0.0%");
    expect(formatUnitValue(228, "K")).toBe("228K");
    expect(formatUnitValue(4.1, "M")).toBe("4.10M");
    expect(formatUnitValue(48.7, "")).toBe("48.7");
    expect(formatUnitValue(null, "%")).toBeNull();
  });
});

describe("normalizeCalendarEvent", () => {
  const now = new Date("2026-09-11T00:00:00.000Z");

  it("renders zero-valued actual, forecast and previous", () => {
    const n = normalizeCalendarEvent(
      event({
        forecast: {
          value: "0.0%",
          label: "Market Consensus",
          detail: "Reuters",
          numericValue: 0,
        },
        consensus: {
          value: "0.0%",
          label: "Market Consensus",
          source: "Reuters",
          retrievedAt: "2026-09-10T07:00:00.000Z",
          searchAttempts: 1,
        },
      }),
      now,
    );

    expect(n.actual.value).toBe(0);
    expect(n.actual.displayValue).toBe("0.0%");
    expect(n.marketForecast.value).toBe(0);
    expect(n.marketForecast.displayValue).toBe("0.0%");
    expect(n.marketForecast.source).toBe("Reuters");
    expect(n.previous.value).toBe(0);
    expect(n.previous.displayValue).toBe("0.0%");
    expect(n.previous.referencePeriod).toBe("2026-08-01T00:00:00.000Z");
  });

  it("shows provider forecast and previous whenever the API supplied them", () => {
    const n = normalizeCalendarEvent(
      event({
        release: { ...baseRelease, previousValue: 0.4, previous: "0.4%" },
        forecast: {
          value: "0.3%",
          label: "Market Consensus",
          detail: "Bloomberg",
          numericValue: 0.3,
        },
      }),
      now,
    );
    expect(n.marketForecast.displayValue).toBe("0.3%");
    expect(n.previous.displayValue).toBe("0.4%");
  });

  it("never lets the model estimate leak into Market Forecast", () => {
    const n = normalizeCalendarEvent(
      event({
        estimate: {
          value: "0.2%",
          numericValue: 0.2,
          label: "AURIQ Estimate",
          modelVersion: "v1.0",
          computedAt: now.toISOString(),
          historicalPoints: 24,
        },
        forecast: {
          value: "0.2%",
          label: "Model Estimate",
          detail: "v1.0",
          numericValue: 0.2,
        },
      }),
      now,
    );
    expect(n.marketForecast.value).toBeNull();
    expect(n.marketForecast.displayValue).toBeNull();
    expect(n.auriqEstimate.displayValue).toBe("0.2%");
    expect(n.auriqEstimate.modelVersion).toBe("v1.0");
  });

  it("keeps the actual empty before the release instant", () => {
    const n = normalizeCalendarEvent(
      event({
        release: { ...baseRelease, actualValue: null, actual: "—" },
      }),
      new Date("2026-09-09T00:00:00.000Z"),
    );
    expect(n.isReleased).toBe(false);
    expect(n.actual.displayValue).toBeNull();
  });

  it("stores UTC and matches the event identity", () => {
    const n = normalizeCalendarEvent(event(), now);
    expect(n.releaseAt).toBe("2026-09-10T12:30:00.000Z");
    expect(n.id).toBe("cpi-2026-09-10");
    expect(n.eventName).toBe("CPI m/m");
    expect(n.currency).toBe("USD");
  });
});
