"use client";

import React, { useState, useRef } from 'react';
import { FileCheck, CheckCircle, XCircle, AlertTriangle, Sparkles, Loader2, Upload, Copy, ArrowRight, Search, ArrowLeft, FileText, Briefcase, MessageCircle, GraduationCap, Brain, Shield, Calculator } from 'lucide-react';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

interface KeywordResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendedKeywords: string[];
  hardSkills: string[];
  softSkills: string[];
  bulletImprovements: string[];
  summary: string;
}

export default function KeywordCheckerPage() {
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<KeywordResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');

  const cvInputRef = useRef<HTMLTextAreaElement>(null);
  const jobInputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const analyzeKeywords = async () => {
    if (!cvText.trim() || !jobDescription.trim()) {
      setError('Please provide both your CV and the job description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: apiError } = await supabase.functions.invoke('keyword-checker', {
        body: {
          cvText: cvText.trim(),
          jobDescription: jobDescription.trim()
        }
      });

      if (apiError) throw apiError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setResult(data.data);
      
      // Scroll to results after analysis
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Excellent Match' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Good Match' };
    if (score >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Needs Work' };
    return { bg: 'bg-red-100', text: 'text-red-700', label: 'Poor Match' };
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <a href="/tools" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CV Keyword Checker</h1>
              <p className="text-sm text-gray-600">Check keyword match between your CV and job descriptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Paste or upload your CV content</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Paste the job description you want to match</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Click Analyze to check keyword match</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Get personalized recommendations to improve</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Input Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileCheck size={20} className="text-green-600" />
            Analyze Your CV
          </h2>

          {/* CV Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your CV <span className="text-red-500">*</span>
            </label>
            
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'paste' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Paste CV
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                Upload CV
              </button>
            </div>

            {activeTab === 'paste' ? (
              <textarea
                ref={cvInputRef}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your CV content here... Include your skills, work experience, education, and any other relevant information."
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600 mb-2">Upload your CV (PDF, DOCX)</p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  id="cv-upload"
                />
                <label
                  htmlFor="cv-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block"
                >
                  Choose File
                </label>
                <p className="text-xs text-gray-500 mt-2">Coming soon - paste your CV for now</p>
              </div>
            )}
          </div>

          {/* Job Description Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={jobInputRef}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Paste the job description here... Include the required skills, qualifications, and responsibilities."
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={analyzeKeywords}
            disabled={isAnalyzing || !cvText.trim() || !jobDescription.trim()}
            className="w-full py-3 px-6 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze CV
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div ref={resultsRef} className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Analysis Results</h2>
                <div className={`px-4 py-2 rounded-xl ${getScoreColor(result.matchScore).bg}`}>
                  <span className={`text-2xl font-bold ${getScoreColor(result.matchScore).text}`}>
                    {result.matchScore}%
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600">{result.summary}</p>
            </div>

            {/* Keywords Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Matched Keywords */}
              <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  Matched Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.matchedKeywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                  {result.matchedKeywords.length === 0 && (
                    <p className="text-gray-500 text-sm">No keywords matched</p>
                  )}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" />
                  Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.missingKeywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                  {result.missingKeywords.length === 0 && (
                    <p className="text-gray-500 text-sm">No missing keywords</p>
                  )}
                </div>
              </div>

              {/* Recommended Keywords */}
              <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-500" />
                  Recommended Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.recommendedKeywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                  {result.recommendedKeywords.length === 0 && (
                    <p className="text-gray-500 text-sm">No recommendations</p>
                  )}
                </div>
              </div>

              {/* Hard Skills */}
              <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileCheck size={18} className="text-blue-500" />
                  Hard Skills Found
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.hardSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                  {result.hardSkills.length === 0 && (
                    <p className="text-gray-500 text-sm">No hard skills detected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Improvements */}
            {result.bulletImprovements.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRight size={18} className="text-orange-500" />
                  Recommended Improvements
                </h3>
                <ul className="space-y-2">
                  {result.bulletImprovements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <span className="text-orange-500 mt-1">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Soft Skills */}
            {result.softSkills.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                <h3 className="font-bold text-gray-900 mb-3">Soft Skills Found</h3>
                <div className="flex flex-wrap gap-2">
                  {result.softSkills.map((skill, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO Content */}
        <div className="mt-12">

          {/* Related Tools */}
          <div className="border-t border-gray-200 pt-8 mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Related Tools</h2>
            <p className="text-gray-600 mb-6">More tools to strengthen your job search and career development.</p>

            {/* CV Tools */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} style={{ color: '#2563EB' }} />
                <h3 className="text-base font-semibold text-gray-900">CV Tools</h3>
                <span className="text-sm text-gray-500">– Build and optimize your CV</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="/cv" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                    <FileText size={18} style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">Create CV / Cover Letter</p>
                    <p className="text-xs text-gray-500">Build professional CVs and cover letters in minutes</p>
                  </div>
                </a>
                <a href="/tools/ats-review" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
                    <FileCheck size={18} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm">ATS CV Review</p>
                    <p className="text-xs text-gray-500">Optimize your CV for ATS systems and job matching</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Career Tools */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase size={18} style={{ color: '#F59E0B' }} />
                <h3 className="text-base font-semibold text-gray-900">Career Tools</h3>
                <span className="text-sm text-gray-500">– Advance your career</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="/tools/interview" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5F3FF' }}>
                    <MessageCircle size={18} style={{ color: '#8B5CF6' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors text-sm">Interview Practice</p>
                    <p className="text-xs text-gray-500">Practice with personalized questions based on job descriptions</p>
                  </div>
                </a>
                <a href="/tools/career" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFFBEB' }}>
                    <GraduationCap size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors text-sm">Career Coach</p>
                    <p className="text-xs text-gray-500">Get personalized career guidance and advice</p>
                  </div>
                </a>
                <a href="/tools/role-finder" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ECFEFF' }}>
                    <Search size={18} style={{ color: '#06B6D4' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-cyan-600 transition-colors text-sm">Role Finder</p>
                    <p className="text-xs text-gray-500">Discover new career paths based on your skills</p>
                  </div>
                </a>
                <a href="/tools/quiz" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FDF2F8' }}>
                    <Brain size={18} style={{ color: '#EC4899' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors text-sm">Company Quiz</p>
                    <p className="text-xs text-gray-500">Practice aptitude tests from top companies</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Safety Tools */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} style={{ color: '#EF4444' }} />
                <h3 className="text-base font-semibold text-gray-900">Safety Tools</h3>
                <span className="text-sm text-gray-500">– Stay safe from job scams</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="/tools/scam-detector" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF2F2' }}>
                    <Shield size={18} style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-sm">Job Description Analyzer</p>
                    <p className="text-xs text-gray-500">AI-powered analysis to detect job scams in any text</p>
                  </div>
                </a>
                <a href="/tools/scam-checker" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF2F2' }}>
                    <Shield size={18} style={{ color: '#DC2626' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors text-sm">Job Scam Checker</p>
                    <p className="text-xs text-gray-500">Search and report fraudulent companies and recruiters</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Salary Tools */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={18} style={{ color: '#3B82F6' }} />
                <h3 className="text-base font-semibold text-gray-900">Salary Tools</h3>
                <span className="text-sm text-gray-500">– Calculate and compare salaries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href="/tools/paye-calculator" className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF6FF' }}>
                    <Calculator size={18} style={{ color: '#3B82F6' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">PAYE Calculator</p>
                    <p className="text-xs text-gray-500">Calculate net salary with 2026 tax rates</p>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* SEO Text Content */}
          <div className="border-t border-gray-200 pt-8 space-y-10 text-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">CV Keyword Checker: Free Resume Keyword Scanner &amp; ATS Keyword Optimizer</h2>
              <p className="text-gray-600">
                Our free CV Keyword Checker is an AI-powered resume keyword scanner that compares your CV against any job description, identifies missing ATS keywords, and gives you a keyword match score — so you can optimize your resume and pass applicant tracking system filters before applying.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">What Are CV Keywords and Why Do They Matter?</h3>
              <p className="mb-3">
                CV keywords — also called resume keywords — are specific skills, qualifications, job titles, tools, and industry terms that recruiters and applicant tracking systems (ATS) scan for in every application. They include hard skills like "Python," "data analysis," or "project management," as well as role-specific phrases like "customer success," "SEO optimization," or "financial modeling."
              </p>
              <p>
                Over 99% of Fortune 500 companies and the vast majority of employers worldwide use ATS to screen resumes before a human reads them. Without the right keywords, your CV is filtered out automatically — regardless of your actual qualifications. A resume keyword scanner like ours ensures your CV contains the exact terms each job requires.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">How Our Free Resume Keyword Scanner Works</h3>
              <ol className="space-y-3 list-none">
                {[
                  { n: '1', t: 'Paste your CV', d: 'Add your full CV text — work experience, skills, education, and summary.' },
                  { n: '2', t: 'Paste the job description', d: 'Add the target job posting to enable precise CV keyword matching against real requirements.' },
                  { n: '3', t: 'Run the keyword scan', d: 'Our AI resume keyword tool extracts and compares keywords, hard skills, soft skills, and ATS phrases instantly.' },
                  { n: '4', t: 'Review your keyword match score', d: 'See matched keywords, missing keywords, recommended additions, and section-level improvement tips.' },
                  { n: '5', t: 'Optimize and re-check', d: 'Update your CV with the suggested keywords and re-run the scan to track your improved match score.' },
                ].map(({ n, t, d }) => (
                  <li key={n} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0 mt-0.5">{n}</div>
                    <div><strong className="text-gray-900">{t}:</strong> {d}</div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Best Keywords to Use in a Resume by Role</h3>
              <p className="mb-4">The best keywords for your resume depend entirely on the role. Here are high-value resume keywords and phrases for common positions:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-900 border-b border-gray-200">Role</th>
                      <th className="text-left p-3 font-semibold text-gray-900 border-b border-gray-200">Top Resume Keywords</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { role: 'Project Manager', kw: 'project lifecycle, stakeholder management, agile, PMP, risk mitigation, Gantt chart, budget management, cross-functional teams' },
                      { role: 'Product Manager', kw: 'product roadmap, user stories, go-to-market, A/B testing, KPIs, sprint planning, customer research, product-led growth' },
                      { role: 'Data Analyst', kw: 'SQL, Python, Tableau, Power BI, data visualization, statistical analysis, Excel, ETL, dashboard, predictive modeling' },
                      { role: 'Customer Success Manager', kw: 'NPS, churn reduction, onboarding, client retention, SaaS, CRM, upsell, customer satisfaction, QBR' },
                      { role: 'Marketing', kw: 'SEO, SEM, content strategy, Google Analytics, email marketing, social media, lead generation, ROI, campaign management' },
                      { role: 'Customer Service', kw: 'CRM, ticket resolution, SLA, first call resolution, customer satisfaction, escalation management, communication' },
                    ].map(({ role, kw }) => (
                      <tr key={role} className="hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900 whitespace-nowrap">{role}</td>
                        <td className="p-3 text-gray-600">{kw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-gray-500">Use our free CV keyword checker to generate role-specific keyword lists from any job description automatically.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hard Skills vs Soft Skills: What ATS Scans For</h3>
              <p className="mb-4">Applicant tracking systems primarily scan for hard skills — technical, measurable abilities tied to specific roles. Soft skills matter to recruiters but are weighted differently by ATS. Your CV needs a strong balance of both.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-3">Hard Skills (ATS Priority)</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {['Programming languages (Python, JavaScript, SQL)', 'Software & tools (Excel, Salesforce, Jira)', 'Certifications (PMP, CPA, AWS, CFA)', 'Data analysis & visualization', 'Financial modeling & forecasting', 'Foreign languages (fluency level)'].map((s, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-3">Soft Skills (Recruiter Priority)</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    {['Communication & presentation', 'Leadership & team management', 'Problem-solving & critical thinking', 'Collaboration & cross-functional work', 'Adaptability & resilience', 'Time management & prioritization'].map((s, i) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Resume Keyword Optimization: How to Add Keywords Naturally</h3>
              <p className="mb-3">
                Effective resume keyword optimization means integrating ATS keywords naturally into your bullet points, summary, and skills section — not stuffing them in a list at the bottom. ATS systems are sophisticated enough to detect keyword stuffing, and recruiters will dismiss a CV that reads unnaturally.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mb-3">
                <p className="text-amber-800 font-medium text-sm">Pro tip: Never claim skills you don't have. If "agile project management" appears as a missing keyword and you've led team projects, describe that experience using agile terminology to reflect your genuine experience accurately.</p>
              </div>
              <p>
                Instead of writing "Led a team to complete a project," write "Managed a cross-functional team of 6 to deliver a product roadmap milestone using agile sprint methodology, reducing time-to-launch by 20%." Both versions describe the same experience, but the second passes ATS keyword matching and impresses recruiters.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Common ATS Resume Keyword Mistakes to Avoid</h3>
              <ul className="space-y-2">
                {[
                  'Keyword stuffing — listing keywords repetitively without context; modern ATS detect and penalize this.',
                  'Using synonyms instead of exact terms — ATS match exact phrases, so use "project management" if the JD uses "project management," not "project coordination."',
                  'Unexpanded acronyms — always write "Search Engine Optimization (SEO)" before using the acronym alone.',
                  'Missing skills section — always include a dedicated Skills section with role-relevant keywords.',
                  'Generic resume buzzwords without evidence — avoid overused terms like "results-driven" or "self-starter" without supporting achievement data.',
                  'Ignoring the job description — every application should have a tailored CV with keywords pulled from that specific posting.',
                  'Tables and multi-column layouts — these break ATS keyword parsing, causing keywords to be missed or misread.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {[
                  { q: 'What is a CV keyword checker?', a: 'A CV keyword checker is an AI-powered tool that compares your resume against a job description, identifies which ATS keywords are present or missing, and scores your keyword match percentage to help you optimize before applying.' },
                  { q: 'How do I check my resume for keywords?', a: 'Paste your CV text and the target job description into our free resume keyword scanner. The tool instantly extracts keywords from the job description, finds matches and gaps in your CV, and recommends additions.' },
                  { q: 'What are the best keywords for a resume?', a: 'The best keywords for your resume are specific to each job description. Generally, the highest-value keywords are hard skills (tools, technologies, certifications), job titles, and industry-specific phrases that appear prominently in the job posting.' },
                  { q: 'Is this CV keyword scanner free?', a: 'Yes — our CV keyword checker is 100% free with no sign-up required. Run unlimited keyword scans against any job description.' },
                  { q: 'What are resume buzzwords to include?', a: 'High-impact resume buzzwords include: "cross-functional," "stakeholder management," "data-driven," "agile," "scalable," "revenue growth," and role-specific terms. However, always back them up with quantifiable achievements rather than using them as empty phrases.' },
                  { q: 'How does ATS keyword matching work?', a: 'ATS systems parse your resume into sections, extract keywords, and compare them against required terms in the job description. Resumes with higher keyword match percentages are ranked higher and more likely to reach a human recruiter.' },
                  { q: 'Can I use this as a resume keyword tool for any role?', a: 'Yes — our keyword scanner works for any role or industry, including project manager resume keywords, data analyst resume keywords, marketing, customer success, finance, engineering, and more. Just paste the relevant job description.' },
                  { q: 'What is resume keyword optimization?', a: 'Resume keyword optimization is the process of strategically incorporating relevant ATS keywords from a job description into your CV\'s skills section, work experience bullet points, and summary — naturally and accurately — to improve your ATS match score.' },
                ].map(({ q, a }, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="font-semibold text-gray-900 mb-2 text-sm">{q}</p>
                    <p className="text-gray-600 text-sm">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* JSON-LD Schemas */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "CV Keyword Checker — Free Resume Keyword Scanner",
                "description": "Free AI-powered CV keyword checker and resume keyword scanner. Compare your CV against any job description, identify missing ATS keywords, get a keyword match score, and optimize your resume for applicant tracking systems.",
                "url": "https://jobmeter.com/tools/keyword-checker",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                "featureList": [
                  "ATS keyword match score",
                  "Missing keyword identification",
                  "Resume keyword optimization suggestions",
                  "Hard skills and soft skills detection",
                  "Job description keyword extraction",
                  "Bullet point improvement recommendations",
                  "Free unlimited scans"
                ],
                "creator": { "@type": "Organization", "name": "JobMeter", "url": "https://jobmeter.com" }
              })
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "What is a CV keyword checker?", "acceptedAnswer": { "@type": "Answer", "text": "A CV keyword checker is an AI-powered tool that compares your resume against a job description, identifies which ATS keywords are present or missing, and scores your keyword match percentage to help you optimize before applying." } },
                  { "@type": "Question", "name": "How do I check my resume for keywords?", "acceptedAnswer": { "@type": "Answer", "text": "Paste your CV text and the target job description into our free resume keyword scanner. The tool instantly extracts keywords, finds matches and gaps, and recommends additions to improve your ATS match score." } },
                  { "@type": "Question", "name": "What are the best keywords for a resume?", "acceptedAnswer": { "@type": "Answer", "text": "The best resume keywords are specific to each job description — particularly hard skills, tools, certifications, job titles, and industry-specific phrases that appear prominently in the job posting." } },
                  { "@type": "Question", "name": "Is this CV keyword scanner free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — our CV keyword checker is 100% free with no sign-up required. Run unlimited keyword scans against any job description." } },
                  { "@type": "Question", "name": "What is resume keyword optimization?", "acceptedAnswer": { "@type": "Answer", "text": "Resume keyword optimization is the process of strategically incorporating relevant ATS keywords from a job description into your CV's skills section, work experience, and summary — naturally and accurately — to improve your ATS match score." } }
                ]
              })
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "HowTo",
                "name": "How to Check Your CV for Keywords",
                "description": "Use our free CV keyword checker to scan your resume against a job description and identify missing ATS keywords.",
                "totalTime": "PT1M",
                "tool": [{ "@type": "HowToTool", "name": "CV Keyword Checker — Free Resume Keyword Scanner" }],
                "step": [
                  { "@type": "HowToStep", "name": "Paste your CV", "text": "Add your full CV text including work experience, skills, and education." },
                  { "@type": "HowToStep", "name": "Paste the job description", "text": "Add the target job posting to enable precise CV keyword matching." },
                  { "@type": "HowToStep", "name": "Run the keyword scan", "text": "Click Analyze — AI extracts and compares keywords, hard skills, and ATS phrases instantly." },
                  { "@type": "HowToStep", "name": "Review your keyword match score", "text": "See matched and missing keywords, recommended additions, and improvement tips." },
                  { "@type": "HowToStep", "name": "Optimize and re-check", "text": "Update your CV with suggested keywords and re-run the scan to track improvement." }
                ]
              })
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://jobmeter.com" },
                  { "@type": "ListItem", "position": 2, "name": "Tools", "item": "https://jobmeter.com/tools" },
                  { "@type": "ListItem", "position": 3, "name": "CV Keyword Checker", "item": "https://jobmeter.com/tools/keyword-checker" }
                ]
              })
            }}
          />
        </div>
      </div>
    </div>
  );
}