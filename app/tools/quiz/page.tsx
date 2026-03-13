"use client";
// 📁 app/tools/quiz/page.tsx

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { quizSupabase } from '@/lib/quizSupabase';
import { getCached, setCached, clearCacheKey, checkCacheVersion, CACHE_KEYS } from '@/lib/quizCache';
import { theme } from '@/lib/theme';

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is an aptitude test for interview?", "acceptedAnswer": { "@type": "Answer", "text": "An aptitude test for interview is a timed, standardized assessment used by employers to measure a candidate's numerical, verbal, logical reasoning, and situational judgment skills. Used by over 90% of top-tier employers including KPMG, Deloitte, PwC, EY, Google, and Amazon during graduate and recruitment screening." } },
    { "@type": "Question", "name": "How do I access KPMG aptitude test practice?", "acceptedAnswer": { "@type": "Answer", "text": "Select KPMG from the company list on our Quiz Platform to access 20 multiple-choice questions styled around the KPMG graduate program test, plus 5 AI-graded theory essays. Our KPMG profile covers numerical, verbal, and situational judgment content for global and Nigeria-specific recruitment." } },
    { "@type": "Question", "name": "Where can I find Deloitte aptitude test questions and answers PDF?", "acceptedAnswer": { "@type": "Answer", "text": "Our platform provides structured Deloitte aptitude test practice equivalent to a Deloitte aptitude test questions and answers PDF, with detailed answer explanations. Premium members can download practice packs for offline use covering all core Deloitte aptitude question types." } },
    { "@type": "Question", "name": "What does PwC aptitude test practice include?", "acceptedAnswer": { "@type": "Answer", "text": "Our PwC aptitude test practice includes numerical reasoning, verbal reasoning, and PwC technical assessment essay questions. Answers are AI-graded against clarity, structure, and insight criteria." } },
    { "@type": "Question", "name": "Does the platform cover companies beyond the Big 4?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Beyond KPMG, Deloitte, PwC, and EY, the platform covers 100+ companies including Accenture, Google, Amazon, Goldman Sachs, JP Morgan, Unilever, Nestlé, Siemens, IBM, TCS, Infosys, Shell, and more." } },
    { "@type": "Question", "name": "Why is a password required for theory tests?", "acceptedAnswer": { "@type": "Answer", "text": "The password requirement mirrors the secure, proctored environment of real recruitment theory tests used by firms like Deloitte and PwC." } },
    { "@type": "Question", "name": "How many questions are in each aptitude test?", "acceptedAnswer": { "@type": "Answer", "text": "Every test includes 20 objective multiple-choice questions and 5 theory essay questions. Objective tests are timed to match real employer conditions. Essays are AI-graded with immediate, structured feedback." } },
    { "@type": "Question", "name": "Is the platform suitable for international candidates?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. The platform is built for global use covering candidates in the US, UK, Canada, EU, Nigeria, India, Middle East, and Asia-Pacific." } }
  ]
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Quiz Platform — Aptitude Test Practice",
  "description": "Practice aptitude tests from top companies worldwide. Timed mock tests for KPMG, Deloitte, PwC, EY, Google, Amazon, Goldman Sachs, JP Morgan, Accenture, and 100+ other employers.",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "audience": { "@type": "Audience", "audienceType": "Graduate trainees, job seekers, recruitment candidates" }
};

export default function QuizPage() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    checkCacheVersion(); // wipes stale cache if CACHE_VERSION was bumped in quizCache.ts
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    // 1. Try cache first
    const cached = getCached<string[]>(CACHE_KEYS.companies);
    if (cached && cached.length > 0) {
      setCompanies(cached);
      setFromCache(true);
      setLoading(false);
      return;
    }

    // 2. Fetch from Supabase
    // Use quiz_companies table for a clean distinct list — avoids the PostgREST
    // default 1,000-row limit that would otherwise truncate objective_questions.
    try {
      // Calls a Supabase RPC that runs SELECT DISTINCT on the DB side —
      // returns only unique company names, no duplicate rows transferred.
      const { data, error } = await quizSupabase.rpc('get_distinct_companies');

      if (error) throw error;

      const uniqueCompanies = (data?.map((r: { company: string }) => r.company) || []);
      setCompanies(uniqueCompanies);

      // 3. Save to cache
      setCached(CACHE_KEYS.companies, uniqueCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    clearCacheKey(CACHE_KEYS.companies);
    setLoading(true);
    setFromCache(false);
    fetchCompanies();
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />

      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <div className="pt-12 pb-10 px-6" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: theme.colors.text.light }}>
              Quiz Platform
            </h1>
            <p className="text-lg" style={{ color: theme.colors.text.light }}>
              Practice aptitude tests from top companies
            </p>
          </div>
        </div>

        <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
          {/* How it works */}
          <div className="bg-white rounded-xl p-4 mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
              <div><strong>Objective:</strong> 20 or 50 multiple choice</div>
              <div><strong>Theory:</strong> 5 essay, AI graded</div>
              <div><strong>Premium:</strong> Password required for 50q &amp; theory</div>
            </div>
          </div>

          {/* Company list header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Select a Company</h2>
            {fromCache && (
              <button
                onClick={handleRefresh}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
              >
                Refresh list
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" size={32} style={{ color: theme.colors.primary.DEFAULT }} />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {companies.map((company) => (
                <Link
                  key={company}
                  href={`/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}`}
                  className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all text-center"
                  style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
                >
                  <span className="font-medium text-gray-900 text-sm">{company}</span>
                </Link>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-6">
            <b>Disclaimer:</b> These are original practice questions designed to reflect the style
            and difficulty of each company's assessment. JobMeter has no affiliation with any of
            the organisations listed here.
          </p>
        </div>

        {/* Related Tools */}
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'CV Keyword Checker', description: 'Check keyword match between your CV and job descriptions', color: '#10B981', route: '/tools/keyword-checker' },
                { title: 'ATS CV Review', description: 'Optimize your CV for ATS systems before applying', color: '#8B5CF6', route: '/tools/ats-review' },
                { title: 'Career Coach', description: 'Get personalized career guidance and advice', color: '#F59E0B', route: '/tools/career' },
                { title: 'Role Finder', description: 'Discover new career paths based on your skills', color: '#06B6D4', route: '/tools/role-finder' },
                { title: 'Job Scam Detector', description: 'AI-powered analysis to detect fraudulent job postings', color: '#EF4444', route: '/tools/scam-detector' },
              ].map((tool) => (
                <a key={tool.title} href={tool.route} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tool.color + '1A' }}>
                    <span className="text-lg font-bold" style={{ color: tool.color }}>→</span>
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

        {/* SEO Content */}
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
            <div className="prose prose-sm max-w-none text-gray-600">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recruitment Assessment Practice Tests: Ace Aptitude Tests from Top Companies Worldwide</h2>
              <p className="mb-6">Practice <strong>aptitude tests from top companies</strong> on our Quiz Platform — the global resource for graduate trainees and job seekers preparing for recruitment assessments at the Big 4, Fortune 500s, multinationals, and public agencies across the US, UK, Canada, EU, and beyond.</p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Why Aptitude Test Practice Matters</h3>
              <p className="mb-6">Aptitude tests are now standard in graduate recruitment. Rejection rates at top firms can reach 50–80% at the screening stage — consistent, targeted <strong>aptitude test practice</strong> is the single most effective way to improve your odds.</p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">KPMG Aptitude Test Practice</h3>
              <p className="mb-4">Prepare for the <strong>KPMG graduate trainee aptitude test</strong> with our KPMG profile. Tests cover numerical reasoning, verbal reasoning, and situational judgment formatted to mirror the KPMG graduate program test.</p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Deloitte Aptitude Test Practice</h3>
              <p className="mb-4">Our Deloitte profile covers numerical reasoning, logical puzzles, data interpretation, and abstract series — mirroring the <strong>Deloitte graduate recruitment test</strong> format used across the US, UK, and EU.</p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">PwC Aptitude Test Practice</h3>
              <p className="mb-4">Prepare for the <strong>PwC aptitude test</strong> with numerical reasoning, verbal reasoning, and the firm's distinctive <strong>PwC technical assessment</strong> component in both timed multiple-choice and AI-graded essay formats.</p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">EY, Accenture & Other Top Employers</h3>
              <p className="mb-6">Beyond the Big 4, our platform covers 100+ companies including Accenture, Google, Amazon, Goldman Sachs, JP Morgan, Unilever, Nestlé, Siemens, IBM, TCS, Infosys, Wipro, McKinsey, BCG, Shell, ExxonMobil, HSBC, Barclays, and many more.</p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-3">Preparation Tips</h3>
              <p className="mb-2"><strong>Practice daily.</strong> Dedicate 1–2 hours per day in the two to three weeks before your test.</p>
              <p className="mb-2"><strong>Time yourself from day one.</strong> Working slowly on untimed practice builds false confidence.</p>
              <p className="mb-2"><strong>Review every error.</strong> Use our AI feedback to understand why alternative options are wrong.</p>
              <p className="mb-6"><strong>Simulate full assessments.</strong> Complete both objective and theory sections together to build real stamina.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}