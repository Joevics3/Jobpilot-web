"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Building2, Clock, Filter, Loader2, ArrowRight, Wifi, Globe, Laptop, ChevronDown, CheckCircle } from 'lucide-react';
import { theme } from '@/lib/theme';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  job_type?: string;
  remote?: boolean;
  posted_date?: string;
  description?: string;
  slug?: string;
  category?: string;
}

export default function RemoteJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  const categories = [
    'Technology', 'Marketing', 'Sales', 'Design', 'Finance', 
    'Healthcare', 'Education', 'Engineering', 'Admin', 'Customer Service'
  ];

  const fetchJobs = useCallback(async (pageNum: number = 1) => {
    setIsLoading(true);
    setJobs([]);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('limit', '20');
      
      // Try remote=true first, if no results, fallback to location search
      params.set('remote', 'true');
      
      if (searchQuery) params.set('search', searchQuery);
      if (selectedJobType) params.set('job_type', selectedJobType);
      if (selectedCategory) params.set('category', selectedCategory);

      console.log('Fetching jobs with params:', params.toString());
      
      let response = await fetch(`/api/jobs?${params.toString()}`);
      let data = await response.json();
      
      console.log('Jobs API response:', data);
      
      // If no remote jobs found, try searching by "remote" in location
      if (!data.success || !data.jobs || data.jobs.length === 0) {
        console.log('No remote jobs found, trying location search...');
        params.delete('remote');
        params.set('location', 'remote');
        response = await fetch(`/api/jobs?${params.toString()}`);
        data = await response.json();
        console.log('Fallback jobs response:', data);
      }
      
      if (data.success) {
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages || 1);
        setTotalJobs(data.total || 0);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedJobType, selectedCategory]);

  useEffect(() => {
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs(1);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-4xl mx-auto">
          <a href="/tools" className="text-sm text-white/80 hover:text-white transition-colors self-start inline-block mb-2">
            ← Back to Tools
          </a>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
            Remote Jobs Finder
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.light }}>
            Find the best remote job opportunities in Nigeria and worldwide
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search remote jobs (e.g., React, Marketing, Sales)..."
                  className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2"
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </form>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                <select
                  value={selectedJobType}
                  onChange={(e) => {
                    setSelectedJobType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Job Types</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {isLoading ? 'Loading...' : `${totalJobs.toLocaleString()} remote jobs found`}
          </p>
        </div>

        {/* Jobs List */}
        <div className="space-y-4 mb-6">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin mx-auto text-blue-600 mb-3" size={32} />
              <p className="text-gray-600">Loading remote jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Globe className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600 mb-4">No remote jobs found matching your criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedJobType('');
                  setSelectedCategory('');
                  setPage(1);
                }}
                className="text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.slug || job.id}`}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <Wifi size={10} />
                        Remote
                      </span>
                      {job.job_type && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {job.job_type}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {job.location || 'Remote'}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-400" />
                </div>

                {job.salary && (
                  <div className="flex items-center gap-1 mt-3 text-sm text-green-700">
                    <DollarSign size={14} />
                    {job.salary}
                  </div>
                )}

                {job.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {job.description.replace(/<[^>]*>/g, '')}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {job.posted_date && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(job.posted_date)}
                    </span>
                  )}
                  {job.category && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} />
                      {job.category}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* SEO Content - Improved */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Remote Jobs in Nigeria</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Discover work-from-home opportunities and flexible remote positions with top companies in Nigeria and worldwide.</p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl border border-cyan-200">
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mb-3">
                <Wifi className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fully Remote</h3>
              <p className="text-sm text-gray-700">Work from anywhere without going to an office.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                <Globe className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Global Companies</h3>
              <p className="text-sm text-gray-700">Access opportunities with international employers.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <Laptop className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Flexible Work</h3>
              <p className="text-sm text-gray-700">Hybrid and flexible arrangements available.</p>
            </div>
          </div>

          {/* Main SEO Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                Why Work Remotely?
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>Remote work has transformed the Nigerian job market. More companies are offering remote positions due to technology advancements and changing workplace preferences.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {['Flexible Schedule', 'No Commute', 'Work-Life Balance', 'Global Access'].map(item => (
                    <div key={item} className="bg-cyan-50 rounded-lg p-2 text-center text-sm text-cyan-800">{item}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                Types of Remote Work
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900">Fully Remote</h4>
                    <p className="text-sm text-blue-800">Work from anywhere without office visits</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900">Hybrid</h4>
                    <p className="text-sm text-purple-800">Mix of remote and office work</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900">Contract</h4>
                    <p className="text-sm text-green-800">Project-based with flexible hours</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900">Freelance</h4>
                    <p className="text-sm text-orange-800">Work with multiple clients</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                Popular Remote Job Categories
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['Software Development', 'Data Analysis', 'Digital Marketing', 'Customer Service', 'UI/UX Design', 'Content Writing', 'Virtual Assistant', 'Project Management', 'Accounting', 'Human Resources'].map(cat => (
                    <span key={cat} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{cat}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm">4</span>
                Tips for Remote Job Success
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Test internet before interviews', 'Create a quiet workspace', 'Dress professionally', 'Have documents ready', 'Ask about remote tools', 'Follow up after interviews'].map(tip => (
                    <div key={tip} className="flex items-center gap-2">
                      <CheckCircle className="text-green-500 flex-shrink-0" size={16} />
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Find Your Remote Dream Job</h3>
              <p className="text-white/90 mb-4">Browse hundreds of remote job opportunities in Nigeria and worldwide. Updated daily with new positions.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free Access</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Daily Updates</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Nigeria Focused</span>
              </div>
            </div>
          </div>

          {/* JSON-LD Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Remote Jobs Finder",
                "description": "Find remote jobs and work-from-home opportunities in Nigeria and worldwide. Search remote positions by category, job type, and more.",
                "url": "https://jobmeter.com/tools/remote-jobs-finder",
                "applicationCategory": "Career",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" }
              })
            }}
          />
        </div>
      </div>
    </div>
  );
}
