// 📁 app/tools/quiz/CompanyCard.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { companyToSlug } from '@/lib/quizCompanies';

// Deterministic colour from company name — same company always gets same colour
function getCompanyColor(name: string): { bg: string; text: string } {
  const colors = [
    { bg: '#1B4F9B', text: '#fff' },   // deep blue
    { bg: '#0A7E4A', text: '#fff' },   // forest green
    { bg: '#B91C1C', text: '#fff' },   // deep red
    { bg: '#7C3AED', text: '#fff' },   // violet
    { bg: '#B45309', text: '#fff' },   // amber brown
    { bg: '#0E7490', text: '#fff' },   // teal
    { bg: '#9D174D', text: '#fff' },   // rose
    { bg: '#1E3A5F', text: '#fff' },   // navy
    { bg: '#065F46', text: '#fff' },   // emerald
    { bg: '#6B21A8', text: '#fff' },   // purple
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Shorten company name for display — remove common suffixes
function getShortName(name: string): string {
  return name
    .replace(' Assessment Practice Test', '')
    .replace(' Recruitment Assessment Practice Test', '')
    .replace(' Recruitment Assessment', '')
    .replace(' Practice Test', '')
    .replace(' Assessment Test', '')
    .replace(' Aptitude Practice Test', '')
    .replace(' Ability Aptitude Practice Test', '')
    .trim();
}

// Get 1-2 initials
function getInitials(name: string): string {
  const short = getShortName(name);
  const words = short.split(' ').filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface CompanyCardProps {
  company: string;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const slug = companyToSlug(company);
  const { bg, text } = getCompanyColor(company);
  const initials = getInitials(company);
  const shortName = getShortName(company);
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/tools/quiz/${slug}`}
      className="group flex flex-col items-center gap-2.5 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: '1px solid #E5E7EB' }}
    >
      {/* Logo or initials avatar */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: imgError ? bg : undefined }}
      >
        {!imgError ? (
          <Image
            src={`/quiz-logos/${slug}.png`}
            alt={`${shortName} logo`}
            width={48}
            height={48}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="text-sm font-bold tracking-wide"
            style={{ color: text }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Company name */}
      <span
        className="text-xs font-semibold text-center text-gray-800 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2"
      >
        {shortName}
      </span>
    </Link>
  );
}