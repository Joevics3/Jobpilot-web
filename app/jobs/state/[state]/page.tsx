"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { ArrowLeft, MapPin, Briefcase } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';
import { JobUI } from '@/components/jobs/JobCard';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'Abuja'
];

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

// Simple transform without matching
const transformJobToUI = (job: any): JobUI => {
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

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    
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
      return null;
    }
  };

  return {
    id: job.id,
    slug: job.slug || job.id,
    title: job.title || 'Untitled Job',
    company: companyStr,
    location: locationStr,
    salary: salaryStr,
    match: 0, // No matching
    calculatedTotal: 0,
    type: job.type || job.employment_type || '',
    postedDate: getRelativeTime((job.posted_date ?? job.created_at) ?? null) ?? undefined,
  };
};

export default function JobsByStatePage() {
  const params = useParams();
  const state = params?.state as string;
  const formattedState = state ? state.charAt(0).toUpperCase() + state.slice(1) : '';
  
  const [jobs, setJobs] = useState<JobUI[]>([]);
  const [nationalJobs, setNationalJobs] = useState<JobUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  useEffect(() => {
    loadSavedJobs();
    loadAppliedJobs();
    
    if (formattedState && NIGERIAN_STATES.includes(formattedState)) {
      fetchJobs();
    }
  }, [formattedState]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fetch all active jobs from last 30 days
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, location, salary_range, created_at, posted_date, slug, type, employment_type')
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const allJobs = data || [];

      // Filter state jobs
      const stateJobs = allJobs.filter((job) => {
        if (typeof job.location === 'string') {
          return job.location.toLowerCase().includes(formattedState.toLowerCase());
        }
        if (job.location && typeof job.location === 'object') {
          const locState = job.location.state || '';
          return locState.toLowerCase() === formattedState.toLowerCase();
        }
        return false;
      });

      // Filter national jobs (exclude current state)
      const nationalJobsData = allJobs.filter(job => {
        if (typeof job.location === 'string') {
          return !job.location.toLowerCase().includes(formattedState.toLowerCase());
        }
        if (job.location && typeof job.location === 'object') {
          const locState = job.location.state || '';
          return locState.toLowerCase() !== formattedState.toLowerCase();
        }
        return true;
      }).slice(0, 10);

      // Transform without matching
      setJobs(stateJobs.map(transformJobToUI));
      setNationalJobs(nationalJobsData.map(transformJobToUI));
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

  const handleApply = (jobId: string) => {
    const newApplied = appliedJobs.includes(jobId)
      ? appliedJobs.filter(id => id !== jobId)
      : [...appliedJobs, jobId];

    setAppliedJobs(newApplied);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.APPLIED_JOBS, JSON.stringify(newApplied));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleShowBreakdown = (_job: JobUI) => {
    // No-op since matching is disabled
  };

  if (!formattedState || !NIGERIAN_STATES.includes(formattedState)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">State Not Found</h1>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            Browse All Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div className="text-white py-8 px-6" style={{ backgroundColor: '#2563EB' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={32} />
            <h1 className="text-4xl font-bold">Jobs in {formattedState}</h1>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="px-6 py-4">
        <Link
          href="/jobs/state/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft size={20} />
          Back to All Locations
        </Link>
      </div>

      {/* Jobs List */}
      <div className="px-6 py-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p style={{ color: theme.colors.text.secondary }}>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No jobs found in {formattedState}
            </h2>
            <p className="text-gray-600 mb-6">
              Check back soon or explore jobs in other locations.
            </p>
            <Link
              href="/jobs"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse All Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* State Jobs */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Jobs in {formattedState}</h2>
              {jobs.map((job) => (
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
              ))}
            </div>

            {/* National Jobs */}
            {nationalJobs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-gray-900">Other Opportunities</h2>
                {nationalJobs.map((job) => (
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
