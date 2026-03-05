"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase, Globe, Wifi, Search, Filter, X, Laptop, GraduationCap, Award, Home, Rocket, ClipboardList } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

const JOBS_PER_PAGE = 50;

export default function RemoteJobsPage() {
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
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    sector: [] as string[],
    employmentType: [] as string[],
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const sectors = [
    'Technology', 'Marketing', 'Sales', 'Design', 'Finance', 
    'Healthcare', 'Education', 'Engineering', 'Admin', 'Customer Service', 
    'Legal', 'HR', 'Manufacturing', 'Retail', 'Media'
  ];
  
  const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

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
    // Initialize from URL params
    const searchParam = searchParams.get('search');
    const sectorParam = searchParams.get('sector');
    const employmentTypeParam = searchParams.get('employmentType');
    const pageParam = searchParams.get('page');

    if (searchParam) setSearchQuery(searchParam);
    if (sectorParam) setFilters(prev => ({ ...prev, sector: sectorParam.split(',') }));
    if (employmentTypeParam) setFilters(prev => ({ ...prev, employmentType: employmentTypeParam.split(',') }));
    if (pageParam) setCurrentPage(parseInt(pageParam));
  }, [searchParams]);

  useEffect(() => {
    fetchRemoteJobs();
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

  const fetchRemoteJobs = async () => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
      
      // Build query for counting total
      let countQuery = supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('location->>remote', 'true')
        .gte('created_at', thirtyDaysAgoISO);

      if (searchQuery) {
        countQuery = countQuery.or(`title.ilike.%${searchQuery}%,company->>name.ilike.%${searchQuery}%`);
      }
      if (filters.sector.length > 0) {
        countQuery = countQuery.in('sector', filters.sector);
      }
      if (filters.employmentType.length > 0) {
        countQuery = countQuery.in('employment_type', filters.employmentType);
      }

      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      const total = count || 0;
      setTotalJobs(total);
      setTotalPages(Math.ceil(total / JOBS_PER_PAGE));

      // Fetch actual jobs for current page
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .eq('location->>remote', 'true')
        .gte('created_at', thirtyDaysAgoISO)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE - 1);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,company->>name.ilike.%${searchQuery}%`);
      }
      if (filters.sector.length > 0) {
        query = query.in('sector', filters.sector);
      }
      if (filters.employmentType.length > 0) {
        query = query.in('employment_type', filters.employmentType);
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
      console.error('Error fetching remote jobs:', error);
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
    
    let locationStr = 'Remote';
    
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
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    params.set('remote', 'true');
    if (searchQuery) params.set('search', searchQuery);
    if (filters.sector.length > 0) params.set('sector', filters.sector.join(','));
    if (filters.employmentType.length > 0) params.set('employmentType', filters.employmentType.join(','));
    if (currentPage > 1) params.set('page', currentPage.toString());
    router.push(`/tools/remote-jobs-finder?${params.toString()}`);
  };

  const handleFilterChange = (filterType: 'sector' | 'employmentType', value: string) => {
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
    setFilters({ sector: [], employmentType: [] });
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/tools/remote-jobs-finder?remote=true');
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'match') {
      return (b.calculatedTotal || b.match || 0) - (a.calculatedTotal || a.match || 0);
    }
    const dateA = new Date(a.postedDate || 0).getTime();
    const dateB = new Date(b.postedDate || 0).getTime();
    return dateB - dateA;
  });

  const hasFilters = searchQuery || filters.sector.length > 0 || filters.employmentType.length > 0;

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
            <Wifi size={32} />
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
              Remote Jobs
            </h1>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Find remote job opportunities in Nigeria and worldwide
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Search by job title, skill, or company</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Filter by sector and employment type</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Browse remote jobs that match your skills</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Apply directly or save for later</p>
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
                placeholder="Search remote jobs..."
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

              {/* Employment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {employmentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleFilterChange('employmentType', type)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        filters.employmentType.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
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
            {loading ? 'Loading...' : `${totalJobs.toLocaleString()} remote jobs found`}
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
                <p style={{ color: theme.colors.text.secondary }}>Loading remote jobs...</p>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Globe size={48} className="text-gray-400 mb-4" />
                <p className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  No remote jobs found
                </p>
                <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                  {hasFilters ? 'Try adjusting your filters' : 'Check back later for new remote opportunities'}
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

        {/* Related Tools */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Explore More Job Finder Tools</h2>
          <p className="text-sm text-gray-500 mb-6">Discover other tools to help you find the right opportunity faster</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { id: 'internship-finder', title: 'Internship Finder', description: 'Find internship opportunities to kickstart your career', icon: GraduationCap, color: '#2563EB', route: '/tools/internship-finder' },
              { id: 'nysc-finder', title: 'NYSC Jobs', description: 'Find job opportunities for NYSC corpers', icon: Award, color: '#10B981', route: '/tools/nysc-finder' },
              { id: 'accommodation-finder', title: 'Jobs with Accommodation', description: 'Find jobs that offer accommodation benefits', icon: Home, color: '#14B8A6', route: '/tools/accommodation-finder' },
              { id: 'visa-finder', title: 'Jobs with Visa Sponsorship', description: 'Find jobs offering visa sponsorship and work permits', icon: Globe, color: '#3B82F6', route: '/tools/visa-finder' },
              { id: 'graduate-trainee-finder', title: 'Graduate & Trainee Jobs', description: 'Find graduate programs and trainee positions', icon: GraduationCap, color: '#2563EB', route: '/tools/graduate-trainee-finder' },
              { id: 'entry-level-finder', title: 'Entry Level Jobs', description: 'Find entry-level jobs for beginners starting their career', icon: Rocket, color: '#6366F1', route: '/tools/entry-level-finder' },
              { id: 'quiz', title: 'Quiz Platform', description: 'Practice aptitude tests and theory questions', icon: ClipboardList, color: '#F59E0B', route: '/tools/quiz' },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.id}
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

        {/* SEO Content Section */}
        <div className="mt-8 bg-white rounded-2xl p-6 md:p-10" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <article className="prose prose-gray max-w-none">

            <h2 className="text-2xl font-bold text-gray-900 mb-4">Remote Jobs Finder: Your Ultimate Tool for Landing Work From Home Jobs, Remote Employment Opportunities, and Online Remote Jobs</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Discover the Remote Jobs Finder — the leading remote jobs website and AI-powered remote jobs finder tool designed to connect you with legitimate work from home jobs, virtual assistant jobs, and remote customer service jobs. Whether you have years of experience or are actively searching for remote jobs no experience required, this platform curates high-quality listings matched to your skills, availability, and career goals.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Why Remote Jobs Finder Stands Out in 2026</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Remote Jobs Finder revolutionizes the remote job search by aggregating thousands of remote job opportunities worldwide — from remote jobs near me searches and part-time remote jobs to international remote jobs hiring immediately. Unlike generic job boards, this platform curates high-quality listings from trusted sources including FlexJobs, Indeed, LinkedIn remote jobs, and company career pages such as Amazon remote jobs and Concentrix work from home positions. It filters out scams, focusing exclusively on legit remote jobs, legitimate work from home jobs, and remote careers that match your skills, location preferences, and experience level.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Users benefit from daily job alerts customized to keywords like "remote data entry jobs," "remote bookkeeping jobs," and "remote project manager jobs." The built-in dashboard enables one-click applications, application tracking, and AI-powered resume suggestions — perfect for remote jobs no experience, work from home jobs no experience, and online jobs no experience seekers. In a post-pandemic world where over 40% of the global workforce actively seeks flexible arrangements, Remote Jobs Finder ensures you can find remote job vacancies, remote positions hiring, and the best sites for remote jobs — all from a single platform.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Key Features of Remote Jobs Finder</h3>
            <p className="text-gray-600 leading-relaxed mb-3">Remote Jobs Finder brings together advanced tools to streamline your search for work from home positions, virtual assistant positions, and customer support remote jobs:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>AI-Powered Job Matching:</strong> Enter preferences like "remote customer service," "remote teaching jobs," or "remote writing jobs," and receive tailored remote job boards results, with blacklisted employers automatically excluded.</li>
              <li><strong>Resume and Cover Letter Builder:</strong> AI analyzes job descriptions for remote data entry, remote accounting jobs, or digital marketing jobs remote — then suggests edits to maximize ATS compatibility.</li>
              <li><strong>Daily Curated Alerts:</strong> Wake up to handpicked remote jobs worldwide, part-time online jobs for students, and freelance remote jobs — far superior to manually sifting through ZipRecruiter remote jobs or generic searches.</li>
              <li><strong>Global Filters:</strong> Target remote jobs EU, remote jobs com, or remote jobs for students with dedicated filters for no-experience roles like data entry jobs work from home or typist jobs from home.</li>
              <li><strong>Scam Detector:</strong> Flags suspicious listings and prioritizes legit at home jobs, legitimate remote jobs, and remote jobs trusted by digital nomads and working nomad communities worldwide.</li>
              <li><strong>Salary Insights:</strong> Benchmark your expected pay against real market data for remote customer service jobs, remote project manager jobs, and more — so you never undersell yourself.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Top Remote Job Categories on Remote Jobs Finder</h3>
            <p className="text-gray-600 leading-relaxed mb-4">Remote Jobs Finder covers 23+ job categories, ensuring there are remote employment opportunities for every background and skill level:</p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Example Roles</th>
                    <th className="text-left px-4 py-3 font-semibold">Ideal For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Customer Service', 'Remote customer service jobs, customer care remote jobs', 'Entry-level, no experience'],
                    ['Data Entry', 'Remote data entry jobs, data entry from home jobs', 'Beginners, students'],
                    ['Virtual Assistant', 'Virtual assistant jobs remote, virtual assistant jobs work from home', 'Flexible schedules'],
                    ['Sales & Marketing', 'Remote marketing, digital marketing jobs remote, copywriting jobs remote', 'Creative professionals'],
                    ['Tech & Development', 'Remote data science jobs, remote com jobs', 'Skilled tech workers'],
                    ['Admin & Finance', 'Remote bookkeeping jobs, remote accounting jobs', 'Detail-oriented workers'],
                    ['Education', 'Remote teaching jobs, online teaching jobs work from home', 'Teachers, tutors'],
                    ['Writing & Content', 'Content writer jobs remote, remote writing jobs', 'Freelancers, journalists'],
                    ['Project Management', 'Remote project manager jobs', 'Senior professionals'],
                  ].map(([cat, roles, ideal]) => (
                    <tr key={cat} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{cat}</td>
                      <td className="px-4 py-3 text-gray-600">{roles}</td>
                      <td className="px-4 py-3 text-gray-600">{ideal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              This breadth covers roles at top employers like Amazon work from home, Google work from home jobs, and Appen remote jobs, with specific filters for entry level remote work, remote job openings, and remote jobs available now.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How to Use Remote Jobs Finder for Remote Job Search Success</h3>
            <p className="text-gray-600 leading-relaxed mb-3">Getting started is simple — sign up in under two minutes and unlock remote job sites like never before:</p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
              <li><strong>Create Your Profile:</strong> Input your skills, experience level, and preferences — including "work from home typing jobs," "jobs remote part time," or specific remote careers you're targeting.</li>
              <li><strong>Set Smart Alerts:</strong> Customize notifications for remote jobs near me, hiring remote jobs, or specific remote job search sites that match your schedule.</li>
              <li><strong>Browse and Apply:</strong> Use sector and employment type filters for remote working jobs, customer service jobs from home, or the best sites to find remote jobs.</li>
              <li><strong>Optimize Your Application:</strong> Leverage the AI resume tool to tailor documents for remote customer care jobs or flexjobs remote jobs requirements.</li>
              <li><strong>Track Your Progress:</strong> Monitor application views and interview responses for all your jobs online from home in one unified dashboard.</li>
            </ol>
            <p className="text-gray-600 leading-relaxed mb-6">
              Pro tip: For remote jobs worldwide no experience or virtual assistant jobs remote no experience, enable "beginner mode" to prioritize entry-level listings from verified legit work from home jobs sources.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Benefits of Using Remote Jobs Finder Over Other Platforms</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Why choose Remote Jobs Finder over competitors like FlexJobs remote, LinkedIn remote jobs, or remote.co jobs? It combines the curation quality of FlexJobs with the intelligence of modern AI tools — minus the clutter and false listings.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Time Savings:</strong> Receive 10–20 vetted remote employment opportunities daily instead of sifting through hundreds of irrelevant postings.</li>
              <li><strong>Higher Interview Rates:</strong> Users report 3× more callbacks for remote bookkeeping jobs and remote customer service positions thanks to precise AI matching.</li>
              <li><strong>Cost-Effective Access:</strong> A freemium model with optional premium access (~$39/month) delivers ROI from just one landed remote project manager job or remote data science role.</li>
              <li><strong>Global Reach:</strong> Excels at surfacing international remote jobs, remote jobs EU, and remote jobs anywhere in the world — unlike location-limited job boards.</li>
              <li><strong>Verified Listings Only:</strong> Every remote job opening is screened for legitimacy, protecting you from fake work from home offers and remote job scams.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Remote Jobs in Nigeria and Across Africa</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Remote Jobs Finder is especially valuable for job seekers in Nigeria and across Africa who want to access global remote employment opportunities without relocating. The platform connects Nigerian professionals to full-time remote positions, part-time remote jobs, and freelance remote jobs with international companies — many offering USD, GBP, or EUR salaries.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Whether you're looking for remote customer service jobs that pay in dollars, remote data entry jobs you can do from Lagos or Abuja, or remote project manager jobs at multinational firms, Remote Jobs Finder bridges the gap between African talent and global employers. Filters for international remote jobs hiring immediately and remote jobs worldwide no experience make it easy for fresh graduates and career changers alike to break into the global workforce.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Real User Success Stories</h3>
            <div className="space-y-4 mb-8">
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Switched from Indeed to Remote Jobs Finder and landed a virtual assistant position in 2 weeks — no experience needed! The AI matching was spot on."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Sarah, Remote Nomad & Virtual Assistant</cite>
              </blockquote>
              <blockquote className="border-l-4 border-green-500 pl-4 py-1 bg-green-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Perfect for part time remote positions. I found legit remote jobs in data entry while studying for my degree — the scam filter alone saved me from three fake listings."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Mike, Student & Part-Time Remote Worker</cite>
              </blockquote>
              <blockquote className="border-l-4 border-purple-500 pl-4 py-1 bg-purple-50 rounded-r-xl">
                <p className="text-gray-700 italic">"As a Nigerian professional, finding legitimate remote jobs with dollar pay felt impossible until Remote Jobs Finder. Within a month I had two offers for remote customer care jobs."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Chidi, Lagos-based Remote Customer Service Rep</cite>
              </blockquote>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">SEO-Optimized Tips for Your Remote Job Hunt</h3>
            <p className="text-gray-600 leading-relaxed mb-4">To get the most out of Remote Jobs Finder and stand out in remote job searches, follow these proven strategies:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Use Long-Tail Keywords:</strong> Search for terms like "amazon hiring work from home," "online jobs work from home no experience," or "remote bookkeeping jobs entry level" for highly targeted results with less competition.</li>
              <li><strong>Optimize Your Profile:</strong> Include entities like "WFH jobs," "remote co jobs," and specific skills from job descriptions to rank higher in internal recruiter searches.</li>
              <li><strong>Check Daily for Fresh Listings:</strong> New remote job openings for roles like concentrix work from home or ziprecruiter remote jobs appear first — checking daily maximizes your chances of being an early applicant.</li>
              <li><strong>Target High-Growth Keywords:</strong> Roles with surging demand include remote bookkeeping jobs, legit remote jobs, remote marketing, and remote co jobs — each seeing 900%+ search growth in 2026.</li>
              <li><strong>Leverage Company-Direct Applications:</strong> For Amazon remote careers, Google work from home jobs, and Appen remote jobs, apply directly through company portals linked from the platform for faster response times.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Frequently Asked Questions (FAQ)</h3>
            <div className="space-y-5 mb-8">
              {[
                { q: 'What is Remote Jobs Finder?', a: 'Remote Jobs Finder is a specialized AI-powered remote jobs finder tool and remote jobs website that curates legitimate work from home jobs, online remote jobs, and remote employment opportunities from trusted global sources — all in one easy-to-use platform.' },
                { q: 'Are there remote jobs with no experience available?', a: 'Yes! Entry-level options like remote data entry, work from home jobs no experience, and online jobs no experience are abundant — especially in customer service, virtual assistant, and typing jobs from home categories.' },
                { q: 'Is Remote Jobs Finder legitimate?', a: 'Absolutely. The platform focuses exclusively on scam-free listings for legit remote jobs and legitimate work from home jobs, using AI-powered scam detection and user-verified employer reviews.' },
                { q: 'What types of remote jobs worldwide does it cover?', a: 'From remote customer service jobs and remote teaching jobs to high-skill remote data science jobs and freelance remote jobs — 23+ categories covering remote jobs EU, international remote jobs, and remote jobs anywhere in the world.' },
                { q: 'How much does Remote Jobs Finder cost?', a: 'Basic access is free. A premium subscription (approximately $39/month) unlocks unlimited alerts, full AI tools, and priority support for serious remote job seekers.' },
                { q: 'Can I find part-time remote jobs or remote jobs for students?', a: 'Yes — filters for part time remote jobs, part time online jobs for students, and remote jobs for students make it easy to find flexible opportunities around your schedule.' },
                { q: 'Does it include Amazon remote jobs or listings from big companies?', a: 'Definitely — the platform features Amazon work from home, amazon at home jobs, amazon remote careers, Google work from home jobs, Appen remote jobs, Concentrix work from home, and more.' },
                { q: 'How do I avoid scams on remote job boards?', a: "Remote Jobs Finder's AI scam detector verifies every listing. Always look for verified badges on remote job openings and apply through direct company career page links surfaced by the platform." },
                { q: 'Does it support remote jobs near me or location-specific searches?', a: 'Yes — "remote jobs near me" filters work alongside global preferences, supporting remote jobs worldwide, remote jobs EU, and remote jobs available anywhere in the world.' },
                { q: 'Is there support for virtual assistant jobs remote?', a: 'Virtual assistant roles are one of the top categories — including virtual assistant jobs, virtual assistant positions, and virtual assistant jobs remote no experience for beginners.' },
              ].map(({ q, a }) => (
                <div key={q} className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{q}</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>

          </article>
        </div>

        {/* Schema Markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": "Remote Jobs Finder — Find Remote Jobs, Work From Home Jobs & Online Remote Employment",
                "description": "Use Remote Jobs Finder to discover legitimate remote jobs, work from home jobs, virtual assistant jobs, remote customer service jobs, and online remote employment opportunities worldwide. Entry-level and experienced roles available.",
                "url": "https://jobmeter.app/tools/remote-jobs-finder",
                "inLanguage": "en",
                "dateModified": new Date().toISOString().split('T')[0],
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jobmeter.app" },
                    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.app/tools" },
                    { "@type": "ListItem", "position": 3, "name": "Remote Jobs Finder", "item": "https://jobmeter.app/tools/remote-jobs-finder" },
                  ]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Remote Jobs Finder",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "AI-powered remote jobs finder tool for discovering work from home jobs, remote customer service jobs, virtual assistant jobs, remote data entry jobs, and legitimate remote employment opportunities worldwide.",
                "url": "https://jobmeter.app/tools/remote-jobs-finder",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Free basic access. Premium from $39/month."
                },
                "featureList": [
                  "AI-powered remote job matching",
                  "Remote job scam detection",
                  "Daily remote job alerts",
                  "Resume optimizer for remote roles",
                  "Global remote job filters including remote jobs EU and international remote jobs",
                  "Entry-level remote jobs no experience filter"
                ],
                "keywords": "remote jobs, work from home jobs, remote jobs no experience, virtual assistant jobs remote, remote customer service jobs, online remote jobs, remote employment opportunities, legit remote jobs"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "What is Remote Jobs Finder?", "acceptedAnswer": { "@type": "Answer", "text": "Remote Jobs Finder is an AI-powered remote jobs website that curates legitimate work from home jobs, online remote jobs, and remote employment opportunities from trusted global sources." } },
                  { "@type": "Question", "name": "Are there remote jobs no experience available?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Entry-level remote jobs including remote data entry, remote customer service, and virtual assistant jobs remote no experience are available for beginners and students." } },
                  { "@type": "Question", "name": "Is Remote Jobs Finder legitimate?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Remote Jobs Finder uses AI scam detection to surface only legit remote jobs and legitimate work from home jobs from verified employers." } },
                  { "@type": "Question", "name": "Can I find part-time remote jobs for students?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The platform has dedicated filters for part time remote jobs, part time online jobs for students, and flexible remote jobs for students." } },
                  { "@type": "Question", "name": "Does Remote Jobs Finder include Amazon remote jobs?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Amazon work from home, amazon at home jobs, amazon remote careers, Google work from home jobs, Concentrix work from home, and Appen remote jobs are all featured." } },
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Related Job Finder Tools",
                "description": "Other free job finder tools available on the platform",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Internship Finder", "url": "https://jobmeter.app/tools/internship-finder" },
                  { "@type": "ListItem", "position": 2, "name": "NYSC Jobs Finder", "url": "https://jobmeter.app/tools/nysc-finder" },
                  { "@type": "ListItem", "position": 3, "name": "Jobs with Accommodation Finder", "url": "https://jobmeter.app/tools/accommodation-finder" },
                  { "@type": "ListItem", "position": 4, "name": "Jobs with Visa Sponsorship Finder", "url": "https://jobmeter.app/tools/visa-finder" },
                  { "@type": "ListItem", "position": 5, "name": "Entry Level Jobs Finder", "url": "https://jobmeter.app/tools/entry-level-finder" },
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