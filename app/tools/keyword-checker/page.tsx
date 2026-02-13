"use client";

import React, { useState, useRef } from 'react';
import { FileCheck, CheckCircle, XCircle, AlertTriangle, Sparkles, Loader2, Upload, Copy, ArrowRight, Search } from 'lucide-react';
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
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-4xl mx-auto">
          <a href="/tools" className="text-sm text-white/80 hover:text-white transition-colors self-start inline-block mb-2">
            ← Back to Tools
          </a>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
            CV Keyword Checker
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.light }}>
            Optimize your CV by checking keyword match with job descriptions
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
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

        {/* SEO Content - Structured */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Everything You Need to Know About CV Keywords</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Master the art of CV optimization with our comprehensive guide to ATS keywords, resume scanning, and job application success in Nigeria.</p>
          </div>

          {/* Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                <Search className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">What Are CV Keywords?</h3>
              <p className="text-sm text-gray-700">CV keywords are specific skills, qualifications, and terms that recruiters and ATS systems look for in applications.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Why Keywords Matter</h3>
              <p className="text-sm text-gray-700">85% of jobs are now filled through ATS. Without the right keywords, your CV never reaches human eyes.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                <Sparkles className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">How to Optimize</h3>
              <p className="text-sm text-gray-700">Match your CV keywords naturally with job descriptions to pass ATS scans and impress recruiters.</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                Understanding ATS and CV Scanning
              </h3>
              <div className="text-gray-700 space-y-4">
                <p>Applicant Tracking Systems (ATS) are software applications used by employers to manage their recruitment process. These systems automatically scan, parse, and rank CVs based on predetermined criteria, primarily keywords that match the job description.</p>
                <p>When you submit your CV online, it first goes through an ATS before reaching a human recruiter. The system looks for specific keywords related to skills, experience, education, and other qualifications. If your CV doesn't contain enough relevant keywords, it may be automatically rejected, regardless of your actual qualifications.</p>
                <p>In Nigeria's competitive job market, understanding how ATS works is crucial for job seekers. With hundreds of applications for each position, companies rely heavily on ATS to filter candidates. Our CV Keyword Checker helps you understand exactly what keywords are missing from your CV and how to add them effectively.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                Hard Skills vs Soft Skills in Your CV
              </h3>
              <div className="text-gray-700 space-y-4">
                <p>Our AI analyzer identifies both hard skills and soft skills in your CV. Understanding the difference between these two types of skills is essential for comprehensive keyword optimization.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Hard Skills</h4>
                    <p className="text-sm text-blue-800">Technical, measurable abilities that are specific to a job. Examples include:</p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• Programming languages (Python, JavaScript)</li>
                      <li>• Software proficiency (Excel, Photoshop)</li>
                      <li>• Certifications (PMP, CPA, AWS)</li>
                      <li>• Data analysis and tools</li>
                      <li>• Foreign languages</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">Soft Skills</h4>
                    <p className="text-sm text-green-800">Interpersonal qualities that describe your work style. Examples include:</p>
                    <ul className="text-sm text-green-800 mt-2 space-y-1">
                      <li>• Communication</li>
                      <li>• Leadership</li>
                      <li>• Problem-solving</li>
                      <li>• Teamwork</li>
                      <li>• Time management</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4">Both skill types are important, but ATS systems primarily scan for hard skills. Make sure your CV prominently displays relevant hard skills while demonstrating soft skills through achievement descriptions.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                How to Use Missing Keywords Effectively
              </h3>
              <div className="text-gray-700 space-y-4">
                <p>When our tool shows missing keywords, don't simply list them randomly. Instead, strategically incorporate them into your CV in a natural, authentic way that demonstrates your actual abilities.</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                  <p className="text-yellow-800 font-medium">Pro Tip: Never claim skills you don't have. Focus on highlighting existing skills using the exact terminology from the job description.</p>
                </div>
                <p>For example, if "project management" is identified as a missing keyword and you've led team initiatives, describe that experience using project management terminology. Instead of "Led a team to complete a project," write "Managed cross-functional team to execute project deliverables using agile methodologies."</p>
                <p>This approach helps you pass ATS scans while presenting genuine qualifications to recruiters.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm">4</span>
                Common ATS Mistakes to Avoid
              </h3>
              <div className="text-gray-700 space-y-4">
                <p>Understanding common mistakes can help you optimize your CV more effectively. Here are the top errors job seekers make:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 mt-1" size={18} />
                    <span className="text-gray-700">Keyword stuffing (overloading with keywords)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 mt-1" size={18} />
                    <span className="text-gray-700">Using tables or columns that break ATS parsing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 mt-1" size={18} />
                    <span className="text-gray-700">Including images, graphics, or headers/footers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 mt-1" size={18} />
                    <span className="text-gray-700">Using non-standard section headings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 mt-1" size={18} />
                    <span className="text-gray-700">Submitting in wrong file format (sometimes .docx preferred over PDF)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 mt-1" size={18} />
                    <span className="text-gray-700">Using creative fonts that ATS can't read</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Ready to Optimize Your CV?</h3>
              <p className="text-white/90 mb-4">Use our CV Keyword Checker now to analyze your resume against any job description. Get personalized recommendations to improve your chances of landing your dream job in Nigeria.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free Tool</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">AI-Powered</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Instant Results</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">ATS Optimized</span>
              </div>
            </div>

            {/* Related Searches */}
            <div className="mt-8">
              <h4 className="font-bold text-gray-900 mb-3">Popular Searches</h4>
              <div className="flex flex-wrap gap-2">
                <a href="/tools/role-finder" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">Role Finder</a>
                <a href="/tools/scam-detector" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">Job Scam Detector</a>
                <a href="/tools/ats-review" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">ATS CV Review</a>
                <a href="/career-tools" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors">Career Tools</a>
              </div>
            </div>
          </div>

          {/* JSON-LD Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "CV Keyword Checker",
                "description": "Free AI-powered tool to check CV keywords against job descriptions. Optimize your resume for ATS and improve job application success.",
                "url": "https://jobmeter.com/tools/keyword-checker",
                "applicationCategory": "Career",
                "operatingSystem": "Web Browser",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "NGN"
                },
                "featureList": [
                  "ATS keyword analysis",
                  "Match score calculation",
                  "Missing keyword identification",
                  "CV improvement suggestions",
                  "Hard and soft skills detection"
                ]
              })
            }}
          />
        </div>
      </div>
    </div>
  );
}
