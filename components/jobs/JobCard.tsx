"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Bookmark, BookmarkCheck, FileCheck, Trash2, Calendar, ExternalLink, Briefcase } from 'lucide-react';
import { theme } from '@/lib/theme';

export interface JobUI {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  match: number;
  type?: string;
  calculatedTotal?: number;
  breakdown?: any;
  postedDate?: string;
  sector?: string;

  /** Used for search & filtering */
  description?: string;
}


interface JobCardProps {
  job: JobUI;
  savedJobs: string[];
  appliedJobs: string[];
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  onShowBreakdown: (job: JobUI) => void;
  showMatch?: boolean; // ✅ NEW: Control match score visibility
}

export default function JobCard({
  job,
  savedJobs,
  appliedJobs,
  onSave,
  onApply,
  onShowBreakdown,
  showMatch = true, // ✅ Default to true for backward compatibility
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
    <div
      className="bg-white rounded-2xl p-5 mb-5 shadow-sm hover:shadow-lg transition-all duration-300 border relative overflow-hidden group"
      style={{
        borderColor: theme.colors.border.DEFAULT,
        backgroundColor: theme.colors.card.DEFAULT,
      }}
    >
      {/* Top accent bar for high match scores */}
      {showMatch && matchScore >= 50 && (
        <div 
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: theme.colors.match.good }}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4">
          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-semibold mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors"
                  style={{ color: theme.colors.text.primary }}
                >
                  {job.title}
                </h3>
                <p
                  className="text-sm font-medium mb-2 flex items-center gap-1"
                  style={{ color: theme.colors.text.secondary }}
                >
                  <Briefcase size={14} />
                  {job.company}
                </p>
              </div>
              
              {/* Match Score - Compact Circle */}
              {showMatch && (
                <button
                  onClick={handleMatchClick}
                  className="flex-shrink-0 relative group/match"
                >
                  <div
                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      borderColor: matchColor,
                      backgroundColor: matchColor + '10',
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
                    className="text-[10px] font-medium absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/match:opacity-100 transition-opacity whitespace-nowrap"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    View Match
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: theme.colors.text.muted }} />
            <span
              className="text-sm truncate"
              style={{ color: theme.colors.text.secondary }}
            >
              {job.location}
            </span>
          </div>
          
          {/* Employment Type */}
          {job.type && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.primary.DEFAULT }} />
              <span
                className="text-sm"
                style={{ color: theme.colors.text.secondary }}
              >
                {job.type}
              </span>
            </div>
          )}
          
          {/* Salary */}
          {job.salary && 
           job.salary !== '0' && 
           job.salary !== '₦0' && 
           job.salary !== 'NGN0' && 
           job.salary !== 'NGN 0' && 
           job.salary !== '0.00' && 
           job.salary !== '$0' && 
           !job.salary.includes('₦0') && 
           !job.salary.includes('NGN0') && 
           !job.salary.includes('NGN 0') && 
           !job.salary.includes('$0') && 
           !job.salary.startsWith('0') && 
           !job.salary.includes(' 0') && 
           job.salary.trim() !== '' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: theme.colors.success }}>
                {job.salary}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Section: Date and Actions */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.colors.border.light }}>
          {/* Posted Date */}
          {job.postedDate && (
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: theme.colors.text.muted }} />
              <span
                className="text-xs"
                style={{ color: theme.colors.text.muted }}
              >
                {job.postedDate}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Save Button */}
            <button
              onClick={handleSave}
              className="p-2 rounded-lg border transition-all hover:scale-105"
              style={{
                borderColor: isSaved ? theme.colors.primary.DEFAULT : theme.colors.border.DEFAULT,
                backgroundColor: isSaved ? theme.colors.primary.DEFAULT + '10' : 'transparent',
              }}
              title={isSaved ? "Remove from saved" : "Save job"}
            >
              {isSaved ? (
                <BookmarkCheck size={18} style={{ color: theme.colors.primary.DEFAULT }} />
              ) : (
                <Bookmark size={18} style={{ color: theme.colors.text.secondary }} />
              )}
            </button>

            {/* Apply Button */}
            <Link href={`/jobs/${job.slug}`} className="block">
              <button
                onClick={handleApply}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:scale-105 ${
                  isApplied 
                    ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
                style={{
                  backgroundColor: isApplied ? '#FEE2E2' : theme.colors.primary.DEFAULT + '10',
                  borderColor: isApplied ? '#FCA5A5' : theme.colors.primary.DEFAULT + '30',
                  color: isApplied ? '#DC2626' : theme.colors.primary.DEFAULT,
                }}
              >
                {isApplied ? (
                  <>
                    <Trash2 size={16} />
                    Applied
                  </>
                ) : (
                  <>
                    <FileCheck size={16} />
                    Apply Now
                  </>
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}