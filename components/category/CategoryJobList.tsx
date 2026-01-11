// components/category/CategoryJobList.tsx

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';
import AdsterraNative from '@/components/ads/AdsterraNative';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

interface CategoryJobListProps {
  category: string;
  location: string | null;
}

export default function CategoryJobList({ category, location }: CategoryJobListProps) {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalData, setMatchModalData] = useState<MatchBreakdownModalData | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'date'>('date');
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);

  useEffect(() => {
    checkAuth();
    loadSavedJobs();
    loadAppliedJobs();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserOnboardingData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserOnboardingData();
    }
  }, [user]);

  useEffect(() => {
    fetchCategoryJobs();
  }, [category, location, user, userOnboardingData]);

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

  const fetchCategoryJobs = async () => {
    try {
      setLoading(true);
      
      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      
      // Build query
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .eq('category', category)
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 jobs as per requirement

      // Add location filter if specified
      if (location) {
        // Filter by state in location JSON column
        query = query.eq('location->>state', location);
      }

      const { data, error } = await query;

      if (error) throw error;

      const processedJobs = await processJobsWithMatching(data || []);
      
      // Sort by date initially
      processedJobs.sort((a, b) => {
        const dateA = new Date(a.postedDate || 0).getTime();
        const dateB = new Date(b.postedDate || 0).getTime();
        return dateB - dateA;
      });

      setJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching category jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const processJobsWithMatching = useCallback(async (jobRows: any[]): Promise<JobUI[]> => {
    if (!userOnboardingData || !user) {
      return jobRows.map((job: any) => transformJobToUI(job, 0, null));
    }

    const matchCache = matchCacheService.loadMatchCache(user.id);
    let cacheNeedsUpdate = false;
    const updatedCache = { ...matchCache };

    const processedJobs = await Promise.all(
      jobRows.map(async (job: any) => {
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

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') {
      return (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0);
    }
    // Sort by date
    const dateA = new Date(a.postedDate || 0).getTime();
    const dateB = new Date(b.postedDate || 0).getTime();
    return dateB - dateA;
  });

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: theme.colors.border.DEFAULT }}
        >
          <div className="flex items-center gap-3">
            <Briefcase size={20} style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              Latest Jobs ({jobs.length})
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'date')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 outline-none cursor-pointer"
              style={{ color: theme.colors.text.primary }}
            >
              <option value="date">Newest First</option>
              {user && <option value="match">Best Match</option>}
            </select>
          </div>
        </div>

        {/* Job List */}
        <div className="divide-y" style={{ borderColor: theme.colors.border.DEFAULT }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p style={{ color: theme.colors.text.secondary }}>Loading jobs...</p>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Briefcase size={48} className="text-gray-400 mb-4" />
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
                Check back later for new opportunities in this category
              </p>
            </div>
          ) : (
            sortedJobs.map((job, index) => {
              // Show native ad after every 10th job
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
                  {shouldShowAd && (
                    <div className="p-4">
                      <AdsterraNative 
                        key={`native-ad-${index}`}
                        slotId={`category-feed-native-${index}`}
                      />
                    </div>
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
    </>
  );
}