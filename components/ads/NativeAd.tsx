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
  const scriptLoaded = useRef(false);
  const [containerId] = useState(() => `native-ad-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current || scriptLoaded.current) return;

    const script = document.createElement('script');
    script.src = 'https://pl28382150.effectivegatecpm.com/1e2aa34112d35cbf5a5c237b9d086461/invoke.js';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    
    script.onload = () => {
      scriptLoaded.current = true;
    };

    containerRef.current.appendChild(script);
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
        id={containerId} 
        style={{ minHeight: '120px', width: '100%' }}
      ></div>
    </div>
  );
}

