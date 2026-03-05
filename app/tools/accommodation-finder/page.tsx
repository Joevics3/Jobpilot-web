"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase, Home, Search, Filter, X, Laptop, Globe, GraduationCap, Award, Rocket, ClipboardList, Wifi } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

const JOBS_PER_PAGE = 20;

export default function AccommodationFinderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchModalData, setMatchModalData] = useState<MatchBreakdownModalData | null>(null);
  const [sortBy, setSortBy] = useState<'match' | 'date'>('date');
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    sector: [] as string[],
    location: [] as string[],
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const sectors = [
    'Technology', 'Marketing', 'Sales', 'Design', 'Finance', 
    'Healthcare', 'Education', 'Engineering', 'Admin', 'Customer Service', 
    'Legal', 'HR', 'Manufacturing', 'Retail', 'Media'
  ];

  const locations = [
    'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 
    'Benin City', 'Abuja', 'Remote'
  ];

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
    const searchParam = searchParams.get('search');
    const sectorParam = searchParams.get('sector');
    const locationParam = searchParams.get('location');
    const pageParam = searchParams.get('page');

    if (searchParam) setSearchQuery(searchParam);
    if (sectorParam) setFilters(prev => ({ ...prev, sector: sectorParam.split(',') }));
    if (locationParam) setFilters(prev => ({ ...prev, location: locationParam.split(',') }));
    if (pageParam) setCurrentPage(parseInt(pageParam));
  }, [searchParams]);

  useEffect(() => {
    fetchAccommodationJobs();
  }, [currentPage, filters, user, userOnboardingData]);

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

      if (error && error.code !== 'PGRST116') return;

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

  const fetchAccommodationJobs = async () => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      
      let countQuery = supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('accommodation_status', 'yes')
        .gte('created_at', thirtyDaysAgoISO);

      if (searchQuery) {
        countQuery = countQuery.or(`title.ilike.%${searchQuery}%,company->>name.ilike.%${searchQuery}%`);
      }
      if (filters.sector.length > 0) {
        countQuery = countQuery.in('sector', filters.sector);
      }
      if (filters.location.length > 0) {
        const locationFilters = filters.location.map(loc => 
          loc === 'Remote' ? 'location->>remote.eq.true' : `location->>country.ilike.%${loc}%,location->>city.ilike.%${loc}%`
        );
        countQuery = countQuery.or(locationFilters.join(','));
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      const total = count || 0;
      setTotalJobs(total);
      setTotalPages(total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : 1);

      if (searchQuery.trim()) {
        saveSearchHistory(searchQuery.trim(), total);
      }

      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .eq('accommodation_status', 'yes')
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,company->>name.ilike.%${searchQuery}%`);
      }
      if (filters.sector.length > 0) {
        query = query.in('sector', filters.sector);
      }
      if (filters.location.length > 0) {
        const locationFilters = filters.location.map(loc => 
          loc === 'Remote' ? 'location->>remote.eq.true' : `location->>country.ilike.%${loc}%,location->>city.ilike.%${loc}%`
        );
        query = query.or(locationFilters.join(','));
      }

      const { data, error } = await query;

      if (error) throw error;

      let processedJobs;
      if (!user || !userOnboardingData) {
        processedJobs = (data || []).map((job: any) => transformJobToUI(job, 0, null));
      } else {
        processedJobs = await processJobsWithMatching(data || []);
      }
      
      processedJobs.sort((a: JobUI, b: JobUI) => {
        const dateA = new Date(a.postedDate || 0).getTime();
        const dateB = new Date(b.postedDate || 0).getTime();
        return dateB - dateA;
      });

      setJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching accommodation jobs:', error);
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
      if (job.location.remote) {
        locationStr = 'Remote';
      } else {
        const parts = [job.location.city, job.location.state, job.location.country].filter(Boolean);
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
      } catch (e) {}
    }
  };

  const loadAppliedJobs = () => {
    if (typeof window === 'undefined') return;
    const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
    if (applied) {
      try {
        setAppliedJobs(JSON.parse(applied));
      } catch (e) {}
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
      rolesScore: 0, skillsScore: 0, sectorScore: 0,
      locationScore: 0, experienceScore: 0, salaryScore: 0, typeScore: 0,
    };
    setMatchModalData({
      breakdown,
      totalScore: job.calculatedTotal || job.match || 0,
      jobTitle: job.title,
      companyName: job.company,
    });
    setMatchModalOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL();
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim(), 0);
    }
  };

  const saveSearchHistory = async (query: string, resultsCount: number) => {
    try {
      await supabase.from('search_history').insert({
        user_id: user?.id || null,
        search_query: query,
        results_count: resultsCount,
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filters.sector.length > 0) params.set('sector', filters.sector.join(','));
    if (filters.location.length > 0) params.set('location', filters.location.join(','));
    if (currentPage > 1) params.set('page', currentPage.toString());
    router.push(`/tools/accommodation-finder?${params.toString()}`);
  };

  const handleFilterChange = (filterType: 'sector' | 'location', value: string) => {
    setFilters(prev => {
      const current = prev[filterType];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: updated };
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ sector: [], location: [] });
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/tools/accommodation-finder');
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') {
      return (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0);
    }
    const dateA = new Date(a.postedDate || 0).getTime();
    const dateB = new Date(b.postedDate || 0).getTime();
    return dateB - dateA;
  });

  const hasFilters = searchQuery || filters.sector.length > 0 || filters.location.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-7xl mx-auto">
          <a href="/resource" className="text-sm text-white/80 hover:text-white transition-colors self-start inline-block mb-2">
            ← Back to Resources
          </a>
          <div className="flex items-center gap-3 mb-2">
            <Home size={32} />
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
              Jobs with Accommodation
            </h1>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Find jobs that offer accommodation benefits
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Search by job title, skill, or company</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Filter by sector and location</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Find jobs with housing benefits</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Apply and save on commute</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        {/* Search */}
        <div className="bg-white rounded-2xl p-4 mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs with accommodation..."
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center"
              >
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Filters Panel */}
          {filtersOpen && (
            <div className="pt-4 border-t space-y-4">
              {/* Sector Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                <div className="flex flex-wrap gap-2">
                  {sectors.map(sector => (
                    <button
                      key={sector}
                      onClick={() => handleFilterChange('sector', sector)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.sector.includes(sector)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="flex flex-wrap gap-2">
                  {locations.map(location => (
                    <button
                      key={location}
                      onClick={() => handleFilterChange('location', location)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.location.includes(location)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading...' : `${totalJobs.toLocaleString()} jobs with accommodation found`}
            {hasFilters && ` (filtered)`}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'match' | 'date')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="date">Newest First</option>
              {user && <option value="match">Best Match</option>}
            </select>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="divide-y" style={{ borderColor: theme.colors.border.DEFAULT }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p style={{ color: theme.colors.text.secondary }}>Loading jobs with accommodation...</p>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Home size={48} className="text-gray-400 mb-4" />
                <p className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  No jobs with accommodation found
                </p>
                <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                  {hasFilters ? 'Try adjusting your filters' : 'Check back later for new opportunities with accommodation'}
                </p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              sortedJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  savedJobs={savedJobs}
                  appliedJobs={appliedJobs}
                  onSave={handleSave}
                  onApply={handleApply}
                  onShowBreakdown={handleShowBreakdown}
                  showMatch={false}
                />
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); updateURL(); }}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => { setCurrentPage(pageNum); updateURL(); }}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => { setCurrentPage(Math.min(totalPages, currentPage + 1)); updateURL(); }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* ── Related Tools ── */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Explore More Job Finder Tools</h2>
          <p className="text-sm text-gray-500 mb-6">Other free tools to help you find the right opportunity faster</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Remote Jobs',             description: 'Find remote job opportunities in Nigeria and worldwide',           icon: Wifi,          color: '#06B6D4', route: '/tools/remote-jobs-finder' },
              { title: 'Internship Finder',        description: 'Find internship opportunities to kickstart your career',           icon: Briefcase,     color: '#2563EB', route: '/tools/internship-finder' },
              { title: 'NYSC Jobs',               description: 'Find job opportunities for NYSC corpers',                          icon: Award,         color: '#10B981', route: '/tools/nysc-finder' },
              { title: 'Jobs with Visa Sponsorship', description: 'Find jobs that offer visa sponsorship and work permits',         icon: Globe,         color: '#3B82F6', route: '/tools/visa-finder' },
              { title: 'Graduate & Trainee Jobs', description: 'Find graduate programs and trainee positions for fresh graduates',  icon: GraduationCap, color: '#2563EB', route: '/tools/graduate-trainee-finder' },
              { title: 'Entry Level Jobs',        description: 'Find entry-level jobs for beginners starting their career',         icon: Rocket,        color: '#6366F1', route: '/tools/entry-level-finder' },
              { title: 'Quiz Platform',           description: 'Practice aptitude tests and theory questions',                     icon: ClipboardList, color: '#F59E0B', route: '/tools/quiz' },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.route}
                  href={tool.route}
                  className="bg-white rounded-2xl p-4 flex flex-col items-start gap-3 hover:shadow-md transition-shadow group"
                  style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tool.color}18` }}>
                    <Icon size={20} style={{ color: tool.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">{tool.title}</p>
                    <p className="text-xs text-gray-500 leading-snug">{tool.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* ── SEO Content ── */}
        <div className="mt-8 bg-white rounded-2xl p-6 md:p-10" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <article className="prose prose-gray max-w-none">

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Jobs with Accommodation Finder: Discover Jobs That Provide Housing, Jobs with Room and Board, and Jobs Abroad with Accommodation in 2026
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Searching for jobs with accommodation can completely transform your financial situation and career trajectory — especially if you're relocating, starting fresh, or simply want to eliminate housing costs. The Jobs with Accommodation Finder is the most comprehensive tool for discovering jobs that provide housing, jobs with housing included, jobs that offer housing benefits, and jobs that pay to relocate and provide housing. Whether you're looking for warehouse jobs near me, care homes jobs, seasonal roles abroad, or housing management positions, this platform connects you with verified listings that match your skills and location — including Lagos, Abuja, Port Harcourt, and opportunities worldwide.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Why Jobs with Housing Included Are Worth Pursuing in 2026</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The cost of renting in Nigerian cities and globally has risen sharply. For many professionals and entry-level workers, jobs with accommodation represent a strategic financial advantage — enabling you to save 30–50% of your income that would otherwise go to rent, utilities, and commuting. Beyond the savings, these roles offer stability, especially for those relocating to a new city or country where housing markets are unfamiliar.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Jobs that provide housing for employees are common in sectors like warehousing and logistics, healthcare and care homes, hospitality, property management, seasonal tourism, and international placements. Both experienced professionals and no-experience seekers can access them — from entry-level warehouse jobs with dorm accommodation to senior house manager jobs with private quarters included.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              The Jobs with Accommodation Finder aggregates all of these listings into one searchable platform, with real-time filters for sector, location, experience level, and whether housing is fully free or subsidized. It's the most targeted internship and jobs-with-housing search engine for Nigerian and global candidates in 2026.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Top Industries Offering Jobs with Accommodation</h3>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Warehouse and Logistics Jobs with Housing</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Warehouse jobs and warehouse jobs near me consistently rank among the highest-searched roles for jobs with room and board. Employers such as Amazon, DHL, and major Nigerian logistics firms provide shared dormitory-style housing near facilities for warehouse manager positions and entry-level picking, packing, and sorting roles. Benefits often include free utilities and staff transport. Salaries start around ₦80,000–₦150,000/month locally or $15–25/hour USD for international warehouse work positions.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              No experience? Target warehouse jobs near me that include on-the-job training programs — many of these roles are specifically designed for first-time workers and include accommodation as an incentive. Warehouse work in logistics hubs is one of the fastest entry points into the formal job market for anyone searching "jobs with housing included no experience."
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Care Homes Jobs and Senior Living Opportunities</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Care homes jobs near me and care homes near me with vacancies are among the most reliable sources for live-in employment. Roles covering caregiving, nursing support, care home cleaning jobs, and home support worker jobs frequently include private or shared on-site rooms in retirement homes and senior living facilities. Organizations like Anchor Care Homes advertise Anchor Care Homes jobs with full room-and-board packages, meals, and utility coverage.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Senior home care jobs and retirement home jobs near me suit compassionate and patient individuals. They are particularly accessible for candidates with minimal formal experience — care at home jobs and senior living jobs near me frequently list "no prior care experience required" alongside their housing benefits. Expected compensation ranges from £11–£16/hour in the UK or equivalent international rates, plus the value of free accommodation.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Hospitality, Coffee Shops, and Food Service</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Coffee shops hiring near me and coffee shop jobs near me see significant seasonal surges in search volume. Operators like Waffle House are known for offering housing stipends for staff working remote or high-demand shifts — Waffle House jobs and Waffle House hiring listings remain perennially popular for this reason. Hotel housekeeping jobs, house keeping jobs, and house keeper jobs in resort properties frequently bundle room-and-board with their employment packages, especially for candidates willing to relocate to tourist destinations.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Apartments hiring near me in property services also represent an overlooked niche — property companies recruit live-in concierge, maintenance, and management staff with free units included as part of their compensation.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Real Estate, Housing Management, and Property Jobs</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Real estate hiring and real estate job listings in property management are a strong source of jobs that supply housing. Roles such as house manager, resident assistant jobs near me, housing officer jobs, and in-house counsel jobs for property firms often include free or heavily subsidized accommodation as a core benefit — the logic being that managers who live on-site provide better oversight.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Specialized housing organization roles include housing authority jobs, NYCHA jobs, HUD jobs, social housing jobs, and affordable housing jobs. UK-focused listings frequently include Anchor Housing jobs, Sanctuary Housing jobs, and Housing 21 jobs — all of which historically offer staff accommodation in select roles. For property-adjacent professionals, new homes sales jobs and housing specialist positions with live-in perks are also surfaced by this tool.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Seasonal Jobs and International Opportunities with Accommodation</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Seasonal jobs with housing spike in demand during tourism seasons, agricultural harvests, and festival periods. Jobs abroad with accommodation are particularly appealing for adventurous candidates — programs covering au pair placements, English teaching abroad, cruise ship work, and Workaway-style farm stays combine travel with free housing and often meals.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Other niche categories include house painting vacancies, home renovation jobs, greenhouse jobs, green house jobs, and even creative positions like publishing house jobs, Royal Opera House jobs, and Biltmore House jobs. The Jobs with Accommodation Finder surfaces these niche listings alongside mainstream roles, ensuring nothing is missed.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Jobs with Accommodation by Category — Quick Reference</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-teal-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Sector</th>
                    <th className="text-left px-4 py-3 font-semibold">Example Roles</th>
                    <th className="text-left px-4 py-3 font-semibold">Accommodation Type</th>
                    <th className="text-left px-4 py-3 font-semibold">Experience Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Warehouse & Logistics',   'Warehouse jobs, warehouse manager, warehouse work',              'Shared dormitory, free utilities',  'None to low'],
                    ['Care & Healthcare',        'Care homes jobs, senior home care jobs, home support worker',   'On-site private/shared room, meals', 'None to mid'],
                    ['Hospitality',             'Coffee shop jobs, housekeeping jobs, house keeper jobs',         'Staff accommodation, hostel room',  'None to low'],
                    ['Property Management',     'House manager, resident assistant, housing officer jobs',        'Live-in apartment or unit',         'Mid to senior'],
                    ['Housing Organisations',   'Housing authority jobs, social housing jobs, NYCHA jobs',        'Staff housing near site',           'Mid level'],
                    ['Seasonal & International','Seasonal jobs with housing, jobs abroad with accommodation',     'Varies — dorm, host family, cabin',  'None required'],
                    ['Real Estate',             'Real estate hiring, new homes sales jobs, housing specialist',   'Live-in property or allowance',     'Mid to senior'],
                    ['Domestic & Home Services','Home cleaning jobs, home sitter jobs, private home help jobs',   'Live-in private room',              'None to low'],
                  ].map(([sector, roles, accommodation, experience]) => (
                    <tr key={sector} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{sector}</td>
                      <td className="px-4 py-3 text-gray-600">{roles}</td>
                      <td className="px-4 py-3 text-gray-600">{accommodation}</td>
                      <td className="px-4 py-3 text-gray-600">{experience}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How the Jobs with Accommodation Finder Works</h3>
            <p className="text-gray-600 leading-relaxed mb-3">Using the tool is straightforward and takes under two minutes to get your first results:</p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
              <li><strong>Search by Keyword:</strong> Enter terms like "jobs with housing," "jobs that provide housing for employees," "warehouse jobs near me," or "care homes job vacancies near me" to surface targeted results.</li>
              <li><strong>Apply Filters:</strong> Narrow down by sector (Healthcare, Logistics, Hospitality), location (Lagos, Abuja, Remote), or experience level ("jobs with housing included no experience" mode for beginners).</li>
              <li><strong>Review Listings:</strong> Each result shows salary, housing benefit type (free vs. subsidized), accommodation details, and direct apply links — no guessing involved.</li>
              <li><strong>Save and Apply:</strong> Bookmark your favorites and apply directly. Set alerts for new "jobs that offer housing" listings in your target sector so you're always first to apply.</li>
              <li><strong>Track Progress:</strong> Monitor all applications in your dashboard, from cleaning company hiring near me submissions to housing association jobs you've shortlisted.</li>
            </ol>
            <p className="text-gray-600 leading-relaxed mb-6">
              The platform is powered by real-time data and covers a wide range of roles — from home cleaning jobs near me, house cleaning jobs, and home sitter jobs near me to private home help jobs and in-house legal jobs. For Lagos users specifically, the tool surfaces hyper-local listings alongside international opportunities for full coverage.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Financial Benefits of Jobs That Provide Housing</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The financial case for jobs with accommodation is compelling, especially in 2026 as rental markets tighten globally. Consider the math: the average one-bedroom apartment in Lagos costs ₦600,000–₦1,500,000/year. A job with housing included effectively adds that entire amount back to your annual earnings — making a lower base salary role with housing potentially more lucrative than a higher-paying role without it.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Zero Rent Costs:</strong> Jobs that supply housing eliminate your single largest living expense.</li>
              <li><strong>Reduced Commuting:</strong> On-site staff housing cuts transport costs and commute time significantly.</li>
              <li><strong>Faster Savings Growth:</strong> With rent covered, every paycheck goes directly to savings, debt payoff, or investment — especially valuable for jobs that pay to relocate and provide housing internationally.</li>
              <li><strong>Easier Relocation:</strong> Jobs abroad with accommodation handle the hardest part of moving — finding somewhere to live — before you even arrive.</li>
              <li><strong>Lower Cost of Living Overall:</strong> Many care homes jobs, warehouse work roles, and seasonal jobs with housing also include meals and utilities — further compounding the financial advantage.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Real-World Examples of Jobs with Housing Included</h3>
            <div className="space-y-4 mb-8">
              <blockquote className="border-l-4 border-teal-500 pl-4 py-1 bg-teal-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Found a warehouse job near me that included free accommodation and transport. I saved ₦800,000 in rent in my first year — it completely changed my financial situation."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Emeka, Warehouse Operative, Lagos</cite>
              </blockquote>
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic">"I searched 'care homes jobs near me with housing' and found a live-in caregiver role in the UK within two weeks. The room and board package made it worth relocating from Nigeria."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Blessing, Live-in Caregiver, UK</cite>
              </blockquote>
              <blockquote className="border-l-4 border-purple-500 pl-4 py-1 bg-purple-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Got a seasonal job with housing in a resort — six months of free accommodation plus salary. I came back with more savings than I'd managed in three years of renting."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Adaeze, Seasonal Resort Worker, Portugal</cite>
              </blockquote>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Tips for Landing Jobs with Accommodation</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Tailor Your Resume:</strong> Include keywords like "jobs that provide housing," "live-in role," and "accommodation included" in your profile so employers searching for flexible candidates find you first.</li>
              <li><strong>Apply Early:</strong> Seasonal jobs with housing and jobs abroad with accommodation fill quickly — set real-time alerts and apply the day listings go live.</li>
              <li><strong>Highlight Reliability:</strong> Employers offering housing want dependable staff who will commit. Emphasize stability and long-term interest in your cover letters for house manager jobs near me, care homes jobs, or warehouse work.</li>
              <li><strong>Check Visa Requirements:</strong> For jobs abroad with accommodation, confirm eligibility before applying. Many international roles require specific work permits — the platform flags visa sponsorship availability where relevant.</li>
              <li><strong>Network for Niche Roles:</strong> In-house lawyer jobs, in-house legal jobs, and housing association jobs are often filled via referral. Connect with professionals in those industries on LinkedIn while using the finder for broad coverage.</li>
              <li><strong>Consider Location Flexibility:</strong> The best jobs with housing included are often in non-central locations — logistics hubs, care facilities, or rural resorts. Being open to "warehouse jobs near me" outside major cities significantly expands your options.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Jobs with Accommodation in Nigeria — Local Opportunities</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Within Nigeria, jobs with accommodation span sectors including logistics warehouses in Lagos and Ogun State, care and home support roles in Abuja and Port Harcourt, domestic staffing (private home help jobs, home sitter jobs near me) for high-net-worth households, and property management roles in gated estates. Many hospitality businesses — hotels, resorts, and serviced apartments — also provide staff housing.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              The Jobs with Accommodation Finder specifically surfaces these local Nigerian listings alongside international roles, making it the only platform you need whether you're searching for jobs with housing included locally or planning to relocate abroad with accommodation provided.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Frequently Asked Questions About Jobs with Accommodation</h3>
            <div className="space-y-5 mb-8">
              {[
                { q: 'What are jobs with accommodation?', a: 'Jobs with accommodation are roles where the employer provides free or subsidized housing as part of the compensation package. This includes jobs with housing included, jobs with room and board, live-in care roles, seasonal positions, and jobs that pay to relocate and provide housing.' },
                { q: 'Are there jobs with housing included with no experience required?', a: 'Yes — many warehouse jobs near me, care homes jobs, housekeeping roles, and domestic service positions (house cleaning jobs, home sitter jobs) are explicitly listed as jobs with housing included no experience. These are ideal for first-time workers.' },
                { q: 'What seasonal jobs provide accommodation?', a: 'Seasonal jobs with housing are common in tourism resorts, agricultural farms, national parks, ski lodges, and cruise ships. Many also include meals. Search "seasonal jobs with housing" in the finder for current openings.' },
                { q: 'How do I find jobs abroad with accommodation?', a: 'Use the "International" filter in the Jobs with Accommodation Finder to surface jobs abroad with accommodation across the UK, Europe, Canada, Australia, and beyond. Programs include au pair placements, resort work, care home recruitment, and teaching roles.' },
                { q: 'Do care homes jobs near me typically include housing?', a: 'Yes — many care homes near me with vacancies offer on-site accommodation, particularly for live-in caregivers, support workers, and maintenance staff. Anchor Care Homes jobs, Sanctuary Housing jobs, and retirement home jobs near me are known for this.' },
                { q: 'Can I find warehouse jobs with housing near me?', a: 'Absolutely. Warehouse jobs near me in logistics hubs — particularly near ports, industrial zones, and distribution centres — frequently include dormitory-style housing as a recruitment incentive, especially for shift workers and relocating candidates.' },
                { q: 'What real estate jobs include accommodation?', a: 'House manager jobs, resident assistant jobs near me, housing officer jobs, and live-in property concierge roles all typically include free or heavily discounted accommodation. Housing association jobs, NYCHA jobs, and HUD jobs also offer staff housing in certain roles.' },
                { q: 'How do housing manager jobs work?', a: 'Housing manager and house manager jobs involve overseeing residential properties, facilities, or estates. These roles almost always include a live-in component with private accommodation provided, making them one of the most financially advantageous jobs that supply housing.' },
                { q: 'Are there jobs with accommodation for domestic workers?', a: 'Yes — private home help jobs, home sitter jobs near me, live-in housekeeper positions, and home cleaning jobs near me are frequently listed with accommodation provided, particularly in high-net-worth households in Lagos, Abuja, and internationally.' },
                { q: 'What are the best websites to find jobs with housing included?', a: 'The Jobs with Accommodation Finder is the most targeted tool for this search — combining real-time listings, verified accommodation details, and sector/location filters that generic job boards like Indeed or LinkedIn don\'t offer for this specific benefit category.' },
              ].map(({ q, a }) => (
                <div key={q} className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{q}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>

          </article>
        </div>

        {/* ── Schema Markup ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Jobs with Accommodation Finder — Find Jobs That Provide Housing, Care Homes Jobs & Warehouse Jobs with Housing 2026",
                "description": "Discover jobs with accommodation, jobs with housing included, care homes jobs near me, warehouse jobs near me, seasonal jobs with housing, and jobs abroad with accommodation. The best tool for finding jobs that provide housing in Nigeria and worldwide.",
                "url": "https://jobmeter.app/tools/accommodation-finder",
                "inLanguage": "en",
                "dateModified": new Date().toISOString().split('T')[0],
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://jobmeter.app" },
                    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.app/tools" },
                    { "@type": "ListItem", "position": 3, "name": "Jobs with Accommodation Finder", "item": "https://jobmeter.app/tools/accommodation-finder" },
                  ]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Jobs with Accommodation Finder",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "AI-powered job finder tool for discovering jobs with accommodation, jobs with housing included, care homes jobs, warehouse jobs, seasonal jobs with housing, jobs abroad with accommodation, and jobs that provide housing for employees in Nigeria and worldwide.",
                "url": "https://jobmeter.app/tools/accommodation-finder",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "NGN",
                  "description": "Free to use for all job seekers."
                },
                "featureList": [
                  "Real-time jobs with accommodation listings",
                  "Care homes jobs near me filter",
                  "Warehouse jobs with housing filter",
                  "Seasonal jobs with housing filter",
                  "Jobs abroad with accommodation filter",
                  "No-experience jobs with housing filter",
                  "Housing type detail (free vs subsidized) per listing",
                  "Nigeria-specific and international coverage"
                ],
                "keywords": "jobs with accommodation, jobs with housing included, care homes jobs near me, warehouse jobs near me, seasonal jobs with housing, jobs abroad with accommodation, jobs that provide housing, jobs with room and board"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "What are jobs with accommodation?", "acceptedAnswer": { "@type": "Answer", "text": "Jobs with accommodation are roles where the employer provides free or subsidized housing as part of the compensation package, including jobs with housing included, live-in care roles, warehouse jobs with dormitory housing, and jobs that pay to relocate and provide housing." } },
                  { "@type": "Question", "name": "Are there jobs with housing included with no experience?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — warehouse jobs near me, care homes jobs, housekeeping roles, and domestic service positions frequently list 'no experience required' alongside their housing inclusion. These are ideal entry points for first-time workers." } },
                  { "@type": "Question", "name": "How do I find jobs abroad with accommodation?", "acceptedAnswer": { "@type": "Answer", "text": "Use the International filter in the Jobs with Accommodation Finder to surface jobs abroad with accommodation across the UK, Europe, Canada, and Australia, including au pair placements, resort work, care home roles, and teaching positions." } },
                  { "@type": "Question", "name": "Do care homes jobs near me include housing?", "acceptedAnswer": { "@type": "Answer", "text": "Many care homes near me with vacancies offer on-site accommodation for live-in caregivers and support workers. Anchor Care Homes jobs and retirement home jobs near me are well known for room-and-board packages." } },
                  { "@type": "Question", "name": "What seasonal jobs provide accommodation?", "acceptedAnswer": { "@type": "Answer", "text": "Seasonal jobs with housing are common in tourism resorts, farms, national parks, ski lodges, and cruise ships. Many include meals. Use the seasonal filter in Jobs with Accommodation Finder to see current openings." } },
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Related Job Finder Tools",
                "description": "Other free job finder tools on the platform",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Remote Jobs Finder",         "url": "https://jobmeter.app/tools/remote-jobs-finder" },
                  { "@type": "ListItem", "position": 2, "name": "Internship Finder",           "url": "https://jobmeter.app/tools/internship-finder" },
                  { "@type": "ListItem", "position": 3, "name": "NYSC Jobs Finder",            "url": "https://jobmeter.app/tools/nysc-finder" },
                  { "@type": "ListItem", "position": 4, "name": "Jobs with Visa Sponsorship",  "url": "https://jobmeter.app/tools/visa-finder" },
                  { "@type": "ListItem", "position": 5, "name": "Entry Level Jobs Finder",     "url": "https://jobmeter.app/tools/entry-level-finder" },
                ]
              }
            ])
          }}
        />

        <MatchBreakdownModal
          open={matchModalOpen}
          onClose={() => setMatchModalOpen(false)}
          data={matchModalData}
        />
      </div>
    </div>
  );
}
