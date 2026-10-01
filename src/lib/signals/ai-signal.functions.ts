import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  timeframe: z.string().max(8),
  candles: z.array(z.object({ t: z.string(), o: z.number(), h: z.number(), l: z.number(), c: z.number() })).max(120),
  formula: z.record(z.string(), z.unknown()).nullable(),
});

export interface AiSignal {
  bias: "Bullish" | "Bearish" | "Neutral";
  entry: string | null;
  stop: string | null;
  tp1: string | null;
  tp2: string | null;
  confidence: number;
  reasoning: string;
  reasoningTh: string;
  generatedAt: string;
}

export const runAiSignal = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; signal: AiSignal } | { ok: false; error: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "AI is not configured" };
    const rows = data.candles.map((c) => `${c.t},${c.o},${c.h},${c.l},${c.c}`).join("\n");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an XAUUSD technical analyst. Use only the supplied candles and indicator values. Never invent prices outside the data range logic. Reply with JSON only." },
          {
            role: "user",
            content:
              `Timeframe ${data.timeframe}. Candles (time,open,high,low,close):\n${rows}\n\nFormula engine output: ${JSON.stringify(data.formula)}\n\n` +
              `Return {"bias":"Bullish|Bearish|Neutral","entry":"price range or null","stop":"price or null","tp1":"price or null","tp2":"price or null","confidence":0-100,"reasoning":"2-3 sentences English","reasoningTh":"same in natural Thai"}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      const msg = res.status === 402 ? "AI credits exhausted" : res.status === 429 ? "AI is busy, try again shortly" : `AI error ${res.status}`;
      console.error("ai-signal", res.status, body.slice(0, 300));
      return { ok: false, error: msg };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      const p = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as Partial<AiSignal>;
      const bias = p.bias === "Bullish" || p.bias === "Bearish" ? p.bias : "Neutral";
      return {
        ok: true,
        signal: {
          bias,
          entry: p.entry ?? null, stop: p.stop ?? null, tp1: p.tp1 ?? null, tp2: p.tp2 ?? null,
          confidence: Math.max(0, Math.min(100, Number(p.confidence) || 0)),
          reasoning: String(p.reasoning ?? ""), reasoningTh: String(p.reasoningTh ?? ""),
          generatedAt: new Date().toISOString(),
        },
      };
    } catch {
      return { ok: false, error: "AI returned an unreadable answer" };
    }
  });
