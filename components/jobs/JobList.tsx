"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import JobFeedHeader from '@/components/jobs/JobFeedHeader';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { theme } from '@/lib/theme';
import { ChevronDown, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';
import BannerAd from '@/components/ads/BannerAd';
import NativeAd from '@/components/ads/NativeAd';
import Script from 'next/script';
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
    
    // Listen for auth state changes
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
    // Wait for auth check to complete
    if (!authChecked) {
      return;
    }

    // Check if jobs are cached and if we should reload
    const cachedJobsKey = 'jobs_cache';
    const cacheTimestampKey = 'jobs_cache_timestamp';
    const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
    
    try {
      const cachedJobs = localStorage.getItem(cachedJobsKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      
      // Check if cache exists and is still valid
      if (cachedJobs && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        
            // If cache is still valid (less than 24 hours old), use it
            if (now - timestamp < CACHE_DURATION) {
              try {
                const parsedJobs = JSON.parse(cachedJobs);
                setJobs(parsedJobs);
                setLoading(false);
                
                // Update cached_jobs for CV/Cover Letter modals
                try {
                  const jobsData = parsedJobs.map((job: any) => ({
                    id: job.id,
                    title: job.title || 'Untitled Job',
                    company: typeof job.company === 'string' ? job.company : job.company?.name || 'Company',
                    location: typeof job.location === 'string' ? job.location : 
                      (job.location?.remote ? 'Remote' : 
                      [job.location?.city, job.location?.state, job.location?.country].filter(Boolean).join(', ') || 'Not specified'),
                  }));
                  localStorage.setItem('cached_jobs', JSON.stringify(jobsData));
                } catch (cacheError) {
                  console.error('Error updating cached_jobs:', cacheError);
                }
                
                // Still process with matching if user is authenticated
                if (user && userOnboardingData !== null) {
                  // Re-process for match scores (uses cache for match calculations)
                  const rawDataArray = parsedJobs.map((job: any) => {
                    // If rawData exists, use it; otherwise reconstruct from job UI data
                    if (job.rawData) return job.rawData;
                    // Fallback: reconstruct minimal job data structure
                    return {
                      id: job.id,
                      title: job.title,
                      company: job.company,
                      location: job.location,
                      role: job.title,
                      skills_required: [],
                      // Add other fields as needed
                    };
                  });
                  processJobsWithMatching(rawDataArray).then((processed) => {
                    setJobs(processed);
                  });
                }
                return; // Don't fetch from server
              } catch (error) {
                console.error('Error parsing cached jobs:', error);
                // Fall through to fetch from server
              }
            }
      }
    } catch (error) {
      console.error('Error checking job cache:', error);
      // Fall through to fetch from server
    }

    // Fetch jobs for both authenticated and unauthenticated users
    // Only calculate matches if user is authenticated
    if (user && userOnboardingData !== null) {
      // Authenticated user with known onboarding data status
      fetchJobs();
    } else if (user && userOnboardingData === null) {
      // Authenticated but no onboarding data yet - wait
      return;
    } else {
      // Unauthenticated user - fetch jobs without matching
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
    // Don't redirect - allow unauthenticated access
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

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
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

  const saveJobsToCache = () => {
    try {
      // Save current jobs to localStorage for CV/Cover Letter modals
      if (jobs.length > 0) {
        const jobsData = jobs.map(job => {
          // Get full job data from the original jobRows if available
          // For now, save what we have
          return {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
          };
        });
        localStorage.setItem('cached_jobs', JSON.stringify(jobsData));
      }
    } catch (error) {
      console.error('Error saving jobs to cache:', error);
    }
  };

  const processJobsWithMatching = useCallback(async (jobRows: any[]): Promise<JobUI[]> => {
    // Save jobs to cache for CV/Cover Letter modals
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
      // If no onboarding data, return jobs without matching
      return jobRows.map((job: any) => {
        return transformJobToUI(job, 0, null);
      });
    }

    // Load match cache
    const matchCache = matchCacheService.loadMatchCache(user.id);
    let cacheNeedsUpdate = false;
    const updatedCache = { ...matchCache };

    // Process jobs in batches to avoid blocking UI
    const batchSize = 10;
    const processedJobs: JobUI[] = [];

    for (let i = 0; i < jobRows.length; i += batchSize) {
      const batch = jobRows.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (job: any) => {
          try {
            // Check cache first
            let matchResult;
            const cachedMatch = updatedCache[job.id];

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
              updatedCache[job.id] = {
                score: matchResult.score,
                breakdown: matchResult.breakdown,
                cachedAt: matchResult.computedAt,
              };
              cacheNeedsUpdate = true;
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

            return transformJobToUI(job, calculatedTotal, matchResult.breakdown);
          } catch (error) {
            console.error(`Error processing match for job ${job.id}:`, error);
            return transformJobToUI(job, 0, null);
          }
        })
      );

      processedJobs.push(...batchResults);

      // Yield to UI thread between batches
      if (i + batchSize < jobRows.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Save updated cache
    if (cacheNeedsUpdate) {
      matchCacheService.saveMatchCache(user.id, updatedCache);
    }

    return processedJobs;
  }, [user, userOnboardingData]);

  const transformJobToUI = (job: any, matchScore: number, breakdown: any): JobUI => {
    // If user is not authenticated, set match score to 0
    const finalMatchScore = user ? matchScore : 0;
    const finalBreakdown = user ? breakdown : null;
    // Handle location - can be string or object
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

    // Handle company - can be string or object
    let companyStr = 'Unknown Company';
    if (typeof job.company === 'string') {
      companyStr = job.company;
    } else if (job.company && typeof job.company === 'object') {
      companyStr = job.company.name || 'Unknown Company';
    }

    // Handle salary - can be string or object
    let salaryStr = '';
    if (typeof job.salary === 'string') {
      salaryStr = job.salary;
    } else if (job.salary_range && typeof job.salary_range === 'object') {
      const sal = job.salary_range;
      if (sal.min !== null && sal.max !== null && sal.currency) {
        salaryStr = `${sal.currency} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()} ${sal.period || ''}`;
      }
    }

    return {
      id: job.id,
      title: job.title || 'Untitled Job',
      company: companyStr,
      location: locationStr,
      salary: salaryStr,
      match: finalMatchScore,
      calculatedTotal: finalMatchScore,
      type: job.type || job.employment_type || '',
      breakdown: finalBreakdown,
    };
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Process jobs with matching
      const processedJobs = await processJobsWithMatching(data || []);
      
      // Sort by match score
      processedJobs.sort((a, b) => (b.calculatedTotal || 0) - (a.calculatedTotal || 0));

      // Cache the jobs with raw data for future use
      try {
        const jobsToCache = processedJobs.map(job => ({
          ...job,
          rawData: data?.find((j: any) => j.id === job.id), // Store raw data for re-processing
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
    if (!user) {
      router.push('/auth');
      return;
    }

    const newSaved = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    
    setSavedJobs(newSaved);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(newSaved));
    }
  };

  const handleApply = (jobId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const newApplied = appliedJobs.includes(jobId)
      ? appliedJobs.filter(id => id !== jobId)
      : [...appliedJobs, jobId];
    
    setAppliedJobs(newApplied);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(newApplied));

      // Remove from saved jobs if it was saved (when applying)
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
      // For unauthenticated users, clear cache and refresh
      localStorage.removeItem('jobs_cache');
      localStorage.removeItem('jobs_cache_timestamp');
      await fetchJobs();
      return;
    }

    setRefreshingMatches(true);
    
    try {
      // Clear match cache to force recalculation (if user is authenticated)
      if (user) {
        matchCacheService.clearMatchCache(user.id);
      }
      
      // Clear job cache to force fresh fetch
      localStorage.removeItem('jobs_cache');
      localStorage.removeItem('jobs_cache_timestamp');
      
      // Re-fetch jobs which will recalculate matches for authenticated users
      await fetchJobs();
    } catch (error) {
      console.error('Error refreshing matches:', error);
    } finally {
      setRefreshingMatches(false);
    }
  };

  const handleShowBreakdown = (job: JobUI) => {
    if (!user) {
      router.push('/auth');
      return;
    }

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

  // Filter out applied jobs from the list
  const filteredJobs = jobs.filter(job => !appliedJobs.includes(job.id));

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'match') {
      return (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0);
    }
    return 0;
  });

  return (
    <>
      {/* SEO Structured Data */}
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
            if (user) {
              router.push('/cv?tab=cv');
            } else {
              setAuthModalOpen(true);
            }
          }}
          onSubmitJob={() => user ? router.push('/submit') : router.push('/auth')}
        />

        {/* Sign in notification banner - only show if not authenticated */}
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
                Sign in to get personalized match scores.
              </span>
              <Button
                onClick={() => setAuthModalOpen(true)}
                size="sm"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                className="flex-shrink-0"
              >
                <LogIn size={16} className="mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        )}

        {/* Top Banner Ad - Below header, above sort bar */}
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
              <p style={{ color: theme.colors.text.secondary }}>Loading jobs...</p>
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
                Check back later for new opportunities
              </p>
            </div>
          ) : (
            sortedJobs.map((job, index) => (
              <React.Fragment key={job.id}>
                <JobCard
                  job={job}
                  savedJobs={savedJobs}
                  appliedJobs={appliedJobs}
                  onSave={handleSave}
                  onApply={handleApply}
                  onShowBreakdown={handleShowBreakdown}
                />
                {/* In-feed native ad after every 5th job card */}
                {(index + 1) % 5 === 0 && index < sortedJobs.length - 1 && (
                  <NativeAd key={`native-ad-${index}-${Date.now()}`} />
                )}
              </React.Fragment>
            ))
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
    </>
  );
}
