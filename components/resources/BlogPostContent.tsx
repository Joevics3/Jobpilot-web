'use client';

import { useEffect, useRef, useState } from 'react';
import BannerAd from '@/components/ads/BannerAd';

interface BlogPostContentProps {
  content: string;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [midAdPosition, setMidAdPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!contentRef.current || midAdPosition !== null) return;

    // Find paragraphs and determine where to insert ad (after 2nd paragraph)
    const paragraphs = contentRef.current.querySelectorAll('p');
    if (paragraphs.length >= 2) {
      const secondParagraph = paragraphs[1];
      const position = secondParagraph.getBoundingClientRect().top + window.scrollY;
      setMidAdPosition(position);
    }
  }, [midAdPosition]);

  return (
    <div ref={contentRef}>
      <div
        className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-gray-700 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-lg prose-img:shadow-md prose-hr:border-gray-200"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      {/* Mid-content Banner Ad - Inserted after content loads */}
      {midAdPosition !== null && (
        <MidContentAd />
      )}
    </div>
  );
}

function MidContentAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adRef.current) return;

    // Find 2nd paragraph and insert ad after it
    const contentDiv = adRef.current.parentElement?.querySelector('.prose');
    if (!contentDiv) return;

    const paragraphs = contentDiv.querySelectorAll('p');
    if (paragraphs.length >= 2) {
      const secondParagraph = paragraphs[1];
      const adContainer = adRef.current;
      
      if (secondParagraph.parentNode && !adContainer.parentElement) {
        secondParagraph.parentNode.insertBefore(adContainer, secondParagraph.nextSibling);
      }
    }
  }, []);

  return (
    <div ref={adRef}>
      <BannerAd />
    </div>
  );
}








