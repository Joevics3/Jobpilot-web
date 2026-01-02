'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, TrendingUp, Target, CheckCircle, XCircle, AlertCircle, FileCheck, Briefcase } from 'lucide-react';
import Link from 'next/link';

type ScoreBreakdownKey = 
  | 'keywordMatch'
  | 'experienceMatch'
  | 'skillsAlignment'
  | 'atsCompatibility'
  | 'formattingConsistency'
  | 'profileSummaryStrength'
  | 'structureFlow'
  | 'visualBalanceReadability';

interface ATSReviewResult {
  overallScore: number;
  overallExplanation?: string;
  scoreBreakdown?: {
    keywordMatch: { score: number; details: string; examples: string; recommendation: string };
    experienceMatch: { score: number; details: string; examples: string; recommendation: string };
    skillsAlignment: { score: number; details: string; examples: string; recommendation: string };
    atsCompatibility: { score: number; details: string; examples: string; recommendation: string };
    formattingConsistency: { score: number; details: string; examples: string; recommendation: string };
    profileSummaryStrength: { score: number; details: string; examples: string; recommendation: string };
    structureFlow: { score: number; details: string; examples: string; recommendation: string };
    visualBalanceReadability: { score: number; details: string; examples: string; recommendation: string };
  };
  summary?: string;
  finalRecommendations?: string[];
}

interface ATSReviewSession {
  id: string;
  timestamp: number;
  cvName: string;
  jobTitle?: string;
  jobCompany?: string;
  overallScore: number;
  reviewType: 'cv-only' | 'cv-job';
  lastMessage: string;
  fullAnalysis: ATSReviewResult;
}

export default function ATSReviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<ATSReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<ScoreBreakdownKey | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = () => {
    try {
      const history = localStorage.getItem('ats_cv_review_history');
      if (history) {
        const sessions: ATSReviewSession[] = JSON.parse(history);
        const foundSession = sessions.find(s => s.id === sessionId);
        if (foundSession) {
          setSession(foundSession);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return XCircle;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const categoryLabels: Record<string, string> = {
    keywordMatch: 'Keyword Match',
    experienceMatch: 'Experience Match',
    skillsAlignment: 'Skills Alignment',
    atsCompatibility: 'ATS Compatibility',
    formattingConsistency: 'Formatting Consistency',
    profileSummaryStrength: 'Profile Summary Strength',
    structureFlow: 'Structure and Flow',
    visualBalanceReadability: 'Visual Balance & Readability',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-4">The review session you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft size={20} />
            Back to Tools
          </Link>
        </div>
      </div>
    );
  }

  const analysisResult = session.fullAnalysis;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/tools/ats-review"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ATS CV Review</h1>
                <p className="text-sm text-gray-600">
                  {session.cvName}
                  {session.jobTitle && ` • ${session.jobTitle}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{formatDate(session.timestamp)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Score Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Overall Score</h2>
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ 
              backgroundColor: `${getScoreColor(analysisResult.overallScore)}15`,
              color: getScoreColor(analysisResult.overallScore)
            }}>
              {session.reviewType === 'cv-job' ? 'Job-Specific Review' : 'General ATS Review'}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={getScoreColor(analysisResult.overallScore)}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(analysisResult.overallScore / 100) * 352} 352`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: getScoreColor(analysisResult.overallScore) }}>
                  {analysisResult.overallScore}
                </span>
              </div>
            </div>
            <div className="flex-1">
              {analysisResult.overallExplanation && (
                <p className="text-gray-700 leading-relaxed">{analysisResult.overallExplanation}</p>
              )}
              {analysisResult.summary && (
                <p className="text-gray-600 mt-2 leading-relaxed">{analysisResult.summary}</p>
              )}
            </div>
          </div>
        </div>

        {/* Score Breakdown Grid */}
        {analysisResult.scoreBreakdown && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Score Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(analysisResult.scoreBreakdown).map(([key, item]) => {
                const Icon = getScoreIcon(item.score);
                const color = getScoreColor(item.score);
                return (
                  <div
                    key={key}
                    className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedCategory(expandedCategory === key ? null : key as ScoreBreakdownKey)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon size={24} style={{ color }} />
                      <span className="text-2xl font-bold" style={{ color }}>{item.score}%</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {categoryLabels[key] || key}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2">{item.details}</p>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-sm text-gray-500 mb-4">
              Click on any category above to see detailed analysis
            </div>

            {/* Expanded Category Details */}
            {expandedCategory && analysisResult.scoreBreakdown?.[expandedCategory] && (() => {
              const categoryData = analysisResult.scoreBreakdown[expandedCategory];
              return (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {categoryLabels[expandedCategory] || expandedCategory}
                  </h3>
                  <button
                    onClick={() => setExpandedCategory(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Analysis</h4>
                      <p className="text-gray-700">{categoryData.details}</p>
                  </div>
                    {categoryData.examples && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Examples</h4>
                      <p className="text-gray-700 whitespace-pre-line">
                          {categoryData.examples}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
                    <p className="text-gray-700 whitespace-pre-line">
                        {categoryData.recommendation}
                    </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Final Recommendations */}
        {analysisResult.finalRecommendations && analysisResult.finalRecommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={24} className="text-green-600" />
              Final Recommendations
            </h2>
            <ul className="space-y-3">
              {analysisResult.finalRecommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 flex-1">{recommendation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}




