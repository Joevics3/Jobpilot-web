// File Location: /app/jobs/state/[state]/[town]/page.tsx

import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { MapPin, Building2, Clock, DollarSign } from 'lucide-react';
import { notFound } from 'next/navigation';

interface TownPageProps {
  params: {
    state: string;
    town: string;
  };
}

export async function generateMetadata({ params }: TownPageProps): Promise<Metadata> {
  const townName = params.town.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateName = params.state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return {
    title: `Jobs in ${townName}, ${stateName} | JobMeter`,
    description: `Find the latest job opportunities in ${townName}, ${stateName}. Browse available positions and apply today.`,
  };
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: any;
  salary_min?: number;
  salary_max?: number;
  job_type: string;
  created_at: string;
}

async function getTownJobs(state: string, town: string): Promise<Job[]> {
  try {
    // Single fetch: Latest jobs for filtering
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, company, location, salary_min, salary_max, job_type, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(200); // Fetch more for filtering

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    // Filter for town and state
    const stateLower = state.toLowerCase().replace(/-/g, ' ');
    const townLower = town.toLowerCase().replace(/-/g, ' ');
    
    const filtered = (data || []).filter((job) => {
      if (!job.location) return false;
      
      // String location - must contain both town and state
      if (typeof job.location === 'string') {
        const locLower = job.location.toLowerCase();
        return locLower.includes(townLower) && locLower.includes(stateLower);
      }
      
      // Object location
      if (typeof job.location === 'object') {
        const jobState = (job.location.state || '').toLowerCase();
        const jobCity = (job.location.city || '').toLowerCase();
        
        const stateMatch = jobState === stateLower || jobState.replace(/\s+/g, '-') === state.toLowerCase();
        const townMatch = jobCity === townLower || jobCity.replace(/\s+/g, '-') === town.toLowerCase();
        
        return stateMatch && townMatch;
      }
      
      return false;
    });

    // Return first 50
    return filtered.slice(0, 50);
  } catch (error) {
    console.error('Error in getTownJobs:', error);
    return [];
  }
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Not specified';
  if (min && max) return `₦${min.toLocaleString()} - ₦${max.toLocaleString()}`;
  if (min) return `From ₦${min.toLocaleString()}`;
  if (max) return `Up to ₦${max.toLocaleString()}`;
  return 'Not specified';
}

function formatJobType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getLocationString(location: any): string {
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    if (location.city && location.state) return `${location.city}, ${location.state}`;
    if (location.state) return location.state;
  }
  return 'Location not specified';
}

function getRelativeTime(date: string): string {
  const now = new Date();
  const posted = new Date(date);
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export default async function TownPage({ params }: TownPageProps) {
  const townName = params.town.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const stateName = params.state.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  // Fetch jobs only when this page loads (no pre-fetching)
  const jobs = await getTownJobs(params.state, params.town);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white" style={{ backgroundColor: '#2563EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={32} />
            <h1 className="text-4xl font-bold">Jobs in {townName}</h1>
          </div>
          <p className="text-lg text-white max-w-3xl">
            {jobs.length > 0 
              ? `${jobs.length} job${jobs.length !== 1 ? 's' : ''} available in ${townName}, ${stateName}`
              : `No jobs currently available in ${townName}, ${stateName}`
            }
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span>/</span>
            <Link href="/jobs" className="hover:text-blue-600">Jobs</Link>
            <span>/</span>
            <Link href="/jobs/state" className="hover:text-blue-600">States</Link>
            <span>/</span>
            <Link href={`/jobs/state/${params.state}`} className="hover:text-blue-600">{stateName}</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{townName}</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600">
                      {job.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building2 size={16} />
                        <span>{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span>{getLocationString(job.location)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>{getRelativeTime(job.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {formatJobType(job.job_type)}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <DollarSign size={16} />
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end gap-2">
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Jobs Found</h3>
            <p className="text-gray-600 mb-6">
              There are currently no active job listings in {townName}, {stateName}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/jobs/state/${params.state}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View Jobs in {stateName}
              </Link>
              <Link
                href="/jobs"
                className="inline-block px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Browse All Jobs
              </Link>
            </div>
          </div>
        )}

        {/* Navigate Back */}
        {jobs.length > 0 && (
          <div className="mt-12 bg-blue-600 rounded-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Looking for More Opportunities?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Explore more jobs in {stateName} or browse all available positions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/jobs/state/${params.state}`}
                className="inline-block px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                View All Jobs in {stateName}
              </Link>
              <Link
                href="/jobs/state"
                className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium"
              >
                Browse All States
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}