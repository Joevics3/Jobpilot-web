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

  // ------------------- EFFECTS -------------------
  useEffect(() => {
    checkAuth();
    loadSavedJobs();
    loadAppliedJobs();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setUser(session.user);
      else {
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
    if (!authChecked) return;

    // Clear old caches to avoid ID-based links
    localStorage.removeItem('jobs_cache');
    localStorage.removeItem('cached_jobs');
    localStorage.removeItem('jobs_cache_timestamp');

    fetchJobs();
  }, [authChecked, user, userOnboardingData]);

  // ------------------- AUTH -------------------
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setUser(session.user);
    else setUser(null);
    setAuthChecked(true);
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (!error && data) setUserName(data.full_name || null);
  };

  const fetchUserOnboardingData = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('onboarding_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') console.error('Error fetching onboarding data:', error);
    if (data) setUserOnboardingData({
      target_roles: data.target_roles || [],
      cv_skills: data.cv_skills || [],
      preferred_locations: data.preferred_locations || [],
      experience_level: data.experience_level || null,
      salary_min: data.salary_min || null,
      salary_max: data.salary_max || null,
      job_type: data.job_type || null,
      sector: data.sector || null,
    });
  };

  // ------------------- SAVED / APPLIED JOBS -------------------
  const loadSavedJobs = () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    if (saved) setSavedJobs(JSON.parse(saved));
  };

  const loadAppliedJobs = () => {
    if (typeof window === 'undefined') return;
    const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
    if (applied) setAppliedJobs(JSON.parse(applied));
  };

  const handleSave = (jobId: string) => {
    const newSaved = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId];
    setSavedJobs(newSaved);
    localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(newSaved));
  };

  const handleApply = (jobId: string) => {
    const newApplied = appliedJobs.includes(jobId)
      ? appliedJobs.filter(id => id !== jobId)
      : [...appliedJobs, jobId];
    setAppliedJobs(newApplied);
    localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(newApplied));

    // Remove from saved if applied
    if (!appliedJobs.includes(jobId)) {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
      if (saved) {
        const savedArray: string[] = JSON.parse(saved);
        if (savedArray.includes(jobId)) {
          const updatedSaved = savedArray.filter(id => id !== jobId);
          localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(updatedSaved));
          setSavedJobs(updatedSaved);
        }
      }
    }
  };

  // ------------------- FETCH JOBS -------------------
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const processedJobs = await processJobsWithMatching(data || []);
      processedJobs.sort((a, b) => (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0));

      // Cache jobs
      const jobsToCache = processedJobs.map(job => ({
        ...job,
        rawData: data?.find(j => j.id === job.id),
      }));
      localStorage.setItem('jobs_cache', JSON.stringify(jobsToCache));
      localStorage.setItem('jobs_cache_timestamp', Date.now().toString());

      setJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const processJobsWithMatching = useCallback(async (jobRows: any[]): Promise<JobUI[]> => {
    if (!userOnboardingData || !user) {
      return jobRows.map(job => transformJobToUI(job, 0, null));
    }

    const matchCache = matchCacheService.loadMatchCache(user.id);
    let cacheNeedsUpdate = false;
    const updatedCache = { ...matchCache };
    const batchSize = 10;
    const processedJobs: JobUI[] = [];

    for (let i = 0; i < jobRows.length; i += batchSize) {
      const batch = jobRows.slice(i, i + batchSize);

      const batchResults = await Promise.all(batch.map(async (job: any) => {
        try {
          let matchResult;
          const cachedMatch = updatedCache[job.id];

          if (cachedMatch) matchResult = cachedMatch;
          else {
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
      }));

      processedJobs.push(...batchResults);
      if (i + batchSize < jobRows.length) await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (cacheNeedsUpdate) matchCacheService.saveMatchCache(user.id, updatedCache);

    return processedJobs;
  }, [user, userOnboardingData]);

  const transformJobToUI = (job: any, matchScore: number, breakdown: any): JobUI => {
    const finalMatchScore = user ? matchScore : 0;
    const finalBreakdown = user ? breakdown : null;

    let locationStr = 'Location not specified';
    if (typeof job.location === 'string') locationStr = job.location;
    else if (job.location) {
      locationStr = job.location.remote
        ? 'Remote'
        : [job.location.city, job.location.state, job.location.country].filter(Boolean).join(', ') || 'Location not specified';
    }

    let companyStr = 'Unknown Company';
    if (typeof job.company === 'string') companyStr = job.company;
    else if (job.company) companyStr = job.company.name || 'Unknown Company';

    let salaryStr = '';
    if (typeof job.salary === 'string') salaryStr = job.salary;
    else if (job.salary_range && job.salary_range.min !== null && job.salary_range.max !== null && job.salary_range.currency) {
      const sal = job.salary_range;
      salaryStr = `${sal.currency} ${sal.min.toLocaleString()} - ${sal.max.toLocaleString()} ${sal.period || ''}`;
    }

    return {
      id: job.id,
      slug: job.slug, // ✅ important
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

  const handleRefreshMatches = async () => {
    if (!user) {
      localStorage.removeItem('jobs_cache');
      localStorage.removeItem('jobs_cache_timestamp');
      await fetchJobs();
      return;
    }

    setRefreshingMatches(true);
    try {
      matchCacheService.clearMatchCache(user.id);
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

  // ------------------- FILTER + SORT -------------------
  const filteredJobs = jobs.filter(job => !appliedJobs.includes(job.id));
  const sortedJobs = [...filteredJobs].sort((a, b) =>
    sortBy === 'match'
      ? (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0)
      : 0
  );

  // ------------------- RENDER -------------------
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema searchAction={{
        target: 'https://www.jobmeter.app/?q={search_term_string}',
        queryInput: 'required name=search_term_string',
      }} />

      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <JobFeedHeader
          userName={userName}
          refreshingMatches={refreshingMatches}
          onRefreshMatches={handleRefreshMatches}
        />

        <div className="job-list-container">
          {loading ? (
            <p>Loading jobs...</p>
          ) : sortedJobs.length === 0 ? (
            <p>No jobs found.</p>
          ) : (
            sortedJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => router.push(`/jobs/${job.slug}`)} // ✅ slug-based navigation
                onSave={() => handleSave(job.id)}
                onApply={() => handleApply(job.id)}
                onShowBreakdown={() => handleShowBreakdown(job)}
                saved={savedJobs.includes(job.id)}
                applied={appliedJobs.includes(job.id)}
              />
            ))
          )}
        </div>
      </div>

      {matchModalOpen && matchModalData && (
        <MatchBreakdownModal
          data={matchModalData}
          onClose={() => setMatchModalOpen(false)}
        />
      )}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {cvModalOpen && <CreateCVModal onClose={() => setCvModalOpen(false)} />}
      {coverLetterModalOpen && <CreateCoverLetterModal onClose={() => setCoverLetterModalOpen(false)} />}
    </>
  );
}