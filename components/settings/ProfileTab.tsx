"use client";

import React from 'react';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

interface ProfileData {
  full_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
}

interface ProfileTabProps {
  user: any;
  profileData: ProfileData | null;
  setProfileData: (data: ProfileData) => void;
}

export default function ProfileTab({ user, profileData, setProfileData }: ProfileTabProps) {
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            <span className="text-xl font-bold text-white">
              {getInitials(profileData?.full_name || null)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1 text-gray-900">
              {profileData?.full_name || 'Profile'}
            </h3>
            {profileData?.email && (
              <p className="text-sm text-gray-600">
                {profileData.email}
              </p>
            )}
          </div>
        </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profileData?.email || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={profileData?.phone || ''}
              onChange={(e) => {
                if (profileData) {
                  setProfileData({ ...profileData, phone: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter your phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={profileData?.location || ''}
              onChange={(e) => {
                if (profileData) {
                  setProfileData({ ...profileData, location: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter your location"
            />
          </div>
          <button
            onClick={async () => {
              if (!user || !profileData) return;
              try {
                const { error } = await supabase
                  .from('profiles')
                  .upsert({
                    id: user.id,
                    full_name: profileData.full_name,
                    phone: profileData.phone,
                    location: profileData.location,
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'id',
                  });
                if (error) throw error;
                alert('Profile updated successfully!');
              } catch (error: any) {
                alert('Failed to update profile: ' + (error.message || 'Unknown error'));
              }
            }}
            className="w-full px-4 py-3 rounded-lg font-semibold text-sm text-white"
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}



