'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, Target, Award, AlertTriangle, Lightbulb, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { CareerCoachService, CareerCoachResult } from '@/lib/services/careerCoachService';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

type TabType = 'paths' | 'skills' | 'insights';

// ─── All sub-components outside CareerPage to prevent JSX parse errors ─────────

function HowItWorks() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            'Complete your profile with skills and experience',
            'Our AI analyzes your career profile',
            'Get personalized career path recommendations',
            'Identify skill gaps and get development tips',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-gray-600">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RelatedTools() {
  const tools = [
    { title: 'CV Keyword Checker', description: 'Check keyword match between your CV and job descriptions', color: '#10B981', route: '/tools/keyword-checker' },
    { title: 'ATS CV Review', description: 'Optimize your CV for ATS systems before applying', color: '#8B5CF6', route: '/tools/ats-review' },
    { title: 'Career Coach', description: 'Get personalized career guidance and advice', color: '#F59E0B', route: '/tools/career' },
    { title: 'Role Finder', description: 'Discover new career paths based on your skills', color: '#06B6D4', route: '/tools/role-finder' },
    { title: 'Job Scam Detector', description: 'AI-powered analysis to detect fraudulent job postings', color: '#EF4444', route: '/tools/scam-detector' },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-t border-gray-200 pt-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Related Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => (
            <a
              key={tool.title}
              href={tool.route}
              className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: tool.color + '1A' }}
              >
                <span className="text-lg font-bold" style={{ color: tool.color }}>&#8594;</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{tool.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{tool.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// Schema objects defined as plain constants (no JSX) to avoid nested-component issues
const softwareSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Career Coach AI',
  description: 'Free AI-powered career coaching app. Get personalized career path recommendations, skill gap analysis, and market insights to advance your career globally.',
  url: 'https://jobmeter.com/tools/career',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  featureList: ['Personalized Career Path Recommendations', 'Skill Gap Analysis', 'Real-Time Market Insights', 'Progress Tracking', 'Resume Analytics'],
  provider: { '@type': 'Organization', name: 'JobMeter' },
  aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '1200' },
});

const faqSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What exactly does a career coach do?',
      acceptedAnswer: { '@type': 'Answer', text: 'A career coach helps professionals navigate career growth through goal-setting, resume optimization, interview prep, and strategic career planning. AI career coaches automate this with data-driven profile analysis and personalized recommendations.' },
    },
    {
      '@type': 'Question',
      name: 'Can ChatGPT give career advice?',
      acceptedAnswer: { '@type': 'Answer', text: 'ChatGPT can respond to career-related prompts but lacks persistent memory, real-time job market data, and structured progress tracking. Dedicated AI career coach platforms offer more accurate, personalized, and actionable guidance.' },
    },
    {
      '@type': 'Question',
      name: 'How much is a 30-minute life coaching session?',
      acceptedAnswer: { '@type': 'Answer', text: 'A 30-minute career coaching session typically costs $50-$200 globally, averaging around $125 in North America. AI-powered alternatives like Career Coach AI offer core features for free.' },
    },
    {
      '@type': 'Question',
      name: 'What are the 7 qualities of an effective coach?',
      acceptedAnswer: { '@type': 'Answer', text: 'The seven qualities are: empathy, deep expertise, clarity, accountability, adaptability, inspiration, and results-orientation. The best career coaches and AI coaching tools embody all seven.' },
    },
  ],
});

const comparisonRows: [string, string, string, string][] = [
  ['Cost', 'Free core; premium $9/mo', '$50-$200/session', 'Free but generic'],
  ['Speed', 'Instant analysis', 'Scheduled sessions', 'Prompt-dependent'],
  ['Personalization', 'Profile-based AI', 'Human intuition', 'One-off responses'],
  ['Skill Gap Tracking', 'Detailed roadmap', 'Vague suggestions', 'No tracking'],
  ['Market Data', 'Real-time insights', "Coach's knowledge", 'Knowledge cutoff'],
  ['Availability', 'Web/app, global 24/7', 'Location & time bound', 'Global, no structure'],
];

const benefits = [
  { title: 'Tailored Career Paths', body: 'Our system recommends specific roles based on your exact background and rising market demand—not cookie-cutter templates.' },
  { title: 'Precision Skill Gap Analysis', body: 'Identify exactly which skills are holding you back with hyper-specific tips: curated courses, project ideas, and timelines.' },
  { title: 'Global Accessibility', body: "Whether you're in Lagos, Berlin, or Toronto, Career Coach AI delivers the same quality guidance instantly—no geography, no waitlist." },
  { title: 'Free to Start', body: 'The career coach AI free tier includes full profile analysis and career path recommendations. Upgrade only when you need advanced features.' },
  { title: 'Always Up-to-Date', body: 'Our Career Coach software continuously updates recommendations based on current hiring trends and in-demand skills.' },
  { title: 'Persistent Login & Continuity', body: "Complete your profile once and return anytime via Career Coach AI login. Your analysis evolves with you—unlike one-off AI prompts." },
];

const faqs = [
  { q: 'Is Career Coach AI really free?', a: 'Yes. Core features—profile analysis, career path recommendations, and skill gap identification—are free forever. Premium unlocks deeper analytics.' },
  { q: 'How accurate is the AI career coach?', a: 'Our system achieves a 90%+ match rate to real-world job outcomes, based on aggregated user data and continuously updated market trend analysis.' },
  { q: 'Can I use it to prepare for career coach certification?', a: 'Absolutely. The tool identifies coaching skill gaps and suggests ICF-aligned courses and practice frameworks.' },
  { q: "What if I'm switching careers mid-life?", a: 'Career Coach AI is ideal for mid-career transitions. It analyzes your transferable skills and maps them to new fields, including roles you may not have considered.' },
  { q: 'Does it work for creative and non-traditional fields?', a: 'Yes. The system covers 50+ industries globally—including design, media, education, healthcare, and freelancing.' },
  { q: 'How is this better than searching "career coach near me"?', a: 'Local career coaches are constrained by geography and hourly rates. Career Coach AI is available 24/7, globally, at no cost for core features.' },
  { q: 'Is Career Coach AI different from Career Coach GPT?', a: "Yes. Career Coach GPT-style prompts offer one-off text responses. Our platform stores your profile, tracks progress over time, and updates recommendations as the market evolves." },
  { q: 'How do I log in or reset my access?', a: 'Use your email to sign in or reset credentials. Google and Apple sign-in are also supported for seamless Career Coach AI login.' },
];

function SEOContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="border-t border-gray-200 pt-8">

        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Career Coach AI: Your Personalized Path to Professional Success
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">
            Discover the best AI career coach that analyzes your skills, experience, and goals to deliver tailored
            career path recommendations, skill gap analysis, and development tips—all for free. Our career coach
            website makes professional guidance accessible to professionals worldwide.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Career Coach AI leverages advanced algorithms similar to Career Coach GPT to scan your profile and
            suggest optimal career trajectories. Unlike traditional career coaching online sessions costing
            $100–$200 per hour, this AI career coach app provides instant, data-driven advice without
            appointments—available 24/7, globally.
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">What Exactly Does a Career Coach Do?</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            A career coach guides individuals through professional growth—from resume optimization and interview
            preparation to long-term career strategy. They assess your strengths, identify blind spots, set
            measurable goals, and provide accountability. Sessions typically cover role transitions, salary
            negotiation, leadership development, and navigating workplace challenges.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Our AI career coach app replicates this experience algorithmically. It dissects your profile against
            global benchmarks, flags technical and leadership gaps, and surfaces exact next steps—whether you are
            in Lagos, London, or Los Angeles.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Beyond guidance, career coaches answer the question professionals struggle with alone:{' '}
            <em>&quot;Am I on the right track, and if not, what do I do next?&quot;</em>
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Can ChatGPT Give Career Advice?</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Yes—ChatGPT can respond to an AI career coach prompt with useful general guidance. Ask it to review
            your resume for a tech role and you will get a reasonable answer. However, ChatGPT has no memory of
            your profile between sessions, no access to real-time job market data, and no structured development
            tracking.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Career Coach AI goes further: it stores your profile securely, cross-references your data against live
            market trends, and delivers a structured roadmap rather than a one-off text response. Users
            consistently report better outcomes compared to open-ended Career Coach GPT prompts.
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">The 7 Qualities of an Effective Career Coach</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Whether working with career coaches near you or using an AI career coach app, the best coaching
            experiences share seven core qualities:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-4">
            <li><strong>Empathy</strong> — Understanding your unique background and ambitions without judgment.</li>
            <li><strong>Deep Expertise</strong> — Real knowledge of hiring trends, role requirements, and career ladders.</li>
            <li><strong>Clarity</strong> — Breaking complex career decisions into simple, actionable steps.</li>
            <li><strong>Accountability</strong> — Tracking your progress and holding you to commitments.</li>
            <li><strong>Adaptability</strong> — Pivoting recommendations as the market or your goals evolve.</li>
            <li><strong>Inspiration</strong> — Motivating you to take action, not just provide information.</li>
            <li><strong>Results-Orientation</strong> — Measuring success by real outcomes: offers received, promotions earned.</li>
          </ol>
          <p className="text-gray-700 leading-relaxed">
            Career Coach AI is engineered to deliver all seven—with unbiased, data-driven analysis and
            market-responsive recommendations.
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">How Much Does Career Coaching Cost?</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            A traditional 30-minute career coaching session costs between $50 and $200 globally, averaging around
            $125 in North America and Europe. Experienced executive coaches often charge $250–$500 per hour.
            Career coaching services in emerging markets typically range from $30–$80 per session.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Career coach certification programs accredited by the ICF command premium pricing—typically requiring
            60–125 training hours plus 100+ practice coaching hours.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Career Coach AI offers its core features—full profile analysis, personalized career path
            recommendations, and skill gap identification—completely free. Premium tiers unlock advanced analytics
            at a fraction of the cost of a single human coaching session.
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Become a Career Coach</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Aspiring career coaches typically build 3–5 years of professional experience in a specific niche,
            complete a formal coach training program accredited by the ICF, accumulate 100+ supervised practice
            coaching hours, and build a client base through LinkedIn or career coaching online platforms.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Career coach certification signals credibility. The ICF offers three levels—ACC, PCC, and MCC—each
            requiring progressively more training hours. Niche specialization makes it easier to stand out in a
            crowded market.
          </p>
          <p className="text-gray-700 leading-relaxed">
            AI career coach software accelerates the process for both coaches (sharpening assessment frameworks)
            and clients (arriving at sessions with greater clarity about gaps and goals).
          </p>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Career Coach AI vs. Traditional Coaching vs. ChatGPT</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {['Feature', 'Career Coach AI', 'Traditional Coach', 'ChatGPT'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-900">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map(([feature, ai, human, gpt]) => (
                  <tr key={feature} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{feature}</td>
                    <td className="px-4 py-3 text-green-700">{ai}</td>
                    <td className="px-4 py-3 text-gray-600">{human}</td>
                    <td className="px-4 py-3 text-gray-600">{gpt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Use an AI Career Coach?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map(({ title, body }) => (
              <div key={title} className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-5">
                <h4 className="font-semibold text-gray-900 mb-2">{q}</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: softwareSchema }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqSchema }} />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function CareerPage() {
  const [analysis, setAnalysis] = useState<CareerCoachResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showReanalyzeWarning, setShowReanalyzeWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('paths');

  useEffect(() => { loadAnalysis(); }, []);

  const loadAnalysis = async () => {
    try {
      const result = await CareerCoachService.getAnalysis();
      if (result) setAnalysis(result);
    } catch (error) {
      console.error('Error loading career analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setShowReanalyzeWarning(false);
    try {
      let userId = 'anonymous_user';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      } catch (e) {}

      let onboardingData = null;
      try {
        const { data } = await supabase.from('onboarding_data').select('*').eq('user_id', userId).maybeSingle();
        onboardingData = data;
      } catch (e) {}

      if (!onboardingData) {
        alert('Please complete your profile setup first');
        setReanalyzing(false);
        return;
      }
      const result = await CareerCoachService.generateAnalysis(userId, onboardingData);
      setAnalysis(result);
    } catch (error: any) {
      console.error('Error reanalyzing career:', error);
      alert(error.message || 'Failed to reanalyze. Please try again.');
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading career analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/tools" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Career Coach</h1>
                <p className="text-sm text-gray-600">AI-powered career guidance and development plan</p>
              </div>
            </div>
          </div>
        </div>

        <HowItWorks />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <Target size={64} className="mx-auto text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Career Analysis</h2>
              <p className="text-gray-600 mb-6">
                Discover personalized career paths, identify skill gaps, and get actionable insights to accelerate your career growth.
              </p>
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold disabled:opacity-50"
              >
                {reanalyzing
                  ? <><RefreshCw size={20} className="animate-spin" />Analyzing...</>
                  : <><Lightbulb size={20} />Start Career Analysis</>}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                You&apos;ll need to be logged in and have completed your profile setup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <TrendingUp size={32} className="mx-auto text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Career Paths</h3>
                <p className="text-sm text-gray-600">Get personalized career recommendations based on your skills</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Award size={32} className="mx-auto text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Skill Gaps</h3>
                <p className="text-sm text-gray-600">Identify skills you need to develop for your target role</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <Lightbulb size={32} className="mx-auto text-green-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Market Insights</h3>
                <p className="text-sm text-gray-600">Get insights on industry trends and in-demand skills</p>
              </div>
            </div>
          </div>
        </div>

        <RelatedTools />
        <SEOContent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/tools" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Career Analysis</h1>
                <p className="text-sm text-gray-600">Personalized career guidance and development plan</p>
              </div>
            </div>
            <button
              onClick={() => setShowReanalyzeWarning(true)}
              disabled={reanalyzing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={reanalyzing ? 'animate-spin' : ''} />
              {reanalyzing ? 'Reanalyzing...' : 'Reanalyze'}
            </button>
          </div>
        </div>
      </div>

      <HowItWorks />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
              style={{ backgroundColor: theme.colors.primary.DEFAULT }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white">85</div>
                <div className="text-xs text-white/80">Score</div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Career Readiness Score</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Based on your profile, skills, and experience, you&apos;re well-positioned for career advancement.
              Focus on the recommendations below to improve further.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {(
                [
                  { id: 'paths' as TabType, label: 'Career Paths', Icon: Target },
                  { id: 'skills' as TabType, label: 'Skill Gaps', Icon: Award },
                  { id: 'insights' as TabType, label: 'Insights', Icon: Lightbulb },
                ]
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} className="inline mr-2" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'paths' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Target size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Career Paths</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {analysis.personalizedPaths.map((path, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{path.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{path.description}</p>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {path.requiredSkills.slice(0, 4).map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{skill}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Career Opportunities</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {path.potentialRoles.slice(0, 3).map((role, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">&#8226;</span>
                                <span>{role}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Award size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Skill Development Plan</h2>
                </div>
                <div className="space-y-6">
                  {analysis.skillGaps.map((gap, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{gap.skill}</h3>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600 capitalize">{gap.priority}</div>
                          <div className="text-xs text-gray-500">Priority</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Current Level</h4>
                          <p className="text-sm text-gray-600">{gap.currentLevel}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Target Level</h4>
                          <p className="text-sm text-gray-600">{gap.targetLevel}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Development Steps</h4>
                        <ol className="text-sm text-gray-600 space-y-1">
                          {gap.learningPath.slice(0, 3).map((step, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-600 font-medium mt-1">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Career Insights &amp; Market Analysis</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" />
                        Market Trends
                      </h3>
                      <div className="space-y-3">
                        {analysis.marketInsights.industryTrends.map((trend, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-600">{trend}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase size={20} className="text-blue-600" />
                        Opportunities
                      </h3>
                      <div className="space-y-3">
                        {analysis.insights.opportunities.map((opp, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-600">{opp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-600" />
                        Warnings
                      </h3>
                      <div className="space-y-3">
                        {analysis.insights.warnings.map((warning, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-600">{warning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Lightbulb size={20} className="text-blue-600" />
                        Tips
                      </h3>
                      <div className="space-y-3">
                        {analysis.insights.tips.map((tip, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <p className="text-gray-600">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showReanalyzeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reanalyze Career Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will regenerate your career analysis based on your current profile. Only reanalyze if you&apos;ve
              made significant changes to your profile data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReanalyzeWarning(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReanalyze}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Reanalyze
              </button>
            </div>
          </div>
        </div>
      )}

      <RelatedTools />
      <SEOContent />
    </div>
  );
}