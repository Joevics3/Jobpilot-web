"use client";

import { useEffect, useRef, useState } from "react";

interface BannerAdProps {
  className?: string;
  style?: React.CSSProperties;
  mobileHeight?: number;
  mobileWidth?: number;
  desktopHeight?: number;
  desktopWidth?: number;
}

export default function BannerAd({
  className = "",
  style,
  mobileHeight = 50,
  mobileWidth = 320,
  desktopHeight = 90,
  desktopWidth = 728
}: BannerAdProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileScriptLoaded = useRef(false);
  const desktopScriptLoaded = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    // Load mobile ad
    const loadMobileAd = () => {
      if (mobileScriptLoaded.current || !mobileContainerRef.current) return;
      
      const isMobile = window.innerWidth < 768;
      if (!isMobile) return;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : 'ba9eda152cc4aabce02876418a7aaaa6',
          'format' : 'iframe',
          'height' : ${mobileHeight},
          'width' : ${mobileWidth},
          'params' : {}
        };
      `;
      document.head.appendChild(script);

      const invokeScript = document.createElement('script');
      invokeScript.src = 'https://www.highperformanceformat.com/ba9eda152cc4aabce02876418a7aaaa6/invoke.js';
      invokeScript.async = true;
      mobileContainerRef.current.appendChild(invokeScript);
      mobileScriptLoaded.current = true;
    };

    // Load desktop ad
    const loadDesktopAd = () => {
      if (desktopScriptLoaded.current || !desktopContainerRef.current || typeof window === 'undefined') return;
      
      const isDesktop = window.innerWidth >= 768;
      if (!isDesktop) return;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : '274521fef82795d545831fdba9457d36',
          'format' : 'iframe',
          'height' : ${desktopHeight},
          'width' : ${desktopWidth},
          'params' : {}
        };
      `;
      document.head.appendChild(script);

      const invokeScript = document.createElement('script');
      invokeScript.src = 'https://www.highperformanceformat.com/274521fef82795d545831fdba9457d36/invoke.js';
      invokeScript.async = true;
      desktopContainerRef.current.appendChild(invokeScript);
      desktopScriptLoaded.current = true;
    };

    // Load ads based on screen size
    loadMobileAd();
    loadDesktopAd();

    // Handle resize
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 768) {
        loadMobileAd();
      } else {
        loadDesktopAd();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMounted, mobileHeight, mobileWidth, desktopHeight, desktopWidth]);

  if (!isMounted) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ 
          minHeight: `${mobileHeight}px`,
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
        ...style
      }}
    >
      {/* Responsive Banner: Mobile 320x50, Desktop 728x90 */}
      <div className="w-full max-w-full overflow-hidden">
        {/* Mobile Banner (320x50) */}
        <div className="block md:hidden">
          <div
            ref={mobileContainerRef}
            style={{
              minHeight: `${mobileHeight}px`,
              width: '100%',
              maxWidth: `${mobileWidth}px`,
              margin: '0 auto',
              textAlign: 'center'
            }}
          ></div>
        </div>

        {/* Desktop Banner */}
        <div className="hidden md:block">
          <div
            ref={desktopContainerRef}
            style={{
              minHeight: `${desktopHeight}px`,
              width: '100%',
              maxWidth: `${desktopWidth}px`,
              margin: '0 auto',
              textAlign: 'center'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

