'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Loader2, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NotificationManager() {
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedSector, setSelectedSector] = useState('');

  const sectors = [
    "Information Technology & Software",
    "Engineering & Manufacturing", 
    "Finance & Banking",
    "Healthcare & Medical",
    "Education & Training",
    "Sales & Marketing",
    "Human Resources & Recruitment",
    "Customer Service & Support",
    "Media Advertising & Communications",
    "Design Arts & Creative",
    "Construction & Real Estate",
    "Logistics Transport & Supply Chain",
    "Agriculture & Agribusiness",
    "Energy & Utilities",
    "Legal & Compliance",
    "Government & Public Administration",
    "Retail & E-commerce",
    "Hospitality & Tourism",
    "Science & Research",
    "Security & Defense",
    "Telecommunications",
    "Nonprofit & NGO",
    "Environment & Sustainability",
    "Product Management & Operations",
    "Data & Analytics"
  ];

// Initialize email and sector from localStorage on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('subscriber-email');
    const storedSector = localStorage.getItem('subscriber-sector');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (storedSector) {
      setSelectedSector(storedSector);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🔔 NotificationManager mounted');

    // Show email prompt after 20 seconds
    const emailTimer = setTimeout(() => {
      const dismissed = localStorage.getItem('email-prompt-dismissed');
      const subscribed = localStorage.getItem('email-subscribed');
      const storedEmail = localStorage.getItem('subscriber-email');
      const storedSector = localStorage.getItem('subscriber-sector');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      // Don't show if already subscribed with a valid email
      if (!subscribed || !storedEmail) {
          if (!dismissed || daysSinceDismissed > 7) {
          setShowEmailPrompt(true);
          // Pre-fill email and sector if we have them stored
          if (storedEmail) {
            setEmail(storedEmail);
          }
          if (storedSector) {
            setSelectedSector(storedSector);
          }
        }
      }
}, 20000); // 20 seconds

    return () => {
      clearTimeout(emailTimer);
    };
  }, []);

const handleEmailSubscribe = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Save email and sector to database
      const { error } = await supabase
        .from('email_subscribers')
        .upsert(
          {
            email: email,
            sector: selectedSector,
            source: 'homepage_popup',
            created_at: new Date().toISOString(),
            status: 'active'
          },
          {
            onConflict: 'email'
          }
        );

      if (error) {
        console.error('❌ Database error:', error);
        setError('Failed to subscribe. Please try again.');
        return;
      }

// Show success message
      setSuccess(true);
      localStorage.setItem('email-subscribed', 'true');
      localStorage.setItem('subscriber-email', email);
      localStorage.setItem('subscriber-sector', selectedSector);
      
      // Trigger system notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ Successfully Subscribed!', {
          body: 'You\'ll now receive daily job alerts via email.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }

// Hide prompt after success
      setTimeout(() => {
        setShowEmailPrompt(false);
        setSuccess(false);
        setEmail('');
        setSelectedSector('');
      }, 3000);

    } catch (err) {
      console.error('❌ Error in handleEmailSubscribe:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowEmailPrompt(false);
    localStorage.setItem('email-prompt-dismissed', Date.now().toString());
  };

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* Email Subscription Prompt */}
      {showEmailPrompt && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="text-white" size={24} />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="font-semibold text-gray-900">Get Job Alerts</h3>
              <p className="text-sm text-gray-600 mt-1">
                Subscribe to get daily job updates.
              </p>

              {/* Sector Dropdown */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="">Select your sector (optional)</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>

              {success ? (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ Successfully subscribed!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    You'll receive daily job alerts via email.
                  </p>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailSubscribe()}
                  />

                  {error && (
                    <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">{error}</p>
                  )}

                  <button
                    onClick={handleEmailSubscribe}
                    disabled={isLoading}
                    className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      'Subscribe'
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
