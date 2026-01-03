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

    // Create the script element
    const script = document.createElement('script');
    script.innerHTML = `
      atOptions = {
        'key' : '${window.innerWidth < 768 ? mobileKey : desktopKey}',
        'format' : 'iframe',
        'height' : ${window.innerWidth < 768 ? mobileHeight : desktopHeight},
        'width' : ${window.innerWidth < 768 ? mobileWidth : desktopWidth},
        'params' : {}
      };
    `;

    // Create invoke script
    const invokeScript = document.createElement('script');
    invokeScript.src = `https://www.highperformanceformat.com/${window.innerWidth < 768 ? mobileKey : desktopKey}/invoke.js`;
    invokeScript.async = true;
    invokeScript.setAttribute('data-cfasync', 'false');

    // Append scripts to container
    container.appendChild(script);
    container.appendChild(invokeScript);

    return () => {
      // Cleanup
      scriptLoadedRef.current = false;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isMounted, mobileKey, mobileHeight, mobileWidth, desktopKey, desktopHeight, desktopWidth]);

  if (!isMounted) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{
          minHeight: window?.innerWidth < 768 ? mobileHeight : desktopHeight,
          width: window?.innerWidth < 768 ? mobileWidth : desktopWidth,
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

