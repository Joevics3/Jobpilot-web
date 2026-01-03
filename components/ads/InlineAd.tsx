"use client";

import { useEffect, useRef, useState } from "react";

interface InlineAdProps {
  className?: string;
  style?: React.CSSProperties;
  mobileKey?: string;
  mobileHeight?: number;
  mobileWidth?: number;
  desktopKey?: string;
  desktopHeight?: number;
  desktopWidth?: number;
}

export default function InlineAd({
  className = "",
  style,
  mobileKey = '14a5e6902f465e9bb13c618ea719978c',
  mobileHeight = 250,
  mobileWidth = 300,
  desktopKey = '274521fef82795d545831fdba9457d36',
  desktopHeight = 90,
  desktopWidth = 728
}: InlineAdProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  // Generate unique ID for this ad instance to prevent conflicts
  const adId = useRef(`inline-ad-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`).current;

  useEffect(() => {
    setIsMounted(true);
    // Check if mobile on mount
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || scriptLoadedRef.current) return;

    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    scriptLoadedRef.current = true;

    // Determine if mobile
    const isMobileView = window.innerWidth < 768;
    const adKey = isMobileView ? mobileKey : desktopKey;
    const adHeight = isMobileView ? mobileHeight : desktopHeight;
    const adWidth = isMobileView ? mobileWidth : desktopWidth;

    // Clear container first
    container.innerHTML = '';

    // Create unique global variable name for this ad instance
    const uniqueVarName = `atOptions_${adId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Create the script element with unique global variable
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.innerHTML = `
      (function() {
        window.${uniqueVarName} = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${adHeight},
          'width' : ${adWidth},
          'params' : {}
        };
        window.atOptions = window.${uniqueVarName};
      })();
    `;
    document.head.appendChild(optionsScript);

    // Create invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    invokeScript.async = true;
    invokeScript.setAttribute('data-cfasync', 'false');
    container.appendChild(invokeScript);

    return () => {
      // Cleanup
      scriptLoadedRef.current = false;
      if (container) {
        container.innerHTML = '';
      }
      // Remove options script from head
      if (optionsScript.parentNode) {
        optionsScript.parentNode.removeChild(optionsScript);
      }
      // Clean up global variable
      if (typeof window !== 'undefined') {
        delete (window as any)[uniqueVarName];
      }
    };
  }, [isMounted, mobileKey, mobileHeight, mobileWidth, desktopKey, desktopHeight, desktopWidth, adId]);

  if (!isMounted) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{
          minHeight: `${mobileHeight}px`,
          width: '100%',
          ...style
        }}
      >
        {/* Placeholder for ad */}
      </div>
    );
  }

  return (
    <div
      className={`${className}`}
      style={{
        margin: '10px 0',
        ...style
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: 'block',
          textAlign: 'center'
        }}
      ></div>
    </div>
  );
}

