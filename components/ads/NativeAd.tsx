"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/lib/theme";

interface NativeAdProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function NativeAd({ className = "", style }: NativeAdProps) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const optionsScriptRef = useRef<HTMLScriptElement | null>(null);
  const invokeScriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || scriptLoadedRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    scriptLoadedRef.current = true;

    // Clear container first
    container.innerHTML = '';

    // Create a unique ID for this ad instance
    const adId = `adsterra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Set atOptions for Adsterra native ad
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      window.atOptions_${adId} = {
        'key': '1e2aa34112d35cbf5a5c237b9d086461',
        'format': 'iframe',
        'height': 250,
        'width': 300,
        'params': {}
      };
      window.atOptions = window.atOptions_${adId};
    `;
    document.head.appendChild(optionsScript);
    optionsScriptRef.current = optionsScript;

    // Load the invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = 'https://www.highperformanceformat.com/1e2aa34112d35cbf5a5c237b9d086461/invoke.js';
    invokeScript.async = true;
    invokeScript.setAttribute('data-cfasync', 'false');
    container.appendChild(invokeScript);
    invokeScriptRef.current = invokeScript;

    return () => {
      // Cleanup
      scriptLoadedRef.current = false;
      if (optionsScriptRef.current && optionsScriptRef.current.parentNode) {
        optionsScriptRef.current.parentNode.removeChild(optionsScriptRef.current);
      }
      if (invokeScriptRef.current && invokeScriptRef.current.parentNode) {
        invokeScriptRef.current.parentNode.removeChild(invokeScriptRef.current);
      }
      if (container) {
        container.innerHTML = '';
      }
      // Clean up global variable
      delete (window as any)[`atOptions_${adId}`];
    };
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div 
        className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 ${className}`}
        style={{ 
          minHeight: '120px',
          ...style 
        }}
      >
        {/* Placeholder matching job card style */}
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 ${className}`}
      style={{ 
        borderColor: theme.colors.border.light,
        backgroundColor: theme.colors.card.DEFAULT,
        ...style 
      }}
    >
      <div 
        ref={containerRef}
        style={{ minHeight: '120px', width: '100%' }}
      ></div>
    </div>
  );
}
