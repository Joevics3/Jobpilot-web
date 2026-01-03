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

    // Set the container ID as per Adsterra format
    container.id = 'container-1e2aa34112d35cbf5a5c237b9d086461';

    // Create and append the script tag
    const script = document.createElement('script');
    script.src = 'https://pl28382150.effectivegatecpm.com/1e2aa34112d35cbf5a5c237b9d086461/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    // Append script to container (as per official format)
    container.appendChild(script);

    return () => {
      // Cleanup
      scriptLoadedRef.current = false;
      if (container) {
        container.innerHTML = '';
      }
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
        minHeight: '120px',
        ...style
      }}
    >
      <div
        ref={containerRef}
        style={{
          minHeight: '120px',
          width: '100%',
          display: 'block'
        }}
      ></div>
    </div>
  );
}
