'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, FileCheck, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import ATSReviewModal from '@/components/tools/ATSReviewModal';
import BannerAd from '@/components/ads/BannerAd';

export default function ATSReviewPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<any[]>([]);

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
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // amber
    return '#EF4444'; // red
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              New Review
            </button>
          </div>
        </div>
      </div>

      {/* Banner Ad - Below Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BannerAd />
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
    </div>
  );
}
