'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, TrendingUp, Target, Award, AlertTriangle, Lightbulb, Briefcase, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { CareerCoachService, CareerCoachResult } from '@/lib/services/careerCoachService';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

type TabType = 'paths' | 'skills' | 'insights';

export default function CareerPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<CareerCoachResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showReanalyzeWarning, setShowReanalyzeWarning] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('paths');

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const result = await CareerCoachService.getAnalysis();
      if (result) {
        setAnalysis(result);
      } else {
        console.log('No career analysis found - will show analysis option');
      }
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
      // Get user ID - use localStorage or generate temp ID for non-authenticated users
      let userId = 'anonymous_user';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (e) {
        // Continue with anonymous user
      }

      // Get onboarding data if available
      let onboardingData = null;
      try {
        const { data } = await supabase
          .from('onboarding_data')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        onboardingData = data;
      } catch (e) {
        // Continue without onboarding data
      }

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading career analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/tools"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Career Coach</h1>
                <p className="text-sm text-gray-600">
                  AI-powered career guidance and development plan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* No Analysis - Show Analysis Option */}
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
                {reanalyzing ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Lightbulb size={20} />
                    Start Career Analysis
                  </>
                )}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                You'll need to be logged in and have completed your profile setup.
              </p>
            </div>

            {/* Features */}
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
                <h1 className="text-2xl font-bold text-gray-900">Career Analysis</h1>
                <p className="text-sm text-gray-600">
                  Personalized career guidance and development plan
                </p>
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

      {/* Career Score */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
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

      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('paths')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'paths'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Target size={16} className="inline mr-2" />
                Career Paths
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'skills'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Award size={16} className="inline mr-2" />
                Skill Gaps
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`flex-1 px-6 py-4 text-center border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'insights'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Lightbulb size={16} className="inline mr-2" />
                Insights
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Career Paths Tab */}
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
                            {path.requiredSkills.slice(0, 4).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Career Opportunities</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {path.potentialRoles.slice(0, 3).map((opp, oppIndex) => (
                              <li key={oppIndex} className="flex items-start gap-2">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{opp}</span>
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

            {/* Skill Gaps Tab */}
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
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{gap.skill}</h3>
                        </div>
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
                          {gap.learningPath.slice(0, 3).map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-2">
                              <span className="text-blue-600 font-medium mt-1">{stepIndex + 1}.</span>
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

            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb size={24} className="text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Career Insights & Market Analysis</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" />
                        Market Trends
                      </h3>
                      <div className="space-y-3">
                        {analysis.marketInsights.industryTrends.map((trend, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
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
                        {analysis.insights.opportunities.map((opp, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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
                        {analysis.insights.warnings.map((warning, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
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
                        {analysis.insights.tips.map((tip, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
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

      {/* Reanalyze Warning Modal */}
      {showReanalyzeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Reanalyze Career Data</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This will regenerate your career analysis based on your current profile. Only reanalyze if you&apos;ve made significant changes to your profile data.
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
    </div>
  );
}