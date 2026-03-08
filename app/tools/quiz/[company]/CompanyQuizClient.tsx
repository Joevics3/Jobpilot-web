"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { ClipboardList, FileText, ArrowLeft, Lock, Loader2 } from 'lucide-react';

interface CompanyData {
  id?: string;
  name?: string;
  description?: string;
}

export default function CompanyQuizClient({ company, companyData }: { company: string; companyData?: CompanyData | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'objective' | 'theory' | null>(null);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [useTimer, setUseTimer] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [company]);

  const handleObjectiveStart = () => {
    const url = useTimer 
      ? `/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/objective?timer=1`
      : `/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/objective`;
    router.push(url);
  };

  const handleTheoryStart = () => {
    const url = useTimer 
      ? `/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/theory?timer=1`
      : `/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/theory`;
    setSelectedType('theory');
    router.push(url);
  };

  const verifyPassword = async () => {
    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('quiz_passwords')
        .select('*')
        .ilike('company', company)
        .eq('password', password)
        .single();

      if (queryError || !data) {
        setError('Invalid password');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This password has expired');
        return;
      }

      router.push(`/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/theory`);
    } catch (err) {
      setError('Invalid password');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.muted }}>
        <Loader2 className="animate-spin" size={32} style={{ color: theme.colors.primary.DEFAULT }} />
      </div>
    );
  }

  if (selectedType === 'theory') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <div className="px-4 py-3" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
          <div className="max-w-md mx-auto">
            <button onClick={() => setSelectedType(null)} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}>
                <Lock size={20} style={{ color: theme.colors.primary.DEFAULT }} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{company} Theory</h2>
                <p className="text-xs text-gray-600">Enter password</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                {error}
              </div>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2.5 border rounded-lg mb-3 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
            />

            <button
              onClick={verifyPassword}
              disabled={verifying}
              className="w-full py-2.5 rounded-lg font-medium text-sm"
              style={{ backgroundColor: theme.colors.primary.DEFAULT, color: '#fff' }}
            >
              {verifying ? 'Verifying...' : 'Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      <div className="px-4 py-3" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/tools/quiz" className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">All Companies</span>
          </Link>
          <span className="text-white font-medium text-sm">{company}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}>
            <span className="text-2xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>
              {company.charAt(0)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{company}</h1>
          <p className="text-sm text-gray-600">Aptitude test practice</p>
        </div>

        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="useTimer"
            checked={useTimer}
            onChange={(e) => setUseTimer(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <label htmlFor="useTimer" className="text-sm text-gray-700">
            Track time spent
          </label>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleObjectiveStart}
            className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3"
            style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}>
              <ClipboardList size={20} style={{ color: theme.colors.primary.DEFAULT }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Objective</h3>
              <p className="text-xs text-gray-500">20 questions</p>
            </div>
          </button>

          <button
            onClick={handleTheoryStart}
            className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-3"
            style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}>
              <FileText size={20} style={{ color: theme.colors.primary.DEFAULT }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-gray-900 text-sm">Theory</h3>
                <Lock size={12} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">5 questions • AI graded</p>
            </div>
          </button>
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4" style={{ backgroundColor: '#EFF6FF' }}>
          <p className="text-xs text-gray-600">
            Answer all questions, then submit to see results with explanations.
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
         <b>Disclaimer:</b> This quiz is for educational purposes only. JobMeter has no affiliation to {company}.
        </p>

        {/* SEO Content */}
        {companyData?.description && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-white rounded-xl p-5 shadow-sm" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About {company}</h2>
              <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: companyData.description }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
