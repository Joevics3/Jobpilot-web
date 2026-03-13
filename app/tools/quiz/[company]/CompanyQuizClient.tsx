"use client";
// 📁 app/tools/quiz/[company]/CompanyQuizClient.tsx

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quizSupabase } from '@/lib/quizSupabase';
import { getCached, setCached, CACHE_KEYS } from '@/lib/quizCache';
import { theme } from '@/lib/theme';
import {
  ClipboardList,
  FileText,
  ArrowLeft,
  Lock,
  Loader2,
  X,
  CreditCard,
  Smartphone,
  DollarSign,
  MessageCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface CompanyData {
  id?: string;
  name?: string;
  description?: string;
}

export default function CompanyQuizClient({
  company,
  companyData,
}: {
  company: string;
  companyData?: CompanyData | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'objective' | 'theory' | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [useTimer, setUseTimer] = useState(false);
  const [questionCount, setQuestionCount] = useState<20 | 50>(20);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'objective-50' | 'theory' | null>(null);

  useEffect(() => {
    fetchSections();
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [company]);

  const fetchSections = async () => {
    const cached = getCached<string[]>(CACHE_KEYS.sections(company));
    if (cached) { setSections(cached); return; }

    try {
      const { data } = await quizSupabase
        .from('objective_questions')
        .select('section')
        .ilike('company', company);

      if (data) {
        const uniqueSections = [...new Set(data.map((q) => q.section).filter(Boolean))];
        setSections(uniqueSections);
        setCached(CACHE_KEYS.sections(company), uniqueSections);
      }
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  // --- Navigation helpers ---

  const startObjective = (section: string, count: number) => {
    const url = `/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/objective?timer=${
      useTimer ? '1' : '0'
    }&section=${encodeURIComponent(section)}&count=${count}`;
    router.push(url);
  };

  const startTheory = () => {
    const url = `/tools/quiz/${company.toLowerCase().replace(/\s+/g, '-')}/theory${
      useTimer ? '?timer=1' : ''
    }`;
    router.push(url);
  };

  // --- Click handlers ---

  const handle20Questions = () => {
    setQuestionCount(20);
    if (sections.length > 0) {
      setSelectedType('objective');
    } else {
      startObjective('general', 20);
    }
  };

  const handle50Questions = () => {
    setPendingAction('objective-50');
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handleTheoryClick = () => {
    setPendingAction('theory');
    setShowPasswordModal(true);
    setPassword('');
    setError('');
  };

  const handleSectionSelect = (section: string) => {
    startObjective(section, questionCount);
    setSelectedType(null);
  };

  // --- Password verification ---

  const handlePasswordVerify = async () => {
    if (!password.trim()) {
      setError('Please enter your access password.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data, error: queryError } = await quizSupabase
        .from('quiz_passwords')
        .select('*')
        .eq('password', password.trim())
        .single();

      if (queryError || !data) {
        setError('Incorrect password. Please check and try again.');
        setVerifying(false);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This password has expired. Please renew your subscription.');
        setVerifying(false);
        return;
      }

      // ✅ Password valid – proceed
      setShowPasswordModal(false);

      if (pendingAction === 'objective-50') {
        setQuestionCount(50);
        if (sections.length > 0) {
          setSelectedType('objective');
        } else {
          startObjective('general', 50);
        }
      } else if (pendingAction === 'theory') {
        startTheory();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // --- Loading state ---

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background.muted }}
      >
        <Loader2
          className="animate-spin"
          size={32}
          style={{ color: theme.colors.primary.DEFAULT }}
        />
      </div>
    );
  }

  // --- Section selection (after choosing 20/50 questions) ---

  if (selectedType === 'objective' && sections.length > 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
        <div className="px-4 py-3" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setSelectedType(null)}
              className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <span className="text-white font-medium text-sm">{company}</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Choose a Section</h2>
          <p className="text-xs text-gray-500 mb-4">
            Select a specific section or take a mixed general quiz.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSectionSelect('general')}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: theme.colors.primary.DEFAULT }}
            >
              General (Mixed)
            </button>
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => handleSectionSelect(section)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
                style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Main company page ---

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/tools/quiz"
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">All Companies</span>
          </Link>
          <span className="text-white font-medium text-sm">{company}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Company badge */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}
          >
            <span
              className="text-2xl font-bold"
              style={{ color: theme.colors.primary.DEFAULT }}
            >
              {company.charAt(0)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{company}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Aptitude Test Practice</p>
        </div>

        {/* Timer toggle */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-white rounded-lg" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <input
            type="checkbox"
            id="useTimer"
            checked={useTimer}
            onChange={(e) => setUseTimer(e.target.checked)}
            className="w-4 h-4"
            style={{ accentColor: theme.colors.primary.DEFAULT }}
          />
          <label htmlFor="useTimer" className="text-sm text-gray-700 cursor-pointer">
            Track time spent
          </label>
        </div>

        {/* Objective section */}
        <div
          className="bg-white rounded-xl p-4 mb-3"
          style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}
            >
              <ClipboardList size={18} style={{ color: theme.colors.primary.DEFAULT }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Objective Questions</h3>
              <p className="text-xs text-gray-500">Multiple choice • Instant results</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">How many questions do you want?</p>

          <div className="grid grid-cols-2 gap-2">
            {/* 20 questions — free */}
            <button
              onClick={handle20Questions}
              className="py-3 rounded-lg text-sm font-medium text-white flex flex-col items-center gap-0.5"
              style={{ backgroundColor: theme.colors.primary.DEFAULT }}
            >
              <span className="font-bold">20 Questions</span>
              <span className="text-xs opacity-80">Free</span>
            </button>

            {/* 50 questions — paid */}
            <button
              onClick={handle50Questions}
              className="py-3 rounded-lg text-sm font-medium flex flex-col items-center gap-0.5 bg-amber-50 text-amber-800"
              style={{ border: '1.5px solid #F59E0B' }}
            >
              <span className="font-bold flex items-center gap-1">
                50 Questions <Lock size={12} />
              </span>
              <span className="text-xs opacity-70">Premium</span>
            </button>
          </div>
        </div>

        {/* Theory section */}
        <button
          onClick={handleTheoryClick}
          className="w-full bg-white rounded-xl p-4 mb-3 text-left flex items-center gap-3 hover:shadow-sm transition-shadow"
          style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${theme.colors.primary.DEFAULT}15` }}
          >
            <FileText size={18} style={{ color: theme.colors.primary.DEFAULT }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 text-sm">Theory Questions</h3>
              <Lock size={12} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500">5 questions • AI-graded • Premium</p>
          </div>
        </button>

        {/* Premium teaser */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}
        >
          <div className="flex items-start gap-2">
            <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-1">
                Premium Access — ₦2,000/month · $10/month
              </p>
              <p className="text-xs text-amber-700 mb-2">
                Unlock 50-question objective sets and AI-graded theory sessions. Perfect for
                serious exam preparation.
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-xs font-semibold text-amber-900 underline underline-offset-2"
              >
                How to get access →
              </button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div
          className="rounded-xl p-4 mt-2"
          style={{ backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD' }}
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 size={15} className="text-sky-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-sky-900 leading-relaxed">
              <strong>About these questions:</strong> The questions on this platform are carefully
              crafted to reflect the style, format, and difficulty level of{' '}
              <strong>{company}</strong>'s aptitude tests. They are not leaked or copied from any
              official exam — they are original practice questions designed to give you a genuine
              feel for what to expect. JobMeter is an independent platform and has no affiliation
              with {company} or any of the organisations featured here.
            </p>
          </div>
        </div>

        {/* SEO / About section */}
        {companyData?.description && (
          <div className="mt-6 pt-5 border-t border-gray-200">
            <div
              className="bg-white rounded-xl p-5"
              style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
            >
              <h2 className="text-base font-bold text-gray-900 mb-2">About {company}</h2>
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: companyData.description }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Password Modal ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">
                {pendingAction === 'theory'
                  ? 'Theory Quiz — Premium'
                  : '50 Questions — Premium'}
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setError('');
                }}
              >
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Enter your monthly access password. Don't have one?{' '}
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setShowPaymentModal(true);
                }}
                className="text-blue-600 font-medium underline underline-offset-2"
              >
                Get access
              </button>
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm">
                {error}
              </div>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter access password"
              className="w-full px-3 py-2.5 border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2"
              style={{ borderColor: theme.colors.border.DEFAULT }}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordVerify()}
              autoFocus
            />

            <button
              onClick={handlePasswordVerify}
              disabled={verifying}
              className="w-full py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary.DEFAULT, color: '#fff' }}
            >
              {verifying ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
        </div>
      )}

      {/* ── Payment / How-to-get-access Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 text-base">Get Premium Access</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              One subscription covers all premium quizzes on JobMeter — ₦2,000/month or $10/month.
            </p>

            {/* Coming soon: automated payments */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Online Payment — Coming Soon
              </p>
              <div
                className="flex items-center gap-3 p-3 rounded-xl opacity-50"
                style={{ border: '1px dashed #D1D5DB', backgroundColor: '#F9FAFB' }}
              >
                <Smartphone size={18} className="text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Paystack — ₦2,000/month</p>
                  <p className="text-xs text-gray-400">Cards, bank transfer, USSD</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Soon
                </span>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-xl opacity-50"
                style={{ border: '1px dashed #D1D5DB', backgroundColor: '#F9FAFB' }}
              >
                <DollarSign size={18} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">USD Payment — $10/month</p>
                  <p className="text-xs text-gray-400">International card & dollar payment</p>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Soon
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">Available Now</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* WhatsApp manual flow */}
            <div
              className="rounded-xl p-3 mb-4"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
              <p className="text-xs font-semibold text-green-800 mb-1.5">How it works</p>
              <ol className="text-xs text-green-900 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Send ₦2,000 (or $10) via bank transfer or any method you prefer</li>
                <li>Message us on WhatsApp with your payment proof</li>
                <li>We'll send your access password — usually within a few hours</li>
                <li>Enter the password to unlock 50-question sets &amp; theory quizzes</li>
              </ol>
            </div>

            <div className="space-y-2">
              <a
                href="https://wa.me/2347056928186?text=Hi%2C%20I%20just%20made%20payment%20for%20JobMeter%20Quiz%20Premium%20access.%20Please%20send%20my%20password."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={16} />
                WhatsApp Us (+234 705 692 8186)
              </a>

              <a
                href="mailto:help.jobmeter@gmail.com?subject=Quiz%20Premium%20Access&body=Hi%2C%20I%20just%20made%20payment%20for%20JobMeter%20Quiz%20Premium%20access.%20Please%20send%20my%20password."
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
                style={{ border: `1.5px solid ${theme.colors.border.DEFAULT}`, color: theme.colors.primary.DEFAULT }}
              >
                <CreditCard size={15} />
                Email Us (help.jobmeter@gmail.com)
              </a>
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              WhatsApp for fastest response · Email replies within 24–48 hrs
            </p>
          </div>
        </div>
      )}
    </div>
  );
}