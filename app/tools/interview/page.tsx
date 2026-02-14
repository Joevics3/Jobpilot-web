'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MessageCircle, FileCheck, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { InterviewPrepService, InterviewSession } from '@/lib/services/interviewPrepService';
import InterviewPrepModal from '@/components/tools/InterviewPrepModal';

export default function InterviewPage() {
  const router = useRouter();
  const [sessionHistory, setSessionHistory] = useState<InterviewSession[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = () => {
    try {
      const history = InterviewPrepService.getHistory();
      // Ensure all sessions have a chat array (migration for old sessions)
      const cleanedHistory = history.map(session => ({
        ...session,
        chat: session.chat || [],
      }));
      setSessionHistory(cleanedHistory);
    } catch (error) {
      console.error('Error loading session history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
            <button
              onClick={() => setModalOpen(true)}
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Sessions</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessionHistory.map((session) => {
                const chat = session.chat || [];
                const totalQuestions = chat.filter(m => m.type === 'question').length;
                const completedAnswers = chat.filter(m => m.type === 'answer').length;
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
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
            >
              <Plus size={20} />
              Start Your First Session
            </button>
          </div>
        )}
      </div>

      {/* Interview Prep Modal */}
      <InterviewPrepModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          loadSessionHistory();
        }}
      />

      {/* SEO Content - Hidden by accordion */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t border-gray-200 pt-8">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <h2 className="text-lg font-semibold text-gray-900">Learn More About Interview Practice</h2>
            <ChevronDown
              size={20}
              className={`text-gray-500 transition-transform ${seoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {seoExpanded && (
            <div className="mt-6 space-y-6 text-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Interview Practice in Nigeria</h3>
                <p className="mb-4">
                  Prepare for your dream job with our AI-powered interview practice tool. Whether you're applying to top companies in Lagos, Abuja, or seeking remote positions, our platform helps you practice with realistic interview questions tailored to your target role.
                </p>
                <p>
                  Our AI interviewer asks relevant questions based on the job description you provide, evaluates your answers in real-time, and gives you constructive feedback to improve your responses. This is especially valuable for fresh graduates and experienced professionals alike.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">How It Works</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Select a job from our database or paste a job description</li>
                  <li>Optionally upload your CV for personalized questions</li>
                  <li>Practice answering interview questions</li>
                  <li>Get instant AI feedback on your answers</li>
                  <li>Review your performance and improve</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Why Practice Interviews?</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Reduce interview anxiety by practicing beforehand</li>
                  <li>Get familiar with common interview questions in your industry</li>
                  <li>Improve your communication skills</li>
                  <li>Receive personalized feedback to strengthen your answers</li>
                  <li>Build confidence before the real interview</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Tips for Successful Interviews</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Research the company thoroughly before the interview</li>
                  <li>Practice answering common questions out loud</li>
                  <li>Use the STAR method for behavioral questions</li>
                  <li>Prepare questions to ask the interviewer</li>
                  <li>Dress professionally and test your technology (for virtual interviews)</li>
                  <li>Get enough rest the night before</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Common Interview Questions in Nigeria</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Tell me about yourself</li>
                  <li>What are your strengths and weaknesses?</li>
                  <li>Why do you want to work for this company?</li>
                  <li>Where do you see yourself in 5 years?</li>
                  <li>Why should we hire you?</li>
                  <li>Do you have any questions for us?</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Virtual Interview Tips</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Test your internet connection and camera beforehand</li>
                  <li>Choose a quiet, well-lit location</li>
                  <li>Have a backup plan for technical issues</li>
                  <li>Look at the camera when speaking</li>
                  <li>Have your CV and notes nearby</li>
                  <li>Close unnecessary applications on your computer</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Interview Practice for Specific Roles</h3>
                <p className="mb-4">
                  Our AI adapts to various job roles and industries. Practice for positions in Technology, Finance, Marketing, Healthcare, Education, and more. Each industry has its unique interview style and question types.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Success Stories</h3>
                <p className="mb-4">
                  Many job seekers in Nigeria have improved their interview performance using our platform. Practice regularly, implement the feedback, and increase your chances of landing your desired job.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Get Started Today</h3>
                <p>
                  Don't let interview anxiety hold you back. Start practicing now and build the confidence you need to ace your next interview. With JobMeter's interview practice tool, you're one step closer to your dream job.
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
              "name": "Interview Practice",
              "description": "AI-powered interview practice tool. Practice with personalized questions and get instant feedback to ace your next interview.",
              "url": "https://jobmeter.com/tools/interview",
              "applicationCategory": "Career",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" }
            })
          }}
        />
      </div>
    </div>
  );
}