CREATE TABLE public.market_candles_m5 (
  "timestamp" timestamptz PRIMARY KEY,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.market_candles_m5 TO authenticated;
GRANT ALL ON public.market_candles_m5 TO service_role;
ALTER TABLE public.market_candles_m5 ENABLE ROW LEVEL SECURITY;
CREATE POLICY market_candles_m5_read_authenticated ON public.market_candles_m5 FOR SELECT TO authenticated USING (true);