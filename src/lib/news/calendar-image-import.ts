import { createServerFn } from "@tanstack/react-start";

import type { EventSnapshot } from "./analysis-types";

export interface ImportedCalendarRow extends EventSnapshot {
  include: boolean;
}

const MODEL = "google/gemini-3.7-flash";
const MAX_DATA_URL_LENGTH = 10_500_000;

function impact(value: unknown): EventSnapshot["impact"] {
  return value === "High" || value === "Low" ? value : "Medium";
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean && clean !== "—" && clean !== "-" ? clean : null;
}

export const extractCalendarScreenshot = createServerFn({ method: "POST" })
  .inputValidator((input: { imageDataUrl: string }) => input)
  .handler(async ({ data }): Promise<ImportedCalendarRow[]> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI_UNAVAILABLE");
    if (
      !/^data:image\/(png|jpeg|webp);base64,/.test(data.imageDataUrl) ||
      data.imageDataUrl.length > MAX_DATA_URL_LENGTH
    ) {
      throw new Error("INVALID_IMAGE");
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract an economic calendar screenshot into structured data. Never infer a hidden or unreadable number. " +
              "Keep minus signs, decimals, percent signs and K/M/B suffixes exact. Return JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Read only USD rows. Convert the displayed calendar date/time to an ISO-8601 UTC instant, treating the screenshot time as Asia/Bangkok unless the image explicitly states another timezone. " +
                  'Return {"events":[{"event":"...","releaseUtc":"...","impact":"High|Medium|Low","actual":null,"forecast":"55K","previous":"-23K"}]}. ' +
                  "Use null for blank/unreadable cells. Do not calculate or guess values.",
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OCR_GATEWAY_${res.status}`);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as {
      events?: Record<string, unknown>[];
    };

    return (parsed.events ?? []).flatMap((raw, index) => {
      const event = text(raw["event"]);
      const releaseUtc = text(raw["releaseUtc"]);
      if (!event || !releaseUtc || Number.isNaN(Date.parse(releaseUtc))) return [];
      return [
        {
          include: true,
          releaseId: `screenshot_${Date.now()}_${index}`,
          event,
          currency: "USD",
          impact: impact(raw["impact"]),
          nextReleaseUtc: new Date(releaseUtc).toISOString(),
          actual: text(raw["actual"]),
          marketForecast: text(raw["forecast"]),
          marketForecastSource: "User-provided calendar screenshot",
          auriqEstimate: null,
          previous: text(raw["previous"]),
          source: "Calendar screenshot · pending user verification",
        },
      ];
    });
  });
