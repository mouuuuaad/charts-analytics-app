'use client';

import React, { useEffect, useRef, memo } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewAdvancedChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
  height?: number | string;
  width?: number | string;
  containerIdSuffix?: string;
}

const TradingViewAdvancedChart: React.FC<TradingViewAdvancedChartProps> = ({
  symbol = 'NASDAQ:AAPL',
  interval = 'D',
  theme = 'light',
  autosize = true,
  height = '100%', // Default to 100% to fill container
  width = '100%',  // Default to 100% to fill container
  containerIdSuffix = 'adv_chart',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptAddedRef = useRef(false);
  const widgetInstanceRef = useRef<any>(null);

  const tvContainerId = `tradingview_widget_${containerIdSuffix}_${Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    const currentContainerRef = containerRef.current;
    let localWidgetInstance: any = null;

    const initializeWidget = () => {
      if (!currentContainerRef || typeof window.TradingView === 'undefined' || typeof window.TradingView.widget !== 'function') {
        // If TradingView is not loaded or container is not ready, retry shortly.
        // This can happen if script is still loading.
        setTimeout(initializeWidget, 100);
        return;
      }

      // Clear previous widget if any, before creating a new one
      if (currentContainerRef.firstChild) {
        currentContainerRef.innerHTML = '';
      }
      
      const widgetOptions: any = {
        symbol: symbol,
        interval: interval,
        theme: theme,
        style: '1',
        locale: 'en',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        container_id: tvContainerId,
      };

      if (autosize) {
        widgetOptions.autosize = true;
      } else {
        widgetOptions.width = width;
        widgetOptions.height = height;
      }
      
      localWidgetInstance = new window.TradingView.widget(widgetOptions);
      widgetInstanceRef.current = localWidgetInstance;
    };

    const loadScript = () => {
      if (scriptAddedRef.current && typeof window.TradingView !== 'undefined' && typeof window.TradingView.widget === 'function') {
        initializeWidget(); // Script loaded previously, TradingView object exists
        return;
      }
      
      if (document.getElementById('tradingview-widget-script-tvjs')) {
         // Script tag already exists, TradingView object might not be ready yet
        if (typeof window.TradingView !== 'undefined' && typeof window.TradingView.widget === 'function') {
          initializeWidget();
        } else {
          // Wait for the existing script to load
          const existingScript = document.getElementById('tradingview-widget-script-tvjs');
          if (existingScript) {
            existingScript.addEventListener('load', initializeWidget, { once: true });
          }
        }
        scriptAddedRef.current = true; // Mark as "added" or "attempted to use existing"
        return;
      }

      const script = document.createElement('script');
      script.id = 'tradingview-widget-script-tvjs';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptAddedRef.current = true;
        initializeWidget();
      };
      script.onerror = () => {
        console.error("TradingView script failed to load.");
      };
      document.head.appendChild(script);
    };

    if (currentContainerRef) {
       loadScript();
    }

    return () => {
      // Cleanup: remove the specific widget instance if the TradingView library provides a method.
      // For simple script embeds, removing the container's children is often sufficient.
      if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
        // widgetInstanceRef.current.remove(); // This method is not standard for all widgets
      }
      if (currentContainerRef) {
        currentContainerRef.innerHTML = ''; // Clear the container
      }
      widgetInstanceRef.current = null;
      // Note: The tv.js script itself is not removed from the head as it might be used by other instances.
    };
  }, [symbol, interval, theme, autosize, height, width, tvContainerId]); // Ensure re-render if these props change

  return (
    // The parent of this div must have explicit height for autosize to work correctly.
    // The 'height' and 'width' props of this component are primarily for the widget config if autosize=false.
    // For autosize=true, this div will expand to its parent.
    <div ref={containerRef} id={tvContainerId} style={{ width: '100%', height: '100%' }}>
      {/* TradingView widget will be rendered here */}
    </div>
  );
};

export default memo(TradingViewAdvancedChart);