"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, DollarSign, Calendar, Briefcase, Bookmark, BookmarkCheck, FileCheck, Mail, Phone, ExternalLink, ArrowLeft, Clock, Building, Target, Award, Copy, Sparkles, Share2, Link } from 'lucide-react';
import { theme } from '@/lib/theme';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';
import { getCompanyName, findCompanyByName } from '@/lib/utils/companyUtils';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';
import UpgradeModal from '@/components/jobs/UpgradeModal';
import { useCredits } from '@/hooks/useCredits';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import RelatedJobCard from '@/components/jobs/RelatedJobCard';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

export default function JobClient({ job, relatedJobs }: { job: any; relatedJobs?: any[] }) {
  const router = useRouter();
  const jobId = job.id;
  
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
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
  const [cvServiceModalOpen, setCvServiceModalOpen] = useState(false);
  const { balance, hasEnoughCredits, loadCreditBalance } = useCredits();
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadSavedStatus();
    loadAppliedStatus();
    loadCompanies();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserOnboardingData();
    }
  }, [user]);

  useEffect(() => {
    if (job && user && userOnboardingData) {
      calculateMatchScore();
    } else if (job && (!user || !userOnboardingData)) {
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

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, logo_url')
        .eq('is_published', true);

      if (error) {
        console.error('Error loading companies:', error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const calculateMatchScore = () => {
    if (!job || !user || !userOnboardingData) {
      setMatchScore(0);
      return;
    }

    try {
      const matchCache = matchCacheService.loadMatchCache(user.id);
      const cachedMatch = matchCache[job.id];

      let matchResult;
      if (cachedMatch) {
        matchResult = {
          score: cachedMatch.score,
          breakdown: cachedMatch.breakdown,
          computedAt: cachedMatch.cachedAt,
        };
      } else {
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

        const updatedCache = { ...matchCache };
        updatedCache[job.id] = {
          score: matchResult.score,
          breakdown: matchResult.breakdown,
          cachedAt: matchResult.computedAt,
        };
        matchCacheService.saveMatchCache(user.id, updatedCache);
      }

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

  const handleShare = (type: 'whatsapp' | 'email') => {
    const jobUrl = typeof window !== 'undefined' ? window.location.href : '';
    const companyName = getCompanyName(job.company);
    const shareText = `${job.title} at ${companyName}`;
    
    if (type === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${jobUrl}`)}`;
      window.open(whatsappUrl, '_blank');
    } else if (type === 'email') {
      const emailSubject = encodeURIComponent(shareText);
      const emailBody = encodeURIComponent(`Check out this job opportunity:\n\n${shareText}\n\n${jobUrl}`);
      window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    }
    
    setShareModalOpen(false);
  };

  const handleApply = () => {
    setApplicationModalOpen(true);
  };

  const handleAutoApply = async () => {
    if (!job || !user) return;

    const application = job.application || {};
    const email = application.email || job.application_email;
    
    if (!email) {
      return;
    }

    const AUTO_APPLY_CREDITS_COST = 2;
    
    try {
      await loadCreditBalance();

      if (!hasEnoughCredits(AUTO_APPLY_CREDITS_COST)) {
        setUpgradeErrorType('INSUFFICIENT_CREDITS');
        setUpgradeErrorData({
          message: `Auto-apply requires ${AUTO_APPLY_CREDITS_COST} credits. You have ${balance} credit${balance !== 1 ? 's' : ''}. Please purchase credits to continue.`,
          requiredCredits: AUTO_APPLY_CREDITS_COST,
          currentCredits: balance,
        });
        setUpgradeModalOpen(true);
        return;
      }

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
        console.error('Background application error (will be retried):', error);
      });

    } catch (error: any) {
      console.error('Error in auto apply:', error);
    }
  };

  const handleApplicationAction = async (type: 'email' | 'phone' | 'link') => {
    if (!job || !user) return;

    if (type === 'email') {
      const application = job.application || {};
      const email = application.email || job.application_email;
      
      if (email) {
        const targetUrl = email.startsWith('mailto:') ? email : `mailto:${email}`;
        window.location.href = targetUrl;
        return;
      }
    }

    try {
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
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getMatchColor = (match: number) => {
    if (match >= 50) return theme.colors.match.good;
    if (match >= 31) return theme.colors.match.average;
    return theme.colors.match.bad;
  };

  const getCompanyInfo = () => {
    const companyName = getCompanyName(job.company);
    const company = findCompanyByName(companyName, companies);
    
    return {
      name: companyName,
      company: company,
      slug: company?.slug
    };
  };

  const matchColor = getMatchColor(matchScore);
  const companyInfo = getCompanyInfo();

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
      const { min, max, currency, period } = job.salary_range;

      if (min != null && currency) {
        if (!max || min === max) {
          return `${currency} ${min.toLocaleString()} ${period || ''}`.trim();
        }

        return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} ${period || ''}`.trim();
      }
    }

    return null;
  };

const getExperienceLevelWithYears = (level: string) => {
  // Normalize the input
  const normalizedLevel = level.trim();
  
  const experienceMap: Record<string, string> = {
    'Entry Level': 'Entry Level (0-2 years)',
    'entry level': 'Entry Level (0-2 years)',
    'entry-level': 'Entry Level (0-2 years)',
    'Junior': 'Junior (1-3 years)',
    'junior': 'Junior (1-3 years)',
    'Mid-level': 'Mid-level (3-5 years)',
    'mid-level': 'Mid-level (3-5 years)',
    'Mid level': 'Mid-level (3-5 years)',
    'mid level': 'Mid-level (3-5 years)',
    'Senior': 'Senior (5-8 years)',
    'senior': 'Senior (5-8 years)',
    'Lead': 'Lead (8-12 years)',
    'lead': 'Lead (8-12 years)',
    'Executive': 'Executive (12+ years)',
    'executive': 'Executive (12+ years)',
  };
  
  return experienceMap[normalizedLevel] || level;
};

  const getJobTypeDisplay = (jobType: string) => {
    const jobTypeMap: Record<string, string> = {
      'remote': 'Remote',
      'on-site': 'On-site',
      'hybrid': 'Hybrid',
      'onsite': 'On-site',
      'full-remote': 'Fully Remote',
    };
    return jobTypeMap[jobType?.toLowerCase()] || jobType;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div
          className="relative pt-12 pb-8 px-6"
          style={{
            backgroundColor: theme.colors.primary.DEFAULT,
          }}
        >
          <button 
           onClick={() => router.push('/jobs')}
           className="mb-4 p-2 rounded-full hover:bg-white/20 transition-colors"  
          style={{ backgroundColor: theme.colors.overlay.header }}
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
              <div className="flex items-center gap-2 mb-4">
                {companyInfo.company?.logo_url && (
                  <img 
                    src={companyInfo.company.logo_url} 
                    alt={companyInfo.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                {companyInfo.slug ? (
                  <a 
                    href={`/company/${companyInfo.slug}`}
                    className="text-lg font-medium text-white/90 hover:text-white transition-colors flex items-center gap-1"
                  >
                    {companyInfo.name}
                    <Link size={16} className="text-white/70" />
                  </a>
                ) : (
                  <p className="text-lg font-medium text-white/90">
                    {companyInfo.name}
                  </p>
                )}
              </div>
              
              {/* Match Score Badge, Save Icon, and Share Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: theme.colors.overlay.header }}>
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

                  <button
                    onClick={handleSave}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    style={{ backgroundColor: theme.colors.overlay.header }}
                  >
                    {saved ? (
                      <BookmarkCheck size={20} style={{ color: theme.colors.text.light }} />
                    ) : (
                      <Bookmark size={20} style={{ color: theme.colors.overlay.headerText }} />
                    )}
                  </button>
                </div>

                {/* Share Button */}
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  style={{ backgroundColor: theme.colors.overlay.header }}
                >
                  <Share2 size={20} style={{ color: theme.colors.overlay.headerText }} />
                </button>
              </div>
            </div>
          </div>
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

              {job.job_type && (
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Work Arrangement</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getJobTypeDisplay(job.job_type)}
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
                      {getExperienceLevelWithYears(job.experience_level)}
                    </p>
                  </div>
                </div>
              )}

              {job.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Valid Through</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(job.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About Company Section */}
          {job.about_company && (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                About the Company
              </h2>
              <div
                className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: typeof job.about_company === 'string' ? job.about_company : '' }}
              />
            </section>
          )}

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

{(job.posted_date || job.created_at) && (
  <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
    <h2 className="text-lg font-semibold mb-2 text-gray-900">Posted</h2>
    <p className="text-sm text-gray-600">
      {(() => {
        const dateStr = job.posted_date || job.created_at;
        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return 'Date not available';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC' // Important: use UTC to prevent timezone issues
        });
      })()}
    </p>
  </section>
)}

          {/* Related Jobs Section */}
          {relatedJobs && relatedJobs.length > 0 && (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Related Jobs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedJobs.map((relatedJob) => (
                  <RelatedJobCard key={relatedJob.id} job={relatedJob} />
                ))}
              </div>
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

        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 border-t bg-white border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              className={`flex-1 px-2 py-3 rounded-xl font-semibold text-sm text-white transition-colors ${
                applied ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: applied ? undefined : theme.colors.primary.DEFAULT,
              }}
              disabled={applied}
            >
              {applied ? 'Applied' : 'Apply Now'}
            </button>

            {/* Pro Apply Button - Only show if job has email application method */}
            {(job.application?.email || job.application_email) && (
            <button
                onClick={() => setCvServiceModalOpen(true)}
                disabled={applied}
                className={`flex-1 px-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  applied
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : ''
                }`}
                style={{
                  backgroundColor: applied ? undefined : theme.colors.primary.DEFAULT,
                }}
            >
                {applied ? 'Applied' : 'Pro Apply'}
              </button>
            )}

            <button
              onClick={() => {
                // Save current job to cache for modal
                if (job) {
                  const jobsData = [{
                    id: job.id,
                    title: job.title || 'Untitled Job',
                    company: getCompanyName(job.company),
                    location: getLocationString(),
                  }];
                  localStorage.setItem('cached_jobs', JSON.stringify(jobsData));
                }
                setCvModalOpen(true);
              }}
              className="flex-1 px-2 py-3 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
            >
              Create CV
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
                        <a 
                          href={`mailto:${(job.application?.email || job.application_email || '').replace('mailto:', '')}`}
                          className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                        >
                          {(job.application?.email || job.application_email || '').replace('mailto:', '')}
                        </a>
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
                
                {!user && process.env.NODE_ENV === 'development' && (
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
                         <div className="flex items-center gap-2">
                           <a 
                             href={`tel:${(job.application?.phone || job.application_phone || '').replace('tel:', '')}`}
                             className="text-sm text-blue-600 hover:text-blue-800 truncate"
                           >
                             {(job.application?.phone || job.application_phone || '').replace('tel:', '')}
                           </a>
                           <a 
                             href={`https://wa.me/${(job.application?.phone || job.application_phone || '').replace(/[^0-9]/g, '')}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-green-600 hover:text-green-800"
                             title="Open in WhatsApp"
                           >
                             🗨️
                           </a>
                         </div>
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
                         <a 
                           href={job.application?.link || job.application?.url || job.application_url || ''}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                         >
                           {(() => {
                             const link = job.application?.link || job.application?.url || job.application_url || '';
                             return link.length > 40 ? `${link.substring(0, 40)}...` : link;
                           })()}
                         </a>
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

        {/* CV Distribution Service Modal */}
        {cvServiceModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setCvServiceModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Compact */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white text-center">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold mb-1">Too Busy to Apply?</h2>
                <p className="text-blue-100 text-sm">Let us handle it for you</p>
              </div>

              {/* Content - Mobile Optimized */}
              <div className="p-5">
                {/* How It Works */}
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">How It Works:</h3>
                  {[
                    { step: "1", text: "Make Payment" },
                    { step: "2", text: "Create Gmail Account" },
                    { step: "3", text: "Send us your CV on WhatsApp" },
                    { step: "4", text: "We handle everything & update you daily" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <span className="text-sm text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mb-5 py-3 border-y border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    500+ Hired
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    24hr Setup
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    From ₦3,000
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const whatsappNumber = '2347056928186';
                      const message = encodeURIComponent(
                        "Hi! I'm ready to start Pro Apply. What's the next step for payment?"
                      );
                      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                      window.open(whatsappUrl, '_blank');
                      setCvServiceModalOpen(false);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Start on WhatsApp
                  </button>
                  
                  <button
                    onClick={() => {
                      router.push('/pro-apply');
                      setCvServiceModalOpen(false);
                    }}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Learn More
                  </button>
                  
                  <button
                    onClick={() => setCvServiceModalOpen(false)}
                    className="w-full text-gray-400 hover:text-gray-600 font-medium py-2 text-xs transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
            onClick={() => setShareModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
                Share this job
              </h3>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Share on WhatsApp</p>
                    <p className="text-sm text-gray-500">Send to your contacts</p>
                  </div>
                </button>

                <button
                  onClick={() => handleShare('email')}
                  className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">Share via Email</p>
                    <p className="text-sm text-gray-500">Send to your email contacts</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShareModalOpen(false)}
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