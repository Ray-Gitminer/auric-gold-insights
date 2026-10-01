# Dashboard data-state, menu, and translation corrections

## Scope
- Keep the current Dashboard layout, sidebar structure, routes, data, and integrations unchanged.
- Change only the three requested areas.

## Changes
1. **Data-source labels**
   - Treat the chart's MT5 candles independently from the sample instrument and analysis fixtures.
   - Show the chart as live/read-only only when connected MT5 candle data is actually being rendered.
   - Keep a translated “Sample data” label beside the sample price block, Signal Summary, Market Context, Bias, and Trend regardless of MT5 account state.
   - Keep Open as “—” and retain existing unavailable-data placeholders.

2. **AURIQ V1 sidebar**
   - Remove Portfolio and Journal entries from the visible navigation only.
   - Keep their route files, data, and supporting logic untouched.

3. **Dashboard localization**
   - Add Thai and English dictionary entries for all newly added Dashboard copy, including “Sample data”, “Awaiting data”, and “Coming soon”.
   - Replace hardcoded Dashboard labels and descriptions with the existing translation function.
   - Preserve technical terms such as XAUUSD, AI, MTF, MPGP, BUY, and SELL where applicable.

## Validation
- Check the generated build status after edits.
- Open the live preview at 1440px desktop and 390px mobile.
- Verify no horizontal text overflow, the chart remains visible, and mobile card order is chart → summaries → feature list → modules/process.
- Report exactly what was visually checked and any remaining limitation.
