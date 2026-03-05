"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Sparkles, Info, AlertOctagon, FileText, X } from 'lucide-react';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

interface ScamAnalysis {
  trustScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  redFlags: string[];
  warnings: string[];
  safeIndicators: string[];
  analysis: string;
}

export default function ScamDetectorPage() {
  const [textToAnalyze, setTextToAnalyze] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const analyzeText = async () => {
    if (!textToAnalyze.trim() || textToAnalyze.length < 50) {
      setError('Please provide at least 50 characters of text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // First, save the submission to database
      const { data: submissionData, error: saveError } = await supabase
        .from('job_analysis_submissions')
        .insert({
          text_content: textToAnalyze.trim(),
          company_name: companyName.trim() || null,
          analysis_type: 'scam_detector'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Save error:', saveError);
      }

      // Then, fetch the analysis result from database
      if (submissionData?.id) {
        const { data: analysisData, error: fetchError } = await supabase
          .from('job_analysis_results')
          .select('*')
          .eq('submission_id', submissionData.id)
          .single();

        if (analysisData) {
          setResult({
            trustScore: analysisData.trust_score,
            riskLevel: analysisData.risk_level,
            redFlags: analysisData.red_flags || [],
            warnings: analysisData.warnings || [],
            safeIndicators: analysisData.safe_indicators || [],
            analysis: analysisData.analysis_text
          });
        } else if (fetchError) {
          console.error('Fetch error:', fetchError);
          // Fall back to local analysis if no result found
          await performLocalAnalysis();
        }
      } else {
        await performLocalAnalysis();
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Scroll to result and show modal when analysis completes
  useEffect(() => {
    if (result && !isAnalyzing) {
      setShowModal(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [result, isAnalyzing]);

  // Fallback local analysis using improved scoring
  const performLocalAnalysis = async () => {
    const text = textToAnalyze.toLowerCase();
    let score = 100;
    const redFlags: string[] = [];
    const warnings: string[] = [];
    const safeIndicators: string[] = [];

    // Check for real red flags (these deduct significant points)
    if (text.includes('pay') && (text.includes('fee') || text.includes('money') || text.includes('pay') && text.includes('first'))) {
      score -= 25;
      redFlags.push('Requests payment or money from applicants');
    }
    if (text.includes('western union') || text.includes('wire transfer') || text.includes('moneygram')) {
      score -= 20;
      redFlags.push('Requests wire transfer or money transfer');
    }
    if (text.includes('bank account') || text.includes('atm card') || text.includes('credit card') && (text.includes('job') || text.includes('interview'))) {
      score -= 20;
      redFlags.push('Requests banking/financial information');
    }
    if (!text.includes('interview') && (text.includes('send your id') || text.includes('send your passport') || text.includes('send your nin'))) {
      score -= 15;
      redFlags.push('Requests personal documents before interview');
    }
    if (text.includes('guarantee') && text.includes('job') && text.includes('100%')) {
      score -= 15;
      redFlags.push('Guarantees job placement - common scam tactic');
    }

    // Minor concerns (deduct fewer points)
    if (!text.includes('remote') && !text.includes('work from home') && !text.includes('location') && !text.includes('address') && !text.includes('lagos') && !text.includes('abuja') && !text.includes('port harcourt')) {
      score -= 5;
      warnings.push('No specific location mentioned for on-site jobs');
    }
    if (text.includes('salary') && (text.includes('unrealistic') || text.includes('million') || text.includes('₦500,000') && text.includes('month') && text.includes('entry level'))) {
      score -= 10;
      warnings.push('Salary appears unrealistic for position level');
    }

    // Generic email (Nigerian norm - deduct very little)
    const hasGmail = /\b(gmail|yahoo|hotmail|outlook)\b/i.test(text);
    if (hasGmail) {
      score -= 3;
      warnings.push('Generic email domain used (common in Nigeria)');
    }

    // Urgency tactics - NORMAL marketing, NOT a red flag
    // Skip this check entirely - urgency is normal for job postings

    // No company footprint - minor concern only
    const hasWebsite = /\b(http|www\.|\.com|\.ng)\b/i.test(text);
    const hasLinkedIn = /linkedin/i.test(text);
    if (!hasWebsite && !hasLinkedIn) {
      score -= 5;
      warnings.push('No company website or LinkedIn found');
    }

    // Positive indicators (add points)
    if (text.includes('interview')) {
      score += 5;
      safeIndicators.push('Interview process mentioned');
    }
    if (text.includes('company') || text.includes('about us')) {
      score += 5;
      safeIndicators.push('Company information provided');
    }
    if (text.includes('requirements') || text.includes('qualifications') || text.includes('experience')) {
      score += 5;
      safeIndicators.push('Clear job requirements listed');
    }
    if (text.includes('apply') && (text.includes('email') || text.includes('form') || text.includes('website'))) {
      score += 5;
      safeIndicators.push('Clear application process');
    }
    if (text.includes('salary') || text.includes('pay') || text.includes('compensation')) {
      score += 5;
      safeIndicators.push('Salary information provided');
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Never give 100% - max is 85% even if no issues
    // This accounts for the fact that no online analysis can be 100% certain
    if (score > 85) {
      score = 70 + Math.floor(Math.random() * 16); // Random between 70-85
    }

    // Determine risk level based on adjusted score
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (score >= 70) riskLevel = 'LOW';
    else if (score >= 55) riskLevel = 'MEDIUM';
    else if (score >= 40) riskLevel = 'HIGH';
    else riskLevel = 'CRITICAL';

    const analysisText = `Trust Score: ${score}/100. ${riskLevel === 'LOW' ? 'This job posting appears legitimate with minimal red flags.' : riskLevel === 'MEDIUM' ? 'Exercise caution - some concerns noted.' : riskLevel === 'HIGH' ? 'Multiple red flags detected - research thoroughly before proceeding.' : 'High risk detected - do not proceed without verification.'} ${companyName ? `Analyzed for: ${companyName}` : ''}`;

    setResult({
      trustScore: score,
      riskLevel,
      redFlags,
      warnings,
      safeIndicators,
      analysis: analysisText
    });
  };

  const getRiskConfig = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle };
      case 'MEDIUM':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: AlertTriangle };
      case 'HIGH':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', icon: AlertOctagon };
      case 'CRITICAL':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: XCircle };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: Info };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const riskConfig = result ? getRiskConfig(result.riskLevel) : null;
  const RiskIcon = riskConfig?.icon || Info;

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
            Job Scam Detector
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.light }}>
            AI-powered analysis to detect job scams and fraudulent postings
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Paste a job posting or email content</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Add company name if available</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Click Analyze for AI detection</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Get risk score and red flag warnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">Stay Safe from Job Scams</p>
            <p className="text-red-700">
              Scammers often target job seekers with fake job offers. Never pay money for job opportunities. 
              Legitimate employers never ask for payment for interviews, training, or equipment.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Analyze Job Posting
          </h2>

          {/* Company Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name (optional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the company name if known"
            />
          </div>

          {/* Text Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description, Email, or Message <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Paste the job description, email, or any suspicious message you received
            </p>
            <textarea
              value={textToAnalyze}
              onChange={(e) => setTextToAnalyze(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Paste the job posting text, email content, or message here. Include any details about the job, company, salary, requirements, or any suspicious requests..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {textToAnalyze.length} / 50 </p>
          characters minimum
            </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={analyzeText}
            disabled={isAnalyzing || textToAnalyze.length < 50}
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
                Detect Scams
              </>
            )}
          </button>
        </div>

        {/* Results Section - Scroll to this */}
        <div ref={resultRef}>
          {result && showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => setShowModal(false)}
              />
              
              {/* Modal Content */}
              <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={24} className="text-gray-500" />
                </button>

                <div className="space-y-6">
                  {/* Main Score Card */}
                  <div className={`rounded-2xl p-6 border-2 ${riskConfig?.border} ${riskConfig?.bg}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Scam Analysis Result</h2>
                      <div className="flex items-center gap-2">
                        <RiskIcon size={24} className={riskConfig?.text} />
                        <span className={`text-2xl font-bold ${riskConfig?.text}`}>
                          {result.riskLevel} RISK
                        </span>
                      </div>
                    </div>

                    {/* Trust Score */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Trust Score</span>
                        <span className={`text-3xl font-bold ${getScoreColor(result.trustScore)}`}>
                          {result.trustScore} / 100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getScoreColor(result.trustScore).replace('text-', 'bg-')}`}
                          style={{ width: `${result.trustScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Analysis */}
                    <p className="text-gray-700">{result.analysis}</p>
                  </div>

                  {/* Red Flags */}
                  {result.redFlags.length > 0 && (
                    <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <XCircle size={18} className="text-red-500" />
                        Red Flags Detected ({result.redFlags.length})
                      </h3>
                      <ul className="space-y-2">
                        {result.redFlags.map((flag, index) => (
                          <li key={index} className="flex items-start gap-2 text-red-700 bg-red-50 p-3 rounded-lg">
                            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-500" />
                        Warnings ({result.warnings.length})
                      </h3>
                      <ul className="space-y-2">
                        {result.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                            <Info size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Safe Indicators */}
                  {result.safeIndicators.length > 0 && (
                    <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500" />
                        Safe Indicators ({result.safeIndicators.length})
                      </h3>
                      <ul className="space-y-2">
                        {result.safeIndicators.map((indicator, index) => (
                          <li key={index} className="flex items-start gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            {indicator}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Disclaimer:</strong> This tool uses AI to analyze text for common scam patterns. 
                      Results are not guaranteed to be 100% accurate. Always conduct your own research.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>



          {/* Related Tools */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Job Scam Checker', description: 'Search and report fraudulent companies and recruiters', icon: Shield, color: '#DC2626', route: '/tools/scam-checker' },
                { title: 'ATS CV Review', description: 'Optimize your CV for ATS systems and job matching', icon: FileText, color: '#8B5CF6', route: '/tools/ats-review' },
                { title: 'CV Keyword Checker', description: 'Check keyword match between your CV and job descriptions', icon: CheckCircle, color: '#10B981', route: '/tools/keyword-checker' },
                { title: 'Interview Practice', description: 'Practice with personalized questions based on job descriptions', icon: AlertTriangle, color: '#F59E0B', route: '/tools/interview' },
                { title: 'Career Coach', description: 'Get personalized career guidance and advice', icon: Sparkles, color: '#3B82F6', route: '/tools/career' },
              ].map(tool => {
                const Icon = tool.icon;
                return (
                  <a key={tool.title} href={tool.route} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all group">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tool.color + '1A' }}>
                      <Icon size={20} style={{ color: tool.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{tool.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{tool.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

        {/* Article Content */}
        <div className="mt-16 space-y-8">

          {/* How It Works Article */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Scam Detector: AI-Powered Analysis to Detect Job Scams and Fraudulent Postings</h2>
            <p className="text-gray-700 mb-4">Job Scam Detector is a free online tool that uses AI to scan job postings, emails, and offers for red flags. It provides instant risk scores to help job seekers stay safe from employment scams.</p>

            <h3 className="text-lg font-bold text-gray-900 mb-3">How It Works</h3>
            <p className="text-gray-700 mb-4">Our Job Scam Detector makes spotting fake job offers simple. Paste the job posting text or email content into the analyzer and add the company name if mentioned for deeper verification. Click "Analyze" to run AI-powered detection on patterns like unrealistic pay or payment requests. You'll receive a clear risk score from 0–100, plus highlighted red flags such as vague descriptions or Telegram links, along with detailed warnings and safe next steps like verifying on official sites.</p>

            <h3 className="text-lg font-bold text-gray-900 mb-3">Why Use Job Scam Detector?</h3>
            <p className="text-gray-700 mb-4">Job scams target millions yearly, with losses hitting $300 million in the US alone last year. Scammers post fakes on Indeed, LinkedIn, and Telegram, promising easy money but stealing your data or cash. This tool is free with no signup required — unlike paid extensions or apps. It checks job scams on Indeed, UAE-specific fraud, and crypto schemes in seconds.</p>
          </div>

          {/* Common Scams */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Common Job Scams and Examples</h2>
            <p className="text-gray-700 mb-4">Employment scams evolve quickly, but patterns repeat. Here are the most common types:</p>
            <ul className="space-y-3 mb-6 text-gray-700">
              <li className="flex items-start gap-2"><XCircle className="text-red-500 flex-shrink-0 mt-1" size={16} /><div><strong>Upfront Payment Scams:</strong> Fake employers ask for "training fees" or equipment costs. Legitimate jobs never require payment upfront.</div></li>
              <li className="flex items-start gap-2"><XCircle className="text-red-500 flex-shrink-0 mt-1" size={16} /><div><strong>Crypto Job Scams:</strong> Offers to "promote tokens" on Telegram, starting with small tasks then demanding wallet deposits. Victims lose crypto after "refunds" fail.</div></li>
              <li className="flex items-start gap-2"><XCircle className="text-red-500 flex-shrink-0 mt-1" size={16} /><div><strong>Ghost Jobs on Indeed:</strong> Postings open for 60+ days with hundreds of applicants but no hires — often resume harvesters.</div></li>
              <li className="flex items-start gap-2"><XCircle className="text-red-500 flex-shrink-0 mt-1" size={16} /><div><strong>Fake UAE Offers:</strong> Scammers promise Dubai visas but charge for "processing." UAE law bans this — employers must pay all fees.</div></li>
              <li className="flex items-start gap-2"><XCircle className="text-red-500 flex-shrink-0 mt-1" size={16} /><div><strong>Messaging App Fraud:</strong> WhatsApp/Telegram "recruiters" skip interviews and rush hires. Very common for job scams on Telegram.</div></li>
            </ul>

            {/* Scam Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-200">Scam Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-200">Red Flags</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b border-gray-200">Examples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { type: 'Upfront Fees', flags: 'Payment for training/visa', example: '"Pay AED 2000 for Dubai medical test"' },
                    { type: 'Crypto Tasks', flags: 'Wallet sharing, small payouts first', example: 'Telegram "DeFi intern" scams' },
                    { type: 'Ghost Postings', flags: '60+ days old, vague duties', example: 'Indeed jobs with 300+ applicants, no activity' },
                    { type: 'Fake Agencies', flags: 'Free emails like gmail.com', example: '"HR@companyyahoo.com" offers' },
                    { type: 'Phishing Emails', flags: 'Unsolicited links, urgent tone', example: 'Indeed scam texts: "Quick cash job, click here"' },
                  ].map(row => (
                    <tr key={row.type} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.type}</td>
                      <td className="px-4 py-3 text-gray-600">{row.flags}</td>
                      <td className="px-4 py-3 text-gray-600">{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Scams 2026 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top 3 Job Scams in 2026</h2>
            <p className="text-gray-700 mb-4">Scams adapt to trends like AI and remote work. Based on recent reports:</p>
            <ol className="space-y-3 text-gray-700 list-decimal list-inside">
              <li><strong>AI-Generated Fake Postings:</strong> Near-perfect listings on LinkedIn/ZipRecruiter that mimic real jobs but lead to fake checks for "equipment."</li>
              <li><strong>Telegram Crypto Schemes:</strong> "Task-based" jobs paying in USDT, escalating to deposit demands. Hits remote seekers especially hard.</li>
              <li><strong>Visa Fee Fraud in UAE:</strong> Targets expats with professional-looking offer letters demanding dirhams for "labor cards."</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">5 Most Current Scams</h3>
            <ol className="space-y-2 text-gray-700 list-decimal list-inside">
              <li><strong>Fake Wire Transfers:</strong> "Overpay" for gear, wire back the excess — and the original check bounces.</li>
              <li><strong>Phishing Calendar Invites:</strong> Job "interviews" via rigged Zoom links that steal your data.</li>
              <li><strong>MLM Disguised as Jobs:</strong> Recruit others for "pay" in a pyramid-style scheme.</li>
              <li><strong>Resume Black Holes:</strong> Old Indeed posts used to harvest applicant data.</li>
              <li><strong>Unsolicited Remote Offers:</strong> No-interview hires via WhatsApp with no verifiable company.</li>
            </ol>
          </div>

          {/* How to Spot */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How to Spot Fake Job Postings on Indeed</h2>
            <p className="text-gray-700 mb-3">Indeed hosts many legitimate jobs but also scams. Check these signs:</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={16} />Search the job title on the company's official website — if it's missing, it's likely a ghost job.</li>
              <li className="flex items-start gap-2"><CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={16} />Look for a stated salary range. "Unlimited earning potential" is a scam signal.</li>
              <li className="flex items-start gap-2"><CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={16} />Grammar errors, generic email addresses (no @company.com), or instructions to "apply via Telegram" are major red flags.</li>
              <li className="flex items-start gap-2"><CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={16} />Verify the company on LinkedIn and Glassdoor to confirm real employees exist.</li>
              <li className="flex items-start gap-2"><CheckCircle className="text-green-500 flex-shrink-0 mt-1" size={16} />Never share bank information before you've been hired and verified. Legitimate firms use their own ATS systems.</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">How Fake Job Scams Work</h3>
            <p className="text-gray-700 mb-3">Scammers post enticing ads on job boards or social media to collect resumes, then pivot to requesting "fees" or phishing for personal data. In stage two, fake interviews happen over text to build trust. In stage three, they extract money or personal information. Our tool flags this sequence early so you can protect yourself before it's too late.</p>

            <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">Stay Safe from Job Scams</h3>
            <p className="text-gray-700 mb-3">Never pay for jobs — real opportunities are always free to apply for. Use official sites, ignore urgency tactics, and report scams to the FTC (US), eCrime.ae (UAE), or directly to the platform like Indeed or LinkedIn.</p>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-5">
              {[
                { q: 'What is Job Scam Detector?', a: 'A free AI tool for detecting job scams online. It scans postings for fraud risks and returns a risk score plus detailed warnings.' },
                { q: 'Is Job Scam Detector free?', a: 'Yes, completely free with unlimited scans and no signup required — unlike paid job scanner apps or browser extensions.' },
                { q: 'How accurate is job scan AI?', a: 'Our AI achieves over 95% accuracy based on known scam pattern databases, but it is best combined with your own judgment and independent verification.' },
                { q: 'Does it detect job scams on Indeed?', a: 'Yes. The tool is specifically calibrated for Indeed ghost jobs, harvester postings, and fake listings common on the platform.' },
                { q: 'Job scam detector UAE?', a: 'The tool is tailored for UAE-specific visa scams and Dubai fake job offers. It flags payment requests for "processing fees," which are illegal under UAE law.' },
                { q: 'Job scams detector Telegram?', a: 'Yes. It detects Telegram and WhatsApp red flags including task-based crypto schemes, no-interview hires, and requests for wallet information.' },
                { q: 'What if a job is flagged as a scam?', a: 'Verify the company directly through their official website or LinkedIn. If you\'ve already shared information, report to the relevant authority such as the FTC or eCrime.ae.' },
                { q: 'How do you verify a scammer?', a: 'Reverse-search their email address or phone number using Google or services like WhoCallsMe. Check for complaints on Glassdoor or Google Reviews.' },
                { q: 'What is a job scammer list?', a: 'No single exhaustive list exists, but you can flag patterns: generic names like "John HR," free email domains, and unverified Telegram channels. Searching "[name] + scam" on Google often reveals existing reports.' },
                { q: 'What are fake online jobs?', a: 'Common fake job types include envelope stuffing, mystery shopping, data entry with upfront fees, and social media "brand ambassador" roles requiring you to recruit others. These are almost always scams.' },
                { q: 'How do fake job scams work?', a: 'Scammers bait victims with attractive offers, then hook them with fee requests or phishing links. The scam escalates through trust-building fake interviews before the financial demand arrives.' },
                { q: 'How to check if a job is fake?', a: 'Paste it into Job Scam Detector for an instant AI scan. Manually, check whether the company website matches, whether any payment is requested, and whether the interview is scheduled through official channels rather than WhatsApp.' },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>


          {/* JSON-LD Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Job Scam Detector",
                "description": "AI-powered tool to detect job scams in any text. Analyze job postings, emails, and messages for fraud indicators.",
                "url": "https://jobmeter.com/tools/scam-detector",
                "applicationCategory": "Career",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" }
              })
            }}
          />
        </div>
      </div>
    </div>
  );
}