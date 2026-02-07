"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Briefcase, MapPin, TrendingUp, Search, Filter, Bookmark, BookmarkCheck, FileCheck, Trash2, Calendar } from 'lucide-react';
import { theme } from '@/lib/theme';

interface CategoryPage {
  id: string;
  category: string;
  location: string | null;
  slug: string;
  h1_title: string;
  meta_description: string;
  job_count: number;
  view_count: number;
}

async function getCategoryPages(): Promise<CategoryPage[]> {
  try {
    const { data, error } = await supabase
      .from('category_pages')
      .select('id, category, location, slug, h1_title, meta_description, job_count, view_count')
      .eq('is_published', true)
      .order('job_count', { ascending: false });

    if (error) {
      console.error('Error fetching category pages:', error);
      return [];
    }

    console.log('Fetched category pages:', data?.length);
    return data || [];
  } catch (error) {
    console.error('Error fetching category pages:', error);
    return [];
  }
}

function groupCategories(pages: CategoryPage[]) {
  const national = pages.filter(p => !p.location);
  const byLocation = pages.filter(p => p.location);
  
  console.log('National pages:', national.length);
  console.log('Location pages:', byLocation.length);
  
  return { national, byLocation };
}

export default function ResourcesPageClient() {
  const [pages, setPages] = useState<CategoryPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState<'all' | 'national' | 'location'>('all');
  const [user, setUser] = useState<any>(null);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const data = await getCategoryPages();
        setPages(data);
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPages();
  }, []);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Load saved and applied jobs
          await loadUserJobs(session.user.id);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        loadUserJobs(session.user.id);
      } else {
        setUser(null);
        setSavedJobs([]);
        setAppliedJobs([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserJobs = async (userId: string) => {
    try {
      // Load saved jobs
      const { data: savedData } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', userId);
      
      if (savedData) {
        setSavedJobs(savedData.map(item => item.job_id));
      }

      // Load applied jobs
      const { data: appliedData } = await supabase
        .from('applied_jobs')
        .select('job_id')
        .eq('user_id', userId);
      
      if (appliedData) {
        setAppliedJobs(appliedData.map(item => item.job_id));
      }
    } catch (error) {
      console.error('Error loading user jobs:', error);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      if (savedJobs.includes(jobId)) {
        // Remove from saved
        await supabase
          .from('saved_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId);
        setSavedJobs(prev => prev.filter(id => id !== jobId));
      } else {
        // Add to saved
        await supabase
          .from('saved_jobs')
          .insert({ user_id: user.id, job_id: jobId });
        setSavedJobs(prev => [...prev, jobId]);
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    if (!user) return;
    
    try {
      if (appliedJobs.includes(jobId)) {
        // Remove from applied
        await supabase
          .from('applied_jobs')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId);
        setAppliedJobs(prev => prev.filter(id => id !== jobId));
      } else {
        // Add to applied
        await supabase
          .from('applied_jobs')
          .insert({ user_id: user.id, job_id: jobId });
        setAppliedJobs(prev => [...prev, jobId]);
      }
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const filteredPages = useMemo(() => {
    let filtered = pages;

    if (locationFilter === 'national') {
      filtered = filtered.filter(p => !p.location);
    } else if (locationFilter === 'location') {
      filtered = filtered.filter(p => p.location);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(page => 
        page.h1_title.toLowerCase().includes(term) ||
        page.meta_description.toLowerCase().includes(term) ||
        page.category.toLowerCase().includes(term) ||
        (page.location && page.location.toLowerCase().includes(term))
      );
    }

return filtered;
}, [pages, searchTerm, locationFilter]);

  const { national, byLocation } = groupCategories(filteredPages);

  // Job Card Component
  const JobCard = ({ page }: { page: CategoryPage }) => {
    const isSaved = savedJobs.includes(page.id);

    const handleSave = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSaveJob(page.id);
    };

    return (
      <Link 
        href={`/resources/${page.slug}`}
        className="block"
      >
        <div
          className="bg-white rounded-2xl p-5 mb-5 shadow-sm hover:shadow-lg transition-all duration-300 border relative overflow-hidden group cursor-pointer"
          style={{
            borderColor: theme.colors.border.DEFAULT,
            backgroundColor: theme.colors.card.DEFAULT,
          }}
        >
          <div className="flex flex-col gap-4">
            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
              {/* Job Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors"
                      style={{ color: theme.colors.text.primary }}
                    >
                      {page.h1_title.replace(' | JobMeter', '')}
                    </h3>
                    <p
                      className="text-sm font-medium mb-2 flex items-center gap-1"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      <Briefcase size={14} />
                      {page.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Location */}
              {page.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} style={{ color: theme.colors.text.muted }} />
                  <span
                    className="text-sm truncate"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    {page.location}
                  </span>
                </div>
              )}
              
              {/* Job Count */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.primary.DEFAULT }} />
                <span
                  className="text-sm"
                  style={{ color: theme.colors.text.secondary }}
                >
                  {page.job_count} jobs
                </span>
              </div>
              
              {/* View Count */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: theme.colors.success }}>
                  {page.view_count} views
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2">
              {page.meta_description}
            </p>

            {/* Bottom Section: Actions */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: theme.colors.border.light }}>
              <div className="flex-1"></div>

              {/* Save Button */}
              {user && (
                <button
                  onClick={handleSave}
                  className="p-2 rounded-lg border transition-all hover:scale-105"
                  style={{
                    borderColor: isSaved ? theme.colors.primary.DEFAULT : theme.colors.border.DEFAULT,
                    backgroundColor: isSaved ? theme.colors.primary.DEFAULT + '10' : 'transparent',
                  }}
                  title={isSaved ? "Remove from saved" : "Save category"}
                >
                  {isSaved ? (
                    <BookmarkCheck size={18} style={{ color: theme.colors.primary.DEFAULT }} />
                  ) : (
                    <Bookmark size={18} style={{ color: theme.colors.text.secondary }} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-64 bg-blue-600"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header for non-signed-in users */}
      {!user && (
        <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={24} />
              <h1 className="text-2xl font-bold">Job Categories</h1>
            </div>
            <p className="text-sm text-white max-w-2xl">
              Browse job opportunities by category and location.
            </p>
          </div>
        </div>
      )}

      {/* Search Section - For All Users */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search categories by title, state, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setLocationFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  locationFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              <button
                onClick={() => setLocationFilter('national')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  locationFilter === 'national'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                National Only
              </button>
              <button
                onClick={() => setLocationFilter('location')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  locationFilter === 'location'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Location
              </button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredPages.length} of {pages.length} categories
            {searchTerm && ` for "${searchTerm}"`}
            {locationFilter !== 'all' && ` (${locationFilter === 'national' ? 'national' : 'location-based'})`}
          </div>
        </div>
      </div>

      {/* Header - Only show if user is signed in */}
      {user && (
        <>
          <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase size={32} />
                <h1 className="text-4xl font-bold">Browse Jobs by Category</h1>
              </div>
              <p className="text-lg text-white max-w-3xl">
                Explore thousands of job opportunities across Nigeria. Find your perfect role by category and location.
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex items-center gap-2 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600">Home</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Categories</span>
            </nav>
          </div>


        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No categories found</h2>
            <p className="text-gray-600">
              {searchTerm || locationFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Check back soon for job categories.'}
            </p>
            {(searchTerm || locationFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('all');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* National Categories */}
            {national.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Popular Job Categories</h2>
                  <span className="text-sm text-gray-500">({national.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {national.map((page) => (
                    <JobCard key={page.id} page={page} />
                  ))}
                </div>
              </section>
            )}

            {/* Location-Specific Categories */}
            {byLocation.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <MapPin size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Jobs by Location</h2>
                  <span className="text-sm text-gray-500">({byLocation.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {byLocation.map((page) => (
                    <JobCard key={page.id} page={page} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}


      </div>
    </div>
  );
}