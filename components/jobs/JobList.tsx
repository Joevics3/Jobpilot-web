"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobFeedHeader from '@/components/jobs/JobFeedHeader';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';
import BannerAd from '@/components/ads/BannerAd';
import AdsterraNative from '@/components/ads/AdsterraNative';
import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

export default function JobList() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [refreshingMatches, setRefreshingMatches] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalData, setMatchModalData] = useState<MatchBreakdownModalData | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'date' | 'role'>('match');
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadSavedJobs();
    loadAppliedJobs();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserName(null);
        setUserOnboardingData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserOnboardingData();
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    const cachedJobsKey = 'jobs_cache';
    const cacheTimestampKey = 'jobs_cache_timestamp';
    const CACHE_DURATION = 3 * 60 * 60 * 1000;
    
    try {
      const cachedJobs = localStorage.getItem(cachedJobsKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      
      if (cachedJobs && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        
        if (now - timestamp < CACHE_DURATION) {
          try {
            const parsedJobs = JSON.parse(cachedJobs);
            setJobs(parsedJobs);
            setLoading(false);
            
            try {
              const jobsData = parsedJobs.map((job: any) => ({
                id: job.id,
                slug: job.slug || job.id,
                title: job.title || 'Untitled Job',
                company: typeof job.company === 'string' ? job.company : job.company?.name || 'Company',
                location: typeof job.location === 'string' ? job.location : 
                  (job.location?.remote ? 'Remote' : 
                  [job.location?.city, job.location?.state, job.location?.country].filter(Boolean).join(', ') || 'Not specified'),
                postedDate: job.postedDate || job.posted_date || job.created_at,
              }));
              localStorage.setItem('cached_jobs', JSON.stringify(jobsData));
            } catch (cacheError) {
              console.error('Error updating cached_jobs:', cacheError);
            }
            
            if (user && userOnboardingData !== null) {
              const rawDataArray = parsedJobs.map((job: any) => {
                if (job.rawData) return job.rawData;
                return {
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  role: job.title,
                  skills_required: [],
                };
              });
              processJobsWithMatching(rawDataArray).then((processed) => {
                setJobs(processed);
              });
            }
            return;
          } catch (error) {
            console.error('Error parsing cached jobs:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking job cache:', error);
    }

    if (user && userOnboardingData !== null) {
      fetchJobs();
    } else if (user && userOnboardingData === null) {
      return;
    } else {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, user, userOnboardingData]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    } else {
      setUser(null);
    }
    setAuthChecked(true);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setUserName(data.full_name || null);
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
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    }
  };

  const processJobsWithMatching = useCallback(async (jobRows: any[]): Promise<JobUI[]> => {
    try {
      const jobsData = jobRows.map((job: any) => ({
        id: job.id,
        title: job.title || 'Untitled Job',
        company: typeof job.company === 'string' ? job.company : job.company?.name || 'Company',
        location: typeof job.location === 'string' ? job.location : 
          (job.location?.remote ? 'Remote' : 
          [job.location?.city, job.location?.state, job.location?.country].filter(Boolean).join(', ') || 'Not specified'),
      }));
      localStorage.setItem('cached_jobs', JSON.stringify(jobsData));
    } catch (error) {
      console.error('Error saving jobs to cache:', error);
    }

    if (!userOnboardingData || !user) {
      return jobRows.map((job: any) => {
        return transformJobToUI(job, 0, null);
      });
    }

    const matchCache = matchCacheService.loadMatchCache(user.id);
    let cacheNeedsUpdate = false;
    const updatedCache = { ...matchCache };

    const batchSize = 10;
    const processedJobs: JobUI[] = [];

    for (let i = 0; i < jobRows.length; i += batchSize) {
      const batch = jobRows.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (job: any) => {
          try {
            let matchResult;
            const cachedMatch = updatedCache[job.id];

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

              updatedCache[job.id] = {
                score: matchResult.score,
                breakdown: matchResult.breakdown,
                cachedAt: matchResult.computedAt,
              };
              cacheNeedsUpdate = true;
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

            return transformJobToUI(job, calculatedTotal, matchResult.breakdown);
          } catch (error) {
            console.error(`Error processing match for job ${job.id}:`, error);
            return transformJobToUI(job, 0, null);
          }
        })
      );

      processedJobs.push(...batchResults);

      if (i + batchSize < jobRows.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (cacheNeedsUpdate) {
      matchCacheService.saveMatchCache(user.id, updatedCache);
    }

    return processedJobs;
  }, [user, userOnboardingData]);

  const transformJobToUI = (job: any, matchScore: number, breakdown: any): JobUI => {
    const finalMatchScore = user ? matchScore : 0;
    const finalBreakdown = user ? breakdown : null;
    
    let locationStr = 'Location not specified';
    if (typeof job.location === 'string') {
      locationStr = job.location;
    } else if (job.location && typeof job.location === 'object') {
      const loc = job.location;
      if (loc.remote) {
        locationStr = 'Remote';
      } else {
        const parts = [loc.city, loc.state, loc.country].filter(Boolean);
        locationStr = parts.length > 0 ? parts.join(', ') : 'Location not specified';
      }
    }

    let companyStr = 'Unknown Company';
    if (typeof job.company === 'string') {
      companyStr = job.company;
    } else if (job.company && typeof job.company === 'object') {
      companyStr = job.company.name || 'Unknown Company';
    }

    let salaryStr = '';
    if (typeof job.salary === 'string') {
      salaryStr = job.salary;
    } else if (job.salary_range && typeof job.salary_range === 'object') {
      const sal = job.salary_range;
      if (sal.min !== null && sal.currency) {
        salaryStr = `${sal.currency} ${sal.min.toLocaleString()} ${sal.period || ''}`.trim();
      }
    }

    return {
      id: job.id,
      slug: job.slug || job.id,
      title: job.title || 'Untitled Job',
      company: companyStr,
      location: locationStr,
      salary: salaryStr,
      match: finalMatchScore,
      calculatedTotal: finalMatchScore,
      type: job.type || job.employment_type || '',
      breakdown: finalBreakdown,
      postedDate: job.posted_date || job.created_at || null,
    };
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // ✅ Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      
      // ✅ Fetch only active jobs from last 30 days
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active') // Only active jobs
        .gte('created_at', thirtyDaysAgoISO) // Posted within last 30 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedJobs = await processJobsWithMatching(data || []);
      
      processedJobs.sort((a, b) => (b.calculatedTotal || 0) - (a.calculatedTotal || 0));

      try {
        const jobsToCache = processedJobs.map(job => ({
          ...job,
          rawData: data?.find((j: any) => j.id === job.id),
        }));
        localStorage.setItem('jobs_cache', JSON.stringify(jobsToCache));
        localStorage.setItem('jobs_cache_timestamp', Date.now().toString());
      } catch (cacheError) {
        console.error('Error caching jobs:', cacheError);
      }

      setJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    if (saved) {
      try {
        setSavedJobs(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved jobs:', e);
      }
    }
  };

  const loadAppliedJobs = () => {
    if (typeof window === 'undefined') return;
    const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
    if (applied) {
      try {
        setAppliedJobs(JSON.parse(applied));
      } catch (e) {
        console.error('Error loading applied jobs:', e);
      }
    }
  };

  const handleSave = (jobId: string) => {
    const newSaved = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];

    setSavedJobs(newSaved);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(newSaved));
    }
  };

  const handleApply = (jobId: string) => {
    const newApplied = appliedJobs.includes(jobId)
      ? appliedJobs.filter(id => id !== jobId)
      : [...appliedJobs, jobId];

    setAppliedJobs(newApplied);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(newApplied));

      if (!appliedJobs.includes(jobId)) {
        const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
        if (saved) {
          try {
            const savedArray: string[] = JSON.parse(saved);
            if (savedArray.includes(jobId)) {
              const updatedSaved = savedArray.filter(id => id !== jobId);
              localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(updatedSaved));
              setSavedJobs(updatedSaved);
            }
          } catch (e) {
            console.error('Error updating saved jobs:', e);
          }
        }
      }
    }
  };

  const handleRefreshMatches = async () => {
    if (!user) {
      localStorage.removeItem('jobs_cache');
      localStorage.removeItem('jobs_cache_timestamp');
      await fetchJobs();
      return;
    }

    setRefreshingMatches(true);
    
    try {
      if (user) {
        matchCacheService.clearMatchCache(user.id);
      }
      
      localStorage.removeItem('jobs_cache');
      localStorage.removeItem('jobs_cache_timestamp');
      
      await fetchJobs();
    } catch (error) {
      console.error('Error refreshing matches:', error);
    } finally {
      setRefreshingMatches(false);
    }
  };

  const handleShowBreakdown = (job: JobUI) => {
    const breakdown = job.breakdown || {
      rolesScore: 0,
      skillsScore: 0,
      sectorScore: 0,
      locationScore: 0,
      experienceScore: 0,
      salaryScore: 0,
      typeScore: 0,
    };

    setMatchModalData({
      breakdown,
      totalScore: job.calculatedTotal || job.match || 0,
      jobTitle: job.title,
      companyName: job.company,
    });
    setMatchModalOpen(true);
  };

  const filteredJobs = jobs.filter(job => !appliedJobs.includes(job.id));

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'match') {
      return (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0);
    }
    return 0;
  });

  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema 
        searchAction={{
          target: 'https://www.jobmeter.app/?q={search_term_string}',
          queryInput: 'required name=search_term_string',
        }}
      />
      
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <JobFeedHeader
          userName={userName}
          refreshingMatches={refreshingMatches}
          onRefreshMatches={handleRefreshMatches}
          onCreateCV={() => {
            router.push('/cv?tab=cv');
          }}
          onSubmitJob={() => router.push('/submit')}
        />

        {!user && (
          <div
            className="px-6 py-3 border-b"
            style={{
              backgroundColor: theme.colors.primary.DEFAULT + '10',
              borderColor: theme.colors.border.DEFAULT,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium flex-1" style={{ color: theme.colors.primary.DEFAULT }}>
                Sign up to get personalized match scores.
              </span>
              <Button
                onClick={() => setAuthModalOpen(true)}
                size="sm"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                className="flex-shrink-0"
              >
                <LogIn size={16} className="mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        )}

        <div className="px-6">
          <BannerAd />
        </div>

        <div
          className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.colors.background.DEFAULT,
            borderColor: theme.colors.border.DEFAULT,
          }}
        >
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'date' | 'role')}
              className="text-sm font-medium border-none outline-none appearance-none pr-6 cursor-pointer"
              style={{ color: theme.colors.text.primary }}
            >
              <option value="match">Sort by Match</option>
              <option value="date">Sort by Date</option>
              <option value="role">Sort by Role</option>
            </select>
            <ChevronDown size={16} style={{ color: theme.colors.text.secondary }} className="-ml-5 pointer-events-none" />
          </div>
        </div>

        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p style={{ color: theme.colors.text.secondary }}>Loading jobs. Checking for matches...</p>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p
                className="text-base font-medium mb-2"
                style={{ color: theme.colors.text.primary }}
              >
                No jobs found
              </p>
              <p
                className="text-sm text-center"
                style={{ color: theme.colors.text.secondary }}
              >
                Check your internet connection.
              </p>
            </div>
          ) : (
            sortedJobs.map((job, index) => {
              // ✅ Show native ad after every 10th job (shows 3 ads instead of 1 banner)
              const shouldShowAd = (index + 1) % 10 === 0;
              
              return (
                <React.Fragment key={job.id}>
                  <JobCard
                    job={job}
                    savedJobs={savedJobs}
                    appliedJobs={appliedJobs}
                    onSave={handleSave}
                    onApply={handleApply}
                    onShowBreakdown={handleShowBreakdown}
                  />
                  {/* ✅ Native ad after every 10th job - shows 3 ads per placement */}
                  {shouldShowAd && (
                    <AdsterraNative 
                      key={`native-ad-${index}`}
                      slotId={`job-feed-native-${index}`}
                    />
                  )}
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      <MatchBreakdownModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        data={matchModalData}
      />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />

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
    </>
  );
}