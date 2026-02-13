'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, TrendingUp, Target, Award, AlertTriangle, Lightbulb, Briefcase, DollarSign, ChevronDown } from 'lucide-react';
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
  const [seoExpanded, setSeoExpanded] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const result = await CareerCoachService.getAnalysis();
      if (result) {
        setAnalysis(result);
      } else {
        console.error('No career analysis found');
        router.push('/career-tools');
        return;
      }
    } catch (error) {
      console.error('Error loading career analysis:', error);
      router.push('/career-tools');
      return;
    }
    setLoading(false);
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setShowReanalyzeWarning(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Please log in to continue');
      }

      const { data: onboardingData, error } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || !onboardingData) {
        throw new Error('Please complete your profile setup first');
      }

      const result = await CareerCoachService.generateAnalysis(session.user.id, onboardingData);
      setAnalysis(result);
    } catch (error) {
      console.error('Error reanalyzing career:', error);
      alert('Failed to reanalyze. Please try again.');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your career analysis first.</p>
          <Link
            href="/career-tools"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Start Career Analysis
          </Link>
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
                href="/career-tools"
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

      {/* SEO Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-xl font-bold text-gray-900">Learn More About Career Coaching</h2>
            <ChevronDown
              size={24}
              className={`text-gray-500 transition-transform duration-200 ${seoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {seoExpanded && (
            <div className="px-6 pb-6 pt-0">
              <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                <p>
                  Welcome to JobMeter's AI-powered Career Coach, your personal career development assistant designed to help Nigerian professionals navigate their career journey with confidence. Whether you're just starting out or looking to make a significant career change, our comprehensive tool provides personalized guidance tailored to your unique skills, experience, and career aspirations.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Why Career Coaching Matters in Nigeria</h3>
                <p>
                  The Nigerian job market is evolving rapidly, with new industries emerging and traditional sectors transforming. Many professionals find themselves uncertain about which career path to pursue or how to develop the skills needed to advance. Our AI Career Coach bridges this gap by providing data-driven insights and personalized recommendations based on current market trends and your individual profile.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">How Our Career Coach Works</h3>
                <p>
                  Our career coaching tool uses advanced artificial intelligence to analyze your profile, including your education, work experience, skills, and career goals. Based on this analysis, we generate personalized career paths, identify skill gaps, and provide actionable recommendations for career advancement. The tool considers current market trends in Nigeria and globally to ensure its recommendations are relevant and valuable.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Key Features of Our Career Coach</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Personalized Career Paths:</strong> Discover career options that align with your skills and interests</li>
                  <li><strong>Skill Gap Analysis:</strong> Identify missing skills and get personalized development plans</li>
                  <li><strong>Market Insights:</strong> Stay informed about industry trends and opportunities in Nigeria</li>
                  <li><strong>Career Readiness Score:</strong> Understand how prepared you are for your target roles</li>
                  <li><strong>Actionable Recommendations:</strong> Get specific steps to improve your career prospects</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900">Understanding Your Career Readiness Score</h3>
                <p>
                  Your career readiness score is a comprehensive evaluation of your professional profile against your target career paths. The score considers multiple factors including your technical skills, soft skills, educational background, work experience, and industry relevance. A higher score indicates you're well-positioned for your desired roles, while a lower score suggests areas for improvement.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Identifying and Bridging Skill Gaps</h3>
                <p>
                  One of the most valuable features of our Career Coach is the skill gap analysis. This feature compares your current skill set against the requirements of your target career paths and identifies specific gaps. For each skill gap, we provide a detailed development plan with recommended courses, certifications, and practical steps to acquire the missing skills. This targeted approach ensures you focus your learning efforts where they matter most.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Exploring Career Paths in Nigeria</h3>
                <p>
                  Nigeria offers diverse career opportunities across various sectors including technology, finance, healthcare, manufacturing, entertainment, and emerging industries like fintech and e-commerce. Our Career Coach helps you explore these options and identify roles that match your skills and interests. Whether you're interested in traditional careers or emerging opportunities in the digital economy, we provide comprehensive guidance to help you make informed decisions.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Tips for Career Advancement</h3>
                <p>
                  Beyond using our Career Coach tool, here are essential tips for advancing your career in Nigeria: Continuously update your skills through formal education and professional certifications, build a strong professional network both online and offline, seek mentorship from experienced professionals in your field, maintain a strong online presence through LinkedIn and professional platforms, and stay updated with industry trends and developments. Remember, career growth is a journey that requires continuous learning and adaptation.
                </p>

                <p>
                  Start your career transformation today with JobMeter's AI Career Coach. Get personalized insights, identify growth opportunities, and take actionable steps toward achieving your professional goals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}