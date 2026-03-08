"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Send } from 'lucide-react';

interface TheoryQuestion {
  id: string;
  company: string;
  section: string;
  question_text: string;
  grading_prompt: string;
  difficulty: string;
}

interface GradingResult {
  score: number;
  passed: boolean;
  feedback: string;
}

export default function TheoryQuizClient({ company }: { company: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<TheoryQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<GradingResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [debug, setDebug] = useState('');
  const [useTimer, setUseTimer] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    const timerParam = searchParams.get('timer');
    if (timerParam === '1') {
      setUseTimer(true);
      setTimerStarted(true);
    }
  }, [searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (useTimer && timerStarted && !showResults) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [useTimer, timerStarted, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchQuestions();
  }, [company]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('theory_questions')
        .select('*')
        .ilike('company', company);

      console.log('Theory questions:', data?.length, error);
      setDebug(`Found ${data?.length || 0} questions for ${company}`);
      
      if (error) throw error;
      setQuestions(shuffleArray(data || []).slice(0, 5));
    } catch (error: any) {
      console.error('Error:', error);
      setDebug(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const gradeWithGemini = async (question: string, userAnswer: string) => {
    try {
      const response = await fetch('/api/gemini/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userAnswer }),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        console.error('Grading error:', data.error || 'Unknown error');
        return { score: 0, passed: false, feedback: data.error || 'Unable to grade. Please try again.' };
      }

      return { score: data.score, passed: data.score >= 75, feedback: data.feedback };
    } catch (error) {
      console.error('Grading error:', error);
      return { score: 0, passed: false, feedback: 'Unable to grade. Please check your connection.' };
    }
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      alert(`Please answer all ${questions.length} questions`);
      return;
    }

    setSubmitting(true);

    const gradingResults: GradingResult[] = [];

    for (const q of questions) {
      const grading = await gradeWithGemini(q.question_text, answers[q.id]);
      gradingResults.push(grading);
    }

    setResults(gradingResults);
    setSubmitting(false);
    setShowResults(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.muted }}>
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-2" size={32} style={{ color: theme.colors.primary.DEFAULT }} />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <div className="px-4 py-3" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
          <div className="max-w-4xl mx-auto">
            <Link href={`/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
              <ArrowLeft size={18} />
              Back
            </Link>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <p className="text-gray-600 mb-2">No questions available for this company yet.</p>
            <p className="text-sm text-gray-500 mt-4">
              Questions require internet connection to load. Please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const passed = results.filter(r => r.passed).length;
    const percentage = Math.round((passed / results.length) * 100);

    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <div className="px-4 py-3" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href={`/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
              <ArrowLeft size={18} />
              Exit
            </Link>
            <span className="text-white text-sm font-medium">Results</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl p-6 text-center mb-4" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: percentage >= 75 ? '#10B98120' : '#EF444420' }}>
              <span className="text-2xl font-bold" style={{ color: percentage >= 75 ? theme.colors.success : theme.colors.error }}>
                {percentage}%
              </span>
            </div>
            <p className="text-gray-600 text-sm">{passed}/{results.length} passed (75% threshold)</p>
            {useTimer && <p className="text-gray-500 text-sm mt-1">Time: {formatTime(timeSpent)}</p>}
          </div>

          <div className="space-y-3 mb-4">
            {results.map((result, idx) => {
              const q = questions[idx];

              return (
                <div key={q.id} className="bg-white rounded-lg p-3" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                  <div className="flex items-start gap-2 mb-2">
                    {result.passed ? (
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Question {idx + 1}</p>
                      <p className="text-xs text-gray-500">{q.question_text}</p>
                    </div>
                  </div>
                  <div className="ml-6 bg-gray-50 rounded p-2 mb-2">
                    <p className="text-xs text-gray-600">{answers[q.id]}</p>
                  </div>
                  <div className="ml-6 flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium" style={{ color: result.passed ? theme.colors.success : theme.colors.error }}>
                      {result.score}%
                    </span>
                    <span className="text-xs text-gray-400">({result.passed ? 'Passed' : 'Failed'})</span>
                  </div>
                  <div className="ml-6 bg-blue-50 rounded p-2">
                    <p className="text-xs text-gray-600">{result.feedback}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => { setAnswers({}); setShowResults(false); setResults([]); fetchQuestions(); }} className="w-full py-3 rounded-lg font-medium text-sm" style={{ backgroundColor: theme.colors.primary.DEFAULT, color: '#fff' }}>
            Try Again
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            This quiz is for educational purposes only. JobMeter has no affiliation to {company}.
          </p>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const isCurrentAnswered = !!answers[currentQuestion?.id]?.trim();

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      <div className="px-4 py-3 sticky top-0 z-10" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <ArrowLeft size={18} />
            Exit
          </Link>
          <span className="text-white text-sm font-medium">{answeredCount}/{questions.length}</span>
          {useTimer && timerStarted && (
            <span className="text-white text-sm font-medium bg-white/20 px-2 py-1 rounded">{formatTime(timeSpent)}</span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="mb-3">
          <div className="h-1.5 bg-gray-200 rounded-full">
            <div className="h-full rounded-full" style={{ width: `${(answeredCount / questions.length) * 100}%`, backgroundColor: theme.colors.primary.DEFAULT }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <p className="text-sm font-medium text-gray-900 mb-3">Q{currentIndex + 1}. {currentQuestion.question_text}</p>

            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Type your answer..."
              rows={6}
              className="w-full p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 py-3 rounded-lg font-medium text-sm disabled:opacity-50 bg-gray-200 text-gray-700"
          >
            Previous
          </button>
          
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < questions.length}
              className="flex-1 py-3 rounded-lg font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary.DEFAULT, color: '#fff' }}
            >
              {submitting ? 'Grading with AI...' : `Submit (${answeredCount}/${questions.length})`}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className="flex-1 py-3 rounded-lg font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary.DEFAULT, color: '#fff' }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
