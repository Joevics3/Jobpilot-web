"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Bookmark, BookmarkCheck, FileCheck, Trash2 } from 'lucide-react';
import { theme } from '@/lib/theme';

export interface JobUI {
  id: string;
  slug: string; // ✅ Added slug property
  title: string;
  company: string;
  location: string;
  salary: string;
  match: number;
  type?: string;
  calculatedTotal?: number;
  breakdown?: any;
}

interface JobCardProps {
  job: JobUI;
  savedJobs: string[];
  appliedJobs: string[];
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  onShowBreakdown: (job: JobUI) => void;
}

export default function JobCard({
  job,
  savedJobs,
  appliedJobs,
  onSave,
  onApply,
  onShowBreakdown,
}: JobCardProps) {
  const matchScore = job.calculatedTotal || job.match || 0;
  
  const getMatchColor = (match: number) => {
    if (match >= 50) return theme.colors.match.good;
    if (match >= 31) return theme.colors.match.average;
    return theme.colors.match.bad;
  };

  const matchColor = useMemo(() => getMatchColor(matchScore), [matchScore]);
  const isSaved = useMemo(() => savedJobs.includes(job.id), [savedJobs, job.id]);
  const isApplied = useMemo(() => appliedJobs.includes(job.id), [appliedJobs, job.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(job.id);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onApply(job.id);
  };

  const handleMatchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShowBreakdown(job);
  };

  return (
    // ✅ Changed from job.id to job.slug
    <Link href={`/jobs/${job.slug}`} className="block">
      <div
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
        style={{
          borderColor: theme.colors.border.light,
          backgroundColor: theme.colors.card.DEFAULT,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left: Job Info */}
          <div className="flex-1 min-w-0">
            <h3
              className="text-base font-semibold mb-1 truncate"
              style={{ color: theme.colors.text.primary }}
            >
              {job.title}
            </h3>
            <p
              className="text-sm font-medium mb-3"
              style={{ color: theme.colors.text.secondary }}
            >
              {job.company}
            </p>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: theme.colors.text.secondary }} />
                <span
                  className="text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {job.location}
                </span>
              </div>
              {job.salary && (
                <span
                  className="text-xs"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {job.salary}
                </span>
              )}
            </div>
          </div>

          {/* Right: Match Score & Actions */}
          <div className="flex flex-col items-center gap-3">
            {/* Match Score Circle */}
            <button
              onClick={handleMatchClick}
              className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: matchColor,
                  backgroundColor: theme.colors.background.muted,
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: matchColor }}
                >
                  {matchScore}%
                </span>
              </div>
              <span
                className="text-[10px] font-medium mt-1"
                style={{ color: theme.colors.text.secondary }}
              >
                Match
              </span>
            </button>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isSaved ? (
                  <BookmarkCheck size={20} style={{ color: theme.colors.primary.DEFAULT }} />
                ) : (
                  <Bookmark size={20} style={{ color: theme.colors.text.secondary }} />
                )}
              </button>

              <button
                onClick={handleApply}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isApplied ? (
                  <Trash2 size={20} style={{ color: theme.colors.text.secondary }} />
                ) : (
                  <FileCheck size={20} style={{ color: theme.colors.text.secondary }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}