"use client";

import React, { useState, useEffect } from 'react';
import { X, Cookie as CookieIcon } from 'lucide-react';

const CookieModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const checkCookieConsent = () => {
      const hasAccepted = localStorage.getItem('cookieAccepted');
      if (!hasAccepted) {
        setIsVisible(true);
      }
    };

    // Wait 5 seconds before checking cookie consent
    const timer = setTimeout(checkCookieConsent, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Store acceptance in localStorage
    localStorage.setItem('cookieAccepted', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* Cookie Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
          <CookieIcon size={32} className="text-blue-600" />
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cookie Notice</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We use cookies to enhance your experience and improve our services. 
            Your consent helps us provide relevant content and features. 
            You can manage your preferences anytime. View our 
            <a href="/privacy-policy" className="text-blue-600 hover:text-blue-800 underline ml-1">
              Privacy Policy
            </a>
            for more details.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

export default CookieModal;