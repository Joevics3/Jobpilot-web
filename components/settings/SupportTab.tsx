"use client";

import React from 'react';
import { Shield, HelpCircle, ChevronRight } from 'lucide-react';
import { theme } from '@/lib/theme';

export default function SupportTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => alert('Privacy Policy - Coming soon')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: theme.colors.text.secondary }} />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
              <p className="text-xs text-gray-600">Learn how we protect your data</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
        <button
          onClick={() => alert('Help & Support - Coming soon')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={20} style={{ color: theme.colors.text.secondary }} />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Help & Support</h3>
              <p className="text-xs text-gray-600">Get help or contact support</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}



