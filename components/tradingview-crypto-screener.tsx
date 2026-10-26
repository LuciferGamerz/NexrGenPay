"use client";

import { useEffect, useRef } from "react";

export function TradingViewCryptoScreener() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;
    initializedRef.current = true;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      width: "100%",
      height: 680,
      defaultColumn: "overview",
      defaultScreen: "general",
      market: "crypto",
      showToolbar: true,
      colorTheme: "dark",
      locale: "en",
      isTransparent: true
    });
    container.appendChild(script);
    container.appendChild(script);
  }, []);

  return (
    <div className="tradingview-widget-container overflow-hidden rounded-xl" ref={containerRef}>
      <div className="tradingview-widget-container__widget flex min-h-[680px] items-center justify-center text-sm text-[#928b80]">
        Loading cryptocurrency market data…
      </div>
      <div className="px-3 pb-2 text-right text-[10px] text-[#81796c]">
        Market data and screener provided by{" "}
        <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#c8aa68] hover:underline">
          TradingView
        </a>
      </div>
    </div>
  );
}
