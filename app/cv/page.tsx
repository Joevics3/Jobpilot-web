"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, FileText, Edit, Download, Share2, Trash2 } from 'lucide-react';
import { theme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';
import BannerAd from '@/components/ads/BannerAd';

interface CVDocument {
  id: string;
  name: string;
  type: 'cv' | 'cover-letter';
  template_id: string;
  structured_data: any;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function CVListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<CVDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cv' | 'cover-letter'>('cv');
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);

  // Read tab from URL parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'cv' || tabParam === 'cover-letter') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
    loadDocuments();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    } else {
      setLoading(false);
    }
  };

  const loadDocuments = () => {
    try {
      setLoading(true);
      const existingDocs = localStorage.getItem('cv_documents');
      if (existingDocs) {
        const docs = JSON.parse(existingDocs);
        const filtered = docs.filter((doc: any) => doc.type === activeTab);
        setDocuments(filtered);
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const existingDocs = localStorage.getItem('cv_documents');
      if (existingDocs) {
        const docs = JSON.parse(existingDocs);
        const filtered = docs.filter((doc: any) => doc.id !== id);
        localStorage.setItem('cv_documents', JSON.stringify(filtered));
        loadDocuments();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleCVComplete = (cvId: string) => {
    loadDocuments();
    router.push(`/cv/view/${cvId}`);
  };

  const handleCoverLetterComplete = (coverLetterId: string) => {
    loadDocuments();
    router.push(`/cv/view/${coverLetterId}`);
  };

  const filteredDocuments = documents.filter(doc => doc.type === activeTab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.light} 100%)`,
        }}
      >
        <h1 className="text-3xl font-bold mb-2 text-white">CV & Cover Letters</h1>
        <p className="text-white/80">Manage your professional documents</p>
      </div>

      {/* Banner Ad - Below header, above tabs */}
      <div className="px-6 py-3">
        <BannerAd />
      </div>

      {/* Tabs */}
      <div className="px-6 mt-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('cv')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cv'
              ? 'border-b-2 text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: activeTab === 'cv' ? theme.colors.primary.DEFAULT : 'transparent',
            color: activeTab === 'cv' ? theme.colors.primary.DEFAULT : undefined,
          }}
        >
          CVs
        </button>
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cover-letter'
              ? 'border-b-2 text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: activeTab === 'cover-letter' ? theme.colors.primary.DEFAULT : 'transparent',
            color: activeTab === 'cover-letter' ? theme.colors.primary.DEFAULT : undefined,
          }}
        >
          Cover Letters
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeTab === 'cv' ? 'CVs' : 'cover letters'} yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first {activeTab === 'cv' ? 'CV' : 'cover letter'} to get started
            </p>
            <Button
              onClick={() => activeTab === 'cv' ? setCvModalOpen(true) : setCoverLetterModalOpen(true)}
              style={{ backgroundColor: theme.colors.primary.DEFAULT }}
            >
              <Plus size={16} className="mr-2" />
              Create {activeTab === 'cv' ? 'CV' : 'Cover Letter'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc, index) => (
              <React.Fragment key={doc.id}>
                <div
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.name}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/cv/view/${doc.id}`)}
                      className="flex-1"
                    >
                      <Edit size={14} className="mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download size={14} className="mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                {/* Banner Ad - After 2nd row (6 items on desktop, 2 on tablet, 2 on mobile) */}
                {index === 5 && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 my-4">
                    <BannerAd 
                      mobileHeight={100}
                      mobileWidth={320}
                      desktopHeight={250}
                      desktopWidth={300}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Create Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-20 left-0 right-0 px-6 pb-4 sm:hidden">
          <Button
            onClick={() => activeTab === 'cv' ? setCvModalOpen(true) : setCoverLetterModalOpen(true)}
            className="w-full shadow-lg"
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            <Plus size={20} className="mr-2" />
            Create {activeTab === 'cv' ? 'CV' : 'Cover Letter'}
          </Button>
        </div>

        {/* Desktop Create Button */}
        <div className="hidden sm:block mt-6">
          <Button
            onClick={() => activeTab === 'cv' ? setCvModalOpen(true) : setCoverLetterModalOpen(true)}
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            <Plus size={16} className="mr-2" />
            Create {activeTab === 'cv' ? 'CV' : 'Cover Letter'}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateCVModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        onComplete={handleCVComplete}
      />
      <CreateCoverLetterModal
        isOpen={coverLetterModalOpen}
        onClose={() => setCoverLetterModalOpen(false)}
        onComplete={handleCoverLetterComplete}
      />
    </div>
  );
}


