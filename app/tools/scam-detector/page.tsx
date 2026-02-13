"use client";

import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader2, Sparkles, Info, AlertOctagon, FileText } from 'lucide-react';
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

  const analyzeText = async () => {
    if (!textToAnalyze.trim() || textToAnalyze.length < 50) {
      setError('Please provide at least 50 characters of text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: apiError } = await supabase.functions.invoke('scam-detector', {
        body: {
          text: textToAnalyze.trim(),
          companyName: companyName.trim() || undefined
        }
      });

      if (apiError) throw apiError;

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setResult(data.data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
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
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
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

        {/* Results Section */}
        {result && (
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
                Results are not guaranteed to be 100% accurate. Always conduct your own research before 
                providing personal information or making any payments to potential employers.
              </p>
            </div>
          </div>
        )}

        {/* SEO Content - Improved */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Scam Detection</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Analyze any job posting, email, or message for scam indicators using advanced AI technology.</p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-3">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Trust Score</h3>
              <p className="text-sm text-gray-700">Get an instant 0-100 trust score for any job posting.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Red Flag Detection</h3>
              <p className="text-sm text-gray-700">AI identifies payment requests, poor grammar, and suspicious patterns.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Safe Indicators</h3>
              <p className="text-sm text-gray-700">See positive signs that indicate legitimate opportunities.</p>
            </div>
          </div>

          {/* Main SEO Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                How the AI Scam Detector Works
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>Our AI analyzes job postings, emails, and messages for hundreds of scam indicators. Simply paste the text you want to check, and our system evaluates it for suspicious patterns.</p>
                <p>The AI provides a trust score from 0-100, with risk levels: LOW (80-100), MEDIUM (60-79), HIGH (40-59), and CRITICAL (0-39). It specifically identifies red flags, warnings, and safe indicators.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                Understanding Trust Scores
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="bg-green-100 rounded-lg p-3 text-center">
                    <div className="text-green-700 font-bold">80-100</div>
                    <div className="text-xs text-green-600">LOW Risk</div>
                  </div>
                  <div className="bg-yellow-100 rounded-lg p-3 text-center">
                    <div className="text-yellow-700 font-bold">60-79</div>
                    <div className="text-xs text-yellow-600">MEDIUM Risk</div>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-3 text-center">
                    <div className="text-orange-700 font-bold">40-59</div>
                    <div className="text-xs text-orange-600">HIGH Risk</div>
                  </div>
                  <div className="bg-red-100 rounded-lg p-3 text-center">
                    <div className="text-red-700 font-bold">0-39</div>
                    <div className="text-xs text-red-600">CRITICAL</div>
                  </div>
                </div>
                <p className="mt-3">Higher scores indicate safer opportunities. Always verify through multiple sources regardless of score.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                Major Red Flags to Watch
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Requests for payment', 'No location for non-remote jobs', 'Inconsistent language/grammar', 'Personal docs before interview', 'Wire transfer requests', 'Unrealistic salaries'].map(flag => (
                    <div key={flag} className="flex items-center gap-2">
                      <XCircle className="text-red-500 flex-shrink-0" size={16} />
                      <span className="text-sm">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Stay Safe from Scams</h3>
              <p className="text-white/90 mb-4">Use our AI-powered detector for every suspicious opportunity. Remember: if it seems too good to be true, it probably is.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free Tool</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">AI-Powered</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Nigeria Focused</span>
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
