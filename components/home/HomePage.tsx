"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Target,
  Shield,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import BannerAd from '@/components/ads/BannerAd';
import AuthModal from '@/components/AuthModal';
import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

interface HomePageProps {
  jobs: any[];
  blogPosts: any[];
}

interface JobWithMatch {
  id: string;
  slug: string;
  title: string;
  company: any;
  location: any;
  posted_date: string;
  matchScore: number;
  breakdown: any;
}

// Inline MatchCircle component
interface MatchCircleProps {
  score: number;
}

const MatchCircle: React.FC<MatchCircleProps> = ({ score }) => {
  let matchColor = '#F87171'; // red
  if (score > 0 && score <= 50) matchColor = '#FBBF24'; // orange
  if (score > 50) matchColor = '#34D399'; // green

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
        style={{
          borderColor: matchColor,
          backgroundColor: theme.colors.background.muted,
        }}
      >
        <span className="text-sm font-bold" style={{ color: matchColor }}>
          {score}%
        </span>
      </div>
      <span
        className="text-[10px] font-medium"
        style={{ color: theme.colors.text.secondary }}
      >
        Match
      </span>
    </div>
  );
};

export default function HomePage({ jobs: initialJobs, blogPosts }: HomePageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'seekers' | 'recruiters'>('seekers');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  const [processedJobs, setProcessedJobs] = useState<JobWithMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded categories and locations for hyperlinks
  const categories = [
    { title: 'Accountant Jobs', slug: 'accountant-jobs' },
    { title: 'Sales Executive Jobs', slug: 'sales-executive-jobs' },
    { title: 'Social Media Manager Jobs', slug: 'social-media-manager-jobs' },
    { title: 'Inventory Controller Jobs', slug: 'inventory-controller-jobs' },
    { title: 'Executive Assistant Jobs', slug: 'executive-assistant-jobs' },
    { title: 'Housekeeper Jobs', slug: 'housekeeper-jobs' },
    { title: 'Farm Manager Jobs', slug: 'farm-manager-jobs' },
    { title: 'Marketing Officer Jobs', slug: 'marketing-officer-jobs' },
    { title: 'Nanny Jobs', slug: 'nanny-jobs' },
    { title: 'HR Manager Jobs', slug: 'hr-manager-jobs' },
    { title: 'Chef Jobs', slug: 'chef-jobs' },
    { title: 'Cook Jobs', slug: 'cook-jobs' },
    { title: 'Sales Manager Jobs', slug: 'sales-manager-jobs' },
    { title: 'Content Creator Jobs', slug: 'content-creator-jobs' },
    { title: 'Customer Service Representative Jobs', slug: 'customer-service-representative-jobs' },
    { title: 'Machine Operator Jobs', slug: 'machine-operator-jobs' },
    { title: 'Production Technician Jobs', slug: 'production-technician-jobs' },
    { title: 'Beautician Jobs', slug: 'beautician-jobs' },
    { title: 'Graphic Designer Jobs', slug: 'graphic-designer-jobs' },
    { title: 'AI Engineer Jobs', slug: 'ai-engineer-jobs' },
  ];

  const locations = [
    { title: 'Jobs in Lagos', slug: 'lagos' },
    { title: 'Jobs in Abuja', slug: 'abuja' },
    { title: 'Jobs in PortHarcourt', slug: 'portharcourt' },
    { title: 'Jobs in Ibadan', slug: 'ibadan' },
    { title: 'Jobs in Kano', slug: 'kano' },
    { title: 'Jobs in Kaduna', slug: 'kaduna' },
    { title: 'Jobs in Ondo', slug: 'ondo' },
    { title: 'Jobs in Ogun', slug: 'ogun' },
    { title: 'Jobs in Rivers', slug: 'rivers' },
    { title: 'Jobs in Oyo', slug: 'oyo' },
    { title: 'Jobs in Ekiti', slug: 'ekiti' },
    { title: 'Jobs in Enugu', slug: 'enugu' },
    { title: 'Jobs in Imo', slug: 'imo' },
    { title: 'Jobs in Delta', slug: 'delta' },
    { title: 'Jobs in Edo', slug: 'edo' },
    { title: 'Jobs in Kwara', slug: 'kwara' },
    { title: 'Jobs in Benue', slug: 'benue' },
    { title: 'Jobs in Niger', slug: 'niger' },
    { title: 'Jobs in Plateau', slug: 'plateau' },
    { title: 'Jobs in Sokoto', slug: 'sokoto' },
  ];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserOnboardingData();
    } else {
      // No user, just show jobs with 0 match score
      processJobsWithoutMatching();
    }
  }, [user]);

  useEffect(() => {
    if (user && userOnboardingData !== null) {
      processJobsWithMatching(initialJobs);
    }
  }, [userOnboardingData, initialJobs]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    } else {
      setUser(null);
      processJobsWithoutMatching();
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

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding data:', error);
        processJobsWithoutMatching();
        return;
      }

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
      } else {
        processJobsWithoutMatching();
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
      processJobsWithoutMatching();
    }
  };

  const processJobsWithoutMatching = () => {
    const jobsWithZeroMatch = initialJobs.map(job => ({
      id: job.id,
      slug: job.slug || job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      posted_date: job.posted_date || job.created_at,
      matchScore: 0,
      breakdown: null,
    }));
    setProcessedJobs(jobsWithZeroMatch);
    setLoading(false);
  };

  const processJobsWithMatching = useCallback(async (jobRows: any[]) => {
    if (!userOnboardingData || !user) {
      processJobsWithoutMatching();
      return;
    }

    setLoading(true);

    try {
      const matchCache = matchCacheService.loadMatchCache(user.id);
      let cacheNeedsUpdate = false;
      const updatedCache = { ...matchCache };

      const jobsWithScores = await Promise.all(
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

            return {
              id: job.id,
              slug: job.slug || job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              posted_date: job.posted_date || job.created_at,
              matchScore: calculatedTotal,
              breakdown: matchResult.breakdown,
            };
          } catch (error) {
            console.error(`Error processing match for job ${job.id}:`, error);
            return {
              id: job.id,
              slug: job.slug || job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              posted_date: job.posted_date || job.created_at,
              matchScore: 0,
              breakdown: null,
            };
          }
        })
      );

      if (cacheNeedsUpdate) {
        matchCacheService.saveMatchCache(user.id, updatedCache);
      }

      // Sort by match score descending
      jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);
      setProcessedJobs(jobsWithScores);
    } catch (error) {
      console.error('Error processing jobs with matching:', error);
      processJobsWithoutMatching();
    } finally {
      setLoading(false);
    }
  }, [user, userOnboardingData, initialJobs]);

  const getRelativeTime = (dateString: string) => {
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
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } catch {
      return '';
    }
  };

  const getCompanyName = (company: any) => {
    if (!company) return 'Company';
    if (typeof company === 'string') return company;
    return company.name || 'Company';
  };

  const getLocationString = (location: any) => {
    if (!location) return 'Location not specified';
    if (typeof location === 'string') return location;
    if (location.remote) return 'Remote';
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Hero Section */}
      <div className="pt-12 pb-8 px-6" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-white">
            JobMeter — Find Jobs That Match Your Skills & Experiences
          </h1>
          <p className="text-base text-white/90 mb-6 leading-relaxed">
            Discover your next career opportunity with JobMeter. Our smart connects job seekers with thousands of employment opportunities across industries. Get personalized job matches, track applications, and build your professional future with confidence.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-white transition-colors hover:bg-gray-100 flex items-center gap-2"
              style={{ color: theme.colors.primary.DEFAULT }}
            >
              <Users size={18} />
              Get Started
            </button>
            <button
              onClick={() => router.push('/company/register')}
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 text-white transition-colors hover:bg-white/20 border border-white/20 flex items-center gap-2"
            >
              <Building2 size={18} />
              For Recruiters
            </button>
          </div>
        </div>
      </div>

      {/* Banner Ad */}
      <div className="px-6">
        <BannerAd />
      </div>

      {/* Tabs Section */}
      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('seekers')}
              className={`flex-1 pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'seekers' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Briefcase size={18} />
                Job Seekers
              </div>
              {activeTab === 'seekers' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.colors.primary.DEFAULT }} />}
            </button>
            <button
              onClick={() => setActiveTab('recruiters')}
              className={`flex-1 pb-3 font-semibold text-sm transition-colors relative ${activeTab === 'recruiters' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Building2 size={18} />
                Recruiters
              </div>
              {activeTab === 'recruiters' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.colors.primary.DEFAULT }} />}
            </button>
          </div>

          {/* Job Seekers Tab Content */}
          {activeTab === 'seekers' && (
            <div className="space-y-8">
              {/* Latest Jobs */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Latest Job Opportunities</h2>
                  <Link
                    href="/jobs"
                    className="text-sm font-semibold flex items-center gap-1"
                    style={{ color: theme.colors.primary.DEFAULT }}
                  >
                    View All
                    <ArrowRight size={16} />
                  </Link>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <p style={{ color: theme.colors.text.secondary }}>Loading jobs...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedJobs.slice(0, 10).map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.slug}`}
                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-600">{getCompanyName(job.company)}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin size={12} />
                                {getLocationString(job.location)}
                                {job.posted_date && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <Calendar size={12} />
                                    {getRelativeTime(job.posted_date)}
                                  </>
                                )}
                              </span>
                            </div>
                            <MatchCircle score={job.matchScore} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="mt-6 text-center">
                  <Link
                    href="/jobs"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-colors"
                    style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                  >
                    Explore All Jobs
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </section>
            </div>
          )}

          {/* Recruiters Tab Content */}
          {activeTab === 'recruiters' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Why Post Jobs on JobMeter?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.success + '20' }}>
                      <Target size={20} style={{ color: theme.colors.success }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Reach Qualified Candidates</h4>
                      <p className="text-sm text-gray-600">Connect with thousands of active job seekers across multiple industries and experience levels.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.accent.blue + '20' }}>
                      <Sparkles size={20} style={{ color: theme.colors.accent.blue }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">AI-Powered Matching</h4>
                      <p className="text-sm text-gray-600">Our intelligent system matches your job postings with the most relevant candidates automatically.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.colors.accent.purple + '20' }}>
                      <TrendingUp size={20} style={{ color: theme.colors.accent.purple }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Easy Job Posting</h4>
                      <p className="text-sm text-gray-600">Post jobs quickly with our streamlined interface. No complex registration required.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    href="/company/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-colors w-full justify-center"
                    style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                  >
                    Register Your Company
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-900 transition-colors hover:bg-gray-200 w-full mt-3"
                  >
                    Post a Job
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Browse Jobs by Category */}
      <section className="px-6 py-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Jobs by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/resources/${cat.slug}`}
                className="text-blue-600 hover:underline"
              >
                {cat.title}
              </Link>
            ))}
            <Link
              href="/resources"
              className="text-blue-600 hover:underline font-semibold mt-2"
            >
              View All Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Browse Jobs by Location */}
      <section className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Jobs by Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {locations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/jobs/state/${loc.slug}`}
                className="text-blue-600 hover:underline"
              >
                {loc.title}
              </Link>
            ))}
            <Link
              href="/jobs/state"
              className="text-blue-600 hover:underline font-semibold mt-2"
            >
              View All Locations
            </Link>
          </div>
        </div>
      </section>

      {/* Why JobMeter */}
      <section className="px-6 py-8 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose JobMeter?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-blue-100">
              <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: theme.colors.primary.DEFAULT + '20' }}>
                <Sparkles size={24} style={{ color: theme.colors.primary.DEFAULT }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Job Matching</h3>
              <p className="text-sm text-gray-600">Our AI technology analyzes your profile and matches you with jobs that fit your skills, experience, and career goals.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-blue-100">
              <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: theme.colors.success + '20' }}>
                <Shield size={24} style={{ color: theme.colors.success }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Opportunities</h3>
              <p className="text-sm text-gray-600">All job listings are from legitimate employers. We verify companies and opportunities to ensure your job search is safe and productive.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-blue-100">
              <div className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center" style={{ backgroundColor: theme.colors.accent.blue + '20' }}>
                <CheckCircle size={24} style={{ color: theme.colors.accent.blue }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Career Tools & Resources</h3>
              <p className="text-sm text-gray-600">Access CV builders, interview prep guides, career advice, and application tracking to optimize your job search success.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Blog Posts</h2>
              </div>
              <Link
                href="/blog"
                className="text-sm font-semibold flex items-center gap-1"
                style={{ color: theme.colors.primary.DEFAULT }}
              >
                View All
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banner Ad */}
      <div className="px-6">
        <BannerAd />
      </div>

      {/* SEO Footer Content */}
      <section className="px-6 py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-sm max-w-none">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Trusted Partner in Global Job Search</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              JobMeter is a comprehensive online job board connecting job seekers with employment opportunities across multiple industries, experience levels, and countries. Whether you're searching for entry-level positions, professional careers, remote work, or specialized roles, our platform provides access to thousands of current job listings updated daily. Our intelligent job matching technology helps candidates find positions that align with their skills, experience, location preferences, and career aspirations.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              From accounting and finance jobs to technology, healthcare, sales, marketing, engineering, and administrative positions, JobMeter serves as your complete career platform. Job seekers benefit from personalized match scores, application tracking, CV creation tools, interview preparation resources, and career advice. Employers and recruiters can post job openings, reach qualified candidates, and build strong teams efficiently. Our platform supports both job seekers and companies in making informed hiring decisions.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Explore job opportunities in major cities, browse by industry sector, search by job type (full-time, part-time, contract, remote), and access career resources including salary guides, resume tips, and interview strategies. JobMeter is committed to making your job search journey seamless, productive, and successful. Join thousands of professionals who have found their ideal careers through our platform.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/jobs" className="font-semibold hover:underline" style={{ color: theme.colors.primary.DEFAULT }}>
                Browse All Jobs
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/resources" className="font-semibold hover:underline" style={{ color: theme.colors.primary.DEFAULT }}>
                Career Resources
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/blog" className="font-semibold hover:underline" style={{ color: theme.colors.primary.DEFAULT }}>
                Career Blog
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/company" className="font-semibold hover:underline" style={{ color: theme.colors.primary.DEFAULT }}>
                Company Directory
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/about" className="font-semibold hover:underline" style={{ color: theme.colors.primary.DEFAULT }}>
                About JobMeter
              </Link>
              <span className="text-gray-400">•</span>
              <Link href="/submit" className="font-semibold hover:underline" style={{ color: theme.colors.primary.DEFAULT }}>
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}