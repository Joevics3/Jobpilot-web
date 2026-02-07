"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import JobFilters from '@/components/jobs/JobFilters';
import { ChevronDown, LogIn, Search, X, Filter, SlidersHorizontal, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';

import { OrganizationSchema, WebSiteSchema } from '@/components/seo/StructuredData';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

// ✅ OPTIMIZATION: Pagination constants
const JOBS_PER_PAGE = 100;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

export default function JobList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // ✅ NEW: Tab state
  const [activeTab, setActiveTab] = useState<'latest' | 'matches'>('latest');
  const [latestJobs, setLatestJobs] = useState<JobUI[]>([]);
  const [latestJobsLoading, setLatestJobsLoading] = useState(true);
  const [latestJobsPage, setLatestJobsPage] = useState(1);
  const [latestJobsHasMore, setLatestJobsHasMore] = useState(true);
  
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobUI[]>([]); // ✅ Now used only for matches tab
  const [loading, setLoading] = useState(false); // ✅ Changed default to false
  const [authChecked, setAuthChecked] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [refreshingMatches, setRefreshingMatches] = useState(false);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalData, setMatchModalData] = useState<MatchBreakdownModalData | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'latest' | 'salary'>('match');
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<any>({
    search: '',
    location: [] as string[],
    sector: [] as string[] | string,
    role: '' as string,
    state: '' as string,
    town: '' as string,
    jobType: [] as string[],
    workMode: [] as string[],
    employmentType: [] as string[],
    salaryRange: undefined as { min: number; max: number; enabled?: boolean } | undefined,
    remote: false,
  });

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile();
        fetchUserOnboardingData();
      } else {
        setUser(null);
        setUserName(null);
        setUserOnboardingData(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setAuthChecked(true);
    }
  };

  useEffect(() => {
    checkAuth();
    loadSavedJobs();
    loadAppliedJobs();
    
    // Note: Default tab is 'latest', no restoration from localStorage on initial load
    // This ensures Latest Jobs loads immediately and Matches only fetches when clicked
    
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

  // Initialize search query and filters from URL parameters
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const locationParam = searchParams.get('location');
    const sectorParam = searchParams.get('sector');
    const employmentTypeParam = searchParams.get('employmentType');
    const salaryMinParam = searchParams.get('salaryMin');
    const salaryMaxParam = searchParams.get('salaryMax');
    const remoteParam = searchParams.get('remote');
    const sortParam = searchParams.get('sort');

    if (searchParam) {
      setSearchQuery(searchParam);
      setFilters(prev => ({ ...prev, search: searchParam }));
    }

    if (locationParam) {
      setFilters(prev => ({ ...prev, location: locationParam.split(',') }));
    }

    if (sectorParam) {
      setFilters(prev => ({ ...prev, sector: sectorParam.split(',') }));
    }

    if (employmentTypeParam) {
      setFilters(prev => ({ ...prev, employmentType: employmentTypeParam.split(',') }));
    }

    if (salaryMinParam || salaryMaxParam) {
      setFilters(prev => ({
        ...prev,
        salaryRange: {
          min: salaryMinParam ? parseInt(salaryMinParam) : 0,
          max: salaryMaxParam ? parseInt(salaryMaxParam) : 0,
        }
      }));
    }

    if (remoteParam === 'true') {
      setFilters(prev => ({ ...prev, remote: true }));
    }

    if (sortParam === 'latest' || sortParam === 'salary') {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserOnboardingData();
    }
  }, [user]);

  // ✅ NEW: Fetch latest jobs on mount (Latest tab is default)
  useEffect(() => {
    if (!authChecked) return;
    
    // Only fetch if on latest tab
    if (activeTab === 'latest') {
      fetchLatestJobs(1);
    }
  }, [authChecked, activeTab]);

  // ✅ NEW: Refetch when filters change (debounced for search)
  useEffect(() => {
    if (!authChecked || activeTab !== 'latest') return;
    
    // Debounce search input
    const timeoutId = setTimeout(() => {
      fetchLatestJobs(1);
    }, filters.search ? 500 : 0); // 500ms delay for search, immediate for other filters
    
    return () => clearTimeout(timeoutId);
  }, [authChecked, activeTab, filters]);

  // ✅ MODIFIED: Only fetch matches when user switches to Matches tab
  useEffect(() => {
    if (!authChecked || activeTab !== 'matches') {
      return;
    }

    // Check if matches are already loaded
    if (jobs.length > 0) {
      return;
    }

    const cachedJobsKey = 'jobs_cache';
    const cacheTimestampKey = 'jobs_cache_timestamp';
    const cacheUserIdKey = 'jobs_cache_user_id';
    
    try {
      const cachedJobs = localStorage.getItem(cachedJobsKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      const cachedUserId = localStorage.getItem(cacheUserIdKey);
      
      // ✅ Check if cache is valid
      if (cachedJobs && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        const isCacheValid = now - timestamp < CACHE_DURATION;
        const isUserMatching = (!user && !cachedUserId) || (user && cachedUserId === user.id);
        
        if (isCacheValid && isUserMatching) {
          try {
            const parsedJobs = JSON.parse(cachedJobs);
            setJobs(parsedJobs);
            setLoading(false);
            
            // ✅ CRITICAL FIX: Don't re-process matches for cached jobs!
            // The cached jobs already have match scores calculated
            return;
          } catch (error) {
            console.error('Error parsing cached jobs:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error checking job cache:', error);
    }

    // ✅ Only fetch if cache was invalid or missing
    if (user && userOnboardingData !== null) {
      fetchJobs();
    } else if (user && userOnboardingData === null) {
      return;
    } else {
      fetchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, activeTab, user, userOnboardingData]);

  // ✅ MODIFIED: Only fetch matches when user switches to Matches tab
  useEffect(() => {
    if (!authChecked || activeTab !== 'matches') {
      return;
    }

    // Check if matches are already loaded
    if (jobs.length > 0) {
      return;
    }

    const cachedJobsKey = 'jobs_cache';
    const cacheTimestampKey = 'jobs_cache_timestamp';
    const cacheUserIdKey = 'jobs_cache_user_id';
    
    try {
      const cachedJobs = localStorage.getItem(cachedJobsKey);
      const cacheTimestamp = localStorage.getItem(cacheTimestampKey);
      const cachedUserId = localStorage.getItem(cacheUserIdKey);
      
      // ✅ Check if cache is valid
      if (cachedJobs && cacheTimestamp) {
        const timestamp = parseInt(cacheTimestamp, 10);
        const now = Date.now();
        const isCacheValid = now - timestamp < CACHE_DURATION;
        const isUserMatching = (!user && !cachedUserId) || (user && cachedUserId === user.id);

        if (isCacheValid && isUserMatching) {
          const parsedCachedJobs = JSON.parse(cachedJobs);
          setJobs(parsedCachedJobs);
          console.log(`Loaded ${parsedCachedJobs.length} jobs from cache for user ${user?.id || 'anonymous'}`);
          return;
        }
      }

      // ✅ If no valid cache, fetch fresh data
      fetchJobs();
    } catch (error) {
      console.error('Error loading cached jobs:', error);
      fetchJobs();
    }
  }, [authChecked, activeTab, user]);

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

  // ✅ OPTIMIZATION: Improved processJobsWithMatching - removed unnecessary localStorage operations
  const processJobsWithMatching = useCallback(async (jobRows: any[]): Promise<JobUI[]> => {
    if (!userOnboardingData || !user) {
      return jobRows.map((job: any) => transformJobToUI(job, 0, null));
    }

    const matchCache = matchCacheService.loadMatchCache(user.id);
    let cacheNeedsUpdate = false;
    const updatedCache = { ...matchCache };

    // ✅ OPTIMIZATION: Process in batches to avoid blocking
    const batchSize = 20; // Increased batch size for better performance
    const processedJobs: JobUI[] = [];

    for (let i = 0; i < jobRows.length; i += batchSize) {
      const batch = jobRows.slice(i, i + batchSize);
      
      const batchResults = batch.map((job: any) => {
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
      });

      processedJobs.push(...batchResults);

      // ✅ Yield to main thread between batches
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

    const getRelativeTime = (dateString: string | null): string | undefined => {
      if (!dateString) return undefined;
      
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
        return undefined;
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
      postedDate: getRelativeTime(job.posted_date || job.created_at),
      sector: job.sector || '',
      description: job.description || job.job_description || '',
    };
  };

  // ✅ NEW: Fetch latest jobs without matching (for Latest Jobs tab)
  const fetchLatestJobs = async (page: number = 1) => {
    try {
      setLatestJobsLoading(true);
      
      // Fetch from database
      const start = (page - 1) * JOBS_PER_PAGE;
      const end = start + JOBS_PER_PAGE - 1;
      
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('posted_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(start, end);
      
      // Apply filters to the query
      
      // Search filter - search in title, company name, description, and sector
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sector.ilike.%${searchTerm}%`);
      }
      
      // Sector filter
      if (filters.sector) {
        if (Array.isArray(filters.sector) && filters.sector.length > 0) {
          query = query.in('sector', filters.sector);
        } else if (typeof filters.sector === 'string' && filters.sector !== '') {
          query = query.eq('sector', filters.sector);
        }
      }
      
      // Role filter (if applicable)
      if (filters.role && filters.role.length > 0) {
        query = query.in('role', filters.role);
      }
      
      // Employment type filter (jobType in your schema)
      if (filters.jobType && filters.jobType.length > 0) {
        query = query.in('employment_type', filters.jobType);
      }
      
      // Location filter - state
      if (filters.state) {
        query = query.contains('location', { state: filters.state });
      }
      
      // Location filter - town/city
      if (filters.town) {
        query = query.contains('location', { city: filters.town });
      }
      
      // Remote filter
      if (filters.workMode && filters.workMode.includes('Remote')) {
        query = query.contains('location', { remote: true });
      }
      
      // Salary range filter
      if (filters.salaryRange && filters.salaryRange.enabled) {
        if (filters.salaryRange.min > 0) {
          query = query.gte('salary_range->min', filters.salaryRange.min);
        }
        if (filters.salaryRange.max > 0) {
          query = query.lte('salary_range->max', filters.salaryRange.max);
        }
      }
      
      // Filter for today's jobs if posted=today
      const postedParam = searchParams.get('posted');
      if (postedParam === 'today') {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        query = query.gte('posted_date', todayStr);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} jobs with filters applied`);

      // Transform to UI format without matching calculation
      const uiJobs = (data || []).map((job: any) => transformJobToUI(job, 0, null));
      
      // Update state
      if (page === 1) {
        setLatestJobs(uiJobs);
      } else {
        setLatestJobs(prev => [...prev, ...uiJobs]);
      }
      
      setLatestJobsHasMore(uiJobs.length === JOBS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching latest jobs:', error);
    } finally {
      setLatestJobsLoading(false);
    }
  };

  // ✅ OPTIMIZATION: Fetch only 100 latest jobs per page
  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(0, JOBS_PER_PAGE - 1); // ✅ Limit to 100 jobs

      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} latest active jobs`);

      const processedJobs = await processJobsWithMatching(data || []);
      
      // ✅ Sort by match score (default sorting)
      processedJobs.sort((a, b) => (b.calculatedTotal || 0) - (a.calculatedTotal || 0));

      // ✅ OPTIMIZATION: Cache with user ID to prevent wrong cache usage
      try {
        localStorage.setItem('jobs_cache', JSON.stringify(processedJobs));
        localStorage.setItem('jobs_cache_timestamp', Date.now().toString());
        localStorage.setItem('jobs_cache_user_id', user?.id || '');
        
        console.log(`Cached ${processedJobs.length} jobs for user ${user?.id || 'anonymous'}`);
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

  const handleApply = (jobIdOrSlug: string) => {
    // Find the job from either latestJobs or jobs (matches)
    const allJobs = activeTab === 'latest' ? latestJobs : jobs;
    const job = allJobs.find(j => j.id === jobIdOrSlug || j.slug === jobIdOrSlug);
    
    // Navigate to job detail page using slug if available, otherwise use id
    const slug = job?.slug || jobIdOrSlug;
    router.push(`/jobs/${slug}`);
  };



  const handleRefreshMatches = async () => {
    setRefreshingMatches(true);
    
    try {
      // Clear all cached data
      localStorage.removeItem('jobs_cache');
      localStorage.removeItem('jobs_cache_timestamp');
      localStorage.removeItem('jobs_cache_user_id');
      
      // Clear all latest_jobs cache keys
      for (let i = 1; i <= 10; i++) {
        localStorage.removeItem(`latest_jobs_page_${i}`);
        localStorage.removeItem(`latest_jobs_timestamp_${i}`);
      }
      
      // Clear match cache if user is logged in
      if (user) {
        matchCacheService.clearMatchCache(user.id);
      }
      
      // Reset states
      setLatestJobsPage(1);
      setLatestJobsHasMore(true);
      setJobs([]);
      
      // Fetch fresh data based on active tab
      if (activeTab === 'latest') {
        setLatestJobs([]);
        await fetchLatestJobs(1);
      } else {
        await fetchJobs();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshingMatches(false);
    }
  };

  const handleShowBreakdown = (job: JobUI) => {
    const breakdown = job.breakdown || {
      rolesScore: 0,
      rolesReason: '',
      skillsScore: 0,
      skillsReason: '',
      sectorScore: 0,
      sectorReason: '',
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

  // ✅ MODIFIED: Filter only applies to Latest Jobs tab
  const filteredJobs = useMemo(() => {
    // Only filter for Latest tab
    if (activeTab !== 'latest') return [];
    if (latestJobsLoading && latestJobs.length === 0) return [];
    
    // Since filtering is now done at the database level,
    // we only need to filter out applied jobs here
    return latestJobs.filter(job => {
      // Skip applied jobs
      if (appliedJobs.includes(job.id)) return false;
      return true;
    });
  }, [latestJobs, appliedJobs, latestJobsLoading, activeTab]);

  // ✅ MODIFIED: Sort only applies to Latest Jobs tab
  const sortedJobs = useMemo(() => {
    if (activeTab !== 'latest') return [];
    if (latestJobsLoading && filteredJobs.length === 0) return [];
    
    return [...filteredJobs].sort((a, b) => {
      if (sortBy === 'latest') {
        // Already sorted by latest from DB, but respect user choice
        return 0;
      } else if (sortBy === 'salary') {
        const getSalaryNumber = (salary: string) => {
          if (!salary) return 0;
          const match = salary.match(/[\d,]+/);
          return match ? parseInt(match[0].replace(/,/g, '')) : 0;
        };
        return getSalaryNumber(b.salary || '') - getSalaryNumber(a.salary || '');
      }
      return 0;
    });
  }, [filteredJobs, sortBy, latestJobsLoading, activeTab]);

  // ✅ NEW: Get jobs for Matches tab (already sorted by match score)
  const matchedJobs = useMemo(() => {
    if (activeTab !== 'matches') return [];
    return jobs.filter(job => !appliedJobs.includes(job.id));
  }, [jobs, appliedJobs, activeTab]);

  // ✅ NEW: Handle infinite scroll for Latest tab
  useEffect(() => {
    if (activeTab !== 'latest') return;
    if (!latestJobsHasMore || latestJobsLoading) return;

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // Load more when user is 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        setLatestJobsPage(prev => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, latestJobsHasMore, latestJobsLoading]);

  // ✅ NEW: Fetch next page when page number changes
  useEffect(() => {
    if (latestJobsPage > 1) {
      fetchLatestJobs(latestJobsPage);
    }
  }, [latestJobsPage]);

  // ✅ NEW: Handle tab change
  const handleTabChange = (tab: 'latest' | 'matches') => {
    // Check if user is trying to access matches tab without being signed in
    if (tab === 'matches' && !user) {
      setAuthModalOpen(true);
      return;
    }
    setActiveTab(tab);
    localStorage.setItem('active_jobs_tab', tab);
  };

  // ✅ NEW: Helper functions for enhanced filter UX
  const hasActiveFilters = () => {
    return (
      (filters.location && filters.location.length > 0) ||
      (filters.sector && (Array.isArray(filters.sector) ? filters.sector.length > 0 : filters.sector)) ||
      (filters.role && filters.role !== '') ||
      (filters.state && filters.state !== '') ||
      (filters.town && filters.town !== '') ||
      (filters.jobType && filters.jobType.length > 0) ||
      (filters.workMode && filters.workMode.length > 0) ||
      (filters.employmentType && filters.employmentType.length > 0) ||
      filters.salaryRange ||
      filters.remote ||
      filters.search
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.location?.length) count += filters.location.length;
    if (Array.isArray(filters.sector) && filters.sector.length) count += filters.sector.length;
    else if (typeof filters.sector === 'string' && filters.sector) count += 1;
    if (filters.role) count += 1;
    if (filters.state) count += 1;
    if (filters.town) count += 1;
    if (filters.jobType?.length) count += filters.jobType.length;
    if (filters.workMode?.length) count += filters.workMode.length;
    if (filters.employmentType?.length) count += filters.employmentType.length;
    if (filters.salaryRange) count += 1;
    if (filters.remote) count += 1;
    if (filters.search) count += 1;
    return count;
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      search: '',
      location: [] as string[],
      sector: [] as string[] | string,
      role: '' as string,
      state: '' as string,
      town: '' as string,
      jobType: [] as string[],
      workMode: [] as string[],
      employmentType: [] as string[],
      salaryRange: undefined,
      remote: false,
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    
    // Clear URL parameters
    const params = new URLSearchParams();
    if (sortBy !== 'latest') {
      params.set('sort', sortBy);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl);
  };

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
        {/* Header removed as requested */}

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



        {/* ✅ NEW: Tabs Section */}
        {/* Header Section */}
        <div className="px-6 pt-6 pb-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
              Find Your Next Opportunity
            </h1>
            <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
              Browse the latest job openings
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="px-6 pb-2">
          <div className="flex gap-1 border-b" style={{ borderColor: theme.colors.border.DEFAULT }}>
            <button
              onClick={() => handleTabChange('latest')}
              className="flex-1 px-6 py-3 font-medium transition-all relative rounded-t-lg text-center"
              style={{
                color: activeTab === 'latest' ? '#2563EB' : theme.colors.text.secondary,
                backgroundColor: activeTab === 'latest' ? '#EFF6FF' : 'transparent',
                borderBottom: activeTab === 'latest' ? '2px solid #2563EB' : '2px solid transparent',
              }}
            >
              Latest Jobs
            </button>
            <button
              onClick={() => handleTabChange('matches')}
              className="flex-1 px-6 py-3 font-medium transition-all relative rounded-t-lg text-center"
              style={{
                color: activeTab === 'matches' ? '#059669' : theme.colors.text.secondary,
                backgroundColor: activeTab === 'matches' ? '#D1FAE5' : 'transparent',
                borderBottom: activeTab === 'matches' ? '2px solid #059669' : '2px solid transparent',
              }}
            >
              Matches
            </button>
          </div>
        </div>

        {/* Search Bar and Filters - Only show for Latest tab */}
        {activeTab === 'latest' && (
          <div className="px-6 py-6 space-y-5">
            {/* Enhanced Search Bar */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-focus-within:opacity-30 transition-opacity blur"></div>
              <Search 
                size={22} 
                className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-blue-500 z-10"
                style={{ color: theme.colors.primary.DEFAULT }}
              />
              <input
                type="text"
                placeholder="Search by job title, company, or keywords..."
                value={filters.search}
                onChange={(e) => {
                  const newSearch = e.target.value;
                  setFilters(prev => ({ ...prev, search: newSearch }));
                  setSearchQuery(newSearch);
                  
                  const params = new URLSearchParams(searchParams.toString());
                  if (newSearch) {
                    params.set('search', newSearch);
                  } else {
                    params.delete('search');
                  }
                  const queryString = params.toString();
                  const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
                  router.replace(newUrl);
                }}
                className="relative w-full pl-14 pr-14 py-5 rounded-xl border-2 outline-none focus:ring-0 focus:border-blue-500 transition-all text-base font-medium shadow-lg hover:shadow-xl z-10"
                style={{
                  backgroundColor: theme.colors.background.DEFAULT,
                  borderColor: theme.colors.primary.DEFAULT,
                  color: theme.colors.text.primary,
                }}
              />
              {filters.search && (
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, search: '' }));
                    setSearchQuery('');
                    
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('search');
                    const queryString = params.toString();
                    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
                    router.replace(newUrl);
                  }}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 hover:bg-gray-100 rounded-full transition-all hover:scale-110 z-10"
                  style={{ backgroundColor: theme.colors.primary.DEFAULT + '10' }}
                >
                  <X size={20} style={{ color: theme.colors.primary.DEFAULT }} />
                </button>
              )}
            </div>
            
            {/* Enhanced Filter and Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Quick Filters & Advanced Filters Button */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Quick Filter Chips */}
                <div className="flex items-center gap-2 flex-wrap">

                  
                  {filters.remote && (
                    <span 
                      className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full border border-purple-200"
                      style={{ backgroundColor: '#9333EA15', color: '#9333EA' }}
                    >
                      Remote
                    </span>
                  )}
                  
                  {filters.employmentType && filters.employmentType.length > 0 && (
                    <span 
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200"
                      style={{ backgroundColor: theme.colors.primary.DEFAULT + '15', color: theme.colors.primary.DEFAULT }}
                    >
                      {filters.employmentType[0]}
                    </span>
                  )}
                  
                  {filters.location && filters.location.length > 0 && (
                    <span 
                      className="px-3 py-1.5 text-xs font-medium bg-teal-100 text-teal-700 rounded-full border border-teal-200"
                      style={{ backgroundColor: '#14B8A615', color: '#0D9488' }}
                    >
                      {filters.location[0]}
                    </span>
                  )}
                  
                  {filters.sector && filters.sector.length > 0 && (
                    <span 
                      className="px-3 py-1.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full border border-orange-200"
                      style={{ backgroundColor: '#F9731615', color: '#EA580C' }}
                    >
                      {filters.sector[0]}
                    </span>
                  )}
                </div>

                {/* Advanced Filters Button */}
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                  style={{
                    backgroundColor: hasActiveFilters() ? theme.colors.primary.DEFAULT + '10' : theme.colors.background.DEFAULT,
                    borderColor: hasActiveFilters() ? theme.colors.primary.DEFAULT : theme.colors.border.DEFAULT,
                  }}
                >
                  <SlidersHorizontal size={16} />
                  <span className="font-medium text-sm">Filters</span>
                  {hasActiveFilters() && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                      {getActiveFilterCount()}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Sort Control */}
              <div className="flex items-center gap-2">
                {/* Sort Badge */}
                <div className="relative">
                  <button
                    onClick={() => {
                      const newSortBy = sortBy === 'latest' ? 'salary' : 'latest';
                      setSortBy(newSortBy);
                      
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('sort', newSortBy);
                      
                      const queryString = params.toString();
                      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
                      router.replace(newUrl);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <ArrowUpDown size={12} />
                    {sortBy === 'latest' ? 'Most Recent' : 'Highest Salary'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Results Count and Clear Filters */}
            <div className="flex items-center justify-between">
              {!latestJobsLoading && hasActiveFilters() && (
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
              
              {refreshingMatches && (
                <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.text.secondary }}>
                  <RefreshCw size={14} className="animate-spin" />
                  Refreshing...
                </div>
              )}
            </div>

        {/* Filters Modal */}
        <JobFilters
          filters={filters}
          onFiltersChange={(newFilters: any) => {
            setFilters(newFilters);
            
            const params = new URLSearchParams();
            
            if (newFilters.search) {
              params.set('search', newFilters.search);
            }
            
            if (newFilters.sector) {
              params.set('sector', newFilters.sector);
            }
            
            if (newFilters.role) {
              params.set('role', newFilters.role);
            }
            
            if (newFilters.state) {
              params.set('state', newFilters.state);
            }
            
            if (newFilters.town) {
              params.set('town', newFilters.town);
            }
            
            if (newFilters.jobType && newFilters.jobType.length > 0) {
              params.set('jobType', newFilters.jobType.join(','));
            }
            
            if (newFilters.workMode && newFilters.workMode.length > 0) {
              params.set('workMode', newFilters.workMode.join(','));
            }
            
            if (newFilters.salaryRange && newFilters.salaryRange.enabled) {
              if (newFilters.salaryRange.min > 0) {
                params.set('salaryMin', newFilters.salaryRange.min.toString());
              }
              if (newFilters.salaryRange.max > 0) {
                params.set('salaryMax', newFilters.salaryRange.max.toString());
              }
            }
            
            if (sortBy !== 'latest') {
              params.set('sort', sortBy);
            }
            
            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
            router.replace(newUrl);
          }}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen(!filtersOpen)}
        />
          </div>
        )}

        {/* ✅ ENHANCED: Matches Tab Header */}
        {activeTab === 'matches' && (
          <div className="px-6 py-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1" style={{ color: theme.colors.text.primary }}>
                    Your Personalized Matches
                  </h3>
                  <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        Calculating your match scores...
                      </span>
                    ) : (
                      <>
                        Found <span className="font-semibold text-green-600">{matchedJobs.length}</span> job{matchedJobs.length !== 1 ? 's' : ''} that match your profile
                      </>
                    )}
                  </p>
                  {!loading && matchedJobs.length > 0 && (
                    <p className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>
                      Jobs are sorted by how well they match your skills, experience, and preferences
                    </p>
                  )}
                </div>
                {user && (
                  <button
                    onClick={handleRefreshMatches}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all"
                    disabled={refreshingMatches}
                  >
                    <RefreshCw size={14} className={refreshingMatches ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ NEW: Job List - Conditional rendering based on active tab */}
        <div className="px-6 py-4">
          {/* Latest Jobs Tab */}
          {activeTab === 'latest' && (
            <>
              {latestJobsLoading && latestJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p style={{ color: theme.colors.text.secondary }}>Finding the latest jobs for you...</p>
                </div>
              ) : sortedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search size={24} style={{ color: theme.colors.text.muted }} />
                  </div>
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    {filters.search ? 'No matching jobs found' : 'No jobs available'}
                  </h3>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {filters.search 
                      ? 'Try adjusting your search terms or filters to find more opportunities'
                      : 'Check back later for new job postings'
                    }
                  </p>
                  {hasActiveFilters() && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {sortedJobs.map((job) => (
                    <React.Fragment key={job.id}>
                      <JobCard
                        job={job}
                        savedJobs={savedJobs}
                        appliedJobs={appliedJobs}
                        onSave={handleSave}
                        onApply={handleApply}
                        onShowBreakdown={handleShowBreakdown}
                        showMatch={false}
                      />
                    </React.Fragment>
                  ))}
                  {latestJobsLoading && (
                    <div className="flex items-center justify-center py-6">
                      <p style={{ color: theme.colors.text.secondary }}>Loading more jobs...</p>
                    </div>
                  )}
                  {!latestJobsHasMore && latestJobs.length > 0 && (
                    <div className="flex items-center justify-center py-6">
                      <p style={{ color: theme.colors.text.secondary }}>No more jobs to load</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-3 border-gray-200 border-t-green-500 rounded-full animate-spin mb-4"></div>
                  <p style={{ color: theme.colors.text.secondary }}>Analyzing jobs for your perfect match...</p>
                </div>
              ) : matchedJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                    <Search size={24} style={{ color: theme.colors.warning }} />
                  </div>
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ color: theme.colors.text.primary }}
                  >
                    No matches found yet
                  </h3>
                  <p 
                    className="text-sm mb-4"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {user 
                      ? 'Update your profile to improve matching or check back later for new opportunities'
                      : 'Create an account to get personalized job matches based on your profile'
                    }
                  </p>
                  {user ? (
                    <button
                      onClick={() => router.push('/onboarding')}
                      className="px-4 py-2 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium"
                    >
                      Update Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setAuthModalOpen(true)}
                      className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      Sign Up Free
                    </button>
                  )}
                </div>
              ) : (
                matchedJobs.map((job) => (
                  <React.Fragment key={job.id}>
                    <JobCard
                      job={job}
                      savedJobs={savedJobs}
                      appliedJobs={appliedJobs}
                      onSave={handleSave}
                      onApply={handleApply}
                      onShowBreakdown={handleShowBreakdown}
                      showMatch={true}
                    />
                  </React.Fragment>
                ))
              )}
            </>
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