'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission, setupForegroundNotifications } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export default function NotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [latestNotification, setLatestNotification] = useState<any>(null);

  useEffect(() => {
    checkAndRequestPermission();
    
    // Setup foreground notification handler
    setupForegroundNotifications((payload) => {
      setLatestNotification(payload);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setLatestNotification(null), 5000);
    });
  }, []);

  const checkAndRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const permission = Notification.permission;

    if (permission === 'granted') {
      // Already granted, get token and save
      const token = await requestNotificationPermission();
      if (token) await saveTokenToDatabase(token);
    } else if (permission === 'default') {
      // Show prompt after 5 seconds
      setTimeout(() => {
        const dismissed = localStorage.getItem('notification-prompt-dismissed');
        if (!dismissed) setShowPrompt(true);
      }, 5000);
    }
  };

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission();
    
    if (token) {
      await saveTokenToDatabase(token);
      setShowPrompt(false);
      
      // Show success notification
      setLatestNotification({
        notification: {
          title: '✅ Notifications Enabled',
          body: 'You\'ll now receive daily job updates!',
        },
      });
      
      setTimeout(() => setLatestNotification(null), 5000);
    }
  };

  const saveTokenToDatabase = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('notification_tokens')
        .upsert({
          user_id: user?.id || null,
          token: token,
          device_type: 'web',
          updated_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'token',
        });

      if (error) {
        console.error('Error saving token:', error);
      } else {
        console.log('✅ Token saved to Supabase');
      }
    } catch (error) {
      console.error('Error in saveTokenToDatabase:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Enable Notifications Prompt */}
      {showPrompt && (
        <div className="fixed top-4 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
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
              <button
                onClick={handleEnableNotifications}
                className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Notification Display */}
      {latestNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 animate-slide-down">
          <button
            onClick={() => setLatestNotification(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
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