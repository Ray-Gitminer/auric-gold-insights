import { describe, expect, it } from "vitest";

import { canonicalEconomicEventId } from "./canonical-event";
import { mergeScheduledReleases } from "./merge-releases";
import type { OfficialRelease, OfficialReleasePayload } from "./types";
import type { ScheduledRelease } from "./us-release-calendar";

function scheduled(event: string, at: string): ScheduledRelease {
  return {
    releaseId: `schedule-${event}`,
    event,
    agency: "BLS",
    currency: "USD",
    impact: "High",
    unit: "",
    nextReleaseUtc: at,
    actualLabel: "Actual",
    actualSource: "Official schedule",
    actualValue: null,
    previousValue: null,
    actual: "—",
    forecast: "—",
    previous: "—",
    history: [],
    time: "12:30",
    provider: "BLS",
    sourceUrl: "https://bls.gov",
    fetchedAt: "2026-09-01T00:00:00Z",
    maxLagDays: 75,
  };
}

function history(event: string, values: number[], unit = "K"): OfficialReleasePayload {
  const release: OfficialRelease = {
    ...scheduled(event, "2026-10-01T12:30:00Z"),
    releaseId: `history-${event}`,
    unit,
    history: values.map((value, index) => ({
      periodIso: `2026-0${index + 5}-01T00:00:00.000Z`,
      value,
    })),
  };
  return { releases: [release], status: { agency: "BLS", ok: true, message: "ok" } };
}

describe("canonical economic event IDs", () => {
  it("joins common NFP aliases to one ID", () => {
    expect(canonicalEconomicEventId("NFP")).toBe("US_NFP_CHANGE");
    expect(canonicalEconomicEventId("Non-Farm Employment Change")).toBe("US_NFP_CHANGE");
  });
});

describe("mergeScheduledReleases", () => {
  it("shows the latest published value as Previous for the next occurrence", () => {
    const result = mergeScheduledReleases(
      [scheduled("NFP", "2026-09-04T12:30:00Z")],
      [history("Non-Farm Employment Change", [-23, 55])],
      new Date("2026-09-01T00:00:00Z"),
    );
    expect(result.releases[0]?.previousValue).toBe(55);
    expect(result.releases[0]?.previous).toBe("55K");
    expect(result.uncovered).toEqual([]);
  });

  it("preserves a real zero previous value", () => {
    const result = mergeScheduledReleases(
      [scheduled("Unemployment Rate", "2026-09-04T12:30:00Z")],
      [history("Unemployment", [4.1, 0], "%")],
      new Date("2026-09-01T00:00:00Z"),
    );
    expect(result.releases[0]?.previousValue).toBe(0);
    expect(result.releases[0]?.previous).toBe("0.0%");
  });
});
