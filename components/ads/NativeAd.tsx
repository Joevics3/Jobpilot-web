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
  const [containerId] = useState(() => `native-ad-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    const container = containerRef.current;
    
    // Set up atOptions for Adsterra native ad (similar to BannerAd but with format: 'native')
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      atOptions = {
        'key': '1e2aa34112d35cbf5a5c237b9d086461',
        'format': 'native',
        'container': '${containerId}',
        'params': {}
      };
    `;
    document.head.appendChild(optionsScript);

    // Load the invoke script into the container
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/1e2aa34112d35cbf5a5c237b9d086461/invoke.js';
    invokeScript.async = true;
    invokeScript.setAttribute('data-cfasync', 'false');
    container.appendChild(invokeScript);

    return () => {
      // Cleanup
      if (optionsScript.parentNode) {
        optionsScript.parentNode.removeChild(optionsScript);
      }
      if (container.contains(invokeScript)) {
        container.removeChild(invokeScript);
      }
    };
  }, [isMounted, containerId]);

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

