"use client";

import React from 'react';
import { Bell, Mail } from 'lucide-react';
import { theme } from '@/lib/theme';

interface NotificationsTabProps {
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  onNotificationToggle: (enabled: boolean) => void;
  onEmailToggle: (enabled: boolean) => void;
}

export default function NotificationsTab({
  notificationsEnabled,
  emailUpdates,
  onNotificationToggle,
  onEmailToggle,
}: NotificationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Bell size={20} style={{ color: theme.colors.accent.blue }} />
            <div>
              <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-xs text-gray-600">Get notified about new job matches</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => onNotificationToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Mail size={20} style={{ color: theme.colors.accent.gold }} />
            <div>
              <h3 className="font-semibold text-gray-900">Email Updates</h3>
              <p className="text-xs text-gray-600">Receive weekly job digest via email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailUpdates}
              onChange={(e) => onEmailToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}



