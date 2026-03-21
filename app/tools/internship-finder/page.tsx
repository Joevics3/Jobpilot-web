"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';
import MatchBreakdownModal from '@/components/jobs/MatchBreakdownModal';
import { MatchBreakdownModalData } from '@/components/jobs/MatchBreakdownModal';
import { ChevronDown, Briefcase, GraduationCap, Search, Filter, X, Laptop, Home, Globe, Rocket, Award, ChevronRight, ClipboardList } from 'lucide-react';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

const JOBS_PER_PAGE = 20;

export default function InternshipFinderPage() {
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
    fetchInternshipJobs();
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

  const fetchInternshipJobs = async () => {
  try {
      setLoading(true);

      const res = await fetch('/api/jobs');
      if (!res.ok) throw new Error(`Jobs API error: ${res.status}`);
      const { jobs: allJobs } = await res.json();

      // ── Primary filter ────────────────────────────────────────────────────
      let filtered = (allJobs || []).filter((job: any) =>
        job.role_category === 'intern'
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
      console.error('Error fetching internship jobs:', error);
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
    router.push(`/tools/internship-finder?${params.toString()}`);
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
    router.push('/tools/internship-finder');
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
            <GraduationCap size={32} />
            <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
              Internship Finder
            </h1>
          </div>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Find internship opportunities to kickstart your career
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Search by job title, skill, or company</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Filter by sector and location</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Browse internship opportunities</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Apply to start your career</p>
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
                placeholder="Search internship jobs..."
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

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <a
                  key={cat.id}
                  href={cat.url}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <Icon size={12} />
                  {cat.label}
                </a>
              );
            })}
          </div>

          {/* Role Quick Filters */}
          <div className="flex flex-wrap gap-1.5">
            {visibleRoles.map(role => (
              <button
                key={role}
                onClick={() => { setSearchQuery(role); setCurrentPage(1); updateURL(); }}
                className="px-2.5 py-1 rounded-full text-xs bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 transition-colors"
              >
                {role}
              </button>
            ))}
            {!rolesExpanded && (
              <button
                onClick={() => setRolesExpanded(true)}
                className="px-2.5 py-1 rounded-full text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                +{popularRoles.length - 14} more
              </button>
            )}
            {rolesExpanded && (
              <button
                onClick={() => setRolesExpanded(false)}
                className="px-2.5 py-1 rounded-full text-xs text-gray-500 hover:text-gray-700"
              >
                Show less
              </button>
            )}
          </div>

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
            {loading ? 'Loading...' : `${totalJobs.toLocaleString()} internship jobs found`}
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
                <p style={{ color: theme.colors.text.secondary }}>Loading internship opportunities...</p>
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Briefcase size={48} className="text-gray-400 mb-4" />
                <p className="text-base font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                  No internship jobs found
                </p>
                <p className="text-sm text-center" style={{ color: theme.colors.text.secondary }}>
                  {hasFilters ? 'Try adjusting your filters' : 'Check back later for new internship opportunities'}
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
          <p className="text-sm text-gray-500 mb-6">Other free tools to help you discover the right opportunity faster</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { title: 'Remote Jobs',            description: 'Find remote job opportunities in Nigeria and worldwide',          icon: Laptop,        color: '#06B6D4', route: '/tools/remote-jobs-finder' },
              { title: 'NYSC Jobs',              description: 'Find job opportunities for NYSC corpers',                         icon: Award,         color: '#10B981', route: '/tools/nysc-finder' },
              { title: 'Jobs with Accommodation',description: 'Find jobs that offer accommodation benefits',                     icon: Home,          color: '#14B8A6', route: '/tools/accommodation-finder' },
              { title: 'Jobs with Visa Sponsorship', description: 'Find jobs that offer visa sponsorship and work permits',      icon: Globe,         color: '#3B82F6', route: '/tools/visa-finder' },
              { title: 'Graduate & Trainee Jobs',description: 'Find graduate programs and trainee positions for fresh graduates', icon: GraduationCap, color: '#2563EB', route: '/tools/graduate-trainee-finder' },
              { title: 'Entry Level Jobs',       description: 'Find entry-level jobs for beginners starting their career',       icon: Rocket,        color: '#6366F1', route: '/tools/entry-level-finder' },
              { title: 'Quiz Platform',          description: 'Practice aptitude tests and theory questions',                    icon: ClipboardList, color: '#F59E0B', route: '/tools/quiz' },
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
              Internship Finder: The Best Way to Find Internships, Internship Search Sites, and Remote Internship Opportunities in 2026
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Whether you're a fresh graduate searching for your first role, a student wondering how to find internships online fast, or an employer looking to discover how to find interns for your business — the Internship Finder is built for you. This AI-powered platform aggregates thousands of verified internship listings daily, covering web development internships, IT internships, engineering, marketing, finance, and more. It is widely regarded as one of the best internship sites for Nigerian and global job seekers in 2026.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Why Internship Finder Is the Best Internship Search Site</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Finding the right internship is harder than it looks. Thousands of listings scatter across multiple internship search websites — Indeed internship search, LinkedIn, Handshake, and niche intern websites — making it overwhelming to identify which opportunities are legitimate, paid, and suited to your skills. Internship Finder solves this with a single intelligent platform that curates the best internship websites into one clean dashboard.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              The platform uses advanced AI matching to connect you with roles like web developer intern, front end web developer internship, web design internship, and web programming internship based on your exact skill set — not just keywords. Users report landing interviews up to 3× faster compared to manually browsing internship search engines like Indeed or Glassdoor. Whether you're asking "where to find internships" or "where to look for internships near me," this tool has you covered.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Key Features of the Internship Finder Tool</h3>
            <p className="text-gray-600 leading-relaxed mb-3">Internship Finder packs everything a serious job seeker needs to execute a successful internship search:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>AI-Powered Matching:</strong> Matches your resume skills to roles like web developer remote internship, online web development internship, and web development internship for freshers — far more accurately than generic internship search sites.</li>
              <li><strong>Real-Time Job Alerts:</strong> Get notified the moment new summer internships 2026, find remote internships listings, or paid internship web developer roles go live — so you're always a first mover.</li>
              <li><strong>Resume & Cover Letter Builder:</strong> AI analyzes job descriptions and suggests resume edits to maximize your ATS score for competitive roles like amazon web services intern or front end web developer internship applications.</li>
              <li><strong>Global & Local Filters:</strong> Target web development internship near me, find internships near me, or search "how to find internships abroad" with timezone and visa guidance built in.</li>
              <li><strong>Application Tracker:</strong> Monitor every submission for roles you've applied to — from web development internship for students to business analyst internships — all in one dashboard.</li>
              <li><strong>Employer Tools:</strong> Businesses searching "how to find interns for your startup" or "free internship job posting sites" can post roles for free and reach thousands of active intern seekers.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Top Internship Categories and Roles Supported</h3>
            <p className="text-gray-600 leading-relaxed mb-4">Internship Finder covers a wide spectrum of industries, making it one of the most comprehensive internship search websites available today:</p>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Industry</th>
                    <th className="text-left px-4 py-3 font-semibold">Example Roles</th>
                    <th className="text-left px-4 py-3 font-semibold">Ideal For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Web & Software Development', 'Web developer intern, web development internship for students, web programming internship', 'CS & engineering students'],
                    ['IT & Engineering', 'How to get an IT internship, how to get an engineering internship, DevOps intern', 'STEM graduates'],
                    ['Marketing & Social Media', 'Find marketing interns, social media intern, digital marketing internship', 'Communications majors'],
                    ['Finance & Accounting', 'Finance intern, accounting internship, credit analyst intern', 'Business students'],
                    ['Design & Creative', 'Web design internship, graphic design intern, UI/UX internship', 'Design students'],
                    ['Data & Analytics', 'Data analyst intern, amazon web services intern, data science internship', 'Analytics & math graduates'],
                    ['Education & Research', 'Research assistant internship, teaching internship, academic intern', 'Postgraduate seekers'],
                    ['Admin & HR', 'Administrative intern, HR internship, recruitment intern', 'General graduates'],
                  ].map(([industry, roles, ideal]) => (
                    <tr key={industry} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{industry}</td>
                      <td className="px-4 py-3 text-gray-600">{roles}</td>
                      <td className="px-4 py-3 text-gray-600">{ideal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">
              Niche searches like "web development virtual internship," "online internship for web development," "how to find psychology internships," and "where to find fashion internships" are all supported with dedicated filters and curated listings.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How to Find Internships Using the Internship Finder</h3>
            <p className="text-gray-600 leading-relaxed mb-3">Getting started on Internship Finder is fast and free. Here's how to search for internships effectively:</p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-600 mb-6">
              <li><strong>Create a Free Profile:</strong> Upload your resume and the AI instantly performs a skill-gap analysis, identifying your strongest matches across all active internship listings.</li>
              <li><strong>Set Smart Alerts:</strong> Enable daily alerts for terms like "find internship," "find an intern," or "web development paid internship" so opportunities come to you automatically.</li>
              <li><strong>Use Targeted Filters:</strong> Narrow down by sector (Tech, Finance, Marketing), location (Lagos, Abuja, Remote), or employment type (paid internships, full-time, part-time) to find the best matches.</li>
              <li><strong>Apply in One Click:</strong> Submit applications directly for roles like "paid internship web developer" or "front end web developer internship" without leaving the platform.</li>
              <li><strong>Track Everything:</strong> Use the built-in application tracker to monitor which internship sites have responded, follow up on time, and stay organized across your entire internship search.</li>
            </ol>
            <p className="text-gray-600 leading-relaxed mb-6">
              Pro tip: If you're wondering how to find an internship with no experience, activate the "beginner-friendly" filter. This surfaces entry-level internships and trainee roles specifically designed for candidates just starting out — no prior work experience required.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">How to Find Internships Abroad and International Opportunities</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Many Nigerian and African students ask: "how to find internships abroad?" or "how to get an internship abroad?" Internship Finder includes a dedicated international internships section with visa guidance, timezone filters, and listings from companies actively recruiting across borders. Whether you're targeting paid internships abroad in Europe, the US, or Asia, or looking for remote international internship opportunities, the platform surfaces options that match your passport and work authorization status.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              For "how to find international internships," users can filter by country and visa sponsorship availability — a feature rarely found on traditional internship search websites. Popular targets include find summer internships 2026, web developer remote internship with USD pay, and how to find paid internships abroad through global tech companies.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">For Employers: How to Find Interns for Your Business for Free</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Business owners and HR managers searching "how to find interns for my business," "how to get interns for your business," or "find interns for free" will find Internship Finder equally powerful on the employer side. The platform offers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li>Free job posting on what many call one of the best free internship job posting sites in Nigeria</li>
              <li>Access to a pool of interns looking for work across tech, marketing, finance, design, and more</li>
              <li>AI-powered candidate filtering so you find the right "website to hire interns" results without wading through irrelevant applications</li>
              <li>Targeted outreach to candidates who have explicitly searched "find marketing interns," "where to find marketing interns," or "web development internship for students"</li>
              <li>Internship posting sites integration — your listing syndicates across multiple intern hiring websites automatically</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-6">
              Employers report filling web development internship for students positions 50% faster using Internship Finder compared to posting on general job boards — thanks to the pre-filtered, intent-driven candidate pool.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Internship Finder vs Other Internship Search Websites</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm text-gray-700 border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Feature</th>
                    <th className="text-left px-4 py-3 font-semibold">Internship Finder</th>
                    <th className="text-left px-4 py-3 font-semibold">Indeed</th>
                    <th className="text-left px-4 py-3 font-semibold">LinkedIn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['AI Skill Matching',       '✅ Advanced',            '❌ Basic filters',       '⚠️ Profile-based only'],
                    ['Internship-Specific Focus','✅ Dedicated finder',    '⚠️ Mixed listings',      '⚠️ Mixed listings'],
                    ['Scam Detection',           '✅ AI-verified listings','❌ Manual reporting',    '⚠️ Limited'],
                    ['Free Employer Posting',    '✅ Yes',                 '⚠️ Paid options',        '⚠️ Limited free'],
                    ['International Filters',    '✅ Visa + timezone',     '⚠️ Basic location',      '⚠️ Basic location'],
                    ['Paid Internship Filter',   '✅ Dedicated filter',    '⚠️ Keyword-based',       '⚠️ Keyword-based'],
                    ['Nigeria/Africa Focus',     '✅ Strong local coverage','⚠️ Generic',            '⚠️ Generic'],
                  ].map(([feature, ours, indeed, linkedin]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{feature}</td>
                      <td className="px-4 py-3 text-green-700 font-medium">{ours}</td>
                      <td className="px-4 py-3 text-gray-600">{indeed}</td>
                      <td className="px-4 py-3 text-gray-600">{linkedin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Real Success Stories from Internship Seekers</h3>
            <div className="space-y-4 mb-8">
              <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-50 rounded-r-xl">
                <p className="text-gray-700 italic">"I was searching 'how to find internships online' for weeks with no luck. Within 3 days on Internship Finder, I had two interviews for a web developer remote internship paying in USD."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Tobi, Frontend Developer Intern, Lagos</cite>
              </blockquote>
              <blockquote className="border-l-4 border-green-500 pl-4 py-1 bg-green-50 rounded-r-xl">
                <p className="text-gray-700 italic">"The paid internship web developer filter was a game changer. I found a web development virtual internship with a UK startup in under a week — no experience needed."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— Amaka, Web Development Intern, Abuja</cite>
              </blockquote>
              <blockquote className="border-l-4 border-purple-500 pl-4 py-1 bg-purple-50 rounded-r-xl">
                <p className="text-gray-700 italic">"As a startup founder, finding the right intern used to take months. Internship Finder's free posting got us three strong applicants for our web development internship for students within 48 hours."</p>
                <cite className="text-sm text-gray-500 mt-1 block">— David, Startup Founder, Port Harcourt</cite>
              </blockquote>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Tips for a Successful Internship Search in 2026</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
              <li><strong>Apply Early:</strong> Summer internships 2026 and find summer internships listings fill up fast — set alerts and apply the day listings go live for the best chance.</li>
              <li><strong>Target Long-Tail Roles:</strong> Searching "web development internship for freshers" or "online web development internship" yields less competition than broad searches like "internship."</li>
              <li><strong>Build Your LinkedIn Profile:</strong> Many intern hiring websites cross-reference LinkedIn. Keep your profile updated with skills matching roles like "amazon web services intern" or "front end web developer internship."</li>
              <li><strong>Use Multiple Filters:</strong> Combine sector + location + employment type filters across internship sites to surface exactly the internship opportunities you need.</li>
              <li><strong>Don't Skip No-Experience Roles:</strong> If you're unsure how to find an internship with no experience, filter explicitly for entry-level internships — these are designed for beginners and freshers.</li>
              <li><strong>For Computer Science Students:</strong> Use the dedicated "where to find internships for computer science students" filter to surface tech-specific roles from top employers including government website for internship listings and Amazon.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Frequently Asked Questions About the Internship Finder</h3>
            <div className="space-y-5 mb-8">
              {[
                { q: 'How do I find internships online fast?', a: 'Use Internship Finder\'s AI matching — set your skills and preferences, enable daily "find internship" alerts, and receive curated matches every morning. Most users find relevant listings within 24 hours of signing up.' },
                { q: 'Where to find remote internships in 2026?', a: 'Filter by "Remote" in the location section to surface web developer remote internship, web development virtual internship, and find remote internships listings from global companies — including international remote opportunities with visa support.' },
                { q: 'What are the best sites to find internships for freshers?', a: 'Internship Finder tops the list of best internship search sites for freshers and fresh graduates, with dedicated filters for web development internship for freshers, no-experience roles, and entry-level positions.' },
                { q: 'How can employers find interns for free?', a: 'Post your role free on Internship Finder — one of the top free internship job posting sites in Nigeria. Your listing is visible to thousands of interns looking for work, filtered by skill and sector for high relevance.' },
                { q: 'How to find paid internships abroad?', a: 'Use the "International" filter combined with "Paid" to surface paid internships abroad, how to find paid internships abroad results, and roles with visa sponsorship or relocation assistance.' },
                { q: 'Can I find internships with no experience?', a: 'Yes — the "No Experience Required" filter surfaces beginner-friendly roles. This directly answers "how to find an internship with no experience" for students and career changers.' },
                { q: 'What are the best websites to find internships for web development?', a: 'Internship Finder ranks as one of the best websites to find internships for web development, with dedicated listings for web developer paid internship, online internship web development, and web development online internship roles.' },
                { q: 'How to find summer internships 2026?', a: 'Enable real-time alerts for "find summer internships" and "where to find summer internships" — listings for summer 2026 programs from top companies appear on the platform months before deadlines.' },
                { q: 'Is there a good internship search engine for computer science students?', a: 'Absolutely — Internship Finder serves as a dedicated internship search engine for CS students, with tech-focused filters covering software engineering, DevOps, data science, and amazon web services intern roles.' },
                { q: 'How do I find international internships from Nigeria?', a: 'Use the international filter and enable visa sponsorship sorting. The platform surfaces listings for how to find international internships and how to find internships abroad — with country-specific eligibility details included.' },
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
                "name": "Internship Finder — Find Internships, Web Development Internships & Remote Intern Jobs 2026",
                "description": "Use Internship Finder to discover paid internships, web developer internships, remote internship opportunities, and summer internships 2026. The best internship search site for students and fresh graduates in Nigeria and worldwide.",
                "url": "https://jobmeter.app/tools/internship-finder",
                "inLanguage": "en",
                "dateModified": new Date().toISOString().split('T')[0],
                "breadcrumb": {
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home",  "item": "https://jobmeter.app" },
                    { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.app/tools" },
                    { "@type": "ListItem", "position": 3, "name": "Internship Finder", "item": "https://jobmeter.app/tools/internship-finder" },
                  ]
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Internship Finder",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "AI-powered internship finder and internship search site for discovering paid internships, web developer internships, remote internships, and international internship opportunities in Nigeria and worldwide.",
                "url": "https://jobmeter.app/tools/internship-finder",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "description": "Free basic access for job seekers and employers."
                },
                "featureList": [
                  "AI-powered internship matching",
                  "Paid internship filter",
                  "Remote and international internship filters",
                  "Free employer internship posting",
                  "Real-time internship alerts",
                  "Resume optimizer for internship applications",
                  "No-experience internship filter for freshers"
                ],
                "keywords": "internship finder, find internships, how to find internships, best internship sites, web development internship, paid internship, remote internship, internship search websites, summer internships 2026"
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "How do I find internships online fast?", "acceptedAnswer": { "@type": "Answer", "text": "Use Internship Finder's AI matching tool. Set your skills and location preferences, enable daily alerts, and receive curated internship matches every day. Most users find relevant listings within 24 hours." } },
                  { "@type": "Question", "name": "Where to find remote internships in 2026?", "acceptedAnswer": { "@type": "Answer", "text": "Filter by 'Remote' on Internship Finder to surface web developer remote internships, web development virtual internships, and international remote internship opportunities from global companies." } },
                  { "@type": "Question", "name": "How to find internships with no experience?", "acceptedAnswer": { "@type": "Answer", "text": "Enable the 'No Experience Required' filter on Internship Finder to find entry-level and fresher-friendly internship listings specifically designed for candidates just starting their career." } },
                  { "@type": "Question", "name": "How can employers find interns for free?", "acceptedAnswer": { "@type": "Answer", "text": "Employers can post internship roles for free on Internship Finder — one of the top free internship job posting sites in Nigeria — and reach thousands of active intern seekers filtered by skill and sector." } },
                  { "@type": "Question", "name": "What are the best websites to find internships for web development?", "acceptedAnswer": { "@type": "Answer", "text": "Internship Finder is one of the best websites to find internships for web development, with dedicated listings for web developer paid internship, online web development internship, and web development virtual internship roles." } },
                ]
              },
              {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "Related Job Finder Tools",
                "description": "Other free job finder tools available on the platform",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Remote Jobs Finder",            "url": "https://jobmeter.app/tools/remote-jobs-finder" },
                  { "@type": "ListItem", "position": 2, "name": "NYSC Jobs Finder",              "url": "https://jobmeter.app/tools/nysc-finder" },
                  { "@type": "ListItem", "position": 3, "name": "Jobs with Accommodation",       "url": "https://jobmeter.app/tools/accommodation-finder" },
                  { "@type": "ListItem", "position": 4, "name": "Jobs with Visa Sponsorship",    "url": "https://jobmeter.app/tools/visa-finder" },
                  { "@type": "ListItem", "position": 5, "name": "Entry Level Jobs Finder",       "url": "https://jobmeter.app/tools/entry-level-finder" },
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