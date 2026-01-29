"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { ArrowLeft, MapPin, Briefcase } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Abuja'
];

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

export default function JobsByTownPage() {
  const params = useParams();
  const state = params?.state as string;
  const town = params?.town as string;
  
  const formattedState = state ? state.charAt(0).toUpperCase() + state.slice(1) : '';
  const formattedTown = town ? town.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
  
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalData, setMatchModalData] = useState<MatchBreakdownModalData | null>(null);
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [otherStateJobs, setOtherStateJobs] = useState<JobUI[]>([]);
  const [nationalJobs, setNationalJobs] = useState<JobUI[]>([]);

  useEffect(() => {
    checkAuth();
    loadSavedJobs();
    loadAppliedJobs();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserOnboardingData();
    }
  }, [user]);

  useEffect(() => {
    if (formattedState && NIGERIAN_STATES.includes(formattedState) && formattedTown) {
      fetchJobsByTown();
    }
  }, [formattedState, formattedTown, userOnboardingData, user]);

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
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    }
  };

  const fetchJobsByTown = async () => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fetch ALL active jobs from last 30 days
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // First filter by state
      const stateFilteredJobs = (data || []).filter((job) => {
        if (typeof job.location === 'string') {
          return job.location.toLowerCase().includes(formattedState.toLowerCase());
        }
        
        if (job.location && typeof job.location === 'object') {
          const locState = job.location.state || '';
          return locState.toLowerCase() === formattedState.toLowerCase();
        }
        
        return false;
      });

      // Then filter by town/city
      const townFilteredJobs = stateFilteredJobs.filter((job) => {
        if (typeof job.location === 'string') {
          return job.location.toLowerCase().includes(formattedTown.toLowerCase());
        }
        
        if (job.location && typeof job.location === 'object') {
          const locCity = job.location.city || '';
          return locCity.toLowerCase() === formattedTown.toLowerCase();
        }
        
        return false;
      });

      // Set total count for this town
      setTotalJobs(townFilteredJobs.length);

      // Use EXACT SAME matching logic as JobList.tsx
      const processedJobs = await processJobsWithMatching(townFilteredJobs);
      processedJobs.sort((a, b) => (b.calculatedTotal || 0) - (a.calculatedTotal || 0));
      setJobs(processedJobs);

      // Fetch other state jobs and national jobs
      await fetchAdditionalJobs(stateFilteredJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalJobs = async (stateJobs: any[]) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Fetch other jobs from same state (excluding current town)
      const otherTownJobs = stateJobs.filter((job) => {
        if (typeof job.location === 'string') {
          return !job.location.toLowerCase().includes(formattedTown.toLowerCase());
        }
        if (job.location && typeof job.location === 'object') {
          const locCity = job.location.city || '';
          return locCity.toLowerCase() !== formattedTown.toLowerCase();
        }
        return true;
      }).slice(0, 30);

      const processedOtherStateJobs = await processJobsWithMatching(otherTownJobs);
      processedOtherStateJobs.sort((a, b) => (b.calculatedTotal || 0) - (a.calculatedTotal || 0));
      setOtherStateJobs(processedOtherStateJobs);

      // Fetch national jobs (excluding current state)
      const { data: nationalJobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) throw error;

      // Filter out jobs from current state
      const filteredNationalJobs = (nationalJobsData || [])
        .filter(job => {
          if (typeof job.location === 'string') {
            return !job.location.toLowerCase().includes(formattedState.toLowerCase());
          }
          if (job.location && typeof job.location === 'object') {
            const locState = job.location.state || '';
            return locState.toLowerCase() !== formattedState.toLowerCase();
          }
          return true;
        })
        .slice(0, 30);

      const processedNationalJobs = await processJobsWithMatching(filteredNationalJobs);
      processedNationalJobs.sort((a, b) => (b.calculatedTotal || 0) - (a.calculatedTotal || 0));
      setNationalJobs(processedNationalJobs);
    } catch (error) {
      console.error('Error fetching additional jobs:', error);
    }
  };

  // ========================================
  // EXACT SAME MATCHING LOGIC FROM JOBLIST.TSX
  // ========================================
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

  // EXACT SAME transformJobToUI from JobList.tsx
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

    const getRelativeTime = (dateString: string | null) => {
      if (!dateString) return null;
      
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return '1 day ago';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) {
          const weeks = Math.floor(diffInDays / 7);
          return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        }
        if (diffInDays < 365) {
          const months = Math.floor(diffInDays / 30);
          return months === 1 ? '1 month ago' : `${months} months ago`;
        }
        const years = Math.floor(diffInDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
      } catch {
        return null;
      }
    };

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

      postedDate: getRelativeTime((job.posted_date ?? job.created_at) ?? null) ?? undefined,
    };
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

  if (!formattedState || !NIGERIAN_STATES.includes(formattedState)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">State Not Found</h1>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  if (!formattedTown) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Town Not Found</h1>
          <Link href={`/jobs/state/${state.toLowerCase()}`} className="text-blue-600 hover:underline">
            Back to {formattedState} Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        {/* Header */}
        <div className="text-white py-8 px-6" style={{ backgroundColor: '#2563EB' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <MapPin size={32} />
              <h1 className="text-4xl font-bold">Jobs in {formattedTown}, {formattedState}</h1>
            </div>
            <p className="text-lg text-white">
              {totalJobs} job{totalJobs !== 1 ? 's' : ''} available in {formattedTown}, {formattedState}
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/jobs" className="hover:text-blue-600">Jobs</Link>
            <span>/</span>
            <Link href="/jobs/state/" className="hover:text-blue-600">States</Link>
            <span>/</span>
            <Link href={`/jobs/state/${state.toLowerCase()}`} className="hover:text-blue-600">{formattedState}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{formattedTown}</span>
          </nav>
        </div>

        {/* Back Button */}
        <div className="px-6 pb-4">
          <Link
            href={`/jobs/state/${state.toLowerCase()}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            Back to {formattedState} Jobs
          </Link>
        </div>

        {/* Jobs List */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p style={{ color: theme.colors.text.secondary }}>Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No jobs found in {formattedTown}, {formattedState}
              </h2>
              <p className="text-gray-600 mb-6">
                Check back soon or explore jobs in other locations.
              </p>
              <Link
                href={`/jobs/state/${state.toLowerCase()}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Browse {formattedState} Jobs
              </Link>
            </div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                savedJobs={savedJobs}
                appliedJobs={appliedJobs}
                onSave={handleSave}
                onApply={handleApply}
                onShowBreakdown={handleShowBreakdown}
              />
            ))
           )}

          {/* Other Jobs in State */}
          {!loading && otherStateJobs.length > 0 && (
            <div className="px-6 py-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Other Jobs in {formattedState}</h2>
                <p className="text-gray-600 mb-4">More opportunities in nearby towns and cities</p>
                <div className="space-y-4">
                  {otherStateJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      savedJobs={savedJobs}
                      appliedJobs={appliedJobs}
                      onSave={handleSave}
                      onApply={handleApply}
                      onShowBreakdown={handleShowBreakdown}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trending National Jobs */}
          {!loading && nationalJobs.length > 0 && (
            <div className="px-6 py-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Trending National Jobs</h2>
                <p className="text-gray-600 mb-4">Popular job opportunities from across Nigeria</p>
                <div className="space-y-4">
                  {nationalJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      savedJobs={savedJobs}
                      appliedJobs={appliedJobs}
                      onSave={handleSave}
                      onApply={handleApply}
                      onShowBreakdown={handleShowBreakdown}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
         </div>
       </div>

      <MatchBreakdownModal
        open={matchModalOpen}
        onClose={() => setMatchModalOpen(false)}
        data={matchModalData}
      />
    </>
  );
}