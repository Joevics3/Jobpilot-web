"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Bell, LogOut, ChevronRight, Mail, Shield, HelpCircle, LogIn } from 'lucide-react';
import { theme } from '@/lib/theme';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/AuthModal';

interface ProfileData {
  full_name: string | null;
  email: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadSettings();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        setLoading(false);
        return; // Don't redirect, just show sign in bar
      }
      setUser(authUser);
      setLoading(false);
    } catch (error) {
      console.error('Error in checkAuth:', error);
      setLoading(false);
    }
  };

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      setProfileData({
        full_name: data?.full_name || null,
        email: data?.email || user.email || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadSettings = () => {
    if (typeof window === 'undefined' || !user) return;

    try {
      const notificationsKey = `notificationsEnabled:${user.id}`;
      const notifications = localStorage.getItem(notificationsKey);
      const emailPrefs = localStorage.getItem('emailUpdatesEnabled');

      if (notifications !== null) {
        setNotificationsEnabled(JSON.parse(notifications));
      }

      if (emailPrefs !== null) {
        setEmailUpdates(JSON.parse(emailPrefs));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (typeof window === 'undefined') return;

    try {
      setNotificationsEnabled(enabled);
      const userId = user?.id || 'anonymous';
      const notificationsKey = `notificationsEnabled:${userId}`;
      localStorage.setItem(notificationsKey, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving notification setting:', error);
    }
  };

  const handleEmailToggle = async (enabled: boolean) => {
    if (typeof window === 'undefined') return;

    try {
      setEmailUpdates(enabled);
      localStorage.setItem('emailUpdatesEnabled', JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving email setting:', error);
    }
  };

  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfileData(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profileData) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          email: profileData.email,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      // Also update auth email if it changed
      if (profileData.email !== user.email) {
        const { error: updateError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        if (updateError) {
          console.error('Error updating auth email:', updateError);
        }
      }

      setShowProfileEdit(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert('Failed to update profile: ' + (error.message || 'Unknown error'));
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.muted }}>
        <p style={{ color: theme.colors.text.secondary }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{
          backgroundColor: theme.colors.primary.DEFAULT,
        }}
      >
        <h1 className="text-xl font-bold mb-2 text-white">Settings</h1>
        <p className="text-sm text-white/80">Manage your account and preferences</p>
      </div>

      <div className="px-6 pt-5 pb-32 max-w-4xl mx-auto">
        {/* Profile Card - Only show when signed in */}
        {user ? (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div
                className="w-15 h-15 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  width: '60px',
                  height: '60px',
                  backgroundColor: theme.colors.primary.DEFAULT 
                }}
              >
                <span className="text-lg font-bold text-white">
                  {getInitials(profileData?.full_name || null)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold mb-1 text-gray-900">
                  {profileData?.full_name || 'Profile'}
                </h3>
                {profileData?.email && (
                  <p className="text-sm text-gray-600 truncate">
                    {profileData.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowProfileEdit(!showProfileEdit)}
              className="px-4 py-2 rounded-lg border text-sm font-semibold transition-colors"
              style={{
                backgroundColor: theme.colors.primary.light + '20',
                borderColor: theme.colors.primary.DEFAULT,
                color: theme.colors.primary.DEFAULT,
              }}
            >
              {showProfileEdit ? 'Cancel' : 'Edit'}
            </button>
          </div>
        ) : (
          /* Sign In Bar - Show when not signed in - Same as homepage */
          <div
            className="mb-6 border-b"
            style={{
              backgroundColor: theme.colors.primary.DEFAULT + '10',
              borderColor: theme.colors.border.DEFAULT,
            }}
          >
            <div className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm font-medium flex-1" style={{ color: theme.colors.primary.DEFAULT }}>
                Sign up to access your settings and personalized features.
              </span>
              <Button
                onClick={() => setAuthModalOpen(true)}
                size="sm"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                className="flex-shrink-0"
              >
                <LogIn size={16} className="mr-2" />
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* Profile Edit Form - Only show when editing */}
        {user && showProfileEdit && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileData?.full_name || ''}
                  onChange={(e) => {
                    if (profileData) {
                      setProfileData({ ...profileData, full_name: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileData?.email || ''}
                  onChange={(e) => {
                    if (profileData) {
                      setProfileData({ ...profileData, email: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="w-full px-4 py-3 rounded-lg font-semibold text-sm text-white"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-2 px-1 text-gray-700">Notifications</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent.blue + '15' }}
                >
                  <Bell size={20} style={{ color: theme.colors.accent.blue }} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Push Notifications</h3>
                  <p className="text-xs text-gray-600">Get notified about new job matches</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent.gold + '15' }}
                >
                  <Mail size={20} style={{ color: theme.colors.accent.gold }} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">Email Updates</h3>
                  <p className="text-xs text-gray-600">Receive weekly job digest via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailUpdates}
                  onChange={(e) => handleEmailToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-2 px-1 text-gray-700">Support</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Link
              href="/privacy-policy"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.text.secondary + '15' }}
                >
                  <Shield size={20} style={{ color: theme.colors.text.secondary }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
                  <p className="text-xs text-gray-600">Learn how we protect your data</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
            <Link
              href="/terms-of-service"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: theme.colors.text.secondary + '15' }}
                >
                  <HelpCircle size={20} style={{ color: theme.colors.text.secondary }} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Terms of Service</h3>
                  <p className="text-xs text-gray-600">Read our terms and conditions</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Account Section - Only show when signed in */}
        {user && (
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-2 px-1 text-gray-700">Account</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={20} style={{ color: theme.colors.error }} />
                  <div className="text-left">
                    <h3 className="font-semibold" style={{ color: theme.colors.error }}>Sign Out</h3>
                    <p className="text-xs text-gray-600">Sign out of your account</p>
                  </div>
                </div>
                <ChevronRight size={20} style={{ color: theme.colors.error }} />
              </button>
            </div>
          </div>
        )}

        {/* App Info */}
        <div className="text-center py-8">
          <p className="text-xs text-gray-500 font-medium mb-1">JobPilot v1.0.0</p>
          <p className="text-xs text-gray-400">Your smart career companion</p>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />
    </div>
  );
}
