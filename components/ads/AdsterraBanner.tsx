'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  type: 'mobile' | 'desktop';
  slotId: string; // UNIQUE per insertion
};

export default function AdsterraBanner({ type, slotId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const adHeight = type === 'mobile' ? 250 : 90;
  const adWidth = type === 'mobile' ? 300 : 728;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    // Clear container
    containerRef.current.innerHTML = '';

    // IMPORTANT: reset global atOptions
    // @ts-ignore
    delete (window as any).atOptions;

    // Create config script
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';

    if (type === 'mobile') {
      configScript.innerHTML = `
        window.atOptions = {
          key: '14a5e6902f465e9bb13c618ea719978c',
          format: 'iframe',
          height: 250,
          width: 300,
          params: {}
        };
      `;
    } else {
      configScript.innerHTML = `
        window.atOptions = {
          key: '274521fef82795d545831fdba9457d36',
          format: 'iframe',
          height: 90,
          width: 728,
          params: {}
        };
      `;
    }

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.async = true;
    invokeScript.src =
      type === 'mobile'
        ? 'https://www.highperformanceformat.com/14a5e6902f465e9bb13c618ea719978c/invoke.js'
        : 'https://www.highperformanceformat.com/274521fef82795d545831fdba9457d36/invoke.js';

    // Delay injection (CRITICAL)
    setTimeout(() => {
      containerRef.current?.appendChild(configScript);
      containerRef.current?.appendChild(invokeScript);
    }, 50);
  }, [isMounted, type, slotId]);

  if (!isMounted) {
    return (
      <div
        id={`ad-${slotId}`}
        style={{
          minHeight: `${adHeight}px`,
          width: '100%',
          maxWidth: `${adWidth}px`,
          margin: '0 auto',
          textAlign: 'center'
        }}
      >
        {/* Placeholder for ad */}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id={`ad-${slotId}`}
      style={{
        minHeight: `${adHeight}px`,
        width: '100%',
        maxWidth: `${adWidth}px`,
        margin: '0 auto',
        textAlign: 'center'
      }}
    />
  );
}
