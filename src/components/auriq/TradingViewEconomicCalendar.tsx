import { useEffect, useRef } from "react";

interface TradingViewEconomicCalendarProps {
  locale: "th" | "en";
}

/**
 * TradingView's official iframe widget is the complete visual calendar.
 * Its contents are intentionally not read or reused by the AURIQ analysis engine.
 */
export function TradingViewEconomicCalendar({ locale }: TradingViewEconomicCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget h-full w-full";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.text = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale,
      importanceFilter: "-1,0,1",
      countryFilter: "us",
    });
    container.append(widget, script);

    return () => container.replaceChildren();
  }, [locale]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container h-[620px] min-h-[520px] w-full overflow-hidden"
    />
  );
}
