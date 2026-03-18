"use client";

import { useEffect, useRef } from 'react';

interface AdUnitProps {
  slot: string;
  format?: string;
  layout?: string;
  layoutKey?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * AdUnit — reusable Google AdSense component
 *
 * Place this file at: components/ads/AdUnit.tsx
 *
 * Requirements:
 *   - Add the AdSense <script> tag ONCE in app/layout.tsx <head>:
 *     <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1119289641389825" crossOrigin="anonymous" />
 *   - Never add the script inside this component.
 *   - Each placement on the same page MUST use a unique slot ID.
 */
export default function AdUnit({
  slot,
  format = 'auto',
  layout,
  layoutKey,
  style,
  className,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ins = adRef.current;
    if (!ins) return;

    // If this ins element was already filled (e.g. back-navigation or
    // hot-reload), skip — pushing again causes a blank/broken ad.
    if (ins.getAttribute('data-adsbygoogle-status')) return;

    const pushAd = () => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        // swallow — happens if script not yet parsed
      }
    };

    // If adsbygoogle script is already loaded and ready, push immediately.
    // Otherwise wait up to 3 s for it to load, then push.
    if (typeof (window as any).adsbygoogle !== 'undefined') {
      pushAd();
    } else {
      let waited = 0;
      const interval = setInterval(() => {
        waited += 200;
        if (typeof (window as any).adsbygoogle !== 'undefined') {
          clearInterval(interval);
          pushAd();
        } else if (waited >= 3000) {
          clearInterval(interval);
          // Last-ditch attempt — push anyway; AdSense may queue it internally
          pushAd();
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [slot]); // re-run if slot changes (i.e. navigating between job pages)

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle${className ? ` ${className}` : ''}`}
      style={{
        display: 'block',
        textAlign: layout === 'in-article' ? 'center' : undefined,
        ...style,
      }}
      data-ad-client="ca-pub-1119289641389825"
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layout    ? { 'data-ad-layout':     layout    } : {})}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
      {...(format === 'auto' ? { 'data-full-width-responsive': 'true' } : {})}
    />
  );
}