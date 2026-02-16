"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Mail, 
  Phone, 
  ExternalLink, 
  ArrowLeft, 
  Clock, 
  Building, 
  Target, 
  Award, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Search,
  Share2,
  MessageCircle,
  Send
} from 'lucide-react';
import { theme } from '@/lib/theme';
import UpgradeModal from '@/components/jobs/UpgradeModal';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

export default function JobClient({ job, relatedJobs }: { job: any; relatedJobs?: any[] }) {
  const router = useRouter();
  const jobId = job.id;
  const { toast } = useToast();
  
  const [saved, setSaved] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [applied, setApplied] = useState(false);
  const [upgradeErrorType, setUpgradeErrorType] = useState<'PREMIUM_REQUIRED' | 'QUOTA_EXCEEDED' | 'INSUFFICIENT_CREDITS' | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeErrorData, setUpgradeErrorData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [similarJobs, setSimilarJobs] = useState<any[]>(relatedJobs || []);
  const [companyJobs, setCompanyJobs] = useState<any[]>([]);

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
    setTimeout(() => setCopied(null), 2000);
  };

  const loadCompanyJobs = async () => {
    try {
      const companyName = getCompanyName();
      if (!companyName || companyName === 'Unknown Company') return;

      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, location, category, sector, slug')
        .eq('company', companyName)
        .neq('id', jobId)
        .eq('is_published', true)
        .limit(5);

      if (error) {
        console.error('Error loading company jobs:', error);
        return;
      }

      setCompanyJobs(data || []);
    } catch (error) {
      console.error('Error loading company jobs:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/jobs/${job.slug || job.id}`;
    const shareText = `Check out this job: ${job.title} at ${getCompanyName()}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} at ${getCompanyName()}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          // Fallback to copying URL
          await navigator.clipboard.writeText(shareUrl);
          toast({ title: 'Link copied!', description: 'Job link copied to clipboard' });
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link copied!', description: 'Job link copied to clipboard' });
    }
  };

  useEffect(() => {
    checkAuth();
    loadSavedStatus();
    loadAppliedStatus();
    loadCompanies();
    loadCompanyJobs();
    if (!relatedJobs || relatedJobs.length === 0) {
      loadSimilarJobs();
    }
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug, logo_url')
        .eq('is_published', true);

      if (error) {
        console.error('Error loading companies:', error);
        return;
      }

      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const loadSimilarJobs = async () => {
    try {
      let query = supabase
        .from('jobs')
        .select('id, title, company, location, category, sector, slug')
        .neq('id', jobId)
        .eq('is_published', true)
        .limit(10);

      if (job.category) {
        query = query.eq('category', job.category);
      }

      const { data: categoryJobs, error: categoryError } = await query;

      if (categoryError) {
        console.error('Error loading similar jobs:', categoryError);
        return;
      }

      if (categoryJobs && categoryJobs.length < 10 && job.sector) {
        const remainingCount = 10 - categoryJobs.length;
        const existingIds = categoryJobs.map(j => j.id);

        const { data: sectorJobs } = await supabase
          .from('jobs')
          .select('id, title, company, location, category, sector, slug')
          .eq('sector', job.sector)
          .neq('id', jobId)
          .not('id', 'in', `(${existingIds.join(',')})`)
          .eq('is_published', true)
          .limit(remainingCount);

        setSimilarJobs([...categoryJobs, ...(sectorJobs || [])]);
      } else {
        setSimilarJobs(categoryJobs || []);
      }
    } catch (error) {
      console.error('Error loading similar jobs:', error);
    }
  };



  const loadSavedStatus = () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    if (saved) {
      try {
        const savedArray = JSON.parse(saved);
        setSaved(savedArray.includes(jobId));
      } catch (e) {
        console.error('Error loading saved status:', e);
      }
    }
  };

  const handleSave = () => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    let savedArray: string[] = [];
    
    if (saved) {
      try {
        savedArray = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved jobs:', e);
      }
    }

    const newSaved = savedArray.includes(jobId)
      ? savedArray.filter(id => id !== jobId)
      : [...savedArray, jobId];
    
    localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(newSaved));
    setSaved(newSaved.includes(jobId));
  };

  const loadAppliedStatus = () => {
    if (typeof window === 'undefined') return;
    const applied = localStorage.getItem(STORAGE_KEYS.APPLIED_JOBS);
    if (applied) {
      try {
        const appliedArray = JSON.parse(applied);
        setApplied(appliedArray.includes(jobId));
      } catch (e) {
        console.error('Error loading applied status:', e);
      }
    }
  };

  const getCompanyName = () => {
    if (typeof job.company === 'string') return job.company;
    if (job.company?.name) return job.company.name;
    return 'Unknown Company';
  };

  const getLocationString = () => {
    if (!job.location) return 'Not specified';
    if (typeof job.location === 'string') return job.location;
    if (typeof job.location === 'object') {
      if (job.location.remote) return 'Remote';
      const parts = [job.location.city, job.location.state, job.location.country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Not specified';
    }
    return 'Not specified';
  };

  const getSalaryString = () => {
    if (!job.salary && !job.salary_range) return null;

    if (typeof job.salary === 'string') {
      // Hide zero salaries
      if (job.salary === '0' || job.salary === '₦0' || job.salary === '0.00' || job.salary.includes('₦0')) {
        return null;
      }
      return job.salary;
    }

    if (job.salary_range && typeof job.salary_range === 'object') {
      const { min, max, currency, period } = job.salary_range;

      if (min != null && currency && min > 0) {
        if (!max || min === max) {
          return `${currency} ${min.toLocaleString()} ${period || ''}`.trim();
        }

        return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} ${period || ''}`.trim();
      }
    }

    return null;
  };

  const getExperienceLevelWithYears = (level: string) => {
    const normalizedLevel = level.trim();
    
    const experienceMap: Record<string, string> = {
      'Entry Level': 'Entry Level (0-2 years)',
      'entry level': 'Entry Level (0-2 years)',
      'entry-level': 'Entry Level (0-2 years)',
      'Junior': 'Junior (1-3 years)',
      'junior': 'Junior (1-3 years)',
      'Mid-level': 'Mid-level (3-5 years)',
      'mid-level': 'Mid-level (3-5 years)',
      'Mid level': 'Mid-level (3-5 years)',
      'mid level': 'Mid-level (3-5 years)',
      'Senior': 'Senior (5-8 years)',
      'senior': 'Senior (5-8 years)',
      'Lead': 'Lead (8-12 years)',
      'lead': 'Lead (8-12 years)',
      'Executive': 'Executive (12+ years)',
      'executive': 'Executive (12+ years)',
    };
    
    return experienceMap[normalizedLevel] || level;
  };

  const getJobTypeDisplay = (jobType: string) => {
    const jobTypeMap: Record<string, string> = {
      'remote': 'Remote',
      'on-site': 'On-site',
      'hybrid': 'Hybrid',
      'onsite': 'On-site',
      'full-remote': 'Fully Remote',
    };
    return jobTypeMap[jobType?.toLowerCase()] || jobType;
  };

  const getSimilarJobLocation = (similarJob: any) => {
    if (!similarJob.location) return '';
    if (typeof similarJob.location === 'string') return similarJob.location;
    if (typeof similarJob.location === 'object') {
      if (similarJob.location.remote) return 'Remote';
      if (similarJob.location.state) return similarJob.location.state;
      if (similarJob.location.city) return similarJob.location.city;
    }
    return '';
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => router.push('/jobs')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                style={{ color: theme.colors.primary.DEFAULT }}
              >
                <ArrowLeft size={18} />
<span className="hidden sm:inline">All Jobs</span>
                <span className="sm:hidden">All Jobs</span>
              </button>
              
               <form method="GET" action="/jobs" className="flex items-center gap-0">
                 <div className="relative">
                   <input
                     type="text"
                     name="search"
                     placeholder="Enter a role"
                     className="pl-3 pr-3 py-2 rounded-l-lg border border-r-0 border-gray-200 text-sm w-32 md:w-48 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-0"
                     style={{ '--tw-ring-color': theme.colors.primary.DEFAULT } as React.CSSProperties}
                   />
                 </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-r-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Header */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Job Expiry Warning */}
                {job.deadline && new Date(job.deadline) < new Date() && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700">
                      This job has expired on {new Date(job.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
                
                <h1 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: theme.colors.primary.DEFAULT }}>
                  {job.title || 'Untitled Job'}
                </h1>
                <p className="text-base text-gray-700 mb-4">
                  {(() => {
                    const companyName = getCompanyName();
                    const isConfidential = companyName === 'Confidential employer';
                    
                    if (isConfidential) {
                      return (
                        <>
                          {companyName}
                          <span className="text-sm text-gray-500 ml-2">(Recruiter)</span>
                        </>
                      );
                    }
                    
                    return (
                      <a 
                        href={`/companies?name=${encodeURIComponent(companyName)}`}
                        className="hover:underline transition-colors"
                        style={{ color: theme.colors.primary.DEFAULT }}
                      >
                        {companyName}
                      </a>
                    );
                  })()}
                </p>

                {/* Quick Links */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <a
                    href={`/jobs?posted=today`}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                    style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15`, color: theme.colors.primary.DEFAULT }}
                  >
                    Today&apos;s jobs
                  </a>
                  
                  {job.category && (
                    <a
                      href={`/resources/${job.category}`}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                      style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15`, color: theme.colors.primary.DEFAULT }}
                    >
                      {job.category.replace(/-/g, ' ')}
                    </a>
                  )}
                  
                  {typeof job.location === 'object' && job.location?.state && !job.location?.remote && (
                    <a
                      href={`/jobs/state/${job.location.state.toLowerCase().replace(/\s+/g, '-')}`}
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                      style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15`, color: theme.colors.primary.DEFAULT }}
                    >
                      {job.location.state} jobs
                    </a>
                  )}
                  
                  {typeof job.location === 'object' && job.location?.remote && (
                    <a
                      href="/jobs/remote"
                      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                      style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15`, color: theme.colors.primary.DEFAULT }}
                    >
                      Remote jobs
                    </a>
                  )}
                </div>

                {/* Job Overview Section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Job Overview</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Primary Details */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm font-medium text-gray-900">{getLocationString()}</p>
                        </div>
                      </div>

                      {getSalaryString() && (
                        <div className="flex items-center gap-3">
                          <DollarSign size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Salary</p>
                            <p className="text-sm font-medium text-gray-900">{getSalaryString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Secondary Details */}
                    <div className="space-y-4">
                      {(job.employment_type || job.type) && (
                        <div className="flex items-center gap-3">
                          <Clock size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Employment Type</p>
                            <p className="text-sm font-medium text-gray-900">{job.employment_type || job.type}</p>
                          </div>
                        </div>
                      )}

                      {job.job_type && (
                        <div className="flex items-center gap-3">
                          <Briefcase size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Work Arrangement</p>
                            <p className="text-sm font-medium text-gray-900">{getJobTypeDisplay(job.job_type)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details - Only show if they exist */}
                {(job.sector || job.experience_level || job.deadline) && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {job.sector && (
                        <div className="flex items-center gap-3">
                          <Building size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Sector</p>
                            <p className="text-sm font-medium text-gray-900">{job.sector}</p>
                          </div>
                        </div>
                      )}

                      {job.experience_level && (
                        <div className="flex items-center gap-3">
                          <Target size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Experience Level</p>
                            <p className="text-sm font-medium text-gray-900">{getExperienceLevelWithYears(job.experience_level)}</p>
                          </div>
                        </div>
                      )}

                      {job.deadline && (
                        <div className="flex items-center gap-3">
                          <Calendar size={20} className="text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Application Deadline</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(job.deadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* About Company */}
              {job.about_company && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">About the Company</h2>
                   <div
                     className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none"
                     dangerouslySetInnerHTML={{ __html: typeof job.about_company === 'string' ? job.about_company : '' }}
                   />
                </div>
              )}

              {/* Job Description */}
              {job.description && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Job Description</h2>
                   <div
                     className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none"
                     dangerouslySetInnerHTML={{ __html: typeof job.description === 'string' ? job.description : '' }}
                   />
                </div>
              )}

              {/* Skills */}
              {((job.skills_required && Array.isArray(job.skills_required) && job.skills_required.length > 0) ||
                (job.skills && Array.isArray(job.skills) && job.skills.length > 0)) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {(job.skills_required || job.skills || []).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-900 border border-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {(() => {
                const responsibilities = job.responsibilities || [];
                const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
                
                if (responsibilitiesArray.length > 0) {
                  return (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Key Responsibilities</h2>
                      <ul className="space-y-3">
                         {responsibilitiesArray.map((responsibility: string, index: number) => (
                           <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                             <span className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ backgroundColor: theme.colors.primary.DEFAULT }}></span>
                             <span>{responsibility}</span>
                           </li>
                         ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Qualifications */}
              {(() => {
                const qualifications = job.qualifications || [];
                const qualificationsArray = Array.isArray(qualifications) ? qualifications : [];
                
                if (qualificationsArray.length > 0) {
                  return (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Qualifications</h2>
                      <ul className="space-y-3">
{qualificationsArray.map((qualification: string, index: number) => (
                           <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                             <span className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ backgroundColor: theme.colors.primary.DEFAULT }}></span>
                             <span>{qualification}</span>
                           </li>
                         ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Benefits */}
              {(() => {
                const benefits = job.benefits || [];
                const benefitsArray = Array.isArray(benefits) ? benefits : [];
                
                if (benefitsArray.length > 0) {
                  return (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <h2 className="text-xl font-semibold mb-4 text-gray-900">Benefits & Perks</h2>
                      <ul className="space-y-3">
{benefitsArray.map((benefit: string, index: number) => (
                           <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                             <Award size={20} className="flex-shrink-0 mt-0.5" style={{ color: theme.colors.primary.DEFAULT }} />
                             <span>{benefit}</span>
                           </li>
                         ))}
                      </ul>
                    </div>
                  );
                }
                return null;
              })()}

              {/* How to Apply */}
              {(job.application?.email || job.application_email || job.application?.phone || job.application_phone || job.application?.link || job.application?.url || job.application_url) && (
                <div id="how-to-apply" className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">How to Apply</h2>
                  
                  {job.apply_instruction && (
                    <p className="text-sm text-gray-600 mb-6 whitespace-pre-wrap">
                      {job.apply_instruction}
                    </p>
                  )}
                  
                  <div className="space-y-6">
                    {(job.application?.phone || job.application_phone) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          <span className="text-sm text-gray-700 flex-1 font-medium">
                            {(job.application?.phone || job.application_phone || '').replace('tel:', '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 pl-4">
                          <a 
                            href={`https://wa.me/${(job.application?.phone || job.application_phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            WhatsApp
                          </a>
                          <button
                            onClick={() => handleCopy((job.application?.phone || job.application_phone || '').replace('tel:', ''), 'Phone number')}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            {copied === 'Phone number' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {(job.application?.email || job.application_email) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200" style={{ backgroundColor: `${theme.colors.primary.DEFAULT}05` }}>
                          <Mail size={20} className="flex-shrink-0" style={{ color: theme.colors.primary.DEFAULT }} />
                          <span className="text-sm text-gray-700 flex-1 break-all font-medium">
                            {(job.application?.email || job.application_email || '').replace('mailto:', '')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 pl-4">
                          <a 
                            href={`mailto:${(job.application?.email || job.application_email || '').replace('mailto:', '')}?subject=${encodeURIComponent(job.subject || `${job.title || 'Job'} Application`)}`}
                            className="px-4 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity font-medium"
                            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                          >
                            Email
                          </a>
                          <button
                            onClick={() => handleCopy((job.application?.email || job.application_email || '').replace('mailto:', ''), 'Email')}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            {copied === 'Email' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {(job.application?.link || job.application?.url || job.application_url) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <ExternalLink size={20} className="text-purple-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1 break-all font-medium">
                            {job.application?.link || job.application?.url || job.application_url}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 pl-4">
                          <a 
                            href={job.application?.link || job.application?.url || job.application_url || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium"
                          >
                            Apply Now
                          </a>
                          <button
                            onClick={() => handleCopy(job.application?.link || job.application?.url || job.application_url || '', 'URL')}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                          >
                            {copied === 'URL' ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Join Our Communities */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Join Our Communities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp Channel Button */}
                  <a 
                    href="https://whatsapp.com/channel/0029VbC3NrUKLaHp8JAt7v3y"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Join WhatsApp Channel</span>
                  </a>

                  {/* Telegram Group Button */}
                  <a 
                    href="https://t.me/+1YYoQJdLzzkwNDI0"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Join Telegram Group</span>
                  </a>
                </div>
              </div>

              {/* Additional Info Accordion */}
              {((job.about_role && job.about_role.trim()) || 
                (job.who_apply && job.who_apply.trim()) || 
                (job.standout && job.standout.trim())) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <Accordion type="multiple" className="w-full">
                    {job.about_role && job.about_role.trim() && (
                      <AccordionItem value="about-role" className="border-b border-gray-200">
                         <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4">
                          About This Role
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                            {job.about_role}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {job.who_apply && job.who_apply.trim() && (
                      <AccordionItem value="who-apply" className="border-b border-gray-200">
                         <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4">
                          Who Should Apply
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                            {job.who_apply}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {job.standout && job.standout.trim() && (
                      <AccordionItem value="standout" className="border-b-0">
                         <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline py-4">
                          <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-yellow-500" />
                            <span>How to Stand Out When Applying</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                            {job.standout}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              )}

              {/* Posted Date */}
              {(job.posted_date || job.created_at) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-3 text-gray-900">Posted Date</h2>
                   <p className="text-sm text-gray-700 mb-2">
                     {(() => {
                       const dateStr = job.posted_date || job.created_at;
                       const date = new Date(dateStr);
                       
                       if (isNaN(date.getTime())) {
                         return 'Date not available';
                       }
                       
                       return date.toLocaleDateString('en-US', {
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric',
                         timeZone: 'UTC'
                       });
                     })()}
                   </p>
                  {(job.views || 0) > 0 && (
                    <p className="text-sm text-gray-500">
                      {job.views?.toLocaleString()} people viewed this job
                    </p>
                  )}
                </div>
              )}

              {/* Application Link */}
              {(job.application_url || (job.application && (job.application.url || job.application.link))) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <a
                    href={job.application_url || job.application?.url || job.application?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                     className="flex items-center gap-2 text-sm font-medium hover:underline"
                    style={{ color: theme.colors.primary.DEFAULT }}
                  >
                    <ExternalLink size={18} />
                    View original job posting
                  </a>
                </div>
              )}
            </div>

            {/* Right Column - Company Jobs & Similar Jobs (Desktop Sidebar) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Jobs from Same Company */}
              {companyJobs && companyJobs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
                  <div className="px-5 py-4 text-white font-semibold text-lg" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
                    More jobs from {getCompanyName()}
                  </div>
                  <div className="px-5 py-4">
                    <div className="space-y-4">
                      {companyJobs.map((companyJob) => (
                        <a
                          key={companyJob.id}
                          href={`/jobs/${companyJob.slug || companyJob.id}`}
                          className="block group"
                        >
                          <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 group-hover:scale-150 transition-transform" style={{ backgroundColor: theme.colors.primary.DEFAULT }}></div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:underline line-clamp-2 mb-1">
                                {companyJob.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                {companyJob.category && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase size={12} />
                                    {companyJob.category.replace(/-/g, ' ')}
                                  </span>
                                )}
                                {getSimilarJobLocation(companyJob) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {getSimilarJobLocation(companyJob)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Similar Jobs */}
              {similarJobs && similarJobs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 text-white font-semibold text-lg" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
                    Similar Jobs
                  </div>
                  <div className="px-5 py-4">
                    <div className="space-y-4">
                      {similarJobs.map((similarJob) => (
                        <a
                          key={similarJob.id}
                          href={`/jobs/${similarJob.slug || similarJob.id}`}
                          className="block group"
                        >
                          <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2 group-hover:scale-150 transition-transform" style={{ backgroundColor: theme.colors.primary.DEFAULT }}></div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-900 group-hover:underline line-clamp-2 mb-1">
                                {similarJob.title}
                              </h3>
                              <p className="text-xs text-gray-600 mb-1">
                                {typeof similarJob.company === 'string' ? similarJob.company : similarJob.company?.name || 'Company'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                {similarJob.category && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase size={12} />
                                    {similarJob.category.replace(/-/g, ' ')}
                                  </span>
                                )}
                                {getSimilarJobLocation(similarJob) && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {getSimilarJobLocation(similarJob)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-gray-200">
                      <a
                        href="/jobs"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
                        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                      >
                        <ExternalLink size={16} />
                        View all jobs
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Bottom Action Bar - Mobile Fixed */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg lg:hidden">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className={`flex-1 px-2 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1 ${
                  saved ? 'bg-gray-100 text-gray-700' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {saved ? (
                  <>
                    <BookmarkCheck size={16} />
                    <span className="hidden xs:inline">Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={16} />
                    <span className="hidden xs:inline">Save</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="px-2 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
              >
                <Share2 size={16} />
                <span className="hidden xs:inline">Share</span>
              </button>

              <button
                onClick={() => {
                  const howToApplySection = document.getElementById('how-to-apply');
                  if (howToApplySection) {
                    const headerHeight = 80; // Approximate header height
                    const elementPosition = howToApplySection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="flex-1 px-2 py-3 rounded-xl font-semibold text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Action Bar */}
        <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className={`px-3 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 ${
                    saved ? 'bg-gray-100 text-gray-700' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {saved ? (
                    <>
                      <BookmarkCheck size={16} />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} />
                      Save Job
                    </>
                  )}
                </button>

                <button
                  onClick={handleShare}
                  className="px-3 py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Share2 size={16} />
                  Share this job
                </button>
              </div>

              <button
                onClick={() => {
                  const howToApplySection = document.getElementById('how-to-apply');
                  if (howToApplySection) {
                    const headerHeight = 80; // Approximate header height
                    const elementPosition = howToApplySection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="px-6 py-3 rounded-xl font-semibold text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
              >
                Apply for this Position
              </button>
            </div>
          </div>
        </div>


      </div>

      {/* Upgrade Modal */}
      {upgradeErrorType && (
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => {
            setUpgradeModalOpen(false);
            setUpgradeErrorType(null);
            setUpgradeErrorData(null);
          }}
          errorType={upgradeErrorType}
          message={upgradeErrorData?.message}
          resetDate={upgradeErrorData?.resetDate}
          monthlyLimit={upgradeErrorData?.monthlyLimit}
          requiredCredits={upgradeErrorData?.requiredCredits}
          currentCredits={upgradeErrorData?.currentCredits}
        />
      )}
    </>
  );
}
