'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { requestNotificationPermission, setupForegroundNotifications } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export default function NotificationManager() {
  const [isClient, setIsClient] = useState(false); // Flag to detect client-side
  const [showPrompt, setShowPrompt] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mark component as client-side after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Setup notifications on client-side only
  useEffect(() => {
    if (!isClient) return;

    console.log('🔔 NotificationManager mounted');

    checkAndRequestPermission();

    // Setup foreground notifications
    setupForegroundNotifications((payload) => {
      console.log('📬 Notification received:', payload);
      setLatestNotification(payload);
      setTimeout(() => setLatestNotification(null), 5000);
    });

    // Periodically check permission to hide prompt if granted/denied
    const interval = setInterval(() => {
      if ('Notification' in window) {
        if (Notification.permission === 'granted' || Notification.permission === 'denied') {
          setShowPrompt(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Check permission and optionally show prompt
  const checkAndRequestPermission = async () => {
    if (!isClient || !('Notification' in window)) {
      console.log('❌ Notifications not supported');
      return;
    }

    const permission = Notification.permission;
    console.log('🔔 Current permission:', permission);

    if (permission === 'granted') {
      console.log('✅ Permission already granted');
      const token = await requestNotificationPermission();
      if (token) await saveTokenToDatabase(token);
    } else if (permission === 'default') {
      // Show prompt after 30 seconds if not recently dismissed
      setTimeout(() => {
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        if (!dismissed || daysSinceDismissed > 3) setShowPrompt(true);
      }, 30000);
    } else {
      console.log('🚫 Permission denied by user');
    }
  };

  // Handle user clicking "Enable Notifications"
  const handleEnableNotifications = async () => {
    if (!isClient || !('Notification' in window)) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await requestNotificationPermission();
      if (token) {
        await saveTokenToDatabase(token);
        setShowPrompt(false);

        setLatestNotification({
          notification: {
            title: '✅ Notifications Enabled',
            body: 'You will now receive daily job updates!',
          },
        });

        setTimeout(() => setLatestNotification(null), 5000);
      } else {
        setError(
          Notification.permission === 'denied'
            ? 'Notifications blocked. Enable them in your browser settings.'
            : 'Failed to enable notifications.'
        );
      }
    } catch (err) {
      console.error('❌ Error enabling notifications:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save FCM token to Supabase
  const saveTokenToDatabase = async (token: string) => {
    try {
      console.log('💾 Saving token to database...');
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('notification_tokens')
        .upsert({
          user_id: user?.id || null,
          token,
          device_type: 'web',
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'token' });

      if (error) console.error('❌ Database error:', error);
      else console.log('✅ Token saved to Supabase');
    } catch (error) {
      console.error('❌ Error in saveTokenToDatabase:', error);
    }
  };

  // Handle user dismissing the prompt
  const handleDismiss = () => {
    console.log('👋 User dismissed prompt');
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  // Only render in browser
  if (!isClient) return null;

  return (
    <>
      {/* Notification Prompt */}
      {showPrompt && Notification.permission === 'default' && (
        <div className="fixed top-4 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 animate-fade-in">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="text-white" size={24} />
            </div>
            <div className="flex-1 pr-6">
              <h3 className="font-semibold text-gray-900">Get Daily Job Updates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Receive 7 daily job notifications + weekly career tips
              </p>

              {error && (
                <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                  {error}
                </p>
              )}

              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enabling...
                  </>
                ) : 'Enable Notifications'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Foreground Notification Display */}
      {latestNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 animate-slide-down">
          <button
            onClick={() => setLatestNotification(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 pr-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                {latestNotification.notification?.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {latestNotification.notification?.body}
              </p>
              {latestNotification.data?.url && (
                <a
                  href={latestNotification.data.url}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                >
                  View Details →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
