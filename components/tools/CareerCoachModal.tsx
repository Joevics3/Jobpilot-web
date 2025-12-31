'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, Target } from 'lucide-react';
import { CareerCoachService } from '@/lib/services/careerCoachService';
import { supabase } from '@/lib/supabase';

interface CareerCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CareerCoachModal({ isOpen, onClose }: CareerCoachModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [hasExistingAnalysis, setHasExistingAnalysis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      checkForExistingAnalysis();
    }
  }, [isOpen, user]);

  const checkForExistingAnalysis = async () => {
    try {
      // Check if user has cached analysis
      const history = CareerCoachService.getHistory();
      if (history.length > 0) {
        setHasExistingAnalysis(true);
      } else {
        setHasExistingAnalysis(false);
        // No existing analysis, load onboarding data for generation
        loadOnboardingData();
      }
    } catch (error) {
      console.error('Error checking for existing analysis:', error);
      setHasExistingAnalysis(false);
      loadOnboardingData();
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setError('Please log in to use Career Coach');
      }
    } catch (err: any) {
      console.error('Error checking auth:', err);
      setError('Failed to verify authentication');
    }
  };

  const loadOnboardingData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading onboarding data:', error);
        setError('Please complete your profile setup first');
        return;
      }

      setOnboardingData(data);
    } catch (err: any) {
      console.error('Error loading onboarding data:', err);
      setError('Failed to load profile data');
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      setError('Please log in to use Career Coach');
      return;
    }

    if (!onboardingData) {
      setError('Please complete your profile setup first to use Career Coach');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await CareerCoachService.generateAnalysis(user.id, onboardingData);
      // Navigate to career page with the results
      router.push('/tools/career');
      onClose();
    } catch (err: any) {
      console.error('Error generating analysis:', err);
      setError(err.message || 'Failed to generate career analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Career Coach</h2>
            <p className="text-sm text-gray-600 mt-1">Personalized career guidance and insights</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md w-full">
              <Target size={64} className="mx-auto text-purple-600 mb-4" />
              
              {hasExistingAnalysis ? (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">View Your Career Analysis</h3>
                  <p className="text-gray-600 mb-6">
                    You already have a career analysis. View your existing analysis or generate a new one.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        router.push('/tools/career');
                        onClose();
                      }}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Target size={20} />
                      View Existing Analysis
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg font-medium hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Analyzing your profile...
                        </>
                      ) : (
                        <>
                          Generate New Analysis
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Get Your Career Analysis</h3>
                  <p className="text-gray-600 mb-6">
                    Our AI career coach will analyze your profile and provide personalized career paths, skill gaps, and insights.
                  </p>
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !onboardingData}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Analyzing your profile...
                      </>
                    ) : (
                      <>
                        <Target size={20} />
                        Generate Career Analysis
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}