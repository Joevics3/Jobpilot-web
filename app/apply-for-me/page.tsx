'use client';

import { useState, useEffect } from 'react';
import { Check, Shield, ChevronDown, FileText, Send, BarChart2, Mail, MessageCircle, Phone } from 'lucide-react';
import ApplyForMeQuiz from '@/components/ApplyForMeQuiz';
import AuthModal from '@/components/AuthModal';
import { ApplyPaymentModal } from '@/components/payment/ApplyPaymentModal';
import { supabase } from '@/lib/supabase';

export default function ApplyForMePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [userStage, setUserStage] = useState<'none' | 'paid' | 'submitted'>('none');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      if (user) checkUserStage(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) checkUserStage(session.user.id);
      else setUserStage('none');
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStage = async (userId: string) => {
    // Check submission first (highest stage)
    const { data: submission } = await supabase
      .from('apply_for_me_submissions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (submission) { setUserStage('submitted'); return; }

    // Check localStorage flag set on payment success
    const paidFlag = localStorage.getItem('afm-paid');
    if (paidFlag === userId) { setUserStage('paid'); return; }

    setUserStage('none');
  };

  const handleAuthModalClose = (open: boolean) => {
    setShowAuthModal(open);
    if (!open) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setShowPaymentModal(true);
      });
    }
  };

  const handleCTAClick = () => {
    // Already submitted — go straight to dashboard
    if (userStage === 'submitted') {
      window.location.href = '/apply-for-me/dashboard';
      return;
    }
    // Paid but not submitted — go to submit page
    if (userStage === 'paid') {
      window.location.href = '/apply-for-me/submit';
      return;
    }
    // Not paid — trigger auth or payment
    if (isLoggedIn === true) {
      setShowPaymentModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) localStorage.setItem('afm-paid', user.id);
    });
    window.location.href = '/apply-for-me/submit';
  };

  const steps = [
    {
      icon: <FileText className="w-6 h-6" />,
      number: "01",
      title: "Register on JobMeter.app",
      desc: "Create your free account. Upload your CV and set your job preferences, target roles, location, and salary expectations. That profile is all we need."
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      number: "02",
      title: "Complete Payment",
      desc: "Pay securely online. Once your payment is confirmed, we'll reach out within 24 hours to guide you through the next steps."
    },
    {
      icon: <Mail className="w-6 h-6" />,
      number: "03",
      title: "Create a Dedicated Gmail",
      desc: "Create a fresh Gmail account for your applications and share the email and password with us. This inbox is how you track every interview invite and employer reply in real time."
    },
    {
      icon: <Send className="w-6 h-6" />,
      number: "04",
      title: "We Apply. Every Month.",
      desc: "We source 10–15 matched roles from JobMeter's database, write tailored cover letters, and manually submit every application — while you focus on your current job."
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      number: "05",
      title: "You Prepare. We Report.",
      desc: "Use our interview prep tools and aptitude quizzes while we keep applying. At month-end, you get a full report of every job we applied to on your behalf."
    }
  ];

  const included = [
    "10–15 curated job applications per month",
    "Professional CV written from scratch",
    "Tailored cover letter per application",
    "Dedicated Gmail inbox to track interview invites",
    "15 credits for JobMeter tools — interview prep, aptitude quizzes, and more",
    "Monthly report of all applications submitted",
    "Extra month free if you get zero interview invites",
  ];

  const faqs = [
    {
      q: "How do I get started?",
      a: "Register on JobMeter.app and complete your profile. Then click the payment button. Once payment is confirmed, we'll reach out within 24 hours — first applications go out within 48 hours of onboarding."
    },
    {
      q: "How does the Gmail work?",
      a: "You create a fresh Gmail account specifically for your job applications, then share the email address and password with us. We use it to apply on your behalf. You can log in anytime to see interview invites and employer replies directly."
    },
    {
      q: "How do I pay?",
      a: "Click the button below to pay securely online."
    },
    {
      q: "Is this available outside Nigeria?",
      a: "Currently, Apply for Me is available to Nigerian job seekers only. We focus on Nigerian and select remote roles sourced through JobMeter."
    },
    {
      q: "What kind of jobs will you apply to?",
      a: "Roles matched to the preferences you set on JobMeter — industry, location, salary range, job type. You can also flag specific companies or roles to exclude."
    },
    {
      q: "Will the CV actually be mine?",
      a: "Yes. It's written entirely from your real background using your JobMeter profile and any CV you upload. You receive a copy."
    },
    {
      q: "What if I already have a CV?",
      a: "Upload it to your JobMeter profile. We'll refine and rewrite it for better results — better formatting, stronger language, ATS-optimised."
    },
    {
      q: "What happens when I get an interview?",
      a: "You show up. That's your job — and it's where our prep tools come in. We keep applying in the background throughout the month."
    },
    {
      q: "Why only 100 people?",
      a: "We apply carefully, not in bulk. Capping at 100 subscribers ensures every application gets real attention — not a copy-paste job."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── HERO ── */}
      <section className="hero-grid px-6 py-24 sm:py-32 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="pill-badge inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-700 text-sm font-medium">Nigeria only · 100 spots/month</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Too Busy to<br />
            <span className="serif italic font-normal text-gray-400">Job Hunt?</span>
          </h1>
          <p className="text-gray-500 text-xl sm:text-2xl leading-relaxed mb-12 max-w-2xl mx-auto">
            We apply to jobs on your behalf — sourced, tailored, and submitted every month — while you focus on life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCTAClick}
              className="cta-button font-semibold py-5 px-10 rounded-2xl inline-flex items-center gap-3 text-lg border border-amber-500"
            >
              <MessageCircle className="w-5 h-5" />
              {userStage === 'submitted'
                ? 'Go to My Dashboard'
                : userStage === 'paid'
                ? 'Complete Your Details'
                : 'Get Started — ₦5,000/mo'}
            </button>
            <a
              href="https://wa.me/2347056928186?text=Hi!%20I%20have%20a%20question%20about%20Apply%20for%20Me."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 py-5 px-10 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:border-green-200 hover:bg-green-50 font-semibold text-lg transition-all"
            >
              <Phone className="w-5 h-5 text-green-500" />
              Ask us anything
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-5">Setup in under 24 hours · Cancel anytime</p>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="px-6 py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-amber-500 text-sm font-medium tracking-widest uppercase mb-4">Sound familiar?</p>
              <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-6 text-gray-900">
                You're not lazy.<br />
                <span className="text-gray-400 font-normal">You're just overwhelmed.</span>
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Between work, family, and daily life, job hunting always falls to the bottom of the list. By the time you sit down to apply, the deadline's already closed.
              </p>
              <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5">
                <p className="text-amber-800 font-semibold text-sm mb-1">The weekend trap</p>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Monday to Friday you're at work. So you save job hunting for the weekend — but most roles were posted mid-week, reviewed by Thursday, and half the slots are already gone by Saturday morning. You're always one week behind.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { emoji: "🕐", text: "You saw a great role on Monday. It's Friday. You still haven't applied." },
                { emoji: "📅", text: "You finally found the perfect job. Posted 3 weeks ago. Already closed." },
                { emoji: "📄", text: "You've been meaning to update your CV for months. It never gets done." },
                { emoji: "💼", text: "You're not unemployed — you're just too busy to find something better." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-5">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                  <p className="text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── QUIZ ── */}
      <section className="px-6 py-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
            <ApplyForMeQuiz
              onCTA={handleCTAClick}
            />
          </div>
        </div>
      </section>

      {/* ── QUIZ MODAL ── */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowQuiz(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <button
              onClick={() => setShowQuiz(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
            <ApplyForMeQuiz
              onCTA={() => { setShowQuiz(false); handleCTAClick(); }}
              onDismiss={() => setShowQuiz(false)}
              compact
            />
          </div>
        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-6 py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-500 text-sm font-medium tracking-widest uppercase mb-4">The process</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">How It Works</h2>
          </div>

          {/* Top row: 3 steps */}
          <div className="grid sm:grid-cols-3 gap-5 mb-5">
            {steps.slice(0, 3).map((s, i) => (
              <div key={i} className="step-card rounded-3xl p-7 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                    {s.icon}
                  </div>
                  <span className="text-5xl font-bold text-gray-100 leading-none">{s.number}</span>
                </div>
                <h3 className="font-semibold text-lg mb-3 leading-snug text-gray-900">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom row: 2 steps, centered */}
          <div className="grid sm:grid-cols-2 gap-5 sm:max-w-2xl sm:mx-auto">
            {steps.slice(3).map((s, i) => (
              <div key={i} className="step-card rounded-3xl p-7 bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                    {s.icon}
                  </div>
                  <span className="text-5xl font-bold text-gray-100 leading-none">{s.number}</span>
                </div>
                <h3 className="font-semibold text-lg mb-3 leading-snug text-gray-900">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="px-6 py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-500 text-sm font-medium tracking-widest uppercase mb-4">Real people</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">What subscribers say</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                "A friend asked how many CVs I was sending out per week. I said maybe 3. He laughed and said that isn't job hunting. It stung because he was right. At least now I can say I'm getting professional help."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">TA</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Tunde Afolabi</p>
                  <p className="text-gray-400 text-xs">Surulere, Lagos</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                "I hate editing my CV. I'd open it on my phone, spend hours trying to fix it in Word, then just give up and not apply at all. This removes that whole problem. I don't have to touch the CV anymore."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">CN</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Chisom Nwoye</p>
                  <p className="text-gray-400 text-xs">Awka</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                "₦5k felt like a risk but I was applying to maybe 2 jobs a month on my own. They sent out 11 in my first month. Even if nothing comes immediately, that volume alone makes sense."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">EB</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Emeka Briggs</p>
                  <p className="text-gray-400 text-xs">Rumuola, Port Harcourt</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <p className="text-gray-700 leading-relaxed mb-6">
                "The monthly report was something I didn't know I needed. Seeing all the companies that now have my CV — it makes the search feel real. Like something is actually happening even when I'm busy."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">FS</div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Fatima Sadiq</p>
                  <p className="text-gray-400 text-xs">Kubwa, Abuja</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="px-6 py-24 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-500 text-sm font-medium tracking-widest uppercase mb-4">Everything included</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">One Price. No Surprises.</h2>
          </div>

          <div className="rounded-3xl border border-gray-200 overflow-hidden mb-10 shadow-sm">
            {included.map((item, i) => (
              <div key={i} className="include-row flex items-center gap-4 px-7 py-5">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-amber-600" />
                </div>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="amber-glow bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-10 text-center">
            <p className="text-amber-600 text-sm font-medium tracking-widest uppercase mb-2">Monthly subscription</p>
            <div className="text-7xl font-bold tracking-tighter mb-1 text-gray-900">₦5,000</div>
            <p className="text-gray-400 text-lg mb-4">per month &nbsp;·&nbsp; cancel anytime</p>
            <p className="text-gray-500 text-sm mb-8">
              Pay securely online. We'll contact you within 24 hours of payment to get started.
            </p>
            <button
              onClick={handleCTAClick}
              className="cta-button font-semibold py-4 px-10 rounded-2xl inline-flex items-center gap-3 text-base border border-amber-500"
            >
              <MessageCircle className="w-5 h-5" />
              {userStage === 'submitted'
                ? 'Go to My Dashboard'
                : userStage === 'paid'
                ? 'Complete Your Details'
                : 'Secure Your Spot'}
            </button>
          </div>
        </div>
      </section>

      {/* ── GUARANTEE + LIMIT ── */}
      <section className="px-6 py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm">
            <Shield className="w-10 h-10 text-emerald-500 mb-6" />
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Our Guarantee</h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              If you complete your first full month with us and don't receive a single interview invite, we give you a second month completely free. No questions. No arguments.
            </p>
            <p className="text-gray-400 text-sm mt-6">
              We apply strategically — every role matched to your profile, every application treated like it matters.
            </p>
          </div>
          <div className="rounded-3xl p-10 bg-gradient-to-br from-orange-50 to-amber-50 border border-amber-200">
            <div className="text-4xl mb-6">⚠️</div>
            <h3 className="text-2xl font-semibold mb-4 text-red-500">Only 100 Spots Per Month</h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              We launched this after a successful trial and the results were clear. We're opening it up — but capping at 100 subscribers to protect the quality of every application.
            </p>
            <p className="text-gray-400 text-sm mt-6">
              Once 100 spots are filled, registration closes until the following month.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOR / NOT FOR ── */}
      <section className="px-6 py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">Is This for You?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-10">
              <p className="text-emerald-600 font-semibold text-sm uppercase tracking-widest mb-8">✓ This is for you if</p>
              <ul className="space-y-5">
                {[
                  "You're a working Nigerian professional who wants a better job but can't find time to apply",
                  "You keep finding great roles after the deadline has already passed",
                  "You procrastinate on applications and know it's costing you opportunities",
                  "You've been sending the same CV everywhere with no results",
                ].map((t, i) => (
                  <li key={i} className="flex gap-4 text-gray-700 leading-relaxed">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-red-100 bg-red-50/50 p-10">
              <p className="text-red-500 font-semibold text-sm uppercase tracking-widest mb-8">✕ This is not for you if</p>
              <ul className="space-y-5">
                {[
                  "You want hundreds of untargeted, bulk applications",
                  "You expect a guaranteed job offer — no one can promise that",
                  "You won't show up or prepare when interview invites come in",
                ].map((t, i) => (
                  <li key={i} className="flex gap-4 text-gray-700 leading-relaxed">
                    <span className="text-red-400 text-lg leading-none flex-shrink-0 mt-0.5">×</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-500 text-sm font-medium tracking-widest uppercase mb-4">Questions</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">FAQ</h2>
          </div>

          <div className="rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-8 py-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-8 pb-7">
                    <p className="text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still have questions? */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">Still have questions? We're happy to help.</p>
            <a
              href="https://wa.me/2347056928186?text=Hi!%20I%20have%20a%20question%20about%20Apply%20for%20Me."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold border border-green-200 bg-green-50 hover:bg-green-100 px-6 py-3 rounded-2xl transition-all text-sm"
            >
              <Phone className="w-4 h-4" />
              Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 py-32 bg-gray-900 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-6">Don't wait another month</p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 text-white">
            The Jobs Won't<br />
            <span className="serif italic font-normal text-white/40">Wait for You.</span>
          </h2>
          <p className="text-gray-400 text-xl leading-relaxed mb-12 max-w-xl mx-auto">
            Register, pay securely, and we'll contact you within 24 hours. First applications go out within 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <button
              onClick={handleCTAClick}
              className="bg-amber-400 hover:bg-amber-300 text-gray-900 font-semibold py-5 px-12 rounded-2xl inline-flex items-center gap-3 text-lg transition-all shadow-2xl border border-amber-500"
            >
              <MessageCircle className="w-6 h-6" />
              Start with Apply for Me
            </button>
            <a
              href="https://wa.me/2347056928186?text=Hi!%20I'd%20like%20to%20learn%20more%20about%20Apply%20for%20Me."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 py-5 px-10 rounded-2xl border border-white/20 text-white hover:bg-white/10 font-semibold text-lg transition-all"
            >
              <Phone className="w-5 h-5 text-green-400" />
              Learn more
            </a>
          </div>
          <p className="text-gray-600 text-sm">
            Currently available for Nigerian job seekers only.
          </p>
        </div>
      </section>

      {/* Modals */}
      <AuthModal open={showAuthModal} onOpenChange={handleAuthModalClose} />
      <ApplyPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        defaultPackage="apply-for-me"
        onAuthRequired={() => setShowAuthModal(true)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}