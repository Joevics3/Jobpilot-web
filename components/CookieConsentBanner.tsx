"use client";

import React, { useState, useEffect } from 'react';
import { X, Shield, Cookie as CookieIcon } from 'lucide-react';
import { setCookieConsent, clearNonEssentialData } from '@/lib/cookies';

interface CookieConsentBannerProps {
  onAccept?: () => void;
  onReject?: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onAccept, onReject }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setIsVisible(true);
    } else if (consent === 'rejected') {
      setIsMinimized(true);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent('accepted');
    setIsVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    setCookieConsent('rejected');
    clearNonEssentialData();
    setIsVisible(false);
    setIsMinimized(true);
    onReject?.();
  };

  const handleCustomize = () => {
    // For minimal implementation, just show basic info
    alert('Cookie Preferences:\n\nEssential cookies: Required for the website to function\nAdvertising cookies: Enable personalized ads through Ezoic\n\nYou can change these preferences anytime in your browser settings.');
  };

  const handleShowSettings = () => {
    setIsMinimized(false);
  };

  if (!isVisible && !isMinimized) return null;

  // Minimized version (floating button)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleShowSettings}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          title="Cookie settings"
        >
          <CookieIcon size={20} />
          <span className="text-sm font-medium">Cookies</span>
        </button>
      </div>
    );
  }

  // Full banner
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CookieIcon size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Shield size={14} className="text-green-600" />
                Cookie Consent
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                We use cookies to enhance your experience and serve personalized advertisements through Ezoic. 
                Your consent helps us provide relevant job recommendations and improve our services. 
                You can manage your preferences anytime.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCustomize}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Learn More
            </button>
            <button
              onClick={handleReject}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner;