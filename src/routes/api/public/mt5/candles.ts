import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const candleSchema = z.object({
  symbol: z.string().trim().min(1).max(32).regex(/^[A-Z0-9._-]+$/),
  timeframe: z.enum(["M1", "M5", "M15", "M30", "H1", "H4", "D1"]),
  openTime: z.string().datetime({ offset: true }),
  open: z.number().positive().finite(),
  high: z.number().positive().finite(),
  low: z.number().positive().finite(),
  close: z.number().positive().finite(),
  tickVolume: z.number().int().nonnegative().max(2_147_483_647),
  spread: z.number().int().nonnegative().max(1_000_000),
}).superRefine((candle, context) => {
  if (candle.high < Math.max(candle.open, candle.close, candle.low)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "High is outside the candle range" });
  }
  if (candle.low > Math.min(candle.open, candle.close, candle.high)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Low is outside the candle range" });
  }
});

const payloadSchema = z.object({
  userId: z.string().uuid(),
  connectorName: z.string().trim().min(1).max(80),
  account: z.object({
    login: z.string().trim().regex(/^\d{1,32}$/),
    server: z.string().trim().min(1).max(120),
    broker: z.string().trim().min(1).max(120),
    displayName: z.string().trim().min(1).max(120),
  }),
  candles: z.array(candleSchema).min(1).max(1_000),
});

async function secretsMatch(received: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [receivedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(received)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(receivedHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export const Route = createFileRoute("/api/public/mt5/candles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedSecret = process.env["MT5_CONNECTOR_SHARED_SECRET"];
        const receivedSecret = request.headers.get("x-auriq-connector-secret") ?? "";
        if (!expectedSecret || !receivedSecret || !(await secretsMatch(receivedSecret, expectedSecret))) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const contentLength = Number(request.headers.get("content-length") ?? "0");
        if (contentLength > 1_500_000) {
          return Response.json({ error: "Payload too large" }, { status: 413 });
        }

        let input: unknown;
        try {
          input = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = payloadSchema.safeParse(input);
        if (!parsed.success) {
          return Response.json({ error: "Invalid candle payload" }, { status: 400 });
        }

        const { userId, connectorName, account, candles } = parsed.data;
        const now = new Date().toISOString();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: agent, error: agentError } = await supabaseAdmin
          .from("connector_agents")
          .upsert({
            user_id: userId,
            name: connectorName,
            machine_label: "Windows MT5",
            platform: "windows",
            status: "online",
            version: "2.0.0-candles-only",
            capabilities: {
              read_account: false,
              read_positions: false,
              read_deals: false,
              read_candles: true,
              send_orders: false,
              modify_orders: false,
            },
            last_seen_at: now,
            secret_ref: "MT5_CONNECTOR_SHARED_SECRET",
          }, { onConflict: "user_id,name" })
          .select("id")
          .single();
        if (agentError) {
          console.error("MT5 agent upsert failed", agentError.message);
          return Response.json({ error: "Could not register connector" }, { status: 500 });
        }

        const { data: mt5Account, error: accountError } = await supabaseAdmin
          .from("mt5_accounts")
          .upsert({
            user_id: userId,
            connector_agent_id: agent.id,
            broker: account.broker,
            server: account.server,
            login: account.login,
            display_name: account.displayName,
            currency: "USD",
            status: "connected",
            auto_trade_enabled: false,
            last_sync_at: now,
          }, { onConflict: "user_id,server,login" })
          .select("id")
          .single();
        if (accountError) {
          console.error("MT5 account upsert failed", accountError.message);
          return Response.json({ error: "Could not register MT5 account" }, { status: 500 });
        }

        const rows = candles.map((candle) => ({
          user_id: userId,
          account_id: mt5Account.id,
          symbol: candle.symbol,
          timeframe: candle.timeframe,
          open_time: candle.openTime,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          tick_volume: candle.tickVolume,
          spread: candle.spread,
        }));
        const { error: candleError } = await supabaseAdmin
          .from("mt5_candles")
          .upsert(rows, { onConflict: "account_id,symbol,timeframe,open_time" });
        if (candleError) {
          console.error("MT5 candle upsert failed", candleError.message);
          return Response.json({ error: "Could not store candles" }, { status: 500 });
        }

        return Response.json({ accepted: rows.length, receivedAt: now });
      },
    },
  },
});