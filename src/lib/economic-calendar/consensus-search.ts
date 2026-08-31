import { createServerFn } from "@tanstack/react-start";

import type { ConsensusResult } from "./types";

export interface ConsensusRequestItem {
  releaseId: string;
  event: string;
  nextReleaseUtc: string;
}

/**
 * Publications the model must name for a result to count as a real consensus.
 * Anything else is treated as unsourced and downgraded to Model Estimate.
 */
const ALLOWED_SOURCES = [
  "reuters",
  "bloomberg",
  "wsj",
  "wall street journal",
  "financial times",
  "cnbc",
  "marketwatch",
  "dow jones",
  "barron",
  "investing.com",
  "trading economics",
  "forexlive",
  "econoday",
];

function unresolved(attempts: number): ConsensusResult {
  return {
    value: null,
    label: "Model Estimate",
    source: null,
    retrievedAt: new Date().toISOString(),
    searchAttempts: attempts,
  };
}

function isPlausibleValue(value: unknown): value is string {
  return typeof value === "string" && /-?\d/.test(value) && value.trim().length <= 16;
}

export const searchConsensus = createServerFn({ method: "POST" })
  .inputValidator((input: { items: ConsensusRequestItem[] }) => input)
  .handler(async ({ data }): Promise<Record<string, ConsensusResult>> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    const out: Record<string, ConsensusResult> = {};
    if (!apiKey || data.items.length === 0) {
      for (const item of data.items) out[item.releaseId] = unresolved(0);
      return out;
    }

    for (const item of data.items) {
      const retrievedAt = new Date().toISOString();
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.7-flash",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You report US economic data consensus forecasts. Never invent a number or a source. " +
                  "Only answer when you can name a specific financial publication that published the consensus " +
                  "and can justify the retrieval time. Reply with JSON only.",
              },
              {
                role: "user",
                content:
                  `Search for the current market consensus forecast for ${item.event} scheduled for ${item.nextReleaseUtc}.\n` +
                  `Return ONLY: {"consensus": "0.3%", "source": "Reuters/Bloomberg/WSJ/etc", "retrievedAt": "ISO-8601"}\n` +
                  `If no reliable consensus found from a named financial publication, return: {"consensus": null, "source": null, "retrievedAt": "${retrievedAt}"}`,
              },
            ],
          }),
        });

        if (!res.ok) {
          out[item.releaseId] = unresolved(1);
          continue;
        }

        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(content) as {
          consensus?: unknown;
          source?: unknown;
          retrievedAt?: unknown;
        };

        const source = typeof parsed.source === "string" ? parsed.source.trim() : "";
        const named = ALLOWED_SOURCES.some((s) => source.toLowerCase().includes(s));
        const stamp =
          typeof parsed.retrievedAt === "string" && !Number.isNaN(Date.parse(parsed.retrievedAt))
            ? new Date(parsed.retrievedAt).toISOString()
            : null;

        if (!isPlausibleValue(parsed.consensus) || !named || !stamp) {
          out[item.releaseId] = unresolved(1);
          continue;
        }

        out[item.releaseId] = {
          value: parsed.consensus.trim(),
          label: "Market Consensus",
          source: `${source} · found ${stamp}`,
          retrievedAt: stamp,
          searchAttempts: 1,
        };
      } catch {
        out[item.releaseId] = unresolved(1);
      }
    }

    return out;
  });
