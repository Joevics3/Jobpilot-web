"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

// OPTIMIZATION: Import only the icons you need (not entire library)
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Shield,
  Calendar,
  PlusCircle
} from 'lucide-react';

import Link from 'next/link';
import Head from 'next/head';

// OPTIMIZATION: Lazy load components that aren't needed immediately
const BannerAd = dynamic(() => import('@/components/ads/BannerAd'), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
});

const AuthModal = dynamic(() => import('@/components/AuthModal'), {
  ssr: false, // Don't render on server
  loading: () => null
});

import { scoreJob, JobRow, UserOnboardingData } from '@/lib/matching/matchEngine';
import { matchCacheService } from '@/lib/matching/matchCache';

interface HomePageProps {
  jobs: any[];
  blogPosts: any[];
  companies?: any[];
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

interface MatchCircleProps {
  score: number;
}

// OPTIMIZATION: Move static data outside component (created once, not on every render)
const CATEGORIES = [
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
] as const;

const LOCATIONS = [
  { title: 'Jobs in Lagos', slug: 'lagos' },
  { title: 'Jobs in Abuja', slug: 'abuja' },
  { title: 'Jobs in PortHarcourt', slug: 'port-harcourt' },
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
] as const;

const FAQS = [
  {
    question: "What is JobMeter?",
    answer: "JobMeter is a comprehensive job search platform that helps candidates find jobs across industries, locations, and experience levels. Our AI-powered matching technology connects job seekers with opportunities that align with their skills and career goals."
  },
  {
    question: "Is JobMeter free for job seekers?",
    answer: "Yes! JobMeter is completely free for job seekers. You can browse jobs, create your profile, get personalized match scores, and apply to unlimited positions at no cost."
  },
  {
    question: "How do I find jobs by location on JobMeter?",
    answer: "You can browse jobs by location using our location filter or visit our 'Jobs by Location' section which lists opportunities in major cities and states across Nigeria and globally."
  },
  {
    question: "Can recruiters post jobs on JobMeter?",
    answer: "Absolutely! Recruiters and companies can post job listings on JobMeter. Simply register your company and start posting opportunities to reach thousands of qualified candidates."
  },
  {
    question: "Does JobMeter verify job listings?",
    answer: "No, we don't verify all companies. However, we try to only post from verified job sources, and flags any suspicious job we find. This helps create a safe and productive job search environment for all candidates."
  }
] as const;

// OPTIMIZATION: Memoized MatchCircle component
const MatchCircle: React.FC<MatchCircleProps> = React.memo(({ score }) => {
  let matchColor = '#F87171';
  if (score > 0 && score <= 50) matchColor = '#FBBF24';
  if (score > 50) matchColor = '#34D399';

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
});

MatchCircle.displayName = 'MatchCircle';

export default function HomePage({ jobs: initialJobs, blogPosts, companies = [] }: HomePageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'seekers' | 'recruiters'>('seekers');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userOnboardingData, setUserOnboardingData] = useState<UserOnboardingData | null>(null);
  const [processedJobs, setProcessedJobs] = useState<JobWithMatch[]>([]);
  const [matchingInProgress, setMatchingInProgress] = useState(false);

  // OPTIMIZATION 1: Defer auth check to allow immediate render
  useEffect(() => {
    // Wait 100ms for critical UI to render first
    const authTimer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(authTimer);
  }, []);

  // OPTIMIZATION 2: Background job processing (non-blocking)
  useEffect(() => {
    if (user) {
      // Wait 500ms before starting expensive operations
      const processingTimer = setTimeout(() => {
        fetchUserOnboardingDataAndProcessJobs();
      }, 500);

      return () => clearTimeout(processingTimer);
    } else {
      // For non-logged-in users, show jobs immediately without matching
      const jobsWithoutMatch = initialJobs.slice(0, 6).map(job => ({
        ...job,
        matchScore: 0,
        breakdown: null,
      }));
      setProcessedJobs(jobsWithoutMatch);
    }
  }, [user, initialJobs]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    }
  };

  // OPTIMIZATION 3: Combined data fetching to reduce waterfall
  const fetchUserOnboardingDataAndProcessJobs = async () => {
    if (!user?.id) return;

    setMatchingInProgress(true);

    try {
      const { data: onboardingData, error } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !onboardingData) {
        // Show jobs without matching if error or no data
        setProcessedJobs(
          initialJobs.slice(0, 6).map(job => ({
            ...job,
            matchScore: 0,
            breakdown: null,
          }))
        );
        setMatchingInProgress(false);
        return;
      }

      setUserOnboardingData(onboardingData);

      // OPTIMIZATION 4: Use requestIdleCallback for non-critical work
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(() => processJobsWithMatching(initialJobs, onboardingData));
      } else {
        setTimeout(() => processJobsWithMatching(initialJobs, onboardingData), 0);
      }
    } catch (error) {
      console.error('Error in fetchUserOnboardingDataAndProcessJobs:', error);
      setMatchingInProgress(false);
    }
  };

  // OPTIMIZATION 5: Chunked processing to maintain UI responsiveness
  const processJobsWithMatching = async (
    jobs: any[],
    onboardingData: UserOnboardingData
  ) => {
    const CHUNK_SIZE = 3; // Process 3 jobs at a time
    const jobsToProcess = jobs.slice(0, 6);
    const matchCache = matchCacheService.loadMatchCache(user?.id);
    const results: JobWithMatch[] = [];

    // Process jobs in chunks with delays to prevent blocking
    for (let i = 0; i < jobsToProcess.length; i += CHUNK_SIZE) {
      const chunk = jobsToProcess.slice(i, i + CHUNK_SIZE);
      
      const chunkResults = chunk.map(job => {
        // Check cache first
        const cached = matchCache[job.id];
        let matchScore = 0;
        let breakdown = null;

        if (cached) {
          matchScore = cached.score;
          breakdown = cached.breakdown;
        } else if (onboardingData) {
          const jobData: JobRow = {
            role: job.role,
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

          const result = scoreJob(jobData, onboardingData);
          matchScore = result.score;
          breakdown = result.breakdown;

          // Cache for future use
          matchCacheService.saveCachedMatch(user?.id, job.id, result);
        }

        return {
          ...job,
          matchScore,
          breakdown,
        };
      });

      results.push(...chunkResults);

      // OPTIMIZATION 6: Progressive rendering - update UI with each chunk
      setProcessedJobs([...results]);

      // Small delay between chunks to keep UI responsive
      if (i + CHUNK_SIZE < jobsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    setMatchingInProgress(false);
  };

  const handleCTAClick = (type: 'seeker' | 'recruiter') => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (type === 'seeker') {
      router.push('/jobs');
    } else {
      router.push('/recruiter/post-job');
    }
  };

  return (
    <>
      <Head>
        <title>JobMeter - Find Your Dream Job | AI-Powered Job Matching Platform</title>
        <meta
          name="description"
          content="JobMeter connects job seekers with top employers across industries. Browse thousands of job listings, get personalized match scores, and find your perfect career opportunity."
        />
        <meta name="keywords" content="jobs, careers, employment, job search, hiring, recruitment, job board" />
        <link rel="canonical" href="https://jobmeter.com" />
        
        {/* OPTIMIZATION: Preconnect to critical domains */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.ezojs.com" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        {/* Hero Section */}
        <section
          className="relative px-6 py-16 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.accent.blue} 100%)`,
          }}
        >
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Find Your Dream Job with AI-Powered Matching
              </h1>
              <p className="text-lg md:text-xl text-blue-50 max-w-2xl mx-auto">
                Connect with top employers across industries. Get personalized job recommendations that match your skills and career goals.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg p-1 bg-white/10 backdrop-blur-sm">
                <button
                  onClick={() => setActiveTab('seekers')}
                  className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                    activeTab === 'seekers'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-white hover:text-blue-100'
                  }`}
                  aria-label="For Job Seekers"
                >
                  For Job Seekers
                </button>
                <button
                  onClick={() => setActiveTab('recruiters')}
                  className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                    activeTab === 'recruiters'
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-white hover:text-blue-100'
                  }`}
                  aria-label="For Recruiters"
                >
                  For Recruiters
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'seekers' ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                    <Briefcase size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Discover Opportunities That Match Your Skills
                    </h2>
                    <p className="text-gray-600">
                      Browse thousands of jobs, get AI-powered match scores, and apply with one click.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span>Personalized job recommendations based on your profile</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span>AI match scores showing compatibility with each role</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span>Application tracking and career resources</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCTAClick('seeker')}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                  aria-label="Browse all jobs"
                >
                  Browse Jobs
                  <ArrowRight className="inline ml-2" size={18} />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Find Top Talent for Your Team
                    </h2>
                    <p className="text-gray-600">
                      Post jobs, reach qualified candidates, and build your dream team.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span>Access thousands of qualified job seekers</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span>AI-powered candidate matching and screening</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span>Easy job posting and applicant management</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCTAClick('recruiter')}
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: theme.colors.success }}
                  aria-label="Post a job"
                >
                  Post a Job
                  <PlusCircle className="inline ml-2" size={18} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-6 py-12 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.primary.DEFAULT }}>
                  10,000+
                </div>
                <div className="text-sm text-gray-600">Active Jobs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.primary.DEFAULT }}>
                  5,000+
                </div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.primary.DEFAULT }}>
                  50,000+
                </div>
                <div className="text-sm text-gray-600">Job Seekers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.primary.DEFAULT }}>
                  98%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Jobs Section - OPTIMIZATION: Shows immediately, matches calculate in background */}
        <section className="px-6 py-8" style={{ backgroundColor: theme.colors.background.muted }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {user ? 'Recommended Jobs For You' : 'Featured Jobs'}
                </h2>
                <p className="text-sm text-gray-600">
                  {matchingInProgress 
                    ? 'Calculating your personalized matches...' 
                    : user && processedJobs.length > 0 
                    ? 'Based on your profile and preferences'
                    : 'Latest opportunities from top companies'}
                </p>
              </div>
              <Link
                href="/jobs"
                className="text-sm font-semibold flex items-center gap-1"
                style={{ color: theme.colors.primary.DEFAULT }}
              >
                View All
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedJobs.length > 0 ? (
                processedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.slug}`}
                    className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Building2 size={14} />
                          <span className="truncate">{job.company?.name || 'Company'}</span>
                        </div>
                      </div>
                      {user && job.matchScore > 0 && <MatchCircle score={job.matchScore} />}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 mb-3">
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>
                            {typeof job.location === 'string'
                              ? job.location
                              : `${job.location.city || ''}${
                                  job.location.state ? `, ${job.location.state}` : ''
                                }`}
                          </span>
                        </div>
                      )}
                      {job.posted_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {job.breakdown && user && (
                      <div className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                        {job.breakdown.rolesScore > 0 && (
                          <span className="mr-2">• {job.breakdown.rolesReason}</span>
                        )}
                        {job.breakdown.skillsScore > 0 && (
                          <span className="mr-2">• {job.breakdown.skillsReason}</span>
                        )}
                      </div>
                    )}
                  </Link>
                ))
              ) : (
                // OPTIMIZATION: Skeleton loading for better perceived performance
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-5 border border-gray-200 animate-pulse"
                  >
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Browse Jobs by Category */}
        <section className="px-6 py-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Jobs by Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/jobs/category/${cat.slug}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {cat.title}
                </Link>
              ))}
              <Link
                href="/jobs/category"
                className="text-blue-600 hover:underline font-semibold mt-2 text-sm"
              >
                View All Categories →
              </Link>
            </div>
          </div>
        </section>

        {/* Browse Jobs by Location */}
        <section className="px-6 py-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Jobs by Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LOCATIONS.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/jobs/state/${loc.slug}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {loc.title}
                </Link>
              ))}
              <Link
                href="/jobs/state"
                className="text-blue-600 hover:underline font-semibold mt-2 text-sm"
              >
                View All Locations →
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

        {/* FAQ Section */}
        <section className="px-6 py-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq, index) => (
                <details key={index} className="group border border-gray-200 rounded-lg">
                  <summary className="flex justify-between items-center cursor-pointer p-4 font-semibold text-gray-900 hover:bg-gray-50">
                    {faq.question}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-0 text-sm text-gray-600 border-t border-gray-100">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Blog Posts */}
        {blogPosts.length > 0 && (
          <section className="px-6 py-8" style={{ backgroundColor: theme.colors.background.muted }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Career Insights & Tips</h2>
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

        {/* OPTIMIZATION: Lazy-loaded Banner Ad */}
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

        {/* OPTIMIZATION: Lazy-loaded Auth Modal (only loads when needed) */}
        {authModalOpen && <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />}
      </div>
    </>
  );
}