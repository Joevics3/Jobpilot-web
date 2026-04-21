'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Mail, Lock, Phone, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ApplyForMeSubmitPage() {
  const [profileEmail, setProfileEmail] = useState('');
  const [dedicatedEmail, setDedicatedEmail] = useState('');
  const [dedicatedPassword, setDedicatedPassword] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();

      // Not logged in — send to apply-for-me to sign in + pay
      if (!user) {
        router.replace('/apply-for-me');
        return;
      }

      setProfileEmail(user.email ?? '');

      // Already submitted — send straight to dashboard
      const { data: submission } = await supabase
        .from('apply_for_me_submissions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (submission) {
        router.replace('/apply-for-me/dashboard');
        return;
      }

      // Check payment_transactions for a completed apply_for_me payment.
      // The old code queried a 'subscriptions' table that doesn't exist, which
      // always returned nothing, causing every user to be bounced back even
      // after a successful payment. localStorage was the only fallback, but
      // Paystack's full-page redirect clears in-flight JS state so the flag
      // set in handlePaymentSuccess never survived to be read here.
      const { data: tx } = await supabase
        .from('payment_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_type', 'apply_for_me')
        .eq('status', 'completed')
        .maybeSingle();

      if (tx) {
        setChecking(false);
        return;
      }

      // No completed payment found — redirect back
      router.replace('/apply-for-me');
    }

    checkAccess();
  }, [router]);

  const handleSubmit = async () => {
    if (!dedicatedEmail || !dedicatedPassword || !whatsappNumber) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Fetch profile + onboarding data in parallel
      const [{ data: profile }, { data: onboarding }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      // Upsert into apply_for_me_submissions — handles re-submissions gracefully
      const { error: insertError } = await supabase
        .from('apply_for_me_submissions')
        .upsert({
          user_id: user.id,
          // from profiles
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? user.email,
          phone: profile?.phone ?? null,
          location: profile?.location ?? null,
          // from onboarding
          cv_roles: onboarding?.cv_roles ?? null,
          target_roles: onboarding?.target_roles ?? null,
          preferred_locations: onboarding?.preferred_locations ?? null,
          experience_level: onboarding?.experience_level ?? null,
          job_type: onboarding?.job_type ?? null,
          remote_preference: onboarding?.remote_preference ?? null,
          salary_min: onboarding?.salary_min ?? null,
          salary_max: onboarding?.salary_max ?? null,
          sector: onboarding?.sector ?? null,
          cv_skills: onboarding?.cv_skills ?? null,
          cv_linkedin: onboarding?.cv_linkedin ?? null,
          cv_portfolio: onboarding?.cv_portfolio ?? null,
          cv_file_name: onboarding?.cv_file_name ?? null,
          // from form
          dedicated_gmail: dedicatedEmail,
          dedicated_gmail_password: dedicatedPassword,
          whatsapp_number: whatsappNumber,
        }, { onConflict: 'user_id' });

      if (insertError) throw insertError;

      // Redirect to dashboard
      router.push('/apply-for-me/dashboard');

    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto">

        {/* Back Button */}
        <button
          onClick={() => router.push('/apply-for-me')}
          className="flex items-center gap-3 text-gray-500 hover:text-gray-700 mb-10 group"
        >
          <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center group-hover:border-amber-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Back to Apply for Me</span>
        </button>

        {/* Page header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-700 text-xs font-semibold tracking-wide uppercase">Almost there</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Send us your details</h1>
          <p className="text-gray-500 text-base leading-relaxed">
            We need these to start applying on your behalf. Everything is handled securely.
          </p>
        </div>

        <div className="space-y-4">

          {/* Profile email — auto-filled, read-only */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-1">
              <label className="text-sm font-semibold text-gray-700">JobMeter Profile Email</label>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Auto-filled</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">Pulled from your logged-in account</p>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-300" />
              <input
                type="email"
                value={profileEmail}
                readOnly
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          {/* Dedicated Gmail */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Dedicated Gmail Address <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">Create a fresh Gmail account specifically for job applications</p>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={dedicatedEmail}
                onChange={(e) => setDedicatedEmail(e.target.value)}
                placeholder="yourapplications@gmail.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Dedicated Gmail Password */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Dedicated Gmail Password <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">We only use this to submit applications. You can change it anytime.</p>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={dedicatedPassword}
                onChange={(e) => setDedicatedPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-20 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* WhatsApp Number */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Your WhatsApp Number <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">We'll use this to stay in touch and send your monthly report</p>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-400 text-sm transition-colors"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !dedicatedEmail || !dedicatedPassword || !whatsappNumber}
            className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-3 text-base transition-all border border-gray-800 disabled:border-gray-300 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving your details...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Details
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-6">
            Once submitted, our team verifies your details and begins applications within 48 hours.
          </p>
        </div>
      </div>
    </div>
  );
}