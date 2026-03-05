"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase, Globe, Search, Filter, X, Laptop, Home, GraduationCap, Award, Rocket, ClipboardList, Wifi } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

const JOBS_PER_PAGE = 20;

export default function VisaFinderPage() {
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
    fetchVisaJobs();
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

  const fetchVisaJobs = async () => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      
      let countQuery = supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('visa_assistance', 'yes')
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
        .eq('visa_assistance', 'yes')
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
      console.error('Error fetching visa jobs:', error);
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
    router.push(`/tools/visa-finder?${params.toString()}`);
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
    router.push('/tools/visa-finder');
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
            <Globe size={32} />
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
              Jobs with Visa Sponsorship
            </h1>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Find jobs that offer visa sponsorship and work permits
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Search by job title, skill, or company</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Filter by sector and location</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Find jobs offering visa sponsorship</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Apply and relocate for work</p>
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
                placeholder="Search jobs with visa sponsorship..."
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
            {loading ? 'Loading...' : `${totalJobs.toLocaleString()} jobs with visa sponsorship found`}
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
                <p style={{ color: theme.colors.text.secondary }}>Loading jobs with visa sponsorship...</p>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Globe size={48} className="text-gray-400 mb-4" />
                <p className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  No jobs with visa sponsorship found
                </p>
                <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                  {hasFilters ? 'Try adjusting your filters' : 'Check back later for new opportunities with visa sponsorship'}
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
              { title: 'Remote Jobs',              description: 'Find remote job opportunities worldwide',                                     icon: Wifi,          color: '#06B6D4', route: '/tools/remote-jobs-finder' },
              { title: 'Internship Finder',         description: 'Find internship opportunities to kickstart your career',           icon: Briefcase,     color: '#2563EB', route: '/tools/internship-finder' },
              { title: 'NYSC Jobs',                description: 'Find job opportunities for NYSC corpers',                          icon: Award,         color: '#10B981', route: '/tools/nysc-finder' },
              { title: 'Jobs with Accommodation',  description: 'Find jobs that offer accommodation benefits',                      icon: Home,          color: '#14B8A6', route: '/tools/accommodation-finder' },
              { title: 'Graduate & Trainee Jobs',  description: 'Find graduate programs and trainee positions for fresh graduates',  icon: GraduationCap, color: '#2563EB', route: '/tools/graduate-trainee-finder' },
              { title: 'Entry Level Jobs',         description: 'Find entry-level jobs for beginners starting their career',         icon: Rocket,        color: '#6366F1', route: '/tools/entry-level-finder' },
              { title: 'Quiz Platform',            description: 'Practice aptitude tests and theory questions',                     icon: ClipboardList, color: '#F59E0B', route: '/tools/quiz' },
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
              Jobs with Visa Sponsorship: Find Sponsored Work Abroad, Travel Nurse Jobs, Healthcare Roles, and Global Career Opportunities in 2026
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              For professionals worldwide ready to build international careers, jobs with visa sponsorship represent the most direct path to working abroad legally and securely. Whether you are a registered nurse pursuing travel nurse jobs, a tech professional seeking H-1B-sponsored roles, an allied health worker targeting US or Canadian placements, or a skilled professional searching for sponsored work in the UK, Australia, or Europe — the Jobs with Visa Sponsorship Finder aggregates verified listings across every major category. This is the most comprehensive visa sponsorship jobs platform for international candidates in 2026, covering healthcare, technology, engineering, hospitality, education, and beyond.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Why Jobs with Visa Sponsorship Are the Best Path to Working Abroad</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Securing a job with visa sponsorship means your employer directly handles — and often funds — your immigration process. This includes H-1B visas for specialty occupations, EB-3 green cards for skilled and unskilled workers, TN visas for Canadian and Mexican professionals under USMCA, Canadian work visa pathways via Express Entry, UK Skilled Worker Visas, Australian Employer-Sponsored visas (subclass 482), and holiday working visa programs across Europe and Asia-Pacific.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              For internationally qualified professionals, visa sponsorship jobs eliminate the single biggest barrier to working abroad: immigration costs and complexity. Employers covering visa processing fees, legal costs, and relocation assistance make roles like travel nurse jobs, travel RN jobs, software engineer positions, and hospitality roles financially accessible from day one. The average EB-3 processing alone costs $3,000–$10,000 — all covered when an employer sponsors you directly.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Demand for sponsored international talent continues rising sharply. Healthcare staffing shortages across the US, UK, and Canada mean travel nursing companies and travel nurse agencies are actively recruiting NCLEX-qualified nurses from countries worldwide. Technology firms, engineering consultancies, and financial services organizations across Europe and North America are expanding H-1B and skilled worker visa programs to address critical talent gaps. The Jobs with Visa Sponsorship Finder surfaces all of these openings in real time.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Top Travel Nurse Jobs with Visa Sponsorship</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Travel nurse jobs dominate the visa sponsorship job market, combining competitive salaries, adventure, and clear immigration pathways. Registered nurse travel jobs, NICU travel nurse jobs, dialysis travel nurse jobs, and travel nurse practitioner jobs are among the highest-demand roles on the platform — all actively offering EB-3 green card sponsorship or TN visa arrangements for qualified international candidates.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Role</th>
                    <th className="text-left px-4 py-3 font-semibold">Avg. Salary (USD/hr)</th>
                    <th className="text-left px-4 py-3 font-semibold">Visa Types Sponsored</th>
                    <th className="text-left px-4 py-3 font-semibold">Key Requirements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Travel RN Jobs',                '$48–$85/hr', 'EB-3, TN Visa',           'BSN, 2+ yrs exp., NCLEX passed'],
                    ['Travel CNA Jobs',               '$20–$35/hr', 'H-1B, EB-3',              'CNA certification, US/Canada license'],
                    ['LPN Travel Nursing Jobs',       '$30–$50/hr', 'EB-3 Sponsorship',        'LPN license, specialty experience'],
                    ['Travel Nurse Practitioner Jobs','$60–$100/hr','EB-3, TN Visa',           'MSN degree, 1+ yr exp.'],
                    ['NICU Travel Nurse Jobs',        '$55–$90/hr', 'EB-3 Green Card',         'NICU specialty, NCLEX, 2+ yrs'],
                    ['Travel CNA Salary Roles',       '$22–$38/hr', 'H-1B, Employer Sponsored','CNA cert., 1 yr exp. preferred'],
                    ['Dialysis Travel Nurse Jobs',    '$50–$80/hr', 'EB-3 Sponsorship',        'Nephrology exp., BSN, NCLEX'],
                    ['RNFA Travel Jobs',              '$50–$90/hr', 'EB-3, Visa Processing Incl','RNFA cert., surgical experience'],
                  ].map(([role, salary, visa, req]) => (
                    <tr key={role} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{role}</td>
                      <td className="px-4 py-3 text-gray-600">{salary}</td>
                      <td className="px-4 py-3 text-gray-600">{visa}</td>
                      <td className="px-4 py-3 text-gray-600">{req}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Travel nursing typically operates on 13-week contracts across US states and Canadian provinces, with travel nurse opportunities in high-need specialties like ICU, ER, NICU, and dialysis commanding premium pay. Travel nurse agencies provide housing stipends on top of base pay — meaning tax-free allowances effectively boost your take-home significantly above the advertised hourly rate. For internationally qualified RNs, the path involves NCLEX-RN preparation, credential evaluation (CGFNS), and agency-sponsored EB-3 or TN visa processing.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Best Travel Nursing Agencies Offering Visa Sponsorship</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Choosing the right travel nurse agency is critical for internationally qualified nurses pursuing visa-sponsored roles. The best travel nursing agencies actively invest in international recruitment and manage the full visa process on your behalf:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Aya Healthcare:</strong> Consistently rated among the best travel nursing agencies, specializing in EB-3 sponsorship for travel RN positions. Offers strong housing stipends and relocation support.</li>
              <li><strong>Cross Country Nurses:</strong> Focuses on travel nurse positions across the US with Canadian work visa ties and strong NICU and ICU placements for international nurses.</li>
              <li><strong>Medical Solutions Travel Nursing:</strong> Targets LPN travel nursing jobs, travel phlebotomist jobs, and allied health roles with full visa processing included.</li>
              <li><strong>Vivian Travel Nursing:</strong> Highly rated travel nurse staffing agency with a transparent job marketplace for travel nurse jobs near me and international placements.</li>
              <li><strong>AMN Healthcare:</strong> Covers allied travel careers including travel PT jobs, travel OT jobs, travel respiratory therapist jobs, and travel social work jobs with visa support.</li>
              <li><strong>TNAA (Travel Nurse Across America):</strong> Specializes in RNFA travel jobs and surgical specialties with full green card sponsorship programs.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              These travel nursing companies handle green card sponsorship end-to-end — including CGFNS credential evaluation, NCLEX preparation support, state licensing, and all immigration legal fees. Many also provide relocation assistance, paid time off, health insurance, and 401K contributions. For internationally qualified nurses, these agencies represent the clearest structured path to US or Canadian immigration through employment.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Allied Healthcare Travel Jobs with Visa Sponsorship</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Visa sponsorship extends well beyond nursing into the full spectrum of allied health and healthcare support roles. These positions often carry TN visa eligibility for qualified candidates and EB-3 sponsorship through travel healthcare agencies:
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Example Roles</th>
                    <th className="text-left px-4 py-3 font-semibold">Salary Range (USD)</th>
                    <th className="text-left px-4 py-3 font-semibold">Visa Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Imaging & Radiology',   'Travel CT Tech Jobs, Travel Xray Tech, Travel Ultrasound Tech',         '$35–$70/hr', 'High demand, EB-3 eligible'],
                    ['Therapy',              'Travel PT Jobs, Travel PTA Jobs, Travel SLP Jobs, Travel OT Jobs',       '$45–$80/hr', 'TN Visa common for therapy'],
                    ['Surgical & Sterile',   'Travel Surgical Tech Jobs, Travel Sterile Processing Jobs',              '$30–$55/hr', 'Agency-sponsored EB-3'],
                    ['Pharmacy & Lab',       'Travel Pharmacy Technician Jobs, MLT Travel Jobs, Travel Med Tech Jobs', '$28–$60/hr', 'Credential evaluation required'],
                    ['Emergency Services',   'Travel Paramedic Jobs, Travel EMT Jobs, Travel EKG Tech Jobs',           '$25–$50/hr', 'H-1B and EB-3 available'],
                    ['Support Roles',        'Traveling Medical Assistant, Travel PCT Jobs, Travel Phlebotomist',      '$20–$38/hr', 'Entry-level sponsorship available'],
                    ['Respiratory & Dialysis','Travel Respiratory Therapist Jobs, Travel Dialysis Tech Jobs',          '$35–$65/hr', 'High-demand, fast sponsorship'],
                  ].map(([cat, roles, salary, notes]) => (
                    <tr key={cat} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{cat}</td>
                      <td className="px-4 py-3 text-gray-600">{roles}</td>
                      <td className="px-4 py-3 text-gray-600">{salary}</td>
                      <td className="px-4 py-3 text-gray-600">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Technology and Engineering Jobs with Visa Sponsorship</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Beyond healthcare, technology and engineering represent the second largest category of jobs with visa sponsorship. H-1B visas for software engineers, data scientists, cloud architects, and cybersecurity specialists are actively sponsored by US tech firms, while UK Skilled Worker Visas and Canadian Express Entry pathways are favored by European and Canadian employers respectively.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Tech professionals with experience in software development, data engineering, DevOps, machine learning, and fintech are particularly in demand globally. The Jobs with Visa Sponsorship Finder surfaces current technology openings with confirmed visa support — covering roles in the US, UK, Canada, Germany, the Netherlands, and Australia. Salaries for sponsored tech roles typically range from $80,000–$200,000 USD annually depending on seniority and specialization.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Airline, Travel, and Hospitality Jobs with Visa Sponsorship</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              For candidates drawn to careers that involve international travel, airline and hospitality employers also sponsor visas for multilingual, customer-facing professionals. Key employers and opportunities in this space include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Delta Airlines Careers:</strong> Flight attendant and ground operations roles that sponsor J-1 and H-1B visas for multilingual candidates. Delta Airlines careers are among the most searched airline visa sponsorship opportunities globally.</li>
              <li><strong>American Airlines Flight Attendant:</strong> Active international recruitment with visa support for qualified multilingual candidates worldwide.</li>
              <li><strong>Expedia Jobs and Expedia Careers:</strong> Remote travel agent jobs and work from home travel agent positions — many qualifying for visa sponsorship for in-country relocation roles.</li>
              <li><strong>Travel Agent Jobs and Travel Consultant Jobs:</strong> Agency roles at international travel companies offering travel agent vacancies with career visa pathways in the UK, Australia, and Canada.</li>
              <li><strong>Online Travel Agent Jobs:</strong> Remote-first roles combining travel expertise with customer service, sometimes qualifying for sponsored digital nomad visa programs in countries like Portugal and Germany.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              Jobs that pay you to travel — like airline crew roles, travel consultant positions, and cruise ship hospitality jobs — remain among the most popular visa sponsorship categories for internationally mobile professionals. These roles combine competitive salaries averaging $40,000–$80,000 with the benefit of sponsored relocation and, in many cases, free or heavily discounted travel benefits.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Understanding Visa Types for Sponsored Jobs Abroad</h3>
            <p className="text-gray-600 leading-relaxed mb-3">Knowing which visa applies to your target role helps you search and prepare more effectively:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>H-1B Visa (USA):</strong> For specialty occupations requiring at least a bachelor's degree — covers software engineers, architects, financial analysts, and travel consultants. Subject to annual lottery; employer must file petition.</li>
              <li><strong>EB-3 Green Card (USA):</strong> Permanent residency for skilled workers, professionals, and unskilled workers. EB-3 sponsorships for travel nurses typically take 2–5 years to process. Covers RN, LPN, CNA, and allied health roles.</li>
              <li><strong>TN Visa (USA/Canada):</strong> For Canadian and Mexican nationals under USMCA, covering nurses, engineers, accountants, and scientists. Fast processing — often same-day approval at the border.</li>
              <li><strong>Canadian Work Visa / Express Entry (Canada):</strong> Points-based system for skilled workers. Travel RN jobs, engineering roles, and tech positions are among the top qualifying occupations. Canadian work visa pathways via Provincial Nominee Programs also available.</li>
              <li><strong>UK Skilled Worker Visa:</strong> Replaces the Tier 2 visa post-Brexit. Requires a sponsoring employer, minimum salary threshold, and English language proof. Healthcare, engineering, IT, and education are priority sectors.</li>
              <li><strong>Australian Employer-Sponsored Visa (Subclass 482):</strong> Allows skilled workers to be sponsored by an approved Australian employer. Covers healthcare, engineering, hospitality, and technology.</li>
              <li><strong>Holiday Working Visa:</strong> Available for candidates aged 18–30 (or 35 in some countries) from participating nations, including Ireland, New Zealand, and South Korea. Allows up to 12 months of work with renewal options depending on the bilateral agreement with your home country.</li>
              <li><strong>Career Visa / EU Blue Card:</strong> For highly qualified professionals in EU countries. Covers technology, engineering, medicine, and scientific research roles with sponsorship from EU-based employers.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How to Find and Land Jobs with Visa Sponsorship</h3>
            <ol className="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
              <li><strong>Use the Jobs with Visa Sponsorship Finder:</strong> Search by sector (Healthcare, Tech, Hospitality), target country, and visa type to surface only confirmed sponsor listings — saving hours of filtering on generic job boards.</li>
              <li><strong>Qualify Your Credentials First:</strong> For nursing roles, complete NCLEX-RN and CGFNS evaluation. For tech roles, ensure your degree credentials are evaluated by WES (World Education Services) for North American applications.</li>
              <li><strong>Gain Relevant Experience:</strong> Most EB-3 and H-1B sponsored roles require 1–2 years of post-qualification experience. Travel RN agencies typically require a minimum of 2 years specialty experience. Target travel CNA jobs or entry-level roles if you are just starting out.</li>
              <li><strong>Apply Through Reputable Agencies:</strong> For healthcare, use best travel nursing agencies like Aya Healthcare, Vivian, or AMN. For tech, apply directly to US, UK, and Canadian companies advertising sponsorship. For travel, target Delta Airlines careers and Expedia jobs directly.</li>
              <li><strong>Prepare Visa Documentation Early:</strong> Gather your passport, academic certificates, professional licenses, and reference letters. Agencies and employers typically need these at the offer stage — having them ready speeds up the process considerably.</li>
              <li><strong>Set Real-Time Alerts:</strong> Use the finder's alert system for your target keywords — travel nurse jobs with visa sponsorship, jobs that pay to relocate and provide housing, and international remote jobs hiring immediately — to be first in queue for new listings.</li>
            </ol>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Real Success Stories from Sponsored Professionals</h3>
            <div className="space-y-4 mb-8">
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic">"I found my travel RN job with EB-3 sponsorship through this platform. The agency handled everything — NCLEX prep support, license transfer, visa processing. I'm now in Texas earning $68/hour."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Maria, Travel RN, Texas USA</cite>
              </blockquote>
              <blockquote className="border-l-4 border-green-500 pl-4 py-1 bg-green-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Used the visa sponsorship finder to land a software engineer role in the Netherlands with EU Blue Card sponsorship. The employer covered all relocation costs — flights, temporary housing, legal fees."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— David, Software Engineer, Amsterdam</cite>
              </blockquote>
              <blockquote className="border-l-4 border-purple-500 pl-4 py-1 bg-purple-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Applied for a Delta Airlines flight attendant role through the jobs finder and got J-1 visa sponsorship. The multilingual requirement worked in my favour — French and English opened the door."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Sophie, Flight Attendant, Atlanta USA</cite>
              </blockquote>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Frequently Asked Questions About Jobs with Visa Sponsorship</h3>
            <div className="space-y-5 mb-8">
              {[
                { q: 'What are the best jobs with visa sponsorship for international nurses?', a: 'Travel nurse jobs with EB-3 sponsorship are the top pathway. Best travel nursing agencies including Aya Healthcare, Vivian Travel Nursing, and Cross Country Nurses actively recruit NCLEX-qualified nurses internationally and cover all visa processing costs. Travel RN jobs average $48–$85/hour plus housing stipends.' },
                { q: 'Do Delta Airlines careers offer visa sponsorship?', a: 'Yes — Delta Airlines careers include visa sponsorship for flight attendant and ground operations roles, particularly for multilingual candidates. J-1 and H-1B sponsorship is available for qualifying international applicants. Apply through the Jobs with Visa Sponsorship Finder for current Delta Airlines openings.' },
                { q: 'What is the difference between H-1B and EB-3 visa sponsorship?', a: 'The H-1B is a temporary work visa for specialty occupations (tech, finance, travel consulting) requiring degree-level qualifications, subject to annual lottery. The EB-3 is a permanent residency (green card) pathway for skilled workers — EB-3 sponsorships for travel nurses typically take 2–5 years but lead to permanent US residency.' },
                { q: 'How do I get a Canadian work visa through a job offer?', a: 'Canadian work visa pathways include Express Entry (points-based), Provincial Nominee Programs (PNP), and direct employer-sponsored work permits. Travel RN jobs, engineering roles, and IT positions are among the top qualifying occupations. The Jobs with Visa Sponsorship Finder flags all Canadian-sponsored openings explicitly.' },
                { q: 'Are there travel nurse agencies that sponsor green cards for international nurses?', a: 'Yes — Aya Healthcare, AMN Healthcare, and Medical Solutions Travel Nursing all offer EB-3 green card sponsorship programs. These agencies handle the full CGFNS evaluation, NCLEX preparation support, state licensing, and immigration legal process for internationally qualified nurses applying to US travel nursing positions.' },
                { q: 'Can I find remote travel agent jobs with visa sponsorship?', a: 'Work from home travel agent and remote travel agent jobs at companies like Expedia can qualify for visa sponsorship, particularly for in-country relocation roles or positions requiring candidates to be based in a specific country. Search "remote travel agent jobs visa sponsorship" in the finder for current openings.' },
                { q: 'What allied health travel jobs have the fastest visa sponsorship processing?', a: 'Travel CT tech jobs, travel ultrasound tech, and travel respiratory therapist jobs tend to have the fastest EB-3 processing due to critical shortage designations in the US. Travel dialysis tech jobs and travel surgical tech jobs also move quickly through agency-sponsored pipelines.' },
                { q: 'What is a holiday working visa and who qualifies?', a: 'Holiday working visas (youth mobility schemes) allow candidates typically aged 18–30 or 35 to live and work in a participating country for 12+ months. Eligibility depends on bilateral agreements between your home country and the destination. Popular destinations include Ireland, New Zealand, Australia, South Korea, and several EU nations.' },
                { q: 'What salary can I expect from jobs with visa sponsorship?', a: 'Salaries vary widely: travel RN jobs offer $48–$85/hour; tech roles average $80,000–$200,000/year; Delta Airlines flight attendant roles average $45,000–$80,000/year; travel physical therapy jobs pay $45–$80/hour. Most sponsored roles also include relocation allowances, housing stipends, and visa fee coverage on top of base compensation.' },
                { q: 'How do I prepare for a visa sponsorship job application?', a: 'Key steps: evaluate your credentials through CGFNS (healthcare) or WES (other fields); pass NCLEX for nursing or relevant licensing exams for your target country; gather documentation (passport, academic certificates, professional licenses, references); apply through reputable agencies or directly to sponsoring employers; and set alerts on the Jobs with Visa Sponsorship Finder to be first in queue for new listings.' },
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
                "name": "Jobs with Visa Sponsorship — Find Sponsored Work Abroad, Travel Nurse Jobs & Global Career Opportunities 2026",
                "description": "Discover jobs with visa sponsorship including travel nurse jobs, travel RN jobs, technology roles with H-1B sponsorship, UK Skilled Worker Visa jobs, Canadian work visa opportunities, and jobs that pay to relocate. The best visa sponsorship jobs platform for internationally mobile professionals worldwide.",
                "url": "https://jobmeter.app/tools/visa-finder",
                "inLanguage": "en",
                "dateModified": new Date().toISOString().split('T')[0],
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://jobmeter.app" },
                    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.app/tools" },
                    { "@type": "ListItem", "position": 3, "name": "Jobs with Visa Sponsorship Finder", "item": "https://jobmeter.app/tools/visa-finder" },
                  ]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Jobs with Visa Sponsorship Finder",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "AI-powered job finder tool for discovering jobs with visa sponsorship including travel nurse jobs, H-1B sponsored tech roles, EB-3 green card nursing jobs, Canadian work visa opportunities, UK Skilled Worker Visa jobs, and jobs that pay to relocate for internationally mobile professionals worldwide.",
                "url": "https://jobmeter.app/tools/visa-finder",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Free to use for all job seekers worldwide."
                },
                "featureList": [
                  "Real-time jobs with visa sponsorship listings",
                  "Travel nurse jobs with EB-3 and TN visa filter",
                  "H-1B sponsored technology and engineering jobs",
                  "Canadian work visa and Express Entry job filter",
                  "UK Skilled Worker Visa jobs filter",
                  "Holiday working visa opportunities",
                  "Jobs that pay to relocate and provide housing",
                  "Sector filters: Healthcare, Tech, Hospitality, Engineering",
                  "Global coverage across US, UK, Canada, Australia, and Europe"
                ],
                "keywords": "jobs with visa sponsorship, travel nurse jobs, travel RN jobs, H-1B visa jobs, EB-3 green card sponsorship, Canadian work visa, UK Skilled Worker Visa, jobs that pay to relocate, best travel nursing agencies, travel CNA jobs"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "What are the best jobs with visa sponsorship for international nurses?", "acceptedAnswer": { "@type": "Answer", "text": "Travel nurse jobs with EB-3 sponsorship are the top pathway. Best travel nursing agencies including Aya Healthcare, Vivian Travel Nursing, and Cross Country Nurses actively recruit NCLEX-qualified nurses internationally and cover all visa processing costs, with salaries averaging $48–$85/hour plus housing stipends." } },
                  { "@type": "Question", "name": "What is the difference between H-1B and EB-3 visa sponsorship?", "acceptedAnswer": { "@type": "Answer", "text": "The H-1B is a temporary work visa for specialty occupations subject to annual lottery. The EB-3 is a permanent residency pathway — EB-3 sponsorships for travel nurses typically take 2–5 years but lead to permanent US residency and eventual citizenship eligibility." } },
                  { "@type": "Question", "name": "How do I get a Canadian work visa through a job offer?", "acceptedAnswer": { "@type": "Answer", "text": "Canadian work visa pathways include Express Entry, Provincial Nominee Programs, and direct employer-sponsored work permits. Travel RN jobs, engineering, and IT roles are top qualifying occupations on the Jobs with Visa Sponsorship Finder." } },
                  { "@type": "Question", "name": "Are there travel nurse agencies that sponsor green cards?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Aya Healthcare, AMN Healthcare, and Medical Solutions Travel Nursing all offer EB-3 green card sponsorship programs, handling full CGFNS evaluation, NCLEX support, state licensing, and immigration legal process for internationally qualified nurses." } },
                  { "@type": "Question", "name": "What salary can I expect from jobs with visa sponsorship?", "acceptedAnswer": { "@type": "Answer", "text": "Travel RN jobs offer $48–$85/hour; tech roles average $80,000–$200,000/year; flight attendant roles $45,000–$80,000/year; travel physical therapy jobs $45–$80/hour. Most sponsored roles include relocation allowances, housing stipends, and full visa fee coverage." } },
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Related Job Finder Tools on Jobmeter",
                "description": "Other free job finder tools available on jobmeter.app",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Remote Jobs Finder",         "url": "https://jobmeter.app/tools/remote-jobs-finder" },
                  { "@type": "ListItem", "position": 2, "name": "Internship Finder",           "url": "https://jobmeter.app/tools/internship-finder" },
                  { "@type": "ListItem", "position": 3, "name": "NYSC Jobs Finder",            "url": "https://jobmeter.app/tools/nysc-finder" },
                  { "@type": "ListItem", "position": 4, "name": "Jobs with Accommodation",     "url": "https://jobmeter.app/tools/accommodation-finder" },
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
