"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, DollarSign, Calendar, Briefcase, Mail, Phone, ExternalLink, ArrowLeft, Clock, Building, Target, Award, Sparkles, Link, Bookmark, BookmarkCheck } from 'lucide-react';
import { theme } from '@/lib/theme';
import { getCompanyName, findCompanyByName } from '@/lib/utils/companyUtils';
import UpgradeModal from '@/components/jobs/UpgradeModal';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import RelatedJobCard from '@/components/jobs/RelatedJobCard';

const STORAGE_KEYS = {
  SAVED_JOBS: 'saved_jobs',
  APPLIED_JOBS: 'applied_jobs',
};

export default function JobClient({ job, relatedJobs }: { job: any; relatedJobs?: any[] }) {
  const router = useRouter();
  const jobId = job.id;
  
  const [saved, setSaved] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadSavedStatus();
    loadAppliedStatus();
    loadCompanies();
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

  const getCompanyInfo = () => {
    const companyName = getCompanyName(job.company);
    const company = findCompanyByName(companyName, companies);
    
    return {
      name: companyName,
      company: company,
      slug: company?.slug
    };
  };

  const companyInfo = getCompanyInfo();

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

    if (typeof job.salary === 'string') return job.salary;

    if (job.salary_range && typeof job.salary_range === 'object') {
      const { min, max, currency, period } = job.salary_range;

      if (min != null && currency) {
        if (!max || min === max) {
          return `${currency} ${min.toLocaleString()} ${period || ''}`.trim();
        }

        return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} ${period || ''}`.trim();
      }
    }

    return null;
  };

const getExperienceLevelWithYears = (level: string) => {
  // Normalize the input
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

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="relative pt-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => router.push('/jobs')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              style={{ color: theme.colors.primary.DEFAULT }}
            >
              <ArrowLeft size={18} />
              Back to Jobs
            </button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1
                className="text-2xl font-bold mb-2"
                style={{ color: theme.colors.primary.DEFAULT }}
              >
                {job.title || 'Untitled Job'}
              </h1>
              <div className="flex items-center gap-2 mb-2">
                {companyInfo.company?.logo_url && (
                  <img 
                    src={companyInfo.company.logo_url} 
                    alt={companyInfo.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                {companyInfo.slug ? (
                  <a 
                    href={`/company/${companyInfo.slug}`}
                    className="text-lg font-medium hover:underline transition-colors flex items-center gap-1"
                    style={{ color: theme.colors.primary.DEFAULT }}
                  >
                    {companyInfo.name}
                    <Link size={16} className="opacity-70" />
                  </a>
                ) : (
                  <p className="text-lg font-medium" style={{ color: theme.colors.primary.DEFAULT }}>
                    {companyInfo.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="py-6">
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getLocationString()}
                  </p>
                </div>
              </div>

              {getSalaryString() && (
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Salary</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getSalaryString()}
                    </p>
                  </div>
                </div>
              )}

              {(job.employment_type || job.type) && (
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Employment Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {job.employment_type || job.type}
                    </p>
                  </div>
                </div>
              )}

              {job.job_type && (
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Work Arrangement</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getJobTypeDisplay(job.job_type)}
                    </p>
                  </div>
                </div>
              )}

              {job.sector && (
                <div className="flex items-center gap-2">
                  <Building size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Sector</p>
                    <p className="text-sm font-medium text-gray-900">
                      {job.sector}
                    </p>
                  </div>
                </div>
              )}

              {job.experience_level && (
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Experience Level</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getExperienceLevelWithYears(job.experience_level)}
                    </p>
                  </div>
                </div>
              )}

              {job.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Valid Through</p>
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

          {/* About Company Section */}
          {job.about_company && (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                About the Company
              </h2>
              <div
                className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: typeof job.about_company === 'string' ? job.about_company : '' }}
              />
            </section>
          )}

          {/* Description Section */}
          {job.description && (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Job Description
              </h2>
              <div
                className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: typeof job.description === 'string' ? job.description : '' }}
              />
            </section>
          )}

          {/* Skills Section */}
          {((job.skills_required && Array.isArray(job.skills_required) && job.skills_required.length > 0) ||
            (job.skills && Array.isArray(job.skills) && job.skills.length > 0)) && (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {(job.skills_required || job.skills || []).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-900"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Responsibilities */}
          {(() => {
            const responsibilities = job.responsibilities || [];
            const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
            
            if (responsibilitiesArray.length > 0) {
              return (
                <section className="mb-6 p-4 border border-gray-100 bg-white">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">
                    Key Responsibilities
                  </h2>
                  <ul className="space-y-2">
                    {responsibilitiesArray.map((responsibility: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                        <span className="text-gray-900 mt-1.5">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </section>
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
                <section className="mb-6 p-4 border border-gray-100 bg-white">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">
                    Qualifications
                  </h2>
                  <ul className="space-y-2">
                    {qualificationsArray.map((qualification: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                        <span className="text-gray-900 mt-1.5">•</span>
                        <span>{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </section>
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
                <section className="mb-6 p-4 border border-gray-100 bg-white">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">
                    Benefits & Perks
                  </h2>
                  <ul className="space-y-2">
                    {benefitsArray.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                        <Award size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }
            return null;
          })()}

{(job.posted_date || job.created_at) && (
  <section className="mb-6 p-4 border border-gray-100 bg-white">
    <h2 className="text-lg font-semibold mb-2 text-gray-900">Posted</h2>
    <p className="text-sm text-gray-600">
      {(() => {
        const dateStr = job.posted_date || job.created_at;
        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return 'Date not available';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC' // Important: use UTC to prevent timezone issues
        });
      })()}
    </p>
  </section>
)}

          {/* How to Apply Section */}
          {(job.application?.email || job.application_email || job.application?.phone || job.application_phone || job.application?.link || job.application?.url || job.application_url) && (
            <section id="how-to-apply" className="mb-6 p-4 border border-gray-100 bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                How to Apply
              </h2>
              <div className="space-y-4">
                {/* Email Application */}
                {(job.application?.email || job.application_email) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Mail size={20} style={{ color: theme.colors.primary.DEFAULT }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">Email Application</h3>
                      <a 
                        href={`mailto:${(job.application?.email || job.application_email || '').replace('mailto:', '')}?subject=${encodeURIComponent(job.subject || `${job.title || 'Job'} Application`)}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: theme.colors.primary.DEFAULT }}
                      >
                        {(job.application?.email || job.application_email || '').replace('mailto:', '')}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        Subject: "{job.subject || `${job.title || 'Job'} Application - [Your Name]`}"
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Phone Application */}
                {(job.application?.phone || job.application_phone) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Phone size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">Phone</h3>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${(job.application?.phone || job.application_phone || '').replace('tel:', '')}`}
                          className="text-sm font-medium hover:underline text-green-600"
                        >
                          {(job.application?.phone || job.application_phone || '').replace('tel:', '')}
                        </a>
                        <a 
                          href={`https://wa.me/${(job.application?.phone || job.application_phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                          title="Open in WhatsApp"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Online Form */}
                {(job.application?.link || job.application?.url || job.application_url) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">Online Form</h3>
                      <a 
                        href={job.application?.link || job.application?.url || job.application_url || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline text-purple-600"
                      >
                        Apply Online
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Related Jobs Section */}
          {relatedJobs && relatedJobs.length > 0 ? (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Related Jobs ({relatedJobs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedJobs.map((relatedJob) => (
                  <RelatedJobCard key={relatedJob.id} job={relatedJob} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Related Jobs
              </h2>
              <p className="text-gray-600 text-sm">No related jobs found at this time.</p>
            </section>
          )}

          {/* Additional Job Information Accordion */}
          {((job.about_role && job.about_role.trim()) || 
            (job.who_apply && job.who_apply.trim()) || 
            (job.standout && job.standout.trim())) && (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <Accordion type="multiple" className="w-full">
                {job.about_role && job.about_role.trim() && (
                  <AccordionItem value="about-role" className="border-b border-gray-200">
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                      About This Role
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {job.about_role}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {job.who_apply && job.who_apply.trim() && (
                  <AccordionItem value="who-apply" className="border-b border-gray-200">
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                      Who Should Apply
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {job.who_apply}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {job.standout && job.standout.trim() && (
                  <AccordionItem value="standout" className="border-b-0">
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-yellow-500" />
                        <span>How to Stand Out When Applying</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {job.standout}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </section>
          )}

          {/* Application Link */}
          {(job.application_url || (job.application && (job.application.url || job.application.link))) && (
            <section className="mb-6 p-4 border border-gray-100 bg-white">
              <a
                href={job.application_url || job.application?.url || job.application?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: theme.colors.primary.DEFAULT }}
              >
                <ExternalLink size={16} />
                View original job posting
              </a>
            </section>
          )}

          {/* Description Section */}
          {job.description && (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Job Description
              </h2>
              <div
                className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: typeof job.description === 'string' ? job.description : '' }}
              />
            </section>
          )}

          {/* Skills Section */}
          {((job.skills_required && Array.isArray(job.skills_required) && job.skills_required.length > 0) ||
            (job.skills && Array.isArray(job.skills) && job.skills.length > 0)) && (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-3 text-gray-900">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {(job.skills_required || job.skills || []).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-900"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Responsibilities */}
          {(() => {
            const responsibilities = job.responsibilities || [];
            const responsibilitiesArray = Array.isArray(responsibilities) ? responsibilities : [];
            
            if (responsibilitiesArray.length > 0) {
              return (
                <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">
                    Key Responsibilities
                  </h2>
                  <ul className="space-y-2">
                    {responsibilitiesArray.map((responsibility: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                        <span className="text-gray-900 mt-1.5">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </section>
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
                <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">
                    Qualifications
                  </h2>
                  <ul className="space-y-2">
                    {qualificationsArray.map((qualification: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                        <span className="text-gray-900 mt-1.5">•</span>
                        <span>{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </section>
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
                <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
                  <h2 className="text-lg font-semibold mb-3 text-gray-900">
                    Benefits & Perks
                  </h2>
                  <ul className="space-y-2">
                    {benefitsArray.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                        <Award size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            }
            return null;
          })()}

{(job.posted_date || job.created_at) && (
  <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
    <h2 className="text-lg font-semibold mb-2 text-gray-900">Posted</h2>
    <p className="text-sm text-gray-600">
      {(() => {
        const dateStr = job.posted_date || job.created_at;
        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return 'Date not available';
        }
        
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC' // Important: use UTC to prevent timezone issues
        });
      })()}
    </p>
  </section>
)}

          {/* How to Apply Section */}
          {(job.application?.email || job.application_email || job.application?.phone || job.application_phone || job.application?.link || job.application?.url || job.application_url) && (
            <section id="how-to-apply" className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                How to Apply
              </h2>
              <div className="space-y-4">
                {/* Email Application */}
                {(job.application?.email || job.application_email) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Mail size={20} style={{ color: theme.colors.primary.DEFAULT }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">Email Application</h3>
                      <a 
                        href={`mailto:${(job.application?.email || job.application_email || '').replace('mailto:', '')}?subject=${encodeURIComponent(job.subject || `${job.title || 'Job'} Application`)}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: theme.colors.primary.DEFAULT }}
                      >
                        📧 {(job.application?.email || job.application_email || '').replace('mailto:', '')}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        Subject: "{job.subject || `${job.title || 'Job'} Application - [Your Name]`}"
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Phone Application */}
                {(job.application?.phone || job.application_phone) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Phone size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">Phone</h3>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${(job.application?.phone || job.application_phone || '').replace('tel:', '')}`}
                          className="text-sm font-medium hover:underline text-green-600"
                        >
                          📱 {(job.application?.phone || job.application_phone || '').replace('tel:', '')}
                        </a>
                        <a 
                          href={`https://wa.me/${(job.application?.phone || job.application_phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                          title="Open in WhatsApp"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Online Form */}
                {(job.application?.link || job.application?.url || job.application_url) && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <ExternalLink size={20} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">Online Form</h3>
                      <a 
                        href={job.application?.link || job.application?.url || job.application_url || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:underline text-purple-600"
                      >
                        🔗 Apply Online
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Related Jobs Section */}
          {relatedJobs && relatedJobs.length > 0 ? (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Related Jobs ({relatedJobs.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedJobs.map((relatedJob) => (
                  <RelatedJobCard key={relatedJob.id} job={relatedJob} />
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Related Jobs
              </h2>
              <p className="text-gray-600 text-sm">No related jobs found at this time.</p>
            </section>
          )}

          {/* Additional Job Information Accordion */}
          {((job.about_role && job.about_role.trim()) || 
            (job.who_apply && job.who_apply.trim()) || 
            (job.standout && job.standout.trim())) && (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <Accordion type="multiple" className="w-full">
                {job.about_role && job.about_role.trim() && (
                  <AccordionItem value="about-role" className="border-b border-gray-200">
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                      About This Role
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {job.about_role}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {job.who_apply && job.who_apply.trim() && (
                  <AccordionItem value="who-apply" className="border-b border-gray-200">
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                      Who Should Apply
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {job.who_apply}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {job.standout && job.standout.trim() && (
                  <AccordionItem value="standout" className="border-b-0">
                    <AccordionTrigger className="text-base font-semibold text-gray-900 hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-yellow-500" />
                        <span>How to Stand Out When Applying</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">
                        {job.standout}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </section>
          )}

          {/* Application Link */}
          {(job.application_url || (job.application && (job.application.url || job.application.link))) && (
            <section className="mb-6 rounded-xl p-4 shadow-sm bg-white">
              <a
                href={job.application_url || job.application?.url || job.application?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: theme.colors.primary.DEFAULT }}
              >
                <ExternalLink size={16} />
                View original job posting
              </a>
            </section>
          )}

        </div>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 border-t bg-white border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`flex-1 px-2 py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                saved ? 'bg-gray-100 text-gray-600' : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {saved ? (
                <>
                  <BookmarkCheck size={18} />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark size={18} />
                  Save Job
                </>
              )}
            </button>

            <button
              onClick={() => {
                const howToApplySection = document.getElementById('how-to-apply');
                if (howToApplySection) {
                  howToApplySection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 px-2 py-3 rounded-xl font-semibold text-sm text-white transition-colors"
              style={{ backgroundColor: theme.colors.primary.DEFAULT }}
            >
              How to Apply
            </button>
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