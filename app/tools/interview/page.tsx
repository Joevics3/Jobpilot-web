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

  // Load session history
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
                href="/career-tools"
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
          loadSessionHistory(); // Reload history after modal closes
        }}
      />

      {/* SEO Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-xl font-bold text-gray-900">Learn More About Interview Practice</h2>
            <ChevronDown
              size={24}
              className={`text-gray-500 transition-transform duration-200 ${seoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {seoExpanded && (
            <div className="px-6 pb-6 pt-0">
              <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                <p>
                  Welcome to JobMeter's AI-powered Interview Practice tool, designed specifically to help Nigerian job seekers master the art of interviewing. Whether you're a fresh graduate preparing for your first corporate interview or a seasoned professional looking to switch careers, our platform provides personalized practice sessions that simulate real interview scenarios.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Why Interview Practice Matters</h3>
                <p>
                  Studies show that candidates who practice interviews regularly have a 60% higher success rate compared to those who don't prepare. In Nigeria's competitive job market, where positions often receive hundreds of applications, standing out during the interview phase is crucial. Our AI-powered interview practice tool helps you build confidence, refine your answers, and develop the communication skills that recruiters look for.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">How Our Interview Practice Works</h3>
                <p>
                  Our platform uses advanced artificial intelligence to analyze your CV or target job description and generate personalized interview questions specific to your industry and role. Simply upload your CV or paste a job description, and our system will create a tailored interview experience. You'll answer questions in a mock interview format, and receive instant feedback on your responses, tone, and delivery.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Key Features of Our Interview Practice Tool</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Personalized Questions:</strong> Questions are generated based on your CV and the specific job you're targeting</li>
                  <li><strong>Industry-Specific Content:</strong> Our AI understands different industries and roles in the Nigerian job market</li>
                  <li><strong>Instant Feedback:</strong> Get detailed analysis of your answers with suggestions for improvement</li>
                  <li><strong>Multiple Practice Sessions:</strong> Create unlimited practice sessions for different job applications</li>
                  <li><strong>Progress Tracking:</strong> Monitor your improvement over time with session history</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900">Tips for Acing Your Next Interview</h3>
                <p>
                  Beyond using our practice tool, here are essential tips for Nigerian job seekers: Research the company thoroughly before your interview, understand the role requirements, prepare STAR method answers for behavioral questions, dress appropriately for the company culture, arrive on time (or join virtual interviews early), and prepare thoughtful questions to ask the interviewer. Remember, first impressions matter, so be professional, maintain good eye contact, and showcase your enthusiasm for the role.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Common Interview Questions in Nigeria</h3>
                <p>
                  Based on our analysis of successful interviews in Nigeria, some common questions include: "Tell me about yourself," "Why do you want to work for this company," "What are your strengths and weaknesses," "Where do you see yourself in five years," "Why should we hire you," and role-specific technical questions. Our practice tool covers all these categories and more, helping you craft compelling answers that highlight your unique value proposition.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Virtual Interview Tips</h3>
                <p>
                  With the rise of remote work and virtual interviews, it's essential to prepare for video calls. Ensure you have a stable internet connection, test your camera and microphone beforehand, choose a quiet and well-lit location, dress professionally from head to toe, look at the camera when speaking, and have your CV and notes handy. Our practice tool can simulate virtual interview scenarios to help you adapt to this format.
                </p>

                <p>
                  Start using JobMeter's Interview Practice tool today and transform your interview performance. With consistent practice, you'll enter every interview room with confidence, prepared to make a lasting impression on your potential employers.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

