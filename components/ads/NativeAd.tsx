"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/lib/theme";

interface NativeAdProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function NativeAd({ className = "", style }: NativeAdProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [containerId] = useState(() => `native-ad-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const optionsScriptRef = useRef<HTMLScriptElement | null>(null);
  const invokeScriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || scriptLoadedRef.current) return;

    const loadAd = () => {
      const container = containerRef.current;
      if (!container) return;

      scriptLoadedRef.current = true;
      container.innerHTML = '';

      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.innerHTML = `
        atOptions = {
          'key': '1e2aa34112d35cbf5a5c237b9d086461',
          'format': 'iframe',
          'height': 250,
          'width': 300,
          'params': {}
        };
      `;
      document.head.appendChild(optionsScript);
      optionsScriptRef.current = optionsScript;

      setTimeout(() => {
        const invokeScript = document.createElement('script');
        invokeScript.src = 'https://www.highperformanceformat.com/1e2aa34112d35cbf5a5c237b9d086461/invoke.js';
        invokeScript.async = true;
        invokeScript.setAttribute('data-cfasync', 'false');
        container.appendChild(invokeScript);
        invokeScriptRef.current = invokeScript;
      }, 50);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(loadAd);
    });

    return () => {
      // Cleanup
      scriptLoadedRef.current = false;
      if (optionsScriptRef.current && optionsScriptRef.current.parentNode) {
        optionsScriptRef.current.parentNode.removeChild(optionsScriptRef.current);
      }
      if (invokeScriptRef.current && invokeScriptRef.current.parentNode) {
        invokeScriptRef.current.parentNode.removeChild(invokeScriptRef.current);
      }
      const container = containerRef.current;
      if (container) {
        container.innerHTML = '';
      }
      // Clean up global variable
      delete (window as any)[`atOptions_${containerId}`];
    };
  }, [isMounted, containerId]);

  if (!isMounted) {
    return (
      <div
        className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 ${className}`}
        style={{
          minHeight: '250px',
          ...style
        }}
      >
        {/* Placeholder matching native ad style */}
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 ${className}`}
      style={{
        borderColor: theme.colors.border.light,
        backgroundColor: theme.colors.card.DEFAULT,
        minHeight: '250px',
        ...style
      }}
    >
      <div
        ref={containerRef}
        id={containerId}
        style={{
          minHeight: '250px',
          width: '100%',
          display: 'block'
        }}
      ></div>
    </div>
  );
}
