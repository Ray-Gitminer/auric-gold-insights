# Twelve Data candlestick chart

## What will change
- Read the newest XAU/USD M5 candle rows from the existing `market_candles_m5` table when Market Data opens.
- Render those rows with the existing AURIQ candlestick chart styling.
- Show a clear `Twelve Data` source badge, latest timestamp, loading/empty/error states, and refresh the chart after a successful manual test.
- Keep the existing public-price chart and all other Market Data content unchanged.

## Technical details
- Reuse `GoldChart` and map database rows to its existing candle shape.
- Use the existing browser database client and authenticated read policy; no database, ingestion, dependency, AI, or publishing changes.
- Verify the preview on desktop and mobile, then check the latest build result.
