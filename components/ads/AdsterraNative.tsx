'use client';

import { useEffect, useRef, useState } from 'react';

export default function AdsterraNative({ slotId }: { slotId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || loaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loaded) {
            setLoaded(true);

            // Inject Adsterra Native script
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.setAttribute('data-cfasync', 'false');
            script.src =
              'https://pl28382150.effectivegatecpm.com/1e2aa34112d35cbf5a5c237b9d086461/invoke.js';

            containerRef.current?.appendChild(script);

            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '150px', // preload slightly before view
        threshold: 0.1,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [loaded]);

  return (
    <div
      ref={containerRef}
      id="container-1e2aa34112d35cbf5a5c237b9d086461"
      className="native-ad my-6 min-h-[120px]"
    />
  );
}
