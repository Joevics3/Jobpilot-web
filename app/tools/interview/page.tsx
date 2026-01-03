'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MessageCircle, FileCheck, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { InterviewPrepService, InterviewSession } from '@/lib/services/interviewPrepService';
import BannerAd from '@/components/ads/BannerAd';

export default function InterviewPage() {
  const router = useRouter();
  const [sessionHistory, setSessionHistory] = useState<InterviewSession[]>([]);

  // Load session history
  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = () => {
    try {
      const history = InterviewPrepService.getHistory();
      setSessionHistory(history);
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
                <h1 className="text-2xl font-bold text-gray-900">Interview Practice</h1>
                <p className="text-sm text-gray-600">
                  Practice interviews with AI-powered questions and feedback
                </p>
              </div>
            </div>
            <Link
              href="/tools"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              New Practice Session
            </Link>
          </div>
        </div>
      </div>

      {/* Banner Ad - Below Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BannerAd />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sessionHistory.length > 0 ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sessions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessionHistory.map((session) => {
                const totalQuestions = session.chat.filter(m => m.type === 'question').length;
                const completedAnswers = session.chat.filter(m => m.type === 'answer').length;
                const progressPercent = totalQuestions > 0 ? (completedAnswers / totalQuestions) * 100 : 0;

                return (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/tools/interview/${session.id}`)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <MessageCircle size={24} className="text-green-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {session.jobTitle || 'Interview Practice'}
                          </h3>
                          <span className="text-sm text-gray-600">
                            {session.cvUsed ? 'With CV' : 'Job Only'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {completedAnswers}/{totalQuestions}
                        </div>
                        <div className="text-xs text-gray-500">Questions</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(session.timestamp)}</span>
                      </div>
                    </div>

                    {session.jobCompany && (
                      <p className="text-sm text-gray-600 mt-2">
                        <strong>Company:</strong> {session.jobCompany}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {session.completed ? 'Completed' : 'In Progress'}
                        </span>
                        <TrendingUp size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Practice Sessions Yet</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start your first interview practice session to get personalized questions and AI-powered feedback.
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              <Plus size={20} />
              Start Your First Session
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}

