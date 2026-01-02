"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, DollarSign, Calendar, Briefcase, Bookmark, BookmarkCheck, FileCheck, Mail, Phone, ExternalLink, ArrowLeft, Clock, Building, Target, Award, Copy, Sparkles } from 'lucide-react';
import { theme } from '@/lib/theme';
import Script from 'next/script';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';
import UpgradeModal from '@/components/jobs/UpgradeModal';
import { useCredits } from '@/hooks/useCredits';
import BannerAd from '@/components/ads/BannerAd';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [matchBreakdown, setMatchBreakdown] = useState<any>(null);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeErrorType, setUpgradeErrorType] = useState<'PREMIUM_REQUIRED' | 'QUOTA_EXCEEDED' | 'INSUFFICIENT_CREDITS' | null>(null);
  const [upgradeErrorData, setUpgradeErrorData] = useState<any>(null);
  const { balance, hasEnoughCredits, loadCreditBalance } = useCredits();

  useEffect(() => {
    checkAuth();
    loadSavedStatus();
    loadAppliedStatus();
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (user) {
      fetchUserOnboardingData();
    }
  }, [user]);

  useEffect(() => {
    if (job && user && userOnboardingData) {
      calculateMatchScore();
    } else if (job && (!user || !userOnboardingData)) {
      // If no user or onboarding data, match score is 0
      setMatchScore(0);
      setMatchBreakdown(null);
    }
  }, [job, user, userOnboardingData]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }
  };

  const fetchUserOnboardingData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding data:', error);
        return;
      }

      if (data) {
        setUserOnboardingData({
          target_roles: data.target_roles || [],
          cv_skills: data.cv_skills || [],
          preferred_locations: data.preferred_locations || [],
          experience_level: data.experience_level || null,
          salary_min: data.salary_min || null,
          salary_max: data.salary_max || null,
          job_type: data.job_type || null,
          sector: data.sector || null,
        });
      } else {
        setUserOnboardingData({});
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      setUserOnboardingData({});
    }
  };

  const calculateMatchScore = () => {
    if (!job || !user || !userOnboardingData) {
      setMatchScore(0);
      return;
    }

    try {
      // Check cache first
      const matchCache = matchCacheService.loadMatchCache(user.id);
      const cachedMatch = matchCache[job.id];

      let matchResult;
      if (cachedMatch) {
        // Use cached match
        matchResult = {
          score: cachedMatch.score,
          breakdown: cachedMatch.breakdown,
          computedAt: cachedMatch.cachedAt,
        };
      } else {
        // Calculate new match
        const jobRow: JobRow = {
          role: job.role || job.title,
          related_roles: job.related_roles,
          ai_enhanced_roles: job.ai_enhanced_roles,
          skills_required: job.skills_required,
          ai_enhanced_skills: job.ai_enhanced_skills,
          location: job.location,
          experience_level: job.experience_level,
          salary_range: job.salary_range,
          employment_type: job.employment_type,
          sector: job.sector,
        };

        matchResult = scoreJob(jobRow, userOnboardingData);

        // Store in cache
        const updatedCache = { ...matchCache };
        updatedCache[job.id] = {
          score: matchResult.score,
          breakdown: matchResult.breakdown,
          cachedAt: matchResult.computedAt,
        };
        matchCacheService.saveMatchCache(user.id, updatedCache);
      }

      // Calculate total from breakdown (same logic as matchEngine)
      const rsCapped = Math.min(
        80,
        matchResult.breakdown.rolesScore +
        matchResult.breakdown.skillsScore +
        matchResult.breakdown.sectorScore
      );
      const calculatedTotal = Math.round(
        rsCapped +
        matchResult.breakdown.locationScore +
        matchResult.breakdown.experienceScore +
        matchResult.breakdown.salaryScore +
        matchResult.breakdown.typeScore
      );

      setMatchScore(Math.max(0, Math.min(100, calculatedTotal)));
      setMatchBreakdown(matchResult.breakdown);
    } catch (error) {
      console.error('Error calculating match score:', error);
      setMatchScore(0);
      setMatchBreakdown(null);
    }
  };

  const fetchJob = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedStatus = () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    if (saved) {
      try {
        const savedArray = JSON.parse(saved);
        setSaved(savedArray.includes(jobId));
      } catch (e) {
        console.error('Error loading saved status:', e);
      }
    }
  };

  const loadAppliedStatus = () => {
    if (typeof window === 'undefined') return;
    const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
    if (applied) {
      try {
        const appliedArray = JSON.parse(applied);
        setApplied(appliedArray.includes(jobId));
      } catch (e) {
        console.error('Error loading applied status:', e);
      }
    }
  };

  const handleSave = () => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    let savedArray: string[] = [];
    
    if (saved) {
      try {
        savedArray = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved jobs:', e);
      }
    }

    const newSaved = savedArray.includes(jobId)
      ? savedArray.filter(id => id !== jobId)
      : [...savedArray, jobId];
    
    localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(newSaved));
    setSaved(newSaved.includes(jobId));
  };

  const handleApply = () => {
    // Show the application modal
    setApplicationModalOpen(true);
  };

  const handleAutoApply = async () => {
    if (!job || !user) return;

    const application = job.application || {};
    const email = application.email || job.application_email;
    
    if (!email) {
      // Should not happen if button is conditionally rendered, but safety check
      return;
    }

    // Step 1: Check if user has enough credits (2 credits per application)
    const AUTO_APPLY_CREDITS_COST = 2;
    
    try {
      // Refresh credit balance to get latest
      await loadCreditBalance();

      if (!hasEnoughCredits(AUTO_APPLY_CREDITS_COST)) {
        // User doesn't have enough credits - show upgrade modal
        setUpgradeErrorType('INSUFFICIENT_CREDITS');
        setUpgradeErrorData({
          message: `Auto-apply requires ${AUTO_APPLY_CREDITS_COST} credits. You have ${balance} credit${balance !== 1 ? 's' : ''}. Please purchase credits to continue.`,
          requiredCredits: AUTO_APPLY_CREDITS_COST,
          currentCredits: balance,
        });
        setUpgradeModalOpen(true);
        return;
      }

      // Premium check passed - trigger application in background (fire-and-forget)
      // Mark as applied immediately so user can continue browsing
      const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
      let appliedArray: string[] = [];
      
      if (applied) {
        try {
          appliedArray = JSON.parse(applied);
        } catch (e) {
          console.error('Error parsing applied jobs:', e);
        }
      }

      if (!appliedArray.includes(jobId)) {
        const updatedApplied = [...appliedArray, jobId];
        localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(updatedApplied));
        setApplied(true);

        // Remove from saved jobs if it was saved
        const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
        if (saved) {
          try {
            const savedArray: string[] = JSON.parse(saved);
            if (savedArray.includes(jobId)) {
              const updatedSaved = savedArray.filter(id => id !== jobId);
              localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(updatedSaved));
              setSaved(false);
            }
          } catch (e) {
            console.error('Error updating saved jobs:', e);
          }
        }
      }

      // Trigger application in background - don't wait for response
      fetch('/api/jobs/manual-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          jobId: jobId,
        }),
      }).catch((error) => {
        // Silently log errors - backend will handle retries
        console.error('Background application error (will be retried):', error);
      });

      // User can continue browsing - application is processing in background
    } catch (error: any) {
      console.error('Error in auto apply:', error);
      // Only show error if it's a premium/quota issue (already handled above)
      // Other errors will be handled by backend retry mechanism
    }
  };

  const handleApplicationAction = async (type: 'email' | 'phone' | 'link') => {
    if (!job || !user) return;

    // For email applications, use mailto: link (auto-apply is now handled by separate button)
    if (type === 'email') {
      const application = job.application || {};
      const email = application.email || job.application_email;
      
      if (email) {
        // Open mailto: link for manual email application
        const targetUrl = email.startsWith('mailto:') ? email : `mailto:${email}`;
        window.location.href = targetUrl;
        return;
      }
    }

    // For phone and link, use existing behavior
    try {
      // Mark the job as applied
      const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
      let appliedArray: string[] = [];
      
      if (applied) {
        try {
          appliedArray = JSON.parse(applied);
        } catch (e) {
          console.error('Error parsing applied jobs:', e);
        }
      }

      if (!appliedArray.includes(jobId)) {
        const updatedApplied = [...appliedArray, jobId];
        localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(updatedApplied));
        setApplied(true);

        // Remove from saved jobs if it was saved
        const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
        if (saved) {
          try {
            const savedArray: string[] = JSON.parse(saved);
            if (savedArray.includes(jobId)) {
              const updatedSaved = savedArray.filter(id => id !== jobId);
              localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(updatedSaved));
              setSaved(false);
            }
          } catch (e) {
            console.error('Error updating saved jobs:', e);
          }
        }
      }

      // Open the application method
      const application = job.application || {};
      
      switch (type) {
        case 'phone':
          const phone = application.phone || job.application_phone;
          if (phone) {
            const targetUrl = phone.startsWith('tel:') ? phone : `tel:${phone}`;
            window.location.href = targetUrl;
          }
          break;
        case 'link':
          const link = application.link || application.url || job.application_url;
          if (link) {
            window.open(link, '_blank');
          }
          break;
      }

    } catch (error) {
      console.error('Error opening application:', error);
    } finally {
      setApplicationModalOpen(false);
    }
  };

  const handleCopyToClipboard = async (type: 'email' | 'phone' | 'link') => {
    if (!job) return;

    try {
      const application = job.application || {};
      let textToCopy = '';
      
      switch (type) {
        case 'email':
          textToCopy = (application.email || job.application_email || '').replace('mailto:', '');
          break;
        case 'phone':
          textToCopy = (application.phone || job.application_phone || '').replace('tel:', '');
          break;
        case 'link':
          textToCopy = application.link || application.url || job.application_url || '';
          break;
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        // You could add a toast notification here
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
        <p className="text-lg font-semibold mb-2 text-gray-900">
          Job not found
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-lg font-medium bg-primary text-white"
          style={{
            backgroundColor: theme.colors.primary.DEFAULT,
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // Match score is now calculated and stored in state
  const getMatchColor = (match: number) => {
    if (match >= 50) return theme.colors.match.good;
    if (match >= 31) return theme.colors.match.average;
    return theme.colors.match.bad;
  };
  const matchColor = getMatchColor(matchScore);

  // Helper functions to format data that might be objects or strings
  const getCompanyName = () => {
    if (!job.company) return 'Unknown Company';
    if (typeof job.company === 'string') return job.company;
    if (typeof job.company === 'object' && job.company.name) return job.company.name;
    return 'Unknown Company';
  };

  const getLocationString = () => {
    if (!job.location) return 'Not specified';
    if (typeof job.location === 'string') return job.location;
    if (typeof job.location === 'object') {
      if (job.location.remote) return 'Remote';
      const parts = [job.location.city, job.location.state, job.location.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Not specified';
    }
    return 'Not specified';
  };

  const getSalaryString = () => {
    if (!job.salary && !job.salary_range) return null;
    if (typeof job.salary === 'string') return job.salary;
    if (job.salary_range && typeof job.salary_range === 'object') {
      const sal = job.salary_range;
      if (sal.min !== null && sal.max !== null && sal.currency) {
        return `${sal.currency} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()} ${sal.period || ''}`.trim();
      }
    }
    return null;
  };

  // Generate JSON-LD structured data
  const generateStructuredData = () => {
    const companyName = getCompanyName();
    const locationStr = getLocationString();
    const salaryStr = getSalaryString();
    
    const structuredData: any = {
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      "title": job.title || 'Job',
      "description": typeof job.description === 'string' ? job.description : '',
      "identifier": {
        "@type": "PropertyValue",
        "name": "JobMeter",
        "value": job.id
      },
      "datePosted": job.posted_date || job.created_at || new Date().toISOString(),
      ...(job.deadline && { "validThrough": job.deadline }),
      ...(job.employment_type || job.type ? { "employmentType": job.employment_type || job.type } : {}),
      "hiringOrganization": {
        "@type": "Organization",
        "name": companyName,
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": typeof job.location === 'object' ? (job.location.city || '') : '',
          "addressRegion": typeof job.location === 'object' ? (job.location.state || '') : '',
          "addressCountry": typeof job.location === 'object' ? (job.location.country || '') : '',
        }
      },
    };

    if (locationStr === 'Remote' || (typeof job.location === 'object' && job.location?.remote)) {
      structuredData.jobLocationType = "TELECOMMUTE";
    }

    if (salaryStr && job.salary_range) {
      structuredData.baseSalary = {
        "@type": "MonetaryAmount",
        "currency": job.salary_range.currency || 'USD',
        "value": {
          "@type": "QuantitativeValue",
          "minValue": job.salary_range.min,
          "maxValue": job.salary_range.max,
          "unitText": (job.salary_range.period || 'YEAR').toUpperCase()
        }
      };
    }

    if (job.experience_level) {
      structuredData.experienceRequirements = {
        "@type": "OccupationalExperienceRequirements",
        "monthsOfExperience": getExperienceMonths(job.experience_level)
      };
    }

    if (job.skills_required || job.skills) {
      const skillsArray = job.skills_required || job.skills || [];
      if (Array.isArray(skillsArray) && skillsArray.length > 0) {
        structuredData.skills = skillsArray.join(', ');
      }
    }

    const applicationUrl = job.application_url || job.application?.url || job.application?.link;
    if (applicationUrl) {
      structuredData.url = applicationUrl;
    }

    return structuredData;
  };

  const getExperienceMonths = (level: string) => {
    const levels: Record<string, number> = {
      'Entry Level': 0,
      'Junior': 12,
      'Mid-level': 36,
      'Senior': 60,
      'Lead': 84,
      'Executive': 120
    };
    return levels[level] || 0;
  };

  return (
    <>
      {job && (
        <Script
          id="job-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData()),
          }}
        />
      )}
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <div
        className="relative pt-12 pb-8 px-6"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.dark} 100%)`,
        }}
      >
        <button
          onClick={() => router.back()}
          className="mb-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <ArrowLeft size={20} style={{ color: theme.colors.text.light }} />
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: theme.colors.text.light }}
            >
              {job.title || 'Untitled Job'}
            </h1>
            <p
              className="text-lg font-medium mb-4 text-white/90"
            >
              {getCompanyName()}
            </p>
            
            {/* Match Score Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                style={{
                  borderColor: theme.colors.text.light,
                  backgroundColor: 'transparent',
                }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: theme.colors.text.light }}
                >
                  {matchScore}%
                </span>
              </div>
              <span
                className="font-medium"
                style={{ color: theme.colors.text.light }}
              >
                Match
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Ad - Before Key Information Grid */}
      <div className="px-6 py-3 mt-4">
        <BannerAd />
      </div>

      {/* Key Information Grid */}
      <div className="px-6 py-4">
        <div className="mb-6 rounded-xl p-4 shadow-sm bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {getLocationString()}
                </p>
              </div>
            </div>

            {getSalaryString() && (
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Salary</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getSalaryString()}
                  </p>
                </div>
              </div>
            )}

            {(job.employment_type || job.type) && (
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Employment Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.employment_type || job.type}
                  </p>
                </div>
              </div>
            )}

            {job.sector && (
              <div className="flex items-center gap-2">
                <Building size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Sector</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.sector}
                  </p>
                </div>
              </div>
            )}

            {job.experience_level && (
              <div className="flex items-center gap-2">
                <Target size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Experience Level</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.experience_level}
                  </p>
                </div>
              </div>
            )}

            {job.deadline && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Application Deadline</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(job.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        {job.description && (
          <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">
              Job Description
            </h2>
            <div
              className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: typeof job.description === 'string' ? job.description : '' }}
            />
          </section>
        )}

        {/* Skills Section */}
        {((job.skills_required && Array.isArray(job.skills_required) && job.skills_required.length > 0) ||
          (job.skills && Array.isArray(job.skills) && job.skills.length > 0)) && (
          <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {(job.skills_required || job.skills || []).map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-900"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Responsibilities */}
        {(() => {
          const responsibilities = job.responsibilities || [];
          const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
          
          if (responsibilitiesArray.length > 0) {
            return (
              <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
                <h2 className="text-lg font-semibold mb-3 text-gray-900">
                  Key Responsibilities
                </h2>
                <ul className="space-y-2">
                  {responsibilitiesArray.map((responsibility: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                      <span className="text-gray-900 mt-1.5">•</span>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return null;
        })()}

        {/* Banner Ad - After Key Responsibilities */}
        <div className="mb-6">
          <BannerAd />
        </div>

        {/* Qualifications */}
        {(() => {
          const qualifications = job.qualifications || [];
          const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
          
          if (qualificationsArray.length > 0) {
            return (
              <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
                <h2 className="text-lg font-semibold mb-3 text-gray-900">
                  Qualifications
                </h2>
                <ul className="space-y-2">
                  {qualificationsArray.map((qualification: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                      <span className="text-gray-900 mt-1.5">•</span>
                      <span>{qualification}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return null;
        })()}

        {/* Benefits */}
        {(() => {
          const benefits = job.benefits || [];
          const benefitsArray = Array.isArray(benefits) ? benefits : [];
          
          if (benefitsArray.length > 0) {
            return (
              <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
                <h2 className="text-lg font-semibold mb-3 text-gray-900">
                  Benefits & Perks
                </h2>
                <ul className="space-y-2">
                  {benefitsArray.map((benefit: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                      <Award size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          return null;
        })()}

        {/* Posted Date */}
        {job.posted_date && (
          <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
            <h2 className="text-lg font-semibold mb-2 text-gray-900">Posted</h2>
            <p className="text-sm text-gray-600">
              {new Date(job.posted_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </section>
        )}

        {/* Additional Job Information Accordion */}
        {((job.about_role && job.about_role.trim()) || 
          (job.who_apply && job.who_apply.trim()) || 
          (job.standout && job.standout.trim())) && (
          <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
            <Accordion type="multiple" className="w-full">
              {job.about_role && job.about_role.trim() && (
                <AccordionItem value="about-role" className="border-b border-gray-200">
                  <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                    About This Role
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                      {job.about_role}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {job.who_apply && job.who_apply.trim() && (
                <AccordionItem value="who-apply" className="border-b border-gray-200">
                  <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                    Who Should Apply
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                      {job.who_apply}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}

              {job.standout && job.standout.trim() && (
                <AccordionItem value="standout" className="border-b-0">
                  <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-yellow-500" />
                      <span>How to Stand Out When Applying</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                      {job.standout}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </section>
        )}

        {/* Application Link */}
        {(job.application_url || (job.application && (job.application.url || job.application.link))) && (
          <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
            <a
              href={job.application_url || job.application?.url || job.application?.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: theme.colors.primary.DEFAULT }}
            >
              <ExternalLink size={16} />
              View original job posting
            </a>
          </section>
        )}

        {/* Banner Ad - At Bottom */}
        <div className="mb-32">
          <BannerAd />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 border-t bg-white border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="p-3 rounded-xl hover:bg-gray-100 transition-colors bg-gray-50"
          >
            {saved ? (
              <BookmarkCheck size={24} style={{ color: theme.colors.primary.DEFAULT }} />
            ) : (
              <Bookmark size={24} className="text-gray-500" />
            )}
          </button>

          {/* Auto Apply Button - Only show if job has email application method */}
          {(job.application?.email || job.application_email) && (
            <button
              onClick={handleAutoApply}
              disabled={!user || applied}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${
                applied
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {applied ? 'Applied' : 'Auto Apply'}
            </button>
          )}

          <button
            onClick={() => {
              // Save current job to cache for modal
              if (job) {
                const jobsData = [{
                  id: job.id,
                  title: job.title || 'Untitled Job',
                  company: getCompanyName(),
                  location: getLocationString(),
                }];
                localStorage.setItem('cached_jobs', JSON.stringify(jobsData));
              }
              setCvModalOpen(true);
            }}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
          >
            Create CV
          </button>

          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-colors"
            style={{
              backgroundColor: theme.colors.primary.DEFAULT,
            }}
          >
            {applied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>

      {/* Application Modal */}
      {applicationModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
          onClick={() => setApplicationModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
              How to Apply
            </h3>
            
            {job.application?.instructions && (
              <p className="text-sm mb-4 text-gray-600 leading-relaxed">
                {job.application.instructions}
              </p>
            )}

            <div className="space-y-3 mb-6">
              {(job.application?.email || job.application_email) && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Mail size={24} style={{ color: theme.colors.primary.DEFAULT }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">Email Application</p>
                      <p className="text-sm text-gray-600 truncate">
                        {(job.application?.email || job.application_email || '').replace('mailto:', '')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyToClipboard('email')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Copy size={20} className="text-gray-500" />
                  </button>
                </div>
              )}
              
              {!user && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Please <button onClick={() => router.push('/auth')} className="underline font-medium">sign in</button> to apply
                  </p>
                </div>
              )}

              {(job.application?.phone || job.application_phone) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplicationAction('phone')}
                    className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors bg-gray-50 text-left"
                  >
                    <Phone size={24} style={{ color: theme.colors.accent.red }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">Call to Apply</p>
                      <p className="text-sm text-gray-600 truncate">
                        {(job.application?.phone || job.application_phone || '').replace('tel:', '')}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard('phone')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Copy size={20} className="text-gray-500" />
                  </button>
                </div>
              )}

              {(job.application?.link || job.application?.url || job.application_url) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplicationAction('link')}
                    className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors bg-gray-50 text-left"
                  >
                    <ExternalLink size={24} style={{ color: theme.colors.primary.light }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">Apply Online</p>
                      <p className="text-sm text-gray-600 truncate">
                        {(() => {
                          const link = job.application?.link || job.application?.url || job.application_url || '';
                          return link.length > 40 ? `${link.substring(0, 40)}...` : link;
                        })()}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard('link')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Copy size={20} className="text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setApplicationModalOpen(false)}
              className="w-full px-4 py-3 rounded-xl font-semibold text-white"
              style={{
                backgroundColor: theme.colors.primary.DEFAULT,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>

      {/* CV and Cover Letter Modals */}
      <CreateCVModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        onComplete={(cvId) => {
          router.push(`/cv/view/${cvId}`);
        }}
      />
      <CreateCoverLetterModal
        isOpen={coverLetterModalOpen}
        onClose={() => setCoverLetterModalOpen(false)}
        onComplete={(coverLetterId) => {
          router.push(`/cv/view/${coverLetterId}`);
        }}
      />

      {/* Upgrade Modal */}
      {upgradeErrorType && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => {
            setUpgradeModalOpen(false);
            setUpgradeErrorType(null);
            setUpgradeErrorData(null);
          }}
          errorType={upgradeErrorType}
          message={upgradeErrorData?.message}
          resetDate={upgradeErrorData?.resetDate}
          monthlyLimit={upgradeErrorData?.monthlyLimit}
          requiredCredits={upgradeErrorData?.requiredCredits}
          currentCredits={upgradeErrorData?.currentCredits}
        />
      )}
    </>
  );
}


          requiredCredits={upgradeErrorData?.requiredCredits}
          currentCredits={upgradeErrorData?.currentCredits}
        />
      )}
    </>
  );
}

