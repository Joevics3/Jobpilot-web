"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Bell, Mail, Shield, HelpCircle, LogOut, ChevronRight, Edit } from 'lucide-react';
import { theme } from '@/lib/theme';
import { Switch } from '@/components/ui/switch';
import EditProfileModal from '@/components/settings/EditProfileModal';

interface ProfileData {
  full_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user);
  };

  const loadProfileData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone, location')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      setProfileData({
        full_name: data?.full_name || null,
        email: data?.email || user.email || '',
        phone: data?.phone || null,
        location: data?.location || null,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    if (typeof window === 'undefined') return;

    try {
      const notificationsKey = `notificationsEnabled:${user?.id || 'anonymous'}`;
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

      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const handleProfileUpdate = async () => {
    // Reload profile data after update
    await loadProfileData();
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const settingSections = [
    {
      title: 'Profile',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: User,
          color: theme.colors.primary.DEFAULT,
          onClick: () => setEditModalOpen(true),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get notified about new job matches',
          icon: Bell,
          color: theme.colors.accent.blue,
          toggle: true,
          value: notificationsEnabled,
          onToggle: handleNotificationToggle,
        },
        {
          id: 'email',
          title: 'Email Updates',
          subtitle: 'Receive weekly job digest via email',
          icon: Mail,
          color: theme.colors.accent.gold,
          toggle: true,
          value: emailUpdates,
          onToggle: handleEmailToggle,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'Learn how we protect your data',
          icon: Shield,
          color: theme.colors.text.secondary,
          onClick: () => alert('Privacy Policy - Coming soon'),
        },
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'Get help or contact support',
          icon: HelpCircle,
          color: theme.colors.text.secondary,
          onClick: () => alert('Help & Support - Coming soon'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'logout',
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          icon: LogOut,
          color: theme.colors.error,
          destructive: true,
          onClick: handleSignOut,
        },
      ],
    },
  ];

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
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.dark} 100%)`,
        }}
      >
        <h1 className="text-2xl font-bold mb-2 text-white">Settings</h1>
        <p className="text-sm text-white/80">Manage your account and preferences</p>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 pb-32 max-w-4xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-xl p-4 sm:p-6 mb-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: theme.colors.primary.DEFAULT }}
              >
                <span className="text-xl font-bold text-white">
                  {getInitials(profileData?.full_name || null)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold mb-1 text-gray-900 truncate">
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
              onClick={() => setEditModalOpen(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm border flex items-center gap-2 transition-colors flex-shrink-0"
              style={{
                borderColor: theme.colors.primary.DEFAULT,
                color: theme.colors.primary.DEFAULT,
                backgroundColor: `${theme.colors.primary.DEFAULT}10`,
              }}
            >
              <Edit size={16} />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <h2 className="text-sm font-semibold mb-3 px-2 text-gray-700">
              {section.title}
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLast = itemIndex === section.items.length - 1;

                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`
                      w-full flex items-center justify-between p-4 transition-colors
                      ${!isLast ? 'border-b border-gray-100' : ''}
                      ${item.destructive ? 'hover:bg-red-50' : 'hover:bg-gray-50'}
                    `}
                    disabled={item.toggle}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon size={20} style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h3
                          className="text-sm font-semibold mb-0.5"
                          style={{
                            color: item.destructive ? theme.colors.error : theme.colors.text.primary,
                          }}
                        >
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    {item.toggle ? (
                      <Switch
                        checked={item.value}
                        onCheckedChange={item.onToggle}
                        className="flex-shrink-0"
                      />
                    ) : (
                      <ChevronRight
                        size={20}
                        className="flex-shrink-0"
                        style={{
                          color: item.destructive ? theme.colors.error : theme.colors.text.secondary,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* App Info */}
        <div className="text-center py-8">
          <p className="text-xs text-gray-500 font-medium mb-1">JobMeter v1.0.0</p>
          <p className="text-xs text-gray-400">Your smart career companion</p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profileData={profileData}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}

