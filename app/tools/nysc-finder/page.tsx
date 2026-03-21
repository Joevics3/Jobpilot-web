"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase, Award, Search, Filter, X, Laptop, Home, Globe, Rocket, GraduationCap, ChevronRight } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

const JOBS_PER_PAGE = 20;

export default function NYSCFinderPage() {
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
  const [rolesExpanded, setRolesExpanded] = useState(false);

  const categories = [
    { id: 'remote', label: 'Remote', icon: Laptop, url: '/tools/remote-jobs-finder' },
    { id: 'nysc', label: 'NYSC', icon: Award, url: '/tools/nysc-finder' },
    { id: 'accommodation', label: 'Accommodation', icon: Home, url: '/tools/accommodation-finder' },
    { id: 'visa', label: 'Visa', icon: Globe, url: '/tools/visa-finder' },
    { id: 'trainee', label: 'Graduate/Trainee', icon: GraduationCap, url: '/tools/graduate-trainee-finder' },
    { id: 'entry', label: 'Entry Level', icon: Rocket, url: '/tools/entry-level-finder' },
    { id: 'internship', label: 'Internship', icon: Briefcase, url: '/tools/internship-finder' },
  ];

  const popularRoles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Mobile App Developer', 'Data Analyst', 'Data Scientist', 'DevOps Engineer',
    'Cybersecurity Analyst', 'IT Support Specialist', 'Product Manager', 'Project Manager',
    'Business Analyst', 'UI/UX Designer', 'Graphic Designer', 'Digital Marketer',
    'Social Media Manager', 'Content Writer', 'SEO Specialist', 'Sales Executive',
    'Marketing Executive', 'Customer Service Representative', 'Administrative Officer',
    'Human Resources Officer', 'Recruiter', 'Accountant', 'Financial Analyst',
    'Auditor', 'Operations Manager', 'Supply Chain Officer', 'Procurement Officer',
    'Logistics Coordinator', 'Store Manager', 'Retail Sales Associate', 'Banking Officer',
    'Credit Analyst', 'Risk Analyst', 'Healthcare Assistant', 'Registered Nurse',
    'Pharmacist', 'Medical Laboratory Scientist', 'Civil Engineer', 'Mechanical Engineer',
    'Electrical Engineer', 'Architect', 'Quality Assurance Officer', 'Teacher',
    'Lecturer', 'Research Assistant', 'Graduate Trainee', 'Intern'
  ];

  const visibleRoles = rolesExpanded ? popularRoles : popularRoles.slice(0, 14);

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
    fetchNYSCJobs();
  }, [currentPage, filters, user, userOnboardingData, searchQuery]);

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

  const fetchNYSCJobs = async () => {
  try {
      setLoading(true);

      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(`Jobs API error: ${res.status}`);
      const { jobs: allJobs } = await res.json();

      // ── Primary filter ────────────────────────────────────────────────────
      let filtered = (allJobs || []).filter((job: any) =>
        (job.role_category || '').toLowerCase().includes('nysc') ||
        (job.title || '').toLowerCase().includes('nysc')
      );

      // ── Search ────────────────────────────────────────────────────────────
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((job: any) => {
          const title = (job.title || '').toLowerCase();
          const company = typeof job.company === 'string'
            ? job.company.toLowerCase()
            : (job.company?.name || '').toLowerCase();
          return title.includes(q) || company.includes(q);
        });
      }

      // ── Sector filter ─────────────────────────────────────────────────────
      if (filters.sector.length > 0) {
        filtered = filtered.filter((job: any) => filters.sector.includes(job.sector));
      }
      // ── Location filter ───────────────────────────────────────────────────
      if (filters.location.length > 0) {
        filtered = filtered.filter((job: any) =>
          filters.location.some(f => {
            if (f === 'Remote') return job.location?.remote === true;
            const city = (job.location?.city || '').toLowerCase();
            const country = (job.location?.country || '').toLowerCase();
            const state = (job.location?.state || '').toLowerCase();
            const fLower = f.toLowerCase();
            return city.includes(fLower) || country.includes(fLower) || state.includes(fLower);
          })
        );
      }

      // ── Sort + paginate ───────────────────────────────────────────────────
      filtered.sort((a: any, b: any) =>
        new Date(b.posted_date || b.created_at || 0).getTime() -
        new Date(a.posted_date || a.created_at || 0).getTime()
      );

      const total = filtered.length;
      setTotalJobs(total);
      setTotalPages(total > 0 ? Math.ceil(total / JOBS_PER_PAGE) : 1);

      const paginated = filtered.slice(
        (currentPage - 1) * JOBS_PER_PAGE,
        currentPage * JOBS_PER_PAGE
      );

      // ── Match scoring ─────────────────────────────────────────────────────
      let processedJobs;
      if (!user || !userOnboardingData) {
        processedJobs = paginated.map((job: any) => transformJobToUI(job, 0, null));
      } else {
        processedJobs = await processJobsWithMatching(paginated);
      }

      setJobs(processedJobs);
    } catch (error) {
      console.error('Error fetching NYSC jobs:', error);
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
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (filters.sector.length > 0) params.set('sector', filters.sector.join(','));
    if (filters.location.length > 0) params.set('location', filters.location.join(','));
    if (currentPage > 1) params.set('page', currentPage.toString());
    router.push(`/tools/nysc-finder?${params.toString()}`);
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
    router.push('/tools/nysc-finder');
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
            <Award size={32} />
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
              NYSC Jobs
            </h1>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Find job opportunities for NYSC corpers
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Search by job title, skill, or company</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Filter by sector and location</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Find jobs suitable for corpers</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Apply and start your service year</p>
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
                placeholder="Search NYSC jobs..."
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

          {/* Results Summary */}
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
            {loading ? 'Loading...' : `${totalJobs.toLocaleString()} NYSC jobs found`}
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
                <p style={{ color: theme.colors.text.secondary }}>Loading NYSC job opportunities...</p>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Briefcase size={48} className="text-gray-400 mb-4" />
                <p className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  No NYSC jobs found
                </p>
                <p className="text-xs text-gray-400 mt-2">Debug: {totalJobs} total jobs</p>
                <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                  {hasFilters ? 'Try adjusting your filters' : 'Check back later for new NYSC job opportunities'}
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
              { title: 'Remote Jobs',               description: 'Find remote job opportunities in Nigeria and worldwide',           icon: Laptop,        color: '#06B6D4', route: '/tools/remote-jobs-finder' },
              { title: 'Internship Finder',          description: 'Find internship opportunities to kickstart your career',           icon: Briefcase,     color: '#2563EB', route: '/tools/internship-finder' },
              { title: 'Jobs with Accommodation',   description: 'Find jobs that offer accommodation benefits',                      icon: Home,          color: '#14B8A6', route: '/tools/accommodation-finder' },
              { title: 'Jobs with Visa Sponsorship', description: 'Find jobs that offer visa sponsorship and work permits',          icon: Globe,         color: '#3B82F6', route: '/tools/visa-finder' },
              { title: 'Graduate & Trainee Jobs',   description: 'Find graduate programs and trainee positions for fresh graduates',  icon: GraduationCap, color: '#2563EB', route: '/tools/graduate-trainee-finder' },
              { title: 'Entry Level Jobs',          description: 'Find entry-level jobs for beginners starting their career',         icon: Rocket,        color: '#6366F1', route: '/tools/entry-level-finder' },
              { title: 'Quiz Platform',             description: 'Practice aptitude tests and theory questions',                     icon: Briefcase,     color: '#F59E0B', route: '/tools/quiz' },
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
              NYSC Jobs 2026: Find Job Vacancies for Corpers, NYSC PPA Opportunities, Internships, and Post-Service Careers
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Every year, over 350,000 Nigerian graduates mobilized for the National Youth Service Corps face the same urgent question: where do I find legitimate, corper-friendly job opportunities during and after my service year? The NYSC Jobs Finder on Jobmeter is built specifically to answer that question — aggregating verified NYSC job vacancies, PPA placements, internship opportunities, and entry-level positions tailored to corps members across every state in Nigeria. Whether you are in Batch A, Batch B, or Batch C Stream I or II, this platform surfaces real, active opportunities from employers who understand the NYSC calendar, value corper talent, and actively recruit through service year channels.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">What Are NYSC Jobs and Why Do They Matter?</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              NYSC jobs refer to employment and placement opportunities specifically suited for corps members — covering Primary Place of Assignment (PPA) positions, corper-friendly internships, part-time and remote roles compatible with service year commitments, and full-time positions that hire directly from the NYSC talent pool. These roles differ from standard entry-level jobs because they account for the unique constraints of service: state deployment, camp obligations, CDS (Community Development Service) days, and the monthly allawee structure.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              For employers, NYSC recruitment is one of Nigeria's most cost-effective talent acquisition strategies — accessing a pool of fresh, degree-qualified graduates who bring energy, digital skills, and current academic knowledge. For corpers, a strong PPA placement or side role during service year can mean the difference between leaving service with zero professional experience and leaving with a compelling CV, an industry network, and sometimes a confirmed job offer.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              The NYSC Jobs Finder aggregates opportunities across all major categories — NYSC job vacancies in tech, banking, oil and gas, NGOs, education, healthcare, and government — updated daily so corps members in every batch and stream can find current openings without relying on WhatsApp groups or unofficial channels where fake listings are rampant.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">NYSC Job Vacancies by Sector: What's Available in 2026</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The range of genuine NYSC job vacancies in 2026 spans far beyond the cliché of teaching in rural schools. Here is a full breakdown of active sectors and the types of roles available to corps members:
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-green-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Sector</th>
                    <th className="text-left px-4 py-3 font-semibold">Example NYSC Roles</th>
                    <th className="text-left px-4 py-3 font-semibold">Monthly Stipend Range</th>
                    <th className="text-left px-4 py-3 font-semibold">Key Employers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Technology',        'NYSC software developer, IT corper, data analyst intern, cybersecurity NYSC role',               '₦70K–₦200K',  'Andela, Flutterwave, Paystack, Interswitch'],
                    ['Banking & Finance', 'NYSC bank teller, customer service corper, credit analyst NYSC, banking NYSC jobs',               '₦50K–₦120K',  'GTBank, Zenith, Access Bank, UBA, First Bank'],
                    ['Oil & Gas',         'NYSC field assistant, engineering corper, HSE NYSC intern, TotalEnergies NYSC',                   '₦80K–₦250K',  'Shell, TotalEnergies, Chevron, NNPC, Seplat'],
                    ['NGOs & Development','NYSC program officer, community dev corper, UNICEF NYSC, NGO internship corper',                  '₦40K–₦100K',  'UNICEF, Save the Children, RED, ActionAid'],
                    ['Education',         'NYSC teacher, school administrator corper, NYSC teaching jobs, lecturer assistant',               '₦33K + allowances', 'State schools, private schools, universities'],
                    ['Healthcare',        'NYSC pharmacist, medical lab corper, hospital admin NYSC, nursing support',                       '₦50K–₦120K',  'LUTH, UCH, federal hospitals, private clinics'],
                    ['Marketing & Sales', 'NYSC sales executive, digital marketing corper, brand promoter NYSC',                             '₦40K–₦100K',  'FMCG firms, agencies, telecoms'],
                    ['Media & Content',   'NYSC content writer, social media corper, journalist intern, PR NYSC',                            '₦40K–₦90K',   'Media houses, PR agencies, brands'],
                  ].map(([sector, roles, stipend, employers]) => (
                    <tr key={sector} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{sector}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{roles}</td>
                      <td className="px-4 py-3 text-gray-600">{stipend}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{employers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Technology roles represent the fastest-growing NYSC job category in 2026, with Nigerian fintech and tech companies actively recruiting corpers as software developers, IT support officers, data analysts, and product interns. Stipends in tech can reach ₦150,000–₦200,000 monthly — significantly above the standard federal allawee — making a tech PPA one of the most financially rewarding placements available. Oil and gas roles in Rivers State, Delta, and Bayelsa also rank highly for corpers willing to take on field-adjacent assignments.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How to Find Your NYSC PPA: A Practical Guide for Corpers</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Finding the right Primary Place of Assignment is the single most career-defining decision of your service year. A strong PPA placement in a reputable organization can launch your career; a poorly matched placement wastes 11 months of critical early-career time. Here's the practical guide corps members need:
            </p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
              <li><strong>Use the NYSC Jobs Finder Before Camp Ends:</strong> The best PPA placements at top companies — banks, tech firms, oil majors — are often arranged before or during camp, not after. Use Jobmeter's NYSC jobs filter to identify organizations in your deployment state that are actively accepting corps members, and reach out before your camp closes.</li>
              <li><strong>Reach Out Directly to Target Companies:</strong> Many top employers (Andela, Interswitch, Shell, GTBank) have dedicated NYSC recruitment processes. Email their HR departments directly with your green card, statement of result, and a tailored one-page CV. Mention your deployment state explicitly. Companies with offices in your state are legally obligated to accept NYSC placements under certain conditions.</li>
              <li><strong>Leverage Your University Network:</strong> Alumni from your institution who completed NYSC in your deployment state are your best source of active PPA leads. WhatsApp alumni groups, LinkedIn connections, and university career offices often have direct employer contacts that are not publicly listed on job boards.</li>
              <li><strong>Use the NYSC CV Bank:</strong> The official NYSC CV bank (accessible through the NYSC portal) is reviewed by registered employers. Keeping your profile updated with current skills, certifications, and SAED training details increases your visibility to employers actively searching for corps members in your state.</li>
              <li><strong>Apply to NYSC-Specific Job Listings on Jobmeter:</strong> Set real-time alerts for "NYSC jobs," "jobs for corpers," and sector-specific terms like "NYSC tech jobs" or "NYSC bank jobs" to receive instant notifications when new placements go live. Many employers post openings for upcoming batches weeks before mobilization.</li>
              <li><strong>Have a Backup Plan:</strong> Always apply to 3–5 PPA options simultaneously. If your first-choice organization cannot formally absorb you, having backup options prevents you from landing a non-professional PPA by default.</li>
            </ol>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">NYSC Internships and Pre-Service Opportunities</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              NYSC internship programs — positions that function as PPA placements with structured training components — are available across multiple sectors and often represent the highest-value service year placements for career development. The best NYSC internship opportunities in 2026 include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Tech Internships (Andela, Paystack, Flutterwave, Interswitch):</strong> These fintech and tech giants actively absorb NYSC corpers as software engineering interns, product associates, data analyst interns, and customer success roles. Stipends range from ₦100,000–₦200,000 monthly, and the best performers frequently receive return offers post-POP.</li>
              <li><strong>Banking Internships (GTBank, Access Bank, UBA, Zenith):</strong> Nigeria's top banks run structured NYSC programs that rotate corpers through retail banking, credit, operations, and digital banking units. These placements build the most transferable finance skills and often lead directly to management trainee offers.</li>
              <li><strong>Oil & Gas Internships (Shell, TotalEnergies, Chevron, Seplat):</strong> Engineering, geoscience, HSE, and commercial corpers can access structured placements at oil majors, particularly in Port Harcourt, Warri, and Lagos. These roles pay the highest stipends and carry the strongest brand value on a CV.</li>
              <li><strong>NGO & Development Sector (UNICEF, Save the Children, ActionAid):</strong> International development organizations in Nigeria actively recruit NYSC corpers for program officer, M&E, communications, and administrative roles. Excellent for corpers targeting international careers or development sector paths.</li>
              <li><strong>Pre-NYSC Internships (SIWES):</strong> Final-year students can secure internships via SIWES (Student Industrial Work Experience Scheme) at firms like Exxon, Microsoft, and Google — with some of these converting into PPA placements or direct post-NYSC opportunities.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Remote and Work-From-Home NYSC Jobs for Corpers</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              One of the most significant shifts in the NYSC job landscape post-2020 is the explosion of remote and hybrid roles that corpers can take on alongside or instead of a traditional PPA. The NYSC Jobs Finder on Jobmeter covers hundreds of work-from-home listings compatible with corps member schedules and state deployment constraints.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Popular remote NYSC roles include content writing and copywriting positions, social media management, virtual assistant jobs, remote customer support roles, data entry and analysis positions, online tutoring and e-learning facilitation, and freelance design and development work. For corpers deployed to states where in-person placement opportunities are limited — particularly in rural deployments — remote roles provide a way to build professional experience and supplementary income simultaneously. Many corpers in tech build freelance client bases during their service year that sustain them financially well beyond POP.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">NYSC Jobs by Location: Top States for Corper Placements</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-green-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">State</th>
                    <th className="text-left px-4 py-3 font-semibold">Top Sectors for Corpers</th>
                    <th className="text-left px-4 py-3 font-semibold">Key Employers Active</th>
                    <th className="text-left px-4 py-3 font-semibold">Opportunity Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Lagos',          'Tech, Banking, FMCG, Media, NGOs',           'Andela, GTBank, Unilever, Channels TV',  '🔥 Highest'],
                    ['Abuja (FCT)',    'Government, NGOs, Tech, Finance',             'UNICEF, CBN, MTN, World Bank',           '🔥 Very High'],
                    ['Port Harcourt', 'Oil & Gas, Engineering, Banking',              'Shell, TotalEnergies, Zenith, Seplat',   '🔥 Very High'],
                    ['Kano',          'Manufacturing, FMCG, Banking',                'Dangote, PZ Cussons, Access Bank',       '⚡ High'],
                    ['Ibadan',        'Education, Healthcare, FMCG',                 'UCH, UI, Nestle, Guinness',              '⚡ High'],
                    ['Enugu',         'Banking, Education, Healthcare',              'First Bank, State Hospitals, schools',   '🟡 Moderate'],
                    ['Benin City',    'Banking, Education, Engineering',             'Access Bank, UNIBEN, construction firms','🟡 Moderate'],
                    ['Rural States',  'Education, Healthcare (high need)',           'State secondary schools, health centres','🟢 Available'],
                  ].map(([state, sectors, employers, level]) => (
                    <tr key={state} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{state}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{sectors}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{employers}</td>
                      <td className="px-4 py-3 text-gray-600">{level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Post-NYSC Jobs: Converting Your Service Year into a Career</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              The service year is not just about fulfilling a national obligation — it's a 12-month career runway. Corps members who use their service year strategically leave NYSC with a professional edge that dramatically shortens their post-service job search. Here's how to convert your NYSC period into direct employment:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Perform at Your PPA Above Expectations:</strong> The single most reliable path to a post-NYSC job offer is outstanding performance at your PPA. Many Nigerian employers — particularly banks, fintech firms, and oil companies — use PPA placements as a year-long interview. Corpers who demonstrate reliability, initiative, and skill are frequently offered permanent roles before POP.</li>
              <li><strong>Build Skills Alongside Your PPA:</strong> Use evenings and weekends during service to acquire certifications that your target industry values — Google certifications for digital marketing, CompTIA for IT, ICAN/ACCA for finance, AWS/Azure for cloud, or a coding bootcamp for tech. These credentials dramatically strengthen post-service applications.</li>
              <li><strong>Network at Every CDS Meeting and State Event:</strong> CDS groups bring together corpers from across industries and institutions. The corper sitting next to you in CDS may have a cousin who is a hiring manager at your target company. Treat every NYSC gathering as a professional networking opportunity.</li>
              <li><strong>Apply Early — Don't Wait for POP:</strong> Start applying for post-service jobs 3–4 months before your POP date. Most competitive graduate trainee programs at banks, FMCG companies, and tech firms open applications annually on fixed schedules. Missing an application window because you waited until your green card arrived can cost you a full year.</li>
              <li><strong>Use Jobmeter's Graduate Trainee and Entry Level Finders:</strong> The Graduate & Trainee Jobs Finder and Entry Level Jobs Finder on Jobmeter are specifically designed for the post-NYSC transition — surfacing management trainee programs, junior roles, and entry-level positions that explicitly welcome fresh NYSC graduates.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Real Stories from NYSC Corpers</h3>
            <div className="space-y-4 mb-8">
              <blockquote className="border-l-4 border-green-500 pl-4 py-1 bg-green-50 rounded-r-xl">
                <p className="text-gray-700 italic">"I found my Paystack PPA through Jobmeter's NYSC jobs finder two weeks before camp ended. I emailed their HR directly with my green card, got an interview in camp, and started my placement on week one after passing out. They offered me a full role before my POP."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Chidera, NYSC Corper → Junior Product Associate, Paystack Lagos</cite>
              </blockquote>
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic">"I was deployed to Kano and worried there'd be nothing for a computer science graduate. Found a remote data entry role through the NYSC finder that paid ₦80K/month on top of my allawee. Ended service with 11 months of professional experience and a portfolio."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Emeka, Remote Data Role, deployed to Kano State</cite>
              </blockquote>
              <blockquote className="border-l-4 border-purple-500 pl-4 py-1 bg-purple-50 rounded-r-xl">
                <p className="text-gray-700 italic">"Shell's Port Harcourt placement appeared on the NYSC Jobs Finder for Batch B. Applied immediately, got accepted, and now I have an oil & gas PPA paying ₦180K monthly. The finder is the only place I saw it listed."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Ngozi, NYSC Engineering Corper, Shell Port Harcourt</cite>
              </blockquote>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Frequently Asked Questions About NYSC Jobs</h3>
            <div className="space-y-5 mb-8">
              {[
                { q: 'What is the best NYSC job portal for corpers in 2026?', a: 'Jobmeter\'s NYSC Jobs Finder is the most comprehensive corper-specific job board, aggregating verified NYSC vacancies daily across all sectors and states. Other useful platforms include Jobberman\'s corper section, MyJobMag, and the official NYSC CV Bank (portal.nysc.org.ng). Always verify listings before submitting documents, as fake "NYSC job portals" are common on social media.' },
                { q: 'How do I find a good PPA (Primary Place of Assignment)?', a: 'Use the NYSC Jobs Finder on Jobmeter to identify employers actively accepting corps members in your deployment state. Apply directly to HR contacts 2–3 weeks before or during camp. Leverage university alumni networks in your state. Maintain an updated profile on the official NYSC CV Bank. Apply to 3–5 options simultaneously to avoid ending up with a default placement.' },
                { q: 'Which sectors offer the best NYSC jobs in terms of pay?', a: 'Oil & gas (₦80K–₦250K), technology/fintech (₦70K–₦200K), and banking (₦50K–₦120K) offer the highest NYSC stipends above the federal allawee. NGO roles offer the best international exposure and career development for corpers targeting development sector careers. Education placements are most widely available but typically rely on the standard allawee only.' },
                { q: 'Can I work a remote job while serving as an NYSC corper?', a: 'Yes — many corpers take on remote work-from-home roles (content writing, virtual assistance, data analysis, social media management, freelance development) alongside their PPA, provided it doesn\'t conflict with CDS obligations and service hour requirements. The NYSC Jobs Finder includes remote-compatible roles specifically listed as corper-friendly.' },
                { q: 'What are NYSC batch dates and how do they affect job applications?', a: 'NYSC mobilizes three batches annually: Batch A (typically January–March mobilization), Batch B (June–August), and Batch C (October–November). Each batch has Stream I and Stream II. Understanding your batch timing helps you align job applications — most major employer NYSC recruitment windows open 4–8 weeks before each batch\'s mobilization date. Set Jobmeter alerts for your batch period.' },
                { q: 'How do I apply for NYSC jobs at companies like Interswitch or Andela?', a: 'Search "NYSC jobs" on Jobmeter to find current openings at Interswitch, Andela, and similar tech companies. For direct applications: email the company\'s HR department with your NYSC green card, statement of result, and a one-page CV tailored to their open role. Mention your deployment state and batch. LinkedIn is also effective for connecting directly with HR managers at target companies during camp.' },
                { q: 'Are there NYSC jobs in Rivers State for oil and gas corpers?', a: 'Yes — Rivers State (Port Harcourt) is Nigeria\'s most active location for oil and gas NYSC placements, with Shell, TotalEnergies, Seplat, First E&P, and numerous oil services companies regularly absorbing engineering, geoscience, HSE, and commercial corpers. Set a location filter for Port Harcourt / Rivers on the NYSC Jobs Finder to surface current openings in this hub.' },
                { q: 'How do I avoid fake NYSC job sites and scams?', a: 'Only use verified platforms: Jobmeter\'s NYSC finder, Jobberman, MyJobMag, and the official NYSC portal (nysc.org.ng). Never pay any fee to secure a PPA or NYSC job placement — legitimate employers never charge corpers for placements. Be cautious of WhatsApp-only job offers, suspiciously high stipend promises, and websites mimicking "nyscjobs.ng" or "nysc job portal" that ask for payment.' },
                { q: 'What skills should I develop during NYSC to improve job prospects?', a: 'The highest-return skills to develop during NYSC service year: coding/programming (Python, JavaScript) for tech roles; data analysis (SQL, Excel, Power BI); digital marketing (Google Analytics, Meta Ads); financial modeling (Excel, accounting software) for finance roles; and communication/presentation skills for management roles. Many free certifications (Google Career Certificates, Coursera, etc.) can be completed evenings and weekends during service.' },
                { q: 'How do I convert my NYSC PPA into a permanent job offer?', a: 'Perform above expectations consistently throughout your placement. Volunteer for projects outside your immediate role. Build genuine relationships with your supervisor and team. Discuss your interest in a permanent role early — around month 6 or 7 — so your supervisor can advocate for you internally. Many Nigerian employers use NYSC placements as extended interviews and have clear pipelines for converting high-performing corpers into permanent staff.' },
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
                "name": "NYSC Jobs Finder — Find Job Vacancies for Corpers, PPA Opportunities & NYSC Internships 2026",
                "description": "Find NYSC jobs, corper job vacancies, PPA placements, NYSC internships, and post-service career opportunities across all sectors and states in Nigeria. The best NYSC job portal for corps members in 2026.",
                "url": "https://jobmeter.app/tools/nysc-finder",
                "inLanguage": "en",
                "dateModified": new Date().toISOString().split('T')[0],
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://jobmeter.app" },
                    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.app/tools" },
                    { "@type": "ListItem", "position": 3, "name": "NYSC Jobs Finder", "item": "https://jobmeter.app/tools/nysc-finder" },
                  ]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "NYSC Jobs Finder",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "The best NYSC job portal for Nigerian corps members — aggregating verified NYSC job vacancies, PPA placements, corper internships, remote roles, and post-service career opportunities across all sectors and states in Nigeria, updated daily.",
                "url": "https://jobmeter.app/tools/nysc-finder",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "NGN",
                  "description": "Free to use for all NYSC corps members."
                },
                "featureList": [
                  "Real-time NYSC job vacancies updated daily",
                  "PPA placement opportunities by state",
                  "Remote and work-from-home jobs for corpers",
                  "NYSC internships in tech, banking, oil & gas, NGOs",
                  "Sector filters: Technology, Finance, Oil & Gas, Healthcare, Education",
                  "Location filter by NYSC deployment state",
                  "Batch-specific job alerts (A, B, C, Stream I & II)",
                  "Direct employer contact support for PPA applications",
                  "Post-NYSC graduate trainee and entry level job links",
                  "Verified listings — no fake NYSC job portals"
                ],
                "keywords": "NYSC jobs, jobs for corpers, nysc job vacancies, nysc ppa, nysc internship, nysc recruitment, nysc job portal, nysc tech jobs, nysc bank jobs, jobs for nysc corpers 2026"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "What is the best NYSC job portal for corpers in 2026?", "acceptedAnswer": { "@type": "Answer", "text": "Jobmeter's NYSC Jobs Finder is the most comprehensive corper-specific job board, aggregating verified NYSC vacancies daily across all sectors and states. Always verify listings before submitting documents — never pay any fee to secure a PPA or placement." } },
                  { "@type": "Question", "name": "How do I find a good PPA (Primary Place of Assignment)?", "acceptedAnswer": { "@type": "Answer", "text": "Use Jobmeter's NYSC Jobs Finder to identify employers actively accepting corps members in your deployment state. Apply directly 2–3 weeks before or during camp, leverage alumni networks, maintain an updated NYSC CV Bank profile, and apply to 3–5 options simultaneously." } },
                  { "@type": "Question", "name": "Can I work a remote job while serving as an NYSC corper?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — content writing, virtual assistance, data analysis, social media management, and freelance development are all remote-compatible NYSC-friendly roles listed on Jobmeter's NYSC finder, provided they don't conflict with CDS obligations." } },
                  { "@type": "Question", "name": "Which sectors offer the best NYSC stipends?", "acceptedAnswer": { "@type": "Answer", "text": "Oil & gas (₦80K–₦250K monthly), technology/fintech (₦70K–₦200K), and banking (₦50K–₦120K) offer the highest NYSC stipends above the federal allawee. Tech roles at firms like Paystack, Andela, and Interswitch are particularly competitive." } },
                  { "@type": "Question", "name": "How do I avoid fake NYSC job portals and scams?", "acceptedAnswer": { "@type": "Answer", "text": "Only use verified platforms: Jobmeter's NYSC finder, Jobberman, MyJobMag, and the official NYSC portal (nysc.org.ng). Never pay any fee to secure a PPA — legitimate employers never charge corpers for placements. Avoid WhatsApp-only job offers and sites mimicking established portals." } },
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Related Job Finder Tools on Jobmeter",
                "description": "Other free job finder tools available on jobmeter.app",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Internship Finder",           "url": "https://jobmeter.app/tools/internship-finder" },
                  { "@type": "ListItem", "position": 2, "name": "Graduate & Trainee Jobs",     "url": "https://jobmeter.app/tools/graduate-trainee-finder" },
                  { "@type": "ListItem", "position": 3, "name": "Entry Level Jobs Finder",     "url": "https://jobmeter.app/tools/entry-level-finder" },
                  { "@type": "ListItem", "position": 4, "name": "Remote Jobs Finder",          "url": "https://jobmeter.app/tools/remote-jobs-finder" },
                  { "@type": "ListItem", "position": 5, "name": "Jobs with Accommodation",     "url": "https://jobmeter.app/tools/accommodation-finder" },
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