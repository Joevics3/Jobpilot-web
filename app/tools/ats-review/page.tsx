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
                href="/tools"
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

      {/* SEO Content - Hidden by accordion */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t border-gray-200 pt-8">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-semibold text-gray-900">Learn More About ATS CV Review</h2>
            <ChevronDown
              size={20}
              className={`text-gray-500 transition-transform ${seoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {seoExpanded && (
            <div className="mt-6 space-y-6 text-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">What is ATS?</h3>
                <p className="mb-4">
                  ATS (Applicant Tracking System) is software used by employers to manage their recruitment process. Most companies in Nigeria and globally use ATS to filter through hundreds or thousands of applications, making it crucial to optimize your CV for these systems.
                </p>
                <p>
                  Our ATS CV Review tool analyzes your resume against common ATS algorithms and provides actionable feedback to improve your chances of getting past the initial screening.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">How Our ATS Review Works</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Upload your CV or paste the content</li>
                  <li>Select a target job (optional but recommended)</li>
                  <li>Our AI analyzes your CV for ATS compatibility</li>
                  <li>Receive a detailed score and improvement suggestions</li>
                  <li>Implement the feedback to improve your CV</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Key ATS Factors We Check</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Keyword optimization for the job description</li>
                  <li>Skills matching with job requirements</li>
                  <li>Work experience relevance</li>
                  <li>Education qualifications alignment</li>
                  <li>CV formatting compatibility</li>
                  <li>Industry-specific terminology</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tips to Pass ATS</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Use standard section headings (Experience, Education, Skills)</li>
                  <li>Include keywords from the job description</li>
                  <li>Avoid tables, graphics, and images</li>
                  <li>Use standard file formats (PDF or Word)</li>
                  <li>Don't stuff keywords - use them naturally</li>
                  <li>Match your job titles to the job posting</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Common ATS Mistakes to Avoid</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Using headers and footers (ATS can't read them)</li>
                  <li>Including special characters or icons</li>
                  <li>Using multiple columns (most ATS can't read them)</li>
                  <li>Submitting in the wrong file format</li>
                  <li>Using acronyms that aren't commonly known</li>
                  <li>Leaving out important keywords</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Why ATS Matters in Nigeria</h3>
                <p className="mb-4">
                  With the increasing number of job applications in Nigeria, most employers now rely on ATS to handle the volume. Understanding how ATS works can significantly improve your chances of landing interviews, especially with multinational companies and top Nigerian employers.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Get Started</h3>
                <p>
                  Use our free ATS CV Review tool today to ensure your resume passes the ATS screening and gets noticed by recruiters. Upload your CV now and start optimizing for success.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ATS CV Review",
              "description": "Free ATS CV Review tool. Optimize your resume for Applicant Tracking Systems and improve your chances of getting hired.",
              "url": "https://jobmeter.com/tools/ats-review",
              "applicationCategory": "Career",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" }
            })
          }}
        />
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
