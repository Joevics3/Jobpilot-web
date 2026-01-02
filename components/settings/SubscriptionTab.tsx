"use client";

import React from 'react';
import { Crown } from 'lucide-react';
import { theme } from '@/lib/theme';

interface SubscriptionData {
  plan_type: string;
  monthly_application_limit: number;
  applications_used_this_month: number;
  monthly_reset_date: string;
  is_active: boolean;
}

interface SubscriptionTabProps {
  subscriptionData: SubscriptionData | null;
}

export default function SubscriptionTab({ subscriptionData }: SubscriptionTabProps) {
  return (
    <div className="space-y-6">
      {subscriptionData ? (
        <>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Current Plan</h2>
            <div className="p-4 rounded-lg border-2" style={{ borderColor: theme.colors.primary.DEFAULT, backgroundColor: theme.colors.primary.light + '10' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold" style={{ color: theme.colors.primary.DEFAULT }}>
                  {subscriptionData.plan_type}
                </span>
                <Crown size={24} style={{ color: theme.colors.primary.DEFAULT }} />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {subscriptionData.monthly_application_limit} applications per month
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Applications Used</span>
                  <span className="font-semibold text-gray-900">
                    {subscriptionData.applications_used_this_month} / {subscriptionData.monthly_application_limit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(subscriptionData.applications_used_this_month / subscriptionData.monthly_application_limit) * 100}%`,
                      backgroundColor: theme.colors.primary.DEFAULT,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Resets on {new Date(subscriptionData.monthly_reset_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Upgrade Plan</h2>
            <div className="space-y-3">
              {['Pro', 'Max', 'Elite'].map((plan) => {
                if (plan === subscriptionData.plan_type) return null;
                const limits: Record<string, { limit: number; price: number }> = {
                  Pro: { limit: 15, price: 3000 },
                  Max: { limit: 30, price: 5000 },
                  Elite: { limit: 90, price: 10000 },
                };
                const planInfo = limits[plan];
                return (
                  <div
                    key={plan}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan}</h3>
                        <p className="text-sm text-gray-600">
                          {planInfo.limit} applications/month - ₦{planInfo.price.toLocaleString()}
                        </p>
                      </div>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                        onClick={() => alert('Upgrade functionality coming soon!')}
                      >
                        Upgrade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-center py-8">
            <Crown size={48} className="mx-auto mb-4" style={{ color: theme.colors.primary.DEFAULT }} />
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Upgrade to Premium</h2>
            <p className="text-gray-600 mb-6">
              Unlock automatic job applications with AI-generated CV and cover letter
            </p>
            <div className="space-y-3 mb-6">
              {[
                { name: 'Pro', limit: 15, price: 3000 },
                { name: 'Max', limit: 30, price: 5000 },
                { name: 'Elite', limit: 90, price: 10000 },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="p-4 border-2 rounded-lg"
                  style={{ borderColor: theme.colors.primary.DEFAULT }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">
                        {plan.limit} applications/month - ₦{plan.price.toLocaleString()}
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ backgroundColor: theme.colors.primary.DEFAULT }}
                      onClick={() => alert('Subscription purchase coming soon!')}
                    >
                      Subscribe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



