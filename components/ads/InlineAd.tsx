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
  mobileKey = '14a5e6902f465e9bb13c618ea719978c', // 300x250 mobile
  mobileHeight = 250,
  mobileWidth = 300,
  desktopKey = '274521fef82795d545831fdba9457d36', // 728x90 desktop
  desktopHeight = 90,
  desktopWidth = 728
}: InlineAdProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const optionsScriptRef = useRef<HTMLScriptElement | null>(null);
  const invokeScriptRef = useRef<HTMLScriptElement | null>(null);
  const adKeyRef = useRef<string>('');
  // Generate unique ID for this ad instance to prevent conflicts
  const adId = useRef(`inline-ad-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`).current;

  useEffect(() => {
    setIsMounted(true);
    // Check if mobile on mount
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      
      // Listen for resize events
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || scriptLoadedRef.current) return;

    const loadAd = () => {
      const container = containerRef.current;
      if (!container || typeof window === 'undefined') return;
      if (scriptLoadedRef.current) return;

      // Determine if mobile
      const isMobileView = window.innerWidth < 768;
      const adKey = isMobileView ? mobileKey : desktopKey;
      const adHeight = isMobileView ? mobileHeight : desktopHeight;
      const adWidth = isMobileView ? mobileWidth : desktopWidth;

      // Store ad key for cleanup
      adKeyRef.current = adKey;

      // Clear container first
      container.innerHTML = '';

      // Create the script element - same as BannerAd
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.id = `options-${adId}`;
      script.innerHTML = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${adHeight},
          'width' : ${adWidth},
          'params' : {}
        };
      `;
      document.head.appendChild(script);
      optionsScriptRef.current = script;

      // Create invoke script
      const invokeScript = document.createElement('script');
      invokeScript.id = `invoke-${adId}`;
      invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
      invokeScript.async = true;
      invokeScript.setAttribute('data-cfasync', 'false');
      container.appendChild(invokeScript);
      invokeScriptRef.current = invokeScript;

      scriptLoadedRef.current = true;
    };

    // Load immediately like BannerAd does
    loadAd();

    return () => {
      // Cleanup
      const container = containerRef.current;
      if (container) {
        container.innerHTML = '';
      }
      // Remove options script from head
      if (optionsScriptRef.current && optionsScriptRef.current.parentNode) {
        optionsScriptRef.current.parentNode.removeChild(optionsScriptRef.current);
      }
      scriptLoadedRef.current = false;
      optionsScriptRef.current = null;
      invokeScriptRef.current = null;
    };
  }, [isMounted, mobileKey, mobileHeight, mobileWidth, desktopKey, desktopHeight, desktopWidth, adId]);

  // Determine dimensions based on screen size
  const adHeight = isMobile ? mobileHeight : desktopHeight;
  const adWidth = isMobile ? mobileWidth : desktopWidth;

  if (!isMounted) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          minHeight: `${adHeight}px`,
          minWidth: isMobile ? '100%' : `${adWidth}px`,
          width: isMobile ? '100%' : 'auto',
          ...style
        }}
      >
        {/* Placeholder for ad - space reserved */}
      </div>
    );
  }

  return (
    <div
      className={`${className}`}
      style={{
        ...style
      }}
    >
      <div
        ref={containerRef}
        style={{
          display: 'block',
          textAlign: 'center',
          minHeight: `${adHeight}px`,
          minWidth: isMobile ? '100%' : `${adWidth}px`,
          width: isMobile ? '100%' : `${adWidth}px`,
          maxWidth: isMobile ? '100%' : `${adWidth}px`,
          margin: '0 auto',
          backgroundColor: 'transparent'
        }}
      ></div>
    </div>
  );
}

