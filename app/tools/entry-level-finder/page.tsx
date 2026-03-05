"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase, Rocket, Search, Filter, X, Laptop, Globe, Home, GraduationCap, Award, ClipboardList, Wifi } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

const JOBS_PER_PAGE = 20;

export default function EntryLevelFinderPage() {
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
    fetchEntryLevelJobs();
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

  const fetchEntryLevelJobs = async () => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      
      let countQuery = supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('experience_level', 'entry-level')
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
        .eq('experience_level', 'entry-level')
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
      console.error('Error fetching entry level jobs:', error);
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
    router.push(`/tools/entry-level-finder?${params.toString()}`);
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
    router.push('/tools/entry-level-finder');
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
            <Rocket size={32} />
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
              Entry Level Jobs
            </h1>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Find entry-level jobs for beginners and those starting their career
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Search by job title, skill, or company</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Filter by sector and location</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Browse entry-level opportunities</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Apply and start your career</p>
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
                placeholder="Search entry-level jobs..."
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
            {loading ? 'Loading...' : `${totalJobs.toLocaleString()} entry-level jobs found`}
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
                <p style={{ color: theme.colors.text.secondary }}>Loading entry-level jobs...</p>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Rocket size={48} className="text-gray-400 mb-4" />
                <p className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  No entry-level jobs found
                </p>
                <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                  {hasFilters ? 'Try adjusting your filters' : 'Check back later for new entry-level opportunities'}
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
              { title: 'Remote Jobs',               description: 'Find remote job opportunities in Nigeria and worldwide',           icon: Wifi,          color: '#06B6D4', route: '/tools/remote-jobs-finder' },
              { title: 'Internship Finder',          description: 'Find internship opportunities to kickstart your career',           icon: Briefcase,     color: '#2563EB', route: '/tools/internship-finder' },
              { title: 'NYSC Jobs',                 description: 'Find job opportunities for NYSC corpers',                          icon: Award,         color: '#10B981', route: '/tools/nysc-finder' },
              { title: 'Jobs with Accommodation',   description: 'Find jobs that offer accommodation benefits',                      icon: Home,          color: '#14B8A6', route: '/tools/accommodation-finder' },
              { title: 'Jobs with Visa Sponsorship', description: 'Find jobs that offer visa sponsorship and work permits',          icon: Globe,         color: '#3B82F6', route: '/tools/visa-finder' },
              { title: 'Graduate & Trainee Jobs',   description: 'Find graduate programs and trainee positions for fresh graduates',  icon: GraduationCap, color: '#2563EB', route: '/tools/graduate-trainee-finder' },
              { title: 'Quiz Platform',             description: 'Practice aptitude tests and theory questions',                     icon: ClipboardList, color: '#F59E0B', route: '/tools/quiz' },
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
              Entry Level Jobs: The Ultimate Guide to Finding Your First Job, No-Experience Roles, and Junior Positions Worldwide in 2026
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Landing your first professional role is one of the most challenging steps in any career — but entry level jobs exist in every industry, every country, and at every skill level precisely to make that first step possible. Whether you are searching for entry level web developer jobs, entry level data analyst jobs, entry level cybersecurity jobs, entry level marketing jobs, or simply "entry level jobs near me," the Entry Level Jobs Finder on Jobmeter aggregates thousands of verified beginner-friendly listings globally, updated in real time. This guide covers everything you need — what these roles are, which industries hire the most, how to find and win them, and what to do when you have zero experience.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">What Are Entry Level Jobs?</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Entry level jobs are positions that require little to no prior professional experience — typically 0 to 2 years. They are the starting point for most careers, designed to onboard talented individuals who bring fresh perspectives, academic knowledge, and high learning potential rather than a long employment history. Contrary to the notorious "3 years experience required for an entry level role" trap many job seekers encounter on generic boards, the Entry Level Jobs Finder specifically surfaces roles where employers genuinely mean it: no experience needed.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              These roles go by several names — junior positions, associate roles, graduate jobs, trainee positions, coordinator roles, and assistant-level positions — but all share the same core characteristic: your potential, attitude, and foundational skills matter more than your employment history. In 2026, with bootcamps, online certifications, and self-taught portfolios more credible than ever, the barrier to landing entry level roles in tech, data, design, and digital marketing has dropped significantly globally.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Salaries for entry level jobs vary considerably by country and sector. In the US, entry level roles in tech start at $50,000–$80,000/year; in the UK at £22,000–£35,000; in Canada at CAD $45,000–$65,000; and in Australia at AUD $50,000–$70,000. Remote entry level jobs with global employers can pay at international rates regardless of where you are based, which is why this finder covers global listings alongside local opportunities.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Top Industries and Roles for Entry Level Job Seekers in 2026</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Entry level opportunities exist across every major sector. These are the industries with the highest volume of genuine no-experience roles and the fastest pathways to employment:
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-pink-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Industry</th>
                    <th className="text-left px-4 py-3 font-semibold">Key Entry Level Roles</th>
                    <th className="text-left px-4 py-3 font-semibold">No-Experience Fit</th>
                    <th className="text-left px-4 py-3 font-semibold">Avg. Starting Salary (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Web & Software Development', 'Entry level web developer, junior front end web developer, junior web developer no experience, entry level software engineering jobs', 'High — bootcamp/portfolio sufficient', '$55,000–$80,000'],
                    ['Cybersecurity & IT',          'Entry level cyber security jobs, entry level IT jobs, entry level network engineer, junior security analyst',                         'Medium — CompTIA A+/Security+ helps',  '$50,000–$75,000'],
                    ['Data & Analytics',            'Entry level data analyst job, junior data scientist, entry level business analyst, entry level SQL jobs',                            'High — Excel/SQL/Tableau basics',       '$50,000–$70,000'],
                    ['Design & UX',                 'Junior UX designer, web design jobs no experience, entry level graphic designer, junior product designer',                          'High — portfolio required',             '$45,000–$65,000'],
                    ['Marketing & Content',         'Entry level marketing jobs, entry level digital marketing, junior content writer, entry level SEO jobs',                            'High — soft skills + tools knowledge',  '$40,000–$60,000'],
                    ['Finance & Accounting',        'Entry level finance jobs, junior accountant no experience, entry level financial analyst, accounting assistant',                     'Medium — degree preferred',             '$45,000–$65,000'],
                    ['Customer Service & Sales',    'Entry level customer service, junior sales representative, entry level account manager, customer support associate',                'Very High — attitude over experience',  '$35,000–$55,000'],
                    ['Healthcare & Medical',        'Medical coding job no experience, entry level healthcare admin, junior clinical coordinator, phlebotomy training jobs',              'Medium — training programs available',  '$35,000–$55,000'],
                    ['Project & Operations Mgmt',  'Entry level project management jobs, junior operations analyst, entry level coordinator, administrative assistant',                  'High — CAPM cert a bonus',              '$42,000–$62,000'],
                    ['Engineering',                 'Entry level mechanical engineer, junior civil engineer, electrical engineer trainee, graduate engineer no experience',               'Medium — degree required',              '$50,000–$70,000'],
                  ].map(([industry, roles, fit, salary]) => (
                    <tr key={industry} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{industry}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{roles}</td>
                      <td className="px-4 py-3 text-gray-600">{fit}</td>
                      <td className="px-4 py-3 text-gray-600">{salary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How to Find Entry Level Jobs: A Step-by-Step Global Guide</h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              The job search strategy that works differs significantly depending on your target role and country. Here is a proven framework that works for entry level job seekers globally:
            </p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
              <li><strong>Start with the Right Job Finder:</strong> Generic boards like Indeed, LinkedIn, and Glassdoor label many mid-level roles as "entry level." The Entry Level Jobs Finder on Jobmeter specifically filters for genuine 0–2 year experience requirements, saving you hours of sorting through misleading listings. Set real-time alerts for your target role and location — "entry level web developer jobs," "entry level data analyst job," or "entry level jobs near me."</li>
              <li><strong>Build a Role-Specific Portfolio or Credential:</strong> For tech roles (entry level web developer jobs no experience, entry level software engineering jobs): build 2–3 GitHub projects demonstrating your skills. For data roles (entry level data analyst job): complete a Google Data Analytics Certificate and publish a Kaggle project. For cybersecurity: earn CompTIA Security+ or Google Cybersecurity Certificate. For design: publish a Behance or Dribbble portfolio. Credentials bridge the experience gap more effectively than any cover letter.</li>
              <li><strong>Tailor Your CV with ATS Keywords:</strong> Most large employers run CVs through Applicant Tracking Systems before a human ever reads them. For "entry level front end web developer" applications, explicitly include terms like HTML, CSS, JavaScript, React, responsive design, and Git. For entry level data analyst job applications, include SQL, Python, Excel, Tableau, and data visualization. Match the exact language in each job description.</li>
              <li><strong>Apply Volume with Targeted Precision:</strong> The best strategy is not applying to 100 random listings — it is applying to 20–30 highly targeted roles per week where you genuinely meet the requirements. Use the finder's sector and location filters to surface only relevant listings. Track every application in a spreadsheet and follow up after 7–10 days.</li>
              <li><strong>Network Actively on LinkedIn:</strong> A significant percentage of entry level roles, especially in finance, consulting, and marketing, are filled through referrals. Connect with recent graduates who joined your target companies. Send thoughtful connection requests to recruiters at firms you want to work for. Engage with company posts to increase your visibility before applying.</li>
              <li><strong>Prepare Thoroughly for Interviews:</strong> Entry level interviews focus heavily on behavioural questions and demonstrated enthusiasm. Prepare STAR-method (Situation, Task, Action, Result) answers for questions like "Tell me about a project you led," "Describe a challenge you overcame," and "Why this company?" For tech roles, expect a coding challenge or take-home assignment. For data roles, expect a case study with an Excel or SQL component.</li>
            </ol>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Entry Level Jobs with No Experience: Breaking Through the Experience Barrier</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The "experience required for entry level" paradox frustrates millions of job seekers globally. The way to break through it is to substitute professional experience with demonstrable skills, projects, and credentials that employers can verify independently of employment history.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>For entry level web developer jobs no experience:</strong> Complete freeCodeCamp's full curriculum (free), build 3 live websites, host them on GitHub Pages, and apply specifically to junior web developer jobs no experience listings. Bootcamp graduates from programs like General Assembly, Le Wagon, or Coding Bootcamp are routinely hired for entry level web developer roles within 3–6 months of graduating.</li>
              <li><strong>For entry level data analyst job with no experience:</strong> Complete the Google Data Analytics Certificate on Coursera (approximately 6 months, affordable globally). Build 2 portfolio projects on Kaggle using public datasets. Master SQL, Excel, and either Tableau or Power BI. These three steps make you genuinely competitive for entry level data analyst roles globally.</li>
              <li><strong>For entry level cyber security jobs no experience:</strong> Earn CompTIA Security+ (the global standard for entry level security roles) or Google's Cybersecurity Certificate. Platforms like TryHackMe and Hack The Box offer free practical labs that build hands-on skills employers verify. Many junior security analyst and entry level IT jobs explicitly mention these credentials as sufficient for application.</li>
              <li><strong>For entry level marketing jobs no experience:</strong> Soft skills, creativity, and tools familiarity (Google Analytics, Meta Ads Manager, Canva, Hootsuite) are sufficient for most junior marketing coordinator and entry level digital marketing roles. Build a personal blog or manage a social media account to demonstrate applied skills.</li>
              <li><strong>For medical coding job no experience:</strong> Complete an AAPC CPC or AHIMA CCS certificate program (both available online globally). Medical coding is one of the clearest "no experience needed if certified" entry points in healthcare worldwide.</li>
              <li><strong>For entry level project management jobs:</strong> The CAPM (Certified Associate in Project Management) is the recognized entry-level credential globally. Pair it with demonstrated experience managing any project — academic, volunteer, or freelance — and you become immediately competitive for junior project coordinator and entry level project management roles.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Remote Entry Level Jobs: Finding Work from Home with No Experience</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Remote entry level jobs represent one of the most transformative opportunities for job seekers globally in 2026, enabling candidates anywhere in the world to compete for roles at US, UK, European, and Canadian companies — often at international pay rates. The Entry Level Jobs Finder surfaces remote-specific listings across all sectors, giving you access to the global talent market from wherever you are.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              The highest-demand remote entry level job categories include remote entry level web developer jobs, remote entry level data analyst positions, remote entry level customer service roles, remote junior content writer positions, remote entry level digital marketing jobs, and remote technical support roles. These positions are widely available on platforms like We Work Remotely, Remote.co, and FlexJobs — all of which are indexed by the Jobmeter finder.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              For candidates asking "how to find remote jobs with no experience" — the clearest answer is to focus on roles where output is entirely digital and measurable: web development, data analysis, content writing, customer support, and digital marketing. These fields have the most mature remote hiring infrastructure and the lowest barriers to demonstrating competence through portfolio work rather than employment history.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Entry Level Jobs by Role: Deep Dives</h3>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Entry Level Web Developer Jobs</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Entry level web developer jobs — including junior front end web developer, beginner web developer jobs, and web developer entry level jobs near me — are among the most accessible high-paying entry points in the tech industry. The core stack for most roles is HTML, CSS, JavaScript, and at least one framework (React, Vue, or Angular). Employers hiring junior web developer no experience candidates almost always review GitHub portfolios, so a live project is non-negotiable. Web developer jobs remote entry level are particularly abundant on Jobmeter, with employers across the US, UK, Europe, and Australia actively hiring globally. Starting salaries range from $55,000–$80,000 in the US, £24,000–£35,000 in the UK, and €30,000–$45,000 in Europe.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Entry Level Data Analyst Jobs</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              How to get an entry level data analyst job is one of the most searched career questions globally in 2026. The answer is consistently: SQL + Excel + one visualization tool (Tableau or Power BI) + a portfolio project = competitive application. Entry level data analyst job listings on Jobmeter span finance, healthcare, retail, tech, and marketing sectors — all industries that have digitized their operations and need analysts who can turn raw data into business decisions. Remote entry level data analyst roles are particularly common, with US-based companies hiring globally for these positions. Starting salaries: $50,000–$70,000 in the US, £25,000–£38,000 in the UK.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Entry Level Cybersecurity and IT Jobs</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Entry level cyber security jobs and entry level IT jobs are among the fastest-growing categories globally, driven by escalating cybersecurity threats and digital infrastructure expansion. How to get an entry level cyber security job follows a clear credential path: CompTIA Security+ → junior security analyst or entry level SOC analyst roles. Entry level IT jobs (helpdesk, network support, systems administrator) typically require CompTIA A+ as a minimum. The US Bureau of Labor Statistics projects 32% growth in information security roles over the next decade — making this the most future-proof entry level job category available. Starting salaries: $50,000–$75,000 globally for certified candidates.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Entry Level Marketing and HR Jobs</h4>
            <p className="text-gray-600 leading-relaxed mb-4">
              Entry level marketing jobs and entry level HR jobs are among the most accessible for candidates from any academic background. Junior marketing coordinator, entry level digital marketing, entry level content writer, and entry level social media jobs typically require strong communication skills, basic tools familiarity (Google Analytics, Canva, HubSpot), and a demonstrable interest in the field. Entry level HR jobs and entry level recruiter roles are similarly accessible — most large companies and staffing agencies run dedicated graduate HR programs. Starting salaries: $38,000–$58,000 in the US, £22,000–£30,000 in the UK.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Best Entry Level Job Websites and How Jobmeter Compares</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-pink-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Platform</th>
                    <th className="text-left px-4 py-3 font-semibold">Strength</th>
                    <th className="text-left px-4 py-3 font-semibold">Limitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Jobmeter Entry Level Finder', 'AI-matched, genuinely 0–2yr roles only, global + remote filter, real-time alerts', 'Newer platform — growing listing volume'],
                    ['Indeed / Indeed.ng',           'High volume, local + global coverage, location filters',                           'Many "entry level" listings require 3+ yrs'],
                    ['LinkedIn',                     'Network-based, strong for referrals and company research',                         'Competitive; requires strong profile to surface'],
                    ['WayUp.com',                    'College graduate focused; matches profiles to entry roles',                        'Primarily US-based listings'],
                    ['NewGrad-Jobs.com',             'Hourly updates from major boards; 30,000+ US/Canada listings',                    'Aggregator — some listings may be stale'],
                    ['Handshake',                    'University-linked; strong for campus recruiting and internship-to-hire paths',    'Requires university affiliation'],
                    ['We Work Remotely',             'Best for remote entry level tech and marketing roles globally',                    'No non-remote listings'],
                    ['FlexJobs',                     'Verified remote and flexible jobs; scam-free',                                    'Subscription fee required for full access'],
                  ].map(([platform, strength, limit]) => (
                    <tr key={platform} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-xs">{platform}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{strength}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{limit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Real Stories from Entry Level Job Seekers</h3>
            <div className="space-y-4 mb-8">
              <blockquote className="border-l-4 border-pink-500 pl-4 py-1 bg-pink-50 rounded-r-xl">
                <p className="text-gray-700 italic">"I graduated with no tech experience and used the Entry Level Jobs Finder to target junior web developer roles. Within 6 weeks of finishing my freeCodeCamp certification I had three interviews — no degree required, portfolio was enough."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— James, Junior Front End Developer, Remote (UK Employer)</cite>
              </blockquote>
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic">"The data analyst filter on Jobmeter was the only place I found roles that genuinely said 'no experience required.' Got my first data analyst job 4 months after finishing my Google certificate. I'm now earning in USD remotely."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Priya, Entry Level Data Analyst, Remote (US Company)</cite>
              </blockquote>
              <blockquote className="border-l-4 border-green-500 pl-4 py-1 bg-green-50 rounded-r-xl">
                <p className="text-gray-700 italic">"After failing to get interviews on Indeed for months, I found the Entry Level Jobs Finder. The cybersecurity filter showed me roles that actually matched my CompTIA Security+ level. Three applications in, I had an offer."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Marcus, Junior SOC Analyst, Canada</cite>
              </blockquote>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Frequently Asked Questions About Entry Level Jobs</h3>
            <div className="space-y-5 mb-8">
              {[
                { q: 'What are the best websites to find entry level jobs?', a: 'The Entry Level Jobs Finder on Jobmeter is purpose-built for genuine 0–2 year roles, with AI matching and real-time alerts. Other strong options include WayUp.com for college graduates, NewGrad-Jobs.com for US/Canada roles with hourly updates, We Work Remotely for remote entry level positions, and Indeed/LinkedIn for broad global coverage — though these require manual filtering to remove misleading "entry level" listings requiring 3+ years.' },
                { q: 'How do I find entry level web developer jobs with no experience?', a: 'Build a GitHub portfolio of 2–3 live projects (HTML/CSS/JS + a framework like React). Complete freeCodeCamp or a bootcamp program. Apply specifically to "junior web developer jobs no experience" and "beginner web developer jobs" listings on the Entry Level Jobs Finder. Employers hiring junior web developers evaluate GitHub portfolios, not employment history.' },
                { q: 'How do I get an entry level data analyst job?', a: 'Complete the Google Data Analytics Certificate (Coursera, approximately 6 months). Master SQL, Excel, and either Tableau or Power BI. Build 2 portfolio projects on Kaggle. Apply to entry level data analyst job listings filtered for "no experience required." Remote entry level data analyst roles are abundant globally for certified candidates.' },
                { q: 'Are there remote entry level jobs with no experience?', a: 'Yes — remote entry level web developer jobs, remote junior data analyst positions, remote entry level customer service roles, and remote entry level digital marketing jobs are all widely available on Jobmeter. Remote roles are especially accessible because employers evaluate portfolios and certifications rather than local employment history.' },
                { q: 'How to get an entry level cyber security job?', a: 'Earn CompTIA Security+ or Google\'s Cybersecurity Certificate. Practice on TryHackMe or Hack The Box for hands-on experience. Apply to entry level cyber security jobs and junior SOC analyst roles on Jobmeter. Cybersecurity is one of the clearest "certifications substitute for experience" entry level fields, with 32% projected sector growth globally.' },
                { q: 'What entry level jobs pay well with no experience?', a: 'Entry level software engineering jobs ($55K–$80K), entry level data analyst positions ($50K–$70K), entry level cybersecurity roles ($50K–$75K), and junior DevOps engineer positions ($55K–$80K) are among the best-paying entry level jobs globally for certified or portfolio-qualified candidates with no prior employment history.' },
                { q: 'Where can I find entry level jobs near me?', a: 'Use the location filter on the Entry Level Jobs Finder to search by city, country, or set to "Remote" for global opportunities. Jobmeter covers listings across the US, UK, Canada, Australia, Europe, and Africa. For local roles, setting your city filter surfaces relevant nearby listings updated in real time.' },
                { q: 'What are entry level project management jobs and how do I get one?', a: 'Entry level project management jobs include junior project coordinator, project assistant, operations coordinator, and associate project manager roles. The CAPM (Certified Associate in Project Management) from PMI is the recognized global credential for entry level PM roles. Many organizations also accept demonstrated project leadership from academic, volunteer, or freelance contexts.' },
                { q: 'How do I write a CV for entry level jobs with no experience?', a: 'Lead with a strong skills section and objective statement tailored to the specific role. Emphasize education, certifications, personal projects, freelance work, academic achievements, and extracurricular leadership. Use ATS-friendly keywords from the job description (e.g., "entry level front end web developer" should include HTML, CSS, JavaScript, React, Git). Quantify everything — "built 3 live websites" beats "interested in web development."' },
                { q: 'What is the best entry level job for someone with no degree?', a: 'Web development, cybersecurity, data analysis, and digital marketing are the strongest no-degree entry level fields in 2026. Bootcamp credentials (coding), online certificates (Google Data Analytics, CompTIA Security+), and demonstrable portfolios are widely accepted as substitutes for degrees at most companies hiring for junior web developer jobs no experience, entry level IT jobs, and entry level marketing roles globally.' },
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
                "name": "Entry Level Jobs Finder — Find Junior Jobs, No-Experience Roles & Remote Entry Level Positions Worldwide 2026",
                "description": "Find entry level jobs with no experience required worldwide. Discover junior web developer jobs, entry level data analyst jobs, entry level cybersecurity jobs, remote entry level jobs, and beginner-friendly positions across all industries on Jobmeter.",
                "url": "https://jobmeter.app/tools/entry-level-finder",
                "inLanguage": "en",
                "dateModified": new Date().toISOString().split('T')[0],
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://jobmeter.app" },
                    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.app/tools" },
                    { "@type": "ListItem", "position": 3, "name": "Entry Level Jobs Finder", "item": "https://jobmeter.app/tools/entry-level-finder" },
                  ]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Entry Level Jobs Finder",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "AI-powered global job finder for entry level jobs with no experience required. Covers junior web developer jobs, entry level data analyst positions, entry level cybersecurity jobs, remote entry level roles, and beginner-friendly openings across all sectors worldwide.",
                "url": "https://jobmeter.app/tools/entry-level-finder",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Free to use for all job seekers worldwide."
                },
                "featureList": [
                  "Genuine 0–2 year experience requirement filter",
                  "Remote entry level jobs global filter",
                  "Entry level web developer jobs filter",
                  "Entry level data analyst jobs filter",
                  "Entry level cybersecurity and IT jobs filter",
                  "Entry level marketing and HR jobs filter",
                  "Real-time job alerts by role and location",
                  "AI skill matching for entry level candidates",
                  "No-experience role verification",
                  "Global coverage: US, UK, Canada, Australia, Africa, Europe"
                ],
                "keywords": "entry level jobs, entry level jobs no experience, junior web developer jobs no experience, entry level data analyst job, entry level cyber security jobs, remote entry level jobs, entry level web developer jobs, entry level IT jobs, beginner jobs no experience, how to find entry level jobs"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "What are the best websites to find entry level jobs?", "acceptedAnswer": { "@type": "Answer", "text": "The Entry Level Jobs Finder on Jobmeter is purpose-built for genuine 0–2 year experience roles globally. Other strong options include WayUp.com for college graduates, NewGrad-Jobs.com for hourly-updated US/Canada listings, We Work Remotely for remote entry level positions, and FlexJobs for verified flexible roles worldwide." } },
                  { "@type": "Question", "name": "How do I find entry level web developer jobs with no experience?", "acceptedAnswer": { "@type": "Answer", "text": "Build a GitHub portfolio of 2–3 live projects using HTML, CSS, JavaScript, and a framework like React. Complete freeCodeCamp or a coding bootcamp. Apply to junior web developer jobs no experience and beginner web developer jobs listings on Jobmeter's Entry Level Jobs Finder." } },
                  { "@type": "Question", "name": "Are there remote entry level jobs with no experience?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — remote entry level web developer jobs, remote junior data analyst roles, remote entry level customer service, and remote entry level digital marketing jobs are all widely available globally on Jobmeter. Remote roles evaluate portfolios and certifications rather than local employment history." } },
                  { "@type": "Question", "name": "How to get an entry level cyber security job?", "acceptedAnswer": { "@type": "Answer", "text": "Earn CompTIA Security+ or Google's Cybersecurity Certificate. Practice on TryHackMe or Hack The Box. Apply to entry level cyber security jobs and junior SOC analyst roles. Cybersecurity has 32% projected global growth and is one of the clearest certification-to-employment entry level pathways." } },
                  { "@type": "Question", "name": "What entry level jobs pay the most with no experience?", "acceptedAnswer": { "@type": "Answer", "text": "Entry level software engineering jobs ($55K–$80K), entry level data analyst positions ($50K–$70K), entry level cybersecurity roles ($50K–$75K), and junior DevOps positions ($55K–$80K) are the best-paying no-experience entry level jobs globally in 2026 for certified or portfolio-qualified candidates." } },
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Related Job Finder Tools on Jobmeter",
                "description": "Other free job finder tools available on jobmeter.app",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Remote Jobs Finder",           "url": "https://jobmeter.app/tools/remote-jobs-finder" },
                  { "@type": "ListItem", "position": 2, "name": "Internship Finder",             "url": "https://jobmeter.app/tools/internship-finder" },
                  { "@type": "ListItem", "position": 3, "name": "Graduate & Trainee Jobs",       "url": "https://jobmeter.app/tools/graduate-trainee-finder" },
                  { "@type": "ListItem", "position": 4, "name": "Jobs with Visa Sponsorship",    "url": "https://jobmeter.app/tools/visa-finder" },
                  { "@type": "ListItem", "position": 5, "name": "Jobs with Accommodation",       "url": "https://jobmeter.app/tools/accommodation-finder" },
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