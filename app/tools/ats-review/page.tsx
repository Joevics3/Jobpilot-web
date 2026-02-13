'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileCheck, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import ATSReviewModal from '@/components/tools/ATSReviewModal';

export default function ATSReviewPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);
  const [seoExpanded, setSeoExpanded] = useState(false);

  // Load session history
  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = () => {
    try {
      const history = localStorage.getItem('ats_cv_review_history');
      if (history) {
        const sessions = JSON.parse(history);
        setSessionHistory(sessions);
      }
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    // Reload history after modal closes (in case a new review was created)
    setTimeout(() => loadSessionHistory(), 100);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.match.good;
    if (score >= 60) return theme.colors.match.average;
    return theme.colors.match.bad;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/career-tools"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ATS CV Review</h1>
                <p className="text-sm text-gray-600">
                  Check the Suitability of your CV for a Role
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessionHistory.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessionHistory.map((session) => {
                const date = new Date(session.timestamp);
                const scoreColor = getScoreColor(session.overallScore);

                return (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/tools/ats-review/${session.id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileCheck size={24} className="text-green-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {session.cvName}
                            </h3>
                            <span className="text-sm text-gray-600">
                              {session.reviewType === 'cv-job' ? 'Job-Specific Review' : 'General ATS Review'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-3xl font-bold"
                            style={{ color: scoreColor }}
                          >
                            {session.overallScore}%
                          </div>
                          <div className="text-xs text-gray-500">ATS Score</div>
                        </div>
                      </div>
                        {session.jobTitle && (
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Job:</strong> {session.jobTitle}
                            {session.jobCompany && ` at ${session.jobCompany}`}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{date.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <FileCheck size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Reviews Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start your first ATS CV review to optimize your resume for better job matching and ATS compatibility.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              <Plus size={20} />
              Start Your First Review
            </button>
          </div>
        )}
      </div>

      {/* ATS Review Modal */}
      <ATSReviewModal
        isOpen={showModal}
        onClose={handleModalClose}
      />

      {/* SEO Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-xl font-bold text-gray-900">Learn More About ATS CV Review</h2>
            <ChevronDown
              size={24}
              className={`text-gray-500 transition-transform duration-200 ${seoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {seoExpanded && (
            <div className="px-6 pb-6 pt-0">
              <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                <p>
                  Welcome to JobMeter's ATS CV Review tool, your comprehensive solution for optimizing resumes for Applicant Tracking Systems and maximizing your chances of landing interviews in Nigeria's competitive job market. Many qualified candidates get filtered out simply because their CVs aren't properly optimized for ATS software used by recruiters.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">What is ATS and Why Does It Matter?</h3>
                <p>
                  Applicant Tracking Systems (ATS) are software applications used by employers to manage their recruitment process electronically. These systems scan CVs for keywords, qualifications, and experience matching the job requirements before a human recruiter ever sees them. In Nigeria, over 80% of large companies and multinational corporations use ATS to screen candidates, making it essential to optimize your CV for these systems.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">How Our ATS CV Review Tool Works</h3>
                <p>
                  Our AI-powered ATS review tool analyzes your CV against specific job descriptions or general industry standards. Simply upload your CV and optionally provide a job description you're targeting. Our system evaluates multiple factors including keyword density, formatting compatibility, section organization, and overall ATS readability score. You'll receive a detailed report with specific recommendations to improve your CV's performance.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Key Features of Our ATS CV Review</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Keyword Analysis:</strong> Identifies missing keywords from job descriptions and suggests improvements</li>
                  <li><strong>Format Compatibility:</strong> Checks if your CV format is ATS-friendly (no tables, graphics, or complex layouts)</li>
                  <li><strong>Section Optimization:</strong> Ensures all essential sections are properly structured and complete</li>
                  <li><strong>Score Prediction:</strong> Provides an ATS compatibility score to gauge your CV's effectiveness</li>
                  <li><strong>Job-Specific Review:</strong> Compare your CV against specific job postings for targeted optimization</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900">Common ATS Mistakes to Avoid</h3>
                <p>
                  Many Nigerian job seekers make critical errors that cause their CVs to be rejected by ATS. These include using tables and columns that ATS cannot read, including images or graphics that are not parseable, using headers and footers for important information, submitting PDF when DOC format is preferred, using creative fonts instead of standard fonts, and lacking relevant keywords. Our tool helps you identify and fix all these issues.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">How to Optimize Your CV for ATS</h3>
                <p>
                  To improve your ATS score, start by analyzing the job description and identifying key skills and requirements. Incorporate these keywords naturally throughout your CV, especially in the skills and experience sections. Use standard section headings like "Work Experience," "Education," and "Skills" to help ATS categorize your information. Save your CV in the format requested by the employer, typically Microsoft Word (.doc or .docx) for better compatibility. Keep your CV length reasonable (1-2 pages) and avoid complex formatting.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Understanding ATS Scoring</h3>
                <p>
                  ATS scoring typically ranges from 0-100%, with scores above 80% considered good. The score is calculated based on various factors including keyword matches, format compatibility, section completeness, and relevance to the job. Different ATS systems weigh these factors differently, but our tool provides a comprehensive analysis that covers the most common ATS platforms used in Nigeria including Taleo, Workday, Greenhouse, and Lever.
                </p>

                <p>
                  Use JobMeter's ATS CV Review tool today to ensure your resume passes the initial screening and reaches the hands of hiring managers. With our comprehensive analysis and actionable recommendations, you'll be one step closer to landing your dream job.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
