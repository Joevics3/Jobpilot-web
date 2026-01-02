"use client";

import React from 'react';
import { FileCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { theme } from '@/lib/theme';

interface ApplicationsTabProps {
  applications: any[];
  applicationsLoading: boolean;
}

export default function ApplicationsTab({ applications, applicationsLoading }: ApplicationsTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'failed':
        return <XCircle size={20} className="text-red-600" />;
      case 'processing':
      case 'retrying':
        return <Clock size={20} className="text-yellow-600" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'processing':
      case 'retrying':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Job Applications</h2>
          {applicationsLoading ? (
            <div className="py-8 text-center">
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="py-8 text-center">
              <FileCheck size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">No applications yet</p>
              <p className="text-sm text-gray-500">Your job applications will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app: any) => (
                <div
                  key={app.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {app.jobs?.title || 'Unknown Job'}
                      </h3>
                      {app.jobs?.company && (
                        <p className="text-sm text-gray-600 mb-2">{app.jobs.company}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Method: {app.application_method}</span>
                        {app.sent_at && (
                          <span>
                            Sent: {new Date(app.sent_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {app.error_message && (
                        <p className="text-xs text-red-600 mt-2">{app.error_message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(app.application_status)}
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(app.application_status)}`}>
                        {app.application_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



